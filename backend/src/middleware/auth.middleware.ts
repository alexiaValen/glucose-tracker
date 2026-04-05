import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// ✅ DO NOT use UserPayload here
export interface AuthRequest extends Request {
  user?: {
    id: string;
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

    const userId =
      decoded?.id ||
      decoded?.userId ||
      decoded?.sub;

    if (!userId) {
      console.error("❌ TOKEN HAS NO USER ID:", decoded);
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.user = { id: userId };

    console.log("🔐 USER FROM TOKEN:", userId);

    next();
  } catch (error) {
    console.error("❌ Auth error:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default authMiddleware;