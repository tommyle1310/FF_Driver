import { View, Text } from "react-native";
import React from "react";
import FFSkeleton from "../FFSkeleton";
import FFSeperator from "../FFSeperator";

export const BasicDetailsSkeleton = () => {
  return (
    <View className="rounded-lg border p-4 gap-4 border-gray-300 bg-white ">
      <FFSkeleton width={120} height={30} />
      <View className="flex-row justify-between items-centeer">
        <FFSkeleton width={100} height={30} />
        <FFSkeleton width={180} height={30} />
      </View>
      <View className="flex-row justify-between items-centeer">
        <FFSkeleton width={100} height={30} />
        <FFSkeleton width={90} height={30} />
      </View>
      <View className="flex-row justify-between items-centeer">
        <FFSkeleton width={100} height={30} />
        <FFSkeleton width={160} height={30} />
      </View>
    </View>
  );
};
export const BillCalculationSkeleton = () => {
  return (
    <View className="rounded-lg border p-4 gap-4 border-gray-300 bg-white ">
      <FFSkeleton width={120} height={30} />
      <View className="flex-row justify-between items-centeer">
        <FFSkeleton width={100} height={30} />
        <FFSkeleton width={180} height={30} />
      </View>
      <View className="flex-row justify-between items-centeer">
        <FFSkeleton width={100} height={30} />
        <FFSkeleton width={90} height={30} />
      </View>
      <View className="flex-row justify-between items-centeer">
        <FFSkeleton width={100} height={30} />
        <FFSkeleton width={160} height={30} />
      </View>
      <FFSeperator />
      <View className="items-center justify-center gap-4">
        <FFSkeleton width={100} height={40} />
        <FFSkeleton width={80} height={42} />
      </View>
    </View>
  );
};
