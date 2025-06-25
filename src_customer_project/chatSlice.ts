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
  isActive: boolean;
  createdAt: string; // ISO string for serialization
  lastMessageAt?: string; // ISO string for serialization
}

interface ChatState {
  // New structure from restaurant project
  rooms: ChatRoom[];
  activeRoomId: string | null;
  messages: Record<string, ChatMessage[]>;
  isLoading: boolean;
  error: string | null;
  supportSession: SupportSession | null;
  
  // Legacy structure for backward compatibility
  currentSupportSession: ChatSession | null;
  currentOrderSession: ChatSession | null;
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  supportMessages: ChatMessage[];
  orderMessages: Record<string, ChatMessage[]>; // Keyed by orderId
  legacyMessages: ChatMessage[];
  
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
  // New structure
  rooms: [],
  activeRoomId: null,
  messages: {},
  isLoading: false,
  error: null,
  supportSession: null,
  
  // Legacy structure
  currentSupportSession: null,
  currentOrderSession: null,
  currentSession: null,
  sessions: [],
  supportMessages: [],
  orderMessages: {},
  legacyMessages: [],
  isRequestingSupport: false,
  requestError: null,
  isConnected: false,
  isLoadingHistory: false,
  isLoadingSessions: false,
};

// AsyncStorage keys
const CHAT_SESSIONS_KEY = "@chat_sessions";
const CHAT_SUPPORT_MESSAGES_KEY = "@chat_support_messages";
const CHAT_ORDER_MESSAGES_KEY = "@chat_order_messages";
const CURRENT_SUPPORT_SESSION_KEY = "@current_support_chat_session";
const CURRENT_ORDER_SESSION_KEY = "@current_order_chat_session";
const CHAT_ROOMS_KEY = "@chat_rooms";
const CHAT_MESSAGES_KEY = "@chat_messages";
const SUPPORT_SESSION_KEY = "@support_session";
const ACTIVE_ROOM_KEY = "@active_room";

// Legacy keys
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
        // Legacy data
        sessionsData, 
        supportMessagesData, 
        orderMessagesData, 
        currentSupportSessionData,
        currentOrderSessionData,
        legacyMessagesData,
        currentSessionData
      ] = await Promise.all([
        AsyncStorage.getItem(CHAT_ROOMS_KEY),
        AsyncStorage.getItem(CHAT_MESSAGES_KEY),
        AsyncStorage.getItem(SUPPORT_SESSION_KEY),
        AsyncStorage.getItem(ACTIVE_ROOM_KEY),
        // Legacy data
        AsyncStorage.getItem(CHAT_SESSIONS_KEY),
        AsyncStorage.getItem(CHAT_SUPPORT_MESSAGES_KEY),
        AsyncStorage.getItem(CHAT_ORDER_MESSAGES_KEY),
        AsyncStorage.getItem(CURRENT_SUPPORT_SESSION_KEY),
        AsyncStorage.getItem(CURRENT_ORDER_SESSION_KEY),
        AsyncStorage.getItem("@chat_messages"),
        AsyncStorage.getItem(CURRENT_SESSION_KEY),
      ]);
      
      // Parse new structure data
      const rooms = roomsData ? JSON.parse(roomsData) : [];
      const messages = messagesData ? JSON.parse(messagesData) : {};
      const supportSession = supportSessionData ? JSON.parse(supportSessionData) : null;
      const activeRoomId = activeRoomData || null;
      
      // Parse legacy data
      const sessions = sessionsData ? JSON.parse(sessionsData) : [];
      const supportMessages = supportMessagesData ? JSON.parse(supportMessagesData) : [];
      const orderMessages = orderMessagesData ? JSON.parse(orderMessagesData) : {};
      const currentSupportSession = currentSupportSessionData ? JSON.parse(currentSupportSessionData) : null;
      const currentOrderSession = currentOrderSessionData ? JSON.parse(currentOrderSessionData) : null;
      const legacyMessages = legacyMessagesData ? JSON.parse(legacyMessagesData) : [];
      const currentSession = currentSessionData ? JSON.parse(currentSessionData) : null;
      
      // If we have legacy data but no new data, migrate it
      let finalCurrentSession = currentSupportSession || currentOrderSession || currentSession || null;
      
      return {
        rooms,
        messages,
        supportSession,
        activeRoomId,
        // Legacy data
        sessions,
        supportMessages,
        orderMessages,
        currentSupportSession,
        currentOrderSession,
        currentSession: finalCurrentSession,
        legacyMessages,
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
      state.activeRoomId ? AsyncStorage.setItem(ACTIVE_ROOM_KEY, state.activeRoomId) : null,
    ]);
  } catch (error) {
    console.error('Failed to save chat data to storage:', error);
  }
};

