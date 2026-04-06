// mobile-app/src/screens/ClientDetailScreen.tsx
// Elevated UI — deep forest dark, glassmorphism, botanical luxury
// ALL existing logic/API calls/navigation preserved

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useCoachStore }  from '../stores/coachStore';
import { coachService }   from '../services/coach.service';
import type { GlucoseReading } from '../types/glucose';
import type { Symptom }        from '../types/symptom';

type NavProp    = NativeStackNavigationProp<RootStackParamList>;
type RouteP     = RouteProp<RootStackParamList, 'ClientDetail'>;

// ── Tokens ─────────────────────────────────────────────────────────────────────
const T = {
  bgDeep:        '#0F1C12',
  bgMid:         '#162019',
  glass:         'rgba(255,255,255,0.06)',
  glassMid:      'rgba(255,255,255,0.09)',
  glassStrong:   'rgba(255,255,255,0.13)',
  glassBorder:   'rgba(255,255,255,0.10)',
  glassBorderHi: 'rgba(255,255,255,0.18)',
  sage:          '#7A9B7E',
  sageBright:    '#9ABD9E',
  sageDeep:      '#3D5540',
  sageGlow:      'rgba(122,155,126,0.22)',
  gold:          '#C9A96E',
  goldGlow:      'rgba(201,169,110,0.18)',
  goldBorder:    'rgba(201,169,110,0.25)',
  low:           '#E07070',
  lowGlow:       'rgba(224,112,112,0.15)',
  high:          '#C9A96E',
  ok:            '#7A9B7E',
  textPrimary:   '#F0EDE6',
  textSecondary: 'rgba(240,237,230,0.55)',
  textMuted:     'rgba(240,237,230,0.30)',
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────────
function gColor(v?: number) {
  if (!v) return T.textSecondary;
  if (v < 70)  return T.low;
  if (v > 180) return T.high;
  return T.ok;
}

function fmt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Glass card ─────────────────────────────────────────────────────────────────
function GCard({ children, style, strong }: { children: React.ReactNode; style?: object; strong?: boolean }) {
  return (
    <View style={[{
      backgroundColor: strong ? T.glassMid : T.glass,
      borderRadius: 20, borderWidth: 1,
      borderColor: strong ? T.glassBorderHi : T.glassBorder,
    }, style]}>
      {children}
    </View>
  );
}

// ── Section label ──────────────────────────────────────────────────────────────
function SL({ label }: { label: string }) {
  return <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: T.textMuted, marginBottom: 12 }}>{label}</Text>;
}

// ── Stat tile ──────────────────────────────────────────────────────────────────
function StatTile({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <View style={st.tile}>
      <Text style={[st.val, color ? { color } : {}]}>{value}</Text>
      {unit ? <Text style={st.unit}>{unit}</Text> : null}
      <Text style={st.lbl}>{label}</Text>
    </View>
  );
}
const st = StyleSheet.create({
  tile: {
    flex: 1, backgroundColor: T.glass, borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
    borderWidth: 1, borderColor: T.glassBorder,
  },
  val:  { fontSize: 26, fontWeight: '200', color: T.textPrimary, letterSpacing: -1 },
  unit: { fontSize: 10, color: T.textMuted, marginTop: 2 },
  lbl:  { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: T.textMuted, marginTop: 6, textTransform: 'uppercase' },
});

// ── Glucose row ────────────────────────────────────────────────────────────────
function GRow({ r }: { r: GlucoseReading }) {
  const val = r.glucose_level ?? r.value ?? 0;
  const ts  = r.timestamp ?? r.measured_at ?? r.created_at;
  const col = gColor(val);
  return (
    <View style={gr.row}>
      <View style={[gr.bar, { backgroundColor: col }]} />
      <View style={{ flex: 1 }}>
        <Text style={gr.date}>{fmt(ts)}</Text>
        {r.meal_context ? <Text style={gr.ctx}>{r.meal_context.replace(/_/g, ' ')}</Text> : null}
      </View>
      <Text style={[gr.val, { color: col }]}>{typeof val === 'number' ? val.toFixed(0) : val}</Text>
      <Text style={gr.unit}>mg/dL</Text>
    </View>
  );
}
const gr = StyleSheet.create({
  row:  {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.glass, borderRadius: 14,
    borderWidth: 1, borderColor: T.glassBorder,
    paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 8, gap: 12,
  },
  bar:  { width: 3, height: 34, borderRadius: 2, opacity: 0.85 },
  date: { fontSize: 13, fontWeight: '500', color: T.textPrimary },
  ctx:  { fontSize: 11, color: T.textMuted, marginTop: 2, textTransform: 'capitalize' },
  val:  { fontSize: 22, fontWeight: '200', letterSpacing: -0.5 },
  unit: { fontSize: 10, color: T.textMuted, alignSelf: 'flex-end', marginBottom: 2 },
});

