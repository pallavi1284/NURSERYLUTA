/**
 * Customer Complaints page - view, manage and raise complaints
 */

import { useState } from 'react';
import { Plus, MessageSquare, AlertCircle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Complaint, ComplaintCategory, ComplaintStatus } from '@/types';

const complaintCategories: Array<{ value: ComplaintCategory; label: string }> = [
  { value: 'damaged_plant', label: '🌱 Damaged Plant' },
  { value: 'wrong_plant', label: '❌ Wrong Plant' },
  { value: 'missing_items', label: '📦 Missing Items' },
  { value: 'delivery_delay', label: '⏱️ Delivery Delay' },
  { value: 'payment_issue', label: '💳 Payment Issue' },
  { value: 'refund_request', label: '💰 Refund Request' },
  { value: 'other', label: '📝 Other' },
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

export function ComplaintsPage() {
  const { user, complaints, orders, nurseries, addComplaint, deleteComplaint, showToast } = useApp();
  const [showRaiseForm, setShowRaiseForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    category: 'other' as ComplaintCategory,
    subject: '',
    description: '',
    orderId: '',
    nurseryId: '',
  });

  const userComplaints = complaints.filter(c => c.customerId === user?.id);
  const userOrders = orders.filter(o => o.customerId === user?.id);
  
  // Get unique nurseries from customer's orders
  const availableNurseries = nurseries.filter(n => 
    userOrders.some(o => o.nurseryId === n.id)
  );

  const handleRaiseComplaint = () => {
    if (!formData.subject.trim() || !formData.description.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const selectedOrder = formData.orderId ? userOrders.find(o => o.id === formData.orderId) : undefined;
    const selectedNursery = formData.nurseryId ? nurseries.find(n => n.id === formData.nurseryId) : undefined;

    const complaintPayload: any = {
      customerId: user?.id || '',
      customerName: user?.name || '',
      customerEmail: user?.email || '',
      category: formData.category,
      subject: formData.subject,
      description: formData.description,
      status: 'open',
      priority: 'medium',
    };

    // Add order-related fields with complete data mapping
    if (formData.orderId && selectedOrder) {
      complaintPayload.orderId = formData.orderId;
      complaintPayload.orderNumber = selectedOrder.orderNumber;
      complaintPayload.nurseryId = selectedOrder.nurseryId;
      complaintPayload.nurseryName = selectedOrder.nurseryName;
      complaintPayload.sellerUid = selectedOrder.sellerUid;
    } else if (formData.nurseryId && selectedNursery) {
      // Associate with specific nursery even without an order
      complaintPayload.nurseryId = selectedNursery.id;
      complaintPayload.nurseryName = selectedNursery.name;
      complaintPayload.sellerUid = selectedNursery.sellerUID;
    } else {
      // For unassigned complaints, only set nurseryName so admin can identify them
      complaintPayload.nurseryName = 'Unassigned - General Complaint';
    }

    addComplaint(complaintPayload as Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'responses' | 'complaintId'>);

    showToast('Complaint raised successfully', 'success');
    setFormData({
      category: 'other',
      subject: '',
      description: '',
      orderId: '',
      nurseryId: '',
    });
    setShowRaiseForm(false);
  };

  const handleDeleteComplaint = (id: string) => {
    deleteComplaint(id);
    showToast('Complaint deleted', 'success');
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Complaints</h1>
          <p className="text-sm text-neutral-500 mt-1">Track and manage your complaints</p>
        </div>
        <Button onClick={() => setShowRaiseForm(true)} size="lg">
          <Plus size={18} /> Raise Complaint
        </Button>
      </div>

      {/* Complaints List */}
      {userComplaints.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={48} className="text-neutral-400" />}
          title="No Complaints Yet"
          description="You haven't raised any complaints. If you encounter any issues, please let us know."
          action={<Button onClick={() => setShowRaiseForm(true)}>Raise Your First Complaint</Button>}
        />
      ) : (
        <div className="grid gap-4">
          {userComplaints.map(complaint => (
            <Card key={complaint.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedComplaint(complaint)}>
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-600">{complaint.complaintId}</span>
                      <Badge variant="secondary" className="text-xs">
                        {complaintCategories.find(c => c.value === complaint.category)?.label}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-neutral-900 mt-1">{complaint.subject}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                      {getStatusIcon(complaint.status)}
                      {complaint.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Description Preview */}
                <p className="text-sm text-neutral-600 line-clamp-2">{complaint.description}</p>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <div>
                    {complaint.orderId && (
                      <span>Order: {complaint.orderNumber}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <span>Created: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                    <span>{complaint.responses.length} response{complaint.responses.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Raise Complaint Modal */}
      <Modal open={showRaiseForm} onClose={() => setShowRaiseForm(false)} title="Raise a Complaint">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <Select
            label="Related Order (Optional)"
            value={formData.orderId}
            onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
          >
            <option value="">No specific order</option>
            {userOrders.map(order => (
              <option key={order.id} value={order.id}>
                {order.orderNumber} - {order.customerName}
              </option>
            ))}
          </Select>

          {!formData.orderId && availableNurseries.length > 0 && (
            <Select
              label="Related Nursery (Optional)"
              value={formData.nurseryId}
              onChange={(e) => setFormData({ ...formData, nurseryId: e.target.value })}
            >
              <option value="">Not specific to a nursery</option>
              {availableNurseries.map(nursery => (
                <option key={nursery.id} value={nursery.id}>
                  {nursery.name}
                </option>
              ))}
            </Select>
          )}

          <Select
            label="Complaint Category *"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ComplaintCategory })}
          >
            {complaintCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </Select>

          <Input
            label="Subject *"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Brief subject of your complaint"
            required
          />

          <Textarea
            label="Description *"
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Provide detailed description of the issue..."
            required
          />

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowRaiseForm(false)}>Cancel</Button>
            <Button onClick={handleRaiseComplaint}>Submit Complaint</Button>
          </div>
        </div>
      </Modal>

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <Modal open={!!selectedComplaint} onClose={() => setSelectedComplaint(null)} title={selectedComplaint.complaintId}>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Status & Category */}
            <div className="flex gap-2">
              <Badge variant="secondary">{complaintCategories.find(c => c.value === selectedComplaint.category)?.label}</Badge>
              <Badge className={getStatusColor(selectedComplaint.status)}>
                {selectedComplaint.status.replace('_', ' ')}
              </Badge>
            </div>

            {/* Subject & Description */}
            <div>
              <h3 className="font-bold text-neutral-900">{selectedComplaint.subject}</h3>
              <p className="text-sm text-neutral-600 mt-2">{selectedComplaint.description}</p>
            </div>

            {/* Metadata */}
            <div className="bg-neutral-50 p-3 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Raised:</span>
                <span>{new Date(selectedComplaint.createdAt).toLocaleString()}</span>
              </div>
              {selectedComplaint.orderNumber && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Related Order:</span>
                  <span className="font-mono">{selectedComplaint.orderNumber}</span>
                </div>
              )}
            </div>

            {/* Responses */}
            {selectedComplaint.responses.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-bold text-neutral-900 mb-3">Conversation ({selectedComplaint.responses.length})</h4>
                <div className="space-y-3">
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
                          <span className="font-semibold text-neutral-900">{response.responderName}</span>
                          <Badge className={`text-xs ${
                            response.responderRole === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : response.responderRole === 'seller'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}>
                            {response.responderRole === 'admin' ? '👨‍💼 Admin' : response.responderRole === 'seller' ? '🏪 Seller' : '👤 You'}
                          </Badge>
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

            {/* Delete Button */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedComplaint(null)}>Close</Button>
              <Button
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={() => {
                  setConfirmDeleteId(selectedComplaint.id);
                  setSelectedComplaint(null);
                }}
              >
                <Trash2 size={16} /> Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!confirmDeleteId}
        onConfirm={() => confirmDeleteId && handleDeleteComplaint(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete Complaint"
        message="Are you sure you want to delete this complaint? This action cannot be undone."
        confirmText="Delete Complaint"
        cancelText="Cancel"
        isDestructive
      />
    </div>
  );
}
