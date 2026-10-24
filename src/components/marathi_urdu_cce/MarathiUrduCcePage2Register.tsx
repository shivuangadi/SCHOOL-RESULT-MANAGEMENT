import React, { useState, useMemo, useRef } from 'react';
import { SchoolRecord, isCwsnStudent, formatClassOrdinal, formatClassStd } from '../../types';
import {
  ComputedMarathiUrduStudent,
  MARATHI_URDU_CO_ACTIVITIES,
  MarathiUrduSubjectCode,
  getStudentCategoryGroup,
  getMarathiUrduSubjects,
} from '../../utils/marathiUrduCceHelper';
import { extractLastWordOfSchoolName } from '../../utils/primaryCceHelper';
import {
  downloadElementAsHtml,
  shareReportToWhatsApp,
  ReportPaperSize,
  REPORT_PAPER_SIZES,
} from '../../utils/printPdfHelper';
import {
  printMarathiUrduCcePage2Register,
  exportMarathiUrduCcePage2Pdf,
  exportMarathiUrduCcePage2Html,
} from '../../utils/report_layouts/group2_marathi_urdu/marathiUrduPage2LayoutHelper';
import {
  Printer,
  Download,
  FileCode,
  Share2,
  Users,
} from 'lucide-react';

interface MarathiUrduCcePage2RegisterProps {
  computedList: ComputedMarathiUrduStudent[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  selectedClass: string;
  medium: 'Marathi' | 'Urdu';
  classTeacherName: string;
  workingDays: number;
  reportRef?: React.RefObject<HTMLDivElement | null>;
  onUpdateSubject100?: (studentId: string, subCode: MarathiUrduSubjectCode, val: number) => void;
  onUpdateAttendance?: (studentId: string, days: number) => void;
  onUpdateFinalCoGrade?: (studentId: string, key: string, val: string) => void;
}

export const MarathiUrduCcePage2Register: React.FC<MarathiUrduCcePage2RegisterProps> = ({
  computedList,
  schoolRecord,
  academicYear,
  selectedClass,
  medium,
  classTeacherName,
  workingDays,
  reportRef: externalReportRef,
  onUpdateSubject100,
  onUpdateAttendance,
  onUpdateFinalCoGrade,
}) => {
  // Local ref fallback
  const internalRef = useRef<HTMLDivElement | null>(null);
  const printableRef = externalReportRef || internalRef;

  // Header info
  const talukName = schoolRecord?.taluk?.trim() || 'Belagavi Rural';
  const schoolName = schoolRecord?.schoolName || 'GOVERNMENT HIGHER PRIMARY SCHOOL';
  const diseCode = schoolRecord?.diseCode || '';

  // Places and Dates (Editable inputs)
  const defaultPlace = extractLastWordOfSchoolName(schoolName) || 'School';
  const [placeName, setPlaceName] = useState(defaultPlace);
  const [reportDate, setReportDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });

  // CRP & ECO names (Editable)
  const [crpName, setCrpName] = useState('');
  const [ecoName, setEcoName] = useState('');

  // Paper & Layout settings
  const [paperSize, setPaperSize] = useState<ReportPaperSize>('legal');

  // Fixed calibrated layout:
  // - Fixed 12 students per page for perfect fit
  // - Fixed 11.5mm (1.15cm) row height
  // - Prominent font size 11.0px
  const studentsPerPage = 12;
  const rowHeightCm = 1.15;
  const fontSizeMarksPt = 11.0;

  // Status message for feedback
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Clean Reg No: strictly from database, never show "N/A", "n/a", "NA", or auto-generated dummy numbers
  const cleanSchoolRegNo = (st: { schoolRegNo?: string; [key: string]: any }): string => {
    const val = (st.schoolRegNo || st.admissionNo || st.regNo || '').toString().trim();
    if (!val || val.toUpperCase() === 'N/A' || val.toUpperCase() === 'NA' || val.toLowerCase() === 'not applicable') {
      return '-';
    }
    return val;
  };

