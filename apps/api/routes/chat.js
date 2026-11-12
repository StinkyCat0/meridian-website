// apps/api/routes/chat.js - Support chat rooms, threaded messages, reactions, uploads.
const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');

const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const { protect, admin } = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// 20 uploads per IP per 10 minutes (the limiter self-disables in tests/dev).
const uploadLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });

const MAX_MESSAGE_LENGTH = 2000;
const MAX_ATTACHMENTS = 10;
const DEFAULT_MESSAGE_LIMIT = 50;
const MAX_MESSAGE_LIMIT = 100;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
// The stored extension is derived from the trusted MIME type, never from the
// client-supplied filename (which could otherwise install an .html file).
const ALLOWED_UPLOADS = {
  'image/jpeg': { type: 'image', extension: '.jpg' },
  'image/png': { type: 'image', extension: '.png' },
  'image/gif': { type: 'image', extension: '.gif' },
  'application/pdf': { type: 'pdf', extension: '.pdf' },
};
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set(
  Object.values(ALLOWED_UPLOADS).map((upload) => upload.extension),
);
const SAFE_UPLOAD_BASENAME = /^[A-Za-z0-9._-]+$/;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const extension = ALLOWED_UPLOADS[file.mimetype]?.extension || '';
    const random = Math.round(Math.random() * 1e9);
    cb(null, `${Date.now()}-${random}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_UPLOADS[file.mimetype]) {
      const error = new Error('Only JPEG, PNG, GIF images and PDF files are allowed');
      error.status = 400;
      return cb(error);
    }
    return cb(null, true);
  },
});

function removeFile(filePath) {
  if (!filePath) return;
  fs.promises.unlink(filePath).catch(() => {});
}

function uploadSingleFile(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) return next();

    removeFile(req.file?.path);
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : error.status || 400;
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'File must be 10MB or smaller'
        : error.message || 'Upload failed';
    return res.status(status).json({ message });
  });
}

function isObjectId(value) {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

function invalidId(res, label = 'id') {
  return res.status(400).json({ message: `Invalid ${label}` });
}

function requireChatAccess(req, res, next) {
  if (req.user.role !== 'admin' && req.user.access?.canAccessChat === false) {
    return res.status(403).json({ message: 'Chat access is disabled' });
  }
  return next();
}

router.use(protect, requireChatAccess);

function normalizeContent(value) {
  if (typeof value !== 'string') return null;
  const content = value.trim();
  if (content.length === 0 || content.length > MAX_MESSAGE_LENGTH) return null;
  return content;
}

function uploadPrefixes() {
  const base = (process.env.PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
  const prefixes = ['/uploads/'];
  if (base) prefixes.push(`${base}/uploads/`);
  return prefixes;
}

// Attachments may only point at files this API serves from /uploads. The
// basename must be a single safe path segment with a whitelisted extension.
function isAllowedUploadUrl(value) {
  if (typeof value !== 'string') return false;

  const prefix = uploadPrefixes().find((candidate) => value.startsWith(candidate));
  if (!prefix) return false;

  const basename = value.slice(prefix.length);
  if (!SAFE_UPLOAD_BASENAME.test(basename)) return false;

  return ALLOWED_ATTACHMENT_EXTENSIONS.has(path.extname(basename).toLowerCase());
}

function normalizeAttachments(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return null;
  if (value.length > MAX_ATTACHMENTS) return null;

  const normalized = [];

  for (const attachment of value) {
    const source = attachment && typeof attachment === 'object' ? attachment : {};

    if (!isAllowedUploadUrl(source.url)) return null;

    const type = ['image', 'file', 'video', 'pdf'].includes(source.type)
      ? source.type
      : 'file';
    const item = {
      url: source.url,
      filename: typeof source.filename === 'string' ? source.filename : '',
      type,
      size: Number.isFinite(Number(source.size)) ? Number(source.size) : 0,
    };

    if (source.previewUrl !== undefined && source.previewUrl !== null) {
      if (!isAllowedUploadUrl(source.previewUrl)) return null;
      item.previewUrl = source.previewUrl;
    }

    normalized.push(item);
  }

  return normalized;
}

// Populated authors are exposed as `author`, while `userId` stays an ObjectId
// string so the existing React client can compare it with the signed-in user.
function serializeMessage(raw) {
  const message = { ...raw };
  if (message.userId && typeof message.userId === 'object' && message.userId.name !== undefined) {
    const author = message.userId;
    message.userId = author._id;
    message.author = {
      _id: author._id,
      name: author.name,
      avatar: author.avatar,
      role: author.role,
    };
  }
  delete message.__v;
  return message;
}

function serializeMessages(messages) {
  return messages.map((message) => {
    const serialized = serializeMessage(message);
    if (Array.isArray(message.replies)) {
      serialized.replies = message.replies.map(serializeMessage);
    }
    return serialized;
  });
}

function emitToRoom(req, roomId, event, payload) {
  const io = req.app.get('io');
  if (io) io.to(String(roomId)).emit(event, payload);
}

async function populateMessage(message) {
  await message.populate({ path: 'userId', select: 'name avatar role' });
  return serializeMessage(message.toObject({ virtuals: true }));
}

async function loadReplies(parentId) {
  const replies = await ChatMessage.find({ parentId })
    .sort({ createdAt: 1 })
    .populate({ path: 'userId', select: 'name avatar role' })
    .lean();
  return replies.map(serializeMessage);
}

async function collectDescendantIds(rootId) {
  const ids = [];
  let frontier = [rootId];

  while (frontier.length > 0) {
    const children = await ChatMessage.find({ parentId: { $in: frontier } })
      .select('_id')
      .lean();
    const childIds = children.map((child) => child._id);
    if (childIds.length === 0) break;
    ids.push(...childIds);
    frontier = childIds;
  }

  return ids;
}

function roomRefusal(room, user, res, { checkReadOnly = true } = {}) {
  if (user.role === 'admin') return false;
  if (room.archived) {
    res.status(403).json({ message: 'This room is archived' });
    return true;
  }
  if (checkReadOnly && room.isReadOnly) {
    res.status(403).json({ message: 'This room is read-only' });
    return true;
  }
  return false;
}

async function createMessage({ req, res, room, content, attachments, parentId }) {
  const message = await ChatMessage.create({
    roomId: String(room._id),
    userId: req.user._id,
    username: req.user.name,
    content,
    attachments,
    ...(parentId ? { parentId } : {}),
  });

  if (parentId) {
    await ChatMessage.updateOne({ _id: parentId }, { $inc: { replyCount: 1 } });
  }

  const payload = await populateMessage(message);
  if (!parentId) payload.replies = [];
  emitToRoom(req, room._id, 'message:new', payload);
  return res.status(201).json(payload);
}

// ==================== ROOMS ====================

// GET /api/chat/rooms - active rooms for the sidebar
router.get('/rooms', async (_req, res) => {
  const rooms = await ChatRoom.find({ archived: { $ne: true } }).sort({
    createdAt: 1,
    _id: 1,
  });
  res.json(rooms);
});

// POST /api/chat/rooms - create a room (admin only)
router.post('/rooms', admin, async (req, res) => {
  const { name, description, isReadOnly } = req.body || {};

  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ message: 'Room name is required' });
  }
  if (name.trim().length > 80) {
    return res.status(400).json({ message: 'Room name cannot exceed 80 characters' });
  }
  if (description !== undefined && (typeof description !== 'string' || description.length > 300)) {
    return res.status(400).json({ message: 'Description cannot exceed 300 characters' });
  }

  const room = await ChatRoom.create({
    name: name.trim(),
    description: description ? description.trim() : '',
    isReadOnly: isReadOnly === true,
    createdBy: req.user._id,
  });

  res.status(201).json(room);
});

// PUT /api/chat/rooms/:id - update room metadata (admin only)
router.put('/rooms/:id', admin, async (req, res) => {
  if (!isObjectId(req.params.id)) return invalidId(res);

  const room = await ChatRoom.findById(req.params.id);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  const { name, description, isReadOnly } = req.body || {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Room name is required' });
    }
    if (name.trim().length > 80) {
      return res.status(400).json({ message: 'Room name cannot exceed 80 characters' });
    }
    room.name = name.trim();
  }

  if (description !== undefined) {
    if (typeof description !== 'string' || description.length > 300) {
      return res.status(400).json({ message: 'Description cannot exceed 300 characters' });
    }
    room.description = description.trim();
  }

  if (isReadOnly !== undefined) {
    room.isReadOnly = isReadOnly === true;
  }

  await room.save();
  res.json(room);
});

// DELETE /api/chat/rooms/:id - archive a room, keeping its messages
router.delete('/rooms/:id', admin, async (req, res) => {
  if (!isObjectId(req.params.id)) return invalidId(res);

  const room = await ChatRoom.findById(req.params.id);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  room.archived = true;
  await room.save();
  res.json({ message: 'Room archived' });
});

// ==================== MESSAGES ====================

// GET /api/chat/:roomId/messages - top-level messages with their replies
router.get('/:roomId/messages', async (req, res) => {
  if (!isObjectId(req.params.roomId)) return invalidId(res, 'roomId');

  const room = await ChatRoom.findById(req.params.roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (roomRefusal(room, req.user, res, { checkReadOnly: false })) return undefined;

  let limit = Number.parseInt(req.query.limit, 10);
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_MESSAGE_LIMIT;
  limit = Math.min(limit, MAX_MESSAGE_LIMIT);

  let before;
  if (req.query.before !== undefined) {
    before = new Date(req.query.before);
    if (Number.isNaN(before.getTime())) {
      return res.status(400).json({ message: 'Invalid before date' });
    }
  }

  const includeReplies = req.query.includeReplies !== 'false';
  const messages = await ChatMessage.findByRoom(req.params.roomId, {
    limit,
    before,
    includeReplies,
  });

  const serialized = serializeMessages(messages);
  if (!includeReplies) {
    serialized.forEach((message) => {
      message.replies = [];
    });
  }
  res.json(serialized);
});

// POST /api/chat/:roomId/messages - post a message or reply
router.post('/:roomId/messages', async (req, res) => {
  if (!isObjectId(req.params.roomId)) return invalidId(res, 'roomId');

  const room = await ChatRoom.findById(req.params.roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (roomRefusal(room, req.user, res)) return undefined;

  const content = normalizeContent(req.body?.content);
  if (!content) {
    return res
      .status(400)
      .json({ message: `Content must be between 1 and ${MAX_MESSAGE_LENGTH} characters` });
  }

  const attachments = normalizeAttachments(req.body?.attachments);
  if (!attachments) {
    return res.status(400).json({ message: 'Invalid attachments' });
  }

  let parentId;
  if (req.body?.parentId !== undefined && req.body?.parentId !== null) {
    if (!isObjectId(req.body.parentId)) return invalidId(res, 'parentId');
    const parent = await ChatMessage.findById(req.body.parentId);
    if (!parent || String(parent.roomId) !== String(room._id)) {
      return res.status(400).json({ message: 'Parent message not found in this room' });
    }
    if (parent.parentId) {
      return res.status(400).json({ message: 'Replies to replies are not supported' });
    }
    parentId = parent._id;
  }

  return createMessage({ req, res, room, content, attachments, parentId });
});

// POST /api/chat/messages/:id/reply - reply using the parent message's room
router.post('/messages/:id/reply', async (req, res) => {
  if (!isObjectId(req.params.id)) return invalidId(res);

  const parent = await ChatMessage.findById(req.params.id);
  if (!parent) return res.status(404).json({ message: 'Message not found' });
  if (parent.parentId) {
    return res.status(400).json({ message: 'Replies to replies are not supported' });
  }

  const room = await ChatRoom.findById(parent.roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (roomRefusal(room, req.user, res)) return undefined;

  const content = normalizeContent(req.body?.content);
  if (!content) {
    return res
      .status(400)
      .json({ message: `Content must be between 1 and ${MAX_MESSAGE_LENGTH} characters` });
  }

  const attachments = normalizeAttachments(req.body?.attachments);
  if (!attachments) {
    return res.status(400).json({ message: 'Invalid attachments' });
  }

  return createMessage({
    req,
    res,
    room,
    content,
    attachments,
    parentId: parent._id,
  });
});

// PUT /api/chat/messages/:id - edit own message (admins may edit any)
router.put('/messages/:id', async (req, res) => {
  if (!isObjectId(req.params.id)) return invalidId(res);

  const message = await ChatMessage.findById(req.params.id);
  if (!message) return res.status(404).json({ message: 'Message not found' });

  const room = await ChatRoom.findById(message.roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (roomRefusal(room, req.user, res)) return undefined;

  const isAuthor =
    message.userId && String(message.userId) === String(req.user._id);
  if (!isAuthor && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You can only edit your own messages' });
  }

  const content = normalizeContent(req.body?.content);
  if (!content) {
    return res
      .status(400)
      .json({ message: `Content must be between 1 and ${MAX_MESSAGE_LENGTH} characters` });
  }

  message.content = content;
  message.edited = true;
  message.editedAt = new Date();
  await message.save();

  const payload = await populateMessage(message);
  if (!message.parentId) {
    payload.replies = await loadReplies(message._id);
    payload.replyCount = payload.replies.length;
  }
  emitToRoom(req, message.roomId, 'message:updated', payload);
  res.json(payload);
});

// DELETE /api/chat/messages/:id - delete own message and its replies
router.delete('/messages/:id', async (req, res) => {
  if (!isObjectId(req.params.id)) return invalidId(res);

  const message = await ChatMessage.findById(req.params.id);
  if (!message) return res.status(404).json({ message: 'Message not found' });

  const room = await ChatRoom.findById(message.roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (roomRefusal(room, req.user, res)) return undefined;

  const isAuthor =
    message.userId && String(message.userId) === String(req.user._id);
  if (!isAuthor && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You can only delete your own messages' });
  }

  const roomId = String(message.roomId);
  const parentId = message.parentId;

  const descendantIds = await collectDescendantIds(message._id);
  await ChatMessage.deleteMany({ _id: { $in: [message._id, ...descendantIds] } });

  if (parentId) {
    await ChatMessage.updateOne(
      { _id: parentId, replyCount: { $gt: 0 } },
      { $inc: { replyCount: -1 } },
    );
  }

  emitToRoom(req, roomId, 'message:deleted', { id: String(message._id), roomId });
  res.json({ message: 'Message deleted' });
});

// POST /api/chat/messages/:id/react - toggle the current user's reaction
router.post('/messages/:id/react', async (req, res) => {
  if (!isObjectId(req.params.id)) return invalidId(res);

  const emoji = typeof req.body?.emoji === 'string' ? req.body.emoji.trim() : '';
  if (emoji.length < 1 || emoji.length > 8) {
    return res.status(400).json({ message: 'Emoji must be between 1 and 8 characters' });
  }

  const message = await ChatMessage.findById(req.params.id);
  if (!message) return res.status(404).json({ message: 'Message not found' });

  const room = await ChatRoom.findById(message.roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (roomRefusal(room, req.user, res)) return undefined;

  const userId = req.user._id;
  let reaction = message.reactions.find((entry) => entry.emoji === emoji);

  if (!reaction) {
    message.reactions.push({ emoji, userIds: [userId] });
  } else {
    const hasReacted = reaction.userIds.some(
      (id) => String(id) === String(userId),
    );
    if (hasReacted) {
      reaction.userIds.pull(userId);
      if (reaction.userIds.length === 0) {
        message.reactions.pull(reaction._id);
      }
    } else {
      reaction.userIds.push(userId);
    }
  }

  await message.save();

  const reactions = message.reactions.map((entry) => ({
    emoji: entry.emoji,
    userIds: entry.userIds,
  }));
  const roomId = String(message.roomId);

  emitToRoom(req, roomId, 'reaction:updated', {
    messageId: String(message._id),
    reactions,
    roomId,
  });

  res.json({ messageId: String(message._id), reactions, roomId });
});

// ==================== UPLOADS ====================

// POST /api/chat/upload - accept a single image or PDF attachment
router.post('/upload', uploadLimiter, uploadSingleFile, (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const baseUrl = (process.env.PUBLIC_API_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/uploads/${req.file.filename}`;
  const type = ALLOWED_UPLOADS[req.file.mimetype]?.type || 'file';

  res.json({
    attachment: {
      url,
      filename: req.file.originalname,
      type,
      size: req.file.size,
      previewUrl: type === 'image' ? url : null,
    },
  });
});

module.exports = router;
