import { Request, Response } from "express";
import { supabase } from "../config/database";

export const createLesson = async (req: Request, res: Response) => {
  const { title, description, content_url, client_id } = req.body;
  const coach_id = (req as any).user.id;

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
  const user_id = (req as any).user.id;

  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("client_id", user_id)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
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
  const { id } = req.params;

  const { data, error } = await supabase
    .from("lessons")
    .update({
      status: "completed",
      completed_at: new Date(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
};