// GroupList.tsx
interface GroupListProps {
  groups: any[];
  loading?: boolean;
  onSelect: (group: any) => void;
}

export function GroupList({
  groups,
  loading,
  onSelect,
}: GroupListProps) {
  if (loading) return <div>Loading groups…</div>;

  if (!groups || groups.length === 0) {
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