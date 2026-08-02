import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';

const FloatingWhatsapp = () => {
  const { settings } = useSettings();

  const isEnabled = settings?.whatsappEnabled !== false;
  const whatsappNum = settings?.whatsappNumber || '';
  const defaultMsg = settings?.whatsappDefaultMessage || 'Hello! I am visiting your website and have an enquiry.';

  if (!isEnabled || !whatsappNum) return null;

  return (
    <a
      href={`https://wa.me/91${whatsappNum}?text=${encodeURIComponent(defaultMsg)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center border border-emerald-400 group"
      aria-label="Chat on WhatsApp"
    >
      <FaWhatsapp className="h-7 w-7 animate-pulse" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-out whitespace-nowrap text-sm font-bold">
        WhatsApp Us
      </span>
    </a>
  );
};

export default FloatingWhatsapp;
