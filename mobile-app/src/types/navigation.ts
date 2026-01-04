// src/types/navigation.ts
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined; 
  
  // User screens
  Dashboard: undefined;
  AddGlucose: undefined;
  AddSymptom: undefined;
  LogCycle: undefined;
  // Profile: undefined;
  // HealthSync: undefined;    
  
  // Coach screens
  CoachDashboard: undefined;
  ClientDetail: { clientId: string };
  
  // Common screens navigated to from both user and coach
  Settings: undefined;
  Profile: undefined;

  // Messaging screens 
  Conversations: undefined;  // NEW: Inbox/conversations list
  Messaging: { userId: string; userName: string };
  HealthSync: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;