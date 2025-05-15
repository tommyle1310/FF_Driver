import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define the types for contact information
interface ContactEmail {
  title: string;
  email: string;
  is_default: boolean;
}

interface ContactPhone {
  title: string;
  number: string;
  is_default: boolean;
}

interface VehicleImage {
  key: string;
  url: string;
}

interface Vehicle {
  color: string;
  model: string;
  images: VehicleImage[];
  license_plate: string;
  owner: string;
  brand: string;
  year: number;
}

// Define the types of state we will use in this slice
interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  available_for_work: boolean | null;
  app_preferences: object | null;
  balance: number | null;
  email: string | null;
  userId: string | null;
  driverId: string | null;
  avatar: { url: string; key: string } | null;
  fWalletId: string | null;
  user_type: string[] | null;
  contact_email: ContactEmail[];
  contact_phone: ContactPhone[];
  first_name: string | null;
  last_name: string | null;
  vehicle: Vehicle | null;
}

// Initialize the state
const initialState: AuthState = {
  accessToken: null,
  fWalletId: null,
  isAuthenticated: false,
  app_preferences: {},
  balance: null,
  avatar: null,
  available_for_work: false,
  email: null,
  userId: null,
  driverId: null,
  user_type: null,
  contact_email: [],
  contact_phone: [],
  first_name: null,
  last_name: null,
  vehicle: null,
};

export const loadTokenFromAsyncStorage = createAsyncThunk(
  "auth/loadToken",
  async () => {
    const accessToken = await AsyncStorage.getItem("accessToken");
    const app_preferences = await AsyncStorage.getItem("app_preferences");
    const fWalletId = await AsyncStorage.getItem("fWalletId");
    const avatar = await AsyncStorage.getItem("avatar");
    const balance = await AsyncStorage.getItem("balance");
    const email = await AsyncStorage.getItem("email");
    const available_for_work =
      (await AsyncStorage.getItem("available_for_work")) === "true";
    const userId = await AsyncStorage.getItem("userId");
    const driverId = await AsyncStorage.getItem("driverId");
    const user_type = await AsyncStorage.getItem("user_type");
    const contact_email = await AsyncStorage.getItem("contact_email");
    const contact_phone = await AsyncStorage.getItem("contact_phone");
    const first_name = await AsyncStorage.getItem("first_name");
    const last_name = await AsyncStorage.getItem("last_name");
    const vehicle = await AsyncStorage.getItem("vehicle");
    return {
      accessToken,
      app_preferences: app_preferences ? JSON.parse(app_preferences) : null,
      balance: balance ? parseFloat(balance) : null,
      email,
      fWalletId,
      userId,
      driverId,
      available_for_work,
      user_type: user_type ? JSON.parse(user_type) : null,
      contact_email: contact_email ? JSON.parse(contact_email) : [],
      contact_phone: contact_phone ? JSON.parse(contact_phone) : [],
      avatar: avatar ? JSON.parse(avatar) : null,
      first_name,
      last_name,
      vehicle: vehicle ? JSON.parse(vehicle) : null,
    };
  }
);

// Define the AsyncThunk for saving user data to AsyncStorage
export const saveTokenToAsyncStorage = createAsyncThunk(
  "auth/saveToken",
  async (data: Partial<AuthState>) => {
    // Save each value and log it
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        if (typeof value === "object") {
          await AsyncStorage.setItem(key, JSON.stringify(value));
        } else {
          await AsyncStorage.setItem(key, String(value));
        }
      }
    }
    return data;
  }
);

// Define the AsyncThunk for saving vehicle details to AsyncStorage
export const saveVehicleDetailsToAsyncStorage = createAsyncThunk(
  "auth/saveVehicleDetails",
  async (data: {
    color: string;
    model: string;
    license_plate: string;
    owner: string;
    brand: string;
    year: number;
  }) => {
    await AsyncStorage.setItem("vehicle", JSON.stringify(data));
    return data;
  }
);

export const updateVehicle = createAsyncThunk(
  "auth/updateVehicle",
  async (vehicleDetails: Partial<Omit<Vehicle, "images">>) => {
    await AsyncStorage.setItem("vehicle", JSON.stringify(vehicleDetails));
    return vehicleDetails;
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (
    profileData: {
      first_name?: string;
      last_name?: string;
      contact_email?: ContactEmail[];
      contact_phone?: ContactPhone[];
    },
    { dispatch }
  ) => {
    await dispatch(saveTokenToAsyncStorage(profileData));
    return profileData;
  }
);

export const setAvatarInAsyncStorage = createAsyncThunk(
  "auth/setAvatarInAsyncStorage",
  async (avatar: { url: string; key: string }, { dispatch }) => {
    await dispatch(saveTokenToAsyncStorage({ avatar }));
    return avatar;
  }
);

// Define the AsyncThunk for logging out
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    // Clear all user-related data from AsyncStorage
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("app_preferences");
    await AsyncStorage.removeItem("balance");
    await AsyncStorage.removeItem("avatar");
    await AsyncStorage.removeItem("available_for_work");
    await AsyncStorage.removeItem("FWalletId");
    await AsyncStorage.removeItem("email");
    await AsyncStorage.removeItem("userId");
    await AsyncStorage.removeItem("driverId");
    await AsyncStorage.removeItem("user_type");
    await AsyncStorage.removeItem("contact_email");
    await AsyncStorage.removeItem("contact_phone");
    await AsyncStorage.removeItem("first_name");
    await AsyncStorage.removeItem("last_name");
    await AsyncStorage.removeItem("vehicle");

    // Dispatch the clearAuthState action to update the Redux store
    dispatch(clearAuthState());
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthState: (state, action) => {
      return { ...state, ...action.payload };
    },
    clearAuthState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTokenFromAsyncStorage.fulfilled, (state, action) => {
        return {
          ...state,
          ...action.payload,
          isAuthenticated: !!action.payload.accessToken,
        };
      })
      .addCase(saveTokenToAsyncStorage.fulfilled, (state, action) => {
        return { ...state, ...action.payload };
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        return { ...state, ...action.payload };
      })
      .addCase(setAvatarInAsyncStorage.fulfilled, (state, action) => {
        state.avatar = action.payload;
      })
      .addCase(logout.fulfilled, () => initialState);
  },
});

export const { setAuthState, clearAuthState } = authSlice.actions;
export default authSlice.reducer;
