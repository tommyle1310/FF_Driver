// store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice"; // Replace with the correct path to your auth slice
import availabilityReducer from "./availabilitySlice"; // Replace with the correct path to your auth slice
import currentDriverProgressStage from "./currentDriverProgressStageSlice"; // Replace with the correct path to your auth slice
import chatReducer from "./chatSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    availability: availabilityReducer,
    currentDriverProgressStage: currentDriverProgressStage,
    chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { store };
export default store;
