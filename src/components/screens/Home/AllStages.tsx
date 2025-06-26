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
import { colors, spacing } from "@/src/theme";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { Order } from "@/src/store/currentDriverProgressStageSlice";

type HomeSreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "Home"
>;
interface AllStagesProps {
  stages: PickupAndDropoffStage[];
  orderRedux?: Order[];
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
  orderRedux,
  selectedDestination,
  handleGoNow,
  setSelectedDestination,
  swipeText = "",
  onSwipe,
  isSwipeDisabled = false,
  resetSwipe = false,
}) => {
  const navigation = useNavigation<HomeSreenNavigationProp>();
  // Hàm xử lý khi chọn stage
  const handleSelectStage = (stage: PickupAndDropoffStage) => {
    if (selectedDestination?.id === stage.id) {
      setSelectedDestination(null); // Bỏ chọn nếu đã chọn rồi
    } else {
      // Validate location data before setting
      if (stage.location && stage.location.lat && stage.location.lng) {
        // Check if coordinates are within a reasonable range for Vietnam
        const isReasonableLat = stage.location.lat >= 5 && stage.location.lat <= 25;
        const isReasonableLng = stage.location.lng >= 100 && stage.location.lng <= 112;
        
        if (!isReasonableLat || !isReasonableLng) {
          console.warn("Location coordinates outside Vietnam range:", stage.location);
          // Create a copy with fixed location (Ho Chi Minh City)
          const fixedStage = {
            ...stage,
            location: { lat: 10.781975, lng: 106.664512 }
          };
          console.log("Using fixed location instead:", fixedStage.location);
          setSelectedDestination(fixedStage);
        } else {
          console.log("Selected destination with valid location:", stage.location);
          setSelectedDestination(stage); // Chọn stage mới
        }
      } else {
        console.error("Selected stage has invalid location data:", stage);
        // Create a copy with default location (Ho Chi Minh City)
        const fixedStage = {
          ...stage,
          location: { lat: 10.781975, lng: 106.664512 }
        };
        console.log("Using default location instead:", fixedStage.location);
        setSelectedDestination(fixedStage);
      }
    }
    onChange(); // Gọi onChange để báo cho parent nếu cần
  };
  const handleChat = async (stage: PickupAndDropoffStage) => {
    // console.log('cehck selectedDestination', orderRedux?.find((order) => order.restaurant_id === stage?.id?.split('_pickup')[0])?.restaurant_id)
    // console.log('cehck selectedDestination', orderRedux?.find((order) => order.customer_id === stage?.id?.split('_dropoff')[0])?.customer_id)
    const userId  = stage?.id?.includes('_pickup') ? stage?.id?.split('_pickup')[0] : stage?.id?.includes('_dropoff') ? stage?.id?.split('_dropoff')[0] : null
    // console.log('check userId' , userId)
    const orderId = stage?.id?.includes('_pickup') ? orderRedux?.find((order) => order.restaurant_id === userId)?.id : orderRedux?.find((order) => order.customer_id === userId)?.id
    console.log('check orderId' , orderId)
    navigation.navigate('FChat', {
      withUserId: userId ?? '',
      type: "ORDER",
      orderId: orderId ?? '',
      title: orderId ?? ''
    });
  };

  useEffect(() => {
    if (!handleGoNow) return;
    handleGoNow();
  }, [selectedDestination]);

  const { total_earns, total_distance_travelled, orders } = useSelector(
    (state: RootState) => state.currentDriverProgressStage
  );

  // Calculate total orders from the orders array in Redux state
  const totalOrders = orders ? orders.length : Math.ceil(stages.length / 2);

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
              <View
                style={{
                  alignItems: "flex-start",
                  flex: 1,
                }}
              >
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
              <View
                style={{
                  flexDirection: "row",
                  gap: spacing.sm,
                  alignSelf: "flex-start",
                }}
              >
                <TouchableOpacity
                  style={{
                    backgroundColor: "#fff",
                    padding: 4,
                    borderWidth: 1,
                    borderColor: "#ddd",
                    borderRadius: 9999,
                  }}
                  onPress={() =>
                    handleChat(          stage          )
                  }
                >
                  <Ionicons name="chatbubble-outline" size={20} />
                </TouchableOpacity>
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
            </View>
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
