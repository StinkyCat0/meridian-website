const test = require("node:test");
const { before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const {
  request,
  setupTestDb,
  teardownTestDb,
  resetDb,
  createApp,
  createTestUser,
  authHeader,
  User,
} = require("./helpers");
const CrmHandoff = require("../models/CrmHandoff");
const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");
const ChatMessage = require("../models/ChatMessage");
const { hashToken } = require("../utils/tokens");

const TOKEN = process.env.STUDIO_API_TOKEN;
const STUDIO_HEADER = { "x-meridian-studio-token": TOKEN };

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

function studio(method, path) {
  return request(app)[method](`/api/studio${path}`).set(STUDIO_HEADER);
}

function demosVisit(key) {
  return request(app).post(`/api/demos/${key}/visit`);
}

async function mintHandoff(user) {
  return request(app).post("/api/auth/crm-handoff").set(authHeader(user.token));
}

function handoffCode(response) {
  const url = new URL(response.body.url);
  assert.equal(url.pathname, "/login/website");
  const code = url.searchParams.get("code");
  assert.ok(code);
  return code;
}

// ==================== TOKEN GATE ====================

test("studio API returns 503 when STUDIO_API_TOKEN is unconfigured", async () => {
  const previous = process.env.STUDIO_API_TOKEN;
  process.env.STUDIO_API_TOKEN = "";
  try {
    const res = await request(app)
      .get("/api/studio/overview")
      .set(STUDIO_HEADER);
    assert.equal(res.status, 503);
    assert.equal(res.body.message, "Studio API is not configured");
  } finally {
    process.env.STUDIO_API_TOKEN = previous;
  }
});

test("studio API rejects missing or wrong service tokens", async () => {
  const missing = await request(app).get("/api/studio/overview");
  assert.equal(missing.status, 401);

  const wrong = await request(app)
    .get("/api/studio/overview")
    .set("x-meridian-studio-token", "definitely-the-wrong-token");
  assert.equal(wrong.status, 401);

  const shortToken = await request(app)
    .get("/api/studio/overview")
    .set("x-meridian-studio-token", "short");
  assert.equal(shortToken.status, 401);
});

// ==================== OVERVIEW ====================

test("overview returns the documented counters and integration states", async () => {
  const admin = await createTestUser({ role: "admin", name: "Admin" });
  await createTestUser({
    name: "CRM User",
    access: { canAccessCrm: true },
    subscription: { plan: "pro", status: "past_due" },
  });
  await createTestUser({ name: "Inactive", isActive: false });
  const room = await ChatRoom.create({ name: "General" });
  await ChatMessage.create({
    roomId: String(room._id),
    userId: admin.user._id,
    username: admin.user.name,
    content: "Hello",
  });
  await Message.create({
    name: "Lead",
    email: "lead@example.com",
    message: "Hi",
  });
  await demosVisit("bakery");

  const res = await studio("get", "/overview");

  assert.equal(res.status, 200);
  assert.ok(res.body.generatedAt);
  assert.deepEqual(
    {
      total: res.body.accounts.total,
      verified: res.body.accounts.verified,
      crmAccess: res.body.accounts.crmAccess,
      active: res.body.accounts.active,
      admins: res.body.accounts.admins,
    },
    { total: 3, verified: 3, crmAccess: 1, active: 2, admins: 1 },
  );
  assert.equal(res.body.subscriptions.pro, 1);
  assert.equal(res.body.subscriptions.free, 2);
  assert.equal(res.body.subscriptions.pastDue, 1);
  assert.deepEqual(
    {
      total: res.body.inquiries.total,
      new: res.body.inquiries.new,
      read: res.body.inquiries.read,
      archived: res.body.inquiries.archived,
    },
    { total: 1, new: 1, read: 0, archived: 0 },
  );
  assert.equal(res.body.chat.rooms, 1);
  assert.equal(res.body.chat.messages, 1);
  assert.equal(res.body.demos.find((demo) => demo.key === "bakery").visits, 1);
  assert.equal(res.body.integrations.mongo, "up");
  assert.ok(["enabled", "disabled"].includes(res.body.integrations.email));
  assert.ok(
    ["configured", "missing"].includes(res.body.integrations.crmIntake),
  );
  assert.equal(res.body.integrations.crmHandoff, "configured");
});

// ==================== ACCOUNTS ====================

test("accounts list redacts secrets and supports search", async () => {
  const target = await createTestUser({
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "SecretPassword123!",
    access: { canAccessCrm: true, canAccessChat: true },
    subscription: {
      stripeCustomerId: "cus_secret",
      plan: "pro",
      status: "active",
    },
  });
  await createTestUser({ name: "Grace Hopper", email: "grace@example.com" });

  const res = await studio("get", "/accounts?search=ada");

  assert.equal(res.status, 200);
  assert.equal(res.body.total, 1);
  assert.equal(res.body.page, 1);
  assert.equal(res.body.items.length, 1);

  const account = res.body.items[0];
  assert.equal(account.id, String(target.user._id));
  assert.equal(account.email, "ada@example.com");
  assert.equal(account.access.canAccessCrm, true);
  assert.equal(account.subscription.plan, "pro");
  assert.equal(account.password, undefined);
  assert.equal(account.subscription.stripeCustomerId, undefined);
  assert.equal(account.verificationToken, undefined);

  const raw = JSON.stringify(res.body);
  assert.doesNotMatch(raw, /password|cus_secret|verificationToken/i);

  const all = await studio("get", "/accounts?page=1&pageSize=1");
  assert.equal(all.body.total, 2);
  assert.equal(all.body.items.length, 1);
  assert.equal(all.body.pageSize, 1);
});

test("PATCH account updates access flags and validates input", async () => {
  const { user } = await createTestUser({
    access: { canAccessCrm: true, canAccessChat: true },
  });

  const empty = await studio("patch", `/accounts/${user._id}`).send({});
  assert.equal(empty.status, 400);

  const wrongType = await studio("patch", `/accounts/${user._id}`).send({
    canAccessCrm: "yes",
  });
  assert.equal(wrongType.status, 400);

  const updated = await studio("patch", `/accounts/${user._id}`).send({
    canAccessCrm: false,
    canAccessChat: false,
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.account.access.canAccessCrm, false);
  assert.equal(updated.body.account.access.canAccessChat, false);
  assert.equal(updated.body.account.password, undefined);

  const stored = await User.findById(user._id).lean();
  assert.equal(stored.access.canAccessCrm, false);
  assert.equal(stored.access.canAccessChat, false);

  const missing = await studio(
    "patch",
    `/accounts/${new mongoose.Types.ObjectId()}`,
  ).send({ isActive: false });
  assert.equal(missing.status, 404);
});

test("the last active admin cannot be deactivated", async () => {
  const admin = await createTestUser({ role: "admin", name: "Only Admin" });

  const denied = await studio("patch", `/accounts/${admin.user._id}`).send({
    isActive: false,
  });
  assert.equal(denied.status, 409);

  const second = await createTestUser({ role: "admin", name: "Second Admin" });

  const allowed = await studio("patch", `/accounts/${admin.user._id}`).send({
    isActive: false,
  });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.body.account.isActive, false);

  const stillActive = await studio(
    "patch",
    `/accounts/${second.user._id}`,
  ).send({
    isActive: false,
  });
  assert.equal(stillActive.status, 409);
});

// ==================== INQUIRIES ====================

test("inquiries can be filtered and their status changes stamp dates", async () => {
  const inquiry = await Message.create({
    name: "Lead",
    email: "lead@example.com",
    subject: "New site",
    message: "Hello there",
  });

  const listed = await studio("get", "/inquiries?status=new");
  assert.equal(listed.status, 200);
  assert.equal(listed.body.total, 1);
  assert.equal(listed.body.items[0].subject, "New site");
  assert.equal(listed.body.items[0].crmDealId, null);

  const invalid = await studio("get", "/inquiries?status=pending");
  assert.equal(invalid.status, 400);

  const read = await studio("patch", `/inquiries/${inquiry._id}`).send({
    status: "read",
  });
  assert.equal(read.status, 200);
  assert.equal(read.body.inquiry.status, "read");
  assert.ok(read.body.inquiry.readAt);
  assert.equal(read.body.inquiry.archivedAt, null);

  const archived = await studio("patch", `/inquiries/${inquiry._id}`).send({
    status: "archived",
  });
  assert.equal(archived.status, 200);
  assert.equal(archived.body.inquiry.status, "archived");
  assert.ok(archived.body.inquiry.archivedAt);

  const badStatus = await studio("patch", `/inquiries/${inquiry._id}`).send({
    status: "pending",
  });
  assert.equal(badStatus.status, 400);

  const archivedList = await studio("get", "/inquiries?status=archived");
  assert.equal(archivedList.body.total, 1);
});

// ==================== CHAT ====================

test("studio can create rooms and post messages with a resolved author", async () => {
  const author = await createTestUser({
    name: "Resolved Author",
    email: "author@example.com",
  });

  const created = await studio("post", "/chat/rooms").send({
    name: "Studio Room",
    description: "Created from the CRM",
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.room.name, "Studio Room");
  assert.equal(created.body.room.messageCount, 0);

  const roomId = created.body.room.id;

  const sent = await studio("post", `/chat/rooms/${roomId}/messages`).send({
    content: "Hello from the Studio",
    authorEmail: "AUTHOR@example.com",
    username: "spoofed",
  });
  assert.equal(sent.status, 201);
  assert.equal(sent.body.message.content, "Hello from the Studio");
  assert.equal(sent.body.message.author.id, String(author.user._id));
  assert.equal(sent.body.message.author.name, "Resolved Author");
  assert.equal(sent.body.message.parentId, null);
  assert.deepEqual(sent.body.message.replies, []);

  const messages = await studio("get", `/chat/rooms/${roomId}/messages`);
  assert.equal(messages.status, 200);
  assert.equal(messages.body.items.length, 1);
  assert.equal(messages.body.items[0].id, sent.body.message.id);

  const unknownAuthor = await studio(
    "post",
    `/chat/rooms/${roomId}/messages`,
  ).send({
    content: "Nope",
    authorEmail: "missing@example.com",
  });
  assert.equal(unknownAuthor.status, 400);

  const emptyContent = await studio(
    "post",
    `/chat/rooms/${roomId}/messages`,
  ).send({
    content: "   ",
    authorEmail: "author@example.com",
  });
  assert.equal(emptyContent.status, 400);

  const tooLong = await studio("post", `/chat/rooms/${roomId}/messages`).send({
    content: "x".repeat(2001),
    authorEmail: "author@example.com",
  });
  assert.equal(tooLong.status, 400);
  assert.equal(await ChatMessage.countDocuments({ roomId }), 1);
});

test("chat threads only accept parents that belong to the same room", async () => {
  const author = await createTestUser({ email: "thread@example.com" });

  const roomA = (await studio("post", "/chat/rooms").send({ name: "Room A" }))
    .body.room.id;
  const roomB = (await studio("post", "/chat/rooms").send({ name: "Room B" }))
    .body.room.id;

  const parent = await studio("post", `/chat/rooms/${roomA}/messages`).send({
    content: "Parent",
    authorEmail: "thread@example.com",
  });
  assert.equal(parent.status, 201);

  const crossRoom = await studio("post", `/chat/rooms/${roomB}/messages`).send({
    content: "Wrong room",
    authorEmail: "thread@example.com",
    parentId: parent.body.message.id,
  });
  assert.equal(crossRoom.status, 400);

  const reply = await studio("post", `/chat/rooms/${roomA}/messages`).send({
    content: "Reply",
    authorEmail: "thread@example.com",
    parentId: parent.body.message.id,
  });
  assert.equal(reply.status, 201);
  assert.equal(reply.body.message.parentId, parent.body.message.id);

  const nested = await studio("post", `/chat/rooms/${roomA}/messages`).send({
    content: "Nested",
    authorEmail: "thread@example.com",
    parentId: reply.body.message.id,
  });
  assert.equal(nested.status, 400);

  const messages = await studio("get", `/chat/rooms/${roomA}/messages`);
  assert.equal(messages.body.items.length, 1);
  assert.equal(messages.body.items[0].replyCount, 1);
  assert.equal(messages.body.items[0].replies.length, 1);
  assert.equal(messages.body.items[0].replies[0].content, "Reply");

  const update = await studio("patch", `/chat/rooms/${roomA}`).send({
    description: "Updated",
  });
  assert.equal(update.status, 200);
  assert.equal(update.body.room.description, "Updated");
  assert.equal(update.body.room.messageCount, 2);

  const archivedA = await studio("delete", `/chat/rooms/${roomA}`);
  assert.equal(archivedA.status, 200);
  assert.equal(archivedA.body.room.archived, true);

  const active = await studio("get", "/chat/rooms");
  assert.deepEqual(
    active.body.items.map((room) => room.id),
    [roomB],
  );

  const all = await studio("get", "/chat/rooms?includeArchived=true");
  assert.equal(all.body.items.length, 2);

  const sendArchived = await studio(
    "post",
    `/chat/rooms/${roomA}/messages`,
  ).send({
    content: "Too late",
    authorEmail: "thread@example.com",
  });
  assert.equal(sendArchived.status, 409);
});

// ==================== BILLING + DEMOS + SETTINGS ====================

test("billing reports subscription counts without leaking Stripe ids", async () => {
  await createTestUser({
    name: "Pro User",
    subscription: {
      plan: "pro",
      status: "past_due",
      stripeCustomerId: "cus_hidden",
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date("2026-12-01T00:00:00.000Z"),
    },
  });
  await createTestUser({ name: "Free User" });

  const res = await studio("get", "/billing?page=1&pageSize=10");

  assert.equal(res.status, 200);
  assert.equal(res.body.total, 2);
  assert.deepEqual(res.body.summary, {
    total: 2,
    active: 1,
    pastDue: 1,
    canceling: 1,
    plans: { free: 1, basic: 0, pro: 1, enterprise: 0 },
  });
  assert.equal(res.body.items.length, 2);

  const item = res.body.items.find((entry) => entry.plan === "pro");
  assert.equal(item.name, "Pro User");
  assert.equal(item.status, "past_due");
  assert.equal(item.cancelAtPeriodEnd, true);
  assert.equal(item.currentPeriodEnd, "2026-12-01T00:00:00.000Z");
  assert.ok(item.createdAt);
  assert.equal(item.subscription, undefined);
  assert.doesNotMatch(JSON.stringify(res.body), /cus_hidden/);
});

test("studio demos mirror the public demo counters", async () => {
  await demosVisit("luxesm");
  await demosVisit("luxesm");
  await demosVisit("bakery");

  const res = await studio("get", "/demos");

  assert.equal(res.status, 200);
  const counts = Object.fromEntries(
    res.body.items.map((item) => [item.key, item.visits]),
  );
  assert.equal(counts.luxesm, 2);
  assert.equal(counts.bakery, 1);
  assert.equal(counts.dental, 0);
  assert.equal(counts.corrowear, 0);
});

test("settings exposes integration states and safe links", async () => {
  const res = await studio("get", "/settings");

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.integrations));
  assert.ok(Array.isArray(res.body.links));

  const byKey = Object.fromEntries(
    res.body.integrations.map((integration) => [integration.key, integration]),
  );
  assert.equal(byKey.mongo.status, "up");
  assert.equal(byKey.crmHandoff.status, "configured");
  assert.ok(byKey.email.label);

  const crmLink = res.body.links.find((link) => link.label === "CRM");
  assert.equal(crmLink.url, process.env.CRM_URL);
});

