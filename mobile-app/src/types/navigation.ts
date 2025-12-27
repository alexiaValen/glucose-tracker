import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  AddGlucose: undefined;
  AddSymptom: undefined;
  LogCycle: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
