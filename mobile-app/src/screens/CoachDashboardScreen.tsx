// // src/screens/CoachDashboardScreen.tsx
// import React, { useEffect } from 'react';
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
// import { useCoachStore } from '../stores/coachStore';
// import { colors } from '../theme/colors';

// type CoachDashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CoachDashboard'>;

// interface Props {
//   navigation: CoachDashboardScreenNavigationProp;
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

// export default function CoachDashboardScreen({ navigation }: Props) {
//   const { user, logout } = useAuthStore();
//   const { clients, isLoading, fetchClients, selectClient } = useCoachStore();

//   useEffect(() => {
//     fetchClients();
//   }, []);

//   const handleClientPress = (client: any) => {
//     selectClient(client);
//     navigation.navigate('ClientDetail', { clientId: client.id });
//   };

//   const getGlucoseStatus = (avgGlucose: number) => {
//     if (avgGlucose < 70) return { text: 'Low', color: '#EF4444' };
//     if (avgGlucose > 180) return { text: 'High', color: '#F59E0B' };
//     return { text: 'Good', color: colors.sage };
//   };

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//   <View>
//     <Text style={styles.subtitle}>Coach Dashboard</Text>
//     <Text style={styles.greeting}>Welcome, {user?.firstName}</Text>
//   </View>
//   <View style={styles.headerActions}>
//     <TouchableOpacity 
//       onPress={() => navigation.navigate('Conversations')} 
//       style={styles.messagesButton}
//     >
//       <Text style={styles.messagesButtonText}>💬</Text>
//     </TouchableOpacity>
//     <TouchableOpacity onPress={logout} style={styles.logoutButton}>
//       <Text style={styles.logoutText}>Logout</Text>
//     </TouchableOpacity>
//   </View>
// </View>

//       <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
//         {/* Stats Summary */}
//         <View style={styles.summaryCard}>
//           <Text style={styles.summaryTitle}>Your Clients</Text>
//           <View style={styles.summaryStats}>
//             <View style={styles.summaryStatItem}>
//               <Text style={styles.summaryStatValue}>{clients.length}</Text>
//               <Text style={styles.summaryStatLabel}>Total Clients</Text>
//             </View>
//             <View style={styles.summaryDivider} />
//             <View style={styles.summaryStatItem}>
//               <Text style={styles.summaryStatValue}>
//                 {clients.filter(c => c.recentStats.timeInRange >= 70).length}
//               </Text>
//               <Text style={styles.summaryStatLabel}>In Range</Text>
//             </View>
//             <View style={styles.summaryDivider} />
//             <View style={styles.summaryStatItem}>
//               <Text style={styles.summaryStatValue}>
//                 {clients.filter(c => c.recentStats.avgGlucose > 180 || c.recentStats.avgGlucose < 70).length}
//               </Text>
//               <Text style={styles.summaryStatLabel}>Need Attention</Text>
//             </View>
//           </View>
//         </View>

//         {/* Client List */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>All Clients</Text>

//           {isLoading && clients.length === 0 ? (
//             <ActivityIndicator size="large" color={colors.sage} style={{ marginTop: 20 }} />
//           ) : clients.length === 0 ? (
//             <View style={styles.emptyState}>
//               <Text style={styles.emptyText}>No clients yet</Text>
//               <Text style={styles.emptySubtext}>Clients will appear here once assigned</Text>
//             </View>
//           ) : (
//             clients.map((client) => {
//               const status = getGlucoseStatus(client.recentStats.avgGlucose);
//               return (
//                 <TouchableOpacity
//                   key={client.id}
//                   style={styles.clientCard}
//                   onPress={() => handleClientPress(client)}
//                 >
//                   {/* Client Info */}
//                   <View style={styles.clientHeader}>
//                     <View style={styles.clientAvatar}>
//                       <Text style={styles.clientInitial}>
//                         {client.firstName.charAt(0)}
//                       </Text>
//                     </View>
//                     <View style={styles.clientInfo}>
//                       <Text style={styles.clientName}>
//                         {client.firstName} {client.lastName}
//                       </Text>
//                       <Text style={styles.clientEmail}>{client.email}</Text>
//                     </View>
//                     <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
//                       <Text style={styles.statusText}>{status.text}</Text>
//                     </View>
//                   </View>

