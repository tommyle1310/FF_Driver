import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import React from "react";
import FFView from "@/src/components/FFView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import FFText from "@/src/components/FFText";
import FFAvatar from "@/src/components/FFAvatar";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { IMAGE_LINKS } from "@/src/assets/imageLinks";
import { colors } from "@/src/theme";

type MyTasksScreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "MyTasks"
>;

const MyTasksScreen = () => {
  const navigation = useNavigation<MyTasksScreenNavigationProp>();
  const dps = useSelector(
    (state: RootState) => state.currentDriverProgressStage
  );
  console.log("check dps here", dps);

  const getStageIcon = (stageState: string) => {
    if (stageState.includes("driver_ready")) return "play-circle";
    if (stageState.includes("waiting_for_pickup")) return "location-on";
    if (stageState.includes("restaurant_pickup")) return "restaurant";
    if (stageState.includes("en_route_to_customer")) return "local-shipping";
    if (stageState.includes("delivery_complete")) return "check-circle";
    return "radio-button-unchecked";
  };

  const getStageTitle = (stageState: string) => {
    if (stageState.includes("driver_ready")) return "Ready to Start";
    if (stageState.includes("waiting_for_pickup"))
      return "Arrive at Restaurant";
    if (stageState.includes("restaurant_pickup")) return "Pick Up Order";
    if (stageState.includes("en_route_to_customer"))
      return "Deliver to Customer";
    if (stageState.includes("delivery_complete")) return "Complete Delivery";
    return "Unknown Stage";
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "in_progress":
        return "#FF9800";
      case "pending":
        return "#E0E0E0";
      default:
        return "#E0E0E0";
    }
  };

  const currentOrder = dps?.stages?.length > 0 ? dps.orders?.[1] : dps.orders?.[0] as any; // Use any to access nested objects from server
  const stages = dps.stages || [];

  // Process and order stages
  const getOrderedStages = () => {
    // Group stages by order and sort them properly
    const groupedStages: { [key: number]: any[] } = {};
    
    stages.forEach((stage: any) => {
      // Extract order identifier from stage.state
      const orderMatch = stage.state.match(/order_(\d+)/);
      const orderNumber = orderMatch ? parseInt(orderMatch[1]) : 0;
      
      if (!groupedStages[orderNumber]) {
        groupedStages[orderNumber] = [];
      }
      groupedStages[orderNumber].push(stage);
    });

    // Define stage order for proper sequencing
    const stageOrder = [
      'driver_ready',
      'waiting_for_pickup', 
      'restaurant_pickup',
      'en_route_to_customer',
      'delivery_complete'
    ];

    // Sort stages within each order group
    Object.keys(groupedStages).forEach(orderNumStr => {
      const orderNum = parseInt(orderNumStr);
      groupedStages[orderNum].sort((a: any, b: any) => {
        const aType = a.state.split('_order_')[0];
        const bType = b.state.split('_order_')[0];
        return stageOrder.indexOf(aType) - stageOrder.indexOf(bType);
      });
    });

    // Flatten stages in correct order (complete each order before next)
    const orderedStages: any[] = [];
    const orderNumbers = Object.keys(groupedStages).sort((a, b) => parseInt(a) - parseInt(b));
    
    orderNumbers.forEach(orderNumStr => {
      const orderNum = parseInt(orderNumStr);
      orderedStages.push(...groupedStages[orderNum]);
    });

    return orderedStages;
  };

  const orderedStages = getOrderedStages();

  // Check if there are no active tasks
  const hasNoTasks = !dps.id || !dps.orders?.length || !stages.length;
  console.log('check second stage' , stages[2])
  // Empty state component
  const EmptyTasksState = () => (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
        paddingVertical: 64,
      }}
    >
      <Image
        source={{ uri: IMAGE_LINKS.EMPTY_TODO }}
        style={{
          width: 200,
          height: 200,
          marginBottom: 32,
          borderRadius: 16,
        }}
        resizeMode="contain"
      />

      <FFText
        fontWeight="bold"
        style={{
          fontSize: 24,
          color: "#1a1a1a",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        No Active Tasks
      </FFText>

      <FFText
        style={{
          fontSize: 16,
          color: "#666",
          textAlign: "center",
          lineHeight: 24,
          marginBottom: 24,
        }}
      >
        You don't have any active deliveries at the moment.
      </FFText>

      <View
        style={{
          backgroundColor: "#f0f8ff",
          padding: 20,
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: "#2196F3",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <MaterialIcons name="info" size={20} color="#2196F3" />
          <FFText
            fontWeight="600"
            style={{ marginLeft: 8, color: "#2196F3", fontSize: 16 }}
          >
            Quick Tips
          </FFText>
        </View>
        <FFText style={{ color: "#555", fontSize: 14, lineHeight: 20 }}>
          • Make sure your online status is active{"\n"}• Stay in a busy area to
          receive more orders{"\n"}• Check your internet connection{"\n"}•
          Orders will appear here automatically
        </FFText>
      </View>
    </View>
  );

  return (
    <FFSafeAreaView>
      <FFScreenTopSection title="My Tasks" navigation={navigation} />

      {hasNoTasks ? (
        <EmptyTasksState />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            {/* Order Summary Card */}
            {currentOrder && (
              <View
                style={{
                  margin: 16,
                  backgroundColor: "white",
                  borderStartEndRadius: 16,
                  borderEndEndRadius: 16,
                  padding: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <LinearGradient
                  colors={[colors.primary, colors.warning]}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                  }}
                />

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: colors.primary,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}
                  >
                    <MaterialIcons name="assignment" size={24} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FFText
                      fontWeight="bold"
                      style={{ fontSize: 18, color: "#1a1a1a" }}
                    >
                      Order #{currentOrder.id?.split("_").pop()?.slice(-6)}
                    </FFText>
                    <FFText style={{ color: "#666", fontSize: 14 }}>
                      {currentOrder.restaurant?.restaurant_name}
                    </FFText>
                  </View>
                  <View
                    style={{
                      backgroundColor: "#e8f5e8",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                    }}
                  >
                    <FFText
                      style={{
                        color: "#2e7d32",
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      ${dps.total_earns?.toFixed(2)}
                    </FFText>
                  </View>
                </View>

                {/* Restaurant & Customer Info */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <MaterialIcons
                        name="restaurant"
                        size={16}
                        color="#FF6B6B"
                      />
                      <FFText
                        style={{ marginLeft: 6, fontSize: 12, color: "#666" }}
                      >
                        FROM
                      </FFText>
                    </View>
                    <FFText style={{ fontSize: 14, fontWeight: "500" }}>
                      {currentOrder.restaurant?.restaurant_name}
                    </FFText>
                    <FFText style={{ fontSize: 12, color: "#999" }}>
                      {currentOrder.restaurantAddress?.street}
                    </FFText>
                  </View>

                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <MaterialIcons name="person" size={16} color="#4ECDC4" />
                      <FFText
                        style={{ marginLeft: 6, fontSize: 12, color: "#666" }}
                      >
                        TO
                      </FFText>
                    </View>
                    <FFText style={{ fontSize: 14, fontWeight: "500" }}>
                      {currentOrder.customer?.first_name}{" "}
                      {currentOrder.customer?.last_name}
                    </FFText>
                    <FFText style={{ fontSize: 12, color: "#999" }}>
                      {currentOrder.customerAddress?.street}
                    </FFText>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Progress Steps */}
          <View
            style={{
              margin: 16,
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <FFText
              fontWeight="bold"
              style={{ fontSize: 18, marginBottom: 20, color: "#1a1a1a" }}
            >
              Delivery Progress
            </FFText>

{orderedStages.map((stage, index) => {
              const isLast = index === orderedStages.length - 1;
              const stageColor = getStageColor(stage.status);

              // Check if this is the start of a new order
              const orderMatch = stage.state.match(/order_(\d+)/);
              const currentOrderNumber = orderMatch ? parseInt(orderMatch[1]) : 0;
              
              const prevStage = index > 0 ? orderedStages[index - 1] : null;
              const prevOrderMatch = prevStage?.state.match(/order_(\d+)/);
              const prevOrderNumber = prevOrderMatch ? parseInt(prevOrderMatch[1]) : -1;
              
              const isNewOrder = currentOrderNumber !== prevOrderNumber;

              return (
                <React.Fragment key={stage.state}>
                  {/* Order Separator */}
                  {isNewOrder && (
                    <View style={{ marginBottom: 20, marginTop: index > 0 ? 16 : 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ flex: 1, height: 1, backgroundColor: '#E0E0E0' }} />
                        <View
                          style={{
                            backgroundColor: '#f8f9fa',
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: '#E0E0E0',
                            marginHorizontal: 12,
                          }}
                        >
                          <FFText
                            fontWeight="600"
                            style={{
                              fontSize: 14,
                              color: colors.primary,
                              textAlign: 'center',
                            }}
                          >
                            Order #{currentOrderNumber}
                          </FFText>
                        </View>
                        <View style={{ flex: 1, height: 1, backgroundColor: '#E0E0E0' }} />
                      </View>
                    </View>
                  )}

                  {/* Stage Item */}
                  <View
                    style={{ flexDirection: "row", alignItems: "flex-start" }}
                  >
                    {/* Timeline Line */}
                    <View style={{ alignItems: "center", marginRight: 16 }}>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: stageColor,
                          justifyContent: "center",
                          alignItems: "center",
                          borderWidth: 3,
                          borderColor:
                            stage.status === "in_progress" ? "#fff" : stageColor,
                          shadowColor: stageColor,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: stage.status === "in_progress" ? 0.3 : 0,
                          shadowRadius: 4,
                        }}
                      >
                        {stage.status === "completed" ? (
                          <MaterialIcons name="check" size={18} color="white" />
                        ) : stage.status === "in_progress" ? (
                          <MaterialIcons
                            name={getStageIcon(stage.state)}
                            size={18}
                            color="white"
                          />
                        ) : (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "white",
                            }}
                          />
                        )}
                      </View>

                      {!isLast && (
                        <View
                          style={{
                            width: 2,
                            height: 40,
                            backgroundColor:
                              stage.status === "completed"
                                ? "#4CAF50"
                                : "#E0E0E0",
                            marginTop: 4,
                          }}
                        />
                      )}
                    </View>

                    {/* Stage Content */}
                    <View style={{ flex: 1, paddingBottom: isLast ? 0 : 24 }}>
                      <FFText
                        fontWeight="600"
                        style={{
                          fontSize: 16,
                          color:
                            stage.status === "completed"
                              ? "#4CAF50"
                              : stage.status === "in_progress"
                              ? "#FF9800"
                              : "#666",
                          marginBottom: 4,
                        }}
                      >
                        {getStageTitle(stage.state)}
                      </FFText>

                      {stage.status === "completed" && stage.duration > 0 && (
                        <FFText style={{ fontSize: 12, color: "#999" }}>
                          Completed in {Math.floor(stage.duration / 60)}m{" "}
                          {stage.duration % 60}s
                        </FFText>
                      )}

                      {stage.status === "in_progress" && (
                        <View
                          style={{
                            backgroundColor: "#fff3e0",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                            alignSelf: "flex-start",
                            marginTop: 4,
                          }}
                        >
                          <FFText
                            style={{
                              fontSize: 12,
                              color: "#f57c00",
                              fontWeight: "500",
                            }}
                          >
                            In Progress
                          </FFText>
                        </View>
                      )}
                    </View>
                  </View>
                </React.Fragment>
              );
            })}
          </View>

          {/* Stats Card */}
          <View
            style={{
              margin: 16,
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
              marginBottom: 32,
            }}
          >
            <FFText
              fontWeight="bold"
              style={{ fontSize: 18, marginBottom: 16, color: "#1a1a1a" }}
            >
              Trip Summary
            </FFText>

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <View style={{ alignItems: "center", flex: 1 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#e8f5e8",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <MaterialIcons
                    name="attach-money"
                    size={24}
                    color="#2e7d32"
                  />
                </View>
                <FFText
                  style={{ fontSize: 12, color: "#666", marginBottom: 4 }}
                >
                  Earnings
                </FFText>
                <FFText
                  fontWeight="bold"
                  style={{ fontSize: 16, color: "#2e7d32" }}
                >
                  ${dps.total_earns?.toFixed(2) || "0.00"}
                </FFText>
              </View>

              <View style={{ alignItems: "center", flex: 1 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#e3f2fd",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <MaterialIcons name="navigation" size={24} color="#1976d2" />
                </View>
                <FFText
                  style={{ fontSize: 12, color: "#666", marginBottom: 4 }}
                >
                  Distance
                </FFText>
                <FFText
                  fontWeight="bold"
                  style={{ fontSize: 16, color: "#1976d2" }}
                >
                  {dps.total_distance_travelled?.toFixed(1) || "0.0"} km
                </FFText>
              </View>

              <View style={{ alignItems: "center", flex: 1 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#fce4ec",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <MaterialIcons name="star" size={24} color={colors.error} />
                </View>
                <FFText
                  style={{ fontSize: 12, color: "#666", marginBottom: 4 }}
                >
                  Tips
                </FFText>
                <FFText
                  fontWeight="bold"
                  style={{ fontSize: 16, color: "#c2185b" }}
                >
                  ${(dps?.total_tips || 0).toFixed(2)}
                </FFText>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </FFSafeAreaView>
  );
};

export default MyTasksScreen;
