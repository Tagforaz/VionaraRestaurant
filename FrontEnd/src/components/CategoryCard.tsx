import { cn } from '@/lib/utils';
import { Category } from '@/types';
import { useTranslation } from 'react-i18next';

interface CategoryCardProps {
  category: Category;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onClick,
  isActive,
  className,
}) => {
  const { t } = useTranslation();
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl transition-all duration-300',
        isActive
          ? 'ring-2 ring-primary ring-offset-2'
          : 'hover:shadow-lg',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[3/2] overflow-hidden bg-muted">
        {category.image ? (
          <img
            src={category.image}
            alt={t(category.name)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <span className="font-display text-3xl text-muted-foreground/50">
              {t(category.name)[0] || category.name[0]}
            </span>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
          <h3 className="font-display text-lg font-semibold text-background">
            {t(category.name)}
          </h3>
          {category.description && (
            <p className="mt-1 text-xs text-background/80 line-clamp-2">
              {category.description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};

export default CategoryCard;
