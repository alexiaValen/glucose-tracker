// src/groups/GroupList.tsx
import { useEffect, useState } from "react";
import { GroupService } from "../services/group.service";

export function GroupList({
  onSelect,
}: {
  onSelect: (group: any) => void;
}) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GroupService.getCoachGroups()
      .then((res) => setGroups(res.groups || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading groups…</div>;
  if (!groups.length) return <div>No groups yet.</div>;

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {groups.map((g) => (
        <li key={g.id} style={{ marginBottom: 8 }}>
          <button
            onClick={() => onSelect(g)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: 10,
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
            }}
          >
            <strong>{g.name}</strong>
            <div style={{ fontSize: 12, color: "#666" }}>
              {g.status}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}