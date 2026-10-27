/**
 * NurseryHub Firebase Cloud Functions
 * Secure server-side operations for Cloudinary image management
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// Get Cloudinary credentials from environment variables
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'axxseore';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Validate credentials on deployment
if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn(
    'WARNING: CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET environment variables are not set. ' +
    'Image deletion functionality will not work. ' +
    'Set them using: firebase functions:config:set cloudinary.api_key="..." cloudinary.api_secret="..."'
  );
}

/**
 * Secure Cloud Function to delete a Cloudinary image
 * 
 * IMPORTANT: This function:
 * 1. Verifies user is authenticated
 * 2. Checks user owns the plant
 * 3. Deletes image from Cloudinary using API Secret (server-side only)
 * 4. Updates Firestore to remove image reference
 * 5. Logs the deletion for audit trail
 * 
 * The Cloudinary API Secret is NEVER exposed to the client.
 */
export const deleteCloudinaryImage = functions
  .region('asia-south1') // Deploy to India region (change if needed)
  .https.onCall(async (data, context) => {
    try {
      // 1. Verify authentication
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated to delete images'
        );
      }

      const userId = context.auth.uid;
      const { publicId, plantId } = data;

      // Validate input
      if (!publicId || typeof publicId !== 'string') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Missing or invalid publicId parameter'
        );
      }

      if (!plantId || typeof plantId !== 'string') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Missing or invalid plantId parameter'
        );
      }

      // 2. Verify user owns the plant
      const plantDoc = await db.collection('plants').doc(plantId).get();

      if (!plantDoc.exists) {
        // Plant doesn't exist - this is OK, just return success
        console.log(`Plant ${plantId} does not exist. Proceeding with Cloudinary deletion.`);
      } else {
        const plant = plantDoc.data();

        if (plant?.sellerUID !== userId) {
          throw new functions.https.HttpsError(
            'permission-denied',
            'You do not have permission to delete this image. Only the seller who created it can delete it.'
          );
        }

        // Verify the public_id matches
        if (plant?.cloudinaryPublicId && plant.cloudinaryPublicId !== publicId) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Public ID does not match the image associated with this plant'
          );
        }
      }

      // 3. Delete image from Cloudinary using API Secret (SERVER-SIDE ONLY)
      let cloudinaryDeleted = false;
      if (CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
        try {
          cloudinaryDeleted = await deleteFromCloudinary(publicId, userId);
        } catch (error: any) {
          // Log the error but don't fail if Cloudinary asset is already gone
          if (error.message?.includes('404') || error.message?.includes('not found')) {
            console.log(`Cloudinary asset ${publicId} not found (already deleted). Continuing.`);
            cloudinaryDeleted = true;
          } else {
            throw error;
          }
        }
      } else {
        console.warn(
          'Cloudinary credentials not configured. Image deletion skipped. ' +
          'Configure: firebase functions:config:set cloudinary.api_key="..." cloudinary.api_secret="..."'
        );
      }

      // 4. Update Firestore to remove image reference
      if (plantDoc.exists) {
        await db.collection('plants').doc(plantId).update({
          image: '',
          cloudinaryPublicId: '', // or delete the field
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // 5. Log deletion for audit trail
      await db.collection('audit_logs').add({
        action: 'image_deleted',
        userId,
        plantId,
        publicId,
        cloudinaryDeleted,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        cloudName: CLOUDINARY_CLOUD_NAME,
      });

      return {
        success: true,
        message: 'Image deleted successfully',
        publicId,
        cloudinaryDeleted,
      };
    } catch (error: any) {
      console.error('Error in deleteCloudinaryImage:', error);

      // Re-throw HttpsError as-is
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // Wrap other errors
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to delete image'
      );
    }
  });

/**
 * Helper function to delete image from Cloudinary using API Secret
 * This is NEVER called from the client - only from server-side functions
 */
async function deleteFromCloudinary(
  publicId: string,
  userId: string
): Promise<boolean> {
  if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials not configured');
  }

  try {
    // Use Cloudinary Destroy API
    // https://cloudinary.com/documentation/image_upload_api_reference#destroy_method
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`;

    // Create authorization header (Basic Auth)
    const auth = Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `public_id=${encodeURIComponent(publicId)}`,
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('Cloudinary API error:', data);

      // Check if asset is already missing (404)
      if (data.error?.message?.includes('not found') || data.result === 'not found') {
        throw new Error(`Image not found in Cloudinary (already deleted): ${publicId}`);
      }

      throw new Error(data.error?.message || `Cloudinary error: ${response.statusText}`);
    }

    // Successful deletion
    console.log(`✅ Deleted from Cloudinary: ${publicId} by user ${userId}`);
    return true;
  } catch (error: any) {
    console.error('Cloudinary deletion failed:', error);
    throw error;
  }
}

/**
 * Helper function to delete plant and associated image
 * Called when seller deletes entire plant
 */
export const deletePlantWithImage = functions
  .region('asia-south1')
  .https.onCall(async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated'
        );
      }

      const userId = context.auth.uid;
      const { plantId } = data;

      if (!plantId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Missing plantId'
        );
      }

      // Get plant document
      const plantDoc = await db.collection('plants').doc(plantId).get();

      if (!plantDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Plant not found'
        );
      }

      const plant = plantDoc.data();

      // Verify ownership
      if (plant?.sellerUID !== userId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'You do not have permission to delete this plant'
        );
      }

      // Delete image from Cloudinary if it exists
      if (plant?.cloudinaryPublicId && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
        try {
          await deleteFromCloudinary(plant.cloudinaryPublicId, userId);
        } catch (error) {
          console.warn('Failed to delete associated image:', error);
          // Don't fail the entire plant deletion if image deletion fails
        }
      }

      // Delete plant document
      await db.collection('plants').doc(plantId).delete();

      // Delete associated inventory items
      const inventoryDocs = await db
        .collection('inventory')
        .where('plantId', '==', plantId)
        .get();

      const batch = db.batch();
      inventoryDocs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Log deletion
      await db.collection('audit_logs').add({
        action: 'plant_deleted',
        userId,
        plantId,
        imageDeleted: !!plant?.cloudinaryPublicId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: 'Plant and associated image deleted successfully',
      };
    } catch (error: any) {
      console.error('Error in deletePlantWithImage:', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to delete plant'
      );
    }
  });
