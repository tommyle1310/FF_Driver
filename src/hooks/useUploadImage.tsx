import { useState } from "react";
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
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const uploadImage = async (uri: string | null) => {
    if (uri) {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", {
          uri,
          name: uri.split("/").pop() || "image.jpg",
          type: "image/jpeg",
        } as unknown as Blob);

        formData.append("userType", userType);
        formData.append("entityId", entityId || "");

        const response = await axiosInstance.post("upload/avatar", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          validateStatus: () => true,
        });

        const { EC, EM, data } = response.data;

        if (EC === 0) {
          setResponseData({
            ...data,
            responseDetails: {
              status: "success",
              details: "Image uploaded successfully",
            },
          });
        } else {
          setResponseData({
            responseDetails: {
              status: "fail",
              details: EM || "Failed to upload image",
            },
          });
        }
      } catch (error) {
        console.error(error);
        setResponseData({
          responseDetails: {
            status: "fail",
            details: "An error occurred while uploading the image",
          },
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    imageUri,
    setImageUri,
    uploadImage,
    responseData,
    loading,
  };
};

export default useUploadImage;
