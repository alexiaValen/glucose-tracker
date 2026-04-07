// mobile-app/src/screens/ClientDetailScreen.tsx
// REFACTORED: Matches dashboard design system — cream/sage/forest palette.
// "View as Client" removed per request.
// ALL data loading, API calls, navigation preserved exactly.

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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useCoachStore }  from '../stores/coachStore';
import { coachService }   from '../services/coach.service';
import type { GlucoseReading } from '../types/glucose';
import type { Symptom }        from '../types/symptom';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteP  = RouteProp<RootStackParamList, 'ClientDetail'>;

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS — exact match to DashboardScreen
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  pageBg:       '#F0EBE0',
  cardCream:    '#F8F4EC',
  cardSage:     '#E2E8DF',
  cardForest:   '#2C4435',
  cardTan:      '#DDD3C0',
  cardOffWhite: '#EDE8DF',

  inkDark:      '#1C1E1A',
  inkMid:       '#484B44',
  inkMuted:     '#8A8E83',
  inkOnDark:    '#EDE9E1',

  forest:       '#2C4435',
  sage:         '#4D6B54',
  sageMid:      '#698870',
  sageLight:    'rgba(77,107,84,0.10)',
  sageBorder:   'rgba(77,107,84,0.22)',
  gold:         '#8C6E3C',
  goldLight:    'rgba(140,110,60,0.10)',
  goldBorder:   'rgba(140,110,60,0.22)',

  ok:           '#3B5E40',
  okBg:         'rgba(59,94,64,0.10)',
  low:          '#8C3B3B',
  lowBg:        'rgba(140,59,59,0.10)',
  high:         '#8C6E3C',
  highBg:       'rgba(140,110,60,0.10)',

  border:       'rgba(28,30,26,0.09)',
  shadow:       '#18201A',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function gColor(v?: number): string {
  if (!v)      return T.inkMuted;
  if (v < 70)  return T.low;
  if (v > 180) return T.high;
  return T.ok;
}
function gBg(v?: number): string {
  if (!v)      return T.cardCream;
  if (v < 70)  return T.lowBg;
  if (v > 180) return T.highBg;
  return T.okBg;
}
function fmt(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return <Text style={sl.txt}>{text}</Text>;
}
const sl = StyleSheet.create({
  txt: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase', color: T.inkMuted, marginBottom: 12,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// STAT TILE
// ─────────────────────────────────────────────────────────────────────────────
function StatTile({
  label, value, unit, accentColor,
}: { label: string; value: string | number; unit?: string; accentColor?: string }) {
  return (
    <View style={[stt.root, accentColor && { borderTopColor: accentColor, borderTopWidth: 2.5 }]}>
      <Text style={[stt.value, accentColor && { color: accentColor }]}>{value}</Text>
      {unit ? <Text style={stt.unit}>{unit}</Text> : null}
      <Text style={stt.label}>{label}</Text>
    </View>
  );
}
const stt = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: T.cardCream,
    borderRadius: 16, paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1, borderColor: T.border,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  value: { fontSize: 26, fontWeight: '200', color: T.inkDark, letterSpacing: -1 },
  unit:  { fontSize: 10, color: T.inkMuted, marginTop: 2 },
  label: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.4,
    color: T.inkMuted, marginTop: 6, textTransform: 'uppercase',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// GLUCOSE ROW
// ─────────────────────────────────────────────────────────────────────────────
function GlucoseRow({ r }: { r: GlucoseReading }) {
  const val = r.glucose_level ?? r.value ?? 0;
  const ts  = r.timestamp ?? r.measured_at ?? r.created_at;
  const col = gColor(val);
  return (
    <View style={gr.root}>
      <View style={[gr.bar, { backgroundColor: col }]} />
      <View style={{ flex: 1 }}>
        <Text style={gr.date}>{fmt(ts)}</Text>
        {r.meal_context ? (
          <Text style={gr.ctx}>{r.meal_context.replace(/_/g, ' ')}</Text>
        ) : null}
      </View>
      <Text style={[gr.val, { color: col }]}>
        {typeof val === 'number' ? val.toFixed(0) : val}
      </Text>
      <Text style={gr.unit}>mg/dL</Text>
    </View>
  );
}
const gr = StyleSheet.create({
  root: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.cardCream,
    borderRadius: 14, borderWidth: 1, borderColor: T.border,
    paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 8, gap: 12,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  bar:  { width: 3, height: 34, borderRadius: 2 },
  date: { fontSize: 13, fontWeight: '500', color: T.inkDark },
  ctx:  { fontSize: 11, color: T.inkMuted, marginTop: 2, textTransform: 'capitalize' },
  val:  { fontSize: 22, fontWeight: '200', letterSpacing: -0.5 },
  unit: { fontSize: 10, color: T.inkMuted, alignSelf: 'flex-end', marginBottom: 2 },
});

// ─────────────────────────────────────────────────────────────────────────────
// SYMPTOM ROW
// ─────────────────────────────────────────────────────────────────────────────
function SymptomRow({ sym }: { sym: Symptom }) {
  return (
    <View style={sr.root}>
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
  root: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.cardCream,
    borderRadius: 14, borderWidth: 1, borderColor: T.border,
    paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 8, gap: 12,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  type:  { fontSize: 14, fontWeight: '500', color: T.inkDark, textTransform: 'capitalize' },
  date:  { fontSize: 11, color: T.inkMuted, marginTop: 2 },
  dots:  { flexDirection: 'row', gap: 3 },
  dot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: T.border },
  score: { fontSize: 13, fontWeight: '500', color: T.inkMuted, width: 34, textAlign: 'right' },
});

// ─────────────────────────────────────────────────────────────────────────────
// COACH INSIGHT CARD
// ─────────────────────────────────────────────────────────────────────────────
function InsightCard({
  avg, tir, symCount,
}: { avg?: number; tir?: number; symCount: number }) {
  const insights: { icon: string; text: string }[] = [];

  if (avg && avg < 70) {
    insights.push({ icon: '⚠️', text: 'Average glucose is below range. Review meal timing and portion sizes.' });
  } else if (avg && avg > 180) {
    insights.push({ icon: '📈', text: 'Elevated average glucose. Consider reviewing carb intake and activity levels.' });
  } else if (avg) {
    insights.push({ icon: '✓', text: 'Glucose average looks healthy. Reinforce current habits with encouragement.' });
  }

  if (tir != null && tir < 50) {
    insights.push({ icon: '◎', text: `Only ${tir}% time in range. Focus on consistency between meals and sleep quality.` });
  } else if (tir != null && tir >= 70) {
    insights.push({ icon: '🌿', text: `${tir}% time in range — great consistency. Celebrate this with your client.` });
  }

  if (symCount > 3) {
    insights.push({ icon: '◈', text: `${symCount} symptoms logged recently. Look for patterns around low glucose readings.` });
  }

  if (insights.length === 0) {
    insights.push({ icon: '◌', text: 'Encourage this client to log daily readings to unlock detailed insights.' });
  }

  return (
    <View style={ic.root}>
      <View style={ic.header}>
        <View style={ic.iconWrap}>
          <Text style={{ fontSize: 16 }}>🌿</Text>
        </View>
        <Text style={ic.title}>Coach Insights</Text>
      </View>
      {insights.map((item, i) => (
        <View key={i} style={ic.row}>
          <Text style={ic.icon}>{item.icon}</Text>
          <Text style={ic.text}>{item.text}</Text>
        </View>
      ))}
    </View>
  );
}
const ic = StyleSheet.create({
  root: {
    backgroundColor: T.sageLight,
    borderRadius: 16, padding: 18, marginBottom: 4,
    borderWidth: 1, borderColor: T.sageBorder,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(77,107,84,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  title:  { fontSize: 13, fontWeight: '700', color: T.sage, letterSpacing: 0.2 },
  row:    { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  icon:   { fontSize: 14, color: T.sage, marginTop: 1, width: 20 },
  text:   { flex: 1, fontSize: 13, color: T.inkMid, lineHeight: 20 },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function ClientDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteP>();
  const { clientId } = route.params;

  const { clients } = useCoachStore();
  const client   = clients.find(c => c.id === clientId);
  const fullName = client ? `${client.firstName} ${client.lastName}`.trim() : 'Client';

  const [readings,   setReadings]   = useState<GlucoseReading[]>([]);
  const [symptoms,   setSymptoms]   = useState<Symptom[]>([]);
  const [stats,      setStats]      = useState<any>(null);
  const [cycleData,  setCycleData]  = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(() => new Animated.Value(0))[0];

  // ── Data loading preserved exactly ─────────────────────────────────────────
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
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [loadData]);

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [loadData]);

  // Derived
  const avg   = stats?.avgGlucose ?? stats?.average ?? client?.recentStats?.avgGlucose;
  const tir   = stats?.timeInRange ?? stats?.in_range_percentage ?? client?.recentStats?.timeInRange;
  const phase = cycleData?.cycle?.phase ?? cycleData?.phase;

  // Avatar
  const hue = ((fullName.charCodeAt(0) ?? 65) * 41) % 360;

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* ── NAV BAR ───────────────────────────────────────────────── */}
        <View style={s.nav}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={s.navTitle} numberOfLines={1}>{fullName}</Text>
          <TouchableOpacity
            style={s.msgBtn}
            onPress={() => navigation.navigate('Messaging', { userName: fullName })}
            activeOpacity={0.75}
          >
            <Text style={s.msgIcon}>✉</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.sage} />
          }
        >
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* ── IDENTITY ─────────────────────────────────────────── */}
            <View style={s.identity}>
              <View style={[s.avatar, {
                backgroundColor: `hsla(${hue},20%,82%,1)`,
                borderColor: `hsla(${hue},20%,68%,0.5)`,
              }]}>
                <Text style={[s.avatarTxt, { color: `hsl(${hue},28%,28%)` }]}>
                  {fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.clientName}>{fullName}</Text>
                {client?.email ? <Text style={s.clientEmail}>{client.email}</Text> : null}
                {phase ? (
                  <View style={s.phasePill}>
                    <Text style={s.phaseText}>{phase} phase</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* ── LOADING ──────────────────────────────────────────── */}
            {loading ? (
              <View style={s.loadWrap}>
                <ActivityIndicator color={T.sage} size="large" />
                <Text style={s.loadTxt}>Loading client data…</Text>
              </View>
            ) : (
              <>
                {/* ── ERROR ──────────────────────────────────────── */}
                {error && (
                  <View style={s.errorCard}>
                    <Text style={s.errorTxt}>⚠️  {error}</Text>
                    <TouchableOpacity onPress={loadData} style={s.retryBtn}>
                      <Text style={s.retryTxt}>Try again</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ── STATS ──────────────────────────────────────── */}
                <View style={s.section}>
                  <View style={s.statsRow}>
                    <StatTile
                      label="Avg Glucose"
                      value={avg != null ? Math.round(avg) : '—'}
                      unit={avg != null ? 'mg/dL' : undefined}
                      accentColor={avg != null ? gColor(avg) : undefined}
                    />
                    <StatTile
                      label="In Range"
                      value={tir != null ? `${Math.round(tir)}%` : '—'}
                      accentColor={tir != null
                        ? tir >= 70 ? T.ok : tir >= 50 ? T.gold : T.low
                        : undefined}
                    />
                    <StatTile label="Readings" value={readings.length} />
                  </View>
                </View>

                {/* ── INSIGHTS ───────────────────────────────────── */}
                <View style={s.section}>
                  <SectionLabel text="Guidance" />
                  <InsightCard avg={avg} tir={tir} symCount={symptoms.length} />
                </View>

                {/* ── ASSIGN LESSON ──────────────────────────────── */}
                <View style={s.section}>
                  <SectionLabel text="Actions" />
                  <TouchableOpacity
                    style={s.assignBtn}
                    onPress={() =>
                      navigation.navigate('CreateLesson' as any, {
                        clientId,
                        clientName: fullName,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <View style={s.assignIcon}>
                      <Text style={{ fontSize: 16 }}>＋</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.assignTitle}>Assign Lesson</Text>
                      <Text style={s.assignSub}>Share notes or session content</Text>
                    </View>
                    <Text style={s.assignArrow}>›</Text>
                  </TouchableOpacity>
                </View>

                {/* ── GLUCOSE ────────────────────────────────────── */}
                <View style={s.section}>
                  <SectionLabel text="Recent Glucose" />
                  {readings.length === 0 ? (
                    <View style={s.emptyCard}>
                      <Text style={s.emptyTxt}>No glucose readings yet</Text>
                    </View>
                  ) : (
                    readings.slice(0, 8).map(r => <GlucoseRow key={r.id} r={r} />)
                  )}
                </View>

                {/* ── SYMPTOMS ───────────────────────────────────── */}
                <View style={s.section}>
                  <SectionLabel text="Recent Symptoms" />
                  {symptoms.length === 0 ? (
                    <View style={s.emptyCard}>
                      <Text style={s.emptyTxt}>No symptoms logged</Text>
                    </View>
                  ) : (
                    symptoms.slice(0, 5).map(s => <SymptomRow key={s.id} sym={s} />)
                  )}
                </View>

                {/* ── CYCLE ──────────────────────────────────────── */}
                {cycleData && (
                  <View style={s.section}>
                    <SectionLabel text="Cycle" />
                    <View style={s.cycleCard}>
                      <Text style={{ fontSize: 22 }}>🌿</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.cyclePhase}>
                          {phase
                            ? `${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase`
                            : 'Active cycle'}
                        </Text>
                        {cycleData?.cycle?.current_day ? (
                          <Text style={s.cycleDay}>Day {cycleData.cycle.current_day}</Text>
                        ) : null}
                      </View>
                    </View>
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

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.pageBg },
  safe: { flex: 1 },

  // Nav bar
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: T.border,
    gap: 12, backgroundColor: T.pageBg,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: T.cardCream,
    borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 17, color: T.inkMid },
  navTitle: {
    flex: 1, fontSize: 16, fontWeight: '600',
    color: T.inkDark, letterSpacing: -0.2,
  },
  msgBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: T.cardCream,
    borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  msgIcon: { fontSize: 15, color: T.inkMid },

  content: { paddingHorizontal: 22, paddingTop: 24 },

  // Identity
  identity: {
    flexDirection: 'row', alignItems: 'center',
    gap: 16, marginBottom: 28,
  },
  avatar: {
    width: 58, height: 58, borderRadius: 29,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  avatarTxt:   { fontSize: 22, fontWeight: '700' },
  clientName:  { fontSize: 20, fontWeight: '600', color: T.inkDark, letterSpacing: -0.3 },
  clientEmail: { fontSize: 13, color: T.inkMuted, marginTop: 2 },
  phasePill: {
    alignSelf: 'flex-start', marginTop: 6,
    backgroundColor: T.sageLight,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: T.sageBorder,
  },
  phaseText: { fontSize: 11, fontWeight: '600', color: T.sage, textTransform: 'capitalize' },

  section:  { marginBottom: 28 },
  statsRow: { flexDirection: 'row', gap: 10 },

  loadWrap: { paddingVertical: 52, alignItems: 'center', gap: 14 },
  loadTxt:  { fontSize: 14, color: T.inkMuted },

  errorCard: {
    backgroundColor: T.lowBg, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(140,59,59,0.20)',
    padding: 16, marginBottom: 20, gap: 10,
  },
  errorTxt:  { fontSize: 13, color: T.low, lineHeight: 19 },
  retryBtn:  {
    alignSelf: 'flex-start',
    paddingVertical: 6, paddingHorizontal: 14,
    backgroundColor: 'rgba(140,59,59,0.10)',
    borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(140,59,59,0.22)',
  },
  retryTxt: { fontSize: 13, fontWeight: '600', color: T.low },

  emptyCard: {
    backgroundColor: T.cardCream, borderRadius: 14,
    borderWidth: 1, borderColor: T.border,
    padding: 20, alignItems: 'center',
  },
  emptyTxt: { fontSize: 13, color: T.inkMuted, fontStyle: 'italic' },

  // Assign lesson button
  assignBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.cardCream,
    borderRadius: 16, borderWidth: 1, borderColor: T.border,
    padding: 16, gap: 14,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  assignIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: T.cardForest,
    alignItems: 'center', justifyContent: 'center',
  },
  assignTitle: { fontSize: 15, fontWeight: '600', color: T.inkDark },
  assignSub:   { fontSize: 12, color: T.inkMuted, marginTop: 2 },
  assignArrow: { fontSize: 22, color: T.inkMuted, fontWeight: '300' },

  // Cycle card
  cycleCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.cardSage,
    borderRadius: 16, borderWidth: 1, borderColor: T.border,
    padding: 18, gap: 14,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cyclePhase: { fontSize: 15, fontWeight: '600', color: T.inkDark },
  cycleDay:   { fontSize: 12, color: T.inkMuted, marginTop: 2 },
});