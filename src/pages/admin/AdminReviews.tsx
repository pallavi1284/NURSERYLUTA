import { useState, useMemo } from 'react';
import { Star, Eye, EyeOff, Search, Filter, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-300 fill-neutral-300'}
        />
      ))}
    </div>
  );
}

export function AdminReviewsPage() {
  const { reviews, plants, nurseries, moderateReview, showToast } = useApp();

  const [search, setSearch] = useState('');
  const [filterNursery, setFilterNursery] = useState('');
  const [filterPlant, setFilterPlant] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'hidden'>('all');

  const enriched = useMemo(() => {
    return reviews
      .map((r) => ({
        ...r,
        plant: plants.find((p) => p.id === r.plantId),
        nursery: nurseries.find((n) => n.id === r.nurseryId),
      }))
      .filter((r) => {
        if (filterNursery && r.nurseryId !== filterNursery) return false;
        if (filterPlant && r.plantId !== filterPlant) return false;
        if (filterStatus !== 'all' && r.status !== filterStatus) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            r.customerName.toLowerCase().includes(q) ||
            r.comment.toLowerCase().includes(q) ||
            r.plant?.name.toLowerCase().includes(q) ||
            r.nursery?.name.toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [reviews, plants, nurseries, filterNursery, filterPlant, filterStatus, search]);

  const totalPublished = reviews.filter((r) => r.status === 'published').length;
  const totalHidden = reviews.filter((r) => r.status === 'hidden').length;
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : '—';

  const handleToggle = (id: string, currentStatus: string) => {
    const next = currentStatus === 'published' ? 'hidden' : 'published';
    moderateReview(id, next);
    showToast(next === 'hidden' ? 'Review hidden from customers' : 'Review restored successfully');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">Review Moderation</h2>
        <p className="text-sm text-neutral-500 mt-1">View, filter and moderate customer reviews across all plants and nurseries.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-neutral-900">{reviews.length}</div>
          <div className="text-xs text-neutral-500 mt-1">Total Reviews</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary-600">{totalPublished}</div>
          <div className="text-xs text-neutral-500 mt-1">Published</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{totalHidden}</div>
          <div className="text-xs text-neutral-500 mt-1">Hidden</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-amber-500 flex items-center justify-center gap-1">
            {avgRating} <Star size={18} className="fill-amber-400 text-amber-400" />
          </div>
          <div className="text-xs text-neutral-500 mt-1">Avg. Rating</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />
          <Select value={filterNursery} onChange={(e) => setFilterNursery(e.target.value)} label="">
            <option value="">All Nurseries</option>
            {nurseries.map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </Select>
          <Select value={filterPlant} onChange={(e) => setFilterPlant(e.target.value)} label="">
            <option value="">All Plants</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.variety})</option>
            ))}
          </Select>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} label="">
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </Select>
        </div>
      </Card>

      {/* Reviews List */}
      {enriched.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={28} />}
          title="No reviews found"
          description="No reviews match the current filters."
        />
      ) : (
        <div className="space-y-3">
          {enriched.map((review) => (
            <Card key={review.id} className={`p-5 ${review.status === 'hidden' ? 'opacity-60 bg-neutral-50' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <h4 className="font-bold text-neutral-900">{review.customerName}</h4>
                    {review.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-xs text-primary-600 font-medium bg-primary-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} /> Verified Purchase
                      </span>
                    )}
                    <Badge className={review.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}>
                      {review.status === 'published' ? 'Published' : 'Hidden'}
                    </Badge>
                    <span className="text-xs text-neutral-400 ml-auto">{formatDate(review.date)}</span>
                  </div>

                  {/* Plant & Nursery */}
                  <div className="flex flex-wrap gap-3 mb-3 text-sm text-neutral-500">
                    {review.plant && (
                      <span className="bg-neutral-100 rounded-md px-2 py-0.5">
                        🌿 {review.plant.name} ({review.plant.variety})
                      </span>
                    )}
                    {review.nursery && (
                      <span className="bg-neutral-100 rounded-md px-2 py-0.5">
                        🏪 {review.nursery.name}
                      </span>
                    )}
                  </div>

                  {/* Ratings */}
                  <div className="flex flex-wrap gap-4 mb-3">
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">Plant Rating</p>
                      <StarRow rating={review.rating} />
                    </div>
                    {review.nurseryRating !== undefined && (
                      <div>
                        <p className="text-xs text-neutral-400 mb-1">Nursery Rating</p>
                        <StarRow rating={review.nurseryRating} />
                      </div>
                    )}
                  </div>

                  {/* Sub-ratings */}
                  {(review.plantQualityRating || review.packagingRating || review.deliveryRating || review.sellerExperienceRating) && (
                    <div className="flex flex-wrap gap-3 mb-3">
                      {review.plantQualityRating && (
                        <span className="text-xs bg-neutral-50 border border-neutral-200 rounded px-2 py-1">
                          Quality: {'★'.repeat(review.plantQualityRating)}
                        </span>
                      )}
                      {review.packagingRating && (
                        <span className="text-xs bg-neutral-50 border border-neutral-200 rounded px-2 py-1">
                          Packaging: {'★'.repeat(review.packagingRating)}
                        </span>
                      )}
                      {review.deliveryRating && (
                        <span className="text-xs bg-neutral-50 border border-neutral-200 rounded px-2 py-1">
                          Delivery: {'★'.repeat(review.deliveryRating)}
                        </span>
                      )}
                      {review.sellerExperienceRating && (
                        <span className="text-xs bg-neutral-50 border border-neutral-200 rounded px-2 py-1">
                          Seller: {'★'.repeat(review.sellerExperienceRating)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Comment */}
                  <p className="text-sm text-neutral-700 italic">"{review.comment}"</p>
                </div>

                {/* Action */}
                <div className="shrink-0">
                  <Button
                    variant={review.status === 'published' ? 'danger' : 'outline'}
                    size="sm"
                    onClick={() => handleToggle(review.id, review.status)}
                  >
                    {review.status === 'published' ? (
                      <><EyeOff size={14} /> Hide</>
                    ) : (
                      <><Eye size={14} /> Restore</>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
