// mobile-app/src/screens/JoinGroupScreen.tsx
// TestFlight version: Shows program info + one-tap auto-join (no code required)

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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { BotanicalBackground } from '../components/BotanicalBackground';
import { colors } from '../theme/colors';
import { api } from '../config/api';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'JoinGroup'> };

const PROGRAM_PHASES = [
  {
    weeks: 'Weeks 1–3',
    title: 'Foundations',
    items: ['Understanding your hormones & metabolism', 'The four phases: Reawakened, Renew, Radiant, Rooted', 'Cycle tracking + body literacy', 'Introduction to fasting'],
  },
  {
    weeks: 'Weeks 4–6',
    title: 'Nutrition Reset',
    items: ['Anti-inflammatory eating', 'Blood sugar balance', 'Phase-specific nutrition', 'Optional fasting reset protocol'],
  },
  {
    weeks: 'Weeks 7–9',
    title: 'Movement Reset',
    items: ['Strength training for midlife', 'Cycle-synced workouts', 'Stress-reducing movement', 'Optional fasting reset protocol'],
  },
  {
    weeks: 'Weeks 10–12',
    title: 'Integration + Transformation',
    items: ['Identity-based habits', 'Long-term metabolic strategy', 'Celebration + next steps', 'Lifetime access to final program'],
  },
];

const PAST_PROGRAMS = [
  {
    name: '2026 Vision Retreat',
    dates: 'Feb 9 – Mar 22, 2026 · 6 weeks',
    synopsis: 'A transformative 6-week journey exploring holiness, identity, and spiritual armor. Participants deepened their faith practice through guided Scripture study, weekly Zoom sessions, and community reflection.',
  },
];

