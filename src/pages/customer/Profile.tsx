import { useApp } from '@/store/AppContext';
import { User as UserIcon, Mail, Phone, MapPin, Package, Wallet, Calendar, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatINR, formatDate } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function ProfilePage() {
  const { user, orders, addresses, logout, showToast } = useApp();
  const navigate = useNavigate();

  const myOrders = orders.filter((o) => o.customerId === (user?.id || 'cust1'));
  const totalSpent = myOrders.reduce((sum, o) => sum + o.total, 0);

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold mx-auto mb-3">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h2 className="text-lg font-bold text-neutral-900">{user?.name || 'User'}</h2>
            <p className="text-sm text-neutral-500">{user?.email || 'No email'}</p>
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm">Edit Profile</Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut size={14} /> Logout</Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <Package size={20} className="text-primary-600 mb-2" />
              <p className="text-2xl font-bold text-neutral-900">{myOrders.length}</p>
              <p className="text-xs text-neutral-500">Total Orders</p>
            </Card>
            <Card className="p-4">
              <Wallet size={20} className="text-accent-600 mb-2" />
              <p className="text-2xl font-bold text-neutral-900">{formatINR(totalSpent)}</p>
              <p className="text-xs text-neutral-500">Total Spent</p>
            </Card>
            <Card className="p-4">
              <Calendar size={20} className="text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-neutral-900">{user ? new Date(user.createdAt).getFullYear() : '2024'}</p>
              <p className="text-xs text-neutral-500">Member Since</p>
            </Card>
          </div>

          {/* Contact info */}
          <Card className="p-5">
            <h3 className="font-bold text-neutral-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-neutral-400" />
                <span className="text-neutral-600">{user?.email || 'Not available'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-neutral-400" />
                <span className="text-neutral-600">{user?.phone || 'Not provided'}</span>
              </div>
            </div>
          </Card>

          {/* Saved addresses */}
          <Card className="p-5">
            <h3 className="font-bold text-neutral-900 mb-4">Saved Addresses</h3>
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr.id} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl">
                  <MapPin size={16} className="text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{addr.label} · {addr.fullName}</p>
                    <p className="text-sm text-neutral-500">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-sm text-neutral-500">{addr.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
