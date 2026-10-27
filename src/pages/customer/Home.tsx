import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, Leaf, Star, TrendingUp } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { buildPlantWithInventory } from '@/lib/utils';
import { PlantCard } from '@/components/shared/PlantCard';
import { NurseryCard } from '@/components/shared/NurseryCard';

export function HomePage() {
  const { plants, inventory, nurseries, platformSettings } = useApp();

  // Build categories object from plant data
  const categories = useMemo(() => {
    const categoryMap = new Map<string, { id: string; name: string }>();
    plants.forEach(p => {
      if (p.categoryId && !categoryMap.has(p.categoryId)) {
        categoryMap.set(p.categoryId, { id: p.categoryId, name: p.categoryId });
      }
    });
    return Array.from(categoryMap.values());
  }, [plants]);

  const plantsWithInv = useMemo(
    () => plants.map((p) => buildPlantWithInventory(p, inventory, nurseries, categories)),
    [plants, inventory, nurseries, categories]
  );

  const featured = plantsWithInv.filter((p) => p.totalQuantity > 0).slice(0, 8);
  const popular = [...plantsWithInv].sort((a, b) => b.inventory.length - a.inventory.length).slice(0, 4);
  const featuredNurseries = nurseries.filter((n) => n.status === 'approved').slice(0, 3);

  // Get unique categories from actual plants
  const availableCategories = useMemo(() => {
    return Array.from(new Set(plants.map(p => p.categoryId).filter(Boolean))).length;
  }, [plants]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(https://images.pexels.com/photos/6508556/pexels-photo-6508556.jpeg?auto=compress&cs=tinysrgb&h=800&w=1600)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 mb-6">
              <Leaf size={14} className="text-primary-200" />
              <span className="text-xs font-semibold text-white">{platformSettings.siteName} — India's Multi-Vendor Plant Marketplace</span>
            </div>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold font-display text-white leading-tight mb-4">
              One Platform, Multiple Nurseries — Find Your Perfect Plant
            </h1>
            <p className="text-lg text-primary-100 mb-8 max-w-xl">
              Explore a wide range of verified nurseries across India. Compare prices, check availability, read reviews, and get quality plants delivered to your doorstep.
            </p>
            <Link to="/plants" className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold px-6 py-3.5 rounded-xl hover:bg-primary-50 transition-colors text-base shadow-lg mr-4">
              Explore Plants
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <div className="relative border-t border-white/10 bg-primary-800/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 text-white">
              <Truck size={22} className="text-primary-200" />
              <div><p className="text-sm font-bold">Pan-India</p><p className="text-xs text-primary-200">Delivery</p></div>
            </div>
            <div className="flex items-center gap-3 text-white">
              <ShieldCheck size={22} className="text-primary-200" />
              <div><p className="text-sm font-bold">Verified</p><p className="text-xs text-primary-200">Nurseries</p></div>
            </div>
            <div className="flex items-center gap-3 text-white">
              <Star size={22} className="text-primary-200" />
              <div><p className="text-sm font-bold">Best Prices</p><p className="text-xs text-primary-200">Compare & save</p></div>
            </div>
            <div className="flex items-center gap-3 text-white">
              <Leaf size={22} className="text-primary-200" />
              <div><p className="text-sm font-bold">{plants.length}+ Plants</p><p className="text-xs text-primary-200">{availableCategories}+ Categories</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Plants */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Featured Plants</h2>
            <p className="text-sm text-neutral-500 mt-1">Handpicked plants from our top nurseries</p>
          </div>
          <Link to="/plants" className="text-sm font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {featured.length === 0 ? (
          <div className="bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200 p-12 text-center">
            <Leaf size={48} className="text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-neutral-900 mb-2">No Plants Available Yet</h3>
            <p className="text-sm text-neutral-500 max-w-md mx-auto">
              Our sellers are getting their nurseries ready. Check back soon for a wide selection of plants!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        )}
      </section>

      {/* Featured Nurseries */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Featured Nurseries</h2>
            <p className="text-sm text-neutral-500 mt-1">Verified sellers with quality plants</p>
          </div>
          <Link to="/nurseries" className="text-sm font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {featuredNurseries.length === 0 ? (
          <div className="bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200 p-12 text-center">
            <ShieldCheck size={48} className="text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-neutral-900 mb-2">No Nurseries Available Yet</h3>
            <p className="text-sm text-neutral-500 max-w-md mx-auto">
              We're onboarding verified sellers. Soon you'll find trusted nurseries across India!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredNurseries.map((nursery) => (
              <NurseryCard key={nursery.id} nursery={nursery} />
            ))}
          </div>
        )}
      </section>

      {/* Popular Plants */}
      {popular.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Popular Plants</h2>
              <p className="text-sm text-neutral-500 mt-1">Available from multiple nurseries — compare and save</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {popular.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-3xl p-8 lg:p-12 text-center">
          <TrendingUp size={32} className="text-primary-400 mx-auto mb-4" />
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">Are you a nursery owner?</h2>
          <p className="text-neutral-400 max-w-xl mx-auto mb-6">Join {platformSettings.siteName} and sell your plants to customers across India. Manage your inventory, set your prices, and grow your business.</p>
          <Link to="/login" className="inline-flex items-center gap-2 bg-primary-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors">
            Start Selling <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
