import api from "../config/api";

// ── Client ─────────────────────────────────────────────────────
export const getMyLessons = () => api.get("/lessons/me");

export const markLessonViewed = (id: string) =>
  api.patch(`/lessons/${id}/viewed`);

export const markLessonCompleted = (id: string) =>
  api.patch(`/lessons/${id}/completed`);

// ── Coach ──────────────────────────────────────────────────────
export const getCoachLessons = () => api.get("/lessons/coach/all");

export const assignLesson = (data: {
  title: string;
  description: string;
  client_id: string;
}) => api.post("/lessons/assign", data);

export const updateLesson = (
  id: string,
  data: { title: string; description: string }
) => api.patch(`/lessons/${id}`, data);
