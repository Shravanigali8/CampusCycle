import express from 'express';
import prisma from '../prisma';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from '../utils/email';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'devrefreshsecret';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email().refine((email) => email.endsWith('.edu'), {
    message: 'Must use .edu email address',
  }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  name: z.string().optional(),
  campusId: z.string().uuid(),
  gradYear: z.number().int().min(1900).max(2100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);
    const { email, password, name, campusId, gradYear } = body;

    // Check if campus exists
    const campus = await prisma.campus.findUnique({ where: { id: campusId } });
    if (!campus) {
      return res.status(400).json({ error: 'Invalid campus' });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const token = uuidv4();

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        campusId,
        gradYear: gradYear || null,
        verifyToken: token,
      },
      include: { campus: true },
    });

    await sendVerificationEmail(user.email, token);

    res.status(201).json({
      ok: true,
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /auth/verify-email
router.get('/verify-email', async (req, res) => {
  try {
    const token = String(req.query.token || '');
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const user = await prisma.user.findUnique({ where: { verifyToken: token } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyToken: null },
    });

    res.json({ ok: true, message: 'Email verified successfully' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const { email, password } = body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { campus: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Email not verified. Please check your email.' });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate tokens
    const accessToken = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign({ sub: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        campus: user.campus,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const payload: any = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { campus: true },
    });

    if (!user || !user.isVerified) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const accessToken = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /auth/logout
router.post('/logout', async (req, res) => {
  // In a production app, you might want to blacklist the refresh token
  // For now, we just acknowledge the logout
  res.json({ ok: true, message: 'Logged out successfully' });
});

// GET /auth/me
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) {
      return res.json({ user: null });
    }

    const token = auth.replace('Bearer ', '');
    const payload: any = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
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

    if (!user) {
      return res.json({ user: null });
    }

    res.json({ user });
  } catch (err) {
    res.json({ user: null });
  }
});

export default router;
