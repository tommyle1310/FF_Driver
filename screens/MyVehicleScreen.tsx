import { View, Text, TouchableOpacity, ScrollView } from "react-native";
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
import {
  loadTokenFromAsyncStorage,
  saveVehicleDetailsToAsyncStorage,
  updateVehicle,
} from "@/src/store/authSlice";

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
  const [licensePlate, setLicensePlate] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [owner, setOwner] = useState<string>("");
  const [year, setYear] = useState<string>("0");
  const [isShowModalSuccess, setIsShowModalSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { driverId, vehicle } = useSelector((state: RootState) => state.auth);

  const handleSaveChanges = async () => {
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

      const { EC, EM, data } = response.data;
      if (EC === 0) {
        dispatch(updateVehicle(requestData));
        dispatch(saveVehicleDetailsToAsyncStorage(requestData));
        console.log("check data", data);
        setIsShowModalSuccess(true);
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
          <CoralTourCarousel
            imageUrls={[
              "https://res.cloudinary.com/dpubnzap3/image/upload/v1738818798/ei6ycutzsexeu90e8bxn.png",
              "https://res.cloudinary.com/dpubnzap3/image/upload/v1738818798/ei6ycutzsexeu90e8bxn.png",
              "https://res.cloudinary.com/dpubnzap3/image/upload/v1738818798/ei6ycutzsexeu90e8bxn.png",
            ]}
          />
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
                  <FFText>{vehicle?.brand}</FFText>
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
                  <FFText>{vehicle?.owner}</FFText>
                </View>
                <View className="flex-row justify-between items-center">
                  <FFText fontWeight="400">Year</FFText>
                  <FFText>{vehicle?.year}</FFText>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
      <FFModal
        onClose={() => setIsShowModalSuccess(false)}
        visible={isShowModalSuccess}
      >
        <FFText>You have successfully updated your vehicle details</FFText>
      </FFModal>
    </FFSafeAreaView>
  );
};

export default MyVehicleScreen;
