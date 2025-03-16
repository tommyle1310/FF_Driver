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

// Sidebar component (it will be part of the main content, not as a separate screen)

import { useDispatch, useSelector } from "../store/types";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useSocket } from "../hooks/useSocket";
import { sendPushNotification } from "../utils/functions/pushNotification";
import { Type_PushNotification_Order } from "../types/pushNotification";
import FFToast from "../components/FFToast";
import FFText from "../components/FFText";
import { View } from "react-native";
import { Enum_PaymentMethod, Enum_TrackingInfo } from "../types/Orders";
import socket from "../services/socket";
import { Enum_PaymentStatus } from "../types/Orders";
import MyVehicleScreen from "@/screens/MyVehicleScreen";
import FChatScreen from "@/screens/FChatScreen";
import OrderHistoryDetailsScreen from "@/screens/OrderHistoryDetails";

const SidebarStack = createStackNavigator<SidebarStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

// Define types for navigation
export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
};
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type SidebarStackParamList = {
  Home: undefined;
  MyTasks: undefined;
  TrackHistory: undefined;
  Statistics: undefined;
  Notifications: undefined;
  Profile: undefined;
  MyWallet: undefined;
  SupportCenter: undefined;
  Settings: undefined;
  MyVehicles: undefined;
  FChat: {
    withUserId?: string;
    type?: "SUPPORT" | "ORDER";
    orderId?: string;
  };
  OrderHistoryDetails: {
    orderId: string;
  };
};

export type ScreenNames =
  | "Home"
  | "MyTasks"
  | "TrackHistory"
  | "Statistics"
  | "Notifications"
  | "Profile"
  | "MyWallet"
  | "SupportCenter"
  | "OrderHistoryDetails"
  | "Settings"
  | "MyVehicles"
  | "FChat";

// Main App Navigator (Authenticated)
const MainNavigator = () => {
  const { driverId } = useSelector((state: RootState) => state.auth);
  const [selectedLocation] = useState({
    lat: 10.826411,
    lng: 106.617353,
  });
  const [latestOrder, setLatestOrder] =
    useState<Type_PushNotification_Order | null>(null);
  const [orders, setOrders] = useState<Type_PushNotification_Order[]>([]);
  const [isShowIncomingOrderToast, setIsShowIncomingOrderToast] =
    useState(false);
  const { expoPushToken } = usePushNotifications();
  const pushToken = expoPushToken as unknown as { data: string };

  const handleAcceptOrder = () => {
    if (!latestOrder || !driverId) return;
    socket.emit("driverAcceptOrder", {
      orderId: latestOrder._id,
      driverId,
      restaurantLocation: selectedLocation,
    });
    console.log("just emit accept order", {
      orderId: latestOrder._id,
      driverId,
      restaurantLocation: selectedLocation,
    });
    setIsShowIncomingOrderToast(false);
  };

  useSocket(
    driverId || "FF_DRI_b64aa8b7-3964-46a4-abf4-924c5515f57a",
    setOrders,
    (order: Type_PushNotification_Order) =>
      sendPushNotification({
        order,
        expoPushToken: pushToken,
      }),
    setLatestOrder
  );

  useEffect(() => {
    if (latestOrder) {
      setIsShowIncomingOrderToast(true);
    }
  }, [latestOrder]);

  return (
    <>
      <SidebarStack.Navigator initialRouteName="Home">
        <SidebarStack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <SidebarStack.Screen
          options={{ headerShown: false }}
          name="MyTasks"
          component={MyTasksScreen}
        />
        <SidebarStack.Screen
          options={{ headerShown: false }}
          name="TrackHistory"
          component={TrackHistoryScreen}
        />
        <SidebarStack.Screen
          options={{ headerShown: false }}
          name="Statistics"
          component={StatisticsScreen}
        />
        <SidebarStack.Screen
          options={{ headerShown: false }}
          name="OrderHistoryDetails"
          component={OrderHistoryDetailsScreen}
        />
        <SidebarStack.Screen
          options={{ headerShown: false }}
          name="Notifications"
          component={NotificationsScreen}
        />
        <SidebarStack.Screen
          options={{ headerShown: false }}
          name="Profile"
          component={ProfileScreen}
        />
        <SidebarStack.Screen
          options={{ headerShown: false }}
          name="MyWallet"
          component={MyWalletScreen}
        />
        <SidebarStack.Screen
          options={{ headerShown: false }}
          name="MyVehicles"
          component={MyVehicleScreen}
        />
        <SidebarStack.Screen
          options={{ headerShown: false }}
          name="SupportCenter"
          component={SupportCenterScreen}
        />
        <SidebarStack.Screen
          options={{ headerShown: false }}
          name="FChat"
          component={FChatScreen}
        />
        <SidebarStack.Screen
          options={{ headerShown: false }}
          name="Settings"
          component={SettingsScreen}
        />
      </SidebarStack.Navigator>
      <FFToast
        disabledClose
        onAccept={handleAcceptOrder}
        onReject={() => setIsShowIncomingOrderToast(false)}
        onClose={() => setIsShowIncomingOrderToast(false)}
        visible={isShowIncomingOrderToast}
        isApprovalType
      >
        <FFText>Incoming Order</FFText>
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <FFText fontSize="sm" fontWeight="500">
              Total:
            </FFText>
            <FFText fontSize="sm" fontWeight="600" style={{ color: "#63c550" }}>
              ${latestOrder?.total_amount}
            </FFText>
          </View>
          <View className="flex-row items-center gap-1">
            <FFText fontSize="sm" fontWeight="600">
              {latestOrder?.order_items?.length || 0}
            </FFText>
            <FFText fontSize="sm" fontWeight="500" style={{ color: "#63c550" }}>
              items
            </FFText>
          </View>
        </View>
      </FFToast>
    </>
  );
};

interface Order {
  _id: string;
  customer_id: string;
  total_amount: number | string;
  status: string;
  order_items?: any[];
}

// Auth Navigator (Login/Signup)
const AuthNavigator = () => (
  <AuthStack.Navigator initialRouteName="Login">
    <AuthStack.Screen
      name="Login"
      component={LoginScreen}
      options={{ headerShown: false }}
    />
    <AuthStack.Screen
      name="Signup"
      component={SignupScreen}
      options={{ headerShown: false }}
    />
  </AuthStack.Navigator>
);

// Main entry point to decide which navigator to show
const App = () => {
  const { isAuthenticated, accessToken } = useSelector(
    (state: RootState) => state.auth
  );
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
    <RootStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={accessToken ? "Main" : "Auth"}
    >
      <RootStack.Screen name="Main" component={MainNavigator} />
      <RootStack.Screen name="Auth" component={AuthNavigator} />
    </RootStack.Navigator>
  );
};

export default App;
