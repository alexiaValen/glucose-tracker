// web-app/src/coach/CoachDashboard.tsx
// Coach dashboard web view — combines:
//   • MediCore sidebar + stat-cards layout (Image 5)
//   • Mobile status-list pattern (Image 6)
//   • Welcome header + client table (Image 7)

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface CoachUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "user" | "coach";
}

interface ClientSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  lastActive?: string;
  recentStats?: {
    avgGlucose?: number;
    lastReading?: number;
    timeInRange?: number;
  };
}

// ─── TOKENS ───────────────────────────────────────────────────────────────────

const C = {
  pageBg:      "#F7F5F2",
  sidebar:     "#FFFFFF",
  surface:     "#FFFFFF",
  border:      "rgba(0,0,0,0.06)",
  divider:     "#EDEAE5",

  inkDark:     "#1A1814",
  inkMid:      "#4A4640",
  inkMuted:    "#9B9690",
  inkOnForest: "#F0EDE8",

  forest:      "#2B4535",
  forestLight: "rgba(43,69,53,0.08)",
  forestBorder:"rgba(43,69,53,0.18)",
  sage:        "#4D6B54",
  sageMid:     "#698870",

  gold:        "#A8916A",
  goldLight:   "rgba(168,145,106,0.10)",

  ok:          "#2B6040",
  okBg:        "rgba(43,96,64,0.08)",
  warn:        "#8C6E3C",
  warnBg:      "rgba(140,110,60,0.08)",
  alert:       "#C0413A",
  alertBg:     "rgba(192,65,58,0.08)",

  shadow:      "rgba(26,24,20,0.06)",
} as const;

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:3000/api/v1";

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchClients(): Promise<ClientSummary[]> {
  try {
    const token = localStorage.getItem("accessToken");
    const res = await fetch(`${API_URL}/coach/clients`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!res.ok) return MOCK_CLIENTS;
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.clients ?? [];
    return list.map((c: any) => ({
      id: c.id,
      firstName: c.first_name ?? c.firstName ?? "",
      lastName:  c.last_name  ?? c.lastName  ?? "",
      email:     c.email ?? "",
      lastActive: c.last_active ?? c.lastActive,
      recentStats: c.recent_stats ?? c.recentStats,
    }));
  } catch {
    return MOCK_CLIENTS;
  }
}

const MOCK_CLIENTS: ClientSummary[] = [
  { id: "1", firstName: "Sarah",   lastName: "Chen",    email: "sarah@example.com",   lastActive: new Date(Date.now() - 3600000).toISOString(),   recentStats: { avgGlucose: 98,  lastReading: 102, timeInRange: 87 } },
  { id: "2", firstName: "Maria",   lastName: "Torres",  email: "maria@example.com",   lastActive: new Date(Date.now() - 7200000).toISOString(),   recentStats: { avgGlucose: 112, lastReading: 145, timeInRange: 61 } },
  { id: "3", firstName: "Aisha",   lastName: "Johnson", email: "aisha@example.com",   lastActive: new Date(Date.now() - 86400000).toISOString(),  recentStats: { avgGlucose: 88,  lastReading: 91,  timeInRange: 92 } },
  { id: "4", firstName: "Priya",   lastName: "Patel",   email: "priya@example.com",   lastActive: new Date(Date.now() - 172800000).toISOString(), recentStats: { avgGlucose: 135, lastReading: 210, timeInRange: 42 } },
  { id: "5", firstName: "Rebecca", lastName: "Wong",    email: "rebecca@example.com", lastActive: new Date(Date.now() - 43200000).toISOString(),  recentStats: { avgGlucose: 105, lastReading: 118, timeInRange: 74 } },
  { id: "6", firstName: "Nadia",   lastName: "Malik",   email: "nadia@example.com",   lastActive: new Date(Date.now() - 259200000).toISOString(), recentStats: { avgGlucose: 95,  lastReading: 88,  timeInRange: 83 } },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function clientStatus(c: ClientSummary): "ok" | "warn" | "alert" {
  const last = c.recentStats?.lastReading;
  const tir  = c.recentStats?.timeInRange ?? 100;
  if (last && (last < 70 || last > 250)) return "alert";
  if (tir < 50) return "alert";
  if (tir < 70) return "warn";
  return "ok";
}

function relativeTime(iso?: string): string {
  if (!iso) return "No data";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1)  return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24)  return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function initials(c: ClientSummary): string {
  return `${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase();
}

function hue(name: string): number {
  return ((name.charCodeAt(0) ?? 65) * 41 + (name.charCodeAt(1) ?? 0) * 17) % 360;
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────

function Avatar({ client, size = 36 }: { client: ClientSummary; size?: number }) {
  const h = hue(client.firstName + client.lastName);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `hsla(${h},22%,88%,1)`,
      border: `1px solid hsla(${h},22%,72%,0.4)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 600,
      color: `hsl(${h},30%,30%)`,
      flexShrink: 0,
    }}>
      {initials(client)}
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

