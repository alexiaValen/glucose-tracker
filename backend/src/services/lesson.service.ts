import { Request, Response } from "express";
import { supabase } from "../config/database";

export const createLesson = async (req: Request, res: Response) => {
  const { title, description, content_url, client_id } = req.body;
  const user = (req as any).user;
const coach_id = user?.id ?? user?.userId;

  const { data, error } = await supabase
    .from("lessons")
    .insert([
      { title, description, content_url, client_id, coach_id }
    ])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
};

export const getClientLessons = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // 🔥 Handle both possible shapes safely
    const user_id = user?.id ?? user?.userId;

    if (!user_id) {
      console.error("❌ No user ID found in request:", user);
      return res.status(401).json({ error: "Not authenticated" });
    }

    console.log("👤 LESSON USER ID:", user_id);

    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("client_id", user_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("❌ getClientLessons error:", err);
    res.status(500).json({ error: "Failed to fetch lessons" });
  }
};

export const markLessonViewed = async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("lessons")
    .update({
      status: "viewed",
      viewed_at: new Date(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
};

export const markLessonCompleted = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;


    console.log("✅ Completing lesson:", id, "for user:", userId);

    const { data, error } = await supabase
      .from("lessons")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      //.eq("id", userId) // 🔥 ensures correct user
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.json(data);
  } catch (err) {
    console.error("❌ Server error:", err);
    return res.status(500).json({ error: "Failed to complete lesson" });
  }
};