// backend/server.js - Production Server with Socket.io + Chat
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/meridian')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ Database Connection Error:', err));

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://meridianstudios.org',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/chat', require('./routes/chat')); // ← NEW: Chat routes

// Error middleware
const { errorHandler } = require('./middleware/errorMiddleware');
app.use(errorHandler);

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'https://meridianstudios.org',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store io instance for use in routes
app.set('io', io);

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Join a chat room
  socket.on('room:join', (roomId) => {
    socket.join(roomId);
    console.log(`📢 Socket ${socket.id} joined room: ${roomId}`);
  });
  
  // Leave a chat room
  socket.on('room:leave', (roomId) => {
    socket.leave(roomId);
  });
  
  // Typing indicator
  socket.on('typing:start', ({ roomId, username }) => {
    socket.to(roomId).emit('typing:show', { roomId, username });
  });
  
  socket.on('typing:stop', ({ roomId, username }) => {
    socket.to(roomId).emit('typing:hide', { roomId, username });
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 2000;
server.listen(PORT, () => {
  console.log(`✅ Server + Socket.io running on port ${PORT}`);
});