// ==================== HANDOFF ====================

test("verified CRM users can mint a hashed, expiring handoff URL", async () => {
  const eligible = await createTestUser({
    email: "crm-user@example.com",
    access: { canAccessCrm: true },
  });

  const res = await mintHandoff(eligible);
  assert.equal(res.status, 200);
  assert.ok(
    res.body.url.startsWith(`${process.env.CRM_URL}/login/website?code=`),
  );
  assert.equal(res.body.code, undefined);

  const code = handoffCode(res);
  const stored = await CrmHandoff.findOne({ userId: eligible.user._id });
  assert.ok(stored);
  assert.equal(stored.codeHash, hashToken(code));
  assert.notEqual(stored.codeHash, code);
  assert.equal(stored.usedAt, null);
  assert.ok(stored.expiresAt > new Date());
  assert.equal(String(stored.userId), String(eligible.user._id));

  // The raw code appears only in the URL, never in a stored field.
  const raw = await CrmHandoff.collection.findOne({});
  assert.equal(raw.code, undefined);
});

test("handoff is refused for unverified users and users without CRM access", async () => {
  const unverified = await createTestUser({
    isVerified: false,
    access: { canAccessCrm: true },
  });
  const unverifiedRes = await mintHandoff(unverified);
  assert.equal(unverifiedRes.status, 403);

  const noAccess = await createTestUser({ access: { canAccessCrm: false } });
  const noAccessRes = await mintHandoff(noAccess);
  assert.equal(noAccessRes.status, 403);

  const anonymous = await request(app).post("/api/auth/crm-handoff");
  assert.equal(anonymous.status, 401);

  assert.equal(await CrmHandoff.countDocuments(), 0);
});

