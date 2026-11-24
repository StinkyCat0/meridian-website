// apps/api/routes/studio.js - Server-to-server API consumed by the CRM Studio.
// Every route is mounted behind studioAuth; accounts are always serialized
// through a redacting helper so passwords, tokens, and Stripe ids never leak.
const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");
const ChatMessage = require("../models/ChatMessage");
const CrmHandoff = require("../models/CrmHandoff");
const emailService = require("../utils/emailService");
const { hashToken } = require("../utils/tokens");
const { demoItems } = require("./demos");

const router = express.Router();

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const MESSAGE_LIMIT = 50;
const MAX_MESSAGE_LIMIT = 100;
const MAX_MESSAGE_LENGTH = 2000;

// ==================== HELPERS ====================

function iso(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function pagination(query = {}) {
  const parsedPage = Number.parseInt(query.page, 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const parsedSize = Number.parseInt(query.pageSize, 10);
  const pageSize =
    Number.isInteger(parsedSize) && parsedSize > 0
      ? Math.min(parsedSize, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  return { page, pageSize, skip: (page - 1) * pageSize };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serializeAccount(user) {
  const access = user.access || {};
  const subscription = user.subscription || {};
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role === "admin" ? "admin" : "user",
    isVerified: !!user.isVerified,
    isActive: user.isActive !== false,
    access: {
      canLogin: access.canLogin !== false,
      canAccessChat: access.canAccessChat !== false,
      canAccessPremiumFeatures: access.canAccessPremiumFeatures === true,
      canAccessCrm: access.canAccessCrm === true,
    },
    subscription: {
      plan: subscription.plan || "free",
      status: subscription.status || "active",
      currentPeriodEnd: iso(subscription.currentPeriodEnd),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd === true,
    },
    avatar: user.avatar || null,
    createdAt: iso(user.createdAt),
    lastLogin: iso(user.lastLogin),
  };
}

function serializeInquiry(inquiry) {
  return {
    id: String(inquiry._id),
    name: inquiry.name || "",
    email: inquiry.email || "",
    subject: inquiry.subject || "",
    message: inquiry.message || "",
    status: inquiry.status || "new",
    crmDealId: inquiry.crmDealId || null,
    createdAt: iso(inquiry.createdAt),
    readAt: iso(inquiry.readAt),
    archivedAt: iso(inquiry.archivedAt),
  };
}

function serializeRoom(room, stats) {
  const entry = stats?.get(String(room._id));
  return {
    id: String(room._id),
    name: room.name,
    description: room.description || "",
    isReadOnly: room.isReadOnly === true,
    archived: room.archived === true,
    createdAt: iso(room.createdAt),
    messageCount: entry?.messageCount || 0,
    lastMessageAt: iso(entry?.lastMessageAt),
  };
}

function serializeAuthor(userId) {
  if (!userId || typeof userId !== "object" || userId.name === undefined)
    return null;
  return {
    id: String(userId._id),
    name: userId.name,
    avatar: userId.avatar || null,
    role: userId.role || "user",
  };
}

function serializeAttachment(attachment) {
  return {
    url: attachment.url,
    filename: attachment.filename || "",
    type: attachment.type || "file",
    size: Number(attachment.size) || 0,
  };
}

function serializeMessage(raw) {
  return {
    id: String(raw._id),
    roomId: String(raw.roomId),
    content: raw.content,
    author: serializeAuthor(raw.userId),
    parentId: raw.parentId ? String(raw.parentId) : null,
    attachments: (raw.attachments || []).map(serializeAttachment),
    reactions: (raw.reactions || []).map((reaction) => ({
      emoji: reaction.emoji,
      userIds: (reaction.userIds || []).map(String),
    })),
    edited: raw.edited === true,
    createdAt: iso(raw.createdAt),
    replies: [],
    replyCount: raw.replyCount || 0,
  };
}

async function roomStats(roomIds) {
  const ids = roomIds.map(String);
  const rows = await ChatMessage.aggregate([
    { $match: { roomId: { $in: ids } } },
    {
      $group: {
        _id: "$roomId",
        messageCount: { $sum: 1 },
        lastMessageAt: { $max: "$createdAt" },
      },
    },
  ]);
  return new Map(
    rows.map((row) => [
      String(row._id),
      { messageCount: row.messageCount, lastMessageAt: row.lastMessageAt },
    ]),
  );
}

function integrationState() {
  const intakeConfigured = Boolean(
    process.env.CRM_INTAKE_URL && process.env.CRM_INTAKE_SECRET,
  );
  return {
    mongo: mongoose.connection.readyState === 1 ? "up" : "down",
    email: emailService.isConfigured() ? "enabled" : "disabled",
    crmIntake: intakeConfigured ? "configured" : "missing",
    crmHandoff: process.env.CRM_URL ? "configured" : "missing",
  };
}

function invalidId(res) {
  return res.status(404).json({ message: "Not found" });
}

function isObjectId(value) {
  return typeof value === "string" && mongoose.isValidObjectId(value);
}

// ==================== OVERVIEW ====================

router.get("/overview", async (_req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    accountsTotal,
    accountsVerified,
    accountsCrmAccess,
    accountsActive,
    accountsAdmins,
    planRows,
    pastDue,
    inquiriesTotal,
    inquiriesNew,
    inquiriesRead,
    inquiriesArchived,
    inquiriesLast7,
    rooms,
    messages,
    messagesLast7,
    demos,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ "access.canAccessCrm": true }),
    User.countDocuments({ isActive: { $ne: false } }),
    User.countDocuments({ role: "admin" }),
    User.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$subscription.plan", "free"] },
          count: { $sum: 1 },
        },
      },
    ]),
    User.countDocuments({ "subscription.status": "past_due" }),
    Message.countDocuments({}),
    Message.countDocuments({ status: "new" }),
    Message.countDocuments({ status: "read" }),
    Message.countDocuments({ status: "archived" }),
    Message.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ChatRoom.countDocuments({ archived: { $ne: true } }),
    ChatMessage.countDocuments({}),
    ChatMessage.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    demoItems(),
  ]);

  const plans = { free: 0, basic: 0, pro: 0, enterprise: 0 };
  for (const row of planRows) {
    if (Object.prototype.hasOwnProperty.call(plans, row._id)) {
      plans[row._id] = row.count;
    }
  }

  res.json({
    generatedAt: new Date().toISOString(),
    accounts: {
      total: accountsTotal,
      verified: accountsVerified,
      crmAccess: accountsCrmAccess,
      active: accountsActive,
      admins: accountsAdmins,
    },
    subscriptions: {
      ...plans,
      pastDue,
    },
    inquiries: {
      total: inquiriesTotal,
      new: inquiriesNew,
      read: inquiriesRead,
      archived: inquiriesArchived,
      last7Days: inquiriesLast7,
    },
    chat: {
      rooms,
      messages,
      messages7Days: messagesLast7,
    },
    demos: demos.map(({ key, name, path, visits }) => ({
      key,
      name,
      path,
      visits,
    })),
    integrations: integrationState(),
  });
});

