import React, { useState } from 'react';
import { SchoolRecord } from '../../types';
import {
  ComputedMarathiUrduStudent,
  MARATHI_URDU_CO_ACTIVITIES,
  MarathiUrduSubjectCode,
  calculateGrade,
} from '../../utils/marathiUrduCceHelper';

interface MarathiUrduCcePage4Detailed500Props {
  computedList: ComputedMarathiUrduStudent[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  selectedClass: string;
  medium: 'Marathi' | 'Urdu';
  classTeacherName: string;
  workingDays: number;
  reportRef?: React.RefObject<HTMLDivElement | null>;
  onUpdateSubject100?: (studentId: string, subCode: MarathiUrduSubjectCode, val: number) => void;
  onUpdateExamPct?: (
    studentId: string,
    subCode: MarathiUrduSubjectCode,
    exam: 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2',
    val: number
  ) => void;
  onUpdateMarks?: (
    studentId: string,
    subCode: MarathiUrduSubjectCode,
    exam: 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2',
    val: number
  ) => void;
}

export const MarathiUrduCcePage4Detailed500: React.FC<MarathiUrduCcePage4Detailed500Props> = ({
  computedList,
  schoolRecord,
  academicYear,
  selectedClass,
  medium,
  classTeacherName,
  workingDays,
  reportRef,
  onUpdateSubject100,
  onUpdateExamPct,
  onUpdateMarks,
}) => {
  const talukName = schoolRecord?.taluk?.trim() || 'Belagavi Rural';
  const schoolName = schoolRecord?.schoolName || 'GOVERNMENT HIGHER PRIMARY SCHOOL';
  const [studentsPerPage, setStudentsPerPage] = useState<number>(3);

  // Chunk students strictly 3 per sheet for legal landscape page
  const chunks: ComputedMarathiUrduStudent[][] = [];
  for (let i = 0; i < computedList.length; i += studentsPerPage) {
    chunks.push(computedList.slice(i, i + studentsPerPage));
  }
  if (chunks.length === 0) chunks.push([]);

  return (
    <div ref={reportRef} className="space-y-4 legal-landscape">
      {/* Print Controls / Page Summary Bar */}
      <div className="bg-slate-900 text-white p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-700 print:hidden">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300">Students per Page:</span>
          <select
            value={studentsPerPage}
            onChange={(e) => setStudentsPerPage(Number(e.target.value))}
            className="bg-slate-800 text-white border border-slate-600 rounded px-2 py-1 font-bold text-xs"
          >
            <option value={2}>2 Students / Page</option>
            <option value={3}>3 Students / Page (Standard Legal)</option>
            <option value={4}>4 Students / Page</option>
          </select>
        </div>
        <div className="text-slate-300 text-[11px]">
          Total Students: <span className="font-mono text-white font-black">{computedList.length}</span> • 
          Total Sheets: <span className="font-mono text-amber-300 font-black">{chunks.length}</span>
        </div>
      </div>

      {/* Render Clean Page Sheets */}
      {chunks.map((chunk, chunkIdx) => (
        <div
          key={chunkIdx}
          className="report-page-sheet bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-300 shadow-sm space-y-1.5 print:p-0 print:border-none print:shadow-none print:break-after-page mb-4"
        >
          {/* Official Header per Page matching Page 4 of PDF */}
          <div className="text-center space-y-0.5 border-b-2 border-slate-900 pb-1.5">
            <h2 className="text-xs sm:text-[13px] font-black text-rose-800 tracking-wide uppercase">
              Office of the Block Education Officer and Block Resource Coordinator, {talukName}
            </h2>
            <h1 className="text-xs sm:text-sm font-black text-slate-950 leading-tight">
              {schoolName}
            </h1>
            <p className="text-[10px] font-bold text-emerald-800">
              Subject-wise Formative and Summative Assessment Consolidation Report for the year {academicYear}
            </p>

            {/* Sub-header info: equidistant 3 columns */}
            <div className="grid grid-cols-3 items-center text-center text-[9.5px] sm:text-[10px] font-bold text-slate-900 pt-1 pb-0.5 px-1 w-full gap-2 border-t border-slate-200">
              <div className="flex justify-center items-center">
                <span className="bg-lime-200 text-lime-950 px-2.5 py-0.5 rounded border border-lime-400 font-black whitespace-nowrap">
                  Class: {selectedClass}th Std ({medium} Medium)
                </span>
              </div>
              <div className="flex justify-center items-center text-slate-900 whitespace-nowrap">
                <span>
                  CLASS TEACHER'S NAME: <span className="font-black text-slate-950">{classTeacherName || 'Class Teacher'}</span>
                </span>
              </div>
              <div className="flex justify-center items-center text-slate-900 whitespace-nowrap">
                <span>
                  SCHOOL WORKING DAYS: <span className="font-mono font-black text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">{workingDays}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Main 500 Marks 9-Line Table matching Page 4 */}
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[1150px] print:min-w-0 text-[8px] sm:text-[8.5px] text-center border-collapse border-2 border-slate-900 table-fixed">
              <thead>
                {/* Header Row 1 */}
                <tr className="bg-slate-100 font-bold text-slate-900 border-b border-slate-900">
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-6 align-middle bg-slate-50">
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block py-0.5 mx-auto font-black text-[8px]">
                      SI NO
                    </span>
                  </th>
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-8 align-middle bg-slate-50">
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block py-0.5 mx-auto font-black text-[8px]">
                      REG. NO
                    </span>
                  </th>
                  <th rowSpan={3} className="border border-slate-900 p-1 w-28 align-middle font-black bg-slate-50 text-slate-950">
                    STUDENTS NAME
                  </th>
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-8 align-middle bg-slate-50">
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block py-0.5 mx-auto font-black text-[7.5px]">
                      DAYS ATTENDED SCHOOL
                    </span>
                  </th>
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-12 align-middle bg-slate-50 font-black">
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block py-0.5 mx-auto font-black text-[8px]">
                      EVALUATION PERIOD
                    </span>
                  </th>
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-7 align-middle bg-slate-50 font-black">
                    %
                  </th>

                  {/* Curricular Subjects Group Banner (RED as in PDF) */}
                  <th colSpan={10} className="border border-slate-900 p-0.5 bg-red-50 text-red-700 font-black text-[9px]">
                    PART-A STUDENT'S ACADEMIC PERFORMANCE REGARDING CURRICULAR SUBJECTS
                  </th>

                  {/* TOTAL MARKS 500 */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 bg-amber-50 w-8 font-black align-middle text-[8px]">
                    TOTAL MARKS<br />
                    <span className="font-mono text-[9px] font-black">500</span>
                  </th>

                  {/* TOTAL MARKS SECURED */}
                  <th colSpan={3} className="border border-slate-900 p-0.5 bg-amber-100 font-black text-slate-950 text-[9px]">
                    TOTAL MARKS SECURED
                  </th>

                  {/* PART-B CO-SCHOLASTIC GRADES Banner (RED as in PDF) */}
                  <th colSpan={5} className="border border-slate-900 p-0.5 bg-red-50 text-red-700 font-black text-[9px] border-l-2 border-l-red-600">
                    PART-B CO-SCHOLASTIC GRADES
                  </th>

                  {/* RESULT */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-7 bg-emerald-50 text-red-700 font-black align-middle">
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block py-0.5 mx-auto font-black text-[8.5px]">
                      RESULT
                    </span>
                  </th>
                </tr>

                {/* Sub-Header Row 2 */}
                <tr className="bg-slate-50 text-[8px] font-bold text-slate-800 border-b border-slate-900">
                  <th colSpan={2} className="border border-slate-900 p-0.5">FIRST LANGUAGE</th>
                  <th colSpan={2} className="border border-slate-900 p-0.5">SECOND LANGUAGE</th>
                  <th colSpan={2} className="border border-slate-900 p-0.5">THIRD LANGUAGE</th>
                  <th colSpan={2} className="border border-slate-900 p-0.5">MATHS</th>
                  <th colSpan={2} className="border border-slate-900 p-0.5">EVS</th>

                  <th rowSpan={2} className="border border-slate-900 p-0.5 w-7 font-black">MARKS</th>
                  <th rowSpan={2} className="border border-slate-900 p-0.5 w-7 font-black">%</th>
                  <th rowSpan={2} className="border border-slate-900 p-0.5 w-6 font-black">GRADE</th>

                  {/* 5 Co-scholastic activities */}
                  {MARATHI_URDU_CO_ACTIVITIES.map((act, actIdx) => (
                    <th
                      key={act.key}
                      rowSpan={2}
                      className={`border border-slate-900 p-0.5 w-6 sm:w-7 align-middle bg-slate-50 ${actIdx === 0 ? 'border-l-2 border-l-red-600' : ''}`}
                    >
                      <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block whitespace-nowrap font-bold text-[7px] py-0.5 mx-auto text-center">
                        {act.nameEn}
                      </span>
                    </th>
                  ))}
                </tr>

                {/* Sub-Header Row 3: M & G */}
                <tr className="bg-slate-100 text-[8px] font-black text-slate-900 border-b-2 border-slate-900">
                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">M</th>
                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">G</th>

                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">M</th>
                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">G</th>

                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">M</th>
                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">G</th>

                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">M</th>
                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">G</th>

                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">M</th>
                  <th className="border border-slate-900 p-0.5 w-5 bg-blue-50/60">G</th>
                </tr>
              </thead>

              {/* Table Body per Chunk */}
              {chunk.map((cSt, idxInChunk) => {
                const globalIdx = chunkIdx * studentsPerPage + idxInChunk;
                const st = cSt.student;
                const fl = cSt.subjects.FL;
                const sl = cSt.subjects.SL;
                const tl = cSt.subjects.TL;
                const maths = cSt.subjects.MATHS;
                const evs = cSt.subjects.EVS;
                const isMarksAllowed = st.cwsnStatus === 'MARKS_ALLOWED' || st.cwsnStatus === 'YES_MARKS';
                const isExempted = isMarksAllowed ? false : cSt.isExempted;
                const hasCwsnBadge = cSt.hasCwsnBadge;

                const coSem1 = cSt.coScholastic.sem1;
                const coSem2 = cSt.coScholastic.sem2;
                const coFinal = cSt.coScholastic.final;

                const calcRowObtained = (
                  flVal: number,
                  slVal: number,
                  tlVal: number,
                  mVal: number,
                  evsVal: number,
                  max: number
                ) => {
                  if (isExempted) return { total: 0, pctStr: '-', grade: 'Exempt' };
                  const total = Number((flVal + slVal + tlVal + mVal + evsVal).toFixed(1));
                  const pctNum = max > 0 ? Number(((total / max) * 100).toFixed(1)) : 0;
                  const grade = total > 0 ? calculateGrade(pctNum) : '-';
                  return { total, pctStr: `${pctNum}%`, grade };
                };

                const r1 = calcRowObtained(fl.fa1_pct, sl.fa1_pct, tl.fa1_pct, maths.fa1_pct, evs.fa1_pct, 75);
                const r2 = calcRowObtained(fl.fa2_pct, sl.fa2_pct, tl.fa2_pct, maths.fa2_pct, evs.fa2_pct, 75);
                const r3 = calcRowObtained(fl.sa1_pct, sl.sa1_pct, tl.sa1_pct, maths.sa1_pct, evs.sa1_pct, 100);
                const r4 = calcRowObtained(fl.sem1_total, sl.sem1_total, tl.sem1_total, maths.sem1_total, evs.sem1_total, 250);

                const r5 = calcRowObtained(fl.fa3_pct, sl.fa3_pct, tl.fa3_pct, maths.fa3_pct, evs.fa3_pct, 75);
                const r6 = calcRowObtained(fl.fa4_pct, sl.fa4_pct, tl.fa4_pct, maths.fa4_pct, evs.fa4_pct, 75);
                const r7 = calcRowObtained(fl.sa2_pct, sl.sa2_pct, tl.sa2_pct, maths.sa2_pct, evs.sa2_pct, 100);
                const r8 = calcRowObtained(fl.sem2_total, sl.sem2_total, tl.sem2_total, maths.sem2_total, evs.sem2_total, 250);

                const r9Total = isExempted ? 0 : cSt.totalMarks500;
                const r9Pct = isExempted ? '-' : `${cSt.percentage}%`;
                const r9Grade = isExempted ? 'Exempt' : cSt.overallGrade;

                const rows = [
                  { exam: 'FA-1', pct: '15%', max: 75, subKey: 'fa1' as const, rawMax: 15, fl: fl.fa1_pct, flG: fl.fa1_grade, sl: sl.fa1_pct, slG: sl.fa1_grade, tl: tl.fa1_pct, tlG: tl.fa1_grade, m: maths.fa1_pct, mG: maths.fa1_grade, evs: evs.fa1_pct, evsG: evs.fa1_grade, obt: r1 },
                  { exam: 'FA-2', pct: '15%', max: 75, subKey: 'fa2' as const, rawMax: 15, fl: fl.fa2_pct, flG: fl.fa2_grade, sl: sl.fa2_pct, slG: sl.fa2_grade, tl: tl.fa2_pct, tlG: tl.fa2_grade, m: maths.fa2_pct, mG: maths.fa2_grade, evs: evs.fa2_pct, evsG: evs.fa2_grade, obt: r2 },
                  { exam: 'SA-1', pct: '20%', max: 100, subKey: 'sa1' as const, rawMax: 20, fl: fl.sa1_pct, flG: fl.sa1_grade, sl: sl.sa1_pct, slG: sl.sa1_grade, tl: tl.sa1_pct, tlG: tl.sa1_grade, m: maths.sa1_pct, mG: maths.sa1_grade, evs: evs.sa1_pct, evsG: evs.sa1_grade, obt: r3 },
                  { exam: 'TOTAL', pct: '50%', max: 250, isSem1Total: true, fl: fl.sem1_total, flG: calculateGrade((fl.sem1_total / 50) * 100), sl: sl.sem1_total, slG: calculateGrade((sl.sem1_total / 50) * 100), tl: tl.sem1_total, tlG: calculateGrade((tl.sem1_total / 50) * 100), m: maths.sem1_total, mG: calculateGrade((maths.sem1_total / 50) * 100), evs: evs.sem1_total, evsG: calculateGrade((evs.sem1_total / 50) * 100), obt: r4 },
                  { exam: 'FA-3', pct: '15%', max: 75, subKey: 'fa3' as const, rawMax: 15, fl: fl.fa3_pct, flG: fl.fa3_grade, sl: sl.fa3_pct, slG: sl.fa3_grade, tl: tl.fa3_pct, tlG: tl.fa3_grade, m: maths.fa3_pct, mG: maths.fa3_grade, evs: evs.fa3_pct, evsG: evs.fa3_grade, obt: r5 },
                  { exam: 'FA-4', pct: '15%', max: 75, subKey: 'fa4' as const, rawMax: 15, fl: fl.fa4_pct, flG: fl.fa4_grade, sl: sl.fa4_pct, slG: sl.fa4_grade, tl: tl.fa4_pct, tlG: tl.fa4_grade, m: maths.fa4_pct, mG: maths.fa4_grade, evs: evs.fa4_pct, evsG: evs.fa4_grade, obt: r6 },
                  { exam: 'SA-2', pct: '20%', max: 100, subKey: 'sa2' as const, rawMax: 20, fl: fl.sa2_pct, flG: fl.sa2_grade, sl: sl.sa2_pct, slG: sl.sa2_grade, tl: tl.sa2_pct, tlG: tl.sa2_grade, m: maths.sa2_pct, mG: maths.sa2_grade, evs: evs.sa2_pct, evsG: evs.sa2_grade, obt: r7 },
                  { exam: 'TOTAL', pct: '50%', max: 250, isSem2Total: true, fl: fl.sem2_total, flG: calculateGrade((fl.sem2_total / 50) * 100), sl: sl.sem2_total, slG: calculateGrade((sl.sem2_total / 50) * 100), tl: tl.sem2_total, tlG: calculateGrade((tl.sem2_total / 50) * 100), m: maths.sem2_total, mG: calculateGrade((maths.sem2_total / 50) * 100), evs: evs.sem2_total, evsG: calculateGrade((evs.sem2_total / 50) * 100), obt: r8 },
                  { exam: 'G TOTAL', pct: '100%', max: 500, isFinalTotal: true, fl: fl.total100, flG: fl.grade, sl: sl.total100, slG: sl.grade, tl: tl.total100, tlG: tl.grade, m: maths.total100, mG: maths.grade, evs: evs.total100, evsG: evs.grade, obt: { total: r9Total, pctStr: r9Pct, grade: r9Grade } },
                ];

                return (
                  <tbody key={st.id} className="border-2 border-red-600">
                    {rows.map((r, rIdx) => {
                      const isRow0 = rIdx === 0;
                      const isRow3 = rIdx === 3;
                      const isRow4 = rIdx === 4;
                      const isRow7 = rIdx === 7;
                      const isRow8 = rIdx === 8;
                      const isTotalRow = isRow3 || isRow7;

                      return (
                        <tr
                          key={rIdx}
                          className={`border-b border-slate-900 ${
                            r.isFinalTotal
                              ? 'bg-amber-100 font-black'
                              : isTotalRow
                              ? 'bg-amber-50 font-bold'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* SI NO */}
                          {isRow0 && (
                            <td rowSpan={9} className="border border-slate-900 p-0.5 font-bold font-mono align-middle bg-white">
                              {globalIdx + 1}
                            </td>
                          )}

                          {/* REG. NO */}
                          {isRow0 && (
                            <td rowSpan={9} className="border border-slate-900 p-0.5 font-mono align-middle bg-white text-center">
                              <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block py-1 mx-auto text-[8px] font-bold">
                                {st.schoolRegNo || `${124 + globalIdx}/2020-21`}
                              </span>
                            </td>
                          )}

                          {/* STUDENTS NAME */}
                          {isRow0 && (
                            <td rowSpan={9} className="border border-slate-900 p-1 text-left align-middle bg-white min-w-[120px]">
                              <div className="font-black text-slate-950 text-[9.5px]">
                                {st.studentName}
                              </div>
                              {hasCwsnBadge && (
                                <div className="my-0.5">
                                  <span className="inline-block bg-purple-700 text-white font-extrabold px-1.5 py-0.2 rounded text-[7.5px]">
                                    (CWSN)
                                  </span>
                                </div>
                              )}
                              <div className="mt-1 text-[8px] text-slate-700 font-mono space-y-0.5">
                                <div><span className="font-bold">CASTE:</span> {st.caste || 'GM'}</div>
                                <div><span className="font-bold">DOB:</span> {st.dob || st.dateOfBirth || '-'}</div>
                                <div><span className="font-bold">SATS NO:</span> {st.satsNo || 'N/A'}</div>
                              </div>
                            </td>
                          )}

                          {/* DAYS ATTENDED SCHOOL */}
                          {isRow0 && (
                            <td rowSpan={9} className="border border-slate-900 p-0.5 font-mono font-bold align-middle bg-white text-center">
                              <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block py-1 mx-auto text-[9px] font-black">
                                {cSt.attendanceDays || '-'}
                              </span>
                            </td>
                          )}

                          {/* EVALUATION PERIOD */}
                          <td className={`border border-slate-900 p-0.5 font-bold text-[8.5px] ${
                            r.isFinalTotal ? 'bg-amber-200 text-red-600 font-black' : isTotalRow ? 'bg-amber-100 text-red-600' : 'text-slate-900'
                          }`}>
                            {r.exam}
                          </td>

                          {/* % */}
                          <td className={`border border-slate-900 p-0.5 font-mono font-bold ${
                            r.isFinalTotal ? 'bg-amber-200 text-red-600 font-black' : isTotalRow ? 'bg-amber-100 text-red-600' : 'text-slate-800'
                          }`}>
                            {r.pct}
                          </td>

                          {/* FIRST LANGUAGE (M, G) - 2-Way Synchronized */}
                          <td className="border border-slate-900 p-0.5 font-mono">
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
                                  if (v === '') {
                                    onUpdateSubject100(st.id, fl.code, null as any);
                                  } else {
                                    const n = Number(v);
                                    if (!isNaN(n)) {
                                      onUpdateSubject100(st.id, fl.code, Math.min(100, Math.max(0, n)));
                                    }
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-yellow-100 focus:bg-white font-mono font-black text-red-600 border-b border-red-300 focus:outline-none text-[9px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                    if (onUpdateExamPct) onUpdateExamPct(st.id, fl.code, r.subKey!, null as any);
                                    else if (onUpdateMarks) onUpdateMarks(st.id, fl.code, r.subKey!, null as any);
                                  } else {
                                    const n = Number(v);
                                    if (!isNaN(n)) {
                                      const clamped = Math.min(maxVal, Math.max(0, n));
                                      if (onUpdateExamPct) onUpdateExamPct(st.id, fl.code, r.subKey!, clamped);
                                      else if (onUpdateMarks) onUpdateMarks(st.id, fl.code, r.subKey!, clamped);
                                    }
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-blue-50 focus:bg-white font-mono font-bold text-slate-900 border-b border-slate-300 focus:outline-none text-[9px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                title={`Edit FL marks (Max ${r.rawMax || 15})`}
                              />
                            ) : (
                              r.fl !== null && r.fl !== undefined ? r.fl : '-'
                            )}
                          </td>
                          <td className="border border-slate-900 p-0.5 font-bold">{isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : (r.flG || '-')}</td>

                          {/* SECOND LANGUAGE (M, G) - 2-Way Synchronized */}
                          <td className="border border-slate-900 p-0.5 font-mono">
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
                                  if (v === '') {
                                    onUpdateSubject100(st.id, sl.code, null as any);
                                  } else {
                                    const n = Number(v);
                                    if (!isNaN(n)) {
                                      onUpdateSubject100(st.id, sl.code, Math.min(100, Math.max(0, n)));
                                    }
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-yellow-100 focus:bg-white font-mono font-black text-red-600 border-b border-red-300 focus:outline-none text-[9px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                    if (onUpdateExamPct) onUpdateExamPct(st.id, sl.code, r.subKey!, null as any);
                                    else if (onUpdateMarks) onUpdateMarks(st.id, sl.code, r.subKey!, null as any);
                                  } else {
                                    const n = Number(v);
                                    if (!isNaN(n)) {
                                      const clamped = Math.min(maxVal, Math.max(0, n));
                                      if (onUpdateExamPct) onUpdateExamPct(st.id, sl.code, r.subKey!, clamped);
                                      else if (onUpdateMarks) onUpdateMarks(st.id, sl.code, r.subKey!, clamped);
                                    }
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-blue-50 focus:bg-white font-mono font-bold text-slate-900 border-b border-slate-300 focus:outline-none text-[9px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                title={`Edit SL marks (Max ${r.rawMax || 15})`}
                              />
                            ) : (
                              r.sl !== null && r.sl !== undefined ? r.sl : '-'
                            )}
                          </td>
                          <td className="border border-slate-900 p-0.5 font-bold">{isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : (r.slG || '-')}</td>

                          {/* THIRD LANGUAGE (M, G) - 2-Way Synchronized */}
                          <td className="border border-slate-900 p-0.5 font-mono">
                            {isExempted ? (
                              '-'
                            ) : r.isFinalTotal && onUpdateSubject100 ? (
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={r.tl !== null && r.tl !== undefined ? r.tl : ''}
                                onChange={(e) => {
                                  const v = e.target.value.trim();
                                  if (v === '') {
                                    onUpdateSubject100(st.id, tl.code, null as any);
                                  } else {
                                    const n = Number(v);
                                    if (!isNaN(n)) {
                                      onUpdateSubject100(st.id, tl.code, Math.min(100, Math.max(0, n)));
                                    }
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-yellow-100 focus:bg-white font-mono font-black text-red-600 border-b border-red-300 focus:outline-none text-[9px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                title="Edit Third Language 100 Marks (2-way sync)"
                              />
                            ) : r.subKey && (onUpdateExamPct || onUpdateMarks) ? (
                              <input
                                type="number"
                                min="0"
                                max={r.rawMax || 15}
                                value={r.tl !== null && r.tl !== undefined ? r.tl : ''}
                                onChange={(e) => {
                                  const v = e.target.value.trim();
                                  const maxVal = r.rawMax || 15;
                                  if (v === '') {
                                    if (onUpdateExamPct) onUpdateExamPct(st.id, tl.code, r.subKey!, null as any);
                                    else if (onUpdateMarks) onUpdateMarks(st.id, tl.code, r.subKey!, null as any);
                                  } else {
                                    const n = Number(v);
                                    if (!isNaN(n)) {
                                      const clamped = Math.min(maxVal, Math.max(0, n));
                                      if (onUpdateExamPct) onUpdateExamPct(st.id, tl.code, r.subKey!, clamped);
                                      else if (onUpdateMarks) onUpdateMarks(st.id, tl.code, r.subKey!, clamped);
                                    }
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-blue-50 focus:bg-white font-mono font-bold text-slate-900 border-b border-slate-300 focus:outline-none text-[9px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                title={`Edit TL marks (Max ${r.rawMax || 15})`}
                              />
                            ) : (
                              r.tl !== null && r.tl !== undefined ? r.tl : '-'
                            )}
                          </td>
                          <td className="border border-slate-900 p-0.5 font-bold">{isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : (r.tlG || '-')}</td>

                          {/* MATHS (M, G) - 2-Way Synchronized */}
                          <td className="border border-slate-900 p-0.5 font-mono">
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
                                  if (v === '') {
                                    onUpdateSubject100(st.id, maths.code, null as any);
                                  } else {
                                    const n = Number(v);
                                    if (!isNaN(n)) {
                                      onUpdateSubject100(st.id, maths.code, Math.min(100, Math.max(0, n)));
                                    }
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-yellow-100 focus:bg-white font-mono font-black text-red-600 border-b border-red-300 focus:outline-none text-[9px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                    if (onUpdateExamPct) onUpdateExamPct(st.id, maths.code, r.subKey!, null as any);
                                    else if (onUpdateMarks) onUpdateMarks(st.id, maths.code, r.subKey!, null as any);
                                  } else {
                                    const n = Number(v);
                                    if (!isNaN(n)) {
                                      const clamped = Math.min(maxVal, Math.max(0, n));
                                      if (onUpdateExamPct) onUpdateExamPct(st.id, maths.code, r.subKey!, clamped);
                                      else if (onUpdateMarks) onUpdateMarks(st.id, maths.code, r.subKey!, clamped);
                                    }
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-blue-50 focus:bg-white font-mono font-bold text-slate-900 border-b border-slate-300 focus:outline-none text-[9px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                title={`Edit Maths marks (Max ${r.rawMax || 15})`}
                              />
                            ) : (
                              r.m !== null && r.m !== undefined ? r.m : '-'
                            )}
                          </td>
                          <td className="border border-slate-900 p-0.5 font-bold">{isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : (r.mG || '-')}</td>

                          {/* EVS (M, G) - 2-Way Synchronized */}
                          <td className="border border-slate-900 p-0.5 font-mono">
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
                                  if (v === '') {
                                    onUpdateSubject100(st.id, evs.code, null as any);
                                  } else {
                                    const n = Number(v);
                                    if (!isNaN(n)) {
                                      onUpdateSubject100(st.id, evs.code, Math.min(100, Math.max(0, n)));
                                    }
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-yellow-100 focus:bg-white font-mono font-black text-red-600 border-b border-red-300 focus:outline-none text-[9px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                    if (onUpdateExamPct) onUpdateExamPct(st.id, evs.code, r.subKey!, null as any);
                                    else if (onUpdateMarks) onUpdateMarks(st.id, evs.code, r.subKey!, null as any);
                                  } else {
                                    const n = Number(v);
                                    if (!isNaN(n)) {
                                      const clamped = Math.min(maxVal, Math.max(0, n));
                                      if (onUpdateExamPct) onUpdateExamPct(st.id, evs.code, r.subKey!, clamped);
                                      else if (onUpdateMarks) onUpdateMarks(st.id, evs.code, r.subKey!, clamped);
                                    }
                                  }
                                }}
                                className="w-full text-center bg-transparent hover:bg-blue-50 focus:bg-white font-mono font-bold text-slate-900 border-b border-slate-300 focus:outline-none text-[9px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                title={`Edit EVS marks (Max ${r.rawMax || 15})`}
                              />
                            ) : (
                              r.evs !== null && r.evs !== undefined ? r.evs : '-'
                            )}
                          </td>
                          <td className="border border-slate-900 p-0.5 font-bold">{isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : (r.evsG || '-')}</td>

                          {/* TOTAL MARKS 500 */}
                          <td className={`border border-slate-900 p-0.5 font-mono font-black ${
                            r.isFinalTotal ? 'text-red-600 bg-amber-200' : isTotalRow ? 'text-red-600 bg-amber-100' : 'text-slate-900'
                          }`}>
                            {r.max}
                          </td>

                          {/* TOTAL MARKS SECURED: MARKS, %, GRADE */}
                          <td className={`border border-slate-900 p-0.5 font-mono font-bold ${
                            r.isFinalTotal ? 'text-red-600 font-black bg-amber-200' : isTotalRow ? 'text-red-600 font-black bg-amber-100' : ''
                          }`}>
                            {isExempted ? '-' : (cSt.totalMarks500 && cSt.totalMarks500 > 0 ? r.obt.total : '-')}
                          </td>
                          <td className={`border border-slate-900 p-0.5 font-mono font-bold ${
                            r.isFinalTotal ? 'text-red-600 font-black bg-amber-200' : isTotalRow ? 'text-red-600 font-black bg-amber-100' : ''
                          }`}>
                            {isExempted ? '-' : (cSt.totalMarks500 && cSt.totalMarks500 > 0 ? r.obt.pctStr : '-')}
                          </td>
                          <td className={`border border-slate-900 p-0.5 font-black ${
                            r.isFinalTotal ? 'text-green-600 font-black bg-amber-200' : isTotalRow ? 'text-red-600 font-black bg-amber-100' : ''
                          }`}>
                            {isExempted ? (r.isFinalTotal ? 'Exempt' : '-') : (cSt.totalMarks500 && cSt.totalMarks500 > 0 ? r.obt.grade : '-')}
                          </td>

                          {/* PART-B CO-SCHOLASTIC GRADES (5 columns) */}
                          {isRow0 && (
                            <>
                              {MARATHI_URDU_CO_ACTIVITIES.map((act, actIdx) => (
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
                              {MARATHI_URDU_CO_ACTIVITIES.map((act, actIdx) => (
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
                              {MARATHI_URDU_CO_ACTIVITIES.map((act, actIdx) => (
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

                          {/* RESULT */}
                          {isRow0 && (
                            <td
                              rowSpan={9}
                              className={`border border-slate-900 p-0.5 font-black align-middle text-center bg-white ${
                                hasCwsnBadge
                                  ? 'text-purple-800'
                                  : cSt.resultStatus.includes('PASS') || cSt.resultStatus.includes('PROMOTED')
                                  ? 'text-emerald-800'
                                  : 'text-red-700'
                              }`}
                            >
                              <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block py-1 mx-auto text-[8.5px]">
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

          {/* Page Footer */}
          <div className="flex flex-nowrap items-center justify-between pt-2 pb-1 text-[9px] sm:text-[9.5px] font-bold text-slate-900 px-2 gap-2 border-t border-slate-300 w-full">
            <div>Place: {schoolRecord?.cluster || 'Belagavi'}</div>
            <div>Date: {new Date().toLocaleDateString('en-GB')}</div>
            <div>Class Teacher's Sign</div>
            <div>Head Master Sign: <span className="font-black text-slate-950">{schoolRecord?.headmasterName || 'Headmaster'}</span></div>
            <div className="shrink-0 text-slate-600 text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              Page: {chunkIdx + 1} / {chunks.length}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
