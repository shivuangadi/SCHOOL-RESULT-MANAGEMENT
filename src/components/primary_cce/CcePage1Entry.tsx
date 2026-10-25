import React from 'react';
import { Student, isCwsnStudent } from '../../types';
import {
  PrimarySubjectCode,
  PRIMARY_SUBJECTS,
  CO_SCHOLASTIC_ACTIVITIES,
  ComputedStudentCce,
} from '../../utils/primaryCceHelper';
import { handleTableGridNavigation } from '../../utils/tableNavigationHelper';

interface CcePage1EntryProps {
  students: Student[];
  computedList: ComputedStudentCce[];
  selectedSubject: PrimarySubjectCode;
  selectedClass: string;
  classTeacherName: string;
  workingDays: number;
  onUpdateMarks: (studentId: string, subCode: PrimarySubjectCode, field: string, val: number) => void;
  onUpdateExamPct?: (studentId: string, subCode: PrimarySubjectCode, exam: 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2', val: number) => void;
  onToggleCwsn: (studentId: string, isExempt: boolean) => void;
  onUpdateCoScholastic: (studentId: string, sem: 'sem1' | 'sem2', key: string, val: string) => void;
  onUpdateAttendance: (studentId: string, days: number) => void;
  onUpdateSemAttendance: (studentId: string, sem: 'sem1' | 'sem2', days: number) => void;
  onUpdateFinalCoGrade: (studentId: string, key: string, val: string) => void;
}

export const CcePage1Entry: React.FC<CcePage1EntryProps> = ({
  computedList,
  selectedSubject,
  selectedClass,
  classTeacherName,
  workingDays,
  onUpdateMarks,
  onUpdateExamPct,
  onToggleCwsn,
  onUpdateCoScholastic,
  onUpdateAttendance,
  onUpdateSemAttendance,
  onUpdateFinalCoGrade,
}) => {
  const activeSubjectInfo = PRIMARY_SUBJECTS.find((s) => s.code === selectedSubject) || PRIMARY_SUBJECTS[0];

  return (
    <div className="space-y-6">
      {/* ========================================================
          PART-A: SCHOLASTIC (ಪಠ್ಯ ವಿಷಯಗಳು)
          ======================================================== */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden">
        {/* Table Header Bar as in Page 1 */}
        <div className="bg-blue-600 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-black text-sm uppercase tracking-wide">
              PART-A ಪಠ್ಯ ವಿಷಯಗಳು - {activeSubjectInfo.nameKn} ({activeSubjectInfo.nameEn})
            </span>
            <span className="text-xs bg-blue-800 px-2.5 py-0.5 rounded font-bold border border-blue-400">
              {selectedClass}ನೇ ತರಗತಿ
            </span>
            <span className="text-xs bg-blue-700/90 px-2 py-0.5 rounded font-bold border border-blue-500">
              ಶಾಲೆ ನಡೆದ ದಿನಗಳು: <span className="font-mono font-black text-amber-300">{workingDays}</span>
            </span>
          </div>
          <div className="text-xs font-bold text-blue-100 flex items-center gap-3">
            <span>ಶಿಕ್ಷಕರು: {classTeacherName || 'ವರ್ಗ ಶಿಕ್ಷಕರು'}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[1050px] text-xs text-center border-collapse"
            onKeyDown={handleTableGridNavigation}
          >
            <thead>
              <tr className="bg-blue-100/80 text-blue-950 font-bold border-b border-slate-300">
                <th rowSpan={2} className="border border-slate-300 p-1 w-10">ಕ್ರ.ಸಂ</th>
                <th rowSpan={2} className="border border-slate-300 p-2 min-w-[160px] text-left">
                  ವಿದ್ಯಾರ್ಥಿ/ನಿಯರ ಹೆಸರು<br />
                  <span className="text-[10px] text-slate-600 font-mono font-normal">SATS NO</span>
                </th>
                <th colSpan={3} className="border border-slate-300 p-1 bg-blue-50">FA1 (20)</th>
                <th colSpan={3} className="border border-slate-300 p-1 bg-blue-50">FA2 (20)</th>
                <th colSpan={3} className="border border-slate-300 p-1 bg-indigo-50">SA1 (50)</th>
                <th rowSpan={2} className="border border-slate-300 p-1 bg-amber-100 text-amber-950 font-black min-w-[75px]">
                  SEM1 Total<br />50%<br />
                  <span className="text-[9px] font-normal">FA1+FA2+SA1</span>
                </th>
                <th colSpan={3} className="border border-slate-300 p-1 bg-blue-50">FA3 (20)</th>
                <th colSpan={3} className="border border-slate-300 p-1 bg-blue-50">FA4 (20)</th>
                <th colSpan={3} className="border border-slate-300 p-1 bg-indigo-50">SA2 (50)</th>
                <th rowSpan={2} className="border border-slate-300 p-1 bg-amber-100 text-amber-950 font-black min-w-[75px]">
                  SEM2 Total<br />50%<br />
                  <span className="text-[9px] font-normal">FA3+FA4+SA2</span>
                </th>
                <th rowSpan={2} className="border border-slate-300 p-1 bg-emerald-100 text-emerald-950 font-black min-w-[80px]">
                  ಒಟ್ಟು ಅಂಕ<br />(100%)<br />
                  <span className="text-[9px] font-normal">FA1-4+SA1-2</span>
                </th>
                <th rowSpan={2} className="border border-slate-300 p-1 bg-emerald-200 text-emerald-950 font-black min-w-[45px]">
                  ಶ್ರೇಣಿ
                </th>
                <th rowSpan={2} className="border border-slate-300 p-1 bg-amber-200 text-amber-950 font-black min-w-[70px]">
                  ಫಲಿತಾಂಶ<br />Result
                </th>
              </tr>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-700 border-b border-slate-300">
                {/* FA1 */}
                <th className="border border-slate-300 p-1 w-11">ಅಂಕ</th>
                <th className="border border-slate-300 p-1 w-11 text-blue-700 font-mono">15%</th>
                <th className="border border-slate-300 p-1 w-9">ಶ್ರೇಣಿ</th>
                {/* FA2 */}
                <th className="border border-slate-300 p-1 w-11">ಅಂಕ</th>
                <th className="border border-slate-300 p-1 w-11 text-blue-700 font-mono">15%</th>
                <th className="border border-slate-300 p-1 w-9">ಶ್ರೇಣಿ</th>
                {/* SA1 */}
                <th className="border border-slate-300 p-1 w-11">ಅಂಕ</th>
                <th className="border border-slate-300 p-1 w-11 text-indigo-700 font-mono">20%</th>
                <th className="border border-slate-300 p-1 w-9">ಶ್ರೇಣಿ</th>
                {/* FA3 */}
                <th className="border border-slate-300 p-1 w-11">ಅಂಕ</th>
                <th className="border border-slate-300 p-1 w-11 text-blue-700 font-mono">15%</th>
                <th className="border border-slate-300 p-1 w-9">ಶ್ರೇಣಿ</th>
                {/* FA4 */}
                <th className="border border-slate-300 p-1 w-11">ಅಂಕ</th>
                <th className="border border-slate-300 p-1 w-11 text-blue-700 font-mono">15%</th>
                <th className="border border-slate-300 p-1 w-9">ಶ್ರೇಣಿ</th>
                {/* SA2 */}
                <th className="border border-slate-300 p-1 w-11">ಅಂಕ</th>
                <th className="border border-slate-300 p-1 w-11 text-indigo-700 font-mono">20%</th>
                <th className="border border-slate-300 p-1 w-9">ಶ್ರೇಣಿ</th>
              </tr>
            </thead>
            <tbody>
              {computedList.map((cSt, idx) => {
                const sub = cSt.subjects[selectedSubject];
                const st = cSt.student;

                return (
                  <tr key={st.id} className="hover:bg-blue-50/40 transition-colors border-b border-slate-200">
                    <td className="border border-slate-300 p-1.5 font-bold font-mono text-slate-600">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-300 p-2 text-left font-bold text-slate-900">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{st.studentName}</span>
                        {(cSt.isExempted || isCwsnStudent(st.cwsnStatus)) && (
                          <span className="text-[10px] bg-purple-700 text-white font-black px-1.5 py-0.5 rounded shadow-xs shrink-0" title="CWSN Student">
                            CWSN
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono font-normal">
                        {st.satsNo || 'N/A'} • {st.gender || 'Boy'}
                      </div>
                    </td>

                    {/* MERGED ROW IF CWSN EXEMPT */}
                    {cSt.isExempted ? (
                      <td colSpan={21} className="border border-slate-300 p-2 bg-purple-100/90 text-purple-950 font-black text-center tracking-wide">
                        <div className="flex items-center justify-center gap-3">
                          <span className="px-3 py-1 bg-purple-800 text-white rounded-lg text-xs">
                            CWSN (ವಿನಾಯಿತಿ / EXEMPT)
                          </span>
                          <span className="text-xs text-purple-900 font-bold">
                            ಮೌಲ್ಯಮಾಪನದಿಂದ ವಿನಾಯಿತಿ ನೀಡಲಾಗಿದೆ
                          </span>
                        </div>
                      </td>
                    ) : (
                      <>
                        {/* FA1 (20) */}
                        <td className="border border-slate-300 p-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub.fa1 !== null && sub.fa1 !== undefined && sub.fa1 !== 0 ? sub.fa1 : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              if (clean === '') {
                                onUpdateMarks(st.id, selectedSubject, 'fa1', null as any);
                              } else {
                                const n = Math.min(20, parseInt(clean, 10));
                                onUpdateMarks(st.id, selectedSubject, 'fa1', n);
                              }
                            }}
                            className="w-10 sm:w-11 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs sm:text-sm"
                            placeholder="-"
                            title="FA1 Raw Marks (Max 20)"
                          />
                        </td>
                        <td className="border border-slate-300 p-1 font-mono font-bold text-blue-700 bg-blue-50/30">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub.fa1_pct !== null && sub.fa1_pct !== undefined && sub.fa1_pct !== 0 ? sub.fa1_pct : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              if (clean === '') {
                                if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'fa1', null as any);
                                else onUpdateMarks(st.id, selectedSubject, 'fa1', null as any);
                              } else {
                                const clamped = Math.min(15, parseInt(clean, 10));
                                if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'fa1', clamped);
                                else {
                                  const propRaw = Math.min(20, Math.round((clamped * 20) / 15));
                                  onUpdateMarks(st.id, selectedSubject, 'fa1', propRaw);
                                }
                              }
                            }}
                            className="w-10 sm:w-11 text-center font-bold text-blue-900 bg-white border border-blue-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs sm:text-sm"
                            placeholder="-"
                            title="FA1 15% (Max 15 - 2-Way Synced with 9-Line Report)"
                          />
                        </td>
                        <td className="border border-slate-300 p-1 font-bold text-slate-700">
                          {sub.fa1_grade}
                        </td>

                        {/* FA2 (20) */}
                        <td className="border border-slate-300 p-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub.fa2 !== null && sub.fa2 !== undefined && sub.fa2 !== 0 ? sub.fa2 : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              if (clean === '') {
                                onUpdateMarks(st.id, selectedSubject, 'fa2', null as any);
                              } else {
                                const n = Math.min(20, parseInt(clean, 10));
                                onUpdateMarks(st.id, selectedSubject, 'fa2', n);
                              }
                            }}
                            className="w-10 sm:w-11 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs sm:text-sm"
                            placeholder="-"
                            title="FA2 Raw Marks (Max 20)"
                          />
                        </td>
                        <td className="border border-slate-300 p-1 font-mono font-bold text-blue-700 bg-blue-50/30">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub.fa2_pct !== null && sub.fa2_pct !== undefined && sub.fa2_pct !== 0 ? sub.fa2_pct : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              if (clean === '') {
                                if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'fa2', null as any);
                                else onUpdateMarks(st.id, selectedSubject, 'fa2', null as any);
                              } else {
                                const clamped = Math.min(15, parseInt(clean, 10));
                                if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'fa2', clamped);
                                else {
                                  const propRaw = Math.min(20, Math.round((clamped * 20) / 15));
                                  onUpdateMarks(st.id, selectedSubject, 'fa2', propRaw);
                                }
                              }
                            }}
                            className="w-10 sm:w-11 text-center font-bold text-blue-900 bg-white border border-blue-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs sm:text-sm"
                            placeholder="-"
                            title="FA2 15% (Max 15 - 2-Way Synced with 9-Line Report)"
                          />
                        </td>
                        <td className="border border-slate-300 p-1 font-bold text-slate-700">
                          {sub.fa2_grade}
                        </td>

                        {/* SA1 (50) */}
                        <td className="border border-slate-300 p-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub.sa1 !== null && sub.sa1 !== undefined && sub.sa1 !== 0 ? sub.sa1 : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              if (clean === '') {
                                onUpdateMarks(st.id, selectedSubject, 'sa1', null as any);
                              } else {
                                const n = Math.min(50, parseInt(clean, 10));
                                onUpdateMarks(st.id, selectedSubject, 'sa1', n);
                              }
                            }}
                            className="w-11 sm:w-12 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-indigo-500 font-mono text-xs sm:text-sm"
                            placeholder="-"
                            title="SA1 Raw Marks (Max 50)"
                          />
                        </td>
                        <td className="border border-slate-300 p-1 font-mono font-bold text-indigo-700 bg-indigo-50/30">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub.sa1_pct !== null && sub.sa1_pct !== undefined && sub.sa1_pct !== 0 ? sub.sa1_pct : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              if (clean === '') {
                                if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'sa1', null as any);
                                else onUpdateMarks(st.id, selectedSubject, 'sa1', null as any);
                              } else {
                                const clamped = Math.min(20, parseInt(clean, 10));
                                if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'sa1', clamped);
                                else {
                                  const propRaw = Math.min(50, Math.round((clamped * 50) / 20));
                                  onUpdateMarks(st.id, selectedSubject, 'sa1', propRaw);
                                }
                              }
                            }}
                            className="w-11 sm:w-12 text-center font-bold text-indigo-900 bg-white border border-indigo-300 rounded p-0.5 focus:ring-1 focus:ring-indigo-500 font-mono text-xs sm:text-sm"
                            placeholder="-"
                            title="SA1 20% (Max 20 - 2-Way Synced with 9-Line Report)"
                          />
                        </td>
                        <td className="border border-slate-300 p-1 font-bold text-slate-700">
                          {sub.sa1_grade}
                        </td>

                        {/* SEM1 Total 50% */}
                        <td className="border border-slate-300 p-1 font-mono font-black text-amber-900 bg-amber-50">
                          {sub.sem1_total !== null && sub.sem1_total !== undefined && sub.sem1_total !== 0 ? sub.sem1_total : '-'}
                        </td>

                        {/* FA3 (20) */}
                        <td className="border border-slate-300 p-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub.fa3 !== null && sub.fa3 !== undefined && sub.fa3 !== 0 ? sub.fa3 : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              if (clean === '') {
                                onUpdateMarks(st.id, selectedSubject, 'fa3', null as any);
                              } else {
                                const n = Math.min(20, parseInt(clean, 10));
                                onUpdateMarks(st.id, selectedSubject, 'fa3', n);
                              }
                            }}
                            className="w-10 sm:w-11 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs sm:text-sm"
                            placeholder="-"
                            title="FA3 Raw Marks (Max 20)"
                          />
                        </td>
                        <td className="border border-slate-300 p-1 font-mono font-bold text-blue-700 bg-blue-50/30">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub.fa3_pct !== null && sub.fa3_pct !== undefined && sub.fa3_pct !== 0 ? sub.fa3_pct : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              if (clean === '') {
                                if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'fa3', null as any);
                                else onUpdateMarks(st.id, selectedSubject, 'fa3', null as any);
                              } else {
                                const clamped = Math.min(15, parseInt(clean, 10));
                                if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'fa3', clamped);
                                else {
                                  const propRaw = Math.min(20, Math.round((clamped * 20) / 15));
                                  onUpdateMarks(st.id, selectedSubject, 'fa3', propRaw);
                                }
                              }
                            }}
                            className="w-10 sm:w-11 text-center font-bold text-blue-900 bg-white border border-blue-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs sm:text-sm"
                            placeholder="-"
                            title="FA3 15% (Max 15 - 2-Way Synced with 9-Line Report)"
                          />
                        </td>
                        <td className="border border-slate-300 p-1 font-bold text-slate-700">
                          {sub.fa3_grade}
                        </td>

                        {/* FA4 (20) */}
                        <td className="border border-slate-300 p-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub.fa4 !== null && sub.fa4 !== undefined && sub.fa4 !== 0 ? sub.fa4 : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              if (clean === '') {
                                onUpdateMarks(st.id, selectedSubject, 'fa4', null as any);
                              } else {
                                const n = Math.min(20, parseInt(clean, 10));
                                onUpdateMarks(st.id, selectedSubject, 'fa4', n);
                              }
                            }}
                            className="w-10 sm:w-11 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs sm:text-sm"
                            placeholder="-"
                            title="FA4 Raw Marks (Max 20)"
                          />
                        </td>
                        <td className="border border-slate-300 p-1 font-mono font-bold text-blue-700 bg-blue-50/30">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub.fa4_pct !== null && sub.fa4_pct !== undefined && sub.fa4_pct !== 0 ? sub.fa4_pct : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              if (clean === '') {
                                if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'fa4', null as any);
                                else onUpdateMarks(st.id, selectedSubject, 'fa4', null as any);
                              } else {
                                const clamped = Math.min(15, parseInt(clean, 10));
                                if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'fa4', clamped);
                                else {
                                  const propRaw = Math.min(20, Math.round((clamped * 20) / 15));
                                  onUpdateMarks(st.id, selectedSubject, 'fa4', propRaw);
                                }
                              }
                            }}
                            className="w-10 sm:w-11 text-center font-bold text-blue-900 bg-white border border-blue-300 rounded p-0.5 focus:ring-1 focus:ring-blue-500 font-mono text-xs sm:text-sm"
                            placeholder="-"
                            title="FA4 15% (Max 15 - 2-Way Synced with 9-Line Report)"
                          />
                        </td>
                        <td className="border border-slate-300 p-1 font-bold text-slate-700">
                          {sub.fa4_grade}
                        </td>

                        {/* SA2 (50) */}
                        <td className="border border-slate-300 p-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub.sa2 !== null && sub.sa2 !== undefined && sub.sa2 !== 0 ? sub.sa2 : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              if (clean === '') {
                                onUpdateMarks(st.id, selectedSubject, 'sa2', null as any);
                              } else {
                                const n = Math.min(50, parseInt(clean, 10));
                                onUpdateMarks(st.id, selectedSubject, 'sa2', n);
                              }
                            }}
                            className="w-11 sm:w-12 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-indigo-500 font-mono text-xs sm:text-sm"
                            placeholder="-"
                            title="SA2 Raw Marks (Max 50)"
                          />
                        </td>
                        <td className="border border-slate-300 p-1 font-mono font-bold text-indigo-700 bg-indigo-50/30">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={sub.sa2_pct !== null && sub.sa2_pct !== undefined && sub.sa2_pct !== 0 ? sub.sa2_pct : ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                              if (clean === '') {
                                if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'sa2', null as any);
                                else onUpdateMarks(st.id, selectedSubject, 'sa2', null as any);
                              } else {
                                const clamped = Math.min(20, parseInt(clean, 10));
                                if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'sa2', clamped);
                                else {
                                  const propRaw = Math.min(50, Math.round((clamped * 50) / 20));
                                  onUpdateMarks(st.id, selectedSubject, 'sa2', propRaw);
                                }
                              }
                            }}
                            className="w-11 sm:w-12 text-center font-bold text-indigo-900 bg-white border border-indigo-300 rounded p-0.5 focus:ring-1 focus:ring-indigo-500 font-mono text-xs sm:text-sm"
                            placeholder="-"
                            title="SA2 20% (Max 20 - 2-Way Synced with 9-Line Report)"
                          />
                        </td>
                        <td className="border border-slate-300 p-1 font-bold text-slate-700">
                          {sub.sa2_grade}
                        </td>

                        {/* SEM2 Total 50% */}
                        <td className="border border-slate-300 p-1 font-mono font-black text-amber-900 bg-amber-50">
                          {sub.sem2_total !== null && sub.sem2_total !== undefined && sub.sem2_total !== 0 ? sub.sem2_total : '-'}
                        </td>

                        {/* Total 100% */}
                        <td className="border border-slate-300 p-1 font-mono font-black text-emerald-950 bg-emerald-50 text-sm">
                          {sub.total100 !== null && sub.total100 !== undefined && sub.total100 !== 0 ? sub.total100 : '-'}
                        </td>

                        {/* Grade */}
                        <td className="border border-slate-300 p-1 font-black text-emerald-900 bg-emerald-100/80 text-sm">
                          {sub.grade}
                        </td>

                        {/* Result (Pass/Fail) based strictly on this subject's 100 marks: >= 30% Pass, < 30% Fail */}
                        {(() => {
                          const subTotal = sub.total100;
                          const hasMarks = subTotal !== null && subTotal !== undefined;
                          const hasCwsn = isCwsnStudent(st.cwsnStatus);
                          const isSubPassed = cSt.isExempted || hasCwsn || (hasMarks && subTotal >= 30);
                          return (
                            <td className={`border border-slate-300 p-1 font-black text-xs text-center ${
                              cSt.isExempted
                                ? 'bg-purple-100 text-purple-950'
                                : hasCwsn
                                ? 'bg-emerald-100 text-emerald-950'
                                : hasMarks
                                ? isSubPassed
                                  ? 'bg-emerald-100 text-emerald-950'
                                  : 'bg-rose-100 text-rose-950'
                                : 'bg-slate-50 text-slate-400'
                            }`}>
                              {cSt.isExempted
                                ? 'ವಿನಾಯಿತಿ'
                                : hasCwsn
                                ? 'ತೇರ್ಗಡೆ (CWSN)'
                                : hasMarks
                                ? isSubPassed
                                  ? 'ತೇರ್ಗಡೆ'
                                  : 'ಅನುತ್ತೀರ್ಣ'
                                : '-'}
                            </td>
                          );
                        })()}
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
          PART-B: CO-SCHOLASTIC (ಸಹ ಪಠ್ಯ ವಿಷಯದ ಶ್ರೇಣಿಗಳು A B C dropdown)
          ======================================================== */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-indigo-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <span
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
            className="font-black text-sm uppercase tracking-wide"
          >
            PART-B CO-SCHOLASTIC GRADES (A,B,C)
          </span>
          <div className="text-xs text-indigo-200 flex items-center gap-3">
            <span>ಶಾಲೆ ನಡೆದ ದಿನಗಳು: <span className="font-mono font-black text-amber-300">{workingDays}</span></span>
            <span className="bg-indigo-800 text-amber-300 px-2 py-0.5 rounded font-bold border border-indigo-700">
              Sem 1 + Sem 2 ಗರಿಷ್ಠ: {workingDays} ದಿನಗಳು
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[850px] text-xs text-center border-collapse"
            onKeyDown={handleTableGridNavigation}
          >
            <thead>
              <tr className="bg-indigo-50 text-indigo-950 font-bold border-b border-slate-300">
                <th className="border border-slate-300 p-1.5 w-10">ಕ್ರ.ಸಂ</th>
                <th className="border border-slate-300 p-2 min-w-[180px] text-left">
                  ವಿದ್ಯಾರ್ಥಿ /ನಿಯರ ಹೆಸರು
                </th>
                <th className="border border-slate-300 p-1.5 w-20">SEM</th>
                <th className="border border-slate-300 p-1.5 min-w-[90px]">ಹಾಜರಿದ್ದ ದಿನಗಳು</th>
                {CO_SCHOLASTIC_ACTIVITIES.map((act) => (
                  <th key={act.key} className="border border-slate-300 p-1.5 min-w-[110px]">
                    {act.key === 'supw' ? (
                      <div>
                        <div className="font-black text-xs text-indigo-950 uppercase leading-tight">SOCIAL USEFUL PRODUCTIVE WORK</div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">ಸಾ.ಉ.ಉ.ಕಾ (SUPW)</div>
                      </div>
                    ) : (
                      <>
                        {act.nameKn}
                        <div className="text-[10px] text-slate-500 font-normal">{act.nameEn}</div>
                      </>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {computedList.map((cSt, idx) => {
                const st = cSt.student;
                const sem1 = cSt.coScholastic.sem1;
                const sem2 = cSt.coScholastic.sem2;
                const sem1Att = Math.round(cSt.attendanceDays * 0.48);
                const sem2Att = cSt.attendanceDays - sem1Att;

                return (
                  <React.Fragment key={st.id}>
                    {/* SEM-1 Row */}
                    <tr className="border-t border-slate-300 hover:bg-slate-50">
                      <td rowSpan={3} className="border border-slate-300 p-2 font-bold font-mono text-slate-600 align-middle">
                        {idx + 1}
                      </td>
                      <td rowSpan={3} className="border border-slate-300 p-2 text-left font-bold text-slate-900 align-middle">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate">{st.studentName}</span>
                          {(cSt.isExempted || isCwsnStudent(st.cwsnStatus)) && (
                            <span className="text-[10px] bg-purple-700 text-white font-black px-1.5 py-0.5 rounded shadow-xs shrink-0" title="CWSN Student">
                              CWSN
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono font-normal">
                          SATS: {st.satsNo || 'N/A'}
                        </div>
                      </td>
                      <td className="border border-slate-300 p-1 font-bold text-blue-800 bg-blue-50/50">
                        SEM-1
                      </td>
                      <td className="border border-slate-300 p-1">
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
                          className="w-14 text-center font-mono font-bold text-slate-800 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          title={`SEM-1 attended days (Max: ${Math.max(0, workingDays - (cSt.sem2Attendance || 0))})`}
                        />
                      </td>
                      {CO_SCHOLASTIC_ACTIVITIES.map((act) => (
                        <td key={act.key} className="border border-slate-300 p-1">
                          <select
                            value={sem1[act.key] || ''}
                            onChange={(e) => onUpdateCoScholastic(st.id, 'sem1', act.key, e.target.value)}
                            className="bg-white border border-slate-300 rounded px-2 py-0.5 font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            <option value="">-</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                          </select>
                        </td>
                      ))}
                    </tr>

                    {/* SEM-2 Row */}
                    <tr className="hover:bg-slate-50">
                      <td className="border border-slate-300 p-1 font-bold text-indigo-800 bg-indigo-50/50">
                        SEM-2
                      </td>
                      <td className="border border-slate-300 p-1">
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
                          className="w-14 text-center font-mono font-bold text-slate-800 bg-white border border-slate-300 rounded p-0.5 focus:ring-1 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          title={`SEM-2 attended days (Max: ${Math.max(0, workingDays - (cSt.sem1Attendance || 0))})`}
                        />
                      </td>
                      {CO_SCHOLASTIC_ACTIVITIES.map((act) => (
                        <td key={act.key} className="border border-slate-300 p-1">
                          <select
                            value={sem2[act.key] || ''}
                            onChange={(e) => onUpdateCoScholastic(st.id, 'sem2', act.key, e.target.value)}
                            className="bg-white border border-slate-300 rounded px-2 py-0.5 font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
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
                    <tr className="bg-amber-50/60 font-bold border-b-2 border-slate-300">
                      <td className="border border-slate-300 p-1 text-amber-950 font-black">
                        Total
                      </td>
                      <td className="border border-slate-300 p-1">
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
                          className="w-16 text-center font-mono font-black text-slate-900 bg-white border border-slate-300 rounded p-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          title={`Total attended days (Max: ${workingDays})`}
                        />
                      </td>
                      {CO_SCHOLASTIC_ACTIVITIES.map((act) => (
                        <td key={act.key} className="border border-slate-300 p-1 font-black text-slate-900 font-mono">
                          <select
                            value={cSt.coScholastic.final[act.key] || ''}
                            onChange={(e) => onUpdateFinalCoGrade(st.id, act.key, e.target.value)}
                            className="bg-white border border-amber-300 rounded px-1.5 py-0.5 font-black text-slate-900 font-mono focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-xs"
                            title="Average / Final Grade (Editable)"
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
