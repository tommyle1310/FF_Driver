import {
  View,
  Image,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
} from "react-native";
import React from "react";
import FFText from "./FFText";
import { IMAGE_LINKS } from "../assets/imageLinks";

type FFAvatarProps = {
  size?: number;
  avatar?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  rounded?: "full" | "sm" | "md" | "lg";
};

const FFAvatar = ({
  size = 60,
  avatar,
  onPress = () => {},
  style,
  rounded = "full",
}: FFAvatarProps) => {
  // Map for rounded options
  const roundedMap = {
    full: 9999,
    sm: 8,
    md: 16,
    lg: 24,
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
          borderRadius: radius,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Image
        source={{ uri: avatar || IMAGE_LINKS.DEFAULT_LOGO }}
        style={{ width: "100%", height: "100%" }}
      />
    </Pressable>
  );
};

export default FFAvatar;
