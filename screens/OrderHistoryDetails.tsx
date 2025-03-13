import { View, Text, Pressable, ScrollView } from "react-native";
import React from "react";
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

type OrderHistoryDetailsScreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "OrderHistoryDetails"
>;
type TrackHistoryRouteProp = RouteProp<SidebarStackParamList, "TrackHistory">;

const checkpoints = [
  {
    status: "Started",
    time: "01 Jan 2022, 11:47AM",
    address: "Bus Sta Upas, Majestic, Bengaluru, Karnataka",
    postalCode: "560009",
  },
  {
    status: "Ended",
    time: "01 Jan 2022, 01:14PM",
    address: "M.G. Railway Colony, Majestic, Bengaluru, Karnataka",
    postalCode: "560023",
  },
];

const OrderHistoryDetailsScreen = () => {
  const navigation = useNavigation<OrderHistoryDetailsScreenNavigationProp>();
  const { params } = useRoute<TrackHistoryRouteProp>() as unknown as {
    params: { orderId: string };
  };

  return (
    <FFSafeAreaView>
      <ScrollView>
        <FFScreenTopSection
          titlePosition="left"
          title={`Trip #${params.orderId}`}
          navigation={navigation}
        />
        <View style={{ paddingBottom: 40 }} className="p-4 gap-4">
          <View className="rounded-lg border p-4 border-gray-300 bg-white gap-2">
            <FFText style={{ color: "#4c8ecf" }}>Pickup & Destination</FFText>
            <FFVerticalCheckpointProgress checkpoints={checkpoints} />
          </View>
          <View className="rounded-lg border p-4 border-gray-300 bg-white gap-2">
            <FFText style={{ color: "#4c8ecf" }}>Basic Details</FFText>
            <View className="">
              <FFJBRowItem
                leftItem="Trip ID"
                rightItem={`#${params.orderId}`}
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
              <FFJBRowItem
                leftItem="Trip Type"
                rightItem={`Single`}
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
              <FFJBRowItem
                leftItem="Distance"
                rightItem={`99.1 km`}
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
              <FFJBRowItem
                leftItem="Duration"
                rightItem={`2h 1m`}
                leftItemCss={{}}
                rightItemCss={{ fontWeight: "600" }}
              />
            </View>
          </View>
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
              rightItem={`$2`}
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
              <FFText style={{ color: "#4a9e3e" }}>$5</FFText>
            </View>
          </View>
        </View>
      </ScrollView>
    </FFSafeAreaView>
  );
};

export default OrderHistoryDetailsScreen;
