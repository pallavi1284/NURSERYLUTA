import { Link } from 'react-router-dom';
import { MapPin, Star, ShoppingCart } from 'lucide-react';
import type { PlantWithInventory } from '@/types';
import { formatINR, getStockStatus, DEFAULT_PLANT_IMAGE } from '@/lib/utils';
import { useApp } from '@/store/AppContext';
import { Badge } from '@/components/ui/Badge';

interface PlantCardProps {
  plant: PlantWithInventory;
}

export function PlantCard({ plant }: PlantCardProps) {
  const { addToCart, showToast } = useApp();
  const stock = getStockStatus(plant.totalQuantity);
  const cheapest = plant.inventory.sort((a, b) => a.price - b.price)[0];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!cheapest || plant.totalQuantity === 0) {
      showToast('This plant is out of stock', 'error');
      return;
    }
    addToCart({
      id: Math.random().toString(36).slice(2),
      inventoryId: cheapest.id,
      plant,
      nursery: cheapest.nursery,
      price: cheapest.price,
      quantity: 1,
    });
    showToast(`${plant.name} (${plant.variety}) added to cart`);
  };

  return (
    <Link to={`/plants/${plant.id}`} className="group block">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 card-shadow overflow-hidden transition-all duration-200 hover:card-shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700 h-full flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <img
            src={plant.image || DEFAULT_PLANT_IMAGE}
            alt={plant.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_PLANT_IMAGE;
            }}
          />
          <div className="absolute top-3 left-3">
            <Badge className={stock.color}>
              {stock.label}
              {plant.totalQuantity > 0 && plant.totalQuantity <= 5 && (
                <span className="ml-1 text-xs">({plant.totalQuantity})</span>
              )}
            </Badge>
          </div>
          {plant.inventory.length > 1 && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/90 dark:bg-neutral-900/90 text-neutral-700 dark:text-neutral-200">
                {plant.inventory.length} nurseries
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 mb-1">
            <span>{plant.category.name}</span>
          </div>
          <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-base leading-tight">{plant.name}</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{plant.variety}</p>

          <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            <MapPin size={13} className="text-neutral-400 dark:text-neutral-500" />
            <span>{cheapest?.nursery.name || 'Unknown'}</span>
            <span className="text-neutral-300 dark:text-neutral-600">·</span>
            <span>{cheapest?.nursery.city || ''}</span>
          </div>

          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">Starting from</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{formatINR(plant.minPrice)}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-0.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                <Star size={12} className="text-accent-500 fill-accent-500" />
                <span>4.{Math.floor(Math.random() * 9) + 1}</span>
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">{plant.totalQuantity} available</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleQuickAdd}
              disabled={plant.totalQuantity === 0}
              className="flex-1 flex items-center justify-center gap-1.5 bg-primary-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={15} />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
