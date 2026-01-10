// mobile-app/src/screens/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { api } from '../config/api';
import { colors } from '../theme/colors';
import { ui } from '../theme/ui';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ForgotPassword'
>;

interface Props {
  navigation: ForgotPasswordScreenNavigationProp;
}

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/request-reset', {
        email: email.toLowerCase(),
      });

      if (response.data.resetCode) {
        Alert.alert(
          'Reset Code Sent',
          `Your reset code is: ${response.data.resetCode}\n\n(This is only shown in development)`,
          [{ text: 'OK', onPress: () => setStep('code') }]
        );
      } else {
        Alert.alert(
          'Check Your Email',
          "If that email exists, we've sent a 6-digit reset code.",
          [{ text: 'OK', onPress: () => setStep('code') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (resetCode.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/verify-reset-code', {
        email: email.toLowerCase(),
        resetCode,
      });
      setStep('password');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.toLowerCase(),
        resetCode,
        newPassword,
      });

      Alert.alert(
        'Success',
        'Your password has been reset. Please log in with your new password.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const subtitle =
    step === 'email'
      ? 'Enter your email to receive a reset code'
      : step === 'code'
      ? 'Enter the 6-digit code sent to your email'
      : 'Create a new password for your account';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={ui.screen}
    >
      <View style={[styles.content, ui.screenPadded]}>
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.accentRow}>
            <View style={styles.accentLine} />
            <Text style={styles.accentLeaf}>🌿</Text>
            <View style={styles.accentLine} />
          </View>

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Step indicator */}
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, step === 'email' && styles.stepDotActive]} />
            <View style={[styles.stepDot, step === 'code' && styles.stepDotActive]} />
            <View style={[styles.stepDot, step === 'password' && styles.stepDotActive]} />
          </View>
        </View>

        {/* Body */}
        <View style={styles.form}>
          {step === 'email' && (
            <>
              <View>
                <Text style={ui.label}>Email</Text>
                <TextInput
                  style={ui.input}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[ui.buttonPrimary, isLoading && ui.buttonPrimaryDisabled]}
                onPress={handleRequestReset}
                disabled={isLoading}
                activeOpacity={0.9}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={ui.buttonPrimaryText}>Send Reset Code</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === 'code' && (
            <>
              <View style={styles.codeMeta}>
                <Text style={styles.metaLabel}>Code sent to</Text>
                <Text style={styles.metaEmail}>{email}</Text>
              </View>

              <View>
                <Text style={ui.label}>6-digit code</Text>
                <TextInput
                  style={[ui.input, styles.codeInput]}
                  placeholder="000000"
                  placeholderTextColor={colors.textMuted}
                  value={resetCode}
                  onChangeText={(text) => setResetCode(text.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[ui.buttonPrimary, isLoading && ui.buttonPrimaryDisabled]}
                onPress={handleVerifyCode}
                disabled={isLoading}
                activeOpacity={0.9}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={ui.buttonPrimaryText}>Verify Code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRequestReset}
                style={ui.linkButton}
                disabled={isLoading}
              >
                <Text style={[ui.link, { color: colors.sage, fontWeight: '800' }]}>
                  Resend Code
                </Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'password' && (
            <>
              <View>
                <Text style={ui.label}>New password</Text>
                <TextInput
                  style={ui.input}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              <View>
                <Text style={ui.label}>Confirm password</Text>
                <TextInput
                  style={ui.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[ui.buttonPrimary, isLoading && ui.buttonPrimaryDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
                activeOpacity={0.9}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={ui.buttonPrimaryText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.footerNote}>
                Tip: choose something memorable but hard to guess — a phrase works great.
              </Text>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 8,
  },

  backButton: {
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.sage,
    fontSize: 16,
    fontWeight: '800',
  },

  header: {
    marginTop: 8,
    marginBottom: 18,
  },

  accentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
    opacity: 0.9,
  },
  accentLine: {
    height: 1,
    width: 48,
    backgroundColor: colors.border,
  },
  accentLeaf: {
    fontSize: 16,
    color: colors.goldLeaf,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.charcoal,
    textAlign: 'left',
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  stepRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  stepDotActive: {
    backgroundColor: colors.sage,
  },

  form: {
    gap: 16,
    marginTop: 8,
  },

  codeMeta: {
    backgroundColor: colors.paleGreen,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 16,
    padding: 12,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metaEmail: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
  },

  codeInput: {
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 10,
    fontWeight: '800',
  },

  footerNote: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});