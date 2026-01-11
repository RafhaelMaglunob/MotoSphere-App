//MainLayout.tsx

import { useState, useRef } from "react";
import { useSearchParams } from "expo-router/build/hooks";
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
import { mockSensor, mockTrustedContact, mockNotification } from "../../components/services/data";

import { users } from "../../components/services/users";
import { contacts } from "../../components/services/trustedContacts";

export default function MainLayout(props: { index?: string }) {
    const params = useSearchParams(); // returns URLSearchParams
    const index = Number(props.index ?? params.get('index') ?? -1);

    const scrollRef = useRef<ScrollView>(null);

    const [currentUser, setCurrentUser] = useState<User>(users[index]);
    const [activeRoute, setActiveRoute] = useState("Home");
    const [showSidebar, setShowSidebar] = useState(false);

    const user: User = users[index];
    const sensor: Sensor[] = mockSensor;
    const trustedContact: TrustedContact[] = contacts.filter(
        (c) => c.ownerEmail === user.email
    );

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

    const handleRouteChange = (route: string) => {
        setActiveRoute(route);

        // Scroll to top whenever route changes
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    };

    const handleUpdateUser = (updatedUser: Partial<User>) => {
        const updated = { ...currentUser, ...updatedUser };

        // Update the in-memory array as well
        users[index] = updated;

        // Update state so React re-renders
        setCurrentUser(updated);
    };

    // ContactPersons Function
    


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
                        setActiveRoute={handleRouteChange}
                    />
                );
            case "LiveGps":
                return (
                    <LiveGps
                        trustedContact={trustedContact}
                    />
                )
            case "ContactPersons":
                return (
                    <ContactPersons
                        setActiveRoute={handleRouteChange}
                        currentUserEmail={user.email}
                    />
                )
            case "Devices":
                return <Devices />;
            case "Notifications":
                return <Notifications notifications={notifications} />;
            case "Settings":
                return <Settings userIndex={index} user={user} setActiveRoute={handleRouteChange} updateUser={handleUpdateUser} />;
            default:
                return <Home user={user} sensors={sensor} trustedContact={trustedContact} setActiveRoute={setActiveRoute} />;
        }
    };

    // If on Login, hide sidebar completely
    if (activeRoute === "Login") {
        return (
            <Login
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
                setActiveRoute={handleRouteChange}
                activeRoute={activeRoute}
                footer={footer}
            />

            {/* Main content */}
            <View style={{ flex: 1 }}>
                <TopBar onBurgerClick={() => setShowSidebar(!showSidebar)} />
                <ScrollView
                    ref={scrollRef}
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