export default function JoinGroupScreen({ navigation }: Props) {
  const [joining, setJoining] = useState(false);

  const handleJoinNow = async () => {
    setJoining(true);
    try {
      await api.post('/groups/join', {
        accessCode: 'HFR-FEB2025',
        paymentType: 'founding',
      });
      Alert.alert(
        'Welcome! 🌿',
        'You\'ve joined the 12-Week Metabolic Reset Program. Your journey starts now.',
        [{
          text: 'Get Started',
          onPress: () => navigation.goBack(),
        }]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error || '';
      if (msg === 'Already a member of this group') {
        // Already enrolled — just go back, dashboard will pick it up
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Unable to join right now. Please try again.');
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <BotanicalBackground variant="subtle" intensity="light">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.heroCard}>
            <View style={styles.foundingBadge}>
              <Text style={styles.foundingBadgeText}>FOUNDING MEMBER PROGRAM</Text>
            </View>
            <Text style={styles.heroTitle}>12-Week Metabolic Reset</Text>
            <Text style={styles.heroSubtitle}>
              A cycle-synced program for women blending biblical wisdom, scientific research, and practical coaching to restore energy, balance hormones, and reconnect with God-designed rhythms.
            </Text>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailEmoji}>📅</Text>
                <Text style={styles.detailLabel}>STARTS</Text>
                <Text style={styles.detailValue}>Feb 6, 2025</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailEmoji}>⏱</Text>
                <Text style={styles.detailLabel}>DURATION</Text>
                <Text style={styles.detailValue}>12 Weeks</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailEmoji}>💻</Text>
                <Text style={styles.detailLabel}>MEETINGS</Text>
                <Text style={styles.detailValue}>Thu 7 PM CT</Text>
              </View>
            </View>
          </View>

          {/* What's Included */}
          <Text style={styles.sectionLabel}>WHAT YOU'LL RECEIVE</Text>
          <View style={styles.includesCard}>
            {[
              '✦  Weekly 90-min Zoom sessions (recorded)',
              '✦  Worksheets + phase-specific guides',
              '✦  Reflection prompts + check-in rhythm',
              '✦  Group chat for encouragement & accountability',
              '✦  Lifetime access to the final program',
            ].map((item, i) => (
              <Text key={i} style={styles.includeItem}>{item}</Text>
            ))}
          </View>

          {/* Program Phases */}
          <Text style={styles.sectionLabel}>THE JOURNEY</Text>
          {PROGRAM_PHASES.map((phase, i) => (
            <View key={i} style={styles.phaseCard}>
              <View style={styles.phaseHeader}>
                <Text style={styles.phaseWeeks}>{phase.weeks}</Text>
                <Text style={styles.phaseTitle}>{phase.title}</Text>
              </View>
              {phase.items.map((item, j) => (
                <Text key={j} style={styles.phaseItem}>· {item}</Text>
              ))}
            </View>
          ))}

          {/* Join CTA */}
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Ready to Begin?</Text>
            <Text style={styles.ctaSubtitle}>
              Join your founding member cohort and start your 12-week journey.
            </Text>
            <TouchableOpacity
              style={[styles.joinBtn, joining && styles.joinBtnDisabled]}
              onPress={handleJoinNow}
              disabled={joining}
              activeOpacity={0.85}
            >
              {joining ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.joinBtnText}>Join the Program →</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.ctaNote}>
              Thursdays 7–8:30 PM CT · Sessions are recorded
            </Text>
          </View>

          {/* Past Programs */}
          <Text style={styles.sectionLabel}>PAST PROGRAMS</Text>
          {PAST_PROGRAMS.map((p, i) => (
            <View key={i} style={styles.pastCard}>
              <View style={styles.pastBadge}>
                <Text style={styles.pastBadgeText}>COMPLETED</Text>
              </View>
              <Text style={styles.pastName}>{p.name}</Text>
              <Text style={styles.pastDates}>{p.dates}</Text>
              <Text style={styles.pastSynopsis}>{p.synopsis}</Text>
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(212,214,212,0.25)',
  },
  backText: { color: colors.sage, fontSize: 16, fontWeight: '500' },
  content: { flex: 1 },
  scrollContent: { padding: 20 },

  // Hero
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 24, padding: 24, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  foundingBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(184,154,90,0.15)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 16,
  },
  foundingBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#B89A5A' },
  heroTitle: { fontSize: 28, fontWeight: '700', color: colors.ink, marginBottom: 12, lineHeight: 34 },
  heroSubtitle: { fontSize: 15, lineHeight: 23, color: 'rgba(42,45,42,0.72)', marginBottom: 24 },
  detailsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(107,127,110,0.06)',
    borderRadius: 16, padding: 16, alignItems: 'center',
  },
  detailItem: { flex: 1, alignItems: 'center', gap: 4 },
  detailDivider: { width: 1, height: 36, backgroundColor: 'rgba(212,214,212,0.4)' },
  detailEmoji: { fontSize: 18 },
  detailLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, color: colors.textMuted },
  detailValue: { fontSize: 12, fontWeight: '600', color: colors.ink, textAlign: 'center' },

  // Includes
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: 'rgba(107,127,110,0.6)',
    marginBottom: 12, marginTop: 4,
  },
  includesCard: {
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 18, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.25)', gap: 10,
  },
  includeItem: { fontSize: 14, color: colors.textDark, lineHeight: 20 },

  // Phases
  phaseCard: {
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 16, padding: 18, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.25)',
    borderLeftWidth: 3, borderLeftColor: colors.sage,
  },
  phaseHeader: { marginBottom: 10 },
  phaseWeeks: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.sage, marginBottom: 3 },
  phaseTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  phaseItem: { fontSize: 13, color: 'rgba(42,45,42,0.7)', lineHeight: 22, marginLeft: 4 },

  // CTA
  ctaCard: {
    backgroundColor: colors.forestGreen, borderRadius: 24, padding: 28,
    marginTop: 8, marginBottom: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 5,
  },
  ctaTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  ctaSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  joinBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 16,
    paddingHorizontal: 32, marginBottom: 16, minWidth: 220, alignItems: 'center',
  },
  joinBtnDisabled: { opacity: 0.6 },
  joinBtnText: { fontSize: 17, fontWeight: '700', color: colors.forestGreen },
  ctaNote: { fontSize: 12, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },

  // Past Programs
  pastCard: {
    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 18, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.2)',
  },
  pastBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(42,45,42,0.08)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10,
  },
  pastBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1, color: 'rgba(42,45,42,0.5)' },
  pastName: { fontSize: 16, fontWeight: '600', color: 'rgba(42,45,42,0.6)', marginBottom: 4 },
  pastDates: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  pastSynopsis: { fontSize: 13, color: 'rgba(42,45,42,0.55)', lineHeight: 20 },
});