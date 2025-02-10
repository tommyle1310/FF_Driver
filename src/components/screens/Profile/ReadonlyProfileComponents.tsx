import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import FFAvatar from "../../FFAvatar";
import FFText from "../../FFText";
import IconFontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";

const ReadonlyProfileComponents = ({
  email,
  phone,
  toggleStatus,
}: {
  email: string;
  phone: string;
  toggleStatus: () => void;
}) => {
  const { avatar } = useSelector((state: RootState) => state.auth);

  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e5e5",
        padding: 16,
        gap: 8,
        elevation: 4,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <FFAvatar avatar={avatar?.url} />
        <View style={{ flex: 1 }}>
          <FFText fontSize="lg">Tommy Teo</FFText>
          <FFText style={{ fontWeight: "400", color: "#aaa" }}>{email}</FFText>
        </View>
        <TouchableOpacity
          onPress={toggleStatus}
          style={{
            backgroundColor: "#63c550",
            padding: 8,
            borderRadius: 50,
            alignSelf: "flex-start",
            flexShrink: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <IconFontAwesome5 name="user-edit" size={10} color="#eee" />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <FFText style={{ color: "#aaa" }} fontWeight="400">
          Phone Number:
        </FFText>
        <FFText fontWeight="400">{phone}</FFText>
      </View>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <FFText style={{ color: "#aaa" }} fontWeight="400">
          Date Joined:
        </FFText>
        <FFText fontWeight="400">24/01/2025</FFText>
      </View>
    </View>
  );
};

export default ReadonlyProfileComponents;
