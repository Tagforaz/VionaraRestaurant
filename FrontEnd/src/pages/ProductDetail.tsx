import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { CustomerLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Clock, Plus, ArrowLeft } from 'lucide-react';
import { useCart } from '@/features/cart';
import { Product } from '@/types';
import { useTranslation } from 'react-i18next';

const DEMO_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Grilled Ribeye Steak',
    nameKey: 'products.grilledRibeyeSteak.name',
    description: 'Premium 12oz ribeye with herb butter, roasted vegetables, and truffle mashed potatoes',
    descriptionKey: 'products.grilledRibeyeSteak.description',
    price: 42.99,
    categoryId: '2',
    isAvailable: true,
    isPopular: true,
    preparationTime: 25,
    averageRating: 4.8,
    reviewCount: 124,
  },
  {
    id: '2',
    name: 'Seafood Risotto',
    nameKey: 'products.seafoodRisotto.name',
    description: 'Creamy arborio rice with shrimp, mussels, calamari, and fresh herbs',
    descriptionKey: 'products.seafoodRisotto.description',
    price: 28.99,
    categoryId: '4',
    isAvailable: true,
    isPopular: true,
    preparationTime: 20,
    averageRating: 4.7,
    reviewCount: 89,
  },
];

const ProductDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);

  const product = DEMO_PRODUCTS.find(p => p.id === id) || null;

  const handleAdd = () => {
    if (!product) return;
    addItem(product, quantity);
  };

  return (
    <CustomerLayout>
      <div className="container py-12">
        <div className="mb-6 flex items-center gap-4">
          <Link to="/menu">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              {t('productDetail.back')}
            </Button>
          </Link>
          <h1 className="font-display text-2xl font-bold">
            {product ? (product.nameKey ? t(product.nameKey) : product.name) : t('productDetail.notFound')}
          </h1>
        </div>

        {product ? (
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="overflow-hidden rounded-xl bg-muted">
                {product.image ? (
                  <img src={product.image} alt={product.nameKey ? t(product.nameKey) : product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-64 items-center justify-center bg-gradient-to-br from-secondary to-muted">
                    <span className="font-display text-6xl text-muted-foreground/30">
                      {product.nameKey ? t(product.nameKey)[0] : product.name[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="font-medium">{product.averageRating.toFixed(1)}</span>
                    <span className="text-xs">({product.reviewCount} {t('productDetail.reviews')})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{product.preparationTime} {t('productDetail.min')}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-semibold text-primary">${product.price.toFixed(2)}</div>
                </div>
              </div>

              <p className="mb-6 text-muted-foreground">
                {product.descriptionKey ? t(product.descriptionKey) : product.description}
              </p>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value || 1)))}
                    className="w-20"
                  />
                </div>

                <Button size="lg" onClick={handleAdd}>
                  <Plus className="mr-2 h-4 w-4" /> {t('productDetail.addToCart')}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-card p-6 shadow-card">
            <p className="text-muted-foreground">{t('productDetail.productNotFoundText')} <strong>{id}</strong></p>
            <p className="mt-3 text-muted-foreground">{t('productDetail.demoPlaceholder')}</p>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default ProductDetail;
