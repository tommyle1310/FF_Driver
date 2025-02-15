import { useTheme } from "@/src/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, Text, View, ViewStyle, TextStyle } from "react-native";

const FFButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  isLinear?: boolean;
  textClassName?: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger"; // Added variant prop
  style?: ViewStyle; // Optional style prop for custom styles
}> = ({
  children,
  className,
  isLinear = true, // Default to linear gradient for all variants
  textClassName,
  onPress = () => {},
  variant = "primary", // Default to "primary" variant
  style, // Optional style prop for custom styles
}) => {
  const { theme } = useTheme();

  // State to handle the press effect
  const [pressed, setPressed] = useState(false);

  // Define gradient colors for the light and dark theme
  const gradientColors: readonly [string, string] =
    theme === "light"
      ? ["#63c550", "#a3d98f"] // Light theme gradient with a softer lighter green
      : ["#63c550", "#4a9e3e"]; // Dark theme gradient

  // Darker color versions for the pressed effect (optional)
  const darkenedGradientColors: readonly [string, string] =
    theme === "light"
      ? ["#4d9c39", "#7dbf72"] // Darkened light theme gradient (slightly more muted)
      : ["#4c9f3a", "#3e7c2a"]; // Darkened dark theme gradient (deeper green for contrast)

  // Color schemes for other variants (using gradients for all)
  const variantStyles = {
    primary: {
      gradientStart: pressed ? darkenedGradientColors[0] : gradientColors[0],
      gradientEnd: pressed ? darkenedGradientColors[1] : gradientColors[1],
      textColor: "white",
    },
    secondary: {
      gradientStart: pressed ? "#7fa9e7" : "#a3c9f1", // Lighter blue gradient
      gradientEnd: pressed ? "#4c8ecf" : "#7fa9e7", // Darker blue gradient
      textColor: "#333", // Dark text for secondary button
    },
    outline: {
      gradientStart: pressed ? "#e2e2e2" : "#f3f3f3", // Light gray gradient
      gradientEnd: pressed ? "#cccccc" : "#e2e2e2", // Slightly darker gray gradient
      textColor: "#333", // Dark text for outline button
    },
    danger: {
      gradientStart: pressed ? "#800000" : "#d21f3c", // Red gradient for danger
      gradientEnd: pressed ? "#e60000" : "#ff4343", // Darker red gradient
      textColor: "white",
    },
  };

  const { gradientStart, gradientEnd, textColor } = variantStyles[variant];

  const renderChildren = () => {
    // Check if children is a string, if so, wrap it with a Text component
    if (typeof children === "string") {
      return (
        <Text
          style={[
            { color: textColor, fontSize: 16, fontWeight: "600" },
            textClassName as any, // NativeWind will handle the className for styles
          ]}
        >
          {children}
        </Text>
      );
    }

    // If children is a ReactNode (not a string), return it as is
    return children;
  };

  return (
    <Pressable
      onPressIn={() => setPressed(true)} // When press starts
      onPressOut={() => {
        setPressed(false);
        onPress();
      }} // When press ends
      style={[
        {
          transform: [{ scale: pressed ? 0.95 : 1 }], // Apply scaling when pressed
          justifyContent: "center",
          alignItems: "center",
        },
        style, // Merge any custom style provided
      ]}
    >
      <LinearGradient
        colors={[gradientStart, gradientEnd]} // Always use a gradient
        start={[0, 0]}
        end={[1, 0]}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 8,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
        }}
        className={className} // Preserve the className prop for tailwind-like classes
      >
        {renderChildren()}
      </LinearGradient>
    </Pressable>
  );
};

export default FFButton;
