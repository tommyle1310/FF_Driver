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
  customerDetails?: Customer; // Thêm customerDetails
  restaurantDetails?: Restaurant; // Thêm restaurantDetails
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
  total_tips: number | null;
  events: Event[];
  created_at: number | null;
  updated_at: number | null;
  orders: Order[];
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
  total_tips: null,
  events: [],
  created_at: null,
  updated_at: null,
  orders: [],
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

const currentDriverProgressStageSlice = createSlice({
  name: "currentDriverProgressStage",
  initialState,
  reducers: {
    // Set toàn bộ state
    setDriverProgressStage: (state, action) => {
      const {
        id,
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
      } = action.payload;
      state.id = id;
      state.driver_id = driver_id;
      state.current_state = current_state;
      state.previous_state = previous_state;
      state.stages = stages;
      state.next_state = next_state;
      state.estimated_time_remaining = estimated_time_remaining;
      state.actual_time_spent = actual_time_spent;
      state.total_distance_travelled = total_distance_travelled;
      state.total_tips = total_tips;
      state.events = events;
      state.created_at = created_at;
      state.updated_at = updated_at;
      state.orders = orders;
    },
    // Update current_state
    updateCurrentState: (state, action) => {
      state.current_state = action.payload;
      state.updated_at = Math.floor(Date.now() / 1000);
    },
    // Update stages
    updateStages: (state, action) => {
      state.stages = action.payload;
      state.updated_at = Math.floor(Date.now() / 1000);
    },
    // Clear state
    clearState: (state) => {
      state.id = null;
      state.driver_id = null;
      state.current_state = null;
      state.previous_state = null;
      state.stages = [];
      state.next_state = null;
      state.estimated_time_remaining = null;
      state.actual_time_spent = null;
      state.total_distance_travelled = null;
      state.total_tips = null;
      state.events = [];
      state.created_at = null;
      state.updated_at = null;
      state.orders = [];
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
            } = action.payload;
            state.id = id;
            state.driver_id = driver_id;
            state.current_state = current_state;
            state.previous_state = previous_state;
            state.stages = stages;
            state.next_state = next_state;
            state.estimated_time_remaining = estimated_time_remaining;
            state.actual_time_spent = actual_time_spent;
            state.total_distance_travelled = total_distance_travelled;
            state.total_tips = total_tips;
            state.events = events;
            state.created_at = created_at;
            state.updated_at = updated_at;
            state.orders = orders;
          }
        }
      )
      .addCase(
        saveDriverProgressStageToAsyncStorage.fulfilled,
        (state, action) => {
          const {
            id,
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
          } = action.payload;
          state.id = id;
          state.driver_id = driver_id;
          state.current_state = current_state;
          state.previous_state = previous_state;
          state.stages = stages;
          state.next_state = next_state;
          state.estimated_time_remaining = estimated_time_remaining;
          state.actual_time_spent = actual_time_spent;
          state.total_distance_travelled = total_distance_travelled;
          state.total_tips = total_tips;
          state.events = events;
          state.created_at = created_at;
          state.updated_at = updated_at;
          state.orders = orders;
        }
      )
      .addCase(clearDriverProgressStage.fulfilled, (state) => {
        state.id = null;
        state.driver_id = null;
        state.current_state = null;
        state.previous_state = null;
        state.stages = [];
        state.next_state = null;
        state.estimated_time_remaining = null;
        state.actual_time_spent = null;
        state.total_distance_travelled = null;
        state.total_tips = null;
        state.events = [];
        state.created_at = null;
        state.updated_at = null;
        state.orders = [];
      });
  },
});

// Export actions
export const {
  setDriverProgressStage,
  updateCurrentState,
  updateStages,
  clearState,
} = currentDriverProgressStageSlice.actions;

// Export reducer
export default currentDriverProgressStageSlice.reducer;
