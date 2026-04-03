import { Router } from "express";
import { requireUser } from "../middleware/auth.middleware";
import {
  createLesson,
  getClientLessons,
  markLessonViewed,
  markLessonCompleted,
} from "../services/lesson.service";

const router = Router();

// Coach assigns lesson
router.post("/", requireUser, createLesson);

// Client fetches their lessons
router.get("/me", requireUser, getClientLessons);

// Mark viewed
router.patch("/:id/viewed", requireUser, markLessonViewed);

// Mark completed
router.patch("/:id/completed", requireUser, markLessonCompleted);

export default router;