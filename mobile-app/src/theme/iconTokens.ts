export const iconTokens = {
  colors: {
    ink: '#2B2B2B',
    muted: '#CFC9BF',
    accent: '#B89A5A',
  },
  strokes: {
    thin: 1.5,
    thick: 2.5,
  },
  sizes: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
  },
};

export type IconSize = keyof typeof iconTokens.sizes;