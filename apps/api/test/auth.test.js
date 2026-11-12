// apps/api/test/auth.test.js - Auth route and model coverage.
process.env.BCRYPT_ROUNDS = '10';

const test = require('node:test');
const { before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');

const {
  request,
  setupTestDb,
  teardownTestDb,
  resetDb,
  createApp,
  createTestUser,
  authHeader,
  User,
} = require('./helpers');
const { hashToken, verifyAuthToken } = require('../utils/tokens');

let app;

before(async () => {
  await setupTestDb();
  app = createApp();
});

beforeEach(async () => {
  await resetDb();
});

after(async () => {
  await teardownTestDb();
});

test('register creates a customer account and cannot self-assign admin', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'New Customer',
    email: 'New.Customer@Example.com',
    password: 'Password123!',
    role: 'admin',
    isVerified: true,
    access: { canAccessCrm: true },
    unknownField: 'ignored',
  });

  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.requiresVerification, true);
  assert.equal(res.body.user.role, 'user');
  assert.equal(res.body.user.email, 'new.customer@example.com');
  assert.equal(res.body.user.isVerified, false);
  assert.equal(res.body.user.access.canAccessCrm, false);
  assert.equal(res.body.user.password, undefined);

  const stored = await User.findOne({ email: 'new.customer@example.com' }).select('+password');
  assert.ok(stored);
  assert.equal(stored.role, 'user');
  assert.equal(stored.isVerified, false);
  assert.equal(stored.access.canAccessCrm, false);
  assert.equal(stored.unknownField, undefined);
  assert.ok(stored.verificationToken);
  assert.ok(stored.verificationTokenExpires > new Date());
  assert.ok(await stored.matchPassword('Password123!'));

  const decoded = verifyAuthToken(res.body.token);
  assert.equal(decoded.user.role, 'user');
  assert.equal(decoded.user.email, 'new.customer@example.com');
  assert.equal(decoded.user.crmAccess, false);
  assert.equal(decoded.aud, 'meridian-crm');
  assert.equal(decoded.iss, 'meridian-website');
});

test('register rejects a duplicate email', async () => {
  await createTestUser({ email: 'dupe@example.com', password: 'Password123!' });

  const res = await request(app).post('/api/auth/register').send({
    name: 'Second Customer',
    email: 'DUPE@example.com',
    password: 'Password123!',
  });

  assert.equal(res.status, 400);
  assert.match(res.body.message, /already registered/i);
  assert.equal(await User.countDocuments({ email: 'dupe@example.com' }), 1);
});

test('register validates required fields and password length', async () => {
  const missing = await request(app)
    .post('/api/auth/register')
    .send({ email: 'nope@example.com' });
  assert.equal(missing.status, 400);

  const shortPassword = await request(app).post('/api/auth/register').send({
    name: 'Short Password',
    email: 'short@example.com',
    password: 'short',
  });
  assert.equal(shortPassword.status, 400);
  assert.equal(await User.countDocuments({ email: 'short@example.com' }), 0);
});

test('login is blocked for unverified users when verification is required', async () => {
  process.env.REQUIRE_EMAIL_VERIFICATION = 'true';
  try {
    await createTestUser({
      email: 'unverified@example.com',
      password: 'Password123!',
      isVerified: false,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unverified@example.com', password: 'Password123!' });

    assert.equal(res.status, 403);
    assert.equal(res.body.requiresVerification, true);
    assert.equal(res.body.token, undefined);
  } finally {
    process.env.REQUIRE_EMAIL_VERIFICATION = 'false';
  }
});

test('login succeeds for a verified user and /me returns the public profile', async () => {
  const { user } = await createTestUser({
    email: 'verified@example.com',
    password: 'Password123!',
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'VERIFIED@example.com', password: 'Password123!' });

  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.user.id, String(user._id));
  assert.equal(res.body.user.email, 'verified@example.com');
  assert.equal(res.body.user.password, undefined);

  const me = await request(app).get('/api/auth/me').set(authHeader(res.body.token));
  assert.equal(me.status, 200);
  assert.equal(me.body.id, String(user._id));
  assert.equal(me.body.email, 'verified@example.com');
  assert.equal(me.body.role, 'user');
  assert.ok(me.body.lastLogin);
  assert.equal(me.body.password, undefined);
  assert.equal(me.body.verificationToken, undefined);

  const stored = await User.findOne({ email: 'verified@example.com' });
  assert.ok(stored.lastLogin);
  assert.equal(stored.loginAttempts, 0);
});

test('unknown email returns the same generic login error', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'missing@example.com', password: 'Password123!' });

  assert.equal(res.status, 401);
  assert.equal(res.body.message, 'Invalid email or password');
});

