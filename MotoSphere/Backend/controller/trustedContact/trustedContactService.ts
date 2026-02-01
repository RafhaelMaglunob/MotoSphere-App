// Backend/controller/trustedContact/trustedContactService.ts
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    getDocs,
    getDoc,
    Timestamp,
    WriteBatch,
    writeBatch
} from 'firebase/firestore';
import { getDb } from '../../firebase';
import { TrustedContact } from '../../../components/services/types';

export type ContactStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Validate email format
 */
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone number format (optional)
 */
const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[0-9\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * Check if email exists in users collection
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
        if (!isValidEmail(email)) {
            throw new Error('Invalid email format');
        }

        const db = getDb();
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
        const snapshot = await getDocs(q);

        return !snapshot.empty;
    } catch (error: any) {
        console.error('❌ Error checking email:', error);
        throw new Error('Failed to verify email');
    }
};

/**
 * Get user info by email
 */
export const getUserByEmail = async (email: string): Promise<{
    uid: string;
    name: string;
    role: string;
    email: string;
    contactNo?: string;
    photoURL?: string;
    deviceID?: string;
} | null> => {
    try {
        const db = getDb();
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const userData = snapshot.docs[0].data();
        return {
            uid: snapshot.docs[0].id,
            name: userData.name || userData.fullName || 'Unknown',
            role: userData.role || 'rider',
            email: userData.email || email,
            contactNo: userData.contactNo || '',
            photoURL: userData.photoURL || undefined,
            deviceID: userData.deviceID || undefined
        };
    } catch (error: any) {
        console.error('❌ Error getting user by email:', error);
        throw new Error('Failed to get user info');
    }
};

/**
 * Get user info by UID
 */
export const getUserByUID = async (uid: string): Promise<{
    uid: string;
    name: string;
    role: string;
    email: string;
    contactNo?: string;
    photoURL?: string;
    deviceID?: string;
} | null> => {
    try {
        if (!uid || uid.trim() === '') {
            throw new Error('Invalid UID');
        }

        const db = getDb();
        const userDoc = await getDoc(doc(db, 'users', uid));

        if (!userDoc.exists()) return null;

        const userData = userDoc.data();
        return {
            uid: userDoc.id,
            name: userData.name || userData.fullName || 'Unknown',
            role: userData.role || 'rider',
            email: userData.email || '',
            contactNo: userData.contactNo || '',
            photoURL: userData.photoURL || undefined,
            deviceID: userData.deviceID || undefined
        };
    } catch (error: any) {
        console.error('❌ Error getting user by UID:', error);
        throw new Error('Failed to get user info');
    }
};

/**
 * Check if contact already exists for this user
 */
export const checkDuplicateContact = async (
    currentUserUid: string,
    targetEmail: string
): Promise<boolean> => {
    try {
        const db = getDb();
        const contactsRef = collection(db, 'TrustedContact');
        const q = query(
            contactsRef,
            where('ownerUid', '==', currentUserUid),
            where('email', '==', targetEmail.toLowerCase().trim())
        );
        const snapshot = await getDocs(q);

        return !snapshot.empty;
    } catch (error: any) {
        console.error('❌ Error checking duplicate contact:', error);
        throw new Error('Failed to check for duplicate contact');
    }
};

/**
 * Add trusted contact (Emergency Contact or Rider-to-Rider)
 * For Emergency Contacts - status is 'accepted' immediately
 * For Rider-to-Rider - status is 'pending' until accepted
 */
