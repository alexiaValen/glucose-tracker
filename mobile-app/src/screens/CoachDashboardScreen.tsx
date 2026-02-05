// mobile-app/src/screens/CoachDashboardScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { useCoachStore } from '../stores/coachStore';
import { BotanicalBackground } from '../components/BotanicalBackground';
import { SignalRingThin } from '../components/icons';

type CoachDashboardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CoachDashboard'
>;

interface Props {
  navigation: CoachDashboardScreenNavigationProp;
}

export default function CoachDashboardScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const { clients, isLoading, fetchClients, selectClient } = useCoachStore();

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleClientPress = (client: any) => {
    selectClient(client);
    navigation.navigate('ClientDetail', { clientId: client.id });
  };

  const getGlucoseStatus = (avgGlucose: number) => {
    if (avgGlucose < 70) return { text: 'LOW', color: '#EF4444' };
    if (avgGlucose > 180) return { text: 'HIGH', color: '#F59E0B' };
    return { text: 'GOOD', color: '#6B7F6E' };
  };

  // ✅ Safe accessors (recentStats can be missing)
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
    <BotanicalBackground variant="green" intensity="light">
      <View style={styles.container}>
        {/* Minimal Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.greetingContainer}>
              <SignalRingThin size={20} muted="rgba(107,127,110,0.15)" />
              <View>
                <Text style={styles.subtitle}>COACH DASHBOARD</Text>
                <Text style={styles.greeting}>Welcome, {user?.firstName}</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Conversations')}
            >
              <Text style={styles.iconGlyph}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{safeClients.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>

              <View style={styles.statBox}>
                <View
                  style={[
                    styles.statAccent,
                    { backgroundColor: 'rgba(107,127,110,0.1)' },
                  ]}
                >
                  <Text style={[styles.statNumber, styles.statNumberGood]}>
                    {goodRangeCount}
                  </Text>
                  <Text style={styles.statLabel}>In Range</Text>
                  <View style={styles.statusDot} />
                </View>
              </View>

              <View style={styles.statBox}>
                <View
                  style={[
                    styles.statAccent,
                    { backgroundColor: 'rgba(245,158,11,0.1)' },
                  ]}
                >
                  <Text style={[styles.statNumber, styles.statNumberWarning]}>
                    {needsAttentionCount}
                  </Text>
                  <Text style={styles.statLabel}>Needs Care</Text>
                  <View
                    style={[styles.statusDot, { backgroundColor: '#F59E0B' }]}
                  />
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
                <Text style={styles.emptySubtext}>
                  Clients will appear here once assigned
                </Text>
              </View>
            ) : (
              safeClients.map((client: any) => {
                const avg = getAvgGlucose(client);
                const tir = getTimeInRange(client);
                const last = getLastReading(client);

                const status = getGlucoseStatus(avg);

                return (
                  <TouchableOpacity
                    key={client.id}
                    style={styles.clientCard}
                    onPress={() => handleClientPress(client)}
                    activeOpacity={0.85}
                  >
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
                        <View
                          style={[
                            styles.statusDotSmall,
                            { backgroundColor: status.color },
                          ]}
                        />
                        <Text style={styles.statusText}>{status.text}</Text>
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Client Stats */}
                    <View style={styles.clientStats}>
                      <View style={styles.clientStatItem}>
                        <Text style={styles.clientStatValue}>
                          {Number.isFinite(avg) ? Number(avg).toFixed(0) : '—'}
                        </Text>
                        <Text style={styles.clientStatLabel}>Avg Glucose</Text>
                      </View>

                      <View style={styles.clientStatItem}>
                        <Text style={styles.clientStatValue}>
                          {Number.isFinite(last) ? Number(last).toFixed(0) : '—'}
                        </Text>
                        <Text style={styles.clientStatLabel}>Last Reading</Text>
                      </View>

                      <View style={styles.clientStatItem}>
                        <Text style={styles.clientStatValue}>
                          {Number.isFinite(tir) ? Number(tir).toFixed(0) : '—'}%
                        </Text>
                        <Text style={styles.clientStatLabel}>Time in Range</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,214,212,0.25)',
  },
  headerLeft: { flex: 1 },
  greetingContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(42,45,42,0.5)',
    marginBottom: 6,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: '#2B2B2B',
  },

  headerActions: { flexDirection: 'row', gap: 12 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1.5,
    borderColor: 'rgba(42,45,42,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  iconGlyph: { fontSize: 18 },
  logoutButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1.5,
    borderColor: 'rgba(42,45,42,0.15)',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B2B2B',
    letterSpacing: 0.2,
  },

  content: { flex: 1 },
  scrollContent: { paddingTop: 20 },

  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, alignItems: 'center' },
  statAccent: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2B2B2B',
    marginBottom: 6,
  },
  statNumberGood: { color: '#6B7F6E' },
  statNumberWarning: { color: '#F59E0B' },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(42,45,42,0.5)',
  },
  statusDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6B7F6E',
  },

  section: { paddingHorizontal: 20 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(42,45,42,0.5)',
    marginBottom: 16,
  },

  clientCard: {
    marginBottom: 12,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(107,127,110,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(107,127,110,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  clientInitial: { fontSize: 20, fontWeight: '700', color: '#6B7F6E' },
  clientInfo: { flex: 1 },
  clientName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2B2B2B',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  clientEmail: { fontSize: 13, color: 'rgba(42,45,42,0.5)', fontWeight: '400' },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDotSmall: { width: 4, height: 4, borderRadius: 2 },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: 'rgba(42,45,42,0.7)',
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(212,214,212,0.3)',
    marginBottom: 16,
  },
  clientStats: { flexDirection: 'row', justifyContent: 'space-around' },
  clientStatItem: { alignItems: 'center' },
  clientStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2B2B2B',
    marginBottom: 6,
  },
  clientStatLabel: { fontSize: 11, fontWeight: '500', color: 'rgba(42,45,42,0.5)' },

  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B2B2B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(42,45,42,0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },
});