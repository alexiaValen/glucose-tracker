// // mobile-app/src/screens/RegisterScreen.tsx
// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   ActivityIndicator,
// } from 'react-native';
// import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import type { RootStackParamList } from '../types/navigation';
// import { useAuthStore } from '../stores/authStore';
// import { BotanicalBackground } from '../components/BotanicalBackground';
// import { colors } from '../theme/colors';
// import { SignalRingThin } from '../components/icons';

// type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

// interface Props {
//   navigation: RegisterScreenNavigationProp;
// }

// export default function RegisterScreen({ navigation }: Props) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [firstName, setFirstName] = useState('');
//   const [lastName, setLastName] = useState('');
//   const { register, isLoading } = useAuthStore();

//   const handleRegister = async () => {
//     if (!email || !password || !firstName) {
//       Alert.alert('Error', 'Please fill in all required fields');
//       return;
//     }

//     if (password.length < 8) {
//       Alert.alert('Error', 'Password must be at least 8 characters');
//       return;
//     }

//     if (password !== confirmPassword) {
//       Alert.alert('Error', 'Passwords do not match');
//       return;
//     }

//     try {
//       await register(email, password, firstName, lastName);
//     } catch (error: any) {
//       Alert.alert(
//         'Registration Failed',
//         error.response?.data?.error || 'Something went wrong'
//       );
//     }
//   };

//   return (
//     <BotanicalBackground variant="green" intensity="light">
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.keyboardView}
//       >
//         <ScrollView 
//           contentContainerStyle={styles.scrollContent}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           <View style={styles.content}>
//             {/* Header */}
//             <View style={styles.header}>
//               <SignalRingThin size={32} muted="rgba(107,127,110,0.3)" />
//               <Text style={styles.title}>Join GraceFlow</Text>
//               <Text style={styles.subtitle}>Begin your wellness journey</Text>
//             </View>

//             {/* Form Card */}
//             <View style={styles.card}>
//               <View style={styles.form}>
//                 {/* Name Row */}
//                 <View style={styles.nameRow}>
//                   <View style={[styles.field, styles.fieldHalf]}>
//                     <Text style={styles.label}>FIRST NAME *</Text>
//                     <TextInput
//                       style={styles.input}
//                       placeholder="Jane"
//                       placeholderTextColor="rgba(42,45,42,0.35)"
//                       value={firstName}
//                       onChangeText={setFirstName}
//                       editable={!isLoading}
//                       autoComplete="name-given"
//                     />
//                   </View>

//                   <View style={[styles.field, styles.fieldHalf]}>
//                     <Text style={styles.label}>LAST NAME</Text>
//                     <TextInput
//                       style={styles.input}
//                       placeholder="Doe"
//                       placeholderTextColor="rgba(42,45,42,0.35)"
//                       value={lastName}
//                       onChangeText={setLastName}
//                       editable={!isLoading}
//                       autoComplete="name-family"
//                     />
//                   </View>
//                 </View>

//                 <View style={styles.field}>
//                   <Text style={styles.label}>EMAIL *</Text>
//                   <TextInput
//                     style={styles.input}
//                     placeholder="your@email.com"
//                     placeholderTextColor="rgba(42,45,42,0.35)"
//                     value={email}
//                     onChangeText={setEmail}
//                     autoCapitalize="none"
//                     keyboardType="email-address"
//                     editable={!isLoading}
//                     autoComplete="email"
//                   />
//                 </View>

//                 <View style={styles.field}>
//                   <Text style={styles.label}>PASSWORD *</Text>
//                   <TextInput
//                     style={styles.input}
//                     placeholder="At least 8 characters"
//                     placeholderTextColor="rgba(42,45,42,0.35)"
//                     value={password}
//                     onChangeText={setPassword}
//                     secureTextEntry
//                     editable={!isLoading}
//                     autoComplete="off"
//                     textContentType="none"
//                     autoCorrect={false}
//                   />
//                 </View>

//                 <View style={styles.field}>
//                   <Text style={styles.label}>CONFIRM PASSWORD *</Text>
//                   <TextInput
//                     style={styles.input}
//                     placeholder="Re-enter your password"
//                     placeholderTextColor="rgba(42,45,42,0.35)"
//                     value={confirmPassword}
//                     onChangeText={setConfirmPassword}
//                     secureTextEntry
//                     editable={!isLoading}
//                     autoComplete="off"
//                     textContentType="none"
//                     autoCorrect={false}
//                   />
//                 </View>

