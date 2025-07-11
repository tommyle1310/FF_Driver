import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import FFText from "@/src/components/FFText";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import { colors, spacing } from "@/src/theme";

const FloatingAnalytics: React.FC = () => {
  const {
    date,
    total_earn,
    total_tip,
    total_distance_travelled,
    average_time_spent_on_each_order,
    order_count,
    isLoading,
  } = useSelector((state: RootState) => state.dailyAnalytics);

  const [isExpanded, setIsExpanded] = useState(true);

  if (isLoading) {
    return (
      <View
        style={{
          position: "absolute",
          top: spacing.xxxl,
          left: spacing.sm,
          backgroundColor: "#fff",
          padding: 12,
          borderRadius: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
          width: 150,
        }}
      >
        <FFText fontSize="sm" fontWeight="bold">
          Loading analytics...
        </FFText>
      </View>
    );
  }

  if (!isExpanded) {
    return (
      <TouchableOpacity
        onPress={() => setIsExpanded(true)}
        style={{
          position: "absolute",
          top: spacing.xxxl,
          left: spacing.sm,
          backgroundColor: "#fff",
          padding: 12,
          borderRadius: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Ionicons
          name="chevron-forward-outline"
          size={24}
          color={colors.primary}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={{
        position: "absolute",
        top: spacing.xxxl,
        left: spacing.sm,
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        width: 150,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <FFText fontSize="sm" fontWeight="bold">
          Today's Stats
        </FFText>
        <TouchableOpacity onPress={() => setIsExpanded(false)}>
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 4 }}>
        <FFText
          fontSize="xs"
          fontWeight="400"
          style={{ color: colors.textSecondary }}
        >
          Earnings
        </FFText>
        <FFText
          fontSize="sm"
          fontWeight="bold"
          style={{ color: colors.primary }}
        >
          ${total_earn.toFixed(2)}
        </FFText>
      </View>

      <View style={{ marginBottom: 4 }}>
        <FFText
          fontSize="xs"
          fontWeight="400"
          style={{ color: colors.textSecondary }}
        >
          Tips
        </FFText>
        <FFText fontSize="sm" fontWeight="bold">
          ${total_tip.toFixed(2)}
        </FFText>
      </View>

      <View style={{ marginBottom: 4 }}>
        <FFText
          fontSize="xs"
          fontWeight="400"
          style={{ color: colors.textSecondary }}
        >
          Distance
        </FFText>
        <FFText fontSize="sm" fontWeight="bold">
          {total_distance_travelled.toFixed(2)} km
        </FFText>
      </View>

      <View style={{ marginBottom: 4 }}>
        <FFText
          fontSize="xs"
          fontWeight="400"
          style={{ color: colors.textSecondary }}
        >
          Orders
        </FFText>
        <FFText fontSize="sm" fontWeight="bold">
          {order_count}
        </FFText>
      </View>

      {average_time_spent_on_each_order > 0 && (
        <View>
          <FFText
            fontSize="xs"
            fontWeight="400"
            style={{ color: colors.textSecondary }}
          >
            Avg. Time/Order
          </FFText>
          <FFText fontSize="sm" fontWeight="bold">
            {Math.round(average_time_spent_on_each_order)} min
          </FFText>
        </View>
      )}
    </View>
  );
};

export default FloatingAnalytics;