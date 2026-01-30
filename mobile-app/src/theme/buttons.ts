import { ViewStyle, TextStyle } from 'react-native';

export const buttonStyles = {
  // Primary filled button - "Log glucose"
  primary: {
    container: {
      backgroundColor: '#6B7F6E',
      borderRadius: 14,
      paddingVertical: 18,
      paddingHorizontal: 20,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
    } as ViewStyle,
    text: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
      letterSpacing: 0.3,
    } as TextStyle,
  },

  // Secondary outline button - "Log symptoms"
  secondary: {
    container: {
      backgroundColor: 'rgba(255,255,255,0.6)',
      borderWidth: 1.5,
      borderColor: 'rgba(42,45,42,0.12)',
      borderRadius: 14,
      paddingVertical: 17,
      paddingHorizontal: 20,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
    } as ViewStyle,
    text: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#2B2B2B',
      letterSpacing: 0.3,
    } as TextStyle,
  },

  // Icon button (ghost) - Settings, Messages
  iconButton: {
    container: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.4)',
      borderWidth: 1.5,
      borderColor: 'rgba(42,45,42,0.15)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 1,
    } as ViewStyle,
  },

  // Text link - "See all"
  textLink: {
    text: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: 'rgba(42,45,42,0.5)',
      letterSpacing: 0.1,
    } as TextStyle,
  },
};