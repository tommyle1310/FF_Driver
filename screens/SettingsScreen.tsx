import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import React from "react";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFText from "@/src/components/FFText";
import FFToggle from "@/src/components/FFToggle";
import FFButton from "@/src/components/FFButton";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  RootStackParamList,
  SidebarStackParamList,
} from "@/src/navigation/AppNavigator";
import { useDispatch, useSelector } from "@/src/store/types";
import { logout } from "@/src/store/authSlice";
import IconIonicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import FFAvatar from "@/src/components/FFAvatar";
import { RootState } from "@/src/store/store";
import useSettingData from "@/src/data/Settings";

type LogoutSreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Main"
>;

const SettingsScreen = () => {
  const navigation = useNavigation<LogoutSreenNavigationProp>();
  const dispatch = useDispatch();
  const { avatar } = useSelector((state: RootState) => state.auth);
  const { "Account Settings": data_account_setting, More: data_more } =
    useSettingData();

  return (
    <FFSafeAreaView>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header Gradient Section */}
          <LinearGradient
            colors={["#63c550", "#a3d98f"]}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <IconIonicons name="settings" color={"#fff"} size={24} />
              <FFText style={styles.headerText}>Settings</FFText>
            </View>
          </LinearGradient>

          {/* Main Content Section */}
          <View style={styles.contentWrapper}>
            <View style={styles.contentContainer}>
              {/* Profile Section */}
              <View style={styles.profileSection}>
                <FFAvatar size={40} avatar={avatar?.url} />
                <FFText>Tommy Bua</FFText>
              </View>

              {/* Account Settings Section */}
              <View style={styles.settingsSection}>
                <FFText style={styles.sectionTitle}>Account Settings</FFText>
                {data_account_setting.map((item) => (
                  <Pressable
                    onPress={() => item.onPress()}
                    key={item.title}
                    style={styles.optionItem}
                  >
                    <FFText>{item.title}</FFText>
                    {item.rightIcon}
                  </Pressable>
                ))}
              </View>

              {/* More Settings Section */}
              <View style={styles.settingsSection}>
                <FFText style={styles.sectionTitle}>More Settings</FFText>
                {data_more.map((item) => (
                  <Pressable key={item.title} style={styles.optionItem}>
                    <FFText>{item.title}</FFText>
                    {item.rightIcon}
                  </Pressable>
                ))}

                {/* Log Out Button */}
                <FFButton
                  onPress={() => {
                    dispatch(logout());
                    navigation.navigate("Auth");
                  }}
                  className="w-full"
                  variant="danger"
                >
                  Log Out
                </FFButton>
              </View>
            </View>
          </View>
        </ScrollView>
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
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    height: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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

export default SettingsScreen;
