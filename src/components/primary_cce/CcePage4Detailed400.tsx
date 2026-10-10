import React, { useState } from 'react';
import { SchoolRecord, isCwsnStudent, isCwsnExempted } from '../../types';
import {
  ComputedStudentCce,
  CO_SCHOLASTIC_ACTIVITIES,
  extractLastWordOfSchoolName,
  PrimarySubjectCode,
} from '../../utils/primaryCceHelper';
import { calculateGrade } from '../../data/demoData';

interface CcePage4Detailed400Props {
  computedList: ComputedStudentCce[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  selectedClass: string;
  classTeacherName: string;
  workingDays: number;
  reportRef?: React.RefObject<HTMLDivElement | null>;
  onUpdateMarks?: (studentId: string, subCode: PrimarySubjectCode, field: string, val: number) => void;
  onUpdateExamPct?: (studentId: string, subCode: PrimarySubjectCode, exam: 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2', val: number) => void;
  onUpdateSubject100?: (studentId: string, subCode: PrimarySubjectCode, mark100: number) => void;
  onUpdateSemAttendance?: (studentId: string, sem: 'sem1' | 'sem2', days: number) => void;
  onUpdateAttendance?: (studentId: string, days: number) => void;
  onUpdateCoScholastic?: (studentId: string, sem: 'sem1' | 'sem2', key: string, val: string) => void;
}

export const CcePage4Detailed400: React.FC<CcePage4Detailed400Props> = ({
  computedList,
  schoolRecord,
  academicYear,
  selectedClass,
  classTeacherName,
  workingDays,
  reportRef,
  onUpdateMarks,
  onUpdateExamPct,
  onUpdateSubject100,
  onUpdateSemAttendance,
  onUpdateAttendance,
  onUpdateCoScholastic,
}) => {
  const defaultPlace = extractLastWordOfSchoolName(schoolRecord?.schoolName);
  const [placeName, setPlaceName] = useState(defaultPlace);
  const isKannada =
    (schoolRecord?.medium || (schoolRecord as any)?.schoolMedium || '').toLowerCase().includes('kannada') ||
    (schoolRecord?.medium || (schoolRecord as any)?.schoolMedium || '').includes('ಕನ್ನಡ') ||
    !(schoolRecord?.medium || (schoolRecord as any)?.schoolMedium);
  
  // Default: 3 students per page as requested by user
  const [studentsPerPage, setStudentsPerPage] = useState<number>(3);

  // Group students into chunks strictly per sheet so no student is ever split across pages
  const chunks: ComputedStudentCce[][] = [];
  for (let i = 0; i < computedList.length; i += studentsPerPage) {
    chunks.push(computedList.slice(i, i + studentsPerPage));
  }
  if (chunks.length === 0) chunks.push([]);

  return (
    <div ref={reportRef} className="space-y-4 legal-landscape">
      {/* Top Configuration Bar (Hidden in Print & PDF export) */}
      <div className="bg-slate-900 text-white p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs print:hidden shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-300">📄 ಪುಟ ವಿನ್ಯಾಸ (Page Setup):</span>
          <span>ಒಂದು ಪುಟಕ್ಕೆ ವಿದ್ಯಾರ್ಥಿಗಳು:</span>
          <select
            value={studentsPerPage}
            onChange={(e) => setStudentsPerPage(Number(e.target.value))}
            className="bg-slate-800 text-amber-300 font-bold border border-slate-600 rounded px-2 py-1 cursor-pointer focus:outline-none"
          >
            <option value={3}>೩ ವಿದ್ಯಾರ್ಥಿಗಳು / ಪುಟ (3 Students/Page - Official Standard)</option>
            <option value={2}>೨ ವಿದ್ಯಾರ್ಥಿಗಳು / ಪುಟ (2 Students/Page)</option>
            <option value={1}>೧ ವಿದ್ಯಾರ್ಥಿ / ಪುಟ (1 Student/Page)</option>
          </select>
        </div>
        <div className="text-slate-300 text-[11px]">
          ಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು: <span className="font-mono text-white font-black">{computedList.length}</span> • 
          ಒಟ್ಟು ಪುಟಗಳು: <span className="font-mono text-amber-300 font-black">{chunks.length}</span>
        </div>
      </div>

      {/* Render Clean Page Sheets (2cm Left Margin for Binding: pl-[20mm] print:pl-0) */}
      {chunks.map((chunk, chunkIdx) => (
        <div
          key={chunkIdx}
          className="report-page-sheet bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-300 shadow-sm space-y-1.5 print:p-0 print:border-none print:shadow-none print:break-after-page mb-4"
        >
          {/* Official Header per Page */}
          <div className="text-center space-y-0.5 border-b-2 border-slate-900 pb-1.5">
            <h2 className="text-xs sm:text-[13px] font-black text-slate-950 font-serif leading-tight">
              {isKannada
                ? `ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ ${schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ'}`
                : `Office of the Block Education Officer and Block Resource Coordinator, ${schoolRecord?.taluk || 'Belagavi Rural'}`}
            </h2>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
              {schoolRecord?.schoolName || 'ಸರಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಕನ್ನಡ ಶಾಲೆ ನಿಂಗ್ಯಾನಟ್ಟಿ'}
            </h3>
            <p className="text-[10px] font-bold text-slate-800">
              {academicYear} ನೇ ಸಾಲಿನ ವಿಷಯವಾರು ರೂಪನಾತ್ಮಕ ಹಾಗೂ ಸಂಕಲನಾತ್ಮಕ ಮೌಲ್ಯಮಾಪನ ಕ್ರೋಢೀಕರಣ ವಹಿ (All Subject Consolidation - 400 Marks)
            </p>

            {/* Sub-header info: equally distributed along width, centered, equidistant, no overlap */}
            <div className="grid grid-cols-3 items-center text-center text-[9.5px] sm:text-[10px] font-bold text-slate-900 pt-1 pb-0.5 px-1 w-full gap-2 border-t border-slate-200">
              <div className="flex justify-center items-center">
                <span className="bg-amber-100 text-amber-950 px-2.5 py-0.5 rounded border border-amber-300 font-black whitespace-nowrap">
                  ತರಗತಿ: {selectedClass}ನೇ ತರಗತಿ
                </span>
              </div>
              <div className="flex justify-center items-center text-slate-900 whitespace-nowrap">
                <span>
                  ಶಾಲೆ ನಡೆದ ದಿನಗಳ ಸಂಖ್ಯೆ: <span className="font-mono font-black text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">{workingDays}</span>
                </span>
              </div>
              <div className="flex justify-center items-center text-slate-900 whitespace-nowrap">
                <span>
                  ವರ್ಗ ಶಿಕ್ಷಕರ ಹೆಸರು: <span className="font-black text-slate-950">{classTeacherName || 'ವರ್ಗ ಶಿಕ್ಷಕರು'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Main 400 Marks Table */}
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[1050px] print:min-w-0 text-[8px] sm:text-[8.5px] text-center border-collapse border-2 border-slate-900 table-fixed">
              <thead>
                {/* Header Row 1 */}
                <tr className="bg-slate-100 font-bold text-slate-900 border-b border-slate-900">
                  {/* 1. Sl No - Vertical Bottom to Top (Reads left to right when turning page left) */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-6 align-middle bg-slate-50">
                    <span
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      className="inline-block whitespace-nowrap font-black text-[8px] py-0.5 mx-auto text-center"
                    >
                      ಕ್ರ. ಸಂಖ್ಯೆ
                    </span>
                  </th>

                  {/* 2. Reg No - Vertical Bottom to Top */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-7 align-middle bg-slate-50">
                    <span
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      className="inline-block whitespace-nowrap font-black text-[8px] py-0.5 mx-auto text-center"
                    >
                      ದಾಖಲಾತಿ ಸಂಖ್ಯೆ
                    </span>
                  </th>

                  {/* 3. Student Name - Horizontal Centered */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-32 align-middle text-center font-black text-[10px]">
                    ವಿದ್ಯಾರ್ಥಿಗಳ ಹೆಸರು
                  </th>

                  {/* 4. Days Attended - Vertical Bottom to Top */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-8 align-middle bg-slate-50">
                    <span
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      className="inline-block whitespace-nowrap font-black text-[8px] py-0.5 mx-auto text-center"
                    >
                      ಹಾಜರಾದ ದಿನಗಳು
                    </span>
                  </th>

                  {/* 5. Exam Period - Vertical Bottom to Top */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-7 align-middle bg-slate-50">
                    <span
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      className="inline-block whitespace-nowrap font-black text-[8px] py-0.5 mx-auto text-center"
                    >
                      ಮೌಲ್ಯಮಾಪನದ ಅವಧಿ
                    </span>
                  </th>

                  {/* 6. Percentage - Vertical Bottom to Top */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-7 align-middle bg-slate-50">
                    <span
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      className="inline-block whitespace-nowrap font-black text-[8px] py-0.5 mx-auto text-center"
                    >
                      ಶೇಕಡಾ ಪ್ರಮಾಣ
                    </span>
                  </th>

                  {/* 7. Scholastic Group Header (RED) */}
                  <th colSpan={8} className="border border-slate-900 p-0.5 bg-red-50 text-red-600 font-black text-[9.5px] border-r-2">
                    ಅ. ವಿದ್ಯಾರ್ಥಿಯ ಶೈಕ್ಷಣಿಕ ಸಾಧನೆ ಪಠ್ಯ ವಿಷಯಗಳಿಗೆ ಸಂಬಂಧಿಸಿದಂತೆ
                  </th>

                  {/* 8. Max Marks (400) */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 bg-amber-50 w-7 font-black align-middle text-[8px]">
                    ಗರಿಷ್ಠ<br />
                    <span className="font-mono text-[10px] font-black">400</span>
                  </th>

                  {/* 9. Total Obtained Header */}
                  <th colSpan={3} className="border border-slate-900 p-0.5 bg-amber-100/80 font-black text-slate-950 text-[9px]">
                    ಒಟ್ಟು ಪಡೆದ ಅಂಕಗಳು
                  </th>

                  {/* 10. Co-Scholastic Group Header (RED with left border) */}
                  <th colSpan={5} className="border border-slate-900 p-0.5 bg-red-50 text-red-600 font-black text-[9.5px] border-l-2 border-l-red-600">
                    ಆ. ಸಹ ಪಠ್ಯ ವಿಷಯದ ಶ್ರೇಣಿಗಳು
                  </th>

                  {/* 11. Result Header (RED Vertical Bottom to Top) */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-7 bg-emerald-50 text-red-600 font-black align-middle">
                    <span
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      className="inline-block whitespace-nowrap font-black text-[8.5px] py-0.5 mx-auto text-center"
                    >
                      ಫಲಿತಾಂಶ
                    </span>
                  </th>
                </tr>

                {/* Sub-Header Row 2 */}
                <tr className="bg-slate-50 text-[8px] font-bold text-slate-800 border-b border-slate-900">
                  <th colSpan={2} className="border border-slate-900 p-0.5">ಪ್ರಥಮ ಭಾಷೆ</th>
                  <th colSpan={2} className="border border-slate-900 p-0.5">ದ್ವಿತೀಯ ಭಾಷೆ</th>
                  <th colSpan={2} className="border border-slate-900 p-0.5">ಗಣಿತ</th>
                  <th colSpan={2} className="border border-slate-900 p-0.5">ಪರಿಸರ ಅಧ್ಯಯನ</th>

                  <th rowSpan={2} className="border border-slate-900 p-0.5 w-6 font-black">ಅಂಕ</th>
                  <th rowSpan={2} className="border border-slate-900 p-0.5 w-7 font-black">ಶೇಕಡಾ</th>
                  <th rowSpan={2} className="border border-slate-900 p-0.5 w-5 font-black">ಶ್ರೇಣಿ</th>

                  {/* Co-scholastic activities (Vertical Bottom to Top) */}
                  {CO_SCHOLASTIC_ACTIVITIES.map((act, actIdx) => (
                    <th
                      key={act.key}
                      rowSpan={2}
                      className={`border border-slate-900 p-0.5 w-6 sm:w-7 align-middle bg-slate-50 ${actIdx === 0 ? 'border-l-2 border-l-red-600' : ''}`}
                    >
                      <span
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        className="inline-block whitespace-nowrap font-bold text-[7.5px] py-0.5 mx-auto text-center"
                      >
                        {act.nameKn}
                      </span>
                    </th>
                  ))}
                </tr>

                {/* Sub-Header Row 3: ಅಂಕ & ಶ್ರೇಣಿ for all 4 Subjects */}
                <tr className="bg-slate-100 text-[8px] font-black text-slate-900 border-b-2 border-slate-900">
                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">ಅಂಕ</th>
                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">ಶ್ರೇಣಿ</th>

                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">ಅಂಕ</th>
                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">ಶ್ರೇಣಿ</th>

                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">ಅಂಕ</th>
                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">ಶ್ರೇಣಿ</th>

                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">ಅಂಕ</th>
                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">ಶ್ರೇಣಿ</th>
                </tr>
              </thead>
              {/* Multi-Tbody per student so that page breaks NEVER split a student across sheets */}
              {chunk.map((cSt, idxInChunk) => {
                const globalIdx = chunkIdx * studentsPerPage + idxInChunk;
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
                  <tbody key={st.id} className="student-tbody border-b-2 border-slate-900 break-inside-avoid print:break-inside-avoid">
                    {rowsData.map((r, rIdx) => {
                      const isRow0 = rIdx === 0;
                      const isRow4 = rIdx === 4;
                      const isRow8 = rIdx === 8;
                      const isTotalRow = r.isSem1Total || r.isSem2Total || r.isFinalTotal;

                      return (
                        <tr
                          key={rIdx}
                          className={`border-b border-slate-300 text-[8px] sm:text-[8.5px] ${
                            r.isFinalTotal
                              ? 'bg-amber-100 font-black border-b-2 border-slate-900 text-red-600'
                              : isTotalRow
                              ? 'bg-yellow-50 font-black border-b border-dashed border-amber-400 text-red-600'
                              : 'hover:bg-slate-50 text-slate-900'
                          }`}
                        >
                          {/* 1. Sl No - Spans 9 Rows */}
                          {isRow0 && (
                            <td rowSpan={9} className="border border-slate-900 p-0.5 font-mono font-bold align-middle bg-white text-center">
                              {globalIdx + 1}
                            </td>
                          )}

                          {/* 2. Registered No - Spans 9 Rows - VERTICAL BOTTOM TO TOP */}
                          {isRow0 && (
                            <td rowSpan={9} className="border border-slate-900 p-0.5 font-mono font-bold align-middle bg-white text-center">
                              <span
                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                className="inline-block whitespace-nowrap text-center py-1 mx-auto text-[8px]"
                              >
                                {st.schoolRegNo || (st as any).admissionNo || `${120 + globalIdx + 1}/2020-21`}
                              </span>
                            </td>
                          )}

                          {/* 3. Student Name - Spans 9 Rows - ALIGNED CENTRE NO DIVIDING LINE TO CASTE */}
                          {isRow0 && (
                            <td rowSpan={9} className="border border-slate-900 p-0.5 text-center align-middle bg-white min-w-[120px]">
                              <div className="font-black text-slate-950 text-[9.5px] tracking-tight">
                                {st.studentName}
                              </div>
                              {hasCwsnBadge && (
                                <div className="my-0.5">
                                  <span className="inline-block bg-purple-700 text-white font-extrabold px-1.5 py-0.2 rounded text-[7.5px] shadow-xs">
                                    (CWSN)
                                  </span>
                                </div>
                              )}
                              <div className="mt-0.5 text-[8px] text-slate-700 font-mono space-y-0.2">
                                <div><span className="font-bold">CASTE:</span> {st.caste || 'GM'}</div>
                                <div><span className="font-bold">DOB:</span> {st.dob || st.dateOfBirth || '01/06/2016'}</div>
                                <div><span className="font-bold">SATS:</span> {st.satsNo || 'N/A'}</div>
                              </div>
                            </td>
                          )}

                          {/* 4. Column 4: ATTENDANCE for Sem 1, Sem 2 & Total (Sum never exceeds workingDays) */}
                          {isRow0 && (
                            <td rowSpan={4} className="border border-slate-900 p-0.5 text-center align-middle font-bold bg-white">
                              <div className="text-slate-800 text-[8px]">1ನೇ Sem</div>
                              {onUpdateSemAttendance ? (
                                <input
                                  type="number"
                                  min="0"
                                  max={Math.max(0, workingDays - (cSt.sem2Attendance || 0))}
                                  value={cSt.sem1Attendance}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    const maxAllowed = Math.max(0, workingDays - (cSt.sem2Attendance || 0));
                                    const clamped = Math.max(0, Math.min(val, maxAllowed));
                                    onUpdateSemAttendance(st.id, 'sem1', clamped);
                                  }}
                                  className="w-full text-center font-mono font-black text-blue-900 text-[9.5px] mt-0.5 bg-transparent border-b border-blue-300 focus:outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  title={`Edit Sem 1 Attendance (Max: ${Math.max(0, workingDays - (cSt.sem2Attendance || 0))})`}
                                />
                              ) : (
                                <div className="font-mono font-black text-blue-900 text-[9.5px] mt-0.5">
                                  {cSt.sem1Attendance}
                                </div>
                              )}
                            </td>
                          )}
                          {isRow4 && (
                            <td rowSpan={4} className="border border-slate-900 p-0.5 text-center align-middle font-bold bg-white">
                              <div className="text-slate-800 text-[8px]">2ನೇ Sem</div>
                              {onUpdateSemAttendance ? (
                                <input
                                  type="number"
                                  min="0"
                                  max={Math.max(0, workingDays - (cSt.sem1Attendance || 0))}
                                  value={cSt.sem2Attendance}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    const maxAllowed = Math.max(0, workingDays - (cSt.sem1Attendance || 0));
                                    const clamped = Math.max(0, Math.min(val, maxAllowed));
                                    onUpdateSemAttendance(st.id, 'sem2', clamped);
                                  }}
                                  className="w-full text-center font-mono font-black text-indigo-900 text-[9.5px] mt-0.5 bg-transparent border-b border-indigo-300 focus:outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  title={`Edit Sem 2 Attendance (Max: ${Math.max(0, workingDays - (cSt.sem1Attendance || 0))})`}
                                />
                              ) : (
                                <div className="font-mono font-black text-indigo-900 text-[9.5px] mt-0.5">
                                  {cSt.sem2Attendance}
                                </div>
                              )}
                            </td>
                          )}
                          {isRow8 && (
                            <td className="border border-slate-900 p-0.5 text-center align-middle font-black bg-amber-100 text-red-600">
                              <div className="text-[8px]">Total</div>
                              <div className="font-mono text-[9.5px] font-black">
                                {cSt.attendanceDays}
                              </div>
                            </td>
                          )}

                          {/* 5. Exam Period */}
                          <td className={`border border-slate-900 p-0.5 font-bold ${isTotalRow ? 'bg-amber-100 text-red-600 font-black' : 'text-slate-900'}`}>
                            {r.exam}
                          </td>

                          {/* 6. Percentage */}
                          <td className={`border border-slate-900 p-0.5 font-mono font-bold ${isTotalRow ? 'bg-amber-100 text-red-600 font-black' : 'text-slate-800'}`}>
                            {r.pct}
                          </td>

                          {/* 7. FL (Mark, Grade) - 2-Way Synchronized */}
                          <td className={`border border-slate-900 p-0.5 font-mono ${isTotalRow ? 'text-red-600 font-bold' : ''}`}>
                            {isExempted ? (
                              '-'
                            ) : r.isFinalTotal && onUpdateSubject100 ? (
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={r.fl !== null && r.fl !== undefined ? r.fl : ''}
                                onChange={(e) => {
                                  const v = e.target.value.trim();
                                  if (v === '') onUpdateSubject100(st.id, 'FL', null as any);
                                  else {
                                    const n = Number(v);
                                    if (!isNaN(n)) onUpdateSubject100(st.id, 'FL', Math.min(100, Math.max(0, Math.floor(n))));
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-yellow-100 focus:bg-white font-mono font-black text-red-600 border-b border-red-300 focus:outline-none text-[9.5px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="-"
                                title="Edit First Language 100 Marks (2-way sync)"
                              />
                            ) : r.subKey && (onUpdateExamPct || onUpdateMarks) ? (
                              <input
                                type="number"
                                min="0"
                                max={r.rawMax || 15}
                                value={r.fl !== null && r.fl !== undefined ? r.fl : ''}
                                onChange={(e) => {
                                  const v = e.target.value.trim();
                                  const maxVal = r.rawMax || 15;
                                  if (v === '') {
                                    if (onUpdateExamPct) onUpdateExamPct(st.id, 'FL', r.subKey!, null as any);
                                    else if (onUpdateMarks) onUpdateMarks(st.id, 'FL', r.subKey!, null as any);
                                  } else {
                                    const n = Number(v);
                                    if (!isNaN(n)) {
                                      const clamped = Math.min(maxVal, Math.max(0, Math.floor(n)));
                                      if (onUpdateExamPct) onUpdateExamPct(st.id, 'FL', r.subKey!, clamped);
                                      else if (onUpdateMarks) onUpdateMarks(st.id, 'FL', r.subKey!, clamped);
                                    }
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-blue-50 focus:bg-white font-mono font-bold text-slate-900 border-b border-slate-300 focus:outline-none text-[9.5px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="-"
                                title={`Edit FL marks (Max ${r.rawMax || 15})`}
                              />
                            ) : (
                              r.fl !== null && r.fl !== undefined ? r.fl : '-'
                            )}
                          </td>
                          <td className={`border border-slate-900 p-0.5 font-bold ${
                            r.isFinalTotal ? 'text-green-600 font-black' : isTotalRow ? 'text-red-600 font-bold' : ''
                          }`}>
                            {isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : (r.flG || '-')}
                          </td>

                          {/* 8. SL (Mark, Grade) - 2-Way Synchronized */}
                          <td className={`border border-slate-900 p-0.5 font-mono ${isTotalRow ? 'text-red-600 font-bold' : ''}`}>
                            {isExempted ? (
                              '-'
                            ) : r.isFinalTotal && onUpdateSubject100 ? (
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={r.sl !== null && r.sl !== undefined ? r.sl : ''}
                                onChange={(e) => {
                                  const v = e.target.value.trim();
                                  if (v === '') onUpdateSubject100(st.id, 'SL', null as any);
                                  else {
                                    const n = Number(v);
                                    if (!isNaN(n)) onUpdateSubject100(st.id, 'SL', Math.min(100, Math.max(0, Math.floor(n))));
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-yellow-100 focus:bg-white font-mono font-black text-red-600 border-b border-red-300 focus:outline-none text-[9.5px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="-"
                                title="Edit Second Language 100 Marks (2-way sync)"
                              />
                            ) : r.subKey && (onUpdateExamPct || onUpdateMarks) ? (
                              <input
                                type="number"
                                min="0"
                                max={r.rawMax || 15}
                                value={r.sl !== null && r.sl !== undefined ? r.sl : ''}
                                onChange={(e) => {
                                  const v = e.target.value.trim();
                                  const maxVal = r.rawMax || 15;
                                  if (v === '') {
                                    if (onUpdateExamPct) onUpdateExamPct(st.id, 'SL', r.subKey!, null as any);
                                    else if (onUpdateMarks) onUpdateMarks(st.id, 'SL', r.subKey!, null as any);
                                  } else {
                                    const n = Number(v);
                                    if (!isNaN(n)) {
                                      const clamped = Math.min(maxVal, Math.max(0, Math.floor(n)));
                                      if (onUpdateExamPct) onUpdateExamPct(st.id, 'SL', r.subKey!, clamped);
                                      else if (onUpdateMarks) onUpdateMarks(st.id, 'SL', r.subKey!, clamped);
                                    }
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-blue-50 focus:bg-white font-mono font-bold text-slate-900 border-b border-slate-300 focus:outline-none text-[9.5px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="-"
                                title={`Edit SL marks (Max ${r.rawMax || 15})`}
                              />
                            ) : (
                              r.sl !== null && r.sl !== undefined ? r.sl : '-'
                            )}
                          </td>
                          <td className={`border border-slate-900 p-0.5 font-bold ${
                            r.isFinalTotal ? 'text-green-600 font-black' : isTotalRow ? 'text-red-600 font-bold' : ''
                          }`}>
                            {isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : (r.slG || '-')}
                          </td>

                          {/* 9. MATHS (Mark, Grade) - 2-Way Synchronized */}
                          <td className={`border border-slate-900 p-0.5 font-mono ${isTotalRow ? 'text-red-600 font-bold' : ''}`}>
                            {isExempted ? (
                              '-'
                            ) : r.isFinalTotal && onUpdateSubject100 ? (
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={r.m !== null && r.m !== undefined ? r.m : ''}
                                onChange={(e) => {
                                  const v = e.target.value.trim();
                                  if (v === '') onUpdateSubject100(st.id, 'MATHS', null as any);
                                  else {
                                    const n = Number(v);
                                    if (!isNaN(n)) onUpdateSubject100(st.id, 'MATHS', Math.min(100, Math.max(0, Math.floor(n))));
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-yellow-100 focus:bg-white font-mono font-black text-red-600 border-b border-red-300 focus:outline-none text-[9.5px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="-"
                                title="Edit Mathematics 100 Marks (2-way sync)"
                              />
                            ) : r.subKey && (onUpdateExamPct || onUpdateMarks) ? (
                              <input
                                type="number"
                                min="0"
                                max={r.rawMax || 15}
                                value={r.m !== null && r.m !== undefined ? r.m : ''}
                                onChange={(e) => {
                                  const v = e.target.value.trim();
                                  const maxVal = r.rawMax || 15;
                                  if (v === '') {
                                    if (onUpdateExamPct) onUpdateExamPct(st.id, 'MATHS', r.subKey!, null as any);
                                    else if (onUpdateMarks) onUpdateMarks(st.id, 'MATHS', r.subKey!, null as any);
                                  } else {
                                    const n = Number(v);
                                    if (!isNaN(n)) {
                                      const clamped = Math.min(maxVal, Math.max(0, Math.floor(n)));
                                      if (onUpdateExamPct) onUpdateExamPct(st.id, 'MATHS', r.subKey!, clamped);
                                      else if (onUpdateMarks) onUpdateMarks(st.id, 'MATHS', r.subKey!, clamped);
                                    }
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-blue-50 focus:bg-white font-mono font-bold text-slate-900 border-b border-slate-300 focus:outline-none text-[9.5px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="-"
                                title={`Edit Maths marks (Max ${r.rawMax || 15})`}
                              />
                            ) : (
                              r.m !== null && r.m !== undefined ? r.m : '-'
                            )}
                          </td>
                          <td className={`border border-slate-900 p-0.5 font-bold ${
                            r.isFinalTotal ? 'text-green-600 font-black' : isTotalRow ? 'text-red-600 font-bold' : ''
                          }`}>
                            {isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : (r.mG || '-')}
                          </td>

                          {/* 10. EVS (Mark, Grade) - 2-Way Synchronized */}
                          <td className={`border border-slate-900 p-0.5 font-mono ${isTotalRow ? 'text-red-600 font-bold' : ''}`}>
                            {isExempted ? (
                              '-'
                            ) : r.isFinalTotal && onUpdateSubject100 ? (
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={r.evs !== null && r.evs !== undefined ? r.evs : ''}
                                onChange={(e) => {
                                  const v = e.target.value.trim();
                                  if (v === '') onUpdateSubject100(st.id, 'EVS', null as any);
                                  else {
                                    const n = Number(v);
                                    if (!isNaN(n)) onUpdateSubject100(st.id, 'EVS', Math.min(100, Math.max(0, Math.floor(n))));
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-yellow-100 focus:bg-white font-mono font-black text-red-600 border-b border-red-300 focus:outline-none text-[9.5px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="-"
                                title="Edit EVS 100 Marks (2-way sync)"
                              />
                            ) : r.subKey && (onUpdateExamPct || onUpdateMarks) ? (
                              <input
                                type="number"
                                min="0"
                                max={r.rawMax || 15}
                                value={r.evs !== null && r.evs !== undefined ? r.evs : ''}
                                onChange={(e) => {
                                  const v = e.target.value.trim();
                                  const maxVal = r.rawMax || 15;
                                  if (v === '') {
                                    if (onUpdateExamPct) onUpdateExamPct(st.id, 'EVS', r.subKey!, null as any);
                                    else if (onUpdateMarks) onUpdateMarks(st.id, 'EVS', r.subKey!, null as any);
                                  } else {
                                    const n = Number(v);
                                    if (!isNaN(n)) {
                                      const clamped = Math.min(maxVal, Math.max(0, Math.floor(n)));
                                      if (onUpdateExamPct) onUpdateExamPct(st.id, 'EVS', r.subKey!, clamped);
                                      else if (onUpdateMarks) onUpdateMarks(st.id, 'EVS', r.subKey!, clamped);
                                    }
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-blue-50 focus:bg-white font-mono font-bold text-slate-900 border-b border-slate-300 focus:outline-none text-[9.5px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="-"
                                title={`Edit EVS marks (Max ${r.rawMax || 15})`}
                              />
                            ) : (
                              r.evs !== null && r.evs !== undefined ? r.evs : '-'
                            )}
                          </td>
                          <td className={`border border-slate-900 p-0.5 font-bold ${
                            r.isFinalTotal ? 'text-green-600 font-black' : isTotalRow ? 'text-red-600 font-bold' : ''
                          }`}>
                            {isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : (r.evsG || '-')}
                          </td>

                          {/* 11. Max Marks */}
                          <td className={`border border-slate-900 p-0.5 font-mono font-black ${
                            r.isFinalTotal
                              ? 'text-red-600 text-[9px] bg-amber-100'
                              : isTotalRow
                              ? 'text-red-600 bg-amber-100'
                              : 'text-slate-900'
                          }`}>
                            {r.max}
                          </td>

                          {/* 12, 13, 14: Grand Total Breakdown */}
                          <td
                            className={`border border-slate-900 p-0.5 font-mono font-bold ${
                              isTotalRow ? 'text-red-600 font-black bg-amber-100' : ''
                            }`}
                          >
                            {isExempted ? '-' : (cSt.totalMarks400 > 0 ? r.obt.total : '-')}
                          </td>
                          {/* % column in RED for final total */}
                          <td
                            className={`border border-slate-900 p-0.5 font-mono font-bold ${
                              r.isFinalTotal
                                ? 'text-red-600 font-black bg-amber-100'
                                : isTotalRow
                                ? 'text-red-600 font-black bg-amber-100'
                                : ''
                            }`}
                          >
                            {isExempted ? '-' : (cSt.totalMarks400 > 0 ? r.obt.pctStr : '-')}
                          </td>
                          {/* Grade column in GREEN for final total */}
                          <td
                            className={`border border-slate-900 p-0.5 font-black ${
                              r.isFinalTotal
                                ? 'text-green-600 font-black bg-amber-100'
                                : isTotalRow
                                ? 'text-red-600 font-black bg-amber-100'
                                : ''
                            }`}
                          >
                            {isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : (cSt.totalMarks400 > 0 ? r.obt.grade : '-')}
                          </td>

                          {/* Part B: Co-Scholastic Grades (5 columns) */}
                          {isRow0 && (
                            <>
                              {CO_SCHOLASTIC_ACTIVITIES.map((act, actIdx) => (
                                <td
                                  key={act.key}
                                  rowSpan={4}
                                  className={`border border-slate-900 p-0.5 w-6 sm:w-7 font-mono font-bold text-[8.5px] align-middle bg-white ${
                                    actIdx === 0 ? 'border-l-2 border-l-red-600' : ''
                                  }`}
                                >
                                  {coSem1[act.key] || '-'}
                                </td>
                              ))}
                            </>
                          )}
                          {isRow4 && (
                            <>
                              {CO_SCHOLASTIC_ACTIVITIES.map((act, actIdx) => (
                                <td
                                  key={act.key}
                                  rowSpan={4}
                                  className={`border border-slate-900 p-0.5 w-6 sm:w-7 font-mono font-bold text-[8.5px] align-middle bg-white ${
                                    actIdx === 0 ? 'border-l-2 border-l-red-600' : ''
                                  }`}
                                >
                                  {coSem2[act.key] || '-'}
                                </td>
                              ))}
                            </>
                          )}
                          {isRow8 && (
                            <>
                              {CO_SCHOLASTIC_ACTIVITIES.map((act, actIdx) => (
                                <td
                                  key={act.key}
                                  className={`border border-slate-900 p-0.5 w-6 sm:w-7 font-mono font-black text-[8.5px] align-middle bg-amber-100 text-red-600 ${
                                    actIdx === 0 ? 'border-l-2 border-l-red-600' : ''
                                  }`}
                                >
                                  {coFinal[act.key] || '-'}
                                </td>
                              ))}
                            </>
                          )}

                          {/* 16. Result Status - Spans 9 rows - VERTICAL BOTTOM TO TOP */}
                          {isRow0 && (
                            <td
                              rowSpan={9}
                              className={`border border-slate-900 p-0.5 font-black align-middle text-center bg-white ${
                                hasCwsnBadge
                                  ? 'text-purple-800'
                                  : cSt.resultStatus.includes('PROMOTED')
                                  ? 'text-emerald-800'
                                  : 'text-red-800'
                              }`}
                            >
                              <span
                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                className="inline-block whitespace-nowrap py-1 mx-auto text-[8.5px]"
                              >
                                {cSt.resultStatus}
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

          {/* Official Signatures & Editable Place Footer per Sheet (Strictly single line nowrap) */}
          <div className="flex flex-nowrap items-center justify-between pt-2 pb-1 text-[9px] sm:text-[9.5px] font-bold text-slate-900 px-2 gap-2 border-t border-slate-300 whitespace-nowrap overflow-hidden w-full">
            <div className="flex items-center gap-1 shrink-0">
              <span>ಸ್ಥಳ:</span>
              <input
                type="text"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                className="border-b border-slate-400 font-bold px-1 bg-transparent w-24 focus:outline-blue-500 focus:bg-white text-slate-900 text-[9px]"
                placeholder="ಸ್ಥಳದ ಹೆಸರು"
                title="ಸ್ಥಳವನ್ನು ಬದಲಾಯಿಸಲು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ"
              />
            </div>
            <div className="shrink-0">
              <span>ದಿನಾಂಕ: {new Date().toLocaleDateString('kn-IN')}</span>
            </div>
            <div className="shrink-0">
              <span>ವರ್ಗ ಶಿಕ್ಷಕರ ಸಹಿ</span>
            </div>
            <div className="shrink-0">
              <span>ಮುಖ್ಯ ಗುರುಗಳ ಸಹಿ: <span className="font-black text-slate-950">{schoolRecord?.headmasterName || 'Headmaster'}</span></span>
            </div>
            <div className="shrink-0 text-slate-600 text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              ಪುಟ: {chunkIdx + 1} / {chunks.length}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
