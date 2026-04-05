// mobile-app/src/screens/CoachDashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { useCoachStore } from '../stores/coachStore';
import { colors } from '../theme/colors';

type CoachDashboardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CoachDashboard'
>;

interface Props {
  navigation: CoachDashboardScreenNavigationProp;
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

export default function CoachDashboardScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const { clients, isLoading, fetchClients, selectClient } = useCoachStore();
  const [myGroup, setMyGroup] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchClients();
    loadMyGroup();
  }, [fetchClients]);

  const loadMyGroup = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const res = await fetch(`${API_BASE}/groups/coach/my-groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const groups = data.groups ?? [];
      if (groups.length > 0) {
        setMyGroup({ id: groups[0].id, name: groups[0].name });
      }
    } catch (err) {
      console.log('No coach groups found');
    }
  };

  const handleClientPress = (client: any) => {
    selectClient(client);
    navigation.navigate('ClientDetail', { clientId: client.id });
  };

  const navigateToGroupChat = () => {
    if (!myGroup) return;
    navigation.navigate('GroupChat', {
      groupId: myGroup.id,
      groupName: myGroup.name || '12-Week Metabolic Reset',
    });
  };

  const getGlucoseStatus = (avgGlucose: number) => {
    if (avgGlucose < 70) return { text: 'LOW', color: '#EF4444' };
    if (avgGlucose > 180) return { text: 'HIGH', color: '#F59E0B' };
    return { text: 'GOOD', color: '#6B7F6E' };
  };

  const getTimeInRange = (c: any) =>
    c?.recentStats?.timeInRange ??
    c?.recentStats?.in_range_percentage ??
    c?.recentStats?.time_in_range ??
    0;

  const getAvgGlucose = (c: any) =>
    c?.recentStats?.avgGlucose ??
    c?.recentStats?.average ??
    0;

  const getLastReading = (c: any) =>
    c?.recentStats?.lastReading ?? c?.recentStats?.last_reading ?? null;

  const safeClients = Array.isArray(clients) ? clients : [];
  const goodRangeCount = safeClients.filter((c) => getTimeInRange(c) >= 70).length;
  const needsAttentionCount = safeClients.filter((c) => {
    const avg = getAvgGlucose(c);
    const tir = getTimeInRange(c);
    return avg > 180 || avg < 70 || tir < 50;
  }).length;

  return (
    <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.subtitle}>TLC COACH</Text>
            <Text style={styles.greeting}>
              {user?.firstName ? `Hi, ${user.firstName}` : 'Dashboard'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Conversations')}
            >
              <Text style={styles.iconGlyph}>✉</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutText}>Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Coach Quick Actions */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('CreateLesson', {})}
              activeOpacity={0.85}
            >
              <Text style={styles.quickActionIcon}>✎</Text>
              <Text style={styles.quickActionLabel}>New Lesson</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('CoachLessons')}
              activeOpacity={0.85}
            >
              <Text style={styles.quickActionIcon}>◧</Text>
              <Text style={styles.quickActionLabel}>All Lessons</Text>
            </TouchableOpacity>

            {myGroup && (
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() =>
                  navigation.navigate('GroupEvents', {
                    groupId: myGroup.id,
                    groupName: myGroup.name,
                    isCoach: true,
                  })
                }
                activeOpacity={0.85}
              >
                <Text style={styles.quickActionIcon}>📅</Text>
                <Text style={styles.quickActionLabel}>Events</Text>
              </TouchableOpacity>
            )}

            {myGroup && (
              <TouchableOpacity
                style={styles.quickAction}
                onPress={navigateToGroupChat}
                activeOpacity={0.85}
              >
                <Text style={styles.quickActionIcon}>💬</Text>
                <Text style={styles.quickActionLabel}>Group Chat</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Stats Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{safeClients.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statAccent, { backgroundColor: 'rgba(107,127,110,0.1)' }]}>
                  <Text style={[styles.statNumber, styles.statNumberGood]}>{goodRangeCount}</Text>
                  <Text style={styles.statLabel}>In Range</Text>
                  <View style={styles.statusDot} />
                </View>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statAccent, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                  <Text style={[styles.statNumber, styles.statNumberWarning]}>{needsAttentionCount}</Text>
                  <Text style={styles.statLabel}>Needs Care</Text>
                  <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
                </View>
              </View>
            </View>
          </View>

          {/* Client List */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>YOUR CLIENTS</Text>

            {isLoading && safeClients.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6B7F6E" />
              </View>
            ) : safeClients.length === 0 ? (
              <View style={styles.emptyState}>
                <SignalRingThin size={48} muted="rgba(107,127,110,0.2)" />
                <Text style={styles.emptyText}>No clients assigned</Text>
                <Text style={styles.emptySubtext}>Clients will appear here once assigned</Text>
              </View>
            ) : (
              safeClients.map((client: any) => {
                const avg = getAvgGlucose(client);
                const tir = getTimeInRange(client);
                const last = getLastReading(client);
                const status = getGlucoseStatus(avg);

                return (
                  <View key={client.id} style={styles.clientCard}>
                    {/* Client Header */}
                    <View style={styles.clientHeader}>
                      <View style={styles.clientAvatar}>
                        <Text style={styles.clientInitial}>
                          {client.firstName?.charAt(0) ?? '?'}
                        </Text>
                      </View>
                      <View style={styles.clientInfo}>
                        <Text style={styles.clientName}>
                          {client.firstName} {client.lastName}
                        </Text>
                        <Text style={styles.clientEmail}>{client.email}</Text>
                      </View>
                      <View style={styles.statusBadge}>
                        <View style={[styles.statusDotSmall, { backgroundColor: status.color }]} />
                        <Text style={styles.statusText}>{status.text}</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Stats */}
                    <View style={styles.clientStats}>
                      <View style={styles.clientStatItem}>
                        <Text style={styles.clientStatValue}>
                          {Number.isFinite(avg) ? Number(avg).toFixed(0) : '0'}
                        </Text>
                        <Text style={styles.clientStatLabel}>Avg Glucose</Text>
                      </View>
                      <View style={styles.clientStatItem}>
                        <Text style={styles.clientStatValue}>
                          {Number.isFinite(last) ? Number(last).toFixed(0) : '0'}
                        </Text>
                        <Text style={styles.clientStatLabel}>Last Reading</Text>
                      </View>
                      <View style={styles.clientStatItem}>
                        <Text style={styles.clientStatValue}>
                          {Number.isFinite(tir) ? Number(tir).toFixed(0) : '0'}%
                        </Text>
                        <Text style={styles.clientStatLabel}>Time in Range</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Action Buttons */}
                    <View style={styles.clientActions}>
                      <TouchableOpacity
                        style={styles.clientActionBtn}
                        onPress={() => handleClientPress(client)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.clientActionBtnText}>View Data</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.clientActionBtn, styles.clientActionBtnSecondary]}
                        onPress={() => navigation.navigate('Messaging', {
                          userId: client.id,
                          userName: `${client.firstName} ${client.lastName}`.trim(),
                        })}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.clientActionBtnTextSecondary}>Message</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  headerLeft: { flex: 1 },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '300',
    fontStyle: 'italic',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconButton: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.glass,
    borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  iconGlyph: { fontSize: 15, color: colors.textPrimary },
  logoutButton: {
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: colors.glass,
    borderWidth: 1, borderColor: colors.glassBorder,
    justifyContent: 'center',
  },
  logoutText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

  content: { flex: 1 },
  scrollContent: { paddingTop: 20 },

  // Quick actions row
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
    flexWrap: 'wrap',
  },
  quickAction: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  quickActionIcon: { fontSize: 20 },
  quickActionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  summaryCard: {
    marginHorizontal: 20, marginBottom: 24, padding: 20,
    backgroundColor: colors.glass,
    borderRadius: 20,
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, alignItems: 'center' },
  statAccent: {
    width: '100%', padding: 16, borderRadius: 12,
    alignItems: 'center', position: 'relative',
  },
  statNumber: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  statNumberGood: { color: colors.sage },
  statNumberWarning: { color: colors.warning },
  statLabel: { fontSize: 11, fontWeight: '500', color: colors.textMuted },
  statusDot: {
    position: 'absolute', top: 12, right: 12,
    width: 4, height: 4, borderRadius: 2, backgroundColor: colors.sage,
  },

  section: { paddingHorizontal: 20 },
  sectionHeader: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    color: colors.textMuted, marginBottom: 16,
  },
  clientCard: {
    marginBottom: 12, padding: 18,
    backgroundColor: colors.glass,
    borderRadius: 20,
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  clientHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  clientAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.glassSage,
    borderWidth: 1, borderColor: colors.glassBorderStrong,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  clientInitial: { fontSize: 20, fontWeight: '700', color: colors.sage },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 3, letterSpacing: 0.1 },
  clientEmail: { fontSize: 13, color: colors.textMuted },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDotSmall: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.glassBorder, marginBottom: 16 },
  clientStats: { flexDirection: 'row', justifyContent: 'space-around' },
  clientStatItem: { alignItems: 'center' },
  clientStatValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 5 },
  clientStatLabel: { fontSize: 10, fontWeight: '500', color: colors.textMuted },
  clientActions: { flexDirection: 'row', gap: 10 },
  clientActionBtn: {
    flex: 1,
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  clientActionBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
  },
  clientActionBtnText: { fontSize: 13, fontWeight: '700', color: colors.bg, letterSpacing: 0.3 },
  clientActionBtnTextSecondary: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.3 },

  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyText: {
    fontSize: 16, fontWeight: '600', color: colors.textPrimary,
    marginTop: 16, marginBottom: 8, textAlign: 'center',
  },
  emptySubtext: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});