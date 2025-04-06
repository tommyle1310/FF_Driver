import React from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import { useTheme } from "../hooks/useTheme";
import FFButton from "./FFButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_HEIGHT = 200; // Chiều cao cố định cho biểu đồ
const BAR_WIDTH = 10; // Độ rộng của mỗi cột
const BAR_SPACING = 20; // Khoảng cách giữa các cột
const Y_AXIS_WIDTH = 30; // Chiều rộng của trục Y

interface FFBarChartProps {
  data: number[]; // Mảng dữ liệu
  labels?: string[]; // Nhãn cho trục x
}

const FFBarChart: React.FC<FFBarChartProps> = ({
  data,
  labels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
}) => {
  const { theme } = useTheme();
  const currentTheme = {
    light: { background: "#ffffff", text: "#000000", barColor: "#4CAF50" },
    dark: { background: "#1a1a1a", text: "#ffffff", barColor: "#8BC34A" },
  }[theme as "light" | "dark"];

  // Đảm bảo số lượng data và labels khớp nhau
  const validData = data.slice(0, labels.length);
  const validLabels = labels.slice(0, data.length); // Chỉ lấy số nhãn tương ứng với data

  // Giá trị max để scale chiều cao cột, dựa trên dữ liệu thực tế
  const maxValue = Math.max(...validData, 1); // Đảm bảo maxValue ít nhất là 1 để tránh chia cho 0

  // Các mốc trên trục Y, tự động tính dựa trên maxValue
  const yAxisStep = maxValue / 4; // Chia trục Y thành 5 mức (0, 25%, 50%, 75%, 100%)
  const yAxisValues = [
    maxValue,
    maxValue * 0.75,
    maxValue * 0.5,
    maxValue * 0.25,
    0,
  ];

  return (
    <View
      style={{
        borderRadius: 12,
        gap: 16,
        backgroundColor: currentTheme.background,
        elevation: 3,
        justifyContent: "center",
        width: SCREEN_WIDTH - 32,
        marginHorizontal: "auto",
        padding: 10,
        paddingTop: 32,
      }}
    >
      <View style={styles.container}>
        {/* Trục Y (giá trị) */}
        <View style={styles.yAxis}>
          {yAxisValues.map((value, index) => (
            <Text
              key={index}
              style={[styles.yLabel, { color: currentTheme.text }]}
            >
              {value.toFixed(2)} {/* Hiển thị 2 chữ số thập phân */}
            </Text>
          ))}
        </View>

        {/* Các cột và trục X */}
        <View style={styles.chartContainer}>
          {validData.map((value, index) => {
            // Tính chiều cao cột dựa trên giá trị và tỷ lệ với CHART_HEIGHT
            const barHeight = (value / maxValue) * (CHART_HEIGHT - 20); // Trừ 20 để chừa chỗ cho nhãn trục X
            return (
              <View key={index} style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight < 1 ? 1 : barHeight, // Đảm bảo cột tối thiểu 1px để thấy được
                      backgroundColor: currentTheme.barColor,
                      width: BAR_WIDTH,
                    },
                  ]}
                />
                <Text style={[styles.xLabel, { color: currentTheme.text }]}>
                  {validLabels[index]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      <View className="w-full">
        <FFButton className="w-full">View Details</FFButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  yAxis: {
    justifyContent: "space-between",
    height: CHART_HEIGHT,
    width: Y_AXIS_WIDTH,
    marginRight: 10,
  },
  yLabel: {
    fontSize: 12,
    textAlign: "right",
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: CHART_HEIGHT,
    alignItems: "flex-end",
    flex: 1,
  },
  barWrapper: {
    alignItems: "center",
    marginHorizontal: BAR_SPACING / 2,
  },
  bar: {
    borderRadius: 4,
  },
  xLabel: {
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
});

export default FFBarChart;
