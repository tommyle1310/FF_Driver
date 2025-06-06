import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store/store";
import {
  saveDriverProgressStageToAsyncStorage,
  setDriverProgressStage,
  clearDriverProgressStage,
  updateStages,
} from "../store/currentDriverProgressStageSlice";
import { Type_PushNotification_Order } from "../types/pushNotification";
import NetInfo from "@react-native-community/netinfo";
import { debugLogger } from "../utils/debugLogger";
import SocketManager from "./SocketManager";

interface Stage {
  state: string;
  status: string;
  timestamp: number;
  details?: any;
  duration?: number;
}

interface SocketResponse {
  success: boolean;
  message?: string;
  error?: string;
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
  const { accessToken, userId } = useSelector((state: RootState) => state.auth);
  const {
    transactions_processed,
    stages,
    orders,
    id,
    current_state,
    previous_state,
    next_state,
    estimated_time_remaining,
    actual_time_spent,
    total_distance_travelled,
    total_tips,
    total_earns,
    events,
    created_at,
    updated_at,
  } = useSelector((state: RootState) => state.currentDriverProgressStage);
  const dispatch: AppDispatch = useDispatch();
  const lastResponseRef = useRef<string | undefined>(undefined);
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialUpdateRef = useRef(true);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  const completedOrderIds = useRef<Set<string>>(new Set());
  const blockSocketUpdates = useRef<boolean>(false);
  const blockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

    const { event, data, resolve, reject } = emitQueueRef.current.shift()!;
    console.log(`Processing queued emit: ${event}`, data);

