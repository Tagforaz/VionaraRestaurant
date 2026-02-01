import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Truck, Store, Phone, Mail, User, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomerLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/features/cart';
import { useAuth } from '@/auth';
import { toast } from '@/hooks/use-toast';
import { DeliveryType } from '@/types';

export default function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address?.street || '',
    city: user?.address?.city || 'Bakı',
    zipCode: user?.address?.zipCode || '',
    specialInstructions: '',
  });

  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const name = e.target.name;

    // Format card number (16 digits with spaces)
    if (name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (value.replace(/\s/g, '').length > 16) return;
    }

    // Format expiry date (MM/YY)
    if (name === 'expiryDate') {
      value = value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
      }
      if (value.length > 5) return;
    }

    // Format CVV (3 digits)
    if (name === 'cvv') {
      value = value.replace(/\D/g, '');
      if (value.length > 3) return;
    }

    setCardData({
      ...cardData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({
        title: t('checkout.error'),
        description: t('checkout.fillRequired'),
        variant: 'destructive',
      });
      setIsProcessing(false);
      return;
    }

    if (deliveryType === 'delivery' && (!formData.address || !formData.city)) {
      toast({
        title: t('checkout.error'),
        description: t('checkout.fillAddress'),
        variant: 'destructive',
      });
      setIsProcessing(false);
      return;
    }

    // Validate card details if card payment is selected
    if (paymentMethod === 'card') {
      if (!cardData.cardNumber || !cardData.cardHolder || !cardData.expiryDate || !cardData.cvv) {
        toast({
          title: t('checkout.error'),
          description: t('checkout.fillCardDetails'),
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      // Validate card number (16 digits)
      if (cardData.cardNumber.replace(/\s/g, '').length !== 16) {
        toast({
          title: t('checkout.error'),
          description: t('checkout.invalidCardNumber'),
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      // Validate CVV (3 digits)
      if (cardData.cvv.length !== 3) {
        toast({
          title: t('checkout.error'),
          description: t('checkout.invalidCVV'),
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }
    }

    // Simulate order creation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    toast({
      title: t('checkout.success'),
      description: t('checkout.orderPlaced'),
    });

    clearCart();
    setIsProcessing(false);
    
    // Redirect to order tracking
    if (deliveryType === 'delivery') {
      navigate(`/order-tracking/${orderId}`);
    } else {
      navigate('/menu');
    }
  };

  const deliveryFee = deliveryType === 'delivery' ? cart.deliveryFee : 0;
  const total = cart.subtotal - cart.discount + deliveryFee;

  return (
    <CustomerLayout>
      <div className="container max-w-6xl py-8">
        <h1 className="mb-8 font-display text-3xl font-bold">
          {t('checkout.title')}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Forms */}
            <div className="space-y-6 lg:col-span-2">
              {/* Delivery Type */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('checkout.deliveryType')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={deliveryType}
                    onValueChange={(value: DeliveryType) => setDeliveryType(value)}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="delivery"
                        id="delivery"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="delivery"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Truck className="mb-3 h-6 w-6" />
                        <div className="text-center">
                          <div className="font-semibold">{t('checkout.delivery')}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('checkout.deliveryDesc')}
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="pickup"
                        id="pickup"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="pickup"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Store className="mb-3 h-6 w-6" />
                        <div className="text-center">
                          <div className="font-semibold">{t('checkout.pickup')}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('checkout.pickupDesc')}
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('checkout.contactInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        {t('checkout.firstName')} *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        {t('checkout.lastName')} *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {t('checkout.email')} *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      {t('checkout.phone')} *
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="+994 50 123 45 67"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Address */}
              {deliveryType === 'delivery' && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('checkout.deliveryAddress')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">
                        {t('checkout.streetAddress')} *
                      </Label>
                      <div className="relative">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="pl-10"
                          required={deliveryType === 'delivery'}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">
                          {t('checkout.city')} *
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="pl-10"
                            required={deliveryType === 'delivery'}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">
                          {t('checkout.zipCode')}
                        </Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Special Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('checkout.specialInstructions')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    name="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={handleInputChange}
                    placeholder={t('checkout.instructionsPlaceholder')}
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('checkout.paymentMethod')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value: 'card' | 'cash') => setPaymentMethod(value)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="cursor-pointer">
                        💵 {t('checkout.cashOnDelivery')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="h-4 w-4" />
                        {t('checkout.creditCard')}
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Card Details Form */}
                  {paymentMethod === 'card' && (
                    <div className="mt-6 space-y-4 p-4 border rounded-lg bg-muted/30">
                      <h3 className="font-semibold text-sm">{t('checkout.cardDetails')}</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">
                          {t('checkout.cardNumber')} *
                        </Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="cardNumber"
                            name="cardNumber"
                            value={cardData.cardNumber}
                            onChange={handleCardInputChange}
                            className="pl-10"
                            placeholder="1234 5678 9012 3456"
                            required={paymentMethod === 'card'}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardHolder">
                          {t('checkout.cardHolder')} *
                        </Label>
                        <Input
                          id="cardHolder"
                          name="cardHolder"
                          value={cardData.cardHolder}
                          onChange={handleCardInputChange}
                          placeholder="JOHN DOE"
                          className="uppercase"
                          required={paymentMethod === 'card'}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiryDate">
                            {t('checkout.expiryDate')} *
                          </Label>
                          <Input
                            id="expiryDate"
                            name="expiryDate"
                            value={cardData.expiryDate}
                            onChange={handleCardInputChange}
                            placeholder="MM/YY"
                            required={paymentMethod === 'card'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">
                            CVV *
                          </Label>
                          <Input
                            id="cvv"
                            name="cvv"
                            type="password"
                            value={cardData.cvv}
                            onChange={handleCardInputChange}
                            placeholder="123"
                            maxLength={3}
                            required={paymentMethod === 'card'}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>{t('checkout.orderSummary')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div className="space-y-3">
                    {cart.items.map((item) => (
                      <div key={item.product.id} className="flex justify-between text-sm">
                        <span className="flex-1">
                          {item.quantity}x {item.product.name}
                        </span>
                        <span className="font-medium">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t('cart.subtotal')}
                      </span>
                      <span>${cart.subtotal.toFixed(2)}</span>
                    </div>
                    {cart.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>{t('order.discount')}</span>
                        <span>-${cart.discount.toFixed(2)}</span>
                      </div>
                    )}
                    {deliveryType === 'delivery' && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t('order.deliveryFee')}
                        </span>
                        <span>${deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('cart.total')}</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isProcessing}
                  >
                    {isProcessing
                      ? t('checkout.processing')
                      : t('checkout.placeOrder')}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    {t('checkout.secureCheckout')}
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
