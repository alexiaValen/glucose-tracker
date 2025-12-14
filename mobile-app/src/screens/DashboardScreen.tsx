// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import { useAuthStore } from '../stores/authStore';

// export default function DashboardScreen() {
//   const { user, logout } = useAuthStore();

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Welcome to Grace & Glucose!</Text>
//       <Text style={styles.subtitle}>
//         Hello, {user?.firstName || user?.email}! 👋
//       </Text>

//       <View style={styles.infoBox}>
//         <Text style={styles.infoText}>✅ You're logged in!</Text>
//         <Text style={styles.infoText}>📧 {user?.email}</Text>
//         <Text style={styles.infoText}>🎭 Role: {user?.role}</Text>
//       </View>

//       <Text style={styles.comingSoon}>
//         Dashboard features coming soon:{'\n'}
//         • Glucose tracking{'\n'}
//         • Fasting timer{'\n'}
//         • Charts & insights
//       </Text>

//       <TouchableOpacity style={styles.logoutButton} onPress={logout}>
//         <Text style={styles.logoutButtonText}>Logout</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8F9FA',
//     padding: 20,
//     justifyContent: 'center',
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#1A1A1A',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 18,
//     color: '#666',
//     marginBottom: 30,
//     textAlign: 'center',
//   },
//   infoBox: {
//     backgroundColor: '#FFF',
//     borderRadius: 12,
//     padding: 20,
//     marginBottom: 30,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//   },
//   infoText: {
//     fontSize: 16,
//     color: '#333',
//     marginBottom: 8,
//   },
//   comingSoon: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     marginBottom: 30,
//     lineHeight: 22,
//     },
//   logoutButton: {
//     backgroundColor: '#EF4444',
//     borderRadius: 12,
//     padding: 16,
//     alignItems: 'center',
//   },
//   logoutButtonText: {
//     color: '#FFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });



import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useGlucoseStore } from '../stores/glucoseStore';

export default function DashboardScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const { readings, stats, isLoading, fetchReadings, fetchStats } = useGlucoseStore();

  useEffect(() => {
    fetchReadings();
    fetchStats();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getMealContextLabel = (context?: string) => {
    const labels: Record<string, string> = {
      fasting: '🌅 Fasting',
      pre_meal: '🍽️ Before Meal',
      post_meal: '🍴 After Meal',
      bedtime: '🌙 Bedtime',
      other: '📊 Other',
    };
    return labels[context || 'other'] || '📊';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.firstName || 'there'}! 👋</Text>
          <Text style={styles.subtitle}>Grace & Glucose</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Card */}
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Last 7 Days</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.avgGlucose.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Avg</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.minGlucose.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Min</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.maxGlucose.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Max</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.timeInRange.toFixed(0)}%</Text>
                <Text style={styles.statLabel}>In Range</Text>
              </View>
            </View>
          </View>
        )}

        {/* Add Glucose Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddGlucose')}
        >
          <Text style={styles.addButtonText}>+ Log Glucose</Text>
        </TouchableOpacity>

        {/* Recent Readings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Readings</Text>

          {isLoading && readings.length === 0 ? (
            <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 20 }} />
          ) : readings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No readings yet</Text>
              <Text style={styles.emptySubtext}>Tap "Log Glucose" to add your first reading</Text>
            </View>
          ) : (
            readings.map((reading) => (
              <View key={reading.id} style={styles.readingCard}>
                <View style={styles.readingHeader}>
                  <Text style={styles.readingValue}>{reading.value} mg/dL</Text>
                  <Text style={styles.readingContext}>
                    {getMealContextLabel(reading.mealContext)}
                  </Text>
                </View>
                <Text style={styles.readingDate}>{formatDate(reading.measuredAt)}</Text>
                {reading.notes && <Text style={styles.readingNotes}>{reading.notes}</Text>}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#FFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#6366F1',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  readingCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  readingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  readingContext: {
    fontSize: 14,
    color: '#666',
  },
  readingDate: {
    fontSize: 12,
    color: '#999',
  },
  readingNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});