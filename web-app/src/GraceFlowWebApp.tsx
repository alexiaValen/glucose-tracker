// GraceFlowWebApp.tsx - Complete Single-File Web Application
// This file contains everything needed to run GraceFlow in the browser
// Users can login, signup, log glucose, log symptoms - just like the mobile app

import React, { useEffect, useState, createContext, useContext } from "react";
import { GroupList } from "./groups/GroupList";
import { GroupChat } from "./groups/GroupChat";


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
const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3000/api/v1";

console.log("🌐 API URL:", API_URL);

console.log('ðŸŒ API URL:', API_URL);

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
    console.log('âœ… Login successful');
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

  async getGlucoseReadings(): Promise<GlucoseReading[]> {
    try {
      const res = await fetch(`${API_URL}/glucose`, { headers: this.getHeaders() });
      
      if (!res.ok) {
        console.error('Failed to fetch glucose readings:', res.status);
        return [];
      }

      const data = await res.json();
      return Array.isArray(data) ? data : data.readings || [];
    } catch (error) {
      console.error('Error fetching glucose readings:', error);
      return [];
    }
  }

  async createGlucoseReading(reading: { value: number; measured_at: string; notes?: string }): Promise<GlucoseReading> {
    const res = await fetch(`${API_URL}/glucose`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        value: reading.value,
        measuredAt: reading.measured_at,  // Backend expects camelCase
        unit: "mg/dL",
        source: "manual",
        notes: reading.notes,
      }),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(`Failed to create reading (${res.status}): ${msg}`);
    }

    return res.json();
  }

  async getSymptoms(): Promise<Symptom[]> {
    try {
      const res = await fetch(`${API_URL}/symptoms`, { headers: this.getHeaders() });
      
      if (!res.ok) {
        console.error('Failed to fetch symptoms:', res.status);
        return [];
      }

      const data = await res.json();
      return Array.isArray(data) ? data : data.symptoms || [];
    } catch (error) {
      console.error('Error fetching symptoms:', error);
      return [];
    }
  }

  async createSymptom(symptom: Omit<Symptom, "id" | "created_at" | "logged_at">): Promise<Symptom> {
    const res = await fetch(`${API_URL}/symptoms`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        symptomType: symptom.symptom_type,  // Backend expects camelCase
        severity: symptom.severity,
        notes: symptom.notes,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(`Failed to create symptom (${res.status}): ${JSON.stringify(data)}`);
    }

    const item =
      (data && typeof data === "object" && !Array.isArray(data) ? data : null) ??
      data?.data ??
      data?.symptom ??
      data?.result ??
      null;

    if (!item) throw new Error("Create symptom: unexpected response shape");
    return item as Symptom;
  }

  async getCurrentCycle(): Promise<Cycle | null> {
    try {
      const res = await fetch(`${API_URL}/cycle/current`, { headers: this.getHeaders() });

      if (res.status === 404) {
        console.log('No current cycle found');
        return null;
      }

      if (!res.ok) {
        console.error('Failed to fetch current cycle:', res.status);
        return null;
      }

      const data = await res.json();
      const cycle = data?.cycle ?? data;
      
      if (!cycle || cycle === null) return null;
      
      return cycle as Cycle;
    } catch (error) {
      console.error('Error fetching current cycle:', error);
      return null;
    }
  }

  async createCycle(startDate: string): Promise<Cycle> {
    const res = await fetch(`${API_URL}/cycle`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ start_date: startDate }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(`Failed to create cycle (${res.status}): ${JSON.stringify(data)}`);
    }

    return data as Cycle;
  }

  logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}

const api = new ApiService();

