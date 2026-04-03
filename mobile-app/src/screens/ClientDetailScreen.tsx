// mobile-app/src/screens/ClientDetailScreen.tsx
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
import { useCoachStore } from '../stores/coachStore';
import { colors } from '../theme/colors';
import { BotanicalBackground } from '../components/BotanicalBackground';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ClientDetail'>;
  route: RouteProp<RootStackParamList, 'ClientDetail'>;
};

export default function ClientDetailScreen({ navigation, route }: Props) {
  const { clientId } = route.params;
  const { setViewingClient } = useCoachStore();

  const [isLoading, setIsLoading] = useState(true);
  const [glucoseData, setGlucoseData] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [cycleData, setCycleData] = useState<any>(null);
  const [clientInfo, setClientInfo] = useState<{
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    setIsLoading(true);
    try {
      const [glucose, symptomsData, statsData, cycle] = await Promise.all([
        coachService.getClientGlucose(clientId, 50),
        coachService.getClientSymptoms(clientId, 20),
        coachService.getClientStats(clientId),
        coachService.getClientCycle(clientId).catch(() => null),
      ]);

      setGlucoseData(glucose);
      setSymptoms(symptomsData);
      setStats(statsData);
      setCycleData(cycle);

      const { useCoachStore: coachStoreModule } = require('../stores/coachStore');
      const selectedClient = coachStoreModule.getState().selectedClient;
      if (selectedClient) {
        setClientInfo({
          firstName: selectedClient.firstName,
          lastName: selectedClient.lastName,
          email: selectedClient.email,
        });
      }
    } catch (error) {
      console.error('Failed to load client data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAsClient = () => {
    const name = `${clientInfo?.firstName || ''} ${clientInfo?.lastName || ''}`.trim();
    setViewingClient(clientId, name);
    // Navigate to the client tab stack — coach sees exact same screens client sees
    navigation.navigate('Dashboard');
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return (
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
        ' at ' +
        date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      );
    } catch {
      return 'Invalid Date';
    }
  };

  const clientName = `${clientInfo?.firstName || ''} ${clientInfo?.lastName || ''}`.trim();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.sage} />
      </View>
    );
  }

  return (
    <BotanicalBackground variant="green" intensity="light">
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{clientName}</Text>
            <Text style={styles.headerSubtitle}>{clientInfo?.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => navigation.navigate('Messaging', {
              userId: clientId,
              userName: clientName,
            })}
          >
            <Text style={styles.messageButtonText}>💬</Text>
          </TouchableOpacity>
        </View>

        {/* View as Client — primary coach action */}
        <TouchableOpacity
          style={styles.viewAsClientButton}
          onPress={handleViewAsClient}
          activeOpacity={0.85}
        >
          <Text style={styles.viewAsClientEmoji}>👁</Text>
          <View style={styles.viewAsClientContent}>
            <Text style={styles.viewAsClientLabel}>View as {clientInfo?.firstName || 'Client'}</Text>
            <Text style={styles.viewAsClientSub}>See their exact dashboard experience</Text>
          </View>
          <Text style={styles.viewAsClientArrow}>→</Text>
        </TouchableOpacity>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* Stats */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats?.avgGlucose?.toFixed(0) || '—'}</Text>
                <Text style={styles.statLabel}>Avg Glucose</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats?.timeInRange?.toFixed(0) ?? '—'}%</Text>
                <Text style={styles.statLabel}>In Range</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{glucoseData.length}</Text>
                <Text style={styles.statLabel}>Readings</Text>
              </View>
            </View>
          </View>

          {/* Recent Glucose */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECENT GLUCOSE</Text>
            {glucoseData.length === 0 ? (
              <Text style={styles.emptyText}>No glucose data</Text>
            ) : (
              glucoseData.slice(0, 10).map((reading, index) => {
                const val = reading.value ?? reading.glucose_level;
                const color = val < 70 ? '#E05C5C' : val > 180 ? '#E09A3A' : colors.sage;
                return (
                  <View key={index} style={styles.readingRow}>
                    <View style={[styles.readingBar, { backgroundColor: color }]} />
                    <View style={styles.readingMain}>
                      <Text style={[styles.readingValue, { color }]}>{val}</Text>
                      <Text style={styles.readingUnit}> mg/dL</Text>
                    </View>
                    <View style={styles.readingRight}>
                      <Text style={styles.readingContext}>
                        {(reading.meal_context || reading.context || 'general').replace('_', ' ')}
                      </Text>
                      <Text style={styles.readingTime}>
                        {formatDate(reading.measured_at || reading.timestamp)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Recent Symptoms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECENT SYMPTOMS</Text>
            {symptoms.length === 0 ? (
              <Text style={styles.emptyText}>No symptoms logged</Text>
            ) : (
              symptoms.slice(0, 10).map((symptom, index) => (
                <View key={index} style={styles.symptomRow}>
                  <View style={styles.symptomMain}>
                    <Text style={styles.symptomType}>
                      {(symptom.symptom_type || '').replace('_', ' ')}
                    </Text>
                    <Text style={styles.symptomTime}>
                      {formatDate(symptom.logged_at || symptom.timestamp)}
                    </Text>
                  </View>
                  <View style={[
                    styles.severityBadge,
                    { backgroundColor: symptom.severity >= 7 ? 'rgba(224,92,92,0.12)' : 'rgba(107,127,110,0.1)' }
                  ]}>
                    <Text style={[
                      styles.severityText,
                      { color: symptom.severity >= 7 ? '#E05C5C' : colors.forestGreen }
                    ]}>
                      {symptom.severity}/10
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Cycle */}
          {cycleData && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CYCLE</Text>
              <View style={styles.cycleRow}>
                <View style={styles.cycleItem}>
                  <Text style={styles.cycleValue}>{cycleData.current_day || cycleData.day || '—'}</Text>
                  <Text style={styles.cycleLabel}>Day</Text>
                </View>
                <View style={styles.cycleItem}>
                  <Text style={[styles.cycleValue, { fontSize: 16, textTransform: 'capitalize' }]}>
                    {cycleData.phase || '—'}
                  </Text>
                  <Text style={styles.cycleLabel}>Phase</Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,214,212,0.25)',
    gap: 12,
  },
  backButton: { paddingVertical: 4 },
  backText: { fontSize: 15, color: colors.forestGreen, fontWeight: '500' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.charcoal },
  headerSubtitle: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  messageButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.paleGreen,
    justifyContent: 'center', alignItems: 'center',
  },
  messageButtonText: { fontSize: 18 },

  // View as Client CTA
  viewAsClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.forestGreen,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  viewAsClientEmoji: { fontSize: 18, color: '#FFFFFF' },
  viewAsClientContent: { flex: 1 },
  viewAsClientLabel: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  viewAsClientSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  viewAsClientArrow: { fontSize: 18, color: 'rgba(255,255,255,0.7)' },

  content: { flex: 1, padding: 20 },

  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  statsRow: { flexDirection: 'row' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '700', color: colors.forestGreen, marginBottom: 4 },
  statLabel: { fontSize: 11, fontWeight: '500', color: 'rgba(42,45,42,0.5)' },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 11, fontWeight: '600', letterSpacing: 1.2,
    color: 'rgba(42,45,42,0.5)', marginBottom: 12,
  },
  emptyText: { fontSize: 14, color: colors.textLight, paddingVertical: 16 },

  readingRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.2)',
    gap: 10,
  },
  readingBar: { width: 3, height: 32, borderRadius: 2 },
  readingMain: { flexDirection: 'row', alignItems: 'baseline', width: 80 },
  readingValue: { fontSize: 22, fontWeight: '700' },
  readingUnit: { fontSize: 12, color: colors.textLight, fontWeight: '400' },
  readingRight: { flex: 1, alignItems: 'flex-end' },
  readingContext: { fontSize: 13, fontWeight: '500', color: colors.charcoal, textTransform: 'capitalize' },
  readingTime: { fontSize: 12, color: colors.textLight, marginTop: 2 },

  symptomRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.2)',
  },
  symptomMain: { flex: 1 },
  symptomType: { fontSize: 15, fontWeight: '600', color: colors.charcoal, textTransform: 'capitalize' },
  symptomTime: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  severityText: { fontSize: 13, fontWeight: '700' },

  cycleRow: {
    flexDirection: 'row', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.2)',
  },
  cycleItem: { flex: 1, alignItems: 'center' },
  cycleValue: { fontSize: 24, fontWeight: '700', color: colors.forestGreen, marginBottom: 4 },
  cycleLabel: { fontSize: 11, color: 'rgba(42,45,42,0.5)', fontWeight: '500' },
});