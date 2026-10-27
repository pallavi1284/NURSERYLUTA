import { useMemo, useState } from 'react';
import { Store, Users, Package, ShoppingBag, IndianRupee, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatINR, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import { seedDatabase } from '@/lib/seed';

export function AdminDashboardPage() {
  const { nurseries, plants, orders, customers, showToast } = useApp();
  const [isSeeding, setIsSeeding] = useState(false);

  const approvedNurseries = nurseries.filter((n) => n.status === 'approved');
  const pendingNurseries = nurseries.filter((n) => n.status === 'pending');
  const totalRevenue = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0);

  // Calculate actual monthly data from orders (last 6 months)
  const monthlyData = useMemo(() => {
    if (orders.length === 0) {
      return ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => ({ month: m, revenue: 0, orders: 0 }));
    }

    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    
    return months.map((m, i) => {
      const monthOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        const monthDiff = (now.getMonth() - orderDate.getMonth() + 12) % 12;
        return monthDiff === (5 - i);
      });
      
      return {
        month: m,
        revenue: monthOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0),
        orders: monthOrders.length,
      };
    });
  }, [orders]);
  
  const maxRev = Math.max(...monthlyData.map((d) => d.revenue), 1);
  const maxOrd = Math.max(...monthlyData.map((d) => d.orders), 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Platform Overview</h2>
          <p className="text-sm text-neutral-500 mt-1">Monitor your marketplace performance</p>
        </div>
        <Button 
          onClick={async () => {
            setIsSeeding(true);
            const success = await seedDatabase();
            if (success) showToast("Database seeded successfully to Firestore!");
            else showToast("Error seeding Database. Check console.", "error");
            setIsSeeding(false);
          }} 
          disabled={isSeeding}
        >
          <Database size={16} className="mr-2" />
          {isSeeding ? 'Seeding to Firebase...' : 'Seed Data to Firebase'}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Total Nurseries" value={nurseries.length} icon={<Store size={20} />} color="primary" />
        <KpiCard label="Total Customers" value={customers.length} icon={<Users size={20} />} color="blue" />
        <KpiCard label="Total Plants" value={plants.length} icon={<Package size={20} />} color="accent" />
        <KpiCard label="Total Orders" value={orders.length} icon={<ShoppingBag size={20} />} color="purple" />
        <KpiCard label="Total Revenue" value={formatINR(totalRevenue)} icon={<IndianRupee size={20} />} color="primary" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-bold text-neutral-900 mb-4">Platform Revenue</h3>
          <div className="flex items-end justify-between gap-3 h-48">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-primary-100 rounded-t-lg flex items-end" style={{ height: '100%' }}>
                  <div className="w-full bg-primary-600 rounded-t-lg" style={{ height: `${(d.revenue / maxRev) * 100}%` }} />
                </div>
                <span className="text-xs text-neutral-500">{d.month}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-neutral-900 mb-4">Platform Orders</h3>
          <div className="flex items-end justify-between gap-3 h-48">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-accent-100 rounded-t-lg flex items-end" style={{ height: '100%' }}>
                  <div className="w-full bg-accent-500 rounded-t-lg" style={{ height: `${(d.orders / maxOrd) * 100}%` }} />
                </div>
                <span className="text-xs text-neutral-500">{d.month}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Welcome card for fresh install */}
      {nurseries.length === 0 && plants.length === 0 && orders.length === 0 && (
        <Card className="p-8 bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-100">
          <div className="max-w-3xl">
            <h3 className="text-2xl font-bold text-neutral-900 mb-3">Welcome to Your Plant Marketplace! 🌱</h3>
            <p className="text-neutral-600 mb-6">
              Your platform is ready to grow! Here's what happens next:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 border border-primary-100">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mb-3">
                  <Store size={20} className="text-primary-600" />
                </div>
                <h4 className="font-bold text-neutral-900 mb-1">1. Sellers Register</h4>
                <p className="text-xs text-neutral-600">Nursery owners sign up and submit their business details for approval.</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-primary-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Package size={20} className="text-blue-600" />
                </div>
                <h4 className="font-bold text-neutral-900 mb-1">2. You Approve</h4>
                <p className="text-xs text-neutral-600">Review nursery applications and approve trusted sellers to start listing plants.</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-primary-100">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <Users size={20} className="text-green-600" />
                </div>
                <h4 className="font-bold text-neutral-900 mb-1">3. Customers Buy</h4>
                <p className="text-xs text-neutral-600">Shoppers browse plants, compare prices, and place orders from multiple nurseries.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={async () => {
                  setIsSeeding(true);
                  const success = await seedDatabase();
                  if (success) showToast("Categories and platform settings seeded to Firebase!");
                  else showToast("Error seeding database. Check console.", "error");
                  setIsSeeding(false);
                }} 
                disabled={isSeeding}
                size="lg"
              >
                <Database size={18} />
                {isSeeding ? 'Seeding...' : 'Initialize Platform Data'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Pending nurseries alert */}
      {pendingNurseries.length > 0 && (
        <Card className="p-5 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Store size={24} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-900 mb-2">
                {pendingNurseries.length} {pendingNurseries.length === 1 ? 'Nursery' : 'Nurseries'} Awaiting Approval
              </h3>
              <p className="text-sm text-neutral-600 mb-4">
                New sellers have registered and are waiting for your approval to start selling.
              </p>
              <div className="space-y-2">
                {pendingNurseries.slice(0, 3).map((n) => (
                  <div key={n.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
                    <div>
                      <p className="text-sm font-bold text-neutral-900">{n.name}</p>
                      <p className="text-xs text-neutral-500">{n.ownerName} · {n.city}, {n.state}</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                  </div>
                ))}
              </div>
              {pendingNurseries.length > 3 && (
                <p className="text-xs text-neutral-500 mt-3">
                  + {pendingNurseries.length - 3} more pending
                </p>
              )}
              <Link to="/admin/nurseries" className="inline-block mt-4">
                <Button size="sm">Review Nurseries</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Approved nurseries waiting for plants */}
      {approvedNurseries.length > 0 && plants.length === 0 && (
        <Card className="p-5 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Package size={24} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-900 mb-2">Approved Nurseries Can Now Add Plants</h3>
              <p className="text-sm text-neutral-600">
                {approvedNurseries.length} {approvedNurseries.length === 1 ? 'nursery has' : 'nurseries have'} been approved. 
                Sellers can now log in and start adding their plant inventory.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Recent orders */}
      <Card className="p-5">
        <h3 className="font-bold text-neutral-900 mb-4">Recent Orders</h3>
        {orders.length === 0 ? (
          <div className="py-8 text-center">
            <ShoppingBag size={48} className="text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No orders yet. Orders will appear here once customers start purchasing.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-neutral-900">{order.orderNumber}</p>
                  <p className="text-xs text-neutral-500">{order.customerName} · {order.nurseryName} · {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getOrderStatusColor(order.status)}>{getOrderStatusLabel(order.status)}</Badge>
                  <span className="text-sm font-bold text-neutral-900">{formatINR(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
