// // mobile-app/src/screens/ClientDetailScreen.tsx
// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   StyleSheet,
//   TouchableOpacity,
//   ActivityIndicator,
//   Dimensions,
// } from 'react-native';
// import { LineChart } from 'react-native-chart-kit';
// import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import type { RouteProp } from '@react-navigation/native';
// import type { RootStackParamList } from '../types/navigation';
// import { coachService } from '../services/coach.service';
// import { colors } from '../theme/colors';

// type ClientDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClientDetail'>;
// type ClientDetailScreenRouteProp = RouteProp<RootStackParamList, 'ClientDetail'>;

// interface Props {
//   navigation: ClientDetailScreenNavigationProp;
//   route: ClientDetailScreenRouteProp;
// }

// // const colors = {
// //   sage: '#7A8B6F',
// //   charcoal: '#3A3A3A',
// //   warmBrown: '#8B6F47',
// //   cream: '#FAF8F4',
// //   lightSage: '#B8C5A8',
// //   white: '#FFFFFF',
// //   textDark: '#2C2C2C',
// //   textLight: '#6B6B6B',
// //   border: '#E8E6E0',
// //   red: '#EF4444',
// //   yellow: '#F59E0B',
// //   green: '#10B981',
// // };

// const screenWidth = Dimensions.get('window').width;

// export default function ClientDetailScreen({ navigation, route }: Props) {
//   const { clientId } = route.params;
//   const [isLoading, setIsLoading] = useState(true);
//   const [glucoseData, setGlucoseData] = useState<any[]>([]);
//   const [symptoms, setSymptoms] = useState<any[]>([]);
//   const [stats, setStats] = useState<any>(null);
//   const [activeTab, setActiveTab] = useState<'glucose' | 'symptoms' | 'analytics'>('glucose');
//   const [clientInfo, setClientInfo] = useState<{ firstName: string; lastName: string } | null>(null);

//   useEffect(() => {
//     loadClientData();
//   }, [clientId]);

//   const loadClientData = async () => {
//     setIsLoading(true);
//     try {
//       const [glucose, symptomsData, statsData] = await Promise.all([
//         coachService.getClientGlucose(clientId, 50),
//         coachService.getClientSymptoms(clientId, 20),
//         coachService.getClientStats(clientId),
//       ]);
      
//       setGlucoseData(glucose);
//       setSymptoms(symptomsData);
//       setStats(statsData);

//       // get client info from coach store
//       const { useCoachStore } = require('../stores/coachStore');
//     const selectedClient = useCoachStore.getState().selectedClient;
//     if (selectedClient) {
//       setClientInfo({
//         firstName: selectedClient.firstName,
//         lastName: selectedClient.lastName,
//       });
//     }
//     } catch (error) {
//       console.error('Failed to load client data:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const formatGlucoseChart = () => {
//     if (!glucoseData || glucoseData.length === 0) {
//       return {
//         labels: ['No Data'],
//         datasets: [{ data: [0] }],
//       };
//     }

//     const last7 = glucoseData.slice(0, 7).reverse();
//     return {
//       labels: last7.map(reading => {
//         const date = new Date(reading.measured_at);
//         return `${date.getMonth() + 1}/${date.getDate()}`;
//       }),
//       datasets: [
//         {
//           data: last7.map(reading => reading.value),
//           color: (opacity = 1) => colors.sage,
//           strokeWidth: 2,
//         },
//       ],
//     };
//   };

//   const getGlucoseColor = (value: number) => {
//     if (value < 70) return colors.red;
//     if (value > 180) return colors.yellow;
//     return colors.green;
//   };

