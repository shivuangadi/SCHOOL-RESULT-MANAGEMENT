import React, { useState, useMemo, useRef } from 'react';
import { SchoolRecord, isCwsnStudent, formatClassOrdinal, formatClassStd } from '../../types';
import {
  ComputedStudentCce,
  CO_SCHOLASTIC_ACTIVITIES,
  extractLastWordOfSchoolName,
  PrimarySubjectCode,
} from '../../utils/primaryCceHelper';
import {
  downloadElementAsHtml,
  shareReportToWhatsApp,
  printPrimaryCcePage2Register,
  exportPrimaryCcePage2Pdf,
  exportPrimaryCcePage2Html,
  type ReportPaperSize,
  REPORT_PAPER_SIZES,
} from '../../utils/report_layouts/group1_kannada_english/kannadaEnglishPage2LayoutHelper';
import { handleTableGridNavigation } from '../../utils/tableNavigationHelper';
import {
  Printer,
  Download,
  FileCode,
  Share2,
  Users,
  Plus,
  Minus,
} from 'lucide-react';

interface CcePage2RegisterProps {
  computedList: ComputedStudentCce[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  selectedClass: string;
  classTeacherName: string;
  workingDays: number;
  reportRef?: React.RefObject<HTMLDivElement | null>;
  onUpdateSubject100?: (studentId: string, subCode: PrimarySubjectCode, total100: number) => void;
  onUpdateAttendance?: (studentId: string, days: number) => void;
  onUpdateFinalCoGrade?: (studentId: string, key: string, val: string) => void;
}

export const CcePage2Register: React.FC<CcePage2RegisterProps> = ({
  computedList,
  schoolRecord,
  academicYear,
  selectedClass,
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

  // Places and Dates (Editable inputs)
  const defaultPlace = extractLastWordOfSchoolName(schoolRecord?.schoolName) || 'ಶಾಲೆ';
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

  // Calibrated and strictly locked dimensions:
  // - Locked row height: 1.5cm
  // - Marks & grades font size: 11pt
  const rowHeightCm = 1.5;
  const fontSizeMarksPt = 11;

  // Status message for feedback
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const isKannada =
    (schoolRecord?.medium || (schoolRecord as any)?.schoolMedium || '').toLowerCase().includes('kannada') ||
    (schoolRecord?.medium || (schoolRecord as any)?.schoolMedium || '').includes('ಕನ್ನಡ') ||
    !(schoolRecord?.medium || (schoolRecord as any)?.schoolMedium);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const [studentsPerPage, setStudentsPerPage] = useState<number>(12);

  // Dimensions of sheets in mm for Landscape:
  const paperConfig = REPORT_PAPER_SIZES[paperSize] || REPORT_PAPER_SIZES.legal;
  const sheetWidthMm = paperConfig.widthMm;
  const sheetHeightMm = paperConfig.heightMm;

  // Pagination calculation: chunk by studentsPerPage (default 12, configurable)
  const chunks = useMemo(() => {
    if (computedList.length === 0) return [[]];
    const result: ComputedStudentCce[][] = [];
    for (let i = 0; i < computedList.length; i += studentsPerPage) {
      result.push(computedList.slice(i, i + studentsPerPage));
    }
    return result;
  }, [computedList, studentsPerPage]);

  // PDF Export in clean pure B&W Landscape with all columns fitting
  const handleDownloadPdf = async () => {
    if (!printableRef.current) return;
    setIsExporting(true);
    showStatus(`📄 PDF ಸಿದ್ಧವಾಗುತ್ತಿದೆ (${paperSize.toUpperCase()} Landscape - All Columns)...`);
    try {
      const filename = `CCE_Page2_100Marks_Class_${selectedClass}_${academicYear}_${paperSize.toUpperCase()}_Landscape.pdf`;
      const ok = await exportPrimaryCcePage2Pdf(printableRef.current, filename, paperSize);
      if (ok) showStatus('✅ PDF ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!');
      else showStatus('⚠️ ಮುದ್ರಣ ವಿಂಡೋದಲ್ಲಿ "Save as PDF" ಆಯ್ಕೆಮಾಡಿ.');
    } catch (err) {
      console.error('PDF generation error:', err);
      showStatus('⚠️ PDF ಸಿದ್ಧಪಡಿಸುವಾಗ ದೋಷ ಸಂಭವಿಸಿದೆ.');
    } finally {
      setIsExporting(false);
    }
  };

  // HTML Export
  const handleDownloadHtml = () => {
    if (!printableRef.current) return;
    const filename = `CCE_Page2_100Marks_Class_${selectedClass}_${academicYear}.html`;
    exportPrimaryCcePage2Html(printableRef.current, filename, paperSize);
    showStatus('✅ HTML ಫೈಲ್ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!');
  };

  // WhatsApp Share
  const handleShareWhatsApp = async () => {
    if (!printableRef.current) return;
    showStatus('📱 WhatsApp ಫೋಟೋ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...');
    const caption = `*${schoolRecord?.schoolName || 'ಕರ್ನಾಟಕ ಶಾಲೆ'}*\n*100 ಅಂಕಗಳ ಕ್ರೋಢೀಕರಣ ವಹಿ (Page 2 - Landscape)*\nತರಗತಿ: ${selectedClass}ನೇ ತರಗತಿ\nಶೈಕ್ಷಣಿಕ ಸಾಲು: ${academicYear}\nವಿದ್ಯಾರ್ಥಿಗಳು: ${computedList.length}`;
    await shareReportToWhatsApp(
      printableRef.current,
      caption,
      `CCE_Page2_Class_${selectedClass}_${academicYear}`
    );
    showStatus('✅ WhatsApp ಹಂಚಿಕೆ ಯಶಸ್ವಿಯಾಗಿದೆ!');
  };

  // Print Handler
  const handlePrint = async () => {
    if (!printableRef.current) return;
    showStatus('🖨️ ಮುದ್ರಣ ವಿಂಡೋ ತೆರೆಯಲಾಗುತ್ತಿದೆ...');
    await printPrimaryCcePage2Register(
      printableRef.current,
      `CCE Page 2 100 Marks Consolidation - Class ${selectedClass}`,
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
              <span>📄 Page 2: 100 ಅಂಕಗಳ ಕ್ರೋಢೀಕರಣ ವಹಿ</span>
              <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                Pure B&W Landscape
              </span>
            </span>

            {/* Paper Size Selector (A4 or Legal) */}
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1">
              <span className="text-slate-400 text-[11px] font-bold">ಹಾಳೆಯ ಗಾತ್ರ:</span>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as ReportPaperSize)}
                className="bg-slate-900 text-amber-300 font-bold px-1.5 py-0.5 rounded focus:outline-none cursor-pointer text-xs"
              >
                <option value="legal">Legal Landscape (340mm × 210mm)</option>
                <option value="a4">A4 Landscape (297mm × 210mm)</option>
              </select>
            </div>

            {/* Students Per Page Selector with Increase (+) and Decrease (-) controls */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
              <Users className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-bold text-slate-200 text-xs">ಪುಟಕ್ಕೆ ವಿದ್ಯಾರ್ಥಿಗಳು:</span>
              <button
                type="button"
                onClick={() => setStudentsPerPage((prev) => Math.max(1, prev - 1))}
                className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white cursor-pointer"
                title="Decrease students per page"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-mono font-black text-amber-300 px-1 text-xs">
                {studentsPerPage}
              </span>
              <button
                type="button"
                onClick={() => setStudentsPerPage((prev) => Math.min(50, prev + 1))}
                className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white cursor-pointer"
                title="Increase students per page"
              >
                <Plus className="w-3 h-3" />
              </button>
              <select
                value={studentsPerPage}
                onChange={(e) => setStudentsPerPage(Number(e.target.value))}
                className="bg-slate-900 text-amber-300 font-bold border border-slate-700 rounded px-1.5 py-0.5 text-xs cursor-pointer ml-1"
              >
                {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 25].map((n) => (
                  <option key={n} value={n}>
                    {n} / ಪುಟ {n === 12 ? '(ಪೂರ್ವನಿಯೋಜಿತ)' : ''}
                  </option>
                ))}
              </select>
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
              <span>{isExporting ? 'ಸಿದ್ಧವಾಗುತ್ತಿದೆ...' : `PDF ಡೌನ್‌ಲೋಡ್ (${paperSize.toUpperCase()} Landscape)`}</span>
            </button>

            {/* HTML Download Button */}
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Download standalone HTML file"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>HTML ಡೌನ್‌ಲೋಡ್</span>
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
              <span>ಮುದ್ರಣ (Print)</span>
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
          - Left margin: 1.0cm, Right: 0.8cm, Top: 0.75cm, Bottom: 0.75cm
          - Page orientation: Strictly LANDSCAPE
          - All 22 columns fit in one page width (A4 or Legal)
          - Multi-page sheets (.report-page-sheet)
          - Signatures on the LAST page only, exactly 3cm below table
          ========================================================================= */}
      <div ref={printableRef} className="space-y-6 overflow-x-auto pb-4">
        {/* Scoped CSS for strict Landscape printing, black-and-white mode, and margins */}
        <style>{`
          @page {
            size: ${paperSize === 'a4' ? 'a4' : 'legal'} landscape !important;
            margin: 5mm 2mm 5mm 0mm !important;
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
          .cce-page2-sheet table {
            border-collapse: collapse !important;
            border: 1.5px solid #000000 !important;
            width: 100% !important;
            table-layout: fixed !important;
            background-color: #ffffff !important;
            color: #000000 !important;
          }

          .cce-page2-sheet th,
          .cce-page2-sheet td {
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

          .cce-page2-sheet th {
            font-weight: 800 !important;
          }

          /* Inputs in table appear as clean centered pure black text */
          .cce-page2-sheet input,
          .cce-page2-sheet select {
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
              className="report-page-sheet cce-page2-sheet bg-white text-black shadow-lg mx-auto flex flex-col justify-between print:shadow-none print:border-none"
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
                    {isKannada
                      ? `ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ ${schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ'}`
                      : `Office of the Block Education Officer and Block Resource Coordinator, ${schoolRecord?.taluk || 'Belagavi Rural'}`}
                  </p>
                  <h1 className="text-sm sm:text-base font-black text-black font-serif uppercase tracking-wide leading-tight">
                    {schoolRecord?.schoolName || 'ಸರಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ'} {schoolRecord?.diseCode ? `(${schoolRecord.diseCode})` : ''}
                  </h1>
                  <h2 className="text-xs font-extrabold text-black leading-tight">
                    {academicYear} {isKannada ? 'ನೇ ಸಾಲಿನ ರೂಪಣಾತ್ಮಕ ಹಾಗೂ ಸಂಕಲನಾತ್ಮಕ ಮೌಲ್ಯಮಾಪನ ಕ್ರೋಢೀಕರಣ ವಹಿ (100 ಅಂಕಗಳ ವಹಿ)' : 'Formative & Summative Assessment Consolidation Report (100 Marks Register)'}
                  </h2>

                  {/* Sub-Header Row: Class, Working Days, Teacher Name, Page number (Single row, no wrapping) */}
                  <div className="flex flex-row items-center justify-between flex-nowrap whitespace-nowrap text-[10.5px] font-bold text-black pt-0.5 px-2 border-t border-black mt-0.5 leading-tight">
                    <div>
                      <span>ತರಗತಿ (CLASS): <strong>{formatClassStd(selectedClass)}</strong></span>
                    </div>
                    <div>
                      <span>ಶಾಲೆ ನಡೆದ ದಿನಗಳು (WORKING DAYS): <strong>{workingDays}</strong></span>
                    </div>
                    <div>
                      <span>ವರ್ಗ ಶಿಕ್ಷಕರ ಹೆಸರು (TEACHER): <strong>{classTeacherName || 'Class Teacher'}</strong></span>
                    </div>
                    <div>
                      <span>ಪುಟ (PAGE): <strong>{pageIdx + 1} / {chunks.length}</strong></span>
                    </div>
                  </div>
                </div>

                {/* 2. Main 100 Marks Register Table (All 22 columns fit in one page without stretching) */}
                <div className="w-full overflow-visible">
                  <table
                    className="w-full text-center border-collapse border-2 border-black table-fixed text-[9.5px]"
                    style={{ tableLayout: 'fixed', width: '100%' }}
                    onKeyDown={handleTableGridNavigation}
                  >
                    {/* Fixed percentage widths: All 22 columns sum to exactly 100% to fit printable area */}
                    <colgroup>
                      {/* 1. Sl No */}
                      <col style={{ width: '2.5%' }} />
                      {/* 2. Reg No + SATS No */}
                      <col style={{ width: '7.5%' }} />
                      {/* 3. Student Name + DOB */}
                      <col style={{ width: '16.5%' }} />
                      {/* 4. Gender + Category (Boy or Girl) */}
                      <col style={{ width: '4.5%' }} />
                      {/* 5. Attendance */}
                      <col style={{ width: '4.0%' }} />
                      {/* 6-13. Part-A 4 Subjects x 2 cols = 8 cols (30.8%) */}
                      {/* FL Marks & Grade */}
                      <col style={{ width: '4.2%' }} />
                      <col style={{ width: '3.5%' }} />
                      {/* SL Marks & Grade */}
                      <col style={{ width: '4.2%' }} />
                      <col style={{ width: '3.5%' }} />
                      {/* MATHS Marks & Grade */}
                      <col style={{ width: '4.2%' }} />
                      <col style={{ width: '3.5%' }} />
                      {/* EVS Marks & Grade */}
                      <col style={{ width: '4.2%' }} />
                      <col style={{ width: '3.5%' }} />
                      {/* 14. Total 400 */}
                      <col style={{ width: '4.5%' }} />
                      {/* 15. Percentage % */}
                      <col style={{ width: '4.5%' }} />
                      {/* 16. Overall Grade */}
                      <col style={{ width: '3.5%' }} />
                      {/* 17-21. Part-B 5 Co-Scholastic columns (5 @ 3.1% = 15.5%) */}
                      {CO_SCHOLASTIC_ACTIVITIES.map((act) => (
                        <col key={act.key} style={{ width: '3.1%' }} />
                      ))}
                      {/* 22. Final Result */}
                      <col style={{ width: '6.2%' }} />
                    </colgroup>

                    <thead>
                      {/* Header Row 1 */}
                      <tr className="bg-white text-black font-bold border-b border-black">
                        {/* 1. Sl No */}
                        <th
                          rowSpan={3}
                          className="border border-black p-0.5 align-middle"
                        >
                          ಕ್ರ.ಸಂ
                        </th>

                        {/* 2. Combined: Regular No and SATS No in 2nd Column */}
                        <th
                          rowSpan={3}
                          className="border border-black p-0.5 align-middle"
                        >
                          <div className="leading-tight font-black">ದಾಖಲಾತಿ ಸಂ.</div>
                          <div className="text-[9.5px] font-mono font-normal">/ SATS ಸಂ.</div>
                        </th>

                        {/* 3. Combined: Student Name and DOB in one Column */}
                        <th
                          rowSpan={3}
                          className="border border-black p-1 align-middle font-black"
                        >
                          <div className="leading-tight">ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು</div>
                          <div className="text-[9.5px] font-normal">/ ಜನ್ಮ ದಿನಾಂಕ (DOB)</div>
                        </th>

                        {/* 4. Combined: Gender and Category in one Column (Caste Removed) */}
                        <th
                          rowSpan={3}
                          className="border border-black p-0.5 align-middle"
                        >
                          <div className="leading-tight font-black">ಲಿಂಗ</div>
                          <div className="text-[9.5px] font-normal">/ ಪ್ರವರ್ಗ</div>
                        </th>

                        {/* 5. Attendance */}
                        <th
                          rowSpan={3}
                          className="border border-black p-0.5 align-middle"
                        >
                          <div className="leading-tight">ಹಾಜರಾತಿ</div>
                        </th>

                        {/* 6. SCHOLASTIC 4 SUBJECTS (PART-A) SUPER HEADER */}
                        <th
                          colSpan={8}
                          className="border border-black p-0.5 font-black text-[11px] uppercase tracking-wider"
                        >
                          ಅ. ಪಠ್ಯ ವಿಷಯಗಳು (SCHOLASTIC) - 100 ಅಂಕಗಳಿಗೆ
                        </th>

                        {/* 7. Total 400 */}
                        <th
                          rowSpan={3}
                          className="border border-black p-0.5 font-black align-middle"
                        >
                          <div className="leading-tight">ಒಟ್ಟು</div>
                          <div className="text-[9px] font-mono">400</div>
                        </th>

                        {/* 8. Percentage */}
                        <th
                          rowSpan={3}
                          className="border border-black p-0.5 font-black align-middle"
                        >
                          ಶೇಕಡಾ %
                        </th>

                        {/* 9. Overall Grade */}
                        <th
                          rowSpan={3}
                          className="border border-black p-0.5 font-black align-middle"
                        >
                          ಶ್ರೇಣಿ
                        </th>

                        {/* 10. CO-SCHOLASTIC (PART-B) SUPER HEADER: All 5 columns 0.75cm even width */}
                        <th
                          colSpan={5}
                          className="border border-black p-0.5 font-black text-[11px] uppercase tracking-wider"
                        >
                          ಆ. ಸಹ ಪಠ್ಯ ವಿಷಯಗಳು (CO-SCHOLASTIC)
                        </th>

                        {/* 11. Final Result */}
                        <th
                          rowSpan={3}
                          className="border border-black p-0.5 font-black align-middle"
                        >
                          ಫಲಿತಾಂಶ
                        </th>
                      </tr>

                      {/* Header Row 2: Part-A Subject Names & Part-B Co-Scholastic Activity Names */}
                      <tr className="bg-white text-black font-bold text-[10px] border-b border-black">
                        {/* 4 Subjects: FL, SL, MATHS, EVS */}
                        <th colSpan={2} className="border border-black p-0.5">
                          ಪ್ರಥಮ ಭಾಷೆ
                        </th>
                        <th colSpan={2} className="border border-black p-0.5">
                          ದ್ವಿತೀಯ ಭಾಷೆ
                        </th>
                        <th colSpan={2} className="border border-black p-0.5">
                          ಗಣಿತ
                        </th>
                        <th colSpan={2} className="border border-black p-0.5">
                          ಪರಿಸರ ಅಧ್ಯಯನ
                        </th>

                        {/* Part-B 5 Co-Scholastic Activities (Even width: default 0.75cm) */}
                        {CO_SCHOLASTIC_ACTIVITIES.map((act) => (
                          <th
                            key={act.key}
                            rowSpan={2}
                            className="border border-black p-0.5 align-middle text-[8.5px] leading-tight"
                          >
                            <div className="flex items-center justify-center h-16 w-full overflow-hidden text-center">
                              <span
                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                className="inline-block whitespace-nowrap font-bold text-[8px] mx-auto py-0.5"
                              >
                                {act.nameKn}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>

                      {/* Header Row 3: Sub-columns for 4 Subjects: ಅಂಕ & ಶ್ರೇಣಿ */}
                      <tr className="bg-white text-black text-[9px] font-bold border-b border-black">
                        {/* FL: ಅಂಕ & ಶ್ರೇಣಿ */}
                        <th className="border border-black p-0.5">ಅಂಕ</th>
                        <th className="border border-black p-0.5">ಶ್ರೇಣಿ</th>

                        {/* SL: ಅಂಕ & ಶ್ರೇಣಿ */}
                        <th className="border border-black p-0.5">ಅಂಕ</th>
                        <th className="border border-black p-0.5">ಶ್ರೇಣಿ</th>

                        {/* MATHS: ಅಂಕ & ಶ್ರೇಣಿ */}
                        <th className="border border-black p-0.5">ಅಂಕ</th>
                        <th className="border border-black p-0.5">ಶ್ರೇಣಿ</th>

                        {/* EVS: ಅಂಕ & ಶ್ರೇಣಿ */}
                        <th className="border border-black p-0.5">ಅಂಕ</th>
                        <th className="border border-black p-0.5">ಶ್ರೇಣಿ</th>
                      </tr>
                    </thead>

                    {/* Table Body: Exactly student rows for this page, center-aligned, row height default 1.5cm */}
                    <tbody>
                      {pageStudents.length === 0 ? (
                        <tr>
                          <td colSpan={22} className="border border-black p-6 text-center italic text-black font-bold">
                            ಈ ತರಗತಿಯಲ್ಲಿ ಯಾವುದೇ ವಿದ್ಯಾರ್ಥಿಗಳ ದಾಖಲಾತಿ ಇಲ್ಲ / No students enrolled in Class {formatClassOrdinal(selectedClass)}
                          </td>
                        </tr>
                      ) : (
                        pageStudents.map((cSt, idx) => {
                          const globalIdx = startStudentIdx + idx;
                          const st = cSt.student;
                          const fl = cSt.subjects.FL;
                          const sl = cSt.subjects.SL;
                          const maths = cSt.subjects.MATHS;
                          const evs = cSt.subjects.EVS;
                          const co = cSt.coScholastic.final;

                          return (
                            <tr
                              key={st.id}
                              style={{
                                height: `${rowHeightCm}cm`,
                                minHeight: `${rowHeightCm}cm`,
                              }}
                              className="border-b border-black bg-white text-black"
                            >
                              {/* 1. Sl No */}
                              <td className="border border-black p-0.5 font-bold font-mono text-center">
                                {globalIdx + 1}
                              </td>

                              {/* 2. Combined Column: Regular No. and SATS No. (Fetched from database, no auto-gen) */}
                              <td className="border border-black p-0.5 font-mono text-center">
                                <div className="font-bold leading-tight truncate">
                                  {st.schoolRegNo && st.schoolRegNo.trim().toUpperCase() !== 'N/A'
                                    ? st.schoolRegNo.trim()
                                    : '-'}
                                </div>
                                <div className="text-[9.5px] font-mono leading-tight mt-0.5 truncate">
                                  {st.satsNo && st.satsNo.trim().toUpperCase() !== 'N/A'
                                    ? st.satsNo.trim()
                                    : '-'}
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
                                {(cSt.isExempted || isCwsnStudent(st.cwsnStatus)) && (
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
                                  {(st as any).casteCategory || st.caste || 'OBC'}
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

                              {/* 6. FL 100 Marks (0.85cm width, 12pt font size, center aligned) */}
                              <td
                                style={{ fontSize: `${fontSizeMarksPt}px` }}
                                className="border border-black p-0.5 font-mono font-bold text-center"
                              >
                                {cSt.isExempted ? (
                                  '-'
                                ) : onUpdateSubject100 ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={fl.total100 !== null && fl.total100 !== undefined ? fl.total100 : ''}
                                    onChange={(e) => onUpdateSubject100(st.id, 'FL', Number(e.target.value))}
                                    placeholder="-"
                                    style={{ fontSize: `${fontSizeMarksPt}px` }}
                                    className="w-full text-center bg-transparent border-0 outline-none font-mono font-bold text-black p-0 m-0"
                                    title="Edit First Language 100 Marks"
                                  />
                                ) : (
                                  fl.total100 !== null && fl.total100 !== undefined ? fl.total100 : '-'
                                )}
                              </td>

                              {/* FL Grade (0.85cm width, 12pt font size, center aligned) */}
                              <td
                                style={{ fontSize: `${fontSizeMarksPt}px` }}
                                className="border border-black p-0.5 font-black text-center"
                              >
                                {cSt.isExempted ? 'Exempt' : fl.grade || '-'}
                              </td>

                              {/* 7. SL 100 Marks (0.85cm width, 12pt font size, center aligned) */}
                              <td
                                style={{ fontSize: `${fontSizeMarksPt}px` }}
                                className="border border-black p-0.5 font-mono font-bold text-center"
                              >
                                {cSt.isExempted ? (
                                  '-'
                                ) : onUpdateSubject100 ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={sl.total100 !== null && sl.total100 !== undefined ? sl.total100 : ''}
                                    onChange={(e) => onUpdateSubject100(st.id, 'SL', Number(e.target.value))}
                                    placeholder="-"
                                    style={{ fontSize: `${fontSizeMarksPt}px` }}
                                    className="w-full text-center bg-transparent border-0 outline-none font-mono font-bold text-black p-0 m-0"
                                    title="Edit Second Language 100 Marks"
                                  />
                                ) : (
                                  sl.total100 !== null && sl.total100 !== undefined ? sl.total100 : '-'
                                )}
                              </td>

                              {/* SL Grade (0.85cm width, 12pt font size, center aligned) */}
                              <td
                                style={{ fontSize: `${fontSizeMarksPt}px` }}
                                className="border border-black p-0.5 font-black text-center"
                              >
                                {cSt.isExempted ? 'Exempt' : sl.grade || '-'}
                              </td>

                              {/* 8. MATHS 100 Marks (0.85cm width, 12pt font size, center aligned) */}
                              <td
                                style={{ fontSize: `${fontSizeMarksPt}px` }}
                                className="border border-black p-0.5 font-mono font-bold text-center"
                              >
                                {cSt.isExempted ? (
                                  '-'
                                ) : onUpdateSubject100 ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={maths.total100 !== null && maths.total100 !== undefined ? maths.total100 : ''}
                                    onChange={(e) => onUpdateSubject100(st.id, 'MATHS', Number(e.target.value))}
                                    placeholder="-"
                                    style={{ fontSize: `${fontSizeMarksPt}px` }}
                                    className="w-full text-center bg-transparent border-0 outline-none font-mono font-bold text-black p-0 m-0"
                                    title="Edit Mathematics 100 Marks"
                                  />
                                ) : (
                                  maths.total100 !== null && maths.total100 !== undefined ? maths.total100 : '-'
                                )}
                              </td>

                              {/* MATHS Grade (0.85cm width, 12pt font size, center aligned) */}
                              <td
                                style={{ fontSize: `${fontSizeMarksPt}px` }}
                                className="border border-black p-0.5 font-black text-center"
                              >
                                {cSt.isExempted ? 'Exempt' : maths.grade || '-'}
                              </td>

                              {/* 9. EVS 100 Marks (0.85cm width, 12pt font size, center aligned) */}
                              <td
                                style={{ fontSize: `${fontSizeMarksPt}px` }}
                                className="border border-black p-0.5 font-mono font-bold text-center"
                              >
                                {cSt.isExempted ? (
                                  '-'
                                ) : onUpdateSubject100 ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={evs.total100 !== null && evs.total100 !== undefined ? evs.total100 : ''}
                                    onChange={(e) => onUpdateSubject100(st.id, 'EVS', Number(e.target.value))}
                                    placeholder="-"
                                    style={{ fontSize: `${fontSizeMarksPt}px` }}
                                    className="w-full text-center bg-transparent border-0 outline-none font-mono font-bold text-black p-0 m-0"
                                    title="Edit EVS 100 Marks"
                                  />
                                ) : (
                                  evs.total100 !== null && evs.total100 !== undefined ? evs.total100 : '-'
                                )}
                              </td>

                              {/* EVS Grade (0.85cm width, 12pt font size, center aligned) */}
                              <td
                                style={{ fontSize: `${fontSizeMarksPt}px` }}
                                className="border border-black p-0.5 font-black text-center"
                              >
                                {cSt.isExempted ? 'Exempt' : evs.grade || '-'}
                              </td>

                              {/* 10. Total 400 (Font size 12pt, Center aligned) */}
                              <td
                                style={{ fontSize: `${fontSizeMarksPt}px` }}
                                className="border border-black p-0.5 font-mono font-black text-center"
                              >
                                {cSt.isExempted ? '-' : (cSt.totalMarks400 > 0 ? cSt.totalMarks400 : '-')}
                              </td>

                              {/* 11. Percentage (Font size 12pt, Center aligned) */}
                              <td
                                style={{ fontSize: `${fontSizeMarksPt}px` }}
                                className="border border-black p-0.5 font-mono font-bold text-center"
                              >
                                {cSt.isExempted ? '-' : (cSt.totalMarks400 > 0 ? `${cSt.percentage}%` : '-')}
                              </td>

                              {/* 12. Overall Grade (Font size 12pt, Center aligned) */}
                              <td
                                style={{ fontSize: `${fontSizeMarksPt}px` }}
                                className="border border-black p-0.5 font-black text-center"
                              >
                                {cSt.overallGrade || '-'}
                              </td>

                              {/* 13. Part-B 5 Co-Scholastic Grades (0.75cm width each, Font size 12pt, Center aligned) */}
                              {CO_SCHOLASTIC_ACTIVITIES.map((act) => (
                                <td
                                  key={act.key}
                                  style={{ fontSize: `${fontSizeMarksPt}px` }}
                                  className="border border-black p-0.5 font-bold font-mono text-center"
                                >
                                  {onUpdateFinalCoGrade ? (
                                    <select
                                      value={co[act.key] || ''}
                                      onChange={(e) => onUpdateFinalCoGrade(st.id, act.key, e.target.value)}
                                      style={{ fontSize: `${fontSizeMarksPt}px` }}
                                      className="bg-transparent font-bold font-mono text-black border-none outline-none cursor-pointer text-center"
                                    >
                                      <option value="">-</option>
                                      <option value="A">A</option>
                                      <option value="B">B</option>
                                      <option value="C">C</option>
                                    </select>
                                  ) : (
                                    co[act.key] || '-'
                                  )}
                                </td>
                              ))}

                              {/* 14. Final Result (Wrapped into 2 lines, >= 30% promoted rule) */}
                              <td className="border border-black p-0.5 font-black text-[9px] text-center leading-tight">
                                {cSt.isExempted ? (
                                  <div>EXEMPTED</div>
                                ) : cSt.percentage >= 30 || cSt.resultStatus.includes('PROMOTED') || cSt.resultStatus.includes('ಉತ್ತೀರ್ಣ') ? (
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
              <div>
                {!isLastPage && (
                  <div className="pt-2 text-right text-[10px] text-black font-bold border-t border-black mt-2">
                    <span>ಮುಂದುವರಿದಿದೆ... (ಪುಟ {pageIdx + 1} / {chunks.length}) </span>
                  </div>
                )}

                {/* 3. Official Signatures at the bottom of the LAST PAGE ONLY
                    - Strictly 20mm (2cm) difference from table to signature space (marginTop: '20mm')
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
                          <span className="font-bold">ಸ್ಥಳ (Place):</span>
                          <input
                            type="text"
                            value={placeName}
                            onChange={(e) => setPlaceName(e.target.value)}
                            className="border-b border-black font-bold px-1 bg-transparent w-36 text-black focus:outline-none"
                            placeholder="ಸ್ಥಳದ ಹೆಸರು"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">ದಿನಾಂಕ (Date):</span>
                          <input
                            type="text"
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                            className="border-b border-black font-bold px-1 bg-transparent w-32 font-mono text-black focus:outline-none"
                            placeholder="DD/MM/YYYY"
                            title="ದಿನಾಂಕವನ್ನು ಇಲ್ಲಿ ಬದಲಾಯಿಸಿ (Editable Date)"
                          />
                        </div>
                      </div>

                      {/* Signature 1: Class Teacher */}
                      <div className="text-center space-y-1">
                        <div className="w-40 border-b border-black pb-1 font-bold text-center">
                          {classTeacherName || ' '}
                        </div>
                        <div className="text-[11px] font-black">ವರ್ಗ ಶಿಕ್ಷಕರ ಸಹಿ</div>
                        <div className="text-[9px] font-semibold text-black">(Class Teacher Signature)</div>
                      </div>

                      {/* Signature 2: Head Master & Seal */}
                      <div className="text-center space-y-1">
                        <div className="w-48 border-b border-black pb-1 font-bold text-center">
                          {schoolRecord?.headmasterName || ' '}
                        </div>
                        <div className="text-[11px] font-black">ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಸಹಿ & ಮೊಹರು</div>
                        <div className="text-[9px] font-semibold text-black">(HM Signature & Seal)</div>
                      </div>

                      {/* Signature 3: CRP */}
                      <div className="text-center space-y-1">
                        <div className="w-40 border-b border-black pb-1 font-bold text-center">
                          <input
                            type="text"
                            value={crpName}
                            onChange={(e) => setCrpName(e.target.value)}
                            placeholder="CRP ಹೆಸರು"
                            className="w-full text-center bg-transparent border-none outline-none font-bold text-xs text-black"
                          />
                        </div>
                        <div className="text-[11px] font-black">ಸಿ.ಆರ್.ಪಿ ಸಹಿ</div>
                        <div className="text-[9px] font-semibold text-black">(CRP Signature)</div>
                      </div>

                      {/* Signature 4: ECO */}
                      <div className="text-center space-y-1">
                        <div className="w-40 border-b border-black pb-1 font-bold text-center">
                          <input
                            type="text"
                            value={ecoName}
                            onChange={(e) => setEcoName(e.target.value)}
                            placeholder="ECO ಹೆಸರು"
                            className="w-full text-center bg-transparent border-none outline-none font-bold text-xs text-black"
                          />
                        </div>
                        <div className="text-[11px] font-black">ಇ.ಸಿ.ಒ ಸಹಿ</div>
                        <div className="text-[9px] font-semibold text-black">(ECO Signature)</div>
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
