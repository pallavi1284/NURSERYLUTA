import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, BadgeCheck, Phone, Mail, Calendar, ArrowLeft, Package } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { buildPlantWithInventory, formatINR } from '@/lib/utils';
import { PlantCard } from '@/components/shared/PlantCard';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export function NurseryDetailsPage() {
  const { id } = useParams();
  const { nurseries, plants, inventory } = useApp();

  const nursery = nurseries.find((n) => n.id === id);

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

  const nurseryPlants = useMemo(() => {
    if (!nursery) return [];
    const invIds = inventory.filter((inv) => inv.nurseryId === nursery.id);
    return invIds
      .map((inv) => {
        const plant = plants.find((p) => p.id === inv.plantId);
        if (!plant) return null;
        return buildPlantWithInventory(plant, inventory, nurseries, categories);
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [nursery, plants, inventory, nurseries, categories]);

  if (!nursery) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-semibold text-neutral-700">Nursery not found</p>
        <Link to="/nurseries" className="text-primary-600 hover:underline mt-2 inline-block">Browse all nurseries</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Link to="/nurseries" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ArrowLeft size={16} /> Back to nurseries
      </Link>

      {/* Banner */}
      <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden mb-6">
        <img src={nursery.profilePicture || nursery.banner || 'https://via.placeholder.com/1200x400?text=Nursery'} alt={nursery.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Info */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        <div className="w-20 h-20 rounded-2xl border-2 border-white shadow-lg overflow-hidden bg-white shrink-0 -mt-16 sm:-mt-12 relative z-10">
          {nursery.profilePicture ? (
            <img src={nursery.profilePicture} alt={nursery.name} className="w-full h-full object-cover" />
          ) : (
            <img src={nursery.logo} alt={nursery.name} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-900">{nursery.name}</h1>
            {nursery.verified && <BadgeCheck size={22} className="text-primary-600" />}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <Star size={15} className="text-accent-500 fill-accent-500" />
              <span className="text-sm font-bold text-neutral-900">{nursery.rating}</span>
              <span className="text-sm text-neutral-400">({nursery.reviewCount} reviews)</span>
            </div>
            <span className="text-neutral-300">|</span>
            <div className="flex items-center gap-1 text-sm text-neutral-500">
              <MapPin size={14} /> {nursery.city}, {nursery.state}
            </div>
          </div>
          <p className="text-sm text-neutral-600 mt-3 max-w-2xl">{nursery.description}</p>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-sm text-neutral-500">
              <Phone size={14} /> {nursery.phone}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-neutral-500">
              <Mail size={14} /> {nursery.email}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-neutral-500">
              <Calendar size={14} /> Joined {new Date(nursery.joinedDate).getFullYear()}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          {nursery.status === 'approved' ? (
            <Badge className="bg-primary-100 text-primary-700">Verified Seller</Badge>
          ) : nursery.status === 'pending' ? (
            <Badge className="bg-accent-100 text-accent-700">Pending Approval</Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700">Rejected</Badge>
          )}
          <div className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Package size={14} /> {nurseryPlants.length} plants listed
          </div>
        </div>
      </div>

      {/* Plants */}
      <h2 className="text-xl font-bold text-neutral-900 mb-4">Plants from this nursery</h2>
      {nurseryPlants.length === 0 ? (
        <EmptyState icon={<Package size={28} />} title="No plants listed yet" description="This nursery hasn't listed any plants for sale yet." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {nurseryPlants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      )}
    </div>
  );
}
