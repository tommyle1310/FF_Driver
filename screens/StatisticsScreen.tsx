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

const chartData = [1000, 2000, 500, 1500, 2000, 500, 1000];

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
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartMonth, setTempStartMonth] = useState(startDate.getMonth());
  const [tempStartDay, setTempStartDay] = useState(startDate.getDate());
  const [tempEndMonth, setTempEndMonth] = useState(endDate.getMonth());
  const [tempEndDay, setTempEndDay] = useState(endDate.getDate());
  // const [listOnlineHours, setListOnlineHours] = useState<{date, items, total}>([]);

  useEffect(() => {
    fetchOnlineHours();
  }, [driverId]);

  const fetchOnlineHours = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(
        `/drivers/online-session/${driverId}`
      );
      const { EC, EM, data } = res.data;
      if (EC === 0) {
        console.log("Online hours data:", data);
      }
    } catch (err) {
      console.error("Error fetching online hours:", err);
    } finally {
      setIsLoading(false);
    }
  };

  console.log("cehck start date", startDate);

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
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
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
            $1,310.2004
          </FFText>
        </View>
      </LinearGradient>

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
          <FFText>Orders</FFText>
          <FFText fontSize="lg" fontWeight="800" style={{ color: "#4d9c39" }}>
            1,310
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
            23h 39m
          </FFText>
        </View>
      </View>
      <FFBarChart data={chartData} />
    </FFSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
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
});

export default StatisticsScreen;
