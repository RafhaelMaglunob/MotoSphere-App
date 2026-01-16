// app/(tabs)/MainLayout.tsx
import React, { useState, useRef, useEffect } from "react";
import { ScrollView, View, Text, Pressable, Image, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import TopBar from "../../components/ui/TopBar";
import Sidebar from "../../components/ui/Sidebar";

import Login from "../Login";
import Home from "./Home";
import LiveGps from "./LiveGps";
import ContactPersons from "./ContactPersons";
import Devices from "./Devices";
import Notifications from "./Notifications";
import Settings from "./Settings";

import { User, Sensor, TrustedContact, Notification } from "../../components/services/types";
import { mockSensor, mockNotification } from "../../components/services/data";
import { contacts } from "../../components/services/trustedContacts";

// Firebase
import { auth } from "../../Backend/firebase";
import { fetchUser, logoutUser } from "../../Backend/controller/authController";
import { getUserData } from "../../Backend/secureStore";

export default function MainLayout() {
    const scrollRef = useRef<ScrollView>(null);
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [trustedContact, setTrustedContact] = useState<TrustedContact[]>([]);
    const [activeRoute, setActiveRoute] = useState("Home");
    const [showSidebar, setShowSidebar] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const sensors: Sensor[] = mockSensor;
    const notifications: Notification[] = mockNotification;

    // Load user on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
                const current = auth.currentUser;
                if (!current) {
                    setIsLoading(false);
                    return;
                }

                // 1️⃣ Try to load cached data first (instant)
                const cached = await getUserData();
                if (cached?.userData) {
                    setUser(cached.userData);
                    setTrustedContact(cached.trustedContacts || []);
                }

                // 2️⃣ Fetch fresh data in background (no await, don't block UI)
                fetchUser(current.uid).then(result => {
                    if (result) {
                        setUser(result.userData);
                        setTrustedContact(result.trustedContacts);
                    }
                }).catch(err => console.error('Background fetch failed:', err));

            } catch (err) {
                console.error('Failed to load user:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, []);

    const buttons = [
        { name: "Home", route: "Home" },
        { name: "Live GPS", route: "LiveGps" },
        { name: "Contact Persons", route: "ContactPersons" },
        { name: "Devices", route: "Devices" },
        { name: "Notifications", route: "Notifications" },
        { name: "Settings", route: "Settings" },
    ];

    const handleLogout = async () => {
        try {
            // 1️⃣ Sign out from Firebase
            await auth.signOut();
            
            // 2️⃣ Clear local cache and token
            await logoutUser();
            
            // 3️⃣ Clear state
            setUser(null);
            setTrustedContact([]);
            setActiveRoute("Home");
            
            // 4️⃣ Navigate to Login
            router.replace('/Login');
        } catch (err) {
            console.error("❌ Failed to logout:", err);
        }
    };

    const handleRouteChange = (route: string) => {
        setActiveRoute(route);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    };

    const footer = (
        <View style={{ marginTop: "auto", paddingHorizontal: 20, paddingBottom: 20 }}>
            {user ? (
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
            ) : (
                <ActivityIndicator size="small" color="#06B6D4" style={{ marginBottom: 15 }} />
            )}

            <Pressable onPress={() => handleLogout()} style={{ flexDirection: "row", alignItems: "center" }}>
                <Image
                    source={require("../../components/img/Logout.png")}
                    style={{ width: 16, height: 16, marginRight: 5 }}
                />
                <Text style={{ color: "#F87171" }}>Log Out</Text>
            </Pressable>
        </View>
    );

    const renderScreen = () => {
        if (!user) {
            return (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color="#06B6D4" />
                    <Text style={{ color: "#9BB3D6", marginTop: 10 }}>Loading...</Text>
                </View>
            );
        }

        switch (activeRoute) {
            case "Home":
                return <Home user={user} sensors={sensors} trustedContact={trustedContact} setActiveRoute={handleRouteChange} />;
            case "LiveGps":
                return <LiveGps trustedContact={trustedContact} />;
            case "ContactPersons":
                return <ContactPersons setActiveRoute={handleRouteChange} currentUserEmail={user.email} />;
            case "Devices":
                return <Devices />;
            case "Notifications":
                return <Notifications notifications={notifications} />;
            case "Settings":
            default:
                return <Home user={user} sensors={sensors} trustedContact={trustedContact} setActiveRoute={handleRouteChange} />;
        }
    };

    if (activeRoute === "Login") return <Login />;

    return (
        <View style={{ flex: 1, flexDirection: "row", backgroundColor: "#0a1a3a" }}>
            <Sidebar
                buttons={buttons}
                showSidebar={showSidebar}
                setShowSidebar={setShowSidebar}
                setActiveRoute={handleRouteChange}
                activeRoute={activeRoute}
                footer={footer}
            />

            <View style={{ flex: 1 }}>
                <TopBar onBurgerClick={() => setShowSidebar(!showSidebar)} />
                <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
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