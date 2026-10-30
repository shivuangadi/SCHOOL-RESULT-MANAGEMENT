/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Header, NavCategory } from './components/Header';
import { Footer } from './components/Footer';
import { LoginCard } from './components/LoginCard';
import { LeftFeaturePills } from './components/LeftFeaturePills';
import { LoginBackgroundVisual } from './components/LoginBackgroundVisual';
import { PaymentModal } from './components/PaymentModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { PendingApprovalView } from './components/PendingApprovalView';
import { SuspendedOrExpiredView } from './components/SuspendedOrExpiredView';
import { SchoolDashboard } from './components/SchoolDashboard';
import { AdminPortal } from './components/AdminPortal';
import { DemoDashboard } from './components/DemoDashboard';
import { Loader2, School, PieChart, Sparkles } from 'lucide-react';
import { AngadiPhoto } from './components/AngadiPhoto';
import { SchoolRecord } from './types';
import { PassKeyExpiryReminderModal } from './components/PassKeyExpiryReminderModal';

const DEMO_SCHOOL_DATA: SchoolRecord = {
  schoolId: 'DEMO_29010100101',
  diseCode: 'DEMO_29010100101',
  schoolName: 'Govt Model Higher Primary School, Ningyanatti',
  schoolType: 'Government',
  schoolMedium: 'Kannada',
  schoolRange: '1-10',
  headmasterName: 'Shri S R Angadi',
  taluk: 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ',
  cluster: 'ನಿಂಗ್ಯಾನಟ್ಟಿ',
  district: 'Belagavi',
  mobile: '9731766727',
  email: 'ghpsningyanatti@gmail.com',
  status: 'APPROVED',
  paymentStatus: 'PAID',
  subscriptionStatus: 'ACTIVE',
  createdAt: new Date().toISOString(),
};

