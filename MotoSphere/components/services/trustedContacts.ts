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
  getDoc 
} from 'firebase/firestore';
import { getDb } from '../../Backend/firebase';
import { TrustedContact } from './types';

/**
 * Check if email exists in users collection
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const db = getDb();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
    const snapshot = await getDocs(q);
    
    return !snapshot.empty;
  } catch (error) {
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
  contactNo?: string;
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
      contactNo: userData.contactNo || ''
    };
  } catch (error) {
    console.error('❌ Error getting user by email:', error);
    throw new Error('Failed to get user info');
  }
};

/**
 * Check if contact already exists for this user
 */
export const checkDuplicateContact = async (
  currentUserUid: string,
  emergencyContactEmail: string
): Promise<boolean> => {
  try {
    const db = getDb();
    const contactsRef = collection(db, 'TrustedContact');
    const q = query(
      contactsRef,
      where('ownerUid', '==', currentUserUid),
      where('email', '==', emergencyContactEmail.toLowerCase().trim())
    );
    const snapshot = await getDocs(q);
    
    return !snapshot.empty;
  } catch (error) {
    console.error('❌ Error checking duplicate contact:', error);
    throw new Error('Failed to check for duplicate contact');
  }
};

/**
 * Add trusted contact (Rider adding an emergency contact)
 * 
 * Structure:
 * - contactEmail: rider's email (current user)
 * - email: emergency contact's email
 * - relation: "Friend", "Family", etc.
 */
