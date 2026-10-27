import { useMemo, useState } from 'react';
import { TrendingUp, IndianRupee, ShoppingBag, Star, Download, AlertCircle } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateRangeFilter, type DateRange } from '@/components/ui/DateRangeFilter';
import { formatINR, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { prepareOrdersExport, exportToCSV, exportToExcel, exportToPDF } from '@/lib/export';

export function SalesPage() {
  const { orders, nurseries, user, inventory, showToast } = useApp();
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf' | null>(null);
  
  // Find seller's nursery - prioritize approved ones
  const myNursery = nurseries
    .filter((n) => n.sellerUID === user?.id)
    .sort((a, b) => {
      if (a.status === 'approved' && b.status !== 'approved') return -1;
      if (a.status !== 'approved' && b.status === 'approved') return 1;
      return 0;
    })[0];

  const myOrders = myNursery ? orders.filter((o) => o.nurseryId === myNursery.id) : [];

  // Filter by date range
  const filteredOrders = useMemo(() => {
    if (!dateRange) return myOrders;
    return myOrders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
    });
  }, [myOrders, dateRange]);

  const completed = filteredOrders.filter((o) => o.status === 'delivered');
  const pending = filteredOrders.filter((o) => o.status === 'pending');
  const totalRevenue = completed.reduce((s, o) => s + o.total, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / (completed.length || 1) : 0;

  // Calculate actual monthly data from filtered orders
  const monthlyData = useMemo(() => {
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    
    return months.map((m, i) => {
      const monthOrders = filteredOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        const monthDiff = (now.getMonth() - orderDate.getMonth() + 12) % 12;
        return monthDiff === (5 - i);
      });
      
      return {
        month: m,
        revenue: monthOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0),
      };
    });
  }, [filteredOrders]);
  const maxRev = Math.max(...monthlyData.map((d) => d.revenue), 1);

  // Top selling plants
  const plantSales = useMemo(() => {
    const sales = new Map<string, { name: string; qty: number; revenue: number }>();
    completed.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.plantName;
        const existing = sales.get(key) || { name: item.plantName, qty: 0, revenue: 0 };
        existing.qty += item.quantity;
        existing.revenue += item.subtotal;
        sales.set(key, existing);
      });
    });
    return Array.from(sales.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [completed]);

  // Low stock inventory
  const lowStockItems = useMemo(() => {
    if (!myNursery) return [];
    return inventory
      .filter((inv) => inv.nurseryId === myNursery.id && inv.quantity < 10)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);
  }, [inventory, myNursery]);

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (filteredOrders.length === 0) {
      showToast('No order data to export', 'error');
      return;
    }

    try {
      const exportData = prepareOrdersExport(filteredOrders, format);
      if (format === 'csv') exportToCSV(exportData);
      else if (format === 'excel') exportToExcel(exportData);
      else if (format === 'pdf') exportToPDF(exportData);
      showToast(`Exported ${filteredOrders.length} orders as ${format.toUpperCase()}`);
      setExportFormat(null);
    } catch (error: any) {
      showToast(`Export failed: ${error.message}`, 'error');
    }
  };

  if (!myNursery) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Sales & Analytics</h2>
          <p className="text-sm text-neutral-500 mt-1">Track your revenue and best-selling plants</p>
        </div>
        <Card className="p-8 text-center">
          <ShoppingBag size={48} className="text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">No nursery found. Please register your nursery first.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">Sales & Analytics</h2>
        <p className="text-sm text-neutral-500 mt-1">Track your revenue and best-selling plants</p>
      </div>

      {/* Date Range Filter */}
      <Card className="p-5">
        <h3 className="font-bold text-neutral-900 mb-4">Date Range</h3>
        <DateRangeFilter onDateRangeChange={setDateRange} />
        {dateRange && (
          <p className="text-xs text-neutral-500 mt-3">
            Showing data from {dateRange.startDate.toLocaleDateString('en-IN')} to {dateRange.endDate.toLocaleDateString('en-IN')}
          </p>
        )}
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Revenue" value={formatINR(totalRevenue)} icon={<IndianRupee size={20} />} color="primary" />
        <KpiCard label="Completed Orders" value={completed.length} icon={<ShoppingBag size={20} />} color="blue" />
        <KpiCard label="Avg Order Value" value={formatINR(Math.round(avgOrderValue))} icon={<TrendingUp size={20} />} color="accent" />
        <KpiCard label="Pending Orders" value={pending.length} icon={<Star size={20} />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <Card className="p-5">
          <h3 className="font-bold text-neutral-900 mb-4">Monthly Revenue</h3>
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

        {/* Top plants */}
        <Card className="p-5">
          <h3 className="font-bold text-neutral-900 mb-4">Top Selling Plants</h3>
          {plantSales.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {plantSales.map((plant, idx) => (
                <div key={plant.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-900">{plant.name}</p>
                    <p className="text-xs text-neutral-500">{plant.qty} sold</p>
                  </div>
                  <span className="text-sm font-bold text-neutral-900">{formatINR(plant.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="p-4 border-l-4 border-accent-500 bg-accent-50">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-accent-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-neutral-900 text-sm">Low Stock Alert</p>
              <p className="text-xs text-neutral-600 mt-1">{lowStockItems.length} items have stock below 10 units</p>
            </div>
          </div>
        </Card>
      )}

      {/* Sales table */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="font-bold text-neutral-900">All Sales</h3>
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExportFormat(exportFormat ? null : 'csv')}
              className="gap-2"
            >
              <Download size={16} /> Export
            </Button>
            {exportFormat && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => handleExport('csv')}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 border-b border-neutral-100"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 border-b border-neutral-100"
                >
                  Export as Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-50"
                >
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Order</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Date</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Customer</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Status</th>
                <th className="text-right text-xs font-bold text-neutral-500 uppercase px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-500 text-sm">
                    No orders in the selected date range
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm font-semibold text-neutral-900">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-sm text-neutral-500">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{order.customerName}</td>
                    <td className="px-4 py-3"><Badge className={getOrderStatusColor(order.status)}>{getOrderStatusLabel(order.status)}</Badge></td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-neutral-900">{formatINR(order.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