// ==================== ACCOUNTS ====================

router.get("/accounts", async (req, res) => {
  const { page, pageSize, skip } = pagination(req.query);
  const filter = {};

  if (typeof req.query.search === "string" && req.query.search.trim()) {
    const pattern = new RegExp(escapeRegex(req.query.search.trim()), "i");
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({ items: items.map(serializeAccount), page, pageSize, total });
});

router.patch("/accounts/:id", async (req, res) => {
  if (!isObjectId(req.params.id)) return invalidId(res);

  const body = req.body || {};
  const updates = {};

  for (const field of ["canAccessCrm", "canAccessChat", "isActive"]) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== "boolean") {
      return res.status(400).json({ message: `${field} must be a boolean` });
    }
    updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ message: "At least one account field is required" });
  }

  const user = await User.findById(req.params.id);
  if (!user) return invalidId(res);
  if (!user.access) user.access = {};

  // Never allow the last active website admin to be deactivated.
  if (
    updates.isActive === false &&
    user.role === "admin" &&
    user.isActive !== false
  ) {
    const otherActiveAdmins = await User.countDocuments({
      _id: { $ne: user._id },
      role: "admin",
      isActive: { $ne: false },
    });
    if (otherActiveAdmins === 0) {
      return res
        .status(409)
        .json({ message: "At least one active admin must remain" });
    }
  }

  if (
    updates.canAccessCrm !== undefined ||
    updates.canAccessChat !== undefined
  ) {
    if (!user.access) user.access = {};
    if (updates.canAccessCrm !== undefined) {
      user.access.canAccessCrm = updates.canAccessCrm;
    }
    if (updates.canAccessChat !== undefined) {
      user.access.canAccessChat = updates.canAccessChat;
    }
  }
  if (updates.isActive !== undefined) {
    user.isActive = updates.isActive;
  }

  await user.save();
  res.json({ account: serializeAccount(user) });
});

