import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import FFView from "@/src/components/FFView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import CoralTourCarousel from "@/src/components/CoralTourCarosel";
import FFText from "@/src/components/FFText";
import FFSeperator from "@/src/components/FFSeperator";
import FFButton from "@/src/components/FFButton";

type MyVehicleScreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "MyVehicles"
>;

const MyVehicleScreen = () => {
  const navigation = useNavigation<MyVehicleScreenNavigationProp>();
  return (
    <FFSafeAreaView>
      <FFScreenTopSection title="My Vehicle" navigation={navigation} />
      <View className="p-4 gap-4">
        <View className="justify-between flex-row items-center">
          <FFText>My Vehicle</FFText>
          <TouchableOpacity>
            <FFText
              fontSize="sm"
              fontWeight="700"
              style={{ color: "#4a9e3e", textDecorationLine: "underline" }}
            >
              Update Vehicle Details
            </FFText>
          </TouchableOpacity>
        </View>
        <CoralTourCarousel
          imageUrls={[
            "https://res.cloudinary.com/dpubnzap3/image/upload/v1738818798/ei6ycutzsexeu90e8bxn.png",
            "https://res.cloudinary.com/dpubnzap3/image/upload/v1738818798/ei6ycutzsexeu90e8bxn.png",
            "https://res.cloudinary.com/dpubnzap3/image/upload/v1738818798/ei6ycutzsexeu90e8bxn.png",
          ]}
        />
        <View
          style={{ elevation: 3 }}
          className="p-4 bg-white rounded-lg gap-2"
        >
          <FFText style={{ marginBottom: 12 }}>Vehicle Details</FFText>
          <View className="flex-row justify-between items-center">
            <FFText fontWeight="400">License Plate</FFText>
            <FFText>51D2 - 99421</FFText>
          </View>
          <View className="flex-row justify-between items-center">
            <FFText fontWeight="400">Brand</FFText>
            <FFText>Honda</FFText>
          </View>
          <View className="flex-row justify-between items-center">
            <FFText fontWeight="400">Model</FFText>
            <FFText>Winner X</FFText>
          </View>
          <View className="flex-row justify-between items-center">
            <FFText fontWeight="400">Color</FFText>
            <FFText>Red</FFText>
          </View>
          <View className="flex-row justify-between items-center">
            <FFText fontWeight="400">Owner</FFText>
            <FFText>John Doe</FFText>
          </View>
          <View className="flex-row justify-between items-center">
            <FFText fontWeight="400">Year</FFText>
            <FFText>2020</FFText>
          </View>
        </View>
      </View>
    </FFSafeAreaView>
  );
};

export default MyVehicleScreen;
