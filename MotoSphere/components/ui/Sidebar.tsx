import React, { ReactNode } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Image } from "react-native";
import { useSegments } from "expo-router";


interface Button {
    name: string;
    route: string;
}

interface SidebarProps {
    padding?: number;
    buttons?: Button[];
    bgColor?: string;
    showSidebar: boolean;
    setShowSidebar: (show: boolean) => void;
    setActiveRoute: (route: string) => void;
    activeRoute?: string;
    children?: ReactNode;
    footer?: ReactNode;
    isLight?: boolean;
    isMdHidden?: boolean; // not used in RN
}

const Sidebar: React.FC<SidebarProps> = ({
    padding = 30,
    buttons = [],
    bgColor = "#050816",
    showSidebar,
    setShowSidebar,
    setActiveRoute,
    activeRoute,
    children,
    footer,
    isLight = false,
}) => {
    const segments = useSegments();

    if (!showSidebar) return null;

    return (
        <View style={[styles.overlay]}>
            {/* Overlay to close sidebar */}
            <Pressable style={styles.overlay} onPress={() => setShowSidebar(false)} />

            <View style={[styles.sidebar, { padding, backgroundColor: bgColor }]}>
                {/* Close button */}
                <Pressable onPress={() => setShowSidebar(false)} style={styles.closeButton}>
                    <Text style={{ color: '#fff', fontSize: 20 }}>X</Text>
                </Pressable>
                <View style={{ justifyContent: 'center', alignItems: 'center'}}>
                    <Image style={{ height: 60, width: 60}} source={require('../img/MotoSphere Logo.png')} />
                </View>

                <ScrollView style={{ flex: 1 }}>
                    {children}

                    {buttons.map((btn) => {
                        const isCurrent = activeRoute === btn.route.replace('/','');

                        return (
                            <Pressable
                                key={btn.name}
                                onPress={() => {
                                    setActiveRoute(btn.route.replace('/',''));
                                    setShowSidebar(false); // close sidebar
                                }}
                                style={({ pressed }) => [
                                    styles.button,
                                    isLight
                                        ? { backgroundColor: pressed ? 'rgba(0,0,0,0.1)' : 'transparent' }
                                        : { backgroundColor: pressed ? 'rgba(6,182,212,0.1)' : 'transparent' },
                                    isCurrent && { opacity: 0.5 } // indicate current page
                                ]}
                            >
                                <Text
                                    style={{
                                        color: isLight ? '#000' : '#9BB3D6',
                                        fontWeight: '500',
                                    }}
                                >
                                    {btn.name}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                {footer && <View>{footer}</View>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 30,
    },
    sidebar: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 250,
        zIndex: 40,
        flexDirection: 'column',
    },
    closeButton: {
        marginBottom: 10,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginBottom: 5,
    },
});

export default Sidebar;
