import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Address } from "../types/Address";

// Định nghĩa các type dựa trên JSON DriverProgressStage
interface Location {
  lat: number;
  lng: number;
}

export interface Customer {
  id: string;
  avatar: { key: string; url: string };
  user_id: string;
  last_name: string;
  created_at: number;
  phone: string;
  first_name: string;
  updated_at: number;
  address?: Address[];
  favorite_items: any | null;
  app_preferences: any | null;
  support_tickets: any | null;
  restaurant_history: any | null;
}

export interface Restaurant {
  id: string;
  avatar: { key: string; url: string };
  status: { is_open: boolean; is_active: boolean; is_accepted_orders: boolean };
  ratings: any | null;
  owner_id: string;
  address_id: string;
  created_at: number;
  owner_name: string;
  updated_at: number;
  description: string | null;
  total_orders: number;
  contact_email: Array<{ email: string; title: string; is_default: boolean }>;
  contact_phone: Array<{ title: string; number: string; is_default: boolean }>;
  opening_hours: {
    mon: { from: number; to: number };
    tue: { from: number; to: number };
    wed: { from: number; to: number };
    thu: { from: number; to: number };
    fri: { from: number; to: number };
    sat: { from: number; to: number };
    sun: { from: number; to: number };
  };
  address?: Address;
  images_gallery: any | null;
  restaurant_name: string;
}

export interface StageDetails {
  location?: Location;
  estimated_time?: number;
  actual_time?: number;
  notes?: string;
  tip?: number;
  weather?: { temperature?: number; condition?: string };
  customerDetails?: Customer;
  restaurantDetails?: Restaurant;
}

export interface Stage {
  state: string;
  status: "pending" | "completed" | "in_progress" | "failed";
  timestamp: number;
  duration: number;
  details?: StageDetails;
}

interface Event {
  event_type: "driver_start" | "pickup_complete" | "delivery_complete";
  event_timestamp: Date;
  event_details?: {
    location?: Location;
    notes?: string;
  };
}

interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  driver_id: string | null;
  distance: string;
  status: string;
  total_amount: string;
  delivery_fee: string;
  service_fee: string;
  payment_status: string;
  payment_method: string;
  customer_location: string;
  restaurant_location: string;
  order_items: Array<{
    name: string;
    item_id: string;
    quantity: number;
    variant_id: string;
    price_at_time_of_order: number;
  }>;
  customer_note: string;
  restaurant_note: string;
  order_time: string;
  delivery_time: string;
  tracking_info: string;
  driver_tips: string;
  created_at: number;
  updated_at: number;
}

export interface DriverProgressStageState {
  id: string | null;
  driver_id: string | null;
  current_state: string | null;
  previous_state: string | null;
  stages: Stage[];
  next_state: string | null;
  estimated_time_remaining: number | null;
  actual_time_spent: number | null;
  total_distance_travelled: number | null;
  total_tips: number;
  events: Event[];
  created_at: number | null;
  updated_at: number | null;
  total_earns: number | null;
  orders: Order[];
  transactions_processed: boolean;
  processed_tip_ids: string[]; // Track processed tip IDs // Thêm field này
}

// Khởi tạo state ban đầu
export const initialState: DriverProgressStageState = {
  id: null,
  driver_id: null,
  current_state: null,
  previous_state: null,
  stages: [],
  next_state: null,
  estimated_time_remaining: null,
  actual_time_spent: null,
  total_distance_travelled: null,
  total_tips: 0,
  events: [],
  created_at: null,
  updated_at: null,
  total_earns: null,
  orders: [],
  transactions_processed: false, // Khởi tạo false
  processed_tip_ids: [], // Track processed tip IDs to prevent duplicates
};

// AsyncThunk để load dữ liệu từ AsyncStorage
export const loadDriverProgressStageFromAsyncStorage = createAsyncThunk(
  "currentDriverProgressStage/load",
  async () => {
    const data = await AsyncStorage.getItem("currentDriverProgressStage");
    return data ? JSON.parse(data) : null;
  }
);

