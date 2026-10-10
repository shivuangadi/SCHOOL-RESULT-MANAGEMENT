/**
 * Consolidation Reports Section & Broadsheet Analysis
 * 1. Subject-wise Grade-wise (A+, A, B+, B, C) for each class & overall school
 * 2. Category-wise Passing (SC, ST, MUSLIM, OTHERS, TOTAL)
 * Classes: Class 1 to 10 (dynamically adapted to school classes) + Overall School
 */

import React, { useState, useMemo, useRef } from 'react';
import { Student, StudentClass, SchoolRecord, getFormattedClassName, isCwsnStudent } from '../types';
import { getSubjectsForMediumAndClass } from '../data/subjectConfig';
import { calculateSubjectGrade, calculateGrade } from '../data/demoData';
import { getRealMarksFromLocal, getStudentCalculatedResult } from '../utils/marksStore';
import * as XLSX from 'xlsx';
import { openCleanPrintWindow, downloadElementAsPdf, shareReportToWhatsApp } from '../utils/printPdfHelper';
import {
  FileSpreadsheet,
  Award,
  Users,
  Printer,
  BookOpen,
  PieChart,
  CheckCircle2,
  Filter,
  Layers,
  Sparkles,
  ArrowLeft,
  Download,
  Share2,
} from 'lucide-react';

interface ConsolidationSectionProps {
  students: Student[];
  schoolRecord: SchoolRecord | null;
  onBackToHome?: () => void;
}

