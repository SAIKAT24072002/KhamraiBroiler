import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import api from '../utils/api';
import { FiCalendar, FiClock, FiCreditCard, FiCheckCircle, FiInfo } from 'react-icons/fi';

const Checkout = () => {
  const { cartItems, total, subtotal, discount, loyaltyPointsRedeemed, clearCart, coupon } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Pickup');
  const [transactionId, setTransactionId] = useState('');
  const [orderNote, setOrderNote] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sandbox payment modal states
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [simulatedPaymentData, setSimulatedPaymentData] = useState(null);
  const [createdOrderId, setCreatedOrderId] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    // Set default pickup date as today (formatted as YYYY-MM-DD)
    const today = new Date().toISOString().slice(0, 10);
    setPickupDate(today);
  }, [user, cartItems, navigate]);

  const currency = settings?.currency || '₹';

  // Generate dynamic time slots from 7:00 AM to 9:00 PM (1-hour slots)
  const timeSlots = [
    '07:00 AM - 08:00 AM',
    '08:00 AM - 09:00 AM',
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM',
    '05:00 PM - 06:00 PM',
    '06:00 PM - 07:00 PM',
    '07:00 PM - 08:00 PM',
    '08:00 PM - 09:00 PM'
  ];

  // Triggers order creation
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!pickupDate || !pickupTime) {
      setError('Please choose a pick-up date and time slot.');
      return;
    }

    if (paymentMethod === 'Manual UPI' && !transactionId) {
      setError('Please enter the UPI Transaction ID (UTR number).');
      return;
    }

    setLoading(true);

    try {
      const items = cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.retailPrice, // Base price, backend recalculates wholesale
        total: item.quantity * item.retailPrice
      }));

      const orderPayload = {
        items,
        couponCode: coupon?.code || '',
        useLoyaltyPoints: loyaltyPointsRedeemed > 0,
        paymentMethod,
        transactionId: paymentMethod === 'Manual UPI' ? transactionId : '',
        pickupDate,
        pickupTime,
        orderNote
      };

      const res = await api.post('/orders', orderPayload);
      const order = res.data;

      // Handle payment routing
      if (paymentMethod === 'Automatic Payment (Razorpay)') {
        // Trigger Razorpay payment gateway
        handleRazorpayCheckout(order);
      } else {
        // Cash on Pickup / Manual UPI success path
        clearCart();
        navigate(`/order-status/${order._id}?success=true`);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Handles real Razorpay trigger or fallback simulation modal
  const handleRazorpayCheckout = async (order) => {
    try {
      const res = await api.post('/payments/create-order', { orderId: order._id });
      const payData = res.data;
      setCreatedOrderId(order._id);

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
              navigate(`/order-status/${order._id}?success=true`);
            } catch (err) {
              setError('Payment verification failed: ' + err.message);
              setLoading(false);
            }
          },
          prefill: {
            name: user.name,
            contact: user.mobile
          },
          theme: {
            color: '#b91c1c'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      setError('Payment initialization failed: ' + err.message);
      setLoading(false);
    }
  };

  // Triggers sandbox checkout verification
  const handleSimulatedSuccess = async () => {
    setShowSandboxModal(false);
    try {
      await api.post('/payments/verify-signature', {
        orderId: createdOrderId,
        razorpayPaymentId: `pay_sim_${Date.now()}`,
        razorpayOrderId: simulatedPaymentData.id,
        isSimulated: true
      });
      clearCart();
      navigate(`/order-status/${createdOrderId}?success=true`);
    } catch (err) {
      setError('Simulated payment verification failed: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 dark:bg-slate-950 transition-colors duration-200">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
          Checkout Pickup Order
        </h1>
        <p className="text-xs text-slate-400">Fill details, configure payments, and finalize order for pickup</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900/40">
          {error}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Main form details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-50 dark:border-slate-800 pb-3">
              1. Pickup Logistics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pickup Date */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  <FiCalendar /> Pickup Date
                </label>
                <input
                  type="date"
                  required
                  value={pickupDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              {/* Pickup Time Slots */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  <FiClock /> Pickup Time Slot
                </label>
                <select
                  required
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                >
                  <option value="">Select Time Slot</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Note / Comments */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Order Note / Instructions (Optional)
              </label>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="E.g., Please clean the chicken properly. Keep chicken skins. Cut broiler in 12 pieces..."
                rows="3"
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none text-sm placeholder-slate-400"
              />
            </div>
          </div>

          {/* Payment Gateways Config */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-50 dark:border-slate-800 pb-3">
              2. Payment Options
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Cash on Pickup */}
              <label className={`flex flex-col items-center justify-center p-4 border rounded-2xl cursor-pointer text-center space-y-2 transition-all ${
                paymentMethod === 'Cash on Pickup'
                  ? 'border-primary-600 bg-primary-50/20 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  value="Cash on Pickup"
                  checked={paymentMethod === 'Cash on Pickup'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="sr-only"
                />
                <FiCreditCard className="h-6 w-6" />
                <span className="text-xs font-bold">Cash on Pickup</span>
              </label>

              {/* Option 2: Manual UPI QR */}
              {settings?.enableManualUpi !== false && (
                <label className={`flex flex-col items-center justify-center p-4 border rounded-2xl cursor-pointer text-center space-y-2 transition-all ${
                  paymentMethod === 'Manual UPI'
                    ? 'border-primary-600 bg-primary-50/20 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="Manual UPI"
                    checked={paymentMethod === 'Manual UPI'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <FiCheckCircle className="h-6 w-6" />
                  <span className="text-xs font-bold">UPI QR Code</span>
                </label>
              )}

              {/* Option 3: Realtime Razorpay */}
              {settings?.enableRazorpay !== false && (
                <label className={`flex flex-col items-center justify-center p-4 border rounded-2xl cursor-pointer text-center space-y-2 transition-all ${
                  paymentMethod === 'Automatic Payment (Razorpay)'
                    ? 'border-primary-600 bg-primary-50/20 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="Automatic Payment (Razorpay)"
                    checked={paymentMethod === 'Automatic Payment (Razorpay)'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <FiCreditCard className="h-6 w-6" />
                  <span className="text-xs font-bold">Online Accept</span>
                </label>
              )}
            </div>

            {/* Rendering Manual UPI scan box details */}
            {paymentMethod === 'Manual UPI' && (
              <div className="bg-slate-50 dark:bg-slate-950/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Scan QR to pay amount: <span className="text-lg text-primary-600 dark:text-primary-400 font-extrabold">{currency}{total.toFixed(2)}</span></p>
                  
                  {settings?.upiQrCodeUrl ? (
                    <img
                      src={settings.upiQrCodeUrl}
                      alt="UPI QR Code"
                      className="h-44 w-44 object-contain mx-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-white"
                    />
                  ) : (
                    /* Default simulated placeholder QR Code visual design */
                    <div className="h-44 w-44 bg-white border border-slate-200 dark:border-slate-800 rounded-xl mx-auto flex items-center justify-center text-xs font-bold font-mono p-4 text-center select-none text-slate-500 shadow-inner">
                      [QR CODE PLACEHOLDER]<br/>
                      UPI ID: {settings?.upiId || 'kbc@upi'}
                    </div>
                  )}
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2">UPI ID: <strong className="font-mono text-slate-800 dark:text-white select-all">{settings?.upiId || 'kbc@upi'}</strong></p>
                </div>

                <div className="border-t border-slate-150 dark:border-slate-800/80 pt-4 space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Enter UPI Transaction ID (UTR / Ref Number)
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter 12-digit transaction ID (e.g. 123456789012)"
                    className="block w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    *Check your UPI app (GPay, PhonePe, Paytm) history for the UTR/Reference number of the payment. Admin will manually verify the payment to confirm the order.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Totals Summary checkout details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Order Summary</h2>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
            <div className="pb-3 space-y-2 text-xs">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                    {item.name} <span className="font-bold">x {item.quantity} {item.unit}</span>
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white">{currency}{(item.quantity * item.retailPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="py-3 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <strong className="text-slate-800 dark:text-white">{currency}{subtotal.toFixed(2)}</strong>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discounts Applied:</span>
                  <strong>-{currency}{discount.toFixed(2)}</strong>
                </div>
              )}

              <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white text-base font-extrabold">
                <span>Grand Total:</span>
                <span className="text-primary-700 dark:text-primary-400">{currency}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-primary-700 hover:bg-primary-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors focus:outline-none"
          >
            {loading ? 'Processing...' : 'Place Pickup Order'}
          </button>
        </div>

      </form>

      {/* Simulated/Sandbox payment gateway modal layout */}
      {showSandboxModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-6 border border-slate-100 dark:border-slate-700 shadow-2xl transition-colors duration-200">
            <div className="text-center space-y-2">
              <span className="text-5xl animate-bounce inline-block select-none">💳</span>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">Simulated Payment Checkout</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                You are in Sandbox/Development mode. Complete payment mock verification.
              </p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Simulated Order ID:</span>
                <strong className="font-mono text-[10px]">{simulatedPaymentData?.id}</strong>
              </div>
              <div className="flex justify-between">
                <span>Amount Payable:</span>
                <strong className="text-primary-600 dark:text-primary-400 font-extrabold">{currency}{(simulatedPaymentData?.amount / 100).toFixed(2)}</strong>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleSimulatedSuccess}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md"
              >
                Simulate Payment Success
              </button>
              <button
                onClick={() => {
                  setShowSandboxModal(false);
                  setLoading(false);
                }}
                className="w-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-semibold py-2 text-center text-xs"
              >
                Cancel Checkout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Checkout;
