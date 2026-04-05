import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createLesson,
  getClientLessons,
  getCoachLessons,
  updateLesson,
  markLessonViewed,
  markLessonCompleted,
} from "../services/lesson.service";
import { pool } from "../config/database";

const router = Router();

// ✅ Coach: create lesson for client
router.post("/assign", authMiddleware, createLesson);

// ✅ Coach: get all their lessons
router.get("/coach/all", authMiddleware, getCoachLessons);

// ✅ Coach: update lesson content/notes
router.patch("/:id", authMiddleware, updateLesson);

// ✅ Client: fetch their lessons
router.get("/me", authMiddleware, getClientLessons);

// ✅ Mark viewed
router.patch("/:id/viewed", authMiddleware, markLessonViewed);

// ✅ Mark completed
router.patch("/:id/completed", authMiddleware, markLessonCompleted);

router.get("/test", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const result = await pool.query(
      `SELECT * FROM lessons WHERE client_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error("❌ Test fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch lessons", details: err.message });
  }
});

export default router;