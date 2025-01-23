import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, StackNavigationProp } from "@react-navigation/stack";
import FFSidebar from "../components/FFSidebar"; // Assuming FFSidebar is in the components folder
import HomeScreen from "@/screens/HomeScreen"; // Replace with your actual screen component
import RootLayout from "@/screens/RootLayout"; // Import RootLayout
import { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types";
import MyTasksScreen from "@/screens/MyTasksScreen";
import TrackHistoryScreen from "@/screens/TrackHistoryScreen";
import StatisticsScreen from "@/screens/StatisticsScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import MyWalletScreen from "@/screens/MyWalletScreen";
import SupportCenterScreen from "@/screens/SupportCenterScreen";
import SettingsScreen from "@/screens/SettingsScreen";

const Stack = createStackNavigator();

export type ScreenNames = keyof RootStackParamList;

export type RootStackParamList = {
  MyTasks: undefined;
  TrackHistory: undefined;
  Statistics: undefined;
  Notifications: undefined;
  MyWallet: undefined;
  SupportCenter: undefined;
  Settings: undefined;
  Profile: undefined;
  // Add more screens if necessary
};

export type NavigationProp = StackNavigationProp<RootStackParamList>;  // Use StackNavigationProp


const App = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }} // Hides the default header for this screen
      />
      <Stack.Screen
        name="MyTasks"
        component={MyTasksScreen}
        // options={{ headerShown: false }} // Hides the default header for this screen
      />
      <Stack.Screen
        name="TrackHistory"
        component={TrackHistoryScreen}
        // options={{ headerShown: false }} // Hides the default header for this screen
      />
      <Stack.Screen
        name="Statistics"
        component={StatisticsScreen}
        // options={{ headerShown: false }} // Hides the default header for this screen
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        // options={{ headerShown: false }} // Hides the default header for this screen
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        // options={{ headerShown: false }} // Hides the default header for this screen
      />
      <Stack.Screen
        name="MyWallet"
        component={MyWalletScreen}
        // options={{ headerShown: false }} // Hides the default header for this screen
      />
      <Stack.Screen
        name="SupportCenter"
        component={SupportCenterScreen}
        // options={{ headerShown: false }} // Hides the default header for this screen
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        // options={{ headerShown: false }} // Hides the default header for this screen
      />
    </Stack.Navigator>
  );
};

export default App;
