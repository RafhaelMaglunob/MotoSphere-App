import React, { useState, useEffect } from "react";
import {
    Modal,
    View,
    Text,
    Pressable,
    StyleSheet,
    FlatList,
    ActivityIndicator
} from "react-native";
import { getPendingContactRequests, acceptContactRequest, rejectContactRequest } from "../../Backend/controller/trustedContact/trustedContactService";

interface PendingRequest {
    id: string;
    fromUserName: string;
    fromUserEmail: string;
    relation: string;
    createdAt: string;
}

interface PendingContactRequestsModalProps {
    visible: boolean;
    onClose: () => void;
    currentUserUid: string;
    onRequestUpdated?: () => void;
    onRequestRejected?: (requesterName: string) => void;
    onTrustedContactsRefresh?: () => void;
}

export default function PendingContactRequestsModal({
    visible,
    onClose,
    currentUserUid,
    onRequestUpdated,
    onRequestRejected,
    onTrustedContactsRefresh
}: PendingContactRequestsModalProps) {
    const [requests, setRequests] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (visible) {
            loadRequests();
        }
    }, [visible]);

    const loadRequests = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await getPendingContactRequests(currentUserUid);
            setRequests(data);
        } catch (err: any) {
            console.error("Failed to load requests:", err);
            setError("Failed to load pending requests");
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requestId: string) => {
        setProcessingId(requestId);

        try {
            await acceptContactRequest(requestId, currentUserUid);

            // Remove from list
            setRequests(requests.filter(r => r.id !== requestId));

            // Trigger trusted contacts refresh callback
            onTrustedContactsRefresh?.();

            // Notify parent component
            onRequestUpdated?.();
        } catch (err: any) {
            console.error("Failed to accept request:", err);
            setError(err.message || "Failed to accept request");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        setProcessingId(requestId);

        try {
            // Find the request to get requester name
            const rejectedRequest = requests.find(r => r.id === requestId);
            
            await rejectContactRequest(requestId, currentUserUid);

            // Remove from list
            setRequests(requests.filter(r => r.id !== requestId));

            // Trigger notification callback
            if (rejectedRequest) {
                onRequestRejected?.(rejectedRequest.fromUserName);
            }

            // Trigger trusted contacts refresh callback
            onTrustedContactsRefresh?.();

            // Notify parent component
            onRequestUpdated?.();
        } catch (err: any) {
            console.error("Failed to reject request:", err);
            setError(err.message || "Failed to reject request");
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Contact Requests</Text>
                        <Pressable onPress={onClose}>
                            <Text style={styles.closeBtn}>✕</Text>
                        </Pressable>
                    </View>

                    {/* Error Message */}
                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>⚠️ {error}</Text>
                        </View>
                    ) : null}

                    {/* Content */}
                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color="#06B6D4" />
                        </View>
                    ) : requests.length === 0 ? (
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>
                                {error ? "Failed to load requests" : "No pending contact requests"}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={requests}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={true}
                            showsVerticalScrollIndicator={true}
                            renderItem={({ item }) => (
                                <View style={styles.requestCard}>
                                    <View style={styles.cardHeader}>
                                        <View>
                                            <Text style={styles.userName}>{item.fromUserName}</Text>
                                            <Text style={styles.userEmail}>{item.fromUserEmail}</Text>
                                        </View>
                                        <Text style={styles.relationBadge}>{item.relation}</Text>
                                    </View>

                                    <Text style={styles.dateText}>
                                        Requested on {formatDate(item.createdAt)}
                                    </Text>

                                    <View style={styles.buttonGroup}>
                                        <Pressable
                                            style={[
                                                styles.rejectBtn,
                                                processingId === item.id && { opacity: 0.5 }
                                            ]}
                                            onPress={() => handleReject(item.id)}
                                            disabled={processingId === item.id}
                                        >
                                            {processingId === item.id ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text style={styles.rejectBtnText}>Reject</Text>
                                            )}
                                        </Pressable>

                                        <Pressable
                                            style={[
                                                styles.acceptBtn,
                                                processingId === item.id && { opacity: 0.5 }
                                            ]}
                                            onPress={() => handleAccept(item.id)}
                                            disabled={processingId === item.id}
                                        >
                                            {processingId === item.id ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text style={styles.acceptBtnText}>Accept</Text>
                                            )}
                                        </Pressable>
                                    </View>
                                </View>
                            )}
                            contentContainerStyle={styles.listContent}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "flex-end"
    },
    modal: {
        backgroundColor: "#0F2A52",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: "85%"
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#fff"
    },
    closeBtn: {
        fontSize: 24,
        color: "#9BB3D6",
        padding: 5
    },
    errorContainer: {
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        borderLeftWidth: 4,
        borderLeftColor: "#EF4444",
        borderRadius: 8,
        padding: 12,
        marginBottom: 15
    },
    errorText: {
        color: "#FCA5A5",
        fontSize: 13,
        fontWeight: "500"
    },
    centerContainer: {
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60
    },
    emptyText: {
        color: "#9BB3D6",
        fontSize: 14,
        textAlign: "center"
    },
    listContent: {
        paddingBottom: 20
    },
    requestCard: {
        backgroundColor: "#0A1A3A",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: "#06B6D4"
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10
    },
    userName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
        marginBottom: 4
    },
    userEmail: {
        fontSize: 12,
        color: "#9BB3D6"
    },
    relationBadge: {
        backgroundColor: "rgba(6, 182, 212, 0.1)",
        color: "#22D3EE",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        fontSize: 11,
        fontWeight: "500"
    },
    dateText: {
        fontSize: 11,
        color: "#64748B",
        marginBottom: 12
    },
    buttonGroup: {
        flexDirection: "row",
        gap: 10
    },
    rejectBtn: {
        flex: 1,
        backgroundColor: "#475569",
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center"
    },
    rejectBtnText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 13
    },
    acceptBtn: {
        flex: 1,
        backgroundColor: "#06B6D4",
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center"
    },
    acceptBtnText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 13
    }
});