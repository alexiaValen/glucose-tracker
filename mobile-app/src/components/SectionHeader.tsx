import React from 'react';
import { Text, TextStyle } from 'react-native';
import { typography } from '../theme';

interface SectionHeaderProps {
  children: string;
  style?: TextStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  children,
  style,
}) => {
  return (
    <Text style={[typography.sectionHeader, style]}>
      {children}
    </Text>
  );
};