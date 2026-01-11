import { View, Text, Pressable } from "react-native";
import { HistoryIcon } from "../../components/svg/HistoryIcon";
import { ShareIcon } from "../../components/svg/ShareIcon";

const ActionButton = ({ icon: Icon, title, bgColor, onPress }: any) => (
  <Pressable style={{ flex: 1 }} onPress={onPress}>
    <View
      style={{
        backgroundColor: bgColor,
        paddingVertical: 15,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 11,
        flexDirection: "row",
        gap: 14,
      }}
    >
      <Icon size={20} />
      <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>{title}</Text>
    </View>
  </Pressable>
);

export default function LiveGps() {
    return (
        <View style={{ flexDirection: "column", gap: 18, padding: 16 }}>
            <Text style={{ color: "#fff", fontSize: 25, fontWeight: "600" }}>Live Tracking</Text>
            <Text style={{ color: "#9BB3D6", fontSize: 13, fontWeight: "300" }}>
                Real-time location monitoring and route history.
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 15 }}>
                <ActionButton
                    icon={HistoryIcon}
                    title="History"
                    bgColor="#0F2A52"
                    onPress={() => console.log("History pressed")}
                />
                <ActionButton
                    icon={ShareIcon}
                    title="Share"
                    bgColor="#2EA8FF"
                    onPress={() => console.log("Share pressed")}
                />
            </View>

            <View style={{ 
                height: 250, 
                borderRadius: 12, 
                overflow: "hidden", 
                marginTop: 10,
                backgroundColor: "#0F2A52",
                justifyContent: "center",
                alignItems: "center",
            }}>
                <Text style={{ color: "#fff", fontSize: 18, textAlign: "center" }}>
                    Map not supported on Web
                </Text>
                <Text style={{ color: "#9BB3D6", fontSize: 14, textAlign: "center", marginTop: 5 }}>
                    Open this app on a mobile device to see your live location.
                </Text>
            </View>
        </View>
    );
}