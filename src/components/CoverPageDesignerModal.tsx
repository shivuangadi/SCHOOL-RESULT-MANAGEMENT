/**
 * ============================================================================
 * SRMS SCHOOL RESULT COVER PAGE DESIGNER (ಮುಖಪುಟ ವಿನ್ಯಾಸಕ)
 * Project: School Result Management System (SRMS) by Shri. S. R. Angadi
 * Primary Reference: Karnataka Government School Result Document
 * ============================================================================
 */

import React, { useState, useRef, useEffect, useId } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SchoolRecord } from '../types';
import {
  downloadCoverPagePdf,
  printCoverPage,
  CoverPaperSize,
  COVER_PAGE_CONFIG,
} from '../utils/coverPagePdfHelper';
import {
  FileText,
  Printer,
  Download,
  RotateCcw,
  X,
  Palette,
  Sliders,
  Check,
  Upload,
  Eye,
  Settings,
  Sparkles,
  Layers,
  ChevronRight,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';

export type CoverTemplateId =
  | 'traditionalGov'
  | 'modernMinimal'
  | 'ornamentalClassic'
  | 'geometricPro'
  | 'karnatakaHeritage';

interface CoverTemplateMeta {
  id: CoverTemplateId;
  nameKn: string;
  nameEn: string;
  description: string;
  badge: string;
}

const TEMPLATES: CoverTemplateMeta[] = [
  {
    id: 'traditionalGov',
    nameKn: 'ಸಾಂಪ್ರದಾಯಿಕ ಸರ್ಕಾರಿ ಶೈಲಿ',
    nameEn: 'Traditional Government Style',
    description: 'ನೈಜ ಸರ್ಕಾರಿ ಶಾಲಾ ಕಡತ ಶೈಲಿ, ವೃತ್ತಾಕಾರದ ಮುದ್ರೆ, ಗಂಡಭೇರುಂಡ ಲಾಂಛನ ಹಾಗೂ ನಮಸ್ಕಾರ ಭಂಗಿ',
    badge: 'Official / ಅಧಿಕೃತ',
  },
  {
    id: 'modernMinimal',
    nameKn: 'ಆಧುನಿಕ ಸರಳ ಶೈಲಿ',
    nameEn: 'Modern Minimal',
    description: 'ಸ್ವಚ್ಛ ಮತ್ತು ಸೊಗಸಾದ ಟೈಪೋಗ್ರಫಿ, ಸರಳ ದ್ವಿಮುಖ ಗಡಿ ಹಾಗೂ ವೃತ್ತಿಪರ ವಿನ್ಯಾಸ',
    badge: 'Clean & Refined',
  },
  {
    id: 'ornamentalClassic',
    nameKn: 'ಕ್ಲಾಸಿಕ್ ಅಲಂಕಾರಿಕ ಶೈಲಿ',
    nameEn: 'Ornamental Classic',
    description: 'ರಾಜಮನೆತನದ ಮಾದರಿಯ ಅಲಂಕಾರಿಕ ಕಾರ್ನರ್‌ಗಳು, ರಿಬ್ಬನ್ ವಿಭಾಜಕಗಳು ಹಾಗೂ ಶಾಸ್ತ್ರೀಯ ಗಡಿ',
    badge: 'Royal Classic',
  },
  {
    id: 'geometricPro',
    nameKn: 'ಜ್ಯಾಮಿತೀಯ ವೃತ್ತಿಪರ ಶೈಲಿ',
    nameEn: 'Geometric Professional',
    description: 'ಖಚಿತ ಜ್ಯಾಮಿತೀಯ ಗಡಿಗಳು, ಡೈಮಂಡ್ ಕಾರ್ನರ್ ಆಭರಣಗಳು ಹಾಗೂ ವ್ಯವಸ್ಥಿತ ಶ್ರೇಣಿ',
    badge: 'Structured',
  },
  {
    id: 'karnatakaHeritage',
    nameKn: 'ಕರ್ನಾಟಕ ಪರಂಪರೆ ಶೈಲಿ',
    nameEn: 'Karnataka Heritage',
    description: 'ಕರ್ನಾಟಕ ಶಿಲ್ಪಕಲೆ ಮತ್ತು ಚಾಲುಕ್ಯ-ಹೊಯ್ಸಳ ಪರಂಪರೆಯಿಂದ ಪ್ರೇರಿತ ಕಲಾತ್ಮಕ ವಿನ್ಯಾಸ',
    badge: 'Heritage',
  },
];

interface CoverPageData {
  govtHeading: string;
  deptHeading: string;
  officeHeading: string;
  officePlace: string;
  academicYear: string;
  examTitle: string;
  schoolNameKannada: string;
  schoolNameEnglish: string;
  udiseCode: string;
  clusterName: string;
  subtitle: string;
  preparedBy: string;
  headmasterNote: string;
  customLogoUrl: string | null;
  // Visual Toggles
  showEmblem: boolean;
  showCircularSeal: boolean;
  showOfficeLine: boolean;
  showClusterLine: boolean;
  showSubtitle: boolean;
  showPreparedBy: boolean;
  showGreetingFigures: boolean;
}

interface CoverPageDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  overrideSchoolRecord?: SchoolRecord;
}

