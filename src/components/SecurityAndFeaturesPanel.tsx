import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Award,
  Users,
  BarChart3,
  FileText,
  PieChart,
  Cloud,
  Smartphone,
  PhoneCall,
  Sparkles,
} from 'lucide-react';

export const SecurityAndFeaturesPanel: React.FC = () => {
  const { lang, t } = useLanguage();

  const securityPoints = [
    { title: t('sec1'), desc: 'Unique 11-digit DISE code authentication via Firebase Auth' },
    { title: t('sec2'), desc: 'Zero data leakage between schools with Firestore security rules' },
    { title: t('sec3'), desc: 'Mandatory pass key & administrator verification for every school' },
    { title: t('sec4'), desc: 'Aligned with Karnataka Education Department syllabus & grading' },
    { title: t('sec5'), desc: 'Direct helpline with Shri S R Angadi (Govt KHPS Ningyanatti)' },
  ];

  const systemFeatures = [
    {
      title: 'Enter Marks',
      kannada: 'ಅಂಕಗಳ ನಮೂದು',
      desc: 'Intuitive mark entry for FA-1, FA-2, SA-1, FA-3, FA-4, and SA-2 for all subjects.',
      icon: FileSpreadsheet,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'Generate Results',
      kannada: 'ಫಲಿತಾಂಶ ತಯಾರಿಕೆ',
      desc: 'Automatic grade calculation, total marks, percentage, and promotion status.',
      icon: Award,
      color: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Student Management',
      kannada: 'ವಿದ್ಯಾರ್ಥಿ ಮಾಹಿತಿ',
      desc: 'Classes 1–8 enrollment with SATS number, roll number, gender, and caste tracking.',
      icon: Users,
      color: 'bg-indigo-100 text-indigo-700',
    },
    {
      title: 'Class & Subject Reports',
      kannada: 'ತರಗತಿವಾರು ವರದಿಗಳು',
      desc: 'Comprehensive performance matrices, subject averages, and failure diagnostics.',
      icon: BarChart3,
      color: 'bg-amber-100 text-amber-700',
    },
    {
      title: 'Marks Card & PDF',
      kannada: 'ಮಾರ್ಕ್ಸ್ ಕಾರ್ಡ್ & PDF',
      desc: 'One-click generation of official Karnataka school marks cards ready for printing.',
      icon: FileText,
      color: 'bg-purple-100 text-purple-700',
    },
    {
      title: 'Gender & Caste Analysis',
      kannada: 'ಲಿಂಗ & ಜಾತಿವಾರು ವಿಶ್ಲೇಷಣೆ',
      desc: 'Department-mandated statistical breakdowns for BEO and DDPI office submissions.',
      icon: PieChart,
      color: 'bg-rose-100 text-rose-700',
    },
    {
      title: 'Secure Cloud Storage',
      kannada: 'ಕ್ಲೌಡ್ ಶೇಖರಣೆ',
      desc: 'Firebase Firestore cloud security ensuring your records are never lost or corrupted.',
      icon: Cloud,
      color: 'bg-sky-100 text-sky-700',
    },
    {
      title: 'Works on Mobile & PC',
      kannada: 'ಮೊಬೈಲ್ & ಪಿಸಿ ಬೆಂಬಲ',
      desc: 'Fully responsive for teachers on the move using Android smartphones or desktops.',
      icon: Smartphone,
      color: 'bg-teal-100 text-teal-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Security Assurance Card */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white rounded-2xl p-6 shadow-xl border border-blue-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-3 pb-4 border-b border-blue-700/60">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">
              {lang === 'kn' ? 'ಸುರಕ್ಷತಾ ಮಾನದಂಡಗಳು' : 'Security Assurance Panel'}
            </h3>
            <p className="text-xs text-blue-200">
              Karnataka School Data Privacy & Strict Access Control
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-3">
          {securityPoints.map((pt, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <span>✓ {pt.title}</span>
                </div>
                <div className="text-[11px] text-blue-200 leading-tight mt-0.5">
                  {pt.desc}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Mentor direct helpline banner */}
        <div className="mt-5 pt-4 border-t border-blue-700/60 flex items-center justify-between text-xs text-blue-100">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              Teacher Support Hotline: <strong className="text-white">+91 94815 52554</strong>
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-blue-800 text-amber-300 font-semibold border border-blue-600">
            Govt KHPS Ningyanatti
          </span>
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {lang === 'kn' ? 'ವ್ಯವಸ್ಥೆಯ ಮುಖ್ಯ ಸೌಲಭ್ಯಗಳು' : 'Comprehensive System Features'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Classes 1 to 8 Karnataka State Syllabus Modules
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Phase 1 Foundation
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
          {systemFeatures.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition group flex items-start gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-lg ${feat.color} flex items-center justify-center shrink-0 shadow-sm`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-900 flex items-center gap-1.5">
                    <span>{feat.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({feat.kannada})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
