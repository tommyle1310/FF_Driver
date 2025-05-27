import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Pressable,
} from "react-native";
import React, { useEffect, useState } from "react";
import FFView from "@/src/components/FFView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import CoralTourCarousel from "@/src/components/CoralTourCarosel";
import FFText from "@/src/components/FFText";
import FFSeperator from "@/src/components/FFSeperator";
import FFButton from "@/src/components/FFButton";
import FFInputControl from "@/src/components/FFInputControl";
import axiosInstance from "@/src/utils/axiosConfig";
import { useDispatch, useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import FFModal from "@/src/components/FFModal";
import Spinner from "@/src/components/FFSpinner";
import useUploadImage from "@/src/hooks/useUploadImage";
import {
  loadTokenFromAsyncStorage,
  saveVehicleDetailsToAsyncStorage,
  updateVehicle,
} from "@/src/store/authSlice";
import * as ImagePicker from "expo-image-picker";
import { IMAGE_LINKS } from "@/src/assets/imageLinks";

type MyVehicleScreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "MyVehicles"
>;

interface VehicleUpdateFormProps {
  licensePlate: string;
  setLicensePlate: React.Dispatch<React.SetStateAction<string>>;
  brand: string;
  setBrand: React.Dispatch<React.SetStateAction<string>>;
  model: string;
  setModel: React.Dispatch<React.SetStateAction<string>>;
  color: string;
  setColor: React.Dispatch<React.SetStateAction<string>>;
  owner: string;
  setOwner: React.Dispatch<React.SetStateAction<string>>;
  year: string;
  setYear: React.Dispatch<React.SetStateAction<string>>;
  handleSaveChanges: () => void;
}

const VehicleUpdateForm = ({
  licensePlate,
  setLicensePlate,
  brand,
  setBrand,
  model,
  setModel,
  color,
  setColor,
  owner,
  setOwner,
  year,
  handleSaveChanges,
  setYear,
}: VehicleUpdateFormProps) => {
  return (
    <>
      <FFInputControl
        value={licensePlate}
        setValue={setLicensePlate}
        label="License Plate"
        placeholder="51D2 - 99421"
        error=""
      />
      <FFInputControl
        value={color}
        setValue={setColor}
        label="Color"
        placeholder="Red"
        error=""
      />
      <FFInputControl
        value={brand}
        setValue={setBrand}
        label="Brand"
        placeholder="Honda"
        error=""
      />
      <FFInputControl
        value={model}
        setValue={setModel}
        label="Model"
        placeholder="Winner X"
        error=""
      />
      <FFInputControl
        value={owner}
        setValue={setOwner}
        label="Owner"
        placeholder="John Doe"
        error=""
      />
      <FFInputControl
        value={`${year}`}
        setValue={setYear}
        label="year"
        placeholder="2021"
        error=""
      />

      <FFButton className="w-full" onPress={handleSaveChanges}>
        Save Changes
      </FFButton>
    </>
  );
};

const MyVehicleScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<MyVehicleScreenNavigationProp>();
  const [isUpdateStatus, setIsUpdateStatus] = useState<boolean>(false);
  const [licensePlate, setLicensePlate] = useState<string>("51D2 - 99421");
  const [brand, setBrand] = useState<string>("Honda");
  const [model, setModel] = useState<string>("WinnerX");
  const [color, setColor] = useState<string>("Red");
  const [owner, setOwner] = useState<string>("Tommy Teo");
  const [year, setYear] = useState<string>("2020");
  const [modalStatusDetails, setModalStatusDetails] = useState<{
    status: "SUCCESS" | "FAILED" | "HIDDEN";
    details?: string;
  }>({ status: "HIDDEN" });
  const [loading, setLoading] = useState<boolean>(false);
  const { driverId, vehicle } = useSelector((state: RootState) => state.auth);
  const {
    imageUri,
    setImageUri,
    uploadImage,
    responseData,
    loading: loadingSelectImg,
  } = useUploadImage(
    "DRIVER",
    driverId || "FF_DRI_b64aa8b7-3964-46a4-abf4-924c5515f57a"
  );
  const [frontViewImg, setFrontViewImg] = useState<string | undefined>(
    undefined
  );
  const [backViewImg, setBackViewImg] = useState<string | undefined>(undefined);
  const [rightViewImg, setRightViewImg] = useState<string | undefined>(
    undefined
  );
  const [leftViewImg, setLeftViewImg] = useState<string | undefined>(undefined);

  const selectFrontViewImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (result && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setFrontViewImg(asset.uri);
    }
  };

  const selectBackViewImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (result && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setBackViewImg(asset.uri);
    }
  };

  const selectRightViewImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (result && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setRightViewImg(asset.uri);
    }
  };

  const selectLeftViewImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (result && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setLeftViewImg(asset.uri);
    }
  };

  const uploadDriverVehicleImages = async (uris: string[]) => {
    if (uris.length > 0) {
      setLoading(true);
      try {
        const formData = new FormData();

        uris.forEach((uri) => {
          formData.append("files", {
            uri,
            name: uri.split("/").pop() || "image.jpg",
            type: "image/jpeg",
          } as unknown as Blob);
        });

        formData.append("userType", "DRIVER");
        formData.append("entityId", driverId || "");

        const response = await axiosInstance.post(
          "upload/galleries",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            validateStatus: () => true,
          }
        );
        console.log("check response.data img uploda buld", response.data);

        const { EC, EM, data } = response.data;

        if (EC === 0) {
          setModalStatusDetails({
            status: "SUCCESS",
            details: "Images uploaded successfully",
          });
        } else {
          setModalStatusDetails({
            status: "FAILED",
            details: EM || "Failed to upload images",
          });
        }
      } catch (error) {
        console.error(error);
        setModalStatusDetails({
          status: "FAILED",
          details: "An error occurred while uploading the images",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveChanges = async () => {
    if (!licensePlate || !brand || !model || !color || !owner || !year) {
      setModalStatusDetails({
        status: "FAILED",
        details: "Please fill in all fields",
      });
      return;
    }
    if (!frontViewImg || !backViewImg || !leftViewImg || !rightViewImg) {
      setModalStatusDetails({
        status: "FAILED",
        details: "Please provide all views of your vehicle",
      });
      return;
    }
    const requestData = {
      license_plate: licensePlate,
      brand,
      model,
      color,
      owner,
      year: +year,
    };
    setLoading(true);
    try {
      const response = await axiosInstance.patch(
        `/drivers/vehicle/${driverId}`,
        requestData,
        {
          validateStatus: () => true,
        }
      );
      await uploadDriverVehicleImages([
        frontViewImg,
        backViewImg,
        leftViewImg,
        rightViewImg,
      ]);

      const { EC, EM, data } = response.data;
      if (EC === 0) {
        dispatch(updateVehicle(requestData));
        dispatch(saveVehicleDetailsToAsyncStorage(requestData));
        console.log("check data", data);
        setModalStatusDetails({
          status: "SUCCESS",
          details: "You have successfully updated your vehicle details",
        });
        setIsUpdateStatus(false);
      }
    } catch (error) {
      console.error("Error updating vehicle:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dispatch(loadTokenFromAsyncStorage());
  }, []);

  useEffect(() => {
    setBrand(vehicle?.brand ?? "");
    setColor(vehicle?.color ?? "");
    setYear(vehicle?.year ? `${vehicle.year}` : "2000");
    setModel(vehicle?.model ?? "");
    setOwner(vehicle?.owner ?? "");
    setLicensePlate(vehicle?.license_plate ?? "");
  }, [vehicle]);

  const handleToggleUpdateVehicle = () => {
    setIsUpdateStatus(!isUpdateStatus);
  };

  if (loading) {
    return <Spinner isVisible={loading} isOverlay />;
  }

  return (
    <FFSafeAreaView>
      <ScrollView>
        <FFScreenTopSection title="My Vehicle" navigation={navigation} />
        <View className="p-4 gap-4">
          <View className="justify-between flex-row items-center">
            <FFText>My Vehicle</FFText>
            <TouchableOpacity onPress={handleToggleUpdateVehicle}>
              <FFText
                fontSize="sm"
                fontWeight="700"
                style={{ color: "#4a9e3e", textDecorationLine: "underline" }}
              >
                {isUpdateStatus ? "Close" : "Update Vehicle Details"}
              </FFText>
            </TouchableOpacity>
          </View>
          {isUpdateStatus ? (
            <View className="flex-row items-center gap-4">
              {[
                {
                  title: "Front View",
                  image: frontViewImg,
                  onPress: selectFrontViewImage,
                },
                {
                  title: "Back View",
                  image: backViewImg,
                  onPress: selectBackViewImage,
                },
                {
                  title: "Right View",
                  image: rightViewImg,
                  onPress: selectRightViewImage,
                },
                {
                  title: "Left View",
                  image: leftViewImg,
                  onPress: selectLeftViewImage,
                },
              ].map((view, index) => (
                <Pressable
                  key={index}
                  onPress={view.onPress}
                  className="flex-1 gap-2"
                >
                  <FFText fontSize="sm">{view.title}</FFText>
                  <Image
                    source={{
                      uri: view.image ?? IMAGE_LINKS.DEFAULT_LOGO,
                    }}
                    style={{ width: 60, height: 60, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </View>
          ) : (
            <CoralTourCarousel
              imageUrls={[
                vehicle?.images?.[vehicle?.images?.length - 4]?.url ?? IMAGE_LINKS.DEFAULT_LOGO,
                vehicle?.images?.[vehicle?.images?.length - 3]?.url ?? IMAGE_LINKS.DEFAULT_LOGO,
                vehicle?.images?.[vehicle?.images?.length - 2]?.url ?? IMAGE_LINKS.DEFAULT_LOGO,
                vehicle?.images?.[vehicle?.images?.length - 1]?.url ?? IMAGE_LINKS.DEFAULT_LOGO,
              ]}
            />
          )}
          <View
            style={{ elevation: 3 }}
            className="p-4 bg-white rounded-lg gap-2"
          >
            {isUpdateStatus ? (
              <VehicleUpdateForm
                handleSaveChanges={handleSaveChanges}
                licensePlate={licensePlate}
                setLicensePlate={setLicensePlate}
                brand={brand}
                setBrand={setBrand}
                model={model}
                setModel={setModel}
                color={color}
                setColor={setColor}
                owner={owner}
                setOwner={setOwner}
                year={year}
                setYear={setYear}
              />
            ) : (
              <>
                <FFText style={{ marginBottom: 12 }}>Vehicle Details</FFText>
                <View className="flex-row justify-between items-center">
                  <FFText fontWeight="400">License Plate</FFText>
                  <FFText>{vehicle?.license_plate}</FFText>
                </View>
                <View className="flex-row justify-between items-center">
                  <FFText fontWeight="400">Brand</FFText>
                  <FFText>{vehicle?.brand ?? "coming soon..."}</FFText>
                </View>
                <View className="flex-row justify-between items-center">
                  <FFText fontWeight="400">Model</FFText>
                  <FFText>{vehicle?.model}</FFText>
                </View>
                <View className="flex-row justify-between items-center">
                  <FFText fontWeight="400">Color</FFText>
                  <FFText>{vehicle?.color}</FFText>
                </View>
                <View className="flex-row justify-between items-center">
                  <FFText fontWeight="400">Owner</FFText>
                  <FFText>{vehicle?.owner ?? "coming soon..."}</FFText>
                </View>
                <View className="flex-row justify-between items-center">
                  <FFText fontWeight="400">Year</FFText>
                  <FFText>{vehicle?.year ?? "coming soon..."}</FFText>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
      <FFModal
        onClose={() => setModalStatusDetails({ status: "HIDDEN" })}
        visible={modalStatusDetails.status !== "HIDDEN"}
      >
        <FFText>{modalStatusDetails.details}</FFText>
      </FFModal>
    </FFSafeAreaView>
  );
};

export default MyVehicleScreen;
