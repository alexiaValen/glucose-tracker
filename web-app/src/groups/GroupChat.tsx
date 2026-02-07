// src/groups/GroupChat.tsx
import { useEffect, useState } from "react";
import { GroupService } from "../services/group.service";

export function GroupChat({ group }: { group: any }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    setLoading(true);
    const res = await GroupService.getGroupMessages(group.id);
    setMessages(res.messages || []);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    await GroupService.sendGroupMessage(group.id, text);
    setText("");
    loadMessages();
  };

  useEffect(() => {
    loadMessages();
  }, [group.id]);

  return (
    <div>
      <h2>{group.name}</h2>

      <div
        style={{
          height: 320,
          overflowY: "auto",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
        }}
      >
        {loading ? (
          <div>Loading messages…</div>
        ) : messages.length === 0 ? (
          <div>No messages yet.</div>
        ) : (
          messages
            .slice()
            .reverse()
            .map((m) => (
              <div key={m.id} style={{ marginBottom: 10 }}>
                <strong>
                  {m.sender?.first_name || "Coach"}
                </strong>
                <div style={{ fontSize: 14 }}>{m.message}</div>
              </div>
            ))
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          style={{ flex: 1, padding: 10 }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}