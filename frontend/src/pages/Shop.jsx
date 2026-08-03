import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { FiSearch, FiSliders, FiGrid } from 'react-icons/fi';
import { CardSkeleton } from '../components/Skeleton';
import ProductDetailsModal from '../components/ProductDetailsModal';

const Shop = () => {
  const { addToCart } = useCart();
  const { settings } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const loadShopData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories')
        ]);
        setProducts(prodRes.data.filter(p => p.status === 'active'));
        setCategories(catRes.data.filter(c => c.status === 'active'));
      } catch (err) {
        console.error('Failed to load shop items:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadShopData();
  }, []);

  const handleCategorySelect = (categorySlug) => {
    if (categorySlug === '') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categorySlug);
    }
    setSearchParams(searchParams);
  };

  // Filter products based on search term and category selection
  const filteredProducts = products.filter((p) => {
    const matchesCategory = categoryFilter === '' || p.category?.slug === categoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const currency = settings?.currency || '₹';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 overflow-y-auto dark:bg-slate-950 transition-colors duration-200">
      
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
          Shop Fresh Poultry
        </h1>
        <p className="text-sm text-slate-500">Pick the best items, add to cart, and schedule your counter pickup</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <FiSearch className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search chicken, eggs, desi birds..."
            className="block w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none max-w-full">
          <button
            onClick={() => handleCategorySelect('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all uppercase tracking-wider ${
              categoryFilter === ''
                ? 'bg-primary-700 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800/80 hover:bg-slate-50'
            }`}
          >
            All Items
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => handleCategorySelect(c.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all uppercase tracking-wider ${
                categoryFilter === c.slug
                  ? 'bg-primary-700 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800/80 hover:bg-slate-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <div
              key={p._id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between hover:-translate-y-1"
            >
              <div onClick={() => setSelectedProduct(p)} className="cursor-pointer space-y-4">
                <div className="h-36 md:h-44 bg-slate-50 dark:bg-slate-950/40 rounded-2xl flex items-center justify-center overflow-hidden relative">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="max-h-36 object-contain hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <span className="text-5xl">🐔</span>
                  )}
                  {/* Min quantity indicator for wholesale */}
                  {p.minOrder > 1 && (
                    <span className="absolute bottom-2 left-2 bg-accent-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                      Wholesale Tier Available
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {p.category?.name}
                  </span>
                  <h3 className="font-bold text-slate-800 dark:text-white truncate">{p.name}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2">{p.description}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-800 mt-4">
                <div>
                  <span className="text-lg font-extrabold text-primary-700 dark:text-primary-400">
                    {currency}{p.retailPrice}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold font-sans">/{p.unit}</span>
                  {p.stock > 0 && p.stock <= p.lowStockThreshold && (
                    <p className="text-[10px] text-red-500 font-bold">Only {p.stock} left!</p>
                  )}
                </div>

                <button
                  disabled={p.stock <= 0}
                  onClick={() => addToCart(p, 1)}
                  className="bg-primary-700 hover:bg-primary-800 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md disabled:cursor-not-allowed transition-colors"
                >
                  {p.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-16 text-center space-y-4 shadow-sm">
          <div className="text-6xl text-slate-300 select-none">🐔🔎</div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase">No Products Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We couldn't find any active products matching your current category filter or search query. Please try adjusting your parameters.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              handleCategorySelect('');
            }}
            className="bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-md uppercase tracking-wider"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Product Details Modal Overlay */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

    </div>
  );
};

export default Shop;
