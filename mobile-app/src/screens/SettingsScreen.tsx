// mobile-app/src/screens/SettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { BotanicalBackground } from '../components/BotanicalBackground';
import { CYCLE_PROFILE_KEY, CycleProfile } from './RhythmProfileScreen';

const PROFILE_LABELS: Record<CycleProfile, string> = {
  regular: 'Regular Cycle',
  irregular: 'Irregular / PCOS',
  perimenopause: 'Perimenopause',
  menopause: 'Menopause',
  unknown: 'Not Sure',
};

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

const CYCLE_TRACKING_KEY = 'cycleTrackingEnabled';

export default function SettingsScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const [cycleTrackingEnabled, setCycleTrackingEnabled] = useState(true);
  const [cycleProfile, setCycleProfile] = useState<CycleProfile>('regular');

  useEffect(() => {
    loadSettings();
  }, []);

  // Refresh profile label when returning from RhythmProfileScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadSettings);
    return unsubscribe;
  }, [navigation]);

  const loadSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem(CYCLE_TRACKING_KEY);
      if (enabled !== null) setCycleTrackingEnabled(enabled === 'true');
      const profile = await AsyncStorage.getItem(CYCLE_PROFILE_KEY);
      if (profile) setCycleProfile(profile as CycleProfile);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleCycleTracking = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(CYCLE_TRACKING_KEY, value.toString());
      setCycleTrackingEnabled(value);
      if (!value) {
        Alert.alert(
          'Rhythm Tracking Disabled',
          'Rhythm features have been hidden. You can re-enable them anytime in settings.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save setting');
    }
  };

  return (
    <BotanicalBackground variant="green" intensity="light">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile */}
          <Text style={styles.sectionHeader}>PROFILE</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {user?.firstName?.charAt(0) || 'U'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.firstName} {user?.lastName}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
              </View>
            </View>
          </View>

          {/* Features */}
          <Text style={styles.sectionHeader}>FEATURES</Text>
          <View style={styles.card}>

            {/* Rhythm Profile row */}
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('RhythmProfile')}
            >
              <View style={styles.actionLeft}>
                <Text style={styles.actionLabel}>My Rhythm Profile</Text>
                <Text style={styles.actionDescription}>{PROFILE_LABELS[cycleProfile]}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Rhythm tracking toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Rhythm Tracking</Text>
                <Text style={styles.settingDescription}>
                  Show spiritual rhythm content on your dashboard
                </Text>
              </View>
              <Switch
                value={cycleTrackingEnabled}
                onValueChange={toggleCycleTracking}
                trackColor={{ false: 'rgba(212,214,212,0.5)', true: colors.forestGreen }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="rgba(212,214,212,0.5)"
              />
            </View>

            {cycleTrackingEnabled && (
              <View style={styles.helperBox}>
                <Text style={styles.helperText}>
                  ✓ Rhythm tracking enabled. Content visible on dashboard.
                </Text>
              </View>
            )}
          </View>

          {/* Account */}
          <Text style={styles.sectionHeader}>ACCOUNT</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('HealthSync')}
            >
              <View style={styles.actionLeft}>
                <Text style={styles.actionLabel}>Apple Health</Text>
                <Text style={styles.actionDescription}>Sync glucose data</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => Alert.alert('Change Password', 'Password change feature coming soon', [{ text: 'OK' }])}
            >
              <View style={styles.actionLeft}>
                <Text style={styles.actionLabel}>Change Password</Text>
                <Text style={styles.actionDescription}>Update your password</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: logout },
                ]
              )}
            >
              <View style={styles.actionLeft}>
                <Text style={[styles.actionLabel, { color: '#EF4444' }]}>Logout</Text>
                <Text style={styles.actionDescription}>Sign out of your account</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(212,214,212,0.25)',
  },
  backButton: { paddingVertical: 8 },
  backText: { color: colors.forestGreen, fontSize: 15, fontWeight: '500', letterSpacing: 0.2 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#2B2B2B', letterSpacing: -0.2 },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 24 },
  sectionHeader: {
    fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase',
    color: 'rgba(42,45,42,0.5)', marginBottom: 12, marginTop: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(107,127,110,0.15)', borderWidth: 1, borderColor: 'rgba(107,127,110,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  profileAvatarText: { fontSize: 26, fontWeight: '700', color: colors.forestGreen },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '600', color: '#2B2B2B', marginBottom: 4 },
  profileEmail: { fontSize: 14, color: 'rgba(42,45,42,0.5)' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  settingLeft: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: '600', color: '#2B2B2B', marginBottom: 4 },
  settingDescription: { fontSize: 13, color: 'rgba(42,45,42,0.5)', lineHeight: 18 },
  helperBox: { backgroundColor: 'rgba(107,127,110,0.08)', borderRadius: 12, padding: 14, marginTop: 16 },
  helperText: { fontSize: 13, color: 'rgba(42,45,42,0.7)', lineHeight: 18 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  actionLeft: { flex: 1 },
  actionLabel: { fontSize: 16, fontWeight: '600', color: '#2B2B2B', marginBottom: 4 },
  actionDescription: { fontSize: 13, color: 'rgba(42,45,42,0.5)' },
  arrow: { fontSize: 20, color: 'rgba(42,45,42,0.3)' },
  divider: { height: 1, backgroundColor: 'rgba(212,214,212,0.3)', marginVertical: 16 },
});