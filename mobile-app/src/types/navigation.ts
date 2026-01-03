// src/types/navigation.ts
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  Register: undefined;
  
  // User screens
  Dashboard: undefined;
  AddGlucose: undefined;
  AddSymptom: undefined;
  LogCycle: undefined;
  
  // Coach screens
  CoachDashboard: undefined;
  ClientDetail: { clientId: string };

   // 
  Messaging: { userId: string; userName: string };
  HealthSync: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;