// ==================== STATE ====================
interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  readings: GlucoseReading[];
  symptoms: Symptom[];
  currentCycle: Cycle | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loadData: () => Promise<void>;
  addGlucoseReading: (reading: Omit<GlucoseReading, "id" | "created_at">) => Promise<void>;
  addSymptom: (symptom: Omit<Symptom, "id" | "created_at">) => Promise<void>;
  startCycle: (startDate: string) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [currentCycle, setCurrentCycle] = useState<Cycle | null>(null);

  const login = async (email: string, password: string) => {
    const u = await api.login(email, password);
    setUser(u);
  };

  const register = async (userData: any) => {
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

  const loadData = async () => {
    try {
      console.log('ðŸ“Š Loading user data...');
      
      const [glucoseResult, symptomsResult, cycleResult] = await Promise.allSettled([
        api.getGlucoseReadings(),
        api.getSymptoms(),
        api.getCurrentCycle(),
      ]);

      if (glucoseResult.status === 'fulfilled') {
        setReadings(glucoseResult.value);
        console.log('âœ… Loaded', glucoseResult.value.length, 'glucose readings');
      } else {
        console.error('âŒ Failed to load glucose readings:', glucoseResult.reason);
        setReadings([]);
      }

      if (symptomsResult.status === 'fulfilled') {
        setSymptoms(symptomsResult.value);
        console.log('âœ… Loaded', symptomsResult.value.length, 'symptoms');
      } else {
        console.error('âŒ Failed to load symptoms:', symptomsResult.reason);
        setSymptoms([]);
      }

      if (cycleResult.status === 'fulfilled') {
        setCurrentCycle(cycleResult.value);
        console.log('âœ… Loaded current cycle:', cycleResult.value ? 'Yes' : 'No');
      } else {
        console.error('âŒ Failed to load cycle:', cycleResult.reason);
        setCurrentCycle(null);
      }

      console.log('âœ… Data loading complete');
    } catch (e) {
      console.error("Failed to load data:", e);
    }
  };

  const addGlucoseReading = async (reading: { value: number; measured_at: string; notes?: string }) => {
    const newReading = await api.createGlucoseReading(reading);
    setReadings((prev) => [newReading, ...prev]);
  };

  const addSymptom = async (symptom: Omit<Symptom, "id" | "created_at">) => {
    const newSymptom = await api.createSymptom(symptom);
    setSymptoms((prev) => [newSymptom, ...prev]);
  };

  const startCycle = async (startDate: string) => {
    const cycle = await api.createCycle(startDate);
    setCurrentCycle(cycle);
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const value: AppState = {
    user,
    isAuthenticated: !!user,
    readings,
    symptoms,
    currentCycle,
    login,
    register,
    logout,
    loadData,
    addGlucoseReading,
    addSymptom,
    startCycle,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ==================== STYLES ====================
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #F5F4F0 0%, #E8EDE9 100%)',
    backgroundAttachment: 'fixed',
  },
  authContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  authCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '26px',
    border: '1px solid rgba(212,214,212,0.7)',
    padding: '32px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 10px 40px rgba(42,45,42,0.12)',
  },
  authHeader: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  authTitle: {
    fontSize: '42px',
    fontWeight: '800',
    color: '#2A2D2A',
    letterSpacing: '-0.3px',
    marginBottom: '8px',
  },
  authSubtitle: {
    fontSize: '15px',
    color: '#6B6B6B',
    lineHeight: '20px',
  },
  formGroup: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '800',
    color: '#2A2D2A',
    marginBottom: '8px',
    letterSpacing: '0.2px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '1px solid rgba(212,214,212,0.9)',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.98)',
    color: '#2A2D2A',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  button: {
    width: '100%',
    height: '56px',
    borderRadius: '20px',
    border: 'none',
    background: 'linear-gradient(135deg, #6B7F6E 0%, #3D5540 100%)',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: '700',
    letterSpacing: '0.2px',
    cursor: 'pointer',
    boxShadow: '0 10px 24px rgba(107,127,110,0.25)',
    transition: 'transform 0.2s',
  } as React.CSSProperties,
  buttonSecondary: {
    background: 'rgba(255,255,255,0.98)',
    border: '1.5px solid rgba(107,127,110,0.25)',
    color: '#6B7F6E',
    boxShadow: '0 4px 12px rgba(42,45,42,0.06)',
  } as React.CSSProperties,
  dashboard: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  header: {
    padding: '32px 0',
    textAlign: 'center' as const,
  },
  greeting: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#2A2D2A',
    marginBottom: '8px',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '24px',
    border: '1px solid rgba(212,214,212,0.4)',
    padding: '24px',
    marginBottom: '16px',
    boxShadow: '0 8px 16px rgba(42,45,42,0.08)',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2A2D2A',
    marginBottom: '16px',
  },
  stat: {
    textAlign: 'center' as const,
    padding: '16px',
  },
  statValue: {
    fontSize: '48px',
    fontWeight: '300',
    color: '#2A2D2A',
    letterSpacing: '-1px',
  },
  statLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6B6B6B',
    marginTop: '8px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid rgba(212,214,212,0.3)',
  } as React.CSSProperties,
  nav: {
    display: 'flex',
    gap: '12px',
    padding: '16px 24px',
    background: 'rgba(255,255,255,0.9)',
    borderBottom: '1px solid rgba(212,214,212,0.4)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  navButton: {
    padding: '10px 20px',
    borderRadius: '16px',
    border: 'none',
    background: 'transparent',
    color: '#6B7F6E',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  navButtonActive: {
    background: 'rgba(107,127,110,0.12)',
  } as React.CSSProperties,
};

