import { View, StatusBar } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";

interface FFSafeAreaViewProps {
  children: React.ReactNode;
  className?: string;
  style?: object; // Added style prop
}

const FFSafeAreaView: React.FC<FFSafeAreaViewProps> = ({
  children,
  className = "",
  style = {},
}) => {
  const { theme } = useTheme();
  const [pressed, setPressed] = useState(false);

  // Define gradient colors for the light and dark theme
  const gradientColors: readonly [string, string] =
    theme === "light" ? ["#eee", "#eee"] : ["#1e1e1e", "#1e1e1e"];

  // Darker colors for pressed effect
  const darkenedGradientColors: readonly [string, string] =
    theme === "light" ? ["#e56c4a", "#d68f56"] : ["#4c0f91", "#1e59a3"];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={pressed ? darkenedGradientColors : gradientColors}
        start={[0, 0]}
        end={[1, 0]}
        style={[{ flex: 1 }, style]} // Applied style here
        className={`flex-1 ${className}`} // Ensure proper className usage
      >
        {children}
      </LinearGradient>
      <StatusBar barStyle={theme === "light" ? "dark-content" : "light-content"} />
    </SafeAreaView>
  );
};

export default FFSafeAreaView;
