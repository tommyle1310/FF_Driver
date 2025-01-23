import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  TextInput,
  Keyboard,
  FlatList,
} from "react-native";
import React, { useState } from "react";
import FFView from "../FFView";
import FFText from "../FFText";
import FFButton from "../FFButton";
import FFAvatar from "../FFAvatar";
import SlideUpModal from "../FFSlideUpModal";
import { SERVICE_FEE } from "@/src/utils/constants";
import { data_horizontal_scrollable_list_Card } from "@/src/data/screens/data_topup";
import { ScrollView } from "react-native-gesture-handler";
import ModalConfirmPayment from "./ModalConfirmPayment";
import FFTextInput from "../FFTextInput";
import { useTheme } from "@/src/hooks/useTheme";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";

const Deposit = () => {
  const {theme} = useTheme()
  const [value, setValue] = useState("");
  const [invalidValueMessage, setInvalidValueMessage] = useState("");
  const [isShowModalConfirm, setIsShowModalConfirm] = useState<boolean>(false);
   const { email, balance } = useSelector(
        (state: RootState) => state.auth
      ); // Get token from Redux

  const handleChangeText = (text: string) => {
    // Only allow numbers
    if (/^\d*$/.test(text)) {
      setValue(text);
    }
  };

  const handleContinue = () => {
    if (!value) {
      setInvalidValueMessage("Please enter a value to proceed payment");
      return;
    }

    setInvalidValueMessage("");
    setIsShowModalConfirm(true);
    Keyboard.dismiss();
  };

  return (
    <>
      <FFView style={{ borderWidth: 0, padding: 8,      backgroundColor: theme === 'light' ? 'white' : 'black', }}>
        <FFText>Deposit to</FFText>
        <TouchableOpacity className="p-4 rounded-2xl flex-row w-1/2 justify-between items-center border border-gray-300 ">
          <View className="items-center flex-row gap-2 justify-between">
            <FFAvatar size={40} />
            <View className=" gap-1 flex-col">
              <FFText style={{ color: "#2E890E" }}>FWallet</FFText>
              <FFText style={{ fontSize: 12 }}>${balance}</FFText>
            </View>
          </View>
        </TouchableOpacity>

        <View style={{marginVertical: 10, marginBottom: 36}} className="gap-1 ">
          <FFText style={{ fontSize: 14 }}>Enter amount:</FFText>
          <FFTextInput
            value={value}
            handleChangeText={handleChangeText}
            isInvalid={!!invalidValueMessage}
          />
          {invalidValueMessage && (
            <FFText style={{ color: "red", fontSize: 12 }}>
              *{invalidValueMessage}
            </FFText>
          )}
        </View>
        <FFButton onPress={handleContinue} isLinear className="w-full">
          Continue
        </FFButton>
      </FFView>

      {/* modal confirm when click continue */}
      <ModalConfirmPayment
        onClose={() => setIsShowModalConfirm(false)}
        isVisible={isShowModalConfirm}
        value={value}
      />
    </>
  );
};

export default Deposit;
