// Backend/controller/user/fetchUser.ts
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';

import { getDb } from '../../firebase';
import { User, TrustedContact } from '../../../components/services/types';
import { getUserCache, setUserCache, getCacheAge } from '../cache/userCache';

export const fetchUser = async (
  uid: string,
  forceRefresh: boolean = false
): Promise<{ userData: User; trustedContacts: TrustedContact[] } | null> => {
  try {
    console.log('🔍 Fetching user for uid:', uid, { forceRefresh });

    // 1️⃣ Try to get from cache (unless force refresh)
    if (!forceRefresh) {
      const cached = await getUserCache(uid);
      if (cached) {
        const age = getCacheAge();
        console.log(`✅ Using cached data (age: ${age}s)`);
        
        // Still fetch fresh trusted contacts in background (non-blocking)
        fetchTrustedContactsWithUserInfo(
          cached.userData.email,
          cached.userData.role,
          uid
        ).then(freshContacts => {
          // Update cache with fresh contacts if different
          if (JSON.stringify(freshContacts) !== JSON.stringify(cached.trustedContacts)) {
            console.log('🔄 Background refresh: Trusted contacts changed');
            setUserCache(uid, {
              userData: cached.userData,
              trustedContacts: freshContacts
            });
          }
        }).catch(err => console.warn('⚠️ Background refresh failed:', err));
        
        return cached;
      }
    } else {
      console.log('🔄 Force refresh requested, bypassing cache');
    }

    // 2️⃣ Fetch user from Firestore 'users' collection
    const db = getDb();
    console.log('📡 Fetching fresh data from Firestore...');
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.warn('❌ User not found in Firestore');
      return null;
    }

    const firestoreData = docSnap.data();
    
    const userData: User = {
      uid,
      ...(firestoreData as Omit<User, 'uid' | 'name'>),
      name: firestoreData.fullName || firestoreData.name || 'User',
      email: firestoreData.email || '',
      role: firestoreData.role || 'rider',
      contactNo: firestoreData.contactNo || '',
      deviceID: firestoreData.deviceID || 'N/A',
      lastOnline: firestoreData.lastOnline || new Date().toLocaleString(),
      battery: firestoreData.battery || 0,
    };

    console.log('✅ Fresh user data fetched:', {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      contactNo: userData.contactNo
    });

    // 3️⃣ Fetch trusted contacts with full user information
    const trustedContacts = await fetchTrustedContactsWithUserInfo(
      userData.email,
      userData.role,
      uid
    );
    console.log('✅ Trusted contacts fetched:', trustedContacts.length);

    // 4️⃣ Save everything to cache
    const fullData = { userData, trustedContacts };
    await setUserCache(uid, fullData);

    return fullData;

  } catch (err) {
    console.error('❌ Error in fetchUser:', err);

    // Try to return cached data as fallback
    const fallback = await getUserCache(uid);
    if (fallback) {
      console.log('⚠️ Using stale cache as fallback');
    }
    return fallback || null;
  }
};

/**
 * Fetch trusted contacts with full user information from users collection
 * Returns BOTH:
 * 1. Contacts added BY current user TO others (OUTGOING)
 * 2. Contacts added BY others TO current user (INCOMING - accepted requests)
 */
