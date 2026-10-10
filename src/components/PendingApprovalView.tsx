import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Clock,
  MessageSquare,
  CreditCard,
  RotateCw,
  LogOut,
  Building,
  Hash,
  Phone,
  User,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface PendingApprovalViewProps {
  onOpenPaymentModal: () => void;
}

export const PendingApprovalView: React.FC<PendingApprovalViewProps> = ({ onOpenPaymentModal }) => {
  const { schoolRecord, currentUser, refreshSchoolRecord, logout } = useAuth();
  const { lang, t } = useLanguage();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [utrInput, setUtrInput] = useState(schoolRecord?.paymentReference || '');
  const [isUpdatingUtr, setIsUpdatingUtr] = useState(false);
  const [utrSaved, setUtrSaved] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSchoolRecord();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleSaveUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !schoolRecord || !utrInput.trim()) return;

    setIsUpdatingUtr(true);
    try {
      const updates = {
        paymentReference: utrInput.trim(),
        paymentNotes: `Payment ref updated by school HM on ${new Date().toLocaleString()}`,
      };
      await updateDoc(doc(db, 'schools', schoolRecord.diseCode), updates).catch(() => {});
      if (currentUser.uid !== schoolRecord.diseCode) {
        await updateDoc(doc(db, 'schools', currentUser.uid), updates).catch(() => {});
      }
      await updateDoc(doc(db, 'registrationRequests', schoolRecord.diseCode), updates).catch(() => {});

      setIsUpdatingUtr(false);
      setUtrSaved(true);
      setTimeout(() => setUtrSaved(false), 3500);
    } catch (err) {
      setIsUpdatingUtr(false);
      handleFirestoreError(err, OperationType.UPDATE, `schools/${schoolRecord.diseCode}`);
    }
  };

  const getWhatsAppMessage = () => {
    const text = `*SCHOOL RESULT MANAGEMENT SYSTEM - PASS KEY APPROVAL REQUEST*
------------------------------------
• *School Name:* ${schoolRecord?.schoolName || 'N/A'}
• *DISE Code:* ${schoolRecord?.diseCode || 'N/A'}
• *School Type:* ${schoolRecord?.schoolType || 'N/A'}
• *Headmaster:* ${schoolRecord?.headmasterName || 'N/A'}
• *Mobile:* ${schoolRecord?.mobile || 'N/A'}
• *Payment Amount:* ₹500
• *UTR / Ref ID:* ${utrInput || schoolRecord?.paymentReference || 'Screenshot Attached'}
------------------------------------
Namaskara Shri S R Angadi Sir, I have registered our school and submitted the ₹500 pass key fee. Please verify our payment and approve our school account.`;
    return encodeURIComponent(text);
  };

  const whatsAppUrl = `https://wa.me/919731766727?text=${getWhatsAppMessage()}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl border border-amber-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <Clock className="w-8 h-8 text-amber-100" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-1">
                Account Status: PENDING
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">
                {t('pendingHeading')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition cursor-pointer backdrop-blur-sm"
              title="Check if Administrator has approved your account"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Main Notice */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm leading-relaxed flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950 mb-1">
                {lang === 'kn' ? 'ಸೂಚನೆ:' : 'Action Required for System Access:'}
              </div>
              <div>{t('pendingMessage')}</div>
            </div>
          </div>

          {/* School Registered Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
              Registered School Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Building className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  <strong className="text-slate-900">School:</strong> {schoolRecord?.schoolName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Hash className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  <strong className="text-slate-900">DISE Code:</strong>{' '}
                  <span className="font-mono font-semibold">{schoolRecord?.diseCode}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800">
                <Building className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  <strong className="text-slate-900">Medium & Type:</strong>{' '}
                  <span className="font-bold bg-emerald-100 px-1.5 py-0.5 rounded text-[11px]">
                    {schoolRecord?.schoolMedium || 'Kannada'} Medium • {schoolRecord?.schoolType}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  <strong className="text-slate-900">Headmaster:</strong>{' '}
                  {schoolRecord?.headmasterName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  <strong className="text-slate-900">Mobile:</strong>{' '}
                  <span className="font-mono">{schoolRecord?.mobile}</span>
                </span>
              </div>
            </div>
          </div>

          {/* 2-Step Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action 1: Pay / View Payment Instructions */}
            <div className="border-2 border-emerald-300 bg-emerald-50/50 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span>Step 1: ₹500 Pass Key Fee</span>
                </div>
                <div className="text-lg font-bold text-slate-900 mt-2">
                  ₹500 <span className="text-xs font-normal text-slate-600">/ 1 Year License</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Pay via UPI to official ID <strong className="text-slate-900">shivu.angadi@okaxis</strong> or mobile <strong>9481552554</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenPaymentModal}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>{t('buyPassKeyBtn')}</span>
              </button>
            </div>

            {/* Action 2: Send WhatsApp Proof */}
            <div className="border-2 border-teal-300 bg-teal-50/50 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-teal-700" />
                  <span>Step 2: Send Proof on WhatsApp</span>
                </div>
                <div className="text-sm font-bold text-slate-900 mt-2">
                  Direct Verification by Shri S R Angadi
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Tap below to launch WhatsApp with pre-filled school credentials and transaction proof for instant approval.
                </p>
              </div>

              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition cursor-pointer text-center"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>{t('sendWhatsAppProof')}</span>
                <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
              </a>
            </div>
          </div>

          {/* Form to Record UTR Number */}
          <form
            onSubmit={handleSaveUtr}
            className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3"
          >
            <div className="text-xs font-bold text-slate-700">
              Already made payment? Record your UPI / UTR Transaction ID here:
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={utrInput}
                onChange={(e) => setUtrInput(e.target.value)}
                placeholder="Enter 12-digit UPI UTR number (e.g., 423981298401)"
                className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-white font-mono"
              />
              <button
                type="submit"
                disabled={isUpdatingUtr || !utrInput.trim()}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer shadow-sm shrink-0"
              >
                {isUpdatingUtr ? 'Saving...' : 'Save Reference'}
              </button>
            </div>
            {utrSaved && (
              <div className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Reference saved! Admin can now see this in the approval queue.</span>
              </div>
            )}
          </form>

          {/* Verification Timeline Info */}
          <div className="border-t border-slate-200 pt-4 text-xs text-slate-500 flex items-center justify-between">
            <span>Average Approval Time: 1 to 2 hours</span>
            <span>Helpline: +91 97317 66727 (Govt KHPS Ningyanatti)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
