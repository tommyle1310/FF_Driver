import { View, Text, Pressable } from "react-native";
import React from "react";
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

type TrackHistorySreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "TrackHistory"
>;

const TrackHistoryScreen = () => {
  const navigation = useNavigation<TrackHistorySreenNavigationProp>();

  return (
    <FFSafeAreaView>
      <FFScreenTopSection title="History" navigation={navigation} />
      <View className="p-4">
        <FFSeperator label="Today" />
        <Pressable
          onPress={() =>
            navigation.navigate("OrderHistoryDetails", { orderId: "123456" })
          }
          className="rounded-lg border border-gray-300 overflow-hidden bg-white gap-2"
        >
          <View className="p-4">
            <View className="flex-row items-center gap-2 justify-between">
              <View className="">
                <FFText>Cole Palmer</FFText>
                <FFText fontSize="sm" fontWeight="400">
                  Order ID: #1234567890
                </FFText>
              </View>
              <View className="flex-row items-center gap-2">
                <IconFeather name="calendar" />
                <FFText
                  fontSize="sm"
                  fontWeight="400"
                  style={{ color: "#999" }}
                >
                  13/03/2024
                </FFText>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="rounded-full p-1 bg-[#bae4b2]">
                <View className="w-4 h-4 rounded-full bg-[#63c550]"></View>
              </View>
              <FFText fontSize="sm" fontWeight="500">
                Mon Sushi (123 Main St, San Francisco, CA, 94101)
              </FFText>
            </View>
            <FFSeperator />
            <View className="flex-row items-center gap-2">
              <View className="rounded-full p-1 bg-[#e3bec4]">
                <View className="w-4 h-4 rounded-full bg-[#d21f3c]"></View>
              </View>
              <FFText fontSize="sm" fontWeight="500">
                Mon Sushi (123 Main St, San Francisco, CA, 94101)
              </FFText>
            </View>
            <View className="mt-4 flex-row items-center justify-between gap-2">
              <View className="flex-row items-center gap-2">
                <IconOcticons name="package" />
                <FFText fontSize="sm">Single</FFText>
              </View>
              <View className="flex-row items-center gap-2">
                <IconMaterialIcons name="route" />
                <FFText fontSize="sm">15.36km</FFText>
              </View>
              <View className="flex-row items-center gap-2">
                <IconFeather name="clock" />
                <FFText fontSize="sm">36m</FFText>
              </View>
            </View>
          </View>
          <View className="items-center justify-center bg-[#55b542] p-4 gap-2 flex-row">
            <IconFontAwesome5 name="money-bill-wave" color="#fff" />
            <FFText style={{ color: "#fff" }}>$1.212</FFText>
          </View>
        </Pressable>
      </View>
    </FFSafeAreaView>
  );
};

export default TrackHistoryScreen;
