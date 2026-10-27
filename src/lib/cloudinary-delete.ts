/**
 * Secure Cloudinary Image Deletion Helper
 * 
 * IMPORTANT: This function calls a Firebase Callable Function backend
 * to securely delete images from Cloudinary.
 * 
 * The actual deletion credentials (Cloudinary API Secret) are kept
 * server-side in the Cloud Function and never exposed to the client.
 * 
 * Why secure deletion matters:
 * - Prevents orphaned images in Cloudinary
 * - Ensures only sellers can delete their own images
 * - Keeps API secrets safe server-side
 * - Provides audit trail through Firebase Logs
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

/**
 * Delete an image from Cloudinary securely via Firebase Cloud Function
 * 
 * @param publicId - Cloudinary public_id of the image to delete
 * @param plantId - Plant ID for audit logging
 * @returns Promise resolving to deletion result or error
 */
export async function deleteCloudinaryImage(publicId: string, plantId: string): Promise<{
  success: boolean;
  message: string;
  publicId?: string;
}> {
  if (!publicId) {
    throw new Error('Cannot delete image: missing Cloudinary public_id');
  }

  try {
    // Get Firebase Functions instance
    const functions = getFunctions(getApp());

    // Call the secure Cloud Function for deletion
    // The function is configured to:
    // 1. Verify user authentication
    // 2. Check seller owns the plant
    // 3. Delete from Cloudinary using server-side credentials
    // 4. Log the deletion action
    const deleteImage = httpsCallable(functions, 'deleteCloudinaryImage');

    const result = await deleteImage({
      publicId,
      plantId,
    });

    return {
      success: true,
      message: 'Image deleted successfully from Cloudinary',
      publicId,
    };
  } catch (error: any) {
    console.error('Cloudinary deletion error:', error);

    // Handle specific error cases
    if (error.code === 'functions/not-found') {
      throw new Error(
        'Cloud Function not configured. Please ensure Firebase Functions are deployed. ' +
        'See documentation: firebase deploy --only functions'
      );
    }

    if (error.code === 'functions/permission-denied') {
      throw new Error(
        'You do not have permission to delete this image. ' +
        'Only the seller who uploaded it can delete it.'
      );
    }

    if (error.code === 'functions/unavailable') {
      throw new Error(
        'Cloud Function service temporarily unavailable. Please try again in a moment.'
      );
    }

    // Check if it's a Cloudinary-specific error
    const errorMessage = error.message || error.details?.message || error.toString();

    if (errorMessage.includes('Cloudinary')) {
      // Cloudinary asset not found - this is OK, just clear database reference
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return {
          success: true,
          message: 'Image already deleted from Cloudinary or does not exist',
          publicId,
        };
      }

      // Cloudinary API error
      throw new Error(`Cloudinary deletion failed: ${errorMessage}`);
    }

    // Generic error
    throw new Error(
      `Failed to delete image: ${errorMessage || 'Unknown error'}`
    );
  }
}

/**
 * Batch delete multiple Cloudinary images
 * Useful when deleting a plant with image or when replacing multiple images
 */
export async function deleteCloudinaryImages(
  publicIds: string[],
  plantId: string
): Promise<{ success: boolean; deleted: string[]; failed: string[] }> {
  const deleted: string[] = [];
  const failed: string[] = [];

  for (const publicId of publicIds) {
    try {
      await deleteCloudinaryImage(publicId, plantId);
      deleted.push(publicId);
    } catch (error) {
      console.error(`Failed to delete ${publicId}:`, error);
      failed.push(publicId);
    }
  }

  return {
    success: failed.length === 0,
    deleted,
    failed,
  };
}
