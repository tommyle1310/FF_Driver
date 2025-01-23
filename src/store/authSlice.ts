import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the types of state we will use in this slice
interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  app_preferences: object | null;
  balance: number | null;
  email: string | null;
  userId: string | null;
  fWalletId: string | null;
  user_type: string[] | null;  // user_type is an array of strings
}

// Initialize the state
const initialState: AuthState = {
  accessToken: null,
  fWalletId: null,
  isAuthenticated: false,
  app_preferences: {},
  balance: null,
  email: null,
  userId: null,
  user_type: null,
};

// Define the AsyncThunk for loading token and user data from AsyncStorage
export const loadTokenFromAsyncStorage = createAsyncThunk('auth/loadToken', async () => {
  const accessToken = await AsyncStorage.getItem('accessToken');
  const app_preferences = await AsyncStorage.getItem('app_preferences');
  const fWalletId = await AsyncStorage.getItem('fWalletId');
  const balance = await AsyncStorage.getItem('balance');
  const email = await AsyncStorage.getItem('email');
  const userId = await AsyncStorage.getItem('userId');
  const user_type = await AsyncStorage.getItem('user_type');

  return {
    accessToken,
    app_preferences: user_type ? JSON.parse(user_type) : null,
    balance: balance ? parseFloat(balance) : null,  // Parse balance as a number
    email,
    fWalletId,
    userId,
    user_type: user_type ? JSON.parse(user_type) : null,  // Parse user_type if it exists
  };
});

// Define the AsyncThunk for saving user data to AsyncStorage
export const saveTokenToAsyncStorage = createAsyncThunk(
  'auth/saveToken',
  async (data: {
    accessToken: string;
    app_preferences: object;
    balance: number;
    email: string;
    fWalletId: string;
    userId: string;
    user_type: string[];  // user_type is an array of strings
  }) => {
    await AsyncStorage.setItem('accessToken', data.accessToken);
    await AsyncStorage.setItem('app_preferences', JSON.stringify(data.app_preferences));
    await AsyncStorage.setItem('balance', data.balance.toString());
    await AsyncStorage.setItem('email', data.email);
    await AsyncStorage.setItem('fWalletId', data.fWalletId);
    await AsyncStorage.setItem('userId', data.userId);
    await AsyncStorage.setItem('user_type', JSON.stringify(data.user_type));  // Stringify user_type array
    return data;
  }
);

// Define the AsyncThunk for logging out
export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  // Clear all user-related data from AsyncStorage
  await AsyncStorage.removeItem('accessToken');
  await AsyncStorage.removeItem('app_preferences');
  await AsyncStorage.removeItem('balance');
  await AsyncStorage.removeItem('FWalletId');
  await AsyncStorage.removeItem('email');
  await AsyncStorage.removeItem('userId');
  await AsyncStorage.removeItem('user_type');

  // Dispatch the clearAuthState action to update the Redux store
  dispatch(clearAuthState());
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthState: (state, action) => {
      const { accessToken, app_preferences, balance, email, fWalletId, userId, user_type } = action.payload;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.app_preferences = app_preferences;
      state.balance = balance;
      state.email = email;
      state.fWalletId = fWalletId;
      state.userId = userId;
      state.user_type = user_type;
    },
    clearAuthState: (state) => {
      state.accessToken = null;
      state.isAuthenticated = false;
      state.app_preferences = null;
      state.balance = null;
      state.email = null;
      state.userId = null;
      state.fWalletId = null;
      state.user_type = null;
    },
    setBalance: (state, action) => {
      state.balance = action.payload; // Update the balance
    }

  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTokenFromAsyncStorage.fulfilled, (state, action) => {
        const { accessToken, app_preferences, balance, fWalletId, email, userId, user_type } = action.payload;

        if (accessToken) {
          state.accessToken = accessToken;
          state.isAuthenticated = true;
          state.app_preferences = app_preferences;
          state.balance = balance;
          state.fWalletId = fWalletId;
          state.email = email;
          state.userId = userId;
          state.user_type = user_type;
        } else {
          state.isAuthenticated = false;
        }
      })
      .addCase(saveTokenToAsyncStorage.fulfilled, (state, action) => {
        const { accessToken, app_preferences, balance, fWalletId, email, userId, user_type } = action.payload;
        state.accessToken = accessToken;
        state.isAuthenticated = true;
        state.app_preferences = app_preferences;
        state.balance = balance;
        state.fWalletId = fWalletId;
        state.email = email;
        state.userId = userId;
        state.user_type = user_type;
      })
      .addCase(logout.fulfilled, (state) => {
        // This will be handled by the clearAuthState action
        state.accessToken = null;
        state.isAuthenticated = false;
        state.app_preferences = null;
        state.fWalletId = null;
        state.balance = null;
        state.email = null;
        state.userId = null;
        state.user_type = null;
      });
  },
});

export const { setAuthState, clearAuthState, setBalance } = authSlice.actions;

export default authSlice.reducer;
