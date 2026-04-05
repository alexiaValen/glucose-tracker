import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { pool } from "../config/database";

// ✅ GET ALL COACH LESSONS (grouped by client)
export const getCoachLessons = async (req: AuthRequest, res: Response) => {
  try {
    const coachId = req.user!.id;

    const result = await pool.query(
      `SELECT * FROM lessons WHERE coach_id = $1 ORDER BY created_at DESC`,
      [coachId]
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error("❌ Fetch coach lessons failed:", err);
    res.status(500).json({ error: "Failed to fetch lessons", details: err.message });
  }
};

// ✅ UPDATE LESSON (title, description, content/notes)
export const updateLesson = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const coachId = req.user!.id;
    const { title, description } = req.body;

    const result = await pool.query(
      `UPDATE lessons SET title = $1, description = $2
       WHERE id = $3 AND coach_id = $4 RETURNING *`,
      [title, description, id, coachId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Lesson not found" });

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("❌ Update lesson failed:", err);
    res.status(500).json({ error: "Failed to update lesson", details: err.message });
  }
};

// ✅ CREATE LESSON
export const createLesson = async (req: Request, res: Response) => {
  try {
    const { title, description, client_id } = req.body;

    const coach_id = req.user!.id;

    console.log("🧠 Creating lesson:");
    console.log("Coach:", coach_id);
    console.log("Client:", client_id);

    if (!title || !client_id) {
      return res.status(400).json({
        error: "title and client_id are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO lessons (title, description, client_id, coach_id, status)
       VALUES ($1, $2, $3, $4, 'assigned') RETURNING *`,
      [title, description, client_id, coach_id]
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("❌ Create lesson failed:", err);
    res.status(500).json({ error: "Failed to create lesson", details: err.message });
  }
};

// ✅ GET CLIENT LESSONS
export const getClientLessons = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await pool.query(
      `SELECT * FROM lessons WHERE client_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error("❌ Fetch lessons failed:", err);
    res.status(500).json({ error: "Failed to fetch lessons", details: err.message });
  }
};

// ✅ MARK VIEWED
export const markLessonViewed = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await pool.query(
      `UPDATE lessons SET status = 'viewed', viewed_at = NOW()
       WHERE id = $1 AND client_id = $2 RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Lesson not found" });

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("❌ Mark viewed failed:", err);
    res.status(500).json({ error: "Failed to mark viewed", details: err.message });
  }
};

// ✅ MARK COMPLETED
export const markLessonCompleted = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    console.log("✅ Completing lesson:", id, "for user:", userId);

    const result = await pool.query(
      `UPDATE lessons SET status = 'completed', completed_at = NOW()
       WHERE id = $1 AND client_id = $2 RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Lesson not found" });

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("❌ Mark complete failed:", err);
    res.status(500).json({ error: "Failed to mark complete", details: err.message });
  }
};