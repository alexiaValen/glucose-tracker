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
//       // Navigation will happen automatically via auth state
//     } catch (error: any) {
//       Alert.alert(
//         'Registration Failed',
//         error.response?.data?.error || 'Something went wrong'
//       );
//     }
//   };

//   return (
//     <View style={styles.container}>
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
//               <Text style={styles.title}>Join GraceFlow</Text>
//               <Text style={styles.subtitle}>Start tracking your health journey</Text>
//             </View>

//             {/* Form */}
//             <View style={styles.form}>
//               <View style={styles.field}>
//                 <Text style={styles.label}>First Name *</Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Jane"
//                   placeholderTextColor="#999"
//                   value={firstName}
//                   onChangeText={setFirstName}
//                   editable={!isLoading}
//                   autoComplete="name-given"
//                 />
//               </View>

//               <View style={styles.field}>
//                 <Text style={styles.label}>Last Name</Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Doe"
//                   placeholderTextColor="#999"
//                   value={lastName}
//                   onChangeText={setLastName}
//                   editable={!isLoading}
//                   autoComplete="name-family"
//                 />
//               </View>

//               <View style={styles.field}>
//                 <Text style={styles.label}>Email *</Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="your@email.com"
//                   placeholderTextColor="#999"
//                   value={email}
//                   onChangeText={setEmail}
//                   autoCapitalize="none"
//                   keyboardType="email-address"
//                   editable={!isLoading}
//                   autoComplete="email"
//                 />
//               </View>

//               <View style={styles.field}>
//                 <Text style={styles.label}>Password *</Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="At least 8 characters"
//                   placeholderTextColor="#999"
//                   value={password}
//                   onChangeText={setPassword}
//                   secureTextEntry
//                   editable={!isLoading}
//                   autoComplete="off"
//                   textContentType="none"
//                   autoCorrect={false}
//                 />
//               </View>

//               <View style={styles.field}>
//                 <Text style={styles.label}>Confirm Password *</Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Re-enter your password"
//                   placeholderTextColor="#999"
//                   value={confirmPassword}
//                   onChangeText={setConfirmPassword}
//                   secureTextEntry
//                   editable={!isLoading}
//                   autoComplete="off"
//                   textContentType="none"
//                   autoCorrect={false}
//                 />
//               </View>

//               <TouchableOpacity
//                 style={[styles.button, isLoading && { opacity: 0.65 }]}
//                 onPress={handleRegister}
//                 disabled={isLoading}
//                 activeOpacity={0.9}
//               >
//                 {isLoading ? (
//                   <ActivityIndicator color="#fff" />
//                 ) : (
//                   <Text style={styles.buttonText}>Create Account</Text>
//                 )}
//               </TouchableOpacity>

//               <TouchableOpacity
//                 onPress={() => navigation.navigate('Login')}
//                 style={styles.linkButton}
//                 disabled={isLoading}
//               >
//                 <Text style={styles.linkText}>
//                   Already have an account? <Text style={styles.linkBold}>Login</Text>
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FAF8F4',
//   },
//   keyboardView: {
//     flex: 1,
//   },
//   scrollContent: {
//     flexGrow: 1,
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: 20,
//     justifyContent: 'center',
//     paddingBottom: 20,
//     paddingTop: 80,
//   },
//   header: {
//     marginBottom: 32,
//     alignItems: 'center',
//   },
//   title: {
//     fontSize: 32,
//     fontWeight: '800',
//     color: '#3A3A3A',
//     textAlign: 'center',
//     letterSpacing: -0.3,
//   },
//   subtitle: {
//     fontSize: 15,
//     color: '#6B6B6B',
//     textAlign: 'center',
//     marginTop: 6,
//   },
//   form: {
//     width: '100%',
//   },
//   field: { 
//     marginBottom: 16,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#2C2C2C',
//     marginBottom: 8,
//   },
//   input: {
//     backgroundColor: '#FFFFFF',
//     borderWidth: 1,
//     borderColor: '#E8E6E0',
//     borderRadius: 14,
//     paddingHorizontal: 16,
//     paddingVertical: Platform.OS === 'ios' ? 14 : 12,
//     fontSize: 16,
//     color: '#2C2C2C',
//   },
//   button: {
//     height: 56,
//     borderRadius: 14,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#7A8B6F',
//     marginTop: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   buttonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   linkButton: { 
//     marginTop: 24,
//     alignItems: 'center',
//   },
//   linkText: {
//     color: '#6B6B6B',
//     fontSize: 15,
//   },
//   linkBold: {
//     color: '#7A8B6F',
//     fontWeight: '600',
//   },
// });



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
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { BotanicalBackground } from '../components/BotanicalBackground';
import { colors } from '../theme/colors';

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
    <BotanicalBackground variant="3d" intensity="medium">
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
              <View style={styles.accentRow}>
                <View style={styles.accentLine} />
                <Text style={styles.accentLeaf}>🌿</Text>
                <View style={styles.accentLine} />
              </View>

              <Text style={styles.title}>Join GraceFlow</Text>
              <Text style={styles.subtitle}>Begin your wellness journey with grace</Text>
            </View>

            {/* Form Card */}
            <LinearGradient
              colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.95)']}
              style={styles.card}
            >
              <View style={styles.form}>
                {/* Name Row */}
                <View style={styles.nameRow}>
                  <View style={[styles.field, styles.fieldHalf]}>
                    <Text style={styles.label}>First Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Jane"
                      placeholderTextColor={colors.textMuted}
                      value={firstName}
                      onChangeText={setFirstName}
                      editable={!isLoading}
                      autoComplete="name-given"
                    />
                  </View>

                  <View style={[styles.field, styles.fieldHalf]}>
                    <Text style={styles.label}>Last Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Doe"
                      placeholderTextColor={colors.textMuted}
                      value={lastName}
                      onChangeText={setLastName}
                      editable={!isLoading}
                      autoComplete="name-family"
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Email *</Text>
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
                  <Text style={styles.label}>Password *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.textMuted}
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
                  <Text style={styles.label}>Confirm Password *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor={colors.textMuted}
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
                  style={[styles.button, isLoading && { opacity: 0.65 }]}
                  onPress={handleRegister}
                  disabled={isLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[colors.sage, colors.forestGreen]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <>
                        <Text style={styles.buttonIcon}>✨</Text>
                        <Text style={styles.buttonText}>Create Account</Text>
                      </>
                    )}
                  </LinearGradient>
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
                    Already have an account? <Text style={styles.linkBold}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Footer Note */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By creating an account, you agree to track your wellness journey with intention and care 🌸
              </Text>
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
    marginBottom: 28,
    alignItems: 'center',
  },
  accentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
    opacity: 0.95,
  },
  accentLine: {
    height: 1,
    width: 56,
    backgroundColor: 'rgba(42,45,42,0.18)',
  },
  accentLeaf: {
    fontSize: 18,
    color: colors.goldLeaf,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.charcoal,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 20,
  },

  card: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.5)',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
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
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,214,212,0.7)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 15,
    color: colors.textDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },

  button: {
    height: 56,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonIcon: {
    fontSize: 20,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
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
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },

  linkButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  linkBold: {
    color: colors.sage,
    fontWeight: '800',
  },

  footer: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    opacity: 0.85,
  },
});