import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions, Animated } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import IconFeather from "react-native-vector-icons/Feather";
import FFText from "./FFText";

const SWIPER_WIDTH = 60;

interface FFSwipeProps {
  onSwipe: () => void; // Callback when swipe reaches the edge
  direction: "left" | "right"; // Direction of the swipe
}

const FFSwipe: React.FC<FFSwipeProps> = ({ onSwipe, direction }) => {
  const [translateX] = useState(new Animated.Value(0)); // Track swipe translation in X (default at 0)
  const [swipeEdgeReached, setSwipeEdgeReached] = useState(false); // Track if swipe has reached edge
  const screenWidth = Dimensions.get("window").width; // Get screen width to know when to trigger onSwipe
  const [swipedDirection, setSwipedDirection] = useState<
    "left" | "right" | null
  >(null); // Track the swipe direction

  // Gesture handler for swipe event
  const onGestureEvent = (event: any) => {
    const { translationX } = event.nativeEvent;

    if (swipedDirection) return; // If swipe has already been completed, prevent further gestures

    // Limit the swipe translation to the screen edges and adjust with SWIPER_WIDTH
    if (direction === "left") {
      translateX.setValue(Math.min(translationX, screenWidth - SWIPER_WIDTH)); // Limit to left edge
    } else if (direction === "right") {
      translateX.setValue(
        Math.max(translationX, -(screenWidth - SWIPER_WIDTH))
      ); // Limit to right edge
    }
  };

  // Gesture handler when gesture ends
  const onHandlerStateChange = (event: any) => {
    const { translationX, state } = event.nativeEvent;

    // Trigger onSwipe if the gesture has ended and translationX is within 50px of the edge
    if (state === 5) {
      // 5 indicates that the gesture has ended
      if (swipedDirection) return; // If swipe is already completed, prevent further actions

      // Check if swipe has reached the edge
      if (Math.abs(translationX) >= screenWidth - (SWIPER_WIDTH + 50)) {
        setSwipeEdgeReached(true); // Mark swipe as reaching the edge
        onSwipe(); // Trigger onSwipe when swipe reaches the edge

        // Move the swiper to the edge based on the direction
        Animated.spring(translateX, {
          toValue:
            direction === "left"
              ? -(screenWidth - SWIPER_WIDTH)
              : screenWidth - SWIPER_WIDTH - 24,
          useNativeDriver: true,
        }).start();

        // Set the swiped direction to prevent reversal
        setSwipedDirection(direction);
      } else {
        setSwipeEdgeReached(false); // Reset if swipe is not at the edge

        // Reset the position if the swipe doesn't reach the edge
        Animated.spring(translateX, {
          toValue: 0, // Return to default position (0)
          useNativeDriver: true,
        }).start();
      }
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent} // Tracking the gesture movement
      onHandlerStateChange={onHandlerStateChange} // When the gesture ends
    >
      <Animated.View
        style={[
          styles.swipeableContainer,
          { transform: [{ translateX }] },
          swipeEdgeReached && styles.reachedEdge, // Apply additional style if swipe reached edge
        ]}
      >
        <IconFeather
          name="chevrons-right"
          size={32}
          color={swipeEdgeReached ? "#111" : "#4caf50"}
        />
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  swipeableContainer: {
    width: SWIPER_WIDTH,
    padding: 4,
    backgroundColor: "#fff",
    aspectRatio: 1, // Ensure square aspect ratio
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#4CAF50",
    fontSize: 14,
  },
  reachedEdge: {
    backgroundColor: "#bbb", // Change color to indicate that the edge is reached
  },
});

export default FFSwipe;
