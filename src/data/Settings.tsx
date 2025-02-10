import FFToggle from "@/src/components/FFToggle";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import IconIonicons from "react-native-vector-icons/Ionicons";
import { SidebarStackParamList } from "../navigation/AppNavigator";

type SettingNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "Settings"
>;

const useSettingData = () => {
  const navigation = useNavigation<SettingNavigationProp>();

  const settingsData = {
    "Account Settings": [
      {
        title: "Edit Profile",
        rightIcon: <IconIonicons name="chevron-forward-outline" size={20} />,
        onPress: () => {
          navigation.navigate("Profile");
        },
      },
      {
        title: "Change Password",
        rightIcon: <IconIonicons name="chevron-forward-outline" size={20} />,
        onPress: () => {
          // Add the navigation logic for changing password
        },
      },
      {
        title: "?",
        rightIcon: <IconIonicons name="chevron-forward-outline" size={20} />,
        onPress: () => {},
      },
      {
        title: "Payment Method",
        rightIcon: <IconIonicons name="chevron-forward-outline" size={20} />,
        onPress: () => {
          // Add the navigation logic for adding a payment method
        },
      },
      {
        title: "Push Notifications",
        rightIcon: <FFToggle initialChecked />,
        onPress: () => {
          // Add the logic for enabling/disabling notifications
        },
      },
      {
        title: "Dark Mode",
        rightIcon: <FFToggle initialChecked />,
        onPress: () => {
          // Add the logic for toggling dark mode
        },
      },
    ],
    More: [
      {
        title: "About Us",
        rightIcon: <IconIonicons name="chevron-forward-outline" size={20} />,
        onPress: () => {
          // Add the navigation logic for About Us
        },
      },
      {
        title: "Privacy Policy",
        rightIcon: <IconIonicons name="chevron-forward-outline" size={20} />,
        onPress: () => {
          // Add the navigation logic for Privacy Policy
        },
      },
    ],
  };

  return settingsData;
};

export default useSettingData;
