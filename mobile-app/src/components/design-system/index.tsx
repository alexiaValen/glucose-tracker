// mobile-app/src/components/design-system/index.tsx
// GraceFlow Design System — Sample Components
// Card · Button · SessionBlock
// All styling drawn from graceflow.ts tokens — no hardcoded values

import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing, radius, effects, motion, components } from '../../theme/graceflow';

const c = colors.light;

// ─────────────────────────────────────────────────────────────────────────────
// PRESSABLE — base for all interactive components
// Handles the soft press animation (scale + opacity)
// ─────────────────────────────────────────────────────────────────────────────

interface PressableProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
}

export function Pressable({ onPress, children, style, disabled }: PressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scale,   { toValue: 0.97, duration: motion.duration.instant, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.85, duration: motion.duration.instant, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scale,   { toValue: 1, duration: motion.duration.fast, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: motion.duration.fast, useNativeDriver: true }),
    ]).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
    >
      <Animated.View style={[style, { transform: [{ scale }], opacity }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// CARD
// Variants: base · elevated · tinted · glass
// ─────────────────────────────────────────────────────────────────────────────

type CardVariant = 'base' | 'elevated' | 'tinted' | 'glass';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  onPress?: () => void;
  label?: string;       // optional ALL-CAPS eyebrow label
  action?: string;      // optional right-aligned action text
  onAction?: () => void;
}

export function Card({
  children,
  variant = 'base',
  style,
  onPress,
  label,
  action,
  onAction,
}: CardProps) {
  const cardStyle = components.card[variant];

  const inner = (
    <View style={[cardStyle, style]}>
      {(label || action) && (
        <View style={cardStyles.header}>
          {label && <Text style={cardStyles.label}>{label}</Text>}
          {action && onAction && (
            <TouchableOpacity onPress={onAction}>
              <Text style={cardStyles.action}>{action}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {children}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{inner}</Pressable>;
  }

  return inner;
}

const cardStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['3'],
  },
  label: {
    ...components.sectionHeader,
  },
  action: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: c.textTertiary,
    letterSpacing: typography.tracking.wide,
  },
});


// ─────────────────────────────────────────────────────────────────────────────
// BUTTON
// Variants: primary · secondary · ghost · destructive
// Sizes: sm · md · lg
// ─────────────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const buttonSizeMap = {
  sm: { paddingVertical: spacing['2'], paddingHorizontal: spacing['4'], fontSize: typography.size.sm },
  md: { paddingVertical: spacing['4'], paddingHorizontal: spacing['6'], fontSize: typography.size.base },
  lg: { paddingVertical: spacing['5'], paddingHorizontal: spacing['7'], fontSize: typography.size.md },
};

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  icon,
  style,
}: ButtonProps) {
  const token = components.button[variant];
  const sizeToken = buttonSizeMap[size];

  const containerStyle = [
  token.container as ViewStyle,
  {
    paddingVertical: sizeToken.paddingVertical,
    paddingHorizontal: sizeToken.paddingHorizontal,
  },
  fullWidth ? { alignSelf: 'stretch' as const } : null,
  disabled ? buttonStyles.disabled : null,
  style,
].filter(Boolean) as ViewStyle[];

  const textStyle: TextStyle = {
    ...(token.text as TextStyle),
    fontSize: sizeToken.fontSize,
  };

  return (
    <Pressable onPress={onPress} style={containerStyle} disabled={disabled}>
      {icon && <View style={buttonStyles.icon}>{icon}</View>}
      <Text style={textStyle}>{children}</Text>
    </Pressable>
  );
}

const buttonStyles = StyleSheet.create({
  disabled: { opacity: 0.45 },
  icon: { marginRight: spacing['2'] },
});


// ─────────────────────────────────────────────────────────────────────────────
// SESSION BLOCK
// Used in program/lesson lists — week number, title, status, tap to open
// ─────────────────────────────────────────────────────────────────────────────

type SessionStatus = 'locked' | 'available' | 'active' | 'completed';

interface SessionBlockProps {
  weekNumber: number;
  title: string;
  subtitle?: string;
  status: SessionStatus;
  onPress?: () => void;
}

const SESSION_STATUS_CONFIG: Record<SessionStatus, {
  iconEmoji:    string;
  iconBg:       string;
  eyebrowColor: string;
  opacity:      number;
  showArrow:    boolean;
}> = {
  locked: {
    iconEmoji:    '🔒',
    iconBg:       'rgba(42,45,42,0.05)',
    eyebrowColor: c.textTertiary,
    opacity:      0.55,
    showArrow:    false,
  },
  available: {
    iconEmoji:    '🪷',
    iconBg:       'rgba(107,127,110,0.10)',
    eyebrowColor: 'rgba(107,127,110,0.7)',
    opacity:      1,
    showArrow:    true,
  },
  active: {
    iconEmoji:    '✨',
    iconBg:       'rgba(107,127,110,0.14)',
    eyebrowColor: c.primary,
    opacity:      1,
    showArrow:    true,
  },
  completed: {
    iconEmoji:    '✓',
    iconBg:       'rgba(107,127,110,0.18)',
    eyebrowColor: c.primary,
    opacity:      1,
    showArrow:    false,
  },
};

