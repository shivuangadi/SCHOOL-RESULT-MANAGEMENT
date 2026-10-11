import React, { useState } from 'react';
import { SchoolRecord, isCwsnStudent, isCwsnExempted } from '../../types';
import {
  ComputedHpStudent,
  HpSubjectCode,
  HP_PART_B_COLUMNS,
  getHpSubjectsForMedium,
} from '../../utils/higherPrimaryCceHelper';

interface HpCcePage3Register100Props {
  computedList: ComputedHpStudent[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  selectedClass: string;
  classTeacherName: string;
  workingDays: number;
  reportRef?: React.RefObject<HTMLDivElement | null>;
  onUpdateSubject100?: (studentId: string, subCode: HpSubjectCode, total100: number | null) => void;
  onUpdateAttendance?: (studentId: string, days: number) => void;
  onUpdateCoGrade?: (studentId: string, sem: 'sem1' | 'sem2' | 'final', key: string, val: string) => void;
}

export const HpCcePage3Register100: React.FC<HpCcePage3Register100Props> = ({
  computedList,
  schoolRecord,
  academicYear,
  selectedClass,
  classTeacherName,
  workingDays,
  reportRef,
  onUpdateSubject100,
  onUpdateAttendance,
  onUpdateCoGrade,
}) => {
  const medium = schoolRecord?.schoolMedium || 'Kannada';
  const subjects = getHpSubjectsForMedium(medium);

  const talukName = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
  const schoolName = schoolRecord?.schoolName || 'ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ';
  const clusterName = schoolRecord?.cluster || schoolRecord?.crcCluster || 'ಕ್ಲಸ್ಟರ್';
  const diseCode = schoolRecord?.diseCode || '';

  return (
    <div
      ref={reportRef}
      className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-300 shadow-md space-y-4 legal-landscape print:p-1 print:border-none print:shadow-none print:rounded-none"
    >
      {/* Official Header matching Page 3 */}
      <div className="text-center space-y-1 border-b-2 border-slate-900 pb-3">
        <p className="text-xs sm:text-sm font-black text-slate-900 tracking-wide uppercase">
          ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ, {talukName}
        </p>
        <h2 className="text-base sm:text-lg font-black text-slate-950 font-serif tracking-wide">
          {schoolName} • DISE: {diseCode}
        </h2>
        <h3 className="text-xs sm:text-sm font-extrabold text-blue-950">
          {academicYear} ನೇ ಸಾಲಿನ ೬ ರಿಂದ ೮ ನೇ ತರಗತಿಗಳ ವಾರ್ಷಿಕ ಕ್ರೋಢೀಕರಣ ವಹಿ (Page 3: ೧೦೦ ಅಂಕಗಳ ವಿಷಯವಾರು ವಹಿ - ೭೦೦ ಗರಿಷ್ಠ ಅಂಕಗಳು)
        </h3>

        {/* Sub-header info: evenly distributed along width */}
        <div className="grid grid-cols-4 items-center text-center text-[10px] sm:text-xs font-bold text-slate-800 pt-2 px-2 w-full gap-2 border-t border-slate-200">
          <div className="flex justify-start items-center">
            <span className="bg-blue-100 text-blue-950 px-2.5 py-0.5 rounded-lg border border-blue-300 font-black">
              ತರಗತಿ: {selectedClass}ನೇ ತರಗತಿ (Class {selectedClass})
            </span>
          </div>
          <div className="flex justify-center items-center text-slate-900">
            <span>ಕ್ಲಸ್ಟರ್: <span className="font-black">{clusterName}</span></span>
          </div>
          <div className="flex justify-center items-center text-slate-900">
            <span>ಶಾಲೆ ನಡೆದ ದಿನಗಳು: <span className="font-mono font-black text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">{workingDays}</span></span>
          </div>
          <div className="flex justify-end items-center text-slate-900">
            <span>ವರ್ಗ ಶಿಕ್ಷಕರು: <span className="text-slate-950 font-black">{classTeacherName || 'ವರ್ಗ ಶಿಕ್ಷಕರು'}</span></span>
          </div>
        </div>
      </div>

      {/* Main 100 Marks (700 Max Marks) Register Table */}
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full text-[8px] text-center border-collapse border border-slate-900 table-fixed">
          <thead>
            <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-900">
              <th rowSpan={2} className="border border-slate-900 p-0.5 w-[20px] align-middle">ಕ್ರ.ಸಂ</th>
              <th rowSpan={2} className="border border-slate-900 p-0.5 w-[42px] align-middle">ದಾಖಲಾತಿ<br />ಸಂಖ್ಯೆ</th>
              <th rowSpan={2} className="border border-slate-900 p-0.5 w-[48px] align-middle">SATS<br />ಸಂಖ್ಯೆ</th>
              <th rowSpan={2} className="border border-slate-900 p-1 w-[90px] text-left align-middle">ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು</th>
              <th rowSpan={2} className="border border-slate-900 p-0.5 w-[24px] align-middle">ಲಿಂಗ</th>
              <th rowSpan={2} className="border border-slate-900 p-0.5 w-[28px] align-middle">ಪ್ರವರ್ಗ</th>
              {subjects.map((s) => (
                <th key={s.code} colSpan={2} className="border border-slate-900 p-0.5 font-black bg-blue-50/60 truncate">
                  {s.nameKn}<br />
                  <span className="text-[7px] font-normal text-slate-600">({s.nameEn.split(' ')[0]})</span>
                </th>
              ))}
              <th rowSpan={2} className="border border-slate-900 p-0.5 w-[36px] bg-emerald-100 text-emerald-950 font-black align-middle">
                ಒಟ್ಟು ಅಂಕ<br />(700)
              </th>
              <th rowSpan={2} className="border border-slate-900 p-0.5 w-[26px] bg-emerald-100 text-emerald-950 font-black align-middle">
                %
              </th>
              <th rowSpan={2} className="border border-slate-900 p-0.5 w-[24px] bg-emerald-200 text-emerald-950 font-black align-middle">
                ಶ್ರೇಣಿ
              </th>
              <th colSpan={7} className="border border-slate-900 p-0.5 bg-purple-100 text-purple-950 font-black">
                ಭಾಗ-ಬಿ ಸಹ ಪಠ್ಯ ವಿಷಯಗಳು & ಚಟುವಟಿಕೆಗಳು (Part-B 1 to 7)
              </th>
              <th rowSpan={2} className="border border-slate-900 p-0.5 w-[30px] bg-slate-50 align-middle">
                ಹಾಜರಾತಿ
              </th>
              <th rowSpan={2} className="border border-slate-900 p-0.5 w-[45px] bg-amber-200 text-amber-950 font-black align-middle">
                ಫಲಿತಾಂಶ
              </th>
            </tr>
            <tr className="bg-slate-50 text-[7px] font-bold text-slate-800 border-b border-slate-900">
              {subjects.map((s) => (
                <React.Fragment key={s.code}>
                  <th className="border border-slate-900 p-0.5 w-[20px]">ಅಂಕ</th>
                  <th className="border border-slate-900 p-0.5 w-[16px]">ಶ್ರೇಣಿ</th>
                </React.Fragment>
              ))}
              {HP_PART_B_COLUMNS.map((col) => (
                <th key={col.key} className="border border-slate-900 p-0.5 w-[14px] bg-purple-50 text-[7px] font-black" title={`${col.num}] ${col.nameKn} (${col.nameEn})`}>
                  {col.num}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {computedList.map((cSt, idx) => {
              const st = cSt.student;
              const isExempt = cSt.isExempted;
              const finalCo = cSt.coScholastic.final;

              return (
                <tr key={st.id} className="hover:bg-slate-50 border-b border-slate-300">
                  <td className="border border-slate-900 p-0.5 font-bold font-mono text-slate-800">{idx + 1}</td>
                  <td className="border border-slate-900 p-0.5 font-mono text-[7px] text-slate-700">{st.schoolRegNo || '-'}</td>
                  <td className="border border-slate-900 p-0.5 font-mono text-[7px] text-slate-700">{st.satsNo || '-'}</td>
                  <td className="border border-slate-900 p-1 text-left font-bold text-slate-900 truncate">
                    <span>{st.studentName}</span>
                    {isExempt && (
                      <span className="text-[7px] bg-purple-700 text-white font-black px-1 rounded ml-1">
                        EXEMPT
                      </span>
                    )}
                  </td>
                  <td className="border border-slate-900 p-0.5">{st.gender === 'Boy' ? 'ಬಾಲಕ' : 'ಬಾಲಕಿ'}</td>
                  <td className="border border-slate-900 p-0.5 font-mono text-[7px]">{st.caste || 'Gen'}</td>

                  {/* 7 Subjects 100 Marks & Grade */}
                  {subjects.map((subInfo) => {
                    const sub = cSt.subjects[subInfo.code];

                    return (
                      <React.Fragment key={subInfo.code}>
                        <td className="border border-slate-900 p-0.5 font-mono font-bold text-slate-900 text-[12px]">
                          {sub?.total100 !== null && sub?.total100 !== undefined ? sub.total100 : '-'}
                        </td>
                        <td className="border border-slate-900 p-0.5 font-bold text-slate-800 text-[12px]">
                          {isExempt ? 'Exempt' : (sub?.grade || '-')}
                        </td>
                      </React.Fragment>
                    );
                  })}

                  {/* Grand Total 700 */}
                  <td className="border border-slate-900 p-0.5 font-mono font-black text-emerald-950 bg-emerald-50 text-[12px]">
                    {isExempt ? (cSt.totalMarks700 > 0 ? cSt.totalMarks700 : '-') : cSt.totalMarks700}
                  </td>
                  <td className="border border-slate-900 p-0.5 font-mono font-bold text-emerald-900 bg-emerald-50 text-[12px]">
                    {isExempt ? '-' : `${cSt.percentage}%`}
                  </td>
                  <td className="border border-slate-900 p-0.5 font-black text-emerald-950 bg-emerald-200 text-[12px]">
                    {isExempt ? 'Exempt' : cSt.overallGrade}
                  </td>

                  {/* Part B 1 to 7 */}
                  {HP_PART_B_COLUMNS.map((col) => (
                    <td key={col.key} className="border border-slate-900 p-0.5 font-mono font-bold text-purple-950 bg-purple-50/40 text-[12px]">
                      {col.type === 'subject'
                        ? cSt.partBSubjects?.[col.key]?.grade || '-'
                        : finalCo[col.key] || '-'}
                    </td>
                  ))}

                  {/* Attendance */}
                  <td className="border border-slate-900 p-0.5 font-mono font-bold text-slate-800">
                    {cSt.attendanceDays}
                  </td>

                  {/* Result */}
                  <td className={`border border-slate-900 p-0.5 font-black text-[7px] leading-tight ${
                    isExempt || cSt.isPassed ? 'bg-emerald-100 text-emerald-950' : 'bg-rose-100 text-rose-950'
                  }`}>
                    {isExempt || cSt.hasCwsnMarksAllowed
                      ? (medium === 'Kannada' ? 'ತೇರ್ಗಡೆ' : 'Promoted')
                      : cSt.totalMarks700 > 0
                      ? (cSt.isPassed ? (medium === 'Kannada' ? 'ತೇರ್ಗಡೆ' : 'Promoted') : (medium === 'Kannada' ? 'ಅನುತ್ತೀರ್ಣ' : 'Failed'))
                      : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Notes for Part B 1 to 7 */}
      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[9px] text-slate-700 space-y-1">
        <div className="font-bold text-slate-900">ಭಾಗ-ಬಿ ಕಾಲಂ ವಿವರಣೆ (Part-B Columns Reference): </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 text-[8.5px]">
          {HP_PART_B_COLUMNS.map((col) => (
            <div key={col.key} className="bg-white p-1 rounded border border-purple-200">
              <span className="font-black text-purple-950 mr-1">[{col.num}]</span>
              <span className="font-bold text-slate-900">{col.nameKn}</span>
              <div className="text-[7.5px] text-slate-500 font-normal">{col.nameEn}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Signatures distributed across page width */}
      <div className="w-full pt-4 pb-1 border-t-2 border-slate-900 mt-4">
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
  );
};
