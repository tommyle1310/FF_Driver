import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store/store";
import {
  saveDriverProgressStageToAsyncStorage,
  setDriverProgressStage,
  clearDriverProgressStage,
  updateStages,
  updateTotalTips,
} from "../store/currentDriverProgressStageSlice";
import { fetchDailyAnalytics } from "../store/dailyAnalyticsSlice";
import { Type_PushNotification_Order } from "../types/pushNotification";
import NetInfo from "@react-native-community/netinfo";
import { debugLogger } from "../utils/debugLogger";
import SocketManager from "./SocketManager";
import debounce from "lodash.debounce";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export interface TipReceivedData {
  orderId: string;
  tipAmount: number;
  tipTime: number;
  totalTips: number;
  orderDetails: {
    id: string;
    customer_id: string;
    restaurant_id: string;
    status: string;
    tracking_info: string;
    total_amount: number;
    delivery_fee: number;
  };
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
  setIsShowToast?: React.Dispatch<React.SetStateAction<boolean>>,
  setLatestTip?: React.Dispatch<React.SetStateAction<TipReceivedData | null>>,
  setIsShowTipToast?: React.Dispatch<React.SetStateAction<boolean>>
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

  // 🔧 POST-RATING BLOCKING: Block all driverStagesUpdated events after rating completion
  const postRatingBlockRef = useRef<boolean>(false);
  const postRatingBlockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simplified duplicate detection - just track last stage count and block obvious duplicates
  const lastStageCountRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(0);

  const debouncedProcessEventQueueRef = useRef(
    debounce(() => {
      processEventQueue();
    }, 500)
  );

  // 🔧 POST-RATING BLOCKING: Check and restore persistent blocking state
  const checkAndRestorePostRatingBlock = async () => {
    try {
      const isBlockActive = await AsyncStorage.getItem("POST_RATING_BLOCK_ACTIVE");
      const blockUntil = await AsyncStorage.getItem("POST_RATING_BLOCK_UNTIL");

      if (isBlockActive === "true" && blockUntil) {
        const blockUntilTime = parseInt(blockUntil);
        const now = Date.now();

        if (now < blockUntilTime) {
          // Block is still active, restore it
          const remainingTime = blockUntilTime - now;
          console.log("🚫 POST-RATING: Restoring persistent block for", remainingTime, "ms");
          postRatingBlockRef.current = true;

          // Set timeout to unblock when time expires
          if (postRatingBlockTimeoutRef.current) {
            clearTimeout(postRatingBlockTimeoutRef.current);
          }

          postRatingBlockTimeoutRef.current = setTimeout(() => {
            console.log("✅ POST-RATING: Unblocking driverStagesUpdated events (persistent)");
            postRatingBlockRef.current = false;
            postRatingBlockTimeoutRef.current = null;
            AsyncStorage.removeItem("POST_RATING_BLOCK_ACTIVE");
            AsyncStorage.removeItem("POST_RATING_BLOCK_UNTIL");
          }, remainingTime);
        } else {
          // Block has expired, clear it
          console.log("✅ POST-RATING: Clearing expired persistent block");
          AsyncStorage.removeItem("POST_RATING_BLOCK_ACTIVE");
          AsyncStorage.removeItem("POST_RATING_BLOCK_UNTIL");
        }
      }
    } catch (error) {
      console.error("Error checking persistent post-rating block:", error);
    }
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

    // 🔧 POST-RATING BLOCKING: Block ALL processing of driverStagesUpdated events
    if (postRatingBlockRef.current) {
      console.log("🚫 POST-RATING: BLOCKING processEventQueue - clearing all queued events");
      debugLogger.warn("useSocket", "POST_RATING_PROCESS_BLOCK", {
        reason: "Rating completed - blocking all queued event processing",
        queueLength: eventQueueRef.current.length
      });
      eventQueueRef.current = []; // Clear all queued events
      return;
    }

    isProcessingRef.current = true;
    const { event, data, id } = eventQueueRef.current.shift()!;

    // Only check for duplicates if we have proper id and updated_at
    if (data.id && data.updated_at) {
      const eventKey = `${data.id}_${data.updated_at}`;
      const lastUpdatedAt = processedEventIds.current.get(data.id);

      // 🔧 CRITICAL FIX: Don't block single order updates (FF_ORDER_xxx events)
      // These represent important stage transitions and should always be processed
      const isSingleOrderUpdate = id.startsWith("FF_ORDER_");
      const isDPSUpdate = id.startsWith("FF_DPS_");

      // Only apply duplicate blocking to full DPS updates, not single order updates
      if (!isSingleOrderUpdate && lastUpdatedAt && lastUpdatedAt >= data.updated_at) {
        console.log("Skipping duplicate or older DPS event:", eventKey);
        isProcessingRef.current = false;
        processEventQueue();
        return;
      }

      // Always update tracking for both types
      processedEventIds.current.set(data.id, data.updated_at);

      console.log("Processing event:", {
        eventId: id,
        eventType: isSingleOrderUpdate ? "SINGLE_ORDER" : "FULL_DPS",
        dataId: data.id,
        updatedAt: data.updated_at
      });
    } else {
      console.log("Processing event without id/updated_at:", id);
    }

    if (event === "driverStagesUpdated") {
      // 🔧 POST-RATING BLOCKING: Additional block check during event processing
      if (postRatingBlockRef.current) {
        console.log("🚫 POST-RATING: BLOCKING driverStagesUpdated processing in processEventQueue");
        debugLogger.warn("useSocket", "POST_RATING_EVENT_PROCESS_BLOCK", {
          reason: "Rating completed - blocking driverStagesUpdated event processing",
          eventId: id
        });
        isProcessingRef.current = false;
        processEventQueue();
        return;
      }

      // Handle different event types
      const isSingleOrderUpdate = id.startsWith("FF_ORDER_");
      const isDPSUpdate = id.startsWith("FF_DPS_");

      if (isSingleOrderUpdate) {
        // Single order status update - these don't have stages array
        // But they indicate an important status change that should trigger UI updates
        console.log("Processing single order status update:", {
          eventId: id,
          orderStatus: data.status,
          trackingInfo: data.tracking_info,
        });

        // 🔧 CRITICAL: Single order updates indicate stage progression
        // Force trigger a stage re-evaluation by updating the last update time
        // This will cause HomeScreen useEffect to re-run and find the new current stage
        lastUpdateTimeRef.current = Date.now();

        // Also reset the stage count tracking to force useEffect to process
        lastStageCountRef.current = -1;

        console.log("Triggered stage re-evaluation for order status change");

        isProcessingRef.current = false;
        processEventQueue();
        return;
      }

      // For DPS updates, continue with existing logic
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

      // AGGRESSIVE DUPLICATE DETECTION: Block if stage count is excessive or obviously duplicated
      const currentTime = Date.now();
      const timeSinceLastUpdate = currentTime - lastUpdateTimeRef.current;

      // Extract unique order IDs from stages to see how many orders we're dealing with
      const orderIds = new Set<string>();
      data.stages.forEach((stage: any) => {
        const match = stage.state.match(/_order_(\d+)$/);
        if (match) {
          orderIds.add(match[1]);
        }
      });

      const orderCount = orderIds.size;
      const expectedStagesPerOrder = 5; // driver_ready, waiting_for_pickup, restaurant_pickup, en_route_to_customer, delivery_complete
      const expectedTotalStages = orderCount * expectedStagesPerOrder;

      console.log("Stage analysis:", {
        totalStages: data.stages.length,
        orderCount,
        expectedStagesPerOrder,
        expectedTotalStages,
        orderIds: Array.from(orderIds)
      });

      // If we get more than 20 stages total, something is wrong - but let's try to salvage it
      if (data.stages.length > 20) {
        console.log("WARNING: Too many stages detected, attempting to filter to latest order:", data.stages.length);

        // Try to find the latest order (highest order number) and only keep those stages
        const latestOrderId = Math.max(...Array.from(orderIds).map(id => parseInt(id)));
        console.log("Latest order ID detected:", latestOrderId);

        // Filter stages to only include the latest order
        const latestOrderStages = data.stages.filter((stage: any) =>
          stage.state.includes(`_order_${latestOrderId}`)
        );

        if (latestOrderStages.length <= 10 && latestOrderStages.length > 0) {
          console.log("SALVAGING: Using only latest order stages:", latestOrderStages.length);
          data.stages = latestOrderStages; // Replace with filtered stages
        } else {
          console.log("BLOCKING: Even latest order stages are excessive:", latestOrderStages.length);
          debugLogger.warn("useSocket", "EXCESSIVE_STAGES_BLOCKED", {
            eventId: id,
            stageCount: data.stages.length,
            latestOrderStages: latestOrderStages.length,
            reason: "More than 20 stages - likely duplicated data",
          });
          isProcessingRef.current = false;
          processEventQueue();
          return;
        }
      }

      // If stage count is same as last and it's been less than 1 second, block it
      if (data.stages.length === lastStageCountRef.current && timeSinceLastUpdate < 1000) {
        console.log("BLOCKING: Same stage count within 1 second:", {
          stageCount: data.stages.length,
          timeSinceLastUpdate
        });
        debugLogger.warn("useSocket", "RAPID_DUPLICATE_BLOCKED", {
          eventId: id,
          stageCount: data.stages.length,
          timeSinceLastUpdate,
        });
        isProcessingRef.current = false;
        processEventQueue();
        return;
      }

      // Update our tracking
      lastStageCountRef.current = data.stages.length;
      lastUpdateTimeRef.current = currentTime;

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
          dispatch(fetchDailyAnalytics());

        }
        isProcessingRef.current = false;
        processEventQueue();
        return;
      }

      // 🎯 CRITICAL FIX: Normalize order IDs to be sequential
      // Server might send wrong order IDs like "18" when it should be "1" or "2"
      const currentOrderCount = new Set(
        stages.map(stage => stage.state.split("_order_")[1]).filter(Boolean)
      ).size;

      // Check if this is a completely new order or an update to existing order
      const serverOrderIds = Array.from(orderIds);
      const highestServerOrderId = Math.max(...serverOrderIds.map(id => parseInt(id)));

      // Only normalize if server is sending clearly wrong order IDs
      // Don't normalize if we have legitimate multiple orders
      const shouldNormalize = serverOrderIds.length === 1 &&
        (currentOrderCount === 0 || highestServerOrderId > currentOrderCount + 5);

      console.log("🔧 Order ID normalization decision:", {
        currentOrderCount,
        highestServerOrderId,
        serverOrderIds,
        serverOrderCount: serverOrderIds.length,
        shouldNormalize,
      });

      let normalizedStages;
      if (shouldNormalize) {
        // Only normalize when we have a single order with wrong ID
        const nextOrderId = currentOrderCount + 1;
        normalizedStages = data.stages.map((stage: any) => {
          const stageBase = stage.state.split("_order_")[0];
          const normalizedState = `${stageBase}_order_${nextOrderId}`;

          return {
            ...stage,
            state: normalizedState
          };
        });

        console.log("🔧 Normalized stages (single order):", {
          originalStageStates: data.stages.map((s: any) => s.state),
          normalizedStageStates: normalizedStages.map((s: any) => s.state),
        });
      } else {
        // Multiple orders or reasonable order IDs - preserve as is
        normalizedStages = data.stages;

        console.log("🔧 Preserving original stages (multiple orders or reasonable IDs):", {
          originalStageStates: data.stages.map((s: any) => s.state),
        });
      }

      // Use normalized stages for further processing
      data.stages = normalizedStages;

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

      // Additional safety check: If we still have too many unique stages, limit them
      if (uniqueStages.length > 15) {
        console.log("LIMITING: Too many unique stages, truncating to 15");
        debugLogger.warn("useSocket", "STAGES_TRUNCATED", {
          originalCount: uniqueStages.length,
          truncatedCount: 15,
        });
        uniqueStages = uniqueStages.slice(0, 15);
      }

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

        // Add to completed orders tracking for UI filtering
        newlyCompletedOrders.forEach((orderId) => {
          completedOrderIds.current.add(orderId);
          console.log(`Order ${orderId} marked as completed`);
        });

        // 🔧 CRITICAL FIX: DO NOT filter out stages here
        // Let Redux and UI components handle stage filtering
        // This was causing the swipe text and task display issues
        console.log("NOT filtering stages - letting UI handle completed orders");

        debugLogger.info("useSocket", "PRESERVING_ALL_STAGES_FOR_UI", {
          completedOrders: Array.from(completedOrderIds.current),
          totalStages: uniqueStages.length,
          reason: "UI components will handle stage filtering"
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
        console.log("📡 Dispatching driverStagesUpdated:", {
          stageCount: uniqueStages.length,
          currentState: data.current_state,
          hasOrders: !!data.orders,
          ordersCount: data.orders?.length || 0,
          orderIds: data.orders?.map((o: any) => o.id) || []
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


    SocketManager.initialize(driverId, accessToken, userId ?? "");

    // 🔧 POST-RATING BLOCKING: Check and restore persistent blocking state on socket init
    checkAndRestorePostRatingBlock();

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
        distance: responseData?.distance,
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

      eventQueueRef.current = [];
      processedEventIds.current.clear();
      lastResponseRef.current = undefined;
      isInitialUpdateRef.current = true;
      completedOrderIds.current.clear();
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
      // 🔧 POST-RATING BLOCKING: Block ALL driverStagesUpdated events after rating completion
      if (postRatingBlockRef.current) {
        console.log("🚫 POST-RATING: BLOCKING driverStagesUpdated event - rating completed recently");
        debugLogger.warn("useSocket", "POST_RATING_BLOCK", {
          reason: "Rating completed - blocking server stage updates",
          eventData: response,
          blockActive: true
        });
        return; // Completely ignore the event
      }

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
      debouncedProcessEventQueueRef.current();
    };

    const handleDriverAcceptOrder = (response: any) => {
      if (response.success) {
        console.log("Order accepted successfully", response.order);
        setLatestOrder(response.order);
        setOrders((prevOrders) => [...prevOrders, response.order]);
        if (setIsShowToast) setIsShowToast(true);
        isInitialUpdateRef.current = true;

        setIsOrderCompleted(false);
        processedOrderIds.current.delete(response.order.id);
      } else {
        console.error("Failed to accept order:", response.message);
        setLatestOrder(null);
        processedOrderIds.current.delete(response.order?.id);
      }
    };

    const handleTipReceived = (response: any) => {
      console.log("🎉 Received tipReceived:", response);
      const tipData: TipReceivedData = {
        orderId: response.data.orderId,
        tipAmount: response.data.tipAmount,
        tipTime: response.data.tipTime,
        totalTips: response.data.tipAmount,
        orderDetails: response.data.orderDetails,
        message: response.data.message,
      };

      console.log("🎯 Parsed tip data:", tipData);

      const tipPayload = {
        tipAmount: tipData.tipAmount,
        orderId: tipData.orderId,
        tipTime: tipData.tipTime,
      };

      console.log("🎯 Dispatching updateTotalTips with:", tipPayload);

      // Update the total_tips in the driver progress stage (increment by tipAmount with deduplication)
      dispatch(updateTotalTips(tipPayload));

      // Show tip notification
      if (setLatestTip) setLatestTip(tipData);
      if (setIsShowTipToast) setIsShowTipToast(true);
    };

    SocketManager.on("connect", handleConnect);
    SocketManager.on("connect_error", handleConnectError);
    SocketManager.on("disconnect", handleDisconnect);
    SocketManager.on("incomingOrderForDriver", handleIncomingOrder);
    SocketManager.on("notifyOrderStatus", handleNotifyOrderStatus);
    SocketManager.on("driverStagesUpdated", handleDriverStagesUpdated);
    SocketManager.on("driverAcceptOrder", handleDriverAcceptOrder);
    SocketManager.on("tipReceived", handleTipReceived);

    const unsubscribe = NetInfo.addEventListener((state) => {
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
      SocketManager.off("tipReceived", handleTipReceived);
      unsubscribe();
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
      debouncedProcessEventQueueRef.current.cancel();

      // Clear tracking refs
      lastStageCountRef.current = 0;
      lastUpdateTimeRef.current = 0;

      // 🔧 POST-RATING BLOCKING: Cleanup post-rating timeout
      if (postRatingBlockTimeoutRef.current) {
        clearTimeout(postRatingBlockTimeoutRef.current);
        postRatingBlockTimeoutRef.current = null;
      }
      postRatingBlockRef.current = false;
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

  // 🔧 POST-RATING BLOCKING: Block all driverStagesUpdated events for extended period after rating completion
  const blockDriverStagesUpdatesAfterRating = (duration: number = 120000) => { // Default 2 minutes
    console.log("🚫 POST-RATING: Blocking ALL driverStagesUpdated events for", duration, "ms");
    postRatingBlockRef.current = true;

    // 🔧 CRITICAL: Immediately clear all queued events to prevent processing
    console.log("🚫 POST-RATING: Clearing event queue immediately, had", eventQueueRef.current.length, "events");
    eventQueueRef.current = [];

    // Also reset processing state and cancel debounced processing
    isProcessingRef.current = false;
    debouncedProcessEventQueueRef.current.cancel();

    // 🔧 CRITICAL: Store blocking state in AsyncStorage for persistence across socket reconnections
    AsyncStorage.setItem("POST_RATING_BLOCK_ACTIVE", "true");
    AsyncStorage.setItem("POST_RATING_BLOCK_UNTIL", (Date.now() + duration).toString());

    if (postRatingBlockTimeoutRef.current) {
      clearTimeout(postRatingBlockTimeoutRef.current);
    }

    postRatingBlockTimeoutRef.current = setTimeout(() => {
      console.log("✅ POST-RATING: Unblocking driverStagesUpdated events");
      postRatingBlockRef.current = false;
      postRatingBlockTimeoutRef.current = null;

      // 🔧 CRITICAL: Clear persistent blocking state
      AsyncStorage.removeItem("POST_RATING_BLOCK_ACTIVE");
      AsyncStorage.removeItem("POST_RATING_BLOCK_UNTIL");
    }, duration);
  };

  const handleCompleteOrder = (orderId?: string) => {
    console.log("=== HANDLE COMPLETE ORDER:", orderId, "===");
    if (orderId) {
      // Add to completed orders set for tracking
      completedOrderIds.current.add(orderId);
      console.log("Added to completed orders:", orderId);
      console.log(
        "All completed orders:",
        Array.from(completedOrderIds.current)
      );

      // 🔧 CRITICAL FIX: Don't filter stages locally for multi-order scenarios
      // Let the socket updates handle the full state management
      // This prevents race conditions and empty stages issues

      // 🔧 CRITICAL FIX: Proper order mapping for multi-order scenarios
      // orderId is "1" or "2" from stage name like "delivery_complete_order_1"
      // orders array contains actual order objects with UUID IDs

      const orderIndex = parseInt(orderId) - 1; // order_1 = index 0, order_2 = index 1
      let actualCompletedOrderId = null;

      // Method 1: Try to find by stage details (most reliable)
      const completedOrderStages = stages.filter(stage =>
        stage.state.includes(`order_${orderId}`)
      );

      for (const stage of completedOrderStages) {
        if (stage.details?.customerDetails || stage.details?.restaurantDetails) {
          const customerId = stage.details?.customerDetails?.id;
          const restaurantId = stage.details?.restaurantDetails?.id;

          const foundOrder = orders.find(order =>
            (customerId && order.customer_id === customerId) ||
            (restaurantId && order.restaurant_id === restaurantId)
          );

          if (foundOrder) {
            actualCompletedOrderId = foundOrder.id;
            console.log("🎯 Found order by stage details:", { orderId, foundOrderId: foundOrder.id });
            break;
          }
        }
      }

      // Method 2: Fallback to array index mapping
      if (!actualCompletedOrderId && orderIndex >= 0 && orderIndex < orders.length) {
        actualCompletedOrderId = orders[orderIndex].id;
        console.log("🎯 Using index mapping:", { orderId, orderIndex, mappedOrderId: actualCompletedOrderId });
      }

      // Method 3: Last resort - if we have only one order left, it must be the one
      if (!actualCompletedOrderId && orders.length === 1) {
        actualCompletedOrderId = orders[0].id;
        console.log("🎯 Only one order left, using it:", actualCompletedOrderId);
      }

      const remainingOrders = actualCompletedOrderId
        ? orders.filter(order => order.id !== actualCompletedOrderId)
        : [];

      console.log("🔧 COMPLETE ORDER MAPPING:", {
        stageOrderId: orderId,
        orderIndex,
        actualCompletedOrderId,
        totalOrders: orders.length,
        remainingOrders: remainingOrders.length,
        allOrderIds: orders.map(o => o.id),
        remainingOrderIds: remainingOrders.map(o => o.id)
      });

      console.log("Original orders count:", orders.length);
      console.log("Remaining orders count:", remainingOrders.length);
      console.log("Completed orderId:", orderId);

      if (remainingOrders.length > 0) {
        // 🔧 CRITICAL FIX: For multi-order scenarios, filter completed order's stages
        // and immediately update Redux to prevent empty stages
        const remainingStages = stages.filter(
          (stage) => !stage.state.includes(`order_${orderId}`)
        );

        console.log("🔧 MULTI-ORDER: Filtering completed order stages");
        console.log("Original stages count:", stages.length);
        console.log("Remaining stages count:", remainingStages.length);
        console.log("Remaining orders:", remainingOrders.map(o => o.id));

        // 🔧 CRITICAL FIX: Reset all remaining order stages to pending status
        // and set current_state to first driver_ready stage
        const resetRemainingStages = remainingStages.map(stage => ({
          ...stage,
          status: "pending" as Stage["status"]
        }));

        // Find the first driver_ready stage for remaining orders
        const firstDriverReadyStage = resetRemainingStages.find(s =>
          s.state.startsWith("driver_ready_order_")
        );

        console.log("🔧 MULTI-ORDER RESET:", {
          originalRemaining: remainingStages.length,
          resetRemaining: resetRemainingStages.length,
          firstDriverReadyStage: firstDriverReadyStage?.state,
          allResetStages: resetRemainingStages.map(s => ({ state: s.state, status: s.status }))
        });

        // Immediately update Redux with reset stages
        dispatch(setDriverProgressStage({
          id,
          driver_id: driverId,
          stages: resetRemainingStages,
          orders: remainingOrders,
          // 🔧 CRITICAL: Set current_state to first driver_ready stage
          current_state: firstDriverReadyStage?.state || null,
          previous_state: null,
          next_state: null,
          estimated_time_remaining: null,
          actual_time_spent: null,
          total_distance_travelled: total_distance_travelled,
          total_earns: total_earns,
          total_tips: 0,
          events: [],
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
          transactions_processed: false,
          processed_tip_ids: []
        }));

        // 🔧 CRITICAL: Block socket updates for longer to prevent override
        blockSocketUpdatesTemporarily(10000); // Block for 10 seconds

        console.log("✅ MULTI-ORDER: Updated Redux with remaining stages and orders");
        console.log("Multiple orders: not setting isOrderCompleted to true");

        // Reset some flags but keep socket active for remaining orders
        lastResponseRef.current = undefined;
        isInitialUpdateRef.current = true;
        setIsWaitingForResponse(false);

        // 🔧 CRITICAL: Force trigger stage re-evaluation
        // This ensures the UI will update when socket data comes in
        lastUpdateTimeRef.current = Date.now();
        lastStageCountRef.current = -1;

        return;
      } else {
        // Single order or last order: clear everything
        console.log("Single/last order: clearing state");
        dispatch(clearDriverProgressStage());
        dispatch(fetchDailyAnalytics());
        // Fetch updated analytics after order completion
        dispatch(fetchDailyAnalytics());
      }
    } else {
      // Fallback: clear all if no orderId provided (for single-order case)
      console.log("No orderId provided, clearing all state");
      dispatch(clearDriverProgressStage());
      // Fetch updated analytics after order completion
      dispatch(fetchDailyAnalytics());
    }

    // Only set completed and clear tracking for single order or last order
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
    blockDriverStagesUpdatesAfterRating, // 🔧 POST-RATING BLOCKING: Export the function
  };
};
