import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

// Properly extend Express Request with all properties
export interface AuthedRequest extends Request {
  user?: any;
  body: any;
  params: any;
  query: any;
  headers: any;
  files?: any;
}

export const authRequired = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const token = header.replace('Bearer ', '');
    const payload: any = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { campus: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Email not verified' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const adminRequired = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};