    SocketManager.emit(event, data, (response: SocketResponse) => {
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

    // Only check for duplicates if we have proper id and updated_at
    if (data.id && data.updated_at) {
      const eventKey = `${data.id}_${data.updated_at}`;
      const lastUpdatedAt = processedEventIds.current.get(data.id);

      if (lastUpdatedAt && lastUpdatedAt >= data.updated_at) {
        console.log("Skipping duplicate or older event:", eventKey);
        isProcessingRef.current = false;
        processEventQueue();
        return;
      }

      processedEventIds.current.set(data.id, data.updated_at);
    } else {
      console.log("Processing event without id/updated_at:", id);
    }

    if (event === "driverStagesUpdated") {
      // Skip if this is just an order status update without stages
      if (
        !data.stages ||
        !Array.isArray(data.stages) ||
        data.stages.length === 0
      ) {
        console.log("Skipping driverStagesUpdated without stages data:", id);
        isProcessingRef.current = false;
        processEventQueue();
        return;
      }

      // Skip if socket updates are blocked (during order completion)
      if (blockSocketUpdates.current) {
        console.log("Blocking socket update during order completion:", id);
        debugLogger.warn("useSocket", "SOCKET_UPDATE_BLOCKED", {
          eventId: id,
          stageCount: data.stages?.length,
          reason: "Order completion in progress",
        });
        isProcessingRef.current = false;
        processEventQueue();
        return;
      }

      console.log("Processing driverStagesUpdated:", {
        eventId: id,
        stageCount: data.stages.length,
      });

      setIsWaitingForResponse(false);
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }

      if (transactions_processed || isOrderCompleted) {
        console.log(
          "Order completed or marked as completed, skipping driverStagesUpdated"
        );
        if (stages.length === 0) {
          dispatch(clearDriverProgressStage());
        }
        isProcessingRef.current = false;
        processEventQueue();
        return;
      }

      let uniqueStages = Object.values<Stage>(
        data.stages.reduce((acc: { [key: string]: Stage }, stage: Stage) => {
          const key = stage.state;
          if (!acc[key] || acc[key].timestamp < stage.timestamp) {
            acc[key] = stage;
          }
          return acc;
        }, {})
      ).sort((a: Stage, b: Stage) => {
        const aOrder = parseInt(a.state.split("_order_")[1] || "1");
        const bOrder = parseInt(b.state.split("_order_")[1] || "1");
        const aBase = a.state.split("_order_")[0];
        const bBase = b.state.split("_order_")[0];
        const stageOrder =
          [
            "driver_ready",
            "waiting_for_pickup",
            "restaurant_pickup",
            "en_route_to_customer",
            "delivery_complete",
          ].indexOf(aBase) -
          [
            "driver_ready",
            "waiting_for_pickup",
            "restaurant_pickup",
            "en_route_to_customer",
            "delivery_complete",
          ].indexOf(bBase);
        return stageOrder !== 0 ? stageOrder : aOrder - bOrder;
      });

      // Check if any delivery_complete stage just changed to "completed"
      const newlyCompletedOrders = uniqueStages
        .filter(
          (stage) =>
            stage.state.startsWith("delivery_complete_order_") &&
            stage.status === "completed"
        )
        .map((stage) => stage.state.split("_order_")[1]);

      if (newlyCompletedOrders.length > 0) {
        console.log("Detected newly completed orders:", newlyCompletedOrders);
        debugLogger.info("useSocket", "NEWLY_COMPLETED_ORDERS_DETECTED", {
          completedOrders: newlyCompletedOrders,
          totalStagesBefore: uniqueStages.length,
        });

        // Add to completed orders and filter them out
        newlyCompletedOrders.forEach((orderId) => {
          completedOrderIds.current.add(orderId);
          console.log(`Order ${orderId} marked as completed`);
        });

        // Filter out stages from completed orders
        const stagesBeforeFilter = uniqueStages.map((s) => ({
          state: s.state,
          status: s.status,
        }));
        uniqueStages = uniqueStages.filter((stage) => {
          const orderId = stage.state.split("_order_")[1];
          const isCompleted = completedOrderIds.current.has(orderId);
          if (isCompleted) {
            console.log(
              `Filtering out stage ${stage.state} from completed order ${orderId}`
            );
          }
          return !isCompleted;
        });
        const stagesAfterFilter = uniqueStages.map((s) => ({
          state: s.state,
          status: s.status,
        }));

        console.log(
          "Stages after filtering completed orders:",
          uniqueStages.length
        );

        debugLogger.info("useSocket", "STAGES_FILTERED_BY_COMPLETION", {
          stagesBeforeFilter,
          stagesAfterFilter,
          filteredCount: uniqueStages.length,
          completedOrders: Array.from(completedOrderIds.current),
        });
      }

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

      // Skip dispatch if incoming data contains completed orders that we already removed locally
      if (completedOrderIds.current.size > 0) {
        const incomingCompletedStages = uniqueStages.filter((stage) => {
          const orderId = stage.state.split("_order_")[1];
          return completedOrderIds.current.has(orderId);
        });

        if (incomingCompletedStages.length > 0) {
          console.log(
            "SKIPPING dispatch - server sending completed order stages:",
            {
              completedOrderIds: Array.from(completedOrderIds.current),
              incomingCompletedStages: incomingCompletedStages.map(
                (s) => s.state
              ),
              reason: "Server has stale data with completed orders",
            }
          );
          debugLogger.warn("useSocket", "SKIPPING_DISPATCH_STALE_SERVER_DATA", {
            completedOrderIds: Array.from(completedOrderIds.current),
            incomingCompletedStages: incomingCompletedStages.map(
              (s) => s.state
            ),
            totalIncomingStages: uniqueStages.length,
          });
          isProcessingRef.current = false;
          processEventQueue();
          return;
        }
      }

      // Skip dispatch if we have fewer stages than current (order completion in progress)
      if (stages.length > 0 && uniqueStages.length < stages.length) {
        console.log("SKIPPING dispatch - order completion detected:", {
          currentStages: stages.length,
          incomingStages: uniqueStages.length,
          reason: "Local order completion in progress",
        });
        debugLogger.warn("useSocket", "SKIPPING_DISPATCH_ORDER_COMPLETION", {
          currentStages: stages.length,
          incomingStages: uniqueStages.length,
          currentStageStates: stages.map((s) => s.state),
          incomingStageStates: uniqueStages.map((s) => s.state),
        });
        isProcessingRef.current = false;
        processEventQueue();
        return;
      }

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
    SocketManager.initialize(driverId, accessToken, userId ?? "");

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
          responseData?.order_items ??
          responseData?.orderDetails?.order_items ??
          [],
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
      completedOrderIds.current.clear(); // Clear completed orders for new session
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
      // Handle different response formats
      let eventId;
      let eventData;

      if (response.id && response.updated_at) {
        // Full driver progress stage update
        eventId = `${response.id}_${response.updated_at}`;
        eventData = response;
      } else if (response.orderId) {
        // Order status update - create unique ID
        eventId = `${response.orderId}_${Date.now()}`;
        eventData = response;
      } else {
        // Fallback for unknown format
        eventId = `unknown_${Date.now()}`;
        eventData = response;
      }

      console.log("Received driverStagesUpdated:", { eventId, response });
      eventQueueRef.current.push({
        event: "driverStagesUpdated",
        data: eventData,
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
    SocketManager.on("notifyOrderStatus", handleNotifyOrderStatus);
    SocketManager.on("driverStagesUpdated", handleDriverStagesUpdated);
    SocketManager.on("driverAcceptOrder", handleDriverAcceptOrder);

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

  const emitUpdateDriverProgress = async (
    data: any
  ): Promise<SocketResponse> => {
    console.log(
      "emitUpdateDriverProgress - Socket connected:",
      SocketManager.isConnected()
    );
    console.log(
      "emitUpdateDriverProgress - isSocketConnected state:",
      isSocketConnected
    );

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
      SocketManager.emit(
        "updateDriverProgress",
        data,
        (response: SocketResponse) => {
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
        }
      );
    });
  };

  const blockSocketUpdatesTemporarily = (duration: number = 3000) => {
    console.log("Blocking socket updates for", duration, "ms");
    blockSocketUpdates.current = true;

    if (blockTimeoutRef.current) {
      clearTimeout(blockTimeoutRef.current);
    }

    blockTimeoutRef.current = setTimeout(() => {
      console.log("Unblocking socket updates");
      blockSocketUpdates.current = false;
      blockTimeoutRef.current = null;
    }, duration);
  };

  const handleCompleteOrder = (orderId?: string) => {
    console.log("=== HANDLE COMPLETE ORDER:", orderId, "===");
    if (orderId) {
      // Add to completed orders set to prevent restoration
      completedOrderIds.current.add(orderId);
      console.log("Added to completed orders:", orderId);
      console.log(
        "All completed orders:",
        Array.from(completedOrderIds.current)
      );

      // Filter out stages and orders for the completed order
      const remainingStages = stages.filter(
        (stage) => !stage.state.includes(`order_${orderId}`)
      );
      const remainingOrders = orders.filter(
        (order) => !order.id.includes(orderId)
      );

      console.log("Original stages count:", stages.length);
      console.log("Remaining stages count:", remainingStages.length);
      console.log("Completed orderId:", orderId);

      if (remainingStages.length > 0) {
        // Update stages and orders, keep state for remaining orders
        console.log(
          "Remaining stages after completing order:",
          remainingStages
        );

        // Get current driver progress stage data to preserve
        const currentDPS = {
          id: id, // PRESERVE original driver progress stage ID
          driver_id: userId,
          current_state:
            remainingStages.find((s) => s.status === "in_progress")?.state ||
            remainingStages[0]?.state,
          previous_state: previous_state,
          stages: remainingStages,
          orders: remainingOrders,
          next_state: next_state,
          estimated_time_remaining: estimated_time_remaining,
          actual_time_spent: actual_time_spent,
          total_distance_travelled: total_distance_travelled, // PRESERVE
          total_tips: total_tips, // PRESERVE
          total_earns: total_earns, // PRESERVE
          events: events || [],
          created_at: created_at,
          updated_at: Math.floor(Date.now() / 1000),
          transactions_processed: false,
        };

        console.log("Preserving driver progress stage data:", {
          id: currentDPS.id,
          total_earns: currentDPS.total_earns,
          total_distance_travelled: currentDPS.total_distance_travelled,
          total_tips: currentDPS.total_tips,
        });

        dispatch(updateStages(remainingStages));
        dispatch(setDriverProgressStage(currentDPS));
        dispatch(saveDriverProgressStageToAsyncStorage(currentDPS));

        // Don't set isOrderCompleted to true if there are remaining orders
        console.log("Multiple orders: not setting isOrderCompleted to true");

        // Reset some flags but keep socket active for remaining orders
        lastResponseRef.current = undefined;
        isInitialUpdateRef.current = true;
        setIsWaitingForResponse(false);

        return;
      } else {
        // No remaining orders, clear state
        console.log("No remaining orders, clearing state");
        dispatch(clearDriverProgressStage());
      }
    } else {
      // Fallback: clear all if no orderId provided (for single-order case)
      console.log("No orderId provided, clearing all state");
      dispatch(clearDriverProgressStage());
    }

    setIsOrderCompleted(true);
    lastResponseRef.current = undefined;
    isInitialUpdateRef.current = true;
    setIsWaitingForResponse(false);
    eventQueueRef.current = [];
    emitQueueRef.current = [];
    processedEventIds.current.clear();
    processedOrderIds.current.clear();
    completedOrderIds.current.clear(); // Clear completed orders when all done
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
    blockSocketUpdatesTemporarily,
  };
};
