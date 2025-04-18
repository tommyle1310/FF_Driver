import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
  LayoutAnimation,
} from "react-native";
import { useTheme } from "@/src/hooks/useTheme";
import IconIonicon from "react-native-vector-icons/Ionicons";
import FFText from "./FFText";
import FFButton from "./FFButton";
import { spacing } from "../theme";

interface FFToastProps {
  visible: boolean;
  onClose: () => void;
  disabledClose?: boolean;
  variant?: "SUCCESS" | "DANGER" | "INFO" | "WARNING";
  isApprovalType?: boolean;
  duration?: number;
  title: string;
  children: React.ReactNode; // Includes detailed content and buttons for isApprovalType
  onAccept?: () => void;
  onReject?: () => void;
}

const FFToast: React.FC<FFToastProps> = ({
  visible,
  onClose,
  disabledClose = false,
  variant = "INFO",
  isApprovalType = false,
  duration = 100000,
  title,
  children,
  onAccept,
  onReject,
}) => {
  const { theme } = useTheme();
  const [show, setShow] = useState(visible);
  const [isExpanded, setIsExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;

  // Variant-based styling
  const variantStyles = {
    SUCCESS: {
      icon: "checkmark-circle",
      iconColor: "#4CAF50",
      borderColor: "#4CAF50",
      buttonColor: "#4CAF50",
    },
    DANGER: {
      icon: "close-circle",
      iconColor: "#F44336",
      borderColor: "#F44336",
      buttonColor: "#F44336",
    },
    INFO: {
      icon: "information-circle",
      iconColor: "#2196F3",
      borderColor: "#2196F3",
      buttonColor: "#2196F3",
    },
    WARNING: {
      icon: "warning",
      iconColor: "#FF9800",
      borderColor: "#FF9800",
      buttonColor: "#FF9800",
    },
  };

  const currentVariant = variantStyles[variant];

  // Slide animation for show/hide
  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timeout = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -120,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onClose();
        });
      }, duration);

      return () => clearTimeout(timeout);
    } else {
      setShow(false);
      setIsExpanded(false);
    }
  }, [visible, slideAnim, duration, onClose]);

  // Expand/Collapse animation
  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, heightAnim]);

  if (!show) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: theme === "light" ? "#fff" : "#2D2D2D",
          borderColor: currentVariant.borderColor,
          transform: [{ translateY: slideAnim }],
          shadowColor: theme === "light" ? "#000" : currentVariant.borderColor,
        },
      ]}
    >
      <Pressable
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setIsExpanded(!isExpanded);
        }}
        style={styles.contentWrapper}
      >
        <View
          style={[
            styles.leftBorder,
            { backgroundColor: currentVariant.borderColor },
          ]}
        />
        <View style={styles.iconContainer}>
          <IconIonicon
            name={currentVariant.icon}
            size={24}
            color={currentVariant.iconColor}
          />
        </View>
        <View style={styles.textContainer}>
          <FFText
            fontSize="md"
            style={{ color: theme === "light" ? "#333" : "#fff" }}
          >
            {title}
          </FFText>
          <Animated.View
            style={{
              height: heightAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 120], // Increased height for buttons
              }),
              opacity: heightAnim,
              overflow: "hidden",
              marginTop: isExpanded ? 8 : 0,
            }}
          >
            <View style={styles.expandedContent}>{children}</View>
            <View
              style={{
                flexDirection: "row",
                gap: spacing.sm,
              }}
            >
              <FFButton
                variant="outline"
                className="w-full"
                style={{ flex: 1 }}
              >
                Reject
              </FFButton>
              <FFButton
                onPress={onAccept}
                variant="primary"
                className="w-full"
                style={{ flex: 1 }}
              >
                Accept
              </FFButton>
            </View>
          </Animated.View>
        </View>
      </Pressable>

      {/* {!disabledClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <IconIonicon
            name="close"
            size={20}
            color={theme === "light" ? "#666" : "#ccc"}
          />
        </TouchableOpacity>
      )} */}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 50,
    left: "5%",
    right: "5%",
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    zIndex: 9999,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  leftBorder: {
    width: 4,
    height: "100%",
    borderRadius: 4,
    marginRight: 8,
  },
  iconContainer: {
    marginRight: 8,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  expandedContent: {
    paddingBottom: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default FFToast;
