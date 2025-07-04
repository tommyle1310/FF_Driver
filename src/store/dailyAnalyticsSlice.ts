import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "../utils/axiosConfig";
import { RootState } from "./store"; // Import RootState

// Define the interface for daily analytics data
export interface DailyAnalyticsState {
  date: string;
  total_earn: number;
  total_tip: number;
  total_distance_travelled: number;
  average_time_spent_on_each_order: number;
  order_count: number;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: DailyAnalyticsState = {
  date: "",
  total_earn: 0,
  total_tip: 0,
  total_distance_travelled: 0,
  average_time_spent_on_each_order: 0,
  order_count: 0,
  isLoading: false,
  error: null,
};

// Async thunk to fetch daily analytics
export const fetchDailyAnalytics = createAsyncThunk<
  any,
  void,
  { state: RootState }
>(
  "dailyAnalytics/fetch",
  async (_, { rejectWithValue, getState }) => {
    try {
      // Get driverId from auth state
      const driverId = getState().auth.driverId;
      
      // If no driverId is available, try using userId as fallback
      const id = driverId || getState().auth.id;
      
      if (!id) {
        return rejectWithValue("Driver ID or User ID not found");
      }
      console.log('check id', id)
      
      const response = await axiosInstance.get(`/drivers/daily-analytics/${id}?force_refresh=true`);
      const { EC, EM, data } = response.data;
      console.log('check data', response.data);
      if (EC === 0) {
        return data;
      } else {
        return rejectWithValue(EM || "Failed to fetch daily analytics");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "An error occurred");
    }
  }
);

// Create the slice
const dailyAnalyticsSlice = createSlice({
  name: "dailyAnalytics",
  initialState,
  reducers: {
    clearDailyAnalytics: (state) => {
      return initialState;
    },
    // Manually update analytics after order completion
    updateAnalyticsAfterOrderCompletion: (state, action) => {
      const { earn = 0, tip = 0, distance = 0, time = 0 } = action.payload;
      
      state.total_earn += earn;
      state.total_tip += tip;
      state.total_distance_travelled += distance;
      state.order_count += 1;
      
      // Recalculate average time
      const totalTime = state.average_time_spent_on_each_order * (state.order_count - 1) + time;
      state.average_time_spent_on_each_order = state.order_count > 0 ? totalTime / state.order_count : 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDailyAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDailyAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update individual properties instead of returning a new object
        Object.assign(state, action.payload);
        state.error = null;
      })
      .addCase(fetchDailyAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDailyAnalytics, updateAnalyticsAfterOrderCompletion } = dailyAnalyticsSlice.actions;
export default dailyAnalyticsSlice.reducer;