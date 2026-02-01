import {
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updateEmail
} from "firebase/auth";
import { doc, updateDoc, addDoc, collection, getDoc, query, where, getDocs } from "firebase/firestore";
import { auth, getDb } from "../../firebase";
import { setUserCache, getUserCache, clearUserCache } from "../cache/userCache";
import {
    getUserFriendlyError,
    validatePassword,
    validateEmail,
    validatePhoneNumber,
    validateFullName
} from "./userError";
import {
    createSystemNotification,
    createAlertNotification
} from "./notificationService";

import { verifyBeforeUpdateEmail } from "firebase/auth";
/**
 * Address Data Interface
 */
interface AddressData {
    region: string;
    regionCode?: string;
    city: string;
    cityCode?: string;
    barangay: string;
    barangayCode?: string;
    street?: string;
    postalCode?: string;
}

/**
 * Update user profile (name, contact number, location, and address)
 */
export const updateUserProfile = async (
    uid: string,
    updates: {
        name?: string;
        contactNo?: string;
        location?: {
            name: string;
            lat: string;
            lng: string;
        };
        address?: AddressData;
    }
): Promise<{ success: boolean; error?: string }> => {
    try {
        console.log('📝 Updating user profile for uid:', uid);

        // Validate inputs
        if (updates.name) {
            const nameValidation = validateFullName(updates.name);
            if (!nameValidation.valid) {
                return { success: false, error: nameValidation.error };
            }
        }

        if (updates.contactNo) {
            const phoneValidation = validatePhoneNumber(updates.contactNo);
            if (!phoneValidation.valid) {
                return { success: false, error: phoneValidation.error };
            }
        }

        if (updates.address) {
            const addressValidation = validateAddress(updates.address);
            if (!addressValidation.valid) {
                return { success: false, error: addressValidation.error };
            }
        }

        const db = getDb();
        const userRef = doc(db, 'users', uid);

        // Prepare Firestore update - map 'name' to 'fullName'
        const firestoreUpdates: any = {};

        if (updates.name) {
            firestoreUpdates.fullName = updates.name;
        }

        if (updates.contactNo) {
            firestoreUpdates.contactNo = updates.contactNo;
        }

        if (updates.location) {
            firestoreUpdates.location = {
                name: updates.location.name,
                lat: parseFloat(updates.location.lat),
                lng: parseFloat(updates.location.lng),
                updatedAt: new Date().toISOString()
            };
            console.log('📍 Location updated');
        }

        if (updates.address) {
            firestoreUpdates.address = {
                region: updates.address.region,
                regionCode: updates.address.regionCode || '',
                city: updates.address.city,
                cityCode: updates.address.cityCode || '',
                barangay: updates.address.barangay,
                barangayCode: updates.address.barangayCode || '',
                street: updates.address.street || '',
                postalCode: updates.address.postalCode || '',
                updatedAt: new Date().toISOString()
            };
            console.log('🏠 Address updated:', firestoreUpdates.address);
        }

        // Update Firestore
        await updateDoc(userRef, firestoreUpdates);
        console.log('✅ Profile updated in Firestore');

        // Update cache
        await clearUserCache(uid);
        console.log('✅ Cache cleared - will force fresh data fetch');

        // 🔔 Create notification for profile update
        if (updates.name || updates.contactNo || updates.location || updates.address) {
            const updateType = [];
            if (updates.name) updateType.push('name');
            if (updates.contactNo) updateType.push('phone number');
            if (updates.location) updateType.push('location');
            if (updates.address) updateType.push('address');

            await createSystemNotification(
                uid,
                'Profile Updated',
                `Your ${updateType.join(' and ')} has been updated successfully.`,
                {
                    systemType: 'info',
                    changes: updateType
                }
            );
            console.log('📬 Profile update notification created');
        }

        return { success: true };
    } catch (error: any) {
        console.error('❌ Error updating profile:', error);
        return {
            success: false,
            error: getUserFriendlyError(error)
        };
    }
};

/**
 * Validate address data
 */
const validateAddress = (address: AddressData): { valid: boolean; error?: string } => {
    if (!address.region || !address.region.trim()) {
        return { valid: false, error: 'Region is required' };
    }

    if (!address.city || !address.city.trim()) {
        return { valid: false, error: 'City is required' };
    }

    if (!address.barangay || !address.barangay.trim()) {
        return { valid: false, error: 'Barangay is required' };
    }

    if (address.postalCode && !/^\d{0,5}$/.test(address.postalCode)) {
        return { valid: false, error: 'Postal code must be numeric (max 5 digits)' };
    }

    return { valid: true };
};

