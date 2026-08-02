import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { FiPhone, FiMail, FiMapPin, FiClock } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const Contact = () => {
  const { settings } = useSettings();

  const name = settings?.businessName || 'KHAMRAI BROILER CENTER';
  const tagline = settings?.tagline || 'Fresh Quality. Fair Price. Trusted Service.';
  const address = settings?.storeAddress || 'Station Road, Khamrai Market, Midnapore, West Bengal, India';
  const phone = settings?.phone || '+91 9876543210';
  const email = settings?.email || 'info@khamraibroiler.com';
  const hours = settings?.openingHours || '07:00 AM - 09:00 PM';
  const closingDay = settings?.closingDay || 'None';
  const whatsappNum = settings?.whatsappNumber || '9876543210';

  const [subject, setSubject] = useState('');
  const [msg, setMsg] = useState('');

  const handleWhatsappSend = (e) => {
    e.preventDefault();
    if (!subject || !msg) return;
    const formattedText = `Hello KHAMRAI BROILER CENTER,%0A%0A*Subject:* ${subject}%0A*Message:* ${msg}`;
    window.open(`https://wa.me/91${whatsappNum}?text=${formattedText}`, '_blank');
    setSubject('');
    setMsg('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 dark:bg-slate-950 transition-colors duration-200">
      
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
          Contact Outlet
        </h1>
        <p className="text-xs text-slate-400">Reach out to us directly or send a message on WhatsApp for pricing negotiations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        
        {/* Info panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6 md:col-span-1 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 dark:text-white text-base uppercase border-b pb-3">Get In Touch</h3>
            
            <div className="text-xs space-y-4 text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2.5">
                <FiMapPin className="text-primary-600 h-5 w-5 shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FiPhone className="text-primary-600 h-5 w-5 shrink-0" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FiMail className="text-primary-600 h-5 w-5 shrink-0" />
                <span>{email}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <FiClock className="text-primary-600 h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{hours}</p>
                  <p className="text-[10px] text-slate-400">Weekly Close: {closingDay}</p>
                </div>
              </div>
            </div>
          </div>

          {whatsappNum && (
            <a
              href={`https://wa.me/91${whatsappNum}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow"
            >
              <FaWhatsapp className="h-4.5 w-4.5" /> Chat on WhatsApp
            </a>
          )}
        </div>

        {/* Contact Form redirected to WhatsApp */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm md:col-span-2 space-y-6">
          <h3 className="font-bold text-slate-800 dark:text-white text-base uppercase border-b pb-3">Send Us A Message</h3>

          <form onSubmit={handleWhatsappSend} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="E.g. Price enquiry, Wholesale bulk discount"
                className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Message Details</label>
              <textarea
                required
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Describe your inquiry in detail..."
                rows="5"
                className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider shadow"
            >
              Send via WhatsApp
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Contact;
