// GraceFlowWebApp.tsx - Complete Single-File Web Application
// Faith-forward wellness platform with glucose tracking, cycle awareness, coaching, and group support
// Full feature parity with mobile app

import React, { useEffect, useState, createContext, useContext, useRef } from "react";

// ==================== TYPES ====================
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
  glucose_level?: number;
  measured_at: string;
  timestamp?: string;
  unit?: string;
  source?: string;
  source_device?: string;
  notes?: string;
  created_at?: string;
}

interface GlucoseStats {
  average?: number;
  avgGlucose?: number;
  in_range_percentage?: number;
  timeInRange?: number;
  count?: number;
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

interface Coach {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Message {
  id?: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
  read_at?: string;
}

interface Conversation {
  userId: number;
  userName: string;
  userEmail?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface Group {
  id: string;
  name: string;
  description: string;
  start_date: string;
  duration_weeks: number;
  meeting_schedule: {
    day: string;
    time: string;
    timezone: string;
  };
  access_code?: string;
  max_members?: number;
  pricing?: {
    founding: number;
    paymentPlan: number;
  };
  status?: "draft" | "active" | "completed" | "archived";
  coach_id?: string;
}

interface GroupMessage {
  id?: number;
  group_id: string;
  sender_id: number;
  message: string;
  message_type?: string;
  created_at: string;
  sender?: {
    id: number;
    first_name: string;
    last_name: string;
    role: string;
  };
}

interface GroupMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  joined_at?: string;
}

interface Client {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  latest_glucose?: number;
  last_reading_at?: string;
}

// ==================== API SERVICE ====================
const API_HOST = ((import.meta as any).env.VITE_API_URL as string) || "http://localhost:3000";
const API_URL = `${API_HOST.replace(/\/$/, "")}/api/v1`;

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem("accessToken");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private saveTokens(data: any) {
    const access = data.access_token ?? data.accessToken;
    const refresh = data.refresh_token ?? data.refreshToken;
    if (access) localStorage.setItem("accessToken", access);
    if (refresh) localStorage.setItem("refreshToken", refresh);
  }

  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    this.saveTokens(data);
    return data.user ?? data.data?.user ?? data;
  }

