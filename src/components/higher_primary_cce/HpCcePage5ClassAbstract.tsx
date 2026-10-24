import React, { useState, useMemo, useEffect } from 'react';
import { Student, SchoolRecord } from '../../types';
import {
  computeHpStudentCce,
  HpSubjectCode,
  HP_SUBJECTS_KANNADA,
} from '../../utils/higherPrimaryCceHelper';
import { extractLastWordOfSchoolName } from '../../utils/primaryCceHelper';
import { getSavedClassTeacher, persistClassTeacherLocally } from '../../utils/teacherHelper';
import {
  Printer,
  Download,
  FileSpreadsheet,
  FileCode,
  Share2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  printClassAbstractReport,
  exportClassAbstractPdf,
  downloadElementAsHtml,
  shareReportToWhatsApp,
  ReportPaperSize,
} from '../../utils/printPdfHelper';

interface HpCcePage5ClassAbstractProps {
  students: Student[];
  marksMap: Record<string, any>;
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  reportRef?: React.RefObject<HTMLDivElement | null>;
  initialClass?: string;
}

interface GenderBreakdown {
  boys: number;
  girls: number;
  total: number;
}

interface GradeRowData {
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'TOTAL';
  subjectCounts: Record<HpSubjectCode, GenderBreakdown>;
}

interface ClassAbstractData {
  classNum: string;
  label: string;
  rows: GradeRowData[];
  totalCounts: Record<HpSubjectCode, GenderBreakdown>;
}

