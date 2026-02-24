// mobile-app/src/screens/MeScreen.tsx
// "Me" tab — logging actions + settings hub

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { BotanicalBackground } from '../components/BotanicalBackground';
import { colors } from '../theme/colors';
import { useAuthStore } from '../stores/authStore';
import { AxisMarker, SeverityContinuum } from '../components/SimpleIcons';

export default function MeScreen({ navigation }: { navigation: any }) {
  const { user, logout } = useAuthStore();

  return (
    <BotanicalBackground variant="green" intensity="light">
      <View style={styles.container}>

        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.firstName?.charAt(0) || '?'}</Text>
          </View>
          <View>
            <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* Log */}
          <Text style={styles.sectionLabel}>LOG</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('AddGlucose')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(107,127,110,0.12)' }]}>
                <AxisMarker size={20} color={colors.forestGreen} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionLabel}>Log Glucose</Text>
                <Text style={styles.actionDesc}>Record a blood sugar reading</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('AddSymptom')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(184,164,95,0.12)' }]}>
                <SeverityContinuum size={20} color={colors.goldLeaf} muted={colors.muted} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionLabel}>Log Symptoms</Text>
                <Text style={styles.actionDesc}>Track how you're feeling</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('LogCycle')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(61,85,64,0.1)' }]}>
                <Text style={{ fontSize: 18 }}>🌿</Text>
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionLabel}>Log Cycle</Text>
                <Text style={styles.actionDesc}>Update your cycle dates</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Preferences */}
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('RhythmProfile')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(107,127,110,0.12)' }]}>
                <Text style={{ fontSize: 18 }}>🌾</Text>
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionLabel}>Rhythm Profile</Text>
                <Text style={styles.actionDesc}>Regular, PCOS, perimenopause…</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(107,127,110,0.08)' }]}>
                <Text style={{ fontSize: 18 }}>⚙️</Text>
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionLabel}>Settings</Text>
                <Text style={styles.actionDesc}>App preferences & account</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('HealthSync')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(122,146,168,0.12)' }]}>
                <Text style={{ fontSize: 18 }}>❤️</Text>
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionLabel}>Apple Health</Text>
                <Text style={styles.actionDesc}>Sync your health data</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Account */}
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.card}>
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
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(200,90,84,0.1)' }]}>
                <Text style={{ fontSize: 18 }}>👋</Text>
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionLabel, { color: colors.error }]}>Logout</Text>
                <Text style={styles.actionDesc}>Sign out of your account</Text>
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
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(212,214,212,0.2)',
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(107,127,110,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(107,127,110,0.2)',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: colors.forestGreen },
  name: { fontSize: 20, fontWeight: '700', color: colors.textDark, letterSpacing: -0.3 },
  email: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  content: { flex: 1 },
  scrollContent: { padding: 20 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
    color: 'rgba(107,127,110,0.6)', marginBottom: 10, marginTop: 8,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 18, padding: 6, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionContent: { flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: '600', color: colors.textDark, marginBottom: 2 },
  actionDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  arrow: { fontSize: 18, color: 'rgba(42,45,42,0.25)' },
  divider: { height: 1, backgroundColor: 'rgba(212,214,212,0.3)', marginHorizontal: 14 },
});