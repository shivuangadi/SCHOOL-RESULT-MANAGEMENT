import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, MessageSquare, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { lang } = useLanguage();

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 text-xs mt-auto h-[2.5cm] min-h-[2.5cm] max-h-[2.5cm] flex items-center shrink-0 select-none overflow-hidden print:hidden">
      <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Left Side: Brand and Trust */}
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-7 h-7 rounded-lg bg-blue-900/60 border border-blue-600/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="truncate">
            <span className="font-extrabold text-white text-xs sm:text-sm tracking-tight block truncate">
              {lang === 'kn' ? 'ಶಾಲಾ ಫಲಿತಾಂಶ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ' : 'SCHOOL RESULT MANAGEMENT SYSTEM'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Karnataka State Board CCE Portal • 100% Single Source of Truth
            </span>
          </div>
        </div>

        {/* Center: Dedication */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-300 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
          <span className="font-black text-amber-300 uppercase tracking-wider">Conceived By:</span>
          <span className="font-bold text-white">Shri. S R Angadi</span>
          <span className="text-slate-400">• Science Teacher, Govt KHPS Ningyanatti</span>
        </div>

        {/* Right Side: WhatsApp Helpline & Copyright */}
        <div className="flex items-center gap-3 shrink-0 text-[11px]">
          <a
            href="https://wa.me/919731766727?text=Namaskara%20Sir%2C%20regarding%20School%20Result%20Management%20System"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp: 9731766727</span>
          </a>
          <span className="text-slate-500 hidden sm:inline">
            © {new Date().getFullYear()} • Govt KHPS Ningyanatti
          </span>
        </div>
      </div>
    </footer>
  );
};
