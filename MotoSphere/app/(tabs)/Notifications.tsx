import { View, Text, Pressable, ActivityIndicator } from "react-native";

import { SummaryIcon } from "../../components/svg/SummaryIcon";
import { WarningIcon } from "../../components/svg/WarningIcon";
import { UpdateIcon } from "../../components/svg/UpdateIcon";
import { ClockIcon } from "../../components/svg/ClockIcon";

import { useState, useEffect } from "react";

import { Notification } from "../../components/services/types";

import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications
} from "../../Backend/controller/user/notificationService";

import { auth } from "../../Backend/firebase";

type IconType = "alert" | "summary" | "system";


interface NotificationProps {
  onRefresh?: () => Promise<void>;
}
export default function Notifications({onRefresh}: NotificationProps) {
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const Icon: Record<IconType, { icon: React.FC<any> }> = {
    alert: { icon: WarningIcon },
    summary: { icon: SummaryIcon },
    system: { icon: UpdateIcon },
  };

  const buttons = [
    { type: "all", name: "All" },
    { type: "summary", name: "Summary" },
    { type: "alert", name: "Alerts" },
    { type: "system", name: "System" },
  ];

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // Load notifications from backend
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const user = auth.currentUser;

      if (!user) {
        console.error('No authenticated user');
        return;
      }

      const result = await getUserNotifications(user.uid, 50);

      if (result.success) {
        setNotifications(result.notifications);
        // Count unread
        const unread = result.notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } else {
        console.error('Failed to load notifications:', result.error);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    return notif.type === filter;
  });

  // Handle notification press - mark as read
  const handleNotificationPress = async (notif: Notification) => {
    if (!notif.id || notif.isRead) return;

    try {
      const result = await markNotificationAsRead(notif.id);

      if (result.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const result = await deleteNotification(notificationId);

      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const result = await markAllNotificationsAsRead(user.uid);

      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const result = await deleteAllNotifications(user.uid);

      if (result.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#22D3EE" />
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'column', gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'column', gap: 3 }}>
          <Text style={{ color: "#fff", fontSize: 25, fontWeight: "600" }}>Notifications</Text>
          <Text style={{ color: "#9BB3D6", fontSize: 13, fontWeight: "300" }}>
            Stay updated with your helmet's activity.
          </Text>
        </View>

        {unreadCount > 0 && (
          <View style={{
            backgroundColor: '#EF4444',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12
          }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
              {unreadCount}
            </Text>
          </View>
        )}
      </View>

      {/* Filter */}
      <View style={{ flexDirection: "row", alignItems: "stretch" }}>
        {buttons.map((button, index) => (
          <Pressable
            key={index}
            onPress={() => setFilter(button.type)}
            style={{
              flex: 1,
              height: 40,
              justifyContent: "center",
              alignItems: "center",
              borderBottomColor: filter === button.type ? "#22D3EE" : "transparent",
              borderBottomWidth: 2,
            }}
          >
            <Text
              style={{
                color: filter === button.type ? "#22D3EE" : "#9BB3D6",
                fontWeight: 'bold'
              }}
            >
              {button.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Action Buttons */}
      {notifications.length > 0 && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {unreadCount > 0 && (
            <Pressable
              onPress={handleMarkAllAsRead}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: '#1E293B',
                borderRadius: 8,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#22D3EE', fontSize: 12, fontWeight: '600' }}>
                Mark All Read
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleClearAll}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>
              Clear All
            </Text>
          </Pressable>
        </View>
      )}

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 40
        }}>
          <Text style={{ color: '#9BB3D6', fontSize: 16 }}>
            No notifications yet
          </Text>
        </View>
      )}

      {/* Notifications List */}
      {filteredNotifications.map((notif, index) => {
        const NotificationIcon = Icon[notif.type as IconType]?.icon;
        return (
          <View
            key={notif.id || index}
            style={{
              opacity: notif.isRead ? 0.6 : 1
            }}
          >
            <Pressable
              onPress={() => handleNotificationPress(notif)}
              onLongPress={() => {
                if (notif.id) handleDeleteNotification(notif.id);
              }}
              style={({ pressed }) => ({
                backgroundColor: pressed ? "#0A1A3A" : (notif.isRead ? "#0A1A3A" : "#0F2A52"),
                padding: 20,
                borderRadius: 10,
                flexDirection: 'column',
                gap: 20,
                borderLeftWidth: notif.isRead ? 0 : 3,
                borderLeftColor: notif.isRead ? 'transparent' : '#22D3EE'
              })}
            >
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View
                  style={{
                    backgroundColor:
                      notif.type === "alert" ? "rgba(239, 68, 68, 0.1)" :
                        notif.type === "system" ? "rgba(6, 182, 212, 0.1)" :
                          notif.type === "summary" ? "rgba(34, 197, 94, 0.1)" :
                            "#000/10",
                    padding: 11,
                    alignSelf: 'flex-start',
                    borderRadius: 12
                  }}
                >
                  <NotificationIcon />
                </View>

                {/* Title and description */}
                <View style={{ flexDirection: 'column', maxWidth: '80%', gap: 5 }}>
                  <Text
                    style={{
                      color: '#fff',
                      fontWeight: notif.isRead ? '500' : 'bold',
                      fontSize: 18,
                      lineHeight: 25
                    }}
                  >
                    {notif.title}
                  </Text>
                  <Text
                    style={{
                      color: '#9BB3D6',
                      fontSize: 10,
                      lineHeight: 15
                    }}
                  >
                    {notif.description}
                  </Text>
                </View>
              </View>

              {/* Date and read indicator */}
              <View
                style={{
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <View style={{ flexDirection: 'row' }}>
                  <ClockIcon />
                  <Text
                    style={{
                      marginLeft: 10,
                      color: '#9BB3D6',
                      fontSize: 10.5
                    }}
                  >
                    {notif.date}
                  </Text>
                </View>

                {!notif.isRead && (
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#22D3EE'
                  }} />
                )}
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}