// GraceFlowWebApp.tsx — Redesigned MVP
// Clean, modern health dashboard inspired by the mobile design reference

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "user" | "coach";
}

interface GlucoseReading {
  id?: number;
  value: number;
  measured_at: string;
  unit?: string;
  source?: string;
  notes?: string;
  created_at?: string;
}

interface Symptom {
  id?: number;
  symptom_type: string;
  severity: number;
  notes?: string;
  created_at?: string;
  logged_at?: string;
}

interface Cycle {
  id?: number;
  cycle_start_date: string;
  current_day?: number;
  phase?: string;
}

type NavView = "dashboard" | "glucose" | "symptoms" | "cycle";

// ─── NOTIFICATION TYPES ───────────────────────────────────────────────────────

interface AppNotification {
  id: string;
  type: "sync_complete" | "client_synced" | "high_glucose" | "low_glucose" | "critical_glucose";
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────

const API_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:3000/api/v1";

// Mock data for demo/dev — swap for real API calls
const MOCK_READINGS: GlucoseReading[] = [
  { id: 1, value: 94,  measured_at: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: 2, value: 102, measured_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 3, value: 88,  measured_at: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 4, value: 110, measured_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 5, value: 97,  measured_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 6, value: 105, measured_at: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 7, value: 91,  measured_at: new Date().toISOString() },
];

const MOCK_SYMPTOMS: Symptom[] = [
  { id: 1, symptom_type: "Fatigue",   severity: 2, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 2, symptom_type: "Headache",  severity: 1, created_at: new Date().toISOString() },
  { id: 3, symptom_type: "Brain fog", severity: 3, created_at: new Date().toISOString() },
];

class ApiService {
  private headers(): HeadersInit {
    const token = localStorage.getItem("accessToken");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private saveTokens(data: any) {
    const access  = data.access_token  ?? data.accessToken;
    const refresh = data.refresh_token ?? data.refreshToken;
    if (access)  localStorage.setItem("accessToken",  access);
    if (refresh) localStorage.setItem("refreshToken", refresh);
  }

  async login(email: string, password: string): Promise<User> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Login failed. Check your credentials.");
    const data = await res.json();
    this.saveTokens(data);
    return data.user ?? data.data?.user ?? data;
  }

  async register(userData: Record<string, unknown>): Promise<User> {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Registration failed.");
    this.saveTokens(data);
    return data.user ?? data.data?.user ?? data;
  }

  async getGlucoseReadings(): Promise<GlucoseReading[]> {
    try {
      const res = await fetch(`${API_URL}/glucose`, { headers: this.headers() });
      if (!res.ok) return MOCK_READINGS;
      const data = await res.json();
      return Array.isArray(data) ? data : data.readings ?? MOCK_READINGS;
    } catch {
      return MOCK_READINGS;
    }
  }

  async createGlucoseReading(reading: {
    value: number;
    measured_at: string;
    notes?: string;
  }): Promise<GlucoseReading> {
    const res = await fetch(`${API_URL}/glucose`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        value: reading.value,
        measuredAt: reading.measured_at,
        unit: "mg/dL",
        source: "manual",
        notes: reading.notes,
      }),
    });
    if (!res.ok) throw new Error("Failed to save reading.");
    return res.json();
  }

  async getSymptoms(): Promise<Symptom[]> {
    try {
      const res = await fetch(`${API_URL}/symptoms`, { headers: this.headers() });
      if (!res.ok) return MOCK_SYMPTOMS;
      const data = await res.json();
      return Array.isArray(data) ? data : data.symptoms ?? MOCK_SYMPTOMS;
    } catch {
      return MOCK_SYMPTOMS;
    }
  }

  async createSymptom(
    symptom: Omit<Symptom, "id" | "created_at" | "logged_at">
  ): Promise<Symptom> {
    const res = await fetch(`${API_URL}/symptoms`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        symptomType: symptom.symptom_type,
        severity: symptom.severity,
        notes: symptom.notes,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error("Failed to save symptom.");
    return data?.data ?? data?.symptom ?? data;
  }

  async getCurrentCycle(): Promise<Cycle | null> {
    try {
      const res = await fetch(`${API_URL}/cycle/current`, { headers: this.headers() });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      const data = await res.json();
      return data?.cycle ?? data ?? null;
    } catch {
      return null;
    }
  }

  async createCycle(startDate: string): Promise<Cycle> {
    const res = await fetch(`${API_URL}/cycle`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ start_date: startDate }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error("Failed to start cycle.");
    return data as Cycle;
  }

  async getNotifications(): Promise<AppNotification[]> {
    try {
      const res = await fetch(`${API_URL}/notifications`, { headers: this.headers() });
      if (!res.ok) return [];
      return res.json();
    } catch { return []; }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const res = await fetch(`${API_URL}/notifications/unread-count`, { headers: this.headers() });
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count ?? 0;
    } catch { return 0; }
  }

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`${API_URL}/notifications/${id}/read`, {
      method: "PATCH", headers: this.headers(),
    });
  }

  async markAllNotificationsRead(): Promise<void> {
    await fetch(`${API_URL}/notifications/read-all`, {
      method: "PATCH", headers: this.headers(),
    });
  }

  logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}

