// mobile-app/src/screens/GroupDashboardScreen.tsx

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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { BotanicalBackground } from '../components/BotanicalBackground';
import { colors } from '../theme/colors';
import { api } from '../config/api';

type GroupDashboardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'GroupDashboard'
>;
type GroupDashboardScreenRouteProp = RouteProp<RootStackParamList, 'GroupDashboard'>;

interface Props {
  navigation: GroupDashboardScreenNavigationProp;
  route: GroupDashboardScreenRouteProp;
}

interface GroupData {
  id: string;
  name: string;
  description: string;
  start_date: string;
  duration_weeks: number;
  meeting_schedule: {
    day: string;
    time: string;
    timezone: string;
  };
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

export default function GroupDashboardScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const [group, setGroup] = useState<GroupData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [completedWeeks, setCompletedWeeks] = useState(0);

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

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
          id: '1',
          sessionNumber: 1,
          title: 'Holy',
          subtitle: 'Set Apart by Christ',
          weekNumber: 1,
          isUnlocked: true,
          isCompleted:
            sessionsResponse.data.sessions.find((s: any) => s.session_number === 1)
              ?.userProgress?.completed || false,
        },
        ...Array.from({ length: 5 }, (_, i) => ({
          id: String(i + 2),
          sessionNumber: i + 2,
          title: `Session ${i + 2}`,
          subtitle: 'Coming soon',
          weekNumber: i + 2,
          isUnlocked: false,
          isCompleted: false,
        })),
      ];

      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading group:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadGroupData();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.sage} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Group not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.sage}
            />
          }
        >
          {/* Program Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.enrolledBadge}>
              <Text style={styles.enrolledBadgeText}>ENROLLED</Text>
            </View>

            <Text style={styles.groupName}>{group.name}</Text>

            {/* Group Chat Button */}
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() =>
  navigation.getParent()?.navigate('GroupChat', {
    groupId,
    groupName: group.name,
  })
}
              activeOpacity={0.85}
            >
              <Text style={styles.chatButtonEmoji}>💬</Text>
              <View style={styles.chatButtonContent}>
                <Text style={styles.chatButtonLabel}>Group Chat</Text>
                <Text style={styles.chatButtonSub}>Message your group</Text>
              </View>
              <Text style={styles.chatButtonArrow}>→</Text>
            </TouchableOpacity>

            {/* Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>YOUR PROGRESS</Text>
                <Text style={styles.progressText}>
                  Week {completedWeeks} of {group.duration_weeks}
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${(completedWeeks / group.duration_weeks) * 100}%` },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Weekly Sessions */}
          <View style={styles.sessionsSection}>
            <Text style={styles.sectionTitle}>WEEKLY SESSIONS</Text>
            {sessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={[
                  styles.sessionCard,
                  !session.isUnlocked && styles.sessionCardLocked,
                ]}
                onPress={() => {
                  if (session.isUnlocked) {
                    navigation.navigate('SessionDetail', {
                      groupId,
                      sessionId: session.id,
                    });
                  }
                }}
                activeOpacity={session.isUnlocked ? 0.85 : 1}
                disabled={!session.isUnlocked}
              >
                <View style={styles.sessionIconContainer}>
                  {session.isUnlocked ? (
                    <View
                      style={[
                        styles.sessionIcon,
                        session.isCompleted && styles.sessionIconCompleted,
                      ]}
                    >
                      {session.isCompleted ? (
                        <Text style={styles.sessionCheckmark}>✓</Text>
                      ) : (
                        <Text style={styles.sessionIconEmoji}>🪷</Text>
                      )}
                    </View>
                  ) : (
                    <View style={styles.sessionIconLocked}>
                      <Text style={styles.sessionLockIcon}>🔒</Text>
                    </View>
                  )}
                </View>

                <View style={styles.sessionInfo}>
                  <View style={styles.sessionHeader}>
                    <Text
                      style={[
                        styles.sessionNumber,
                        !session.isUnlocked && styles.sessionNumberLocked,
                      ]}
                    >
                      WEEK {session.weekNumber}
                    </Text>
                    {session.isCompleted && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedBadgeText}>COMPLETED</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.sessionTitle,
                      !session.isUnlocked && styles.sessionTitleLocked,
                    ]}
                  >
                    {session.title}
                  </Text>
                  <Text
                    style={[
                      styles.sessionSubtitle,
                      !session.isUnlocked && styles.sessionSubtitleLocked,
                    ]}
                  >
                    {session.subtitle}
                  </Text>
                </View>

                {session.isUnlocked && !session.isCompleted && (
                  <View style={styles.sessionArrow}>
                    <Text style={styles.sessionArrowText}>→</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.cream },
  errorText: { fontSize: 16, color: 'rgba(42,45,42,0.6)', marginBottom: 20 },
  backButton: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.sage, borderRadius: 12 },
  backButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(212,214,212,0.25)',
  },
  backText: { color: colors.sage, fontSize: 16, fontWeight: '500' },
  content: { flex: 1 },
  scrollContent: { padding: 20 },

  // Hero Card
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 24, padding: 24, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  enrolledBadge: {
    backgroundColor: 'rgba(107,127,110,0.15)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12, alignSelf: 'flex-start', marginBottom: 16,
  },
  enrolledBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#6B7F6E' },
  groupName: { fontSize: 26, fontWeight: '700', color: colors.ink, marginBottom: 20, lineHeight: 32 },

  // Chat Button
  chatButton: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(107,127,110,0.08)',
    borderRadius: 16, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(107,127,110,0.2)',
  },
  chatButtonEmoji: { fontSize: 22 },
  chatButtonContent: { flex: 1 },
  chatButtonLabel: { fontSize: 15, fontWeight: '600', color: colors.forestGreen },
  chatButtonSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  chatButtonArrow: { fontSize: 18, color: colors.sage },

  // Progress
  progressSection: { marginTop: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, color: 'rgba(42,45,42,0.5)' },
  progressText: { fontSize: 14, fontWeight: '600', color: colors.ink },
  progressBarContainer: { height: 8, backgroundColor: 'rgba(212,214,212,0.3)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.sage, borderRadius: 4 },

  // Sessions
  sessionsSection: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase',
    color: 'rgba(42,45,42,0.5)', marginBottom: 16,
  },
  sessionCard: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 20, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  sessionCardLocked: { opacity: 0.6, backgroundColor: 'rgba(255,255,255,0.7)' },
  sessionIconContainer: { marginRight: 16 },
  sessionIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: 'rgba(107,127,110,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  sessionIconCompleted: { backgroundColor: 'rgba(107,127,110,0.2)' },
  sessionIconEmoji: { fontSize: 32 },
  sessionIconLocked: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: 'rgba(42,45,42,0.05)', alignItems: 'center', justifyContent: 'center',
  },
  sessionLockIcon: { fontSize: 24, opacity: 0.4 },
  sessionCheckmark: { fontSize: 28, color: '#6B7F6E', fontWeight: '700' },
  sessionInfo: { flex: 1 },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sessionNumber: {
    fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase',
    color: 'rgba(107,127,110,0.7)', marginRight: 8,
  },
  sessionNumberLocked: { color: 'rgba(42,45,42,0.4)' },
  completedBadge: { backgroundColor: 'rgba(107,127,110,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  completedBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, color: '#6B7F6E' },
  sessionTitle: { fontSize: 17, fontWeight: '600', color: '#2B2B2B', marginBottom: 4, letterSpacing: 0.2 },
  sessionTitleLocked: { color: 'rgba(42,45,42,0.4)' },
  sessionSubtitle: { fontSize: 14, lineHeight: 18, color: 'rgba(42,45,42,0.6)' },
  sessionSubtitleLocked: { color: 'rgba(42,45,42,0.35)' },
  sessionArrow: { marginLeft: 12 },
  sessionArrowText: { fontSize: 20, color: '#6B7F6E', fontWeight: '600' },
});