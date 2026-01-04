// mobile-app/src/screens/LogCycleScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { api } from '../config/api';
import { colors } from '../theme/colors';

type LogCycleScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LogCycle'>;

interface Props {
  navigation: LogCycleScreenNavigationProp;
}

type FlowType = 'light' | 'medium' | 'heavy' | null;

export default function LogCycleScreen({ navigation }: Props) {
  const [flow, setFlow] = useState<FlowType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!flow) {
      Alert.alert('Flow Required', 'Please select your flow level');
      return;
    }

    setIsSubmitting(true);
    try {
      // Call API directly to log period start
      await api.post('/cycle/start', {
        startDate: new Date().toISOString(),
        flow,
      });
      
      Alert.alert(
        'Period Logged',
        'Your period start has been recorded successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error logging period:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to log period start');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Period Start</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🩸 Period Flow</Text>
          <Text style={styles.cardSubtitle}>Select your flow level today</Text>

          <View style={styles.flowOptions}>
            <TouchableOpacity
              style={[
                styles.flowOption,
                flow === 'light' && styles.flowOptionSelected,
              ]}
              onPress={() => setFlow('light')}
            >
              <Text style={[
                styles.flowOptionText,
                flow === 'light' && styles.flowOptionTextSelected,
              ]}>
                Light
              </Text>
              <Text style={styles.flowOptionDescription}>
                Spotting or light bleeding
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.flowOption,
                flow === 'medium' && styles.flowOptionSelected,
              ]}
              onPress={() => setFlow('medium')}
            >
              <Text style={[
                styles.flowOptionText,
                flow === 'medium' && styles.flowOptionTextSelected,
              ]}>
                Medium
              </Text>
              <Text style={styles.flowOptionDescription}>
                Moderate, steady flow
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.flowOption,
                flow === 'heavy' && styles.flowOptionSelected,
              ]}
              onPress={() => setFlow('heavy')}
            >
              <Text style={[
                styles.flowOptionText,
                flow === 'heavy' && styles.flowOptionTextSelected,
              ]}>
                Heavy
              </Text>
              <Text style={styles.flowOptionDescription}>
                Heavy bleeding
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About Cycle Tracking</Text>
          <Text style={styles.infoText}>
            Tracking your menstrual cycle helps you understand how it affects your glucose levels
            and overall health. We'll use this information to provide personalized insights.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Logging...' : 'Log Period Start'}
          </Text>
        </TouchableOpacity>

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
    color: colors.textDark,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 20,
  },
  flowOptions: {
    gap: 12,
  },
  flowOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.cream,
  },
  flowOptionSelected: {
    borderColor: colors.accentPeach,
    backgroundColor: colors.white,
  },
  flowOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  flowOptionTextSelected: {
    color: colors.accentPeach,
  },
  flowOptionDescription: {
    fontSize: 14,
    color: colors.textLight,
  },
  infoCard: {
    backgroundColor: colors.paleGreen,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: colors.forestGreen,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});