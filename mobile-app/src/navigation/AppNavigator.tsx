import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import type { RootStackParamList } from '../types/navigation';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// User Screens
import DashboardScreen from '../screens/DashboardScreen';
import AddGlucoseScreen from '../screens/AddGlucoseScreen';
import AddSymptomScreen from '../screens/AddSymptomScreen';
import LogCycleScreen from '../screens/LogCycleScreen';

// Coach Screens
import CoachDashboardScreen from '../screens/CoachDashboardScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';

// Shared Screens
import ConversationsScreen from '../screens/ConversationsScreen';
import MessagingScreen from '../screens/MessagingScreen';

// Colors matching Dashboard
const colors = {
  sage: '#7A8B6F',
  cream: '#FAF8F4',
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    
    initializeAuth();
  }, [checkAuth]);

  // Loading screen
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.sage} />
      </View>
    );
  }

  // Determine if user is a coach
  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        {isAuthenticated ? (
          // Authenticated Stack - Different based on role
          isCoach ? (
            // Coach Stack
            <>
              <Stack.Screen 
                name="CoachDashboard" 
                component={CoachDashboardScreen}
              />
              <Stack.Screen 
                name="ClientDetail" 
                component={ClientDetailScreen}
              />
              <Stack.Screen 
                name="Conversations" 
                component={ConversationsScreen}
              />
              <Stack.Screen 
                name="Messaging" 
                component={MessagingScreen}
              />
              <Stack.Screen 
              name="ForgotPassword" component={ForgotPasswordScreen}
               />
            </>
          ) : (
            // User Stack
            <>
              <Stack.Screen 
                name="Dashboard" 
                component={DashboardScreen}
              />
              <Stack.Screen 
                name="AddGlucose" 
                component={AddGlucoseScreen}
              />
              <Stack.Screen 
                name="AddSymptom" 
                component={AddSymptomScreen}
              />
              <Stack.Screen 
                name="LogCycle" 
                component={LogCycleScreen}
              />
              <Stack.Screen 
                name="Conversations" 
                component={ConversationsScreen}
              />
              <Stack.Screen 
                name="Messaging" 
                component={MessagingScreen}
              />
            </>
          )
        ) : (
          // Unauthenticated Stack
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
});