// Socket.io handlers for support chat. Sockets use the same JWT and account
// state gates as the REST API, so a suspended user cannot keep a live channel.
const mongoose = require('mongoose');
const User = require('./models/User');
const ChatRoom = require('./models/ChatRoom');
const { verifyAuthToken } = require('./utils/tokens');

function roomIdOf(payload) {
  const roomId = payload && typeof payload === 'object' ? payload.roomId : undefined;
  return typeof roomId === 'string' && mongoose.isValidObjectId(roomId) ? roomId : null;
}

module.exports = function registerSocketHandlers(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = verifyAuthToken(token);
      const userId = decoded?.user?.id;
      if (!userId) return next(new Error('Authentication failed'));

      const user = await User.findById(userId).select('-password');
      if (!user || !user.isActive || user.isLocked) {
        return next(new Error('Authentication failed'));
      }
      if (user.access?.canLogin === false && user.role !== 'admin') {
        return next(new Error('Authentication failed'));
      }
      if (user.access?.canAccessChat === false && user.role !== 'admin') {
        return next(new Error('Chat access is disabled'));
      }

      socket.data.user = {
        id: String(user._id),
        name: user.name,
        role: user.role,
      };
      return next();
    } catch {
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('room:join', async (roomId) => {
      if (typeof roomId !== 'string' || !mongoose.isValidObjectId(roomId)) return;
      try {
        const room = await ChatRoom.findById(roomId).select('archived').lean();
        if (!room || (room.archived && socket.data.user?.role !== 'admin')) return;
        socket.join(roomId);
      } catch {
        // A malformed or deleted room simply does not join.
      }
    });

    socket.on('room:leave', (roomId) => {
      if (typeof roomId === 'string') socket.leave(roomId);
    });

    const typing = (event) => (payload) => {
      const roomId = roomIdOf(payload);
      if (!roomId) return;
      socket.to(roomId).emit(event, {
        roomId,
        username: socket.data.user?.name || 'Someone',
      });
    };

    socket.on('typing:start', typing('typing:show'));
    socket.on('typing:stop', typing('typing:hide'));
  });
};