export const addTrustedContact = async (
    currentUserUid: string,
    currentUserEmail: string,
    contactData: {
        email: string;
        relation: string;
    },
    currentUserRole: string = 'rider'
): Promise<TrustedContact> => {
    try {
        console.log('📋 Adding trusted contact:', contactData.email);

        // Input validation
        if (!currentUserUid || !currentUserEmail) {
            throw new Error('Invalid user information');
        }

        if (!contactData.email?.trim()) {
            throw new Error('Email is required');
        }

        if (!contactData.relation?.trim()) {
            throw new Error('Relationship is required');
        }

        if (!isValidEmail(contactData.email)) {
            throw new Error('Invalid email format');
        }

        const db = getDb();
        const targetEmail = contactData.email.toLowerCase().trim();
        const currentEmail = currentUserEmail.toLowerCase().trim();

        // Prevent adding yourself
        if (currentEmail === targetEmail) {
            throw new Error('You cannot add yourself as a trusted contact');
        }

        // Check for duplicates
        console.log('🔍 Checking for duplicate contact...');
        const isDuplicate = await checkDuplicateContact(currentUserUid, targetEmail);
        if (isDuplicate) {
            throw new Error('This contact has already been added');
        }

        // Verify email exists
        console.log('🔍 Verifying email exists in MotoSphere...');
        const emailExists = await checkEmailExists(targetEmail);
        if (!emailExists) {
            throw new Error('This email is not registered in MotoSphere. Please ask them to sign up first');
        }

        // Get target user info
        console.log('👤 Fetching target user info...');
        const targetUser = await getUserByEmail(targetEmail);
        if (!targetUser) {
            throw new Error('Unable to find user with this email. Please try again');
        }

        // Determine status based on roles
        let status: ContactStatus = 'accepted';
        if (currentUserRole.toLowerCase() === 'rider' && targetUser.role.toLowerCase() === 'rider') {
            status = 'pending';
            console.log('📨 Rider-to-Rider connection - status: pending');
        } else {
            console.log('✅ Emergency Contact - status: accepted');
        }

        // Create document
        console.log('💾 Creating trusted contact document...');
        const now = Timestamp.now();
        const trustedContactRef = await addDoc(collection(db, 'TrustedContact'), {
            ownerUid: currentUserUid,
            contactUid: targetUser.uid,
            contactEmail: currentEmail,
            email: targetEmail,
            relation: contactData.relation.trim(),
            status: status,
            createdAt: now,
            updatedAt: now,
            acceptedAt: status === 'accepted' ? now : null
        });

        console.log('✅ Trusted contact added:', trustedContactRef.id);

        const contact: TrustedContact = {
            id: trustedContactRef.id,
            name: targetUser.name,
            relation: contactData.relation.trim(),
            contactNo: targetUser.contactNo || '',
            email: targetEmail,
            contactEmail: currentEmail,
            latitude: 0,
            longitude: 0,
            role: targetUser.role,
            deviceID: targetUser.deviceID,
            photoURL: targetUser.photoURL,
            status: status as ContactStatus,
            createdAt: now.toDate().toISOString()
        };

        return contact;
    } catch (error: any) {
        console.error('❌ Error adding trusted contact:', error.message);
        throw error;
    }
};

/**
 * Get pending contact requests for a user (Rider-to-Rider)
 */
export const getPendingContactRequests = async (userUid: string): Promise<Array<{
    id: string;
    fromUserName: string;
    fromUserEmail: string;
    fromUserUID?: string;
    relation: string;
    createdAt: string;
}>> => {
    try {
        console.log('📋 Getting pending contact requests for:', userUid);

        if (!userUid?.trim()) {
            throw new Error('Invalid user UID');
        }

        const db = getDb();
        const q = query(
            collection(db, 'TrustedContact'),
            where('contactUid', '==', userUid),
            where('status', '==', 'pending')
        );

        const snapshot = await getDocs(q);

        const requests = await Promise.all(
            snapshot.docs.map(async (docSnapshot) => {
                const data = docSnapshot.data();
                const fromUser = await getUserByUID(data.ownerUid);

                return {
                    id: docSnapshot.id,
                    fromUserName: fromUser?.name || 'Unknown',
                    fromUserEmail: fromUser?.email || '',
                    fromUserUID: fromUser?.uid,
                    relation: data.relation,
                    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString()
                };
            })
        );

        console.log(`✅ Found ${requests.length} pending contact requests`);
        return requests;
    } catch (error: any) {
        console.error('❌ Error getting pending requests:', error);
        throw new Error('Failed to load pending requests');
    }
};

/**
 * Accept a pending contact request
 */