/**
 * Update user address only
 */
export const updateUserAddress = async (
    uid: string,
    address: AddressData
): Promise<{ success: boolean; error?: string }> => {
    return updateUserProfile(uid, { address });
};

/**
 * Get user's full profile including address
 */
export const getUserProfile = async (uid: string): Promise<{
    uid: string;
    name: string;
    email: string;
    contactNo: string;
    role: string;
    location: any;
    address: AddressData | null;
    emailVerified: boolean;
    createdAt: string | null;
    lastModified: string | null;
} | null> => {
    try {
        console.log('📖 Fetching user profile for uid:', uid);

        const db = getDb();
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            console.error('❌ User document not found');
            return null;
        }

        const userData = userDoc.data();

        return {
            uid: userDoc.id,
            name: userData.fullName || userData.name || '',
            email: userData.email || '',
            contactNo: userData.contactNo || '',
            role: userData.role || 'rider',
            location: userData.location || null,
            address: userData.address || null,
            emailVerified: userData.emailVerified || false,
            createdAt: userData.createdAt || null,
            lastModified: userData.lastModified || null,
        };
    } catch (error: any) {
        console.error('❌ Error fetching user profile:', error);
        return null;
    }
};

/**
 * Format address for display
 */
export const formatAddressForDisplay = (address: AddressData | null): string => {
    if (!address) return 'No address set';

    const parts = [];

    if (address.street) parts.push(address.street);
    if (address.barangay) parts.push(address.barangay);
    if (address.city) parts.push(address.city);
    if (address.postalCode) parts.push(address.postalCode);
    if (address.region) parts.push(address.region);

    return parts.length > 0 ? parts.join(', ') : 'No address set';
};

/**
 * Search users by city
 */
export const searchUsersByCity = async (city: string) => {
    try {
        const db = getDb();
        const q = query(
            collection(db, 'users'),
            where('address.city', '==', city)
        );

        const snapshot = await getDocs(q);
        const users = snapshot.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
        }));

        console.log(`✅ Found ${users.length} users in ${city}`);
        return users;
    } catch (error: any) {
        console.error('❌ Error searching users by city:', error);
        throw new Error('Failed to search users');
    }
};

/**
 * Search users by region
 */
export const searchUsersByRegion = async (region: string) => {
    try {
        const db = getDb();
        const q = query(
            collection(db, 'users'),
            where('address.region', '==', region)
        );

        const snapshot = await getDocs(q);
        const users = snapshot.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
        }));

        console.log(`✅ Found ${users.length} users in ${region}`);
        return users;
    } catch (error: any) {
        console.error('❌ Error searching users by region:', error);
        throw new Error('Failed to search users');
    }
};

/**
 * Change user password
 * Requires re-authentication with old password
 */
export const changeUserPassword = async (
    oldPassword: string,
    newPassword: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser || !currentUser.email) {
            return { success: false, error: 'No authenticated user found. Please log in again.' };
        }

        console.log('🔐 Changing password for user:', currentUser.email);

        // Validate new password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return { success: false, error: passwordValidation.error };
        }

        // Check if old and new passwords are the same
        if (oldPassword === newPassword) {
            return { success: false, error: 'New password must be different from the old password' };
        }

        // Step 1: Re-authenticate user with old password
        const credential = EmailAuthProvider.credential(
            currentUser.email,
            oldPassword
        );

        try {
            await reauthenticateWithCredential(currentUser, credential);
            console.log('✅ User re-authenticated');
        } catch (authError: any) {
            console.error('❌ Re-authentication failed:', authError);

            if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
                return { success: false, error: 'The current password you entered is incorrect' };
            }

            return { success: false, error: getUserFriendlyError(authError) };
        }

        // Step 2: Update password in Firebase Auth
        await updatePassword(currentUser, newPassword);
        console.log('✅ Password updated in Firebase Auth');

        // Step 3: Update lastChangePass timestamp in Firestore
        const db = getDb();
        const userRef = doc(db, 'users', currentUser.uid);
        const now = new Date().toISOString();

        await updateDoc(userRef, {
            lastChangePass: now,
        });
        console.log('✅ Password change timestamp updated in Firestore');

        // Step 4: Update cache
        const cached = await getUserCache(currentUser.uid);
        if (cached) {
            const updatedUser = {
                ...cached.userData,
                lastChangePass: now
            };

            await setUserCache(currentUser.uid, {
                userData: updatedUser,
                trustedContacts: cached.trustedContacts || []
            });
            console.log('✅ Cache updated with new password timestamp');
        }

        // 🔔 Create notification for password change
        await createAlertNotification(
            currentUser.uid,
            'Password Changed',
            'Your account password has been successfully changed. If you did not make this change, please contact support immediately.',
            {
                severity: 'high',
                systemType: 'info'
            }
        );
        console.log('📬 Password change notification created');

        return { success: true };

    } catch (error: any) {
        console.error('❌ Error changing password:', error);
        return {
            success: false,
            error: getUserFriendlyError(error)
        };
    }
};

