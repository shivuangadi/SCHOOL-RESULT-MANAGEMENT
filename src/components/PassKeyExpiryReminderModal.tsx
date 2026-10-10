import React from 'react';
import { AlertTriangle, KeyRound, CheckCircle2, Clock, Phone, Sparkles, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface PassKeyExpiryReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysLeft: number;
  expiryDateStr?: string;
  onProceedToRenew: () => void;
}

export const PassKeyExpiryReminderModal: React.FC<PassKeyExpiryReminderModalProps> = ({
  isOpen,
  onClose,
  daysLeft,
  expiryDateStr,
  onProceedToRenew,
}) => {
  const { lang } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-amber-400 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-slate-950 p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-950 text-amber-300 flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight text-slate-950 font-serif">
                {lang === 'kn'
                  ? 'ಪಾಸ್ ಕೀ ನವೀಕರಣ ಜ್ಞಾಪನೆ'
                  : 'Pass Key Renewal Reminder'}
              </h3>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {daysLeft <= 0
                  ? 'Pass Key Expired • ತಕ್ಷಣ ನವೀಕರಿಸಿ'
                  : `Validity expires in ${daysLeft} days • 1 ತಿಂಗಳ ಮುಂಚೆ ನವೀಕರಿಸಿ`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-950/80 hover:text-slate-950 p-1.5 rounded-xl hover:bg-black/10 cursor-pointer"
            title="Close reminder"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-slate-800 text-xs sm:text-sm">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-black text-amber-950 text-sm">
                {lang === 'kn'
                  ? 'ನಿಮ್ಮ ಶಾಲೆಯ 1 ವರ್ಷದ ಲಾಗಿನ್ ಪಾಸ್ ಕೀ ಮುಕ್ತಾಯ ಹಂತದಲ್ಲಿದೆ!'
                  : 'Your school 1-Year subscription pass key is nearing expiry!'}
              </div>
              <p className="text-amber-900 leading-relaxed text-xs">
                {lang === 'kn'
                  ? `ಮುಕ್ತಾಯಕ್ಕೆ ಕೇವಲ ${daysLeft} ದಿನಗಳು ಬಾಕಿ ಇವೆ (${expiryDateStr ? `ಮುಕ್ತಾಯ ದಿನಾಂಕ: ${expiryDateStr}` : 'ಮುಕ್ತಾಯ ಹತ್ತಿರದಲ್ಲಿದೆ'}). ವಿದ್ಯಾರ್ಥಿಗಳ ಫಲಿತಾಂಶ ನಿರ್ವಹಣೆ, CCE ಬ್ರಾಡ್ ಶೀಟ್ ಹಾಗೂ ಅಂಕಪಟ್ಟಿಗಳ ಮುದ್ರಣದಲ್ಲಿ ಯಾವುದೇ ತಡೆ ಉಂಟಾಗದಂತೆ ದಯವಿಟ್ಟು 1 ತಿಂಗಳ ಮುಂಚಿತವಾಗಿ ₹500 ಪಾವತಿಸಿ ನವೀಕರಿಸಿ.`
                  : `Only ${daysLeft} days left before expiry. Please renew your pass key before 1 month to ensure continuous, uninterrupted access to CCE Result Entry, Broadsheets, and Marks Cards printing.`}
              </p>
            </div>
          </div>

          {/* Pricing & Key Information */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-[11px] font-bold text-blue-800 uppercase block">
                ನವೀಕರಣ ಶುಲ್ಕ (Fee)
              </span>
              <span className="text-xl font-black text-blue-950 font-mono">₹500 / 1 Year</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                ಅವಧಿ ವಿಸ್ತರಣೆ (Extension)
              </span>
              <span className="text-xl font-black text-emerald-950 font-mono">+ 365 Days</span>
            </div>
          </div>

          {/* Contact Helpline */}
          <div className="bg-slate-100 rounded-2xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-700" />
              <div>
                <span className="font-bold text-slate-800">ಸಹಾಯವಾಣಿ (Helpline): </span>
                <span className="font-mono font-bold text-blue-900">9731766727</span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-600">ಶ್ರೀ ಎಸ್. ಆರ್. ಅಂಗಡಿ</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => {
                onClose();
                onProceedToRenew();
              }}
              className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>ಈಗಲೇ ನವೀಕರಿಸಿ (Renew Pass Key Now)</span>
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-2xl transition cursor-pointer"
            >
              ನಂತರ ನೆನಪಿಸಿ (Remind Later)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
