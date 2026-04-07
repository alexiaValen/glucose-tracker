// mobile-app/src/screens/LessonDetailScreen.tsx
// REFACTORED: Matches dashboard design system — cream/sage/forest palette.
// Default export. ALL logic preserved exactly.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { markLessonViewed, markLessonCompleted } from '../services/lessonService';

type Props = {
  route:      RouteProp<RootStackParamList, 'LessonDetail'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'LessonDetail'>;
};

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  pageBg:     '#F0EBE0',
  cardCream:  '#F8F4EC',
  cardSage:   '#E2E8DF',
  cardTan:    '#DDD3C0',
  inkDark:    '#1C1E1A',
  inkMid:     '#484B44',
  inkMuted:   '#8A8E83',
  forest:     '#2C4435',
  sage:       '#4D6B54',
  sageLight:  'rgba(77,107,84,0.10)',
  sageBorder: 'rgba(77,107,84,0.22)',
  gold:       '#8C6E3C',
  goldLight:  'rgba(140,110,60,0.10)',
  ok:         '#3B5E40',
  okLight:    'rgba(59,94,64,0.10)',
  border:     'rgba(28,30,26,0.09)',
  shadow:     '#18201A',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function LessonDetailScreen({ route, navigation }: Props) {
  const { lesson } = route.params;
  const [isCompleted, setIsCompleted] = useState(lesson.status === 'completed');
  const [completing,  setCompleting]  = useState(false);

  // Logic preserved exactly
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
      month: 'long', day: 'numeric', year: 'numeric',
    });
  };

  // Status derived values
  const statusColor =
    isCompleted             ? T.ok   :
    lesson.status === 'viewed' ? T.sage : T.gold;
  const statusLabel =
    isCompleted             ? '✓ Completed' :
    lesson.status === 'viewed' ? 'Viewed'      : 'New';
  const statusBg =
    isCompleted             ? T.okLight   :
    lesson.status === 'viewed' ? T.sageLight : T.goldLight;

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerLabel}>LESSON</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Status row */}
          <View style={s.statusRow}>
            <View style={[s.statusPill, { backgroundColor: statusBg }]}>
              <Text style={[s.statusTxt, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            {lesson.created_at && (
              <Text style={s.dateTxt}>{formatDate(lesson.created_at)}</Text>
            )}
          </View>

          {/* Title */}
          <Text style={s.title}>{lesson.title}</Text>
          <View style={s.divider} />

          {/* Content card */}
          <View style={s.contentCard}>
            <Text style={s.contentLabel}>SESSION NOTES</Text>
            {lesson.description ? (
              <Text style={s.contentTxt}>{lesson.description}</Text>
            ) : (
              <Text style={s.contentEmpty}>No notes added for this lesson yet.</Text>
            )}
          </View>

          {/* CTA */}
          {isCompleted ? (
            <View style={s.completedBanner}>
              <Text style={s.completedStar}>✦</Text>
              <View>
                <Text style={s.completedTitle}>Lesson complete</Text>
                {lesson.completed_at && (
                  <Text style={s.completedDate}>{formatDate(lesson.completed_at)}</Text>
                )}
              </View>
            </View>
          ) : (
            <View style={s.ctaArea}>
              <Text style={s.ctaHint}>
                When you've gone through this content, mark it as complete so your coach can see your progress.
              </Text>
              <TouchableOpacity
                style={[s.completeBtn, completing && { opacity: 0.6 }]}
                onPress={handleComplete}
                disabled={completing}
                activeOpacity={0.85}
              >
                {completing
                  ? <ActivityIndicator size="small" color={T.inkDark} />
                  : <Text style={s.completeBtnTxt}>Mark as Complete</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 60 }} />
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
    paddingTop: 12, paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: T.border,
    backgroundColor: T.pageBg, gap: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: T.cardCream,
    borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow:   { fontSize: 17, color: T.inkMid },
  headerLabel: {
    fontSize: 10, fontWeight: '700',
    letterSpacing: 1.5, color: T.inkMuted,
  },
  content: { paddingHorizontal: 24, paddingTop: 28 },

  statusRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 18,
  },
  statusPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusTxt:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  dateTxt:    { fontSize: 12, color: T.inkMuted },

  title: {
    fontSize: 26, fontWeight: '300',
    fontStyle: 'italic', color: T.inkDark,
    letterSpacing: -0.3, lineHeight: 34, marginBottom: 24,
  },
  divider: { height: 1, backgroundColor: T.border, marginBottom: 24 },

  contentCard: {
    backgroundColor: T.cardCream,
    borderRadius: 16, borderWidth: 1, borderColor: T.border,
    padding: 20, marginBottom: 28,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  contentLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase', color: T.inkMuted, marginBottom: 12,
  },
  contentTxt:   { fontSize: 15, color: T.inkMid, lineHeight: 24 },
  contentEmpty: {
    fontSize: 14, color: T.inkMuted,
    fontStyle: 'italic', textAlign: 'center', paddingVertical: 10,
  },

  ctaArea: { marginBottom: 20 },
  ctaHint: {
    fontSize: 13, color: T.inkMuted,
    lineHeight: 20, marginBottom: 16, textAlign: 'center',
  },
  completeBtn: {
    backgroundColor: T.cardTan,
    borderWidth: 1, borderColor: T.border,
    paddingVertical: 16, borderRadius: 16, alignItems: 'center',
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  completeBtnTxt: { fontSize: 15, fontWeight: '700', color: T.forest, letterSpacing: 0.2 },

  completedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: T.okLight,
    borderWidth: 1, borderColor: 'rgba(59,94,64,0.22)',
    borderRadius: 16, padding: 18,
  },
  completedStar:  { fontSize: 22, color: T.ok },
  completedTitle: { fontSize: 15, fontWeight: '600', color: T.ok, marginBottom: 3 },
  completedDate:  { fontSize: 12, color: T.inkMuted },
});