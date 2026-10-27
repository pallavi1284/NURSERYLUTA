/**
 * Admin Complaints Management Panel
 * View, search, filter, and respond to all customer complaints
 */

import { useState, useMemo } from 'react';
import { Search, Filter, MessageSquare, AlertCircle, CheckCircle, Clock, Send } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import type { Complaint, ComplaintStatus, ComplaintCategory } from '@/types';

const complaintCategories: Array<{ value: ComplaintCategory; label: string }> = [
  { value: 'damaged_plant', label: '🌱 Damaged Plant' },
  { value: 'wrong_plant', label: '❌ Wrong Plant' },
  { value: 'missing_items', label: '📦 Missing Items' },
  { value: 'delivery_delay', label: '⏱️ Delivery Delay' },
  { value: 'payment_issue', label: '💳 Payment Issue' },
  { value: 'refund_request', label: '💰 Refund Request' },
  { value: 'other', label: '📝 Other' },
];

const complaintStatuses: Array<{ value: ComplaintStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'waiting_for_customer', label: 'Waiting for Customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

function getStatusIcon(status: ComplaintStatus) {
  switch (status) {
    case 'open':
      return <AlertCircle className="text-red-600" size={16} />;
    case 'under_review':
      return <Clock className="text-amber-600" size={16} />;
    case 'waiting_for_customer':
      return <Clock className="text-blue-600" size={16} />;
    case 'resolved':
      return <CheckCircle className="text-green-600" size={16} />;
    case 'rejected':
      return <AlertCircle className="text-red-600" size={16} />;
    default:
      return <MessageSquare size={16} />;
  }
}

function getStatusColor(status: ComplaintStatus) {
  switch (status) {
    case 'open':
      return 'bg-red-50 text-red-700';
    case 'under_review':
      return 'bg-amber-50 text-amber-700';
    case 'waiting_for_customer':
      return 'bg-blue-50 text-blue-700';
    case 'resolved':
      return 'bg-green-50 text-green-700';
    case 'rejected':
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-neutral-50 text-neutral-700';
  }
}

function getCategoryColor(category: ComplaintCategory) {
  const categoryColors: Record<ComplaintCategory, string> = {
    damaged_plant: 'bg-orange-50 text-orange-700',
    wrong_plant: 'bg-red-50 text-red-700',
    missing_items: 'bg-yellow-50 text-yellow-700',
    delivery_delay: 'bg-purple-50 text-purple-700',
    payment_issue: 'bg-pink-50 text-pink-700',
    refund_request: 'bg-indigo-50 text-indigo-700',
    other: 'bg-neutral-50 text-neutral-700',
  };
  return categoryColors[category];
}

export function AdminComplaintsPage() {
  const { complaints, orders, customers, nurseries, updateComplaint, addComplaintResponse, assignComplaintToSeller, addInternalNote, user, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [responseText, setResponseText] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [newStatus, setNewStatus] = useState<ComplaintStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        complaint.complaintId.toLowerCase().includes(searchLower) ||
        complaint.subject.toLowerCase().includes(searchLower) ||
        complaint.customerName.toLowerCase().includes(searchLower) ||
        complaint.description.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;

      // Category filter
      const matchesCategory = categoryFilter === 'all' || complaint.category === categoryFilter;

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || complaint.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [complaints, search, statusFilter, categoryFilter, priorityFilter]);

  const handleStatusUpdate = async (complaintId: string, newComplaintStatus: ComplaintStatus) => {
    setIsSubmitting(true);
    try {
      updateComplaint(complaintId, { status: newComplaintStatus });
      showToast(`Complaint status updated to ${newComplaintStatus}`, 'success');
      setNewStatus(null);
    } catch (error) {
      showToast('Failed to update complaint status', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddResponse = async () => {
    if (!selectedComplaint || !responseText.trim()) {
      showToast('Please enter a response', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      addComplaintResponse(selectedComplaint.id, {
        responderId: user?.id || 'admin',
        responderName: user?.name || 'Administrator',
        responderRole: 'admin',
        message: responseText,
        timestamp: new Date().toISOString(),
      });

      showToast('Response added successfully', 'success');
      setResponseText('');
      
      // Refresh the selected complaint
      const updated = complaints.find(c => c.id === selectedComplaint.id);
      if (updated) setSelectedComplaint(updated);
    } catch (error) {
      showToast('Failed to add response', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddInternalNote = async () => {
    if (!selectedComplaint || !internalNoteText.trim()) {
      showToast('Please enter a note', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      addInternalNote(selectedComplaint.id, internalNoteText);
      showToast('Internal note added successfully', 'success');
      setInternalNoteText('');
      
      // Refresh the selected complaint
      const updated = complaints.find(c => c.id === selectedComplaint.id);
      if (updated) setSelectedComplaint(updated);
    } catch (error) {
      showToast('Failed to add internal note', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignToSeller = async (complaintId: string, sellerId: string) => {
    setIsSubmitting(true);
    try {
      assignComplaintToSeller(complaintId, sellerId);
      showToast('Complaint assigned to seller successfully', 'success');
      
      // Refresh the selected complaint
      const updated = complaints.find(c => c.id === complaintId);
      if (updated) setSelectedComplaint(updated);
    } catch (error) {
      showToast('Failed to assign complaint', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    underReview: complaints.filter(c => c.status === 'under_review').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900">Complaint Management</h2>
        <p className="text-sm text-neutral-500 mt-1">
          View and manage customer complaints across all orders
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
          <p className="text-xs text-neutral-500 mt-1">Total Complaints</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.open}</p>
          <p className="text-xs text-neutral-500 mt-1">Open</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.underReview}</p>
          <p className="text-xs text-neutral-500 mt-1">Under Review</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          <p className="text-xs text-neutral-500 mt-1">Resolved</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search complaints by ID, subject, customer name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              showFilters
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            <Filter size={16} className="inline mr-1.5" /> Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {complaintStatuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>

            <Select
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {complaintCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>

            <Select
              label="Priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
        )}
      </Card>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No Complaints Found"
          description="No complaints match your current filters."
        />
      ) : (
        <div className="space-y-3">
          {filteredComplaints.map((complaint) => (
            <Card
              key={complaint.id}
              className="p-4 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedComplaint(complaint)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* ID and Category */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-neutral-600">
                      {complaint.complaintId}
                    </span>
                    <Badge variant="secondary" className={`text-xs ${getCategoryColor(complaint.category)}`}>
                      {complaintCategories.find(c => c.value === complaint.category)?.label}
                    </Badge>
                  </div>

                  {/* Subject */}
                  <h3 className="font-bold text-neutral-900 mb-1">{complaint.subject}</h3>

                  {/* Customer and Order Info */}
                  <div className="text-sm text-neutral-600 space-y-0.5">
                    <p>Customer: {complaint.customerName} ({complaint.customerEmail})</p>
                    {complaint.orderNumber && (
                      <p>Order: {complaint.orderNumber}</p>
                    )}
                    {complaint.nurseryName && (
                      <p>Nursery: {complaint.nurseryName}</p>
                    )}
                  </div>

                  {/* Description Preview */}
                  <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
                    {complaint.description}
                  </p>
                </div>

                {/* Status and Meta */}
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      complaint.status
                    )}`}
                  >
                    {getStatusIcon(complaint.status)}
                    {complaint.status.replace('_', ' ')}
                  </span>
                  <div className="text-xs text-neutral-500 text-right">
                    <p>{formatDate(complaint.createdAt)}</p>
                    <p>{complaint.responses.length} response{complaint.responses.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <Modal
          open={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={selectedComplaint.complaintId}
          size="lg"
        >
          <div className="space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Status and Category */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className={`text-xs ${getCategoryColor(selectedComplaint.category)}`}>
                {complaintCategories.find(c => c.value === selectedComplaint.category)?.label}
              </Badge>
              <Badge className={getStatusColor(selectedComplaint.status)}>
                {selectedComplaint.status.replace('_', ' ')}
              </Badge>
              {selectedComplaint.priority && (
                <Badge
                  className={
                    selectedComplaint.priority === 'high'
                      ? 'bg-red-50 text-red-700'
                      : selectedComplaint.priority === 'medium'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-green-50 text-green-700'
                  }
                >
                  {selectedComplaint.priority} Priority
                </Badge>
              )}
            </div>

            {/* Subject and Description */}
            <div>
              <h3 className="font-bold text-neutral-900 mb-2">{selectedComplaint.subject}</h3>
              <p className="text-sm text-neutral-700">{selectedComplaint.description}</p>
            </div>

            {/* Metadata */}
            <div className="bg-neutral-50 p-3 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Customer:</span>
                <span className="font-semibold">{selectedComplaint.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Email:</span>
                <span className="font-mono text-xs">{selectedComplaint.customerEmail}</span>
              </div>
              {selectedComplaint.nurseryName && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Nursery:</span>
                  <span className="font-semibold">{selectedComplaint.nurseryName}</span>
                </div>
              )}
              {selectedComplaint.orderNumber && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Related Order:</span>
                  <span className="font-mono">{selectedComplaint.orderNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-600">Created:</span>
                <span>{formatDate(selectedComplaint.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Updated:</span>
                <span>{formatDate(selectedComplaint.updatedAt)}</span>
              </div>
            </div>

            {/* Status Update */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Update Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {complaintStatuses.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusUpdate(selectedComplaint.id, s.value)}
                    disabled={isSubmitting || selectedComplaint.status === s.value}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 ${
                      selectedComplaint.status === s.value
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin: Assign to Seller */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Assign to Seller (Optional)
              </label>
              <Select
                value={selectedComplaint.assignedToSellerId || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    handleAssignToSeller(selectedComplaint.id, e.target.value);
                  }
                }}
              >
                <option value="">Select a seller to assign...</option>
                {nurseries.map((nursery) => (
                  <option key={nursery.sellerUID} value={nursery.sellerUID}>
                    {nursery.name} ({nursery.ownerName})
                  </option>
                ))}
              </Select>
              {selectedComplaint.assignedToSellerId && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                  ✓ Assigned to seller: {selectedComplaint.assignedToSellerId}
                </div>
              )}
            </div>

            {/* Admin: Internal Notes */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Internal Notes (Admin Only - Not visible to customers)
              </label>
              <Textarea
                placeholder="Add internal notes for other admins..."
                rows={2}
                value={internalNoteText || selectedComplaint.internalNotes || ''}
                onChange={(e) => setInternalNoteText(e.target.value)}
                disabled={isSubmitting}
              />
              {internalNoteText && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={handleAddInternalNote}
                  disabled={isSubmitting}
                >
                  Save Note
                </Button>
              )}
              {selectedComplaint.internalNotes && !internalNoteText && (
                <div className="mt-2 p-2 bg-amber-50 rounded text-sm text-amber-700">
                  <strong>Current note:</strong> {selectedComplaint.internalNotes}
                </div>
              )}
            </div>

            {/* Responses */}
            {selectedComplaint.responses.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-bold text-neutral-900 mb-3">
                  Conversation ({selectedComplaint.responses.length})
                </h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {selectedComplaint.responses.map((response, idx) => (
                    <div key={idx} className={`p-3 rounded-lg text-sm border-l-4 ${
                      response.responderRole === 'admin'
                        ? 'bg-purple-50 border-l-purple-500'
                        : response.responderRole === 'seller'
                        ? 'bg-blue-50 border-l-blue-500'
                        : 'bg-neutral-50 border-l-neutral-300'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-900">
                            {response.responderName}
                            {response.responderRole === 'admin' && (
                              <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                You (Admin)
                              </span>
                            )}
                            {response.responderRole === 'seller' && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                Seller
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500">
                          {new Date(response.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-neutral-700">{response.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Response */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Add Response
              </label>
              <Textarea
                placeholder="Type your response here..."
                rows={3}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                disabled={isSubmitting}
              />
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setSelectedComplaint(null)}
                  disabled={isSubmitting}
                >
                  Close
                </Button>
                <Button
                  fullWidth
                  onClick={handleAddResponse}
                  disabled={isSubmitting || !responseText.trim()}
                >
                  <Send size={16} className="mr-1.5" />
                  {isSubmitting ? 'Sending...' : 'Send Response'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
