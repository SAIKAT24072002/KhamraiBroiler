import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { baseApiUrl } from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import { FiCheckCircle, FiClock, FiFileText, FiMapPin, FiPrinter, FiUser } from 'react-icons/fi';
import { TableSkeleton } from '../components/Skeleton';

const OrderStatus = () => {
  const { id } = useParams();
  const { settings } = useSettings();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/tracking/${id}`);
        setOrder(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const currency = settings?.currency || '₹';

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusStepIndex = (status) => {
    const steps = ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Collected', 'Completed'];
    // Merge Collected and Completed as final step
    if (status === 'Collected' || status === 'Completed') return 4;
    return steps.indexOf(status);
  };

  const steps = [
    { title: 'Ordered', desc: 'Awaiting store approval' },
    { title: 'Confirmed', desc: 'Store has approved stock' },
    { title: 'Preparing', desc: 'Preparing fresh poultry items' },
    { title: 'Ready', desc: 'Stock packaged at counter' },
    { title: 'Completed', desc: 'Collected from store' }
  ];

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><TableSkeleton /></div>;
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-6xl text-red-500 font-sans font-bold">⚠️</div>
        <h2 className="text-xl font-bold uppercase tracking-tight text-slate-800 dark:text-white">Order Not Found</h2>
        <p className="text-xs text-slate-500">{error}</p>
        <Link to="/shop" className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider inline-block">
          Go To Shop
        </Link>
      </div>
    );
  }

  const currentStepIdx = getStatusStepIndex(order.status);
  const isCancelled = order.status === 'Cancelled';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 dark:bg-slate-950 transition-colors duration-200">
      
      {/* Header details */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pickup Invoice</p>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">Order: <span className="font-mono">{order.orderNumber}</span></h1>
          <p className="text-xs text-slate-500">Date: {formatDate(order.createdAt)}</p>
        </div>
        
        <div className="flex gap-2">
          {/* Print receipt */}
          <button
            onClick={() => window.open(`${baseApiUrl}/orders/${order._id}/invoice`, '_blank')}
            className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider"
          >
            <FiPrinter /> Print Receipt
          </button>
          
          <Link
            to="/shop"
            className="bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow"
          >
            Shop More
          </Link>
        </div>
      </div>

      {/* 2. Order Timeline Progress Status */}
      {isCancelled ? (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-100 dark:border-red-900/40 text-center font-bold text-sm">
          ❌ This order was Cancelled by the administrator or customer. Reverted stocks back to inventory.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Order Timeline Status</h2>
          
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
            {/* Visual connecting progress line */}
            <div className="hidden md:block absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 dark:bg-slate-800 -z-10">
              <div
                className="h-full bg-primary-600 transition-all duration-500"
                style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={idx} className="flex md:flex-col items-center gap-4 md:gap-2 md:text-center flex-1 w-full md:w-auto relative">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary-700 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  } ${isCurrent ? 'ring-4 ring-primary-100 dark:ring-primary-950/40 animate-pulse' : ''}`}>
                    {isCompleted ? <FiCheckCircle className="h-4 w-4" /> : idx + 1}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isCompleted ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                      {step.title}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[120px] md:mx-auto">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Logistics and Pickup card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Logistics info */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <FiUser className="text-primary-600" /> Customer Details
          </h3>
          <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
            <p><strong>Name:</strong> {order.guestInfo?.name || order.customer?.name}</p>
            <p><strong>Mobile:</strong> {order.guestInfo?.phone || order.customer?.mobile}</p>
            <p><strong>Payment Status:</strong> <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
              order.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>{order.paymentStatus}</span></p>
            <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
            {order.paymentDetails?.transactionId && (
              <p><strong>UPI Transaction ID:</strong> <span className="font-mono select-all bg-slate-50 p-1 rounded border">{order.paymentDetails.transactionId}</span></p>
            )}
          </div>
        </div>

        {/* Pickup Logistics info */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <FiMapPin className="text-primary-600" /> Pickup Logistics
          </h3>
          <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
            <p><strong>Store Address:</strong> {settings?.storeAddress || 'Khamrai Outlet Counter, Midnapore'}</p>
            <p><strong>Pickup Date:</strong> {formatDate(order.pickupDate)}</p>
            <p><strong>Pickup Slot:</strong> {order.pickupTime}</p>
            <p className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-dashed border-slate-200 dark:border-slate-800 text-[10px] text-slate-500">
              *Bring your receipt or Order ID verification details to collect chicken.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Products details card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
          <FiFileText className="text-primary-600" /> Order Items List
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-2">Item Name</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
              {order.items.map((item, idx) => (
                <tr key={idx} className="text-slate-700 dark:text-slate-300">
                  <td className="py-3 font-semibold">{item.name}</td>
                  <td className="py-3 text-center">{item.quantity} {item.unit}</td>
                  <td className="py-3 text-right">{currency}{item.price.toFixed(2)}</td>
                  <td className="py-3 text-right font-bold text-slate-800 dark:text-white">{currency}{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary checkout details */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col items-end space-y-2 text-xs">
          <div className="flex justify-between w-48 text-slate-500">
            <span>Subtotal:</span>
            <span>{currency}{order.subtotal.toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between w-48 text-red-500">
              <span>Discount Applied:</span>
              <span>-{currency}{order.discount.toFixed(2)}</span>
            </div>
          )}
          {order.loyaltyPointsRedeemed > 0 && (
            <div className="flex justify-between w-48 text-blue-500">
              <span>Points Redeemed:</span>
              <span>-{currency}{(order.loyaltyPointsRedeemed).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between w-48 text-base font-extrabold text-slate-800 dark:text-white border-t border-slate-50 dark:border-slate-800 pt-2">
            <span>Paid Total:</span>
            <span className="text-primary-700 dark:text-primary-400">{currency}{order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OrderStatus;
