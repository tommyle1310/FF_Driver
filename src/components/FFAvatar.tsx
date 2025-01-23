import { View, Image, StyleSheet, Pressable, StyleProp, ViewStyle } from "react-native";
import React from "react";
import FFText from "./FFText";

type FFAvatarProps = {
  size?: number;
  avatar?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>; // Accepting the style prop
};

const FFAvatar = ({ size = 60, avatar, onPress = () => {}, style }: FFAvatarProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          width: size,
          height: size,
          borderRadius: 9999, // Makes it a circle
          overflow: 'hidden', // Ensures the image is clipped to the circle
        },
        !avatar ? { backgroundColor: '#efcb13' } : {}, // Use conditional styling
        style, // Apply the custom style passed as a prop
      ]}
    >
      {avatar ? (
        <Image
          source={{ uri: avatar }} // Set the avatar URL as the image source
          style={{ width: '100%', height: '100%' }} // Ensure the image fills the entire container
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {/* Placeholder or fallback content, such as a letter or icon */}
          <FFText style={{ color: '#fff' }}>F</FFText>
        </View>
      )}
    </Pressable>
  );
};

export default FFAvatar;
