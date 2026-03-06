import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CustomerLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Clock, Plus, ArrowLeft, Loader2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/features/cart';
import { Product } from '@/types';
import { useTranslation } from 'react-i18next';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7156';

const REVIEWS_PER_PAGE = 3;

interface ApiReview {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
  isApproved: boolean;
}

// "nasibshahverdiyev_61658215" → "nasibshahverdiyev"
const formatUserName = (userName: string) => {
  const parts = userName.split('_');
  if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) {
    return parts.slice(0, -1).join('_');
  }
  return userName;
};

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(star => (
      <Star
        key={star}
        className={`h-4 w-4 ${star <= Math.round(rating) ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`}
      />
    ))}
  </div>
);

const ProductDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);
    fetch(`${API_BASE}/api/reviews?productId=${id}&page=1&take=50`)
      .then(res => res.ok ? res.json() : [])
      .then((data: ApiReview[]) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    addItem(product, quantity);
  };

  const formatDate = (dateStr: string) => {
    // Append Z if no timezone info so bare UTC strings are handled correctly
    const normalized = /[Zz]|[+\-]\d{2}:?\d{2}$/.test(dateStr) ? dateStr : dateStr + 'Z';
    const d = new Date(normalized);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Pagination calculations
  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = reviews.slice(
    (currentPage - 1) * REVIEWS_PER_PAGE,
    currentPage * REVIEWS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to reviews section smoothly
    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const ReviewsSection = () => (
    <div id="reviews-section" className="mt-10">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="font-display text-2xl font-bold text-foreground">Rəylər</h2>
        {!reviewsLoading && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {reviews.length}
          </span>
        )}
      </div>

      {reviewsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Star className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="font-medium text-foreground">Hələ rəy yoxdur</p>
          <p className="mt-1 text-sm text-muted-foreground">Bu məhsul üçün ilk rəyi siz yazın</p>
        </div>
      ) : (
        <>
          {/* Rating summary */}
          {product && (
            <div className="mb-6 flex items-center gap-6 rounded-xl border border-border bg-card p-5">
              <div className="text-center">
                <div className="font-display text-5xl font-bold text-foreground">
                  {product.averageRating.toFixed(1)}
                </div>
                <StarRating rating={product.averageRating} />
                <div className="mt-1 text-xs text-muted-foreground">{reviews.length} rəy</div>
              </div>
              <div className="h-16 w-px bg-border" />
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = reviews.filter(r => Math.round(r.rating) === star).length;
                  const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-3 text-right text-xs text-muted-foreground">{star}</span>
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-5 text-xs text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review cards */}
          <div className="space-y-4">
            {paginatedReviews.map(review => (
              <div key={review.id} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{formatUserName(review.userName)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                {review.comment && (
                  <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-9 w-9 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Show first, last, current, and neighbors; collapse others with ellipsis
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1;

                if (!showPage) {
                  // Show ellipsis only once between gaps
                  const prevShown =
                    page - 1 === 1 || Math.abs(page - 1 - currentPage) <= 1;
                  if (!prevShown) return null;
                  return (
                    <span key={`ellipsis-${page}`} className="px-1 text-muted-foreground">
                      …
                    </span>
                  );
                }

                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="h-9 w-9 p-0"
                  >
                    {page}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 w-9 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Page info */}
          {totalPages > 1 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {(currentPage - 1) * REVIEWS_PER_PAGE + 1}–{Math.min(currentPage * REVIEWS_PER_PAGE, reviews.length)} / {reviews.length} rəy
            </p>
          )}
        </>
      )}
    </div>
  );

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
          <>
            {/* Product info */}
            <div className="grid gap-8 md:grid-cols-3">
              <div className="md:col-span-1">
                <div className="overflow-hidden rounded-xl bg-muted">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-64 items-center justify-center bg-gradient-to-br from-secondary to-muted">
                      <span className="font-display text-6xl text-muted-foreground/30">{product.name[0]}</span>
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
                    {product.preparationTime && product.preparationTime > 0 ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{product.preparationTime} {t('productDetail.min')}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="text-xl font-semibold text-primary">{product.price.toFixed(2)} ₼</div>
                </div>

                <p className="mb-6 text-muted-foreground">{product.description}</p>

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

                {/* Reviews inline — below add to cart */}
                <ReviewsSection />
              </div>
            </div>
          </>
        )}
      </div>
    </CustomerLayout>
  );
};

export default ProductDetail;