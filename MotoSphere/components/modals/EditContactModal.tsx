import React, { useEffect, useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { TrustedContact } from "../services/types";

interface EditContactModalProps {
    visible: boolean;
    contact: TrustedContact | null;
    onClose: () => void;
    onSave: (updated: {
        relation: string;
        email: string;
    }) => Promise<void> | void;
}

export default function EditContactModal({
    visible,
    contact,
    onClose,
    onSave,
}: EditContactModalProps) {
    const [relation, setRelation] = useState("");
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [loading, setLoading] = useState(false);

    const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com'];

    useEffect(() => {
        if (contact) {
            setRelation(contact.relation);
            setEmail(contact.email);
            setEmailError("");
        }
    }, [contact]);

    const handleEmailChange = (value: string) => {
        setEmail(value);
        const emailPattern = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;

        if (!emailPattern.test(value)) {
            setEmailError('Invalid email format');
            return;
        }

        const domain = value.split('@')[1];
        if (!allowedDomains.includes(domain)) {
            setEmailError(`Domain must be: ${allowedDomains.join(', ')}`);
        } else {
            setEmailError('');
        }
    };

    const isInvalid = !!emailError || !email || !relation.trim() || loading;

    const handleSave = async () => {
        if (!contact || isInvalid) return;

        setLoading(true);
        try {
            await onSave({
                relation: relation.trim(),
                email: email.toLowerCase().trim(),
            });
            onClose();
        } catch (err) {
            console.error('Error updating contact:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>Edit Contact</Text>

                    <TextInput
                        value={relation}
                        onChangeText={setRelation}
                        placeholder="Relation (e.g., Friend, Family)"
                        placeholderTextColor="#888"
                        style={styles.input}
                        editable={!loading}
                    />

                    <TextInput
                        value={email}
                        onChangeText={handleEmailChange}
                        placeholder="Email"
                        placeholderTextColor="#888"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                        editable={!loading}
                    />
                    {emailError ? <Text style={styles.error}>{emailError}</Text> : null}

                    <View style={styles.actions}>
                        <Pressable 
                            style={[styles.btn, styles.cancel, loading && { opacity: 0.5 }]} 
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.btn, isInvalid && styles.disabled]}
                            onPress={handleSave}
                            disabled={isInvalid}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.btnText}>Update</Text>
                            )}
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
        marginBottom: 10,
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
        justifyContent: "center",
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