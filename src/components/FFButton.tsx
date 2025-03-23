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
  variant?: "primary" | "secondary" | "outline" | "danger" | "disabled"; // Thêm variant "disabled"
  style?: ViewStyle;
}> = ({
  children,
  className,
  isLinear = true,
  textClassName,
  onPress = () => {},
  variant = "primary",
  style,
}) => {
  const { theme } = useTheme();
  const [pressed, setPressed] = useState(false);

  // Gradient colors cho theme
  const gradientColors: readonly [string, string] =
    theme === "light" ? ["#63c550", "#a3d98f"] : ["#63c550", "#4a9e3e"];

  const darkenedGradientColors: readonly [string, string] =
    theme === "light" ? ["#4d9c39", "#7dbf72"] : ["#4c9f3a", "#3e7c2a"];

  // Định nghĩa style cho các variant
  const variantStyles = {
    primary: {
      gradientStart: pressed ? darkenedGradientColors[0] : gradientColors[0],
      gradientEnd: pressed ? darkenedGradientColors[1] : gradientColors[1],
      textColor: "white",
    },
    secondary: {
      gradientStart: pressed ? "#7fa9e7" : "#a3c9f1",
      gradientEnd: pressed ? "#4c8ecf" : "#7fa9e7",
      textColor: "#333",
    },
    outline: {
      gradientStart: pressed ? "#e2e2e2" : "#f3f3f3",
      gradientEnd: pressed ? "#cccccc" : "#e2e2e2",
      textColor: "#333",
    },
    danger: {
      gradientStart: pressed ? "#800000" : "#d21f3c",
      gradientEnd: pressed ? "#e60000" : "#ff4343",
      textColor: "white",
    },
    disabled: {
      gradientStart: "#e2e2e2", // Giống secondary nhưng không thay đổi khi nhấn
      gradientEnd: "#cccccc", // Không có pressed effect
      textColor: "#333",
    },
  };

  const { gradientStart, gradientEnd, textColor } = variantStyles[variant];

  const renderChildren = () => {
    if (typeof children === "string") {
      return (
        <Text
          style={[
            { color: textColor, fontSize: 16, fontWeight: "600" },
            textClassName as any,
          ]}
        >
          {children}
        </Text>
      );
    }
    return children;
  };

  // Kiểm tra nếu variant là "disabled" thì không cho nhấn
  const isDisabled = variant === "disabled";

  return (
    <Pressable
      onPressIn={!isDisabled ? () => setPressed(true) : undefined} // Không áp dụng nếu disabled
      onPressOut={
        !isDisabled
          ? () => {
              setPressed(false);
              onPress();
            }
          : undefined
      } // Không chạy onPress nếu disabled
      style={[
        {
          transform: [{ scale: pressed && !isDisabled ? 0.95 : 1 }], // Không scale nếu disabled
          justifyContent: "center",
          alignItems: "center",
        },
        style,
      ]}
      disabled={isDisabled} // Dùng thuộc tính disabled của Pressable
    >
      <LinearGradient
        colors={[gradientStart, gradientEnd]}
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
        className={className}
      >
        {renderChildren()}
      </LinearGradient>
    </Pressable>
  );
};

export default FFButton;
