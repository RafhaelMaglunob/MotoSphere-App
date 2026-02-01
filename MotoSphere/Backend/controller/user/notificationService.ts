// Backend/controller/notifications/notificationService.ts

import { doc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, orderBy, limit } from "firebase/firestore";
import { getDb } from "../../firebase";
import { Notification } from "../../../components/services/types";

/**
 * Get all notifications for a user
 * Uses Firestore composite index for optimal performance
 */
export const getUserNotifications = async (
    uid: string,
    limitCount: number = 50
): Promise<{ success: boolean; notifications: Notification[]; error?: string }> => {
    try {
        console.log('📬 Fetching notifications for uid:', uid);

        const db = getDb();
        const notificationsRef = collection(db, 'notifications');

        // Query with index (uid, createdAt DESC)
        const q = query(
            notificationsRef,
            where('uid', '==', uid),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const notifications: Notification[] = [];

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            notifications.push({
                id: doc.id,
                uid: data.uid,
                type: data.type as 'alert' | 'summary' | 'system',
                title: data.title,
                description: data.description,
                date: formatDate(data.createdAt?.toDate()),
                createdAt: data.createdAt?.toDate(),
                isRead: data.isRead || false,
                metadata: data.metadata || {}
            });
        });

        console.log(`✅ Retrieved ${notifications.length} notifications`);
        return { success: true, notifications };

    } catch (error: any) {
        console.error('❌ Error fetching notifications:', error);
        return {
            success: false,
            notifications: [],
            error: error.message || 'Failed to fetch notifications'
        };
    }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (
    uid: string
): Promise<{ success: boolean; count: number; error?: string }> => {
    try {
        const db = getDb();
        const notificationsRef = collection(db, 'notifications');

        const q = query(
            notificationsRef,
            where('uid', '==', uid),
            where('isRead', '==', false)
        );

        const snapshot = await getDocs(q);
        const count = snapshot.size;

        console.log(`📬 Unread notifications: ${count}`);
        return { success: true, count };

    } catch (error: any) {
        console.error('❌ Error getting unread count:', error);
        return {
            success: false,
            count: 0,
            error: error.message || 'Failed to get unread count'
        };
    }
};

/**
 * Create a new notification
 */
export const createNotification = async (
    uid: string,
    type: 'alert' | 'summary' | 'system',
    title: string,
    description: string,
    metadata?: any
): Promise<{ success: boolean; notificationId?: string; error?: string }> => {
    try {
        console.log(`📝 Creating ${type} notification for uid:`, uid);

        const db = getDb();
        const notificationsRef = collection(db, 'notifications');

        const notificationData = {
            uid,
            type,
            title,
            description,
            isRead: false,
            createdAt: new Date(),
            metadata: metadata || {}
        };

        const docRef = await addDoc(notificationsRef, notificationData);

        console.log('✅ Notification created with ID:', docRef.id);
        return { success: true, notificationId: docRef.id };

    } catch (error: any) {
        console.error('❌ Error creating notification:', error);
        return {
            success: false,
            error: error.message || 'Failed to create notification'
        };
    }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
    notificationId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        console.log('✓ Marking notification as read:', notificationId);

        const db = getDb();
        const notificationRef = doc(db, 'notifications', notificationId);

        await updateDoc(notificationRef, {
            isRead: true,
            readAt: new Date()
        });

        console.log('✅ Notification marked as read');
        return { success: true };

    } catch (error: any) {
        console.error('❌ Error marking notification as read:', error);
        return {
            success: false,
            error: error.message || 'Failed to mark notification as read'
        };
    }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (
    uid: string
): Promise<{ success: boolean; updatedCount?: number; error?: string }> => {
    try {
        console.log('✓ Marking all notifications as read for uid:', uid);

        const db = getDb();
        const notificationsRef = collection(db, 'notifications');

        const q = query(
            notificationsRef,
            where('uid', '==', uid),
            where('isRead', '==', false)
        );

        const snapshot = await getDocs(q);
        let updatedCount = 0;

        // Update each unread notification
        for (const notifDoc of snapshot.docs) {
            await updateDoc(notifDoc.ref, {
                isRead: true,
                readAt: new Date()
            });
            updatedCount++;
        }

        console.log(`✅ Marked ${updatedCount} notifications as read`);
        return { success: true, updatedCount };

    } catch (error: any) {
        console.error('❌ Error marking all notifications as read:', error);
        return {
            success: false,
            error: error.message || 'Failed to mark all notifications as read'
        };
    }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
    notificationId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        console.log('🗑️ Deleting notification:', notificationId);

        const db = getDb();
        const notificationRef = doc(db, 'notifications', notificationId);

        await deleteDoc(notificationRef);

        console.log('✅ Notification deleted');
        return { success: true };

    } catch (error: any) {
        console.error('❌ Error deleting notification:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete notification'
        };
    }
};

