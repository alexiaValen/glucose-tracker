// mobile-app/src/screens/JoinGroupScreen.tsx
// REFACTORED: Matches dashboard design system — cream/sage/forest palette.
// Default export fixed. ALL logic preserved exactly.

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { api } from '../config/api';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'JoinGroup'> };

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  pageBg:     '#F0EBE0',
  cardCream:  '#F8F4EC',
  cardSage:   '#E2E8DF',
  cardForest: '#2C4435',
  cardTan:    '#DDD3C0',
  inkDark:    '#1C1E1A',
  inkMid:     '#484B44',
  inkMuted:   '#8A8E83',
  inkOnDark:  '#EDE9E1',
  forest:     '#2C4435',
  sage:       '#4D6B54',
  sageLight:  'rgba(77,107,84,0.10)',
  sageBorder: 'rgba(77,107,84,0.22)',
  gold:       '#8C6E3C',
  goldLight:  'rgba(140,110,60,0.10)',
  goldBorder: 'rgba(140,110,60,0.22)',
  border:     'rgba(28,30,26,0.09)',
  shadow:     '#18201A',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
const PROGRAM_PHASES = [
  {
    weeks: 'Weeks 1–3', title: 'Foundations',
    items: [
      'Understanding your hormones & metabolism',
      'The four phases: Reawakened, Renew, Radiant, Rooted',
      'Cycle tracking + body literacy',
      'Introduction to fasting',
    ],
  },
  {
    weeks: 'Weeks 4–6', title: 'Nutrition Reset',
    items: [
      'Anti-inflammatory eating',
      'Blood sugar balance',
      'Phase-specific nutrition',
      'Optional fasting reset protocol',
    ],
  },
  {
    weeks: 'Weeks 7–9', title: 'Movement Reset',
    items: [
      'Strength training for midlife',
      'Cycle-synced workouts',
      'Stress-reducing movement',
      'Optional fasting reset protocol',
    ],
  },
  {
    weeks: 'Weeks 10–12', title: 'Integration + Transformation',
    items: [
      'Identity-based habits',
      'Long-term metabolic strategy',
      'Celebration + next steps',
      'Lifetime access to final program',
    ],
  },
];

