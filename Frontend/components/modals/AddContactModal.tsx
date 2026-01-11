import React, { useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Platform, ActivityIndicator } from "react-native";
import * as Location from "expo-location";

interface AddContactModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: {
        name: string;
        relation: string;
        contactNo: string;
        email: string;
        latitude: number;
        longitude: number;
    }) => Promise<void> | void; // support async save
}

export default function AddContactModal({ visible, onClose, onSave }: AddContactModalProps) {
    const [name, setName] = useState("");
    const [relation, setRelation] = useState("");
    const [contactNo, setContactNo] = useState("");
    const [email, setEmail] = useState("");

    const [phoneError, setPhoneError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [loading, setLoading] = useState(false);

    const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com'];

    const handlePhoneChange = (value: string) => {
        const digits = value.replace(/\D/g, "");
        setContactNo(digits);

        if (!digits.startsWith("09")) setPhoneError("Phone must start with 09");
        else if (digits.length !== 11) setPhoneError("Phone must be 11 digits");
        else setPhoneError("");
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        const pattern = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
        if (!pattern.test(value)) {
            setEmailError("Invalid email");
            return;
        }
        const domain = value.split("@")[1];
        if (!allowedDomains.includes(domain)) setEmailError(`Domain must be: ${allowedDomains.join(', ')}`);
        else setEmailError("");
    };

    const isInvalid =
        !!phoneError ||
        !!emailError ||
        contactNo.length !== 11 ||
        !contactNo.startsWith("09") ||
        !email ||
        loading; // disable if loading

    const handleSave = async () => {
        setLoading(true);

        let latitude = 0;
        let longitude = 0;

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === "granted") {
                const location = await Location.getCurrentPositionAsync({});
                latitude = location.coords.latitude;
                longitude = location.coords.longitude;
            }
        } catch (e) {
            console.log("Location unavailable, defaulting to 0,0");
        }

        try {
            await onSave({ name, relation, contactNo, email, latitude, longitude });
            // reset form
            setName(""); setRelation(""); setContactNo(""); setEmail("");
            onClose();
        } catch (err) {
            console.error("Failed to save contact:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>Add Contact</Text>

                    <TextInput placeholder="Name" placeholderTextColor="#888" style={styles.input} value={name} onChangeText={setName} editable={!loading} />
                    <TextInput placeholder="Relation" placeholderTextColor="#888" style={styles.input} value={relation} onChangeText={setRelation} editable={!loading} />
                    <TextInput placeholder="Contact No" placeholderTextColor="#888" style={styles.input} value={contactNo} onChangeText={handlePhoneChange} keyboardType="phone-pad" editable={!loading} />
                    {phoneError ? <Text style={styles.error}>{phoneError}</Text> : null}
                    <TextInput placeholder="Email" placeholderTextColor="#888" style={styles.input} value={email} onChangeText={handleEmailChange} keyboardType="email-address" autoCapitalize="none" editable={!loading} />
                    {emailError ? <Text style={styles.error}>{emailError}</Text> : null}

                    <View style={{ flexDirection: "row", gap: 10, justifyContent: "space-between", marginTop: 10 }}>
                        <Pressable style={[styles.btn, loading && { opacity: 0.5 }]} onPress={onClose} disabled={loading}>
                            <Text style={styles.btnText}>Cancel</Text>
                        </Pressable>
                        <Pressable style={[styles.btn, isInvalid && { opacity: 0.5 }]} onPress={handleSave} disabled={isInvalid}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save</Text>}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
    modal: { width: "90%", backgroundColor: "#0F2A52", borderRadius: 12, padding: 20 },
    title: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 15 },
    input: { backgroundColor: "#07121f", color: "#fff", borderRadius: 8, paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 14 : 12, marginBottom: 10 },
    btn: { backgroundColor: "#2EA8FF", paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, flex: 1, alignItems: "center" },
    btnText: { color: "#fff", fontWeight: "bold" },
    error: { color: "#F87171", fontSize: 11, marginBottom: 6, marginLeft: 4 }
});