/**
 * Delete all notifications for a user
 */
export const deleteAllNotifications = async (
    uid: string
): Promise<{ success: boolean; deletedCount?: number; error?: string }> => {
    try {
        console.log('🗑️ Deleting all notifications for uid:', uid);

        const db = getDb();
        const notificationsRef = collection(db, 'notifications');

        const q = query(notificationsRef, where('uid', '==', uid));
        const snapshot = await getDocs(q);

        let deletedCount = 0;

        for (const notifDoc of snapshot.docs) {
            await deleteDoc(notifDoc.ref);
            deletedCount++;
        }

        console.log(`✅ Deleted ${deletedCount} notifications`);
        return { success: true, deletedCount };

    } catch (error: any) {
        console.error('❌ Error deleting all notifications:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete all notifications'
        };
    }
};

/**
 * Get notifications by type
 * Uses Firestore composite index for optimal performance
 */
export const getNotificationsByType = async (
    uid: string,
    type: 'alert' | 'summary' | 'system'
): Promise<{ success: boolean; notifications: Notification[]; error?: string }> => {
    try {
        console.log(`📬 Fetching ${type} notifications for uid:`, uid);

        const db = getDb();
        const notificationsRef = collection(db, 'notifications');

        // Query with index (uid, type, createdAt DESC)
        const q = query(
            notificationsRef,
            where('uid', '==', uid),
            where('type', '==', type),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const notifications: Notification[] = [];

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            notifications.push({
                id: doc.id,
                uid: data.uid,
                type: data.type as 'alert' | 'summary' | 'system',
                title: data.title,
                description: data.description,
                date: formatDate(data.createdAt?.toDate()),
                createdAt: data.createdAt?.toDate(),
                isRead: data.isRead || false,
                metadata: data.metadata || {}
            });
        });

        console.log(`✅ Retrieved ${notifications.length} ${type} notifications`);
        return { success: true, notifications };

    } catch (error: any) {
        console.error('❌ Error fetching notifications by type:', error);
        return {
            success: false,
            notifications: [],
            error: error.message || 'Failed to fetch notifications'
        };
    }
};

/**
 * Helper function to format date
 */
function formatDate(date: Date | undefined): string {
    if (!date) return 'Just now';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else {
        // Format as date: MMM DD, YYYY
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
}

/**
 * Create different types of notifications
 */

export const createAlertNotification = async (
    uid: string,
    title: string,
    description: string,
    metadata?: any
): Promise<{ success: boolean; notificationId?: string; error?: string }> => {
    return createNotification(uid, 'alert', title, description, metadata);
};

export const createSummaryNotification = async (
    uid: string,
    title: string,
    description: string,
    metadata?: any
): Promise<{ success: boolean; notificationId?: string; error?: string }> => {
    return createNotification(uid, 'summary', title, description, metadata);
};

export const createSystemNotification = async (
    uid: string,
    title: string,
    description: string,
    metadata?: any
): Promise<{ success: boolean; notificationId?: string; error?: string }> => {
    return createNotification(uid, 'system', title, description, metadata);
};