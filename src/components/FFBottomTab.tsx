import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import FFText from "./FFText";
import IconFontiso from "react-native-vector-icons/Fontisto";
import IconMaterialIcons from "react-native-vector-icons/MaterialIcons";
import IconEntypo from "react-native-vector-icons/Entypo";
import IconFoundation from "react-native-vector-icons/Foundation";
import { useTheme } from "@/src/hooks/useTheme";

type FFBottomTabProps = {
  currentScreen: number;
  setCurrentScreen: (screenIndex: number) => void;
};

const TAB_ITEMS = [
  { icon: <IconFontiso name="home" size={20} />, label: "Home" },
  { icon: <IconFoundation name="graph-bar" size={20} />, label: "Statistics" },
  { icon: <IconMaterialIcons name="perm-contact-cal" size={20} />, label: "Contacts" },
  { icon: <IconFontiso name="user-secret" size={20} />, label: "Profile" },
];

const FFBottomTab: React.FC<FFBottomTabProps> = ({ currentScreen, setCurrentScreen }) => {
  const { theme } = useTheme();

  const getButtonStyle = (isSelected: boolean) => ({
    flex: isSelected ? 2 : 1,
    backgroundColor: isSelected ? "#63c550" : (theme === "dark" ? "#111" : "white"),
  });

  const getIconStyle = (isSelected: boolean) => ({
    color: isSelected || theme === "dark" ? "white" : "#111",
  });

  const renderTabButton = (index: number, { icon, label }: typeof TAB_ITEMS[0]) => {
    const isSelected = currentScreen === index;

    return (
      <TouchableOpacity
        key={index}
        style={[styles.button, getButtonStyle(isSelected)]}
        onPress={() => setCurrentScreen(index)}
      >
        {React.cloneElement(icon, { style: getIconStyle(isSelected) })}
        {isSelected && <FFText style={{...styles.text, color: currentScreen === index ? 'white' : '#111'}}>{label}</FFText>}
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme === "light" ? "white" : "#111",
          shadowColor: theme === "light" ? "#111" : "white",
        },
      ]}
    >
      {TAB_ITEMS.map((item, index) => renderTabButton(index, item))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    marginHorizontal: "2.5%",
    width: "95%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  button: {
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  text: {
    fontSize: 12,
  },
});

export default FFBottomTab;