//                 <TouchableOpacity
//                   style={[styles.button, isLoading && { opacity: 0.5 }]}
//                   onPress={handleRegister}
//                   disabled={isLoading}
//                   activeOpacity={0.85}
//                 >
//                   {isLoading ? (
//                     <ActivityIndicator color="#FFFFFF" />
//                   ) : (
//                     <Text style={styles.buttonText}>Create account</Text>
//                   )}
//                 </TouchableOpacity>

//                 <View style={styles.divider}>
//                   <View style={styles.dividerLine} />
//                   <Text style={styles.dividerText}>or</Text>
//                   <View style={styles.dividerLine} />
//                 </View>

//                 <TouchableOpacity
//                   onPress={() => navigation.navigate('Login')}
//                   style={styles.linkButton}
//                   disabled={isLoading}
//                 >
//                   <Text style={styles.linkText}>
//                     Already have an account? <Text style={styles.linkBold}>Sign in</Text>
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </BotanicalBackground>
//   );
// }

// const styles = StyleSheet.create({
//   keyboardView: {
//     flex: 1,
//   },
//   scrollContent: {
//     flexGrow: 1,
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: 20,
//     paddingTop: 80,
//     paddingBottom: 40,
//     justifyContent: 'center',
//   },
//   header: {
//     marginBottom: 32,
//     alignItems: 'center',
//     gap: 12,
//   },
//   title: {
//     fontSize: 32,
//     fontWeight: '600',
//     color: '#2B2B2B',
//     textAlign: 'center',
//     letterSpacing: -0.5,
//   },
//   subtitle: {
//     fontSize: 15,
//     color: 'rgba(42,45,42,0.6)',
//     textAlign: 'center',
//     fontWeight: '400',
//   },
//   card: {
//     backgroundColor: 'rgba(255,255,255,0.95)',
//     borderRadius: 24,
//     padding: 24,
//     borderWidth: 1,
//     borderColor: 'rgba(212,214,212,0.3)',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.08,
//     shadowRadius: 16,
//     elevation: 4,
//   },
//   form: {
//     gap: 16,
//   },
//   nameRow: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   field: {
//     gap: 8,
//   },
//   fieldHalf: {
//     flex: 1,
//   },
//   label: {
//     fontSize: 11,
//     fontWeight: '600',
//     color: 'rgba(42,45,42,0.6)',
//     letterSpacing: 0.8,
//   },
//   input: {
//     backgroundColor: 'rgba(255,255,255,0.8)',
//     borderWidth: 1.5,
//     borderColor: 'rgba(212,214,212,0.5)',
//     borderRadius: 14,
//     paddingHorizontal: 16,
//     paddingVertical: Platform.OS === 'ios' ? 14 : 12,
//     fontSize: 15,
//     color: '#2B2B2B',
//     fontWeight: '400',
//   },
//   button: {
//     backgroundColor: '#6B7F6E',
//     height: 56,
//     borderRadius: 14,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.12,
//     shadowRadius: 12,
//     elevation: 4,
//   },
//   buttonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//     letterSpacing: 0.3,
//   },
//   divider: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 8,
//     gap: 12,
//   },
//   dividerLine: {
//     flex: 1,
//     height: 1,
//     backgroundColor: 'rgba(212,214,212,0.4)',
//   },
//   dividerText: {
//     fontSize: 12,
//     color: 'rgba(42,45,42,0.45)',
//     fontWeight: '500',
//   },
//   linkButton: {
//     paddingVertical: 8,
//     alignItems: 'center',
//   },
//   linkText: {
//     color: 'rgba(42,45,42,0.6)',
//     fontSize: 14,
//     fontWeight: '400',
//   },
//   linkBold: {
//     color: '#6B7F6E',
//     fontWeight: '600',
//   },
// });