// AsyncThunk để save dữ liệu vào AsyncStorage
export const saveDriverProgressStageToAsyncStorage = createAsyncThunk(
  "currentDriverProgressStage/save",
  async (data: DriverProgressStageState) => {
    await AsyncStorage.setItem(
      "currentDriverProgressStage",
      JSON.stringify(data)
    );
    return data;
  }
);

// AsyncThunk để clear dữ liệu
export const clearDriverProgressStage = createAsyncThunk(
  "currentDriverProgressStage/clear",
  async (_, { dispatch }) => {
    await AsyncStorage.removeItem("currentDriverProgressStage");
    console.log("check clear sach");
    dispatch(clearState());
  }
);

// Helper function to safely parse total_tips from server (handles both string and number)
const parseTotalTips = (value: any): number => {
  if (typeof value === "number") {
    return value;
  } else if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const currentDriverProgressStageSlice = createSlice({
  name: "currentDriverProgressStage",
  initialState,
  reducers: {
    setDriverProgressStage: (state, action) => {
      const {
        id,
        driver_id,
        current_state,
        total_earns,
        previous_state,
        stages,
        next_state,
        estimated_time_remaining,
        actual_time_spent,
        total_distance_travelled,
        total_tips,
        events,
        created_at,
        updated_at,
        orders,
        transactions_processed,
        processed_tip_ids,
      } = action.payload;

      console.log("🔧 REDUX setDriverProgressStage - Incoming data:", {
        id,
        stagesCount: stages?.length || 0,
        ordersCount: orders?.length || 0,
        incomingTotalEarns: total_earns,
        incomingTotalDistance: total_distance_travelled,
        currentTotalEarns: state.total_earns,
        currentTotalDistance: state.total_distance_travelled,
        currentStagesCount: state.stages.length,
        currentOrdersCount: state.orders.length,
      });

      // AGGRESSIVE PROTECTION: Block any update with more than 15 stages
      if (stages && stages.length > 15) {
        console.log("🚫 REDUX: BLOCKING update with excessive stages:", stages.length);
        return;
      }

      // Extract order information from incoming stages to understand what's happening
      const incomingOrderIds = new Set<string>();
      const incomingStages = stages || [];
      incomingStages.forEach((stage: Stage) => {
        const match = stage.state.match(/_order_(\d+)$/);
        if (match) {
          incomingOrderIds.add(match[1]);
        }
      });

      // Extract order information from current stages
      const currentOrderIds = new Set<string>();
      state.stages.forEach((stage: Stage) => {
        const match = stage.state.match(/_order_(\d+)$/);
        if (match) {
          currentOrderIds.add(match[1]);
        }
      });

      const incomingOrderCount = incomingOrderIds.size;
      const currentOrderCount = currentOrderIds.size;
      const isFirstOrder = state.stages.length === 0 || currentOrderCount === 0;
      const isNewOrderAdded = incomingOrderCount > currentOrderCount;
      
      // Fix: Better logic to detect new orders
      const hasNewOrders = Array.from(incomingOrderIds).some(id => !currentOrderIds.has(id));

      console.log("🔍 REDUX Stage analysis:", {
        incomingStages: incomingStages.length,
        currentStages: state.stages.length,
        incomingOrderCount,
        currentOrderCount,
        isFirstOrder,
        isNewOrderAdded,
        hasNewOrders,
        incomingOrderIds: Array.from(incomingOrderIds),
        currentOrderIds: Array.from(currentOrderIds),
      });

      // Handle stage deduplication and merging
      let finalStages: Stage[];
      let finalOrders: any[];
      
      if (isFirstOrder) {
        // First order - use incoming stages and orders directly
        console.log("📝 REDUX: First order - using incoming stages and orders directly");
        finalStages = incomingStages;
        finalOrders = orders || [];
      } else if (hasNewOrders) {
        // New order added - merge stages intelligently
        console.log("📝 REDUX: New order detected - merging stages");
        
        // Create a map of existing stages by state
        const existingStagesMap = new Map<string, Stage>();
        state.stages.forEach(stage => {
          existingStagesMap.set(stage.state, stage);
        });
        
        // Add new stages from incoming data (don't overwrite existing)
        incomingStages.forEach((stage: Stage) => {
          if (!existingStagesMap.has(stage.state)) {
            existingStagesMap.set(stage.state, stage);
          } else {
            // If stage exists, update it with latest data (for status changes)
            existingStagesMap.set(stage.state, stage);
          }
        });
        
        finalStages = Array.from(existingStagesMap.values());
        
        // 🔧 CRITICAL: Merge orders properly
        // If server sends orders array, use it; otherwise preserve existing
        if (orders && orders.length > 0) {
          finalOrders = orders;
          console.log("📝 REDUX: Using server orders data:", orders.length);
        } else {
          finalOrders = state.orders;
          console.log("📝 REDUX: Preserving existing orders:", state.orders.length);
        }
        
        console.log("📝 REDUX: Merged stages result:", {
          previousStages: state.stages.length,
          incomingStages: incomingStages.length,
          finalStages: finalStages.length,
          finalOrdersCount: finalOrders.length
        });
      } else {
        // Same order count - but could be status updates for multiple orders
        // Replace all stages with incoming data to ensure status updates are applied
        console.log("📝 REDUX: Updating stages with latest status");
        finalStages = incomingStages.length > 0 ? incomingStages : state.stages;
        
        // 🔧 CRITICAL: Preserve orders if server doesn't send them
        if (orders && orders.length > 0) {
          finalOrders = orders;
          console.log("📝 REDUX: Using updated server orders:", orders.length);
        } else {
          finalOrders = state.orders;
          console.log("📝 REDUX: Preserving existing orders (no server orders):", state.orders.length);
        }
      }

      // Enhanced deduplication - remove exact duplicates
      const uniqueStages = finalStages.reduce((acc: Stage[], stage: Stage) => {
        const existingStageIndex = acc.findIndex(
          (s: Stage) =>
            s.state === stage.state &&
            s.status === stage.status &&
            s.timestamp === stage.timestamp
        );
        
        if (existingStageIndex === -1) {
          acc.push(stage);
        } else {
          // Keep the one with more details if it's a duplicate
          const existingStage = acc[existingStageIndex];
          if (stage.details && Object.keys(stage.details).length > Object.keys(existingStage.details || {}).length) {
            acc[existingStageIndex] = stage;
          }
        }
        return acc;
      }, [] as Stage[]);

      // Final safety check
      if (uniqueStages.length > 12) {
        console.log("🚫 REDUX: LIMITING unique stages to 12, was:", uniqueStages.length);
        uniqueStages.splice(12);
      }

      // 🎯 CRITICAL: PROPER ACCUMULATION LOGIC
      let finalTotalEarns: number;
      let finalTotalDistance: number;

      if (isFirstOrder) {
        // First order - extract individual order values from server response
        // Server response includes both individual order data AND accumulated totals
        // We need individual values: driver_wage, distance (individual), not total_earns (accumulated)
        
        let singleOrderEarns = 0;
        let singleOrderDistance = 0;
        
        // Try to get individual order values from the server response payload
        const driverWage = action.payload.driver_wage; // Individual order earnings
        const orderDistance = action.payload.distance; // Individual order distance
        
        if (driverWage) {
          singleOrderEarns = parseFloat(driverWage.toString());
        } else if (orders && orders.length > 0) {
          // Fallback: get from orders array
          const latestOrder = orders[orders.length - 1];
          singleOrderEarns = parseFloat(latestOrder.driver_tips || latestOrder.total_amount || "0");
        }
        
        if (orderDistance) {
          singleOrderDistance = parseFloat(orderDistance.toString());
        } else if (orders && orders.length > 0) {
          // Fallback: get from orders array
          const latestOrder = orders[orders.length - 1];
          singleOrderDistance = parseFloat(latestOrder.distance || "0");
        }

        finalTotalEarns = singleOrderEarns;
        finalTotalDistance = singleOrderDistance;
        
        console.log("💰 REDUX: First order values (using individual order data):", {
          driverWage,
          orderDistance,
          serverTotalEarns: total_earns,
          serverTotalDistance: total_distance_travelled,
          serverOrdersCount: orders?.length || 0,
          calculatedEarns: singleOrderEarns,
          calculatedDistance: singleOrderDistance,
          finalOrdersCount: finalOrders.length
        });
      } else if (hasNewOrders) {
        // New order added - accumulate properly
        const previousTotalEarns = state.total_earns || 0;
        const previousTotalDistance = state.total_distance_travelled || 0;
        const previousOrders = state.orders || [];
        
        // For new orders, use the difference in server totals if available
        // This is more accurate than trying to calculate from individual orders
        const newOrderEarns = total_earns ? 
          Math.max(0, total_earns - previousTotalEarns) : 
          (orders ? orders.filter((order: Order) => 
            !previousOrders.some((prevOrder: Order) => prevOrder.id === order.id)
          ).reduce((sum: number, order: Order) => 
            sum + parseFloat(order.driver_tips || "0"), 0) : 0);
            
        const newOrderDistance = total_distance_travelled ? 
          Math.max(0, total_distance_travelled - previousTotalDistance) :
          (orders ? orders.filter((order: Order) => 
            !previousOrders.some((prevOrder: Order) => prevOrder.id === order.id)
          ).reduce((sum: number, order: Order) => 
            sum + parseFloat(order.distance || "0"), 0) : 0);
        
        // Get new orders for orders array
        const newOrders = orders ? orders.filter((order: Order) => 
          !previousOrders.some((prevOrder: Order) => prevOrder.id === order.id)
        ) : [];
        
        finalTotalEarns = previousTotalEarns + newOrderEarns;
        finalTotalDistance = previousTotalDistance + newOrderDistance;
        
        console.log("💰 REDUX: Accumulating new order values:", {
          previousTotalEarns,
          serverTotalEarns: total_earns,
          newOrderEarns,
          finalTotalEarns,
          previousTotalDistance,
          serverTotalDistance: total_distance_travelled,
          newOrderDistance,
          finalTotalDistance,
          newOrdersCount: newOrders.length,
          totalOrdersCount: finalOrders.length
        });
      } else {
        // Same orders - preserve accumulated values
        finalTotalEarns = state.total_earns || total_earns || 0;
        finalTotalDistance = state.total_distance_travelled || total_distance_travelled || 0;
        
        console.log("💰 REDUX: Preserving accumulated values:", {
          finalTotalEarns,
          finalTotalDistance,
          finalOrdersCount: finalOrders.length
        });
      }

      console.log("✅ REDUX: Final update values:", {
        previousStageCount: state.stages.length,
        newStageCount: uniqueStages.length,
        finalTotalEarns,
        finalTotalDistance,
        finalOrdersCount: finalOrders.length,
        id: id,
      });

      // Update state
      state.id = id || state.id;
      state.driver_id = driver_id || state.driver_id;
      state.current_state = current_state || state.current_state;
      state.previous_state = previous_state || state.previous_state;
      state.total_earns = finalTotalEarns;
      state.stages = uniqueStages;
      state.next_state = next_state || state.next_state;
      state.estimated_time_remaining = estimated_time_remaining || state.estimated_time_remaining;
      state.actual_time_spent = actual_time_spent || state.actual_time_spent;
      state.total_distance_travelled = finalTotalDistance;
      state.total_tips = parseTotalTips(total_tips) || state.total_tips;
      state.events = events || state.events;
      state.created_at = created_at || state.created_at;
      state.updated_at = updated_at || Math.floor(Date.now() / 1000);
      state.orders = finalOrders;
      state.transactions_processed = transactions_processed || false;
      state.processed_tip_ids = processed_tip_ids || state.processed_tip_ids || [];
    },
    updateCurrentState: (state, action) => {
      state.current_state = action.payload;
      state.updated_at = Math.floor(Date.now() / 1000);
    },
    updateStages: (state, action) => {
      // Filter duplicate stages
      const uniqueStages = action.payload.reduce(
        (acc: Stage[], stage: Stage) => {
          if (
            !acc.find(
              (s: Stage) =>
                s.state === stage.state &&
                s.status === stage.status &&
                s.timestamp === stage.timestamp
            )
          ) {
            acc.push(stage);
          }
          return acc;
        },
        [] as Stage[]
      );
      state.stages = uniqueStages;
      state.updated_at = Math.floor(Date.now() / 1000);
    },
    clearState: () => ({
      ...initialState,
      transactions_processed: false, // Reset field
      processed_tip_ids: [], // Reset tip tracking
    }),
    updateTotalTips: (state, action) => {
      // action.payload should be { tipAmount, orderId, tipTime } for deduplication
      const { tipAmount, orderId, tipTime } = action.payload;
      const tipId = `${orderId}_${tipTime}`;

      // Check if this tip has already been processed
      if (state.processed_tip_ids.includes(tipId)) {
        console.log("🚫 Duplicate tip detected, skipping:", tipId);
        return;
      }

      const parsedTipAmount = parseTotalTips(tipAmount);
      const previousTips = state.total_tips || 0;
      const newTotalTips = previousTips + parsedTipAmount;

      console.log("🎯 updateTotalTips called:", {
        tipId,
        tipAmount,
        parsedTipAmount,
        previousTips,
        newTotalTips,
      });

      state.total_tips = newTotalTips;
      state.processed_tip_ids.push(tipId);
      state.updated_at = Math.floor(Date.now() / 1000);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        loadDriverProgressStageFromAsyncStorage.fulfilled,
        (state, action) => {
          if (action.payload) {
            const {
              id,
              driver_id,
              current_state,
              total_earns,
              previous_state,
              stages,
              next_state,
              estimated_time_remaining,
              actual_time_spent,
              total_distance_travelled,
              total_tips,
              events,
              created_at,
              updated_at,
              orders,
              transactions_processed, // Thêm field
            } = action.payload;
            // Filter duplicate stages
            const uniqueStages = stages.reduce((acc: Stage[], stage: Stage) => {
              if (
                !acc.find(
                  (s: Stage) =>
                    s.state === stage.state &&
                    s.status === stage.status &&
                    s.timestamp === stage.timestamp
                )
              ) {
                acc.push(stage);
              }
              return acc;
            }, [] as Stage[]);
            state.id = id;
            state.driver_id = driver_id;
            state.total_earns = total_earns;
            state.current_state = current_state;
            state.previous_state = previous_state;
            state.stages = uniqueStages;
            state.next_state = next_state;
            state.estimated_time_remaining = estimated_time_remaining;
            state.actual_time_spent = actual_time_spent;
            state.total_distance_travelled = total_distance_travelled;
            state.total_tips = parseTotalTips(total_tips);
            state.events = events;
            state.created_at = created_at;
            state.updated_at = updated_at;
            state.orders = orders;
            state.transactions_processed = transactions_processed || false; // Cập nhật field
          }
        }
      )
      .addCase(
        saveDriverProgressStageToAsyncStorage.fulfilled,
        (state, action) => {
          const {
            id,
            total_earns,
            driver_id,
            current_state,
            previous_state,
            stages,
            next_state,
            estimated_time_remaining,
            actual_time_spent,
            total_distance_travelled,
            total_tips,
            events,
            created_at,
            updated_at,
            orders,
            transactions_processed, // Thêm field
          } = action.payload;
          // Filter duplicate stages
          const uniqueStages = stages.reduce((acc: Stage[], stage: Stage) => {
            if (
              !acc.find(
                (s: Stage) =>
                  s.state === stage.state &&
                  s.status === stage.status &&
                  s.timestamp === stage.timestamp
              )
            ) {
              acc.push(stage);
            }
            return acc;
          }, [] as Stage[]);
          state.id = id;
          state.driver_id = driver_id;
          state.total_earns = total_earns;
          state.current_state = current_state;
          state.previous_state = previous_state;
          state.stages = uniqueStages;
          state.next_state = next_state;
          state.estimated_time_remaining = estimated_time_remaining;
          state.actual_time_spent = actual_time_spent;
          state.total_distance_travelled = total_distance_travelled;
          state.total_tips = parseTotalTips(total_tips);
          state.events = events;
          state.created_at = created_at;
          state.updated_at = updated_at;
          state.orders = orders;
          state.transactions_processed = transactions_processed || false; // Cập nhật field
        }
      )
      .addCase(clearDriverProgressStage.fulfilled, () => ({
        ...initialState,
        transactions_processed: false, // Reset field
      }));
  },
});

// Export actions
export const {
  setDriverProgressStage,
  updateCurrentState,
  updateStages,
  clearState,
  updateTotalTips,
} = currentDriverProgressStageSlice.actions;

// Export reducer
export default currentDriverProgressStageSlice.reducer;
