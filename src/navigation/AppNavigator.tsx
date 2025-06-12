import React, { useCallback, useEffect, useState } from "react";
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
import { useSocket, TipReceivedData } from "../hooks/useSocket";
import { sendPushNotification } from "../utils/functions/pushNotification";
import { Type_PushNotification_Order } from "../types/pushNotification";
import FFToast from "../components/FFToast";
import FFText from "../components/FFText";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Enum_PaymentMethod, Enum_TrackingInfo } from "../types/Orders";
import { Enum_PaymentStatus } from "../types/Orders";
import MyVehicleScreen from "@/screens/MyVehicleScreen";
import FChatScreen from "@/screens/FChatScreen";
import OrderHistoryDetailsScreen from "@/screens/OrderHistoryDetails";
import { io } from "socket.io-client";
import { BACKEND_URL } from "../utils/constants";
import Spinner from "../components/FFSpinner";
import RatingScreen from "@/screens/RatingScreen";
import { Avatar } from "../types/common";
import ChangePasswordScreen from "@/screens/ChangePasswordScreen";
import { SocketProvider } from "../hooks/SocketContext";
import { borderRadius, colors, spacing, typography } from "../theme";
import axiosInstance from "../utils/axiosConfig";
import FFInputControl from "../components/FFInputControl";
import FFModal from "../components/FFModal";
import FFView from "../components/FFView";

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
  Home: { emitUpdateDps?: (data: any) => void };
  MyTasks: undefined;
  TrackHistory: undefined;
  Rating: {
    customer1: {
      id: string;
      avatar: Avatar;
    };
    restaurant1: {
      id: string;
      avatar: Avatar;
    };
    customer2?: {
      id: string;
      avatar: Avatar;
    };
    restaurant2?: {
      id: string;
      avatar: Avatar;
    };
    customer3?: {
      id: string;
      avatar: Avatar;
    };
    restaurant3?: {
      id: string;
      avatar: Avatar;
    };
    orderId?: string;
  };
  Statistics: undefined;
  Notifications: undefined;
  Profile: undefined;
  MyWallet: undefined;
  SupportCenter: undefined;
  Settings: undefined;
  MyVehicles: undefined;
  ChangePassword: undefined;
  FChat: {
    withUserId?: string;
    type?: "SUPPORT" | "ORDER";
    orderId?: string;
  };
  OrderHistoryDetails: {
    dpsId: string;
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
  | "ChangePassword"
  | "FChat";

const MainNavigator = () => {
  const { driverId } = useSelector((state: RootState) => state.auth);
  const [selectedLocation] = useState({
    lat: 10.826411,
    lng: 106.617353,
  });
  const [latestOrder, setLatestOrder] =
    useState<Type_PushNotification_Order | null>(null);
  const [orders, setOrders] = useState<Type_PushNotification_Order[]>([]);
  const [isShowToast, setIsShowToast] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tip notification state
  const [latestTip, setLatestTip] = useState<TipReceivedData | null>(null);
  const [isShowTipToast, setIsShowTipToast] = useState(false);

  const { expoPushToken } = usePushNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const pushToken = expoPushToken as unknown as { data: string };

  const [reason, setReason] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: "", subtitle: "" });
  const [selectedCancelledOrderId, setSelectedCancelledOrderId] = useState<
    string | null
  >(null);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);

  const showModal = useCallback((title: string, subtitle: string) => {
    setModalMessage({ title, subtitle });
    setModalVisible(true);
    const timeout = setTimeout(() => {
      setModalVisible(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  const handleSubmitReject = useCallback(async () => {
    // Check if we have either selectedCancelledOrderId OR latestOrder.id
    const orderId = selectedCancelledOrderId || latestOrder?.id;
    console.log("echck orderId", orderId);

    if (!orderId) {
      console.error("No order ID selected for cancellation");
      alert("No order selected");
      return;
    }

    if (!reason || !title || !description) {
      console.error("All cancellation fields are required");
      alert("Please fill in all fields");
      return;
    }

    const requestBody = {
      cancelled_by: "driver" as const,
      cancelled_by_id: driverId,
      reason,
      title,
      description,
    };

    try {
      setLoading(true);
      const response = await axiosInstance.post(
        `/orders/${orderId}/cancel`,
        requestBody
      );
      console.log("Reject order response:", response.data);
      if (response.data.EC === 0) {
        setIsRejectModalVisible(false);
        setReason("");
        setTitle("");
        setDescription("");
        setSelectedCancelledOrderId(null);
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
      alert("Failed to reject order");
    } finally {
      setLoading(false);
    }
  }, [
    driverId,
    reason,
    title,
    description,
    latestOrder,
    selectedCancelledOrderId,
    showModal,
  ]);

  const sendPushNotification = (order: Type_PushNotification_Order) => {
    console.log("Sending push notification:", {
      order,
      expoPushToken: pushToken,
    });
    // Implement push notification logic
  };

  const { emitDriverAcceptOrder } = useSocket(
    driverId || "",
    setOrders,
    sendPushNotification,
    setLatestOrder,
    setIsShowToast,
    setLatestTip,
    setIsShowTipToast
  );

  useEffect(() => {
    if (!selectedCancelledOrderId) {
      return;
    }
    setIsRejectModalVisible(true);
  }, [selectedCancelledOrderId]);

  if (loading) return <Spinner isVisible isOverlay />;

  return (
    <SocketProvider
      driverId={driverId ?? "FF_DRI_63b92bcb-c9ce-4331-b87f-0919f71887a1"} // Use FF_DRI_
      setOrders={setOrders}
      sendPushNotification={sendPushNotification}
      setLatestOrder={setLatestOrder}
      setIsShowToast={setIsShowToast}
    >
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
          name="Rating"
          component={RatingScreen}
        />
        <SidebarStack.Screen
          options={{ headerShown: false }}
          name="TrackHistory"
          component={TrackHistoryScreen}
        />
        <SidebarStack.Screen
          options={{ headerShown: false }}
          name="ChangePassword"
          component={ChangePasswordScreen}
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
      <Spinner isVisible={isLoading} isOverlay />
      <FFToast
        // onTimeout={handleSubmitReject}
        title="Incoming Order"
        disabledClose
        variant="SUCCESS"
        onAccept={() => {
          if (!latestOrder || !driverId) return;
          setIsLoading(true);
          // Handle accept via useSocketContext in HomeScreen
          console.log("Accept order triggered", {
            orderId: latestOrder.id,
            driverId,
            restaurantLocation: selectedLocation,
          });
          emitDriverAcceptOrder({ driverId, orderId: latestOrder?.id });
          setIsLoading(false);
          setIsShowToast(false);
        }}
        onReject={() => {
          setIsShowToast(false);
          setSelectedCancelledOrderId(latestOrder?.id ?? null);
        }}
        onClose={() => setIsShowToast(false)}
        visible={isShowToast}
        isApprovalType
      >
        <View
          style={{
            gap: 16,
          }}
        >
          {/* Order Metrics Row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Earnings */}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <View
                style={{
                  backgroundColor: "#f0f9ff",
                  borderRadius: 8,
                  padding: 6,
                }}
              >
                <MaterialIcons name="attach-money" size={16} color="#63c550" />
              </View>
              <View>
                <FFText
                  fontSize="sm"
                  fontWeight="400"
                  style={{ color: "#666", marginBottom: 2 }}
                >
                  Earnings
                </FFText>
                <FFText
                  fontSize="md"
                  fontWeight="700"
                  style={{ color: "#1a1a1a" }}
                >
                  ${latestOrder?.driver_earn?.toFixed(2) ?? "0.00"}
                </FFText>
              </View>
            </View>

            {/* Items */}
          </View>
          {/* Distance */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                backgroundColor: "#f0f9ff",
                borderRadius: 8,
                padding: 6,
              }}
            >
              <MaterialIcons name="navigation" size={16} color="#2196F3" />
            </View>
            <View>
              <FFText
                fontSize="sm"
                fontWeight="400"
                style={{ color: "#666", marginBottom: 2 }}
              >
                Distance
              </FFText>
              <FFText
                fontSize="md"
                fontWeight="700"
                style={{ color: "#1a1a1a" }}
              >
                {latestOrder?.distance?.toFixed(1) ?? "0.0"} km
              </FFText>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                backgroundColor: "#f0f9ff",
                borderRadius: 8,
                padding: 6,
              }}
            >
              <MaterialIcons name="shopping-bag" size={16} color="#FF9800" />
            </View>
            <View>
              <FFText
                fontSize="sm"
                fontWeight="400"
                style={{ color: "#666", marginBottom: 2 }}
              >
                Items
              </FFText>
              <FFText
                fontSize="md"
                fontWeight="700"
                style={{ color: "#1a1a1a" }}
              >
                {latestOrder?.order_items?.length || 0}
              </FFText>
            </View>
          </View>
        </View>
      </FFToast>

      {/* Tip Received Toast */}
      <FFToast
        duration={10000}
        title="Tip Received! 🎉"
        variant="SUCCESS"
        visible={isShowTipToast}
        onClose={() => setIsShowTipToast(false)}
        disabledClose={false}
      >
        <View style={{ gap: 12, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                backgroundColor: "#f0f9ff",
                borderRadius: 8,
                padding: 8,
              }}
            >
              <MaterialIcons name="monetization-on" size={24} color="#63c550" />
            </View>
            <View>
              <FFText
                fontSize="lg"
                fontWeight="700"
                style={{ color: "#1a1a1a", marginBottom: 4 }}
              >
                +${latestTip?.tipAmount?.toFixed(2) ?? "0.00"}
              </FFText>
              <FFText fontSize="sm" fontWeight="400" style={{ color: "#666" }}>
                Total Tips: ${latestTip?.tipAmount?.toFixed(2) ?? "0.00"}
              </FFText>
            </View>
          </View>

          <FFText
            fontSize="sm"
            fontWeight="400"
            style={{ color: "#555", textAlign: "center" }}
          >
            {latestTip?.message ?? "You received a tip!"}
          </FFText>
        </View>
      </FFToast>

      <FFModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <FFView style={styles.toastModal}>
          <FFText style={styles.toastText}>{modalMessage.title}</FFText>
          <FFText style={styles.toastText}>{modalMessage.subtitle}</FFText>
        </FFView>
      </FFModal>
      <FFModal
        visible={isRejectModalVisible}
        onClose={() => {
          setIsRejectModalVisible(false);
          setReason("");
          setTitle("");
          setDescription("");
          setSelectedCancelledOrderId(null);
        }}
      >
        <FFText
          style={{
            fontSize: typography.fontSize.lg,
            fontFamily: typography.fontFamily.bold,
            marginBottom: spacing.md,
          }}
        >
          Reject Order
        </FFText>
        <FFInputControl
          label="Reason"
          value={reason}
          setValue={(value) => setReason(value)}
          placeholder="Enter reason for cancellation"
        />
        <FFInputControl
          label="Title"
          value={title}
          setValue={(value) => setTitle(value)}
          placeholder="Enter cancellation title"
        />
        <FFInputControl
          label="Description"
          value={description}
          setValue={(value) => setDescription(value)}
          placeholder="Enter detailed description"
        />
        <TouchableOpacity
          style={{
            backgroundColor: "#63c550",
            padding: spacing.md,
            borderRadius: 8,
            alignItems: "center",
            marginTop: spacing.md,
          }}
          onPress={handleSubmitReject}
        >
          <FFText
            style={{
              color: "#fff",
              fontSize: typography.fontSize.md,
              fontFamily: typography.fontFamily.medium,
            }}
          >
            Submit
          </FFText>
        </TouchableOpacity>
      </FFModal>
    </SocketProvider>
  );
};

interface Order {
  id: string;
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

const styles = StyleSheet.create({
  toastModal: {
    padding: spacing.md,
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
    alignItems: "center",
  },
  toastText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
});

export default App;
