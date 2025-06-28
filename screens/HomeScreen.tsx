import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, TouchableOpacity } from "react-native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFText from "@/src/components/FFText";
import FFSidebar from "@/src/components/FFSidebar";
import FFAvatar from "@/src/components/FFAvatar";
import FFBadge from "@/src/components/FFBadge";
import FFView from "@/src/components/FFView";
import FFSwipe from "@/src/components/FFSwipe";
import { useDispatch, useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import { loadTokenFromAsyncStorage } from "@/src/store/authSlice";
import { toggleAvailability } from "@/src/store/availabilitySlice";
import MapWrapper from "@/src/components/Maps/MapWrapper";
import AllStages from "@/src/components/screens/Home/AllStages";
import {
  filterPickupAndDropoffStages,
  openGoogleMaps,
  PickupAndDropoffStage,
} from "@/src/utils/functions/filters";
import FFModal from "@/src/components/FFModal";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome6 } from "@expo/vector-icons";
import {
  clearDriverProgressStage,
  loadDriverProgressStageFromAsyncStorage,
  updateStages,
  Stage,
} from "@/src/store/currentDriverProgressStageSlice";
import FloatingStage from "@/src/components/FloatingStage";
import FFSeperator from "@/src/components/FFSeperator";
import { useSocket } from "@/src/hooks/useSocket";
import { useLocationSocket } from "@/src/hooks/useLocationSocket";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { StackNavigationProp } from "@react-navigation/stack";
import { Avatar } from "@/src/types/common";
import debounce from "lodash/debounce";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { debugLogger } from "@/src/utils/debugLogger";
import DebugLogExporter from "@/src/components/DebugLogExporter";
import { colors, typography } from "@/src/theme";

type HomeRouteProp = RouteProp<SidebarStackParamList, "Home">;
type HomeSreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "Home"
>;

const STAGE_ORDER = [
  "driver_ready",
  "waiting_for_pickup",
  "restaurant_pickup",
  "en_route_to_customer",
  "delivery_complete",
];

