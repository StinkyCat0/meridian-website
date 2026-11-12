const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  status: { type: String, enum: ['new', 'read', 'archived'], default: 'new' }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
