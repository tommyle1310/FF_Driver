import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useTheme } from "@/src/hooks/useTheme"; // Import your custom useTheme hook
import IconIonicon from "react-native-vector-icons/Ionicons";
import IconMaterialIcons from "react-native-vector-icons/MaterialIcons";
import FFText from "./FFText";

interface FFToastProps {
  visible: boolean;
  onClose: () => void;
  disabledClose?: boolean;
  variant?: "SUCCESS" | "DANGER" | "INFO";
  isApprovalType?: boolean;
  duration?: number; // Duration for how long the toast stays on screen (in ms)
  children: React.ReactNode; // Use children prop for customizable content
  onAccept?: () => void; // Callback for the Accept button
  onReject?: () => void; // Callback for the Reject button
}

const FFToast: React.FC<FFToastProps> = ({
  visible,
  onClose,
  disabledClose = false,
  children,
  variant = "INFO",
  isApprovalType = false,
  duration = 20000000, // Default duration is 3 seconds
  onAccept,
  onReject,
}) => {
  const { theme } = useTheme(); // Get the theme for dynamic styling

  const [show, setShow] = useState(visible);
  const slideAnim = useRef(new Animated.Value(-120)).current; // Start position above the screen

  // This will trigger the toast to show or hide
  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.timing(slideAnim, {
        toValue: 0, // Slide to 0 position (visible at the top of the screen)
        duration: 300, // Duration for sliding down
        useNativeDriver: true,
      }).start();

      // Hide the toast after the specified duration
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100, // Slide back up off the screen
          duration: 300, // Duration for sliding up
          useNativeDriver: true,
        }).start();
        setTimeout(() => {
          onClose(); // Close the toast after sliding up
        }, 300); // Wait for the slide-up animation to finish
      }, duration);
    } else {
      setShow(false);
    }
  }, [visible, slideAnim, duration, onClose]);

  if (!show) return null; // Don't render if not visible

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: theme === "light" ? "#fff" : "#333", // Theme-based background color
          transform: [{ translateY: slideAnim }], // Apply the sliding animation
          borderColor: "#a3d98f",
          borderWidth: 1,
          shadowColor: "#a3d98f",
          flexDirection: "row",
          gap: 8,
        },
      ]}
    >
      <View
        style={{ height: "100%", width: 5, backgroundColor: "#63c550" }}
      ></View>
      <IconMaterialIcons
        name="post-add"
        size={18}
        color={"#63c550"}
        style={{ marginTop: 12 }}
      />
      <View style={{ marginVertical: 8, flex: 1 }}>
        <View>{children}</View>
        <TouchableOpacity onPress={onReject}>
          {/* <IconIonicon name="close" style={styles.rejectIcon} /> */}
          <FFText fontSize="sm" style={{ color: "#ff4343" }}>
            Reject
          </FFText>
        </TouchableOpacity>
      </View>
      {isApprovalType && (
        <View
          style={{
            marginTop: 12,
            marginRight: 10,
          }}
        >
          <TouchableOpacity
            onPress={onAccept}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
              backgroundColor: "#E1F8E3",
            }}
          >
            {/* <IconIonicon name="checkmark" style={styles.acceptIcon} /> */}
            <FFText fontSize="sm" style={{ color: "#63c550" }}>
              Got It
            </FFText>
          </TouchableOpacity>
        </View>
      )}
      {/* Render the close button if not disabled */}
      {!disabledClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <IconIonicon name="close" style={styles.closeIcon} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 50, // Adjust the top position to be visible at the top of the screen
    left: "5%",
    right: "5%",
    overflow: "hidden",
    borderRadius: 6,
    zIndex: 9999, // Ensure the toast appears above other content
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 10, // Add shadow for iOS and Android elevation
  },
  toastContent: {
    flex: 1, // Allow the content to take available space
    color: "#fff", // Text color for the toast message
    fontSize: 16,
  },
  closeButton: {
    padding: 4,
    backgroundColor: "#E74C3C", // Red background for close button
    borderRadius: 50,
  },
  closeIcon: {
    color: "#fff", // White color for the icon
    fontSize: 18,
  },
  buttonContainer: {
    flexDirection: "row", // Align the buttons horizontally
    marginTop: 10, // Space between the content and buttons
  },
  acceptButton: {
    flexDirection: "row", // Align icon and text horizontally
    backgroundColor: "#4CAF50", // Green background for Accept button
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    width: "45%",
  },
  acceptIcon: {
    color: "#fff",
    fontSize: 18,
    marginRight: 5, // Space between icon and text
  },
  acceptText: {
    color: "#fff",
    fontSize: 16,
  },
  rejectButton: {
    flexDirection: "row", // Align icon and text horizontally
    backgroundColor: "#F44336", // Red background for Reject button
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: "45%",
    borderRadius: 5,
    marginRight: 10, // Space between Accept and Reject button
    justifyContent: "center",
    alignItems: "center",
  },
  rejectIcon: {
    color: "#fff",
    fontSize: 18,
    marginRight: 5, // Space between icon and text
  },
  rejectText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default FFToast;
