import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store/store";
import {
  saveDriverProgressStageToAsyncStorage,
  setDriverProgressStage,
  clearDriverProgressStage,
} from "../store/currentDriverProgressStageSlice";
import { Type_PushNotification_Order } from "../types/pushNotification";
import NetInfo from "@react-native-community/netinfo";
import SocketManager from "./SocketManager";

interface Stage {
  state: string;
  status: string;
  timestamp: number;
  details?: any;
  duration?: number;
}

export const useSocket = (
  driverId: string,
  setOrders: React.Dispatch<React.SetStateAction<Type_PushNotification_Order[]>>,
  sendPushNotification: (order: Type_PushNotification_Order) => void,
  setLatestOrder: React.Dispatch<
    React.SetStateAction<Type_PushNotification_Order | null>
  >,
  setIsShowToast?: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { accessToken, userId } = useSelector((state: RootState) => state.auth);
  const { transactions_processed } = useSelector(
    (state: RootState) => state.currentDriverProgressStage
  );
  const dispatch: AppDispatch = useDispatch();
  const lastResponseRef = useRef<string | undefined>(undefined); // Fix typing
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

  const processEmitQueue = () => {
    if (!SocketManager.isConnected() || emitQueueRef.current.length === 0) {
      return;
    }

    const { event, data, resolve, reject } = emitQueueRef.current.shift()!; // Add data
    console.log(`Processing queued emit: ${event}`, data);

    SocketManager.emit(event, data, (response: any) => {
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

      const uniqueStages = Object.values<Stage>(
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

  useEffect(() => {
    if (!driverId || !accessToken) {
      console.log("Missing driverId or accessToken, cleaning up socket");
      SocketManager.cleanup();
      return;
    }

    console.log(
      `Initializing SocketManager with driverId: ${driverId}, userId: ${userId}, token: ${accessToken}`
    );
    SocketManager.initialize(driverId, accessToken, userId ?? '');

    const handleConnect = () => {
      console.log("Socket connected");
      setIsSocketConnected(true);
      eventQueueRef.current = [];
      processedEventIds.current.clear();
      setIsWaitingForResponse(false);
      processEmitQueue();
    };

    const handleConnectError = (error: any) => {
      console.error("Socket connect error:", {
        message: error.message,
        description: error.description,
        context: error.context,
      });
      setIsSocketConnected(false);
    };

    const handleDisconnect = (reason: string) => {
      console.log("Socket disconnected, reason:", reason);
      setIsSocketConnected(false);
    };

    const handleIncomingOrder = (response: any) => {
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
      const buildDataToPushNotification: Type_PushNotification_Order = {
        id: responseData?.orderId,
        customer_id: responseData?.customer_id,
        driver_earn: responseData?.driver_earn,
        total_amount:
          responseData?.total_amount ??
          responseData?.orderDetails?.total_amount,
        status: responseData?.status,
        order_items:
          responseData?.order_items ?? responseData?.orderDetails?.order_items ?? [],
      };

      processedOrderIds.current.add(orderId);

      setLatestOrder(buildDataToPushNotification);
      setOrders((prevOrders) => {
        const updatedOrders = prevOrders.map((order) =>
          order.id === buildDataToPushNotification.id
            ? buildDataToPushNotification
            : order
        );
        if (
          !updatedOrders.some(
            (order) => order.id === buildDataToPushNotification.id
          )
        ) {
          updatedOrders.push(buildDataToPushNotification);
        }
        return updatedOrders;
      });
      if (setIsShowToast) setIsShowToast(true);
      sendPushNotification(buildDataToPushNotification);
      setIsOrderCompleted(false);
      dispatch(clearDriverProgressStage());
      eventQueueRef.current = [];
      processedEventIds.current.clear();
      lastResponseRef.current = undefined;
      isInitialUpdateRef.current = true;
    };

    const handleNotifyOrderStatus = (response: any) => {
      const buildDataToPushNotification: Type_PushNotification_Order = {
        id: response?.orderId,
        customer_id: response?.customer_id,
        total_amount:
          response?.total_amount ?? response?.orderDetails?.total_amount,
        status: response?.status,
        order_items:
          response?.order_items ?? response?.orderDetails?.order_items ?? [],
      };
      console.log("Received notifyOrderStatus:", buildDataToPushNotification);
      setLatestOrder(buildDataToPushNotification);
      setOrders((prevOrders) => {
        const updatedOrders = prevOrders.map((order) =>
          order.id === buildDataToPushNotification.id
            ? buildDataToPushNotification
            : order
        );
        if (
          !updatedOrders.some(
            (order) => order.id === buildDataToPushNotification.id
          )
        ) {
          updatedOrders.push(buildDataToPushNotification);
        }
        return updatedOrders;
      });
      if (setIsShowToast) setIsShowToast(true);
      sendPushNotification(buildDataToPushNotification);
    };

    const handleDriverStagesUpdated = (response: any) => {
      const eventId = `${response.id}_${response.updated_at}`;
      console.log("Received driverStagesUpdated:", { eventId, response });
      eventQueueRef.current.push({
        event: "driverStagesUpdated",
        data: response,
        id: eventId,
      });
      processEventQueue();
    };

    const handleDriverAcceptOrder = (response: any) => {
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
    };

    SocketManager.on("connect", handleConnect);
    SocketManager.on("connect_error", handleConnectError);
    SocketManager.on("disconnect", handleDisconnect);
    SocketManager.on("incomingOrderForDriver", handleIncomingOrder);
    if (!isOrderCompleted) {
      SocketManager.on("notifyOrderStatus", handleNotifyOrderStatus);
      SocketManager.on("driverStagesUpdated", handleDriverStagesUpdated);
      SocketManager.on("driverAcceptOrder", handleDriverAcceptOrder);
    }

    const unsubscribe = NetInfo.addEventListener((state) => {
      console.log("Network state:", state);
      if (!state.isConnected || !state.isInternetReachable) {
        console.log("Network or internet lost, disconnecting socket");
        SocketManager.disconnect();
        setIsSocketConnected(false);
      }
    });

    return () => {
      console.log("Cleaning up socket listeners in useSocket");
      SocketManager.off("connect", handleConnect);
      SocketManager.off("connect_error", handleConnectError);
      SocketManager.off("disconnect", handleDisconnect);
      SocketManager.off("incomingOrderForDriver", handleIncomingOrder);
      SocketManager.off("notifyOrderStatus", handleNotifyOrderStatus);
      SocketManager.off("driverStagesUpdated", handleDriverStagesUpdated);
      SocketManager.off("driverAcceptOrder", handleDriverAcceptOrder);
      unsubscribe();
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
    };
  }, [driverId, accessToken, userId, isOrderCompleted]);

  const emitDriverAcceptOrder = (data: {
    driverId: string;
    orderId: string;
    restaurantLocation?: { lat: number; lng: number };
  }) => {
    return new Promise((resolve, reject) => {
      if (SocketManager.isConnected()) {
        console.log("Emitted driverAcceptOrder with data:", data);
        SocketManager.emit("driverAcceptOrder", data, (response: any) => {
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
      }
    });
  };

  const emitUpdateDriverProgress = async (data: any): Promise<void> => {
    if (!SocketManager.isConnected()) {
      console.warn("Socket not connected, queuing emitUpdateDriverProgress");
      return new Promise((resolve, reject) => {
        emitQueueRef.current.push({
          event: "updateDriverProgress",
          data,
          resolve,
          reject,
        });
      });
    }

    console.log(
      "Setting isWaitingForResponse to true for emitUpdateDriverProgress"
    );
    setIsWaitingForResponse(true);
    resetResponseTimeout();
    return new Promise((resolve, reject) => {
      SocketManager.emit("updateDriverProgress", data, (response: any) => {
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

  const handleCompleteOrder = () => {
    console.log("Completing order, cleaning up socket and state");
    setIsOrderCompleted(true);
    dispatch(clearDriverProgressStage());
    lastResponseRef.current = undefined;
    isInitialUpdateRef.current = true;
    setIsWaitingForResponse(false);
    eventQueueRef.current = [];
    emitQueueRef.current = [];
    processedEventIds.current.clear();
    processedOrderIds.current.clear();
  };

  const handleRejectOrder = (orderId: string) => {
    console.log("Rejecting order, removing from processedOrderIds:", orderId);
    processedOrderIds.current.delete(orderId);
    if (setIsShowToast) setIsShowToast(false);
  };

  return {
    socket: SocketManager,
    emitDriverAcceptOrder,
    emitUpdateDriverProgress,
    isWaitingForResponse,
    isSocketConnected,
    handleCompleteOrder,
    handleRejectOrder,
  };
};