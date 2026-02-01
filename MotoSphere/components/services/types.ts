
// Sensor interface

export interface Sensor {
  name: string;
  status: 'active' | 'inactive'; // matches MainLayout values
}

export interface AddressData {
  region: string;
  regionCode?: string;
  city: string;
  cityCode?: string;
  barangay: string;
  barangayCode?: string;
  street?: string;
  postalCode: string; // Required now
}

export interface User {
  uid: string;
  name: string;
  email: string;
  pendingEmail?: string;
  emailVerified: boolean;
  password: string;
  role: string;
  address?: AddressData; // Properly typed as AddressData, optional since users may not have set it yet
  contactNo: string;
  connection: string;
  deviceID: string;
  lastOnline: string;
  battery: number;
  system: string;
  lastChangePass: string;
}


/**
 * Trusted Contact Interface
 * Represents a trusted contact relationship (Emergency Contact or Rider-to-Rider)
 */
export interface TrustedContact {
  // Basic Contact Information
  id?: string;
  name: string;
  email: string;
  contactEmail: string;
  relation: string;
  contactNo: string;

  // Location Information
  latitude: number;
  longitude: number;

  // User Information (from users collection)
  role?: string; // 'rider' or 'emergency contact'
  deviceID?: string; // Device identifier from users collection
  photoURL?: string; // Profile photo URL

  // Request Management
  status?: 'pending' | 'accepted' | 'rejected'; // Contact request status
  createdAt?: string; // ISO timestamp when contact was added
  updatedAt?: string; // ISO timestamp of last update
  acceptedAt?: string; // ISO timestamp when request was accepted (if applicable)

  // Ownership Information
  ownerUid?: string; // UID of the user who added this contact
  contactUid?: string; // UID of the contact (target user)
}


/**
 * Extended Trusted Contact with additional metadata
 * Used for displaying contacts with extra information
 */
export interface ExtendedTrustedContact extends TrustedContact {
  // Display-related fields
  isOutgoing?: boolean; // True if current user sent the request
  isIncoming?: boolean; // True if current user received the request
  daysAgo?: number; // Days since contact was added

  // Status information
  isActive?: boolean; // True if status is 'accepted'
  isPending?: boolean; // True if status is 'pending'
  isRejected?: boolean; // True if status is 'rejected'
}

/**
 * Contact Request
 * Represents a pending contact request (for incoming requests modal)
 */
export interface ContactRequest {
  id: string;
  fromUserName: string;
  fromUserEmail: string;
  fromUserUID?: string;
  relation: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

/**
 * Contact Action Response
 * Return type for contact operations
 */
export interface ContactActionResponse {
  success: boolean;
  message: string;
  contact?: TrustedContact;
  error?: string;
}

/**
 * Contact Status
 * Enum for contact statuses
 */
export enum ContactStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

/**
 * User Role
 * Enum for user roles
 */
export enum UserRole {
  RIDER = 'rider',
  EMERGENCY_CONTACT = 'emergency contact'
}

export interface GpsMetrics {
  name: string;
  unit: string;
  value: number;
};

// components/services/types.ts (Add/Update this section)

/**
 * Notification Type Definition
 * Based on three main categories: Alert, Summary, System
 */
// components/services/types.ts (Add/Update this section)

/**
 * Notification Type Definition
 * Based on three main categories: Alert, Summary, System
 */

export type NotificationType = 'alert' | 'summary' | 'system';

export interface Notification {
  id: string | undefined;               // Firestore document ID
  uid: string;                          // User ID who receives notification
  type: NotificationType;               // Type: alert, summary, or system
  title: string;                        // Notification title
  description: string;                  // Notification description
  date: string;                         // Formatted date (e.g., "5m ago", "2h ago")
  createdAt?: Date;                     // Timestamp when created
  readAt?: Date;                        // Timestamp when read (optional)
  isRead: boolean;                      // Whether notification has been read
  metadata?: NotificationMetadata;      // Additional data based on type
}

/**
 * Metadata for different notification types
 */
export interface NotificationMetadata {
  // Alert-specific metadata
  helmetId?: string;                    // Which helmet triggered alert
  severity?: 'low' | 'medium' | 'high'; // Alert severity level
  impactLevel?: number;                 // Impact force (0-100)
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp?: Date;

