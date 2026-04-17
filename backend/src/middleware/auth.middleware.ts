import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export type UserRole = "user" | "coach" | "admin";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    email: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const userId = decoded?.id || decoded?.userId || decoded?.sub;

    if (!userId) {
      console.error("❌ TOKEN HAS NO USER ID:", decoded);
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.user = {
      id: userId,
      role: (decoded?.role as UserRole) || "user",
      email: decoded?.email || "",
    };

    console.log("🔐 USER FROM TOKEN:", userId, `(${req.user.role})`);

    next();
  } catch (error) {
    console.error("❌ Auth error:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Allows coach OR admin
export const requireCoach = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role === "coach" || req.user.role === "admin") return next();
  return res.status(403).json({ error: "Coach access required" });
};

// Admin only
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role === "admin") return next();
  return res.status(403).json({ error: "Admin access required" });
};

export default authMiddleware;