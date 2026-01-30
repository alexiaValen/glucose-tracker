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
import { colors } from '../theme/colors';
import { BotanicalBackground } from '../components/BotanicalBackground';

type ClientDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClientDetail'>;
type ClientDetailScreenRouteProp = RouteProp<RootStackParamList, 'ClientDetail'>;

interface Props {
  navigation: ClientDetailScreenNavigationProp;
  route: ClientDetailScreenRouteProp;
}

export default function ClientDetailScreen({ navigation, route }: Props) {
  const { clientId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [glucoseData, setGlucoseData] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [clientInfo, setClientInfo] = useState<{ firstName: string; lastName: string; email: string } | null>(null);
  const [cycleData, setCycleData] = useState<any>(null);

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

      const { useCoachStore } = require('../stores/coachStore');
      const selectedClient = useCoachStore.getState().selectedClient;
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

  const formatDate = (dateString: string) => {
    try {
      // Backend returns measured_at or logged_at field
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      }) + ' at ' + date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

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
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {clientInfo?.firstName} {clientInfo?.lastName}
            </Text>
            <Text style={styles.headerSubtitle}>{clientInfo?.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => navigation.navigate('Messaging', { 
              userId: clientId,
              userName: `${clientInfo?.firstName} ${clientInfo?.lastName}` 
            })}
          >
            <Text style={styles.messageButtonText}>💬</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>📊</Text>
                </View>
                <Text style={styles.statValue}>
                  {stats?.avgGlucose?.toFixed(0) || '—'}
                </Text>
                <Text style={styles.statLabel}>Average</Text>
              </View>
              
              <View style={styles.statBox}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>🎯</Text>
                </View>
                <Text style={styles.statValue}>
                  {stats?.timeInRange?.toFixed(0) || '—'}%
                </Text>
                <Text style={styles.statLabel}>In Range</Text>
              </View>

              <View style={styles.statBox}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>📈</Text>
                </View>
                <Text style={styles.statValue}>
                  {glucoseData.length}
                </Text>
                <Text style={styles.statLabel}>Readings</Text>
              </View>
            </View>
          </View>

          {/* Recent Glucose */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Glucose</Text>
            {glucoseData.length === 0 ? (
              <Text style={styles.emptyText}>No glucose data available</Text>
            ) : (
              glucoseData.slice(0, 10).map((reading, index) => (
                <View key={index} style={styles.readingCard}>
                  <View style={styles.readingLeft}>
                    <Text style={[
                      styles.readingValue,
                      { color: reading.glucose_level < 70 ? colors.red : 
                                reading.glucose_level > 180 ? colors.warning : colors.sage }
                    ]}>
                      {reading.glucose_level}
                    </Text>
                    <Text style={styles.readingUnit}>mg/dL</Text>
                  </View>
                  <View style={styles.readingRight}>
                    <Text style={styles.readingContext}>
                      {reading.context?.replace('_', ' ') || 'General'}
                    </Text>
                    <Text style={styles.readingTime}>
                      {formatDate(reading.timestamp || reading.measured_at)}
                    </Text>
                    {reading.notes && (
                      <Text style={styles.readingNotes}>{reading.notes}</Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Recent Symptoms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Symptoms</Text>
            {symptoms.length === 0 ? (
              <Text style={styles.emptyText}>No symptoms logged</Text>
            ) : (
              symptoms.slice(0, 10).map((symptom, index) => (
                <View key={index} style={styles.symptomCard}>
                  <View style={styles.symptomIconContainer}>
                    <Text style={styles.symptomIcon}>🌿</Text>
                  </View>
                  <View style={styles.symptomInfo}>
                    <Text style={styles.symptomType}>
                      {symptom.symptom_type?.replace('_', ' ')}
                    </Text>
                    <Text style={styles.symptomTime}>
                      {formatDate(symptom.logged_at || symptom.timestamp)}
                    </Text>
                    {symptom.notes && (
                      <Text style={styles.symptomNotes}>{symptom.notes}</Text>
                    )}
                  </View>
                  <View style={styles.symptomSeverityContainer}>
                    <Text style={styles.symptomSeverity}>{symptom.severity}/10</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Cycle Data (if available) */}
          {cycleData && (
            <View style={styles.cycleCard}>
              <View style={styles.cycleHeader}>
                <Text style={styles.cycleIcon}>🌸</Text>
                <Text style={styles.cycleTitle}>Cycle Information</Text>
              </View>
              <View style={styles.cycleInfo}>
                <View style={styles.cycleInfoItem}>
                  <Text style={styles.cycleInfoLabel}>Day</Text>
                  <Text style={styles.cycleInfoValue}>{cycleData.current_day || '—'}</Text>
                </View>
                <View style={styles.cycleInfoItem}>
                  <Text style={styles.cycleInfoLabel}>Phase</Text>
                  <Text style={styles.cycleInfoValue}>{cycleData.phase || '—'}</Text>
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
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,214,212,0.25)',
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    color: colors.sage,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textLight,
  },
  messageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButtonText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.paleGreen,
    padding: 16,
    borderRadius: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.sage,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: 20,
  },
  readingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
  },
  readingLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  readingValue: {
    fontSize: 28,
    fontWeight: '700',
    marginRight: 6,
  },
  readingUnit: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },
  readingRight: {
    flex: 1,
    alignItems: 'flex-end',
    paddingLeft: 16,
  },
  readingContext: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  readingTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  readingNotes: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 4,
  },
  symptomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
  },
  symptomIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  symptomIcon: {
    fontSize: 20,
  },
  symptomInfo: {
    flex: 1,
  },
  symptomType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  symptomTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  symptomNotes: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 4,
  },
  symptomSeverityContainer: {
    backgroundColor: colors.paleGreen,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  symptomSeverity: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.sage,
  },
  cycleCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.sage,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cycleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cycleIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cycleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  cycleInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  cycleInfoItem: {
    flex: 1,
    backgroundColor: colors.paleGreen,
    padding: 12,
    borderRadius: 12,
  },
  cycleInfoLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  cycleInfoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.sage,
    textTransform: 'capitalize',
  },
});