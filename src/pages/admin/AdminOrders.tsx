import { useState } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatINR, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';

export function AdminOrdersPage() {
  const { orders } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = orders.filter((o) => {
    const matchesSearch = !search || o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || o.status === filter;
    return matchesSearch && matchesFilter;
  });

  const tabs = ['all', 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">All Orders</h2>
        <p className="text-sm text-neutral-500 mt-1">{orders.length} total orders on the platform</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)} className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${filter === tab ? 'bg-primary-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
              {tab === 'all' ? 'All' : getOrderStatusLabel(tab)}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Order</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Customer</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Nursery</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Date</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Status</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Payment</th>
                <th className="text-right text-xs font-bold text-neutral-500 uppercase px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-sm font-semibold text-neutral-900">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{order.customerName}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{order.nurseryName}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3"><Badge className={getOrderStatusColor(order.status)}>{getOrderStatusLabel(order.status)}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge className={order.paymentStatus === 'paid' ? 'bg-primary-100 text-primary-700' : 'bg-accent-100 text-accent-700'}>
                      {order.paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-neutral-900">{formatINR(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
