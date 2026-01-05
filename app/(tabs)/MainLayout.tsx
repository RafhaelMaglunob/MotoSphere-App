//MainLayout.tsx

import { useState } from "react";
import { ScrollView, View, Text, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import TopBar from "../../components/ui/TopBar";
import Sidebar from "../../components/ui/Sidebar";

import Login from "../Login";
import Home from "./Home";
import LiveGps from "./LiveGps";
import ContactPersons from "./ContactPersons";
import Devices from "./Devices";
import Notifications from "./Notifications";
import Settings from "./Settings";

import { User, Sensor, TrustedContact, GpsMetrics, Notification } from "../../components/services/types";
import { mockUser, mockSensor, mockTrustedContact, mockNotification } from "../../components/services/data";
import { useLiveGpsMetrics } from "../../components/services/useLiveGpsMetrics";

export default function MainLayout() {
    const [activeRoute, setActiveRoute] = useState("Home");
    const [showSidebar, setShowSidebar] = useState(false);

    const user: User = mockUser;
    const sensor: Sensor[] = mockSensor;
    const trustedContact: TrustedContact[] = mockTrustedContact;
    const metrics: GpsMetrics[] = useLiveGpsMetrics();
    const notifications: Notification[] = mockNotification;

    const buttons = [
        { name: "Home", route: "Home" },
        { name: "Live GPS", route: "LiveGps" },
        { name: "Contact Persons", route: "ContactPersons" },
        { name: "Devices", route: "Devices" },
        { name: "Notifications", route: "Notifications" },
        { name: "Settings", route: "Settings" },
    ];

    const handleLogout = () => {
        //Logic and clearing out all data

        setActiveRoute("Login")
    }

    const footer = (
        <View style={{ marginTop: "auto", paddingHorizontal: 20, paddingBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
                <View
                    style={{
                        backgroundColor: "rgba(6,182,212,0.2)",
                        padding: 8,
                        borderRadius: 50,
                        marginRight: 10,
                    }}
                />
                <View>
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>{user.name}</Text>
                    <Text style={{ color: "#9BB3D6", fontSize: 12 }}>{user.role}</Text>
                </View>
            </View>
            <Pressable onPress={() => handleLogout()} style={{ flexDirection: "row", alignItems: "center" }}>
                <Image
                    source={require("../../components/img/Logout.png")}
                    style={{ width: 16, height: 16, marginRight: 5 }}
                />
                <Text style={{ color: "#F87171" }}>Log Out</Text>
            </Pressable>
        </View>
    );

    // Render main content
    const renderScreen = () => {
        switch (activeRoute) {
            case "Home":
                return (
                    <Home 
                        user={user} 
                        sensors={sensor} 
                        trustedContact={trustedContact} 
                        setActiveRoute={setActiveRoute}
                    />
                );
            case "LiveGps":
                return (
                <LiveGps 
                    metrics={metrics}
                />
                )
            case "ContactPersons":
                return (
                    <ContactPersons 
                        setActiveRoute={setActiveRoute} 
                        trustedContact={trustedContact}
                    />
                )
            case "Devices":
                return <Devices />;
            case "Notifications":
                return <Notifications notifications={notifications}/>;
            case "Settings":
                return <Settings user={user} setActiveRoute={setActiveRoute}/>;
            default:
                return <Home user={user} sensors={sensor} trustedContact={trustedContact} setActiveRoute={setActiveRoute} />;
        }
    };

    // If on Login, hide sidebar completely
    if (activeRoute === "Login") {
        return (
            <Login 
                onLoginSuccess={() => {
                    setActiveRoute("Home")
                }} 
            />
        )
    }

    return (
        <View style={{ flex: 1, flexDirection: "row", backgroundColor: "#0a1a3a" }}>
            {/* Sidebar */}
            <Sidebar
                buttons={buttons}
                showSidebar={showSidebar}
                setShowSidebar={setShowSidebar}
                setActiveRoute={setActiveRoute}
                activeRoute={activeRoute}
                footer={footer}
            />

            {/* Main content */}
            <View style={{ flex: 1 }}>
                <TopBar onBurgerClick={() => setShowSidebar(!showSidebar)} />

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1 }} // allows ScrollView to grow
                >
                    <LinearGradient
                        colors={["#0A1A3A", "#0F2A52", "#0A1A3A"]}
                        locations={[0, 0.5, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0.8 }}
                        style={{ flex: 1, padding: 20 }}
                    >
                        {renderScreen()}
                    </LinearGradient>
                </ScrollView>
            </View>
        </View>
    );
}