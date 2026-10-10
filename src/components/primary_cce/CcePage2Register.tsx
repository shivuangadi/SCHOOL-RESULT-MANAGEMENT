import React, { useState } from 'react';
import { SchoolRecord, isCwsnStudent } from '../../types';
import {
  ComputedStudentCce,
  CO_SCHOLASTIC_ACTIVITIES,
  extractLastWordOfSchoolName,
  PrimarySubjectCode,
} from '../../utils/primaryCceHelper';

interface CcePage2RegisterProps {
  computedList: ComputedStudentCce[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  selectedClass: string;
  classTeacherName: string;
  workingDays: number;
  reportRef?: React.RefObject<HTMLDivElement | null>;
  onUpdateSubject100?: (studentId: string, subCode: PrimarySubjectCode, total100: number) => void;
  onUpdateAttendance?: (studentId: string, days: number) => void;
  onUpdateFinalCoGrade?: (studentId: string, key: string, val: string) => void;
}

export const CcePage2Register: React.FC<CcePage2RegisterProps> = ({
  computedList,
  schoolRecord,
  academicYear,
  selectedClass,
  classTeacherName,
  workingDays,
  reportRef,
  onUpdateSubject100,
  onUpdateAttendance,
  onUpdateFinalCoGrade,
}) => {
  const defaultPlace = extractLastWordOfSchoolName(schoolRecord?.schoolName);
  const [placeName, setPlaceName] = useState(defaultPlace);

  const isKannada =
    (schoolRecord?.medium || (schoolRecord as any)?.schoolMedium || '').toLowerCase().includes('kannada') ||
    (schoolRecord?.medium || (schoolRecord as any)?.schoolMedium || '').includes('ಕನ್ನಡ') ||
    !(schoolRecord?.medium || (schoolRecord as any)?.schoolMedium);

  return (
    <div
      ref={reportRef}
      className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-300 shadow-md space-y-4 legal-landscape print:p-1 print:shadow-none print:border-none print:rounded-none"
    >
      {/* Official Header matching Page 2 */}
      <div className="text-center space-y-1 border-b-2 border-slate-900 pb-3">
        <p className="text-xs sm:text-sm font-black text-slate-900 tracking-wide uppercase">
          {isKannada
            ? `ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ ${schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ'}`
            : `Office of the Block Education Officer and Block Resource Coordinator, ${schoolRecord?.taluk || 'Belagavi Rural'}`}
        </p>
        <h2 className="text-base sm:text-lg font-black text-slate-950 font-serif tracking-wide">
          {schoolRecord?.schoolName || 'ಸರಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಕನ್ನಡ ಶಾಲೆ ನಿಂಗ್ಯಾನಟ್ಟಿ'}
        </h2>
        <h3 className="text-xs sm:text-sm font-extrabold text-slate-800">
          {academicYear} ನೇ ಸಾಲಿನ ರೂಪನಾತ್ಮಕ ಹಾಗೂ ಸಂಕಲನಾತ್ಮಕ ಮೌಲ್ಯಮಾಪನ ಕ್ರೋಢೀಕರಣ ವಹಿ (Page 2: 100 ಅಂಕಗಳ ವಹಿ)
        </h3>
        {/* Sub-header info: equally distributed along width, centered, equidistant, no overlap */}
        <div className="grid grid-cols-3 items-center text-center text-[10px] sm:text-xs font-bold text-slate-800 pt-2 px-2 w-full gap-2 border-t border-slate-200">
          <div className="flex justify-center items-center">
            <span className="bg-blue-100 text-blue-950 px-2.5 py-0.5 rounded border border-blue-300 font-black whitespace-nowrap">
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
              ವರ್ಗ ಶಿಕ್ಷಕರ ಹೆಸರು: <span className="text-slate-950 font-black">{classTeacherName || 'ವರ್ಗ ಶಿಕ್ಷಕರು'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main 100 Marks Register Table */}
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full min-w-[1050px] print:min-w-0 text-[8px] text-center border-collapse border border-slate-900 table-fixed">
          <thead>
            {/* Header Row 1 */}
            <tr className="bg-slate-100 font-bold text-slate-900">
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-5 align-middle">
                ಕ್ರ.ಸಂ
              </th>
              
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-10 align-middle">
                <span
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  className="inline-block whitespace-nowrap text-[8px] py-1 mx-auto"
                >
                  ದಾಖಲಾತಿ ಸಂಖ್ಯೆ
                </span>
              </th>

              <th rowSpan={3} className="border border-slate-900 p-0.5 w-11 align-middle">
                <span
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  className="inline-block whitespace-nowrap text-[8px] py-1 mx-auto"
                >
                  SATS ಸಂಖ್ಯೆ
                </span>
              </th>

              <th rowSpan={3} className="border border-slate-900 p-1 w-24 text-left align-middle font-black">
                ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು
              </th>

              <th rowSpan={3} className="border border-slate-900 p-0.5 w-10 align-middle">
                <span
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  className="inline-block whitespace-nowrap text-[8px] py-1 mx-auto"
                >
                  ಜನ್ಮ ದಿನಾಂಕ
                </span>
              </th>

              {/* Column 6: ಲಿಂಗ (Vertical Left to Right) */}
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-6 align-middle">
                <span
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  className="inline-block whitespace-nowrap font-black text-[8px] py-1 mx-auto"
                >
                  ಲಿಂಗ
                </span>
              </th>

              {/* Column 7: Social Cat (Vertical Left to Right) */}
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-6 align-middle">
                <span
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  className="inline-block whitespace-nowrap font-black text-[8px] py-1 mx-auto"
                >
                  ಪ್ರವರ್ಗ
                </span>
              </th>

              {/* Column 8: ಜಾತಿ (Vertical Left to Right) */}
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-7 align-middle">
                <span
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  className="inline-block whitespace-nowrap font-black text-[8px] py-1 mx-auto"
                >
                  ಜಾತಿ
                </span>
              </th>

              {/* Column 9: ಹಾಜರಾತಿ (Vertical Left to Right) */}
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-7 align-middle">
                <span
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  className="inline-block whitespace-nowrap font-black text-[8px] py-1 mx-auto"
                >
                  ಹಾಜರಾತಿ
                </span>
              </th>
              
              {/* SCHOLASTIC SUPER HEADER */}
              <th colSpan={8} className="border border-slate-900 p-0.5 bg-blue-50 font-black text-[9px]">
                ಪಠ್ಯ ಚಟುವಟಿಕೆಗಳು SCHOLASTIC
              </th>
              
              <th rowSpan={3} className="border border-slate-900 p-0.5 bg-amber-50 font-black w-8">
                ಒಟ್ಟು 400
              </th>
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-7 font-black text-red-600">
                ಶೇಕಡಾ
              </th>
              <th rowSpan={3} className="border border-slate-900 p-0.5 w-6 font-black bg-amber-100 text-green-700">
                ಶ್ರೇಣಿ
              </th>
              
              {/* CO-SCHOLASTIC SUPER HEADER */}
              <th colSpan={5} className="border border-slate-900 p-0.5 bg-indigo-50 font-black text-[9px]">
                ಆ. ಸಹ ಪಠ್ಯ ವಿಷಯಗಳು CO-SCHOLASTIC
              </th>
              
              <th rowSpan={3} className="border border-slate-900 p-0.5 bg-emerald-100 font-black w-9">
                <span
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  className="inline-block whitespace-nowrap font-black text-[8px] py-1 mx-auto"
                >
                  ಫಲಿತಾಂಶ
                </span>
              </th>
            </tr>

            {/* Sub-header 1: Subject titles (100 ಕ್ಕೆ) */}
            <tr className="bg-slate-50 font-bold text-slate-800 text-[8px]">
              <th colSpan={2} className="border border-slate-900 p-0.5 bg-blue-50/50">
                ಪ್ರಥಮ ಭಾಷೆ
              </th>
              <th colSpan={2} className="border border-slate-900 p-0.5 bg-blue-50/50">
                ದ್ವಿತೀಯ ಭಾಷೆ
              </th>
              <th colSpan={2} className="border border-slate-900 p-0.5 bg-blue-50/50">
                ಗಣಿತ
              </th>
              <th colSpan={2} className="border border-slate-900 p-0.5 bg-blue-50/50">
                ಪರಿಸರ ಅಧ್ಯಯನ
              </th>
              
              {/* Part B Co-scholastic activities - VERTICAL WRAPPED NO OVERLAP */}
              {CO_SCHOLASTIC_ACTIVITIES.map((act) => (
                <th
                  key={act.key}
                  rowSpan={2}
                  className="border border-slate-900 p-0.5 align-middle bg-indigo-50/50 w-7 overflow-hidden"
                >
                  <div className="flex items-center justify-center h-20 w-full overflow-hidden">
                    <span
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      className="inline-block whitespace-nowrap font-bold text-[7px] leading-tight"
                    >
                      {act.nameKn}
                    </span>
                  </div>
                </th>
              ))}
            </tr>

            {/* Sub-header 2: ಅಂಕ & ಶ್ರೇಣಿ columns */}
            <tr className="bg-slate-50 text-[7.5px] font-bold text-slate-700">
              <th className="border border-slate-900 p-0.5 w-6">ಅಂಕ</th>
              <th className="border border-slate-900 p-0.5 w-5">ಶ್ರೇಣಿ</th>
              <th className="border border-slate-900 p-0.5 w-6">ಅಂಕ</th>
              <th className="border border-slate-900 p-0.5 w-5">ಶ್ರೇಣಿ</th>
              <th className="border border-slate-900 p-0.5 w-6">ಅಂಕ</th>
              <th className="border border-slate-900 p-0.5 w-5">ಶ್ರೇಣಿ</th>
              <th className="border border-slate-900 p-0.5 w-6">ಅಂಕ</th>
              <th className="border border-slate-900 p-0.5 w-5">ಶ್ರೇಣಿ</th>
            </tr>
          </thead>
          <tbody>
            {computedList.map((cSt, idx) => {
              const st = cSt.student;
              const fl = cSt.subjects.FL;
              const sl = cSt.subjects.SL;
              const maths = cSt.subjects.MATHS;
              const evs = cSt.subjects.EVS;
              const co = cSt.coScholastic.final;

              return (
                <tr key={st.id} className="hover:bg-slate-50 border-b border-slate-800 text-[8px]">
                  <td className="border border-slate-900 p-0.5 font-mono font-bold">{idx + 1}</td>
                  <td className="border border-slate-900 p-0.5 font-mono truncate">{st.schoolRegNo || `${100 + idx + 1}/2026`}</td>
                  <td className="border border-slate-900 p-0.5 font-mono truncate">{st.satsNo || 'N/A'}</td>
                  
                  {/* Student Name */}
                  <td className="border border-slate-900 p-0.5 text-left font-bold truncate">
                    <div className="flex items-center justify-between gap-0.5">
                      <span className="truncate">{st.studentName}</span>
                      {(cSt.isExempted || isCwsnStudent(st.cwsnStatus)) && (
                        <span className="text-[7px] bg-purple-800 text-white font-black px-1 py-0.2 rounded shrink-0">
                          (CWSN)
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="border border-slate-900 p-0.5 font-mono truncate">{st.dob || st.dateOfBirth || '01/06/2016'}</td>
                  <td className="border border-slate-900 p-0.5 font-bold">{st.gender === 'Girl' ? 'ಹೆ' : 'ಗಂ'}</td>
                  <td className="border border-slate-900 p-0.5 font-bold">{(st as any).casteCategory || st.caste || 'OBC'}</td>
                  <td className="border border-slate-900 p-0.5 truncate">{st.customCaste || st.caste || '-'}</td>
                  
                  {/* Attendance Days (Editable 2-way sync) */}
                  <td className="border border-slate-900 p-0.5 font-mono font-bold">
                    {onUpdateAttendance ? (
                      <input
                        type="number"
                        min="0"
                        max={workingDays}
                        value={cSt.attendanceDays}
                        onChange={(e) => onUpdateAttendance(st.id, Number(e.target.value))}
                        className="w-full text-center bg-transparent focus:bg-white font-mono font-bold focus:outline-none"
                        title="Edit Total Attendance Days"
                      />
                    ) : (
                      cSt.attendanceDays
                    )}
                  </td>

                  {/* FL 100 Marks (Editable 2-Way Sync) */}
                  <td className="border border-slate-900 p-0.5 font-mono font-bold">
                    {cSt.isExempted ? (
                      '-'
                    ) : onUpdateSubject100 ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={fl.total100 !== null && fl.total100 !== undefined ? fl.total100 : ''}
                        onChange={(e) => onUpdateSubject100(st.id, 'FL', Number(e.target.value))}
                        placeholder="-"
                        className="w-full text-center bg-transparent focus:bg-white font-mono font-bold text-slate-900 focus:outline-none"
                        title="Edit First Language 100 Marks"
                      />
                    ) : (
                      fl.total100 !== null && fl.total100 !== undefined ? fl.total100 : '-'
                    )}
                  </td>
                  <td className="border border-slate-900 p-0.5 font-black">{cSt.isExempted ? 'Exempt' : fl.grade}</td>

                  {/* SL 100 Marks (Editable 2-Way Sync) */}
                  <td className="border border-slate-900 p-0.5 font-mono font-bold">
                    {cSt.isExempted ? (
                      '-'
                    ) : onUpdateSubject100 ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={sl.total100 !== null && sl.total100 !== undefined ? sl.total100 : ''}
                        onChange={(e) => onUpdateSubject100(st.id, 'SL', Number(e.target.value))}
                        placeholder="-"
                        className="w-full text-center bg-transparent focus:bg-white font-mono font-bold text-slate-900 focus:outline-none"
                        title="Edit Second Language 100 Marks"
                      />
                    ) : (
                      sl.total100 !== null && sl.total100 !== undefined ? sl.total100 : '-'
                    )}
                  </td>
                  <td className="border border-slate-900 p-0.5 font-black">{cSt.isExempted ? 'Exempt' : sl.grade}</td>

                  {/* MATHS 100 Marks (Editable 2-Way Sync) */}
                  <td className="border border-slate-900 p-0.5 font-mono font-bold">
                    {cSt.isExempted ? (
                      '-'
                    ) : onUpdateSubject100 ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={maths.total100 !== null && maths.total100 !== undefined ? maths.total100 : ''}
                        onChange={(e) => onUpdateSubject100(st.id, 'MATHS', Number(e.target.value))}
                        placeholder="-"
                        className="w-full text-center bg-transparent focus:bg-white font-mono font-bold text-slate-900 focus:outline-none"
                        title="Edit Mathematics 100 Marks"
                      />
                    ) : (
                      maths.total100 !== null && maths.total100 !== undefined ? maths.total100 : '-'
                    )}
                  </td>
                  <td className="border border-slate-900 p-0.5 font-black">{cSt.isExempted ? 'Exempt' : maths.grade}</td>

                  {/* EVS 100 Marks (Editable 2-Way Sync) */}
                  <td className="border border-slate-900 p-0.5 font-mono font-bold">
                    {cSt.isExempted ? (
                      '-'
                    ) : onUpdateSubject100 ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={evs.total100 !== null && evs.total100 !== undefined ? evs.total100 : ''}
                        onChange={(e) => onUpdateSubject100(st.id, 'EVS', Number(e.target.value))}
                        placeholder="-"
                        className="w-full text-center bg-transparent focus:bg-white font-mono font-bold text-slate-900 focus:outline-none"
                        title="Edit EVS 100 Marks"
                      />
                    ) : (
                      evs.total100 !== null && evs.total100 !== undefined ? evs.total100 : '-'
                    )}
                  </td>
                  <td className="border border-slate-900 p-0.5 font-black">{cSt.isExempted ? 'Exempt' : evs.grade}</td>

                  {/* Total 400 */}
                  <td className="border border-slate-900 p-0.5 font-mono font-black text-amber-950 bg-amber-50">
                    {cSt.isExempted ? '-' : (cSt.totalMarks400 > 0 ? cSt.totalMarks400 : '-')}
                  </td>
                  <td className="border border-slate-900 p-0.5 font-mono font-bold text-red-600">
                    {cSt.isExempted ? '-' : (cSt.totalMarks400 > 0 ? `${cSt.percentage}%` : '-')}
                  </td>
                  <td className="border border-slate-900 p-0.5 font-black text-emerald-700 bg-amber-100">
                    {cSt.overallGrade}
                  </td>

                  {/* Co-Scholastic Grades (Editable 2-Way Sync) */}
                  {CO_SCHOLASTIC_ACTIVITIES.map((act) => (
                    <td key={act.key} className="border border-slate-900 p-0.5 font-bold font-mono">
                      {onUpdateFinalCoGrade ? (
                        <select
                          value={co[act.key] || ''}
                          onChange={(e) => onUpdateFinalCoGrade(st.id, act.key, e.target.value)}
                          className="bg-transparent font-bold font-mono text-[8px] focus:outline-none cursor-pointer"
                        >
                          <option value="">-</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      ) : (
                        co[act.key] || '-'
                      )}
                    </td>
                  ))}

                  {/* Result */}
                  <td className={`border border-slate-900 p-0.5 font-bold ${
                    cSt.isExempted
                      ? 'text-purple-800'
                      : cSt.resultStatus.includes('PROMOTED')
                      ? 'text-emerald-800'
                      : 'text-red-800'
                  }`}>
                    {cSt.resultStatus}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Official Signatures & Editable Place Footer (Strictly single line nowrap) */}
      <div className="flex flex-nowrap items-center justify-between pt-3 pb-1 text-[9.5px] sm:text-[10px] font-bold text-slate-900 px-3 gap-2 border-t border-slate-300 whitespace-nowrap overflow-hidden w-full">
        <div className="flex items-center gap-1.5 shrink-0">
          <span>ಸ್ಥಳ:</span>
          <input
            type="text"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            className="border-b border-slate-400 font-bold px-1 bg-transparent w-28 focus:outline-blue-500 focus:bg-white text-slate-900 text-[9.5px]"
            placeholder="ಸ್ಥಳದ ಹೆಸರು"
            title="ಸ್ಥಳವನ್ನು ಬದಲಾಯಿಸಲು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ"
          />
        </div>
        <div className="shrink-0">
          <span>ದಿನಾಂಕ: {new Date().toLocaleDateString('kn-IN')}</span>
        </div>
        <div className="shrink-0">ಶಿಕ್ಷಕರ ಸಹಿ (Class Teacher)</div>
        <div className="shrink-0">ಮುಖ್ಯ ಗುರುಗಳ ಸಹಿ: <span className="font-black text-slate-950">{schoolRecord?.headmasterName || 'Headmaster'}</span></div>
      </div>
    </div>
  );
};
