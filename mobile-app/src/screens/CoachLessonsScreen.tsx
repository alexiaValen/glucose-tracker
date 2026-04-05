import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { getCoachLessons } from '../services/lessonService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CoachLessons'>;
interface Props { navigation: Nav }

interface Lesson {
  id: string;
  title: string;
  description: string;
  client_id: string;
  status: string;
  created_at: string;
  viewed_at?: string;
  completed_at?: string;
}

const STATUS_COLORS: Record<string, string> = {
  assigned: colors.gold,
  viewed: colors.sage,
  completed: '#4ADE80',
};

const STATUS_LABELS: Record<string, string> = {
  assigned: 'Assigned',
  viewed: 'Viewed',
  completed: 'Completed',
};

function groupByClient(lessons: Lesson[]): Record<string, Lesson[]> {
  return lessons.reduce<Record<string, Lesson[]>>((acc, l) => {
    const key = l.client_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(l);
    return acc;
  }, {});
}

export default function CoachLessonsScreen({ navigation }: Props) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'viewed' | 'completed'>('all');

  const load = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getCoachLessons();
      setLessons(Array.isArray(res.data) ? res.data : []);
    } catch {
      // silently fail — list will be empty
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filter === 'all' ? lessons : lessons.filter((l) => l.status === filter);
  const grouped = groupByClient(filtered);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerLabel}>COACH</Text>
          <Text style={styles.headerTitle}>Lessons</Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('CreateLesson', {})}
        >
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'assigned', 'viewed', 'completed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'all' ? `All (${lessons.length})` : STATUS_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.sage} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.sage}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>No lessons yet</Text>
              <Text style={styles.emptyBody}>
                Create your first lesson to share notes and guidance with your clients.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('CreateLesson', {})}
              >
                <Text style={styles.emptyBtnText}>Create Lesson</Text>
              </TouchableOpacity>
            </View>
          ) : (
            Object.entries(grouped).map(([clientId, clientLessons]) => (
              <View key={clientId} style={styles.clientGroup}>
                <View style={styles.clientGroupHeader}>
                  <View style={styles.clientDot} />
                  <Text style={styles.clientGroupLabel}>
                    {clientLessons.length} lesson{clientLessons.length !== 1 ? 's' : ''}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('CreateLesson', {
                        clientId,
                        clientName: undefined,
                      })
                    }
                  >
                    <Text style={styles.addForClient}>+ Add</Text>
                  </TouchableOpacity>
                </View>

                {clientLessons.map((lesson) => (
                  <TouchableOpacity
                    key={lesson.id}
                    style={styles.lessonCard}
                    onPress={() =>
                      navigation.navigate('CreateLesson', {
                        clientId: lesson.client_id,
                        lessonId: lesson.id,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    {/* Status pill */}
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: `${STATUS_COLORS[lesson.status] ?? colors.textMuted}20` },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: STATUS_COLORS[lesson.status] ?? colors.textMuted },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: STATUS_COLORS[lesson.status] ?? colors.textMuted },
                        ]}
                      >
                        {STATUS_LABELS[lesson.status] ?? lesson.status}
                      </Text>
                    </View>

                    <Text style={styles.lessonTitle}>{lesson.title}</Text>

                    {lesson.description ? (
                      <Text style={styles.lessonPreview} numberOfLines={2}>
                        {lesson.description}
                      </Text>
                    ) : null}

                    <View style={styles.lessonMeta}>
                      <Text style={styles.lessonDate}>
                        Created {formatDate(lesson.created_at)}
                      </Text>
                      {lesson.completed_at && (
                        <Text style={[styles.lessonDate, { color: '#4ADE80' }]}>
                          Completed {formatDate(lesson.completed_at)}
                        </Text>
                      )}
                      {lesson.viewed_at && !lesson.completed_at && (
                        <Text style={[styles.lessonDate, { color: colors.sage }]}>
                          Viewed {formatDate(lesson.viewed_at)}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: colors.textPrimary },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  newBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  newBtnText: { fontSize: 13, fontWeight: '700', color: colors.bg },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  filterChipActive: {
    backgroundColor: colors.glassSage,
    borderColor: colors.glassBorderStrong,
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  filterChipTextActive: { color: colors.textPrimary },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 20, paddingHorizontal: 20 },

  clientGroup: { marginBottom: 28 },
  clientGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  clientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.sage,
  },
  clientGroupLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  addForClient: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gold,
  },

  lessonCard: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
    gap: 5,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.1,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  lessonPreview: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  lessonMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  lessonDate: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: colors.bg },
});
