import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { MainStackParamList } from "@/src/navigation/AppNavigator";
import { StackNavigationProp } from "@react-navigation/stack";
import { useFChatSocket } from "@/src/hooks/useFChatSocket";
export interface ChatbotMessage {
  sessionId: string;
  message: string;
  type: 'text' | 'options' | 'quickReplies' | 'cards' | 'form' | 'image';
  options?: any[];
  quickReplies?: any[];
  cards?: any[];
  formFields?: any[];
  followUpPrompt?: string;
  timestamp: string;
  sender: string;
  confidence?: number;
}
import { useSelector, useDispatch } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import { truncateString } from "@/src/utils/functions";
import { colors, spacing } from "@/src/theme";
import FFText from "@/src/components/FFText";
import FFView from "@/src/components/FFView";
import { ChatMessage } from "@/src/store/chatSlice";
import FFButton from "@/src/components/FFButton";
import * as ImagePicker from "expo-image-picker";
import axiosInstance from "@/src/utils/axiosConfig";
import FFSpinner from "@/src/components/FFSpinner";
import FFAvatar from "@/src/components/FFAvatar";

type FChatNavigationProp = StackNavigationProp<MainStackParamList, "FChat">;
type FChatRouteProp = RouteProp<
  MainStackParamList & {
    FChat: {
      withUserId?: string;
      type?: "SUPPORT" | "ORDER" | "CHATBOT";
      orderId?: string;
      title?: string;
    };
  },
  "FChat"
>;

