// // mobile-app/src/components/BotanicalBackground.tsx
// import React from 'react';
// import { ImageBackground, StyleSheet, View } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { colors } from '../theme/colors';

// interface BotanicalBackgroundProps {
//   children: React.ReactNode;
//   variant?: 'green' | '3d' | 'none';
//   intensity?: 'light' | 'medium' | 'strong';
// }

// export const BotanicalBackground: React.FC<BotanicalBackgroundProps> = ({ 
//   children, 
//   variant = 'green',
//   intensity = 'light'
// }) => {
//   // Choose background image
//   const getBackgroundImage = () => {
//     switch (variant) {
//       case 'green':
//         return require('../assets/bg/botanical-green.png');
//       case '3d':
//         return require('../assets/bg/botanical-3d.png');
//       case 'none':
//         return null;
//       default:
//         return require('../assets/bg/botanical-green.png');
//     }
//   };

//   // Choose gradient overlay based on intensity
//   const getGradientColors = (): readonly [string, string, string] => {
//     switch (intensity) {
//       case 'light':
//         return [
//           'rgba(245,244,240,0.90)',  // cream - very opaque
//           'rgba(232,237,233,0.85)',  // pale green
//           'rgba(232,237,233,0.80)',  // pale green
//         ] as const;
//       case 'medium':
//         return [
//           'rgba(245,244,240,0.80)',  // cream
//           'rgba(232,237,233,0.70)',  // pale green
//           'rgba(232,237,233,0.65)',  // pale green
//         ] as const;
//       case 'strong':
//         return [
//           'rgba(245,244,240,0.70)',  // cream
//           'rgba(232,237,233,0.60)',  // pale green
//           'rgba(140,155,142,0.40)',  // light sage - show more texture
//         ] as const;
//       default:
//         return [
//           'rgba(245,244,240,0.90)',
//           'rgba(232,237,233,0.85)',
//           'rgba(232,237,233,0.80)',
//         ] as const;
//     }
//   };

//   const backgroundImage = getBackgroundImage();

//   if (variant === 'none' || !backgroundImage) {
//     return (
//       <View style={[styles.container, { backgroundColor: colors.cream }]}>
//         {children}
//       </View>
//     );
//   }

//   return (
//     <ImageBackground
//       source={backgroundImage}
//       resizeMode="cover"
//       style={styles.container}
//     >
//       <LinearGradient
//         colors={getGradientColors()}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 0, y: 1 }}
//         style={StyleSheet.absoluteFill}
//       />
//       {children}
//     </ImageBackground>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// });

// mobile-app/src/components/BotanicalBackground.tsx
import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

interface BotanicalBackgroundProps {
  children: React.ReactNode;
  variant?: 'green' | '3d' | 'none';
  intensity?: 'light' | 'medium' | 'strong';
}

export const BotanicalBackground: React.FC<BotanicalBackgroundProps> = ({ 
  children, 
  variant = 'green',
  intensity = 'light'
}) => {
  // Choose background image
  const getBackgroundImage = () => {
    switch (variant) {
      case 'green':
        return require('../assets/bg/botanical-green.png');
      case '3d':
        return require('../assets/bg/botanical-3d.png');
      case 'none':
        return null;
      default:
        return require('../assets/bg/botanical-green.png');
    }
  };

  // Choose gradient overlay based on intensity
  const getGradientColors = (): readonly [string, string, string] => {
    switch (intensity) {
      case 'light':
        return [
          'rgba(245,244,240,0.90)',  // cream - very opaque
          'rgba(232,237,233,0.85)',  // pale green
          'rgba(232,237,233,0.80)',  // pale green
        ] as const;
      case 'medium':
        return [
          'rgba(245,244,240,0.80)',  // cream
          'rgba(232,237,233,0.70)',  // pale green
          'rgba(232,237,233,0.65)',  // pale green
        ] as const;
      case 'strong':
        return [
          'rgba(245,244,240,0.70)',  // cream
          'rgba(232,237,233,0.60)',  // pale green
          'rgba(140,155,142,0.40)',  // light sage - show more texture
        ] as const;
      default:
        return [
          'rgba(245,244,240,0.90)',
          'rgba(232,237,233,0.85)',
          'rgba(232,237,233,0.80)',
        ] as const;
    }
  };

  const backgroundImage = getBackgroundImage();

  if (variant === 'none' || !backgroundImage) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cream }]}>
        {children}
      </View>
    );
  }

  return (
    <ImageBackground
      source={backgroundImage}
      resizeMode="cover"
      style={styles.container}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});