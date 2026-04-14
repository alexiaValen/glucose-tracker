// mobile-app/src/screens/LoginScreen.tsx
// REDESIGN: Premium minimal SaaS login — Grid Nexus / Novum Hub
// Off-white ground, centered card, serif headline, clean form.
// ALL auth logic, navigation, store calls preserved exactly.

import React, { useState, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
interface Props { navigation: NavProp; }


// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — premium neutral palette
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  // Ground
  pageBg:       '#F7F5F2',    // warm off-white

  // Card surface
  cardBg:       '#FFFFFF',

  // Inputs
  inputBg:      '#FAFAF8',
  inputBorder:  '#E5E2DB',    // thin warm stone border
  inputFocus:   '#B5B0A8',    // slightly deeper on focus

  // Text
  inkDark:      '#1A1814',    // near-black, warm
  inkMid:       '#4A4640',
  inkMuted:     '#9B9690',    // subdued stone

  // Button — muted dark green, slightly earthy
  btnBg:        '#2B4535',
  btnText:      '#F0EDE8',

  // Accent — restrained gold for focus ring / link
  gold:         '#A8916A',

  // Structural
  cardBorder:   'rgba(0,0,0,0.05)',
  divider:      '#EDEAE5',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// FIELD — thin border, clean focus state, no excess radius
// ─────────────────────────────────────────────────────────────────────────────
function Field({
  label, value, onChangeText, placeholder,
  secureTextEntry, keyboardType, autoCapitalize,
  autoComplete, editable = true, returnKeyType,
  onSubmitEditing, inputRef,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  autoComplete?: any;
  editable?: boolean;
  returnKeyType?: any;
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <View style={[f.field, focused && f.fieldFocused]}>
        <TextInput
          ref={inputRef}
          style={f.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={T.inkMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoComplete={autoComplete}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

const f = StyleSheet.create({
  wrap:  { gap: 8 },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.8,
    color: T.inkMuted,
    textTransform: 'uppercase',
  },
  field: {
    backgroundColor: T.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.inputBorder,
  },
  fieldFocused: {
    borderColor: T.inputFocus,
    backgroundColor: '#FFFFFF',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 15 : 13,
    fontSize: 15,
    color: T.inkDark,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// LOGOTYPE — minimal wordmark, no icon
// ─────────────────────────────────────────────────────────────────────────────
function Logotype() {
  return (
    <View style={logo.wrap}>
      {/* Thin rule above — structural, not decorative */}
      <View style={logo.rule} />
      <Text style={logo.mark}>TLC</Text>
    </View>
  );
}
const logo = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  rule: {
    width: 28,
    height: 1,
    backgroundColor: T.gold,
    borderRadius: 1,
  },
  mark: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 4,
    color: T.inkMid,
    textTransform: 'uppercase',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function LoginScreen({ navigation }: Props) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading }   = useAuthStore();

  const passwordRef = useRef<TextInput>(null);
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(16)).current;

  // Entrance animation — preserved logic
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 540, delay: 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, delay: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  // Auth logic — preserved exactly
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    try {
      await login(email.trim(), password);
    } catch (error: any) {
      Alert.alert(
        'Login failed',
        error.response?.data?.error || error.message || 'Please check your credentials and try again.'
      );
    }
  };

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={s.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[
              s.inner,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}>

              {/* ── LOGOTYPE ─────────────────────────────────────────── */}
              <Logotype />

              {/* ── HEADLINE ─────────────────────────────────────────── */}
              <View style={s.header}>
                <Text style={s.headline}>Welcome back</Text>
                <Text style={s.sub}>Rooted in faith. Moving in health.</Text>
              </View>

              {/* ── CARD ─────────────────────────────────────────────── */}
              <View style={s.card}>

                <Field
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  editable={!isLoading}
                />

                <Field
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!isLoading}
                  inputRef={passwordRef}
                />

                {/* Forgot password */}
                <TouchableOpacity
                  style={s.forgotWrap}
                  onPress={() => navigation.navigate('ForgotPassword')}
                  disabled={isLoading}
                  activeOpacity={0.65}
                >
                  <Text style={s.forgotTxt}>Forgot password?</Text>
                </TouchableOpacity>

                {/* Primary CTA */}
                <TouchableOpacity
                  style={[s.ctaBtn, isLoading && s.ctaBtnDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.88}
                >
                  {isLoading
                    ? <ActivityIndicator color={T.btnText} />
                    : <Text style={s.ctaBtnTxt}>Enter your system  →</Text>
                  }
                </TouchableOpacity>

                {/* Divider */}
                <View style={s.divider} />

                {/* Create account */}
                <View style={s.registerRow}>
                  <Text style={s.registerPrompt}>Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Register')}
                    disabled={isLoading}
                    activeOpacity={0.65}
                  >
                    <Text style={s.registerLink}>Create one</Text>
                  </TouchableOpacity>
                </View>

              </View>
              {/* ── END CARD ─────────────────────────────────────────── */}

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.pageBg },
  safe: { flex: 1 },
  kav:  { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 48,
  },
  inner: {},

  // Headline block — sits above the card, clean hierarchy
  header: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  headline: {
    fontSize: 30,
    fontWeight: '300',           // light serif feel via weight
    letterSpacing: -0.4,
    color: T.inkDark,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    fontWeight: '400',
    color: T.inkMuted,
    letterSpacing: 0.1,
    textAlign: 'center',
  },

  // Form card
  card: {
    backgroundColor: T.cardBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: T.cardBorder,
    paddingHorizontal: 24,
    paddingVertical: 28,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 6,
  },

  // Forgot
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotTxt: {
    fontSize: 13,
    fontWeight: '400',
    color: T.inkMuted,
    letterSpacing: 0.1,
  },

  // Primary CTA button
  ctaBtn: {
    height: 52,
    backgroundColor: T.btnBg,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: T.btnBg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaBtnDisabled: { opacity: 0.50 },
  ctaBtnTxt: {
    fontSize: 15,
    fontWeight: '500',
    color: T.btnText,
    letterSpacing: 0.2,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: T.divider,
    marginVertical: 2,
  },

  // Register row
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerPrompt: {
    fontSize: 13,
    color: T.inkMuted,
    fontWeight: '400',
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '500',
    color: T.inkDark,
    textDecorationLine: 'underline',
    textDecorationColor: T.gold,
  },
});