// ==================== INQUIRIES ====================

router.get("/inquiries", async (req, res) => {
  const { page, pageSize, skip } = pagination(req.query);
  const status = req.query.status === undefined ? "all" : req.query.status;

  if (!["all", "new", "read", "archived"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const filter = status === "all" ? {} : { status };
  const [items, total] = await Promise.all([
    Message.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Message.countDocuments(filter),
  ]);

  res.json({ items: items.map(serializeInquiry), page, pageSize, total });
});

router.patch("/inquiries/:id", async (req, res) => {
  if (!isObjectId(req.params.id)) return invalidId(res);

  const status = req.body?.status;
  if (!["new", "read", "archived"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const inquiry = await Message.findById(req.params.id);
  if (!inquiry) return invalidId(res);

  inquiry.status = status;
  if (status === "new") {
    inquiry.readAt = null;
    inquiry.archivedAt = null;
  } else if (status === "read") {
    if (!inquiry.readAt) inquiry.readAt = new Date();
    inquiry.archivedAt = null;
  } else if (status === "archived") {
    inquiry.archivedAt = new Date();
    if (!inquiry.readAt) inquiry.readAt = new Date();
  }

  await inquiry.save();
  res.json({ inquiry: serializeInquiry(inquiry) });
});

// ==================== CHAT ====================

router.get("/chat/rooms", async (req, res) => {
  const includeArchived = req.query.includeArchived === "true";
  const filter = includeArchived ? {} : { archived: { $ne: true } };
  const rooms = await ChatRoom.find(filter)
    .sort({ createdAt: 1, _id: 1 })
    .lean();
  const stats = await roomStats(rooms.map((room) => room._id));

  res.json({ items: rooms.map((room) => serializeRoom(room, stats)) });
});

router.post("/chat/rooms", async (req, res) => {
  const body = req.body || {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  if (name.length < 1 || name.length > 80) {
    return res
      .status(400)
      .json({ message: "Room name must be between 1 and 80 characters" });
  }
  if (body.description !== undefined && typeof body.description !== "string") {
    return res.status(400).json({ message: "Description must be a string" });
  }
  if (description.length > 300) {
    return res
      .status(400)
      .json({ message: "Description cannot exceed 300 characters" });
  }
  if (body.isReadOnly !== undefined && typeof body.isReadOnly !== "boolean") {
    return res.status(400).json({ message: "isReadOnly must be a boolean" });
  }

  const room = await ChatRoom.create({
    name,
    description,
    isReadOnly: body.isReadOnly === true,
  });

  res.status(201).json({ room: serializeRoom(room, new Map()) });
});

router.patch("/chat/rooms/:id", async (req, res) => {
  if (!isObjectId(req.params.id)) return invalidId(res);

  const body = req.body || {};
  const updates = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 1 || name.length > 80) {
      return res
        .status(400)
        .json({ message: "Room name must be between 1 and 80 characters" });
    }
    updates.name = name;
  }

  if (body.description !== undefined) {
    if (
      typeof body.description !== "string" ||
      body.description.trim().length > 300
    ) {
      return res
        .status(400)
        .json({ message: "Description cannot exceed 300 characters" });
    }
    updates.description = body.description.trim();
  }

  if (body.isReadOnly !== undefined) {
    if (typeof body.isReadOnly !== "boolean") {
      return res.status(400).json({ message: "isReadOnly must be a boolean" });
    }
    updates.isReadOnly = body.isReadOnly;
  }

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ message: "At least one room field is required" });
  }

  const room = await ChatRoom.findByIdAndUpdate(req.params.id, updates, {
    new: true,
  });
  if (!room) return invalidId(res);

  const stats = await roomStats([room._id]);
  res.json({ room: serializeRoom(room, stats) });
});

router.delete("/chat/rooms/:id", async (req, res) => {
  if (!isObjectId(req.params.id)) return invalidId(res);

  const room = await ChatRoom.findByIdAndUpdate(
    req.params.id,
    { archived: true },
    { new: true },
  );
  if (!room) return invalidId(res);

  const stats = await roomStats([room._id]);
  res.json({ room: serializeRoom(room, stats) });
});

