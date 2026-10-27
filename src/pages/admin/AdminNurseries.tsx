import { useState } from 'react';
import { Store, CheckCircle2, XCircle, Search, Star, MapPin, Download } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDate } from '@/lib/utils';
import { prepareNurseriesExport, exportToCSV, exportToExcel, exportToPDF } from '@/lib/export';

export function AdminNurseriesPage() {
  const { nurseries, approveNursery, rejectNursery, deleteNursery, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approve' | 'reject' | 'delete' } | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf' | null>(null);

  const filtered = nurseries.filter((n) => {
    const matchesSearch = !search || n.name.toLowerCase().includes(search.toLowerCase()) || n.city.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || n.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleConfirm = () => {
    if (confirmAction) {
      if (confirmAction.action === 'approve') {
        approveNursery(confirmAction.id);
        showToast('Nursery approved');
      } else if (confirmAction.action === 'reject') {
        rejectNursery(confirmAction.id);
        showToast('Nursery rejected', 'error');
      } else if (confirmAction.action === 'delete') {
        deleteNursery(confirmAction.id);
        showToast('Nursery deleted', 'error');
      }
      setConfirmAction(null);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (filtered.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    try {
      const exportData = prepareNurseriesExport(filtered, format);
      if (format === 'csv') {
        exportToCSV(exportData);
      } else if (format === 'excel') {
        exportToExcel(exportData);
      } else if (format === 'pdf') {
        exportToPDF(exportData);
      }
      showToast(`Exported ${filtered.length} nurseries as ${format.toUpperCase()}`);
      setExportFormat(null);
    } catch (error: any) {
      showToast(`Export failed: ${error.message}`, 'error');
    }
  };

  const tabs = ['all', 'approved', 'pending', 'rejected'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">Nurseries</h2>
        <p className="text-sm text-neutral-500 mt-1">Manage and approve nursery sellers on the platform</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <Input placeholder="Search nurseries..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${filter === tab ? 'bg-primary-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === 'all' ? nurseries.length : nurseries.filter((n) => n.status === tab).length})
            </button>
          ))}
        </div>
        <div className="flex gap-2">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full">
            <div className="text-center py-16 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200">
              <Store size={48} className="text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-neutral-900 mb-2">
                {filter === 'pending' ? 'No pending nursery applications' : 
                 filter === 'approved' ? 'No approved nurseries yet' : 
                 filter === 'rejected' ? 'No rejected nurseries' :
                 'No nurseries registered yet'}
              </h3>
              <p className="text-sm text-neutral-500 max-w-md mx-auto">
                {filter === 'all' 
                  ? 'Nurseries will appear here once sellers register.' 
                  : `No nurseries found with status "${filter}".`}
              </p>
            </div>
          </div>
        ) : (
          filtered.map((nursery) => (
          <Card key={nursery.id} className="overflow-hidden">
            <div className="h-24 relative">
              <img src={nursery.profilePicture || nursery.banner || 'https://via.placeholder.com/400x150?text=Nursery'} alt={nursery.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3 -mt-10 mb-2">
                <div className="w-12 h-12 rounded-xl border-2 border-white shadow-lg overflow-hidden bg-white shrink-0">
                  <img src={nursery.logo} alt={nursery.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 pt-2">
                  <p className="font-bold text-neutral-900">{nursery.name}</p>
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <MapPin size={11} /> {nursery.city}, {nursery.state}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  <Star size={13} className="text-accent-500 fill-accent-500" />
                  <span className="text-sm font-bold">{nursery.rating}</span>
                </div>
                <Badge className={nursery.status === 'approved' ? 'bg-primary-100 text-primary-700' : nursery.status === 'pending' ? 'bg-accent-100 text-accent-700' : 'bg-red-100 text-red-700'}>
                  {nursery.status}
                </Badge>
                <span className="text-xs text-neutral-400 ml-auto">Joined {formatDate(nursery.joinedDate)}</span>
              </div>
              <p className="text-xs text-neutral-500 mb-3 line-clamp-2">{nursery.description}</p>
              {nursery.status === 'pending' ? (
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => setConfirmAction({ id: nursery.id, action: 'approve' })}>
                    <CheckCircle2 size={14} /> Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setConfirmAction({ id: nursery.id, action: 'reject' })}>
                    <XCircle size={14} /> Reject
                  </Button>
                </div>
              ) : nursery.status === 'approved' ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setConfirmAction({ id: nursery.id, action: 'reject' })}>
                    <XCircle size={14} /> Suspend
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setConfirmAction({ id: nursery.id, action: 'delete' })}>
                    Delete
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => setConfirmAction({ id: nursery.id, action: 'approve' })}>
                    <CheckCircle2 size={14} /> Re-approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setConfirmAction({ id: nursery.id, action: 'delete' })}>
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))
        )}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={
          confirmAction?.action === 'approve' ? 'Approve this nursery?' : 
          confirmAction?.action === 'reject' ? 'Reject this nursery?' : 
          'Delete this nursery?'
        }
        message={
          confirmAction?.action === 'approve' ? 'The nursery will be able to sell plants on the platform.' : 
          confirmAction?.action === 'reject' ? 'The nursery will no longer be able to sell on the platform.' :
          'This action will permanently delete the nursery from the database. This cannot be undone.'
        }
        confirmLabel={confirmAction?.action === 'approve' ? 'Approve' : confirmAction?.action === 'reject' ? 'Reject' : 'Delete'}
        danger={confirmAction?.action === 'reject' || confirmAction?.action === 'delete'}
      />
    </div>
  );
}
