import { View, Text, StyleSheet } from "react-native";
import React from "react";
import FFView from "@/src/components/FFView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import { LinearGradient } from "expo-linear-gradient";
import FFText from "@/src/components/FFText";
import IconIonicons from "react-native-vector-icons/Ionicons";

type TrackHistorySreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "Statistics"
>;

const StatisticsScreen = () => {
  const navigation = useNavigation<TrackHistorySreenNavigationProp>();
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
          <FFText fontSize="sm" fontWeight="500" style={{ color: "#fff" }}>
            Mar 10 - Mar 16
          </FFText>
          <FFText fontWeight="700" fontSize="lg" style={{ color: "#fff" }}>
            $1,310.2004
          </FFText>
        </View>
      </LinearGradient>
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
          <FFText>Orders</FFText>
          <FFText fontSize="lg" fontWeight="800" style={{ color: "#4d9c39" }}>
            1,310
          </FFText>
        </View>
      </View>
    </FFSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9", // Background color for the container
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Ensuring content has padding at the bottom
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
  contentWrapper: {
    marginTop: -60, // Ensuring content is visible when scrolled up
    alignItems: "center",
  },
  contentContainer: {
    width: "90%",
    paddingBottom: 60,
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingTop: 24,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  settingsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontWeight: "400",
    color: "#aaa",
    marginBottom: 8,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  logoutButton: {
    marginTop: 24,
    width: "100%",
  },
});

export default StatisticsScreen;
