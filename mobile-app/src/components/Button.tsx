// mobile-app/src/components/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import { buttonStyles } from '../theme/buttons';

type ButtonVariant = 'primary' | 'secondary' | 'text';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
  icon,
}) => {
  // Map 'text' variant to 'textLink' in buttonStyles
  const styleKey = variant === 'text' ? 'textLink' : variant;
  const styles = buttonStyles[styleKey];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        // Only apply container styles if they exist (textLink doesn't have container)
        'container' in styles ? styles.container : undefined,
        disabled && { opacity: 0.5 },
        style,
      ]}
      activeOpacity={0.8}
    >
      {icon}
      <Text style={[styles.text, textStyle]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};