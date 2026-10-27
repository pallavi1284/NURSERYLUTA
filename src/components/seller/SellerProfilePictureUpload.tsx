import { useState, useRef } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Button } from '@/components/ui/Button';
import { uploadToCloudinary, CloudinaryUploadResult } from '@/lib/cloudinary';
import { deleteCloudinaryImage } from '@/lib/cloudinary-delete';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Nursery } from '@/types';

interface SellerProfilePictureUploadProps {
  nursery: Nursery;
  onUploadComplete?: (result: CloudinaryUploadResult) => void;
}

export function SellerProfilePictureUpload({ nursery, onUploadComplete }: SellerProfilePictureUploadProps) {
  const { updateNursery, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(nursery.profilePicture || null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File validation constants
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Only JPG, JPEG, and PNG files are allowed',
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'File size must be less than 5MB',
      };
    }

    // Check file extension (additional safety)
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: 'Invalid file extension. Use JPG, JPEG, or PNG',
      };
    }

    return { valid: true };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error state
    setError(null);

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      showToast(validation.error || 'Invalid file', 'error');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    await uploadProfilePicture(file);

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadProfilePicture = async (file: File) => {
    setLoading(true);
    try {
      // Delete old profile picture if it exists
      if (nursery.profilePicturePublicId) {
        try {
          await deleteCloudinaryImage(nursery.profilePicturePublicId, nursery.id);
          console.log('Old profile picture deleted');
        } catch (deleteError) {
          console.warn('Failed to delete old profile picture:', deleteError);
          // Continue with upload even if deletion fails
        }
      }

      // Upload new picture to Cloudinary
      const result = await uploadToCloudinary(file);

      // Update nursery in Firebase with new profile picture
      await updateNursery(nursery.id, {
        profilePicture: result.secure_url,
        profilePicturePublicId: result.public_id,
      });

      showToast('Profile picture updated successfully', 'success');
      onUploadComplete?.(result);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to upload profile picture';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setPreview(nursery.profilePicture || null); // Revert preview on error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      // Delete from Cloudinary
      if (nursery.profilePicturePublicId) {
        await deleteCloudinaryImage(nursery.profilePicturePublicId, nursery.id);
      }

      // Clear from Firebase
      await updateNursery(nursery.id, {
        profilePicture: undefined,
        profilePicturePublicId: undefined,
      });

      setPreview(null);
      setError(null);
      showToast('Profile picture removed', 'success');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete profile picture';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Nursery Profile Picture
        </label>
        <p className="text-xs text-neutral-500 mb-3">
          JPG, JPEG, or PNG • Maximum 5MB
        </p>

        {/* Preview Section */}
        {preview ? (
          <div className="relative mb-4 inline-block">
            <img
              src={preview}
              alt="Nursery profile"
              className="w-32 h-32 object-cover rounded-lg border-2 border-neutral-200"
            />
            <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 bg-black/40 flex items-center justify-center gap-2 transition-opacity">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="p-2 bg-white rounded-lg hover:bg-neutral-100 disabled:opacity-50"
                title="Change picture"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} className="text-neutral-900" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="p-2 bg-white rounded-lg hover:bg-neutral-100 disabled:opacity-50"
                title="Delete picture"
              >
                <X size={16} className="text-red-600" />
              </button>
            </div>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} className="mx-auto mb-2 text-neutral-400" />
            <p className="text-sm font-medium text-neutral-700">Upload profile picture</p>
            <p className="text-xs text-neutral-500 mt-1">Click to browse or drag and drop</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
          onChange={handleFileSelect}
          disabled={loading}
          className="hidden"
          aria-label="Upload profile picture"
        />

        {/* Upload Button */}
        {!preview && (
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="mt-4"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload size={16} /> Choose File
              </>
            )}
          </Button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Remove Profile Picture"
        message="Are you sure you want to remove your nursery's profile picture? This action cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleDeleteProfilePicture}
        isLoading={loading}
      />
    </div>
  );
}