  // Clean SATS No: never show "N/A"
  const cleanSatsNo = (sats?: string): string => {
    const val = (sats || '').toString().trim();
    if (!val || val.toUpperCase() === 'N/A' || val.toUpperCase() === 'NA') {
      return '-';
    }
    return val;
  };

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Dimensions of sheets in mm for Landscape matching jsPDF exact page sizes
  const paperConfig = REPORT_PAPER_SIZES[paperSize] || REPORT_PAPER_SIZES.legal;
  const sheetWidthMm = paperConfig.widthMm;
  const sheetHeightMm = paperConfig.heightMm;

  // Subjects list for Marathi/Urdu Medium (5 Subjects)
  const subjects = useMemo(() => getMarathiUrduSubjects(medium), [medium]);

  // Pagination calculation: chunk by studentsPerPage (default 12, configurable)
  const chunks = useMemo(() => {
    if (computedList.length === 0) return [[]];
    const result: ComputedMarathiUrduStudent[][] = [];
    for (let i = 0; i < computedList.length; i += studentsPerPage) {
      result.push(computedList.slice(i, i + studentsPerPage));
    }
    return result;
  }, [computedList, studentsPerPage]);

  // PDF Export in clean pure B&W Landscape with all columns fitting
  const handleDownloadPdf = async () => {
    if (!printableRef.current) return;
    setIsExporting(true);
    showStatus(`Generating PDF (${medium} Medium - ${paperSize.toUpperCase()} Landscape)...`);
    try {
      const filename = `CCE_Page2_100Marks_${medium}_Class_${selectedClass}_${academicYear}_${paperSize.toUpperCase()}_Landscape.pdf`;
      const ok = await exportMarathiUrduCcePage2Pdf(printableRef.current, filename, paperSize);
      if (ok) showStatus('PDF downloaded successfully!');
      else showStatus('Select "Save as PDF" in the print dialog.');
    } catch (err) {
      console.error('PDF generation error:', err);
      showStatus('Error generating PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  // HTML Export
  const handleDownloadHtml = () => {
    if (!printableRef.current) return;
    const filename = `CCE_Page2_100Marks_${medium}_Class_${selectedClass}_${academicYear}.html`;
    exportMarathiUrduCcePage2Html(printableRef.current, filename, paperSize);
    showStatus('HTML file downloaded successfully!');
  };

  // WhatsApp Share
  const handleShareWhatsApp = async () => {
    if (!printableRef.current) return;
    showStatus('Preparing WhatsApp image...');
    const caption = `*${schoolName}*\n*100 Marks Consolidation Register (Page 2 - ${medium} Medium)*\nClass: ${formatClassStd(selectedClass)}\nAcademic Year: ${academicYear}\nStudents: ${computedList.length}`;
    await shareReportToWhatsApp(
      printableRef.current,
      caption,
      `CCE_Page2_${medium}_Class_${selectedClass}_${academicYear}`
    );
    showStatus('Shared to WhatsApp successfully!');
  };

  // Print Handler
  const handlePrint = async () => {
    if (!printableRef.current) return;
    showStatus('Opening print dialog...');
    await printMarathiUrduCcePage2Register(
      printableRef.current,
      `CCE Page 2 100 Marks Consolidation (${medium} Medium) - Class ${selectedClass}`,
      paperSize
    );
  };

  return (
    <div className="space-y-4 w-full">
      {/* =========================================================================
          TOP CONFIGURATION, ADJUSTMENT & ACTION TOOLBAR (Hidden in Print / PDF)
          ========================================================================= */}
      <div className="bg-slate-900 text-white p-3 sm:p-4 rounded-2xl shadow-md space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Summary and Paper Size */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
              <span>Page 2: 100 Marks Consolidation ({medium} Medium)</span>
              <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                Pure B&W Landscape
              </span>
            </span>

            {/* Paper Size Selector (A4 or Legal) */}
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1">
              <span className="text-slate-400 text-[11px] font-bold">Paper Size:</span>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as ReportPaperSize)}
                className="bg-slate-900 text-amber-300 font-bold px-1.5 py-0.5 rounded focus:outline-none cursor-pointer text-xs"
              >
                <option value="legal">Legal Landscape (340mm × 210mm)</option>
                <option value="a4">A4 Landscape (297mm × 210mm)</option>
              </select>
            </div>

            {/* Standard Calibrated 12 Students / Page Badge */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700 text-xs">
              <Users className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-bold text-slate-300">Layout:</span>
              <span className="font-mono font-black text-amber-300">12 Students / Page (Calibrated Fit)</span>
            </div>
          </div>

          {/* Right: Export & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* PDF Download Button */}
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Download pure B&W Landscape PDF with all columns fitted"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating...' : `PDF Export (${paperSize.toUpperCase()} Landscape)`}</span>
            </button>

            {/* HTML Download Button */}
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Download standalone HTML file"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>HTML Download</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Share report image to WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp Share</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Open Official Landscape Print Dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print (Landscape)</span>
            </button>
          </div>
        </div>



        {/* Status Toast */}
        {statusMessage && (
          <div className="bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-black text-center shadow-xs">
            {statusMessage}
          </div>
        )}
      </div>

      {/* =========================================================================
          PRINTABLE & EXPORTABLE DOCUMENT CONTAINER
          - Pure Black & White (No background colors)
          - Left margin: 2.0cm, Right: 0.8cm, Top: 0.75cm, Bottom: 0.75cm
          - Page orientation: Strictly LANDSCAPE
          - All columns fit in one page width (A4 or Legal)
          - Multi-page sheets (.report-page-sheet)
          - Signatures on the LAST page only, exactly 3cm below table
          ========================================================================= */}
      <div ref={printableRef} className="space-y-6 overflow-x-auto pb-4">
        {/* Scoped CSS for strict Landscape printing, black-and-white mode, and margins */}
        <style>{`
          @page {
            size: ${paperSize === 'a4' ? 'a4' : 'legal'} landscape !important;
            margin: 5mm 5mm 5mm 20mm !important; /* Strict 20mm left margin for register binding */
          }

          @media print {
            body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .report-page-sheet {
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              width: 100% !important;
              max-width: 100% !important;
              min-height: auto !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background-color: #ffffff !important;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .report-page-sheet > div,
            .cce-sheet-container {
              padding: 0 !important;
              padding-left: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              box-sizing: border-box !important;
            }
            .report-page-sheet:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            .print\\:hidden, .cce-print-hidden {
              display: none !important;
            }
          }

          /* Pure B&W table rules */
          .cce-marathi-page2-sheet table {
            border-collapse: collapse !important;
            border: 1.5px solid #000000 !important;
            width: 100% !important;
            table-layout: fixed !important;
            background-color: #ffffff !important;
            color: #000000 !important;
          }

          .cce-marathi-page2-sheet th,
          .cce-marathi-page2-sheet td {
            border: 1px solid #000000 !important;
            text-align: center !important;
            vertical-align: middle !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            white-space: normal !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            padding: 2px !important;
            line-height: 1.15 !important;
            box-sizing: border-box !important;
          }

          .cce-marathi-page2-sheet th {
            font-weight: 800 !important;
          }

          /* Inputs in table appear as clean centered pure black text */
          .cce-marathi-page2-sheet input,
          .cce-marathi-page2-sheet select {
            color: #000000 !important;
            background: transparent !important;
            text-align: center !important;
          }
        `}</style>

        {chunks.map((pageStudents, pageIdx) => {
          const isFirstPage = pageIdx === 0;
          const isLastPage = pageIdx === chunks.length - 1;
          const startStudentIdx = chunks
            .slice(0, pageIdx)
            .reduce((acc, curr) => acc + curr.length, 0);

          return (
            <div
              key={pageIdx}
              className="report-page-sheet cce-marathi-page2-sheet bg-white text-black shadow-lg mx-auto flex flex-col justify-between print:shadow-none print:border-none"
              style={{
                boxSizing: 'border-box',
                width: `${sheetWidthMm}mm`,
                minHeight: `${sheetHeightMm}mm`,
                paddingLeft: '15mm', // Strictly 1.5cm left margin as requested
                paddingRight: '7.5mm', // Strictly 0.75cm right margin as requested
                paddingTop: '8.5mm', // Strictly 0.85cm top margin as requested
                paddingBottom: '8.5mm', // Strictly 0.85cm bottom margin as requested
                backgroundColor: '#ffffff',
                color: '#000000',
              }}
            >
              <div
                className="cce-sheet-container w-full"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {/* 1. Official Header (Pure Black & White) */}
                <div className="text-center space-y-0.5 border-b-2 border-black pb-1 mb-1.5">
                  <p className="text-[10.5px] font-bold text-black uppercase tracking-wider leading-tight">
                    Office of the Block Education Officer and Block Resource Coordinator, {talukName}
                  </p>
                  <h1 className="text-sm sm:text-base font-black text-black font-serif uppercase tracking-wide leading-tight">
                    {schoolName} {diseCode ? `(${diseCode})` : ''}
                  </h1>
                  <h2 className="text-xs font-extrabold text-black leading-tight">
                    Formative and Summative Assessment Consolidation Report for the year {academicYear} (100 Marks Consolidation Register)
                  </h2>

                  {/* Sub-Header Row: Class, Working Days, Teacher Name, Page number (Single row, no wrapping) */}
                  <div className="flex flex-row items-center justify-between flex-nowrap whitespace-nowrap text-[10.5px] font-bold text-black pt-0.5 px-2 border-t border-black mt-0.5 leading-tight">
                    <div>
                      <span>CLASS: <strong>{formatClassStd(selectedClass)}</strong></span>
                    </div>
                    <div>
                      <span>WORKING DAYS: <strong>{workingDays}</strong></span>
                    </div>
                    <div>
                      <span>CLASS TEACHER'S NAME: <strong>{classTeacherName || 'Class Teacher'}</strong></span>
                    </div>
                    <div>
                      <span>PAGE: <strong>{pageIdx + 1} / {chunks.length}</strong></span>
                    </div>
                  </div>
                </div>

                {/* 2. Main 500 Marks Register Table (All 24 columns fit in one page without stretching) */}
                <div className="w-full overflow-visible">
                  <table
                    className="w-full text-center border-collapse border-2 border-black table-fixed text-[9.5px]"
                    style={{ tableLayout: 'fixed', width: '100%' }}
                  >
                    {/* Fixed percentage widths: All 24 columns sum to exactly 100% to fit printable area */}
                    <colgroup>
                      {/* 1. Sl No */}
                      <col style={{ width: '2.5%' }} />
                      {/* 2. Reg No + SATS No */}
                      <col style={{ width: '7.5%' }} />
                      {/* 3. Student Name + DOB */}
                      <col style={{ width: '15.0%' }} />
                      {/* 4. Gender + Category (Boy or Girl) */}
                      <col style={{ width: '4.5%' }} />
                      {/* 5. Attendance (3.8%) */}
                      <col style={{ width: '3.8%' }} />
                      {/* 6-15. Part-A 5 Subjects x 2 cols = 10 cols (35.0%) */}
                      {subjects.map((sub) => (
                        <React.Fragment key={sub.code}>
                          {/* Marks column: 3.8% (Decreased by 1%, same width as Attendance!) */}
                          <col style={{ width: '3.8%' }} />
                          {/* Grade column: 3.2% */}
                          <col style={{ width: '3.2%' }} />
                        </React.Fragment>
                      ))}
                      {/* 16. Total 500 */}
                      <col style={{ width: '4.0%' }} />
                      {/* 17. Percentage % */}
                      <col style={{ width: '4.0%' }} />
                      {/* 18. Overall Grade */}
                      <col style={{ width: '3.2%' }} />
                      {/* 19-23. Part-B 5 Co-Scholastic columns (5 @ 2.9% = 14.5%) */}
                      {MARATHI_URDU_CO_ACTIVITIES.map((act) => (
                        <col key={act.key} style={{ width: '2.9%' }} />
                      ))}
                      {/* 24. Final Result (Decreased by 1% from 7.0% to 6.0%) */}
                      <col style={{ width: '6.0%' }} />
                    </colgroup>

                    <thead>
                      {/* Header Row 1 */}
                      <tr className="bg-white text-black font-bold border-b border-black">
                        {/* 1. Sl No */}
                        <th
                          rowSpan={3}
                          className="border border-black p-0.5 align-middle"
                        >
                          SI NO
                        </th>

                        {/* 2. Combined: Regular No and SATS No in 2nd Column */}
                        <th
                          rowSpan={3}
                          className="border border-black p-0.5 align-middle"
                        >
                          <div className="leading-tight font-black">REG NO</div>
                          <div className="text-[9.5px] font-mono font-normal">/ SATS NO</div>
                        </th>

                        {/* 3. Combined: Student Name and DOB in one Column */}
                        <th
                          rowSpan={3}
                          className="border border-black p-1 align-middle font-black"
                        >
                          <div className="leading-tight">STUDENT NAME</div>
                          <div className="text-[9.5px] font-normal">/ DOB</div>
                        </th>

                        {/* 4. Combined: Gender and Category in one Column (Caste Removed) */}
                        <th
                          rowSpan={3}
                          className="border border-black p-0.5 align-middle"
                        >
                          <div className="leading-tight font-black">GENDER</div>
                          <div className="text-[9.5px] font-normal">/ CAT</div>
                        </th>

                        {/* 5. Attendance */}
                        <th
                          rowSpan={3}
                          className="border border-black p-0.5 align-middle text-[9px] leading-tight"
                        >
                          <div>DAYS</div>
                          <div className="text-[8px]">ATTENDED</div>
                        </th>

                        {/* 6. SCHOLASTIC 5 SUBJECTS (PART-A) SUPER HEADER */}
                        <th
                          colSpan={subjects.length * 2}
                          className="border border-black p-0.5 font-black text-[11px] uppercase tracking-wider"
                        >
                          A. SCHOLASTIC (100 MARKS EACH)
                        </th>

                        {/* 7. Total 500 */}
                        <th
                          rowSpan={3}
                          className="border border-black p-0.5 font-black align-middle"
                        >
                          <div className="leading-tight">TOTAL</div>
                          <div className="text-[9px] font-mono">500</div>
                        </th>

                        {/* 8. Percentage */}
                        <th
                          rowSpan={3}
                          className="border border-black p-0.5 font-black align-middle"
                        >
                          %
                        </th>

                        {/* 9. Overall Grade */}
                        <th
                          rowSpan={3}
                          className="border border-black p-0.5 font-black align-middle"
                        >
                          GRADE
                        </th>

                        {/* 10. CO-SCHOLASTIC (PART-B) SUPER HEADER: All 5 columns 0.75cm even width */}
                        <th
                          colSpan={MARATHI_URDU_CO_ACTIVITIES.length}
                          className="border border-black p-0.5 font-black text-[11px] uppercase tracking-wider"
                        >
                          B. CO-SCHOLASTIC
                        </th>

                        {/* 11. Final Result */}
                        <th
                          rowSpan={3}
                          className="border border-black p-0.5 font-black align-middle text-[9px] whitespace-nowrap"
                        >
                          RESULT
                        </th>
                      </tr>

                      {/* Header Row 2: Part-A Subject Names & Part-B Co-Scholastic Activity Names */}
                      <tr className="bg-white text-black font-bold text-[9.5px] border-b border-black">
                        {/* 5 Subjects */}
                        {subjects.map((sub) => (
                          <th key={sub.code} colSpan={2} className="border border-black p-0.5">
                            {sub.shortEn}
                          </th>
                        ))}

                        {/* Part-B 5 Co-Scholastic Activities (Even width: default 0.75cm) */}
                        {MARATHI_URDU_CO_ACTIVITIES.map((act) => (
                          <th
                            key={act.key}
                            rowSpan={2}
                            className="border border-black p-0.5 align-middle text-[8px] leading-tight"
                          >
                            <div className="flex items-center justify-center h-16 w-full overflow-hidden text-center">
                              <span
                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                className="inline-block whitespace-nowrap font-bold text-[7.5px] mx-auto py-0.5"
                              >
                                {act.nameEn}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>

                      {/* Header Row 3: Sub-columns for 5 Subjects: Marks & Grade */}
                      <tr className="bg-white text-black text-[9px] font-bold border-b border-black">
                        {subjects.map((sub) => (
                          <React.Fragment key={sub.code}>
                            <th className="border border-black p-0.5">M</th>
                            <th className="border border-black p-0.5">G</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>

                    {/* Table Body: Exactly student rows for this page, center-aligned, row height default 1.5cm */}
                    <tbody>
                      {pageStudents.length === 0 ? (
                        <tr>
                          <td colSpan={24} className="border border-black p-6 text-center italic text-black font-bold">
                            No students enrolled in Class {formatClassOrdinal(selectedClass)} ({medium} Medium)
                          </td>
                        </tr>
                      ) : (
                        pageStudents.map((cSt, idx) => {
                          const globalIdx = startStudentIdx + idx;
                          const st = cSt.student;
                          const isExempted = cSt.isExempted;
                          const finalCo = cSt.coScholastic.final;

                          return (
                            <tr
                              key={st.id}
                              style={{
                                height: '9.8mm',
                                minHeight: '9.8mm',
                              }}
                              className="border-b border-black bg-white text-black"
                            >
                              {/* 1. Sl No */}
                              <td className="border border-black p-0.5 font-bold font-mono text-center">
                                {globalIdx + 1}
                              </td>

                              {/* 2. Combined Column: Regular No. and SATS No. (Fetched from student database, no N/A, no auto-gen) */}
                              <td className="border border-black p-0.5 font-mono text-center">
                                <div className="font-bold leading-tight truncate">
                                  {cleanSchoolRegNo(st)}
                                </div>
                                <div className="text-[9.5px] font-mono leading-tight mt-0.5 truncate">
                                  {cleanSatsNo(st.satsNo)}
                                </div>
                              </td>

                              {/* 3. Combined Column: Student Name and DOB (Font size 10, No Overlap, No Line) */}
                              <td className="border border-black p-0.5 text-center align-middle">
                                <div className="font-bold leading-tight break-words text-[10px] text-black">
                                  {st.studentName}
                                </div>
                                <div className="text-[9px] font-mono leading-tight mt-0.5 text-slate-900">
                                  DOB: {st.dob || st.dateOfBirth || '-'}
                                </div>
                                {(cSt.hasCwsnBadge || isCwsnStudent(st.cwsnStatus)) && (
                                  <div className="text-[8px] font-black border border-black px-1 rounded inline-block mt-0.5">
                                    CWSN
                                  </div>
                                )}
                              </td>

                              {/* 4. Combined Column: Gender and Category (Boy or Girl) */}
                              <td className="border border-black p-0.5 text-center">
                                <div className="font-bold leading-tight text-[10.5px]">
                                  {st.gender === 'Girl' ? 'Girl' : 'Boy'}
                                </div>
                                <div className="text-[9.5px] font-semibold leading-tight mt-0.5">
                                  {getStudentCategoryGroup(st)}
                                </div>
                              </td>

                              {/* 5. Attendance Days */}
                              <td className="border border-black p-0.5 font-mono font-bold text-center">
                                {onUpdateAttendance ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max={workingDays}
                                    value={cSt.attendanceDays || ''}
                                    onChange={(e) => onUpdateAttendance(st.id, Number(e.target.value))}
                                    className="w-full text-center bg-transparent border-0 outline-none font-mono font-bold text-black p-0 m-0 text-xs"
                                    title="Edit Attendance Days"
                                  />
                                ) : (
                                  cSt.attendanceDays ?? '-'
                                )}
                              </td>

                              {/* 6-15. 5 Subjects Marks & Grades (10 sub-columns, 0.85cm width each, 12pt font size, center aligned) */}
                              {subjects.map((sub) => {
                                const subData = cSt.subjects[sub.code];
                                const markVal = subData?.total100;
                                const gradeVal = subData?.grade;

                                return (
                                  <React.Fragment key={sub.code}>
                                    {/* Mark */}
                                    <td
                                      style={{ fontSize: `${fontSizeMarksPt}px` }}
                                      className="border border-black p-0.5 font-mono font-bold text-center"
                                    >
                                      {isExempted ? (
                                        '-'
                                      ) : onUpdateSubject100 ? (
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={markVal !== null && markVal !== undefined ? markVal : ''}
                                          onChange={(e) => onUpdateSubject100(st.id, sub.code, Number(e.target.value))}
                                          placeholder="-"
                                          style={{ fontSize: `${fontSizeMarksPt}px` }}
                                          className="w-full text-center bg-transparent border-0 outline-none font-mono font-bold text-black p-0 m-0"
                                          title={`Edit ${sub.shortEn} 100 Marks`}
                                        />
                                      ) : (
                                        markVal !== null && markVal !== undefined ? markVal : '-'
                                      )}
                                    </td>

                                    {/* Grade */}
                                    <td
                                      style={{ fontSize: `${fontSizeMarksPt}px` }}
                                      className="border border-black p-0.5 font-black text-center"
                                    >
                                      {isExempted ? 'Exempt' : gradeVal || '-'}
                                    </td>
                                  </React.Fragment>
                                );
                              })}

                              {/* 16. Total 500 (Font size 12pt, Center aligned) */}
                              <td
                                style={{ fontSize: `${fontSizeMarksPt}px` }}
                                className="border border-black p-0.5 font-mono font-black text-center"
                              >
                                {isExempted ? '-' : (cSt.totalMarks500 && cSt.totalMarks500 > 0 ? cSt.totalMarks500 : '-')}
                              </td>

                              {/* 17. Percentage (Font size 12pt, Center aligned) */}
                              <td
                                style={{ fontSize: `${fontSizeMarksPt}px` }}
                                className="border border-black p-0.5 font-mono font-bold text-center"
                              >
                                {isExempted ? '-' : (cSt.totalMarks500 && cSt.totalMarks500 > 0 ? `${cSt.percentage}%` : '-')}
                              </td>

                              {/* 18. Overall Grade (Font size 12pt, Center aligned) */}
                              <td
                                style={{ fontSize: `${fontSizeMarksPt}px` }}
                                className="border border-black p-0.5 font-black text-center"
                              >
                                {cSt.overallGrade || '-'}
                              </td>

                              {/* 19-23. Part-B 5 Co-Scholastic Grades (No downward arrow) */}
                              {MARATHI_URDU_CO_ACTIVITIES.map((act) => (
                                <td
                                  key={act.key}
                                  style={{ fontSize: `${fontSizeMarksPt}px` }}
                                  className="border border-black p-0.5 font-bold font-mono text-center"
                                >
                                  {onUpdateFinalCoGrade ? (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                      <span className="hidden print:inline cce-pdf-text font-bold font-mono text-center">
                                        {finalCo[act.key] || '-'}
                                      </span>
                                      <select
                                        value={finalCo[act.key] || ''}
                                        onChange={(e) => onUpdateFinalCoGrade(st.id, act.key, e.target.value)}
                                        style={{ fontSize: `${fontSizeMarksPt}px` }}
                                        className="appearance-none [-webkit-appearance:none] [-moz-appearance:none] bg-transparent font-bold font-mono text-black border-none outline-none cursor-pointer text-center w-full cce-screen-input print:hidden"
                                        title="Select Grade"
                                      >
                                        <option value="">-</option>
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                      </select>
                                    </div>
                                  ) : (
                                    finalCo[act.key] || '-'
                                  )}
                                </td>
                              ))}

                              {/* 24. Final Result (Wrapped into 2 lines, prominent font) */}
                              <td className="border border-black p-0.5 font-black text-[9px] text-center leading-tight">
                                {isExempted ? (
                                  <div>EXEMPTED</div>
                                ) : cSt.resultStatus.includes('PASS') || cSt.resultStatus.includes('PROMOTED') ? (
                                  <div>PROMOTED</div>
                                ) : (
                                  <div className="text-red-700 font-black">
                                    <div>NOT</div>
                                    <div>PROMOTED</div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Page Footer / Signatures Area */}
              <div className="mt-auto">
                {!isLastPage && (
                  <div className="pt-2 text-right text-[10px] text-black font-bold border-t border-black mt-2">
                    <span>Contd... (Page {pageIdx + 1} / {chunks.length}) — Class {formatClassStd(selectedClass)} ({medium} Medium 500 Marks Register)</span>
                  </div>
                )}

                {/* 3. Official Signatures at the bottom of the LAST PAGE ONLY
                    - Class Teacher, Headmaster, CRP, and ECO signatures
                    - Date & Place are fully editable text inputs
                    - Pure black and white
                */}
                {isLastPage && (
                  <div
                    style={{ marginTop: '20mm' }}
                    className="cce-signatures-block pt-2 text-black text-xs font-bold border-t border-black break-inside-avoid print:break-inside-avoid"
                  >
                    <div className="flex flex-row items-end justify-between gap-4 w-full px-2">
                      {/* Left: Place and Editable Date */}
                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">Place:</span>
                          <input
                            type="text"
                            value={placeName}
                            onChange={(e) => setPlaceName(e.target.value)}
                            className="border-b border-black font-bold px-1 bg-transparent w-36 text-black focus:outline-none"
                            placeholder="Place Name"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">Date:</span>
                          <input
                            type="text"
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                            className="border-b border-black font-bold px-1 bg-transparent w-32 font-mono text-black focus:outline-none"
                            placeholder="DD/MM/YYYY"
                            title="Edit Date"
                          />
                        </div>
                      </div>

                      {/* Signature 1: Class Teacher */}
                      <div className="text-center space-y-1">
                        <div className="w-40 border-b border-black pb-1 font-bold text-center">
                          {classTeacherName || ' '}
                        </div>
                        <div className="text-[11px] font-black">Class Teacher's Signature</div>
                      </div>

                      {/* Signature 2: Head Master & Seal */}
                      <div className="text-center space-y-1">
                        <div className="w-48 border-b border-black pb-1 font-bold text-center">
                          {schoolRecord?.headmasterName || ' '}
                        </div>
                        <div className="text-[11px] font-black">Head Master's Signature & Seal</div>
                      </div>

                      {/* Signature 3: CRP */}
                      <div className="text-center space-y-1">
                        <div className="w-40 border-b border-black pb-1 font-bold text-center">
                          <input
                            type="text"
                            value={crpName}
                            onChange={(e) => setCrpName(e.target.value)}
                            placeholder="CRP Name"
                            className="w-full text-center bg-transparent border-none outline-none font-bold text-xs text-black"
                          />
                        </div>
                        <div className="text-[11px] font-black">CRP Signature</div>
                      </div>

                      {/* Signature 4: ECO */}
                      <div className="text-center space-y-1">
                        <div className="w-40 border-b border-black pb-1 font-bold text-center">
                          <input
                            type="text"
                            value={ecoName}
                            onChange={(e) => setEcoName(e.target.value)}
                            placeholder="ECO Name"
                            className="w-full text-center bg-transparent border-none outline-none font-bold text-xs text-black"
                          />
                        </div>
                        <div className="text-[11px] font-black">ECO Signature</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
