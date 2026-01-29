// // mobile-app/src/screens/DashboardScreen.tsx
// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
//   RefreshControl,
// } from 'react-native';
// import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import type { RootStackParamList } from '../types/navigation';
// import { useAuthStore } from '../stores/authStore';
// import { useGlucoseStore } from '../stores/glucoseStore';
// import { useSymptomStore } from '../stores/symptomStore';
// import { useCycleStore } from '../stores/cycleStore';
// import { colors } from '../theme/colors';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { BotanicalBackground } from '../components/BotanicalBackground';

// type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

// interface Props {
//   navigation: DashboardScreenNavigationProp;
// }

// const CYCLE_TRACKING_KEY = 'cycleTrackingEnabled';

// export default function DashboardScreen({ navigation }: Props) {
//   const { user, logout } = useAuthStore();
//   const { stats, readings, fetchReadings, fetchStats, isLoading: glucoseLoading } = useGlucoseStore();
//   const { symptoms, fetchSymptoms } = useSymptomStore();
//   const { currentCycle, fetchCurrentCycle } = useCycleStore();
  
//   const [refreshing, setRefreshing] = useState(false);
//   const [cycleTrackingEnabled, setCycleTrackingEnabled] = useState(true);
//   const [streak, setStreak] = useState(0);

//   useEffect(() => {
//     loadData();
//     loadSettings();
//   }, []);

//   const loadSettings = async () => {
//     try {
//       const enabled = await AsyncStorage.getItem(CYCLE_TRACKING_KEY);
//       if (enabled !== null) {
//         setCycleTrackingEnabled(enabled === 'true');
//       }
//     } catch (error) {
//       console.error('Error loading settings:', error);
//     }
//   };

//   const loadData = async () => {
//     await Promise.all([
//       fetchReadings(),
//       fetchStats(),
//       fetchSymptoms(),
//       fetchCurrentCycle(),
//     ]);
//     calculateStreak();
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadData();
//     setRefreshing(false);
//   };

//   const calculateStreak = () => {
//     if (readings.length === 0) {
//       setStreak(0);
//       return;
//     }

