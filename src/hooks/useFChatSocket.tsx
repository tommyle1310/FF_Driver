import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector, useDispatch } from "@/src/store/types";
import { RootState, store } from "@/src/store/store";
import { CHAT_SOCKET_URL } from "@/src/utils/constants";
import {
  setConnectionState,
  startSupportRequest,
  supportRequestSuccess,
  supportRequestError,
  setChatSession,
  addMessage,
  setMessages,
  setLoadingHistory,
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

export interface ChatbotMessage {
  sessionId: string;
  message: string;
  type: 'text' | 'options' | 'quickReplies' | 'cards' | 'form' | 'image';
  options?: ChatbotOption[];
  quickReplies?: ChatbotOption[];
  cards?: any[];
  formFields?: any[];
  followUpPrompt?: string;
  timestamp: string;
  sender: string;
  confidence?: number;
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

export const useFChatSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatType, setChatType] = useState<"SUPPORT" | "ORDER" | "CHATBOT">("SUPPORT");
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const dispatch = useDispatch();

  const { accessToken, id } = useSelector((state: RootState) => state.auth);
  const {
    messages,
    activeRoomId,
    isRequestingSupport,
    requestError,
    isConnected,
    currentSession: reduxCurrentSession,
    supportSession,
  } = useSelector((state: RootState) => state.chat);

  // Initialize socket connection
  useEffect(() => {
    if (!accessToken) {
      console.log("No access token available");
      return;
    }

    console.log("Initializing socket connection with URL:", CHAT_SOCKET_URL);
    
    const socketInstance = io(`${CHAT_SOCKET_URL}/chat`, {
      transports: ["websocket"],
      auth: {
        token: accessToken,
      },
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      autoConnect: false,
      query: {
        driverId: id
      }
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
      dispatch(setConnectionState(true));
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Disconnected from chat server:", reason);
      dispatch(setConnectionState(false));
      
      // Attempt to reconnect if not intentionally closed
      if (reason !== "io client disconnect") {
        console.log("Attempting to reconnect...");
        setTimeout(() => {
          if (socketInstance && !socketInstance.connected) {
            socketInstance.connect();
          }
        }, 1000);
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Connection error:", error);
      dispatch(setConnectionState(false));
      dispatch(supportRequestError("Connection failed. Please try again."));
    });

    // Handle new messages
    socketInstance.on("newMessage", (message: any) => {
      console.log("New message received:", message);
      
      const formattedMessage: ChatMessage = {
        messageId: message.id || `msg_${Date.now()}`,
        from: message.senderId || message.from || "",
        senderId: message.senderId || message.from || "",
        content: message.content || message.message || "",
        type: message.messageType || message.type || "TEXT",
        messageType: message.messageType || message.type || "TEXT",
        timestamp: message.timestamp || new Date().toISOString(),
        roomId: message.roomId || currentSession?.dbRoomId,
        metadata: message.metadata || {},
      };
      
      // If we have a roomId in the message or from current session
      const roomId = formattedMessage.roomId || currentSession?.dbRoomId;
      if (roomId) {
        // Check if this room exists in our store
        const state = store.getState();
        const roomExists = state.chat.rooms.some((room: any) => room.id === roomId);
        
        if (!roomExists) {
          console.log("Creating new room for message:", roomId);
          
          dispatch(addRoom({
            id: roomId,
            participants: [formattedMessage.senderId || formattedMessage.from || "unknown"],
            unreadCount: 1,
            type: currentSession?.type || "SUPPORT",
            orderId: currentSession?.orderId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
          
          if (!activeRoomId) {
            console.log("Setting active room to:", roomId);
            dispatch(setActiveRoom(roomId));
          }
        }
        
        formattedMessage.roomId = roomId;
        dispatch(addMessage(formattedMessage));
      }
    });

    // Handle chat history for ORDER chats
    socketInstance.on(
      "chatHistory",
      (data: { chatId: string; messages: any[]; id: string; roomId: string }) => {
        console.log("Chat history received:", data);
        if (data.messages && Array.isArray(data.messages)) {
          const roomId = data.roomId || data.id;
          
          const formattedMessages = data.messages.map((msg) => ({
            ...msg,
            messageId: msg.id ?? `msg_${Date.now()}`,
            from: msg.senderId ?? msg.from ?? "",
            content: msg.content || msg.message || "",
            type: msg.messageType ?? msg.type ?? "TEXT",
            messageType: msg.messageType ?? msg.type ?? "TEXT",
            timestamp: msg.timestamp || new Date().toISOString(),
            roomId: roomId,
            metadata: msg.metadata || {},
          }));
          
          dispatch(setMessages({
            roomId,
            messages: formattedMessages
          }));
          
          if (!activeRoomId) {
            dispatch(setActiveRoom(roomId));
          }
          
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
          const roomId = `${chatType.toLowerCase()}_${data.sessionId}`;
          
          const formattedMessages = data.messages.map((msg) => ({
            ...msg,
            messageId: msg.id ?? `msg_${Date.now()}`,
            from: msg.senderId ?? msg.from ?? "",
            content: msg.content || msg.message || "",
            type: msg.messageType ?? msg.type ?? "TEXT",
            messageType: msg.messageType ?? msg.type ?? "TEXT",
            timestamp: msg.timestamp || new Date().toISOString(),
            roomId: roomId,
            metadata: msg.metadata || {},
          }));
          
          dispatch(setMessages({
            roomId,
            messages: formattedMessages
          }));
          
          if (!activeRoomId) {
            dispatch(setActiveRoom(roomId));
          }
          
          dispatch(setLoadingHistory(false));
        }
      }
    );

    // Handle chatStarted event for ORDER chats
    socketInstance.on(
      "chatStarted",
      (data: {
        chatId: string;
        withUser: string;
        type: "SUPPORT" | "ORDER" | "CHATBOT";
        dbRoomId: string;
        orderId?: string;
        sessionId?: string;
      }) => {
        console.log("Chat started:", data);

        setChatType(data.type);

        // Generate roomId based on chat type
        let roomId = data.dbRoomId;
        if (data.type === "SUPPORT" && data.sessionId) {
          roomId = `support_${data.sessionId}`;
        } else if (data.type === "CHATBOT" && data.sessionId) {
          roomId = `chatbot_${data.sessionId}`;
        }

        const session: ChatSession = {
          chatId: data.chatId,
          dbRoomId: roomId,
          withUser: data.withUser,
          type: data.type,
          orderId: data.orderId,
          sessionId: data.sessionId,
          isActive: true,
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
        };

        setCurrentSession(session);
        dispatch(setChatSession(session));
        dispatch(supportRequestSuccess());
        
        // Create room if it doesn't exist
        dispatch(addRoom({
          id: roomId,
          participants: [data.withUser],
          unreadCount: 0,
          type: data.type,
          orderId: data.orderId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        // Set as active room
        dispatch(setActiveRoom(roomId));

        // Request chat history based on type
        if (data.type === "ORDER") {
          socketInstance.emit("getChatHistory", { roomId: data.dbRoomId });
        } else {
          socketInstance.emit("getSupportHistory", { sessionId: data.sessionId });
        }
      }
    );

    // Handle supportStarted event
    socketInstance.on("supportStarted", (data: any) => {
      console.log("Support started:", data);
      
      const chatMode = data.type === "CHATBOT" ? "CHATBOT" : "AGENT";
      
      dispatch(setSupportSession({
        sessionId: data.sessionId,
        chatMode: chatMode,
        status: "ACTIVE",
        priority: data.priority || "medium",
        category: data.category,
        slaDeadline: data.slaDeadline,
        timestamp: new Date().toISOString(),
      }));
      
      const roomId = data.sessionId.startsWith(data.type.toLowerCase() + '_') 
        ? data.sessionId 
        : `${data.type.toLowerCase()}_${data.sessionId}`;
      
      const session: ChatSession = {
        chatId: data.sessionId, // Using sessionId as chatId for support chats
        dbRoomId: roomId,
        withUser: data.type === "CHATBOT" ? "chatbot" : "agent",
        type: data.type,
        sessionId: data.sessionId,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
      };
      
      setCurrentSession(session);
      dispatch(setChatSession(session));
      
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
      dispatch(supportRequestSuccess());
      
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
    });

    // Handle supportChatStarted event (alternative to supportStarted)
    socketInstance.on("supportChatStarted", (data: any) => {
      console.log("Support chat started:", data);
      
      if (data.sessionId) {
        const chatMode = data.chatMode === "bot" ? "CHATBOT" : "AGENT";
        const chatType = data.chatMode === "bot" ? "CHATBOT" : "SUPPORT";
        
        // Store the support session
        dispatch(setSupportSession({
          sessionId: data.sessionId,
          chatMode: chatMode,
          status: data.status || "ACTIVE",
          priority: data.priority || "medium",
          category: data.category,
          slaDeadline: data.slaDeadline,
          timestamp: new Date().toISOString(),
        }));
        
        // Create a room for this session using the server sessionId
        const roomId = data.sessionId.startsWith(chatType.toLowerCase() + '_') 
          ? data.sessionId 
          : `${chatType.toLowerCase()}_${data.sessionId}`;
        
        const session: ChatSession = {
          chatId: data.sessionId,
          dbRoomId: roomId,
          withUser: chatType === "CHATBOT" ? "chatbot" : "agent",
          type: chatType,
          sessionId: data.sessionId,
          isActive: true,
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
        };
        
        setCurrentSession(session);
        dispatch(setChatSession(session));
        
        // Check if room already exists to avoid duplicates
        const state = store.getState();
        const roomExists = state.chat.rooms.some((room: any) => room.id === roomId);
        
        if (!roomExists) {
          dispatch(addRoom({
            id: roomId,
            participants: [chatType === "CHATBOT" ? "chatbot" : "agent"],
            unreadCount: 0,
            type: chatType,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
        }
        
        dispatch(setActiveRoom(roomId));
        dispatch(supportRequestSuccess());
        
        // If it's a chatbot, send a welcome message ONLY if the room is empty
        if (chatType === "CHATBOT") {
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

    // Handle startSupportChatResponse (for both SUPPORT and CHATBOT types)
    socketInstance.on("startSupportChatResponse", (data: any) => {
      console.log("Support chat response received:", data);
      
      if (data.sessionId) {
        const chatMode = data.chatMode === "bot" ? "CHATBOT" : "AGENT";
        const chatType = data.chatMode === "bot" ? "CHATBOT" : "SUPPORT";
        
        // Store the support session
        dispatch(setSupportSession({
          sessionId: data.sessionId,
          chatMode: chatMode,
          status: data.status || "ACTIVE",
          priority: data.priority || "medium",
          category: data.category,
          slaDeadline: data.slaDeadline,
          timestamp: new Date().toISOString(),
        }));
        
        // Create a room for this session using the server sessionId
        // Note: sessionId might already include the type prefix, so check first
        const roomId = data.sessionId.startsWith(chatType.toLowerCase() + '_') 
          ? data.sessionId 
          : `${chatType.toLowerCase()}_${data.sessionId}`;
        
        const session: ChatSession = {
          chatId: data.sessionId, // Using sessionId as chatId for support chats
          dbRoomId: roomId,
          withUser: chatType === "CHATBOT" ? "chatbot" : "agent",
          type: chatType,
          sessionId: data.sessionId,
          isActive: true,
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
        };
        
        setCurrentSession(session);
        dispatch(setChatSession(session));
        
        // Check if room already exists to avoid duplicates
        const state = store.getState();
        const roomExists = state.chat.rooms.some((room: any) => room.id === roomId);
        
        if (!roomExists) {
          dispatch(addRoom({
            id: roomId,
            participants: [chatType === "CHATBOT" ? "chatbot" : "agent"],
            unreadCount: 0,
            type: chatType,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
        }
        
        dispatch(setActiveRoom(roomId));
        
        // Mark support request as successful
        dispatch(supportRequestSuccess());
        
        // If it's a chatbot, send a welcome message ONLY if the room is empty
        if (chatType === "CHATBOT") {
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
    
    // Handle sendSupportMessage for SUPPORT/CHATBOT chats
    socketInstance.on("sendSupportMessage", (data: any) => {
      console.log("Support message received:", data);
      
      if (data.sessionId && currentSession?.sessionId === data.sessionId) {
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
        
        dispatch(addMessage(formattedMessage));
      }
    });

    // Handle chatbotMessage for CHATBOT chats
    socketInstance.on("chatbotMessage", (data: any) => {
      console.log("Chatbot message received:", data);
      
      const state = store.getState();
      const currentSupportSession = state.chat.supportSession;
      
      if (data.sessionId && currentSupportSession?.sessionId === data.sessionId) {
        const roomId = data.sessionId.startsWith('chatbot_') 
          ? data.sessionId 
          : `chatbot_${data.sessionId}`;
        
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
        
        dispatch(addMessage(formattedMessage));
      }
    });

    // Handle agentMessage for SUPPORT chats
    socketInstance.on("agentMessage", (data: any) => {
      console.log("Agent message received:", data);
      
      const state = store.getState();
      const currentSupportSession = state.chat.supportSession;
      
      console.log("Current support session:", currentSupportSession);
      console.log("Session ID match:", data.sessionId === currentSupportSession?.sessionId);
      
      if (data.sessionId && currentSupportSession?.sessionId === data.sessionId) {
        const roomId = data.sessionId.startsWith('support_') 
          ? data.sessionId 
          : `support_${data.sessionId}`;
        
        console.log("Agent message roomId:", roomId);
        console.log("Current activeRoomId:", state.chat.activeRoomId);
        
        const formattedMessage: ChatMessage = {
          messageId: `agent_${Date.now()}`,
          from: data.agentId || "agent",
          senderId: data.agentId || "agent",
          content: data.message || data.content || "",
          type: data.messageType === "image" ? "IMAGE" : "TEXT",
          messageType: data.messageType === "image" ? "IMAGE" : "TEXT",
          timestamp: data.timestamp || new Date().toISOString(),
          roomId: roomId,
          metadata: {
            agentMessage: data,
          },
        };
        
        // Make sure the room exists
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
        
        // Set this room as active if we don't have one or if it's the correct session
        const currentActiveRoomId = state.chat.activeRoomId;
        if (!currentActiveRoomId || currentActiveRoomId !== roomId) {
          console.log("Setting active room to:", roomId);
          dispatch(setActiveRoom(roomId));
        }
        
        console.log("Adding agent message:", formattedMessage);
        dispatch(addMessage(formattedMessage));
      } else {
        console.log("Agent message session ID mismatch or missing:", {
          receivedSessionId: data.sessionId,
          currentSessionId: currentSupportSession?.sessionId,
          hasCurrentSession: !!currentSupportSession
        });
      }
    });

    // Connect the socket
    setTimeout(() => {
      if (!socketInstance.connected) {
        console.log("Initiating socket connection with auth token");
        socketInstance.connect();
      }
    }, 100);

    setSocket(socketInstance);
    socketRef.current = socketInstance;

    return () => {
      console.log("Cleaning up socket connection");
      socketInstance.off("connect");
      socketInstance.off("disconnect");
      socketInstance.off("connect_error");
      socketInstance.off("newMessage");
      socketInstance.off("chatHistory");
      socketInstance.off("supportHistory");
      socketInstance.off("chatStarted");
      socketInstance.off("supportStarted");
      socketInstance.off("supportChatStarted");
      socketInstance.off("startSupportChatResponse");
      socketInstance.off("sendSupportMessage");
      socketInstance.off("chatbotMessage");
      socketInstance.off("agentMessage");
      
      if (socketInstance.connected) {
        socketInstance.disconnect();
      }
      setSocket(null);
      socketRef.current = null;
    };
  }, [accessToken, dispatch]);

  // Request customer care chat (SUPPORT type)
  const requestCustomerCare = useCallback(() => {
    if (!socketRef.current) {
      console.log("Socket is not initialized");
      dispatch(supportRequestError("Connection not available"));
      return;
    }

    console.log("Starting support chat...");
    setChatType("SUPPORT");
    dispatch(startSupportRequest());
    
    socketRef.current.emit("startSupportChat", { type: "SUPPORT" });
  }, [dispatch]);
  
  // Start a chatbot session (CHATBOT type)
  const startChatbotSession = useCallback(() => {
    if (!socketRef.current) {
      console.log("Socket is not initialized");
      dispatch(supportRequestError("Connection not available"));
      return;
    }
    
    console.log("Starting chatbot session...");
    setChatType("CHATBOT");
    dispatch(startSupportRequest());
    
    socketRef.current.emit("startSupportChat", { type: "CHATBOT" });
  }, [dispatch]);

  // Generic method to start any type of chat
  const startChat = useCallback((
    withUserId: string,
    type: "SUPPORT" | "ORDER" | "CHATBOT",
    orderId?: string
  ) => {
    if (!socketRef.current) {
      console.log("Socket is not initialized");
      dispatch(supportRequestError("Connection not available"));
      return;
    }

    if (!socketRef.current.connected) {
      console.log("Socket is not connected, attempting to connect...");
      socketRef.current.connect();
      
      // Wait for connection before sending startChat
      socketRef.current.once("connect", () => {
        console.log("Socket connected, now starting chat");
        emitStartChat();
      });
      return;
    }

    emitStartChat();

    function emitStartChat() {
      console.log("Starting chat:", { withUserId, type, orderId });
      setChatType(type);
      
      if (type === "CHATBOT") {
        dispatch(startSupportRequest());
        socketRef.current?.emit("startSupportChat", { type: "CHATBOT" });
      } else if (type === "SUPPORT") {
        dispatch(startSupportRequest());
        socketRef.current?.emit("startSupportChat", { type: "SUPPORT" });
      } else if (type === "ORDER") {
        if (!orderId) {
          console.log("Order ID is required for ORDER type chats");
          dispatch(supportRequestError("Order ID is required"));
          return;
        }
        dispatch(startSupportRequest());
        console.log('Emitting startChat with payload:', { withUserId, type, orderId });
        socketRef.current?.emit("startChat", { withUserId, type, orderId });
      }
    }
  }, [dispatch]);

  // Send a message
  const sendMessage = useCallback((
    content: string,
    type: "TEXT" | "IMAGE" | "VIDEO" | "ORDER_INFO" | "OPTIONS" = "TEXT"
  ) => {
    if (!socketRef.current || !currentSession) {
      console.log("Socket or session not initialized");
      return;
    }

    const socket = socketRef.current;
    const session = currentSession;

    // Check connection status
    if (!socket.connected) {
      console.log("Socket disconnected, attempting to reconnect before sending");
      socket.connect();
      
      socket.once("connect", () => {
        emitMessage();
      });
      return;
    }

    emitMessage();

    function emitMessage() {
      const messageData = {
        content,
        type,
        timestamp: new Date().toISOString(),
      };

      if (chatType === "ORDER") {
        if (!session.dbRoomId) {
          console.log("No room ID available for ORDER chat");
          return;
        }
        
        console.log("Sending ORDER message:", {
          ...messageData,
          roomId: session.dbRoomId,
        });
        
        socket.emit("sendMessage", {
          ...messageData,
          roomId: session.dbRoomId,
        });
      } else {
        if (!session.sessionId) {
          console.log("No session ID available for SUPPORT/CHATBOT chat");
          return;
        }
        
        console.log("Sending SUPPORT/CHATBOT message:", {
          ...messageData,
          sessionId: session.sessionId,
        });
        
        socket.emit("sendSupportMessage", {
          ...messageData,
          content: undefined,
          messageType: type.toLowerCase(),
          message: content,
          sessionId: session.sessionId,
        });
        
        // Add the message to local state immediately for instant feedback
        const roomId = session.dbRoomId;
        if (roomId) {
          const userMessage: ChatMessage = {
            messageId: `user_${Date.now()}`,
            from: id || "",
            senderId: id || "",
            content: content,
            type: type,
            messageType: type,
            timestamp: new Date().toISOString(),
            roomId: roomId,
            metadata: {},
          };
          
          dispatch(addMessage(userMessage));
        }
      }
    }
  }, [socketRef, currentSession, chatType]);

  // Select an option (for chatbot)
  const selectOption = useCallback((value: string) => {
    if (!socketRef.current || !currentSession?.sessionId) {
      console.log("Socket or session not initialized");
      return;
    }

    socketRef.current.emit("sendSupportMessage", {
      messageType: "text",
      sessionId: currentSession.sessionId,
      message: value,
    });
    
    // Add the selected option to local state immediately for instant feedback
    const roomId = currentSession.dbRoomId;
    if (roomId) {
      const userMessage: ChatMessage = {
        messageId: `user_option_${Date.now()}`,
        from: id || "",
        senderId: id || "",
        content: value,
        type: "TEXT",
        messageType: "TEXT",
        timestamp: new Date().toISOString(),
        roomId: roomId,
        metadata: {},
      };
      
      dispatch(addMessage(userMessage));
    }
  }, [socketRef, currentSession]);

  // Get chat history
  const getChatHistory = useCallback(() => {
    if (!socketRef.current || !currentSession) {
      console.log("Socket or session not initialized");
      return;
    }

    dispatch(setLoadingHistory(true));

    if (chatType === "ORDER") {
      if (!currentSession.dbRoomId) {
        console.log("No room ID available for ORDER chat");
        return;
      }
      console.log('cehck room id', currentSession.dbRoomId)
      
      socketRef.current.emit("getChatHistory", {
        roomId: currentSession.dbRoomId,
      });
    } else {
      if (!currentSession.sessionId) {
        console.log("No session ID available for SUPPORT/CHATBOT chat");
        return;
      }
      
      socketRef.current.emit("getSupportHistory", {
        sessionId: currentSession.sessionId,
      });
    }
  }, [socketRef, currentSession, chatType, dispatch]);

  return {
    socket: socketRef.current,
    messages: activeRoomId ? messages[activeRoomId] || [] : [],
    roomId: activeRoomId,
    currentSession,
    isRequestingSupport,
    requestError,
    isConnected,
    chatType,
    requestCustomerCare,
    startChatbotSession,
    startChat,
    sendMessage,
    getChatHistory,
    selectOption,
  };
};
