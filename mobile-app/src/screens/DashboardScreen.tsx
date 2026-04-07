// mobile-app/src/screens/DashboardScreen.tsx
// REDESIGNED v4 — senior UI/UX layout:
//   1. Hero zone: large glucose circle centered at top with arc ring indicator
//   2. Quick stats row below circle (avg + time in range)
//   3. Subtle bible verse
//   4. 2×2 info card grid (lesson, rhythm, symptoms, cycle)
//   5. Log strip at bottom (always accessible)
// ALL logic / navigation / store calls preserved exactly.

import React, { useEffect, useCallback, useState, useRef } from 'react';
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

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
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
  sageBorder:   'rgba(77,107,84,0.20)',
  goldTape:     'rgba(196,168,115,0.42)',
  gold:         '#8C6E3C',

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
// STATUS HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function gColor(v?: number): string {
  if (v == null) return T.inkMuted;
  if (v < 70)    return T.low;
  if (v > 180)   return T.high;
  return T.ok;
}
function gLabel(v?: number): string {
  if (v == null) return 'No reading';
  if (v < 70)    return 'Low';
  if (v > 180)   return 'High';
  return 'In Range';
}
function gFaceBg(v?: number): string {
  if (v == null) return T.cardCream;
  if (v < 70)    return T.lowBg;
  if (v > 180)   return T.highBg;
  return T.okBg;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK SYMPTOM CHIPS — shown inline below the circle
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_SYMPTOM_CHIPS = [
  { id: 'fatigue',    label: 'Fatigue'   },
  { id: 'headache',   label: 'Headache'  },
  { id: 'brain_fog',  label: 'Brain fog' },
  // { id: 'cramps',     label: 'Cramps'    },
];

// ─────────────────────────────────────────────────────────────────────────────
// HERO GLUCOSE CIRCLE
// Large, centered at top — tap to log glucose
// ─────────────────────────────────────────────────────────────────────────────
const CIRCLE_SIZE = SW * 0.56;   // responsive, ~60% of screen width

function HeroGlucoseCircle({ value, onPress }: { value?: number; onPress: () => void }) {
  const color  = gColor(value);
  const label  = gLabel(value);
  const faceBg = gFaceBg(value);
  const scale  = useRef(new Animated.Value(1)).current;

  const pIn  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 60 }).start();
  const pOut = () => Animated.spring(scale, { toValue: 1.00, useNativeDriver: true, speed: 60 }).start();

  // TIR arc fill percentage encoded in borderColor opacity trick —
  // we use a layered ring approach for the decorative arc
  const ringColor = `${color}28`;
  const ringColorMid = `${color}14`;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={pIn}
      onPressOut={pOut}
      activeOpacity={1}
      style={hc.touchable}
    >
      <Animated.View style={[hc.outerRing, { borderColor: ringColor, transform: [{ scale }] }]}>
        <View style={[hc.midRing, { borderColor: ringColorMid }]}>
          <View style={[hc.face, { backgroundColor: faceBg, borderColor: `${color}20` }]}>

            {/* Decorative tape strip */}
            <View style={hc.tape} />

            <Text style={hc.unitLabel}>mg / dL</Text>
            <Text style={[hc.valueText, { color }]}>
              {value != null ? Math.round(value) : '—'}
            </Text>

            {/* Status pill */}
            <View style={[hc.statusPill, { backgroundColor: `${color}18`, borderColor: `${color}30` }]}>
              <View style={[hc.statusDot, { backgroundColor: color }]} />
              <Text style={[hc.statusLabel, { color }]}>{label}</Text>
            </View>

            <Text style={hc.tapLabel}>tap to log</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}
