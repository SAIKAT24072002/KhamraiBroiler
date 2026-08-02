import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiClock, FiBriefcase, FiUser, FiPhone, FiCheckCircle, FiTrash2, FiMessageSquare } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { TableSkeleton } from '../../components/Skeleton';

const AdminWholesale = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/wholesale');
      setEnquiries(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this enquiry as '${status}'?`)) return;
    setError('');
    setMessage('');
    try {
      await api.put(`/wholesale/${id}/status`, { status });
      setMessage(`Enquiry marked as '${status}' successfully.`);
      loadEnquiries();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-50 text-yellow-600 border border-yellow-100';
      case 'Contacted': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'Approved': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'Rejected': return 'bg-red-50 text-red-600 border border-red-100';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 text-xs">
      
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">Wholesale Leads</h1>
        <p className="text-xs text-slate-400">View bulk order requests and coordinate pricing terms directly via WhatsApp</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 border p-4 rounded-xl text-xs font-bold">{error}</div>}
      {message && <div className="bg-emerald-50 text-emerald-600 border p-4 rounded-xl text-xs font-bold">{message}</div>}

      {/* List Wholesale requests */}
      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : enquiries.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Business Details</th>
                  <th className="py-4 px-6">Required Items</th>
                  <th className="py-4 px-6">Expected Pickup</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                {enquiries.map((enq) => (
                  <tr key={enq._id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 space-y-1">
                      <strong className="text-slate-800 dark:text-white text-sm uppercase">{enq.businessName}</strong>
                      <p className="text-slate-500 font-semibold flex items-center gap-1"><FiUser /> {enq.contactPerson}</p>
                      <p className="text-slate-400 flex items-center gap-1"><FiPhone /> {enq.mobile}</p>
                      {enq.email && <p className="text-[10px] text-slate-400">{enq.email}</p>}
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        {enq.items.map((item, idx) => (
                          <div key={idx} className="font-semibold text-slate-700 dark:text-slate-300">
                            &bull; {item.productName}: {item.quantity} {item.unit}
                          </div>
                        ))}
                      </div>
                      {enq.message && <p className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-dashed text-[10px] text-slate-500 mt-2 max-w-[200px]">Note: {enq.message}</p>}
                    </td>
                    <td className="py-4 px-6 space-y-0.5">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(enq.requiredDate)}</p>
                      {enq.pickupTime && <p className="text-[10px] text-slate-450">{enq.pickupTime}</p>}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${getStatusBadge(enq.status)}`}>
                        {enq.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-2 items-center justify-center">
                        {/* WhatsApp trigger */}
                        <a
                          href={`https://wa.me/91${enq.mobile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-[9px] uppercase flex items-center gap-1"
                        >
                          <FaWhatsapp /> WhatsApp Lead
                        </a>
                        
                        <div className="flex gap-1.5 mt-1">
                          {enq.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(enq._id, 'Contacted')}
                                className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-2 rounded font-bold text-[9px]"
                              >
                                Contacted
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(enq._id, 'Approved')}
                                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 py-1 px-2 rounded font-bold text-[9px]"
                              >
                                Approve
                              </button>
                            </>
                          )}
                          {enq.status === 'Contacted' && (
                            <button
                              onClick={() => handleUpdateStatus(enq._id, 'Approved')}
                              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 py-1 px-2 rounded font-bold text-[9px]"
                            >
                              Approve Bulk
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 select-none bg-white rounded-3xl border border-dashed">
          No wholesale enquiries found.
        </div>
      )}

    </div>
  );
};

export default AdminWholesale;
