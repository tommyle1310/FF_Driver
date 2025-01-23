import React, { useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
  useAnimatedStyle,
  useAnimatedGestureHandler,
} from "react-native-reanimated";
import { useTheme } from "@/src/hooks/useTheme";
import FFText from "./FFText";
import IconIonicon from "react-native-vector-icons/Ionicons";


interface SlideUpModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const SlideUpModal: React.FC<SlideUpModalProps> = ({
  isVisible,
  onClose,
  children,
}) => {
  const { theme } = useTheme();
  const screenHeight = Dimensions.get("window").height;
  const translateY = useSharedValue(screenHeight); // Initially off-screen

  useEffect(() => {
    if (isVisible) {
      // Animate modal sliding up
      translateY.value = withTiming(0, {
        duration: 300, // Smooth duration for opening
        easing: Easing.out(Easing.ease),
      });
    } else {
      // Animate modal sliding down when not visible
      translateY.value = withTiming(screenHeight, {
        duration: 300, // Smooth duration for closing
        easing: Easing.in(Easing.ease),
      });
    }
  }, [isVisible]);

  // Use animated gesture handler for drag functionality
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      // Save the initial translation on start
      context.startY = translateY.value;
    },
    onActive: (event, context: any) => {
      // Update the translationY while dragging
      translateY.value = context.startY + event.translationY;
    },
    onEnd: (event) => {
      if (event.translationY > 100) {
        // Close modal when dragged down enough
        runOnJS(onClose)();
      } else {
        // If not dragged enough, reset the modal position
        translateY.value = withSpring(0, {
          damping: 30,
          stiffness: 200,
        });
      }
    },
  });

  // Animated styles for the modal
  const animatedModalStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      zIndex: 9999, // Ensure this modal is on top
    };
  });

  // Overlay touch event handler
  const handleOverlayPress = (event: any) => {
    // Prevent interaction with the background
    event.stopPropagation();
  };

  // Only render the modal if it is visible
  if (!isVisible) {
    return null; // Don't render the modal if it's not visible
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View
        style={[
          styles.overlay,
          
          {
            backgroundColor:
              theme === "light"
                ? "rgba(255, 255, 255, 0.8)"
                : "rgba(51, 51, 51, 0.8)", 
                width: Dimensions.get("window").width,
                marginLeft: -25
          },
        ]}
        onTouchStart={handleOverlayPress} // Block interaction with the background
      >
        <Animated.View
          style={[
            styles.modalContainer,
            animatedModalStyle,
            { backgroundColor: theme === "light" ? "#fff" : "#333" , width: Dimensions.get("window").width},
          ]}
        >
          <PanGestureHandler
            onGestureEvent={gestureHandler}
            onHandlerStateChange={gestureHandler}
          >
            <Animated.View style={styles.modalContent}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <IconIonicon name='close' style={{ color: 'white' }} size={16}/>
                          </TouchableOpacity>
              <View style={styles.content}>{children}</View>
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute", // Positioned over the entire screen
    top: -500,
    left: 0,
    right: 0,
    height: 1000,
    bottom: 0, // Ensure it covers the whole screen
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000, // Ensure it's on top of everything
  },
  modalContainer: {
    position: "absolute",
    bottom: 0, // Modal starts from the bottom
    height: "80%", // Modal height is now 80% of the screen height
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    zIndex: 9999, // Ensure it's on top of overlay
    paddingHorizontal: 20,
    borderColor: '#eee',
    borderWidth: 2,
    // Shadow properties for iOS with green color
    shadowColor: "rgba(0, 255, 0, 0.25)", // Green color with 25% opacity
    shadowOffset: { width: 0, height: -5 }, // Shadow position
    shadowOpacity: 1, // Opacity of the shadow
    shadowRadius: 10, // How blurry the shadow is

    // Shadow for Android (uses elevation)
    elevation: 10, // Elevation for Android shadow
  },
  modalContent: {
    flex: 1,
    justifyContent: "flex-start",
  },
  closeButton: {
    alignSelf: "flex-end",
    backgroundColor: "red",
    padding: 4,
    borderRadius: 9999,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  content: {
    marginTop: 20,
    flex: 1,
  },
});

export default SlideUpModal;
