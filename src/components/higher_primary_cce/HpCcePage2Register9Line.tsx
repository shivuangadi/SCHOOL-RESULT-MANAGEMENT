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
  ReportPaperSize,
} from '../../utils/printPdfHelper';
import { getSavedClassTeacher } from '../../utils/teacherHelper';
import { FileCode, Download, Printer } from 'lucide-react';

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

  const effectiveTeacherName =
    (classTeacherName &&
     classTeacherName !== 'ಶ್ರೀ ಎಸ್ ಆರ್ ಅಂಗಡಿ' &&
     classTeacherName !== 'ವರ್ಗ ಶಿಕ್ಷಕರು'
      ? classTeacherName
      : '') ||
    getSavedClassTeacher(schoolRecord, selectedClass) ||
    '';

  // Chunk students into pages:
  // Per official requirements, 3 students per page.
  // BUT when total students is a multiple of 3 (e.g. 3, 6, 9, 12, ...),
  // there is no space left on the last page for the 2cm gap, signatures, and Part B co-scholastic subjects info.
  // Therefore, in that case:
  // - the last-but-one page gets 2 students
  // - the last page gets 1 student
  // and below the table on the last page, the signatures & Part B subject info are placed cleanly!
  const chunks = useMemo(() => {
    const total = computedList.length;
    if (total === 0) return [[]];

    if (studentsPerPage === 3) {
      if (total % 3 === 0) {
        if (total === 3) {
          return [computedList.slice(0, 2), computedList.slice(2, 3)];
        }
        const pages: ComputedHpStudent[][] = [];
        let i = 0;
        // All pages prior to the final 2 pages get 3 students each
        while (i < total - 3) {
          pages.push(computedList.slice(i, i + 3));
          i += 3;
        }
        // Last-but-one page gets 2 students
        pages.push(computedList.slice(i, i + 2));
        // Last page gets 1 student
        pages.push(computedList.slice(i + 2, i + 3));
        return pages;
      } else {
        // Not a multiple of 3 (e.g. 1, 2, 4, 5, 7, 8...) -> last page naturally has 1 or 2 students
        const pages: ComputedHpStudent[][] = [];
        for (let i = 0; i < total; i += 3) {
          pages.push(computedList.slice(i, i + 3));
        }
        return pages;
      }
    }

    // Fallback if user explicitly changed studentsPerPage to 1 or 2
    const pages: ComputedHpStudent[][] = [];
    for (let i = 0; i < total; i += studentsPerPage) {
      pages.push(computedList.slice(i, i + studentsPerPage));
    }
    return pages.length > 0 ? pages : [[]];
  }, [computedList, studentsPerPage]);

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

  return (
    <div ref={reportRef} className="space-y-6 legal-landscape cce-9line-container">
      {/* Scoped Print and PDF B&W Styles for 6-8 9-Line Consolidation Report Only */}
      <style>{`
        /* Screen UI: Full color retained as defined in Tailwind classes */

        /* PDF and Print Visibility Toggle: screen inputs vs clean centered text */
        .cce-screen-input {
          display: block;
          text-align: center !important;
        }
        .cce-pdf-text {
          display: none !important;
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
        }

        /* Global Compact Table & Input Styles for 9-Line Consolidation */
        .cce-9line-sheet table {
          margin: 0 !important;
        }
        .cce-9line-sheet th,
        .cce-9line-sheet td {
          padding: 0 !important;
          line-height: 1.1 !important;
          box-sizing: border-box !important;
          text-align: center !important;
        }
        .cce-screen-input {
          height: 4.8mm !important;
          max-height: 4.8mm !important;
          line-height: 4.8mm !important;
          padding: 0 !important;
          margin: 0 !important;
          text-align: center !important;
        }
        input[type="number"], input {
          text-align: center !important;
        }
        .student-tbody {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          display: table-row-group !important;
        }

        /* Print & PDF Media Styles: Maintain 100% visual fidelity matching on-screen report */
        @media print {
          .cce-screen-input {
            display: none !important;
          }
          .cce-pdf-text {
            display: block !important;
            text-align: center !important;
            margin: 0 auto !important;
            width: 100% !important;
            line-height: 1.1 !important;
          }
          .cce-9line-sheet {
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .cce-9line-sheet table {
            margin: 0 !important;
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
            paddingLeft: '0px',
            paddingRight: '0px',
            paddingTop: '0px',
            paddingBottom: '0px',
            boxSizing: 'border-box',
          }}
          className="report-page-sheet cce-9line-sheet bg-white rounded-2xl border border-slate-300 shadow-sm space-y-1 break-after-page mb-6 mx-auto print:border-none print:shadow-none print:rounded-none"
        >
          <div
            className="cce-sheet-container"
            style={{
              marginLeft: '0mm',
              marginRight: '0mm',
              marginTop: '5mm',
              marginBottom: '5mm',
              paddingLeft: '0px',
              paddingRight: '0px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
          {/* 2-Line Header with side boxes matching user specifications */}
          <div
            style={{ minHeight: '12mm', boxSizing: 'border-box' }}
            className="relative border-b-2 border-slate-900 pb-1 mb-1 flex items-center justify-between"
          >
            {/* Top Left Corner: Page No details in a text box */}
            <div className="absolute left-0 top-0 text-left">
              <span className="inline-block text-[9px] font-black text-slate-950 bg-slate-50 border border-slate-600 px-2 py-0.5 rounded shadow-2xs font-mono">
                ಪುಟ: {pageIdx + 1} / {chunks.length}
              </span>
            </div>

            {/* Center: Exactly 2 lines above the table */}
            <div className="w-full text-center px-32">
              {/* 1st line: School Name */}
              <h2 className="text-[12px] sm:text-[13px] font-black text-slate-950 leading-tight truncate">
                {schoolName}
              </h2>
              {/* 2nd line: Academic Year & Consolidation Register Name with Class */}
              <p className="text-[10px] sm:text-[10.5px] font-black text-slate-900 leading-tight truncate mt-0.5">
                {academicYear} ನೇ ಸಾಲಿನ ವಿಷಯವಾರು ರೂಪನಾತ್ಮಕ ಹಾಗೂ ಸಂಕಲನಾತ್ಮಕ ಮೌಲ್ಯಮಾಪನ ಕ್ರೋಢೀಕರಣ ವಹಿ- {selectedClass}ನೇ ತರಗತಿ
              </p>
            </div>

            {/* Top Right Corner: Working days & Class teacher name in text boxes */}
            <div className="absolute right-0 top-0 text-right flex flex-col items-end gap-1">
              <span className="inline-block text-[8.5px] font-black text-slate-950 bg-slate-50 border border-slate-600 px-1.5 py-0.5 rounded shadow-2xs whitespace-nowrap">
                ಶಾಲೆ ನಡೆದ ದಿನಗಳ ಸಂಖ್ಯೆ: <span className="font-mono font-black">{workingDays}</span>
              </span>
              <span className="inline-block text-[8.5px] font-black text-slate-950 bg-slate-50 border border-slate-600 px-1.5 py-0.5 rounded shadow-2xs whitespace-nowrap">
                ವರ್ಗ ಶಿಕ್ಷಕರ ಹೆಸರು: <span className="font-bold">{effectiveTeacherName || '____________________'}</span>
              </span>
            </div>
          </div>

          {/* 9-Line Consolidation Table: Target table heading height 18mm */}
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-[7.5px] sm:text-[8px] text-center border-collapse border-2 border-slate-900 table-fixed">
              <colgroup>
                {/* 1. Sl No */}
                <col style={{ width: '22px' }} />
                {/* 2. Reg No */}
                <col style={{ width: '26px' }} />
                {/* 3. Student Name - Width 62px */}
                <col style={{ width: '62px' }} />
                {/* 4. Days Attended (Attendance) - Width 28px */}
                <col style={{ width: '28px' }} />
                {/* 5. Evaluation Period - Decreased by 0.5cm to 18px */}
                <col style={{ width: '18px' }} />
                {/* 6. Percentage - Decreased by 0.5cm to 18px */}
                <col style={{ width: '18px' }} />
                {/* 7 Curricular Subjects * 2 = 14 columns (Marks: 20px, Grade: 15px) */}
                {subjects.map((s) => (
                  <React.Fragment key={s.code}>
                    <col style={{ width: '20px' }} />
                    <col style={{ width: '15px' }} />
                  </React.Fragment>
                ))}
                {/* 8. Max Marks (700) */}
                <col style={{ width: '26px' }} />
                {/* 9. Total Sub-columns: Marks (24px), % (28px), Grade (18px) */}
                <col style={{ width: '24px' }} />
                <col style={{ width: '28px' }} />
                <col style={{ width: '18px' }} />
                {/* 10. Part B Art Edu: Marks (20px), Grade (15px) */}
                <col style={{ width: '20px' }} />
                <col style={{ width: '15px' }} />
                {/* Part B Computer: Marks (20px), Grade (15px) */}
                <col style={{ width: '20px' }} />
                <col style={{ width: '15px' }} />
                {/* 7 Co-Scholastic Activities */}
                {HP_CO_ACTIVITIES.map((act) => (
                  <col key={act.key} style={{ width: '18px' }} />
                ))}
                {/* 11. Result */}
                <col style={{ width: '28px' }} />
              </colgroup>
              <thead style={{ height: '17mm', maxHeight: '17mm' }}>
                {/* Header Row 1 - Height 5.5mm */}
                <tr className="bg-slate-100 font-black text-slate-950 border-b border-slate-900" style={{ height: '5.5mm', maxHeight: '5.5mm', boxSizing: 'border-box' }}>
                  {/* 1. Sl No */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-[22px] align-middle bg-slate-50 overflow-hidden" style={{ height: '17mm', maxHeight: '17mm', boxSizing: 'border-box' }}>
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '15.5mm' }} className="inline-block whitespace-nowrap py-0.5 mx-auto font-black text-[7.5px]">
                      ಕ್ರ. ಸಂಖ್ಯೆ
                    </span>
                  </th>

                  {/* 2. Admission / Reg No */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-[26px] align-middle bg-slate-50 overflow-hidden" style={{ height: '17mm', maxHeight: '17mm', boxSizing: 'border-box' }}>
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '15.5mm' }} className="inline-block whitespace-nowrap py-0.5 mx-auto font-black text-[7.5px]">
                      ದಾಖಲಾತಿ ಸಂಖ್ಯೆ
                    </span>
                  </th>

                  {/* 3. Student Name */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-[62px] max-w-[62px] min-w-[62px] align-middle font-black text-slate-950 overflow-hidden" style={{ height: '17mm', maxHeight: '17mm', boxSizing: 'border-box' }}>
                    <div className="leading-tight text-[7.5px] break-words">ವಿದ್ಯಾರ್ಥಿಗಳ ಹೆಸರು</div>
                  </th>

                  {/* 4. Days Attended */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-[28px] max-w-[28px] min-w-[28px] align-middle bg-slate-50 overflow-hidden" style={{ height: '17mm', maxHeight: '17mm', boxSizing: 'border-box' }}>
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '15.5mm' }} className="inline-block whitespace-nowrap py-0.5 mx-auto font-black text-[7px]">
                      ಹಾಜರಾದ ದಿನಗಳು
                    </span>
                  </th>

                  {/* 5. Evaluation Period - Decreased by 0.5cm to 18px */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-[18px] max-w-[18px] min-w-[18px] align-middle bg-slate-50 overflow-hidden" style={{ height: '17mm', maxHeight: '17mm', boxSizing: 'border-box' }}>
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '15.5mm' }} className="inline-block whitespace-nowrap py-0.5 mx-auto font-black text-[6.5px]">
                      ಮೌಲ್ಯಮಾಪನ
                    </span>
                  </th>

                  {/* 6. Percentage - Decreased by 0.5cm to 18px */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-[18px] max-w-[18px] min-w-[18px] align-middle bg-slate-50 overflow-hidden" style={{ height: '17mm', maxHeight: '17mm', boxSizing: 'border-box' }}>
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '15.5mm' }} className="inline-block whitespace-nowrap py-0.5 mx-auto font-black text-[6.5px]">
                      ಶೇಕಡಾ
                    </span>
                  </th>

                  {/* 7. Curricular Subjects Group Header */}
                  <th colSpan={14} className="border border-slate-900 p-0.5 bg-red-50 text-red-600 font-black text-[8.5px] border-r-2 border-r-slate-900 overflow-hidden leading-tight" style={{ height: '6mm', maxHeight: '6mm', boxSizing: 'border-box' }}>
                    ಅ. ವಿದ್ಯಾರ್ಥಿಯ ಶೈಕ್ಷಣಿಕ ಸಾಧನೆ ಪಠ್ಯ ವಿಷಯಗಳಿಗೆ ಸಂಬಂಧಿಸಿದಂತೆ
                  </th>

                  {/* 8. Max Marks (700) */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-[26px] align-middle bg-amber-50 font-black overflow-hidden" style={{ height: '18mm', maxHeight: '18mm', boxSizing: 'border-box' }}>
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '16.5mm' }} className="inline-block whitespace-nowrap py-0.5 mx-auto font-black text-[7.5px]">
                      ಗರಿಷ್ಠ 700
                    </span>
                  </th>

                  {/* 9. Total Header */}
                  <th colSpan={3} className="border border-slate-900 p-0.5 bg-amber-100 font-black text-slate-950 text-[8.5px] overflow-hidden leading-tight" style={{ height: '6mm', maxHeight: '6mm', boxSizing: 'border-box' }}>
                    ಒಟ್ಟು ಪಡೆದ ಅಂಕಗಳು
                  </th>

                  {/* 10. Part B Header */}
                  <th colSpan={11} className="border border-slate-900 p-0.5 bg-red-50 text-red-600 font-black text-[8.5px] border-l-2 border-l-red-600 overflow-hidden leading-tight" style={{ height: '6mm', maxHeight: '6mm', boxSizing: 'border-box' }}>
                    ಆ. ಸಹ ಪಠ್ಯ ವಿಷಯಗಳು & ಶ್ರೇಣಿಗಳು (ಭಾಗ-ಬಿ)
                  </th>

                  {/* 11. Result Header */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-[28px] align-middle bg-emerald-50 text-red-600 font-black overflow-hidden" style={{ height: '18mm', maxHeight: '18mm', boxSizing: 'border-box' }}>
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '16.5mm' }} className="inline-block whitespace-nowrap py-0.5 mx-auto font-black text-[8px]">
                      ಫಲಿತಾಂಶ
                    </span>
                  </th>
                </tr>

                {/* Sub-Header Row 2 - Height 6mm */}
                <tr className="bg-slate-50 text-[7.5px] font-bold text-slate-900 border-b border-slate-900" style={{ height: '6mm', maxHeight: '6mm', boxSizing: 'border-box' }}>
                  {/* 7 Curricular Subjects */}
                  {subjects.map((s) => (
                    <th key={s.code} colSpan={2} className="border border-slate-900 p-0.5 truncate font-black text-[7.5px] overflow-hidden" style={{ height: '6mm', maxHeight: '6mm', boxSizing: 'border-box' }}>
                      {s.nameKn}
                    </th>
                  ))}

                  {/* Total Sub-columns */}
                  <th rowSpan={2} className="border border-slate-900 p-0.5 w-[24px] font-black bg-amber-50 text-[7.5px] overflow-hidden" style={{ height: '12mm', maxHeight: '12mm', boxSizing: 'border-box' }}>ಅಂಕ</th>
                  <th rowSpan={2} className="border border-slate-900 p-0.5 w-[28px] font-black bg-amber-50 text-[7.5px] overflow-hidden" style={{ height: '12mm', maxHeight: '12mm', boxSizing: 'border-box' }}>ಶೇಕಡಾ</th>
                  <th rowSpan={2} className="border border-slate-900 p-0.5 w-[18px] font-black bg-amber-50 text-[7.5px] overflow-hidden" style={{ height: '12mm', maxHeight: '12mm', boxSizing: 'border-box' }}>ಶ್ರೇಣಿ</th>

                  {/* Part B Subject 1: Art Edu / Work Exp */}
                  <th colSpan={2} className="border border-slate-900 p-0.5 bg-indigo-50 text-indigo-950 font-black text-[7px] overflow-hidden leading-tight" style={{ height: '6mm', maxHeight: '6mm', boxSizing: 'border-box' }}>
                    ಕಲಾ ಶಿಕ್ಷಣ /<br />ಕಾರ್ಯಾನುಭವ
                  </th>

                  {/* Part B Subject 2: Computer / ICT */}
                  <th colSpan={2} className="border border-slate-900 p-0.5 bg-blue-50 text-blue-950 font-black text-[7px] overflow-hidden leading-tight" style={{ height: '6mm', maxHeight: '6mm', boxSizing: 'border-box' }}>
                    ಕಂಪ್ಯೂಟರ್<br />ಶಿಕ್ಷಣ (ICT)
                  </th>

                  {/* 7 Co-Scholastic Activities - ONLY NUMBERS 1, 2, 3, 4, 5, 6, 7 */}
                  {HP_CO_ACTIVITIES.map((act) => (
                    <th
                      key={act.key}
                      rowSpan={2}
                      className="border border-slate-900 p-0.5 w-[18px] align-middle text-center font-black bg-purple-50 text-purple-950 text-[9.5px] overflow-hidden"
                      title={`${act.num}. ${act.nameKn} (${act.nameEn})`}
                      style={{ height: '12mm', maxHeight: '12mm', boxSizing: 'border-box' }}
                    >
                      {act.num}
                    </th>
                  ))}
                </tr>

                {/* Sub-Header Row 3 - Height 6mm: ಅಂಕ & ಶ್ರೇಣಿ for 7 Curricular Subjects and 2 Part B Subjects */}
                <tr className="bg-slate-100 text-[7px] font-black text-slate-900 border-b-2 border-slate-900" style={{ height: '6mm', maxHeight: '6mm', boxSizing: 'border-box' }}>
                  {subjects.map((s) => (
                    <React.Fragment key={s.code}>
                      <th className="border border-slate-900 p-0.5 w-[20px] overflow-hidden" style={{ height: '6mm', maxHeight: '6mm', boxSizing: 'border-box' }}>ಅಂಕ</th>
                      <th className="border border-slate-900 p-0.5 w-[15px] overflow-hidden" style={{ height: '6mm', maxHeight: '6mm', boxSizing: 'border-box' }}>ಶ್ರೇಣಿ</th>
                    </React.Fragment>
                  ))}
                  {/* Art Edu subheaders */}
                  <th className="border border-slate-900 p-0.5 w-[20px] bg-indigo-50 overflow-hidden" style={{ height: '6mm', maxHeight: '6mm', boxSizing: 'border-box' }}>ಅಂಕ</th>
                  <th className="border border-slate-900 p-0.5 w-[15px] bg-indigo-50 overflow-hidden" style={{ height: '6mm', maxHeight: '6mm', boxSizing: 'border-box' }}>ಶ್ರೇಣಿ</th>
                  {/* Computer Edu subheaders */}
                  <th className="border border-slate-900 p-0.5 w-[20px] bg-blue-50 overflow-hidden" style={{ height: '6mm', maxHeight: '6mm', boxSizing: 'border-box' }}>ಅಂಕ</th>
                  <th className="border border-slate-900 p-0.5 w-[15px] bg-blue-50 overflow-hidden" style={{ height: '6mm', maxHeight: '6mm', boxSizing: 'border-box' }}>ಶ್ರೇಣಿ</th>
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
                    { exam: 'ರೂ-1', pct: '10%', maxMarks: 70, subExamKey: 'fa1' as const, prescribedMax: 10, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: 'ರೂ-2', pct: '10%', maxMarks: 70, subExamKey: 'fa2' as const, prescribedMax: 10, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: 'ಸಂ-1', pct: '30%', maxMarks: 210, subExamKey: 'sa1' as const, prescribedMax: 30, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: 'ಒಟ್ಟು', pct: '50%', maxMarks: 350, subExamKey: null, prescribedMax: 50, isSem1Total: true, isSem2Total: false, isFinalTotal: false },

                    // Sem 2: FA3 (10%), FA4 (10%), SA2 (30%), Sem 2 Total (50%)
                    { exam: 'ರೂ-3', pct: '10%', maxMarks: 70, subExamKey: 'fa3' as const, prescribedMax: 10, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: 'ರೂ-4', pct: '10%', maxMarks: 70, subExamKey: 'fa4' as const, prescribedMax: 10, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: 'ಸಂ-2', pct: '30%', maxMarks: 210, subExamKey: 'sa2' as const, prescribedMax: 30, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: 'ಒಟ್ಟು', pct: '50%', maxMarks: 350, subExamKey: null, prescribedMax: 50, isSem1Total: false, isSem2Total: true, isFinalTotal: false },

                    // Final Total: 100%
                    { exam: 'ಒಟ್ಟು', pct: '100%', maxMarks: 700, subExamKey: null, prescribedMax: 100, isSem1Total: false, isSem2Total: false, isFinalTotal: true },
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
                            style={{ height: '4.8mm', minHeight: '4.8mm', maxHeight: '4.8mm', boxSizing: 'border-box' }}
                            className={`border-b border-slate-300 text-[8px] ${
                              r.isFinalTotal
                                ? 'bg-amber-100 font-black border-b-2 border-slate-900 text-red-600'
                                : isTotalRow
                                ? 'bg-yellow-50 font-black border-b border-dashed border-amber-400 text-red-600'
                                : 'hover:bg-slate-50 text-slate-900'
                            }`}
                          >
                            {/* 1. Sl No - Spans 9 Rows (Fit in 43.2mm height) */}
                            {isRow0 && (
                              <td rowSpan={9} style={{ height: '43.2mm', maxHeight: '43.2mm', boxSizing: 'border-box' }} className="border border-slate-900 p-0 font-mono font-bold align-middle bg-white text-center overflow-hidden">
                                {globalIdx + 1}
                              </td>
                            )}

                            {/* 2. Registered No - Spans 9 Rows - Vertical Bottom to Top */}
                            {isRow0 && (
                              <td rowSpan={9} style={{ height: '43.2mm', maxHeight: '43.2mm', boxSizing: 'border-box' }} className="border border-slate-900 p-0 font-mono font-bold align-middle bg-white text-center overflow-hidden">
                                <span
                                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '39mm' }}
                                  className="inline-block whitespace-nowrap text-center py-0.5 mx-auto text-[7.5px]"
                                >
                                  {st.schoolRegNo?.trim() || (st as any).admissionNo || (st as any).regNo || `${100 + globalIdx + 1}`}
                                </span>
                              </td>
                            )}

                            {/* 3. Student Name & Meta Info - Spans 9 Rows - Width 62px - Multi-line name wrapping */}
                            {isRow0 && (
                              <td
                                rowSpan={9}
                                style={{ height: '43.2mm', maxHeight: '43.2mm', boxSizing: 'border-box' }}
                                className="border border-slate-900 p-0.5 text-center align-middle bg-white w-[62px] max-w-[62px] min-w-[62px] overflow-hidden"
                              >
                                <div className="flex flex-col justify-center items-center text-center h-full py-0.5 space-y-0.5">
                                  {/* Student Name Aligned in Center, Multi-line (First, Middle, Last) */}
                                  <div className="font-black text-slate-950 text-[8.5px] leading-tight tracking-tight text-center w-full px-0.5 break-words" title={st.studentName}>
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
                                      <span className="inline-block bg-purple-700 text-white font-black px-1 py-0.2 rounded text-[6px] shadow-xs cce-badge">
                                        CWSN (EXEMPT)
                                      </span>
                                    </div>
                                  )}
                                  {cSt.hasCwsnMarksAllowed && (
                                    <div className="my-0.2">
                                      <span className="inline-block bg-indigo-700 text-white font-black px-1 py-0.2 rounded text-[6px] shadow-xs cce-badge">
                                        (CWSN)
                                      </span>
                                    </div>
                                  )}
                                  {/* CASTE, DOB, SATS NO, GENDER: Centered in cell */}
                                  <div className="w-full text-[7.5px] leading-tight text-slate-950 font-mono text-center flex flex-col items-center justify-center">
                                    <div className="truncate w-full"><span className="font-bold">C:</span> {st.caste || 'GM'}</div>
                                    <div className="truncate w-full"><span className="font-bold">DOB:</span> {st.dob || st.dateOfBirth || '-'}</div>
                                    <div className="truncate w-full"><span className="font-bold">S:</span> {st.satsNo || '-'}</div>
                                    <div className="truncate w-full"><span className="font-bold">G:</span> {st.gender === 'Girl' ? 'F' : 'M'}</div>
                                  </div>
                                </div>
                              </td>
                            )}

                            {/* 4. Attendance: Width 28px, Vertically Centered */}
                            {isRow0 && (
                              <td
                                rowSpan={4}
                                style={{ height: '19.2mm', maxHeight: '19.2mm', boxSizing: 'border-box', verticalAlign: 'middle', textAlign: 'center' }}
                                className="border border-slate-900 p-0 text-center align-middle font-bold bg-white overflow-hidden w-[28px] max-w-[28px]"
                              >
                                <div className="flex flex-col items-center justify-center h-full text-center py-1">
                                  <div className="text-slate-800 text-[7px] leading-none mb-0.5">1ನೇ Sem</div>
                                  {onUpdateSemAttendance ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-black text-blue-900 text-[10px]"
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
                                        className="cce-screen-input w-full text-center font-mono font-black text-blue-900 text-[10px] bg-transparent border-0 border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        title={`Edit Sem 1 Attendance (Max: ${Math.max(0, workingDays - (cSt.sem2Attendance || 0))})`}
                                      />
                                    </>
                                  ) : (
                                    <div className="font-mono font-black text-blue-900 text-[10px] text-center" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {cSt.sem1Attendance ?? '-'}
                                    </div>
                                  )}
                                </div>
                              </td>
                            )}
                            {isRow4 && (
                              <td
                                rowSpan={4}
                                style={{ height: '19.2mm', maxHeight: '19.2mm', boxSizing: 'border-box', verticalAlign: 'middle', textAlign: 'center' }}
                                className="border border-slate-900 p-0 text-center align-middle font-bold bg-white overflow-hidden w-[28px] max-w-[28px]"
                              >
                                <div className="flex flex-col items-center justify-center h-full text-center py-1">
                                  <div className="text-slate-800 text-[7px] leading-none mb-0.5">2ನೇ Sem</div>
                                  {onUpdateSemAttendance ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-black text-indigo-900 text-[10px]"
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
                                        className="cce-screen-input w-full text-center font-mono font-black text-indigo-900 text-[10px] bg-transparent border-0 border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        title={`Edit Sem 2 Attendance (Max: ${Math.max(0, workingDays - (cSt.sem1Attendance || 0))})`}
                                      />
                                    </>
                                  ) : (
                                    <div className="font-mono font-black text-indigo-900 text-[10px] text-center" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {cSt.sem2Attendance ?? '-'}
                                    </div>
                                  )}
                                </div>
                              </td>
                            )}
                            {isRow8 && (
                              <td
                                style={{ height: '4.8mm', maxHeight: '4.8mm', boxSizing: 'border-box', verticalAlign: 'middle', textAlign: 'center' }}
                                className="border border-slate-900 p-0 text-center align-middle font-black bg-amber-100 text-red-600 overflow-hidden w-[28px] max-w-[28px]"
                              >
                                <div className="flex items-center justify-center h-full text-center">
                                  {onUpdateAttendance ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-black text-red-600 text-[10px]"
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
                                        className="cce-screen-input w-full text-center font-mono font-black text-red-600 text-[10px] bg-transparent border-0 border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        title={`Total Attendance: ${cSt.attendanceDays || 0} / ${workingDays}`}
                                      />
                                    </>
                                  ) : (
                                    <div className="font-mono text-[10px] font-black leading-none text-center" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {cSt.attendanceDays ?? '-'}
                                    </div>
                                  )}
                                </div>
                              </td>
                            )}

                            {/* 5. Exam Period */}
                            <td style={{ height: '4.8mm', maxHeight: '4.8mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className={`border border-slate-900 p-0 font-bold text-center align-middle overflow-hidden ${isTotalRow ? 'bg-amber-100 text-red-600 font-black' : 'text-slate-900'}`}>
                              {r.exam}
                            </td>

                            {/* 6. Percentage */}
                            <td style={{ height: '4.8mm', maxHeight: '4.8mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className={`border border-slate-900 p-0 font-mono font-bold text-center align-middle overflow-hidden ${isTotalRow ? 'bg-amber-100 text-red-600 font-black' : 'text-slate-800'}`}>
                              {r.pct}
                            </td>

                            {/* 7. Curricular 7 Subjects (ಅಂಕ, ಶ್ರೇಣಿ) - NO UNDERLINE FOR MARKS & GRADES */}
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
                                  gradeVal = sub.grade || '-';
                                }
                              }

                              return (
                                <React.Fragment key={s.code}>
                                  <td
                                    style={{ height: '4.8mm', maxHeight: '4.8mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }}
                                    className={`border border-slate-900 p-0 font-mono text-[10px] text-center align-middle overflow-hidden ${isTotalRow ? 'text-red-600 font-bold' : ''}`}
                                  >
                                    {isExempt ? (
                                      '-'
                                    ) : r.isFinalTotal && onUpdateSubject100 ? (
                                      <>
                                        <div
                                          className="cce-pdf-text hidden w-full text-center font-mono font-black text-red-600 text-[10px]"
                                          style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                        >
                                          {markVal !== '-' ? markVal : '-'}
                                        </div>
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={markVal !== '-' ? markVal : ''}
                                          onChange={(e) => {
                                            const val = e.target.value.trim();
                                            if (val === '') onUpdateSubject100(st.id, s.code, null);
                                            else {
                                              const n = Number(val);
                                              if (!isNaN(n)) onUpdateSubject100(st.id, s.code, Math.min(100, Math.max(0, Math.floor(n))));
                                            }
                                          }}
                                          style={{ textAlign: 'center' }}
                                          className="cce-screen-input w-full text-center bg-transparent hover:bg-yellow-100 focus:bg-white font-mono font-black text-red-600 border-0 border-none outline-none focus:outline-none focus:ring-0 text-[10px] p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          placeholder="-"
                                          title={`Edit ${s.nameKn} 100 Marks (2-way sync)`}
                                        />
                                      </>
                                    ) : r.subExamKey && (onUpdateExamPct || onUpdateMarks) ? (
                                      <>
                                        <div
                                          className="cce-pdf-text hidden w-full text-center font-mono font-bold text-slate-900 text-[10px]"
                                          style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                        >
                                          {markVal !== '-' ? markVal : '-'}
                                        </div>
                                        <input
                                          type="number"
                                          min="0"
                                          max={r.prescribedMax}
                                          value={markVal !== '-' ? markVal : ''}
                                          onChange={(e) => {
                                            const val = e.target.value.trim();
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
                                          className="cce-screen-input w-full text-center bg-transparent hover:bg-blue-50 focus:bg-white font-mono font-bold text-slate-900 border-0 border-none outline-none focus:outline-none focus:ring-0 text-[10px] p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          placeholder="-"
                                          title={`Edit ${s.nameKn} ${r.exam} marks (Max: ${r.prescribedMax})`}
                                        />
                                      </>
                                    ) : (
                                      markVal
                                    )}
                                  </td>
                                  <td
                                    style={{ height: '4.8mm', maxHeight: '4.8mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }}
                                    className={`border border-slate-900 p-0 font-bold text-[10px] text-center align-middle overflow-hidden ${
                                      r.isFinalTotal ? 'text-green-600 font-black' : isTotalRow ? 'text-red-600 font-bold' : ''
                                    }`}
                                  >
                                    {gradeVal}
                                  </td>
                                </React.Fragment>
                              );
                            })}

                            {/* 8. Max Marks */}
                            <td style={{ height: '4.8mm', maxHeight: '4.8mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className={`border border-slate-900 p-0 font-mono font-black text-center align-middle text-[10px] overflow-hidden ${
                              r.isFinalTotal ? 'bg-amber-100 text-red-600' : isTotalRow ? 'bg-amber-100 text-red-600' : 'bg-slate-50/50'
                            }`}>
                              {r.maxMarks}
                            </td>

                            {/* 9. Total Across 7 Subjects: ಅಂಕ, ಶೇಕಡಾ, ಶ್ರೇಣಿ */}
                            <td style={{ height: '4.8mm', maxHeight: '4.8mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className={`border border-slate-900 p-0 font-mono font-bold text-center align-middle text-[10px] overflow-hidden ${
                              isTotalRow ? 'text-red-600 font-black bg-amber-100' : ''
                            }`}>
                              {isExempt ? '-' : (rowTotalMarks !== null ? rowTotalMarks : '-')}
                            </td>
                            <td style={{ height: '4.8mm', maxHeight: '4.8mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className={`border border-slate-900 p-0 font-mono font-bold text-center align-middle text-[10px] overflow-hidden ${
                              r.isFinalTotal ? 'text-red-600 font-black bg-amber-100' : isTotalRow ? 'text-red-600 font-black bg-amber-100' : ''
                            }`}>
                              {isExempt ? '-' : rowPctStr}
                            </td>
                            <td style={{ height: '4.8mm', maxHeight: '4.8mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className={`border border-slate-900 p-0 font-black text-center align-middle text-[10px] overflow-hidden ${
                              r.isFinalTotal ? 'text-green-600 font-black bg-amber-100' : isTotalRow ? 'text-red-600 font-black bg-amber-100' : ''
                            }`}>
                              {isExempt ? (r.isFinalTotal ? 'Exempt' : '-') : rowGrade}
                            </td>

                            {/* 10. Part B Item 1: Art Edu / Work Exp (2 cols: Marks, Grade) - NO UNDERLINE */}
                            {isRow0 && (
                              <>
                                <td rowSpan={4} style={{ height: '19.2mm', maxHeight: '19.2mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-0 font-mono font-bold text-center align-middle bg-indigo-50/40 text-[10px] overflow-hidden">
                                  {onUpdatePartBMarks ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-bold text-indigo-950 text-[10px]"
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
                                        className="cce-screen-input w-full text-center bg-transparent hover:bg-white focus:bg-white font-mono font-bold text-indigo-950 border-0 border-none outline-none focus:outline-none focus:ring-0 text-[10px] p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="-"
                                        title="Edit Art Edu Sem 1 Marks (Max 50)"
                                      />
                                    </>
                                  ) : (
                                    <div className="text-center font-mono font-bold" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {artSub?.sem1 !== null && artSub?.sem1 !== undefined ? artSub.sem1 : '-'}
                                    </div>
                                  )}
                                </td>
                                <td rowSpan={4} style={{ height: '19.2mm', maxHeight: '19.2mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-0 font-bold text-center align-middle bg-indigo-50/40 text-indigo-950 text-[10px] overflow-hidden">
                                  {artSub?.sem1_grade || '-'}
                                </td>
                              </>
                            )}
                            {isRow4 && (
                              <>
                                <td rowSpan={4} style={{ height: '19.2mm', maxHeight: '19.2mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-0 font-mono font-bold text-center align-middle bg-indigo-50/40 text-[10px] overflow-hidden">
                                  {onUpdatePartBMarks ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-bold text-indigo-950 text-[10px]"
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
                                        className="cce-screen-input w-full text-center bg-transparent hover:bg-white focus:bg-white font-mono font-bold text-indigo-950 border-0 border-none outline-none focus:outline-none focus:ring-0 text-[10px] p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="-"
                                        title="Edit Art Edu Sem 2 Marks (Max 50)"
                                      />
                                    </>
                                  ) : (
                                    <div className="text-center font-mono font-bold" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {artSub?.sem2 !== null && artSub?.sem2 !== undefined ? artSub.sem2 : '-'}
                                    </div>
                                  )}
                                </td>
                                <td rowSpan={4} style={{ height: '19.2mm', maxHeight: '19.2mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-0 font-bold text-center align-middle bg-indigo-50/40 text-indigo-950 text-[10px] overflow-hidden">
                                  {artSub?.sem2_grade || '-'}
                                </td>
                              </>
                            )}
                            {isRow8 && (
                              <>
                                <td style={{ height: '4.8mm', maxHeight: '4.8mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-0 font-mono font-black text-center align-middle bg-amber-100 text-indigo-950 text-[10px] overflow-hidden">
                                  {onUpdatePartBMarks ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-black text-indigo-950 text-[10px]"
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
                                        className="cce-screen-input w-full text-center bg-transparent hover:bg-white focus:bg-white font-mono font-black text-indigo-950 border-0 border-none outline-none focus:outline-none focus:ring-0 text-[10px] p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="-"
                                        title="Edit Art Edu Total Marks (Max 100)"
                                      />
                                    </>
                                  ) : (
                                    <div className="text-center font-mono font-black" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {artSub?.total !== null && artSub?.total !== undefined ? artSub.total : '-'}
                                    </div>
                                  )}
                                </td>
                                <td style={{ height: '4.8mm', maxHeight: '4.8mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-0 font-black text-center align-middle bg-amber-100 text-indigo-950 text-[10px] overflow-hidden">
                                  {artSub?.grade || '-'}
                                </td>
                              </>
                            )}

                            {/* 11. Part B Item 2: Computer Education / ICT (2 cols: Marks, Grade) - NO UNDERLINE */}
                            {isRow0 && (
                              <>
                                <td rowSpan={4} style={{ height: '19.2mm', maxHeight: '19.2mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-0 font-mono font-bold text-center align-middle bg-blue-50/40 text-[10px] overflow-hidden">
                                  {onUpdatePartBMarks ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-bold text-blue-950 text-[10px]"
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
                                        className="cce-screen-input w-full text-center bg-transparent hover:bg-white focus:bg-white font-mono font-bold text-blue-950 border-0 border-none outline-none focus:outline-none focus:ring-0 text-[10px] p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="-"
                                        title="Edit Computer Edu Sem 1 Marks (Max 50)"
                                      />
                                    </>
                                  ) : (
                                    <div className="text-center font-mono font-bold" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {ictSub?.sem1 !== null && ictSub?.sem1 !== undefined ? ictSub.sem1 : '-'}
                                    </div>
                                  )}
                                </td>
                                <td rowSpan={4} style={{ height: '19.2mm', maxHeight: '19.2mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-0 font-bold text-center align-middle bg-blue-50/40 text-blue-950 text-[10px] overflow-hidden">
                                  {ictSub?.sem1_grade || '-'}
                                </td>
                              </>
                            )}
                            {isRow4 && (
                              <>
                                <td rowSpan={4} style={{ height: '19.2mm', maxHeight: '19.2mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-0 font-mono font-bold text-center align-middle bg-blue-50/40 text-[10px] overflow-hidden">
                                  {onUpdatePartBMarks ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-bold text-blue-950 text-[10px]"
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
                                        className="cce-screen-input w-full text-center bg-transparent hover:bg-white focus:bg-white font-mono font-bold text-blue-950 border-0 border-none outline-none focus:outline-none focus:ring-0 text-[10px] p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="-"
                                        title="Edit Computer Edu Sem 2 Marks (Max 50)"
                                      />
                                    </>
                                  ) : (
                                    <div className="text-center font-mono font-bold" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {ictSub?.sem2 !== null && ictSub?.sem2 !== undefined ? ictSub.sem2 : '-'}
                                    </div>
                                  )}
                                </td>
                                <td rowSpan={4} style={{ height: '19.2mm', maxHeight: '19.2mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-0 font-bold text-center align-middle bg-blue-50/40 text-blue-950 text-[10px] overflow-hidden">
                                  {ictSub?.sem2_grade || '-'}
                                </td>
                              </>
                            )}
                            {isRow8 && (
                              <>
                                <td style={{ height: '4.8mm', maxHeight: '4.8mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-0 font-mono font-black text-center align-middle bg-amber-100 text-blue-950 text-[10px] overflow-hidden">
                                  {onUpdatePartBMarks ? (
                                    <>
                                      <div
                                        className="cce-pdf-text hidden w-full text-center font-mono font-black text-blue-950 text-[10px]"
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
                                        className="cce-screen-input w-full text-center bg-transparent hover:bg-white focus:bg-white font-mono font-black text-blue-950 border-0 border-none outline-none focus:outline-none focus:ring-0 text-[10px] p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="-"
                                        title="Edit Computer Edu Total Marks (Max 100)"
                                      />
                                    </>
                                  ) : (
                                    <div className="text-center font-mono font-black" style={{ textAlign: 'center', margin: '0 auto' }}>
                                      {ictSub?.total !== null && ictSub?.total !== undefined ? ictSub.total : '-'}
                                    </div>
                                  )}
                                </td>
                                <td style={{ height: '4.8mm', maxHeight: '4.8mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-0 font-black text-center align-middle bg-amber-100 text-blue-950 text-[10px] overflow-hidden">
                                  {ictSub?.grade || '-'}
                                </td>
                              </>
                            )}

                            {/* 12. 7 Co-Scholastic Activities - NO UNDERLINE */}
                            {isRow0 && (
                              <>
                                {HP_CO_ACTIVITIES.map((act) => {
                                  const grd = getHpCoGradeValue(cSt.coScholastic.sem1, act.key);
                                  return (
                                    <td
                                      key={act.key}
                                      rowSpan={4}
                                      style={{ height: '19.2mm', maxHeight: '19.2mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }}
                                      className="border border-slate-900 p-0 w-[18px] font-mono font-bold text-[10px] text-center align-middle bg-white overflow-hidden"
                                    >
                                      {onUpdateCoGrade ? (
                                        <>
                                          <div
                                            className="cce-pdf-text hidden w-full text-center font-bold text-[10px]"
                                            style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                          >
                                            {grd || '-'}
                                          </div>
                                          <select
                                            value={grd !== '-' ? grd : ''}
                                            onChange={(e) => onUpdateCoGrade(st.id, 'sem1', act.key, e.target.value)}
                                            style={{ textAlign: 'center' }}
                                            className="cce-screen-input bg-transparent font-bold text-[10px] text-slate-800 border-0 border-none outline-none focus:outline-none focus:ring-0 cursor-pointer p-0 m-0 text-center w-full"
                                          >
                                            <option value="">-</option>
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="C">C</option>
                                          </select>
                                        </>
                                      ) : (
                                        <div className="text-center font-bold" style={{ textAlign: 'center', margin: '0 auto' }}>
                                          {grd}
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
                                      style={{ height: '19.2mm', maxHeight: '19.2mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }}
                                      className="border border-slate-900 p-0 w-[18px] font-mono font-bold text-[10px] text-center align-middle bg-white overflow-hidden"
                                    >
                                      {onUpdateCoGrade ? (
                                        <>
                                          <div
                                            className="cce-pdf-text hidden w-full text-center font-bold text-[10px]"
                                            style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                          >
                                            {grd || '-'}
                                          </div>
                                          <select
                                            value={grd !== '-' ? grd : ''}
                                            onChange={(e) => onUpdateCoGrade(st.id, 'sem2', act.key, e.target.value)}
                                            style={{ textAlign: 'center' }}
                                            className="cce-screen-input bg-transparent font-bold text-[10px] text-slate-800 border-0 border-none outline-none focus:outline-none focus:ring-0 cursor-pointer p-0 m-0 text-center w-full"
                                          >
                                            <option value="">-</option>
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="C">C</option>
                                          </select>
                                        </>
                                      ) : (
                                        <div className="text-center font-bold" style={{ textAlign: 'center', margin: '0 auto' }}>
                                          {grd}
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
                                      style={{ height: '4.8mm', maxHeight: '4.8mm', boxSizing: 'border-box', textAlign: 'center', verticalAlign: 'middle' }}
                                      className="border border-slate-900 p-0 w-[18px] font-mono font-black text-[10px] text-center align-middle bg-amber-100 text-red-600 overflow-hidden"
                                    >
                                      {onUpdateCoGrade ? (
                                        <>
                                          <div
                                            className="cce-pdf-text hidden w-full text-center font-black text-[10px]"
                                            style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}
                                          >
                                            {grd || '-'}
                                          </div>
                                          <select
                                            value={grd !== '-' ? grd : ''}
                                            onChange={(e) => onUpdateCoGrade(st.id, 'final', act.key, e.target.value)}
                                            style={{ textAlign: 'center' }}
                                            className="cce-screen-input bg-transparent font-black text-[10px] text-red-600 border-0 border-none outline-none focus:outline-none focus:ring-0 cursor-pointer p-0 m-0 text-center w-full"
                                          >
                                            <option value="">-</option>
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="C">C</option>
                                          </select>
                                        </>
                                      ) : (
                                        <div className="text-center font-black" style={{ textAlign: 'center', margin: '0 auto' }}>
                                          {grd}
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </>
                            )}

                            {/* 13. Result - Spans 9 Rows */}
                            {isRow0 && (
                              <td
                                rowSpan={9}
                                style={{ height: '43.2mm', maxHeight: '43.2mm', boxSizing: 'border-box' }}
                                className={`border border-slate-900 p-0.5 align-middle text-center font-black overflow-hidden ${
                                  isExempt
                                    ? 'bg-purple-50 text-purple-900'
                                    : cSt.isPassed
                                    ? 'bg-emerald-50 text-emerald-900'
                                    : 'bg-rose-50 text-rose-900'
                                }`}
                              >
                                <span
                                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '39mm' }}
                                  className={`inline-block whitespace-nowrap py-0.5 mx-auto font-black text-[8.5px] ${
                                    isExempt
                                      ? 'text-purple-800'
                                      : cSt.isPassed
                                      ? 'text-emerald-700'
                                      : 'text-rose-700'
                                  }`}
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
          </div>
        </div>
      ))}
    </div>
  );
};
