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

export default function GroupDashboardScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const [group, setGroup] = useState<GroupData | null>(null);
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
        api.get(`/groups/${groupId}/sessions`)
      ]);

      setGroup(groupResponse.data.group);

      // Count completed sessions
      const completed = sessionsResponse.data.sessions.filter(
        (s: any) => s.userProgress?.completed
      ).length;
      setCompletedWeeks(completed);
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

  const getProgressPercentage = (): number => {
    if (!group) return 0;
    return (completedWeeks / group.duration_weeks) * 100;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <BotanicalBackground variant="subtle" intensity="light">
      <View style={styles.container}>
        {/* Header */}
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
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.sage} />
          }
        >
          {/* Group Hero */}
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.foundingBadge}>
                <Text style={styles.foundingBadgeText}>FOUNDING MEMBER</Text>
              </View>
            </View>

            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupDates}>
              Starts {formatDate(group.start_date)} • {group.duration_weeks} weeks
            </Text>

            {/* Progress Bar */}
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
                    { width: `${getProgressPercentage()}%` }
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('GroupSessions', { groupId })}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>📚</Text>
              </View>
              <Text style={styles.actionTitle}>Sessions</Text>
              <Text style={styles.actionSubtitle}>
                {completedWeeks}/{group.duration_weeks} complete
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('GroupChat', { groupId })}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>💬</Text>
              </View>
              <Text style={styles.actionTitle}>Group Chat</Text>
              <Text style={styles.actionSubtitle}>Community</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('GroupMembers', { groupId })}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>👥</Text>
              </View>
              <Text style={styles.actionTitle}>Members</Text>
              <Text style={styles.actionSubtitle}>Connect</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {/* Navigate to progress */}}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>📊</Text>
              </View>
              <Text style={styles.actionTitle}>My Progress</Text>
              <Text style={styles.actionSubtitle}>Track journey</Text>
            </TouchableOpacity>
          </View>

          {/* Meeting Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>WEEKLY MEETINGS</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Day:</Text>
              <Text style={styles.infoValue}>{group.meeting_schedule.day}s</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time:</Text>
              <Text style={styles.infoValue}>
                {group.meeting_schedule.time} {group.meeting_schedule.timezone}
              </Text>
            </View>
            <Text style={styles.infoHelper}>
              Zoom link will be shared before each session
            </Text>
          </View>

          {/* Description */}
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>ABOUT THIS PROGRAM</Text>
            <Text style={styles.descriptionText}>{group.description}</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.cream,
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(42,45,42,0.6)',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.sage,
    borderRadius: 12,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,214,212,0.25)',
  },
  backText: {
    color: colors.sage,
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  foundingBadge: {
    backgroundColor: 'rgba(184,154,90,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  foundingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.accent,
  },
  groupName: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
    lineHeight: 32,
  },
  groupDates: {
    fontSize: 14,
    color: 'rgba(42,45,42,0.6)',
    marginBottom: 24,
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: 'rgba(42,45,42,0.5)',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(212,214,212,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.sage,
    borderRadius: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(107,127,110,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionEmoji: {
    fontSize: 28,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(42,45,42,0.6)',
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: 'rgba(42,45,42,0.5)',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: 'rgba(42,45,42,0.6)',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  infoHelper: {
    fontSize: 12,
    color: 'rgba(42,45,42,0.5)',
    fontStyle: 'italic',
    marginTop: 8,
  },
  descriptionCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
  },
  descriptionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: 'rgba(42,45,42,0.5)',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: 'rgba(42,45,42,0.7)',
    lineHeight: 22,
  },
});