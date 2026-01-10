// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
// } from 'react-native';
// import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import type { RootStackParamList } from '../types/navigation';
// import { useAuthStore } from '../stores/authStore';
// import { useGlucoseStore } from '../stores/glucoseStore';
// import { useSymptomStore } from '../stores/symptomStore';
// import { useCycleStore } from '../stores/cycleStore';
// import { CYCLE_PHASES } from '../types/cycle';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// // import { checkHealthKitStatus } from '../utils/healthKit.utils';
// import { colors } from '../theme/colors';
// import { ui } from '../theme/ui';

// type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

// interface Props {
//   navigation: DashboardScreenNavigationProp;
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
// //   accentPeach: '#D4A798',
// // };

// export default function DashboardScreen({ navigation }: Props) {
//   const { user, logout } = useAuthStore();
//   const { readings, stats, isLoading, fetchReadings, fetchStats } = useGlucoseStore();
//   const { symptoms, fetchSymptoms } = useSymptomStore();
//   const { currentCycle, fetchCurrentCycle } = useCycleStore();
//   const [cycleTrackingEnabled, setCycleTrackingEnabled] = useState(true);

//   useEffect(() => {
//     fetchReadings();
//     fetchStats();
//     fetchSymptoms();
//     fetchCurrentCycle();
//     //checkHealthKitStatus();
//     loadCycleTrackingSetting();
//   }, []);

//   const loadCycleTrackingSetting = async () => {
//     try {
//       const enabled = await AsyncStorage.getItem('cycleTrackingEnabled');
//       if (enabled !== null) {
//         setCycleTrackingEnabled(enabled === 'true');
//       }
//     } catch (error) {
//       console.error('Error loading cycle tracking setting:', error);
//     }
//   };

//   const formatDate = (dateString: string) => {
//     if (!dateString) return 'N/a';
    
//     try {
//       const date = new Date(dateString);
//       if (isNaN(date.getTime())) return 'N/a';
      
//       return date.toLocaleDateString('en-US', {
//         month: 'short',
//         day: 'numeric',
//         hour: 'numeric',
//         minute: '2-digit',
//       });
//     } catch (error) {
//       return 'N/a';
//     }
//   };

//   const getMealContextLabel = (context?: string) => {
//     const labels: Record<string, string> = {
//       fasting: 'Fasting',
//       pre_meal: 'Before Meal',
//       post_meal: 'After Meal',
//       bedtime: 'Bedtime',
//       other: 'Other',
//     };
//     return labels[context || 'other'] || 'Other';
//   };

//   const getSymptomLabel = (type: string) => {
//     const symptoms: Record<string, string> = {
//       headache: 'Headache',
//       fatigue: 'Fatigue',
//       dizziness: 'Dizziness',
//       hunger: 'Hunger',
//       irritability: 'Irritability',
//       nausea: 'Nausea',
//       shaking: 'Shaking',
//       sweating: 'Sweating',
//       brain_fog: 'Brain Fog',
//       anxiety: 'Anxiety',
//       cramps: 'Cramps',
//       bloating: 'Bloating',
//       mood_swings: 'Mood Swings',
//       other: 'Other',
//     };
//     return symptoms[type] || type;
//   };

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.subtitle}>GraceFlow</Text>
//           <Text style={styles.greeting}>Hello, {user?.firstName || 'there'}</Text>
//         </View>
//         <View style={styles.headerActions}>
//           <TouchableOpacity 
//             onPress={() => navigation.navigate('Settings')} 
//             style={styles.settingsButton}
//           >
//             <Text style={styles.settingsButtonText}>⚙️</Text>
//           </TouchableOpacity>
//           <TouchableOpacity 
//             onPress={() => navigation.navigate('Conversations')} 
//             style={styles.messagesButton}
//           >
//             <Text style={styles.messagesButtonText}>💬</Text>
//           </TouchableOpacity>
//           <TouchableOpacity onPress={logout} style={styles.logoutButton}>
//             <Text style={styles.logoutText}>Logout</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
//         {/* Stats Card */}
//         {stats && (
//   <View style={styles.statsCard}>
//     <Text style={styles.statsTitle}>Last 7 Days</Text>
//     <View style={styles.statsGrid}>
//       <View style={styles.statItem}>
//         <Text style={styles.statValue}>
//           {stats.avgGlucose?.toFixed(0) || stats.average?.toFixed(0) || '0'}
//         </Text>
//         <Text style={styles.statLabel}>Average</Text>
//       </View>
//       <View style={styles.statDivider} />
//       <View style={styles.statItem}>
//         <Text style={styles.statValue}>
//           {stats.minGlucose?.toFixed(0) || stats.min?.toFixed(0) || '0'}
//         </Text>
//         <Text style={styles.statLabel}>Lowest</Text>
//       </View>
//       <View style={styles.statDivider} />
//       <View style={styles.statItem}>
//         <Text style={styles.statValue}>
//           {stats.maxGlucose?.toFixed(0) || stats.max?.toFixed(0) || '0'}
//         </Text>
//         <Text style={styles.statLabel}>Highest</Text>
//       </View>
//       <View style={styles.statDivider} />
//       <View style={styles.statItem}>
//         <Text style={styles.statValue}>
//           {stats.timeInRange?.toFixed(0) || stats.in_range_percentage?.toFixed(0) || '0'}%
//         </Text>
//         <Text style={styles.statLabel}>In Range</Text>
//       </View>
//     </View>
//   </View>
// )}