/**
 * Send verification email using Vercel backend
 */
export const sendVerificationEmail = async (): Promise<{ success: boolean; error?: string }> => {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            return { success: false, error: "No authenticated user found" };
        }

        // Check Firestore emailVerified status instead of Firebase Auth
        const db = getDb();
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists() && userDoc.data()?.emailVerified) {
            return { success: false, error: "Your email is already verified" };
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Store code in Firestore
        await addDoc(collection(db, 'verificationCodes'), {
            email: currentUser.email,
            code: code,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
            used: false,
            uid: currentUser.uid
        });

        console.log('✅ Code stored in Firestore');

        // Call Vercel API to send email
        console.log('🚀 Calling Vercel API...');
        console.log('📧 Target email:', currentUser.email);
        console.log('🔢 Code:', code);

        const response = await fetch('https://email-backend-five-phi.vercel.app/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: currentUser.email,
                code: code,
                userName: currentUser.displayName || 'User'
            })
        });

        console.log('📬 Response status:', response.status);
        console.log('📬 Response statusText:', response.statusText);

        // Get response text first
        const responseText = await response.text();
        console.log('📬 Response body:', responseText);

        // Try to parse as JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ Could not parse response as JSON:', responseText);
            throw new Error(`Invalid response from server: ${responseText}`);
        }

        if (!response.ok) {
            console.error('❌ API returned error:', result);
            throw new Error(result.error || result.details || `HTTP ${response.status}`);
        }

        console.log("✅ Verification email sent via Vercel!");

        // 🔔 Create notification for verification email sent
        await createSystemNotification(
            currentUser.uid,
            'Verification Code Sent',
            'A 6-digit verification code has been sent to your email. It expires in 15 minutes.',
            {
                systemType: 'info'
            }
        );
        console.log('📬 Verification email sent notification created');

        return { success: true };

    } catch (error: any) {
        console.error("❌ Failed to send verification - Full error:", error);
        console.error("❌ Error name:", error.name);
        console.error("❌ Error message:", error.message);
        console.error("❌ Error stack:", error.stack);

        return {
            success: false,
            error: error.message || "Failed to send verification email"
        };
    }
};

/**
 * Verify the code entered by user
 */
export const verifyEmailCode = async (
    inputCode: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            return { success: false, error: "No authenticated user found" };
        }

        const db = getDb();

        // Simplified query - only filter on email and code
        const q = query(
            collection(db, 'verificationCodes'),
            where('email', '==', currentUser.email),
            where('code', '==', inputCode.trim())
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { success: false, error: 'Invalid verification code' };
        }

        // Filter and sort in memory
        const validCodes = snapshot.docs
            .filter(doc => !doc.data().used) // Filter unused codes
            .sort((a, b) => {
                const aTime = a.data().createdAt?.toDate()?.getTime() || 0;
                const bTime = b.data().createdAt?.toDate()?.getTime() || 0;
                return bTime - aTime; // Sort descending (newest first)
            });

        if (validCodes.length === 0) {
            return { success: false, error: 'Invalid verification code' };
        }

        const codeDoc = validCodes[0]; // Get the most recent unused code
        const data = codeDoc.data();

        // Check expiration
        const expiresAt = data.expiresAt?.toDate();
        if (expiresAt && expiresAt < new Date()) {
            return { success: false, error: 'Code has expired. Please request a new one.' };
        }

        // Mark code as used
        await updateDoc(codeDoc.ref, { used: true });

        // Update user's emailVerified status in Firestore (not Firebase Auth)
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            emailVerified: true
        });

        console.log('✅ Updated emailVerified in Firestore');

        // Update cache
        const cached = await getUserCache(currentUser.uid);
        if (cached) {
            const updatedUser = {
                ...cached.userData,
                emailVerified: true
            };

            await setUserCache(currentUser.uid, {
                userData: updatedUser,
                trustedContacts: cached.trustedContacts || []
            });
            console.log('✅ Cache updated with verified status');
        }

        // 🔔 Create notification for email verification
        await createSystemNotification(
            currentUser.uid,
            'Email Verified Successfully',
            `Your email (${currentUser.email}) has been verified. Your account is now fully secure.`,
            {
                systemType: 'info'
            }
        );
        console.log('📬 Email verification notification created');

        console.log('✅ Email verified successfully');
        return { success: true };

    } catch (error: any) {
        console.error('❌ Error verifying code:', error);
        return {
            success: false,
            error: getUserFriendlyError(error)
        };
    }
};
/**
 * REQUEST email change - Uses Firebase's built-in email change with verification
 */
