import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiX } from 'react-icons/fi';
import { TableSkeleton } from '../../components/Skeleton';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add, edit
  const [currentId, setCurrentId] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('active');

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories?adminMode=true');
      setCategories(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenAdd = () => {
    setName('');
    setImageUrl('');
    setStatus('active');
    setModalMode('add');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setModalMode('edit');
    setCurrentId(c._id);
    setName(c.name);
    setImageUrl(c.image || '');
    setStatus(c.status || 'active');
    setError('');
    setShowModal(true);
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'categories');

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

    const payload = { name, image: imageUrl, status };

    try {
      if (modalMode === 'add') {
        await api.post('/categories', payload);
      } else {
        await api.put(`/categories/${currentId}`, payload);
      }
      setShowModal(false);
      loadCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this category? Linked products might restrict deletion.')) return;
    setError('');
    try {
      await api.delete(`/categories/${id}`);
      loadCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">Categories Panel</h1>
          <p className="text-xs text-slate-400">Manage chicken and egg divisions for client side groupings</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
        >
          <FiPlus /> Add Category
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 border p-4 rounded-xl text-xs font-bold">{error}</div>}
      {message && <div className="bg-emerald-50 text-emerald-600 border p-4 rounded-xl text-xs font-bold">{message}</div>}

      {/* List categories */}
      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : categories.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Image</th>
                  <th className="py-4 px-6">Category Title</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                {categories.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6">
                      <div className="h-10 w-10 rounded-lg bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden border">
                        {c.image ? (
                          <img src={c.image} alt={c.name} className="max-h-8 object-contain" />
                        ) : (
                          <span className="text-lg">📦</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <strong className="text-slate-800 dark:text-white text-sm uppercase tracking-tight">{c.name}</strong>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                        c.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                          title="Edit"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(c._id)}
                          className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 text-red-500"
                          title="Delete"
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
          No categories found. Add categories to structure products catalog.
        </div>
      )}

      {/* Modal CRUD categories popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 rounded-3xl max-w-md w-full p-6 space-y-6 border shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <FiX className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase border-b pb-3">
              {modalMode === 'add' ? 'Create Category' : 'Edit Category Info'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. Broiler Birds, Fresh Eggs"
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-white"
                />
              </div>

              {/* Upload image category */}
              <div className="grid grid-cols-3 items-center gap-4 border p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-990/50">
                <div className="col-span-1 h-14 bg-white dark:bg-slate-950 rounded-xl flex items-center justify-center overflow-hidden border">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Category Icon" className="max-h-12 object-contain" />
                  ) : (
                    <span className="text-xl">📦</span>
                  )}
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Icon (Upload / URL)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Icon URL"
                      className="flex-1 px-3 py-1.5 border rounded-lg dark:bg-slate-800"
                    />
                    <label className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer select-none">
                      <FiUpload /> {uploading ? '...' : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
                    </label>
                  </div>
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
                  {modalMode === 'add' ? 'Create Category' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCategories;
