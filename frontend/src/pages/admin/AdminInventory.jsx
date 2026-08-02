import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiDatabase, FiTrendingUp, FiTrendingDown, FiClock, FiAlertTriangle, FiPlus } from 'react-icons/fi';
import { TableSkeleton } from '../../components/Skeleton';

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState('');
  const [adjustType, setAdjustType] = useState('IN'); // IN, OUT, ADJUST
  const [reason, setReason] = useState('New stock arrival');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const [prodRes, transRes] = await Promise.all([
        api.get('/products?adminMode=true'),
        api.get('/inventory/transactions')
      ]);
      setProducts(prodRes.data.filter(p => p.status === 'active'));
      setTransactions(transRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  const handleOpenAdjust = (product) => {
    setSelectedProduct(product._id);
    setQty('');
    setAdjustType('IN');
    setReason('New stock arrival');
    setError('');
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!selectedProduct || !qty || !adjustType) {
      setError('Please fill in all inputs.');
      return;
    }

    try {
      const res = await api.post('/inventory/adjust', {
        productId: selectedProduct,
        quantity: parseFloat(qty),
        type: adjustType,
        reason
      });

      setMessage(res.data.message || 'Inventory updated successfully!');
      setShowAdjustModal(false);
      loadInventoryData();
    } catch (err) {
      setError(err.message);
    }
  };

  const getTransactionBadge = (type) => {
    switch (type) {
      case 'IN': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'OUT': return 'bg-red-50 text-red-600 border border-red-100';
      case 'ADJUST': return 'bg-blue-50 text-blue-600 border border-blue-100';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="space-y-8">
      
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">Inventory Tracker</h1>
          <p className="text-xs text-slate-400">Track stock levels, configure limits and view transactions log</p>
        </div>

        <button
          onClick={() => {
            if (products.length > 0) setSelectedProduct(products[0]._id);
            setQty('');
            setShowAdjustModal(true);
          }}
          className="bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
        >
          <FiPlus /> Adjust Stock
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 border p-4 rounded-xl text-xs font-bold">{error}</div>}
      {message && <div className="bg-emerald-50 text-emerald-600 border p-4 rounded-xl text-xs font-bold">{message}</div>}

      {/* Low stock alerts warnings */}
      {!loading && products.some(p => p.stock <= p.lowStockThreshold) && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-4 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <FiAlertTriangle className="h-5 w-5 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <p className="font-bold">Low Stock Warning Alert!</p>
            <p className="mt-1">The following products have dropped below their safety threshold: <strong>
              {products.filter(p => p.stock <= p.lowStockThreshold).map(p => `${p.name} (${p.stock} ${p.unit} left)`).join(', ')}
            </strong>. Adjust stock levels immediately.</p>
          </div>
        </div>
      )}

      {/* Main split: stock levels vs transaction logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Stock levels catalog table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b pb-3 mb-4">Stock Levels</h2>
          
          {loading ? (
            <TableSkeleton rows={4} cols={3} />
          ) : products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5">Product</th>
                    <th className="py-2.5 text-center">Safety Limit</th>
                    <th className="py-2.5 text-right font-bold">Current Stock</th>
                    <th className="py-2.5 text-center">Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {products.map((p) => {
                    const isLow = p.stock <= p.lowStockThreshold;
                    return (
                      <tr key={p._id} className="hover:bg-slate-50/50">
                        <td className="py-3.5">
                          <strong className="text-slate-800 dark:text-white text-xs">{p.name}</strong>
                          <p className="text-[10px] text-slate-400">Unit base: {p.unit}</p>
                        </td>
                        <td className="py-3.5 text-center text-slate-500 font-semibold">
                          {p.lowStockThreshold} {p.unit}
                        </td>
                        <td className={`py-3.5 text-right font-black text-xs ${isLow ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>
                          {p.stock} {p.unit}
                        </td>
                        <td className="py-3.5 text-center">
                          <button
                            onClick={() => handleOpenAdjust(p)}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-1.5 px-3 rounded-lg text-[10px] font-bold"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center select-none">No active products to track stock.</p>
          )}
        </div>

        {/* Transaction History log list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><FiClock /> Transaction Logs</h2>

          {loading ? (
            <TableSkeleton rows={4} cols={1} />
          ) : transactions.length > 0 ? (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {transactions.map((tr) => (
                <div key={tr._id} className="text-xs bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-start">
                    <strong className="text-slate-800 dark:text-white font-semibold leading-tight">{tr.product?.name}</strong>
                    <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${getTransactionBadge(tr.type)}`}>
                      {tr.type}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 space-y-0.5">
                    <p>Change: {tr.type === 'IN' ? '+' : tr.type === 'OUT' ? '-' : ''}{tr.quantityChanged} {tr.product?.unit}</p>
                    <p>Stock: {tr.previousStock} ➔ <span className="font-bold text-slate-700 dark:text-slate-200">{tr.newStock} {tr.product?.unit}</span></p>
                    <p className="italic mt-1 text-slate-400">Reason: {tr.reason}</p>
                    {tr.updatedBy && <p className="text-[9px] text-slate-400 uppercase tracking-wide">By: {tr.updatedBy.name}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">No transactions recorded yet.</p>
          )}
        </div>

      </div>

      {/* Adjust Stock modal popup */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 rounded-3xl max-w-sm w-full p-6 space-y-6 border shadow-2xl relative">
            <button
              onClick={() => setShowAdjustModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <FiX className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase border-b pb-3">Adjust Product Stock</h3>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Product *</label>
                <select
                  required
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-white"
                >
                  {products.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock} {p.unit})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Type */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Adjustment Type *</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value)}
                    className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                  >
                    <option value="IN">Stock In (+)</option>
                    <option value="OUT">Stock Out (-)</option>
                    <option value="ADJUST">Set Exact (=)</option>
                  </select>
                </div>

                {/* Qty */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Quantity *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="0"
                    className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reason for Adjust *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="E.g., New stock arrival, spoilage, audit count"
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow"
                >
                  Execute Adjustments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminInventory;
