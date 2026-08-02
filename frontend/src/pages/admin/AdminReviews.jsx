import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiCheckCircle, FiXCircle, FiStar, FiUser, FiCalendar, FiTrash2 } from 'react-icons/fi';
import { TableSkeleton } from '../../components/Skeleton';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reviews?adminMode=true');
      setReviews(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    setError('');
    setMessage('');
    try {
      await api.put(`/reviews/${id}/status`, { status });
      setMessage(`Review status updated to '${status}' successfully.`);
      loadReviews();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    setError('');
    try {
      await api.delete(`/reviews/${id}`);
      loadReviews();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-50 text-yellow-600 border border-yellow-100';
      case 'Approved': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'Rejected': return 'bg-red-50 text-red-600 border border-red-100';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="space-y-6 text-xs">
      
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">Review Approvals</h1>
        <p className="text-xs text-slate-400">Approve customer feedback testimonials to show them on the public storefront</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 border p-4 rounded-xl text-xs font-bold">{error}</div>}
      {message && <div className="bg-emerald-50 text-emerald-600 border p-4 rounded-xl text-xs font-bold">{message}</div>}

      {/* Review table list */}
      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : reviews.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Customer Details</th>
                  <th className="py-4 px-6">Feedback / Rating</th>
                  <th className="py-4 px-6">Product Context</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                {reviews.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 space-y-1">
                      <strong className="text-slate-800 dark:text-white text-sm">{r.customer?.name}</strong>
                      <p className="text-[10px] text-slate-400">Date: {new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                    </td>
                    <td className="py-4 px-6 space-y-2 max-w-[280px]">
                      <div className="flex gap-0.5 text-accent-500">
                        {Array.from({ length: r.rating }).map((_, idx) => (
                          <FiStar key={idx} className="fill-current" />
                        ))}
                      </div>
                      <p className="text-slate-600 dark:text-slate-350 italic">"{r.comment}"</p>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">
                      {r.product?.name || '(General Store Review)'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col sm:flex-row gap-1.5 justify-center items-center">
                        {r.status !== 'Approved' && (
                          <button
                            onClick={() => handleUpdateStatus(r._id, 'Approved')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-[9px] uppercase flex items-center gap-1"
                            title="Approve Review"
                          >
                            <FiCheckCircle /> Approve
                          </button>
                        )}
                        {r.status !== 'Rejected' && (
                          <button
                            onClick={() => handleUpdateStatus(r._id, 'Rejected')}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-1.5 px-3 rounded-lg text-[9px] uppercase flex items-center gap-1 border"
                            title="Reject Review"
                          >
                            <FiXCircle /> Reject
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(r._id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                          title="Delete Review"
                        >
                          <FiTrash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 py-12 text-center select-none bg-white rounded-3xl border border-dashed">No customer feedback reviews found.</p>
      )}

    </div>
  );
};

export default AdminReviews;
