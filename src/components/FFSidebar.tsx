import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
} from "react-native";
import { useTheme } from "../hooks/useTheme";
import FFAvatar from "./FFAvatar";
import FFText from "./FFText";
import FFBadge from "./FFBadge";
import { data_sidebar } from "../data/components/data_sidebar";
import { useNavigation } from "@react-navigation/native";
import { ScreenNames } from "../navigation/AppNavigator";
import { StackNavigationProp } from "@react-navigation/stack";
import { useDispatch, useSelector } from "../store/types";
import { RootState } from "../store/store";
import FFToggle from "./FFToggle";
import { loadTokenFromAsyncStorage } from "../store/authSlice";
import { toggleAvailability } from "../store/availabilitySlice";
import DebugLogExporter from "./DebugLogExporter";
import { colors, spacing } from "../theme";
import FFView from "./FFView";
// import {  RootStackParamList,  } from "../navigation/AppNavigator";

type NavigationProp = StackNavigationProp<any, "Main">;

// Receive navigation prop
const FFSidebar = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [isvisible, setIsVisible] = useState(visible); // Controls the visibility of the sidebar and overlay
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true); // Loading state

  const dps = useSelector(
    (state: RootState) => state.currentDriverProgressStage
  );

  const dispatch = useDispatch();
  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);
  const { available_for_work, avatar, contact_phone, first_name, last_name } =
    useSelector((state: RootState) => state.auth);
    console.log('cehck avaialbel for D', available_for_work)
  // Set the initial position of the sidebar off-screen to the right
  const translateX = new Animated.Value(0); // Start in view

  // PanResponder to handle the drag gesture
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (e, gestureState) => {
      // Move the sidebar to the right (toward closing) as we drag
      if (gestureState.dx >= 0) {
        translateX.setValue(gestureState.dx);
      }
    },
    onPanResponderRelease: (e, gestureState) => {
      // If dragged more than 150px to the right, close the sidebar
      if (gestureState.dx > 50) {
        closeSidebar();
      } else {
        // Otherwise, animate back to the initial position (in view)
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  // Function to close the sidebar (move it off-screen to the right)
  const closeSidebar = () => {
    Animated.spring(translateX, {
      toValue: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onClose();
    });
  };

  useEffect(() => {
    const loadToken = async () => {
      await dispatch(loadTokenFromAsyncStorage()); // Load token from AsyncStorage
      setLoading(false); // Set loading to false after token is loaded
    };
    loadToken();
  }, [dispatch]);

  // Slide the sidebar out when the visibility changes
  const sidebarTranslate = isvisible ? translateX : new Animated.Value(300); // Sidebar hidden when not visible

  const navigation = useNavigation<NavigationProp>();

  const hasNoTasks = !dps.id || !dps.orders?.length || !dps.stages.length;

  return (
    <TouchableWithoutFeedback onPress={closeSidebar}>
      <Animated.View
        style={[styles.overlay, { display: isvisible ? "flex" : "none" }]}
      >
        <TouchableWithoutFeedback>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.modalContainer,
              {
                backgroundColor: theme === "light" ? "white" : "#000",
                transform: [{ translateX: sidebarTranslate }],
              },
            ]}
          >
            <FFAvatar
              avatar={avatar?.url}
              onPress={() => navigation.navigate("Profile")}
              size={80}
            />
            <View>
              <FFText style={{ fontSize: 18 }}>
                {first_name || "Flashfood"} {last_name || "Driver"}
              </FFText>
              <FFText style={{ color: "#ccc", fontSize: 14 }}>
                {contact_phone?.find((item) => item?.number)?.number}
              </FFText>
            </View>
            <View style={{ width: "100%", alignItems: "center", gap: 20 }}>
              <FFToggle
                value={available_for_work ? true : false}
                onChange={() => {
                  if (!loading) {
                    dispatch(toggleAvailability()); // Call the function properly via dispatch
                  }
                }}
                label="Status"
              />
            </View>
            <View
              style={{
                flex: 1,
                borderTopWidth: 1,
                marginVertical: 20,
                paddingVertical: 30,
                paddingHorizontal: 20,
                borderColor: "#ccc",
                width: "100%",
              }}
            >
              {data_sidebar.map((item) => (
                <TouchableOpacity
                  key={item.title}
                  style={{
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onPress={() =>
                    navigation.navigate(item.screen as ScreenNames)
                  } // Call navigation.navigate() directly
                >
                  {item.icon}
                  <FFText style={{ fontSize: 16 }}>{item.title}</FFText>
                  {!hasNoTasks &&
                    dps?.stages &&
                    dps?.stages?.length > 0 &&
                    dps?.stages?.length <= 16 &&
                    item.title === "My tasks" && (
                      <FFView
                        style={{
                          backgroundColor: colors.warning,
                          alignItems: "center",
                          justifyContent: "center",
                          display: "flex",
                          padding: 2,
                          paddingHorizontal: spacing.sm,
                          borderRadius: spacing.md,
                        }}
                      >
                        <FFText style={{ color: colors.white }}>
                          {dps?.stages?.length === 5
                            ? "1"
                            : dps?.stages?.length === 10
                            ? "2"
                            : "3"}{" "}
                        </FFText>
                      </FFView>
                    )}
                </TouchableOpacity>
              ))}

              {/* Debug Log Exporter - Only show in development */}
              {/* {__DEV__ && <DebugLogExporter />} */}
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center", // Vertically center the modal
    alignItems: "center", // Horizontally center the modal
    position: "absolute", // Make sure it's positioned relative to the screen
    left: 0,
    right: 0,
    backgroundColor: "rgba(1, 0, 0, 0.3)",
    top: 0,
    bottom: 0,
    zIndex: 1, // Ensure it's below the SlideUpModal
  },
  modalContainer: {
    width: "60%",
    position: "absolute",
    right: 0,
    top: 0,
    height: "100%",
    gap: 10,
    padding: 10,
    borderTopStartRadius: 16,
    borderBottomStartRadius: 16,
    alignItems: "center",
  },
});

export default FFSidebar;