const ALL_CLASSES: StudentClass[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export const ConsolidationSection: React.FC<ConsolidationSectionProps> = ({
  students,
  schoolRecord,
  onBackToHome,
}) => {
  const printableRef = useRef<HTMLDivElement>(null);
  const diseCode = schoolRecord?.diseCode || '';
  const marksMap = getRealMarksFromLocal(diseCode);
  const medium = schoolRecord?.schoolMedium || 'Kannada';
  const talukName = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';

  // Determine which classes exist in this school (e.g. 1-5, 1-7, 1-8, 1-10)
  const schoolClasses = useMemo(() => {
    const present = new Set<string>();
    students.forEach((s) => present.add(s.classStandard));
    if (present.size === 0) {
      // Default to 1-8 if empty
      return ['1', '2', '3', '4', '5', '6', '7', '8'] as StudentClass[];
    }
    const maxClassNum = Math.max(...Array.from(present).map((c) => Number(c) || 1));
    const effectiveMax = Math.min(10, Math.max(5, maxClassNum));
    return ALL_CLASSES.slice(0, effectiveMax);
  }, [students]);

  // Selected tab: 'ALL' (Overall School) or class '1', '2', etc.
  const [selectedClassTab, setSelectedClassTab] = useState<'ALL' | StudentClass>('ALL');

  // Selected Sub-View: 'subjectGradewise' or 'categoryWise'
  const [consolidationView, setConsolidationView] = useState<'subjectGradewise' | 'categoryWise'>(
    'subjectGradewise'
  );

  // Compute calculated results for all students
  const calculatedResults = useMemo(() => {
    return students.map((s, idx) => getStudentCalculatedResult(s, medium, marksMap, idx + 1));
  }, [students, medium, marksMap]);

  // Filter students based on selected class tab
  const activeResults = useMemo(() => {
    if (selectedClassTab === 'ALL') {
      return calculatedResults;
    }
    return calculatedResults.filter((r) => r.student.classStandard === selectedClassTab);
  }, [calculatedResults, selectedClassTab]);

  // Available subjects for the selected class (or standard subjects if overall)
  const currentSubjects = useMemo(() => {
    const classNum = selectedClassTab === 'ALL' ? 5 : Number(selectedClassTab);
    return getSubjectsForMediumAndClass(medium, classNum);
  }, [medium, selectedClassTab]);

  // ----------------------------------------------------
  // 1. SUBJECT-WISE & GRADE-WISE CONSOLIDATION DATA
  // Ranges: A+ (90-100), A (70-89.99), B+ (50-69.99), B (30-49.99), C (0-29.99)
  // ----------------------------------------------------
  const subjectGradeConsolidation = useMemo(() => {
    return currentSubjects.map((sub, idx) => {
      let enrolled = 0;
      let appeared = 0;
      let countAPlus = 0; // 90 - 100
      let countA = 0;     // 70 - 89.99
      let countBPlus = 0; // 50 - 69.99
      let countB = 0;     // 30 - 49.99
      let countC = 0;     // 0 - 29.99

      activeResults.forEach((r) => {
        enrolled += 1;
        const sMark = r.subjects.find((s) => s.code === sub.code);
        const hasEntered =
          sMark &&
          (sMark.fa1 !== null ||
            sMark.fa2 !== null ||
            sMark.sa1 !== null ||
            sMark.fa3 !== null ||
            sMark.fa4 !== null ||
            sMark.sa2 !== null ||
            sMark.total > 0);

        if (hasEntered && sMark) {
          appeared += 1;
          const marks = sMark.total;
          const maxMarks = sMark.maxMarks || sub.maxMarks;
          const grade = calculateSubjectGrade(marks, maxMarks);

          if (grade === 'A+') countAPlus += 1;
          else if (grade === 'A') countA += 1;
          else if (grade === 'B+') countBPlus += 1;
          else if (grade === 'B') countB += 1;
          else countC += 1;
        }
      });

      const passed = countAPlus + countA + countBPlus + countB;
      const passPercent = appeared > 0 ? Number(((passed / appeared) * 100).toFixed(1)) : 0;

      return {
        slNo: idx + 1,
        code: sub.code,
        name: sub.kannadaName,
        subjectNameEn: sub.subjectName,
        maxMarks: sub.maxMarks,
        enrolled,
        appeared,
        countAPlus,
        countA,
        countBPlus,
        countB,
        countC,
        passed,
        passPercent,
      };
    });
  }, [currentSubjects, activeResults]);

  // ----------------------------------------------------
  // 2. PASSING CATEGORY-WISE CONSOLIDATION DATA
  // SC, ST, MUSLIM, OTHERS, TOTAL
  // ----------------------------------------------------
  const categoryPassingConsolidation = useMemo(() => {
    const categories: Array<{ key: 'SC' | 'ST' | 'MUSLIM' | 'OTHERS'; label: string; labelEn: string }> = [
      { key: 'SC', label: 'ಪರಿಶಿಷ್ಟ ಜಾತಿ (SC)', labelEn: 'SC' },
      { key: 'ST', label: 'ಪರಿಶಿಷ್ಟ ಪಂಗಡ (ST)', labelEn: 'ST' },
      { key: 'MUSLIM', label: 'ಮುಸ್ಲಿಂ (Muslim / 2B)', labelEn: 'MUSLIM' },
      { key: 'OTHERS', label: 'ಇತರ ವರ್ಗಗಳು (Others - OBC/GM)', labelEn: 'OTHERS' },
    ];

    const matchCategory = (caste?: string, rel?: string): 'SC' | 'ST' | 'MUSLIM' | 'OTHERS' => {
      const c = (caste || '').toUpperCase().trim();
      const r = (rel || '').toUpperCase().trim();
      if (c === 'SC') return 'SC';
      if (c === 'ST') return 'ST';
      if (c === '2B' || c === 'MUSLIM' || r === 'MUSLIM') return 'MUSLIM';
      return 'OTHERS';
    };

    const rows = categories.map((cat) => {
      const catResults = activeResults.filter((r) => {
        const studentCat = matchCategory(r.student.caste, (r.student as any).religion);
        return studentCat === cat.key;
      });

      const enrolledBoys = catResults.filter((r) => r.student.gender === 'Boy' || !r.student.gender).length;
      const enrolledGirls = catResults.filter((r) => r.student.gender === 'Girl').length;
      const enrolledTotal = enrolledBoys + enrolledGirls;

      const appearedBoys = enrolledBoys;
      const appearedGirls = enrolledGirls;
      const appearedTotal = enrolledTotal;

      const passedResults = catResults.filter(
        (r) => r.resultStatus === 'PROMOTED' || (r as any).isExempted || isCwsnStudent(r.student.cwsnStatus)
      );
      const passedBoys = passedResults.filter((r) => r.student.gender === 'Boy' || !r.student.gender).length;
      const passedGirls = passedResults.filter((r) => r.student.gender === 'Girl').length;
      const passedTotal = passedBoys + passedGirls;

      const failedBoys = appearedBoys - passedBoys;
      const failedGirls = appearedGirls - passedGirls;
      const failedTotal = appearedTotal - passedTotal;

      const passPercentBoys = appearedBoys > 0 ? Number(((passedBoys / appearedBoys) * 100).toFixed(1)) : 0;
      const passPercentGirls = appearedGirls > 0 ? Number(((passedGirls / appearedGirls) * 100).toFixed(1)) : 0;
      const passPercentTotal = appearedTotal > 0 ? Number(((passedTotal / appearedTotal) * 100).toFixed(1)) : 0;

      return {
        ...cat,
        enrolledBoys,
        enrolledGirls,
        enrolledTotal,
        appearedBoys,
        appearedGirls,
        appearedTotal,
        passedBoys,
        passedGirls,
        passedTotal,
        failedBoys,
        failedGirls,
        failedTotal,
        passPercentBoys,
        passPercentGirls,
        passPercentTotal,
      };
    });

    // Grand Totals across all categories
    const totalEnrolledBoys = rows.reduce((s, r) => s + r.enrolledBoys, 0);
    const totalEnrolledGirls = rows.reduce((s, r) => s + r.enrolledGirls, 0);
    const totalEnrolled = totalEnrolledBoys + totalEnrolledGirls;

    const totalAppearedBoys = rows.reduce((s, r) => s + r.appearedBoys, 0);
    const totalAppearedGirls = rows.reduce((s, r) => s + r.appearedGirls, 0);
    const totalAppeared = totalAppearedBoys + totalAppearedGirls;

    const totalPassedBoys = rows.reduce((s, r) => s + r.passedBoys, 0);
    const totalPassedGirls = rows.reduce((s, r) => s + r.passedGirls, 0);
    const totalPassed = totalPassedBoys + totalPassedGirls;

    const totalFailedBoys = totalAppearedBoys - totalPassedBoys;
    const totalFailedGirls = totalAppearedGirls - totalPassedGirls;
    const totalFailed = totalAppeared - totalPassed;

    const grandPassPercentBoys = totalAppearedBoys > 0 ? Number(((totalPassedBoys / totalAppearedBoys) * 100).toFixed(1)) : 0;
    const grandPassPercentGirls = totalAppearedGirls > 0 ? Number(((totalPassedGirls / totalAppearedGirls) * 100).toFixed(1)) : 0;
    const grandPassPercent = totalAppeared > 0 ? Number(((totalPassed / totalAppeared) * 100).toFixed(1)) : 0;

    return {
      rows,
      totals: {
        enrolledBoys: totalEnrolledBoys,
        enrolledGirls: totalEnrolledGirls,
        enrolledTotal: totalEnrolled,
        appearedBoys: totalAppearedBoys,
        appearedGirls: totalAppearedGirls,
        appearedTotal: totalAppeared,
        passedBoys: totalPassedBoys,
        passedGirls: totalPassedGirls,
        passedTotal: totalPassed,
        failedBoys: totalFailedBoys,
        failedGirls: totalFailedGirls,
        failedTotal: totalFailed,
        passPercentBoys: grandPassPercentBoys,
        passPercentGirls: grandPassPercentGirls,
        passPercentTotal: grandPassPercent,
      },
    };
  }, [activeResults]);

  const activeClassLabel =
    selectedClassTab === 'ALL'
      ? (medium === 'Kannada' ? 'ಸಮಗ್ರ ಶಾಲೆ (Overall School)' : 'Overall School')
      : getFormattedClassName(selectedClassTab, medium);

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSharingWa, setIsSharingWa] = useState(false);

  const handlePrint = () => {
    if (printableRef.current) {
      openCleanPrintWindow(printableRef.current, `Consolidation Report - ${activeClassLabel} - ${schoolRecord?.schoolName}`);
    } else {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    if (printableRef.current) {
      setIsExportingPdf(true);
      try {
        await downloadElementAsPdf(
          printableRef.current,
          `Consolidation_${activeClassLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${diseCode}.pdf`
        );
      } finally {
        setIsExportingPdf(false);
      }
    }
  };

  const handleWhatsAppShare = async () => {
    if (printableRef.current) {
      setIsSharingWa(true);
      try {
        const summary = `*ಕ್ರೋಢೀಕರಣ ವರದಿ (Consolidation Report)*\n🏫 ಶಾಲೆ: ${schoolRecord?.schoolName || 'Govt School'}\n📍 ತಾಲೂಕು: ${talukName} (DISE: ${diseCode})\n📚 ತರಗತಿ: ${activeClassLabel}\n👥 ಒಟ್ಟು ದಾಖಲಾತಿ: ${categoryPassingConsolidation.totals.enrolledTotal}\n✅ ಉತ್ತೀರ್ಣ ಶೇಕಡಾವಾರು: ${categoryPassingConsolidation.totals.passPercentTotal}%`;
        await shareReportToWhatsApp(
          printableRef.current,
          summary,
          `Consolidation_${activeClassLabel.replace(/[^a-zA-Z0-9]/g, '_')}`
        );
      } finally {
        setIsSharingWa(false);
      }
    }
  };

  const handleExportToExcel = () => {
    try {
      if (consolidationView === 'subjectGradewise') {
        const rows = subjectGradeConsolidation.map((r) => ({
          'Sl. No': r.slNo,
          'Subject (ಕನ್ನಡ)': r.name,
          'Subject (English)': r.subjectNameEn,
          'Enrolled (ದಾಖಲಾತಿ)': r.enrolled,
          'Appeared (ಹಾಜರಾದವರು)': r.appeared,
          'A+ (90-100%)': r.countAPlus,
          'A (70-89.99%)': r.countA,
          'B+ (50-69.99%)': r.countBPlus,
          'B (30-49.99%)': r.countB,
          'C (0-29.99%)': r.countC,
          'Passed (ಉತ್ತೀರ್ಣ)': r.passed,
          'Pass %': `${r.passPercent}%`,
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Subject-Grade Consolidation');
        XLSX.writeFile(wb, `Consolidation_${activeClassLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${diseCode}.xlsx`);
      } else {
        const rows = categoryPassingConsolidation.rows.map((r, idx) => ({
          'Sl. No': idx + 1,
          'Category (ಜಾತಿ/ವರ್ಗ)': r.label,
          'Category (English)': r.labelEn,
          'Enrolled Boys': r.enrolledBoys,
          'Enrolled Girls': r.enrolledGirls,
          'Enrolled Total': r.enrolledTotal,
          'Appeared Boys': r.appearedBoys,
          'Appeared Girls': r.appearedGirls,
          'Appeared Total': r.appearedTotal,
          'Passed Boys': r.passedBoys,
          'Passed Girls': r.passedGirls,
          'Passed Total': r.passedTotal,
          'Failed Total': r.failedTotal,
          'Pass % Total': `${r.passPercentTotal}%`,
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Category Consolidation');
        XLSX.writeFile(wb, `Category_Consolidation_${activeClassLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${diseCode}.xlsx`);
      }
    } catch (err) {
      console.error('Export Excel error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="mr-1 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                title="Return to Home Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <span className="p-2 bg-purple-100 text-purple-900 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 font-serif">
              {medium === 'Kannada'
                ? 'ವಾರ್ಷಿಕ CCE ಫಲಿತಾಂಶ ಕ್ರೋಢೀಕರಣ ವಿಶ್ಲೇಷಣೆ (Consolidation Report)'
                : 'Annual CCE Result Consolidation Report'}
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            {schoolRecord?.schoolName} • DISE: {diseCode} • ತಾಲೂಕು: {talukName} • ಶೈಕ್ಷಣಿಕ ಸಾಲು: 2025-26
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <button
            type="button"
            onClick={handleExportToExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            title="Download PDF in Legal Paper Size"
          >
            <Download className={`w-4 h-4 ${isExportingPdf ? 'animate-bounce' : ''}`} />
            <span>{isExportingPdf ? 'PDF...' : 'PDF (Legal)'}</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            disabled={isSharingWa}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            title="Share report photo to WhatsApp"
          >
            <Share2 className={`w-4 h-4 ${isSharingWa ? 'animate-spin' : ''}`} />
            <span>{isSharingWa ? 'Sharing...' : 'WhatsApp'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            title="Print in Legal Paper Size"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print</span>
          </button>

          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <span>Dashboard</span>
            </button>
          )}
        </div>
      </div>

      {/* Class Switcher Tabs (Adapted for Class 1 to 5, 1 to 7, 1 to 8, or 1 to 10) */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="font-extrabold text-slate-700 mr-2 flex items-center gap-1 shrink-0">
          <Layers className="w-4 h-4 text-blue-900" />
          <span>{medium === 'Kannada' ? 'ತರಗತಿ ಆಯ್ಕೆ:' : 'Select Class:'}</span>
        </span>

        {/* Tab 0: Overall School */}
        <button
          onClick={() => setSelectedClassTab('ALL')}
          className={`px-4 py-2 rounded-xl font-black transition whitespace-nowrap cursor-pointer ${
            selectedClassTab === 'ALL'
              ? 'bg-blue-950 text-white shadow-sm ring-2 ring-blue-900'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {medium === 'Kannada' ? '★ ಸಮಗ್ರ ಶಾಲೆ (Overall School)' : '★ Overall School'}
        </button>

        {/* Class Specific Tabs */}
        {schoolClasses.map((cls) => {
          const count = students.filter((s) => s.classStandard === cls).length;
          return (
            <button
              key={cls}
              onClick={() => setSelectedClassTab(cls)}
              className={`px-3.5 py-2 rounded-xl font-black transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedClassTab === cls
                  ? 'bg-blue-950 text-white shadow-sm ring-2 ring-blue-900'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{getFormattedClassName(cls, medium)}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedClassTab === cls ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Two Main Consolidation Modes Tabs */}
      <div className="flex border-b-2 border-slate-200 gap-3">
        <button
          onClick={() => setConsolidationView('subjectGradewise')}
          className={`pb-3 px-4 font-black text-sm sm:text-base flex items-center gap-2 border-b-4 transition cursor-pointer ${
            consolidationView === 'subjectGradewise'
              ? 'border-blue-950 text-blue-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-5 h-5 text-amber-500" />
          <span>1. ವಿಷಯವಾರು ಹಾಗೂ ಗ್ರೇಡ್‌ವಾರು ಕ್ರೋಢೀಕರಣ (Subject-wise & Grade-wise)</span>
        </button>

        <button
          onClick={() => setConsolidationView('categoryWise')}
          className={`pb-3 px-4 font-black text-sm sm:text-base flex items-center gap-2 border-b-4 transition cursor-pointer ${
            consolidationView === 'categoryWise'
              ? 'border-blue-950 text-blue-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5 text-emerald-600" />
          <span>2. ಜಾತಿ / ವರ್ಗವಾರು ಫಲಿತಾಂಶ ಕ್ರೋಢೀಕರಣ (Passing Category-wise)</span>
        </button>
      </div>

      {/* PRINTABLE REPORT CONTAINER */}
      <div ref={printableRef} className="space-y-6 print:m-0 print:p-0">
        {/* VIEW 1: SUBJECT-WISE & GRADE-WISE CONSOLIDATION */}
        {consolidationView === 'subjectGradewise' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {medium === 'Kannada'
                    ? `ವಿಷಯವಾರು ಗ್ರೇಡ್‌ಗಳ ವಿಶ್ಲೇಷಣೆ - ${activeClassLabel}`
                    : `Subject-wise & Grade-wise Analysis - ${activeClassLabel}`}
                </h3>
                <p className="text-xs text-slate-500">
                  Grading Scale: A+ (90-100%) • A (70-89.99%) • B+ (50-69.99%) • B (30-49.99%) • C (0-29.99%)
                </p>
              </div>
              <div className="px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold font-mono">
                Total Enrolled: {activeResults.length}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse border border-slate-300 text-xs">
                <thead className="bg-slate-100 font-black text-slate-900 uppercase tracking-wider text-[11px]">
                  <tr className="border-b border-slate-300">
                    <th className="border-r border-slate-300 p-2.5 text-left w-10">#</th>
                    <th className="border-r border-slate-300 p-2.5 text-left">ವಿಷಯದ ಹೆಸರು (Subject)</th>
                    <th className="border-r border-slate-300 p-2.5 bg-slate-50 w-20">ದಾಖಲಾತಿ</th>
                    <th className="border-r border-slate-300 p-2.5 bg-slate-50 w-20">ಹಾಜರಾದವರು</th>
                    <th className="border-r border-slate-300 p-2.5 bg-emerald-100 text-emerald-950 font-black w-24">
                      A+ (90-100%)
                    </th>
                    <th className="border-r border-slate-300 p-2.5 bg-emerald-50 text-emerald-900 font-black w-24">
                      A (70-89.99%)
                    </th>
                    <th className="border-r border-slate-300 p-2.5 bg-blue-100 text-blue-950 font-black w-24">
                      B+ (50-69.99%)
                    </th>
                    <th className="border-r border-slate-300 p-2.5 bg-blue-50 text-blue-900 font-black w-24">
                      B (30-49.99%)
                    </th>
                    <th className="border-r border-slate-300 p-2.5 bg-amber-50 text-amber-900 font-black w-24">
                      C (0-29.99%)
                    </th>
                    <th className="border-r border-slate-300 p-2.5 bg-purple-50 text-purple-950 font-black w-24">
                      ಒಟ್ಟು ತೇರ್ಗಡೆ
                    </th>
                    <th className="p-2.5 bg-purple-100 text-purple-950 font-black w-24">ತೇರ್ಗಡೆ %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-xs">
                  {subjectGradeConsolidation.map((row) => (
                    <tr key={row.code} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 text-left text-slate-500 font-sans border-r border-slate-200">
                        {row.slNo}
                      </td>
                      <td className="p-2.5 text-left font-sans font-bold text-slate-900 border-r border-slate-200">
                        <span>{row.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          ({row.subjectNameEn})
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-slate-700 font-bold">
                        {row.enrolled}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-slate-700 font-bold">
                        {row.appeared}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 font-black text-emerald-800 bg-emerald-50/30">
                        {row.countAPlus}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 font-black text-emerald-700 bg-emerald-50/20">
                        {row.countA}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 font-black text-blue-800 bg-blue-50/30">
                        {row.countBPlus}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 font-black text-blue-700 bg-blue-50/20">
                        {row.countB}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 font-black text-amber-800 bg-amber-50/30">
                        {row.countC}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 font-black text-purple-950 bg-purple-50/40">
                        {row.passed}
                      </td>
                      <td className="p-2.5 font-black text-purple-950 bg-purple-100/50">
                        {row.passPercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-mono text-xs font-black border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={2} className="p-2.5 text-center font-sans border-r border-slate-300">
                      ಒಟ್ಟು ಸರಾಸರಿ / ಸಮಗ್ರ (Overall Total)
                    </td>
                    <td className="p-2.5 border-r border-slate-300">
                      {subjectGradeConsolidation.reduce((a, b) => a + b.enrolled, 0)}
                    </td>
                    <td className="p-2.5 border-r border-slate-300">
                      {subjectGradeConsolidation.reduce((a, b) => a + b.appeared, 0)}
                    </td>
                    <td className="p-2.5 border-r border-slate-300 text-emerald-800 bg-emerald-50">
                      {subjectGradeConsolidation.reduce((a, b) => a + b.countAPlus, 0)}
                    </td>
                    <td className="p-2.5 border-r border-slate-300 text-emerald-700 bg-emerald-50/50">
                      {subjectGradeConsolidation.reduce((a, b) => a + b.countA, 0)}
                    </td>
                    <td className="p-2.5 border-r border-slate-300 text-blue-800 bg-blue-50">
                      {subjectGradeConsolidation.reduce((a, b) => a + b.countBPlus, 0)}
                    </td>
                    <td className="p-2.5 border-r border-slate-300 text-blue-700 bg-blue-50/50">
                      {subjectGradeConsolidation.reduce((a, b) => a + b.countB, 0)}
                    </td>
                    <td className="p-2.5 border-r border-slate-300 text-amber-800 bg-amber-50">
                      {subjectGradeConsolidation.reduce((a, b) => a + b.countC, 0)}
                    </td>
                    <td className="p-2.5 border-r border-slate-300 text-purple-950 bg-purple-50">
                      {subjectGradeConsolidation.reduce((a, b) => a + b.passed, 0)}
                    </td>
                    <td className="p-2.5 text-purple-950 bg-purple-100">
                      {(() => {
                        const totApp = subjectGradeConsolidation.reduce((a, b) => a + b.appeared, 0);
                        const totPass = subjectGradeConsolidation.reduce((a, b) => a + b.passed, 0);
                        return totApp > 0 ? (totPass / totApp * 100).toFixed(1) : 0;
                      })()}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 2: PASSING CATEGORY-WISE CONSOLIDATION (SC, ST, MUSLIM, OTHERS, TOTAL) */}
        {consolidationView === 'categoryWise' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {medium === 'Kannada'
                    ? `ಜಾತಿ / ಪ್ರವರ್ಗವಾರು ಫಲಿತಾಂಶ ಕ್ರೋಢೀಕರಣ - ${activeClassLabel}`
                    : `Category-wise Passing Results - ${activeClassLabel}`}
                </h3>
                <p className="text-xs text-slate-500">
                  Categories: SC, ST, MUSLIM (2B), OTHERS (Cat-1/2A/3A/3B/GM), and TOTAL
                </p>
              </div>
              <div className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold font-mono">
                Total Enrolled: {categoryPassingConsolidation.totals.enrolledTotal}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse border border-slate-300 text-xs">
                <thead className="bg-slate-100 font-black text-slate-900 uppercase tracking-wider text-[11px]">
                  <tr className="border-b border-slate-300">
                    <th rowSpan={2} className="border-r border-slate-300 p-2.5 text-left w-48">
                      ಜಾತಿ / ವರ್ಗ (Category)
                    </th>
                    <th colSpan={3} className="border-r border-slate-300 p-1.5 bg-blue-50 text-blue-950">
                      ದಾಖಲಾತಿ (Enrolled)
                    </th>
                    <th colSpan={3} className="border-r border-slate-300 p-1.5 bg-amber-50 text-amber-950">
                      ಹಾಜರಾದವರು (Appeared)
                    </th>
                    <th colSpan={3} className="border-r border-slate-300 p-1.5 bg-emerald-50 text-emerald-950">
                      ತೇರ್ಗಡೆ (Passed)
                    </th>
                    <th colSpan={3} className="border-r border-slate-300 p-1.5 bg-rose-50 text-rose-950">
                      ಅನುತ್ತೀರ್ಣ (Failed)
                    </th>
                    <th colSpan={3} className="p-1.5 bg-purple-100 text-purple-950">
                      ಫಲಿತಾಂಶ % (Pass %)
                    </th>
                  </tr>
                  <tr className="border-b border-slate-300 text-[10px]">
                    {/* Enrolled */}
                    <th className="border-r border-slate-300 py-1 px-2 bg-blue-50/50">ಗಂಡು</th>
                    <th className="border-r border-slate-300 py-1 px-2 bg-blue-50/50">ಹೆಣ್ಣು</th>
                    <th className="border-r border-slate-300 py-1 px-2 bg-blue-100 font-black">ಒಟ್ಟು</th>
                    {/* Appeared */}
                    <th className="border-r border-slate-300 py-1 px-2 bg-amber-50/50">ಗಂಡು</th>
                    <th className="border-r border-slate-300 py-1 px-2 bg-amber-50/50">ಹೆಣ್ಣು</th>
                    <th className="border-r border-slate-300 py-1 px-2 bg-amber-100 font-black">ಒಟ್ಟು</th>
                    {/* Passed */}
                    <th className="border-r border-slate-300 py-1 px-2 bg-emerald-50/50">ಗಂಡು</th>
                    <th className="border-r border-slate-300 py-1 px-2 bg-emerald-50/50">ಹೆಣ್ಣು</th>
                    <th className="border-r border-slate-300 py-1 px-2 bg-emerald-100 font-black">ಒಟ್ಟು</th>
                    {/* Failed */}
                    <th className="border-r border-slate-300 py-1 px-2 bg-rose-50/50">ಗಂಡು</th>
                    <th className="border-r border-slate-300 py-1 px-2 bg-rose-50/50">ಹೆಣ್ಣು</th>
                    <th className="border-r border-slate-300 py-1 px-2 bg-rose-100 font-black">ಒಟ್ಟು</th>
                    {/* Pass % */}
                    <th className="border-r border-slate-300 py-1 px-2 bg-purple-50">ಗಂಡು</th>
                    <th className="border-r border-slate-300 py-1 px-2 bg-purple-50">ಹೆಣ್ಣು</th>
                    <th className="py-1 px-2 bg-purple-200 font-black text-purple-950">ಒಟ್ಟು</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-xs">
                  {categoryPassingConsolidation.rows.map((row) => (
                    <tr key={row.key} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 text-left font-sans font-black text-slate-900 border-r border-slate-200">
                        {row.label}
                      </td>
                      {/* Enrolled */}
                      <td className="p-2 border-r border-slate-200">{row.enrolledBoys}</td>
                      <td className="p-2 border-r border-slate-200">{row.enrolledGirls}</td>
                      <td className="p-2 border-r border-slate-200 font-bold bg-blue-50/30">{row.enrolledTotal}</td>
                      {/* Appeared */}
                      <td className="p-2 border-r border-slate-200">{row.appearedBoys}</td>
                      <td className="p-2 border-r border-slate-200">{row.appearedGirls}</td>
                      <td className="p-2 border-r border-slate-200 font-bold bg-amber-50/30">{row.appearedTotal}</td>
                      {/* Passed */}
                      <td className="p-2 border-r border-slate-200 text-emerald-800 font-semibold">{row.passedBoys}</td>
                      <td className="p-2 border-r border-slate-200 text-emerald-800 font-semibold">{row.passedGirls}</td>
                      <td className="p-2 border-r border-slate-200 font-black text-emerald-950 bg-emerald-50/40">{row.passedTotal}</td>
                      {/* Failed */}
                      <td className="p-2 border-r border-slate-200 text-rose-700">{row.failedBoys}</td>
                      <td className="p-2 border-r border-slate-200 text-rose-700">{row.failedGirls}</td>
                      <td className="p-2 border-r border-slate-200 font-black text-rose-950 bg-rose-50/40">{row.failedTotal}</td>
                      {/* Pass % */}
                      <td className="p-2 border-r border-slate-200 font-semibold">{row.passPercentBoys}%</td>
                      <td className="p-2 border-r border-slate-200 font-semibold">{row.passPercentGirls}%</td>
                      <td className="p-2 font-black text-purple-950 bg-purple-100/50">{row.passPercentTotal}%</td>
                    </tr>
                  ))}
                </tbody>
                {/* GRAND TOTAL ROW */}
                <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-mono text-xs font-black text-slate-950">
                  <tr>
                    <td className="p-3 text-left font-sans text-sm font-black border-r border-slate-300">
                      ಒಟ್ಟು ಮೊತ್ತ (GRAND TOTAL):
                    </td>
                    {/* Enrolled */}
                    <td className="p-2 border-r border-slate-300">{categoryPassingConsolidation.totals.enrolledBoys}</td>
                    <td className="p-2 border-r border-slate-300">{categoryPassingConsolidation.totals.enrolledGirls}</td>
                    <td className="p-2 border-r border-slate-300 bg-blue-100">{categoryPassingConsolidation.totals.enrolledTotal}</td>
                    {/* Appeared */}
                    <td className="p-2 border-r border-slate-300">{categoryPassingConsolidation.totals.appearedBoys}</td>
                    <td className="p-2 border-r border-slate-300">{categoryPassingConsolidation.totals.appearedGirls}</td>
                    <td className="p-2 border-r border-slate-300 bg-amber-100">{categoryPassingConsolidation.totals.appearedTotal}</td>
                    {/* Passed */}
                    <td className="p-2 border-r border-slate-300 text-emerald-950">{categoryPassingConsolidation.totals.passedBoys}</td>
                    <td className="p-2 border-r border-slate-300 text-emerald-950">{categoryPassingConsolidation.totals.passedGirls}</td>
                    <td className="p-2 border-r border-slate-300 bg-emerald-200 text-emerald-950 font-black">{categoryPassingConsolidation.totals.passedTotal}</td>
                    {/* Failed */}
                    <td className="p-2 border-r border-slate-300 text-rose-950">{categoryPassingConsolidation.totals.failedBoys}</td>
                    <td className="p-2 border-r border-slate-300 text-rose-950">{categoryPassingConsolidation.totals.failedGirls}</td>
                    <td className="p-2 border-r border-slate-300 bg-rose-200 text-rose-950">{categoryPassingConsolidation.totals.failedTotal}</td>
                    {/* Pass % */}
                    <td className="p-2 border-r border-slate-300">{categoryPassingConsolidation.totals.passPercentBoys}%</td>
                    <td className="p-2 border-r border-slate-300">{categoryPassingConsolidation.totals.passPercentGirls}%</td>
                    <td className="p-2 bg-purple-200 text-purple-950 text-sm font-black">{categoryPassingConsolidation.totals.passPercentTotal}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