// ── Symptom row ────────────────────────────────────────────────────────────────
function SRow({ sym }: { sym: Symptom }) {
  return (
    <View style={sr.row}>
      <View style={{ flex: 1 }}>
        <Text style={sr.type}>{(sym.symptom_type ?? '').replace(/_/g, ' ')}</Text>
        <Text style={sr.date}>{fmt(sym.logged_at)}</Text>
      </View>
      <View style={sr.dots}>
        {Array.from({ length: 10 }, (_, i) => (
          <View key={i} style={[sr.dot, i < sym.severity && { backgroundColor: T.sage }]} />
        ))}
      </View>
      <Text style={sr.score}>{sym.severity}/10</Text>
    </View>
  );
}
const sr = StyleSheet.create({
  row:   {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.glass, borderRadius: 14,
    borderWidth: 1, borderColor: T.glassBorder,
    paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 8, gap: 12,
  },
  type:  { fontSize: 14, fontWeight: '500', color: T.textPrimary, textTransform: 'capitalize' },
  date:  { fontSize: 11, color: T.textMuted, marginTop: 2 },
  dots:  { flexDirection: 'row', gap: 3 },
  dot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: T.glassBorder },
  score: { fontSize: 13, fontWeight: '500', color: T.textSecondary, width: 34, textAlign: 'right' },
});

