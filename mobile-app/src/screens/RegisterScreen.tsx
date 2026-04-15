// mobile-app/src/screens/RegisterScreen.tsx
// Matches LoginScreen exactly — warm off-white ground, white card, clean form.
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import DateTimePicker from '@react-native-community/datetimepicker';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;
interface Props { navigation: RegisterScreenNavigationProp; }

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS — exact copy from LoginScreen
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  pageBg:      '#F7F5F2',
  cardBg:      '#FFFFFF',
  inputBg:     '#FAFAF8',
  inputBorder: '#E5E2DB',
  inputFocus:  '#B5B0A8',
  inkDark:     '#1A1814',
  inkMid:      '#4A4640',
  inkMuted:    '#9B9690',
  btnBg:       '#2B4535',
  btnText:     '#F0EDE8',
  gold:        '#A8916A',
  cardBorder:  'rgba(0,0,0,0.05)',
  divider:     '#EDEAE5',
  forest:      '#2B4535',
  forestLight: 'rgba(43,69,53,0.09)',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// FIELD — matches LoginScreen Field exactly
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
    fontSize: 11, fontWeight: '500', letterSpacing: 0.8,
    color: T.inkMuted, textTransform: 'uppercase',
  },
  field: {
    backgroundColor: T.inputBg,
    borderRadius: 10, borderWidth: 1, borderColor: T.inputBorder,
  },
  fieldFocused: { borderColor: T.inputFocus, backgroundColor: '#FFFFFF' },
  input: {
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 15 : 13,
    fontSize: 15, color: T.inkDark, fontWeight: '400', letterSpacing: 0.1,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// DATE BUTTON — same light style as Field
// ─────────────────────────────────────────────────────────────────────────────
function DateButton({
  label, value, onPress,
}: { label: string; value: string | null; onPress: () => void }) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <TouchableOpacity style={f.field} onPress={onPress} activeOpacity={0.8}>
        <Text style={[f.input, { color: value ? T.inkDark : T.inkMuted }]}>
          {value ?? 'Select date of birth'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE CARD — light style
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
      activeOpacity={0.8}
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
    backgroundColor: T.inputBg,
    borderRadius: 14, borderWidth: 1, borderColor: T.inputBorder, padding: 16,
  },
  rootSelected: {
    borderColor: T.forest,
    backgroundColor: T.forestLight,
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  emoji: { fontSize: 24 },
  text:  { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: T.inkDark, marginBottom: 2 },
  desc:  { fontSize: 13, color: T.inkMuted, lineHeight: 18 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: T.inputBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: T.forest },
  radioDot: {
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: T.forest,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// STEP DOTS — light style
// ─────────────────────────────────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={sd.wrap}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            sd.dot,
            i < current     ? sd.dotDone   :
            i === current - 1 ? sd.dotActive :
            sd.dotFuture,
          ]}
        />
      ))}
    </View>
  );
}
const sd = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotDone:   { backgroundColor: T.forest },
  dotActive: { backgroundColor: T.forest, width: 18 },
  dotFuture: { backgroundColor: T.inputBorder },
});

