/**
 * ADMIN ACCOUNT SETUP SCRIPT
 * ============================================================
 * Run this script ONCE from the browser console or as a
 * temporary button in AdminSettings to seed the admin user
 * document in Firestore.
 *
 * Pre-requisites:
 *  1. The admin account must already exist in Firebase Auth
 *     (log in via the Login page as Admin and complete the
 *     Firebase Auth account creation first).
 *  2. The AuthDomain must have pallavigaikwad1506@gmail.com
 *     registered (use "Create account" in Firebase Console →
 *     Authentication → Users, or use the forgotten-password
 *     flow to set a password).
 *
 * Usage (browser console on the running app):
 *   import { setupAdminAccount } from './src/lib/setupAdmin';
 *   setupAdminAccount();
 *
 * OR copy the Firestore write below and run it manually in
 * Firebase Console → Firestore → users collection.
 * ============================================================
 */

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const ADMIN_EMAIL = 'pallavigaikwad1506@gmail.com';
const ADMIN_UID   = 'REPLACE_WITH_ACTUAL_FIREBASE_UID'; // Get from Firebase Console → Auth

export async function setupAdminAccount(adminUid: string = ADMIN_UID) {
  if (adminUid === 'REPLACE_WITH_ACTUAL_FIREBASE_UID') {
    console.error(
      '❌ Please replace ADMIN_UID with the actual Firebase UID from the Firebase Console → Authentication → Users.'
    );
    return;
  }

  const userRef = doc(db, 'users', adminUid);
  const existing = await getDoc(userRef);

  if (existing.exists()) {
    const data = existing.data();
    if (data.role === 'admin') {
      console.log('✅ Admin account already exists:', data);
      return;
    }
  }

  const adminProfile = {
    id: adminUid,
    name: 'Admin',
    email: ADMIN_EMAIL,
    role: 'admin',
    createdAt: new Date().toISOString(),
  };

  await setDoc(userRef, adminProfile);
  console.log('✅ Admin Firestore profile created:', adminProfile);
  console.log('');
  console.log('🔐 NEXT STEPS:');
  console.log('  1. Ensure pallavigaikwad1506@gmail.com is registered in Firebase Auth');
  console.log('  2. Deploy the updated Firestore rules: firebase deploy --only firestore:rules');
  console.log('  3. The admin can now sign in at /login with the Admin role selected');
}

/**
 * HOW TO FIND THE ADMIN UID:
 * --------------------------
 * 1. Go to Firebase Console → Authentication → Users
 * 2. Find the row for pallavigaikwad1506@gmail.com
 * 3. Copy the UID from the User UID column
 * 4. Replace ADMIN_UID above with that value
 * 5. Run: setupAdminAccount('paste-uid-here')
 *
 * If the account doesn't exist yet:
 * --------------------------
 * Option A (Firebase Console):
 *   Authentication → Users → Add User
 *   Email: pallavigaikwad1506@gmail.com
 *   Password: (set a strong password)
 *   Copy the generated UID
 *
 * Option B (Login page):
 *   Go to /login → select Admin → enter the email and a password
 *   Firebase Auth will create the account on first successful sign-in
 *   (you might see a "no admin role" error the first time — that's expected)
 *   Then run this script to add the Firestore profile
 */