export const CoverPageDesignerModal: React.FC<CoverPageDesignerModalProps> = ({
  isOpen,
  onClose,
  overrideSchoolRecord,
}) => {
  const { schoolRecord: authSchoolRecord } = useAuth();
  const schoolRecord = overrideSchoolRecord || authSchoolRecord;
  const { lang } = useLanguage();

  const previewSheetRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTemplate, setActiveTemplate] = useState<CoverTemplateId>('traditionalGov');
  const [paperSize, setPaperSize] = useState<CoverPaperSize>('A4');
  const [activeTab, setActiveTab] = useState<'content' | 'templates' | 'options'>('content');
  const [isExportingColour, setIsExportingColour] = useState(false);
  const [isExportingBw, setIsExportingBw] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Initialize Default State from School Profile
  const getDefaultData = (): CoverPageData => {
    const sName = schoolRecord?.schoolName || 'ಸರಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಕನ್ನಡ ಶಾಲೆ ನಿಂಗ್ಯಾನಟ್ಟಿ (ಕ)';
    const dise = schoolRecord?.diseCode || '29010409301';
    const taluk = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
    const cluster = schoolRecord?.cluster || 'ಹಂದಿಗನೂರ';
    const year = schoolRecord?.academicYear || '2025-26';

    return {
      govtHeading: 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ',
      deptHeading: 'ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ',
      officeHeading: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ',
      officePlace: taluk.includes('ಬೆಳಗಾವಿ') ? taluk : `${taluk}`,
      academicYear: year,
      examTitle: `${year} ನೇ ಸಾಲಿನ ವಾರ್ಷಿಕ ಪರಿಣಾಮ ಪತ್ರಿಕೆ`,
      schoolNameKannada: sName,
      schoolNameEnglish: '',
      udiseCode: dise,
      clusterName: cluster ? `ಸಮೂಹ ಸಂಪನ್ಮೂಲ ಕೇಂದ್ರ ${cluster}` : 'ಸಮೂಹ ಸಂಪನ್ಮೂಲ ಕೇಂದ್ರ',
      subtitle: '1 ರಿಂದ 8 ನೇ ತರಗತಿಗಳ ವಾರ್ಷಿಕ ಶಾಲಾ ಪರೀಕ್ಷಾ ಫಲಿತಾಂಶ ದಾಖಲೆ',
      preparedBy: 'ವರ್ಗ ಶಿಕ್ಷಕರು ಹಾಗೂ ಮುಖ್ಯೋಪಾಧ್ಯಾಯರು',
      headmasterNote: '',
      customLogoUrl: null,
      showEmblem: true,
      showCircularSeal: true,
      showOfficeLine: true,
      showClusterLine: true,
      showSubtitle: false,
      showPreparedBy: false,
      showGreetingFigures: true,
    };
  };

  const [formData, setFormData] = useState<CoverPageData>(getDefaultData);

  // Synchronize when school record becomes available
  useEffect(() => {
    if (schoolRecord) {
      setFormData((prev) => ({
        ...prev,
        schoolNameKannada: prev.schoolNameKannada || schoolRecord.schoolName,
        udiseCode: prev.udiseCode || schoolRecord.diseCode,
        academicYear: prev.academicYear || schoolRecord.academicYear || '2025-26',
        examTitle: `${schoolRecord.academicYear || prev.academicYear || '2025-26'} ನೇ ಸಾಲಿನ ವಾರ್ಷಿಕ ಪರಿಣಾಮ ಪತ್ರಿಕೆ`,
        officePlace: prev.officePlace || schoolRecord.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ',
        clusterName: schoolRecord.cluster
          ? `ಸಮೂಹ ಸಂಪನ್ಮೂಲ ಕೇಂದ್ರ ${schoolRecord.cluster}`
          : prev.clusterName,
      }));
    }
  }, [schoolRecord]);

  if (!isOpen) return null;

  const handleReset = () => {
    if (window.confirm('ಪೂರ್ವನಿಯೋಜಿತ ಮಾಹಿತಿಗಳಿಗೆ ಮರುಹೊಂದಿಸುವುದೇ? / Reset to default cover page details?')) {
      setFormData(getDefaultData());
      setActiveTemplate('traditionalGov');
      setPaperSize('A4');
    }
  };

  // Custom Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, customLogoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Export Colour PDF
  const handleDownloadColourPdf = async () => {
    if (!previewSheetRef.current || isExportingColour || isExportingBw) return;
    setIsExportingColour(true);
    setExportSuccessMsg(null);
    try {
      const yearClean = formData.academicYear.replace(/[^0-9-]/g, '');
      const filename = `SRMS_Cover_Page_${yearClean}_Colour_${paperSize}.pdf`;
      const success = await downloadCoverPagePdf(
        previewSheetRef.current,
        filename,
        paperSize,
        false
      );
      if (success) {
        setExportSuccessMsg(`ಬಣ್ಣದ PDF ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ (${filename})`);
        setTimeout(() => setExportSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Colour PDF download error:', err);
    } finally {
      setIsExportingColour(false);
    }
  };

  // Export Black & White PDF
  const handleDownloadBwPdf = async () => {
    if (!previewSheetRef.current || isExportingColour || isExportingBw) return;
    setIsExportingBw(true);
    setExportSuccessMsg(null);
    try {
      const yearClean = formData.academicYear.replace(/[^0-9-]/g, '');
      const filename = `SRMS_Cover_Page_${yearClean}_BlackWhite_${paperSize}.pdf`;
      const success = await downloadCoverPagePdf(
        previewSheetRef.current,
        filename,
        paperSize,
        true
      );
      if (success) {
        setExportSuccessMsg(`ಕಪ್ಪು-ಬಿಳಿ PDF ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ (${filename})`);
        setTimeout(() => setExportSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('B&W PDF download error:', err);
    } finally {
      setIsExportingBw(false);
    }
  };

  // Direct Browser Print
  const handlePrint = () => {
    if (!previewSheetRef.current) return;
    printCoverPage(previewSheetRef.current, paperSize);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1500px] h-[95vh] flex flex-col overflow-hidden border border-slate-300">
        {/* ========================================================
            MODAL HEADER & TOP ACTION BAR
            ======================================================== */}
        <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  ಮುಖಪುಟ ವಿನ್ಯಾಸಕ / Cover Page Designer
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  Official SRMS
                </span>
              </div>
              <p className="text-xs text-slate-300">
                ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ನೈಜ ಶೈಲಿಯ ವಾರ್ಷಿಕ ಫಲಿತಾಂಶ ಮುಖಪುಟ (A4 / Legal Landscape)
              </p>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Paper Size Selector */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPaperSize('A4')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  paperSize === 'A4'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="A4 Landscape (297 x 210 mm)"
              >
                A4 Landscape
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('Legal')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  paperSize === 'Legal'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Legal Landscape (355.6 x 215.9 mm)"
              >
                Legal Landscape
              </button>
            </div>

            {/* Colour PDF Download */}
            <button
              type="button"
              onClick={handleDownloadColourPdf}
              disabled={isExportingColour || isExportingBw}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
              title="Download Full Colour PDF directly"
            >
              {isExportingColour ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4 text-emerald-200" />
              )}
              <span>🎨 ಬಣ್ಣದ PDF (Colour)</span>
            </button>

            {/* Black & White PDF Download */}
            <button
              type="button"
              onClick={handleDownloadBwPdf}
              disabled={isExportingColour || isExportingBw}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
              title="Download High-Contrast Black & White PDF directly (Ideal for xerox / photocopy)"
            >
              {isExportingBw ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4 text-slate-300" />
              )}
              <span>🖤 ಕಪ್ಪು-ಬಿಳಿ PDF (B&W)</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              title="Print directly to connected printer"
            >
              <Printer className="w-4 h-4" />
              <span>ಮುದ್ರಣ (Print)</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              title="Close Designer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success toast message */}
        {exportSuccessMsg && (
          <div className="bg-emerald-500 text-slate-950 px-4 py-1.5 text-xs font-black flex items-center justify-between border-b border-emerald-600 animate-in fade-in">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{exportSuccessMsg}</span>
            </span>
            <button
              onClick={() => setExportSuccessMsg(null)}
              className="hover:underline cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ========================================================
            MAIN BODY: TWO-COLUMN SPLIT (EDITOR & LIVE PREVIEW)
            ======================================================== */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100">
          {/* ----------------------------------------------------
              LEFT PANEL: CONTROLS & EDITABLE FIELDS
              ---------------------------------------------------- */}
          <div className="w-full lg:w-[420px] bg-white border-r border-slate-300 flex flex-col shrink-0 overflow-hidden shadow-sm">
            {/* Sub-tabs: Content, Templates, Options */}
            <div className="flex items-center border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'content'
                    ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>ಮಾಹಿತಿ ತಿದ್ದುಪಡಿ (Edit Info)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'templates'
                    ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>ಮಾದರಿಗಳು (5 Templates)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('options')}
                className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'options'
                    ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>ಆಯ್ಕೆಗಳು (Options)</span>
              </button>
            </div>

            {/* Tab 1: Editable Content Fields */}
            {activeTab === 'content' && (
              <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
                {/* School Name in Big Bold Kannada */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 flex items-center justify-between">
                    <span>ಶಾಲೆಯ ಹೆಸರು (Kannada): *</span>
                    <span className="text-[10px] text-blue-600 font-normal">ಮುಖ್ಯ ಶೀರ್ಷಿಕೆ</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.schoolNameKannada}
                    onChange={(e) =>
                      setFormData({ ...formData, schoolNameKannada: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    placeholder="ಸರಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಕನ್ನಡ ಶಾಲೆ ನಿಂಗ್ಯಾನಟ್ಟಿ (ಕ)"
                  />
                </div>

                {/* Exam Title & Academic Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">ಶೈಕ್ಷಣಿಕ ಸಾಲು (Academic Year):</label>
                    <input
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) => {
                        const newYear = e.target.value;
                        setFormData({
                          ...formData,
                          academicYear: newYear,
                          examTitle: `${newYear} ನೇ ಸಾಲಿನ ವಾರ್ಷಿಕ ಪರಿಣಾಮ ಪತ್ರಿಕೆ`,
                        });
                      }}
                      className="w-full p-2 border border-slate-300 rounded-xl font-bold text-xs"
                      placeholder="2025-26"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">UDISE / ಡೈಸ್ ಕೋಡ್:</label>
                    <input
                      type="text"
                      maxLength={11}
                      value={formData.udiseCode}
                      onChange={(e) => setFormData({ ...formData, udiseCode: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-xl font-mono font-bold text-xs"
                      placeholder="29010409301"
                    />
                  </div>
                </div>

                {/* Exam Title */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">ಪರೀಕ್ಷಾ ಶೀರ್ಷಿಕೆ (Exam Title):</label>
                  <input
                    type="text"
                    value={formData.examTitle}
                    onChange={(e) => setFormData({ ...formData, examTitle: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold text-xs text-blue-900"
                    placeholder="2025-26 ನೇ ಸಾಲಿನ ವಾರ್ಷಿಕ ಪರಿಣಾಮ ಪತ್ರಿಕೆ"
                  />
                </div>

                {/* Office Line */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">
                    ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ (BEO/BRC Office):
                  </label>
                  <input
                    type="text"
                    value={formData.officeHeading}
                    onChange={(e) => setFormData({ ...formData, officeHeading: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                    placeholder="ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ"
                  />
                </div>

                {/* Office Place / Taluk */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">ತಾಲ್ಲೂಕು / ಜಿಲ್ಲೆಯ ಹೆಸರು:</label>
                  <input
                    type="text"
                    value={formData.officePlace}
                    onChange={(e) => setFormData({ ...formData, officePlace: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold text-xs"
                    placeholder="ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ"
                  />
                </div>

                {/* Cluster CRC Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">ಸಮೂಹ ಸಂಪನ್ಮೂಲ ಕೇಂದ್ರ (Cluster CRC):</label>
                  <input
                    type="text"
                    value={formData.clusterName}
                    onChange={(e) => setFormData({ ...formData, clusterName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                    placeholder="ಸಮೂಹ ಸಂಪನ್ಮೂಲ ಕೇಂದ್ರ ಹಂದಿಗನೂರ"
                  />
                </div>

                {/* Optional Subtitle */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 flex items-center justify-between">
                    <span>ಉಪಶೀರ್ಷಿಕೆ (Optional Subtitle):</span>
                    <input
                      type="checkbox"
                      checked={formData.showSubtitle}
                      onChange={(e) =>
                        setFormData({ ...formData, showSubtitle: e.target.checked })
                      }
                      className="cursor-pointer"
                    />
                  </label>
                  <input
                    type="text"
                    disabled={!formData.showSubtitle}
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className={`w-full p-2 border border-slate-300 rounded-xl text-xs ${
                      !formData.showSubtitle ? 'bg-slate-100 text-slate-400' : ''
                    }`}
                    placeholder="1 ರಿಂದ 8 ನೇ ತರಗತಿಗಳ ವಾರ್ಷಿಕ ಫಲಿತಾಂಶ ದಾಖಲೆ"
                  />
                </div>

                {/* Reset Action */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>ಪೂರ್ವಸ್ಥಿತಿಗೆ ಮರುಹೊಂದಿಸಿ (Reset to Default)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Template Gallery */}
            {activeTab === 'templates' && (
              <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs">
                <span className="font-bold text-slate-800 block text-xs">
                  ವಿನ್ಯಾಸ ಶೈಲಿ ಆಯ್ಕೆಮಾಡಿ (Select Cover Page Style):
                </span>
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setActiveTemplate(tpl.id)}
                    className={`w-full p-3.5 rounded-xl border-2 text-left transition cursor-pointer flex flex-col gap-1.5 ${
                      activeTemplate === tpl.id
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-xs sm:text-sm">
                        {tpl.nameKn}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          activeTemplate === tpl.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tpl.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-blue-900 font-medium">{tpl.nameEn}</span>
                    <p className="text-[11px] text-slate-600 leading-snug">{tpl.description}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Tab 3: Visual Options & Uploads */}
            {activeTab === 'options' && (
              <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
                {/* Visual Toggles */}
                <div className="space-y-2.5">
                  <span className="font-bold text-slate-800 block">
                    ಘಟಕಗಳ ಗೋಚರತೆ (Elements Visibility):
                  </span>

                  <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <span className="text-slate-800 font-semibold">
                      ವೃತ್ತಾಕಾರದ ಶಾಲಾ ಮುದ್ರೆ (Circular Stamp)
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.showCircularSeal}
                      onChange={(e) =>
                        setFormData({ ...formData, showCircularSeal: e.target.checked })
                      }
                      className="cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <span className="text-slate-800 font-semibold">
                      ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಲಾಂಛನ (State Emblem)
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.showEmblem}
                      onChange={(e) =>
                        setFormData({ ...formData, showEmblem: e.target.checked })
                      }
                      className="cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <span className="text-slate-800 font-semibold">
                      BEO/BRC ಕಾರ್ಯಾಲಯ ಶೀರ್ಷಿಕೆ (Office Heading)
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.showOfficeLine}
                      onChange={(e) =>
                        setFormData({ ...formData, showOfficeLine: e.target.checked })
                      }
                      className="cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <span className="text-slate-800 font-semibold">
                      ಸಮೂಹ ಸಂಪನ್ಮೂಲ ಕೇಂದ್ರ (Cluster CRC)
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.showClusterLine}
                      onChange={(e) =>
                        setFormData({ ...formData, showClusterLine: e.target.checked })
                      }
                      className="cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <span className="text-slate-800 font-semibold">
                      ಕೆಳಗಿನ ನಮಸ್ಕಾರ ಭಂಗಿ ಆಕೃತಿಗಳು (Greeting Figures)
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.showGreetingFigures}
                      onChange={(e) =>
                        setFormData({ ...formData, showGreetingFigures: e.target.checked })
                      }
                      className="cursor-pointer"
                    />
                  </label>
                </div>

                {/* Custom Emblem / Logo Upload */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-800 block">
                    ಕಸ್ಟಮ್ ಲೋಗೋ / ಸೀಲ್ ಅಪ್ಲೋಡ್ (Custom Logo):
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="cover-custom-logo-input"
                  />
                  <label
                    htmlFor="cover-custom-logo-input"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>
                      {formData.customLogoUrl ? 'ಲೋಗೋ ಬದಲಾಯಿಸಿ (Change Logo)' : 'ಲೋಗೋ ಆಯ್ಕೆಮಾಡಿ (Upload Image)'}
                    </span>
                  </label>
                  {formData.customLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, customLogoUrl: null })}
                      className="text-xs text-rose-600 hover:underline block mx-auto cursor-pointer"
                    >
                      ಮೂಲ ಲಾಂಛನಕ್ಕೆ ಮರಳಿ (Remove Custom Logo)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ----------------------------------------------------
              RIGHT PANEL: REAL-TIME SCALED LANDSCAPE PREVIEW
              ---------------------------------------------------- */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center bg-slate-200/90">
            {/* Visual Paper Shadow Wrapper */}
            <div className="relative shadow-2xl transition-all duration-200">
              {/* Binding Margin Guide Indicator (Visual Helper) */}
              <div
                className="absolute top-0 bottom-0 left-0 w-[20mm] bg-amber-500/10 border-r border-dashed border-amber-500/30 pointer-events-none z-20 flex items-center justify-center print:hidden"
                title="Left 20mm Binding Margin / ಎಡಭಾಗದ 2.0 ಸೆಂ.ಮೀ. ಬೈಂಡಿಂಗ್ ಅಂತರ"
              >
                <span className="text-[9px] font-bold text-amber-700 -rotate-90 whitespace-nowrap tracking-widest opacity-60">
                  BINDING MARGIN (20mm)
                </span>
              </div>

              {/* The Actual Printable Landscape Page Component */}
              <div
                ref={previewSheetRef}
                style={{
                  width: paperSize === 'Legal' ? '355.6mm' : '297mm',
                  height: paperSize === 'Legal' ? '215.9mm' : '210mm',
                  paddingLeft: '20mm', // Exact 20mm binding margin
                  paddingRight: '10mm',
                  paddingTop: '10mm',
                  paddingBottom: '10mm',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box',
                }}
                className="relative flex items-center justify-center text-slate-900 select-none overflow-hidden print:w-full print:h-full print:p-0"
              >
                {/* Inner Border Layout based on chosen template */}
                <CoverPageTemplateRenderer
                  template={activeTemplate}
                  data={formData}
                  paperSize={paperSize}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   TEMPLATE RENDERER COMPONENT
   ============================================================================ */
interface CoverPageTemplateRendererProps {
  template: CoverTemplateId;
  data: CoverPageData;
  paperSize: CoverPaperSize;
}

const CoverPageTemplateRenderer: React.FC<CoverPageTemplateRendererProps> = ({
  template,
  data,
  paperSize,
}) => {
  const isLegal = paperSize === 'Legal';

  // Choose style variant
  switch (template) {
    case 'modernMinimal':
      return <ModernMinimalCover data={data} isLegal={isLegal} />;
    case 'ornamentalClassic':
      return <OrnamentalClassicCover data={data} isLegal={isLegal} />;
    case 'geometricPro':
      return <GeometricProCover data={data} isLegal={isLegal} />;
    case 'karnatakaHeritage':
      return <KarnatakaHeritageCover data={data} isLegal={isLegal} />;
    case 'traditionalGov':
    default:
      return <TraditionalGovCover data={data} isLegal={isLegal} />;
  }
};

/* ============================================================================
   1. TRADITIONAL GOVERNMENT STYLE (EXACT REFERENCE REPRODUCTION)
   ============================================================================ */
const TraditionalGovCover: React.FC<{ data: CoverPageData; isLegal: boolean }> = ({
  data,
  isLegal,
}) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
      }}
      className="relative flex flex-col justify-between p-4 sm:p-5 border-4 border-double border-slate-900 rounded-sm"
    >
      {/* CORNER MOTIFS: Top Filigree Scroll Ornaments */}
      <div className="absolute top-1 left-1 w-16 h-16 pointer-events-none">
        <TopLeftScrollCorner />
      </div>
      <div className="absolute top-1 right-1 w-16 h-16 pointer-events-none">
        <TopRightScrollCorner />
      </div>

      {/* CORNER MOTIFS: Bottom Traditional Indian Namaste / Greeting Woman Figures */}
      {data.showGreetingFigures && (
        <>
          <div className="absolute bottom-2 left-2 w-20 h-24 pointer-events-none">
            <NamasteWomanLeft />
          </div>
          <div className="absolute bottom-2 right-2 w-20 h-24 pointer-events-none">
            <NamasteWomanRight />
          </div>
        </>
      )}

      {/* ========================================================
          TOP SECTION: CIRCULAR STAMP (LEFT) & EMBLEM + GOVT (CENTER)
          ======================================================== */}
      <div className="relative w-full flex items-start justify-between min-h-[95px] px-2 pt-1">
        {/* Top-Left Circular School Stamp */}
        <div className="w-[125px] h-[125px] shrink-0 flex items-center justify-center">
          {data.showCircularSeal && (
            <CircularSchoolStamp
              schoolName={data.schoolNameKannada}
              udiseCode={data.udiseCode}
              taluk={data.officePlace}
            />
          )}
        </div>

        {/* Top-Center Karnataka State Emblem & Department Heading */}
        <div className="flex-1 flex flex-col items-center justify-center text-center -ml-16">
          {data.showEmblem && (
            <div className="w-16 h-16 mb-1 flex items-center justify-center">
              {data.customLogoUrl ? (
                <img
                  src={data.customLogoUrl}
                  alt="Custom Emblem"
                  className="max-h-16 object-contain"
                />
              ) : (
                <KarnatakaStateEmblem />
              )}
            </div>
          )}

          <div className="font-bold text-slate-900 text-sm tracking-wide leading-tight">
            {data.govtHeading}
          </div>
          <div className="font-bold text-slate-900 text-xs tracking-normal mt-0.5">
            {data.deptHeading}
          </div>
        </div>

        {/* Spacer to balance circular stamp width */}
        <div className="w-[125px] shrink-0" />
      </div>

      {/* ========================================================
          CENTER CONTENT: BEO/BRC OFFICE, EXAM TITLE & SCHOOL NAME
          ======================================================== */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 sm:px-14 py-2 space-y-4">
        {/* Office of Block Education Officer & BRC */}
        {data.showOfficeLine && (
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide font-serif leading-tight">
              {data.officeHeading}
            </h2>
            <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-wide">
              {data.officePlace}
            </div>
          </div>
        )}

        {/* Academic Year & Annual Result Title (Large Bold) */}
        <div className="pt-2 pb-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-normal font-serif leading-tight drop-shadow-xs">
            {data.examTitle}
          </h1>
        </div>

        {/* School Name in Very Big Bold Kannada */}
        <div className="pt-1 pb-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-wide font-serif leading-snug">
            {data.schoolNameKannada}
          </h2>
          {data.schoolNameEnglish && (
            <div className="text-sm font-bold text-slate-700 tracking-wider uppercase mt-1">
              {data.schoolNameEnglish}
            </div>
          )}
        </div>

        {/* Cluster CRC Line */}
        {data.showClusterLine && (
          <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-wide font-serif">
            {data.clusterName}
          </div>
        )}

        {/* Optional Subtitle */}
        {data.showSubtitle && data.subtitle && (
          <div className="text-xs sm:text-sm font-medium text-slate-700 italic border-t border-slate-300 pt-2 px-6">
            {data.subtitle}
          </div>
        )}
      </div>

      {/* ========================================================
          BOTTOM FOOTER / PREPARED BY AREA
          ======================================================== */}
      <div className="w-full flex items-end justify-between px-6 pb-2 text-xs font-bold text-slate-800">
        <div className="text-left">
          {/* Left spacing for Namaste figure */}
          <div className="w-16" />
        </div>

        <div className="text-center font-mono text-[11px] text-slate-600">
          UDISE: {data.udiseCode}
        </div>

        <div className="text-right">
          {/* Right spacing for Namaste figure */}
          <div className="w-16" />
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   2. MODERN MINIMAL STYLE
   ============================================================================ */
const ModernMinimalCover: React.FC<{ data: CoverPageData; isLegal: boolean }> = ({
  data,
  isLegal,
}) => {
  return (
    <div
      style={{ width: '100%', height: '100%', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
      className="relative flex flex-col justify-between p-6 sm:p-8 border-2 border-slate-800 rounded-lg"
    >
      {/* Thin inner hairline */}
      <div className="absolute inset-2 border border-slate-300 rounded pointer-events-none" />

      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="text-left font-mono text-xs font-bold text-slate-600">
          UDISE: {data.udiseCode}
        </div>
        <div className="text-center">
          <div className="text-xs font-black tracking-widest uppercase text-slate-900">
            {data.govtHeading}
          </div>
          <div className="text-[11px] text-slate-600">{data.deptHeading}</div>
        </div>
        <div className="text-right font-mono text-xs font-bold text-blue-900">
          {data.academicYear}
        </div>
      </div>

      {/* Center Core */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-4 space-y-4">
        {data.showEmblem && (
          <div className="w-14 h-14 mb-1">
            <KarnatakaStateEmblem />
          </div>
        )}

        {data.showOfficeLine && (
          <div className="text-sm font-semibold text-slate-700 tracking-wide uppercase">
            {data.officeHeading} • {data.officePlace}
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight font-serif">
          {data.examTitle}
        </h1>

        <div className="w-24 h-0.5 bg-slate-900 my-1" />

        <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-950 font-serif">
          {data.schoolNameKannada}
        </h2>

        {data.showClusterLine && (
          <div className="text-base font-bold text-slate-800">{data.clusterName}</div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-600 font-medium">
        <span>School Result Management System (SRMS)</span>
        <span>Karnataka State Examination & Assessment</span>
      </div>
    </div>
  );
};

/* ============================================================================
   3. ORNAMENTAL CLASSIC STYLE
   ============================================================================ */
const OrnamentalClassicCover: React.FC<{ data: CoverPageData; isLegal: boolean }> = ({
  data,
  isLegal,
}) => {
  return (
    <div
      style={{ width: '100%', height: '100%', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
      className="relative flex flex-col justify-between p-6 sm:p-7 border-4 border-double border-slate-950 rounded-xl"
    >
      {/* 4 Classic Ornate Corners */}
      <div className="absolute top-2 left-2 w-14 h-14 pointer-events-none">
        <TopLeftScrollCorner />
      </div>
      <div className="absolute top-2 right-2 w-14 h-14 pointer-events-none">
        <TopRightScrollCorner />
      </div>
      <div className="absolute bottom-2 left-2 w-14 h-14 pointer-events-none rotate-180">
        <TopRightScrollCorner />
      </div>
      <div className="absolute bottom-2 right-2 w-14 h-14 pointer-events-none rotate-180">
        <TopLeftScrollCorner />
      </div>

      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center pt-2">
        {data.showEmblem && (
          <div className="w-16 h-16 mb-1">
            <KarnatakaStateEmblem />
          </div>
        )}
        <div className="text-base font-black text-slate-950 tracking-wider">
          {data.govtHeading}
        </div>
        <div className="text-xs font-bold text-slate-800">{data.deptHeading}</div>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-10 py-2 space-y-3">
        {data.showOfficeLine && (
          <div className="text-lg font-bold text-slate-900 font-serif">
            {data.officeHeading}, {data.officePlace}
          </div>
        )}

        <div className="flex items-center gap-3 w-full max-w-lg my-1">
          <div className="flex-1 h-px bg-slate-400" />
          <span className="text-xs font-bold text-slate-600 uppercase">★ ★ ★</span>
          <div className="flex-1 h-px bg-slate-400" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-serif">
          {data.examTitle}
        </h1>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-serif pt-1">
          {data.schoolNameKannada}
        </h2>

        {data.showClusterLine && (
          <div className="text-lg font-bold text-slate-800 font-serif">{data.clusterName}</div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 pb-2 text-xs font-bold text-slate-800">
        <span>ಡೈಸ್ ಕೋಡ್: {data.udiseCode}</span>
        <span>ಶೈಕ್ಷಣಿಕ ಸಾಲು: {data.academicYear}</span>
      </div>
    </div>
  );
};

/* ============================================================================
   4. GEOMETRIC PROFESSIONAL STYLE
   ============================================================================ */
const GeometricProCover: React.FC<{ data: CoverPageData; isLegal: boolean }> = ({
  data,
  isLegal,
}) => {
  return (
    <div
      style={{ width: '100%', height: '100%', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
      className="relative flex flex-col justify-between p-6 sm:p-8 border-2 border-slate-900"
    >
      {/* Corner Diamond Glyphs */}
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-slate-900 rotate-45" />
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-slate-900 rotate-45" />
      <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-slate-900 rotate-45" />
      <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-slate-900 rotate-45" />

      {/* Top Banner */}
      <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {data.showEmblem && (
            <div className="w-12 h-12">
              <KarnatakaStateEmblem />
            </div>
          )}
          <div>
            <div className="text-sm font-black text-slate-950">{data.govtHeading}</div>
            <div className="text-xs text-slate-700">{data.deptHeading}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-black font-mono text-slate-900">DISE: {data.udiseCode}</div>
          <div className="text-xs font-bold text-blue-900">{data.academicYear}</div>
        </div>
      </div>

      {/* Center Body */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-4 space-y-4">
        {data.showOfficeLine && (
          <div className="text-base font-bold text-slate-800 tracking-wide">
            {data.officeHeading} • {data.officePlace}
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 font-serif">
          {data.examTitle}
        </h1>

        <div className="w-16 h-1 bg-blue-900" />

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-serif">
          {data.schoolNameKannada}
        </h2>

        {data.showClusterLine && (
          <div className="text-lg font-bold text-slate-800">{data.clusterName}</div>
        )}
      </div>

      {/* Bottom Footer */}
      <div className="border-t-2 border-slate-900 pt-3 flex items-center justify-between text-xs font-bold text-slate-800">
        <span>ಶಾಲಾ ಫಲಿತಾಂಶ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ (SRMS)</span>
        <span>Karnataka School Education Assessment</span>
      </div>
    </div>
  );
};

/* ============================================================================
   5. KARNATAKA HERITAGE STYLE
   ============================================================================ */
const KarnatakaHeritageCover: React.FC<{ data: CoverPageData; isLegal: boolean }> = ({
  data,
  isLegal,
}) => {
  return (
    <div
      style={{ width: '100%', height: '100%', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
      className="relative flex flex-col justify-between p-6 sm:p-8 border-4 border-slate-950 rounded-2xl"
    >
      {/* Decorative Arch Style Header */}
      <div className="flex flex-col items-center justify-center text-center pt-2">
        {data.showEmblem && (
          <div className="w-16 h-16 mb-1">
            <KarnatakaStateEmblem />
          </div>
        )}
        <div className="text-lg font-black text-slate-950 font-serif tracking-wide">
          {data.govtHeading}
        </div>
        <div className="text-xs font-bold text-slate-800">{data.deptHeading}</div>
      </div>

      {/* Center Information */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-10 py-2 space-y-3.5">
        {data.showOfficeLine && (
          <div className="text-xl font-bold text-slate-900 font-serif">
            {data.officeHeading}
            <div className="text-lg font-semibold">{data.officePlace}</div>
          </div>
        )}

        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-slate-900 to-transparent my-1" />

        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 font-serif leading-tight">
          {data.examTitle}
        </h1>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-serif pt-1">
          {data.schoolNameKannada}
        </h2>

        {data.showClusterLine && (
          <div className="text-lg font-bold text-slate-900 font-serif">{data.clusterName}</div>
        )}
      </div>

      {/* Heritage Footer */}
      <div className="flex items-center justify-between border-t border-slate-400 pt-2 px-4 text-xs font-bold text-slate-800">
        <span>ಡೈಸ್ ಸಂ: {data.udiseCode}</span>
        <span>ವರ್ಷ: {data.academicYear}</span>
      </div>
    </div>
  );
};

/* ============================================================================
   SVG GRAPHICS: CIRCULAR SCHOOL STAMP
   ============================================================================ */
interface CircularSchoolStampProps {
  schoolName: string;
  udiseCode: string;
  taluk?: string;
}

const CircularSchoolStamp: React.FC<CircularSchoolStampProps> = ({
  schoolName,
  udiseCode,
  taluk,
}) => {
  const arcId = useId();
  // Curving text along circle path
  const truncatedName =
    schoolName.length > 36 ? schoolName.substring(0, 34) + '..' : schoolName;
  const bottomText = taluk ? `★ ${taluk} ★` : '★ ಕರ್ನಾಟಕ ★';

  return (
    <svg
      viewBox="0 0 160 160"
      className="w-full h-full text-slate-900 select-none"
      style={{ overflow: 'visible' }}
    >
      {/* Outer Circle */}
      <circle cx="80" cy="80" r="76" fill="none" stroke="currentColor" strokeWidth="2.5" />
      {/* Inner Circle */}
      <circle cx="80" cy="80" r="71" fill="none" stroke="currentColor" strokeWidth="1.2" />

      {/* Innermost Core Circle */}
      <circle cx="80" cy="80" r="48" fill="none" stroke="currentColor" strokeWidth="1.5" />

      {/* Path for Top Text */}
      <defs>
        <path
          id={`stamp-arc-top-${arcId}`}
          d="M 18,80 A 62,62 0 1,1 142,80"
          fill="none"
        />
        <path
          id={`stamp-arc-bottom-${arcId}`}
          d="M 142,80 A 62,62 0 0,1 18,80"
          fill="none"
        />
      </defs>

      {/* Top Arc Text */}
      <text
        fontSize="8.5"
        fontWeight="bold"
        fill="currentColor"
        letterSpacing="0.2"
      >
        <textPath href={`#stamp-arc-top-${arcId}`} startOffset="50%" textAnchor="middle">
          ★ {truncatedName} ★
        </textPath>
      </text>

      {/* Bottom Arc Text */}
      <text
        fontSize="9"
        fontWeight="bold"
        fill="currentColor"
        letterSpacing="0.5"
      >
        <textPath href={`#stamp-arc-bottom-${arcId}`} startOffset="50%" textAnchor="middle">
          {bottomText}
        </textPath>
      </text>

      {/* Center DISE Code */}
      <text
        x="80"
        y="72"
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="currentColor"
        fontFamily="sans-serif"
      >
        ಡೈಸ್ ನಂ.
      </text>
      <text
        x="80"
        y="90"
        textAnchor="middle"
        fontSize="11"
        fontWeight="900"
        fill="currentColor"
        fontFamily="monospace"
        letterSpacing="0.5"
      >
        {udiseCode}
      </text>
    </svg>
  );
};

/* ============================================================================
   SVG GRAPHICS: KARNATAKA STATE EMBLEM (GANDABERUNDA)
   Authentic Vector Reproduction of the Government of Karnataka Seal
   ============================================================================ */
const KarnatakaStateEmblem: React.FC = () => {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full text-slate-900 select-none">
      <g fill="currentColor">
        {/* Ashoka Lion Capital at Top */}
        <path d="M 60,8 C 58,8 56,10 56,13 C 54,11 52,12 51,14 C 50,16 52,18 54,19 C 52,21 54,23 57,23 C 58,25 62,25 63,23 C 66,23 68,21 66,19 C 68,18 70,16 69,14 C 68,12 66,11 64,13 C 64,10 62,8 60,8 Z" />
        {/* Lion Base Wheel / Abacus */}
        <rect x="52" y="24" width="16" height="3" rx="1" />
        <circle cx="60" cy="25.5" r="1.2" fill="#ffffff" />

        {/* Central Shield / Crest Frame */}
        <path
          d="M 46,30 C 46,28 74,28 74,30 C 74,48 72,64 60,72 C 48,64 46,48 46,30 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* Gandaberunda (Two-Headed Mythological Bird) */}
        {/* Left Head & Beak */}
        <path d="M 57,36 C 55,34 51,34 49,37 C 48,39 50,42 53,41 C 55,42 57,40 57,36 Z" />
        <path d="M 49,37 L 46,38 L 49,40 Z" />
        <circle cx="53" cy="37.5" r="0.8" fill="#ffffff" />

        {/* Right Head & Beak */}
        <path d="M 63,36 C 65,34 69,34 71,37 C 72,39 70,42 67,41 C 65,42 63,40 63,36 Z" />
        <path d="M 71,37 L 74,38 L 71,40 Z" />
        <circle cx="67" cy="37.5" r="0.8" fill="#ffffff" />

        {/* Bird Body & Plumes */}
        <path d="M 57,40 C 54,44 54,54 60,58 C 66,54 66,44 63,40 Z" />
        {/* Outspread Wings */}
        <path d="M 54,42 C 49,42 47,48 48,52 C 50,54 53,50 54,47 Z" />
        <path d="M 66,42 C 71,42 73,48 72,52 C 70,54 67,50 66,47 Z" />
        {/* Tail Feathers */}
        <path d="M 58,58 L 56,66 L 60,63 L 64,66 L 62,58 Z" />

        {/* Flanking Sharabhas (Mythical Winged Lion Guardians) */}
        {/* Left Sharabha */}
        <path d="M 44,38 C 40,36 36,40 37,45 C 38,48 41,50 43,48 C 41,54 43,62 46,65 C 44,60 44,52 45,46 Z" />
        <path d="M 37,45 C 34,45 32,49 33,53 C 35,55 38,53 38,48 Z" />
        <path d="M 40,56 C 37,60 38,68 44,70 C 43,66 42,62 43,58 Z" />

        {/* Right Sharabha */}
        <path d="M 76,38 C 80,36 84,40 83,45 C 82,48 79,50 77,48 C 79,54 77,62 74,65 C 76,60 76,52 75,46 Z" />
        <path d="M 83,45 C 86,45 88,49 87,53 C 85,55 82,53 82,48 Z" />
        <path d="M 80,56 C 83,60 82,68 76,70 C 77,66 78,62 77,58 Z" />

        {/* Bottom Motto Scroll Banner: ಸತ್ಯಮೇವ ಜಯತೇ */}
        <path
          d="M 34,75 C 48,72 72,72 86,75 L 88,80 C 72,77 48,77 32,80 Z"
          fill="currentColor"
        />
        <text
          x="60"
          y="78.5"
          textAnchor="middle"
          fontSize="4"
          fontWeight="bold"
          fill="#ffffff"
          letterSpacing="0.2"
        >
          ಸತ್ಯಮೇವ ಜಯತೇ
        </text>
      </g>
    </svg>
  );
};

/* ============================================================================
   SVG GRAPHICS: CORNER ORNAMENTS & TRADITIONAL NAMASTE FIGURES
   ============================================================================ */

/**
 * Top-Left Classical Scroll Ornament
 */
const TopLeftScrollCorner: React.FC = () => (
  <svg viewBox="0 0 80 80" className="w-full h-full text-slate-900 fill-none stroke-current">
    <path
      d="M 4,4 L 40,4 C 28,8 20,16 16,28 C 12,18 8,10 4,4 Z"
      fill="currentColor"
      stroke="none"
    />
    <path d="M 4,4 L 4,40 C 8,28 16,20 28,16 C 18,12 10,8 4,4 Z" fill="currentColor" stroke="none" />
    <path
      d="M 8,8 C 16,2 30,2 45,6 C 32,10 24,18 20,32 C 14,24 10,16 8,8 Z"
      strokeWidth="1.2"
    />
    <circle cx="28" cy="28" r="3" fill="currentColor" stroke="none" />
    <path d="M 12,48 C 16,36 28,26 48,22" strokeWidth="1.2" />
    <path d="M 48,12 C 36,16 26,28 22,48" strokeWidth="1.2" />
  </svg>
);

/**
 * Top-Right Classical Scroll Ornament
 */
const TopRightScrollCorner: React.FC = () => (
  <svg viewBox="0 0 80 80" className="w-full h-full text-slate-900 fill-none stroke-current">
    <g transform="translate(80, 0) scale(-1, 1)">
      <path
        d="M 4,4 L 40,4 C 28,8 20,16 16,28 C 12,18 8,10 4,4 Z"
        fill="currentColor"
        stroke="none"
      />
      <path
        d="M 4,4 L 4,40 C 8,28 16,20 28,16 C 18,12 10,8 4,4 Z"
        fill="currentColor"
        stroke="none"
      />
      <path
        d="M 8,8 C 16,2 30,2 45,6 C 32,10 24,18 20,32 C 14,24 10,16 8,8 Z"
        strokeWidth="1.2"
      />
      <circle cx="28" cy="28" r="3" fill="currentColor" stroke="none" />
      <path d="M 12,48 C 16,36 28,26 48,22" strokeWidth="1.2" />
      <path d="M 48,12 C 36,16 26,28 22,48" strokeWidth="1.2" />
    </g>
  </svg>
);

/**
 * Bottom-Left Traditional Namaste Greeting Woman Figure
 * Matching the exact line art from reference image
 */
const NamasteWomanLeft: React.FC = () => (
  <svg
    viewBox="0 0 100 120"
    className="w-full h-full text-slate-950 fill-none stroke-current"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Head Profile & Saree Pallu Drapery */}
    <path d="M 28,28 C 30,20 38,15 48,16 C 56,17 62,24 62,32 C 60,42 50,46 44,48" />
    {/* Forehead, Nose & Lips Facing Inward (Right) */}
    <path d="M 48,22 C 51,23 54,26 55,30 L 59,33 L 55,36 C 54,38 52,39 50,40" />
    {/* Eye with Bindi */}
    <path d="M 47,27 C 49,27 51,29 50,31 C 48,31 46,29 47,27 Z" fill="currentColor" />
    <circle cx="51" cy="24" r="1.2" fill="currentColor" />

    {/* Saree Drape around Head & Neck */}
    <path d="M 38,18 C 24,24 18,40 18,60 C 18,80 24,96 32,110" />
    <path d="M 28,42 C 28,60 32,80 38,98" strokeDasharray="3,2" />

    {/* Folded Hands in Namaste (Anjali Mudra) Facing Inward */}
    <path d="M 44,52 C 50,56 60,56 68,52 L 76,46 C 78,44 82,46 80,50 L 72,62 C 68,66 60,68 54,66" />
    <path d="M 48,56 C 54,60 62,60 70,56 L 78,50" />
    {/* Fingers */}
    <path d="M 76,46 C 80,43 84,46 82,49 L 75,56" />
    <path d="M 78,50 C 82,48 85,51 83,54 L 77,60" />

    {/* Bangles on Wrists */}
    <path d="M 48,54 L 46,62" strokeWidth="2.5" />
    <path d="M 52,56 L 50,64" strokeWidth="2.5" />

    {/* Saree & Torso Downward Line */}
    <path d="M 42,66 C 46,80 50,96 52,112" />
  </svg>
);

/**
 * Bottom-Right Traditional Namaste Greeting Woman Figure
 * Mirrored to face towards the center
 */
const NamasteWomanRight: React.FC = () => (
  <svg
    viewBox="0 0 100 120"
    className="w-full h-full text-slate-950 fill-none stroke-current"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <g transform="translate(100, 0) scale(-1, 1)">
      {/* Head Profile & Saree Pallu Drapery */}
      <path d="M 28,28 C 30,20 38,15 48,16 C 56,17 62,24 62,32 C 60,42 50,46 44,48" />
      {/* Forehead, Nose & Lips Facing Inward */}
      <path d="M 48,22 C 51,23 54,26 55,30 L 59,33 L 55,36 C 54,38 52,39 50,40" />
      {/* Eye with Bindi */}
      <path d="M 47,27 C 49,27 51,29 50,31 C 48,31 46,29 47,27 Z" fill="currentColor" />
      <circle cx="51" cy="24" r="1.2" fill="currentColor" />

      {/* Saree Drape around Head & Neck */}
      <path d="M 38,18 C 24,24 18,40 18,60 C 18,80 24,96 32,110" />
      <path d="M 28,42 C 28,60 32,80 38,98" strokeDasharray="3,2" />

      {/* Folded Hands in Namaste (Anjali Mudra) Facing Inward */}
      <path d="M 44,52 C 50,56 60,56 68,52 L 76,46 C 78,44 82,46 80,50 L 72,62 C 68,66 60,68 54,66" />
      <path d="M 48,56 C 54,60 62,60 70,56 L 78,50" />
      {/* Fingers */}
      <path d="M 76,46 C 80,43 84,46 82,49 L 75,56" />
      <path d="M 78,50 C 82,48 85,51 83,54 L 77,60" />

      {/* Bangles on Wrists */}
      <path d="M 48,54 L 46,62" strokeWidth="2.5" />
      <path d="M 52,56 L 50,64" strokeWidth="2.5" />

      {/* Saree & Torso Downward Line */}
      <path d="M 42,66 C 46,80 50,96 52,112" />
    </g>
  </svg>
);
