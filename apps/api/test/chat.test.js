const test = require('node:test');
const { before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const mongoose = require('mongoose');

const {
  setupTestDb,
  teardownTestDb,
  resetDb,
  createApp,
  createTestUser,
  authHeader,
  request,
  User,
} = require('./helpers');
const ChatMessage = require('../models/ChatMessage');

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

async function createRoom(adminToken, overrides = {}) {
  const res = await request(app)
    .post('/api/chat/rooms')
    .set(authHeader(adminToken))
    .send({ name: 'General', description: 'Main room', ...overrides });
  assert.equal(res.status, 201);
  return res.body;
}

async function postMessage(token, roomId, body) {
  return request(app)
    .post(`/api/chat/${roomId}/messages`)
    .set(authHeader(token))
    .send(body);
}

test('room creation requires admin', async () => {
  const user = await createTestUser({ name: 'Member' });

  const denied = await request(app)
    .post('/api/chat/rooms')
    .set(authHeader(user.token))
    .send({ name: 'Secret' });
  assert.equal(denied.status, 403);

  const anonymous = await request(app).post('/api/chat/rooms').send({ name: 'Secret' });
  assert.equal(anonymous.status, 401);
});

test('admin can create and list active rooms; archived rooms are hidden', async () => {
  const admin = await createTestUser({ name: 'Admin', role: 'admin' });

  const room = await createRoom(admin.token, { name: 'Announcements' });
  assert.ok(room.id);
  assert.equal(room.name, 'Announcements');
  assert.equal(room.__v, undefined);

  const second = await createRoom(admin.token, { name: 'Support' });

  const list = await request(app).get('/api/chat/rooms').set(authHeader(admin.token));
  assert.equal(list.status, 200);
  assert.deepEqual(
    list.body.map((entry) => entry.id),
    [room.id, second.id],
  );

  const archived = await request(app)
    .delete(`/api/chat/rooms/${room.id}`)
    .set(authHeader(admin.token));
  assert.equal(archived.status, 200);
  assert.ok(archived.body.message);

  const afterArchive = await request(app)
    .get('/api/chat/rooms')
    .set(authHeader(admin.token));
  assert.deepEqual(
    afterArchive.body.map((entry) => entry.id),
    [second.id],
  );
});

test('members can post messages but cannot spoof username or role', async () => {
  const admin = await createTestUser({ name: 'Admin', role: 'admin' });
  const user = await createTestUser({ name: 'Real Member' });
  const room = await createRoom(admin.token);

  const created = await postMessage(user.token, room.id, {
    content: 'Hello room',
    username: 'spoofed',
    role: 'admin',
  });

  assert.equal(created.status, 201);
  assert.ok(created.body._id);
  assert.equal(created.body.username, 'Real Member');
  assert.equal(String(created.body.userId), String(user.user._id));
  assert.equal(created.body.roomId, room.id);

  const list = await request(app)
    .get(`/api/chat/${room.id}/messages?includeReplies=true`)
    .set(authHeader(user.token));
  assert.equal(list.status, 200);
  assert.ok(Array.isArray(list.body));
  assert.equal(list.body.length, 1);
  assert.equal(list.body[0]._id, created.body._id);
  assert.equal(list.body[0].username, 'Real Member');
  assert.deepEqual(list.body[0].replies, []);
});

test('replies are nested under their parent instead of top level', async () => {
  const admin = await createTestUser({ name: 'Admin', role: 'admin' });
  const user = await createTestUser({ name: 'Member' });
  const room = await createRoom(admin.token);

  const parent = await postMessage(user.token, room.id, { content: 'Parent' });
  assert.equal(parent.status, 201);

  const reply = await request(app)
    .post(`/api/chat/messages/${parent.body._id}/reply`)
    .set(authHeader(user.token))
    .send({ content: 'Reply' });
  assert.equal(reply.status, 201);
  assert.equal(reply.body.parentId, parent.body._id);
  assert.equal(reply.body.roomId, room.id);

  const list = await request(app)
    .get(`/api/chat/${room.id}/messages`)
    .set(authHeader(user.token));
  assert.equal(list.status, 200);
  assert.equal(list.body.length, 1);
  assert.equal(list.body[0]._id, parent.body._id);
  assert.equal(list.body[0].replyCount, 1);
  assert.equal(list.body[0].replies.length, 1);
  assert.equal(list.body[0].replies[0]._id, reply.body._id);
});

test('a reaction toggles for the current user', async () => {
  const admin = await createTestUser({ name: 'Admin', role: 'admin' });
  const user = await createTestUser({ name: 'Member' });
  const room = await createRoom(admin.token);
  const message = await postMessage(user.token, room.id, { content: 'React to me' });

  const first = await request(app)
    .post(`/api/chat/messages/${message.body._id}/react`)
    .set(authHeader(user.token))
    .send({ emoji: '👍' });

  assert.equal(first.status, 200);
  assert.equal(first.body.reactions.length, 1);
  assert.equal(first.body.reactions[0].emoji, '👍');
  assert.deepEqual(
    first.body.reactions[0].userIds.map(String),
    [String(user.user._id)],
  );

  const second = await request(app)
    .post(`/api/chat/messages/${message.body._id}/react`)
    .set(authHeader(user.token))
    .send({ emoji: '👍' });

  assert.equal(second.status, 200);
  assert.deepEqual(second.body.reactions, []);
});

test('only the author or an admin can delete a message', async () => {
  const admin = await createTestUser({ name: 'Admin', role: 'admin' });
  const author = await createTestUser({ name: 'Author' });
  const other = await createTestUser({ name: 'Other' });
  const room = await createRoom(admin.token);
  const message = await postMessage(author.token, room.id, { content: 'Mine' });

  const denied = await request(app)
    .delete(`/api/chat/messages/${message.body._id}`)
    .set(authHeader(other.token));
  assert.equal(denied.status, 403);

  const deleted = await request(app)
    .delete(`/api/chat/messages/${message.body._id}`)
    .set(authHeader(author.token));
  assert.equal(deleted.status, 200);

  const list = await request(app)
    .get(`/api/chat/${room.id}/messages`)
    .set(authHeader(author.token));
  assert.equal(list.status, 200);
  assert.deepEqual(list.body, []);
});

test('read-only rooms reject regular members but allow admins', async () => {
  const admin = await createTestUser({ name: 'Admin', role: 'admin' });
  const user = await createTestUser({ name: 'Member' });
  const room = await createRoom(admin.token, {
    name: 'Announcements',
    isReadOnly: true,
  });

  const denied = await postMessage(user.token, room.id, { content: 'Nope' });
  assert.equal(denied.status, 403);
  assert.ok(denied.body.message);

  const allowed = await postMessage(admin.token, room.id, { content: 'Notice' });
  assert.equal(allowed.status, 201);

  const read = await request(app)
    .get(`/api/chat/${room.id}/messages`)
    .set(authHeader(user.token));
  assert.equal(read.status, 200);

  const edit = await request(app)
    .put(`/api/chat/messages/${allowed.body._id}`)
    .set(authHeader(user.token))
    .send({ content: 'Changed' });
  assert.equal(edit.status, 403);

  const remove = await request(app)
    .delete(`/api/chat/messages/${allowed.body._id}`)
    .set(authHeader(user.token));
  assert.equal(remove.status, 403);

  const react = await request(app)
    .post(`/api/chat/messages/${allowed.body._id}/react`)
    .set(authHeader(user.token))
    .send({ emoji: '👍' });
  assert.equal(react.status, 403);
});

test('upload rejects unsupported file types', async () => {
  const user = await createTestUser({ name: 'Member' });

  const res = await request(app)
    .post('/api/chat/upload')
    .set(authHeader(user.token))
    .attach('file', Buffer.from('plain text'), {
      filename: 'notes.txt',
      contentType: 'text/plain',
    });

  assert.equal(res.status, 400);
  assert.ok(res.body.message);
});

test('upload derives the stored extension from the MIME type', async () => {
  const user = await createTestUser({ name: 'Member' });

  const res = await request(app)
    .post('/api/chat/upload')
    .set(authHeader(user.token))
    .attach('file', Buffer.from('not actually a png'), {
      filename: 'evil.html',
      contentType: 'image/png',
    });

  assert.equal(res.status, 200);
  assert.ok(res.body.attachment);
  assert.match(res.body.attachment.url, /\.png$/);
  assert.doesNotMatch(res.body.attachment.url, /\.html$/);

  const storedName = path.basename(res.body.attachment.url);
  await fs.unlink(path.join(__dirname, '..', 'uploads', storedName)).catch(() => {});
});

test('messages reject untrusted attachment URLs', async () => {
  const admin = await createTestUser({ name: 'Admin', role: 'admin' });
  const user = await createTestUser({ name: 'Member' });
  const room = await createRoom(admin.token);

  const external = await postMessage(user.token, room.id, {
    content: 'External',
    attachments: [{ url: 'https://evil.example/x.png', type: 'image' }],
  });
  assert.equal(external.status, 400);

  const scriptUrl = await postMessage(user.token, room.id, {
    content: 'Script',
    attachments: [{ url: 'javascript:alert(1)', type: 'file' }],
  });
  assert.equal(scriptUrl.status, 400);

  const traversal = await postMessage(user.token, room.id, {
    content: 'Traversal',
    attachments: [{ url: '/uploads/../server.js', type: 'file' }],
  });
  assert.equal(traversal.status, 400);

  const badPreview = await postMessage(user.token, room.id, {
    content: 'Preview',
    attachments: [
      {
        url: '/uploads/123-456.png',
        previewUrl: 'https://evil.example/x.png',
        type: 'image',
      },
    ],
  });
  assert.equal(badPreview.status, 400);

  assert.equal(await ChatMessage.countDocuments({ roomId: room.id }), 0);

  const valid = await postMessage(user.token, room.id, {
    content: 'Valid',
    attachments: [
      {
        url: '/uploads/123-456.png',
        filename: 'photo.png',
        previewUrl: '/uploads/123-456.png',
        type: 'image',
        size: 1234,
      },
    ],
  });
  assert.equal(valid.status, 201);
  assert.equal(valid.body.attachments.length, 1);
});

test('message listing 404s when the room does not exist', async () => {
  const user = await createTestUser({ name: 'Member' });

  const res = await request(app)
    .get(`/api/chat/${new mongoose.Types.ObjectId()}/messages`)
    .set(authHeader(user.token));

  assert.equal(res.status, 404);
});

test('archived rooms block non-admin reads and mutations', async () => {
  const admin = await createTestUser({ name: 'Admin', role: 'admin' });
  const user = await createTestUser({ name: 'Member' });
  const room = await createRoom(admin.token);
  const message = await postMessage(user.token, room.id, { content: 'Before archive' });
  assert.equal(message.status, 201);

  const archived = await request(app)
    .delete(`/api/chat/rooms/${room.id}`)
    .set(authHeader(admin.token));
  assert.equal(archived.status, 200);

  const read = await request(app)
    .get(`/api/chat/${room.id}/messages`)
    .set(authHeader(user.token));
  assert.equal(read.status, 403);

  const adminRead = await request(app)
    .get(`/api/chat/${room.id}/messages`)
    .set(authHeader(admin.token));
  assert.equal(adminRead.status, 200);

  const edit = await request(app)
    .put(`/api/chat/messages/${message.body._id}`)
    .set(authHeader(user.token))
    .send({ content: 'Edited' });
  assert.equal(edit.status, 403);

  const remove = await request(app)
    .delete(`/api/chat/messages/${message.body._id}`)
    .set(authHeader(user.token));
  assert.equal(remove.status, 403);

  const react = await request(app)
    .post(`/api/chat/messages/${message.body._id}/react`)
    .set(authHeader(user.token))
    .send({ emoji: '👍' });
  assert.equal(react.status, 403);
});

test('replies to replies are rejected', async () => {
  const admin = await createTestUser({ name: 'Admin', role: 'admin' });
  const user = await createTestUser({ name: 'Member' });
  const room = await createRoom(admin.token);

  const parent = await postMessage(user.token, room.id, { content: 'Parent' });
  const reply = await request(app)
    .post(`/api/chat/messages/${parent.body._id}/reply`)
    .set(authHeader(user.token))
    .send({ content: 'Reply' });
  assert.equal(reply.status, 201);

  const nested = await request(app)
    .post(`/api/chat/messages/${reply.body._id}/reply`)
    .set(authHeader(user.token))
    .send({ content: 'Nested' });
  assert.equal(nested.status, 400);
  assert.equal(nested.body.message, 'Replies to replies are not supported');

  const nestedViaRoom = await postMessage(user.token, room.id, {
    content: 'Nested again',
    parentId: reply.body._id,
  });
  assert.equal(nestedViaRoom.status, 400);
  assert.equal(nestedViaRoom.body.message, 'Replies to replies are not supported');

  const list = await request(app)
    .get(`/api/chat/${room.id}/messages`)
    .set(authHeader(user.token));
  assert.equal(list.body.length, 1);
  assert.equal(list.body[0].replies.length, 1);
});

test('legacy messages with an explicit null parentId remain top-level', async () => {
  const admin = await createTestUser({ name: 'Admin', role: 'admin' });
  const user = await createTestUser({ name: 'Member' });
  const room = await createRoom(admin.token);

  await ChatMessage.create({
    roomId: room.id,
    userId: user.user._id,
    username: user.user.name,
    content: 'Legacy message',
    parentId: null,
  });

  const list = await request(app)
    .get(`/api/chat/${room.id}/messages`)
    .set(authHeader(user.token));
  assert.equal(list.status, 200);
  assert.equal(list.body.length, 1);
  assert.equal(list.body[0].content, 'Legacy message');
});

test('users without chat access are blocked, admins are not', async () => {
  const user = await createTestUser({ name: 'No Chat' });
  await User.updateOne(
    { _id: user.user._id },
    { $set: { 'access.canAccessChat': false } },
  );

  const denied = await request(app).get('/api/chat/rooms').set(authHeader(user.token));
  assert.equal(denied.status, 403);
  assert.equal(denied.body.message, 'Chat access is disabled');

  const admin = await createTestUser({ name: 'Admin', role: 'admin' });
  await User.updateOne(
    { _id: admin.user._id },
    { $set: { 'access.canAccessChat': false } },
  );

  const allowed = await request(app).get('/api/chat/rooms').set(authHeader(admin.token));
  assert.equal(allowed.status, 200);
});
