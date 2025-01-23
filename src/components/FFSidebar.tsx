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
import { NavigationProp, RootStackParamList, ScreenNames } from "../navigation/AppNavigator";

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

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

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

  // Slide the sidebar out when the visibility changes
  const sidebarTranslate = isvisible ? translateX : new Animated.Value(300); // Sidebar hidden when not visible

    const navigation = useNavigation<NavigationProp>()

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
            <FFAvatar onPress={() => navigation.navigate('Profile')} size={80} />
            <View>
              <FFText style={{ fontSize: 18 }}>Tommy Teo</FFText>
              <FFText style={{ color: "#ccc", fontSize: 14 }}>
                +84 707171164
              </FFText>
            </View>
            <View style={{ width: "100%", alignItems: "center" }}>
              <FFBadge
                title="Edit Profile"
                backgroundColor="#63c550"
                textColor="#fff"
                rounded={"sm"}
                 onPress={() => navigation.navigate('Profile')}
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
          style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}
          onPress={() => navigation.navigate(item.screen as ScreenNames)}  // Call navigation.navigate() directly
        >
          {item.icon}
          <Text style={{ fontSize: 16 }}>{item.title}</Text>
        </TouchableOpacity>
      ))}
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
