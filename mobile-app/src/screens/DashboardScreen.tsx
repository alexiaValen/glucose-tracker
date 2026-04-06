// mobile-app/src/screens/DashboardScreen.tsx
// One continuous full-bleed gradient panel — no section break.
// Everything (stats, bars, actions, lesson, group chat, rhythm) on one surface.
// ALL logic/navigation/API calls preserved exactly.

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

import { useAuthStore }      from '../stores/authStore';
import { useGlucoseStore }   from '../stores/glucoseStore';
import { useSymptomStore }   from '../stores/symptomStore';
import { useCycleStore }     from '../stores/cycleStore';
import { ViewingBanner }     from '../components/ViewingBanner';
import { getRhythmForPhase } from '../data/rhythmData';
import { getMyLessons }      from '../services/lessonService';
import type { Lesson }       from '../types/lesson';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
const { width: SW } = Dimensions.get('window');

// ── Tokens ─────────────────────────────────────────────────────────────────────
const T = {
  bgDeep:      '#0B1810',
  bgMid:       '#0F1C12',
  glass:       'rgba(255,255,255,0.07)',
  glassBorder: 'rgba(255,255,255,0.11)',
  sage:        '#7A9B7E',
  sageBright:  '#9ABD9E',
  sageDeep:    '#3D5540',
  sageMid:     '#4E6B52',
  gold:        '#C9A96E',
  goldSoft:    '#D4BB8C',
  low:         '#E07070',
  high:        '#C9A96E',
  ok:          '#7A9B7E',
  textPrimary:   '#F0EDE6',
  textSecondary: 'rgba(240,237,230,0.60)',
  textMuted:     'rgba(240,237,230,0.35)',
} as const;

function gColor(v?: number) {
  if (!v) return T.textPrimary;
  if (v < 70)  return T.low;
  if (v > 180) return T.high;
  return T.ok;
}
function gLabel(v?: number) {
  if (!v) return '—';
  if (v < 70)  return 'Low';
  if (v > 180) return 'High';
  return 'In Range';
}

