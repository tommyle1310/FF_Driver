import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ChatMessage {
  messageId: string;
  id?: string;
  senderId?: string;
  from: string;
  content: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "ORDER_INFO" | "OPTIONS";
  messageType?: "TEXT" | "IMAGE" | "VIDEO" | "ORDER_INFO" | "OPTIONS";
  timestamp: Date | string; // Allow both for compatibility
  roomId: string;
  // Additional fields from server response
  readBy?: string[];
  senderDetails?: {
    avatar?: any;
    first_name?: string;
    last_name?: string;
    id?: string;
    phone?: string;
  };
  senderType?:
    | "CUSTOMER"
    | "CUSTOMER_CARE_REPRESENTATIVE"
    | "RESTAURANT"
    | "DRIVER";
  metadata?: Record<string, any>;
}

interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  type: 'SUPPORT' | 'ORDER' | 'CHATBOT';
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportSession {
  sessionId: string;
  chatMode: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  slaDeadline?: string;
  timestamp: string;
}

interface ChatSession {
  chatId: string;
  dbRoomId: string;
  withUser: string;
  type: "SUPPORT" | "ORDER" | "CHATBOT";
  orderId?: string;
  sessionId?: string;
  isActive: boolean;
  createdAt: string;
  lastMessageAt?: string;
}

interface ChatState {
  // New structure
  rooms: ChatRoom[];
  activeRoomId: string | null;
  messages: Record<string, ChatMessage[]>;
  isLoading: boolean;
  error: string | null;
  supportSession: SupportSession | null;
  
  // Current session tracking
  currentSession: ChatSession | null;
  
  // Chat request state
  isRequestingSupport: boolean;
  requestError: string | null;

  // Connection state
  isConnected: boolean;

  // Loading states
  isLoadingHistory: boolean;
  isLoadingSessions: boolean;
}

const initialState: ChatState = {
  rooms: [],
  activeRoomId: null,
  messages: {},
  isLoading: false,
  error: null,
  supportSession: null,
  currentSession: null,
  isRequestingSupport: false,
  requestError: null,
  isConnected: false,
  isLoadingHistory: false,
  isLoadingSessions: false,
};

// AsyncStorage keys
const CHAT_ROOMS_KEY = "@chat_rooms";
const CHAT_MESSAGES_KEY = "@chat_messages";
const SUPPORT_SESSION_KEY = "@support_session";
const ACTIVE_ROOM_KEY = "@active_room";
const CURRENT_SESSION_KEY = "@current_chat_session";

// Load chat data from AsyncStorage
export const loadChatFromStorage = createAsyncThunk(
  'chat/loadFromStorage',
  async () => {
    try {
      const [
        roomsData,
        messagesData,
        supportSessionData,
        activeRoomData,
        currentSessionData
      ] = await Promise.all([
        AsyncStorage.getItem(CHAT_ROOMS_KEY),
        AsyncStorage.getItem(CHAT_MESSAGES_KEY),
        AsyncStorage.getItem(SUPPORT_SESSION_KEY),
        AsyncStorage.getItem(ACTIVE_ROOM_KEY),
        AsyncStorage.getItem(CURRENT_SESSION_KEY),
      ]);
      
      return {
        rooms: roomsData ? JSON.parse(roomsData) : [],
        messages: messagesData ? JSON.parse(messagesData) : {},
        supportSession: supportSessionData ? JSON.parse(supportSessionData) : null,
        activeRoomId: activeRoomData || null,
        currentSession: currentSessionData ? JSON.parse(currentSessionData) : null,
      };
    } catch (error) {
      console.error("Error loading chat data from storage:", error);
      return initialState;
    }
  }
);

// Save chat data to AsyncStorage
const saveChatToStorage = async (state: ChatState) => {
  try {
    await Promise.all([
      AsyncStorage.setItem(CHAT_ROOMS_KEY, JSON.stringify(state.rooms)),
      AsyncStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(state.messages)),
      AsyncStorage.setItem(SUPPORT_SESSION_KEY, JSON.stringify(state.supportSession)),
      state.activeRoomId ? AsyncStorage.setItem(ACTIVE_ROOM_KEY, state.activeRoomId) : AsyncStorage.removeItem(ACTIVE_ROOM_KEY),
      state.currentSession ? AsyncStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(state.currentSession)) : AsyncStorage.removeItem(CURRENT_SESSION_KEY),
    ]);
  } catch (error) {
    console.error("Error saving chat data to storage:", error);
  }
};