// Legacy: Save chat session to storage
export const saveChatSessionToStorage = createAsyncThunk(
  "chat/saveChatSessionToStorage",
  async (session: ChatSession) => {
    try {
      // Save current session based on type
      if (session.type === "SUPPORT") {
        await AsyncStorage.setItem(CURRENT_SUPPORT_SESSION_KEY, JSON.stringify(session));
      } else if (session.type === "ORDER") {
        await AsyncStorage.setItem(CURRENT_ORDER_SESSION_KEY, JSON.stringify(session));
      }
      
      // Also save to legacy key for backward compatibility
      await AsyncStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));

      // Update sessions list
      const existingSessions = await AsyncStorage.getItem(CHAT_SESSIONS_KEY);
      const sessions: ChatSession[] = existingSessions
        ? JSON.parse(existingSessions)
        : [];

      // Update or add session
      const sessionIndex = sessions.findIndex(
        (s) => s.chatId === session.chatId
      );
      if (sessionIndex >= 0) {
        sessions[sessionIndex] = session;
      } else {
        sessions.push(session);
      }

      await AsyncStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));

      return session;
    } catch (error) {
      console.error("Error saving chat session to storage:", error);
      throw error;
    }
  }
);

export const saveMessagesToStorage = createAsyncThunk(
  "chat/saveMessagesToStorage",
  async (payload: { messages: ChatMessage[], type: "SUPPORT" | "ORDER", orderId?: string }) => {
    try {
      const { messages, type, orderId } = payload;
      
      if (type === "SUPPORT") {
        await AsyncStorage.setItem(CHAT_SUPPORT_MESSAGES_KEY, JSON.stringify(messages));
      } else if (type === "ORDER" && orderId) {
        // Get existing order messages
        const existingOrderMessages = await AsyncStorage.getItem(CHAT_ORDER_MESSAGES_KEY);
        const orderMessages = existingOrderMessages ? JSON.parse(existingOrderMessages) : {};
        
        // Update messages for this order
        orderMessages[orderId] = messages;
        
        await AsyncStorage.setItem(CHAT_ORDER_MESSAGES_KEY, JSON.stringify(orderMessages));
      } else if (type === "ORDER") {
        // If it's an ORDER type but no orderId, just save to legacy storage
        await AsyncStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
      }
      
      // Also save to legacy key for backward compatibility
      await AsyncStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
      
      return { messages, type, orderId };
    } catch (error) {
      console.error("Error saving messages to storage:", error);
      throw error;
    }
  }
);

