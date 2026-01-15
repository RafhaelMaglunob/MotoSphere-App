import { View, Text, Pressable } from "react-native";

import { SummaryIcon } from "../../components/svg/SummaryIcon";
import { WarningIcon } from "../../components/svg/WarningIcon";
import { UpdateIcon } from "../../components/svg/UpdateIcon";
import { ClockIcon } from "../../components/svg/ClockIcon";

import { useState } from "react";

import { Notification } from "../../components/services/types";

type IconType = "alert" | "summary" | "system";

interface NotificationProp {
  notifications: Notification[];
}

export default function Notifications({ notifications }: NotificationProp) {
  const [filter, setFilter] = useState('all')

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
  ]

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true; // Show all notifications
    return notif.type === filter;       // Show only notifications matching filter
  });

  return (
    <View style={{ flexDirection: 'column', gap: 10 }}>
      <Text style={{ color: "#fff", fontSize: 25, fontWeight: "600" }}>Notifications</Text>
      <Text style={{ color: "#9BB3D6", fontSize: 13, fontWeight: "300" }}>
        Stay updated with your helmet's activity.
      </Text>

      {/* Filter  */}
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

      {/* Notifications */}
      {filteredNotifications.map((notif, index) => {
        const NotificationIcon = Icon[notif.type as IconType]?.icon;
        return (
          <Pressable
            key={index}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#0A1A3A" : "#0F2A52",
              padding: 20,
              borderRadius: 10,
              flexDirection: 'column',
              gap: 20
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
                    fontWeight: 'bold',
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

            {/* Date occurred */}
            <View
              style={{
                justifyContent: 'flex-end',
                alignSelf: 'flex-end',
                flexDirection: 'row'
              }}
            >
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
          </Pressable>
        )
      })}
    </View>
  );
}
