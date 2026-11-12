// backend/models/ChatMessage.js - Clean ChatMessage Schema (No Duplicate Indexes)
const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  // Room/Channel
  roomId: {
    type: String,
    required: true,
    index: true, // ← Field-level index (clean)
  },
  
  // Author
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: { 
    type: String, 
    required: true, 
    trim: true,
    index: true // ← Field-level index (clean)
  },
  
  // Content
  content: { 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 2000 
  },
  
  // Attachments (files, images)
  attachments: [{
    url: String,
    filename: String,
    type: { type: String, enum: ['image', 'file', 'video', 'pdf'] },
    size: Number,
    previewUrl: String, // For image thumbnails
    uploadedAt: { type: Date, default: Date.now },
  }],
  
  // Threading/Replies
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ChatMessage',
    index: true // ← Field-level index (clean)
  },
  replyCount: { type: Number, default: 0 },
  
  // Edit tracking
  edited: { type: Boolean, default: false },
  editedAt: Date,
  
  // Reactions
  reactions: [{
    emoji: { 
      type: String, 
      required: true,
      index: true // ← Field-level index (clean)
    },
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  }],
  
  // Message permissions (override defaults)
  canEdit: { type: Boolean, default: true },
  canDelete: { type: Boolean, default: true },
  
  // Timestamps
  sentAt: { type: Date, default: Date.now },
  deliveredAt: Date,
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { 
  timestamps: true, // Adds createdAt + updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Virtual: Formatted time for display
chatMessageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
});

// ✅ Virtual: Full timestamp for tooltip
chatMessageSchema.virtual('fullTimestamp').get(function() {
  return this.createdAt.toLocaleString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
    hour12: true 
  });
});

// ✅ Virtual: Has any reactions?
chatMessageSchema.virtual('hasReactions').get(function() {
  return this.reactions?.length > 0;
});

// ✅ Virtual: Is this a reply?
chatMessageSchema.virtual('isReply').get(function() {
  return !!this.parentId;
});

// ✅ Method: Add a reaction
chatMessageSchema.methods.addReaction = function(emoji, userId) {
  const reaction = this.reactions?.find(r => r.emoji === emoji);
  
  if (reaction) {
    if (!reaction.userIds.some(id => id.toString() === userId.toString())) {
      reaction.userIds.push(userId);
    }
  } else {
    if (!this.reactions) this.reactions = [];
    this.reactions.push({ emoji, userIds: [userId] });
  }
  
  return this.save();
};

// ✅ Method: Remove a reaction
chatMessageSchema.methods.removeReaction = function(emoji, userId) {
  if (!this.reactions) return this.save();
  
  const reaction = this.reactions.find(r => r.emoji === emoji);
  if (!reaction) return this.save();
  
  reaction.userIds = reaction.userIds.filter(id => id.toString() !== userId.toString());
  
  // Remove empty reactions
  this.reactions = this.reactions.filter(r => r.userIds.length > 0);
  
  return this.save();
};

// ✅ Method: Increment reply count
chatMessageSchema.methods.incrementReplyCount = function() {
  this.replyCount = (this.replyCount || 0) + 1;
  return this.save();
};

// ✅ Static: Get messages for a room with optional threading
chatMessageSchema.statics.findByRoom = async function(roomId, options = {}) {
  const { 
    limit = 50, 
    before, 
    includeReplies = true,
    populateUser = true 
  } = options;
  
  const query = { roomId };
  if (!includeReplies) {
    query.parentId = { $exists: false };
  }
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }
  
  let chain = this.find(query).sort({ createdAt: -1 }).limit(limit);
  
  if (populateUser) {
    chain = chain.populate('userId', 'name avatar role');
  }
  
  const messages = await chain.lean();
  
  // If including replies, fetch and group them
  if (includeReplies) {
    const topLevel = messages.filter(m => !m.parentId);
    const parentIds = topLevel.map(m => m._id);
    
    if (parentIds.length > 0) {
      const replies = await this.find({ 
        roomId, 
        parentId: { $in: parentIds } 
      })
      .populate('userId', 'name avatar')
      .sort({ createdAt: 1 })
      .lean();
      
      // Group replies under parents
      return topLevel.map(msg => ({
        ...msg,
        replies: replies.filter(r => r.parentId?.toString() === msg._id.toString()),
        replyCount: replies.filter(r => r.parentId?.toString() === msg._id.toString()).length
      })).reverse();
    }
  }
  
  return messages.reverse();
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