//     let currentStreak = 0;
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     for (let i = 0; i < 30; i++) {
//       const checkDate = new Date(today);
//       checkDate.setDate(checkDate.getDate() - i);
      
//       const hasReading = readings.some((reading) => {
//         const readingDate = new Date(reading.timestamp);
//         readingDate.setHours(0, 0, 0, 0);
//         return readingDate.getTime() === checkDate.getTime();
//       });

//       if (hasReading) {
//         currentStreak++;
//       } else if (i > 0) {
//         break;
//       }
//     }

//     setStreak(currentStreak);
//   };

//   const getGlucoseColor = (value: number) => {
//     if (value < 70) return colors.red;
//     if (value > 180) return colors.yellow;
//     return colors.sage;
//   };

//   const getTimeInRangeColor = (percentage: number) => {
//     if (percentage >= 70) return colors.sage;
//     if (percentage >= 50) return colors.goldLeaf;
//     return colors.error;
//   };

//   const getCycleDay = () => {
//     if (!currentCycle) return null;
//     const start = new Date(currentCycle.cycle_start_date);
//     const today = new Date();
//     const diffTime = Math.abs(today.getTime() - start.getTime());
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     return diffDays;
//   };

//   const getCyclePhase = (day: number) => {
//     if (day <= 5) return { phase: 'Menstrual', emoji: '🌱', color: colors.sage };
//     if (day <= 13) return { phase: 'Follicular', emoji: '🌿', color: colors.forestGreen };
//     if (day <= 16) return { phase: 'Ovulation', emoji: '✨', color: colors.goldLeaf };
//     return { phase: 'Luteal', emoji: '🍃', color: colors.warmBrown };
//   };

//   return (
//     <BotanicalBackground variant="green" intensity="light">
//       <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.appName}>GraceFlow</Text>
//           <Text style={styles.greeting}>Hello, {user?.firstName} 👋</Text>
//         </View>
//         <View style={styles.headerActions}>
//           <TouchableOpacity 
//             onPress={() => navigation.navigate('Conversations')} 
//             style={styles.iconButton}
//           >
//             <Text style={styles.iconButtonText}>💬</Text>
//           </TouchableOpacity>
//           <TouchableOpacity 
//             onPress={() => navigation.navigate('Settings')} 
//             style={styles.iconButton}
//           >
//             <Text style={styles.iconButtonText}>⚙️</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       <ScrollView
//         style={styles.content}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             tintColor={colors.sage}
//           />
//         }
//       >
//         {/* Streak Card */}
//         {streak > 0 && (
//           <View style={styles.streakCard}>
//             <View style={styles.streakIconContainer}>
//               <Text style={styles.streakIcon}>🔥</Text>
//             </View>
//             <View style={styles.streakTextContainer}>
//               <Text style={styles.streakTitle}>{streak} Day Streak!</Text>
//               <Text style={styles.streakSubtitle}>Keep up the great work!</Text>
//             </View>
//           </View>
//         )}

//         {/* Glucose Stats Card */}
//         <View style={styles.statsCard}>
//           <Text style={styles.sectionTitle}>Last 7 Days</Text>
          
//           <View style={styles.statsContent}>
//             {/* Circle Progress */}
//             <View style={styles.circleContainer}>
//               <View style={styles.circle}>
//                 <Text style={styles.circleValue}>
//                   {stats?.in_range_percentage?.toFixed(0) || stats?.timeInRange?.toFixed(0) || '0'}%
//                 </Text>
//                 <Text style={styles.circleLabel}>IN RANGE</Text>
//               </View>
//             </View>

//             {/* Stats */}
//             <View style={styles.statsColumn}>
//               <View style={styles.statItem}>
//                 <View style={styles.statIconContainer}>
//                   <Text style={styles.statIcon}>📈</Text>
//                 </View>
//                 <View>
//                   <Text style={styles.statValue}>
//                     {stats?.average?.toFixed(0) || stats?.avgGlucose?.toFixed(0) || '—'}
//                   </Text>
//                   <Text style={styles.statLabel}>Average</Text>
//                 </View>
//               </View>

//               <View style={styles.statItem}>
//                 <View style={styles.statIconContainer}>
//                   <Text style={styles.statIcon}>📉</Text>
//                 </View>
//                 <View>
//                   <Text style={styles.statValue}>
//                     {stats?.min?.toFixed(0) || stats?.minGlucose?.toFixed(0) || '—'}
//                   </Text>
//                   <Text style={styles.statLabel}>Lowest</Text>
//                 </View>
//               </View>

//               <View style={styles.statItem}>
//                 <View style={styles.statIconContainer}>
//                   <Text style={styles.statIcon}>🔺</Text>
//                 </View>
//                 <View>
//                   <Text style={styles.statValue}>
//                     {stats?.max?.toFixed(0) || stats?.maxGlucose?.toFixed(0) || '—'}
//                   </Text>
//                   <Text style={styles.statLabel}>Highest</Text>
//                 </View>
//               </View>
//             </View>
//           </View>
//         </View>

//         {/* Action Buttons */}
//         <View style={styles.actionRow}>
//           <TouchableOpacity
//             style={styles.primaryAction}
//             onPress={() => navigation.navigate('AddGlucose')}
//           >
//             <View style={styles.actionIconContainer}>
//               <Text style={styles.actionIcon}>🩸</Text>
//             </View>
//             <Text style={styles.actionText}>Log Glucose</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.secondaryAction}
//             onPress={() => navigation.navigate('AddSymptom')}
//           >
//             <View style={styles.actionIconContainer}>
//               <Text style={styles.actionIcon}>💚</Text>
//             </View>
//             <Text style={styles.actionText}>Log Symptom</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Cycle Tracking Card */}
//         {cycleTrackingEnabled && (
//           <TouchableOpacity
//             style={styles.cycleCard}
//             onPress={() => navigation.navigate('LogCycle')}
//           >
//             <View style={styles.cycleHeader}>
//               <Text style={styles.cycleIcon}>🌿</Text>
//               <Text style={styles.cycleTitle}>Log Cycle Start</Text>
//             </View>
            
//             {currentCycle && getCycleDay() !== null && (
//               <View style={styles.cycleInfo}>
//                 <Text style={styles.cycleDayText}>Day {getCycleDay()}</Text>
//                 <View style={styles.cyclePhaseContainer}>
//                   <Text style={styles.cyclePhaseEmoji}>
//                     {getCyclePhase(getCycleDay()!).emoji}
//                   </Text>
//                   <Text style={styles.cyclePhaseText}>
//                     {getCyclePhase(getCycleDay()!).phase}
//                   </Text>
//                 </View>
//               </View>
//             )}
//           </TouchableOpacity>
//         )}

//         {/* Recent Symptoms */}
//         {symptoms.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Recent Symptoms</Text>
            
//             {symptoms.slice(0, 3).map((symptom) => (
//               <View key={symptom.id} style={styles.symptomCard}>
//                 <View style={styles.symptomIconContainer}>
//                   <Text style={styles.symptomIcon}>🍃</Text>
//                 </View>
//                 <View style={styles.symptomInfo}>
//                   <Text style={styles.symptomType}>
//                     {symptom.symptom_type.replace('_', ' ')}
//                   </Text>
//                   <Text style={styles.symptomTime}>
//                     {new Date(symptom.logged_at).toLocaleDateString('en-US', {
//                       month: 'short',
//                       day: 'numeric',
//                       hour: 'numeric',
//                       minute: '2-digit',
//                     })}
//                   </Text>
//                 </View>
//                 <View style={styles.symptomSeverityContainer}>
//                   <Text style={styles.symptomSeverity}>{symptom.severity}/10</Text>
//                 </View>
//               </View>
//             ))}
//           </View>
//         )}

//         {/* Recent Readings */}
//         {readings.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Recent Readings</Text>
            
//             {readings.slice(0, 5).map((reading) => (
//               <View key={reading.id} style={styles.readingCard}>
//                 <View style={styles.readingLeft}>
//                   <Text 
//                     style={[
//                       styles.readingValue,
//                       { color: getGlucoseColor(reading.glucose_level) }
//                     ]}
//                   >
//                     {reading.glucose_level}
//                   </Text>
//                   <Text style={styles.readingUnit}>mg/dL</Text>
//                 </View>
//                 <View style={styles.readingRight}>
//                   <Text style={styles.readingContext}>
//                     {reading.meal_context?.replace('_', ' ') || 'General'}
//                   </Text>
//                   <Text style={styles.readingTime}>
//                     {new Date(reading.timestamp).toLocaleDateString('en-US', {
//                       month: 'short',
//                       day: 'numeric',
//                       hour: 'numeric',
//                       minute: '2-digit',
//                     })}
//                   </Text>
//                 </View>
//               </View>
//             ))}
//           </View>
//         )}

//         <View style={{ height: 40 }} />
//       </ScrollView>
//     </View>
//     </BotanicalBackground>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     padding: 20,
//     paddingTop: 60,
//     backgroundColor: colors.white,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   appName: {
//     fontSize: 13,
//     color: colors.textLight,
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   greeting: {
//     fontSize: 26,
//     fontWeight: '600',
//     color: colors.charcoal,
//   },
//   headerActions: {
//     flexDirection: 'row',
//     gap: 8,
//   },
//   iconButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: colors.paleGreen,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   iconButtonText: {
//     fontSize: 20,
//   },
//   content: {
//     flex: 1,
//     padding: 20,
//   },

//   // Streak Card
//   streakCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.white,
//     padding: 20,
//     borderRadius: 16,
//     marginBottom: 20,
//     borderWidth: 2,
//     borderColor: colors.goldLeaf,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   streakIconContainer: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: colors.paleGreen,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 16,
//   },
//   streakIcon: {
//     fontSize: 32,
//   },
//   streakTextContainer: {
//     flex: 1,
//   },
//   streakTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: colors.goldLeaf,
//     marginBottom: 4,
//   },
//   streakSubtitle: {
//     fontSize: 14,
//     color: colors.textLight,
//   },

//   // Stats Card
//   statsCard: {
//     backgroundColor: colors.white,
//     padding: 20,
//     borderRadius: 16,
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: colors.charcoal,
//     marginBottom: 16,
//   },
//   statsContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   circleContainer: {
//     marginRight: 24,
//   },
//   circle: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     borderWidth: 8,
//     borderColor: colors.sage,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: colors.paleGreen,
//   },
//   circleValue: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: colors.sage,
//     marginBottom: 4,
//   },
//   circleLabel: {
//     fontSize: 11,
//     fontWeight: '600',
//     color: colors.textLight,
//     letterSpacing: 0.5,
//   },
//   statsColumn: {
//     flex: 1,
//     gap: 12,
//   },
//   statItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.paleGreen,
//     padding: 12,
//     borderRadius: 12,
//     gap: 12,
//   },
//   statIconContainer: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: colors.white,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   statIcon: {
//     fontSize: 16,
//   },
//   statValue: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: colors.charcoal,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: colors.textLight,
//     marginTop: 2,
//   },

//   // Action Buttons
//   actionRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 20,
//   },
//   primaryAction: {
//     flex: 1,
//     backgroundColor: colors.sage,
//     padding: 20,
//     borderRadius: 16,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   secondaryAction: {
//     flex: 1,
//     backgroundColor: colors.white,
//     padding: 20,
//     borderRadius: 16,
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: colors.border,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.04,
//     shadowRadius: 4,
//     elevation: 1,
//   },
//   actionIconContainer: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   actionIcon: {
//     fontSize: 24,
//   },
//   actionText: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: colors.white,
//   },

//   // Cycle Card
//   cycleCard: {
//     backgroundColor: colors.white,
//     padding: 20,
//     borderRadius: 16,
//     marginBottom: 20,
//     borderWidth: 2,
//     borderColor: colors.sage,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   cycleHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   cycleIcon: {
//     fontSize: 24,
//     marginRight: 12,
//   },
//   cycleTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.charcoal,
//   },
//   cycleInfo: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   cycleDayText: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: colors.sage,
//   },
//   cyclePhaseContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.paleGreen,
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 12,
//   },
//   cyclePhaseEmoji: {
//     fontSize: 16,
//     marginRight: 6,
//   },
//   cyclePhaseText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: colors.sage,
//   },

//   // Symptoms
//   section: {
//     marginBottom: 24,
//   },
//   symptomCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.white,
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 8,
//     borderWidth: 1,
//     borderColor: colors.border,
//   },
//   symptomIconContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: colors.paleGreen,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   symptomIcon: {
//     fontSize: 20,
//   },
//   symptomInfo: {
//     flex: 1,
//   },
//   symptomType: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.charcoal,
//     textTransform: 'capitalize',
//     marginBottom: 4,
//   },
//   symptomTime: {
//     fontSize: 13,
//     color: colors.textLight,
//   },
//   symptomSeverityContainer: {
//     backgroundColor: colors.paleGreen,
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 12,
//   },
//   symptomSeverity: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: colors.sage,
//   },

//   // Readings
//   readingCard: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     backgroundColor: colors.white,
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 8,
//     borderWidth: 1,
//     borderColor: colors.border,
//   },
//   readingLeft: {
//     flexDirection: 'row',
//     alignItems: 'baseline',
//   },
//   readingValue: {
//     fontSize: 24,
//     fontWeight: '700',
//     marginRight: 6,
//   },
//   readingUnit: {
//     fontSize: 14,
//     color: colors.textLight,
//     fontWeight: '500',
//   },
//   readingRight: {
//     alignItems: 'flex-end',
//   },
//   readingContext: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: colors.charcoal,
//     textTransform: 'capitalize',
//     marginBottom: 4,
//   },
//   readingTime: {
//     fontSize: 12,
//     color: colors.textLight,
//   },
// });






// mobile-app/src/screens/DashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { useGlucoseStore } from '../stores/glucoseStore';
import { useCycleStore } from '../stores/cycleStore';
import { useSymptomStore } from '../stores/symptomStore';
import { coachService } from '../services/coach.service';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BotanicalBackground } from '../components/BotanicalBackground';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const { readings, stats, fetchReadings, fetchStats } = useGlucoseStore();
  const { currentCycle, fetchCurrentCycle } = useCycleStore();
  const { symptoms, fetchSymptoms } = useSymptomStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [cycleTrackingEnabled, setCycleTrackingEnabled] = useState(true);
  const [myCoach, setMyCoach] = useState<any>(null);

  useEffect(() => {
    loadData();
    loadSettings();
    loadMyCoach();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchReadings(),
      fetchStats(),
      fetchCurrentCycle(),
      fetchSymptoms(),
    ]);
  };

  const loadSettings = async () => {
    const enabled = await AsyncStorage.getItem('cycleTrackingEnabled');
    setCycleTrackingEnabled(enabled !== 'false');
  };

  const loadMyCoach = async () => {
    try {
      const response = await coachService.getClients();
      // This would need a different endpoint - for now just placeholder
      setMyCoach({ firstName: 'Alexia', lastName: 'Coach' });
    } catch (error) {
      console.log('No coach assigned');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGlucoseStatusColor = () => {
    const avg = stats?.average || stats?.avgGlucose || 0;
    if (avg < 70) return colors.red;
    if (avg > 180) return colors.warning;
    return colors.sage;
  };

  const getGlucoseStatusText = () => {
    const avg = stats?.average || stats?.avgGlucose || 0;
    if (avg < 70) return 'Low';
    if (avg > 180) return 'High';
    return 'In Range';
  };

  const formatCycleDay = () => {
    if (!currentCycle) return 'Not tracking';
    return `Day ${currentCycle.current_day} · ${currentCycle.phase}`;
  };

  return (
    <BotanicalBackground variant="green" intensity="light">
      <View style={styles.container}>
        {/* Modern Glass Header */}
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Hello,</Text>
              <Text style={styles.name}>{user?.firstName || 'there'} 🌿</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate('Conversations')}
              >
                <Text style={styles.iconButtonText}>💬</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <Text style={styles.iconButtonText}>⚙️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.sage} />
          }
        >
          {/* Quick Actions - Floating Pills */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionPill, styles.actionPillPrimary]}
              onPress={() => navigation.navigate('AddGlucose')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.sage, colors.forestGreen]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionPillGradient}
              >
                <Text style={styles.actionPillIcon}>📊</Text>
                <Text style={styles.actionPillText}>Log Glucose</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionPill}
              onPress={() => navigation.navigate('AddSymptom')}
              activeOpacity={0.8}
            >
              <View style={styles.actionPillContent}>
                <Text style={styles.actionPillIconSecondary}>✨</Text>
                <Text style={styles.actionPillTextSecondary}>Log Symptom</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Glucose Card - Modern Glass Design */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.cardTitle}>Glucose Overview</Text>
                <Text style={styles.cardSubtitle}>Last 7 days</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getGlucoseStatusColor() }]}>
                <Text style={styles.statusBadgeText}>{getGlucoseStatusText()}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Average</Text>
                <Text style={styles.statValue}>
                  {Math.round(stats?.average || stats?.avgGlucose || 0)}
                </Text>
                <Text style={styles.statUnit}>mg/dL</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>In Range</Text>
                <Text style={styles.statValue}>
                  {Math.round(stats?.in_range_percentage || stats?.timeInRange || 0)}
                </Text>
                <Text style={styles.statUnit}>%</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Readings</Text>
                <Text style={styles.statValue}>{stats?.count || 0}</Text>
                <Text style={styles.statUnit}>total</Text>
              </View>
            </View>

            {/* Recent Reading Preview */}
            {readings.length > 0 && (
              <View style={styles.recentReading}>
                <View style={styles.recentReadingDot} />
                <Text style={styles.recentReadingText}>
                  Latest: <Text style={styles.recentReadingValue}>{readings[0].glucose_level} mg/dL</Text>
                </Text>
                <Text style={styles.recentReadingTime}>
                  {new Date(readings[0].timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            )}
          </View>

          {/* Cycle Card - Only if enabled */}
          {cycleTrackingEnabled && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.cardTitle}>Cycle Tracking</Text>
                  <Text style={styles.cardSubtitle}>{formatCycleDay()}</Text>
                </View>
                <Text style={styles.cycleIcon}>🌸</Text>
              </View>

              {currentCycle ? (
                <View style={styles.cycleInfo}>
                  <View style={styles.cyclePhaseBar}>
                    <View 
                      style={[
                        styles.cyclePhaseProgress,
                        { width: `${(currentCycle.current_day / 28) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.cyclePhaseText}>
                    {currentCycle.phase.charAt(0).toUpperCase() + currentCycle.phase.slice(1)} Phase
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => navigation.navigate('LogCycle')}
                >
                  <Text style={styles.emptyStateButtonText}>+ Start Tracking Cycle</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Recent Symptoms */}
          {symptoms.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Recent Symptoms</Text>
                <Text style={styles.seeAllLink}>See all →</Text>
              </View>

              {symptoms.slice(0, 3).map((symptom) => (
                <View key={symptom.id} style={styles.symptomItem}>
                  <View style={styles.symptomLeft}>
                    <View style={[styles.severityDot, { 
                      backgroundColor: symptom.severity > 6 ? colors.red : 
                                      symptom.severity > 3 ? colors.warning : colors.sage 
                    }]} />
                    <Text style={styles.symptomType}>
                      {symptom.symptom_type.replace('_', ' ')}
                    </Text>
                  </View>
                  <Text style={styles.symptomSeverity}>{symptom.severity}/10</Text>
                </View>
              ))}
            </View>
          )}

          {/* Coach Card */}
          {myCoach && (
            <TouchableOpacity
              style={styles.coachCard}
              onPress={() => navigation.navigate('Conversations')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(184,164,95,0.15)', 'rgba(184,164,95,0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.coachCardGradient}
              >
                <View style={styles.coachAvatar}>
                  <Text style={styles.coachAvatarText}>
                    {myCoach.firstName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.coachInfo}>
                  <Text style={styles.coachLabel}>Your Coach</Text>
                  <Text style={styles.coachName}>
                    {myCoach.firstName} {myCoach.lastName}
                  </Text>
                  <Text style={styles.coachAction}>Message your coach →</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
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
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 15,
    color: colors.textLight,
    marginBottom: 4,
    fontWeight: '500',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.charcoal,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconButtonText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionPill: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  actionPillPrimary: {
    flex: 1.2,
  },
  actionPillGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionPillContent: {
    backgroundColor: colors.white,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionPillIcon: {
    fontSize: 24,
  },
  actionPillIconSecondary: {
    fontSize: 22,
  },
  actionPillText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.2,
  },
  actionPillTextSecondary: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.sage,
    letterSpacing: 0.2,
  },

  // Modern Cards
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.sage,
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderLight,
  },

  // Recent Reading
  recentReading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 10,
  },
  recentReadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.sage,
  },
  recentReadingText: {
    flex: 1,
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '500',
  },
  recentReadingValue: {
    fontWeight: '700',
    color: colors.textDark,
  },
  recentReadingTime: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Cycle
  cycleIcon: {
    fontSize: 28,
  },
  cycleInfo: {
    gap: 12,
  },
  cyclePhaseBar: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  cyclePhaseProgress: {
    height: '100%',
    backgroundColor: colors.accentPeach,
    borderRadius: 3,
  },
  cyclePhaseText: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.paleGreen,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.sage,
    letterSpacing: 0.2,
  },

  // Symptoms
  seeAllLink: {
    fontSize: 13,
    color: colors.sage,
    fontWeight: '600',
  },
  symptomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  symptomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  symptomType: {
    fontSize: 15,
    color: colors.textDark,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  symptomSeverity: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '600',
  },

  // Coach Card
  coachCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  coachCardGradient: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.white,
  },
  coachAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.goldLeaf,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  coachInfo: {
    flex: 1,
  },
  coachLabel: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  coachName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 4,
  },
  coachAction: {
    fontSize: 13,
    color: colors.goldLeaf,
    fontWeight: '600',
  },
});