export const addTrustedContact = async (
  currentUserUid: string,
  currentUserEmail: string,
  contactData: {
    name: string;
    relation: string;
    contactNo: string;
    email: string; // This is the emergency contact's email
    latitude: number;
    longitude: number;
  }
): Promise<TrustedContact> => {
  try {
    console.log('📋 Adding trusted contact:', contactData.email);
    
    const db = getDb();
    const emergencyContactEmail = contactData.email.toLowerCase().trim();

    // Prevent adding yourself as a contact
    if (currentUserEmail.toLowerCase().trim() === emergencyContactEmail) {
      throw new Error('You cannot add yourself as an emergency contact');
    }

    // Check if contact already exists
    const isDuplicate = await checkDuplicateContact(currentUserUid, emergencyContactEmail);
    if (isDuplicate) {
      throw new Error('This contact has already been added');
    }
    
    // Verify emergency contact email exists in users collection
    const emailExists = await checkEmailExists(emergencyContactEmail);
    if (!emailExists) {
      throw new Error('This email is not registered in MotoSphere. Please ask them to sign up first.');
    }

    // Get emergency contact user info
    const emergencyContactUser = await getUserByEmail(emergencyContactEmail);
    if (!emergencyContactUser) {
      throw new Error('Unable to find user with this email');
    }

    // Create trusted contact document
    // Following your Firestore structure:
    // - contactEmail: rider's email (person who added the contact)
    // - email: emergency contact's email
    const trustedContactRef = await addDoc(collection(db, 'TrustedContact'), {
      ownerUid: currentUserUid,
      contactUid: emergencyContactUser.uid,
      contactEmail: currentUserEmail.toLowerCase().trim(), // Rider's email
      email: emergencyContactEmail, // Emergency contact's email
      relation: contactData.relation.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Trusted contact added:', trustedContactRef.id);

    // Return the created contact
    return {
      id: trustedContactRef.id,
      name: emergencyContactUser.name, // Use the name from Firebase user
      relation: contactData.relation.trim(),
      contactNo: emergencyContactUser.contactNo || contactData.contactNo,
      email: emergencyContactEmail, // Emergency contact's email
      contactEmail: currentUserEmail.toLowerCase().trim(), // Rider's email
      latitude: contactData.latitude || 0,
      longitude: contactData.longitude || 0
    };
  } catch (error: any) {
    console.error('❌ Error adding trusted contact:', error);
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
    latitude: number;
    longitude: number;
  }>
): Promise<void> => {
  try {
    console.log('📝 Updating trusted contact:', contactId);
    
    const db = getDb();
    
    // Verify ownership
    const contactRef = doc(db, 'TrustedContact', contactId);
    const contactDoc = await getDoc(contactRef);
    
    if (!contactDoc.exists()) {
      throw new Error('Contact not found');
    }
    
    if (contactDoc.data().ownerUid !== currentUserUid) {
      throw new Error('You do not have permission to update this contact');
    }
    
    // If email is being updated, verify it exists
    if (updates.email) {
      const emergencyContactEmail = updates.email.toLowerCase().trim();
      const currentUserDoc = await getDoc(doc(db, 'users', currentUserUid));
      
      // Prevent adding yourself
      if (currentUserDoc.exists()) {
        const currentUserEmail = currentUserDoc.data().email?.toLowerCase().trim();
        if (currentUserEmail === emergencyContactEmail) {
          throw new Error('You cannot add yourself as an emergency contact');
        }
      }
      
      // Check for duplicates (excluding current contact)
      const contactsRef = collection(db, 'TrustedContact');
      const q = query(
        contactsRef,
        where('ownerUid', '==', currentUserUid),
        where('email', '==', emergencyContactEmail)
      );
      const snapshot = await getDocs(q);
      const duplicates = snapshot.docs.filter(doc => doc.id !== contactId);
      
      if (duplicates.length > 0) {
        throw new Error('This contact has already been added');
      }
      
      const emailExists = await checkEmailExists(emergencyContactEmail);
      if (!emailExists) {
        throw new Error('This email is not registered in MotoSphere');
      }
      
      // Get new emergency contact user info
      const emergencyContactUser = await getUserByEmail(emergencyContactEmail);
      if (!emergencyContactUser) {
        throw new Error('Unable to find user with this email');
      }
      
      // Update email and contactUid
      updates = {
        ...updates,
        email: emergencyContactEmail
      };
    }

    // Trim string values
    const trimmedUpdates: any = {};
    Object.entries(updates).forEach(([key, value]) => {
      trimmedUpdates[key] = typeof value === 'string' ? value.trim() : value;
    });

    await updateDoc(contactRef, {
      ...trimmedUpdates,
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Trusted contact updated:', contactId);
  } catch (error: any) {
    console.error('❌ Error updating trusted contact:', error);
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
    
    const db = getDb();
    
    // Verify ownership
    const contactRef = doc(db, 'TrustedContact', contactId);
    const contactDoc = await getDoc(contactRef);
    
    if (!contactDoc.exists()) {
      throw new Error('Contact not found');
    }
    
    if (contactDoc.data().ownerUid !== currentUserUid) {
      throw new Error('You do not have permission to delete this contact');
    }
    
    await deleteDoc(contactRef);
    
    console.log('✅ Trusted contact deleted:', contactId);
  } catch (error: any) {
    console.error('❌ Error deleting trusted contact:', error);
    throw error;
  }
};

/**
 * Get trusted contacts for a rider (their emergency contacts)
 */
export const getTrustedContacts = async (userUid: string): Promise<TrustedContact[]> => {
  try {
    console.log('📋 Getting trusted contacts for rider:', userUid);
    
    const db = getDb();
    const q = query(
      collection(db, 'TrustedContact'),
      where('ownerUid', '==', userUid)
    );
    
    const snapshot = await getDocs(q);
    
    const contacts = await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        
        // Get emergency contact user info
        const emergencyContactUser = await getUserByEmail(data.email);
        
        return {
          id: docSnapshot.id,
          name: emergencyContactUser?.name || 'Unknown',
          relation: data.relation,
          contactNo: emergencyContactUser?.contactNo || '',
          email: data.email, // Emergency contact's email
          contactEmail: data.contactEmail, // Rider's email
          latitude: data.latitude || 0,
          longitude: data.longitude || 0
        };
      })
    );
    
    console.log(`✅ Found ${contacts.length} trusted contacts`);
    return contacts;
  } catch (error) {
    console.error('❌ Error getting trusted contacts:', error);
    throw new Error('Failed to load contacts');
  }
};

/**
 * Get riders where user is listed as emergency contact
 */
export const getRidersWhereUserIsEmergencyContact = async (
  userEmail: string
): Promise<TrustedContact[]> => {
  try {
    console.log('📋 Getting riders where user is emergency contact:', userEmail);
    
    const db = getDb();
    const q = query(
      collection(db, 'TrustedContact'),
      where('email', '==', userEmail.toLowerCase().trim())
    );
    
    const snapshot = await getDocs(q);
    
    const contacts = await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        
        // Get rider user info
        const riderUser = await getUserByEmail(data.contactEmail);
        
        return {
          id: docSnapshot.id,
          name: riderUser?.name || 'Unknown',
          relation: data.relation,
          contactNo: riderUser?.contactNo || '',
          email: data.contactEmail, // Rider's email (shown to emergency contact)
          contactEmail: data.email, // Emergency contact's email (current user)
          latitude: data.latitude || 0,
          longitude: data.longitude || 0
        };
      })
    );
    
    console.log(`✅ Found ${contacts.length} riders with user as emergency contact`);
    return contacts;
  } catch (error) {
    console.error('❌ Error getting emergency contacts:', error);
    throw new Error('Failed to load contacts');
  }
};