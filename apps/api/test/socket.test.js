const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { io } = require('socket.io-client');
const { setupTestDb, teardownTestDb, createTestUser } = require('./helpers');
const { createServer } = require('../server');

let app;
let server;
let port;
const sockets = [];

test.before(async () => {
  await setupTestDb();
  const created = createServer();
  app = created.app;
  server = created.server;
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
});

test.after(async () => {
  for (const socket of sockets) socket.close();
  await new Promise((resolve) => server.close(resolve));
  await teardownTestDb();
});

function connect(token) {
  return new Promise((resolve, reject) => {
    const socket = io(`http://127.0.0.1:${port}`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
      timeout: 2000,
    });
    sockets.push(socket);
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });
}

test('rejects a socket without a token', async () => {
  await assert.rejects(connect(undefined));
});

test('rejects an invalid token', async () => {
  await assert.rejects(connect('not-a-jwt'));
});

test('rejects an inactive account', async () => {
  const { token } = await createTestUser({ isActive: false });
  await assert.rejects(connect(token));
});

test('rejects an account without chat access', async () => {
  const { token } = await createTestUser({
    access: { canLogin: true, canAccessChat: false },
  });
  await assert.rejects(connect(token));
});

test('accepts a verified user and survives null typing payloads', async () => {
  const { token } = await createTestUser();
  const socket = await connect(token);

  socket.emit('typing:start', null);
  socket.emit('typing:stop', null);
  socket.emit('room:join', null);
  await new Promise((resolve) => setTimeout(resolve, 100));

  const health = await request(app).get('/api/health');
  assert.equal(health.status, 200);
  assert.equal(socket.connected, true);
});