test('wrong passwords increment attempts and lock at the configured threshold', async () => {
  const previousMax = process.env.MAX_LOGIN_ATTEMPTS;
  const previousLock = process.env.LOCKOUT_DURATION_MS;
  process.env.MAX_LOGIN_ATTEMPTS = '2';
  process.env.LOCKOUT_DURATION_MS = '60000';

  try {
    await createTestUser({ email: 'lockme@example.com', password: 'Password123!' });

    const attempt = (password) =>
      request(app)
        .post('/api/auth/login')
        .send({ email: 'lockme@example.com', password });

    let res = await attempt('WrongPassword1!');
    assert.equal(res.status, 401);
    let stored = await User.findOne({ email: 'lockme@example.com' });
    assert.equal(stored.loginAttempts, 1);
    assert.equal(stored.lockUntil, undefined);

    res = await attempt('WrongPassword2!');
    assert.equal(res.status, 401);
    stored = await User.findOne({ email: 'lockme@example.com' });
    assert.equal(stored.loginAttempts, 2);
    assert.ok(stored.lockUntil.getTime() > Date.now());

    // Even the correct password is rejected while locked.
    res = await attempt('Password123!');
    assert.equal(res.status, 429);
    assert.match(res.body.message, /locked/i);
  } finally {
    process.env.MAX_LOGIN_ATTEMPTS = previousMax ?? '';
    process.env.LOCKOUT_DURATION_MS = previousLock ?? '';
    if (previousMax === undefined) delete process.env.MAX_LOGIN_ATTEMPTS;
    if (previousLock === undefined) delete process.env.LOCKOUT_DURATION_MS;
  }
});

test('verify-email consumes the hashed token and returns JSON', async () => {
  const { user } = await createTestUser({
    email: 'verify@example.com',
    isVerified: false,
  });

  const rawToken = user.generateVerificationToken();
  await user.save();

  let stored = await User.findOne({ email: 'verify@example.com' });
  assert.equal(stored.verificationToken, hashToken(rawToken));
  assert.notEqual(stored.verificationToken, rawToken);

  const res = await request(app)
    .get('/api/auth/verify-email')
    .query({ token: rawToken, email: 'verify@example.com' })
    .set('Accept', 'application/json');

  assert.equal(res.status, 200);
  assert.equal(res.body.verified, true);
  assert.equal(res.body.message, 'Email verified successfully');

  stored = await User.findOne({ email: 'verify@example.com' });
  assert.equal(stored.isVerified, true);
  assert.equal(stored.verificationToken, undefined);
  assert.equal(stored.verificationTokenExpires, undefined);
});

test('verify-email rejects an invalid token', async () => {
  await createTestUser({ email: 'badverify@example.com', isVerified: false });

  const res = await request(app)
    .get('/api/auth/verify-email')
    .query({ token: 'not-a-real-token', email: 'badverify@example.com' })
    .set('Accept', 'application/json');

  assert.equal(res.status, 400);
  assert.match(res.body.message, /invalid or expired/i);
});

test('forgot-password is generic and reset-password sets a new password', async () => {
  await createTestUser({ email: 'reset@example.com', password: 'Password123!' });

  const unknown = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'unknown@example.com' });
  assert.equal(unknown.status, 200);

  const forgot = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'reset@example.com' });
  assert.equal(forgot.status, 200);
  assert.equal(forgot.body.message, unknown.body.message);

  let stored = await User.findOne({ email: 'reset@example.com' });
  assert.ok(stored.resetPasswordToken);
  assert.ok(stored.resetPasswordExpires > new Date());

  const rawToken = stored.generateResetToken();
  await stored.save();

  const badReset = await request(app)
    .post('/api/auth/reset-password')
    .send({ token: 'wrong-token', email: 'reset@example.com', newPassword: 'NewPassword123!' });
  assert.equal(badReset.status, 400);

  const reset = await request(app)
    .post('/api/auth/reset-password')
    .send({
      token: rawToken,
      email: 'reset@example.com',
      newPassword: 'NewPassword123!',
    });
  assert.equal(reset.status, 200);

  stored = await User.findOne({ email: 'reset@example.com' }).select('+password');
  assert.equal(await stored.matchPassword('NewPassword123!'), true);
  assert.equal(stored.resetPasswordToken, undefined);
  assert.equal(stored.resetPasswordExpires, undefined);

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'reset@example.com', password: 'NewPassword123!' });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);
});

