import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { baseApiUrl } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
import { FiCheckCircle, FiClock, FiShoppingBag, FiUser, FiPrinter, FiXCircle, FiCheck, FiDollarSign, FiSearch } from 'react-icons/fi';
import { TableSkeleton } from '../../components/Skeleton';

const AdminOrders = () => {
  const { settings } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || '';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders?status=${statusFilter}&search=${searchQuery}`);
      setOrders(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadOrders();
  };

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to change order status to '${status}'?`)) return;
    setError('');
    setMessage('');
    try {
      await api.put(`/orders/${id}/status`, { status });
      setMessage(`Order status updated to '${status}' successfully.`);
      loadOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdatePaymentStatus = async (id, paymentStatus) => {
    if (!window.confirm(`Are you sure you want to mark this order payment as '${paymentStatus}'?`)) return;
    setError('');
    setMessage('');
    try {
      await api.put(`/orders/${id}/payment`, { paymentStatus });
      setMessage(`Payment marked as '${paymentStatus}' successfully.`);
      loadOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const currency = settings?.currency || '₹';

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-50 text-yellow-600 border border-yellow-100';
      case 'Confirmed': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'Preparing': return 'bg-orange-50 text-orange-600 border border-orange-100';
      case 'Ready for Pickup': return 'bg-purple-50 text-purple-600 border border-purple-100';
      case 'Collected':
      case 'Completed': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'Cancelled': return 'bg-red-50 text-red-600 border border-red-100';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const statusOptions = [
    { label: 'All Orders', value: '' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Confirmed', value: 'Confirmed' },
    { label: 'Preparing', value: 'Preparing' },
    { label: 'Ready for Pickup', value: 'Ready for Pickup' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' }
  ];

  return (
    <div className="space-y-6">
      
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">Orders Registry</h1>
        <p className="text-xs text-slate-400">View orders, verify transaction IDs, and execute pickup confirmations</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 border p-4 rounded-xl text-xs font-bold">{error}</div>}
      {message && <div className="bg-emerald-50 text-emerald-600 border p-4 rounded-xl text-xs font-bold">{message}</div>}

      {/* Filters: Search and Status Selectors */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <FiSearch className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID or mobile..."
            className="block w-full pl-10 pr-24 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
          />
          <button type="submit" className="absolute top-1 right-1 bottom-1 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-1.5 rounded-lg text-[10px] uppercase">
            Search
          </button>
        </form>

        {/* Tab pill selectors */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none max-w-full">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                if (opt.value === '') searchParams.delete('status');
                else searchParams.set('status', opt.value);
                setSearchParams(searchParams);
              }}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap uppercase tracking-wider transition-all border ${
                statusFilter === opt.value
                  ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders items list */}
      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((ord) => (
            <div key={ord._id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              {/* Col 1: Order Meta */}
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wide ${getStatusBadge(ord.status)}`}>
                    {ord.status}
                  </span>
                  <h3 className="font-mono text-sm font-bold text-slate-800 dark:text-white select-all mt-1">{ord.orderNumber}</h3>
                  <p className="text-[10px] text-slate-400">{formatDate(ord.createdAt)}</p>
                </div>

                <div className="text-[10px] text-slate-500 space-y-1">
                  <p className="flex items-center gap-1"><FiUser /> <strong>Name:</strong> {ord.customer?.name}</p>
                  <p className="flex items-center gap-1"><FiClock /> <strong>Mobile:</strong> {ord.customer?.mobile}</p>
                </div>
              </div>

              {/* Col 2: Logistics / Pickup Details */}
              <div className="text-xs text-slate-500 space-y-1.5 border-t lg:border-t-0 lg:border-l lg:border-slate-100 dark:lg:border-slate-800/80 lg:pl-6 py-4 lg:py-0">
                <p className="text-[10px] uppercase font-bold text-slate-400">Pickup Details</p>
                <p><strong>Date:</strong> {new Date(ord.pickupDate).toLocaleDateString('en-IN')}</p>
                <p><strong>Time Slot:</strong> {ord.pickupTime}</p>
                {ord.orderNote && <p className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-dashed text-[10px] text-slate-500 mt-1"><strong>Note:</strong> {ord.orderNote}</p>}
              </div>

              {/* Col 3: Items list / Pricing */}
              <div className="text-xs text-slate-500 space-y-2 border-t lg:border-t-0 lg:border-l lg:border-slate-100 dark:lg:border-slate-800/80 lg:pl-6 py-4 lg:py-0">
                <p className="text-[10px] uppercase font-bold text-slate-400">Items List</p>
                <div className="space-y-1 max-h-[100px] overflow-y-auto">
                  {ord.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[10px]">
                      <span>{item.name} x {item.quantity} {item.unit}</span>
                      <strong className="text-slate-700 dark:text-slate-300">{currency}{item.total.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-1.5 flex justify-between font-bold text-slate-800 dark:text-white">
                  <span>Payable Total:</span>
                  <span className="text-primary-700 dark:text-primary-400 font-extrabold">{currency}{ord.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Col 4: Action panel */}
              <div className="space-y-3.5 border-t lg:border-t-0 lg:border-l lg:border-slate-100 dark:lg:border-slate-800/80 lg:pl-6 pt-4 lg:pt-0 flex flex-col items-stretch">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Actions Menu</p>
                
                {/* 1. Payment status action */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span>Payment Status:</span>
                    <strong className={`font-black uppercase ${ord.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {ord.paymentStatus}
                    </strong>
                  </div>
                  {ord.paymentDetails?.transactionId && (
                    <p className="text-[9px] font-mono select-all bg-white p-1 rounded border">UTR: {ord.paymentDetails.transactionId}</p>
                  )}
                  {ord.paymentStatus !== 'Paid' && (
                    <button
                      onClick={() => handleUpdatePaymentStatus(ord._id, 'Paid')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-[9px] uppercase flex items-center justify-center gap-1"
                    >
                      <FiDollarSign /> Confirm Payment
                    </button>
                  )}
                </div>

                {/* 2. Order status transitions buttons */}
                <div className="space-y-1.5">
                  {ord.status === 'Pending' && (
                    <button
                      onClick={() => handleUpdateStatus(ord._id, 'Confirmed')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-[10px] uppercase shadow-sm"
                    >
                      Confirm Order
                    </button>
                  )}
                  {ord.status === 'Confirmed' && (
                    <button
                      onClick={() => handleUpdateStatus(ord._id, 'Preparing')}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg text-[10px] uppercase shadow-sm"
                    >
                      Start Preparing
                    </button>
                  )}
                  {ord.status === 'Preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(ord._id, 'Ready for Pickup')}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg text-[10px] uppercase shadow-sm animate-pulse"
                    >
                      Mark Ready for Pickup
                    </button>
                  )}
                  {ord.status === 'Ready for Pickup' && (
                    <button
                      onClick={() => handleUpdateStatus(ord._id, 'Completed')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-[10px] uppercase shadow-md"
                    >
                      Mark Collected & Complete
                    </button>
                  )}

                  {/* Cancel button */}
                  {ord.status !== 'Completed' && ord.status !== 'Collected' && ord.status !== 'Cancelled' && (
                    <button
                      onClick={() => handleUpdateStatus(ord._id, 'Cancelled')}
                      className="w-full text-slate-400 hover:text-red-500 font-bold py-1.5 rounded-lg text-[9px] uppercase tracking-wider text-center"
                    >
                      Cancel Order
                    </button>
                  )}
                  
                  {/* Invoice prints */}
                  <button
                    onClick={() => window.open(`${baseApiUrl}/orders/${ord._id}/invoice`, '_blank')}
                    className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-1.5 rounded-lg text-[9px] uppercase flex items-center justify-center gap-1"
                  >
                    <FiPrinter /> Print Receipt
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 select-none bg-white rounded-3xl border border-dashed">
          No orders found matching status selection or filters.
        </div>
      )}

    </div>
  );
};

export default AdminOrders;
