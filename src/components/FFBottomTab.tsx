import React, { useEffect } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import FFText from "./FFText";
import IconFontiso from "react-native-vector-icons/Fontisto";
import IconIonicons from "react-native-vector-icons/Ionicons";
import IconEntypo from "react-native-vector-icons/Entypo";
import { useTheme } from "@/src/hooks/useTheme";
import { useDispatch, useSelector } from "../store/types";
import { RootState } from "../store/store";
import { loadCartItemsFromAsyncStorage } from "../store/userPreferenceSlice";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { BottomTabParamList } from "../navigation/AppNavigator";

type FFBottomTabProps = {
  currentScreen: number;
  setCurrentScreen: (screenIndex: number) => void;
};

const TAB_ITEMS = [
  { icon: <IconFontiso name="home" size={20} />, label: "Home" },
  { icon: <IconIonicons name="receipt-outline" size={20} />, label: "Orders" },
  { icon: <IconEntypo name="shop" size={20} />, label: "Menu" },
  { icon: <IconFontiso name="user-secret" size={20} />, label: "Settings" },
];

const FFBottomTab: React.FC<FFBottomTabProps> = ({
  currentScreen,
  setCurrentScreen,
}) => {
  const navigation =
    useNavigation<BottomTabNavigationProp<BottomTabParamList>>();
  const { theme } = useTheme();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadCartItemsFromAsyncStorage());
  }, [dispatch]);

  const listCartItem = useSelector(
    (state: RootState) => state.userPreference.cart_items
  );

  const getButtonStyle = (isSelected: boolean) => ({
    flex: isSelected ? 2 : 1,
    backgroundColor: isSelected
      ? "#63c550"
      : theme === "dark"
      ? "#111"
      : "white",
  });

  const getIconStyle = (isSelected: boolean) => ({
    color: isSelected || theme === "dark" ? "white" : "#111",
  });

  const renderTabButton = (
    index: number,
    { icon, label }: (typeof TAB_ITEMS)[0]
  ) => {
    const isSelected = currentScreen === index;
    const paramLabel = label as "Home" | "Orders" | "MenuManagement" | "Settings";
    const handlePress = () => {
      setCurrentScreen(index); // Update the active tab state
    };

    return (
      <TouchableOpacity
        key={index}
        style={[styles.button, getButtonStyle(isSelected)]}
        onPress={handlePress}
      >
        {index === 1 && listCartItem.length > 0 && (
          <View
            style={{
              position: "absolute",
              paddingHorizontal: 6,
              borderRadius: 8,
              backgroundColor: "#E9A000",
              top: -2,
              right: 2,
            }}
          >
            <FFText colorLight="#fff" fontSize="sm" colorDark="#fff">
              {listCartItem.length}
            </FFText>
          </View>
        )}
        {React.cloneElement(icon, { style: getIconStyle(isSelected) })}
        {isSelected && (
          <FFText
            style={{
              ...styles.text,
              color: currentScreen === index ? "white" : "#111",
            }}
          >
            {label}
          </FFText>
        )}
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
    position: "relative",
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
