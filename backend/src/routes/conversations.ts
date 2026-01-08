import express from 'express';
import prisma from '../prisma';
import { authRequired, AuthedRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const createThreadSchema = z.object({
  listingId: z.string().uuid(),
});

const sendMessageSchema = z.object({
  body: z.string().min(1).max(5000),
});

// GET /conversations - List all threads for current user
router.get('/', authRequired, async (req: AuthedRequest, res) => {
  try {
    const userId = req.user.id;

    const threads = await prisma.chatThread.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        listing: {
          include: {
            images: { take: 1 },
            seller: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate unread counts
    const threadsWithUnread = await Promise.all(
      threads.map(async (thread) => {
        const unreadCount = await prisma.message.count({
          where: {
            threadId: thread.id,
            senderId: { not: userId },
            readAt: null,
          },
        });

        return {
          ...thread,
          unreadCount,
        };
      })
    );

    res.json({ threads: threadsWithUnread });
  } catch (err) {
    console.error('Get threads error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /conversations - Create or get thread for a listing
router.post('/', authRequired, async (req: AuthedRequest, res) => {
  try {
    const body = createThreadSchema.parse(req.body);
    const { listingId } = body;

    // Verify listing exists and is in same campus
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: true },
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.campusId !== req.user.campusId) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.sellerId === req.user.id) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    // Find or create thread
    let thread = await prisma.chatThread.findUnique({
      where: {
        listingId_buyerId: {
          listingId,
          buyerId: req.user.id,
        },
      },
      include: {
        listing: {
          include: {
            images: { take: 1 },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!thread) {
      thread = await prisma.chatThread.create({
        data: {
          listingId,
          buyerId: req.user.id,
          sellerId: listing.sellerId,
        },
        include: {
          listing: {
            include: {
              images: { take: 1 },
            },
          },
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });
    }

    res.json({ thread });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error('Create thread error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /conversations/:id/messages - Get messages for a thread
router.get('/:id/messages', authRequired, async (req: AuthedRequest, res) => {
  try {
    const thread = await prisma.chatThread.findUnique({
      where: { id: req.params.id },
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Only participants can view messages
    if (thread.buyerId !== req.user.id && thread.sellerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const messages = await prisma.message.findMany({
      where: { threadId: thread.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ messages });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /conversations/:id/messages - Send a message
router.post('/:id/messages', authRequired, async (req: AuthedRequest, res) => {
  try {
    const body = sendMessageSchema.parse(req.body);
    const thread = await prisma.chatThread.findUnique({
      where: { id: req.params.id },
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Only participants can send messages
    if (thread.buyerId !== req.user.id && thread.sellerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const message = await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId: req.user.id,
        body: body.body,
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
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    });

    res.status(201).json({ message });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /conversations/:id/read - Mark messages as read
router.post('/:id/read', authRequired, async (req: AuthedRequest, res) => {
  try {
    const thread = await prisma.chatThread.findUnique({
      where: { id: req.params.id },
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Only participants can mark as read
    if (thread.buyerId !== req.user.id && thread.sellerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Mark all messages from other user as read
    await prisma.message.updateMany({
      where: {
        threadId: thread.id,
        senderId: { not: req.user.id },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
