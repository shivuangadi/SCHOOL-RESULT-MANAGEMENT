import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SchoolType, SchoolMedium, SchoolRegistrationPayload } from '../types';
import {
  LogIn,
  School,
  Lock,
  Eye,
  EyeOff,
  ShoppingCart,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  Hash,
  User,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface LoginCardProps {
  onOpenPaymentModal: (details?: {
    dise?: string;
    schoolName?: string;
    mobile?: string;
    hmName?: string;
  }) => void;
  onOpenForgotPassword: () => void;
  onOpenAdminLogin: () => void;
  onLaunchDemo?: () => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({
  onOpenPaymentModal,
  onOpenForgotPassword,
  onOpenAdminLogin,
  onLaunchDemo,
}) => {
  const { loginWithDise, registerSchool, loginError, clearError } = useAuth();
  const { lang } = useLanguage();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state - Strictly Username (DISE) and Password (NO confirm password)
  const [diseLogin, setDiseLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginValidationError, setLoginValidationError] = useState<string | null>(null);

  // Registration form state - Confirm password ONLY here
  const [regForm, setRegForm] = useState<SchoolRegistrationPayload>({
    diseCode: '',
    schoolName: '',
    schoolType: 'Government',
    schoolMedium: 'Kannada',
    headmasterName: '',
    taluk: 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ',
    cluster: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    clearError();
    setLoginValidationError(null);
    setValidationErrors({});
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoginValidationError(null);

    const cleanInput = diseLogin.trim();
    if (!cleanInput) {
      setLoginValidationError('Please enter your 11-digit DISE code or "admin".');
      return;
    }

    const isAdminInput =
      cleanInput.toLowerCase() === 'admin' ||
      cleanInput.toLowerCase() === 'administrator' ||
      cleanInput.toLowerCase() === 'shivu.angadi@gmail.com' ||
      cleanInput.includes('@');

    if (!isAdminInput && !/^\d{11}$/.test(cleanInput)) {
      setLoginValidationError('DISE code must contain exactly 11 digits (e.g. 29010100101).');
      return;
    }

    setIsLoggingIn(true);
    await loginWithDise(cleanInput, passwordLogin);
    setIsLoggingIn(false);
  };

  const validateRegistration = (): boolean => {
    const errors: Record<string, string> = {};

    if (!/^\d{11}$/.test(regForm.diseCode.trim())) {
      errors.diseCode = 'DISE Code must be exactly 11 digits (e.g. 29010100101).';
    }

    if (!regForm.schoolName.trim()) {
      errors.schoolName = 'School Name is required.';
    }

    if (!regForm.headmasterName.trim()) {
      errors.headmasterName = 'Headmaster name is required.';
    }

    if (!regForm.cluster?.trim()) {
      errors.cluster = 'Cluster name is required.';
    }

    if (!/^\d{10}$/.test(regForm.mobile.trim())) {
      errors.mobile = 'Enter a valid 10-digit mobile number.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }

    if (regForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (regForm.password !== regForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateRegistration()) {
      return;
    }

    setIsRegistering(true);
    try {
      const success = await registerSchool(regForm);
      setIsRegistering(false);

      if (success) {
        // Immediately trigger payment modal with newly registered school details
        onOpenPaymentModal({
          dise: regForm.diseCode,
          schoolName: regForm.schoolName,
          mobile: regForm.mobile,
          hmName: regForm.headmasterName,
        });
      }
    } catch (err) {
      setIsRegistering(false);
      console.error('Registration submission notice:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden w-full transition-all flex flex-col">
      {/* Sticky Tab Switcher - ALWAYS VISIBLE AT THE TOP ON PC & MOBILE */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 border-b border-slate-200/80 shadow-xs">
        <div className="flex bg-slate-100 p-1 rounded-xl sm:rounded-2xl gap-1.5 border border-slate-200">
          {/* Tab 1: Login */}
          <button
            type="button"
            onClick={() => handleTabChange('login')}
            className={`flex-1 py-2 sm:py-2.5 px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Login (ಲಾಗಿನ್)</span>
          </button>

          {/* Tab 2: New School Registration */}
          <button
            type="button"
            onClick={() => handleTabChange('register')}
            className={`flex-1 py-2 sm:py-2.5 px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <School className="w-4 h-4" />
            <span>New School Registration (ಹೊಸ ನೋಂದಣಿ)</span>
          </button>
        </div>
      </div>

      {/* Error Banners */}
      {(loginError || loginValidationError) && (
        <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="leading-snug font-medium">{loginError || loginValidationError}</span>
        </div>
      )}

      {/* ========================================================
          TAB 1: PROFESSIONAL LOGIN WINDOW
          ======================================================== */}
      {activeTab === 'login' && (
        <div className="p-4 sm:p-6 lg:p-6 space-y-4">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Split layout: Inputs on left, Security Badges on right */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Left Column: Form Fields */}
              <div className="md:col-span-7 space-y-3">
                {/* Username (11 Digit DISE Code) */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Username (11 Digit DISE Code) <span className="text-red-500">*</span></span>
                    <span className="text-[10px] text-blue-600 font-mono font-bold">11 Digits</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <School className="w-4 h-4 text-blue-600" />
                    </div>
                    <input
                      type="text"
                      maxLength={11}
                      required
                      value={diseLogin}
                      onChange={(e) => setDiseLogin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 11 digit DISE Code (e.g. 29010409301)"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none transition font-mono font-medium shadow-xs"
                    />
                  </div>
                </div>

                {/* Password - NO confirm password field in login */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Password <span className="text-red-500">*</span></span>
                    <span className="text-[10px] text-slate-400">School Password</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordLogin}
                      onChange={(e) => setPasswordLogin(e.target.value)}
                      placeholder="Enter your school password"
                      className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none transition font-medium shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Security Shield & Trust Badges */}
              <div className="md:col-span-5 bg-gradient-to-b from-blue-50/80 to-slate-50 border border-blue-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center text-left">
                {/* Blue Gradient Shield with Padlock */}
                <div className="w-12 h-14 sm:w-14 sm:h-16 relative mb-2 flex items-center justify-center">
                  <svg viewBox="0 0 60 70" className="w-full h-full drop-shadow-md">
                    <defs>
                      <linearGradient id="shieldBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#0284c7" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 30,5 C 45,5 55,14 55,25 C 55,48 30,65 30,65 C 30,65 5,48 5,25 C 5,14 15,5 30,5 Z"
                      fill="url(#shieldBlue)"
                    />
                    <rect x="23" y="32" width="14" height="12" rx="2" fill="#ffffff" />
                    <path
                      d="M 26,32 L 26,26 C 26,23.8 27.8,22 30,22 C 32.2,22 34,23.8 34,26 L 34,32"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      fill="none"
                    />
                    <circle cx="30" cy="38" r="1.5" fill="#0284c7" />
                  </svg>
                </div>

                {/* 5 Green Checkmarks List */}
                <ul className="space-y-1 text-xs text-slate-700 w-full pl-0.5">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100 shrink-0" />
                    <span className="font-semibold text-slate-800 text-[11px] sm:text-xs">Single Source of Truth</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100 shrink-0" />
                    <span className="font-semibold text-slate-800 text-[11px] sm:text-xs">PC & Mobile Synced</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100 shrink-0" />
                    <span className="font-semibold text-slate-800 text-[11px] sm:text-xs">CCE Classes 1 - 10</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100 shrink-0" />
                    <span className="font-semibold text-slate-800 text-[11px] sm:text-xs">Support via WhatsApp</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Login Action Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-blue-500/30 transition transform active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{isLoggingIn ? 'Logging in...' : 'Login to Dashboard (ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಲಾಗಿನ್)'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>

          {/* Forgot Password Row */}
          <div className="flex items-center justify-between pt-1 px-1">
            <button
              type="button"
              onClick={onOpenForgotPassword}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer"
            >
              Forgot Password? (ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರುವಿರಾ?)
            </button>
            <span className="text-[11px] text-slate-500">Helpline: 9731766727</span>
          </div>

          {/* OR Divider */}
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-xs text-slate-400 uppercase font-bold tracking-wider">
              OR
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Buy Pass Key / Pay ₹500 Button */}
          <button
            type="button"
            onClick={() => onOpenPaymentModal({ dise: diseLogin })}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md hover:shadow-emerald-600/30 transition transform active:scale-[0.99] cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
            <span>Buy Pass Key / Pay ₹500 (ಪಾಸ್ ಕೀ ಖರೀದಿ)</span>
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center ml-1">
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>

          {/* Payment Badges Strip */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600 border-t border-slate-100">
            <span
              style={{ color: '#eff2f6', fontSize: '16px' }}
              className="font-extrabold italic px-2.5 py-0.5 bg-slate-800 rounded border border-slate-700 shadow-xs"
            >
              UPI
            </span>
            <span className="font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded border border-blue-200 text-[10px]">
              G Pay
            </span>
            <span className="font-bold text-purple-700 px-2 py-0.5 bg-purple-50 rounded border border-purple-200 text-[10px]">
              PhonePe
            </span>
            <span className="font-bold text-sky-600 px-2 py-0.5 bg-sky-50 rounded border border-sky-200 text-[10px]">
              Paytm
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium pl-1">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>100% Secure Cloud Storage</span>
            </span>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: PROFESSIONAL NEW SCHOOL REGISTRATION
          ======================================================== */}
      {activeTab === 'register' && (
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="text-left pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <School className="w-5 h-5 text-blue-600" />
              <span>New Karnataka School Registration</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your official 11-digit DISE code and school details. After registration, proceed with ₹500 pass key payment to activate.
            </p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {/* Row 1: 11 Digit DISE Code & School Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>1. 11 Digit DISE/UDISE Code *</span>
                  <span className="text-[10px] text-blue-600 font-mono font-bold">11 Digits</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-4 h-4 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    maxLength={11}
                    required
                    value={regForm.diseCode}
                    onChange={(e) =>
                      setRegForm({ ...regForm, diseCode: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder="e.g. 29010409301"
                    className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono ${
                      validationErrors.diseCode ? 'border-red-400' : 'border-slate-300'
                    }`}
                  />
                </div>
                {validationErrors.diseCode && (
                  <p className="text-[10px] text-red-600 mt-0.5">{validationErrors.diseCode}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  2. School Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <School className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regForm.schoolName}
                    onChange={(e) => setRegForm({ ...regForm, schoolName: e.target.value })}
                    placeholder="e.g. Govt Higher Primary School..."
                    className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                      validationErrors.schoolName ? 'border-red-400' : 'border-slate-300'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: School Type & School Medium (Drop Down) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  3. School Type (ಶಾಲೆಯ ಪ್ರಕಾರ) *
                </label>
                <select
                  value={regForm.schoolType}
                  onChange={(e) =>
                    setRegForm({ ...regForm, schoolType: e.target.value as SchoolType })
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium cursor-pointer"
                >
                  <option value="Government">Government (ಸರ್ಕಾರಿ)</option>
                  <option value="Aided">Aided (ಅನುದಾನಿತ)</option>
                  <option value="Unaided">Unaided (ಅನುದಾನರಹಿತ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>4. Medium of School (ಮಾಧ್ಯಮ) *</span>
                  <span className="text-[10px] text-emerald-700 font-bold">Drop Down</span>
                </label>
                <select
                  value={regForm.schoolMedium}
                  onChange={(e) =>
                    setRegForm({ ...regForm, schoolMedium: e.target.value as SchoolMedium })
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-emerald-50/50 border-2 border-emerald-500 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold text-slate-900 cursor-pointer"
                >
                  <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                  <option value="English">English</option>
                  <option value="Marathi">Marathi (ಮರಾಠಿ)</option>
                  <option value="Urdu">Urdu (ಉರ್ದು)</option>
                </select>
              </div>
            </div>

            {/* Row 3: Taluk & Cluster Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  5. Taluk / Block (ತಾಲೂಕು) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4 text-amber-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regForm.taluk || ''}
                    onChange={(e) => setRegForm({ ...regForm, taluk: e.target.value })}
                    placeholder="e.g. ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ / ರಾಯಭಾಗ"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  6. Cluster Name (ಕ್ಲಸ್ಟರ್ ಹೆಸರು) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regForm.cluster || ''}
                    onChange={(e) => setRegForm({ ...regForm, cluster: e.target.value })}
                    placeholder="e.g. ಸದಲಗಾ / ಶಿರೂರು / ನಿಂಗ್ಯಾನಟ್ಟಿ"
                    className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium ${
                      validationErrors.cluster ? 'border-red-400' : 'border-slate-300'
                    }`}
                  />
                </div>
                {validationErrors.cluster && (
                  <p className="text-[10px] text-red-600 mt-0.5">{validationErrors.cluster}</p>
                )}
              </div>
            </div>

            {/* Row 4: Headmaster Name & HM Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  7. Headmaster / In-Charge Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regForm.headmasterName}
                    onChange={(e) => setRegForm({ ...regForm, headmasterName: e.target.value })}
                    placeholder="Headmaster / Teacher Name"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  8. HM WhatsApp Mobile Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4 text-emerald-600" />
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    required
                    value={regForm.mobile}
                    onChange={(e) =>
                      setRegForm({ ...regForm, mobile: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder="10 digit mobile (for WhatsApp updates)"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Row 5: School Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                9. School Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="school@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 5: Password & Confirm Password (Confirmation ONLY in registration) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  9. Create Password (ಪಾಸ್‌ವರ್ಡ್) *
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>10. Confirm Password *</span>
                  <span className="text-[10px] text-amber-600 font-semibold">Verification</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    required
                    value={regForm.confirmPassword}
                    onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-[10px] text-red-600 mt-0.5">{validationErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Registration Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isRegistering}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-600/30 transition transform active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <School className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>
                  {isRegistering
                    ? 'Registering School...'
                    : 'Submit Registration & Proceed to ₹500 Payment'}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
