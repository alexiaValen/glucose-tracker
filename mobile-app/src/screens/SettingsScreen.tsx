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

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

// const colors = {
//   sage: '#7A8B6F',
//   charcoal: '#3A3A3A',
//   cream: '#FAF8F4',
//   white: '#FFFFFF',
//   textDark: '#2C2C2C',
//   textLight: '#6B6B6B',
//   border: '#E8E6E0',
// };

const CYCLE_TRACKING_KEY = 'cycleTrackingEnabled';

export default function SettingsScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const [cycleTrackingEnabled, setCycleTrackingEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem(CYCLE_TRACKING_KEY);
      if (enabled !== null) {
        setCycleTrackingEnabled(enabled === 'true');
      }
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
          'Cycle Tracking Disabled',
          'Cycle tracking features have been hidden. You can re-enable them anytime in settings.'
        );
      }
    } catch (error) {
      console.error('Error saving setting:', error);
      Alert.alert('Error', 'Failed to save setting');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Menstrual Cycle Tracking</Text>
                <Text style={styles.settingDescription}>
                  Track your cycle and see how it affects glucose
                </Text>
              </View>
              <Switch
                value={cycleTrackingEnabled}
                onValueChange={toggleCycleTracking}
                trackColor={{ false: colors.border, true: colors.sage }}
                thumbColor={colors.white}
              />
            </View>

            <Text style={styles.helperText}>
              {cycleTrackingEnabled 
                ? 'Cycle tracking is enabled. Cycle card and "Log Period" button are visible.'
                : 'Cycle tracking is disabled. Perfect for users experiencing menopause or who prefer not to track.'}
            </Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={() => {
            Alert.alert(
              'Change Password',
              'Password change feature coming soon!',
              [{ text: 'OK' }]
            );
          }}>
            <Text style={styles.actionText}>Change Password</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, styles.dangerCard]} 
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: logout }
                ]
              );
            }}
          >
            <Text style={styles.dangerText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    color: colors.sage,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  profileInfo: {
    paddingVertical: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textLight,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
  },
  helperText: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
  },
  dangerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  arrow: {
    fontSize: 24,
    color: colors.textLight,
    fontWeight: '300',
  },
});