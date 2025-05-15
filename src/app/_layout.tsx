import "../../global.css";
import "react-native-reanimated";
// import { ThemeProvider } from "@src/hooks/useTheme";
// import AppNavigator from "@src/navigation/AppNavigator";
import { Provider } from "react-redux";
// import store from "@store/store";
// import RootLayout from "@screens/RootLayout";
import TestNotification from "./testNotification";
import store from "../store/store";
import RootLayout from "@/screens/RootLayout";

export default function Layout() {
  // Render screen based on the current tab selection

  return (
    <Provider store={store}>
      <RootLayout />
      {/* <TestNotification /> */}
    </Provider>
  );
}
