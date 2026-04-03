export type Lesson = {
  id: string;
  title: string;
  description?: string;
  content_url?: string;
  status: "assigned" | "viewed" | "completed";
};