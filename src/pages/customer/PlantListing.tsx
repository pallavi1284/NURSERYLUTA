import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { buildPlantWithInventory, getStockStatus, formatINR } from '@/lib/utils';
import { PlantCard } from '@/components/shared/PlantCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';

export function PlantListingPage() {
  const { plants, inventory, nurseries } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [page, setPage] = useState(1);

  const query = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('category') || '';
  const nurseryFilter = searchParams.get('nursery') || '';
  const sortBy = searchParams.get('sort') || 'popular';

  // Get unique categories from actual plants
  const availableCategories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(plants.map(p => p.categoryId).filter(Boolean)));
    return uniqueCategories.sort();
  }, [plants]);

  // Filter categories by selected nursery
  const filteredCategories = useMemo(() => {
    if (!nurseryFilter) return availableCategories;
    const nurseryPlants = plants.filter(p => 
      inventory.some(inv => inv.nurseryId === nurseryFilter && inv.plantId === p.id)
    );
    return Array.from(new Set(nurseryPlants.map(p => p.categoryId).filter(Boolean))).sort();
  }, [nurseryFilter, plants, inventory]);

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

  const filtered = useMemo(() => {
    let result = [...plantsWithInv];

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.variety.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (categoryFilter) {
      result = result.filter((p) => p.categoryId === categoryFilter);
    }

    if (nurseryFilter) {
      result = result.filter((p) => p.inventory.some((inv) => inv.nurseryId === nurseryFilter));
    }

    switch (sortBy) {
      case 'price-low': result.sort((a, b) => a.minPrice - b.minPrice); break;
      case 'price-high': result.sort((a, b) => b.minPrice - a.minPrice); break;
      case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: result.sort((a, b) => b.inventory.length - a.inventory.length);
    }

    return result;
  }, [plantsWithInv, query, categoryFilter, nurseryFilter, sortBy]);

  const perPage = 12;
  const totalPages = Math.ceil(filtered.length / perPage);
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-3 items-center mb-6">
        {/* Simple Filter Button with Dropdown */}
        <div className="relative">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="gap-2"
          >
            <SlidersHorizontal size={16} /> Filter
          </Button>

          {showFilterDropdown && (
            <div className="absolute left-0 top-full mt-2 bg-white rounded-lg border border-neutral-200 shadow-lg z-20 min-w-64 p-4 space-y-4">
              {/* Nursery Filter */}
              <div>
                <label className="text-sm font-bold text-neutral-900 mb-2 block">Nursery</label>
                <select
                  value={nurseryFilter}
                  onChange={(e) => {
                    updateParam('nursery', e.target.value);
                    updateParam('category', ''); // Reset category when nursery changes
                  }}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Nurseries</option>
                  {nurseries.filter((n) => n.status === 'approved').map((nursery) => (
                    <option key={nursery.id} value={nursery.id}>{nursery.name}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-sm font-bold text-neutral-900 mb-2 block">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => updateParam('category', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Categories</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-neutral-200">
                <Button 
                  size="sm" 
                  onClick={() => setShowFilterDropdown(false)}
                  className="flex-1"
                >
                  Apply
                </Button>
                {(nurseryFilter || categoryFilter) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSearchParams(new URLSearchParams());
                      setShowFilterDropdown(false);
                    }}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {(nurseryFilter || categoryFilter) && (
          <div className="flex gap-2 flex-wrap text-xs">
            {nurseryFilter && (
              <span className="bg-primary-100 text-primary-700 px-2.5 py-1.5 rounded-lg font-medium">
                {nurseries.find(n => n.id === nurseryFilter)?.name}
              </span>
            )}
            {categoryFilter && (
              <span className="bg-primary-100 text-primary-700 px-2.5 py-1.5 rounded-lg font-medium">
                {categoryFilter}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          {categoryFilter ? `${categoryFilter} Plants` : 'All Plants'}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {filtered.length} {filtered.length === 1 ? 'plant' : 'plants'} available
          {nurseryFilter && ` from ${nurseries.find(n => n.id === nurseryFilter)?.name}`}
        </p>
      </div>

      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-neutral-500 hidden sm:block">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="popular">Most Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </div>
      </div>

      {pageItems.length === 0 ? (
        <EmptyState
          icon={<Search size={28} />}
          title="No plants found"
          description={nurseryFilter || categoryFilter ? "Try adjusting your filters." : "Try searching or check back soon."}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {pageItems.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
