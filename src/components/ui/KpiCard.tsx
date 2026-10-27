import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'primary' | 'accent' | 'blue' | 'purple' | 'red';
}

const colorMap = {
  primary: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
  accent: 'bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400',
  blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

export function KpiCard({ label, value, icon, trend, trendLabel, color = 'primary' }: KpiCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 card-shadow p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</p>
      {trendLabel && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">{trendLabel}</p>}
    </div>
  );
}
