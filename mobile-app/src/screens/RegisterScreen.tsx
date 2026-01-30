// mobile-app/src/screens/RegisterScreen.tsx
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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { BotanicalBackground } from '../components/BotanicalBackground';
import { colors } from '../theme/colors';
import { SignalRingThin } from '../components/icons';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { register, isLoading } = useAuthStore();

  const handleRegister = async () => {
    if (!email || !password || !firstName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await register(email, password, firstName, lastName);
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.error || 'Something went wrong'
      );
    }
  };

  return (
    <BotanicalBackground variant="green" intensity="light">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <SignalRingThin size={32} muted="rgba(107,127,110,0.3)" />
              <Text style={styles.title}>Join GraceFlow</Text>
              <Text style={styles.subtitle}>Begin your wellness journey</Text>
            </View>

            {/* Form Card */}
            <View style={styles.card}>
              <View style={styles.form}>
                {/* Name Row */}
                <View style={styles.nameRow}>
                  <View style={[styles.field, styles.fieldHalf]}>
                    <Text style={styles.label}>FIRST NAME *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Jane"
                      placeholderTextColor="rgba(42,45,42,0.35)"
                      value={firstName}
                      onChangeText={setFirstName}
                      editable={!isLoading}
                      autoComplete="name-given"
                    />
                  </View>

                  <View style={[styles.field, styles.fieldHalf]}>
                    <Text style={styles.label}>LAST NAME</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Doe"
                      placeholderTextColor="rgba(42,45,42,0.35)"
                      value={lastName}
                      onChangeText={setLastName}
                      editable={!isLoading}
                      autoComplete="name-family"
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>EMAIL *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor="rgba(42,45,42,0.35)"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isLoading}
                    autoComplete="email"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>PASSWORD *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="At least 8 characters"
                    placeholderTextColor="rgba(42,45,42,0.35)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!isLoading}
                    autoComplete="off"
                    textContentType="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>CONFIRM PASSWORD *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor="rgba(42,45,42,0.35)"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    editable={!isLoading}
                    autoComplete="off"
                    textContentType="none"
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && { opacity: 0.5 }]}
                  onPress={handleRegister}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Create account</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  style={styles.linkButton}
                  disabled={isLoading}
                >
                  <Text style={styles.linkText}>
                    Already have an account? <Text style={styles.linkBold}>Sign in</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#2B2B2B',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(42,45,42,0.6)',
    textAlign: 'center',
    fontWeight: '400',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  form: {
    gap: 16,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    gap: 8,
  },
  fieldHalf: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(42,45,42,0.6)',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,214,212,0.5)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 15,
    color: '#2B2B2B',
    fontWeight: '400',
  },
  button: {
    backgroundColor: '#6B7F6E',
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212,214,212,0.4)',
  },
  dividerText: {
    fontSize: 12,
    color: 'rgba(42,45,42,0.45)',
    fontWeight: '500',
  },
  linkButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  linkText: {
    color: 'rgba(42,45,42,0.6)',
    fontSize: 14,
    fontWeight: '400',
  },
  linkBold: {
    color: '#6B7F6E',
    fontWeight: '600',
  },
});