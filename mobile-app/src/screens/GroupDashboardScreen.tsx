// mobile-app/src/screens/GroupDashboardScreen.tsx
// REFACTORED: Matches dashboard design system — cream/sage/forest palette.
// ALL data loading, navigation, and API calls preserved exactly.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { api } from '../config/api';

type Nav   = NativeStackNavigationProp<RootStackParamList, 'GroupDashboard'>;
type Route = RouteProp<RootStackParamList, 'GroupDashboard'>;
interface Props { navigation: Nav; route: Route; }

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
  sageBorder:   'rgba(77,107,84,0.22)',
  gold:         '#8C6E3C',

  ok:           '#3B5E40',
  border:       'rgba(28,30,26,0.09)',
  shadow:       '#18201A',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES (preserved exactly)
// ─────────────────────────────────────────────────────────────────────────────
interface GroupData {
  id: string;
  name: string;
  description: string;
  start_date: string;
  duration_weeks: number;
  meeting_schedule: { day: string; time: string; timezone: string };
}
interface SessionData {
  id: string;
  sessionNumber: number;
  title: string;
  subtitle: string;
  weekNumber: number;
  isUnlocked: boolean;
  isCompleted: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return <Text style={sl.txt}>{text}</Text>;
}
const sl = StyleSheet.create({
  txt: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase', color: T.inkMuted, marginBottom: 12,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function GroupDashboardScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const [group,          setGroup]          = useState<GroupData | null>(null);
  const [sessions,       setSessions]       = useState<SessionData[]>([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [isRefreshing,   setIsRefreshing]   = useState(false);
  const [completedWeeks, setCompletedWeeks] = useState(0);

  useEffect(() => { loadGroupData(); }, [groupId]);

  // ── Logic preserved exactly ────────────────────────────────────────────────
  const loadGroupData = async () => {
    try {
      const [groupResponse, sessionsResponse] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/groups/${groupId}/sessions`),
      ]);
      setGroup(groupResponse.data.group);
      const completed = sessionsResponse.data.sessions.filter(
        (s: any) => s.userProgress?.completed
      ).length;
      setCompletedWeeks(completed);
      const sessionsData: SessionData[] = [
        {
          id: '1', sessionNumber: 1, title: 'Holy',
          subtitle: 'Set Apart by Christ', weekNumber: 1,
          isUnlocked: true,
          isCompleted: sessionsResponse.data.sessions.find(
            (s: any) => s.session_number === 1
          )?.userProgress?.completed || false,
        },
        ...Array.from({ length: 5 }, (_, i) => ({
          id: String(i + 2), sessionNumber: i + 2,
          title: `Session ${i + 2}`, subtitle: 'Coming soon',
          weekNumber: i + 2, isUnlocked: false, isCompleted: false,
        })),
      ];
      setSessions(sessionsData);
    } catch (error) { console.error('Error loading group:', error); }
    finally { setIsLoading(false); setIsRefreshing(false); }
  };

  const handleRefresh = () => { setIsRefreshing(true); loadGroupData(); };

  if (isLoading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator size="large" color={T.sage} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={s.errorWrap}>
        <Text style={s.errorTxt}>Group not found</Text>
        <TouchableOpacity style={s.errorBtn} onPress={() => navigation.goBack()}>
          <Text style={s.errorBtnTxt}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progressPct = (completedWeeks / group.duration_weeks) * 100;

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* ── HEADER ────────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>{group.name}</Text>
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={T.sage} />
          }
        >

          {/* ── HERO CARD ─────────────────────────────────────────── */}
          <View style={s.heroCard}>
            {/* Enrolled badge */}
            <View style={s.enrolledBadge}>
              <Text style={s.enrolledTxt}>ENROLLED</Text>
            </View>

            <Text style={s.groupName}>{group.name}</Text>

            {/* Group chat CTA */}
            <TouchableOpacity
              style={s.chatBtn}
              onPress={() =>
                navigation.getParent()?.navigate('GroupChat', { groupId, groupName: group.name })
              }
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 20 }}>💬</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.chatBtnLabel}>Group Chat</Text>
                <Text style={s.chatBtnSub}>Message your group</Text>
              </View>
              <Text style={s.chatBtnArrow}>→</Text>
            </TouchableOpacity>

            {/* Progress */}
            <View style={s.progressSection}>
              <View style={s.progressHeaderRow}>
                <Text style={s.progressLabel}>YOUR PROGRESS</Text>
                <Text style={s.progressCount}>
                  Week {completedWeeks} of {group.duration_weeks}
                </Text>
              </View>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${progressPct}%` }]} />
              </View>
            </View>
          </View>

          {/* ── WEEKLY SESSIONS ───────────────────────────────────── */}
          <SectionLabel text="Weekly Sessions" />

          <View style={s.sessionList}>
            {sessions.map(session => (
              <TouchableOpacity
                key={session.id}
                style={[s.sessionCard, !session.isUnlocked && s.sessionCardLocked]}
                onPress={() => {
                  if (session.isUnlocked) {
                    navigation.navigate('SessionDetail', { groupId, sessionId: session.id });
                  }
                }}
                activeOpacity={session.isUnlocked ? 0.85 : 1}
                disabled={!session.isUnlocked}
              >
                {/* Icon */}
                <View style={s.sessionIconWrap}>
                  {session.isUnlocked ? (
                    <View style={[
                      s.sessionIcon,
                      session.isCompleted && s.sessionIconDone,
                    ]}>
                      {session.isCompleted
                        ? <Text style={s.sessionCheck}>✓</Text>
                        : <Text style={{ fontSize: 28 }}>🪷</Text>
                      }
                    </View>
                  ) : (
                    <View style={s.sessionIconLocked}>
                      <Text style={{ fontSize: 22, opacity: 0.35 }}>🔒</Text>
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={s.sessionInfo}>
                  <View style={s.sessionTopRow}>
                    <Text style={[
                      s.sessionWeek,
                      !session.isUnlocked && s.sessionWeekLocked,
                    ]}>
                      WEEK {session.weekNumber}
                    </Text>
                    {session.isCompleted && (
                      <View style={s.completedBadge}>
                        <Text style={s.completedBadgeTxt}>COMPLETED</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[
                    s.sessionTitle,
                    !session.isUnlocked && s.sessionTitleLocked,
                  ]}>
                    {session.title}
                  </Text>
                  <Text style={[
                    s.sessionSub,
                    !session.isUnlocked && s.sessionSubLocked,
                  ]}>
                    {session.subtitle}
                  </Text>
                </View>

                {/* Arrow */}
                {session.isUnlocked && !session.isCompleted && (
                  <Text style={s.sessionArrow}>→</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

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
  root:        { flex: 1, backgroundColor: T.pageBg },
  safe:        { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.pageBg },
  errorWrap:   { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: T.pageBg },
  errorTxt:    { fontSize: 16, color: T.inkMuted, marginBottom: 20 },
  errorBtn:    { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: T.cardForest, borderRadius: 12 },
  errorBtnTxt: { color: T.inkOnDark, fontSize: 15, fontWeight: '600' },

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
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: T.inkDark, letterSpacing: -0.2 },

  content: { paddingHorizontal: 20, paddingTop: 24 },

  // Hero card
  heroCard: {
    backgroundColor: T.cardCream,
    borderRadius: 20, borderWidth: 1, borderColor: T.border,
    padding: 22, marginBottom: 28,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  enrolledBadge: {
    alignSelf: 'flex-start',
    backgroundColor: T.sageLight, borderWidth: 1, borderColor: T.sageBorder,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, marginBottom: 14,
  },
  enrolledTxt: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: T.sage },
  groupName: {
    fontSize: 22, fontWeight: '600',
    color: T.inkDark, letterSpacing: -0.3,
    marginBottom: 18, lineHeight: 28,
  },

  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: T.sageLight,
    borderRadius: 14, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: T.sageBorder,
  },
  chatBtnLabel: { fontSize: 14, fontWeight: '600', color: T.forest },
  chatBtnSub:   { fontSize: 11, color: T.inkMuted, marginTop: 1 },
  chatBtnArrow: { fontSize: 16, color: T.sage },

  progressSection:  { marginTop: 2 },
  progressHeaderRow:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel:    {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.2,
    textTransform: 'uppercase', color: T.inkMuted,
  },
  progressCount: { fontSize: 13, fontWeight: '600', color: T.inkMid },
  progressTrack: {
    height: 6, backgroundColor: T.cardTan,
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: T.sage, borderRadius: 3 },

  // Session list
  sessionList: { gap: 10, marginBottom: 8 },
  sessionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.cardCream,
    borderRadius: 18, borderWidth: 1, borderColor: T.border,
    padding: 18,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  sessionCardLocked: { opacity: 0.55, backgroundColor: T.cardOffWhite },

  sessionIconWrap: { marginRight: 16 },
  sessionIcon: {
    width: 54, height: 54, borderRadius: 15,
    backgroundColor: T.sageLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: T.sageBorder,
  },
  sessionIconDone: { backgroundColor: 'rgba(59,94,64,0.12)' },
  sessionIconLocked: {
    width: 54, height: 54, borderRadius: 15,
    backgroundColor: T.cardTan,
    alignItems: 'center', justifyContent: 'center',
  },
  sessionCheck: { fontSize: 26, color: T.ok, fontWeight: '700' },

  sessionInfo:   { flex: 1 },
  sessionTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sessionWeek: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.2,
    textTransform: 'uppercase', color: T.sage, marginRight: 8,
  },
  sessionWeekLocked: { color: T.inkMuted },
  completedBadge: {
    backgroundColor: T.sageLight, borderWidth: 1, borderColor: T.sageBorder,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },
  completedBadgeTxt: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5, color: T.sage },

  sessionTitle:      { fontSize: 16, fontWeight: '600', color: T.inkDark, marginBottom: 3, letterSpacing: 0.1 },
  sessionTitleLocked:{ color: T.inkMuted },
  sessionSub:        { fontSize: 13, color: T.inkMid, lineHeight: 18 },
  sessionSubLocked:  { color: T.inkMuted },
  sessionArrow:      { fontSize: 18, color: T.sage, fontWeight: '500', marginLeft: 12 },
});