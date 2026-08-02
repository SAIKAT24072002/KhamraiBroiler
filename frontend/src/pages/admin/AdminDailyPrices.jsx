import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
import { FiSave, FiAlertCircle, FiClock, FiDollarSign } from 'react-icons/fi';
import { TableSkeleton } from '../../components/Skeleton';

const AdminDailyPrices = () => {
  const { settings } = useSettings();
  const [products, setProducts] = useState([]);
  const [priceForm, setPriceForm] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadPriceData = async () => {
    try {
      setLoading(true);
      const [prodRes, histRes] = await Promise.all([
        api.get('/products?adminMode=true'),
        api.get('/prices/history')
      ]);
      const activeProds = prodRes.data.filter(p => p.status === 'active');
      setProducts(activeProds);
      
      // Initialize inputs state form
      setPriceForm(
        activeProds.map((p) => ({
          productId: p._id,
          name: p.name,
          unit: p.unit,
          retailPrice: p.retailPrice,
          wholesalePrice: p.wholesalePrice
        }))
      );

      setHistory(histRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPriceData();
  }, []);

  const handlePriceChange = (productId, field, value) => {
    setPriceForm((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSavePrices = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Form validation
    const invalidPrice = priceForm.some(p => p.retailPrice < 0 || p.wholesalePrice < 0);
    if (invalidPrice) {
      setError('Prices cannot be negative.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        prices: priceForm.map((p) => ({
          productId: p.productId,
          retailPrice: parseFloat(p.retailPrice),
          wholesalePrice: parseFloat(p.wholesalePrice)
        }))
      };

      const res = await api.post('/prices/update', payload);
      setMessage(res.data.message || 'Daily Price Sheet updated successfully!');
      
      // Reload history & data
      const histRes = await api.get('/prices/history');
      setHistory(histRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const currency = settings?.currency || '₹';

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">Today's Prices Management</h1>
        <p className="text-xs text-slate-400">Configure daily market rates. Changes reflect in real-time across the client storefront.</p>
      </div>

      {message && <div className="bg-emerald-50 text-emerald-600 border p-4 rounded-xl text-xs font-bold">{message}</div>}
      {error && <div className="bg-red-50 text-red-600 border p-4 rounded-xl text-xs font-bold">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Main pricing Sheet */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <form onSubmit={handleSavePrices} className="space-y-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b pb-3">Daily Price Sheet</h2>

            {loading ? (
              <TableSkeleton rows={4} cols={3} />
            ) : priceForm.length > 0 ? (
              <div className="space-y-4">
                {priceForm.map((item) => (
                  <div key={item.productId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-slate-800 dark:text-white text-xs">{item.name}</h3>
                      <p className="text-[10px] text-slate-400">Unit base: {item.unit}</p>
                    </div>

                    <div className="flex gap-4">
                      {/* Retail Price input */}
                      <div className="w-28">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Retail ({currency})</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.retailPrice}
                          onChange={(e) => handlePriceChange(item.productId, 'retailPrice', e.target.value)}
                          className="block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                        />
                      </div>

                      {/* Wholesale Price input */}
                      <div className="w-28">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Wholesale ({currency})</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.wholesalePrice}
                          onChange={(e) => handlePriceChange(item.productId, 'wholesalePrice', e.target.value)}
                          className="block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex justify-center items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow"
                >
                  <FiSave /> {saving ? 'Saving price list...' : 'Publish New Price Sheet'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-12">No active products to price. Add products first.</p>
            )}
          </form>
        </div>

        {/* Price adjustment History logs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><FiClock /> Change History</h2>

          {loading ? (
            <TableSkeleton rows={4} cols={1} />
          ) : history.length > 0 ? (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {history.map((log) => (
                <div key={log._id} className="text-xs bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-start">
                    <strong className="text-slate-800 dark:text-white font-semibold leading-tight">{log.product?.name}</strong>
                    <span className="text-[9px] text-slate-400">{formatDateTime(log.createdAt)}</span>
                  </div>
                  
                  <div className="text-[10px] space-y-0.5 text-slate-500">
                    <p>
                      Retail: {currency}{log.oldRetailPrice} ➔ <span className="text-emerald-600 font-bold">{currency}{log.newRetailPrice}</span>
                    </p>
                    <p>
                      Wholesale: {currency}{log.oldWholesalePrice} ➔ <span className="text-emerald-600 font-bold">{currency}{log.newWholesalePrice}</span>
                    </p>
                    <p className="text-[9px] italic mt-1 text-slate-400">By: {log.updatedBy?.name} ({log.updatedBy?.role})</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">No pricing logs found.</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDailyPrices;
