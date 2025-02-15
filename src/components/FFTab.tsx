import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import FFText from "./FFText"; // Assuming you have a custom FFText component
import { useTheme } from "../hooks/useTheme"; // Assuming you have a custom hook for theme

interface TabProps {
  tabTitles: string[]; // Array of tab titles
  tabContent: React.ReactNode[]; // Array of components to be rendered for each tab
}

const FFTab: React.FC<TabProps> = ({ tabTitles, tabContent }) => {
  const [activeTab, setActiveTab] = useState(0); // State to track the active tab
  const { theme } = useTheme(); // Assuming theme context/hook

  return (
    <View className="flex-1">
      {/* Tab Headers */}
      <View
        style={{
          overflow: "hidden",
          borderTopLeftRadius: activeTab === 0 ? 24 : 16, // Dynamically change border radius for the first tab
          borderTopRightRadius: activeTab === 0 ? 24 : 16, // Dynamically change border radius for the first tab
        }}
        className="flex-row items-center w-full  overflow-hidden"
      >
        {tabTitles.map((title, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setActiveTab(index)}
            className={`${
              activeTab === index
                ? theme === "light"
                  ? "bg-white border-b  border-gray-200"
                  : "border bg-black border-gray-200"
                : ""
            } w-1/${tabTitles.length} items-center rounded-t-xl flex-1 p-4`}
          >
            <FFText
              fontSize="sm"
              style={{
                textAlign: "center",
                color:
                  activeTab === index
                    ? "#63c550"
                    : theme === "light"
                    ? "#111"
                    : "#ddd",
              }}
            >
              {title}
            </FFText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View
        style={{
          padding: 10,
          height: "90%",
          borderBottomLeftRadius: activeTab === 0 ? 24 : 16, // Dynamically change border radius for the first tab
          borderBottomRightRadius: activeTab === 0 ? 24 : 16, // Dynamically change border radius for the first tab
          backgroundColor: theme === "light" ? "white" : "black", // Dynamic background color
        }}
      >
        <View className="flex-1">{tabContent[activeTab]}</View>
      </View>
    </View>
  );
};

export default FFTab;
