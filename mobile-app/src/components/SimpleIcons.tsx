// mobile-app/src/components/SimpleIcons.tsx
// Temporary simple icon replacements (no SVG dependency)
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  muted?: string;
}

export const SignalRingThin: React.FC<IconProps> = ({ size = 24, muted = '#CFC9BF' }) => (
  <View style={[styles.ring, { width: size, height: size, borderColor: muted }]} />
);

export const AxisMarker: React.FC<IconProps> = ({ size = 24, color = '#FFFFFF' }) => (
  <View style={[styles.axis, { width: size, height: size }]}>
    <View style={[styles.axisDot, { backgroundColor: color }]} />
  </View>
);

export const SeverityContinuum: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#2B2B2B',
  muted = '#CFC9BF' 
}) => (
  <View style={[styles.continuum, { width: size, height: size }]}>
    <View style={[styles.bar, styles.bar1, { backgroundColor: muted }]} />
    <View style={[styles.bar, styles.bar2, { backgroundColor: muted }]} />
    <View style={[styles.bar, styles.bar3, { backgroundColor: color }]} />
  </View>
);

const styles = StyleSheet.create({
  ring: {
    borderRadius: 999,
    borderWidth: 2,
  },
  axis: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  axisDot: {
    width: '30%',
    height: '30%',
    borderRadius: 999,
  },
  continuum: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: '10%',
  },
  bar: {
    width: '20%',
    borderRadius: 2,
  },
  bar1: {
    height: '40%',
    opacity: 0.6,
  },
  bar2: {
    height: '70%',
    opacity: 0.8,
  },
  bar3: {
    height: '100%',
  },
});