const HomeScreen = () => {
  const navigation = useNavigation<HomeSreenNavigationProp>();
  const route = useRoute<HomeRouteProp>();
  const [isShowSidebar, setIsShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] =
    useState<PickupAndDropoffStage | null>(null);
  const [modalDetails, setModalDetails] = useState<{
    status: "SUCCESS" | "ERROR" | "HIDDEN" | "INFO" | "YESNO";
    title: string;
    desc: string;
  }>({ status: "HIDDEN", title: "", desc: "" });
  const [currentActiveLocation, setCurrentActiveLocation] =
    useState<PickupAndDropoffStage | null>(null);
  const [isResetSwipe, setIsResetSwipe] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isUpdatingRef = useRef(false);
  const isCompletingOrderRef = useRef(false);
  const completedOrderIds = useRef<Set<string>>(new Set());
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const [swipeTextCurrentStage, setSwipeTextCurrentStage] =
    useState(`I'm ready`);
  const pendingStageRef = useRef<Stage | null>(null);
  const hasFinishedProgressRef = useRef(false);
  const lastProcessedStageRef = useRef<string | null>(null);
  const manuallyProgressedOrdersRef = useRef<Set<string>>(new Set());

  // Simple duplicate detection - just track stage count
  const lastStageCountProcessedRef = useRef<number>(0);
  const lastStageSnapshotRef = useRef<string>('');

  const dispatch = useDispatch();
  const { available_for_work, avatar, accessToken, userId } = useSelector(
    (state: RootState) => state.auth
  );
  const { stages, orders, id, transactions_processed } = useSelector(
    (state: RootState) => state.currentDriverProgressStage
  );



  const {
    isWaitingForResponse,
    emitUpdateDriverProgress,
    handleCompleteOrder,
    isSocketConnected,
    blockSocketUpdatesTemporarily,
  } = useSocket(
    userId || "",
    () => {},
    () => {},
    () => {}
  );

  // 📍 Location tracking socket
  const {
    isLocationSocketConnected,
    hasLocationPermission,
    currentLocation,
    hasActiveOrders,
  } = useLocationSocket(userId || "");

  // Debug log location socket status
  useEffect(() => {
    console.log("🔄 Location Socket Status:", {
      isLocationSocketConnected,
      hasLocationPermission,
      hasActiveOrders,
      currentLocation: currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : null,
      stagesLength: stages.length
    });
  }, [isLocationSocketConnected, hasLocationPermission, hasActiveOrders, currentLocation, stages.length]);

  useEffect(() => {
    const loadToken = async () => {
      await dispatch(loadTokenFromAsyncStorage());
      await dispatch(loadDriverProgressStageFromAsyncStorage());
      setLoading(false);
    };
    loadToken();
  }, [dispatch]);

  const getOrderCount = useCallback(() => {
    return orders.length || Math.ceil(stages.length / 5);
  }, [stages, orders]);
console.log('chsk stages', stages.length)
  const updateSwipeText = useCallback((stage: Stage | null) => {
    console.log("Updating swipe text for stage:", stage?.state);
    if (!stage) {
      setSwipeTextCurrentStage("");
      return;
    }
    const stageBase = stage.state.split("_order_")[0];
    switch (stageBase) {
      case "driver_ready":
        setSwipeTextCurrentStage("I'm ready");
        break;
      case "waiting_for_pickup":
        setSwipeTextCurrentStage("I've arrived restaurant");
        break;
      case "restaurant_pickup":
        setSwipeTextCurrentStage("I've picked up order");
        break;
      case "en_route_to_customer":
        setSwipeTextCurrentStage("I've arrived destination");
        setSelectedDestination(null);
        setCurrentActiveLocation(null);
        break;
      case "delivery_complete":
        setSwipeTextCurrentStage("Confirm delivery");
        break;
      default:
        setSwipeTextCurrentStage("");
    }
  }, []);

  useEffect(() => {
    // SKIP if we're completing an order to prevent swipe text override
    if (isCompletingOrderRef.current) {
      console.log("SKIPPING swipe text update - order completion in progress");
      return;
    }

    console.log("🔄 SWIPE TEXT UPDATE useEffect triggered:", {
      currentStageState: currentStage?.state,
      currentStageStatus: currentStage?.status,
      currentSwipeText: swipeTextCurrentStage,
    });

    console.log("Current stage changed:", currentStage?.state);

    // FORCE UPDATE swipe text immediately based on currentStage
    if (currentStage) {
      let newSwipeText = "";
      if (currentStage.state.startsWith("driver_ready")) {
        newSwipeText = "I'm ready";
      } else if (currentStage.state.startsWith("waiting_for_pickup")) {
        newSwipeText = "I've arrived restaurant";
      } else if (currentStage.state.startsWith("restaurant_pickup")) {
        newSwipeText = "I've picked up the order";
      } else if (currentStage.state.startsWith("en_route_to_customer")) {
        newSwipeText = "I've arrived customer";
      } else if (currentStage.state.startsWith("delivery_complete")) {
        newSwipeText = "Confirm delivery";
      }

      if (newSwipeText && newSwipeText !== swipeTextCurrentStage) {
        console.log("=== FORCE UPDATING SWIPE TEXT ===", {
          from: swipeTextCurrentStage,
          to: newSwipeText,
          stage: currentStage.state,
        });
        setSwipeTextCurrentStage(newSwipeText);
      }
    }

    updateSwipeText(currentStage);
    if (
      currentStage?.state.startsWith("delivery_complete") &&
      currentStage?.status === "pending"
    ) {
      setModalDetails({
        status: "YESNO",
        title: "Confirm Delivery",
        desc: "Have you delivered the order to the customer?",
      });
    }
  }, [currentStage, updateSwipeText, swipeTextCurrentStage]);

  const debouncedSetCurrentStage = useCallback(
    debounce((stage: Stage | null) => {
      console.log("Debounced updating currentStage to:", stage?.state);
      setCurrentStage(stage);
      setIsResetSwipe(true);
      setTimeout(() => setIsResetSwipe(false), 100);
    }, 300),
    []
  );

  useEffect(() => {
    // SKIP useEffect if we're completing an order to prevent override
    if (isCompletingOrderRef.current) {
      console.log("SKIPPING useEffect - order completion in progress");
      return;
    }

    // EMERGENCY BRAKE: If stages count is over 30, something is seriously wrong
    if (stages.length > 30) {
      console.log("EMERGENCY: Too many stages detected, clearing state:", stages.length);
      dispatch(clearDriverProgressStage());
      return;
    }

    // Improved duplicate detection: Check for actual changes in stage data
    const currentStageSnapshot = stages.map(s => `${s.state}_${s.status}_${s.timestamp}`).join('|');
    
    console.log("🔍 STAGE CHANGE DETECTION:", {
      stagesLength: stages.length,
      currentSnapshot: currentStageSnapshot,
      lastSnapshot: lastStageSnapshotRef.current,
      isIdentical: currentStageSnapshot === lastStageSnapshotRef.current,
      stagesDetails: stages.map(s => ({ state: s.state, status: s.status, timestamp: s.timestamp }))
    });
    
    if (currentStageSnapshot === lastStageSnapshotRef.current && stages.length > 0) {
      console.log("SKIPPING useEffect - no actual stage changes detected");
      return;
    }

    // Update our tracking
    lastStageCountProcessedRef.current = stages.length;
    lastStageSnapshotRef.current = currentStageSnapshot;

    // 🔧 CRITICAL FIX: Check for delivery_complete stages that are in_progress
    // These indicate final order completion and should NOT be skipped
    const hasDeliveryCompleteInProgress = stages.some(stage => 
      stage.state.startsWith("delivery_complete_") && stage.status === "in_progress"
    );

    if (hasDeliveryCompleteInProgress) {
      console.log("🎯 FOUND delivery_complete in_progress - proceeding to handle final order");
    } else {
      // SKIP if stages contain completed orders that should be filtered
      // BUT ONLY if there are NO active stages for remaining orders
      if (completedOrderIds.current && completedOrderIds.current.size > 0) {
        const activeStages = stages.filter((stage) => {
          const orderId = stage.state.split("_order_")[1];
          return !completedOrderIds.current.has(orderId);
        });

        const hasInProgressOrPendingActiveStages = activeStages.some(
          (stage) => stage.status === "in_progress" || stage.status === "pending"
        );

        if (!hasInProgressOrPendingActiveStages) {
          console.log(
            "SKIPPING useEffect - no active stages for remaining orders:",
            Array.from(completedOrderIds.current)
          );
          return;
        } else {
          console.log(
            "PROCEEDING with useEffect - found active stages:",
            activeStages.map(s => ({ state: s.state, status: s.status }))
          );
        }
      }
    }

    if (stages.length === 0 || !stages || stages.length < 1) {
      setCurrentStage(null);
      setSwipeTextCurrentStage("I'm ready");
      return;
    }

    console.log("Stages updated:", stages);
    debugLogger.info("HomeScreen", "STAGES_UPDATED", {
      stagesCount: stages.length,
      stages: stages.map((s) => ({ state: s.state, status: s.status })),
      transactions_processed,
      currentSwipeText: swipeTextCurrentStage,
    });

    // Filter out completed order stages first, then deduplicate
    const activeOrderStages = stages.filter((stage) => {
      const orderId = stage.state.split("_order_")[1];
      return !completedOrderIds.current.has(orderId);
    });

    console.log("🔧 ACTIVE ORDER FILTERING:", {
      totalStages: stages.length,
      activeOrderStages: activeOrderStages.length,
      completedOrderIds: Array.from(completedOrderIds.current),
      activeStageDetails: activeOrderStages.map(s => ({ state: s.state, status: s.status }))
    });

    const uniqueStages = Object.values(
      activeOrderStages.reduce((acc: { [key: string]: Stage }, stage: Stage) => {
        const key = `${stage.state}_${stage.status}`;
        if (!acc[key] || stage.timestamp > acc[key].timestamp) {
          acc[key] = stage;
        }
        return acc;
      }, {})
    ).sort((a: Stage, b: Stage) => {
      const aBase = a.state.split("_order_")[0];
      const bBase = b.state.split("_order_")[0];
      const aOrder = parseInt(a.state.split("_order_")[1] || "1");
      const bOrder = parseInt(b.state.split("_order_")[1] || "1");
      const stageOrder =
        STAGE_ORDER.indexOf(aBase) - STAGE_ORDER.indexOf(bBase);
      return stageOrder !== 0 ? stageOrder : aOrder - bOrder;
    });

    console.log("Unique stages:", uniqueStages);

    // 🔧 CRITICAL FIX: Enhanced delivery complete detection
    // Check for ANY delivery_complete stage that is completed (final order completion)
    const anyDeliveryCompleteStage = uniqueStages.find(
      (s) =>
        s.state.startsWith("delivery_complete_order_") &&
        s.status === "completed"
    );

    if (
      anyDeliveryCompleteStage &&
      lastProcessedStageRef.current !== anyDeliveryCompleteStage.state
    ) {
      const completedOrderId = anyDeliveryCompleteStage.state.split("_order_")[1];
      console.log("🎯 DETECTED delivery_complete completion for order:", completedOrderId);
      
      lastProcessedStageRef.current = anyDeliveryCompleteStage.state;
      setCurrentActiveLocation(null);
      handleFinishProgress();
      return;
    }

    let activeStage: Stage | null = null;
    const inProgressStage = uniqueStages
      .filter((s: Stage) => s.status === "in_progress")
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (inProgressStage) {
      activeStage = inProgressStage;
    } else {
      // Find the first pending stage across all orders
      // Priority: earlier stage types first, then lower order numbers
      for (const stageState of STAGE_ORDER) {
        const candidateStages = uniqueStages
          .filter(
            (s: Stage) => s.state.startsWith(stageState) && s.status === "pending"
          )
          .sort((a, b) => {
            const aOrder = parseInt(a.state.split("_order_")[1] || "1");
            const bOrder = parseInt(b.state.split("_order_")[1] || "1");
            return aOrder - bOrder;
          });
        
        if (candidateStages.length > 0) {
          activeStage = candidateStages[0];
          break;
        }
      }
    }

    console.log("🎯 Active stage determined:", {
      activeStage: activeStage?.state,
      status: activeStage?.status,
      inProgressStages: uniqueStages.filter((s: Stage) => s.status === "in_progress").map((s: Stage) => s.state),
      pendingStages: uniqueStages.filter((s: Stage) => s.status === "pending").map((s: Stage) => s.state),
      completedStages: uniqueStages.filter((s: Stage) => s.status === "completed").map((s: Stage) => s.state),
      totalStages: uniqueStages.length,
      currentStage: currentStage?.state,
      willUpdate: activeStage && (!currentStage || 
        currentStage.state !== activeStage.state || 
        currentStage.status !== activeStage.status),
    });

    if (
      activeStage &&
      (!currentStage ||
        currentStage.state !== activeStage.state ||
        currentStage.status !== activeStage.status ||
        currentStage.timestamp !== activeStage.timestamp)
    ) {
      console.log("Updating currentStage to:", activeStage);
      debouncedSetCurrentStage(activeStage);
    } else if (!activeStage && currentStage) {
      // No active stage found but currentStage exists - clear it
      console.log("No active stage found, clearing currentStage");
      debouncedSetCurrentStage(null);
    }
  }, [stages, transactions_processed, debouncedSetCurrentStage, currentStage]);

  const handleUpdateProgress = useCallback(async () => {
    console.log("🚀 handleUpdateProgress called", {
      isWaitingForResponse,
      isUpdating: isUpdatingRef.current,
      isProcessing,
      currentStage: currentStage?.state,
      currentStageStatus: currentStage?.status,
      transactions_processed,
      isSocketConnected,
      swipeText: swipeTextCurrentStage,
      stagesCount: stages.length,
      allStages: stages.map(s => ({ state: s.state, status: s.status })),
      orderCount: getOrderCount()
    });

    if (
      isWaitingForResponse ||
      isUpdatingRef.current ||
      isProcessing ||
      transactions_processed ||
      !currentStage ||
      currentStage.status === "completed"
    ) {
      console.log("Swipe blocked", {
        isWaitingForResponse,
        isUpdating: isUpdatingRef.current,
        isProcessing,
        transactions_processed,
        currentStageStatus: currentStage?.status,
      });
      return;
    }

    // 🔧 CRITICAL FIX: Handle multiple order scenario
    // For 2nd+ orders, manually progress first swipe since server data is inconsistent
    const orderCount = getOrderCount();
    const currentOrderId = currentStage.state.split("_order_")[1];
    const isMultipleOrders = orderCount > 1;
    const isSecondOrLaterOrder = parseInt(currentOrderId) > 1;
    const isFirstStageOfOrder = currentStage.state.startsWith("driver_ready");
    const hasBeenManuallyProgressed = manuallyProgressedOrdersRef.current.has(currentOrderId);

    console.log("🔧 MULTIPLE ORDER CHECK:", {
      orderCount,
      currentOrderId,
      isMultipleOrders,
      isSecondOrLaterOrder,
      isFirstStageOfOrder,
      hasBeenManuallyProgressed,
      currentStage: currentStage.state,
      swipeText: swipeTextCurrentStage
    });

    if (isMultipleOrders && isSecondOrLaterOrder && isFirstStageOfOrder && !manuallyProgressedOrdersRef.current.has(currentOrderId)) {
      console.log("🔧 MANUAL PROGRESSION: Multiple order detected, manually progressing first swipe", {
        orderCount,
        currentOrderId,
        currentStage: currentStage.state,
        swipeText: swipeTextCurrentStage
      });

      // Mark this order as manually progressed
      manuallyProgressedOrdersRef.current.add(currentOrderId);

      // Manually progress the swipe text for subsequent orders
      setIsResetSwipe(true);
      setTimeout(() => setIsResetSwipe(false), 100);
      
      // Update swipe text to next stage
      setSwipeTextCurrentStage("I've arrived restaurant");
      
      // Update current stage status to simulate progression 
      // AND update the stages in Redux to ensure consistency
      const updatedStage = { ...currentStage, status: "in_progress" as Stage["status"] };
      setCurrentStage(updatedStage);
      
      // Update the stages array to reflect the manual progression
      const updatedStages = stages.map(stage => 
        stage.state === currentStage.state ? updatedStage : stage
      );
      dispatch(updateStages(updatedStages));

      console.log("🔧 MANUAL PROGRESSION: Updated swipe text and stage", {
        newSwipeText: "I've arrived restaurant",
        newStageStatus: "in_progress",
        markedOrderId: currentOrderId
      });

      // Still emit to server but don't wait for response
      if (emitUpdateDriverProgress && id) {
        emitUpdateDriverProgress({ stageId: id }).catch(error => {
          console.error("Background server update failed:", error);
        });
      }
      
      return;
    }

    if (currentStage.state.startsWith("en_route_to_customer")) {
      setModalDetails({
        status: "YESNO",
        title: "Confirm Delivery",
        desc: "Have you delivered the order to the customer?",
      });
      return;
    }

    if (!emitUpdateDriverProgress || !id) {
      console.error("emitUpdateDriverProgress or id is missing");
      setModalDetails({
        status: "ERROR",
        title: "Error",
        desc: "Missing driver progress data. Please try again.",
      });
      return;
    }

    try {
      isUpdatingRef.current = true;
      setIsProcessing(true);
      console.log("🚀 Starting updateDriverProgress with stageId:", id);
      const response = await emitUpdateDriverProgress({ stageId: id });
      console.log("🚀 updateDriverProgress response:", response);
      if (
        response?.success === false &&
        response?.message === "Duplicate event"
      ) {
        console.warn("🚀 Duplicate event detected, skipping stage update");
        return;
      }
      
      console.log("🚀 Server response success, resetting swipe");
      setIsResetSwipe(true);
      setTimeout(() => setIsResetSwipe(false), 100);

      // Let server updates handle progression for normal cases
      // Manual progression logic above handles multiple order scenarios
    } catch (error) {
      console.error("Error updating progress:", error);
      setModalDetails({
        status: "ERROR",
        title: "Connection Issue",
        desc: isSocketConnected
          ? "Failed to update progress. Please try again."
          : "Network issue detected. Your action has been queued and will be processed when the connection is restored.",
      });
    } finally {
      console.log("Resetting isProcessing and isUpdatingRef");
      isUpdatingRef.current = false;
      setIsProcessing(false);
    }
  }, [
    id,
    emitUpdateDriverProgress,
    isWaitingForResponse,
    isProcessing,
    currentStage,
    transactions_processed,
    isSocketConnected,
  ]);

  const handleConfirmDelivery = async () => {
    await debugLogger.info("HomeScreen", "handleConfirmDelivery_START", {
      currentStage: currentStage?.state,
      currentStageStatus: currentStage?.status,
      stagesCount: stages.length,
      swipeText: swipeTextCurrentStage,
      allStages: stages.map(s => ({ state: s.state, status: s.status })),
      allOrders: orders.map(o => ({ id: o.id, status: o.status }))
    });

    if (!currentStage) return;

    const currentOrderId = currentStage.state.split("_order_").pop();
    if (!currentOrderId) return;

    console.log("🎯 CONFIRMING DELIVERY FOR ORDER:", currentOrderId);
    console.log("🎯 Current stage details:", {
      state: currentStage.state,
      status: currentStage.status,
      isDeliveryComplete: currentStage.state.startsWith("delivery_complete_")
    });
    
    await debugLogger.info("HomeScreen", "handleConfirmDelivery_ORDER_ID", {
      currentOrderId,
      currentStageState: currentStage.state,
      currentStageStatus: currentStage.status
    });

    const remainingStages = stages.filter(
      (stage) => !stage.state.includes(`order_${currentOrderId}`)
    );

    const orderCount = getOrderCount();
    const remainingOrderCount = Math.floor(remainingStages.length / 5);

    console.log("🎯 DELIVERY CONFIRMATION ANALYSIS:");
    console.log("Current order being confirmed:", currentOrderId);
    console.log("Total order count:", orderCount);
    console.log("Remaining stages count:", remainingStages.length);
    console.log("Remaining order count:", remainingOrderCount);
    console.log("All stages:", stages.map(s => ({ state: s.state, status: s.status })));
    console.log("Remaining stages:", remainingStages.map(s => ({ state: s.state, status: s.status })));

    // 🔧 CRITICAL FIX: Better final order detection
    // Check if this is actually the final order by checking if ALL delivery_complete stages will be completed
    const allDeliveryCompleteStages = stages.filter(stage => 
      stage.state.startsWith("delivery_complete_order_")
    );
    
    const completedDeliveryStages = allDeliveryCompleteStages.filter(stage => 
      stage.status === "completed" || stage.state.includes(`order_${currentOrderId}`)
    );
    
    const isFinalOrder = completedDeliveryStages.length === allDeliveryCompleteStages.length;
    
    console.log("🎯 FINAL ORDER DETECTION:");
    console.log("All delivery_complete stages:", allDeliveryCompleteStages.map(s => ({ state: s.state, status: s.status })));
    console.log("Completed delivery stages (including current):", completedDeliveryStages.map(s => ({ state: s.state, status: s.status })));
    console.log("Is final order?", isFinalOrder);

    if (orderCount > 1 && remainingOrderCount > 0 && !isFinalOrder) {
      console.log("🔄 MULTIPLE ORDERS: PROCESSING NEXT ORDER");

      try {
        // FIRST: Block useEffect and socket updates to prevent override
        console.log("=== BLOCKING USEEFFECT AND SOCKET UPDATES ===");
        isCompletingOrderRef.current = true;

        // Add to completed orders to prevent restore
        completedOrderIds.current.add(currentOrderId);
        console.log("=== ADDED TO COMPLETED ORDERS ===", currentOrderId);

        await debugLogger.info("HomeScreen", "BLOCKING_SOCKET_UPDATES", {
          duration: 5000,
        });
        blockSocketUpdatesTemporarily(30000); // Block for 30 seconds

        // SECOND: Update UI immediately - don't wait for server
        console.log("=== UPDATING UI IMMEDIATELY FOR BETTER UX ===");
        await debugLogger.info("HomeScreen", "UPDATING_UI_IMMEDIATELY", {});

        // Filter stages immediately for UI update
        const filteredStages = stages.filter(
          (stage) => !stage.state.includes(`order_${currentOrderId}`)
        );

        console.log("Original stages:", stages.length);
        console.log("Filtered stages:", filteredStages.length);
        console.log("Removed order:", currentOrderId);

        // 🔧 CRITICAL FIX: Reset remaining order stages to proper state
        // When order 1 is completed, order 2 should start fresh from driver_ready
        const resetFilteredStages = filteredStages.map((stage): Stage => {
          const stageBase = stage.state.split("_order_")[0];
          const orderId = stage.state.split("_order_")[1];
          
          // Reset all stages of remaining order to pending except the first one
          return { 
            ...stage, 
            status: "pending" as Stage["status"]
          };
        });

        console.log("🔧 RESET STAGES for next order:", {
          beforeReset: filteredStages.map(s => ({ state: s.state, status: s.status })),
          afterReset: resetFilteredStages.map(s => ({ state: s.state, status: s.status }))
        });

        await debugLogger.info("HomeScreen", "STAGES_FILTERING", {
          originalCount: stages.length,
          filteredCount: filteredStages.length,
          resetStagesCount: resetFilteredStages.length,
          removedOrderId: currentOrderId,
          originalStages: stages.map((s) => ({
            state: s.state,
            status: s.status,
          })),
          filteredStages: filteredStages.map((s) => ({
            state: s.state,
            status: s.status,
          })),
          resetStages: resetFilteredStages.map((s) => ({
            state: s.state,
            status: s.status,
          })),
        });

        // Update Redux state immediately with reset stages
        dispatch(updateStages(resetFilteredStages));
        await debugLogger.info("HomeScreen", "REDUX_STAGES_UPDATED", {
          newStagesCount: resetFilteredStages.length,
        });

        // Calculate remaining orders
        const remainingOrders = orders.filter(
          (order) => order.id !== `FF_ORDER_${currentOrderId}`
        );

        // FORCE CLEAR AsyncStorage to prevent restore
        await AsyncStorage.setItem(
          "currentDriverProgressStage",
          JSON.stringify({
            stages: resetFilteredStages,
            orders: remainingOrders,
            id: id,
            driver_id: userId,
            transactions_processed: false,
            // Preserve other fields but with reset stages
          })
        );
        console.log("=== FORCE UPDATED ASYNCSTORAGE ===");

        // Update local state immediately
        handleCompleteOrder(currentOrderId);

        // Reset UI immediately and force
        setCurrentActiveLocation(null);
        setSelectedDestination(null);
        setCurrentStage(null);

        // Force reset swipe text immediately
        console.log("=== FORCE RESETTING SWIPE TEXT ===");
        await debugLogger.info("HomeScreen", "FORCE_RESET_SWIPE_TEXT_1", {
          beforeText: swipeTextCurrentStage,
          afterText: "I'm ready",
        });
        setSwipeTextCurrentStage("I'm ready");

        setModalDetails({ status: "HIDDEN", desc: "", title: "" });
        setIsResetSwipe(true);
        setTimeout(() => setIsResetSwipe(false), 100);

        // Force trigger swipe text update after a short delay
        setTimeout(async () => {
          console.log("=== DOUBLE CHECKING SWIPE TEXT RESET ===");
          await debugLogger.info("HomeScreen", "FORCE_RESET_SWIPE_TEXT_2", {
            currentText: swipeTextCurrentStage,
            settingTo: "I'm ready",
          });
          setSwipeTextCurrentStage("I'm ready");
          setIsResetSwipe(true);
          setTimeout(() => setIsResetSwipe(false), 50);
        }, 200);

        // Reset flags and force snapshot update
        hasFinishedProgressRef.current = false;
        lastProcessedStageRef.current = null;
        setIsProcessing(false);

        // 🔧 CRITICAL: Force reset stage snapshot to ensure change detection works
        lastStageSnapshotRef.current = '';
        lastStageCountProcessedRef.current = 0;

        // Clear manually progressed orders for fresh start
        manuallyProgressedOrdersRef.current.clear();

        console.log("=== UI UPDATED IMMEDIATELY ===");

        // Unblock useEffect after UI is updated and force currentStage update
        setTimeout(() => {
          console.log("=== UNBLOCKING USEEFFECT ===");
          isCompletingOrderRef.current = false;

          // Force update currentStage to first pending stage of remaining order
          const firstPendingStage = resetFilteredStages
            .filter((s) => s.status === "pending")
            .sort((a, b) => {
              const aOrder = parseInt(a.state.split("_order_")[1] || "1");
              const bOrder = parseInt(b.state.split("_order_")[1] || "1");
              const aBase = a.state.split("_order_")[0];
              const bBase = b.state.split("_order_")[0];
              const stageOrder =
                STAGE_ORDER.indexOf(aBase) - STAGE_ORDER.indexOf(bBase);
              return stageOrder !== 0 ? stageOrder : aOrder - bOrder;
            })[0];

          if (firstPendingStage) {
            console.log(
              "=== FORCE SETTING CURRENT STAGE ===",
              firstPendingStage.state
            );
            setCurrentStage(firstPendingStage);

            // Force update swipe text based on stage
            let newSwipeText = "";
            if (firstPendingStage.state.startsWith("driver_ready")) {
              newSwipeText = "I'm ready";
            } else if (
              firstPendingStage.state.startsWith("waiting_for_pickup")
            ) {
              newSwipeText = "I've arrived restaurant";
            } else if (
              firstPendingStage.state.startsWith("restaurant_pickup")
            ) {
              newSwipeText = "I've picked up the order";
            } else if (
              firstPendingStage.state.startsWith("en_route_to_customer")
            ) {
              newSwipeText = "I've arrived customer";
            } else if (
              firstPendingStage.state.startsWith("delivery_complete")
            ) {
              newSwipeText = "Confirm delivery";
            }

            console.log("=== FORCE UPDATING SWIPE TEXT ===", {
              from: swipeTextCurrentStage,
              to: newSwipeText,
              stage: firstPendingStage.state
            });
            setSwipeTextCurrentStage(newSwipeText);

            // Force reset the swipe component
            setIsResetSwipe(true);
            setTimeout(() => setIsResetSwipe(false), 100);
          }

          // 🔧 CRITICAL: Force trigger stage re-evaluation to ensure useEffect runs
          console.log("=== FORCE TRIGGER STAGE RE-EVALUATION ===");
          lastStageSnapshotRef.current = '';
          
        }, 1000); // Unblock after 1 second

        // SECOND: Emit to server in background (don't await)
        if (emitUpdateDriverProgress && id) {
          console.log(
            "Emitting updateDriverProgress for order completion, stageId:",
            id
          );
          emitUpdateDriverProgress({ stageId: id })
            .then((response) => {
              console.log("updateDriverProgress response:", response);
              if (
                response?.success === false &&
                response?.message === "Duplicate event"
              ) {
                console.warn("Duplicate event detected");
              }
            })
            .catch((error) => {
              console.error("Error emitting updateDriverProgress:", error);
            });
        }

        console.log("=== ORDER COMPLETION FLOW COMPLETED ===");
        return;
      } catch (error) {
        console.error("Error completing order:", error);
        setModalDetails({
          status: "ERROR",
          title: "Error",
          desc: "Failed to complete order. Please try again.",
        });
        setIsProcessing(false);
        return;
      }
    }

    console.log("🎯 FINAL ORDER: PROCEEDING TO RATING (from handleConfirmDelivery)");
    // Final order case - proceed with rating flow
    handleFinishProgress();
  };

  const handleFinishProgress = async () => {
    if (hasFinishedProgressRef.current) {
      console.log("handleFinishProgress already executed, skipping");
      return;
    }

    try {
      hasFinishedProgressRef.current = true;
      setIsProcessing(true);

      if (emitUpdateDriverProgress && id) {
        console.log("Emitting final updateDriverProgress with stageId:", id);
        const response = await emitUpdateDriverProgress({ stageId: id });
        console.log("updateDriverProgress response:", response);
        if (
          response?.success === false &&
          response?.message === "Duplicate event"
        ) {
          console.warn("Duplicate event detected, proceeding with UI update");
        }
      }

      const orderCount = getOrderCount();
      console.log("Order count:", orderCount);

      const currentOrderId = currentStage?.state.split("_order_").pop();
      if (!currentOrderId) {
        console.error("No currentOrderId found");
        setModalDetails({
          status: "ERROR",
          title: "Error",
          desc: "Invalid order ID. Please try again.",
        });
        setIsProcessing(false);
        hasFinishedProgressRef.current = false;
        return;
      }

      const remainingStages = stages.filter(
        (stage) => !stage.state.includes(`order_${currentOrderId}`)
      );
      console.log("Remaining stages:", remainingStages);

      // 🔧 CRITICAL FIX: Better logic to detect if this is the final order
      const allOrderIds = new Set<string>();
      stages.forEach(stage => {
        const orderId = stage.state.split("_order_")[1];
        if (orderId) allOrderIds.add(orderId);
      });
      
      const totalOrdersInDPS = allOrderIds.size;
      const currentOrderNumber = parseInt(currentOrderId);
      const isLastOrder = currentOrderNumber === totalOrdersInDPS;
      const remainingOrderCount = Math.floor(remainingStages.length / 5);
      
      console.log("🎯 Final order detection:", {
        currentOrderId,
        currentOrderNumber,
        totalOrdersInDPS,
        isLastOrder,
        remainingOrderCount,
        allOrderIds: Array.from(allOrderIds),
        shouldNavigateToRating: isLastOrder || remainingOrderCount === 0
      });

      if (!isLastOrder && remainingOrderCount > 0) {
        console.log("🔄 Multiple orders detected, resetting UI for next order");

        // Call handleCompleteOrder first to update the state properly
        console.log("Calling handleCompleteOrder for orderId:", currentOrderId);
        handleCompleteOrder(currentOrderId);

        // Reset UI state for next order
        setCurrentActiveLocation(null);
        setSelectedDestination(null);
        setCurrentStage(null);
        setSwipeTextCurrentStage("I'm ready");
        setModalDetails({ status: "HIDDEN", desc: "", title: "" });
        setIsResetSwipe(true);
        setTimeout(() => setIsResetSwipe(false), 100);

        // Reset processing flags
        hasFinishedProgressRef.current = false;
        lastProcessedStageRef.current = null;
        setIsProcessing(false);

        // Force update to next order's first stage after a short delay
        setTimeout(() => {
          console.log("Forcing update to next order's first stage");
          // This will trigger the useEffect to find the next active stage
          setCurrentStage(null);
        }, 200);

        console.log("UI reset completed for next order");
        return;
      }

      console.log("🎯 FINAL ORDER: Proceeding to Rating screen");

      // 🔧 CRITICAL: Find the current order being completed, not just orders[0]
      const currentCompletedOrder = orders.find(order => 
        order.id.includes(currentOrderId)
      );

      if (!currentCompletedOrder) {
        console.error("❌ No completed order found for currentOrderId:", currentOrderId);
        console.log("Available orders:", orders.map(o => ({ id: o.id, status: o.status })));
        setIsProcessing(false);
        hasFinishedProgressRef.current = false;
        return;
      }

      console.log("✅ Found completed order:", {
        orderId: currentCompletedOrder.id,
        customerId: currentCompletedOrder.customer_id,
        restaurantId: currentCompletedOrder.restaurant_id
      });

      // Build rating data from the completed order (not from filtered stages)
      // Note: The order might have expanded customer/restaurant data from server
      const orderWithDetails = currentCompletedOrder as any; // Type assertion for server data
      
      const buildDataCustomer1 = {
        id: `${currentCompletedOrder.customer_id}_dropoff`,
        avatar: orderWithDetails.customer?.avatar || { key: "", url: "" }
      };
      
      const buildDataRestaurant1 = {
        id: `${currentCompletedOrder.restaurant_id}_pickup`, 
        avatar: orderWithDetails.restaurant?.avatar || { key: "", url: "" }
      };

      await AsyncStorage.removeItem("currentDriverProgressStage");
      dispatch(clearDriverProgressStage());
      setCurrentActiveLocation(null);
      setSelectedDestination(null);
      setCurrentStage(null);
      setSwipeTextCurrentStage("");
      setModalDetails({ status: "HIDDEN", desc: "", title: "" });
      setIsResetSwipe(true);
      setTimeout(() => setIsResetSwipe(false), 100);
      handleCompleteOrder(currentOrderId);

      navigation.navigate("Rating", {
        customer1: buildDataCustomer1,
        orderId: currentCompletedOrder.id,
        restaurant1: buildDataRestaurant1,
      });
    } catch (error) {
      console.error("Error finishing progress:", error);
      setModalDetails({
        status: "ERROR",
        title: "Error",
        desc: "Failed to complete order. Please try again.",
      });
    } finally {
      setIsProcessing(false);
      hasFinishedProgressRef.current = false;
    }
  };

  const handleNavigateGoogleMap = async (
    location: { lat: number; lng: number } | undefined
  ) => {
    if (location && location.lat && location.lng) {
      console.log("Opening Google Maps with location:", location);
      openGoogleMaps(location);
    } else {
      console.error("Invalid location data for navigation:", location);
      setModalDetails({
        status: "ERROR",
        title: "Navigation Error",
        desc: "Could not open map with the provided location. Location data is missing or invalid.",
      });
    }
  };

  const handleGoNow = async () => {
    setCurrentActiveLocation(selectedDestination);
  };

  useEffect(() => {
    if (!isWaitingForResponse && isProcessing) {
      console.log("Resetting isProcessing after driverStagesUpdated");
      setIsProcessing(false);
      isUpdatingRef.current = false;
    }
  }, [isWaitingForResponse, isProcessing]);

  // Clear selectedDestination when stages change or current stage progresses
  useEffect(() => {
    if (currentStage?.status === "in_progress" && selectedDestination) {
      console.log("Stage progressed, clearing selected destination for route");
      setSelectedDestination(null);
    }
  }, [currentStage?.status, selectedDestination]);

  // Log selected destination changes for debugging route issues
  useEffect(() => {
    if (selectedDestination) {
      console.log("Selected destination updated:", {
        id: selectedDestination.id,
        name: selectedDestination.name,
        type: selectedDestination.type,
        location: selectedDestination.location
      });
    }
  }, [selectedDestination]);

  // Force reset swipe text when stages change after order completion
  useEffect(() => {
    const orderCount = getOrderCount();
    if (orderCount > 0 && stages.length > 0) {
      // Check if we just completed an order (stages reduced)
      const currentStageCount = stages.length;
      const expectedStagesForOrders = orderCount * 5;

      if (currentStageCount === expectedStagesForOrders) {
        // Stages match expected count, check if we need to reset to first stage
        const firstPendingStage = stages
          .filter((s) => s.status === "pending")
          .sort((a, b) => {
            const aOrder = parseInt(a.state.split("_order_")[1] || "1");
            const bOrder = parseInt(b.state.split("_order_")[1] || "1");
            const aBase = a.state.split("_order_")[0];
            const bBase = b.state.split("_order_")[0];
            const stageOrder =
              STAGE_ORDER.indexOf(aBase) - STAGE_ORDER.indexOf(bBase);
            return stageOrder !== 0 ? stageOrder : aOrder - bOrder;
          })[0];

        if (
          firstPendingStage &&
          firstPendingStage.state.startsWith("driver_ready")
        ) {
          console.log("Detected order completion, resetting to first stage");
          setSwipeTextCurrentStage("I'm ready");
          setIsResetSwipe(true);
          setTimeout(() => setIsResetSwipe(false), 100);
        }
      }
    }
  }, [stages.length, getOrderCount]);

  console.log("check stagé", stages.length);

  // Emergency reset function to clear all duplicated data
  const handleEmergencyReset = () => {
    console.log("🚨 EMERGENCY RESET: Clearing all driver progress stage data");
    dispatch(clearDriverProgressStage());
    setCurrentStage(null);
    setSwipeTextCurrentStage("I'm ready");
    completedOrderIds.current.clear();
    lastStageCountProcessedRef.current = 0;
    hasFinishedProgressRef.current = false;
    lastProcessedStageRef.current = null;
  };

  // Auto-reset if we detect too many stages (allow up to 10 stages for 2 orders)
  useEffect(() => {
    if (stages.length > 25) {
      console.log("🚨 AUTO-RESET: Detected excessive stages, resetting:", stages.length);
      handleEmergencyReset();
    }
  }, [stages.length]);

  return (
    <FFSafeAreaView>
      <FFView style={{ flex: 1, position: "relative" }}>
        <View
          className="absolute z-[1] top-4"
          style={{
            left: "50%",
            transform: [{ translateX: "-50%" }],
            zIndex: 1,
          }}
        >
          <FFBadge
            backgroundColor={available_for_work ? "#0EB228" : "#E02D3C"}
            title={available_for_work ? "Online" : "Offline"}
            textColor="#fff"
          />
        </View>

        <FFAvatar
          avatar={avatar?.url}
          onPress={() => setIsShowSidebar(true)}
          style={{
            position: "absolute",
            top: 10,
            zIndex: 1,
            right: 10,
            borderWidth: 1,
            borderColor: "#eee",
            elevation: 10,
            justifyContent: "center",
            alignItems: "center",
          }}
        />

        <MapWrapper 
          selectedDestination={selectedDestination && selectedDestination.location ? {
            lat: selectedDestination.location.lat || 0,
            lng: selectedDestination.location.lng || 0,
            name: selectedDestination.name,
            avatar: selectedDestination.avatar,
            type: selectedDestination.type
          } : null}
        />

        <View
          style={{
            position: "absolute",
            left: 0,
            elevation: 10,
            right: 0,
            paddingHorizontal: 12,
            bottom: 0,
            backgroundColor: "white",
            marginHorizontal: -10,
            paddingVertical: 10,
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
          }}
        >
          {stages?.length > 0 ? (
            currentActiveLocation ? (
              <View style={{ padding: 12, gap: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <FFAvatar
                    avatar={currentActiveLocation?.avatar?.url}
                    size={60}
                  />
                  <FFText>{currentActiveLocation?.name}</FFText>
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#fff",
                      width: 60,
                      height: 60,
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "#ddd",
                      borderRadius: 9999,
                    }}
                    onPress={() => {}}
                  >
                    <Ionicons name="call-outline" size={20} />
                  </TouchableOpacity>
                </View>
                <FFSeperator />
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.textSecondary,
                      width: 50,
                      height: 50,
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "#ddd",
                      borderRadius: 9999,
                    }}
                    onPress={() => {
                      // Reset to default state
                      setCurrentActiveLocation(null);
                      setSelectedDestination(null);
                    }}
                  >
                    <Ionicons
                      name="return-up-back"
                      size={32}
                      color={colors.white}
                    />
                  </TouchableOpacity>
                  <View
                    style={{
                      backgroundColor:
                        isWaitingForResponse || isProcessing
                          ? "#e0e0e0"
                          : "#0EB228",
                    }}
                    className="overflow-hidden flex-1 relative my-4 rounded-lg"
                  >
                    <FFSwipe
                      reset={isResetSwipe}
                      isDisabled={
                        isWaitingForResponse ||
                        isProcessing ||
                        currentStage?.status === "completed" ||
                        transactions_processed
                      }
                      onSwipe={handleUpdateProgress}
                      direction="right"
                    />
                    <FFText
                      fontWeight="400"
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        marginTop: 12,
                        marginLeft: 64,
                        color: "#fff",
                      }}
                    >
                      {swipeTextCurrentStage}
                    </FFText>
                  </View>
                </View>
              </View>
            ) : (
              <AllStages
                orderRedux={orders}
                handleGoNow={handleGoNow}
                selectedDestination={selectedDestination}
                setSelectedDestination={setSelectedDestination}
                onCall={() => {}}
                onChange={() => {}}
                swipeText={swipeTextCurrentStage}
                onSwipe={handleUpdateProgress}
                isSwipeDisabled={
                  isWaitingForResponse ||
                  isProcessing ||
                  currentStage?.status === "completed" ||
                  transactions_processed
                }
                resetSwipe={isResetSwipe}
                stages={filterPickupAndDropoffStages(
                  stages
                    ?.filter((stage) => {
                      // Filter out completed orders
                      const orderId = stage.state.split("_order_")[1];
                      return !completedOrderIds.current.has(orderId);
                    })
                    ?.map((item) => ({
                      ...item,
                      address: item.details?.restaurantDetails?.address
                        ? item.details.restaurantDetails.address
                        : item.details?.customerDetails?.address?.[0],
                    }))
                )}
              />
            )
          ) : (
            <>
              {!available_for_work && (
                <View className="overflow-hidden mx-6 my-4 rounded-lg bg-[#0EB228]">
                  <FFSwipe
                    onSwipe={() => {
                      if (!loading) {
                        dispatch(toggleAvailability());
                      }
                    }}
                    direction="right"
                  />
                  <FFText
                    fontWeight="bold"
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      marginTop: 12,
                      marginLeft: 64,
                      color: "#fff",
                    }}
                  >
                    {"Swipe to start receiving orders"}
                  </FFText>
                </View>
              )}
            </>
          )}
        </View>
      </FFView>
      <FloatingStage
        onNavigate={(res) => handleNavigateGoogleMap(res)}
        stage={currentActiveLocation || selectedDestination}
      />
      <FFModal
        visible={modalDetails.status !== "HIDDEN"}
        onClose={() =>
          setModalDetails({ status: "HIDDEN", title: "", desc: "" })
        }
      >
        <FFText style={{ textAlign: "center" }}>{modalDetails.title}</FFText>
        <FFText
          fontWeight="400"
          style={{ color: "#aaa", marginVertical: 12, textAlign: "center" }}
        >
          {modalDetails.desc}
        </FFText>
        {modalDetails.status === "YESNO" && (
          <View
            style={{
              width: "100%",
              gap: 12,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setModalDetails({ status: "HIDDEN", title: "", desc: "" });
                setIsResetSwipe(true);
                setTimeout(() => setIsResetSwipe(false), 300);
                setIsProcessing(false);
              }}
              className="flex-1 items-center py-3 px-4 rounded-lg"
            >
              <FFText>Cancel</FFText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setModalDetails({ status: "HIDDEN", title: "", desc: "" });
                setIsProcessing(true);
                handleConfirmDelivery();
              }}
              className="flex-1 items-center py-3 px-4 rounded-lg"
            >
              <FFText style={{ color: "#63c552" }}>Confirm</FFText>
            </TouchableOpacity>
          </View>
        )}
      </FFModal>
      <FFSidebar
        visible={isShowSidebar}
        onClose={() => setIsShowSidebar(false)}
      />
    </FFSafeAreaView>
  );
};

export default HomeScreen;
