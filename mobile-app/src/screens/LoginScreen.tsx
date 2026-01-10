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
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';
// import { ui } from '../theme/ui';
import { useFonts } from 'expo-font';
// import { Ionicons } from '@expo/vector-icons';
// import { Image } from 'react-native';
import { typography } from '../theme/typography';


type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
//   const [fontsLoaded] = useFonts({
//   'Playfair-Bold': require('./assets/fonts/PlayfairDisplay-Bold.ttf'),
//   'Playfair-Italic': require('./assets/fonts/PlayfairDisplay-Italic.ttf'),
// });
// const [fontsLoaded] = useFonts({
//   'Playfair-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
//   'Playfair-Italic': require('../assets/fonts/PlayfairDisplay-Italic.ttf'),
// });

// if (!fontsLoaded) return null; // or a splash/loading 


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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.container}>
        {/* Background image */}
        <ImageBackground
          source={require('../assets/bg/leaf-watercolor.png')}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
        />

        {/* Optional: overall wash to calm the texture */}
        <View style={styles.topFade} />

        {/* Light top → dark bottom gradient */}
        <LinearGradient
          colors={[
            'rgba(245,244,240,0.92)', // cream (top)
            'rgba(232,237,233,0.85)', // pale sage
            'rgba(140,155,142,0.55)', // light sage
            'rgba(61,85,64,0.32)',    // forest green
            'rgba(42,45,42,0.70)',    // charcoal (bottom)
          ]}
          locations={[0, 0.35, 0.55, 0.75, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.accentRow}>
              <View style={styles.accentLine} />
              <Text style={styles.accentLeaf}>🌿</Text>
              <View style={styles.accentLine} />
            </View>

            <Text style={styles.title}>GraceFlow</Text>
            <Text style={styles.subtitle}>Track your glucose &amp; cycle with grace</Text>
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
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && { opacity: 0.65 }]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              <Text style={styles.buttonText}>{isLoading ? 'Logging in…' : 'Login'}</Text>
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
                  Don&apos;t have an account? <Text style={styles.linkBold}>Sign Up</Text>
                </Text>
              </TouchableOpacity>

              <Text style={styles.footerNote}>
                A calmer way to notice patterns — glucose, cycle, and how you feel.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  bgWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245,244,240,0.35)', // calm down texture
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
  ...typography.title,
  color: colors.charcoal,
  textAlign: 'center',
},
  subtitle: {
  ...typography.subtitle,
  color: colors.textSecondary,
  textAlign: 'center',
  marginTop: 6,
},

  card: {
    backgroundColor: 'rgba(255,255,255,0.92)', // ⬅️ more opaque so nothing shows through
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.70)',
    padding: 18,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },

  field: { marginBottom: 14 },

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

  linkButton: { paddingVertical: 6 },
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


// subtitle: {
//   fontFamily: 'Playfair-Italic',
//   fontSize: 16,
//   color: colors.textSecondary,
//   textAlign: 'center',
//   marginTop: 6,
//   opacity: 0.9,
// },
topFade: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(245,244,240,0.70)',
},
bottomFade: {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: '60%',
  backgroundColor: 'rgba(42,45,42,0.18)',
},  
});