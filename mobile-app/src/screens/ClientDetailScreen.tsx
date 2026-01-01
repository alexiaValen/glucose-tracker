// mobile-app/src/screens/ClientDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { coachService } from '../services/coach.service';

type ClientDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClientDetail'>;
type ClientDetailScreenRouteProp = RouteProp<RootStackParamList, 'ClientDetail'>;

interface Props {
  navigation: ClientDetailScreenNavigationProp;
  route: ClientDetailScreenRouteProp;
}

const colors = {
  sage: '#7A8B6F',
  charcoal: '#3A3A3A',
  warmBrown: '#8B6F47',
  cream: '#FAF8F4',
  lightSage: '#B8C5A8',
  white: '#FFFFFF',
  textDark: '#2C2C2C',
  textLight: '#6B6B6B',
  border: '#E8E6E0',
  red: '#EF4444',
  yellow: '#F59E0B',
  green: '#10B981',
};

const screenWidth = Dimensions.get('window').width;

export default function ClientDetailScreen({ navigation, route }: Props) {
  const { clientId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [glucoseData, setGlucoseData] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'glucose' | 'symptoms' | 'analytics'>('glucose');

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    setIsLoading(true);
    try {
      const [glucose, symptomsData, statsData] = await Promise.all([
        coachService.getClientGlucose(clientId, 50),
        coachService.getClientSymptoms(clientId, 20),
        coachService.getClientStats(clientId),
      ]);
      
      setGlucoseData(glucose);
      setSymptoms(symptomsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load client data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatGlucoseChart = () => {
    if (!glucoseData || glucoseData.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    const last7 = glucoseData.slice(0, 7).reverse();
    return {
      labels: last7.map(reading => {
        const date = new Date(reading.measured_at);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      datasets: [
        {
          data: last7.map(reading => reading.value),
          color: (opacity = 1) => colors.sage,
          strokeWidth: 2,
        },
      ],
    };
  };

  const getGlucoseColor = (value: number) => {
    if (value < 70) return colors.red;
    if (value > 180) return colors.yellow;
    return colors.green;
  };

  const renderGlucoseTab = () => (
    <View>
      {/* Glucose Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>7-Day Glucose Trend</Text>
        {glucoseData.length > 0 ? (
          <LineChart
            data={formatGlucoseChart()}
            width={screenWidth - 80}
            height={220}
            chartConfig={{
              backgroundColor: colors.white,
              backgroundGradientFrom: colors.white,
              backgroundGradientTo: colors.white,
              decimalPlaces: 0,
              color: (opacity = 1) => colors.sage,
              labelColor: (opacity = 1) => colors.textLight,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: colors.sage,
              },
            }}
            bezier
            style={styles.chart}
          />
        ) : (
          <Text style={styles.emptyText}>No glucose data available</Text>
        )}
      </View>

      {/* Recent Readings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Readings</Text>
        {glucoseData.slice(0, 10).map((reading, index) => {
          const date = new Date(reading.measured_at);
          return (
            <View key={index} style={styles.readingRow}>
              <View style={styles.readingInfo}>
                <Text style={styles.readingValue}>
                  {reading.value} mg/dL
                </Text>
                <Text style={styles.readingTime}>
                  {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View
                style={[
                  styles.readingIndicator,
                  { backgroundColor: getGlucoseColor(reading.value) },
                ]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderSymptomsTab = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Recent Symptoms</Text>
      {symptoms.length === 0 ? (
        <Text style={styles.emptyText}>No symptoms logged</Text>
      ) : (
        symptoms.map((symptom, index) => {
          const date = new Date(symptom.logged_at);
          return (
            <View key={index} style={styles.symptomRow}>
              <View style={styles.symptomHeader}>
                <Text style={styles.symptomType}>{symptom.symptom_type}</Text>
                <Text style={[styles.symptomSeverity, { color: getSeverityColor(symptom.severity) }]}>
                  {symptom.severity}
                </Text>
              </View>
              {symptom.notes && (
                <Text style={styles.symptomNotes}>{symptom.notes}</Text>
              )}
              <Text style={styles.symptomTime}>
                {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return colors.red;
      case 'moderate':
        return colors.yellow;
      case 'mild':
        return colors.green;
      default:
        return colors.textLight;
    }
  };

  const renderAnalyticsTab = () => (
    <View>
      {/* Stats Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>30-Day Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.avgGlucose?.toFixed(0) || '—'}</Text>
            <Text style={styles.statLabel}>Avg Glucose</Text>
            <Text style={styles.statUnit}>mg/dL</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.timeInRange?.toFixed(0) || '—'}</Text>
            <Text style={styles.statLabel}>Time in Range</Text>
            <Text style={styles.statUnit}>%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.lowestGlucose?.toFixed(0) || '—'}</Text>
            <Text style={styles.statLabel}>Lowest</Text>
            <Text style={styles.statUnit}>mg/dL</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.highestGlucose?.toFixed(0) || '—'}</Text>
            <Text style={styles.statLabel}>Highest</Text>
            <Text style={styles.statUnit}>mg/dL</Text>
          </View>
        </View>
      </View>

      {/* Insights */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Insights</Text>
        {stats?.timeInRange >= 70 ? (
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>✅</Text>
            <Text style={styles.insightText}>
              Excellent glucose control with {stats.timeInRange.toFixed(0)}% time in range
            </Text>
          </View>
        ) : (
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>⚠️</Text>
            <Text style={styles.insightText}>
              Time in range is {stats?.timeInRange?.toFixed(0)}%. Target is 70%+
            </Text>
          </View>
        )}

        {stats?.avgGlucose > 180 && (
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>📈</Text>
            <Text style={styles.insightText}>
              Average glucose is elevated. Consider reviewing meal plans and insulin timing.
            </Text>
          </View>
        )}

        {stats?.lowestGlucose < 70 && (
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>⚠️</Text>
            <Text style={styles.insightText}>
              Low glucose events detected. Monitor for hypoglycemia patterns.
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.sage} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.messageButton}
          onPress={() => {
            // Navigate to messaging screen (we'll build this next)
            console.log('Message client');
          }}
        >
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'glucose' && styles.activeTab]}
          onPress={() => setActiveTab('glucose')}
        >
          <Text style={[styles.tabText, activeTab === 'glucose' && styles.activeTabText]}>
            Glucose
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'symptoms' && styles.activeTab]}
          onPress={() => setActiveTab('symptoms')}
        >
          <Text style={[styles.tabText, activeTab === 'symptoms' && styles.activeTabText]}>
            Symptoms
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'glucose' && renderGlucoseTab()}
        {activeTab === 'symptoms' && renderSymptomsTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backText: {
    color: colors.sage,
    fontSize: 16,
    fontWeight: '600',
  },
  messageButton: {
    backgroundColor: colors.sage,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  messageButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.sage,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textLight,
  },
  activeTabText: {
    color: colors.sage,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.white,
    margin: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 15,
    paddingVertical: 20,
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  readingInfo: {
    flex: 1,
  },
  readingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  readingTime: {
    fontSize: 13,
    color: colors.textLight,
  },
  readingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  symptomRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  symptomType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    textTransform: 'capitalize',
  },
  symptomSeverity: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  symptomNotes: {
    fontSize: 14,
    color: colors.textDark,
    marginBottom: 6,
  },
  symptomTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statItem: {
    width: '50%',
    padding: 8,
    marginBottom: 16,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.sage,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 12,
    color: colors.textLight,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },
});