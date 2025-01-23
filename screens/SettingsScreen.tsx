import { View, Text } from "react-native";
import React from "react";
import FFButton from "@/src/components/FFButton";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/src/navigation/AppNavigator"; // Correct import path
import { logout } from "@/src/store/authSlice";
import { useDispatch } from "@/src/store/types";

type SettingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Main"
>;

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const dispatch = useDispatch();
  const handleLogout = () => {
    // Handle logout (clear token, reset state, etc.)
    console.log("Logging out...");

    dispatch(logout());

    // Navigate to the Auth stack
    navigation.reset({
      index: 0,
      routes: [{ name: "Auth" }], // Root will switch to AuthNavigator based on auth state
    });
  };

  return (
    <View>
      <Text>SettingsScreen</Text>
      <FFButton onPress={handleLogout}>Logout</FFButton>
    </View>
  );
};

export default SettingsScreen;