// ── Coach insight card ─────────────────────────────────────────────────────────
function InsightCard({ avg, tir, symCount }: { avg?: number; tir?: number; symCount: number }) {
  const insights: { icon: string; text: string; glow?: string }[] = [];

  if (avg && avg < 70) {
    insights.push({ icon: '⚠️', text: 'Average glucose is below range. Review meal timing and portion sizes.', glow: T.lowGlow });
  } else if (avg && avg > 180) {
    insights.push({ icon: '📈', text: 'Elevated average glucose. Consider reviewing carb intake and activity levels.' });
  } else if (avg) {
    insights.push({ icon: '✅', text: 'Glucose average looks healthy. Reinforce current habits with encouragement.' });
  }

  if (tir != null && tir < 50) {
    insights.push({ icon: '🎯', text: `Only ${tir}% time in range. Focus on consistency between meals and sleep quality.` });
  } else if (tir != null && tir >= 70) {
    insights.push({ icon: '🌿', text: `${tir}% time in range — great consistency. Celebrate this with your client.` });
  }

  if (symCount > 3) {
    insights.push({ icon: '🔍', text: `${symCount} symptoms logged recently. Look for patterns around low glucose readings.` });
  }

  if (insights.length === 0) {
    insights.push({ icon: '📊', text: 'Encourage this client to log daily readings to unlock detailed insights.' });
  }

  return (
    <View style={ig.card}>
      <View style={ig.header}>
        <View style={ig.iconWrap}><Text style={{ fontSize: 18 }}>🌿</Text></View>
        <Text style={ig.title}>Coach Insights</Text>
      </View>
      {insights.map((item, i) => (
        <View key={i} style={ig.row}>
          <Text style={ig.icon}>{item.icon}</Text>
          <Text style={ig.text}>{item.text}</Text>
        </View>
      ))}
    </View>
  );
}
const ig = StyleSheet.create({
  card:    {
    backgroundColor: 'rgba(122,155,126,0.08)',
    borderRadius: 18, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(122,155,126,0.20)',
  },
  header:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconWrap:{ width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(122,155,126,0.15)', alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 14, fontWeight: '700', color: T.sageBright, letterSpacing: 0.3 },
  row:     { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  icon:    { fontSize: 15, marginTop: 1 },
  text:    { flex: 1, fontSize: 13, color: T.textSecondary, lineHeight: 20 },
});

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function ClientDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteP>();
  const { clientId } = route.params;

  const { clients, setViewingClient } = useCoachStore();
  const client = clients.find((c) => c.id === clientId);
  const fullName = client ? `${client.firstName} ${client.lastName}`.trim() : 'Client';

  const [readings,   setReadings]   = useState<GlucoseReading[]>([]);
  const [symptoms,   setSymptoms]   = useState<Symptom[]>([]);
  const [stats,      setStats]      = useState<any>(null);
  const [cycleData,  setCycleData]  = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useState(() => new Animated.Value(0))[0];

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [gR, sR, stR, cR] = await Promise.allSettled([
        coachService.getClientGlucose(clientId, 20),
        coachService.getClientSymptoms(clientId, 10),
        coachService.getClientStats(clientId),
        coachService.getClientCycle(clientId),
      ]);
      if (gR.status  === 'fulfilled') setReadings(Array.isArray(gR.value) ? gR.value : []);
      if (sR.status  === 'fulfilled') setSymptoms(Array.isArray(sR.value) ? sR.value : []);
      if (stR.status === 'fulfilled') setStats(stR.value);
      if (cR.status  === 'fulfilled') setCycleData(cR.value);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load client data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [loadData]);

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [loadData]);

  const handleViewAsClient = () => {
    setViewingClient(clientId, fullName);
    navigation.navigate('Dashboard');
  };

  const avg = stats?.avgGlucose ?? stats?.average ?? client?.recentStats?.avgGlucose;
  const tir = stats?.timeInRange ?? stats?.in_range_percentage ?? client?.recentStats?.timeInRange;
  const phase = cycleData?.cycle?.phase ?? cycleData?.phase;

  return (
    <View style={d.root}>
      <LinearGradient
        colors={[T.bgDeep, T.bgMid, '#162819']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
      />

      <SafeAreaView style={d.safe} edges={['top']}>
        {/* Nav */}
        <View style={d.nav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={d.backBtn} activeOpacity={0.75}>
            <Text style={d.backTxt}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={d.iconBtn}
            onPress={() => navigation.navigate('Messaging', { userName: fullName })}
            activeOpacity={0.75}
          >
            <Text style={{ fontSize: 16 }}>✉</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={d.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.sage} />}
        >
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* ── IDENTITY ─────────────────────────────────────────── */}
            <View style={d.identity}>
              <View style={d.bigAvatar}>
                <Text style={d.bigAvatarTxt}>{fullName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={d.clientName}>{fullName}</Text>
                {client?.email ? <Text style={d.clientEmail}>{client.email}</Text> : null}
                {phase ? (
                  <View style={d.phasePill}>
                    <Text style={d.phaseText}>{phase} phase</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* ── VIEW AS CLIENT ───────────────────────────────────── */}
            <TouchableOpacity style={d.viewAsBtn} onPress={handleViewAsClient} activeOpacity={0.87}>
              <LinearGradient
                colors={[T.sageDeep, '#2A4030']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <View style={[{ position: 'absolute', right: -40, top: -40, width: 150, height: 150,
                borderRadius: 75, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }]} />
              <View style={d.viewAsInner}>
                <Text style={{ fontSize: 22 }}>👁</Text>
                <View>
                  <Text style={d.viewAsTitle}>View as Client</Text>
                  <Text style={d.viewAsSub}>See their exact dashboard experience</Text>
                </View>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 20 }}>→</Text>
            </TouchableOpacity>

            {loading ? (
              <View style={d.loadWrap}>
                <ActivityIndicator color={T.sage} size="large" />
                <Text style={d.loadTxt}>Loading client data…</Text>
              </View>
            ) : (
              <>
                {error ? (
                  <View style={d.errorCard}>
                    <Text style={d.errorTxt}>⚠️  {error}</Text>
                    <TouchableOpacity onPress={loadData} style={d.retryBtn}>
                      <Text style={d.retryTxt}>Try again</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* ── STATS ──────────────────────────────────────── */}
                <View style={d.section}>
                  <View style={d.statsRow}>
                    <StatTile
                      label="Avg Glucose"
                      value={avg != null ? Math.round(avg) : '—'}
                      unit={avg != null ? 'mg/dL' : undefined}
                      color={avg != null ? gColor(avg) : undefined}
                    />
                    <StatTile label="In Range"  value={tir != null ? `${Math.round(tir)}%` : '—'} />
                    <StatTile label="Readings"  value={readings.length} />
                  </View>
                </View>

                {/* ── INSIGHTS ───────────────────────────────────── */}
                <View style={d.section}>
                  <SL label="GUIDANCE" />
                  <InsightCard avg={avg} tir={tir} symCount={symptoms.length} />
                </View>

                {/* ── GLUCOSE ────────────────────────────────────── */}
                <View style={d.section}>
                  <SL label="RECENT GLUCOSE" />
                  {readings.length === 0 ? (
                    <GCard style={d.emptyRow}>
                      <Text style={d.emptyTxt}>No glucose readings yet</Text>
                    </GCard>
                  ) : (
                    readings.slice(0, 8).map((r) => <GRow key={r.id} r={r} />)
                  )}
                </View>

                {/* ── SYMPTOMS ───────────────────────────────────── */}
                <View style={d.section}>
                  <SL label="RECENT SYMPTOMS" />
                  {symptoms.length === 0 ? (
                    <GCard style={d.emptyRow}>
                      <Text style={d.emptyTxt}>No symptoms logged</Text>
                    </GCard>
                  ) : (
                    symptoms.slice(0, 5).map((s) => <SRow key={s.id} sym={s} />)
                  )}
                </View>

                {/* ── CYCLE ──────────────────────────────────────── */}
                {cycleData && (
                  <View style={d.section}>
                    <SL label="CYCLE" />
                    <GCard strong style={d.cycleCard}>
                      <Text style={{ fontSize: 26 }}>🌿</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={d.cyclePhaseTxt}>
                          {phase ? `${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase` : 'Active cycle'}
                        </Text>
                        {cycleData?.cycle?.current_day ? (
                          <Text style={d.cycleDayTxt}>Day {cycleData.cycle.current_day}</Text>
                        ) : null}
                      </View>
                    </GCard>
                  </View>
                )}
              </>
            )}

            <View style={{ height: 48 }} />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const d = StyleSheet.create({
  root:    { flex: 1 },
  safe:    { flex: 1 },
  content: { paddingHorizontal: 22 },

  nav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 12, paddingBottom: 8,
  },
  backBtn: { paddingVertical: 8, paddingRight: 16 },
  backTxt: { fontSize: 15, fontWeight: '500', color: T.textSecondary },
  iconBtn: {
    width: 40, height: 40, borderRadius: 11,
    backgroundColor: T.glass, borderWidth: 1, borderColor: T.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },

  identity: {
    flexDirection: 'row', alignItems: 'center',
    gap: 16, paddingTop: 8, paddingBottom: 24,
  },
  bigAvatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(122,155,126,0.25)',
    borderWidth: 1, borderColor: 'rgba(122,155,126,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  bigAvatarTxt: { fontSize: 24, fontWeight: '600', color: T.sageBright },
  clientName:   { fontSize: 21, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.4 },
  clientEmail:  { fontSize: 13, color: T.textMuted, marginTop: 2 },
  phasePill: {
    alignSelf: 'flex-start', marginTop: 6,
    backgroundColor: 'rgba(122,155,126,0.12)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(122,155,126,0.22)',
  },
  phaseText: { fontSize: 11, fontWeight: '600', color: T.sage, textTransform: 'capitalize' },

  viewAsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 20, paddingVertical: 20, paddingHorizontal: 20,
    marginBottom: 28, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(122,155,126,0.28)',
    shadowColor: T.sageDeep, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30, shadowRadius: 20, elevation: 6,
  },
  viewAsInner: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  viewAsTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', letterSpacing: 0.1 },
  viewAsSub:   { fontSize: 12, color: 'rgba(255,255,255,0.50)', marginTop: 2 },

  section:   { marginBottom: 28 },
  statsRow:  { flexDirection: 'row', gap: 10 },

  loadWrap:  { paddingVertical: 52, alignItems: 'center', gap: 14 },
  loadTxt:   { fontSize: 14, color: T.textMuted },

  errorCard: {
    backgroundColor: 'rgba(224,112,112,0.08)', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(224,112,112,0.18)', marginBottom: 20, gap: 10,
  },
  errorTxt:  { fontSize: 13, color: T.low, lineHeight: 19 },
  retryBtn:  {
    alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 14,
    backgroundColor: 'rgba(224,112,112,0.10)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(224,112,112,0.22)',
  },
  retryTxt:  { fontSize: 13, fontWeight: '600', color: T.low },

  emptyRow:  { padding: 20, alignItems: 'center' },
  emptyTxt:  { fontSize: 13, color: T.textMuted, fontStyle: 'italic' },

  cycleCard:     { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  cyclePhaseTxt: { fontSize: 15, fontWeight: '600', color: T.textPrimary },
  cycleDayTxt:   { fontSize: 12, color: T.textMuted, marginTop: 2 },
});