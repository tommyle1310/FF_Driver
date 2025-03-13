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
  data: number[]; // Mảng dữ liệu (ví dụ: [1000, 2000, 500, 1500, 2000, 500, 1000])
  labels?: string[]; // Nhãn cho trục x (mặc định là ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'])
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

  // Giá trị max để scale chiều cao cột, bao gồm cả 0
  const maxValue = Math.max(...validData, 2000); // Giá trị tối đa trên trục Y

  // Các mốc trên trục Y, bắt đầu từ 0
  const yAxisValues = [1500, 1000, 500, 0];

  return (
    <View
      style={{
        borderRadius: 12,
        gap: 16,
        backgroundColor: currentTheme.background,
        elevation: 3,
        justifyContent: "center",
        width: SCREEN_WIDTH - 32, // Đảm bảo không bị tràn màn hình
        marginHorizontal: "auto",
        padding: 10,
        paddingTop: 32,
      }}
    >
      <View style={[styles.container, {}]}>
        {/* Trục Y (giá trị) */}
        <View style={styles.yAxis}>
          {yAxisValues.map((value) => (
            <Text
              key={value}
              style={[styles.yLabel, { color: currentTheme.text }]}
            >
              {value}
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
                      height: barHeight,
                      backgroundColor: currentTheme.barColor,
                      width: BAR_WIDTH,
                    },
                  ]}
                />
                <Text style={[styles.xLabel, { color: currentTheme.text }]}>
                  {labels[index]}
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
