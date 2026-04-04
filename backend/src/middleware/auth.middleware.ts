// backend/src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/database';
import { UserPayload } from '../services/auth.service';

const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * Extend Express Request globally to include authenticated user
 */
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

/**
 * ─────────────────────────────────────────────────────────────
 * AUTH MIDDLEWARE (CORE)
 * ─────────────────────────────────────────────────────────────
 */
export const requireUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Extract Authorization header
    const authHeader = req.headers.authorization;
    console.log('🔐 AUTH HEADER:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // 2. Extract token
    const token = authHeader.split(' ')[1];

    // 3. Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('🔐 DECODED TOKEN:', decoded);

    // ✅ FIX: handle BOTH token shapes
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      console.error('❌ NO USER ID IN TOKEN');
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // 4. Fetch fresh user from DB
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('❌ USER FETCH FAILED:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // 5. Attach normalized user
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    };

    console.log('✅ AUTH SUCCESS:', req.user);

    next();
  } catch (error: any) {
    console.error('❌ AUTH ERROR:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * ROLE GUARD
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role,
      });
    }

    next();
  };
};

/**
 * ROLE SHORTCUTS
 */
export const requireCoach = [requireUser, requireRole(['coach', 'admin'])];
export const requireAdmin = [requireUser, requireRole(['admin'])];
export const requireClient = [requireUser, requireRole(['user'])];

/**
 * BACKWARD COMPAT
 */
export const authMiddleware = requireUser;
export const authenticate = requireUser;