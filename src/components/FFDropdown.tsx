import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import { useTheme } from "@/src/hooks/useTheme"; // Assuming you have a useTheme hook for theme context
import FFText from "./FFText";

interface FFDropdownProps {
  options: string[]; // List of dropdown options
  selectedOption: string; // The current selected option
  onSelect: (option: string) => void; // Callback to handle option selection
  placeholder: string; // Placeholder text when no option is selected
  label?: string; // Optional label for the dropdown
  style?: object; // Optional style prop for custom container styles
  textStyle?: object; // Optional style for the text in the dropdown
  optionStyle?: object; // Optional style for each option in the list
}

const FFDropdown: React.FC<FFDropdownProps> = ({
  options,
  selectedOption,
  onSelect,
  placeholder,
  label,
  style,
  textStyle,
  optionStyle,
}) => {
  const { theme } = useTheme(); // Get the current theme from context
  const [isOpen, setIsOpen] = useState(false); // State to toggle dropdown visibility

  const toggleDropdown = () => setIsOpen(!isOpen); // Toggle dropdown visibility
  const selectOption = (option: string) => {
    onSelect(option); // Call the onSelect callback when an option is chosen
    setIsOpen(false); // Close the dropdown
  };

  return (
    <View style={[styles.container, style]}>
      {label && <FFText style={styles.label}>{label}</FFText>}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: theme === "light" ? "#fff" : "#111",
            borderColor: theme === "light" ? "#111" : "#fff",
            borderWidth: 1,
          },
        ]}
        onPress={toggleDropdown}
      >
        <FFText
          fontWeight="500"
          style={{ ...styles.selectedText, ...textStyle }}
        >
          {selectedOption ? selectedOption : placeholder}
        </FFText>
      </TouchableOpacity>

      {isOpen && (
        <Modal
          transparent
          animationType="fade"
          visible={isOpen}
          onRequestClose={() => setIsOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setIsOpen(false)} // Close the dropdown when clicking outside
          >
            <View
              style={[
                styles.dropdown,
                { backgroundColor: theme === "light" ? "#fff" : "#333" },
              ]}
            >
              <FlatList
                data={options}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.option, optionStyle]}
                    onPress={() => selectOption(item)}
                  >
                    <FFText
                      style={{
                        ...styles.optionText,
                        ...{ color: theme === "light" ? "#000" : "#fff" },
                      }}
                    >
                      {item}
                    </FFText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
    gap: 4
  },
  label: {
    // marginBottom: 8,
    fontSize: 14,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedText: {
    fontSize: 16,
    color: "#000",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dropdown: {
    width: "80%",
    borderRadius: 8,
    padding: 8,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 16,
    color: "#000",
  },
});

export default FFDropdown;
