import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, CreditCard, Truck, Store, Phone, Mail, User, Loader2, ShieldX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomerLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/features/cart';
import { useAuth } from '@/auth';
import { toast } from '@/hooks/use-toast';
import { AddressAutocomplete, type AddressResult } from '@/components/AddressAutocomplete';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7156';
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

const STAFF_ROLES = ['admin', 'moderator', 'chef', 'courier', 'waiter'];

const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
  'Content-Type': 'application/json',
});

const DeliveryTypeEnum = { Delivery: 1, Pickup: 2, DineIn: 3 } as const;

const getUserIdFromToken = (): string => {
  const token = localStorage.getItem('auth_token');
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
  } catch { return ''; }
};

export default function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();

  // ── Staff yoxlaması ──────────────────────────────────────────────────────
  if (user && STAFF_ROLES.includes(user.role ?? '')) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Giriş icazəniz yoxdur</h2>
          <p className="text-muted-foreground max-w-sm">
            Staff hesabları sifariş edə bilməz. Bu funksiya yalnız müştərilər üçündür.
          </p>
        </div>
      </CustomerLayout>
    );
  }

  const { couponId, couponDiscount, appliedCoupon } = (location.state as any) ?? {};

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  const [addressInput, setAddressInput] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState<AddressResult | null>(null);

  const [formData, setFormData] = useState({
    firstName: (user as any)?.firstName || '',
    lastName: (user as any)?.lastName || '',
    email: (user as any)?.email || '',
    phone: (user as any)?.phone || '',
    specialInstructions: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressSelect = (result: AddressResult) => {
    setResolvedAddress(result);
    setAddressInput(result.displayName);
  };

  const discount = couponDiscount ?? cart.discount ?? 0;
  const total = cart.subtotal - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({ title: 'Xəta', description: 'Zəruri sahələri doldurun', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    if (deliveryType === 'delivery' && !resolvedAddress) {
      toast({ title: 'Xəta', description: 'Çatdırılma ünvanını siyahıdan seçin', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    const userId = getUserIdFromToken();
    if (!userId) {
      toast({ title: 'Xəta', description: 'Zəhmət olmasa yenidən daxil olun', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    const deliveryAddress = resolvedAddress
      ? `${resolvedAddress.street}, ${resolvedAddress.city}, ${resolvedAddress.country}`
      : null;

    const orderPayload = {
      userId,
      tableId: null,
      tableNumber: null,
      items: cart.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      orderNotes: formData.specialInstructions || null,
      deliveryAddress,
      couponId: couponId ?? null,
      type: deliveryType === 'delivery' ? DeliveryTypeEnum.Delivery : DeliveryTypeEnum.Pickup,
      deliveryLatitude: resolvedAddress?.latitude ?? null,
      deliveryLongitude: resolvedAddress?.longitude ?? null,
    };

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.title || `Xəta: ${res.status}`);
      }

      const data: any = await res.json();
      const orderId: string = (data.orderId?.id ?? data.orderId ?? '').toString();
      const orderNumber: string = data.orderId?.orderNumber ?? data.orderNumber ?? '';

      if (paymentMethod === 'card') {
        const stripePayload = { amount: total, orderId, userId, frontendUrl: FRONTEND_URL };
        const stripeRes = await fetch(`${API_BASE}/api/payment/create-checkout-session`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(stripePayload),
        });

        const stripeRawText = await stripeRes.text();
        if (!stripeRes.ok) {
          let errMsg = 'Stripe session yaradılmadı';
          try {
            const errJson = JSON.parse(stripeRawText);
            errMsg = errJson.error || errJson.message || errMsg;
          } catch { errMsg = stripeRawText || errMsg; }
          throw new Error(errMsg);
        }

        const { url } = JSON.parse(stripeRawText);
        clearCart();
        window.location.href = url;
        return;
      }

      toast({
        title: '🎉 Sifariş qəbul edildi!',
        description: orderNumber ? `Sifariş №: ${orderNumber}` : 'Sifarişiniz qəbul edildi',
      });
      clearCart();

      if (deliveryType === 'delivery' && orderId) {
        navigate(`/order-tracking/${orderId}`);
      } else {
        navigate('/menu');
      }
    } catch (err: any) {
      toast({ title: 'Sifariş xətası', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="container max-w-6xl py-8">
        <h1 className="mb-8 font-display text-3xl font-bold">{t('checkout.title', 'Ödəniş')}</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">

              <Card>
                <CardHeader><CardTitle>{t('checkout.deliveryType', 'Çatdırılma Növü')}</CardTitle></CardHeader>
                <CardContent>
                  <RadioGroup
                    value={deliveryType}
                    onValueChange={(v: 'delivery' | 'pickup') => {
                      setDeliveryType(v);
                      setResolvedAddress(null);
                      setAddressInput('');
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {[
                      { value: 'delivery', icon: <Truck className="mb-3 h-6 w-6" />, label: t('checkout.delivery', 'Çatdırılma'), desc: t('checkout.deliveryDesc', 'Ünvanınıza çatdırılsın') },
                      { value: 'pickup', icon: <Store className="mb-3 h-6 w-6" />, label: t('checkout.pickup', 'Özüm Götürəcəm'), desc: t('checkout.pickupDesc', 'Restorandan özünüz götürün') },
                    ].map(opt => (
                      <div key={opt.value}>
                        <RadioGroupItem value={opt.value} id={opt.value} className="peer sr-only" />
                        <Label htmlFor={opt.value} className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                          {opt.icon}
                          <div className="text-center">
                            <div className="font-semibold">{opt.label}</div>
                            <div className="text-sm text-muted-foreground">{opt.desc}</div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>{t('checkout.contactInfo', 'Əlaqə Məlumatları')}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('checkout.firstName', 'Ad')} *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input name="firstName" value={formData.firstName} onChange={handleInputChange} className="pl-10" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('checkout.lastName', 'Soyad')} *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input name="lastName" value={formData.lastName} onChange={handleInputChange} className="pl-10" required />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('checkout.email', 'Email')} *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input name="email" type="email" value={formData.email} onChange={handleInputChange} className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('checkout.phone', 'Telefon Nömrəsi')} *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="pl-10" placeholder="+994 50 123 45 67" required />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {deliveryType === 'delivery' && (
                <Card>
                  <CardHeader><CardTitle>{t('checkout.deliveryAddress', 'Çatdırılma Ünvanı')}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label>Ünvan * <span className="text-xs text-muted-foreground font-normal">(yazdıqca təkliflər çıxır)</span></Label>
                      <AddressAutocomplete
                        value={addressInput}
                        onChange={(val) => {
                          setAddressInput(val);
                          if (resolvedAddress && val !== resolvedAddress.displayName) setResolvedAddress(null);
                        }}
                        onSelect={handleAddressSelect}
                        placeholder="Yasamal, Bakı..."
                        required
                      />
                    </div>
                    {resolvedAddress && (
                      <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 text-sm space-y-1">
                        <p className="font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> Ünvan təsdiqləndi
                        </p>
                        <p><span className="text-muted-foreground">Küçə:</span> <span className="font-medium">{resolvedAddress.street}</span></p>
                        <p><span className="text-muted-foreground">Şəhər:</span> <span className="font-medium">{resolvedAddress.city}</span></p>
                        <p><span className="text-muted-foreground">Ölkə:</span> <span className="font-medium">{resolvedAddress.country}</span></p>
                        <p className="text-xs text-muted-foreground font-mono">📍 {resolvedAddress.latitude.toFixed(5)}, {resolvedAddress.longitude.toFixed(5)}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">ℹ️ Açılan siyahıdan ünvanı seçin — koordinatlar avtomatik yadda saxlanılır</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle>{t('checkout.specialInstructions', 'Xüsusi Qeydlər')}</CardTitle></CardHeader>
                <CardContent>
                  <Textarea name="specialInstructions" value={formData.specialInstructions} onChange={handleInputChange} placeholder={t('checkout.instructionsPlaceholder', 'Sifarişiniz üçün xüsusi qeydlər...')} rows={3} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>{t('checkout.paymentMethod', 'Ödəniş Üsulu')}</CardTitle></CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={(v: 'card' | 'cash') => setPaymentMethod(v)} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="cursor-pointer">💵 {t('checkout.cashOnDelivery', 'Qapıda Ödəniş')}</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="h-4 w-4" />
                        {t('checkout.creditCard', 'Kredit Kartı')} — Stripe ilə təhlükəsiz ödəniş
                      </Label>
                    </div>
                  </RadioGroup>
                  {paymentMethod === 'card' && (
                    <div className="mt-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Sifarişi tamamladıqdan sonra Stripe-ın təhlükəsiz ödəniş səhifəsinə yönləndiriləcəksiniz.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader><CardTitle>{t('checkout.orderSummary', 'Sifariş Xülasəsi')}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cart.items.map(item => (
                      <div key={item.product.id} className="flex justify-between text-sm">
                        <span className="flex-1">{item.quantity}x {item.product.name}</span>
                        <span className="font-medium">₼{(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('cart.subtotal', 'Ara Cəm')}</span>
                      <span>₼{cart.subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1">
                          {t('order.discount', 'Endirim')}
                          {appliedCoupon && (
                            <Badge variant="outline" className="text-xs h-4 px-1 text-green-600 border-green-500">
                              {appliedCoupon.code}
                            </Badge>
                          )}
                        </span>
                        <span>-₼{discount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('cart.total', 'Cəmi')}</span>
                    <span className="text-primary">₼{total.toFixed(2)}</span>
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isProcessing}>
                    {isProcessing
                      ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t('checkout.processing', 'Emal edilir...')}</>
                      : paymentMethod === 'card' ? '💳 Stripe ilə Ödə' : t('checkout.placeOrder', 'Sifarişi Tamamla')}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">{t('checkout.secureCheckout', 'Təhlükəsiz Ödəniş')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}