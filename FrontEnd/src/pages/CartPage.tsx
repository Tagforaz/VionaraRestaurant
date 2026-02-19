import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Ticket, Loader2, X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomerLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/features/cart';
import { EmptyState } from '@/components/EmptyState';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7156';
const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
  'Content-Type': 'application/json',
});

// DiscountType: 1=Percentage, 2=FixedAmount
interface AppliedCoupon {
  id: string;
  code: string;
  discountType: number;
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
}

const CartPage = () => {
  const { t } = useTranslation();
  const { cart, updateQuantity, removeItem, itemCount } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // ── Kupon hesablaması ────────────────────────────────────────────────────
  const calculateDiscount = (coupon: AppliedCoupon, subtotal: number): number => {
    if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) return 0;

    let discount = 0;
    if (coupon.discountType === 1) {
      // Faiz
      discount = (subtotal * coupon.discountValue) / 100;
    } else {
      // Sabit məbləğ
      discount = coupon.discountValue;
    }

    // Maksimum endirim məbləği
    if (coupon.maximumDiscountAmount && discount > coupon.maximumDiscountAmount) {
      discount = coupon.maximumDiscountAmount;
    }

    return Math.min(discount, subtotal);
  };

  const couponDiscount = appliedCoupon ? calculateDiscount(appliedCoupon, cart.subtotal) : 0;
  const total = cart.subtotal + cart.deliveryFee - couponDiscount;

  // ── Kupon tətbiq et ──────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (appliedCoupon) {
      toast({ title: 'Xəbərdarlıq', description: 'Artıq kupon tətbiq olunub. Əvvəlcə silин.', variant: 'destructive' });
      return;
    }

    setCouponLoading(true);
    try {
      // Bütün kuponları çəkib kod ilə filterlə
      const res = await fetch(`${API_BASE}/api/coupons?page=1&take=100`, {
        headers: authHeaders(),
      });

      if (!res.ok) throw new Error('Kuponlar yüklənmədi');

      const data = await res.json();
      const coupons: any[] = Array.isArray(data) ? data : data.data ?? [];

      // Kod ilə tap — GetCouponItemDto-da tam məlumat yoxdur, GetCouponDto lazımdır
      const match = coupons.find((c: any) =>
        c.code?.toUpperCase() === code && c.isActive
      );

      if (!match) {
        toast({ title: 'Xəta', description: 'Kupon tapılmadı və ya deaktivdir', variant: 'destructive' });
        return;
      }

      // Tam detalları al (GetCouponDto — minimumOrderAmount, maximumDiscountAmount var)
      const detailRes = await fetch(`${API_BASE}/api/coupons/${match.id}`, {
        headers: authHeaders(),
      });

      if (!detailRes.ok) throw new Error('Kupon detalları alınmadı');
      const detail = await detailRes.json();

      // Müddət yoxlaması
      const now = new Date();
      const validFrom = new Date(detail.validFrom);
      const validTo = new Date(detail.validTo);

      if (now < validFrom || now > validTo) {
        toast({ title: 'Xəta', description: 'Bu kuponun müddəti bitib və ya hələ aktiv deyil', variant: 'destructive' });
        return;
      }

      // Minimum sifariş məbləği yoxlaması
      if (detail.minimumOrderAmount && cart.subtotal < detail.minimumOrderAmount) {
        toast({
          title: 'Xəta',
          description: `Bu kupon üçün minimum sifariş məbləği ₼${detail.minimumOrderAmount} olmalıdır`,
          variant: 'destructive',
        });
        return;
      }

      // İstifadə limiti yoxlaması
      if (detail.usageLimit && detail.usageCount >= detail.usageLimit) {
        toast({ title: 'Xəta', description: 'Bu kuponun istifadə limiti dolub', variant: 'destructive' });
        return;
      }

      const coupon: AppliedCoupon = {
        id: detail.id,
        code: detail.code,
        discountType: detail.discountType,
        discountValue: detail.discountValue,
        minimumOrderAmount: detail.minimumOrderAmount,
        maximumDiscountAmount: detail.maximumDiscountAmount,
      };

      const discount = calculateDiscount(coupon, cart.subtotal);
      setAppliedCoupon(coupon);

      toast({
        title: '🎉 Kupon tətbiq edildi!',
        description: `${coupon.discountType === 1 ? `${coupon.discountValue}%` : `₼${coupon.discountValue}`} endirim — Siz ₼${discount.toFixed(2)} qənaət etdiniz`,
      });
    } catch (err: any) {
      toast({ title: 'Xəta', description: err.message, variant: 'destructive' });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast({ title: 'Kupon silindi' });
  };

  // ── Empty state ──────────────────────────────────────────────────────────
  if (itemCount === 0) {
    return (
      <CustomerLayout>
        <div className="container py-16">
          <EmptyState
            icon={ShoppingBag}
            title={t('cart.empty')}
            description={t('cart.emptyDescription')}
            action={
              <Link to="/menu">
                <Button variant="hero">
                  {t('cart.browseMenu')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            }
          />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container py-8">
        <h1 className="mb-8 font-display text-3xl font-bold text-foreground">{t('cart.title')}</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="space-y-4 lg:col-span-2">
            {cart.items.map(item => (
              <div key={item.product.id} className="flex gap-4 rounded-xl bg-card p-4 shadow-card">
                {/* Image */}
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.product.image ? (
                    <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-display text-2xl text-muted-foreground/30">{item.product.name[0]}</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-card-foreground">{item.product.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{item.product.description}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Price & Remove */}
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-primary">
                        ₼{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-xl bg-card p-6 shadow-card">
              <h2 className="mb-6 font-display text-xl font-semibold text-card-foreground">
                {t('cart.orderSummary')}
              </h2>

              {/* Coupon */}
              <div className="mb-6">
                {appliedCoupon ? (
                  // Tətbiq edilmiş kupon göstəricisi
                  <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {appliedCoupon.code}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appliedCoupon.discountType === 1
                            ? `${appliedCoupon.discountValue}% endirim`
                            : `₼${appliedCoupon.discountValue} endirim`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={handleRemoveCoupon}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  // Kupon giriş sahəsi
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Ticket className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={t('cart.couponPlaceholder', 'Kupon kodu')}
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                        className="pl-10"
                        disabled={couponLoading}
                      />
                    </div>
                    <Button variant="outline" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()}>
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('cart.apply', 'Tətbiq Et')}
                    </Button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('cart.subtotal', 'Ara Cəm')}</span>
                  <span className="font-medium">₼{cart.subtotal.toFixed(2)}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      {t('cart.discount', 'Endirim')}
                      <Badge variant="outline" className="text-xs h-4 px-1 text-green-600 border-green-500">
                        {appliedCoupon?.code}
                      </Badge>
                    </span>
                    <span className="font-medium text-green-600">-₼{couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                {cart.discount > 0 && couponDiscount === 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('cart.discount', 'Endirim')}</span>
                    <span className="font-medium text-green-600">-₼{cart.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('cart.deliveryFee', 'Çatdırılma Haqqı')}</span>
                  <span className="font-medium">₼{cart.deliveryFee.toFixed(2)}</span>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-card-foreground">{t('cart.total', 'Cəmi')}</span>
                    <span className="text-lg font-bold text-primary">₼{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout — couponId state-i checkout-a ötür */}
              <Link
                to="/checkout"
                state={{ couponId: appliedCoupon?.id, couponDiscount, appliedCoupon }}
              >
                <Button variant="hero" className="mt-6 w-full" size="lg">
                  {t('cart.checkout', 'Sifarişi Rəsmiləşdir')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link to="/menu" className="mt-3 block">
                <Button variant="ghost" className="w-full">
                  {t('cart.continueShopping', 'Alış-verişə Davam Et')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CartPage;