const api = new ApiService();

// ─── STATE / CONTEXT ──────────────────────────────────────────────────────────

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  readings: GlucoseReading[];
  symptoms: Symptom[];
  currentCycle: Cycle | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  loadData: () => Promise<void>;
  addGlucoseReading: (r: Omit<GlucoseReading, "id" | "created_at">) => Promise<void>;
  addSymptom: (s: Omit<Symptom, "id" | "created_at">) => Promise<void>;
  startCycle: (date: string) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

const useApp = (): AppState => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
};

function AppProvider({ children }: { children: React.ReactNode }) {
  const [user,         setUser]         = useState<User | null>(null);
  const [readings,     setReadings]     = useState<GlucoseReading[]>([]);
  const [symptoms,     setSymptoms]     = useState<Symptom[]>([]);
  const [currentCycle, setCurrentCycle] = useState<Cycle | null>(null);
  const [isLoading,    setIsLoading]    = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [g, s, c] = await Promise.allSettled([
        api.getGlucoseReadings(),
        api.getSymptoms(),
        api.getCurrentCycle(),
      ]);
      if (g.status === "fulfilled") setReadings(g.value);
      if (s.status === "fulfilled") setSymptoms(s.value);
      if (c.status === "fulfilled") setCurrentCycle(c.value);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const login = async (email: string, password: string) => {
    const u = await api.login(email, password);
    setUser(u);
  };

  const register = async (userData: Record<string, unknown>) => {
    const u = await api.register(userData);
    setUser(u);
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setReadings([]);
    setSymptoms([]);
    setCurrentCycle(null);
  };

  const addGlucoseReading = async (reading: Omit<GlucoseReading, "id" | "created_at">) => {
    const r = await api.createGlucoseReading(reading as any);
    setReadings(prev => [r, ...prev]);
  };

  const addSymptom = async (symptom: Omit<Symptom, "id" | "created_at">) => {
    const s = await api.createSymptom(symptom);
    setSymptoms(prev => [s, ...prev]);
  };

  const startCycle = async (date: string) => {
    const c = await api.createCycle(date);
    setCurrentCycle(c);
  };

  const value: AppState = {
    user, isAuthenticated: !!user, readings, symptoms, currentCycle,
    isLoading, login, register, logout, loadData,
    addGlucoseReading, addSymptom, startCycle,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────

const C = {
  bg:          "#F6F5F1",
  surface:     "#FFFFFF",
  surfaceAlt:  "#F0EEE8",
  border:      "rgba(0,0,0,0.07)",
  forest:      "#3D5540",
  sage:        "#6B7F6E",
  sageLight:   "#EAF0EB",
  mist:        "#C8D5CA",
  text:        "#1C1F1C",
  textMid:     "#555855",
  textSoft:    "#8E918E",
  red:         "#C85A54",
  redLight:    "rgba(200,90,84,0.1)",
  gold:        "#B8975A",
  goldLight:   "rgba(184,151,90,0.12)",
  // Glucose zones
  low:         "#5A9BC8",
  normal:      "#6B7F6E",
  high:        "#C87A5A",
  critical:    "#C85A54",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function glucoseStatus(v: number): { label: string; color: string; bg: string } {
  if (v < 70)  return { label: "Low",      color: C.low,    bg: "rgba(90,155,200,0.12)" };
  if (v <= 99) return { label: "Normal",   color: C.normal, bg: C.sageLight };
  if (v <= 125)return { label: "Elevated", color: C.gold,   bg: C.goldLight };
  return             { label: "High",      color: C.red,    bg: C.redLight };
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── SMALL SHARED COMPONENTS ──────────────────────────────────────────────────

const Badge = ({
  label, color, bg,
}: { label: string; color: string; bg: string }) => (
  <span style={{
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 600,
    color,
    background: bg,
    letterSpacing: "0.3px",
  }}>
    {label}
  </span>
);

const Card = ({
  children, style, onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    style={{
      background: C.surface,
      borderRadius: 20,
      border: `1px solid ${C.border}`,
      padding: "20px 24px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      ...style,
    }}
  >
    {children}
  </div>
);

const Input = ({
  label, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div style={{ marginBottom: 16 }}>
    {label && (
      <label style={{
        display: "block", fontSize: 13, fontWeight: 700,
        color: C.text, marginBottom: 6, letterSpacing: "0.2px",
      }}>
        {label}
      </label>
    )}
    <input
      {...props}
      style={{
        width: "100%", padding: "13px 16px", fontSize: 15,
        border: `1.5px solid ${C.border}`, borderRadius: 14,
        background: C.surfaceAlt, color: C.text,
        outline: "none", boxSizing: "border-box",
        transition: "border-color 0.2s",
        ...props.style,
      }}
    />
  </div>
);

const PrimaryButton = ({
  children, loading, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
  <button
    {...props}
    disabled={props.disabled || loading}
    style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 8, width: "100%", height: 52, borderRadius: 16, border: "none",
      background: loading || props.disabled
        ? C.mist
        : `linear-gradient(135deg, ${C.sage} 0%, ${C.forest} 100%)`,
      color: loading || props.disabled ? C.textSoft : "#fff",
      fontSize: 15, fontWeight: 700, cursor: loading || props.disabled ? "not-allowed" : "pointer",
      boxShadow: loading || props.disabled ? "none" : "0 6px 20px rgba(61,85,64,0.25)",
      transition: "all 0.2s",
      ...props.style,
    }}
  >
    {loading ? <Spinner size={18} color="#fff" /> : children}
  </button>
);

const Spinner = ({ size = 22, color = C.sage }: { size?: number; color?: string }) => (
  <div style={{
    width: size, height: size,
    border: `2px solid ${color}30`,
    borderTopColor: color,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  }} />
);

const ErrorBanner = ({ message }: { message: string }) => (
  <div style={{
    padding: "12px 16px", background: C.redLight,
    border: `1px solid rgba(200,90,84,0.3)`, borderRadius: 12,
    color: C.red, fontSize: 14, marginBottom: 16,
  }}>
    {message}
  </div>
);

// Severity dots
const SeverityDots = ({ value }: { value: number }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {[1,2,3,4,5].map(i => (
      <div key={i} style={{
        width: 8, height: 8, borderRadius: "50%",
        background: i <= value ? C.sage : C.mist,
        transition: "background 0.2s",
      }} />
    ))}
  </div>
);

// ─── CYCLE RHYTHMS ────────────────────────────────────────────────────────────

const RHYTHMS = {
  menstrual:  { name: "Reawaken",  emoji: "🌱", color: "#C8785A", bg: "rgba(200,120,90,0.08)",  scripture: "Isaiah 43:19",  verse: "I am about to do a new thing...",           practice: "Surrender. Rest. Make space for what God is preparing." },
  follicular: { name: "Renew",     emoji: "🍃", color: C.sage,    bg: C.sageLight,              scripture: "Proverbs 16:3", verse: "Commit your work to the Lord...",           practice: "Set intentions. Partner with God in fresh beginnings."  },
  ovulatory:  { name: "Radiant",   emoji: "🌞", color: C.gold,    bg: C.goldLight,              scripture: "Psalm 34:5",    verse: "Those who look to Him will be radiant...", practice: "Shine. Encourage others. Bless from abundance."         },
  luteal:     { name: "Rooted",    emoji: "🌾", color: C.forest,  bg: "rgba(61,85,64,0.1)",     scripture: "Psalm 46:10",   verse: "Be still and know that I am God.",         practice: "Simplify. Create boundaries. Prioritize stillness."     },
} as const;

type PhaseKey = keyof typeof RHYTHMS;

// ─── AUTH SCREENS ─────────────────────────────────────────────────────────────

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(160deg, ${C.bg} 0%, #E4EDE5 100%)`,
      padding: 20,
      fontFamily: "'Georgia', 'Times New Roman', serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        input:focus { border-color: ${C.sage} !important; background: #fff !important; }
      `}</style>
      <div style={{
        width: "100%", maxWidth: 420,
        animation: "fadeUp 0.45s ease both",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 38, marginBottom: 8 }}>🌿</div>
          <div style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 36, color: C.forest, letterSpacing: "-0.5px",
          }}>
            GraceFlow
          </div>
          <div style={{ fontSize: 14, color: C.textSoft, marginTop: 4 }}>
            Track your glucose & cycle with grace
          </div>
        </div>

        <Card style={{ padding: "32px 28px" }}>
          {children}
        </Card>
      </div>
    </div>
  );
}

function LoginScreen({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { login } = useApp();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <form onSubmit={handleSubmit}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 24, textAlign: "center" }}>
          Welcome back
        </h2>
        {error && <ErrorBanner message={error} />}
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" disabled={loading} />
        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" disabled={loading} />
        <PrimaryButton type="submit" loading={loading} style={{ marginTop: 8 }}>
          Sign In
        </PrimaryButton>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: C.textSoft }}>
          New to GraceFlow?{" "}
          <button
            type="button" onClick={onSwitchToRegister}
            style={{ background: "none", border: "none", color: C.sage, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
          >
            Create account
          </button>
        </p>
      </form>
    </AuthShell>
  );
}

function RegisterScreen({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { register } = useApp();
  const [form, setForm] = useState({
    email: "", password: "", confirmPassword: "",
    first_name: "", last_name: "", role: "user" as "user" | "coach",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.first_name || !form.last_name) {
      setError("Please fill in all required fields."); return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match."); return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters."); return;
    }
    setLoading(true); setError("");
    try {
      const { confirmPassword: _c, ...userData } = form;
      await register({ ...userData, email: userData.email.trim().toLowerCase() });
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <form onSubmit={handleSubmit}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 24, textAlign: "center" }}>
          Create your account
        </h2>
        {error && <ErrorBanner message={error} />}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="First name *" type="text" value={form.first_name} onChange={e => set("first_name", e.target.value)} disabled={loading} />
          <Input label="Last name *"  type="text" value={form.last_name}  onChange={e => set("last_name",  e.target.value)} disabled={loading} />
        </div>
        <Input label="Email *"            type="email"    value={form.email}           onChange={e => set("email",           e.target.value)} disabled={loading} />
        <Input label="Password *"         type="password" value={form.password}         onChange={e => set("password",         e.target.value)} placeholder="Min 8 characters" disabled={loading} />
        <Input label="Confirm password *" type="password" value={form.confirmPassword}  onChange={e => set("confirmPassword",  e.target.value)} disabled={loading} />

        {/* Role toggle */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
            I am a...
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {(["user", "coach"] as const).map(role => (
              <button
                key={role} type="button"
                onClick={() => set("role", role)}
                style={{
                  padding: "10px 0", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer",
                  border: form.role === role ? `2px solid ${C.sage}` : `1.5px solid ${C.border}`,
                  background: form.role === role ? C.sageLight : C.surfaceAlt,
                  color: form.role === role ? C.forest : C.textMid,
                  transition: "all 0.2s",
                }}
              >
                {role === "user" ? "👤 Member" : "🌿 Coach"}
              </button>
            ))}
          </div>
        </div>

        <PrimaryButton type="submit" loading={loading}>
          Create Account
        </PrimaryButton>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: C.textSoft }}>
          Already have an account?{" "}
          <button
            type="button" onClick={onSwitchToLogin}
            style={{ background: "none", border: "none", color: C.sage, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
          >
            Sign in
          </button>
        </p>
      </form>
    </AuthShell>
  );
}

// ─── NOTIFICATION BELL (coach + user alerts) ──────────────────────────────────

function timeAgo(iso: string): string {
  const diffMs  = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)  return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function notifColor(type: AppNotification["type"]): string {
  if (type === "critical_glucose")          return C.red;
  if (type === "high_glucose")              return C.gold;
  if (type === "low_glucose")               return C.low;
  if (type === "client_synced")             return C.sage;
  return C.textSoft;
}

function NotificationBell() {
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);

  // Poll for unread count every 30 s
  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      const count = await api.getUnreadCount();
      if (mounted) setUnreadCount(count);
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Load full list when bell is opened
  const openPanel = async () => {
    setOpen(true);
    setLoading(true);
    const list = await api.getNotifications();
    setNotifications(list);
    setUnreadCount(list.filter(n => !n.is_read).length);
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAll = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={() => open ? setOpen(false) : openPanel()}
        style={{
          position: "relative", width: 38, height: 38, borderRadius: 12,
          border: `1px solid ${C.border}`, background: open ? C.sageLight : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 17, transition: "all 0.2s",
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            minWidth: 18, height: 18, borderRadius: 9,
            background: C.red, color: "#fff",
            fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px", border: "2px solid #F6F5F1",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 199,
            }}
          />
          <div style={{
            position: "absolute", top: 46, right: 0,
            width: 340, maxHeight: 480,
            background: C.surface,
            borderRadius: 18, border: `1px solid ${C.border}`,
            boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
            zIndex: 200, overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}>
            {/* Panel header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 18px",
              borderBottom: `1px solid ${C.border}`,
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAll}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 12, color: C.sage, fontWeight: 600,
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
                  <Spinner size={24} />
                </div>
              ) : notifications.length === 0 ? (
                <div style={{
                  padding: "40px 24px", textAlign: "center",
                  fontSize: 14, color: C.textSoft,
                }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>🔔</div>
                  No notifications yet
                </div>
              ) : (
                notifications.map((n, i) => (
                  <div
                    key={n.id}
                    onClick={() => { if (!n.is_read) markRead(n.id); }}
                    style={{
                      padding: "14px 18px",
                      borderBottom: i < notifications.length - 1 ? `1px solid ${C.border}` : "none",
                      background: n.is_read ? "transparent" : `${C.sageLight}80`,
                      cursor: n.is_read ? "default" : "pointer",
                      transition: "background 0.2s",
                      display: "flex", alignItems: "flex-start", gap: 12,
                    }}
                  >
                    {/* Color dot */}
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 5,
                      background: n.is_read ? C.mist : notifColor(n.type),
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 13, fontWeight: n.is_read ? 500 : 700,
                        color: n.is_read ? C.textMid : C.text,
                        marginBottom: 3,
                      }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: 11, color: C.textSoft, marginTop: 5 }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: NavView; label: string; icon: string }[] = [
  { id: "dashboard", label: "Home",     icon: "⌂"  },
  { id: "glucose",   label: "Glucose",  icon: "◉"  },
  { id: "symptoms",  label: "Symptoms", icon: "✦"  },
  { id: "cycle",     label: "Cycle",    icon: "◌"  },
];

function AppNav({
  view, setView, onLogout, userName,
}: {
  view: NavView;
  setView: (v: NavView) => void;
  onLogout: () => void;
  userName: string;
}) {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(246,245,241,0.88)",
      backdropFilter: "blur(16px)",
      borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", gap: 4,
      padding: "10px 20px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Brand */}
      <div style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: 20, color: C.forest, marginRight: 12,
        letterSpacing: "-0.3px",
      }}>
        🌿
      </div>

      {/* Nav items */}
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 12, border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 600, transition: "all 0.2s",
            background: view === item.id ? C.sageLight : "transparent",
            color: view === item.id ? C.forest : C.textSoft,
          }}
        >
          <span style={{ fontSize: 15 }}>{item.icon}</span>
          {item.label}
        </button>
      ))}

      {/* Right side */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <NotificationBell />
        <span style={{ fontSize: 13, color: C.textSoft, fontWeight: 500 }}>
          {userName}
        </span>
        <button
          onClick={onLogout}
          style={{
            padding: "7px 14px", borderRadius: 12, border: `1px solid ${C.border}`,
            background: "transparent", color: C.red, fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s",
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}

// ─── DASHBOARD VIEW ───────────────────────────────────────────────────────────

function DashboardView({ setView }: { setView: (v: NavView) => void }) {
  const { user, readings, symptoms, currentCycle, isLoading } = useApp();

  const avgGlucose = useMemo(() => {
    if (!readings.length) return 0;
    return Math.round(readings.reduce((s, r) => s + Number(r.value), 0) / readings.length);
  }, [readings]);

  const latestReading = readings[0];

  const cycleDay = currentCycle
    ? Math.floor((Date.now() - new Date(currentCycle.cycle_start_date).getTime()) / 86400000) + 1
    : 0;

  const phase = (currentCycle?.phase as PhaseKey | undefined);
  const rhythm = RHYTHMS[phase && RHYTHMS[phase] ? phase : "follicular"];

  const todaySymptoms = symptoms.filter(s => {
    const d = new Date(s.created_at || s.logged_at || "");
    return d.toDateString() === new Date().toDateString();
  });

  // Chart data (last 7 readings)
  const chartData = useMemo(() =>
    [...readings].reverse().slice(-7).map(r => ({
      label: formatDateShort(r.measured_at),
      value: r.value,
    })),
    [readings]
  );

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 30, color: C.text, letterSpacing: "-0.5px",
        }}>
          Good {getTimeOfDay()}, {user?.first_name}.
        </div>
        {currentCycle && (
          <div style={{ fontSize: 14, color: C.textSoft, marginTop: 4 }}>
            Cycle day {cycleDay} · {rhythm.name} phase
          </div>
        )}
      </div>

      {/* Top stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        {/* Latest glucose */}
        <Card style={{ cursor: "pointer" }} onClick={() => setView("glucose")}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textSoft, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 12 }}>
            Latest Glucose
          </div>
          {latestReading ? (
            <>
              <div style={{ fontSize: 44, fontWeight: 300, color: C.text, letterSpacing: "-1px", lineHeight: 1 }}>
                {latestReading.value}
              </div>
              <div style={{ fontSize: 12, color: C.textSoft, marginTop: 4, marginBottom: 10 }}>mg/dL</div>
              <Badge {...glucoseStatus(latestReading.value)} />
            </>
          ) : (
            <div style={{ fontSize: 13, color: C.textSoft, marginTop: 8 }}>No readings yet</div>
          )}
        </Card>

        {/* Average */}
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textSoft, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 12 }}>
            7-Day Avg
          </div>
          <div style={{ fontSize: 44, fontWeight: 300, color: C.text, letterSpacing: "-1px", lineHeight: 1 }}>
            {avgGlucose || "—"}
          </div>
          <div style={{ fontSize: 12, color: C.textSoft, marginTop: 4, marginBottom: 10 }}>mg/dL</div>
          {avgGlucose > 0 && <Badge {...glucoseStatus(avgGlucose)} />}
        </Card>

        {/* Symptoms today */}
        <Card style={{ cursor: "pointer" }} onClick={() => setView("symptoms")}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textSoft, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 12 }}>
            Symptoms Today
          </div>
          <div style={{ fontSize: 44, fontWeight: 300, color: C.text, letterSpacing: "-1px", lineHeight: 1 }}>
            {todaySymptoms.length}
          </div>
          <div style={{ fontSize: 12, color: C.textSoft, marginTop: 4, marginBottom: 10 }}>logged</div>
          {todaySymptoms.slice(0, 2).map(s => (
            <Badge key={s.id} label={s.symptom_type} color={C.sage} bg={C.sageLight} />
          ))}
        </Card>
      </div>

      {/* Trend chart */}
      {chartData.length > 1 && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textMid, marginBottom: 16, letterSpacing: "0.3px" }}>
            Glucose Trend
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.textSoft }} />
              <YAxis tick={{ fontSize: 11, fill: C.textSoft }} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 13 }}
                formatter={(v: any) => `${v ?? "—"} mg/dL`}
              />
              <ReferenceLine y={70}  stroke={C.low}    strokeDasharray="4 4" />
              <ReferenceLine y={99}  stroke={C.normal} strokeDasharray="4 4" />
              <ReferenceLine y={126} stroke={C.red}    strokeDasharray="4 4" />
              <Line
                type="monotone" dataKey="value" stroke={C.sage}
                strokeWidth={2.5} dot={{ r: 4, fill: C.sage, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: C.forest }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            {[
              { color: C.low,    label: "Low (<70)" },
              { color: C.normal, label: "Normal (70–99)" },
              { color: C.gold,   label: "Elevated (100–125)" },
              { color: C.red,    label: "High (≥126)" },
            ].map(z => (
              <div key={z.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: z.color }} />
                <span style={{ fontSize: 11, color: C.textSoft }}>{z.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Rhythm card */}
      <Card style={{ background: rhythm.bg, border: `1px solid ${rhythm.color}20`, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ fontSize: 32, lineHeight: 1 }}>{rhythm.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: rhythm.color, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>
              Today's Rhythm
            </div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 22, color: C.text, marginBottom: 4,
            }}>
              {rhythm.name}
            </div>
            <div style={{ fontSize: 13, color: C.textSoft, fontStyle: "italic", marginBottom: 8 }}>
              "{rhythm.verse}" — {rhythm.scripture}
            </div>
            <div style={{ fontSize: 13, color: C.textMid }}>{rhythm.practice}</div>
          </div>
        </div>
      </Card>

      {/* Empty state */}
      {!latestReading && (
        <Card style={{ textAlign: "center", padding: "40px 24px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
          <div style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 22, color: C.text, marginBottom: 8,
          }}>
            Your journey begins here
          </div>
          <div style={{ fontSize: 14, color: C.textSoft, marginBottom: 24 }}>
            Log your first glucose reading to start seeing your patterns.
          </div>
          <button
            onClick={() => setView("glucose")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 14, border: "none",
              background: `linear-gradient(135deg, ${C.sage}, ${C.forest})`,
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            + Log Glucose
          </button>
        </Card>
      )}
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

// ─── GLUCOSE VIEW ─────────────────────────────────────────────────────────────

function GlucoseView() {
  const { readings, addGlucoseReading } = useApp();
  const [showForm,  setShowForm]  = useState(false);
  const [value,     setValue]     = useState("");
  const [notes,     setNotes]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(value);
    if (!value || isNaN(num) || num < 20 || num > 600) {
      setError("Enter a valid glucose value (20–600 mg/dL).");
      return;
    }
    setLoading(true); setError("");
    try {
      await addGlucoseReading({ value: num, measured_at: new Date().toISOString(), notes: notes || undefined });
      setValue(""); setNotes(""); setShowForm(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save reading.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: C.text }}>
            Glucose
          </div>
          <div style={{ fontSize: 13, color: C.textSoft, marginTop: 2 }}>
            {readings.length} reading{readings.length !== 1 ? "s" : ""} logged
          </div>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 14, border: "none",
            background: showForm
              ? C.surfaceAlt
              : `linear-gradient(135deg, ${C.sage}, ${C.forest})`,
            color: showForm ? C.textMid : "#fff",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: showForm ? "none" : "0 4px 14px rgba(61,85,64,0.2)",
          }}
        >
          {showForm ? "✕ Cancel" : "+ Add Reading"}
        </button>
      </div>

      {success && (
        <div style={{
          padding: "12px 16px", background: C.sageLight, borderRadius: 12,
          color: C.forest, fontSize: 14, fontWeight: 600, marginBottom: 16,
        }}>
          ✓ Reading saved successfully
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <Card style={{ marginBottom: 24, border: `1.5px solid ${C.mist}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 20 }}>
            New Reading
          </div>
          <form onSubmit={handleAdd}>
            {error && <ErrorBanner message={error} />}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <Input
                  label="Glucose value (mg/dL) *"
                  type="number"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder="e.g. 95"
                  min={20} max={600}
                  disabled={loading}
                />
                {value && !isNaN(parseFloat(value)) && (
                  <div style={{ marginTop: -8, marginBottom: 12 }}>
                    <Badge {...glucoseStatus(parseFloat(value))} />
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="After meal, fasting, etc."
                  disabled={loading}
                  style={{
                    width: "100%", padding: "13px 16px", fontSize: 14,
                    border: `1.5px solid ${C.border}`, borderRadius: 14,
                    background: C.surfaceAlt, color: C.text,
                    outline: "none", resize: "none", height: 80,
                    fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
            <PrimaryButton type="submit" loading={loading}>
              Save Reading
            </PrimaryButton>
          </form>
        </Card>
      )}

      {/* Readings list */}
      {readings.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>◉</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>No readings yet</div>
          <div style={{ fontSize: 14, color: C.textSoft }}>Add your first glucose reading above.</div>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {readings.map((r, i) => {
            const status = glucoseStatus(r.value);
            return (
              <div
                key={r.id ?? i}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 24px",
                  borderBottom: i < readings.length - 1 ? `1px solid ${C.border}` : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: status.bg, display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 600, color: status.color }}>
                      {r.value}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                      {r.value} <span style={{ fontWeight: 400, color: C.textSoft, fontSize: 12 }}>mg/dL</span>
                    </div>
                    <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>
                      {formatDateTime(r.measured_at)}
                    </div>
                    {r.notes && (
                      <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2, fontStyle: "italic" }}>
                        {r.notes}
                      </div>
                    )}
                  </div>
                </div>
                <Badge {...status} />
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

// ─── SYMPTOMS VIEW ────────────────────────────────────────────────────────────

const SYMPTOM_OPTIONS = [
  "Fatigue", "Headache", "Brain fog", "Bloating", "Cramps",
  "Mood changes", "Nausea", "Dizziness", "Insomnia", "Anxiety",
];

function SymptomsView() {
  const { symptoms, addSymptom } = useApp();
  const [showForm,      setShowForm]      = useState(false);
  const [symptomType,   setSymptomType]   = useState("");
  const [customType,    setCustomType]    = useState("");
  const [severity,      setSeverity]      = useState(2);
  const [notes,         setNotes]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const type = symptomType === "custom" ? customType.trim() : symptomType;
    if (!type) { setError("Please select or enter a symptom."); return; }
    setLoading(true); setError("");
    try {
      await addSymptom({ symptom_type: type, severity, notes: notes || undefined });
      setSymptomType(""); setCustomType(""); setSeverity(2); setNotes("");
      setShowForm(false); setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save symptom.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: C.text }}>Symptoms</div>
          <div style={{ fontSize: 13, color: C.textSoft, marginTop: 2 }}>
            {symptoms.length} symptom{symptoms.length !== 1 ? "s" : ""} logged
          </div>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 14, border: "none",
            background: showForm
              ? C.surfaceAlt
              : `linear-gradient(135deg, ${C.sage}, ${C.forest})`,
            color: showForm ? C.textMid : "#fff",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: showForm ? "none" : "0 4px 14px rgba(61,85,64,0.2)",
          }}
        >
          {showForm ? "✕ Cancel" : "+ Log Symptom"}
        </button>
      </div>

      {success && (
        <div style={{ padding: "12px 16px", background: C.sageLight, borderRadius: 12, color: C.forest, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
          ✓ Symptom logged
        </div>
      )}

      {showForm && (
        <Card style={{ marginBottom: 24, border: `1.5px solid ${C.mist}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 20 }}>Log Symptom</div>
          <form onSubmit={handleAdd}>
            {error && <ErrorBanner message={error} />}

            {/* Symptom chips */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Symptom type *</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SYMPTOM_OPTIONS.map(opt => (
                  <button
                    key={opt} type="button"
                    onClick={() => setSymptomType(opt)}
                    style={{
                      padding: "7px 14px", borderRadius: 99, border: "none", cursor: "pointer",
                      fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                      background: symptomType === opt ? C.sage : C.surfaceAlt,
                      color: symptomType === opt ? "#fff" : C.textMid,
                    }}
                  >
                    {opt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSymptomType("custom")}
                  style={{
                    padding: "7px 14px", borderRadius: 99, border: `1.5px dashed ${C.mist}`,
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                    background: symptomType === "custom" ? C.sageLight : "transparent",
                    color: C.textSoft,
                  }}
                >
                  + Other
                </button>
              </div>
              {symptomType === "custom" && (
                <input
                  type="text"
                  value={customType}
                  onChange={e => setCustomType(e.target.value)}
                  placeholder="Describe your symptom..."
                  style={{
                    marginTop: 10, width: "100%", padding: "11px 14px",
                    fontSize: 14, border: `1.5px solid ${C.border}`, borderRadius: 12,
                    background: C.surfaceAlt, color: C.text, outline: "none", boxSizing: "border-box",
                  }}
                />
              )}
            </div>

            {/* Severity */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>
                Severity — {["", "Mild", "Mild", "Moderate", "Moderate", "Severe"][severity]}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n} type="button"
                    onClick={() => setSeverity(n)}
                    style={{
                      width: 44, height: 44, borderRadius: 12, border: "none",
                      cursor: "pointer", fontSize: 14, fontWeight: 700, transition: "all 0.15s",
                      background: n <= severity ? C.sage : C.surfaceAlt,
                      color: n <= severity ? "#fff" : C.textMid,
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Notes (optional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional context..."
              disabled={loading}
            />
            <PrimaryButton type="submit" loading={loading}>
              Save Symptom
            </PrimaryButton>
          </form>
        </Card>
      )}

      {symptoms.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✦</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>No symptoms logged</div>
          <div style={{ fontSize: 14, color: C.textSoft }}>Start tracking your symptoms to find patterns.</div>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {symptoms.map((s, i) => (
            <div
              key={s.id ?? i}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 24px",
                borderBottom: i < symptoms.length - 1 ? `1px solid ${C.border}` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: s.severity >= 4 ? C.red : s.severity >= 3 ? C.gold : C.sage,
                  flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{s.symptom_type}</div>
                  <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>
                    {formatDateTime(s.created_at || s.logged_at || "")}
                    {s.notes && ` · ${s.notes}`}
                  </div>
                </div>
              </div>
              <SeverityDots value={s.severity} />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ─── CYCLE VIEW ───────────────────────────────────────────────────────────────

function CycleView() {
  const { currentCycle, startCycle } = useApp();
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await startCycle(startDate);
    } catch (err: any) {
      setError(err.message || "Failed to start cycle.");
    } finally {
      setLoading(false);
    }
  };

  const cycleDay = currentCycle
    ? Math.floor((Date.now() - new Date(currentCycle.cycle_start_date).getTime()) / 86400000) + 1
    : 0;

  const phase = currentCycle?.phase as PhaseKey | undefined;
  const rhythm = RHYTHMS[phase && RHYTHMS[phase] ? phase : "follicular"];

  return (
    <div>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: C.text, marginBottom: 24 }}>
        Cycle Tracking
      </div>

      {currentCycle ? (
        <>
          {/* Cycle status */}
          <Card style={{ background: rhythm.bg, border: `1px solid ${rhythm.color}20`, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: `${rhythm.color}20`, border: `2px solid ${rhythm.color}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28,
              }}>
                {rhythm.emoji}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: rhythm.color, letterSpacing: "1px", textTransform: "uppercase" }}>
                  Day {cycleDay}
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: C.text, marginTop: 2 }}>
                  {rhythm.name}
                </div>
                <div style={{ fontSize: 13, color: C.textSoft, marginTop: 2 }}>
                  Started {new Date(currentCycle.cycle_start_date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 13, fontStyle: "italic", color: C.textMid, marginBottom: 10 }}>
              "{rhythm.verse}" — {rhythm.scripture}
            </div>
            <div style={{ fontSize: 13, color: C.textMid }}>{rhythm.practice}</div>
          </Card>

          {/* Phase grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {(Object.entries(RHYTHMS) as [PhaseKey, typeof RHYTHMS[PhaseKey]][]).map(([key, r]) => (
              <Card
                key={key}
                style={{
                  opacity: phase === key ? 1 : 0.55,
                  border: phase === key ? `2px solid ${r.color}40` : `1px solid ${C.border}`,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 8 }}>{r.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{r.name}</div>
                <div style={{ fontSize: 12, color: C.textSoft, marginTop: 4 }}>
                  {key.charAt(0).toUpperCase() + key.slice(1)} phase
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <div style={{ fontSize: 36, textAlign: "center", marginBottom: 16 }}>◌</div>
          <div style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 22, color: C.text, textAlign: "center", marginBottom: 8,
          }}>
            Start tracking your cycle
          </div>
          <div style={{ fontSize: 14, color: C.textSoft, textAlign: "center", marginBottom: 24 }}>
            Enter the first day of your last period to begin.
          </div>
          <form onSubmit={handleStart}>
            {error && <ErrorBanner message={error} />}
            <Input
              label="Cycle start date"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              disabled={loading}
            />
            <PrimaryButton type="submit" loading={loading}>
              Begin Cycle Tracking
            </PrimaryButton>
          </form>
        </Card>
      )}
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

function Dashboard() {
  const { user, logout } = useApp();
  const [view, setView] = useState<NavView>("dashboard");

  if (!user) return null;

  const pageContent = {
    dashboard: <DashboardView setView={setView} />,
    glucose:   <GlucoseView />,
    symptoms:  <SymptomsView />,
    cycle:     <CycleView />,
  }[view];

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        input:focus, textarea:focus { border-color: ${C.sage} !important; background: #fff !important; outline: none; }
        button:hover { opacity: 0.88; }
      `}</style>

      <AppNav
        view={view}
        setView={setView}
        onLogout={logout}
        userName={user.first_name}
      />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ animation: "fadeUp 0.3s ease both" }}>
          {pageContent}
        </div>
      </main>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

function App() {
  const { isAuthenticated } = useApp();
  const [showRegister, setShowRegister] = useState(false);

  if (isAuthenticated) return <Dashboard />;

  return showRegister
    ? <RegisterScreen onSwitchToLogin={() => setShowRegister(false)} />
    : <LoginScreen  onSwitchToRegister={() => setShowRegister(true)} />;
}

export default function Root() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}