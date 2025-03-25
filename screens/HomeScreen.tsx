import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, Pressable } from "react-native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFText from "@/src/components/FFText";
import FFSidebar from "@/src/components/FFSidebar";
import FFAvatar from "@/src/components/FFAvatar";
import FFBadge from "@/src/components/FFBadge";
import FFView from "@/src/components/FFView";
import FFSwipe from "@/src/components/FFSwipe";
import { useDispatch, useSelector } from "@/src/store/types";
import { AppDispatch, RootState } from "@/src/store/store";
import axiosInstance from "@/src/utils/axiosConfig";
import {
  saveTokenToAsyncStorage,
  setAuthState,
  loadTokenFromAsyncStorage,
} from "@/src/store/authSlice";
import { toggleAvailability } from "@/src/store/availabilitySlice";
import MapWrapper from "@/src/components/Maps/MapWrapper";
import AllStages from "@/src/components/screens/Home/AllStages";
import {
  filterPickupAndDropoffStages,
  PickupAndDropoffStage,
} from "@/src/utils/functions/filters";
import FFModal from "@/src/components/FFModal";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome6 } from "@expo/vector-icons";
import {
  loadDriverProgressStageFromAsyncStorage,
  Stage,
} from "@/src/store/currentDriverProgressStageSlice";
import FloatingStage from "@/src/components/FloatingStage";
import FFSeperator from "@/src/components/FFSeperator";
import FFButton from "@/src/components/FFButton";
import { useSocket } from "@/src/hooks/useSocket";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { Enum_TrackingInfo } from "@/src/types/Orders";
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
    status: "SUCCESS" | "ERROR" | "HIDDEN" | "INFO";
    title: string;
    desc: string;
  }>({ status: "HIDDEN", title: "", desc: "" });
  const [currentActiveLocation, setCurrentActiveLocation] =
    useState<PickupAndDropoffStage | null>(null);
  const [isResetSwipe, setIsResetSwipe] = useState(false);
  const isUpdatingRef = useRef(false); // Theo dõi quá trình update
  const [currentStage, setCurrentStage] = useState<Stage | null>();
  const dispatch = useDispatch();
  const [swipeTextCurrentStage, setSwipeTextCurrentStage] = useState(
    `I've arrived restaurant`
  );

  const { available_for_work, avatar } = useSelector(
    (state: RootState) => state.auth
  );
  const { stages, orders, id } = useSelector(
    (state: RootState) => state.currentDriverProgressStage
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
    console.log(
      "check current stage",
      !currentStage?.state.startsWith("en_route_to_customer") ||
        !currentStage.state.startsWith("completed"),
      currentStage?.state,
      currentStage
    );

    // if (
    //   !currentStage?.state.startsWith("en_route_to_customer") ||
    //   !currentStage.state.startsWith("delivery_complete")
    // ) {
    //   setModalDetails({
    //     status: "ERROR",
    //     title: "wtf",
    //     desc: "You are not allowed to pickup at the moment, please finish picking up order before proceediing this action 😁.",
    //   });
    //   return;
    // }
    setCurrentActiveLocation(selectedDestination);
  };

  useEffect(() => {
    const loadData = async () => {
      await dispatch(loadTokenFromAsyncStorage());
      await dispatch(loadDriverProgressStageFromAsyncStorage());
    };
    loadData();
  }, [dispatch]);

  useEffect(() => {
    console.log("cehck curr stages", currentStage);
    if (currentStage?.state.startsWith("delivery_complete")) {
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

      navigation.navigate("Rating", {
        customer1: buildDataCustomer1,
        restaurant1: buildDataRestaurant1,
      });
    }

    if (currentStage?.state.startsWith("waiting_for_pickup")) {
      setSelectedDestination(null);
      setCurrentActiveLocation(null);
      setSwipeTextCurrentStage(`I've arrived restaurant`);
    }
    if (currentStage?.state.startsWith("restaurant_pickup")) {
      setSelectedDestination(null);
      setCurrentActiveLocation(null);
      setSwipeTextCurrentStage(`I've picked up order`);
    }
    if (currentStage?.state.startsWith("en_route_to_customer")) {
      setSelectedDestination(null);
      setCurrentActiveLocation(null);
      setSwipeTextCurrentStage(`I've arrived destination`);
    }
  }, [currentStage]);

  console.log(
    "check customer ",
    filterPickupAndDropoffStages(
      stages?.map((item) => ({
        ...item,
        address: item.details?.restaurantDetails?.address
          ? item.details.restaurantDetails?.address
          : item.details?.customerDetails?.address?.[0],
      }))
    ).find((item) => item.type === "DROPOFF")
  );
  console.log(
    "check restaurant ",
    filterPickupAndDropoffStages(
      stages?.map((item) => ({
        ...item,
        address: item.details?.restaurantDetails?.address
          ? item.details.restaurantDetails?.address
          : item.details?.customerDetails?.address?.[0],
      }))
    ).find((item) => item.type === "PICKUP")
  );

  const handleUpdateProgress = useCallback(async () => {
    console.log("cehk fall hadnle udoae progers");

    // Tìm stage tiếp theo cần tăng (in_progress hoặc pending)
    const nextStageIndex = stages.findIndex(
      (stage) => stage.status === "in_progress" || stage.status === "pending"
    );
    const nextStage = nextStageIndex !== -1 ? stages[nextStageIndex] : null;

    if (!nextStage || isUpdatingRef.current) {
      console.log(
        "Update bị ngăn: không tìm thấy stage tiếp theo hoặc đang cập nhật"
      );
      return;
    }

    // Nếu stage hiện tại đã completed, không cần kiểm tra thêm
    if (nextStage.status === "completed") {
      console.log("Stage tiếp theo đã completed, không cần emit");
      return;
    }

    isUpdatingRef.current = true;

    try {
      console.log(
        "Emit updateDriverProgress với id:",
        id,
        "và stage:",
        nextStage.state
      );
      await emitUpdateDps({ stageId: id }); // Gửi thêm orderId nếu có
      setIsResetSwipe(true);
      setTimeout(() => {
        setIsResetSwipe(false);
        isUpdatingRef.current = false;
      }, 300);

      // Cập nhật currentStage sau khi emit
      setCurrentStage(nextStage);
    } catch (error) {
      isUpdatingRef.current = false;
      setIsResetSwipe(false);
    }
  }, [id, emitUpdateDps, stages]); // Thêm stages vào dependency để cập nhật khi stages thay đổi

  // Chỉ cập nhật currentStage ban đầu hoặc khi stages thay đổi
  useEffect(() => {
    if (stages.length > 0) {
      const activeStage =
        stages.find(
          (stage) =>
            stage.status === "in_progress" || stage.status === "pending"
        ) || stages[0];
      if (!currentStage || currentStage.state !== activeStage.state) {
        console.log("Cập nhật currentStage:", activeStage);
        setCurrentStage(activeStage);
      }
    } else if (stages.length === 0 && currentStage) {
      setCurrentStage(null);
    }
  }, [stages]);

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
                  <View className="overflow-hidden flex-1 relative my-4 rounded-lg bg-[#0EB228]">
                    <FFSwipe
                      reset={isResetSwipe}
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
        onNavigate={() => console.log("Navigate")}
        stage={currentActiveLocation}
      />
      <FFModal
        visible={modalDetails.status !== "HIDDEN"}
        onClose={() =>
          setModalDetails({ status: "HIDDEN", title: "", desc: "" })
        }
      >
        <FFText>{modalDetails.title}</FFText>
        {modalDetails?.status === "INFO" && (
          <View className="flex-row gap-2 items-center">
            <FFButton>Cancel</FFButton>
            <FFButton>Confirm</FFButton>
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
