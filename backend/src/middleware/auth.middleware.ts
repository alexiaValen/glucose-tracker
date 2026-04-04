import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserPayload } from "../types/UserPayload";

const JWT_SECRET = process.env.JWT_SECRET!;

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;

    req.user = decoded;

    console.log("🔐 USER FROM TOKEN:", decoded.id);

    next();
  } catch (error) {
    console.error("❌ Auth error:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};