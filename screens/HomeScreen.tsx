import React, { useEffect, useState } from "react";
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
import { Stage } from "@/src/store/currentDriverProgressStageSlice";
import FloatingStage from "@/src/components/FloatingStage";
import FFSeperator from "@/src/components/FFSeperator";
import FFButton from "@/src/components/FFButton";
import { useSocket } from "@/src/hooks/useSocket";
import { RouteProp, useRoute } from "@react-navigation/native";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";

type HomeRouteProp = RouteProp<SidebarStackParamList, "Home">;

const HomeScreen = () => {
  const route = useRoute<HomeRouteProp>();
  const { emitUpdateDps } = route.params;
  const [isShowSidebar, setIsShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] =
    useState<PickupAndDropoffStage | null>(null);
  const [isShowModalStatus, setIsShowModalStatus] = useState(false);
  const [currentActiveLocation, setCurrentActiveLocation] =
    useState<PickupAndDropoffStage | null>(null);
  const [isResetSwipe, setIsResetSwipe] = useState(false);
  const [currentStage, setCurrentStage] = useState<Stage>();
  const dispatch = useDispatch();

  const { available_for_work, avatar } = useSelector(
    (state: RootState) => state.auth
  );
  const { stages, orders, id } = useSelector(
    (state: RootState) => state.currentDriverProgressStage
  );

  useEffect(() => {
    const loadToken = async () => {
      await dispatch(loadTokenFromAsyncStorage());
      setLoading(false);
    };
    loadToken();
  }, [dispatch]);

  const handleGoNow = async () => {
    if (selectedDestination?.type === "DROPOFF") {
      setIsShowModalStatus(true);
      return;
    }
    setCurrentActiveLocation(selectedDestination);
  };

  const handleUpdateProgress = async () => {
    try {
      await emitUpdateDps(id);
      // setCurrentStage(stages[1]);
      // Ví dụ: Gọi API hoặc dispatch action để cập nhật tiến trình
      // await axiosInstance.post("/update-progress", { stageId: stages[0].id });

      // Sau khi xử lý xong, reset swipe
      setIsResetSwipe(true);

      // Đợi animation reset hoàn tất (khoảng 300ms) rồi đặt lại isResetSwipe về false
      setTimeout(() => {
        setIsResetSwipe(false);
      }, 300);
    } catch (error) {
      console.error("Error updating progress:", error);
      // Nếu lỗi, vẫn có thể reset swipe tùy ý
      setIsResetSwipe(true);
      setTimeout(() => setIsResetSwipe(false), 300);
    }
  };
  console.log("check ", stages);

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
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        marginTop: 12,
                        marginLeft: 64,
                        color: "#fff",
                      }}
                    >
                      I've Arrived Restaurant
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
        visible={isShowModalStatus}
        onClose={() => setIsShowModalStatus(false)}
      >
        <FFText>You must pickup your order first to begin this process.</FFText>
      </FFModal>
      <FFSidebar
        visible={isShowSidebar}
        onClose={() => setIsShowSidebar(false)}
      />
    </FFSafeAreaView>
  );
};

export default HomeScreen;
