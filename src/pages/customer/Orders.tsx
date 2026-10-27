import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle2, Truck, XCircle, Star, SlidersHorizontal, Download } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { formatINR, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DateRangeFilter, type DateRange } from '@/components/ui/DateRangeFilter';
import { prepareOrdersExport, exportToCSV, exportToExcel, exportToPDF } from '@/lib/export';

export function OrdersPage() {
  const { orders, reviews, user, showToast } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf' | null>(null);

  const myOrders = orders.filter((o) => o.customerId === (user?.id || 'cust1'));

  // Apply filters
  const filteredOrders = useMemo(() => {
    let result = [...myOrders];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }

    // Date range filter
    if (dateRange) {
      result = result.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
      });
    }

    return result;
  }, [myOrders, statusFilter, dateRange]);

  const reviewedOrderIds = new Set(reviews.map((r) => r.orderId).filter(Boolean));

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

  const tabs = ['all', 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

  if (myOrders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <EmptyState
          icon={<Package size={28} />}
          title="No orders yet"
          description="When you place an order, it will appear here so you can track its status."
          action={<Link to="/plants" className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold">Browse Plants</Link>}
        />
      </div>
    );
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'confirmed':
      case 'packed': return <Package size={16} />;
      case 'shipped': return <Truck size={16} />;
      case 'delivered': return <CheckCircle2 size={16} />;
      case 'cancelled':
      case 'rejected': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">My Orders</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden gap-2"
          >
            <SlidersHorizontal size={16} /> Filters
          </Button>
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
      </div>

      {/* Filter section */}
      {showFilters && (
        <Card className="p-5 mb-6 lg:hidden">
          <h3 className="font-bold text-neutral-900 mb-4">Filters</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-neutral-900 mb-2 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Statuses</option>
                {tabs.filter((t) => t !== 'all').map((tab) => (
                  <option key={tab} value={tab}>{getOrderStatusLabel(tab)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-neutral-900 mb-2 block">Date Range</label>
              <DateRangeFilter onDateRangeChange={setDateRange} />
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={() => setShowFilters(false)}
            >
              Done
            </Button>
          </div>
        </Card>
      )}

      {/* Desktop filters */}
      <div className="hidden lg:flex gap-2 overflow-x-auto scrollbar-hide mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              statusFilter === tab
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {tab === 'all' ? 'All Orders' : getOrderStatusLabel(tab)} ({tab === 'all' ? myOrders.length : myOrders.filter((o) => o.status === tab).length})
          </button>
        ))}
      </div>

      {/* Date range display */}
      {dateRange && (
        <div className="mb-4 text-sm text-neutral-600">
          Showing orders from {dateRange.startDate.toLocaleDateString('en-IN')} to {dateRange.endDate.toLocaleDateString('en-IN')}
        </div>
      )}

      {/* Orders list */}
      {filteredOrders.length === 0 ? (
        <Card className="p-8 text-center">
          <Package size={48} className="text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">
            {statusFilter !== 'all' || dateRange
              ? 'No orders match your filters. Try adjusting them.'
              : 'No orders found'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isDelivered = order.status === 'delivered';
            const alreadyReviewed = reviewedOrderIds.has(order.id);

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-neutral-200 card-shadow overflow-hidden">
                <Link to={`/customer/my-orders/${order.id}`} className="block hover:bg-neutral-50 transition-colors p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-neutral-900">{order.orderNumber}</p>
                        <Badge className={getOrderStatusColor(order.status)}>
                          {statusIcon(order.status)} {getOrderStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-500 mt-1">Placed on {formatDate(order.createdAt)} · {order.nurseryName}</p>
                    </div>
                    <p className="text-lg font-bold text-neutral-900">{formatINR(order.total)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {order.items.slice(0, 4).map((item) => (
                      <div key={item.id} className="flex items-center gap-2 bg-neutral-50 rounded-lg p-2 pr-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                          <img src={item.plantImage} alt={item.plantName} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{item.plantName}</p>
                          <p className="text-xs text-neutral-500">{item.quantity} × {formatINR(item.price)}</p>
                        </div>
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <span className="text-sm text-neutral-500">+{order.items.length - 4} more</span>
                    )}
                  </div>
                </Link>

                {/* ⭐ Rate CTA for delivered, unreviewed orders */}
                {isDelivered && !alreadyReviewed && (
                  <div className="border-t border-amber-100 bg-amber-50 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} className="text-amber-400 fill-amber-400" />)}
                      </div>
                      <p className="text-sm font-semibold text-amber-800">Your order has been delivered! Share your experience.</p>
                    </div>
                    <Link
                      to={`/customer/my-orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-amber-900 font-semibold text-sm px-4 py-1.5 rounded-lg transition-colors shrink-0"
                    >
                      <Star size={14} /> Rate
                    </Link>
                  </div>
                )}

                {/* Already reviewed badge */}
                {isDelivered && alreadyReviewed && (
                  <div className="border-t border-green-100 bg-green-50 px-5 py-2.5 flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-green-600" />
                    <p className="text-sm text-green-700 font-medium">You've reviewed this order.</p>
                    <Link to={`/customer/my-orders/${order.id}`} className="text-sm text-primary-600 hover:underline font-medium ml-auto">Edit review</Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
