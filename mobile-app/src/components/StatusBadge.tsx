import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';

interface StatusBadgeProps {
  label: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  showDot = true,
}) => {
  return (
    <View style={styles.container}>
      {showDot && <View style={styles.dot} />}
      <Text style={typography.sectionHeader}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
});