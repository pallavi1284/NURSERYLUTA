import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 card-shadow ${hover ? 'transition-all duration-200 hover:card-shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
