import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

import { useSettings } from '../../context/SettingsContext';
import {
  FiLayout, FiDollarSign, FiPackage, FiGrid, FiDatabase,
  FiShoppingBag, FiInbox, FiPercent, FiImage, FiStar,
  FiSettings, FiUsers, FiClipboard, FiMenu, FiX, FiHome
} from 'react-icons/fi';
import Logo from '../../components/Logo';

const AdminLayout = () => {
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { socket } = useSocket();
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (socket) {
      socket.on('new_order', (data) => {
        // Play notification sound
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Audio play blocked by browser', e));
        } catch(e) {}
        
        // Show visual notification
        setNotification(`🔔 NEW ORDER: ${data.orderNumber} by ${data.customerName} (₹${data.total})`);
        
        setTimeout(() => {
          setNotification(null);
        }, 5000);
      });
    }

    return () => {
      if (socket) {
        socket.off('new_order');
      }
    };
  }, [socket]);

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: <FiLayout /> },
    { name: 'Daily Prices', path: '/admin/daily-prices', icon: <FiDollarSign /> },
    { name: 'Products', path: '/admin/products', icon: <FiPackage /> },
    { name: 'Categories', path: '/admin/categories', icon: <FiGrid /> },
    { name: 'Inventory', path: '/admin/inventory', icon: <FiDatabase /> },
    { name: 'Orders List', path: '/admin/orders', icon: <FiShoppingBag /> },
    { name: 'Wholesale Leads', path: '/admin/wholesale', icon: <FiInbox /> },
    { name: 'Promo Coupons', path: '/admin/coupons', icon: <FiPercent /> },
    { name: 'Slideshow Banners', path: '/admin/banners', icon: <FiImage /> },
    { name: 'Reviews Approval', path: '/admin/reviews', icon: <FiStar /> },
    { name: 'Branding Settings', path: '/admin/settings', icon: <FiSettings /> },
    { name: 'Staff Management', path: '/admin/staff', icon: <FiUsers /> },
    { name: 'Audit Trail Logs', path: '/admin/audit-logs', icon: <FiClipboard /> }
  ];

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200 overflow-hidden relative">
      
      {/* Real-time Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-primary-700 text-white px-6 py-4 rounded-xl shadow-2xl font-bold animate-bounce cursor-pointer flex items-center justify-between gap-4" onClick={() => setNotification(null)}>
          <span>{notification}</span>
          <FiX className="h-5 w-5 opacity-70 hover:opacity-100" />
        </div>
      )}
      
      {/* 1. Mobile Sidebar Hamburger overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 2. Collapsible Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 transition-transform duration-300 md:translate-x-0 md:static md:flex md:flex-col md:h-screen shrink-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <Logo showText={true} className="h-8 w-8 text-white" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white md:hidden"
            aria-label="Close Sidebar"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Menu Items */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors duration-150 ${
                  isActive
                    ? 'bg-primary-700 text-white shadow'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer links */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
          >
            <FiHome className="text-base" /> Back to Store
          </Link>
        </div>
      </aside>

      {/* 3. Main Dashboard Content Frame */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Main Content Header top-bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 transition-colors">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle for mobile screen */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 md:hidden hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Open Sidebar"
            >
              <FiMenu className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-slate-800 dark:text-white hidden md:inline">
              Control Panel &bull; <span className="text-xs font-normal text-slate-400 uppercase tracking-wider">Khamrai Broiler Center</span>
            </span>
          </div>

          {/* Administrator tag */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800 dark:text-white">Admin</p>
              <p className="text-[10px] text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider">Full Access</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 border">
              A
            </div>
          </div>
        </header>

        {/* Content Outlet Frame */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