export const clearChatSession = createAsyncThunk(
  "chat/clearChatSession",
  async (type: "SUPPORT" | "ORDER" | "ALL", { getState }) => {
    try {
      const state = getState() as { chat: ChatState };
      const currentOrderSession = state.chat.currentOrderSession;
      
      if (type === "SUPPORT" || type === "ALL") {
        await AsyncStorage.removeItem(CURRENT_SUPPORT_SESSION_KEY);
        await AsyncStorage.removeItem(CHAT_SUPPORT_MESSAGES_KEY);
      }
      
      if (type === "ORDER" || type === "ALL") {
        await AsyncStorage.removeItem(CURRENT_ORDER_SESSION_KEY);
        if (currentOrderSession?.orderId) {
          // Get existing order messages
          const existingOrderMessages = await AsyncStorage.getItem(CHAT_ORDER_MESSAGES_KEY);
          const orderMessages = existingOrderMessages ? JSON.parse(existingOrderMessages) : {};
          
          // Remove messages for this order
          delete orderMessages[currentOrderSession.orderId];
          
          await AsyncStorage.setItem(CHAT_ORDER_MESSAGES_KEY, JSON.stringify(orderMessages));
        }
      }
      
      // Also clear legacy keys if clearing all
      if (type === "ALL") {
        await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
        await AsyncStorage.removeItem(CHAT_MESSAGES_KEY);
      }
      
      return type;
    } catch (error) {
      console.error("Error clearing chat session:", error);
      throw error;
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // New actions from restaurant project
    setActiveRoom: (state, action: PayloadAction<string>) => {
      state.activeRoomId = action.payload;
      
      // Reset unread count when room becomes active
      const room = state.rooms.find(r => r.id === action.payload);
      if (room) {
        room.unreadCount = 0;
      }
      
      saveChatToStorage(state);
    },
    
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      const { roomId } = action.payload;
      
      // Ensure timestamp is a string for serialization
      const message = {
        ...action.payload,
        timestamp: action.payload.timestamp instanceof Date 
          ? action.payload.timestamp.toISOString() 
          : action.payload.timestamp
      };
      
      // Initialize messages array for the room if it doesn't exist
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      
      // Add message to the room
      state.messages[roomId].push(message);
      
      // Update room's last message
      const roomIndex = state.rooms.findIndex(r => r.id === roomId);
      if (roomIndex >= 0) {
        state.rooms[roomIndex].lastMessage = message;
        state.rooms[roomIndex].updatedAt = new Date().toISOString();
        
        // Increment unread count if this isn't the active room
        if (state.activeRoomId !== roomId) {
          state.rooms[roomIndex].unreadCount += 1;
        }
      }
      
      // Legacy: Update legacy structures
      if (state.currentSupportSession && state.currentSupportSession.dbRoomId === roomId) {
        state.supportMessages.push(message);
        state.currentSupportSession.lastMessageAt = new Date().toISOString();
        state.legacyMessages.push(message);
      } else if (state.currentOrderSession && state.currentOrderSession.dbRoomId === roomId) {
        const orderId = state.currentOrderSession.orderId;
        if (orderId) {
          if (!state.orderMessages[orderId]) {
            state.orderMessages[orderId] = [];
          }
          state.orderMessages[orderId].push(message);
          state.currentOrderSession.lastMessageAt = new Date().toISOString();
          state.legacyMessages.push(message);
        }
      }
      
      saveChatToStorage(state);
    },
    
    setMessages: (state, action: PayloadAction<{ roomId: string, messages: ChatMessage[] }>) => {
      const { roomId, messages } = action.payload;
      
      // Ensure all timestamps are strings for serialization
      const serializedMessages = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
      }));
      
      state.messages[roomId] = serializedMessages;
      
      // Update room's last message if there are messages
      if (serializedMessages.length > 0) {
        const roomIndex = state.rooms.findIndex(r => r.id === roomId);
        if (roomIndex >= 0) {
          state.rooms[roomIndex].lastMessage = serializedMessages[serializedMessages.length - 1];
        }
      }
      
      // Legacy: Update legacy structures
      if (state.currentSupportSession && state.currentSupportSession.dbRoomId === roomId) {
        state.supportMessages = serializedMessages;
        state.legacyMessages = serializedMessages;
      } else if (state.currentOrderSession && state.currentOrderSession.dbRoomId === roomId) {
        const orderId = state.currentOrderSession.orderId;
        if (orderId) {
          state.orderMessages[orderId] = serializedMessages;
          state.legacyMessages = serializedMessages;
        }
      }
      
      saveChatToStorage(state);
    },
    
    addRoom: (state, action: PayloadAction<Omit<ChatRoom, 'createdAt' | 'updatedAt'> & { 
      createdAt?: Date | string, 
      updatedAt?: Date | string 
    }>) => {
      // Convert dates to ISO strings for serialization
      const room: ChatRoom = {
        ...action.payload,
        createdAt: action.payload.createdAt instanceof Date 
          ? action.payload.createdAt.toISOString() 
          : (action.payload.createdAt || new Date().toISOString()),
        updatedAt: action.payload.updatedAt instanceof Date 
          ? action.payload.updatedAt.toISOString() 
          : (action.payload.updatedAt || new Date().toISOString())
      };
      
      // Check if room already exists
      const existingRoomIndex = state.rooms.findIndex(r => r.id === room.id);
      
      if (existingRoomIndex >= 0) {
        // Update existing room
        state.rooms[existingRoomIndex] = {
          ...state.rooms[existingRoomIndex],
          ...room,
        };
      } else {
        // Add new room
        state.rooms.push(room);
      }
      
      // Initialize messages array for the room
      if (!state.messages[room.id]) {
        state.messages[room.id] = [];
      }
      
      // Legacy: Update legacy structures if this is a new room
      if (existingRoomIndex < 0) {
        if (room.type === "SUPPORT") {
          if (!state.currentSupportSession) {
            state.currentSupportSession = {
              chatId: room.id,
              dbRoomId: room.id,
              withUser: room.participants[0] || "",
              type: "SUPPORT",
              isActive: true,
              createdAt: room.createdAt,
              lastMessageAt: room.updatedAt,
            };
            state.currentSession = state.currentSupportSession;
          }
        } else if (room.type === "ORDER" && room.orderId) {
          if (!state.currentOrderSession) {
            state.currentOrderSession = {
              chatId: room.id,
              dbRoomId: room.id,
              withUser: room.participants[0] || "",
              type: "ORDER",
              orderId: room.orderId,
              isActive: true,
              createdAt: room.createdAt,
              lastMessageAt: room.updatedAt,
            };
            if (!state.currentSession) {
              state.currentSession = state.currentOrderSession;
            }
          }
        }
      }
      
      saveChatToStorage(state);
    },
    
    clearUnreadCount: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      const roomIndex = state.rooms.findIndex(r => r.id === roomId);
      
      if (roomIndex >= 0) {
        state.rooms[roomIndex].unreadCount = 0;
      }
      
      saveChatToStorage(state);
    },

    setSupportSession: (state, action: PayloadAction<SupportSession>) => {
      state.supportSession = action.payload;
      saveChatToStorage(state);
    },

    clearSupportSession: (state) => {
      state.supportSession = null;
      saveChatToStorage(state);
    },
    
    // Legacy actions for backward compatibility
    setConnectionState: (state, action) => {
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

    supportRequestError: (state, action) => {
      state.isRequestingSupport = false;
      state.requestError = action.payload;
    },

    setChatSession: (state, action) => {
      // Accept either a full session object or individual properties
      let session: ChatSession;
      
      if (action.payload.chatId && action.payload.createdAt) {
        // Full session object
        session = action.payload;
      } else {
        // Individual properties (legacy support)
        const { chatId, dbRoomId, withUser, type, orderId } = action.payload;
        session = {
          chatId,
          dbRoomId,
          withUser,
          type,
          orderId,
          isActive: true,
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
        };
      }
      
      // Store session based on type
      if (session.type === "SUPPORT") {
        state.currentSupportSession = session;
      } else if (session.type === "ORDER") {
        state.currentOrderSession = session;
      }
      
      // Also update legacy field for backward compatibility
      state.currentSession = session;
      
      // Create a room for this session if it doesn't exist
      const roomExists = state.rooms.some(room => room.id === session.dbRoomId);
      if (!roomExists) {
        state.rooms.push({
          id: session.dbRoomId,
          participants: [session.withUser],
          unreadCount: 0,
          type: session.type,
          orderId: session.orderId,
          createdAt: session.createdAt,
          updatedAt: session.lastMessageAt || session.createdAt,
        });
      }
      
      // Set this room as active
      state.activeRoomId = session.dbRoomId;
    },

    endChatSession: (state, action) => {
      const type = action.payload?.type || "ALL";
      
      if (type === "SUPPORT" || type === "ALL") {
        if (state.currentSupportSession) {
          state.currentSupportSession.isActive = false;
        }
      }
      
      if (type === "ORDER" || type === "ALL") {
        if (state.currentOrderSession) {
          state.currentOrderSession.isActive = false;
        }
      }
      
      // Update legacy field
      if (state.currentSession) {
        state.currentSession.isActive = false;
      }
    },

    clearMessages: (state, action) => {
      const type = action.payload?.type || "ALL";
      const orderId = action.payload?.orderId;
      
      if (type === "SUPPORT" || type === "ALL") {
        state.supportMessages = [];
      }
      
      if (type === "ORDER" && orderId) {
        state.orderMessages[orderId] = [];
      } else if (type === "ORDER" && !orderId && state.currentOrderSession?.orderId) {
        state.orderMessages[state.currentOrderSession.orderId] = [];
      } else if (type === "ALL") {
        state.orderMessages = {};
      }
      
      // Update legacy field
      if (type === "ALL") {
        state.legacyMessages = [];
      }
    },

    setLoadingHistory: (state, action) => {
      state.isLoadingHistory = action.payload;
    },

    setLoadingSessions: (state, action) => {
      state.isLoadingSessions = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loadChatFromStorage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadChatFromStorage.fulfilled, (state, action) => {
        state.isLoading = false;
        
        if (action.payload) {
          // New structure
          state.rooms = action.payload.rooms || [];
          state.messages = action.payload.messages || {};
          state.supportSession = action.payload.supportSession;
          state.activeRoomId = action.payload.activeRoomId;
          
          // Legacy structure
          state.sessions = action.payload.sessions || [];
          state.supportMessages = action.payload.supportMessages || [];
          state.orderMessages = action.payload.orderMessages || {};
          state.currentSupportSession = action.payload.currentSupportSession;
          state.currentOrderSession = action.payload.currentOrderSession;
          state.currentSession = action.payload.currentSession;
          state.legacyMessages = action.payload.legacyMessages || [];
        }
      })
      .addCase(loadChatFromStorage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load chat data';
      })
      .addCase(saveChatSessionToStorage.fulfilled, (state, action) => {
        // Update sessions list in state
        const session = action.payload;
        const sessionIndex = state.sessions.findIndex(
          (s) => s.chatId === session.chatId
        );
        if (sessionIndex >= 0) {
          state.sessions[sessionIndex] = session;
        } else {
          state.sessions.push(session);
        }
      })
      .addCase(saveMessagesToStorage.fulfilled, (state, action) => {
        // Messages are already updated in state, this is just for persistence confirmation
      })
      .addCase(clearChatSession.fulfilled, (state, action) => {
        const type = action.payload;
        
        if (type === "SUPPORT" || type === "ALL") {
          state.currentSupportSession = null;
          state.supportMessages = [];
        }
        
        if (type === "ORDER" || type === "ALL") {
          if (state.currentOrderSession?.orderId) {
            delete state.orderMessages[state.currentOrderSession.orderId];
          }
          state.currentOrderSession = null;
        }
        
        if (type === "ALL") {
          state.currentSession = null;
          state.messages = {};
        }
      });
  },
});

export const {
  // New actions
  setActiveRoom,
  addMessage,
  setMessages,
  addRoom,
  clearUnreadCount,
  setSupportSession,
  clearSupportSession,
  
  // Legacy actions
  setConnectionState,
  startSupportRequest,
  supportRequestSuccess,
  supportRequestError,
  setChatSession,
  endChatSession,
  clearMessages,
  setLoadingHistory,
  setLoadingSessions,
} = chatSlice.actions;

export default chatSlice.reducer;