export const acceptContactRequest = async (
    contactId: string,
    currentUserUid: string
): Promise<void> => {
    try {
        console.log('✅ Accepting contact request:', contactId);

        if (!contactId?.trim() || !currentUserUid?.trim()) {
            throw new Error('Invalid contact or user ID');
        }

        const db = getDb();
        const contactRef = doc(db, 'TrustedContact', contactId);
        const contactDoc = await getDoc(contactRef);

        if (!contactDoc.exists()) {
            throw new Error('Contact request not found');
        }

        const contactData = contactDoc.data();

        // Verify this request is for the current user
        if (contactData.contactUid !== currentUserUid) {
            throw new Error('You do not have permission to accept this request');
        }

        if (contactData.status !== 'pending') {
            throw new Error('This request has already been processed');
        }

        const now = Timestamp.now();
        await updateDoc(contactRef, {
            status: 'accepted',
            acceptedAt: now,
            updatedAt: now
        });

        console.log('✅ Contact request accepted:', contactId);
    } catch (error: any) {
        console.error('❌ Error accepting request:', error.message);
        throw error;
    }
};

/**
 * Reject a pending contact request
 */
export const rejectContactRequest = async (
    contactId: string,
    currentUserUid: string
): Promise<void> => {
    try {
        console.log('❌ Rejecting contact request:', contactId);

        if (!contactId?.trim() || !currentUserUid?.trim()) {
            throw new Error('Invalid contact or user ID');
        }

        const db = getDb();
        const contactRef = doc(db, 'TrustedContact', contactId);
        const contactDoc = await getDoc(contactRef);

        if (!contactDoc.exists()) {
            throw new Error('Contact request not found');
        }

        const contactData = contactDoc.data();

        // Verify this request is for the current user
        if (contactData.contactUid !== currentUserUid) {
            throw new Error('You do not have permission to reject this request');
        }

        if (contactData.status !== 'pending') {
            throw new Error('This request has already been processed');
        }

        // Delete the contact instead of updating status to 'rejected'
        // This keeps the system clean
        await deleteDoc(contactRef);

        console.log('✅ Contact request rejected:', contactId);
    } catch (error: any) {
        console.error('❌ Error rejecting request:', error.message);
        throw error;
    }
};

/**
 * Update trusted contact
 */
export const updateTrustedContact = async (
    contactId: string,
    currentUserUid: string,
    updates: Partial<{
        relation: string;
        email: string;
    }>
): Promise<void> => {
    try {
        console.log('📝 Updating trusted contact:', contactId);

        if (!contactId?.trim() || !currentUserUid?.trim()) {
            throw new Error('Invalid contact or user ID');
        }

        const db = getDb();
        const contactRef = doc(db, 'TrustedContact', contactId);
        const contactDoc = await getDoc(contactRef);

        if (!contactDoc.exists()) {
            throw new Error('Contact not found');
        }

        if (contactDoc.data().ownerUid !== currentUserUid) {
            throw new Error('You do not have permission to update this contact');
        }

        // Validate updates
        if (updates.relation && !updates.relation.trim()) {
            throw new Error('Relationship cannot be empty');
        }

        if (updates.email) {
            const targetEmail = updates.email.toLowerCase().trim();

            if (!isValidEmail(targetEmail)) {
                throw new Error('Invalid email format');
            }

            const currentUserDoc = await getDoc(doc(db, 'users', currentUserUid));

            if (currentUserDoc.exists()) {
                const currentUserEmail = currentUserDoc.data().email?.toLowerCase().trim();
                if (currentUserEmail === targetEmail) {
                    throw new Error('You cannot add yourself as a trusted contact');
                }
            }

            // Check for duplicates (excluding current contact)
            const contactsRef = collection(db, 'TrustedContact');
            const q = query(
                contactsRef,
                where('ownerUid', '==', currentUserUid),
                where('email', '==', targetEmail)
            );
            const snapshot = await getDocs(q);
            const duplicates = snapshot.docs.filter(d => d.id !== contactId);

            if (duplicates.length > 0) {
                throw new Error('This contact has already been added');
            }

            const emailExists = await checkEmailExists(targetEmail);
            if (!emailExists) {
                throw new Error('This email is not registered in MotoSphere');
            }

            updates.email = targetEmail;
        }

        // Prepare updates with timestamp
        const trimmedUpdates: any = {};
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) {
                trimmedUpdates[key] = typeof value === 'string' ? value.trim() : value;
            }
        });

        await updateDoc(contactRef, {
            ...trimmedUpdates,
            updatedAt: Timestamp.now()
        });

        console.log('✅ Trusted contact updated:', contactId);
    } catch (error: any) {
        console.error('❌ Error updating trusted contact:', error.message);
        throw error;
    }
};

