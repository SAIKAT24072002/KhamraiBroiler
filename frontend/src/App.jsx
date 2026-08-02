import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Customer layout components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TodayPriceTicker from './components/TodayPriceTicker';
import FloatingWhatsapp from './components/FloatingWhatsapp';

// Customer Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import Wholesale from './pages/Wholesale';
import Offers from './pages/Offers';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderStatus from './pages/OrderStatus';
import Profile from './pages/Profile';
import Login from './pages/Login';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminDailyPrices from './pages/admin/AdminDailyPrices';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminInventory from './pages/admin/AdminInventory';
import AdminOrders from './pages/admin/AdminOrders';
import AdminSettings from './pages/admin/AdminSettings';
import AdminWholesale from './pages/admin/AdminWholesale';
import AdminStaff from './pages/admin/AdminStaff';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminReviews from './pages/admin/AdminReviews';
import AdminBanners from './pages/admin/AdminBanners';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

// Customer Layout Wrapper
const CustomerLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <TodayPriceTicker />
      <Navbar />
      <div className="flex-1 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        {children}
      </div>
      <FloatingWhatsapp />
      <Footer />
    </div>
  );
};

// Admin Protection Route Wrapper
const AdminProtectedRoute = ({ children }) => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-lg">Verifying credentials...</div>;

  const isStaff = hasRole(['admin', 'manager', 'sales', 'inventory']);
  if (!user || !isStaff) {
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <CartProvider>
            <Router>
              <Routes>
                
                {/* 1. Customer Storefront Routes */}
                <Route path="/" element={<CustomerLayout><Home /></CustomerLayout>} />
                <Route path="/shop" element={<CustomerLayout><Shop /></CustomerLayout>} />
                <Route path="/wholesale" element={<CustomerLayout><Wholesale /></CustomerLayout>} />
                <Route path="/offers" element={<CustomerLayout><Offers /></CustomerLayout>} />
                <Route path="/contact" element={<CustomerLayout><Contact /></CustomerLayout>} />
                <Route path="/cart" element={<CustomerLayout><Cart /></CustomerLayout>} />
                <Route path="/checkout" element={<CustomerLayout><Checkout /></CustomerLayout>} />
                <Route path="/order-status/:id" element={<CustomerLayout><OrderStatus /></CustomerLayout>} />
                <Route path="/profile" element={<CustomerLayout><Profile /></CustomerLayout>} />
                <Route path="/login" element={<CustomerLayout><Login /></CustomerLayout>} />

                {/* 2. Admin Portal Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminProtectedRoute>
                      <AdminLayout />
                    </AdminProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="daily-prices" element={<AdminDailyPrices />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="inventory" element={<AdminInventory />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="wholesale" element={<AdminWholesale />} />
                  <Route path="staff" element={<AdminStaff />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="banners" element={<AdminBanners />} />
                  <Route path="audit-logs" element={<AdminAuditLogs />} />
                </Route>

                {/* Redirect invalid routes */}
                <Route path="*" element={<Navigate to="/" replace />} />

              </Routes>
            </Router>
          </CartProvider>
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
