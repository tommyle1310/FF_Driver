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
      (await AsyncStorage.getItem("available_for_work")) === "true"; // ensure it's converted to a boolean
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
  async (data: {
    accessToken: string;
    app_preferences: object;
    balance: number;
    available_for_work: boolean;
    email: string;
    fWalletId: string;
    driverId: string;
    userId: string;
    avatar: { url: string; key: string };
    user_type: string[];
    contact_email: ContactEmail[];
    contact_phone: ContactPhone[];
    first_name: string;
    last_name: string;
    vehicle?: Vehicle;
  }) => {
    // Save each value and log it
    await AsyncStorage.setItem("accessToken", data.accessToken);
    await AsyncStorage.setItem(
      "app_preferences",
      JSON.stringify(data.app_preferences)
    );
    await AsyncStorage.setItem("balance", data.balance.toString());
    await AsyncStorage.setItem("email", data.email);
    await AsyncStorage.setItem(
      "available_for_work",
      JSON.stringify(data.available_for_work)
    );
    await AsyncStorage.setItem("fWalletId", data.fWalletId);
    await AsyncStorage.setItem("userId", data.userId);
    await AsyncStorage.setItem("driverId", data.driverId);
    await AsyncStorage.setItem("user_type", JSON.stringify(data.user_type));
    await AsyncStorage.setItem(
      "contact_email",
      JSON.stringify(data.contact_email)
    );
    await AsyncStorage.setItem("avatar", JSON.stringify(data.avatar));
    await AsyncStorage.setItem(
      "contact_phone",
      JSON.stringify(data.contact_phone)
    );
    await AsyncStorage.setItem("first_name", data.first_name);
    await AsyncStorage.setItem("last_name", data.last_name);
    if (data.vehicle) {
      await AsyncStorage.setItem("vehicle", JSON.stringify(data.vehicle));
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

export const setAvatarInAsyncStorage = createAsyncThunk(
  "auth/setAvatarInAsyncStorage",
  async (avatar: { url: string; key: string }) => {
    await AsyncStorage.setItem("avatar", JSON.stringify(avatar));
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
      const {
        accessToken,
        app_preferences,
        balance,
        email,
        avatar,
        fWalletId,
        driverId,
        userId,
        user_type,
        contact_email,
        contact_phone,
        available_for_work,
        first_name,
        last_name,
        vehicle,
      } = action.payload;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.app_preferences = app_preferences;
      state.balance = balance;
      state.email = email;
      state.avatar = avatar;
      state.fWalletId = fWalletId;
      state.driverId = driverId;
      state.available_for_work = available_for_work;
      state.userId = userId;
      state.user_type = user_type;
      state.contact_email = contact_email;
      state.contact_phone = contact_phone;
      state.first_name = first_name;
      state.last_name = last_name;
      state.vehicle = vehicle;
    },
    clearAuthState: (state) => {
      state.accessToken = null;
      state.isAuthenticated = false;
      state.available_for_work = false;
      state.app_preferences = null;
      state.balance = null;
      state.email = null;
      state.avatar = null;
      state.driverId = null;
      state.userId = null;
      state.fWalletId = null;
      state.user_type = null;
      state.contact_email = [];
      state.contact_phone = [];
      state.first_name = null;
      state.last_name = null;
      state.vehicle = null;
    },
    setBalance: (state, action) => {
      state.balance = action.payload; // Update the balance
    },
    setAvatar: (state, action) => {
      const { url, key } = action.payload;
      state.avatar = { url, key }; // Update avatar state
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTokenFromAsyncStorage.fulfilled, (state, action) => {
        const {
          accessToken,
          app_preferences,
          balance,
          avatar,
          fWalletId,
          email,
          userId,
          driverId,
          user_type,
          contact_email,
          contact_phone,
          available_for_work,
          first_name,
          last_name,
          vehicle,
        } = action.payload;

        if (accessToken) {
          state.accessToken = accessToken;
          state.isAuthenticated = true;
          state.available_for_work = available_for_work;
          state.app_preferences = app_preferences;
          state.balance = balance;
          state.avatar = avatar;
          state.fWalletId = fWalletId;
          state.email = email;
          state.userId = userId;
          state.driverId = driverId;
          state.user_type = user_type;
          state.contact_email = contact_email;
          state.contact_phone = contact_phone;
          state.first_name = first_name;
          state.last_name = last_name;
          state.vehicle = vehicle;
        } else {
          state.isAuthenticated = false;
        }
      })
      .addCase(saveTokenToAsyncStorage.fulfilled, (state, action) => {
        const {
          accessToken,
          app_preferences,
          balance,
          avatar,
          fWalletId,
          email,
          userId,
          user_type,
          driverId,
          contact_email,
          contact_phone,
          available_for_work,
          first_name,
          last_name,
          vehicle,
        } = action.payload;
        state.accessToken = accessToken;
        state.isAuthenticated = true;
        state.available_for_work = available_for_work;
        state.app_preferences = app_preferences;
        state.balance = balance;
        state.fWalletId = fWalletId;
        state.email = email;
        state.avatar = avatar;
        state.userId = userId;
        state.driverId = driverId;
        state.user_type = user_type;
        state.contact_email = contact_email;
        state.contact_phone = contact_phone;
        state.first_name = first_name;
        state.last_name = last_name;
        state.vehicle = vehicle ?? null;
      })
      .addCase(updateVehicle.fulfilled, (state, action) => {
        if (state.vehicle) {
          state.vehicle = {
            ...state.vehicle,
            ...action.payload,
          };
        } else {
          state.vehicle = {
            images: [],
            ...action.payload,
          } as Vehicle;
        }
      })
      .addCase(logout.fulfilled, (state) => {
        state.accessToken = null;
        state.isAuthenticated = false;
        state.available_for_work = false;
        state.app_preferences = null;
        state.avatar = null;
        state.fWalletId = null;
        state.driverId = null;
        state.balance = null;
        state.email = null;
        state.userId = null;
        state.user_type = null;
        state.contact_email = [];
        state.contact_phone = [];
        state.first_name = null;
        state.last_name = null;
        state.vehicle = null;
      });
  },
});

export const { setAuthState, clearAuthState, setBalance, setAvatar } =
  authSlice.actions;

export default authSlice.reducer;
