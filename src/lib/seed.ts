import { collection, doc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { PlatformSettings } from '../types';

/**
 * Default platform/business settings
 * These are starter values that admins should update from the Admin Settings panel
 */
export const defaultPlatformSettings: PlatformSettings = {
  siteName: 'PlantBazaar',
  supportEmail: 'support@plantbazaar.in',
  contactPhone: '',
  address: '',
  commission: '5',
  minOrder: '50',
  currency: 'INR',
  autoApprove: false,
  emailNotifications: true,
  smsNotifications: false,
};

/**
 * Delete all existing sample/metadata from Firebase collections
 * This clears all hardcoded nurseries, plants, inventory, and orders
 * Keeping only platform settings
 */
export async function deleteAllMetadata() {
  try {
    console.log('🗑️ Starting metadata cleanup...');

    const collectionsToDelete = ['nurseries', 'plants', 'inventory', 'orders', 'reviews', 'categories'];

    for (const collectionName of collectionsToDelete) {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);

      console.log(`Deleting ${snapshot.docs.length} documents from ${collectionName}...`);

      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
      }

      console.log(`✅ Cleared ${collectionName}`);
    }

    console.log('✅ All metadata deleted successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error deleting metadata:', error);
    return false;
  }
}

/**
 * A utility script to upload initial platform configuration to Firestore.
 * Only seeds platform settings.
 * Categories, nurseries, plants, and orders will be added by users through the platform.
 */
export async function seedDatabase() {
  try {
    const batch = writeBatch(db);

    // 1. Platform Settings only
    const settingsRef = doc(db, 'settings', 'platform');
    batch.set(settingsRef, defaultPlatformSettings);

    // Note: Categories, nurseries, plants, inventory, orders, and customers 
    // are intentionally NOT seeded here. They will be added by:
    // - Sellers: Register nurseries and add plants with custom categories
    // - Customers: Create orders through purchases
    // - Admin: Manage and approve nurseries

    await batch.commit();
    console.log('✅ Successfully seeded platform settings to Firestore!');
    return true;
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    return false;
  }
}
