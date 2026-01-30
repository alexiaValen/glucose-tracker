// mobile-app/src/components/BotanicalBackground.tsx
import React from 'react';
import { StyleSheet, View, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

interface BotanicalBackgroundProps {
  children: React.ReactNode;
  variant?: 'green' | '3d' | 'subtle' | 'none';
  intensity?: 'light' | 'medium' | 'strong';
}

export const BotanicalBackground: React.FC<BotanicalBackgroundProps> = ({ 
  children, 
  variant = 'green',
  intensity = 'light'
}) => {
  // Choose gradient colors based on variant and intensity
  const getGradientColors = (): readonly [string, string, string] => {
    // Subtle variant - for clinical-calm with texture
    if (variant === 'subtle') {
      switch (intensity) {
        case 'light':
          return [
            'rgba(255,255,255,0.97)',  // Almost white - very opaque
            'rgba(250,248,244,0.95)',  // Cream
            'rgba(245,244,240,0.93)',  // Cream
          ] as const;
        case 'medium':
          return [
            'rgba(255,255,255,0.92)',  // White
            'rgba(250,248,244,0.88)',  // Cream
            'rgba(240,245,241,0.85)',  // Very pale green
          ] as const;
        case 'strong':
          return [
            'rgba(250,248,244,0.85)',  // Cream
            'rgba(240,245,241,0.80)',  // Pale green
            'rgba(232,237,233,0.75)',  // Light green
          ] as const;
        default:
          return [
            'rgba(255,255,255,0.97)',
            'rgba(250,248,244,0.95)',
            'rgba(245,244,240,0.93)',
          ] as const;
      }
    }

    // 3D variant
    if (variant === '3d') {
      switch (intensity) {
        case 'light':
          return [
            'rgba(245,244,240,0.95)',  // cream - very opaque
            'rgba(235,240,235,0.90)',  // pale green
            'rgba(232,237,233,0.85)',  // pale green
          ] as const;
        case 'medium':
          return [
            'rgba(245,244,240,0.85)',  // cream
            'rgba(232,237,233,0.75)',  // pale green
            'rgba(220,230,222,0.70)',  // light green
          ] as const;
        case 'strong':
          return [
            'rgba(245,244,240,0.75)',  // cream
            'rgba(232,237,233,0.65)',  // pale green
            'rgba(200,215,205,0.60)',  // medium green
          ] as const;
        default:
          return [
            'rgba(245,244,240,0.95)',
            'rgba(232,237,233,0.90)',
            'rgba(232,237,233,0.85)',
          ] as const;
      }
    }

    // Green variant
    switch (intensity) {
      case 'light':
        return [
          'rgba(250,248,244,0.98)',  // cream - very opaque
          'rgba(240,245,241,0.95)',  // very pale green
          'rgba(235,240,237,0.92)',  // very pale green
        ] as const;
      case 'medium':
        return [
          'rgba(245,244,240,0.90)',  // cream
          'rgba(232,237,233,0.80)',  // pale green
          'rgba(225,235,228,0.75)',  // pale green
        ] as const;
      case 'strong':
        return [
          'rgba(245,244,240,0.80)',  // cream
          'rgba(225,235,228,0.70)',  // light green
          'rgba(200,220,210,0.65)',  // medium green
        ] as const;
      default:
        return [
          'rgba(250,248,244,0.98)',
          'rgba(240,245,241,0.95)',
          'rgba(235,240,237,0.92)',
        ] as const;
    }
  };

  // For 'none' variant, just use solid color
  if (variant === 'none') {
    return (
      <View style={[styles.container, { backgroundColor: colors.cream }]}>
        {children}
      </View>
    );
  }

  // Use image background with subtle overlay for clinical-calm aesthetic
  if (variant === 'subtle' || variant === '3d') {
    return (
      <View style={styles.container}>
        {/* Botanical image background */}
        <ImageBackground
          source={require('../components/bg/botanical-green.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          {/* Gradient overlay to maintain clinical-calm aesthetic */}
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
        
        {/* Content */}
        {children}
      </View>
    );
  }

  // Default green gradient (no image)
  return (
    <View style={styles.container}>
      {/* Base botanical color */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#E8EDE9' }]} />
      
      {/* Gradient overlay */}
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});