// mobile-app/src/navigation/AppNavigator.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import type { RootStackParamList } from '../types/navigation';

// Navigators
import TabNavigator from './TabNavigator';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// Stack screens pushed on top of tabs
import AddGlucoseScreen from '../screens/AddGlucoseScreen';
import AddSymptomScreen from '../screens/AddSymptomScreen';
import { LogCycleScreen } from '../screens/LogCycleScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RhythmProfileScreen from '../screens/RhythmProfileScreen';
import MessagingScreen from '../screens/MessagingScreen';
import { HealthSyncScreen } from '../screens/HealthSyncScreen';
import JoinGroupScreen from '../screens/JoinGroupScreen';
import GroupDashboardScreen from '../screens/GroupDashboardScreen';
import SessionDetailScreen from '../screens/SessionDetailScreen';

// Coach Screens
import CoachDashboardScreen from '../screens/CoachDashboardScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';
import ConversationsScreen from '../screens/ConversationsScreen';

import GroupChatScreen from '../screens/GroupChatScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth().finally(() => setIsLoading(false));
  }, [checkAuth]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6B7F6E" />
      </View>
    );
  }

  const isCoach = user?.role === 'coach';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {isAuthenticated ? (
          isCoach ? (
            // ── Coach stack (unchanged) ──────────────────────────────
            <>
              <Stack.Screen name="CoachDashboard" component={CoachDashboardScreen} />
              <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
              <Stack.Screen name="Conversations" component={ConversationsScreen} />
              <Stack.Screen name="Messaging" component={MessagingScreen} />
            </>
          ) : (
            // ── User stack with tabs as root ─────────────────────────
            <>
              {/* Tabs live at root — no header */}
              <Stack.Screen name="Dashboard" component={TabNavigator} />

              {/* All modal/push screens sit on top of the tabs */}
              <Stack.Screen name="AddGlucose" component={AddGlucoseScreen} />
              <Stack.Screen name="AddSymptom" component={AddSymptomScreen} />
              <Stack.Screen name="LogCycle" component={LogCycleScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="RhythmProfile" component={RhythmProfileScreen} />
              <Stack.Screen name="Messaging" component={MessagingScreen} />
              <Stack.Screen name="HealthSync" component={HealthSyncScreen} />
              <Stack.Screen name="JoinGroup" component={JoinGroupScreen} />
              <Stack.Screen name="GroupDashboard" component={GroupDashboardScreen} />
              <Stack.Screen name="GroupChat" component={GroupChatScreen} />
              <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
              <Stack.Screen name="Conversations" component={ConversationsScreen} />
            </>
          )
        ) : (
          // ── Auth stack ───────────────────────────────────────────
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F4' },
});