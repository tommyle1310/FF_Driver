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
  Stage,
} from "@/src/store/currentDriverProgressStageSlice";
import FloatingStage from "@/src/components/FloatingStage";
import FFSeperator from "@/src/components/FFSeperator";
import { useSocket } from "@/src/hooks/useSocket";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { StackNavigationProp } from "@react-navigation/stack";
import { Avatar } from "@/src/types/common";

type HomeRouteProp = RouteProp<SidebarStackParamList, "Home">;
type HomeSreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "Home"
>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeSreenNavigationProp>();
  const route = useRoute<HomeRouteProp>();
  const { emitUpdateDps } = route.params;
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
  const isUpdatingRef = useRef(false);
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const dispatch = useDispatch();
  const [swipeTextCurrentStage, setSwipeTextCurrentStage] =
    useState(`I'm ready`);

  const { available_for_work, avatar, accessToken } = useSelector(
    (state: RootState) => state.auth
  );
  const { stages, orders, id } = useSelector(
    (state: RootState) => state.currentDriverProgressStage
  );

  const { isWaitingForResponse, emitUpdateDriverProgress, completeOrder } =
    useSocket(
      id || "",
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

  const handleGoNow = async () => {
    setCurrentActiveLocation(selectedDestination);
  };

  useEffect(() => {
    if (!currentStage?.state.startsWith("driver_ready")) {
      // Swipe control handled by isWaitingForResponse
    }
    if (currentStage?.state.startsWith("waiting_for_pickup")) {
      setSwipeTextCurrentStage(`I've arrived restaurant`);
    }
    if (currentStage?.state.startsWith("restaurant_pickup")) {
      setSwipeTextCurrentStage(`I've picked up order`);
    }
    if (currentStage?.state.startsWith("en_route_to_customer")) {
      setSelectedDestination(null);
      setCurrentActiveLocation(null);
      setSwipeTextCurrentStage(`I've arrived destination`);
    }
    if (currentStage?.state.startsWith("delivery_complete")) {
      setSwipeTextCurrentStage(``); // Clear swipe text when delivery is complete
    }
  }, [currentStage]);

  const handleUpdateProgress = useCallback(async () => {
    if (isWaitingForResponse || isUpdatingRef.current) {
      console.log("Swipe blocked: isWaitingForResponse or isUpdating", {
        isWaitingForResponse,
        isUpdating: isUpdatingRef.current,
      });
      return;
    }

    isUpdatingRef.current = true;
    console.log("Starting updateDriverProgress with stageId:", id);

    // Check if current stage is en_route_to_customer
    if (currentStage?.state.startsWith("en_route_to_customer")) {
      setModalDetails({
        status: "YESNO",
        title: "Are you sure?",
        desc: "Please confirm your delivery",
      });
      isUpdatingRef.current = false;
      return;
    }

    // Deduplicate and sort stages by timestamp
    const uniqueStages = stages
      .reduce((acc, stage) => {
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

    const nextStageIndex = uniqueStages.findIndex(
      (stage) => stage.status === "in_progress" || stage.status === "pending"
    );
    const nextStage =
      nextStageIndex !== -1 ? uniqueStages[nextStageIndex + 1] : null;

    if (!nextStage) {
      console.log("No next stage found", { uniqueStages });
      isUpdatingRef.current = false;
      return;
    }

    if (nextStage.status === "completed") {
      console.log("Next stage already completed", { nextStage });
      isUpdatingRef.current = false;
      return;
    }

    try {
      if (emitUpdateDriverProgress) {
        console.log("Emitting updateDriverProgress with stageId:", id);
        await emitUpdateDriverProgress({ stageId: id });
      }
      setIsResetSwipe(true);
      setTimeout(() => {
        setIsResetSwipe(false);
      }, 300);
      setCurrentStage(nextStage);
    } catch (error) {
      console.error("Error updating progress:", error);
      setIsResetSwipe(false);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [
    id,
    emitUpdateDriverProgress,
    stages,
    isWaitingForResponse,
    currentStage,
  ]);

  useEffect(() => {
    if (stages.length > 0) {
      // Deduplicate and sort stages by timestamp
      const uniqueStages = stages
        .reduce((acc, stage) => {
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

      const activeStage =
        uniqueStages.find(
          (stage) =>
            stage.status === "in_progress" || stage.status === "pending"
        ) || uniqueStages[uniqueStages.length - 1];

      if (!currentStage || currentStage.state !== activeStage.state) {
        console.log("Updating currentStage:", activeStage);
        setCurrentStage(activeStage);
      }
    } else if (stages.length === 0 && currentStage) {
      setCurrentStage(null);
    }
  }, [stages]);

  const handleFinishProgress = async () => {
    try {
      if (emitUpdateDriverProgress) {
        console.log("Emitting final updateDriverProgress with stageId:", id);
        await emitUpdateDriverProgress({ stageId: id });
      }

      const buildDataCustomer1 = filterPickupAndDropoffStages(
        stages?.map((item) => ({
          ...item,
          address: item.details?.restaurantDetails?.address
            ? item.details.restaurantDetails?.address
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
            ? item.details.restaurantDetails?.address
            : item.details?.customerDetails?.address?.[0],
        }))
      ).find((item) => item.type === "PICKUP") as {
        id: string;
        avatar: Avatar;
      };

      setCurrentActiveLocation(null);
      setCurrentStage(null);
      setIsResetSwipe(true);
      setModalDetails({ status: "HIDDEN", desc: "", title: "" });
      setSelectedDestination(null);
      setSwipeTextCurrentStage("");
      completeOrder();

      navigation.navigate("Rating", {
        customer1: buildDataCustomer1,
        orderId: orders[0].id,
        restaurant1: buildDataRestaurant1,
      });
    } catch (error) {
      console.error("Error finishing progress:", error);
    }
  };

  const handleNavigateGoogleMap = async (
    location: { lat: number; lng: number } | undefined
  ) => {
    if (location) {
      openGoogleMaps(location);
    }
  };

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
            borderTopEndRadius: 40,
            borderTopStartRadius: 40,
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
                      name="triangle-exclamation"
                      size={20}
                      color={"#cf3719"}
                    />
                  </TouchableOpacity>
                  <View
                    style={{
                      backgroundColor: isWaitingForResponse
                        ? "#e0e0e0"
                        : "#0EB228",
                    }}
                    className="overflow-hidden flex-1 relative my-4 rounded-lg "
                  >
                    <FFSwipe
                      reset={isResetSwipe}
                      isDisabled={
                        isWaitingForResponse ||
                        currentStage?.state.startsWith("delivery_complete")
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
                      ? item.details.restaurantDetails?.address
                      : item.details?.customerDetails?.address?.[0],
                  }))
                )}
              />
            )
          ) : (
            <>
              <View className="border-b-2 border-gray-300 flex-row items-center justify-between p-2 px-6">
                <FFAvatar />
                <FFText style={{ textAlign: "center", margin: 10 }}>
                  You're {available_for_work ? "Online" : "Offline"}
                </FFText>
                <FFAvatar />
              </View>

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
        {modalDetails?.status === "YESNO" && (
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
                setModalDetails({ status: "HIDDEN", desc: "", title: "" });
                setIsResetSwipe(true);
              }}
              className=" flex-1 items-center py-3 px-4 rounded-lg"
            >
              <FFText>Cancel</FFText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                handleFinishProgress();
              }}
              className=" flex-1 items-center py-3 px-4 rounded-lg"
            >
              <FFText style={{ color: "#63c550" }}>Confirm</FFText>
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
