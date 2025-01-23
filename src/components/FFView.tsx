import { View, ViewStyle } from "react-native";
import React from "react";
import { useTheme } from "../hooks/useTheme";

interface FFViewProps {
  children?: React.ReactNode;
  style?: ViewStyle;  // Only `style` prop to control the styles
}

const FFView = ({ children, style }: FFViewProps) => {
  const { theme } = useTheme();

  // Merge passed styles with the default styles
  const containerStyle = {
    backgroundColor: theme === "light" ? '#eee' : "#1e1e1e", // Background color based on the theme
    borderColor: theme === "light" ? 'transparent' : '#ccc',  // Border color based on the theme
    borderWidth: 1,  // Apply border width
    flex: 1,  // Ensure the container takes up full available space
    ...style,  // Custom styles passed via `style` prop will override defaults
  };

  return <View style={containerStyle}>{children}</View>;
};

export default FFView;
