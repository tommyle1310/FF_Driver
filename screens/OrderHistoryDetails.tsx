import { View, Text, Pressable, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import FFView from "@/src/components/FFView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFText from "@/src/components/FFText";
import IconFeather from "react-native-vector-icons/Feather";
import IconMaterialIcons from "react-native-vector-icons/MaterialIcons";
import IconOcticons from "react-native-vector-icons/Octicons";
import IconFontAwesome5 from "react-native-vector-icons/FontAwesome5";
import FFSeperator from "@/src/components/FFSeperator";
import FFVerticalCheckpointProgress from "@/src/components/FFVerticalCheckpointProgress";
import FFJBRowItem from "@/src/components/FFJBRowItems";
import axiosInstance from "@/src/utils/axiosConfig";
import { DriverProgressStageState } from "@/src/store/currentDriverProgressStageSlice";
import Spinner from "@/src/components/FFSpinner";
import {
  formatEpochToDate,
  formatEpochToDateTime,
  formatMinutesToHoursAndMinutes,
} from "@/src/utils/functions";
import FFSkeleton from "@/src/components/FFSkeleton";
import {
  BasicDetailsSkeleton,
  BillCalculationSkeleton,
} from "@/src/components/SkeletonLayoutScreen/OrderHistoryDetails";

type OrderHistoryDetailsScreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "OrderHistoryDetails"
>;
type TrackHistoryRouteProp = RouteProp<SidebarStackParamList, "TrackHistory">;

const OrderHistoryDetailsScreen = () => {
  const navigation = useNavigation<OrderHistoryDetailsScreenNavigationProp>();
  const { params } = useRoute<TrackHistoryRouteProp>() as unknown as {
    params: { dpsId: string };
  };
  const [isLoading, setIsLoading] = useState(false);
  const [dps, setDps] = useState<DriverProgressStageState>();
  console.log('chekc here ',         dps?.stages?.[3]?.details)
  const checkpoints = [
    {
      status: "Started",
      time: formatEpochToDateTime(dps?.created_at ?? 0),
      address: `${dps?.stages?.[1]?.details?.restaurantDetails?.address?.street}, ${dps?.stages?.[1]?.details?.restaurantDetails?.address?.city}, ${dps?.stages?.[1]?.details?.restaurantDetails?.address?.nationality}`,
      postalCode: "",
    },
    {
      status: "Ended",
      time: formatEpochToDateTime(dps?.updated_at ?? 0),
      address: `${
        dps?.stages?.[dps?.stages?.length - 1]?.details?.customerDetails
          ?.address?.[0]?.street
      }, ${
        dps?.stages?.[dps?.stages?.length - 1]?.details?.customerDetails
          ?.address?.[0]?.city
      }, ${
        dps?.stages?.[dps?.stages?.length - 1]?.details?.customerDetails
          ?.address?.[0]?.nationality
      }`,
      postalCode: "",
    },
  ];

  useEffect(() => {
    if (params.dpsId) {
      fetchDps();
    }
  }, [params.dpsId]);

  const fetchDps = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `/driver-progress-stages/${params.dpsId}`
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

  return (
    <FFSafeAreaView>
      <ScrollView>
        <FFScreenTopSection
          titlePosition="left"
          title={`Trip #${params.dpsId}`}
          navigation={navigation}
        />
        <View style={{ paddingBottom: 40 }} className="p-4 gap-4">
          <View className="rounded-lg border p-4 border-gray-300 bg-white gap-2">
            <FFText style={{ color: "#4c8ecf" }}>Pickup & Destination</FFText>
            <FFVerticalCheckpointProgress
              checkpoints={checkpoints}
              isLoading={isLoading}
            />
          </View>
          {isLoading ? (
            <BasicDetailsSkeleton />
          ) : (
            <View className="rounded-lg border p-4 border-gray-300 bg-white gap-2">
              <FFText style={{ color: "#4c8ecf" }}>Basic Details</FFText>
              <View className="">
                <View className="flex-row justify-between gap-4">
                  <FFText fontWeight="400" style={{ fontSize: 14 }}>
                    Trip ID
                  </FFText>
                  <FFText fontSize="sm" style={{ flex: 1 }}>
                    {params?.dpsId}
                  </FFText>
                </View>
                <FFJBRowItem
                  leftItem="Trip Type"
                  rightItem={
                    dps?.orders && dps?.orders?.length > 1
                      ? "Combined orders"
                      : "Single order"
                  }
                  leftItemCss={{}}
                  rightItemCss={{ fontWeight: "600" }}
                />
                <FFJBRowItem
                  leftItem="Distance"
                  rightItem={`${dps?.total_distance_travelled?.toFixed(2)} km`}
                  leftItemCss={{}}
                  rightItemCss={{ fontWeight: "600" }}
                />
                <FFJBRowItem
                  leftItem="Duration"
                  rightItem={`${formatMinutesToHoursAndMinutes(
                    dps?.actual_time_spent || 0
                  )}`}
                  leftItemCss={{}}
                  rightItemCss={{ fontWeight: "600" }}
                />
              </View>
            </View>
          )}
          {isLoading ? (
            <BillCalculationSkeleton />
          ) : (
            <View className="rounded-lg border p-4 border-gray-300 bg-white gap-2">
              <FFText style={{ color: "#4c8ecf" }}>Bill Calculation</FFText>
              <FFJBRowItem
                leftItem="Base Fare"
                rightItem={`$3`}
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
              <FFJBRowItem
                leftItem="Customer Tips"
                rightItem={`$${dps?.total_tips}`}
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
              <FFJBRowItem
                leftItem="Additional Fees"
                rightItem={`$20`}
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
              <FFJBRowItem
                leftItem="Deductions"
                rightItem={`$0`}
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
              <FFSeperator />
              <View className="items-center justify-between">
                <FFText style={{ color: "#4a9e3e" }}>Total earned:</FFText>
                <FFText style={{ color: "#4a9e3e" }}>
                  ${dps?.total_earns}
                </FFText>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      <Spinner isVisible={isLoading} isOverlay />
    </FFSafeAreaView>
  );
};

export default OrderHistoryDetailsScreen;
