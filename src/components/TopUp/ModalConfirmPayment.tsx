import { View, Text, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import FFText from "../FFText";
import FFButton from "../FFButton";
import { ScrollView } from "react-native-gesture-handler";
import SlideUpModal from "../FFSlideUpModal";
import { data_horizontal_scrollable_list_Card } from "@/src/data/screens/data_topup";
import FFAvatar from "../FFAvatar";
import { SERVICE_FEE } from "@/src/utils/constants";
import axiosInstance from "@/src/utils/axiosConfig";
import { useDispatch, useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import { loadTokenFromAsyncStorage, saveTokenToAsyncStorage, setBalance } from "@/src/store/authSlice";
import FFModal from "../FFModal";

interface Props_ModalConfirmPayment {
  value: string;
  isVisible: boolean;
  onClose: () => void;
}

const ModalConfirmPayment = ({
  value,
  isVisible,
  onClose,
}: Props_ModalConfirmPayment) => {
  const [selectedPaymentMethod, setSelectPaymentMethod] = useState<"MOMO" | "VCB" | "OTHERS">("MOMO");
  const [error, setError] = useState("");
  const [modalStatus, setModalStatus] = useState<'ERROR' | 'SUCCESSFUL' | null>(null);
  const [isOpenModalStatus, setIsOpenModalStatus] = useState<boolean>(false);

  const { email, userId, balance, fWalletId, accessToken, app_preferences ,user_type} = useSelector(
    (state: RootState) => state.auth
  ); // Get token from Redux
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true); // Loading state to wait for token loading

  // Load token from AsyncStorage when the app starts
  useEffect(() => {
    const loadToken = async () => {
      await dispatch(loadTokenFromAsyncStorage());
      setLoading(false); // Set loading to false after token is loaded
    };
    loadToken();
  }, [dispatch]);

  // If the token is still loading, show a blank screen or a loading spinner
  if (loading) {
    return null; // Or return a loading spinner here, e.g. <ActivityIndicator />
  }

const handleConfirmPayment = async () => {
    // Check if the balance is sufficient (balance - value)
    if ((balance ?? 0) - +value < 0) {
      // Set the error state message if not enough balance
      setError("Not enough balance");
      setModalStatus('ERROR');
      setIsOpenModalStatus(true);
      return;
    }

    // Create the request body
    const requestBody = {
      user_id: userId ?? "", // Use empty string if userId is null
      fwallet_id: fWalletId ?? "", // Use empty string if fWalletId is null
      transaction_type: "DEPOSIT", 
      amount: +value,
      balance_after: (balance ?? 0) + +value,
      status: "PENDING",
      source: "FWALLET",
      destination: fWalletId ?? "", // Use empty string if fWalletId is null
    };

    try {
      // Send the POST request
      const response = await axiosInstance.post(
        "/transactions",
        requestBody, // Send the actual request body
        {
          validateStatus: () => true, // Do not reject on non-2xx status codes
        }
      );

      // Handle the response data (e.g., navigate or update UI based on response)
       if (response.data?.EC === 0) {
      // Transaction is successful: Update the global balance
      const newBalance = (balance ?? 0) + +value;
      dispatch(setBalance(newBalance)); // Update Redux store with the new balance
      dispatch(saveTokenToAsyncStorage({ // Save the updated balance to AsyncStorage
        accessToken: accessToken ?? "", // Use empty string if accessToken is null
        app_preferences: app_preferences ?? {}, // Use empty object if app_preferences is null
        balance: newBalance, 
        email: email ?? "", // Use empty string if email is null
        fWalletId: fWalletId ?? "", // Use empty string if fWalletId is null
        userId: userId ?? "", // Use empty string if userId is null
        user_type: user_type ?? [], // Use empty array if user_type is null
      }));
      setModalStatus('SUCCESSFUL');
      setIsOpenModalStatus(true);
    } else {
        // Failure: Set the error message from response if available
        setError(response.data?.EM || "Transaction failed");
        setModalStatus('ERROR');
        setIsOpenModalStatus(true);
      }
    } catch (error) {
      // Handle network or other errors
      setError("Network error or request failed");
      setModalStatus('ERROR');
      setIsOpenModalStatus(true);
    }
  };


  return (
    <>
      <SlideUpModal isVisible={isVisible} onClose={onClose}>
        <FFText style={{ fontWeight: "bold", marginBottom: 10 }}>
          Account/Card
        </FFText>
        <View>
          <ScrollView
            horizontal
            contentContainerStyle={{
              flexDirection: "row",
              gap: 4,
              alignItems: "center", // Ensure items are vertically centered
            }}
            style={{ paddingHorizontal: 10 }}
          >
            {data_horizontal_scrollable_list_Card.map((item, index) => (
              <TouchableOpacity
                onPress={() => setSelectPaymentMethod(item.name)}
                key={index}
                style={[
                  {
                    padding: 8, // Padding equivalent of p-2 and paddingVertical
                    borderRadius: 16, // Equivalent of rounded-2xl
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderWidth: 1, // Equivalent to border
                    height: "auto", // Ensures height fits content
                  },
                  {
                    borderColor:
                      selectedPaymentMethod === item.name ? "#5BCD33" : "#ccc", // Dynamically set border color
                  },
                ]}
              >
                <View
                  className="items-center flex-row gap-2 justify-between"
                  style={{ height: "auto" }}
                >
                  <FFAvatar size={36} avatar={item.avatar} />
                  <View className="gap-1 flex-col">
                    <FFText
                      style={{ color: "#2E890E", textTransform: "capitalize" }}
                    >
                      {item.name}
                    </FFText>
                    <FFText style={{ fontSize: 12 }}>
                      {item.serviceFee === 0 ? "Free" : item.serviceFee}
                    </FFText>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="border  border-gray-300 rounded-lg p-4 gap-4 mt-6">
          <View className="justify-between flex-row items-center">
            <FFText style={{ color: "#bbb", fontWeight: 400 }}>Service</FFText>
            <FFText>Deposit to FWallet</FFText>
          </View>
          <View className="justify-between flex-row items-center">
            <FFText style={{ color: "#bbb", fontWeight: 400 }}>Source</FFText>
            <FFText style={{ textTransform: "capitalize" }}>
              {selectedPaymentMethod}
            </FFText>
          </View>
          <View className="justify-between flex-row items-center">
            <FFText style={{ color: "#bbb", fontWeight: 400 }}>Amount</FFText>
            <FFText>${value}</FFText>
          </View>
          <View style={{ height: 1, backgroundColor: "#ddd", marginTop: 10 }}></View>
          <View className="justify-between flex-row items-center">
            <FFText style={{ color: "#bbb", fontWeight: 400 }}>Service Fee</FFText>
            <FFText>{`${SERVICE_FEE}%` && "Free"}</FFText>
          </View>
        </View>
        <View style={{ flex: 1, marginTop: 40 }} className="gap-2 self-end">
          <View className="justify-between flex-row items-center">
            <FFText style={{ color: "#bbb", fontWeight: 400, fontSize: 20 }}>
              Total
            </FFText>
            <FFText style={{ fontSize: 20 }}>
              ${parseFloat(value) - parseFloat(value) * SERVICE_FEE}
            </FFText>
          </View>
          <FFButton onPress={handleConfirmPayment} isLinear className="w-full">
            Confirm
          </FFButton>
        </View>

        <FFModal visible={isOpenModalStatus} onClose={() => setIsOpenModalStatus(false)}>
          <FFText>{modalStatus === 'ERROR' ? error : 'Success'}</FFText>
        </FFModal>
      </SlideUpModal>
    </>
  );
};

export default ModalConfirmPayment;
