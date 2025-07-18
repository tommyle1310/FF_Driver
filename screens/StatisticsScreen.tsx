import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import { LinearGradient } from "expo-linear-gradient";
import FFText from "@/src/components/FFText";
import IconIonicons from "react-native-vector-icons/Ionicons";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import axiosInstance from "@/src/utils/axiosConfig";
import FFSpinner from "@/src/components/FFSpinner";
import { PieChart } from "react-native-chart-kit";

// Interfaces based on API response
interface PerformanceMetrics {
  acceptance_rate: number;
  completion_rate: number;
  avg_response_time: number;
  cancellation_rate: number;
  on_time_delivery_rate: number;
}

interface FinancialBreakdown {
  base_earnings: number;
  tips_earnings: number;
  bonus_earnings: number;
  estimated_net_earnings: number;
}

interface TimeInsights {
  consistency_score: number;
  most_productive_day: string;
  least_productive_day: string;
}

interface DriverStats {
  id: string;
  total_online_hours: number;
  total_orders: number;
  total_earns: number;
  total_distance: number;
  performance_metrics: PerformanceMetrics;
  financial_breakdown: FinancialBreakdown;
  time_insights: TimeInsights;
  // Add other fields as needed
}

type Period = "daily" | "weekly" | "monthly";

const StatisticsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<SidebarStackParamList>>();
  const { driverId } = useSelector((state: RootState) => state.auth);

  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [period, setPeriod] = useState<Period>("weekly");

  useEffect(() => {
    fetchDriverStats();
  }, [driverId, period]);

  const fetchDriverStats = async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getEpochDateRange(period);
      const res = await axiosInstance.get(
        `/driver-stats/${driverId}?startDate=${startDate}&endDate=${endDate}`
      );
      const { EC, data } = res.data;
      if (EC === 0 && data.length > 0) {
        // Aggregate data from all records into one summary object
        const aggregatedStats = aggregateStats(data);
        setStats(aggregatedStats);
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error("Error fetching driver stats:", error);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const aggregateStats = (data: any[]): DriverStats => {
    const total = data.reduce(
      (acc, record) => {
        acc.total_online_hours += record.total_online_hours || 0;
        acc.total_orders += record.total_orders || 0;
        acc.total_earns += record.total_earns || 0;
        acc.total_distance += record.total_distance || 0;

        if (record.performance_metrics) {
          acc.performance_metrics.acceptance_rate += record.performance_metrics.acceptance_rate || 0;
          acc.performance_metrics.completion_rate += record.performance_metrics.completion_rate || 0;
          acc.performance_metrics.avg_response_time += record.performance_metrics.avg_response_time || 0;
          acc.performance_metrics.cancellation_rate += record.performance_metrics.cancellation_rate || 0;
          acc.performance_metrics.on_time_delivery_rate += record.performance_metrics.on_time_delivery_rate || 0;
        }

        if (record.financial_breakdown) {
          acc.financial_breakdown.base_earnings += record.financial_breakdown.base_earnings || 0;
          acc.financial_breakdown.tips_earnings += record.financial_breakdown.tips_earnings || 0;
          acc.financial_breakdown.bonus_earnings += record.financial_breakdown.bonus_earnings || 0;
          acc.financial_breakdown.estimated_net_earnings += record.financial_breakdown.estimated_net_earnings || 0;
        }

        if (record.time_insights) {
          acc.time_insights.consistency_score += record.time_insights.consistency_score || 0;
        }

        return acc;
      },
      {
        total_online_hours: 0,
        total_orders: 0,
        total_earns: 0,
        total_distance: 0,
        performance_metrics: { acceptance_rate: 0, completion_rate: 0, avg_response_time: 0, cancellation_rate: 0, on_time_delivery_rate: 0 },
        financial_breakdown: { base_earnings: 0, tips_earnings: 0, bonus_earnings: 0, estimated_net_earnings: 0 },
        time_insights: { consistency_score: 0, most_productive_day: "", least_productive_day: "" },
      }
    );

    const count = data.length;
    if (count > 0) {
        total.performance_metrics.acceptance_rate /= count;
        total.performance_metrics.completion_rate /= count;
        total.performance_metrics.avg_response_time /= count;
        total.performance_metrics.cancellation_rate /= count;
        total.performance_metrics.on_time_delivery_rate /= count;
        total.time_insights.consistency_score /= count;
    }

    // For productive days, we might need a more complex logic, here we just take the first one.
    total.time_insights.most_productive_day = data[0]?.time_insights?.most_productive_day || 'N/A';
    total.time_insights.least_productive_day = data[0]?.time_insights?.least_productive_day || 'N/A';


    return { id: 'aggregated', ...total };
  };

  const financialChartData = useMemo(() => {
    if (!stats?.financial_breakdown) return [];
    const { base_earnings, tips_earnings, bonus_earnings } = stats.financial_breakdown;
    const total = base_earnings + tips_earnings + bonus_earnings;
    if (total === 0) return [];

    return [
      { name: "Base", value: base_earnings, color: "#4CAF50", legendFontColor: "#7F7F7F", legendFontSize: 14 },
      { name: "Tips", value: tips_earnings, color: "#FFC107", legendFontColor: "#7F7F7F", legendFontSize: 14 },
      { name: "Bonus", value: bonus_earnings, color: "#2196F3", legendFontColor: "#7F7F7F", legendFontSize: 14 },
    ];
  }, [stats]);

  const renderMetric = (label: string, value: string | number, unit: string = "") => (
    <View style={styles.metricBox}>
      <Text style={styles.metricValue}>{value} <Text style={styles.metricUnit}>{unit}</Text></Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );

  const renderProgressBar = (label: string, value: number) => (
    <View style={styles.progressContainer}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value.toFixed(2)}%</Text>
      </View>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${value}%` }]} />
      </View>
    </View>
  );

  return (
    <FFSafeAreaView style={styles.container}>
      <FFSpinner isVisible={isLoading} />
      <LinearGradient colors={["#63c550", "#3a9d23"]} style={styles.headerGradient}>
        <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <IconIonicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Statistics</Text>
            <View style={{width: 24}}/>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.periodSelector}>
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.activePeriodButton]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodButtonText, period === p && styles.activePeriodButtonText]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!stats && !isLoading && (
            <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No statistical data available for this period.</Text>
            </View>
        )}

        {stats && (
          <>
            {/* Key Metrics */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Key Metrics</Text>
              <View style={styles.metricsGrid}>
                {renderMetric("Net Earnings", `$${stats.financial_breakdown.estimated_net_earnings.toFixed(2)}`)}
                {renderMetric("Total Orders", stats.total_orders)}
                {renderMetric("Online Time", `${stats.total_online_hours.toFixed(1)}h`)}
                {renderMetric("Total Distance", `${stats.total_distance.toFixed(1)}`, "km")}
              </View>
            </View>

            {/* Performance Metrics */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Performance</Text>
              {renderProgressBar("Acceptance Rate", stats.performance_metrics.acceptance_rate)}
              {renderProgressBar("Completion Rate", stats.performance_metrics.completion_rate)}
              {renderProgressBar("On-Time Delivery", stats.performance_metrics.on_time_delivery_rate)}
              <View style={{marginTop: 12}}>
                {renderMetric("Avg. Response Time", `${stats.performance_metrics.avg_response_time.toFixed(1)}s`)}
                {renderMetric("Cancellation Rate", `${stats.performance_metrics.cancellation_rate.toFixed(2)}%`)}
                {renderMetric("Consistency Score", `${stats.time_insights.consistency_score.toFixed(1)}`)}
              </View>
            </View>

            {/* Financial Breakdown */}
            {financialChartData.length > 0 &&
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Financial Breakdown</Text>
                    <PieChart
                        data={financialChartData}
                        width={Dimensions.get("window").width - 64} // from card padding
                        height={220}
                        chartConfig={{
                            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        }}
                        accessor={"value"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        absolute
                    />
                </View>
            }

             {/* Time Insights */}
             <View style={styles.card}>
                <Text style={styles.cardTitle}>Time Insights</Text>
                <View style={styles.timeInsightContainer}>
                    <Text style={styles.timeInsightLabel}>Most Productive Day</Text>
                    <Text style={styles.timeInsightValue}>{stats.time_insights.most_productive_day}</Text>
                </View>
                <View style={styles.timeInsightContainer}>
                    <Text style={styles.timeInsightLabel}>Least Productive Day</Text>
                    <Text style={styles.timeInsightValue}>{stats.time_insights.least_productive_day}</Text>
                </View>
            </View>
          </>
        )}
      </ScrollView>
    </FFSafeAreaView>
  );
};

// Helper function to get epoch timestamps for the selected period
const getEpochDateRange = (period: Period) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  switch (period) {
    case "daily":
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "weekly":
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // week starts on Monday
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return {
    startDate: Math.floor(startDate.getTime() / 1000),
    endDate: Math.floor(endDate.getTime() / 1000),
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FC",
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 16,
  },
  periodSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 4,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  activePeriodButton: {
    backgroundColor: "#63c550",
  },
  periodButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  activePeriodButtonText: {
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricBox: {
    width: "48%",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: '#F4F7FC',
    borderRadius: 8,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3a9d23",
  },
   metricUnit: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'normal',
  },
  metricLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: "#333",
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: "#3a9d23",
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#63c550",
    borderRadius: 4,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  noDataText: {
      fontSize: 16,
      color: '#666',
  },
  timeInsightContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F4F7FC',
  },
  timeInsightLabel: {
      fontSize: 14,
      color: '#333',
  },
  timeInsightValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#3a9d23',
  }
});

export default StatisticsScreen;
