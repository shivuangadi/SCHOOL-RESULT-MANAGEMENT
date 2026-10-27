import React, { useState, useMemo } from 'react';
import { SchoolRecord, isCwsnExempted, isCwsnStudent } from '../../types';
import {
  ComputedHpStudent,
  HpSubjectCode,
  HP_CO_ACTIVITIES,
  calculateHpGrade,
  getHpSubjectsForMedium,
  getHpCoGradeValue,
} from '../../utils/higherPrimaryCceHelper';
import {
  downloadElementAsHtml,
  printHpCcePage2_9Line,
  exportHpCcePage2_9LinePdf,
  shareReportToWhatsApp,
  ReportPaperSize,
} from '../../utils/printPdfHelper';
import { getSavedClassTeacher } from '../../utils/teacherHelper';
import { FileCode, Download, Printer, Share2 } from 'lucide-react';
import { handleTableGridNavigation } from '../../utils/tableNavigationHelper';

interface HpCcePage2Register9LineProps {
  computedList: ComputedHpStudent[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  selectedClass: string;
  classTeacherName: string;
  workingDays: number;
  reportRef?: React.RefObject<HTMLDivElement | null>;
  onUpdateMarks?: (studentId: string, subCode: HpSubjectCode, field: string, val: number | null) => void;
  onUpdateExamPct?: (studentId: string, subCode: HpSubjectCode, exam: 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2', val: number | null) => void;
  onUpdateSubject100?: (studentId: string, subCode: HpSubjectCode, total100: number | null) => void;
  onUpdateAttendance?: (studentId: string, days: number) => void;
  onUpdateSemAttendance?: (studentId: string, sem: 'sem1' | 'sem2', days: number) => void;
  onUpdateCoGrade?: (studentId: string, sem: 'sem1' | 'sem2' | 'final', key: string, val: string) => void;
  onUpdatePartBMarks?: (studentId: string, subjectKey: string, sem: 'sem1' | 'sem2' | 'total', val: number | null) => void;
}

export const HpCcePage2Register9Line: React.FC<HpCcePage2Register9LineProps> = ({
  computedList,
  schoolRecord,
  academicYear,
  selectedClass,
  classTeacherName,
  workingDays,
  reportRef,
  onUpdateMarks,
  onUpdateExamPct,
  onUpdateSubject100,
  onUpdateAttendance,
  onUpdateSemAttendance,
  onUpdateCoGrade,
  onUpdatePartBMarks,
}) => {
  const [studentsPerPage, setStudentsPerPage] = useState<number>(3);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const medium = schoolRecord?.schoolMedium || 'Kannada';
  const isKannada =
    medium.toLowerCase().includes('kannada') ||
    medium.includes('ಕನ್ನಡ') ||
    !medium;
  const subjects = getHpSubjectsForMedium(medium);

  // 36 Columns exact percentages summing to 100.0%
  // 3rd column decreased to 7.2%, last column decreased to 2.8%
  // Freed width distributed to subject grade columns and Part B activities (2.2% each)
  const colWeights = useMemo(() => [
    2.0,  // 1. Sl No
    2.4,  // 2. Adm / Reg No
    7.2,  // 3. Student Name & Details (Decreased by 2.6% from 9.8%)
    3.2,  // 4. Days Attended
    3.0,  // 5. Evaluation Period
    2.8,  // 6. Percentage
    // 7 to 20: 7 Curricular Subjects x 2 cols (Marks 2.7%, Grade 2.7% = 5.4% each x 7 = 37.8%)
    2.7, 2.7, // Subject 1
    2.7, 2.7, // Subject 2
    2.7, 2.7, // Subject 3
    2.7, 2.7, // Subject 4
    2.7, 2.7, // Subject 5
    2.7, 2.7, // Subject 6
    2.7, 2.7, // Subject 7
    2.6,  // 21. Max Marks (700)
    3.8,  // 22. Total Secured Marks
    3.8,  // 23. Total Percentage (%)
    2.8,  // 24. Overall Grade
    2.6, 2.6, // 25, 26. Part B Art Education (Marks 2.6%, Grade 2.6%)
    2.6, 2.6, // 27, 28. Part B Computer / ICT (Marks 2.6%, Grade 2.6%)
    // 29 to 35: 7 Co-Scholastic Activities (2.2% each = 15.4%)
    2.2, 2.2, 2.2, 2.2, 2.2, 2.2, 2.2,
    2.8,  // 36. Result (Decreased to 2.8%)
  ], []);

  const effectiveTeacherName =
    (classTeacherName &&
     classTeacherName !== 'ಶ್ರೀ ಎಸ್ ಆರ್ ಅಂಗಡಿ' &&
     classTeacherName !== 'ವರ್ಗ ಶಿಕ್ಷಕರು'
      ? classTeacherName
      : '') ||
    getSavedClassTeacher(schoolRecord, selectedClass) ||
    '';

  // Group students into chunks strictly per sheet following the user's multiple-of-3 rule
  // (matching 1-5 9-line consolidation):
  // When total students is multiple of 3, penultimate page has 2 students, last page has 1 student
  // and below the table on the last page, the signatures & Part B subject info are placed cleanly!
  const chunks = useMemo(() => {
    const total = computedList.length;
    if (total === 0) return [[]];

    if (studentsPerPage === 3 && total % 3 === 0 && total >= 3) {
      const res: ComputedHpStudent[][] = [];
      const fullPages = Math.floor(total / 3) - 1; // pages with 3 students each
      for (let p = 0; p < fullPages; p++) {
        res.push(computedList.slice(p * 3, p * 3 + 3));
      }
      const start = fullPages * 3;
      res.push(computedList.slice(start, start + 2)); // penultimate page: 2 students
      res.push(computedList.slice(start + 2, start + 3)); // final page: 1 student
      return res;
    }

    const res: ComputedHpStudent[][] = [];
    for (let i = 0; i < total; i += studentsPerPage) {
      res.push(computedList.slice(i, i + studentsPerPage));
    }
    return res.length > 0 ? res : [[]];
  }, [computedList, studentsPerPage]);

  const chunkStartIndices = useMemo(() => {
    const indices: number[] = [];
    let current = 0;
    for (const c of chunks) {
      indices.push(current);
      current += c.length;
    }
    return indices;
  }, [chunks]);

  const talukName = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
  const [paperSize, setPaperSize] = useState<ReportPaperSize>('legal');

  const schoolName = schoolRecord?.schoolName || 'ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ';

  const handlePrint = () => {
    if (reportRef?.current) {
      const sName = schoolName.replace(/\s+/g, '_');
      const docTitle = `${sName}_Class_${selectedClass}_${academicYear}_9Line_Consolidation_${paperSize.toUpperCase()}`;
      printHpCcePage2_9Line(reportRef.current, docTitle, paperSize);
    }
  };

  const handleDownloadPdf = async () => {
    if (reportRef?.current) {
      setIsExportingPdf(true);
      setStatusMessage('PDF ಸಿದ್ಧವಾಗುತ್ತಿದೆ... / Generating PDF...');
      try {
        const sName = schoolName.replace(/\s+/g, '_');
        const filename = `${sName}_Class_${selectedClass}_${academicYear}_9Line_Consolidation_${paperSize.toUpperCase()}`;
        await exportHpCcePage2_9LinePdf(reportRef.current, filename, paperSize);
        setStatusMessage('PDF ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!');
      } catch (err) {
        console.error('PDF error:', err);
        setStatusMessage('PDF ಡೌನ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ');
      } finally {
        setIsExportingPdf(false);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    }
  };

  const handleDownloadHtml = () => {
    if (reportRef?.current) {
      const sName = schoolName.replace(/\s+/g, '_');
      const filename = `${sName}_Class_${selectedClass}_${academicYear}_9Line_Consolidation_LEGAL`;
      downloadElementAsHtml(reportRef.current, filename, 'legal');
      setStatusMessage('HTML ಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleShareWhatsApp = async () => {
    if (reportRef?.current) {
      const sName = schoolName.replace(/\s+/g, '_');
      const filename = `${sName}_Class_${selectedClass}_${academicYear}_9Line_Consolidation`;
      const summary = `*${schoolName}*\n*Classes 6-8 9-Line Consolidation Register (9 ಸಾಲಿನ ಕ್ರೋಢೀಕೃತ ವರದಿ)*\nClass: ${selectedClass}th Standard\nAcademic Year: ${academicYear}\nTotal Students: ${computedList.length}`;
      setStatusMessage('📱 WhatsApp ಚಿತ್ರಗಳು ಸಿದ್ಧವಾಗುತ್ತಿವೆ (ಪ್ರತಿ ಪುಟ ಪ್ರತ್ಯೇಕ ಚಿತ್ರ)...');
      await shareReportToWhatsApp(reportRef.current, summary, filename);
      setStatusMessage('✅ WhatsApp ಹಂಚಿಕೆ ಯಶಸ್ವಿಯಾಗಿದೆ!');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div ref={reportRef} className="space-y-6 legal-landscape cce-9line-container">
      {/* Scoped Print and PDF B&W Styles for 6-8 9-Line Consolidation Report Only */}
      <style>{`
        /* Suppress all scrollbars completely to eliminate horizontal & vertical navigation bars */
        ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }

        /* Screen UI: Full color retained as defined in Tailwind classes */

        /* PDF and Print Visibility Toggle: screen inputs vs clean centered text */
        .cce-screen-input {
          display: block;
          text-align: center !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          color: #000000 !important;
        }
        .cce-pdf-text {
          display: none !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          color: #000000 !important;
        }

        /* Active PDF Generation Mode (.cce-pdf-mode) */
        .cce-pdf-mode .cce-screen-input {
          display: none !important;
        }
        .cce-pdf-mode .cce-pdf-text {
          display: block !important;
          text-align: center !important;
          margin: 0 auto !important;
          width: 100% !important;
          line-height: 1.1 !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          color: #000000 !important;
        }

        /* Global Compact Table & Input Styles for 9-Line Consolidation */
        .cce-9line-sheet {
          overflow: hidden !important;
        }
        .cce-9line-sheet table {
          margin: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
        }
        .cce-9line-sheet th,
        .cce-9line-sheet td {
          padding: 0 !important;
          line-height: 1.1 !important;
          box-sizing: border-box !important;
          text-align: center !important;
        }
        .cce-screen-input {
          height: 5.33mm !important;
          max-height: 5.33mm !important;
          line-height: 5.33mm !important;
          padding: 0 !important;
          margin: 0 !important;
          text-align: center !important;
          vertical-align: middle !important;
        }
        input[type="number"], input {
          text-align: center !important;
        }
        .student-tbody {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          display: table-row-group !important;
        }
        .student-tbody tr {
          height: 5.33mm !important;
          min-height: 5.33mm !important;
          max-height: 5.33mm !important;
          box-sizing: border-box !important;
        }

        @media print {
          @page {
            size: ${paperSize === 'a4' ? 'A4' : 'legal'} landscape !important;
            margin: 0 !important;
          }
          .cce-screen-input {
            display: none !important;
          }
          .cce-pdf-text {
            display: block !important;
            text-align: center !important;
            vertical-align: middle !important;
            margin: 0 auto !important;
            width: 100% !important;
            line-height: 1.1 !important;
            font-weight: 700 !important;
            color: #000000 !important;
          }
          .cce-9line-sheet {
            padding-left: 20mm !important;
            padding-right: 6.5mm !important;
            padding-top: 6.5mm !important;
            padding-bottom: 3.5mm !important;
            margin: 0 !important;
            margin-bottom: 0 !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            break-after: page !important;
            page-break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: hidden !important;
          }
          .cce-9line-sheet:last-child {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
          .cce-9line-sheet table {
            margin: 0 !important;
            table-layout: fixed !important;
            width: 100% !important;
          }
          .cce-9line-sheet th,
          .cce-9line-sheet td {
            padding: 0 !important;
            line-height: 1.1 !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* Top Configuration, Pagination & Quick Export Bar (Hidden in Print) */}
      <div className="bg-slate-900 text-white p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs print:hidden shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-amber-300">📄 ಪುಟ ವಿನ್ಯಾಸ (Page Setup):</span>
          {/* Paper Size Selector */}
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1">
            <span className="text-slate-400 text-[11px] font-bold">ಹಾಳೆಯ ಗಾತ್ರ:</span>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as ReportPaperSize)}
              className="bg-slate-900 text-amber-300 font-bold px-1.5 py-0.5 rounded focus:outline-none cursor-pointer text-xs"
            >
              <option value="legal">Legal Landscape (355.6mm × 215.9mm)</option>
              <option value="a4">A4 Landscape (297mm × 210mm)</option>
            </select>
          </div>
          <span>ಒಂದು ಪುಟಕ್ಕೆ ವಿದ್ಯಾರ್ಥಿಗಳು:</span>
          <select
            value={studentsPerPage}
            onChange={(e) => setStudentsPerPage(Number(e.target.value))}
            className="bg-slate-800 text-amber-300 font-bold border border-slate-600 rounded px-2.5 py-1 cursor-pointer focus:outline-none"
          >
            <option value={3}>3 ವಿದ್ಯಾರ್ಥಿಗಳು / ಪುಟ (3 Students/Page - Official Standard)</option>
            <option value={2}>2 ವಿದ್ಯಾರ್ಥಿಗಳು / ಪುಟ (2 Students/Page)</option>
            <option value={1}>1 ವಿದ್ಯಾರ್ಥಿ / ಪುಟ (1 Student/Page)</option>
          </select>
          <span className="text-slate-400 text-[11px] ml-1">
            (3 ರ ಗುಣಕವಾಗಿದ್ದರೆ ಕೊನೆಯ ಹಿಂದಿನ ಪುಟದಲ್ಲಿ 2, ಕೊನೆಯ ಪುಟದಲ್ಲಿ 1 ವಿದ್ಯಾರ್ಥಿ + ಸಹಿ + ಭಾಗ-ಬಿ ವಿವರ)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-slate-300 text-[11px] mr-2">
            ಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು: <span className="font-mono text-white font-black">{computedList.length}</span> • 
            ಒಟ್ಟು ಪುಟಗಳು: <span className="font-mono text-amber-300 font-black">{chunks.length}</span> ({paperSize.toUpperCase()})
          </div>

          {/* WhatsApp Share Button */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
            title="Download every page as separate clear image and share to WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5 text-white" />
            <span>WhatsApp ಹಂಚಿಕೊಳ್ಳಿ</span>
          </button>

          {/* HTML Download Button */}
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
            title="Download Standalone Printable HTML file for manual margin adjustments"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-200" />
            <span>HTML ಡೌನ್‌ಲೋಡ್</span>
          </button>

          {/* PDF Download Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
            title="Download PDF in Legal Landscape"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingPdf ? 'ಸಿದ್ಧವಾಗುತ್ತಿದೆ...' : 'PDF ಡೌನ್‌ಲೋಡ್'}</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
            title="Print 9-Line Consolidation Report directly"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>ಮುದ್ರಿಸಿ (Print)</span>
          </button>
        </div>
      </div>

      {/* Status Message Notification */}
      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-3 py-2 rounded-xl text-center font-bold print:hidden">
          {statusMessage}
        </div>
      )}

      {/* Pages rendering */}
      {chunks.map((chunk, pageIdx) => (
        <div
          key={pageIdx}
          style={{
            width: paperSize === 'a4' ? '297mm' : '355.6mm',
            minHeight: paperSize === 'a4' ? '210mm' : '215.9mm',
            paddingLeft: '20mm',
            paddingRight: '6.5mm',
            paddingTop: '6.5mm',
            paddingBottom: '3.5mm',
            boxSizing: 'border-box',
          }}
          className="report-page-sheet cce-9line-sheet bg-white rounded-2xl border border-slate-300 shadow-sm space-y-1 break-after-page mb-6 mx-auto print:border-none print:shadow-none print:rounded-none"
        >
          <div
            className="cce-sheet-container"
            style={{
              marginLeft: '0mm',
              marginRight: '0mm',
              marginTop: '0mm',
              marginBottom: '0mm',
              paddingLeft: '0px',
              paddingRight: '0px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
          {/* Header matching 1-5 500 marks consolidation */}
          <div
            className="relative border-b-2 border-black pb-0.5 text-black flex items-center justify-center text-center"
            style={{ height: '1.25cm', maxHeight: '1.25cm', boxSizing: 'border-box' }}
          >
            <div className="text-center px-2 flex-1 flex flex-col justify-center h-full space-y-0.5 overflow-hidden">
              <h2 className="text-[11px] font-black text-black font-serif leading-tight uppercase truncate">
                {isKannada
                  ? `ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ, ${talukName}`
                  : `OFFICE OF THE BLOCK EDUCATION OFFICER & BRC, ${talukName.toUpperCase()}`}
              </h2>
              <h3 className="text-[12.5px] font-black text-black leading-tight uppercase truncate">
                {schoolName}
                {schoolRecord?.diseCode ? ` • ${isKannada ? 'ಯು-ಡೈಸ್' : 'DISE'}: ${schoolRecord.diseCode}` : ''}
              </h3>
              <p className="text-[11px] font-black text-black leading-tight truncate">
                {isKannada
                  ? `${academicYear} ನೇ ಸಾಲಿನ ೬ ರಿಂದ ೮ ನೇ ತರಗತಿಗಳ ಸಿಸಿಇ ೯-ಸಾಲುಗಳ ವಾರ್ಷಿಕ ಫಲಿತಾಂಶ ಕ್ರೋಢೀಕರಣ ವಹಿ`
                  : `CCE CONTINUOUS COMPREHENSIVE EVALUATION (CLASSES 6 TO 8) - 9-LINE CONSOLIDATION REGISTER - ${academicYear}`}
              </p>
            </div>
          </div>

          {/* Subheader: Class, Year, Class Teacher's Name, Working Days in ONE row on a single line */}
          <div
            className="w-full flex flex-row flex-nowrap justify-between items-center text-[10px] font-bold text-black border-b border-black py-0.5 px-1 mt-0.5 mb-1 whitespace-nowrap"
            style={{ boxSizing: 'border-box', whiteSpace: 'nowrap', lineHeight: 1.2 }}
          >
            <div className="text-left whitespace-nowrap shrink-0">
              {isKannada ? 'ತರಗತಿ' : 'Class'}: <span className="font-black">{selectedClass}{isKannada ? 'ನೇ ತರಗತಿ' : 'th Standard'}</span> | {isKannada ? 'ಶೈಕ್ಷಣಿಕ ವರ್ಷ' : 'Year'}: <span className="font-mono font-black">{academicYear}</span>
            </div>
            <div className="text-center font-bold whitespace-nowrap shrink-0">
              {isKannada ? 'ವರ್ಗ ಶಿಕ್ಷಕರ ಹೆಸರು' : "CLASS TEACHER'S NAME"}: <span className="font-black uppercase">{effectiveTeacherName || '____________________'}</span>
            </div>
            <div className="text-right whitespace-nowrap shrink-0">
              {isKannada ? 'ಶಾಲಾ ಕರ್ತವ್ಯ ದಿನಗಳು' : 'Working Days'}: <span className="font-mono font-black">{workingDays || 241}</span>
            </div>
          </div>

          {/* 9-Line Consolidation Table: 36 Percentage-Based Columns, Pure Black & White */}
          <div className="w-full overflow-hidden" style={{ boxSizing: 'border-box' }}>
            <table
              className="w-full text-[7.5px] sm:text-[8px] text-center border-collapse border-2 border-black bg-white text-black table-fixed"
              style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
              onKeyDown={handleTableGridNavigation}
            >
              <colgroup>
                {colWeights.map((w, idx) => (
                  <col key={idx} style={{ width: `${w}%` }} />
                ))}
              </colgroup>
              <thead style={{ height: '14mm', maxHeight: '14mm' }}>
                {/* Header Row 1 - Height 5.0mm */}
                <tr className="bg-white font-black text-black border-b border-black" style={{ height: '5.0mm', maxHeight: '5.0mm', boxSizing: 'border-box' }}>
                  {/* 1. Sl No */}
                  <th rowSpan={3} className="border border-black p-0.5 align-middle bg-white text-black overflow-hidden" style={{ height: '14mm', maxHeight: '14mm', boxSizing: 'border-box' }}>
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '13mm' }} className="inline-block whitespace-nowrap py-0.5 mx-auto font-black text-[7.5px]">
                      {isKannada ? 'ಕ್ರ. ಸಂಖ್ಯೆ' : 'Sl. No.'}
                    </span>
                  </th>

                  {/* 2. Admission / Reg No */}
                  <th rowSpan={3} className="border border-black p-0.5 align-middle bg-white text-black overflow-hidden" style={{ height: '14mm', maxHeight: '14mm', boxSizing: 'border-box' }}>
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '13mm' }} className="inline-block whitespace-nowrap py-0.5 mx-auto font-black text-[7.5px]">
                      {isKannada ? 'ದಾಖಲಾತಿ ಸಂಖ್ಯೆ' : 'Adm. / Reg No.'}
                    </span>
                  </th>

                  {/* 3. Student Name */}
                  <th rowSpan={3} className="border border-black p-0.5 align-middle font-black text-black overflow-hidden" style={{ height: '14mm', maxHeight: '14mm', boxSizing: 'border-box' }}>
                    <div className="leading-tight text-[7.5px] break-words">
                      {isKannada ? 'ವಿದ್ಯಾರ್ಥಿಗಳ ಹೆಸರು' : 'Student Name'}
                    </div>
                  </th>

                  {/* 4. Days Attended */}
                  <th rowSpan={3} className="border border-black p-0.5 align-middle bg-white text-black overflow-hidden" style={{ height: '14mm', maxHeight: '14mm', boxSizing: 'border-box' }}>
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '13mm' }} className="inline-block whitespace-nowrap py-0.5 mx-auto font-black text-[7px]">
                      {isKannada ? 'ಹಾಜರಾದ ದಿನಗಳು' : 'Days Attended'}
                    </span>
                  </th>

                  {/* 5. Evaluation Period */}
                  <th rowSpan={3} className="border border-black p-0.5 align-middle bg-white text-black overflow-hidden" style={{ height: '14mm', maxHeight: '14mm', boxSizing: 'border-box' }}>
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '13mm' }} className="inline-block whitespace-nowrap py-0.5 mx-auto font-black text-[6.5px]">
                      {isKannada ? 'ಮೌಲ್ಯಮಾಪನ' : 'Evaluation'}
                    </span>
                  </th>

                  {/* 6. Percentage */}
                  <th rowSpan={3} className="border border-black p-0.5 align-middle bg-white text-black overflow-hidden" style={{ height: '14mm', maxHeight: '14mm', boxSizing: 'border-box' }}>
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '13mm' }} className="inline-block whitespace-nowrap py-0.5 mx-auto font-black text-[6.5px]">
                      {isKannada ? 'ಶೇಕಡಾ' : 'Percentage'}
                    </span>
                  </th>

                  {/* 7. Curricular Subjects Group Header */}
                  <th colSpan={14} className="border border-black p-0.5 bg-white text-black font-black text-[8.5px] border-r-2 border-r-black overflow-hidden leading-tight" style={{ height: '5.0mm', maxHeight: '5.0mm', boxSizing: 'border-box' }}>
                    {isKannada ? 'ಅ. ವಿದ್ಯಾರ್ಥಿಯ ಶೈಕ್ಷಣಿಕ ಸಾಧನೆ ಪಠ್ಯ ವಿಷಯಗಳಿಗೆ ಸಂಬಂಧಿಸಿದಂತೆ' : "A. Student's Academic Achievement in Curricular Subjects"}
                  </th>

                  {/* 8. Max Marks (700) */}
                  <th rowSpan={3} className="border border-black p-0.5 align-middle bg-white text-black font-black overflow-hidden" style={{ height: '14mm', maxHeight: '14mm', boxSizing: 'border-box' }}>
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '13mm' }} className="inline-block whitespace-nowrap py-0.5 mx-auto font-black text-[7.5px]">
                      {isKannada ? 'ಗರಿಷ್ಠ 700' : 'Max 700'}
                    </span>
                  </th>

                  {/* 9. Total Header */}
                  <th colSpan={3} className="border border-black p-0.5 bg-white font-black text-black text-[8.5px] overflow-hidden leading-tight" style={{ height: '5.0mm', maxHeight: '5.0mm', boxSizing: 'border-box' }}>
                    {isKannada ? 'ಒಟ್ಟು ಪಡೆದ ಅಂಕಗಳು' : 'Total Marks Secured'}
                  </th>

                  {/* 10. Part B Header */}
                  <th colSpan={11} className="border border-black p-0.5 bg-white text-black font-black text-[8.5px] border-l-2 border-l-black overflow-hidden leading-tight" style={{ height: '5.0mm', maxHeight: '5.0mm', boxSizing: 'border-box' }}>
                    {isKannada ? 'ಆ. ಸಹ ಪಠ್ಯ ವಿಷಯಗಳು & ಶ್ರೇಣಿಗಳು (ಭಾಗ-ಬಿ)' : 'B. Co-Curricular Activities & Grades (Part-B)'}
                  </th>

                  {/* 11. Result Header */}
                  <th rowSpan={3} className="border border-black p-0.5 align-middle bg-white text-black font-black overflow-hidden" style={{ height: '14mm', maxHeight: '14mm', boxSizing: 'border-box' }}>
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '13mm' }} className="inline-block whitespace-nowrap py-0.5 mx-auto font-black text-[8px]">
                      {isKannada ? 'ಫಲಿತಾಂಶ' : 'Result'}
                    </span>
                  </th>
                </tr>

                {/* Sub-Header Row 2 - Height 4.5mm */}
                <tr className="bg-white text-[7.5px] font-bold text-black border-b border-black" style={{ height: '4.5mm', maxHeight: '4.5mm', boxSizing: 'border-box' }}>
                  {/* 7 Curricular Subjects */}
                  {subjects.map((s) => (
                    <th key={s.code} colSpan={2} className="border border-black p-0.5 truncate font-black text-[7.5px] overflow-hidden" style={{ height: '4.5mm', maxHeight: '4.5mm', boxSizing: 'border-box' }}>
                      {isKannada ? s.nameKn : s.nameEn}
                    </th>
                  ))}

                  {/* Total Sub-columns */}
                  <th rowSpan={2} className="border border-black p-0.5 font-black bg-white text-black text-[7.5px] overflow-hidden" style={{ height: '9mm', maxHeight: '9mm', boxSizing: 'border-box' }}>
                    {isKannada ? 'ಅಂಕ' : 'Marks'}
                  </th>
                  <th rowSpan={2} className="border border-black p-0.5 font-black bg-white text-black text-[7.5px] overflow-hidden" style={{ height: '9mm', maxHeight: '9mm', boxSizing: 'border-box' }}>
                    {isKannada ? 'ಶೇಕಡಾ' : '%'}
                  </th>
                  <th rowSpan={2} className="border border-black p-0.5 font-black bg-white text-black text-[7.5px] overflow-hidden" style={{ height: '9mm', maxHeight: '9mm', boxSizing: 'border-box' }}>
                    {isKannada ? 'ಶ್ರೇಣಿ' : 'Grade'}
                  </th>

                  {/* Part B Subject 1: Art Edu / Work Exp */}
                  <th colSpan={2} className="border border-black p-0.5 bg-white text-black font-black text-[7px] overflow-hidden leading-tight" style={{ height: '4.5mm', maxHeight: '4.5mm', boxSizing: 'border-box' }}>
                    {isKannada ? <>ಕಲಾ ಶಿಕ್ಷಣ /<br />ಕಾರ್ಯಾನುಭವ</> : <>Art Edu. /<br />Work Exp.</>}
                  </th>

                  {/* Part B Subject 2: Computer / ICT */}
                  <th colSpan={2} className="border border-black p-0.5 bg-white text-black font-black text-[7px] overflow-hidden leading-tight" style={{ height: '4.5mm', maxHeight: '4.5mm', boxSizing: 'border-box' }}>
                    {isKannada ? <>ಕಂಪ್ಯೂಟರ್<br />ಶಿಕ್ಷಣ (ICT)</> : <>Computer<br />Edu. (ICT)</>}
                  </th>

                  {/* 7 Co-Scholastic Activities - ONLY NUMBERS 1, 2, 3, 4, 5, 6, 7 */}
                  {HP_CO_ACTIVITIES.map((act) => (
                    <th
                      key={act.key}
                      rowSpan={2}
                      className="border border-black p-0.5 align-middle text-center font-black bg-white text-black text-[9.5px] overflow-hidden"
                      title={`${act.num}. ${isKannada ? act.nameKn : act.nameEn}`}
                      style={{ height: '9mm', maxHeight: '9mm', boxSizing: 'border-box' }}
                    >
                      {act.num}
                    </th>
                  ))}
                </tr>

                {/* Sub-Header Row 3 - Height 4.5mm: Marks & Grade */}
                <tr className="bg-white text-[7px] font-black text-black border-b-2 border-black" style={{ height: '4.5mm', maxHeight: '4.5mm', boxSizing: 'border-box' }}>
                  {subjects.map((s) => (
                    <React.Fragment key={s.code}>
                      <th className="border border-black p-0.5 overflow-hidden" style={{ height: '4.5mm', maxHeight: '4.5mm', boxSizing: 'border-box' }}>
                        {isKannada ? 'ಅಂಕ' : 'Marks'}
                      </th>
                      <th className="border border-black p-0.5 overflow-hidden" style={{ height: '4.5mm', maxHeight: '4.5mm', boxSizing: 'border-box' }}>
                        {isKannada ? 'ಶ್ರೇಣಿ' : 'Grade'}
                      </th>
                    </React.Fragment>
                  ))}
                  {/* Art Edu subheaders */}
                  <th className="border border-black p-0.5 bg-white text-black overflow-hidden" style={{ height: '4.5mm', maxHeight: '4.5mm', boxSizing: 'border-box' }}>
                    {isKannada ? 'ಅಂಕ' : 'Marks'}
                  </th>
                  <th className="border border-black p-0.5 bg-white text-black overflow-hidden" style={{ height: '4.5mm', maxHeight: '4.5mm', boxSizing: 'border-box' }}>
                    {isKannada ? 'ಶ್ರೇಣಿ' : 'Grade'}
                  </th>
                  {/* Computer Edu subheaders */}
                  <th className="border border-black p-0.5 bg-white text-black overflow-hidden" style={{ height: '4.5mm', maxHeight: '4.5mm', boxSizing: 'border-box' }}>
                    {isKannada ? 'ಅಂಕ' : 'Marks'}
                  </th>
                  <th className="border border-black p-0.5 bg-white text-black overflow-hidden" style={{ height: '4.5mm', maxHeight: '4.5mm', boxSizing: 'border-box' }}>
                    {isKannada ? 'ಶ್ರೇಣಿ' : 'Grade'}
                  </th>
                </tr>
              </thead>

                {chunk.map((cSt, stIdx) => {
                  const st = cSt.student;
                  const isMarksAllowed = st.cwsnStatus === 'MARKS_ALLOWED' || st.cwsnStatus === 'YES_MARKS';
                  const isExempt = isMarksAllowed ? false : (cSt.isExempted || isCwsnExempted(st.cwsnStatus));
                  const hasCwsnBadge = isCwsnStudent(st.cwsnStatus) || cSt.isExempted;
                  let prevCount = 0;
                  for (let p = 0; p < pageIdx; p++) {
                    prevCount += chunks[p].length;
                  }
                  const globalIdx = prevCount + stIdx;
                  const artSub = cSt.partBSubjects?.art_workexp;
                  const ictSub = cSt.partBSubjects?.ict_computer;

                  // 9 Detailed Rows Data per Student (matching official 6-8 format)
                  // Prescribed maximum marks: FA1-4 (10), SA1-2 (30), Sem 1 & 2 Totals (50), Final Total (100)
                  const rowsData = [
                    // Sem 1: FA1 (10%), FA2 (10%), SA1 (30%), Sem 1 Total (50%)
                    { exam: isKannada ? 'ರೂ-1' : 'FA-1', pct: '10%', maxMarks: 70, subExamKey: 'fa1' as const, prescribedMax: 10, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: isKannada ? 'ರೂ-2' : 'FA-2', pct: '10%', maxMarks: 70, subExamKey: 'fa2' as const, prescribedMax: 10, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: isKannada ? 'ಸಂ-1' : 'SA-1', pct: '30%', maxMarks: 210, subExamKey: 'sa1' as const, prescribedMax: 30, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: isKannada ? 'ಒಟ್ಟು' : 'Total', pct: '50%', maxMarks: 350, subExamKey: null, prescribedMax: 50, isSem1Total: true, isSem2Total: false, isFinalTotal: false },

                    // Sem 2: FA3 (10%), FA4 (10%), SA2 (30%), Sem 2 Total (50%)
                    { exam: isKannada ? 'ರೂ-3' : 'FA-3', pct: '10%', maxMarks: 70, subExamKey: 'fa3' as const, prescribedMax: 10, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: isKannada ? 'ರೂ-4' : 'FA-4', pct: '10%', maxMarks: 70, subExamKey: 'fa4' as const, prescribedMax: 10, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: isKannada ? 'ಸಂ-2' : 'SA-2', pct: '30%', maxMarks: 210, subExamKey: 'sa2' as const, prescribedMax: 30, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: isKannada ? 'ಒಟ್ಟು' : 'Total', pct: '50%', maxMarks: 350, subExamKey: null, prescribedMax: 50, isSem1Total: false, isSem2Total: true, isFinalTotal: false },

                    // Final Total: 100%
                    { exam: isKannada ? 'ಒಟ್ಟು' : 'Annual', pct: '100%', maxMarks: 700, subExamKey: null, prescribedMax: 100, isSem1Total: false, isSem2Total: false, isFinalTotal: true },
                  ];

                  // Precompute assessment totals across the 7 subjects
                  const calcAssessmentTotal = (key: 'fa1_pct' | 'fa2_pct' | 'sa1_pct' | 'sem1_total' | 'fa3_pct' | 'fa4_pct' | 'sa2_pct' | 'sem2_total' | 'total100') => {
                    let total = 0;
                    let hasAny = false;
                    subjects.forEach((s) => {
                      const sub = cSt.subjects[s.code];
                      const v = sub ? (sub as any)[key] : null;
                      if (v !== null && v !== undefined && !isNaN(v)) {
                        total += Number(v);
                        hasAny = true;
                      }
                    });
                    return hasAny ? total : null;
                  };

                  const sumFa1 = calcAssessmentTotal('fa1_pct');
                  const sumFa2 = calcAssessmentTotal('fa2_pct');
                  const sumSa1 = calcAssessmentTotal('sa1_pct');
                  const sumSem1 = (sumFa1 !== null || sumFa2 !== null || sumSa1 !== null)
                    ? (sumFa1 || 0) + (sumFa2 || 0) + (sumSa1 || 0)
                    : calcAssessmentTotal('sem1_total');

                  const sumFa3 = calcAssessmentTotal('fa3_pct');
                  const sumFa4 = calcAssessmentTotal('fa4_pct');
                  const sumSa2 = calcAssessmentTotal('sa2_pct');
                  const sumSem2 = (sumFa3 !== null || sumFa4 !== null || sumSa2 !== null)
                    ? (sumFa3 || 0) + (sumFa4 || 0) + (sumSa2 || 0)
                    : calcAssessmentTotal('sem2_total');

                  const sumFinal = (sumSem1 !== null || sumSem2 !== null)
                    ? (sumSem1 || 0) + (sumSem2 || 0)
                    : (cSt.totalMarks700 || calcAssessmentTotal('total100'));

                  const formatRowPct = (val: number, max: number) => `${Number(((val / max) * 100).toFixed(1))}%`;

                  return (
                    <tbody key={st.id} className="student-tbody break-inside-avoid">
                      {rowsData.map((r, rIdx) => {
                        const isRow0 = rIdx === 0;
                        const isRow4 = rIdx === 4;
                        const isRow8 = rIdx === 8;
                        const isTotalRow = r.isSem1Total || r.isSem2Total || r.isFinalTotal;

                        // Total column calculations for this row
                        let rowTotalMarks: number | null = null;
                        let rowPctStr = '-';
                        let rowGrade = '-';

                        if (!isExempt) {
                          if (rIdx === 0 && sumFa1 !== null) {
                            rowTotalMarks = sumFa1;
                            rowPctStr = formatRowPct(sumFa1, 70);
                            rowGrade = calculateHpGrade(sumFa1, 70);
                          } else if (rIdx === 1 && sumFa2 !== null) {
                            rowTotalMarks = sumFa2;
                            rowPctStr = formatRowPct(sumFa2, 70);
                            rowGrade = calculateHpGrade(sumFa2, 70);
                          } else if (rIdx === 2 && sumSa1 !== null) {
                            rowTotalMarks = sumSa1;
                            rowPctStr = formatRowPct(sumSa1, 210);
                            rowGrade = calculateHpGrade(sumSa1, 210);
                          } else if (rIdx === 3 && sumSem1 !== null) {
                            rowTotalMarks = sumSem1;
                            rowPctStr = formatRowPct(sumSem1, 350);
                            rowGrade = calculateHpGrade(sumSem1, 350);
                          } else if (rIdx === 4 && sumFa3 !== null) {
                            rowTotalMarks = sumFa3;
                            rowPctStr = formatRowPct(sumFa3, 70);
                            rowGrade = calculateHpGrade(sumFa3, 70);
                          } else if (rIdx === 5 && sumFa4 !== null) {
                            rowTotalMarks = sumFa4;
                            rowPctStr = formatRowPct(sumFa4, 70);
                            rowGrade = calculateHpGrade(sumFa4, 70);
                          } else if (rIdx === 6 && sumSa2 !== null) {
                            rowTotalMarks = sumSa2;
                            rowPctStr = formatRowPct(sumSa2, 210);
                            rowGrade = calculateHpGrade(sumSa2, 210);
                          } else if (rIdx === 7 && sumSem2 !== null) {
                            rowTotalMarks = sumSem2;
                            rowPctStr = formatRowPct(sumSem2, 350);
                            rowGrade = calculateHpGrade(sumSem2, 350);
                          } else if (rIdx === 8 && sumFinal !== null) {
                            rowTotalMarks = sumFinal;
                            rowPctStr = formatRowPct(sumFinal, 700);
                            rowGrade = calculateHpGrade(sumFinal, 700);
                          }
                        } else if (rIdx === 8) {
                          rowTotalMarks = sumFinal !== null && sumFinal > 0 ? sumFinal : null;
                          rowGrade = 'Exempt';
                        }

                        return (
                          <tr
                            key={rIdx}
                            style={{ height: '5.33mm', minHeight: '5.33mm', maxHeight: '5.33mm', boxSizing: 'border-box', lineHeight: '1.0' }}
                            className="border-b border-black text-black bg-white"
                          >
                            {/* 1. Sl No - Spans 9 Rows (Height 48.0mm / 4.8cm - exactly 5.333mm x 9) */}
                            {isRow0 && (
                              <td rowSpan={9} style={{ height: '48.0mm', minHeight: '48.0mm', maxHeight: '48.0mm', boxSizing: 'border-box', borderBottom: '3px double #000000' }} className="border border-black p-0 font-mono font-bold align-middle bg-white text-black text-center overflow-hidden">
                                {globalIdx + 1}
                              </td>
                            )}

                            {/* 2. Registered No - Spans 9 Rows - Vertical Bottom to Top (Height 48.0mm / 4.8cm - No fake auto numbers) */}
                            {isRow0 && (
                              <td rowSpan={9} style={{ height: '48.0mm', minHeight: '48.0mm', maxHeight: '48.0mm', boxSizing: 'border-box', borderBottom: '3px double #000000' }} className="border border-black p-0 font-mono font-bold align-middle bg-white text-black text-center overflow-hidden">
                                <span
                                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '44mm' }}
                                  className="inline-block whitespace-nowrap text-center py-0.5 mx-auto text-[8.5px]"
                                >
                                  {st.schoolRegNo?.trim() || ''}
                                </span>
                              </td>
                            )}

                            {/* 3. Student Name & Meta Info - Spans 9 Rows (Height 48.0mm / 4.8cm) */}
                            {isRow0 && (
                              <td
                                rowSpan={9}
                                style={{ height: '48.0mm', minHeight: '48.0mm', maxHeight: '48.0mm', boxSizing: 'border-box', borderBottom: '3px double #000000' }}
                                className="border border-black p-0.5 text-center align-middle bg-white text-black overflow-hidden"
                              >
                                <div className="flex flex-col justify-center items-center text-center h-full py-0.2 space-y-0.5">
                                  {/* Student Name Aligned in Center, Multi-line - Font size 12 */}
                                  <div className="font-black text-black text-[12px] leading-tight tracking-tight text-center w-full px-0.5 break-words" title={st.studentName}>
                                    {(() => {
                                      const parts = (st.studentName || '').trim().split(/\s+/).filter(Boolean);
                                      if (parts.length <= 1) {
                                        return <div className="leading-tight break-words">{st.studentName}</div>;
                                      }
                                      if (parts.length === 2) {
                                        return (
                                          <div className="leading-tight break-words">
                                            <div className="leading-tight">{parts[0]}</div>
                                            <div className="leading-tight">{parts[1]}</div>
                                          </div>
                                        );
                                      }
                                      return (
                                        <div className="leading-tight break-words">
                                          <div className="leading-tight">{parts[0]}</div>
                                          <div className="leading-tight">{parts[1]}</div>
                                          <div className="leading-tight">{parts.slice(2).join(' ')}</div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  {isExempt && (
                                    <div className="my-0.2">
                                      <span className="inline-block border border-black text-black font-black px-1 py-0.2 rounded text-[7px]">
                                        CWSN (EXEMPT)
                                      </span>
                                    </div>
                                  )}
                                  {cSt.hasCwsnMarksAllowed && (
                                    <div className="my-0.2">
                                      <span className="inline-block border border-black text-black font-black px-1 py-0.2 rounded text-[7px]">
                                        (CWSN)
                                      </span>
                                    </div>
                                  )}
                                  {/* CASTE, DOB, SATS NO, GENDER: Centered in cell - Font size 12 */}
                                  <div className="w-full text-[12px] leading-tight text-black font-mono text-center flex flex-col items-center justify-center space-y-0.5">
                                    <div className="truncate w-full"><span className="font-bold">Caste:</span> {st.caste || 'GM'}</div>
                                    <div className="truncate w-full"><span className="font-bold">DOB:</span> {st.dob || st.dateOfBirth || '-'}</div>
                                    {st.satsNo && st.satsNo.trim() !== '' && st.satsNo.trim() !== 'N/A' && st.satsNo.trim() !== '-' && (
                                      <div className="truncate w-full"><span className="font-bold">SATS No:</span> {st.satsNo.trim()}</div>
                                    )}
                                    <div className="truncate w-full"><span className="font-bold">Gender:</span> {st.gender === 'Girl' ? 'Girl' : 'Boy'}</div>
                                  </div>
                                </div>
                              </td>
                            )}

                            {/* 4. Attendance: Width 28px, Vertically Centered */}
                            {isRow0 && (
                              <td
                                rowSpan={4}
                                style={{ height: '21.33mm', minHeight: '21.33mm', maxHeight: '21.33mm', boxSizing: 'border-box', verticalAlign: 'middle', textAlign: 'center' }}
                                className="border border-black p-0 text-center align-middle font-bold bg-white text-black overflow-hidden"
                              >
                                <div className="flex flex-col items-center justify-center h-full text-center py-0.5">
                                  <div className="text-black text-[7px] leading-none mb-0.5">1ನೇ Sem</div>
                                  {onUpdateSemAttendance ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-black text-black text-[11px]"
                                        style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                      >
                                        {cSt.sem1Attendance ?? '-'}
                                      </div>
                                      <input
                                        type="number"
                                        min="0"
                                        max={Math.max(0, workingDays - (cSt.sem2Attendance || 0))}
                                        value={cSt.sem1Attendance || ''}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          const maxAllowed = Math.max(0, workingDays - (cSt.sem2Attendance || 0));
                                          const clamped = Math.max(0, Math.min(val, maxAllowed));
                                          onUpdateSemAttendance(st.id, 'sem1', clamped);
                                        }}
                                        style={{ textAlign: 'center' }}
                                        className="cce-screen-input w-full text-center font-mono font-black text-black text-[11px] bg-transparent border-0 border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        title={`Edit Sem 1 Attendance (Max: ${Math.max(0, workingDays - (cSt.sem2Attendance || 0))})`}
                                      />
                                    </>
                                  ) : (
                                    <div className="font-mono font-black text-black text-[11px] text-center" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {cSt.sem1Attendance ?? '-'}
                                    </div>
                                  )}
                                </div>
                              </td>
                            )}
                            {isRow4 && (
                              <td
                                rowSpan={4}
                                style={{ height: '21.33mm', minHeight: '21.33mm', maxHeight: '21.33mm', boxSizing: 'border-box', verticalAlign: 'middle', textAlign: 'center' }}
                                className="border border-black p-0 text-center align-middle font-bold bg-white text-black overflow-hidden"
                              >
                                <div className="flex flex-col items-center justify-center h-full text-center py-0.5">
                                  <div className="text-black text-[7px] leading-none mb-0.5">2ನೇ Sem</div>
                                  {onUpdateSemAttendance ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-black text-black text-[11px]"
                                        style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                      >
                                        {cSt.sem2Attendance ?? '-'}
                                      </div>
                                      <input
                                        type="number"
                                        min="0"
                                        max={Math.max(0, workingDays - (cSt.sem1Attendance || 0))}
                                        value={cSt.sem2Attendance || ''}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          const maxAllowed = Math.max(0, workingDays - (cSt.sem1Attendance || 0));
                                          const clamped = Math.max(0, Math.min(val, maxAllowed));
                                          onUpdateSemAttendance(st.id, 'sem2', clamped);
                                        }}
                                        style={{ textAlign: 'center' }}
                                        className="cce-screen-input w-full text-center font-mono font-black text-black text-[11px] bg-transparent border-0 border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        title={`Edit Sem 2 Attendance (Max: ${Math.max(0, workingDays - (cSt.sem1Attendance || 0))})`}
                                      />
                                    </>
                                  ) : (
                                    <div className="font-mono font-black text-black text-[11px] text-center" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {cSt.sem2Attendance ?? '-'}
                                    </div>
                                  )}
                                </div>
                              </td>
                            )}
                            {isRow8 && (
                              <td
                                style={{ height: '5.33mm', minHeight: '5.33mm', maxHeight: '5.33mm', boxSizing: 'border-box', verticalAlign: 'middle', textAlign: 'center', borderBottom: '3px double #000000' }}
                                className="border border-black p-0 text-center align-middle font-black bg-white text-black overflow-hidden"
                              >
                                <div className="flex items-center justify-center h-full text-center">
                                  {onUpdateAttendance ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-black text-black text-[11px]"
                                        style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                      >
                                        {cSt.attendanceDays ?? '-'}
                                      </div>
                                      <input
                                        type="number"
                                        min="0"
                                        max={workingDays}
                                        value={cSt.attendanceDays || ''}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          const clamped = Math.max(0, Math.min(val, workingDays));
                                          onUpdateAttendance(st.id, clamped);
                                        }}
                                        style={{ textAlign: 'center' }}
                                        className="cce-screen-input w-full text-center font-mono font-black text-black text-[11px] bg-transparent border-0 border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        title={`Total Attendance: ${cSt.attendanceDays || 0} / ${workingDays}`}
                                      />
                                    </>
                                  ) : (
                                    <div className="font-mono text-[11px] font-black leading-none text-center" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {cSt.attendanceDays ?? '-'}
                                    </div>
                                  )}
                                </div>
                              </td>
                            )}

                            {/* 5. Exam Period */}
                            <td style={{ height: '5.33mm', minHeight: '5.33mm', maxHeight: '5.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle', ...(isRow8 ? { borderBottom: '3px double #000000' } : {}) }} className="border border-black p-0 font-bold text-center align-middle overflow-hidden text-black text-[8px]">
                              {r.exam}
                            </td>

                            {/* 6. Percentage */}
                            <td style={{ height: '5.33mm', minHeight: '5.33mm', maxHeight: '5.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle', ...(isRow8 ? { borderBottom: '3px double #000000' } : {}) }} className="border border-black p-0 font-mono font-bold text-center align-middle overflow-hidden text-black text-[8px]">
                              {r.pct}
                            </td>

                            {/* 7. Curricular 7 Subjects (ಅಂಕ, ಶ್ರೇಣಿ) - Both font size 11 and bold */}
                            {subjects.map((s) => {
                              const sub = cSt.subjects[s.code];
                              let markVal: number | string = '-';
                              let gradeVal = '-';

                              if (isExempt) {
                                markVal = '-';
                                gradeVal = rIdx === 8 ? 'Exempt' : '-';
                              } else if (sub) {
                                if (rIdx === 0) {
                                  markVal = sub.fa1_pct ?? '-';
                                  gradeVal = sub.fa1_grade || '-';
                                } else if (rIdx === 1) {
                                  markVal = sub.fa2_pct ?? '-';
                                  gradeVal = sub.fa2_grade || '-';
                                } else if (rIdx === 2) {
                                  markVal = sub.sa1_pct ?? '-';
                                  gradeVal = sub.sa1_grade || '-';
                                } else if (rIdx === 3) {
                                  markVal = sub.sem1_total ?? '-';
                                  gradeVal = sub.sem1_total !== null ? calculateHpGrade(sub.sem1_total, 50) : '-';
                                } else if (rIdx === 4) {
                                  markVal = sub.fa3_pct ?? '-';
                                  gradeVal = sub.fa3_grade || '-';
                                } else if (rIdx === 5) {
                                  markVal = sub.fa4_pct ?? '-';
                                  gradeVal = sub.fa4_grade || '-';
                                } else if (rIdx === 6) {
                                  markVal = sub.sa2_pct ?? '-';
                                  gradeVal = sub.sa2_grade || '-';
                                } else if (rIdx === 7) {
                                  markVal = sub.sem2_total ?? '-';
                                  gradeVal = sub.sem2_total !== null ? calculateHpGrade(sub.sem2_total, 50) : '-';
                                } else if (rIdx === 8) {
                                  markVal = sub.total100 ?? '-';
                                  gradeVal = sub.grade || (sub.total100 !== null && sub.total100 !== undefined ? calculateHpGrade(sub.total100, 100) : '-');
                                }
                              }

                              return (
                                <React.Fragment key={s.code}>
                                  <td
                                    style={{ height: '5.33mm', minHeight: '5.33mm', maxHeight: '5.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle', ...(isRow8 ? { borderBottom: '3px double #000000' } : {}) }}
                                    className="border border-black p-0 font-mono text-[11px] font-bold text-center align-middle overflow-hidden text-black bg-white"
                                  >
                                    {isExempt ? (
                                      '-'
                                    ) : r.isFinalTotal && onUpdateSubject100 ? (
                                      <>
                                        {(() => {
                                          const isNil = markVal === '-' || markVal === null || markVal === undefined || markVal === 0 || markVal === '0';
                                          const displayVal = isNil ? '-' : markVal;
                                          const inputVal = isNil ? '' : String(markVal);
                                          return (
                                            <>
                                              <div
                                                className="cce-pdf-text hidden w-full text-center font-mono font-bold text-black text-[11px]"
                                                style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                              >
                                                {displayVal}
                                              </div>
                                              <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={inputVal}
                                                onChange={(e) => {
                                                  const val = e.target.value.replace(/^0+(?=\d)/, '').trim();
                                                  if (val === '') onUpdateSubject100(st.id, s.code, null);
                                                  else {
                                                    const n = Number(val);
                                                    if (!isNaN(n)) onUpdateSubject100(st.id, s.code, Math.min(100, Math.max(0, Math.floor(n))));
                                                  }
                                                }}
                                                style={{ textAlign: 'center' }}
                                                className="cce-screen-input w-full text-center bg-transparent font-mono font-bold text-black border-0 border-none outline-none focus:outline-none focus:ring-0 text-[11px] p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="-"
                                                title={`Edit ${isKannada ? s.nameKn : s.nameEn} 100 Marks (2-way sync)`}
                                              />
                                            </>
                                          );
                                        })()}
                                      </>
                                    ) : r.subExamKey && (onUpdateExamPct || onUpdateMarks) ? (
                                      <>
                                        {(() => {
                                          const isNil = markVal === '-' || markVal === null || markVal === undefined || markVal === 0 || markVal === '0';
                                          const displayVal = isNil ? '-' : markVal;
                                          const inputVal = isNil ? '' : String(markVal);
                                          return (
                                            <>
                                              <div
                                                className="cce-pdf-text hidden w-full text-center font-mono font-bold text-black text-[11px]"
                                                style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                              >
                                                {displayVal}
                                              </div>
                                              <input
                                                type="number"
                                                min="0"
                                                max={r.prescribedMax}
                                                value={inputVal}
                                                onChange={(e) => {
                                                  const val = e.target.value.replace(/^0+(?=\d)/, '').trim();
                                                  if (val === '') {
                                                    if (onUpdateExamPct) onUpdateExamPct(st.id, s.code, r.subExamKey!, null);
                                                    else if (onUpdateMarks) onUpdateMarks(st.id, s.code, r.subExamKey!, null);
                                                  } else {
                                                    const n = Number(val);
                                                    if (!isNaN(n)) {
                                                      const maxVal = r.prescribedMax;
                                                      const clamped = Math.min(maxVal, Math.max(0, Math.floor(n)));
                                                      if (onUpdateExamPct) onUpdateExamPct(st.id, s.code, r.subExamKey!, clamped);
                                                      else if (onUpdateMarks) onUpdateMarks(st.id, s.code, r.subExamKey!, clamped);
                                                    }
                                                  }
                                                }}
                                                style={{ textAlign: 'center' }}
                                                className="cce-screen-input w-full text-center bg-transparent font-mono font-bold text-black border-0 border-none outline-none focus:outline-none focus:ring-0 text-[11px] p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="-"
                                                title={`Edit ${isKannada ? s.nameKn : s.nameEn} ${r.exam} marks (Max: ${r.prescribedMax})`}
                                              />
                                            </>
                                          );
                                        })()}
                                      </>
                                    ) : (
                                      (markVal === '-' || markVal === null || markVal === undefined || markVal === 0 || markVal === '0') ? '-' : markVal
                                    )}
                                  </td>
                                  <td
                                    style={{ height: '5.33mm', minHeight: '5.33mm', maxHeight: '5.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle', ...(isRow8 ? { borderBottom: '3px double #000000' } : {}) }}
                                    className="border border-black p-0 font-bold text-[11px] text-center align-middle overflow-hidden text-black bg-white"
                                  >
                                    {gradeVal}
                                  </td>
                                </React.Fragment>
                              );
                            })}

                            {/* 8. Max Marks */}
                            <td style={{ height: '5.33mm', minHeight: '5.33mm', maxHeight: '5.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle', ...(isRow8 ? { borderBottom: '3px double #000000' } : {}) }} className="border border-black p-0 font-mono font-bold text-center align-middle text-[11px] overflow-hidden text-black bg-white">
                              {r.maxMarks}
                            </td>

                            {/* 9. Total Across 7 Subjects: Marks, %, Grade - Font size 12 Bold */}
                            <td style={{ height: '5.33mm', minHeight: '5.33mm', maxHeight: '5.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle', ...(isRow8 ? { borderBottom: '3px double #000000' } : {}) }} className="border border-black p-0 font-mono font-black text-center align-middle text-[12px] overflow-hidden text-black bg-white">
                              {isExempt ? '-' : (rowTotalMarks !== null ? rowTotalMarks : '-')}
                            </td>
                            <td style={{ height: '5.33mm', minHeight: '5.33mm', maxHeight: '5.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle', ...(isRow8 ? { borderBottom: '3px double #000000' } : {}) }} className="border border-black p-0 font-mono font-black text-center align-middle text-[12px] overflow-hidden text-black bg-white">
                              {isExempt ? '-' : rowPctStr}
                            </td>
                            <td style={{ height: '5.33mm', minHeight: '5.33mm', maxHeight: '5.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle', ...(isRow8 ? { borderBottom: '3px double #000000' } : {}) }} className="border border-black p-0 font-black text-center align-middle text-[12px] overflow-hidden text-black bg-white">
                              {isExempt ? (r.isFinalTotal ? 'Exempt' : '-') : rowGrade}
                            </td>

                            {/* 10. Part B Item 1: Art Edu / Work Exp (2 cols: Marks, Grade) - Font size 11 */}
                            {isRow0 && (
                              <>
                                <td rowSpan={4} style={{ height: '21.33mm', minHeight: '21.33mm', maxHeight: '21.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-black p-0 font-mono font-bold text-center align-middle text-[11px] bg-white text-black overflow-hidden">
                                  {onUpdatePartBMarks ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-bold text-black text-[11px]"
                                        style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                      >
                                        {artSub?.sem1 !== null && artSub?.sem1 !== undefined ? artSub.sem1 : '-'}
                                      </div>
                                      <input
                                        type="number"
                                        min="0"
                                        max={50}
                                        value={artSub?.sem1 !== null && artSub?.sem1 !== undefined ? artSub.sem1 : ''}
                                        onChange={(e) => {
                                          const clean = e.target.value.trim();
                                          const n = clean === '' ? null : Math.min(50, Math.max(0, parseInt(clean, 10)));
                                          onUpdatePartBMarks(st.id, 'art_workexp', 'sem1', n);
                                        }}
                                        style={{ textAlign: 'center' }}
                                        className="cce-screen-input w-full text-center bg-transparent font-mono font-bold text-black border-0 border-none outline-none focus:outline-none focus:ring-0 text-[11px] p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="-"
                                        title="Edit Art Edu Sem 1 Marks (Max 50)"
                                      />
                                    </>
                                  ) : (
                                    <div className="text-center font-mono font-bold text-[11px]" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {artSub?.sem1 !== null && artSub?.sem1 !== undefined ? artSub.sem1 : '-'}
                                    </div>
                                  )}
                                </td>
                                <td rowSpan={4} style={{ height: '21.33mm', minHeight: '21.33mm', maxHeight: '21.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-black p-0 font-bold text-center align-middle text-[11px] bg-white text-black overflow-hidden">
                                  {artSub?.sem1_grade || (artSub?.sem1 !== null && artSub?.sem1 !== undefined ? calculateHpGrade(artSub.sem1, 50) : '-')}
                                </td>
                              </>
                            )}
                            {isRow4 && (
                              <>
                                <td rowSpan={4} style={{ height: '21.33mm', minHeight: '21.33mm', maxHeight: '21.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-black p-0 font-mono font-bold text-center align-middle text-[11px] bg-white text-black overflow-hidden">
                                  {onUpdatePartBMarks ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-bold text-black text-[11px]"
                                        style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                      >
                                        {artSub?.sem2 !== null && artSub?.sem2 !== undefined ? artSub.sem2 : '-'}
                                      </div>
                                      <input
                                        type="number"
                                        min="0"
                                        max={50}
                                        value={artSub?.sem2 !== null && artSub?.sem2 !== undefined ? artSub.sem2 : ''}
                                        onChange={(e) => {
                                          const clean = e.target.value.trim();
                                          const n = clean === '' ? null : Math.min(50, Math.max(0, parseInt(clean, 10)));
                                          onUpdatePartBMarks(st.id, 'art_workexp', 'sem2', n);
                                        }}
                                        style={{ textAlign: 'center' }}
                                        className="cce-screen-input w-full text-center bg-transparent font-mono font-bold text-black border-0 border-none outline-none focus:outline-none focus:ring-0 text-[11px] p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="-"
                                        title="Edit Art Edu Sem 2 Marks (Max 50)"
                                      />
                                    </>
                                  ) : (
                                    <div className="text-center font-mono font-bold text-[11px]" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {artSub?.sem2 !== null && artSub?.sem2 !== undefined ? artSub.sem2 : '-'}
                                    </div>
                                  )}
                                </td>
                                <td rowSpan={4} style={{ height: '21.33mm', minHeight: '21.33mm', maxHeight: '21.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-black p-0 font-bold text-center align-middle text-[11px] bg-white text-black overflow-hidden">
                                  {artSub?.sem2_grade || (artSub?.sem2 !== null && artSub?.sem2 !== undefined ? calculateHpGrade(artSub.sem2, 50) : '-')}
                                </td>
                              </>
                            )}
                            {isRow8 && (
                              <>
                                <td style={{ height: '5.33mm', minHeight: '5.33mm', maxHeight: '5.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle', borderBottom: '3px double #000000' }} className="border border-black p-0 font-mono font-bold text-center align-middle text-[11px] bg-white text-black overflow-hidden">
                                  {onUpdatePartBMarks ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-bold text-black text-[11px]"
                                        style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                      >
                                        {artSub?.total !== null && artSub?.total !== undefined ? artSub.total : '-'}
                                      </div>
                                      <input
                                        type="number"
                                        min="0"
                                        max={100}
                                        value={artSub?.total !== null && artSub?.total !== undefined ? artSub.total : ''}
                                        onChange={(e) => {
                                          const clean = e.target.value.trim();
                                          const n = clean === '' ? null : Math.min(100, Math.max(0, parseInt(clean, 10)));
                                          onUpdatePartBMarks(st.id, 'art_workexp', 'total', n);
                                        }}
                                        style={{ textAlign: 'center' }}
                                        className="cce-screen-input w-full text-center bg-transparent font-mono font-bold text-black border-0 border-none outline-none focus:outline-none focus:ring-0 text-[11px] p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="-"
                                        title="Edit Art Edu Total Marks (Max 100)"
                                      />
                                    </>
                                  ) : (
                                    <div className="text-center font-mono font-bold text-[11px]" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {artSub?.total !== null && artSub?.total !== undefined ? artSub.total : '-'}
                                    </div>
                                  )}
                                </td>
                                <td style={{ height: '5.33mm', minHeight: '5.33mm', maxHeight: '5.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle', borderBottom: '3px double #000000' }} className="border border-black p-0 font-bold text-center align-middle text-[11px] bg-white text-black overflow-hidden">
                                  {artSub?.grade || (artSub?.total !== null && artSub?.total !== undefined ? calculateHpGrade(artSub.total, 100) : '-')}
                                </td>
                              </>
                            )}

                            {/* 11. Part B Item 2: Computer Education / ICT (2 cols: Marks, Grade) - Font size 11 */}
                            {isRow0 && (
                              <>
                                <td rowSpan={4} style={{ height: '21.33mm', minHeight: '21.33mm', maxHeight: '21.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-black p-0 font-mono font-bold text-center align-middle text-[11px] bg-white text-black overflow-hidden">
                                  {onUpdatePartBMarks ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-bold text-black text-[11px]"
                                        style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                      >
                                        {ictSub?.sem1 !== null && ictSub?.sem1 !== undefined ? ictSub.sem1 : '-'}
                                      </div>
                                      <input
                                        type="number"
                                        min="0"
                                        max={50}
                                        value={ictSub?.sem1 !== null && ictSub?.sem1 !== undefined ? ictSub.sem1 : ''}
                                        onChange={(e) => {
                                          const clean = e.target.value.trim();
                                          const n = clean === '' ? null : Math.min(50, Math.max(0, parseInt(clean, 10)));
                                          onUpdatePartBMarks(st.id, 'ict_computer', 'sem1', n);
                                        }}
                                        style={{ textAlign: 'center' }}
                                        className="cce-screen-input w-full text-center bg-transparent font-mono font-bold text-black border-0 border-none outline-none focus:outline-none focus:ring-0 text-[11px] p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="-"
                                        title="Edit Computer Edu Sem 1 Marks (Max 50)"
                                      />
                                    </>
                                  ) : (
                                    <div className="text-center font-mono font-bold text-[11px]" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {ictSub?.sem1 !== null && ictSub?.sem1 !== undefined ? ictSub.sem1 : '-'}
                                    </div>
                                  )}
                                </td>
                                <td rowSpan={4} style={{ height: '21.33mm', minHeight: '21.33mm', maxHeight: '21.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-black p-0 font-bold text-center align-middle text-[11px] bg-white text-black overflow-hidden">
                                  {ictSub?.sem1_grade || (ictSub?.sem1 !== null && ictSub?.sem1 !== undefined ? calculateHpGrade(ictSub.sem1, 50) : '-')}
                                </td>
                              </>
                            )}
                            {isRow4 && (
                              <>
                                <td rowSpan={4} style={{ height: '21.33mm', minHeight: '21.33mm', maxHeight: '21.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-black p-0 font-mono font-bold text-center align-middle text-[11px] bg-white text-black overflow-hidden">
                                  {onUpdatePartBMarks ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-bold text-black text-[11px]"
                                        style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                      >
                                        {ictSub?.sem2 !== null && ictSub?.sem2 !== undefined ? ictSub.sem2 : '-'}
                                      </div>
                                      <input
                                        type="number"
                                        min="0"
                                        max={50}
                                        value={ictSub?.sem2 !== null && ictSub?.sem2 !== undefined ? ictSub.sem2 : ''}
                                        onChange={(e) => {
                                          const clean = e.target.value.trim();
                                          const n = clean === '' ? null : Math.min(50, Math.max(0, parseInt(clean, 10)));
                                          onUpdatePartBMarks(st.id, 'ict_computer', 'sem2', n);
                                        }}
                                        style={{ textAlign: 'center' }}
                                        className="cce-screen-input w-full text-center bg-transparent font-mono font-bold text-black border-0 border-none outline-none focus:outline-none focus:ring-0 text-[11px] p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="-"
                                        title="Edit Computer Edu Sem 2 Marks (Max 50)"
                                      />
                                    </>
                                  ) : (
                                    <div className="text-center font-mono font-bold text-[11px]" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {ictSub?.sem2 !== null && ictSub?.sem2 !== undefined ? ictSub.sem2 : '-'}
                                    </div>
                                  )}
                                </td>
                                <td rowSpan={4} style={{ height: '21.33mm', minHeight: '21.33mm', maxHeight: '21.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-black p-0 font-bold text-center align-middle text-[11px] bg-white text-black overflow-hidden">
                                  {ictSub?.sem2_grade || (ictSub?.sem2 !== null && ictSub?.sem2 !== undefined ? calculateHpGrade(ictSub.sem2, 50) : '-')}
                                </td>
                              </>
                            )}
                            {isRow8 && (
                              <>
                                <td style={{ height: '5.33mm', minHeight: '5.33mm', maxHeight: '5.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle', borderBottom: '3px double #000000' }} className="border border-black p-0 font-mono font-bold text-center align-middle text-[11px] bg-white text-black overflow-hidden">
                                  {onUpdatePartBMarks ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-bold text-black text-[11px]"
                                        style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                      >
                                        {ictSub?.total !== null && ictSub?.total !== undefined ? ictSub.total : '-'}
                                      </div>
                                      <input
                                        type="number"
                                        min="0"
                                        max={100}
                                        value={ictSub?.total !== null && ictSub?.total !== undefined ? ictSub.total : ''}
                                        onChange={(e) => {
                                          const clean = e.target.value.trim();
                                          const n = clean === '' ? null : Math.min(100, Math.max(0, parseInt(clean, 10)));
                                          onUpdatePartBMarks(st.id, 'ict_computer', 'total', n);
                                        }}
                                        style={{ textAlign: 'center' }}
                                        className="cce-screen-input w-full text-center bg-transparent font-mono font-bold text-black border-0 border-none outline-none focus:outline-none focus:ring-0 text-[11px] p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="-"
                                        title="Edit Computer Edu Total Marks (Max 100)"
                                      />
                                    </>
                                  ) : (
                                    <div className="text-center font-mono font-bold text-[11px]" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {ictSub?.total !== null && ictSub?.total !== undefined ? ictSub.total : '-'}
                                    </div>
                                  )}
                                </td>
                                <td style={{ height: '5.33mm', minHeight: '5.33mm', maxHeight: '5.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle', borderBottom: '3px double #000000' }} className="border border-black p-0 font-bold text-center align-middle text-[11px] bg-white text-black overflow-hidden">
                                  {ictSub?.grade || (ictSub?.total !== null && ictSub?.total !== undefined ? calculateHpGrade(ictSub.total, 100) : '-')}
                                </td>
                              </>
                            )}

                            {/* 12. 7 Co-Scholastic Activities - Vertical Center Align & Clear Text Inputs (No select arrow clipping!) */}
                            {isRow0 && (
                              <>
                                {HP_CO_ACTIVITIES.map((act) => {
                                  const grd = getHpCoGradeValue(cSt.coScholastic.sem1, act.key);
                                  return (
                                    <td
                                      key={act.key}
                                      rowSpan={4}
                                      style={{ height: '21.33mm', minHeight: '21.33mm', maxHeight: '21.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }}
                                      className="border border-black p-0 font-mono font-bold text-[11px] text-center align-middle bg-white text-black overflow-hidden"
                                    >
                                      {onUpdateCoGrade ? (
                                        <>
                                          <div
                                            className="cce-pdf-text hidden w-full text-center font-bold text-[11px] text-black"
                                            style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                          >
                                            {grd || '-'}
                                          </div>
                                          <input
                                            type="text"
                                            maxLength={2}
                                            value={grd && grd !== '-' ? grd : ''}
                                            placeholder="-"
                                            onChange={(e) => {
                                              const v = e.target.value.trim().toUpperCase();
                                              onUpdateCoGrade(st.id, 'sem1', act.key, v);
                                            }}
                                            style={{ textAlign: 'center' }}
                                            className="cce-screen-input w-full text-center bg-transparent font-bold text-[11px] text-black border-0 border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 uppercase"
                                            title={`${act.num} Sem 1 Grade (Type A, B, C)`}
                                          />
                                        </>
                                      ) : (
                                        <div className="text-center font-bold text-[11px] text-black" style={{ textAlign: 'center', margin: '0 auto' }}>
                                          {grd || '-'}
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </>
                            )}
                            {isRow4 && (
                              <>
                                {HP_CO_ACTIVITIES.map((act) => {
                                  const grd = getHpCoGradeValue(cSt.coScholastic.sem2, act.key);
                                  return (
                                    <td
                                      key={act.key}
                                      rowSpan={4}
                                      style={{ height: '21.33mm', minHeight: '21.33mm', maxHeight: '21.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }}
                                      className="border border-black p-0 font-mono font-bold text-[11px] text-center align-middle bg-white text-black overflow-hidden"
                                    >
                                      {onUpdateCoGrade ? (
                                        <>
                                          <div
                                            className="cce-pdf-text hidden w-full text-center font-bold text-[11px] text-black"
                                            style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                          >
                                            {grd || '-'}
                                          </div>
                                          <input
                                            type="text"
                                            maxLength={2}
                                            value={grd && grd !== '-' ? grd : ''}
                                            placeholder="-"
                                            onChange={(e) => {
                                              const v = e.target.value.trim().toUpperCase();
                                              onUpdateCoGrade(st.id, 'sem2', act.key, v);
                                            }}
                                            style={{ textAlign: 'center' }}
                                            className="cce-screen-input w-full text-center bg-transparent font-bold text-[11px] text-black border-0 border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 uppercase"
                                            title={`${act.num} Sem 2 Grade (Type A, B, C)`}
                                          />
                                        </>
                                      ) : (
                                        <div className="text-center font-bold text-[11px] text-black" style={{ textAlign: 'center', margin: '0 auto' }}>
                                          {grd || '-'}
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </>
                            )}
                            {isRow8 && (
                              <>
                                {HP_CO_ACTIVITIES.map((act) => {
                                  const grd = getHpCoGradeValue(cSt.coScholastic.final, act.key);
                                  return (
                                    <td
                                      key={act.key}
                                      style={{ height: '5.33mm', minHeight: '5.33mm', maxHeight: '5.33mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle', borderBottom: '3px double #000000' }}
                                      className="border border-black p-0 font-mono font-bold text-[11px] text-center align-middle bg-white text-black overflow-hidden"
                                    >
                                      {onUpdateCoGrade ? (
                                        <>
                                          <div
                                            className="cce-pdf-text hidden w-full text-center font-bold text-[11px] text-black"
                                            style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                          >
                                            {grd || '-'}
                                          </div>
                                          <input
                                            type="text"
                                            maxLength={2}
                                            value={grd && grd !== '-' ? grd : ''}
                                            placeholder="-"
                                            onChange={(e) => {
                                              const v = e.target.value.trim().toUpperCase();
                                              onUpdateCoGrade(st.id, 'final', act.key, v);
                                            }}
                                            style={{ textAlign: 'center' }}
                                            className="cce-screen-input w-full text-center bg-transparent font-bold text-[11px] text-black border-0 border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 uppercase"
                                            title={`${act.num} Annual Grade (Type A, B, C)`}
                                          />
                                        </>
                                      ) : (
                                        <div className="text-center font-bold text-[11px] text-black" style={{ textAlign: 'center', margin: '0 auto' }}>
                                          {grd || '-'}
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </>
                            )}

                            {/* 13. Result - Spans 9 Rows (Height 48.0mm / 4.8cm - Matches Columns 1, 2, 3) */}
                            {isRow0 && (
                              <td
                                rowSpan={9}
                                style={{ height: '48.0mm', minHeight: '48.0mm', maxHeight: '48.0mm', boxSizing: 'border-box', borderBottom: '3px double #000000', textAlign: 'center', verticalAlign: 'middle' }}
                                className="border border-black p-0.5 align-middle text-center font-black overflow-hidden bg-white text-black"
                              >
                                <span
                                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '44mm' }}
                                  className="inline-block whitespace-nowrap py-0.5 mx-auto font-black text-[11px] text-black"
                                >
                                  {isExempt
                                    ? (medium === 'Kannada' ? 'ತೇರ್ಗಡೆ (ವಿನಾಯಿತಿ)' : 'Promoted (Exempt)')
                                    : cSt.isPassed
                                    ? (medium === 'Kannada' ? 'ತೇರ್ಗಡೆ' : 'Promoted')
                                    : (medium === 'Kannada' ? 'ಅನುತ್ತೀರ್ಣ' : 'Failed')}
                                </span>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  );
                })}
            </table>
          </div>

          {/* Last Page: Signatures (2 cm gap below table) and Part B Subjects Information below signatures */}
          {pageIdx === chunks.length - 1 && (
            <div className="w-full">
              {/* Exactly 2 cm (20mm) gap from table to signatures */}
              <div
                style={{ marginTop: '20mm' }}
                className="w-full flex items-center justify-between px-16 text-black print:text-black"
              >
                <div className="text-center">
                  <div className="w-64 text-center">
                    <span className="font-bold text-[12px]">ವರ್ಗ ಶಿಕ್ಷಕರ ಸಹಿ</span>
                    <span className="block text-[10px] font-normal text-slate-700">(Class Teacher Signature)</span>
                    <div className="font-black text-[12px] mt-1 border-b border-black pb-0.5 min-h-[24px]">
                      {effectiveTeacherName || '____________________'}
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-64 text-center">
                    <span className="font-bold text-[12px]">ಮುಖ್ಯ ಗುರುಗಳ ಸಹಿ</span>
                    <span className="block text-[10px] font-normal text-slate-700">(Head Master Signature)</span>
                    <div className="font-black text-[12px] mt-1 border-b border-black pb-0.5 min-h-[24px]">
                      {schoolRecord?.headmasterName || 'ಮುಖ್ಯ ಗುರುಗಳು'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Part B Subject Information: Below signatures */}
              <div className="w-full mt-4 border border-black p-2 text-black bg-white">
                <div className="text-[11px] font-bold text-black mb-1.5 flex items-center justify-between">
                  <span>ಭಾಗ-ಬಿ ಸಹ ಪಠ್ಯ ಹಾಗೂ ಪ್ರಾಯೋಗಿಕ ವಿಷಯಗಳ ವಿವರಣೆ (Part-B Co-Scholastic & Practical Subjects Information):</span>
                </div>
                {/* 2 Practical / Part B subjects */}
                <div className="grid grid-cols-2 gap-2 mb-2 text-center font-bold text-black text-[10px]">
                  <div className="border border-black p-1 bg-slate-50">
                    <div>ಕಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಕೆಲಸದ ಅನುಭವ (ಗರಿಷ್ಠ ಅಂಕಗಳು: 100)</div>
                    <div className="text-[9px] font-normal text-slate-700">Art Education & Work Experience (Max: 100 Marks)</div>
                  </div>
                  <div className="border border-black p-1 bg-slate-50">
                    <div>ಗಣಕ ಶಿಕ್ಷಣ / ಕಂಪ್ಯೂಟರ್ (ಗರಿಷ್ಠ ಅಂಕಗಳು: 100)</div>
                    <div className="text-[9px] font-normal text-slate-700">Computer Education / ICT (Max: 100 Marks)</div>
                  </div>
                </div>
                {/* 7 Co-Scholastic Activities */}
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-black text-[10px]">
                  <div className="border border-black p-1">
                    <div>(1) ಭಾವನಾತ್ಮಕ ಸಾಮಾಜಿಕ ಕೌಶಲಗಳು</div>
                    <div className="text-[8.5px] font-normal text-slate-700 mt-0.5">Emotional & Social Skills</div>
                  </div>
                  <div className="border border-black p-1">
                    <div>(2) ಸಂಘಟನಾ ಕೌಶಲಗಳು</div>
                    <div className="text-[8.5px] font-normal text-slate-700 mt-0.5">Organizational Skills</div>
                  </div>
                  <div className="border border-black p-1">
                    <div>(3) ವೈಜ್ಞಾನಿಕ ಕೌಶಲಗಳು</div>
                    <div className="text-[8.5px] font-normal text-slate-700 mt-0.5">Scientific Skills</div>
                  </div>
                  <div className="border border-black p-1">
                    <div>(4) ಲಲಿತ ಕಲೆ</div>
                    <div className="text-[8.5px] font-normal text-slate-700 mt-0.5">Fine Arts</div>
                  </div>
                  <div className="border border-black p-1">
                    <div>(5) ಸೃಜನಶೀಲತೆ</div>
                    <div className="text-[8.5px] font-normal text-slate-700 mt-0.5">Creativity</div>
                  </div>
                  <div className="border border-black p-1">
                    <div>(6) ಮನೋಧೋರಣೆ</div>
                    <div className="text-[8.5px] font-normal text-slate-700 mt-0.5">Attitude</div>
                  </div>
                  <div className="border border-black p-1">
                    <div>(7) ಮೌಲ್ಯಗಳು</div>
                    <div className="text-[8.5px] font-normal text-slate-700 mt-0.5">Values</div>
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* Clean Bottom Footer on Every Page */}
            <div
              className="w-full flex flex-row items-center justify-between text-[10px] font-bold text-black border-t border-black pt-1 px-1 mt-2"
              style={{ boxSizing: 'border-box' }}
            >
              <div className="text-left">
                Designed By :Shri S R Angadi 9731766727
              </div>
              <div className="text-right font-mono font-bold">
                ಪುಟ {pageIdx + 1} / {chunks.length}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
