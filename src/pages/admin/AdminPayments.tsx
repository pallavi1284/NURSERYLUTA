import { useState } from 'react';
import { IndianRupee, CreditCard, Wallet, Landmark, TrendingUp } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatINR, formatDate } from '@/lib/utils';

export function AdminPaymentsPage() {
  const { orders } = useApp();
  const [filter, setFilter] = useState('all');

  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
  const totalRevenue = paidOrders.reduce((s, o) => s + o.total, 0);
  const platformFee = Math.round(totalRevenue * 0.05);
  const nurseryPayout = totalRevenue - platformFee;

  const byMethod = paidOrders.reduce((acc, o) => {
    acc[o.paymentMethod] = (acc[o.paymentMethod] || 0) + o.total;
    return acc;
  }, {} as Record<string, number>);

  const filtered = filter === 'all' ? paidOrders : paidOrders.filter((o) => o.paymentMethod === filter);
  const methods = ['all', 'UPI', 'Card', 'NetBanking', 'COD'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">Payments</h2>
        <p className="text-sm text-neutral-500 mt-1">Track payment transactions and platform revenue</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Payments" value={formatINR(totalRevenue)} icon={<IndianRupee size={20} />} color="primary" />
        <KpiCard label="Platform Fee (5%)" value={formatINR(platformFee)} icon={<TrendingUp size={20} />} color="accent" />
        <KpiCard label="Nursery Payouts" value={formatINR(nurseryPayout)} icon={<Wallet size={20} />} color="blue" />
        <KpiCard label="Transactions" value={paidOrders.length} icon={<CreditCard size={20} />} color="purple" />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {methods.map((m) => (
          <button key={m} onClick={() => setFilter(m)} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${filter === m ? 'bg-primary-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
            {m === 'all' ? 'All Methods' : m}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Order</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Date</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Customer</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Nursery</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Method</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Status</th>
                <th className="text-right text-xs font-bold text-neutral-500 uppercase px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-sm font-semibold text-neutral-900">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{order.customerName}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{order.nurseryName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {order.paymentMethod === 'UPI' && <Wallet size={14} className="text-neutral-400" />}
                      {order.paymentMethod === 'Card' && <CreditCard size={14} className="text-neutral-400" />}
                      {order.paymentMethod === 'NetBanking' && <Landmark size={14} className="text-neutral-400" />}
                      {order.paymentMethod === 'COD' && <IndianRupee size={14} className="text-neutral-400" />}
                      <span className="text-sm text-neutral-600">{order.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge className="bg-primary-100 text-primary-700">{order.paymentStatus}</Badge></td>
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
