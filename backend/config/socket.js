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
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      console.warn('[Socket.io] Connection rejected: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      
      // Verify user in Database to prevent access via stale/revoked tokens (Defense-in-Depth)
      const User = require('../modules/auth/models/user.model');
      const user = await User.findOne({ _id: decoded.userId, tenantId: decoded.tenantId, isActive: true });
      if (!user) {
        console.warn(`[Socket.io] Connection rejected: User ${decoded.userId} not found or inactive`);
        return next(new Error('Authentication error: User not found or inactive'));
      }

      // Role Validation
      const allowedRoles = ['admin', 'teacher', 'student'];
      if (!allowedRoles.includes(user.role)) {
        console.warn(`[Socket.io] Connection rejected: Role "${user.role}" is not authorized`);
        return next(new Error('Authentication error: Unauthorized role'));
      }

      socket.user = {
        userId: String(user._id),
        role: user.role,
        tenantId: user.tenantId,
      };
      next();
    } catch (err) {
      console.error('[Socket.io] Authentication verification failed:', err.message);
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  // ── Connection Handler ─────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { userId, tenantId } = socket.user;
    console.log(`🔌 Socket connected: userId=${userId} tenantId=${tenantId}`);

    // Join tenant-specific and user-specific rooms for targeted events
    socket.join(`tenant:${tenantId}`);
    socket.join(`user:${userId}`);

    // Packet Middleware: Disconnect unauthorized clients immediately on event attempt
    socket.use(([event, ...args], next) => {
      if (!socket.user || !socket.user.userId || !socket.user.tenantId) {
        console.warn(`[Socket.io Security] Unauthorized packet blocked. Disconnecting socket: ${socket.id}`);
        socket.disconnect(true);
        return next(new Error('Unauthorized'));
      }
      next();
    });

    // ── Chat Events ──────────────────────────────────────────────────────────
    socket.on('chat:sendMessage', (data) => {
      // Validate conversationId payload
      if (!data || typeof data.conversationId !== 'string' || data.conversationId.includes('..') || data.conversationId.includes('*')) {
        console.warn(`[Socket.io Security] Invalid chat:sendMessage payload blocked from userId=${userId}`);
        return;
      }

      // Broadcast to members in the tenant-isolated conversation room
      io.to(`tenant:${tenantId}:conversation:${data.conversationId}`).emit('chat:newMessage', {
        ...data,
        senderId: userId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('chat:joinConversation', (conversationId) => {
      if (typeof conversationId !== 'string' || conversationId.includes('..') || conversationId.includes('*')) {
        console.warn(`[Socket.io Security] Invalid chat:joinConversation payload blocked from userId=${userId}`);
        return;
      }
      socket.join(`tenant:${tenantId}:conversation:${conversationId}`);
    });

    socket.on('chat:leaveConversation', (conversationId) => {
      if (typeof conversationId !== 'string' || conversationId.includes('..') || conversationId.includes('*')) {
        return;
      }
      socket.leave(`tenant:${tenantId}:conversation:${conversationId}`);
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