const fetchTrustedContactsWithUserInfo = async (
  userEmail: string,
  userRole: string,
  userUid: string
): Promise<TrustedContact[]> => {
  if (!userEmail || typeof userEmail !== 'string' || !userEmail.trim()) {
    console.log('❌ Invalid email for trusted contacts query');
    return [];
  }

  try {
    const normalizedEmail = userEmail.trim().toLowerCase();
    
    console.log('🔍 Fetching trusted contacts:', {
      userEmail: normalizedEmail,
      userRole,
      userUid
    });

    const db = getDb();

    // Query 1: OUTGOING - Contacts added BY current user (accepted)
    const outgoingQuery = query(
      collection(db, 'TrustedContact'),
      where('contactEmail', '==', normalizedEmail),
      where('status', '==', 'accepted')
    );

    // Query 2: INCOMING - Contacts added TO current user (accepted)
    const incomingQuery = query(
      collection(db, 'TrustedContact'),
      where('contactUid', '==', userUid),
      where('status', '==', 'accepted')
    );

    // Query 3: PENDING OUTGOING - Contacts added BY current user (pending)
    const pendingQuery = query(
      collection(db, 'TrustedContact'),
      where('contactEmail', '==', normalizedEmail),
      where('status', '==', 'pending')
    );

    // Execute all queries
    const [outgoingSnapshot, incomingSnapshot, pendingSnapshot] = await Promise.all([
      getDocs(outgoingQuery),
      getDocs(incomingQuery),
      getDocs(pendingQuery)
    ]);

    console.log('📊 Found relationships:', {
      outgoing: outgoingSnapshot.size,
      incoming: incomingSnapshot.size,
      pending: pendingSnapshot.size
    });

    // Combine all snapshots into single array
    const allDocs: QuerySnapshot<DocumentData>[] = [
      outgoingSnapshot,
      incomingSnapshot,
      pendingSnapshot
    ];

    const allSnapshots = allDocs.flatMap(snapshot => snapshot.docs);

    if (allSnapshots.length === 0) {
      console.log('⚠️ No accepted or pending relationships found');
      return [];
    }

    // Fetch contact person's info from users collection
    const trustedContactsPromises = allSnapshots.map(async (docSnap) => {
      const relationshipData = docSnap.data();
      const status = relationshipData.status || 'accepted';
      
      // Determine which email to fetch based on relationship direction
      let contactPersonEmail: string;
      let riderEmail: string;
      
      if (relationshipData.contactEmail === normalizedEmail) {
        // OUTGOING: current user is the rider (in contactEmail)
        contactPersonEmail = relationshipData.email;
        riderEmail = normalizedEmail;
      } else {
        // INCOMING: current user is the contact (in email), requester is the rider
        contactPersonEmail = relationshipData.contactEmail;
        riderEmail = relationshipData.contactEmail;
      }

      console.log('📄 Processing relationship:', {
        docId: docSnap.id,
        contactPersonEmail,
        riderEmail,
        relation: relationshipData.relation,
        status: status,
        direction: relationshipData.contactEmail === normalizedEmail ? 'OUTGOING' : 'INCOMING'
      });

      try {
        const usersQuery = query(
          collection(db, 'users'),
          where('email', '==', contactPersonEmail)
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        
        if (!usersSnapshot.empty) {
          const contactUserData = usersSnapshot.docs[0].data();
          
          const contact: TrustedContact = {
            id: docSnap.id,
            name: contactUserData.fullName || contactUserData.name || 'Unknown',
            email: contactPersonEmail,
            contactEmail: riderEmail,
            contactNo: contactUserData.contactNo || '',
            relation: relationshipData.relation || '',
            latitude: relationshipData.latitude || 0,
            longitude: relationshipData.longitude || 0,
            role: contactUserData.role || '',
            deviceID: contactUserData.deviceID || '',
            photoURL: contactUserData.photoURL,
            status: status as 'pending' | 'accepted' | 'rejected',
            createdAt: relationshipData.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            updatedAt: relationshipData.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            acceptedAt: relationshipData.acceptedAt?.toDate?.()?.toISOString?.()
          };

          return contact;
        } else {
          console.warn('⚠️ Contact user not found:', contactPersonEmail);
          const fallbackContact: TrustedContact = {
            id: docSnap.id,
            name: 'Unknown',
            email: contactPersonEmail,
            contactEmail: riderEmail,
            contactNo: '',
            relation: relationshipData.relation || '',
            latitude: 0,
            longitude: 0,
            status: status as 'pending' | 'accepted' | 'rejected'
          };
          return fallbackContact;
        }
      } catch (error) {
        console.error('❌ Error fetching user info:', error);
        const fallbackContact: TrustedContact = {
          id: docSnap.id,
          name: 'Unknown',
          email: contactPersonEmail,
          contactEmail: riderEmail,
          contactNo: '',
          relation: relationshipData.relation || '',
          latitude: 0,
          longitude: 0,
          status: status as 'pending' | 'accepted' | 'rejected'
        };
        return fallbackContact;
      }
    });

    const trustedContacts = await Promise.all(trustedContactsPromises);
    
    console.log('✅ Returning', trustedContacts.length, 'trusted contact(s)');
    console.log('📋 Contacts breakdown:', {
      accepted: trustedContacts.filter(c => c.status === 'accepted').length,
      pending: trustedContacts.filter(c => c.status === 'pending').length
    });
    
    return trustedContacts;

  } catch (err) {
    console.error('❌ Error fetching trusted contacts:', err);
    return [];
  }
};