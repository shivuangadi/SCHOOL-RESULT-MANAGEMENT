/**
 * CCE CONSOLIDATED REPORT (ಮರಾಠಿ ಮತ್ತು ಉರ್ದು ಮಾಧ್ಯಮ ಸಿಸಿಇ ಸಂಯೋಜಿತ ವರದಿ)
 * Classes 1 to 5 Annual Consolidation Sheet for:
 * • Marathi Medium Schools (First Language: Marathi)
 * • Urdu Medium Schools (First Language: Urdu)
 *
 * Designed according to KSEAB / DSERT specifications by Shri S R Angadi
 *
 * Subject Structure (5 Subjects x 100 Marks = 500 Maximum Marks):
 * 1. FIRST LANGUAGE: Marathi (for Marathi Med) / Urdu (for Urdu Med)
 * 2. SECOND LANGUAGE: Kannada
 * 3. THIRD LANGUAGE: English
 * 4. MATHEMATICS: Math
 * 5. EVS: Environmental Studies
 *
 * All Table Headings are strictly in ENGLISH.
 * Paper Size: Legal Landscape (@page { size: Legal landscape; })
 * Margins: Left 2cm, Right 1cm, Bottom 0.75mm, Top ~5mm
 * Clean, borderless header with dynamic Taluk, School Name, Academic Year
 * Class Teacher (Left) & No. of School Working Days (Right) immediately above table
 * Bottom Signatures (Class Teacher & Head Master) outside table without boxes
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Student,
  StudentClass,
  SchoolRecord,
  SchoolMedium,
  getFormattedClassName,
  isCwsnExempted,
} from '../types';
import { getClassesFromRange } from '../utils/studentStore';
import { getRealMarksFromLocal, getStudentCalculatedResult } from '../utils/marksStore';
import { ACADEMIC_YEARS } from './SchoolDashboard';
import { getSavedClassTeacher } from '../utils/teacherHelper';
import { executeReportPrint, downloadElementAsPdf, ReportPaperSize } from '../utils/printPdfHelper';
import { calculateGrade, calculateSubjectGrade } from '../data/demoData';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import {
  Printer,
  Download,
  X,
  FileSpreadsheet,
  Layers,
  Sparkles,
  CheckCircle2,
  Users,
  Search,
  BookOpen,
} from 'lucide-react';

interface CceConsolidatedReportMarathiUrduModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  isDemo?: boolean;
  onOpenPaymentModal?: () => void;
  onSwitchToKannadaEnglish?: () => void;
}

export const CceConsolidatedReportMarathiUrduModal: React.FC<CceConsolidatedReportMarathiUrduModalProps> = ({
  isOpen,
  onClose,
  students,
  schoolRecord,
  academicYear,
  isDemo = false,
  onOpenPaymentModal,
  onSwitchToKannadaEnglish,
}) => {
  const printableRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Automatically identify medium from School Profile.
  // If School Profile is Urdu, default to Urdu. If Marathi, default to Marathi.
  // Default to Marathi if not explicitly set to Urdu.
  const profileMedium = schoolRecord?.schoolMedium || 'Marathi';
  const initialMedium: 'Marathi' | 'Urdu' = profileMedium === 'Urdu' ? 'Urdu' : 'Marathi';
  const [activeMedium, setActiveMedium] = useState<'Marathi' | 'Urdu'>(initialMedium);

  // First Language title based on active medium
  const firstLangName = activeMedium === 'Marathi' ? 'Marathi' : 'Urdu';

  // Determine configured classes from School Profile, restricted strictly to Classes 1-5
  const availableClasses = useMemo(() => {
    const configured = getClassesFromRange(schoolRecord?.schoolRange);
    const primaryAllowed: StudentClass[] = ['1', '2', '3', '4', '5'];
    const filtered = primaryAllowed.filter((cls) => configured.includes(cls));
    return filtered.length > 0 ? filtered : primaryAllowed;
  }, [schoolRecord?.schoolRange]);

  const [selectedClass, setSelectedClass] = useState<StudentClass>(availableClasses[0] || '1');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>(
    academicYear || schoolRecord?.academicYear || '2026-27'
  );

  const diseCode = schoolRecord?.diseCode || '';
  const marksMap = useMemo(() => {
    return getRealMarksFromLocal(diseCode, selectedYear);
  }, [diseCode, selectedYear]);

  // Dynamic Taluk, School Name, and Working Days
  const talukName = schoolRecord?.taluk?.trim() || 'Belagavi Rural';
  const schoolName =
    schoolRecord?.schoolName?.trim() || 'GOVERNMENT HIGHER PRIMARY SCHOOL';
  const workingDays =
    (schoolRecord as any)?.workingDays || (selectedYear.includes('2026-27') ? 220 : 220);

  // Paper Size 2 options: 1. A4 size (295mm × 210mm) | 2. Legal size (340mm × 210mm)
  const [paperSize, setPaperSize] = useState<ReportPaperSize>('legal');

  // Dynamic Class Teacher Name from School Profile (if not saved, left blank to edit across the app 1-10)
  const classTeacherName = useMemo(() => {
    return getSavedClassTeacher(schoolRecord, selectedClass, selectedDivision);
  }, [schoolRecord, selectedClass, selectedDivision]);

  // Headmaster Name from School Profile
  const headmasterName = schoolRecord?.headmasterName?.trim() || 'Head Master';

  // Filter students for selected class and division
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const matchClass = String(s.classStandard) === String(selectedClass);
        const matchDiv = selectedDivision === 'ALL' || s.division === selectedDivision;
        return matchClass && matchDiv;
      })
      .sort((a, b) => {
        return (a.studentName || '').localeCompare(b.studentName || '');
      });
  }, [students, selectedClass, selectedDivision]);

  // Consolidate examination data for each student for 5 subjects (500 maximum marks)
  const consolidatedRows = useMemo(() => {
    return filteredStudents.map((st, idx) => {
      // Calculate results using the selected medium (Marathi or Urdu)
      const calc = getStudentCalculatedResult(st, activeMedium as SchoolMedium, marksMap, idx + 1);

      // Helper to find subject by code or keyword
      const findSub = (code: string, fallbackKeywords: string[]) => {
        const direct = calc.subjects.find((s) => s.code === code);
        if (direct) return direct;
        return calc.subjects.find((s) => {
          const combined = (s.subjectName + ' ' + s.kannadaName + ' ' + s.code).toLowerCase();
          return fallbackKeywords.some((k) => combined.includes(k));
        });
      };

      // 1. First Language: Marathi or Urdu (code: 'FL')
      const sub1 = findSub('FL', ['fl', activeMedium.toLowerCase(), 'ಪ್ರಥಮ']);
      // 2. Second Language: Kannada (code: 'SL')
      const sub2 = findSub('SL', ['sl', 'kan', 'ಕನ್ನಡ', 'ದ್ವಿತೀಯ']);
      // 3. Third Language: English (code: 'TL')
      const sub3 = findSub('TL', ['tl', 'eng', 'ಇಂಗ್ಲಿಷ್', 'ತೃತೀಯ']);
      // 4. Mathematics (code: 'MATH')
      const sub4 = findSub('MATH', ['math', 'ಗಣಿತ', 'गणಿತ']);
      // 5. EVS (code: 'EVS')
      const sub5 = findSub('EVS', ['evs', 'ಪರಿಸರ', 'science', 'परिसर']);

      const isMarksAllowed = st.cwsnStatus === 'MARKS_ALLOWED' || st.cwsnStatus === 'YES_MARKS';
      const isExempt = isMarksAllowed ? false : (isCwsnExempted(st.cwsnStatus) || (marksMap[st.id] as any)?.isCwsnExempt === true);

      const s1Mark = sub1 ? sub1.total : 0;
      const s1Grade = isExempt ? 'Exempt' : (sub1 ? sub1.grade : calculateSubjectGrade(s1Mark, 100));

      const s2Mark = sub2 ? sub2.total : 0;
      const s2Grade = isExempt ? 'Exempt' : (sub2 ? sub2.grade : calculateSubjectGrade(s2Mark, 100));

      const s3Mark = sub3 ? sub3.total : 0;
      const s3Grade = isExempt ? 'Exempt' : (sub3 ? sub3.grade : calculateSubjectGrade(s3Mark, 100));

      const s4Mark = sub4 ? sub4.total : 0;
      const s4Grade = isExempt ? 'Exempt' : (sub4 ? sub4.grade : calculateSubjectGrade(s4Mark, 100));

      const s5Mark = sub5 ? sub5.total : 0;
      const s5Grade = isExempt ? 'Exempt' : (sub5 ? sub5.grade : calculateSubjectGrade(s5Mark, 100));

      // Total Marks out of 500
      const totalMarks = Number((s1Mark + s2Mark + s3Mark + s4Mark + s5Mark).toFixed(1));
      const percentage = Number(((totalMarks / 500) * 100).toFixed(2));
      const overallGrade = isExempt ? 'Exempt' : totalMarks > 0 ? calculateGrade(percentage) : '-';

      // Pass/Fail rule: 35% minimum overall AND all individual subjects >= 30
      const isPassed =
        percentage >= 35 &&
        s1Mark >= 30 &&
        s2Mark >= 30 &&
        s3Mark >= 30 &&
        s4Mark >= 30 &&
        s5Mark >= 30;

      const resultText = totalMarks === 0 ? '-' : isPassed ? 'PASS' : 'FAIL';

      // Co-scholastic activities grade from existing data
      const coEntry = marksMap[st.id]?.coCurricular;
      const coScholasticGrade =
        coEntry?.emotionalSocial ||
        coEntry?.fineArtsDrawing ||
        coEntry?.scientificSkills ||
        '-';

      // Category format (SC, ST, OBC, GENERAL)
      const caste = (st.caste || '').toUpperCase().trim();
      let displayCategory = 'GENERAL';
      if (caste.includes('SC')) displayCategory = 'SC';
      else if (caste.includes('ST')) displayCategory = 'ST';
      else if (
        caste.includes('CAT-1') ||
        caste.includes('2A') ||
        caste.includes('2B') ||
        caste.includes('3A') ||
        caste.includes('3B') ||
        caste.includes('OBC') ||
        caste.includes('MUSLIM')
      ) {
        displayCategory = 'OBC';
      } else {
        displayCategory = 'GENERAL';
      }

      return {
        slNo: idx + 1,
        student: st,
        satsNo: st.satsNo || '-',
        name: st.studentName || '-',
        dob: st.dob || st.dateOfBirth || '-',
        gender: st.gender === 'Girl' ? 'Girl' : 'Boy',
        category: displayCategory,
        fl: { mark: s1Mark, grade: s1Grade },
        sl: { mark: s2Mark, grade: s2Grade },
        tl: { mark: s3Mark, grade: s3Grade },
        math: { mark: s4Mark, grade: s4Grade },
        evs: { mark: s5Mark, grade: s5Grade },
        totalMarks,
        percentage,
        overallGrade,
        coScholasticGrade,
        resultText,
        isPassed,
      };
    });
  }, [filteredStudents, activeMedium, marksMap]);

  if (!isOpen) return null;

  // Print Action
  const handlePrint = async () => {
    if (isDemo && onOpenPaymentModal) {
      onOpenPaymentModal();
      return;
    }

    const printContent = printableRef.current;
    if (!printContent) return;

    const title = `${schoolName} - CCE Consolidated Report - Class ${selectedClass} (${activeMedium} Medium)`;
    await executeReportPrint(printContent, title, paperSize);
  };

  // Download PDF Action
  const handleDownloadPdf = async () => {
    if (isDemo && onOpenPaymentModal) {
      onOpenPaymentModal();
      return;
    }

    const printElement = printableRef.current;
    if (!printElement) return;

    setIsExportingPdf(true);
    try {
      const filename = `CCE_Consolidated_Report_${activeMedium}_Class_${selectedClass}_${selectedYear}_${paperSize.toUpperCase()}.pdf`;
      await downloadElementAsPdf(printElement, filename, paperSize);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-7xl max-h-[96vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* ========================================================
            TOP MODAL TOOLBAR (NO PRINT)
            ======================================================== */}
        <div className="p-4 sm:px-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  CCE Consolidated Report (Classes 1–5)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-400/30">
                  {activeMedium} Medium • 500 Marks
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/40">
                  Legal Landscape
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ಮರಾಠಿ ಮತ್ತು ಉರ್ದು ಮಾಧ್ಯಮ ಸಿಸಿಇ ಸಂಯೋಜಿತ ವಾರ್ಷಿಕ ಪರಿಣಾಮ ಪತ್ರಿಕೆ (English Table Headings)
              </p>
            </div>
          </div>

          {/* Controls: Medium Switcher, Class, Division, Academic Year */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Medium Toggle: Marathi vs Urdu */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveMedium('Marathi')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeMedium === 'Marathi'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Marathi Medium
              </button>
              <button
                type="button"
                onClick={() => setActiveMedium('Urdu')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeMedium === 'Urdu'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Urdu Medium
              </button>
            </div>

            {/* Academic Year */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
              >
                {ACADEMIC_YEARS.map((yr) => (
                  <option key={yr} value={yr} className="bg-slate-900 text-white">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Dropdown (Specifically Classes 1-5 only) */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400">Class:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value as StudentClass)}
                className="bg-transparent text-amber-300 font-mono font-black focus:outline-none cursor-pointer"
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls} className="bg-slate-900 text-white">
                    Class {cls} ({getFormattedClassName(cls, 'English')})
                  </option>
                ))}
              </select>
            </div>

            {/* Division Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400">Section:</span>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">ALL Sections</option>
                <option value="A" className="bg-slate-900 text-white">Section A</option>
                <option value="B" className="bg-slate-900 text-white">Section B</option>
                <option value="C" className="bg-slate-900 text-white">Section C</option>
                <option value="D" className="bg-slate-900 text-white">Section D</option>
              </select>
            </div>

            {/* Switch to Kannada / English Report if applicable */}
            {onSwitchToKannadaEnglish && (
              <button
                type="button"
                onClick={onSwitchToKannadaEnglish}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
                title="Switch to Kannada / English Medium Report (400 Marks)"
              >
                <span>Kannada/English (400m)</span>
              </button>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print (Legal)</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Exporting...' : 'Download PDF'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Demo Mode / Pass Key reminder banner */}
        {isDemo && (
          <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between text-xs text-amber-200">
            <span>
              <strong>Demo Mode Active:</strong> All marks and student data shown are consolidated live. Unlock full print & PDF downloads via PAA Key.
            </span>
            <button
              type="button"
              onClick={onOpenPaymentModal}
              className="px-3 py-1 bg-amber-600 text-white font-black rounded-lg hover:bg-amber-700 transition"
            >
              Purchase PAA Key (₹500)
            </button>
          </div>
        )}

        {/* ========================================================
            REPORT PREVIEW BODY (SCROLLABLE CONTAINER)
            ======================================================== */}
        <div className="flex-1 bg-slate-200 overflow-auto p-4 sm:p-6 flex justify-center items-start">
          {/* Legal Landscape Sheet: 355.6mm wide, white background, shadow-2xl */}
          <div
            ref={printableRef}
            className="bg-white text-slate-950 shadow-2xl rounded-none w-[355.6mm] min-h-[215.9mm] p-[5mm_10mm_0.75mm_20mm] font-sans flex flex-col justify-between shrink-0"
            style={{
              boxSizing: 'border-box',
              fontFamily: "'Anek Kannada', 'Plus Jakarta Sans', sans-serif",
            }}
          >
            <div>
              {/* ========================================================
                  SECTION 19 & 20: REPORT HEADER (NO BOX / NO TABLE / CLEAN)
                  ======================================================== */}
              <div className="w-full text-center pb-3 space-y-1">
                {/* FIRST LINE: DYNAMIC TALUK BEO & BRC OFFICE */}
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 tracking-wide uppercase">
                  {`Office of the Block Education Officer and Block Resource Coordinator, ${talukName}`}
                </h3>

                {/* SECOND LINE: DYNAMIC SCHOOL NAME (Visually Prominent) */}
                <h1 className="text-lg sm:text-2xl font-black text-slate-950 tracking-tight uppercase leading-snug">
                  {schoolName}
                </h1>

                {/* THIRD LINE: DYNAMIC ANNUAL RESULT SHEET TITLE */}
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-wide uppercase">
                  {`Annual Result Sheet for the Year ${selectedYear}`}
                </h2>

                {/* SUB-INFO LINE: CLASS, MEDIUM, ACADEMIC YEAR (BORDERLESS) */}
                <div className="flex items-center justify-center gap-8 text-xs font-bold text-slate-700 pt-1">
                  <span>
                    Class: <strong className="text-slate-950">{getFormattedClassName(selectedClass, 'English')} Standard</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Medium: <strong className="text-slate-950">{activeMedium} Medium</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Academic Year: <strong className="text-slate-950">{selectedYear}</strong>
                  </span>
                </div>
              </div>

              {/* ========================================================
                  SECTION 23: INFORMATION LINE IMMEDIATELY ABOVE TABLE
                  CLASS, CLASS TEACHER, WORKING DAYS EQUALLY DISTRIBUTED
                  ======================================================== */}
              <div className="w-full grid grid-cols-3 items-center text-center text-xs font-black text-slate-900 py-1.5 px-0.5 border-b border-slate-200">
                <div className="flex justify-center items-center">
                  <span>Class: <strong className="text-slate-950 font-extrabold">{getFormattedClassName(selectedClass, 'English')} Standard</strong></span>
                </div>
                <div className="flex justify-center items-center">
                  <span>Class Teacher: <span className="font-extrabold underline decoration-slate-400 decoration-1 underline-offset-4">{classTeacherName}</span></span>
                </div>
                <div className="flex justify-center items-center">
                  <span>No. of School Working Days: <span className="font-mono font-extrabold">{workingDays}</span></span>
                </div>
              </div>

              {/* ========================================================
                  SECTIONS 5, 6, 25-28: MAIN STUDENT DATA TABLE (5 SUBJECTS)
                  ALL TABLE HEADINGS IN ENGLISH
                  ======================================================== */}
              <div className="w-full overflow-hidden mt-1">
                <table className="w-full text-center border-collapse text-[9.5px] sm:text-[10.5px] border border-slate-900">
                  <thead className="bg-slate-100 text-slate-950 font-black uppercase tracking-wider">
                    {/* Tier 1 Header */}
                    <tr className="border-b border-slate-900 h-8">
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-7">
                        Sl. No.
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-20">
                        SATS No.
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-2 text-left min-w-[125px]">
                        Student Name
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-14">
                        DOB
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-9">
                        Gender
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-11">
                        Category
                      </th>

                      {/* 1. FIRST LANGUAGE: Marathi or Urdu */}
                      <th colSpan={2} className="border border-slate-900 py-0.5 px-1 text-center bg-blue-50 font-black">
                        <div>FIRST LANGUAGE</div>
                        <div className="text-[8.5px] font-bold text-blue-900 normal-case">({firstLangName})</div>
                      </th>

                      {/* 2. SECOND LANGUAGE: Kannada */}
                      <th colSpan={2} className="border border-slate-900 py-0.5 px-1 text-center bg-emerald-50 font-black">
                        <div>SECOND LANGUAGE</div>
                        <div className="text-[8.5px] font-bold text-emerald-900 normal-case">(Kannada)</div>
                      </th>

                      {/* 3. THIRD LANGUAGE: English (SEPARATE SUBJECT) */}
                      <th colSpan={2} className="border border-slate-900 py-0.5 px-1 text-center bg-purple-50 font-black">
                        <div>THIRD LANGUAGE</div>
                        <div className="text-[8.5px] font-bold text-purple-900 normal-case">(English)</div>
                      </th>

                      {/* 4. MATHEMATICS */}
                      <th colSpan={2} className="border border-slate-900 py-0.5 px-1 text-center bg-amber-50 font-black">
                        <div>MATHEMATICS</div>
                        <div className="text-[8.5px] font-bold text-amber-900 normal-case">(Math)</div>
                      </th>

                      {/* 5. EVS */}
                      <th colSpan={2} className="border border-slate-900 py-0.5 px-1 text-center bg-teal-50 font-black">
                        <div>EVS</div>
                        <div className="text-[8.5px] font-bold text-teal-900 normal-case">(Env Studies)</div>
                      </th>

                      {/* SUMMARY: TOTAL /500 */}
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-13 bg-slate-200 font-black">
                        TOTAL /500
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-11 bg-slate-100 font-black">
                        PERCENTAGE
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-10 bg-slate-200 font-black">
                        OVERALL GRADE
                      </th>

                      {/* CO-SCHOLASTIC */}
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-15 bg-slate-50 font-black leading-tight text-[9px]">
                        CO-SCHOLASTIC ACTIVITIES
                      </th>

                      {/* RESULT */}
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-14 bg-emerald-100 font-black">
                        RESULT
                      </th>
                    </tr>

                    {/* Tier 2 Header: Marks & Grades for 5 Subjects */}
                    <tr className="border-b-2 border-slate-900 text-[8.5px] sm:text-[9.5px] h-5 font-mono font-black">
                      {/* First Language */}
                      <th className="border border-slate-900 py-0.5 px-0.5 bg-blue-50/70 text-center">Mark</th>
                      <th className="border border-slate-900 py-0.5 px-0.5 bg-blue-50/70 text-center">Grade</th>

                      {/* Second Language */}
                      <th className="border border-slate-900 py-0.5 px-0.5 bg-emerald-50/70 text-center">Mark</th>
                      <th className="border border-slate-900 py-0.5 px-0.5 bg-emerald-50/70 text-center">Grade</th>

                      {/* Third Language */}
                      <th className="border border-slate-900 py-0.5 px-0.5 bg-purple-50/70 text-center">Mark</th>
                      <th className="border border-slate-900 py-0.5 px-0.5 bg-purple-50/70 text-center">Grade</th>

                      {/* Mathematics */}
                      <th className="border border-slate-900 py-0.5 px-0.5 bg-amber-50/70 text-center">Mark</th>
                      <th className="border border-slate-900 py-0.5 px-0.5 bg-amber-50/70 text-center">Grade</th>

                      {/* EVS */}
                      <th className="border border-slate-900 py-0.5 px-0.5 bg-teal-50/70 text-center">Mark</th>
                      <th className="border border-slate-900 py-0.5 px-0.5 bg-teal-50/70 text-center">Grade</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800 text-slate-950 font-medium font-mono">
                    {consolidatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={21} className="py-12 text-center text-slate-500 font-bold font-sans">
                          No students enrolled for selected class standard.
                        </td>
                      </tr>
                    ) : (
                      consolidatedRows.map((r) => (
                        <tr key={r.student.id} className="hover:bg-slate-50 transition h-6 sm:h-7 text-center">
                          {/* Sl. No */}
                          <td className="border border-slate-900 py-0.5 px-1 font-bold">{r.slNo}</td>

                          {/* SATS No */}
                          <td className="border border-slate-900 py-0.5 px-1 font-bold whitespace-nowrap">{r.satsNo}</td>

                          {/* Student Name */}
                          <td className="border border-slate-900 py-0.5 px-1.5 text-left font-sans font-bold uppercase truncate max-w-[150px]">
                            {r.name}
                          </td>

                          {/* DOB */}
                          <td className="border border-slate-900 py-0.5 px-0.5 whitespace-nowrap text-[8.5px] sm:text-[9.5px]">{r.dob}</td>

                          {/* Gender */}
                          <td className="border border-slate-900 py-0.5 px-0.5 font-sans font-bold">{r.gender}</td>

                          {/* Category */}
                          <td className="border border-slate-900 py-0.5 px-0.5 font-sans font-bold">{r.category}</td>

                          {/* 1. First Language: Mark & Grade */}
                          <td className="border border-slate-900 py-0.5 px-0.5 font-bold bg-blue-50/20 text-[12px]">{r.fl.mark}</td>
                          <td className="border border-slate-900 py-0.5 px-0.5 font-black text-blue-900 bg-blue-50/30 text-[12px]">{r.fl.grade}</td>

                          {/* 2. Second Language: Mark & Grade */}
                          <td className="border border-slate-900 py-0.5 px-0.5 font-bold bg-emerald-50/20 text-[12px]">{r.sl.mark}</td>
                          <td className="border border-slate-900 py-0.5 px-0.5 font-black text-emerald-900 bg-emerald-50/30 text-[12px]">{r.sl.grade}</td>

                          {/* 3. Third Language: Mark & Grade */}
                          <td className="border border-slate-900 py-0.5 px-0.5 font-bold bg-purple-50/20 text-[12px]">{r.tl.mark}</td>
                          <td className="border border-slate-900 py-0.5 px-0.5 font-black text-purple-900 bg-purple-50/30 text-[12px]">{r.tl.grade}</td>

                          {/* 4. Mathematics: Mark & Grade */}
                          <td className="border border-slate-900 py-0.5 px-0.5 font-bold bg-amber-50/20 text-[12px]">{r.math.mark}</td>
                          <td className="border border-slate-900 py-0.5 px-0.5 font-black text-amber-900 bg-amber-50/30 text-[12px]">{r.math.grade}</td>

                          {/* 5. EVS: Mark & Grade */}
                          <td className="border border-slate-900 py-0.5 px-0.5 font-bold bg-teal-50/20 text-[12px]">{r.evs.mark}</td>
                          <td className="border border-slate-900 py-0.5 px-0.5 font-black text-teal-900 bg-teal-50/30 text-[12px]">{r.evs.grade}</td>

                          {/* TOTAL /500 */}
                          <td className="border border-slate-900 py-0.5 px-0.5 font-black text-slate-950 bg-slate-100 font-mono text-[12px]">
                            {r.totalMarks}
                          </td>

                          {/* PERCENTAGE */}
                          <td className="border border-slate-900 py-0.5 px-0.5 font-bold text-slate-900 text-[12px]">{r.percentage}%</td>

                          {/* OVERALL GRADE */}
                          <td className="border border-slate-900 py-0.5 px-0.5 font-black text-slate-950 bg-slate-100 text-[12px]">
                            {r.overallGrade}
                          </td>

                          {/* CO-SCHOLASTIC ACTIVITIES */}
                          <td className="border border-slate-900 py-0.5 px-0.5 font-black text-indigo-900 text-[12px]">
                            {r.coScholasticGrade}
                          </td>

                          {/* RESULT */}
                          <td className={`border border-slate-900 py-0.5 px-0.5 font-sans font-black ${r.isPassed ? 'text-emerald-900 bg-emerald-50/60' : 'text-rose-900 bg-rose-50/60'}`}>
                            {r.resultText}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================
                SECTION 35: BOTTOM SIGNATURES (NO BOX / NO TABLE / CLEAN)
                BOTTOM LEFT: CLASS TEACHER SIGN
                BOTTOM RIGHT: HEAD MASTER SIGN
                ======================================================== */}
            <div className="w-full flex items-end justify-between pt-6 pb-1 text-xs font-black text-slate-900">
              {/* Bottom Left: Class Teacher Sign */}
              <div className="text-left space-y-1">
                <div className="h-6" /> {/* Space reserved for handwritten signature */}
                <p className="text-xs uppercase tracking-wide">
                  Class Teacher sign
                </p>
                <p className="font-bold text-slate-800">
                  {classTeacherName}
                </p>
              </div>

              {/* Bottom Right: Headmaster Sign */}
              <div className="text-right space-y-1">
                <div className="h-6" /> {/* Space reserved for seal/signature */}
                <p className="text-xs uppercase tracking-wide">
                  Head Master sign
                </p>
                <p className="font-bold text-slate-800">
                  {headmasterName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