const SUBJECT_HEADERS: Array<{ code: HpSubjectCode; nameKn: string }> = [
  { code: 'FL', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ' },
  { code: 'SL', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ' },
  { code: 'TL', nameKn: 'ತೃತೀಯ ಭಾಷೆ' },
  { code: 'MATHS', nameKn: 'ಗಣಿತ' },
  { code: 'SCI', nameKn: 'ವಿಜ್ಞಾನ' },
  { code: 'SOC', nameKn: 'ಸಮಾಜ ವಿಜ್ಞಾನ' },
  { code: 'VPE', nameKn: 'ದೈಹಿಕ ಶಿಕ್ಷಣ' },
];

export const HpCcePage5ClassAbstract: React.FC<HpCcePage5ClassAbstractProps> = ({
  students,
  marksMap,
  schoolRecord,
  academicYear,
  reportRef,
  initialClass = 'all',
}) => {
  // View selector: 'all' (Class 6, 7, 8 Consolidated as in official PDF) or single class '6', '7', '8'
  const [selectedView, setSelectedView] = useState<string>(
    ['all', '6', '7', '8'].includes(initialClass) ? initialClass : 'all'
  );
  const [paperSize, setPaperSize] = useState<ReportPaperSize>('a4');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const schoolName = schoolRecord?.schoolName || 'ಸರಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಕನ್ನಡ ಶಾಲೆ ನಿಂಗ್ಯಾನಟ್ಟಿ';
  const diseCode = schoolRecord?.diseCode || '';
  const clusterName = schoolRecord?.cluster || schoolRecord?.crcCluster || '';
  const talukName = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
  const defaultPlace = extractLastWordOfSchoolName(schoolRecord?.schoolName);
  const [placeName, setPlaceName] = useState<string>(defaultPlace);
  const schoolMedium = schoolRecord?.schoolMedium || 'Kannada';

  // Fetch Class Teacher Name strictly from school profile or local storage for single class view
  const activeClassForTeacher = selectedView === 'all' ? '6' : selectedView;
  const [classTeacherName, setClassTeacherName] = useState<string>(() => {
    return getSavedClassTeacher(schoolRecord, activeClassForTeacher);
  });

  useEffect(() => {
    setClassTeacherName(getSavedClassTeacher(schoolRecord, activeClassForTeacher));
  }, [schoolRecord, activeClassForTeacher]);

  // Compute stats for all 3 classes (6, 7, 8)
  const classesData: ClassAbstractData[] = useMemo(() => {
    const targetClasses = ['6', '7', '8'];

    return targetClasses.map((cls) => {
      const classStudents = (students || []).filter(
        (s) =>
          String(s.classStandard) === cls &&
          (!s.academicYear || s.academicYear === academicYear)
      );

      const computed = classStudents.map((st) => {
        const raw = marksMap?.[st.id] || null;
        return computeHpStudentCce(st, schoolMedium, raw);
      });

      const grades: Array<'A+' | 'A' | 'B+' | 'B' | 'C'> = ['A+', 'A', 'B+', 'B', 'C'];
      const counts: Record<'A+' | 'A' | 'B+' | 'B' | 'C' | 'TOTAL', Record<HpSubjectCode, GenderBreakdown>> = {
        'A+': {} as any,
        'A': {} as any,
        'B+': {} as any,
        'B': {} as any,
        'C': {} as any,
        'TOTAL': {} as any,
      };

      SUBJECT_HEADERS.forEach((sub) => {
        ['A+', 'A', 'B+', 'B', 'C', 'TOTAL'].forEach((g) => {
          counts[g as keyof typeof counts][sub.code] = { boys: 0, girls: 0, total: 0 };
        });
      });

      computed.forEach((cSt) => {
        const isGirl = cSt.student.gender === 'Girl';
        SUBJECT_HEADERS.forEach((sub) => {
          const subData = cSt.subjects[sub.code];
          const grade = subData?.grade;
          if (grade && ['A+', 'A', 'B+', 'B', 'C'].includes(grade)) {
            const gKey = grade as 'A+' | 'A' | 'B+' | 'B' | 'C';
            if (isGirl) {
              counts[gKey][sub.code].girls++;
              counts[gKey][sub.code].total++;
              counts['TOTAL'][sub.code].girls++;
              counts['TOTAL'][sub.code].total++;
            } else {
              counts[gKey][sub.code].boys++;
              counts[gKey][sub.code].total++;
              counts['TOTAL'][sub.code].boys++;
              counts['TOTAL'][sub.code].total++;
            }
          }
        });
      });

      const rows: GradeRowData[] = grades.map((g) => ({
        grade: g,
        subjectCounts: counts[g],
      }));

      rows.push({
        grade: 'TOTAL',
        subjectCounts: counts['TOTAL'],
      });

      return {
        classNum: cls,
        label: `${cls}TH STD`,
        rows,
        totalCounts: counts['TOTAL'],
      };
    });
  }, [students, marksMap, academicYear, schoolMedium]);

  // Compute Grand Total across 6th to 8th STD
  const grandTotalCounts = useMemo(() => {
    const total: Record<HpSubjectCode, GenderBreakdown> = {} as any;
    SUBJECT_HEADERS.forEach((sub) => {
      total[sub.code] = { boys: 0, girls: 0, total: 0 };
    });

    classesData.forEach((cd) => {
      SUBJECT_HEADERS.forEach((sub) => {
        total[sub.code].boys += cd.totalCounts[sub.code].boys;
        total[sub.code].girls += cd.totalCounts[sub.code].girls;
        total[sub.code].total += cd.totalCounts[sub.code].total;
      });
    });

    return total;
  }, [classesData]);

  // Total student counts across 6-8
  const totalStudentsCount = useMemo(() => {
    return SUBJECT_HEADERS.length > 0 ? grandTotalCounts[SUBJECT_HEADERS[0].code].total : 0;
  }, [grandTotalCounts]);

  // Filtered classes based on selected view
  const visibleClasses = useMemo(() => {
    if (selectedView === 'all') return classesData;
    return classesData.filter((c) => c.classNum === selectedView);
  }, [classesData, selectedView]);

  const docTitle = `${schoolName.replace(/\s+/g, '_')}_Class_6-8_Subjectwise_Gradewise_Abstract_${academicYear}`;

  // Export to Excel (.xlsx) matching official structure
  const handleExportExcel = () => {
    try {
      const rows: any[][] = [];
      rows.push([`ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ ${talukName}`]);
      rows.push([`${academicYear} ನೇ ಸಾಲಿನ ವಾರ್ಷಿಕ ಪರಿಣಾಮ ಪತ್ರಿಕೆಯ ಘೋಷವಾರ`]);
      rows.push([`ತರಗತಿವಾರು, ವಿಷಯವಾರು ಹಾಗೂ ಶ್ರೇಣಿವಾರು ಘೋಷವಾರ 6-8`]);
      rows.push([`ಶಾಲೆಯ ಹೆಸರು : ${schoolName}`, '', '', '', '', '', '', '', '', '', `ಕ್ಲಸ್ಟರ್ ಹೆಸರು :- ${clusterName}`]);
      rows.push([]);

      // Multi-tier header
      const headerRow1: any[] = ['CLASS', 'ಶ್ರೇಣಿ'];
      SUBJECT_HEADERS.forEach((sub) => {
        headerRow1.push(sub.nameKn, '', '');
      });
      rows.push(headerRow1);

      const headerRow2: any[] = ['', ''];
      SUBJECT_HEADERS.forEach(() => {
        headerRow2.push('ಗಂ', 'ಹೆ', 'ಒ');
      });
      rows.push(headerRow2);

      visibleClasses.forEach((cd) => {
        cd.rows.forEach((r, rIdx) => {
          const rowVals: any[] = [rIdx === 0 ? cd.label : '', r.grade];
          SUBJECT_HEADERS.forEach((sub) => {
            const c = r.subjectCounts[sub.code];
            rowVals.push(c.boys || '-', c.girls || '-', c.total || '-');
          });
          rows.push(rowVals);
        });
      });

      if (selectedView === 'all') {
        const grandVals: any[] = ['6TH TO 8TH STD TOTAL', ''];
        SUBJECT_HEADERS.forEach((sub) => {
          const c = grandTotalCounts[sub.code];
          grandVals.push(c.boys || '-', c.girls || '-', c.total || '-');
        });
        rows.push(grandVals);
      }

      rows.push([]);
      rows.push([
        `ಮುಖ್ಯ ಶಿಕ್ಷಕರ ಸಹಿ`, '', '', '', '',
        `ಸಮೂಹ ಸಂಪನ್ಮೂಲ ವ್ಯಕ್ತಿಯ ಸಹಿ`, '', '', '', '',
        `ಶಿಕ್ಷಣ ಸಂಯೋಜಕರ ಸಹಿ`
      ]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `6-8_Abstract`);
      XLSX.writeFile(wb, `${docTitle}.xlsx`);
    } catch (err) {
      console.error('Export Excel error:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Scoped Print and Margin Styles */}
      <style>{`
        @page {
          size: ${paperSize === 'a4' ? '297mm 210mm' : '355.6mm 215.9mm'} landscape;
          margin: 5mm 2mm 5mm 0mm;
        }
        @media print {
          html, body {
            color: #000000 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .report-page-sheet {
            page-break-after: avoid !important;
            break-after: avoid !important;
            margin: 0 auto !important;
            padding: 4mm 0 4mm 0 !important;
            box-shadow: none !important;
            border: 2px solid #000000 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            box-sizing: border-box !important;
          }
          .report-page-sheet > div,
          .cce-sheet-container {
            padding-left: 0 !important;
            margin-left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Configuration & Actions Bar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-3.5 rounded-2xl print:hidden shadow-sm text-xs">
        {/* Left: View Selector (All 6-8 vs Individual Class) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <span className="font-bold text-amber-300 px-1.5">ತರಗತಿ:</span>
            <button
              type="button"
              onClick={() => setSelectedView('all')}
              className={`px-3 py-1 rounded-lg font-black transition cursor-pointer text-xs ${
                selectedView === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="6-8 All Classes (Consolidated as shown in official PDF)"
            >
              6-8 ಎಲ್ಲ ತರಗತಿಗಳು (All 6-8)
            </button>
            <button
              type="button"
              onClick={() => setSelectedView('6')}
              className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer text-xs ${
                selectedView === '6'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              6ನೇ
            </button>
            <button
              type="button"
              onClick={() => setSelectedView('7')}
              className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer text-xs ${
                selectedView === '7'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              7ನೇ
            </button>
            <button
              type="button"
              onClick={() => setSelectedView('8')}
              className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer text-xs ${
                selectedView === '8'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              8ನೇ
            </button>
          </div>

          {/* Paper Size Preview: A4 vs Legal */}
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setPaperSize('a4')}
              className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer text-[11px] ${
                paperSize === 'a4'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              A4 Landscape
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('legal')}
              className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer text-[11px] ${
                paperSize === 'legal'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Legal Landscape
            </button>
          </div>
        </div>

        {/* Right: Actions (Excel, HTML, Print, WhatsApp, PDF) */}
        <div className="flex flex-wrap items-center gap-2">
          {statusMessage && (
            <span className="text-amber-300 font-bold animate-pulse">{statusMessage}</span>
          )}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
            title="Download formatted Excel (.xlsx) file"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (reportRef?.current) {
                downloadElementAsHtml(reportRef.current, docTitle, paperSize);
                setStatusMessage('HTML ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!');
                setTimeout(() => setStatusMessage(null), 3000);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
            title="Download standalone printable HTML file (to adjust margins manually)"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>HTML ಡೌನ್‌ಲೋಡ್</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              if (reportRef?.current) {
                const summary = `*${schoolName}*\n*ತರಗತಿವಾರು, ವಿಷಯವಾರು ಹಾಗೂ ಶ್ರೇಣಿವಾರು ಘೋಷವಾರ 6-8 (${academicYear})*\nಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು: ${totalStudentsCount}\nದಿನಾಂಕ: ${new Date().toLocaleDateString('kn-IN')}`;
                await shareReportToWhatsApp(reportRef.current, summary, docTitle);
                setStatusMessage('WhatsApp ತೆರೆಯಲಾಗಿದೆ!');
                setTimeout(() => setStatusMessage(null), 3000);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
            title="Share report image & summary to WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (reportRef?.current) {
                printClassAbstractReport(reportRef.current, docTitle, paperSize, 'landscape');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
            title={`Print in ${paperSize.toUpperCase()} Landscape`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>ಮುದ್ರಿಸಿ (Print)</span>
          </button>

          <button
            type="button"
            disabled={isExportingPdf}
            onClick={async () => {
              if (reportRef?.current) {
                setIsExportingPdf(true);
                setStatusMessage('PDF ಸಿದ್ಧವಾಗುತ್ತಿದೆ...');
                try {
                  await exportClassAbstractPdf(reportRef.current, docTitle, paperSize, 'landscape');
                  setStatusMessage('PDF ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!');
                } catch (err) {
                  console.error('PDF error:', err);
                  setStatusMessage('PDF ಡೌನ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ');
                } finally {
                  setIsExportingPdf(false);
                  setTimeout(() => setStatusMessage(null), 3000);
                }
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
            title={`Download PDF in ${paperSize.toUpperCase()}`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingPdf ? 'ರಚಿಸಲಾಗುತ್ತಿದೆ...' : 'PDF ಡೌನ್‌ಲೋಡ್'}</span>
          </button>
        </div>
      </div>

      {/* Main Official Printable Report Sheet matching the PDF */}
      <div
        ref={reportRef}
        style={{
          boxSizing: 'border-box',
          width: paperSize === 'a4' ? '282mm' : '338mm',
          maxWidth: '100%',
          margin: '0 auto',
        }}
        className="report-page-sheet bg-white rounded-xl border-2 border-black p-4 sm:p-5 shadow-md mx-auto my-2 flex flex-col justify-between print:border-2 print:border-black print:p-4 print:m-0 print:shadow-none"
      >
        <div>
          {/* Header matching the PDF Screenshot */}
          <div className="text-center space-y-0.5 text-black pb-1.5">
            <h2 className="text-[13px] sm:text-[14px] font-black text-black tracking-wide leading-tight">
              ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ {talukName}
            </h2>

            <h3 className="text-[12px] sm:text-[13px] font-bold text-black tracking-tight leading-tight">
              {academicYear} ನೇ ಸಾಲಿನ ವಾರ್ಷಿಕ ಪರಿಣಾಮ ಪತ್ರಿಕೆಯ ಘೋಷವಾರ
            </h3>

            <h3 className="text-[12px] sm:text-[13px] font-black text-black tracking-tight leading-tight">
              ತರಗತಿವಾರು, ವಿಷಯವಾರು ಹಾಗೂ ಶ್ರೇಣಿವಾರು ಘೋಷವಾರ 6-8
            </h3>

            {/* School Name (Left) & Cluster (Right) */}
            <div className="flex flex-row items-center justify-between text-[11px] sm:text-[12px] font-bold text-black pt-1 px-1 whitespace-nowrap overflow-hidden">
              <div>
                ಶಾಲೆಯ ಹೆಸರು : <span className="font-black text-black">{schoolName}</span>
              </div>
              <div>
                ಕ್ಲಸ್ಟರ್ ಹೆಸರು :- <span className="font-black text-black">{clusterName || talukName}</span>
              </div>
            </div>
          </div>

          {/* 23-Column Official Abstract Table matching the PDF Screenshot */}
          <div className="w-full mt-1 overflow-x-auto print:overflow-visible">
            <table className="w-full text-center border-collapse border-2 border-black table-fixed text-[11px] text-black">
              <colgroup>
                {/* 1. CLASS Column */}
                <col style={{ width: '6.0%' }} />
                {/* 2. Grade Column */}
                <col style={{ width: '6.0%' }} />
                {/* 21 Subject breakdown columns (7 subjects * 3 cols: ಗಂ, ಹೆ, ಒ = 21 cols @ ~4.19%) */}
                {Array.from({ length: 21 }).map((_, i) => (
                  <col key={i} style={{ width: '4.19%' }} />
                ))}
              </colgroup>
              <thead>
                {/* Tier 1 Header: CLASS, ಶ್ರೇಣಿ, 7 Subjects */}
                <tr className="bg-amber-100/70 font-black text-black border-b border-black text-center" style={{ height: '9mm' }}>
                  <th
                    rowSpan={2}
                    className="border border-black p-0.5 text-center align-middle font-black text-[11px]"
                    style={{ verticalAlign: 'middle', textAlign: 'center' }}
                  >
                    CLASS
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-black p-0.5 text-center align-middle font-black text-[11px]"
                    style={{ verticalAlign: 'middle', textAlign: 'center' }}
                  >
                    ಶ್ರೇಣಿ
                  </th>
                  {SUBJECT_HEADERS.map((sub) => (
                    <th
                      key={sub.code}
                      colSpan={3}
                      className="border border-black p-0.5 text-center align-middle text-black font-black text-[11px] leading-tight"
                      style={{ verticalAlign: 'middle', textAlign: 'center' }}
                    >
                      {sub.nameKn}
                    </th>
                  ))}
                </tr>

                {/* Tier 2 Header: 7 repeats of (ಗಂ, ಹೆ, ಒ) */}
                <tr className="bg-amber-50/70 font-bold text-black border-b-2 border-black text-[10px] text-center" style={{ height: '6mm' }}>
                  {SUBJECT_HEADERS.map((sub) => (
                    <React.Fragment key={sub.code}>
                      <th className="border border-black p-0 text-center align-middle font-bold" style={{ verticalAlign: 'middle', textAlign: 'center' }}>ಗಂ</th>
                      <th className="border border-black p-0 text-center align-middle font-bold" style={{ verticalAlign: 'middle', textAlign: 'center' }}>ಹೆ</th>
                      <th className="border border-black p-0 text-center align-middle font-bold bg-amber-100/50" style={{ verticalAlign: 'middle', textAlign: 'center' }}>ಒ</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleClasses.map((cd) => (
                  <React.Fragment key={cd.classNum}>
                    {cd.rows.map((row, rIdx) => {
                      const isClassTotal = row.grade === 'TOTAL';
                      const rowBg = isClassTotal
                        ? 'bg-blue-100 font-black border-t border-black text-black text-[11px]'
                        : 'hover:bg-slate-50 font-bold text-[11px]';

                      return (
                        <tr
                          key={`${cd.classNum}-${row.grade}`}
                          className={`border-b border-black text-center ${rowBg}`}
                          style={{ height: '6.5mm' }}
                        >
                          {/* CLASS Cell with vertical rotated text matching PDF */}
                          {rIdx === 0 && (
                            <td
                              rowSpan={cd.rows.length}
                              className="border border-black font-black text-center align-middle bg-slate-50 text-black text-[11px] p-0.5 tracking-wider"
                              style={{
                                verticalAlign: 'middle',
                                textAlign: 'center',
                                writingMode: 'vertical-rl',
                                transform: 'rotate(180deg)',
                              }}
                            >
                              {cd.label}
                            </td>
                          )}

                          {/* Grade Label */}
                          <td
                            className={`border border-black p-0.5 text-center align-middle font-black ${
                              isClassTotal ? 'bg-blue-200 text-black font-black' : 'text-black'
                            }`}
                            style={{ verticalAlign: 'middle', textAlign: 'center' }}
                          >
                            {row.grade}
                          </td>

                          {/* 7 Subjects x 3 (Boys, Girls, Total) */}
                          {SUBJECT_HEADERS.map((sub) => {
                            const counts = row.subjectCounts[sub.code];
                            return (
                              <React.Fragment key={sub.code}>
                                <td
                                  className="border border-black p-0.5 font-mono text-center align-middle text-[11px]"
                                  style={{ verticalAlign: 'middle', textAlign: 'center' }}
                                >
                                  {counts.boys || '-'}
                                </td>
                                <td
                                  className="border border-black p-0.5 font-mono text-center align-middle text-[11px]"
                                  style={{ verticalAlign: 'middle', textAlign: 'center' }}
                                >
                                  {counts.girls || '-'}
                                </td>
                                <td
                                  className={`border border-black p-0.5 font-mono font-black text-center align-middle text-[11px] ${
                                    isClassTotal ? 'bg-blue-200 text-black' : 'bg-slate-50 text-black'
                                  }`}
                                  style={{ verticalAlign: 'middle', textAlign: 'center' }}
                                >
                                  {counts.total || '-'}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}

                {/* Bottom Grand Total Row: 6TH TO 8TH STD TOTAL matching the PDF screenshot */}
                {selectedView === 'all' && (
                  <tr
                    className="bg-emerald-100 font-black border-t-2 border-black text-black text-[11px]"
                    style={{ height: '7.5mm' }}
                  >
                    <td
                      colSpan={2}
                      className="border border-black p-1 text-center align-middle font-black bg-emerald-200 text-black tracking-wide"
                      style={{ verticalAlign: 'middle', textAlign: 'center' }}
                    >
                      6TH TO 8TH STD TOTAL
                    </td>

                    {SUBJECT_HEADERS.map((sub) => {
                      const counts = grandTotalCounts[sub.code];
                      return (
                        <React.Fragment key={sub.code}>
                          <td
                            className="border border-black p-0.5 font-mono font-black text-center align-middle text-[11px]"
                            style={{ verticalAlign: 'middle', textAlign: 'center' }}
                          >
                            {counts.boys || '-'}
                          </td>
                          <td
                            className="border border-black p-0.5 font-mono font-black text-center align-middle text-[11px]"
                            style={{ verticalAlign: 'middle', textAlign: 'center' }}
                          >
                            {counts.girls || '-'}
                          </td>
                          <td
                            className="border border-black p-0.5 font-mono font-black text-center align-middle text-[11px] bg-emerald-200 text-black"
                            style={{ verticalAlign: 'middle', textAlign: 'center' }}
                          >
                            {counts.total || '-'}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3 Signatures matching the PDF Screenshot */}
        <div className="pt-6 pb-1">
          <div className="grid grid-cols-3 text-center text-[12px] font-black text-black w-full px-4">
            <div className="text-center">
              <span>ಮುಖ್ಯ ಶಿಕ್ಷಕರ ಸಹಿ</span>
            </div>
            <div className="text-center">
              <span>ಸಮೂಹ ಸಂಪನ್ಮೂಲ ವ್ಯಕ್ತಿಯ ಸಹಿ</span>
            </div>
            <div className="text-center">
              <span>ಶಿಕ್ಷಣ ಸಂಯೋಜಕರ ಸಹಿ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
