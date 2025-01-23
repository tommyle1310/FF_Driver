import IconOcticons from "react-native-vector-icons/Octicons";
import IconMaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import IconIonicons from "react-native-vector-icons/Ionicons";
import IconMaterialIcons from "react-native-vector-icons/MaterialIcons";
import IconEntypo from "react-native-vector-icons/Entypo";

// Define the sidebar items with a screen name and icon
export const data_sidebar = [
  {
    title: 'My tasks',
    icon: <IconOcticons name="tasklist" size={20} color="#63c550" />,
    screen: 'MyTasks',  // Store the screen name
  },
  {
    title: 'Track History',
    icon: <IconMaterialCommunityIcons name="history" size={20} color="#63c550" />,
    screen: 'TrackHistory',
  },
  {
    title: 'Statistics',
    icon: <IconIonicons name="stats-chart" size={20} color="#63c550" />,
    screen: 'Statistics',
  },
  {
    title: 'Notifications',
    icon: <IconEntypo name="notification" size={20} color="#63c550" />,
    screen: 'Notifications',
  },
  {
    title: 'My Wallet',
    icon: <IconEntypo name="wallet" size={20} color="#63c550" />,
    screen: 'MyWallet',
  },
  {
    title: 'Support Center',
    icon: <IconMaterialIcons name="support-agent" size={20} color="#63c550" />,
    screen: 'SupportCenter',
  },
  {
    title: 'Settings',
    icon: <IconIonicons name="settings" size={20} color="#63c550" />,
    screen: 'Settings',
  },
];
