import { Tag } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">Plant Categories</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Categories are managed by sellers when they add plants
        </p>
      </div>

      <EmptyState
        icon={<Tag size={32} />}
        title="Categories managed by sellers"
        description="Sellers will specify plant categories when they add plants to their inventory. All category management is done through the seller panel."
      />
    </div>
  );
}
