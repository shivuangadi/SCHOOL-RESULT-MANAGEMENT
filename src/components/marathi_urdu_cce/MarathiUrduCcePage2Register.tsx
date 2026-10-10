import React, { useState } from 'react';
import { SchoolRecord } from '../../types';
import {
  ComputedMarathiUrduStudent,
  MARATHI_URDU_CO_ACTIVITIES,
  MarathiUrduSubjectCode,
  getStudentCategoryGroup,
} from '../../utils/marathiUrduCceHelper';

interface MarathiUrduCcePage2RegisterProps {
  computedList: ComputedMarathiUrduStudent[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  selectedClass: string;
  medium: 'Marathi' | 'Urdu';
  classTeacherName: string;
  workingDays: number;
  reportRef?: React.RefObject<HTMLDivElement | null>;
  onUpdateSubject100?: (studentId: string, subCode: MarathiUrduSubjectCode, val: number) => void;
  onUpdateAttendance?: (studentId: string, days: number) => void;
  onUpdateFinalCoGrade?: (studentId: string, key: string, val: string) => void;
}

export const MarathiUrduCcePage2Register: React.FC<MarathiUrduCcePage2RegisterProps> = ({
  computedList,
  schoolRecord,
  academicYear,
  selectedClass,
  medium,
  classTeacherName,
  workingDays,
  reportRef,
  onUpdateSubject100,
  onUpdateAttendance,
  onUpdateFinalCoGrade,
}) => {
  const talukName = schoolRecord?.taluk?.trim() || 'Belagavi Rural';
  const schoolName = schoolRecord?.schoolName || 'GOVERNMENT HIGHER PRIMARY SCHOOL';

  return (
    <div
      ref={reportRef}
      className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-300 shadow-md space-y-4 legal-landscape print:p-1 print:shadow-none print:border-none print:rounded-none"
    >
      {/* Official Header matching Page 2 */}
      <div className="text-center space-y-1 border-b-2 border-slate-900 pb-3">
        <h2 className="text-xs sm:text-sm font-bold text-indigo-900 tracking-wide uppercase">
          Office of the Block Education Officer and Block Resource Coordinator, {talukName}
        </h2>
        <h1 className="text-base sm:text-lg font-black text-slate-950 font-serif tracking-wide">
          {schoolName}
        </h1>
        <h3 className="text-xs sm:text-sm font-extrabold text-blue-700">
          Formative and Summative Assessment Consolidation Report for the year {academicYear}
        </h3>

        {/* Sub-header info row: equidistant 4 columns */}
        <div className="grid grid-cols-4 items-center text-center text-[10px] sm:text-xs font-bold text-slate-800 pt-2 px-1 w-full gap-2 border-t border-slate-200">
          <div className="flex justify-center items-center">
            <span className="bg-blue-100 text-blue-950 px-2.5 py-0.5 rounded border border-blue-300 font-black">
              CLASS: {selectedClass}th Std
            </span>
          </div>
          <div className="flex justify-center items-center text-slate-900">
            <span>
              Medium: <span className="font-black text-indigo-900">{medium} Medium (500 Marks)</span>
            </span>
          </div>
          <div className="flex justify-center items-center text-slate-900">
            <span>
              CLASS TEACHER'S NAME: <span className="font-black text-slate-950">{classTeacherName || 'Class Teacher'}</span>
            </span>
          </div>
          <div className="flex justify-center items-center text-slate-900">
            <span>
              WORKING DAYS: <span className="font-mono font-black text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">{workingDays}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main 500 Marks Register Table */}
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full min-w-[1150px] print:min-w-0 text-[8px] text-center border-collapse border border-slate-900 table-fixed">
          <thead>
            {/* Header Row 1 */}
            <tr className="bg-slate-100 font-bold text-slate-900">
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-6 align-middle">
                <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block py-1 mx-auto">
                  SI NO
                </span>
              </th>
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-8 align-middle">
                <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block py-1 mx-auto">
                  REG NO
                </span>
              </th>
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-12 align-middle font-mono">
                SATS NO
              </th>
              <th rowSpan={3} className="border border-slate-900 p-1 w-24 text-left align-middle font-black">
                STUDENT NAME
              </th>
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-8 align-middle font-mono">
                <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block py-1 mx-auto">
                  DOB
                </span>
              </th>
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-7 align-middle">
                <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block py-1 mx-auto">
                  GENDER
                </span>
              </th>
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-7 align-middle">
                <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block py-1 mx-auto">
                  social cat
                </span>
              </th>
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-7 align-middle">
                <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block py-1 mx-auto">
                  CASTE
                </span>
              </th>
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-8 align-middle font-mono">
                <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block py-1 mx-auto text-[7.5px]">
                  DAYS ATTENDED SCHOOL
                </span>
              </th>

              {/* SCHOLASTIC GROUP (10 Columns for 5 subjects) */}
              <th colSpan={10} className="border border-slate-900 p-0.5 bg-blue-100 font-black text-slate-950 text-[9px]">
                SCHOLASTIC
              </th>

              {/* TOTAL MARKS SECURED (500) */}
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-9 align-middle bg-amber-50">
                <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block py-1 mx-auto font-black text-[7.5px]">
                  TOTAL MARKS SECURED (500)
                </span>
              </th>
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-8 align-middle font-black">
                %
              </th>
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-7 align-middle font-black">
                GRADE
              </th>

              {/* CO-SCHOLASTIC GROUP (5 Columns) */}
              <th colSpan={5} className="border border-slate-900 p-0.5 bg-orange-100 font-black text-orange-950 text-[9px]">
                CO-SCHOLASTIC
              </th>

              {/* RESULT */}
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-8 align-middle bg-emerald-50">
                <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block py-1 mx-auto font-black text-[8px]">
                  RESULT
                </span>
              </th>
            </tr>

            {/* Header Row 2: 5 Subjects & 5 Co-scholastic */}
            <tr className="bg-slate-50 text-[7.5px] font-bold text-slate-900">
              <th colSpan={2} className="border border-slate-900 p-0.5">
                FIRST LANGUAGE
              </th>
              <th colSpan={2} className="border border-slate-900 p-0.5">
                SECOND LANGUAGE
              </th>
              <th colSpan={2} className="border border-slate-900 p-0.5">
                THIRD LANGUAGE
              </th>
              <th colSpan={2} className="border border-slate-900 p-0.5">
                MATHS
              </th>
              <th colSpan={2} className="border border-slate-900 p-0.5">
                EVS
              </th>

              {MARATHI_URDU_CO_ACTIVITIES.map((act) => (
                <th key={act.key} rowSpan={2} className="border border-slate-900 p-0.5 w-6 align-middle bg-orange-50/50">
                  <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block whitespace-nowrap text-[7px] py-1 mx-auto font-bold">
                    {act.nameEn}
                  </span>
                </th>
              ))}
            </tr>

            {/* Header Row 3: M & G */}
            <tr className="bg-slate-100 text-[8px] font-black text-slate-900">
              <th className="border border-slate-900 p-0.5 w-7">M</th>
              <th className="border border-slate-900 p-0.5 w-5">G</th>
              <th className="border border-slate-900 p-0.5 w-7">M</th>
              <th className="border border-slate-900 p-0.5 w-5">G</th>
              <th className="border border-slate-900 p-0.5 w-7">M</th>
              <th className="border border-slate-900 p-0.5 w-5">G</th>
              <th className="border border-slate-900 p-0.5 w-7">M</th>
              <th className="border border-slate-900 p-0.5 w-5">G</th>
              <th className="border border-slate-900 p-0.5 w-7">M</th>
              <th className="border border-slate-900 p-0.5 w-5">G</th>
            </tr>
          </thead>

          <tbody>
            {computedList.map((cSt, idx) => {
              const st = cSt.student;
              const isExempted = cSt.isExempted;
              const fl = cSt.subjects.FL;
              const sl = cSt.subjects.SL;
              const tl = cSt.subjects.TL;
              const maths = cSt.subjects.MATHS;
              const evs = cSt.subjects.EVS;
              const finalCo = cSt.coScholastic.final;

              return (
                <tr key={st.id} className="hover:bg-blue-50/40 border-b border-slate-900">
                  <td className="border border-slate-900 p-0.5 font-mono font-bold">{idx + 1}</td>
                  <td className="border border-slate-900 p-0.5 font-mono truncate">{st.schoolRegNo || `${100 + idx + 1}/2026`}</td>
                  <td className="border border-slate-900 p-0.5 font-mono truncate">{st.satsNo || 'N/A'}</td>

                  {/* Student Name */}
                  <td className="border border-slate-900 p-0.5 text-left font-bold truncate">
                    <div className="flex items-center justify-between gap-0.5">
                      <span className="truncate">{st.studentName}</span>
                      {cSt.hasCwsnBadge && (
                        <span className="text-[7px] bg-purple-800 text-white font-black px-1 py-0.2 rounded shrink-0">
                          (CWSN)
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="border border-slate-900 p-0.5 font-mono truncate">{st.dob || st.dateOfBirth || '-'}</td>
                  <td className="border border-slate-900 p-0.5 font-bold">{st.gender === 'Girl' ? 'G' : 'B'}</td>
                  <td className="border border-slate-900 p-0.5 font-bold">{getStudentCategoryGroup(st)}</td>
                  <td className="border border-slate-900 p-0.5 truncate">{st.customCaste || st.caste || '-'}</td>

                  {/* Days Attended School */}
                  <td className="border border-slate-900 p-0.5 font-mono font-bold">
                    {onUpdateAttendance ? (
                      <input
                        type="number"
                        min="0"
                        max={workingDays}
                        value={cSt.attendanceDays || ''}
                        onChange={(e) => onUpdateAttendance(st.id, Number(e.target.value))}
                        className="w-full text-center bg-transparent focus:bg-white font-mono font-bold focus:outline-none"
                        placeholder="0"
                      />
                    ) : (
                      cSt.attendanceDays
                    )}
                  </td>

                  {/* FL (100) */}
                  <td className="border border-slate-900 p-0.5 font-mono font-bold">
                    {isExempted ? '-' : onUpdateSubject100 ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={fl.total100 !== null && fl.total100 !== undefined ? fl.total100 : ''}
                        onChange={(e) => onUpdateSubject100(st.id, 'FL', Number(e.target.value))}
                        className="w-full text-center bg-transparent focus:bg-white font-mono font-bold text-slate-900 focus:outline-none"
                        placeholder="-"
                      />
                    ) : (
                      fl.total100 !== null && fl.total100 !== undefined ? fl.total100 : '-'
                    )}
                  </td>
                  <td className="border border-slate-900 p-0.5 font-black">{isExempted ? 'Exempt' : fl.grade}</td>

                  {/* SL (100) */}
                  <td className="border border-slate-900 p-0.5 font-mono font-bold">
                    {isExempted ? '-' : onUpdateSubject100 ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={sl.total100 !== null && sl.total100 !== undefined ? sl.total100 : ''}
                        onChange={(e) => onUpdateSubject100(st.id, 'SL', Number(e.target.value))}
                        className="w-full text-center bg-transparent focus:bg-white font-mono font-bold text-slate-900 focus:outline-none"
                        placeholder="-"
                      />
                    ) : (
                      sl.total100 !== null && sl.total100 !== undefined ? sl.total100 : '-'
                    )}
                  </td>
                  <td className="border border-slate-900 p-0.5 font-black">{isExempted ? 'Exempt' : sl.grade}</td>

                  {/* TL (100) */}
                  <td className="border border-slate-900 p-0.5 font-mono font-bold">
                    {isExempted ? '-' : onUpdateSubject100 ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={tl.total100 !== null && tl.total100 !== undefined ? tl.total100 : ''}
                        onChange={(e) => onUpdateSubject100(st.id, 'TL', Number(e.target.value))}
                        className="w-full text-center bg-transparent focus:bg-white font-mono font-bold text-slate-900 focus:outline-none"
                        placeholder="-"
                      />
                    ) : (
                      tl.total100 !== null && tl.total100 !== undefined ? tl.total100 : '-'
                    )}
                  </td>
                  <td className="border border-slate-900 p-0.5 font-black">{isExempted ? 'Exempt' : tl.grade}</td>

                  {/* MATHS (100) */}
                  <td className="border border-slate-900 p-0.5 font-mono font-bold">
                    {isExempted ? '-' : onUpdateSubject100 ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={maths.total100 !== null && maths.total100 !== undefined ? maths.total100 : ''}
                        onChange={(e) => onUpdateSubject100(st.id, 'MATHS', Number(e.target.value))}
                        className="w-full text-center bg-transparent focus:bg-white font-mono font-bold text-slate-900 focus:outline-none"
                        placeholder="-"
                      />
                    ) : (
                      maths.total100 !== null && maths.total100 !== undefined ? maths.total100 : '-'
                    )}
                  </td>
                  <td className="border border-slate-900 p-0.5 font-black">{isExempted ? 'Exempt' : maths.grade}</td>

                  {/* EVS (100) */}
                  <td className="border border-slate-900 p-0.5 font-mono font-bold">
                    {isExempted ? '-' : onUpdateSubject100 ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={evs.total100 !== null && evs.total100 !== undefined ? evs.total100 : ''}
                        onChange={(e) => onUpdateSubject100(st.id, 'EVS', Number(e.target.value))}
                        className="w-full text-center bg-transparent focus:bg-white font-mono font-bold text-slate-900 focus:outline-none"
                        placeholder="-"
                      />
                    ) : (
                      evs.total100 !== null && evs.total100 !== undefined ? evs.total100 : '-'
                    )}
                  </td>
                  <td className="border border-slate-900 p-0.5 font-black">{isExempted ? 'Exempt' : evs.grade}</td>

                  {/* TOTAL MARKS SECURED (500) */}
                  <td className="border border-slate-900 p-0.5 font-mono font-black bg-amber-50 text-slate-950">
                    {isExempted ? '-' : (cSt.totalMarks500 && cSt.totalMarks500 > 0 ? cSt.totalMarks500 : '-')}
                  </td>
                  <td className="border border-slate-900 p-0.5 font-mono font-bold">
                    {isExempted ? '-' : (cSt.totalMarks500 && cSt.totalMarks500 > 0 ? `${cSt.percentage}%` : '-')}
                  </td>
                  <td className={`border border-slate-900 p-0.5 font-black ${
                    cSt.overallGrade === 'A+' ? 'text-emerald-700 bg-emerald-50' :
                    cSt.overallGrade === 'A' ? 'text-emerald-600' :
                    cSt.overallGrade === 'Exempt' ? 'text-purple-700 bg-purple-50' : ''
                  }`}>
                    {cSt.overallGrade}
                  </td>

                  {/* 5 CO-SCHOLASTIC GRADES */}
                  {MARATHI_URDU_CO_ACTIVITIES.map((act) => (
                    <td key={act.key} className="border border-slate-900 p-0.5 font-mono font-bold">
                      {onUpdateFinalCoGrade ? (
                        <select
                          value={finalCo[act.key] || ''}
                          onChange={(e) => onUpdateFinalCoGrade(st.id, act.key, e.target.value)}
                          className="w-full text-center font-bold bg-transparent focus:bg-white text-[8px] focus:outline-none"
                        >
                          <option value="">-</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      ) : (
                        finalCo[act.key] || '-'
                      )}
                    </td>
                  ))}

                  {/* RESULT */}
                  <td className={`border border-slate-900 p-0.5 font-black ${
                    cSt.hasCwsnBadge ? 'text-purple-800' :
                    cSt.resultStatus.includes('PASS') || cSt.resultStatus.includes('PROMOTED')
                      ? 'text-emerald-800'
                      : 'text-red-700'
                  }`}>
                    {cSt.resultStatus}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Signatures matching Page 2 */}
      <div className="flex items-center justify-between pt-6 pb-2 text-xs font-bold text-slate-900 px-6">
        <div>Class Teacher's Sign</div>
        <div>Head Master Sign</div>
      </div>
    </div>
  );
};
