// apps/api/scripts/seed-demo.js - Local-only demo data for the Studio surfaces.
// Idempotent: rerunning updates the demo users and only inserts missing rooms,
// messages, inquiries, and visit counters. Refuses production and non-local
// MongoDB unless SEED_DEMO_ALLOW_REMOTE=1 is set explicitly.
require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});

const mongoose = require("mongoose");
const User = require("../models/User");
const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");
const ChatMessage = require("../models/ChatMessage");
const DemoVisit = require("../models/DemoVisit");

const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD || "Meridian2026!";

function isLocalMongo(uri) {
  if (typeof uri !== "string" || !/^mongodb:\/\//i.test(uri)) return false;
  try {
    const withoutScheme = uri.replace(/^mongodb:\/\//i, "");
    const authority = withoutScheme.split("/")[0].split("?")[0];
    const hostPort = authority.includes("@")
      ? authority.split("@").pop()
      : authority;
    const host = hostPort.startsWith("[")
      ? hostPort.slice(1, hostPort.indexOf("]"))
      : hostPort.split(":")[0];
    return ["localhost", "127.0.0.1", "::1"].includes(host.toLowerCase());
  } catch {
    return false;
  }
}

function access(overrides = {}) {
  return {
    canLogin: true,
    canAccessChat: true,
    canAccessPremiumFeatures: false,
    canAccessCrm: false,
    ...overrides,
  };
}

async function upsertDemoUser({ name, email, role, userAccess }) {
  const existing = await User.findOne({ email });
  if (existing) {
    existing.name = name;
    existing.role = role;
    existing.isVerified = true;
    existing.isActive = true;
    existing.access = access(userAccess);
    await existing.save();
    return existing;
  }

  return User.create({
    name,
    email,
    password: DEMO_PASSWORD,
    role,
    isVerified: true,
    isActive: true,
    access: access(userAccess),
  });
}

async function ensureRoom({ name, description, isReadOnly = false }) {
  const existing = await ChatRoom.findOne({ name });
  if (existing) return { room: existing, created: false };
  const room = await ChatRoom.create({ name, description, isReadOnly });
  return { room, created: true };
}

async function seedMessages(general, admin, customer) {
  const roomId = String(general._id);
  if ((await ChatMessage.countDocuments({ roomId })) > 0) return 0;

  const parent = await ChatMessage.create({
    roomId,
    userId: customer._id,
    username: customer.name,
    content: "Hi! Could someone walk me through the demo sites?",
  });

  await ChatMessage.create({
    roomId,
    userId: admin._id,
    username: admin.name,
    content:
      "Of course — start with The Daily Knead and tell us what you think.",
    parentId: parent._id,
  });
  await ChatMessage.updateOne({ _id: parent._id }, { $inc: { replyCount: 1 } });

  return 2;
}

async function seedInquiries() {
  const now = new Date();
  const inquiries = [
    {
      name: "Demo Lead",
      email: "demo.lead@example.test",
      subject: "Demo inquiry - new site",
      message: "We are interested in a storefront rebuild this quarter.",
      status: "new",
    },
    {
      name: "Demo Support",
      email: "demo.support@example.test",
      subject: "Demo inquiry - support",
      message: "Can you also migrate our existing content?",
      status: "read",
      readAt: now,
    },
    {
      name: "Demo Archive",
      email: "demo.archive@example.test",
      subject: "Demo inquiry - archived",
      message: "Old inquiry kept for inbox testing.",
      status: "archived",
      readAt: now,
      archivedAt: now,
    },
  ];

  for (const inquiry of inquiries) {
    await Message.findOneAndUpdate(
      { email: inquiry.email, subject: inquiry.subject },
      { $setOnInsert: inquiry },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  return inquiries.length;
}

async function seedVisits() {
  const defaults = { bakery: 24, luxesm: 17, dental: 12, corrowear: 8 };
  for (const [key, visits] of Object.entries(defaults)) {
    await DemoVisit.findOneAndUpdate(
      { key },
      { $setOnInsert: { visits, lastVisitedAt: new Date() } },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }
  return Object.keys(defaults).length;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed demo data with NODE_ENV=production");
  }

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is required (set it in apps/api/.env)");

  if (!isLocalMongo(uri) && process.env.SEED_DEMO_ALLOW_REMOTE !== "1") {
    throw new Error(
      "Refusing to seed a non-local MongoDB. Set SEED_DEMO_ALLOW_REMOTE=1 to override.",
    );
  }

  console.log("🔗 Connecting to MongoDB...");
  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  console.log(`✅ Connected: ${conn.connection.host}`);

  const admin = await upsertDemoUser({
    name: "Demo Admin",
    email: "demo@meridian.studio",
    role: "admin",
    userAccess: { canAccessPremiumFeatures: true, canAccessCrm: true },
  });
  const staff = await upsertDemoUser({
    name: "Demo Staff",
    email: "member@meridian.studio",
    role: "user",
    userAccess: { canAccessPremiumFeatures: true, canAccessCrm: true },
  });
  const customer = await upsertDemoUser({
    name: "Demo Customer",
    email: "demo.customer@meridianstudios.test",
    role: "user",
  });

  const { room: general, created: generalCreated } = await ensureRoom({
    name: "General",
    description: "Demo support room for local Studio testing.",
  });
  const { created: updatesCreated } = await ensureRoom({
    name: "Product Updates",
    description: "Read-only announcements from the demo team.",
    isReadOnly: true,
  });

  const messagesCreated = await seedMessages(general, staff, customer);
  const inquiries = await seedInquiries();
  const demos = await seedVisits();

  console.log(`👤 Demo admin: ${admin.email}`);
  console.log(`👤 Demo staff: ${staff.email}`);
  console.log(`👤 Demo customer: ${customer.email}`);
  console.log(
    `💬 Rooms: General (${generalCreated ? "created" : "existing"}), Product Updates (${updatesCreated ? "created" : "existing"})`,
  );
  console.log(`💬 Demo messages inserted: ${messagesCreated}`);
  console.log(`📨 Demo inquiries ensured: ${inquiries}`);
  console.log(`📊 Demo visit counters ensured: ${demos}`);
  console.log("✅ Demo seed complete.");

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(`❌ Demo seed failed: ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
