import { Request, Response } from "express";
import { supabase } from "../config/database";

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

    const { data, error } = await supabase
      .from("lessons")
      .insert([
        {
          title,
          description,
          client_id,
          coach_id,
          status: "assigned",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Create lesson failed:", err);
    res.status(500).json({ error: "Failed to create lesson" });
  }
};

// ✅ GET CLIENT LESSONS
export const getClientLessons = async (req: Request, res: Response) => {
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
    console.error("❌ Fetch lessons failed:", err);
    res.status(500).json({ error: "Failed to fetch lessons" });
  }
};

// ✅ MARK VIEWED
export const markLessonViewed = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { data, error } = await supabase
      .from("lessons")
      .update({
        status: "viewed",
        viewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("client_id", userId)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("❌ Mark viewed failed:", err);
    res.status(500).json({ error: "Failed to mark viewed" });
  }
};

// ✅ MARK COMPLETED
export const markLessonCompleted = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    console.log("✅ Completing lesson:", id, "for user:", userId);

    const { data, error } = await supabase
      .from("lessons")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("client_id", userId)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("❌ Mark complete failed:", err);
    res.status(500).json({ error: "Failed to mark complete" });
  }
};