import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
} from "react-native";
import React, { useState, useRef } from "react";
import IconIonicons from "react-native-vector-icons/Ionicons";

interface FFInputControlProps {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  error: string | null | undefined;
  placeholder: string;
  secureTextEntry?: boolean;
  label: string;
  disabled?: boolean; // Optional disabled prop
}

const FFInputControl = ({
  value,
  setValue,
  error,
  placeholder,
  secureTextEntry = false,
  label,
  disabled = false, // Default is false
}: FFInputControlProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const inputRef = useRef<TextInput>(null);

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  // Handle press anywhere in the input container to focus
  const handleInputContainerPress = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  return (
    <Pressable onPress={handleInputContainerPress}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View
        style={{
          ...styles.inputFieldContainer,
          borderColor: error ? "red" : disabled ? "#d1d1d1" : "#d1d1d1",
          backgroundColor: disabled ? "#f0f0f0" : "white", // Background change for disabled state
        }}
      >
        <TextInput
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChangeText={setValue}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          style={styles.inputField}
          editable={!disabled} // Disable text input
        />
        {secureTextEntry && !disabled && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.iconButton}
          >
            <IconIonicons
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={20}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  inputLabel: {
    fontSize: 14,
    color: "#333",
  },
  inputFieldContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    marginTop: 4,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  iconButton: {
    position: "absolute",
    right: 16,
  },
  errorText: {
    color: "red",
    fontSize: 12,
  },
});

export default FFInputControl;
