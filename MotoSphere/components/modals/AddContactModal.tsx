import React, { useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Platform, ActivityIndicator } from "react-native";

interface AddContactModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: {
        email: string;
        relation: string;
    }) => Promise<void> | void;
}

export default function AddContactModal({ visible, onClose, onSave }: AddContactModalProps) {
    const [email, setEmail] = useState("");
    const [relation, setRelation] = useState("");
    const [emailError, setEmailError] = useState("");
    const [relationError, setRelationError] = useState("");
    const [generalError, setGeneralError] = useState("");
    const [loading, setLoading] = useState(false);

    const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com'];

    const handleEmailChange = (value: string) => {
        setEmail(value);
        setEmailError("");
        setGeneralError("");

        if (!value.trim()) {
            setEmailError("Email is required");
            return;
        }

        const pattern = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!pattern.test(value)) {
            setEmailError("Invalid email format");
            return;
        }

        const domain = value.split("@")[1];
        if (!allowedDomains.includes(domain)) {
            setEmailError(`Domain must be: ${allowedDomains.join(', ')}`);
        }
    };

    const handleRelationChange = (value: string) => {
        setRelation(value);
        setRelationError("");
        setGeneralError("");

        if (value.trim().length === 0) {
            setRelationError("Relationship is required");
        } else if (value.trim().length < 2) {
            setRelationError("Relationship must be at least 2 characters");
        } else if (value.trim().length > 50) {
            setRelationError("Relationship must not exceed 50 characters");
        }
    };

    const isFormValid = email.trim() && relation.trim() && !emailError && !relationError;

    const handleSave = async () => {
        // Final validation before saving
        if (!email.trim()) {
            setEmailError("Email is required");
            return;
        }

        if (!relation.trim()) {
            setRelationError("Relationship is required");
            return;
        }

        if (emailError) {
            return;
        }

        if (relationError) {
            return;
        }

        setLoading(true);
        setGeneralError("");

        try {
            await onSave({
                email: email.toLowerCase().trim(),
                relation: relation.trim()
            });
            // Reset form on success
            setEmail("");
            setRelation("");
            setEmailError("");
            setRelationError("");
            setGeneralError("");
            onClose();
        } catch (err: any) {
            console.error("Failed to save contact:", err);
            
            // Display backend error messages
            const errorMessage = err.message || "Failed to add contact. Please try again.";
            setGeneralError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        // Reset all states when closing
        setEmail("");
        setRelation("");
        setEmailError("");
        setRelationError("");
        setGeneralError("");
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>Add Emergency Contact</Text>

                    {/* General Error Message */}
                    {generalError ? (
                        <View style={styles.generalErrorContainer}>
                            <Text style={styles.generalError}>⚠️ {generalError}</Text>
                        </View>
                    ) : null}

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <TextInput
                            placeholder="Email"
                            placeholderTextColor="#888"
                            style={[
                                styles.input,
                                emailError && styles.inputError
                            ]}
                            value={email}
                            onChangeText={handleEmailChange}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!loading}
                        />
                        {emailError ? (
                            <Text style={styles.errorText}>{emailError}</Text>
                        ) : null}
                    </View>

                    {/* Relation Input */}
                    <View style={styles.inputGroup}>
                        <TextInput
                            placeholder="Relation (e.g., Friend, Family)"
                            placeholderTextColor="#888"
                            style={[
                                styles.input,
                                relationError && styles.inputError
                            ]}
                            value={relation}
                            onChangeText={handleRelationChange}
                            editable={!loading}
                            maxLength={50}
                        />
                        {relationError ? (
                            <Text style={styles.errorText}>{relationError}</Text>
                        ) : null}
                        {relation.trim().length > 0 && !relationError ? (
                            <Text style={styles.characterCount}>
                                {relation.trim().length}/50 characters
                            </Text>
                        ) : null}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <Pressable
                            style={[styles.cancelBtn, loading && { opacity: 0.5 }]}
                            onPress={handleClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={[
                                styles.saveBtn,
                                (!isFormValid || loading) && { opacity: 0.5 }
                            ]}
                            onPress={handleSave}
                            disabled={!isFormValid || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>Save</Text>
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
        alignItems: "center"
    },
    modal: {
        width: "90%",
        backgroundColor: "#0F2A52",
        borderRadius: 12,
        padding: 20,
        maxHeight: "80%"
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 15
    },
    generalErrorContainer: {
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        borderLeftWidth: 4,
        borderLeftColor: "#EF4444",
        borderRadius: 8,
        padding: 12,
        marginBottom: 15
    },
    generalError: {
        color: "#FCA5A5",
        fontSize: 13,
        fontWeight: "500"
    },
    inputGroup: {
        marginBottom: 15
    },
    input: {
        backgroundColor: "#07121f",
        color: "#fff",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === "ios" ? 14 : 12,
        borderWidth: 1,
        borderColor: "transparent"
    },
    inputError: {
        borderColor: "#EF4444",
        borderWidth: 1
    },
    errorText: {
        color: "#FCA5A5",
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
        fontWeight: "500"
    },
    characterCount: {
        color: "#94A3B8",
        fontSize: 11,
        marginTop: 4,
        marginLeft: 4
    },
    buttonContainer: {
        flexDirection: "row",
        gap: 10,
        justifyContent: "space-between",
        marginTop: 20
    },
    cancelBtn: {
        backgroundColor: "#475569",
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 8,
        flex: 1,
        alignItems: "center"
    },
    cancelBtnText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 14
    },
    saveBtn: {
        backgroundColor: "#06B6D4",
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 8,
        flex: 1,
        alignItems: "center"
    },
    saveBtnText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 14
    }
});