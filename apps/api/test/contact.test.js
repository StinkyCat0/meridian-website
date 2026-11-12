const test = require('node:test');
const { before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const {
  setupTestDb,
  teardownTestDb,
  resetDb,
  createApp,
  createTestUser,
  authHeader,
  request,
} = require('./helpers');
const Message = require('../models/Message');

let app;
let previousEmailEnabled;
let previousCrmUrl;
let previousCrmSecret;

before(async () => {
  await setupTestDb();
  app = createApp();

  previousEmailEnabled = process.env.EMAIL_ENABLED;
  previousCrmUrl = process.env.CRM_INTAKE_URL;
  previousCrmSecret = process.env.CRM_INTAKE_SECRET;

  process.env.EMAIL_ENABLED = 'false';
  delete process.env.CRM_INTAKE_URL;
  delete process.env.CRM_INTAKE_SECRET;
});

beforeEach(async () => {
  await resetDb();
});

after(async () => {
  if (previousEmailEnabled === undefined) delete process.env.EMAIL_ENABLED;
  else process.env.EMAIL_ENABLED = previousEmailEnabled;

  if (previousCrmUrl === undefined) delete process.env.CRM_INTAKE_URL;
  else process.env.CRM_INTAKE_URL = previousCrmUrl;

  if (previousCrmSecret === undefined) delete process.env.CRM_INTAKE_SECRET;
  else process.env.CRM_INTAKE_SECRET = previousCrmSecret;

  await teardownTestDb();
});

test('a valid contact submission is stored and returns 201 when email and CRM are disabled', async () => {
  const res = await request(app).post('/api/contact').send({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    subject: 'Hello',
    message: 'I would like to work with you.',
  });

  assert.equal(res.status, 201);
  assert.ok(res.body.message);
  assert.ok(res.body.id);

  const stored = await Message.findById(res.body.id);
  assert.ok(stored);
  assert.equal(stored.name, 'Ada Lovelace');
  assert.equal(stored.email, 'ada@example.com');
  assert.equal(stored.message, 'I would like to work with you.');
  assert.equal(stored.status, 'new');
});

test('an invalid email is rejected without storing anything', async () => {
  const res = await request(app).post('/api/contact').send({
    name: 'Bad Email',
    email: 'not-an-email',
    message: 'Hello',
  });

  assert.equal(res.status, 400);
  assert.ok(res.body.message);
  assert.equal(await Message.countDocuments(), 0);
});

test('the contact inbox is admin-only', async () => {
  await request(app).post('/api/contact').send({
    name: 'Ada',
    email: 'ada@example.com',
    message: 'Hello',
  });

  const user = await createTestUser({ name: 'Member' });
  const admin = await createTestUser({ name: 'Admin', role: 'admin' });

  const anonymous = await request(app).get('/api/messages');
  assert.equal(anonymous.status, 401);

  const denied = await request(app).get('/api/messages').set(authHeader(user.token));
  assert.equal(denied.status, 403);

  const allowed = await request(app).get('/api/messages').set(authHeader(admin.token));
  assert.equal(allowed.status, 200);
  assert.equal(allowed.body.length, 1);
  assert.equal(allowed.body[0].email, 'ada@example.com');
});

test('admin updates the contact message status and validates input', async () => {
  const contact = await request(app).post('/api/contact').send({
    name: 'Ada',
    email: 'ada@example.com',
    message: 'Hello',
  });

  const admin = await createTestUser({ name: 'Admin', role: 'admin' });

  const invalid = await request(app)
    .put(`/api/messages/${contact.body.id}`)
    .set(authHeader(admin.token))
    .send({ status: 'pending' });
  assert.equal(invalid.status, 400);

  const updated = await request(app)
    .put(`/api/messages/${contact.body.id}`)
    .set(authHeader(admin.token))
    .send({ status: 'archived' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.status, 'archived');

  const missing = await request(app)
    .put(`/api/messages/${new mongoose.Types.ObjectId()}`)
    .set(authHeader(admin.token))
    .send({ status: 'read' });
  assert.equal(missing.status, 404);

  const filtered = await request(app)
    .get('/api/messages?status=archived')
    .set(authHeader(admin.token));
  assert.equal(filtered.status, 200);
  assert.equal(filtered.body.length, 1);
});