// ==================== COMPONENTS ====================

function LoginScreen({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.authContainer}>
      <div style={styles.authCard}>
        <div style={styles.authHeader}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px', opacity: 0.9 }}>
              <div style={{ width: '56px', height: '1px', background: 'rgba(42,45,42,0.18)' }} />
              <span style={{ fontSize: '16px' }}>ðŸŒ¿</span>
              <div style={{ width: '56px', height: '1px', background: 'rgba(42,45,42,0.18)' }} />
            </div>
          </div>
          <h1 style={styles.authTitle}>GraceFlow</h1>
          <p style={styles.authSubtitle}>Track your glucose & cycle with grace</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: '12px', background: 'rgba(200,90,84,0.1)', border: '1px solid rgba(200,90,84,0.3)', borderRadius: '12px', marginBottom: '16px', color: '#C85A54', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(212,214,212,0.55)', textAlign: 'center' }}>
            <button
              type="button"
              onClick={onSwitchToRegister}
              style={{ background: 'none', border: 'none', color: '#6B7F6E', fontSize: '15px', fontWeight: '600', cursor: 'pointer', padding: '8px' }}
              disabled={loading}
            >
              Don't have an account? <span style={{ fontWeight: '800' }}>Sign Up</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RegisterScreen({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { register } = useApp();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    role: 'user' as 'user' | 'coach',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { confirmPassword, ...userData } = formData;
      await register({
        ...userData,
        email: userData.email.trim().toLowerCase(),
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={styles.authContainer}>
      <div style={{ ...styles.authCard, maxWidth: '500px' }}>
        <div style={styles.authHeader}>
          <h1 style={{ ...styles.authTitle, fontSize: '32px' }}>Create Account</h1>
          <p style={styles.authSubtitle}>Join GraceFlow to start tracking your wellness</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: '12px', background: 'rgba(200,90,84,0.1)', border: '1px solid rgba(200,90,84,0.3)', borderRadius: '12px', marginBottom: '16px', color: '#C85A54', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
            <div>
              <label style={styles.label}>First Name *</label>
              <input
                type="text"
                style={styles.input}
                value={formData.first_name}
                onChange={(e) => updateField('first_name', e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label style={styles.label}>Last Name *</label>
              <input
                type="text"
                style={styles.input}
                value={formData.last_name}
                onChange={(e) => updateField('last_name', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email *</label>
            <input
              type="email"
              style={styles.input}
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Phone</label>
            <input
              type="tel"
              style={styles.input}
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Date of Birth</label>
            <input
              type="date"
              style={styles.input}
              value={formData.date_of_birth}
              onChange={(e) => updateField('date_of_birth', e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password *</label>
            <input
              type="password"
              style={styles.input}
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password *</label>
            <input
              type="password"
              style={styles.input}
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(212,214,212,0.55)', textAlign: 'center' }}>
            <button
              type="button"
              onClick={onSwitchToLogin}
              style={{ background: 'none', border: 'none', color: '#6B7F6E', fontSize: '15px', fontWeight: '600', cursor: 'pointer', padding: '8px' }}
              disabled={loading}
            >
              Already have an account? <span style={{ fontWeight: '800' }}>Login</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, readings, symptoms, currentCycle, logout } = useApp();
  const [view, setView] =
  useState<'dashboard' | 'glucose' | 'symptoms' | 'cycle' | 'chat'>('dashboard');
  const [groups, setGroups] = useState<any[]>([]);
const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
const [loadingGroups, setLoadingGroups] = useState(false);

const loadUserGroups = async () => {
  setLoadingGroups(true);
  try {
    const token = localStorage.getItem("accessToken");
    const res = await fetch(`${API_URL}/groups/my-groups`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await res.json();
    setGroups(data.groups || []);
  } catch (e) {
    console.error("Failed to load user groups", e);
  } finally {
    setLoadingGroups(false);
  }
};

useEffect(() => {
  loadUserGroups();
}, []);

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', padding: 24, background: '#F5F4F0' }}>
        Loading...
      </div>
    );
  }

  // Coach sees a different dashboard
  if (user.role === 'coach') {
    return <CoachDashboard />;
  }

  // const avgGlucose = readings.length > 0
  //   ? Math.round(readings.reduce((sum, r) => sum + r.value, 0) / readings.length)
  //   : 0;

  const avgGlucose = readings.length > 0
  ? Math.round(
      readings.reduce((sum, r) => sum + Number(r.value || 0), 0) 
      / readings.length
    )
  : 0;
  
  const todayReadings = readings.filter(r => {
    const date = new Date(r.measured_at);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  });

  const todaySymptoms = symptoms.filter(s => {
    const dateStr = s.created_at || s.logged_at;
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  });


  const cycleDay = currentCycle
    ? Math.floor((Date.now() - new Date(currentCycle.cycle_start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <button
          style={{ ...styles.navButton, ...(view === 'dashboard' ? styles.navButtonActive : {}) }}
          onClick={() => setView('dashboard')}
        >
          Dashboard
        </button>
        <button
          style={{ ...styles.navButton, ...(view === 'glucose' ? styles.navButtonActive : {}) }}
          onClick={() => setView('glucose')}
        >
          Glucose
        </button>
        <button
          style={{ ...styles.navButton, ...(view === 'symptoms' ? styles.navButtonActive : {}) }}
          onClick={() => setView('symptoms')}
        >
          Symptoms
        </button>
        <button
          style={{ ...styles.navButton, ...(view === 'cycle' ? styles.navButtonActive : {}) }}
          onClick={() => setView('cycle')}
        >
          Cycle
        </button>
        <div style={{ marginLeft: 'auto' }}>

          <button
  style={{ ...styles.navButton, ...(view === 'chat' ? styles.navButtonActive : {}) }}
  onClick={() => setView('chat')}
>
  Chat
</button>

          <button
            style={{ ...styles.navButton, color: '#C85A54' }}
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </nav>

      <div style={styles.dashboard}>
        {view === 'chat' && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "320px 1fr",
      gap: 18,
    }}
  >
    {/* Group list */}
    <div style={styles.card}>
      <strong>My Groups</strong>

      <GroupList
        groups={groups}
        loading={loadingGroups}
        onSelect={setSelectedGroup}
      />
    </div>

    {/* Chat panel */}
    <div style={styles.card}>
      {selectedGroup ? (
        <GroupChat group={selectedGroup} />
      ) : (
        <div style={{ textAlign: "center", padding: 40 }}>
          <strong>Select a group to chat</strong>
        </div>
      )}
    </div>
  </div>
)}
        {view === 'dashboard' && 
        <DashboardView 
        user={user} 
        avgGlucose={avgGlucose} todayReadings={todayReadings} todaySymptoms={todaySymptoms} cycleDay={cycleDay}
        currentCycle={currentCycle}

         />}
        {view === 'glucose' && <GlucoseView />}
        {view === 'symptoms' && <SymptomsView />}
        {view === 'cycle' && <CycleView />}
        
      </div>
    </div>
  );
}

const RHYTHMS = {
  menstrual: {
    name: "Reawaken",
    emoji: "🌱",
    scripture: "Isaiah 43:19",
    verse: "I am about to do a new thing...",
    practice: "Surrender. Rest. Make space for what God is preparing.",
  },
  follicular: {
    name: "Renew",
    emoji: "🍃",
    scripture: "Proverbs 16:3",
    verse: "Commit your work to the Lord...",
    practice: "Set intentions. Partner with God in fresh beginnings.",
  },
  ovulatory: {
    name: "Radiant",
    emoji: "🌞",
    scripture: "Psalm 34:5",
    verse: "Those who look to Him will be radiant...",
    practice: "Shine. Encourage others. Bless from abundance.",
  },
  luteal: {
    name: "Rooted",
    emoji: "🌾",
    scripture: "Psalm 46:10",
    verse: "Be still and know that I am God.",
    practice: "Simplify. Create boundaries. Prioritize stillness.",
  },
} as const;

function DashboardView({
  user,
  avgGlucose,
  todayReadings,
  todaySymptoms,
  cycleDay,
  currentCycle,

}: any) {
  // If no cycle or phase yet, default to menstrual
  const phaseKey = (currentCycle?.phase as keyof typeof RHYTHMS) || "menstrual";

// const rhythm = phaseKey
//   ? RHYTHMS[phaseKey as keyof typeof RHYTHMS] || null
//   : null;

const rhythm = RHYTHMS[phaseKey];

  return (
    <>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.greeting}>Welcome back, {user.first_name}!</h1>
        <p style={{ color: "#6B6B6B", fontSize: "15px" }}>
          {currentCycle
            ? `Day ${cycleDay} · ${rhythm.name} phase`
            : "Test mode · Spiritual rhythm preview"}
        </p>
      </div>

      {/* STATS GRID */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.stat}>
            <div style={styles.statValue}>
              {avgGlucose || "—"}
            </div>
            <div style={styles.statLabel}>
              Average Glucose (mg/dL)
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.stat}>
            <div style={styles.statValue}>
              {todayReadings.length}
            </div>
            <div style={styles.statLabel}>
              Readings Today
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.stat}>
            <div style={styles.statValue}>
              {todaySymptoms.length}
            </div>
            <div style={styles.statLabel}>
              Symptoms Today
            </div>
          </div>
        </div>
      </div>

      {/* 🌿 Rhythm Card */}
      <div style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 36 }}>{rhythm.emoji}</div>
          <h2 style={{ margin: "8px 0" }}>{rhythm.name}</h2>
          <p style={{ color: "#6B6B6B", fontSize: 14 }}>
            {rhythm.scripture}
          </p>
        </div>

        <p style={{ fontStyle: "italic", marginBottom: 12 }}>
          “{rhythm.verse}”
        </p>

        <div
          style={{
            padding: "12px 16px",
            borderRadius: 14,
            background: "rgba(107,127,110,0.08)",
            fontSize: 14,
          }}
        >
          <strong>Practice:</strong> {rhythm.practice}
        </div>
      </div>
      

      {todayReadings.length === 0 && todaySymptoms.length === 0 && (
        <div
          style={{
            ...styles.card,
            textAlign: "center",
            padding: "48px 24px",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>
            🌱
          </div>
          <h3
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#2A2D2A",
              marginBottom: "12px",
            }}
          >
            Your wellness journey begins
          </h3>
          <p
            style={{
              color: "#6B6B6B",
              fontSize: "15px",
              lineHeight: "22px",
              maxWidth: "400px",
              margin: "0 auto",
            }}
          >
            Start by logging your first glucose reading or symptom to
            see patterns emerge.
          </p>
        </div>
      )}
    </>
  );
}



