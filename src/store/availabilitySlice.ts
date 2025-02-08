// src/store/availabilitySlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/src/utils/axiosConfig"; // Assuming axiosInstance is set up
import { saveTokenToAsyncStorage } from "./authSlice";
import { RootState, AppDispatch } from "./store"; // Importing RootState

// Define the initial state for the availability slice
interface AvailabilityState {
  available_for_work: boolean;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: AvailabilityState = {
  available_for_work: false,
  loading: false,
  error: null,
};

// Async thunk to toggle the availability
export const toggleAvailability = createAsyncThunk<
  boolean,
  void,
  { state: RootState }
>(
  "availability/toggleAvailability",
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      const driverId = getState().auth.driverId; // Get driverId from auth state
      const response = await axiosInstance.patch(
        `/drivers/${driverId}/availability`,
        {
          validateStatus: () => true, // Always return true so axios doesn't throw on errors
        }
      );

      const { EC, EM } = response.data;
      if (EC === 0) {
        const newAvailableForWork = response.data.data.available_for_work;

        // Dispatch the saveTokenToAsyncStorage action (assuming this function exists to save state)
        const currentState = getState().auth;
        await dispatch(
          saveTokenToAsyncStorage({
            accessToken: currentState.accessToken ?? "",
            app_preferences: currentState.app_preferences ?? {},
            available_for_work: newAvailableForWork,
            balance: currentState.balance ?? 0,
            email: currentState.email ?? "",
            fWalletId: currentState.fWalletId ?? "",
            driverId: currentState.driverId ?? "",
            userId: currentState.userId ?? "",
            user_type: currentState.user_type ?? [],
            contact_email: currentState.contact_email ?? [],
            contact_phone: currentState.contact_phone ?? [],
            avatar: currentState.avatar ?? { url: "", key: "" },
          })
        );

        return newAvailableForWork;
      } else {
        return rejectWithValue(EM);
      }
    } catch (error: unknown) {
      // Explicitly type error as 'unknown'
      if (error instanceof Error) {
        return rejectWithValue(error.message); // Handle the known error message
      }
      return rejectWithValue("Error updating availability"); // Fallback for unknown errors
    }
  }
);

// Create the slice with reducers and actions
const availabilitySlice = createSlice({
  name: "availability",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(toggleAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        toggleAvailability.fulfilled,
        (state, action: PayloadAction<boolean>) => {
          state.loading = false;
          state.available_for_work = action.payload;
        }
      )
      .addCase(toggleAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export the reducer to be used in the store
export default availabilitySlice.reducer;