export const requestEmailChange = async (
    newEmail: string,
    password: string
): Promise<{ success: boolean; error?: string; pendingEmail?: string }> => {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser || !currentUser.email) {
            return { success: false, error: 'No authenticated user found. Please log in again.' };
        }

        const oldEmail = currentUser.email;
        console.log('📧 Requesting email change from', oldEmail, 'to', newEmail);

        // Validate new email
        const emailValidation = validateEmail(newEmail);
        if (!emailValidation.valid) {
            return { success: false, error: emailValidation.error };
        }

        // Check if new email is same as old
        if (newEmail.toLowerCase() === oldEmail.toLowerCase()) {
            return { success: false, error: 'New email must be different from current email' };
        }

        // Step 1: Re-authenticate user
        const credential = EmailAuthProvider.credential(currentUser.email, password);

        try {
            await reauthenticateWithCredential(currentUser, credential);
            console.log('✅ User re-authenticated');
        } catch (authError: any) {
            console.error('❌ Re-authentication failed:', authError);

            if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
                return { success: false, error: 'The password you entered is incorrect' };
            }

            return { success: false, error: getUserFriendlyError(authError) };
        }

        // Step 2: Use Firebase's verifyBeforeUpdateEmail
        try {
            console.log('🔐 Sending verification email to new address:', newEmail);
            
            // This sends the "Email address change" template from Firebase
            // to BOTH the old email (for notification) and new email (for verification)
            await verifyBeforeUpdateEmail(currentUser, newEmail);
            
            console.log('✅ Verification email sent via Firebase');

            const db = getDb();
            const userRef = doc(db, 'users', currentUser.uid);

            // Step 3: Store pending email in Firestore
            await updateDoc(userRef, {
                pendingEmail: newEmail,
                pendingEmailRequestedAt: new Date().toISOString(),
                previousEmail: oldEmail
            });

            console.log('✅ Pending email stored in Firestore');

            // Step 4: Create notification
            await createSystemNotification(
                currentUser.uid,
                'Email Change Requested',
                `A verification link has been sent to ${newEmail}. Click the link to complete your email change.`,
                {
                    systemType: 'info'
                }
            );

            return {
                success: true,
                pendingEmail: newEmail
            };

        } catch (emailError: any) {
            console.error('❌ Failed to send verification email:', emailError);
            
            if (emailError.code === 'auth/email-already-in-use') {
                return { success: false, error: 'This email is already in use by another account' };
            }
            
            return {
                success: false,
                error: getUserFriendlyError(emailError)
            };
        }

    } catch (error: any) {
        console.error('❌ Error requesting email change:', error);
        return {
            success: false,
            error: getUserFriendlyError(error)
        };
    }
};
/**
 * CONFIRM email change - Checks if user clicked the verification link
 * Updates email in BOTH Firebase Auth (already done by link) AND Firestore
 */