//   const renderGlucoseTab = () => (
//     <View>
//       {/* Glucose Chart */}
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>7-Day Glucose Trend</Text>
//         {glucoseData.length > 0 ? (
//           <LineChart
//             data={formatGlucoseChart()}
//             width={screenWidth - 80}
//             height={220}
//             chartConfig={{
//               backgroundColor: colors.white,
//               backgroundGradientFrom: colors.white,
//               backgroundGradientTo: colors.white,
//               decimalPlaces: 0,
//               color: (opacity = 1) => colors.sage,
//               labelColor: (opacity = 1) => colors.textLight,
//               style: {
//                 borderRadius: 16,
//               },
//               propsForDots: {
//                 r: '4',
//                 strokeWidth: '2',
//                 stroke: colors.sage,
//               },
//             }}
//             bezier
//             style={styles.chart}
//           />
//         ) : (
//           <Text style={styles.emptyText}>No glucose data available</Text>
//         )}
//       </View>

//       {/* Recent Readings */}
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>Recent Readings</Text>
//         {glucoseData.slice(0, 10).map((reading, index) => {
//           const date = new Date(reading.measured_at);
//           return (
//             <View key={index} style={styles.readingRow}>
//               <View style={styles.readingInfo}>
//                 <Text style={styles.readingValue}>
//                   {reading.value} mg/dL
//                 </Text>
//                 <Text style={styles.readingTime}>
//                   {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                 </Text>
//               </View>
//               <View
//                 style={[
//                   styles.readingIndicator,
//                   { backgroundColor: getGlucoseColor(reading.value) },
//                 ]}
//               />
//             </View>
//           );
//         })}
//       </View>
//     </View>
//   );

//   const renderSymptomsTab = () => (
//     <View style={styles.card}>
//       <Text style={styles.cardTitle}>Recent Symptoms</Text>
//       {symptoms.length === 0 ? (
//         <Text style={styles.emptyText}>No symptoms logged</Text>
//       ) : (
//         symptoms.map((symptom, index) => {
//           const date = new Date(symptom.logged_at);
//           return (
//             <View key={index} style={styles.symptomRow}>
//               <View style={styles.symptomHeader}>
//                 <Text style={styles.symptomType}>{symptom.symptom_type}</Text>
//                 <Text style={[styles.symptomSeverity, { color: getSeverityColor(symptom.severity) }]}>
//                   {symptom.severity}
//                 </Text>
//               </View>
//               {symptom.notes && (
//                 <Text style={styles.symptomNotes}>{symptom.notes}</Text>
//               )}
//               <Text style={styles.symptomTime}>
//                 {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//               </Text>
//             </View>
//           );
//         })
//       )}
//     </View>
//   );

// const getSeverityColor = (severity: string | undefined | null) => {
//   if (!severity || typeof severity !== 'string') {
//     return colors.textLight;
//   }
  
//   const severityLower = severity.toLowerCase();
  
//   switch (severityLower) {
//     case 'severe':
//       return colors.red;
//     case 'moderate':
//       return colors.yellow;
//     case 'mild':
//       return colors.green;
//     default:
//       return colors.textLight;
//   }
// };

//   const renderAnalyticsTab = () => (
//     <View>
//       {/* Stats Summary */}
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>30-Day Statistics</Text>
//         <View style={styles.statsGrid}>
//           <View style={styles.statItem}>
//             <Text style={styles.statValue}>{stats?.avgGlucose?.toFixed(0) || '—'}</Text>
//             <Text style={styles.statLabel}>Avg Glucose</Text>
//             <Text style={styles.statUnit}>mg/dL</Text>
//           </View>
//           <View style={styles.statItem}>
//             <Text style={styles.statValue}>{stats?.timeInRange?.toFixed(0) || '—'}</Text>
//             <Text style={styles.statLabel}>Time in Range</Text>
//             <Text style={styles.statUnit}>%</Text>
//           </View>
//           <View style={styles.statItem}>
//             <Text style={styles.statValue}>{stats?.lowestGlucose?.toFixed(0) || '—'}</Text>
//             <Text style={styles.statLabel}>Lowest</Text>
//             <Text style={styles.statUnit}>mg/dL</Text>
//           </View>
//           <View style={styles.statItem}>
//             <Text style={styles.statValue}>{stats?.highestGlucose?.toFixed(0) || '—'}</Text>
//             <Text style={styles.statLabel}>Highest</Text>
//             <Text style={styles.statUnit}>mg/dL</Text>
//           </View>
//         </View>
//       </View>

