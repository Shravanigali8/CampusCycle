import express from 'express';
import prisma from '../prisma';
import { authRequired, AuthedRequest } from '../middleware/auth';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const router = express.Router();

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  gradYear: z.number().int().min(1900).max(2100).optional(),
  avatar: z.string().url().optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

// GET /users/me
router.get('/me', authRequired, async (req: AuthedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        campus: true,
        gradYear: true,
        avatar: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /users/me
router.patch('/me', authRequired, async (req: AuthedRequest, res) => {
  try {
    const body = updateUserSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: body,
      select: {
        id: true,
        email: true,
        name: true,
        campus: true,
        gradYear: true,
        avatar: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /users/me/password
router.post('/me/password', authRequired, async (req: AuthedRequest, res) => {
  try {
    const body = updatePasswordSchema.parse(req.body);
    const { currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: 'No password set' });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    res.json({ ok: true, message: 'Password updated successfully' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error('Update password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /users/me/listings
router.get('/me/listings', authRequired, async (req: AuthedRequest, res) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { sellerId: req.user.id },
      include: {
        images: true,
        seller: {
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

    res.json({ listings });
  } catch (err) {
    console.error('Get my listings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