function GlucoseView() {
  const { readings, addGlucoseReading } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [glucoseValue, setGlucoseValue] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!glucoseValue) return;

    setLoading(true);
    try {
      await addGlucoseReading({
        value: parseFloat(glucoseValue),
        measured_at: new Date().toISOString(),
        notes: notes || undefined,
      });
      setGlucoseValue('');
      setNotes('');
      setShowForm(false);
    } catch (error) {
      alert('Failed to add reading');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#2A2D2A' }}>Glucose Readings</h2>
        <button
          style={{ ...styles.button, width: 'auto', padding: '0 24px', height: '48px' }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Reading'}
        </button>
      </div>

      {showForm && (
        <div style={{ ...styles.card, marginBottom: '24px' }}>
          <h3 style={styles.cardTitle}>New Glucose Reading</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Glucose Value (mg/dL) *</label>
              <input
                type="number"
                style={styles.input}
                value={glucoseValue}
                onChange={(e) => setGlucoseValue(e.target.value)}
                placeholder="e.g., 95"
                required
                disabled={loading}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Notes (optional)</label>
              <textarea
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' as const }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this reading..."
                disabled={loading}
              />
            </div>
            <button type="submit" style={{ ...styles.button, opacity: loading ? 0.6 : 1 }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Reading'}
            </button>
          </form>
        </div>
      )}

      <div style={styles.card}>
        {readings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#6B6B6B' }}>
            <p>No readings yet. Add your first reading to get started!</p>
          </div>
        ) : (
          <ul style={styles.list}>
            {readings.slice(0, 20).map((reading, idx) => (
              <li key={reading.id || idx} style={styles.listItem}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#2A2D2A' }}>
                    {reading.value} {reading.unit || 'mg/dL'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B6B6B', marginTop: '4px' }}>
                    {new Date(reading.measured_at || reading.created_at || '').toLocaleString()}
                  </div>
                  {reading.notes && (
                    <div style={{ fontSize: '14px', color: '#4A4D4A', marginTop: '8px' }}>
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

function SymptomsView() {
  const { symptoms, addSymptom } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [symptomType, setSymptomType] = useState('');
  const [severity, setSeverity] = useState('5');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomType) return;

    setLoading(true);
    try {
      await addSymptom({
        symptom_type: symptomType,
        severity: parseInt(severity),
        notes: notes || undefined,
      });
      setSymptomType('');
      setSeverity('5');
      setNotes('');
      setShowForm(false);
    } catch (error) {
      alert('Failed to add symptom');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#2A2D2A' }}>Symptoms</h2>
        <button
          style={{ ...styles.button, width: 'auto', padding: '0 24px', height: '48px' }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Log Symptom'}
        </button>
      </div>

      {showForm && (
        <div style={{ ...styles.card, marginBottom: '24px' }}>
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
                style={{ width: '100%' }}
                disabled={loading}
              />
              <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '24px', fontWeight: '700', color: '#6B7F6E' }}>
                {severity}
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Notes (optional)</label>
              <textarea
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' as const }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details..."
                disabled={loading}
              />
            </div>
            <button type="submit" style={{ ...styles.button, opacity: loading ? 0.6 : 1 }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Symptom'}
            </button>
          </form>
        </div>
      )}

      <div style={styles.card}>
        {symptoms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#6B6B6B' }}>
            <p>No symptoms logged yet. Start tracking to see patterns!</p>
          </div>
        ) : (
          <ul style={styles.list}>
            {symptoms.slice(0, 20).map((symptom, idx) => (
              <li key={symptom.id || idx} style={styles.listItem}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#2A2D2A' }}>
                    {symptom.symptom_type}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B6B6B', marginTop: '4px' }}>
                    {new Date(symptom.created_at || symptom.logged_at || '').toLocaleString()}
                  </div>
                  {symptom.notes && (
                    <div style={{ fontSize: '14px', color: '#4A4D4A', marginTop: '8px' }}>
                      {symptom.notes}
                    </div>
                  )}
                </div>
                <div style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: 'rgba(107,127,110,0.12)',
                  color: '#6B7F6E',
                  fontWeight: '700',
                  fontSize: '16px'
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

function CycleView() {
  const { currentCycle, startCycle } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await startCycle(startDate);
      setShowForm(false);
    } catch (error) {
      alert('Failed to start cycle');
    } finally {
      setLoading(false);
    }
  };

  const cycleDay = currentCycle
    ? Math.floor((Date.now() - new Date(currentCycle.cycle_start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#2A2D2A' }}>Cycle Tracking</h2>
        {!currentCycle && (
          <button
            style={{ ...styles.button, width: 'auto', padding: '0 24px', height: '48px' }}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Start Cycle'}
          </button>
        )}
      </div>

      {showForm && !currentCycle && (
        <div style={{ ...styles.card, marginBottom: '24px' }}>
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
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <button type="submit" style={{ ...styles.button, opacity: loading ? 0.6 : 1 }} disabled={loading}>
              {loading ? 'Starting...' : 'Start Cycle'}
            </button>
          </form>
        </div>
      )}

      <div style={styles.card}>
        {!currentCycle ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>ðŸŒ¸</div>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#2A2D2A', marginBottom: '12px' }}>
              Track your natural rhythm
            </h3>
            <p style={{ color: '#6B6B6B', fontSize: '15px', lineHeight: '22px', maxWidth: '400px', margin: '0 auto' }}>
              Start logging your cycle to see how hormones affect your wellness.
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <div style={styles.stat}>
              <div style={styles.statValue}>{cycleDay}</div>
              <div style={styles.statLabel}>Day of Cycle</div>
            </div>
            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(107,127,110,0.08)', borderRadius: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#6B7F6E', marginBottom: '4px' }}>
                {currentCycle.phase || 'Tracking'}
              </div>
              <div style={{ fontSize: '13px', color: '#6B6B6B' }}>
                Started {new Date(currentCycle.cycle_start_date).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function CoachDashboard() {
  const { user, logout } = useApp();

  // Single source of truth (includes /api/v1)
  const API_URL =
    (import.meta as any).env.VITE_API_URL ||
    "http://localhost:3000/api/v1";

  const token = localStorage.getItem("accessToken");

  // ───────── STATE ─────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  const [clientReadings, setClientReadings] = useState<any[]>([]);
  const [clientSymptoms, setClientSymptoms] = useState<any[]>([]);
  const [clientCycle, setClientCycle] = useState<any | null>(null);

  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Debug helper
  useEffect(() => {
    console.log("🟣 selectedGroup changed:", selectedGroup);
  }, [selectedGroup]);

  // ───────── API HELPER ─────────
  const fetchJSON = async (path: string) => {
    const res = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`
      );
    }

    return res.json();
  };

  // ───────── LOAD CLIENTS ─────────
  const loadClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJSON("/coach/clients");
      setClients(Array.isArray(data) ? data : data.clients || []);
    } catch (e: any) {
      setError(e.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  // ───────── LOAD CLIENT DETAILS ─────────
  const loadClientDetails = async (clientId: string) => {
    setLoading(true);
    setError(null);

    try {
      const [glucoseRes, symptomsRes, cycleRes] = await Promise.all([
        fetchJSON(`/coach/clients/${clientId}/glucose`),
        fetchJSON(`/coach/clients/${clientId}/symptoms`),
        fetchJSON(`/coach/clients/${clientId}/cycle`),
      ]);

      setClientReadings(glucoseRes.readings || []);
      setClientSymptoms(symptomsRes.symptoms || []);
      setClientCycle(cycleRes.cycle || null);
    } catch (e: any) {
      setError(e.message || "Failed to load client data");
    } finally {
      setLoading(false);
    }
  };

  // ───────── LOAD GROUPS ─────────
  const loadGroups = async () => {
    setLoadingGroups(true);
    try {
      const data = await fetchJSON("/groups/coach/my-groups");
      setGroups(data.groups || []);
    } catch (e: any) {
      setError(e.message || "Failed to load groups");
    } finally {
      setLoadingGroups(false);
    }
  };

  // ───────── INITIAL LOAD ─────────
  useEffect(() => {
    loadClients();
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───────── UI ─────────
  return (
    <div style={styles.container}>
      {/* NAV */}
      <nav style={styles.nav}>
        <button style={{ ...styles.navButton, ...styles.navButtonActive }}>
          Dashboard
        </button>

        <div style={{ marginLeft: "auto" }}>
          <button
            style={{ ...styles.navButton, color: "#C85A54" }}
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </nav>

      <div style={styles.dashboard}>
        {/* HEADER */}
        <div style={styles.header}>
          <h3>COACH DASHBOARD LIVE ✅</h3>
          <h1>Welcome, Coach {user?.first_name || "Coach"}!</h1>
          <p style={{ color: "#6B6B6B" }}>
            Clients · Groups · Coaching insights
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div
            style={{
              ...styles.card,
              border: "1px solid rgba(200,90,84,0.35)",
            }}
          >
            <strong style={{ color: "#C85A54" }}>
              Something went wrong
            </strong>
            <div style={{ marginTop: 6 }}>{error}</div>
            <button
              style={{ ...styles.button, marginTop: 12 }}
              onClick={loadClients}
            >
              Retry
            </button>
          </div>
        )}

        {/* MAIN GRID */}
        {/* MAIN GRID */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: "320px 320px 1fr",
    gap: 18,
  }}
>
  {/* CLIENTS */}
  <div style={styles.card}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 8,
      }}
    >
      <strong>Clients</strong>
      <button onClick={loadClients}>Refresh</button>
    </div>

    {loading && clients.length === 0 ? (
      <div>Loading clients…</div>
    ) : clients.length === 0 ? (
      <div>No clients yet.</div>
    ) : (
      <ul style={{ listStyle: "none", padding: 0 }}>
        {clients.map((c) => (
          <li key={c.id} style={{ marginBottom: 6 }}>
            <button
              style={{ width: "100%" }}
              onClick={() => {
                setSelectedGroup(null);
                setSelectedClient(c);
                loadClientDetails(String(c.id));
              }}
            >
              {c.first_name} {c.last_name}
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>

  {/* GROUPS */}
  <div style={styles.card}>
    <strong style={{ display: "block", marginBottom: 8 }}>
      Groups
    </strong>

    <GroupList
      groups={groups}
      loading={loadingGroups}
      onSelect={(group) => {
        setSelectedClient(null);
        setSelectedGroup(group);
      }}
    />
  </div>

  {/* DETAIL PANEL */}
  <div style={styles.card}>
    {selectedClient && !selectedGroup && (
      <>
        <h2>
          {selectedClient.first_name} {selectedClient.last_name}
        </h2>
        <p>Latest glucose: {clientReadings[0]?.value ?? "—"}</p>
        <p>Symptoms logged: {clientSymptoms.length}</p>
        <p>Cycle phase: {clientCycle?.phase ?? "—"}</p>
      </>
    )}

    {selectedGroup && <GroupChat group={selectedGroup} />}

    {!selectedClient && !selectedGroup && (
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 32 }}>🌿</div>
        <strong>Select a client or group</strong>
        <p style={{ color: "#6B6B6B", marginTop: 6 }}>
          View client trends or coach your group.
        </p>
      </div>
    )}

  </div>
</div>
      </div>
    </div>
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