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
  
  // Coach screens
  CoachDashboard: undefined;
  ClientDetail: { clientId: string };

  // Common screens
  Settings: undefined;
  Profile: undefined;
  RhythmProfile: undefined;

  // Messaging screens 
  Conversations: undefined;
  Messaging: { userId?: string; userName: string; conversationId?: string };
  HealthSync: undefined;

  // Group coaching screens
  JoinGroup: undefined;
  GroupDashboard: { groupId: string };
  GroupSessions: { groupId: string };
  SessionDetail: { groupId?: string; sessionId: string };
  GroupChat: { groupId: string };
  GroupMembers: { groupId: string };
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;