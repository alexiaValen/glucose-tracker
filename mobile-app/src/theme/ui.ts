// mobile-app/src/theme/ui.ts
import { StyleSheet, Platform } from 'react-native';
import { colors } from './colors';

export const ui = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  screenPadded: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },

  h1: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.charcoal,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
    letterSpacing: 0.2,
  },

  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: colors.textDark,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },

  buttonPrimary: {
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sage,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 3,
  },
  buttonPrimaryDisabled: {
    opacity: 0.6,
  },
  buttonPrimaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  link: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  linkStrong: {
    color: colors.sage,
    fontWeight: '800',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
});