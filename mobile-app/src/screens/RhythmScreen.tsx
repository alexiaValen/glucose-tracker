// mobile-app/src/screens/RhythmScreen.tsx
// UNIFIED: Merges RhythmScreen + RhythmProfileScreen
// Matches dashboard design system exactly — same tokens, same card style, same feel.
// ALL logic preserved from both originals.

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCycleStore } from '../stores/cycleStore';
import { getRhythmForPhase, RHYTHM_PHASES } from '../data/rhythmData';

// ── Preserved from RhythmProfileScreen ────────────────────────────────────────
export type CycleProfile =
  | 'regular'
  | 'irregular'
  | 'perimenopause'
  | 'menopause'
  | 'unknown';
export const CYCLE_PROFILE_KEY = 'cycleProfile';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — exact match to DashboardScreen
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
  sageTape:     'rgba(155,178,155,0.38)',
  goldTape:     'rgba(196,168,115,0.42)',
  gold:         '#8C6E3C',

  border:       'rgba(28,30,26,0.09)',
  borderMid:    'rgba(28,30,26,0.15)',
  shadow:       '#18201A',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// DATA — profiles + feeling options (preserved exactly)
// ─────────────────────────────────────────────────────────────────────────────
const PROFILES: {
  id: CycleProfile;
  emoji: string;
  label: string;
  description: string;
  detail: string;
}[] = [
  {
    id: 'regular',
    emoji: '🌿',
    label: 'Regular Cycle',
    description: 'My cycle is fairly predictable',
    detail:
      'Your dashboard will show rhythm content based on your tracked cycle phase — Body, Scripture, and Practice aligned to where you are in the month.',
  },
  {
    id: 'irregular',
    emoji: '🌱',
    label: 'Irregular / PCOS',
    description: 'My cycle is unpredictable or absent',
    detail:
      "Instead of calendar-based phases, you'll choose how you're feeling each day. The same rich rhythm content will meet you wherever you are.",
  },
  {
    id: 'perimenopause',
    emoji: '🍂',
    label: 'Perimenopause',
    description: 'My cycle is changing or becoming irregular',
    detail:
      "Your body is in a season of transition. You'll use a feeling-based selector to find your rhythm each day — honoring where you are, not where a calendar says you should be.",
  },
  {
    id: 'menopause',
    emoji: '🌾',
    label: 'Menopause',
    description: 'I no longer have a menstrual cycle',
    detail:
      'The four rhythms become seasonal anchors — available to you anytime through a simple daily check-in. Your season, your pace.',
  },
  {
    id: 'unknown',
    emoji: '🌸',
    label: 'Not Sure',
    description: "I'd rather not say or I'm figuring it out",
    detail:
      "No problem. You'll see a gentle feeling-based selector each day. You can update this anytime.",
  },
];

const FEELING_OPTIONS = [
  { phase: 'menstrual',  emoji: '🌱', label: 'Resting',   description: 'Low energy, withdrawing inward' },
  { phase: 'follicular', emoji: '🍃', label: 'Rising',    description: 'Energy returning, feeling creative' },
  { phase: 'ovulation',  emoji: '🌞', label: 'Radiant',   description: 'Confident, connected, expressive' },
  { phase: 'luteal',     emoji: '🌾', label: 'Grounding', description: 'Inward, reflective, need for stillness' },
];

