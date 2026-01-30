import React from 'react';
import { View, ViewStyle } from 'react-native';
import { cardStyles } from '../theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'standard' | 'accent';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'standard',
  style,
}) => {
  return (
    <View style={[cardStyles[variant], style]}>
      {children}
    </View>
  );
};