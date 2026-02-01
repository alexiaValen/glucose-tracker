// mobile-app/src/screens/JoinGroupScreen.tsx
// UPDATED: Shows available programs to purchase FIRST, then code entry for purchased members
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { BotanicalBackground } from '../components/BotanicalBackground';
import { colors } from '../theme/colors';
import { api } from '../config/api';

type JoinGroupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'JoinGroup'>;

interface Props {
  navigation: JoinGroupScreenNavigationProp;
}

interface ProgramOption {
  id: string;
  name: string;
  description: string;
  startDate: string;
  durationWeeks: number;
  pricing: {
    founding: number;
    paymentPlan: number;
    fullPrice: number;
  };
  meetingSchedule: {
    day: string;
    time: string;
    timezone: string;
  };
}

export default function JoinGroupScreen({ navigation }: Props) {
  // View state: 'programs' or 'code-entry'
  const [currentView, setCurrentView] = useState<'programs' | 'code-entry'>('programs');
  
  // Programs list
  const [availablePrograms, setAvailablePrograms] = useState<ProgramOption[]>([
    {
      id: '1',
      name: '2026 Vision Retreat',
      description: 'A transformative 6-week journey exploring holiness, identity, and spiritual armor through the lens of faith and wellness.',
      startDate: '2026-02-10',
      durationWeeks: 6,
      pricing: {
        founding: 197,
        paymentPlan: 67,
        fullPrice: 297,
      },
      meetingSchedule: {
        day: 'Monday',
        time: '7:00 PM',
        timezone: 'EST',
      },
    },
  ]);
  
  // Code entry state
  const [accessCode, setAccessCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handlePurchaseProgram = (programId: string) => {
    // TODO: Navigate to payment/checkout screen
    Alert.alert(
      'Coming Soon',
      'Program purchase flow will be integrated here. For now, contact your coach to receive an access code.',
      [
        {
          text: 'I Have a Code',
          onPress: () => setCurrentView('code-entry'),
        },
        { text: 'OK' },
      ]
    );
  };

  const handleVerifyCode = async () => {
    if (!accessCode.trim()) {
      Alert.alert('Error', 'Please enter an access code');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await api.post('/groups/verify-code', {
        code: accessCode.toUpperCase().trim()
      });

      if (response.data.valid && response.data.group) {
        try {
          // Try to join the group - include paymentType as required by backend
          const joinResponse = await api.post('/groups/join', {
            accessCode: accessCode.toUpperCase().trim(),
            paymentType: 'founding', // Default to founding member
          });

          Alert.alert(
            'Welcome!',
            `You've successfully joined ${response.data.group.name}`,
            [
              {
                text: 'Start Learning',
                onPress: () => {
                  navigation.replace('GroupDashboard', {
                    groupId: joinResponse.data.membership.group_id
                  });
                },
              },
            ]
          );
        } catch (joinError: any) {
          // Handle "already a member" case
          if (joinError.response?.data?.error === 'Already a member of this group') {
            Alert.alert(
              'Welcome Back!',
              `You're already enrolled in ${response.data.group.name}. Let's continue your journey!`,
              [
                {
                  text: 'Continue',
                  onPress: () => {
                    navigation.replace('GroupDashboard', {
                      groupId: response.data.group.id
                    });
                  },
                },
              ]
            );
          } else {
            // Other join errors
            throw joinError;
          }
        }
      } else {
        Alert.alert('Invalid Code', response.data.message || 'This access code is not valid');
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      Alert.alert('Error', 'Failed to verify access code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Render Programs View
  if (currentView === 'programs') {
    return (
      <BotanicalBackground variant="subtle" intensity="light">
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Join a Group Program</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Intro Section */}
            <View style={styles.introSection}>
              <Text style={styles.introTitle}>Transform Your Faith Journey</Text>
              <Text style={styles.introDescription}>
                Join a supportive community and dive deep into Scripture-based wellness coaching with guided sessions, group discussions, and personal reflection.
              </Text>
            </View>

            {/* Available Programs */}
            <View style={styles.programsSection}>
              <Text style={styles.sectionLabel}>AVAILABLE PROGRAMS</Text>
              
              {availablePrograms.map((program) => (
                <View key={program.id} style={styles.programCard}>
                  {/* Program Header */}
                  <View style={styles.programHeader}>
                    <View style={styles.foundingBadge}>
                      <Text style={styles.foundingBadgeText}>FOUNDING MEMBER</Text>
                    </View>
                  </View>

                  {/* Program Info */}
                  <Text style={styles.programName}>{program.name}</Text>
                  <Text style={styles.programMeta}>
                    Starts {new Date(program.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • {program.durationWeeks} weeks
                  </Text>
                  <Text style={styles.programDescription}>{program.description}</Text>

                  {/* Meeting Schedule */}
                  <View style={styles.scheduleBox}>
                    <Text style={styles.scheduleLabel}>WEEKLY MEETINGS</Text>
                    <Text style={styles.scheduleText}>
                      {program.meetingSchedule.day}s at {program.meetingSchedule.time} {program.meetingSchedule.timezone}
                    </Text>
                  </View>

                  {/* Pricing Options */}
                  <View style={styles.pricingSection}>
                    <Text style={styles.pricingLabel}>CHOOSE YOUR PLAN</Text>
                    
                    {/* Founding Member Price */}
                    <TouchableOpacity
                      style={styles.priceOption}
                      onPress={() => handlePurchaseProgram(program.id)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.priceLeft}>
                        <Text style={styles.priceTitle}>Founding Member</Text>
                        <Text style={styles.priceSubtitle}>One-time payment • Limited spots</Text>
                      </View>
                      <View style={styles.priceRight}>
                        <Text style={styles.priceAmount}>${program.pricing.founding}</Text>
                        <Text style={styles.priceOriginal}>${program.pricing.fullPrice}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Payment Plan */}
                    <TouchableOpacity
                      style={[styles.priceOption, styles.priceOptionSecondary]}
                      onPress={() => handlePurchaseProgram(program.id)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.priceLeft}>
                        <Text style={[styles.priceTitle, { color: '#2B2B2B' }]}>3-Month Plan</Text>
                        <Text style={[styles.priceSubtitle, { color: 'rgba(42,45,42,0.7)' }]}>3 payments of ${program.pricing.paymentPlan}</Text>
                      </View>
                      <View style={styles.priceRight}>
                        <Text style={[styles.priceAmount, { color: '#2B2B2B' }]}>${program.pricing.paymentPlan}/mo</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Already Purchased Section */}
            <View style={styles.codeSection}>
              <Text style={styles.codeSectionTitle}>Already Purchased?</Text>
              <Text style={styles.codeSectionDescription}>
                If you've already purchased this program, enter your access code to get started.
              </Text>
              <TouchableOpacity
                style={styles.haveCodeButton}
                onPress={() => setCurrentView('code-entry')}
                activeOpacity={0.85}
              >
                <Text style={styles.haveCodeButtonText}>I Have an Access Code</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </BotanicalBackground>
    );
  }

  // Render Code Entry View
  return (
    <BotanicalBackground variant="subtle" intensity="light">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentView('programs')}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enter Code</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.codeEntryCard}>
            <Text style={styles.codeEntryTitle}>Enter Access Code</Text>
            <Text style={styles.codeEntryDescription}>
              Enter the code provided by your coach or from your purchase confirmation
            </Text>

            <TextInput
              style={styles.codeInput}
              placeholder="HFR-XXXXXX"
              value={accessCode}
              onChangeText={setAccessCode}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isVerifying}
            />

            <TouchableOpacity
              style={[styles.verifyButton, isVerifying && styles.verifyButtonDisabled]}
              onPress={handleVerifyCode}
              disabled={isVerifying}
              activeOpacity={0.85}
            >
              {isVerifying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.codeHelpText}>
              Don't have a code yet?{' '}
              <Text
                style={styles.codeHelpLink}
                onPress={() => setCurrentView('programs')}
              >
                Purchase a program
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,214,212,0.25)',
  },
  backText: {
    color: '#6B7F6E',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2B2B2B',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },

  // Intro Section
  introSection: {
    marginBottom: 32,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2B2B2B',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  introDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(42,45,42,0.7)',
  },

  // Programs Section
  programsSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(42,45,42,0.5)',
    marginBottom: 16,
  },
  programCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  foundingBadge: {
    backgroundColor: 'rgba(184,154,90,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  foundingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#B89A5A',
  },
  programName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2B2B2B',
    marginBottom: 8,
  },
  programMeta: {
    fontSize: 14,
    color: 'rgba(42,45,42,0.6)',
    marginBottom: 16,
  },
  programDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(42,45,42,0.7)',
    marginBottom: 20,
  },

  // Schedule Box
  scheduleBox: {
    backgroundColor: 'rgba(107,127,110,0.06)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  scheduleLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: 'rgba(42,45,42,0.5)',
    marginBottom: 6,
  },
  scheduleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2B2B2B',
  },

  // Pricing Section
  pricingSection: {
    marginTop: 8,
  },
  pricingLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(42,45,42,0.5)',
    marginBottom: 12,
  },
  priceOption: {
    backgroundColor: '#6B7F6E',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  priceOptionSecondary: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(107,127,110,0.3)',
  },
  priceLeft: {
    flex: 1,
  },
  priceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  priceSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  priceRight: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  priceOriginal: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },

  // Code Section
  codeSection: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
    alignItems: 'center',
  },
  codeSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2B2B2B',
    marginBottom: 8,
  },
  codeSectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(42,45,42,0.7)',
    textAlign: 'center',
    marginBottom: 20,
  },
  haveCodeButton: {
    backgroundColor: 'rgba(107,127,110,0.1)',
    borderWidth: 1.5,
    borderColor: '#6B7F6E',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  haveCodeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7F6E',
  },

  // Code Entry Card
  codeEntryCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  codeEntryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2B2B2B',
    marginBottom: 12,
  },
  codeEntryDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(42,45,42,0.7)',
    marginBottom: 28,
  },
  codeInput: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(107,127,110,0.3)',
    borderRadius: 12,
    padding: 18,
    fontSize: 18,
    fontWeight: '500',
    color: '#2B2B2B',
    textAlign: 'center',
    marginBottom: 20,
  },
  verifyButton: {
    backgroundColor: '#6B7F6E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  codeHelpText: {
    fontSize: 14,
    color: 'rgba(42,45,42,0.6)',
    textAlign: 'center',
  },
  codeHelpLink: {
    color: '#6B7F6E',
    fontWeight: '600',
  },
});