test("handoff returns 503 when CRM_URL is missing", async () => {
  const previous = process.env.CRM_URL;
  process.env.CRM_URL = "";
  try {
    const user = await createTestUser({ access: { canAccessCrm: true } });
    const res = await mintHandoff(user);
    assert.equal(res.status, 503);
    assert.equal(await CrmHandoff.countDocuments(), 0);
  } finally {
    process.env.CRM_URL = previous;
  }
});

test("inspect does not consume; consume is single-use", async () => {
  const user = await createTestUser({
    email: "handoff@example.com",
    name: "Handoff User",
    access: { canAccessCrm: true },
  });
  const code = handoffCode(await mintHandoff(user));

  const preview = await studio("post", "/sso/inspect").send({ code });
  assert.equal(preview.status, 200);
  assert.deepEqual(
    {
      websiteUserId: preview.body.websiteUserId,
      email: preview.body.email,
      name: preview.body.name,
      isVerified: preview.body.isVerified,
      crmAccess: preview.body.crmAccess,
    },
    {
      websiteUserId: String(user.user._id),
      email: "handoff@example.com",
      name: "Handoff User",
      isVerified: true,
      crmAccess: true,
    },
  );
  assert.ok(preview.body.expiresAt);
  assert.equal((await CrmHandoff.findOne({})).usedAt, null);

  const secondPreview = await studio("post", "/sso/inspect").send({ code });
  assert.equal(secondPreview.status, 200);

  const consumed = await studio("post", "/sso/consume").send({ code });
  assert.equal(consumed.status, 200);
  assert.equal(consumed.body.email, "handoff@example.com");
  assert.ok((await CrmHandoff.findOne({})).usedAt instanceof Date);

  const replay = await studio("post", "/sso/consume").send({ code });
  assert.equal(replay.status, 401);

  const inspectUsed = await studio("post", "/sso/inspect").send({ code });
  assert.equal(inspectUsed.status, 401);

  const badCode = await studio("post", "/sso/consume").send({
    code: "not-a-code",
  });
  assert.equal(badCode.status, 401);
});

test("concurrent consumes allow exactly one winner", async () => {
  const user = await createTestUser({ access: { canAccessCrm: true } });
  const code = handoffCode(await mintHandoff(user));

  const [first, second] = await Promise.all([
    studio("post", "/sso/consume").send({ code }),
    studio("post", "/sso/consume").send({ code }),
  ]);

  const statuses = [first.status, second.status].sort();
  assert.deepEqual(statuses, [200, 401]);
});

test("expired and revoked handoffs are rejected", async () => {
  const user = await createTestUser({ access: { canAccessCrm: true } });

  const expiredCode = "expired-handoff-code";
  await CrmHandoff.create({
    codeHash: hashToken(expiredCode),
    userId: user.user._id,
    expiresAt: new Date(Date.now() - 1000),
  });

  const expired = await studio("post", "/sso/inspect").send({
    code: expiredCode,
  });
  assert.equal(expired.status, 401);

  const validCode = handoffCode(await mintHandoff(user));
  await User.updateOne(
    { _id: user.user._id },
    { $set: { "access.canAccessCrm": false } },
  );

  const revoked = await studio("post", "/sso/inspect").send({
    code: validCode,
  });
  assert.equal(revoked.status, 403);
});