// Clear all chat data from AsyncStorage
const clearChatStorage = async () => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(CHAT_ROOMS_KEY),
      AsyncStorage.removeItem(CHAT_MESSAGES_KEY),
      AsyncStorage.removeItem(SUPPORT_SESSION_KEY),
      AsyncStorage.removeItem(ACTIVE_ROOM_KEY),
      AsyncStorage.removeItem(CURRENT_SESSION_KEY),
    ]);
    console.log("All chat storage cleared");
  } catch (error) {
    console.error("Error clearing chat storage:", error);
  }
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setConnectionState: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    startSupportRequest: (state) => {
      state.isRequestingSupport = true;
      state.requestError = null;
    },
    supportRequestSuccess: (state) => {
      state.isRequestingSupport = false;
      state.requestError = null;
    },
    supportRequestError: (state, action: PayloadAction<string>) => {
      state.isRequestingSupport = false;
      state.requestError = action.payload;
    },
    setChatSession: (state, action: PayloadAction<ChatSession>) => {
      state.currentSession = action.payload;
      saveChatToStorage(state);
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      const message = action.payload;
      if (!message.roomId) {
        console.error("Message has no roomId:", message);
        return;
      }
      
      if (!state.messages[message.roomId]) {
        state.messages[message.roomId] = [];
      }
      
      // Check for duplicate message
      const isDuplicate = state.messages[message.roomId].some(
        msg => msg.messageId === message.messageId
      );
      
      if (!isDuplicate) {
        state.messages[message.roomId].push(message);
        // Update room's last message if it exists
        const room = state.rooms.find(r => r.id === message.roomId);
        if (room) {
          room.lastMessage = message;
          room.updatedAt = new Date().toISOString();
        }
        saveChatToStorage(state);
      }
    },
    setMessages: (state, action: PayloadAction<{roomId: string, messages: ChatMessage[]}>) => {
      const { roomId, messages } = action.payload;
      state.messages[roomId] = messages;
      saveChatToStorage(state);
    },
    addRoom: (state, action: PayloadAction<ChatRoom>) => {
      const room = action.payload;
      const existingRoom = state.rooms.find(r => r.id === room.id);
      if (!existingRoom) {
        state.rooms.push(room);
        saveChatToStorage(state);
      }
    },
    setActiveRoom: (state, action: PayloadAction<string>) => {
      state.activeRoomId = action.payload;
      saveChatToStorage(state);
    },
    setSupportSession: (state, action: PayloadAction<SupportSession>) => {
      state.supportSession = action.payload;
      saveChatToStorage(state);
    },
    setLoadingHistory: (state, action: PayloadAction<boolean>) => {
      state.isLoadingHistory = action.payload;
    },
    clearChat: (state) => {
      state.rooms = [];
      state.messages = {};
      state.activeRoomId = null;
      state.currentSession = null;
      state.supportSession = null;
      state.isRequestingSupport = false;
      state.requestError = null;
      state.isLoadingHistory = false;
      // Clear storage completely to prevent conflicts
      clearChatStorage();
    },
    resetChatConnection: (state) => {
      state.isConnected = false;
      state.isRequestingSupport = false;
      state.requestError = null;
    },
    clearSupportError: (state) => {
      state.requestError = null;
    },
    clearAllChatStorage: (state) => {
      // Complete reset with storage clearing
      state.rooms = [];
      state.messages = {};
      state.activeRoomId = null;
      state.currentSession = null;
      state.supportSession = null;
      state.isRequestingSupport = false;
      state.requestError = null;
      state.isLoadingHistory = false;
      state.isConnected = false;
      clearChatStorage();
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadChatFromStorage.fulfilled, (state, action) => {
      return {
        ...state,
        ...action.payload,
      };
    });
  },
});

export const {
  setConnectionState,
  startSupportRequest,
  supportRequestSuccess,
  supportRequestError,
  setChatSession,
  addMessage,
  setMessages,
  addRoom,
  setActiveRoom,
  setSupportSession,
  setLoadingHistory,
  clearChat,
  resetChatConnection,
  clearSupportError,
  clearAllChatStorage,
} = chatSlice.actions;

export default chatSlice.reducer;
