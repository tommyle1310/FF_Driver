import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
} from "react-native";
import React, { useEffect, useState } from "react";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import FFText from "@/src/components/FFText";
import axiosInstance from "@/src/utils/axiosConfig";
import FFSkeleton from "@/src/components/FFSkeleton";

type SupportCenterNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "SupportCenter"
>;

export enum FAQType {
  GENERAL = "GENERAL",
  ACCOUNT = "ACCOUNT",
  PAYMENT = "PAYMENT",
  SERVICE = "SERVICE",
}

type FAQContentBlock =
  | { type: "text"; value: string }
  | { type: "image"; value: { url: string; key: string } }
  | { type: "image_row"; value: { url: string; key: string }[] };

type FAQ = {
  id: string;
  question: string;
  answer: FAQContentBlock[];
  status: string;
  type: FAQType;
  created_at: string;
  updated_at: string | null;
};

const SupportCenterScreen = () => {
  const navigation = useNavigation<SupportCenterNavigationProp>();
  const [activeTab, setActiveTab] = useState<"FAQ" | "Contact Us">("FAQ");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoadingFAQ, setIsLoadingFAQ] = useState(false);

  const fetchFAQs = async () => {
    setIsLoadingFAQ(true);
    try {
      const response = await axiosInstance.get("/faqs");
      const { EC, EM, data } = response.data;
      if (EC === 0) {
        setFaqs(data);
        console.log("FAQs fetched:", data);
      } else {
        console.log("Error fetching FAQs:", EM);
      }
    } catch (error) {
      console.log("Fetch FAQs error:", error);
    } finally {
      setIsLoadingFAQ(false);
    }
  };

  const handleFilterFAQ = async (type: FAQType) => {
    setIsLoadingFAQ(true);
    try {
      const response = await axiosInstance.get(`/faqs/type/${type}`);
      const { EC, EM, data } = response.data;
      if (EC === 0) {
        setFaqs(data);
        console.log(`FAQs of type ${type} fetched:`, data);
      } else {
        console.log("Error fetching FAQs:", EM);
      }
    } catch (error) {
      console.log(`Fetch FAQs of type ${type} error:`, error);
    } finally {
      setIsLoadingFAQ(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  const contactOptions = [
    {
      title: "Customer Services",
      icon: "headset",
      onPress: () => navigation.navigate("FChat", { type: "SUPPORT" }),
    },
    { title: "WhatsApp", icon: "logo-whatsapp" },
    { title: "Website", icon: "globe" },
    { title: "Facebook", icon: "logo-facebook" },
    { title: "Twitter", icon: "logo-twitter" },
    { title: "Instagram", icon: "logo-instagram" },
  ];

  const FAQSection = () => (
    <ScrollView className="px-4">
      {faqs.map((item, index) => (
        <TouchableOpacity key={index} className="border-b py-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-base font-medium flex-1">
              {item.question}
            </Text>
            <Ionicons name="chevron-down" size={20} color="black" />
          </View>
          {item.answer[0] &&
            (isLoadingFAQ ? (
              <View style={{ gap: 12 }}>
                <FFSkeleton height={80} />
                <FFSkeleton height={80} />
                <FFSkeleton height={80} />
              </View>
            ) : (
              <>
                {item.answer[0].type === "text" && (
                  <Text className="text-gray-600 mt-2">
                    {item.answer[0].value.replace(/\[(.*?)\]\((.*?)\)/g, "$1")}
                    {item.answer[0].value.includes("http") && (
                      <Text
                        className="text-blue-500 underline"
                        onPress={() => {
                          const url =
                            item.answer[0].value.match(/\((.*?)\)/)?.[1];
                          if (url) Linking.openURL(url);
                        }}
                      >
                        {" (Nhấn để xem)"}
                      </Text>
                    )}
                  </Text>
                )}
                {item.answer[0].type === "image" && (
                  <Image
                    source={{ uri: item.answer[0].value.url }}
                    style={{ width: "100%", height: 200, marginTop: 8 }}
                    resizeMode="contain"
                  />
                )}
                {item.answer[0].type === "image_row" && (
                  <View className="flex-row justify-between mt-2">
                    {item.answer[0].value.map((img, imgIndex) => (
                      <Image
                        key={imgIndex}
                        source={{ uri: img.url }}
                        style={{ width: "48%", height: 100 }}
                        resizeMode="contain"
                      />
                    ))}
                  </View>
                )}
              </>
            ))}
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

      <View className="flex-1">
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
              {[
                { value: FAQType.GENERAL, label: "General" },
                { value: FAQType.ACCOUNT, label: "Account" },
                { value: FAQType.PAYMENT, label: "Payment" },
                { value: FAQType.SERVICE, label: "Service" },
              ].map((category, index) => (
                <TouchableOpacity
                  onPress={() => handleFilterFAQ(category.value)}
                  key={index}
                  style={{ elevation: 3 }}
                  className="px-4 py-1 mx-2 bg-[#ffffff] items-center justify-center rounded-full"
                >
                  <FFText fontSize="sm">{category.label}</FFText>
                </TouchableOpacity>
              ))}
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
