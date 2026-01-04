// mobile-app/src/theme/colors.ts
// Updated color palette based on GraceFlow app icon

export const colors = {
  // Primary colors from icon
  forestGreen: '#3D5540',      // Dark sage/forest - primary brand color
  sage: '#6B7F6E',             // Medium sage - secondary brand color  
  lightSage: '#8C9B8E',        // Light sage - tertiary
  goldLeaf: '#B8A45F',         // Golden accent from leaf
  
  // Neutrals
  charcoal: '#2A2D2A',         // Almost black - primary text
  darkGray: '#4A4D4A',         // Dark gray - secondary text
  mediumGray: '#6B6B6B',       // Medium gray
  lightGray: '#A8ABA8',        // Light gray
  
  // Backgrounds
  cream: '#F5F4F0',            // Off-white cream - main background
  white: '#FFFFFF',            // Pure white - cards
  paleGreen: '#E8EDE9',        // Very light sage - subtle backgrounds
  
  // Semantic colors
  success: '#6B7F6E',          // Use sage for success
  warning: '#B8A45F',          // Use gold for warnings
  error: '#C85A54',            // Muted red
  info: '#7A92A8',             // Muted blue
  
  // Glucose/severity indicators
  red: '#C85A54',              // Low glucose / high severity
  yellow: '#D4A76F',           // Warning / moderate
  green: '#6B7F6E',            // Good / mild (use sage)
  
  // Text colors
  textDark: '#2A2D2A',         // Primary text
  textMedium: '#4A4D4A',       // Secondary text
  textLight: '#6B6B6B',        // Tertiary text
  textMuted: '#A8ABA8',        // Disabled/muted text
  
  // UI elements
  border: '#D4D6D4',           // Borders
  borderLight: '#E8EDE9',      // Light borders
  shadow: '#2A2D2A',           // Shadows
  
  // Accent colors (for variety)
  accentPeach: '#C9A58A',      // Soft peach (for cycle tracking)
  accentBlue: '#7A92A8',       // Soft blue (for glucose)
};

// Usage example:
// import { colors } from '../theme/colors';
// backgroundColor: colors.forestGreen