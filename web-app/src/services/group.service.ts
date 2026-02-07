// src/services/group.service.ts
const API_URL =
  (import.meta as any).env.VITE_API_URL ||
  "http://localhost:3000/api/v1";

const token = () => localStorage.getItem("accessToken");

async function fetchJSON(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText} — ${text}`);
  }

  return res.json();
}

export const GroupService = {
  // Coach only
  getCoachGroups() {
    return fetchJSON("/groups/coach/my-groups");
  },

  getGroupMessages(groupId: string) {
    return fetchJSON(`/groups/${groupId}/messages`);
  },

  sendGroupMessage(groupId: string, message: string) {
    return fetchJSON(`/groups/${groupId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },
};