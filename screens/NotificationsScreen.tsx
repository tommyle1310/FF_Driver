import { View, Text } from "react-native";
import React from "react";
import FFView from "@/src/components/FFView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";

type NotificationsScreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "Notifications"
>;

const NotificationsScreen = () => {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  return (
    <FFSafeAreaView>
      <FFScreenTopSection title="Notifications" navigation={navigation} />
      <View>
        <Text>NotificationsScreen</Text>
      </View>
    </FFSafeAreaView>
  );
};

export default NotificationsScreen;