/**
 * Delete trusted contact
 */
export const deleteTrustedContact = async (
    contactId: string,
    currentUserUid: string
): Promise<void> => {
    try {
        console.log('🗑️ Deleting trusted contact:', contactId);

        if (!contactId?.trim() || !currentUserUid?.trim()) {
            throw new Error('Invalid contact or user ID');
        }

        const db = getDb();
        const contactRef = doc(db, 'TrustedContact', contactId);
        const contactDoc = await getDoc(contactRef);

        if (!contactDoc.exists()) {
            throw new Error('Contact not found');
        }

        const contactData = contactDoc.data();
        const isOwner = !contactData.ownerUid || contactData.ownerUid === currentUserUid;

        if (!isOwner) {
            console.error('Permission check failed');
            throw new Error('You do not have permission to delete this contact');
        }

        await deleteDoc(contactRef);

        console.log('✅ Trusted contact deleted:', contactId);
    } catch (error: any) {
        console.error('❌ Error deleting trusted contact:', error.message);
        throw error;
    }
};

/**
 * Get trusted contacts for a rider (only accepted ones)
 */
export const getTrustedContacts = async (userUid: string): Promise<TrustedContact[]> => {
    try {
        console.log('📋 Getting trusted contacts for rider:', userUid);

        if (!userUid?.trim()) {
            throw new Error('Invalid user UID');
        }

        const db = getDb();
        const q = query(
            collection(db, 'TrustedContact'),
            where('ownerUid', '==', userUid),
            where('status', '==', 'accepted')
        );

        const snapshot = await getDocs(q);

        const contacts = await Promise.all(
            snapshot.docs.map(async (docSnapshot) => {
                const data = docSnapshot.data();
                const targetUser = await getUserByEmail(data.email);

                const contact: TrustedContact = {
                    id: docSnapshot.id,
                    name: targetUser?.name || 'Unknown',
                    relation: data.relation,
                    contactNo: targetUser?.contactNo || '',
                    email: data.email,
                    contactEmail: data.contactEmail,
                    latitude: data.latitude || 0,
                    longitude: data.longitude || 0,
                    role: targetUser?.role,
                    deviceID: targetUser?.deviceID,
                    photoURL: targetUser?.photoURL,
                    status: 'accepted' as ContactStatus,
                    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
                    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString()
                };

                return contact;
            })
        );

        console.log(`✅ Found ${contacts.length} trusted contacts`);
        return contacts;
    } catch (error: any) {
        console.error('❌ Error getting trusted contacts:', error);
        throw new Error('Failed to load contacts');
    }
};

/**
 * Get riders where user is listed as emergency contact (accepted only)
 */
export const getRidersWhereUserIsEmergencyContact = async (
    userEmail: string
): Promise<TrustedContact[]> => {
    try {
        console.log('📋 Getting riders where user is emergency contact:', userEmail);

        if (!userEmail?.trim()) {
            throw new Error('Invalid email');
        }

        const db = getDb();
        const normalizedEmail = userEmail.toLowerCase().trim();
        const q = query(
            collection(db, 'TrustedContact'),
            where('email', '==', normalizedEmail),
            where('status', '==', 'accepted')
        );

        const snapshot = await getDocs(q);

        const contacts = await Promise.all(
            snapshot.docs.map(async (docSnapshot) => {
                const data = docSnapshot.data();
                const riderUser = await getUserByEmail(data.contactEmail);

                const contact: TrustedContact = {
                    id: docSnapshot.id,
                    name: riderUser?.name || 'Unknown',
                    relation: data.relation,
                    contactNo: riderUser?.contactNo || '',
                    email: data.contactEmail,
                    contactEmail: data.email,
                    latitude: data.latitude || 0,
                    longitude: data.longitude || 0,
                    role: riderUser?.role,
                    deviceID: riderUser?.deviceID,
                    photoURL: riderUser?.photoURL,
                    status: 'accepted' as ContactStatus,
                    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
                    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString()
                };

                return contact;
            })
        );

        console.log(`✅ Found ${contacts.length} riders with user as emergency contact`);
        return contacts;
    } catch (error: any) {
        console.error('❌ Error getting emergency contacts:', error);
        throw new Error('Failed to load contacts');
    }
};