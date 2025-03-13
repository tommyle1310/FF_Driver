import React from "react";
import { View, StyleSheet, Text } from "react-native";
import FFText from "./FFText";

interface Checkpoint {
  status: string; // Trạng thái để xác định màu của vòng tròn
  time: string; // Thời gian (ví dụ: "01 Jan 2022, 11:47AM")
  address: string; // Địa chỉ (ví dụ: "Bus Sta Upas, Majestic, Bengaluru, Karnataka")
  postalCode: string; // Mã bưu điện (ví dụ: "560009")
}

interface FFVerticalCheckpointProgressProps {
  checkpoints: Checkpoint[]; // Mảng các checkpoint
}

const FFVerticalCheckpointProgress: React.FC<
  FFVerticalCheckpointProgressProps
> = ({ checkpoints }) => {
  return (
    <View style={styles.container}>
      {checkpoints.map((checkpoint, index) => (
        <View key={index} style={styles.checkpointWrapper}>
          {/* Vòng tròn checkpoint */}
          <View
            style={[
              styles.circle,
              {
                backgroundColor:
                  checkpoint.status === "Started" ? "#34C759" : "#FF3B30", // Xanh cho Started, đỏ cho Ended
              },
            ]}
          />

          {/* Đường thẳng dọc (không hiển thị ở checkpoint cuối cùng) */}
          {index < checkpoints.length - 1 && <View style={styles.line} />}

          {/* Thông tin checkpoint */}
          <View style={styles.info}>
            <FFText style={styles.status}>
              {checkpoint.status.toUpperCase()} : {checkpoint.time}
            </FFText>
            <FFText style={styles.address}>{checkpoint.address}</FFText>
            <FFText style={styles.postalCode}>{checkpoint.postalCode}</FFText>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 10, // Khoảng cách từ vòng tròn đến lề trái
  },
  checkpointWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    position: "relative",
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  line: {
    position: "absolute",
    left: 5.5, // Căn giữa đường thẳng với vòng tròn
    top: 12, // Bắt đầu từ dưới vòng tròn
    width: 1,
    height: 64, // Chiều dài đường thẳng (có thể điều chỉnh)
    backgroundColor: "#D1D5DB", // Màu xám nhạt
  },
  info: {
    flex: 1,
    marginBottom: 20, // Khoảng cách giữa các checkpoint
  },
  status: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937", // Màu xám đậm
  },
  address: {
    fontSize: 12,
    color: "#6B7280", // Màu xám nhạt
    marginTop: 2,
  },
  postalCode: {
    fontSize: 12,
    color: "#6B7280", // Màu xám nhạt
    marginTop: 2,
  },
});

export default FFVerticalCheckpointProgress;
