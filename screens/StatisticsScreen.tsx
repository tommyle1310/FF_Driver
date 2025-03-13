import { View, Text } from "react-native";
import React from "react";
import FFView from "@/src/components/FFView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";

type TrackHistorySreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "Statistics"
>;

const StatisticsScreen = () => {
  const navigation = useNavigation<TrackHistorySreenNavigationProp>();
  return (
    <FFSafeAreaView>
      <FFScreenTopSection title="Statistics" navigation={navigation} />
      <View>
        <Text>StatisticsScreen</Text>
      </View>
    </FFSafeAreaView>
  );
};

export default StatisticsScreen;
