// mobile-app/src/components/GradientBackground.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

interface Props {
  children: React.ReactNode;
  variant?: 'default' | 'light' | 'dark';
}

export const GradientBackground: React.FC<Props> = ({ children, variant = 'default' }) => {
  const getGradientColors = () => {
    switch (variant) {
      case 'light':
        return [colors.white, colors.cream, colors.paleGreen] as const;
      case 'dark':
        return [colors.lightSage, colors.sage, colors.forestGreen] as const;
      default:
        return [colors.cream, colors.paleGreen, colors.lightSage] as const;
    }
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      style={styles.gradient}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});