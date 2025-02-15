import { View, Text } from "react-native";
import React from "react";
import FFText from "../../FFText";
import FFDropdown from "../../FFDropdown";

const PaymentInformation = ({
  selected,
  handleSelect,
}: {
  selected: string;
  handleSelect: (option: string) => void;
}) => {
  return (
    <View className="flex-1 gap-4">
      <View className="gap-1">
        <FFText>Payment Method</FFText>
        <FFDropdown
          options={["FWallet", "COD"]}
          selectedOption={selected}
          onSelect={handleSelect}
          placeholder="Select a payment method"
        />
      </View>
    </View>
  );
};

export default PaymentInformation;
