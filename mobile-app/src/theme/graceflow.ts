// mobile-app/src/theme/graceflow.ts
// GraceFlow Design System — full token system for React Native
// "Inner garden meets high-end wellness tech"

import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// 1. COLOR TOKENS
// ─────────────────────────────────────────────────────────────────────────────

export const palette = {
  // Sage green scale
  sage50:  '#F2F5F2',
  sage100: '#E0E8E1',
  sage200: '#C2D4C4',
  sage300: '#9DB8A0',
  sage400: '#7A9B7D',
  sage500: '#6B7F6E',  // primary brand
  sage600: '#546460',
  sage700: '#3D5540',  // forestGreen — dark surfaces
  sage800: '#2D3F30',
  sage900: '#1A251C',

  // Warm cream / off-white
  cream50:  '#FDFCFA',
  cream100: '#FAF8F4',  // main background
  cream200: '#F5F3EE',
  cream300: '#EDE9E1',
  cream400: '#E0DAD0',

  // Muted gold accent
  gold100: '#F5EDD6',
  gold300: '#D9BE7A',
  gold500: '#B89A5A',  // primary accent
  gold700: '#8A7040',

  // Neutrals
  ink900: '#1A1C1A',
  ink800: '#2B2B2B',
  ink700: '#3A3D3A',
  ink500: '#6B6B6B',
  ink300: '#A8ABA8',
  ink200: '#D4D6D4',
  ink100: '#EBEBEB',

  // Pure
  white: '#FFFFFF',
  black: '#000000',

  // Semantic
  successLight: 'rgba(107,127,110,0.12)',
  successBase:  '#6B7F6E',
  warningLight: 'rgba(184,154,90,0.15)',
  warningBase:  '#B89A5A',
  errorLight:   'rgba(192,85,79,0.12)',
  errorBase:    '#C0554F',
} as const;


export const colors = {
  // ── Light mode (default) ──────────────────────────────────────────────────
  light: {
    // Backgrounds
    bgBase:       palette.cream100,   // #FAF8F4 — screen background
    bgSurface:    'rgba(255,255,255,0.92)',  // cards / sheets
    bgSurfaceMid: 'rgba(255,255,255,0.75)',  // secondary cards
    bgSurfaceLow: 'rgba(255,255,255,0.50)',  // ghost elements
    bgTinted:     'rgba(107,127,110,0.06)',  // sage-tinted wash

    // Text
    textPrimary:   palette.ink800,    // #2B2B2B
    textSecondary: palette.ink500,    // #6B6B6B
    textTertiary:  palette.ink300,    // #A8ABA8
    textInverse:   palette.white,

    // Brand
    primary:       palette.sage500,   // #6B7F6E
    primaryDark:   palette.sage700,   // #3D5540
    primaryLight:  palette.sage200,   // #C2D4C4
    accent:        palette.gold500,   // #B89A5A
    accentLight:   palette.gold100,   // #F5EDD6

    // Borders
    borderHair:   'rgba(212,214,212,0.25)',
    borderLight:  'rgba(212,214,212,0.45)',
    borderMedium: 'rgba(212,214,212,0.70)',

    // Semantic
    success: palette.successBase,
    successBg: palette.successLight,
    warning: palette.warningBase,
    warningBg: palette.warningLight,
    error: palette.errorBase,
    errorBg: palette.errorLight,

    // Glucose status
    glucoseLow:  '#E05C5C',
    glucoseHigh: '#E09A3A',
    glucoseOk:   palette.sage500,

    // Shadow
    shadowColor: palette.ink900,
  },

  // ── Dark mode ─────────────────────────────────────────────────────────────
  dark: {
    bgBase:       '#161A17',
    bgSurface:    'rgba(30,36,30,0.94)',
    bgSurfaceMid: 'rgba(30,36,30,0.75)',
    bgSurfaceLow: 'rgba(30,36,30,0.50)',
    bgTinted:     'rgba(107,127,110,0.10)',

    textPrimary:   '#EBF0EB',
    textSecondary: '#9DA89D',
    textTertiary:  '#5C675C',
    textInverse:   palette.ink800,

    primary:       palette.sage400,
    primaryDark:   palette.sage300,
    primaryLight:  palette.sage800,
    accent:        palette.gold300,
    accentLight:   'rgba(217,190,122,0.15)',

    borderHair:   'rgba(107,127,110,0.15)',
    borderLight:  'rgba(107,127,110,0.25)',
    borderMedium: 'rgba(107,127,110,0.40)',

    success: palette.sage400,
    successBg: 'rgba(107,127,110,0.18)',
    warning: palette.gold300,
    warningBg: 'rgba(217,190,122,0.15)',
    error: '#D97070',
    errorBg: 'rgba(217,112,112,0.15)',

    glucoseLow:  '#E07070',
    glucoseHigh: '#D4974A',
    glucoseOk:   palette.sage400,

    shadowColor: '#000000',
  },
} as const;


