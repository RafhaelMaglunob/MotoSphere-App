// app/(tabs)/MainLayout.tsx
import React, { useState, useRef, useEffect } from "react";
import { ScrollView, View, Text, Pressable, Image, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import TopBar from "../../components/ui/TopBar";
import Sidebar from "../../components/ui/Sidebar";

import { Alert } from "react-native";

import Login from "../Login";
import Home from "./Home";
import LiveGps from "./LiveGps";
import ContactPersons from "./ContactPersons";
import Devices from "./Devices";
import Notifications from "./Notifications";
import Settings from "./Settings";

import { User, Sensor, TrustedContact } from "../../components/services/types";
import { mockSensor } from "../../components/services/data";

// Firebase
import { auth } from "../../Backend/firebase";
import { fetchUser } from "../../Backend/controller/user/userService";
import { logoutUser } from "../../Backend/authController";
import { useExitConfirmation } from "../../components/navigation/BackButtonHandler";

export default function MainLayout() {
    useExitConfirmation();
    const scrollRef = useRef<ScrollView>(null);
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [trustedContact, setTrustedContact] = useState<TrustedContact[]>([]);
    const [activeRoute, setActiveRoute] = useState("Home");
    const [showSidebar, setShowSidebar] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const sensors: Sensor[] = mockSensor;

    // Load user on mount - ALWAYS fetch fresh data on login
    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        setIsLoading(true);
        try {
            const current = auth.currentUser;
            if (!current) {
                console.log('❌ No authenticated user');
                setIsLoading(false);
                return;
            }

            console.log('🔄 Loading fresh user data on login...');

            // ALWAYS force refresh on login - bypass cache completely
            const result = await fetchUser(current.uid, true); // true = force refresh

            if (result) {
                setUser(result.userData);
                setTrustedContact(result.trustedContacts || []);
                console.log('✅ Fresh data loaded on login:', {
                    user: result.userData.name,
                    email: result.userData.email,
                    contactsCount: result.trustedContacts?.length || 0
                });
            } else {
                console.error('❌ Failed to fetch user data');
            }

        } catch (err) {
            console.error("❌ Failed to load user:", err);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Refresh trusted contacts without reloading entire user
     * Called after accepting/rejecting contact requests
     */
    const refreshTrustedContacts = async () => {
        try {
            const current = auth.currentUser;
            if (!current) return;

            console.log('🔄 Refreshing trusted contacts...');

            // Fetch fresh data from Firebase
            const result = await fetchUser(current.uid, true); // force refresh

            if (result) {
                setTrustedContact(result.trustedContacts || []);
                console.log('✅ Trusted contacts refreshed:', {
                    contactsCount: result.trustedContacts?.length || 0
                });
            }
        } catch (err) {
            console.error('❌ Failed to refresh trusted contacts:', err);
        }
    };

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
            Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    },
                    {
                        text: 'Logout',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                await auth.signOut();
                                setActiveRoute("Login");
                            } catch (error) {
                                console.error("❌ Logout error:", error);
                                Alert.alert("Error", "Failed to logout");
                            }
                        }
                    }
                ]
            );
        } catch (err) {
            console.error("❌ Failed to logout:", err);
        }
    };

    const handleRouteChange = (route: string) => {
        setActiveRoute(route);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    };

    const handleUserUpdate = (updatedUser: User) => {
        setUser(updatedUser);
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
                    <Text style={{ color: "#9BB3D6", marginTop: 10 }}>Loading fresh data...</Text>
                </View>
            );
        }

        switch (activeRoute) {
            case "Home":
                return (
                    <Home
                        user={user}
                        sensors={sensors}
                        trustedContact={trustedContact}
                        setActiveRoute={handleRouteChange}
                    />
                );
            case "LiveGps":
                return <LiveGps trustedContact={trustedContact} />;
            case "ContactPersons":
                return (
                    <ContactPersons
                        userRole={user.role}
                        trustedContact={trustedContact}
                        setActiveRoute={handleRouteChange}
                        currentUserEmail={user.email}
                        currentUserUid={user.uid}
                        onRefreshContacts={refreshTrustedContacts}
                    />
                );
            case "Devices":
                return <Devices />;
            case "Notifications":
                return <Notifications />;
            case "Settings":
                return (
                    <Settings
                        user={user}
                        onUserUpdate={handleUserUpdate}
                        setActiveRoute={handleRouteChange}
                        currentUserEmail={user.email}
                        onRefresh={loadUser}
                    />
                );
            default:
                return (
                    <Home
                        user={user}
                        sensors={sensors}
                        trustedContact={trustedContact}
                        setActiveRoute={handleRouteChange}
                    />
                );
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