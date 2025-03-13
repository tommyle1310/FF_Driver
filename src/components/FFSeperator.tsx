import { View, StyleSheet, Text } from "react-native";
import React from "react";
import { useTheme } from "@/src/hooks/useTheme";

interface FFSeperatorProps {
  label?: string; // Optional prop để hiển thị text ở giữa
}

const FFSeperator: React.FC<FFSeperatorProps> = ({ label }) => {
  const { theme } = useTheme();

  // Xác định màu dựa trên theme
  const backgroundColor = theme === "light" ? "#ccc" : "#4B5563"; // Màu đường phân cách
  const textColor = theme === "light" ? "#6B7280" : "#9CA3AF"; // Màu chữ (xám nhẹ)

  return (
    <View style={styles.container}>
      {/* Đường phân cách bên trái */}
      <View
        style={[
          styles.separator,
          { backgroundColor }, // Áp dụng màu động dựa trên theme
        ]}
      />

      {/* Text ở giữa (nếu có label) */}
      {label && (
        <Text style={[styles.label, { color: textColor }]}>
          {label.toUpperCase()}
        </Text>
      )}

      {/* Đường phân cách bên phải */}
      <View
        style={[
          styles.separator,
          { backgroundColor }, // Áp dụng màu động dựa trên theme
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row", // Sắp xếp đường phân cách và text theo hàng ngang
    alignItems: "center", // Căn giữa theo chiều dọc
    marginVertical: 2, // Khoảng cách trên/dưới
  },
  separator: {
    flex: 1, // Mỗi đường phân cách chiếm không gian đều nhau
    height: 1, // Chiều cao của đường phân cách
    borderRadius: 2, // Bo góc nhẹ
  },
  label: {
    marginHorizontal: 10, // Khoảng cách giữa text và đường phân cách
    fontSize: 12, // Kích thước chữ
    fontWeight: "bold", // Chữ đậm
  },
});

export default FFSeperator;
