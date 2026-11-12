// apps/api/routes/messages.js - Admin inbox for contact-form submissions.
const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

const STATUSES = ['new', 'read', 'archived'];

function invalidId(res) {
  return res.status(404).json({ message: 'Message not found' });
}

// GET /api/messages - list contact messages, newest first
router.get('/', protect, admin, async (req, res) => {
  const filter = {};

  if (req.query.status !== undefined) {
    if (!STATUSES.includes(req.query.status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    filter.status = req.query.status;
  }

  const messages = await Message.find(filter).sort({ createdAt: -1 });
  res.json(messages);
});

// PUT /api/messages/:id - update the status of a contact message
router.put('/:id', protect, admin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return invalidId(res);

  const status = req.body?.status === undefined ? 'read' : req.body.status;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const message = await Message.findById(req.params.id);
  if (!message) return invalidId(res);

  message.status = status;
  await message.save();
  res.json(message);
});

module.exports = router;
