import api from "../config/api";

export const getMyLessons = () =>
  api.get("/lessons/me");

export const markLessonViewed = (id: string) =>
  api.patch(`/lessons/${id}/viewed`);

export const markLessonCompleted = (id: string) =>
  api.patch(`/lessons/${id}/completed`);