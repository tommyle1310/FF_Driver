import { useTheme } from "@/src/hooks/useTheme";
import React from "react";
import { View, ViewStyle } from "react-native";

interface FFViewProps {
  children: React.ReactNode;
  style?: ViewStyle; // Optional style prop for custom styles
  colorDark?: string; // Optional background color for dark theme
  colorLight?: string; // Optional background color for light theme
}

const FFView: React.FC<FFViewProps> = ({
  children,
  style,
  colorDark = "#333", // Default dark background color
  colorLight = "#fff", // Default light background color
}) => {
  const { theme } = useTheme();

  // Define background color based on the theme
  const backgroundColor = theme === "light" ? colorLight : colorDark;

  // Combine styles with optional custom styles
  const combinedStyle: ViewStyle = {
    backgroundColor, // Apply theme-based or custom background color
    ...style, // Merge custom style if provided
  };

  return <View style={combinedStyle}>{children}</View>;
};

export default FFView;