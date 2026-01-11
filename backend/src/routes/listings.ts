import express from 'express';
import prisma from '../prisma';
import { authRequired, AuthedRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { uploadFile } from '../utils/storage';

const router = express.Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5MB per file, max 5 files
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowed.test(file.mimetype);
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

const createListingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.string().min(1),
  condition: z.string().min(1),
  price: z.number().min(0),
  isGiveaway: z.boolean().optional().default(false),
  status: z.enum(['AVAILABLE', 'CLAIMED', 'SOLD']).optional().default('AVAILABLE'),
  location: z.string().optional(),
  zipcode: z.string().optional(),
  availableFrom: z.string().datetime().optional(),
  availableTo: z.string().datetime().optional(),
});

const updateListingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  category: z.string().min(1).optional(),
  condition: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  isGiveaway: z.boolean().optional(),
  status: z.enum(['AVAILABLE', 'CLAIMED', 'SOLD']).optional(),
  location: z.string().optional(),
  zipcode: z.string().optional(),
  availableFrom: z.string().datetime().optional(),
  availableTo: z.string().datetime().optional(),
});

// GET /listings - Search with filters
router.get('/', authRequired, async (req: AuthedRequest, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      condition,
      isGiveaway,
      status,
      q,
      zipcode,
      sort = 'newest',
      page = 1,
    } = req.query as any;

    // Get campusId from user - could be direct field or from campus relation
    let campusId = req.user.campusId;
    if (!campusId && req.user.campus) {
      campusId = req.user.campus.id;
    }
    
    if (!campusId) {
      return res.status(400).json({ error: 'User must have a campus assigned' });
    }

    const where: any = {
      campusId: campusId,
    };

    // Only show available listings by default (users can filter)
    if (status) {
      where.status = status;
    } else {
      where.status = { in: ['AVAILABLE', 'CLAIMED'] }; // Don't show sold by default
    }

    if (category) where.category = category;
    if (condition) where.condition = condition;
    if (isGiveaway === 'true') where.isGiveaway = true;
    if (zipcode) where.zipcode = zipcode;

    // Price filters
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    // Keyword search
    if (q) {
      where.OR = [
        { title: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
      ];
    }

    const orderBy: any =
      sort === 'price-low'
        ? { price: 'asc' as const }
        : sort === 'price-high'
        ? { price: 'desc' as const }
        : { createdAt: 'desc' as const };

    const pageNum = Number(page) || 1;
    const pageSize = 30;
    const skip = (pageNum - 1) * pageSize;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
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
        orderBy,
        take: pageSize,
        skip,
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      listings,
      pagination: {
        page: pageNum,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error('Get listings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /listings - Create listing
router.post('/', authRequired, upload.array('images', 5), async (req: AuthedRequest, res) => {
  try {
    const body = createListingSchema.parse({
      ...req.body,
      price: req.body.price ? Number(req.body.price) : 0,
      isGiveaway: req.body.isGiveaway === 'true' || req.body.isGiveaway === true,
    });

    const files = req.files as any[];
    
    // Upload images to cloud storage or local
    let images: { url: string }[];
    if (files.length > 0) {
      try {
        const imagePromises = files.map((file) => uploadFile(file, 'listings'));
        const uploadedImages = await Promise.all(imagePromises);
        images = uploadedImages.map((img) => ({
          url: img.url,
        }));
      } catch (error) {
        console.error('Image upload error:', error);
        // Fallback to local storage
        images = files.map((f) => ({
          url: `/uploads/${path.basename(f.path)}`,
        }));
      }
    } else {
      images = [];
    }

    // Ensure campusId is set - use from user object or user's campus relation
    let campusId = req.user.campusId;
    if (!campusId && req.user.campus) {
      campusId = req.user.campus.id;
    }
    if (!campusId) {
      return res.status(400).json({ error: 'User must have a campus assigned' });
    }

    const listing = await prisma.listing.create({
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        condition: body.condition,
        price: body.price,
        isGiveaway: body.isGiveaway,
        status: body.status || 'AVAILABLE',
        location: body.location,
        zipcode: body.zipcode,
        availableFrom: body.availableFrom ? new Date(body.availableFrom) : null,
        availableTo: body.availableTo ? new Date(body.availableTo) : null,
        campusId: campusId,
        sellerId: req.user.id,
        images: { create: images },
      },
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
    });

    res.status(201).json({ listing });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error('Create listing error:', err);
    res.status(500).json({ error: 'Could not create listing' });
  }
});

// GET /listings/:id - Get single listing
router.get('/:id', authRequired, async (req: AuthedRequest, res) => {
  try {
    // Get campusId from user - could be direct field or from campus relation
    let userCampusId = req.user.campusId;
    if (!userCampusId && req.user.campus) {
      userCampusId = req.user.campus.id;
    }
    
    if (!userCampusId) {
      return res.status(400).json({ error: 'User must have a campus assigned' });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
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
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Only show listings from same campus
    if (listing.campusId !== userCampusId) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({ listing });
  } catch (err) {
    console.error('Get listing error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /listings/:id - Update listing
router.patch('/:id', authRequired, async (req: AuthedRequest, res) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Only seller or admin can update
    if (listing.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const body = updateListingSchema.parse({
      ...req.body,
      price: req.body.price !== undefined ? Number(req.body.price) : undefined,
      isGiveaway: req.body.isGiveaway !== undefined ? (req.body.isGiveaway === 'true' || req.body.isGiveaway === true) : undefined,
    });

    const data: any = {};
    if (body.title) data.title = body.title;
    if (body.description) data.description = body.description;
    if (body.category) data.category = body.category;
    if (body.condition) data.condition = body.condition;
    if (body.price !== undefined) data.price = body.price;
    if (body.isGiveaway !== undefined) data.isGiveaway = body.isGiveaway;
    if (body.status) data.status = body.status;
    if (body.location !== undefined) data.location = body.location;
    if (body.zipcode !== undefined) data.zipcode = body.zipcode;
    if (body.availableFrom !== undefined) data.availableFrom = body.availableFrom ? new Date(body.availableFrom) : null;
    if (body.availableTo !== undefined) data.availableTo = body.availableTo ? new Date(body.availableTo) : null;

    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data,
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
    });

    res.json({ listing: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error('Update listing error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /listings/:id - Delete listing
router.delete('/:id', authRequired, async (req: AuthedRequest, res) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Only seller or admin can delete
    if (listing.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.listing.delete({ where: { id: req.params.id } });

    res.json({ ok: true });
  } catch (err) {
    console.error('Delete listing error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
