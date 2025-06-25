import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector, useDispatch } from "@/src/store/types";
import { RootState, store } from "@/src/store/store";
import { BACKEND_URL, CHAT_SOCKET_URL } from "../utils/constants";
import {
  setConnectionState,
  startSupportRequest,
  supportRequestSuccess,
  supportRequestError,
  setChatSession,
  addMessage,
  setMessages,
  setLoadingHistory,
  loadChatFromStorage,
  saveChatSessionToStorage,
  saveMessagesToStorage,
  ChatMessage,
  addRoom,
  setActiveRoom,
  setSupportSession,
} from "@/src/store/chatSlice";

// Define types for the chatbot responses
export interface ChatbotOption {
  text: string;
  value: string;
}

export interface ChatbotQuickReply {
  text: string;
  value: string;
}

export interface ChatbotCard {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  buttons?: Array<{
    text: string;
    value: string;
  }>;
}

export interface ChatbotFormField {
  type: 'text' | 'select' | 'date' | 'number';
  label: string;
  key: string;
  required?: boolean;
  options?: Array<{
    text: string;
    value: string;
  }>;
}

export interface ChatbotMessage {
  sessionId: string;
  message: string;
  type: 'text' | 'options' | 'quickReplies' | 'cards' | 'form' | 'image';
  options?: ChatbotOption[];
  quickReplies?: ChatbotQuickReply[];
  cards?: ChatbotCard[];
  formFields?: ChatbotFormField[];
  followUpPrompt?: string;
  timestamp: string;
  sender: string;
  confidence?: number;
}