// ─────────────────────────────────────────────────────────────────────────────
// LOGOTYPE — same as LoginScreen
// ─────────────────────────────────────────────────────────────────────────────
function Logotype() {
  return (
    <View style={logo.wrap}>
      <View style={logo.rule} />
      <Text style={logo.mark}>TLC</Text>
    </View>
  );
}
const logo = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, marginBottom: 32 },
  rule: { width: 28, height: 1, backgroundColor: T.gold, borderRadius: 1 },
  mark: {
    fontSize: 13, fontWeight: '600', letterSpacing: 4,
    color: T.inkMid, textTransform: 'uppercase',
  },
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

  // Entrance animation
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 540, delay: 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, delay: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Validation — preserved exactly ──────────────────────────────────────────
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validateAge   = (d: Date)   => new Date().getFullYear() - d.getFullYear() >= 18;

  const validateStep1 = () => {
    if (!email || !password || !confirmPassword) { Alert.alert('Error', 'Please fill in all fields'); return false; }
    if (!validateEmail(email))       { Alert.alert('Error', 'Please enter a valid email address'); return false; }
    if (password.length < 8)         { Alert.alert('Error', 'Password must be at least 8 characters'); return false; }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return false; }
    return true;
  };
  const validateStep2 = () => {
    if (!firstName || !lastName) { Alert.alert('Error', 'Please enter your full name'); return false; }
    if (!phone)                  { Alert.alert('Error', 'Please enter your phone number'); return false; }
    if (!dateOfBirth)            { Alert.alert('Error', 'Please enter your date of birth'); return false; }
    if (!validateAge(dateOfBirth)) { Alert.alert('Error', 'You must be 18 or older to use TLC'); return false; }
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

  const STEP_TITLES = [
    { title: 'Create Account',    sub: 'Start with your login details' },
    { title: 'Tell Us About You', sub: 'Your coach uses this to personalise your care' },
    { title: 'Choose Your Role',  sub: 'Tracking your health or coaching others?' },
  ];
  const { title, sub } = STEP_TITLES[currentStep - 1];

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
                <Text style={s.headline}>Join TLC</Text>
                <Text style={s.sub}>Rooted in faith. Moving in health.</Text>
              </View>

              {/* ── CARD ─────────────────────────────────────────────── */}
              <View style={s.card}>

                {/* Step dots + step header */}
                <StepDots current={currentStep} total={3} />
                <Animated.View style={{ marginBottom: 20 }}>
                  <Text style={s.stepTitle}>{title}</Text>
                  <Text style={s.stepSub}>{sub}</Text>
                </Animated.View>

                {/* Step content */}
                <Animated.View style={{ gap: 16 }}>

                  {/* STEP 1 */}
                  {currentStep === 1 && (
                    <>
                      <Field
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="your@email.com"
                        keyboardType="email-address"
                        autoComplete="email"
                        editable={!isLoading}
                      />
                      <Field
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="At least 8 characters"
                        secureTextEntry
                        autoComplete="off"
                        editable={!isLoading}
                      />
                      <Field
                        label="Confirm Password"
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
                          <Field
                            label="First Name"
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="Jane"
                            autoCapitalize="words"
                            editable={!isLoading}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Field
                            label="Last Name"
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Doe"
                            autoCapitalize="words"
                            editable={!isLoading}
                          />
                        </View>
                      </View>
                      <Field
                        label="Phone Number"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="(555) 123-4567"
                        keyboardType="phone-pad"
                        editable={!isLoading}
                      />
                      <DateButton
                        label="Date of Birth"
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

                {/* ── NAV BUTTONS ──────────────────────────────────────── */}
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
                      style={[s.ctaBtn, currentStep === 1 && s.ctaBtnFull]}
                      onPress={handleNext}
                      disabled={isLoading}
                      activeOpacity={0.88}
                    >
                      <Text style={s.ctaBtnTxt}>Next →</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[s.ctaBtn, s.ctaBtnFull, isLoading && s.ctaBtnDisabled]}
                      onPress={handleRegister}
                      disabled={isLoading}
                      activeOpacity={0.88}
                    >
                      {isLoading
                        ? <ActivityIndicator color={T.btnText} />
                        : <Text style={s.ctaBtnTxt}>Create Account  →</Text>
                      }
                    </TouchableOpacity>
                  )}
                </View>

                {/* Divider */}
                <View style={s.divider} />

                {/* Sign in link */}
                <View style={s.registerRow}>
                  <Text style={s.registerPrompt}>Already have an account? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Login')}
                    disabled={isLoading}
                    activeOpacity={0.65}
                  >
                    <Text style={s.registerLink}>Sign in</Text>
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
// STYLES — mirrors LoginScreen structure exactly
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.pageBg },
  safe: { flex: 1 },
  kav:  { flex: 1 },
  scroll: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 48,
  },
  inner: {},

  header: { alignItems: 'center', marginBottom: 32, gap: 8 },
  headline: {
    fontSize: 30, fontWeight: '300', letterSpacing: -0.4,
    color: T.inkDark, textAlign: 'center',
  },
  sub: {
    fontSize: 14, fontWeight: '400',
    color: T.inkMuted, letterSpacing: 0.1, textAlign: 'center',
  },

  // Form card — matches LoginScreen exactly
  card: {
    backgroundColor: T.cardBg,
    borderRadius: 22, borderWidth: 1, borderColor: T.cardBorder,
    paddingHorizontal: 24, paddingVertical: 28, gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05, shadowRadius: 30, elevation: 6,
  },

  stepTitle: {
    fontSize: 20, fontWeight: '600',
    color: T.inkDark, letterSpacing: -0.3, marginBottom: 4,
  },
  stepSub: { fontSize: 13, color: T.inkMuted, lineHeight: 18 },

  nameRow: { flexDirection: 'row', gap: 12 },

  helperTxt: { fontSize: 11, color: T.inkMuted, marginTop: -8, marginLeft: 2 },

  // Nav buttons
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  backBtn: {
    flex: 1, height: 52, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: T.inputBg,
    borderWidth: 1, borderColor: T.inputBorder,
  },
  backBtnTxt: { fontSize: 15, fontWeight: '500', color: T.inkMid },

  ctaBtn: {
    flex: 1, height: 52, backgroundColor: T.btnBg,
    borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    shadowColor: T.btnBg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 4,
  },
  ctaBtnFull:     { flex: 1 },
  ctaBtnDisabled: { opacity: 0.50 },
  ctaBtnTxt: {
    fontSize: 15, fontWeight: '500',
    color: T.btnText, letterSpacing: 0.2,
  },

  divider: { height: 1, backgroundColor: T.divider, marginVertical: 2 },

  registerRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  registerPrompt: { fontSize: 13, color: T.inkMuted, fontWeight: '400' },
  registerLink: {
    fontSize: 13, fontWeight: '500', color: T.inkDark,
    textDecorationLine: 'underline', textDecorationColor: T.gold,
  },
});
