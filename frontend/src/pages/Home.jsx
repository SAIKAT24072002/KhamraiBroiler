import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import { useCart } from '../context/CartContext';
import { FiShoppingBag, FiTruck, FiArrowRight, FiShield, FiSmile, FiCompass, FiAward, FiStar, FiClock } from 'react-icons/fi';
import { CardSkeleton, BannerSkeleton } from '../components/Skeleton';
import ProductDetailsModal from '../components/ProductDetailsModal';

const Home = () => {
  const { settings } = useSettings();
  const { addToCart } = useCart();
  
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [bannerRes, categoryRes, productRes, reviewRes] = await Promise.all([
          api.get('/banners'),
          api.get('/categories'),
          api.get('/products?isFeatured=true'),
          api.get('/reviews')
        ]);
        
        setBanners(bannerRes.data.filter(b => b.status === 'active'));
        setCategories(categoryRes.data.filter(c => c.status === 'active'));
        setFeaturedProducts(productRes.data.filter(p => p.status === 'active').slice(0, 4));
        setReviews(reviewRes.data.filter(r => r.status === 'Approved').slice(0, 3));
      } catch (err) {
        console.error('Failed to load homepage components:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  // Slide rotation logic
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners]);

  const currency = settings?.currency || '₹';
  const tagline = settings?.tagline || 'Fresh Quality. Fair Price. Trusted Service.';

  return (
    <div className="space-y-16 pb-16 dark:bg-slate-950 transition-colors duration-200">
      
      {/* 1. Hero Slide Carousel */}
      {loading ? (
        <BannerSkeleton />
      ) : banners.length > 0 ? (
        <div className="relative h-[400px] sm:h-[500px] w-full overflow-hidden bg-slate-900">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-cover bg-center flex items-center"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.9) 30%, rgba(15, 23, 42, 0.4) 100%), url(${banners[currentSlide].image})`
              }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-white space-y-6">
                <motion.span
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-primary-600 text-white text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider inline-block"
                >
                  {banners[currentSlide].subtitle || 'Premium Poultry Outlet'}
                </motion.span>
                
                <motion.h1
                  initial={{ y: 25, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl sm:text-5xl font-extrabold max-w-xl leading-tight font-sans tracking-tight"
                >
                  {banners[currentSlide].title}
                </motion.h1>

                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-4 pt-2"
                >
                  <Link
                    to={banners[currentSlide].buttonLink || '/shop'}
                    className="bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center gap-1 text-sm transform hover:scale-105 active:scale-95 transition-all duration-150"
                  >
                    {banners[currentSlide].buttonText} <FiArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === idx ? 'w-6 bg-primary-600' : 'w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Fallback Default Hero */
        <div className="bg-gradient-to-r from-slate-900 to-primary-950 text-white py-20 px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-6 max-w-xl">
              <span className="bg-accent-500 text-slate-950 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Fresh from local farms
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                {settings?.businessName || 'KHAMRAI BROILER CENTER'}
              </h1>
              <p className="text-lg text-slate-300">
                {tagline}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/shop" className="bg-primary-700 hover:bg-primary-800 text-white py-3.5 px-6 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                  Shop Fresh Stock <FiShoppingBag />
                </Link>
                <Link to="/wholesale" className="bg-slate-800 hover:bg-slate-700 text-white py-3.5 px-6 rounded-xl font-bold text-sm flex items-center gap-2">
                  Wholesale Enquiry <FiTruck />
                </Link>
              </div>
            </div>
            {/* Visual element */}
            <div className="relative text-9xl select-none opacity-20 md:opacity-100 transform rotate-12">
              🐔🐔
            </div>
          </div>
        </div>
      )}

      {/* 2. Categories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
            Browse Categories
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Choose from our fresh, carefully segmented range of high quality chicken and farm egg stocks
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((c) => (
              <Link
                key={c._id}
                to={`/shop?category=${c.slug}`}
                className="group relative h-40 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center p-4 hover:-translate-y-1.5"
              >
                {c.image ? (
                  <img
                    src={c.image}
                    alt={c.name}
                    className="h-16 w-16 object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-4xl mb-2">📦</div>
                )}
                <span className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                  {c.name}
                </span>
                <span className="absolute bottom-2 right-2 text-[10px] text-slate-400 dark:text-slate-500">
                  Explore &rarr;
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 3. Featured Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
              Featured Items
            </h2>
            <p className="text-xs text-slate-400">Best quality fresh stock ready for pickup today</p>
          </div>
          <Link to="/shop" className="text-sm font-bold text-primary-700 hover:text-primary-800 dark:text-primary-400 flex items-center gap-1">
            View All Shop <FiArrowRight />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <div
                key={p._id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                <div onClick={() => setSelectedProduct(p)} className="cursor-pointer space-y-4">
                  <div className="h-44 bg-slate-50 dark:bg-slate-950/40 rounded-2xl flex items-center justify-center overflow-hidden">
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="max-h-36 object-contain hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <span className="text-5xl">🐔</span>
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
        )}
      </div>

      {/* 4. How It Works Section */}
      <div className="bg-slate-100 dark:bg-slate-900/60 py-16 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
              How Store Pickup Works
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              We operate exclusively on Store Pickup. Follow these simple steps to place and collect your fresh stock.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm text-center space-y-4">
              <div className="h-12 w-12 bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-2xl flex items-center justify-center font-bold text-lg mx-auto">
                1
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white">Place Order Online</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Browse chicken or eggs, add them to your cart, verify your mobile number via OTP, and select your preferred pickup date and time slot.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm text-center space-y-4">
              <div className="h-12 w-12 bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-2xl flex items-center justify-center font-bold text-lg mx-auto">
                2
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white">Make Payment</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose to pay securely via dynamic UPI QR code on the website, or select Cash on Pickup to pay physically at our outlet counters.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm text-center space-y-4">
              <div className="h-12 w-12 bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-2xl flex items-center justify-center font-bold text-lg mx-auto">
                3
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white">Collect from Store</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visit the store at your chosen slot. Show your Order ID invoice at the counter, collect your fresh stock, and earn dynamic loyalty points!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Reviews / Testimonials */}
      {reviews.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-1">
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
              Customer Feedbacks
            </h2>
            <p className="text-xs text-slate-400">What our valued patrons say about us</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <div
                key={r._id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4"
              >
                <div className="flex gap-1 text-accent-500">
                  {Array.from({ length: r.rating }).map((_, idx) => (
                    <FiStar key={idx} className="fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  "{r.comment}"
                </p>
                <div className="flex items-center gap-2 border-t border-slate-50 dark:border-slate-800 pt-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                    {r.customer?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">{r.customer?.name}</h4>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Verified Buyer</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Dynamic Google Maps Location */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
            Store Location
          </h2>
          <p className="text-xs text-slate-400">Visit us to collect your fresh orders</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-2">
          <div className="p-8 space-y-6 flex flex-col justify-center">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase">Khamrai Broiler Center</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {settings?.storeAddress || 'Station Road, Khamrai Market, Midnapore, West Bengal, India'}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <FiClock className="text-primary-600" />
                <span className="font-bold text-slate-700 dark:text-slate-300">Open Hours: {settings?.openingHours || '07:00 AM - 09:00 PM'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiAward className="text-primary-600" />
                <span className="font-bold text-slate-700 dark:text-slate-300">Weekly Close: {settings?.closingDay || 'None'}</span>
              </div>
            </div>

            {settings?.googleMapsUrl && (
              <a
                href={settings.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold py-3.5 px-6 rounded-xl shadow-md w-fit flex items-center gap-2 transition-colors uppercase tracking-wider"
              >
                <FiCompass /> Navigate on Google Maps
              </a>
            )}
          </div>
          <div className="h-64 md:h-auto min-h-[300px] bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center text-slate-400">
            {/* Visual fallback frame if iframe maps cannot be generated easily */}
            <span className="text-xs text-center p-8 select-none">
              📍 Embedded Interactive Map Placeholder.<br/>
              Map targets coordinates for midnapore location.<br/>
              To configure, adjust maps settings in Admin settings.
            </span>
          </div>
        </div>
      </div>

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

export default Home;
