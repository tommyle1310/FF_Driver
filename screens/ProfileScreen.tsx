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
  contact_phone: { number: string; title: string; is_default: boolean }[];
  contact_email: { email: string; title: string; is_default: boolean }[];
  user?: {
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
  const { driverId, email: emailRedux } = useSelector(
    (state: RootState) => state.auth
  );
  const [profileData, setProfileData] = useState<Props_ProfileData | null>(
    null
  );

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axiosInstance.get(`/drivers/${driverId}`);
        const { EC, EM, data } = response.data;
        if (EC === 0) {
          setProfileData(data);
        } else {
          console.error("Error fetching profile data:", EM);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
    fetchProfileData();
  }, [driverId]);

  useEffect(() => {
    if (profileData) {
      console.log("Profile data is defined");

      const { first_name, last_name, user, contact_email, contact_phone } =
        profileData;
      let firstNameState = first_name || (user && user.first_name) || "";
      let lastNameState = last_name || (user && user.last_name) || "";
      let emailState = user
        ? user.email
        : contact_email.find((item) => item.is_default)?.email ||
          emailRedux ||
          "";
      let phoneState = user
        ? user.phone
        : contact_phone.find((item) => item.is_default)?.number || "";

      console.log(
        "check here",
        contact_email.find((item) => item.is_default)?.email
      );

      setEmail(emailState);
      setPhone(phoneState);
      setFirstName(firstNameState);
      setLastName(lastNameState);
    }
  }, [profileData]);

  console.log("Check profile data", email, phone);

  return (
    <FFSafeAreaView>
      <FFScreenTopSection title="My Profile" navigation={navigation} />
      <View className="p-4">
        {screenStatus === "READONLY" ? (
          <ReadonlyProfileComponents
            email={email}
            phone={phone}
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
