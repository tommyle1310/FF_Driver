import React from "react";
import { View, TouchableOpacity } from "react-native";
import FFText from "@/src/components/FFText";
import FFButton from "@/src/components/FFButton";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "@/src/types/common";
import { PickupAndDropoffStage } from "@/src/utils/functions/filters";
import FFBadge from "../../FFBadge";
import FFAvatar from "../../FFAvatar";

interface AllStagesProps {
  stages: PickupAndDropoffStage[];
  onCall: (contactNumber: string) => void;
  onChange: () => void;
  handleGoNow?: () => void;
  selectedDestination: PickupAndDropoffStage | null; // Prop để biết stage nào đang được chọn
  setSelectedDestination: (stage: PickupAndDropoffStage | null) => void; // Prop để set stage được chọn
}

const AllStages: React.FC<AllStagesProps> = ({
  stages,
  onCall,
  onChange,
  selectedDestination,
  handleGoNow,
  setSelectedDestination,
}) => {
  // Hàm xử lý khi chọn stage
  const handleSelectStage = (stage: PickupAndDropoffStage) => {
    if (selectedDestination?.id === stage.id) {
      setSelectedDestination(null); // Bỏ chọn nếu đã chọn rồi
    } else {
      setSelectedDestination(stage); // Chọn stage mới
    }
    onChange(); // Gọi onChange để báo cho parent nếu cần
  };

  return (
    <View className="p-4 bg-white rounded-lg shadow-md">
      {/* Header Section */}
      <View style={{ marginBottom: 48 }}>
        <View className="flex-row justify-between items-center mb-4">
          <FFText className="text-lg font-bold">Total Earnings</FFText>
          <FFText className="text-lg font-bold">$35.6</FFText>
        </View>
        <View className="flex-row justify-between items-center mb-4">
          <FFText className="text-lg font-bold">Packages</FFText>
          <FFText className="text-lg font-bold">3</FFText>
        </View>
        <FFText className="text-sm text-gray-500 mb-4">
          Total distance: 478 km
        </FFText>
      </View>

      {/* Stages List */}
      {stages.map((stage, index) => (
        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderColor: stage.type === "PICKUP" ? "#63c550" : "#e60000",
            backgroundColor:
              stage.id === selectedDestination?.id
                ? stage.type === "PICKUP"
                  ? "#a3d98f"
                  : "#fb9393"
                : undefined,
          }}
          key={stage.id}
          onPress={() => handleSelectStage(stage)}
          className={`p-4 mb-4 rounded-lg`}
        >
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row gap-2">
              <FFAvatar size={40} avatar={stage?.avatar?.url} />
              <View style={{ alignItems: "flex-start", maxWidth: "80%" }}>
                <FFBadge
                  backgroundColor={
                    stage.type === "PICKUP" ? "#bff2b5" : "#eeafaf"
                  }
                >
                  <FFText
                    fontSize="sm"
                    style={{
                      color: stage.type === "PICKUP" ? "#63c550" : "#e60000",
                    }}
                  >
                    {stage.type === "PICKUP"
                      ? "Pick-up point"
                      : "Drop-off point"}
                  </FFText>
                </FFBadge>
                <FFText fontSize="sm" fontWeight="500">
                  {stage.address}
                </FFText>
              </View>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: "#fff",
                padding: 4,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 9999,
              }}
              onPress={() => onCall(stage.contactNumber)}
            >
              <Ionicons name="call-outline" size={20} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}

      {/* Go Now Button */}
      <FFButton
        variant={selectedDestination ? "primary" : "disabled"} // Chuyển variant dựa trên selectedDestination
        style={{ marginTop: 64 }}
        className="w-full"
        onPress={handleGoNow}
      >
        Go Now
      </FFButton>
    </View>
  );
};

export default AllStages;