// Separate component for message content to handle state properly
const MessageContent = ({ message, userId, onOptionSelect }: { 
  message: ChatMessage, 
  userId: string | null,
  onOptionSelect: (value: string) => void
}) => {
  const [imageError, setImageError] = useState(false);
  const chatbotData = message.metadata?.chatbotMessage as ChatbotMessage | undefined;
  const agentData = message.metadata?.agentMessage as any;
  
  // Helper function to format timestamp
  const formatTime = (timestamp: Date | string | number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Render chatbot options
  const renderChatbotOptions = (options: any[], messageId: string) => {
    console.log("Rendering options:", options.length, "for message:", messageId);
    
    return (
      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={`${messageId}_option_${index}`}
            style={styles.optionButton}
            onPress={() => onOptionSelect(option.value)}
          >
            <FFText style={styles.optionText}>{option.text}</FFText>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render quick replies
  const renderQuickReplies = (quickReplies: any[], messageId: string) => {
    return (
      <View style={styles.quickRepliesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickReplies.map((reply, index) => (
            <TouchableOpacity
              key={`${messageId}_reply_${index}`}
              style={styles.quickReplyButton}
              onPress={() => onOptionSelect(reply.value)}
            >
              <FFText style={styles.quickReplyText}>{reply.text}</FFText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  console.log("Rendering message content:", message.messageId, "type:", message.type, 
    "has chatbot data:", !!chatbotData,
    "has agent data:", !!agentData);
  
  // Force image type for agent messages with image messageType
  const isImageMessage = message.type === "IMAGE" || 
    (agentData && agentData.messageType === "image");
  
  if (isImageMessage) {
    console.log("Rendering image message:", message.content);
    
    // Create image component with error handling
    const imageComponent = (
      <View>
        {imageError ? (
          <View style={[styles.messageImage, styles.imageFallback]}>
            <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
            <FFText style={styles.imageFallbackText}>Image failed to load</FFText>
          </View>
        ) : (
          <Image
            source={{ uri: message.content }}
            style={styles.messageImage}
            resizeMode="cover"
            onError={() => {
              console.log("Image failed to load:", message.content);
              setImageError(true);
            }}
          />
        )}
      </View>
    );
    
    // For agent messages with images, show agent name above the image
    if (agentData?.agentName) {
      return (
        <View>
          <FFText
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: colors.primary,
              marginBottom: 4,
            }}
          >
            {agentData.agentName}
          </FFText>
          {imageComponent}
        </View>
      );
    }
    
    // Regular image message
    return imageComponent;
  } else if (message.type === "OPTIONS" && chatbotData?.options) {
    console.log("Rendering options message with options:", chatbotData.options);
    return (
      <View>
        <FFText
          style={{
            ...styles.messageText,
            ...(message.senderId === userId || message.from === userId
               ? styles.sentMessageText
               : styles.receivedMessageText),
          }}
        >
          {message.content}
        </FFText>
        {renderChatbotOptions(chatbotData.options, message.messageId)}
        {/* Display followUpPrompt if available */}
        {chatbotData.followUpPrompt && (
          <FFText
            style={{
              ...styles.messageText,
              ...(message.senderId === userId || message.from === userId
                 ? styles.sentMessageText
                 : styles.receivedMessageText),
              marginTop: 8,
              fontStyle: 'italic',
              opacity: 0.8,
            }}
          >
            {chatbotData.followUpPrompt}
          </FFText>
        )}
      </View>
    );
  } else if (chatbotData?.quickReplies && chatbotData.quickReplies.length > 0) {
    return (
      <View>
        <FFText
          style={{
            ...styles.messageText,
            ...(message.senderId === userId || message.from === userId
               ? styles.sentMessageText
               : styles.receivedMessageText),
          }}
        >
          {message.content}
        </FFText>
        {renderQuickReplies(chatbotData.quickReplies, message.messageId)}
        {/* Display followUpPrompt if available */}
        {chatbotData.followUpPrompt && (
          <FFText
            style={{
              ...styles.messageText,
              ...(message.senderId === userId || message.from === userId
                 ? styles.sentMessageText
                 : styles.receivedMessageText),
              marginTop: 8,
              fontStyle: 'italic',
              opacity: 0.8,
            }}
          >
            {chatbotData.followUpPrompt}
          </FFText>
        )}
      </View>
    );
  } else if (agentData) {
    // Special styling for human agent messages
    return (
      <View>
        {/* Agent name if available */}
        {agentData.agentName && (
          <FFText
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: colors.primary,
              marginBottom: 4,
            }}
          >
            {agentData.agentName}
          </FFText>
        )}
        <FFText
          style={{
            ...styles.messageText,
            ...(message.senderId === userId || message.from === userId
               ? styles.sentMessageText
               : styles.receivedMessageText),
          }}
        >
          {message.content}
        </FFText>
      </View>
    );
  } else {
    return (
      <View>
        <FFText
          style={{
            ...styles.messageText,
            ...(message.senderId === userId || message.from === userId
               ? styles.sentMessageText
               : styles.receivedMessageText),
          }}
        >
          {message.content}
        </FFText>
        {/* Display followUpPrompt if available for chatbot messages */}
        {chatbotData?.followUpPrompt && (
          <FFText
            style={{
              ...styles.messageText,
              ...(message.senderId === userId || message.from === userId
                 ? styles.sentMessageText
                 : styles.receivedMessageText),
              marginTop: 8,
              fontStyle: 'italic',
              opacity: 0.8,
            }}
          >
            {chatbotData.followUpPrompt}
          </FFText>
        )}
      </View>
    );
  }
};

const FChatScreen = () => {
  const navigation = useNavigation<FChatNavigationProp>();
  const route = useRoute<FChatRouteProp>();
  const [message, setMessage] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const dispatch = useDispatch();
  const flatListRef = useRef<FlatList>(null);
  
  // Keep track of whether we've had a valid session with dbRoomId
  const [hasHadValidSession, setHasHadValidSession] = useState(false);
  
  // Keep track of whether we've initiated the chat to prevent multiple calls
  const [hasInitiatedChat, setHasInitiatedChat] = useState(false);
  
  // Image queue state
  const [queuedImage, setQueuedImage] = useState<{
    uri: string;
    type: string;
    name: string;
    cloudUrl?: string;
  } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const {
    socket,
    messages,
    roomId,
    currentSession,
    isRequestingSupport,
    requestError,
    isConnected,
    requestCustomerCare,
    startChatbotSession,
    startChat,
    sendMessage,
    getChatHistory,
    chatType,
    selectOption,
  } = useFChatSocket();

  const { userId, id, driverId, accessToken } = useSelector(
    (state: RootState) => state.auth
  );

  // Get the chat type from route params or default to SUPPORT
  const routeChatType = route.params?.type || "SUPPORT";
  const orderId = route.params?.orderId;
  const routeTitle = route.params?.title;
  const otherUserAvatar = route.params?.avatar;
  
  // Get the order ID from the current session or route params
  const displayOrderId = currentSession?.orderId || orderId || "";

  // Initial state logic - check if we have essential chat data based on chat type
  const hasEssentialChatData = (() => {
    if (!currentSession) {
      console.log("No current session available");
      return false;
    }
    
    // For ORDER chats, we need both roomId and currentSession
    if (chatType === "ORDER") {
      const hasOrderData = roomId && currentSession.dbRoomId;
      console.log("ORDER chat - hasOrderData:", hasOrderData, "roomId:", roomId, "dbRoomId:", currentSession.dbRoomId);
      return hasOrderData;
    }
    
    // For SUPPORT/CHATBOT chats, we just need a sessionId
    if (chatType === "SUPPORT" || chatType === "CHATBOT") {
      const hasSupportData = currentSession.sessionId;
      console.log("SUPPORT/CHATBOT chat - hasSupportData:", hasSupportData, "sessionId:", currentSession.sessionId);
      return hasSupportData;
    }
    
    // Fallback for unknown chat types
    const hasFallbackData = roomId && currentSession;
    console.log("Fallback chat - hasFallbackData:", hasFallbackData);
    return hasFallbackData;
  })();

  // For CHATBOT, we don't need roomId to start chatting - we just need a valid session
  const hasChatbotSession = chatType === "CHATBOT" && currentSession?.sessionId;
  
  // Check if we have messages to display (prioritize server session messages)
  const hasMessages = messages && messages.length > 0;

  // Reset flags on mount to ensure clean state
  useEffect(() => {
    console.log("FChatScreen mounting - resetting initialization flags");
    setHasInitiatedChat(false);
    setHasHadValidSession(false);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("FChatScreen - Chat Type:", chatType);
    console.log("FChatScreen - Messages:", messages);
    console.log("FChatScreen - Current Session:", currentSession);
    console.log("FChatScreen - Room ID:", roomId);
    console.log("FChatScreen - Has Messages:", hasMessages);
    console.log("FChatScreen - Messages Length:", messages?.length || 0);
    console.log("FChatScreen - Has Essential Chat Data:", hasEssentialChatData);
    console.log("FChatScreen - Has Chatbot Session:", hasChatbotSession);
    console.log("FChatScreen - isRequestingSupport:", isRequestingSupport);
    console.log("FChatScreen - requestError:", requestError);
    console.log("FChatScreen - isConnected:", isConnected);
    console.log("FChatScreen - Auth userId:", userId);
    console.log("FChatScreen - Auth id:", id);
    console.log("FChatScreen - Auth driverId:", driverId);
    console.log("FChatScreen - Auth accessToken exists:", !!accessToken);
    
    // Debug message sender comparison
    if (messages && messages.length > 0) {
      messages.forEach((msg, index) => {
               console.log(`Message ${index} - senderId: "${msg.senderId}", from: "${msg.from}", current user id: "${id}", userId: "${userId}", driverId: "${driverId}"`);
       console.log(`Message ${index} - Is current user (senderId === id): ${msg.senderId === id}`);
       console.log(`Message ${index} - Is current user (from === id): ${msg.from === id}`);
       console.log(`Message ${index} - Is current user (senderId === userId): ${msg.senderId === userId}`);
       console.log(`Message ${index} - Is current user (from === userId): ${msg.from === userId}`);
       console.log(`Message ${index} - Is current user (senderId === driverId): ${msg.senderId === driverId}`);
       console.log(`Message ${index} - Is current user (from === driverId): ${msg.from === driverId}`);
      });
    }
  }, [chatType, messages, currentSession, roomId, hasMessages, hasEssentialChatData, hasChatbotSession, userId, id, driverId]);

  // Cleanup on unmount to prevent conflicts
  useEffect(() => {
    return () => {
      // Reset the initiated chat flag when component unmounts
      setHasInitiatedChat(false);
      setHasHadValidSession(false);
      console.log("FChatScreen unmounting, resetting flags");
    };
  }, []);

  // Start chat when component mounts (for existing chat flow)
  useEffect(() => {
    if (!socket) {
      console.log("Skipping chat initialization - socket not ready");
      return;
    }
    
    if (hasInitiatedChat) {
      console.log("Skipping chat initialization - chat already initiated");
      return;
    }
    
    if (route.params?.withUserId) {
      console.log("Starting chat with params:", {
        withUserId: route.params.withUserId,
        type: route.params.type,
        orderId: route.params.orderId
      });
      
      setHasInitiatedChat(true);
      startChat(
        route.params.withUserId,
        route.params.type || "SUPPORT",
        route.params.orderId
      );
    } else if (route.params?.type === "CHATBOT") {
      console.log("Starting chatbot session");
      setHasInitiatedChat(true);
      startChatbotSession();
    }
  }, [socket, route.params?.withUserId, route.params?.type, route.params?.orderId, hasInitiatedChat, startChat, startChatbotSession]);

  // Fetch chat history when we get a valid session
  useEffect(() => {
    if (!socket || !currentSession || hasHadValidSession) {
      return;
    }

    // For ORDER chats, we need both dbRoomId and chatId
    if (currentSession.type === "ORDER" && currentSession.dbRoomId && currentSession.chatId) {
      console.log("Fetching ORDER chat history for room:", currentSession.dbRoomId);
      getChatHistory();
      setHasHadValidSession(true);
    }
    // For SUPPORT/CHATBOT chats, we need sessionId
    else if (
      (currentSession.type === "SUPPORT" || currentSession.type === "CHATBOT") && 
      currentSession.sessionId
    ) {
      console.log("Fetching SUPPORT/CHATBOT chat history for session:", currentSession.sessionId);
      getChatHistory();
      setHasHadValidSession(true);
    }
  }, [socket, currentSession, hasHadValidSession, getChatHistory]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current && hasMessages && messages.length > 0) {
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 300);
    }
  }, [messages, hasMessages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage("");
    }
  };
  
  const handleOptionSelect = (value: string) => {
    console.log("Option selected:", value);
    selectOption(value);
  };
  
  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        alert("You need to allow access to your photos to upload an image.");
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Get file extension from URI
        const uriParts = asset.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        setQueuedImage({
          uri: asset.uri,
          type: `image/${fileType}`,
          name: `photo.${fileType}`,
        });
        
        // Start upload immediately
        uploadImage(asset.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert("Failed to pick image. Please try again.");
    }
  };
  
  const uploadImage = async (imageUri: string) => {
    if (!imageUri) return;
    
    setIsUploadingImage(true);
    
    try {
      // Create form data for upload
      const formData = new FormData();
      
      // Get file extension from URI
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      // @ts-ignore
      formData.append('file', {
        uri: imageUri,
        type: `image/${fileType}`,
        name: `photo.${fileType}`,
      });
      
      // Upload to server
      const response = await axiosInstance.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log("response img upload", response.data);
      
      if (response.data.EC === 0 && response.data.data.url) {
        // Send the image URL in the chat
        sendMessage(response.data.data.url, "IMAGE");
        
        // Clear the queued image
        setQueuedImage(null);
      } else {
        throw new Error("Failed to get image URL from server");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  const removeQueuedImage = () => {
    setQueuedImage(null);
    setIsUploadingImage(false);
  };

  const formatTime = (timestamp: Date | string | number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render customer care request UI if no essential chat data
  const renderCustomerCareRequest = () => {
    // Determine which type of chat to request based on route params
    const chatTypeToRequest = routeChatType || "SUPPORT";
    
    return (
      <View className="flex-1 justify-center items-center px-6 bg-gray-50">
        <View className="bg-white rounded-3xl p-8 shadow-lg w-full max-w-sm">
          {/* Icon */}
          <View className="items-center mb-6">
            <View className="bg-[#63c550] rounded-full p-4 mb-4">
              <Ionicons 
                name={chatTypeToRequest === "SUPPORT" ? "headset" : 
                      chatTypeToRequest === "CHATBOT" ? "chatbubbles-outline" : "chatbubbles"} 
                size={32} 
                color="white" 
              />
            </View>
            <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
              {chatTypeToRequest === "SUPPORT" ? "Customer Support" : 
               chatTypeToRequest === "CHATBOT" ? "AI Assistant" :
               "Order Chat"}
            </Text>
            <Text className="text-gray-600 text-center leading-6">
              {chatTypeToRequest === "SUPPORT" 
                ? "Need help? Our customer care team is here to assist you with any questions or concerns."
                : chatTypeToRequest === "CHATBOT"
                ? "Get instant help from our AI assistant for common questions and issues."
                : `Connecting to chat for your order #${orderId || ""}`
              }
            </Text>
          </View>

          {/* Request Button */}
          {chatTypeToRequest === "SUPPORT" ? (
            <TouchableOpacity
              className={`bg-[#63c550] rounded-2xl py-4 px-6 items-center mb-4 ${
                isRequestingSupport ? "opacity-70" : ""
              }`}
              onPress={() => {
                console.log("Request Customer Care button pressed - isRequestingSupport:", isRequestingSupport, "isConnected:", isConnected);
                requestCustomerCare();
              }}
              disabled={isRequestingSupport}
            >
              {isRequestingSupport ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-semibold ml-2">
                    Connecting...
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="headset" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">
                    Request Customer Care Chat
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : chatTypeToRequest === "CHATBOT" ? (
            <TouchableOpacity
              className={`bg-[#63c550] rounded-2xl py-4 px-6 items-center mb-4 ${
                isRequestingSupport ? "opacity-70" : ""
              }`}
              onPress={() => {
                console.log("Start Chatbot button pressed - isRequestingSupport:", isRequestingSupport, "isConnected:", isConnected);
                startChatbotSession();
              }}
              disabled={isRequestingSupport}
            >
              {isRequestingSupport ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-semibold ml-2">
                    Connecting...
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="chatbubbles-outline" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">
                    Chat with AI Assistant
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View className="flex-row items-center justify-center mb-4">
              <ActivityIndicator size="small" color="#63c550" style={{ marginRight: 8 }} />
              <Text className="text-gray-600">
                {isRequestingSupport ? "Connecting to chat..." : "Waiting for connection..."}
              </Text>
            </View>
          )}

          {/* Connection Status */}
          <View className="flex-row items-center justify-center">
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <Text
              className={`text-sm ${
                isConnected ? "text-green-600" : "text-red-600"
              }`}
            >
              {isRequestingSupport ? "Connecting..." : isConnected ? "Connected" : requestError ? "Connection Failed" : "Connecting..."}
            </Text>
          </View>

          {/* Error Message */}
          {requestError && (
            <View className="mt-4 p-3 bg-red-50 rounded-xl">
              <Text className="text-red-600 text-center text-sm">
                {requestError}
              </Text>
              {requestError.includes("try again") && (
                <View>
                  <Text className="text-gray-600 text-center text-xs mt-2">
                    The app will automatically reconnect. Wait a moment and try again.
                  </Text>
                  <TouchableOpacity
                    className="mt-2 bg-red-600 rounded-lg py-2 px-4"
                    onPress={() => {
                      if (chatTypeToRequest === "SUPPORT") {
                        requestCustomerCare();
                      } else if (chatTypeToRequest === "CHATBOT") {
                        startChatbotSession();
                      }
                    }}
                  >
                    <Text className="text-white text-center font-semibold">
                      Try Again
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  // If no essential chat data and we have access token, show customer care request
  // Exception: CHATBOT type can work with just supportSessionId
  // Also check if we have messages without a session (stale state) - reset in this case
  if ((!hasEssentialChatData && !hasChatbotSession && accessToken) || (!currentSession && hasMessages)) {
    console.log("Showing customer care request screen - hasEssentialChatData:", hasEssentialChatData, "hasChatbotSession:", hasChatbotSession, "currentSession:", !!currentSession, "hasMessages:", hasMessages);
    
    return (
      <FFSafeAreaView>
        <FFScreenTopSection
          title={routeTitle || (
            chatType === "SUPPORT" ? "Support Chat" : 
            chatType === "CHATBOT" ? "AI Assistant" :
            `Order #${truncateString(orderId || "", 5)}`
          )}
          titlePosition="left"
          navigation={navigation}
        />
        {renderCustomerCareRequest()}
      </FFSafeAreaView>
    );
  }

  return (
    <FFSafeAreaView>
      {/* Chat Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <FFScreenTopSection
          title={routeTitle || (
            chatType === "SUPPORT" ? "Support Chat" : 
            chatType === "CHATBOT" ? "AI Assistant" :
            `Order #${truncateString(displayOrderId, 5)}`
          )}
          titlePosition="left"
          navigation={navigation}
          avatar={otherUserAvatar}
        />
        <View className="flex-row ml-auto gap-4 mt-2">
          
          {chatType === "SUPPORT" && (
            <>
              <TouchableOpacity>
                <Ionicons name="call" size={24} color="#63c550" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="videocam" size={24} color="#63c550" />
              </TouchableOpacity>
            </>
          )}
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
          ref={scrollViewRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 20 }}
        >
          {!hasMessages ? (
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-gray-400">
                {chatType === "SUPPORT"
                  ? "Start a conversation with customer support"
                  : chatType === "CHATBOT"
                  ? "Ask our AI assistant a question"
                  : `Start a conversation about your order #${truncateString(displayOrderId, 5)}`}
              </Text>
            </View>
          ) : (
            messages.map((msg) => {
              // Check if this message is from the current user
              const isCurrentUser = msg.from === driverId || msg.senderId === driverId || 
                                   msg.from === id || msg.senderId === id ||
                                   msg.from === userId || msg.senderId === userId;
              
              return (
                <View
                  key={msg.messageId || `${msg.from}-${msg.timestamp}`}
                  className={`flex-row ${
                    isCurrentUser ? "justify-end" : "justify-start"
                  } mb-4`}
                >
                  <View
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      isCurrentUser
                        ? "bg-[#63c550] rounded-tr-none"
                        : "bg-gray-200 rounded-tl-none"
                    }`}
                  >
                    <MessageContent 
                      message={msg} 
                      userId={driverId || id || userId}
                      onOptionSelect={handleOptionSelect} 
                    />
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
        
        {/* Queued Image Preview */}
        {queuedImage && (
          <View style={styles.queuedImageContainer}>
            <Image 
              source={{ uri: queuedImage.uri }} 
              style={styles.queuedImage} 
              resizeMode="cover"
            />
            {isUploadingImage ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={removeQueuedImage}
              >
                <Ionicons name="close-circle" size={24} color="#ff3b30" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Message Input */}
        <View className="p-4 border-t border-gray-200 bg-white flex-row items-center space-x-2">
          <TouchableOpacity onPress={handleImagePick}>
            <Ionicons name="image" size={24} color="gray" />
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

const styles = StyleSheet.create({
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  sentMessageText: {
    color: 'white',
  },
  receivedMessageText: {
    color: 'black',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
  },
  imageFallback: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFallbackText: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  optionsContainer: {
    marginTop: 8,
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionText: {
    color: '#333',
    fontWeight: '500',
  },
  quickRepliesContainer: {
    marginTop: 8,
  },
  quickReplyButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  quickReplyText: {
    color: '#333',
  },
  queuedImageContainer: {
    position: 'relative',
    margin: 8,
    borderRadius: 8,
    overflow: 'hidden',
    height: 100,
  },
  queuedImage: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
});

export default FChatScreen;