export function SessionBlock({
  weekNumber,
  title,
  subtitle,
  status,
  onPress,
}: SessionBlockProps) {
  const cfg = SESSION_STATUS_CONFIG[status];
  const isInteractive = status !== 'locked' && !!onPress;

  const inner = (
    <View style={[sessionStyles.container, { opacity: cfg.opacity }]}>
      {/* Icon */}
      <View style={[sessionStyles.icon, { backgroundColor: cfg.iconBg }]}>
        <Text style={[
          sessionStyles.iconText,
          status === 'completed' && sessionStyles.iconTextCompleted,
        ]}>
          {cfg.iconEmoji}
        </Text>
      </View>

      {/* Content */}
      <View style={sessionStyles.content}>
        <View style={sessionStyles.eyebrowRow}>
          <Text style={[sessionStyles.eyebrow, { color: cfg.eyebrowColor }]}>
            WEEK {weekNumber}
          </Text>
          {status === 'completed' && (
            <View style={sessionStyles.completedBadge}>
              <Text style={sessionStyles.completedBadgeText}>DONE</Text>
            </View>
          )}
          {status === 'active' && (
            <View style={sessionStyles.activeBadge}>
              <Text style={sessionStyles.activeBadgeText}>CONTINUE</Text>
            </View>
          )}
        </View>
        <Text style={sessionStyles.title} numberOfLines={2}>{title}</Text>
        {subtitle && (
          <Text style={sessionStyles.subtitle} numberOfLines={1}>{subtitle}</Text>
        )}
      </View>

      {/* Arrow */}
      {cfg.showArrow && (
        <Text style={sessionStyles.arrow}>→</Text>
      )}
    </View>
  );

  if (isInteractive) {
    return (
      <Pressable onPress={onPress!} style={sessionStyles.wrapper}>
        {inner}
      </Pressable>
    );
  }

  return <View style={sessionStyles.wrapper}>{inner}</View>;
}

const sessionStyles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing['3'],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.bgSurface,
    borderRadius: radius.xl,
    padding: spacing['4'],
    borderWidth: 1,
    borderColor: c.borderHair,
    ...effects.shadow.sm,
    gap: spacing['4'],
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 26,
  },
  iconTextCompleted: {
    fontSize: 22,
    color: c.primary,
    fontWeight: typography.weight.bold,
  },
  content: {
    flex: 1,
    gap: spacing['1'],
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  eyebrow: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: typography.tracking.widest,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: c.textPrimary,
    letterSpacing: typography.tracking.normal,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: c.textSecondary,
    lineHeight: 18,
  },
  completedBadge: {
    backgroundColor: c.successBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing['2'],
    paddingVertical: 2,
  },
  completedBadgeText: {
    fontSize: 9,
    fontWeight: typography.weight.bold,
    letterSpacing: typography.tracking.wider,
    color: c.success,
  },
  activeBadge: {
    backgroundColor: 'rgba(107,127,110,0.12)',
    borderRadius: radius.full,
    paddingHorizontal: spacing['2'],
    paddingVertical: 2,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: typography.weight.bold,
    letterSpacing: typography.tracking.wider,
    color: c.primary,
  },
  arrow: {
    fontSize: typography.size.lg,
    color: c.primary,
    flexShrink: 0,
  },
});


// ─────────────────────────────────────────────────────────────────────────────
// USAGE EXAMPLES (for reference — not rendered)
// ─────────────────────────────────────────────────────────────────────────────

/*
// Card variants:
<Card label="GLUCOSE OVERVIEW" action="See all" onAction={() => {}}>
  <Text>95 mg/dL</Text>
</Card>

<Card variant="elevated" onPress={() => navigation.navigate('SessionDetail')}>
  <Text>Week 1 — Holy</Text>
</Card>

<Card variant="tinted" label="TODAY'S RHYTHM">
  <Text>Radiant phase</Text>
</Card>


// Button variants:
<Button onPress={handleLog} size="lg" fullWidth>
  Log glucose
</Button>

<Button variant="secondary" onPress={handleSymptom}>
  Log symptoms
</Button>

<Button variant="ghost" onPress={handleCancel}>
  Cancel
</Button>

<Button variant="destructive" onPress={handleLogout}>
  Log out
</Button>


// Session blocks:
<SessionBlock
  weekNumber={1}
  title="Holy — Set Apart by Christ"
  subtitle="Identity & purpose in the body"
  status="active"
  onPress={() => navigation.navigate('SessionDetail', { sessionId: '1' })}
/>

<SessionBlock
  weekNumber={2}
  title="Renew — The Follicular Season"
  status="locked"
/>

<SessionBlock
  weekNumber={0}
  title="Introduction"
  subtitle="Welcome to the program"
  status="completed"
/>
*/