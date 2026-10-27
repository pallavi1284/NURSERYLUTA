import { useMemo } from 'react';
import { Package, Boxes, Clock, CheckCircle2, TrendingUp, IndianRupee, Star, MessageSquare } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatINR, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { DefaultNurseryAvatar } from '@/components/seller/DefaultNurseryAvatar';

export function SellerDashboardPage() {
  const { plants, inventory, orders, nurseries, reviews, user } = useApp();

  // Find current seller's nursery - prioritize approved ones
  const myNursery = nurseries
    .filter((n) => n.sellerUID === user?.id)
    .sort((a, b) => {
      // Approved nurseries come first
      if (a.status === 'approved' && b.status !== 'approved') return -1;
      if (a.status !== 'approved' && b.status === 'approved') return 1;
      return 0;
    })[0];
  
  // Debug logging for nursery detection
  console.log('🔍 Seller Dashboard Nursery Detection:', {
    currentUserId: user?.id,
    totalNurseriesInDB: nurseries.length,
    matchingNurseries: nurseries.filter((n) => n.sellerUID === user?.id).length,
    selectedNursery: myNursery ? { id: myNursery.id, name: myNursery.name, sellerUID: myNursery.sellerUID, status: myNursery.status } : 'NOT FOUND'
  });
  
  const myNurseryId = myNursery?.id;

  // If no nursery, show welcome message
  if (!myNursery) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Welcome to Seller Panel!</h2>
          <p className="text-sm text-neutral-500 mb-6">
            To start selling plants, please register your nursery first.
          </p>
          <Link to="/seller/my-nursery">
            <Button size="lg">Register Your Nursery</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const myInventory = inventory.filter((inv) => inv.nurseryId === myNurseryId);
  const myPlantIdSet = new Set(myInventory.map((inv) => inv.plantId));
  const myPlants = plants.filter((p) => myPlantIdSet.has(p.id));
  const myOrders = orders.filter((o) => o.nurseryId === myNurseryId && o.sellerUid === user?.id);
  const pendingOrders = myOrders.filter((o) => o.status === 'pending');
  const completedOrders = myOrders.filter((o) => o.status === 'delivered');
  const totalSales = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalStock = myInventory.reduce((sum, inv) => sum + inv.quantity, 0);

  // Ratings
  const myPlantIds = Array.from(myPlantIdSet);
  const myReviews = reviews.filter((r) => r.nurseryId === myNurseryId);
  const plantReviews = myReviews.filter((r) => myPlantIds.includes(r.plantId));
  const avgPlantRating = plantReviews.length > 0
    ? (plantReviews.reduce((s, r) => s + r.rating, 0) / plantReviews.length).toFixed(1)
    : null;
  const avgNurseryRating = myNursery?.rating ? myNursery.rating.toFixed(1) : null;

  // Calculate actual monthly data from orders (last 6 months)
  const monthlyData = useMemo(() => {
    if (myOrders.length === 0) {
      // Return empty data if no orders
      return ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => ({ month: m, sales: 0, orders: 0 }));
    }

    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    
    return months.map((m, i) => {
      // Calculate orders for each month
      const monthOrders = myOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        const monthDiff = (now.getMonth() - orderDate.getMonth() + 12) % 12;
        return monthDiff === (5 - i); // Last 6 months
      });
      
      return {
        month: m,
        sales: monthOrders.reduce((sum, o) => sum + o.total, 0),
        orders: monthOrders.length,
      };
    });
  }, [myOrders]);
  
  const maxSales = Math.max(...monthlyData.map((d) => d.sales), 1); // Minimum 1 to avoid division by zero
  const maxOrders = Math.max(...monthlyData.map((d) => d.orders), 1);

  return (
    <div className="space-y-6">
      {/* Header with Profile Picture */}
      <div className="flex items-start gap-4">
        {myNursery.profilePicture ? (
          <img
            src={myNursery.profilePicture}
            alt={myNursery.name}
            className="w-16 h-16 rounded-lg object-cover border-2 border-neutral-200"
          />
        ) : (
          <DefaultNurseryAvatar nurseryName={myNursery.name} size="lg" />
        )}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-neutral-900">Welcome back, {user?.name || 'Rajesh'}!</h2>
          <p className="text-sm text-neutral-500 mt-1">Here's what's happening at {myNursery?.name || 'your nursery'} today.</p>
          <Link to="/seller/my-nursery" className="text-sm font-semibold text-primary-700 hover:text-primary-800 mt-2 inline-block">
            Edit nursery profile
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Total Plants" value={myPlants.length} icon={<Package size={20} />} color="primary" />
        <KpiCard label="Available Stock" value={totalStock} icon={<Boxes size={20} />} color="blue" />
        <KpiCard label="Pending Orders" value={pendingOrders.length} icon={<Clock size={20} />} color="accent" />
        <KpiCard label="Completed Orders" value={completedOrders.length} icon={<CheckCircle2 size={20} />} color="primary" />
        <KpiCard label="Total Sales" value={formatINR(totalSales)} icon={<IndianRupee size={20} />} color="primary" />
      </div>

      {/* Ratings Summary */}
      {myReviews.length > 0 ? (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-neutral-900 flex items-center gap-2"><Star size={18} className="text-amber-400 fill-amber-400" /> Ratings Summary</h3>
            <Link to="/seller/orders" className="text-sm font-semibold text-primary-700 hover:text-primary-800">View All Reviews</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
              <div className="flex items-center justify-center gap-1.5 text-3xl font-bold text-amber-600">
                {avgNurseryRating || '—'}
                <Star size={22} className="text-amber-400 fill-amber-400" />
              </div>
              <p className="text-xs text-neutral-500 mt-1 font-medium">Nursery Rating</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
              <div className="flex items-center justify-center gap-1.5 text-3xl font-bold text-green-600">
                {avgPlantRating || '—'}
                <Star size={22} className="text-green-500 fill-green-400" />
              </div>
              <p className="text-xs text-neutral-500 mt-1 font-medium">Avg. Plant Rating</p>
            </div>
            <div className="bg-primary-50 rounded-xl p-4 text-center border border-primary-100">
              <div className="flex items-center justify-center gap-1.5 text-3xl font-bold text-primary-700">
                {myReviews.length}
                <MessageSquare size={20} className="text-primary-500" />
              </div>
              <p className="text-xs text-neutral-500 mt-1 font-medium">Total Reviews</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {myReviews.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-start gap-3 bg-neutral-50 rounded-lg p-3">
                <div className="shrink-0 flex">
                  {[1,2,3,4,5].map(s => <Star key={s} size={13} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-300 fill-neutral-300'} />)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-800 truncate">{r.customerName}</p>
                  <p className="text-xs text-neutral-500 truncate italic">"{r.comment.slice(0, 80)}{r.comment.length > 80 ? '…' : ''}"</p>
                </div>
                <span className="text-xs text-neutral-400 shrink-0">{new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Charts */}
      {myOrders.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="font-bold text-neutral-900 mb-4">Sales Overview</h3>
            <div className="flex items-end justify-between gap-3 h-48">
              {monthlyData.map((d) => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-primary-100 rounded-t-lg relative flex items-end" style={{ height: '100%' }}>
                    <div
                      className="w-full bg-primary-600 rounded-t-lg transition-all"
                      style={{ height: `${(d.sales / maxSales) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-neutral-500 font-medium">{d.month}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-neutral-100">
              <span className="text-xs text-neutral-400">Monthly sales (₹)</span>
              <span className="text-xs font-bold text-primary-700">{formatINR(monthlyData.reduce((s, d) => s + d.sales, 0))}</span>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-neutral-900 mb-4">Orders Overview</h3>
            <div className="flex items-end justify-between gap-3 h-48">
              {monthlyData.map((d) => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-accent-100 rounded-t-lg relative flex items-end" style={{ height: '100%' }}>
                    <div
                      className="w-full bg-accent-500 rounded-t-lg transition-all"
                      style={{ height: `${(d.orders / maxOrders) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-neutral-500 font-medium">{d.month}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-neutral-100">
              <span className="text-xs text-neutral-400">Monthly orders</span>
              <span className="text-xs font-bold text-accent-600">{monthlyData.reduce((s, d) => s + d.orders, 0)} total</span>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center bg-gradient-to-br from-primary-50 to-neutral-50">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={32} className="text-primary-600" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-2">Ready to Start Selling?</h3>
          <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto">
            Add your first plant to start receiving orders. Your sales charts will appear here once you make your first sale.
          </p>
          <Link to="/seller/inventory/add">
            <Button size="lg">
              <Package size={18} /> Add Your First Plant
            </Button>
          </Link>
        </Card>
      )}

      {/* Recent orders */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-neutral-900">Recent Orders</h3>
          <Link to="/seller/orders" className="text-sm font-semibold text-primary-700 hover:text-primary-800">View all</Link>
        </div>
        <div className="space-y-3">
          {myOrders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
              <div>
                <p className="text-sm font-bold text-neutral-900">{order.orderNumber}</p>
                <p className="text-xs text-neutral-500">{order.customerName} · {formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getOrderStatusColor(order.status)}>{getOrderStatusLabel(order.status)}</Badge>
                <span className="text-sm font-bold text-neutral-900">{formatINR(order.total)}</span>
              </div>
            </div>
          ))}
          {myOrders.length === 0 && <p className="text-sm text-neutral-400 text-center py-4">No orders yet</p>}
        </div>
      </Card>
    </div>
  );
}
