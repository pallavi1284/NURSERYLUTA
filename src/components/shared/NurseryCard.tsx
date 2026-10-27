import { Link } from 'react-router-dom';
import { MapPin, Star, BadgeCheck, Package, Leaf } from 'lucide-react';
import type { Nursery } from '@/types';
import { useApp } from '@/store/AppContext';
import { Badge } from '@/components/ui/Badge';

interface NurseryCardProps {
  nursery: Nursery;
}

export function NurseryCard({ nursery }: NurseryCardProps) {
  const { plants, inventory } = useApp();
  const nurseryInventory = inventory.filter((inv) => inv.nurseryId === nursery.id);
  const plantCount = new Set(nurseryInventory.map((inv) => inv.plantId)).size;

  return (
    <Link to={`/nurseries/${nursery.id}`} className="group block">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 card-shadow overflow-hidden transition-all duration-200 hover:card-shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700 h-full">
        {/* Main nursery profile image */}
        <div className="relative h-40 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          {nursery.profilePicture ? (
            <img 
              src={nursery.profilePicture} 
              alt={nursery.name} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = nursery.logo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="16" fill="%239ca3af"%3ENo image%3C/text%3E%3C/svg%3E';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
              <Leaf size={48} className="text-primary-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-3 left-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-white text-base leading-tight">{nursery.name}</h3>
              {nursery.verified && <BadgeCheck size={16} className="text-primary-400" />}
            </div>
            <div className="flex items-center gap-1 text-xs text-white/80">
              <MapPin size={11} /> {nursery.city}, {nursery.state}
            </div>
          </div>
        </div>

        <div className="p-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-3">{nursery.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star size={14} className="text-accent-500 fill-accent-500" />
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{nursery.rating}</span>
              <span className="text-xs text-neutral-400 dark:text-neutral-500">({nursery.reviewCount})</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
              <Package size={14} className="text-neutral-400 dark:text-neutral-500" />
              <span>{plantCount} plants</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
