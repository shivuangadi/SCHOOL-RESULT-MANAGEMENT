import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AngadiPhoto } from './AngadiPhoto';
import {
  Languages,
  LogOut,
  UserCheck,
  Play,
  Sparkles,
  Home,
  Users,
  Award,
  Printer,
  BookOpen,
  School,
  Phone,
  KeyRound,
  Menu,
  X,
  Layers,
  FileText,
} from 'lucide-react';

export type NavCategory =
  | 'home'
  | 'studentDatabase'
  | 'marksEntry'
  | 'reportPrinting'
  | 'subjectStructure'
  | 'schoolProfile'
  | 'coverPageDesigner';

interface HeaderProps {
  onOpenAdminModal?: () => void;
  onLaunchDemo?: () => void;
  isDemoActive?: boolean;
  onExitDemo?: () => void;
  onGoHome?: () => void;
  onOpenRenewalModal?: () => void;
  activeNavTab?: NavCategory;
  onSelectNavTab?: (tab: NavCategory) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAdminModal,
  onLaunchDemo,
  isDemoActive = false,
  onExitDemo,
  onGoHome,
  onOpenRenewalModal,
  activeNavTab = 'home',
  onSelectNavTab,
}) => {
  const { currentUser, schoolRecord, logout } = useAuth();
  const { lang, setLang } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isUserLoggedIn = Boolean(currentUser);
  const displaySchool =
    schoolRecord ||
    (isDemoActive
      ? {
          schoolName: 'Govt Model Higher Primary School, Ningyanatti',
          diseCode: '29010100101',
          headmasterName: 'Shri S R Angadi',
          taluk: 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ',
          mobile: '9731766727',
          schoolRange: '1-10',
          subscriptionExpiry: new Date(Date.now() + 320 * 24 * 60 * 60 * 1000).toISOString(),
        }
      : null);

  // Format Pass Key Validity Date (DD/MM/YYYY)
  const formatExpiryDate = (isoStr?: string): string => {
    if (!isoStr) return '31/03/2027';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '31/03/2027';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '31/03/2027';
    }
  };

  const registeredMobile = displaySchool?.mobile || '9731766727';
  const validityDate = formatExpiryDate(displaySchool?.subscriptionExpiry);

  const handleNavClick = (tab: NavCategory) => {
    setIsMobileMenuOpen(false);
    if (tab === 'home') {
      onGoHome?.();
    }
    onSelectNavTab?.(tab);
  };

  const handleLogoutClick = () => {
    setIsMobileMenuOpen(false);
    if (isDemoActive && onExitDemo) {
      onExitDemo();
    } else {
      logout();
    }
  };

  const isKn = lang === 'kn';

  return (
    <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white shadow-xl border-b-4 border-amber-400 relative z-30">
      {/* Demo Notification Banner if Active */}
      {isDemoActive && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950 animate-pulse" />
            <span>
              🎯 DEMO / FREE VERSION ACTIVE: Exploring Govt Model Higher Primary School, Ningyanatti with interactive demo data!
            </span>
          </div>
          <button
            onClick={onExitDemo}
            className="px-2 py-0.5 rounded-md bg-slate-950 hover:bg-slate-800 text-amber-300 text-xs font-bold transition cursor-pointer"
          >
            Exit Demo Mode ✕
          </button>
        </div>
      )}

      {/* Main Top Header Bar */}
      <div className="max-w-[1740px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* ROW 1: Identity & Key Metrics */}
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* ========================================================
              LEFT SIDE: CREATOR LOGO + APP TITLE + REGISTERED SCHOOL NAME
              ======================================================== */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Existing Creator Image / Creator Logo */}
            <div className="shrink-0">
              <AngadiPhoto size="md" showBadge={false} />
            </div>

            {/* Title & Dynamic School Name */}
            <div className="min-w-0 leading-tight">
              <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white font-serif drop-shadow-sm truncate">
                {isKn ? 'ಶಾಲಾ ಫಲಿತಾಂಶ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ' : 'School Result Management System'}
              </h1>
              <div className="text-[10px] sm:text-[11px] font-extrabold text-blue-200 tracking-wider uppercase truncate">
                {isKn ? 'SCHOOL RESULT MANAGEMENT SYSTEM' : 'DESIGNED & DEVELOPED BY SHRI. S R ANGADI'}
              </div>

              {/* Dynamic Registered School Name */}
              {(isUserLoggedIn || isDemoActive) && displaySchool?.schoolName && (
                <div className="mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-black text-amber-300 truncate">
                  <School className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{displaySchool.schoolName}</span>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================
              CENTER: REGISTERED MOBILE NUMBER
              ======================================================== */}
          {(isUserLoggedIn || isDemoActive) && (
            <div className="hidden lg:flex flex-col items-center justify-center text-center px-4 py-1 rounded-xl bg-blue-950/70 border border-blue-700/60 shadow-inner">
              <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider flex items-center gap-1">
                <Phone className="w-3 h-3 text-amber-400" />
                <span>{isKn ? 'ನೋಂದಾಯಿತ ಮೊಬೈಲ್' : 'Registered Mobile'}</span>
              </span>
              <span className="font-mono font-black text-amber-300 text-xs sm:text-sm tracking-wider">
                {registeredMobile}
              </span>
            </div>
          )}

          {/* ========================================================
              RIGHT SIDE: PASS KEY VALIDITY + LANGUAGE SWITCH + MOBILE MENU
              ======================================================== */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Pass Key Validity Date */}
            {(isUserLoggedIn || isDemoActive) && (
              <button
                onClick={onOpenRenewalModal}
                className="hidden sm:flex flex-col items-end text-right px-3 py-1 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-600/60 shadow-inner transition cursor-pointer"
                title="Click to check or renew pass key validity"
              >
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-emerald-400" />
                  <span>{isKn ? 'ಪಾಸ್ ಕೀ ಮಾನ್ಯತೆ' : 'Pass Key Validity'}</span>
                </span>
                <span className="font-mono font-black text-white text-xs sm:text-sm">
                  {validityDate}
                </span>
              </button>
            )}

            {/* Language Switch Button (Actually Works & Toggles App) */}
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-800/90 hover:bg-blue-700 text-white text-xs font-bold transition border border-blue-600/70 shadow-xs cursor-pointer"
              title="Toggle Language (ಭಾಷೆ ಬದಲಾಯಿಸಿ)"
            >
              <Languages className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>{lang === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
            </button>

            {/* Demo Button if logged out */}
            {!isUserLoggedIn && !isDemoActive && onLaunchDemo && (
              <button
                onClick={onLaunchDemo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-md transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span className="hidden sm:inline">Demo Version</span>
              </button>
            )}

            {/* Admin Login if logged out */}
            {!isUserLoggedIn && !isDemoActive && onOpenAdminModal && (
              <button
                onClick={onOpenAdminModal}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-blue-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Admin Login</span>
              </button>
            )}

            {/* Mobile Hamburger Button (☰) */}
            {(isUserLoggedIn || isDemoActive) && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-blue-900 text-amber-300 hover:bg-blue-800 border border-blue-600 transition cursor-pointer"
                title="Navigation Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* ========================================================
            ROW 2: DESKTOP NAVIGATION BUTTONS (NEATLY ARRANGED IN BLUE HEADER)
            Order:
            1. Home
            2. Student Database
            3. Marks Entry
            4. Report Printing
            5. Subject Structure
            6. School Profile
            7. Logout
            ======================================================== */}
        {(isUserLoggedIn || isDemoActive) && (
          <div className="hidden md:flex items-center justify-between border-t border-blue-800/80 mt-2.5 pt-2 gap-2">
            <nav className="flex items-center gap-1.5 lg:gap-2 flex-wrap">
              {/* [ Home ] */}
              <button
                type="button"
                onClick={() => handleNavClick('home')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                  activeNavTab === 'home'
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-blue-900/70 text-blue-100 hover:bg-blue-800 hover:text-white border border-blue-700/60'
                }`}
                title="Open Home Dashboard"
              >
                <Home className="w-3.5 h-3.5 shrink-0" />
                <span>Home</span>
              </button>

              {/* [ Student Database ] */}
              <button
                type="button"
                onClick={() => handleNavClick('studentDatabase')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                  activeNavTab === 'studentDatabase'
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-blue-900/70 text-blue-100 hover:bg-blue-800 hover:text-white border border-blue-700/60'
                }`}
                title="Open Student Database"
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Student Database</span>
              </button>

              {/* [ Marks Entry ] - ONLY ONE MARKS ENTRY BUTTON */}
              <button
                type="button"
                onClick={() => handleNavClick('marksEntry')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                  activeNavTab === 'marksEntry'
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-blue-900/70 text-blue-100 hover:bg-blue-800 hover:text-white border border-blue-700/60'
                }`}
                title="Open Marks Entry"
              >
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span>Marks Entry</span>
              </button>

              {/* [ Report Printing ] - ONLY ONE REPORT PRINTING BUTTON */}
              <button
                type="button"
                onClick={() => handleNavClick('reportPrinting')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                  activeNavTab === 'reportPrinting'
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-blue-900/70 text-blue-100 hover:bg-blue-800 hover:text-white border border-blue-700/60'
                }`}
                title="Open Report Printing"
              >
                <Printer className="w-3.5 h-3.5 shrink-0" />
                <span>Report Printing</span>
              </button>

              {/* [ Subject Structure ] - ವಿಷಯ ವಿನ್ಯಾಸ */}
              <button
                type="button"
                onClick={() => handleNavClick('subjectStructure')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                  activeNavTab === 'subjectStructure'
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-blue-900/70 text-blue-100 hover:bg-blue-800 hover:text-white border border-blue-700/60'
                }`}
                title="View Subject Structure (ವಿಷಯ ವಿನ್ಯಾಸ)"
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>Subject Structure (ವಿಷಯ ವಿನ್ಯಾಸ)</span>
              </button>

              {/* [ School Profile ] */}
              <button
                type="button"
                onClick={() => handleNavClick('schoolProfile')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                  activeNavTab === 'schoolProfile'
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-blue-900/70 text-blue-100 hover:bg-blue-800 hover:text-white border border-blue-700/60'
                }`}
                title="Open School Profile"
              >
                <School className="w-3.5 h-3.5 shrink-0" />
                <span>School Profile</span>
              </button>

              {/* [ Cover Page Designer / ಮುಖಪುಟ ವಿನ್ಯಾಸಕ ] */}
              <button
                type="button"
                onClick={() => handleNavClick('coverPageDesigner')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                  activeNavTab === 'coverPageDesigner'
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 hover:bg-amber-500/30 hover:text-white border border-amber-400/50'
                }`}
                title="Open Cover Page Designer (ಮುಖಪುಟ ವಿನ್ಯಾಸಕ)"
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                <span>ಮುಖಪುಟ ವಿನ್ಯಾಸಕ (Cover Page)</span>
              </button>
            </nav>

            {/* [ Logout ] */}
            <button
              type="button"
              onClick={handleLogoutClick}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition cursor-pointer shrink-0"
              title="Logout from school portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}

        {/* ========================================================
            MOBILE HAMBURGER MENU DROPDOWN
            ======================================================== */}
        {(isUserLoggedIn || isDemoActive) && isMobileMenuOpen && (
          <div className="md:hidden mt-2.5 pt-2.5 border-t border-blue-800 space-y-1.5 bg-blue-950/95 p-3 rounded-2xl border border-blue-700/80 shadow-2xl animate-in slide-in-from-top-2 duration-150">
            {/* Mobile School & Mobile Info Card */}
            <div className="p-2.5 bg-blue-900/80 rounded-xl mb-2 border border-blue-700/60 flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-blue-200">📞 ಮೊಬೈಲ್:</span>
                <span className="font-bold text-amber-300">{registeredMobile}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-blue-200">🔑 ಪಾಸ್ ಕೀ ಮಾನ್ಯತೆ:</span>
                <span className="font-bold text-white">{validityDate}</span>
              </div>
            </div>

            {/* 1. Home */}
            <button
              type="button"
              onClick={() => handleNavClick('home')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2.5 transition cursor-pointer ${
                activeNavTab === 'home'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'text-white hover:bg-blue-800'
              }`}
            >
              <Home className="w-4 h-4 text-amber-400" />
              <span>Home</span>
            </button>

            {/* 2. Student Database */}
            <button
              type="button"
              onClick={() => handleNavClick('studentDatabase')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2.5 transition cursor-pointer ${
                activeNavTab === 'studentDatabase'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'text-white hover:bg-blue-800'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Student Database</span>
            </button>

            {/* 3. Marks Entry */}
            <button
              type="button"
              onClick={() => handleNavClick('marksEntry')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2.5 transition cursor-pointer ${
                activeNavTab === 'marksEntry'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'text-white hover:bg-blue-800'
              }`}
            >
              <Award className="w-4 h-4 text-indigo-400" />
              <span>Marks Entry</span>
            </button>

            {/* 4. Report Printing */}
            <button
              type="button"
              onClick={() => handleNavClick('reportPrinting')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2.5 transition cursor-pointer ${
                activeNavTab === 'reportPrinting'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'text-white hover:bg-blue-800'
              }`}
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Report Printing</span>
            </button>

            {/* 5. Subject Structure */}
            <button
              type="button"
              onClick={() => handleNavClick('subjectStructure')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2.5 transition cursor-pointer ${
                activeNavTab === 'subjectStructure'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'text-white hover:bg-blue-800'
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Subject Structure (ವಿಷಯ ವಿನ್ಯಾಸ)</span>
            </button>

            {/* 6. School Profile */}
            <button
              type="button"
              onClick={() => handleNavClick('schoolProfile')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2.5 transition cursor-pointer ${
                activeNavTab === 'schoolProfile'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'text-white hover:bg-blue-800'
              }`}
            >
              <School className="w-4 h-4 text-teal-400" />
              <span>School Profile</span>
            </button>

            {/* 7. Cover Page Designer */}
            <button
              type="button"
              onClick={() => handleNavClick('coverPageDesigner')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2.5 transition cursor-pointer ${
                activeNavTab === 'coverPageDesigner'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'text-amber-300 hover:bg-blue-800'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>ಮುಖಪುಟ ವಿನ್ಯಾಸಕ (Cover Page Designer)</span>
            </button>

            {/* 8. Logout */}
            <div className="pt-1 border-t border-blue-800/80 mt-1">
              <button
                type="button"
                onClick={handleLogoutClick}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black text-rose-300 hover:bg-red-950/60 flex items-center gap-2.5 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
