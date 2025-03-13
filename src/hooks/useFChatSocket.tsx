import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import { BACKEND_URL } from "../utils/constants";

interface ChatMessage {
  messageId: string;
  id?: string;
  senderId?: string;
  from: string;
  content: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "ORDER_INFO";
  messageType?: "TEXT" | "IMAGE" | "VIDEO" | "ORDER_INFO";
  timestamp: Date;
  roomId: string;
}

export const useFChatSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roomId, setRoomId] = useState<string | null>(
    "03cb9eff-cf97-412f-92a4-2097176447ab"
  );
  const { accessToken } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!accessToken) {
      console.log("No access token available");
      return;
    }

    // Initialize socket connection specifically for chat
    const socketInstance = io(`${BACKEND_URL}/chat`, {
      transports: ["websocket"],
      extraHeaders: {
        auth: `Bearer ${accessToken}`,
      },
    });

    socketInstance.on("connect", () => {
      console.log("Connected to chat server");
      setSocket(socketInstance);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Disconnected from chat server:", reason);
      setSocket(null); // Reset socket on disconnect
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setSocket(null); // Reset socket on error
    });

    socketInstance.on("newMessage", (message: ChatMessage) => {
      console.log("New message received:", message);
      setMessages((prev) => [...prev, message]);
    });
    socketInstance.on(
      "chatHistory",
      (data: { chatId: string; messages: ChatMessage[]; id: string }) => {
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(
            data.messages.map((msg) => ({
              ...msg,
              messageId: msg.id ?? "",
              from: msg.senderId ?? "",
              content: msg.content,
              type: msg.messageType ?? "TEXT",
              timestamp: msg.timestamp,
              roomId: msg.roomId,
            }))
          );
        } else {
          console.log("Unexpected message format:", data);
        }
      }
    );

    socketInstance.on("chatStarted", (data: { chatId: string }) => {
      console.log("Chat started:", data);
      setRoomId(data.chatId);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [accessToken]);

  const startChat = (
    withUserId: string,
    type: "SUPPORT" | "ORDER",
    orderId?: string
  ) => {
    if (!socket) {
      console.log("Socket is not initialized");
      return;
    }
    socket.emit("startChat", { withUserId, type, orderId });
  };

  const sendMessage = (
    content: string,
    type: "TEXT" | "IMAGE" | "VIDEO" | "ORDER_INFO" = "TEXT"
  ) => {
    if (!socket || !roomId) {
      console.log("Socket or roomId is not available");
      return;
    }
    console.log("sending message", roomId, content, type);
    socket.emit("sendMessage", {
      roomId,
      content,
      type,
    });
  };

  useEffect(() => {
    if (socket) {
      getChatHistory();
    }
  }, [socket]);
  const getChatHistory = () => {
    // console.log("check socket", socket, "roomId", roomId);
    if (!socket || !roomId) {
      console.log("Socket or roomId is not available for getting chat history");
      return;
    }
    socket.emit("getChatHistory", { roomId });
    // console.log("check chatHistory", chatHistory);
  };

  return {
    socket,
    messages,
    roomId,
    startChat,
    sendMessage,
    getChatHistory,
  };
};
