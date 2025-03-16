import { useEffect } from "react";
import socket from "@/src/services/socket";
import { Type_PushNotification_Order } from "../types/pushNotification";

interface SocketOrderResponse {
  data: Type_PushNotification_Order;
  event: string;
  message: string;
}

export const useSocket = (
  driverId: string,
  setOrders: React.Dispatch<
    React.SetStateAction<Type_PushNotification_Order[]>
  >,
  sendPushNotification: (order: Type_PushNotification_Order) => void,
  setLatestOrder: React.Dispatch<
    React.SetStateAction<Type_PushNotification_Order | null>
  >
) => {
  useEffect(() => {
    if (!driverId) {
      console.log("Please provide a driver ID");
      return;
    }

    socket.emit("joinRoomDriver", driverId);

    socket.on("incomingOrderForDriver", (response: SocketOrderResponse) => {
      const order = response.data; // Trích xuất order từ data
      console.log("check order", order);
      setOrders((prevOrders) => [...prevOrders, order]);
      setLatestOrder(order);
      sendPushNotification(order);
    });

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    socket.on("driverAcceptOrder", (response) => {
      if (response.success) {
        console.log("Order accepted successfully", response.order);
        setLatestOrder(response.order); // Giả sử server trả về order trực tiếp
      } else {
        console.error("Failed to accept order:", response.message);
        setLatestOrder(null);
      }
    });

    return () => {
      socket.off("incomingOrderForDriver");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("driverAcceptOrder"); // Sửa tên sự kiện cho đúng
    };
  }, [driverId, setOrders, sendPushNotification, setLatestOrder]);
};
