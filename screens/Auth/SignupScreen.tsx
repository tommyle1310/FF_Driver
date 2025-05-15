import React, { useState } from "react";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import { useNavigation } from "@react-navigation/native";
import FFAuthForm from "./FFAuthForm";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import {
  AuthStackParamList,
  RootStackParamList,
} from "@/src/navigation/AppNavigator";
import axiosInstance from "@/src/utils/axiosConfig";
import { useDispatch } from "@/src/store/types";
import { setAuthState } from "@/src/store/authSlice";
import FFModal from "@/src/components/FFModal";
import FFText from "@/src/components/FFText";
import {
  TextInput,
  TouchableOpacity,
  View,
  Text,
  ScrollView,
} from "react-native";
import IconIonicon from "react-native-vector-icons/Ionicons";

import FFButton from "@/src/components/FFButton";
import Spinner from "@/src/components/FFSpinner";
import { spacing } from "@/src/theme";

type SignupScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "Signup"
>;

const Signup = () => {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [modalStatus, setModalStatus] = useState<
    "ENTER_CODE" | "VERIFIED_SUCCESS"
  >("ENTER_CODE");
  const [isOpenVerificationModal, setIsOpenVerificationModal] =
    useState<boolean>(false);

  const handleSignupSubmit = async (basicInfo: any, vehicleInfo: any) => {
    setLoading(true);
    setEmail(basicInfo.email);

    try {
      // Step 1: Register driver with basic info
      const registerResponse = await axiosInstance.post(
        "/auth/register-driver",
        basicInfo,
        {
          validateStatus: () => true,
        }
      );
      console.log("cehck data", registerResponse.data);

      if (registerResponse.data && registerResponse.data.EC === 0) {
        // If registration successful and we have vehicle info
        if (vehicleInfo && registerResponse.data.data.id) {
          // Step 2: Update driver with vehicle info
          const updateResponse = await axiosInstance.patch(
            `/drivers/${registerResponse.data.data.id}`,
            vehicleInfo,
            {
              validateStatus: () => true,
            }
          );

          if (updateResponse.data && updateResponse.data.EC !== 0) {
            setError(
              updateResponse.data.EM || "Failed to update vehicle information"
            );
            setLoading(false);
            return;
          }
        }

        setIsOpenVerificationModal(true);
      } else {
        setError(registerResponse.data?.EM || "Registration failed");
      }
    } catch (error) {
      setError("Network error. Please try again later.");
    }

    setLoading(false);
  };

  const handleSubmitVerificationCode = () => {
    const requestBody = {
      email: email,
      code: verificationCode,
    };

    // Make the POST request
    axiosInstance
      .post("/auth/verify-email", requestBody, {
        validateStatus: () => true, // Always return true so axios doesn't throw on errors
      })
      .then((response) => {
        // Set loading to false once the response is received
        setLoading(false);

        if (response.data) {
          const { EC, EM } = response.data; // Access EC directly

          if (EC === 0) {
            setModalStatus("VERIFIED_SUCCESS");
          } else {
            setError(EM);
          }
        } else {
          setError("Something went wrong. Please try again.");
        }
      })
      .catch((error) => {
        setLoading(false);
        setError("Network error. Please try again later.");
      });
  };

  return (
    <FFSafeAreaView>
      <LinearGradient
        colors={["#8fa3d9", "#b5b3a1", "#b5e1a1"]}
        start={[1, 0]}
        end={[0, 1]}
        className="flex-1 items-center justify-center"
      >
        <Spinner
          isVisible={loading} // Ensure this is set to `true` when loading
          isOverlay={true}
          overlayColor="rgba(0, 0, 0, 0.5)"
        />
        <ScrollView style={{ width: "116%", padding: spacing.lg }}>
          <FFAuthForm
            isSignUp={true}
            onSubmit={handleSignupSubmit}
            navigation={navigation}
            error={error}
          />
        </ScrollView>
      </LinearGradient>

      <FFModal
        disabledClose
        visible={isOpenVerificationModal}
        onClose={() => setIsOpenVerificationModal(false)}
      >
        {modalStatus === "ENTER_CODE" ? (
          <View className="gap-4">
            <Text className="text-xl font-bold text-center">
              You're almost there!
            </Text>
            <View className="gap-2">
              <Text className="text-xs text-gray-400">
                One last step before starting your wonderful journey in
                Flashfood!
              </Text>
              <View className="items-center flex-row flex-wrap">
                <Text className="text-sm text-gray-500">
                  We have just sent you a verification code to{" "}
                </Text>
                <Text className="font-bold">{email}!</Text>
              </View>
            </View>
            <View className="gap-1">
              <Text>Enter your verification code:</Text>
              <TextInput
                className="border border-gray-300 px-3 py-2 rounded-md"
                keyboardType="number-pad"
                onChangeText={(text) =>
                  /^[0-9]*$/.test(text) && setVerificationCode(text)
                }
                value={verificationCode}
              />
              {error && <Text className="text-red-500">{error}</Text>}
            </View>
            <FFButton
              onPress={handleSubmitVerificationCode}
              className="w-full mt-4"
              isLinear
            >
              Confirm
            </FFButton>
          </View>
        ) : (
          <View className="gap-4">
            <IconIonicon
              name="checkmark-circle"
              color={"#63c550"}
              size={30}
              className="text-center"
            />
            <View>
              <Text className="text-lg font-bold text-center">
                Your email is verified
              </Text>
              <Text className="text-sm text-gray-500">
                Thank you for joining us at Flashfood! We're excited to have you
                on board and hope you have a wonderful experience with us!
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              className="flex-row gap-1 items-center justify-center"
            >
              <Text className="text-[#a140e1] text-underline text-center font-semibold text-lg">
                Go to Login
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </FFModal>
    </FFSafeAreaView>
  );
};

export default Signup;
