import { View, Text, Pressable, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import FFView from "@/src/components/FFView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFSeperator from "@/src/components/FFSeperator";
import FFText from "@/src/components/FFText";
import IconFeather from "react-native-vector-icons/Feather";
import IconMaterialIcons from "react-native-vector-icons/MaterialIcons";
import IconOcticons from "react-native-vector-icons/Octicons";
import IconFontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import axiosInstance from "@/src/utils/axiosConfig";
import Spinner from "@/src/components/FFSpinner";
import { DriverProgressStageState } from "@/src/store/currentDriverProgressStageSlice";
import {
  formatEpochToDate,
  limitMaxCharacters,
  limitMaxWords,
} from "@/src/utils/functions";
import FFSkeleton from "@/src/components/FFSkeleton";

type TrackHistorySreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "TrackHistory"
>;

// Hàm phụ để phân loại ngày
const categorizeByDate = (items: DriverProgressStageState[]) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const grouped: { [key: string]: DriverProgressStageState[] } = {
    Today: [],
    Yesterday: [],
    Older: [],
  };

  items.forEach((item) => {
    const itemDate = new Date((item?.created_at ?? 0) * 1000); // Giả sử created_at là epoch timestamp
    const isToday = itemDate.toDateString() === today.toDateString();
    const isYesterday = itemDate.toDateString() === yesterday.toDateString();

    if (isToday) {
      grouped["Today"].push(item);
    } else if (isYesterday) {
      grouped["Yesterday"].push(item);
    } else {
      grouped["Older"].push(item);
    }
  });

  return grouped;
};

const TrackHistoryScreen = () => {
  const navigation = useNavigation<TrackHistorySreenNavigationProp>();
  const { userId, driverId } = useSelector((state: RootState) => state.auth);

  const [isLoading, setIsLoading] = useState(false);
  const [dps, setDps] = useState<DriverProgressStageState[]>([]);

  useEffect(() => {
    fetchAllDps();
  }, [driverId]);

  const fetchAllDps = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `/drivers/driver-progress-stages/${driverId}?limit=5`
      );
      const { EC, EM, data } = response.data;
      if (EC === 0) {
        setDps(data);
      } else {
        console.error("Error fetching profile data:", EM);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedDps = categorizeByDate(dps);

  const renderSection = (label: string, items: DriverProgressStageState[]) => {
    if (items.length === 0) return null;

    return (
      <>
        <FFSeperator label={label} />
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() =>
              navigation.navigate("OrderHistoryDetails", {
                dpsId: item?.id ?? "",
              })
            }
            className="rounded-lg border border-gray-300 overflow-hidden bg-white gap-2 mb-4"
          >
            <View className="p-4">
              <View className="flex-row items-center gap-2 justify-between">
                <View className="">
                  <FFText>
                    {limitMaxCharacters(
                      `${item?.stages?.[1]?.details?.restaurantDetails?.restaurant_name}`,
                      40
                    )}
                  </FFText>
                  <FFText fontSize="sm" fontWeight="400">
                    Order ID: #{limitMaxCharacters(item?.id ?? "", 20)}
                  </FFText>
                </View>
                <View className="flex-row items-center gap-2">
                  <IconFeather name="calendar" />
                  <FFText
                    fontSize="sm"
                    fontWeight="400"
                    style={{ color: "#999" }}
                  >
                    {formatEpochToDate(item?.updated_at ?? 0)}
                  </FFText>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="rounded-full p-1 bg-[#bae4b2]">
                  <View className="w-4 h-4 rounded-full bg-[#63c550]"></View>
                </View>
                <FFText fontSize="sm" fontWeight="500">
                  {limitMaxCharacters(
                    `${item?.stages?.[1]?.details?.restaurantDetails?.address?.street}, ${item?.stages?.[1]?.details?.restaurantDetails?.address?.city}, ${item?.stages?.[1]?.details?.restaurantDetails?.address?.nationality}`,
                    40
                  )}
                </FFText>
              </View>
              <FFSeperator />
              <View className="flex-row items-center gap-2">
                <View className="rounded-full p-1 bg-[#e3bec4]">
                  <View className="w-4 h-4 rounded-full bg-[#d21f3c]"></View>
                </View>
                <FFText fontSize="sm" fontWeight="500">
                  {limitMaxCharacters(
                    `${item?.stages?.[3]?.details?.customerDetails?.address?.[0]?.street}, ${item?.stages?.[3]?.details?.customerDetails?.address?.[0]?.city}, ${item?.stages?.[3]?.details?.customerDetails?.address?.[0]?.nationality}`,
                    40
                  )}
                </FFText>
              </View>
              <View className="mt-4 flex-row items-center justify-between gap-2">
                <View className="flex-row items-center gap-2">
                  <IconOcticons name="package" />
                  <FFText fontSize="sm">
                    {item?.orders?.length > 1 ? "Combined" : "Single"}
                  </FFText>
                </View>
                <View className="flex-row items-center gap-2">
                  <IconMaterialIcons name="route" />
                  <FFText fontSize="sm">
                    {item?.total_distance_travelled?.toFixed(2)}km
                  </FFText>
                </View>
                <View className="flex-row items-center gap-2">
                  <IconFeather name="clock" />
                  <FFText fontSize="sm">{item?.actual_time_spent}m</FFText>
                </View>
              </View>
            </View>
            <View className="items-center justify-center bg-[#55b542] p-4 gap-2 flex-row">
              <IconFontAwesome5 name="money-bill-wave" color="#fff" />
              <FFText style={{ color: "#fff" }}>${item?.total_earns}</FFText>
            </View>
          </Pressable>
        ))}
      </>
    );
  };

  return (
    <FFSafeAreaView>
      <FFScreenTopSection title="History" navigation={navigation} />
      <ScrollView>
        <View className="p-4">
          {isLoading ? (
            <View className="gap-4">
              <FFSkeleton height={180} />
              <FFSkeleton height={180} />
              <FFSkeleton height={180} />
            </View>
          ) : (
            <>
              {renderSection("Today", groupedDps["Today"])}
              {renderSection("Yesterday", groupedDps["Yesterday"])}
              {renderSection("Older", groupedDps["Older"])}
            </>
          )}
        </View>
      </ScrollView>
    </FFSafeAreaView>
  );
};

export default TrackHistoryScreen;
