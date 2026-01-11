import express from 'express';
import prisma from '../prisma';
import { authRequired, AuthedRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const blockUserSchema = z.object({
  userId: z.string().uuid(),
});

// POST /blocks - Block a user
router.post('/', authRequired, async (req: AuthedRequest, res) => {
  try {
    const body = blockUserSchema.parse(req.body);
    const { userId } = body;

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    // Verify user exists and is in same campus
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser || targetUser.campusId !== req.user.campusId) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already blocked
    const existing = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: req.user.id,
          blockedId: userId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'User already blocked' });
    }

    const block = await prisma.block.create({
      data: {
        blockerId: req.user.id,
        blockedId: userId,
      },
    });

    res.status(201).json({ block });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'User already blocked' });
    }
    console.error('Block user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /blocks/:userId - Unblock a user
router.delete('/:userId', authRequired, async (req: AuthedRequest, res) => {
  try {
    const { userId } = req.params;

    const block = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: req.user.id,
          blockedId: userId,
        },
      },
    });

    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }

    await prisma.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId: req.user.id,
          blockedId: userId,
        },
      },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Unblock user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /blocks - List blocked users
router.get('/', authRequired, async (req: AuthedRequest, res) => {
  try {
    const blocks = await prisma.block.findMany({
      where: { blockerId: req.user.id },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ blocks });
  } catch (err) {
    console.error('Get blocks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

