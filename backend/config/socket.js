const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

/**
 * Initialize Socket.io with the HTTP server.
 * Sets up JWT-based auth middleware and connection handlers.
 */
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── Socket Auth Middleware ──────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error: No token provided'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.user = decoded; // Attach user payload to socket
      next();
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // ── Connection Handler ─────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { userId, tenantId } = socket.user;
    console.log(`🔌 Socket connected: userId=${userId} tenantId=${tenantId}`);

    // Join tenant-specific and user-specific rooms for targeted events
    socket.join(`tenant:${tenantId}`);
    socket.join(`user:${userId}`);

    // ── Chat Events ──────────────────────────────────────────────────────────
    socket.on('chat:sendMessage', (data) => {
      // Broadcast to all members in the conversation room
      io.to(`conversation:${data.conversationId}`).emit('chat:newMessage', {
        ...data,
        senderId: userId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('chat:joinConversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('chat:leaveConversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: userId=${userId}`);
    });
  });

  console.log('✅ Socket.io initialized');
  return io;
};

/** Get the active io instance (for use in controllers/services) */
const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initializeSocket, getIO };
