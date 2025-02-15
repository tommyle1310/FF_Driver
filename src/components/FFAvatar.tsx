import {
  View,
  Image,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
} from "react-native";
import React from "react";
import FFText from "./FFText"; // Assuming FFText is a custom component

type FFAvatarProps = {
  size?: number; // Optional size, default is 60
  avatar?: string; // Avatar URL
  onPress?: () => void; // Optional onPress function for the avatar click
  style?: StyleProp<ViewStyle>; // Accepting the style prop
  rounded?: "full" | "sm" | "md" | "lg"; // Optional border radius type: full, sm, md, lg
};

const FFAvatar = ({
  size = 60,
  avatar,
  onPress = () => {},
  style,
  rounded = "full", // Default to full (circle)
}: FFAvatarProps) => {
  // Map for rounded options
  const roundedMap = {
    full: 9999, // Circle
    sm: 8, // Small corner radius
    md: 16, // Medium corner radius
    lg: 24, // Large corner radius
  };

  // Determine the border radius based on the prop
  const radius = roundedMap[rounded];

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius, // Apply the border radius
          overflow: "hidden", // Ensures the image is clipped to the radius
        },
        !avatar ? { backgroundColor: "#efcb13" } : {}, // Use a fallback background if no avatar
        style, // Apply the custom style passed as a prop
      ]}
    >
      {avatar ? (
        <Image
          source={{ uri: avatar }} // Set the avatar URL as the image source
          style={{ width: "100%", height: "100%" }} // Ensure the image fills the entire container
        />
      ) : (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          {/* Placeholder or fallback content, such as a letter or icon */}
          <FFText style={{ color: "#fff" }}>F</FFText>
        </View>
      )}
    </Pressable>
  );
};

export default FFAvatar;
