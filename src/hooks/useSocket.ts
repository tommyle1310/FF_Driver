import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { BACKEND_URL } from "../utils/constants";
import { useDispatch, useSelector } from "../store/types";
import { RootState } from "../store/store";
import {
  saveDriverProgressStageToAsyncStorage,
  setDriverProgressStage,
  clearDriverProgressStage,
} from "../store/currentDriverProgressStageSlice";
import { Type_PushNotification_Order } from "../types/pushNotification";
import NetInfo from "@react-native-community/netinfo"; // Thêm để kiểm tra mạng

interface Stage {
  state: string;
  status: string;
  timestamp: number;
  details?: any;
  duration?: number;
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
  const { transactions_processed } = useSelector(
    (state: RootState) => state.currentDriverProgressStage
  );
  const dispatch = useDispatch();
  const socketRef = useRef<Socket | null>(null);
  const lastResponseRef = useRef<string | null>(null);
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialUpdateRef = useRef(true);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  const eventQueueRef = useRef<{ event: string; data: any; id: string }[]>([]);
  const emitQueueRef = useRef<
    { event: string; data: any; resolve: Function; reject: Function }[]
  >([]);
  const isProcessingRef = useRef(false);
  const processedEventIds = useRef<Map<string, number>>(new Map());
  const processedOrderIds = useRef<Set<string>>(new Set());
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000;

