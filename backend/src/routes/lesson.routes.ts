import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createLesson,
  getClientLessons,
  markLessonViewed,
  markLessonCompleted,
} from "../services/lesson.service";

const router = Router();

// ✅ Coach assigns lesson
router.post("/assign", authMiddleware, createLesson);

// ✅ Client fetches lessons
router.get("/me", authMiddleware, getClientLessons);

// ✅ Mark viewed
router.patch("/:id/viewed", authMiddleware, markLessonViewed);

// ✅ Mark completed
router.patch("/:id/completed", authMiddleware, markLessonCompleted);

export default router;