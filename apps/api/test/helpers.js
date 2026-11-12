require('./env');

const mongoose = require('mongoose');
const request = require('supertest');
const { createServer } = require('../server');
const User = require('../models/User');
const { signAuthToken } = require('../utils/tokens');

const TEST_URI = process.env.MONGO_URI;

async function setupTestDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 10_000 });
  }
  await resetDb();
}

async function teardownTestDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

async function resetDb() {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

function createApp() {
  return createServer().app;
}

async function createTestUser(overrides = {}) {
  const password = overrides.password || 'TestPassword123!';
  const user = await User.create({
    name: overrides.name || 'Test User',
    email: overrides.email || `user-${crypto.randomUUID()}@example.com`,
    password,
    role: overrides.role || 'user',
    isVerified: overrides.isVerified ?? true,
    ...overrides,
  });
  return { user, password, token: signAuthToken(user) };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = {
  request,
  setupTestDb,
  teardownTestDb,
  resetDb,
  createApp,
  createTestUser,
  authHeader,
  User,
};
