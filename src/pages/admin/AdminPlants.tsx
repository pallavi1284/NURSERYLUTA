import { useState, useMemo } from 'react';
import { Search, Package, Trash2, SlidersHorizontal, X, Download } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatINR, getStockStatus, DEFAULT_PLANT_IMAGE } from '@/lib/utils';
import { preparePlantsExport, exportToCSV, exportToExcel, exportToPDF } from '@/lib/export';

export function AdminPlantsPage() {
  const { plants, inventory, nurseries, deletePlant, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [nurseryFilter, setNurseryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf' | null>(null);

  // Get unique categories
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(plants.map(p => p.categoryId).filter(Boolean))).sort();
  }, [plants]);

  const enriched = plants.map((p) => {
    const plantInv = inventory.filter((inv) => inv.plantId === p.id);
    const totalQty = plantInv.reduce((s, inv) => s + inv.quantity, 0);
    const minPrice = Math.min(...plantInv.map((inv) => inv.price).filter((p) => p > 0).concat([0]));
    const nurseryCount = new Set(plantInv.map((inv) => inv.nurseryId)).size;
    return { ...p, categoryName: p.categoryId, totalQty, minPrice, nurseryCount };
  });

  const filtered = useMemo(() => {
    return enriched.filter((p) => {
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.variety.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || p.categoryId === categoryFilter;
      const matchesNursery = !nurseryFilter || enriched.find(plant => plant.id === p.id)?.inventory?.some((inv: any) => inv.nurseryId === nurseryFilter);
      
      let matchesStock = true;
      if (stockFilter) {
        const status = getStockStatus(p.totalQty);
        matchesStock = status === stockFilter;
      }

      return matchesSearch && matchesCategory && matchesNursery && matchesStock;
    });
  }, [enriched, search, categoryFilter, nurseryFilter, stockFilter]);

  const handleDelete = () => {
    if (confirmDelete) {
      deletePlant(confirmDelete);
      showToast('Plant deleted');
      setConfirmDelete(null);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (filtered.length === 0) {
      showToast('No plants to export', 'error');
      return;
    }

    try {
      const exportData = preparePlantsExport(filtered, inventory, nurseries, format);
      if (format === 'csv') {
        exportToCSV(exportData);
      } else if (format === 'excel') {
        exportToExcel(exportData);
      } else if (format === 'pdf') {
        exportToPDF(exportData);
      }
      showToast(`Exported ${filtered.length} plants as ${format.toUpperCase()}`);
      setExportFormat(null);
    } catch (error: any) {
      showToast(`Export failed: ${error.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">All Plants</h2>
        <p className="text-sm text-neutral-500 mt-1">{filtered.length} plants across {uniqueCategories.length} categories</p>
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex-1 max-w-md">
          <Input placeholder="Search plants..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
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
                className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0"
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

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-bold text-neutral-900 mb-2 block">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-neutral-900 mb-2 block">Nursery</label>
              <select
                value={nurseryFilter}
                onChange={(e) => setNurseryFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Nurseries</option>
                {nurseries.filter((n) => n.status === 'approved').map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-neutral-900 mb-2 block">Stock Status</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            {(search || categoryFilter || nurseryFilter || stockFilter) && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('');
                    setNurseryFilter('');
                    setStockFilter('');
                  }}
                >
                  <X size={14} /> Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Plant</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Category</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Nurseries</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Min Price</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Total Stock</th>
                <th className="text-right text-xs font-bold text-neutral-500 uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {enriched.map((p) => {
                const stock = getStockStatus(p.totalQty);
                return (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                          <img
                            src={p.image || DEFAULT_PLANT_IMAGE}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_PLANT_IMAGE;
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900">{p.name}</p>
                          <p className="text-xs text-neutral-500">{p.variety}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{p.categoryName}</td>
                    <td className="px-4 py-3"><Badge className="bg-blue-50 text-blue-700">{p.nurseryCount}</Badge></td>
                    <td className="px-4 py-3 text-sm font-bold text-neutral-900">{p.minPrice > 0 ? formatINR(p.minPrice) : '-'}</td>
                    <td className="px-4 py-3">
                      <Badge className={stock.color}>{stock.label} ({p.totalQty})</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setConfirmDelete(p.id)} className="text-neutral-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete this plant?"
        message="This will permanently remove the plant and all its inventory entries. This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
