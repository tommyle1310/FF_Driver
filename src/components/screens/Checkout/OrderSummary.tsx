import { View, Text, Pressable, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import FFAvatar from "../../FFAvatar";
import FFText from "../../FFText";
import { Order } from "@/src/types/Orders";
import IconIonicons from "react-native-vector-icons/Ionicons";
import { DELIVERY_FEE, SERVICE_FEE } from "@/src/utils/constants";

const OrderSummary = ({
  orderItem,
  setTotalAmountParent,
  serviceFee,
  deliveryFee,
}: {
  orderItem: Order;
  setTotalAmountParent: React.Dispatch<React.SetStateAction<number>>;
  deliveryFee: number;
  serviceFee: number;
}) => {
  const [subTotal, setSubTotal] = useState<number>(0);
  const [promotionSubtractValue, setpromotionSubtractValue] =
    useState<number>(0);
  const [voucherSubtractValue, setVoucherSubtractValue] = useState<number>(0);

  const [totalAmount, setTotalAmount] = useState<number>(0);
  useEffect(() => {
    const calculatedSubTotal = orderItem.order_items.reduce((total, item) => {
      return (
        total + (item?.price_at_time_of_order ?? 0) * (item?.quantity ?? 1)
      );
    }, 0);
    setSubTotal(calculatedSubTotal);
  }, [orderItem]);
  useEffect(() => {
    setTotalAmount(
      subTotal +
        promotionSubtractValue +
        voucherSubtractValue +
        deliveryFee +
        serviceFee
    );
    setTotalAmountParent(
      subTotal +
        promotionSubtractValue +
        voucherSubtractValue +
        deliveryFee +
        serviceFee
    );
  }, [subTotal, promotionSubtractValue, voucherSubtractValue, deliveryFee]);

  return (
    <View className="flex-1">
      <View
        style={{
          height: "60%",
          padding: 8,
          borderRadius: 8,
        }}
      >
        <ScrollView>
          {orderItem.order_items.map((item, index) => {
            return (
              <Pressable
                className="flex-row items-center gap-2 mb-2"
                onPress={() => {}}
                key={item.variant_id}
              >
                <View className="relative rounded-full">
                  <FFAvatar
                    rounded="sm"
                    size={50}
                    avatar={item?.item?.avatar?.url ?? ""}
                  />
                  <FFText
                    style={{
                      position: "absolute",
                      top: 0,
                      right: -6,
                      paddingHorizontal: 4,
                      borderRadius: 9999,
                      backgroundColor: "red",
                      color: "#fff",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    fontSize="sm"
                  >
                    {item.quantity}
                  </FFText>
                </View>
                <View className="flex-1">
                  <FFText style={{ color: "#4d9c39", marginTop: 1 }}>
                    {item.item.name}
                  </FFText>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1">
                      <FFText fontWeight="400" fontSize="sm">
                        {item.name}
                      </FFText>
                    </View>
                    <FFText style={{ color: "#111", marginTop: 1 }}>
                      ${item.price_at_time_of_order}
                    </FFText>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <View
        style={{
          borderTopWidth: 1,
          gap: 8,
          borderTopColor: "#ccc",
          paddingVertical: 8,
        }}
      >
        <Pressable className="p-4 bg-gray-200 rounded-lg flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <IconIonicons name="ticket-outline" size={14} />
            <Text className="text-gray-400">Enter your voucher code</Text>
          </View>
          <IconIonicons name="chevron-forward-outline" />
        </Pressable>
        <View className="flex-row justify-between items-center">
          <FFText style={{ color: "#aaa" }} fontWeight="400">
            Subtotal
          </FFText>
          <FFText fontWeight="500">${subTotal.toFixed(2)}</FFText>
        </View>
        <View className="flex-row justify-between items-center">
          <FFText style={{ color: "#aaa" }} fontWeight="400">
            Promotion
          </FFText>
          <FFText fontWeight="500">-${promotionSubtractValue}</FFText>
        </View>
        <View className="flex-row justify-between items-center">
          <FFText style={{ color: "#aaa" }} fontWeight="400">
            Voucher Discount
          </FFText>
          <FFText fontWeight="500">-${voucherSubtractValue}</FFText>
        </View>
        <View className="flex-row justify-between items-center">
          <FFText style={{ color: "#aaa" }} fontWeight="400">
            Delivery Fee
          </FFText>
          <FFText fontWeight="500">${deliveryFee}</FFText>
        </View>
        <View className="flex-row justify-between items-center">
          <FFText style={{ color: "#aaa" }} fontWeight="400">
            Service Fee
          </FFText>
          <FFText fontWeight="500">${serviceFee}</FFText>
        </View>
        <View className="flex-row justify-between items-center my-2">
          <FFText style={{ color: "#aaa" }} fontSize="lg" fontWeight="400">
            Total Amount
          </FFText>
          <FFText fontSize="lg" colorLight="#4d9c39" colorDark="#4c9f3a">
            ${totalAmount.toFixed(2)}
          </FFText>
        </View>
      </View>
    </View>
  );
};

export default OrderSummary;
