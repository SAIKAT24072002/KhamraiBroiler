import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings, LogoSvg } from '../context/SettingsContext';

const Logo = ({ className = "h-9 w-9", showText = true }) => {
  const { settings } = useSettings();
  const name = settings?.businessName || 'KHAMRAI BROILER CENTER';
  const logoUrl = settings?.logoUrl || '';

  return (
    <Link to="/" className="flex items-center gap-2 font-bold select-none">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name}
          className={`${className} object-contain rounded-md`}
          onError={(e) => {
            e.target.onerror = null;
            // Fallback back to SVG if image fails to load
            e.target.style.display = 'none';
            const svgFallback = e.target.nextSibling;
            if (svgFallback) svgFallback.style.display = 'block';
          }}
        />
      ) : null}
      
      {/* SVG logo fallback */}
      <span style={{ display: logoUrl ? 'none' : 'block' }}>
        <LogoSvg className={className} />
      </span>

      {showText && (
        <span className="text-lg tracking-tight font-extrabold text-slate-800 dark:text-white font-sans uppercase">
          {name.split(' ')[0]} <span className="text-primary-600 dark:text-primary-400">{name.split(' ').slice(1).join(' ')}</span>
        </span>
      )}
    </Link>
  );
};

export default Logo;
export { LogoSvg };
