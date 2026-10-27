import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mb-1">{title}</h3>
      {description && <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}
