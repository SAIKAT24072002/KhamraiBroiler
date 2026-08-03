// src/pages/Checkout.jsx – Premium Fast Checkout (Guest – no auth required)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { submitGuestOrder } from '../utils/orderService';
import { FiUser, FiPhone, FiMapPin, FiCalendar, FiClock, FiCheckCircle, FiArrowLeft, FiShoppingBag } from 'react-icons/fi';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, subtotal, couponDiscount, coupon, total, clearCart } = useCart();
  const { settings } = useSettings();
  const currency = settings?.currency || '₹';

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null); // holds order object on success

  const timeSlots = [
    '8:00 AM – 9:00 AM',
    '9:00 AM – 10:00 AM',
    '10:00 AM – 11:00 AM',
    '11:00 AM – 12:00 PM',
    '12:00 PM – 1:00 PM',
    '2:00 PM – 3:00 PM',
    '3:00 PM – 4:00 PM',
    '4:00 PM – 5:00 PM',
    '5:00 PM – 6:00 PM'
  ];

  // Minimum date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) { setError('Please enter your name.'); return; }
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError('Phone number must be exactly 10 digits.'); return; }
    if (!address.trim()) { setError('Please enter your full address.'); return; }
    if (!pickupDate) { setError('Please select a pickup date.'); return; }
    if (!pickupTime) { setError('Please select a pickup time slot.'); return; }
    if (cartItems.length === 0) { setError('Your cart is empty.'); return; }

    setLoading(true);
    try {
      const order = await submitGuestOrder({
        name: name.trim(),
        phone: digits,
        address: address.trim(),
        items: cartItems.map(i => ({ productId: i.productId, name: i.name, quantity: i.quantity })),
        couponCode: coupon?.code || '',
        paymentMethod: 'Cash on Pickup',
        pickupDate,
        pickupTime,
        orderNote: orderNote.trim()
      });

      setOrderSuccess(order);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Success Screen ────────────────────────────────────────────────────
  if (orderSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="max-w-md w-full text-center space-y-6 p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl">
          <div className="flex justify-center">
            <FiCheckCircle className="h-16 w-16 text-emerald-500 animate-bounce" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
            Order Confirmed!
          </h2>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 space-y-2 text-left">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Order Number</span>
              <strong className="text-emerald-700 dark:text-emerald-400 font-mono select-all">{orderSuccess.orderNumber}</strong>
            </div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Total Amount</span>
              <strong className="text-slate-800 dark:text-white">{currency}{orderSuccess.total?.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Pickup Date</span>
              <strong className="text-slate-800 dark:text-white">{new Date(orderSuccess.pickupDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</strong>
            </div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Pickup Time</span>
              <strong className="text-slate-800 dark:text-white">{orderSuccess.pickupTime}</strong>
            </div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Payment</span>
              <strong className="text-slate-800 dark:text-white">Cash on Pickup</strong>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Please visit our shop at the selected time slot. Show your order number at the counter.
          </p>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 px-6 rounded-xl text-sm uppercase tracking-wider shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            <FiShoppingBag /> Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ─── Empty Cart Guard ──────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950 transition-colors space-y-6">
        <div className="text-7xl select-none">🛒</div>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white uppercase">Cart is Empty</h2>
        <p className="text-sm text-slate-500">Add items to your cart before checking out.</p>
        <Link to="/shop" className="bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 px-6 rounded-xl text-sm uppercase tracking-wider shadow-md">
          Go To Shop
        </Link>
      </div>
    );
  }

  // ─── Checkout Form ────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 dark:bg-slate-950 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/cart')} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <FiArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
            Checkout
          </h1>
          <p className="text-xs text-slate-400">Fill in your details to place your pickup order</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900/40">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* ── Left: Customer Form ───────────────────────────── */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6" id="checkout-form">
          {/* Personal Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FiUser className="text-primary-600" /> Personal Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkout-name" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><FiUser className="h-4 w-4" /></div>
                  <input
                    id="checkout-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Rajan Das"
                    disabled={loading}
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="checkout-phone" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><FiPhone className="h-4 w-4" /></div>
                  <input
                    id="checkout-phone"
                    type="tel"
                    maxLength="10"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    disabled={loading}
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="checkout-address" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Address *</label>
              <div className="relative">
                <div className="absolute top-3 left-3 text-slate-400 pointer-events-none"><FiMapPin className="h-4 w-4" /></div>
                <textarea
                  id="checkout-address"
                  rows="3"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="House/Flat, Street, Village/Town, Dist, PIN"
                  disabled={loading}
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Pickup Schedule */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FiCalendar className="text-primary-600" /> Pickup Schedule
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkout-date" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pickup Date *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><FiCalendar className="h-4 w-4" /></div>
                  <input
                    id="checkout-date"
                    type="date"
                    min={minDate}
                    value={pickupDate}
                    onChange={e => setPickupDate(e.target.value)}
                    disabled={loading}
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="checkout-time" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Time Slot *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><FiClock className="h-4 w-4" /></div>
                  <select
                    id="checkout-time"
                    value={pickupTime}
                    onChange={e => setPickupTime(e.target.value)}
                    disabled={loading}
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none"
                  >
                    <option value="">Select a time slot</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="checkout-note" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Order Note (Optional)</label>
              <textarea
                id="checkout-note"
                rows="2"
                value={orderNote}
                onChange={e => setOrderNote(e.target.value)}
                placeholder="Any special instructions for the order..."
                disabled={loading}
                className="block w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
              />
            </div>
          </div>
        </form>

        {/* ── Right: Order Summary ──────────────────────────── */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FiShoppingBag className="text-primary-600" /> Order Summary
            </h3>

            {/* Item list */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {cartItems.map(item => (
                <div key={item.productId} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{item.quantity} × {currency}{item.retailPrice}/{item.unit}</p>
                  </div>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-white">
                    {currency}{(item.retailPrice * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <strong className="text-slate-800 dark:text-white">{currency}{subtotal.toFixed(2)}</strong>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Coupon ({coupon?.code})</span>
                  <strong>-{currency}{couponDiscount.toFixed(2)}</strong>
                </div>
              )}

              <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-base font-extrabold text-slate-800 dark:text-white">
                <span>Grand Total</span>
                <span className="text-primary-700 dark:text-primary-400">{currency}{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment badge */}
            <div className="bg-accent-50 dark:bg-accent-950/20 border border-accent-100 dark:border-accent-900/40 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-accent-800 dark:text-accent-300 uppercase tracking-wider">
                💵 Payment: Cash on Pickup
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              form="checkout-form"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md text-sm uppercase tracking-wider transform hover:scale-105 active:scale-95 transition-all duration-150"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Placing Order…
                </>
              ) : (
                <>
                  <FiCheckCircle /> Confirm & Place Order
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
              * All products must be physically picked up from our shop counter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
