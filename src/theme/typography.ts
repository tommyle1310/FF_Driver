export const typography = {
  // Font families
  fontFamily: {
    regular: "System",
    medium: "System",
    bold: "System",
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // Font weights
  fontWeight: {
    regular: "400",
    medium: "500",
    bold: "700",
  },

  // Line heights
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 40,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

export type Typography = typeof typography;
export default typography;