// ─────────────────────────────────────────────────────────────────────────────
// 2. TYPOGRAPHY TOKENS
// ─────────────────────────────────────────────────────────────────────────────

export const typography = {
  // Font families
  // Heading: PlayfairDisplay (loaded via expo-google-fonts)
  // Body: matches system — use 'System' in RN which maps to SF Pro / Roboto
  fontHeading: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  fontBody:    'System',

  // Scale (px)
  size: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    '2xl': 28,
    '3xl': 34,
    '4xl': 44,
  },

  // Line heights (multiplier × size)
  leading: {
    tight:   1.2,
    snug:    1.35,
    normal:  1.5,
    relaxed: 1.65,
  },

  // Letter spacing
  tracking: {
    tighter: -0.5,
    tight:   -0.3,
    normal:   0,
    wide:     0.3,
    wider:    0.8,
    widest:   1.2,
  },

  // Font weights
  weight: {
    light:    '300' as const,
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
    black:    '800' as const,
  },

  // Composed text styles (use these directly in components)
  styles: {
    displayXL: {
      fontSize: 44,
      fontWeight: '300' as const,
      letterSpacing: -0.5,
      lineHeight: 50,
    },
    displayLG: {
      fontSize: 34,
      fontWeight: '300' as const,
      letterSpacing: -0.5,
      lineHeight: 40,
    },
    headingXL: {
      fontSize: 28,
      fontWeight: '600' as const,
      letterSpacing: -0.3,
      lineHeight: 34,
    },
    headingLG: {
      fontSize: 22,
      fontWeight: '600' as const,
      letterSpacing: -0.3,
      lineHeight: 28,
    },
    headingMD: {
      fontSize: 17,
      fontWeight: '600' as const,
      letterSpacing: 0.1,
      lineHeight: 22,
    },
    headingSM: {
      fontSize: 15,
      fontWeight: '600' as const,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    bodyLG: {
      fontSize: 17,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 26,
    },
    bodyMD: {
      fontSize: 15,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 22,
    },
    bodySM: {
      fontSize: 13,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 19,
    },
    label: {
      fontSize: 11,
      fontWeight: '600' as const,
      letterSpacing: 1.2,
      lineHeight: 16,
      textTransform: 'uppercase' as const,
    },
    caption: {
      fontSize: 11,
      fontWeight: '400' as const,
      letterSpacing: 0.3,
      lineHeight: 15,
    },
    numeric: {
      fontSize: 32,
      fontWeight: '300' as const,
      letterSpacing: -1,
      lineHeight: 38,
    },
  },
} as const;


// ─────────────────────────────────────────────────────────────────────────────
// 3. SPACING SYSTEM (8pt grid)
// ─────────────────────────────────────────────────────────────────────────────

export const spacing = {
  px:   1,
  '0':  0,
  '1':  4,    // 0.5 × 8
  '2':  8,
  '3':  12,
  '4':  16,
  '5':  20,
  '6':  24,
  '7':  28,
  '8':  32,
  '10': 40,
  '12': 48,
  '14': 56,
  '16': 64,
  '20': 80,
  '24': 96,
} as const;

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  '3xl': 32,
  full: 999,
} as const;


// ─────────────────────────────────────────────────────────────────────────────
// 4. EFFECT TOKENS
// ─────────────────────────────────────────────────────────────────────────────