  async register(userData: any) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Registration failed");
    this.saveTokens(data);
    return data.user ?? data.data?.user ?? data;
  }

  // Glucose
  async getGlucoseReadings(): Promise<GlucoseReading[]> {
    try {
      const res = await fetch(`${API_URL}/glucose`, { headers: this.getHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.readings || [];
    } catch (error) {
      return [];
    }
  }

  async createGlucoseReading(reading: { value: number; measured_at: string; notes?: string }): Promise<GlucoseReading> {
    const res = await fetch(`${API_URL}/glucose`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        value: reading.value,
        measuredAt: reading.measured_at,
        unit: "mg/dL",
        source: "manual",
        notes: reading.notes,
      }),
    });
    if (!res.ok) throw new Error(`Failed to create reading`);
    return res.json();
  }

  // Symptoms
  async getSymptoms(): Promise<Symptom[]> {
    try {
      const res = await fetch(`${API_URL}/symptoms`, { headers: this.getHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.symptoms || [];
    } catch (error) {
      return [];
    }
  }

  async createSymptom(symptom: Omit<Symptom, "id" | "created_at" | "logged_at">): Promise<Symptom> {
    const res = await fetch(`${API_URL}/symptoms`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        symptomType: symptom.symptom_type,
        severity: symptom.severity,
        notes: symptom.notes,
      }),
    });
    if (!res.ok) throw new Error(`Failed to create symptom`);
    const data = await res.json();
    return data?.symptom ?? data?.data ?? data;
  }

  // Cycle
  async getCurrentCycle(): Promise<Cycle | null> {
    try {
      const res = await fetch(`${API_URL}/cycles/current`, { headers: this.getHeaders() });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      const data = await res.json();
      return data?.cycle ?? data;
    } catch (error) {
      return null;
    }
  }

  async startCycle(startDate: string): Promise<Cycle> {
    const res = await fetch(`${API_URL}/cycles`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ cycleStartDate: startDate }),
    });
    if (!res.ok) throw new Error("Failed to start cycle");
    const data = await res.json();
    return data?.cycle ?? data?.data ?? data;
  }

  // Messaging
  async getConversations(): Promise<Conversation[]> {
    try {
      const res = await fetch(`${API_URL}/messages/conversations`, { headers: this.getHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.conversations || [];
    } catch (error) {
      return [];
    }
  }

  async getMessages(otherUserId: number): Promise<Message[]> {
    try {
      const res = await fetch(`${API_URL}/messages/${otherUserId}`, { headers: this.getHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.messages || [];
    } catch (error) {
      return [];
    }
  }

  async sendMessage(receiverId: number, message: string): Promise<Message> {
    const res = await fetch(`${API_URL}/messages`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ receiverId, message }),
    });
    if (!res.ok) throw new Error("Failed to send message");
    return res.json();
  }

  async markAsRead(messageId: number): Promise<void> {
    await fetch(`${API_URL}/messages/${messageId}/read`, {
      method: "PUT",
      headers: this.getHeaders(),
    });
  }

  // Coach
  async getMyCoach(): Promise<Coach | null> {
    try {
      const res = await fetch(`${API_URL}/coach/my-coach`, { headers: this.getHeaders() });
      if (!res.ok) return null;
      const data = await res.json();
      return data.coach || null;
    } catch (error) {
      return null;
    }
  }

  async getClients(): Promise<Client[]> {
    try {
      const res = await fetch(`${API_URL}/coach/clients`, { headers: this.getHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.clients || [];
    } catch (error) {
      return [];
    }
  }

  async getClientGlucose(clientId: number): Promise<GlucoseReading[]> {
    try {
      const res = await fetch(`${API_URL}/coach/clients/${clientId}/glucose`, { headers: this.getHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.readings || [];
    } catch (error) {
      return [];
    }
  }

  // Groups
  async getAvailableGroups(): Promise<Group[]> {
    try {
      const res = await fetch(`${API_URL}/groups`, { headers: this.getHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.groups || [];
    } catch (error) {
      return [];
    }
  }

  async joinGroup(groupId: string): Promise<void> {
    const res = await fetch(`${API_URL}/groups/${groupId}/join`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to join group");
  }

  async getMyGroups(): Promise<Group[]> {
    try {
      const res = await fetch(`${API_URL}/groups/my-groups`, { headers: this.getHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.groups || [];
    } catch (error) {
      return [];
    }
  }

  async getGroupMessages(groupId: string): Promise<GroupMessage[]> {
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/messages`, { headers: this.getHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.messages || [];
    } catch (error) {
      return [];
    }
  }

  async sendGroupMessage(groupId: string, message: string): Promise<GroupMessage> {
    const res = await fetch(`${API_URL}/groups/${groupId}/messages`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error("Failed to send group message");
    const data = await res.json();
    return data.message;
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/members`, { headers: this.getHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.members?.map((m: any) => m.user) || [];
    } catch (error) {
      return [];
    }
  }

  // Coach: Create group
  async createGroup(groupData: {
    name: string;
    description: string;
    startDate: string;
    durationWeeks: number;
    maxMembers: number;
    pricing: { founding: number; paymentPlan: number };
    meetingSchedule: { day: string; time: string; timezone: string };
    status?: "draft" | "active";
  }): Promise<{ group: Group; accessCode: string }> {
    const res = await fetch(`${API_URL}/groups`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(groupData),
    });
    if (!res.ok) throw new Error("Failed to create group");
    return res.json();
  }

  // Coach: Update group status
  async updateGroupStatus(groupId: string, status: "draft" | "active" | "archived"): Promise<Group> {
    const res = await fetch(`${API_URL}/groups/${groupId}/status`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update group status");
    return res.json();
  }

  // Coach: Delete group
  async deleteGroup(groupId: string): Promise<void> {
    const res = await fetch(`${API_URL}/groups/${groupId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete group");
  }

  // Coach: Get coach's groups
  async getCoachGroups(): Promise<Group[]> {
    try {
      const res = await fetch(`${API_URL}/groups/coach/my-groups`, { headers: this.getHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.groups || [];
    } catch (error) {
      return [];
    }
  }
}

const api = new ApiService();

// ==================== APP CONTEXT ====================
interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  glucoseReadings: GlucoseReading[];
  glucoseStats: GlucoseStats | null;
  symptoms: Symptom[];
  currentCycle: Cycle | null;
  myCoach: Coach | null;
  conversations: Conversation[];
  myGroups: Group[];
  addGlucoseReading: (reading: { value: number; measured_at: string; notes?: string }) => Promise<void>;
  addSymptom: (symptom: Omit<Symptom, "id" | "created_at" | "logged_at">) => Promise<void>;
  startCycle: (startDate: string) => Promise<void>;
  refreshData: () => Promise<void>;
  sendMessage: (receiverId: number, message: string) => Promise<void>;
  getMessages: (otherUserId: number) => Promise<Message[]>;
  joinGroup: (groupId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}

function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [glucoseStats, setGlucoseStats] = useState<GlucoseStats | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [currentCycle, setCurrentCycle] = useState<Cycle | null>(null);
  const [myCoach, setMyCoach] = useState<Coach | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);

  const isAuthenticated = !!user;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated]);

  const refreshData = async () => {
    const [readings, symp, cycle, coach, convs, groups] = await Promise.all([
      api.getGlucoseReadings(),
      api.getSymptoms(),
      api.getCurrentCycle(),
      api.getMyCoach(),
      api.getConversations(),
      api.getMyGroups(),
    ]);

    setGlucoseReadings(readings);
    setSymptoms(symp);
    setCurrentCycle(cycle);
    setMyCoach(coach);
    setConversations(convs);
    setMyGroups(groups);

    // Calculate stats
    if (readings.length > 0) {
      const values = readings.map(r => r.value || r.glucose_level || 0);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const inRange = values.filter(v => v >= 70 && v <= 180).length;
      setGlucoseStats({
        average: avg,
        avgGlucose: avg,
        in_range_percentage: (inRange / values.length) * 100,
        timeInRange: (inRange / values.length) * 100,
        count: readings.length,
      });
    }
  };

  const login = async (email: string, password: string) => {
    const userData = await api.login(email, password);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const register = async (userData: any) => {
    const user = await api.register(userData);
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  const addGlucoseReading = async (reading: { value: number; measured_at: string; notes?: string }) => {
    await api.createGlucoseReading(reading);
    await refreshData();
  };

  const addSymptom = async (symptom: Omit<Symptom, "id" | "created_at" | "logged_at">) => {
    await api.createSymptom(symptom);
    await refreshData();
  };

  const startCycle = async (startDate: string) => {
    await api.startCycle(startDate);
    await refreshData();
  };

  const sendMessage = async (receiverId: number, message: string) => {
    await api.sendMessage(receiverId, message);
    await refreshData();
  };

  const getMessages = async (otherUserId: number) => {
    return await api.getMessages(otherUserId);
  };

  const joinGroup = async (groupId: string) => {
    await api.joinGroup(groupId);
    await refreshData();
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        register,
        logout,
        glucoseReadings,
        glucoseStats,
        symptoms,
        currentCycle,
        myCoach,
        conversations,
        myGroups,
        addGlucoseReading,
        addSymptom,
        startCycle,
        refreshData,
        sendMessage,
        getMessages,
        joinGroup,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ==================== STYLES ====================
const colors = {
  sage: "#6B7F6E",
  cream: "#FAF8F4",
  darkText: "#2A2D2A",
  lightText: "#6B6B6B",
  errorRed: "#C85A54",
  white: "#FFFFFF",
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: colors.cream,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    padding: "16px 24px",
    background: colors.white,
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    gap: "12px",
  },
  navButton: {
    padding: "12px 20px",
    border: "none",
    background: "transparent",
    color: colors.lightText,
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    borderRadius: "8px",
    transition: "all 0.2s",
  },
  navButtonActive: {
    background: colors.sage,
    color: colors.white,
  },
  dashboard: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px 24px",
  },
  header: {
    marginBottom: "32px",
  },
  greeting: {
    fontSize: "32px",
    fontWeight: "700",
    color: colors.darkText,
    marginBottom: "8px",
  },
  card: {
    background: colors.white,
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    marginBottom: "24px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: colors.darkText,
    marginBottom: "16px",
  },
  stat: {
    textAlign: "center" as const,
    padding: "16px",
  },
  statValue: {
    fontSize: "48px",
    fontWeight: "700",
    color: colors.sage,
  },
  statLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: colors.lightText,
    marginTop: "4px",
  },
  button: {
    width: "100%",
    padding: "16px",
    background: colors.sage,
    color: colors.white,
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: colors.darkText,
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "14px",
    border: "2px solid rgba(0,0,0,0.08)",
    borderRadius: "12px",
    fontSize: "15px",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  listItem: {
    padding: "16px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    marginBottom: "24px",
  },
};

// ==================== AUTH SCREENS ====================
function LoginScreen({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...styles.container, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "420px", padding: "24px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "36px", fontWeight: "700", color: colors.sage, marginBottom: "8px" }}>
            GraceFlow
          </h1>
          <p style={{ color: colors.lightText, fontSize: "15px" }}>
            Faith-forward wellness tracking
          </p>
        </div>

        <div style={styles.card}>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: colors.darkText, marginBottom: "24px" }}>
            Welcome back
          </h2>

          {error && (
            <div style={{ padding: "12px", background: "#FEE", borderRadius: "8px", marginBottom: "16px", color: colors.errorRed }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" style={{ ...styles.button, opacity: loading ? 0.6 : 1 }} disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <button
              style={{ background: "none", border: "none", color: colors.sage, cursor: "pointer", fontSize: "15px" }}
              onClick={onSwitchToRegister}
            >
              Don't have an account? <strong>Register</strong>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterScreen({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { register } = useApp();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "user" as "user" | "coach",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(formData);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...styles.container, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "420px", padding: "24px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "36px", fontWeight: "700", color: colors.sage, marginBottom: "8px" }}>
            GraceFlow
          </h1>
          <p style={{ color: colors.lightText, fontSize: "15px" }}>
            Join our wellness community
          </p>
        </div>

        <div style={styles.card}>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: colors.darkText, marginBottom: "24px" }}>
            Create Account
          </h2>

          {error && (
            <div style={{ padding: "12px", background: "#FEE", borderRadius: "8px", marginBottom: "16px", color: colors.errorRed }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>First Name</label>
              <input
                type="text"
                style={styles.input}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Last Name</label>
              <input
                type="text"
                style={styles.input}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                style={styles.input}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                style={styles.input}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>I am a...</label>
              <select
                style={styles.input}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as "user" | "coach" })}
                disabled={loading}
              >
                <option value="user">User</option>
                <option value="coach">Coach</option>
              </select>
            </div>

            <button type="submit" style={{ ...styles.button, opacity: loading ? 0.6 : 1 }} disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <button
              style={{ background: "none", border: "none", color: colors.sage, cursor: "pointer", fontSize: "15px" }}
              onClick={onSwitchToLogin}
            >
              Already have an account? <strong>Sign In</strong>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== USER DASHBOARD ====================
function Dashboard() {
  const { user } = useApp();

  if (user?.role === "coach") {
    return <CoachDashboard />;
  }

  return <UserDashboard />;
}

function UserDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "glucose" | "symptoms" | "cycle" | "messages" | "groups" | "settings">("overview");

  return (
    <div style={styles.container}>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <div style={styles.dashboard}>
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "glucose" && <GlucoseTab />}
        {activeTab === "symptoms" && <SymptomsTab />}
        {activeTab === "cycle" && <CycleTab />}
        {activeTab === "messages" && <MessagesTab />}
        {activeTab === "groups" && <GroupsTab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}

function Navigation({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: any) => void }) {
  const { user, logout } = useApp();

  const tabs = [
    { id: "overview", label: "Dashboard" },
    { id: "glucose", label: "Glucose" },
    { id: "symptoms", label: "Symptoms" },
    { id: "cycle", label: "Cycle" },
    { id: "messages", label: "Messages" },
    { id: "groups", label: "Groups" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <nav style={styles.nav}>
      <div style={{ fontSize: "20px", fontWeight: "700", color: colors.sage, marginRight: "24px" }}>
        GraceFlow
      </div>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          style={{
            ...styles.navButton,
            ...(activeTab === tab.id ? styles.navButtonActive : {}),
          }}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
      <div style={{ marginLeft: "auto" }}>
        <span style={{ marginRight: "16px", color: colors.lightText }}>
          {user?.first_name} {user?.last_name}
        </span>
        <button
          style={{ ...styles.navButton, color: colors.errorRed }}
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

// ==================== OVERVIEW TAB ====================
function OverviewTab() {
  const { user, glucoseReadings, glucoseStats, symptoms, currentCycle, myCoach } = useApp();

  const cycleDay = currentCycle
    ? Math.floor((Date.now() - new Date(currentCycle.cycle_start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  const recentSymptoms = symptoms.slice(0, 3);
  const avgGlucose = glucoseStats?.average || glucoseStats?.avgGlucose || 0;

  return (
    <>
      <div style={styles.header}>
        <h1 style={styles.greeting}>Welcome back, {user?.first_name}!</h1>
        <p style={{ color: colors.lightText, fontSize: "15px" }}>
          Here's your wellness overview
        </p>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Glucose Status</h3>
          <div style={styles.stat}>
            <div style={styles.statValue}>{avgGlucose > 0 ? Math.round(avgGlucose) : "--"}</div>
            <div style={styles.statLabel}>Average mg/dL</div>
          </div>
          {glucoseStats && (
            <div style={{ textAlign: "center", marginTop: "12px", color: colors.lightText, fontSize: "14px" }}>
              {Math.round(glucoseStats.timeInRange || glucoseStats.in_range_percentage || 0)}% time in range
            </div>
          )}
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Cycle Tracking</h3>
          {currentCycle ? (
            <div style={styles.stat}>
              <div style={styles.statValue}>{cycleDay}</div>
              <div style={styles.statLabel}>Day of Cycle</div>
              <div style={{ marginTop: "8px", fontSize: "14px", color: colors.lightText }}>
                {currentCycle.phase || "Tracking"}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "24px", color: colors.lightText }}>
              No active cycle
            </div>
          )}
        </div>

        {myCoach && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Your Coach</h3>
            <div style={{ padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "600", color: colors.darkText }}>
                {myCoach.first_name} {myCoach.last_name}
              </div>
              <div style={{ fontSize: "14px", color: colors.lightText, marginTop: "4px" }}>
                {myCoach.email}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Recent Glucose</h3>
          {glucoseReadings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: colors.lightText }}>
              No readings logged yet
            </div>
          ) : (
            <ul style={styles.list}>
              {glucoseReadings.slice(0, 3).map((reading, idx) => (
                <li key={reading.id || idx} style={styles.listItem}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", fontWeight: "600", color: colors.darkText }}>
                      {reading.value || reading.glucose_level} mg/dL
                    </div>
                    <div style={{ fontSize: "13px", color: colors.lightText, marginTop: "2px" }}>
                      {new Date(reading.measured_at || reading.timestamp || "").toLocaleDateString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Recent Symptoms</h3>
          {recentSymptoms.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: colors.lightText }}>
              No symptoms logged recently
            </div>
          ) : (
            <ul style={styles.list}>
              {recentSymptoms.map((symptom, idx) => (
                <li key={symptom.id || idx} style={styles.listItem}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", fontWeight: "600", color: colors.darkText }}>
                      {symptom.symptom_type}
                    </div>
                    <div style={{ fontSize: "13px", color: colors.lightText, marginTop: "2px" }}>
                      {new Date(symptom.created_at || symptom.logged_at || "").toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    background: "rgba(107,127,110,0.1)",
                    color: colors.sage,
                    fontWeight: "600",
                  }}>
                    {symptom.severity}/10
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

// ==================== GLUCOSE TAB ====================
function GlucoseTab() {
  const { glucoseReadings, glucoseStats, addGlucoseReading } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [value, setValue] = useState("");
  const [measuredAt, setMeasuredAt] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addGlucoseReading({
        value: parseFloat(value),
        measured_at: measuredAt,
        notes: notes || undefined,
      });
      setValue("");
      setMeasuredAt(new Date().toISOString().slice(0, 16));
      setNotes("");
      setShowForm(false);
    } catch (error) {
      alert("Failed to add reading");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "700", color: colors.darkText }}>Glucose Tracking</h2>
        <button
          style={{ ...styles.button, width: "auto", padding: "0 24px", height: "48px" }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Log Reading"}
        </button>
      </div>

      {showForm && (
        <div style={{ ...styles.card, marginBottom: "24px" }}>
          <h3 style={styles.cardTitle}>New Reading</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Glucose Value (mg/dL) *</label>
              <input
                type="number"
                style={styles.input}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                disabled={loading}
                step="0.1"
                min="0"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Measured At *</label>
              <input
                type="datetime-local"
                style={styles.input}
                value={measuredAt}
                onChange={(e) => setMeasuredAt(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Notes (optional)</label>
              <textarea
                style={{ ...styles.input, minHeight: "80px" }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Before meal, after exercise..."
                disabled={loading}
              />
            </div>
            <button type="submit" style={{ ...styles.button, opacity: loading ? 0.6 : 1 }} disabled={loading}>
              {loading ? "Saving..." : "Save Reading"}
            </button>
          </form>
        </div>
      )}

      {glucoseStats && (
        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.stat}>
              <div style={styles.statValue}>{Math.round(glucoseStats.average || glucoseStats.avgGlucose || 0)}</div>
              <div style={styles.statLabel}>Average mg/dL</div>
            </div>
          </div>
          <div style={styles.card}>
            <div style={styles.stat}>
              <div style={styles.statValue}>
                {Math.round(glucoseStats.timeInRange || glucoseStats.in_range_percentage || 0)}%
              </div>
              <div style={styles.statLabel}>Time in Range</div>
            </div>
          </div>
          <div style={styles.card}>
            <div style={styles.stat}>
              <div style={styles.statValue}>{glucoseStats.count || 0}</div>
              <div style={styles.statLabel}>Total Readings</div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Recent Readings</h3>
        {glucoseReadings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: colors.lightText }}>
            No readings yet. Start tracking to see trends!
          </div>
        ) : (
          <ul style={styles.list}>
            {glucoseReadings.slice(0, 20).map((reading, idx) => (
              <li key={reading.id || idx} style={styles.listItem}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: colors.darkText }}>
                    {reading.value || reading.glucose_level} mg/dL
                  </div>
                  <div style={{ fontSize: "13px", color: colors.lightText, marginTop: "4px" }}>
                    {new Date(reading.measured_at || reading.timestamp || "").toLocaleString()}
                  </div>
                  {reading.notes && (
                    <div style={{ fontSize: "14px", color: colors.darkText, marginTop: "8px" }}>
                      {reading.notes}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

// ==================== SYMPTOMS TAB ====================
function SymptomsTab() {
  const { symptoms, addSymptom } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [symptomType, setSymptomType] = useState("");
  const [severity, setSeverity] = useState("5");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addSymptom({
        symptom_type: symptomType,
        severity: parseInt(severity),
        notes: notes || undefined,
      });
      setSymptomType("");
      setSeverity("5");
      setNotes("");
      setShowForm(false);
    } catch (error) {
      alert("Failed to add symptom");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "700", color: colors.darkText }}>Symptom Tracking</h2>
        <button
          style={{ ...styles.button, width: "auto", padding: "0 24px", height: "48px" }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Log Symptom"}
        </button>
      </div>

      {showForm && (
        <div style={{ ...styles.card, marginBottom: "24px" }}>
          <h3 style={styles.cardTitle}>New Symptom</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Symptom Type *</label>
              <input
                type="text"
                style={styles.input}
                value={symptomType}
                onChange={(e) => setSymptomType(e.target.value)}
                placeholder="e.g., Headache, Fatigue, Cramps"
                required
                disabled={loading}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Severity (1-10) *</label>
              <input
                type="range"
                min="1"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                style={{ width: "100%" }}
                disabled={loading}
              />
              <div style={{ textAlign: "center", marginTop: "8px", fontSize: "24px", fontWeight: "700", color: colors.sage }}>
                {severity}
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Notes (optional)</label>
              <textarea
                style={{ ...styles.input, minHeight: "80px" }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details..."
                disabled={loading}
              />
            </div>
            <button type="submit" style={{ ...styles.button, opacity: loading ? 0.6 : 1 }} disabled={loading}>
              {loading ? "Saving..." : "Save Symptom"}
            </button>
          </form>
        </div>
      )}

      <div style={styles.card}>
        {symptoms.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: colors.lightText }}>
            No symptoms logged yet. Start tracking to see patterns!
          </div>
        ) : (
          <ul style={styles.list}>
            {symptoms.slice(0, 20).map((symptom, idx) => (
              <li key={symptom.id || idx} style={styles.listItem}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: colors.darkText }}>
                    {symptom.symptom_type}
                  </div>
                  <div style={{ fontSize: "13px", color: colors.lightText, marginTop: "4px" }}>
                    {new Date(symptom.created_at || symptom.logged_at || "").toLocaleString()}
                  </div>
                  {symptom.notes && (
                    <div style={{ fontSize: "14px", color: colors.darkText, marginTop: "8px" }}>
                      {symptom.notes}
                    </div>
                  )}
                </div>
                <div style={{
                  padding: "8px 16px",
                  borderRadius: "12px",
                  background: "rgba(107,127,110,0.12)",
                  color: colors.sage,
                  fontWeight: "700",
                  fontSize: "16px",
                }}>
                  {symptom.severity}/10
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

// ==================== CYCLE TAB ====================
function CycleTab() {
  const { currentCycle, startCycle } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await startCycle(startDate);
      setShowForm(false);
    } catch (error) {
      alert("Failed to start cycle");
    } finally {
      setLoading(false);
    }
  };

  const cycleDay = currentCycle
    ? Math.floor((Date.now() - new Date(currentCycle.cycle_start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "700", color: colors.darkText }}>Cycle Tracking</h2>
        {!currentCycle && (
          <button
            style={{ ...styles.button, width: "auto", padding: "0 24px", height: "48px" }}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Start Cycle"}
          </button>
        )}
      </div>

      {showForm && !currentCycle && (
        <div style={{ ...styles.card, marginBottom: "24px" }}>
          <h3 style={styles.cardTitle}>Start New Cycle</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Cycle Start Date *</label>
              <input
                type="date"
                style={styles.input}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={loading}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <button type="submit" style={{ ...styles.button, opacity: loading ? 0.6 : 1 }} disabled={loading}>
              {loading ? "Starting..." : "Start Cycle"}
            </button>
          </form>
        </div>
      )}

      <div style={styles.card}>
        {!currentCycle ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌸</div>
            <h3 style={{ fontSize: "24px", fontWeight: "600", color: colors.darkText, marginBottom: "12px" }}>
              Track your natural rhythm
            </h3>
            <p style={{ color: colors.lightText, fontSize: "15px", lineHeight: "22px", maxWidth: "400px", margin: "0 auto" }}>
              Start logging your cycle to see how hormones affect your wellness.
            </p>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "32px" }}>
            <div style={styles.stat}>
              <div style={styles.statValue}>{cycleDay}</div>
              <div style={styles.statLabel}>Day of Cycle</div>
            </div>
            <div style={{ marginTop: "24px", padding: "16px", background: "rgba(107,127,110,0.08)", borderRadius: "16px" }}>
              <div style={{ fontSize: "14px", fontWeight: "600", color: colors.sage, marginBottom: "4px" }}>
                {currentCycle.phase || "Tracking"}
              </div>
              <div style={{ fontSize: "13px", color: colors.lightText }}>
                Started {new Date(currentCycle.cycle_start_date).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ==================== MESSAGES TAB ====================
function MessagesTab() {
  const { conversations, myCoach, getMessages, sendMessage, user } = useApp();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.userId);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async (userId: number) => {
    setLoading(true);
    const msgs = await getMessages(userId);
    setMessages(msgs);
    setLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await sendMessage(selectedConversation.userId, newMessage);
      setNewMessage("");
      await loadMessages(selectedConversation.userId);
    } catch (error) {
      alert("Failed to send message");
    }
  };

  // If user has a coach, show coach as a conversation option
  const allConversations = myCoach && !conversations.find(c => c.userId === myCoach.id)
    ? [
        {
          userId: myCoach.id,
          userName: `${myCoach.first_name} ${myCoach.last_name}`,
          userEmail: myCoach.email,
          lastMessage: "Start a conversation",
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
        },
        ...conversations,
      ]
    : conversations;

  return (
    <>
      <h2 style={{ fontSize: "28px", fontWeight: "700", color: colors.darkText, marginBottom: "24px" }}>
        Messages
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px", height: "calc(100vh - 200px)" }}>
        {/* Conversations List */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Conversations</h3>
          {allConversations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: colors.lightText }}>
              No conversations yet
            </div>
          ) : (
            <ul style={styles.list}>
              {allConversations.map((conv) => (
                <li
                  key={conv.userId}
                  style={{
                    ...styles.listItem,
                    cursor: "pointer",
                    background: selectedConversation?.userId === conv.userId ? "rgba(107,127,110,0.08)" : "transparent",
                  }}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", fontWeight: "600", color: colors.darkText }}>
                      {conv.userName}
                    </div>
                    <div style={{ fontSize: "13px", color: colors.lightText, marginTop: "4px" }}>
                      {conv.lastMessage}
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: colors.sage,
                      color: colors.white,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}>
                      {conv.unreadCount}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Messages */}
        <div style={styles.card}>
          {!selectedConversation ? (
            <div style={{ textAlign: "center", padding: "48px", color: colors.lightText }}>
              Select a conversation to start messaging
            </div>
          ) : (
            <>
              <div style={{ borderBottom: "1px solid rgba(0,0,0,0.08)", paddingBottom: "16px", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: colors.darkText }}>
                  {selectedConversation.userName}
                </h3>
                {selectedConversation.userEmail && (
                  <div style={{ fontSize: "13px", color: colors.lightText, marginTop: "4px" }}>
                    {selectedConversation.userEmail}
                  </div>
                )}
              </div>

              <div style={{ height: "400px", overflowY: "auto", marginBottom: "16px" }}>
                {loading ? (
                  <div style={{ textAlign: "center", padding: "24px", color: colors.lightText }}>
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px", color: colors.lightText }}>
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: "flex",
                          justifyContent: isMe ? "flex-end" : "flex-start",
                          marginBottom: "12px",
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "70%",
                            padding: "12px 16px",
                            borderRadius: "16px",
                            background: isMe ? colors.sage : "rgba(0,0,0,0.06)",
                            color: isMe ? colors.white : colors.darkText,
                          }}
                        >
                          <div>{msg.message}</div>
                          <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.7 }}>
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  style={{ ...styles.input, flex: 1 }}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  style={{ ...styles.button, width: "auto", padding: "0 24px" }}
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ==================== GROUPS TAB ====================
function GroupsTab() {
  const { myGroups, joinGroup, user } = useApp();
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAvailableGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupMessages(selectedGroup.id);
    }
  }, [selectedGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);

  const loadAvailableGroups = async () => {
    setLoading(true);
    const groups = await api.getAvailableGroups();
    setAvailableGroups(groups);
    setLoading(false);
  };

  const loadGroupMessages = async (groupId: string) => {
    const messages = await api.getGroupMessages(groupId);
    setGroupMessages(messages.reverse()); // Reverse to show oldest first
  };

  const handleJoin = async (groupId: string) => {
    try {
      await joinGroup(groupId);
      await loadAvailableGroups();
    } catch (error) {
      alert("Failed to join group");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup) return;

    try {
      await api.sendGroupMessage(selectedGroup.id, newMessage);
      setNewMessage("");
      await loadGroupMessages(selectedGroup.id);
    } catch (error) {
      alert("Failed to send message");
    }
  };

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    setView("chat");
  };

  if (view === "chat" && selectedGroup) {
    return (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <button
            style={{ ...styles.navButton, padding: "8px 16px" }}
            onClick={() => {
              setView("list");
              setSelectedGroup(null);
            }}
          >
            ← Back
          </button>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: colors.darkText }}>
            {selectedGroup.name}
          </h2>
        </div>

        <div style={styles.card}>
          <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            <p style={{ fontSize: "14px", color: colors.lightText }}>
              {selectedGroup.description}
            </p>
            <div style={{ fontSize: "13px", color: colors.lightText, marginTop: "8px" }}>
              📅 Starts: {new Date(selectedGroup.start_date).toLocaleDateString()} • 
              ⏱️ {selectedGroup.duration_weeks} weeks • 
              🗓️ {selectedGroup.meeting_schedule.day}s at {selectedGroup.meeting_schedule.time}
            </div>
          </div>

          <div style={{ height: "500px", overflowY: "auto", marginBottom: "16px", padding: "16px", background: "rgba(0,0,0,0.02)", borderRadius: "12px" }}>
            {groupMessages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px", color: colors.lightText }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>💬</div>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              groupMessages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    style={{
                      marginBottom: "16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMe ? "flex-end" : "flex-start",
                    }}
                  >
                    {!isMe && msg.sender && (
                      <div style={{ fontSize: "12px", fontWeight: "600", color: colors.lightText, marginBottom: "4px" }}>
                        {msg.sender.first_name} {msg.sender.last_name}
                        {msg.sender.role === "coach" && (
                          <span style={{ marginLeft: "6px", fontSize: "11px", color: colors.sage }}>• Coach</span>
                        )}
                      </div>
                    )}
                    <div
                      style={{
                        maxWidth: "70%",
                        padding: "12px 16px",
                        borderRadius: "16px",
                        background: isMe ? colors.sage : colors.white,
                        color: isMe ? colors.white : colors.darkText,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}
                    >
                      <div>{msg.message}</div>
                      <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.7 }}>
                        {new Date(msg.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              style={{ ...styles.input, flex: 1 }}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message to the group..."
            />
            <button
              type="submit"
              style={{ ...styles.button, width: "auto", padding: "0 24px" }}
              disabled={!newMessage.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </>
    );
  }

  // List view
  return (
    <>
      <h2 style={{ fontSize: "28px", fontWeight: "700", color: colors.darkText, marginBottom: "24px" }}>
        Group Coaching
      </h2>

      {myGroups.length > 0 && (
        <>
          <h3 style={{ fontSize: "20px", fontWeight: "600", color: colors.darkText, marginBottom: "16px" }}>
            My Groups
          </h3>
          <div style={styles.grid}>
            {myGroups.map((group) => (
              <div key={group.id} style={styles.card}>
                <h4 style={{ fontSize: "18px", fontWeight: "700", color: colors.darkText, marginBottom: "8px" }}>
                  {group.name}
                </h4>
                <p style={{ fontSize: "14px", color: colors.lightText, marginBottom: "12px", lineHeight: "1.5" }}>
                  {group.description}
                </p>
                <div style={{ fontSize: "13px", color: colors.lightText, marginBottom: "16px" }}>
                  <div>📅 Starts: {new Date(group.start_date).toLocaleDateString()}</div>
                  <div>⏱️ Duration: {group.duration_weeks} weeks</div>
                  <div>
                    🗓️ Meets: {group.meeting_schedule.day}s at {group.meeting_schedule.time}
                  </div>
                </div>
                <button
                  style={styles.button}
                  onClick={() => handleGroupSelect(group)}
                >
                  💬 Open Group Chat
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 style={{ fontSize: "20px", fontWeight: "600", color: colors.darkText, margin: "32px 0 16px" }}>
        Available Groups
      </h3>

      {loading ? (
        <div style={{ textAlign: "center", padding: "32px", color: colors.lightText }}>
          Loading groups...
        </div>
      ) : availableGroups.length === 0 ? (
        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: "32px", color: colors.lightText }}>
            No groups available at this time. Check back soon!
          </div>
        </div>
      ) : (
        <div style={styles.grid}>
          {availableGroups.map((group) => {
            const alreadyJoined = myGroups.some(g => g.id === group.id);
            return (
              <div key={group.id} style={styles.card}>
                <h4 style={{ fontSize: "18px", fontWeight: "700", color: colors.darkText, marginBottom: "8px" }}>
                  {group.name}
                </h4>
                <p style={{ fontSize: "14px", color: colors.lightText, marginBottom: "12px", lineHeight: "1.5" }}>
                  {group.description}
                </p>
                <div style={{ fontSize: "13px", color: colors.lightText, marginBottom: "16px" }}>
                  <div>📅 Starts: {new Date(group.start_date).toLocaleDateString()}</div>
                  <div>⏱️ Duration: {group.duration_weeks} weeks</div>
                  <div>
                    🗓️ Meets: {group.meeting_schedule.day}s at {group.meeting_schedule.time}
                  </div>
                </div>
                <button
                  style={{
                    ...styles.button,
                    opacity: alreadyJoined ? 0.5 : 1,
                  }}
                  onClick={() => handleJoin(group.id)}
                  disabled={alreadyJoined}
                >
                  {alreadyJoined ? "Already Joined" : "Join Group"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ==================== SETTINGS TAB ====================
function SettingsTab() {
  const { user, logout } = useApp();
  const [cycleTrackingEnabled, setCycleTrackingEnabled] = useState(true);

  useEffect(() => {
    const enabled = localStorage.getItem("cycleTrackingEnabled");
    setCycleTrackingEnabled(enabled !== "false");
  }, []);

  const handleCycleToggle = (enabled: boolean) => {
    setCycleTrackingEnabled(enabled);
    localStorage.setItem("cycleTrackingEnabled", enabled.toString());
  };

  return (
    <>
      <h2 style={{ fontSize: "28px", fontWeight: "700", color: colors.darkText, marginBottom: "24px" }}>
        Settings
      </h2>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Account Information</h3>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", color: colors.lightText, marginBottom: "4px" }}>
            Name
          </div>
          <div style={{ fontSize: "16px", color: colors.darkText }}>
            {user?.first_name} {user?.last_name}
          </div>
        </div>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", color: colors.lightText, marginBottom: "4px" }}>
            Email
          </div>
          <div style={{ fontSize: "16px", color: colors.darkText }}>
            {user?.email}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: colors.lightText, marginBottom: "4px" }}>
            Role
          </div>
          <div style={{ fontSize: "16px", color: colors.darkText }}>
            {user?.role === "coach" ? "Coach" : "User"}
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Preferences</h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: colors.darkText }}>
              Cycle Tracking
            </div>
            <div style={{ fontSize: "13px", color: colors.lightText, marginTop: "4px" }}>
              Enable cycle tracking features
            </div>
          </div>
          <label style={{ position: "relative", display: "inline-block", width: "60px", height: "34px" }}>
            <input
              type="checkbox"
              checked={cycleTrackingEnabled}
              onChange={(e) => handleCycleToggle(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: "absolute",
                cursor: "pointer",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: cycleTrackingEnabled ? colors.sage : "#ccc",
                transition: "0.4s",
                borderRadius: "34px",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  content: "",
                  height: "26px",
                  width: "26px",
                  left: cycleTrackingEnabled ? "30px" : "4px",
                  bottom: "4px",
                  background: "white",
                  transition: "0.4s",
                  borderRadius: "50%",
                }}
              />
            </span>
          </label>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Actions</h3>
        <button
          style={{ ...styles.button, background: colors.errorRed }}
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </>
  );
}

// ==================== CLIENT DATA TABS (FOR COACH) ====================
function ClientDataTabs({ client, clientGlucose }: { client: Client; clientGlucose: GlucoseReading[] }) {
  const [activeTab, setActiveTab] = useState<"glucose" | "symptoms">("glucose");
  const [clientSymptoms, setClientSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "symptoms") {
      loadClientSymptoms();
    }
  }, [activeTab, client.id]);

  const loadClientSymptoms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/coach/clients/${client.id}/symptoms`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setClientSymptoms(data.symptoms || []);
      }
    } catch (error) {
      console.error("Failed to load symptoms:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Tab Buttons */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "2px solid rgba(0,0,0,0.08)", paddingBottom: "8px" }}>
        <button
          style={{
            padding: "8px 16px",
            background: activeTab === "glucose" ? colors.sage : "transparent",
            color: activeTab === "glucose" ? colors.white : colors.lightText,
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
          onClick={() => setActiveTab("glucose")}
        >
          Glucose
        </button>
        <button
          style={{
            padding: "8px 16px",
            background: activeTab === "symptoms" ? colors.sage : "transparent",
            color: activeTab === "symptoms" ? colors.white : colors.lightText,
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
          onClick={() => setActiveTab("symptoms")}
        >
          Symptoms
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "glucose" ? (
        <>
          <h4 style={{ fontSize: "16px", fontWeight: "700", color: colors.darkText, marginBottom: "12px" }}>
            Recent Glucose Readings
          </h4>
          {clientGlucose.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: colors.lightText }}>
              No glucose readings yet
            </div>
          ) : (
            <ul style={styles.list}>
              {clientGlucose.slice(0, 10).map((reading, idx) => (
                <li key={reading.id || idx} style={styles.listItem}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: colors.darkText }}>
                      {reading.value || reading.glucose_level} mg/dL
                    </div>
                    <div style={{ fontSize: "13px", color: colors.lightText, marginTop: "4px" }}>
                      {new Date(reading.measured_at || reading.timestamp || "").toLocaleString()}
                    </div>
                    {reading.notes && (
                      <div style={{ fontSize: "14px", color: colors.darkText, marginTop: "6px" }}>
                        {reading.notes}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <h4 style={{ fontSize: "16px", fontWeight: "700", color: colors.darkText, marginBottom: "12px" }}>
            Recent Symptoms
          </h4>
          {loading ? (
            <div style={{ textAlign: "center", padding: "24px", color: colors.lightText }}>
              Loading symptoms...
            </div>
          ) : clientSymptoms.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: colors.lightText }}>
              No symptoms logged yet
            </div>
          ) : (
            <ul style={styles.list}>
              {clientSymptoms.slice(0, 10).map((symptom, idx) => (
                <li key={symptom.id || idx} style={styles.listItem}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: colors.darkText }}>
                      {symptom.symptom_type}
                    </div>
                    <div style={{ fontSize: "13px", color: colors.lightText, marginTop: "4px" }}>
                      {new Date(symptom.created_at || symptom.logged_at || "").toLocaleString()}
                    </div>
                    {symptom.notes && (
                      <div style={{ fontSize: "14px", color: colors.darkText, marginTop: "6px" }}>
                        {symptom.notes}
                      </div>
                    )}
                  </div>
                  <div style={{
                    padding: "8px 16px",
                    borderRadius: "12px",
                    background: "rgba(107,127,110,0.12)",
                    color: colors.sage,
                    fontWeight: "700",
                    fontSize: "16px",
                  }}>
                    {symptom.severity}/10
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}

// ==================== COACH MESSAGES TAB ====================
function CoachMessagesTab({ preSelectedClientId, clients }: { preSelectedClientId: number | null; clients: Client[] }) {
  const { user } = useApp();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (preSelectedClientId && clients.length > 0) {
      const client = clients.find(c => c.id === preSelectedClientId);
      if (client) {
        const conv: Conversation = {
          userId: client.id,
          userName: `${client.first_name} ${client.last_name}`,
          userEmail: client.email,
          lastMessage: "Start a conversation",
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
        };
        setSelectedConversation(conv);
      }
    }
  }, [preSelectedClientId, clients]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.userId);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/messages/conversations`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const loadMessages = async (userId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/messages/${userId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          receiverId: selectedConversation.userId,
          message: newMessage,
        }),
      });
      
      if (res.ok) {
        setNewMessage("");
        await loadMessages(selectedConversation.userId);
      }
    } catch (error) {
      alert("Failed to send message");
    }
  };

  // Merge clients with conversations
  const allConversations = clients.map(client => {
    const existing = conversations.find(c => c.userId === client.id);
    return existing || {
      userId: client.id,
      userName: `${client.first_name} ${client.last_name}`,
      userEmail: client.email,
      lastMessage: "Start a conversation",
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
    };
  });

  return (
    <>
      <h2 style={{ fontSize: "28px", fontWeight: "700", color: colors.darkText, marginBottom: "24px" }}>
        Messages
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px", height: "calc(100vh - 200px)" }}>
        {/* Conversations List */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Clients</h3>
          {allConversations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: colors.lightText }}>
              No clients yet
            </div>
          ) : (
            <ul style={styles.list}>
              {allConversations.map((conv) => (
                <li
                  key={conv.userId}
                  style={{
                    ...styles.listItem,
                    cursor: "pointer",
                    background: selectedConversation?.userId === conv.userId ? "rgba(107,127,110,0.08)" : "transparent",
                  }}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", fontWeight: "600", color: colors.darkText }}>
                      {conv.userName}
                    </div>
                    <div style={{ fontSize: "13px", color: colors.lightText, marginTop: "4px" }}>
                      {conv.lastMessage}
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: colors.sage,
                      color: colors.white,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}>
                      {conv.unreadCount}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Messages */}
        <div style={styles.card}>
          {!selectedConversation ? (
            <div style={{ textAlign: "center", padding: "48px", color: colors.lightText }}>
              Select a client to start messaging
            </div>
          ) : (
            <>
              <div style={{ borderBottom: "1px solid rgba(0,0,0,0.08)", paddingBottom: "16px", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: colors.darkText }}>
                  {selectedConversation.userName}
                </h3>
                {selectedConversation.userEmail && (
                  <div style={{ fontSize: "13px", color: colors.lightText, marginTop: "4px" }}>
                    {selectedConversation.userEmail}
                  </div>
                )}
              </div>

              <div style={{ height: "400px", overflowY: "auto", marginBottom: "16px" }}>
                {loading ? (
                  <div style={{ textAlign: "center", padding: "24px", color: colors.lightText }}>
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px", color: colors.lightText }}>
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: "flex",
                          justifyContent: isMe ? "flex-end" : "flex-start",
                          marginBottom: "12px",
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "70%",
                            padding: "12px 16px",
                            borderRadius: "16px",
                            background: isMe ? colors.sage : "rgba(0,0,0,0.06)",
                            color: isMe ? colors.white : colors.darkText,
                          }}
                        >
                          <div>{msg.message}</div>
                          <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.7 }}>
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  style={{ ...styles.input, flex: 1 }}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  style={{ ...styles.button, width: "auto", padding: "0 24px" }}
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ==================== COACH DASHBOARD ====================
function CoachDashboard() {
  const { user, logout } = useApp();
  const [activeTab, setActiveTab] = useState<"clients" | "groups" | "messages">("clients");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientGlucose, setClientGlucose] = useState<GlucoseReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageClientId, setMessageClientId] = useState<number | null>(null);

  // Group management
  const [coachGroups, setCoachGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [newGroupMessage, setNewGroupMessage] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === "clients") {
      loadClients();
    } else if (activeTab === "groups") {
      loadCoachGroups();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupMessages(selectedGroup.id);
      loadGroupMembers(selectedGroup.id);
    }
  }, [selectedGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);

  const loadClients = async () => {
    setLoading(true);
    const data = await api.getClients();
    setClients(data);
    setLoading(false);
  };

  const loadCoachGroups = async () => {
    setLoading(true);
    const groups = await api.getCoachGroups();
    setCoachGroups(groups);
    setLoading(false);
  };

  const loadGroupMessages = async (groupId: string) => {
    const messages = await api.getGroupMessages(groupId);
    setGroupMessages(messages.reverse());
  };

  const loadGroupMembers = async (groupId: string) => {
    const members = await api.getGroupMembers(groupId);
    setGroupMembers(members);
  };

  const handleClientSelect = async (client: Client) => {
    setSelectedClient(client);
    const glucose = await api.getClientGlucose(client.id);
    setClientGlucose(glucose);
  };

  const handleSendGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupMessage.trim() || !selectedGroup) return;

    try {
      await api.sendGroupMessage(selectedGroup.id, newGroupMessage);
      setNewGroupMessage("");
      await loadGroupMessages(selectedGroup.id);
    } catch (error) {
      alert("Failed to send message");
    }
  };

  const tabs = [
    { id: "clients", label: "Clients" },
    { id: "groups", label: "Groups" },
    { id: "messages", label: "Messages" },
  ];

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div style={{ fontSize: "20px", fontWeight: "700", color: colors.sage, marginRight: "24px" }}>
          GraceFlow Coach
        </div>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            style={{
              ...styles.navButton,
              ...(activeTab === tab.id ? styles.navButtonActive : {}),
            }}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto" }}>
          <span style={{ marginRight: "16px", color: colors.lightText }}>
            {user?.first_name} {user?.last_name}
          </span>
          <button
            style={{ ...styles.navButton, color: colors.errorRed }}
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </nav>

      <div style={styles.dashboard}>
        <div style={styles.header}>
          <h1 style={styles.greeting}>Welcome, Coach {user?.first_name}!</h1>
          <p style={{ color: colors.lightText, fontSize: "15px" }}>
            {activeTab === "clients" ? "Manage your clients" : activeTab === "groups" ? "Manage your coaching groups" : "Message your clients"}
          </p>
        </div>

        {activeTab === "clients" ? (
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px" }}>
            {/* Clients List */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>My Clients ({clients.length})</h3>
              {loading ? (
                <div style={{ textAlign: "center", padding: "24px", color: colors.lightText }}>
                  Loading clients...
                </div>
              ) : clients.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px", color: colors.lightText }}>
                  No clients assigned yet
                </div>
              ) : (
                <ul style={styles.list}>
                  {clients.map((client) => (
                    <li
                      key={client.id}
                      style={{
                        ...styles.listItem,
                        cursor: "pointer",
                        background: selectedClient?.id === client.id ? "rgba(107,127,110,0.08)" : "transparent",
                      }}
                      onClick={() => handleClientSelect(client)}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "16px", fontWeight: "600", color: colors.darkText }}>
                          {client.first_name} {client.last_name}
                        </div>
                        <div style={{ fontSize: "13px", color: colors.lightText, marginTop: "4px" }}>
                          {client.email}
                        </div>
                        {client.latest_glucose && (
                          <div style={{ fontSize: "13px", color: colors.sage, marginTop: "4px", fontWeight: "600" }}>
                            Latest: {client.latest_glucose} mg/dL
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Client Detail */}
            <div style={styles.card}>
              {!selectedClient ? (
                <div style={{ textAlign: "center", padding: "48px", color: colors.lightText }}>
                  Select a client to view their details
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <div>
                      <h3 style={{ fontSize: "20px", fontWeight: "700", color: colors.darkText }}>
                        {selectedClient.first_name} {selectedClient.last_name}
                      </h3>
                      <div style={{ fontSize: "14px", color: colors.lightText, marginTop: "4px" }}>
                        {selectedClient.email}
                      </div>
                    </div>
                    <button
                      style={{ ...styles.button, width: "auto", padding: "0 24px", height: "48px" }}
                      onClick={() => {
                        setMessageClientId(selectedClient.id);
                        setActiveTab("messages");
                      }}
                    >
                      💬 Message Client
                    </button>
                  </div>

                  {/* Tabs for Glucose and Symptoms */}
                  <ClientDataTabs client={selectedClient} clientGlucose={clientGlucose} />
                </>
              )}
            </div>
          </div>
        ) : activeTab === "messages" ? (
          <CoachMessagesTab preSelectedClientId={messageClientId} clients={clients} />
        ) : (
          // Groups Tab
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div>
                {selectedGroup ? (
                  <button
                    style={{ ...styles.navButton, padding: "8px 16px" }}
                    onClick={() => setSelectedGroup(null)}
                  >
                    ← Back to Groups
                  </button>
                ) : (
                  <div />
                )}
              </div>
              {!selectedGroup && (
                <button
                  style={{ ...styles.button, width: "auto", padding: "0 24px", height: "48px" }}
                  onClick={() => setShowCreateGroup(true)}
                >
                  + Create Group
                </button>
              )}
            </div>

            {showCreateGroup && <CreateGroupForm onClose={() => setShowCreateGroup(false)} onCreated={loadCoachGroups} />}

            {selectedGroup ? (
              // Group Chat View
              <div style={styles.card}>
                <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                  <h3 style={{ fontSize: "20px", fontWeight: "700", color: colors.darkText }}>
                    {selectedGroup.name}
                  </h3>
                  <p style={{ fontSize: "14px", color: colors.lightText, marginTop: "4px" }}>
                    {selectedGroup.description}
                  </p>
                  <div style={{ fontSize: "13px", color: colors.lightText, marginTop: "8px" }}>
                    👥 {groupMembers.length} members • 
                    {selectedGroup.access_code && ` 🔑 Code: ${selectedGroup.access_code}`}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 250px", gap: "24px" }}>
                  {/* Messages */}
                  <div>
                    <div style={{ height: "500px", overflowY: "auto", marginBottom: "16px", padding: "16px", background: "rgba(0,0,0,0.02)", borderRadius: "12px" }}>
                      {groupMessages.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px", color: colors.lightText }}>
                          <div style={{ fontSize: "48px", marginBottom: "16px" }}>💬</div>
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        groupMessages.map((msg) => {
                          const isMe = msg.sender_id === user?.id;
                          return (
                            <div
                              key={msg.id}
                              style={{
                                marginBottom: "16px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: isMe ? "flex-end" : "flex-start",
                              }}
                            >
                              {!isMe && msg.sender && (
                                <div style={{ fontSize: "12px", fontWeight: "600", color: colors.lightText, marginBottom: "4px" }}>
                                  {msg.sender.first_name} {msg.sender.last_name}
                                </div>
                              )}
                              <div
                                style={{
                                  maxWidth: "70%",
                                  padding: "12px 16px",
                                  borderRadius: "16px",
                                  background: isMe ? colors.sage : colors.white,
                                  color: isMe ? colors.white : colors.darkText,
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                }}
                              >
                                <div>{msg.message}</div>
                                <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.7 }}>
                                  {new Date(msg.created_at).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendGroupMessage} style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        style={{ ...styles.input, flex: 1 }}
                        value={newGroupMessage}
                        onChange={(e) => setNewGroupMessage(e.target.value)}
                        placeholder="Send a message to the group..."
                      />
                      <button
                        type="submit"
                        style={{ ...styles.button, width: "auto", padding: "0 24px" }}
                        disabled={!newGroupMessage.trim()}
                      >
                        Send
                      </button>
                    </form>
                  </div>

                  {/* Members Sidebar */}
                  <div style={{ background: "rgba(0,0,0,0.02)", padding: "16px", borderRadius: "12px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: colors.darkText, marginBottom: "12px" }}>
                      Members ({groupMembers.length})
                    </h4>
                    <ul style={{ ...styles.list, maxHeight: "500px", overflowY: "auto" }}>
                      {groupMembers.map((member) => (
                        <li key={member.id} style={{ ...styles.listItem, padding: "8px 0" }}>
                          <div style={{ fontSize: "14px", color: colors.darkText }}>
                            {member.first_name} {member.last_name}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              // Groups List
              <>
                {loading ? (
                  <div style={{ textAlign: "center", padding: "32px", color: colors.lightText }}>
                    Loading groups...
                  </div>
                ) : coachGroups.length === 0 ? (
                  <div style={styles.card}>
                    <div style={{ textAlign: "center", padding: "48px" }}>
                      <div style={{ fontSize: "48px", marginBottom: "16px" }}>👥</div>
                      <h3 style={{ fontSize: "24px", fontWeight: "600", color: colors.darkText, marginBottom: "12px" }}>
                        No groups yet
                      </h3>
                      <p style={{ color: colors.lightText, fontSize: "15px", lineHeight: "22px", maxWidth: "400px", margin: "0 auto" }}>
                        Create your first coaching group to start building community and supporting multiple clients together.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={styles.grid}>
                    {coachGroups.map((group) => (
                      <div key={group.id} style={styles.card}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <h4 style={{ fontSize: "18px", fontWeight: "700", color: colors.darkText }}>
                            {group.name}
                          </h4>
                          {group.status === "draft" && (
                            <span style={{
                              padding: "4px 12px",
                              background: "#FFF3CD",
                              color: "#856404",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}>
                              DRAFT
                            </span>
                          )}
                          {group.status === "active" && (
                            <span style={{
                              padding: "4px 12px",
                              background: "#D4EDDA",
                              color: "#155724",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: "14px", color: colors.lightText, marginBottom: "12px", lineHeight: "1.5" }}>
                          {group.description}
                        </p>
                        <div style={{ fontSize: "13px", color: colors.lightText, marginBottom: "12px" }}>
                          <div>📅 Starts: {new Date(group.start_date).toLocaleDateString()}</div>
                          <div>⏱️ Duration: {group.duration_weeks} weeks</div>
                          {group.access_code && (
                            <div style={{ marginTop: "8px", padding: "8px", background: "rgba(107,127,110,0.1)", borderRadius: "8px", fontFamily: "monospace", fontWeight: "700", color: colors.sage }}>
                              🔑 {group.access_code}
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            style={{ ...styles.button, flex: 1 }}
                            onClick={() => setSelectedGroup(group)}
                          >
                            💬 Open Chat
                          </button>
                          
                          {group.status === "draft" && (
                            <button
                              style={{
                                ...styles.button,
                                width: "auto",
                                padding: "0 16px",
                                background: "#28A745",
                              }}
                              onClick={async () => {
                                try {
                                  await api.updateGroupStatus(group.id, "active");
                                  await loadCoachGroups();
                                  alert("Group is now active and visible to users!");
                                } catch (error) {
                                  alert("Failed to publish group");
                                }
                              }}
                            >
                              📢 Publish
                            </button>
                          )}
                          
                          {group.status === "active" && (
                            <button
                              style={{
                                ...styles.button,
                                width: "auto",
                                padding: "0 16px",
                                background: "#FFC107",
                              }}
                              onClick={async () => {
                                try {
                                  await api.updateGroupStatus(group.id, "draft");
                                  await loadCoachGroups();
                                  alert("Group is now hidden from users");
                                } catch (error) {
                                  alert("Failed to unpublish group");
                                }
                              }}
                            >
                              👁️ Hide
                            </button>
                          )}
                          
                          <button
                            style={{
                              ...styles.button,
                              width: "auto",
                              padding: "0 16px",
                              background: colors.errorRed,
                            }}
                            onClick={async () => {
                              if (window.confirm(`Delete "${group.name}"? This cannot be undone.`)) {
                                try {
                                  await api.deleteGroup(group.id);
                                  await loadCoachGroups();
                                  alert("Group deleted successfully");
                                } catch (error) {
                                  alert("Failed to delete group");
                                }
                              }
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ==================== CREATE GROUP FORM ====================
function CreateGroupForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    durationWeeks: 8,
    maxMembers: 12,
    foundingPrice: 297,
    paymentPlanPrice: 397,
    meetingDay: "Tuesday",
    meetingTime: "19:00",
    timezone: "EST",
    status: "draft" as "draft" | "active",
  });
  const [loading, setLoading] = useState(false);
  const [accessCode, setAccessCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await api.createGroup({
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        durationWeeks: formData.durationWeeks,
        maxMembers: formData.maxMembers,
        pricing: {
          founding: formData.foundingPrice,
          paymentPlan: formData.paymentPlanPrice,
        },
        meetingSchedule: {
          day: formData.meetingDay,
          time: formData.meetingTime,
          timezone: formData.timezone,
        },
        status: formData.status,
      });

      setAccessCode(result.accessCode);
      await onCreated();
      
      // Show success message with code
      setTimeout(() => {
        onClose();
      }, 5000);
    } catch (error) {
      alert("Failed to create group");
      setLoading(false);
    }
  };

  if (accessCode) {
    return (
      <div style={{ ...styles.card, marginBottom: "24px", background: "#E8F5E9" }}>
        <h3 style={{ fontSize: "20px", fontWeight: "700", color: colors.darkText, marginBottom: "12px" }}>
          ✅ Group Created Successfully!
        </h3>
        <p style={{ fontSize: "15px", color: colors.darkText, marginBottom: "16px" }}>
          Share this access code with your clients:
        </p>
        <div style={{
          padding: "16px",
          background: colors.white,
          borderRadius: "12px",
          fontFamily: "monospace",
          fontSize: "24px",
          fontWeight: "700",
          color: colors.sage,
          textAlign: "center",
          marginBottom: "16px",
        }}>
          {accessCode}
        </div>
        <button style={{ ...styles.button, background: colors.sage }} onClick={onClose}>
          Done
        </button>
      </div>
    );
  }

  return (
    <div style={{ ...styles.card, marginBottom: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={styles.cardTitle}>Create New Group</h3>
        <button style={{ ...styles.navButton, color: colors.errorRed }} onClick={onClose}>
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Group Name *</label>
            <input
              type="text"
              style={styles.input}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
              placeholder="e.g., Spring Wellness Circle"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Start Date *</label>
            <input
              type="date"
              style={styles.input}
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Duration (weeks) *</label>
            <input
              type="number"
              style={styles.input}
              value={formData.durationWeeks}
              onChange={(e) => setFormData({ ...formData, durationWeeks: parseInt(e.target.value) })}
              required
              disabled={loading}
              min="4"
              max="52"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Max Members *</label>
            <input
              type="number"
              style={styles.input}
              value={formData.maxMembers}
              onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
              required
              disabled={loading}
              min="4"
              max="50"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Meeting Day *</label>
            <select
              style={styles.input}
              value={formData.meetingDay}
              onChange={(e) => setFormData({ ...formData, meetingDay: e.target.value })}
              disabled={loading}
            >
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Meeting Time *</label>
            <input
              type="time"
              style={styles.input}
              value={formData.meetingTime}
              onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Status *</label>
            <select
              style={styles.input}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as "draft" | "active" })}
              disabled={loading}
            >
              <option value="draft">Draft (Hidden from users)</option>
              <option value="active">Active (Visible to users)</option>
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1", ...styles.formGroup }}>
            <label style={styles.label}>Description *</label>
            <textarea
              style={{ ...styles.input, minHeight: "80px" }}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={loading}
              placeholder="Describe what participants will learn and experience..."
            />
          </div>
        </div>

        <button type="submit" style={{ ...styles.button, opacity: loading ? 0.6 : 1 }} disabled={loading}>
          {loading ? "Creating..." : "Create Group"}
        </button>
      </form>
    </div>
  );
}

// ==================== APP ROOT ====================
function App() {
  const { isAuthenticated } = useApp();
  const [showRegister, setShowRegister] = useState(false);

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return showRegister ? (
    <RegisterScreen onSwitchToLogin={() => setShowRegister(false)} />
  ) : (
    <LoginScreen onSwitchToRegister={() => setShowRegister(true)} />
  );
}

function Root() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}

export default Root;