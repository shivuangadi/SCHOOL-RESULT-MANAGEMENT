import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  SchoolRecord,
  isCwsnStudent,
  formatClassStd,
  splitStudentNameTo3Rows,
} from '../../types';
import {
  ComputedMarathiUrduStudent,
  MARATHI_URDU_CO_ACTIVITIES,
  MarathiUrduSubjectCode,
  getMarathiUrduSubjects,
  calculateGrade,
} from '../../utils/marathiUrduCceHelper';
import { extractLastWordOfSchoolName } from '../../utils/primaryCceHelper';
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
  printMarathiUrduCcePage4Detailed,
  exportMarathiUrduCcePage4DetailedPdf,
  exportMarathiUrduCcePage4DetailedHtml,
  ReportPaperSize,
  REPORT_PAPER_SIZES,
} from '../../utils/report_layouts/group2_marathi_urdu/marathiUrduPage4LayoutHelper';
import { shareReportToWhatsApp } from '../../utils/printPdfHelper';
import { handleTableGridNavigation } from '../../utils/tableNavigationHelper';

export interface MarathiUrduCcePage4Detailed500Props {
  computedList: ComputedMarathiUrduStudent[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  selectedClass: string;
  medium: 'Marathi' | 'Urdu';
  classTeacherName: string;
  workingDays: number;
  paperSize?: ReportPaperSize;
  onPaperSizeChange?: (size: ReportPaperSize) => void;
  reportRef?: React.RefObject<HTMLDivElement | null>;
  onUpdateMarks?: (studentId: string, subCode: MarathiUrduSubjectCode, field: string, val: number) => void;
  onUpdateExamPct?: (studentId: string, subCode: MarathiUrduSubjectCode, exam: 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2', val: number) => void;
  onUpdateSubject100?: (studentId: string, subCode: MarathiUrduSubjectCode, mark100: number) => void;
  onUpdateSemAttendance?: (studentId: string, sem: 'sem1' | 'sem2', days: number) => void;
  onUpdateAttendance?: (studentId: string, days: number) => void;
  onUpdateCoScholastic?: (studentId: string, sem: 'sem1' | 'sem2', key: string, val: string) => void;
}

export const MarathiUrduCcePage4Detailed500: React.FC<MarathiUrduCcePage4Detailed500Props> = ({
  computedList,
  schoolRecord,
  academicYear,
  selectedClass,
  medium,
  classTeacherName,
  workingDays,
  paperSize: externalPaperSize,
  onPaperSizeChange,
  reportRef: externalReportRef,
  onUpdateMarks,
  onUpdateExamPct,
  onUpdateSubject100,
  onUpdateSemAttendance,
}) => {
  const internalReportRef = useRef<HTMLDivElement | null>(null);
  const targetReportRef = externalReportRef || internalReportRef;

  const defaultPlace = extractLastWordOfSchoolName(schoolRecord?.schoolName) || 'Belagavi';
  const [placeName, setPlaceName] = useState(defaultPlace);
  const [reportDate, setReportDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });

  const profileClassTeacher = useMemo(() => {
    return getSavedClassTeacher(schoolRecord, selectedClass) || classTeacherName || '';
  }, [schoolRecord, selectedClass, classTeacherName]);

  const [ctName, setCtName] = useState(profileClassTeacher);
  useEffect(() => {
    if (profileClassTeacher) {
      setCtName(profileClassTeacher);
    }
  }, [profileClassTeacher]);

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

  // Exact typographic hierarchy and dimensions requested
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

  const sheetWidthMm = isA4 ? 297 : 355.6;
  const sheetHeightMm = isA4 ? 210 : 215.9;

  // 26 Explicit Percentage-Based Columns summing to 100.0%
  // 5 subjects x 2 cols (M & G) = 10 cols (2 more columns than the 4-subject report)
  // Col 3: Student Name & Details (10.0% effective), Col 26: Result (4.0% effective)
  // Remaining space transferred directly to Left Margin (4.77cm on Legal, 4.23cm on A4)
  const colWeights = useMemo(() => {
    return [
      1.8,  // Col 1: SI NO
      2.2,  // Col 2: REG NO
      11.0, // Col 3: Student Name & Details (10.0% of sheet)
      2.8,  // Col 4: Attendance
      3.6,  // Col 5: Exam Period (FA1..Sem1..FA3..Sem2..Total)
      2.4,  // Col 6: % (15%, 20%, 50%, 100%)
      3.6,  // Col 7: FL Marks
      2.8,  // Col 8: FL Grade
      3.6,  // Col 9: SL Marks
      2.8,  // Col 10: SL Grade
      3.6,  // Col 11: TL Marks
      2.8,  // Col 12: TL Grade
      3.6,  // Col 13: Maths Marks
      2.8,  // Col 14: Maths Grade
      3.6,  // Col 15: EVS Marks
      2.8,  // Col 16: EVS Grade
      3.4,  // Col 17: Max 500
      3.8,  // Col 18: Total Secured Marks
      3.4,  // Col 19: Percentage (%)
      2.6,  // Col 20: Overall Grade
      3.6,  // Col 21: Co-Scholastic 1
      3.6,  // Col 22: Co-Scholastic 2
      3.6,  // Col 23: Co-Scholastic 3
      3.6,  // Col 24: Co-Scholastic 4
      3.6,  // Col 25: Co-Scholastic 5
      4.4,  // Col 26: Result (4.0% of sheet)
    ];
  }, []);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const subjects = useMemo(() => getMarathiUrduSubjects(medium), [medium]);

  // Clean marks input helper
  const cleanMarkValue = (raw: string, maxVal: number = 99): number | null => {
    const trimmed = raw.trim();
    if (trimmed === '') return null;
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
    return String(num);
  };

  const formatMarkForInput = (val: any): string => {
    if (val === null || val === undefined || val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return '';
    return String(num);
  };

  // Pagination into chunks
  const chunks: ComputedMarathiUrduStudent[][] = useMemo(() => {
    if (computedList.length === 0) return [[]];
    const n = computedList.length;

    if (studentsPerPage === 3 && n % 3 === 0 && n >= 3) {
      const res: ComputedMarathiUrduStudent[][] = [];
      const fullPages = Math.floor(n / 3) - 1;
      for (let p = 0; p < fullPages; p++) {
        res.push(computedList.slice(p * 3, p * 3 + 3));
      }
      const start = fullPages * 3;
      res.push(computedList.slice(start, start + 2)); // penultimate page: 2 students
      res.push(computedList.slice(start + 2, start + 3)); // final page: 1 student
      return res;
    }

    const res: ComputedMarathiUrduStudent[][] = [];
    for (let i = 0; i < n; i += studentsPerPage) {
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

  const schoolName = schoolRecord?.schoolName || 'GOVERNMENT HIGHER PRIMARY SCHOOL';
  const talukName = schoolRecord?.taluk?.trim() || 'Belagavi Rural';

  const getDocumentFilename = () => {
    const sName = schoolName.replace(/\s+/g, '_');
    return `${sName}_Class_${selectedClass}_${academicYear}_${medium}_CCE_500Marks_9Line_${paperSize.toUpperCase()}`;
  };

  const handlePrint = () => {
    if (targetReportRef.current) {
      printMarathiUrduCcePage4Detailed(targetReportRef.current, getDocumentFilename(), paperSize);
    } else {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    if (targetReportRef.current) {
      setIsExporting(true);
      showStatus('Generating PDF report...');
      try {
        await exportMarathiUrduCcePage4DetailedPdf(targetReportRef.current, getDocumentFilename(), paperSize);
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
      exportMarathiUrduCcePage4DetailedHtml(targetReportRef.current, getDocumentFilename(), paperSize);
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
        `CCE 500 Marks 9-Line Register: ${formatClassStd(selectedClass)} (${medium} Medium) - ${schoolName}`
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Scoped CSS for Pure B&W Print */}
      <style>{`
        .cce-page4-mu-bw,
        .cce-page4-mu-bw * {
          border-color: #000000 !important;
          text-decoration: none !important;
          -webkit-text-decoration-line: none !important;
        }
        .cce-page4-mu-bw table {
          border-collapse: collapse !important;
          border: 2px solid #000000 !important;
          table-layout: fixed !important;
          width: 100% !important;
        }
        .cce-page4-mu-bw th,
        .cce-page4-mu-bw td {
          border: 1px solid #000000 !important;
          background-color: #ffffff !important;
          color: #000000 !important;
          text-align: center !important;
          vertical-align: middle !important;
          padding: 1px 2px !important;
          box-sizing: border-box !important;
        }
        .cce-page4-mu-bw input {
          border: none !important;
          outline: none !important;
          background: transparent !important;
          text-align: center !important;
          color: #000000 !important;
          box-shadow: none !important;
        }
        .cce-page4-mu-bw input:focus {
          background-color: #f0f0f0 !important;
        }
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
          .cce-page4-mu-bw .report-page-sheet {
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
          .cce-page4-mu-bw .report-page-sheet > div,
          .cce-page4-mu-bw .cce-sheet-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .cce-page4-mu-bw table {
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

      {/* Top Configuration Toolbar */}
      <div className="no-print print:hidden bg-slate-900 text-white p-3 rounded-2xl flex flex-col gap-3 text-xs shadow-md border border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-amber-300 text-xs">
              {medium} CCE 500 Marks (9-Line Register - 26 Columns):
            </span>

            {/* Paper Size */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <span className="font-bold text-slate-300 px-1 text-[11px]">ಕಾಗದ ಸೈಜ್:</span>
              <button
                type="button"
                onClick={() => setPaperSize('legal')}
                className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer text-xs ${
                  paperSize === 'legal' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Legal Landscape (356mm × 216mm)"
              >
                Legal (356×216mm)
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('a4')}
                className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer text-xs ${
                  paperSize === 'a4' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title="A4 Landscape (297mm × 210mm)"
              >
                A4 (297×210mm)
              </button>
            </div>

            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-200 border border-slate-700">
              {paperSize === 'legal' ? '📐 Legal Landscape' : '📄 A4 Landscape'}
            </span>

            {/* Students per page */}
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

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Print Report in Pure Black & White"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ಮುದ್ರಿಸಿ (Print)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
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

        {statusMessage && (
          <div className="text-amber-300 font-bold text-center bg-slate-950/60 py-1 rounded-lg">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Main Printable Document */}
      <div
        ref={targetReportRef}
        className="cce-page4-mu-bw space-y-6"
        style={{ width: '100%', margin: '0 auto' }}
        onKeyDown={handleTableGridNavigation}
      >
        {chunks.map((pageStudents, chunkIdx) => {
          return (
            <div
              key={chunkIdx}
              className="report-page-sheet bg-white border-0 shadow-none mx-auto"
              style={{
                width: `${sheetWidthMm}mm`,
                minHeight: `${sheetHeightMm}mm`,
                paddingLeft: isA4 ? '42.3mm' : '47.7mm',
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
                {/* Header Information */}
                <div
                  className="relative border-b-2 border-black pb-0.5 text-black flex items-center justify-center text-center"
                  style={{ height: '1.25cm', maxHeight: '1.25cm', boxSizing: 'border-box' }}
                >
                  <div className="text-center px-2 flex-1 flex flex-col justify-center h-full space-y-0.5 overflow-hidden">
                    <h2 className="text-[11px] font-black text-black font-serif leading-tight uppercase truncate">
                      OFFICE OF THE BLOCK EDUCATION OFFICER & BRC, {talukName.toUpperCase()}
                    </h2>
                    <h3 className="text-[12.5px] font-black text-black leading-tight uppercase truncate">
                      {schoolName}
                      {schoolRecord?.diseCode ? ` • DISE: ${schoolRecord.diseCode}` : ''}
                    </h3>
                    <p className="text-[11px] font-black text-red-600 leading-tight truncate">
                      CCE CONTINUOUS COMPREHENSIVE EVALUATION (CLASSES 1 TO 5) - {medium.toUpperCase()} MEDIUM (500 MARKS)
                    </p>
                  </div>
                </div>

                {/* Subheader: Class Teacher, Academic Year, Working Days */}
                <div
                  className="w-full flex flex-row flex-nowrap justify-between items-center text-[9.5px] font-bold text-black border-b border-black py-0.5 px-1 mt-0.5 mb-1 whitespace-nowrap"
                  style={{ boxSizing: 'border-box', whiteSpace: 'nowrap', lineHeight: 1.2 }}
                >
                  <div className="text-left whitespace-nowrap shrink-0">
                    Class: <span className="font-black">{formatClassStd(selectedClass)}</span> | Year: <span className="font-mono font-black">{academicYear}</span>
                  </div>
                  <div className="text-center font-bold whitespace-nowrap shrink-0">
                    CLASS TEACHER'S NAME: <span className="font-black uppercase">{ctName || classTeacherName || ''}</span>
                  </div>
                  <div className="text-right whitespace-nowrap shrink-0">
                    Working Days: <span className="font-mono font-black">{workingDays || 241}</span>
                  </div>
                </div>

                {/* Main 9-Line Table for 5 Subjects (26 Columns) */}
                <div className="w-full overflow-hidden mt-0.5" style={{ boxSizing: 'border-box' }}>
                  <table
                    className="w-full text-center border-collapse border-2 border-black bg-white text-black table-fixed"
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.15, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                    onKeyDown={handleTableGridNavigation}
                  >
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

                        {/* Student Name & Details (Col 3: 10% of sheet) */}
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
                            STUDENT'S NAME
                          </div>
                          <div
                            className="font-bold text-center mt-0.5 leading-tight"
                            style={{ fontSize: `${Math.max(7.5, headerFontSize - 2.5)}px` }}
                          >
                            {medium === 'Urdu' ? 'طالب علم کا نام' : 'विद्यार्थ्याचे नाव'}
                          </div>
                        </th>

                        {/* Attendance */}
                        <th
                          rowSpan={3}
                          style={{
                            width: `${colWeights[3]}%`,
                            fontSize: `${Math.min(headerFontSize, 10.5)}px`,
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            padding: '1px',
                          }}
                          className="border border-black align-middle text-center font-black"
                        >
                          <span
                            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                            className="inline-block py-0.5 mx-auto font-black text-center leading-none text-[8px]"
                          >
                            ATTENDANCE
                          </span>
                        </th>

                        {/* Evaluation Period */}
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

                        {/* Percentage */}
                        <th
                          rowSpan={3}
                          style={{
                            width: `${colWeights[5]}%`,
                            fontSize: `${headerFontSize}px`,
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            padding: '1px',
                          }}
                          className="border border-black align-middle text-center font-black"
                        >
                          <span className="font-black text-center block">%</span>
                        </th>

                        {/* 5 Curricular Subjects Header (10 cols: FL, SL, TL, MATHS, EVS) */}
                        <th
                          colSpan={10}
                          style={{
                            width: `${colWeights.slice(6, 16).reduce((a, b) => a + b, 0)}%`,
                            fontSize: `${headerFontSize}px`,
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            padding: '2px 1px',
                            lineHeight: 1.15,
                          }}
                          className="border border-black font-black text-center"
                        >
                          PART-A STUDENT'S ACADEMIC PERFORMANCE (CURRICULAR - 5 SUBJECTS)
                        </th>

                        {/* Max Marks (500) */}
                        <th
                          rowSpan={3}
                          style={{
                            width: `${colWeights[16]}%`,
                            fontSize: `${Math.min(headerFontSize, 8.5)}px`,
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            padding: '0.5px',
                            lineHeight: 1.05,
                          }}
                          className="border border-black font-black align-middle text-center overflow-hidden"
                        >
                          TOTAL<br />
                          <span className="font-mono font-black" style={{ fontSize: `${Math.min(headerFontSize, 8.5)}px` }}>500</span>
                        </th>

                        {/* Total Secured Header (3 cols) */}
                        <th
                          colSpan={3}
                          style={{
                            width: `${colWeights.slice(17, 20).reduce((a, b) => a + b, 0)}%`,
                            fontSize: `${Math.min(headerFontSize, 8.5)}px`,
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            whiteSpace: 'normal',
                            padding: '1px 0.5px',
                            lineHeight: 1.1,
                          }}
                          className="border border-black font-black text-center"
                        >
                          TOTAL SECURED
                        </th>

                        {/* Co-Scholastic Header (5 cols) */}
                        <th
                          colSpan={5}
                          style={{
                            width: `${colWeights.slice(20, 25).reduce((a, b) => a + b, 0)}%`,
                            fontSize: `${headerFontSize}px`,
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            whiteSpace: 'normal',
                            padding: '1px 0.5px',
                            lineHeight: 1.15,
                          }}
                          className="border border-black font-black text-center border-l-2"
                        >
                          PART-B GRADES
                        </th>

                        {/* Result Header */}
                        <th
                          rowSpan={3}
                          style={{
                            width: `${colWeights[25]}%`,
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

                      {/* Header Row 2: 5 Subjects Names & Secured Breakdown */}
                      <tr
                        className="bg-white font-bold text-black border-b border-black"
                        style={{ height: `${(headingHeightCm * 0.32).toFixed(2)}cm` }}
                      >
                        {subjects.map((sub, sIdx) => (
                          <th
                            key={sub.code}
                            colSpan={2}
                            style={{
                              width: `${colWeights[6 + sIdx * 2] + colWeights[7 + sIdx * 2]}%`,
                              fontSize: `${Math.min(headerFontSize, 9.5)}px`,
                              verticalAlign: 'middle',
                              textAlign: 'center',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              padding: '1px',
                              lineHeight: 1.1,
                            }}
                            className="border border-black text-center"
                          >
                            {sub.shortEn}
                          </th>
                        ))}

                        <th
                          rowSpan={2}
                          style={{
                            width: `${colWeights[17]}%`,
                            fontSize: `${Math.min(headerFontSize, 8.5)}px`,
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            padding: '0.5px',
                            lineHeight: 1.05,
                          }}
                          className="border border-black font-bold text-center"
                        >
                          MARKS
                        </th>
                        <th
                          rowSpan={2}
                          style={{
                            width: `${colWeights[18]}%`,
                            fontSize: `${Math.min(headerFontSize, 8.5)}px`,
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            padding: '0.5px',
                            lineHeight: 1.05,
                          }}
                          className="border border-black font-bold text-center"
                        >
                          %
                        </th>
                        <th
                          rowSpan={2}
                          style={{
                            width: `${colWeights[19]}%`,
                            fontSize: `${Math.min(headerFontSize, 8.5)}px`,
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            padding: '0.5px',
                            lineHeight: 1.05,
                          }}
                          className="border border-black font-bold text-center"
                        >
                          GRADE
                        </th>

                        {/* Co-scholastic activities 1-5 */}
                        {[1, 2, 3, 4, 5].map((num, i) => (
                          <th
                            key={num}
                            rowSpan={2}
                            style={{
                              width: `${colWeights[20 + i]}%`,
                              fontSize: `${headerFontSize}px`,
                              verticalAlign: 'middle',
                              textAlign: 'center',
                              padding: '1px',
                            }}
                            className="border border-black align-middle text-center font-mono font-black"
                          >
                            ({num})
                          </th>
                        ))}
                      </tr>

                      {/* Header Row 3: M & G for all 5 Subjects */}
                      <tr
                        className="bg-white font-bold text-black border-b-2 border-black"
                        style={{ height: `${(headingHeightCm * 0.30).toFixed(2)}cm` }}
                      >
                        {subjects.map((sub, sIdx) => (
                          <React.Fragment key={sub.code}>
                            <th
                              style={{
                                width: `${colWeights[6 + sIdx * 2]}%`,
                                fontSize: `${headerFontSize}px`,
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                padding: '0.5px',
                              }}
                              className="border border-black"
                            >
                              M
                            </th>
                            <th
                              style={{
                                width: `${colWeights[7 + sIdx * 2]}%`,
                                fontSize: `${headerFontSize}px`,
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                padding: '0.5px',
                              }}
                              className="border border-black"
                            >
                              G
                            </th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>

                    {pageStudents.map((cSt, idxInChunk) => {
                      const globalIdx = chunkStartIndices[chunkIdx] + idxInChunk;
                      const st = cSt.student;
                      const isExempted = cSt.isExempted;
                      const hasCwsnBadge = isCwsnStudent(st.cwsnStatus) || cSt.isExempted;
                      const coSem1 = cSt.coScholastic?.sem1 || {};
                      const coSem2 = cSt.coScholastic?.sem2 || {};
                      const coFinal = cSt.coScholastic?.final || {};

                      const [fName, mName, lName] = splitStudentNameTo3Rows(st.studentName);
                      const regNo = st.schoolRegNo || (st as any).admissionNo || (st as any).regNo || '';

                      // 9 sub-rows definition
                      interface MuDetailedRow {
                        exam: string;
                        pct: string;
                        max: number;
                        subKey?: 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2';
                        rawMax?: number;
                        isSem1Total?: boolean;
                        isSem2Total?: boolean;
                        isFinalTotal?: boolean;
                      }

                      const rowsData: MuDetailedRow[] = [
                        { exam: 'FA-1', pct: '15%', max: 75, subKey: 'fa1', rawMax: 15 },
                        { exam: 'FA-2', pct: '15%', max: 75, subKey: 'fa2', rawMax: 15 },
                        { exam: 'SA-1', pct: '20%', max: 100, subKey: 'sa1', rawMax: 20 },
                        { exam: 'Sem-1', pct: '50%', max: 250, isSem1Total: true },
                        { exam: 'FA-3', pct: '15%', max: 75, subKey: 'fa3', rawMax: 15 },
                        { exam: 'FA-4', pct: '15%', max: 75, subKey: 'fa4', rawMax: 15 },
                        { exam: 'SA-2', pct: '20%', max: 100, subKey: 'sa2', rawMax: 20 },
                        { exam: 'Sem-2', pct: '50%', max: 250, isSem2Total: true },
                        { exam: 'Total', pct: '100%', max: 500, isFinalTotal: true },
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

                            // Calculate row total secured marks across 5 subjects
                            let rowSecuredMarks = 0;
                            let hasAnyRowMark = false;

                            subjects.forEach((sub) => {
                              const subData = cSt.subjects[sub.code];
                              if (!subData) return;
                              let mark: number | null = null;
                              if (r.subKey === 'fa1') mark = subData.fa1_pct;
                              else if (r.subKey === 'fa2') mark = subData.fa2_pct;
                              else if (r.subKey === 'sa1') mark = subData.sa1_pct;
                              else if (r.isSem1Total) mark = subData.sem1_total;
                              else if (r.subKey === 'fa3') mark = subData.fa3_pct;
                              else if (r.subKey === 'fa4') mark = subData.fa4_pct;
                              else if (r.subKey === 'sa2') mark = subData.sa2_pct;
                              else if (r.isSem2Total) mark = subData.sem2_total;
                              else if (r.isFinalTotal) mark = subData.total100;

                              if (mark !== null && mark !== undefined && mark > 0) {
                                rowSecuredMarks += mark;
                                hasAnyRowMark = true;
                              }
                            });

                            const rowPct = r.max > 0 && hasAnyRowMark ? (rowSecuredMarks / r.max) * 100 : null;
                            const rowGrade = rowPct !== null ? calculateGrade(rowPct) : '-';

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
                                {/* 1. Sl No */}
                                {isRow0 && (
                                  <td
                                    rowSpan={9}
                                    style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}
                                    className="border border-black font-mono font-bold align-middle bg-white text-center text-black"
                                  >
                                    {globalIdx + 1}
                                  </td>
                                )}

                                {/* 2. Registered No */}
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
                                    ) : null}
                                  </td>
                                )}

                                {/* 3. Student Name & Details (Name in 3 lines, Caste, DOB, SATS, Gender) */}
                                {isRow0 && (
                                  <td
                                    rowSpan={9}
                                    style={{ padding: `${rowPadding}px 1px`, boxSizing: 'border-box' }}
                                    className="border border-black text-center align-middle bg-white text-black overflow-hidden"
                                  >
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

                                {/* 4. Attendance */}
                                {isRow0 && (
                                  <td
                                    rowSpan={4}
                                    style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}
                                    className="border border-black text-center align-middle font-bold bg-white text-black"
                                  >
                                    <div className="text-[7.5px] leading-none mb-0.5">Sem-1</div>
                                    {onUpdateSemAttendance ? (
                                      <>
                                        <input
                                          type="number"
                                          min="0"
                                          value={cSt.sem1Attendance !== undefined ? cSt.sem1Attendance : ''}
                                          onChange={(e) => onUpdateSemAttendance(st.id, 'sem1', Number(e.target.value))}
                                          style={{ fontSize: `${marksFontSize}px` }}
                                          className="cce-screen-input w-full text-center font-mono font-bold text-black bg-transparent border-none outline-none p-0"
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
                                    style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}
                                    className="border border-black text-center align-middle font-bold bg-white text-black"
                                  >
                                    <div className="text-[7.5px] leading-none mb-0.5">Sem-2</div>
                                    {onUpdateSemAttendance ? (
                                      <>
                                        <input
                                          type="number"
                                          min="0"
                                          value={cSt.sem2Attendance !== undefined ? cSt.sem2Attendance : ''}
                                          onChange={(e) => onUpdateSemAttendance(st.id, 'sem2', Number(e.target.value))}
                                          style={{ fontSize: `${marksFontSize}px` }}
                                          className="cce-screen-input w-full text-center font-mono font-bold text-black bg-transparent border-none outline-none p-0"
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
                                    style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}
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

                                {/* 6. Percentage */}
                                <td
                                  style={{
                                    padding: `${rowPadding}px ${colPadding}px`,
                                    fontSize: isTotalRow ? '11px' : `${fontSize}px`,
                                  }}
                                  className={`border border-black font-mono bg-white text-black ${isTotalRow ? 'font-black' : 'font-bold'}`}
                                >
                                  {r.pct}
                                </td>

                                {/* 5 Curricular Subjects Marks & Grades */}
                                {subjects.map((sub) => {
                                  const subData = cSt.subjects[sub.code];
                                  let markVal: number | null = null;
                                  let gradeVal: string = '-';

                                  if (subData) {
                                    if (r.subKey === 'fa1') {
                                      markVal = subData.fa1_pct;
                                      gradeVal = subData.fa1_grade;
                                    } else if (r.subKey === 'fa2') {
                                      markVal = subData.fa2_pct;
                                      gradeVal = subData.fa2_grade;
                                    } else if (r.subKey === 'sa1') {
                                      markVal = subData.sa1_pct;
                                      gradeVal = subData.sa1_grade;
                                    } else if (r.isSem1Total) {
                                      markVal = subData.sem1_total;
                                      gradeVal = (subData.sem1_total || 0) > 0 ? calculateGrade(((subData.sem1_total || 0) / 50) * 100) : '-';
                                    } else if (r.subKey === 'fa3') {
                                      markVal = subData.fa3_pct;
                                      gradeVal = subData.fa3_grade;
                                    } else if (r.subKey === 'fa4') {
                                      markVal = subData.fa4_pct;
                                      gradeVal = subData.fa4_grade;
                                    } else if (r.subKey === 'sa2') {
                                      markVal = subData.sa2_pct;
                                      gradeVal = subData.sa2_grade;
                                    } else if (r.isSem2Total) {
                                      markVal = subData.sem2_total;
                                      gradeVal = (subData.sem2_total || 0) > 0 ? calculateGrade(((subData.sem2_total || 0) / 50) * 100) : '-';
                                    } else if (r.isFinalTotal) {
                                      markVal = subData.total100;
                                      gradeVal = subData.grade;
                                    }
                                  }

                                  return (
                                    <React.Fragment key={sub.code}>
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
                                              value={formatMarkForInput(markVal)}
                                              onFocus={(e) => e.target.select()}
                                              onChange={(e) => {
                                                const cl = cleanMarkValue(e.target.value, 100);
                                                onUpdateSubject100(st.id, sub.code, cl as any);
                                              }}
                                              style={{ fontSize: `${marksFontSize}px` }}
                                              className="cce-screen-input w-full text-center bg-transparent focus:bg-slate-100 font-mono font-black text-black border-none outline-none p-0"
                                            />
                                            <span className="cce-pdf-text font-mono font-black text-black" style={{ fontSize: `${marksFontSize}px` }}>
                                              {formatMarkForDisplay(markVal)}
                                            </span>
                                          </>
                                        ) : r.subKey && (onUpdateExamPct || onUpdateMarks) ? (
                                          <>
                                            <input
                                              type="text"
                                              inputMode="numeric"
                                              pattern="[0-9]*"
                                              value={formatMarkForInput(markVal)}
                                              onFocus={(e) => e.target.select()}
                                              onChange={(e) => {
                                                const cl = cleanMarkValue(e.target.value, r.rawMax || 15);
                                                if (onUpdateExamPct) onUpdateExamPct(st.id, sub.code, r.subKey!, cl as any);
                                                else if (onUpdateMarks) onUpdateMarks(st.id, sub.code, r.subKey!, cl as any);
                                              }}
                                              style={{ fontSize: `${marksFontSize}px` }}
                                              className="cce-screen-input w-full text-center bg-transparent focus:bg-slate-100 font-mono font-bold text-black border-none outline-none p-0"
                                            />
                                            <span className="cce-pdf-text font-mono font-bold text-black" style={{ fontSize: `${marksFontSize}px` }}>
                                              {formatMarkForDisplay(markVal)}
                                            </span>
                                          </>
                                        ) : (
                                          formatMarkForDisplay(markVal)
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
                                        {isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : (gradeVal || '-')}
                                      </td>
                                    </React.Fragment>
                                  );
                                })}

                                {/* Max Marks */}
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

                                {/* Secured Marks */}
                                <td
                                  style={{
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                    padding: `${rowPadding}px 0.5px`,
                                    fontSize: isTotalRow ? '11px' : `${marksFontSize}px`,
                                    whiteSpace: 'nowrap',
                                  }}
                                  className={`border border-black font-mono font-bold text-center bg-white text-black overflow-hidden ${isTotalRow ? 'font-black' : ''}`}
                                >
                                  {isExempted ? '-' : (hasAnyRowMark ? rowSecuredMarks : '-')}
                                </td>

                                {/* Secured % */}
                                <td
                                  style={{
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                    padding: `${rowPadding}px 0.5px`,
                                    fontSize: isTotalRow ? '11px' : `${marksFontSize}px`,
                                    whiteSpace: 'nowrap',
                                  }}
                                  className={`border border-black font-mono font-bold text-center bg-white text-black overflow-hidden ${isTotalRow ? 'font-black' : ''}`}
                                >
                                  {isExempted ? '-' : (rowPct !== null ? `${rowPct.toFixed(1)}%` : '-')}
                                </td>

                                {/* Secured Grade */}
                                <td
                                  style={{
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                    padding: `${rowPadding}px 0.5px`,
                                    fontSize: isTotalRow ? '11px' : `${marksFontSize}px`,
                                    whiteSpace: 'nowrap',
                                  }}
                                  className={`border border-black font-black text-center bg-white text-black overflow-hidden ${r.isFinalTotal ? 'font-black' : ''}`}
                                >
                                  {isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : rowGrade}
                                </td>

                                {/* Part B Activities: Rows 0-3 (Sem 1), Rows 4-7 (Sem 2), Row 8 (Final) */}
                                {isRow0 && (
                                  <>
                                    {MARATHI_URDU_CO_ACTIVITIES.map((act) => (
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
                                        {coSem1[act.key] || '-'}
                                      </td>
                                    ))}
                                  </>
                                )}
                                {isRow4 && (
                                  <>
                                    {MARATHI_URDU_CO_ACTIVITIES.map((act) => (
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
                                        {coSem2[act.key] || '-'}
                                      </td>
                                    ))}
                                  </>
                                )}
                                {isRow8 && (
                                  <>
                                    {MARATHI_URDU_CO_ACTIVITIES.map((act) => (
                                      <td
                                        key={act.key}
                                        style={{
                                          padding: `${rowPadding}px 0.5px`,
                                          fontSize: `${marksFontSize}px`,
                                          whiteSpace: 'nowrap',
                                        }}
                                        className="border border-black font-mono font-black align-middle bg-white text-black text-center overflow-hidden"
                                      >
                                        {coFinal[act.key] || '-'}
                                      </td>
                                    ))}
                                  </>
                                )}

                                {/* Result Status */}
                                {isRow0 && (
                                  <td
                                    rowSpan={9}
                                    className="border border-black font-black align-middle text-center bg-white text-black p-0 overflow-hidden"
                                    style={{ height: `${studentRowHeightCm}cm`, width: `${colWeights[25]}%`, boxSizing: 'border-box' }}
                                  >
                                    <span
                                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                      className="inline-block py-0.5 mx-auto text-[7.5px] font-black leading-none max-w-full"
                                    >
                                      {isExempted
                                        ? 'EXEMPTED'
                                        : cSt.resultStatus.includes('PASS') || cSt.resultStatus.includes('PROMOTED')
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

                {/* Signatures & Reference on Final Page */}
                {chunkIdx === chunks.length - 1 && (
                  <div
                    style={{ marginTop: '2.0cm' }}
                    className="cce-signatures-block pt-3 text-black text-xs font-bold border-t-2 border-black break-inside-avoid print:break-inside-avoid"
                  >
                    <div className="flex flex-row items-end justify-between gap-6 w-full px-2">
                      <div className="space-y-1.5 text-left text-black">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[11px] text-black">Place:</span>
                          <input
                            type="text"
                            value={placeName}
                            onChange={(e) => setPlaceName(e.target.value)}
                            className="font-bold px-1 bg-transparent w-36 text-black border-b border-black outline-none text-[11px] focus:bg-slate-100"
                            placeholder="Place Name"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[11px] text-black">Date:</span>
                          <input
                            type="text"
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                            className="font-bold px-1 bg-transparent w-32 font-mono text-black border-b border-black outline-none text-[11px] focus:bg-slate-100"
                            placeholder="DD/MM/YYYY"
                          />
                        </div>
                      </div>

                      <div className="text-center space-y-1">
                        <div className="w-56 border-b border-black pb-1 font-bold text-center text-xs">
                          <input
                            type="text"
                            value={ctName}
                            onChange={(e) => setCtName(e.target.value)}
                            className="w-full text-center bg-transparent border-none outline-none font-bold text-xs text-black focus:bg-slate-100"
                            placeholder="Class Teacher's Name"
                          />
                        </div>
                        <div className="text-[11px] font-black uppercase tracking-wider text-black">
                          Class Teacher's Name & Signature
                        </div>
                      </div>

                      <div className="text-center space-y-1">
                        <div className="w-56 border-b border-black pb-1 font-bold text-center text-xs text-black">
                          {schoolRecord?.headmasterName || 'Head Master'}
                        </div>
                        <div className="text-[11px] font-black uppercase tracking-wider text-black">
                          Head Master's Signature & Seal
                        </div>
                      </div>
                    </div>

                    <div className="w-full mt-4 border border-black p-2 text-black bg-white">
                      <div className="text-[10px] font-bold text-black mb-1">
                        <span className="uppercase tracking-wider">
                          PART-B CO-SCHOLASTIC ACTIVITIES REFERENCE:
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 text-center font-bold text-black text-[9px]">
                        {MARATHI_URDU_CO_ACTIVITIES.map((act, i) => (
                          <div key={act.key} className="border border-black p-1 bg-white">
                            <div className="font-mono font-black text-[11px]">({i + 1})</div>
                            <div className="leading-tight text-[8.5px] mt-0.5 font-bold uppercase">{act.nameEn}</div>
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
                    Page {chunkIdx + 1} / {chunks.length}
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