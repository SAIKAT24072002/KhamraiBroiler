import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useSettings } from '../context/SettingsContext';

const TodayPriceTicker = () => {
  const { settings } = useSettings();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data.filter(p => p.status === 'active'));
      } catch (err) {
        console.error('Ticker failed to fetch product prices:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, []);

  if (loading || products.length === 0) return null;

  const currency = settings?.currency || '₹';

  return (
    <div className="bg-gradient-to-r from-primary-800 to-red-900 text-white py-1.5 px-4 overflow-hidden relative z-50 text-xs font-semibold shadow-inner">
      <div className="flex whitespace-nowrap items-center animate-marquee">
        <span className="bg-accent-500 text-slate-900 text-[10px] px-2 py-0.5 rounded-full mr-6 animate-pulse uppercase tracking-wider font-extrabold">
          Today's Rates
        </span>
        <div className="inline-flex gap-8 divide-x divide-white/20">
          {products.map((p) => (
            <span key={p._id} className="pl-6 flex items-center gap-1.5">
              <span className="text-white/80">{p.name}:</span>
              <span className="text-accent-300 font-bold">
                Retail {currency}{p.retailPrice}/{p.unit}
              </span>
              <span className="text-slate-300 text-[10px] pl-1 font-normal">
                (Wholesale {currency}{p.wholesalePrice})
              </span>
            </span>
          ))}
        </div>
      </div>
      
      {/* Inject custom CSS keyframes for marquee animation inline */}
      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default TodayPriceTicker;
