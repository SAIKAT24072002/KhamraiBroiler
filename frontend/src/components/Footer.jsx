import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { FiPhone, FiMail, FiMapPin, FiClock } from 'react-icons/fi';
import { FaFacebook, FaInstagram, FaYoutube, FaWhatsapp } from 'react-icons/fa';

const Footer = () => {
  const { settings } = useSettings();

  const name = settings?.businessName || 'KHAMRAI BROILER CENTER';
  const tagline = settings?.tagline || 'Fresh Quality. Fair Price. Trusted Service.';
  const address = settings?.storeAddress || '';
  const phone = settings?.phone || '';
  const email = settings?.email || '';
  const hours = settings?.openingHours || '';
  const closingDay = settings?.closingDay || 'None';
  const whatsappNum = settings?.whatsappNumber || '';
  const facebook = settings?.socialLinks?.facebook || '';
  const instagram = settings?.socialLinks?.instagram || '';
  const youtube = settings?.socialLinks?.youtube || '';

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Branding */}
        <div className="space-y-4">
          <h3 className="text-white text-lg font-bold uppercase tracking-wider">{name}</h3>
          <p className="text-sm text-slate-400 font-medium italic">"{tagline}"</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            {settings?.description || 'Your trusted destination for farm fresh premium poultry items and eggs at the best market prices.'}
          </p>
        </div>

        {/* Store Info */}
        <div className="space-y-3">
          <h4 className="text-white text-sm font-bold uppercase tracking-wider">Store Location</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-start gap-2">
              <FiMapPin className="h-4 w-4 text-primary-500 shrink-0 mt-0.5" />
              <span>{address}</span>
            </li>
            <li className="flex items-center gap-2">
              <FiPhone className="h-4 w-4 text-primary-500 shrink-0" />
              <span>{phone}</span>
            </li>
            <li className="flex items-center gap-2">
              <FiMail className="h-4 w-4 text-primary-500 shrink-0" />
              <span className="truncate">{email}</span>
            </li>
          </ul>
        </div>

        {/* Operating Hours */}
        <div className="space-y-3">
          <h4 className="text-white text-sm font-bold uppercase tracking-wider">Opening Hours</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-start gap-2">
              <FiClock className="h-4 w-4 text-primary-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">{hours}</p>
                <p className="text-[10px] text-slate-500">Pickup orders processed during business hours</p>
              </div>
            </li>
            <li className="text-slate-400">
              <span className="font-semibold text-slate-200">Closed Day:</span> {closingDay}
            </li>
          </ul>
        </div>

        {/* Connect & Pickup details */}
        <div className="space-y-4">
          <h4 className="text-white text-sm font-bold uppercase tracking-wider">Store Pick-up</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            We operate on a **Store Pickup Only** business model. Orders placed on the website must be picked up physically from our outlet.
          </p>
          <div className="flex items-center gap-3">
            {whatsappNum && (
              <a
                href={`https://wa.me/91${whatsappNum}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-slate-800 hover:bg-emerald-600 hover:text-white transition-colors"
                aria-label="Contact on WhatsApp"
              >
                <FaWhatsapp className="h-5 w-5" />
              </a>
            )}
            {facebook && (
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-slate-800 hover:bg-blue-600 hover:text-white transition-colors"
                aria-label="Facebook Profile"
              >
                <FaFacebook className="h-5 w-5" />
              </a>
            )}
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-slate-800 hover:bg-pink-600 hover:text-white transition-colors"
                aria-label="Instagram Profile"
              >
                <FaInstagram className="h-5 w-5" />
              </a>
            )}
            {youtube && (
              <a
                href={youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-slate-800 hover:bg-red-600 hover:text-white transition-colors"
                aria-label="YouTube Channel"
              >
                <FaYoutube className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer Bottom copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} {name}. All Rights Reserved.</p>
        <p className="mt-1 text-[10px] text-slate-600">Fresh Stock. Local Verification. Built for Premium Service.</p>
      </div>
    </footer>
  );
};

export default Footer;
