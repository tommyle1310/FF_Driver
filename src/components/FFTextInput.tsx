import { View, Text, TextInput } from "react-native";
import React from "react";
import { useTheme } from "../hooks/useTheme";

const FFTextInput = ({
  isInvalid,
  value,
  handleChangeText,
}: {
  isInvalid: boolean;
  value: string;
  handleChangeText: (value: string) => void;
}) => {
  const { theme } = useTheme();
  return (
    <TextInput
      className={`rounded-lg text-lg px-4`}
      placeholder="$0"
      style={{
        borderRadius: 8,
        color: theme === "light" ? "#111" : "#fff",
        fontSize: 18,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: isInvalid ? "#f44444" : "#D1D5DB", // conditional border color
      }}
      value={value}
      onChangeText={handleChangeText}
      keyboardType="numeric" // This ensures the keyboard is numeric
    />
  );
};

export default FFTextInput;