//         {/* Cycle Card */}
//         {cycleTrackingEnabled && currentCycle && (
//           <View style={styles.cycleCard}>
//             <View style={styles.cycleHeader}>
//               <Text style={styles.cycleTitle}>Current Cycle</Text>
//               <View style={styles.cycleDayBadge}>
//                 <Text style={styles.cycleDayText}>Day {currentCycle.current_day}</Text>
//               </View>
//             </View>
//             <View style={styles.cyclePhaseContainer}>
//               <Text style={styles.cyclePhaseText}>
//                 {CYCLE_PHASES.find(p => p.id === currentCycle.phase)?.label || currentCycle.phase}
//               </Text>
//             </View>
//             {currentCycle.flow && (
//               <Text style={styles.cycleFlow}>
//                 Flow: {currentCycle.flow.charAt(0).toUpperCase() + currentCycle.flow.slice(1)}
//               </Text>
//             )}
//           </View>
//         )}

//         {/* Action Buttons */}
//         <View style={styles.quickActions}>
//           <TouchableOpacity
//             style={[styles.actionButton, styles.actionButtonPrimary]}
//             onPress={() => navigation.navigate('AddGlucose')}
//           >
//             <Text style={styles.actionButtonText}>Log Glucose</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity
//             style={[styles.actionButton, styles.actionButtonSecondary]}
//             onPress={() => navigation.navigate('AddSymptom')}
//           >
//             <Text style={styles.actionButtonTextSecondary}>Log Symptom</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Log Period Button */}
//         {cycleTrackingEnabled && (
//           <View style={styles.periodButtonContainer}>
//             <TouchableOpacity
//               style={styles.periodButton}
//               onPress={() => navigation.navigate('LogCycle')}
//             >
//               {/* <Text style={styles.periodButtonIcon}>🩸</Text> */}
//               <Text style={styles.cycleIcon}>🌿</Text>
//               <Text style={styles.periodButtonText}>Log Period Start</Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* Recent Symptoms */}
//         {symptoms.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Recent Symptoms</Text>
//             {symptoms.slice(0, 3).map((symptom) => (
//               <View key={symptom.id} style={styles.symptomCard}>
//                 <View style={styles.symptomHeader}>
//                   <View style={styles.symptomInfo}>
//                     <Text style={styles.symptomType}>
//                       {getSymptomLabel(symptom.symptom_type)}
//                     </Text>
//                     <Text style={styles.symptomDate}>
//                       {formatDate(symptom.logged_at)}
//                     </Text>
//                   </View>
//                   <View style={styles.severityBadge}>
//                     <Text style={styles.severityText}>{symptom.severity}/10</Text>
//                   </View>
//                 </View>
//                 {symptom.notes && (
//                   <Text style={styles.symptomNotes}>{symptom.notes}</Text>
//                 )}
//               </View>
//             ))}
//           </View>
//         )}

