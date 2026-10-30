import React, { useState, useMemo, useEffect } from 'react';
import {
  SchoolRecord,
  isCwsnStudent,
  isCwsnExempted,
  formatClassStd,
  splitStudentNameTo3Rows,
} from '../../types';
import {
  ComputedStudentCce,
  CO_SCHOLASTIC_ACTIVITIES,
  extractLastWordOfSchoolName,
  PrimarySubjectCode,
} from '../../utils/primaryCceHelper';
import { calculateGrade } from '../../data/demoData';
import { getSavedClassTeacher } from '../../utils/teacherHelper';
import {
  Printer,
  Download,
  FileCode,
  FileSpreadsheet,
  Share2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  printPrimaryCcePage4Detailed,
  exportPrimaryCcePage4Pdf,
  exportPrimaryCcePage4Html,
  type ReportPaperSize,
  REPORT_PAPER_SIZES,
} from '../../utils/report_layouts/group1_kannada_english/kannadaEnglishPage4LayoutHelper';
import { shareReportToWhatsApp } from '../../utils/printPdfHelper';
import { handleTableGridNavigation } from '../../utils/tableNavigationHelper';

interface CcePage4Detailed400Props {
  computedList: ComputedStudentCce[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  selectedClass: string;
  classTeacherName: string;
  workingDays: number;
  paperSize?: ReportPaperSize;
  onPaperSizeChange?: (size: ReportPaperSize) => void;
  reportRef?: React.RefObject<HTMLDivElement | null>;
  onUpdateMarks?: (studentId: string, subCode: PrimarySubjectCode, field: string, val: number) => void;
  onUpdateExamPct?: (studentId: string, subCode: PrimarySubjectCode, exam: 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2', val: number) => void;
  onUpdateSubject100?: (studentId: string, subCode: PrimarySubjectCode, mark100: number) => void;
  onUpdateSemAttendance?: (studentId: string, sem: 'sem1' | 'sem2', days: number) => void;
  onUpdateAttendance?: (studentId: string, days: number) => void;
  onUpdateCoScholastic?: (studentId: string, sem: 'sem1' | 'sem2' | 'final', key: string, val: string) => void;
}

export const CcePage4Detailed400: React.FC<CcePage4Detailed400Props> = ({
  computedList,
  schoolRecord,
  academicYear,
  selectedClass,
  classTeacherName,
  workingDays,
  paperSize: externalPaperSize,
  onPaperSizeChange,
  reportRef: externalReportRef,
  onUpdateMarks,
  onUpdateExamPct,
  onUpdateSubject100,
  onUpdateSemAttendance,
  onUpdateAttendance,
  onUpdateCoScholastic,
}) => {
  const internalReportRef = React.useRef<HTMLDivElement | null>(null);
  const targetReportRef = externalReportRef || internalReportRef;

  const defaultPlace = extractLastWordOfSchoolName(schoolRecord?.schoolName);
  const [placeName, setPlaceName] = useState(defaultPlace);
  const [reportDate, setReportDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });

  // Class teacher's name fetched from school profile, fallback to prop
  const profileClassTeacher = useMemo(() => {
    return getSavedClassTeacher(schoolRecord, selectedClass) || classTeacherName || '';
  }, [schoolRecord, selectedClass, classTeacherName]);

  const [ctName, setCtName] = useState(profileClassTeacher);
  useEffect(() => {
    if (profileClassTeacher) {
      setCtName(profileClassTeacher);
    }
  }, [profileClassTeacher]);

  const isKannada =
    (schoolRecord?.medium || (schoolRecord as any)?.schoolMedium || '').toLowerCase().includes('kannada') ||
    (schoolRecord?.medium || (schoolRecord as any)?.schoolMedium || '').includes('ಕನ್ನಡ') ||
    !(schoolRecord?.medium || (schoolRecord as any)?.schoolMedium);

  // Paper Size state: 'legal' (default) or 'a4' - synced with prop
  const [internalPaperSize, setInternalPaperSize] = useState<ReportPaperSize>(
    externalPaperSize || 'legal'
  );
  useEffect(() => {
    if (externalPaperSize) {
      setInternalPaperSize(externalPaperSize);
    }
  }, [externalPaperSize]);

  const paperSize = externalPaperSize || internalPaperSize;
  const setPaperSize = (size: ReportPaperSize) => {
    setInternalPaperSize(size);
    if (onPaperSizeChange) onPaperSizeChange(size);
  };

  // Default: 3 students per page
  const [studentsPerPage, setStudentsPerPage] = useState<number>(3);

  // Locked presentation parameters strictly optimized for Legal and A4 Landscape
  const isA4 = paperSize === 'a4';
  const fontSize = 8.5;
  const marksFontSize = 12;
  const nameFontSize = 12;
  const detailsFontSize = 11;
  const headerFontSize = 11;
  const headingHeightCm = isA4 ? 1.8 : 2.0;
  const studentRowHeightCm = 4.5;
  const singleRowHeightCm = useMemo(() => (studentRowHeightCm / 9).toFixed(3), [studentRowHeightCm]);
  const colPadding = 0.5;
  const rowPadding = 0.5;

  // Exact page sheet dimensions in mm
  const sheetWidthMm = isA4 ? 297 : 355.6;
  const sheetHeightMm = isA4 ? 210 : 215.9;

  // Strict 24-Column Percentage Distribution summing to exactly 100.0%
  // Left margin set to 2.5cm (25mm) on Legal, 2.2cm on A4
  // Col 6 (% evaluation) increased by 2% to 5.1% with font size 10px
  // Col 17 (Total Secured %) widened to 6.2% using freed margin space
  const colWeights = useMemo(() => {
    return [
      2.0,  // Col 1: SI NO
      2.5,  // Col 2: REG NO
      10.0, // Col 3: Student Name & Details (10.0% of sheet)
      3.3,  // Col 4: Attendance
      4.0,  // Col 5: Evaluation Period (ರೂ-1... 100ಕ್ಕೆ ಪರಿವರ್ತಿತ, ಗ್ರೇಡ್)
      5.1,  // Col 6: % (15%, 20%, 50%, 100%) - Increased by 2%, font size 10px
      4.4,  // Col 7: FL Marks
      3.3,  // Col 8: FL Grade
      4.4,  // Col 9: SL Marks
      3.3,  // Col 10: SL Grade
      4.4,  // Col 11: Maths Marks
      3.3,  // Col 12: Maths Grade
      4.4,  // Col 13: EVS Marks
      3.3,  // Col 14: EVS Grade
      4.0,  // Col 15: Max 400
      4.8,  // Col 16: Total Marks
      6.2,  // Col 17: Percentage (%) - Total Secured % widened with freed space
      3.3,  // Col 18: Overall Grade
      4.0,  // Col 19: Co-Scholastic 1
      4.0,  // Col 20: Co-Scholastic 2
      4.0,  // Col 21: Co-Scholastic 3
      4.0,  // Col 22: Co-Scholastic 4
      4.0,  // Col 23: Co-Scholastic 5
      4.0,  // Col 24: Result (4.0% of sheet)
    ];
  }, []);

  // Clean marks input helper: ensures zero does NOT come before numbers and limits to 2 digits (or 3 for 100)
  const cleanMarkValue = (raw: string, maxVal: number = 99): number | null => {
    const trimmed = raw.trim();
    if (trimmed === '') return null;
    // Strip leading zeros before digits: "05" -> "5", "00" -> "0"
    const stripped = trimmed.replace(/^0+(?=\d)/, '');
    const maxDigits = maxVal > 99 ? 3 : 2;
    const digitsOnly = stripped.replace(/[^\d]/g, '').slice(0, maxDigits);
    if (digitsOnly === '') return null;
    const num = Number(digitsOnly);
    if (isNaN(num)) return null;
    return Math.min(maxVal, Math.max(0, Math.floor(num)));
  };

  const formatMarkForDisplay = (val: any): string => {
    if (val === null || val === undefined || val === '') return '-';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return String(num); // No leading zero
  };

  const formatMarkForInput = (val: any): string => {
    if (val === null || val === undefined || val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return '';
    return String(num);
  };

  // Status message for user feedback
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };


  // Group students into chunks strictly per sheet following the user's multiple-of-3 rule:
  // "when the number of students is multiple of 3 ,that's 3,6,9,12, and so on there is no space left for it
  // so you do one thing here in the last but one page give only 2 students info and in last page give 1 students info
  // and below that you arrange for part B subject and signatures
  // (for example if there are 12 students then 3 students per page means 4 pages are required but in the 4th page give 2 students info
  // and in 5 th page 1 student info and all part B info and signature be set) partB info should be given below the signatures)"
  const chunks: ComputedStudentCce[][] = useMemo(() => {
    if (computedList.length === 0) return [[]];
    const n = computedList.length;

    if (studentsPerPage === 3 && n % 3 === 0 && n >= 3) {
      const res: ComputedStudentCce[][] = [];
      const fullPages = Math.floor(n / 3) - 1; // pages with 3 students each
      for (let p = 0; p < fullPages; p++) {
        res.push(computedList.slice(p * 3, p * 3 + 3));
      }
      const start = fullPages * 3;
      res.push(computedList.slice(start, start + 2)); // penultimate page: 2 students
      res.push(computedList.slice(start + 2, start + 3)); // final page: 1 student
      return res;
    }

    const res: ComputedStudentCce[][] = [];
    for (let i = 0; i < n; i += studentsPerPage) {
      res.push(computedList.slice(i, i + studentsPerPage));
    }
    return res.length > 0 ? res : [[]];
  }, [computedList, studentsPerPage]);

  // Track start index of each chunk to ensure Sl No is always sequential and 100% accurate
  const chunkStartIndices = useMemo(() => {
    const indices: number[] = [];
    let current = 0;
    for (const c of chunks) {
      indices.push(current);
      current += c.length;
    }
    return indices;
  }, [chunks]);

  // Document filename
  const getDocumentFilename = () => {
    const sName = (schoolRecord?.schoolName || 'Govt_School').replace(/\s+/g, '_');
    return `Report-3_${sName}_Class_${selectedClass}_${academicYear}_Consolidation_${paperSize.toUpperCase()}`;
  };

  // Actions: Print, PDF, HTML, Excel, WhatsApp
  const handlePrint = () => {
    if (targetReportRef.current) {
      printPrimaryCcePage4Detailed(
        targetReportRef.current,
        getDocumentFilename(),
        paperSize
      );
    } else {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    if (targetReportRef.current) {
      setIsExporting(true);
      showStatus('Generating pure Black & White PDF report...');
      try {
        await exportPrimaryCcePage4Pdf(
          targetReportRef.current,
          getDocumentFilename(),
          paperSize
        );
        showStatus('PDF successfully downloaded!');
      } catch (err) {
        console.error('PDF error:', err);
        showStatus('PDF generation failed. Please try again.');
      } finally {
        setIsExporting(false);
      }
    }
  };

  const handleDownloadHtml = () => {
    if (targetReportRef.current) {
      exportPrimaryCcePage4Html(
        targetReportRef.current,
        getDocumentFilename(),
        paperSize
      );
      showStatus('HTML file downloaded successfully!');
    }
  };

  const handleExportExcel = () => {
    if (!targetReportRef.current) return;
    const tables = targetReportRef.current.querySelectorAll('table');
    if (tables.length === 0) return;
    const wb = XLSX.utils.book_new();
    tables.forEach((table, idx) => {
      const ws = XLSX.utils.table_to_sheet(table);
      XLSX.utils.book_append_sheet(wb, ws, `Page_${idx + 1}`);
    });
    XLSX.writeFile(wb, `${getDocumentFilename()}.xlsx`);
    showStatus('Excel exported successfully!');
  };

  const handleShareWhatsApp = () => {
    if (targetReportRef.current) {
      shareReportToWhatsApp(
        targetReportRef.current,
        `Report-3: ${formatClassStd(selectedClass)} Consolidation 9-Lines (${academicYear}) - ${schoolRecord?.schoolName || 'Govt School'}`
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Scoped CSS for Pure Black and White, No Underline, and Exact Landscape Dimensions */}
      <style>{`
        /* Global Reset for Page 4 / Report-3: Pure B&W, No Underlines */
        .cce-page4-bw,
        .cce-page4-bw * {
          border-color: #000000 !important;
          text-decoration: none !important;
          -webkit-text-decoration-line: none !important;
        }
        .cce-page4-bw a,
        .cce-page4-bw span,
        .cce-page4-bw div,
        .cce-page4-bw input,
        .cce-page4-bw th,
        .cce-page4-bw td {
          text-decoration: none !important;
        }
        .cce-page4-bw table {
          border-collapse: collapse !important;
          border: 2px solid #000000 !important;
          table-layout: fixed !important;
          width: 100% !important;
        }
        .cce-page4-bw th,
        .cce-page4-bw td {
          border: 1px solid #000000 !important;
          background-color: #ffffff !important;
          color: #000000 !important;
          text-align: center !important;
          vertical-align: middle !important;
          padding: 1px 2px !important;
          box-sizing: border-box !important;
        }
        .cce-page4-bw input {
          border: none !important;
          outline: none !important;
          background: transparent !important;
          text-align: center !important;
          color: #000000 !important;
          box-shadow: none !important;
          text-decoration: none !important;
        }
        .cce-page4-bw input:focus {
          background-color: #f0f0f0 !important;
        }

        /* Screen Input vs PDF Text representation */
        .cce-pdf-text {
          display: none !important;
        }
        .cce-pdf-mode .cce-screen-input {
          display: none !important;
        }
        .cce-pdf-mode .cce-pdf-text {
          display: block !important;
          text-align: center !important;
          margin: 0 auto !important;
          width: 100% !important;
          color: #000000 !important;
        }

        /* Print Media Styles - Uses Applied Adjustments for Printing */
        @media print {
          @page {
            size: ${paperSize === 'a4' ? 'A4' : 'legal'} landscape;
            margin: 0.65cm 0.65cm 0.65cm ${paperSize === 'a4' ? '4.23cm' : '4.77cm'} !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .cce-page4-bw .report-page-sheet {
            margin: 0 !important;
            padding-left: ${paperSize === 'a4' ? '42.3mm' : '47.7mm'} !important;
            padding-right: 6.5mm !important;
            padding-top: 6.5mm !important;
            padding-bottom: 6.5mm !important;
            border: none !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .cce-page4-bw .report-page-sheet > div,
          .cce-page4-bw .cce-sheet-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .cce-page4-bw table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            box-sizing: border-box !important;
          }
          .cce-screen-input {
            display: none !important;
          }
          .cce-pdf-text {
            display: block !important;
            text-align: center !important;
          }
        }
      `}</style>

      {/* ========================================================
          1. TOP CONFIGURATION & ADJUSTMENT TOOLBAR (PRINT: HIDDEN)
          ======================================================== */}
      <div className="no-print print:hidden bg-slate-900 text-white p-3 rounded-2xl flex flex-col gap-3 text-xs shadow-md border border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Title & Paper Size Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-amber-300 text-xs flex items-center gap-1.5">
              <span>Report-3 ನಿಯಂತ್ರಣ ಪಟ್ಟಿ:</span>
            </span>

            {/* Paper Size Selector (A4 vs Legal) */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <span className="font-bold text-slate-300 px-1 text-[11px]">ಕಾಗದ ಸೈಜ್:</span>
              <button
                type="button"
                onClick={() => setPaperSize('legal')}
                className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer text-xs ${
                  paperSize === 'legal'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Legal Landscape (356mm × 216mm)"
              >
                Legal (356×216mm)
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('a4')}
                className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer text-xs ${
                  paperSize === 'a4'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title="A4 Landscape (297mm × 210mm)"
              >
                A4 (297×210mm)
              </button>
            </div>

            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-200 border border-slate-700">
              {paperSize === 'legal' ? '📐 Legal Landscape' : '📄 A4 Landscape'}
            </span>

            {/* Students per page selector */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
              <span className="text-slate-300 font-bold text-[11px]">ವಿದ್ಯಾರ್ಥಿಗಳು:</span>
              <select
                value={studentsPerPage}
                onChange={(e) => setStudentsPerPage(Number(e.target.value))}
                className="bg-transparent text-amber-300 font-bold border-none outline-none cursor-pointer text-xs"
              >
                <option value={3} className="bg-slate-900 text-white">೩ / ಪುಟ (3 Students/Page)</option>
                <option value={2} className="bg-slate-900 text-white">೨ / ಪುಟ (2 Students/Page)</option>
                <option value={1} className="bg-slate-900 text-white">೧ / ಪುಟ (1 Student/Page)</option>
              </select>
            </div>
          </div>

          {/* Action buttons (Print, PDF, HTML, Excel, WhatsApp) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Print Report-3 in Pure Black & White"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ಮುದ್ರಿಸಿ (Print)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
              title="Download HTML"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>HTML</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-1 transition cursor-pointer shadow-xs"
              title="Export to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-2.5 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-black flex items-center gap-1 transition cursor-pointer shadow-xs"
              title="Share to WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================
          2. PRINTABLE REPORT CONTAINER: PURE BLACK & WHITE
          ======================================================== */}
      <div
        ref={targetReportRef}
        className="cce-page4-bw space-y-6"
        style={{
          width: '100%',
          margin: '0 auto',
        }}
      >
        {/* Scoped Print Style inside targetReportRef so cloned print portal always has applied adjustments */}
        <style>{`
          .cce-top-distributed-bar {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            justify-content: space-between !important;
            align-items: center !important;
            white-space: nowrap !important;
          }
          .cce-top-distributed-bar * {
            white-space: nowrap !important;
          }
          @media print {
            @page {
              size: ${isA4 ? 'A4' : 'legal'} landscape;
              margin: 0.65cm 0.65cm 0.65cm ${isA4 ? '4.23cm' : '4.77cm'} !important;
            }
            body {
              background-color: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .cce-page4-bw .report-page-sheet {
              margin: 0 !important;
              padding-left: ${isA4 ? '42.3mm' : '47.7mm'} !important;
              padding-right: 6.5mm !important;
              padding-top: 6.5mm !important;
              padding-bottom: 6.5mm !important;
              border: none !important;
              box-shadow: none !important;
              box-sizing: border-box !important;
              width: 100% !important;
              max-width: 100% !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .cce-page4-bw .report-page-sheet > div,
            .cce-page4-bw .cce-sheet-container {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              box-sizing: border-box !important;
            }
            .cce-page4-bw table {
              width: 100% !important;
              max-width: 100% !important;
              table-layout: fixed !important;
              box-sizing: border-box !important;
            }
            .cce-screen-input {
              display: none !important;
            }
            .cce-pdf-text {
              display: block !important;
              text-align: center !important;
            }
          }
        `}</style>

        {chunks.map((chunk, chunkIdx) => {
          const isLastPage = chunkIdx === chunks.length - 1;
          const prevStudentsCount = chunkStartIndices[chunkIdx];

          return (
            <div
              key={chunkIdx}
              className="report-page-sheet bg-white border-0 shadow-none mx-auto"
              style={{
                width: `${sheetWidthMm}mm`,
                minHeight: `${sheetHeightMm}mm`,
                paddingLeft: isA4 ? '22mm' : '25mm',
                paddingRight: '6.5mm',
                paddingTop: '6.5mm',
                paddingBottom: '6.5mm',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
                color: '#000000',
                border: 'none',
                boxShadow: 'none',
              }}
            >
              <div
                className="cce-sheet-container"
                style={{
                  width: '100%',
                  margin: '0',
                  padding: '0',
                  boxSizing: 'border-box',
                }}
              >
              {/* Official School & Office Header per Page */}
              <div
                className="relative border-b-2 border-black pb-0.5 text-black flex items-center justify-center text-center"
                style={{ height: '1.25cm', maxHeight: '1.25cm', boxSizing: 'border-box' }}
              >
                {/* Center: School & Office Title info */}
                <div className="text-center px-2 flex-1 flex flex-col justify-center h-full space-y-0.5 overflow-hidden">
                  <h2 className="text-[11.5px] font-black text-black font-serif leading-tight uppercase truncate">
                    {isKannada
                      ? `ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ ${schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ'}`
                      : `Office of the Block Education Officer and Block Resource Coordinator, ${schoolRecord?.taluk || 'Belagavi Rural'}`}
                  </h2>
                  <h3 className="text-[12.5px] font-black text-black leading-tight uppercase truncate">
                    {schoolRecord?.schoolName || 'ಸರಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಕನ್ನಡ ಶಾಲೆ ನಿಂಗ್ಯಾನಟ್ಟಿ'}
                    {schoolRecord?.diseCode ? ` • DISE: ${schoolRecord.diseCode}` : ''}
                  </h3>
                  <p className="text-[11px] font-black text-red-600 leading-tight truncate">
                    {academicYear} ನೇ ಸಾಲಿನ ವಾರ್ಷಿಕ ಪರಿಣಾಮ ಪತ್ರಿಕೆಯ ಘೋಷವಾರೆ
                  </p>
                </div>
              </div>

              {/* Directly on table top: 1 single line across table width, never wraps */}
              <div
                className="w-full flex flex-row flex-nowrap justify-between items-center text-[9.5px] font-bold text-black border-b border-black py-0.5 px-1 mt-0.5 mb-1 whitespace-nowrap cce-top-distributed-bar"
                style={{
                  boxSizing: 'border-box',
                  whiteSpace: 'nowrap',
                  flexWrap: 'nowrap',
                  lineHeight: 1.2,
                }}
              >
                <div className="text-left whitespace-nowrap shrink-0" style={{ whiteSpace: 'nowrap' }}>
                  Class: <span className="font-black">{formatClassStd(selectedClass)}</span>
                </div>
                <div className="text-center font-bold whitespace-nowrap shrink-0" style={{ whiteSpace: 'nowrap' }}>
                  CLASS TEACHER'S NAME: <span className="font-black uppercase">{classTeacherName || ctName || ''}</span>
                </div>
                <div className="text-right whitespace-nowrap shrink-0" style={{ whiteSpace: 'nowrap' }}>
                  ಶಾಲೆ ನಡೆದ ದಿನಗಳ ಸಂಖ್ಯೆ: <span className="font-mono font-black">{workingDays || 241}</span>
                </div>
              </div>

              {/* Main 400 Marks Table: Pure Black & White (All 24 Columns with Fixed Proportions to fit 100% in selected page) */}
              <div className="w-full overflow-hidden mt-0.5" style={{ boxSizing: 'border-box' }}>
                <table
                  className="w-full text-center border-collapse border-2 border-black bg-white text-black table-fixed"
                  style={{ fontSize: `${fontSize}px`, lineHeight: 1.15, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                  onKeyDown={handleTableGridNavigation}
                >
                  {/* Explicit Colgroup: Uses colWeights so all 24 columns perfectly fit without going out */}
                  <colgroup>
                    {colWeights.map((w, cIdx) => (
                      <col key={cIdx} style={{ width: `${w}%` }} />
                    ))}
                  </colgroup>
                  <thead style={{ height: `${headingHeightCm}cm`, maxHeight: `${headingHeightCm}cm` }}>
                    {/* Header Row 1 */}
                    <tr
                      className="bg-white font-black text-black border-b border-black"
                      style={{ height: `${(headingHeightCm * 0.38).toFixed(2)}cm` }}
                    >
                      {/* 1. Sl No (Default 0.4cm as requested) */}
                      <th
                        rowSpan={3}
                        style={{
                          width: `${colWeights[0]}%`,
                          fontSize: `${Math.min(headerFontSize, 9.5)}px`,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          padding: '0.5px',
                        }}
                        className="border border-black align-middle text-center"
                      >
                        <span
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                          className="inline-block py-0.5 mx-auto font-black text-center leading-none text-[8px]"
                        >
                          SI NO
                        </span>
                      </th>

                      {/* 2. Reg No (Default 0.4cm as requested) */}
                      <th
                        rowSpan={3}
                        style={{
                          width: `${colWeights[1]}%`,
                          fontSize: `${Math.min(headerFontSize, 9.5)}px`,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          padding: '0.5px',
                        }}
                        className="border border-black align-middle text-center"
                      >
                        <span
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                          className="inline-block py-0.5 mx-auto font-black text-center leading-none text-[8px]"
                        >
                          REG. NO
                        </span>
                      </th>

                      {/* 3. Student Name (Configurable Col 3 - default 2.5cm) */}
                      <th
                        rowSpan={3}
                        style={{
                          width: `${colWeights[2]}%`,
                          fontSize: `${headerFontSize}px`,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          padding: '2px 1px',
                          lineHeight: 1.15,
                        }}
                        className="border border-black align-middle text-center font-black text-black"
                      >
                        <div className="font-black text-center leading-tight uppercase">
                          {isKannada ? 'STUDENTS NAME' : "STUDENT'S NAME"}
                        </div>
                        <div
                          className="font-bold text-center mt-0.5 leading-tight"
                          style={{ fontSize: `${Math.max(7.5, headerFontSize - 2.5)}px` }}
                        >
                          ವಿದ್ಯಾರ್ಥಿಗಳ ಹೆಸರು
                        </div>
                      </th>

                      {/* 4. Attendance */}
                      <th
                        rowSpan={3}
                        style={{
                          width: `${colWeights[3]}%`,
                          fontSize: `${Math.min(headerFontSize, 11)}px`,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          padding: '1px',
                        }}
                        className="border border-black align-middle text-center font-black"
                      >
                        <span
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                          className="inline-block py-0.5 mx-auto font-black text-center leading-none"
                        >
                          ATTENDANCE
                        </span>
                      </th>

                      {/* 5. Exam Period (Configurable Col 5 - default 0.9cm) - Wrapped into 2 lines in same cell as requested */}
                      <th
                        rowSpan={3}
                        style={{
                          width: `${colWeights[4]}%`,
                          fontSize: `${Math.min(headerFontSize, 9.0)}px`,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          padding: '1px',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          lineHeight: 1.1,
                        }}
                        className="border border-black align-middle text-center font-black"
                      >
                        <div className="font-black text-center leading-tight mx-auto flex flex-col justify-center items-center h-full">
                          <span>EVALUATION</span>
                          <span>PERIOD</span>
                        </div>
                      </th>

                      {/* 6. Percentage (Configurable Col 6 - 5.1% width, 10px font size) */}
                      <th
                        rowSpan={3}
                        style={{
                          width: `${colWeights[5]}%`,
                          fontSize: '10px',
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          padding: '1px',
                        }}
                        className="border border-black align-middle text-center font-black"
                      >
                        <span className="font-black text-center block text-[10px]">%</span>
                      </th>

                      {/* 7. Scholastic Group Header (Part A - 8 cols) */}
                      <th
                        colSpan={8}
                        style={{
                          width: `${colWeights.slice(6, 14).reduce((a, b) => a + b, 0)}%`,
                          fontSize: `${headerFontSize}px`,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          padding: '2px 1px',
                          lineHeight: 1.15,
                        }}
                        className="border border-black font-black text-center"
                      >
                        PART-A STUDENT'S ACADEMIC PERFORMANCE (CURRICULAR)
                      </th>

                      {/* 8. Max Marks (400) - Fit tightly to text */}
                      <th
                        rowSpan={3}
                        style={{
                          width: `${colWeights[14]}%`,
                          fontSize: `${Math.min(headerFontSize, 8.5)}px`,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          padding: '0.5px',
                          lineHeight: 1.05,
                        }}
                        className="border border-black font-black align-middle text-center overflow-hidden"
                      >
                        TOTAL<br />
                        <span className="font-mono font-black" style={{ fontSize: `${Math.min(headerFontSize, 8.5)}px` }}>400</span>
                      </th>

                      {/* 9. Total Obtained Header (3 cols) */}
                      <th
                        colSpan={3}
                        style={{
                          width: `${colWeights.slice(15, 18).reduce((a, b) => a + b, 0)}%`,
                          fontSize: `${Math.min(headerFontSize, 8.5)}px`,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          padding: '1px 0.5px',
                          lineHeight: 1.1,
                        }}
                        className="border border-black font-black text-center"
                      >
                        TOTAL SECURED
                      </th>

                      {/* 10. Co-Scholastic Group Header (Part B - 5 cols) */}
                      <th
                        colSpan={5}
                        style={{
                          width: `${colWeights.slice(18, 23).reduce((a, b) => a + b, 0)}%`,
                          fontSize: `${headerFontSize}px`,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          padding: '1px 0.5px',
                          lineHeight: 1.15,
                        }}
                        className="border border-black font-black text-center border-l-2"
                      >
                        PART-B GRADES
                      </th>

                      {/* 11. Result Header */}
                      <th
                        rowSpan={3}
                        style={{
                          width: `${colWeights[23]}%`,
                          fontSize: `${Math.min(headerFontSize, 8.5)}px`,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          padding: '0.2px',
                          overflow: 'hidden',
                          boxSizing: 'border-box',
                        }}
                        className="border border-black font-black align-middle text-center overflow-hidden"
                      >
                        <span
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                          className="inline-block py-0.5 mx-auto font-black text-center leading-none text-[8px]"
                        >
                          RESULT
                        </span>
                      </th>
                    </tr>

                    {/* Sub-Header Row 2 */}
                    <tr
                      className="bg-white font-bold text-black border-b border-black"
                      style={{ height: `${(headingHeightCm * 0.32).toFixed(2)}cm` }}
                    >
                      <th
                        colSpan={2}
                        style={{
                          width: `${colWeights[6] + colWeights[7]}%`,
                          fontSize: `${Math.min(headerFontSize, 10)}px`,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          padding: '1px',
                          lineHeight: 1.1,
                        }}
                        className="border border-black text-center"
                      >
                        FL (ಪ್ರಥಮ)
                      </th>
                      <th
                        colSpan={2}
                        style={{
                          width: `${colWeights[8] + colWeights[9]}%`,
                          fontSize: `${Math.min(headerFontSize, 10)}px`,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          padding: '1px',
                          lineHeight: 1.1,
                        }}
                        className="border border-black text-center"
                      >
                        SL (ದ್ವಿತೀಯ)
                      </th>
                      <th
                        colSpan={2}
                        style={{
                          width: `${colWeights[10] + colWeights[11]}%`,
                          fontSize: `${Math.min(headerFontSize, 10)}px`,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          padding: '1px',
                          lineHeight: 1.1,
                        }}
                        className="border border-black text-center"
                      >
                        MATHS (ಗಣಿತ)
                      </th>
                      <th
                        colSpan={2}
                        style={{
                          width: `${colWeights[12] + colWeights[13]}%`,
                          fontSize: `${Math.min(headerFontSize, 10)}px`,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          padding: '1px',
                          lineHeight: 1.1,
                        }}
                        className="border border-black text-center"
                      >
                        EVS (ಪರಿಸರ)
                      </th>

                      <th
                        rowSpan={2}
                        style={{
                          width: `${colWeights[15]}%`,
                          fontSize: `${Math.min(headerFontSize, 8.5)}px`,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          padding: '0.5px',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          lineHeight: 1.05,
                        }}
                        className="border border-black font-bold text-center"
                      >
                        MARKS
                      </th>
                      <th
                        rowSpan={2}
                        style={{
                          width: `${colWeights[16]}%`,
                          fontSize: `${Math.min(headerFontSize, 8.5)}px`,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          padding: '0.5px',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          lineHeight: 1.05,
                        }}
                        className="border border-black font-bold text-center"
                      >
                        %
                      </th>
                      <th
                        rowSpan={2}
                        style={{
                          width: `${colWeights[17]}%`,
                          fontSize: `${Math.min(headerFontSize, 8.5)}px`,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          padding: '0.5px',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          lineHeight: 1.05,
                        }}
                        className="border border-black font-bold text-center"
                      >
                        GRADE
                      </th>

                      {/* Co-scholastic activities: Numbers 1, 2, 3, 4, 5 */}
                      {[1, 2, 3, 4, 5].map((num, i) => (
                        <th
                          key={num}
                          rowSpan={2}
                          style={{
                            width: `${colWeights[18 + i]}%`,
                            fontSize: `${headerFontSize}px`,
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            padding: '1px',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                          }}
                          className="border border-black align-middle text-center font-mono font-black"
                        >
                          ({num})
                        </th>
                      ))}
                    </tr>

                    {/* Sub-Header Row 3: M & G for all 4 Subjects */}
                    <tr
                      className="bg-white font-bold text-black border-b-2 border-black"
                      style={{ height: `${(headingHeightCm * 0.30).toFixed(2)}cm` }}
                    >
                      <th style={{ width: `${colWeights[6]}%`, fontSize: `${headerFontSize}px`, textAlign: 'center', verticalAlign: 'middle', padding: '0.5px', whiteSpace: 'normal', wordBreak: 'break-word' }} className="border border-black">M</th>
                      <th style={{ width: `${colWeights[7]}%`, fontSize: `${headerFontSize}px`, textAlign: 'center', verticalAlign: 'middle', padding: '0.5px', whiteSpace: 'normal', wordBreak: 'break-word' }} className="border border-black">G</th>
                      <th style={{ width: `${colWeights[8]}%`, fontSize: `${headerFontSize}px`, textAlign: 'center', verticalAlign: 'middle', padding: '0.5px', whiteSpace: 'normal', wordBreak: 'break-word' }} className="border border-black">M</th>
                      <th style={{ width: `${colWeights[9]}%`, fontSize: `${headerFontSize}px`, textAlign: 'center', verticalAlign: 'middle', padding: '0.5px', whiteSpace: 'normal', wordBreak: 'break-word' }} className="border border-black">G</th>
                      <th style={{ width: `${colWeights[10]}%`, fontSize: `${headerFontSize}px`, textAlign: 'center', verticalAlign: 'middle', padding: '0.5px', whiteSpace: 'normal', wordBreak: 'break-word' }} className="border border-black">M</th>
                      <th style={{ width: `${colWeights[11]}%`, fontSize: `${headerFontSize}px`, textAlign: 'center', verticalAlign: 'middle', padding: '0.5px', whiteSpace: 'normal', wordBreak: 'break-word' }} className="border border-black">G</th>
                      <th style={{ width: `${colWeights[12]}%`, fontSize: `${headerFontSize}px`, textAlign: 'center', verticalAlign: 'middle', padding: '0.5px', whiteSpace: 'normal', wordBreak: 'break-word' }} className="border border-black">M</th>
                      <th style={{ width: `${colWeights[13]}%`, fontSize: `${headerFontSize}px`, textAlign: 'center', verticalAlign: 'middle', padding: '0.5px', whiteSpace: 'normal', wordBreak: 'break-word' }} className="border border-black">G</th>
                    </tr>
                  </thead>

                {/* Multi-Tbody per student */}
                {chunk.map((cSt, idxInChunk) => {
                  const globalIdx = chunkStartIndices[chunkIdx] + idxInChunk;
                  const st = cSt.student;
                  const fl = cSt.subjects.FL;
                  const sl = cSt.subjects.SL;
                  const maths = cSt.subjects.MATHS;
                  const evs = cSt.subjects.EVS;
                  const isMarksAllowed = st.cwsnStatus === 'MARKS_ALLOWED' || st.cwsnStatus === 'YES_MARKS';
                  const isExempted = isMarksAllowed ? false : (cSt.isExempted || isCwsnExempted(st.cwsnStatus));
                  const hasCwsnBadge = isCwsnStudent(st.cwsnStatus) || cSt.isExempted;

                  const coSem1 = cSt.coScholastic.sem1;
                  const coSem2 = cSt.coScholastic.sem2;
                  const coFinal = cSt.coScholastic.final;

                  // Student name split into 3 rows: first name, middle name, last name
                  const [fName, mName, lName] = splitStudentNameTo3Rows(st.studentName);

                  // Reg No: from database, if not present then blank (no automatic fake numbers)
                  const regNo = st.schoolRegNo || (st as any).admissionNo || (st as any).regNo || '';

                  const calcRowObtained = (flVal: number, slVal: number, mVal: number, evsVal: number, max: number) => {
                    if (isExempted) return { total: 0, pctStr: '-', grade: 'Exempt' };
                    const total = Number((flVal + slVal + mVal + evsVal).toFixed(1));
                    const pctNum = max > 0 ? Number(((total / max) * 100).toFixed(1)) : 0;
                    const grade = calculateGrade(pctNum);
                    return { total, pctStr: `${pctNum}%`, grade };
                  };

                  const r1 = calcRowObtained(fl.fa1_pct, sl.fa1_pct, maths.fa1_pct, evs.fa1_pct, 60);
                  const r2 = calcRowObtained(fl.fa2_pct, sl.fa2_pct, maths.fa2_pct, evs.fa2_pct, 60);
                  const r3 = calcRowObtained(fl.sa1_pct, sl.sa1_pct, maths.sa1_pct, evs.sa1_pct, 80);
                  const r4 = calcRowObtained(fl.sem1_total, sl.sem1_total, maths.sem1_total, evs.sem1_total, 200);

                  const r5 = calcRowObtained(fl.fa3_pct, sl.fa3_pct, maths.fa3_pct, evs.fa3_pct, 60);
                  const r6 = calcRowObtained(fl.fa4_pct, sl.fa4_pct, maths.fa4_pct, evs.fa4_pct, 60);
                  const r7 = calcRowObtained(fl.sa2_pct, sl.sa2_pct, maths.sa2_pct, evs.sa2_pct, 80);
                  const r8 = calcRowObtained(fl.sem2_total, sl.sem2_total, maths.sem2_total, evs.sem2_total, 200);

                  const r9Total = isExempted ? 0 : cSt.totalMarks400;
                  const r9Pct = isExempted ? '-' : `${cSt.percentage}%`;
                  const r9Grade = isExempted ? 'Exempt' : cSt.overallGrade;

                  interface DetailedTableRow {
                    exam: string;
                    pct: string;
                    max: number;
                    subKey?: 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2';
                    rawMax?: number;
                    fl: number;
                    flG: string;
                    sl: number;
                    slG: string;
                    m: number;
                    mG: string;
                    evs: number;
                    evsG: string;
                    obt: { total: number; pctStr: string; grade: string };
                    isSem1Total?: boolean;
                    isSem2Total?: boolean;
                    isFinalTotal?: boolean;
                  }

                  const rowsData: DetailedTableRow[] = [
                    // Sem 1: FA1 (15%), FA2 (15%), SA1 (20%)
                    { exam: 'ರೂ-1', pct: '15%', max: 60, subKey: 'fa1', rawMax: 15, fl: fl.fa1_pct, flG: fl.fa1_grade, sl: sl.fa1_pct, slG: sl.fa1_grade, m: maths.fa1_pct, mG: maths.fa1_grade, evs: evs.fa1_pct, evsG: evs.fa1_grade, obt: r1 },
                    { exam: 'ರೂ-2', pct: '15%', max: 60, subKey: 'fa2', rawMax: 15, fl: fl.fa2_pct, flG: fl.fa2_grade, sl: sl.fa2_pct, slG: sl.fa2_grade, m: maths.fa2_pct, mG: maths.fa2_grade, evs: evs.fa2_pct, evsG: evs.fa2_grade, obt: r2 },
                    { exam: 'ಸಂ-1', pct: '20%', max: 80, subKey: 'sa1', rawMax: 20, fl: fl.sa1_pct, flG: fl.sa1_grade, sl: sl.sa1_pct, slG: sl.sa1_grade, m: maths.sa1_pct, mG: maths.sa1_grade, evs: evs.sa1_pct, evsG: evs.sa1_grade, obt: r3 },
                    { exam: 'ಒಟ್ಟು', pct: '50%', max: 200, fl: fl.sem1_total, flG: calculateGrade((fl.sem1_total / 50) * 100), sl: sl.sem1_total, slG: calculateGrade((sl.sem1_total / 50) * 100), m: maths.sem1_total, mG: calculateGrade((maths.sem1_total / 50) * 100), evs: evs.sem1_total, evsG: calculateGrade((evs.sem1_total / 50) * 100), obt: r4, isSem1Total: true },

                    // Sem 2: FA3 (15%), FA4 (15%), SA2 (20%)
                    { exam: 'ರೂ-3', pct: '15%', max: 60, subKey: 'fa3', rawMax: 15, fl: fl.fa3_pct, flG: fl.fa3_grade, sl: sl.fa3_pct, slG: sl.fa3_grade, m: maths.fa3_pct, mG: maths.fa3_grade, evs: evs.fa3_pct, evsG: evs.fa3_grade, obt: r5 },
                    { exam: 'ರೂ-4', pct: '15%', max: 60, subKey: 'fa4', rawMax: 15, fl: fl.fa4_pct, flG: fl.fa4_grade, sl: sl.fa4_pct, slG: sl.fa4_grade, m: maths.fa4_pct, mG: maths.fa4_grade, evs: evs.fa4_pct, evsG: evs.fa4_grade, obt: r6 },
                    { exam: 'ಸಂ-2', pct: '20%', max: 80, subKey: 'sa2', rawMax: 20, fl: fl.sa2_pct, flG: fl.sa2_grade, sl: sl.sa2_pct, slG: sl.sa2_grade, m: maths.sa2_pct, mG: maths.sa2_grade, evs: evs.sa2_pct, evsG: evs.sa2_grade, obt: r7 },
                    { exam: 'ಒಟ್ಟು', pct: '50%', max: 200, fl: fl.sem2_total, flG: calculateGrade((fl.sem2_total / 50) * 100), sl: sl.sem2_total, slG: calculateGrade((sl.sem2_total / 50) * 100), m: maths.sem2_total, mG: calculateGrade((maths.sem2_total / 50) * 100), evs: evs.sem2_total, evsG: calculateGrade((evs.sem2_total / 50) * 100), obt: r8, isSem2Total: true },

                    // Grand Total: 400
                    { exam: 'ಒಟ್ಟು', pct: '100%', max: 400, fl: fl.total100, flG: fl.grade, sl: sl.total100, slG: sl.grade, m: maths.total100, mG: maths.grade, evs: evs.total100, evsG: evs.grade, obt: { total: r9Total, pctStr: r9Pct, grade: r9Grade }, isFinalTotal: true },
                  ];

                  return (
                    <tbody
                      key={st.id}
                      className="student-tbody border-b-2 border-black break-inside-avoid print:break-inside-avoid bg-white"
                      style={{ height: `${studentRowHeightCm}cm` }}
                    >
                      {rowsData.map((r, rIdx) => {
                        const isRow0 = rIdx === 0;
                        const isRow4 = rIdx === 4;
                        const isRow8 = rIdx === 8;
                        const isTotalRow = r.isSem1Total || r.isSem2Total || r.isFinalTotal;

                        return (
                          <tr
                            key={rIdx}
                            style={{ height: `${singleRowHeightCm}cm` }}
                            className={`border-b border-black text-black bg-white ${
                              r.isFinalTotal
                                ? 'font-black border-b-2 border-black'
                                : isTotalRow
                                ? 'font-bold'
                                : 'font-normal'
                            }`}
                          >
                            {/* 1. Sl No - Spans 9 Rows */}
                            {isRow0 && (
                              <td
                                rowSpan={9}
                                style={{
                                  padding: `${rowPadding}px ${colPadding}px`,
                                  fontSize: `${fontSize}px`,
                                }}
                                className="border border-black font-mono font-bold align-middle bg-white text-center text-black"
                              >
                                {globalIdx + 1}
                              </td>
                            )}

                            {/* 2. Registered No - Spans 9 Rows (Blank if not in DB, no fake auto numbers) */}
                            {isRow0 && (
                              <td
                                rowSpan={9}
                                className="border border-black font-mono font-bold align-middle bg-white text-center text-black p-0.5"
                              >
                                {regNo ? (
                                  <span
                                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                    className="inline-block text-center py-0.5 mx-auto font-mono font-bold text-[8px] max-w-full"
                                  >
                                    {regNo}
                                  </span>
                                ) : (
                                  <span></span>
                                )}
                              </td>
                            )}

                            {/* 3. Student Name - Spans 9 Rows (In 3 rows: first name, middle name, last name) */}
                            {isRow0 && (
                              <td
                                rowSpan={9}
                                style={{
                                  padding: `${rowPadding}px 1px`,
                                  boxSizing: 'border-box',
                                }}
                                className="border border-black text-center align-middle bg-white text-black overflow-hidden"
                              >
                                {/* 3-Row Student Name */}
                                <div
                                  className="font-semibold text-black leading-tight text-center w-full px-0.5 break-words"
                                  style={{ fontSize: `${nameFontSize}px` }}
                                >
                                  {fName && <div className="leading-tight">{fName}</div>}
                                  {mName && <div className="leading-tight">{mName}</div>}
                                  {lName && <div className="leading-tight">{lName}</div>}
                                </div>

                                {hasCwsnBadge && (
                                  <div className="my-0.5">
                                    <span className="inline-block border border-black text-black font-extrabold px-1.5 py-0.2 rounded text-[7px] bg-white">
                                      (CWSN)
                                    </span>
                                  </div>
                                )}
                                <div
                                  className="mt-1 text-black font-mono space-y-0.2 text-center leading-tight"
                                  style={{ fontSize: `${detailsFontSize}px` }}
                                >
                                  <div><span className="font-bold">CASTE:</span> {st.caste || 'GM'}</div>
                                  <div><span className="font-bold">DOB:</span> {st.dob || st.dateOfBirth || '01/06/2016'}</div>
                                  <div><span className="font-bold">SATS:</span> {st.satsNo || 'N/A'}</div>
                                  <div><span className="font-bold">GENDER:</span> {st.gender === 'Girl' ? 'Girl' : (st.gender === 'Boy' ? 'Boy' : ((st as any).gender || '-'))}</div>
                                </div>
                              </td>
                            )}

                            {/* 4. Column 4: ATTENDANCE for Sem 1, Sem 2 & Total */}
                            {isRow0 && (
                              <td
                                rowSpan={4}
                                style={{
                                  padding: `${rowPadding}px ${colPadding}px`,
                                  fontSize: `${fontSize}px`,
                                }}
                                className="border border-black text-center align-middle font-bold bg-white text-black"
                              >
                                <div className="text-[7.5px] leading-none mb-0.5">1ನೇ Sem</div>
                                {onUpdateSemAttendance ? (
                                  <>
                                    <input
                                      type="number"
                                      min="0"
                                      max={Math.max(0, workingDays - (cSt.sem2Attendance || 0))}
                                      value={cSt.sem1Attendance !== undefined ? cSt.sem1Attendance : ''}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        const maxAllowed = Math.max(0, workingDays - (cSt.sem2Attendance || 0));
                                        const clamped = Math.max(0, Math.min(val, maxAllowed));
                                        onUpdateSemAttendance(st.id, 'sem1', clamped);
                                      }}
                                      style={{ fontSize: `${marksFontSize}px` }}
                                      className="cce-screen-input w-full text-center font-mono font-bold text-black bg-transparent border-none outline-none p-0"
                                      title={`Edit Sem 1 Attendance (Max: ${Math.max(0, workingDays - (cSt.sem2Attendance || 0))})`}
                                    />
                                    <span className="cce-pdf-text font-mono font-bold text-black" style={{ fontSize: `${marksFontSize}px` }}>
                                      {cSt.sem1Attendance ?? '-'}
                                    </span>
                                  </>
                                ) : (
                                  <div style={{ fontSize: `${marksFontSize}px` }} className="font-mono font-bold text-black mt-0.5">
                                    {cSt.sem1Attendance ?? '-'}
                                  </div>
                                )}
                              </td>
                            )}
                            {isRow4 && (
                              <td
                                rowSpan={4}
                                style={{
                                  padding: `${rowPadding}px ${colPadding}px`,
                                  fontSize: `${fontSize}px`,
                                }}
                                className="border border-black text-center align-middle font-bold bg-white text-black"
                              >
                                <div className="text-[7.5px] leading-none mb-0.5">2ನೇ Sem</div>
                                {onUpdateSemAttendance ? (
                                  <>
                                    <input
                                      type="number"
                                      min="0"
                                      max={Math.max(0, workingDays - (cSt.sem1Attendance || 0))}
                                      value={cSt.sem2Attendance !== undefined ? cSt.sem2Attendance : ''}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        const maxAllowed = Math.max(0, workingDays - (cSt.sem1Attendance || 0));
                                        const clamped = Math.max(0, Math.min(val, maxAllowed));
                                        onUpdateSemAttendance(st.id, 'sem2', clamped);
                                      }}
                                      style={{ fontSize: `${marksFontSize}px` }}
                                      className="cce-screen-input w-full text-center font-mono font-bold text-black bg-transparent border-none outline-none p-0"
                                      title={`Edit Sem 2 Attendance (Max: ${Math.max(0, workingDays - (cSt.sem1Attendance || 0))})`}
                                    />
                                    <span className="cce-pdf-text font-mono font-bold text-black" style={{ fontSize: `${marksFontSize}px` }}>
                                      {cSt.sem2Attendance ?? '-'}
                                    </span>
                                  </>
                                ) : (
                                  <div style={{ fontSize: `${marksFontSize}px` }} className="font-mono font-bold text-black mt-0.5">
                                    {cSt.sem2Attendance ?? '-'}
                                  </div>
                                )}
                              </td>
                            )}
                            {isRow8 && (
                              <td
                                style={{
                                  padding: `${rowPadding}px ${colPadding}px`,
                                  fontSize: `${fontSize}px`,
                                }}
                                className="border border-black text-center align-middle font-black bg-white text-black"
                              >
                                <div className="text-[7.5px] leading-none">Total</div>
                                <div style={{ fontSize: `${marksFontSize}px` }} className="font-mono font-black">
                                  {cSt.attendanceDays || ((cSt.sem1Attendance || 0) + (cSt.sem2Attendance || 0)) || '-'}
                                </div>
                              </td>
                            )}

                            {/* 5. Exam Period */}
                            <td
                              style={{
                                padding: `${rowPadding}px ${colPadding}px`,
                                fontSize: isTotalRow ? '11px' : `${fontSize}px`,
                              }}
                              className={`border border-black bg-white text-black ${isTotalRow ? 'font-black' : 'font-bold'}`}
                            >
                              {r.exam}
                            </td>

                            {/* 6. Percentage (Col 6 - font size 10px) */}
                            <td
                              style={{
                                padding: `${rowPadding}px ${colPadding}px`,
                                fontSize: '10px',
                              }}
                              className={`border border-black font-mono bg-white text-black text-[10px] ${isTotalRow ? 'font-black' : 'font-bold'}`}
                            >
                              {r.pct}
                            </td>

                            {/* 7. FL (Mark, Grade) - Pure B&W, No underline */}
                            <td
                              style={{
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                padding: `${rowPadding}px ${colPadding}px`,
                                fontSize: `${marksFontSize}px`,
                              }}
                              className={`border border-black font-mono text-center bg-white text-black ${isTotalRow ? 'font-bold' : ''}`}
                            >
                              {isExempted ? (
                                '-'
                              ) : r.isFinalTotal && onUpdateSubject100 ? (
                                <>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={formatMarkForInput(r.fl)}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const cleaned = cleanMarkValue(e.target.value, 100);
                                      onUpdateSubject100(st.id, 'FL', cleaned as any);
                                    }}
                                    style={{ fontSize: `${marksFontSize}px` }}
                                    className="cce-screen-input w-full text-center bg-transparent focus:bg-slate-100 font-mono font-black text-black border-none outline-none p-0"
                                    placeholder="-"
                                    title="Edit First Language 100 Marks"
                                  />
                                  <span className="cce-pdf-text font-mono font-black text-black" style={{ fontSize: `${marksFontSize}px` }}>
                                    {formatMarkForDisplay(r.fl)}
                                  </span>
                                </>
                              ) : r.subKey && (onUpdateExamPct || onUpdateMarks) ? (
                                <>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={formatMarkForInput(r.fl)}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const maxVal = r.rawMax || 15;
                                      const cleaned = cleanMarkValue(e.target.value, maxVal);
                                      if (onUpdateExamPct) onUpdateExamPct(st.id, 'FL', r.subKey!, cleaned as any);
                                      else if (onUpdateMarks) onUpdateMarks(st.id, 'FL', r.subKey!, cleaned as any);
                                    }}
                                    style={{ fontSize: `${marksFontSize}px` }}
                                    className="cce-screen-input w-full text-center bg-transparent focus:bg-slate-100 font-mono font-bold text-black border-none outline-none p-0"
                                    placeholder="-"
                                    title={`Edit FL marks (Max ${r.rawMax || 15})`}
                                  />
                                  <span className="cce-pdf-text font-mono font-bold text-black" style={{ fontSize: `${marksFontSize}px` }}>
                                    {formatMarkForDisplay(r.fl)}
                                  </span>
                                </>
                              ) : (
                                formatMarkForDisplay(r.fl)
                              )}
                            </td>
                            <td
                              style={{
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                padding: `${rowPadding}px ${colPadding}px`,
                                fontSize: `${marksFontSize}px`,
                              }}
                              className={`border border-black font-bold text-center bg-white text-black ${r.isFinalTotal ? 'font-black' : ''}`}
                            >
                              {isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : (r.flG || '-')}
                            </td>

                            {/* 8. SL (Mark, Grade) */}
                            <td
                              style={{
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                padding: `${rowPadding}px ${colPadding}px`,
                                fontSize: `${marksFontSize}px`,
                              }}
                              className={`border border-black font-mono text-center bg-white text-black ${isTotalRow ? 'font-bold' : ''}`}
                            >
                              {isExempted ? (
                                '-'
                              ) : r.isFinalTotal && onUpdateSubject100 ? (
                                <>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={formatMarkForInput(r.sl)}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const cleaned = cleanMarkValue(e.target.value, 100);
                                      onUpdateSubject100(st.id, 'SL', cleaned as any);
                                    }}
                                    style={{ fontSize: `${marksFontSize}px` }}
                                    className="cce-screen-input w-full text-center bg-transparent focus:bg-slate-100 font-mono font-black text-black border-none outline-none p-0"
                                    placeholder="-"
                                    title="Edit Second Language 100 Marks"
                                  />
                                  <span className="cce-pdf-text font-mono font-black text-black" style={{ fontSize: `${marksFontSize}px` }}>
                                    {formatMarkForDisplay(r.sl)}
                                  </span>
                                </>
                              ) : r.subKey && (onUpdateExamPct || onUpdateMarks) ? (
                                <>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={formatMarkForInput(r.sl)}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const maxVal = r.rawMax || 15;
                                      const cleaned = cleanMarkValue(e.target.value, maxVal);
                                      if (onUpdateExamPct) onUpdateExamPct(st.id, 'SL', r.subKey!, cleaned as any);
                                      else if (onUpdateMarks) onUpdateMarks(st.id, 'SL', r.subKey!, cleaned as any);
                                    }}
                                    style={{ fontSize: `${marksFontSize}px` }}
                                    className="cce-screen-input w-full text-center bg-transparent focus:bg-slate-100 font-mono font-bold text-black border-none outline-none p-0"
                                    placeholder="-"
                                    title={`Edit SL marks (Max ${r.rawMax || 15})`}
                                  />
                                  <span className="cce-pdf-text font-mono font-bold text-black" style={{ fontSize: `${marksFontSize}px` }}>
                                    {formatMarkForDisplay(r.sl)}
                                  </span>
                                </>
                              ) : (
                                formatMarkForDisplay(r.sl)
                              )}
                            </td>
                            <td
                              style={{
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                padding: `${rowPadding}px ${colPadding}px`,
                                fontSize: `${marksFontSize}px`,
                              }}
                              className={`border border-black font-bold text-center bg-white text-black ${r.isFinalTotal ? 'font-black' : ''}`}
                            >
                              {isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : (r.slG || '-')}
                            </td>

                            {/* 9. MATHS (Mark, Grade) */}
                            <td
                              style={{
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                padding: `${rowPadding}px ${colPadding}px`,
                                fontSize: `${marksFontSize}px`,
                              }}
                              className={`border border-black font-mono text-center bg-white text-black ${isTotalRow ? 'font-bold' : ''}`}
                            >
                              {isExempted ? (
                                '-'
                              ) : r.isFinalTotal && onUpdateSubject100 ? (
                                <>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={formatMarkForInput(r.m)}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const cleaned = cleanMarkValue(e.target.value, 100);
                                      onUpdateSubject100(st.id, 'MATHS', cleaned as any);
                                    }}
                                    style={{ fontSize: `${marksFontSize}px` }}
                                    className="cce-screen-input w-full text-center bg-transparent focus:bg-slate-100 font-mono font-black text-black border-none outline-none p-0"
                                    placeholder="-"
                                    title="Edit Maths 100 Marks"
                                  />
                                  <span className="cce-pdf-text font-mono font-black text-black" style={{ fontSize: `${marksFontSize}px` }}>
                                    {formatMarkForDisplay(r.m)}
                                  </span>
                                </>
                              ) : r.subKey && (onUpdateExamPct || onUpdateMarks) ? (
                                <>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={formatMarkForInput(r.m)}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const maxVal = r.rawMax || 15;
                                      const cleaned = cleanMarkValue(e.target.value, maxVal);
                                      if (onUpdateExamPct) onUpdateExamPct(st.id, 'MATHS', r.subKey!, cleaned as any);
                                      else if (onUpdateMarks) onUpdateMarks(st.id, 'MATHS', r.subKey!, cleaned as any);
                                    }}
                                    style={{ fontSize: `${marksFontSize}px` }}
                                    className="cce-screen-input w-full text-center bg-transparent focus:bg-slate-100 font-mono font-bold text-black border-none outline-none p-0"
                                    placeholder="-"
                                    title={`Edit Maths marks (Max ${r.rawMax || 15})`}
                                  />
                                  <span className="cce-pdf-text font-mono font-bold text-black" style={{ fontSize: `${marksFontSize}px` }}>
                                    {formatMarkForDisplay(r.m)}
                                  </span>
                                </>
                              ) : (
                                formatMarkForDisplay(r.m)
                              )}
                            </td>
                            <td
                              style={{
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                padding: `${rowPadding}px ${colPadding}px`,
                                fontSize: `${marksFontSize}px`,
                              }}
                              className={`border border-black font-bold text-center bg-white text-black ${r.isFinalTotal ? 'font-black' : ''}`}
                            >
                              {isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : (r.mG || '-')}
                            </td>

                            {/* 10. EVS (Mark, Grade) */}
                            <td
                              style={{
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                padding: `${rowPadding}px ${colPadding}px`,
                                fontSize: `${marksFontSize}px`,
                              }}
                              className={`border border-black font-mono text-center bg-white text-black ${isTotalRow ? 'font-bold' : ''}`}
                            >
                              {isExempted ? (
                                '-'
                              ) : r.isFinalTotal && onUpdateSubject100 ? (
                                <>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={formatMarkForInput(r.evs)}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const cleaned = cleanMarkValue(e.target.value, 100);
                                      onUpdateSubject100(st.id, 'EVS', cleaned as any);
                                    }}
                                    style={{ fontSize: `${marksFontSize}px` }}
                                    className="cce-screen-input w-full text-center bg-transparent focus:bg-slate-100 font-mono font-black text-black border-none outline-none p-0"
                                    placeholder="-"
                                    title="Edit EVS 100 Marks"
                                  />
                                  <span className="cce-pdf-text font-mono font-black text-black" style={{ fontSize: `${marksFontSize}px` }}>
                                    {formatMarkForDisplay(r.evs)}
                                  </span>
                                </>
                              ) : r.subKey && (onUpdateExamPct || onUpdateMarks) ? (
                                <>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={formatMarkForInput(r.evs)}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const maxVal = r.rawMax || 15;
                                      const cleaned = cleanMarkValue(e.target.value, maxVal);
                                      if (onUpdateExamPct) onUpdateExamPct(st.id, 'EVS', r.subKey!, cleaned as any);
                                      else if (onUpdateMarks) onUpdateMarks(st.id, 'EVS', r.subKey!, cleaned as any);
                                    }}
                                    style={{ fontSize: `${marksFontSize}px` }}
                                    className="cce-screen-input w-full text-center bg-transparent focus:bg-slate-100 font-mono font-bold text-black border-none outline-none p-0"
                                    placeholder="-"
                                    title={`Edit EVS marks (Max ${r.rawMax || 15})`}
                                  />
                                  <span className="cce-pdf-text font-mono font-bold text-black" style={{ fontSize: `${marksFontSize}px` }}>
                                    {formatMarkForDisplay(r.evs)}
                                  </span>
                                </>
                              ) : (
                                formatMarkForDisplay(r.evs)
                              )}
                            </td>
                            <td
                              style={{
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                padding: `${rowPadding}px ${colPadding}px`,
                                fontSize: `${marksFontSize}px`,
                              }}
                              className={`border border-black font-bold text-center bg-white text-black ${r.isFinalTotal ? 'font-black' : ''}`}
                            >
                              {isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : (r.evsG || '-')}
                            </td>

                            {/* 11. Max Marks (Col 15) - Fit tightly to text */}
                            <td
                              style={{
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                padding: `${rowPadding}px 0.5px`,
                                fontSize: `${marksFontSize}px`,
                                whiteSpace: 'nowrap',
                              }}
                              className={`border border-black font-mono font-black text-center bg-white text-black overflow-hidden ${r.isFinalTotal ? 'font-black' : ''}`}
                            >
                              {r.max}
                            </td>

                            {/* 12, 13, 14: Grand Total Breakdown (Cols 16, 17, 18) - Fit tightly to text */}
                            <td
                              style={{
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                padding: `${rowPadding}px 0.5px`,
                                fontSize: `${marksFontSize}px`,
                                whiteSpace: 'nowrap',
                              }}
                              className={`border border-black font-mono font-bold text-center bg-white text-black overflow-hidden ${isTotalRow ? 'font-black' : ''}`}
                            >
                              {isExempted ? '-' : (cSt.totalMarks400 > 0 ? r.obt.total : '-')}
                            </td>
                            <td
                              style={{
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                padding: `${rowPadding}px 0.5px`,
                                fontSize: `${marksFontSize}px`,
                                whiteSpace: 'nowrap',
                              }}
                              className={`border border-black font-mono font-bold text-center bg-white text-black overflow-hidden ${isTotalRow ? 'font-black' : ''}`}
                            >
                              {isExempted ? '-' : (cSt.totalMarks400 > 0 ? r.obt.pctStr : '-')}
                            </td>
                            <td
                              style={{
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                padding: `${rowPadding}px 0.5px`,
                                fontSize: `${marksFontSize}px`,
                                whiteSpace: 'nowrap',
                              }}
                              className={`border border-black font-black text-center bg-white text-black overflow-hidden ${r.isFinalTotal ? 'font-black' : ''}`}
                            >
                              {isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : (cSt.totalMarks400 > 0 ? r.obt.grade : '-')}
                            </td>

                            {/* Part B: Co-Scholastic Grades (5 columns) - Editable */}
                            {isRow0 && (
                              <>
                                {CO_SCHOLASTIC_ACTIVITIES.map((act) => (
                                  <td
                                    key={act.key}
                                    rowSpan={4}
                                    style={{
                                      padding: `${rowPadding}px 0.5px`,
                                      fontSize: `${marksFontSize}px`,
                                      whiteSpace: 'nowrap',
                                    }}
                                    className="border border-black font-mono font-bold align-middle bg-white text-black text-center overflow-hidden"
                                  >
                                    {onUpdateCoScholastic ? (
                                      <>
                                        <select
                                          value={coSem1[act.key] || ''}
                                          onChange={(e) => onUpdateCoScholastic(st.id, 'sem1', act.key, e.target.value)}
                                          style={{ fontSize: `${marksFontSize}px` }}
                                          className="cce-screen-input w-full text-center font-mono font-bold text-black bg-transparent border-none outline-none p-0 cursor-pointer"
                                          title={`Edit Sem 1 ${act.nameEn} Grade`}
                                        >
                                          <option value="">-</option>
                                          <option value="A">A</option>
                                          <option value="B">B</option>
                                          <option value="C">C</option>
                                        </select>
                                        <span className="cce-pdf-text font-mono font-bold text-black" style={{ fontSize: `${marksFontSize}px` }}>
                                          {coSem1[act.key] || '-'}
                                        </span>
                                      </>
                                    ) : (
                                      coSem1[act.key] || '-'
                                    )}
                                  </td>
                                ))}
                              </>
                            )}
                            {isRow4 && (
                              <>
                                {CO_SCHOLASTIC_ACTIVITIES.map((act) => (
                                  <td
                                    key={act.key}
                                    rowSpan={4}
                                    style={{
                                      padding: `${rowPadding}px 0.5px`,
                                      fontSize: `${marksFontSize}px`,
                                      whiteSpace: 'nowrap',
                                    }}
                                    className="border border-black font-mono font-bold align-middle bg-white text-black text-center overflow-hidden"
                                  >
                                    {onUpdateCoScholastic ? (
                                      <>
                                        <select
                                          value={coSem2[act.key] || ''}
                                          onChange={(e) => onUpdateCoScholastic(st.id, 'sem2', act.key, e.target.value)}
                                          style={{ fontSize: `${marksFontSize}px` }}
                                          className="cce-screen-input w-full text-center font-mono font-bold text-black bg-transparent border-none outline-none p-0 cursor-pointer"
                                          title={`Edit Sem 2 ${act.nameEn} Grade`}
                                        >
                                          <option value="">-</option>
                                          <option value="A">A</option>
                                          <option value="B">B</option>
                                          <option value="C">C</option>
                                        </select>
                                        <span className="cce-pdf-text font-mono font-bold text-black" style={{ fontSize: `${marksFontSize}px` }}>
                                          {coSem2[act.key] || '-'}
                                        </span>
                                      </>
                                    ) : (
                                      coSem2[act.key] || '-'
                                    )}
                                  </td>
                                ))}
                              </>
                            )}
                            {isRow8 && (
                              <>
                                {CO_SCHOLASTIC_ACTIVITIES.map((act) => (
                                  <td
                                    key={act.key}
                                    style={{
                                      padding: `${rowPadding}px 0.5px`,
                                      fontSize: `${marksFontSize}px`,
                                      whiteSpace: 'nowrap',
                                    }}
                                    className="border border-black font-mono font-black align-middle bg-white text-black text-center overflow-hidden"
                                  >
                                    {onUpdateCoScholastic ? (
                                      <>
                                        <select
                                          value={coFinal[act.key] || ''}
                                          onChange={(e) => onUpdateCoScholastic(st.id, 'final', act.key, e.target.value)}
                                          style={{ fontSize: `${marksFontSize}px` }}
                                          className="cce-screen-input w-full text-center font-mono font-black text-black bg-transparent border-none outline-none p-0 cursor-pointer"
                                          title={`Edit Final ${act.nameEn} Grade`}
                                        >
                                          <option value="">-</option>
                                          <option value="A">A</option>
                                          <option value="B">B</option>
                                          <option value="C">C</option>
                                        </select>
                                        <span className="cce-pdf-text font-mono font-black text-black" style={{ fontSize: `${marksFontSize}px` }}>
                                          {coFinal[act.key] || '-'}
                                        </span>
                                      </>
                                    ) : (
                                      coFinal[act.key] || '-'
                                    )}
                                  </td>
                                ))}
                              </>
                            )}

                            {/* 16. Result Status - Spans 9 rows */}
                            {isRow0 && (
                              <td
                                rowSpan={9}
                                className="border border-black font-black align-middle text-center bg-white text-black p-0 overflow-hidden"
                                style={{ height: `${studentRowHeightCm}cm`, width: `${colWeights[23]}%`, boxSizing: 'border-box' }}
                              >
                                <span
                                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                  className="inline-block py-0.5 mx-auto text-[7.5px] font-black leading-none max-w-full"
                                >
                                  {isExempted
                                    ? 'EXEMPTED'
                                    : cSt.resultStatus.includes('PASS') || cSt.resultStatus.includes('PROMOTED') || cSt.resultStatus.includes('ತೇರ್ಗಡೆ')
                                    ? 'PROMOTED'
                                    : 'NOT PROMOTED'}
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

            {/* Bottom Section / Official Signatures:
                - Intermediate pages: No bottom footer needed
                - Last page ONLY: Official signatures 2cm below table, and below that Part B info */}
            <div>
              {chunkIdx === chunks.length - 1 && (
                <div
                  style={{ marginTop: '2.0cm' }}
                  className="cce-signatures-block pt-3 text-black text-xs font-bold border-t-2 border-black break-inside-avoid print:break-inside-avoid"
                >
                  <div className="flex flex-row items-end justify-between gap-6 w-full px-2">
                    {/* Left: Place and Editable Date */}
                    <div className="space-y-1.5 text-left text-black">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[11px] text-black">{isKannada ? 'ಸ್ಥಳ:' : 'Place:'}</span>
                        <input
                          type="text"
                          value={placeName}
                          onChange={(e) => setPlaceName(e.target.value)}
                          className="font-bold px-1 bg-transparent w-36 text-black border-b border-black outline-none text-[11px] focus:bg-slate-100"
                          placeholder={isKannada ? 'ಸ್ಥಳದ ಹೆಸರು' : 'Place Name'}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[11px] text-black">{isKannada ? 'ದಿನಾಂಕ:' : 'Date:'}</span>
                        <input
                          type="text"
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                          className="font-bold px-1 bg-transparent w-32 font-mono text-black border-b border-black outline-none text-[11px] focus:bg-slate-100"
                          placeholder="DD/MM/YYYY"
                        />
                      </div>
                    </div>

                    {/* Signature 1: Class Teacher Sign */}
                    <div className="text-center space-y-1">
                      <div className="w-56 border-b border-black pb-1 h-6"></div>
                      <div className="text-[11px] font-black uppercase tracking-wider text-black">
                        {isKannada ? 'ವರ್ಗ ಶಿಕ್ಷಕರ ಸಹಿ' : "Class Teacher's Signature"}
                      </div>
                    </div>

                    {/* Signature 2: Head Master Sign & Seal */}
                    <div className="text-center space-y-1">
                      <div className="w-56 border-b border-black pb-1 h-6"></div>
                      <div className="text-[11px] font-black uppercase tracking-wider text-black">
                        {isKannada ? 'ಮುಖ್ಯ ಗುರುಗಳ ಸಹಿ ಮತ್ತು ಮೊಹರು' : "Head Master's Signature & Seal"}
                      </div>
                    </div>
                  </div>

                  {/* Part-B Activities Reference Information given strictly below the signatures */}
                  <div className="w-full mt-4 border border-black p-2 text-black bg-white">
                    <div className="text-[10px] font-bold text-black mb-1">
                      <span className="uppercase tracking-wider">
                        {isKannada ? 'ಸಹ ಪಠ್ಯ ವಿಷಯಗಳ ಮಾಹಿತಿ (PART-B CO-SCHOLASTIC ACTIVITIES):' : 'PART-B CO-SCHOLASTIC ACTIVITIES REFERENCE:'}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 text-center font-bold text-black text-[9px]">
                      {CO_SCHOLASTIC_ACTIVITIES.map((act, i) => (
                        <div key={act.key} className="border border-black p-1 bg-white">
                          <div className="font-mono font-black text-[11px]">({i + 1})</div>
                          <div className="leading-tight text-[8.5px] mt-0.5 font-bold">
                            {act.key === 'supw' ? 'SOCIAL USEFUL PRODUCTIVE WORK' : (isKannada ? act.nameKn : act.nameEn)}
                          </div>
                        </div>
                      ))}
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
                    ಪುಟ {chunkIdx + 1} / {chunks.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
};
