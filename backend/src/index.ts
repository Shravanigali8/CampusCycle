import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import cors from 'cors';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import campusRoutes from './routes/campuses';
import listingRoutes from './routes/listings';
import conversationRoutes from './routes/conversations';
import reportRoutes from './routes/reports';
import blockRoutes from './routes/blocks';
import prisma from './prisma';
import path from 'path';
import jwt from 'jsonwebtoken';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/campuses', campusRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/blocks', blockRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// HTTP server
const server = http.createServer(app);

// Socket.IO setup
const io = new IOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO authentication middleware
io.use(async (socket: any, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const payload: any = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { campus: true },
    });

    if (!user || !user.isVerified) {
      return next(new Error('Authentication error'));
    }

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket: any) => {
  console.log('Socket connected:', socket.user.email, socket.id);

  // Join threads the user is part of
  socket.on('join-threads', async () => {
    const threads = await prisma.chatThread.findMany({
      where: {
        OR: [{ buyerId: socket.user.id }, { sellerId: socket.user.id }],
      },
      select: { id: true },
    });

    threads.forEach((thread) => {
      socket.join(`thread:${thread.id}`);
    });
  });

  // Join a specific thread
  socket.on('join-thread', (threadId: string) => {
    socket.join(`thread:${threadId}`);
  });

  // Handle new message
  socket.on('message', async (payload: { threadId: string; body: string }) => {
    try {
      const { threadId, body } = payload;

      // Verify user is part of thread
      const thread = await prisma.chatThread.findUnique({
        where: { id: threadId },
      });

      if (!thread) {
        return socket.emit('error', { message: 'Thread not found' });
      }

      if (thread.buyerId !== socket.user.id && thread.sellerId !== socket.user.id) {
        return socket.emit('error', { message: 'Not authorized' });
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          threadId,
          senderId: socket.user.id,
          body,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      // Update thread updatedAt
      await prisma.chatThread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      });

      // Emit to all clients in the thread room
      io.to(`thread:${threadId}`).emit('message', message);
    } catch (err) {
      console.error('Socket message error:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Mark messages as read
  socket.on('mark-read', async (payload: { threadId: string }) => {
    try {
      const { threadId } = payload;

      const thread = await prisma.chatThread.findUnique({
        where: { id: threadId },
      });

      if (!thread || (thread.buyerId !== socket.user.id && thread.sellerId !== socket.user.id)) {
        return;
      }

      await prisma.message.updateMany({
        where: {
          threadId,
          senderId: { not: socket.user.id },
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      io.to(`thread:${threadId}`).emit('messages-read', { threadId, userId: socket.user.id });
    } catch (err) {
      console.error('Mark read error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`🚀 Backend server running on port ${port}`);
  console.log(`📡 Socket.IO server ready`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
