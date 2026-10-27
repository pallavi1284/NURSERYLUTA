import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 24, className = '' }: LoadingSpinnerProps) {
  return <Loader2 size={size} className={`animate-spin text-primary-600 ${className}`} />;
}

export function FullPageLoader() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <LoadingSpinner size={40} />
    </div>
  );
}
