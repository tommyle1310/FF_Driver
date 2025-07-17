import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState } from "react";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import axiosInstance from "@/src/utils/axiosConfig";
import IconAntDesign from "react-native-vector-icons/AntDesign";
import FFText from "@/src/components/FFText";
import FFAvatar from "@/src/components/FFAvatar";
import { colors, spacing, typography } from "@/src/theme";
import FFModal from "@/src/components/FFModal";
import { MainStackParamList } from "@/src/navigation/AppNavigator";
import { StackNavigationProp } from "@react-navigation/stack";
import FFJBRowItem from "@/src/components/FFJBRowItems";
import FFSkeleton from "@/src/components/FFSkeleton";

type RatingsReviewsScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  "RatingsReviews"
>;

interface ReviewerType {
  id: string;
  first_name: string;
  last_name: string;
  avatar?: {
    url: string;
    key: string;
  };
}

interface ReviewType {
  id: string;
  reviewer_type: "customer" | "driver";
  recipient_type: "customer" | "driver";
  reviewer: ReviewerType;
  food_rating: number;
  delivery_rating: number;
  food_review: string | null;
  delivery_review: string | null;
  images: { url: string; key: string }[] | null;
  created_at: number;
  order_id: string;
}

interface RatingsData {
  restaurant_id: string;
  total_reviews: number;
  average_food_rating: number;
  average_delivery_rating: number;
  reviews: ReviewType[];
}

const RatingsReviewsScreen = () => {
  const navigation = useNavigation<RatingsReviewsScreenNavigationProp>();
  const { driverId } = useSelector((state: RootState) => state.auth);
  const [ratingsData, setRatingsData] = useState<RatingsData | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
const [loading, setLoading] = useState(true);

  const fetchRatingsData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/drivers/${driverId}/ratings-reviews`
      );
      const { EC, EM, data } = response.data;
      if (EC === 0) {
        setRatingsData(data);
      } else {
        setErrorMessage(EM);
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage("Error fetching ratings and reviews");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRatingsData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRatingsData();
  }, [driverId]);

  const renderRatingStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <IconAntDesign
            key={star}
            name="star"
            size={14}
            color={star <= rating ? colors.primary : colors.textSecondary}
          />
        ))}
      </View>
    );
  };

  const renderReviewCard = ({ item }: { item: ReviewType }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          {item.reviewer?.avatar ? (
            <Image
              source={{ uri: item.reviewer.avatar.url }}
              style={styles.avatar}
            />
          ) : (
            <FFAvatar size={40} />
          )}
          <View>
            <FFText style={styles.reviewerName}>
              {item?.reviewer?.first_name
                ? `${item?.reviewer?.first_name} ${item?.reviewer?.last_name}`
                : "Anonymous"}
            </FFText>
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                gap: spacing.md,
                // justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <FFText style={styles.reviewerType}>
                {item.reviewer_type.charAt(0).toUpperCase() +
                  item.reviewer_type.slice(1)}
              </FFText>
              <View>{renderRatingStars(item?.food_rating || 0)}</View>
            </View>
          </View>
        </View>
        <FFText style={styles.reviewDate}>
          {new Date(item.created_at * 1000).toLocaleDateString()}
        </FFText>
      </View>

      {(item.food_review || item.delivery_review) && (
        <View style={styles.reviewContent}>
          {item.food_review && (
            <FFText style={styles.reviewText}>{item.food_review}</FFText>
          )}
          {item.delivery_review && (
            <FFText style={styles.reviewText}>{item.delivery_review}</FFText>
          )}
        </View>
      )}
    </View>
  );

    const renderSkeletonStatCard = () => (
    <View style={styles.statCard}>
      <FFSkeleton width={40} height={30} style={{ marginBottom: spacing.xs }} />
      <FFSkeleton width={80} height={16} style={{ marginBottom: spacing.xs }} />
      <FFSkeleton width={100} height={14} />
    </View>
  );

  const renderSkeletonReviewCard = () => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <FFSkeleton width={40} height={40} style={{ borderRadius: 20 }} />
          <View>
            <FFSkeleton width={120} height={18} style={{ marginBottom: spacing.xs }} />
            <FFSkeleton width={80} height={14} />
          </View>
        </View>
        <FFSkeleton width={80} height={14} />
      </View>
      <View style={styles.reviewContent}>
        <FFSkeleton width="100%" height={16} style={{ marginBottom: spacing.xs }} />
        <FFSkeleton width="90%" height={16} style={{ marginBottom: spacing.xs }} />
        <FFSkeleton width="80%" height={16} />
      </View>
    </View>
  );

  return (
    <FFSafeAreaView>
      <FFScreenTopSection title="Ratings & Reviews" navigation={navigation} />

      <View style={styles.container}>
        { loading ?
        (
          <>
            <View style={styles.statsContainer}>
              {renderSkeletonStatCard()}
              {renderSkeletonStatCard()}
              {renderSkeletonStatCard()}
            </View>
            <View style={styles.reviewsList}>
              {[1, 2, 3].map((item) => (
                <View key={item}>{renderSkeletonReviewCard()}</View>
              ))}
            </View>
          </>
        ) : 
        ratingsData && (
          <>
            <View style={styles.statsContainer}>

              <View style={styles.statCard}>
                <FFText style={styles.statValue}>
                  {ratingsData.average_delivery_rating.toFixed(1)}
                </FFText>
                <FFText style={styles.statLabel}>Delivery Rating</FFText>
                {renderRatingStars(
                  Math.round(ratingsData.average_delivery_rating)
                )}
              </View>

              <View style={styles.statCard}>
                <FFText style={styles.statValue}>
                  {ratingsData.total_reviews}
                </FFText>
                <FFText style={styles.statLabel}>Total Reviews</FFText>
              </View>
            </View>

            <FlatList
              data={ratingsData.reviews?.filter(item => !item.food_review)?.filter(item => item.delivery_review)}
              renderItem={renderReviewCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.reviewsList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          </>
        )}
      </View>

      <FFModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalContent}>
          <FFText fontSize="lg" fontWeight="600" style={styles.modalTitle}>
            Error
          </FFText>
          <FFText style={styles.modalMessage}>{errorMessage}</FFText>
          <TouchableOpacity
            onPress={() => setShowErrorModal(false)}
            style={styles.modalButton}
          >
            <FFText style={styles.modalButtonText}>OK</FFText>
          </TouchableOpacity>
        </View>
      </FFModal>
    </FFSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginVertical: spacing.xs,
  },
  reviewsList: {
    gap: spacing.md,
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewerName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
  },
  reviewerType: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  reviewDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  ratingsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  ratingItem: {
    alignItems: "center",
  },
  ratingLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  reviewContent: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reviewText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 20,
  },
  modalContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  modalTitle: {
    textAlign: "center",
  },
  modalMessage: {
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: colors.white,
  },
});

export default RatingsReviewsScreen;
