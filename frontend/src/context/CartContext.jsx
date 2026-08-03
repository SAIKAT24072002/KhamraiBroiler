import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useSettings } from './SettingsContext';


const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { settings } = useSettings();

  
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('kbc_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [coupon, setCoupon] = useState(null);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    localStorage.setItem('kbc_cart', JSON.stringify(cartItems));
    // Reset coupon validation on cart updates to recalculate rates
    if (coupon) {
      revalidateCoupon(coupon.code);
    }
  }, [cartItems]);

  // Recalculate subtotal
  const subtotal = cartItems.reduce((acc, item) => {
    let price = item.retailPrice;
    
    // Evaluate wholesale tier pricing in cart dynamically
    if (item.quantity >= item.minOrder) {
      let tierPrice = null;
      if (item.wholesaleTiers && item.wholesaleTiers.length > 0) {
        for (const tier of item.wholesaleTiers) {
          if (item.quantity >= tier.minQty && (!tier.maxQty || item.quantity <= tier.maxQty)) {
            tierPrice = tier.price;
            break;
          }
        }
      }
      price = tierPrice !== null ? tierPrice : item.wholesalePrice;
    }
    
    return acc + (price * item.quantity);
  }, 0);

  const revalidateCoupon = async (code) => {
    try {
      const res = await api.post('/coupons/validate', { code, amount: subtotal });
      setCoupon(res.data);
      setCouponError('');
    } catch (err) {
      setCoupon(null);
      setCouponError(err.message);
    }
  };

  const applyCoupon = async (code) => {
    if (!code) return;
    try {
      const res = await api.post('/coupons/validate', { code, amount: subtotal });
      setCoupon(res.data);
      setCouponError('');
      return res.data;
    } catch (err) {
      setCoupon(null);
      setCouponError(err.message);
      throw new Error(err.message);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError('');
  };

  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      const qty = parseFloat(quantity);
      if (existing) {
        return prev.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + qty) }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0] || '',
          unit: product.unit,
          retailPrice: product.retailPrice,
          wholesalePrice: product.wholesalePrice,
          wholesaleTiers: product.wholesaleTiers || [],
          minOrder: product.minOrder || 1,
          maxOrder: product.maxOrder || 1000,
          stock: product.stock,
          quantity: qty
        }
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    const qty = parseFloat(quantity);
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(item.stock, qty) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCoupon(null);
    setUseLoyaltyPoints(false);
  };

  // Calculate final totals
  const couponDiscount = coupon ? coupon.discountAmount : 0;
  
  const loyaltyPointsRedeemed = 0;
  const loyaltyDiscount = 0;

  const discount = couponDiscount + loyaltyDiscount;
  const total = Math.max(0, subtotal - discount);

  const pointsRatio = settings?.loyaltyPointsRatio || 100;
  const loyaltyPointsEarned = Math.floor(total / pointsRatio);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        subtotal,
        discount,
        couponDiscount,
        loyaltyDiscount,
        loyaltyPointsRedeemed,
        loyaltyPointsEarned,
        total,
        coupon,
        couponError,
        useLoyaltyPoints,
        setUseLoyaltyPoints,
        applyCoupon,
        removeCoupon,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
