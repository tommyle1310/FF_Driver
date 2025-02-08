import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";
import IconIonicons from "react-native-vector-icons/Ionicons";
import FFText from "./FFText";

type FFScreenTopSectionProps = {
  navigation: any; // Define the type for navigation
  title: string; // Define the type for title
};

const FFScreenTopSection: React.FC<FFScreenTopSectionProps> = ({
  navigation,
  title,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <IconIonicons name="chevron-back" size={24} />
      </TouchableOpacity>
      <FFText fontSize="lg">{title}</FFText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: "center",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 16,
    top: 16,
  },
});

export default FFScreenTopSection;