//                   {/* Client Stats */}
//                   <View style={styles.clientStats}>
//                     <View style={styles.clientStatItem}>
//                       <Text style={styles.clientStatLabel}>Avg Glucose</Text>
//                       <Text style={styles.clientStatValue}>
//                         {client.recentStats.avgGlucose?.toFixed(0) || '—'} mg/dL
//                       </Text>
//                     </View>
//                     <View style={styles.clientStatItem}>
//                       <Text style={styles.clientStatLabel}>Last Reading</Text>
//                       <Text style={styles.clientStatValue}>
//                         {client.recentStats.lastReading?.toFixed(0) || '—'} mg/dL
//                       </Text>
//                     </View>
//                     <View style={styles.clientStatItem}>
//                       <Text style={styles.clientStatLabel}>Time in Range</Text>
//                       <Text style={styles.clientStatValue}>
//                         {client.recentStats.timeInRange?.toFixed(0) || '—'}%
//                       </Text>
//                     </View>
//                   </View>

//                   {/* Arrow indicator */}
//                   <View style={styles.arrowContainer}>
//                     <Text style={styles.arrow}>›</Text>
//                   </View>
//                 </TouchableOpacity>
//               );
//             })
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
//   headerActions: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   gap: 8,
// },
// messagesButton: {
//   paddingVertical: 8,
//   paddingHorizontal: 14,
//   borderRadius: 8,
//   borderWidth: 1,
//   borderColor: colors.border,
//   backgroundColor: colors.white,
// },
// messagesButtonText: {
//   fontSize: 18,
// },
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
//     marginBottom: 4,
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
//   summaryCard: {
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
//   summaryTitle: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: colors.textDark,
//     marginBottom: 20,
//     letterSpacing: 0.3,
//   },
//   summaryStats: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   summaryStatItem: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   summaryDivider: {
//     width: 1,
//     height: 40,
//     backgroundColor: colors.border,
//   },
//   summaryStatValue: {
//     fontSize: 26,
//     fontWeight: '700',
//     color: colors.sage,
//     marginBottom: 6,
//   },
//   summaryStatLabel: {
//     fontSize: 12,
//     color: colors.textLight,
//     fontWeight: '500',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//     textAlign: 'center',
//   },
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
//   clientCard: {
//     backgroundColor: colors.white,
//     padding: 16,
//     borderRadius: 14,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   clientHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   clientAvatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: colors.lightSage,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   clientInitial: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: colors.sage,
//   },
//   clientInfo: {
//     flex: 1,
//   },
//   clientName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.textDark,
//     marginBottom: 4,
//   },
//   clientEmail: {
//     fontSize: 13,
//     color: colors.textLight,
//   },
//   statusBadge: {
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 12,
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: colors.white,
//   },
//   clientStats: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: colors.border,
//   },
//   clientStatItem: {
//     flex: 1,
//   },
//   clientStatLabel: {
//     fontSize: 11,
//     color: colors.textLight,
//     marginBottom: 4,
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   clientStatValue: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: colors.textDark,
//   },
//   arrowContainer: {
//     position: 'absolute',
//     right: 16,
//     top: '50%',
//     marginTop: -12,
//   },
//   arrow: {
//     fontSize: 24,
//     color: colors.textLight,
//     fontWeight: '300',
//   },
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
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { useCoachStore } from '../stores/coachStore';
import { colors } from '../theme/colors';
import { BotanicalBackground } from '../components/BotanicalBackground';

type CoachDashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CoachDashboard'>;

interface Props {
  navigation: CoachDashboardScreenNavigationProp;
}

