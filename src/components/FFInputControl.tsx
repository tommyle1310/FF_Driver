import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleProp,
  ViewStyle,
} from "react-native";
import React, { useState, useRef } from "react";
import IconIonicons from "react-native-vector-icons/Ionicons";
import FFText from "@/src/components/FFText";

// Dùng generic T để type của value và setValue khớp nhau
interface FFInputControlProps<T extends string | number> {
  value: T; // value có thể là string hoặc number
  setValue?: React.Dispatch<React.SetStateAction<T>>; // setValue khớp với type của value
  error?: string | null | undefined;
  placeholder?: string;
  secureTextEntry?: boolean;
  label?: string;
  disabled?: boolean;
  readonly?: boolean;
  isNumeric?: boolean; // Thêm prop để ép kiểu number (optional)
  style?: StyleProp<ViewStyle>; // Thêm prop style cho container chính
}

const FFInputControl = <T extends string | number>({
  value,
  setValue,
  error,
  placeholder,
  secureTextEntry = false,
  label,
  disabled = false,
  readonly = false,
  isNumeric = false,
  style, // Thêm style vào destructuring
}: FFInputControlProps<T>) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const inputRef = useRef<TextInput>(null);

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  // Handle press to focus input
  const handleInputContainerPress = () => {
    if (!disabled && !readonly && inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Xử lý giá trị nhập vào
  const handleChangeText = (text: string) => {
    if (!setValue) return; // Nếu không có setValue thì bỏ qua

    if (isNumeric) {
      // Chuyển text thành number, cho phép thập phân
      const numericValue = text === "" ? "" : parseFloat(text);
      setValue((Number.isNaN(numericValue) ? "" : numericValue) as T);
    } else {
      setValue(text as T); // Giữ nguyên string, ép về T
    }
  };

  // Chuyển value thành string để hiển thị trong TextInput
  const displayValue =
    value === undefined || value === null ? "" : String(value);

  // Nếu readonly, dùng FFText
  if (readonly) {
    return (
      <View style={style}>
        <Text style={styles.inputLabel}>{label}</Text>
        <FFText fontSize="sm" fontWeight="400" style={styles.readonlyText}>
          {displayValue}
        </FFText>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // Nếu không readonly, dùng TextInput
  return (
    <Pressable
      onPress={handleInputContainerPress}
      disabled={disabled}
      style={style} // Áp dụng style cho container chính
    >
      <Text style={styles.inputLabel}>{label}</Text>
      <View
        style={[
          styles.inputFieldContainer,
          {
            borderColor: error ? "red" : disabled ? "#d1d1d1" : "#d1d1d1",
            backgroundColor: disabled ? "#f0f0f0" : "white",
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          placeholder={placeholder}
          value={displayValue} // Hiển thị string từ value
          onChangeText={handleChangeText} // Xử lý input theo kiểu
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          style={styles.inputField}
          editable={!disabled}
          autoCapitalize="none"
          keyboardType={isNumeric ? "decimal-pad" : "default"} // Bàn phím số thập phân nếu là numeric
          returnKeyType={isNumeric ? "done" : "next"} // Nút Done cho số
        />
        {secureTextEntry && !disabled && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.iconButton}
            disabled={disabled}
          >
            <IconIonicons
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={20}
              color="#333"
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
    minHeight: 40,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    paddingVertical: 0,
  },
  iconButton: {
    padding: 8,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
  readonlyText: {
    marginTop: 4,
    color: "#aaa",
  },
});

export default FFInputControl;
