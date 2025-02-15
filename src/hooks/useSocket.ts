// src/hooks/useSocket.ts
import { useEffect } from "react";
import socket from "@/src/services/socket";

interface Order {
  _id: string;
  customer_id: string;
  total_amount: number;
  status: string;
}

export const useSocket = (
  driverId: string,
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>,
  sendPushNotification: (order: Order) => void
) => {
  useEffect(() => {
    if (!driverId) {
      console.log("Please provide a driver ID");
      return;
    }
    // Function to join the restaurant's room
    socket.emit("joinRoomDriver", driverId);

    // Listen for incoming orders
    socket.on("incomingOrderForDriver", (order: Order) => {
      setOrders((prevOrders) => [...prevOrders, order]);
      sendPushNotification(order);
    });

    // Log socket connection status
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    // Clean up the socket connection on unmount
    return () => {
      socket.off("incomingOrder");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [driverId, setOrders, sendPushNotification]);
};
