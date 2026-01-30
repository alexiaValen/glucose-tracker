// src/theme/typography.ts
import { TextStyle } from 'react-native';

// export const typography = {
//   title: {
//     fontFamily: 'PlayfairBold',
//     fontSize: 42,
//     letterSpacing: -0.3,
//   },

//   subtitle: {
//     fontFamily: 'PlayfairItalic',
//     fontSize: 15,
//     lineHeight: 20,
//   },

//   body: {
//     fontFamily: 'System', // or default RN font
//     fontSize: 15,
//   },

//   button: {
//     fontFamily: 'System',
//     fontSize: 16,
//     fontWeight: '700',
//   },
// };

export const typography = {
  // Section headers (all caps) - "GLUCOSE OVERVIEW"
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: 'rgba(42,45,42,0.5)',
  } as TextStyle,

  // Large display numbers - "95 mg/dL"
  displayLarge: {
    fontSize: 32,
    fontWeight: '300' as const,
    letterSpacing: -0.5,
    color: '#2B2B2B',
  } as TextStyle,

  // Medium display - Stats numbers
  displayMedium: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    color: '#2B2B2B',
  } as TextStyle,

  // Card titles - "Alexia Coach"
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
    color: '#2B2B2B',
  } as TextStyle,

  // Body text - "Headache", "Day 14 of 28"
  body: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#2B2B2B',
  } as TextStyle,

  // Secondary text - "10/10", "mg/dL"
  secondary: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: 'rgba(42,45,42,0.5)',
  } as TextStyle,

  // Tertiary text - "2 hours ago"
  tertiary: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: 'rgba(42,45,42,0.45)',
  } as TextStyle,

  // Button text
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  } as TextStyle,

  // Greeting - "Hello"
  greetingLight: {
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
    color: 'rgba(42,45,42,0.5)',
  } as TextStyle,

  // Greeting - "Alexia"
  greetingBold: {
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    color: '#2B2B2B',
  } as TextStyle,
};