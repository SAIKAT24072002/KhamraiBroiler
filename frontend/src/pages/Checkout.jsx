// src/pages/Checkout.jsx – Premium Fast Checkout (Guest – no auth required)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { submitGuestOrder } from '../utils/orderService';
import api from '../utils/api';
import { FiUser, FiPhone, FiMapPin, FiCalendar, FiClock, FiCheckCircle, FiArrowLeft, FiShoppingBag, FiCreditCard, FiSmartphone } from 'react-icons/fi';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, subtotal, couponDiscount, coupon, total, clearCart } = useCart();
  const { settings } = useSettings();
  const { user } = useAuth();
  const currency = settings?.currency || '₹';

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // Payment Options (Only Manual UPI or Razorpay)
  const [paymentMethod, setPaymentMethod] = useState(settings?.enableRazorpay !== false ? 'Automatic Payment (Razorpay)' : 'Manual UPI');
  const [transactionId, setTransactionId] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null); // holds order object on success

  // Razorpay states
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [simulatedPaymentData, setSimulatedPaymentData] = useState(null);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  // Auto-fill logged-in user data
  React.useEffect(() => {
    if (user) {
      if (!name) setName(user.name || '');
      if (!phone) setPhone(user.mobile || '');
      
      // Try to fetch previous address from last order
      const fetchLatestOrder = async () => {
        try {
          const { data } = await api.get('/orders/my-orders');
          if (data && data.length > 0 && data[0].guestInfo?.address) {
            setAddress(data[0].guestInfo.address);
          }
        } catch (error) {
          console.error('Failed to auto-fill address:', error);
        }
      };
      
      if (!address) {
        fetchLatestOrder();
      }
    }
  }, [user]);

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
    if (paymentMethod === 'Manual UPI' && !transactionId.trim()) { setError('Please enter the UPI Transaction ID.'); return; }

    setLoading(true);
    try {
      let order;
      const orderPayload = {
        name: name.trim(),
        phone: digits,
        address: address.trim(),
        items: cartItems.map(i => ({ productId: i.productId, name: i.name, quantity: i.quantity })),
        couponCode: coupon?.code || '',
        paymentMethod: paymentMethod,
        transactionId: paymentMethod === 'Manual UPI' ? transactionId.trim() : '',
        pickupDate,
        pickupTime,
        orderNote: orderNote.trim()
      };

      if (user) {
        const res = await api.post('/orders', orderPayload);
        order = res.data;
      } else {
        order = await submitGuestOrder(orderPayload);
      }

      // Handle Razorpay Payment flow
      if (paymentMethod === 'Automatic Payment (Razorpay)') {
        await handleRazorpayCheckout(order, name, digits);
      } else {
        // Manual UPI flow success
        setOrderSuccess(order);
        clearCart();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayCheckout = async (order, customerName, customerPhone) => {
    try {
      const res = await api.post('/payments/create-order', { orderId: order._id });
      const payData = res.data;
      setCreatedOrderId(order._id);
      setOrderSuccess(order); // Keep order context for success screen after payment verification

      if (payData.simulated) {
        // Show simulated sandbox payment modal
        setSimulatedPaymentData(payData);
        setShowSandboxModal(true);
      } else {
        // Launch standard real Razorpay SDK
        const options = {
          key: payData.key,
          amount: payData.amount,
          currency: payData.currency,
          name: settings?.businessName || 'KHAMRAI BROILER CENTER',
          description: `Payment for Order #${payData.orderNumber}`,
          order_id: payData.id,
          handler: async (response) => {
            try {
              await api.post('/payments/verify-signature', {
                orderId: order._id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature
              });
              clearCart();
              // Status screen handled naturally because showSandboxModal is false
            } catch (err) {
              setError('Payment verification failed: ' + (err.response?.data?.message || err.message));
              setOrderSuccess(null); // Fallback to form
            }
          },
          prefill: {
            name: customerName,
            contact: customerPhone
          },
          theme: {
            color: '#b91c1c'
          },
          modal: {
            ondismiss: function() {
              setError('Payment cancelled by user. Order is pending.');
              setOrderSuccess(null); // Fallback to form
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      setError('Payment initialization failed: ' + (err.response?.data?.message || err.message));
      setOrderSuccess(null); // Fallback to form
    }
  };

  const handleSimulatedSuccess = async () => {
    setShowSandboxModal(false);
    setLoading(true);
    try {
      await api.post('/payments/verify-signature', {
        orderId: createdOrderId,
        razorpayPaymentId: `pay_sim_${Date.now()}`,
        razorpayOrderId: simulatedPaymentData.id,
        isSimulated: true
      });
      clearCart();
    } catch (err) {
      setError('Simulated payment verification failed: ' + (err.response?.data?.message || err.message));
      setOrderSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  // ─── Success Screen ────────────────────────────────────────────────────
  if (orderSuccess && !showSandboxModal) {
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
              <strong className="text-slate-800 dark:text-white">{orderSuccess.paymentMethod}</strong>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Please visit our shop at the selected time slot. You can track your order using your Order ID.
          </p>

          <div className="flex flex-col gap-3 mt-4">
            <Link
              to={`/order-status/${orderSuccess.orderNumber}`}
              className="inline-flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl text-sm uppercase tracking-wider shadow-md transition-transform hover:scale-105 active:scale-95"
            >
              Track Order Status
            </Link>
            <Link
              to="/shop"
              className="inline-flex justify-center items-center gap-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold py-3 px-6 rounded-xl text-sm uppercase tracking-wider transition-all"
            >
              <FiShoppingBag /> Continue Shopping
            </Link>
          </div>
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
      
      {/* Sandbox Simulated Modal overlay */}
      {showSandboxModal && simulatedPaymentData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full space-y-6 text-center border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Sandbox Test Mode</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Razorpay API keys are not configured. This is a simulated checkout.
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-left space-y-2 text-xs">
              <p><strong>Order Amount:</strong> {currency}{(simulatedPaymentData.amount / 100).toFixed(2)}</p>
              <p><strong>Test Order ID:</strong> {simulatedPaymentData.id}</p>
            </div>
            <button
              onClick={handleSimulatedSuccess}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md text-sm uppercase tracking-wider"
            >
              Simulate Payment Success
            </button>
            <button
              onClick={() => {
                setShowSandboxModal(false);
                setOrderSuccess(null);
                setLoading(false);
              }}
              className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 px-4 rounded-xl text-sm uppercase tracking-wider mt-2"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/cart')} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <FiArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
            Checkout
          </h1>
          <p className="text-xs text-slate-400">Fill in your details and pay to confirm pickup</p>
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
                    required
                    maxLength="10"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    disabled={loading || !!user} // Disable if logged in to force using account phone
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

        {/* ── Right: Order Summary & Payment ──────────────────────────── */}
        <div className="space-y-6">
          
          {/* Payment Method Selector */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FiCreditCard className="text-primary-600" /> Payment Method
            </h3>
            <div className="space-y-3">
              
              {/* Razorpay Option */}
              {settings?.enableRazorpay !== false && (
                <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'Automatic Payment (Razorpay)' 
                  ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-900/20' 
                  : 'border-slate-200 dark:border-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="Automatic Payment (Razorpay)"
                    checked={paymentMethod === 'Automatic Payment (Razorpay)'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                    Online Payment (Cards / UPI)
                  </span>
                </label>
              )}

              {/* Manual UPI Option */}
              {settings?.enableManualUpi !== false && (
                <div className={`border rounded-xl transition-all overflow-hidden ${
                  paymentMethod === 'Manual UPI' 
                  ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-900/20' 
                  : 'border-slate-200 dark:border-slate-700'
                }`}>
                  <label className="flex items-center p-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      value="Manual UPI"
                      checked={paymentMethod === 'Manual UPI'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="ml-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                      Scanner / Manual UPI
                    </span>
                  </label>
                  
                  {/* Manual UPI QR and Input Section */}
                  {paymentMethod === 'Manual UPI' && (
                    <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      {settings?.upiId && (
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg text-center shadow-sm border border-slate-100 dark:border-slate-700">
                          <p className="text-[10px] text-slate-500 font-bold mb-2">SCAN & PAY</p>
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.businessName || 'Business')}&am=${total.toFixed(2)}&cu=INR`} 
                            alt="UPI QR Code" 
                            className="mx-auto rounded"
                          />
                          <p className="text-[10px] font-mono select-all mt-2 bg-slate-50 dark:bg-slate-900 p-1 border dark:border-slate-700 rounded">{settings.upiId}</p>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <FiSmartphone /> Transaction ID / UTR *
                        </label>
                        <input
                          type="text"
                          required
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="e.g. 3209123485"
                          className="block w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

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
                  Processing…
                </>
              ) : (
                <>
                  <FiCheckCircle /> Pay & Place Order
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
