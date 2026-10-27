import { useState, useEffect } from 'react';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Save, Globe, CreditCard, Bell, Shield, MapPin, Trash2 } from 'lucide-react';
import { deleteAllMetadata } from '@/lib/seed';

export function AdminSettingsPage() {
  const { platformSettings, updatePlatformSettings, loadPlatformSettings, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(platformSettings);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPlatformSettings();
  }, [loadPlatformSettings]);

  useEffect(() => {
    setSettings(platformSettings);
  }, [platformSettings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updatePlatformSettings(settings);
      showToast('Settings saved successfully');
    } catch (error) {
      showToast('Error saving settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMetadata = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteAllMetadata();
      if (success) {
        showToast('All metadata deleted successfully! Refresh the page to see changes.', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast('Error deleting metadata', 'error');
      }
    } catch (error) {
      showToast('Error deleting metadata', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">Settings</h2>
        <p className="text-sm text-neutral-500 mt-1">Configure your marketplace platform</p>
      </div>

      <Card className="p-5">
        <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><Globe size={18} /> General Settings</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Site Name" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} />
            <Input label="Support Email" value={settings.supportEmail} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Currency" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}>
              <option>INR</option><option>USD</option><option>EUR</option>
            </Select>
            <Input label="Minimum Order Value (₹)" type="number" value={settings.minOrder} onChange={(e) => setSettings({ ...settings, minOrder: e.target.value })} />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><MapPin size={18} /> Contact Information</h3>
        <div className="space-y-4">
          <Input 
            label="Contact Phone" 
            placeholder="+91 1800 123 4567"
            value={settings.contactPhone} 
            onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })} 
          />
          <Textarea 
            label="Business Address" 
            rows={2}
            placeholder="42 Garden Road, Bengaluru, Karnataka 560001"
            value={settings.address} 
            onChange={(e) => setSettings({ ...settings, address: e.target.value })} 
          />
          <p className="text-xs text-neutral-500">This information will be displayed in the footer and contact pages.</p>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><CreditCard size={18} /> Commission & Payments</h3>
        <div className="space-y-4">
          <Input label="Platform Commission (%)" type="number" value={settings.commission} onChange={(e) => setSettings({ ...settings, commission: e.target.value })} />
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.autoApprove} onChange={(e) => setSettings({ ...settings, autoApprove: e.target.checked })} className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">Auto-approve new nurseries</p>
              <p className="text-xs text-neutral-500">Skip manual approval process for new sellers</p>
            </div>
          </label>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><Bell size={18} /> Notifications</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.emailNotifications} onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })} className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">Email notifications</p>
              <p className="text-xs text-neutral-500">Send order and system updates via email</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.smsNotifications} onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })} className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">SMS notifications</p>
              <p className="text-xs text-neutral-500">Send order updates via SMS</p>
            </div>
          </label>
        </div>
      </Card>

      <Button size="lg" onClick={handleSave} disabled={loading}>
        <Save size={18} /> {loading ? 'Saving...' : 'Save Settings'}
      </Button>

      <Card className="p-5 border-red-200 bg-red-50">
        <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2"><Trash2 size={18} /> Clean Database</h3>
        <p className="text-sm text-red-700 mb-4">
          Delete all sample/hardcoded data including nurseries, plants, inventory, orders, reviews, and categories. 
          This action cannot be undone. Platform settings will be preserved.
        </p>
        <Button 
          variant="danger" 
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        >
          <Trash2 size={16} /> {isDeleting ? 'Deleting...' : 'Delete All Metadata'}
        </Button>
      </Card>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteMetadata}
        title="Delete all metadata?"
        message="This will permanently delete all nurseries, plants, inventory, orders, reviews, and categories from Firebase. Only platform settings will remain. This action cannot be undone. Are you sure?"
        confirmLabel="Delete All"
        danger
      />
    </div>
  );
}
