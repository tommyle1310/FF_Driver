import { View, Text } from "react-native";
import React from "react";
import FFText from "../../FFText";

const ModalStatusCheckout = ({
  modalContentType,
}: {
  modalContentType: "SUCCESS" | "ERROR" | "WARNING";
}) => {
  switch (modalContentType) {
    case "SUCCESS":
      return <FFText>Success! Your order was completed.</FFText>;
    case "ERROR":
      return (
        <FFText fontSize="md" fontWeight="400" style={{ color: "#aaa" }}>
          Please fill all the required fields.☝️🤓
        </FFText>
      );
    case "WARNING":
      return <FFText>Warning! Please check the information.</FFText>;
    default:
      return <FFText>Loading...</FFText>;
  }
};

export default ModalStatusCheckout;
