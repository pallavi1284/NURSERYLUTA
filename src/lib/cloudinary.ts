/**
 * Cloudinary Integration Helper for NurseryHub
 * Handles client-side unsigned uploads using Cloudinary's upload preset.
 * IMPORTANT: No API Secret or private credentials are contained or exposed here.
 */

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export function getCloudinaryConfig() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'axxseore';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'cloudinary_setup';
  return { cloudName, uploadPreset };
}

/**
 * Upload an image file directly to Cloudinary using unsigned upload preset
 * Returns both secure_url and public_id for future deletion
 */
export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const { cloudName, uploadPreset } = getCloudinaryConfig();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (response.ok && data.secure_url) {
      // IMPORTANT: Store public_id for secure deletion via Cloud Function
      return {
        secure_url: data.secure_url,
        public_id: data.public_id || `nursery_plant_${Date.now()}`,
        format: data.format || file.type.split('/')[1] || 'jpg',
        width: data.width || 800,
        height: data.height || 600,
        bytes: data.bytes || file.size,
      };
    }

    if (!response.ok) {
      const errorMsg = data.error?.message || 'Failed to upload image to Cloudinary. Please verify your Cloud Name (axxseore) and Upload Preset (cloudinary_setup).';
      console.error('Cloudinary API error:', data);
      throw new Error(errorMsg);
    }
  } catch (error: any) {
    console.error('Cloudinary API upload error:', error.message || error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error during Cloudinary upload. Please check your internet connection.');
    }
    throw error;
  }

  // Fallback: If upload fails, use local preview (but deletion won't work server-side)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const realImageDataUrl = reader.result as string;
      resolve({
        secure_url: realImageDataUrl,
        public_id: `plant_${Date.now()}`, // Local fallback - won't be in Cloudinary
        format: file.type.split('/')[1] || 'jpg',
        width: 800,
        height: 600,
        bytes: file.size,
      });
    };
    reader.readAsDataURL(file);
  });
}



