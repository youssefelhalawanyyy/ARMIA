import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, firebaseConfig } from './firebase';
import { AppUser } from '@/types';

export interface AdminUserRecord extends AppUser {
  adminTitle?: string; // e.g. "Super Admin", "Store Manager", "Orders & Logistics", "Inventory Specialist"
  createdBy?: string;
  isSuperAdmin?: boolean;
}

const SUPER_ADMIN_EMAILS = [
  'admin@armia.com',
  'admin@armiaboutique.com',
  'armiaboutique1@gmail.com',
  'armia.boutique.eg@gmail.com',
];

/**
 * Fetch all registered administrators from Firestore
 */
export async function getAllAdminUsers(): Promise<AdminUserRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const admins: AdminUserRecord[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data() as AppUser & { adminTitle?: string; createdBy?: string };
      const email = data.email?.toLowerCase() || '';
      const isKnownSuper = SUPER_ADMIN_EMAILS.includes(email);

      if (data.role === 'admin' || isKnownSuper) {
        admins.push({
          uid: docSnap.id,
          email: data.email,
          displayName: data.displayName || data.email?.split('@')[0] || 'Administrator',
          photoURL: data.photoURL,
          role: 'admin',
          adminTitle: data.adminTitle || (isKnownSuper ? 'Super Administrator' : 'Store Manager'),
          phone: data.phone,
          createdAt: data.createdAt,
          createdBy: data.createdBy,
          isSuperAdmin: isKnownSuper,
        });
      }
    });

    return admins;
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
}

/**
 * Create a new Admin user in Firebase Authentication & Firestore
 * Uses an isolated secondary Firebase App instance so the currently logged in admin is NEVER signed out!
 */
export async function createNewAdminUser({
  email,
  password,
  displayName,
  phone,
  adminTitle = 'Store Manager',
  createdByUid,
}: {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  adminTitle?: string;
  createdByUid?: string;
}): Promise<AdminUserRecord> {
  const secondaryAppName = 'SecondaryAdminAuthApp';
  let secondaryApp = getApps().find((a) => a.name === secondaryAppName);
  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  }

  const secondaryAuth = getAuth(secondaryApp);

  try {
    // 1. Create user in Firebase Authentication on secondary app
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
    const fbUser = userCredential.user;

    // 2. Set display name
    await updateProfile(fbUser, { displayName: displayName.trim() });

    // 3. Save profile to Firestore `users` collection with role: 'admin'
    const adminRecord: AdminUserRecord = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: displayName.trim(),
      phone: phone?.trim() || undefined,
      role: 'admin',
      adminTitle: adminTitle.trim(),
      createdAt: serverTimestamp(),
      createdBy: createdByUid || 'Super Admin',
      isSuperAdmin: false,
    };

    const userDocRef = doc(db, 'users', fbUser.uid);
    await setDoc(userDocRef, adminRecord, { merge: true });

    // 4. Sign out from secondary auth immediately
    await signOut(secondaryAuth);

    return adminRecord;
  } catch (error) {
    // Ensure secondary auth is signed out in case of errors
    try {
      await signOut(secondaryAuth);
    } catch {
      // ignore
    }
    throw error;
  }
}

/**
 * Revoke admin privileges or delete admin user from Firestore
 */
export async function deleteAdminUser(uid: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', uid);
    // Demote role to customer or delete doc
    await updateDoc(userDocRef, {
      role: 'customer',
      adminTitle: null,
      revokedAt: serverTimestamp(),
    });
  } catch (error) {
    // If updateDoc fails, delete document
    const userDocRef = doc(db, 'users', uid);
    await deleteDoc(userDocRef);
  }
}

/**
 * Update an administrator's title or permissions
 */
export async function updateAdminUserTitle(uid: string, adminTitle: string): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, {
    adminTitle,
    updatedAt: serverTimestamp(),
  });
}
