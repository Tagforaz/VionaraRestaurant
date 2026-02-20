import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, CreditCard, Truck, Store, Phone, Mail, User, Home, Loader2 } from 'lucide-react';
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

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7156';
const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
  'Content-Type': 'application/json',
});

// DeliveryType enum (backend ilə eyni)
const DeliveryTypeEnum = { Delivery: 1, Pickup: 2, DineIn: 3 } as const;

// JWT-dən userId al
const getUserIdFromToken = (): string => {
  const token = localStorage.getItem('auth_token');
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
  } catch {
    return '';
  }
};

export default function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();

  // CartPage-dən gələn kupon məlumatı
  const { couponId, couponDiscount, appliedCoupon } = (location.state as any) ?? {};

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    firstName: (user as any)?.firstName || '',
    lastName: (user as any)?.lastName || '',
    email: (user as any)?.email || '',
    phone: (user as any)?.phone || '',
    street: '',
    city: 'Bakı',
    country: 'Azərbaycan',
    specialInstructions: '',
  });

  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const name = e.target.name;

    if (name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (value.replace(/\s/g, '').length > 16) return;
    }
    if (name === 'expiryDate') {
      value = value.replace(/\D/g, '');
      if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
      if (value.length > 5) return;
    }
    if (name === 'cvv') {
      value = value.replace(/\D/g, '');
      if (value.length > 3) return;
    }
    setCardData({ ...cardData, [name]: value });
  };

  // ── Ödəniş məbləği hesablaması ─────────────────────────────────────────
  const deliveryFee = 0; // ← həmişə 0
  const discount = couponDiscount ?? cart.discount ?? 0;
  const total = cart.subtotal - discount;

  // ── Sifariş göndər ─────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({ title: t('checkout.error', 'Xəta'), description: t('checkout.fillRequired', 'Zəruri sahələri doldurun'), variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    if (deliveryType === 'delivery' && (!formData.street || !formData.city || !formData.country)) {
      toast({ title: t('checkout.error', 'Xəta'), description: 'Çatdırılma ünvanını doldurun (Küçə, Şəhər, Ölkə)', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardData.cardNumber || !cardData.cardHolder || !cardData.expiryDate || !cardData.cvv) {
        toast({ title: t('checkout.error', 'Xəta'), description: t('checkout.fillCardDetails', 'Kart məlumatlarını doldurun'), variant: 'destructive' });
        setIsProcessing(false);
        return;
      }
      if (cardData.cardNumber.replace(/\s/g, '').length !== 16) {
        toast({ title: t('checkout.error', 'Xəta'), description: 'Kart nömrəsi 16 rəqəm olmalıdır', variant: 'destructive' });
        setIsProcessing(false);
        return;
      }
      if (cardData.cvv.length !== 3) {
        toast({ title: t('checkout.error', 'Xəta'), description: 'CVV 3 rəqəm olmalıdır', variant: 'destructive' });
        setIsProcessing(false);
        return;
      }
    }

    const userId = getUserIdFromToken();
    if (!userId) {
      toast({ title: 'Xəta', description: 'Zəhmət olmasa yenidən daxil olun', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    // Address.Create() formatı: "Küçə, Şəhər, Ölkə"
    const deliveryAddress = deliveryType === 'delivery'
      ? `${formData.street}, ${formData.city}, ${formData.country}`
      : null;

    // PostOrderDto
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

      // Backend CreatedAtAction ilə GetOrderDto qaytarır
      // data.id, data.orderNumber birbaşa GetOrderDto sahələridir
      const data: any = await res.json();
      const orderId: string = data.id ?? data.value?.id ?? '';
      const orderNumber: string = data.orderNumber ?? data.value?.orderNumber ?? '';

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
        <h1 className="mb-8 font-display text-3xl font-bold">
          {t('checkout.title', 'Ödəniş')}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Sol sütun */}
            <div className="space-y-6 lg:col-span-2">

              {/* Çatdırılma növü */}
              <Card>
                <CardHeader><CardTitle>{t('checkout.deliveryType', 'Çatdırılma Növü')}</CardTitle></CardHeader>
                <CardContent>
                  <RadioGroup
                    value={deliveryType}
                    onValueChange={(v: 'delivery' | 'pickup') => setDeliveryType(v)}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {[
                      { value: 'delivery', icon: <Truck className="mb-3 h-6 w-6" />, label: t('checkout.delivery', 'Çatdırılma'), desc: t('checkout.deliveryDesc', 'Ünvanınıza çatdırılsın') },
                      { value: 'pickup', icon: <Store className="mb-3 h-6 w-6" />, label: t('checkout.pickup', 'Özüm Götürəcəm'), desc: t('checkout.pickupDesc', 'Restorandan özünüz götürün') },
                    ].map(opt => (
                      <div key={opt.value}>
                        <RadioGroupItem value={opt.value} id={opt.value} className="peer sr-only" />
                        <Label
                          htmlFor={opt.value}
                          className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
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

              {/* Əlaqə məlumatları */}
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

              {/* Çatdırılma ünvanı — Address.Create() formatı: "Küçə, Şəhər, Ölkə" */}
              {deliveryType === 'delivery' && (
                <Card>
                  <CardHeader><CardTitle>{t('checkout.deliveryAddress', 'Çatdırılma Ünvanı')}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('checkout.streetAddress', 'Küçə Ünvanı')} *</Label>
                      <div className="relative">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          name="street"
                          value={formData.street}
                          onChange={handleInputChange}
                          className="pl-10"
                          placeholder="Qədirli küçəsi 130"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('checkout.city', 'Şəhər')} *</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input name="city" value={formData.city} onChange={handleInputChange} className="pl-10" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Ölkə *</Label>
                        <Input name="country" value={formData.country} onChange={handleInputChange} required />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ℹ️ Format: Küçə ünvanı, Şəhər, Ölkə — məs: <em>Qədirli küçəsi 130, Bakı, Azərbaycan</em>
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Xüsusi qeydlər */}
              <Card>
                <CardHeader><CardTitle>{t('checkout.specialInstructions', 'Xüsusi Qeydlər')}</CardTitle></CardHeader>
                <CardContent>
                  <Textarea
                    name="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={handleInputChange}
                    placeholder={t('checkout.instructionsPlaceholder', 'Sifarişiniz üçün xüsusi qeydlər əlavə edin...')}
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Ödəniş üsulu */}
              <Card>
                <CardHeader><CardTitle>{t('checkout.paymentMethod', 'Ödəniş Üsulu')}</CardTitle></CardHeader>
                <CardContent>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(v: 'card' | 'cash') => setPaymentMethod(v)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="cursor-pointer">💵 {t('checkout.cashOnDelivery', 'Qapıda Ödəniş')}</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="h-4 w-4" />
                        {t('checkout.creditCard', 'Kredit Kartı')}
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === 'card' && (
                    <div className="mt-6 space-y-4 p-4 border rounded-lg bg-muted/30">
                      <h3 className="font-semibold text-sm">{t('checkout.cardDetails', 'Kart Məlumatları')}</h3>
                      <div className="space-y-2">
                        <Label>{t('checkout.cardNumber', 'Kart Nömrəsi')} *</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input name="cardNumber" value={cardData.cardNumber} onChange={handleCardInputChange} className="pl-10" placeholder="1234 5678 9012 3456" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('checkout.cardHolder', 'Kart Sahibi')} *</Label>
                        <Input name="cardHolder" value={cardData.cardHolder} onChange={handleCardInputChange} placeholder="JOHN DOE" className="uppercase" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('checkout.expiryDate', 'Son İstifadə Tarixi')} *</Label>
                          <Input name="expiryDate" value={cardData.expiryDate} onChange={handleCardInputChange} placeholder="MM/YY" />
                        </div>
                        <div className="space-y-2">
                          <Label>CVV *</Label>
                          <Input name="cvv" type="password" value={cardData.cvv} onChange={handleCardInputChange} placeholder="123" maxLength={3} />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sağ sütun — Sifariş xülasəsi */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader><CardTitle>{t('checkout.orderSummary', 'Sifariş Xülasəsi')}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {/* Məhsullar */}
                  <div className="space-y-3">
                    {cart.items.map(item => (
                      <div key={item.product.id} className="flex justify-between text-sm">
                        <span className="flex-1">{item.quantity}x {item.product.name}</span>
                        <span className="font-medium">₼{(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Məbləğlər */}
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

                    {/* Çatdırılma haqqı bloku silindi */}
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('cart.total', 'Cəmi')}</span>
                    <span className="text-primary">₼{total.toFixed(2)}</span>
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isProcessing}>
                    {isProcessing
                      ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t('checkout.processing', 'Emal edilir...')}</>
                      : t('checkout.placeOrder', 'Sifarişi Tamamla')}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    {t('checkout.secureCheckout', 'Təhlükəsiz Ödəniş')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}