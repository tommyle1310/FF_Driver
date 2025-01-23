import { useTheme } from '@/src/hooks/useTheme';
import React from 'react';
import { Text, TextStyle } from 'react-native';

interface FFTextProps {
  children: React.ReactNode;
  className?: string; // Optional Tailwind-like classes
  style?: TextStyle;  // Optional style prop for custom styles
}

const FFText: React.FC<FFTextProps> = ({ children, style }) => {
  const { theme } = useTheme();

  // Define text colors for light and dark theme
  const textColor: string = theme === 'light' ? '#000' : '#fff'; // Default text color

  // Combine styles with optional custom styles
  const combinedStyle: TextStyle = {
    color: textColor, // Apply theme-based color
    fontSize: 16,      // Default font size
    fontWeight: '600' as TextStyle['fontWeight'], // Cast to valid fontWeight type
    gap: 20,
    ...style,         // Merge custom style if provided
  };

  return (
    <Text style={{...combinedStyle}}>
      {children}
    </Text>
  );
};

export default FFText;
