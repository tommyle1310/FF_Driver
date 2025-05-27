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
import NetInfo from "@react-native-community/netinfo";

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
  const [networkState, setNetworkState] = useState<boolean | null>(null);
  
  // Thêm các ref để tránh tạo socket nhiều lần
  const isConnectingRef = useRef(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastConnectionAttemptRef = useRef<number>(0);

  const reconnectSocket = () => {
    // Tránh reconnect quá nhanh
    const now = Date.now();
    if (now - lastConnectionAttemptRef.current < 1000) {
      console.log("Reconnect attempt too soon, skipping");
      return;
    }
    lastConnectionAttemptRef.current = now;

    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      setIsSocketConnected(false);
      return;
    }

    if (isConnectingRef.current) {
      console.log("Already attempting to connect, skipping");
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

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }

    connectionTimeoutRef.current = setTimeout(() => {
      if (socketRef.current?.connected) {
        console.log("Socket already connected, skipping reconnect");
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;
        return;
      }
      if (!networkState) {
        console.log("No network connection, skipping reconnect");
        isConnectingRef.current = false;
        return;
      }
      
      isConnectingRef.current = true;
      setupSocket();
      if (socketRef.current) {
        socketRef.current.connect();
        setupSocketListeners();
      }
      isConnectingRef.current = false;
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
      // Cleanup existing socket properly
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    console.log("Creating new socket connection");
    socketRef.current = io(`${BACKEND_URL}/driver`, {
      transports: ["websocket"],
      extraHeaders: {
        auth: `Bearer ${accessToken}`,
      },
      reconnection: false, // Tự quản lý reconnection
      query: { driverId },
      timeout: 20000,
      pingTimeout: 60000, // Tăng timeout
      pingInterval: 25000, // Tăng interval
      forceNew: true, // Force tạo connection mới
    });
  };

  const cleanupSocketListeners = () => {
    if (socketRef.current) {
      console.log("Cleaning up socket listeners");
      socketRef.current.removeAllListeners();
      if (socketRef.current.connected) {
        socketRef.current.disconnect();
      }
      socketRef.current = null;
    }
    
    // Clear timeouts
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
    
    isConnectingRef.current = false;
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
      if (!filteredResponse.current_state || !filteredResponse.stages.length) {
        console.warn(
          "Invalid filteredResponse, skipping dispatch:",
          filteredResponse
        );
        isProcessingRef.current = false;
        processEventQueue();
        return;
      }

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
      isConnectingRef.current = false;
      eventQueueRef.current = [];
      processedEventIds.current.clear();
      setIsWaitingForResponse(false);
      processEmitQueue();
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error.message);
      setIsSocketConnected(false);
      isConnectingRef.current = false;
      
      // Không reconnect ngay lập tức nếu có lỗi auth
      if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        console.error("Authentication error, stopping reconnection");
        return;
      }
      
      setTimeout(() => reconnectSocket(), 3000);
    });

    socketRef.current.on("reconnect", () => {
      console.log("Reconnected to WebSocket server");
      setIsSocketConnected(true);
      reconnectAttemptsRef.current = 0;
      isConnectingRef.current = false;
      processEmitQueue();
    });

    socketRef.current.on("incomingOrderForDriver", (response) => {
      const orderId = response.data.orderId;
      const orderStatus = response.data.status;

      if (
        processedOrderIds.current.has(orderId) &&
        orderStatus !== "PREPARING"
      ) {
        console.log("Skipping duplicate incomingOrderForDriver:", orderId);
        return;
      }

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

      processedOrderIds.current.add(orderId);

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
          processedOrderIds.current.delete(response.order.id);
        } else {
          console.error("Failed to accept order:", response.message);
          setLatestOrder(null);
          processedOrderIds.current.delete(response.order?.id);
        }
      });
    }

    socketRef.current.on("disconnect", (reason) => {
      console.log("Disconnected from WebSocket server, reason:", reason);
      setIsSocketConnected(false);
      isConnectingRef.current = false;
      
      // Chỉ reconnect nếu không phải do client disconnect
      if (reason !== "io client disconnect") {
        setTimeout(() => reconnectSocket(), 2000);
      }
    });
  };

  useEffect(() => {
    if (!driverId || !accessToken) {
      console.log("Missing driverId or accessToken");
      return;
    }

    setupSocket();
    setupSocketListeners();

    const unsubscribe = NetInfo.addEventListener((state) => {
      console.log("Network state:", state);
      const wasConnected = networkState;
      setNetworkState(state.isConnected);
      
      if (!state.isConnected && socketRef.current?.connected) {
        console.log("Network lost, disconnecting socket");
        socketRef.current.disconnect();
        setIsSocketConnected(false);
      } else if (state.isConnected && wasConnected === false && !socketRef.current?.connected) {
        console.log("Network restored, attempting reconnect");
        reconnectAttemptsRef.current = 0;
        setTimeout(() => reconnectSocket(), 1000);
      }
    });

    return () => {
      console.log("Cleaning up socket listeners on unmount");
      cleanupSocketListeners();
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
        if (networkState) {
          reconnectSocket();
        } else {
          console.log("No network, waiting for network to reconnect");
        }
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
        if (networkState) {
          reconnectSocket();
        }
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
  };

  const rejectOrder = (orderId: string) => {
    console.log("Rejecting order, removing from processedOrderIds:", orderId);
    processedOrderIds.current.delete(orderId);
    if (setIsShowToast) setIsShowToast(false);
  };

  return {
    socket: socketRef.current,
    emitDriverAcceptOrder,
    emitUpdateDriverProgress,
    isWaitingForResponse,
    isSocketConnected,
    completeOrder,
    rejectOrder,
  };
};