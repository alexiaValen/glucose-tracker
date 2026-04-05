import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { markLessonViewed, markLessonCompleted } from '../services/lessonService';

type Props = {
  route: RouteProp<RootStackParamList, 'LessonDetail'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'LessonDetail'>;
};

export default function LessonDetailScreen({ route, navigation }: Props) {
  const { lesson } = route.params;
  const [isCompleted, setIsCompleted] = useState(lesson.status === 'completed');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (lesson?.status === 'assigned') {
      markLessonViewed(lesson.id).catch(() => {});
    }
  }, []);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await markLessonCompleted(lesson.id);
      setIsCompleted(true);
    } finally {
      setCompleting(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerLabel}>LESSON</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status badge */}
        <View style={styles.statusRow}>
          {isCompleted ? (
            <View style={[styles.statusPill, styles.statusPillCompleted]}>
              <Text style={[styles.statusText, { color: '#4ADE80' }]}>✓ Completed</Text>
            </View>
          ) : lesson.status === 'viewed' ? (
            <View style={[styles.statusPill, styles.statusPillViewed]}>
              <Text style={[styles.statusText, { color: colors.sage }]}>Viewed</Text>
            </View>
          ) : (
            <View style={[styles.statusPill, styles.statusPillNew]}>
              <Text style={[styles.statusText, { color: colors.gold }]}>New</Text>
            </View>
          )}
          {lesson.created_at && (
            <Text style={styles.dateText}>{formatDate(lesson.created_at)}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{lesson.title}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Content */}
        {lesson.description ? (
          <View style={styles.contentCard}>
            <Text style={styles.contentLabel}>SESSION NOTES</Text>
            <Text style={styles.contentText}>{lesson.description}</Text>
          </View>
        ) : (
          <View style={styles.contentCard}>
            <Text style={styles.emptyContent}>No notes added for this lesson yet.</Text>
          </View>
        )}

        {/* Completion CTA */}
        <View style={styles.ctaArea}>
          {isCompleted ? (
            <View style={styles.completedBanner}>
              <Text style={styles.completedBannerEmoji}>✦</Text>
              <View>
                <Text style={styles.completedBannerTitle}>Lesson complete</Text>
                {lesson.completed_at && (
                  <Text style={styles.completedBannerDate}>
                    {formatDate(lesson.completed_at)}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.ctaHint}>
                When you've gone through this content, mark it as complete so your coach can see your progress.
              </Text>
              <TouchableOpacity
                style={[styles.completeBtn, completing && { opacity: 0.6 }]}
                onPress={handleComplete}
                disabled={completing}
                activeOpacity={0.85}
              >
                {completing ? (
                  <ActivityIndicator size="small" color={colors.bg} />
                ) : (
                  <Text style={styles.completeBtnText}>Mark as Complete</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
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
    gap: 14,
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
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textMuted,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 28 },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusPillNew: { backgroundColor: 'rgba(214,199,161,0.12)' },
  statusPillViewed: { backgroundColor: 'rgba(110,143,122,0.12)' },
  statusPillCompleted: { backgroundColor: 'rgba(74,222,128,0.10)' },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  dateText: { fontSize: 12, color: colors.textMuted },

  title: {
    fontSize: 26,
    fontWeight: '300',
    fontStyle: 'italic',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 34,
    marginBottom: 24,
  },

  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginBottom: 24,
  },

  contentCard: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  contentLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: 12,
  },
  contentText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  emptyContent: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },

  ctaArea: { marginBottom: 20 },
  ctaHint: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  completeBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  completeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.bg,
    letterSpacing: 0.3,
  },

  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
    borderRadius: 16,
    padding: 18,
  },
  completedBannerEmoji: { fontSize: 22, color: '#4ADE80' },
  completedBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4ADE80',
    marginBottom: 3,
  },
  completedBannerDate: { fontSize: 12, color: colors.textMuted },
});