export const effects = {
  // Glassmorphism surfaces
  glass: {
    low: {
      backgroundColor: 'rgba(255,255,255,0.50)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.60)',
      // Note: blur requires @react-native-community/blur
    },
    mid: {
      backgroundColor: 'rgba(255,255,255,0.75)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.70)',
    },
    high: {
      backgroundColor: 'rgba(255,255,255,0.92)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.85)',
    },
  },

  // Elevation / shadow system (5 levels)
  shadow: {
    none: {},
    xs: {
      shadowColor: palette.ink900,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    sm: {
      shadowColor: palette.ink900,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: palette.ink900,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      elevation: 3,
    },
    lg: {
      shadowColor: palette.ink900,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.10,
      shadowRadius: 20,
      elevation: 5,
    },
    xl: {
      shadowColor: palette.ink900,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.14,
      shadowRadius: 32,
      elevation: 8,
    },
  },

  // Soft glow (for active/focused states)
  glow: {
    sage: {
      shadowColor: palette.sage500,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 4,
    },
    gold: {
      shadowColor: palette.gold500,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.20,
      shadowRadius: 12,
      elevation: 4,
    },
  },
} as const;


// ─────────────────────────────────────────────────────────────────────────────
// 5. MOTION TOKENS
// ─────────────────────────────────────────────────────────────────────────────

export const motion = {
  duration: {
    instant:  80,   // tap feedback
    fast:     150,  // micro interactions
    normal:   250,  // most transitions
    slow:     400,  // card reveals, modals
    relaxed:  600,  // page transitions
  },

  // Easing curves for Animated.timing
  // "soft, natural — not snappy"
  easing: {
    // For enters: starts slow, eases in gently
    enter:    [0.0, 0.0, 0.2, 1.0] as [number,number,number,number],
    // For exits: quick start, gentle end
    exit:     [0.4, 0.0, 1.0, 1.0] as [number,number,number,number],
    // For movement: natural spring feel
    standard: [0.4, 0.0, 0.2, 1.0] as [number,number,number,number],
    // For emphasis: slight overshoot feel
    emphasis: [0.2, 0.0, 0.0, 1.0] as [number,number,number,number],
  },

  // Use cases reference
  useCases: {
    screenTransition: { duration: 350, easing: 'standard' },
    cardReveal:       { duration: 400, easing: 'enter'    },
    pressIn:          { duration: 80,  easing: 'exit'     },
    pressOut:         { duration: 150, easing: 'enter'    },
    modalSlideUp:     { duration: 400, easing: 'emphasis' },
    tabSwitch:        { duration: 200, easing: 'standard' },
  },
} as const;


// ─────────────────────────────────────────────────────────────────────────────
// 6. COMPONENT TOKENS (pre-composed styles)
// ─────────────────────────────────────────────────────────────────────────────

const c = colors.light;

export const components = {
  // ── Cards ─────────────────────────────────────────────────────────────────
  card: {
    base: {
      backgroundColor: c.bgSurface,
      borderRadius: radius.xl,
      padding: spacing['5'],
      borderWidth: 1,
      borderColor: c.borderHair,
      ...effects.shadow.md,
    },
    elevated: {
      backgroundColor: c.bgSurface,
      borderRadius: radius['2xl'],
      padding: spacing['6'],
      borderWidth: 1,
      borderColor: c.borderHair,
      ...effects.shadow.lg,
    },
    tinted: {
      backgroundColor: c.bgTinted,
      borderRadius: radius.xl,
      padding: spacing['5'],
      borderWidth: 1,
      borderColor: c.borderHair,
      ...effects.shadow.sm,
    },
    glass: {
      ...effects.glass.mid,
      borderRadius: radius.xl,
      padding: spacing['5'],
      ...effects.shadow.sm,
    },
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  button: {
    primary: {
      container: {
        backgroundColor: c.primary,
        borderRadius: radius.full,
        paddingVertical: spacing['4'],
        paddingHorizontal: spacing['6'],
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        flexDirection: 'row' as const,
        gap: spacing['2'],
        ...effects.shadow.md,
      },
      text: {
        ...typography.styles.headingSM,
        color: palette.white,
        letterSpacing: 0.3,
      },
      pressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
    },

    secondary: {
      container: {
        backgroundColor: c.bgSurfaceLow,
        borderRadius: radius.full,
        paddingVertical: spacing['4'],
        paddingHorizontal: spacing['6'],
        borderWidth: 1.5,
        borderColor: c.borderLight,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        flexDirection: 'row' as const,
        gap: spacing['2'],
      },
      text: {
        ...typography.styles.headingSM,
        color: c.textPrimary,
        letterSpacing: 0.3,
      },
      pressed: { opacity: 0.75 },
    },

    ghost: {
      container: {
        borderRadius: radius.full,
        paddingVertical: spacing['3'],
        paddingHorizontal: spacing['4'],
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      text: {
        ...typography.styles.bodySM,
        color: c.primary,
        fontWeight: '600' as const,
      },
      pressed: { opacity: 0.6 },
    },

    destructive: {
      container: {
        backgroundColor: c.errorBg,
        borderRadius: radius.full,
        paddingVertical: spacing['4'],
        paddingHorizontal: spacing['6'],
        borderWidth: 1,
        borderColor: 'rgba(192,85,79,0.2)',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      text: {
        ...typography.styles.headingSM,
        color: c.error,
        letterSpacing: 0.3,
      },
      pressed: { opacity: 0.75 },
    },
  },

  // ── Inputs ────────────────────────────────────────────────────────────────
  input: {
    base: {
      backgroundColor: c.bgSurface,
      borderRadius: radius.lg,
      paddingHorizontal: spacing['4'],
      paddingVertical: Platform.OS === 'ios' ? spacing['4'] : spacing['3'],
      borderWidth: 1,
      borderColor: c.borderLight,
      ...typography.styles.bodyMD,
      color: c.textPrimary,
    },
    focused: {
      borderColor: c.primary,
      ...effects.glow.sage,
    },
    label: {
      ...typography.styles.label,
      color: c.textSecondary,
      marginBottom: spacing['2'],
    },
    placeholder: c.textTertiary,
  },

  // ── Section header ────────────────────────────────────────────────────────
  sectionHeader: {
    ...typography.styles.label,
    color: c.textTertiary,
    marginBottom: spacing['3'],
  },

  // ── Chip / tag ────────────────────────────────────────────────────────────
  chip: {
    base: {
      paddingVertical: spacing['2'],
      paddingHorizontal: spacing['3'],
      borderRadius: radius.full,
      borderWidth: 1.5,
      borderColor: c.borderLight,
      backgroundColor: c.bgSurfaceLow,
    },
    active: {
      backgroundColor: 'rgba(107,127,110,0.12)',
      borderColor: c.primary,
    },
    text: {
      ...typography.styles.bodySM,
      fontWeight: '500' as const,
      color: c.textSecondary,
    },
    textActive: {
      color: c.primaryDark,
      fontWeight: '600' as const,
    },
  },

  // ── Badge ─────────────────────────────────────────────────────────────────
  badge: {
    success: {
      container: {
        backgroundColor: c.successBg,
        borderRadius: radius.full,
        paddingHorizontal: spacing['3'],
        paddingVertical: spacing['1'],
      },
      text: {
        ...typography.styles.caption,
        color: c.success,
        fontWeight: '700' as const,
        letterSpacing: 0.8,
      },
    },
    warning: {
      container: {
        backgroundColor: c.warningBg,
        borderRadius: radius.full,
        paddingHorizontal: spacing['3'],
        paddingVertical: spacing['1'],
      },
      text: {
        ...typography.styles.caption,
        color: c.warning,
        fontWeight: '700' as const,
        letterSpacing: 0.8,
      },
    },
    error: {
      container: {
        backgroundColor: c.errorBg,
        borderRadius: radius.full,
        paddingHorizontal: spacing['3'],
        paddingVertical: spacing['1'],
      },
      text: {
        ...typography.styles.caption,
        color: c.error,
        fontWeight: '700' as const,
        letterSpacing: 0.8,
      },
    },
  },
} as const;


// ─────────────────────────────────────────────────────────────────────────────
// 7. MASTER THEME EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const theme = {
  palette,
  colors,
  typography,
  spacing,
  radius,
  effects,
  motion,
  components,
} as const;

export type Theme = typeof theme;
export type ColorMode = 'light' | 'dark';
export default theme;