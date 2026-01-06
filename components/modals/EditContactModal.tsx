import React, { useEffect, useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Platform } from "react-native";
import { TrustedContact } from "@/components/services/types";

interface EditContactModalProps {
    visible: boolean;
    contact: TrustedContact | null;
    onClose: () => void;
    onSave: (updated: TrustedContact) => void;
}

export default function EditContactModal({
    visible,
    contact,
    onClose,
    onSave,
}: EditContactModalProps) {
    const [name, setName] = useState("");
    const [relation, setRelation] = useState("");
    const [contactNo, setContactNo] = useState("");
    const [email, setEmail] = useState("");

    const [phoneError, setPhoneError] = useState("");
    const [emailError, setEmailError] = useState("");

    const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com'];

    useEffect(() => {
        if (contact) {
            setName(contact.name);
            setRelation(contact.relation);
            setContactNo(contact.contactNo);
            setEmail(contact.email);
            setPhoneError("");
            setEmailError("");
        }
    }, [contact]);

    /* ---------- LIVE VALIDATION ---------- */

    /* ---------- LIVE VALIDATION (PH RULES) ---------- */

    const handlePhoneChange = (value: string) => {
        const digits = value.replace(/\D/g, "");
        setContactNo(digits);

        if (!digits.startsWith("09")) {
            setPhoneError("Phone number must start with 09");
        } else if (digits.length !== 11) {
            setPhoneError("Phone number must be 11 digits");
        } else {
            setPhoneError("");
        }
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);

        // Regex: only letters and digits before @, then domain
        const emailPattern = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;

        if (!emailPattern.test(value)) {
            setEmailError('Email must contain only letters and digits.');
            return;
        }

        // Extract domain after @
        const domain = value.split('@')[1];
        if (!allowedDomains.includes(domain)) {
            setEmailError(`Email must be one of: ${allowedDomains.join(', ')}`);
        } else {
            setEmailError('');
        }
    };

    const isInvalid =
        !!phoneError ||
        !!emailError ||
        contactNo.length !== 11 ||
        !contactNo.startsWith("09") ||
        !email;


    const handleSave = () => {
        if (!contact || isInvalid) return;

        onSave({
            ...contact,
            name,
            relation,
            contactNo,
            email,
        });

        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>Edit Contact</Text>

                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Name"
                        placeholderTextColor="#888"
                        style={styles.input}
                    />

                    <TextInput
                        value={relation}
                        onChangeText={setRelation}
                        placeholder="Relation"
                        placeholderTextColor="#888"
                        style={styles.input}
                    />

                    <TextInput
                        value={contactNo}
                        onChangeText={handlePhoneChange}
                        placeholder="Contact No"
                        placeholderTextColor="#888"
                        keyboardType="phone-pad"
                        style={styles.input}
                    />
                    {phoneError ? <Text style={styles.error}>{phoneError}</Text> : null}

                    <TextInput
                        value={email}
                        onChangeText={handleEmailChange}
                        placeholder="Email"
                        placeholderTextColor="#888"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                    />
                    {emailError ? <Text style={styles.error}>{emailError}</Text> : null}

                    <View style={styles.actions}>
                        <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.btn, isInvalid && styles.disabled]}
                            onPress={handleSave}
                            disabled={isInvalid}
                        >
                            <Text style={styles.btnText}>Update</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    modal: {
        width: "90%",
        backgroundColor: "#0F2A52",
        borderRadius: 12,
        padding: 20,
    },
    title: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 15,
    },
    input: {
        backgroundColor: "#07121f",
        color: "#fff",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === "ios" ? 14 : 12,
        marginBottom: 6,
    },
    error: {
        color: "#F87171",
        fontSize: 11,
        marginBottom: 6,
        marginLeft: 4,
    },
    actions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 12,
    },
    btn: {
        flex: 1,
        backgroundColor: "#2EA8FF",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    disabled: {
        opacity: 0.5,
    },
    btnText: {
        color: "#fff",
        fontWeight: "700",
    },
    cancel: {
        backgroundColor: "#1E293B",
    },
    cancelText: {
        color: "#E5E7EB",
        fontWeight: "600",
    },
});
