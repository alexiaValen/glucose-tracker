// GraceFlowWebApp.tsx – Concise & modern version

import React, { useEffect, useState, createContext, useContext, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────
interface User { id: number; email: string; first_name: string; last_name: string; role: "user" | "coach" }
interface GlucoseReading { id?: number; value: number; measured_at: string; notes?: string }
interface Symptom { id?: number; symptom_type: string; severity: number; notes?: string; logged_at?: string }
interface Cycle { cycle_start_date: string; current_day?: number; phase?: string }
interface Group { id: string; name: string; description: string; coach_id: string; startDate: string; durationWeeks: number; meetingSchedule: { day: string; time: string; timezone: string } }

// ─── API ─────────────────────────────────────────────────
const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/v1`;

const api = {
  token: () => localStorage.getItem("accessToken"),
  headers: () => ({ "Content-Type": "application/json", ...(api.token() && { Authorization: `Bearer ${api.token()}` }) },

  async req(endpoint: string, method = "GET", body?: any) {
    let res = await fetch(`${API_URL}${endpoint}`, { method, headers: api.headers(), ...(body && { body: JSON.stringify(body) }) });
    if (res.status === 401) {
      const rt = localStorage.getItem("refreshToken");
      if (rt) {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: rt }) });
        if (refreshRes.ok) {
          const { access_token, refresh_token } = await refreshRes.json();
          localStorage.setItem("accessToken", access_token);
          if (refresh_token) localStorage.setItem("refreshToken", refresh_token);
          res = await fetch(`${API_URL}${endpoint}`, { method, headers: api.headers(), ...(body && { body: JSON.stringify(body) }) });
        }
      }
    }
    if (!res.ok) throw new Error((await res.json()).error || "Request failed");
    return res.json();
  },

  login:    (email: string, password: string) => api.req("/auth/login",    "POST", { email, password }),
  register: (email: string, password: string, firstName: string, lastName: string) =>
    api.req("/auth/register", "POST", { email, password, firstName, lastName, dateOfBirth: new Date().toISOString().split("T")[0] }),

  logout: async () => {
    const rt = localStorage.getItem("refreshToken");
    if (rt) await api.req("/auth/logout", "POST", { refreshToken: rt }).catch(() => {});
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  getUser:          () => api.req("/users/me"),
  getGlucose:       () => api.req("/glucose"),
  addGlucose:       (data: any) => api.req("/glucose", "POST", data),
  getSymptoms:      () => api.req("/symptoms"),
  addSymptom:       (data: any) => api.req("/symptoms", "POST", data),
  getCycle:         () => api.req("/cycles/current"),
  startCycle:       (date: string) => api.req("/cycles", "POST", { cycleStartDate: date }),

  getConversations: () => api.req("/messages/conversations"),
  getMessages:      (id: string) => api.req(`/messages/${id}`),
  sendMessage:      (to: string, msg: string) => api.req("/messages", "POST", { recipientId: to, message: msg }),
  markRead:         (id: string) => api.req(`/messages/${id}/read`, "PUT"),

  getClients:       () => api.req("/coach/clients"),
  getClientGlucose: (id: string) => api.req(`/coach/clients/${id}/glucose`),
  getClientCycle:   (id: string) => api.req(`/coach/clients/${id}/cycle`),

  getGroups:        () => api.req("/groups"),
  getMyGroups:      () => api.req("/groups/my-groups"),
  joinGroup:        (id: string) => api.req(`/groups/${id}/join`, "POST"),
  createGroup:      (data: any) => api.req("/groups", "POST", data),
  getGroupMessages: (id: string) => api.req(`/groups/${id}/messages`),
  sendGroupMsg:     (id: string, msg: string) => api.req(`/groups/${id}/messages`, "POST", { message: msg }),
  genAccessCodes:   (id: string, qty = 5) => api.req(`/groups/${id}/access-codes`, "POST", { quantity: qty }),
};

// ─── Context ─────────────────────────────────────────────
const AppContext = createContext<any>(null);

function AppProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState(!!localStorage.getItem("accessToken"));
  const [user, setUser] = useState<User | null>(null);
  const [glucose, setGlucose] = useState<GlucoseReading[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!auth) return setLoading(false);
    setLoading(true); setError(null);
    try {
      const [u, g, s, c] = await Promise.all([
        api.getUser(), api.getGlucose(), api.getSymptoms(), api.getCycle()
      ]);
      setUser(u); setGlucose(g); setSymptoms(s); setCycle(c);
    } catch (e: any) {
      setError(e.message);
      if (e.message?.includes("token")) api.logout(), setAuth(false);
    } finally { setLoading(false); }
  }, [auth]);

  useEffect(() => { load(); }, [load]);

  const value = {
    isAuthenticated: auth,
    user, glucose, symptoms, cycle, loading, error,
    login: async (e: string, p: string) => { await api.login(e, p); setAuth(true); await load(); },
    register: async (e: string, p: string, fn: string, ln: string) => {
      await api.register(e, p, fn, ln); setAuth(true); await load();
    },
    logout: () => { api.logout(); setAuth(false); setUser(null); setGlucose([]); setSymptoms([]); setCycle(null); },
    refresh: load,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

// ─── UI Components (very compact) ────────────────────────
function AuthScreen({ isLogin }: { isLogin: boolean }) {
  const { login, register } = useApp();
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setErrorMsg("");
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.email, form.password, form.firstName, form.lastName);
    } catch (err: any) { setErrorMsg(err.message || "Failed"); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", padding: "1.5rem", background: "#fff", borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>{isLogin ? "Login" : "Sign Up"}</h2>
      <form onSubmit={submit} style={{ display: "grid", gap: "1rem" }}>
        {!isLogin && <>
          <input placeholder="First Name"  value={form.firstName}  onChange={e => setForm(f => ({ ...f, firstName:  e.target.value }))} />
          <input placeholder="Last Name"   value={form.lastName}   onChange={e => setForm(f => ({ ...f, lastName:   e.target.value }))} />
        </>}
        <input type="email"   placeholder="Email"    value={form.email}    onChange={e => setForm(f => ({ ...f, email:    e.target.value }))} />
        <input type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        <button type="submit" disabled={loading} style={{ padding: "0.9rem", background: "#4a6", color: "white", border: "none", borderRadius: 8 }}>
          {loading ? "..." : isLogin ? "Login" : "Sign Up"}
        </button>
        {errorMsg && <p style={{ color: "crimson", textAlign: "center" }}>{errorMsg}</p>}
      </form>
      <p style={{ textAlign: "center", marginTop: "1rem" }}>
        {isLogin ? "No account?" : "Already have one?"} {" "}
        <a href="#" onClick={e => { e.preventDefault(); window.location.hash = isLogin ? "#signup" : "#login"; }}>
          {isLogin ? "Sign up" : "Login"}
        </a>
      </p>
    </div>
  );
}

function Dashboard() {
  const { user, logout, loading: globalLoading, refresh } = useApp();
  const [tab, setTab] = useState("home");

  if (globalLoading) return <div style={{ textAlign: "center", padding: "4rem" }}>Loading...</div>;

  const isCoach = user?.role === "coach";

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "1rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.8rem" }}>🌿 GraceFlow</h1>
        <button onClick={logout} style={{ background: "none", border: "none", color: "#e44", fontWeight: 500 }}>Logout</button>
      </header>

      {tab === "home"    && <Home />}
      {tab === "glucose"  && <GlucoseTab refresh={refresh} />}
      {tab === "symptoms" && <SymptomsTab refresh={refresh} />}
      {tab === "cycle"    && <CycleTab refresh={refresh} />}
      {tab === "messages" && <Messages />}
      {tab === "groups"   && <Groups refresh={refresh} />}
      {tab === "coach" && isCoach && <CoachDashboard refresh={refresh} />}
      {tab === "settings" && <Settings />}

      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(255,255,255,0.95)", borderTop: "1px solid #ddd",
        display: "flex", justifyContent: "space-around", padding: "0.5rem 0",
        backdropFilter: "blur(8px)", fontSize: "0.8rem"
      }}>
        {["home", "glucose", "symptoms", "cycle", "messages", "groups", ...(isCoach ? ["coach"] : []), "settings"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "none", border: "none", padding: "0.5rem",
              color: tab === t ? "#4a6" : "#666", fontWeight: tab === t ? 600 : 400
            }}
          >
            {t === "home" ? "🏠" : t === "glucose" ? "📈" : t === "symptoms" ? "😔" : t === "cycle" ? "📅" : t === "messages" ? "💬" : t === "groups" ? "👥" : t === "coach" ? "🧑‍🏫" : "⚙️"}
            <div style={{ fontSize: "0.7rem" }}>{t[0].toUpperCase() + t.slice(1)}</div>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── Minimal placeholder tabs (expand as needed) ─────────
function Home() {
  const { user, glucose, symptoms, cycle } = useApp();
  return (
    <div>
      <h2>Welcome, {user?.first_name}</h2>
      <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: 12, margin: "1rem 0" }}>
        <p><strong>Latest Glucose:</strong> {glucose[0]?.value ?? "—"} mg/dL</p>
        <p><strong>Recent Symptom:</strong> {symptoms[0]?.symptom_type ?? "None"}</p>
        <p><strong>Cycle Day:</strong> {cycle?.current_day ?? "Not tracking"}</p>
      </div>
    </div>
  );
}

function GlucoseTab({ refresh }: { refresh: () => Promise<void> }) {
  const [value, setValue] = useState(""); const [notes, setNotes] = useState(""); const [saving, setSaving] = useState(false);
  const { glucose } = useApp();

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.addGlucose({ value: Number(value), measured_at: new Date().toISOString(), notes });
      setValue(""); setNotes(""); await refresh();
    } catch {} finally { setSaving(false); }
  };

  return (
    <>
      <h2>Glucose</h2>
      <form onSubmit={add} style={{ display: "grid", gap: "0.8rem", marginBottom: "1.5rem" }}>
        <input type="number" placeholder="Value (mg/dL)" value={value} onChange={e => setValue(e.target.value)} required />
        <input placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
        <button type="submit" disabled={saving || !value}>{saving ? "..." : "Add"}</button>
      </form>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {glucose.slice(0, 8).map(r => (
          <li key={r.id} style={{ padding: "0.6rem 0", borderBottom: "1px solid #eee" }}>
            <strong>{r.value} mg/dL</strong> – {new Date(r.measured_at).toLocaleString()}
            {r.notes && <div style={{ color: "#555", fontSize: "0.9rem" }}>{r.notes}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}

// Similar compact pattern for SymptomsTab, CycleTab, Messages, Groups, CoachDashboard...

function Groups({ refresh }: { refresh: () => Promise<void> }) {
  const { user } = useApp();
  const isCoach = user?.role === "coach";
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [chatGroup, setChatGroup] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all([api.getGroups(), api.getMyGroups()]).then(([g, mg]) => {
      setGroups(g); setMyGroups(mg);
    });
  }, []);

  useEffect(() => {
    if (chatGroup) api.getGroupMessages(chatGroup).then(setMessages);
  }, [chatGroup]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatGroup || !msg.trim()) return;
    await api.sendGroupMsg(chatGroup, msg);
    setMsg("");
    api.getGroupMessages(chatGroup).then(setMessages);
  };

  if (chatGroup) {
    const group = [...groups, ...myGroups].find(g => g.id === chatGroup);
    return (
      <div>
        <h2>{group?.name || "Group Chat"}</h2>
        <button onClick={() => setChatGroup(null)}>← Back</button>
        <div style={{ maxHeight: 360, overflowY: "auto", margin: "1rem 0", padding: "0.5rem", border: "1px solid #ddd" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ margin: "0.6rem 0", textAlign: m.sender_id === user?.id ? "right" : "left" }}>
              <strong>{m.sender?.first_name || "?"}:</strong> {m.message}
              <div style={{ fontSize: "0.75rem", color: "gray" }}>{new Date(m.created_at).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
        <form onSubmit={send} style={{ display: "flex", gap: "0.5rem" }}>
          <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Message..." style={{ flex: 1 }} />
          <button type="submit">Send</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h2>Groups</h2>
      <h3>My Groups</h3>
      <ul style={{ padding: 0 }}>
        {myGroups.map(g => (
          <li key={g.id} onClick={() => setChatGroup(g.id)} style={{ padding: "0.8rem", borderBottom: "1px solid #eee", cursor: "pointer" }}>
            {g.name}
          </li>
        ))}
      </ul>
      <h3>Available</h3>
      <ul style={{ padding: 0 }}>
        {groups.map(g => (
          <li key={g.id} style={{ padding: "0.8rem", borderBottom: "1px solid #eee" }}>
            {g.name}
            {!isCoach && <button onClick={() => api.joinGroup(g.id).then(refresh)} style={{ marginLeft: "1rem" }}>Join</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CoachDashboard({ refresh }: { refresh: () => Promise<void> }) {
  const { user } = useApp();
  const [clients, setClients] = useState<any[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selected, setSelected] = useState<string | null>(null); // client or group id
  const [isGroup, setIsGroup] = useState(false);

  useEffect(() => {
    Promise.all([api.getClients(), api.getGroups()]).then(([c, g]) => {
      setClients(c);
      setGroups(g.filter((gr: Group) => gr.coach_id === user?.id));
    });
  }, [user?.id]);

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)}>← Back</button>
        <h3>{isGroup ? "Group Chat" : "Client Details"}</h3>
        {/* Add detailed view / chat here when needed */}
      </div>
    );
  }

  return (
    <div>
      <h2>Coach Dashboard</h2>
      <button onClick={refresh}>Refresh</button>

      <h3>Clients</h3>
      <ul style={{ padding: 0 }}>
        {clients.map(c => (
          <li key={c.id} onClick={() => { setSelected(c.id); setIsGroup(false); }} style={{ padding: "0.6rem", cursor: "pointer" }}>
            {c.first_name} {c.last_name}
          </li>
        ))}
      </ul>

      <h3>Groups</h3>
      <ul style={{ padding: 0 }}>
        {groups.map(g => (
          <li key={g.id} onClick={() => { setSelected(g.id); setIsGroup(true); }} style={{ padding: "0.6rem", cursor: "pointer" }}>
            {g.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────
function App() {
  const { isAuthenticated } = useApp();
  const [isLogin, setIsLogin] = useState(true);

  if (isAuthenticated) return <Dashboard />;

  return (
    <AuthScreen isLogin={isLogin} />
    // You can toggle between login/signup with a link/button in AuthScreen
  );
}

export default function Root() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}