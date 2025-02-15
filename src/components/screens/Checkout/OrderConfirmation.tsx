import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import FFText from "../../FFText";
import FFButton from "../../FFButton";
import { Order } from "@/src/types/Orders";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import FFDropdown from "../../FFDropdown";

const OrderConfirmation = ({
  handlePlaceOrder,
  selected,
  handleSelect,
}: {
  handlePlaceOrder: () => void;
  selected: string;
  handleSelect: (option: string) => void;
}) => {
  const globalState = useSelector((state: RootState) => state.auth);

  return (
    <View className="flex-1 gap-4">
      <View className="flex-1 gap-1">
        <FFText fontWeight="500">Deliver to</FFText>
        <FFDropdown
          onSelect={handleSelect}
          options={globalState.address?.map((item) => item.title) || []}
          placeholder="Select delivery destination"
          selectedOption={selected}
        />
      </View>
      <FFButton onPress={handlePlaceOrder} className="w-full">
        Place Order
      </FFButton>
    </View>
  );
};

export default OrderConfirmation;
