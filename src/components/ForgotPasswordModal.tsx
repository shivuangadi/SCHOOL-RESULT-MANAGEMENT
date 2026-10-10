import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { X, KeyRound, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const { resetPasswordForDise } = useAuth();
  const { lang } = useLanguage();

  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    setLoading(true);
    setMessage(null);
    const res = await resetPasswordForDise(inputVal.trim());
    setLoading(false);
    setMessage({ text: res.message, isError: !res.success });
  };

  const getWhatsAppHelpLink = () => {
    const text = encodeURIComponent(
      `Namaskara Shri S R Angadi Sir,\nWe forgot our password for the School Result Management System.\nDISE Code / Contact: ${inputVal || 'Not specified'}\nPlease assist us with password reset.`
    );
    return `https://wa.me/919731766727?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="bg-blue-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {lang === 'kn' ? 'ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ' : 'Password Reset'}
              </h3>
              <p className="text-xs text-blue-200">School Account Password Assistance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Enter your school's 11-digit DISE Code or registered email address. For immediate security
            verification, you can also contact Administrator Shri S R Angadi directly via WhatsApp.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                11 Digit DISE Code or Registered Email *
              </label>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="e.g. 29010100101 or school@gmail.com"
                required
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  message.isError
                    ? 'bg-amber-50 border border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}
              >
                {message.isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !inputVal.trim()}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs transition disabled:opacity-50 cursor-pointer shadow"
            >
              {loading ? 'Processing...' : 'Request Password Reset'}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase font-semibold">
              Or Instant Admin Contact
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <a
            href={getWhatsAppHelpLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Contact Shri S R Angadi on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
