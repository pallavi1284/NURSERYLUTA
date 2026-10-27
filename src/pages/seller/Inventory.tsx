import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Package, RefreshCw, Eye, Minus } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { formatINR, getStockStatus, DEFAULT_PLANT_IMAGE } from '@/lib/utils';

// Stock update modal
function StockUpdateModal({
  open,
  onClose,
  item,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  item: { id: string; quantity: number; plant?: { name: string; variety: string } };
  onSave: (newQty: number) => void;
}) {
  const [mode, setMode] = useState<'add' | 'reduce' | 'set'>('add');
  const [delta, setDelta] = useState('');
  const [newAbsolute, setNewAbsolute] = useState(item.quantity.toString());

  const previewQty = () => {
    if (mode === 'set') return Math.max(0, Number(newAbsolute) || 0);
    const d = Number(delta) || 0;
    if (mode === 'add') return item.quantity + d;
    return Math.max(0, item.quantity - d);
  };

  const handleSave = () => {
    onSave(previewQty());
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Update Stock">
      <div className="space-y-5">
        <div>
          <p className="text-sm text-neutral-500">Plant</p>
          <p className="font-bold text-neutral-900">{item.plant?.name} <span className="text-neutral-500 font-normal">({item.plant?.variety})</span></p>
        </div>

        {/* Current stock display */}
        <div className="bg-neutral-100 rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-500 mb-1">Current Stock</p>
          <p className="text-4xl font-bold text-neutral-900">{item.quantity}</p>
          <p className="text-xs text-neutral-500 mt-1">units</p>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2">
          {(['add', 'reduce', 'set'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-all capitalize ${
                mode === m
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400'
              }`}
            >
              {m === 'add' ? '+ Add' : m === 'reduce' ? '− Reduce' : '= Set'}
            </button>
          ))}
        </div>

        {mode === 'set' ? (
          <Input
            label="Set stock to"
            type="number"
            value={newAbsolute}
            onChange={(e) => setNewAbsolute(e.target.value)}
            min={0}
          />
        ) : (
          <div>
            <Input
              label={mode === 'add' ? 'Units to add' : 'Units to reduce'}
              type="number"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="e.g. 10"
              min={0}
            />
          </div>
        )}

        {/* Preview */}
        <div className={`flex items-center justify-between rounded-xl p-4 ${
          previewQty() > item.quantity ? 'bg-green-50 border border-green-200' :
          previewQty() < item.quantity ? 'bg-red-50 border border-red-200' :
          'bg-neutral-50 border border-neutral-200'
        }`}>
          <span className="text-sm font-medium text-neutral-600">New Stock</span>
          <span className={`text-xl font-bold ${
            previewQty() > item.quantity ? 'text-green-700' :
            previewQty() < item.quantity ? 'text-red-600' :
            'text-neutral-700'
          }`}>
            {previewQty()} units
          </span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" fullWidth onClick={onClose}>Cancel</Button>
          <Button fullWidth onClick={handleSave}>Save Stock</Button>
        </div>
      </div>
    </Modal>
  );
}

export function InventoryPage() {
  const { plants, inventory, nurseries, user, updateInventoryItem, deleteInventoryItem, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [stockModalItem, setStockModalItem] = useState<any | null>(null);

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
            Please register your nursery first to manage inventory.
          </p>
          <Link to="/seller/my-nursery">
            <Button size="lg">Register Nursery</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const myInventory = inventory.filter((inv) => inv.nurseryId === myNursery.id);

  const items = useMemo(() => {
    return myInventory
      .map((inv) => {
        const plant = plants.find((p) => p.id === inv.plantId);
        return { ...inv, plant };
      })
      .filter((item) => item.status !== 'archived')
      .filter((item) => !search || item.plant?.name.toLowerCase().includes(search.toLowerCase()) || item.plant?.variety.toLowerCase().includes(search.toLowerCase()));
  }, [myInventory, plants, search]);

  const handleDelete = () => {
    if (confirmDelete) {
      updateInventoryItem(confirmDelete, { status: 'archived' });
      showToast('Plant archived. It will no longer be visible to customers.');
      setConfirmDelete(null);
    }
  };

  const handleStockSave = (id: string, newQty: number) => {
    updateInventoryItem(id, { quantity: newQty });
    showToast(`Stock updated to ${newQty} units`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Inventory</h2>
          <p className="text-sm text-neutral-500 mt-1">{items.length} active plants in your inventory</p>
        </div>
        <Link to="/seller/inventory/add"><Button><Plus size={18} /> Add Plant</Button></Link>
      </div>

      <div className="max-w-md">
        <Input placeholder="Search your plants..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} />
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<Package size={28} />} title="No plants in inventory" description="Add plants to your inventory to start selling." action={<Link to="/seller/inventory/add"><Button>Add Your First Plant</Button></Link>} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Plant</th>
                  <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">SKU</th>
                  <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Price (₹)</th>
                  <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Stock</th>
                  <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Status</th>
                  <th className="text-right text-xs font-bold text-neutral-500 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((item) => {
                  const stock = getStockStatus(item.quantity);
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                            <img
                              src={item.plant?.image || DEFAULT_PLANT_IMAGE}
                              alt={item.plant?.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_PLANT_IMAGE;
                              }}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-neutral-900">{item.plant?.name}</p>
                            <p className="text-xs text-neutral-500">{item.plant?.variety}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500">{item.sku}</td>
                      <td className="px-4 py-3 text-sm font-bold text-neutral-900">{formatINR(item.price)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-neutral-900">{item.quantity}</span>
                          <span className="text-xs text-neutral-500">units</span>
                          <button
                            onClick={() => setStockModalItem(item)}
                            title="Update stock"
                            className="text-primary-600 hover:bg-primary-50 p-1 rounded transition-colors"
                          >
                            <RefreshCw size={13} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={stock.color}>{stock.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Link to={`/plants/${item.plantId}`} title="View on site" className="text-primary-600 hover:bg-primary-50 px-2 py-1 rounded text-xs font-medium">
                            <Eye size={15} />
                          </Link>
                          <Link to={`/seller/inventory/${item.id}`} title="Edit plant" className="text-neutral-500 hover:text-primary-600 hover:bg-primary-50 p-1.5 rounded-lg transition-colors">
                            <Pencil size={15} />
                          </Link>
                          <button
                            onClick={() => setStockModalItem(item)}
                            title="Update stock"
                            className="text-neutral-500 hover:text-primary-600 hover:bg-primary-50 p-1.5 rounded-lg transition-colors"
                          >
                            <RefreshCw size={15} />
                          </button>
                          <button onClick={() => setConfirmDelete(item.id)} title="Archive plant" className="text-neutral-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Stock Update Modal */}
      {stockModalItem && (
        <StockUpdateModal
          open={!!stockModalItem}
          onClose={() => setStockModalItem(null)}
          item={stockModalItem}
          onSave={(newQty) => handleStockSave(stockModalItem.id, newQty)}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Archive this plant?"
        message="This plant will no longer be visible to customers. Existing orders will not be affected. You can restore it from your archived plants."
        confirmLabel="Archive"
        danger
      />
    </div>
  );
}
