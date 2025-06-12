import React, { useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import FFText from "@/src/components/FFText";
import FFButton from "@/src/components/FFButton";
import { Ionicons } from "@expo/vector-icons";
import { PickupAndDropoffStage } from "@/src/utils/functions/filters";
import FFBadge from "../../FFBadge";
import FFAvatar from "../../FFAvatar";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import FFSeperator from "../../FFSeperator";
import FFSwipe from "../../FFSwipe";
import { colors } from "@/src/theme";

interface AllStagesProps {
  stages: PickupAndDropoffStage[];
  onCall: (contactNumber: string) => void;
  onChange: () => void;
  handleGoNow?: () => void;
  selectedDestination: PickupAndDropoffStage | null;
  setSelectedDestination: (stage: PickupAndDropoffStage | null) => void;
  // FFSwipe related props
  swipeText?: string;
  onSwipe?: () => void;
  isSwipeDisabled?: boolean;
  resetSwipe?: boolean;
}

const AllStages: React.FC<AllStagesProps> = ({
  stages,
  onCall,
  onChange,
  selectedDestination,
  handleGoNow,
  setSelectedDestination,
  swipeText = "",
  onSwipe,
  isSwipeDisabled = false,
  resetSwipe = false,
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

  useEffect(() => {
    if (!handleGoNow) return;
    handleGoNow();
  }, [selectedDestination]);

  const { total_earns, total_distance_travelled } = useSelector(
    (state: RootState) => state.currentDriverProgressStage
  );

  // Calculate total orders based on unique order IDs in stages
  const totalOrders = Math.ceil(stages.length / 2); // 2 stages (PICKUP, DROPOFF) per order

  return (
    <View className="p-4 bg-white rounded-lg shadow-md">
      {/* Header Section */}
      <View style={{ marginBottom: 48 }}>
        <View className="flex-row justify-between">
          <View className="flex-1 items-center mb-4">
            <FFText fontWeight="400">Total Earnings</FFText>
            <FFText style={{ color: colors.primary }}>
              ${total_earns || 0}
            </FFText>
          </View>
          <View className="flex-1 items-center mb-4">
            <FFText fontWeight="400">Total orders</FFText>
            <FFText style={{ color: colors.warning }}>{totalOrders}</FFText>
          </View>
          <View className="flex-1 items-center mb-4">
            <FFText fontWeight="400">Total distance:</FFText>
            <FFText style={{ color: colors.info }}>
              {total_distance_travelled || 0}km
            </FFText>
          </View>
        </View>
      </View>

      {/* Stages List */}
      {stages.map((stage) => (
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
                    {stage.type === "PICKUP" ? "Restaurant" : "Customer"}
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

      {/* FFSeperator and FFSwipe Section */}
      <View style={{ marginTop: 32 }}>
        <FFSeperator />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginTop: 12,
          }}
        >
          <View
            style={{
              backgroundColor: isSwipeDisabled ? "#e0e0e0" : "#0EB228",
            }}
            className="overflow-hidden flex-1 relative my-4 rounded-lg"
          >
            {onSwipe && (
              <>
                <FFSwipe
                  reset={resetSwipe}
                  isDisabled={isSwipeDisabled}
                  onSwipe={onSwipe}
                  direction="right"
                />
                <FFText
                  fontWeight="400"
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    marginTop: 12,
                    marginLeft: 64,
                    color: "#fff",
                  }}
                >
                  {swipeText}
                </FFText>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default AllStages;
