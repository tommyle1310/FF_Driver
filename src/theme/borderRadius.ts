export const borderRadius = {
  // Base border radius values
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,

  // Specific component border radius
  button: 8,
  input: 8,
  card: 12,
  modal: 16,
  avatar: 9999,
  badge: 9999,
};

export type BorderRadius = typeof borderRadius;
export default borderRadius;
