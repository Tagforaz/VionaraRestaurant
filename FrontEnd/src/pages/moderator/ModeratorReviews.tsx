import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Check, X, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7200';
const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
  'Content-Type': 'application/json',
});

interface Review {
  id: string;
  userId: string;
  orderId?: string;
  productId?: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  // Frontend-də əlavə olunan sahələr
  userName?: string;
  productName?: string;
}

// ── JWT-dən userId al ──────────────────────────────────────────────────────────
const getCurrentUserId = (): string => {
  const token = localStorage.getItem('auth_token');
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
  } catch {
    return '';
  }
};

export const ModeratorReviews = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const previousPendingCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cache: id → name
  const userCache = useRef<Record<string, string>>({});
  const productCache = useRef<Record<string, string>>({});

  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDV/zPLTgjMGHm7A7+OZURE');
    audioRef.current.volume = 0.5;
    fetchReviews();
  }, []);

  // Hər 15 saniyədə yenilə
  useEffect(() => {
    const interval = setInterval(async () => {
      const fresh = await fetchReviewsSilent();
      if (!fresh) return;
      const pendingCount = fresh.filter((r: Review) => !r.isApproved).length;
      if (pendingCount > previousPendingCountRef.current) {
        audioRef.current?.play().catch(() => {});
        toast({ title: '🔔 Yeni Rəy!', description: 'Yeni rəy təsdiq gözləyir', duration: 5000 });
      }
      previousPendingCountRef.current = pendingCount;
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // ── Köməkçi: user adını tap ────────────────────────────────────────────────
  const getUserName = async (userId: string): Promise<string> => {
    if (userCache.current[userId]) return userCache.current[userId];
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, { headers: authHeaders() });
      if (!res.ok) return userId.slice(0, 8) + '...';
      const data = await res.json();
      const name = data.fullName || data.userName || data.email || userId.slice(0, 8) + '...';
      userCache.current[userId] = name;
      return name;
    } catch {
      return userId.slice(0, 8) + '...';
    }
  };

  // ── Köməkçi: product adını tap ─────────────────────────────────────────────
  const getProductName = async (productId: string): Promise<string> => {
    if (productCache.current[productId]) return productCache.current[productId];
    try {
      const res = await fetch(`${API_BASE}/api/products/${productId}`, { headers: authHeaders() });
      if (!res.ok) return '';
      const data = await res.json();
      const name = data.name || '';
      productCache.current[productId] = name;
      return name;
    } catch {
      return '';
    }
  };

  // ── Rəyləri yüklə + adları əlavə et ───────────────────────────────────────
  const enrichReviews = async (list: Review[]): Promise<Review[]> => {
    return await Promise.all(
      list.map(async (review) => {
        const userName = await getUserName(review.userId);
        const productName = review.productId ? await getProductName(review.productId) : undefined;
        return { ...review, userName, productName };
      })
    );
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews?page=1&take=100`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Rəylər yüklənmədi');
      const data = await res.json();
      const list: Review[] = Array.isArray(data) ? data : data.data ?? [];
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const enriched = await enrichReviews(list);
      setReviews(enriched);
      previousPendingCountRef.current = enriched.filter(r => !r.isApproved).length;
    } catch (err: any) {
      toast({ title: 'Xəta', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewsSilent = async (): Promise<Review[] | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/reviews?page=1&take=100`, { headers: authHeaders() });
      if (!res.ok) return null;
      const data = await res.json();
      const list: Review[] = Array.isArray(data) ? data : data.data ?? [];
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const enriched = await enrichReviews(list);
      setReviews(enriched);
      return enriched;
    } catch {
      return null;
    }
  };

  // ── Approve ────────────────────────────────────────────────────────────────
  const handleApprove = async (review: Review) => {
    setUpdatingId(review.id);
    try {
      const userId = getCurrentUserId();
      const res = await fetch(`${API_BASE}/api/reviews/${review.id}/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(userId),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.title || 'Xəta baş verdi');
      }
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, isApproved: true } : r));
      toast({ title: 'Uğurlu', description: 'Rəy təsdiqləndi' });
    } catch (err: any) {
      toast({ title: 'Xəta', description: err.message, variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Unapprove (PUT ilə isApproved=false) ──────────────────────────────────
  const handleUnapprove = async (review: Review) => {
    setUpdatingId(review.id);
    try {
      const res = await fetch(`${API_BASE}/api/reviews/${review.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ rating: review.rating, comment: review.comment, isApproved: false }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.title || 'Xəta baş verdi');
      }
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, isApproved: false } : r));
      toast({ title: 'Uğurlu', description: 'Rəy təsdiqi ləğv edildi' });
    } catch (err: any) {
      toast({ title: 'Xəta', description: err.message, variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/reviews/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.title || 'Xəta baş verdi');
      }
      setReviews(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Uğurlu', description: 'Rəy silindi' });
    } catch (err: any) {
      toast({ title: 'Xəta', description: err.message, variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`} />
    ));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pendingReviews = reviews.filter(r => !r.isApproved);
  const approvedReviews = reviews.filter(r => r.isApproved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/moderator')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('moderator.reviews', 'Rəylər')}</h1>
            <p className="text-muted-foreground">{t('moderator.manageReviews', 'Müştəri rəylərini idarə edin')}</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchReviews}>
          <RefreshCw className="h-4 w-4 mr-2" /> Yenilə
        </Button>
      </div>

      {/* Gözləyən */}
      {pendingReviews.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            🔔 Təsdiq gözləyən ({pendingReviews.length})
          </h2>
          {pendingReviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              updatingId={updatingId}
              onApprove={handleApprove}
              onUnapprove={handleUnapprove}
              onDelete={handleDelete}
              renderStars={renderStars}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Təsdiqlənmiş */}
      {approvedReviews.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            ✅ Təsdiqlənmiş ({approvedReviews.length})
          </h2>
          {approvedReviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              updatingId={updatingId}
              onApprove={handleApprove}
              onUnapprove={handleUnapprove}
              onDelete={handleDelete}
              renderStars={renderStars}
              t={t}
            />
          ))}
        </div>
      )}

      {reviews.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Rəy yoxdur</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ── ReviewCard ─────────────────────────────────────────────────────────────────

interface ReviewCardProps {
  review: Review;
  updatingId: string | null;
  onApprove: (r: Review) => void;
  onUnapprove: (r: Review) => void;
  onDelete: (id: string) => void;
  renderStars: (rating: number) => JSX.Element[];
  t: (key: string, fallback?: string) => string;
}

const ReviewCard = ({ review, updatingId, onApprove, onUnapprove, onDelete, renderStars, t }: ReviewCardProps) => {
  const isUpdating = updatingId === review.id;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {review.userName || review.userId.slice(0, 8) + '...'}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">{renderStars(review.rating)}</div>
              {review.productName && (
                <span className="text-sm text-muted-foreground">• {review.productName}</span>
              )}
              {review.orderId && !review.productId && (
                <span className="text-sm text-muted-foreground">• Sifarişə aid rəy</span>
              )}
            </div>
          </div>
          {review.isApproved ? (
            <Badge className="bg-green-600">{t('moderator.approved', 'Təsdiqlənib')}</Badge>
          ) : (
            <Badge variant="secondary">{t('moderator.pending', 'Gözləyir')}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{review.comment}</p>

        <div className="text-xs text-muted-foreground">
          {new Date(review.createdAt).toLocaleString('az-AZ')}
          {review.approvedAt && (
            <span> • Təsdiqləndi: {new Date(review.approvedAt).toLocaleString('az-AZ')}</span>
          )}
        </div>

        {/* Pending → Approve / Delete */}
        {!review.isApproved && (
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isUpdating}
              onClick={() => onApprove(review)}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              {t('moderator.approve', 'Təsdiqlə')}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={isUpdating}
              onClick={() => onDelete(review.id)}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
              {t('moderator.delete', 'Sil')}
            </Button>
          </div>
        )}

        {/* Approved → Unapprove / Delete */}
        {review.isApproved && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={isUpdating}
              onClick={() => onUnapprove(review)}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
              {t('moderator.unapprove', 'Təsdiqi ləğv et')}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={isUpdating}
              onClick={() => onDelete(review.id)}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
              {t('moderator.delete', 'Sil')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
