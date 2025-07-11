import { View, Text, Pressable, ScrollView } from "react-native";
import React, { useEffect, useMemo, useState } from "react";
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
import OrderTrackingMap from "@/src/components/Maps/OrderTrackingMap";

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

  const routes = useMemo(() => {
    if (!dps?.stages || dps.stages.length === 0) {
      return [];
    }

    const numOrders = Math.floor(dps.stages.length / 5);
    const routeColors = ["#E53935", "#1E88E5", "#43A047"]; // Red, Blue, Green
    const extractedRoutes = [];

    for (let i = 0; i < numOrders; i++) {
      const stageOffset = i * 5;

      const restaurantStage =
        dps.stages[stageOffset + 1] || dps.stages[stageOffset];
      const customerStage =
        dps.stages[stageOffset + 3] || dps.stages[stageOffset + 4];

      const restaurantLocation =
        restaurantStage?.details?.restaurantDetails?.address?.location;
      const customerLocation =
        customerStage?.details?.customerDetails?.address?.[0]?.location;

      if (restaurantLocation && customerLocation) {
        extractedRoutes.push({
          restaurantLocation: {
            lat: restaurantLocation.lat,
            lng: restaurantLocation.lng,
          },
          customerLocation: {
            lat: customerLocation.lat,
            lng: customerLocation.lng,
          },
          color: routeColors[i % routeColors.length],
        });
      }
    }

    return extractedRoutes;
  }, [dps?.stages]);

  // Find restaurant details from stages
  const restaurantStage = dps?.stages?.find(
    (stage) => stage.details?.restaurantDetails
  );
  const restaurantDetails = restaurantStage?.details?.restaurantDetails;

  // Find customer details from stages
  const customerStage = dps?.stages?.find(
    (stage) => stage.details?.customerDetails
  );
  const customerDetails = customerStage?.details?.customerDetails;

  // Get customer delivery address (usually the first address or the one used for delivery)
  const deliveryAddress = customerDetails?.address?.[0];

  const checkpoints = [
    {
      status: "Pickup Started",
      time: formatEpochToDateTime(dps?.created_at ?? 0),
      address: restaurantDetails?.address
        ? `${restaurantDetails.address.street}, ${restaurantDetails.address.city}, ${restaurantDetails.address.nationality}`
        : "Restaurant address not available",
      postalCode: restaurantDetails?.address?.postal_code?.toString() || "",
    },
    {
      status: "Delivery Completed",
      time: formatEpochToDateTime(dps?.updated_at ?? 0),
      address: deliveryAddress
        ? `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.nationality}`
        : "Delivery address not available",
      postalCode: deliveryAddress?.postal_code?.toString() || "",
    },
  ];

  // Calculate stage statistics
  const completedStages =
    dps?.stages?.filter((stage) => stage.status === "completed") || [];
  const totalStageTime = completedStages.reduce(
    (sum, stage) => sum + (stage.duration || 0),
    0
  );

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
          title={`Trip #${
            params.dpsId?.split("-").pop()?.substring(0, 8) || params.dpsId
          }`}
          navigation={navigation}
        />
        <View style={{ paddingBottom: 40 }} className="p-4 gap-4">
          {/* Order Tracking Map */}
          {!isLoading && routes.length > 0 && (
            <OrderTrackingMap routes={routes} />
          )}
          {/* Trip Status */}
          {!isLoading && (
            <View className="rounded-lg border p-4 border-gray-300 bg-white gap-2">
              <FFText style={{ color: "#4c8ecf" }}>Trip Status</FFText>
              <FFJBRowItem
                leftItem="Current State"
                rightItem={"Completed"}
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600", color: "#4a9e3e" }}
              />
              <FFJBRowItem
                leftItem="Restaurant"
                rightItem={
                  restaurantDetails?.restaurant_name || "Unknown Restaurant"
                }
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
              <FFJBRowItem
                leftItem="Customer"
                rightItem={
                  customerDetails
                    ? `${customerDetails.first_name} ${customerDetails.last_name}`
                    : "Unknown Customer"
                }
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
            </View>
          )}

          {/* Pickup & Destination */}
          <View className="rounded-lg border p-4 border-gray-300 bg-white gap-2">
            <FFText style={{ color: "#4c8ecf" }}>Pickup & Destination</FFText>
            <FFVerticalCheckpointProgress
              checkpoints={checkpoints}
              isLoading={isLoading}
            />
          </View>

          {/* Basic Details */}
          {isLoading ? (
            <BasicDetailsSkeleton />
          ) : (
            <View className="rounded-lg border p-4 border-gray-300 bg-white gap-2">
              <FFText style={{ color: "#4c8ecf" }}>Trip Details</FFText>
              <View className="">
                <FFJBRowItem
                  leftItem="Trip ID"
                  rightItem={
                    `#${params?.dpsId?.split("-").pop()?.substring(0, 12)}` ||
                    "Unknown"
                  }
                  leftItemCss={{}}
                  // rightItemCss={{ fontWeight: "400" }}
                />
                <FFJBRowItem
                  leftItem="Trip Type"
                  rightItem="Single Order"
                  leftItemCss={{}}
                  rightItemCss={{ fontWeight: "600" }}
                />
                <FFJBRowItem
                  leftItem="Distance Travelled"
                  rightItem={`${(
                    (dps?.total_distance_travelled || 0) / 1000
                  ).toFixed(2)} km`}
                  leftItemCss={{}}
                  rightItemCss={{ fontWeight: "600" }}
                />
                <FFJBRowItem
                  leftItem="Total Duration"
                  rightItem={`${formatMinutesToHoursAndMinutes(
                    Math.round((dps?.actual_time_spent || 0) / 60)
                  )}`}
                  leftItemCss={{}}
                  rightItemCss={{ fontWeight: "600" }}
                />
                <FFJBRowItem
                  leftItem="Completed Stages"
                  rightItem={`${completedStages.length} / ${
                    dps?.stages?.length || 0
                  }`}
                  leftItemCss={{}}
                  rightItemCss={{ fontWeight: "600" }}
                />
                <FFJBRowItem
                  leftItem="Started At"
                  rightItem={formatEpochToDateTime(dps?.created_at ?? 0)}
                  leftItemCss={{}}
                  rightItemCss={{ fontWeight: "600" }}
                />
                <FFJBRowItem
                  leftItem="Last Updated"
                  rightItem={formatEpochToDateTime(dps?.updated_at ?? 0)}
                  leftItemCss={{}}
                  rightItemCss={{ fontWeight: "600" }}
                />
              </View>
            </View>
          )}

          {/* Stage Progress */}
          {!isLoading && dps?.stages && (
            <View className="rounded-lg border p-4 border-gray-300 bg-white gap-2">
              <FFText style={{ color: "#4c8ecf" }}>Stage Progress</FFText>
              {dps.stages.map((stage, index) => (
                <View
                  key={index}
                  className="border-l-2 border-gray-200 pl-4 pb-2"
                >
                  <View className="flex-row items-center gap-2 mb-1">
                    <View
                      className={`w-3 h-3 rounded-full ${
                        stage.status === "completed"
                          ? "bg-green-500"
                          : stage.status === "in_progress"
                          ? "bg-blue-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <FFText fontWeight="600" fontSize="sm">
                      {stage.state
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </FFText>
                    <FFText fontSize="xs" style={{ color: "#666" }}>
                      ({stage.status})
                    </FFText>
                  </View>
                  <View className="ml-5">
                    <FFText fontSize="xs" style={{ color: "#888" }}>
                      Duration:{" "}
                      {formatMinutesToHoursAndMinutes(
                        Math.round((stage.duration || 0) / 60)
                      )}
                    </FFText>
                    <FFText fontSize="xs" style={{ color: "#888" }}>
                      Time: {formatEpochToDateTime(stage.timestamp)}
                    </FFText>
                    {stage.details?.actual_time !== undefined && (
                      <FFText fontSize="xs" style={{ color: "#888" }}>
                        Actual Time:{" "}
                        {formatMinutesToHoursAndMinutes(
                          Math.round(stage.details.actual_time / 60)
                        )}
                      </FFText>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Earnings Breakdown */}
          {isLoading ? (
            <BillCalculationSkeleton />
          ) : (
            <View className="rounded-lg border p-4 border-gray-300 bg-white gap-2">
              <FFText style={{ color: "#4c8ecf" }}>Earnings Breakdown</FFText>
              <FFJBRowItem
                leftItem="Base Fare"
                rightItem={`$${(
                  (dps?.total_earns || 0) - (dps?.total_tips || 0)
                ).toFixed(2)}`}
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
              <FFJBRowItem
                leftItem="Customer Tips"
                rightItem={`$${dps?.total_tips || 0}`}
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
              <FFJBRowItem
                leftItem="Distance Bonus"
                rightItem={`$${(
                  ((dps?.total_distance_travelled || 0) / 1000) *
                  0.5
                ).toFixed(2)}`}
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
              <FFJBRowItem
                leftItem="Time Bonus"
                rightItem={`$${(
                  Math.round((dps?.actual_time_spent || 0) / 60) * 0.1
                ).toFixed(2)}`}
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
              <FFSeperator />
              <View className="flex-row items-center justify-between">
                <FFText fontWeight="600" style={{ color: "#4a9e3e" }}>
                  Total Earned:
                </FFText>
                <FFText
                  fontWeight="600"
                  fontSize="lg"
                  style={{ color: "#4a9e3e" }}
                >
                  ${dps?.total_earns}
                </FFText>
              </View>
            </View>
          )}

          {/* Performance Metrics */}
          {!isLoading && (
            <View className="rounded-lg border p-4 border-gray-300 bg-white gap-2">
              <FFText style={{ color: "#4c8ecf" }}>
                Performance Metrics
              </FFText>
              <FFJBRowItem
                leftItem="Average Speed"
                rightItem={
                  dps?.total_distance_travelled && dps?.actual_time_spent
                    ? `${(
                        (dps.total_distance_travelled ) /
                        (dps.actual_time_spent / 3600)
                      ).toFixed(1)} km/h`
                    : "N/A"
                }
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
              <FFJBRowItem
                leftItem="Earnings per KM"
                rightItem={
                  dps?.total_distance_travelled
                    ? `$${(
                        (dps.total_earns || 0) /
                        (dps.total_distance_travelled )
                      ).toFixed(2)}`
                    : "N/A"
                }
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
              <FFJBRowItem
                leftItem="Earnings per Hour"
                rightItem={
                  dps?.actual_time_spent
                    ? `$${(
                        (dps.total_earns || 0) /
                        (dps.actual_time_spent / 60)
                      ).toFixed(2)}`
                    : "N/A"
                }
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
              <FFJBRowItem
                leftItem="Estimated vs Actual"
                rightItem={
                  dps?.estimated_time_remaining && dps?.actual_time_spent
                    ? `${Math.round(
                        (dps.actual_time_spent / 60)
                      )}m vs ${Math.round(dps.estimated_time_remaining / 60)}m`
                    : "N/A"
                }
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
            </View>
          )}
        </View>
      </ScrollView>
      <Spinner isVisible={isLoading} isOverlay />
    </FFSafeAreaView>
  );
};

export default OrderHistoryDetailsScreen;