router.get("/chat/rooms/:id/messages", async (req, res) => {
  if (!isObjectId(req.params.id)) return invalidId(res);

  const room = await ChatRoom.findById(req.params.id).lean();
  if (!room) return invalidId(res);

  const parsedLimit = Number.parseInt(req.query.limit, 10);
  const limit =
    Number.isInteger(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, MAX_MESSAGE_LIMIT)
      : MESSAGE_LIMIT;

  const query = { roomId: String(room._id), parentId: null };
  if (req.query.before !== undefined) {
    const before = new Date(req.query.before);
    if (Number.isNaN(before.getTime())) {
      return res.status(400).json({ message: "Invalid before timestamp" });
    }
    query.createdAt = { $lt: before };
  }

  const raw = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate({ path: "userId", select: "name avatar role" })
    .lean();

  const topLevel = raw.reverse();
  const parentIds = topLevel.map((message) => message._id);
  const replies = parentIds.length
    ? await ChatMessage.find({
        roomId: String(room._id),
        parentId: { $in: parentIds },
      })
        .sort({ createdAt: 1 })
        .populate({ path: "userId", select: "name avatar role" })
        .lean()
    : [];

  const items = topLevel.map((message) => {
    const item = serializeMessage(message);
    item.replies = replies
      .filter((reply) => String(reply.parentId) === String(message._id))
      .map(serializeMessage);
    item.replyCount = item.replies.length;
    return item;
  });

  res.json({ items });
});

router.post("/chat/rooms/:id/messages", async (req, res) => {
  if (!isObjectId(req.params.id)) return invalidId(res);

  const room = await ChatRoom.findById(req.params.id);
  if (!room) return invalidId(res);
  if (room.archived) {
    return res.status(409).json({ message: "This room is archived" });
  }

  const body = req.body || {};
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (content.length < 1 || content.length > MAX_MESSAGE_LENGTH) {
    return res
      .status(400)
      .json({
        message: `Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters`,
      });
  }

  const authorEmail =
    typeof body.authorEmail === "string"
      ? body.authorEmail.trim().toLowerCase()
      : "";
  if (!authorEmail) {
    return res.status(400).json({ message: "authorEmail is required" });
  }

  const author = await User.findOne({ email: authorEmail });
  if (!author) {
    return res.status(400).json({ message: "Author not found" });
  }

  let parentId = null;
  if (
    body.parentId !== undefined &&
    body.parentId !== null &&
    body.parentId !== ""
  ) {
    if (!isObjectId(body.parentId)) {
      return res.status(400).json({ message: "Invalid parent message" });
    }
    const parent = await ChatMessage.findById(body.parentId).lean();
    if (!parent || String(parent.roomId) !== String(room._id)) {
      return res
        .status(400)
        .json({ message: "Parent message must belong to this room" });
    }
    if (parent.parentId) {
      return res
        .status(400)
        .json({ message: "Replies to replies are not supported" });
    }
    parentId = parent._id;
  }

  const message = await ChatMessage.create({
    roomId: String(room._id),
    userId: author._id,
    username: author.name,
    content,
    ...(parentId ? { parentId } : {}),
  });

  if (parentId) {
    await ChatMessage.updateOne({ _id: parentId }, { $inc: { replyCount: 1 } });
  }

  await message.populate({ path: "userId", select: "name avatar role" });
  const item = serializeMessage(message.toObject());

  // Keep the live support chat in sync with messages posted from the CRM.
  const io = req.app.get("io");
  if (io) {
    io.to(String(room._id)).emit("message:new", {
      ...message.toObject(),
      _id: message._id,
      userId: author._id,
      username: author.name,
      author: {
        _id: author._id,
        name: author.name,
        avatar: author.avatar,
        role: author.role,
      },
    });
  }

  res.status(201).json({ message: item });
});

// ==================== BILLING ====================

function serializeBillingItem(user) {
  const subscription = user.subscription || {};
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    plan: subscription.plan || "free",
    status: subscription.status || "active",
    currentPeriodEnd: iso(subscription.currentPeriodEnd),
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd === true,
    createdAt: iso(user.createdAt),
  };
}

