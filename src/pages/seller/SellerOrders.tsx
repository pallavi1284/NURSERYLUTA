import { useState } from 'react';
import { Clock, CheckCircle2, Package, Truck, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatINR, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import type { OrderStatus } from '@/types';

export function SellerOrdersPage() {
  const { orders, updateOrderStatus, showToast, nurseries, user } = useApp();
  const [filter, setFilter] = useState<string>('all');
  const [actionOrder, setActionOrder] = useState<{ id: string; action: OrderStatus } | null>(null);

  // Find seller's nursery - prioritize approved ones
  const myNursery = nurseries
    .filter((n) => n.sellerUID === user?.id)
    .sort((a, b) => {
      // Approved nurseries come first
      if (a.status === 'approved' && b.status !== 'approved') return -1;
      if (a.status !== 'approved' && b.status === 'approved') return 1;
      return 0;
    })[0];
  
  if (!myNursery) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">No Nursery Found</h2>
          <p className="text-sm text-neutral-500 mb-6">
            Please register your nursery first to view orders.
          </p>
          <Link to="/seller/my-nursery">
            <Button size="lg">Register Nursery</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const myOrders = orders.filter((o) => 
    o.nurseryId === myNursery.id && o.sellerUid === user?.id
  );
  const filtered = filter === 'all' ? myOrders : myOrders.filter((o) => o.status === filter);

  const statusActions: { status: OrderStatus; label: string; icon: typeof Clock }[] = [
    { status: 'confirmed', label: 'Confirm', icon: CheckCircle2 },
    { status: 'packed', label: 'Pack', icon: Package },
    { status: 'shipped', label: 'Ship', icon: Truck },
    { status: 'delivered', label: 'Deliver', icon: CheckCircle2 },
  ];

  const getNextAction = (currentStatus: string) => {
    const order: string[] = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
    const idx = order.indexOf(currentStatus);
    if (idx < 0 || idx >= order.length - 1) return null;
    return statusActions[idx];
  };

  const handleAction = () => {
    if (actionOrder) {
      updateOrderStatus(actionOrder.id, actionOrder.action);
      showToast(`Order ${getOrderStatusLabel(actionOrder.action)}`);
      setActionOrder(null);
    }
  };

  const tabs = ['all', 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">Orders</h2>
        <p className="text-sm text-neutral-500 mt-1">Manage and track customer orders for your nursery</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${filter === tab ? 'bg-primary-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
          >
            {tab === 'all' ? 'All Orders' : getOrderStatusLabel(tab)} ({tab === 'all' ? myOrders.length : myOrders.filter((o) => o.status === tab).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-neutral-400">No orders in this category</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const nextAction = getNextAction(order.status);
            return (
              <Card key={order.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-neutral-900">{order.orderNumber}</p>
                      <Badge className={getOrderStatusColor(order.status)}>{getOrderStatusLabel(order.status)}</Badge>
                    </div>
                    <p className="text-sm text-neutral-500">{order.customerName} · {formatDate(order.createdAt)}</p>
                    <div className="mt-3 space-y-1.5">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                            <img src={item.plantImage} alt={item.plantName} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-neutral-700">{item.plantName} ({item.variety})</span>
                          <span className="text-neutral-400">× {item.quantity}</span>
                          <span className="font-semibold text-neutral-900">{formatINR(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-lg font-bold text-neutral-900">{formatINR(order.total)}</p>
                    <p className="text-xs text-neutral-500 mb-3">{order.paymentMethod} · {order.paymentStatus}</p>
                    {nextAction && order.status !== 'cancelled' && order.status !== 'rejected' && (
                      <div className="flex gap-2 sm:justify-end">
                        <Button size="sm" onClick={() => setActionOrder({ id: order.id, action: nextAction.status })}>
                          <nextAction.icon size={14} /> {nextAction.label}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setActionOrder({ id: order.id, action: 'rejected' })}>
                          <XCircle size={14} /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!actionOrder}
        onClose={() => setActionOrder(null)}
        onConfirm={handleAction}
        title={actionOrder?.action === 'rejected' ? 'Reject this order?' : `Mark order as ${actionOrder ? getOrderStatusLabel(actionOrder.action) : ''}?`}
        message={actionOrder?.action === 'rejected' ? 'The customer will be notified that their order was rejected.' : 'This will update the order status and notify the customer.'}
        confirmLabel={actionOrder?.action === 'rejected' ? 'Reject' : 'Confirm'}
        danger={actionOrder?.action === 'rejected'}
      />
    </div>
  );
}
