import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, CheckCircle2, TrendingUp, AlertCircle, ArrowRight, Leaf } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatINR, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';

export function CustomerDashboardPage() {
  const { user, orders, complaints, cartCount } = useApp();

  // Filter orders for current customer only
  const myOrders = useMemo(() => {
    if (!user) return [];
    return orders.filter((o) => o.customerId === user.id);
  }, [orders, user]);

  // Filter complaints for current customer only
  const myComplaints = useMemo(() => {
    if (!user) return [];
    return complaints.filter((c) => c.customerId === user.id);
  }, [complaints, user]);

  // Calculate KPIs
  const totalOrders = myOrders.length;
  const pendingOrders = myOrders.filter((o) => o.status === 'pending').length;
  const completedOrders = myOrders.filter((o) => o.status === 'delivered').length;
  const totalSpent = myOrders.reduce((sum, o) => sum + o.total, 0);
  const openComplaints = myComplaints.filter((c) => c.status === 'open').length;

  // Get recent orders
  const recentOrders = myOrders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header with Welcome */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
          <Leaf size={32} className="text-primary-600 dark:text-primary-300" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Welcome back, {user?.name?.split(' ')[0] || 'Customer'}!</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {totalOrders === 0
              ? "Let's get started! Browse our plant collection and make your first purchase."
              : `You have ${totalOrders} order${totalOrders !== 1 ? 's' : ''} so far. Happy gardening!`}
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Total Orders" value={totalOrders} icon={<Package size={20} />} color="primary" />
        <KpiCard label="Pending Orders" value={pendingOrders} icon={<AlertCircle size={20} />} color="accent" />
        <KpiCard label="Completed Orders" value={completedOrders} icon={<CheckCircle2 size={20} />} color="primary" />
        <KpiCard label="Total Spent" value={totalSpent > 0 ? formatINR(totalSpent) : '₹0'} icon={<TrendingUp size={20} />} color="blue" />
        <KpiCard label="Cart Items" value={cartCount} icon={<ShoppingCart size={20} />} color="primary" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200 dark:border-primary-800">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Start Shopping</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Browse our collection of plants and add to cart</p>
            </div>
            <Leaf size={24} className="text-primary-600 dark:text-primary-400" />
          </div>
          <Link to="/customer/browse-plants">
            <Button size="sm" className="w-full">Explore Plants</Button>
          </Link>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-accent-50 to-accent-100/50 dark:from-accent-900/20 dark:to-accent-800/20 border-accent-200 dark:border-accent-800">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100">My Cart</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{cartCount} item{cartCount !== 1 ? 's' : ''} waiting for checkout</p>
            </div>
            <ShoppingCart size={24} className="text-accent-600 dark:text-accent-400" />
          </div>
          <Link to="/customer/my-cart">
            <Button size="sm" className="w-full" variant={cartCount === 0 ? 'outline' : 'default'}>
              {cartCount === 0 ? 'Browse Plants' : 'View Cart'}
            </Button>
          </Link>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100">My Orders</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">View and track your purchases</p>
            </div>
            <Package size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <Link to="/customer/my-orders">
            <Button size="sm" className="w-full">View Orders</Button>
          </Link>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Complaints</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{openComplaints} open issue{openComplaints !== 1 ? 's' : ''}</p>
            </div>
            <AlertCircle size={24} className="text-amber-600 dark:text-amber-400" />
          </div>
          <Link to="/customer/my-complaints">
            <Button size="sm" className="w-full">View Complaints</Button>
          </Link>
        </Card>
      </div>

      {/* Recent Orders */}
      {totalOrders > 0 ? (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Recent Orders</h3>
            <Link to="/customer/my-orders" className="text-sm font-semibold text-primary-700 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">View all</Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                <div>
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{order.orderNumber}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getOrderStatusColor(order.status)}>{getOrderStatusLabel(order.status)}</Badge>
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{formatINR(order.total)}</span>
                  <Link to={`/customer/my-orders/${order.id}`} className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">No Orders Yet</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
            Start shopping for plants! Browse our collection of verified plants from trusted nurseries.
          </p>
          <Link to="/customer/browse-plants">
            <Button size="lg">
              <Leaf size={18} /> Explore Plants
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
