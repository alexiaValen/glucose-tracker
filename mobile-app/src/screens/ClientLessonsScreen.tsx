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
import { getMyLessons } from '../services/lessonService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ClientLessons'>;
interface Props { navigation: Nav }

interface Lesson {
  id: string;
  title: string;
  description?: string;
  status: 'assigned' | 'viewed' | 'completed';
  created_at: string;
  viewed_at?: string;
  completed_at?: string;
}

const STATUS_ICONS = {
  assigned: '◦',
  viewed: '◎',
  completed: '✦',
};

const STATUS_COLORS = {
  assigned: colors.gold,
  viewed: colors.sage,
  completed: '#4ADE80',
};

export default function ClientLessonsScreen({ navigation }: Props) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getMyLessons();
      setLessons(Array.isArray(res.data) ? res.data : []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = lessons.filter((l) => l.status !== 'completed');
  const completed = lessons.filter((l) => l.status === 'completed');

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const renderLesson = (lesson: Lesson) => {
    const icon = STATUS_ICONS[lesson.status];
    const accent = STATUS_COLORS[lesson.status];

    return (
      <TouchableOpacity
        key={lesson.id}
        style={styles.lessonCard}
        onPress={() => navigation.navigate('LessonDetail', { lesson })}
        activeOpacity={0.85}
      >
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accent }]} />

        <View style={styles.lessonBody}>
          <View style={styles.lessonTopRow}>
            <Text style={[styles.lessonIcon, { color: accent }]}>{icon}</Text>
            <Text style={styles.lessonDate}>{formatDate(lesson.created_at)}</Text>
          </View>

          <Text style={styles.lessonTitle}>{lesson.title}</Text>

          {lesson.description ? (
            <Text style={styles.lessonPreview} numberOfLines={2}>
              {lesson.description}
            </Text>
          ) : null}

          {lesson.status === 'assigned' && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerLabel}>FROM YOUR COACH</Text>
          <Text style={styles.headerTitle}>Lessons</Text>
        </View>
        {active.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{active.length}</Text>
          </View>
        )}
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
          {lessons.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptySymbol}>◌</Text>
              <Text style={styles.emptyTitle}>No lessons yet</Text>
              <Text style={styles.emptyBody}>
                Your coach will share lessons and session notes here. They'll appear as soon as one is assigned.
              </Text>
            </View>
          ) : (
            <>
              {/* Active lessons */}
              {active.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>TO DO</Text>
                  {active.map(renderLesson)}
                </View>
              )}

              {/* Completed lessons */}
              {completed.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>COMPLETED</Text>
                  {completed.map(renderLesson)}
                </View>
              )}
            </>
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
    fontWeight: '300',
    fontStyle: 'italic',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  countBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 13, fontWeight: '700', color: colors.bg },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 28, paddingHorizontal: 20 },

  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: 14,
  },

  lessonCard: {
    flexDirection: 'row',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accentBar: {
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  lessonBody: {
    flex: 1,
    padding: 16,
  },
  lessonTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  lessonIcon: { fontSize: 16, fontWeight: '700' },
  lessonDate: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },

  lessonTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontStyle: 'italic',
    color: colors.textPrimary,
    letterSpacing: -0.1,
    marginBottom: 6,
  },
  lessonPreview: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },

  newBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(214,199,161,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(214,199,161,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.gold,
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 90,
    paddingHorizontal: 40,
  },
  emptySymbol: {
    fontSize: 48,
    color: colors.glassBorderStrong,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
