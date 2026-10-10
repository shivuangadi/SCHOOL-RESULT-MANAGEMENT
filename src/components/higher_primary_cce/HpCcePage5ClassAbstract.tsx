import React, { useState, useMemo } from 'react';
import { Student, SchoolRecord, isCwsnExempted } from '../../types';
import {
  HpSubjectInfo,
  getHpSubjectsForMedium,
} from '../../utils/higherPrimaryCceHelper';
import {
  Printer,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface HpCcePage5ClassAbstractProps {
  students: Student[];
  marksMap: Record<string, any>;
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  reportRef?: React.RefObject<HTMLDivElement | null>;
}

interface GradeCount {
  boys: number;
  girls: number;
  total: number;
}

interface SubjectGradeSummary {
  subjectName: string;
  subjectCode: string;
  aPlus: GradeCount;
  a: GradeCount;
  bPlus: GradeCount;
  b: GradeCount;
  cPlus: GradeCount;
  c: GradeCount;
  d: GradeCount;
  exempt: GradeCount;
  total: GradeCount;
}

export const HpCcePage5ClassAbstract: React.FC<HpCcePage5ClassAbstractProps> = ({
  students,
  marksMap,
  schoolRecord,
  academicYear,
  reportRef,
}) => {
  // Dropdown for CLASS 1-8
  const [selectedClassOption, setSelectedClassOption] = useState<string>('ALL');

  const medium = schoolRecord?.schoolMedium || 'Kannada';
  const schoolName = schoolRecord?.schoolName || 'ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ';
  const diseCode = schoolRecord?.diseCode || '';
  const clusterName = schoolRecord?.cluster || schoolRecord?.crcCluster || '';
  const talukName = schoolRecord?.taluk || '';

  // Filter students based on dropdown
  const filteredStudents = useMemo(() => {
    if (selectedClassOption === 'ALL') {
      return students.filter((s) => {
        const c = Number(s.classStandard);
        return c >= 1 && c <= 8;
      });
    }
    return students.filter((s) => String(s.classStandard) === selectedClassOption);
  }, [students, selectedClassOption]);

  // Compute grade summary for subjects
  const subjects = useMemo(() => {
    return getHpSubjectsForMedium(medium);
  }, [medium]);

  const summaryData: SubjectGradeSummary[] = useMemo(() => {
    const list: SubjectGradeSummary[] = subjects.map((sub) => {
      const initialCount = (): GradeCount => ({ boys: 0, girls: 0, total: 0 });

      const sum: SubjectGradeSummary = {
        subjectName: sub.nameKn,
        subjectCode: sub.code,
        aPlus: initialCount(),
        a: initialCount(),
        bPlus: initialCount(),
        b: initialCount(),
        cPlus: initialCount(),
        c: initialCount(),
        d: initialCount(),
        exempt: initialCount(),
        total: initialCount(),
      };

      filteredStudents.forEach((st) => {
        const isGirl = st.gender === 'Girl';
        const isExempt = isCwsnExempted(st.cwsnStatus);

        sum.total.total++;
        if (isGirl) sum.total.girls++;
        else sum.total.boys++;

        if (isExempt) {
          sum.exempt.total++;
          if (isGirl) sum.exempt.girls++;
          else sum.exempt.boys++;
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

        const addG = (gc: GradeCount) => {
          gc.total++;
          if (isGirl) gc.girls++;
          else gc.boys++;
        };

        if (g === 'A+') addG(sum.aPlus);
        else if (g === 'A') addG(sum.a);
        else if (g === 'B+') addG(sum.bPlus);
        else if (g === 'B') addG(sum.b);
        else if (g === 'C+') addG(sum.cPlus);
        else if (g === 'C') addG(sum.c);
        else addG(sum.d);
      });

      return sum;
    });

    return list;
  }, [subjects, filteredStudents, marksMap]);

  const handleExportExcel = () => {
    const wsData: any[][] = [
      [schoolName],
      [`DISE: ${diseCode} | TALUK: ${talukName} | ACADEMIC YEAR: ${academicYear}`],
      [`ABSTRACT OF GRADES (ವಿಷಯವಾರು ಹಾಗೂ ಶ್ರೇಣಿವಾರು ಘೋಷವಾರ) - CLASS: ${selectedClassOption === 'ALL' ? 'CLASSES 1 TO 8' : `CLASS ${selectedClassOption}`}`],
      [],
      [
        'ವಿಷಯ (Subject)',
        'A+ (90-100) B', 'A+ G', 'A+ Total',
        'A (80-89) B', 'A G', 'A Total',
        'B+ (70-79) B', 'B+ G', 'B+ Total',
        'B (60-69) B', 'B G', 'B Total',
        'C+ (50-59) B', 'C+ G', 'C+ Total',
        'C (35-49) B', 'C G', 'C Total',
        'D (<35) B', 'D G', 'D Total',
        'Exempt',
        'Grand Total B', 'Grand Total G', 'Grand Total',
      ],
    ];

    summaryData.forEach((row) => {
      wsData.push([
        row.subjectName,
        row.aPlus.boys, row.aPlus.girls, row.aPlus.total,
        row.a.boys, row.a.girls, row.a.total,
        row.bPlus.boys, row.bPlus.girls, row.bPlus.total,
        row.b.boys, row.b.girls, row.b.total,
        row.cPlus.boys, row.cPlus.girls, row.cPlus.total,
        row.c.boys, row.c.girls, row.c.total,
        row.d.boys, row.d.girls, row.d.total,
        row.exempt.total,
        row.total.boys, row.total.girls, row.total.total,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Grade_Abstract');
    XLSX.writeFile(wb, `Grade_Abstract_Class_${selectedClassOption}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Control Toolbar with Dropdown for CLASS 1-8 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-300 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-800">ತರಗತಿ ಆಯ್ಕೆಮಾಡಿ (Class Dropdown 1-8):</span>
          <select
            value={selectedClassOption}
            onChange={(e) => setSelectedClassOption(e.target.value)}
            className="px-3 py-1.5 bg-blue-50 border border-blue-400 font-black text-xs text-blue-950 rounded-xl focus:outline-blue-500 cursor-pointer shadow-xs"
          >
            <option value="ALL">CLASS 1-8 (ಎಲ್ಲಾ ತರಗತಿಗಳು 1 ರಿಂದ 8)</option>
            <option value="1">1ನೇ ತರಗತಿ (Class 1)</option>
            <option value="2">2ನೇ ತರಗತಿ (Class 2)</option>
            <option value="3">3ನೇ ತರಗತಿ (Class 3)</option>
            <option value="4">4ನೇ ತರಗತಿ (Class 4)</option>
            <option value="5">5ನೇ ತರಗತಿ (Class 5)</option>
            <option value="6">6ನೇ ತರಗತಿ (Class 6)</option>
            <option value="7">7ನೇ ತರಗತಿ (Class 7)</option>
            <option value="8">8ನೇ ತರಗತಿ (Class 8)</option>
          </select>
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

      {/* Main Abstract Sheet */}
      <div
        ref={reportRef}
        className="bg-white p-6 rounded-2xl border border-slate-300 shadow-md space-y-4 legal-landscape print:p-2 print:border-none print:shadow-none"
      >
        <div className="text-center space-y-1 border-b-2 border-slate-900 pb-3">
          <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
            ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ, {talukName}
          </p>
          <h2 className="text-base font-black text-slate-950 font-serif">
            {schoolName} • DISE: {diseCode}
          </h2>
          <h3 className="text-xs font-black text-blue-950">
            {academicYear} ನೇ ಸಾಲಿನ ವಾರ್ಷಿಕ ಪರೀಕ್ಷೆಯ ವಿಷಯವಾರು ಹಾಗೂ ಶ್ರೇಣಿವಾರು ಫಲಿತಾಂಶ ಘೋಷವಾರ (Page 5: Abstract of Grades)
          </h3>
          <p className="text-xs font-bold text-slate-700">
            ಆಯ್ಕೆಮಾಡಲಾದ ತರಗತಿ: <span className="font-black text-slate-950">{selectedClassOption === 'ALL' ? '1 ರಿಂದ 8 ನೇ ತರಗತಿಗಳು (CLASS 1-8)' : `${selectedClassOption}ನೇ ತರಗತಿ (Class ${selectedClassOption})`}</span> • ಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು: <span className="font-mono font-black text-blue-700">{filteredStudents.length}</span>
          </p>
        </div>

        {/* Abstract Table */}
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-[9px] text-center border-collapse border border-slate-900 table-fixed">
            <thead>
              <tr className="bg-slate-100 font-black text-slate-950 border-b border-slate-900">
                <th rowSpan={2} className="border border-slate-900 p-1 w-[120px] text-left">ವಿಷಯಗಳು (Subjects)</th>
                <th colSpan={3} className="border border-slate-900 p-0.5 bg-emerald-100 text-emerald-950">A+ (90-100)</th>
                <th colSpan={3} className="border border-slate-900 p-0.5 bg-emerald-50 text-emerald-900">A (80-89)</th>
                <th colSpan={3} className="border border-slate-900 p-0.5 bg-blue-100 text-blue-950">B+ (70-79)</th>
                <th colSpan={3} className="border border-slate-900 p-0.5 bg-blue-50 text-blue-900">B (60-69)</th>
                <th colSpan={3} className="border border-slate-900 p-0.5 bg-yellow-100 text-yellow-950">C+ (50-59)</th>
                <th colSpan={3} className="border border-slate-900 p-0.5 bg-yellow-50 text-yellow-900">C (35-49)</th>
                <th colSpan={3} className="border border-slate-900 p-0.5 bg-red-100 text-red-950">D (&lt;35)</th>
                <th rowSpan={2} className="border border-slate-900 p-0.5 bg-purple-100 text-purple-950 w-[35px]">Exempt</th>
                <th colSpan={3} className="border border-slate-900 p-0.5 bg-slate-200 text-slate-950 font-black">ಒಟ್ಟು (Total)</th>
              </tr>
              <tr className="bg-slate-50 text-[8px] font-bold text-slate-800 border-b border-slate-900">
                <th className="border border-slate-900 p-0.5">ಬಾ</th>
                <th className="border border-slate-900 p-0.5">ಬಾಕಿ</th>
                <th className="border border-slate-900 p-0.5 font-black">ಒ</th>
                <th className="border border-slate-900 p-0.5">ಬಾ</th>
                <th className="border border-slate-900 p-0.5">ಬಾಕಿ</th>
                <th className="border border-slate-900 p-0.5 font-black">ಒ</th>
                <th className="border border-slate-900 p-0.5">ಬಾ</th>
                <th className="border border-slate-900 p-0.5">ಬಾಕಿ</th>
                <th className="border border-slate-900 p-0.5 font-black">ಒ</th>
                <th className="border border-slate-900 p-0.5">ಬಾ</th>
                <th className="border border-slate-900 p-0.5">ಬಾಕಿ</th>
                <th className="border border-slate-900 p-0.5 font-black">ಒ</th>
                <th className="border border-slate-900 p-0.5">ಬಾ</th>
                <th className="border border-slate-900 p-0.5">ಬಾಕಿ</th>
                <th className="border border-slate-900 p-0.5 font-black">ಒ</th>
                <th className="border border-slate-900 p-0.5">ಬಾ</th>
                <th className="border border-slate-900 p-0.5">ಬಾಕಿ</th>
                <th className="border border-slate-900 p-0.5 font-black">ಒ</th>
                <th className="border border-slate-900 p-0.5">ಬಾ</th>
                <th className="border border-slate-900 p-0.5">ಬಾಕಿ</th>
                <th className="border border-slate-900 p-0.5 font-black">ಒ</th>
                <th className="border border-slate-900 p-0.5">ಬಾ</th>
                <th className="border border-slate-900 p-0.5">ಬಾಕಿ</th>
                <th className="border border-slate-900 p-0.5 font-black">ಒ</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map((row) => (
                <tr key={row.subjectCode} className="border-b border-slate-300 hover:bg-slate-50 font-mono">
                  <td className="border border-slate-900 p-1 text-left font-sans font-bold text-slate-900">
                    {row.subjectName}
                  </td>
                  {/* A+ */}
                  <td className="border border-slate-900 p-0.5">{row.aPlus.boys}</td>
                  <td className="border border-slate-900 p-0.5">{row.aPlus.girls}</td>
                  <td className="border border-slate-900 p-0.5 font-black bg-emerald-50">{row.aPlus.total}</td>
                  {/* A */}
                  <td className="border border-slate-900 p-0.5">{row.a.boys}</td>
                  <td className="border border-slate-900 p-0.5">{row.a.girls}</td>
                  <td className="border border-slate-900 p-0.5 font-black bg-emerald-50">{row.a.total}</td>
                  {/* B+ */}
                  <td className="border border-slate-900 p-0.5">{row.bPlus.boys}</td>
                  <td className="border border-slate-900 p-0.5">{row.bPlus.girls}</td>
                  <td className="border border-slate-900 p-0.5 font-black bg-blue-50">{row.bPlus.total}</td>
                  {/* B */}
                  <td className="border border-slate-900 p-0.5">{row.b.boys}</td>
                  <td className="border border-slate-900 p-0.5">{row.b.girls}</td>
                  <td className="border border-slate-900 p-0.5 font-black bg-blue-50">{row.b.total}</td>
                  {/* C+ */}
                  <td className="border border-slate-900 p-0.5">{row.cPlus.boys}</td>
                  <td className="border border-slate-900 p-0.5">{row.cPlus.girls}</td>
                  <td className="border border-slate-900 p-0.5 font-black bg-yellow-50">{row.cPlus.total}</td>
                  {/* C */}
                  <td className="border border-slate-900 p-0.5">{row.c.boys}</td>
                  <td className="border border-slate-900 p-0.5">{row.c.girls}</td>
                  <td className="border border-slate-900 p-0.5 font-black bg-yellow-50">{row.c.total}</td>
                  {/* D */}
                  <td className="border border-slate-900 p-0.5">{row.d.boys}</td>
                  <td className="border border-slate-900 p-0.5">{row.d.girls}</td>
                  <td className="border border-slate-900 p-0.5 font-black bg-red-50">{row.d.total}</td>
                  {/* Exempt */}
                  <td className="border border-slate-900 p-0.5 font-black bg-purple-50 text-purple-900">{row.exempt.total}</td>
                  {/* Total */}
                  <td className="border border-slate-900 p-0.5 font-bold">{row.total.boys}</td>
                  <td className="border border-slate-900 p-0.5 font-bold">{row.total.girls}</td>
                  <td className="border border-slate-900 p-0.5 font-black bg-slate-100">{row.total.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 text-center text-xs font-bold text-slate-900 pt-6 border-t border-slate-300">
          <div className="text-left pl-6">
            ವರ್ಗ ಶಿಕ್ಷಕರ ಸಹಿ<br />
            <span className="text-[10px] text-slate-600 font-normal">Class Teacher Sign</span>
          </div>
          <div className="text-right pr-6">
            ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಸಹಿ & ಮೊಹರು<br />
            <span className="text-[10px] text-slate-600 font-normal">Head Master Sign & Seal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
