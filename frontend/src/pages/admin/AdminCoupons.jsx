import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import { TableSkeleton } from '../../components/Skeleton';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add, edit
  const [currentId, setCurrentId] = useState('');

  // Form Fields
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('0');
  const [status, setStatus] = useState('active');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/coupons?adminMode=true');
      setCoupons(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleOpenAdd = () => {
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinOrderAmount('0');
    setMaxDiscountAmount('');
    setExpiryDate('');
    setUsageLimit('0');
    setStatus('active');
    setModalMode('add');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setModalMode('edit');
    setCurrentId(c._id);
    setCode(c.code);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue.toString());
    setMinOrderAmount(c.minOrderAmount.toString());
    setMaxDiscountAmount(c.maxDiscountAmount ? c.maxDiscountAmount.toString() : '');
    setExpiryDate(new Date(c.expiryDate).toISOString().slice(0, 10));
    setUsageLimit(c.usageLimit.toString());
    setStatus(c.status || 'active');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      code,
      discountType,
      discountValue: parseFloat(discountValue),
      minOrderAmount: parseFloat(minOrderAmount),
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      expiryDate,
      usageLimit: parseInt(usageLimit),
      status
    };

    try {
      if (modalMode === 'add') {
        await api.post('/coupons', payload);
      } else {
        await api.put(`/coupons/${currentId}`, payload);
      }
      setShowModal(false);
      loadCoupons();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this coupon?')) return;
    setError('');
    try {
      await api.delete(`/coupons/${id}`);
      loadCoupons();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">Promo Coupons</h1>
          <p className="text-xs text-slate-400">View and configure promotional coupons discount rules</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
        >
          <FiPlus /> Add Coupon
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 border p-4 rounded-xl text-xs font-bold">{error}</div>}

      {/* Coupons table */}
      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : coupons.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Coupon Code</th>
                  <th className="py-4 px-6">Discount Type & Val</th>
                  <th className="py-4 px-6">Minimum Purchase</th>
                  <th className="py-4 px-6">Expiry Date</th>
                  <th className="py-4 px-6">Usage Count</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                {coupons.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-mono font-bold text-slate-800 dark:text-white text-sm select-all">
                      {c.code}
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      {c.discountType === 'percentage' ? `${c.discountValue}% Off` : `₹${c.discountValue} Off`}
                    </td>
                    <td className="py-4 px-6">
                      ₹{c.minOrderAmount}
                    </td>
                    <td className="py-4 px-6">
                      {new Date(c.expiryDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-4 px-6">
                      {c.usageCount} {c.usageLimit > 0 ? `/ ${c.usageLimit}` : '(Unlimited)'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                        c.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 text-red-500"
                        >
                          <FiTrash2 className="h-4 w-4" />
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
        <p className="text-xs text-slate-400 py-12 text-center select-none bg-white rounded-3xl border border-dashed">No coupons configured.</p>
      )}

      {/* Coupon Modal popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 rounded-3xl max-w-sm w-full p-6 space-y-6 border shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <FiX className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase border-b pb-3">
              {modalMode === 'add' ? 'Create Coupon' : 'Edit Coupon'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Coupon Code *</label>
                <input
                  type="text"
                  required
                  disabled={modalMode === 'edit'}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="E.g. FRESH20"
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800 uppercase tracking-wider font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Discount Type *</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Cash (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Discount Value *</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="E.g. 10"
                    className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Min Order Amount *</label>
                  <input
                    type="number"
                    required
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Max Cap (For % Type)</label>
                  <input
                    type="number"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    placeholder="No cap"
                    className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Usage Limit</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="0 = Unlimited"
                    className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow"
                >
                  Save Coupon Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCoupons;
