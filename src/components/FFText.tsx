import { useTheme } from "@/src/hooks/useTheme";
import React from "react";
import { Text, TextStyle } from "react-native";

interface FFTextProps {
  children: React.ReactNode;
  className?: string; // Optional Tailwind-like classes
  style?: TextStyle; // Optional style prop for custom styles
  fontSize?: "sm" | "md" | "lg"; // Optional font size prop
  colorDark?: string; // Optional color for dark theme
  colorLight?: string; // Optional color for light theme
  fontWeight?:
    | "light"
    | "regular"
    | "bold"
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900"; // Optional font weight
}

const FFText: React.FC<FFTextProps> = ({
  children,
  style,
  fontSize = "md",
  colorDark,
  colorLight,
  fontWeight = "600", // Default to "600" (semi-bold)
}) => {
  const { theme } = useTheme();

  // Define font size based on the fontSize prop
  const fontSizeMap = {
    sm: 12,
    md: 16,
    lg: 18,
  };

  const fontSizeValue = fontSizeMap[fontSize]; // Get font size from map

  // Define text colors for light and dark theme
  const defaultColor =
    theme === "light" ? colorLight || "#000" : colorDark || "#fff";

  // Combine styles with optional custom styles
  const combinedStyle: TextStyle = {
    color: defaultColor, // Apply theme-based or custom color
    fontSize: fontSizeValue, // Apply custom font size
    fontWeight, // Apply custom font weight
    gap: 20,
    ...style, // Merge custom style if provided
  };

  return <Text style={combinedStyle}>{children}</Text>;
};

export default FFText;
