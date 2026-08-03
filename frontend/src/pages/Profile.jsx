import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FiUser, FiMapPin, FiPhone, FiShoppingBag, FiClock, FiCheckCircle, FiChevronRight, FiBox } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('Address not available yet. Complete an order to save your address.');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data } = await api.get('/orders/my-orders');
        setOrders(data);
        
        // Extract address from the most recent order
        if (data && data.length > 0) {
          const latestOrder = data[0];
          if (latestOrder.guestInfo?.address) {
            setAddress(latestOrder.guestInfo.address);
          }
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Preparing': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Ready for Pickup': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Completed':
      case 'Collected': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 rounded-full mx-auto mb-4">
              <FiUser className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">{user.name}</h2>
            <div className="flex items-center justify-center space-x-2 text-slate-600 dark:text-slate-400 mb-6">
              <FiPhone className="w-4 h-4" />
              <span>+91 {user.mobile}</span>
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                <FiMapPin className="mr-2 text-primary-500" /> Primary Address
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                {address}
              </p>
            </div>
            
            <button 
              onClick={logout}
              className="mt-8 w-full py-2.5 px-4 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-xl font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Order History */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <FiShoppingBag className="mr-3 text-primary-600" /> Order History
          </h2>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="w-24 h-24 bg-primary-50 dark:bg-primary-900/20 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiBox className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">No orders found with this number!</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                Looks like you haven't placed any orders yet. Place your first order today and enjoy fresh chicken!
              </p>
              <Link 
                to="/shop" 
                className="inline-flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Start Shopping <FiChevronRight className="ml-2" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-primary-200 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-slate-50 dark:border-slate-800">
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="font-bold text-slate-900 dark:text-white">Order {order.orderNumber}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-slate-500">
                        <FiClock className="mr-1" />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-0 text-left sm:text-right">
                      <div className="text-lg font-bold text-primary-600 dark:text-primary-400">₹{order.total.toFixed(2)}</div>
                      <div className="text-xs text-slate-500">{order.items.length} items</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {order.items.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                        <span className="font-semibold mr-1">{item.quantity}{item.unit}</span> {item.name}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Link 
                      to={`/order-status/${order.orderNumber}`}
                      className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center"
                    >
                      Track Order <FiChevronRight className="ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
