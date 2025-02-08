import { TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import axiosInstance from "@/src/utils/axiosConfig";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import EditProfileComponent from "@/src/components/screens/Profile/EditProfileComponent";
import ReadonlyProfileComponents from "@/src/components/screens/Profile/ReadonlyProfileComponents";

type ProfileSreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "Profile"
>;

interface Props_ProfileData {
  _id: string;
  user_Id: string;
  avatar: { url: string; key: string };
  address: string[];
  first_name: string;
  last_name: string;
  user: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    is_verified: boolean;
  };
}

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileSreenNavigationProp>();
  const [screenStatus, setScreenStatus] = useState<"READONLY" | "EDIT_PROFILE">(
    "READONLY"
  );
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const { driverId } = useSelector((state: RootState) => state.auth);
  const [profileData, setProfileData] = useState<Props_ProfileData>({
    _id: "",
    user_Id: "",
    avatar: { url: "", key: "" },
    address: [""],
    first_name: "",
    last_name: "",
    user: {
      _id: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      is_verified: false,
    },
  });
  useEffect(() => {
    const fetchProfileData = async () => {
      const response = await axiosInstance.get(`/customers/${driverId}`);
      const { EC, EM, data } = response.data;
      if (EC === 0) {
        setProfileData(data);
      }
    };
    fetchProfileData();
  }, [driverId]);
  useEffect(() => {
    const { _id, address, avatar, first_name, last_name, user, user_Id } =
      profileData;
    let firstNameState;
    let lastNameState;
    if (first_name) {
      firstNameState = first_name;
    } else {
      firstNameState = user.first_name ? user.first_name : "";
    }
    if (last_name) {
      lastNameState = last_name;
    } else {
      lastNameState = user.last_name ? user.last_name : "";
    }
    if (profileData) {
      setEmail(profileData.user.email);
      setPhone(profileData.user.phone);
      setFirstName(firstNameState);
      setLastName(lastNameState);
    }
  }, [profileData]);

  return (
    <FFSafeAreaView>
      <FFScreenTopSection title="My Profile" navigation={navigation} />
      <View className="p-4">
        {screenStatus === "READONLY" ? (
          <ReadonlyProfileComponents
            toggleStatus={() => setScreenStatus("EDIT_PROFILE")}
          />
        ) : (
          <EditProfileComponent
            email={email}
            firstName={firstName}
            lastName={lastName}
            phone={phone}
            setEmail={setEmail}
            setFirstName={setFirstName}
            setLastName={setLastName}
            setPhone={setPhone}
          />
        )}
      </View>
    </FFSafeAreaView>
  );
};

export default ProfileScreen;
