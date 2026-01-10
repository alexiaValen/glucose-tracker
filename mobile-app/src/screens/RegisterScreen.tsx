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
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

// Match Dashboard colors
// const colors = {
//   sage: '#7A8B6F',
//   charcoal: '#3A3A3A',
//   warmBrown: '#8B6F47',
//   cream: '#FAF8F4',
//   lightSage: '#B8C5A8',
//   white: '#FFFFFF',
//   textDark: '#2C2C2C',
//   textLight: '#6B6B6B',
//   border: '#E8E6E0',
// };

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
      // Navigation will happen automatically via auth state
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.error || 'Something went wrong'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Join GraceFlow</Text>
            <Text style={styles.subtitle}>Start tracking your health journey</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Jane"
                placeholderTextColor={colors.textLight}
                value={firstName}
                onChangeText={setFirstName}
                editable={!isLoading}
                autoComplete="name-given"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Doe"
                placeholderTextColor={colors.textLight}
                value={lastName}
                onChangeText={setLastName}
                editable={!isLoading}
                autoComplete="name-family"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={colors.textLight}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="At least 8 characters"
                placeholderTextColor={colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
                autoComplete="off"
                textContentType="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.textLight}
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
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkTextBold}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 38,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    fontWeight: '400',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: colors.textDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  button: {
    backgroundColor: colors.sage,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: colors.lightSage,
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: colors.textLight,
    fontSize: 15,
  },
  linkTextBold: {
    color: colors.sage,
    fontWeight: '600',
  },


  primaryButton: {
  height: 56,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.sage,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 14,
  elevation: 2,
},
primaryButtonText: {
  color: colors.white,
  fontSize: 16,
  fontWeight: '700',
  letterSpacing: 0.2,
},
secondaryButton: {
  height: 56,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: colors.border,
},
secondaryButtonText: {
  color: colors.sage,
  fontSize: 16,
  fontWeight: '700',
},
});