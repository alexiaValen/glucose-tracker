import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createLesson,
  getClientLessons,
  markLessonViewed,
  markLessonCompleted,
} from "../services/lesson.service";
import { supabase } from "../config/database";

const router = Router();

// ✅ Coach assigns lesson
router.post("/assign", authMiddleware, createLesson);

// ✅ Client fetches lessons
router.get("/me", authMiddleware, getClientLessons);

// ✅ Mark viewed
router.patch("/:id/viewed", authMiddleware, markLessonViewed);

// ✅ Mark completed
router.patch("/:id/completed", authMiddleware, markLessonCompleted);

router.get("/test", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("client_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("❌ Test fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch lessons" });
  }
}); 

export default router;