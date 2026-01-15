import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CartItem, Product, Coupon, Cart } from '@/types';
import { toast } from '@/hooks/use-toast';

interface CartContextType {
  cart: Cart;
  addItem: (product: Product, quantity?: number, specialInstructions?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateInstructions: (productId: string, instructions: string) => void;
  applyCoupon: (coupon: Coupon, discountAmount: number) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const DELIVERY_FEE = 3.99;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | undefined>();
  const [discount, setDiscount] = useState(0);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [items]);

  const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0;
  const total = subtotal - discount + deliveryFee;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const cart: Cart = {
    items,
    subtotal,
    discount,
    deliveryFee,
    total,
    appliedCoupon,
  };

  const addItem = useCallback((product: Product, quantity = 1, specialInstructions?: string) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }
      
      return [...prev, { product, quantity, specialInstructions }];
    });
    
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setItems(prev => 
      prev.map(item => 
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const updateInstructions = useCallback((productId: string, instructions: string) => {
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, specialInstructions: instructions } : item
      )
    );
  }, []);

  const applyCoupon = useCallback((coupon: Coupon, discountAmount: number) => {
    setAppliedCoupon(coupon);
    setDiscount(discountAmount);
    toast({
      title: 'Coupon applied!',
      description: `You saved $${discountAmount.toFixed(2)}`,
    });
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(undefined);
    setDiscount(0);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedCoupon(undefined);
    setDiscount(0);
  }, []);

  return (
    <CartContext.Provider value={{
      cart,
      addItem,
      removeItem,
      updateQuantity,
      updateInstructions,
      applyCoupon,
      removeCoupon,
      clearCart,
      itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
