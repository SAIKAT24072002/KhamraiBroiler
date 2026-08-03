import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { FiShoppingCart, FiSun, FiMoon, FiMenu, FiX, FiUser, FiLogOut, FiLayout } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { name: 'Shop', path: '/shop' },
    { name: 'Wholesale', path: '/wholesale' },
    { name: 'Offers', path: '/offers' },
    { name: 'Contact', path: '/contact' }
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-semibold transition-colors duration-150 ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 pb-1'
                      : 'text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          {/* Header Action Tools */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>

            {/* Shopping Cart */}
            <Link
              to="/cart"
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
            >
              <FiShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Login / Profile Dropdown */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold">
                    <FiUser className="h-5 w-5" />
                  </div>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.mobile}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    {user.role === 'admin' ? (
                      <Link to="/admin" className="flex items-center px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">
                        <FiLayout className="mr-2" /> Admin Dashboard
                      </Link>
                    ) : (
                      <Link to="/profile" className="flex items-center px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">
                        <FiUser className="mr-2" /> My Profile
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); navigate('/'); }}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <FiLogOut className="mr-2" /> Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full font-semibold transition-colors shadow-sm"
              >
                <FiUser className="h-4 w-4" />
                <span>Sign Up / Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center md:hidden gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>

            <Link
              to="/cart"
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative"
            >
              <FiShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {link.name}
            </Link>
          ))}
          <div className="border-t border-slate-200 dark:border-slate-700 my-2 pt-2">
            {user ? (
              <>
                <div className="px-3 py-2 mb-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.mobile}</p>
                </div>
                {user.role === 'admin' ? (
                  <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center px-3 py-2 text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                    <FiLayout className="mr-3" /> Admin Dashboard
                  </Link>
                ) : (
                  <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center px-3 py-2 text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                    <FiUser className="mr-3" /> My Profile
                  </Link>
                )}
                <button
                  onClick={() => { logout(); setIsOpen(false); navigate('/'); }}
                  className="w-full flex items-center px-3 py-2 text-base font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                >
                  <FiLogOut className="mr-3" /> Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-3 py-2 text-base font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md"
              >
                <FiUser className="mr-3" /> Sign Up / Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