const PAST_PROGRAMS = [{
  name: '2026 Vision Retreat',
  dates: 'Feb 9 – Mar 22, 2026 · 6 weeks',
  synopsis: 'A transformative 6-week journey exploring holiness, identity, and spiritual armor. Participants deepened their faith practice through guided Scripture study, weekly Zoom sessions, and community reflection.',
}];

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function JoinGroupScreen({ navigation }: Props) {
  const [joining, setJoining] = useState(false);

  // Logic preserved exactly
  const handleJoinNow = async () => {
    setJoining(true);
    try {
      await api.post('/groups/join', { accessCode: 'HFR-FEB2025', paymentType: 'founding' });
      Alert.alert(
        'Welcome! 🌿',
        "You've joined the 12-Week Metabolic Reset Program. Your journey starts now.",
        [{ text: 'Get Started', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error || '';
      if (msg === 'Already a member of this group') {
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Unable to join right now. Please try again.');
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Join Program</Text>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={s.heroCard}>
            <View style={s.foundingBadge}>
              <Text style={s.foundingTxt}>FOUNDING MEMBER PROGRAM</Text>
            </View>
            <Text style={s.heroTitle}>12-Week Metabolic Reset</Text>
            <Text style={s.heroSub}>
              A cycle-synced program for women blending biblical wisdom, scientific research, and practical coaching to restore energy, balance hormones, and reconnect with God-designed rhythms.
            </Text>
            <View style={s.detailsRow}>
              {[
                { emoji: '📅', label: 'STARTS',   value: 'Feb 6, 2025' },
                { emoji: '⏱',  label: 'DURATION', value: '12 Weeks'    },
                { emoji: '💻', label: 'MEETINGS', value: 'Thu 7 PM CT' },
              ].map((d, i, arr) => (
                <React.Fragment key={d.label}>
                  <View style={s.detailItem}>
                    <Text style={{ fontSize: 16 }}>{d.emoji}</Text>
                    <Text style={s.detailLabel}>{d.label}</Text>
                    <Text style={s.detailValue}>{d.value}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={s.detailDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Includes */}
          <Text style={s.sectionLabel}>WHAT YOU'LL RECEIVE</Text>
          <View style={s.includesCard}>
            {[
              '✦  Weekly 90-min Zoom sessions (recorded)',
              '✦  Worksheets + phase-specific guides',
              '✦  Reflection prompts + check-in rhythm',
              '✦  Group chat for encouragement & accountability',
              '✦  Lifetime access to the final program',
            ].map((item, i) => (
              <Text key={i} style={s.includeItem}>{item}</Text>
            ))}
          </View>

          {/* Phases */}
          <Text style={s.sectionLabel}>THE JOURNEY</Text>
          {PROGRAM_PHASES.map((phase, i) => (
            <View key={i} style={s.phaseCard}>
              <Text style={s.phaseWeeks}>{phase.weeks}</Text>
              <Text style={s.phaseTitle}>{phase.title}</Text>
              {phase.items.map((item, j) => (
                <Text key={j} style={s.phaseItem}>· {item}</Text>
              ))}
            </View>
          ))}

          {/* CTA */}
          <View style={s.ctaCard}>
            <Text style={s.ctaTitle}>Ready to Begin?</Text>
            <Text style={s.ctaSub}>
              Join your founding member cohort and start your 12-week journey.
            </Text>
            <TouchableOpacity
              style={[s.joinBtn, joining && { opacity: 0.6 }]}
              onPress={handleJoinNow}
              disabled={joining}
              activeOpacity={0.85}
            >
              {joining
                ? <ActivityIndicator color={T.inkOnDark} />
                : <Text style={s.joinBtnTxt}>Join the Program →</Text>
              }
            </TouchableOpacity>
            <Text style={s.ctaNote}>Thursdays 7–8:30 PM CT · Sessions are recorded</Text>
          </View>

          {/* Past programs */}
          <Text style={s.sectionLabel}>PAST PROGRAMS</Text>
          {PAST_PROGRAMS.map((p, i) => (
            <View key={i} style={s.pastCard}>
              <View style={s.pastBadge}>
                <Text style={s.pastBadgeTxt}>COMPLETED</Text>
              </View>
              <Text style={s.pastName}>{p.name}</Text>
              <Text style={s.pastDates}>{p.dates}</Text>
              <Text style={s.pastSynopsis}>{p.synopsis}</Text>
            </View>
          ))}

          <View style={{ height: 48 }} />
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
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: T.border,
    backgroundColor: T.pageBg, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: T.cardCream,
    borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow:   { fontSize: 17, color: T.inkMid },
  headerTitle: { fontSize: 17, fontWeight: '600', color: T.inkDark, letterSpacing: -0.2 },
  content:     { padding: 20 },

  sectionLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase', color: T.inkMuted,
    marginBottom: 12, marginTop: 4,
  },

  heroCard: {
    backgroundColor: T.cardCream, borderRadius: 20,
    borderWidth: 1, borderColor: T.border,
    padding: 22, marginBottom: 24,
    shadowColor: T.shadow, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  foundingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: T.goldLight, borderWidth: 1, borderColor: T.goldBorder,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, marginBottom: 14,
  },
  foundingTxt: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: T.gold },
  heroTitle:   {
    fontSize: 24, fontWeight: '600', color: T.inkDark,
    marginBottom: 10, lineHeight: 30, letterSpacing: -0.3,
  },
  heroSub:    { fontSize: 14, lineHeight: 22, color: T.inkMid, marginBottom: 22 },
  detailsRow: {
    flexDirection: 'row',
    backgroundColor: T.sageLight, borderRadius: 14,
    borderWidth: 1, borderColor: T.sageBorder,
    padding: 14, alignItems: 'center',
  },
  detailItem:    { flex: 1, alignItems: 'center', gap: 3 },
  detailDivider: { width: 1, height: 32, backgroundColor: T.border },
  detailLabel:   { fontSize: 9, fontWeight: '700', letterSpacing: 1, color: T.inkMuted },
  detailValue:   { fontSize: 12, fontWeight: '600', color: T.inkDark, textAlign: 'center' },

  includesCard: {
    backgroundColor: T.cardCream, borderRadius: 16,
    borderWidth: 1, borderColor: T.border,
    padding: 18, marginBottom: 20, gap: 10,
  },
  includeItem: { fontSize: 14, color: T.inkMid, lineHeight: 20 },

  phaseCard: {
    backgroundColor: T.cardCream, borderRadius: 14,
    borderWidth: 1, borderColor: T.border,
    borderLeftWidth: 3, borderLeftColor: T.sage,
    padding: 16, marginBottom: 10,
  },
  phaseWeeks: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: T.sage, marginBottom: 3 },
  phaseTitle: { fontSize: 16, fontWeight: '600', color: T.inkDark, marginBottom: 8 },
  phaseItem:  { fontSize: 13, color: T.inkMid, lineHeight: 21, marginLeft: 4 },

  ctaCard: {
    backgroundColor: T.cardForest, borderRadius: 20,
    padding: 26, marginTop: 8, marginBottom: 24, alignItems: 'center',
    shadowColor: T.shadow, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 5,
  },
  ctaTitle: { fontSize: 20, fontWeight: '700', color: T.inkOnDark, marginBottom: 8 },
  ctaSub:   {
    fontSize: 13, color: 'rgba(237,233,225,0.75)',
    textAlign: 'center', lineHeight: 20, marginBottom: 22,
  },
  joinBtn: {
    backgroundColor: T.cardCream, borderRadius: 14,
    paddingVertical: 15, paddingHorizontal: 32,
    marginBottom: 14, minWidth: 200, alignItems: 'center',
  },
  joinBtnTxt: { fontSize: 16, fontWeight: '700', color: T.forest },
  ctaNote:    { fontSize: 11, color: 'rgba(237,233,225,0.55)', textAlign: 'center' },

  pastCard: {
    backgroundColor: T.cardSage, borderRadius: 14,
    borderWidth: 1, borderColor: T.border,
    padding: 16, marginBottom: 10,
  },
  pastBadge: {
    alignSelf: 'flex-start', backgroundColor: T.border,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8,
  },
  pastBadgeTxt: { fontSize: 8, fontWeight: '700', letterSpacing: 1, color: T.inkMuted },
  pastName:     { fontSize: 15, fontWeight: '600', color: T.inkMid, marginBottom: 3 },
  pastDates:    { fontSize: 12, color: T.inkMuted, marginBottom: 8 },
  pastSynopsis: { fontSize: 13, color: T.inkMid, lineHeight: 19 },
});