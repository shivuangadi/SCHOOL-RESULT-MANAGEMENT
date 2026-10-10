import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  X,
  CreditCard,
  QrCode,
  Copy,
  Check,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDise?: string;
  initialSchoolName?: string;
  initialMobile?: string;
  initialHmName?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  initialDise = '',
  initialSchoolName = '',
  initialMobile = '',
  initialHmName = '',
}) => {
  const { schoolRecord, currentUser } = useAuth();
  const { lang, t } = useLanguage();

  const [dise, setDise] = useState(initialDise || schoolRecord?.diseCode || '');
  const [schoolName, setSchoolName] = useState(initialSchoolName || schoolRecord?.schoolName || '');
  const [mobile, setMobile] = useState(initialMobile || schoolRecord?.mobile || '');
  const [hmName, setHmName] = useState(initialHmName || schoolRecord?.headmasterName || '');
  const [txnId, setTxnId] = useState(schoolRecord?.paymentReference || '');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (initialDise) setDise(initialDise);
    else if (schoolRecord?.diseCode) setDise(schoolRecord.diseCode);

    if (initialSchoolName) setSchoolName(initialSchoolName);
    else if (schoolRecord?.schoolName) setSchoolName(schoolRecord.schoolName);

    if (initialMobile) setMobile(initialMobile);
    else if (schoolRecord?.mobile) setMobile(schoolRecord.mobile);

    if (initialHmName) setHmName(initialHmName);
    else if (schoolRecord?.headmasterName) setHmName(schoolRecord.headmasterName);

    if (schoolRecord?.paymentReference) setTxnId(schoolRecord.paymentReference);
  }, [initialDise, initialSchoolName, initialMobile, initialHmName, schoolRecord]);

  if (!isOpen) return null;

  const upiId = '9731766727@ybl';
  const supportPhone = '919731766727';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const getWhatsAppMessage = () => {
    const text = `*SCHOOL RESULT MANAGEMENT SYSTEM - PASS KEY PAYMENT PROOF*
------------------------------------
• *School Name:* ${schoolName || 'Not specified'}
• *DISE Code:* ${dise || 'Not specified'}
• *HM / Teacher:* ${hmName || 'Not specified'}
• *Mobile:* ${mobile || 'Not specified'}
• *Amount Paid:* ₹500 (Annual School License)
• *UPI / UTR Ref:* ${txnId || 'Attached Screenshot'}
------------------------------------
Namaskara Shri S R Angadi Sir, I have transferred ₹500 for our school result pass key activation. Kindly verify and approve our school account.`;
    return encodeURIComponent(text);
  };

  const handleSaveTxnDetails = async () => {
    const targetDise = dise || schoolRecord?.diseCode;
    if (!targetDise) return;
    setIsSaving(true);
    try {
      const updates = {
        paymentReference: txnId.trim(),
        paymentStatus: 'PENDING_APPROVAL',
        paymentNotes: `UTR recorded by school on ${new Date().toLocaleDateString()}`,
      };
      await updateDoc(doc(db, 'schools', targetDise), updates).catch(() => {});
      await updateDoc(doc(db, 'registrationRequests', targetDise), updates).catch(() => {});
      setSaveSuccess(true);
      setIsSaving(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setIsSaving(false);
      handleFirestoreError(err, OperationType.UPDATE, `schools/${targetDise}`);
    }
  };

  const whatsAppUrl = `https://wa.me/${supportPhone}?text=${getWhatsAppMessage()}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <CreditCard className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">
                {lang === 'kn' ? 'ಪಾಸ್ ಕೀ ಪಡೆಯಿರಿ / ₹500 ಪಾವತಿಸಿ' : 'Buy Pass Key / Pay ₹500'}
              </h3>
              <p className="text-xs text-emerald-100">
                1-Year Karnataka School Result Software Pass Key License
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Fee & Inclusions Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                Full Academic Year License
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                ₹500 <span className="text-xs font-normal text-slate-600">/ School / Year</span>
              </div>
              <div className="text-xs text-emerald-700 mt-1">
                ✓ Classes 1 to 8 • Complete FA/SA • Result Sheets & Marks Cards
              </div>
            </div>
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg border-2 border-emerald-300">
              ₹500
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Step 1: Transfer via UPI (GPay / PhonePe / Paytm / BHIM)
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                Direct to Mentor
              </span>
            </div>

            {/* UPI ID Copy Block */}
            <div className="bg-white border-2 border-emerald-500/40 rounded-xl p-3 flex items-center justify-between gap-2 shadow-sm">
              <div>
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Official Admin UPI ID</div>
                <div className="font-mono text-base font-bold text-slate-900 tracking-wide select-all">
                  {upiId}
                </div>
                <div className="text-xs text-slate-600">Name: Shri S R Angadi (Science Teacher)</div>
              </div>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition cursor-pointer shadow"
              >
                {copiedUpi ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy UPI</span>
                  </>
                )}
              </button>
            </div>

            {/* QR Mockup Info */}
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-600">
              <QrCode className="w-8 h-8 text-slate-700 shrink-0" />
              <div>
                <div className="font-medium text-slate-800">
                  You can also search mobile number <span className="font-bold text-slate-900 font-mono">9731766727</span> on Google Pay or PhonePe.
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Account holder: S R ANGADI (Govt KHPS Ningyanatti)
                </div>
              </div>
            </div>
          </div>

          {/* School Details for WhatsApp Pre-fill */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Step 2: Enter School Info for Instant Verification
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  11 Digit DISE Code *
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={dise}
                  onChange={(e) => setDise(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 29010100101"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  School Name *
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="School Name"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="10 digit mobile"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  UPI / UTR Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  placeholder="e.g. 423987123981"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {currentUser && (
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSaveTxnDetails}
                  disabled={isSaving || !txnId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save UTR in Account'}
                </button>
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> UTR recorded in your school record
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action: Send Proof via WhatsApp */}
          <div className="space-y-3">
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-600/30 transition transform active:scale-[0.99] cursor-pointer"
            >
              <MessageSquare className="w-5 h-5 fill-white" />
              <span>{t('sendWhatsAppProof')}</span>
            </a>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Manual approval by Shri S R Angadi within 1–2 hours after WhatsApp verification.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
