import { View, Text, StatusBar } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";

const FFSafeAreaView: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const { theme } = useTheme();

  // State to handle the press effect
  const [pressed, setPressed] = useState(false);

  // Define gradient colors for the light and dark theme
  const gradientColors: readonly [string, string] =
    theme === "light"
      ? ["#eee", "#eee"] // Light theme gradient
      : ["#1e1e1e", "#1e1e1e"]; // Dark theme gradient

  // Darker color versions for the pressed effect (optional)
  const darkenedGradientColors: readonly [string, string] =
    theme === "light"
      ? ["#e56c4a", "#d68f56"] // Darkened light theme gradient
      : ["#4c0f91", "#1e59a3"]; // Darkened dark theme gradient

  return (
    <>
      <SafeAreaView className="flex-1">
        <LinearGradient
          colors={pressed ? darkenedGradientColors : gradientColors} // Switch colors when pressed
          start={[0, 0]}
          end={[1, 0]}
          className={className ? "flex-1 " : "flex-1 " + className}
        >
          {children}
        </LinearGradient>
        <StatusBar barStyle={"dark-content"} className="text-black" />
      </SafeAreaView>
    </>
  );
};

export default FFSafeAreaView;
