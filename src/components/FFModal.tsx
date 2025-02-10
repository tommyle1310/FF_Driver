import React from "react";
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useTheme } from "@/src/hooks/useTheme"; // Import the custom useTheme hook
import FFText from "./FFText";
import IconIonicon from "react-native-vector-icons/Ionicons";

interface FFModalProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode; // Only the children prop is needed
  disabledClose?: boolean;
}

const FFModal: React.FC<FFModalProps> = ({
  visible,
  onClose,
  children,
  disabledClose,
}) => {
  const { theme } = useTheme(); // Get the theme for dynamic styling

  return (
    <Modal
      visible={visible}
      transparent={true} // Make the background semi-transparent
      animationType="fade" // Use a fade-in/fade-out animation
      onRequestClose={onClose} // Handle the request to close the modal
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor:
              theme === "light" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)",
          },
        ]}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme === "light" ? "#fff" : "#333" },
          ]}
        >
          {/* Make the modal content scrollable if needed */}
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {children}
          </ScrollView>

          {/* Button to close the modal */}
          {!disabledClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconIonicon name="close" style={{ color: "white" }} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center", // Vertically center the modal
    alignItems: "center", // Horizontally center the modal
    position: "absolute", // Make sure it's positioned relative to the screen
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1, // Ensure it's below the SlideUpModal
  },
  modalContainer: {
    width: "90%", // Fixed width for the modal content
    maxHeight: "80%", // Prevent modal from being too tall
    padding: 20,
    borderRadius: 10,
    position: "relative",
    flexDirection: "column", // Ensure content is stacked vertically
    justifyContent: "center",
    elevation: 10, // Add shadow for iOS and Android elevation
    margin: 20, // Optional margin to add space around modal
  },
  scrollContainer: {
    flexGrow: 1, // Ensures that the content container grows if necessary
    paddingBottom: 10, // Add some padding to avoid content being hidden under the close button
  },
  closeButton: {
    top: 4,
    right: 4,
    padding: 4,
    position: "absolute",
    backgroundColor: "#E74C3C",
    borderRadius: 9999,
  },
});

export default FFModal;
