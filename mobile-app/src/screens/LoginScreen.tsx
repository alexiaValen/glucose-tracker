// mobile-app/src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';
import { BotanicalBackground } from '../components/BotanicalBackground';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(email.trim().toLowerCase(), password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <BotanicalBackground variant="3d" intensity="medium">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.accentRow}>
              <View style={styles.accentLine} />
              <Text style={styles.accentLeaf}>🌿</Text>
              <View style={styles.accentLine} />
            </View>

            <Text style={styles.title}>GraceFlow</Text>
            <Text style={styles.subtitle}>Track your glucose & cycle with grace</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
                autoComplete="email"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
                autoComplete="password"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && { opacity: 0.65 }]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Separated bottom actions */}
            <View style={styles.secondaryActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.linkButton}
                disabled={isLoading}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                style={styles.linkButton}
                disabled={isLoading}
              >
                <Text style={styles.linkText}>
                  Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
                </Text>
              </TouchableOpacity>

              <Text style={styles.footerNote}>
                A calmer way to notice patterns — glucose, cycle, and how you feel.
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingBottom: 10,
  },

  header: {
    marginBottom: 22,
    alignItems: 'center',
  },
  accentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
    opacity: 0.95,
  },
  accentLine: {
    height: 1,
    width: 56,
    backgroundColor: 'rgba(42,45,42,0.18)',
  },
  accentLeaf: {
    fontSize: 16,
    color: colors.goldLeaf,
  },

  title: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.charcoal,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.9,
    lineHeight: 20,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.70)',
    padding: 18,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 3,
  },

  field: { 
    marginBottom: 14 
  },

  label: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.9)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: colors.textDark,
  },

  button: {
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sage,
    marginTop: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 3,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  secondaryActions: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,214,212,0.55)',
    gap: 10,
    alignItems: 'center',
  },

  linkButton: { 
    paddingVertical: 6 
  },
  forgotText: {
    color: colors.sage,
    fontSize: 14,
    fontWeight: '800',
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  linkBold: {
    color: colors.sage,
    fontWeight: '800',
  },
  footerNote: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    opacity: 0.9,
  },
});