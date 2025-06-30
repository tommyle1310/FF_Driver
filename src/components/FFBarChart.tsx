import React from "react";
import { View, StyleSheet, Dimensions, Text, ScrollView } from "react-native";
import { useTheme } from "../hooks/useTheme";
import FFButton from "./FFButton";
import { colors, typography } from "../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_HEIGHT = 200; // Chiều cao cố định cho biểu đồ
const BAR_WIDTH = 10; // Độ rộng của mỗi cột
const BAR_SPACING = 20; // Khoảng cách giữa các cột
const Y_AXIS_WIDTH = 40; // Chiều rộng của trục Y
const ITEM_WIDTH = BAR_WIDTH + BAR_SPACING; // Tổng chiều rộng cho mỗi item (bar + spacing)

interface FFBarChartProps {
  data: number[]; // Mảng dữ liệu
  labels?: string[]; // Nhãn cho trục x
  unit?: string; // Đơn vị cho trục y
}

const FFBarChart: React.FC<FFBarChartProps> = ({
  data,
  labels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  unit = "%",
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
        <Text
              style={[{position: 'absolute', top: -20, left: 10}, { color: colors.grey, fontSize: typography.fontSize.xs }]}
              numberOfLines={1}
            >
              {unit} {/* Hiển thị 2 chữ số thập phân */}
            </Text>
          {yAxisValues.map((value, index) => (
            <Text
              key={index}
              style={[styles.yLabel, { color: currentTheme.text }]}
              numberOfLines={1}
            >
              {value.toFixed(2)} {/* Hiển thị 2 chữ số thập phân */}
            </Text>
            
          ))}
          
        </View>

        {/* Scrollable chart area */}
        <View style={{ flex: 1 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={{ alignItems: 'flex-end' }}>
              {/* Chart bars area */}
              <View style={styles.chartContainer}>
                {validData.map((value, index) => {
                  // Tính chiều cao cột dựa trên giá trị và tỷ lệ với CHART_HEIGHT
                  const barHeight = (value / maxValue) * CHART_HEIGHT; // Sử dụng full CHART_HEIGHT
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
                    </View>
                  );
                })}
              </View>
              
              {/* X-axis labels below the chart */}
              <View style={[styles.labelsContainer, { marginTop: 8 }]}>
                {validLabels.map((label, index) => (
                  <View key={index} style={styles.labelWrapper}>
                    <Text style={[styles.xLabel, { color: currentTheme.text }]}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
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
    position: 'relative',
    width: Y_AXIS_WIDTH,
    marginRight: 10,
  },
  yLabel: {
    fontSize: 12,
    textAlign: "right",
    width: Y_AXIS_WIDTH,
  },
  scrollContent: {
    flexGrow: 1,
  },
  chartContainer: {
    flexDirection: "row",
    height: CHART_HEIGHT,
    alignItems: "flex-end",
    paddingRight: 20,
  },
  barWrapper: {
    alignItems: "center",
    width: ITEM_WIDTH,
  },
  bar: {
    borderRadius: 4,
  },
  labelsContainer: {
    flexDirection: "row",
    paddingRight: 20,
  },
  labelWrapper: {
    alignItems: "center",
    width: ITEM_WIDTH,
  },
  xLabel: {
    fontSize: 12,
    textAlign: "center",
  },
});

export default FFBarChart;
