import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import FFView from "@/src/components/FFView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import { ScrollView } from "react-native-gesture-handler";
import Ionicons from "react-native-vector-icons/Ionicons";
import FFText from "@/src/components/FFText";

type TrackHistorySreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "SupportCenter"
>;

const SupportCenterScreen = () => {
  const navigation = useNavigation<TrackHistorySreenNavigationProp>();
  const [activeTab, setActiveTab] = useState<"FAQ" | "Contact Us">("FAQ");

  const faqData = [
    {
      question: "How do I manage my notifications?",
      answer:
        "To manage notifications, go to 'Settings,' select 'Notification Settings,' and customize your preferences.",
    },
    {
      question: "How do I start a guided meditation session?",
      answer:
        "Select a meditation from our library and follow the audio instructions.",
    },
    {
      question: "How do I join a support group?",
      answer:
        "Browse available groups in the 'Community' section and click 'Join'.",
    },
    {
      question: "Is my data safe and private?",
      answer: "Yes, we use industry-standard encryption to protect your data.",
    },
  ];

  const contactOptions = [
    {
      title: "Customer Services",
      icon: "headset",
      onPress: () => {
        navigation.navigate("FChat", { type: "SUPPORT" });
      },
    },
    { title: "WhatsApp", icon: "logo-whatsapp" },
    { title: "Website", icon: "globe" },
    { title: "Facebook", icon: "logo-facebook" },
    { title: "Twitter", icon: "logo-twitter" },
    { title: "Instagram", icon: "logo-instagram" },
  ];

  const FAQSection = () => (
    <ScrollView className="px-4">
      {faqData.map((item, index) => (
        <TouchableOpacity key={index} className="border-b  py-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-base font-medium flex-1">
              {item.question}
            </Text>
            <Ionicons name="chevron-down" size={20} color="black" />
          </View>
          <Text className="text-gray-600 mt-2">{item.answer}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const ContactSection = () => (
    <ScrollView className="px-4">
      {contactOptions.map((option, index) => (
        <TouchableOpacity
          key={index}
          onPress={option.onPress}
          className="flex-row items-center py-4 border-b border-gray-200"
        >
          <Ionicons name={option.icon as any} size={24} color="black" />
          <Text className="ml-4 text-base">{option.title}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <FFSafeAreaView className="">
      <FFScreenTopSection title="Support Center" navigation={navigation} />

      <View className=" flex-1">
        {/* Tab Buttons */}
        <View className="flex-row border-b border-gray-200">
          <TouchableOpacity
            className={`flex-1 py-3 ${
              activeTab === "FAQ" ? "border-b-2 border-black" : ""
            }`}
            onPress={() => setActiveTab("FAQ")}
          >
            <Text
              className={`text-center ${
                activeTab === "FAQ" ? "font-bold" : ""
              }`}
            >
              FAQ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 ${
              activeTab === "Contact Us" ? "border-b-2 border-black" : ""
            }`}
            onPress={() => setActiveTab("Contact Us")}
          >
            <Text
              className={`text-center ${
                activeTab === "Contact Us" ? "font-bold" : ""
              }`}
            >
              Contact Us
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-[1]">
          {/* Category Pills */}
          {activeTab === "FAQ" && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="py-3"
              style={{ height: 0 }}
            >
              {["General", "Account", "Payment", "Service"].map(
                (category, index) => (
                  <TouchableOpacity
                    key={index}
                    className="px-4 py-1 mx-2 bg-[#ceedc3] items-center justify-center rounded-full"
                  >
                    <FFText fontSize="sm">{category}</FFText>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          )}

          {/* Content Section */}
          <View className="flex-[20]">
            {activeTab === "FAQ" ? <FAQSection /> : <ContactSection />}
          </View>
        </View>
      </View>
    </FFSafeAreaView>
  );
};

export default SupportCenterScreen;
