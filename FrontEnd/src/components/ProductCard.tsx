import { Star, Clock, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onClick?: () => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onClick,
  className,
}) => {
  const { t } = useTranslation();
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl bg-card shadow-card card-hover cursor-pointer',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted">
            <span className="font-display text-4xl text-muted-foreground/30">
              {product.name[0]}
            </span>
          </div>
        )}
        
        {/* Popular Badge */}
        {product.isPopular && (
          <div className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            {t('menu.popular')}
          </div>
        )}

        {/* Add Button */}
        {onAddToCart && (
          <Button
            size="icon"
            variant="hero"
            className="absolute bottom-3 right-3 h-10 w-10 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleAddToCart}
          >
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-card-foreground line-clamp-1">
            {product.nameKey ? t(product.nameKey) : product.name}
          </h3>
          <span className="shrink-0 font-semibold text-primary">
            ${product.price.toFixed(2)}
          </span>
        </div>

        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
          {product.descriptionKey ? t(product.descriptionKey) : product.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            <span>{product.averageRating.toFixed(1)}</span>
            <span>({product.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{product.preparationTime} {t('productDetail.min')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