  // Summary-specific metadata
  summaryType?: 'daily' | 'weekly' | 'monthly'; // Summary period
  startDate?: Date;
  endDate?: Date;
  stats?: {
    totalImpacts?: number;
    averageSpeed?: number;
    distanceTraveled?: number;
    activationTime?: number; // in minutes
  };

  // System-specific metadata
  systemType?: 'update' | 'maintenance' | 'info'; // System notification type
  actionUrl?: string;                   // URL to take action
  version?: string;                     // For update notifications

  // General metadata
  icon?: string;                        // Custom icon URL
  color?: string;                       // Custom color code
  action?: {
    label: string;
    url: string;
  };
}

/**
 * Notification Subtypes with Examples
 */

// ALERT NOTIFICATIONS
// Sent when helmet detects impact, fall, or emergency
export interface AlertNotification extends Notification {
  type: 'alert';
  metadata: {
    helmetId: string;
    severity: 'low' | 'medium' | 'high';
    impactLevel: number;
    location: {
      latitude: number;
      longitude: number;
    };
    timestamp: Date;
  };
}

// SUMMARY NOTIFICATIONS
// Daily/Weekly/Monthly usage summaries
export interface SummaryNotification extends Notification {
  type: 'summary';
  metadata: {
    summaryType: 'daily' | 'weekly' | 'monthly';
    startDate: Date;
    endDate: Date;
    stats: {
      totalImpacts: number;
      averageSpeed: number;
      distanceTraveled: number;
      activationTime: number;
    };
  };
}

// SYSTEM NOTIFICATIONS
// App updates, maintenance, general info
export interface SystemNotification extends Notification {
  type: 'system';
  metadata: {
    systemType: 'update' | 'maintenance' | 'info';
    actionUrl?: string;
    version?: string;
  };
}

/**
 * Notification Creation Payloads
 * Used when creating notifications in backend
 */

export interface CreateAlertPayload {
  uid: string;
  title: string;
  description: string;
  helmetId: string;
  severity: 'low' | 'medium' | 'high';
  impactLevel: number;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface CreateSummaryPayload {
  uid: string;
  title: string;
  description: string;
  summaryType: 'daily' | 'weekly' | 'monthly';
  stats: {
    totalImpacts: number;
    averageSpeed: number;
    distanceTraveled: number;
    activationTime: number;
  };
}

export interface CreateSystemPayload {
  uid: string;
  title: string;
  description: string;
  systemType: 'update' | 'maintenance' | 'info';
  actionUrl?: string;
  version?: string;
}

/**
 * Example Notifications
 */

export const exampleAlertNotification: Notification = {
  id: "alert_001",
  uid: "user_123",
  type: "alert",
  title: "Helmet Impact Detected",
  description: "High impact detected on your helmet at GPS location",
  date: "5m ago",
  createdAt: new Date(Date.now() - 5 * 60 * 1000),
  isRead: false,
  metadata: {
    helmetId: "helmet_001",
    severity: "high",
    impactLevel: 85,
    location: {
      latitude: 14.5995,
      longitude: 120.9842
    },
    timestamp: new Date(Date.now() - 5 * 60 * 1000)
  }
};

export const exampleSummaryNotification: Notification = {
  id: "summary_001",
  uid: "user_123",
  type: "summary",
  title: "Daily Activity Summary",
  description: "Your helmet was active for 2 hours today with 3 impacts detected",
  date: "2h ago",
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  isRead: false,
  metadata: {
    summaryType: "daily",
    startDate: new Date(new Date().setHours(0, 0, 0, 0)),
    endDate: new Date(),
    stats: {
      totalImpacts: 3,
      averageSpeed: 25.5,
      distanceTraveled: 15.2,
      activationTime: 120
    }
  }
};

export const exampleSystemNotification: Notification = {
  id: "system_001",
  uid: "user_123",
  type: "system",
  title: "App Update Available",
  description: "A new version of SafeHelmet is available with bug fixes and improvements",
  date: "1d ago",
  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  isRead: true,
  metadata: {
    systemType: "update",
    version: "2.1.0",
    actionUrl: "https://play.google.com/store/apps/details?id=com.safehelmet"
  }
};

/**
 * Notification Filter Helper
 */
export const getNotificationsByType = (
  notifications: Notification[],
  type: NotificationType
): Notification[] => {
  return notifications.filter(notif => notif.type === type);
};

/**
 * Get unread notifications
 */
export const getUnreadNotifications = (
  notifications: Notification[]
): Notification[] => {
  return notifications.filter(notif => !notif.isRead);
};