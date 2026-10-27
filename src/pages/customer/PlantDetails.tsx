import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Sun, Droplets, Gauge, Ruler, Star, MapPin, ShoppingCart, ArrowLeft, CheckCircle2, Store, Leaf } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { buildPlantWithInventory, formatINR, getStockStatus, DEFAULT_PLANT_IMAGE } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { Review } from '@/types';

export function PlantDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { plants, inventory, nurseries, addToCart, showToast, reviews } = useApp();
  const [selectedInvId, setSelectedInvId] = useState<string>('');
  const [qty, setQty] = useState(1);

  const plant = plants.find((p) => p.id === id);

  // Build categories from actual plant data
  const categories = useMemo(() => {
    const categoryMap = new Map<string, { id: string; name: string }>();
    plants.forEach(p => {
      if (p.categoryId && !categoryMap.has(p.categoryId)) {
        categoryMap.set(p.categoryId, { id: p.categoryId, name: p.categoryId });
      }
    });
    return Array.from(categoryMap.values());
  }, [plants]);

  const plantWithInv = useMemo(() => {
    if (!plant) return null;
    return buildPlantWithInventory(plant, inventory, nurseries, categories);
  }, [plant, inventory, nurseries, categories]);

  const plantReviews = useMemo(() => {
    return reviews.filter(r => r.plantId === id && r.status !== 'hidden');
  }, [reviews, id]);

  const avgRating = useMemo(() => {
    if (plantReviews.length === 0) return 0;
    return (plantReviews.reduce((sum, r) => sum + r.rating, 0) / plantReviews.length).toFixed(1);
  }, [plantReviews]);

  const avgNurseryRating = useMemo(() => {
    const nurseryRevs = plantReviews.filter(r => r.nurseryRating !== undefined);
    if (nurseryRevs.length === 0) return null;
    return (nurseryRevs.reduce((sum, r) => sum + (r.nurseryRating || 0), 0) / nurseryRevs.length).toFixed(1);
  }, [plantReviews]);

  if (!plant || !plantWithInv) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-semibold text-neutral-700">Plant not found</p>
        <Link to="/plants" className="text-primary-600 hover:underline mt-2 inline-block">Browse all plants</Link>
      </div>
    );
  }

  const sortedInv = [...plantWithInv.inventory].sort((a, b) => a.price - b.price);
  const selectedInv = sortedInv.find((inv) => inv.id === selectedInvId) || sortedInv[0];

  const handleAddToCart = () => {
    if (!selectedInv) return;
    addToCart({
      id: Math.random().toString(36).slice(2),
      inventoryId: selectedInv.id,
      plant,
      nursery: selectedInv.nursery,
      price: selectedInv.price,
      quantity: qty,
    });
    showToast(`${plant.name} (${plant.variety}) added to cart`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/customer/my-cart');
  };

  const renderSpecsGrid = () => {
    const specs = [
      { label: 'Variety', value: plant.variety },
      { label: 'Subtype', value: plant.subtype },
      { label: 'Propagation Method', value: plant.propagationMethod },
      { label: 'Age', value: plant.age ? `${plant.age} ${plant.ageUnit || ''}` : '' },
      { label: 'Root Type', value: plant.rootType },
      { label: 'Rootstock', value: plant.rootstock },
      { label: 'Plant Height', value: plant.height ? `${plant.height} ${plant.heightUnit || ''}` : '' },
      { label: 'Condition', value: plant.condition },
      // Growing Info
      { label: 'Suitable Soil', value: plant.soilRequirement },
      { label: 'Watering Pattern', value: plant.watering },
      { label: 'Climate', value: plant.climate },
      { label: 'Season', value: plant.plantingSeason },
      { label: 'Maturity', value: plant.maturityPeriod },
    ].filter(s => s.value && s.value.trim() !== '');

    if (specs.length === 0) return null;

    return (
      <div className="mt-8">
        <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <Leaf size={18} className="text-primary-600" /> Plant Specifications
        </h3>
        <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-neutral-200">
              {specs.map((spec, i) => (
                <tr key={i} className="hover:bg-neutral-50">
                  <td className="py-3 px-4 text-neutral-500 font-medium w-1/3 bg-neutral-50/50">{spec.label}</td>
                  <td className="py-3 px-4 text-neutral-900">{spec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Link to="/plants" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ArrowLeft size={16} /> Back to plants
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image */}
        <div>
          <div className="rounded-2xl overflow-hidden border border-neutral-200 card-shadow-lg bg-neutral-100 aspect-square">
            <img
              src={plant.image || DEFAULT_PLANT_IMAGE}
              alt={plant.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_PLANT_IMAGE;
              }}
            />
          </div>
        </div>

        {/* Details */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-primary-50 text-primary-700">{plantWithInv.category.name}</Badge>
            {plant.plantType && <Badge className="bg-neutral-100 text-neutral-600">{plant.plantType}</Badge>}
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">{plant.name}</h1>
          <p className="text-lg text-neutral-500 mt-1">{plant.variety}</p>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <Star size={16} className="text-accent-500 fill-accent-500" />
              <span className="text-sm font-bold text-neutral-900">{plantReviews.length ? avgRating : 'New'}</span>
              <span className="text-sm text-neutral-400">({plantReviews.length} plant reviews)</span>
            </div>
            <span className="text-neutral-300">|</span>
            {avgNurseryRating && (
              <>
                <div className="flex items-center gap-1">
                  <Star size={16} className="text-amber-400 fill-amber-400" />
                  <span className="text-sm font-bold text-neutral-900">{avgNurseryRating}</span>
                  <span className="text-sm text-neutral-400">nursery</span>
                </div>
                <span className="text-neutral-300">|</span>
              </>
            )}
            <div className="flex items-center gap-1.5 text-sm text-neutral-500">
              <Store size={15} /> Sold by {sortedInv.length} nurseries
            </div>
          </div>

          <p className="text-sm text-neutral-600 leading-relaxed mt-4">{plant.description}</p>
          
          {plant.careInstructions && (
            <div className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-100">
              <h4 className="text-sm font-bold text-primary-900 mb-1">Care Instructions</h4>
              <p className="text-sm text-primary-700">{plant.careInstructions}</p>
            </div>
          )}

          {renderSpecsGrid()}

          {/* Nursery comparison */}
          <div className="mt-8">
            <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
              <Store size={16} /> Choose a nursery ({sortedInv.length} options)
            </h3>
            <div className="space-y-2.5">
              {sortedInv.map((inv) => {
                const invStock = getStockStatus(inv.quantity);
                const isSelected = selectedInv?.id === inv.id;
                return (
                  <button
                    key={inv.id}
                    onClick={() => setSelectedInvId(inv.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                      isSelected ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                      <img src={inv.nursery.logo} alt={inv.nursery.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-neutral-900 truncate">{inv.nursery.name}</p>
                        {inv.nursery.verified && <CheckCircle2 size={14} className="text-primary-600 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <MapPin size={11} /> {inv.nursery.city}, {inv.nursery.state}
                        <span className="text-neutral-300">·</span>
                        <Badge className={invStock.color + ' text-[10px] px-1.5'}>
                          {invStock.label}
                          {inv.quantity > 0 && inv.quantity <= 5 && (
                            <span className="ml-1">({inv.quantity})</span>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-neutral-900">{formatINR(inv.price)}</p>
                      <p className="text-xs text-neutral-400">{inv.quantity} available</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Add to cart */}
          {selectedInv && (
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center border border-neutral-300 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setQty(Math.max(1, qty - 1))} 
                  disabled={selectedInv.quantity === 0}
                  className="w-10 h-11 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <span className="w-12 text-center text-sm font-bold text-neutral-900">{qty}</span>
                <button 
                  onClick={() => setQty(Math.min(selectedInv.quantity, qty + 1))} 
                  disabled={selectedInv.quantity === 0 || qty >= selectedInv.quantity}
                  className="w-10 h-11 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              <Button size="lg" onClick={handleAddToCart} disabled={selectedInv.quantity === 0} className="flex-1">
                <ShoppingCart size={18} /> Add to Cart
              </Button>
            </div>
          )}
          {selectedInv && selectedInv.quantity > 0 && (
            <Button variant="secondary" size="lg" fullWidth onClick={handleBuyNow} className="mt-3">
              Buy Now · {formatINR((selectedInv?.price || 0) * qty)}
            </Button>
          )}
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="mt-16 pt-10 border-t border-neutral-200">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Customer Reviews</h2>
        
        {plantReviews.length === 0 ? (
          <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
            <Star size={32} className="mx-auto text-neutral-300 mb-3" />
            <h3 className="text-lg font-semibold text-neutral-700">No reviews yet</h3>
            <p className="text-sm text-neutral-500 mt-1">Be the first to review this plant after your order is delivered.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200">
                <div className="text-center">
                  <div className="text-5xl font-bold text-neutral-900">{avgRating}</div>
                  <div className="flex items-center justify-center gap-1 my-2">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} size={20} className={star <= Number(avgRating) ? "text-accent-500 fill-accent-500" : "text-neutral-300 fill-neutral-300"} />
                    ))}
                  </div>
                  <p className="text-sm text-neutral-500">Based on {plantReviews.length} reviews</p>
                </div>
                
                <div className="mt-6 space-y-2">
                  {[5,4,3,2,1].map(rating => {
                    const count = plantReviews.filter(r => r.rating === rating).length;
                    const percent = Math.round((count / plantReviews.length) * 100);
                    return (
                      <div key={rating} className="flex items-center gap-2 text-sm">
                        <span className="w-12 text-neutral-600 flex items-center gap-1">{rating} <Star size={12} /></span>
                        <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                          <div className="h-full bg-accent-500 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="w-10 text-right text-neutral-500">{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-4">
              {plantReviews.map(review => (
                <Card key={review.id} className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-neutral-900">{review.customerName}</h4>
                      {review.verifiedPurchase && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-primary-600 font-medium bg-primary-50 px-2 py-0.5 rounded-full inline-flex">
                          <CheckCircle2 size={12} /> Verified Purchase
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {new Date(review.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 mb-3">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} size={14} className={star <= review.rating ? "text-accent-500 fill-accent-500" : "text-neutral-300 fill-neutral-300"} />
                    ))}
                  </div>
                  <p className="text-sm text-neutral-700 whitespace-pre-line">{review.comment}</p>
                  {(review.plantQualityRating || review.packagingRating || review.deliveryRating || review.sellerExperienceRating) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {review.plantQualityRating && <span className="text-xs bg-neutral-50 border border-neutral-200 rounded px-2 py-0.5">Quality {'★'.repeat(review.plantQualityRating)}</span>}
                      {review.packagingRating && <span className="text-xs bg-neutral-50 border border-neutral-200 rounded px-2 py-0.5">Packing {'★'.repeat(review.packagingRating)}</span>}
                      {review.deliveryRating && <span className="text-xs bg-neutral-50 border border-neutral-200 rounded px-2 py-0.5">Delivery {'★'.repeat(review.deliveryRating)}</span>}
                      {review.sellerExperienceRating && <span className="text-xs bg-neutral-50 border border-neutral-200 rounded px-2 py-0.5">Seller {'★'.repeat(review.sellerExperienceRating)}</span>}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related plants */}
      <div className="mt-12 pt-10 border-t border-neutral-200">
        <h2 className="text-xl font-bold text-neutral-900 mb-6">You may also like</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {plants
            .filter((p) => p.categoryId === plant.categoryId && p.id !== plant.id)
            .slice(0, 4)
            .map((p) => {
              const pwi = buildPlantWithInventory(p, inventory, nurseries, categories);
              return <PlantCardCompact key={p.id} plant={pwi} />;
            })}
        </div>
      </div>
    </div>
  );
}

function PlantCardCompact({ plant }: { plant: ReturnType<typeof buildPlantWithInventory> }) {
  return (
    <Link to={`/plants/${plant.id}`} className="group block">
      <Card hover className="overflow-hidden h-full">
        <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
          <img
            src={plant.image || DEFAULT_PLANT_IMAGE}
            alt={plant.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_PLANT_IMAGE;
            }}
          />
        </div>
        <div className="p-3">
          <p className="text-sm font-bold text-neutral-900 truncate">{plant.name}</p>
          <p className="text-xs text-neutral-500 truncate">{plant.variety}</p>
          <p className="text-sm font-bold text-primary-700 mt-1">{formatINR(plant.minPrice)}</p>
        </div>
      </Card>
    </Link>
  );
}
