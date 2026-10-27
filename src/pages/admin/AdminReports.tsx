import { useState, useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateRangeFilter, type DateRange } from '@/components/ui/DateRangeFilter';
import { formatINR } from '@/lib/utils';
import { prepareNurseriesExport, preparePlantsExport, prepareOrdersExport, exportToCSV, exportToExcel, exportToPDF } from '@/lib/export';
import { IndianRupee, Store, Package, ShoppingBag, TrendingUp, Award, Download } from 'lucide-react';

export function AdminReportsPage() {
  const { nurseries, plants, orders, inventory, showToast } = useApp();
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf' | null>(null);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (!dateRange) return orders;
    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
    });
  }, [orders, dateRange]);

  const totalRevenue = filteredOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
  const platformFee = Math.round(totalRevenue * 0.05);
  const totalOrders = filteredOrders.length;
  const deliveredOrders = filteredOrders.filter((o) => o.status === 'delivered').length;

  // Nursery performance
  const nurseryPerf = useMemo(() => {
    return nurseries.map((n) => {
      const nOrders = filteredOrders.filter((o) => o.nurseryId === n.id);
      const nRevenue = nOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
      const nPlants = inventory.filter((inv) => inv.nurseryId === n.id).length;
      return { ...n, orderCount: nOrders.length, revenue: nRevenue, plantCount: nPlants };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [nurseries, filteredOrders, inventory]);

  // Category performance
  const catPerf = useMemo(() => {
    const categoryMap = new Map<string, { name: string; plantCount: number; stockCount: number; revenue: number }>();
    
    plants.forEach((p) => {
      const catId = p.categoryId;
      if (!catId) return;
      
      const catPlantIds = new Set(plants.filter((pp) => pp.categoryId === catId).map((pp) => pp.id));
      const catOrders = filteredOrders.filter((o) => 
        o.status === 'delivered' && o.items.some((item) => 
          catPlantIds.has(plants.find((plant) => plant.name === item.plantName)?.id || '')
        )
      );
      const catRevenue = catOrders.reduce((sum, order) => sum + order.total, 0);
      const catInventory = inventory.filter((inv) => catPlantIds.has(inv.plantId));
      
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          name: catId,
          plantCount: catPlantIds.size,
          stockCount: catInventory.reduce((s, inv) => s + inv.quantity, 0),
          revenue: catRevenue
        });
      }
    });
    
    return Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [plants, inventory, filteredOrders]);

  // Monthly data for date range
  const monthlyData = useMemo(() => {
    if (filteredOrders.length === 0) {
      return ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => ({ month: m, revenue: 0, orders: 0 }));
    }

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
        orders: monthOrders.length,
      };
    });
  }, [filteredOrders]);
  
  const maxRev = Math.max(...monthlyData.map((d) => d.revenue), 1);

  // Export handlers
  const handleExportNurseries = (format: 'csv' | 'excel' | 'pdf') => {
    if (nurseryPerf.length === 0) {
      showToast('No nursery data to export', 'error');
      return;
    }

    try {
      const exportData = prepareNurseriesExport(nurseryPerf, format);
      if (format === 'csv') exportToCSV(exportData);
      else if (format === 'excel') exportToExcel(exportData);
      else if (format === 'pdf') exportToPDF(exportData);
      showToast(`Exported ${nurseryPerf.length} nurseries as ${format.toUpperCase()}`);
      setExportFormat(null);
    } catch (error: any) {
      showToast(`Export failed: ${error.message}`, 'error');
    }
  };

  const handleExportOrders = (format: 'csv' | 'excel' | 'pdf') => {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">Reports & Analytics</h2>
        <p className="text-sm text-neutral-500 mt-1">Platform performance and insights</p>
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
        <KpiCard label="Gross Merchandise Value" value={formatINR(totalRevenue)} icon={<IndianRupee size={20} />} color="primary" />
        <KpiCard label="Platform Revenue (5%)" value={formatINR(platformFee)} icon={<TrendingUp size={20} />} color="accent" />
        <KpiCard label="Total Orders" value={totalOrders} icon={<ShoppingBag size={20} />} color="blue" />
        <KpiCard label="Delivered Orders" value={deliveredOrders} icon={<Package size={20} />} color="primary" />
      </div>

      {/* Revenue Trend */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-neutral-900">Revenue Trend</h3>
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExportFormat(exportFormat === 'orders' ? null : 'orders')}
              className="gap-2"
            >
              <Download size={16} /> Export Orders
            </Button>
            {exportFormat === 'orders' && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => handleExportOrders('csv')}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 border-b border-neutral-100"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExportOrders('excel')}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 border-b border-neutral-100"
                >
                  Export as Excel
                </button>
                <button
                  onClick={() => handleExportOrders('pdf')}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-50"
                >
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 h-56">
          {monthlyData.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-neutral-700">{formatINR(d.revenue)}</span>
              <div className="w-full bg-primary-100 rounded-t-lg flex items-end" style={{ height: '180px' }}>
                <div className="w-full bg-primary-600 rounded-t-lg" style={{ height: `${(d.revenue / maxRev) * 100}%` }} />
              </div>
              <span className="text-xs text-neutral-500">{d.month}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Nurseries */}
        {nurseryPerf.length > 0 ? (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-neutral-900 flex items-center gap-2"><Award size={18} /> Top Nurseries</h3>
              <div className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setExportFormat(exportFormat === 'nurseries' ? null : 'nurseries')}
                  className="gap-2"
                >
                  <Download size={14} />
                </Button>
                {exportFormat === 'nurseries' && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => handleExportNurseries('csv')}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 border-b border-neutral-100"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleExportNurseries('excel')}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 border-b border-neutral-100"
                    >
                      Excel
                    </button>
                    <button
                      onClick={() => handleExportNurseries('pdf')}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-50"
                    >
                      PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {nurseryPerf.slice(0, 5).map((n, idx) => (
                <div key={n.id} className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${idx < 3 ? 'bg-accent-100 text-accent-700' : 'bg-neutral-100 text-neutral-500'}`}>{idx + 1}</span>
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                    <img src={n.logo} alt={n.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neutral-900 truncate">{n.name}</p>
                    <p className="text-xs text-neutral-500">{n.orderCount} orders · {n.plantCount} plants</p>
                  </div>
                  <span className="text-sm font-bold text-neutral-900 shrink-0">{formatINR(n.revenue)}</span>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <Store size={48} className="text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No nursery data available</p>
          </Card>
        )}

        {/* Category Performance */}
        <Card className="p-5">
          <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><Package size={18} /> Category Performance</h3>
          {catPerf.length > 0 ? (
            <div className="space-y-3">
              {catPerf.slice(0, 5).map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-neutral-900 capitalize">{cat.name}</p>
                      <span className="text-xs text-neutral-500">{cat.plantCount} plants</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(cat.revenue / Math.max(...catPerf.map((c) => c.revenue), 1)) * 100}%` }} />
                    </div>
                    <p className="text-xs text-neutral-600 mt-1">{formatINR(cat.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 text-center py-4">No category data available</p>
          )}
        </Card>
      </div>
    </div>
  );
}
