import React from "react";
import { View, TouchableOpacity } from "react-native";
import FFText from "@/src/components/FFText";
import { Ionicons } from "@expo/vector-icons";
import { StageDetails } from "@/src/store/currentDriverProgressStageSlice";
import { PickupAndDropoffStage } from "../utils/functions/filters";
import FFAvatar from "./FFAvatar";

interface FloatingStageProps {
  stage: PickupAndDropoffStage | null; // Allow null for cases where no stage is active
  onNavigate: () => void;
}

const FloatingStage: React.FC<FloatingStageProps> = ({ stage, onNavigate }) => {
  if (!stage) return null; // Render nothing if no stage is active

  return (
    <View
      style={{
        position: "absolute",
        top: 12,
        gap: 12,
        backgroundColor: "#fff",
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignSelf: "center", // Căn giữa ngang
        width: "90%", // Chiếm 90% chiều rộng
        borderRadius: 8, // Bo góc nhẹ
        shadowColor: "#000", // Shadow cho iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5, // Shadow cho Android
      }}
    >
      {/* Left Section */}
      <View className="flex-row items-center flex-1 gap-2">
        <FFAvatar size={30} />
        <View style={{ width: "80%" }}>
          <FFText>{stage.name}</FFText>
          <FFText fontSize="sm" fontWeight="400">
            {stage.address || "Unknown Address"}
          </FFText>
        </View>
      </View>

      {/* Right Section */}
      <TouchableOpacity
        style={{ alignItems: "center", justifyContent: "center" }}
        onPress={onNavigate}
      >
        <View
          style={{ width: 20, aspectRatio: 1, borderColor: "#a3c9f1" }}
          className="rounded-full items-center justify-center border"
        >
          <Ionicons name="navigate-outline" size={12} color="#3B82F6" />
        </View>
        <FFText fontWeight="400" fontSize="sm" style={{ color: "#7fa9e7" }}>
          Navigate
        </FFText>
      </TouchableOpacity>
    </View>
  );
};

export default FloatingStage;
