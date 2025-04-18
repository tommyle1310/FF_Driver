import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import React, { useEffect, useState } from "react";
import FFView from "@/src/components/FFView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import { LinearGradient } from "expo-linear-gradient";
import FFText from "@/src/components/FFText";
import IconIonicons from "react-native-vector-icons/Ionicons";
import FFBarChart from "@/src/components/FFBarChart";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import axiosInstance from "@/src/utils/axiosConfig";
import { Picker } from "@react-native-picker/picker";

type TrackHistorySreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "Statistics"
>;

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const days = Array.from({ length: 31 }, (_, i) => i + 1);

const StatisticsScreen = () => {
  const navigation = useNavigation<TrackHistorySreenNavigationProp>();
  const { driverId } = useSelector((state: RootState) => state.auth);

  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? 0 : 7); // Adjust when day is Sunday
    const end = new Date(now.setDate(diff));
    end.setHours(23, 59, 59, 999);
    return end;
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartMonth, setTempStartMonth] = useState(startDate.getMonth());
  const [tempStartDay, setTempStartDay] = useState(startDate.getDate());
  const [tempEndMonth, setTempEndMonth] = useState(endDate.getMonth());
  const [tempEndDay, setTempEndDay] = useState(endDate.getDate());

  // State cho dữ liệu từ API
  const [statsData, setStatsData] = useState({
    total_earns: 0,
    total_tips: 0,
    total_online_hours: 0,
  });

  // State cho tab và dữ liệu chart
  const [activeTab, setActiveTab] = useState<"earns" | "tips" | "hours">(
    "earns"
  );
  const [chartData, setChartData] = useState<number[]>([]);
  const [statsRecords, setStatsRecords] = useState<any[]>([]);

  useEffect(() => {
    fetchDriverStats();
  }, [driverId, startDate, endDate]);

  const fetchDriverStats = async () => {
    setIsLoading(true);
    try {
      const startDateStr = startDate.toISOString().split("T")[0]; // YYYY-MM-DD
      const endDateStr = endDate.toISOString().split("T")[0];
      const res = await axiosInstance.get(
        `/driver-stats/${driverId}?start_date=${startDateStr}&end_date=${endDateStr}`
      );
      const { EC, EM, data } = res.data;
      if (EC === 0) {
        console.log("Driver stats data:", data);
        setStatsRecords(data);

        // Tính tổng từ tất cả records
        const totalStats = data.reduce(
          (
            acc: {
              total_earns: number;
              total_tips: number;
              total_online_hours: number;
            },
            record: any
          ) => ({
            total_earns: acc.total_earns + (record.total_earns || 0),
            total_tips: acc.total_tips + (record.total_tips || 0),
            total_online_hours:
              acc.total_online_hours + (record.total_online_hours || 0),
          }),
          { total_earns: 0, total_tips: 0, total_online_hours: 0 }
        );

        setStatsData(totalStats);
        updateChartData(data, activeTab);
      } else {
        console.error("Error from API:", EM);
      }
    } catch (err) {
      console.error("Error fetching driver stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateChartData = (records: any[], tab: string) => {
    let chartValues: number[];
    if (tab === "earns") {
      chartValues = records.map((record) => record.total_earns || 0);
    } else if (tab === "tips") {
      chartValues = records.map((record) => record.total_tips || 0);
    } else {
      chartValues = records.map((record) => record.total_online_hours || 0);
    }

    // Không tạo dữ liệu giả nếu chỉ có 1 record, giữ nguyên 1 giá trị
    console.log("check chart data", chartValues);
    setChartData(chartValues);
  };

  const handleTabChange = (tab: "earns" | "tips" | "hours") => {
    setActiveTab(tab);
    updateChartData(statsRecords, tab);
  };

  const onStartDateConfirm = () => {
    const newDate = new Date(
      startDate.getFullYear(),
      tempStartMonth,
      tempStartDay
    );
    setStartDate(newDate);
    setShowStartPicker(false);
  };

  const onEndDateConfirm = () => {
    const newDate = new Date(endDate.getFullYear(), tempEndMonth, tempEndDay);
    setEndDate(newDate);
    setShowEndPicker(false);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatHours = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Trong StatisticsScreen
  const getChartLabels = () => {
    return statsRecords.map((record) => {
      const date = new Date(parseInt(record.period_start) * 1000);
      return date.toLocaleDateString("en-VN", {
        month: "numeric",
        day: "numeric",
      });
    });
  };

  return (
    <FFSafeAreaView>
      <LinearGradient
        colors={["#63c550", "#a3d98f"]}
        start={[0, 0]}
        end={[1, 0]}
        style={styles.headerGradient}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 16,
            alignItems: "center",
            position: "relative",
          }}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <IconIonicons name="chevron-back" color={"#fff"} size={24} />
          </TouchableOpacity>
        </View>
        <View className="items-center justify-center gap-2">
          <FFText style={styles.headerText}>Earnings</FFText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity onPress={() => setShowStartPicker(true)}>
              <FFText fontSize="sm" fontWeight="500" style={{ color: "#fff" }}>
                {formatDate(startDate)}
              </FFText>
            </TouchableOpacity>
            <FFText fontSize="sm" style={{ color: "#fff" }}>
              -
            </FFText>
            <TouchableOpacity onPress={() => setShowEndPicker(true)}>
              <FFText fontSize="sm" fontWeight="500" style={{ color: "#fff" }}>
                {formatDate(endDate)}
              </FFText>
            </TouchableOpacity>
          </View>
          <FFText fontWeight="700" fontSize="lg" style={{ color: "#fff" }}>
            ${statsData.total_earns.toFixed(2)}
          </FFText>
        </View>
      </LinearGradient>
      {/* Summary Cards */}
      <View
        style={{
          marginTop: -32,
          padding: 16,
          width: "100%",
          flexDirection: "row",
          gap: 12,
        }}
      >
        <View
          style={{
            elevation: 3,
            padding: 16,
            alignItems: "center",
            borderRadius: 8,
            backgroundColor: "#fff",
            flex: 1,
          }}
        >
          <FFText>Earnings</FFText>
          <FFText fontSize="lg" fontWeight="800" style={{ color: "#4d9c39" }}>
            ${statsData.total_earns.toFixed(2)}
          </FFText>
        </View>
        <View
          style={{
            elevation: 3,
            padding: 16,
            alignItems: "center",
            borderRadius: 8,
            backgroundColor: "#fff",
            flex: 1,
          }}
        >
          <FFText>Online Hours</FFText>
          <FFText fontSize="lg" fontWeight="800" style={{ color: "#4d9c39" }}>
            {formatHours(statsData.total_online_hours)}
          </FFText>
        </View>
      </View>

      {/* Start Date Picker Modal */}
      <Modal visible={showStartPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <FFText style={styles.modalTitle}>Select Start Date</FFText>
            <View style={styles.pickerRow}>
              <Picker
                selectedValue={tempStartMonth}
                onValueChange={(itemValue) => setTempStartMonth(itemValue)}
                style={styles.picker}
              >
                {months.map((month, index) => (
                  <Picker.Item key={index} label={month} value={index} />
                ))}
              </Picker>
              <Picker
                selectedValue={tempStartDay}
                onValueChange={(itemValue) => setTempStartDay(itemValue)}
                style={styles.picker}
              >
                {days.map((day) => (
                  <Picker.Item key={day} label={`${day}`} value={day} />
                ))}
              </Picker>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => setShowStartPicker(false)}
                style={styles.cancelButton}
              >
                <FFText>Cancel</FFText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onStartDateConfirm}
                style={styles.confirmButton}
              >
                <FFText style={{ color: "#fff" }}>Confirm</FFText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* End Date Picker Modal */}
      <Modal visible={showEndPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <FFText style={styles.modalTitle}>Select End Date</FFText>
            <View style={styles.pickerRow}>
              <Picker
                selectedValue={tempEndMonth}
                onValueChange={(itemValue) => setTempEndMonth(itemValue)}
                style={styles.picker}
              >
                {months.map((month, index) => (
                  <Picker.Item key={index} label={month} value={index} />
                ))}
              </Picker>
              <Picker
                selectedValue={tempEndDay}
                onValueChange={(itemValue) => setTempEndDay(itemValue)}
                style={styles.picker}
              >
                {days.map((day) => (
                  <Picker.Item key={day} label={`${day}`} value={day} />
                ))}
              </Picker>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => setShowEndPicker(false)}
                style={styles.cancelButton}
              >
                <FFText>Cancel</FFText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onEndDateConfirm}
                style={styles.confirmButton}
              >
                <FFText style={{ color: "#fff" }}>Confirm</FFText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tabs */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          marginVertical: 16,
        }}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === "earns" && styles.activeTab]}
          onPress={() => handleTabChange("earns")}
        >
          <FFText
            style={
              activeTab === "earns" ? styles.activeTabText : styles.tabText
            }
          >
            Earnings
          </FFText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "tips" && styles.activeTab]}
          onPress={() => handleTabChange("tips")}
        >
          <FFText
            style={activeTab === "tips" ? styles.activeTabText : styles.tabText}
          >
            Tips
          </FFText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "hours" && styles.activeTab]}
          onPress={() => handleTabChange("hours")}
        >
          <FFText
            style={
              activeTab === "hours" ? styles.activeTabText : styles.tabText
            }
          >
            Hours
          </FFText>
        </TouchableOpacity>
      </View>

      {/* Chart */}
      <FFBarChart data={chartData} labels={getChartLabels()} />
    </FFSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  headerGradient: {
    paddingHorizontal: 12,
    paddingVertical: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    height: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  backButton: {
    position: "absolute",
    left: 16,
    top: 16,
    marginRight: 12,
  },
  headerText: {
    color: "#fff",
    fontSize: 24,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  picker: {
    width: "50%",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  cancelButton: {
    padding: 10,
  },
  confirmButton: {
    padding: 10,
    backgroundColor: "#63c550",
    borderRadius: 5,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#63c550",
  },
  tabText: {
    color: "#000",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default StatisticsScreen;
