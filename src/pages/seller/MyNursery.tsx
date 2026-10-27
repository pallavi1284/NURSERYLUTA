import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { BadgeCheck, Star, MapPin, Phone, Mail, Save, Store, AlertCircle, Clock, Leaf, Plus, X } from 'lucide-react';
import { SellerProfilePictureUpload } from '@/components/seller/SellerProfilePictureUpload';
import { DefaultNurseryAvatar } from '@/components/seller/DefaultNurseryAvatar';
import type { Nursery } from '@/types';

export function MyNurseryPage() {
  const { nurseries, user, showToast, addNursery, updateNursery } = useApp();
  
  // Find nursery owned by current user (match by sellerUID) - prioritize approved ones
  const myNursery = nurseries
    .filter((n) => n.sellerUID === user?.id)
    .sort((a, b) => {
      // Approved nurseries come first
      if (a.status === 'approved' && b.status !== 'approved') return -1;
      if (a.status !== 'approved' && b.status === 'approved') return 1;
      return 0;
    })[0];
  
  // Debug logging for nursery detection
  console.log('🔍 Nursery Detection Debug:', {
    currentUserId: user?.id,
    totalNurseriesInDB: nurseries.length,
    nurseriesForThisUser: nurseries.filter((n) => n.sellerUID === user?.id).length,
    myNursery: myNursery ? { id: myNursery.id, name: myNursery.name, sellerUID: myNursery.sellerUID, status: myNursery.status } : 'NOT FOUND',
    allNurseries: nurseries.map(n => ({ id: n.id, name: n.name, sellerUID: n.sellerUID, status: n.status }))
  });
  
  const [showRegistration, setShowRegistration] = useState(!myNursery);

  // Registration form state
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    ownerName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    description: '',
    specializations: [] as string[], // Custom category names entered by seller
  });

  const [categoryInput, setCategoryInput] = useState('');

  // Edit form state (for existing nursery)
  const [editForm, setEditForm] = useState(myNursery ? {
    name: myNursery.name,
    description: myNursery.description,
    phone: myNursery.phone,
    email: myNursery.email,
    address: myNursery.address,
    city: myNursery.city,
    state: myNursery.state,
    pincode: myNursery.pincode,
  } : null);

  const handleRegisterNursery = () => {
    // Validate required fields
    if (!registrationForm.name || !registrationForm.phone || !registrationForm.city || !registrationForm.state) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (registrationForm.specializations.length === 0) {
      showToast('Please add at least one plant category', 'error');
      return;
    }

    // Create new nursery
    const newNurseryData: Omit<Nursery, 'id'> = {
      ...registrationForm,
      sellerUID: user?.id || '', // Associate with seller's UID
      logo: '', // Will be set when seller uploads a logo
      banner: '', // Will be set when seller uploads a banner
      profilePicture: undefined, // Will be set when seller uploads a profile picture
      profilePicturePublicId: undefined,
      rating: 0,
      reviewCount: 0,
      verified: false,
      status: 'pending',
      joinedDate: new Date().toISOString(),
      totalPlants: 0,
    };

    addNursery(newNurseryData);
    showToast('Nursery registration submitted! Waiting for admin approval.', 'success');
    setShowRegistration(false);
  };

  const addCategory = () => {
    const category = categoryInput.trim();
    if (!category) return;
    
    if (registrationForm.specializations.includes(category)) {
      showToast('Category already added', 'error');
      return;
    }
    
    setRegistrationForm(prev => ({
      ...prev,
      specializations: [...prev.specializations, category]
    }));
    setCategoryInput('');
  };

  const removeCategory = (category: string) => {
    setRegistrationForm(prev => ({
      ...prev,
      specializations: prev.specializations.filter(c => c !== category)
    }));
  };

  const handleCategoryKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCategory();
    }
  };

  const handleSaveChanges = () => {
    if (!myNursery || !editForm) return;
    
    updateNursery(myNursery.id, editForm);
    showToast('Nursery profile updated successfully');
  };

  // Show registration form if no nursery exists
  if (showRegistration || !myNursery) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Register Your Nursery</h2>
          <p className="text-sm text-neutral-500 mt-1">Complete your nursery registration to start selling plants</p>
        </div>

        <Card className="p-6">
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <Store className="text-blue-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-semibold text-blue-900">Welcome to the Seller Panel!</p>
              <p className="text-xs text-blue-700 mt-1">Register your nursery details below. Once approved by the admin, you can start adding plants and managing orders.</p>
              {user && (
                <p className="text-xs text-blue-600 mt-2 font-mono">Your Seller ID: {user.id}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="Nursery Name" 
                placeholder="e.g., Green Valley Nursery"
                value={registrationForm.name} 
                onChange={(e) => setRegistrationForm({ ...registrationForm, name: e.target.value })}
                required
              />
              <Input 
                label="Owner Name" 
                placeholder="Your full name"
                value={registrationForm.ownerName} 
                onChange={(e) => setRegistrationForm({ ...registrationForm, ownerName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="Email" 
                type="email"
                placeholder="nursery@example.com"
                value={registrationForm.email} 
                onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })}
                required
                disabled
              />
              <Input 
                label="Phone Number" 
                placeholder="+91 98765 43210"
                value={registrationForm.phone} 
                onChange={(e) => setRegistrationForm({ ...registrationForm, phone: e.target.value })}
                required
              />
            </div>

            <Input 
              label="Address" 
              placeholder="Street address"
              value={registrationForm.address} 
              onChange={(e) => setRegistrationForm({ ...registrationForm, address: e.target.value })}
            />

            <div className="grid grid-cols-3 gap-4">
              <Input 
                label="City" 
                placeholder="e.g., Pune"
                value={registrationForm.city} 
                onChange={(e) => setRegistrationForm({ ...registrationForm, city: e.target.value })}
                required
              />
              <Input 
                label="State" 
                placeholder="e.g., Maharashtra"
                value={registrationForm.state} 
                onChange={(e) => setRegistrationForm({ ...registrationForm, state: e.target.value })}
                required
              />
              <Input 
                label="Pincode" 
                placeholder="411001"
                value={registrationForm.pincode} 
                onChange={(e) => setRegistrationForm({ ...registrationForm, pincode: e.target.value })}
              />
            </div>

            <Textarea 
              label="Description" 
              placeholder="Tell customers about your nursery, specialties, and what makes you unique..."
              rows={3} 
              value={registrationForm.description} 
              onChange={(e) => setRegistrationForm({ ...registrationForm, description: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Plant Categories *
              </label>
              <p className="text-xs text-neutral-500 mb-2">Add the types of plants you specialize in (e.g., Flowering Plants, Fruit Trees, Indoor Plants)</p>
              
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Type category name and press Enter or Add"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyPress={handleCategoryKeyPress}
                />
                <Button type="button" onClick={addCategory} variant="outline">
                  <Plus size={16} /> Add
                </Button>
              </div>

              {registrationForm.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  {registrationForm.specializations.map((category) => (
                    <Badge 
                      key={category} 
                      className="bg-primary-100 text-primary-700 pl-3 pr-2 py-1 flex items-center gap-2"
                    >
                      <span>{category}</span>
                      <button
                        type="button"
                        onClick={() => removeCategory(category)}
                        className="hover:bg-primary-200 rounded-full p-0.5"
                      >
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleRegisterNursery} size="lg">
                <Store size={16} /> Register Nursery
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-semibold text-amber-900">Approval Process</p>
              <p className="text-xs text-amber-700 mt-1">After registration, an admin will review your nursery details. You'll be notified once approved, and can then start adding plants to your inventory.</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show existing nursery management interface
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">My Nursery</h2>
        <p className="text-sm text-neutral-500 mt-1">Manage your nursery profile and contact details</p>
      </div>

      {/* Pending approval notice */}
      {myNursery.status === 'pending' && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <Clock className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-semibold text-amber-900">Pending Admin Approval</p>
              <p className="text-xs text-amber-700 mt-1">Your nursery registration is under review. You'll be able to add plants once approved by an admin.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Rejected notice */}
      {myNursery.status === 'rejected' && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-semibold text-red-900">Registration Rejected</p>
              <p className="text-xs text-red-700 mt-1">Your nursery registration was not approved. Please contact support for more information.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Banner */}
      <Card className="overflow-hidden">
        <div className="h-40 relative">
          <img src={myNursery.profilePicture || myNursery.banner || 'https://via.placeholder.com/1200x400?text=Nursery+Banner'} alt={myNursery.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        <div className="p-5 flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl border-2 border-white shadow-lg overflow-hidden bg-white -mt-12 relative shrink-0">
            <img src={myNursery.profilePicture || myNursery.logo || 'https://via.placeholder.com/64x64?text=Nursery'} alt={myNursery.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-neutral-900">{myNursery.name}</h3>
              {myNursery.verified && <BadgeCheck size={18} className="text-primary-600" />}
            </div>
            {myNursery.specializations && myNursery.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {myNursery.specializations.map((category) => (
                  <Badge key={category} className="bg-neutral-100 text-neutral-700 text-xs">
                    {category}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <Star size={14} className="text-accent-500 fill-accent-500" />
                <span className="text-sm font-bold">{myNursery.rating}</span>
                <span className="text-sm text-neutral-400">({myNursery.reviewCount})</span>
              </div>
              <Badge className={myNursery.status === 'approved' ? 'bg-primary-100 text-primary-700' : myNursery.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                {myNursery.status === 'approved' ? 'Approved' : myNursery.status === 'pending' ? 'Pending' : 'Rejected'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit form */}
      {editForm && (
        <Card className="p-5">
          <h3 className="font-bold text-neutral-900 mb-4">Edit Nursery Details</h3>
          <div className="space-y-4">
            {/* Profile Picture Section */}
            <div className="pb-4 border-b border-neutral-200">
              <SellerProfilePictureUpload nursery={myNursery} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nursery Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <Input label="Email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} disabled />
            <Textarea label="Description" rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            <Input label="Address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            <div className="grid grid-cols-3 gap-4">
              <Input label="City" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
              <Input label="State" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
              <Input label="Pincode" value={editForm.pincode} onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })} />
            </div>
            <Button onClick={handleSaveChanges}><Save size={16} /> Save Changes</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
