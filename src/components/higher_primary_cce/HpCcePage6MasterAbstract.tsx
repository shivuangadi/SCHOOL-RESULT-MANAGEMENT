import React, { useMemo, useState } from 'react';
import { Student, SchoolRecord } from '../../types';
import { getMajorCategory, extractLastWordOfSchoolName } from '../../utils/primaryCceHelper';
import { Printer, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { printClassAbstractReport, exportClassAbstractPdf } from '../../utils/printPdfHelper';

interface HpCcePage6MasterAbstractProps {
  students: Student[];
  marksMap?: Record<string, any>;
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  reportRef?: React.RefObject<HTMLDivElement | null>;
}

interface GenderCount {
  b: number;
  g: number;
  t: number;
}

interface CategoryGenderGroup {
  sc: GenderCount;
  st: GenderCount;
  obc: GenderCount;
  gen: GenderCount;
  total: GenderCount;
}

interface ClassAbstractStats {
  classNum: string;
  label: string;
  isTotalRow?: boolean;
  isGrandTotalRow?: boolean;
  enrolled: CategoryGenderGroup;
  appeared: CategoryGenderGroup;
  notAppeared: CategoryGenderGroup;
}

const emptyGenderCount = (): GenderCount => ({ b: 0, g: 0, t: 0 });

const emptyCategoryGroup = (): CategoryGenderGroup => ({
  sc: emptyGenderCount(),
  st: emptyGenderCount(),
  obc: emptyGenderCount(),
  gen: emptyGenderCount(),
  total: emptyGenderCount(),
});

export const HpCcePage6MasterAbstract: React.FC<HpCcePage6MasterAbstractProps> = ({
  students,
  marksMap = {},
  schoolRecord,
  academicYear,
  reportRef,
}) => {
  const talukName = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
  const schoolName = schoolRecord?.schoolName || 'ಸರಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ';
  const diseCode = schoolRecord?.diseCode || '';
  const clusterName = schoolRecord?.cluster || schoolRecord?.crcCluster || '';
  const defaultPlace = extractLastWordOfSchoolName(schoolRecord?.schoolName);
  const [placeName, setPlaceName] = useState<string>(defaultPlace);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Calculate statistics for each class 1 to 8, plus subtotal 1-5, subtotal 6-8, and grand total 1-8
  const statsRows = useMemo(() => {
    const computeForClass = (cls: string): ClassAbstractStats => {
      const clsStudents = (students || []).filter(
        (s) => String(s.classStandard) === cls && (!s.academicYear || s.academicYear === academicYear)
      );

      const enrolled = emptyCategoryGroup();
      const appeared = emptyCategoryGroup();
      const notAppeared = emptyCategoryGroup();

      clsStudents.forEach((st) => {
        const isGirl = st.gender === 'Girl';
        const cat = getMajorCategory(st.caste, st.religion);
        const catKey = cat.toLowerCase() as 'sc' | 'st' | 'obc' | 'gen';

        const addCount = (group: CategoryGenderGroup) => {
          if (isGirl) {
            group[catKey].g++;
            group[catKey].t++;
            group.total.g++;
            group.total.t++;
          } else {
            group[catKey].b++;
            group[catKey].t++;
            group.total.b++;
            group.total.t++;
          }
        };

        // 1. Enrollment
        addCount(enrolled);

        // 2. Appeared under CCE vs Not Appeared / Exempted
        const m = marksMap[st.id];
        let hasMarks = false;
        if (m && m.subjects) {
          hasMarks = Object.values(m.subjects).some(
            (s: any) =>
              s &&
              (s.fa1 != null ||
                s.fa2 != null ||
                s.sa1 != null ||
                s.fa3 != null ||
                s.fa4 != null ||
                s.sa2 != null ||
                s.totalMarks != null ||
                s.total != null ||
                s.total100 != null)
          );
        }

        const isExempt = st.cwsnStatus === 'EXEMPTED';
        const isCovered = hasMarks || isExempt || Object.keys(marksMap).length === 0;

        if (isCovered) {
          addCount(appeared);
        } else {
          addCount(notAppeared);
        }
      });

      return {
        classNum: cls,
        label: `${cls} ನೇ ತರಗತಿ`,
        enrolled,
        appeared,
        notAppeared,
      };
    };

    const c1 = computeForClass('1');
    const c2 = computeForClass('2');
    const c3 = computeForClass('3');
    const c4 = computeForClass('4');
    const c5 = computeForClass('5');

    const sumGroups = (list: ClassAbstractStats[], key: 'enrolled' | 'appeared' | 'notAppeared'): CategoryGenderGroup => {
      const res = emptyCategoryGroup();
      list.forEach((item) => {
        const g = item[key];
        (['sc', 'st', 'obc', 'gen', 'total'] as const).forEach((cat) => {
          res[cat].b += g[cat].b;
          res[cat].g += g[cat].g;
          res[cat].t += g[cat].t;
        });
      });
      return res;
    };

    const primaryList = [c1, c2, c3, c4, c5];
    const total1to5: ClassAbstractStats = {
      classNum: 'total_1_5',
      label: '1-5 ಒಟ್ಟು (Total 1-5)',
      isTotalRow: true,
      enrolled: sumGroups(primaryList, 'enrolled'),
      appeared: sumGroups(primaryList, 'appeared'),
      notAppeared: sumGroups(primaryList, 'notAppeared'),
    };

    const c6 = computeForClass('6');
    const c7 = computeForClass('7');
    const c8 = computeForClass('8');
    const upperPrimaryList = [c6, c7, c8];

    const total6to8: ClassAbstractStats = {
      classNum: 'total_6_8',
      label: '6-8 ಒಟ್ಟು (Total 6-8)',
      isTotalRow: true,
      enrolled: sumGroups(upperPrimaryList, 'enrolled'),
      appeared: sumGroups(upperPrimaryList, 'appeared'),
      notAppeared: sumGroups(upperPrimaryList, 'notAppeared'),
    };

    const allList = [...primaryList, ...upperPrimaryList];
    const grandTotal: ClassAbstractStats = {
      classNum: 'grand_total',
      label: 'ಮಹಾ ಒಟ್ಟು (1-8) (Grand Total)',
      isGrandTotalRow: true,
      enrolled: sumGroups(allList, 'enrolled'),
      appeared: sumGroups(allList, 'appeared'),
      notAppeared: sumGroups(allList, 'notAppeared'),
    };

    return [c1, c2, c3, c4, c5, total1to5, c6, c7, c8, total6to8, grandTotal];
  }, [students, marksMap, academicYear]);

  // Export Table to genuine Excel (.xlsx) file in Kannada & English
  const handleExportExcel = () => {
    try {
      const rowsData: any[][] = [];
      rowsData.push([`ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ ${talukName}`]);
      rowsData.push([`${academicYear} ನೇ ಸಾಲಿನ ವಾರ್ಷಿಕ ಪರಿಣಾಮ ಪತ್ರಿಕೆಯ ಘೋಷವಾರ (1 ರಿಂದ 8 ನೇ ತರಗತಿ)`]);
      rowsData.push([`ಶಾಲೆಯ ಹೆಸರು: ${schoolName}`, '', '', `ಡೈಸ್ ಕೋಡ್: ${diseCode}`, '', '', `ಕ್ಲಸ್ಟರ್ ಹೆಸರು: ${clusterName}`]);
      rowsData.push([]);

      // Multi-tier Table Headers
      rowsData.push([
        'ತರಗತಿ (Class)',
        'ದಾಖಲಾತಿ (Enrollment)',
        '', '', '', '', '', '', '', '', '', '',
        'ನಿರಂತರ ವ್ಯಾಪಕ ಮೌಲ್ಯಮಾಪನಕ್ಕೆ ಒಳಪಟ್ಟ ಮಕ್ಕಳ ಸಂಖ್ಯೆ (Appeared in CCE)',
        '', '', '', '', '', '', '', '', '', '',
        'ನಿರಂತರ ವ್ಯಾಪಕ ಮೌಲ್ಯಮಾಪನಕ್ಕೆ ಒಳಪಡದ ಮಕ್ಕಳ ಸಂಖ್ಯೆ (Not Appeared / Exempt)',
      ]);

      rowsData.push([
        '',
        'SC', '', 'ST', '', 'OBC', '', 'GEN', '', 'Total', '', '',
        'SC', '', 'ST', '', 'OBC', '', 'GEN', '', 'Total', '', '',
        'SC', '', 'ST', '', 'OBC', '', 'GEN', '', 'Total', '', '',
      ]);

      rowsData.push([
        '',
        'ಗಂ', 'ಹೆ', 'ಗಂ', 'ಹೆ', 'ಗಂ', 'ಹೆ', 'ಗಂ', 'ಹೆ', 'ಗಂ', 'ಹೆ', 'ಒ',
        'ಗಂ', 'ಹೆ', 'ಗಂ', 'ಹೆ', 'ಗಂ', 'ಹೆ', 'ಗಂ', 'ಹೆ', 'ಗಂ', 'ಹೆ', 'ಒ',
        'ಗಂ', 'ಹೆ', 'ಗಂ', 'ಹೆ', 'ಗಂ', 'ಹೆ', 'ಗಂ', 'ಹೆ', 'ಗಂ', 'ಹೆ', 'ಒ',
      ]);

      statsRows.forEach((r) => {
        const rowVals: any[] = [r.label];
        const pushGroup = (g: CategoryGenderGroup) => {
          rowVals.push(
            g.sc.b || '-', g.sc.g || '-',
            g.st.b || '-', g.st.g || '-',
            g.obc.b || '-', g.obc.g || '-',
            g.gen.b || '-', g.gen.g || '-',
            g.total.b || '-', g.total.g || '-', g.total.t || '-'
          );
        };
        pushGroup(r.enrolled);
        pushGroup(r.appeared);
        pushGroup(r.notAppeared);
        rowsData.push(rowVals);
      });

      rowsData.push([]);
      rowsData.push(['ದೃಢೀಕರಣ:']);
      rowsData.push(['1] 1ರಿಂದ 8 ನೇ ತರಗತಿಯ ವರೆಗೆ ಸಿ.ಸಿ.ಇ ಆಧಾರಿತ ಮೌಲ್ಯಮಾಪನ ಮಾಡಲಾಗಿದೆ']);
      rowsData.push(['2] ಪ್ರತಿ ವರ್ಗಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ ಎಲ್ಲಾ ಸಹ ಶಿಕ್ಷಕರ, ದೈ.ಶಿ ಪೂರಕ ದಾಖಲೆಗಳನ್ನು ಖುದ್ದಾಗಿ ಪರಿಶೀಲಿಸಿಯೇ ಅಂತಿಮ ಮೌಲ್ಯಮಾಪನ ವರದಿಯನ್ನು ಮಾನ್ಯರ ಪರಿಶೀಲನೆಗೆ ಒಪ್ಪಿಸಿದೆ']);
      rowsData.push([]);
      rowsData.push([
        `ಸ್ಥಳ: ${placeName}`, '', '',
        `ದಿನಾಂಕ: ${new Date().toLocaleDateString('kn-IN')}`, '', '',
        `ಮುಖ್ಯ ಶಿಕ್ಷಕರ ಸಹಿ: ${schoolRecord?.headmasterName || ''}`, '', '',
        'ಸಮೂಹ ಸಂಪನ್ಮೂಲ ವ್ಯಕ್ತಿಯ ಸಹಿ (CRP)', '', '',
        'ಶಿಕ್ಷಣ ಸಂಯೋಜಕರ ಸಹಿ (ECO)'
      ]);

      const ws = XLSX.utils.aoa_to_sheet(rowsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '1-8_Abstract');
      const cleanName = `${(schoolName || 'School').replace(/\s+/g, '_')}_Class_1-8_Annual_Result_Abstract_${academicYear}.xlsx`;
      XLSX.writeFile(wb, cleanName);
    } catch (err) {
      console.error('Error exporting abstract to Excel:', err);
    }
  };

  const renderCategoryCols = (group: CategoryGenderGroup) => (
    <>
      {/* SC */}
      <td className="border border-slate-900 p-0.5 font-mono text-[9px]">{group.sc.b || '-'}</td>
      <td className="border border-slate-900 p-0.5 font-mono text-[9px]">{group.sc.g || '-'}</td>
      {/* ST */}
      <td className="border border-slate-900 p-0.5 font-mono text-[9px]">{group.st.b || '-'}</td>
      <td className="border border-slate-900 p-0.5 font-mono text-[9px]">{group.st.g || '-'}</td>
      {/* OBC */}
      <td className="border border-slate-900 p-0.5 font-mono text-[9px]">{group.obc.b || '-'}</td>
      <td className="border border-slate-900 p-0.5 font-mono text-[9px]">{group.obc.g || '-'}</td>
      {/* GEN */}
      <td className="border border-slate-900 p-0.5 font-mono text-[9px]">{group.gen.b || '-'}</td>
      <td className="border border-slate-900 p-0.5 font-mono text-[9px]">{group.gen.g || '-'}</td>
      {/* Total */}
      <td className="border border-slate-900 p-0.5 font-mono font-bold text-[9px] bg-slate-50">{group.total.b || '-'}</td>
      <td className="border border-slate-900 p-0.5 font-mono font-bold text-[9px] bg-slate-50">{group.total.g || '-'}</td>
      <td className="border border-slate-900 p-0.5 font-mono font-black text-[9.5px] bg-slate-100">{group.total.t || '-'}</td>
    </>
  );

  return (
    <div className="space-y-4">
      {/* Top Quick Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 p-3 rounded-2xl border border-slate-300 print:hidden shadow-xs">
        <div>
          <h3 className="text-xs sm:text-sm font-black text-slate-900">
            6. ವಾರ್ಷಿಕ ಪರಿಣಾಮ ಪತ್ರಿಕೆಯ ಘೋಷವಾರ (1 ರಿಂದ 8 ನೇ ತರಗತಿ ಪ್ರವರ್ಗವಾರು Abstract Report)
          </h3>
          <p className="text-[11px] text-slate-600 font-medium">
            1-8 Classwise & Category-wise Enrolment, Appeared, and Not Appeared/Exempted Official Report
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
            title="Download formatted Excel (.xlsx) file"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (.xlsx) ಡೌನ್‌ಲೋಡ್</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (reportRef?.current) {
                const sName = (schoolName || 'School').replace(/\s+/g, '_');
                const title = `${sName}_Class_1-8_Annual_Result_Abstract_${academicYear}`;
                printClassAbstractReport(reportRef.current, title, 'legal', 'landscape');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>ಮುದ್ರಿಸಿ (Print)</span>
          </button>
          <button
            type="button"
            disabled={isExportingPdf}
            onClick={async () => {
              if (reportRef?.current) {
                setIsExportingPdf(true);
                try {
                  const sName = (schoolName || 'School').replace(/\s+/g, '_');
                  const filename = `${sName}_Class_1-8_Annual_Result_Abstract_${academicYear}`;
                  await exportClassAbstractPdf(reportRef.current, filename, 'legal', 'landscape');
                } finally {
                  setIsExportingPdf(false);
                }
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPdf ? 'ರಚಿಸಲಾಗುತ್ತಿದೆ...' : 'PDF ಡೌನ್‌ಲೋಡ್'}</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (With Red Outer Border strictly matching the official Page 6 format) */}
      <div
        ref={reportRef}
        style={{
          boxSizing: 'border-box',
          width: '100%',
        }}
        className="report-page-sheet legal-landscape bg-white rounded-3xl border-2 border-red-600 p-5 sm:p-7 shadow-md space-y-3.5 mx-auto max-w-7xl print:border-2 print:border-red-600 print:shadow-none print:p-4 print:m-0"
      >
        {/* Official Header in Kannada */}
        <div className="text-center space-y-1 border-b-2 border-slate-900 pb-2">
          <h2 className="text-xs sm:text-sm font-black text-slate-950 font-serif leading-tight">
            ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ {talukName}
          </h2>
          <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
            {academicYear} ನೇ ಸಾಲಿನ ವಾರ್ಷಿಕ ಪರಿಣಾಮ ಪತ್ರಿಕೆಯ ಘೋಷವಾರ
          </h3>

          <div className="flex flex-wrap items-center justify-between text-[11px] font-black text-slate-900 pt-1.5 px-1">
            <div className="tracking-tight">
              ಶಾಲೆಯ ಹೆಸರು :- <span className="font-extrabold">{schoolName}</span>
            </div>
            <div>
              ಡೈಸ್ ಕೋಡ್: <span className="font-mono font-extrabold">{diseCode}</span>
            </div>
            <div>
              ಕ್ಲಸ್ಟರ್ ಹೆಸರು : <span className="font-extrabold">{clusterName || 'BELAGAVI'}</span>
            </div>
          </div>
        </div>

        {/* 34-Column Master Abstract Table: 1 Class column + 33 Category & Total columns */}
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-center border-collapse border-2 border-slate-900 table-fixed text-[9px] sm:text-[9.5px]">
            <colgroup>
              {/* 1. Class */}
              <col style={{ width: '6.2%' }} />
              {/* 33 Category and Total Columns (2.84% each) */}
              {Array.from({ length: 33 }).map((_, i) => (
                <col key={i} style={{ width: '2.84%' }} />
              ))}
            </colgroup>
            <thead>
              {/* Header Row 1: 3 Major Sections */}
              <tr className="bg-slate-100 font-black text-slate-950 border-b border-slate-900">
                <th rowSpan={3} className="border border-slate-900 p-1 bg-slate-200 text-center align-middle font-black text-[10px] w-14">
                  ತರಗತಿ
                </th>
                <th colSpan={11} className="border border-slate-900 p-1.5 bg-blue-50 text-blue-950 text-[10px] font-black">
                  ದಾಖಲಾತಿ (Enrollment)
                </th>
                <th colSpan={11} className="border border-slate-900 p-1.5 bg-emerald-50 text-emerald-950 text-[10px] font-black leading-tight">
                  ನಿರಂತರ ವ್ಯಾಪಕ ಮೌಲ್ಯಮಾಪನಕ್ಕೆ ಒಳಪಟ್ಟ ಮಕ್ಕಳ ಸಂಖ್ಯೆ (Appeared in CCE)
                </th>
                <th colSpan={11} className="border border-slate-900 p-1.5 bg-rose-50 text-rose-950 text-[10px] font-black leading-tight">
                  ನಿರಂತರ ವ್ಯಾಪಕ ಮೌಲ್ಯಮಾಪನಕ್ಕೆ ಒಳಪಡದ ಮಕ್ಕಳ ಸಂಖ್ಯೆ (Not Appeared / Exempt)
                </th>
              </tr>

              {/* Header Row 2: Categories (SC, ST, OBC, GEN, Total) */}
              <tr className="bg-slate-50 font-black text-slate-900 border-b border-slate-900 text-[8.5px]">
                {/* 1. Enrollment */}
                <th colSpan={2} className="border border-slate-900 p-0.5">SC</th>
                <th colSpan={2} className="border border-slate-900 p-0.5">ST</th>
                <th colSpan={2} className="border border-slate-900 p-0.5">OBC</th>
                <th colSpan={2} className="border border-slate-900 p-0.5">GEN</th>
                <th colSpan={3} className="border border-slate-900 p-0.5 bg-blue-100 font-extrabold">Total</th>

                {/* 2. Appeared under CCE */}
                <th colSpan={2} className="border border-slate-900 p-0.5">SC</th>
                <th colSpan={2} className="border border-slate-900 p-0.5">ST</th>
                <th colSpan={2} className="border border-slate-900 p-0.5">OBC</th>
                <th colSpan={2} className="border border-slate-900 p-0.5">GEN</th>
                <th colSpan={3} className="border border-slate-900 p-0.5 bg-emerald-100 font-extrabold">Total</th>

                {/* 3. Not Covered / Exempt */}
                <th colSpan={2} className="border border-slate-900 p-0.5">SC</th>
                <th colSpan={2} className="border border-slate-900 p-0.5">ST</th>
                <th colSpan={2} className="border border-slate-900 p-0.5">OBC</th>
                <th colSpan={2} className="border border-slate-900 p-0.5">GEN</th>
                <th colSpan={3} className="border border-slate-900 p-0.5 bg-rose-100 font-extrabold">Total</th>
              </tr>

              {/* Header Row 3: Boys (ಗಂ), Girls (ಹೆ), Total (ಒ) */}
              <tr className="bg-slate-50 font-bold text-slate-800 border-b-2 border-slate-900 text-[8px]">
                {/* 3 groups of (ಗಂ, ಹೆ, ಗಂ, ಹೆ, ಗಂ, ಹೆ, ಗಂ, ಹೆ, ಗಂ, ಹೆ, ಒ) */}
                {[1, 2, 3].map((grp) => (
                  <React.Fragment key={grp}>
                    <th className="border border-slate-900 p-0.5 w-6">ಗಂ</th>
                    <th className="border border-slate-900 p-0.5 w-6">ಹೆ</th>
                    <th className="border border-slate-900 p-0.5 w-6">ಗಂ</th>
                    <th className="border border-slate-900 p-0.5 w-6">ಹೆ</th>
                    <th className="border border-slate-900 p-0.5 w-6">ಗಂ</th>
                    <th className="border border-slate-900 p-0.5 w-6">ಹೆ</th>
                    <th className="border border-slate-900 p-0.5 w-6">ಗಂ</th>
                    <th className="border border-slate-900 p-0.5 w-6">ಹೆ</th>
                    <th className="border border-slate-900 p-0.5 w-6 bg-slate-200">ಗಂ</th>
                    <th className="border border-slate-900 p-0.5 w-6 bg-slate-200">ಹೆ</th>
                    <th className="border border-slate-900 p-0.5 w-7 bg-slate-300 font-black">ಒ</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {statsRows.map((row) => {
                const isSubtotal15 = row.classNum === 'total_1_5';
                const isSubtotal68 = row.classNum === 'total_6_8';
                const isGrandTotal = row.isGrandTotalRow;

                let rowBgClass = 'hover:bg-slate-50 text-[9px]';
                if (isGrandTotal) {
                  rowBgClass = 'bg-amber-100 font-black text-[9.5px] border-t-2 border-slate-900';
                } else if (isSubtotal15) {
                  rowBgClass = 'bg-blue-50/70 font-bold text-[9px] border-t border-b border-slate-900';
                } else if (isSubtotal68) {
                  rowBgClass = 'bg-purple-50/70 font-bold text-[9px] border-t border-b border-slate-900';
                }

                return (
                  <tr key={row.classNum} className={`border-b border-slate-800 ${rowBgClass}`}>
                    <td
                      className={`border border-slate-900 p-1 text-center font-black ${
                        isGrandTotal
                          ? 'bg-amber-200 text-amber-950 font-black'
                          : isSubtotal15
                          ? 'bg-blue-100 text-blue-950'
                          : isSubtotal68
                          ? 'bg-purple-100 text-purple-950'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      {row.label}
                    </td>
                    {renderCategoryCols(row.enrolled)}
                    {renderCategoryCols(row.appeared)}
                    {renderCategoryCols(row.notAppeared)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Official Declaration in Kannada matching Page 6 */}
        <div className="pt-1.5 text-xs font-bold text-slate-900 space-y-1 px-1">
          <div className="font-black text-slate-950">ದೃಢೀಕರಣ:</div>
          <div className="text-[11px] text-slate-800 pl-4 space-y-0.5 leading-snug">
            <div>1] 1ರಿಂದ 8 ನೇ ತರಗತಿಯ ವರೆಗೆ ಸಿ.ಸಿ.ಇ ಆಧಾರಿತ ಮೌಲ್ಯಮಾಪನ ಮಾಡಲಾಗಿದೆ</div>
            <div>2] ಪ್ರತಿ ವರ್ಗಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ ಎಲ್ಲಾ ಸಹ ಶಿಕ್ಷಕರ, ದೈ.ಶಿ ಪೂರಕ ದಾಖಲೆಗಳನ್ನು ಖುದ್ದಾಗಿ ಪರಿಶೀಲಿಸಿಯೇ ಅಂತಿಮ ಮೌಲ್ಯಮಾಪನ ವರದಿಯನ್ನು ಮಾನ್ಯರ ಪರಿಶೀಲನೆಗೆ ಒಪ್ಪಿಸಿದೆ</div>
          </div>
        </div>

        {/* Signatures Footer in Kannada matching Page 6 (Single line nowrap) */}
        <div className="flex flex-nowrap items-center justify-between pt-5 pb-1 text-[10px] sm:text-xs font-bold text-slate-900 px-2 gap-2 whitespace-nowrap overflow-hidden w-full">
          <div className="flex items-center gap-1.5 shrink-0">
            <span>ಸ್ಥಳ:</span>
            <input
              type="text"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              className="border-b border-slate-500 font-bold px-1 bg-transparent w-28 focus:outline-blue-500 focus:bg-white text-slate-900 text-[10.5px]"
              placeholder="ಸ್ಥಳದ ಹೆಸರು"
              title="ಸ್ಥಳವನ್ನು ಬದಲಾಯಿಸಲು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ"
            />
          </div>
          <div className="shrink-0">
            <span>ದಿನಾಂಕ: {new Date().toLocaleDateString('kn-IN')}</span>
          </div>
          <div className="shrink-0">
            ಮುಖ್ಯ ಶಿಕ್ಷಕರ ಸಹಿ: <span className="font-black text-slate-950">{schoolRecord?.headmasterName || 'ಮುಖ್ಯ ಗುರುಗಳು'}</span>
          </div>
          <div className="shrink-0">
            ಸಮೂಹ ಸಂಪನ್ಮೂಲ ವ್ಯಕ್ತಿಯ ಸಹಿ (CRP)
          </div>
          <div className="shrink-0">
            ಶಿಕ್ಷಣ ಸಂಯೋಜಕರ ಸಹಿ (ECO)
          </div>
        </div>
      </div>
    </div>
  );
};
