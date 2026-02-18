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
  Conversations: undefined;
  Messaging: { 
    userId?: string;          // legacy 1:1 direct message
    userName: string;         // display name always required
    conversationId?: string;  // new coach-client conversation
  };
  HealthSync: undefined;

  // ========================================
  // GROUP COACHING SCREENS (NEW - ADD THESE)
  // ========================================
  JoinGroup: undefined;
  GroupDashboard: { groupId: string };
  GroupSessions: { groupId: string };
  SessionDetail: { groupId?: string; sessionId: string }; // groupId optional for standalone sessions
  GroupChat: { groupId: string };
  GroupMembers: { groupId: string };
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;