import { View, Text } from "react-native";
import React from "react";
import FFView from "@/src/components/FFView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";

type MyWalletScreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "MyWallet"
>;

const MyWalletScreen = () => {
  const navigation = useNavigation<MyWalletScreenNavigationProp>();
  return (
    <FFSafeAreaView>
      <FFScreenTopSection title="My Wallet" navigation={navigation} />
      <View>
        <Text>MyWalletScreen</Text>
      </View>
    </FFSafeAreaView>
  );
};

export default MyWalletScreen;
