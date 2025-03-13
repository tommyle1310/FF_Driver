import { useTheme } from "@/src/hooks/useTheme";
import React from "react";
import { Pressable, View, ViewStyle } from "react-native";

interface FFViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  colorDark?: string; // Optional background color for dark theme
  colorLight?: string; // Optional background color for light theme
  onPress?: () => void;
}

const FFView: React.FC<FFViewProps> = ({
  children,
  style,
  colorDark = "#333", // Default dark background color
  colorLight = "#fff", // Default light background color,
  onPress = () => {},
}) => {
  const { theme } = useTheme();

  // Use the passed backgroundColor if provided
  let backgroundColor = style?.backgroundColor;

  // If backgroundColor is undefined, fallback to the theme-based color
  if (backgroundColor === undefined) {
    backgroundColor = theme === "light" ? colorLight : colorDark;
  }

  // Combine styles with optional custom styles
  const combinedStyle: ViewStyle = {
    ...style, // First, include all the other styles
    backgroundColor, // Then apply backgroundColor last to ensure it's not overwritten
  };

  return (
    <Pressable onPress={onPress} style={combinedStyle}>
      {children}
    </Pressable>
  );
};

export default FFView;
