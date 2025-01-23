import { View, Text, TouchableOpacity, Pressable } from "react-native";
import React, { useState } from "react";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFText from "@/src/components/FFText";
import FFSidebar from "@/src/components/FFSidebar";
import FFAvatar from "@/src/components/FFAvatar";
import FFBadge from "@/src/components/FFBadge";
import FFView from "@/src/components/FFView";
import { data_card_items_Homescreen_Today_metric } from "@/src/data/screens/data_home";
import FFButton from "@/src/components/FFButton";
import FFSwipe from "@/src/components/FFSwipe";

const HomeScreen = () => {
  const [isShowSidebar, setIsShowSidebar] = useState(false);

  const toggleAvailability = () => {
    console.log("check");
  };

  return (
    <FFSafeAreaView>
      <FFView style={{ flex: 1, padding: 8 }}>
        {/* top section */}
        <View className="justify-center relative flex-row p-8">
          <FFBadge backgroundColor="#E02D3C" title="Offline" textColor="#fff" />
          <TouchableOpacity
            className="absolute top-2 right-2"
            onPress={() => {console.log('check'), setIsShowSidebar(true)}}
          >
            <FFAvatar />
          </TouchableOpacity>
        </View>
        <View
          style={{ flex: 1, backgroundColor: "#ccc", marginHorizontal: -10 }}
        ></View>

        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "white",
            marginHorizontal: -10,
            paddingVertical: 10,
            borderTopEndRadius: 24,
            borderTopStartRadius: 24,
          }}
        >
          <View className="border-b-2 border-gray-300 flex-row items-center justify-between p-4 px-6">
            <FFAvatar />
            <FFText style={{ textAlign: "center", margin: 10 }}>
              You're Offline
            </FFText>
            <FFAvatar />
          </View>
      <View className="overflow-hidden mx-6 my-4  rounded-lg bg-[#0EB228]">
          <FFSwipe onSwipe={toggleAvailability} direction="right" />
      </View>
        </View>
      </FFView>
        <FFSidebar
          visible={isShowSidebar}
          onClose={() => setIsShowSidebar(false)}
        />
    </FFSafeAreaView>
  );
};

export default HomeScreen;
