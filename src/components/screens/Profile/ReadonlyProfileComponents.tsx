import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import FFAvatar from "../../FFAvatar";
import FFText from "../../FFText";
import IconFontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";

const ReadonlyProfileComponents = ({
  toggleStatus,
  email,
  phone,
  dateJoined,
}: {
  toggleStatus: () => void;
  email?: string;
  phone: string;
  dateJoined?: string;
}) => {
  const { avatar } = useSelector((state: RootState) => state.auth);

  return (
    <View
      style={{ elevation: 10, borderWidth: 1, borderRadius: 10 }}
      className="bg-white gap-2 border-gray-200 p-4"
    >
      <View className="flex-row justify-between gap-4">
        <FFAvatar avatar={avatar?.url} />
        <View className="flex-1">
          <FFText fontSize="lg">Tommy Teo</FFText>
          <FFText fontWeight="400" style={{ color: "#aaa" }}>
            abc@gmail.com
          </FFText>
        </View>
        <TouchableOpacity
          onPress={toggleStatus}
          style={{
            backgroundColor: "#63c550",
            padding: 8, // You can adjust the padding as needed
            borderRadius: 50, // To make it round
            alignSelf: "flex-start", // Align to the start of the container
            flexShrink: 0, // Prevent it from shrinking
            justifyContent: "center", // Vertically center the content
            alignItems: "center", // Horizontally center the content
          }}
        >
          <IconFontAwesome5 name="user-edit" size={10} color="#eee" />
        </TouchableOpacity>
      </View>
      <View className="flex-row gap-2 items-center">
        <FFText style={{ color: "#aaa" }} fontWeight="400">
          Phone Number:
        </FFText>
        <FFText fontWeight="400">(+84) 707171164</FFText>
      </View>
      <View className="flex-row gap-2 items-center">
        <FFText style={{ color: "#aaa" }} fontWeight="400">
          Date Joined:
        </FFText>
        <FFText fontWeight="400">24/01/2025</FFText>
      </View>
    </View>
  );
};

export default ReadonlyProfileComponents;
