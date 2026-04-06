// mobile-app/src/screens/LoginScreen.tsx
// Upgraded UI — forest dark glassmorphism, botanical luxury
// Branding: "Transforming Lives Coaching"
// ALL auth logic, navigation, store calls preserved exactly

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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
interface Props { navigation: NavProp; }

const { width: SW, height: SH } = Dimensions.get('window');

// ── Tokens ─────────────────────────────────────────────────────────────────────
const T = {
  bgDeep:        '#0F1C12',
  bgMid:         '#162019',
  bgLayer:       '#1C2B1F',
  glass:         'rgba(255,255,255,0.07)',
  glassMid:      'rgba(255,255,255,0.10)',
  glassBorder:   'rgba(255,255,255,0.11)',
  glassBorderHi: 'rgba(255,255,255,0.20)',
  inputBg:       'rgba(255,255,255,0.08)',
  inputBorder:   'rgba(255,255,255,0.13)',
  inputFocus:    'rgba(122,155,126,0.45)',
  sage:          '#7A9B7E',
  sageBright:    '#9ABD9E',
  sageDeep:      '#3D5540',
  sageMid:       '#4E6B52',
  gold:          '#C9A96E',
  goldSoft:      '#D4BB8C',
  goldGlow:      'rgba(201,169,110,0.18)',
  goldBorder:    'rgba(201,169,110,0.25)',
  textPrimary:   '#F0EDE6',
  textSecondary: 'rgba(240,237,230,0.55)',
  textMuted:     'rgba(240,237,230,0.32)',
  errorRed:      '#E07070',
} as const;

// ── Decorative botanical rings ─────────────────────────────────────────────────
function BotanicRings() {
  const rings = [
    { size: 340, top: -120, left: SW * 0.3,  op: 0.035 },
    { size: 200, top: SH * 0.55, left: -60,  op: 0.030 },
    { size: 130, top: SH * 0.7,  left: SW * 0.7, op: 0.045 },
    { size: 80,  top: 60,   left: SW * 0.1,  op: 0.040 },
  ];
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {rings.map((r, i) => (
        <View key={i} style={{
          position: 'absolute', top: r.top, left: r.left,
          width: r.size, height: r.size, borderRadius: r.size / 2,
          borderWidth: 1,
          borderColor: `rgba(122,155,126,${r.op * 3})`,
          backgroundColor: `rgba(122,155,126,${r.op})`,
        }} />
      ))}
    </View>
  );
}

