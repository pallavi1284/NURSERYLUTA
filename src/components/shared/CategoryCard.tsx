import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import type { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  count: number;
}

export function CategoryCard({ category, count }: CategoryCardProps) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[category.icon] || Icons.Sprout;

  return (
    <Link
      to={`/plants?category=${category.slug}`}
      className="group flex flex-col items-center gap-3 p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 card-shadow hover:card-shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all"
    >
      <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
        <Icon size={26} />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{category.name}</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">{count} plants</p>
      </div>
    </Link>
  );
}
