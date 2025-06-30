import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFText from "@/src/components/FFText";
import FFButton from "@/src/components/FFButton";
import IconAntDesign from "react-native-vector-icons/AntDesign";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import axiosInstance from "@/src/utils/axiosConfig";
import { StackNavigationProp } from "@react-navigation/stack";
import FFAvatar from "@/src/components/FFAvatar";
import Spinner from "@/src/components/FFSpinner";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import {
  clearDriverProgressStage,
  clearState,
} from "@/src/store/currentDriverProgressStageSlice";
import { useSocket } from "@/src/hooks/useSocket";

type RatingScreenRouteProp = RouteProp<SidebarStackParamList, "Rating">;

type RatingScreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "Rating"
>;

const RatingScreen = () => {
  const dispatch = useDispatch();

  const navigation = useNavigation<RatingScreenNavigationProp>();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const route = useRoute<RatingScreenRouteProp>();
  const { customer1, restaurant1, orderId } = route.params;
  const [typeRating, setTypeRating] = useState<"CUSTOMER" | "RESTAURANT">(
    "RESTAURANT"
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const handleRatingPress = (index: number) => {
    setRating(index);
  };
  const { driverId } = useSelector((state: RootState) => state.auth);
  
  // 🔧 POST-RATING BLOCKING: Get the blocking function from useSocket
  const { blockDriverStagesUpdatesAfterRating } = useSocket(
    driverId || "",
    () => {},
    () => {},
    () => {}
  );

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const requestData = {
        rr_reviewer_driver_id: driverId,
        reviewer_type: "driver",
        rr_recipient_customer_id:
          typeRating === "CUSTOMER"
            ? customer1.id.split("_dropoff")[0]
            : undefined,
        rr_recipient_restaurant_id:
          typeRating === "RESTAURANT"
            ? restaurant1.id.split("_pickup")[0]
            : undefined,
        recipient_type: typeRating === "RESTAURANT" ? "restaurant" : "customer",
        order_id: orderId,
        food_rating: rating,
        delivery_rating: rating,
        food_review: review,
        delivery_review: review,
      };
      console.log("Rating submitted", requestData);

      const response = await axiosInstance.post(
        "/ratings-reviews",
        requestData,
        {
          validateStatus: () => true,
        }
      );
      console.log("check response data", response.data);

      const { EC, EM, data } = response.data;
      if (EC === 0) {
        setIsLoading(false);
        if (typeRating === "RESTAURANT") {
          setRating(0);
          setReview("");
          setTypeRating("CUSTOMER");
          return;
        }
        
        // 🔧 POST-RATING BLOCKING: Block all driverStagesUpdated events for 2 minutes
        console.log("🚫 POST-RATING: Activating 2-minute block on driverStagesUpdated events");
        blockDriverStagesUpdatesAfterRating(120000); // Block for 2 minutes
        
        dispatch(clearDriverProgressStage());
        dispatch(clearState());
        navigation.navigate("Home", {});
      } else {
        console.error("Error submitting rating:", EM);
      }
    } catch (error) {
      console.error("Error submitting rating", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Spinner isVisible isOverlay />;
  }

  return (
    <FFSafeAreaView>
      <View style={styles.container}>
        {/* Title */}
        <FFText fontSize="lg" fontWeight="600" style={styles.title}>
          Rate your {typeRating === "RESTAURANT" ? "restaurant" : "customer"}
        </FFText>

        {/* Diamond Image */}
        <FFAvatar
          avatar={
            (typeRating === "RESTAURANT"
              ? restaurant1?.avatar?.url
              : customer1?.avatar?.url) ?? undefined
          }
        />

        {/* Star Rating */}
        <View style={styles.starContainer}>
          {[1, 2, 3, 4, 5].map((index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleRatingPress(index)}
            >
              <IconAntDesign
                name="star"
                size={32}
                color={index <= rating ? "#FFC107" : "#E0E0E0"}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Review Input */}
        <TextInput
          style={styles.textInput}
          placeholder="Type your review ..."
          placeholderTextColor="#aaa"
          value={review}
          onChangeText={setReview}
          multiline
        />

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <FFButton
            variant="outline"
            onPress={() => {
              // 🔧 POST-RATING BLOCKING: Block all driverStagesUpdated events for 2 minutes
              console.log("🚫 POST-RATING SKIP: Activating 2-minute block on driverStagesUpdated events");
              blockDriverStagesUpdatesAfterRating(120000); // Block for 2 minutes
              
              dispatch(clearDriverProgressStage());
              dispatch(clearState());
              navigation.reset({
                index: 0,
                routes: [{ name: "Home", params: { screenIndex: 0 } }],
              });
            }}
            style={styles.skipButton}
          >
            Skip
          </FFButton>
          <FFButton onPress={handleSubmit} style={styles.submitButton}>
            Submit
          </FFButton>
        </View>
      </View>
    </FFSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 64,
    gap: 12,
    backgroundColor: "#fff",
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 24,
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 64,
  },
  textInput: {
    width: "100%",
    height: 100,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    marginBottom: 24,
    fontSize: 16,
    color: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  skipButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "transparent",
  },
  submitButton: {
    flex: 1,
    width: "100%",
    marginLeft: 8,
    // backgroundColor: "#FF6F61",
  },
});

export default RatingScreen;
