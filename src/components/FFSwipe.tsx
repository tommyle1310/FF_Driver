import React, { useState, useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import IconFeather from "react-native-vector-icons/Feather";

const SWIPER_WIDTH = 50;

interface FFSwipeProps {
  onSwipe: () => void;
  direction: "left" | "right";
  reset?: boolean;
}

const FFSwipe: React.FC<FFSwipeProps> = ({ onSwipe, direction, reset }) => {
  const [translateX] = useState(new Animated.Value(0));
  const [swipeEdgeReached, setSwipeEdgeReached] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [swipedDirection, setSwipedDirection] = useState<
    "left" | "right" | null
  >(null);

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  useEffect(() => {
    if (reset) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      setSwipeEdgeReached(false);
      setSwipedDirection(null);
    }
  }, [reset, translateX]);

  const onGestureEvent = (event: any) => {
    const { translationX } = event.nativeEvent;
    if (swipedDirection || containerWidth === 0) return;

    if (direction === "left") {
      translateX.setValue(
        Math.min(translationX, containerWidth - SWIPER_WIDTH)
      );
    } else if (direction === "right") {
      translateX.setValue(
        Math.max(translationX, -(containerWidth - SWIPER_WIDTH))
      );
    }
  };

  const onHandlerStateChange = (event: any) => {
    const { translationX, state } = event.nativeEvent;
    if (state === 5 && containerWidth > 0) {
      if (swipedDirection) return;

      if (Math.abs(translationX) >= containerWidth - (SWIPER_WIDTH + 50)) {
        setSwipeEdgeReached(true);
        onSwipe();

        Animated.spring(translateX, {
          toValue:
            direction === "left"
              ? -(containerWidth - SWIPER_WIDTH)
              : containerWidth - SWIPER_WIDTH,
          useNativeDriver: true,
        }).start();

        setSwipedDirection(direction);
      } else {
        setSwipeEdgeReached(false);
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  return (
    <View onLayout={handleLayout} style={{ width: "100%" }}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.swipeableContainer,
            { transform: [{ translateX }] },
            swipeEdgeReached && styles.reachedEdge,
          ]}
        >
          <IconFeather
            name="chevrons-right"
            size={32}
            color={swipeEdgeReached ? "#111" : "#4caf50"}
          />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeableContainer: {
    width: SWIPER_WIDTH,
    padding: 4,
    backgroundColor: "#fff",
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  reachedEdge: {
    backgroundColor: "#bbb",
  },
});

export default FFSwipe;