const PROFILE_HEADER: Record<CycleProfile, { title: string; subtitle: string }> = {
  regular:       { title: 'Your Rhythm',  subtitle: 'Based on your cycle phase' },
  irregular:     { title: 'Your Rhythm',  subtitle: 'Choose how you feel today' },
  perimenopause: { title: 'Your Rhythm',  subtitle: 'Choose how you feel today' },
  menopause:     { title: 'Your Season',  subtitle: 'Choose your rhythm today' },
  unknown:       { title: 'Your Rhythm',  subtitle: 'Choose how you feel today' },
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED CARD SHELL
// ─────────────────────────────────────────────────────────────────────────────
function Card({
  bg = T.cardCream,
  style,
  children,
}: {
  bg?: string;
  style?: object;
  children: React.ReactNode;
}) {
  return (
    <View style={[sh.card, { backgroundColor: bg }, style]}>
      {children}
    </View>
  );
}
const sh = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    padding: 18,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return <Text style={sl.txt}>{text}</Text>;
}
const sl = StyleSheet.create({
  txt: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.inkMuted,
    marginBottom: 6,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE PICKER CARD
// Collapsed: shows current selection. Tap → expands all options.
// ─────────────────────────────────────────────────────────────────────────────
function ProfileCard({
  selected,
  onSelect,
}: {
  selected: CycleProfile;
  onSelect: (id: CycleProfile) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = PROFILES.find(p => p.id === selected)!;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  };

  const pick = (id: CycleProfile) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onSelect(id);
    setOpen(false);
  };

  return (
    <Card bg={T.cardOffWhite}>
      {/* Collapsed row — always visible */}
      <TouchableOpacity style={pc.header} onPress={toggle} activeOpacity={0.8}>
        <Text style={pc.emoji}>{current.emoji}</Text>
        <View style={pc.info}>
          <Text style={pc.label}>{current.label}</Text>
          <Text style={pc.desc}>{current.description}</Text>
        </View>
        <View style={[pc.radio, { borderColor: T.sage }]}>
          <View style={pc.radioDot} />
        </View>
        <Text style={pc.chevron}>{open ? '↑' : '↓'}</Text>
      </TouchableOpacity>

      {/* Expanded: all options */}
      {open && (
        <View style={pc.listWrap}>
          <View style={pc.divider} />
          {PROFILES.map((p, i) => {
            const active = p.id === selected;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  pc.optionRow,
                  i < PROFILES.length - 1 && pc.optionBorder,
                  active && pc.optionActive,
                ]}
                onPress={() => pick(p.id)}
                activeOpacity={0.75}
              >
                <Text style={pc.optEmoji}>{p.emoji}</Text>
                <View style={pc.optInfo}>
                  <Text style={[pc.optLabel, active && { color: T.forest }]}>{p.label}</Text>
                  <Text style={pc.optDesc}>{p.description}</Text>
                  {active && (
                    <Text style={pc.optDetail}>{p.detail}</Text>
                  )}
                </View>
                <View style={[pc.radioOuter, active && { borderColor: T.forest }]}>
                  {active && <View style={pc.radioInnerDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </Card>
  );
}
const pc = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: { fontSize: 22, width: 32 },
  info:  { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: T.inkDark, marginBottom: 2 },
  desc:  { fontSize: 12, color: T.inkMuted, lineHeight: 17 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: T.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  radioDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: T.sage,
  },
  chevron: { fontSize: 13, color: T.inkMuted, marginLeft: 4 },

  listWrap: { marginTop: 0 },
  divider:  { height: 1, backgroundColor: T.border, marginVertical: 14 },

  optionRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 14, gap: 12,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  optionActive: {},
  optEmoji:  { fontSize: 20, width: 30, marginTop: 1 },
  optInfo:   { flex: 1 },
  optLabel:  { fontSize: 14, fontWeight: '600', color: T.inkDark, marginBottom: 2 },
  optDesc:   { fontSize: 12, color: T.inkMuted, lineHeight: 17 },
  optDetail: {
    fontSize: 12, color: T.inkMid,
    lineHeight: 18, marginTop: 6,
    fontStyle: 'italic',
  },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  radioInnerDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: T.forest,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// FEELING SELECTOR — for non-regular profiles
// ─────────────────────────────────────────────────────────────────────────────
function FeelingSelector({ onSelect }: { onSelect: (phase: string) => void }) {
  return (
    <Card bg={T.cardCream}>
      <Text style={fs.prompt}>How are you feeling today?</Text>
      {FEELING_OPTIONS.map((opt, i) => (
        <TouchableOpacity
          key={opt.phase}
          style={[
            fs.row,
            i < FEELING_OPTIONS.length - 1 && fs.rowBorder,
          ]}
          onPress={() => onSelect(opt.phase)}
          activeOpacity={0.75}
        >
          <Text style={fs.emoji}>{opt.emoji}</Text>
          <View style={fs.info}>
            <Text style={fs.label}>{opt.label}</Text>
            <Text style={fs.desc}>{opt.description}</Text>
          </View>
          <Text style={fs.arrow}>→</Text>
        </TouchableOpacity>
      ))}
    </Card>
  );
}
const fs = StyleSheet.create({
  prompt: {
    fontSize: 15, fontWeight: '600',
    color: T.inkDark, marginBottom: 14,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  emoji:  { fontSize: 20, width: 30 },
  info:   { flex: 1 },
  label:  { fontSize: 14, fontWeight: '600', color: T.inkDark, marginBottom: 2 },
  desc:   { fontSize: 12, color: T.inkMuted, lineHeight: 17 },
  arrow:  { fontSize: 15, color: T.inkMuted },
});

// ─────────────────────────────────────────────────────────────────────────────
// TODAY'S RHYTHM CARD — main content display
// ─────────────────────────────────────────────────────────────────────────────
function TodayRhythmCard({
  rhythm,
  useFeeling,
  onChangeFeeling,
  onLogCycle,
  navigation,
}: {
  rhythm: ReturnType<typeof getRhythmForPhase> | null;
  useFeeling: boolean;
  onChangeFeeling: () => void;
  onLogCycle: () => void;
  navigation: any;
}) {
  if (!rhythm) {
    return (
      <TouchableOpacity
        style={[sh.card, { backgroundColor: T.cardCream, alignItems: 'center', paddingVertical: 32 }]}
        onPress={onLogCycle}
        activeOpacity={0.85}
      >
        <Text style={tr.emptyEmoji}>🌱</Text>
        <Text style={tr.emptyTitle}>Start tracking your cycle</Text>
        <Text style={tr.emptyDesc}>Log your cycle start date to see your rhythm</Text>
        <View style={tr.emptyBtn}>
          <Text style={tr.emptyBtnTxt}>+ Log Cycle</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <Card bg={T.cardCream} style={{ borderLeftWidth: 3, borderLeftColor: rhythm.color }}>
      {/* Header row */}
      <View style={tr.header}>
        <Text style={tr.emoji}>{rhythm.emoji}</Text>
        <View style={tr.titleBlock}>
          <Text style={[tr.name, { color: rhythm.color }]}>{rhythm.name}</Text>
          <Text style={tr.subtitle}>{rhythm.subtitle}</Text>
        </View>
        {useFeeling && (
          <TouchableOpacity style={tr.changeBtn} onPress={onChangeFeeling} activeOpacity={0.8}>
            <Text style={tr.changeTxt}>Change</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Spiritual rhythm */}
      <Text style={tr.spiritual}>{rhythm.spiritualRhythm}</Text>

      {/* Divider */}
      <View style={[tr.divider, { backgroundColor: rhythm.color + '22' }]} />

      {/* Body */}
      <SectionLabel text="Body" />
      <Text style={tr.bodyTxt}>{rhythm.physiology}</Text>

      {/* Scripture */}
      <View style={tr.scriptureBlock}>
        <SectionLabel text="Scripture" />
        <Text style={[tr.scriptureRef, { color: rhythm.color }]}>{rhythm.scripture.reference}</Text>
        <Text style={tr.scriptureTxt}>{rhythm.scripture.text}</Text>
      </View>

      {/* Practice */}
      <View style={tr.practiceBlock}>
        <SectionLabel text="Practice" />
        <Text style={tr.bodyTxt}>{rhythm.practice}</Text>
      </View>
    </Card>
  );
}
const tr = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, marginBottom: 12,
  },
  emoji:      { fontSize: 28, marginTop: 2 },
  titleBlock: { flex: 1 },
  name:       { fontSize: 20, fontWeight: '700', letterSpacing: 0.1, marginBottom: 2 },
  subtitle:   { fontSize: 12, color: T.inkMuted },
  changeBtn: {
    backgroundColor: T.cardSage,
    borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8,
  },
  changeTxt:  { fontSize: 11, fontWeight: '600', color: T.forest },
  spiritual:  {
    fontSize: 14, color: T.inkMid,
    fontStyle: 'italic', lineHeight: 21,
    marginBottom: 16,
  },
  divider:    { height: 1, marginBottom: 16 },
  bodyTxt:    { fontSize: 14, color: T.inkMid, lineHeight: 21 },
  scriptureBlock: { marginTop: 14 },
  scriptureRef:   {
    fontSize: 13, fontWeight: '700',
    letterSpacing: 0.2, marginBottom: 4,
  },
  scriptureTxt: {
    fontSize: 14, color: T.inkDark,
    fontStyle: 'italic', lineHeight: 21,
  },
  practiceBlock: { marginTop: 14 },

  emptyEmoji: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: T.inkDark, marginBottom: 6 },
  emptyDesc:  {
    fontSize: 13, color: T.inkMuted,
    textAlign: 'center', lineHeight: 19, marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: T.cardSage,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: T.border,
  },
  emptyBtnTxt: { fontSize: 14, fontWeight: '600', color: T.forest },
});

// ─────────────────────────────────────────────────────────────────────────────
// PHASE CARD — expandable, in the "Four Rhythms" list
// ─────────────────────────────────────────────────────────────────────────────
function PhaseCard({
  phase,
  isActive,
  isExpanded,
  onToggle,
}: {
  phase: (typeof RHYTHM_PHASES)[number];
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        ph.root,
        isActive && { borderColor: phase.color, borderWidth: 1.5 },
      ]}
      onPress={onToggle}
      activeOpacity={0.82}
    >
      {/* Header row */}
      <View style={ph.header}>
        <Text style={ph.emoji}>{phase.emoji}</Text>
        <View style={ph.titleBlock}>
          <View style={ph.nameRow}>
            <Text style={[ph.name, { color: phase.color }]}>{phase.name}</Text>
            {isActive && (
              <View style={[ph.nowBadge, { backgroundColor: phase.color + '18' }]}>
                <Text style={[ph.nowTxt, { color: phase.color }]}>NOW</Text>
              </View>
            )}
          </View>
          <Text style={ph.meta}>{phase.subtitle} · {phase.days}</Text>
        </View>
        <Text style={ph.chevron}>{isExpanded ? '↑' : '↓'}</Text>
      </View>

      {/* Teaser */}
      <Text style={ph.spiritual}>{phase.spiritualRhythm}</Text>

      {/* Expanded content */}
      {isExpanded && (
        <View style={ph.expanded}>
          <View style={[ph.divider, { backgroundColor: phase.color + '22' }]} />

          <SectionLabel text="Body" />
          <Text style={ph.bodyTxt}>{phase.physiology}</Text>

          <View style={ph.block}>
            <SectionLabel text="Scripture" />
            <Text style={[ph.scriptRef, { color: phase.color }]}>{phase.scripture.reference}</Text>
            <Text style={ph.scriptTxt}>{phase.scripture.text}</Text>
          </View>

          <View style={ph.block}>
            <SectionLabel text="Practice" />
            <Text style={ph.bodyTxt}>{phase.practice}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}
const ph = StyleSheet.create({
  root: {
    backgroundColor: T.cardCream,
    borderRadius: 18,
    borderWidth: 1, borderColor: T.border,
    padding: 16,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6,
  },
  emoji:      { fontSize: 22 },
  titleBlock: { flex: 1 },
  nameRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  name:    { fontSize: 16, fontWeight: '600', letterSpacing: 0.1 },
  nowBadge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },
  nowTxt:  { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  meta:    { fontSize: 11, color: T.inkMuted, marginTop: 1 },
  chevron: { fontSize: 13, color: T.inkMuted },
  spiritual: {
    fontSize: 13, color: T.inkMid,
    fontStyle: 'italic', lineHeight: 18,
  },
  expanded: { marginTop: 14 },
  divider:  { height: 1, marginBottom: 14 },
  bodyTxt:  { fontSize: 13, color: T.inkMid, lineHeight: 20 },
  block:    { marginTop: 12 },
  scriptRef: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2, marginBottom: 3 },
  scriptTxt: {
    fontSize: 13, color: T.inkDark,
    fontStyle: 'italic', lineHeight: 20,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN UNIFIED SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function RhythmScreen({ navigation }: { navigation: any }) {
  const { currentCycle, fetchCurrentCycle } = useCycleStore();

  const [cycleProfile,   setCycleProfile]   = useState<CycleProfile>('regular');
  const [selectedPhase,  setSelectedPhase]  = useState<string | null>(null);
  const [showSelector,   setShowSelector]   = useState(false);
  const [expandedPhase,  setExpandedPhase]  = useState<string | null>(null);
  const [savedBanner,    setSavedBanner]    = useState(false);

  useEffect(() => {
    fetchCurrentCycle();
    AsyncStorage.getItem(CYCLE_PROFILE_KEY).then(val => {
      if (val) setCycleProfile(val as CycleProfile);
    });
  }, []);

  // Preserved logic: feeling-based vs calendar-based
  const useFeeling    = cycleProfile !== 'regular';
  const activePhase   = useFeeling
    ? selectedPhase
    : currentCycle?.phase ?? null;
  const rhythm        = activePhase ? getRhythmForPhase(activePhase) : null;
  const header        = PROFILE_HEADER[cycleProfile];

  const handleSelectProfile = async (id: CycleProfile) => {
    setCycleProfile(id);
    await AsyncStorage.setItem(CYCLE_PROFILE_KEY, id);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 1800);
    // Reset feeling selection when profile changes
    if (id === 'regular') setSelectedPhase(null);
  };

  const togglePhase = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedPhase(prev => (prev === id ? null : id));
  };

  const handleFeelingSelect = (phase: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedPhase(phase);
    setShowSelector(false);
  };

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.headerLabel}>Rhythm</Text>
            <Text style={s.headerTitle}>{header.title}</Text>
            <Text style={s.headerSub}>{header.subtitle}</Text>
          </View>
          {savedBanner && (
            <View style={s.savedBadge}>
              <Text style={s.savedTxt}>✓ Saved</Text>
            </View>
          )}
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >

          {/* ── SECTION 1: PROFILE PICKER ───────────────────────── */}
          <Text style={s.sectionLabel}>MY PROFILE</Text>
          <ProfileCard selected={cycleProfile} onSelect={handleSelectProfile} />

          {/* ── SECTION 2: TODAY'S RHYTHM ───────────────────────── */}
          <Text style={[s.sectionLabel, s.sectionLabelSpaced]}>TODAY</Text>

          {/* Feeling selector for non-regular profiles */}
          {useFeeling && (!selectedPhase || showSelector) ? (
            <FeelingSelector onSelect={handleFeelingSelect} />
          ) : (
            <TodayRhythmCard
              rhythm={rhythm}
              useFeeling={useFeeling}
              onChangeFeeling={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowSelector(true);
              }}
              onLogCycle={() => navigation.navigate('LogCycle')}
              navigation={navigation}
            />
          )}

          {/* ── SECTION 3: FOUR RHYTHMS ─────────────────────────── */}
          <Text style={[s.sectionLabel, s.sectionLabelSpaced]}>THE FOUR RHYTHMS</Text>

          <View style={s.phaseList}>
            {RHYTHM_PHASES.map(phase => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                isActive={activePhase === phase.id}
                isExpanded={expandedPhase === phase.id}
                onToggle={() => togglePhase(phase.id)}
              />
            ))}
          </View>

          <View style={{ height: 48 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT STYLES — matches dashboard rhythm exactly
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.pageBg },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.pageBg,
  },
  headerLabel: {
    fontSize: 10, fontWeight: '700',
    letterSpacing: 1.4, textTransform: 'uppercase',
    color: T.inkMuted, marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28, fontWeight: '300',
    color: T.inkDark, letterSpacing: -0.5,
    lineHeight: 32,
  },
  headerSub: {
    fontSize: 13, color: T.inkMuted,
    marginTop: 3, letterSpacing: 0.1,
  },

  savedBadge: {
    backgroundColor: T.cardSage,
    borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  savedTxt: { fontSize: 12, fontWeight: '600', color: T.forest },

  scroll:  { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 24 },

  sectionLabel: {
    fontSize: 9, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
    color: T.inkMuted, marginBottom: 12,
  },
  sectionLabelSpaced: { marginTop: 28 },

  phaseList: { gap: 10 },
});