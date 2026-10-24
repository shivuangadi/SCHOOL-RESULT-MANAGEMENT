import React, { useState, useMemo, useEffect } from 'react';
import { SchoolRecord, formatClassStd } from '../../types';
import {
  ComputedStudentCce,
  computeSubjectGradeMatrix,
  extractLastWordOfSchoolName,
  PRIMARY_SUBJECTS,
} from '../../utils/primaryCceHelper';
import { getSavedClassTeacher, persistClassTeacherLocally } from '../../utils/teacherHelper';
import {
  Printer,
  Download,
  FileCode,
  FileSpreadsheet,
  Share2,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  printClassAbstractReport,
  exportClassAbstractPdf,
  downloadElementAsHtml,
  shareReportToWhatsApp,
  ReportPaperSize,
} from '../../utils/printPdfHelper';

interface CcePage5AllClassGradeProps {
  studentsByClass: Record<string, ComputedStudentCce[]>;
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  reportRef?: React.RefObject<HTMLDivElement | null>;
  selectedClass?: string;
}

export const CcePage5AllClassGrade: React.FC<CcePage5AllClassGradeProps> = ({
  studentsByClass,
  schoolRecord,
  academicYear,
  reportRef: externalReportRef,
  selectedClass = 'all',
}) => {
  const internalReportRef = React.useRef<HTMLDivElement | null>(null);
  const targetReportRef = externalReportRef || internalReportRef;

  // View state: 'all' (Combined 1-5 Portrait) or '1'|'2'|'3'|'4'|'5' (Individual Class Landscape)
  const [selectedView, setSelectedView] = useState<string>(() => {
    if (['1', '2', '3', '4', '5'].includes(selectedClass)) return selectedClass;
    return 'all';
  });

  // Sync when parent selectedClass prop changes
  useEffect(() => {
    if (['1', '2', '3', '4', '5'].includes(selectedClass)) {
      setSelectedView(selectedClass);
    }
  }, [selectedClass]);

  const [paperSize, setPaperSize] = useState<ReportPaperSize>('a4');
  const [showAdjustToolbar, setShowAdjustToolbar] = useState<boolean>(true);

  // Default adjustments optimized for 1 single page
  // Portrait 1-5 has 32 rows -> default 9.5px, 2px col padding, 1.5px row padding, 5mm margin
  // Landscape individual class -> default 10px, 4px col padding, 2px row padding, 6mm margin
  const isLandscape = selectedView !== 'all';
  const defaultFontSize = isLandscape ? 10 : 9.2;
  const defaultColPadding = isLandscape ? 4 : 2;
  const defaultRowPadding = isLandscape ? 2.5 : 1.5;
  const defaultPageMargin = isLandscape ? 6 : 5;

  const [fontSize, setFontSize] = useState<number>(defaultFontSize);
  const [colPadding, setColPadding] = useState<number>(defaultColPadding);
  const [rowPadding, setRowPadding] = useState<number>(defaultRowPadding);
  const [pageMargin, setPageMargin] = useState<number>(defaultPageMargin);

  // When view changes between all and single class, adjust defaults appropriately if untouched
  useEffect(() => {
    if (selectedView === 'all') {
      setFontSize(9.2);
      setColPadding(2);
      setRowPadding(1.5);
      setPageMargin(5);
    } else {
      setFontSize(10);
      setColPadding(4);
      setRowPadding(2.5);
      setPageMargin(6);
    }
  }, [selectedView]);

  const resetAdjustments = () => {
    if (selectedView === 'all') {
      setFontSize(9.2);
      setColPadding(2);
      setRowPadding(1.5);
      setPageMargin(5);
    } else {
      setFontSize(10);
      setColPadding(4);
      setRowPadding(2.5);
      setPageMargin(6);
    }
  };

  const defaultPlace = extractLastWordOfSchoolName(schoolRecord?.schoolName);
  const [placeName, setPlaceName] = useState<string>(defaultPlace);
  const [reportDate, setReportDate] = useState<string>(() => new Date().toLocaleDateString('kn-IN'));
  const diseCode = schoolRecord?.diseCode || '';
  const talukName = schoolRecord?.taluk?.trim() || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
  const schoolName = schoolRecord?.schoolName || 'ಸರಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಾಲೆ';
  const medium = schoolRecord?.schoolMedium || 'ಕನ್ನಡ';
  const clusterName = schoolRecord?.cluster || schoolRecord?.crcCluster || 'ನಿಂಗ್ಯಾನಟ್ಟಿ';

  // Active teacher name for individual class
  const activeClassForTeacher = selectedView === 'all' ? '1' : selectedView;
  const [classTeacherName, setClassTeacherName] = useState<string>(() => {
    return getSavedClassTeacher(schoolRecord, activeClassForTeacher);
  });

  useEffect(() => {
    setClassTeacherName(getSavedClassTeacher(schoolRecord, activeClassForTeacher));
  }, [schoolRecord, activeClassForTeacher]);

  // Compute matrices for classes 1 through 5
  const m1 = useMemo(() => computeSubjectGradeMatrix(studentsByClass['1'] || []), [studentsByClass]);
  const m2 = useMemo(() => computeSubjectGradeMatrix(studentsByClass['2'] || []), [studentsByClass]);
  const m3 = useMemo(() => computeSubjectGradeMatrix(studentsByClass['3'] || []), [studentsByClass]);
  const m4 = useMemo(() => computeSubjectGradeMatrix(studentsByClass['4'] || []), [studentsByClass]);
  const m5 = useMemo(() => computeSubjectGradeMatrix(studentsByClass['5'] || []), [studentsByClass]);

  // 1-3 Subtotal
  const subTotal1to3 = useMemo(() => ({
    fl: {
      boys: m1.totalRow.fl.boys + m2.totalRow.fl.boys + m3.totalRow.fl.boys,
      girls: m1.totalRow.fl.girls + m2.totalRow.fl.girls + m3.totalRow.fl.girls,
      total: m1.totalRow.fl.total + m2.totalRow.fl.total + m3.totalRow.fl.total,
    },
    sl: {
      boys: m1.totalRow.sl.boys + m2.totalRow.sl.boys + m3.totalRow.sl.boys,
      girls: m1.totalRow.sl.girls + m2.totalRow.sl.girls + m3.totalRow.sl.girls,
      total: m1.totalRow.sl.total + m2.totalRow.sl.total + m3.totalRow.sl.total,
    },
    maths: {
      boys: m1.totalRow.maths.boys + m2.totalRow.maths.boys + m3.totalRow.maths.boys,
      girls: m1.totalRow.maths.girls + m2.totalRow.maths.girls + m3.totalRow.maths.girls,
      total: m1.totalRow.maths.total + m2.totalRow.maths.total + m3.totalRow.maths.total,
    },
    evs: {
      boys: m1.totalRow.evs.boys + m2.totalRow.evs.boys + m3.totalRow.evs.boys,
      girls: m1.totalRow.evs.girls + m2.totalRow.evs.girls + m3.totalRow.evs.girls,
      total: m1.totalRow.evs.total + m2.totalRow.evs.total + m3.totalRow.evs.total,
    },
  }), [m1, m2, m3]);

  // 1-5 Grand Total
  const grandTotal1to5 = useMemo(() => ({
    fl: {
      boys: subTotal1to3.fl.boys + m4.totalRow.fl.boys + m5.totalRow.fl.boys,
      girls: subTotal1to3.fl.girls + m4.totalRow.fl.girls + m5.totalRow.fl.girls,
      total: subTotal1to3.fl.total + m4.totalRow.fl.total + m5.totalRow.fl.total,
    },
    sl: {
      boys: subTotal1to3.sl.boys + m4.totalRow.sl.boys + m5.totalRow.sl.boys,
      girls: subTotal1to3.sl.girls + m4.totalRow.sl.girls + m5.totalRow.sl.girls,
      total: subTotal1to3.sl.total + m4.totalRow.sl.total + m5.totalRow.sl.total,
    },
    maths: {
      boys: subTotal1to3.maths.boys + m4.totalRow.maths.boys + m5.totalRow.maths.boys,
      girls: subTotal1to3.maths.girls + m4.totalRow.maths.girls + m5.totalRow.maths.girls,
      total: subTotal1to3.maths.total + m4.totalRow.maths.total + m5.totalRow.maths.total,
    },
    evs: {
      boys: subTotal1to3.evs.boys + m4.totalRow.evs.boys + m5.totalRow.evs.boys,
      girls: subTotal1to3.evs.girls + m4.totalRow.evs.girls + m5.totalRow.evs.girls,
      total: subTotal1to3.evs.total + m4.totalRow.evs.total + m5.totalRow.evs.total,
    },
  }), [subTotal1to3, m4, m5]);

  // Current single class computed list & matrix
  const currentClassStudents = useMemo(() => {
    if (selectedView === 'all') return [];
    return studentsByClass[selectedView] || [];
  }, [studentsByClass, selectedView]);

  const currentClassMatrix = useMemo(() => {
    if (selectedView === '1') return m1;
    if (selectedView === '2') return m2;
    if (selectedView === '3') return m3;
    if (selectedView === '4') return m4;
    if (selectedView === '5') return m5;
    return m1;
  }, [selectedView, m1, m2, m3, m4, m5]);

  // Export handlers
  const handlePrint = async () => {
    if (!targetReportRef.current) return;
    const title = selectedView === 'all'
      ? `Report_4_Grade_Abstract_1_to_5_${academicYear}_PORTRAIT`
      : `Report_4_Class_${selectedView}_Grade_Abstract_${academicYear}_LANDSCAPE`;
    const orientation = selectedView === 'all' ? 'portrait' : 'landscape';
    await printClassAbstractReport(targetReportRef.current, title, paperSize, orientation as any);
  };

  const handleDownloadPdf = async () => {
    if (!targetReportRef.current) return;
    const filename = selectedView === 'all'
      ? `Report_4_Grade_Abstract_1_to_5_${academicYear}_PORTRAIT.pdf`
      : `Report_4_Class_${selectedView}_Grade_Abstract_${academicYear}_LANDSCAPE.pdf`;
    const orientation = selectedView === 'all' ? 'portrait' : 'landscape';
    await exportClassAbstractPdf(targetReportRef.current, filename, paperSize, orientation as any);
  };

  const handleDownloadHtml = () => {
    if (!targetReportRef.current) return;
    const filename = selectedView === 'all'
      ? `Report_4_Grade_Abstract_1_to_5_${academicYear}.html`
      : `Report_4_Class_${selectedView}_Grade_Abstract_${academicYear}.html`;
    downloadElementAsHtml(targetReportRef.current, filename, paperSize);
  };

  const handleExportExcel = () => {
    if (!targetReportRef.current) return;
    const wb = XLSX.utils.book_new();
    const wsData: any[][] = [];

    wsData.push([`REPORT-4 GRADE ABSTRACT 1-5 - ${schoolName}`]);
    wsData.push([`Academic Year: ${academicYear}`, `DISE Code: ${diseCode}`, `Taluk: ${talukName}`]);
    wsData.push([]);

    if (selectedView === 'all') {
      wsData.push(['Class', 'Grade', 'FL Boys', 'FL Girls', 'FL Total', 'SL Boys', 'SL Girls', 'SL Total', 'Maths Boys', 'Maths Girls', 'Maths Total', 'EVS Boys', 'EVS Girls', 'EVS Total']);
      const addBlock = (lbl: string, mat: typeof m1) => {
        mat.rows.forEach((r, idx) => {
          wsData.push([idx === 0 ? lbl : '', r.grade, r.fl.boys, r.fl.girls, r.fl.total, r.sl.boys, r.sl.girls, r.sl.total, r.maths.boys, r.maths.girls, r.maths.total, r.evs.boys, r.evs.girls, r.evs.total]);
        });
        wsData.push([`${lbl} Total`, 'TOTAL', mat.totalRow.fl.boys, mat.totalRow.fl.girls, mat.totalRow.fl.total, mat.totalRow.sl.boys, mat.totalRow.sl.girls, mat.totalRow.sl.total, mat.totalRow.maths.boys, mat.totalRow.maths.girls, mat.totalRow.maths.total, mat.totalRow.evs.boys, mat.totalRow.evs.girls, mat.totalRow.evs.total]);
      };
      addBlock('Class 1', m1);
      addBlock('Class 2', m2);
      addBlock('Class 3', m3);
      wsData.push(['1-3 Subtotal', 'TOTAL', subTotal1to3.fl.boys, subTotal1to3.fl.girls, subTotal1to3.fl.total, subTotal1to3.sl.boys, subTotal1to3.sl.girls, subTotal1to3.sl.total, subTotal1to3.maths.boys, subTotal1to3.maths.girls, subTotal1to3.maths.total, subTotal1to3.evs.boys, subTotal1to3.evs.girls, subTotal1to3.evs.total]);
      addBlock('Class 4', m4);
      addBlock('Class 5', m5);
      wsData.push(['1-5 Grand Total', 'GRAND TOTAL', grandTotal1to5.fl.boys, grandTotal1to5.fl.girls, grandTotal1to5.fl.total, grandTotal1to5.sl.boys, grandTotal1to5.sl.girls, grandTotal1to5.sl.total, grandTotal1to5.maths.boys, grandTotal1to5.maths.girls, grandTotal1to5.maths.total, grandTotal1to5.evs.boys, grandTotal1to5.evs.girls, grandTotal1to5.evs.total]);
    } else {
      wsData.push([`Class ${selectedView} Abstract`]);
      wsData.push(['Grade', 'FL Boys', 'FL Girls', 'FL Total', 'SL Boys', 'SL Girls', 'SL Total', 'Maths Boys', 'Maths Girls', 'Maths Total', 'EVS Boys', 'EVS Girls', 'EVS Total']);
      currentClassMatrix.rows.forEach((r) => {
        wsData.push([r.grade, r.fl.boys, r.fl.girls, r.fl.total, r.sl.boys, r.sl.girls, r.sl.total, r.maths.boys, r.maths.girls, r.maths.total, r.evs.boys, r.evs.girls, r.evs.total]);
      });
      wsData.push(['TOTAL', currentClassMatrix.totalRow.fl.boys, currentClassMatrix.totalRow.fl.girls, currentClassMatrix.totalRow.fl.total, currentClassMatrix.totalRow.sl.boys, currentClassMatrix.totalRow.sl.girls, currentClassMatrix.totalRow.sl.total, currentClassMatrix.totalRow.maths.boys, currentClassMatrix.totalRow.maths.girls, currentClassMatrix.totalRow.maths.total, currentClassMatrix.totalRow.evs.boys, currentClassMatrix.totalRow.evs.girls, currentClassMatrix.totalRow.evs.total]);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Grade_Abstract');
    XLSX.writeFile(wb, `Report_4_Grade_Abstract_${selectedView}_${academicYear}.xlsx`);
  };

  const handleShareWhatsApp = async () => {
    if (!targetReportRef.current) return;
    const caption = `*${schoolName}*\n*Report-4 Grade Abstract ${selectedView === 'all' ? '1-5 (Combined)' : `Class ${selectedView}`}*\nAcademic Year: ${academicYear}\nHM: ${schoolRecord?.headmasterName || 'Headmaster'}`;
    await shareReportToWhatsApp(targetReportRef.current, caption, schoolRecord?.mobile);
  };

  const renderVal = (v: number) => (v > 0 ? v : '-');

  // Render a block of 6 rows for All Classes 1-5 portrait table
  const renderAllClassesBlock = (label: string, matrix: typeof m1) => (
    <React.Fragment key={label}>
      {matrix.rows.map((r, rIdx) => (
        <tr
          key={`${label}_${r.grade}`}
          className="border-b border-black text-black"
          style={{ height: 'auto' }}
        >
          {rIdx === 0 && (
            <td
              rowSpan={6}
              className="border border-black font-black text-center align-middle text-black bg-white"
              style={{
                padding: `${rowPadding}px ${colPadding}px`,
                fontSize: `${fontSize * 1.05}px`,
                width: '68px',
              }}
            >
              {label}
            </td>
          )}
          <td
            className="border border-black font-bold font-mono text-center text-black bg-white"
            style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px`, width: '38px' }}
          >
            {r.grade}
          </td>
          {/* FL */}
          <td className="border border-black font-mono text-center text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(r.fl.boys)}</td>
          <td className="border border-black font-mono text-center text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(r.fl.girls)}</td>
          <td className="border border-black font-mono font-bold text-center text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(r.fl.total)}</td>
          {/* SL */}
          <td className="border border-black font-mono text-center text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(r.sl.boys)}</td>
          <td className="border border-black font-mono text-center text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(r.sl.girls)}</td>
          <td className="border border-black font-mono font-bold text-center text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(r.sl.total)}</td>
          {/* MATHS */}
          <td className="border border-black font-mono text-center text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(r.maths.boys)}</td>
          <td className="border border-black font-mono text-center text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(r.maths.girls)}</td>
          <td className="border border-black font-mono font-bold text-center text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(r.maths.total)}</td>
          {/* EVS */}
          <td className="border border-black font-mono text-center text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(r.evs.boys)}</td>
          <td className="border border-black font-mono text-center text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(r.evs.girls)}</td>
          <td className="border border-black font-mono font-bold text-center text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(r.evs.total)}</td>
        </tr>
      ))}
      {/* Class Total Row */}
      <tr className="border-b-2 border-black font-black text-black bg-white">
        <td
          className="border border-black text-center font-black text-black bg-white uppercase"
          style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize * 0.95}px` }}
        >
          ಒಟ್ಟು
        </td>
        <td className="border border-black font-mono text-center text-black bg-white font-bold" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(matrix.totalRow.fl.boys)}</td>
        <td className="border border-black font-mono text-center text-black bg-white font-bold" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(matrix.totalRow.fl.girls)}</td>
        <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(matrix.totalRow.fl.total)}</td>

        <td className="border border-black font-mono text-center text-black bg-white font-bold" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(matrix.totalRow.sl.boys)}</td>
        <td className="border border-black font-mono text-center text-black bg-white font-bold" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(matrix.totalRow.sl.girls)}</td>
        <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(matrix.totalRow.sl.total)}</td>

        <td className="border border-black font-mono text-center text-black bg-white font-bold" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(matrix.totalRow.maths.boys)}</td>
        <td className="border border-black font-mono text-center text-black bg-white font-bold" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(matrix.totalRow.maths.girls)}</td>
        <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(matrix.totalRow.maths.total)}</td>

        <td className="border border-black font-mono text-center text-black bg-white font-bold" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(matrix.totalRow.evs.boys)}</td>
        <td className="border border-black font-mono text-center text-black bg-white font-bold" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(matrix.totalRow.evs.girls)}</td>
        <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(matrix.totalRow.evs.total)}</td>
      </tr>
    </React.Fragment>
  );

  return (
    <div className="w-full space-y-3 font-sans">
      {/* Inline dynamic style tag to strictly enforce portrait vs landscape single-page printing */}
      <style>{`
        @media print {
          @page {
            size: ${paperSize === 'a4' ? 'A4' : 'legal'} ${selectedView === 'all' ? 'portrait' : 'landscape'};
            margin: 5mm 2mm 5mm 0mm !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #cce-report-4-abstract {
            border: 4px double #000000 !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          #cce-report-4-abstract,
          #cce-report-4-abstract * {
            background-color: #ffffff !important;
            background-image: none !important;
            color: #000000 !important;
            border-color: #000000 !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          .no-print,
          .print\\:hidden {
            display: none !important;
          }
          .cce-single-page-sheet {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* ========================================================
          1. ADJUSTMENT & CONTROLS TOOLBAR (PRINT: HIDDEN)
          ======================================================== */}
      <div className="no-print print:hidden bg-white border border-slate-300 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* View Dropdown: Combined 1-5 Portrait OR Individual Class Landscape */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>ಘೋಷವಾರ ಆಯ್ಕೆ (Report View):</span>
            </span>
            <select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
              className="bg-slate-50 border-2 border-indigo-700 font-black text-xs text-indigo-950 px-3 py-1.5 rounded-xl focus:outline-none cursor-pointer shadow-xs"
            >
              <option value="all">೧-೫ ಎಲ್ಲಾ ತರಗತಿ ಒಟ್ಟು ಘೋಷವಾರ (All Classes 1-5 Combined) - Portrait (ಭಾವಚಿತ್ರ)</option>
              <option value="1">೧ನೇ ತರಗತಿ ಪ್ರತ್ಯೇಕ ಘೋಷವಾರ (Class 1st Abstract) - Landscape</option>
              <option value="2">೨ನೇ ತರಗತಿ ಪ್ರತ್ಯೇಕ ಘೋಷವಾರ (Class 2nd Abstract) - Landscape</option>
              <option value="3">೩ನೇ ತರಗತಿ ಪ್ರತ್ಯೇಕ ಘೋಷವಾರ (Class 3rd Abstract) - Landscape</option>
              <option value="4">೪ನೇ ತರಗತಿ ಪ್ರತ್ಯೇಕ ಘೋಷವಾರ (Class 4th Abstract) - Landscape</option>
              <option value="5">೫ನೇ ತರಗತಿ ಪ್ರತ್ಯೇಕ ಘೋಷವಾರ (Class 5th Abstract) - Landscape</option>
            </select>

            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
              {selectedView === 'all' ? '📄 Portrait Mode (1 Single Page)' : `📐 Landscape Mode (${formatClassStd(selectedView)} - 1 Single Page)`}
            </span>
          </div>

          {/* Paper Size selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-300 text-xs">
            <span className="font-bold text-slate-700 px-1.5 text-[11px]">ಕಾಗದ ಸೈಜ್:</span>
            <button
              type="button"
              onClick={() => setPaperSize('a4')}
              className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer text-xs ${
                paperSize === 'a4' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              A4
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('legal')}
              className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer text-xs ${
                paperSize === 'legal' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              Legal
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title={`Print in 1 Single Page (${selectedView === 'all' ? 'Portrait' : 'Landscape'})`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ಮುದ್ರಿಸಿ ({selectedView === 'all' ? 'Portrait' : 'Landscape'})</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Download Single Page PDF in Pure Black & White"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
              title="Download Standalone HTML"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>HTML</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-1 transition cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-black flex items-center gap-1 transition cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAdjustToolbar((p) => !p)}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Toggle Size Adjustments"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time size, column width, and margin adjusters */}
        {showAdjustToolbar && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              {/* Text Font Size */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700">ಅಕ್ಷರ ಸೈಜ್ (Font):</span>
                <button
                  type="button"
                  onClick={() => setFontSize((p) => Math.max(7.5, Math.round((p - 0.5) * 10) / 10))}
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 font-black cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono font-bold w-12 text-center text-blue-900 bg-white px-1 py-0.5 border border-slate-300 rounded">
                  {fontSize}px
                </span>
                <button
                  type="button"
                  onClick={() => setFontSize((p) => Math.min(14, Math.round((p + 0.5) * 10) / 10))}
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 font-black cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Column Padding / Width */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700">ಅಂಕಣ ಅಗಲ (Col Size):</span>
                <button
                  type="button"
                  onClick={() => setColPadding((p) => Math.max(1, p - 0.5))}
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 font-black cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono font-bold w-10 text-center text-blue-900 bg-white px-1 py-0.5 border border-slate-300 rounded">
                  {colPadding}px
                </span>
                <button
                  type="button"
                  onClick={() => setColPadding((p) => Math.min(10, p + 0.5))}
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 font-black cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Row Height / Padding */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700">ಸಾಲು ಎತ್ತರ (Row Height):</span>
                <button
                  type="button"
                  onClick={() => setRowPadding((p) => Math.max(1, Math.round((p - 0.5) * 10) / 10))}
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 font-black cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono font-bold w-10 text-center text-blue-900 bg-white px-1 py-0.5 border border-slate-300 rounded">
                  {rowPadding}px
                </span>
                <button
                  type="button"
                  onClick={() => setRowPadding((p) => Math.min(6, Math.round((p + 0.5) * 10) / 10))}
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 font-black cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Page Margin */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700">ಮಾರ್ಜಿನ್ (Margin):</span>
                <button
                  type="button"
                  onClick={() => setPageMargin((p) => Math.max(2, p - 1))}
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 font-black cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono font-bold w-12 text-center text-blue-900 bg-white px-1 py-0.5 border border-slate-300 rounded">
                  {pageMargin}mm
                </span>
                <button
                  type="button"
                  onClick={() => setPageMargin((p) => Math.min(18, p + 1))}
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 font-black cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={resetAdjustments}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sizes</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          2. PRINTABLE REPORT CONTAINER: PURE BLACK & WHITE, NO BG
          ======================================================== */}
      <div
        id="cce-report-4-abstract"
        ref={targetReportRef}
        style={{
          paddingTop: `${pageMargin}mm`,
          paddingBottom: `${pageMargin}mm`,
          paddingLeft: selectedView === 'all' ? `${pageMargin}mm` : '2cm',
          paddingRight: selectedView === 'all' ? `${pageMargin}mm` : '1cm',
          backgroundColor: '#ffffff',
          color: '#000000',
          border: '4px double #000000',
        }}
        className={`cce-single-page-sheet bg-white text-black shadow-md mx-auto transition-all ${
          selectedView === 'all'
            ? 'portrait-page legal-portrait max-w-[850px]'
            : 'landscape-page max-w-[1250px]'
        }`}
      >
        {/* ========================================================
            CASE A: ALL CLASSES 1-5 COMBINED (PORTRAIT - 1 SINGLE PAGE)
            ======================================================== */}
        {selectedView === 'all' ? (
          <div className="space-y-1.5 text-black bg-white">
            {/* Header: Pure Black & White, No BG */}
            <div className="text-center space-y-0.5 border-b-2 border-black pb-1.5">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ {talukName}
              </h3>
              <h1 className="text-sm font-black text-black uppercase">
                {schoolName} {diseCode ? `• DISE: ${diseCode}` : ''}
              </h1>
              <div className="flex items-center justify-between px-2 pt-0.5 text-[10px] font-bold text-black">
                <span>ಮಾಧ್ಯಮ: {medium}</span>
                <span className="border border-black px-2 py-0.2 uppercase font-black">
                  Report-4 Grade Abbstract 1-5 (ವಾರ್ಷಿಕ ಕ್ರೋಢೀಕೃತ ಘೋಷವಾರ 1-5)
                </span>
                <span>ಶೈಕ್ಷಣಿಕ ವರ್ಷ: {academicYear}</span>
              </div>
            </div>

            {/* Matrix Table: Exactly 32 rows, ultra-tight line height to fit 1 page */}
            <div className="overflow-x-auto">
              <table
                className="w-full text-center border-collapse border-2 border-black bg-white text-black"
                style={{ fontSize: `${fontSize}px`, lineHeight: 1.15 }}
              >
                <thead>
                  <tr className="border-b-2 border-black font-black text-black bg-white">
                    <th
                      rowSpan={2}
                      className="border border-black font-black text-black bg-white align-middle"
                      style={{ padding: `${rowPadding}px ${colPadding}px`, width: '68px' }}
                    >
                      ತರಗತಿ
                    </th>
                    <th
                      rowSpan={2}
                      className="border border-black font-black text-black bg-white align-middle"
                      style={{ padding: `${rowPadding}px ${colPadding}px`, width: '38px' }}
                    >
                      ಶ್ರೇಣಿ
                    </th>
                    <th
                      colSpan={3}
                      className="border border-black font-black text-black bg-white"
                      style={{ padding: `${rowPadding}px ${colPadding}px` }}
                    >
                      ಪ್ರಥಮ ಭಾಷೆ (FL)
                    </th>
                    <th
                      colSpan={3}
                      className="border border-black font-black text-black bg-white"
                      style={{ padding: `${rowPadding}px ${colPadding}px` }}
                    >
                      ದ್ವಿತೀಯ ಭಾಷೆ (SL)
                    </th>
                    <th
                      colSpan={3}
                      className="border border-black font-black text-black bg-white"
                      style={{ padding: `${rowPadding}px ${colPadding}px` }}
                    >
                      ಗಣಿತ (MATHS)
                    </th>
                    <th
                      colSpan={3}
                      className="border border-black font-black text-black bg-white"
                      style={{ padding: `${rowPadding}px ${colPadding}px` }}
                    >
                      ಪರಿಸರ ಅಧ್ಯಯನ (EVS)
                    </th>
                  </tr>
                  <tr className="border-b-2 border-black font-bold text-black bg-white">
                    <th className="border border-black font-bold text-black bg-white" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px`, width: '32px' }}>ಗಂ</th>
                    <th className="border border-black font-bold text-black bg-white" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px`, width: '32px' }}>ಹೆ</th>
                    <th className="border border-black font-black text-black bg-white" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px`, width: '36px' }}>ಒಟ್ಟು</th>

                    <th className="border border-black font-bold text-black bg-white" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px`, width: '32px' }}>ಗಂ</th>
                    <th className="border border-black font-bold text-black bg-white" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px`, width: '32px' }}>ಹೆ</th>
                    <th className="border border-black font-black text-black bg-white" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px`, width: '36px' }}>ಒಟ್ಟು</th>

                    <th className="border border-black font-bold text-black bg-white" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px`, width: '32px' }}>ಗಂ</th>
                    <th className="border border-black font-bold text-black bg-white" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px`, width: '32px' }}>ಹೆ</th>
                    <th className="border border-black font-black text-black bg-white" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px`, width: '36px' }}>ಒಟ್ಟು</th>

                    <th className="border border-black font-bold text-black bg-white" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px`, width: '32px' }}>ಗಂ</th>
                    <th className="border border-black font-bold text-black bg-white" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px`, width: '32px' }}>ಹೆ</th>
                    <th className="border border-black font-black text-black bg-white" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px`, width: '36px' }}>ಒಟ್ಟು</th>
                  </tr>
                </thead>
                <tbody>
                  {renderAllClassesBlock('೧ನೇ ತರಗತಿ', m1)}
                  {renderAllClassesBlock('೨ನೇ ತರಗತಿ', m2)}
                  {renderAllClassesBlock('೩ನೇ ತರಗತಿ', m3)}

                  {/* 1-3 Subtotal */}
                  <tr className="border-y-2 border-black font-black text-black bg-white">
                    <td
                      colSpan={2}
                      className="border border-black text-center font-black text-black bg-white uppercase"
                      style={{ padding: `${rowPadding * 1.1}px ${colPadding}px`, fontSize: `${fontSize * 0.95}px` }}
                    >
                      ೧ ರಿಂದ ೩ನೇ ಒಟ್ಟು
                    </td>
                    <td className="border border-black font-mono text-center text-black bg-white font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(subTotal1to3.fl.boys)}</td>
                    <td className="border border-black font-mono text-center text-black bg-white font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(subTotal1to3.fl.girls)}</td>
                    <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(subTotal1to3.fl.total)}</td>

                    <td className="border border-black font-mono text-center text-black bg-white font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(subTotal1to3.sl.boys)}</td>
                    <td className="border border-black font-mono text-center text-black bg-white font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(subTotal1to3.sl.girls)}</td>
                    <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(subTotal1to3.sl.total)}</td>

                    <td className="border border-black font-mono text-center text-black bg-white font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(subTotal1to3.maths.boys)}</td>
                    <td className="border border-black font-mono text-center text-black bg-white font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(subTotal1to3.maths.girls)}</td>
                    <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(subTotal1to3.maths.total)}</td>

                    <td className="border border-black font-mono text-center text-black bg-white font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(subTotal1to3.evs.boys)}</td>
                    <td className="border border-black font-mono text-center text-black bg-white font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(subTotal1to3.evs.girls)}</td>
                    <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(subTotal1to3.evs.total)}</td>
                  </tr>

                  {renderAllClassesBlock('೪ನೇ ತರಗತಿ', m4)}
                  {renderAllClassesBlock('೫ನೇ ತರಗತಿ', m5)}

                  {/* 1-5 Grand Total */}
                  <tr className="border-t-2 border-black font-black text-black bg-white">
                    <td
                      colSpan={2}
                      className="border border-black text-center font-black text-black bg-white uppercase"
                      style={{ padding: `${rowPadding * 1.3}px ${colPadding}px`, fontSize: `${fontSize * 1.05}px` }}
                    >
                      ೧ ರಿಂದ ೫ನೇ ಮಹಾ ಒಟ್ಟು
                    </td>
                    <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(grandTotal1to5.fl.boys)}</td>
                    <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(grandTotal1to5.fl.girls)}</td>
                    <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize * 1.05}px` }}>{renderVal(grandTotal1to5.fl.total)}</td>

                    <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(grandTotal1to5.sl.boys)}</td>
                    <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(grandTotal1to5.sl.girls)}</td>
                    <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize * 1.05}px` }}>{renderVal(grandTotal1to5.sl.total)}</td>

                    <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(grandTotal1to5.maths.boys)}</td>
                    <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(grandTotal1to5.maths.girls)}</td>
                    <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize * 1.05}px` }}>{renderVal(grandTotal1to5.maths.total)}</td>

                    <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(grandTotal1to5.evs.boys)}</td>
                    <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize}px` }}>{renderVal(grandTotal1to5.evs.girls)}</td>
                    <td className="border border-black font-mono text-center text-black bg-white font-black" style={{ padding: `${rowPadding}px ${colPadding}px`, fontSize: `${fontSize * 1.05}px` }}>{renderVal(grandTotal1to5.evs.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Signatures for 1-5 Abstract Page (Case A: When all classes selected):
                Left side: ಮುಖ್ಯ ಗುರುಗಳ ಸಹಿ (HM Sign)
                Middle: "ಸಮೂಹ ಸಂಪನ್ಮೂಲ ವ್ಯಕ್ತಿಗಳ-(CRP) ಸಹಿ"
                Right side: ಶಿಕ್ಷಣ ಸಂಯೋಜಕರ ಸಹಿ(ECO Sign) */}
            <div className="pt-2 text-[10px] font-bold text-black border-t border-black space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1">
                  <span>ಸ್ಥಳ:</span>
                  <input
                    type="text"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    className="border-b border-black font-bold px-1 bg-transparent w-24 text-black focus:outline-none"
                    placeholder="ಸ್ಥಳ"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span>ದಿನಾಂಕ:</span>
                  <input
                    type="text"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="border-b border-black font-bold px-1 bg-transparent w-24 text-black focus:outline-none"
                    placeholder="ದಿನಾಂಕ"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 px-1 text-[10.5px]">
                <div className="text-left font-black">
                  <span>ಮುಖ್ಯ ಗುರುಗಳ ಸಹಿ (HM Sign)</span>
                </div>
                <div className="text-center font-black">
                  <span>ಸಮೂಹ ಸಂಪನ್ಮೂಲ ವ್ಯಕ್ತಿಗಳ-(CRP) ಸಹಿ</span>
                </div>
                <div className="text-right font-black">
                  <span>ಶಿಕ್ಷಣ ಸಂಯೋಜಕರ ಸಹಿ(ECO Sign)</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
              CASE B: INDIVIDUAL CLASS ABSTRACT (LANDSCAPE - 1 SINGLE PAGE)
              ======================================================== */
          <div className="space-y-2 text-black bg-white">
            {/* Header: Pure Black & White */}
            <div className="text-center space-y-0.5 border-b-2 border-black pb-1.5">
              <h3
                style={{ fontSize: '20px', lineHeight: '39.6667px' }}
                className="font-bold text-black uppercase tracking-wider"
              >
                ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ {talukName}
              </h3>
              <h1
                style={{ fontSize: '17px', lineHeight: '31px' }}
                className="font-black text-black uppercase"
              >
                {schoolName} {diseCode ? `• DISE CODE: ${diseCode}` : ''}
              </h1>
              <div className="flex items-center justify-between px-2 pt-0.5 text-xs font-bold text-black">
                <span>ಮಾಧ್ಯಮ: {medium}</span>
                <span className="border border-black px-2 py-0.5 uppercase font-black text-[11px]">
                  {selectedView}ನೇ ತರಗತಿ ವಾರ್ಷಿಕ ವಿಷಯವಾರು ಹಾಗೂ ಶ್ರೇಣಿವಾರು ಘೋಷವಾರೆ
                </span>
                <span>ಶೈಕ್ಷಣಿಕ ವರ್ಷ: {academicYear}</span>
              </div>
            </div>

            {/* Grid with 2 Columns or Stacked Tables for Landscape Fit */}
            <div className="space-y-2">
              {/* Table 1: Subject-Wise & Grade-Wise Analysis for this single class */}
              <div>
                {/* Details above table: Class, Class Teacher's Name, Cluster Name */}
                <div className="flex items-center justify-between px-3 py-1.5 text-xs font-bold text-black border border-black bg-white mb-2">
                  <div>
                    <span>ತರಗತಿ (Class): </span>
                    <span className="font-black text-sm">{selectedView}ನೇ ತರಗತಿ ({formatClassStd(selectedView)})</span>
                  </div>
                  <div>
                    <span>ವರ್ಗ ಶಿಕ್ಷಕರ ಹೆಸರು (Class Teacher's Name): </span>
                    <span className="font-black text-sm underline">{classTeacherName || 'Class Teacher'}</span>
                  </div>
                  <div>
                    <span>ಕ್ಲಸ್ಟರ್ ಹೆಸರು (Cluster Name): </span>
                    <span className="font-black text-sm">{clusterName || 'ನಿಂಗ್ಯಾನಟ್ಟಿ'}</span>
                  </div>
                </div>
                <table
                  className="w-full text-center border-collapse border border-black bg-white text-black"
                  style={{ fontSize: `${fontSize}px`, lineHeight: 1.2 }}
                >
                  <thead>
                    <tr className="border-b-2 border-black font-black text-black bg-white">
                      <th rowSpan={2} className="border border-black font-black text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px`, width: '55px' }}>ಶ್ರೇಣಿ</th>
                      <th colSpan={3} className="border border-black font-black text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px` }}>ಪ್ರಥಮ ಭಾಷೆ (FL)</th>
                      <th colSpan={3} className="border border-black font-black text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px` }}>ದ್ವಿತೀಯ ಭಾಷೆ (SL)</th>
                      <th colSpan={3} className="border border-black font-black text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px` }}>ಗಣಿತ (MATHS)</th>
                      <th colSpan={3} className="border border-black font-black text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px` }}>ಪರಿಸರ ಅಧ್ಯಯನ (EVS)</th>
                      <th colSpan={3} className="border border-black font-black text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px` }}>ಒಟ್ಟಾರೆ ಫಲಿತಾಂಶ (Overall)</th>
                    </tr>
                    <tr className="border-b-2 border-black font-bold text-black bg-white">
                      <th className="border border-black font-bold text-black" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px` }}>ಗಂ</th>
                      <th className="border border-black font-bold text-black" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px` }}>ಹೆ</th>
                      <th className="border border-black font-black text-black" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px` }}>ಒಟ್ಟು</th>

                      <th className="border border-black font-bold text-black" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px` }}>ಗಂ</th>
                      <th className="border border-black font-bold text-black" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px` }}>ಹೆ</th>
                      <th className="border border-black font-black text-black" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px` }}>ಒಟ್ಟು</th>

                      <th className="border border-black font-bold text-black" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px` }}>ಗಂ</th>
                      <th className="border border-black font-bold text-black" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px` }}>ಹೆ</th>
                      <th className="border border-black font-black text-black" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px` }}>ಒಟ್ಟು</th>

                      <th className="border border-black font-bold text-black" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px` }}>ಗಂ</th>
                      <th className="border border-black font-bold text-black" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px` }}>ಹೆ</th>
                      <th className="border border-black font-black text-black" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px` }}>ಒಟ್ಟು</th>

                      <th className="border border-black font-bold text-black" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px` }}>ಗಂ</th>
                      <th className="border border-black font-bold text-black" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px` }}>ಹೆ</th>
                      <th className="border border-black font-black text-black" style={{ padding: `${rowPadding * 0.7}px ${colPadding}px` }}>ಒಟ್ಟು</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentClassMatrix.rows.map((r) => {
                      const overallBoys = Math.round((r.fl.boys + r.sl.boys + r.maths.boys + r.evs.boys) / 4);
                      const overallGirls = Math.round((r.fl.girls + r.sl.girls + r.maths.girls + r.evs.girls) / 4);
                      const overallTotal = overallBoys + overallGirls;

                      return (
                        <tr key={r.grade} className="border-b border-black text-black bg-white">
                          <td className="border border-black font-black text-center text-black bg-white" style={{ padding: `${rowPadding}px ${colPadding}px` }}>
                            {r.grade}
                          </td>
                          <td className="border border-black font-mono text-center text-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(r.fl.boys)}</td>
                          <td className="border border-black font-mono text-center text-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(r.fl.girls)}</td>
                          <td className="border border-black font-mono font-bold text-center text-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(r.fl.total)}</td>

                          <td className="border border-black font-mono text-center text-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(r.sl.boys)}</td>
                          <td className="border border-black font-mono text-center text-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(r.sl.girls)}</td>
                          <td className="border border-black font-mono font-bold text-center text-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(r.sl.total)}</td>

                          <td className="border border-black font-mono text-center text-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(r.maths.boys)}</td>
                          <td className="border border-black font-mono text-center text-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(r.maths.girls)}</td>
                          <td className="border border-black font-mono font-bold text-center text-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(r.maths.total)}</td>

                          <td className="border border-black font-mono text-center text-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(r.evs.boys)}</td>
                          <td className="border border-black font-mono text-center text-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(r.evs.girls)}</td>
                          <td className="border border-black font-mono font-bold text-center text-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(r.evs.total)}</td>

                          <td className="border border-black font-mono text-center text-black font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(overallBoys)}</td>
                          <td className="border border-black font-mono text-center text-black font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(overallGirls)}</td>
                          <td className="border border-black font-mono text-center text-black font-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(overallTotal)}</td>
                        </tr>
                      );
                    })}

                    {/* Class Total Row */}
                    <tr className="border-t-2 border-black font-black text-black bg-white">
                      <td className="border border-black text-center font-black text-black uppercase" style={{ padding: `${rowPadding}px ${colPadding}px` }}>
                        ಒಟ್ಟು
                      </td>
                      <td className="border border-black font-mono text-center text-black font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(currentClassMatrix.totalRow.fl.boys)}</td>
                      <td className="border border-black font-mono text-center text-black font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(currentClassMatrix.totalRow.fl.girls)}</td>
                      <td className="border border-black font-mono text-center text-black font-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(currentClassMatrix.totalRow.fl.total)}</td>

                      <td className="border border-black font-mono text-center text-black font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(currentClassMatrix.totalRow.sl.boys)}</td>
                      <td className="border border-black font-mono text-center text-black font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(currentClassMatrix.totalRow.sl.girls)}</td>
                      <td className="border border-black font-mono text-center text-black font-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(currentClassMatrix.totalRow.sl.total)}</td>

                      <td className="border border-black font-mono text-center text-black font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(currentClassMatrix.totalRow.maths.boys)}</td>
                      <td className="border border-black font-mono text-center text-black font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(currentClassMatrix.totalRow.maths.girls)}</td>
                      <td className="border border-black font-mono text-center text-black font-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(currentClassMatrix.totalRow.maths.total)}</td>

                      <td className="border border-black font-mono text-center text-black font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(currentClassMatrix.totalRow.evs.boys)}</td>
                      <td className="border border-black font-mono text-center text-black font-bold" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(currentClassMatrix.totalRow.evs.girls)}</td>
                      <td className="border border-black font-mono text-center text-black font-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>{renderVal(currentClassMatrix.totalRow.evs.total)}</td>

                      {/* Total Enrolled */}
                      <td className="border border-black font-mono text-center text-black font-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>
                        {currentClassStudents.filter((s) => s.student.gender !== 'Girl').length}
                      </td>
                      <td className="border border-black font-mono text-center text-black font-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>
                        {currentClassStudents.filter((s) => s.student.gender === 'Girl').length}
                      </td>
                      <td className="border border-black font-mono text-center text-black font-black" style={{ padding: `${rowPadding}px ${colPadding}px` }}>
                        {currentClassStudents.length}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            {/* Bottom Signatures for Single Class: Landscape (3cm below table, vertically & horizontally center aligned) */}
            <div
              style={{ marginTop: '3cm' }}
              className="flex items-center justify-around text-center text-xs font-bold text-black border-t border-black pt-4 w-full"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span>ಸ್ಥಳ:</span>
                <input
                  type="text"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  className="border-b border-black font-bold px-1 bg-transparent w-28 text-black text-center focus:outline-none"
                  placeholder="ಸ್ಥಳ"
                />
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span>ದಿನಾಂಕ:</span>
                <input
                  type="text"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="border-b border-black font-bold px-1 bg-transparent w-28 text-black text-center focus:outline-none"
                  placeholder="ದಿನಾಂಕ"
                />
              </div>
              <div className="text-center">
                <span className="font-black text-xs">ವರ್ಗ ಶಿಕ್ಷಕರ ಸಹಿ</span>
              </div>
              <div className="text-center">
                <span className="font-black text-xs">ಮುಖ್ಯ ಗುರುಗಳ ಸಹಿ & ಮೊಹರು</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
