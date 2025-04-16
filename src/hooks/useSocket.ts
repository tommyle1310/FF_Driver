import { useEffect, useRef, useState } from "react";
import { Type_PushNotification_Order } from "../types/pushNotification";
import { io, Socket } from "socket.io-client";
import { BACKEND_URL } from "../utils/constants";
import { useDispatch, useSelector } from "../store/types";
import { RootState } from "../store/store";
import {
  saveDriverProgressStageToAsyncStorage,
  setDriverProgressStage,
} from "../store/currentDriverProgressStageSlice";

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
  setIsShowToast?: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const socket = io(`${BACKEND_URL}/driver`, {
    transports: ["websocket"],
    extraHeaders: {
      auth: `Bearer ${accessToken}`,
    },
  });
  const lastResponseRef = useRef<string | null>(null);
  const isInitialUpdateRef = useRef(true);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

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
      setLatestOrder(buildDataToPushNotificationType);
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
      if (setIsShowToast) setIsShowToast(true);
      sendPushNotification(buildDataToPushNotificationType);
    });

    socket.on("incomingOrderForDriver", (response) => {
      const responseData = response.data;
      const buildDataToPushNotificationType: Type_PushNotification_Order = {
        id: responseData?.orderId,
        customer_id: responseData?.customer_id,
        driver_earn: responseData?.driver_earn,
        total_amount:
          responseData?.total_amount ??
          responseData?.orderDetails?.total_amount,
        status: responseData?.status,
        order_items:
          responseData?.order_items ?? responseData?.orderDetails?.order_items,
      };
      console.log(
        "Received incomingOrderForDriver:",
        buildDataToPushNotificationType
      );
      setLatestOrder(buildDataToPushNotificationType);
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
      if (setIsShowToast) setIsShowToast(true);
      sendPushNotification(buildDataToPushNotificationType);
    });

    socket.on("driverStagesUpdated", (response) => {
      console.log("driverStagesUpdated received:", response);
      const responseString = JSON.stringify(response);
      setIsWaitingForResponse(false); // Always reset waiting state
      if (
        isInitialUpdateRef.current ||
        lastResponseRef.current !== responseString
      ) {
        console.log("Dispatch driverStagesUpdated:", response);
        dispatch(setDriverProgressStage(response));
        dispatch(saveDriverProgressStageToAsyncStorage(response));
        lastResponseRef.current = responseString;
        isInitialUpdateRef.current = false;
      } else {
        console.log("Skipping driverStagesUpdated dispatch: no data change");
      }
    });

    socket.on("driverAcceptOrder", (response) => {
      if (response.success) {
        console.log("Order accepted successfully", response.order);
        setLatestOrder(response.order);
        setOrders((prevOrders) => [...prevOrders, response.order]);
        if (setIsShowToast) setIsShowToast(true);
        isInitialUpdateRef.current = true;
      } else {
        console.error("Failed to accept order:", response.message);
        setLatestOrder(null);
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsWaitingForResponse(false); // Reset on disconnect
    });

    return () => {
      socket.off("connect");
      socket.off("notifyOrderStatus");
      socket.off("incomingOrderForDriver");
      socket.off("driverStagesUpdated");
      socket.off("driverAcceptOrder");
      socket.off("disconnect");
    };
  }, [
    driverId,
    setOrders,
    sendPushNotification,
    setLatestOrder,
    setIsShowToast,
    dispatch,
  ]);

  const emitDriverAcceptOrder = (data: {
    driverId: string;
    orderId: string;
  }) => {
    socket.emit("driverAcceptOrder", data);
    console.log("Emitted driverAcceptOrder with data:", data);
  };

  const emitUpdateDriverProgress = (data: any) => {
    setIsWaitingForResponse(true);
    socket.emit("updateDriverProgress", data);
    console.log("Emitted updateDriverProgress with data:", data);
  };

  return {
    socket,
    emitDriverAcceptOrder,
    emitUpdateDriverProgress,
    isWaitingForResponse,
  };
};
