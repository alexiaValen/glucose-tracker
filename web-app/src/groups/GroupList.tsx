import { useEffect, useState } from "react";

interface Group {
  id: string;
  name: string;
  description?: string;
  status: string;
}

export function GroupList({
  onSelect,
}: {
  onSelect: (group: Group) => void;
}) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL =
    (import.meta as any).env.VITE_API_URL ||
    "http://localhost:3000/api/v1";

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API_URL}/groups/coach/my-groups`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json();
        setGroups(data.groups || []);
      } catch (err) {
        console.error("Failed to load groups", err);
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  if (loading) return <div>Loading groups…</div>;

  if (groups.length === 0) {
    return (
      <div style={{ color: "#6B6B6B", fontSize: 14 }}>
        No groups yet.
      </div>
    );
  }

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {groups.map((group) => (
        <li key={group.id} style={{ marginBottom: 8 }}>
          <button
            style={{ width: "100%" }}
            onClick={() => onSelect(group)}
          >
            {group.name}
          </button>
        </li>
      ))}
    </ul>
  );
}