// ── Focused input wrapper ─────────────────────────────────────────────────────
function GlassInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  editable = true,
  returnKeyType,
  onSubmitEditing,
  inputRef,
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
    <View style={gi.wrap}>
      <Text style={gi.label}>{label}</Text>
      <View style={[gi.field, focused && gi.fieldFocused]}>
        <TextInput
          ref={inputRef}
          style={gi.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={T.textMuted}
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
const gi = StyleSheet.create({
  wrap:  { gap: 8 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, color: T.textMuted },
  field: {
    backgroundColor: T.inputBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.inputBorder,
    overflow: 'hidden',
  },
  fieldFocused: {
    borderColor: T.inputFocus,
    backgroundColor: 'rgba(122,155,126,0.09)',
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 16 : 13,
    fontSize: 16,
    color: T.textPrimary,
    fontWeight: '400',
  },
});

// ── Main ───────────────────────────────────────────────────────────────────────
export default function LoginScreen({ navigation }: Props) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading }   = useAuthStore();

  const passwordRef = useRef<TextInput>(null);
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(24)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, delay: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    try {
      await login(email.trim(), password);
      // Navigation handled by AppNavigator via auth state
    } catch (error: any) {
      Alert.alert(
        'Login failed',
        error.response?.data?.error || error.message || 'Please check your credentials and try again.'
      );
    }
  };

  return (
    <View style={s.root}>
      {/* Rich dark forest gradient */}
      <LinearGradient
        colors={[T.bgDeep, T.bgMid, '#162819', '#1A2E1D']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
      />

      {/* Botanical ring overlays */}
      <BotanicRings />

      {/* Subtle top light bloom */}
      <View style={s.topBloom} pointerEvents="none" />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={s.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[s.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

              {/* ── BRAND MARK ──────────────────────────────────────────── */}
              <View style={s.brand}>
                {/* Leaf ornament */}
                <View style={s.ornamentRow}>
                  <View style={s.ornamentLine} />
                  <Text style={s.leafEmoji}>🌿</Text>
                  <View style={s.ornamentLine} />
                </View>

                <Text style={s.brandName}>Transforming</Text>
                <Text style={s.brandName}>Lives Coaching</Text>
                <Text style={s.brandTagline}>Track your glucose & cycle with grace</Text>
              </View>

              {/* ── FORM CARD ────────────────────────────────────────────── */}
              <View style={s.card}>
                {/* Card inner glow top edge */}
                <View style={s.cardGlow} />

                <View style={s.form}>
                  <GlassInput
                    label="EMAIL"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your@email.com"
                    keyboardType="email-address"
                    autoComplete="email"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    editable={!isLoading}
                  />

                  <GlassInput
                    label="PASSWORD"
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

                  {/* Login button */}
                  <TouchableOpacity
                    style={[s.loginBtn, isLoading && s.loginBtnDisabled]}
                    onPress={handleLogin}
                    disabled={isLoading}
                    activeOpacity={0.87}
                  >
                    <LinearGradient
                      colors={[T.sageMid, T.sageDeep, '#2A3D2E']}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={s.loginBtnTxt}>Sign in</Text>
                    )}
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={s.divider}>
                    <View style={s.dividerLine} />
                  </View>

                  {/* Forgot + Sign Up */}
                  <TouchableOpacity
                    style={s.linkBtn}
                    onPress={() => navigation.navigate('ForgotPassword')}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <Text style={s.forgotTxt}>Forgot password?</Text>
                  </TouchableOpacity>

                  <View style={s.signUpRow}>
                    <Text style={s.signUpPrompt}>Don't have an account? </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Register')}
                      disabled={isLoading}
                      activeOpacity={0.7}
                    >
                      <Text style={s.signUpLink}>Sign up</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* ── FOOTER TAGLINE ───────────────────────────────────────── */}
              <Text style={s.footer}>
                A calmer way to notice patterns & align glucose, cycle, and life
              </Text>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1 },
  safe:  { flex: 1 },
  kav:   { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  inner: { gap: 0 },

  // Soft radial bloom at top
  topBloom: {
    position: 'absolute',
    top: -80,
    left: SW * 0.5 - 160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(122,155,126,0.08)',
  },

  // Brand
  brand: {
    alignItems: 'center',
    paddingBottom: 36,
    gap: 6,
  },
  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  ornamentLine: {
    width: 36,
    height: 1,
    backgroundColor: 'rgba(122,155,126,0.30)',
  },
  leafEmoji:   { fontSize: 20 },
  brandName: {
    fontSize: 32,
    fontWeight: '700',
    color: T.textPrimary,
    letterSpacing: -0.8,
    lineHeight: 38,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 13,
    fontWeight: '400',
    color: T.textMuted,
    letterSpacing: 0.2,
    marginTop: 6,
    textAlign: 'center',
  },

  // Glass card
  card: {
    backgroundColor: T.glass,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: T.glassBorderHi,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.30,
    shadowRadius: 40,
    elevation: 12,
  },
  cardGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  form: {
    padding: 24,
    gap: 18,
  },

  // Login button
  loginBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(122,155,126,0.30)',
    shadowColor: T.sageDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  loginBtnDisabled: { opacity: 0.55 },
  loginBtnTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  // Divider
  divider:     { paddingVertical: 4 },
  dividerLine: { height: 1, backgroundColor: T.glassBorder },

  // Links
  linkBtn:      { alignItems: 'center', paddingVertical: 4 },
  forgotTxt:    { fontSize: 14, fontWeight: '600', color: T.sageBright },
  signUpRow:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signUpPrompt: { fontSize: 14, color: T.textMuted },
  signUpLink:   { fontSize: 14, fontWeight: '700', color: T.sageBright },

  // Footer
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: T.textMuted,
    lineHeight: 18,
    paddingTop: 28,
    paddingHorizontal: 16,
  },
});