//         {/* Recent Readings */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Recent Readings</Text>

//           {isLoading && readings.length === 0 ? (
//             <ActivityIndicator size="large" color={colors.sage} style={{ marginTop: 20 }} />
//           ) : readings.length === 0 ? (
//             <View style={styles.emptyState}>
//               <Text style={styles.emptyText}>No readings yet</Text>
//               <Text style={styles.emptySubtext}>Tap "Log Glucose" to add your first reading</Text>
//             </View>
//           ) : (
//             readings.slice(0, 5).map((reading) => (
//               <View key={reading.id} style={styles.readingCard}>
//                 <View style={styles.readingHeader}>
//                   <View>
//                     <Text style={styles.readingValue}>{reading.created_at} mg/dL</Text>
//                     <Text style={styles.readingDate}>{formatDate(reading.created_at)}</Text>
//                   </View>
//                   <View style={styles.contextBadge}>
//                     <Text style={styles.contextText}>
//                       {getMealContextLabel(reading.meal_context)}
//                     </Text>
//                   </View>
//                 </View>
//                 {reading.notes && <Text style={styles.readingNotes}>{reading.notes}</Text>}
//               </View>
//             ))
//           )}
//         </View>

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
//   greeting: {
//     fontSize: 26,
//     fontWeight: '600',
//     color: colors.charcoal,
//     marginBottom: 4,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: colors.textLight,
//     fontWeight: '400',
//   },
//   headerActions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   settingsButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 14,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: colors.border,
//     backgroundColor: colors.white,
//   },
//   settingsButtonText: {
//     fontSize: 18,
//   },
//   messagesButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 14,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: colors.border,
//     backgroundColor: colors.white,
//   },
//   messagesButtonText: {
//     fontSize: 18,
//   },
//   logoutButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 14,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: colors.border,
//   },
//   logoutText: {
//     color: colors.textDark,
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   content: {
//     flex: 1,
//   },
  
//   // Stats Card
//   statsCard: {
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
//   statsTitle: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: colors.textDark,
//     marginBottom: 20,
//     letterSpacing: 0.3,
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   statItem: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   statDivider: {
//     width: 1,
//     height: 40,
//     backgroundColor: colors.border,
//   },
//   statValue: {
//     fontSize: 26,
//     fontWeight: '700',
//     color: colors.sage,
//     marginBottom: 6,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: colors.textLight,
//     fontWeight: '500',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },

//   // Cycle Card
//   cycleCard: {
//     backgroundColor: colors.white,
//     marginHorizontal: 20,
//     marginBottom: 16,
//     padding: 20,
//     borderRadius: 16,
//     borderLeftWidth: 4,
//     borderLeftColor: colors.accentPeach,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   cycleHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   cycleTitle: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: colors.textDark,
//     letterSpacing: 0.3,
//   },
//   cycleDayBadge: {
//     backgroundColor: colors.cream,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 12,
//   },
//   cycleDayText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: colors.charcoal,//warm brown was here but had an error
//   },
//   cyclePhaseContainer: {
//     backgroundColor: colors.cream,
//     padding: 12,
//     borderRadius: 10,
//     marginBottom: 10,
//   },
//   cyclePhaseText: {
//     fontSize: 15,
//     fontWeight: '500',
//     color: colors.textDark,
//     textAlign: 'center',
//   },
//   cycleFlow: {
//     fontSize: 13,
//     color: colors.textLight,
//     fontWeight: '500',
//   },


//   cycleCta: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   gap: 12,
//   padding: 16,
//   borderRadius: 20,
//   backgroundColor: colors.white,
//   borderWidth: 1,
//   // borderColor: colors.blush ?? '#D9A6A6',
// },
// cycleIcon: { fontSize: 22 },
// // cycleTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark },
// cycleSubtitle: { marginTop: 2, fontSize: 13, color: colors.textLight },
// cycleChevron: { fontSize: 22, color: colors.textLight },

//   // Action Buttons
//   quickActions: {
//     flexDirection: 'row',
//     gap: 12,
//     paddingHorizontal: 20,
//     marginBottom: 12,
//   },
//   actionButton: {
//     flex: 1,
//     padding: 18,
//     borderRadius: 14,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 6,
//     elevation: 3,
//   },
//   actionButtonPrimary: {
//     backgroundColor: colors.sage,
//   },
//   actionButtonSecondary: {
//     backgroundColor: colors.white,
//     borderWidth: 2,
//     borderColor: colors.sage,
//   },
//   actionButtonText: {
//     color: colors.white,
//     fontSize: 16,
//     fontWeight: '600',
//     letterSpacing: 0.3,
//   },
//   actionButtonTextSecondary: {
//     color: colors.sage,
//     fontSize: 16,
//     fontWeight: '600',
//     letterSpacing: 0.3,
//   },

//   // Period Button
//   periodButtonContainer: {
//     paddingHorizontal: 20,
//     marginBottom: 20,
//   },
//   periodButton: {
//     backgroundColor: colors.white,
//     borderWidth: 2,
//     borderColor: colors.accentPeach,
//     borderRadius: 14,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 6,
//     elevation: 2,
//   },
//   periodButtonIcon: {
//     fontSize: 20,
//     marginRight: 8,
//   },
//   periodButtonText: {
//     color: colors.accentPeach,
//     fontSize: 16,
//     fontWeight: '600',
//     letterSpacing: 0.3,
//   },

//   // Sections
//   section: {
//     paddingHorizontal: 20,
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: colors.charcoal,
//     marginBottom: 14,
//     letterSpacing: 0.2,
//   },

//   // Symptom Cards
//   symptomCard: {
//     backgroundColor: colors.white,
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 10,
//     borderLeftWidth: 3,
//     borderLeftColor: colors.lightSage,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.04,
//     shadowRadius: 4,
//     elevation: 1,
//   },
//   symptomHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//   },
//   symptomInfo: {
//     flex: 1,
//   },
//   symptomType: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.textDark,
//     marginBottom: 4,
//     letterSpacing: 0.2,
//   },
//   symptomDate: {
//     fontSize: 12,
//     color: colors.textLight,
//     fontWeight: '400',
//   },
//   severityBadge: {
//     backgroundColor: colors.cream,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 8,
//   },
//   severityText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: colors.charcoal,//warmBrown was here but had an error
//   },
//   symptomNotes: {
//     fontSize: 14,
//     color: colors.textLight,
//     marginTop: 10,
//     lineHeight: 20,
//   },

//   // Reading Cards
//   readingCard: {
//     backgroundColor: colors.white,
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.04,
//     shadowRadius: 4,
//     elevation: 1,
//   },
//   readingHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 4,
//   },
//   readingValue: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: colors.sage,
//     marginBottom: 4,
//   },
//   readingDate: {
//     fontSize: 12,
//     color: colors.textLight,
//     fontWeight: '400',
//   },
//   contextBadge: {
//     backgroundColor: colors.cream,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 8,
//   },
//   contextText: {
//     fontSize: 12,
//     color: colors.textDark,
//     fontWeight: '500',
//   },
//   readingNotes: {
//     fontSize: 14,
//     color: colors.textLight,
//     marginTop: 8,
//     lineHeight: 20,
//   },

//   // Empty State
//   emptyState: {
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: colors.textLight,
//     marginBottom: 6,
//     fontWeight: '500',
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: colors.textLight,
//     textAlign: 'center',
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


// mobile-app/src/screens/DashboardScreen.enhanced.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { useGlucoseStore } from '../stores/glucoseStore';
import { useSymptomStore } from '../stores/symptomStore';
import { useCycleStore } from '../stores/cycleStore';
import { CYCLE_PHASES } from '../types/cycle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { GradientBackground } from '../components/GradientBackground';


type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

// Animated Progress Ring Component
const ProgressRing: React.FC<{ percentage: number; size: number; strokeWidth: number; color: string }> = ({
  percentage,
  size,
  strokeWidth,
  color,
}) => {
  const [animation] = useState(new Animated.Value(0));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: percentage,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  return (
    <View style={{ width: size, height: size, transform: [{ rotate: '-90deg' }] }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.paleGreen,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          borderTopColor: color,
          transform: [{ rotate: `${(strokeDashoffset / circumference) * 360}deg` }],
        }}
      />
    </View>
  );
};

export default function DashboardScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const { readings, stats, isLoading, fetchReadings, fetchStats } = useGlucoseStore();
  const { symptoms, fetchSymptoms } = useSymptomStore();
  const { currentCycle, fetchCurrentCycle } = useCycleStore();
  const [cycleTrackingEnabled, setCycleTrackingEnabled] = useState(true);
  const [streak, setStreak] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchReadings();
    fetchStats();
    fetchSymptoms();
    fetchCurrentCycle();
    loadCycleTrackingSetting();
    calculateStreak();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadCycleTrackingSetting = async () => {
    try {
      const enabled = await AsyncStorage.getItem('cycleTrackingEnabled');
      if (enabled !== null) {
        setCycleTrackingEnabled(enabled === 'true');
      }
    } catch (error) {
      console.error('Error loading cycle tracking setting:', error);
    }
  };

  const calculateStreak = async () => {
    // Calculate consecutive days with at least one reading
    const today = new Date();
    let currentStreak = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const hasReading = readings.some((r) => {
        const readingDate = new Date(r.created_at);
        return readingDate.toDateString() === checkDate.toDateString();
      });
      
      if (hasReading) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }
    
    setStreak(currentStreak);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/a';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/a';
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch (error) {
      return 'N/a';
    }
  };

  const getMealContextLabel = (context?: string) => {
    const labels: Record<string, string> = {
      fasting: 'Fasting',
      pre_meal: 'Before Meal',
      post_meal: 'After Meal',
      bedtime: 'Bedtime',
      other: 'Other',
    };
    return labels[context || 'other'] || 'Other';
  };

  const getSymptomLabel = (type: string) => {
    const symptoms: Record<string, string> = {
      headache: 'Headache',
      fatigue: 'Fatigue',
      dizziness: 'Dizziness',
      hunger: 'Hunger',
      irritability: 'Irritability',
      nausea: 'Nausea',
      shaking: 'Shaking',
      sweating: 'Sweating',
      brain_fog: 'Brain Fog',
      anxiety: 'Anxiety',
      cramps: 'Cramps',
      bloating: 'Bloating',
      mood_swings: 'Mood Swings',
      other: 'Other',
    };
    return symptoms[type] || type;
  };

  const getGlucoseColor = (value: number) => {
    if (value < 70) return colors.red;
    if (value > 180) return colors.yellow;
    return colors.sage;
  };

  return (
     <GradientBackground variant="default">
    <View style={styles.container}>
      {/* Header with Gradient */}
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>GraceFlow</Text>
          <Text style={styles.greeting}>Hello, {user?.firstName || 'there'} 👋</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Settings')} 
            style={styles.iconButton}
          >
            <Ionicons name="settings-outline" size={24} color={colors.sage} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Conversations')} 
            style={styles.iconButton}
          >
            <Ionicons name="chatbubbles-outline" size={24} color={colors.sage} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Streak Card */}
          {streak > 0 && (
            <View style={styles.streakCard}>
              <View style={styles.streakIconContainer}>
                <Text style={styles.streakIcon}>🔥</Text>
              </View>
              <View style={styles.streakTextContainer}>
                <Text style={styles.streakNumber}>{streak} Day Streak!</Text>
                <Text style={styles.streakSubtext}>Keep up the great work!</Text>
              </View>
            </View>
          )}

          {/* Enhanced Stats Card with Progress Rings */}
          {stats && (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Last 7 Days</Text>
              
              <View style={styles.statsMainContainer}>
                {/* Large Progress Ring for Time in Range */}
                <View style={styles.mainProgressContainer}>
                  <View style={styles.progressRingWrapper}>
                    <ProgressRing
                      percentage={Math.round(stats.timeInRange || stats.in_range_percentage || 0)}
                      size={140}
                      strokeWidth={12}
                      color={colors.sage}
                    />
                    <View style={styles.progressCenter}>
                      <Text style={styles.progressValue}>
                        {stats.timeInRange?.toFixed(0) || stats.in_range_percentage?.toFixed(0) || '0'}%
                      </Text>
                      <Text style={styles.progressLabel}>In Range</Text>
                    </View>
                  </View>
                </View>

                {/* Mini Stats */}
                <View style={styles.miniStatsContainer}>
                  <View style={styles.miniStatCard}>
                    <Ionicons name="trending-up" size={20} color={colors.sage} />
                    <Text style={styles.miniStatValue}>
                      {stats.avgGlucose?.toFixed(0) || stats.average?.toFixed(0) || '0'}
                    </Text>
                    <Text style={styles.miniStatLabel}>Average</Text>
                  </View>

                  <View style={styles.miniStatCard}>
                    <Ionicons name="arrow-down" size={20} color={colors.accentBlue} />
                    <Text style={styles.miniStatValue}>
                      {stats.minGlucose?.toFixed(0) || stats.min?.toFixed(0) || '0'}
                    </Text>
                    <Text style={styles.miniStatLabel}>Lowest</Text>
                  </View>

                  <View style={styles.miniStatCard}>
                    <Ionicons name="arrow-up" size={20} color={colors.red} />
                    <Text style={styles.miniStatValue}>
                      {stats.maxGlucose?.toFixed(0) || stats.max?.toFixed(0) || '0'}
                    </Text>
                    <Text style={styles.miniStatLabel}>Highest</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Enhanced Cycle Card */}
          {cycleTrackingEnabled && currentCycle && (
            <View style={styles.cycleCard}>
              <View style={styles.cycleHeader}>
                <View style={styles.cycleIconWrapper}>
                  <Text style={styles.cycleEmoji}>🌸</Text>
                </View>
                <View style={styles.cycleInfo}>
                  <Text style={styles.cycleTitle}>Current Cycle</Text>
                  <Text style={styles.cyclePhase}>
                    {CYCLE_PHASES.find(p => p.id === currentCycle.phase)?.label || currentCycle.phase}
                  </Text>
                </View>
                <View style={styles.cycleDayBadge}>
                  <Text style={styles.cycleDayText}>Day {currentCycle.current_day}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Fun Action Buttons */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => navigation.navigate('AddGlucose')}
            >
              <Ionicons name="water" size={24} color={colors.white} />
              <Text style={styles.actionButtonText}>Log Glucose</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={() => navigation.navigate('AddSymptom')}
            >
              <Ionicons name="heart-outline" size={24} color={colors.sage} />
              <Text style={styles.actionButtonTextSecondary}>Log Symptom</Text>
            </TouchableOpacity>
          </View>

          {/* Log Period Button */}
          {cycleTrackingEnabled && (
            <TouchableOpacity
              style={styles.periodButton}
              onPress={() => navigation.navigate('LogCycle')}
            >
              <Text style={styles.periodEmoji}>🩸</Text>
              <Text style={styles.periodButtonText}>Log Period Start</Text>
            </TouchableOpacity>
          )}

          {/* Recent Symptoms with Icons */}
          {symptoms.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Symptoms</Text>
              {symptoms.slice(0, 3).map((symptom) => (
                <View key={symptom.id} style={styles.symptomCard}>
                  <View style={styles.symptomIconContainer}>
                    <Ionicons name="fitness" size={24} color={colors.accentPeach} />
                  </View>
                  <View style={styles.symptomContent}>
                    <View style={styles.symptomHeader}>
                      <Text style={styles.symptomType}>
                        {getSymptomLabel(symptom.symptom_type)}
                      </Text>
                      <View style={styles.severityBadge}>
                        <Text style={styles.severityText}>{symptom.severity}/10</Text>
                      </View>
                    </View>
                    <Text style={styles.symptomDate}>
                      {formatDate(symptom.logged_at)}
                    </Text>
                    {symptom.notes && (
                      <Text style={styles.symptomNotes}>{symptom.notes}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Enhanced Recent Readings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Readings</Text>

            {isLoading && readings.length === 0 ? (
              <ActivityIndicator size="large" color={colors.sage} style={{ marginTop: 20 }} />
            ) : readings.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📊</Text>
                <Text style={styles.emptyText}>No readings yet</Text>
                <Text style={styles.emptySubtext}>Tap "Log Glucose" to add your first reading</Text>
              </View>
            ) : (
              readings.slice(0, 5).map((reading) => (
                <View key={reading.id} style={styles.readingCard}>
                  <View
                    style={[
                      styles.readingIndicator,
                      { backgroundColor: getGlucoseColor(reading.glucose_level) },
                    ]}
                  />
                  <View style={styles.readingContent}>
                    <View style={styles.readingHeader}>
                      <View>
                        <Text style={[
                          styles.readingValue,
                          { color: getGlucoseColor(reading.glucose_level) }
                        ]}>
                          {reading.glucose_level} <Text style={styles.readingUnit}>mg/dL</Text>
                        </Text>
                        <Text style={styles.readingDate}>{formatDate(reading.created_at)}</Text>
                      </View>
                      <View style={styles.contextBadge}>
                        <Text style={styles.contextText}>
                          {getMealContextLabel(reading.meal_context)}
                        </Text>
                      </View>
                    </View>
                    {reading.notes && <Text style={styles.readingNotes}>{reading.notes}</Text>}
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '400',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },

  // Streak Card
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.goldLeaf,
    shadowColor: colors.goldLeaf,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  streakIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  streakIcon: {
    fontSize: 32,
  },
  streakTextContainer: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.goldLeaf,
    marginBottom: 4,
  },
  streakSubtext: {
    fontSize: 14,
    color: colors.textLight,
  },

  // Enhanced Stats Card
  statsCard: {
    backgroundColor: colors.white,
    margin: 20,
    marginTop: 0,
    marginBottom: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  statsMainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainProgressContainer: {
    alignItems: 'center',
  },
  progressRingWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.sage,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  miniStatsContainer: {
    flex: 1,
    marginLeft: 20,
    gap: 12,
  },
  miniStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  miniStatLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 'auto',
  },

  // Cycle Card
  cycleCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    borderLeftWidth: 6,
    borderLeftColor: colors.accentPeach,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cycleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cycleIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cycleEmoji: {
    fontSize: 24,
  },
  cycleInfo: {
    flex: 1,
  },
  cycleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  cyclePhase: {
    fontSize: 14,
    color: colors.textLight,
  },
  cycleDayBadge: {
    backgroundColor: colors.accentPeach,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cycleDayText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },

  // Action Buttons
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonPrimary: {
    backgroundColor: colors.sage,
  },
  actionButtonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.sage,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  actionButtonTextSecondary: {
    color: colors.sage,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Period Button
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.accentPeach,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  periodEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  periodButtonText: {
    color: colors.accentPeach,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 16,
    letterSpacing: 0.2,
  },

  // Symptom Cards
  symptomCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accentPeach,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  symptomIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  symptomContent: {
    flex: 1,
  },
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  symptomType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    letterSpacing: 0.2,
  },
  symptomDate: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
  },
  severityBadge: {
    backgroundColor: colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
  },
  symptomNotes: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },

  // Reading Cards
  readingCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  readingIndicator: {
    width: 6,
  },
  readingContent: {
    flex: 1,
    padding: 16,
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  readingValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  readingUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textLight,
  },
  readingDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  contextBadge: {
    backgroundColor: colors.cream,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  contextText: {
    fontSize: 12,
    color: colors.textDark,
    fontWeight: '600',
  },
  readingNotes: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textDark,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
});