//       {/* Insights */}
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>Insights</Text>
//         {stats?.timeInRange >= 70 ? (
//           <View style={styles.insightItem}>
//             <Text style={styles.insightIcon}>✅</Text>
//             <Text style={styles.insightText}>
//               Excellent glucose control with {stats.timeInRange.toFixed(0)}% time in range
//             </Text>
//           </View>
//         ) : (
//           <View style={styles.insightItem}>
//             <Text style={styles.insightIcon}>⚠️</Text>
//             <Text style={styles.insightText}>
//               Time in range is {stats?.timeInRange?.toFixed(0)}%. Target is 70%+
//             </Text>
//           </View>
//         )}

//         {stats?.avgGlucose > 180 && (
//           <View style={styles.insightItem}>
//             <Text style={styles.insightIcon}>📈</Text>
//             <Text style={styles.insightText}>
//               Average glucose is elevated. Consider reviewing meal plans and insulin timing.
//             </Text>
//           </View>
//         )}

//         {stats?.lowestGlucose < 70 && (
//           <View style={styles.insightItem}>
//             <Text style={styles.insightIcon}>⚠️</Text>
//             <Text style={styles.insightText}>
//               Low glucose events detected. Monitor for hypoglycemia patterns.
//             </Text>
//           </View>
//         )}
//       </View>
//     </View>
//   );

