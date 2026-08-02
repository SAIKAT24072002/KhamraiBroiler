import React from 'react';
import { FiX, FiCheckCircle, FiMessageSquare } from 'react-icons/fi';
import { useSettings } from '../context/SettingsContext';

const ProductDetailsModal = ({ product, onClose, onAddToCart }) => {
  const { settings } = useSettings();
  if (!product) return null;

  const currency = settings?.currency || '₹';
  const whatsappNum = settings?.whatsappNumber || '';

  // Generate prefilled product WhatsApp message
  const whatsappMsg = `Hello KHAMRAI BROILER CENTER, I am interested in *${product.name}* (Price: ${currency}${product.retailPrice}/${product.unit}). Please tell me if it is available today.`;
  const whatsappUrl = `https://wa.me/91${whatsappNum}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700 transition-colors duration-200">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 transition-colors z-10"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Images */}
          <div className="bg-slate-50 dark:bg-slate-900/40 p-6 flex items-center justify-center min-h-[300px]">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="max-h-64 object-contain rounded-2xl drop-shadow-lg"
              />
            ) : (
              <div className="text-slate-300 dark:text-slate-700 text-6xl">🐔</div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {product.category?.name || 'Poultry'}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">
                {product.name}
              </h2>

              {/* Pricing details */}
              <div className="flex flex-wrap gap-4 items-baseline">
                <span className="text-3xl font-extrabold text-primary-700 dark:text-primary-400">
                  {currency}{product.retailPrice}
                  <span className="text-sm text-slate-400 dark:text-slate-500 font-semibold font-sans">
                    /{product.unit}
                  </span>
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  Wholesale: {currency}{product.wholesalePrice}/{product.unit}
                </span>
              </div>

              {/* Stock status */}
              <div>
                {product.stock > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <FiCheckCircle className="h-4 w-4" /> In Stock ({product.stock} {product.unit} available)
                  </span>
                ) : (
                  <span className="text-red-500 text-xs font-bold">Out of Stock</span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {product.description || 'Premium farm fresh poultry product sourced under strict hygiene controls.'}
              </p>

              {/* Highlights */}
              {product.highlights && product.highlights.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Highlights</h4>
                  <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                    {product.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Wholesale Pricing Tiers */}
              {product.wholesaleTiers && product.wholesaleTiers.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Wholesale Quantity Discounts</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {product.wholesaleTiers.map((tier, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/40">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{tier.minQty}{tier.maxQty ? `-${tier.maxQty}` : '+'} {product.unit}</span>
                        <p className="text-primary-600 font-extrabold">{currency}{tier.price}/{product.unit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-6 mt-auto border-t border-slate-100 dark:border-slate-700/50">
              <button
                disabled={product.stock <= 0}
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                className="flex-1 bg-primary-700 hover:bg-primary-800 disabled:bg-slate-200 dark:disabled:bg-slate-700 text-white py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg disabled:cursor-not-allowed transition-all duration-150 text-center"
              >
                Add to Cart
              </button>

              {whatsappNum && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-3 rounded-xl border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all font-bold text-sm gap-1.5"
                >
                  <FiMessageSquare className="h-5 w-5" /> Ask
                </a>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ProductDetailsModal;
