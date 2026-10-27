import { Leaf } from 'lucide-react';

interface DefaultNurseryAvatarProps {
  nurseryName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function DefaultNurseryAvatar({
  nurseryName,
  size = 'md',
  className = '',
}: DefaultNurseryAvatarProps) {
  // Get initials from nursery name
  const initials = nurseryName
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
    .slice(0, 2);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-lg',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${className} rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 border border-primary-300 flex items-center justify-center flex-shrink-0`}
      title={nurseryName}
    >
      {initials ? (
        <span className="font-bold text-primary-700">{initials}</span>
      ) : (
        <Leaf size={size === 'sm' ? 16 : size === 'md' ? 18 : size === 'lg' ? 24 : 32} className="text-primary-600" />
      )}
    </div>
  );
}
