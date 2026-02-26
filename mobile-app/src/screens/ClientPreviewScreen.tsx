// mobile-app/src/screens/ClientPreviewScreen.tsx
// Coach-only: read-only preview of what a client sees on their dashboard
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { coachService } from '../services/coach.service';
import { colors } from '../theme/colors';
import { BotanicalBackground } from '../components/BotanicalBackground';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ClientPreview'>;
  route: RouteProp<RootStackParamList, 'ClientPreview'>;
};

const SYMPTOM_ICONS: Record<string, string> = {
  fatigue: '😴', bloating: '🫧', 'brain fog': '🌫️',
  hunger: '🍽️', dizziness: '💫', headache: '🤕',
  'hot flashes': '🔥', 'mood swings': '🎭', default: '🌿',
};

function getSymptomIcon(name: string) {
  return SYMPTOM_ICONS[name.toLowerCase()] || SYMPTOM_ICONS.default;
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - date.getTime()) / 3600000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Yesterday';
  return `${diffD} days ago`;
}

function getGlucoseColor(val: number) {
  if (val < 70) return '#E05C5C';
  if (val > 180) return '#E09A3A';
  return colors.forestGreen;
}

export default function ClientPreviewScreen({ navigation, route }: Props) {
  const { clientId, clientName } = route.params;
  const [loading, setLoading] = useState(true);
  const [glucose, setGlucose] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [cycle, setCycle] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    try {
      const [g, s, st, c] = await Promise.all([
        coachService.getClientGlucose(clientId, 10),
        coachService.getClientSymptoms(clientId, 5),
        coachService.getClientStats(clientId),
        coachService.getClientCycle(clientId).catch(() => null),
      ]);
      setGlucose(g || []);
      setSymptoms(s || []);
      setStats(st);
      setCycle(c);
    } catch (e) {
      console.error('ClientPreview load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const latestGlucose = glucose[0];
  const avgGlucose = stats?.avgGlucose ?? stats?.avg_glucose;
  const timeInRange = stats?.timeInRange ?? stats?.time_in_range;
  const totalReadings = stats?.totalReadings ?? stats?.total_readings ?? glucose.length;

  return (
    <BotanicalBackground variant="green" intensity="light">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{clientName}'s View</Text>
          <Text style={styles.headerSubtitle}>Read-only preview</Text>
        </View>
      </View>

      {/* Preview Banner */}
      <View style={styles.previewBanner}>
        <Text style={styles.previewBannerText}>👁  Coach preview — this is what {clientName?.split(' ')[0]} sees</Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.forestGreen} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Dashboard Header (simulated) */}
          <View style={styles.dashHeader}>
            <Text style={styles.dashGreeting}>Good morning 🌿</Text>
            <Text style={styles.dashName}>{clientName}</Text>
          </View>

          {/* Glucose Summary Card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>GLUCOSE TODAY</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: avgGlucose ? getGlucoseColor(avgGlucose) : colors.textMuted }]}>
                  {avgGlucose ? Math.round(avgGlucose) : '—'}
                </Text>
                <Text style={styles.statUnit}>avg mg/dL</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.forestGreen }]}>
                  {timeInRange != null ? `${Math.round(timeInRange)}%` : '—'}
                </Text>
                <Text style={styles.statUnit}>in range</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalReadings ?? '—'}</Text>
                <Text style={styles.statUnit}>readings</Text>
              </View>
            </View>

            {/* Latest reading */}
            {latestGlucose && (
              <View style={styles.latestRow}>
                <View style={[styles.latestDot, { backgroundColor: getGlucoseColor(latestGlucose.value ?? latestGlucose.glucose_level) }]} />
                <Text style={styles.latestText}>
                  Latest: {latestGlucose.value ?? latestGlucose.glucose_level} mg/dL
                </Text>
                <Text style={styles.latestTime}>
                  {formatRelativeTime(latestGlucose.measured_at || latestGlucose.timestamp || latestGlucose.created_at)}
                </Text>
              </View>
            )}
          </View>

          {/* Recent Glucose Readings */}
          {glucose.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>RECENT READINGS</Text>
              {glucose.slice(0, 5).map((r, i) => {
                const val = r.value ?? r.glucose_level;
                const dateStr = r.measured_at || r.timestamp || r.created_at;
                return (
                  <View key={i} style={[styles.readingRow, i < glucose.length - 1 && styles.readingRowBorder]}>
                    <View style={[styles.readingColorBar, { backgroundColor: getGlucoseColor(val) }]} />
                    <View style={styles.readingMain}>
                      <Text style={styles.readingVal}>{val} <Text style={styles.readingUnit}>mg/dL</Text></Text>
                      <Text style={styles.readingContext}>{r.meal_context?.replace('_', ' ') || r.context?.replace('_', ' ') || 'General'}</Text>
                    </View>
                    <Text style={styles.readingTime}>{formatRelativeTime(dateStr)}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Recent Symptoms */}
          {symptoms.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>RECENT SYMPTOMS</Text>
              {symptoms.slice(0, 4).map((s, i) => (
                <View key={i} style={[styles.symptomRow, i < symptoms.length - 1 && styles.readingRowBorder]}>
                  <Text style={styles.symptomIcon}>{getSymptomIcon(s.symptom_name || s.name || '')}</Text>
                  <View style={styles.symptomMain}>
                    <Text style={styles.symptomName}>{s.symptom_name || s.name}</Text>
                    <Text style={styles.symptomTime}>{formatRelativeTime(s.logged_at || s.created_at)}</Text>
                  </View>
                  <View style={[styles.severityBadge, { backgroundColor: (s.severity ?? s.intensity) >= 7 ? 'rgba(224,92,92,0.12)' : 'rgba(107,127,110,0.1)' }]}>
                    <Text style={[styles.severityText, { color: (s.severity ?? s.intensity) >= 7 ? '#E05C5C' : colors.forestGreen }]}>
                      {s.severity ?? s.intensity ?? '—'}/10
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Cycle Info */}
          {cycle && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>CYCLE</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{cycle.current_day || cycle.day || '—'}</Text>
                  <Text style={styles.statUnit}>Day</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { fontSize: 16 }]}>{cycle.current_phase || cycle.phase || '—'}</Text>
                  <Text style={styles.statUnit}>Phase</Text>
                </View>
              </View>
            </View>
          )}

          {/* Empty state */}
          {glucose.length === 0 && symptoms.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🌱</Text>
              <Text style={styles.emptyText}>No data logged yet</Text>
              <Text style={styles.emptySubtext}>{clientName?.split(' ')[0]} hasn't logged anything recently</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(212,214,212,0.2)',
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 15, color: colors.forestGreen, fontWeight: '500' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textDark },
  headerSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  previewBanner: {
    backgroundColor: 'rgba(107,127,110,0.12)',
    paddingVertical: 8, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: 'rgba(107,127,110,0.15)',
  },
  previewBannerText: { fontSize: 12, color: colors.forestGreen, fontWeight: '500', textAlign: 'center' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  dashHeader: { marginBottom: 16, paddingHorizontal: 4 },
  dashGreeting: { fontSize: 13, color: colors.textMuted, fontWeight: '400' },
  dashName: { fontSize: 24, fontWeight: '700', color: colors.textDark, marginTop: 2 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: 'rgba(212,214,212,0.25)',
  },
  cardLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.textMuted, marginBottom: 14,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '600', color: colors.textDark },
  statUnit: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(212,214,212,0.4)' },
  latestRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(212,214,212,0.2)',
  },
  latestDot: { width: 8, height: 8, borderRadius: 4 },
  latestText: { flex: 1, fontSize: 13, color: colors.textDark, fontWeight: '500' },
  latestTime: { fontSize: 12, color: colors.textMuted },
  readingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  readingRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(212,214,212,0.15)' },
  readingColorBar: { width: 3, height: 32, borderRadius: 2 },
  readingMain: { flex: 1 },
  readingVal: { fontSize: 15, fontWeight: '600', color: colors.textDark },
  readingUnit: { fontSize: 12, fontWeight: '400', color: colors.textMuted },
  readingContext: { fontSize: 12, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  readingTime: { fontSize: 12, color: colors.textMuted },
  symptomRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  symptomIcon: { fontSize: 22 },
  symptomMain: { flex: 1 },
  symptomName: { fontSize: 14, fontWeight: '600', color: colors.textDark, textTransform: 'capitalize' },
  symptomTime: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  severityText: { fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '600', color: colors.textDark },
  emptySubtext: { fontSize: 14, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
});