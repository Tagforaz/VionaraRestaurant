import { useState, useEffect } from 'react';
import { Star, Send, CheckCircle, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7156';

function getUserIdFromToken(): string {
  const token = localStorage.getItem('auth_token');
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
  } catch { return ''; }
}

export interface ReviewableItem {
  productId: string;
  productName: string;
}

export interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  // ✅ Rəy uğurla göndərildikdə çağırılır — düyməni gizlətmək üçün
  onSubmitted?: () => void;
  orderId: string | null;
  orderNumber: string | null;
  items: ReviewableItem[];
}

interface ReviewState {
  productId: string;
  productName: string;
  rating: number;
  comment: string;
  alreadySubmitted: boolean;
  alreadyApproved: boolean;
}

const StarRating = ({
  value, onChange, disabled,
}: { value: number; onChange: (v: number) => void; disabled?: boolean }) => {
  const [hovered, setHovered] = useState(0);
  const labels = ['', 'Çox pis', 'Pis', 'Orta', 'Yaxşı', 'Əla!'];

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(star)}
            onMouseEnter={() => !disabled && setHovered(star)}
            onMouseLeave={() => !disabled && setHovered(0)}
            className={`transition-transform ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:scale-110 cursor-pointer'}`}
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                star <= (hovered || value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <p className="text-xs font-medium text-amber-500">{labels[hovered || value]}</p>
      )}
    </div>
  );
};

