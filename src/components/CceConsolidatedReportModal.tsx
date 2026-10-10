/**
 * CCE CONSOLIDATED REPORT (ಸಿಸಿಇ ಸಂಯೋಜಿತ ವರದಿ)
 * Classes 1 to 5 Annual Consolidation Sheet
 * Designed according to KSEAB / DSERT specifications by Shri S R Angadi
 *
 * Paper Size: Legal Landscape
 * Margins: Left 2cm, Right 1cm, Bottom 0.75mm, Top ~5mm
 * Clean, borderless header with dynamic Taluk, School Name, Academic Year
 * Class Teacher (Left) & No. of Working Days (Right) above the table
 * Bottom Signatures (Class Teacher & Head Master) without boxes
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Student,
  StudentClass,
  StudentDivision,
  SchoolRecord,
  getFormattedClassName,
  isCwsnStudent,
  isCwsnExempted,
} from '../types';
import { getClassesFromRange } from '../utils/studentStore';
import { getRealMarksFromLocal, getStudentCalculatedResult } from '../utils/marksStore';
import { ACADEMIC_YEARS } from './SchoolDashboard';
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
} from 'lucide-react';

interface CceConsolidatedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  isDemo?: boolean;
  onOpenPaymentModal?: () => void;
  onSwitchToMarathiUrdu?: () => void;
}

export const CceConsolidatedReportModal: React.FC<CceConsolidatedReportModalProps> = ({
  isOpen,
  onClose,
  students,
  schoolRecord,
  academicYear,
  isDemo = false,
  onOpenPaymentModal,
  onSwitchToMarathiUrdu,
}) => {
  const printableRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Determine configured classes from School Profile, restricted strictly to Classes 1-5
  const availableClasses = useMemo(() => {
    const configured = getClassesFromRange(schoolRecord?.schoolRange);
    const primaryAllowed: StudentClass[] = ['1', '2', '3', '4', '5'];
    const filtered = primaryAllowed.filter((cls) => configured.includes(cls));
    return filtered.length > 0 ? filtered : primaryAllowed;
  }, [schoolRecord?.schoolRange]);

  const [selectedClass, setSelectedClass] = useState<StudentClass>(availableClasses[0] || '1');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>(academicYear || schoolRecord?.academicYear || '2026-27');

  const diseCode = schoolRecord?.diseCode || '';
  const marksMap = useMemo(() => {
    return getRealMarksFromLocal(diseCode, selectedYear);
  }, [diseCode, selectedYear]);

  // Medium is automatically derived from School Profile
  const medium = schoolRecord?.schoolMedium || 'Kannada';
  const isKn = medium === 'Kannada';

  // Dynamic Taluk, School Name, and Working Days
  const talukName = schoolRecord?.taluk?.trim() || (isKn ? 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ' : 'Belagavi Rural');
  const schoolName = schoolRecord?.schoolName?.trim() || (isKn ? 'ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ' : 'GOVERNMENT HIGHER PRIMARY SCHOOL');
  const workingDays = (schoolRecord as any)?.workingDays || (selectedYear.includes('2026-27') ? 220 : 220);

  // Dynamic Class Teacher Name from School Profile
  const classTeacherName = useMemo(() => {
    const teachers = schoolRecord?.classTeachers || {};
    const divKey = `${selectedClass}-${selectedDivision}`;
    return (
      teachers[divKey] ||
      teachers[selectedClass] ||
      schoolRecord?.headmasterName ||
      (isKn ? 'ಶ್ರೀ. ಎಂ. ಐ. ನಿಲಾಜಿ' : 'SHRI. M I NILAJI')
    );
  }, [schoolRecord?.classTeachers, schoolRecord?.headmasterName, selectedClass, selectedDivision, isKn]);

  // Headmaster Name from School Profile
  const headmasterName = schoolRecord?.headmasterName?.trim() || (isKn ? 'ಮುಖ್ಯ ಗುರುಗಳು' : 'Head Master');

  // Filter students for selected class and division
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const matchClass = String(s.classStandard) === String(selectedClass);
        const matchDiv = selectedDivision === 'ALL' || s.division === selectedDivision;
        return matchClass && matchDiv;
      })
      .sort((a, b) => {
        // Sort alphabetically by name
        return (a.studentName || '').localeCompare(b.studentName || '');
      });
  }, [students, selectedClass, selectedDivision]);

  // Consolidate examination data for each student
  const consolidatedRows = useMemo(() => {
    return filteredStudents.map((st, idx) => {
      const calc = getStudentCalculatedResult(st, medium, marksMap, idx + 1);

      // Find the 4 primary subjects: Kannada, English, Math, EVS
      const findSubject = (keywords: string[]) => {
        return calc.subjects.find((s) => {
          const name = (s.subjectName + ' ' + s.kannadaName + ' ' + s.code).toLowerCase();
          return keywords.some((k) => name.includes(k));
        });
      };

      const sub1 = findSubject(['kan', 'ಕನ್ನಡ', 'fl']) || calc.subjects[0];
      const sub2 = findSubject(['eng', 'ಇಂಗ್ಲಿಷ್', 'sl']) || calc.subjects[1];
      const sub3 = findSubject(['math', 'ಗಣಿತ']) || calc.subjects[2];
      const sub4 = findSubject(['evs', 'ಪರಿಸರ', 'science', 'ವಿಜ್ಞಾನ']) || calc.subjects[3];

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

      const totalMarks = Number((s1Mark + s2Mark + s3Mark + s4Mark).toFixed(1));
      const percentage = Number(((totalMarks / 400) * 100).toFixed(2));
      const overallGrade = isExempt ? 'Exempt' : totalMarks > 0 ? calculateGrade(percentage) : '-';

      // Pass/Fail rule: 35% minimum overall or all subjects >= 30, CWSN passed on basis of Part B
      const isCwsn = isCwsnStudent(st.cwsnStatus) || (marksMap[st.id] as any)?.isCwsnExempt;
      const isPassed =
        isCwsn ||
        (percentage >= 35 &&
        s1Mark >= 30 &&
        s2Mark >= 30 &&
        s3Mark >= 30 &&
        s4Mark >= 30);

      const resultText =
        isCwsn
          ? (isKn ? 'ಉತ್ತೀರ್ಣ (CWSN)' : 'PASS (CWSN)')
          : totalMarks === 0
          ? '-'
          : isPassed
          ? (isKn ? 'ಉತ್ತೀರ್ಣ (PASS)' : 'PASS')
          : (isKn ? 'ಅನುತ್ತೀರ್ಣ (FAIL)' : 'FAIL');

      // Co-scholastic activities grade from existing data
      const coEntry = marksMap[st.id]?.coCurricular;
      const coScholasticGrade =
        coEntry?.emotionalSocial ||
        coEntry?.fineArtsDrawing ||
        coEntry?.scientificSkills ||
        'A';

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
        gender: st.gender === 'Girl' ? (isKn ? 'ಹೆಣ್ಣು' : 'Girl') : (isKn ? 'ಗಂಡು' : 'Boy'),
        category: displayCategory,
        kannada: { mark: s1Mark, grade: s1Grade },
        english: { mark: s2Mark, grade: s2Grade },
        mathematics: { mark: s3Mark, grade: s3Grade },
        evs: { mark: s4Mark, grade: s4Grade },
        totalMarks,
        percentage,
        overallGrade,
        coScholasticGrade,
        resultText,
        isPassed,
      };
    });
  }, [filteredStudents, medium, marksMap, isKn]);

  if (!isOpen) return null;

  // Print Action
  const handlePrint = () => {
    if (isDemo && onOpenPaymentModal) {
      onOpenPaymentModal();
      return;
    }

    const printContent = printableRef.current;
    if (!printContent) return;

    // Use isolated iframe printing with exact Legal Landscape page CSS
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${schoolName} - CCE Consolidated Report - Class ${selectedClass}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            @page {
              size: legal landscape;
              margin: 5mm 10mm 0.75mm 20mm;
            }
            *, *::before, *::after {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
              font-family: 'Plus Jakarta Sans', 'Noto Sans Kannada', sans-serif;
              font-size: 11px;
              line-height: 1.35;
            }
            .print-sheet {
              width: 100%;
              max-width: 100%;
              margin: 0;
              padding: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #1e293b;
              padding: 3.5px 4px;
              vertical-align: middle;
            }
            thead {
              display: table-header-group;
            }
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="print-sheet">
            ${printContent.innerHTML}
          </div>
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 300);
            });
          </script>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 15000);
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
      let imgData: string | null = null;
      let imgWidthPx = 0;
      let imgHeightPx = 0;

      try {
        imgData = await toPng(printElement, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          skipFonts: true,
          fontEmbedCSS: '',
          filter: (node) => {
            if (node instanceof HTMLElement && (node.classList.contains('no-print') || node.tagName === 'BUTTON')) {
              return false;
            }
            return true;
          },
        });
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = imgData!;
        });
        imgWidthPx = img.naturalWidth || 1200;
        imgHeightPx = img.naturalHeight || 800;
      } catch (e) {
        console.warn('html-to-image fallback:', e);
      }

      if (!imgData) {
        const canvas = await html2canvas(printElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1400,
        });
        imgData = canvas.toDataURL('image/jpeg', 0.98);
        imgWidthPx = canvas.width;
        imgHeightPx = canvas.height;
      }

      if (!imgData) throw new Error('Could not render image for PDF');

      // Legal Landscape: 355.6mm x 215.9mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'legal',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 355.6
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 215.9

      // Left 20mm, Right 10mm, Top 5mm, Bottom 0.75mm
      const marginLeft = 20;
      const marginRight = 10;
      const marginTop = 5;
      const marginBottom = 0.75;

      const printableWidth = pdfWidth - marginLeft - marginRight;
      const printableHeight = pdfHeight - marginTop - marginBottom;

      const ratio = imgHeightPx / imgWidthPx;
      const renderedHeight = printableWidth * ratio;

      if (renderedHeight <= printableHeight) {
        pdf.addImage(imgData, 'PNG', marginLeft, marginTop, printableWidth, renderedHeight);
      } else {
        // Multi-page slicing for large lists
        let yOffset = 0;
        const pageCanvasHeight = (printableHeight / printableWidth) * imgWidthPx;

        while (yOffset < imgHeightPx) {
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = imgWidthPx;
          sliceCanvas.height = Math.min(pageCanvasHeight, imgHeightPx - yOffset);
          const ctx = sliceCanvas.getContext('2d');
          if (ctx) {
            const tempImg = new Image();
            tempImg.src = imgData;
            ctx.drawImage(
              tempImg,
              0,
              yOffset,
              imgWidthPx,
              sliceCanvas.height,
              0,
              0,
              imgWidthPx,
              sliceCanvas.height
            );
            const sliceData = sliceCanvas.toDataURL('image/png');
            if (yOffset > 0) pdf.addPage('legal', 'landscape');
            const sliceRenderHeight = (sliceCanvas.height / imgWidthPx) * printableWidth;
            pdf.addImage(sliceData, 'PNG', marginLeft, marginTop, printableWidth, sliceRenderHeight);
          }
          yOffset += pageCanvasHeight;
        }
      }

      const fileName = `CCE_Consolidated_Report_Class_${selectedClass}_${selectedYear}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF generation notice. Please use the Print button and choose "Save as PDF".');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[99vw] xl:max-w-[96vw] h-[96vh] rounded-3xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden">
        {/* Top Control Bar (Non-Printable) */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-blue-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl shadow-md font-black">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>{isKn ? 'ಸಿಸಿಇ ಸಂಯೋಜಿತ ವರದಿ (CCE Consolidated Report)' : 'CCE Consolidated Report (Classes 1–5)'}</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-xs font-mono border border-blue-400/30">
                  Legal Landscape
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                {schoolName} • {isKn ? 'ಮಾಧ್ಯಮ' : 'Medium'}: {medium} • {isKn ? 'ವರ್ಷ' : 'Year'}: {selectedYear}
              </p>
            </div>
          </div>

          {/* Controls: Class / Section Selector and Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Academic Year Selector */}
            <div className="flex items-center gap-1.5 bg-blue-900/60 px-2.5 py-1.5 rounded-xl border border-blue-700/60 text-xs font-bold">
              <span className="text-blue-200 text-[11px]">{isKn ? 'ವರ್ಷ:' : 'Year:'}</span>
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

            {/* Class Selector - Strictly Classes 1 to 5 */}
            <div className="flex items-center gap-1.5 bg-blue-900/60 px-2.5 py-1.5 rounded-xl border border-blue-700/60 text-xs font-bold">
              <span className="text-blue-200 text-[11px]">{isKn ? 'ತರಗತಿ:' : 'Class:'}</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value as StudentClass)}
                className="bg-transparent text-amber-300 font-mono font-black focus:outline-none cursor-pointer"
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls} className="bg-slate-900 text-white">
                    {getFormattedClassName(cls, medium)}
                  </option>
                ))}
              </select>
            </div>

            {/* Division Selector */}
            <div className="flex items-center gap-1.5 bg-blue-900/60 px-2.5 py-1.5 rounded-xl border border-blue-700/60 text-xs font-bold">
              <span className="text-blue-200 text-[11px]">{isKn ? 'ವಿಭಾಗ:' : 'Section:'}</span>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">ALL</option>
                <option value="A" className="bg-slate-900 text-white">A</option>
                <option value="B" className="bg-slate-900 text-white">B</option>
                <option value="C" className="bg-slate-900 text-white">C</option>
                <option value="D" className="bg-slate-900 text-white">D</option>
              </select>
            </div>

            {/* Switch to Marathi / Urdu Report if applicable */}
            {onSwitchToMarathiUrdu && (
              <button
                type="button"
                onClick={onSwitchToMarathiUrdu}
                className="px-2.5 py-1.5 bg-blue-900/80 hover:bg-blue-800 text-amber-300 rounded-xl text-xs font-bold border border-blue-700/60 transition cursor-pointer"
                title="Switch to Marathi / Urdu Medium Report (500 Marks)"
              >
                <span>Marathi/Urdu (500m)</span>
              </button>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition transform hover:-translate-y-0.5 cursor-pointer"
              title="Print directly on Legal Landscape Paper"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>{isKn ? 'ಮುದ್ರಣ (Print)' : 'Print'}</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
              title="Download Legal Landscape PDF"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'PDF ಸಿದ್ಧವಾಗುತ್ತಿದೆ...' : isKn ? 'PDF ಡೌನ್‌ಲೋಡ್' : 'Download PDF'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer ml-1"
              title="Close Report"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Demo Mode Notice */}
        {isDemo && (
          <div className="bg-amber-50 px-5 py-2 border-b border-amber-200 flex items-center justify-between text-xs text-amber-950 shrink-0">
            <span className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>ಡೆಮೊ ಮೋಡ್: CCE ವರದಿಯನ್ನು ನೇರವಾಗಿ ಪರೀಕ್ಷಿಸಿ ಪರಿಶೀಲಿಸಬಹುದು. ಮುದ್ರಣ ಹಾಗೂ ಅಧಿಕೃತ PDF ಪಡೆಯಲು PAA ಕೀ ಬಳಸಿ.</span>
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

        {/* Report Preview Body (Scrollable Container with Authentic Legal Landscape Preview) */}
        <div className="flex-1 bg-slate-200 overflow-auto p-4 sm:p-6 flex justify-center items-start">
          {/* Legal Landscape Sheet: 355.6mm wide, white background, shadow-xl */}
          <div
            ref={printableRef}
            className="bg-white text-slate-950 shadow-2xl rounded-none w-[355.6mm] min-h-[215.9mm] p-[5mm_10mm_0.75mm_20mm] font-sans flex flex-col justify-between shrink-0"
            style={{
              boxSizing: 'border-box',
              fontFamily: "'Plus Jakarta Sans', 'Noto Sans Kannada', sans-serif",
            }}
          >
            <div>
              {/* ========================================================
                  SECTION 4 & 5: REPORT HEADER (NO BOX / NO TABLE / CLEAN)
                  ======================================================== */}
              <div className="w-full text-center pb-3 space-y-1">
                {/* FIRST LINE: DYNAMIC TALUK BEO & BRC OFFICE - ONLY FOR KANNADA MEDIUM */}
                {isKn && (
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 tracking-wide uppercase">
                    {`ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ ${talukName}`}
                  </h3>
                )}

                {/* SECOND LINE: DYNAMIC SCHOOL NAME (Visually Prominent) */}
                <h1 className="text-lg sm:text-2xl font-black text-slate-950 tracking-tight uppercase leading-snug">
                  {schoolName}
                </h1>

                {/* THIRD LINE: DYNAMIC ANNUAL RESULT SHEET TITLE */}
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-wide">
                  {isKn
                    ? `${selectedYear} ನೇ ಸಾಲಿನ ವಾರ್ಷಿಕ ಪರಿಣಾಮ ಪತ್ರಿಕೆ`
                    : `ANNUAL RESULT SHEET FOR THE ACADEMIC YEAR ${selectedYear}`}
                </h2>

                {/* SUB-INFO LINE: MEDIUM, ACADEMIC YEAR (BORDERLESS) */}
                <div className="flex items-center justify-center gap-8 text-xs font-bold text-slate-700 pt-1">
                  <span>
                    {isKn ? 'ಮಾಧ್ಯಮ' : 'Medium'}: <strong className="text-slate-950">{isKn ? 'ಕನ್ನಡ ಮಾಧ್ಯಮ' : 'English Medium'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    {isKn ? 'ಶೈಕ್ಷಣಿಕ ವರ್ಷ' : 'Academic Year'}: <strong className="text-slate-950">{selectedYear}</strong>
                  </span>
                </div>
              </div>

              {/* ========================================================
                  SECTION 8 & 33: INFORMATION LINE IMMEDIATELY ABOVE TABLE
                  CLASS, CLASS TEACHER, WORKING DAYS EQUALLY DISTRIBUTED ALONG WIDTH
                  ======================================================== */}
              <div className="w-full grid grid-cols-3 items-center text-center text-xs font-black text-slate-900 py-1.5 px-0.5 border-b border-slate-200">
                <div className="flex justify-center items-center">
                  <span>{isKn ? 'ತರಗತಿ:' : 'Class:'} <strong className="text-slate-950 font-extrabold">{getFormattedClassName(selectedClass, medium)}</strong></span>
                </div>
                <div className="flex justify-center items-center">
                  <span>{isKn ? 'ವರ್ಗ ಶಿಕ್ಷಕರು:' : 'Class Teacher:'} <span className="font-extrabold underline decoration-slate-400 decoration-1 underline-offset-4">{classTeacherName}</span></span>
                </div>
                <div className="flex justify-center items-center">
                  <span>{isKn ? 'ಶಾಲೆಯ ಕಾರ್ಯದಿನಗಳ ಸಂಖ್ಯೆ:' : 'No. of School Working Days:'} <span className="font-mono font-extrabold">{workingDays}</span></span>
                </div>
              </div>

              {/* ========================================================
                  SECTION 21 & 22: MAIN STUDENT DATA TABLE
                  ======================================================== */}
              <div className="w-full overflow-hidden mt-1">
                <table className="w-full text-center border-collapse text-[10px] sm:text-[11px] border border-slate-900">
                  <thead className="bg-slate-100/90 text-slate-950 font-black uppercase tracking-wider">
                    {/* Tier 1 Header */}
                    <tr className="border-b border-slate-900 h-8">
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1.5 text-center w-8">
                        {isKn ? 'ಕ್ರ.ಸಂ' : 'Sl.'}
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1.5 text-center w-24">
                        {isKn ? 'ಎಸ್.ಎ.ಟಿ.ಎಸ್ ಸಂ.' : 'SATS No.'}
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-2 text-left min-w-[130px]">
                        {isKn ? 'ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು' : 'Student Name'}
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-16">
                        {isKn ? 'ಜನ್ಮ ದಿನಾಂಕ' : 'DOB'}
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-10">
                        {isKn ? 'ಲಿಂಗ' : 'Gender'}
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-12">
                        {isKn ? 'ಪ್ರವರ್ಗ' : 'Category'}
                      </th>

                      {/* 1. KANNADA */}
                      <th colSpan={2} className="border border-slate-900 py-1 px-1 text-center bg-blue-50/60 font-black">
                        {isKn ? 'ಕನ್ನಡ' : 'KANNADA'}
                      </th>

                      {/* 2. ENGLISH */}
                      <th colSpan={2} className="border border-slate-900 py-1 px-1 text-center bg-purple-50/60 font-black">
                        {isKn ? 'ಇಂಗ್ಲಿಷ್' : 'ENGLISH'}
                      </th>

                      {/* 3. MATHEMATICS */}
                      <th colSpan={2} className="border border-slate-900 py-1 px-1 text-center bg-amber-50/60 font-black">
                        {isKn ? 'ಗಣಿತ' : 'MATHEMATICS'}
                      </th>

                      {/* 4. EVS */}
                      <th colSpan={2} className="border border-slate-900 py-1 px-1 text-center bg-emerald-50/60 font-black">
                        {isKn ? 'ಪರಿಸರ ಅಧ್ಯಯನ' : 'EVS'}
                      </th>

                      {/* SUMMARY */}
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-14 bg-slate-200 font-black">
                        {isKn ? 'ಒಟ್ಟು /400' : 'TOTAL /400'}
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-12 bg-slate-100 font-black">
                        {isKn ? 'ಶೇಕಡಾ %' : '%'}
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-10 bg-slate-200 font-black">
                        {isKn ? 'ಶ್ರೇಣಿ' : 'Grade'}
                      </th>

                      {/* CO-SCHOLASTIC */}
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-16 bg-slate-50 font-black leading-tight">
                        {isKn ? 'ಸಹಪಠ್ಯ' : 'Co-Scholastic'}
                      </th>

                      {/* RESULT */}
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 text-center w-16 bg-emerald-100 font-black">
                        {isKn ? 'ಫಲಿತಾಂಶ' : 'RESULT'}
                      </th>
                    </tr>

                    {/* Tier 2 Header: Marks & Grades for 4 Subjects */}
                    <tr className="border-b-2 border-slate-900 text-[9px] sm:text-[10px] h-6 font-mono font-black">
                      {/* Kannada */}
                      <th className="border border-slate-900 py-0.5 px-1 bg-blue-50/40 text-center">{isKn ? 'ಅಂಕ' : 'Mark'}</th>
                      <th className="border border-slate-900 py-0.5 px-1 bg-blue-50/40 text-center">{isKn ? 'ಶ್ರೇಣಿ' : 'Grd'}</th>

                      {/* English */}
                      <th className="border border-slate-900 py-0.5 px-1 bg-purple-50/40 text-center">{isKn ? 'ಅಂಕ' : 'Mark'}</th>
                      <th className="border border-slate-900 py-0.5 px-1 bg-purple-50/40 text-center">{isKn ? 'ಶ್ರೇಣಿ' : 'Grd'}</th>

                      {/* Math */}
                      <th className="border border-slate-900 py-0.5 px-1 bg-amber-50/40 text-center">{isKn ? 'ಅಂಕ' : 'Mark'}</th>
                      <th className="border border-slate-900 py-0.5 px-1 bg-amber-50/40 text-center">{isKn ? 'ಶ್ರೇಣಿ' : 'Grd'}</th>

                      {/* EVS */}
                      <th className="border border-slate-900 py-0.5 px-1 bg-emerald-50/40 text-center">{isKn ? 'ಅಂಕ' : 'Mark'}</th>
                      <th className="border border-slate-900 py-0.5 px-1 bg-emerald-50/40 text-center">{isKn ? 'ಶ್ರೇಣಿ' : 'Grd'}</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800 text-slate-950 font-medium font-mono">
                    {consolidatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={18} className="py-12 text-center text-slate-500 font-bold font-sans">
                          {isKn
                            ? 'ಈ ತರಗತಿಗೆ ಯಾವುದೇ ವಿದ್ಯಾರ್ಥಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ (No students found for selected class).'
                            : 'No students enrolled for selected class standard.'}
                        </td>
                      </tr>
                    ) : (
                      consolidatedRows.map((r) => (
                        <tr key={r.student.id} className="hover:bg-slate-50 transition h-7 text-center">
                          {/* Sl. No */}
                          <td className="border border-slate-900 py-1 px-1 font-bold">{r.slNo}</td>

                          {/* SATS No */}
                          <td className="border border-slate-900 py-1 px-1 font-bold whitespace-nowrap">{r.satsNo}</td>

                          {/* Student Name */}
                          <td className="border border-slate-900 py-1 px-2 text-left font-sans font-bold uppercase truncate max-w-[170px]">
                            {r.name}
                          </td>

                          {/* DOB */}
                          <td className="border border-slate-900 py-1 px-1 whitespace-nowrap text-[9px] sm:text-[10px]">{r.dob}</td>

                          {/* Gender */}
                          <td className="border border-slate-900 py-1 px-1 font-sans font-bold">{r.gender}</td>

                          {/* Category */}
                          <td className="border border-slate-900 py-1 px-1 font-sans font-bold">{r.category}</td>

                          {/* Kannada Mark & Grade */}
                          <td className="border border-slate-900 py-1 px-1 font-bold bg-blue-50/20">{r.kannada.mark}</td>
                          <td className="border border-slate-900 py-1 px-1 font-black text-blue-900 bg-blue-50/30">{r.kannada.grade}</td>

                          {/* English Mark & Grade */}
                          <td className="border border-slate-900 py-1 px-1 font-bold bg-purple-50/20">{r.english.mark}</td>
                          <td className="border border-slate-900 py-1 px-1 font-black text-purple-900 bg-purple-50/30">{r.english.grade}</td>

                          {/* Math Mark & Grade */}
                          <td className="border border-slate-900 py-1 px-1 font-bold bg-amber-50/20">{r.mathematics.mark}</td>
                          <td className="border border-slate-900 py-1 px-1 font-black text-amber-900 bg-amber-50/30">{r.mathematics.grade}</td>

                          {/* EVS Mark & Grade */}
                          <td className="border border-slate-900 py-1 px-1 font-bold bg-emerald-50/20">{r.evs.mark}</td>
                          <td className="border border-slate-900 py-1 px-1 font-black text-emerald-900 bg-emerald-50/30">{r.evs.grade}</td>

                          {/* TOTAL */}
                          <td className="border border-slate-900 py-1 px-1 font-black text-slate-950 bg-slate-100 font-mono text-[11px]">
                            {r.totalMarks}
                          </td>

                          {/* PERCENTAGE */}
                          <td className="border border-slate-900 py-1 px-1 font-bold text-slate-900">{r.percentage}%</td>

                          {/* OVERALL GRADE */}
                          <td className="border border-slate-900 py-1 px-1 font-black text-slate-950 bg-slate-100">
                            {r.overallGrade}
                          </td>

                          {/* CO-SCHOLASTIC ACTIVITIES */}
                          <td className="border border-slate-900 py-1 px-1 font-black text-indigo-900">
                            {r.coScholasticGrade}
                          </td>

                          {/* RESULT */}
                          <td className={`border border-slate-900 py-1 px-1 font-sans font-black ${r.isPassed ? 'text-emerald-900 bg-emerald-50/50' : 'text-rose-900 bg-rose-50/50'}`}>
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
                SECTION 27: BOTTOM SIGNATURES (NO BOX / NO TABLE / CLEAN)
                BOTTOM LEFT: CLASS TEACHER SIGN
                BOTTOM RIGHT: HEAD MASTER SIGN
                ======================================================== */}
            <div className="w-full flex items-end justify-between pt-8 pb-1 text-xs font-black text-slate-900">
              {/* Bottom Left: Class Teacher Sign */}
              <div className="text-left space-y-1">
                <div className="h-6" /> {/* Reserved area for handwritten signature */}
                <p className="text-xs uppercase tracking-wide">
                  {isKn ? 'ವರ್ಗ ಶಿಕ್ಷಕರ ಸಹಿ' : 'Class Teacher sign'}
                </p>
                <p className="font-bold text-slate-800">
                  {classTeacherName}
                </p>
              </div>

              {/* Bottom Right: Headmaster Sign */}
              <div className="text-right space-y-1">
                <div className="h-6" /> {/* Reserved area for seal/signature */}
                <p className="text-xs uppercase tracking-wide">
                  {isKn ? 'ಮುಖ್ಯ ಗುರುಗಳ ಸಹಿ' : 'Head Master sign'}
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
