import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CustomerLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Clock, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { useCart } from '@/features/cart';
import { Product } from '@/types';
import { useTranslation } from 'react-i18next';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7156';

const ProductDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_BASE}/api/products/${id}`)
      .then(res => {
        if (!res.ok) { setNotFound(true); return null; }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        setProduct({
          id: data.id,
          name: data.name,
          description: data.description,
          price: data.price,
          image: data.imageUrl ?? undefined,
          imageUrl: data.imageUrl ?? undefined,
          categoryId: data.categoryId,
          isAvailable: data.isAvailable,
          isPopular: false,
          preparationTime: 0,
          averageRating: data.averageRating ?? 0,
          reviewCount: data.reviewCount ?? 0,
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

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
            {loading ? '...' : product ? product.name : t('productDetail.notFound')}
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : notFound || !product ? (
          <div className="rounded-xl bg-card p-6 shadow-card">
            <p className="text-muted-foreground">
              {t('productDetail.productNotFoundText')} <strong>{id}</strong>
            </p>
            <p className="mt-3 text-muted-foreground">{t('productDetail.demoPlaceholder')}</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {/* Image */}
            <div className="md:col-span-1">
              <div className="overflow-hidden rounded-xl bg-muted">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center bg-gradient-to-br from-secondary to-muted">
                    <span className="font-display text-6xl text-muted-foreground/30">
                      {product.name[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="md:col-span-2">
              {/* Rating, prep time, price */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="font-medium">{product.averageRating.toFixed(1)}</span>
                    <span className="text-xs">({product.reviewCount} {t('productDetail.reviews')})</span>
                  </div>
                  {product.preparationTime && product.preparationTime > 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{product.preparationTime} {t('productDetail.min')}</span>
                    </div>
                  ) : null}
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-primary">{product.price.toFixed(2)} ₼</div>
                </div>
              </div>

              {/* Description */}
              <p className="mb-6 text-muted-foreground">{product.description}</p>

              {/* Add to cart */}
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value || 1)))}
                  className="w-20"
                />
                <Button size="lg" onClick={handleAdd} disabled={!product.isAvailable}>
                  <Plus className="mr-2 h-4 w-4" />
                  {product.isAvailable ? t('productDetail.addToCart') : 'Mövcud deyil'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default ProductDetail;