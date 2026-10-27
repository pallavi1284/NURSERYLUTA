import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { NurseryCard } from '@/components/shared/NurseryCard';
import { Store, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SlidersHorizontal } from 'lucide-react';

export function NurseryListingPage() {
  const { nurseries, plants, inventory } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const query = searchParams.get('q') || '';
  const cityFilter = searchParams.get('city') || '';
  const stateFilter = searchParams.get('state') || '';
  const categoryFilter = searchParams.get('category') || '';

  const approved = nurseries.filter((n) => n.status === 'approved');

  // Get unique states and cities
  const states = useMemo(() => {
    return Array.from(new Set(approved.map((n) => n.state).filter(Boolean))).sort();
  }, [approved]);

  const cities = useMemo(() => {
    let filtered = approved;
    if (stateFilter) filtered = filtered.filter((n) => n.state === stateFilter);
    return Array.from(new Set(filtered.map((n) => n.city).filter(Boolean))).sort();
  }, [approved, stateFilter]);

  // Get unique categories offered by nurseries
  const availableCategories = useMemo(() => {
    const catSet = new Set<string>();
    approved.forEach((nursery) => {
      if (nursery.specializations && Array.isArray(nursery.specializations)) {
        nursery.specializations.forEach((cat) => catSet.add(cat));
      }
    });
    return Array.from(catSet).sort();
  }, [approved]);

  const filtered = useMemo(() => {
    let result = [...approved];

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.ownerName.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q)
      );
    }

    if (stateFilter) {
      result = result.filter((n) => n.state === stateFilter);
    }

    if (cityFilter) {
      result = result.filter((n) => n.city === cityFilter);
    }

    if (categoryFilter) {
      result = result.filter((n) => n.specializations?.includes(categoryFilter));
    }

    return result;
  }, [approved, query, stateFilter, cityFilter, categoryFilter]);

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">All Nurseries</h1>
        <p className="text-sm text-neutral-500 mt-1">{filtered.length} verified nurseries across India</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden'} lg:block lg:sticky lg:top-20 lg:w-64 lg:shrink-0 lg:bg-transparent lg:p-0`}>
          {showFilters && (
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <h3 className="text-lg font-bold">Filters</h3>
              <button onClick={() => setShowFilters(false)}>
                <X size={22} />
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-neutral-200 card-shadow p-5 space-y-6">
            {/* Search */}
            <div>
              <h4 className="text-sm font-bold text-neutral-900 mb-3">Search</h4>
              <input
                type="text"
                placeholder="Nursery name or owner..."
                value={query}
                onChange={(e) => {
                  const newParams = new URLSearchParams(searchParams);
                  if (e.target.value) newParams.set('q', e.target.value);
                  else newParams.delete('q');
                  setSearchParams(newParams);
                }}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* State Filter */}
            <div>
              <h4 className="text-sm font-bold text-neutral-900 mb-3">State</h4>
              <div className="space-y-1.5">
                <button
                  onClick={() => updateParam('state', '')}
                  className={`block w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors ${!stateFilter ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-neutral-600 hover:bg-neutral-50'}`}
                >
                  All States
                </button>
                {states.map((state) => (
                  <button
                    key={state}
                    onClick={() => {
                      updateParam('state', state);
                      updateParam('city', '');
                    }}
                    className={`block w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors ${stateFilter === state ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-neutral-600 hover:bg-neutral-50'}`}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>

            {/* City Filter */}
            {stateFilter && (
              <div>
                <h4 className="text-sm font-bold text-neutral-900 mb-3">City</h4>
                <div className="space-y-1.5">
                  <button
                    onClick={() => updateParam('city', '')}
                    className={`block w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors ${!cityFilter ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-neutral-600 hover:bg-neutral-50'}`}
                  >
                    All Cities
                  </button>
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => updateParam('city', city)}
                      className={`block w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors ${cityFilter === city ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-neutral-600 hover:bg-neutral-50'}`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categories Filter */}
            <div>
              <h4 className="text-sm font-bold text-neutral-900 mb-3">Specialization</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                <button
                  onClick={() => updateParam('category', '')}
                  className={`block w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors ${!categoryFilter ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-neutral-600 hover:bg-neutral-50'}`}
                >
                  All Categories
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => updateParam('category', cat)}
                    className={`block w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors ${categoryFilter === cat ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-neutral-600 hover:bg-neutral-50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {(query || stateFilter || cityFilter || categoryFilter) && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setSearchParams(new URLSearchParams())}
              >
                <X size={14} /> Clear All Filters
              </Button>
            )}
          </div>
        </aside>

        {/* Main listing */}
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="lg:hidden"
            >
              <SlidersHorizontal size={16} /> Filters
            </Button>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search size={28} />}
              title="No nurseries found"
              description="Try adjusting your filters or search query to find what you're looking for."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((nursery) => (
                <NurseryCard key={nursery.id} nursery={nursery} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