export default function CoachDashboardScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const { clients, isLoading, fetchClients, selectClient } = useCoachStore();

  useEffect(() => {
    fetchClients();
  }, []);

  const handleClientPress = (client: any) => {
    selectClient(client);
    navigation.navigate('ClientDetail', { clientId: client.id });
  };

  const getGlucoseStatus = (avgGlucose: number) => {
    if (avgGlucose < 70) return { text: 'Low', color: colors.red, emoji: '⚠️' };
    if (avgGlucose > 180) return { text: 'High', color: colors.warning, emoji: '📈' };
    return { text: 'Good', color: colors.sage, emoji: '✅' };
  };

  const goodRangeCount = clients.filter(c => c.recentStats.timeInRange >= 70).length;
  const needsAttentionCount = clients.filter(
    c => c.recentStats.avgGlucose > 180 || c.recentStats.avgGlucose < 70
  ).length;

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
              <Text style={styles.subtitle}>Coach Dashboard</Text>
              <Text style={styles.greeting}>Welcome, {user?.firstName} 🌿</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Conversations')} 
                style={styles.iconButton}
              >
                <Text style={styles.iconButtonText}>💬</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stats Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Client Overview</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{clients.length}</Text>
                <Text style={styles.statLabel}>Total Clients</Text>
              </View>
              
              <View style={styles.statBox}>
                <LinearGradient
                  colors={['rgba(107,127,110,0.1)', 'rgba(107,127,110,0.05)']}
                  style={styles.statGradient}
                >
                  <Text style={[styles.statNumber, { color: colors.sage }]}>
                    {goodRangeCount}
                  </Text>
                  <Text style={styles.statLabel}>In Range</Text>
                  <Text style={styles.statEmoji}>✨</Text>
                </LinearGradient>
              </View>

              <View style={styles.statBox}>
                <LinearGradient
                  colors={['rgba(212,167,111,0.15)', 'rgba(212,167,111,0.05)']}
                  style={styles.statGradient}
                >
                  <Text style={[styles.statNumber, { color: colors.warning }]}>
                    {needsAttentionCount}
                  </Text>
                  <Text style={styles.statLabel}>Needs Care</Text>
                  <Text style={styles.statEmoji}>👀</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Client List */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Clients</Text>
              <View style={styles.clientCount}>
                <Text style={styles.clientCountText}>{clients.length}</Text>
              </View>
            </View>

            {isLoading && clients.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.sage} />
                <Text style={styles.loadingText}>Loading clients...</Text>
              </View>
            ) : clients.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🌱</Text>
                <Text style={styles.emptyText}>No clients yet</Text>
                <Text style={styles.emptySubtext}>Clients will appear here once assigned</Text>
              </View>
            ) : (
              clients.map((client, index) => {
                const status = getGlucoseStatus(client.recentStats.avgGlucose);
                return (
                  <TouchableOpacity
                    key={client.id}
                    style={[
                      styles.clientCard,
                      index === 0 && styles.clientCardFirst,
                    ]}
                    onPress={() => handleClientPress(client)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.95)']}
                      style={styles.clientCardGradient}
                    >
                      {/* Client Header */}
                      <View style={styles.clientHeader}>
                        <View style={styles.clientAvatar}>
                          <Text style={styles.clientInitial}>
                            {client.firstName.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.clientInfo}>
                          <Text style={styles.clientName}>
                            {client.firstName} {client.lastName}
                          </Text>
                          <Text style={styles.clientEmail}>{client.email}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                          <Text style={styles.statusEmoji}>{status.emoji}</Text>
                          <Text style={styles.statusText}>{status.text}</Text>
                        </View>
                      </View>

                      {/* Client Stats */}
                      <View style={styles.clientStats}>
                        <View style={styles.clientStatItem}>
                          <Text style={styles.clientStatLabel}>Avg Glucose</Text>
                          <Text style={[styles.clientStatValue, { color: status.color }]}>
                            {client.recentStats.avgGlucose?.toFixed(0) || '—'}
                          </Text>
                          <Text style={styles.clientStatUnit}>mg/dL</Text>
                        </View>
                        
                        <View style={styles.clientStatDivider} />
                        
                        <View style={styles.clientStatItem}>
                          <Text style={styles.clientStatLabel}>Last Reading</Text>
                          <Text style={styles.clientStatValue}>
                            {client.recentStats.lastReading?.toFixed(0) || '—'}
                          </Text>
                          <Text style={styles.clientStatUnit}>mg/dL</Text>
                        </View>
                        
                        <View style={styles.clientStatDivider} />
                        
                        <View style={styles.clientStatItem}>
                          <Text style={styles.clientStatLabel}>Time in Range</Text>
                          <Text style={styles.clientStatValue}>
                            {client.recentStats.timeInRange?.toFixed(0) || '—'}
                          </Text>
                          <Text style={styles.clientStatUnit}>%</Text>
                        </View>
                      </View>

                      {/* Arrow indicator */}
                      <View style={styles.arrowContainer}>
                        <Text style={styles.arrow}>→</Text>
                      </View>
                    </LinearGradient>
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
  subtitle: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  greeting: {
    fontSize: 26,
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
  logoutButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '700',
  },

  content: {
    flex: 1,
  },

  // Summary Card
  summaryCard: {
    margin: 20,
    marginBottom: 16,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 18,
    letterSpacing: 0.2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.sage,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  statEmoji: {
    position: 'absolute',
    top: 12,
    right: 12,
    fontSize: 16,
    opacity: 0.5,
  },

  // Section
  section: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    letterSpacing: 0.2,
  },
  clientCount: {
    backgroundColor: colors.paleGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  clientCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.sage,
  },

  // Client Cards
  clientCard: {
    marginBottom: 12,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  clientCardFirst: {
    marginTop: 0,
  },
  clientCardGradient: {
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.2)',
    borderRadius: 24,
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
    backgroundColor: colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  clientInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.sage,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  clientEmail: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  statusEmoji: {
    fontSize: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },

  // Client Stats
  clientStats: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  clientStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  clientStatLabel: {
    fontSize: 10,
    color: colors.textLight,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  clientStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 2,
  },
  clientStatUnit: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  clientStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderLight,
    marginHorizontal: 8,
  },

  arrowContainer: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -12,
  },
  arrow: {
    fontSize: 24,
    color: colors.sage,
    fontWeight: '300',
  },

  // Empty/Loading States
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textLight,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});