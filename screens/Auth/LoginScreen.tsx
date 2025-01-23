// screens/Login.tsx
import React, { useEffect, useState } from "react";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import { useNavigation } from "@react-navigation/native";
import FFAuthForm from "./FFAuthForm";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/src/navigation/AppNavigator"; // Make sure you have this path correct
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch, useSelector } from "@/src/store/types";
import {
  loadTokenFromAsyncStorage,
  saveTokenToAsyncStorage,
  setAuthState,
} from "@/src/store/authSlice";
import axiosInstance from "@/src/utils/axiosConfig";
import { RootState } from "@/src/store/store";
import { decodeJWT } from "@/src/utils/functions";

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;

const Login = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const handleLoginSubmit = async (email: string, password: string) => {
    navigation.navigate("Home");

    // Request body
    // const requestBody = {
    //   email: email,
    //   password: password,
    // };

    // try {
    //   // Make the POST request
    //   const response = await axiosInstance.post(
    //     "/auth/login-fwallet",
    //     requestBody,
    //     {
    //       // This will ensure axios does NOT reject on non-2xx status codes
    //       validateStatus: () => true, // Always return true so axios doesn't throw on errors
    //     }
    //   );

    //   // Now you can safely access the EC field
    //   const { EC, EM } = response.data; // Access EC directly

    //   if (EC === 0) {
    //     // Success: Decode the JWT from the response data
    //     const decoded = decodeJWT(response.data.data.access_token);

    //     // Extract necessary fields from the decoded JWT (adjust field names as needed)
    //     const {
    //       app_preferences,
    //       balance,
    //       email,
    //       userId,
    //       user_type,
    //       fWallet_id,
    //     } = decoded;

    //     // Save all the relevant data to Redux and AsyncStorage
    //     await dispatch(
    //       saveTokenToAsyncStorage({
    //         accessToken: response.data.data.access_token,
    //         app_preferences: app_preferences,
    //         balance: balance,
    //         email: email,
    //         fWalletId: fWallet_id,
    //         userId: userId,
    //         user_type: user_type,
    //       })
    //     );

    //     // Navigate to home or another screen
    //     navigation.navigate("Home");
    //   } else {
    //     // Handle error based on EC (optional)
    //     setError(EM);
    //   }
    // } catch (error) {
    //   console.error("Login failed:", error);
    //   // Handle error here
    // }
  };

  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  if (isAuthenticated) {
    // console.log("User is authenticated with token:", accessToken);
  } else {
    // console.log("User is not authenticated");
  }

  return (
    <FFSafeAreaView>
      <LinearGradient
        colors={["#8fa3d9", "#b5b3a1", "#b5e1a1"]}
        start={[1, 0]}
        end={[0, 1]}
        className="flex-1 items-center justify-center"
      >
        <FFAuthForm
          error={error}
          isSignUp={false}
          onSubmit={handleLoginSubmit}
          navigation={navigation}
        />
      </LinearGradient>
    </FFSafeAreaView>
  );
};

export default Login;