//   if (isLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={colors.sage} />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//           <Text style={styles.backText}>← Back</Text>
//         </TouchableOpacity>
//         <TouchableOpacity 
//           style={styles.messageButton}
//           onPress={() => {
//             navigation.navigate('Messaging', {
//       userId: clientId,
//       userName: clientInfo 
//         ? `${clientInfo.firstName} ${clientInfo.lastName}`
//         : 'Client'
//     });
//   }}
//         >
//           <Text style={styles.messageButtonText}>Message</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Tabs */}
//       <View style={styles.tabs}>
//         <TouchableOpacity
//           style={[styles.tab, activeTab === 'glucose' && styles.activeTab]}
//           onPress={() => setActiveTab('glucose')}
//         >
//           <Text style={[styles.tabText, activeTab === 'glucose' && styles.activeTabText]}>
//             Glucose
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.tab, activeTab === 'symptoms' && styles.activeTab]}
//           onPress={() => setActiveTab('symptoms')}
//         >
//           <Text style={[styles.tabText, activeTab === 'symptoms' && styles.activeTabText]}>
//             Symptoms
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
//           onPress={() => setActiveTab('analytics')}
//         >
//           <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
//             Analytics
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {/* Content */}
//       <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
//         {activeTab === 'glucose' && renderGlucoseTab()}
//         {activeTab === 'symptoms' && renderSymptomsTab()}
//         {activeTab === 'analytics' && renderAnalyticsTab()}
//         <View style={{ height: 40 }} />
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.cream,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: colors.cream,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 20,
//     paddingTop: 60,
//     backgroundColor: colors.white,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   backButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//   },
//   backText: {
//     color: colors.sage,
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   messageButton: {
//     backgroundColor: colors.sage,
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 10,
//   },
//   messageButtonText: {
//     color: colors.white,
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   tabs: {
//     flexDirection: 'row',
//     backgroundColor: colors.white,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   tab: {
//     flex: 1,
//     paddingVertical: 16,
//     alignItems: 'center',
//     borderBottomWidth: 2,
//     borderBottomColor: 'transparent',
//   },
//   activeTab: {
//     borderBottomColor: colors.sage,
//   },
//   tabText: {
//     fontSize: 15,
//     fontWeight: '500',
//     color: colors.textLight,
//   },
//   activeTabText: {
//     color: colors.sage,
//     fontWeight: '600',
//   },
//   content: {
//     flex: 1,
//   },
//   card: {
//     backgroundColor: colors.white,
//     margin: 20,
//     marginBottom: 16,
//     padding: 20,
//     borderRadius: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   cardTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: colors.textDark,
//     marginBottom: 16,
//   },
//   chart: {
//     marginVertical: 8,
//     borderRadius: 16,
//   },
//   emptyText: {
//     textAlign: 'center',
//     color: colors.textLight,
//     fontSize: 15,
//     paddingVertical: 20,
//   },
//   readingRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   readingInfo: {
//     flex: 1,
//   },
//   readingValue: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.textDark,
//     marginBottom: 4,
//   },
//   readingTime: {
//     fontSize: 13,
//     color: colors.textLight,
//   },
//   readingIndicator: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//   },
//   symptomRow: {
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   symptomHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 6,
//   },
//   symptomType: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.textDark,
//     textTransform: 'capitalize',
//   },
//   symptomSeverity: {
//     fontSize: 13,
//     fontWeight: '600',
//     textTransform: 'capitalize',
//   },
//   symptomNotes: {
//     fontSize: 14,
//     color: colors.textDark,
//     marginBottom: 6,
//   },
//   symptomTime: {
//     fontSize: 12,
//     color: colors.textLight,
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     marginHorizontal: -8,
//   },
//   statItem: {
//     width: '50%',
//     padding: 8,
//     marginBottom: 16,
//   },
//   statValue: {
//     fontSize: 32,
//     fontWeight: '700',
//     color: colors.sage,
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 13,
//     fontWeight: '500',
//     color: colors.textDark,
//     marginBottom: 2,
//   },
//   statUnit: {
//     fontSize: 12,
//     color: colors.textLight,
//   },
//   insightItem: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   insightIcon: {
//     fontSize: 20,
//     marginRight: 12,
//   },
//   insightText: {
//     flex: 1,
//     fontSize: 14,
//     color: colors.textDark,
//     lineHeight: 20,
//   },

  
//   primaryButton: {
//   height: 56,
//   borderRadius: 20,
//   alignItems: 'center',
//   justifyContent: 'center',
//   backgroundColor: colors.sage,
//   shadowColor: '#000',
//   shadowOffset: { width: 0, height: 6 },
//   shadowOpacity: 0.08,
//   shadowRadius: 14,
//   elevation: 2,
// },
// primaryButtonText: {
//   color: colors.white,
//   fontSize: 16,
//   fontWeight: '700',
//   letterSpacing: 0.2,
// },
// secondaryButton: {
//   height: 56,
//   borderRadius: 20,
//   alignItems: 'center',
//   justifyContent: 'center',
//   backgroundColor: colors.white,
//   borderWidth: 1,
//   borderColor: colors.border,
// },
// secondaryButtonText: {
//   color: colors.sage,
//   fontSize: 16,
//   fontWeight: '700',
// },
// });


// mobile-app/src/screens/ClientDetailScreen.tsx
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
import { useCoachStore } from '../stores/coachStore';
import { coachService } from '../services/coach.service';
import { colors } from '../theme/colors';

type ClientDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClientDetail'>;
type ClientDetailScreenRouteProp = RouteProp<RootStackParamList, 'ClientDetail'>;

interface Props {
  navigation: ClientDetailScreenNavigationProp;
  route: ClientDetailScreenRouteProp;
}

export default function ClientDetailScreen({ navigation, route }: Props) {
  const { clientId } = route.params;
  const { selectedClient } = useCoachStore();
  
  const [glucoseData, setGlucoseData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [cycleData, setCycleData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setIsLoading(true);
      
      const [glucose, clientStats, clientSymptoms, cycle] = await Promise.all([
        coachService.getClientGlucose(clientId, 20),
        coachService.getClientStats(clientId),
        coachService.getClientSymptoms(clientId, 10),
        coachService.getClientCycle(clientId).catch(() => null),
      ]);

      setGlucoseData(glucose);
      setStats(clientStats);
      setSymptoms(clientSymptoms);
      setCycleData(cycle);
    } catch (error) {
      console.error('Failed to load client data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClientData();
  };

  const getGlucoseColor = (value: number) => {
    if (value < 70) return colors.red;
    if (value > 180) return colors.yellow;
    return colors.sage;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {selectedClient?.firstName} {selectedClient?.lastName}
          </Text>
          <Text style={styles.headerSubtitle}>{selectedClient?.email}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Messaging', {
            userId: clientId,
            userName: `${selectedClient?.firstName} ${selectedClient?.lastName}`,
          })}
          style={styles.messageButton}
        >
          <Text style={styles.messageButtonText}>💬</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.sage}
          />
        }
      >
        {/* Stats Summary */}
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.sectionTitle}>7-Day Summary</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>📊</Text>
                </View>
                <Text style={styles.statValue}>{stats.average?.toFixed(0) || '—'}</Text>
                <Text style={styles.statLabel}>Average</Text>
              </View>

              <View style={styles.statBox}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>🎯</Text>
                </View>
                <Text style={styles.statValue}>
                  {stats.in_range_percentage?.toFixed(0) || '—'}%
                </Text>
                <Text style={styles.statLabel}>In Range</Text>
              </View>

              <View style={styles.statBox}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>📈</Text>
                </View>
                <Text style={styles.statValue}>{stats.count || '—'}</Text>
                <Text style={styles.statLabel}>Readings</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Glucose Readings */}
        {glucoseData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Glucose</Text>
            
            {glucoseData.map((reading) => (
              <View key={reading.id} style={styles.readingCard}>
                <View style={styles.readingLeft}>
                  <Text 
                    style={[
                      styles.readingValue,
                      { color: getGlucoseColor(reading.glucose_level) }
                    ]}
                  >
                    {reading.glucose_level}
                  </Text>
                  <Text style={styles.readingUnit}>mg/dL</Text>
                </View>
                <View style={styles.readingRight}>
                  <Text style={styles.readingContext}>
                    {reading.meal_context?.replace('_', ' ') || 'General'}
                  </Text>
                  <Text style={styles.readingTime}>
                    {formatDate(reading.timestamp)}
                  </Text>
                  {reading.notes && (
                    <Text style={styles.readingNotes} numberOfLines={1}>
                      {reading.notes}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent Symptoms */}
        {symptoms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Symptoms</Text>
            
            {symptoms.map((symptom) => (
              <View key={symptom.id} style={styles.symptomCard}>
                <View style={styles.symptomIconContainer}>
                  <Text style={styles.symptomIcon}>🍃</Text>
                </View>
                <View style={styles.symptomInfo}>
                  <Text style={styles.symptomType}>
                    {symptom.symptom_type.replace('_', ' ')}
                  </Text>
                  <Text style={styles.symptomTime}>
                    {formatDate(symptom.logged_at)}
                  </Text>
                  {symptom.notes && (
                    <Text style={styles.symptomNotes} numberOfLines={2}>
                      {symptom.notes}
                    </Text>
                  )}
                </View>
                <View style={styles.symptomSeverityContainer}>
                  <Text style={styles.symptomSeverity}>{symptom.severity}/10</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Cycle Information */}
        {cycleData && (
          <View style={styles.cycleCard}>
            <View style={styles.cycleHeader}>
              <Text style={styles.cycleIcon}>🌿</Text>
              <Text style={styles.cycleTitle}>Cycle Tracking</Text>
            </View>
            <View style={styles.cycleInfo}>
              <View style={styles.cycleInfoItem}>
                <Text style={styles.cycleInfoLabel}>Current Day</Text>
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
  },
  backText: {
    color: colors.sage,
    fontSize: 16,
    fontWeight: '600',
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

  // Stats Card
  statsCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 12,
  },

  // Glucose Readings
  readingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
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

  // Symptoms
  symptomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
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

  // Cycle Card
  cycleCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.sage,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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