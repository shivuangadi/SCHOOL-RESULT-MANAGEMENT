import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ShieldAlert, AlertTriangle, MessageSquare, CreditCard, LogOut } from 'lucide-react';

interface SuspendedOrExpiredViewProps {
  onOpenPaymentModal: () => void;
}

export const SuspendedOrExpiredView: React.FC<SuspendedOrExpiredViewProps> = ({
  onOpenPaymentModal,
}) => {
  const { schoolRecord, logout } = useAuth();
  const { lang, t } = useLanguage();

  const isExpired = schoolRecord?.status === 'EXPIRED' || schoolRecord?.subscriptionStatus === 'EXPIRED';
  const isRejected = schoolRecord?.status === 'REJECTED';
  const isSuspended = schoolRecord?.status === 'SUSPENDED';

  const getWhatsAppHelpLink = () => {
    const text = encodeURIComponent(
      `Namaskara Shri S R Angadi Sir,\nRegarding School Result Management System account status:\nSchool: ${schoolRecord?.schoolName || 'N/A'}\nDISE: ${schoolRecord?.diseCode || 'N/A'}\nStatus: ${schoolRecord?.status || 'N/A'}\nPlease assist us.`
    );
    return `https://wa.me/919481552554?text=${text}`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-center p-8 space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-red-100 text-red-600">
          {isExpired ? (
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          ) : (
            <ShieldAlert className="w-8 h-8 text-red-600" />
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isExpired
              ? lang === 'kn'
                ? 'ಚಂದಾದಾರಿಕೆ ಅವಧಿ ಮುಕ್ತಾಯಗೊಂಡಿದೆ'
                : 'School Subscription Expired'
              : isRejected
              ? lang === 'kn'
                ? 'ನೋಂದಣಿಯನ್ನು ತಿರಸ್ಕರಿಸಲಾಗಿದೆ'
                : 'School Registration Declined'
              : lang === 'kn'
              ? 'ಖಾತೆಯನ್ನು ಅಮಾನತುಗೊಳಿಸಲಾಗಿದೆ'
              : 'School Account Access Suspended'}
          </h2>

          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
            {isExpired
              ? 'Your 1-year pass key license has expired. Please renew the ₹500 annual subscription to regain full access to marks entry, student databases, and result generation.'
              : isRejected
              ? schoolRecord?.rejectionReason ||
                'Your school registration request was not approved by the administrator. Please contact Shri S R Angadi for clarification.'
              : 'Your school account has been temporarily suspended by the administrator. Please contact the administrator via WhatsApp for verification.'}
          </p>
        </div>

        {/* School Info Tag */}
        {schoolRecord && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 inline-block font-mono">
            {schoolRecord.schoolName} • DISE: {schoolRecord.diseCode}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {isExpired && (
            <button
              onClick={onOpenPaymentModal}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Renew Pass Key (₹500)</span>
            </button>
          )}

          <a
            href={getWhatsAppHelpLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Contact Administrator on WhatsApp</span>
          </a>

          <button
            onClick={logout}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