  const reconnectSocket = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      setIsSocketConnected(false);
      return;
    }

    reconnectAttemptsRef.current += 1;
    const delay = Math.min(
      reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1),
      16000
    );
    console.log(
      `Attempting to reconnect (attempt ${reconnectAttemptsRef.current}) in ${delay}ms`
    );

    setTimeout(() => {
      if (socketRef.current?.connected) {
        console.log("Socket already connected, skipping reconnect");
        reconnectAttemptsRef.current = 0;
        return;
      }
      setupSocket();
      if (socketRef.current) {
        socketRef.current.connect();
        setupSocketListeners();
      }
    }, delay);
  };

  const resetResponseTimeout = () => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
    }
    responseTimeoutRef.current = setTimeout(() => {
      console.log("Response timeout, resetting isWaitingForResponse");
      setIsWaitingForResponse(false);
      isProcessingRef.current = false;
    }, 10000);
  };

  const setupSocket = () => {
    if (!driverId || !accessToken) {
      console.log("Missing driverId or accessToken, skipping socket setup");
      return;
    }

    if (socketRef.current) {
      console.log("Socket instance exists, checking state");
      if (socketRef.current.connected) {
        console.log("Socket already connected, skipping setup");
        return;
      }
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    socketRef.current = io(`${BACKEND_URL}/driver`, {
      transports: ["websocket"],
      extraHeaders: {
        auth: `Bearer ${accessToken}`,
      },
      reconnection: false,
      query: { driverId },
      timeout: 20000,
    });
  };

  const cleanupSocketListeners = () => {
    if (socketRef.current) {
      console.log("Cleaning up socket listeners");
      socketRef.current.off("connect");
      socketRef.current.off("connect_error");
      socketRef.current.off("reconnect");
      socketRef.current.off("incomingOrderForDriver");
      socketRef.current.off("notifyOrderStatus");
      socketRef.current.off("driverStagesUpdated");
      socketRef.current.off("driverAcceptOrder");
      socketRef.current.off("disconnect");
      if (!socketRef.current.connected) {
        socketRef.current.disconnect();
      }
      socketRef.current = null;
    }
  };

  const processEmitQueue = () => {
    if (!socketRef.current?.connected || emitQueueRef.current.length === 0)
      return;

    const { event, data, resolve, reject } = emitQueueRef.current.shift()!;
    console.log(`Processing queued emit: ${event}`, data);

    socketRef.current!.emit(event, data, (response: any) => {
      console.log(`${event} response:`, response);
      if (response.error) {
        console.error(`Error in ${event}:`, response.error);
        setIsWaitingForResponse(false);
        reject(new Error(response.error));
      } else {
        setIsWaitingForResponse(false);
        resolve(response);
      }
    });

    resetResponseTimeout();
    processEmitQueue();
  };

  const processEventQueue = () => {
    if (isProcessingRef.current || eventQueueRef.current.length === 0) return;

    isProcessingRef.current = true;
    const { event, data, id } = eventQueueRef.current.shift()!;

    const eventKey = `${data.id}_${data.updated_at}`;
    const lastUpdatedAt = processedEventIds.current.get(data.id);

    if (lastUpdatedAt && lastUpdatedAt >= data.updated_at) {
      console.log("Skipping duplicate or older event:", eventKey);
      isProcessingRef.current = false;
      processEventQueue();
      return;
    }

    processedEventIds.current.set(data.id, data.updated_at);

    if (event === "driverStagesUpdated") {
      console.log("Processing driverStagesUpdated:", {
        eventId: id,
        stageCount: data.stages.length,
      });

      setIsWaitingForResponse(false);
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }

      if (
        data.transactions_processed ||
        transactions_processed ||
        isOrderCompleted
      ) {
        console.log(
          "Order completed or marked as completed, skipping driverStagesUpdated"
        );
        dispatch(clearDriverProgressStage());
        isProcessingRef.current = false;
        processEventQueue();
        return;
      }

      // Deduplicate stages, giữ stage mới nhất
      const uniqueStages = Object.values(
        data.stages.reduce((acc: { [key: string]: Stage }, stage: Stage) => {
          const key = stage.state;
          if (!acc[key] || acc[key].timestamp < stage.timestamp) {
            acc[key] = stage;
          }
          return acc;
        }, {})
      ).sort((a: Stage, b: Stage) => {
        const order = [
          "driver_ready_order_1",
          "waiting_for_pickup_order_1",
          "restaurant_pickup_order_1",
          "en_route_to_customer_order_1",
          "delivery_complete_order_1",
        ];
        return order.indexOf(a.state) - order.indexOf(b.state);
      });

      const filteredResponse = { ...data, stages: uniqueStages };
      const responseString = JSON.stringify(filteredResponse);

      if (
        isInitialUpdateRef.current ||
        lastResponseRef.current !== responseString
      ) {
        console.log("Dispatching driverStagesUpdated:", {
          stageCount: uniqueStages.length,
          currentState: data.current_state,
        });
        dispatch(setDriverProgressStage(filteredResponse));
        dispatch(saveDriverProgressStageToAsyncStorage(filteredResponse));
        lastResponseRef.current = responseString;
        isInitialUpdateRef.current = false;
      } else {
        console.log("Skipping driverStagesUpdated dispatch: no data change");
      }
    }

    isProcessingRef.current = false;
    processEventQueue();
  };

  const setupSocketListeners = () => {
    if (!socketRef.current) return;

    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket server");
      setIsSocketConnected(true);
      reconnectAttemptsRef.current = 0;
      eventQueueRef.current = [];
      processedEventIds.current.clear();
      setIsWaitingForResponse(false);
      processEmitQueue();
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      setIsSocketConnected(false);
      reconnectSocket();
    });

    socketRef.current.on("reconnect", () => {
      console.log("Reconnected to WebSocket server");
      setIsSocketConnected(true);
      reconnectAttemptsRef.current = 0;
      processEmitQueue();
    });

    socketRef.current.on("incomingOrderForDriver", (response) => {
      const orderId = response.data.orderId;
      if (processedOrderIds.current.has(orderId)) {
        console.log("Skipping duplicate incomingOrderForDriver:", orderId);
        return;
      }
      processedOrderIds.current.add(orderId);

      console.log("Received incomingOrderForDriver:", response);
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
      dispatch(clearDriverProgressStage());
      eventQueueRef.current = [];
      processedEventIds.current.clear();
      lastResponseRef.current = null;
      isInitialUpdateRef.current = true;
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
        const eventId = `${response.id}_${response.updated_at}`;
        console.log("Received driverStagesUpdated:", { eventId, response });
        eventQueueRef.current.push({
          event: "driverStagesUpdated",
          data: response,
          id: eventId,
        });
        processEventQueue();
      });

      socketRef.current.on("driverAcceptOrder", (response) => {
        if (response.success) {
          console.log("Order accepted successfully", response.order);
          setLatestOrder(response.order);
          setOrders((prevOrders) => [...prevOrders, response.order]);
          if (setIsShowToast) setIsShowToast(true);
          isInitialUpdateRef.current = true;
          dispatch(clearDriverProgressStage());
          setIsOrderCompleted(false);
        } else {
          console.error("Failed to accept order:", response.message);
          setLatestOrder(null);
        }
      });
    }

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsSocketConnected(false);
      reconnectSocket();
    });
  };

  useEffect(() => {
    if (!driverId || !accessToken) {
      console.log("Missing driverId or accessToken");
      return;
    }

    setupSocket();
    setupSocketListeners();

    // Kiểm tra trạng thái mạng
    const unsubscribe = NetInfo.addEventListener((state) => {
      console.log("Network state:", state);
      if (!state.isConnected && socketRef.current?.connected) {
        socketRef.current.disconnect();
        setIsSocketConnected(false);
      } else if (state.isConnected && !socketRef.current?.connected) {
        reconnectSocket();
      }
    });

    return () => {
      console.log("Cleaning up socket listeners on unmount");
      cleanupSocketListeners();
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
      unsubscribe();
    };
  }, [driverId, accessToken]);

  const emitDriverAcceptOrder = (data: {
    driverId: string;
    orderId: string;
    restaurantLocation?: { lat: number; lng: number };
  }) => {
    return new Promise((resolve, reject) => {
      if (socketRef.current && socketRef.current.connected) {
        console.log("Emitted driverAcceptOrder with data:", data);
        socketRef.current.emit("driverAcceptOrder", data, (response: any) => {
          if (response.error) {
            console.error("Error in driverAcceptOrder:", response.error);
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      } else {
        console.log(
          "Socket not connected, queuing emit: driverAcceptOrder",
          data
        );
        emitQueueRef.current.push({
          event: "driverAcceptOrder",
          data,
          resolve,
          reject,
        });
        reconnectSocket();
      }
    });
  };

  const emitUpdateDriverProgress = async (data: any) => {
    if (!socketRef.current?.connected) {
      console.warn("Socket not connected, queuing emitUpdateDriverProgress");
      return new Promise((resolve, reject) => {
        emitQueueRef.current.push({
          event: "updateDriverProgress",
          data,
          resolve,
          reject,
        });
        reconnectSocket();
      });
    }

    console.log(
      "Setting isWaitingForResponse to true for emitUpdateDriverProgress"
    );
    setIsWaitingForResponse(true);
    resetResponseTimeout();
    return new Promise((resolve, reject) => {
      socketRef.current!.emit("updateDriverProgress", data, (response: any) => {
        console.log("updateDriverProgress response:", response);
        if (response.error) {
          console.error("Error in updateDriverProgress:", response.error);
          setIsWaitingForResponse(false);
          if (responseTimeoutRef.current) {
            clearTimeout(responseTimeoutRef.current);
          }
          reject(new Error(response.error));
        } else {
          setIsWaitingForResponse(false);
          if (responseTimeoutRef.current) {
            clearTimeout(responseTimeoutRef.current);
          }
          resolve(response);
        }
      });
    });
  };

  const completeOrder = () => {
    console.log("Completing order, cleaning up socket and state");
    setIsOrderCompleted(true);
    cleanupSocketListeners();
    dispatch(clearDriverProgressStage());
    lastResponseRef.current = null;
    isInitialUpdateRef.current = true;
    setIsWaitingForResponse(false);
    eventQueueRef.current = [];
    emitQueueRef.current = [];
    processedEventIds.current.clear();
    processedOrderIds.current.clear();
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  return {
    socket: socketRef.current,
    emitDriverAcceptOrder,
    emitUpdateDriverProgress,
    isWaitingForResponse,
    isSocketConnected,
    completeOrder,
  };
};
