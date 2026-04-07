// mobile-app/src/screens/RegisterScreen.tsx
// REFACTORED: Matches LoginScreen exactly — dark forest gradient, glassmorphism card,
// botanical ring overlays, same token set, same input style.
// ALL multi-step logic, validation, and auth calls preserved exactly.

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
import DateTimePicker from '@react-native-community/datetimepicker';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;
interface Props { navigation: RegisterScreenNavigationProp; }

const { width: SW, height: SH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS — exact copy from LoginScreen
// ─────────────────────────────────────────────────────────────────────────────
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
  textPrimary:   '#F0EDE6',
  textSecondary: 'rgba(240,237,230,0.55)',
  textMuted:     'rgba(240,237,230,0.32)',
  errorRed:      '#E07070',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// BOTANICAL RINGS — same as LoginScreen
// ─────────────────────────────────────────────────────────────────────────────
function BotanicRings() {
  const rings = [
    { size: 340, top: -100, left: SW * 0.25, op: 0.035 },
    { size: 180, top: SH * 0.6,  left: -50,  op: 0.030 },
    { size: 110, top: SH * 0.75, left: SW * 0.72, op: 0.045 },
    { size: 70,  top: 50,   left: SW * 0.08,  op: 0.040 },
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

// ─────────────────────────────────────────────────────────────────────────────
// GLASS INPUT — same as LoginScreen
// ─────────────────────────────────────────────────────────────────────────────
function GlassInput({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, autoCapitalize, autoComplete, editable = true,
  returnKeyType, onSubmitEditing, inputRef,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; secureTextEntry?: boolean; keyboardType?: any;
  autoCapitalize?: any; autoComplete?: any; editable?: boolean;
  returnKeyType?: any; onSubmitEditing?: () => void;
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
    borderRadius: 16, borderWidth: 1, borderColor: T.inputBorder,
    overflow: 'hidden',
  },
  fieldFocused: {
    borderColor: T.inputFocus,
    backgroundColor: 'rgba(122,155,126,0.09)',
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 16 : 13,
    fontSize: 16, color: T.textPrimary, fontWeight: '400',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// GLASS DATE BUTTON — same feel as GlassInput
// ─────────────────────────────────────────────────────────────────────────────
function GlassDateButton({
  label, value, onPress,
}: { label: string; value: string | null; onPress: () => void }) {
  return (
    <View style={gi.wrap}>
      <Text style={gi.label}>{label}</Text>
      <TouchableOpacity style={gi.field} onPress={onPress} activeOpacity={0.8}>
        <Text style={[gi.input, { color: value ? T.textPrimary : T.textMuted }]}>
          {value ?? 'Select date of birth'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE CARD — glass style consistent with the overall screen
// ─────────────────────────────────────────────────────────────────────────────
function RoleCard({
  emoji, title, description, selected, onPress,
}: {
  emoji: string; title: string; description: string;
  selected: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[rc.root, selected && rc.rootSelected]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={rc.inner}>
        <Text style={rc.emoji}>{emoji}</Text>
        <View style={rc.text}>
          <Text style={rc.title}>{title}</Text>
          <Text style={rc.desc}>{description}</Text>
        </View>
        <View style={[rc.radio, selected && rc.radioSelected]}>
          {selected && <View style={rc.radioDot} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}
const rc = StyleSheet.create({
  root: {
    backgroundColor: T.glass,
    borderRadius: 18, borderWidth: 1,
    borderColor: T.glassBorder, padding: 18,
  },
  rootSelected: {
    borderColor: 'rgba(122,155,126,0.45)',
    backgroundColor: 'rgba(122,155,126,0.09)',
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  emoji: { fontSize: 26 },
  text:  { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: T.textPrimary, marginBottom: 3 },
  desc:  { fontSize: 13, color: T.textSecondary, lineHeight: 18 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: T.glassBorderHi,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: T.sage },
  radioDot: {
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: T.sage,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS DOTS — replace progress bar with minimal dots
// ─────────────────────────────────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={sd.wrap}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            sd.dot,
            i < current ? sd.dotDone : i === current - 1 ? sd.dotActive : sd.dotFuture,
          ]}
        />
      ))}
    </View>
  );
}
const sd = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotDone:   { backgroundColor: T.sage },
  dotActive: { backgroundColor: T.sageBright, width: 18 },
  dotFuture: { backgroundColor: 'rgba(255,255,255,0.15)' },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }: Props) {
  // Step 1 — credentials
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Step 2 — personal
  const [firstName,       setFirstName]       = useState('');
  const [lastName,        setLastName]        = useState('');
  const [phone,           setPhone]           = useState('');
  const [dateOfBirth,     setDateOfBirth]     = useState<Date | null>(null);
  const [showDatePicker,  setShowDatePicker]  = useState(false);
  // Step 3 — role
  const [role,            setRole]            = useState<'user' | 'coach'>('user');

  const [currentStep, setCurrentStep] = useState(1);
  const { register, isLoading } = useAuthStore();

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // ── Validation — preserved exactly ─────────────────────────────────────────
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validateAge   = (d: Date)   => new Date().getFullYear() - d.getFullYear() >= 18;

  const validateStep1 = () => {
    if (!email || !password || !confirmPassword) { Alert.alert('Error', 'Please fill in all fields'); return false; }
    if (!validateEmail(email))   { Alert.alert('Error', 'Please enter a valid email address'); return false; }
    if (password.length < 8)     { Alert.alert('Error', 'Password must be at least 8 characters'); return false; }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return false; }
    return true;
  };
  const validateStep2 = () => {
    if (!firstName || !lastName)  { Alert.alert('Error', 'Please enter your full name'); return false; }
    if (!phone)                   { Alert.alert('Error', 'Please enter your phone number'); return false; }
    if (!dateOfBirth)             { Alert.alert('Error', 'Please enter your date of birth'); return false; }
    if (!validateAge(dateOfBirth)){ Alert.alert('Error', 'You must be 18 or older to use TLC'); return false; }
    return true;
  };

  // Animate step transition
  const animateStep = (next: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setCurrentStep(next);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) animateStep(2);
    else if (currentStep === 2 && validateStep2()) animateStep(3);
  };
  const handleBack = () => { if (currentStep > 1) animateStep(currentStep - 1); };

  const handleRegister = async () => {
    try {
      await register(email, password, firstName, lastName, phone, dateOfBirth, role);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.error || 'Something went wrong');
    }
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // ── Step content ────────────────────────────────────────────────────────────
  const STEP_TITLES = [
    { title: 'Create Account',       sub: 'Start with your login details' },
    { title: 'Tell Us About You',    sub: 'Your coach uses this to personalise your care' },
    { title: 'Choose Your Role',     sub: 'Tracking your health or coaching others?' },
  ];
  const { title, sub } = STEP_TITLES[currentStep - 1];

  return (
    <View style={s.root}>
      {/* Background gradient — same as LoginScreen */}
      <LinearGradient
        colors={[T.bgDeep, T.bgMid, '#162819', '#1A2E1D']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }}
      />
      <BotanicRings />
      {/* Top bloom */}
      <View style={s.topBloom} pointerEvents="none" />

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

            {/* ── BRAND MARK — same as LoginScreen ─────────────────── */}
            <View style={s.brand}>
              <View style={s.ornamentRow}>
                <View style={s.ornamentLine} />
                <Text style={s.leafEmoji}>🌿</Text>
                <View style={s.ornamentLine} />
              </View>
              <Text style={s.brandName}>Transforming</Text>
              <Text style={s.brandName}>Lives Coaching</Text>
            </View>

            {/* ── GLASS CARD ────────────────────────────────────────── */}
            <View style={s.card}>
              <View style={s.cardGlow} />

              {/* Step dots + header */}
              <StepDots current={currentStep} total={3} />
              <Animated.View style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                marginBottom: 22,
              }}>
                <Text style={s.stepTitle}>{title}</Text>
                <Text style={s.stepSub}>{sub}</Text>
              </Animated.View>

              {/* Step content */}
              <Animated.View style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                gap: 16,
              }}>

                {/* STEP 1 */}
                {currentStep === 1 && (
                  <>
                    <GlassInput
                      label="EMAIL"
                      value={email}
                      onChangeText={setEmail}
                      placeholder="your@email.com"
                      keyboardType="email-address"
                      autoComplete="email"
                      editable={!isLoading}
                    />
                    <GlassInput
                      label="PASSWORD"
                      value={password}
                      onChangeText={setPassword}
                      placeholder="At least 8 characters"
                      secureTextEntry
                      autoComplete="off"
                      editable={!isLoading}
                    />
                    <GlassInput
                      label="CONFIRM PASSWORD"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter your password"
                      secureTextEntry
                      autoComplete="off"
                      editable={!isLoading}
                    />
                  </>
                )}

                {/* STEP 2 */}
                {currentStep === 2 && (
                  <>
                    <View style={s.nameRow}>
                      <View style={{ flex: 1 }}>
                        <GlassInput
                          label="FIRST NAME"
                          value={firstName}
                          onChangeText={setFirstName}
                          placeholder="Jane"
                          autoCapitalize="words"
                          editable={!isLoading}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <GlassInput
                          label="LAST NAME"
                          value={lastName}
                          onChangeText={setLastName}
                          placeholder="Doe"
                          autoCapitalize="words"
                          editable={!isLoading}
                        />
                      </View>
                    </View>
                    <GlassInput
                      label="PHONE NUMBER"
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="(555) 123-4567"
                      keyboardType="phone-pad"
                      editable={!isLoading}
                    />
                    <GlassDateButton
                      label="DATE OF BIRTH"
                      value={dateOfBirth ? formatDate(dateOfBirth) : null}
                      onPress={() => setShowDatePicker(true)}
                    />
                    <Text style={s.helperTxt}>Must be 18+ to use TLC</Text>
                    {showDatePicker && (
                      <DateTimePicker
                        value={dateOfBirth || new Date(1990, 0, 1)}
                        mode="date"
                        display="spinner"
                        onChange={(_, d) => { setShowDatePicker(false); if (d) setDateOfBirth(d); }}
                        maximumDate={new Date()}
                      />
                    )}
                  </>
                )}

                {/* STEP 3 */}
                {currentStep === 3 && (
                  <>
                    <RoleCard
                      emoji="👤"
                      title="I'm a User"
                      description="Track my glucose, symptoms, and cycle. Connect with my coach."
                      selected={role === 'user'}
                      onPress={() => setRole('user')}
                    />
                    <RoleCard
                      emoji="🩺"
                      title="I'm a Coach"
                      description="Monitor my clients' health data and provide personalised guidance."
                      selected={role === 'coach'}
                      onPress={() => setRole('coach')}
                    />
                  </>
                )}

              </Animated.View>

              {/* ── NAV BUTTONS ─────────────────────────────────────── */}
              <View style={s.btnRow}>
                {currentStep > 1 && (
                  <TouchableOpacity
                    style={s.backBtn}
                    onPress={handleBack}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={s.backBtnTxt}>← Back</Text>
                  </TouchableOpacity>
                )}

                {currentStep < 3 ? (
                  <TouchableOpacity
                    style={[s.nextBtn, currentStep === 1 && s.nextBtnFull]}
                    onPress={handleNext}
                    disabled={isLoading}
                    activeOpacity={0.87}
                  >
                    <LinearGradient
                      colors={[T.sageMid, T.sageDeep, '#2A3D2E']}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />
                    <Text style={s.nextBtnTxt}>Next →</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[s.nextBtn, s.nextBtnFull, isLoading && { opacity: 0.55 }]}
                    onPress={handleRegister}
                    disabled={isLoading}
                    activeOpacity={0.87}
                  >
                    <LinearGradient
                      colors={[T.sageMid, T.sageDeep, '#2A3D2E']}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />
                    {isLoading
                      ? <ActivityIndicator color="#FFFFFF" />
                      : <Text style={s.nextBtnTxt}>Create Account</Text>
                    }
                  </TouchableOpacity>
                )}
              </View>

              {/* Divider */}
              <View style={s.divider} />

              {/* Sign in link */}
              <TouchableOpacity
                style={s.linkBtn}
                onPress={() => navigation.navigate('Login')}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={s.linkTxt}>
                  Already have an account?{' '}
                  <Text style={s.linkBold}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <Text style={s.footer}>
              A calmer way to notice patterns & align glucose, cycle, and life
            </Text>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT STYLES — mirrors LoginScreen structure exactly
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:  { flex: 1 },
  safe:  { flex: 1 },
  kav:   { flex: 1 },
  scroll: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32,
  },

  topBloom: {
    position: 'absolute', top: -80,
    left: SW * 0.5 - 160,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(122,155,126,0.08)',
  },

  // Brand — same as LoginScreen
  brand: { alignItems: 'center', paddingBottom: 32, gap: 6 },
  ornamentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  ornamentLine: { width: 36, height: 1, backgroundColor: 'rgba(122,155,126,0.30)' },
  leafEmoji:    { fontSize: 20 },
  brandName: {
    fontSize: 32, fontWeight: '700',
    color: T.textPrimary, letterSpacing: -0.8,
    lineHeight: 38, textAlign: 'center',
  },

  // Glass card — same as LoginScreen
  card: {
    backgroundColor: T.glass,
    borderRadius: 28, borderWidth: 1,
    borderColor: T.glassBorderHi,
    overflow: 'hidden',
    padding: 24,
    gap: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.30, shadowRadius: 40, elevation: 12,
  },
  cardGlow: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 1, backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // Step header
  stepTitle: {
    fontSize: 22, fontWeight: '700',
    color: T.textPrimary, letterSpacing: -0.4,
    marginBottom: 4,
  },
  stepSub: {
    fontSize: 13, color: T.textSecondary, lineHeight: 18,
  },

  nameRow: { flexDirection: 'row', gap: 12 },

  helperTxt: {
    fontSize: 11, color: T.textMuted,
    marginTop: -8, marginLeft: 2,
  },

  // Buttons — same pattern as LoginScreen login button
  btnRow: {
    flexDirection: 'row', gap: 12,
    marginTop: 24,
  },
  backBtn: {
    flex: 1, height: 54, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: T.glass,
    borderWidth: 1, borderColor: T.glassBorder,
  },
  backBtnTxt: { fontSize: 15, fontWeight: '600', color: T.textSecondary },
  nextBtn: {
    flex: 1, height: 54, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(122,155,126,0.30)',
    shadowColor: T.sageDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 6,
  },
  nextBtnFull: { flex: 1 },
  nextBtnTxt: {
    fontSize: 16, fontWeight: '700',
    color: '#FFFFFF', letterSpacing: 0.4,
  },

  divider: { height: 1, backgroundColor: T.glassBorder, marginVertical: 20 },

  linkBtn: { alignItems: 'center', paddingVertical: 4 },
  linkTxt:  { fontSize: 14, color: T.textMuted },
  linkBold: { fontSize: 14, fontWeight: '700', color: T.sageBright },

  footer: {
    textAlign: 'center', fontSize: 12,
    color: T.textMuted, lineHeight: 18,
    paddingTop: 24, paddingHorizontal: 16,
  },
});