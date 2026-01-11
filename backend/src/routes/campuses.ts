import express from 'express';
import prisma from '../prisma';

const router = express.Router();

// GET /campuses
router.get('/', async (req, res) => {
  try {
    const campuses = await prisma.campus.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ campuses });
  } catch (err) {
    console.error('Get campuses error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

