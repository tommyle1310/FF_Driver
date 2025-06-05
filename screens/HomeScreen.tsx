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
  initialState,
  loadDriverProgressStageFromAsyncStorage,
  updateStages,
  Stage,
} from "@/src/store/currentDriverProgressStageSlice";
import FloatingStage from "@/src/components/FloatingStage";
import FFSeperator from "@/src/components/FFSeperator";
import { useSocket } from "@/src/hooks/useSocket";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { StackNavigationProp } from "@react-navigation/stack";
import { Avatar } from "@/src/types/common";
import debounce from "lodash/debounce";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const [swipeTextCurrentStage, setSwipeTextCurrentStage] =
    useState(`I'm ready`);
  const pendingStageRef = useRef<Stage | null>(null);
  const hasFinishedProgressRef = useRef(false);
  const lastProcessedStageRef = useRef<string | null>(null);

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
  } = useSocket(
    userId || "",
    () => {},
    () => {},
    () => {}
  );

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
    console.log("Current stage changed:", currentStage?.state);
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
  }, [currentStage, updateSwipeText]);

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
    console.log("Stages updated:", stages);
    if (!stages?.length || transactions_processed) {
      console.log("No stages or order completed, clearing currentStage");
      debouncedSetCurrentStage(null);
      setSwipeTextCurrentStage("");
      setModalDetails({ status: "HIDDEN", title: "", desc: "" });
      hasFinishedProgressRef.current = false;
      lastProcessedStageRef.current = null;
      return;
    }

    const uniqueStages = Object.values(
      stages.reduce((acc: { [key: string]: Stage }, stage: Stage) => {
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

    const currentOrderId = currentStage?.state.split("_order_").pop() || "1";
    const deliveryCompleteStage = uniqueStages.find(
      (s) =>
        s.state === `delivery_complete_order_${currentOrderId}` &&
        s.status === "completed"
    );

    if (
      deliveryCompleteStage &&
      lastProcessedStageRef.current !== deliveryCompleteStage.state
    ) {
      lastProcessedStageRef.current = deliveryCompleteStage.state;
      setCurrentActiveLocation(null);
      handleFinishProgress();
      return;
    }

    let activeStage: Stage | null = null;
    const inProgressStage = uniqueStages
      .filter((s) => s.status === "in_progress")
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (inProgressStage) {
      activeStage = inProgressStage;
    } else {
      for (const stageState of STAGE_ORDER) {
        const stage = uniqueStages
          .filter(
            (s) => s.state.startsWith(stageState) && s.status === "pending"
          )
          .sort((a, b) => {
            const aOrder = parseInt(a.state.split("_order_")[1] || "1");
            const bOrder = parseInt(b.state.split("_order_")[1] || "1");
            return aOrder - bOrder;
          })[0];
        if (stage) {
          activeStage = stage;
          break;
        }
      }
    }

    if (
      activeStage &&
      (!currentStage ||
        currentStage.state !== activeStage.state ||
        currentStage.status !== activeStage.status ||
        currentStage.timestamp !== activeStage.timestamp)
    ) {
      console.log("Updating currentStage to:", activeStage);
      debouncedSetCurrentStage(activeStage);
    }
  }, [stages, transactions_processed, debouncedSetCurrentStage, currentStage]);

  const handleUpdateProgress = useCallback(async () => {
    console.log("handleUpdateProgress called", {
      isWaitingForResponse,
      isUpdating: isUpdatingRef.current,
      isProcessing,
      currentStage: currentStage?.state,
      transactions_processed,
      isSocketConnected,
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
      console.log("Starting updateDriverProgress with stageId:", id);
      const response = await emitUpdateDriverProgress({ stageId: id });
      console.log("updateDriverProgress response:", response);
      if (
        response?.success === false &&
        response?.message === "Duplicate event"
      ) {
        console.warn("Duplicate event detected, skipping stage update");
        return;
      }
      setIsResetSwipe(true);
      setTimeout(() => setIsResetSwipe(false), 100);
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

      if (orderCount > 1 && remainingStages.length >= 5) {
        console.log("Multiple orders detected, resetting UI for next order");

        dispatch(updateStages(remainingStages));

        setCurrentActiveLocation(null);
        setSelectedDestination(null);
        setCurrentStage(null);
        setSwipeTextCurrentStage("I'm ready");
        setModalDetails({ status: "HIDDEN", desc: "", title: "" });
        setIsResetSwipe(true);
        setTimeout(() => setIsResetSwipe(false), 100);

        await AsyncStorage.setItem(
          "currentDriverProgressStage",
          JSON.stringify({
            ...initialState,
            stages: remainingStages,
            orders: orders.filter(
              (order) => !order.id.includes(currentOrderId)
            ),
            id,
            driver_id: userId,
            transactions_processed: false,
          })
        );

        hasFinishedProgressRef.current = false;
        lastProcessedStageRef.current = null;
        setIsProcessing(false);

        // Only call handleCompleteOrder for the specific order
        if (orderCount === 2) {
          // Last order in multi-order, allow full cleanup
          handleCompleteOrder();
        } else {
          console.log("Skipping full handleCompleteOrder to preserve stages");
        }
        return;
      }

      const buildDataCustomer1 = filterPickupAndDropoffStages(
        stages?.map((item) => ({
          ...item,
          address: item.details?.restaurantDetails?.address
            ? item.details.restaurantDetails.address
            : item.details?.customerDetails?.address?.[0],
        }))
      ).find((item) => item.type === "DROPOFF") as {
        id: string;
        avatar: Avatar;
      };
      const buildDataRestaurant1 = filterPickupAndDropoffStages(
        stages?.map((item) => ({
          ...item,
          address: item.details?.restaurantDetails?.address
            ? item.details.restaurantDetails.address
            : item.details?.customerDetails?.address?.[0],
        }))
      ).find((item) => item.type === "PICKUP") as {
        id: string;
        avatar: Avatar;
      };

      if (!orders[0]) {
        console.error("No orders available");
        setIsProcessing(false);
        hasFinishedProgressRef.current = false;
        return;
      }

      await AsyncStorage.removeItem("currentDriverProgressStage");
      dispatch(clearDriverProgressStage());
      setCurrentActiveLocation(null);
      setSelectedDestination(null);
      setCurrentStage(null);
      setSwipeTextCurrentStage("");
      setModalDetails({ status: "HIDDEN", desc: "", title: "" });
      setIsResetSwipe(true);
      setTimeout(() => setIsResetSwipe(false), 100);
      handleCompleteOrder();

      navigation.navigate("Rating", {
        customer1: buildDataCustomer1,
        orderId: orders[0].id,
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
    if (location) {
      openGoogleMaps(location);
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

  console.log("check stagé", stages);

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

        <MapWrapper />

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
                      backgroundColor: "#fff",
                      width: 50,
                      height: 50,
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "#ddd",
                      borderRadius: 9999,
                    }}
                    onPress={() => {}}
                  >
                    <FontAwesome6
                      name="exclamation-triangle"
                      size={20}
                      color={"#cf3719"}
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
                handleGoNow={handleGoNow}
                selectedDestination={selectedDestination}
                setSelectedDestination={setSelectedDestination}
                onCall={() => {}}
                onChange={() => {}}
                stages={filterPickupAndDropoffStages(
                  stages?.map((item) => ({
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
        stage={currentActiveLocation}
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
                handleFinishProgress();
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