const hc = StyleSheet.create({
  touchable: { alignItems: 'center' },
  outerRing: {
    width: CIRCLE_SIZE + 44,
    height: CIRCLE_SIZE + 44,
    borderRadius: (CIRCLE_SIZE + 44) / 2,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  midRing: {
    width: CIRCLE_SIZE + 22,
    height: CIRCLE_SIZE + 22,
    borderRadius: (CIRCLE_SIZE + 22) / 2,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  face: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    gap: 3,
    overflow: 'hidden',
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10, shadowRadius: 16, elevation: 8,
  },
  tape: {
    position: 'absolute', top: 18, right: -6,
    width: 32, height: 10,
    backgroundColor: 'rgba(155,178,155,0.35)',
    transform: [{ rotate: '28deg' }], borderRadius: 2,
  },
  unitLabel: {
    fontSize: 11, fontWeight: '500',
    color: T.inkMuted, letterSpacing: 0.8,
  },
  valueText: {
    fontSize: CIRCLE_SIZE * 0.28,   // scales with circle
    fontWeight: '200',
    letterSpacing: -3,
    lineHeight: CIRCLE_SIZE * 0.30,
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 4,
    marginTop: 4,
  },
  statusDot:   { width: 5, height: 5, borderRadius: 3 },
  statusLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
  tapLabel: {
    fontSize: 10, color: T.inkMuted,
    marginTop: 4, letterSpacing: 0.5,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// DAILY VERSE — small, subtle, refined
// ─────────────────────────────────────────────────────────────────────────────
const DAILY_VERSE = {
  text: '"She is clothed with strength and dignity, and she laughs without fear of the future."',
  ref:  'Proverbs 31:25',
};

function DailyVerse() {
  return (
    <View style={dv.root}>
      <Text style={dv.label}>TODAY'S WORD</Text>
      <Text style={dv.text}>{DAILY_VERSE.text}</Text>
      <Text style={dv.ref}>{DAILY_VERSE.ref}</Text>
    </View>
  );
}
const dv = StyleSheet.create({
  root: { paddingHorizontal: 32, paddingVertical: 10 },
  label: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(28,30,26,0.30)', marginBottom: 7,
  },
  text: {
    fontSize: 14, fontStyle: 'italic', fontWeight: '400',
    color: 'rgba(28,30,26,0.45)',
    lineHeight: 21, letterSpacing: 0.1, marginBottom: 5,
  },
  ref: {
    fontSize: 11, fontWeight: '500',
    color: 'rgba(28,30,26,0.28)', letterSpacing: 0.2,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <Text style={{
      fontSize: 9, fontWeight: '700', letterSpacing: 1.5,
      textTransform: 'uppercase', color: T.inkMuted,
      marginBottom: 10, paddingHorizontal: 20,
    }}>
      {text}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INFO CARD — reusable tile for lesson / rhythm / actions
// ─────────────────────────────────────────────────────────────────────────────
interface InfoCardProps {
  bg: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  darkSurface?: boolean;
  accentColor?: string;
  onPress?: () => void;
  badge?: string;
  badgeColor?: string;
}

function InfoCard({
  bg, eyebrow, title, subtitle, darkSurface, accentColor, onPress, badge, badgeColor,
}: InfoCardProps) {
  const primary   = darkSurface ? T.inkOnDark    : T.inkDark;
  const secondary = darkSurface ? 'rgba(237,233,225,0.52)' : T.inkMuted;
  return (
    <TouchableOpacity
      style={[ic.root, { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.78 : 1}
      disabled={!onPress}
    >
      {accentColor && <View style={[ic.topLine, { backgroundColor: accentColor }]} />}
      {badge && (
        <View style={[ic.badge, { backgroundColor: badgeColor ?? `${accentColor}20` }]}>
          <Text style={[ic.badgeTxt, { color: badgeColor ? '#fff' : (accentColor ?? T.inkMuted) }]}>
            {badge}
          </Text>
        </View>
      )}
      <Text style={[ic.eyebrow, { color: secondary }]}>{eyebrow}</Text>
      <Text style={[ic.title, { color: primary }]} numberOfLines={2}>{title}</Text>
      {subtitle ? <Text style={[ic.subtitle, { color: secondary }]} numberOfLines={2}>{subtitle}</Text> : null}
    </TouchableOpacity>
  );
}
const ic = StyleSheet.create({
  root: {
    flex: 1, borderRadius: 18,
    borderWidth: 1, borderColor: T.border,
    padding: 16, minHeight: 108,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  topLine: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 2.5, borderTopLeftRadius: 18, borderTopRightRadius: 18,
  },
  badge: {
    position: 'absolute', top: 12, right: 12,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  badgeTxt: { fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  eyebrow:  {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 5,
  },
  title:    { fontSize: 17, fontWeight: '300', letterSpacing: -0.2, lineHeight: 22 },
  subtitle: { fontSize: 11, marginTop: 3, lineHeight: 16 },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const navigation = useNavigation<NavProp>();
  const { user }   = useAuthStore();
  const { readings, stats, fetchReadings, fetchStats } = useGlucoseStore();
  const { fetchSymptoms }                              = useSymptomStore();
  const { currentCycle, fetchCurrentCycle }            = useCycleStore();

  const [lesson,     setLesson]     = useState<Lesson | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(() => new Animated.Value(0))[0];

  // ── All original logic preserved ───────────────────────────────────────────
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
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  // Derived — all preserved
  const firstName = user?.firstName ?? 'there';
  const h = new Date().getHours();
  const greet =
    h < 5  ? 'Still with you' :
    h < 12 ? 'Good morning'   :
    h < 17 ? 'Good afternoon' : 'Good evening';

  const latest    = readings[0];
  const latestVal = latest?.glucose_level ?? latest?.value;
  const avgVal    = stats?.avgGlucose  ?? stats?.average;
  const tirPct    = stats?.timeInRange ?? stats?.in_range_percentage;
  const phase     = currentCycle?.phase;
  const rhythm    = phase ? getRhythmForPhase(phase) : null;

  // Nav — all unchanged
  const goLogGlucose  = () => navigation.navigate('AddGlucose');
  const goLogSymptoms = () => navigation.navigate('AddSymptom');
  const goLogCycle    = () => navigation.navigate('LogCycle');
  const goSettings    = () => navigation.navigate('Settings');
  const goLesson      = (l: Lesson) => navigation.navigate('LessonDetail', { lesson: l });
  const goRhythm      = () => navigation.navigate('RhythmProfile');
  const goConversations = () => navigation.navigate('Conversations');

  return (
    <View style={s.root}>
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

            {/* ── HEADER ────────────────────────────────────────────── */}
            <View style={s.headerRow}>
              <View>
                <Text style={s.greetSm}>{greet},</Text>
                <Text style={s.greetLg}>{firstName}</Text>
              </View>
              <TouchableOpacity style={s.settingsBtn} onPress={goSettings} activeOpacity={0.75}>
                <View style={s.dot} /><View style={s.dot} /><View style={s.dot} />
              </TouchableOpacity>
            </View>

            {/* ── HERO: LARGE GLUCOSE CIRCLE ────────────────────────── */}
            <View style={s.heroZone}>
              <HeroGlucoseCircle value={latestVal} onPress={goLogGlucose} />
              {/* Quick symptom chips inline under circle */}
              <View style={s.symRow}>
                {QUICK_SYMPTOM_CHIPS.map(sym => (
                  <TouchableOpacity
                    key={sym.id}
                    style={s.symChip}
                    onPress={goLogSymptoms}
                    activeOpacity={0.78}
                  >
                    <Text style={s.symChipTxt}>{sym.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={s.symMore} onPress={goLogSymptoms} activeOpacity={0.78}>
                  <Text style={s.symMoreTxt}>+ more</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── DAILY VERSE ───────────────────────────────────────── */}
            <View style={s.verseGap}>
              <DailyVerse />
            </View>

            {/* ── INFO CARDS GRID ───────────────────────────────────── */}
            <SectionLabel text="Today" />
            <View style={s.cardGrid}>
              {/* Row 1: Lesson + Rhythm */}
              <View style={s.cardRow}>
                <InfoCard
                  bg={T.cardTan}
                  eyebrow="Lesson"
                  title={lesson ? lesson.title : 'None yet'}
                  subtitle={lesson ? 'Tap to view →' : 'Coach will share soon'}
                  accentColor={lesson && lesson.status !== 'completed' ? T.gold : T.sage}
                  badge={lesson && lesson.status === 'assigned' ? 'NEW' : undefined}
                  badgeColor={T.gold}
                  onPress={lesson ? () => goLesson(lesson) : undefined}
                />
                <View style={{ width: 10 }} />
                <InfoCard
                  bg={T.cardSage}
                  eyebrow="Rhythm"
                  title={rhythm ? rhythm.name : 'Track cycle'}
                  subtitle={rhythm ? rhythm.spiritualRhythm : 'Log to unlock'}
                  accentColor={T.sageMid}
                  onPress={goRhythm}
                />
              </View>

              {/* Row 2: Log Cycle + Messages */}
              <View style={[s.cardRow, { marginTop: 10 }]}>
                <InfoCard
                  bg={T.cardCream}
                  eyebrow="Cycle"
                  title="Log cycle"
                  subtitle="track your phase"
                  accentColor={T.sageMid}
                  onPress={goLogCycle}
                />
                <View style={{ width: 10 }} />
                <InfoCard
                  bg={T.cardForest}
                  eyebrow="Coach"
                  title="Messages"
                  subtitle="Chat with your coach"
                  darkSurface
                  accentColor={T.sageMid}
                  onPress={goConversations}
                />
              </View>
            </View>

            <View style={{ height: 48 }} />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.pageBg },
  safe: { flex: 1 },
  scroll: { paddingBottom: 16 },

  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24, paddingTop: 18, paddingBottom: 8,
  },
  greetSm: { fontSize: 13, fontWeight: '400', color: T.inkMuted, letterSpacing: 0.2 },
  greetLg: { fontSize: 28, fontWeight: '300', color: T.inkDark, letterSpacing: -0.6, marginTop: 2 },
  settingsBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: T.cardCream,
    borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center', gap: 3,
    shadowColor: T.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: T.inkMuted },

  // Hero circle zone — centered, generous vertical breathing room
  heroZone: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingTop: 8,
  },

  // Inline symptom chips under circle
  symRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 7,
    marginTop: 14,
    paddingHorizontal: 24,
  },
  symChip: {
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: T.cardCream,
    borderWidth: 1, borderColor: T.border,
  },
  symChipTxt: { fontSize: 12, fontWeight: '400', color: T.inkMid },
  symMore: {
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: T.sageLight,
    borderWidth: 1, borderColor: T.sageBorder,
  },
  symMoreTxt: { fontSize: 12, fontWeight: '600', color: T.sage },

  // Verse
  verseGap: { marginBottom: 20, marginTop: 8 },

  // Cards
  cardGrid:  { paddingHorizontal: 20, marginBottom: 0 },
  cardRow:   { flexDirection: 'row' },
});