export const useFChatSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingSupport, setIsRequestingSupport] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [chatType, setChatType] = useState<"SUPPORT" | "ORDER" | "CHATBOT">("SUPPORT");
  const [currentSession, setCurrentSession] = useState<{
    chatId?: string;
    dbRoomId?: string;
    withUser?: string;
    type?: "SUPPORT" | "ORDER" | "CHATBOT";
    orderId?: string;
    supportSessionId?: string;
  } | null>(null);
  
  // Track sent messages to avoid duplicates
  const sentMessagesRef = useRef<Set<string>>(new Set());
  
  const dispatch = useDispatch();
  
  // Get state from Redux
  const { accessToken, id: userId } = useSelector((state: RootState) => state.auth);
  const {
    // New structure
    activeRoomId,
    messages,
    supportSession,
    rooms,
    // Legacy structure
    currentSupportSession,
    currentOrderSession,
    supportMessages,
    orderMessages,
    legacyMessages,
    isRequestingSupport: storeIsRequestingSupport,
    requestError: storeRequestError,
    isConnected: storeIsConnected,
  } = useSelector((state: RootState) => state.chat);
  
  // Sync local state with Redux state
  useEffect(() => {
    setIsRequestingSupport(storeIsRequestingSupport);
    setRequestError(storeRequestError);
    setIsConnected(storeIsConnected);
  }, [storeIsRequestingSupport, storeRequestError, storeIsConnected]);
  
  // Get the appropriate session based on chat type
  useEffect(() => {
    if (chatType === "SUPPORT") {
      // If we have a support session (from chatbot->agent transition), use it
      if (supportSession?.sessionId) {
        setCurrentSession({
          type: "SUPPORT",
          supportSessionId: supportSession.sessionId,
        });
      } else if (currentSupportSession) {
        setCurrentSession({
          chatId: currentSupportSession.chatId,
          dbRoomId: currentSupportSession.dbRoomId,
          withUser: currentSupportSession.withUser,
          type: "SUPPORT",
          orderId: undefined,
        });
      }
    } else if (chatType === "ORDER") {
      setCurrentSession({
        chatId: currentOrderSession?.chatId,
        dbRoomId: currentOrderSession?.dbRoomId,
        withUser: currentOrderSession?.withUser,
        type: "ORDER",
        orderId: currentOrderSession?.orderId,
      });
    } else if (chatType === "CHATBOT") {
      // For chatbot, always set the session even if supportSession is not available yet
      setCurrentSession({
        type: "CHATBOT",
        supportSessionId: supportSession?.sessionId,
      });
    }
  }, [chatType, currentSupportSession, currentOrderSession, supportSession]);
  
  // Get messages for the active room
  const activeRoomMessages = activeRoomId ? messages[activeRoomId] || [] : [];
  
  // Get the appropriate messages based on chat type and legacy structure
  const getActiveMessages = useCallback(() => {
    // For support chats, prioritize the server session room over fallback
    if (chatType === "SUPPORT" && currentSession?.supportSessionId) {
      const supportRoomId = currentSession.supportSessionId.startsWith('support_') 
        ? currentSession.supportSessionId 
        : `support_${currentSession.supportSessionId}`;
      if (messages[supportRoomId]) {
        return messages[supportRoomId];
      }
    }
    
    // For chatbot, prioritize the server session room over fallback
    if (chatType === "CHATBOT" && currentSession?.supportSessionId) {
      const chatbotRoomId = `chatbot_${currentSession.supportSessionId}`;
      if (messages[chatbotRoomId]) {
        return messages[chatbotRoomId];
      }
    }
    
    // First try to get messages from the new structure (this is the primary source)
    if (activeRoomId && messages[activeRoomId]) {
      console.log("Returning messages from activeRoomId:", activeRoomId, "count:", messages[activeRoomId].length);
      return messages[activeRoomId];
    }
    
    // If not found, try to get from legacy structure
    if (chatType === "SUPPORT") {
      console.log("Returning legacy support messages, count:", supportMessages.length);
      return supportMessages;
    } else if (chatType === "ORDER") {
      // For ORDER chats, check if we have messages for this order
      const orderId = currentSession?.orderId || currentOrderSession?.orderId;
      if (orderId && orderMessages[orderId]) {
        console.log("Returning legacy order messages for order:", orderId, "count:", orderMessages[orderId].length);
        return orderMessages[orderId];
      }
    }
    
    // Fallback to empty array if no messages found
    console.log("No messages found, returning empty array");
    return [];
  }, [activeRoomId, messages, chatType, currentSession, currentOrderSession, supportMessages, orderMessages]);

  // Get active messages
  const activeMessages = getActiveMessages();

  // Get roomId from active session or activeRoomId
  const roomId = (() => {
    if (chatType === "SUPPORT" && currentSession?.supportSessionId) {
      return currentSession.supportSessionId.startsWith('support_') 
        ? currentSession.supportSessionId 
        : `support_${currentSession.supportSessionId}`;
    }
    if (chatType === "CHATBOT" && currentSession?.supportSessionId) {
      return currentSession.supportSessionId.startsWith('chatbot_') 
        ? currentSession.supportSessionId 
        : `chatbot_${currentSession.supportSessionId}`;
    }
    return activeRoomId || currentSession?.dbRoomId || null;
  })();

  // Debug logging
  useEffect(() => {
    console.log("Chat type:", chatType);
    console.log("Current session:", currentSession);
    console.log("Active room ID:", activeRoomId);
    console.log("Room ID:", roomId);
    console.log("Active messages:", activeMessages);
  }, [chatType, currentSession, activeRoomId, roomId, activeMessages]);

  // Load chat data on mount
  useEffect(() => {
    dispatch(loadChatFromStorage());
  }, [dispatch]);

  // Initialize socket connection
  useEffect(() => {
    if (!accessToken) {
      console.log("No access token available");
      return;
    }

    console.log("Initializing socket connection with URL:", `${CHAT_SOCKET_URL}`);
    
    // Initialize socket connection specifically for chat
    const socketInstance = io(`${CHAT_SOCKET_URL}`, {
      transports: ["websocket"],
      extraHeaders: {
        auth: `Bearer ${accessToken}`,
      },
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
    });

    // Log all socket events for debugging
    const originalEmit = socketInstance.emit;
    socketInstance.emit = function(event: string, ...args: any[]) {
      console.log(`[Socket Emit] ${event}`, args.length > 0 ? args[0] : '');
      return originalEmit.apply(this, [event, ...args]);
    };

    socketInstance.onAny((event, ...args) => {
      console.log(`[Socket Received] ${event}`, args.length > 0 ? args[0] : '');
    });

    socketInstance.on("connect", () => {
      console.log("Connected to chat server with socket ID:", socketInstance.id);
      setSocket(socketInstance);
      dispatch(setConnectionState(true));
      
      // Do NOT automatically restore sessions or emit events on connect
      // Let the components decide when to start chats
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Disconnected from chat server:", reason);
      setSocket(null);
      dispatch(setConnectionState(false));
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setSocket(null);
      dispatch(setConnectionState(false));
    });

    // Handle incoming messages
    socketInstance.on("newMessage", (message: any) => {
      console.log("New message received:", message);
      
      // Check if this is a message we already sent locally
      // Only skip if it's from the same user AND we have it in our tracking set
      if (message.senderId === userId && sentMessagesRef.current.has(message.content)) {
        console.log("Skipping duplicate message that we already added locally:", message.content);
        // Remove from tracking set as we've now processed it
        sentMessagesRef.current.delete(message.content);
        return;
      }
      
      // If it's from a different user, always process it (even if content is the same)
      if (message.senderId !== userId) {
        console.log("Processing message from other user:", message.senderId, "content:", message.content);
      }
      
      // Format message to match our interface
      const formattedMessage: ChatMessage = {
        messageId: message.id || message.messageId || "",
        id: message.id,
        senderId: message.senderId,
        from: message.senderId || "",
        content: message.content,
        type: message.messageType || message.type || "TEXT",
        messageType: message.messageType || message.type || "TEXT",
        timestamp: message.timestamp,
        roomId: message.roomId,
        readBy: message.readBy,
        senderDetails: message.senderDetails,
        senderType: message.senderType,
        metadata: message.metadata || {},
      };
      
      // If we have a roomId in the message
      if (formattedMessage.roomId) {
        // Check if this room exists in our store
        const state = store.getState();
        const roomExists = state.chat.rooms.some((room: any) => room.id === formattedMessage.roomId);
        
        if (!roomExists) {
          console.log("Creating new room for message:", formattedMessage.roomId);
          
          // Create a new room for this message
          dispatch(addRoom({
            id: formattedMessage.roomId,
            participants: [formattedMessage.senderId || formattedMessage.from || "unknown"],
            unreadCount: 1,
            type: currentSession?.type || "SUPPORT",
            orderId: currentSession?.orderId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
          
          // If we don't have an active room or this message is for our current session but we're missing the roomId
          if (!activeRoomId || (currentSession && !currentSession.dbRoomId)) {
            console.log("Setting active room to:", formattedMessage.roomId);
            dispatch(setActiveRoom(formattedMessage.roomId));
            
            // Update current session with the roomId
            if (currentSession) {
              setCurrentSession({
                ...currentSession,
                dbRoomId: formattedMessage.roomId
              });
            }
          }
        }
        
        // Add the message to the store
        dispatch(addMessage(formattedMessage));
      } else {
        console.warn("Received message without roomId:", formattedMessage);
      }
    });
    
    // Handle chat history for ORDER chats
    socketInstance.on(
      "chatHistory",
      (data: { chatId: string; messages: any[]; id: string; roomId: string }) => {
        console.log("Chat history received:", data);
        if (data.messages && Array.isArray(data.messages)) {
          const formattedMessages = data.messages.map((msg) => ({
            ...msg,
            messageId: msg.id ?? "",
            from: msg.senderId ?? "",
            content: msg.content,
            type: msg.messageType ?? "TEXT",
            messageType: msg.messageType ?? "TEXT",
            timestamp: msg.timestamp,
            roomId: msg.roomId || data.roomId,
            metadata: msg.metadata || {},
          }));
          
          const roomId = data.roomId || data.id;
          
          dispatch(setMessages({
            roomId,
            messages: formattedMessages
          }));
          
          // If we don't have an active room yet, set this one
          if (!activeRoomId) {
            dispatch(setActiveRoom(roomId));
          }
          
          dispatch(setLoadingHistory(false));
        } else {
          console.log("Unexpected message format:", data);
          dispatch(setLoadingHistory(false));
        }
      }
    );
    
    // Handle support history for SUPPORT/CHATBOT chats
    socketInstance.on(
      "supportHistory",
      (data: { sessionId: string; messages: any[] }) => {
        console.log("Support history received:", data);
        if (data.messages && Array.isArray(data.messages)) {
          const formattedMessages = data.messages.map((msg) => ({
            ...msg,
            messageId: msg.id ?? `msg_${Date.now()}`,
            from: msg.senderId ?? msg.from ?? "",
            content: msg.content || msg.message,
            type: msg.messageType ?? msg.type ?? "TEXT",
            messageType: msg.messageType ?? msg.type ?? "TEXT",
            timestamp: msg.timestamp,
            roomId: `${chatType.toLowerCase()}_${data.sessionId}`,
            metadata: msg.metadata || {},
          }));
          
          const roomId = `${chatType.toLowerCase()}_${data.sessionId}`;
          
          dispatch(setMessages({
            roomId,
            messages: formattedMessages
          }));
          
          dispatch(setLoadingHistory(false));
        } else {
          console.log("Unexpected support history format:", data);
          dispatch(setLoadingHistory(false));
        }
      }
    );

    // Updated chatStarted handler to match expected data structure
    socketInstance.on(
      "chatStarted",
      (data: {
        chatId: string;
        withUser: string;
        type: "SUPPORT" | "ORDER" | "CHATBOT";
        dbRoomId: string;
        orderId?: string;
      }) => {
        console.log("Chat started:", data);

        // Update the current chat type
        setChatType(data.type);

        // Create and save chat session with serializable dates
        const session = {
          chatId: data.chatId,
          dbRoomId: data.dbRoomId,
          withUser: data.withUser,
          type: data.type,
          orderId: data.orderId,
          isActive: true,
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
        };

        // Dispatch actions in order - first set the chat session, then mark request as success
        dispatch(setChatSession(session));
        dispatch(saveChatSessionToStorage(session));
        dispatch(supportRequestSuccess());
        
        // Also create a room for this session
        dispatch(addRoom({
          id: data.dbRoomId,
          participants: [data.withUser],
          unreadCount: 0,
          type: data.type,
          orderId: data.orderId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        // Set this room as active
        dispatch(setActiveRoom(data.dbRoomId));
        
        // Update current session
        setCurrentSession({
          chatId: data.chatId,
          dbRoomId: data.dbRoomId,
          withUser: data.withUser,
          type: data.type,
          orderId: data.orderId,
        });
      }
    );
    
    // Handle startSupportChatResponse (for both SUPPORT and CHATBOT types)
    socketInstance.on("startSupportChatResponse", (data: any) => {
      console.log("Support chat response received:", data);
      
      if (data.sessionId) {
        const chatMode = data.type === "CHATBOT" ? "CHATBOT" : "AGENT";
        
        // Store the support session
        dispatch(setSupportSession({
          sessionId: data.sessionId,
          chatMode: chatMode,
          status: "ACTIVE",
          priority: data.priority || "medium",
          category: data.category,
          slaDeadline: data.slaDeadline,
          timestamp: new Date().toISOString(),
        }));
        
        // Update current session
        setCurrentSession({
          type: data.type,
          supportSessionId: data.sessionId,
        });
        
        // Create a room for this session using the server sessionId
        // Note: sessionId might already include the type prefix, so check first
        const roomId = data.sessionId.startsWith(data.type.toLowerCase() + '_') 
          ? data.sessionId 
          : `${data.type.toLowerCase()}_${data.sessionId}`;
        
        // Check if room already exists to avoid duplicates
        const state = store.getState();
        const roomExists = state.chat.rooms.some((room: any) => room.id === roomId);
        
        if (!roomExists) {
          dispatch(addRoom({
            id: roomId,
            participants: [data.type === "CHATBOT" ? "chatbot" : "agent"],
            unreadCount: 0,
            type: data.type,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
        }
        
        dispatch(setActiveRoom(roomId));
        
        // Mark support request as successful
        dispatch(supportRequestSuccess());
        
        // If it's a chatbot, send a welcome message ONLY if the room is empty
        if (data.type === "CHATBOT") {
          const currentMessages = state.chat.messages[roomId] || [];
          if (currentMessages.length === 0) {
            const welcomeMessage: ChatMessage = {
              messageId: `welcome_${Date.now()}`,
              from: "chatbot",
              senderId: "chatbot",
              content: "Hello! I'm your AI assistant. How can I help you today?",
              type: "TEXT",
              messageType: "TEXT",
              timestamp: new Date().toISOString(),
              roomId: roomId,
              metadata: {
                chatbotMessage: {
                  sessionId: data.sessionId,
                  message: "Hello! I'm your AI assistant. How can I help you today?",
                  type: "text",
                  sender: "chatbot",
                  timestamp: new Date().toISOString()
                }
              },
            };
            
            dispatch(addMessage(welcomeMessage));
          }
        }
      }
    });
    
    // Handle supportMessage (incoming messages for SUPPORT/CHATBOT sessions)
    socketInstance.on("supportMessage", (data: any) => {
      console.log("Support message received:", data);
      
      if (data.sessionId && currentSession?.supportSessionId === data.sessionId) {
        // Create a message for the response
        const formattedMessage: ChatMessage = {
          messageId: data.messageId || `msg_${Date.now()}`,
          from: data.from || "agent",
          senderId: data.senderId || data.from || "agent",
          content: data.message || data.content || "",
          type: data.type === "options" ? "OPTIONS" : (data.type || "TEXT"),
          messageType: data.type === "options" ? "OPTIONS" : (data.type || "TEXT"),
          timestamp: data.timestamp || new Date().toISOString(),
          roomId: `${chatType.toLowerCase()}_${data.sessionId}`,
          metadata: {
            chatbotMessage: data.type === "CHATBOT" ? data : undefined,
            agentMessage: data.type !== "CHATBOT" ? data : undefined,
          },
        };
        
        // Add the message
        dispatch(addMessage(formattedMessage));
      }
    });

    // Handle chatbotMessage (specific handler for chatbot responses)
    socketInstance.on("chatbotMessage", (data: any) => {
      console.log("Chatbot message received:", data);
      
      // Get current session from store to avoid stale closure
      const state = store.getState();
      const currentSupportSession = state.chat.supportSession;
      
      console.log("Current support session from store:", currentSupportSession);
      console.log("Session ID match:", data.sessionId === currentSupportSession?.sessionId);
      
      if (data.sessionId && currentSupportSession?.sessionId === data.sessionId) {
        console.log("Processing chatbot message...");
        
        // Make sure the room exists and is active
        const roomId = data.sessionId.startsWith('chatbot_') ? data.sessionId : `chatbot_${data.sessionId}`;
        
        // Create a message for the chatbot response
        const formattedMessage: ChatMessage = {
          messageId: `chatbot_${Date.now()}`,
          from: "chatbot",
          senderId: "chatbot",
          content: data.message || "",
          type: data.type === "options" ? "OPTIONS" : "TEXT",
          messageType: data.type === "options" ? "OPTIONS" : "TEXT",
          timestamp: data.timestamp || new Date().toISOString(),
          roomId: roomId,
          metadata: {
            chatbotMessage: data,
          },
        };
        
        console.log("Formatted chatbot message:", formattedMessage);
        const roomExists = state.chat.rooms.some((room: any) => room.id === roomId);
        
        console.log("Room exists:", roomExists, "Room ID:", roomId);
        
        if (!roomExists) {
          console.log("Creating room for chatbot message:", roomId);
          dispatch(addRoom({
            id: roomId,
            participants: ["chatbot"],
            unreadCount: 0,
            type: "CHATBOT",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
        }
        
        // Set this room as active if we don't have one or if it's the correct session
        const currentActiveRoomId = state.chat.activeRoomId;
        if (!currentActiveRoomId || currentActiveRoomId.includes("fallback")) {
          console.log("Setting active room to:", roomId);
          dispatch(setActiveRoom(roomId));
        }
        
        // Add the message
        console.log("Adding chatbot message to store...");
        dispatch(addMessage(formattedMessage));
        console.log("Chatbot message added successfully");
      } else {
        console.log("Session ID mismatch or missing:", {
          receivedSessionId: data.sessionId,
          currentSessionId: currentSupportSession?.sessionId,
          hasCurrentSession: !!currentSupportSession
        });
      }
    });

    // Handle agentMessage (human agent messages for SUPPORT sessions)
    socketInstance.on("agentMessage", (data: any) => {
      console.log("Agent message received:", data);
      
      // Get current session from store to avoid stale closure
      const state = store.getState();
      const currentSupportSession = state.chat.supportSession;
      
      console.log("Current support session from store:", currentSupportSession);
      console.log("Session ID match:", data.sessionId === currentSupportSession?.sessionId);
      
      if (data.sessionId && currentSupportSession?.sessionId === data.sessionId) {
        console.log("Processing agent message...");
        
        // When we receive an agent message, transition from CHATBOT to SUPPORT mode
        console.log("Transitioning chat type from", chatType, "to SUPPORT");
        
        // Before switching, get the current chatbot messages to preserve them
        const chatbotRoomId = data.sessionId.startsWith('chatbot_') ? data.sessionId : `chatbot_${data.sessionId}`;
        const supportRoomId = data.sessionId.startsWith('support_') ? data.sessionId : `support_${data.sessionId}`;
        const currentChatbotMessages = state.chat.messages[chatbotRoomId] || [];
        
        console.log("Preserving", currentChatbotMessages.length, "messages from chatbot session");
        
        setChatType("SUPPORT");
        
        // Determine message type based on messageType field
        const messageType = data.messageType === "image" ? "IMAGE" : "TEXT";
        
        // Make sure the room exists and is active
        // Note: sessionId already includes "support_" prefix, so don't add it again
        const roomId = data.sessionId.startsWith('support_') ? data.sessionId : `support_${data.sessionId}`;
        
        // Create a message for the agent response
        const formattedMessage: ChatMessage = {
          messageId: `agent_${Date.now()}`,
          from: data.agentId || "agent",
          senderId: data.agentId || "agent",
          content: data.message || "",
          type: messageType,
          messageType: messageType,
          timestamp: data.timestamp || new Date().toISOString(),
          roomId: roomId,
          metadata: {
            agentMessage: data,
          },
        };
        
        console.log("Formatted agent message:", formattedMessage);
        
        const roomExists = state.chat.rooms.some((room: any) => room.id === roomId);
        
        console.log("Room exists:", roomExists, "Room ID:", roomId);
        
        if (!roomExists) {
          console.log("Creating room for agent message:", roomId);
          dispatch(addRoom({
            id: roomId,
            participants: [data.agentId || "agent"],
            unreadCount: 0,
            type: "SUPPORT",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
        }
        
        // Always switch to the support room when agent messages arrive
        console.log("Switching to agent support room:", roomId);
        dispatch(setActiveRoom(roomId));
        
        // If we have previous chatbot messages, copy them to the support room first
        if (currentChatbotMessages.length > 0 && !state.chat.messages[roomId]) {
          console.log("Copying", currentChatbotMessages.length, "messages from chatbot to support room");
          
          // Map messages to the new room ID
          const mappedMessages = currentChatbotMessages.map(msg => ({
            ...msg,
            roomId: roomId
          }));
          
          dispatch(setMessages({
            roomId: roomId,
            messages: mappedMessages
          }));
        }
        
        // Add the agent message
        console.log("Adding agent message to store...");
        dispatch(addMessage(formattedMessage));
        console.log("Agent message added successfully");
      } else {
        console.log("Session ID mismatch or missing:", {
          receivedSessionId: data.sessionId,
          currentSessionId: currentSupportSession?.sessionId,
          hasCurrentSession: !!currentSupportSession
        });
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [accessToken, dispatch]);

  // Request customer care chat (SUPPORT type)
  const requestCustomerCare = useCallback(() => {
    if (!socket) {
      console.log("Socket is not initialized");
      dispatch(supportRequestError("Connection not available"));
      return;
    }

    console.log("Starting support chat...");
    setChatType("SUPPORT");
    dispatch(startSupportRequest());
    
    // Emit startSupportChat and wait for startSupportChatResponse
    socket.emit("startSupportChat", { type: "SUPPORT" });
  }, [socket, dispatch]);
  
  // Start a chatbot session (CHATBOT type)
  const startChatbotSession = useCallback(() => {
    if (!socket) {
      console.log("Socket is not initialized");
      dispatch(supportRequestError("Connection not available"));
      return;
    }
    
    console.log("Starting chatbot session...");
    setChatType("CHATBOT");
    dispatch(startSupportRequest());
    
    // Emit startSupportChat with CHATBOT type and wait for startSupportChatResponse
    socket.emit("startSupportChat", { type: "CHATBOT" });
  }, [socket, dispatch]);

  // Generic method to start any type of chat
  const startChat = useCallback((
    withUserId: string,
    type: "SUPPORT" | "ORDER" | "CHATBOT",
    orderId?: string
  ) => {
    if (!socket) {
      console.log("Socket is not initialized");
      dispatch(supportRequestError("Connection not available"));
      return;
    }

    console.log("Starting chat:", { withUserId, type, orderId });
    setChatType(type);
    
    if (type === "CHATBOT") {
      // For chatbot, use the startSupportChat flow
      dispatch(startSupportRequest());
      socket.emit("startSupportChat", { type: "CHATBOT" });
    } else if (type === "SUPPORT") {
      // For support, use the startSupportChat flow
      dispatch(startSupportRequest());
      socket.emit("startSupportChat", { type: "SUPPORT" });
    } else if (type === "ORDER") {
      // For order chats, use the ORDER flow (startChat -> chatStarted -> sendMessage)
      if (!orderId) {
        console.log("Order ID is required for ORDER type chats");
        dispatch(supportRequestError("Order ID is required"));
        return;
      }
      dispatch(startSupportRequest());
      socket.emit("startChat", { withUserId, type, orderId });
    }
  }, [socket, dispatch]);

  const sendMessage = useCallback((
    content: string,
    type: "TEXT" | "IMAGE" | "VIDEO" | "ORDER_INFO" | "OPTIONS" = "TEXT"
  ) => {
    console.log("sendMessage called with:", { content, type, chatType, currentSession, roomId });
    
    if (!socket) {
      console.log("Socket is not initialized");
      return;
    }
    
    // For SUPPORT and CHATBOT types, use sendSupportMessage
    if ((chatType === "SUPPORT" || chatType === "CHATBOT") && currentSession?.supportSessionId) {
      console.log("Sending support message:", content, "sessionId:", currentSession.supportSessionId);
      
             // Determine the correct roomId based on current chat type and session
       const messageRoomId = chatType === "SUPPORT" 
         ? (currentSession.supportSessionId.startsWith('support_') 
            ? currentSession.supportSessionId 
            : `support_${currentSession.supportSessionId}`)
         : (currentSession.supportSessionId.startsWith('chatbot_') 
            ? currentSession.supportSessionId 
            : `chatbot_${currentSession.supportSessionId}`);
      
      // Create a local message to show immediately
      const userMessage: ChatMessage = {
        messageId: `user_${Date.now()}`,
        from: userId || "user",
        senderId: userId || "user",
        content: content,
        type: type,
        messageType: type,
        timestamp: new Date().toISOString(),
        roomId: messageRoomId,
        metadata: {},
      };
      
      // Add the user message immediately to show in UI
      dispatch(addMessage(userMessage));
      
      // Emit sendSupportMessage for both SUPPORT and CHATBOT
      socket.emit("sendSupportMessage", {
        sessionId: currentSession.supportSessionId,
        message: content,
        type,
      });
      
      return;
    }
    
    // For ORDER type, use sendMessage with roomId
    if (chatType === "ORDER" && roomId) {
      console.log("Sending order message to room:", roomId, content, type);
      
      // Create a local message to show immediately in UI
      const userMessage: ChatMessage = {
        messageId: `user_${Date.now()}`,
        from: userId || "user",
        senderId: userId || "user",
        content: content,
        type: type,
        messageType: type,
        timestamp: new Date().toISOString(),
        roomId: roomId,
        metadata: {},
      };
      
      // Add the user message immediately to show in UI
      dispatch(addMessage(userMessage));
      
      // Add message to tracking set to avoid duplicates from server echo
      sentMessagesRef.current.add(content);
      
      socket.emit("sendMessage", {
        roomId,
        content,
        type,
      });
      
      return;
    }
    
    console.log("Cannot send message - missing session or room data");
  }, [socket, roomId, chatType, currentSession, userId, dispatch]);

  const getChatHistory = useCallback(() => {
    if (!socket) {
      console.log("Socket is not initialized for getting chat history");
      return;
    }
    
    if (chatType === "ORDER" && roomId) {
      // For ORDER chats, use getChatHistory with roomId
      dispatch(setLoadingHistory(true));
      socket.emit("getChatHistory", { roomId });
    } else if ((chatType === "SUPPORT" || chatType === "CHATBOT") && currentSession?.supportSessionId) {
      // For SUPPORT/CHATBOT chats, use getSupportHistory with sessionId
      dispatch(setLoadingHistory(true));
      socket.emit("getSupportHistory", { sessionId: currentSession.supportSessionId });
    } else {
      console.log("No roomId or supportSessionId available for getting chat history");
    }
  }, [socket, roomId, currentSession, chatType, dispatch]);

  // Auto-load chat history when roomId changes
  useEffect(() => {
    // Removed auto-loading to prevent spam
    // Components should manually call getChatHistory when needed
  }, []);

  // Handle option selection for chatbot
  const selectOption = useCallback((value: string) => {
    if (!socket || !currentSession?.supportSessionId) {
      console.log("Socket or session not available for selecting option");
      return;
    }
    
    // Determine the correct roomId based on current chat type and session
    const optionRoomId = chatType === "SUPPORT" 
      ? (currentSession.supportSessionId.startsWith('support_') 
         ? currentSession.supportSessionId 
         : `support_${currentSession.supportSessionId}`)
      : (currentSession.supportSessionId.startsWith('chatbot_') 
         ? currentSession.supportSessionId 
         : `chatbot_${currentSession.supportSessionId}`);
    
    // Create a local message to show the user's selection immediately
    const userMessage: ChatMessage = {
      messageId: `option_${Date.now()}`,
      from: userId || "user",
      senderId: userId || "user",
      content: value,
      type: "TEXT",
      messageType: "TEXT",
      timestamp: new Date().toISOString(),
      roomId: optionRoomId,
      metadata: {},
    };
    
    dispatch(addMessage(userMessage));
    
    socket.emit("sendSupportMessage", {
      sessionId: currentSession.supportSessionId,
      message: value,
      type: "TEXT",
      isOptionSelection: true,
    });
  }, [socket, currentSession, chatType, userId, dispatch]);

  return {
    socket,
    messages: activeMessages,
    roomId,
    currentSession,
    isRequestingSupport,
    requestError,
    isConnected,
    isLoading,
    requestCustomerCare,
    startChatbotSession,
    startChat,
    sendMessage,
    getChatHistory,
    chatType,
    selectOption,
  };
};
