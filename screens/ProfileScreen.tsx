import { FlatList, Image, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import axiosInstance from "@/src/utils/axiosConfig";
import IconAntDesign from "react-native-vector-icons/AntDesign";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import EditProfileComponent from "@/src/components/screens/Profile/EditProfileComponent";
import ReadonlyProfileComponents from "@/src/components/screens/Profile/ReadonlyProfileComponents";
import FFText from "@/src/components/FFText";
import IconMaterialIcons from "react-native-vector-icons/MaterialIcons";
import IconMaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import FFAvatar from "@/src/components/FFAvatar";
import theme from "@/src/theme";
import FFModal from "@/src/components/FFModal";

type ProfileSreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "Profile"
>;

type ReviewItem = {
  id: string;
  reviewer: {
    avatar: { url: string; key: string };
    first_name: string;
    last_name: string;
  };
  rating: number;
  review: string;
  updated_at: string;
  images: { url: string; key: string }[];
};

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
  const [reviewsData, setReviewsData] = useState<any>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axiosInstance.get(
          `/drivers/${driverId}/ratings-reviews`
        );
        const { EC, EM, data } = response.data;
        console.log("check response", response.data);
        if (EC === 0) {
          setReviewsData(data);
        } else {
          setErrorMessage(EM);
          setShowErrorModal(true);
        }
      } catch (error) {
        setErrorMessage("Error fetching reviews");
        setShowErrorModal(true);
      }
    };
    fetchReviews();
  }, [driverId]);

  console.log("Check profile data", email, phone);

  return (
    <FFSafeAreaView>
      <FFScreenTopSection title="My Profile" navigation={navigation} />
      <View className="p-4 gap-4">
        {screenStatus === "READONLY" ? (
          <>
            <ReadonlyProfileComponents
              email={email}
              phone={phone}
              toggleStatus={() => setScreenStatus("EDIT_PROFILE")}
            />
            <View className="gap-2">
              <FFText>Overview</FFText>
              <View className="flex-row items-center gap-2">
                <View
                  style={{ elevation: 3 }}
                  className="flex-1 p-4 items-center rounded-lg bg-white"
                >
                  <View className="p-1 rounded-full bg-[#cdcd0c]">
                    <IconAntDesign name="star" size={12} color="#fff" />
                  </View>
                  <FFText>
                    {reviewsData?.average_delivery_rating?.toFixed(1) || "0.0"}
                  </FFText>
                  <FFText fontSize="sm" fontWeight="400">
                    Ratings
                  </FFText>
                </View>
                <View
                  style={{ elevation: 3 }}
                  className="flex-1 p-4 items-center rounded-lg bg-white"
                >
                  <View className="p-1 rounded-full bg-[#4d9c39]">
                    <IconMaterialIcons
                      name="delivery-dining"
                      size={12}
                      color="#fff"
                    />
                  </View>
                  <FFText>{reviewsData?.total_reviews || 0}</FFText>
                  <FFText fontSize="sm" fontWeight="400">
                    Total Reviews
                  </FFText>
                </View>
                <View
                  style={{ elevation: 3 }}
                  className="flex-1 p-4 items-center rounded-lg bg-white"
                >
                  <View className="p-1 rounded-full bg-[#d21f3c]">
                    <IconMaterialCommunityIcons
                      name="cancel"
                      size={12}
                      color="#fff"
                    />
                  </View>
                  <FFText>10%</FFText>
                  <FFText fontSize="sm" fontWeight="400">
                    Cancel Rate
                  </FFText>
                </View>
              </View>
            </View>
            <View className="gap-2">
              <View className="flex-row items-cente justify-between gap-2">
                <FFText>Reviews</FFText>
                <TouchableOpacity onPress={() => navigation.navigate("RatingsReviews")}>
                  <FFText fontWeight="400" style={{ color: "#4d9c39" }}>
                    See All
                  </FFText>
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                className="py-2"
                data={reviewsData?.reviews || []}
                renderItem={({ item }) => (
                  <View
                    style={{ elevation: 3, maxWidth: 200 }}
                    className="flex-1 p-4 gap-2 items-center rounded-lg bg-white"
                  >
                    <View className="flex-row justify-start w-full items-center gap-2">
                      {item.reviewer?.avatar ? (
                        <Image
                          source={{ uri: item.reviewer.avatar.url }}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <FFAvatar size={40} />
                      )}
                      <FFText>
                        {item.reviewer?.first_name
                          ? `${item.reviewer.first_name} ${item.reviewer.last_name}`
                          : item.reviewer?.name || "Anonymous"}
                      </FFText>
                    </View>
                    <View className="w-full flex-row justify-between items-center">
                      <View className="flex-row items-center gap-1">
                        <IconAntDesign name="star" size={12} color="#4d9c39" />
                        <FFText fontWeight="400" fontSize="sm">
                          {item.delivery_rating}
                        </FFText>
                      </View>
                      <FFText
                        fontWeight="400"
                        fontSize="sm"
                        style={{ color: "#aaa" }}
                      >
                        {new Date(item.created_at * 1000).toLocaleDateString()}
                      </FFText>
                    </View>
                    <View style={{ width: "100%" }}>
                      <FFText
                        fontSize="sm"
                        fontWeight="500"
                        style={{ textAlign: "left" }}
                      >
                        {item.delivery_review ||
                          item.food_review ||
                          "No review text"}
                      </FFText>
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              />
            </View>
          </>
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
      <FFModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
      >
        <View className="p-4 gap-4">
          <FFText fontSize="lg" fontWeight="600" className="text-center">
            Error
          </FFText>
          <FFText className="text-center">{errorMessage}</FFText>
          <TouchableOpacity
            onPress={() => setShowErrorModal(false)}
            className="bg-[#4d9c39] p-3 rounded-lg items-center"
          >
            <FFText style={{ color: "#fff" }}>OK</FFText>
          </TouchableOpacity>
        </View>
      </FFModal>
    </FFSafeAreaView>
  );
};

export default ProfileScreen;
