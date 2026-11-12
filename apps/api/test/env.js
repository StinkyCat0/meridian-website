// Test environment. The suite drops its database, so it must never be pointed
// at a non-test database by inheriting MONGO_URI from a developer shell.
const TEST_URI =
  process.env.TEST_MONGO_URI ||
  'mongodb://127.0.0.1:27017/meridian_website_test';

if (!/\/[^/?]+_test(?:[?#]|$)/.test(TEST_URI)) {
  throw new Error(
    'Refusing to run tests: TEST_MONGO_URI must name a database ending in _test',
  );
}

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-that-is-long-enough-for-hs256-signing';
process.env.MONGO_URI = TEST_URI;
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.EMAIL_ENABLED = 'false';
process.env.RATE_LIMIT_DISABLED = 'true';
process.env.REQUIRE_EMAIL_VERIFICATION = 'false';
