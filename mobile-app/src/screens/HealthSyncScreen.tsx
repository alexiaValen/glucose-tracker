// mobile-app/src/screens/HealthSyncScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { BotanicalBackground } from '../components/BotanicalBackground';

export const HealthSyncScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  // Keep the platform guard (Apple Health is iOS only)
  if (Platform.OS !== 'ios') {
    return (
      <BotanicalBackground variant="green" intensity="light">
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Apple Health</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.unavailableContainer}>
            <Ionicons name="phone-portrait-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.unavailableTitle}>iOS Only</Text>
            <Text style={styles.unavailableText}>
              Apple Health integration is only available on iOS devices.
            </Text>
          </View>
        </View>
      </BotanicalBackground>
    );
  }

  return (
    <BotanicalBackground variant="green" intensity="light">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Apple Health</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Coming Soon Card */}
          <View style={styles.section}>
            <View style={styles.comingSoonCard}>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>COMING SOON</Text>
                </View>
              </View>

              <View style={styles.heroRow}>
                <View style={styles.heroIcon}>
                  <Ionicons name="heart-outline" size={26} color={colors.primary} />
                </View>
                <View style={styles.heroText}>
                  <Text style={styles.heroTitle}>Apple Watch + Health Sync</Text>
                  <Text style={styles.heroSubtitle}>
                    We’re polishing this feature to make it reliable before turning it on.
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.bullets}>
                <View style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.bulletText}>
                    Sync glucose readings from Apple Health into GraceFlow
                  </Text>
                </View>

                <View style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.bulletText}>
                    Optional background sync (hands-free)
                  </Text>
                </View>

                <View style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.bulletText}>
                    Share synced insights with your coach (only what you choose)
                  </Text>
                </View>
              </View>

              <View style={styles.infoNote}>
                <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.infoNoteText}>
                  Feature will be enabled in a future update.
                </Text>
              </View>

              {/* Disabled action */}
              <TouchableOpacity style={styles.disabledButton} activeOpacity={1}>
                <Text style={styles.disabledButtonText}>Enable Apple Health (Coming Soon)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Why disabled / transparency */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why it’s disabled</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Stability first</Text>
                <Text style={styles.infoText}>
                  We’re ensuring syncing works consistently across devices and doesn’t miss readings.
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="lock-closed-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Privacy protected</Text>
                <Text style={styles.infoText}>
                  You control what gets shared. We’ll enable this once permissions and data flow are solid.
                </Text>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </BotanicalBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

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
  backButton: { paddingVertical: 8 },
  backText: { color: colors.sage, fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.charcoal },

  content: { flex: 1 },
  section: { padding: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },

  comingSoonCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 12 },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.primary,
  },

  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },

  bullets: { gap: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  infoNote: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  infoNoteText: { fontSize: 13, color: colors.textSecondary, flex: 1 },

  disabledButton: {
    marginTop: 16,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabledButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  infoText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },

  unavailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  unavailableTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  unavailableText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});