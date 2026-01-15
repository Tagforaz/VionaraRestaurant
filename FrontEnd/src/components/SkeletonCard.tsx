import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  variant?: 'product' | 'category';
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  className,
  variant = 'product' 
}) => {
  if (variant === 'category') {
    return (
      <div className={cn('overflow-hidden rounded-xl bg-card', className)}>
        <div className="aspect-[3/2] animate-pulse bg-muted" />
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-xl bg-card shadow-card', className)}>
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="flex gap-4">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
