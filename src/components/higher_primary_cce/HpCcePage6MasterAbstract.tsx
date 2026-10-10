import React from 'react';
import { Student, SchoolRecord, isCwsnExempted } from '../../types';
import {
  getHpSubjectsForMedium,
} from '../../utils/higherPrimaryCceHelper';
import { FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface HpCcePage6MasterAbstractProps {
  students: Student[];
  marksMap: Record<string, any>;
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  reportRef?: React.RefObject<HTMLDivElement | null>;
}

interface ClassSubjectStat {
  subjectNameKn: string;
  subjectNameEn: string;
  code: string;
  enrolled: { b: number; g: number; t: number };
  appeared: { b: number; g: number; t: number };
  aPlus: number;
  a: number;
  bPlus: number;
  b: number;
  cPlus: number;
  c: number;
  d: number;
  exempt: number;
  passed: { b: number; g: number; t: number };
  passPct: number;
}

export const HpCcePage6MasterAbstract: React.FC<HpCcePage6MasterAbstractProps> = ({
  students,
  marksMap,
  schoolRecord,
  academicYear,
  reportRef,
}) => {
  const medium = schoolRecord?.schoolMedium || 'Kannada';
  const subjects = getHpSubjectsForMedium(medium);

  const schoolName = schoolRecord?.schoolName || 'ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ';
  const diseCode = schoolRecord?.diseCode || '';
  const clusterName = schoolRecord?.cluster || schoolRecord?.crcCluster || 'ಸದಲಗಾ';
  const talukName = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';

  // Compute stats for a given classStandard ('6', '7', '8', or all 6-8)
  const computeClassSubjectStats = (clsFilter?: string): ClassSubjectStat[] => {
    const classStudents = students.filter((s) => {
      const c = String(s.classStandard);
      if (clsFilter) return c === clsFilter;
      return c === '6' || c === '7' || c === '8';
    });

    return subjects.map((sub) => {
      let enB = 0;
      let enG = 0;
      let appB = 0;
      let appG = 0;
      let aPlus = 0;
      let a = 0;
      let bPlus = 0;
      let b = 0;
      let cPlus = 0;
      let c = 0;
      let d = 0;
      let exempt = 0;
      let passB = 0;
      let passG = 0;

      classStudents.forEach((st) => {
        const isGirl = st.gender === 'Girl';
        if (isGirl) enG++;
        else enB++;

        appB = enB;
        appG = enG;

        if (isCwsnExempted(st.cwsnStatus)) {
          exempt++;
          if (isGirl) passG++;
          else passB++;
          return;
        }

        const stMarks = marksMap[st.id]?.subjects?.[sub.code] || marksMap[st.id]?.subjects?.[sub.satsKey];
        const total100 = stMarks?.total ?? (
          (stMarks?.sem1_total || 0) + (stMarks?.sem2_total || 0)
        );

        let g = 'C';
        if (total100 >= 90) g = 'A+';
        else if (total100 >= 80) g = 'A';
        else if (total100 >= 70) g = 'B+';
        else if (total100 >= 60) g = 'B';
        else if (total100 >= 50) g = 'C+';
        else if (total100 >= 35) g = 'C';
        else g = 'D';

        if (g === 'A+') aPlus++;
        else if (g === 'A') a++;
        else if (g === 'B+') bPlus++;
        else if (g === 'B') b++;
        else if (g === 'C+') cPlus++;
        else if (g === 'C') c++;
        else d++;

        if (g !== 'D') {
          if (isGirl) passG++;
          else passB++;
        }
      });

      const totalApp = appB + appG;
      const totalPass = passB + passG;
      const passPct = totalApp > 0 ? Number(((totalPass / totalApp) * 100).toFixed(1)) : 0;

      return {
        subjectNameKn: sub.nameKn,
        subjectNameEn: sub.nameEn,
        code: sub.code,
        enrolled: { b: enB, g: enG, t: enB + enG },
        appeared: { b: appB, g: appG, t: appB + appG },
        aPlus,
        a,
        bPlus,
        b,
        cPlus,
        c,
        d,
        exempt,
        passed: { b: passB, g: passG, t: totalPass },
        passPct,
      };
    });
  };

  const statsClass6 = computeClassSubjectStats('6');
  const statsClass7 = computeClassSubjectStats('7');
  const statsClass8 = computeClassSubjectStats('8');
  const statsGrandTotal = computeClassSubjectStats();

  const handleExportExcel = () => {
    const wsData: any[][] = [
      [schoolName],
      [`DISE: ${diseCode} | CLUSTER: ${clusterName} | TALUK: ${talukName} | ACADEMIC YEAR: ${academicYear}`],
      ['CLASS-WISE (6-8) SUBJECT-WISE CCE CONSOLIDATION ABSTRACT (೬ ರಿಂದ ೮ ನೇ ತರಗತಿ ವಿಷಯವಾರು ಮಹಾ ಘೋಷವಾರ)'],
      [],
      [
        'ತರಗತಿ (Class)',
        'ವಿಷಯ (Subject)',
        'ದಾಖಲಾತಿ (Enrolled) B', 'Enrolled G', 'Enrolled Total',
        'ಹಾಜರಾದವರು (Appeared) B', 'Appeared G', 'Appeared Total',
        'A+ (90-100)',
        'A (80-89)',
        'B+ (70-79)',
        'B (60-69)',
        'C+ (50-59)',
        'C (35-49)',
        'D (<35)',
        'CWSN Exempt',
        'ತೇರ್ಗಡೆ (Passed) B', 'Passed G', 'Passed Total',
        'ತೇರ್ಗಡೆ % (Pass %)',
      ],
    ];

    const pushStats = (clsLabel: string, statsList: ClassSubjectStat[]) => {
      statsList.forEach((s) => {
        wsData.push([
          clsLabel,
          `${s.subjectNameKn} (${s.subjectNameEn})`,
          s.enrolled.b, s.enrolled.g, s.enrolled.t,
          s.appeared.b, s.appeared.g, s.appeared.t,
          s.aPlus, s.a, s.bPlus, s.b, s.cPlus, s.c, s.d, s.exempt,
          s.passed.b, s.passed.g, s.passed.t,
          `${s.passPct}%`,
        ]);
      });
    };

    pushStats('6th Std (೬ನೇ ತರಗತಿ)', statsClass6);
    pushStats('7th Std (೭ನೇ ತರಗತಿ)', statsClass7);
    pushStats('8th Std (೮ನೇ ತರಗತಿ)', statsClass8);
    pushStats('6-8 Grand Total (೬-೮ ಒಟ್ಟು)', statsGrandTotal);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '6-8_Master_Abstract');
    XLSX.writeFile(wb, `CCE_6-8_Master_Abstract_${academicYear}.xlsx`);
  };

  const renderTableSection = (titleKn: string, titleEn: string, statsList: ClassSubjectStat[], badgeColor: string) => (
    <div className="space-y-2">
      <div className={`px-3 py-1.5 ${badgeColor} text-white font-black text-xs rounded-xl flex justify-between items-center`}>
        <span>{titleKn} ({titleEn})</span>
        <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-lg uppercase">
          7 ವಿಷಯಗಳು • 700 ಅಂಕಗಳು
        </span>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full text-[9px] text-center border-collapse border border-slate-900 table-fixed">
          <thead>
            <tr className="bg-slate-100 font-black text-slate-950 border-b border-slate-900">
              <th rowSpan={2} className="border border-slate-900 p-1 w-[130px] text-left">
                ವಿಷಯಗಳು / Subjects<br />
                <span className="text-[8px] font-normal text-slate-600">(ಕನ್ನಡ & English)</span>
              </th>
              <th colSpan={3} className="border border-slate-900 p-0.5 bg-blue-50 text-blue-950">ದಾಖಲಾತಿ (Enrolled)</th>
              <th colSpan={3} className="border border-slate-900 p-0.5 bg-indigo-50 text-indigo-950">ಹಾಜರಾದವರು (App.)</th>
              <th colSpan={7} className="border border-slate-900 p-0.5 bg-amber-50 text-amber-950">ಶ್ರೇಣಿವಾರು ಫಲಿತಾಂಶ (Grades)</th>
              <th rowSpan={2} className="border border-slate-900 p-0.5 w-[30px] bg-purple-100 text-purple-950">Exempt</th>
              <th colSpan={3} className="border border-slate-900 p-0.5 bg-emerald-100 text-emerald-950">ತೇರ್ಗಡೆ (Passed)</th>
              <th rowSpan={2} className="border border-slate-900 p-0.5 w-[38px] bg-emerald-200 text-emerald-950 font-black">%</th>
            </tr>
            <tr className="bg-slate-50 text-[8px] font-bold text-slate-800 border-b border-slate-900">
              <th className="border border-slate-900 p-0.5 w-[20px]">ಬಾ</th>
              <th className="border border-slate-900 p-0.5 w-[20px]">ಬಾಕಿ</th>
              <th className="border border-slate-900 p-0.5 w-[22px] font-black">ಒ</th>
              <th className="border border-slate-900 p-0.5 w-[20px]">ಬಾ</th>
              <th className="border border-slate-900 p-0.5 w-[20px]">ಬಾಕಿ</th>
              <th className="border border-slate-900 p-0.5 w-[22px] font-black">ಒ</th>
              <th className="border border-slate-900 p-0.5 w-[20px]">A+</th>
              <th className="border border-slate-900 p-0.5 w-[20px]">A</th>
              <th className="border border-slate-900 p-0.5 w-[20px]">B+</th>
              <th className="border border-slate-900 p-0.5 w-[20px]">B</th>
              <th className="border border-slate-900 p-0.5 w-[20px]">C+</th>
              <th className="border border-slate-900 p-0.5 w-[20px]">C</th>
              <th className="border border-slate-900 p-0.5 w-[20px]">D</th>
              <th className="border border-slate-900 p-0.5 w-[20px]">ಬಾ</th>
              <th className="border border-slate-900 p-0.5 w-[20px]">ಬಾಕಿ</th>
              <th className="border border-slate-900 p-0.5 w-[22px] font-black">ಒ</th>
            </tr>
          </thead>
          <tbody>
            {statsList.map((row) => (
              <tr key={row.code} className="border-b border-slate-300 hover:bg-slate-50 font-mono">
                <td className="border border-slate-900 p-1 text-left font-sans font-bold text-slate-900 truncate">
                  <div>{row.subjectNameKn}</div>
                  <div className="text-[7px] text-slate-500 font-normal">{row.subjectNameEn}</div>
                </td>
                <td className="border border-slate-900 p-0.5">{row.enrolled.b}</td>
                <td className="border border-slate-900 p-0.5">{row.enrolled.g}</td>
                <td className="border border-slate-900 p-0.5 font-bold bg-blue-50/50">{row.enrolled.t}</td>
                <td className="border border-slate-900 p-0.5">{row.appeared.b}</td>
                <td className="border border-slate-900 p-0.5">{row.appeared.g}</td>
                <td className="border border-slate-900 p-0.5 font-bold bg-indigo-50/50">{row.appeared.t}</td>
                <td className="border border-slate-900 p-0.5 text-emerald-800 font-bold">{row.aPlus}</td>
                <td className="border border-slate-900 p-0.5 text-emerald-700">{row.a}</td>
                <td className="border border-slate-900 p-0.5 text-blue-800 font-bold">{row.bPlus}</td>
                <td className="border border-slate-900 p-0.5 text-blue-700">{row.b}</td>
                <td className="border border-slate-900 p-0.5 text-yellow-800 font-bold">{row.cPlus}</td>
                <td className="border border-slate-900 p-0.5 text-yellow-700">{row.c}</td>
                <td className="border border-slate-900 p-0.5 text-red-700 font-bold">{row.d}</td>
                <td className="border border-slate-900 p-0.5 bg-purple-50 text-purple-900 font-bold">{row.exempt}</td>
                <td className="border border-slate-900 p-0.5">{row.passed.b}</td>
                <td className="border border-slate-900 p-0.5">{row.passed.g}</td>
                <td className="border border-slate-900 p-0.5 font-black bg-emerald-50">{row.passed.t}</td>
                <td className="border border-slate-900 p-0.5 font-black text-emerald-950 bg-emerald-100">
                  {row.passPct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-300 shadow-sm print:hidden">
        <div className="text-xs font-bold text-slate-800">
          ೬ ರಿಂದ ೮ ನೇ ತರಗತಿಗಳ ವಾರ್ಷಿಕ ವಿಷಯವಾರು ಹಾಗೂ ಶ್ರೇಣಿವಾರು ಮಹಾ ಕ್ರೋಢೀಕರಣ ವರದಿ
        </div>
        <button
          type="button"
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Excel ಡೌನ್‌ಲೋಡ್</span>
        </button>
      </div>

      {/* Main Master Abstract Sheet */}
      <div
        ref={reportRef}
        className="bg-white p-6 rounded-2xl border border-slate-300 shadow-md space-y-6 legal-landscape print:p-2 print:border-none print:shadow-none"
      >
        {/* Dynamic Header */}
        <div className="text-center space-y-1 border-b-2 border-slate-900 pb-3">
          <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
            ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ, {talukName}
          </p>
          <h2 className="text-base sm:text-lg font-black text-slate-950 font-serif tracking-wide">
            {schoolName} • DISE: {diseCode}
          </h2>
          <h3 className="text-xs sm:text-sm font-extrabold text-blue-950">
            {academicYear} ನೇ ಸಾಲಿನ ೬ ರಿಂದ ೮ ನೇ ತರಗತಿಗಳ ವಾರ್ಷಿಕ ಪರೀಕ್ಷಾ ವಿಷಯವಾರು ಹಾಗೂ ಶ್ರೇಣಿವಾರು ಮಹಾ ಘೋಷವಾರ (Page 6: Master Abstract)
          </h3>

          <div className="grid grid-cols-3 items-center text-xs font-bold text-slate-800 pt-1 border-t border-slate-200">
            <div className="text-left">ಕ್ಲಸ್ಟರ್ / Cluster: <span className="font-black text-slate-950">{clusterName}</span></div>
            <div className="text-center">ತಾಲ್ಲೂಕು / Taluk: <span className="font-black text-slate-950">{talukName}</span></div>
            <div className="text-right">ಮಾಧ್ಯಮ / Medium: <span className="font-black text-slate-950">{medium}</span></div>
          </div>
        </div>

        {/* 6th Standard */}
        {renderTableSection('೬ನೇ ತರಗತಿ ವಿಷಯವಾರು ಘೋಷವಾರ', '6th Standard Subject-wise Abstract', statsClass6, 'bg-blue-700')}

        {/* 7th Standard */}
        {renderTableSection('೭ನೇ ತರಗತಿ ವಿಷಯವಾರು ಘೋಷವಾರ', '7th Standard Subject-wise Abstract', statsClass7, 'bg-indigo-700')}

        {/* 8th Standard */}
        {renderTableSection('೮ನೇ ತರಗತಿ ವಿಷಯವಾರು ಘೋಷವಾರ', '8th Standard Subject-wise Abstract', statsClass8, 'bg-teal-700')}

        {/* 6-8 Grand Total */}
        {renderTableSection('೬ ರಿಂದ ೮ ನೇ ತರಗತಿಗಳ ಸಮಗ್ರ ಮಹಾ ಘೋಷವಾರ', '6-8th Consolidated Grand Total Abstract', statsGrandTotal, 'bg-slate-900')}

        {/* Bottom Signatures: Exactly as requested by user:
            "ಮುಖ್ಯ ಶಿಕ್ಷಕರ ಸಹಿ (HM Sign), ಸಮೂಹ ಸಂಪನ್ಮೂಲ ವ್ಯಕ್ತಿಯ ಸಹಿ( CRP Sign) ಶಿಕ್ಷಣ ಸಂಯೇಜಕರ ಸಹಿ (ECO Sign)"
            Distributed along the page width and should not overlap and should not go next line */}
        <div className="w-full pt-6 pb-2 border-t-2 border-slate-900 mt-6">
          <div className="grid grid-cols-3 w-full text-center items-center justify-between gap-4 text-xs font-black text-slate-950">
            <div className="whitespace-nowrap px-2">
              <span>ಮುಖ್ಯ ಶಿಕ್ಷಕರ ಸಹಿ (HM Sign)</span>
            </div>
            <div className="whitespace-nowrap px-2">
              <span>ಸಮೂಹ ಸಂಪನ್ಮೂಲ ವ್ಯಕ್ತಿಯ ಸಹಿ (CRP Sign)</span>
            </div>
            <div className="whitespace-nowrap px-2">
              <span>ಶಿಕ್ಷಣ ಸಂಯೋಜಕರ ಸಹಿ (ECO Sign)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
