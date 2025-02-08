import React, { useState, useEffect } from "react";
import { View, Switch } from "react-native";
import FFText from "./FFText"; // Assuming you have a custom text component for styling
import { useTheme } from "@/src/hooks/useTheme"; // Import the custom useTheme hook

interface FFToggleProps {
  label?: string;
  initialChecked?: boolean;
  onChange?: (value: boolean) => void;
}

const FFToggle: React.FC<FFToggleProps> = ({
  label,
  initialChecked = false,
  onChange,
}) => {
  const [isChecked, setIsChecked] = useState<boolean>(initialChecked);
  const { toggleTheme } = useTheme();

  // If initialChecked is provided, use it as the default value for the state
  useEffect(() => {
    if (initialChecked !== undefined) {
      setIsChecked(initialChecked);
    }
  }, [initialChecked]);

  const handleToggleChange = (value: boolean) => {
    setIsChecked(value);

    // If onChange is provided, invoke it
    if (onChange) {
      onChange(value);
    }

    // Only toggle the theme if it's not controlled (i.e., initialChecked is not provided)
    if (initialChecked === undefined) {
      toggleTheme();
    }
  };

  return (
    <View className="flex-row items-center">
      <FFText fontWeight="500" style={{ color: "#666" }}>
        {label}
      </FFText>
      <Switch
        style={{
          paddingVertical: 0,
          marginVertical: 0,
          marginTop: -20,
          marginBottom: -20,
        }}
        value={isChecked}
        onValueChange={handleToggleChange}
        trackColor={{ false: "gray", true: "#63c550" }}
        thumbColor={isChecked ? "#fff" : "#f4f3f4"}
      />
    </View>
  );
};

export default FFToggle;
