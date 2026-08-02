import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
import { FiPlus, FiEdit2, FiCopy, FiTrash2, FiUpload, FiX, FiCheck, FiFolder } from 'react-icons/fi';
import { TableSkeleton } from '../../components/Skeleton';

const AdminProducts = () => {
  const { settings } = useSettings();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add, edit
  const [currentId, setCurrentId] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('KG');
  const [retailPrice, setRetailPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [stock, setStock] = useState('0');
  const [minOrder, setMinOrder] = useState('1');
  const [maxOrder, setMaxOrder] = useState('1000');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [status, setStatus] = useState('active');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPopular, setIsPopular] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get('/products?adminMode=true'),
        api.get('/categories?adminMode=true')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setName('');
    setCategory('');
    setImageUrl('');
    setDescription('');
    setUnit('KG');
    setRetailPrice('');
    setWholesalePrice('');
    setStock('0');
    setMinOrder('1');
    setMaxOrder('1000');
    setLowStockThreshold('10');
    setStatus('active');
    setIsFeatured(false);
    setIsPopular(false);
    setError('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setModalMode('add');
    if (categories.length > 0) setCategory(categories[0]._id);
    setShowModal(true);
  };

  const handleOpenEditModal = (p) => {
    setModalMode('edit');
    setCurrentId(p._id);
    setName(p.name);
    setCategory(p.category?._id || '');
    setImageUrl(p.images?.[0] || '');
    setDescription(p.description || '');
    setUnit(p.unit || 'KG');
    setRetailPrice(p.retailPrice.toString());
    setWholesalePrice(p.wholesalePrice.toString());
    setStock(p.stock.toString());
    setMinOrder(p.minOrder.toString());
    setMaxOrder(p.maxOrder.toString());
    setLowStockThreshold(p.lowStockThreshold.toString());
    setStatus(p.status || 'active');
    setIsFeatured(!!p.isFeatured);
    setIsPopular(!!p.isPopular);
    setError('');
    setShowModal(true);
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'products');

    setUploading(true);
    setError('');
    try {
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImageUrl(res.data.url);
      setMessage('Image uploaded successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('Image upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      name,
      category,
      images: imageUrl ? [imageUrl] : [],
      description,
      unit,
      retailPrice: parseFloat(retailPrice),
      wholesalePrice: parseFloat(wholesalePrice),
      stock: parseInt(stock),
      minOrder: parseInt(minOrder),
      maxOrder: parseInt(maxOrder),
      lowStockThreshold: parseInt(lowStockThreshold),
      status,
      isFeatured,
      isPopular
    };

    try {
      if (modalMode === 'add') {
        await api.post('/products', payload);
      } else {
        await api.put(`/products/${currentId}`, payload);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDuplicate = async (id) => {
    setError('');
    try {
      await api.post(`/products/${id}/duplicate`);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this product?')) return;
    setError('');
    try {
      await api.delete(`/products/${id}`);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const currency = settings?.currency || '₹';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">Products Catalog</h1>
          <p className="text-xs text-slate-400">View, add, modify, duplicate or delete poultry catalog items</p>
        </div>
        
        <button
          onClick={handleOpenAddModal}
          className="bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
        >
          <FiPlus /> Add Product
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 border p-4 rounded-xl text-xs font-bold">{error}</div>}
      {message && <div className="bg-emerald-50 text-emerald-600 border p-4 rounded-xl text-xs font-bold">{message}</div>}

      {/* Products table */}
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : products.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Image</th>
                  <th className="py-4 px-6">Product Details</th>
                  <th className="py-4 px-6">Stock</th>
                  <th className="py-4 px-6">Base Pricing</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6">
                      <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden border">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="max-h-10 object-contain" />
                        ) : (
                          <span className="text-xl">🐔</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <strong className="text-slate-800 dark:text-white text-sm">{p.name}</strong>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">{p.category?.name || 'Uncategorized'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`font-bold ${p.stock <= p.lowStockThreshold ? 'text-red-500 font-black animate-pulse' : 'text-slate-700 dark:text-slate-300'}`}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="py-4 px-6 space-y-0.5">
                      <p className="font-semibold">Retail: {currency}{p.retailPrice}</p>
                      <p className="text-[10px] text-slate-400">Wholesale: {currency}{p.wholesalePrice}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                        p.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                          title="Edit"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDuplicate(p._id)}
                          className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                          title="Duplicate Copy"
                        >
                          <FiCopy className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(p._id)}
                          className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 text-red-500"
                          title="Permanently Delete"
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
        <div className="text-center py-12 text-slate-400 select-none bg-white rounded-3xl border border-dashed">
          No products in the catalog. Add one!
        </div>
      )}

      {/* Modal Popup creation/editing */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 rounded-3xl max-w-3xl w-full p-6 space-y-6 border shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <FiX className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase border-b pb-3">
              {modalMode === 'add' ? 'Add Catalog Product' : 'Modify Product details'}
            </h3>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Product Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. Fresh Broiler Chicken"
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-white"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category *</label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-white"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              {/* Image upload */}
              <div className="md:col-span-2 grid grid-cols-3 items-center gap-4 border p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                <div className="col-span-1 h-20 bg-white dark:bg-slate-950 rounded-xl flex items-center justify-center overflow-hidden border">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Uploaded logo" className="max-h-16 object-contain" />
                  ) : (
                    <span className="text-2xl text-slate-350">🐔</span>
                  )}
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Image (Upload / URL)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Image URL link"
                      className="flex-1 px-3 py-1.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                    />
                    <label className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer select-none">
                      <FiUpload /> {uploading ? '...' : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Retail and Wholesale Prices */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Retail Price *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(e.target.value)}
                  placeholder="0.00"
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Wholesale Price *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(e.target.value)}
                  placeholder="0.00"
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              {/* Unit and Stock */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Unit Base *</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                >
                  <option value="KG">KG</option>
                  <option value="Piece">Piece</option>
                  <option value="Dozen">Dozen</option>
                  <option value="Tray">Tray</option>
                  <option value="Gram">Gram</option>
                  <option value="Custom">Custom Unit</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Stock Level *</label>
                <input
                  type="number"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              {/* Minimum & Maximum Limits */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Min Order (For Wholesale) *</label>
                <input
                  type="number"
                  required
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Max Order Limit *</label>
                <input
                  type="number"
                  required
                  value={maxOrder}
                  onChange={(e) => setMaxOrder(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              {/* Warning stock threshold and status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Low Stock Warning Threshold *</label>
                <input
                  type="number"
                  required
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>

              {/* Featured Flags */}
              <div className="md:col-span-2 flex gap-6 py-2">
                <label className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4.5 w-4.5"
                  />
                  Featured Product
                </label>

                <label className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4.5 w-4.5"
                  />
                  Popular Product
                </label>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter details..."
                  rows="3"
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              <div className="md:col-span-2 pt-4">
                <button
                  type="submit"
                  className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow"
                >
                  {modalMode === 'add' ? 'Create Product Catalog' : 'Update Catalog Info'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProducts;
