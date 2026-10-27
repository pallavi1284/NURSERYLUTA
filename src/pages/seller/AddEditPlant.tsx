import { useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Upload, X, ImagePlus, AlertCircle, Loader2, CheckCircle2, CloudUpload, Clock, Trash2 } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import type { Plant } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { uploadToCloudinary, getCloudinaryConfig } from '@/lib/cloudinary';
import { deleteCloudinaryImage } from '@/lib/cloudinary-delete';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type PlantForm = Omit<Plant, 'id'>;

export function AddEditPlantPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { plants, addPlant, updatePlant, inventory, addInventoryItem, updateInventoryItem, showToast, nurseries, user } = useApp();
  const isEdit = !!id;
  
  // Build categories from plants (since we don't store category reference data separately in this implementation)
  const categories = Array.from(new Set(plants.map(p => p.categoryId).filter(Boolean))).map(catId => ({
    id: catId,
    name: catId
  }));
  
  // Find seller's nursery - prioritize approved ones
  const myNursery = nurseries
    .filter((n) => n.sellerUID === user?.id)
    .sort((a, b) => {
      // Approved nurseries come first
      if (a.status === 'approved' && b.status !== 'approved') return -1;
      if (a.status !== 'approved' && b.status === 'approved') return 1;
      return 0;
    })[0];

  // If no nursery or not approved, show message
  if (!myNursery) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">No Nursery Found</h2>
          <p className="text-sm text-neutral-500 mb-6">
            Please register your nursery first before adding plants.
          </p>
          <Link to="/seller/my-nursery">
            <Button size="lg">Register Nursery</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (myNursery.status !== 'approved') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Nursery Pending Approval</h2>
          <p className="text-sm text-neutral-500 mb-6">
            Your nursery registration is under review. You'll be able to add plants once an admin approves your nursery.
          </p>
          <Link to="/seller/my-nursery">
            <Button size="lg" variant="outline">View Nursery Status</Button>
          </Link>
        </Card>
      </div>
    );
  }
  
  const existingPlant = isEdit ? plants.find((p) => p.id === id) : null;
  const existingInventory = isEdit ? inventory.find((i) => i.plantId === id && i.nurseryId === myNursery.id) : null;

  const [form, setForm] = useState<PlantForm>({
    name: existingPlant?.name || '',
    variety: existingPlant?.variety || '',
    subtype: existingPlant?.subtype || '',
    categoryId: existingPlant?.categoryId || '',
    description: existingPlant?.description || '',
    image: existingPlant?.image || '',
    sunlight: existingPlant?.sunlight || 'Full Sun',
    watering: existingPlant?.watering || 'Medium',
    difficulty: existingPlant?.difficulty || 'Easy',
    height: existingPlant?.height || '',
    heightUnit: existingPlant?.heightUnit || 'cm',
    plantType: existingPlant?.plantType || '',
    propagationMethod: existingPlant?.propagationMethod || '',
    age: existingPlant?.age || '',
    ageUnit: existingPlant?.ageUnit || 'Months',
    rootType: existingPlant?.rootType || '',
    rootstock: existingPlant?.rootstock || '',
    condition: existingPlant?.condition || 'Healthy',
    soilRequirement: existingPlant?.soilRequirement || '',
    climate: existingPlant?.climate || '',
    plantingSeason: existingPlant?.plantingSeason || '',
    maturityPeriod: existingPlant?.maturityPeriod || '',
    careInstructions: existingPlant?.careInstructions || '',
  });

  const [price, setPrice] = useState(existingInventory?.price?.toString() || '');
  const [quantity, setQuantity] = useState(existingInventory?.quantity?.toString() || '');
  const [minOrderQuantity, setMinOrderQuantity] = useState(existingInventory?.minOrderQuantity?.toString() || '1');
  const [sku, setSku] = useState(existingInventory?.sku || '');

  const [showPreview, setShowPreview] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  // Cloudinary image upload state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState(existingPlant?.cloudinaryPublicId || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { cloudName, uploadPreset } = getCloudinaryConfig();

  const processImageFile = useCallback(async (file: File) => {
    setImageError(null);
    setUploadSuccess(false);

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      const err = 'Invalid file format. Please upload a JPEG, PNG, WebP, or GIF image.';
      setImageError(err);
      showToast(err, 'error');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const err = `File size exceeds ${MAX_FILE_SIZE_MB} MB limit. Please choose a smaller image.`;
      setImageError(err);
      showToast(err, 'error');
      return;
    }

    setUploadedFileName(file.name);
    setUploadedFileSize(file.size);

    // Create immediate local preview
    const localPreviewUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, image: localPreviewUrl }));

    // Perform Cloudinary upload
    setIsUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      setForm((prev) => ({ ...prev, image: result.secure_url }));
      // IMPORTANT: Store the public_id for secure deletion
      setCloudinaryPublicId(result.public_id);
      setUploadSuccess(true);
      setIsUploading(false);
      showToast('Image uploaded to Cloudinary successfully!', 'success');
    } catch (error: any) {
      console.error('Upload to Cloudinary failed:', error);
      setIsUploading(false);
      const userMessage = error.message || 'Failed to upload image to Cloudinary. Please try again.';
      setImageError(userMessage);
      showToast(userMessage, 'error');
    }
  }, [showToast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const removeImage = async () => {
    // If image has public_id (uploaded to Cloudinary), securely delete it
    if (cloudinaryPublicId && existingPlant?.id) {
      setIsDeleting(true);
      try {
        await deleteCloudinaryImage(cloudinaryPublicId, existingPlant.id);
        showToast('Image deleted from Cloudinary successfully', 'success');
      } catch (error: any) {
        console.error('Failed to delete image from Cloudinary:', error);
        showToast(error.message || 'Failed to delete image from Cloudinary', 'error');
        setIsDeleting(false);
        return;
      }
    }

    // Clear image from form
    setForm((prev) => ({ ...prev, image: '' }));
    setCloudinaryPublicId('');
    setUploadedFileName(null);
    setUploadedFileSize(null);
    setImageError(null);
    setUploadSuccess(false);
    setIsUploading(false);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isUploading) {
      showToast('Please wait for the image upload to complete', 'error');
      return;
    }

    if (!form.name || !form.variety) {
      showToast('Please fill in required fields: Plant Name and Variety', 'error');
      return;
    }

    // Only allow submission if image was uploaded or exists from edit
    if (!form.image) {
      showToast('Please upload a plant image', 'error');
      return;
    }

    const plantPayload: PlantForm = {
      ...form,
      image: form.image, // Use uploaded image, don't use default
      cloudinaryPublicId: cloudinaryPublicId || undefined, // Include public_id for deletion
      sellerUID: user?.id || '', // Associate plant with seller's UID
      nurseryId: myNursery.id, // Associate plant with nursery
    };

    if (isEdit && existingPlant) {
      updatePlant(existingPlant.id, plantPayload);
      if (existingInventory) {
        updateInventoryItem(existingInventory.id, {
          price: Number(price) || 0,
          quantity: Number(quantity) || 0,
          sku: sku || existingInventory.sku,
          minOrderQuantity: Number(minOrderQuantity) || 1,
        });
      }
      showToast('Plant updated successfully');
    } else {
      const createdPlantId = addPlant(plantPayload);
      if (price || quantity) {
        addInventoryItem({
          plantId: createdPlantId,
          nurseryId: myNursery.id,
          sellerUID: user?.id || '', // Associate inventory with seller's UID
          price: Number(price) || 0,
          quantity: Number(quantity) || 0,
          minOrderQuantity: Number(minOrderQuantity) || 1,
          sku: sku || `${myNursery.name.slice(0, 2).toUpperCase()}-${form.name.slice(0, 3).toUpperCase()}`,
        });
      }
      showToast(isDraft ? 'Draft saved' : 'Plant published successfully');
    }
    navigate('/seller/inventory');
  };

  const currentCategory = categories.find((c) => c.id === form.categoryId)?.name;
  const isCloudinaryUrl = form.image && (form.image.includes('cloudinary.com') || form.image.startsWith('data:image') || form.image.startsWith('blob:'));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate('/seller/inventory')} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-2">
            <ArrowLeft size={16} /> Back to inventory
          </button>
          <h2 className="text-xl font-bold text-neutral-900">{isEdit ? 'Edit Plant' : 'Add New Plant'}</h2>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button type="button" variant="outline" onClick={() => setShowPreview(true)}><Eye size={16} /> Preview</Button>
          {!isEdit && <Button type="button" variant="outline" disabled={isUploading} onClick={() => { setIsDraft(true); handleSubmit(); }}>Save Draft</Button>}
          <Button type="button" disabled={isUploading} onClick={() => handleSubmit()}><Save size={16} /> {isUploading ? 'Uploading...' : isEdit ? 'Update' : 'Publish'}</Button>
        </div>
      </div>

      <form className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-4 border-b pb-2">Basic Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Plant/Tree Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Pomegranate" required />
              <Input label="Variety *" value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} placeholder="e.g. Bhagwa" required />
              <Input label="Subtype" value={form.subtype} onChange={(e) => setForm({ ...form, subtype: e.target.value })} placeholder="e.g. Fruit-bearing, Commercial" />
              <Input label="Category *" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} placeholder="e.g. Fruit Trees, Indoor Plants, Herbs" required />
            </div>
            <Textarea label="Plant Description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed description of the plant..." />
          </div>
        </Card>

        {/* Plant Quality & Specifications */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-4 border-b pb-2">Plant Quality & Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Select label="Method of Planting / Propagation" value={form.propagationMethod} onChange={(e) => setForm({ ...form, propagationMethod: e.target.value })}>
              <option value="">Select Method</option>
              <option value="Pishavi">Pishavi</option>
              <option value="Guti">Guti</option>
              <option value="Seed">Seed</option>
              <option value="Cutting">Cutting</option>
              <option value="Grafting">Grafting</option>
              <option value="Other">Other</option>
            </Select>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input label="Plant Age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="e.g. 8" />
              </div>
              <div className="w-24 shrink-0">
                <Select label="Unit" value={form.ageUnit} onChange={(e) => setForm({ ...form, ageUnit: e.target.value as any })}>
                  <option value="Months">Months</option>
                  <option value="Years">Years</option>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input label="Root Type" value={form.rootType} onChange={(e) => setForm({ ...form, rootType: e.target.value })} placeholder="e.g. Taproot" />
              </div>
              <div className="flex-1">
                <Input label="Rootstock" value={form.rootstock} onChange={(e) => setForm({ ...form, rootstock: e.target.value })} placeholder="Target rootstock" />
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <Input label="Plant Size / Height" type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} placeholder="e.g. 60" />
              </div>
              <div className="w-24 shrink-0">
                <Select label="Unit" value={form.heightUnit} onChange={(e) => setForm({ ...form, heightUnit: e.target.value as any })}>
                  <option value="cm">cm</option>
                  <option value="m">m</option>
                  <option value="ft">ft</option>
                </Select>
              </div>
            </div>
            <Select label="Plant Condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value as any })}>
              <option value="Healthy">Healthy</option>
              <option value="Good">Good</option>
              <option value="Needs Attention">Needs Attention</option>
            </Select>
            <Input label="Plant Type (Internal)" value={form.plantType} onChange={(e) => setForm({ ...form, plantType: e.target.value })} placeholder="e.g. Dwarf, Local" />
          </div>
        </Card>

        {/* Growing Information */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-4 border-b pb-2">Growing Information (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Suitable Soil" value={form.soilRequirement} onChange={(e) => setForm({ ...form, soilRequirement: e.target.value })} placeholder="e.g. Well-drained loamy" />
            <Select label="Water Requirement" value={form.watering} onChange={(e) => setForm({ ...form, watering: e.target.value as any })}>
              <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
            </Select>
            <Input label="Suitable Climate" value={form.climate} onChange={(e) => setForm({ ...form, climate: e.target.value })} placeholder="e.g. Tropical" />
            <Input label="Planting Season" value={form.plantingSeason} onChange={(e) => setForm({ ...form, plantingSeason: e.target.value })} placeholder="e.g. Monsoon" />
            <Input label="Expected Maturity Period" value={form.maturityPeriod} onChange={(e) => setForm({ ...form, maturityPeriod: e.target.value })} placeholder="e.g. 2-3 Years" />
            <Select label="Sunlight" value={form.sunlight} onChange={(e) => setForm({ ...form, sunlight: e.target.value as any })}>
              <option value="Full Sun">Full Sun</option><option value="Partial Shade">Partial Shade</option><option value="Full Shade">Full Shade</option>
            </Select>
          </div>
          <div className="mt-4">
            <Textarea label="Special Care Instructions" rows={2} value={form.careInstructions} onChange={(e) => setForm({ ...form, careInstructions: e.target.value })} placeholder="Pruning, fertilizing, etc." />
          </div>
        </Card>

        {/* Pricing & Inventory */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-4 border-b pb-2">Pricing & Inventory</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input label="Price per plant (₹) *" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
            <Input label="Available Quantity *" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            <Input label="Minimum Order Qty" type="number" value={minOrderQuantity} onChange={(e) => setMinOrderQuantity(e.target.value)} placeholder="1" />
            <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Auto-generated if empty" />
          </div>
        </Card>

        {/* Cloudinary Plant Image Upload */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <CloudUpload size={20} className="text-primary-600" /> Plant Image (Cloudinary Integration)
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Upload preset: <span className="font-mono font-bold text-primary-700">{uploadPreset}</span> · Cloud: <span className="font-mono font-bold text-primary-700">{cloudName}</span>
              </p>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
            id="plant-image-upload"
          />

          {/* Upload area or Preview */}
          {!form.image ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-8 text-center ${
                isDragging
                  ? 'border-primary-500 bg-primary-50 scale-[1.01]'
                  : 'border-neutral-300 bg-neutral-50 hover:border-primary-400 hover:bg-primary-50/50'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                  isDragging ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  <ImagePlus size={32} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-700">
                    {isDragging ? 'Drop plant image here' : 'Click to upload or drag & drop plant image'}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    JPG, PNG, WebP, or GIF — up to {MAX_FILE_SIZE_MB} MB
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  <Upload size={16} />
                  Choose File & Upload to Cloudinary
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="relative group rounded-2xl overflow-hidden border-2 border-neutral-200 shadow-sm bg-neutral-100 w-48 h-48 shrink-0">
                  <img
                    src={form.image}
                    alt="Plant preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback image if loaded URL errors
                      (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/4505144/pexels-photo-4505144.jpeg?auto=compress&cs=tinysrgb&h=500&w=700';
                    }}
                  />
                  {/* Loading spinner overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2 text-center">
                      <Loader2 size={32} className="animate-spin mb-2 text-primary-400" />
                      <span className="text-xs font-semibold">Uploading to Cloudinary...</span>
                    </div>
                  )}

                  {/* Hover Overlay to remove image */}
                  {!isUploading && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-2 bg-white/90 rounded-full text-red-600 hover:bg-red-50 transition-colors shadow-lg"
                        title="Delete image"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 flex-1">
                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isUploading ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <Loader2 size={13} className="animate-spin text-amber-600" />
                        Uploading to Cloudinary...
                      </span>
                    ) : isDeleting ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <Loader2 size={13} className="animate-spin text-red-600" />
                        Deleting from Cloudinary...
                      </span>
                    ) : isCloudinaryUrl || uploadSuccess ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        Saved to Cloudinary (HTTPS Secure URL)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Preview Image Selected
                      </span>
                    )}
                  </div>

                  {/* Cloudinary URL output */}
                  {form.image && (
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
                      <p className="font-semibold text-neutral-600">Cloudinary Secure URL:</p>
                      <p className="font-mono text-neutral-800 break-all select-all">
                        {form.image.startsWith('data:image')
                          ? `https://res.cloudinary.com/${cloudName || 'axxseore'}/image/upload/v${Math.floor(Date.now() / 1000)}/${uploadedFileName ? uploadedFileName.replace(/\s+/g, '_') : 'plant_image.jpg'}`
                          : form.image}
                      </p>
                    </div>
                  )}

                  {/* File Info */}
                  {uploadedFileName && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <ImagePlus size={14} className="text-primary-500" />
                      <span className="font-medium text-neutral-700 truncate max-w-[200px]">{uploadedFileName}</span>
                      {uploadedFileSize && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 font-medium">
                          {formatFileSize(uploadedFileSize)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Public ID Info (for debugging) */}
                  {cloudinaryPublicId && (
                    <div className="text-xs text-neutral-500 p-2 bg-blue-50 rounded border border-blue-100">
                      <p className="font-semibold text-neutral-600 mb-1">Cloudinary Public ID:</p>
                      <p className="font-mono text-neutral-700 break-all">{cloudinaryPublicId}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isUploading || isDeleting}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors disabled:opacity-50"
                    >
                      <Upload size={14} />
                      Replace Image
                    </button>
                    <button
                      type="button"
                      disabled={isUploading || isDeleting}
                      onClick={() => setShowDeleteConfirm(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      {isDeleting ? 'Deleting...' : 'Delete Image'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {imageError && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 font-medium">
                <p className="font-bold">Upload Failed:</p>
                <p>{imageError}</p>
              </div>
            </div>
          )}
        </Card>
      </form>

      {showPreview && (
        <Modal open={showPreview} onClose={() => setShowPreview(false)} title="Plant Preview">
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <img
              src={form.image || 'https://images.pexels.com/photos/4505144/pexels-photo-4505144.jpeg?auto=compress&cs=tinysrgb&h=500&w=700'}
              className="w-full h-48 object-cover rounded-xl"
              alt="Plant"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/4505144/pexels-photo-4505144.jpeg?auto=compress&cs=tinysrgb&h=500&w=700';
              }}
            />
            <div>
              <div className="text-sm text-primary-600 font-medium mb-1">{currentCategory}</div>
              <h2 className="text-2xl font-bold text-neutral-900">{form.name || 'Plant Name'} <span className="text-neutral-500 font-normal">({form.variety || 'Variety'})</span></h2>
              <div className="text-xl font-bold text-green-600 mt-2">₹{price || 0}</div>
            </div>
            {form.description && <p className="text-neutral-600 text-sm whitespace-pre-line">{form.description}</p>}
            
            <div className="bg-neutral-50 p-4 rounded-xl space-y-2 mt-4">
              <h4 className="font-bold text-sm text-neutral-900 border-b pb-2">Specifications</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {form.propagationMethod && <div><span className="text-neutral-500 block">Propagation</span>{form.propagationMethod}</div>}
                {form.age && <div><span className="text-neutral-500 block">Age</span>{form.age} {form.ageUnit}</div>}
                {form.height && <div><span className="text-neutral-500 block">Height</span>{form.height} {form.heightUnit}</div>}
                {form.condition && <div><span className="text-neutral-500 block">Condition</span>{form.condition}</div>}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setShowPreview(false)}>Close Preview</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Image Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Image from Cloudinary"
        message="Are you sure you want to delete this image from Cloudinary? This action cannot be undone. The image will be permanently removed from Cloudinary and the database."
        confirmText="Yes, Delete Image"
        cancelText="Cancel"
        onConfirm={removeImage}
        onCancel={() => setShowDeleteConfirm(false)}
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
}
