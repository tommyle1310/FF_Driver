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
  sendPushNotification: (order: Order) => void,
  setLatestOrder: React.Dispatch<React.SetStateAction<Order | null>>
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
      console.log("check oreder", order);
      setOrders((prevOrders) => [...prevOrders, order]);
      setLatestOrder(order);
      sendPushNotification(order);
    });

    // Log socket connection status
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    socket.on("acceptOrder", (response) => {
      if (response.success) {
        console.log("Order accepted successfully", response.order);
        setLatestOrder(response.order);
      } else {
        console.error("Failed to accept order:", response.message);
        setLatestOrder(null);
      }
    });

    // Clean up the socket connection on unmount
    return () => {
      socket.off("incomingOrderForDriver");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("acceptOrder");
    };
  }, [driverId, setOrders, sendPushNotification, setLatestOrder]);
};
