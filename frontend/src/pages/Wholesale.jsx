import React, { useState } from 'react';
import api from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import { FiBriefcase, FiUser, FiPhone, FiCalendar, FiClock, FiPlus, FiTrash2, FiMessageSquare } from 'react-icons/fi';

const Wholesale = () => {
  const { settings } = useSettings();

  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [message, setMessage] = useState('');
  const [items, setItems] = useState([{ productName: '', quantity: '', unit: 'KG' }]);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productName: '', quantity: '', unit: 'KG' }]);
  };

  const handleRemoveItem = (idx) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Form validations
    if (!businessName || !contactPerson || !mobile || !requiredDate) {
      setError('Please fill all required fields.');
      return;
    }

    const invalidItem = items.some(item => !item.productName || !item.quantity);
    if (invalidItem) {
      setError('Please fill in product names and quantities.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        businessName,
        contactPerson,
        mobile,
        email,
        requiredDate,
        pickupTime,
        message,
        items: items.map(item => ({
          productName: item.productName,
          quantity: parseFloat(item.quantity),
          unit: item.unit
        }))
      };

      const res = await api.post('/wholesale', payload);
      setSuccess('Wholesale enquiry submitted successfully! Redirecting to WhatsApp...');

      // Redirect client to WhatsApp with pre-filled message
      const adminPhone = settings?.whatsappNumber || '9876543210';
      const cleanAdminPhone = adminPhone.replace(/\s+/g, '');
      const waUrl = `https://wa.me/91${cleanAdminPhone}?text=${encodeURIComponent(res.data.whatsappText)}`;
      
      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 1500);

      // Reset form
      setBusinessName('');
      setContactPerson('');
      setMobile('');
      setEmail('');
      setRequiredDate('');
      setPickupTime('');
      setMessage('');
      setItems([{ productName: '', quantity: '', unit: 'KG' }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const productOptions = [
    'Broiler Chicken (Whole)',
    'Broiler Chicken (Dressed)',
    'Desi Chicken (Country)',
    'Kadaknath Chicken',
    'Farm Eggs (White)',
    'Brown Eggs (Organic)',
    'Poultry Feed / Supplements'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 dark:bg-slate-950 transition-colors duration-200">
      
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
          Wholesale Enquiries
        </h1>
        <p className="text-xs text-slate-400">Order bulk chicken and eggs directly at discounted rates for restaurants, caterers and resellers</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900/40">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl text-sm border border-emerald-100 dark:border-emerald-900/40">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm space-y-8">
        
        {/* Business details */}
        <div className="space-y-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-50 dark:border-slate-800 pb-3">
            1. Business Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <FiBriefcase /> Business / Restaurant Name *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="E.g., Khamrai Caterer, Royal Hotel"
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <FiUser /> Contact Person Name *
              </label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="E.g., Shib Charan Khamrai"
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <FiPhone /> Contact Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <FiBriefcase /> Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter business email"
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bulk products selection */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              2. Products Required
            </h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs font-bold text-primary-700 dark:text-primary-400 flex items-center gap-1"
            >
              <FiPlus /> Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                {/* Product Name Dropdown / Input */}
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    list="wholesale-products-list"
                    value={item.productName}
                    onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                    placeholder="Search or type product (e.g. Broiler Chicken)"
                    className="block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
                  />
                  <datalist id="wholesale-products-list">
                    {productOptions.map(opt => <option key={opt} value={opt} />)}
                  </datalist>
                </div>

                {/* Quantity */}
                <div className="w-full sm:w-36">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    placeholder="Quantity"
                    className="block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Unit */}
                <div className="w-full sm:w-28">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unit</label>
                  <select
                    value={item.unit}
                    onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                    className="block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="KG">KG</option>
                    <option value="Piece">Piece</option>
                    <option value="Dozen">Dozen</option>
                    <option value="Tray">Tray</option>
                    <option value="Gram">Gram</option>
                  </select>
                </div>

                {/* Remove button */}
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 mt-4 sm:mt-0 transition-colors"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pickup and notes */}
        <div className="space-y-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-50 dark:border-slate-800 pb-3">
            3. Scheduled Pickup Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Required Date */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <FiCalendar /> Required Date *
              </label>
              <input
                type="date"
                required
                value={requiredDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
              />
            </div>

            {/* Time slot */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <FiClock /> Expected Pickup Time Slot (Optional)
              </label>
              <input
                type="text"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                placeholder="E.g., 10:00 AM - 11:30 AM"
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Messages details */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Enquiry Message / Special Requirements (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide business details or negotiate specific packaging rates..."
              rows="4"
              className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none text-sm placeholder-slate-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-wider shadow-md transform hover:scale-[1.01] active:scale-95 transition-all duration-150"
        >
          <FiMessageSquare /> {loading ? 'Submitting...' : 'Submit Enquiry & Send WhatsApp'}
        </button>

      </form>
    </div>
  );
};

export default Wholesale;
