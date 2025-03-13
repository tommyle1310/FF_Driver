import React from "react";
import { View, Text, StyleSheet, TextStyle, Pressable } from "react-native";

interface FFJBRowItemProps {
  leftItem: string; // Text mặc định cho item bên trái
  rightItem: string; // Text mặc định cho item bên phải
  leftItemCss?: TextStyle; // Style tùy chỉnh cho item bên trái
  rightItemCss?: TextStyle; // Style tùy chỉnh cho item bên phải
  childLeft?: React.ReactNode; // Override item trái bằng ReactNode
  childRight?: React.ReactNode; // Override item phải bằng ReactNode
  onPressLeft?: () => void; // Hàm xử lý khi nhấn item trái
  onPressRight?: () => void; // Hàm xử lý khi nhấn item phải
}

const FFJBRowItem: React.FC<FFJBRowItemProps> = ({
  leftItem,
  rightItem,
  leftItemCss,
  rightItemCss,
  childLeft,
  childRight,
  onPressLeft,
  onPressRight,
}) => {
  return (
    <View style={styles.container}>
      {/* Item bên trái */}
      <Pressable onPress={onPressLeft} disabled={!onPressLeft}>
        {childLeft ? (
          childLeft
        ) : (
          <Text style={[styles.text, leftItemCss]}>{leftItem}</Text>
        )}
      </Pressable>

      {/* Item bên phải */}
      <Pressable onPress={onPressRight} disabled={!onPressRight}>
        {childRight ? (
          childRight
        ) : (
          <Text style={[styles.text, rightItemCss]}>{rightItem}</Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8, // Khoảng cách trên/dưới mặc định
  },
  text: {
    fontSize: 14,
    color: "#1F2937", // Màu xám đậm mặc định
  },
});

export default FFJBRowItem;
