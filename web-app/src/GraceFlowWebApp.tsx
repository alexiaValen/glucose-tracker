// GraceFlowWebApp.tsx - Complete Single-File Web Application
// This file contains everything needed to run GraceFlow in the browser
// Users can login, signup, log glucose, log symptoms - just like the mobile app

import React, { useEffect, useState, createContext, useContext } from "react";

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
  measured_at: string;
  unit?: string;
  source?: string;
  source_device?: string;
  notes?: string;
  created_at?: string;
}

interface Symptom {
  id?: number;
  symptom_type: string;
  severity: number;
  notes?: string;
  created_at?: string;
  logged_at?: string;  // Backend uses logged_at
}

interface Cycle {
  id?: number;
  cycle_start_date: string;
  current_day?: number;
  phase?: string;
}

// ==================== API BASE ====================
const API_HOST = ((import.meta as any).env.VITE_API_URL as string) || "http://localhost:3000";
const API_URL = `${API_HOST.replace(/\/$/, "")}/api/v1`;

console.log('🌐 API URL:', API_URL);

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

    if (access) {
      localStorage.setItem("accessToken", access);
    }
    if (refresh) {
      localStorage.setItem("refreshToken", refresh);
    }
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) throw new Error("Refresh failed");

      const data = await response.json();
      this.saveTokens(data);
      return true;
    } catch (error) {
      console.error("❌ Token refresh failed:", error);
      this.logout();
      return false;
    }
  }

  async request(endpoint: string, method: string = "GET", body?: any): Promise<any> {
    let response;
    try {
      response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: this.getHeaders(),
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      if (response.status === 401) {
        // Token expired - try refresh
        const refreshed = await this.refreshToken();
        if (!refreshed) throw new Error("Session expired");

        // Retry with new token
        response = await fetch(`${API_URL}${endpoint}`, {
          method,
          headers: this.getHeaders(),
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Request failed");
      }

      return response.json();
    } catch (error) {
      console.error(`❌ API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<any> {
    const data = await this.request("/auth/login", "POST", { email, password });
    this.saveTokens(data);
    return data;
  }

  async register(email: string, password: string, firstName: string, lastName: string): Promise<any> {
    const data = await this.request("/auth/register", "POST", {
      email,
      password,
      firstName,
      lastName,
      dateOfBirth: new Date().toISOString().split('T')[0], // Default birthdate
    });
    this.saveTokens(data);
    return data;
  }

  async logout() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      await this.request("/auth/logout", "POST", { refreshToken }).catch(() => {});
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  // Other methods remain the same...
  async getUser(): Promise<User> {
    return this.request("/users/me");
  }

  async getGlucoseReadings(): Promise<GlucoseReading[]> {
    return this.request("/glucose");
  }

  async addGlucoseReading(reading: Partial<GlucoseReading>): Promise<GlucoseReading> {
    return this.request("/glucose", "POST", reading);
  }

  async getSymptoms(): Promise<Symptom[]> {
    return this.request("/symptoms");
  }

  async addSymptom(symptom: Partial<Symptom>): Promise<Symptom> {
    return this.request("/symptoms", "POST", symptom);
  }

  async getCurrentCycle(): Promise<Cycle | null> {
    return this.request("/cycles/current");
  }

  async startCycle(startDate: string): Promise<Cycle> {
    return this.request("/cycles", "POST", { cycleStartDate: startDate });
  }

  async getConversations(): Promise<any[]> {
    return this.request("/messages/conversations");
  }

  async getMessages(userId: string): Promise<any[]> {
    return this.request(`/messages/${userId}`);
  }

  async sendMessage(recipientId: string, message: string): Promise<any> {
    return this.request("/messages", "POST", { recipientId, message });
  }

  async markAsRead(userId: string): Promise<any> {
    return this.request(`/messages/${userId}/read`, "PUT");
  }

  async getMyCoach(): Promise<any> {
    return this.request("/coach/my-coach");
  }

  async getClients(): Promise<any[]> {
    return this.request("/coach/clients");
  }

  async getClientGlucose(clientId: string): Promise<GlucoseReading[]> {
    return this.request(`/coach/clients/${clientId}/glucose`);
  }

  async getClientCycle(clientId: string): Promise<Cycle | null> {
    return this.request(`/coach/clients/${clientId}/cycle`);  // Fixed: removed /current
  }

  async getGroups(): Promise<any[]> {
    return this.request("/groups");
  }

  async getMyGroups(): Promise<any[]> {
    return this.request("/groups/my-groups");
  }

  async joinGroup(groupId: string): Promise<any> {
    return this.request(`/groups/${groupId}/join`, "POST");
  }
}

// ==================== CONTEXT ====================
interface AppContextType {
  isAuthenticated: boolean;
  user: User | null;
  glucoseReadings: GlucoseReading[];
  symptoms: Symptom[];
  currentCycle: Cycle | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const api = new ApiService();

function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("accessToken"));
  const [user, setUser] = useState<User | null>(null);
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [currentCycle, setCurrentCycle] = useState<Cycle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("📊 Loading user data...");
      const [userData, readings, symps, cycle] = await Promise.all([
        api.getUser(),
        api.getGlucoseReadings(),
        api.getSymptoms(),
        api.getCurrentCycle(),
      ]);

      setUser(userData);
      setGlucoseReadings(readings);
      setSymptoms(symps);
      setCurrentCycle(cycle);
      console.log("✅ Loaded user data");
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes("token") || err.message.includes("expired")) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const login = async (email: string, password: string) => {
    try {
      await api.login(email, password);
      setIsAuthenticated(true);
      await loadData();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      await api.register(email, password, firstName, lastName);
      setIsAuthenticated(true);
      await loadData();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    api.logout();
    setIsAuthenticated(false);
    setUser(null);
    setGlucoseReadings([]);
    setSymptoms([]);
    setCurrentCycle(null);
  };

  const refreshData = loadData;

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        user,
        glucoseReadings,
        symptoms,
        currentCycle,
        isLoading,
        error,
        login,
        register,
        logout,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

function useApp() {
  const context = useContext(AppContext);
  if (undefined === context) throw new Error("useApp must be used within AppProvider");
  return context;
}

// ==================== STYLES ====================
const styles = {
  container: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "20px 16px",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #F5F4F0 0%, #E8EDE9 100%)",
    fontFamily: "'Inter', sans-serif",
  } as React.CSSProperties,
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  } as React.CSSProperties,
  logo: {
    fontSize: 28,
    fontWeight: 800,
    color: "#3D5540",
    letterSpacing: -0.5,
  } as React.CSSProperties,
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "14px 16px",
    fontSize: 16,
    border: "1px solid rgba(212, 214, 212, 0.9)",
    borderRadius: 18,
    background: "rgba(255, 255, 255, 0.98)",
    color: "#2A2D2A",
    transition: "0.2s",
  } as React.CSSProperties,
  button: {
    padding: "14px",
    fontSize: 16,
    fontWeight: 600,
    border: "none",
    borderRadius: 18,
    background: "#6B7F6E",
    color: "#FFFFFF",
    cursor: "pointer",
    transition: "0.2s",
  } as React.CSSProperties,
  link: {
    color: "#6B7F6E",
    textDecoration: "none",
    fontWeight: 500,
  } as React.CSSProperties,
  error: {
    color: "#D14D4D",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  } as React.CSSProperties,
  tabBar: {
    position: "fixed" as "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "rgba(255, 255, 255, 0.95)",
    borderTop: "1px solid #E8EDE9",
    display: "flex",
    justifyContent: "space-around",
    padding: "8px 0",
    backdropFilter: "blur(8px)",
  } as React.CSSProperties,
  tab: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "#6B6B6B",
    textDecoration: "none",
    fontSize: 12,
    gap: 4,
  } as React.CSSProperties,
  tabActive: {
    color: "#3D5540",
    fontWeight: 600,
  } as React.CSSProperties,
  card: {
    background: "rgba(255, 255, 255, 0.98)",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    boxShadow: "0 2px 8px rgba(107, 127, 110, 0.08)",
  } as React.CSSProperties,
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  } as React.CSSProperties,
  listItem: {
    padding: "16px 0",
    borderBottom: "1px solid #E8EDE9",
  } as React.CSSProperties,
};

// ==================== COMPONENTS ====================
function LoginScreen({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { login, error } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch {}
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>🌿 GraceFlow</div>
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#2A2D2A", marginBottom: 24 }}>Welcome back</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          autoComplete="email"
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          autoComplete="current-password"
          disabled={loading}
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        {error && <div style={styles.error}>{error}</div>}
      </form>
      <div style={{ textAlign: "center", marginTop: 24 }}>
        No account?{" "}
        <a onClick={onSwitchToRegister} style={styles.link}>
          Sign up
        </a>
      </div>
    </div>
  );
}

function RegisterScreen({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { register, error } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, firstName, lastName);
    } catch {}
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>🌿 GraceFlow</div>
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#2A2D2A", marginBottom: 24 }}>Create account</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          style={styles.input}
          autoComplete="given-name"
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          style={styles.input}
          autoComplete="family-name"
          disabled={loading}
        />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          autoComplete="email"
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Choose password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          autoComplete="new-password"
          disabled={loading}
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Creating..." : "Sign up"}
        </button>
        {error && <div style={styles.error}>{error}</div>}
      </form>
      <div style={{ textAlign: "center", marginTop: 24 }}>
        Have an account?{" "}
        <a onClick={onSwitchToLogin} style={styles.link}>
          Login
        </a>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, logout, isLoading, error, refreshData } = useApp();
  const [activeTab, setActiveTab] = useState("home");

  if (isLoading) {
    return <div style={styles.container}>Loading...</div>;
  }

  if (error) {
    return <div style={styles.container}>Error: {error}</div>;
  }

  if (!user) {
    return <div style={styles.container}>Not authenticated</div>;
  }

  const isCoach = user.role === "coach";

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>🌿 GraceFlow</div>
        <button onClick={logout} style={{ ...styles.button, background: "none", color: "#D14D4D", fontSize: 14 }}>
          Logout
        </button>
      </div>

      {activeTab === "home" && <HomeTab />}
      {activeTab === "glucose" && <GlucoseTab onRefresh={refreshData} />}
      {activeTab === "symptoms" && <SymptomsTab onRefresh={refreshData} />}
      {activeTab === "cycle" && <CycleTab onRefresh={refreshData} />}
      {activeTab === "messages" && <MessagesTab />}
      {activeTab === "groups" && <GroupsTab onRefresh={refreshData} />}
      {activeTab === "coach" && isCoach && <CoachDashboard onRefresh={refreshData} />}
      {activeTab === "settings" && <SettingsTab />}

      <div style={styles.tabBar}>
        <a style={{ ...styles.tab, ...(activeTab === "home" ? styles.tabActive : {}) }} onClick={() => setActiveTab("home")}>
          🏠 Home
        </a>
        <a style={{ ...styles.tab, ...(activeTab === "glucose" ? styles.tabActive : {}) }} onClick={() => setActiveTab("glucose")}>
          📈 Glucose
        </a>
        <a style={{ ...styles.tab, ...(activeTab === "symptoms" ? styles.tabActive : {}) }} onClick={() => setActiveTab("symptoms")}>
          😔 Symptoms
        </a>
        <a style={{ ...styles.tab, ...(activeTab === "cycle" ? styles.tabActive : {}) }} onClick={() => setActiveTab("cycle")}>
          📅 Cycle
        </a>
        <a style={{ ...styles.tab, ...(activeTab === "messages" ? styles.tabActive : {}) }} onClick={() => setActiveTab("messages")}>
          💬 Messages
        </a>
        <a style={{ ...styles.tab, ...(activeTab === "groups" ? styles.tabActive : {}) }} onClick={() => setActiveTab("groups")}>
          👥 Groups
        </a>
        {isCoach && (
          <a style={{ ...styles.tab, ...(activeTab === "coach" ? styles.tabActive : {}) }} onClick={() => setActiveTab("coach")}>
            👩‍🏫 Coach
          </a>
        )}
        <a style={{ ...styles.tab, ...(activeTab === "settings" ? styles.tabActive : {}) }} onClick={() => setActiveTab("settings")}>
          ⚙️ Settings
        </a>
      </div>
    </div>
  );
}

function HomeTab() {
  const { user, glucoseReadings, symptoms, currentCycle } = useApp();

  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#2A2D2A", marginBottom: 24 }}>
        Welcome, {user?.first_name}
      </h2>

      <div style={styles.card}>
        <div style={{ fontWeight: 900, color: "#2A2D2A", marginBottom: 16 }}>Quick Overview</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div>Latest Glucose:</div>
          <div>{glucoseReadings[0]?.value || "N/A"} mg/dL</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div>Recent Symptom:</div>
          <div>{symptoms[0]?.symptom_type || "None"}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>Cycle Day:</div>
          <div>{currentCycle?.current_day || "Not tracking"}</div>
        </div>
      </div>
    </>
  );
}

function GlucoseTab({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const { glucoseReadings } = useApp();
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.addGlucoseReading({
        value: parseFloat(value),
        measured_at: new Date().toISOString(),
        notes,
      });
      setValue("");
      setNotes("");
      await onRefresh();
    } catch (err) {
      console.error("❌ Failed to add reading");
    }
    setLoading(false);
  };

  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#2A2D2A", marginBottom: 24 }}>Glucose Tracking</h2>

      <div style={styles.card}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="number"
            placeholder="Glucose value (mg/dL)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Adding..." : "Add Reading"}
          </button>
        </form>
      </div>

      <div style={styles.card}>
        <div style={{ fontWeight: 900, color: "#2A2D2A", marginBottom: 16 }}>Recent Readings</div>
        {glucoseReadings.length === 0 ? (
          <div style={{ color: "#6B6B6B" }}>No readings yet.</div>
        ) : (
          <ul style={styles.list}>
            {glucoseReadings.slice(0, 10).map((r, idx) => (
              <li key={r.id || idx} style={styles.listItem}>
                <div style={{ fontWeight: 900, color: "#2A2D2A" }}>
                  {r.value} {r.unit || "mg/dL"}
                </div>
                <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>
                  {new Date(r.measured_at || r.created_at || "").toLocaleString()}
                </div>
                {r.notes && <div style={{ fontSize: 14, color: "#4A4A4A", marginTop: 4 }}>{r.notes}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function SymptomsTab({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const { symptoms } = useApp();
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.addSymptom({
        symptom_type: type,
        severity,
        notes,
        logged_at: new Date().toISOString(),
      });
      setType("");
      setSeverity(5);
      setNotes("");
      await onRefresh();
    } catch (err) {
      console.error("❌ Failed to add symptom");
    }
    setLoading(false);
  };

  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#2A2D2A", marginBottom: 24 }}>Symptom Tracking</h2>

      <div style={styles.card}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Symptom type (e.g., headache)"
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ fontSize: 14, color: "#4A4A4A" }}>Severity (1-10):</label>
            <input
              type="range"
              min={1}
              max={10}
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value))}
              style={{ flex: 1 }}
              disabled={loading}
            />
            <span>{severity}</span>
          </div>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Adding..." : "Log Symptom"}
          </button>
        </form>
      </div>

      <div style={styles.card}>
        <div style={{ fontWeight: 900, color: "#2A2D2A", marginBottom: 16 }}>Recent Symptoms</div>
        {symptoms.length === 0 ? (
          <div style={{ color: "#6B6B6B" }}>No symptoms logged.</div>
        ) : (
          <ul style={styles.list}>
            {symptoms.slice(0, 10).map((s, idx) => (
              <li key={s.id || idx} style={styles.listItem}>
                <div style={{ fontWeight: 900, color: "#2A2D2A" }}>{s.symptom_type}</div>
                <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>
                  Severity: {s.severity} • {new Date(s.logged_at || s.created_at || "").toLocaleString()}
                </div>
                {s.notes && <div style={{ fontSize: 14, color: "#4A4A4A", marginTop: 4 }}>{s.notes}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function CycleTab({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const { currentCycle } = useApp();
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.startCycle(startDate);
      await onRefresh();
    } catch (err) {
      console.error("❌ Failed to start cycle");
    }
    setLoading(false);
  };

  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#2A2D2A", marginBottom: 24 }}>Cycle Tracking</h2>

      <div style={styles.card}>
        {currentCycle ? (
          <>
            <div style={{ fontWeight: 900, color: "#2A2D2A", marginBottom: 16 }}>Current Cycle</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>Start Date:</div>
              <div>{new Date(currentCycle.cycle_start_date).toLocaleDateString()}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>Current Day:</div>
              <div>{currentCycle.current_day}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>Phase:</div>
              <div>{currentCycle.phase}</div>
            </div>
          </>
        ) : (
          <form onSubmit={handleStart} style={styles.form}>
            <label style={{ fontSize: 14, color: "#4A4A4A", marginBottom: 8 }}>Cycle Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Starting..." : "Start Tracking"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

function MessagesTab() {
  const { user } = useApp();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const convos = await api.getConversations();
        setConversations(convos);
      } catch {}
      setLoading(false);
    };
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      const loadMessages = async () => {
        try {
          const msgs = await api.getMessages(selectedUser);
          setMessages(msgs);
          await api.markAsRead(selectedUser);
        } catch {}
      };
      loadMessages();
    }
  }, [selectedUser]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !message.trim()) return;

    try {
      await api.sendMessage(selectedUser, message);
      setMessage("");
      // Reload messages
      const msgs = await api.getMessages(selectedUser);
      setMessages(msgs);
    } catch {}
  };

  if (loading) return <div>Loading conversations...</div>;

  if (!selectedUser) {
    return (
      <>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#2A2D2A", marginBottom: 24 }}>Messages</h2>
        <div style={styles.card}>
          <div style={{ fontWeight: 900, color: "#2A2D2A", marginBottom: 16 }}>Conversations</div>
          <ul style={styles.list}>
            {conversations.map((conv, idx) => (
              <li
                key={conv.id || idx}
                style={{ ...styles.listItem, cursor: "pointer" }}
                onClick={() => setSelectedUser(conv.user.id)}
              >
                <div style={{ fontWeight: 900, color: "#2A2D2A" }}>
                  {conv.user.firstName} {conv.user.lastName}
                </div>
                <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>
                  {conv.lastMessage ? conv.lastMessage.message.substring(0, 30) + "..." : "No messages"}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  }

  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#2A2D2A", marginBottom: 24 }}>Chat</h2>
      <div style={styles.card}>
        <button onClick={() => setSelectedUser(null)} style={{ marginBottom: 16, color: "#6B7F6E" }}>
          ← Back
        </button>
        <div style={{ maxHeight: 400, overflowY: "auto", marginBottom: 16 }}>
          {messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              style={{
                textAlign: msg.sender_id === user?.id ? "right" : "left",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: 16,
                  background: msg.sender_id === user?.id ? "#6B7F6E" : "#E8EDE9",
                  color: msg.sender_id === user?.id ? "#FFFFFF" : "#2A2D2A",
                }}
              >
                {msg.message}
              </div>
              <div style={{ fontSize: 10, color: "#6B6B6B", marginTop: 4 }}>
                {new Date(msg.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="Type message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ ...styles.input, flex: 1 }}
          />
          <button type="submit" style={{ ...styles.button, padding: "14px 20px" }}>
            Send
          </button>
        </form>
      </div>
    </>
  );
}

function GroupsTab({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [groups, setGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const [allGroups, userGroups] = await Promise.all([api.getGroups(), api.getMyGroups()]);
        setGroups(allGroups);
        setMyGroups(userGroups);
      } catch {}
      setLoading(false);
    };
    loadGroups();
  }, []);

  const handleJoin = async (groupId: string) => {
    try {
      await api.joinGroup(groupId);
      await onRefresh();
      // Reload groups
      const [allGroups, userGroups] = await Promise.all([api.getGroups(), api.getMyGroups()]);
      setGroups(allGroups);
      setMyGroups(userGroups);
    } catch {}
  };

  if (loading) return <div>Loading groups...</div>;

  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#2A2D2A", marginBottom: 24 }}>Group Coaching</h2>

      <div style={styles.card}>
        <div style={{ fontWeight: 900, color: "#2A2D2A", marginBottom: 16 }}>My Groups</div>
        {myGroups.length === 0 ? (
          <div style={{ color: "#6B6B6B" }}>No groups joined yet.</div>
        ) : (
          <ul style={styles.list}>
            {myGroups.map((group) => (
              <li key={group.id} style={styles.listItem}>
                <div style={{ fontWeight: 900, color: "#2A2D2A" }}>{group.name}</div>
                <div style={{ fontSize: 14, color: "#4A4A4A", marginTop: 4 }}>{group.description}</div>
                <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 8 }}>
                  Starts: {new Date(group.startDate).toLocaleDateString()} • Duration: {group.durationWeeks} weeks
                </div>
                <div style={{ fontSize: 12, color: "#6B6B6B" }}>
                  Schedule: {group.meetingSchedule.day} at {group.meetingSchedule.time} {group.meetingSchedule.timezone}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={styles.card}>
        <div style={{ fontWeight: 900, color: "#2A2D2A", marginBottom: 16 }}>Available Groups</div>
        <ul style={styles.list}>
          {groups.map((group) => (
            <li key={group.id} style={styles.listItem}>
              <div style={{ fontWeight: 900, color: "#2A2D2A" }}>{group.name}</div>
              <div style={{ fontSize: 14, color: "#4A4A4A", marginTop: 4 }}>{group.description}</div>
              <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 8 }}>
                Starts: {new Date(group.startDate).toLocaleDateString()} • Duration: {group.durationWeeks} weeks
              </div>
              <div style={{ fontSize: 12, color: "#6B6B6B" }}>
                Schedule: {group.meetingSchedule.day} at {group.meetingSchedule.time} {group.meetingSchedule.timezone}
              </div>
              <button onClick={() => handleJoin(group.id)} style={{ ...styles.button, marginTop: 12 }}>
                Join Group
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function CoachDashboard({  }: { onRefresh: () => Promise<void> }) {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientGlucose, setClientGlucose] = useState<GlucoseReading[]>([]);
  const [clientCycle, setClientCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientList = await api.getClients();
        setClients(clientList);
      } catch {}
      setLoading(false);
    };
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      const loadClientData = async () => {
        try {
          const [glucose, cycle] = await Promise.all([
            api.getClientGlucose(selectedClient.id),
            api.getClientCycle(selectedClient.id),
          ]);
          setClientGlucose(glucose);
          setClientCycle(cycle);
        } catch {}
      };
      loadClientData();
    }
  }, [selectedClient]);

  if (loading) return <div>Loading clients...</div>;

  if (!selectedClient) {
    return (
      <>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#2A2D2A", marginBottom: 24 }}>Coach Dashboard</h2>
        <div style={styles.card}>
          <div style={{ fontWeight: 900, color: "#2A2D2A", marginBottom: 16 }}>My Clients</div>
          <ul style={styles.list}>
            {clients.map((client) => (
              <li
                key={client.id}
                style={{ ...styles.listItem, cursor: "pointer" }}
                onClick={() => setSelectedClient(client)}
              >
                <div style={{ fontWeight: 900, color: "#2A2D2A" }}>
                  {client.first_name} {client.last_name}
                </div>
                <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>{client.email}</div>
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  }

  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#2A2D2A", marginBottom: 24 }}>Client Details</h2>
      <div style={styles.card}>
        <button onClick={() => setSelectedClient(null)} style={{ marginBottom: 16, color: "#6B7F6E" }}>
          ← Back to Clients
        </button>
        <div style={{ fontWeight: 900, color: "#2A2D2A", marginBottom: 16 }}>
          {selectedClient.first_name} {selectedClient.last_name}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Recent Glucose</div>
          {clientGlucose.length === 0 ? (
            <div style={{ color: "#6B6B6B" }}>No readings</div>
          ) : (
            <ul style={styles.list}>
              {clientGlucose.slice(0, 5).map((r, idx) => (
                <li key={idx} style={styles.listItem}>
                  {r.value} mg/dL - {new Date(r.measured_at).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Cycle Info</div>
          {clientCycle ? (
            <>
              <div>Day: {clientCycle.current_day}</div>
              <div>Phase: {clientCycle.phase}</div>
            </>
          ) : (
            <div style={{ color: "#6B6B6B" }}>No cycle data</div>
          )}
        </div>
      </div>
    </>
  );
}

function SettingsTab() {
  const { user, logout } = useApp();
  const [cycleTracking, setCycleTracking] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("cycleTracking");
    if (saved) setCycleTracking(JSON.parse(saved));
  }, []);

  const toggleCycle = () => {
    const newValue = !cycleTracking;
    setCycleTracking(newValue);
    localStorage.setItem("cycleTracking", JSON.stringify(newValue));
  };

  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#2A2D2A", marginBottom: 24 }}>Settings</h2>

      <div style={styles.card}>
        <div style={{ fontWeight: 900, color: "#2A2D2A", marginBottom: 16 }}>Account</div>
        <div style={{ marginBottom: 12 }}>Name: {user?.first_name} {user?.last_name}</div>
        <div style={{ marginBottom: 12 }}>Email: {user?.email}</div>
        <div>Role: {user?.role}</div>
      </div>

      <div style={styles.card}>
        <div style={{ fontWeight: 900, color: "#2A2D2A", marginBottom: 16 }}>Preferences</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>Cycle Tracking</div>
          <input type="checkbox" checked={cycleTracking} onChange={toggleCycle} />
        </div>
      </div>

      <button onClick={logout} style={{ ...styles.button, background: "#D14D4D", marginTop: 24 }}>
        Logout
      </button>
    </>
  );
}

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