const MainAppContent: React.FC = () => {
  const { currentUser, schoolRecord, isAdmin, isLoading, isImpersonating, exitImpersonation } = useAuth();
  const { lang } = useLanguage();

  // Demo mode state
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoTab, setDemoTab] = useState<'schoolDashboard' | 'demoReports'>('schoolDashboard');
  const [activeNavTab, setActiveNavTab] = useState<NavCategory>('home');

  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalDetails, setPaymentModalDetails] = useState<{
    dise?: string;
    schoolName?: string;
    mobile?: string;
    hmName?: string;
  }>({});
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isExpiryReminderOpen, setIsExpiryReminderOpen] = useState(false);
  const [hasAutoPromptedExpiry, setHasAutoPromptedExpiry] = useState(false);

  // Admin view toggle (if admin wants to preview school dashboard)
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'school'>('admin');

  // Days left calculation for Pass Key validity
  const calculateDaysLeft = (): number => {
    if (isDemoMode) return 320;
    if (!schoolRecord?.subscriptionExpiry) return 365;
    try {
      const expiry = new Date(schoolRecord.subscriptionExpiry).getTime();
      const now = new Date().getTime();
      const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    } catch {
      return 365;
    }
  };

  const daysLeft = calculateDaysLeft();

  // Automatic renewal reminder popup window when expiry is within 30 days (before 1 month)
  useEffect(() => {
    if ((currentUser || isDemoMode) && daysLeft <= 30 && !hasAutoPromptedExpiry) {
      setIsExpiryReminderOpen(true);
      setHasAutoPromptedExpiry(true);
    }
  }, [currentUser, isDemoMode, daysLeft, hasAutoPromptedExpiry]);

  const handleOpenPaymentModal = (details?: {
    dise?: string;
    schoolName?: string;
    mobile?: string;
    hmName?: string;
  }) => {
    if (details) {
      setPaymentModalDetails(details);
    }
    setIsPaymentModalOpen(true);
  };

  const handleGoHome = () => {
    setActiveNavTab('home');
    if (isDemoMode) {
      setDemoTab('schoolDashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-200 flex flex-col items-center max-w-sm text-center">
          <div className="mb-4">
            <AngadiPhoto size="lg" showBadge={false} />
          </div>
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <h2 className="text-base font-bold text-slate-900 font-serif">
            {lang === 'kn' ? 'ಶಾಲಾ ಫಲಿತಾಂಶ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ' : 'School Result Management System'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Loading secure Karnataka state education portal...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated Visitor State
  const isLandingView = !isDemoMode && !isAdmin && !currentUser;

  return (
    <div className="w-full bg-[#1e40af] text-slate-800 selection:bg-blue-600 selection:text-white relative flex flex-col min-h-screen">
      {/* Universal Header with School Details, Home Button & Logout */}
      <Header
        onOpenAdminModal={() => setIsAdminLoginOpen(true)}
        onLaunchDemo={() => {
          setIsDemoMode(true);
          setDemoTab('schoolDashboard');
          setActiveNavTab('home');
        }}
        isDemoActive={isDemoMode}
        onExitDemo={() => setIsDemoMode(false)}
        onGoHome={handleGoHome}
        onOpenRenewalModal={() => setIsExpiryReminderOpen(true)}
        activeNavTab={activeNavTab}
        onSelectNavTab={setActiveNavTab}
      />

      {/* Admin Impersonation Active Banner */}
      {isImpersonating && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 px-4 py-2.5 shadow-md border-b-2 border-amber-600 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-bold">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-950 text-amber-300 rounded-md text-[11px] font-black uppercase tracking-wider">
                👑 Admin Impersonation Active
              </span>
              <span>
                ವೀಕ್ಷಿಸುತ್ತಿರುವ ಶಾಲೆ / Viewing as: <strong className="underline text-slate-900">{schoolRecord?.schoolName}</strong> (DISE: <span className="font-mono font-black">{schoolRecord?.diseCode}</span>)
              </span>
            </div>
            <button
              onClick={exitImpersonation}
              className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <span>🔙 ನಿರ್ವಾಹಕರ ಪ್ಯಾನೆಲ್‌ಗೆ ಹಿಂತಿರುಗಿ / Return to Admin Portal</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 relative flex flex-col justify-start overflow-y-auto">
        {/* CASE 0: DEMO / FREE VERSION ACTIVE - SCHOOL HOME PAGE & DASHBOARD AVAILABLE */}
        {isDemoMode ? (
          <div className="overflow-y-auto max-h-[calc(100vh-80px)] py-4">
            {/* Demo sub-bar for toggling School Home Page / Dashboard vs Interactive Demo Reports */}
            <div className="max-w-7xl mx-auto px-4 mb-3">
              <div className="bg-slate-900 text-white rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-lg border border-slate-700">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">
                    Demo Mode Explorer:
                  </span>
                  <span className="text-xs text-slate-300 hidden sm:inline">
                    Govt Model School Ningyanatti (DISE: 29010100101)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDemoTab('schoolDashboard')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      demoTab === 'schoolDashboard'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <School className="w-3.5 h-3.5" />
                    <span>School Dashboard (ಮುಖಪುಟ)</span>
                  </button>

                  <button
                    onClick={() => setDemoTab('demoReports')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      demoTab === 'demoReports'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <PieChart className="w-3.5 h-3.5" />
                    <span>Demo Reports & Analysis</span>
                  </button>
                </div>
              </div>
            </div>

            {demoTab === 'schoolDashboard' ? (
              <SchoolDashboard
                overrideSchoolRecord={DEMO_SCHOOL_DATA}
                onOpenPaymentModal={() => handleOpenPaymentModal({ dise: '29010100101', schoolName: DEMO_SCHOOL_DATA.schoolName })}
                activeCategory={activeNavTab}
                onSelectCategory={setActiveNavTab}
                isDemoMode={true}
              />
            ) : (
              <DemoDashboard
                onExitDemo={() => setIsDemoMode(false)}
                onOpenPaymentModal={() => handleOpenPaymentModal()}
              />
            )}
          </div>
        ) : isAdmin ? (
          /* CASE 1: ROOT ADMINISTRATOR VIEW (Shri S R Angadi) */
          <div className="overflow-y-auto max-h-[calc(100vh-80px)] pb-12">
            <div className="bg-slate-900 text-white border-b border-slate-800 px-4 py-2">
              <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold">System Administrator Active:</span>
                  <span className="text-blue-300 font-mono">{currentUser?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAdminViewMode('admin')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                      adminViewMode === 'admin'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Admin Control Panel
                  </button>
                  <button
                    onClick={() => setAdminViewMode('school')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                      adminViewMode === 'school'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    School Dashboard Preview
                  </button>
                </div>
              </div>
            </div>

            {adminViewMode === 'admin' ? (
              <AdminPortal />
            ) : (
              <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 mb-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                    <span>
                      Previewing School Dashboard layout as Administrator. Security isolation remains active.
                    </span>
                    <button
                      onClick={() => setAdminViewMode('admin')}
                      className="px-2.5 py-1 bg-amber-200 text-amber-950 font-bold rounded-lg hover:bg-amber-300 text-xs cursor-pointer"
                    >
                      Return to Admin Panel
                    </button>
                  </div>
                </div>
                <SchoolDashboard
                  onOpenPaymentModal={() => handleOpenPaymentModal()}
                  activeCategory={activeNavTab}
                  onSelectCategory={setActiveNavTab}
                />
              </div>
            )}
          </div>
        ) : currentUser ? (
          /* CASE 2: AUTHENTICATED SCHOOL USER */
          <div className="overflow-y-auto max-h-[calc(100vh-80px)] pb-12">
            {schoolRecord?.status === 'PENDING' ? (
              <PendingApprovalView
                onOpenPaymentModal={() =>
                  handleOpenPaymentModal({
                    dise: schoolRecord.diseCode,
                    schoolName: schoolRecord.schoolName,
                    mobile: schoolRecord.mobile,
                    hmName: schoolRecord.headmasterName,
                  })
                }
              />
            ) : schoolRecord?.status === 'APPROVED' ? (
              <SchoolDashboard
                onOpenPaymentModal={() => handleOpenPaymentModal()}
                activeCategory={activeNavTab}
                onSelectCategory={setActiveNavTab}
              />
            ) : schoolRecord?.status === 'SUSPENDED' ||
              schoolRecord?.status === 'EXPIRED' ||
              schoolRecord?.status === 'REJECTED' ? (
              <SuspendedOrExpiredView onOpenPaymentModal={() => handleOpenPaymentModal()} />
            ) : (
              <SchoolDashboard
                onOpenPaymentModal={() => handleOpenPaymentModal()}
                activeCategory={activeNavTab}
                onSelectCategory={setActiveNavTab}
              />
            )}
          </div>
        ) : (
          /* CASE 3: UNAUTHENTICATED VISITOR - PROFESSIONAL LOGIN WINDOW (NO OBSCURING BY HEADER) */
          <div
            className="relative w-full flex-1 flex flex-col items-center justify-start p-3 sm:p-5 lg:p-6 pt-4 sm:pt-6 pb-16 overflow-y-auto"
            style={{ backgroundColor: '#1f82b7' }}
          >
            {/* Edge-to-edge Widescreen Background Visual */}
            <LoginBackgroundVisual />

            {/* Content Container (Aligned to start with safe spacing so top portion is completely visible) */}
            <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start z-10">
              {/* Left Column: Vertical Floating Features List */}
              <div className="hidden lg:flex lg:col-span-4 xl:col-span-3 justify-center lg:justify-start">
                <LeftFeaturePills
                  onFeatureClick={() => {
                    setIsDemoMode(true);
                    setDemoTab('schoolDashboard');
                  }}
                />
              </div>

              {/* Center / Main Column: Professional Login & Registration Card */}
              <div className="lg:col-span-8 xl:col-span-9 max-w-xl xl:max-w-2xl mx-auto w-full">
                <LoginCard
                  onOpenPaymentModal={handleOpenPaymentModal}
                  onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
                  onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
                  onLaunchDemo={() => {
                    setIsDemoMode(true);
                    setDemoTab('schoolDashboard');
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer for non-landing views (dashboard, demo, admin) */}
      {!isLandingView && <Footer />}

      {/* Pass Key / ₹500 Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        initialDise={paymentModalDetails.dise}
        initialSchoolName={paymentModalDetails.schoolName}
        initialMobile={paymentModalDetails.mobile}
        initialHmName={paymentModalDetails.hmName}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
      />

      {/* Pass Key Expiry Reminder Popup Window (Pop up when expiry comes near before 1 month) */}
      <PassKeyExpiryReminderModal
        isOpen={isExpiryReminderOpen}
        onClose={() => setIsExpiryReminderOpen(false)}
        daysLeft={daysLeft}
        expiryDateStr={schoolRecord?.subscriptionExpiry ? schoolRecord.subscriptionExpiry.split('T')[0] : undefined}
        onProceedToRenew={() =>
          handleOpenPaymentModal({
            dise: schoolRecord?.diseCode || (isDemoMode ? '29010100101' : undefined),
            schoolName: schoolRecord?.schoolName || (isDemoMode ? DEMO_SCHOOL_DATA.schoolName : undefined),
            mobile: schoolRecord?.mobile,
            hmName: schoolRecord?.headmasterName,
          })
        }
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