type NavItem = "dashboard" | "clients" | "messages" | "lessons" | "settings";

const NAV: { id: NavItem; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "clients",   label: "Clients",   icon: "◎" },
  { id: "messages",  label: "Messages",  icon: "✉" },
  { id: "lessons",   label: "Lessons",   icon: "📋" },
  { id: "settings",  label: "Settings",  icon: "⚙" },
];

function Sidebar({
  active, setActive, user, onLogout,
}: {
  active: NavItem; setActive: (v: NavItem) => void;
  user: CoachUser; onLogout: () => void;
}) {
  const h = hue(user.first_name);
  return (
    <aside style={{
      width: 220, minHeight: "100vh", background: C.sidebar,
      borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column",
      padding: "0", position: "sticky", top: 0,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "28px 24px 24px", borderBottom: `1px solid ${C.divider}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: C.forest, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 14, color: "#fff" }}>♡</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.inkDark, letterSpacing: -0.2 }}>TLC</div>
            <div style={{ fontSize: 10, color: C.inkMuted, letterSpacing: 0.4 }}>Coach Portal</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {NAV.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "10px 12px",
                borderRadius: 10, border: "none", cursor: "pointer",
                background: isActive ? C.forestLight : "transparent",
                color: isActive ? C.forest : C.inkMid,
                fontWeight: isActive ? 600 : 400,
                fontSize: 14, textAlign: "left",
                marginBottom: 2,
                transition: "background 0.15s",
              }}
            >
              <span style={{ fontSize: 15, opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
              {isActive && (
                <div style={{
                  marginLeft: "auto", width: 6, height: 6, borderRadius: 3,
                  background: C.forest,
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User + logout */}
      <div style={{
        padding: "16px 16px 24px",
        borderTop: `1px solid ${C.divider}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: `hsla(${h},22%,88%,1)`,
            border: `1px solid hsla(${h},22%,72%,0.4)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 600, color: `hsl(${h},30%,30%)`,
          }}>
            {user.first_name[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.inkDark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.first_name} {user.last_name}
            </div>
            <div style={{ fontSize: 11, color: C.inkMuted }}>Coach</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: "100%", padding: "8px 0", border: "none",
            background: "none", cursor: "pointer",
            fontSize: 13, color: "rgba(192,65,58,0.6)", fontWeight: 400,
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

// ─── STAT CARD — MediCore style (Image 5) ────────────────────────────────────

function StatCard({
  label, value, unit, sub, accentColor,
}: {
  label: string; value: string | number; unit?: string; sub?: string; accentColor?: string;
}) {
  return (
    <div style={{
      flex: 1, background: C.surface, borderRadius: 14,
      border: `1px solid ${C.border}`, padding: "20px 20px 18px",
      borderTop: `3px solid ${accentColor ?? C.forest}`,
      boxShadow: `0 2px 8px ${C.shadow}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: C.inkMuted, marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
        <span style={{ fontSize: 32, fontWeight: 300, color: C.inkDark, letterSpacing: -0.5, lineHeight: 1 }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 13, color: C.inkMuted, marginBottom: 3 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ─── STATUS INDICATOR (Image 6 style) ────────────────────────────────────────

function StatusIndicator({
  label, count, desc, color, bg,
}: {
  label: string; count: number; desc: string; color: string; bg: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 20px",
    }}>
      <div style={{ width: 4, height: 40, borderRadius: 2, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: C.inkDark }}>{label}</div>
        <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{
        minWidth: 36, height: 28, borderRadius: 20, background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 10px",
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{count}</span>
      </div>
    </div>
  );
}

// ─── CLIENT TABLE ROW ─────────────────────────────────────────────────────────

function ClientTableRow({
  client, isLast, onEdit, onRemove,
}: {
  client: ClientSummary; isLast: boolean;
  onEdit: (c: ClientSummary) => void;
  onRemove: (c: ClientSummary) => void;
}) {
  const [hover, setHover] = useState(false);
  const status = clientStatus(client);
  const statusColor = status === "ok" ? C.ok : status === "warn" ? C.warn : C.alert;
  const statusBg    = status === "ok" ? C.okBg : status === "warn" ? C.warnBg : C.alertBg;
  const statusLabel = status === "ok" ? "In Range" : status === "warn" ? "Watch" : "Alert";

  return (
    <tr
      style={{ borderBottom: isLast ? "none" : `1px solid ${C.divider}`, background: hover ? C.pageBg : "transparent", transition: "background 0.12s" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <td style={{ padding: "13px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar client={client} size={34} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.inkDark }}>{client.firstName} {client.lastName}</div>
            <div style={{ fontSize: 12, color: C.inkMuted }}>{client.email}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: "13px 20px", fontSize: 14, color: C.inkMid }}>
        {client.recentStats?.lastReading ? `${client.recentStats.lastReading} mg/dL` : "—"}
      </td>
      <td style={{ padding: "13px 20px" }}>
        {client.recentStats?.timeInRange != null ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 80, height: 6, borderRadius: 3, background: C.divider, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 3, width: `${client.recentStats.timeInRange}%`, background: statusColor }} />
            </div>
            <span style={{ fontSize: 13, color: C.inkMid, fontWeight: 500 }}>{client.recentStats.timeInRange}%</span>
          </div>
        ) : "—"}
      </td>
      <td style={{ padding: "13px 20px" }}>
        <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: statusBg, color: statusColor }}>
          {statusLabel}
        </span>
      </td>
      <td style={{ padding: "13px 20px", fontSize: 13, color: C.inkMuted }}>
        {relativeTime(client.lastActive)}
      </td>
      {/* Actions — Edit + Remove */}
      <td style={{ padding: "13px 20px" }}>
        <div style={{ display: "flex", gap: 6, opacity: hover ? 1 : 0.4, transition: "opacity 0.15s" }}>
          <button
            onClick={() => onEdit(client)}
            title="Edit"
            style={{
              width: 30, height: 30, borderRadius: 7,
              border: `1px solid ${C.forestBorder}`,
              background: C.forestLight, color: C.forest,
              fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✎</button>
          <button
            onClick={() => onRemove(client)}
            title="Remove"
            style={{
              width: 30, height: 30, borderRadius: 7,
              border: "1px solid rgba(192,65,58,0.2)",
              background: "rgba(192,65,58,0.07)", color: C.alert,
              fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>
      </td>
    </tr>
  );
}

// ─── ADD CLIENT MODAL ─────────────────────────────────────────────────────────

function AddClientModal({
  open, onClose, onAdd,
}: {
  open: boolean; onClose: () => void; onAdd: (email: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setEmail(""); setBusy(false); setError(""); };

  const handleAdd = async () => {
    if (!email.trim()) { setError("Enter an email address"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address"); return; }
    setBusy(true); setError("");
    try { await onAdd(email.trim().toLowerCase()); reset(); onClose(); }
    catch (e: any) { setError(e?.message || "Failed to add client"); setBusy(false); }
  };

  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} onClick={() => { reset(); onClose(); }} />
      <div style={{
        position: "relative", background: C.surface, borderRadius: 18,
        padding: 32, width: 420, maxWidth: "90vw",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        border: `1px solid ${C.border}`,
      }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: C.inkDark, marginBottom: 6 }}>Add Client</div>
        <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 24 }}>
          Enter the email address of their TLC account.
        </div>
        <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: C.inkMuted, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
          Email Address
        </label>
        <input
          type="email"
          autoFocus
          value={email}
          onChange={e => { setEmail(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="client@example.com"
          disabled={busy}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 10, fontSize: 14,
            border: `1px solid ${error ? C.alert : C.border}`,
            background: "#FAFAF8", color: C.inkDark, outline: "none",
            marginBottom: error ? 8 : 24,
          }}
        />
        {error && <div style={{ fontSize: 13, color: C.alert, marginBottom: 16 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => { reset(); onClose(); }}
            disabled={busy}
            style={{
              flex: 1, height: 44, borderRadius: 10,
              border: `1px solid ${C.border}`, background: C.pageBg,
              color: C.inkMid, fontSize: 14, fontWeight: 500, cursor: "pointer",
            }}
          >Cancel</button>
          <button
            onClick={handleAdd}
            disabled={busy}
            style={{
              flex: 2, height: 44, borderRadius: 10,
              border: "none", background: busy ? C.inkMuted : C.forest,
              color: "#F0EDE8", fontSize: 14, fontWeight: 500, cursor: busy ? "not-allowed" : "pointer",
            }}
          >{busy ? "Adding…" : "Add Client"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── EDIT CLIENT MODAL ────────────────────────────────────────────────────────

function EditClientModal({
  client, onClose, onSave,
}: {
  client: ClientSummary | null; onClose: () => void;
  onSave: (id: string, updates: { firstName: string; lastName: string }) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [busy,      setBusy]      = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (client) { setFirstName(client.firstName); setLastName(client.lastName); setError(""); setBusy(false); }
  }, [client]);

  const handleSave = async () => {
    if (!firstName.trim()) { setError("First name is required"); return; }
    setBusy(true); setError("");
    try { await onSave(client!.id, { firstName: firstName.trim(), lastName: lastName.trim() }); onClose(); }
    catch (e: any) { setError(e?.message || "Failed to update"); setBusy(false); }
  };

  if (!client) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} onClick={onClose} />
      <div style={{
        position: "relative", background: C.surface, borderRadius: 18,
        padding: 32, width: 440, maxWidth: "90vw",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        border: `1px solid ${C.border}`,
      }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: C.inkDark, marginBottom: 4 }}>Edit Client</div>
        <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 24 }}>{client.email}</div>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: C.inkMuted, textTransform: "uppercase", display: "block", marginBottom: 8 }}>First Name</label>
            <input value={firstName} onChange={e => { setFirstName(e.target.value); setError(""); }} disabled={busy}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 9, fontSize: 14, border: `1px solid ${C.border}`, background: "#FAFAF8", color: C.inkDark, outline: "none" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: C.inkMuted, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Last Name</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} disabled={busy}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 9, fontSize: 14, border: `1px solid ${C.border}`, background: "#FAFAF8", color: C.inkDark, outline: "none" }} />
          </div>
        </div>
        {error && <div style={{ fontSize: 13, color: C.alert, marginBottom: 16 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={busy}
            style={{ flex: 1, height: 44, borderRadius: 10, border: `1px solid ${C.border}`, background: C.pageBg, color: C.inkMid, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={busy}
            style={{ flex: 2, height: 44, borderRadius: 10, border: "none", background: busy ? C.inkMuted : C.forest, color: "#F0EDE8", fontSize: 14, fontWeight: 500, cursor: busy ? "not-allowed" : "pointer" }}>
            {busy ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CONFIRM DELETE MODAL ─────────────────────────────────────────────────────

function ConfirmRemoveModal({
  client, onClose, onConfirm,
}: {
  client: ClientSummary | null; onClose: () => void; onConfirm: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const name = client ? `${client.firstName} ${client.lastName}`.trim() || client.email : "";

  const handleConfirm = async () => {
    setBusy(true);
    try { await onConfirm(client!.id); onClose(); }
    catch { setBusy(false); }
  };

  if (!client) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} onClick={onClose} />
      <div style={{
        position: "relative", background: C.surface, borderRadius: 18,
        padding: 32, width: 400, maxWidth: "90vw",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`,
      }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: C.inkDark, marginBottom: 8 }}>Remove {name}?</div>
        <div style={{ fontSize: 14, color: C.inkMuted, marginBottom: 28, lineHeight: 1.5 }}>
          They'll be removed from your client list. Their account and health data won't be affected.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={busy}
            style={{ flex: 1, height: 44, borderRadius: 10, border: `1px solid ${C.border}`, background: C.pageBg, color: C.inkMid, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={busy}
            style={{ flex: 1, height: 44, borderRadius: 10, border: "none", background: busy ? C.inkMuted : C.alert, color: "#fff", fontSize: 14, fontWeight: 500, cursor: busy ? "not-allowed" : "pointer" }}>
            {busy ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD VIEW ──────────────────────────────────────────────────────

function DashboardView({
  clients, loading, onAdd, onEdit, onRemove,
}: {
  clients: ClientSummary[]; loading: boolean;
  onAdd: () => void;
  onEdit: (c: ClientSummary) => void;
  onRemove: (c: ClientSummary) => void;
}) {
  // Derived stats
  const statsData = useMemo(() => {
    const total = clients.length;
    const withData = clients.filter(c => c.recentStats?.avgGlucose);
    const avgGlucose = withData.length
      ? Math.round(withData.reduce((a, c) => a + (c.recentStats?.avgGlucose ?? 0), 0) / withData.length)
      : 0;
    const withTIR = clients.filter(c => c.recentStats?.timeInRange != null);
    const avgTIR = withTIR.length
      ? Math.round(withTIR.reduce((a, c) => a + (c.recentStats?.timeInRange ?? 0), 0) / withTIR.length)
      : 0;
    const inRange  = clients.filter(c => clientStatus(c) === "ok").length;
    const watching = clients.filter(c => clientStatus(c) === "warn").length;
    const alerts   = clients.filter(c => clientStatus(c) === "alert").length;
    return { total, avgGlucose, avgTIR, inRange, watching, alerts };
  }, [clients]);

  // TIR distribution chart data
  const tirChartData = useMemo(() => clients.map(c => ({
    name: c.firstName,
    tir:  c.recentStats?.timeInRange ?? 0,
    glucose: c.recentStats?.avgGlucose ?? 0,
  })), [clients]);

  // Per-client average glucose for the bar chart — use real data, no mocks
  const trendData = useMemo(() => {
    const withData = clients.filter(c => c.recentStats?.avgGlucose);
    if (withData.length === 0) return [];
    return withData.map(c => ({
      day: c.firstName,
      avg: c.recentStats?.avgGlucose ?? 0,
    }));
  }, [clients]);

  const [search, setSearch] = useState("");
  const filtered = useMemo(() =>
    clients.filter(c =>
      `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase())
    ), [clients, search]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ fontSize: 14, color: C.inkMuted }}>Loading clients…</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── STAT CARDS — MediCore top row (Image 5) ─────────────────── */}
      <div style={{ display: "flex", gap: 16 }}>
        <StatCard label="Active Clients"  value={statsData.total}   sub={`${statsData.inRange} in range today`}     accentColor={C.forest} />
        <StatCard label="Avg Glucose"     value={statsData.avgGlucose || "—"} unit={statsData.avgGlucose ? "mg/dL" : undefined} sub="across all clients" accentColor={C.gold} />
        <StatCard label="Time In Range"   value={statsData.avgTIR || "—"}     unit={statsData.avgTIR ? "%"      : undefined} sub="average TIR"           accentColor={C.ok} />
        <StatCard label="Needs Attention" value={statsData.watching + statsData.alerts} sub={`${statsData.alerts} alert${statsData.alerts !== 1 ? "s" : ""}`} accentColor={C.alert} />
      </div>

      {/* ── CHARTS ROW ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 16 }}>

        {/* Glucose Trend (line chart — Image 5 Revenue Trends style) */}
        <div style={{
          flex: 2, background: C.surface, borderRadius: 14,
          border: `1px solid ${C.border}`, padding: 24,
          boxShadow: `0 2px 8px ${C.shadow}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.inkDark }}>Average Glucose</div>
              <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 2 }}>Per client · recent readings</div>
            </div>
            <div style={{ fontSize: 11, color: C.inkMuted, background: C.pageBg, padding: "4px 10px", borderRadius: 20 }}>
              All Clients
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trendData} barCategoryGap="30%">
              <CartesianGrid stroke={C.divider} strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: C.inkMuted }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 180]} tick={{ fontSize: 11, fill: C.inkMuted }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12 }}
                formatter={(v: any) => [`${v} mg/dL`, "Avg Glucose"]}
              />
              <ReferenceLine y={70}  stroke={C.alert} strokeDasharray="3 3" opacity={0.4} />
              <ReferenceLine y={140} stroke={C.gold}  strokeDasharray="3 3" opacity={0.4} />
              <Bar dataKey="avg" fill={C.forest} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Client Status Overview (Image 5 Performance + Image 6 status list) */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", gap: 16,
        }}>
          {/* Client TIR bar chart */}
          <div style={{
            flex: 1, background: C.surface, borderRadius: 14,
            border: `1px solid ${C.border}`, padding: 20,
            boxShadow: `0 2px 8px ${C.shadow}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.inkDark, marginBottom: 16 }}>
              TIR per Client
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={tirChartData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.inkMuted }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: C.inkMuted }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12 }}
                  formatter={(v: any) => [`${v}%`, "TIR"]}
                />
                <Bar dataKey="tir" fill={C.forest} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status breakdown (Image 6) */}
          <div style={{
            background: C.surface, borderRadius: 14,
            border: `1px solid ${C.border}`,
            boxShadow: `0 2px 8px ${C.shadow}`,
            overflow: "hidden",
          }}>
            <StatusIndicator label="In Range"         count={statsData.inRange}  desc="TIR ≥ 70%"  color={C.ok}    bg={C.okBg}   />
            <div style={{ height: 1, background: C.divider, margin: "0 20px" }} />
            <StatusIndicator label="Needs Attention"  count={statsData.watching} desc="TIR 50–70%"  color={C.warn}  bg={C.warnBg} />
            <div style={{ height: 1, background: C.divider, margin: "0 20px" }} />
            <StatusIndicator label="Alert"            count={statsData.alerts}   desc="TIR < 50% or out of range" color={C.alert} bg={C.alertBg} />
          </div>
        </div>
      </div>

      {/* ── CLIENT TABLE — Image 7 Proposals style ───────────────────── */}
      <div style={{
        background: C.surface, borderRadius: 14,
        border: `1px solid ${C.border}`,
        boxShadow: `0 2px 8px ${C.shadow}`,
        overflow: "hidden",
      }}>
        {/* Table header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px 14px", borderBottom: `1px solid ${C.divider}`,
        }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.inkDark }}>Clients</span>
            <span style={{ fontSize: 13, color: C.inkMuted, marginLeft: 8 }}>
              {filtered.length} of {clients.length}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search clients…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: "8px 14px", borderRadius: 9, fontSize: 13,
                border: `1px solid ${C.border}`, background: C.pageBg,
                color: C.inkDark, outline: "none", width: 200,
              }}
            />
            <button
              onClick={onAdd}
              style={{
                height: 36, paddingInline: 16, borderRadius: 9,
                border: "none", background: C.forest,
                color: "#F0EDE8", fontSize: 13, fontWeight: 600,
                cursor: "pointer", whiteSpace: "nowrap",
              }}
            >+ Add Client</button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.pageBg }}>
                {["Client", "Last Reading", "Time In Range", "Status", "Last Active", "Actions"].map(col => (
                  <th key={col} style={{
                    padding: "10px 20px", textAlign: "left",
                    fontSize: 10, fontWeight: 600, letterSpacing: 0.8,
                    color: C.inkMuted, textTransform: "uppercase",
                    borderBottom: `1px solid ${C.divider}`,
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: C.inkMuted, fontSize: 14 }}>
                    {clients.length === 0
                      ? <span>No clients yet — <button onClick={onAdd} style={{ background: "none", border: "none", color: C.forest, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>add your first one</button></span>
                      : "No clients match your search"}
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <ClientTableRow
                    key={c.id}
                    client={c}
                    isLast={i === filtered.length - 1}
                    onEdit={onEdit}
                    onRemove={onRemove}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export default function CoachDashboard({
  user, logout,
}: {
  user: CoachUser;
  logout: () => void;
}) {
  const [activeNav,    setActiveNav]    = useState<NavItem>("dashboard");
  const [clients,      setClients]      = useState<ClientSummary[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showAdd,      setShowAdd]      = useState(false);
  const [editTarget,   setEditTarget]   = useState<ClientSummary | null>(null);
  const [removeTarget, setRemoveTarget] = useState<ClientSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchClients();
    setClients(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Client CRUD ────────────────────────────────────────────────────────────
  const handleAdd = async (email: string) => {
    const token = localStorage.getItem("accessToken");
    const res = await fetch(`${API_URL}/coach/clients`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add client");
    const c = data.client;
    setClients(prev => [...prev, {
      id: c.id, firstName: c.firstName ?? c.first_name, lastName: c.lastName ?? c.last_name,
      email: c.email, recentStats: c.recentStats ?? { avgGlucose: 0, lastReading: 0, timeInRange: 0 },
    }]);
  };

  const handleEdit = async (id: string, updates: { firstName: string; lastName: string }) => {
    const token = localStorage.getItem("accessToken");
    const res = await fetch(`${API_URL}/coach/clients/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update client");
    setClients(prev => prev.map(c => c.id === id
      ? { ...c, firstName: updates.firstName, lastName: updates.lastName }
      : c
    ));
    setEditTarget(null);
  };

  const handleRemove = async (id: string) => {
    const token = localStorage.getItem("accessToken");
    const res = await fetch(`${API_URL}/coach/clients/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to remove client");
    setClients(prev => prev.filter(c => c.id !== id));
    setRemoveTarget(null);
  };

  const h = new Date().getHours();
  const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.pageBg, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { box-sizing: border-box; }
        button:hover { opacity: 0.85; }
        input::placeholder { color: ${C.inkMuted}; }
        input:focus { border-color: ${C.forest} !important; outline: none; }
      `}</style>

      {/* Modals */}
      <AddClientModal    open={showAdd}         onClose={() => setShowAdd(false)}      onAdd={handleAdd} />
      <EditClientModal   client={editTarget}     onClose={() => setEditTarget(null)}    onSave={handleEdit} />
      <ConfirmRemoveModal client={removeTarget}  onClose={() => setRemoveTarget(null)}  onConfirm={handleRemove} />

      {/* Sidebar */}
      <Sidebar active={activeNav} setActive={setActiveNav} user={user} onLogout={logout} />

      {/* Main */}
      <main style={{ flex: 1, padding: "36px 36px 48px", overflowX: "hidden" }}>

        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 4 }}>{today}</div>
            <h1 style={{ fontSize: 28, fontWeight: 300, color: C.inkDark, margin: 0, letterSpacing: -0.4 }}>
              {greet}, <strong style={{ fontWeight: 600 }}>{user.first_name}</strong>
            </h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                height: 40, paddingInline: 20, borderRadius: 10,
                border: "none", background: C.forest,
                color: "#F0EDE8", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >+ Add Client</button>
            <button
              onClick={load}
              style={{
                height: 40, paddingInline: 16, borderRadius: 10,
                border: `1px solid ${C.forestBorder}`,
                background: C.forestLight, color: C.forest,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}
            >↻ Refresh</button>
          </div>
        </div>

        {activeNav === "dashboard" ? (
          <DashboardView
            clients={clients}
            loading={loading}
            onAdd={() => setShowAdd(true)}
            onEdit={c => setEditTarget(c)}
            onRemove={c => setRemoveTarget(c)}
          />
        ) : (
          <div style={{
            background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
            padding: 48, textAlign: "center", boxShadow: `0 2px 8px ${C.shadow}`,
          }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>{NAV.find(n => n.id === activeNav)?.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.inkDark, marginBottom: 8 }}>{NAV.find(n => n.id === activeNav)?.label}</div>
            <div style={{ fontSize: 14, color: C.inkMuted }}>Coming soon</div>
          </div>
        )}

      </main>
    </div>
  );
}