function Hairline() {
  return (
    <View style={{
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.07)',
      marginHorizontal: 24,
      marginVertical: 6,
    }} />
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const navigation = useNavigation<NavProp>();
  const { user }   = useAuthStore();
  const { readings, stats, fetchReadings, fetchStats } = useGlucoseStore();
  const { fetchSymptoms } = useSymptomStore();
  const { currentCycle, fetchCurrentCycle } = useCycleStore();

  const [lesson,     setLesson]     = useState<Lesson | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(() => new Animated.Value(0))[0];

  const loadAll = useCallback(async () => {
    await Promise.allSettled([
      fetchReadings(), fetchStats(), fetchSymptoms(), fetchCurrentCycle(),
    ]);
    try {
      const res = await getMyLessons();
      const all: Lesson[] = res.data?.lessons ?? res.data ?? [];
      setLesson(all.find(l => l.status === 'assigned') ?? all[0] ?? null);
    } catch { setLesson(null); }
  }, [fetchReadings, fetchStats, fetchSymptoms, fetchCurrentCycle]);

  useEffect(() => {
    loadAll();
    Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  // Derived
  const firstName = user?.firstName ?? 'there';
  const h = new Date().getHours();
  const greet = h < 5 ? 'Still with you' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  const latest    = readings[0];
  const latestVal = latest?.glucose_level ?? latest?.value;
  const avgVal    = stats?.avgGlucose ?? stats?.average;
  const tirPct    = stats?.timeInRange ?? stats?.in_range_percentage;
  const tirFill   = tirPct != null ? Math.min(Math.max(tirPct / 100, 0), 1) : 0;

  const phase  = currentCycle?.phase;
  const rhythm = phase ? getRhythmForPhase(phase) : null;

  // Nav — all unchanged
  const goLogGlucose  = () => navigation.navigate('AddGlucose');
  const goLogSymptoms = () => navigation.navigate('AddSymptom');
  const goLogCycle    = () => navigation.navigate('LogCycle');
  const goSettings    = () => navigation.navigate('Settings');
  const goLesson      = (l: Lesson) => navigation.navigate('LessonDetail', { lesson: l });
  const goGroupChat   = () => navigation.navigate('GroupDashboard', { groupId: 'default' });
  const goRhythm      = () => navigation.navigate('RhythmProfile');

  return (
    <View style={s.root}>
      {/* ── Single full-page gradient — no break between sections ── */}
      <LinearGradient
        colors={['#0B1810', '#122016', '#162B1A', '#1A3320', '#162019', '#0F1C12']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
      />

      {/* Atmosphere orbs */}
      <View style={[s.orb, { width: 300, height: 300, top: -80, left: SW * 0.3 }]} />
      <View style={[s.orb, { width: 160, height: 160, top: '45%', left: -50, opacity: 0.07 }]} />
      <View style={[s.orb, { width: 90,  height: 90,  top: '72%', left: SW * 0.74, opacity: 0.06 }]} />

      <SafeAreaView style={s.safe} edges={['top']}>
        <ViewingBanner />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.sage} />
          }
        >
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* ══ 1. HEADER ════════════════════════════════════════════ */}
            <View style={s.headerRow}>
              <View>
                <Text style={s.greetSm}>{greet},</Text>
                <Text style={s.greetLg}>{firstName}</Text>
              </View>
              <TouchableOpacity style={s.settingsBtn} onPress={goSettings} activeOpacity={0.75}>
                <View style={s.dot} /><View style={s.dot} /><View style={s.dot} />
              </TouchableOpacity>
            </View>

            {/* ══ 2. STAT CLUSTER ══════════════════════════════════════ */}
            <View style={s.statCluster}>
              <View style={s.sideStatWrap}>
                <Text style={s.sideStatNum}>
                  {avgVal != null ? Math.round(avgVal) : '—'}
                </Text>
                <Text style={s.sideStatLbl}>7-DAY AVG</Text>
              </View>

              <TouchableOpacity style={s.centerRing} onPress={goLogGlucose} activeOpacity={0.88}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />
                <View style={s.centerRingBorder} />
                <View style={s.centerContent}>
                  <Text style={[s.centerNum, { color: gColor(latestVal) }]}>
                    {latestVal != null ? Math.round(latestVal) : '—'}
                  </Text>
                  <Text style={s.centerUnit}>mg/dL</Text>
                  <View style={[s.centerPill, { borderColor: `${gColor(latestVal)}50` }]}>
                    <View style={[s.centerPillDot, { backgroundColor: gColor(latestVal) }]} />
                    <Text style={[s.centerPillTxt, { color: gColor(latestVal) }]}>
                      {gLabel(latestVal)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={s.sideStatWrap}>
                <Text style={s.sideStatNum}>
                  {tirPct != null ? `${Math.round(tirPct)}%` : '—'}
                </Text>
                <Text style={s.sideStatLbl}>IN RANGE</Text>
              </View>
            </View>

            {/* ══ 3. PROGRESS BARS ═════════════════════════════════════ */}
            {/* <View style={s.progressStrip}>
              <View style={s.progressItem}>
                <View style={s.progressHeader}>
                  <Text style={s.progressLbl}>Glucose</Text>
                  <Text style={s.progressVal}>
                    {latestVal != null ? `${Math.round(latestVal)} mg/dL` : '—'}
                  </Text>
                </View>
                <View style={s.barTrack}>
                  <View style={[s.barFill, {
                    width: latestVal != null ? `${Math.min((latestVal / 250) * 100, 100)}%` : '0%',
                    backgroundColor: gColor(latestVal),
                  }]} />
                </View>
              </View>

              {/* <View style={s.progressItem}>
                <View style={s.progressHeader}>
                  <Text style={s.progressLbl}>Time in Range</Text>
                  <Text style={s.progressVal}>
                    {tirPct != null ? `${Math.round(tirPct)}%` : '—'}
                  </Text>
                </View>
                <View style={s.barTrack}>
                  <View style={[s.barFill, {
                    width: `${tirFill * 100}%`,
                    backgroundColor: tirFill >= 0.7 ? T.ok : tirFill >= 0.5 ? T.gold : T.low,
                  }]} />
                </View>
              </View> */}
            {/* </View> */} 

            {/* ══ 4. LOG ACTIONS ═══════════════════════════════════════ */}
            <View style={s.actionRow}>
              <TouchableOpacity style={s.actionPrimary} onPress={goLogGlucose} activeOpacity={0.82}>
                <LinearGradient
                  colors={[T.sageMid, T.sageDeep]}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />
                <View style={s.actionDot} />
                <Text style={s.actionPrimaryTxt}>Log Glucose</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.actionSecondary} onPress={goLogSymptoms} activeOpacity={0.82}>
                <Text style={s.actionSecondaryEmoji}>🌡</Text>
                <Text style={s.actionSecondaryTxt}>Symptoms</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.actionSecondary} onPress={goLogCycle} activeOpacity={0.82}>
                <Text style={s.actionSecondaryEmoji}>🌿</Text>
                <Text style={s.actionSecondaryTxt}>Cycle</Text>
              </TouchableOpacity>
            </View>

            {/* ══ 5. LESSON + GROUP CHAT ═══════════════════════════════ */}
            {/* <Hairline /> */}
{/* 
            <View style={s.tileRow}>
              {lesson ? (
                <TouchableOpacity style={s.tile} onPress={() => goLesson(lesson)} activeOpacity={0.85}>
                  <View style={s.tileTop}>
                    {lesson.status === 'completed' ? (
                      <View style={s.checkCircle}>
                        <Text style={{ fontSize: 12, color: T.sage }}>✓</Text>
                      </View>
                    ) : (
                      <View style={s.goldDot} />
                    )}
                  </View>
                  <Text style={s.tileEyebrow}>
                    {lesson.status === 'completed' ? 'COMPLETED' :
                     lesson.status === 'viewed'    ? 'IN PROGRESS' : 'NEW LESSON'}
                  </Text>
                  <Text style={s.tileTitle} numberOfLines={2}>{lesson.title}</Text>
                  <Text style={s.tileArrow}>›</Text>
                </TouchableOpacity>
              ) : (
                <View style={[s.tile, { opacity: 0.4 }]}>
                  <View style={s.tileTop}><Text style={{ fontSize: 20 }}>📋</Text></View>
                  <Text style={s.tileEyebrow}>LESSON</Text>
                  <Text style={s.tileTitle}>No lesson yet</Text>
                </View>
              )}

              <TouchableOpacity style={s.tile} onPress={goGroupChat} activeOpacity={0.82}>
                <View style={s.tileTop}>
                  <View style={s.chatBubble}>
                    <Text style={{ fontSize: 16 }}>💬</Text>
                  </View>
                </View>
                <Text style={s.tileEyebrow}>GROUP</Text>
                <Text style={s.tileTitle} numberOfLines={2}>{'12-Week\nMetabolic Reset'}</Text>
                <Text style={s.tileArrow}>→</Text>
              </TouchableOpacity>
            </View> */}

            {/* ══ 6. RHYTHM ════════════════════════════════════════════ */}
            {/* <Hairline /> */}
{/* 
            {rhythm ? (
              <TouchableOpacity style={s.rhythmRow} onPress={goRhythm} activeOpacity={0.85}>
                <View style={[s.rhythmAccent, { backgroundColor: T.gold }]} />
                <Text style={s.rhythmEmoji}>{rhythm.emoji}</Text>
                <View style={s.rhythmBody}>
                  <Text style={[s.tileEyebrow, { color: T.goldSoft, marginBottom: 2 }]}>
                    YOUR RHYTHM
                  </Text>
                  <Text style={s.rhythmName}>{rhythm.name}</Text>
                  <Text style={s.rhythmDesc} numberOfLines={1}>
                    {rhythm.spiritualRhythm}
                  </Text>
                </View>
                <Text style={s.rhythmArrow}>›</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.rhythmRow} onPress={goLogCycle} activeOpacity={0.85}>
                <View style={[s.rhythmAccent, { backgroundColor: T.sage }]} />
                <Text style={s.rhythmEmoji}>🌱</Text>
                <View style={s.rhythmBody}>
                  <Text style={[s.tileEyebrow, { marginBottom: 2 }]}>RHYTHM</Text>
                  <Text style={s.rhythmName}>Track your cycle</Text>
                  <Text style={s.rhythmDesc}>Discover your spiritual rhythm</Text>
                </View>
                <Text style={s.rhythmArrow}>›</Text>
              </TouchableOpacity>
            )} */}






            <View style={{ height: 40 }} />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1 },
  safe:   { flex: 1 },
  scroll: { paddingBottom: 16 },

  orb: {
    position: 'absolute', borderRadius: 999,
    backgroundColor: '#1E3D24', opacity: 0.14,
  },

  // ── Header
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28,
  },
  greetSm:  { fontSize: 13, fontWeight: '400', color: T.textSecondary, letterSpacing: 0.2 },
  greetLg:  { fontSize: 28, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.7, marginTop: 2 },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: T.glass, borderWidth: 1, borderColor: T.glassBorder,
    alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: T.textSecondary },

  // ── Stat cluster
  statCluster: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 28,
  },
  sideStatWrap: { flex: 1, alignItems: 'center', gap: 6 },
  sideStatNum:  { fontSize: 26, fontWeight: '300', color: T.textPrimary, letterSpacing: -0.5 },
  sideStatLbl:  { fontSize: 9, fontWeight: '700', letterSpacing: 1.4, color: T.textMuted, textAlign: 'center' },

  // ── Center ring
  centerRing: {
    width: 156, height: 156, borderRadius: 78,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.40, shadowRadius: 24, elevation: 10,
  },
  centerRingBorder: {
    position: 'absolute', width: 156, height: 156, borderRadius: 78,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.14)',
  },
  centerContent: { alignItems: 'center', gap: 2 },
  centerNum:     { fontSize: 42, fontWeight: '200', letterSpacing: -2 },
  centerUnit:    { fontSize: 12, color: T.textMuted, letterSpacing: 0.3 },
  centerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 3, marginTop: 4,
  },
  centerPillDot: { width: 5, height: 5, borderRadius: 3 },
  centerPillTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  // ── Progress bars
  progressStrip: {
    marginHorizontal: 24, marginBottom: 20,
    backgroundColor: T.glass,
    borderRadius: 16, borderWidth: 1, borderColor: T.glassBorder,
    padding: 16, gap: 12,
  },
  progressItem:   { gap: 6 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLbl:    { fontSize: 11, fontWeight: '600', color: T.textSecondary },
  progressVal:    { fontSize: 11, fontWeight: '600', color: T.textMuted },
  barTrack:       { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
  barFill:        { height: 4, borderRadius: 2 },

  // ── Action row
  actionRow: {
    flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 24,
  },
  actionPrimary: {
    flex: 2, height: 50, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(122,155,126,0.28)',
    shadowColor: T.sageDeep, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30, shadowRadius: 12, elevation: 5,
  },
  actionDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.60)' },
  actionPrimaryTxt: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 },
  actionSecondary: {
    flex: 1, height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: T.glass, borderWidth: 1, borderColor: T.glassBorder,
  },
  actionSecondaryEmoji: { fontSize: 18 },
  actionSecondaryTxt:   { fontSize: 10, fontWeight: '600', color: T.textSecondary, letterSpacing: 0.3 },

  // ── Tiles (lesson + group chat side by side)
  tileRow: {
    flexDirection: 'row', paddingHorizontal: 24, gap: 12,
    marginTop: 16, marginBottom: 4,
  },
  tile: {
    flex: 1, backgroundColor: T.glass,
    borderRadius: 20, borderWidth: 1, borderColor: T.glassBorder,
    padding: 16, minHeight: 136, justifyContent: 'space-between',
  },
  tileTop:     { marginBottom: 10 },
  tileEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.4, color: T.textMuted, marginBottom: 4 },
  tileTitle:   { fontSize: 14, fontWeight: '600', color: T.textPrimary, lineHeight: 20, flex: 1 },
  tileArrow:   { fontSize: 18, color: T.textMuted, marginTop: 8, alignSelf: 'flex-end' },

  checkCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(122,155,126,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(122,155,126,0.30)',
    alignItems: 'center', justifyContent: 'center',
  },
  goldDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: T.gold },
  chatBubble: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(201,169,110,0.15)',
    borderWidth: 1, borderColor: 'rgba(201,169,110,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Rhythm row
  rhythmRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginTop: 16, marginBottom: 4,
    backgroundColor: T.glass,
    borderRadius: 20, borderWidth: 1, borderColor: T.glassBorder,
    paddingVertical: 16, paddingLeft: 20, paddingRight: 16,
    gap: 14, overflow: 'hidden',
  },
  rhythmAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  rhythmEmoji:  { fontSize: 26 },
  rhythmBody:   { flex: 1 },
  rhythmName:   { fontSize: 16, fontWeight: '600', color: T.textPrimary, letterSpacing: 0.1 },
  rhythmDesc:   { fontSize: 12, color: T.textSecondary, marginTop: 3, lineHeight: 17, fontStyle: 'italic' },
  rhythmArrow:  { fontSize: 20, color: T.textMuted },
});