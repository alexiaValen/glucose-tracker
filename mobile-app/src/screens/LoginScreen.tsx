// mobile-app/src/screens/LoginScreen.tsx
// REFACTORED: Bright botanical paper collage aesthetic.
// Layered cream/sage/tan shapes, pressed leaf accents, airy and modern.
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
interface Props { navigation: NavProp; }

const { width: SW, height: SH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS — bright botanical paper palette
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  // Page background — warm white paper
  pageBg:       '#F5F1E8',

  // Layered shape tones
  shapeForest:  '#3D5C45',   // deep sage green — large background shape
  shapeSage:    '#7A9B7E',   // mid sage
  shapeSageWash:'#C5D5C8',  // pale sage wash
  shapeCream:   '#F0EBE0',   // warm cream
  shapePaper:   '#FDFCF8',   // pressed paper white
  shapeTan:     '#D9CDB8',   // warm tan

  // Form surface
  cardBg:       '#FDFCF8',
  inputBg:      '#F5F1E8',
  inputBorder:  'rgba(61,92,69,0.15)',
  inputFocus:   'rgba(61,92,69,0.35)',

  // Text
  inkDark:      '#1C1E1A',
  inkMid:       '#3D4039',
  inkMuted:     '#8A8E83',
  inkOnForest:  '#EDE9E1',

  // Accents
  forest:       '#3D5C45',
  sage:         '#4D6B54',
  sageMid:      '#698870',
  gold:         '#8C6E3C',

  border:       'rgba(28,30,26,0.08)',
  shadow:       '#1A1D18',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// BOTANICAL BACKGROUND SHAPES
// Layered paper-like shapes mimicking the collage moodboard
// ─────────────────────────────────────────────────────────────────────────────
function BotanicalBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Large forest green shape — top left, torn paper feel */}
      <View style={bg.shapeForestLarge} />
      {/* Sage wash blob — top right */}
      <View style={bg.shapeSageTopRight} />
      {/* Cream paper layer — center background */}
      <View style={bg.shapeCreamCenter} />
      {/* Tan warm shape — bottom left */}
      <View style={bg.shapeTanBottomLeft} />
      {/* Pale sage — bottom right */}
      <View style={bg.shapeSageBottomRight} />

      {/* Botanical leaf accents — SVG-free, emoji-based pressed leaves */}
      <Text style={bg.leafTopLeft}>🌿</Text>
      <Text style={bg.leafTopRight}>🍃</Text>
      <Text style={bg.leafBottomLeft}>🌱</Text>
      <Text style={bg.leafBottomRight}>🌾</Text>
    </View>
  );
}
const bg = StyleSheet.create({
  // Large forest shape — fills top-left quadrant, slightly rotated
  shapeForestLarge: {
    position: 'absolute',
    top: -SH * 0.12,
    left: -SW * 0.18,
    width: SW * 0.75,
    height: SH * 0.38,
    backgroundColor: T.shapeForest,
    borderRadius: 999,
    transform: [{ rotate: '-12deg' }],
    opacity: 0.88,
  },
  // Soft sage blob — top right
  shapeSageTopRight: {
    position: 'absolute',
    top: -20,
    right: -SW * 0.1,
    width: SW * 0.55,
    height: SW * 0.55,
    backgroundColor: T.shapeSageWash,
    borderRadius: 999,
    opacity: 0.75,
  },
  // Cream paper — large center/upper-mid layer
  shapeCreamCenter: {
    position: 'absolute',
    top: SH * 0.18,
    left: -SW * 0.05,
    width: SW * 1.1,
    height: SH * 0.38,
    backgroundColor: T.shapeCream,
    borderRadius: 40,
    transform: [{ rotate: '2deg' }],
    opacity: 0.90,
  },
  // Tan warm — bottom left
  shapeTanBottomLeft: {
    position: 'absolute',
    bottom: SH * 0.04,
    left: -SW * 0.2,
    width: SW * 0.65,
    height: SW * 0.65,
    backgroundColor: T.shapeTan,
    borderRadius: 999,
    opacity: 0.55,
  },
  // Pale sage — bottom right corner
  shapeSageBottomRight: {
    position: 'absolute',
    bottom: -SW * 0.1,
    right: -SW * 0.08,
    width: SW * 0.5,
    height: SW * 0.5,
    backgroundColor: T.shapeSageWash,
    borderRadius: 999,
    opacity: 0.50,
  },

  // Pressed botanical leaves
  leafTopLeft: {
    position: 'absolute',
    top: SH * 0.08,
    left: 24,
    fontSize: 52,
    opacity: 0.55,
    transform: [{ rotate: '-25deg' }],
  },
  leafTopRight: {
    position: 'absolute',
    top: SH * 0.04,
    right: 20,
    fontSize: 38,
    opacity: 0.45,
    transform: [{ rotate: '18deg' }],
  },
  leafBottomLeft: {
    position: 'absolute',
    bottom: SH * 0.12,
    left: 16,
    fontSize: 36,
    opacity: 0.40,
    transform: [{ rotate: '10deg' }],
  },
  leafBottomRight: {
    position: 'absolute',
    bottom: SH * 0.08,
    right: 18,
    fontSize: 44,
    opacity: 0.38,
    transform: [{ rotate: '-15deg' }],
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// CLEAN INPUT — light surface, minimal border
// ─────────────────────────────────────────────────────────────────────────────
function CleanInput({
  label, value, onChangeText, placeholder,
  secureTextEntry, keyboardType, autoCapitalize,
  autoComplete, editable = true, returnKeyType,
  onSubmitEditing, inputRef,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; secureTextEntry?: boolean; keyboardType?: any;
  autoCapitalize?: any; autoComplete?: any; editable?: boolean;
  returnKeyType?: any; onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={ci.wrap}>
      <Text style={ci.label}>{label}</Text>
      <View style={[ci.field, focused && ci.fieldFocused]}>
        <TextInput
          ref={inputRef}
          style={ci.input}
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
const ci = StyleSheet.create({
  wrap:  { gap: 7 },
  label: {
    fontSize: 10, fontWeight: '700',
    letterSpacing: 1.6, color: T.inkMuted,
    textTransform: 'uppercase',
  },
  field: {
    backgroundColor: T.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: T.inputBorder,
    overflow: 'hidden',
  },
  fieldFocused: {
    borderColor: T.inputFocus,
    backgroundColor: '#FDFCF8',
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 15 : 12,
    fontSize: 16, color: T.inkDark,
    fontWeight: '400',
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
  const slideAnim   = useRef(new Animated.Value(20)).current;

  // Entrance animation — preserved logic
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, delay: 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: 80, useNativeDriver: true }),
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
      {/* Layered botanical background shapes */}
      <BotanicalBackground />

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

              {/* ── BRAND MARK ──────────────────────────────────────── */}
              <View style={s.brand}>
                {/* Washi-tape style ornament strip */}
                <View style={s.ornamentRow}>
                  <View style={s.ornamentLine} />
                  <Text style={s.leafMark}>🌿</Text>
                  <View style={s.ornamentLine} />
                </View>

                <Text style={s.brandName}>Transforming</Text>
                <Text style={s.brandName}>Lives Coaching</Text>
                <Text style={s.brandTagline}>Track your glucose & cycle with grace</Text>
              </View>

              {/* ── FORM CARD — pressed paper surface ───────────────── */}
              <View style={s.card}>
                {/* Subtle tape strip at top — paper collage touch */}
                <View style={s.tapeStrip} />

                <View style={s.form}>
                  <CleanInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your@email.com"
                    keyboardType="email-address"
                    autoComplete="email"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    editable={!isLoading}
                  />

                  <CleanInput
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

                  {/* Sign in button */}
                  <TouchableOpacity
                    style={[s.signInBtn, isLoading && s.signInBtnDisabled]}
                    onPress={handleLogin}
                    disabled={isLoading}
                    activeOpacity={0.86}
                  >
                    {isLoading
                      ? <ActivityIndicator color={T.inkOnForest} />
                      : <Text style={s.signInBtnTxt}>Sign in</Text>
                    }
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={s.divider} />

                  {/* Forgot password */}
                  <TouchableOpacity
                    style={s.linkBtn}
                    onPress={() => navigation.navigate('ForgotPassword')}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <Text style={s.forgotTxt}>Forgot password?</Text>
                  </TouchableOpacity>

                  {/* Sign up */}
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

              {/* ── FOOTER ──────────────────────────────────────────── */}
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
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 36,
  },
  inner: {},

  // Brand section — sits above the card, text is dark on light bg
  brand: {
    alignItems: 'center',
    paddingBottom: 32,
    gap: 5,
  },
  ornamentRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 8,
  },
  ornamentLine: {
    width: 32, height: 1.5,
    backgroundColor: 'rgba(61,92,69,0.25)',
    borderRadius: 1,
  },
  leafMark: { fontSize: 20 },
  brandName: {
    fontSize: 34, fontWeight: '800',
    color: T.inkDark, letterSpacing: -0.8,
    lineHeight: 40, textAlign: 'center',
  },
  brandTagline: {
    fontSize: 13, fontWeight: '400',
    color: T.inkMuted, letterSpacing: 0.2,
    marginTop: 6, textAlign: 'center',
  },

  // Form card — pressed paper white surface
  card: {
    backgroundColor: T.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 10,
  },

  // Tape strip — decorative collage accent at top of card
  tapeStrip: {
    position: 'absolute',
    top: -4,
    alignSelf: 'center',
    left: '35%',
    width: 60,
    height: 14,
    backgroundColor: 'rgba(196,168,115,0.45)',
    borderRadius: 3,
    zIndex: 1,
  },

  form: { padding: 28, gap: 18, paddingTop: 32 },

  // Sign in button — solid forest green
  signInBtn: {
    height: 54,
    backgroundColor: T.forest,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: T.forest,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  signInBtnDisabled: { opacity: 0.55 },
  signInBtnTxt: {
    fontSize: 16, fontWeight: '700',
    color: T.inkOnForest, letterSpacing: 0.3,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: 2,
  },

  // Links
  linkBtn:      { alignItems: 'center', paddingVertical: 4 },
  forgotTxt:    { fontSize: 14, fontWeight: '600', color: T.sage },
  signUpRow:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signUpPrompt: { fontSize: 14, color: T.inkMuted },
  signUpLink:   { fontSize: 14, fontWeight: '700', color: T.forest },

  // Footer
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: T.inkMuted,
    lineHeight: 18,
    paddingTop: 28,
    paddingHorizontal: 12,
  },
});