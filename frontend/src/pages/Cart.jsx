import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

import { useSettings } from '../context/SettingsContext';
import { FiTrash2, FiPlus, FiMinus, FiArrowRight, FiPercent, FiGift } from 'react-icons/fi';
import api from '../utils/api';
import { useEffect } from 'react';

const Cart = () => {
  const {
    cartItems, subtotal, discount, couponDiscount, loyaltyDiscount,
    loyaltyPointsRedeemed, loyaltyPointsEarned, total,
    coupon, couponError, useLoyaltyPoints, setUseLoyaltyPoints,
    applyCoupon, removeCoupon, updateQuantity, removeFromCart
  } = useCart();
  

  const { settings } = useSettings();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [activeCoupons, setActiveCoupons] = useState([]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await api.get('/coupons');
        setActiveCoupons(res.data.filter(c => c.status === 'active'));
      } catch (err) {
        console.error('Failed to load active coupons:', err.message);
      }
    };
    fetchCoupons();
  }, []);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode) return;
    setCouponLoading(true);
    try {
      await applyCoupon(couponCode);
      setCouponCode('');
    } catch (err) {
      console.error(err.message);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleProceed = () => {
    if (cartItems.length === 0) return;
    navigate('/checkout');
  };

  const currency = settings?.currency || '₹';
  const loyaltyValue = settings?.loyaltyPointsValue || 1;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6 dark:bg-slate-950 transition-colors duration-200">
        <div className="text-8xl select-none animate-bounce">🛒</div>
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
          Your Cart is Empty
        </h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          You haven't added any fresh chicken or egg stocks to your cart yet. Visit our shop section to fill your cart.
        </p>
        <Link
          to="/shop"
          className="bg-primary-700 hover:bg-primary-800 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg uppercase tracking-wider text-sm inline-block transition-transform hover:scale-105 active:scale-95"
        >
          Go To Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 dark:bg-slate-950 transition-colors duration-200">
      
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
          Shopping Cart
        </h1>
        <p className="text-xs text-slate-400">Review your poultry stocks and discounts before scheduling pickup</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Cart Items Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm p-6">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {cartItems.map((item) => {
                // Determine dynamic unit price based on quantity (Wholesale pricing)
                let currentUnitPrice = item.retailPrice;
                let isWholesale = false;

                if (item.quantity >= item.minOrder) {
                  isWholesale = true;
                  let tierPrice = null;
                  if (item.wholesaleTiers && item.wholesaleTiers.length > 0) {
                    for (const tier of item.wholesaleTiers) {
                      if (item.quantity >= tier.minQty && (!tier.maxQty || item.quantity <= tier.maxQty)) {
                        tierPrice = tier.price;
                        break;
                      }
                    }
                  }
                  currentUnitPrice = tierPrice !== null ? tierPrice : item.wholesalePrice;
                }

                return (
                  <div key={item.productId} className="py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex gap-4 items-center">
                      <div className="h-16 w-16 bg-slate-50 dark:bg-slate-950/40 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="max-h-12 object-contain" />
                        ) : (
                          <span className="text-3xl">🐔</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">{item.name}</h3>
                        <p className="text-xs text-slate-400">Base rate: {currency}{item.retailPrice}/{item.unit}</p>
                        {isWholesale && (
                          <span className="bg-accent-100 dark:bg-accent-950/40 text-accent-800 dark:text-accent-300 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider inline-block mt-1">
                            Wholesale Rate Applied: {currency}{currentUnitPrice}/{item.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-8">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950/50">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-2.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          <FiMinus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          step={item.unit === 'KG' || item.unit === 'Gram' ? '0.1' : '1'}
                          min={item.unit === 'KG' || item.unit === 'Gram' ? '0.1' : '1'}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.productId, e.target.value)}
                          className="w-12 text-center text-xs font-bold bg-transparent border-none focus:outline-none text-slate-800 dark:text-white"
                        />
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-2.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          <FiPlus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Total and Delete */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-extrabold text-slate-800 dark:text-white text-base">
                            {currency}{(currentUnitPrice * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-500 hover:text-red-700 p-2.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                          aria-label="Remove item"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Summary & Coupon box */}
        <div className="space-y-6">
          {/* Coupon and Loyalty points checking */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            
            {/* 1. Coupon Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FiPercent className="text-primary-600" /> Apply Coupon
              </h3>
              
              {coupon ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 tracking-wider bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded uppercase">
                      {coupon.code}
                    </span>
                    <p className="text-[10px] text-emerald-600 mt-1">Discount of {currency}{coupon.discountAmount.toFixed(2)} applied.</p>
                  </div>
                  <button onClick={removeCoupon} className="text-xs text-red-500 hover:text-red-700 font-bold">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white uppercase tracking-wider placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading}
                    className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 dark:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                  >
                    Apply
                  </button>
                </form>
              )}
              {couponError && <p className="text-[10px] text-red-500 font-bold">{couponError}</p>}
              
              {/* Show available active coupons */}
              {!coupon && activeCoupons.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <FiGift /> Available Offers
                  </p>
                  <div className="flex flex-col gap-2">
                    {activeCoupons.map(c => (
                      <div key={c._id} className="bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/40 p-2.5 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/60 transition-colors" onClick={() => setCouponCode(c.code)}>
                        <div>
                          <span className="text-[10px] font-bold text-primary-700 dark:text-primary-300 uppercase tracking-widest">{c.code}</span>
                          <p className="text-[9px] text-primary-600/80 mt-0.5">Min Order: {currency}{c.minOrderAmount}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setCouponCode(c.code); }} className="text-[10px] font-bold text-primary-700 bg-white dark:bg-slate-900 border border-primary-200 dark:border-primary-800 px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          USE
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>


          </div>

          {/* Checkout totals Summary card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Summary</h3>
            
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <strong className="text-slate-800 dark:text-white">{currency}{subtotal.toFixed(2)}</strong>
              </div>
              
              {couponDiscount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Coupon Discount:</span>
                  <strong>-{currency}{couponDiscount.toFixed(2)}</strong>
                </div>
              )}

              {loyaltyPointsRedeemed > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Points Redeemed ({loyaltyPointsRedeemed}):</span>
                  <strong>-{currency}{loyaltyDiscount.toFixed(2)}</strong>
                </div>
              )}

              <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white text-base font-extrabold">
                <span>Grand Total:</span>
                <span className="text-primary-700 dark:text-primary-400">{currency}{total.toFixed(2)}</span>
              </div>
            </div>

            {loyaltyPointsEarned > 0 && (
              <div className="bg-primary-50/50 dark:bg-primary-950/20 text-[10px] text-primary-700 dark:text-primary-300 p-2.5 rounded-lg border border-primary-100/50 text-center font-bold">
                🎉 Earn +{loyaltyPointsEarned} Loyalty Points on pickup!
              </div>
            )}

            <button
              onClick={handleProceed}
              className="w-full flex justify-center items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md text-sm uppercase tracking-wider transform hover:scale-105 active:scale-95 transition-all duration-150"
            >
              Proceed to Checkout <FiArrowRight />
            </button>
            
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
              *Home delivery is not supported. All products must be picked up physically from our shop counter.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Cart;
