import express from 'express';
import prisma from '../prisma';
import { authRequired, AuthedRequest, adminRequired } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const createReportSchema = z.object({
  listingId: z.string().uuid().optional(),
  targetUserId: z.string().uuid().optional(),
  reason: z.string().min(1).max(1000),
}).refine((data) => data.listingId || data.targetUserId, {
  message: 'Either listingId or targetUserId must be provided',
});

// POST /reports - Create a report
router.post('/', authRequired, async (req: AuthedRequest, res) => {
  try {
    const body = createReportSchema.parse(req.body);
    const { listingId, targetUserId, reason } = body;

    // Verify listing exists if provided
    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
      });
      if (!listing || listing.campusId !== req.user.campusId) {
        return res.status(404).json({ error: 'Listing not found' });
      }
    }

    // Verify target user exists if provided
    if (targetUserId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
      });
      if (!targetUser || targetUser.campusId !== req.user.campusId) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (targetUserId === req.user.id) {
        return res.status(400).json({ error: 'Cannot report yourself' });
      }
    }

    const report = await prisma.report.create({
      data: {
        reporterId: req.user.id,
        listingId: listingId || null,
        targetUserId: targetUserId || null,
        reason,
      },
    });

    res.status(201).json({ report });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error('Create report error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /reports - List all reports (admin only)
router.get('/', authRequired, adminRequired, async (req: AuthedRequest, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ reports });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