// mobile-app/src/screens/RegisterScreen_COMPLETE.tsx
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
import DateTimePicker from '@react-native-community/datetimepicker';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export default function RegisterScreen({ navigation }: Props) {
  // Step 1: Basic Info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Step 2: Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Step 3: Role Selection
  const [role, setRole] = useState<'user' | 'coach'>('user');
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  const { register, isLoading } = useAuthStore();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateAge = (dob: Date): boolean => {
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    return age >= 18;
  };

  const validateStep1 = (): boolean => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    if (!firstName || !lastName) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }

    if (!phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }

    if (!dateOfBirth) {
      Alert.alert('Error', 'Please enter your date of birth');
      return false;
    }

    if (!validateAge(dateOfBirth)) {
      Alert.alert('Error', 'You must be 18 or older to use GraceFlow');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRegister = async () => {
    try {
      await register(email, password, firstName, lastName);
      // Navigation handled by authStore
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.error || 'Something went wrong'
      );
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Create Your Account</Text>
      <Text style={styles.stepSubtitle}>Let's start with the basics</Text>

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
        />
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Tell Us About Yourself</Text>
      <Text style={styles.stepSubtitle}>Your coach will use this to personalize your care</Text>

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
          />
        </View>

        <View style={[styles.field, styles.fieldHalf]}>
          <Text style={styles.label}>LAST NAME *</Text>
          <TextInput
            style={styles.input}
            placeholder="Doe"
            placeholderTextColor="rgba(42,45,42,0.35)"
            value={lastName}
            onChangeText={setLastName}
            editable={!isLoading}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>PHONE NUMBER *</Text>
        <TextInput
          style={styles.input}
          placeholder="(555) 123-4567"
          placeholderTextColor="rgba(42,45,42,0.35)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!isLoading}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>DATE OF BIRTH *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[styles.dateText, !dateOfBirth && styles.placeholderText]}>
            {dateOfBirth ? formatDate(dateOfBirth) : 'Select your date of birth'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>You must be 18+ to use GraceFlow</Text>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth || new Date(1990, 0, 1)}
          mode="date"
          display="spinner"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDateOfBirth(selectedDate);
            }
          }}
          maximumDate={new Date()}
        />
      )}
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Choose Your Role</Text>
      <Text style={styles.stepSubtitle}>Are you tracking your health or coaching others?</Text>

      <TouchableOpacity
        style={[styles.roleCard, role === 'user' && styles.roleCardSelected]}
        onPress={() => setRole('user')}
      >
        <View style={styles.roleHeader}>
          <Text style={styles.roleEmoji}>👤</Text>
          <Text style={styles.roleTitle}>I'm a User</Text>
        </View>
        <Text style={styles.roleDescription}>
          Track my glucose, symptoms, and cycle. Connect with my coach.
        </Text>
        {role === 'user' && <View style={styles.selectedBadge} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.roleCard, role === 'coach' && styles.roleCardSelected]}
        onPress={() => setRole('coach')}
      >
        <View style={styles.roleHeader}>
          <Text style={styles.roleEmoji}>🩺</Text>
          <Text style={styles.roleTitle}>I'm a Coach</Text>
        </View>
        <Text style={styles.roleDescription}>
          Monitor my clients' health data and provide personalized guidance.
        </Text>
        {role === 'coach' && <View style={styles.selectedBadge} />}
      </TouchableOpacity>
    </>
  );

  return (
    <BotanicalBackground variant="subtle" intensity="light">
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
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(currentStep / 3) * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>Step {currentStep} of 3</Text>
            </View>

            {/* Form Card */}
            <View style={styles.card}>
              <View style={styles.form}>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}

                {/* Navigation Buttons */}
                <View style={styles.buttonRow}>
                  {currentStep > 1 && (
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={handleBack}
                      disabled={isLoading}
                    >
                      <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                  )}

                  {currentStep < 3 ? (
                    <TouchableOpacity
                      style={[styles.nextButton, currentStep === 1 && styles.nextButtonFull]}
                      onPress={handleNext}
                      disabled={isLoading}
                    >
                      <Text style={styles.nextButtonText}>Next →</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.nextButton, styles.nextButtonFull]}
                      onPress={handleRegister}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.nextButtonText}>Create Account</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.divider}>
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
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(212,214,212,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6B7F6E',
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(42,45,42,0.5)',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
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
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2B2B2B',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: 'rgba(42,45,42,0.6)',
    marginBottom: 16,
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
  dateButton: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,214,212,0.5)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateText: {
    fontSize: 15,
    color: '#2B2B2B',
  },
  placeholderText: {
    color: 'rgba(42,45,42,0.35)',
  },
  helperText: {
    fontSize: 11,
    color: 'rgba(42,45,42,0.5)',
    marginTop: 4,
  },
  roleCard: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 2,
    borderColor: 'rgba(212,214,212,0.5)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    position: 'relative',
  },
  roleCardSelected: {
    borderColor: '#6B7F6E',
    backgroundColor: 'rgba(107,127,110,0.05)',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  roleEmoji: {
    fontSize: 28,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2B2B2B',
  },
  roleDescription: {
    fontSize: 14,
    color: 'rgba(42,45,42,0.6)',
    lineHeight: 20,
  },
  selectedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6B7F6E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(212,214,212,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#2B2B2B',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#6B7F6E',
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
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212,214,212,0.4)',
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