export const confirmEmailChange = async (
    verificationCode: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            return { success: false, error: 'No authenticated user found. Please log in again.' };
        }

        // Reload user to get latest email status from Firebase Auth
        await currentUser.reload();
        
        const db = getDb();
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        
        const newEmail = currentUser.email; // Email from Firebase Auth (updated by verification link)
        const pendingEmail = userData?.pendingEmail; // Email pending verification from Firestore

        console.log('🔍 Checking email change status...');
        console.log('📧 Firebase Auth email:', newEmail);
        console.log('⏳ Pending email:', pendingEmail);
        console.log('✅ Email verified:', currentUser.emailVerified);

        // Check if email was actually changed and verified
        if (newEmail && newEmail === pendingEmail && currentUser.emailVerified) {
            console.log('✅ Email successfully changed to:', newEmail);

            // ⭐ Update Firestore with the new email
            await updateDoc(userRef, {
                email: newEmail, // ← This updates the email in Firestore
                emailVerified: true,
                emailChangedAt: new Date().toISOString(),
                pendingEmail: null,
                pendingEmailRequestedAt: null,
                previousEmail: userData?.email || userData?.previousEmail // Store old email
            });

            console.log('✅ Email updated in Firestore');

            // Update cache
            const cached = await getUserCache(currentUser.uid);
            if (cached) {
                await setUserCache(currentUser.uid, {
                    userData: {
                        ...cached.userData,
                        email: newEmail,
                        emailVerified: true
                    },
                    trustedContacts: cached.trustedContacts || []
                });
                console.log('✅ Cache updated');
            }

            // Create success notification
            await createSystemNotification(
                currentUser.uid,
                'Email Changed Successfully',
                `Your email has been successfully changed to ${newEmail}`,
                {
                    systemType: 'success'
                }
            );

            console.log('✅ Email change complete!');

            return { success: true };
        }

        // If email hasn't been verified yet
        if (newEmail === pendingEmail && !currentUser.emailVerified) {
            return { 
                success: false, 
                error: 'Email changed but not yet verified. Please check your email and click the verification link.' 
            };
        }

        // If no pending email change found
        if (!pendingEmail) {
            return { 
                success: false, 
                error: 'No pending email change found.' 
            };
        }

        // Default message
        return { 
            success: false, 
            error: 'Please click the verification link sent to your new email address' 
        };

    } catch (error: any) {
        console.error('❌ Error confirming email change:', error);
        return {
            success: false,
            error: getUserFriendlyError(error)
        };
    }
};

/**
 * Helper function to get user-friendly error message for Firebase Auth email update
 */
const getAuthEmailUpdateErrorMessage = (errorCode: string): string => {
    const errorMessages: { [key: string]: string } = {
        'auth/email-already-in-use': 'This email is already in use by another account',
        'auth/invalid-email': 'The email address is invalid',
        'auth/operation-not-allowed': 'Email updates are not allowed. Please enable Email/Password sign-in in Firebase Console Settings.',
        'auth/requires-recent-login': 'Please log out and log in again before changing your email',
        'auth/user-disabled': 'Your account has been disabled',
    };

    return errorMessages[errorCode] || 'Failed to update email in Firebase Auth. Your Firestore email was updated, but please log out and log in again with your new email.';
};

/**
 * Cancel pending email change
 */
export const cancelEmailChange = async (): Promise<{ success: boolean; error?: string }> => {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            return { success: false, error: 'No authenticated user found' };
        }

        const db = getDb();
        const userRef = doc(db, 'users', currentUser.uid);

        await updateDoc(userRef, {
            pendingEmail: null,
            pendingEmailRequestedAt: null
        });

        console.log('✅ Pending email change cancelled');

        return { success: true };

    } catch (error: any) {
        console.error('❌ Error cancelling email change:', error);
        return {
            success: false,
            error: getUserFriendlyError(error)
        };
    }
};

/**
 * Check if current user's email is verified
 * Checks Firestore emailVerified field (not Firebase Auth)
 */
export const checkEmailVerification = async (): Promise<{
    isVerified: boolean;
    email: string | null;
}> => {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            return { isVerified: false, email: null };
        }

        // Check Firestore instead of Firebase Auth since we use custom verification
        const db = getDb();
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return { isVerified: false, email: currentUser.email };
        }

        const isVerified = userDoc.data()?.emailVerified || false;

        console.log('📧 Email verification status from Firestore:', {
            email: currentUser.email,
            verified: isVerified
        });

        return {
            isVerified: isVerified,
            email: currentUser.email
        };

    } catch (error) {
        console.error('❌ Error checking email verification:', error);
        return { isVerified: false, email: null };
    }
};