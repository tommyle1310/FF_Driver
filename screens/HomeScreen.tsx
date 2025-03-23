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
} from "@/src/store/authSlice"; // Assuming loadTokenFromAsyncStorage exists
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
  initialState as initalStateCurrentActiveStage,
  Stage,
} from "@/src/store/currentDriverProgressStageSlice";
import FloatingStage from "@/src/components/FloatingStage";
import FFSeperator from "@/src/components/FFSeperator";
import FFButton from "@/src/components/FFButton";

const HomeScreen = () => {
  const [isShowSidebar, setIsShowSidebar] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); // Loading state
  const [selectedDestination, setSelectedDestination] =
    useState<PickupAndDropoffStage | null>(null);
  const [isShowModalStatus, setIsShowModalStatus] = useState(false);
  const [currentActiveLocation, setCurrentActiveLocation] =
    useState<PickupAndDropoffStage | null>(null);

  // Get token and other data from Redux
  const { available_for_work, avatar } = useSelector(
    (state: RootState) => state.auth
  );
  const { stages, orders } = useSelector(
    (state: RootState) => state.currentDriverProgressStage
  );

  const dispatch = useDispatch();

  useEffect(() => {
    const loadToken = async () => {
      await dispatch(loadTokenFromAsyncStorage()); // Load token from AsyncStorage
      setLoading(false); // Set loading to false after token is loaded
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
    console.log("cehck just swiped");
  };

  // console.log("check filtered", filterPickupAndDropoffStages(stages));

  return (
    <FFSafeAreaView>
      <FFView style={{ flex: 1, position: "relative" }}>
        {/* Top section - Badge centered */}
        <View
          className="absolute z-[1] top-4"
          style={{
            left: "50%", // Center horizontally
            transform: [{ translateX: "-50%" }], // Adjust position to be exactly centered
            zIndex: 1,
          }}
        >
          <FFBadge
            backgroundColor={available_for_work ? "#0EB228" : "#E02D3C"}
            title={available_for_work ? "Online" : "Offline"}
            textColor="#fff"
          />
        </View>

        {/* Avatar */}
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

        {/* Map */}
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
                  <View className="flex-1">
                    <View className="overflow-hidden relative my-4 rounded-lg bg-[#0EB228]">
                      <FFSwipe
                        onSwipe={() => {
                          if (!loading) {
                            handleUpdateProgress();
                          }
                        }}
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
                        Arrived
                      </FFText>
                    </View>
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
                        dispatch(toggleAvailability()); // Call the function properly via dispatch
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
      <FloatingStage onNavigate={() => {}} stage={currentActiveLocation} />
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