test('protected routes reject requests without a token', async () => {
  const res = await request(app).get('/api/auth/me');

  assert.equal(res.status, 401);
  assert.equal(res.body.message, 'Not authorized, no token');
  assert.equal(res.body.stack, undefined);
});

test('register token cannot access protected routes until the email is verified', async () => {
  process.env.REQUIRE_EMAIL_VERIFICATION = 'true';
  try {
    const registered = await request(app).post('/api/auth/register').send({
      name: 'Pending Customer',
      email: 'pending@example.com',
      password: 'Password123!',
    });

    assert.equal(registered.status, 201);
    assert.ok(registered.body.token);
    assert.equal(registered.body.user.isVerified, false);

    const me = await request(app)
      .get('/api/auth/me')
      .set(authHeader(registered.body.token));

    assert.equal(me.status, 403);
    assert.equal(me.body.message, 'Please verify your email before continuing');
  } finally {
    process.env.REQUIRE_EMAIL_VERIFICATION = 'false';
  }
});

test('login rejects a deactivated account after a valid password', async () => {
  await createTestUser({
    email: 'inactive@example.com',
    password: 'Password123!',
    isActive: false,
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'inactive@example.com', password: 'Password123!' });

  assert.equal(res.status, 403);
  assert.equal(res.body.message, 'Account is deactivated');
  assert.equal(res.body.token, undefined);

  const stored = await User.findOne({ email: 'inactive@example.com' });
  assert.equal(stored.loginAttempts, 0);
});

test('login rejects a non-admin whose login access is revoked', async () => {
  await createTestUser({
    email: 'restricted@example.com',
    password: 'Password123!',
    access: { canLogin: false },
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'restricted@example.com', password: 'Password123!' });

  assert.equal(res.status, 403);
  assert.equal(res.body.message, 'Account access restricted');
  assert.equal(res.body.token, undefined);
});

test('admins are exempt from the login access restriction', async () => {
  await createTestUser({
    email: 'admin-restricted@example.com',
    password: 'Password123!',
    role: 'admin',
    access: { canLogin: false },
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-restricted@example.com', password: 'Password123!' });

  assert.equal(res.status, 200);
  assert.ok(res.body.token);
});

test('concurrent failed logins still lock the account at the threshold', async () => {
  const previousMax = process.env.MAX_LOGIN_ATTEMPTS;
  const previousLock = process.env.LOCKOUT_DURATION_MS;
  process.env.MAX_LOGIN_ATTEMPTS = '5';
  process.env.LOCKOUT_DURATION_MS = '60000';

  try {
    await createTestUser({ email: 'race@example.com', password: 'Password123!' });

    const responses = await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        request(app)
          .post('/api/auth/login')
          .send({ email: 'race@example.com', password: `WrongPassword${index}!` }),
      ),
    );

    for (const res of responses) {
      assert.ok([401, 429].includes(res.status), `unexpected status ${res.status}`);
      assert.equal(res.body.token, undefined);
    }

    const stored = await User.findOne({ email: 'race@example.com' });
    assert.ok(stored.loginAttempts >= 5);
    assert.ok(stored.lockUntil);
    assert.ok(stored.lockUntil.getTime() > Date.now());

    const lockedOut = await request(app)
      .post('/api/auth/login')
      .send({ email: 'race@example.com', password: 'Password123!' });
    assert.equal(lockedOut.status, 429);
  } finally {
    if (previousMax === undefined) delete process.env.MAX_LOGIN_ATTEMPTS;
    else process.env.MAX_LOGIN_ATTEMPTS = previousMax;
    if (previousLock === undefined) delete process.env.LOCKOUT_DURATION_MS;
    else process.env.LOCKOUT_DURATION_MS = previousLock;
  }
});
