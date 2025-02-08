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
import MapWithCurrentLocation from "@/src/components/Maps/CurrentLocation";

const HomeScreen = () => {
  const [isShowSidebar, setIsShowSidebar] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); // Loading state

  // Get token and other data from Redux
  const { available_for_work, avatar } = useSelector(
    (state: RootState) => state.auth
  );

  const dispatch = useDispatch();

  useEffect(() => {
    const loadToken = async () => {
      await dispatch(loadTokenFromAsyncStorage()); // Load token from AsyncStorage
      setLoading(false); // Set loading to false after token is loaded
    };
    loadToken();
  }, [dispatch]);

  return (
    <FFSafeAreaView>
      <FFView style={{ flex: 1, padding: 8, position: "relative" }}>
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
        <MapWithCurrentLocation />

        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "white",
            marginHorizontal: -10,
            paddingVertical: 10,
            borderTopEndRadius: 40,
            borderTopStartRadius: 40,
          }}
        >
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
        </View>
      </FFView>

      <FFSidebar
        visible={isShowSidebar}
        onClose={() => setIsShowSidebar(false)}
      />
    </FFSafeAreaView>
  );
};

export default HomeScreen;
