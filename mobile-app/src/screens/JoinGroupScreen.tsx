// mobile-app/src/screens/JoinGroupScreen.tsx
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

interface GroupPreview {
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
  const [accessCode, setAccessCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [groupPreview, setGroupPreview] = useState<GroupPreview | null>(null);
  const [paymentType, setPaymentType] = useState<'founding' | 'payment_plan'>('founding');

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

      if (response.data.valid) {
        setGroupPreview(response.data.group);
      } else {
        Alert.alert('Invalid Code', response.data.message || 'This access code is not valid');
        setGroupPreview(null);
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      Alert.alert('Error', 'Failed to verify access code. Please try again.');
      setGroupPreview(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!groupPreview) return;

    setIsJoining(true);

    try {
      const response = await api.post('/groups/join', {
        accessCode: accessCode.toUpperCase().trim(),
        paymentType: paymentType
      });

      Alert.alert(
        'Welcome to the Group!',
        `You've successfully joined ${groupPreview.name}. Payment details have been sent to your email.`,
        [
          {
            text: 'View Group',
            onPress: () => {
              navigation.replace('GroupDashboard', { 
                groupId: response.data.membership.group_id 
              });
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error joining group:', error);
      const message = error.response?.data?.error || 'Failed to join group';
      Alert.alert('Error', message);
    } finally {
      setIsJoining(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <BotanicalBackground variant="subtle" intensity="light">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Join a Group</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Access Code Input */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enter Access Code</Text>
            <Text style={styles.cardSubtitle}>
              Enter the code provided by your coach to join their group program
            </Text>

            <View style={styles.codeInputContainer}>
              <TextInput
                style={styles.codeInput}
                placeholder="HFR-XXXXXX"
                placeholderTextColor="rgba(42,45,42,0.35)"
                value={accessCode}
                onChangeText={(text) => setAccessCode(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={11}
                editable={!isVerifying && !groupPreview}
              />
              
              {!groupPreview && (
                <TouchableOpacity
                  style={[styles.verifyButton, isVerifying && { opacity: 0.5 }]}
                  onPress={handleVerifyCode}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.verifyButtonText}>Verify Code</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {groupPreview && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setGroupPreview(null);
                  setAccessCode('');
                }}
              >
                <Text style={styles.clearButtonText}>Try a different code</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Group Preview */}
          {groupPreview && (
            <>
              <View style={styles.card}>
                <View style={styles.validBadge}>
                  <Text style={styles.validBadgeText}>✓ VALID CODE</Text>
                </View>
                
                <Text style={styles.groupName}>{groupPreview.name}</Text>
                <Text style={styles.groupDescription}>{groupPreview.description}</Text>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>START DATE</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(groupPreview.startDate)}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>DURATION</Text>
                    <Text style={styles.detailValue}>
                      {groupPreview.durationWeeks} weeks
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>MEETING DAY</Text>
                    <Text style={styles.detailValue}>
                      {groupPreview.meetingSchedule.day}s
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>TIME</Text>
                    <Text style={styles.detailValue}>
                      {groupPreview.meetingSchedule.time} {groupPreview.meetingSchedule.timezone}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Payment Options */}
              <View style={styles.card}>
                <Text style={styles.sectionHeader}>FOUNDING MEMBER PRICING</Text>
                
                <TouchableOpacity
                  style={[
                    styles.pricingOption,
                    paymentType === 'founding' && styles.pricingOptionSelected
                  ]}
                  onPress={() => setPaymentType('founding')}
                >
                  <View style={styles.pricingHeader}>
                    <Text style={styles.pricingTitle}>Pay in Full</Text>
                    <Text style={styles.pricingPrice}>
                      ${groupPreview.pricing.founding}
                    </Text>
                  </View>
                  <Text style={styles.pricingDescription}>
                    One-time payment • Best value
                  </Text>
                  {paymentType === 'founding' && (
                    <View style={styles.selectedCheckmark}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.pricingOption,
                    paymentType === 'payment_plan' && styles.pricingOptionSelected
                  ]}
                  onPress={() => setPaymentType('payment_plan')}
                >
                  <View style={styles.pricingHeader}>
                    <Text style={styles.pricingTitle}>Payment Plan</Text>
                    <Text style={styles.pricingPrice}>
                      ${groupPreview.pricing.paymentPlan}/mo
                    </Text>
                  </View>
                  <Text style={styles.pricingDescription}>
                    3 monthly payments • ${groupPreview.pricing.paymentPlan * 3} total
                  </Text>
                  {paymentType === 'payment_plan' && (
                    <View style={styles.selectedCheckmark}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.savingsNote}>
                  <Text style={styles.savingsText}>
                    🎉 Save ${groupPreview.pricing.fullPrice - groupPreview.pricing.founding} as a founding member!
                  </Text>
                </View>
              </View>

              {/* Join Button */}
              <TouchableOpacity
                style={[styles.joinButton, isJoining && { opacity: 0.5 }]}
                onPress={handleJoinGroup}
                disabled={isJoining}
              >
                {isJoining ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.joinButtonText}>
                    Join Group
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                By joining, you agree to the payment terms. Payment will be processed after confirmation.
              </Text>
            </>
          )}

          <View style={{ height: 40 }} />
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
    paddingBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,214,212,0.25)',
  },
  backButton: {
    fontSize: 16,
    color: colors.sage,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(42,45,42,0.6)',
    lineHeight: 20,
    marginBottom: 20,
  },
  codeInputContainer: {
    gap: 12,
  },
  codeInput: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 2,
    borderColor: colors.sage,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: 2,
  },
  verifyButton: {
    backgroundColor: colors.sage,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  verifyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  clearButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.sage,
    fontSize: 14,
    fontWeight: '500',
  },
  validBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(107,127,110,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  validBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.sage,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: 'rgba(42,45,42,0.5)',
    marginBottom: 16,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 12,
    lineHeight: 32,
  },
  groupDescription: {
    fontSize: 15,
    color: 'rgba(42,45,42,0.7)',
    lineHeight: 22,
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: 'rgba(42,45,42,0.5)',
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  pricingOption: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 2,
    borderColor: 'rgba(212,214,212,0.5)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    position: 'relative',
  },
  pricingOptionSelected: {
    borderColor: colors.sage,
    backgroundColor: 'rgba(107,127,110,0.05)',
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
  },
  pricingPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.sage,
  },
  pricingDescription: {
    fontSize: 14,
    color: 'rgba(42,45,42,0.6)',
  },
  selectedCheckmark: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  savingsNote: {
    backgroundColor: 'rgba(184,154,90,0.1)',
    borderRadius: 12,
    padding: 16,
  },
  savingsText: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: '500',
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: colors.sage,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  joinButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disclaimer: {
    fontSize: 12,
    color: 'rgba(42,45,42,0.5)',
    textAlign: 'center',
    lineHeight: 18,
  },
});