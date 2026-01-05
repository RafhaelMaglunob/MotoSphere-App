import { View, Text, ScrollView, Dimensions, Pressable } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';


import UserIcon from "../../components/svg/ProfileIcon";
import MailIcon from "../../components/svg/MailIcon";
import PhoneIcon from "../../components/svg/PhoneIcon";
import ShieldIcon from "../../components/svg/ShieldIcon";
import LocationIcon from "../../components/svg/LocationIcon";
import CircleIcon from "../../components/svg/CircleIcon";
import BatteryIcon from "../../components/svg/BatteryIcon";
import SensorIcon from "../../components/svg/SensorIcon";
import RightArrowIcon from "../../components/svg/RightArrowIcon";

import { Sensor, User, TrustedContact } from "../../components/services/types";

interface HomeProps {
    user: User
    sensors: Sensor[];
    trustedContact: TrustedContact[];
    setActiveRoute: (route: string) => void;
}

function formatNumberGroups(value: String ) {
    return value
        .toString()
        .replace(/\D/g, "")      // remove non-digits
        .replace(/(.{4})/g, "$1 ")
        .trim();
}

export default function Home({ user, sensors, trustedContact, setActiveRoute }: HomeProps) {
    const screenHeight = Dimensions.get('window').height;
    return (
        <View
            style={{
                flexDirection: 'column',
                gap: 15
            }}
        >

            {/* 1st Column (Welcoming User and checking if user is connected)*/}
            <LinearGradient
                colors={['#0F2A52', '#0A1A3A']} // top to bottom gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    padding: 20,
                    borderRadius: 10
                }}
            >
                <Text
                    style={{
                        color: 'white',
                        fontSize: 22,
                        fontWeight: 'bold',
                        letterSpacing: 1.2
                    }}
                >
                    Welcome Back, {user.name.split(' ')[0]}
                </Text>

                <Text
                    style={{
                        color: '#9BB3D6',
                        fontSize: 11,
                        marginTop: 5
                    }}
                >
                    Your helmet is {user.connection} and systems are {user.system}.
                </Text>
            </LinearGradient>

            {/* 2nd Column (Showing user connection, battery, sensors)*/}
            <LinearGradient
                colors={['#0F2A52', '#0A1A3A']} // top to bottom gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    padding: 20,
                    borderRadius: 10
                }}
            >
                {/* ShieldIcon + Connection Output */}
                <View
                    style={{ flexDirection: 'row', justifyContent: 'space-between' }}
                >
                    <View
                        style={{
                            backgroundColor: '#0A1A3A',
                            padding: 10,
                            width: 'auto',
                            borderRadius: 13,
                        }}
                    >
                        <ShieldIcon size={30} />
                    </View>

                    <View
                        style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            paddingHorizontal: 17,
                            paddingVertical: 3,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            alignSelf: 'flex-start',
                            borderRadius: 20
                        }}
                    >
                        <CircleIcon size={10} />
                        <Text
                            style={{
                                color: '#4ADE80'
                            }}
                        >
                            {user.connection.charAt(0).toUpperCase() + user.connection.slice(1)}
                        </Text>
                    </View>
                </View>

                {/* User Hardware Device ID and battery and sensors connection */}
                <View style={{ marginTop: 15, flexDirection: 'column', gap: 3 }}>
                    <Text
                        style={{
                            color: '#fff',
                            fontSize: 19,
                            fontWeight: 'bold',
                            letterSpacing: 1.2
                        }}
                    >
                        Smart Helmet {user.deviceID}
                    </Text>
                    <Text
                        style={{
                            color: '#9BB3D6',
                            fontSize: 12
                        }}
                    >
                        Last synced: {user.lastOnline}
                    </Text>

                    {/* Scrollable section with fixed height (50% of screen) */}
                    <View
                        style={{
                            height: screenHeight * 0.12, // 50% of screen height
                            marginTop: 20
                        }}
                    >
                        <ScrollView
                            contentContainerStyle={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                justifyContent: 'space-between',
                            }}
                            showsVerticalScrollIndicator={true}
                        >
                            {/* Battery card */}
                            <View
                                style={{
                                    width: '48%',
                                    marginBottom: 10,
                                    backgroundColor: '#0A1A3A',
                                    padding: 10,
                                    borderRadius: 8,
                                    flexDirection: 'column'
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <BatteryIcon />
                                    <Text style={{ color: '#9BB3D6' }}>Battery</Text>
                                </View>
                                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 19, letterSpacing: 1.1 }}>
                                    {user.battery}%
                                </Text>
                            </View>

                            {/* Sensors */}
                            {sensors.map((sensor, index) => (
                                <View
                                    key={index}
                                    style={{
                                        width: '48%',
                                        marginBottom: 10,
                                        backgroundColor: '#0A1A3A',
                                        padding: 10,
                                        borderRadius: 8,
                                        flexDirection: 'column'
                                    }}
                                >   
                                    <View style={{ flexDirection: 'row', gap: 6}}>
                                        <SensorIcon />
                                        <Text style={{ color: '#9BB3D6' }}>
                                            {sensor.name.charAt(0).toUpperCase() + sensor.name.slice(1)}
                                        </Text>
                                    </View>
                                    <Text
                                        style={{
                                            color: sensor.status === "active" ? "#4ADE80" : "#ca3f3aff",
                                            fontWeight: '600',
                                            fontSize: 19,
                                            letterSpacing: 1.1
                                        }}
                                    >
                                        {sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1)}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </LinearGradient>

            {/* Live Tracking */}
            <LinearGradient
                colors={['#000', '#0F2A52']} // top to bottom gradient
                start={{ x: 0.01, y: 0.001 }}
                end={{ x: 0, y: 1 }}
                style={{
                    padding: 20,
                    borderRadius: 10,
                    flexDirection: 'column',
                    gap: 12
                }}
            >
                <View
                    style={{
                        backgroundColor: 'rgba(6, 182, 212, 0.2)',
                        padding: 10,
                        alignSelf: 'flex-start',
                        flexDirection: 'row',
                        borderRadius: 13
                    }}
                >
                    <LocationIcon />
                </View>

                <Text
                    style={{
                        color: '#fff',
                        fontSize: 18,
                        fontWeight: '500',
                        letterSpacing: 1.1
                    }}
                >
                    Live Tracking
                </Text>

                <Text
                    style={{
                        color: '#9BB3D6',
                        fontSize: 12
                    }}
                >
                    View real-time location and ride history
                </Text>
                
                <Pressable onPress={() => setActiveRoute('LiveGps')}>
                    <View
                        style={{
                            flexDirection: 'row',
                            gap: 12,
                            alignItems: 'center'
                        }}
                    >   
                        <Text style={{ color: '#22D3EE', fontSize: 12, fontWeight: '600' }}>
                            Open Map
                        </Text>
                        <RightArrowIcon />
                    </View>
                </Pressable>
            </LinearGradient>

            {/* Trusted Contacts */}
            <View>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 12
                    }}
                >
                    <Text
                        style={{
                            color: '#fff',
                            fontWeight: '700',
                            fontSize: 16
                        }}
                    >
                        Trusted Contacts
                    </Text>
                    <Pressable onPress={() => setActiveRoute('ContactPersons')}>
                        <Text
                            style={{
                                color: '#22D3EE',
                                fontSize: 12
                            }}
                        >
                            View All
                        </Text>
                    </Pressable>
                </View>

                <View style={{ flexDirection: 'column', gap: 20}}>
                    
                    {/* Maximum can be shown is 2 contacts */}
                    {/* It fetch everything but it only will show 2 contacts */}
                    {trustedContact.slice(0, 2).map((contact, index) => (
                        <View
                            key={index}
                            style={{
                                backgroundColor: '#0F2A52',
                                padding: 20,
                                flexDirection: 'column',
                                borderRadius: 20,
                                shadowColor: 'rgba(46, 168, 255, 0.5)',      // your color
                                shadowOpacity: 0.2,          // 10% opacity
                                shadowOffset: { width: 0, height: 1 },
                                shadowRadius: 20,
                                // Android shadow
                                elevation: 12,  
                            }}
                        >   
                            {/* Contacts Name and relation */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    gap: 15
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: '#0A1A3A',
                                        padding: 10,
                                        alignSelf: 'flex-start',
                                        borderRadius: 11
                                    }}
                                >
                                    <UserIcon width={30} height={30} />
                                </View>
                                <View
                                    style={{
                                        flexDirection: 'column',
                                        justifyContent: 'space-evenly'
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#fff',
                                            fontWeight: '600',
                                            fontSize: 15,
                                            letterSpacing: 0.4
                                        }}
                                    >
                                        {contact.name}
                                    </Text>
                                    <View
                                        style={{
                                            backgroundColor: 'rgba(6, 182, 212, 0.1)',
                                            alignSelf: 'flex-start',
                                            paddingHorizontal: 14,
                                            paddingVertical: 1,
                                            borderRadius: 4
                                        }}
                                    >
                                        <Text
                                            style={{ color: '#22D3EE', fontWeight: '300', fontSize: 11  }}
                                        >
                                            {contact.relation}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Contacts Email and Contact Number */}
                            <View
                                style={{
                                    flexDirection: 'column',
                                    gap: 12,
                                    marginTop: 20
                                }}
                            >
                                {/* Contact */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        gap: 13,
                                        alignItems: 'center'
                                    }}
                                >
                                    <PhoneIcon />
                                    <Text style={{ color: '#9BB3D6', fontSize: 12 }}>
                                        {formatNumberGroups(contact.contactNo)}
                                    </Text>
                                </View>
                                
                                
                                {/* Email */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        gap: 13,
                                        alignItems: 'center'
                                    }}
                                >
                                    <MailIcon />
                                    <Text style={{ color: '#9BB3D6', fontSize: 12 }}>
                                        {contact.email}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    {/* Total contacts that still not been shown */}
                    <Text
                        style={{
                            textAlign: 'center',
                            color: '#94A3B8'
                        }}
                    >
                        and {trustedContact.length - 2} others not shown
                    </Text>
                </View>
            </View>
        </View>
    );
}
