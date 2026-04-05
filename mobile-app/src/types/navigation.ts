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
  LessonDetail: { lesson: any };
  ClientLessons: undefined;

  // Coach screens
  CoachDashboard: undefined;
  ClientDetail: { clientId: string };
  ClientPreview: { clientId: string; clientName: string };
  CreateLesson: { clientId?: string; clientName?: string; lessonId?: string };
  CoachLessons: undefined;

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
  GroupEvents: { groupId: string; groupName: string; isCoach?: boolean };
  SessionDetail: { groupId?: string; sessionId: string };
  GroupChat: { groupId: string; groupName: string };
  GroupMembers: { groupId: string };
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;