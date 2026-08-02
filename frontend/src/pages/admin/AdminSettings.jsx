import React, { useState, useEffect } from 'react';
import api, { resolveImageUrl } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
import { FiSave, FiUpload, FiSettings, FiBriefcase, FiDollarSign } from 'react-icons/fi';
import { TableSkeleton } from '../../components/Skeleton';

const AdminSettings = () => {
  const { settings, refreshSettings } = useSettings();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Branding Fields
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  
  // Logistics Info
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [closingDay, setClosingDay] = useState('');
  
  // Payment Details
  const [upiId, setUpiId] = useState('');
  const [upiQrCodeUrl, setUpiQrCodeUrl] = useState('');
  const [enableRazorpay, setEnableRazorpay] = useState(false);
  const [enableManualUpi, setEnableManualUpi] = useState(true);

  // Uploading state triggers
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName || '');
      setTagline(settings.tagline || '');
      setDescription(settings.description || '');
      setLogoUrl(settings.logoUrl || '');
      setFaviconUrl(settings.faviconUrl || '');
      setPhone(settings.phone || '');
      setWhatsappNumber(settings.whatsappNumber || '');
      setEmail(settings.email || '');
      setStoreAddress(settings.storeAddress || '');
      setGoogleMapsUrl(settings.googleMapsUrl || '');
      setOpeningHours(settings.openingHours || '');
      setClosingDay(settings.closingDay || '');
      setUpiId(settings.upiId || '');
      setUpiQrCodeUrl(settings.upiQrCodeUrl || '');
      setEnableRazorpay(!!settings.enableRazorpay);
      setEnableManualUpi(!!settings.enableManualUpi);
      setLoading(false);
    }
  }, [settings]);

  const handleUploadImage = async (e, field, setUploadState, setUrlState) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'branding');

    setUploadState(true);
    setError('');
    try {
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUrlState(res.data.url);
      setMessage(`${field} image uploaded successfully.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(`${field} upload failed: ` + err.message);
    } finally {
      setUploadState(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    const payload = {
      businessName, tagline, description, logoUrl, faviconUrl,
      phone, whatsappNumber, email, storeAddress, googleMapsUrl,
      openingHours, closingDay, upiId, upiQrCodeUrl,
      enableRazorpay, enableManualUpi
    };

    try {
      await api.put('/settings', payload);
      setMessage('Business settings & branding updated successfully!');
      refreshSettings();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <TableSkeleton rows={4} cols={3} />;

  return (
    <div className="space-y-6">
      
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">Branding & Configurations</h1>
        <p className="text-xs text-slate-400">Configure business information, contact details, payment modes and design logo updates.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 border p-4 rounded-xl text-xs font-bold">{error}</div>}
      {message && <div className="bg-emerald-50 text-emerald-600 border p-4 rounded-xl text-xs font-bold">{message}</div>}

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-xs">
        
        {/* Col 1 & 2: Main dynamic configs form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Store Branding */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b pb-3 flex items-center gap-1.5"><FiBriefcase /> 1. Store Branding</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Business Name *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tagline / Motto *</label>
                <input
                  type="text"
                  required
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Store Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Store Logistics & Contact */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b pb-3 flex items-center gap-1.5"><FiSettings /> 2. Outlet Logistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contact Phone *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">WhatsApp Chat Number *</label>
                <input
                  type="text"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contact Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Opening Hours *</label>
                <input
                  type="text"
                  required
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Weekly Closing Day *</label>
                <input
                  type="text"
                  required
                  value={closingDay}
                  onChange={(e) => setClosingDay(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Google Maps URL *</label>
                <input
                  type="text"
                  required
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Outlet Counter Address *</label>
                <textarea
                  required
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  rows="2"
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payments details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b pb-3 flex items-center gap-1.5"><FiDollarSign /> 3. Payment Modes</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">UPI ID *</label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              <div className="flex flex-col gap-3 py-2">
                <label className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableManualUpi}
                    onChange={(e) => setEnableManualUpi(e.target.checked)}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4.5 w-4.5"
                  />
                  Enable Manual UPI Payments
                </label>

                <label className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableRazorpay}
                    onChange={(e) => setEnableRazorpay(e.target.checked)}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4.5 w-4.5"
                  />
                  Enable Automatic Razorpay Checkout
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex justify-center items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow"
          >
            <FiSave /> {saving ? 'Saving changes...' : 'Save Configuration Branding'}
          </button>
        </div>

        {/* Col 3: Visual uploads branding details (Logo, Favicon, UPI QR) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b pb-3">Store Assets</h2>

            {/* 1. Logo Upload */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Logo</label>
              <div className="h-32 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden border p-4">
                {logoUrl ? (
                  <img src={resolveImageUrl(logoUrl)} alt="Store Logo" className="max-h-24 object-contain" />
                ) : (
                  <span className="text-sm text-slate-400">No custom logo configured.</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="URL link"
                  className="flex-1 px-3 py-1.5 border rounded-lg dark:bg-slate-800"
                />
                <label className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer select-none">
                  <FiUpload /> {uploadingLogo ? '...' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadImage(e, 'Logo', setUploadingLogo, setLogoUrl)} />
                </label>
              </div>
            </div>

            {/* 2. Favicon Upload */}
            <div className="space-y-3 border-t pt-5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Store Favicon</label>
              <div className="h-20 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden border">
                {faviconUrl ? (
                  <img src={resolveImageUrl(faviconUrl)} alt="Store Favicon" className="max-h-10 object-contain" />
                ) : (
                  <span className="text-xs text-slate-450">Default favicon active.</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  placeholder="URL link"
                  className="flex-1 px-3 py-1.5 border rounded-lg dark:bg-slate-800"
                />
                <label className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer select-none">
                  <FiUpload /> {uploadingFavicon ? '...' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadImage(e, 'Favicon', setUploadingFavicon, setFaviconUrl)} />
                </label>
              </div>
            </div>

            {/* 3. UPI QR Upload */}
            <div className="space-y-3 border-t pt-5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">UPI QR Code Image</label>
              <div className="h-40 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden border p-2">
                {upiQrCodeUrl ? (
                  <img src={resolveImageUrl(upiQrCodeUrl)} alt="UPI QR Code" className="max-h-36 object-contain" />
                ) : (
                  <span className="text-xs text-slate-400 text-center">No custom QR. Fallback to standard rendering active.</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={upiQrCodeUrl}
                  onChange={(e) => setUpiQrCodeUrl(e.target.value)}
                  placeholder="URL link"
                  className="flex-1 px-3 py-1.5 border rounded-lg dark:bg-slate-800"
                />
                <label className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer select-none">
                  <FiUpload /> {uploadingQr ? '...' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadImage(e, 'QR Code', setUploadingQr, setUpiQrCodeUrl)} />
                </label>
              </div>
            </div>

          </div>
        </div>

      </form>
    </div>
  );
};

export default AdminSettings;
