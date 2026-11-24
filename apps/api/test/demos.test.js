const test = require("node:test");
const { before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");

const {
  setupTestDb,
  teardownTestDb,
  resetDb,
  createApp,
  request,
} = require("./helpers");
const DemoVisit = require("../models/DemoVisit");

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

test("GET /api/demos returns every demo with zero visits before any ping", async () => {
  const res = await request(app).get("/api/demos");

  assert.equal(res.status, 200);
  assert.deepEqual(
    res.body.items.map((item) => item.key),
    ["bakery", "luxesm", "dental", "corrowear"],
  );
  for (const item of res.body.items) {
    assert.equal(item.visits, 0);
    assert.equal(item.lastVisitedAt, null);
    assert.ok(item.name);
    assert.ok(item.path);
    assert.ok(item.description);
  }
});

test("POST /api/demos/:key/visit increments Mongo and is reflected in the list", async () => {
  const first = await request(app).post("/api/demos/bakery/visit");
  assert.equal(first.status, 200);
  assert.deepEqual(first.body, { key: "bakery", visits: 1 });

  const second = await request(app).post("/api/demos/bakery/visit");
  assert.equal(second.status, 200);
  assert.equal(second.body.visits, 2);

  const stored = await DemoVisit.findOne({ key: "bakery" }).lean();
  assert.equal(stored.visits, 2);
  assert.ok(stored.lastVisitedAt instanceof Date);

  const list = await request(app).get("/api/demos");
  const bakery = list.body.items.find((item) => item.key === "bakery");
  assert.equal(bakery.visits, 2);
  assert.ok(bakery.lastVisitedAt);
});

test("demo visit pings are tracked independently per demo", async () => {
  await request(app).post("/api/demos/dental/visit");
  await request(app).post("/api/demos/dental/visit");
  await request(app).post("/api/demos/corrowear/visit");

  const list = await request(app).get("/api/demos");
  const counts = Object.fromEntries(
    list.body.items.map((item) => [item.key, item.visits]),
  );

  assert.deepEqual(counts, {
    bakery: 0,
    luxesm: 0,
    dental: 2,
    corrowear: 1,
  });
});

test("unknown demo keys are rejected and create no counter", async () => {
  const res = await request(app).post("/api/demos/not-a-demo/visit");

  assert.equal(res.status, 404);
  assert.equal(await DemoVisit.countDocuments(), 0);
});
