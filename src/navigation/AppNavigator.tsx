import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { RootState } from "../store/store";
import { loadTokenFromAsyncStorage } from "../store/authSlice";

// Screens for Authentication
import LoginScreen from "@/screens/Auth/LoginScreen";
import SignupScreen from "@/screens/Auth/SignupScreen";

// Main App Screens
import HomeScreen from "@/screens/HomeScreen";
import MyTasksScreen from "@/screens/MyTasksScreen";
import TrackHistoryScreen from "@/screens/TrackHistoryScreen";
import StatisticsScreen from "@/screens/StatisticsScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import MyWalletScreen from "@/screens/MyWalletScreen";
import SupportCenterScreen from "@/screens/SupportCenterScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import { useDispatch, useSelector } from "../store/types";

const Stack = createStackNavigator();

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
};
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type ScreenNames = "Home"|
"MyTasks"|
"TrackHistory"|
"Statistics"|
"Notifications"|
"Profile"|
"MyWallet"|
"SupportCenter"|
"Settings"

// Main App Navigator (Authenticated)
const MainNavigator = () => (
  <Stack.Navigator initialRouteName="Home">
    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="MyTasks" component={MyTasksScreen} />
    <Stack.Screen name="TrackHistory" component={TrackHistoryScreen} />
    <Stack.Screen name="Statistics" component={StatisticsScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="MyWallet" component={MyWalletScreen} />
    <Stack.Screen name="SupportCenter" component={SupportCenterScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

// Auth Navigator (Login/Signup)
const AuthNavigator = () => (
  <Stack.Navigator initialRouteName="Login">
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

// Main entry point to decide which navigator to show
const App = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      await dispatch(loadTokenFromAsyncStorage()); // Load token from storage
      setLoading(false); // Set loading to false after checking auth state
    };
    loadToken();
  }, [dispatch]);

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Main"
        component={isAuthenticated ? MainNavigator : AuthNavigator}
      />
      <Stack.Screen
        name="Auth"
        component={AuthNavigator}
      />
    </Stack.Navigator>
  );
};

export default App;
