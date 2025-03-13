import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";
import IconIonicons from "react-native-vector-icons/Ionicons";
import FFText from "./FFText";

type FFScreenTopSectionProps = {
  navigation: any; // Define the type for navigation
  title: string; // Define the type for title
  titlePosition?: "center" | "left"; // Add optional titlePosition prop
};

const FFScreenTopSection: React.FC<FFScreenTopSectionProps> = ({
  navigation,
  title,
  titlePosition = "center", // Default value is 'center'
}) => {
  return (
    <View
      style={[
        styles.container,
        titlePosition === "left" && styles.containerLeft,
      ]}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <IconIonicons name="chevron-back" size={24} />
      </TouchableOpacity>
      <FFText
        fontSize="lg"
        style={{
          ...(titlePosition === "center"
            ? styles.centerTitle
            : styles.leftTitle),
        }}
      >
        {title}
      </FFText>
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
  containerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    left: 16,
    top: 16,
    marginRight: 12,
  },
  centerTitle: {
    textAlign: "center",
  },
  leftTitle: {
    marginLeft: 40, // Give space for the back button
  },
});

export default FFScreenTopSection;
