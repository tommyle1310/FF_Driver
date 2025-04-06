import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "@/src/hooks/useTheme";

interface FFSkeletonProps {
  width?: number | string;
  height?: number | string;
  color?: string;
  style?: any;
}

const FFSkeleton: React.FC<FFSkeletonProps> = ({
  width = "100%",
  height = 20,
  color,
  style,
}) => {
  const { theme } = useTheme();
  const animatedValue = new Animated.Value(0);

  // Get theme-based colors
  const baseColor = color || (theme === "light" ? "#d4e0d1" : "#2A2A2A");
  const highlightColor = theme === "light" ? "#b0baad" : "#3A3A3A";

  // Convert width to number if needed (giữ nguyên logic cũ)
  const widthValue = useMemo(() => {
    if (typeof width === "string") {
      return width.includes("%") ? "100%" : parseInt(width, 10);
    }
    return width;
  }, [width]);

  useEffect(() => {
    const pulseAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1, // Đậm lên
            duration: 800, // Thời gian nhạt -> đậm
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0, // Nhạt đi
            duration: 800, // Thời gian đậm -> nhạt
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    pulseAnimation();

    return () => {
      animatedValue.stopAnimation();
    };
  }, [animatedValue]);

  // Thay đổi opacity thay vì translateX
  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7], // Nhạt (0.3) -> Đậm (0.7)
  });

  return (
    <View
      style={[
        styles.container,
        {
          width: widthValue,
          height,
          backgroundColor: baseColor,
          borderRadius: 12,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            opacity, // Dùng opacity thay vì transform
            backgroundColor: highlightColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  shimmer: {
    width: "100%",
    height: "100%",
  },
});

export default FFSkeleton;