export const ReviewModal = ({ open, onClose, onSubmitted, orderId, orderNumber, items }: ReviewModalProps) => {
  const { toast } = useToast();
  const [reviews, setReviews]       = useState<ReviewState[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [checking, setChecking]     = useState(true);

  useEffect(() => {
    if (!open || items.length === 0) return;

    const init = async () => {
      setChecking(true);
      // ✅ Modal hər açılanda submitted sıfırla
      setSubmitted(false);

      const unique = Array.from(new Map(items.map(i => [i.productId, i])).values());

      const initial: ReviewState[] = unique.map(item => ({
        productId: item.productId,
        productName: item.productName,
        rating: 0,
        comment: '',
        alreadySubmitted: false,
        alreadyApproved: false,
      }));

      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE}/api/reviews?page=1&take=100`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (res.ok) {
          const data = await res.json();
          const list: any[] = Array.isArray(data) ? data : data.data ?? [];

          for (const rev of initial) {
            const existing = list.find(
              (r: any) => r.orderId === orderId && r.productId === rev.productId
            );
            if (existing) {
              rev.rating           = existing.rating;
              rev.comment          = existing.comment;
              rev.alreadySubmitted = true;
              rev.alreadyApproved  = existing.isApproved === true;
            }
          }
        }
      } catch {}

      setReviews(initial);
      setChecking(false);
    };

    init();
  }, [open, orderId, items]);

  const update = (productId: string, field: 'rating' | 'comment', value: number | string) => {
    setReviews(prev =>
      prev.map(r =>
        r.productId === productId && !r.alreadyApproved
          ? { ...r, [field]: value }
          : r
      )
    );
  };

  const handleSubmit = async () => {
    const userId = getUserIdFromToken();
    if (!userId || !orderId) return;

    const pending = reviews.filter(r => !r.alreadySubmitted && !r.alreadyApproved);

    if (pending.length === 0) {
      toast({ title: 'Məlumat', description: 'Bütün rəylər artıq göndərilib' });
      return;
    }

    for (const r of pending) {
      if (r.rating === 0) {
        toast({ title: 'Xəta', description: `"${r.productName}" üçün qiymət seçin`, variant: 'destructive' });
        return;
      }
      if (!r.comment.trim()) {
        toast({ title: 'Xəta', description: `"${r.productName}" üçün şərh yazın (məcburi)`, variant: 'destructive' });
        return;
      }
      if (r.comment.trim().length > 1000) {
        toast({ title: 'Xəta', description: 'Şərh 1000 simvoldan çox ola bilməz', variant: 'destructive' });
        return;
      }
    }

    setSubmitting(true);
    const token = localStorage.getItem('auth_token');
    let successCount = 0;

    for (const r of pending) {
      try {
        const res = await fetch(`${API_BASE}/api/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            userId,
            orderId,
            productId: r.productId,
            rating: r.rating,
            comment: r.comment.trim(),
          }),
        });

        if (res.ok) {
          setReviews(prev =>
            prev.map(rev =>
              rev.productId === r.productId ? { ...rev, alreadySubmitted: true } : rev
            )
          );
          successCount++;
        } else {
          const errData = await res.json().catch(() => ({}));
          const msg = errData?.errors?.Comment?.[0] ?? errData?.message ?? `HTTP ${res.status}`;
          toast({ title: `"${r.productName}" — Xəta`, description: msg, variant: 'destructive' });
        }
      } catch {
        toast({ title: `"${r.productName}" — Xəta`, description: 'Rəy göndərilmədi', variant: 'destructive' });
      }
    }

    setSubmitting(false);

    if (successCount > 0) {
      toast({
        title: '⭐ Rəylər göndərildi!',
        description: `${successCount} rəy moderator təsdiqi üçün gözləyir`,
      });

      if (successCount === pending.length) {
        setSubmitted(true);
        // ✅ onSubmitted callback — OrderTrackingPage-də düyməni gizlətmək üçün
        onSubmitted?.();
        // 1.8 saniyə sonra modal avtomatik bağlanır
        setTimeout(() => onClose(), 1800);
      }
    }
  };

  const pendingCount = reviews.filter(r => !r.alreadySubmitted && !r.alreadyApproved).length;

  // ✅ X ilə bağlayanda — əgər hamısı göndərilibsə, onSubmitted çağır
  const handleClose = () => {
    const allDone = reviews.length > 0 && reviews.every(r => r.alreadySubmitted || r.alreadyApproved);
    if (allDone) onSubmitted?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            Sifariş Rəyi
          </DialogTitle>
          <DialogDescription>
            Sifariş #{orderNumber} — aldığınız məhsulları qiymətləndirin
          </DialogDescription>
        </DialogHeader>

        {checking ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : submitted ? (
          <div className="flex flex-col items-center py-10 gap-4">
            <div className="p-5 bg-green-100 dark:bg-green-950 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <p className="text-lg font-semibold">Rəyiniz qəbul edildi!</p>
            <p className="text-sm text-muted-foreground text-center">
              Geri bildirişiniz məhsulların keyfiyyətinin artırılmasına kömək edir 🙏
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {reviews.map((review, idx) => (
              <div key={review.productId}>
                {idx > 0 && <Separator className="mb-6" />}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-xs font-bold text-amber-600 shrink-0">
                      {idx + 1}
                    </div>
                    <p className="font-semibold flex-1">{review.productName}</p>
                    {review.alreadyApproved && (
                      <Badge className="bg-green-600 text-white gap-1">
                        <CheckCircle className="h-3 w-3" />Təsdiqləndi
                      </Badge>
                    )}
                    {review.alreadySubmitted && !review.alreadyApproved && (
                      <Badge variant="outline" className="text-amber-600 border-amber-600 gap-1">
                        <Loader2 className="h-3 w-3" />Gözləyir
                      </Badge>
                    )}
                  </div>

                  {review.alreadyApproved ? (
                    <div className="pl-11 space-y-2 opacity-70">
                      <StarRating value={review.rating} onChange={() => {}} disabled />
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                        <Lock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <p className="text-muted-foreground">{review.comment}</p>
                      </div>
                      <p className="text-xs text-green-600">Bu rəy moderator tərəfindən təsdiqlənib — dəyişdirilə bilməz</p>
                    </div>
                  ) : review.alreadySubmitted ? (
                    <div className="pl-11 space-y-2 opacity-70">
                      <StarRating value={review.rating} onChange={() => {}} disabled />
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                        <Loader2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0 animate-spin" />
                        <p className="text-muted-foreground">{review.comment || '(şərh yazılmayıb)'}</p>
                      </div>
                      <p className="text-xs text-amber-600">Rəyiniz moderator təsdiqi gözləyir</p>
                    </div>
                  ) : (
                    <div className="pl-11 space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Qiymət *</p>
                        <StarRating value={review.rating} onChange={v => update(review.productId, 'rating', v)} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Şərh <span className="text-red-500">*</span>
                          <span className="text-xs ml-1">(məcburi, maks. 1000 simvol)</span>
                        </p>
                        <Textarea
                          placeholder="Məhsul haqqında fikirlərinizi yazın..."
                          value={review.comment}
                          onChange={e => update(review.productId, 'comment', e.target.value)}
                          rows={2}
                          maxLength={1000}
                          className="resize-none text-sm"
                        />
                        <p className="text-xs text-muted-foreground text-right mt-1">{review.comment.length}/1000</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">Ləğv et</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || pendingCount === 0}
                className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                {pendingCount === 0 ? 'Hamısı Göndərilib' : `Rəyi Göndər (${pendingCount})`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};