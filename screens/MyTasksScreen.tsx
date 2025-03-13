import { View, Text } from "react-native";
import React from "react";
import FFView from "@/src/components/FFView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";

type MyTasksScreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "MyTasks"
>;

const MyTasksScreen = () => {
  const navigation = useNavigation<MyTasksScreenNavigationProp>();
  return (
    <FFSafeAreaView>
      <FFScreenTopSection title="My Tasks" navigation={navigation} />
      <View>
        <Text>MyTasksScreen</Text>
      </View>
    </FFSafeAreaView>
  );
};

export default MyTasksScreen;
