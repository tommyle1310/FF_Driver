import { View, StyleSheet } from "react-native";
import React from "react";
import { useTheme } from "@/src/hooks/useTheme"; // Giả sử hook này đã được định nghĩa

const FFSeperator = () => {
  const { theme } = useTheme();

  // Xác định màu dựa trên theme
  const backgroundColor = theme === "light" ? "#E5E7EB" : "#4B5563"; // Màu xám nhạt cho light, xám đậm cho dark

  return (
    <View
      style={[
        styles.separator,
        { backgroundColor }, // Áp dụng màu động dựa trên theme
      ]}
    />
  );
};

const styles = StyleSheet.create({
  separator: {
    height: 1, // Chiều cao của đường phân cách
    width: "100%", // Chiếm toàn bộ chiều rộng
    marginVertical: 2, // Khoảng cách trên/dưới
    borderRadius: 2, // Bo góc nhẹ
  },
});

export default FFSeperator;
