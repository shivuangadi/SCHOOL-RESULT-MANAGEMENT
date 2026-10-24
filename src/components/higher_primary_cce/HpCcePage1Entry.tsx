import React from 'react';
import { Student, isCwsnStudent, isCwsnExempted } from '../../types';
import {
  HpSubjectCode,
  HpSubjectInfo,
  ComputedHpStudent,
  HP_CO_ACTIVITIES,
  HP_PART_B_SUBJECTS,
  getHpSubjectsForMedium,
  getHpCoGradeValue,
} from '../../utils/higherPrimaryCceHelper';

interface HpCcePage1EntryProps {
  students: Student[];
  computedList: ComputedHpStudent[];
  selectedSubject: HpSubjectCode;
  selectedClass: string;
  classTeacherName: string;
  workingDays: number;
  schoolMedium?: string;
  onSelectSubject: (code: HpSubjectCode) => void;
  onUpdateMarks: (studentId: string, subCode: HpSubjectCode, field: string, val: number | null) => void;
  onUpdateExamPct?: (studentId: string, subCode: HpSubjectCode, exam: 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2', val: number | null) => void;
  onUpdateSubject100?: (studentId: string, subCode: HpSubjectCode, total100: number | null) => void;
  onUpdateAttendance: (studentId: string, days: number) => void;
  onUpdateSemAttendance: (studentId: string, sem: 'sem1' | 'sem2', days: number) => void;
  onUpdateCoGrade: (studentId: string, sem: 'sem1' | 'sem2' | 'final', key: string, val: string) => void;
  onUpdatePartBMarks?: (studentId: string, subjectKey: string, sem: 'sem1' | 'sem2', val: number | null) => void;
}

export const HpCcePage1Entry: React.FC<HpCcePage1EntryProps> = ({
  computedList,
  selectedSubject,
  selectedClass,
  classTeacherName,
  workingDays,
  schoolMedium = 'Kannada',
  onSelectSubject,
  onUpdateMarks,
  onUpdateExamPct,
  onUpdateSubject100,
  onUpdateAttendance,
  onUpdateSemAttendance,
  onUpdateCoGrade,
  onUpdatePartBMarks,
}) => {
  const subjects = getHpSubjectsForMedium(schoolMedium);
  const activeSubjectInfo = subjects.find((s) => s.code === selectedSubject) || subjects[0];

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-300 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3 py-1.5 bg-blue-100 border border-blue-300 font-black text-xs text-blue-950 rounded-xl">
            {selectedClass}ನೇ ತರಗತಿ (Class {selectedClass})
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700">ವಿಷಯ / Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => onSelectSubject(e.target.value as HpSubjectCode)}
              className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 font-black text-xs text-emerald-950 rounded-xl focus:outline-emerald-500 cursor-pointer"
            >
              {subjects.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.nameKn} ({s.nameEn})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="px-3 py-1.5 bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl">
            ವರ್ಗ ಶಿಕ್ಷಕರು: <span className="font-black text-slate-950">{classTeacherName || 'ವರ್ಗ ಶಿಕ್ಷಕರು'}</span>
          </div>
          <div className="px-3 py-1.5 bg-amber-100 border border-amber-300 text-amber-950 font-bold rounded-xl">
            ಶಾಲೆ ನಡೆದ ದಿನಗಳು: <span className="font-mono font-black text-amber-900">{workingDays}</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          PART-A: SCHOLASTIC (ಪಠ್ಯ ವಿಷಯಗಳು)
          ======================================================== */}
      <div className="bg-white rounded-2xl border-2 border-slate-400 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm uppercase tracking-wide">
              PART-A ಪಠ್ಯ ವಿಷಯಗಳು (Scholastic) • {activeSubjectInfo.nameKn} ({activeSubjectInfo.nameEn})
            </span>
          </div>
          <span className="text-[11px] font-bold bg-blue-900/80 px-2.5 py-0.5 rounded-lg border border-blue-400 text-amber-300">
            ಗರಿಷ್ಠ ಅಂಕಗಳು: 100 (SEM 1: 50 + SEM 2: 50)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-xs text-center border-collapse border border-slate-400">
            <thead>
              <tr className="bg-blue-100/90 text-blue-950 font-black border-b border-slate-400">
                <th rowSpan={2} className="border border-slate-400 p-1 w-10">ಕ್ರ.ಸಂ</th>
                <th rowSpan={2} className="border border-slate-400 p-2 min-w-[170px] text-left">
                  ವಿದ್ಯಾರ್ಥಿ/ನಿಯರ ಹೆಸರು<br />
                  <span className="text-[10px] text-slate-600 font-mono font-normal">SATS NO</span>
                </th>
                <th colSpan={3} className="border border-slate-400 p-1 bg-blue-50">FA1 (10)</th>
                <th colSpan={3} className="border border-slate-400 p-1 bg-blue-50">FA2 (10)</th>
                <th colSpan={3} className="border border-slate-400 p-1 bg-indigo-50">SA1 (30)</th>
                <th rowSpan={2} className="border border-slate-400 p-1 bg-amber-100 text-amber-950 font-black min-w-[70px]">
                  SEM1 Total<br />50%
                </th>
                <th colSpan={3} className="border border-slate-400 p-1 bg-blue-50">FA3 (10)</th>
                <th colSpan={3} className="border border-slate-400 p-1 bg-blue-50">FA4 (10)</th>
                <th colSpan={3} className="border border-slate-400 p-1 bg-indigo-50">SA2 (30)</th>
                <th rowSpan={2} className="border border-slate-400 p-1 bg-amber-100 text-amber-950 font-black min-w-[70px]">
                  SEM2 Total<br />50%
                </th>
                <th rowSpan={2} className="border border-slate-400 p-1 bg-emerald-100 text-emerald-950 font-black min-w-[75px]">
                  ಒಟ್ಟು ಅಂಕ<br />(100)
                </th>
                <th rowSpan={2} className="border border-slate-400 p-1 bg-emerald-200 text-emerald-950 font-black min-w-[50px]">
                  ಶ್ರೇಣಿ
                </th>
                <th rowSpan={2} className="border border-slate-400 p-1 bg-amber-200 text-amber-950 font-black min-w-[75px]">
                  ಫಲಿತಾಂಶ<br />Result
                </th>
              </tr>
              <tr className="bg-slate-100 text-[11px] font-bold text-slate-800 border-b border-slate-400">
                {/* FA1 */}
                <th className="border border-slate-400 p-1 w-11">ಅಂಕ (20)</th>
                <th className="border border-slate-400 p-1 w-11 text-blue-700 font-mono font-bold">10%</th>
                <th className="border border-slate-400 p-1 w-9">ಶ್ರೇಣಿ</th>
                {/* FA2 */}
                <th className="border border-slate-400 p-1 w-11">ಅಂಕ (20)</th>
                <th className="border border-slate-400 p-1 w-11 text-blue-700 font-mono font-bold">10%</th>
                <th className="border border-slate-400 p-1 w-9">ಶ್ರೇಣಿ</th>
                {/* SA1 */}
                <th className="border border-slate-400 p-1 w-11">ಅಂಕ (50)</th>
                <th className="border border-slate-400 p-1 w-11 text-indigo-700 font-mono font-bold">30%</th>
                <th className="border border-slate-400 p-1 w-9">ಶ್ರೇಣಿ</th>
                {/* FA3 */}
                <th className="border border-slate-400 p-1 w-11">ಅಂಕ (20)</th>
                <th className="border border-slate-400 p-1 w-11 text-blue-700 font-mono font-bold">10%</th>
                <th className="border border-slate-400 p-1 w-9">ಶ್ರೇಣಿ</th>
                {/* FA4 */}
                <th className="border border-slate-400 p-1 w-11">ಅಂಕ (20)</th>
                <th className="border border-slate-400 p-1 w-11 text-blue-700 font-mono font-bold">10%</th>
                <th className="border border-slate-400 p-1 w-9">ಶ್ರೇಣಿ</th>
                {/* SA2 */}
                <th className="border border-slate-400 p-1 w-11">ಅಂಕ (50)</th>
                <th className="border border-slate-400 p-1 w-11 text-indigo-700 font-mono font-bold">30%</th>
                <th className="border border-slate-400 p-1 w-9">ಶ್ರೇಣಿ</th>
              </tr>
            </thead>
            <tbody>
              {computedList.map((cSt, idx) => {
                const st = cSt.student;
                const sub = cSt.subjects[selectedSubject];
                const isExempt = cSt.isExempted;

                return (
                  <tr key={st.id} className="border-t border-slate-300 hover:bg-slate-50">
                    <td className="border border-slate-400 p-1 font-bold font-mono text-slate-700">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-400 p-2 text-left font-bold text-slate-900">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{st.studentName}</span>
                        {isExempt && (
                          <span className="text-[10px] bg-purple-700 text-white font-black px-1.5 py-0.5 rounded shadow-xs shrink-0" title="CWSN Exempted">
                            EXEMPT
                          </span>
                        )}
                        {cSt.hasCwsnMarksAllowed && (
                          <span className="text-[10px] bg-indigo-600 text-white font-black px-1.5 py-0.5 rounded shadow-xs shrink-0" title="CWSN Marks Allowed">
                            CWSN
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono font-normal">
                        SATS: {st.satsNo || 'N/A'}
                      </div>
                    </td>

                    {/* If student is CWSN Exempted: show complete row blocked with CWSN and Promoted in Result */}
                    {isExempt ? (
                      <>
                        <td
                          colSpan={22}
                          className="border border-slate-400 p-2 bg-purple-100/90 text-purple-950 font-black text-center tracking-wide"
                        >
                          <div className="flex items-center justify-center gap-3">
                            <span className="px-3 py-1 bg-purple-800 text-white rounded-lg text-xs">
                              CWSN (ವಿನಾಯಿತಿ / EXEMPT)
                            </span>
                            <span className="text-xs text-purple-900 font-bold">
                              ಮೌಲ್ಯಮಾಪನದಿಂದ ವಿನಾಯಿತಿ ನೀಡಲಾಗಿದೆ
                            </span>
                          </div>
                        </td>
                        <td className="border border-slate-400 p-1 font-black text-xs text-center bg-emerald-100 text-emerald-950">
                          {schoolMedium === 'Kannada' ? 'ತೇರ್ಗಡೆ' : 'Promoted'}
                        </td>
                      </>
                    ) : (
                      <>
                        {/* FA1 (10) */}
                        <td className="border border-slate-400 p-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub?.fa1 !== null && sub?.fa1 !== undefined ? sub.fa1 : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              const n = clean === '' ? null : Math.min(20, parseInt(clean, 10));
                              onUpdateMarks(st.id, selectedSubject, 'fa1', n);
                            }}
                            className="w-10 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                            placeholder="-"
                            title="FA1 Raw Marks (Max 20)"
                          />
                        </td>
                        <td className="border border-slate-400 p-1 font-mono font-bold text-blue-700 bg-blue-50/40">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub?.fa1_pct !== null && sub?.fa1_pct !== undefined ? sub.fa1_pct : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              const n = clean === '' ? null : Math.min(10, parseInt(clean, 10));
                              if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'fa1', n);
                              else onUpdateMarks(st.id, selectedSubject, 'fa1', n !== null ? n * 2 : null);
                            }}
                            className="w-10 text-center font-bold text-blue-900 bg-white border border-blue-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                            placeholder="-"
                            title="FA1 10% (Max 10 - 2-Way Synced)"
                          />
                        </td>
                        <td className="border border-slate-400 p-1 font-bold text-slate-700">
                          {sub?.fa1_grade || '-'}
                        </td>

                        {/* FA2 (10) */}
                        <td className="border border-slate-400 p-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub?.fa2 !== null && sub?.fa2 !== undefined ? sub.fa2 : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              const n = clean === '' ? null : Math.min(20, parseInt(clean, 10));
                              onUpdateMarks(st.id, selectedSubject, 'fa2', n);
                            }}
                            className="w-10 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                            placeholder="-"
                            title="FA2 Raw Marks (Max 20)"
                          />
                        </td>
                        <td className="border border-slate-400 p-1 font-mono font-bold text-blue-700 bg-blue-50/40">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub?.fa2_pct !== null && sub?.fa2_pct !== undefined ? sub.fa2_pct : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              const n = clean === '' ? null : Math.min(10, parseInt(clean, 10));
                              if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'fa2', n);
                              else onUpdateMarks(st.id, selectedSubject, 'fa2', n !== null ? n * 2 : null);
                            }}
                            className="w-10 text-center font-bold text-blue-900 bg-white border border-blue-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                            placeholder="-"
                            title="FA2 10% (Max 10 - 2-Way Synced)"
                          />
                        </td>
                        <td className="border border-slate-400 p-1 font-bold text-slate-700">
                          {sub?.fa2_grade || '-'}
                        </td>

                        {/* SA1 (30) */}
                        <td className="border border-slate-400 p-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub?.sa1 !== null && sub?.sa1 !== undefined ? sub.sa1 : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              const n = clean === '' ? null : Math.min(50, parseInt(clean, 10));
                              onUpdateMarks(st.id, selectedSubject, 'sa1', n);
                            }}
                            className="w-11 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                            placeholder="-"
                            title="SA1 Raw Marks (Max 50)"
                          />
                        </td>
                        <td className="border border-slate-400 p-1 font-mono font-bold text-indigo-700 bg-indigo-50/40">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub?.sa1_pct !== null && sub?.sa1_pct !== undefined ? sub.sa1_pct : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              const n = clean === '' ? null : Math.min(30, parseInt(clean, 10));
                              if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'sa1', n);
                              else onUpdateMarks(st.id, selectedSubject, 'sa1', n !== null ? Math.min(50, Math.round((n * 50) / 30)) : null);
                            }}
                            className="w-11 text-center font-bold text-indigo-900 bg-white border border-indigo-300 rounded p-0.5 focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                            placeholder="-"
                            title="SA1 30% (Max 30 - 2-Way Synced)"
                          />
                        </td>
                        <td className="border border-slate-400 p-1 font-bold text-slate-700">
                          {sub?.sa1_grade || '-'}
                        </td>

                        {/* SEM1 Total 50 */}
                        <td className="border border-slate-400 p-1 font-mono font-black text-amber-900 bg-amber-50">
                          {sub?.sem1_total !== null && sub?.sem1_total !== undefined ? sub.sem1_total : '-'}
                        </td>

                        {/* FA3 (10) */}
                        <td className="border border-slate-400 p-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub?.fa3 !== null && sub?.fa3 !== undefined ? sub.fa3 : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              const n = clean === '' ? null : Math.min(20, parseInt(clean, 10));
                              onUpdateMarks(st.id, selectedSubject, 'fa3', n);
                            }}
                            className="w-10 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                            placeholder="-"
                            title="FA3 Raw Marks (Max 20)"
                          />
                        </td>
                        <td className="border border-slate-400 p-1 font-mono font-bold text-blue-700 bg-blue-50/40">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub?.fa3_pct !== null && sub?.fa3_pct !== undefined ? sub.fa3_pct : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              const n = clean === '' ? null : Math.min(10, parseInt(clean, 10));
                              if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'fa3', n);
                              else onUpdateMarks(st.id, selectedSubject, 'fa3', n !== null ? n * 2 : null);
                            }}
                            className="w-10 text-center font-bold text-blue-900 bg-white border border-blue-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                            placeholder="-"
                            title="FA3 10% (Max 10 - 2-Way Synced)"
                          />
                        </td>
                        <td className="border border-slate-400 p-1 font-bold text-slate-700">
                          {sub?.fa3_grade || '-'}
                        </td>

                        {/* FA4 (10) */}
                        <td className="border border-slate-400 p-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub?.fa4 !== null && sub?.fa4 !== undefined ? sub.fa4 : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              const n = clean === '' ? null : Math.min(20, parseInt(clean, 10));
                              onUpdateMarks(st.id, selectedSubject, 'fa4', n);
                            }}
                            className="w-10 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                            placeholder="-"
                            title="FA4 Raw Marks (Max 20)"
                          />
                        </td>
                        <td className="border border-slate-400 p-1 font-mono font-bold text-blue-700 bg-blue-50/40">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub?.fa4_pct !== null && sub?.fa4_pct !== undefined ? sub.fa4_pct : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              const n = clean === '' ? null : Math.min(10, parseInt(clean, 10));
                              if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'fa4', n);
                              else onUpdateMarks(st.id, selectedSubject, 'fa4', n !== null ? n * 2 : null);
                            }}
                            className="w-10 text-center font-bold text-blue-900 bg-white border border-blue-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                            placeholder="-"
                            title="FA4 10% (Max 10 - 2-Way Synced)"
                          />
                        </td>
                        <td className="border border-slate-400 p-1 font-bold text-slate-700">
                          {sub?.fa4_grade || '-'}
                        </td>

                        {/* SA2 (30) */}
                        <td className="border border-slate-400 p-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub?.sa2 !== null && sub?.sa2 !== undefined ? sub.sa2 : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              const n = clean === '' ? null : Math.min(50, parseInt(clean, 10));
                              onUpdateMarks(st.id, selectedSubject, 'sa2', n);
                            }}
                            className="w-11 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                            placeholder="-"
                            title="SA2 Raw Marks (Max 50)"
                          />
                        </td>
                        <td className="border border-slate-400 p-1 font-mono font-bold text-indigo-700 bg-indigo-50/40">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub?.sa2_pct !== null && sub?.sa2_pct !== undefined ? sub.sa2_pct : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              const n = clean === '' ? null : Math.min(30, parseInt(clean, 10));
                              if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'sa2', n);
                              else onUpdateMarks(st.id, selectedSubject, 'sa2', n !== null ? Math.min(50, Math.round((n * 50) / 30)) : null);
                            }}
                            className="w-11 text-center font-bold text-indigo-900 bg-white border border-indigo-300 rounded p-0.5 focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                            placeholder="-"
                            title="SA2 30% (Max 30 - 2-Way Synced)"
                          />
                        </td>
                        <td className="border border-slate-400 p-1 font-bold text-slate-700">
                          {sub?.sa2_grade || '-'}
                        </td>

                        {/* SEM2 Total 50 */}
                        <td className="border border-slate-400 p-1 font-mono font-black text-amber-900 bg-amber-50">
                          {sub?.sem2_total !== null && sub?.sem2_total !== undefined ? sub.sem2_total : '-'}
                        </td>

                        {/* Total 100 */}
                        <td className="border border-slate-400 p-1 font-mono font-black text-emerald-950 bg-emerald-50">
                          {sub?.total100 !== null && sub?.total100 !== undefined ? sub.total100 : '-'}
                        </td>

                        {/* Grade */}
                        <td className="border border-slate-400 p-1 font-black text-emerald-900 bg-emerald-100">
                          {sub?.grade || '-'}
                        </td>

                        {/* Result */}
                        <td className={`border border-slate-400 p-1 font-black text-xs text-center ${
                          cSt.isPassed ? 'bg-emerald-100 text-emerald-950' : 'bg-rose-100 text-rose-950'
                        }`}>
                          {cSt.hasCwsnMarksAllowed
                            ? (schoolMedium === 'Kannada' ? 'ತೇರ್ಗಡೆ' : 'Promoted')
                            : sub?.total100 !== null && sub?.total100 !== undefined
                            ? (cSt.isPassed ? (schoolMedium === 'Kannada' ? 'ತೇರ್ಗಡೆ' : 'Promoted') : (schoolMedium === 'Kannada' ? 'ಅನುತ್ತೀರ್ಣ' : 'Failed'))
                            : '-'}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          PART-B: CO-SCHOLASTIC & PART-B SUBJECTS (Numbered Headings)
          ======================================================== */}
      <div className="bg-white rounded-2xl border-2 border-slate-400 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-purple-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <span
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
            className="font-black text-sm uppercase tracking-wide"
          >
            PART-B: ಸಹ ಪಠ್ಯ ಚಟುವಟಿಕೆಗಳು & ವಿಷಯಗಳು (Co-Scholastic & Part-B Subjects)
          </span>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-amber-300 bg-purple-950/80 px-2.5 py-0.5 rounded-lg border border-purple-500">
              ಕಲಾ ಶಿಕ್ಷಣ & ಕಂಪ್ಯೂಟರ್ (ಪ್ರತ್ಯೇಕ 50+50 ಅಂಕಗಳು) • ಸಹಪಠ್ಯ ಶ್ರೇಣಿಗಳು (A, B, C)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-xs text-center border-collapse border border-slate-400">
            <thead>
              <tr className="bg-purple-100/90 text-purple-950 font-black border-b border-slate-400">
                <th rowSpan={2} className="border border-slate-400 p-1.5 w-10">ಕ್ರ.ಸಂ</th>
                <th rowSpan={2} className="border border-slate-400 p-2 min-w-[170px] text-left">
                  ವಿದ್ಯಾರ್ಥಿ/ನಿಯರ ಹೆಸರು
                </th>
                <th rowSpan={2} className="border border-slate-400 p-1.5 w-16">SEM</th>
                <th rowSpan={2} className="border border-slate-400 p-1.5 min-w-[80px]">ಹಾಜರಿದ್ದ ದಿನಗಳು</th>

                {/* 2 Subjects in Part B: Direct SEM1 50m + SEM2 50m */}
                <th colSpan={2} className="border border-slate-400 p-1.5 bg-indigo-100 text-indigo-950 min-w-[140px]">
                  ಕಲಾ ಶಿಕ್ಷಣ / ಕಾರ್ಯಾನುಭವ<br />
                  <span className="text-[10px] text-indigo-900 font-bold">Art Edu / Work Exp (50m+50m)</span>
                </th>
                <th colSpan={2} className="border border-slate-400 p-1.5 bg-blue-100 text-blue-950 min-w-[140px]">
                  ಕಂಪ್ಯೂಟರ್‌ ಶಿಕ್ಷಣ / ICT<br />
                  <span className="text-[10px] text-blue-900 font-bold">Computer Education / ICT (50m+50m)</span>
                </th>

                {/* 7 Co-scholastic activities with numbered headings */}
                {HP_CO_ACTIVITIES.map((act) => (
                  <th key={act.key} rowSpan={2} className="border border-slate-400 p-1.5 min-w-[125px] text-[11px] font-black bg-purple-50 text-purple-950">
                    {act.nameKn}<br />
                    <span className="text-[9.5px] text-slate-600 font-normal">{act.nameEn}</span>
                  </th>
                ))}

                <th rowSpan={2} className="border border-slate-400 p-1.5 min-w-[85px] bg-amber-100 text-amber-950 font-black">
                  ಫಲಿತಾಂಶ<br />Result
                </th>
              </tr>

              <tr className="bg-slate-100 text-[10.5px] font-bold text-slate-800 border-b border-slate-400">
                {/* ಕಲಾ ಶಿಕ್ಷಣ/ಕಾರ್ಯಾನುಭವ subheaders */}
                <th className="border border-slate-400 p-1 w-16 bg-indigo-50/70">ಅಂಕ (50)</th>
                <th className="border border-slate-400 p-1 w-11 bg-indigo-50/70">ಶ್ರೇಣಿ</th>
                {/* ಕಂಪ್ಯೂಟರ್‌ ಶಿಕ್ಷಣ/ICT subheaders */}
                <th className="border border-slate-400 p-1 w-16 bg-blue-50/70">ಅಂಕ (50)</th>
                <th className="border border-slate-400 p-1 w-11 bg-blue-50/70">ಶ್ರೇಣಿ</th>
              </tr>
            </thead>
            <tbody>
              {computedList.map((cSt, idx) => {
                const st = cSt.student;
                const sem1 = cSt.coScholastic.sem1;
                const sem2 = cSt.coScholastic.sem2;
                const final = cSt.coScholastic.final;
                const isExempt = cSt.isExempted;
                const artSub = cSt.partBSubjects?.art_workexp;
                const ictSub = cSt.partBSubjects?.ict_computer;

                return (
                  <React.Fragment key={st.id}>
                    {/* SEM-1 Row */}
                    <tr className="border-t border-slate-300 hover:bg-slate-50">
                      <td rowSpan={3} className="border border-slate-400 p-2 font-bold font-mono text-slate-600 align-middle">
                        {idx + 1}
                      </td>
                      <td rowSpan={3} className="border border-slate-400 p-2 text-left font-bold text-slate-900 align-middle">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate">{st.studentName}</span>
                          {isExempt && (
                            <span className="text-[10px] bg-purple-700 text-white font-black px-1.5 py-0.5 rounded shadow-xs shrink-0" title="CWSN Exempt">
                              EXEMPT
                            </span>
                          )}
                          {cSt.hasCwsnMarksAllowed && (
                            <span className="text-[10px] bg-indigo-600 text-white font-black px-1.5 py-0.5 rounded shadow-xs shrink-0" title="CWSN Marks Allowed">
                              CWSN
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono font-normal">
                          SATS: {st.satsNo || 'N/A'}
                        </div>
                      </td>
                      <td className="border border-slate-400 p-1 font-bold text-blue-800 bg-blue-50/50">
                        SEM-1
                      </td>
                      <td className="border border-slate-400 p-1">
                        <input
                          type="number"
                          min="0"
                          max={Math.max(0, workingDays - (cSt.sem2Attendance || 0))}
                          value={cSt.sem1Attendance || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const maxAllowed = Math.max(0, workingDays - (cSt.sem2Attendance || 0));
                            const clamped = Math.max(0, Math.min(val, maxAllowed));
                            onUpdateSemAttendance(st.id, 'sem1', clamped);
                          }}
                          placeholder="0"
                          className="w-14 text-center font-mono font-bold text-slate-800 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* 1-ಕಲಾ ಶಿಕ್ಷಣ/ಕಾರ್ಯಾನುಭವ SEM-1 (Max 50) */}
                      <td className="border border-slate-400 p-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={artSub?.sem1 !== null && artSub?.sem1 !== undefined ? artSub.sem1 : ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '');
                            const n = clean === '' ? null : Math.min(50, Math.max(0, parseInt(clean, 10)));
                            if (onUpdatePartBMarks) onUpdatePartBMarks(st.id, 'art_workexp', 'sem1', n);
                          }}
                          className="w-12 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                          placeholder="-"
                          title="Art Edu / Work Exp SEM-1 Marks (Max 50)"
                        />
                      </td>
                      <td className="border border-slate-400 p-1 font-bold text-indigo-900 bg-indigo-50/40">
                        {artSub?.sem1_grade || '-'}
                      </td>

                      {/* 2-ಕಂಪ್ಯೂಟರ್‌ ಶಿಕ್ಷಣ/ICT SEM-1 (Max 50) */}
                      <td className="border border-slate-400 p-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={ictSub?.sem1 !== null && ictSub?.sem1 !== undefined ? ictSub.sem1 : ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '');
                            const n = clean === '' ? null : Math.min(50, Math.max(0, parseInt(clean, 10)));
                            if (onUpdatePartBMarks) onUpdatePartBMarks(st.id, 'ict_computer', 'sem1', n);
                          }}
                          className="w-12 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                          placeholder="-"
                          title="Computer Education / ICT SEM-1 Marks (Max 50)"
                        />
                      </td>
                      <td className="border border-slate-400 p-1 font-bold text-blue-900 bg-blue-50/40">
                        {ictSub?.sem1_grade || '-'}
                      </td>

                      {/* Co-scholastic activities SEM-1 */}
                      {HP_CO_ACTIVITIES.map((act) => (
                        <td key={act.key} className="border border-slate-400 p-1">
                          <select
                            value={getHpCoGradeValue(sem1, act.key) !== '-' ? getHpCoGradeValue(sem1, act.key) : ''}
                            onChange={(e) => onUpdateCoGrade(st.id, 'sem1', act.key, e.target.value)}
                            className="bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold text-slate-800 focus:ring-1 focus:ring-purple-500 cursor-pointer text-xs"
                          >
                            <option value="">-</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                          </select>
                        </td>
                      ))}

                      {/* Result spanning 3 rows */}
                      <td
                        rowSpan={3}
                        className="border border-slate-400 p-1 font-black text-xs text-center align-middle bg-emerald-50 text-emerald-950"
                      >
                        {isExempt || cSt.hasCwsnMarksAllowed
                          ? (schoolMedium === 'Kannada' ? 'ತೇರ್ಗಡೆ' : 'Promoted')
                          : cSt.totalMarks700 > 0
                          ? (cSt.isPassed ? (schoolMedium === 'Kannada' ? 'ತೇರ್ಗಡೆ' : 'Promoted') : (schoolMedium === 'Kannada' ? 'ಅನುತ್ತೀರ್ಣ' : 'Failed'))
                          : '-'}
                      </td>
                    </tr>

                    {/* SEM-2 Row */}
                    <tr className="hover:bg-slate-50">
                      <td className="border border-slate-400 p-1 font-bold text-indigo-800 bg-indigo-50/50">
                        SEM-2
                      </td>
                      <td className="border border-slate-400 p-1">
                        <input
                          type="number"
                          min="0"
                          max={Math.max(0, workingDays - (cSt.sem1Attendance || 0))}
                          value={cSt.sem2Attendance || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const maxAllowed = Math.max(0, workingDays - (cSt.sem1Attendance || 0));
                            const clamped = Math.max(0, Math.min(val, maxAllowed));
                            onUpdateSemAttendance(st.id, 'sem2', clamped);
                          }}
                          placeholder="0"
                          className="w-14 text-center font-mono font-bold text-slate-800 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* 1-ಕಲಾ ಶಿಕ್ಷಣ/ಕಾರ್ಯಾನುಭವ SEM-2 (Max 50) */}
                      <td className="border border-slate-400 p-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={artSub?.sem2 !== null && artSub?.sem2 !== undefined ? artSub.sem2 : ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '');
                            const n = clean === '' ? null : Math.min(50, Math.max(0, parseInt(clean, 10)));
                            if (onUpdatePartBMarks) onUpdatePartBMarks(st.id, 'art_workexp', 'sem2', n);
                          }}
                          className="w-12 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                          placeholder="-"
                          title="Art Edu / Work Exp SEM-2 Marks (Max 50)"
                        />
                      </td>
                      <td className="border border-slate-400 p-1 font-bold text-indigo-900 bg-indigo-50/40">
                        {artSub?.sem2_grade || '-'}
                      </td>

                      {/* 2-ಕಂಪ್ಯೂಟರ್‌ ಶಿಕ್ಷಣ/ICT SEM-2 (Max 50) */}
                      <td className="border border-slate-400 p-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={ictSub?.sem2 !== null && ictSub?.sem2 !== undefined ? ictSub.sem2 : ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '');
                            const n = clean === '' ? null : Math.min(50, Math.max(0, parseInt(clean, 10)));
                            if (onUpdatePartBMarks) onUpdatePartBMarks(st.id, 'ict_computer', 'sem2', n);
                          }}
                          className="w-12 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                          placeholder="-"
                          title="Computer Education / ICT SEM-2 Marks (Max 50)"
                        />
                      </td>
                      <td className="border border-slate-400 p-1 font-bold text-blue-900 bg-blue-50/40">
                        {ictSub?.sem2_grade || '-'}
                      </td>

                      {/* Co-scholastic activities SEM-2 */}
                      {HP_CO_ACTIVITIES.map((act) => (
                        <td key={act.key} className="border border-slate-400 p-1">
                          <select
                            value={getHpCoGradeValue(sem2, act.key) !== '-' ? getHpCoGradeValue(sem2, act.key) : ''}
                            onChange={(e) => onUpdateCoGrade(st.id, 'sem2', act.key, e.target.value)}
                            className="bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold text-slate-800 focus:ring-1 focus:ring-purple-500 cursor-pointer text-xs"
                          >
                            <option value="">-</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                          </select>
                        </td>
                      ))}
                    </tr>

                    {/* Total Row */}
                    <tr className="bg-amber-50/60 font-bold border-b-2 border-slate-400">
                      <td className="border border-slate-400 p-1 text-amber-950 font-black">
                        Total
                      </td>
                      <td className="border border-slate-400 p-1">
                        <input
                          type="number"
                          min="0"
                          max={workingDays}
                          value={cSt.attendanceDays || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const clamped = Math.max(0, Math.min(val, workingDays));
                            onUpdateAttendance(st.id, clamped);
                          }}
                          placeholder="0"
                          className="w-14 text-center font-mono font-black text-slate-900 bg-white border border-slate-300 rounded p-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* 1-ಕಲಾ ಶಿಕ್ಷಣ/ಕಾರ್ಯಾನುಭವ Total (100) */}
                      <td className="border border-slate-400 p-1 font-mono font-black text-indigo-950 bg-indigo-50/80">
                        {artSub?.total !== null && artSub?.total !== undefined ? artSub.total : '-'}
                      </td>
                      <td className="border border-slate-400 p-1 font-black text-indigo-950 bg-indigo-100">
                        {artSub?.grade || '-'}
                      </td>

                      {/* 2-ಕಂಪ್ಯೂಟರ್‌ ಶಿಕ್ಷಣ/ICT Total (100) */}
                      <td className="border border-slate-400 p-1 font-mono font-black text-blue-950 bg-blue-50/80">
                        {ictSub?.total !== null && ictSub?.total !== undefined ? ictSub.total : '-'}
                      </td>
                      <td className="border border-slate-400 p-1 font-black text-blue-950 bg-blue-100">
                        {ictSub?.grade || '-'}
                      </td>

                      {/* Co-scholastic activities Final */}
                      {HP_CO_ACTIVITIES.map((act) => (
                        <td key={act.key} className="border border-slate-400 p-1 font-black text-slate-900">
                          <select
                            value={getHpCoGradeValue(final, act.key) !== '-' ? getHpCoGradeValue(final, act.key) : ''}
                            onChange={(e) => onUpdateCoGrade(st.id, 'final', act.key, e.target.value)}
                            className="bg-white border border-amber-400 rounded px-1.5 py-0.5 font-black text-slate-900 font-mono focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-xs text-xs"
                          >
                            <option value="">-</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                          </select>
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
