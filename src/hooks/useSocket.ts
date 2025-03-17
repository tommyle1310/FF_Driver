// useSocket.ts
import { useEffect } from "react";
import { Type_PushNotification_Order } from "../types/pushNotification";
import { io } from "socket.io-client";
import { BACKEND_URL } from "../utils/constants";
import { useSelector } from "../store/types";
import { RootState } from "../store/store";

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
  >,
  setIsShowToast?: React.Dispatch<React.SetStateAction<boolean>> // Thêm setter cho toast
) => {
  const { accessToken } = useSelector((state: RootState) => state.auth);

  const socket = io(`${BACKEND_URL}/driver`, {
    transports: ["websocket"],
    extraHeaders: {
      auth: `Bearer ${accessToken}`,
    },
  });

  useEffect(() => {
    if (!driverId) {
      console.log("Please provide a driver ID");
      return;
    }

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("notifyOrderStatus", (response) => {
      const buildDataToPushNotificationType: Type_PushNotification_Order = {
        id: response?.orderId,
        customer_id: response?.customer_id,
        total_amount:
          response?.total_amount ?? response?.orderDetails?.total_amount,
        status: response?.status,
        order_items:
          response?.order_items ?? response?.orderDetails?.order_items,
      };
      console.log(
        "Received notifyOrderStatus:",
        buildDataToPushNotificationType
      );
      setLatestOrder(buildDataToPushNotificationType); // Set latestOrder để trigger toast
      setOrders((prevOrders) => {
        const updatedOrders = prevOrders.map((order) =>
          order.id === buildDataToPushNotificationType.id
            ? buildDataToPushNotificationType
            : order
        );
        if (
          !updatedOrders.some(
            (order) => order.id === buildDataToPushNotificationType.id
          )
        ) {
          updatedOrders.push(buildDataToPushNotificationType);
        }
        return updatedOrders;
      });
      if (setIsShowToast) setIsShowToast(true); // Hiện toast
      sendPushNotification(buildDataToPushNotificationType); // Gửi push notification nếu cần
    });

    socket.on("driverAcceptOrder", (response) => {
      if (response.success) {
        console.log("Order accepted successfully", response.order);
        setLatestOrder(response.order);
        setOrders((prevOrders) => [...prevOrders, response.order]);
        if (setIsShowToast) setIsShowToast(true); // Hiện toast khi accept
      } else {
        console.error("Failed to accept order:", response.message);
        setLatestOrder(null);
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    return () => {
      socket.off("connect");
      socket.off("notifyOrderStatus");
      socket.off("driverAcceptOrder");
      socket.off("disconnect");
    };
  }, [
    driverId,
    setOrders,
    sendPushNotification,
    setLatestOrder,
    setIsShowToast,
  ]);

  return socket; // Trả về socket nếu cần dùng ở nơi khác
};
