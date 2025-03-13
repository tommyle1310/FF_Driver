import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useFChatSocket } from "@/src/hooks/useFChatSocket";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";

type FChatNavigationProp = StackNavigationProp<SidebarStackParamList, "FChat">;
type FChatRouteProp = RouteProp<SidebarStackParamList, "FChat">;

const FChatScreen = () => {
  const navigation = useNavigation<FChatNavigationProp>();
  const route = useRoute<FChatRouteProp>();
  const [message, setMessage] = useState("");
  const { socket, messages, roomId, startChat, sendMessage, getChatHistory } =
    useFChatSocket();
  const { userId, driverId } = useSelector((state: RootState) => state.auth);

  // Start chat when component mounts
  useEffect(() => {
    if (socket && route.params?.withUserId) {
      startChat(
        route.params.withUserId,
        route.params.type || "SUPPORT",
        route.params.orderId
      );
    }
  }, [socket, route.params]);

  // Get chat history when roomId is available
  useEffect(() => {
    if (roomId) {
      const chatHistory = getChatHistory();
    }
  }, [roomId]);

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <FFSafeAreaView>
      {/* Chat Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <FFScreenTopSection
          title="Support Chat"
          titlePosition="left"
          navigation={navigation}
        />
        <View className="flex-row ml-auto gap-4 mt-2">
          <TouchableOpacity>
            <Ionicons name="call" size={24} color="#63c550" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="videocam" size={24} color="#63c550" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color="#63c550" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 20 }}
        >
          {messages.map((msg) => (
            <View
              key={msg.messageId}
              className={`flex-row ${
                msg.from === driverId ? "justify-end" : "justify-start"
              } mb-4`}
            >
              <View
                className={`max-w-[80%] rounded-2xl p-3 ${
                  msg.from === driverId
                    ? "bg-[#63c550] rounded-tr-none"
                    : "bg-gray-200 rounded-tl-none"
                }`}
              >
                {msg.type === "IMAGE" ? (
                  <Image
                    source={{ uri: msg.content }}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 10,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text
                    className={`${
                      msg.from === driverId ? "text-white" : "text-black"
                    } text-base`}
                  >
                    {msg.content}
                  </Text>
                )}
                <Text
                  className={`text-xs mt-1 ${
                    msg.from === driverId ? "text-gray-200" : "text-gray-500"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Message Input */}
        <View className="p-4 border-t border-gray-200 bg-white flex-row items-center space-x-2">
          <TouchableOpacity>
            <Ionicons name="attach" size={24} color="gray" />
          </TouchableOpacity>
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2">
            <TextInput
              className="flex-1 text-base"
              placeholder="Type your message here..."
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity>
              <Ionicons name="happy" size={24} color="gray" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="bg-[#4c9f3a] w-10 h-10 ml-2 rounded-full items-center justify-center"
            onPress={handleSendMessage}
          >
            <Ionicons name="send" size={20} color="white" className="ml-1" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </FFSafeAreaView>
  );
};

export default FChatScreen;
