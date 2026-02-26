// mobile-app/src/types/navigation.ts
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  // Auth
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;

  // Root (tabs)
  Dashboard: undefined;

  // User screens
  AddGlucose: undefined;
  AddSymptom: undefined;
  LogCycle: undefined;

  // Coach screens
  CoachDashboard: undefined;
  ClientDetail: { clientId: string };
  ClientPreview: { clientId: string; clientName: string };

  // Common
  Settings: undefined;
  Profile: undefined;
  RhythmProfile: undefined;

  // Messaging
  Conversations: undefined;
  Messaging: { userId?: string; userName: string; conversationId?: string };
  HealthSync: undefined;

  // Group screens
  JoinGroup: undefined;
  GroupDashboard: { groupId: string };
  GroupSessions: { groupId: string };
  SessionDetail: { groupId?: string; sessionId: string };
  GroupChat: { groupId: string; groupName: string };
  GroupMembers: { groupId: string };
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;