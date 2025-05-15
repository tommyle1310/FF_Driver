import { useState } from "react";
import { Alert } from "react-native";
import axiosInstance from "@/src/utils/axiosConfig";

const useUploadImage = (
  userType:
    | "CUSTOMER"
    | "DRIVER"
    | "ADMIN"
    | "RESTAURANT_OWNER"
    | "CUSTOMER_CARE_REPRESENTATIVE"
    | "F_WALLET"
    | "MENU_ITEM",
  entityId: string | undefined
) => {
  const [imageUri, setImageUri] = useState<string | null | undefined>(null);
  const [responseData, setResponseData] = useState<any>(null); // State to store response data
  const [loading, setLoading] = useState<boolean>(false); // State to track loading

  const uploadImage = async (uri: string | null) => {
    if (uri) {
      setLoading(true); // Set loading to true when the upload starts
      try {
        const formData = new FormData();
        formData.append("file", {
          uri,
          name: uri.split("/").pop() || "image.jpg",
          type: "image/jpeg",
        } as unknown as Blob);

        formData.append("userType", userType); // Use the userType parameter here
        formData.append("entityId", entityId || ""); // Use the entityId parameter here

        const response = await axiosInstance.post("upload/avatar", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          validateStatus: () => true, // Always return true to prevent axios from throwing on errors
        });

        const { EC, EM, data } = response.data;
        console.log("check what the fuck", EC, EM, data);
        if (EC === 0) {
          console.log("uploaded successfully");

          setResponseData(data); // Store the response data
        } else {
          Alert.alert("Error", EM || "Failed to upload image");
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "An error occurred while uploading the image");
      } finally {
        setLoading(false); // Set loading to false when the upload finishes
      }
    }
  };

  return {
    imageUri,
    setImageUri,
    uploadImage,
    responseData, // Return responseData along with other state and functions
    loading, // Return loading state
  };
};

export default useUploadImage;
