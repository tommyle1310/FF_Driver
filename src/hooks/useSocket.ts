import { useEffect, useRef, useState } from "react";
import { Type_PushNotification_Order } from "../types/pushNotification";
import { io, Socket } from "socket.io-client";
import { BACKEND_URL } from "../utils/constants";
import { useDispatch, useSelector } from "../store/types";
import { RootState } from "../store/store";
import {
  saveDriverProgressStageToAsyncStorage,
  setDriverProgressStage,
  clearDriverProgressStage,
  Stage,
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
  const socketRef = useRef<Socket | null>(null);
  const lastResponseRef = useRef<string | null>(null);
  const isInitialUpdateRef = useRef(true);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);

  const setupSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    socketRef.current = io(`${BACKEND_URL}/driver`, {
      transports: ["websocket"],
      extraHeaders: {
        auth: `Bearer ${accessToken}`,
      },
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });
  };

  const setupSocketListeners = () => {
    if (!socketRef.current) return;

    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socketRef.current.on("incomingOrderForDriver", (response) => {
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
      setIsOrderCompleted(false);
    });

    if (!isOrderCompleted) {
      socketRef.current.on("notifyOrderStatus", (response) => {
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

      socketRef.current.on("driverStagesUpdated", (response) => {
        console.log("driverStagesUpdated received:", response);
        const responseString = JSON.stringify(response);
        setIsWaitingForResponse(false);

        // Filter and sort stages
        const uniqueStages = response.stages
          .reduce((acc: Stage[], stage: Stage) => {
            if (
              !acc.find(
                (s: Stage) =>
                  s.state === stage.state &&
                  s.status === stage.status &&
                  s.timestamp === stage.timestamp
              )
            ) {
              acc.push(stage);
            }
            return acc;
          }, [] as Stage[])
          .sort((a, b) => a.timestamp - b.timestamp);

        const filteredResponse = { ...response, stages: uniqueStages };

        if (
          isInitialUpdateRef.current ||
          lastResponseRef.current !== responseString
        ) {
          console.log("Dispatch driverStagesUpdated:", filteredResponse);
          dispatch(setDriverProgressStage(filteredResponse));
          dispatch(saveDriverProgressStageToAsyncStorage(filteredResponse));
          lastResponseRef.current = responseString;
          isInitialUpdateRef.current = false;
        } else {
          console.log("Skipping driverStagesUpdated dispatch: no data change");
        }
      });

      socketRef.current.on("driverAcceptOrder", (response) => {
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
    }

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsWaitingForResponse(false);
    });
  };

  const cleanupSocketListeners = () => {
    if (socketRef.current) {
      socketRef.current.off("notifyOrderStatus");
      socketRef.current.off("driverStagesUpdated");
      socketRef.current.off("driverAcceptOrder");
    }
  };

  useEffect(() => {
    if (!driverId) {
      console.log("Please provide a driver ID");
      return;
    }

    setupSocket();
    setupSocketListeners();

    return () => {
      cleanupSocketListeners();
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("incomingOrderForDriver");
        socketRef.current.off("disconnect");
        socketRef.current.disconnect();
      }
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
    if (socketRef.current) {
      socketRef.current.emit("driverAcceptOrder", data);
      console.log("Emitted driverAcceptOrder with data:", data);
    }
  };

  const emitUpdateDriverProgress = (data: any) => {
    if (socketRef.current) {
      setIsWaitingForResponse(true);
      socketRef.current.emit("updateDriverProgress", data);
      console.log("Emitted updateDriverProgress with data:", data);
      setTimeout(() => {
        setIsWaitingForResponse(false);
      }, 10000);
    }
  };

  const completeOrder = () => {
    setIsOrderCompleted(true);
    cleanupSocketListeners();
    dispatch(clearDriverProgressStage());
    lastResponseRef.current = null;
    isInitialUpdateRef.current = true;
    setIsWaitingForResponse(false);
  };

  return {
    socket: socketRef.current,
    emitDriverAcceptOrder,
    emitUpdateDriverProgress,
    isWaitingForResponse,
    completeOrder,
  };
};
