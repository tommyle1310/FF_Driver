import { View, Text, TouchableOpacity, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import FFAvatar from "../../FFAvatar";
import FFInputControl from "../../FFInputControl";
import axiosInstance from "@/src/utils/axiosConfig";
import { useDispatch, useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import * as ImagePicker from "expo-image-picker";
import useUploadImage from "@/src/hooks/useUploadImage";
import { setAvatar, setAvatarInAsyncStorage } from "@/src/store/authSlice";

const EditProfileComponent = ({
  firstName,
  lastName,
  email,
  phone,
  setFirstName,
  setLastName,
  setEmail,
  setPhone,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  setFirstName: React.Dispatch<React.SetStateAction<string>>;
  setLastName: React.Dispatch<React.SetStateAction<string>>;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  setPhone: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const { user_id, avatar } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const { imageUri, setImageUri, uploadImage, responseData } = useUploadImage(
    "CUSTOMER",
    user_id || "CUS_ee0966ee-d3dd-49e6-bc20-73e2dab6a593"
  );

  const selectImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (result && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      uploadImage(asset.uri);
    }
  };
  useEffect(() => {
    if (responseData?.EC === 0) {
      dispatch(setAvatar(responseData.data.avatar)); // This updates Redux state
      dispatch(setAvatarInAsyncStorage(responseData.data.avatar)); // This updates AsyncStorage
    }
  }, [responseData]);

  return (
    <View
      style={{ elevation: 10 }}
      className="bg-white rounded-xl border gap-4 border-gray-200 p-4"
    >
      <View className="items-center">
        <TouchableOpacity onPress={selectImage}>
          {imageUri ? (
            <FFAvatar onPress={selectImage} size={80} avatar={imageUri} />
          ) : (
            <FFAvatar onPress={selectImage} avatar={avatar?.url} size={80} />
          )}
        </TouchableOpacity>
      </View>

      <FFInputControl
        value={firstName}
        setValue={setFirstName}
        label="First Name"
        placeholder="Tommy"
        error=""
      />
      <FFInputControl
        value={lastName}
        setValue={setLastName}
        label="Last Name"
        placeholder="Teo"
        error=""
      />
      <FFInputControl
        value={email}
        setValue={setEmail}
        label="Email"
        disabled
        placeholder="teo@gmail.com"
        error=""
      />
      <FFInputControl
        value={phone}
        setValue={setPhone}
        label="Phone Number"
        placeholder="(+84) 707171164"
        error=""
      />
    </View>
  );
};

export default EditProfileComponent;
