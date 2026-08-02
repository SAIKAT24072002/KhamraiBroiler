import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import api, { baseApiUrl } from '../utils/api';
import { FiUser, FiMail, FiPhone, FiShoppingBag, FiAward, FiEye, FiPrinter, FiEdit2 } from 'react-icons/fi';
import { TableSkeleton } from '../components/Skeleton';

const Profile = () => {
  const { user, updateProfile, refreshProfile } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setName(user.name);
    setEmail(user.email || '');

    const fetchMyOrders = async () => {
      try {
        setLoadingOrders(true);
        const res = await api.get('/orders/my-orders');
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to load my orders:', err.message);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchMyOrders();
  }, [user, navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setProfileLoading(true);

    try {
      await updateProfile({ name, email });
      setMessage('Profile updated successfully!');
      setEditMode(false);
      refreshProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const currency = settings?.currency || '₹';

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-50 text-yellow-600 border border-yellow-100';
      case 'Confirmed': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'Preparing': return 'bg-orange-50 text-orange-600 border border-orange-100';
      case 'Ready for Pickup': return 'bg-purple-50 text-purple-600 border border-purple-100';
      case 'Completed':
      case 'Collected': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'Cancelled': return 'bg-red-50 text-red-600 border border-red-100';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 dark:bg-slate-950 transition-colors duration-200">
      
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
          Customer Portal
        </h1>
        <p className="text-xs text-slate-400">Manage profile data, view your loyalty balances, and track orders</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Profile and loyalty Card */}
        <div className="space-y-6">
          
          {/* Loyalty Premium Card */}
          <div className="bg-gradient-to-tr from-slate-900 via-slate-850 to-primary-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
            {/* Sparkle decorative */}
            <div className="absolute right-4 bottom-4 text-9xl text-white/5 font-sans font-black select-none pointer-events-none">
              LOYAL
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] bg-accent-500 text-slate-950 font-black px-2 py-0.5 rounded-full tracking-widest uppercase">
                  Gold Member Card
                </span>
                <FiAward className="h-6 w-6 text-accent-400" />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Loyalty Points Balance</p>
                <h3 className="text-4xl font-extrabold text-accent-300 font-sans tracking-tight">
                  {user?.loyaltyPoints || 0}
                  <span className="text-xs text-slate-300 font-normal pl-1">Points</span>
                </h3>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400">
                <div>
                  <p className="text-[9px] uppercase tracking-wider">Redeemable Cash</p>
                  <p className="font-bold text-white text-sm">{currency}{((user?.loyaltyPoints || 0) * (settings?.loyaltyPointsValue || 1)).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wider">Owner Name</p>
                  <p className="font-bold text-white text-sm uppercase">{user?.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile form card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FiUser className="text-primary-600" /> Profile Details
              </h3>
              <button
                onClick={() => setEditMode(!editMode)}
                className="text-xs font-bold text-primary-700 dark:text-primary-400 flex items-center gap-1 hover:underline"
              >
                <FiEdit2 /> {editMode ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {message && <div className="p-2 text-xs bg-emerald-50 text-emerald-600 rounded-lg">{message}</div>}
            {error && <div className="p-2 text-xs bg-red-50 text-red-600 rounded-lg">{error}</div>}

            {editMode ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider shadow"
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            ) : (
              <div className="text-xs space-y-3.5 text-slate-600 dark:text-slate-400">
                <div className="flex gap-2 items-center">
                  <FiUser className="text-slate-400 h-4 w-4" />
                  <span><strong>Name:</strong> {user?.name}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <FiPhone className="text-slate-400 h-4 w-4" />
                  <span><strong>Mobile:</strong> {user?.mobile}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <FiMail className="text-slate-400 h-4 w-4" />
                  <span><strong>Email:</strong> {user?.email || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order History Listing Table */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FiShoppingBag className="text-primary-600" /> Order History
            </h3>

            {loadingOrders ? (
              <TableSkeleton />
            ) : orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">Order No</th>
                      <th className="py-3 px-2">Pickup Date</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Total</th>
                      <th className="py-3 px-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {orders.map((ord) => (
                      <tr key={ord._id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-2 font-mono font-bold text-slate-800 dark:text-white select-all">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3.5 px-2 text-slate-500">
                          {formatDate(ord.pickupDate)}
                        </td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${getStatusBadgeClass(ord.status)}`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-right font-bold text-slate-800 dark:text-white">
                          {currency}{ord.total.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-2 flex justify-center gap-2">
                          <Link
                            to={`/order-status/${ord._id}`}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                            title="Track Status"
                          >
                            <FiEye className="h-4.5 w-4.5" />
                          </Link>
                          
                          <button
                            onClick={() => window.open(`${baseApiUrl}/orders/${ord._id}/invoice`, '_blank')}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                            title="Print Invoice"
                          >
                            <FiPrinter className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <p className="text-3xl">🐔💤</p>
                <p className="text-xs font-semibold">No previous orders placed yet.</p>
                <Link to="/shop" className="text-xs text-primary-600 hover:underline font-bold uppercase tracking-wider block">Shop Fresh Stock Now</Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
