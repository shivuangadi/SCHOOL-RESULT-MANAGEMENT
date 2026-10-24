import React, { useState, useMemo, useEffect } from 'react';
import { SchoolRecord, isCwsnStudent, isCwsnExempted } from '../../types';
import {
  ComputedHpStudent,
  HpSubjectCode,
  HP_CO_ACTIVITIES,
  getHpSubjectsForMedium,
} from '../../utils/higherPrimaryCceHelper';
import { Printer, Download, CheckCircle2, FileCode, Sliders, Plus, Minus, Users } from 'lucide-react';
import {
  printHpCcePage3Register,
  exportHpCcePage3RegisterPdf,
  downloadElementAsHtml,
  ReportPaperSize,
  REPORT_PAPER_SIZES,
} from '../../utils/printPdfHelper';

interface HpCcePage3Register100Props {
  computedList: ComputedHpStudent[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  selectedClass: string;
  classTeacherName: string;
  workingDays: number;
  reportRef?: React.RefObject<HTMLDivElement | null>;
  initialPaperSize?: ReportPaperSize;
  onUpdateSubject100?: (studentId: string, subCode: HpSubjectCode, total100: number | null) => void;
  onUpdateAttendance?: (studentId: string, days: number) => void;
  onUpdateCoGrade?: (studentId: string, sem: 'sem1' | 'sem2' | 'final', key: string, val: string) => void;
  onUpdatePartBMarks?: (studentId: string, subjectKey: string, sem: 'sem1' | 'sem2' | 'total', val: number | null) => void;
}

export const HpCcePage3Register100: React.FC<HpCcePage3Register100Props> = ({
  computedList,
  schoolRecord,
  academicYear,
  selectedClass,
  classTeacherName,
  workingDays,
  reportRef,
  initialPaperSize = 'legal',
  onUpdateSubject100,
  onUpdateAttendance,
  onUpdateCoGrade,
  onUpdatePartBMarks,
}) => {
  const [paperSize, setPaperSize] = useState<ReportPaperSize>(initialPaperSize);
  const [studentsPerPage, setStudentsPerPage] = useState<number>(12);
  const [rowHeightMm, setRowHeightMm] = useState<number>(initialPaperSize === 'a4' ? 14 : 16);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  useEffect(() => {
    if (initialPaperSize && initialPaperSize !== paperSize) {
      setPaperSize(initialPaperSize);
      if (initialPaperSize === 'a4') {
        setRowHeightMm(14);
      } else if (initialPaperSize === 'legal') {
        setRowHeightMm(16);
      }
    }
  }, [initialPaperSize]);

  const handlePaperSizeChange = (newSize: ReportPaperSize) => {
    setPaperSize(newSize);
    if (newSize === 'a4') {
      setRowHeightMm(14);
    } else if (newSize === 'legal') {
      setRowHeightMm(16);
    }
  };

  const paperConfig = REPORT_PAPER_SIZES[paperSize] || REPORT_PAPER_SIZES.legal;
  const medium = schoolRecord?.schoolMedium || 'Kannada';
  const subjects = getHpSubjectsForMedium(medium);

  const talukName = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
  const schoolName = schoolRecord?.schoolName || 'ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ';
  const diseCode = schoolRecord?.diseCode || '';

  // Chunk students into pages
  const chunks = useMemo(() => {
    const pages: ComputedHpStudent[][] = [];
    for (let i = 0; i < computedList.length; i += studentsPerPage) {
      pages.push(computedList.slice(i, i + studentsPerPage));
    }
    return pages.length > 0 ? pages : [[]];
  }, [computedList, studentsPerPage]);

  const handlePrint = () => {
    if (reportRef?.current) {
      const sName = schoolName.replace(/\s+/g, '_');
      const docTitle = `${sName}_Class_${selectedClass}_${academicYear}_100Marks_Consolidation_${paperSize.toUpperCase()}`;
      printHpCcePage3Register(reportRef.current, docTitle, paperSize);
    }
  };

  const handleDownloadPdf = async () => {
    if (reportRef?.current) {
      setIsExportingPdf(true);
      setStatusMessage('PDF ಸಿದ್ಧವಾಗುತ್ತಿದೆ... / Generating PDF...');
      try {
        const sName = schoolName.replace(/\s+/g, '_');
        const filename = `${sName}_Class_${selectedClass}_${academicYear}_100Marks_Consolidation_${paperSize.toUpperCase()}`;
        await exportHpCcePage3RegisterPdf(reportRef.current, filename, paperSize);
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
      const filename = `${sName}_Class_${selectedClass}_${academicYear}_100Marks_Consolidation_${paperSize.toUpperCase()}`;
      downloadElementAsHtml(reportRef.current, filename, paperSize);
      setStatusMessage('HTML ಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Scoped Print and Margin Styles */}
      <style>{`
        @page {
          size: ${paperConfig.widthMm}mm ${paperConfig.heightMm}mm landscape;
          margin-top: 5mm;
          margin-bottom: 5mm;
          margin-left: 0mm;
          margin-right: 2mm;
        }
        @media print {
          html, body {
            color: #000000 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0 !important;
            padding: 0 !important;
          }
          .report-page-sheet {
            page-break-after: always !important;
            break-after: page !important;
            page-break-before: avoid !important;
            break-before: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
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
          .cce-print-hidden {
            display: none !important;
          }
          .cce-print-repeat-header {
            display: block !important;
          }
          input, select {
            border: none !important;
            background: transparent !important;
            color: #000000 !important;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
          }
        }
      `}</style>

      {/* Screen Toolbar: Paper Selector, Row Height Adjuster, Pagination & Export controls (Hidden on Print) */}
      <div className="bg-slate-900 text-white p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs cce-print-hidden shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Paper Size Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
            <span className="font-bold text-amber-300">📄 ಕಾಗದ (Paper):</span>
            <button
              type="button"
              onClick={() => handlePaperSizeChange('legal')}
              className={`px-2.5 py-1 rounded font-black text-xs cursor-pointer transition ${
                paperSize === 'legal'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              title="Legal Landscape (355.6mm × 215.9mm)"
            >
              Legal (355.6×215.9mm)
            </button>
            <button
              type="button"
              onClick={() => handlePaperSizeChange('a4')}
              className={`px-2.5 py-1 rounded font-black text-xs cursor-pointer transition ${
                paperSize === 'a4'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              title="A4 Landscape (297mm × 210mm)"
            >
              A4 (297×210mm)
            </button>
          </div>

          {/* Row Height Adjuster (User-requested feature) */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
            <Sliders className="w-3.5 h-3.5 text-amber-300" />
            <span className="font-bold text-slate-200">ಸಾಲು ಎತ್ತರ (Row Height):</span>
            <button
              type="button"
              onClick={() => setRowHeightMm((prev) => Math.max(10, prev - 1))}
              className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white cursor-pointer"
              title="Decrease row height by 1mm"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono font-black text-amber-300 px-1 text-xs">
              {rowHeightMm} mm
            </span>
            <button
              type="button"
              onClick={() => setRowHeightMm((prev) => Math.min(24, prev + 1))}
              className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white cursor-pointer"
              title="Increase row height by 1mm"
            >
              <Plus className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-1 ml-1">
              {[12, 14, 16, 18].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setRowHeightMm(h)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition ${
                    rowHeightMm === h ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Students Per Page Selector with Increase (+) and Decrease (-) controls */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span className="font-bold text-slate-200">ಪುಟಕ್ಕೆ ವಿದ್ಯಾರ್ಥಿಗಳು:</span>
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
                  {n} / ಪುಟ {n === 12 ? '(ಪೂರ್ವನಿಯೋಜಿತ/Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="text-slate-300">
            ಒಟ್ಟು: <span className="font-mono text-white font-black">{computedList.length}</span> • 
            ಪುಟಗಳು: <span className="font-mono text-amber-300 font-black">{chunks.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statusMessage && (
            <span className="text-amber-300 font-bold animate-pulse">{statusMessage}</span>
          )}
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Download standalone HTML file to adjust margins manually"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>HTML ಡೌನ್‌ಲೋಡ್</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>ಮುದ್ರಿಸಿ ({paperSize === 'a4' ? 'A4' : 'Legal'})</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF ({paperSize === 'a4' ? 'A4' : 'Legal'})</span>
          </button>
        </div>
      </div>

      {/* Printable Pages Container */}
      <div ref={reportRef} className="space-y-6">
        {chunks.map((pageStudents, pageIdx) => {
          const isFirstPage = pageIdx === 0;
          const isLastPage = pageIdx === chunks.length - 1;

          return (
            <div
              key={pageIdx}
              className="report-page-sheet cce-100m-page-sheet bg-white text-black shadow-md border border-slate-300 rounded-none mx-auto flex flex-col justify-between"
              style={{
                boxSizing: 'border-box',
                width: `${paperConfig.widthMm}mm`,
                minHeight: `${paperConfig.heightMm}mm`,
                paddingTop: '0px',
                paddingBottom: '0px',
                paddingLeft: '0px',
                paddingRight: '0px',
                backgroundColor: '#ffffff',
                color: '#000000',
              }}
            >
              <div
                className="cce-sheet-container"
                style={{
                  marginLeft: '0mm',
                  marginRight: '0mm',
                  marginTop: `${paperConfig.marginTopMm}mm`,
                  marginBottom: `${paperConfig.marginBottomMm}mm`,
                  paddingLeft: '0px',
                  paddingRight: '0px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {/* Screen Page Indicator for multi-page browsing (hidden on print and pdf export) */}
                {!isFirstPage && !isExportingPdf && (
                  <div className="cce-print-hidden print:hidden hidden sm:flex justify-between items-center text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 border border-black mb-1">
                    <span>ಪುಟ {pageIdx + 1} / {chunks.length}</span>
                    <span>ತರಗತಿ: {selectedClass}ನೇ ತರಗತಿ • {schoolName}</span>
                  </div>
                )}

                {/* 1. Official Header:
                    - Distributed across table width in the same line to prevent overlapping table heading
                    - Visible on Page 1 always (screen, print, pdf)
                    - On Page 2+, hidden on interactive screen view, visible only while printing or exporting to PDF
                */}
                <div
                  className={`w-full pb-1 border-b-2 border-black ${
                    isFirstPage ? 'block' : isExportingPdf ? 'block' : 'hidden print:block cce-print-repeat-header'
                  }`}
                >
                  <div className="text-[12px] font-bold text-center text-black uppercase tracking-wide leading-tight">
                    ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ, {talukName} — {academicYear} ನೇ ಸಾಲಿನ ವಾರ್ಷಿಕ ಕ್ರೋಢೀಕರಣ ವಹಿ (100 ಅಂಕಗಳು)
                  </div>

                  {/* Page Headings: School Name, Class, Class Teacher, Academic Year, Working Days distributed in the SAME LINE across table width */}
                  <div className="flex flex-row items-center justify-between w-full text-[11px] font-bold text-black border-t border-black pt-1 mt-1 px-1 whitespace-nowrap overflow-hidden">
                    <div>
                      ಶಾಲೆ: <span className="font-black">{schoolName}</span> <span className="font-normal font-mono text-[10px]">({diseCode})</span>
                    </div>
                    <div>
                      ತರಗತಿ: <span className="font-black">{selectedClass}ನೇ ತರಗತಿ (Class {selectedClass})</span>
                    </div>
                    <div>
                      ವರ್ಗ ಶಿಕ್ಷಕರು: <span className="font-black underline underline-offset-2">{classTeacherName || '____________________'}</span>
                    </div>
                    <div>
                      ಶೈಕ್ಷಣಿಕ ವರ್ಷ: <span className="font-black">{academicYear}</span>
                    </div>
                    <div>
                      ಶಾಲೆ ನಡೆದ ದಿನಗಳು: <span className="font-black font-mono">{workingDays}</span>
                    </div>
                    {chunks.length > 1 && (
                      <div>
                        ಪುಟ: <span className="font-black font-mono">{pageIdx + 1} / {chunks.length}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Main 100 Marks Register Table */}
                <div className="w-full mt-1 overflow-hidden print:overflow-visible">
                  <table
                    className="w-full text-center border-collapse border border-black table-fixed"
                    style={{
                      borderColor: '#000000',
                      color: '#000000',
                      fontSize: paperSize === 'a4' ? '9px' : '10px',
                      tableLayout: 'fixed',
                      width: '100%',
                      wordBreak: 'break-word',
                    }}
                  >
                    <colgroup>
                      {/* 1. Sl No */}
                      <col style={{ width: '2.0%' }} />
                      {/* 2. Student Name */}
                      <col style={{ width: '13.5%' }} />
                      {/* 3. DOB & Gender */}
                      <col style={{ width: '6.2%' }} />
                      {/* 4. Reg No & SATS No */}
                      <col style={{ width: '7.2%' }} />
                      {/* 5. Category */}
                      <col style={{ width: '3.3%' }} />
                      {/* 6. Attendance in 6th Column */}
                      <col style={{ width: '3.3%' }} />
                      {/* Curricular Subjects: Marks & Grade are EXACT SAME SIZE (2.2% each) */}
                      {subjects.map((s) => (
                        <React.Fragment key={s.code}>
                          <col style={{ width: '2.2%' }} />
                          <col style={{ width: '2.2%' }} />
                        </React.Fragment>
                      ))}
                      {/* Grand Total */}
                      <col style={{ width: '3.2%' }} />
                      {/* % */}
                      <col style={{ width: '2.7%' }} />
                      {/* Grade */}
                      <col style={{ width: '2.4%' }} />
                      {/* Art Education: Marks & Grade are EXACT SAME SIZE (2.1% each) */}
                      <col style={{ width: '2.1%' }} />
                      <col style={{ width: '2.1%' }} />
                      {/* Computer Education: Marks & Grade are EXACT SAME SIZE (2.1% each) */}
                      <col style={{ width: '2.1%' }} />
                      <col style={{ width: '2.1%' }} />
                      {/* Part B (7 activities: 2.4% each) */}
                      {HP_CO_ACTIVITIES.map((act) => (
                        <col key={act.key} style={{ width: '2.4%' }} />
                      ))}
                      {/* Result */}
                      <col style={{ width: '4.6%' }} />
                    </colgroup>
                    <thead className="text-[10px]">
                      {/* Tier 1 Header (Target height: 15mm, combined header = 25mm = 2.5cm) */}
                      <tr
                        className="border-b border-black font-black text-black text-[10px]"
                        style={{ height: '15mm', minHeight: '15mm', maxHeight: '15mm', boxSizing: 'border-box', fontSize: '10px' }}
                      >
                        {/* 1. Sl No */}
                        <th rowSpan={2} className="border border-black p-0.5 align-middle text-[10px] overflow-hidden">
                          ಕ್ರ.ಸಂ
                        </th>

                        {/* 2. Student Name in Second Column */}
                        <th rowSpan={2} className="border border-black p-1 align-middle text-left text-[10px] overflow-hidden">
                          ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು
                        </th>

                        {/* 3. 3rd Column: DOB and below DOB Gender */}
                        <th rowSpan={2} className="border border-black p-0.5 align-middle text-[10px] leading-tight overflow-hidden">
                          ಜನ್ಮ ದಿನಾಂಕ<br />ಲಿಂಗ
                        </th>

                        {/* 4. Reg No & SATS No in a cell */}
                        <th rowSpan={2} className="border border-black p-0.5 align-middle text-[10px] leading-tight overflow-hidden">
                          ದಾಖಲಾತಿ<br />SATS ಸಂಖ್ಯೆ
                        </th>

                        {/* 5. Category / Caste (centered and wrapped) */}
                        <th rowSpan={2} className="border border-black p-0.5 align-middle text-[10px] overflow-hidden">
                          ಪ್ರವರ್ಗ
                        </th>

                        {/* 6. ATTENDANCE COLUMN AT 6TH COLUMN */}
                        <th rowSpan={2} className="border border-black p-0.5 align-middle text-[10px] font-black overflow-hidden leading-tight">
                          ಹಾಜರಾತಿ
                        </th>

                        {/* Curricular Subjects (FL, SL, TL, Maths, Science, Social Science) */}
                        {subjects.map((s) => (
                          <th key={s.code} colSpan={2} className="border border-black p-0.5 text-[10px] font-black overflow-hidden leading-tight">
                            {s.nameKn}<br />
                            <span className="text-[10px] font-normal">({s.nameEn.split(' ')[0]})</span>
                          </th>
                        ))}

                        {/* Grand Total */}
                        <th rowSpan={2} className="border border-black p-0.5 align-middle text-[10px] font-black overflow-hidden">
                          ಒಟ್ಟು
                        </th>

                        {/* Percentage */}
                        <th rowSpan={2} className="border border-black p-0.5 align-middle text-[10px] font-black overflow-hidden">
                          %
                        </th>

                        {/* Grade */}
                        <th rowSpan={2} className="border border-black p-0.5 align-middle text-[10px] font-black overflow-hidden">
                          ಶ್ರೇಣಿ
                        </th>

                        {/* Art Education / Work Experience */}
                        <th colSpan={2} className="border border-black p-0.5 text-[10px] font-black overflow-hidden leading-tight">
                          ಕಲಾ ಶಿಕ್ಷಣ<br />
                          <span className="text-[10px] font-normal">(Art Edu)</span>
                        </th>

                        {/* Computer Education / ICT */}
                        <th colSpan={2} className="border border-black p-0.5 text-[10px] font-black overflow-hidden leading-tight">
                          ಕಂಪ್ಯೂಟರ್ ಶಿಕ್ಷಣ<br />
                          <span className="text-[10px] font-normal">(Comp Edu)</span>
                        </th>

                        {/* Part B: 7 Co-Scholastic Activities */}
                        <th colSpan={7} className="border border-black p-0.5 text-[10px] font-black overflow-hidden leading-tight">
                          ಭಾಗ-ಬಿ ಸಹ ಪಠ್ಯ ವಿಷಯಗಳು (Part-B 1-7)
                        </th>

                        {/* Result */}
                        <th rowSpan={2} className="border border-black p-0.5 align-middle text-[10px] font-black overflow-hidden">
                          ಫಲಿತಾಂಶ
                        </th>
                      </tr>

                      {/* Tier 2 Header: Sub-columns for subjects and Part B (Target height: 10mm, combined header = 25mm = 2.5cm) */}
                      <tr
                        className="border-b-2 border-black font-black text-black text-[10px]"
                        style={{ height: '10mm', minHeight: '10mm', maxHeight: '10mm', boxSizing: 'border-box', fontSize: '10px' }}
                      >
                        {/* Curricular subjects sub-columns: Marks and Grade are same size */}
                        {subjects.map((s) => (
                          <React.Fragment key={s.code}>
                            <th className="border border-black p-0.5 text-[10px] overflow-hidden">ಅಂಕ</th>
                            <th className="border border-black p-0.5 text-[10px] overflow-hidden">ಶ್ರೇಣಿ</th>
                          </React.Fragment>
                        ))}
                        {/* Art Education sub-columns: Marks and Grade are same size */}
                        <th className="border border-black p-0.5 text-[10px] overflow-hidden">ಅಂಕ</th>
                        <th className="border border-black p-0.5 text-[10px] overflow-hidden">ಶ್ರೇಣಿ</th>

                        {/* Computer Education sub-columns: Marks and Grade are same size */}
                        <th className="border border-black p-0.5 text-[10px] overflow-hidden">ಅಂಕ</th>
                        <th className="border border-black p-0.5 text-[10px] overflow-hidden">ಶ್ರೇಣಿ</th>

                        {/* 7 Co-scholastic activities */}
                        {HP_CO_ACTIVITIES.map((act) => (
                          <th key={act.key} className="border border-black p-0.5 text-[10px] overflow-hidden" title={act.nameKn}>
                            {act.num}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {pageStudents.map((cSt, rowIdx) => {
                        const st = cSt.student;
                        const globalIdx = pageIdx * studentsPerPage + rowIdx + 1;
                        const finalCo = cSt.coScholastic.final;
                        const isA4 = paperSize === 'a4';

                        const artSub = cSt.partBSubjects?.['art_workexp'];
                        const artTotal = artSub?.total !== null && artSub?.total !== undefined ? artSub.total : '';

                        const ictSub = cSt.partBSubjects?.['ict_computer'];
                        const ictTotal = ictSub?.total !== null && ictSub?.total !== undefined ? ictSub.total : '';

                        return (
                          <tr
                            key={st.id}
                            className="border-b border-black text-black"
                            style={{
                              height: `${rowHeightMm}mm`,
                              minHeight: `${rowHeightMm}mm`,
                              maxHeight: `${rowHeightMm}mm`,
                              boxSizing: 'border-box',
                            }}
                          >
                            {/* 1. Sl No */}
                            <td className="border border-black p-0.5 text-center font-bold font-mono align-middle text-[12px]">
                              {globalIdx}
                            </td>

                            {/* 2. Student Name in Second Column (wrapped to fit inside cell without overflowing) */}
                            <td className="border border-black p-1 text-left font-bold text-black align-middle overflow-hidden">
                              <div className="leading-snug break-words px-0.5 text-[11px] sm:text-[12px]">
                                <span>{st.studentName}</span>
                                {cSt.isExempted && (
                                  <span className="text-[9px] border border-black px-0.5 font-bold ml-1 inline-block">
                                    EXEMPT
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 3. 3rd Column: DOB and below DOB Gender */}
                            <td className="border border-black p-0.5 text-center font-bold align-middle overflow-hidden">
                              <div className="flex flex-col items-center justify-center leading-tight">
                                <span className="font-mono text-black font-bold whitespace-nowrap text-[10px]">
                                  {st.dob || st.dateOfBirth || '-'}
                                </span>
                                <span className="text-black font-bold whitespace-nowrap mt-0.5 text-[10px]">
                                  {st.gender === 'Boy' ? 'ಬಾಲಕ' : st.gender === 'Girl' ? 'ಬಾಲಕಿ' : (st.gender || '-')}
                                </span>
                              </div>
                            </td>

                            {/* 4. Reg No & SATS No in a cell */}
                            <td className="border border-black p-0.5 text-center font-bold align-middle overflow-hidden">
                              <div className="flex flex-col items-center justify-center leading-tight">
                                <span className="font-mono text-black font-bold whitespace-nowrap text-[10px]">
                                  {st.schoolRegNo || '-'}
                                </span>
                                <span className="font-mono text-black font-bold whitespace-nowrap tracking-tight text-[10px]">
                                  {st.satsNo ? String(st.satsNo).trim() : '-'}
                                </span>
                              </div>
                            </td>

                            {/* 5. Category / Caste (centered & wrapped) */}
                            <td className="border border-black p-0.5 text-center align-middle font-bold break-words overflow-hidden text-black leading-tight text-[10px]">
                              <div className="w-full text-center break-words overflow-hidden">
                                {st.caste || (st as any).category || 'Gen'}
                              </div>
                            </td>

                            {/* 6. ATTENDANCE COLUMN AT 6TH COLUMN (2-way sync editable days) - Font Size 12 */}
                            <td className="border border-black p-0 text-center font-mono font-bold align-middle text-[12px]">
                              <input
                                type="number"
                                min={0}
                                max={workingDays || 300}
                                value={cSt.attendanceDays || ''}
                                onChange={(e) => {
                                  const val = e.target.value.trim();
                                  onUpdateAttendance?.(st.id, val === '' ? 0 : Number(val));
                                }}
                                className="w-full h-full text-center bg-transparent border-0 font-bold text-black font-mono p-0 focus:outline-none focus:bg-amber-50 text-[12px]"
                                title="Days Attended"
                              />
                            </td>

                            {/* Curricular Subjects: Marks & Grade are SAME SIZE - Font Size 12 */}
                            {subjects.map((subInfo) => {
                              const sub = cSt.subjects[subInfo.code];
                              const markVal = sub?.total100 !== null && sub?.total100 !== undefined ? sub.total100 : '';

                              return (
                                <React.Fragment key={subInfo.code}>
                                  {/* Mark (2-way sync interactive input) - Font size 12 */}
                                  <td className="border border-black p-0 text-center font-mono font-bold align-middle text-[12px]">
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={markVal}
                                      onChange={(e) => {
                                        const val = e.target.value.trim();
                                        onUpdateSubject100?.(
                                          st.id,
                                          subInfo.code,
                                          val === '' ? null : Math.min(100, Math.max(0, Number(val)))
                                        );
                                      }}
                                      className="w-full h-full text-center bg-transparent border-0 font-bold text-black font-mono p-0 focus:outline-none focus:bg-amber-50 text-[12px]"
                                      title={`Class 6-8 ${subInfo.nameEn} (0-100)`}
                                    />
                                  </td>
                                  {/* Grade - Font size 12 */}
                                  <td className="border border-black p-0.5 text-center font-bold align-middle text-[12px]">
                                    {cSt.isExempted ? 'Exempt' : (sub?.grade || '-')}
                                  </td>
                                </React.Fragment>
                              );
                            })}

                            {/* Grand Total - Font size 12 */}
                            <td className="border border-black p-0.5 text-center font-mono font-black align-middle text-[12px]">
                              {cSt.isExempted ? (cSt.totalMarks700 > 0 ? cSt.totalMarks700 : '-') : cSt.totalMarks700}
                            </td>

                            {/* Percentage - Font size 12 */}
                            <td className="border border-black p-0.5 text-center font-mono font-bold align-middle text-[12px]">
                              {cSt.isExempted ? '-' : `${cSt.percentage}%`}
                            </td>

                            {/* Overall Grade - Font size 12 */}
                            <td className="border border-black p-0.5 text-center font-black align-middle text-[12px]">
                              {cSt.isExempted ? 'Exempt' : cSt.overallGrade}
                            </td>

                            {/* Art Education / Work Experience: Marks & Grade are SAME SIZE - Font size 12 */}
                            <td className="border border-black p-0 text-center font-mono font-bold align-middle text-[12px]">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={artTotal}
                                onChange={(e) => {
                                  const val = e.target.value.trim();
                                  onUpdatePartBMarks?.(
                                    st.id,
                                    'art_workexp',
                                    'total',
                                    val === '' ? null : Math.min(100, Math.max(0, Number(val)))
                                  );
                                }}
                                className="w-full h-full text-center bg-transparent border-0 font-bold text-black font-mono p-0 focus:outline-none focus:bg-amber-50 text-[12px]"
                                title="Art Education / Work Exp Total (0-100)"
                              />
                            </td>
                            <td className="border border-black p-0.5 text-center font-bold align-middle text-[12px]">
                              {cSt.isExempted ? 'Exempt' : (artSub?.grade || '-')}
                            </td>

                            {/* Computer Education / ICT: Marks & Grade are SAME SIZE - Font size 12 */}
                            <td className="border border-black p-0 text-center font-mono font-bold align-middle text-[12px]">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={ictTotal}
                                onChange={(e) => {
                                  const val = e.target.value.trim();
                                  onUpdatePartBMarks?.(
                                    st.id,
                                    'ict_computer',
                                    'total',
                                    val === '' ? null : Math.min(100, Math.max(0, Number(val)))
                                  );
                                }}
                                className="w-full h-full text-center bg-transparent border-0 font-bold text-black font-mono p-0 focus:outline-none focus:bg-amber-50 text-[12px]"
                                title="Computer Education / ICT Total (0-100)"
                              />
                            </td>
                            <td className="border border-black p-0.5 text-center font-bold align-middle text-[12px]">
                              {cSt.isExempted ? 'Exempt' : (ictSub?.grade || '-')}
                            </td>

                            {/* Part B 1 to 7 Co-Scholastic Activities (2-way sync editable grade) - Font size 12 */}
                            {HP_CO_ACTIVITIES.map((act) => {
                              const coGrade = finalCo[act.key] || '';

                              return (
                                <td key={act.key} className="border border-black p-0 text-center font-bold align-middle text-[12px]">
                                  <input
                                    type="text"
                                    maxLength={2}
                                    value={coGrade === '-' ? '' : coGrade}
                                    onChange={(e) => {
                                      const val = e.target.value.trim().toUpperCase();
                                      onUpdateCoGrade?.(st.id, 'final', act.key, val);
                                    }}
                                    placeholder="-"
                                    className="w-full h-full text-center bg-transparent border-0 font-bold text-black p-0 focus:outline-none focus:bg-amber-50 text-[12px]"
                                    title={`${act.num} ${act.nameKn}`}
                                  />
                                </td>
                              );
                            })}

                            {/* Result - Font size 12 */}
                            <td className="border border-black p-0.5 text-center font-black leading-tight align-middle text-[12px]">
                              {cSt.isExempted
                                ? 'ವಿನಾಯಿತಿ'
                                : cSt.isPassed
                                ? 'ತೇರ್ಗಡೆ'
                                : cSt.totalMarks700 > 0
                                ? 'ಅನುತ್ತೀರ್ಣ'
                                : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Bottom Sections: ONLY strictly at the end of the last page */}
              {isLastPage && (
                <div className="w-full">
                  {/* Exactly 2cm gap from the table to the signatures as explicitly specified */}
                  <div style={{ height: '20mm', minHeight: '20mm' }} />

                  {/* Signatures of Class Teacher and Head Master */}
                  <div className="w-full flex items-center justify-between px-16 text-[12px] font-bold text-black border-t-2 border-black pt-3">
                    <div className="text-center">
                      <div className="w-56 text-center">
                        <span className="font-bold text-[12px]">ವರ್ಗ ಶಿಕ್ಷಕರ ಸಹಿ</span>
                        <span className="block text-[10px] font-normal text-slate-700">(Class Teacher Signature)</span>
                        <div className="font-black text-[12px] mt-1 border-b border-black pb-0.5 min-h-[22px]">
                          {classTeacherName || '____________________'}
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="w-56 text-center">
                        <span className="font-bold text-[12px]">ಮುಖ್ಯ ಗುರುಗಳ ಸಹಿ</span>
                        <span className="block text-[10px] font-normal text-slate-700">(Head Master Signature)</span>
                        <div className="font-black text-[12px] mt-1 border-b border-black pb-0.5 min-h-[22px]">
                          {schoolRecord?.headmasterName || 'ಮುಖ್ಯ ಗುರುಗಳು'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Part B Subject Information: All 7 subjects side by side across page with English names */}
                  <div className="w-full mt-4 border border-black p-1.5 text-black bg-white">
                    <div className="text-[11px] font-bold text-black mb-1">
                      ಭಾಗ-ಬಿ ಸಹ ಪಠ್ಯ ವಿಷಯಗಳ ವಿವರಣೆ (Part-B Co-Scholastic Subjects Information):
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center font-bold text-black text-[10.5px]">
                      <div className="border border-black p-1">
                        <div>(1) ಭಾವನಾತ್ಮಕ ಸಾಮಾಜಿಕ ಕೌಶಲಗಳು</div>
                        <div className="text-[9px] font-normal text-slate-700 mt-0.5">Emotional & Social Skills</div>
                      </div>
                      <div className="border border-black p-1">
                        <div>(2) ಸಂಘಟನಾ ಕೌಶಲಗಳು</div>
                        <div className="text-[9px] font-normal text-slate-700 mt-0.5">Organizational Skills</div>
                      </div>
                      <div className="border border-black p-1">
                        <div>(3) ವೈಜ್ಞಾನಿಕ ಕೌಶಲಗಳು</div>
                        <div className="text-[9px] font-normal text-slate-700 mt-0.5">Scientific Skills</div>
                      </div>
                      <div className="border border-black p-1">
                        <div>(4) ಲಲಿತ ಕಲೆ</div>
                        <div className="text-[9px] font-normal text-slate-700 mt-0.5">Fine Arts</div>
                      </div>
                      <div className="border border-black p-1">
                        <div>(5) ಸೃಜನಶೀಲತೆ</div>
                        <div className="text-[9px] font-normal text-slate-700 mt-0.5">Creativity</div>
                      </div>
                      <div className="border border-black p-1">
                        <div>(6) ಮನೋಧೋರಣೆ</div>
                        <div className="text-[9px] font-normal text-slate-700 mt-0.5">Attitude</div>
                      </div>
                      <div className="border border-black p-1">
                        <div>(7) ಮೌಲ್ಯಗಳು</div>
                        <div className="text-[9px] font-normal text-slate-700 mt-0.5">Values</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
