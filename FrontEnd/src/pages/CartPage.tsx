import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Ticket } from 'lucide-react';
import { CustomerLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/features/cart';
import { EmptyState } from '@/components/EmptyState';
import { useState } from 'react';

const CartPage = () => {
  const { cart, updateQuantity, removeItem, itemCount } = useCart();
  const [couponCode, setCouponCode] = useState('');

  if (itemCount === 0) {
    return (
      <CustomerLayout>
        <div className="container py-16">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Looks like you haven't added any items to your cart yet. Browse our menu to get started!"
            action={
              <Link to="/menu">
                <Button variant="hero">
                  Browse Menu
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
        <h1 className="mb-8 font-display text-3xl font-bold text-foreground">Your Cart</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="space-y-4 lg:col-span-2">
            {cart.items.map(item => (
              <div
                key={item.product.id}
                className="flex gap-4 rounded-xl bg-card p-4 shadow-card"
              >
                {/* Image */}
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.product.image ? (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-display text-2xl text-muted-foreground/30">
                        {item.product.name[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-card-foreground">
                      {item.product.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                      {item.product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Price & Remove */}
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-primary">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
                Order Summary
              </h2>

              {/* Coupon */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline">Apply</Button>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${cart.subtotal.toFixed(2)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-success">-${cart.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="font-medium">${cart.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-card-foreground">Total</span>
                    <span className="text-lg font-bold text-primary">${cart.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Link to="/checkout">
                <Button variant="hero" className="mt-6 w-full" size="lg">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              {/* Continue Shopping */}
              <Link to="/menu" className="mt-3 block">
                <Button variant="ghost" className="w-full">
                  Continue Shopping
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
