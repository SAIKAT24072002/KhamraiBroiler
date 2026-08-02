import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiX, FiCheck } from 'react-icons/fi';
import { TableSkeleton } from '../../components/Skeleton';

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add, edit
  const [currentId, setCurrentId] = useState('');

  // Form Fields
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [buttonText, setButtonText] = useState('Shop Now');
  const [buttonLink, setButtonLink] = useState('/shop');
  const [status, setStatus] = useState('active');

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get('/banners?adminMode=true');
      setBanners(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleOpenAdd = () => {
    setImageUrl('');
    setTitle('');
    setSubtitle('');
    setButtonText('Shop Now');
    setButtonLink('/shop');
    setStatus('active');
    setModalMode('add');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (b) => {
    setModalMode('edit');
    setCurrentId(b._id);
    setImageUrl(b.image);
    setTitle(b.title || '');
    setSubtitle(b.subtitle || '');
    setButtonText(b.buttonText || 'Shop Now');
    setButtonLink(b.buttonLink || '/shop');
    setStatus(b.status || 'active');
    setError('');
    setShowModal(true);
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'banners');

    setUploading(true);
    setError('');
    try {
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImageUrl(res.data.url);
      setMessage('Banner image uploaded successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('Banner upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!imageUrl) {
      setError('Banner image is required.');
      return;
    }

    const payload = {
      image: imageUrl,
      title,
      subtitle,
      buttonText,
      buttonLink,
      status
    };

    try {
      if (modalMode === 'add') {
        await api.post('/banners', payload);
      } else {
        await api.put(`/banners/${currentId}`, payload);
      }
      setShowModal(false);
      loadBanners();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this banner?')) return;
    setError('');
    try {
      await api.delete(`/banners/${id}`);
      loadBanners();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">Promotional Banners</h1>
          <p className="text-xs text-slate-400">Configure visual slider banner campaigns appearing on the homepage</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
        >
          <FiPlus /> Add Banner
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 border p-4 rounded-xl text-xs font-bold">{error}</div>}
      {message && <div className="bg-emerald-50 text-emerald-600 border p-4 rounded-xl text-xs font-bold">{message}</div>}

      {/* Banner list card grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TableSkeleton rows={3} cols={1} />
        </div>
      ) : banners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((b) => (
            <div
              key={b._id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div className="h-44 bg-slate-50 dark:bg-slate-950/40 relative">
                <img src={b.image} alt={b.title} className="h-full w-full object-cover" />
                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded font-black text-[9px] uppercase shadow-sm ${
                  b.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white'
                }`}>
                  {b.status}
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">{b.title || '(No title)'}</h3>
                  <p className="text-[10px] text-slate-400">{b.subtitle || '(No subtitle)'}</p>
                </div>
                
                <div className="flex gap-2 text-[10px] text-slate-500">
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Btn: {b.buttonText}</span>
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded truncate max-w-[150px]">Link: {b.buttonLink}</span>
                </div>

                <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b._id)}
                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 text-red-500"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 py-12 text-center select-none bg-white rounded-3xl border border-dashed col-span-2">No banners found. Create one!</p>
      )}

      {/* Banner modal popup */}
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
              {modalMode === 'add' ? 'Create Slide Banner' : 'Edit Slide Banner'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload Banner */}
              <div className="grid grid-cols-3 items-center gap-4 border p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-990/50">
                <div className="col-span-1 h-14 bg-white dark:bg-slate-950 rounded-xl flex items-center justify-center overflow-hidden border">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Banner Preview" className="max-h-12 object-contain" />
                  ) : (
                    <span className="text-xl">🖼️</span>
                  )}
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Image (Upload / URL) *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Image URL link"
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Banner Heading Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g. Sunday Egg Wholesale Deal"
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subtitle Tagline</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="E.g. Get eggs at ₹6/piece on bulk tray purchases"
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Button Text</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Button Link</label>
                  <input
                    type="text"
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
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
                  Save Banner Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminBanners;
