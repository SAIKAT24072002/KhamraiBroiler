import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import { FiPercent, FiGift, FiCopy, FiCheckCircle } from 'react-icons/fi';
import { CardSkeleton } from '../components/Skeleton';

const Offers = () => {
  const { settings } = useSettings();
  const [offers, setOffers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    const loadOffersData = async () => {
      try {
        setLoading(true);
        const [offerRes, couponRes] = await Promise.all([
          api.get('/offers'),
          api.get('/coupons')
        ]);
        setOffers(offerRes.data.filter(o => o.status === 'active'));
        setCoupons(couponRes.data.filter(c => c.status === 'active'));
      } catch (err) {
        console.error('Failed to load campaigns:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadOffersData();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 3000);
  };

  const currency = settings?.currency || '₹';

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 dark:bg-slate-950 transition-colors duration-200">
      
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
          Offers & Promo Coupons
        </h1>
        <p className="text-xs text-slate-400">Save extra cash on fresh chicken and eggs with our seasonal offers</p>
      </div>

      {/* 1. Promotional Coupons Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b pb-3">
          <FiPercent className="text-primary-600" /> Active Promo Coupons
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : coupons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coupons.map((c) => (
              <div
                key={c._id}
                className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Expires: {formatDate(c.expiryDate)}</span>
                  </div>

                  <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Save on pickup orders</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Apply this coupon code at checkout. Valid on orders above **{currency}{c.minOrderAmount}**.
                    {c.maxDiscountAmount ? ` Maximum discount capped at ${currency}${c.maxDiscountAmount}.` : ''}
                  </p>
                </div>

                {/* Promo Code tag Copy box */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 mt-4">
                  <span className="font-mono text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest pl-2">
                    {c.code}
                  </span>
                  <button
                    onClick={() => handleCopyCode(c.code)}
                    className="flex items-center gap-1 text-[10px] font-bold text-primary-700 hover:text-primary-800 dark:text-primary-400 uppercase tracking-wider bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg shadow-sm"
                  >
                    {copiedCode === c.code ? (
                      <>
                        <FiCheckCircle className="text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <FiCopy /> Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-400 py-6 text-xs text-center">
            No active coupons found. Check back later!
          </div>
        )}
      </div>

      {/* 2. Visual Offers Campaigns Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b pb-3">
          <FiGift className="text-primary-600" /> Active Offer Campaigns
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : offers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers.map((o) => (
              <div
                key={o._id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm grid grid-cols-1 sm:grid-cols-3 hover:shadow-md transition-shadow"
              >
                {o.image && (
                  <div className="h-44 sm:h-full bg-slate-50 dark:bg-slate-950/40 relative sm:col-span-1">
                    <img src={o.image} alt={o.title} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className={`p-6 space-y-4 flex flex-col justify-center ${o.image ? 'sm:col-span-2' : 'sm:col-span-3'}`}>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">{o.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{o.description}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 items-center text-[10px] text-slate-400">
                    {o.discountPercentage && (
                      <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded uppercase">
                        {o.discountPercentage}% Discount
                      </span>
                    )}
                    <span>Active until: {o.endDate ? formatDate(o.endDate) : 'Indefinite'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-400 py-6 text-xs text-center">
            No active campaign offers running. Check back soon!
          </div>
        )}
      </div>

    </div>
  );
};

export default Offers;
