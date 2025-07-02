import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Image } from "react-native";
import React, { useEffect, useState } from "react";
import FFView from "@/src/components/FFView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFText from "@/src/components/FFText";
import FFAvatar from "@/src/components/FFAvatar";
import FFBadge from "@/src/components/FFBadge";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import axiosInstance from "@/src/utils/axiosConfig";
import colors from "@/src/theme/colors";
import { format, formatDistanceToNow } from "date-fns";

type NotificationsScreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "Notifications"
>;

interface Notification {
  id: string;
  avatar: {
    key: string;
    url: string;
  };
  title: string;
  desc: string;
  image: string | null;
  link: string;
  target_user: string[];
  created_by_id: string;
  is_read: boolean;
  target_user_id: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

const NotificationsScreen = () => {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  const driverId = useSelector((state: RootState) => state.auth.driverId);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/drivers/notifications/${driverId}`);
        if (response.data.EC === 0) {
          setNotifications(response.data.data);
        } else {
          setError(response.data.EM || "Failed to fetch notifications");
        }
      } catch (err) {
        setError("An error occurred while fetching notifications");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (driverId) {
      fetchNotifications();
    }
  }, [driverId]);

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp));
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (diffInDays < 7) {
      return format(date, 'EEEE');
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.is_read && styles.unreadItem]}
      onPress={() => {
        // Handle notification press - mark as read, navigate to link, etc.
        console.log("Notification pressed:", item.id);
      }}
    >
      <View style={styles.notificationContent}>
        <View style={styles.avatarContainer}>
          {item.avatar?.url ? (
            <FFAvatar avatar={item.avatar.url} size={50} />
          ) : (
            <View style={styles.placeholderAvatar} />
          )}
        </View>
        
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <FFText fontSize="md" fontWeight="700" style={styles.title}>
              {item.title}
            </FFText>
         
          </View>
          
          <FFText fontSize="sm" style={styles.description}>
            {item.desc}
          </FFText>
          
          {!item.is_read && (
            <View style={styles.badgeContainer}>
              <FFBadge backgroundColor={colors.primary} textColor={colors.white}>
                <FFText fontSize="sm" style={{ color: colors.white }}>
                  New
                </FFText>
                
              </FFBadge>
                 <FFText fontSize="sm" style={{color: colors.grey}}>
              {formatDate(item.created_at)}
            </FFText>
            </View>
          )}
        </View>
      </View>
      
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.notificationImage} />
      )}
    </TouchableOpacity>
  );

  return (
    <FFSafeAreaView>
      <FFScreenTopSection title="Notifications" navigation={navigation} />
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <FFText fontSize="md" style={styles.errorText}>{error}</FFText>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <FFText fontSize="md">No notifications yet</FFText>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </FFSafeAreaView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadItem: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  notificationContent: {
    flexDirection: 'row',
  },
  avatarContainer: {
    marginRight: 12,
  },
  placeholderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.lightGrey,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  time: {
    color: colors.textSecondary,
  },
  description: {
    color: colors.textSecondary,
    marginBottom: 8,
  },
  badgeContainer: {
    justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row'
  },
  notificationImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
