const express = require('express');
const Message = require('../models/Message');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Get all messages (admin only)
router.get('/', protect, async (req, res) => {
  const messages = await Message.find().sort({ createdAt: -1 });
  res.json(messages);
});

// Mark message read
router.put('/:id', protect, async (req, res) => {
  const message = await Message.findById(req.params.id);
  if(!message) return res.status(404).json({ message: 'Message not found' });
  message.status = req.body.status || 'read';
  await message.save();
  res.json(message);
});

module.exports = router;