router.get("/billing", async (req, res) => {
  const { page, pageSize, skip } = pagination(req.query);

  const [items, total, planRows, active, pastDue, canceling] =
    await Promise.all([
      User.find({})
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      User.countDocuments({}),
      User.aggregate([
        {
          $group: {
            _id: { $ifNull: ["$subscription.plan", "free"] },
            count: { $sum: 1 },
          },
        },
      ]),
      User.countDocuments({ "subscription.status": "active" }),
      User.countDocuments({ "subscription.status": "past_due" }),
      User.countDocuments({ "subscription.cancelAtPeriodEnd": true }),
    ]);

  const plans = { free: 0, basic: 0, pro: 0, enterprise: 0 };
  for (const row of planRows) {
    if (Object.prototype.hasOwnProperty.call(plans, row._id)) {
      plans[row._id] = row.count;
    }
  }

  res.json({
    summary: { total, active, pastDue, canceling, plans },
    items: items.map(serializeBillingItem),
    page,
    pageSize,
    total,
  });
});

// ==================== DEMOS ====================

router.get("/demos", async (_req, res) => {
  res.json({ items: await demoItems() });
});

// ==================== SETTINGS ====================

router.get("/settings", (_req, res) => {
  const state = integrationState();
  const websiteUrl = (process.env.FRONTEND_URL || "").trim();
  const crmUrl = (process.env.CRM_URL || "").trim().replace(/\/+$/, "");

  const integrations = [
    { key: "mongo", label: "MongoDB", status: state.mongo },
    {
      key: "email",
      label: "Email delivery",
      status: state.email,
      detail:
        state.email === "enabled"
          ? null
          : "Set EMAIL_ENABLED=true and the mail credentials to send email.",
    },
    {
      key: "crmIntake",
      label: "CRM contact intake",
      status: state.crmIntake === "configured" ? "configured" : "missing",
      detail:
        state.crmIntake === "configured"
          ? null
          : "Set CRM_INTAKE_URL and CRM_INTAKE_SECRET to forward inquiries.",
    },
    {
      key: "crmHandoff",
      label: "CRM login handoff",
      status: state.crmHandoff === "configured" ? "configured" : "missing",
      detail:
        state.crmHandoff === "configured"
          ? null
          : "Set CRM_URL to enable the one-time CRM login handoff.",
    },
  ];

  const links = [];
  if (websiteUrl) links.push({ label: "Website", url: websiteUrl });
  if (crmUrl) links.push({ label: "CRM", url: crmUrl });

  res.json({ integrations, links });
});

// ==================== ONE-TIME HANDOFF ====================

function readCode(body) {
  const code = body && typeof body.code === "string" ? body.code.trim() : "";
  return code.length > 0 && code.length <= 512 ? code : null;
}

function handoffPayload(handoff, user) {
  return {
    websiteUserId: String(user._id),
    email: user.email,
    name: user.name,
    isVerified: !!user.isVerified,
    crmAccess: user.access?.canAccessCrm === true,
    expiresAt: iso(handoff.expiresAt),
  };
}

async function activeHandoffUser(handoff) {
  const user = await User.findById(handoff.userId);
  if (!user) return { user: null, status: 401 };
  if (!user.isVerified || !user.access?.canAccessCrm)
    return { user: null, status: 403 };
  if (user.isActive === false) return { user: null, status: 403 };
  return { user, status: 200 };
}

router.post("/sso/inspect", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const code = readCode(req.body);
  if (!code)
    return res.status(400).json({ message: "A handoff code is required" });

  const handoff = await CrmHandoff.findOne({ codeHash: hashToken(code) });
  if (!handoff || handoff.usedAt || handoff.expiresAt <= new Date()) {
    return res.status(401).json({ message: "Invalid or expired handoff code" });
  }

  const { user, status } = await activeHandoffUser(handoff);
  if (!user) {
    return res
      .status(status)
      .json({ message: "This account is not eligible for CRM access" });
  }

  // Inspect never marks the code used.
  res.json(handoffPayload(handoff, user));
});

router.post("/sso/consume", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const code = readCode(req.body);
  if (!code)
    return res.status(400).json({ message: "A handoff code is required" });

  // Atomic single-use claim: only one concurrent request can match usedAt null.
  const handoff = await CrmHandoff.findOneAndUpdate(
    {
      codeHash: hashToken(code),
      usedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { $set: { usedAt: new Date() } },
    { new: false },
  );

  if (!handoff) {
    return res.status(401).json({ message: "Invalid or expired handoff code" });
  }

  const { user, status } = await activeHandoffUser(handoff);
  if (!user) {
    return res
      .status(status)
      .json({ message: "This account is not eligible for CRM access" });
  }

  res.json(handoffPayload(handoff, user));
});

module.exports = router;
