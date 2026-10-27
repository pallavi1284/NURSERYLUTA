import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Package, Truck, MapPin, Star, Leaf, Building2 } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { formatINR, formatDateTime, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={
              s <= (hovered || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-neutral-300 fill-neutral-300'
            }
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm font-semibold text-neutral-600">
          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][value]}
        </span>
      )}
    </div>
  );
}

function MiniRating({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-600">{label}</span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" onClick={() => onChange(s)}>
            <Star
              size={16}
              className={s <= value ? 'text-amber-400 fill-amber-400' : 'text-neutral-300 fill-neutral-300'}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

interface ReviewFormState {
  plantRating: number;
  nurseryRating: number;
  comment: string;
  plantQualityRating: number;
  packagingRating: number;
  deliveryRating: number;
  sellerExperienceRating: number;
}

function ItemReviewPanel({
  item,
  orderId,
  nurseryId,
  nurseryName,
  existingReview,
  plantId,
}: {
  item: { id: string; plantName: string; variety: string; plantImage: string };
  orderId: string;
  nurseryId: string;
  nurseryName: string;
  existingReview?: any;
  plantId?: string;
}) {
  const { addReview, updateReview, user, showToast } = useApp();
  const [submitted, setSubmitted] = useState(!!existingReview);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ReviewFormState>({
    plantRating: existingReview?.rating || 0,
    nurseryRating: existingReview?.nurseryRating || 0,
    comment: existingReview?.comment || '',
    plantQualityRating: existingReview?.plantQualityRating || 0,
    packagingRating: existingReview?.packagingRating || 0,
    deliveryRating: existingReview?.deliveryRating || 0,
    sellerExperienceRating: existingReview?.sellerExperienceRating || 0,
  });

  const handleSubmit = () => {
    if (!form.plantRating) {
      showToast('Please rate the plant before submitting', 'error');
      return;
    }
    if (existingReview && editing) {
      updateReview(existingReview.id, {
        rating: form.plantRating,
        nurseryRating: form.nurseryRating || undefined,
        comment: form.comment,
        plantQualityRating: form.plantQualityRating || undefined,
        packagingRating: form.packagingRating || undefined,
        deliveryRating: form.deliveryRating || undefined,
        sellerExperienceRating: form.sellerExperienceRating || undefined,
      });
      showToast('Review updated successfully!');
    } else {
      addReview({
        plantId: plantId || item.id,
        nurseryId,
        customerId: user?.id || 'cust1',
        customerName: user?.name || 'Customer',
        orderId,
        orderItemId: item.id,
        rating: form.plantRating,
        nurseryRating: form.nurseryRating || undefined,
        comment: form.comment,
        plantQualityRating: form.plantQualityRating || undefined,
        packagingRating: form.packagingRating || undefined,
        deliveryRating: form.deliveryRating || undefined,
        sellerExperienceRating: form.sellerExperienceRating || undefined,
        verifiedPurchase: true,
        status: 'published',
      });
      showToast('Thank you for your review!');
    }
    setSubmitted(true);
    setEditing(false);
  };

  const ratingLabel = ['', '★', '★★', '★★★', '★★★★', '★★★★★'];

  if (submitted && !editing) {
    return (
      <Card className="p-4 border-green-200 bg-green-50/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
              <img src={item.plantImage} alt={item.plantName} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">{item.plantName} <span className="text-neutral-500 font-normal">({item.variety})</span></p>
              <div className="flex items-center gap-1 mt-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} className={s <= form.plantRating ? 'text-amber-400 fill-amber-400' : 'text-neutral-300 fill-neutral-300'} />
                ))}
              </div>
              {form.comment && <p className="text-xs text-neutral-500 mt-1 italic">"{form.comment.slice(0, 80)}{form.comment.length > 80 ? '…' : ''}"</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CheckCircle2 size={18} className="text-green-600" />
            <button onClick={() => setEditing(true)} className="text-xs text-primary-600 hover:underline font-medium">Edit</button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 border-amber-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
          <img src={item.plantImage} alt={item.plantName} className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="font-bold text-neutral-900">{item.plantName} <span className="text-neutral-500 font-normal text-sm">({item.variety})</span></p>
          {editing && <p className="text-xs text-primary-600 font-medium">Editing your review</p>}
        </div>
      </div>

      <div className="space-y-4">
        {/* Plant rating */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Leaf size={15} className="text-primary-600" />
            <label className="text-sm font-semibold text-neutral-800">Plant Rating *</label>
          </div>
          <StarPicker value={form.plantRating} onChange={(v) => setForm({ ...form, plantRating: v })} />
        </div>

        {/* Nursery rating */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Building2 size={15} className="text-primary-600" />
            <label className="text-sm font-semibold text-neutral-800">Nursery / Seller Rating</label>
          </div>
          <StarPicker value={form.nurseryRating} onChange={(v) => setForm({ ...form, nurseryRating: v })} />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Your Review</label>
          <textarea
            rows={3}
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            placeholder="Share your experience with this plant..."
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* Sub-ratings */}
        <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Optional Ratings</p>
          <MiniRating label="Plant Quality" value={form.plantQualityRating} onChange={(v) => setForm({ ...form, plantQualityRating: v })} />
          <MiniRating label="Packaging" value={form.packagingRating} onChange={(v) => setForm({ ...form, packagingRating: v })} />
          <MiniRating label="Delivery Experience" value={form.deliveryRating} onChange={(v) => setForm({ ...form, deliveryRating: v })} />
          <MiniRating label="Seller Experience" value={form.sellerExperienceRating} onChange={(v) => setForm({ ...form, sellerExperienceRating: v })} />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSubmit} className="flex-1">
            <Star size={16} />
            {editing ? 'Update Review' : 'Submit Review'}
          </Button>
          {editing && (
            <Button variant="outline" onClick={() => { setEditing(false); setSubmitted(true); }}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function OrderTrackingPage() {
  const { id } = useParams();
  const { orders, reviews, plants, inventory } = useApp();
  const order = orders.find((o) => o.id === id);

  const reviewsByOrderItem = useMemo(() => {
    if (!order) return {};
    const map: Record<string, any> = {};
    for (const review of reviews) {
      if (review.orderId === order.id && review.orderItemId) {
        map[review.orderItemId] = review;
      }
    }
    return map;
  }, [reviews, order]);

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-semibold text-neutral-700">Order not found</p>
        <Link to="/customer/my-orders" className="text-primary-600 hover:underline mt-2 inline-block">Back to orders</Link>
      </div>
    );
  }

  const steps = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
  const currentStep = steps.indexOf(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'rejected';
  const isDelivered = order.status === 'delivered';

  const stepIcons: Record<string, React.ReactNode> = {
    pending: <Clock size={18} />,
    confirmed: <CheckCircle2 size={18} />,
    packed: <Package size={18} />,
    shipped: <Truck size={18} />,
    delivered: <CheckCircle2 size={18} />,
  };

  // Try to match order items to plant IDs
  const getPlantId = (itemPlantName: string, itemVariety: string) => {
    return plants.find(
      (p) => p.name.toLowerCase() === itemPlantName.toLowerCase() &&
        p.variety.toLowerCase() === itemVariety.toLowerCase()
    )?.id;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/customer/my-orders" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ArrowLeft size={16} /> Back to orders
      </Link>

      <div className="bg-white rounded-2xl border border-neutral-200 card-shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-neutral-900">{order.orderNumber}</h1>
              <Badge className={getOrderStatusColor(order.status)}>
                {getOrderStatusLabel(order.status)}
              </Badge>
            </div>
            <p className="text-sm text-neutral-500">Placed on {formatDateTime(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-neutral-900">{formatINR(order.total)}</p>
            <p className="text-sm text-neutral-500">{order.paymentMethod} · {order.paymentStatus}</p>
          </div>
        </div>

        {/* Tracking timeline */}
        {!isCancelled ? (
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-neutral-200" />
              <div
                className="absolute top-5 left-5 h-0.5 bg-primary-600 transition-all"
                style={{ width: `calc(${(currentStep / (steps.length - 1)) * 100}% - ${currentStep === 0 ? 0 : 10}px)` }}
              />
              {steps.map((step, idx) => (
                <div key={step} className="flex flex-col items-center gap-2 z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      idx <= currentStep ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {stepIcons[step]}
                  </div>
                  <span className={`text-xs font-semibold capitalize ${idx <= currentStep ? 'text-neutral-900' : 'text-neutral-400'}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm font-semibold text-red-700">This order was {order.status === 'rejected' ? 'rejected by the nursery' : 'cancelled'}</p>
          </div>
        )}

        {/* Tracking history */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-bold text-neutral-900">Tracking History</h3>
          {order.trackingHistory.map((event, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary-600 mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-neutral-900 capitalize">{getOrderStatusLabel(event.status)}</p>
                <p className="text-xs text-neutral-500">{formatDateTime(event.timestamp)} · {event.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-neutral-200 card-shadow p-6 mb-6">
        <h3 className="font-bold text-neutral-900 mb-4">Items in this order</h3>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                <img src={item.plantImage} alt={item.plantName} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-neutral-900">{item.plantName} ({item.variety})</p>
                <p className="text-xs text-neutral-500">from {item.nurseryName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{item.quantity} × {formatINR(item.price)}</p>
                <p className="text-sm font-bold text-neutral-900">{formatINR(item.subtotal)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-neutral-200 mt-4 pt-3 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span>{formatINR(order.shipping)}</span></div>
          <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatINR(order.total)}</span></div>
        </div>
      </div>

      {/* ⭐ Rate Your Purchase — only when delivered */}
      {isDelivered && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Star size={20} className="text-amber-400 fill-amber-400" />
            <h2 className="text-lg font-bold text-neutral-900">Rate Your Purchase</h2>
            <p className="text-sm text-neutral-500">from {order.nurseryName}</p>
          </div>
          <div className="space-y-3">
            {order.items.map((item) => {
              const existingReview = reviewsByOrderItem[item.id];
              const plantId = getPlantId(item.plantName, item.variety);
              return (
                <ItemReviewPanel
                  key={item.id}
                  item={item}
                  orderId={order.id}
                  nurseryId={order.nurseryId}
                  nurseryName={order.nurseryName}
                  existingReview={existingReview}
                  plantId={plantId}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Delivery address */}
      <div className="bg-white rounded-2xl border border-neutral-200 card-shadow p-6">
        <h3 className="font-bold text-neutral-900 mb-3 flex items-center gap-2"><MapPin size={16} /> Delivery Address</h3>
        <p className="text-sm font-semibold text-neutral-900">{order.address.fullName}</p>
        <p className="text-sm text-neutral-500">{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}</p>
        <p className="text-sm text-neutral-500">{order.address.city}, {order.address.state} - {order.address.pincode}</p>
        <p className="text-sm text-neutral-500 mt-1">{order.address.phone}</p>
      </div>
    </div>
  );
}
