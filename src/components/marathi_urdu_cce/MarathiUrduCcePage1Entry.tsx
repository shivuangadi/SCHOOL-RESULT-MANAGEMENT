import React from 'react';
import { Student, formatClassStd } from '../../types';
import {
  MarathiUrduSubjectCode,
  ComputedMarathiUrduStudent,
  MARATHI_URDU_CO_ACTIVITIES,
  getMarathiUrduSubjects,
} from '../../utils/marathiUrduCceHelper';
import { handleTableGridNavigation } from '../../utils/tableNavigationHelper';

interface MarathiUrduCcePage1EntryProps {
  computedList: ComputedMarathiUrduStudent[];
  medium: 'Marathi' | 'Urdu';
  selectedClass: string;
  selectedSubject: MarathiUrduSubjectCode;
  classTeacherName: string;
  workingDays: number;
  onSelectSubject: (code: MarathiUrduSubjectCode) => void;
  onUpdateMarks?: (
    studentId: string,
    subCode: MarathiUrduSubjectCode,
    exam: 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2',
    val: number
  ) => void;
  onUpdateExamPct?: (
    studentId: string,
    subCode: MarathiUrduSubjectCode,
    exam: 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2',
    val: number
  ) => void;
  onUpdateAttendance?: (studentId: string, days: number) => void;
  onUpdateSemAttendance?: (studentId: string, sem: 'sem1' | 'sem2', days: number) => void;
  onUpdateCoGrade?: (
    studentId: string,
    sem: 'sem1' | 'sem2' | 'final',
    key: string,
    val: string
  ) => void;
}

export const MarathiUrduCcePage1Entry: React.FC<MarathiUrduCcePage1EntryProps> = ({
  computedList,
  medium,
  selectedClass,
  selectedSubject,
  classTeacherName,
  workingDays,
  onSelectSubject,
  onUpdateMarks,
  onUpdateExamPct,
  onUpdateSemAttendance,
  onUpdateCoGrade,
}) => {
  const subjects = getMarathiUrduSubjects(medium);
  const activeSubInfo = subjects.find((s) => s.code === selectedSubject) || subjects[0];

  return (
    <div className="space-y-6">
      {/* Top Banner Control Boxes matching PDF Page 1 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-300 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-blue-200 border border-blue-400 font-black text-xs text-blue-950 rounded-lg">
            CLASS: {formatClassStd(selectedClass)}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-700">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => onSelectSubject(e.target.value as MarathiUrduSubjectCode)}
              className="px-3 py-1 bg-green-200 border border-green-400 font-black text-xs text-green-950 rounded-lg focus:outline-none"
            >
              {subjects.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-blue-600 text-white font-black text-xs rounded-lg shadow-xs">
            CLASS TEACHER'S NAME: <span className="font-extrabold">{classTeacherName || 'Class Teacher'}</span>
          </div>
          <div className="px-3 py-1.5 bg-yellow-300 border border-yellow-500 text-slate-950 font-black text-xs rounded-lg shadow-xs">
            Working Days: <span className="font-mono">{workingDays}</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          PART-A Scholastic (Orange Banner as in Page 1 of PDF)
          ======================================================== */}
      <div className="bg-white rounded-2xl border-2 border-slate-400 shadow-sm overflow-hidden">
        <div className="bg-orange-500 text-white text-center py-2 px-4 font-black text-sm tracking-wide uppercase">
          PART-A Scholastic ({activeSubInfo.nameEn})
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[1100px] text-xs text-center border-collapse border border-slate-400"
            onKeyDown={handleTableGridNavigation}
          >
            <thead>
              <tr className="bg-slate-100 font-bold text-slate-900 border-b border-slate-400">
                <th rowSpan={2} className="border border-slate-400 p-1 w-10">Si.No</th>
                <th rowSpan={2} className="border border-slate-400 p-2 min-w-[170px] text-left">
                  Student Name<br />
                  <span className="text-[10px] text-slate-600 font-mono font-normal">SATS No</span>
                </th>
                <th colSpan={3} className="border border-slate-400 p-1 bg-slate-50">FA1 (20)</th>
                <th colSpan={3} className="border border-slate-400 p-1 bg-slate-50">FA2 (20)</th>
                <th colSpan={3} className="border border-slate-400 p-1 bg-blue-50">SA1 (50)</th>
                <th rowSpan={2} className="border border-slate-400 p-1 bg-amber-50 font-black text-[10px] min-w-[85px]">
                  SEM1 Total 50%<br />
                  <span className="text-[9px] font-normal font-mono">FA1+FA2+SA1</span>
                </th>
                <th colSpan={3} className="border border-slate-400 p-1 bg-slate-50">FA3 (20)</th>
                <th colSpan={3} className="border border-slate-400 p-1 bg-slate-50">FA4 (20)</th>
                <th colSpan={3} className="border border-slate-400 p-1 bg-blue-50">SA2 (50)</th>
                <th rowSpan={2} className="border border-slate-400 p-1 bg-amber-50 font-black text-[10px] min-w-[85px]">
                  SEM2 Total 50%<br />
                  <span className="text-[9px] font-normal font-mono">FA3+FA4+SA2</span>
                </th>
                <th rowSpan={2} className="border border-slate-400 p-1 bg-green-50 font-black text-[10px] min-w-[95px]">
                  Grand Total (100%)<br />
                  <span className="text-[9px] font-normal font-mono">FA1-FA4 + SA1+SA2</span>
                </th>
                <th rowSpan={2} className="border border-slate-400 p-1 bg-green-100 font-black min-w-[50px]">
                  GRADE
                </th>
                <th rowSpan={2} className="border border-slate-400 p-1 bg-amber-200 font-black text-amber-950 min-w-[70px]">
                  RESULT<br />(Pass &gt;= 30%)
                </th>
              </tr>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-700 border-b border-slate-400">
                {/* FA1 */}
                <th className="border border-slate-400 p-1 w-11">M</th>
                <th className="border border-slate-400 p-1 w-11 text-blue-700 font-mono">15%</th>
                <th className="border border-slate-400 p-1 w-9">G</th>
                {/* FA2 */}
                <th className="border border-slate-400 p-1 w-11">M</th>
                <th className="border border-slate-400 p-1 w-11 text-blue-700 font-mono">15%</th>
                <th className="border border-slate-400 p-1 w-9">G</th>
                {/* SA1 */}
                <th className="border border-slate-400 p-1 w-11">M</th>
                <th className="border border-slate-400 p-1 w-11 text-blue-700 font-mono">20%</th>
                <th className="border border-slate-400 p-1 w-9">G</th>
                {/* FA3 */}
                <th className="border border-slate-400 p-1 w-11">M</th>
                <th className="border border-slate-400 p-1 w-11 text-blue-700 font-mono">15%</th>
                <th className="border border-slate-400 p-1 w-9">G</th>
                {/* FA4 */}
                <th className="border border-slate-400 p-1 w-11">M</th>
                <th className="border border-slate-400 p-1 w-11 text-blue-700 font-mono">15%</th>
                <th className="border border-slate-400 p-1 w-9">G</th>
                {/* SA2 */}
                <th className="border border-slate-400 p-1 w-11">M</th>
                <th className="border border-slate-400 p-1 w-11 text-blue-700 font-mono">20%</th>
                <th className="border border-slate-400 p-1 w-9">G</th>
              </tr>
            </thead>
            <tbody>
              {computedList.map((cSt, idx) => {
                const sub = cSt.subjects[selectedSubject];
                const st = cSt.student;
                const isExempted = cSt.isExempted;

                return (
                  <tr key={st.id} className="hover:bg-blue-50/30 transition-colors border-b border-slate-300">
                    <td className="border border-slate-400 p-1.5 font-bold font-mono text-slate-700">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-400 p-1.5 text-left font-bold text-slate-900">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{st.studentName}</span>
                        {cSt.hasCwsnBadge && (
                          <span className="text-[10px] bg-purple-700 text-white font-black px-1.5 py-0.2 rounded shrink-0">
                            (CWSN)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono font-normal">
                        SATS: {st.satsNo || 'N/A'}
                      </div>
                    </td>

                    {/* FA1: M (20), 15%, G */}
                    <td className="border border-slate-400 p-0.5">
                      {isExempted ? '-' : (
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={sub.fa1 !== null && sub.fa1 !== undefined && sub.fa1 !== 0 ? sub.fa1 : ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                            if (clean === '') {
                              onUpdateMarks && onUpdateMarks(st.id, selectedSubject, 'fa1', null as any);
                            } else {
                              const n = Math.min(20, parseInt(clean, 10));
                              onUpdateMarks && onUpdateMarks(st.id, selectedSubject, 'fa1', n);
                            }
                          }}
                          className="w-11 text-center font-mono font-bold bg-transparent focus:bg-white focus:outline-blue-500 text-xs"
                          placeholder="-"
                          title="FA1 Raw Marks (Max 20)"
                        />
                      )}
                    </td>
                    <td className="border border-slate-400 p-0.5 font-mono text-blue-800 font-bold bg-blue-50/20">
                      {isExempted ? '-' : (
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
                              else if (onUpdateMarks) onUpdateMarks(st.id, selectedSubject, 'fa1', null as any);
                            } else {
                              const clamped = Math.min(15, parseInt(clean, 10));
                              if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'fa1', clamped);
                              else if (onUpdateMarks) {
                                const propRaw = Math.min(20, Math.round((clamped * 20) / 15));
                                onUpdateMarks(st.id, selectedSubject, 'fa1', propRaw);
                              }
                            }
                          }}
                          className="w-11 text-center font-mono font-bold text-blue-900 bg-transparent focus:bg-white focus:outline-blue-500 text-xs"
                          placeholder="-"
                          title="FA1 15% (Max 15 - 2-Way Synced)"
                        />
                      )}
                    </td>
                    <td className="border border-slate-400 p-0.5 font-black text-slate-700">
                      {isExempted ? 'Exempt' : sub.fa1_grade}
                    </td>

                    {/* FA2: M (20), 15%, G */}
                    <td className="border border-slate-400 p-0.5">
                      {isExempted ? '-' : (
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={sub.fa2 !== null && sub.fa2 !== undefined && sub.fa2 !== 0 ? sub.fa2 : ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                            if (clean === '') {
                              onUpdateMarks && onUpdateMarks(st.id, selectedSubject, 'fa2', null as any);
                            } else {
                              const n = Math.min(20, parseInt(clean, 10));
                              onUpdateMarks && onUpdateMarks(st.id, selectedSubject, 'fa2', n);
                            }
                          }}
                          className="w-11 text-center font-mono font-bold bg-transparent focus:bg-white focus:outline-blue-500 text-xs"
                          placeholder="-"
                          title="FA2 Raw Marks (Max 20)"
                        />
                      )}
                    </td>
                    <td className="border border-slate-400 p-0.5 font-mono text-blue-800 font-bold bg-blue-50/20">
                      {isExempted ? '-' : (
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
                              else if (onUpdateMarks) onUpdateMarks(st.id, selectedSubject, 'fa2', null as any);
                            } else {
                              const clamped = Math.min(15, parseInt(clean, 10));
                              if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'fa2', clamped);
                              else if (onUpdateMarks) {
                                const propRaw = Math.min(20, Math.round((clamped * 20) / 15));
                                onUpdateMarks(st.id, selectedSubject, 'fa2', propRaw);
                              }
                            }
                          }}
                          className="w-11 text-center font-mono font-bold text-blue-900 bg-transparent focus:bg-white focus:outline-blue-500 text-xs"
                          placeholder="-"
                          title="FA2 15% (Max 15 - 2-Way Synced)"
                        />
                      )}
                    </td>
                    <td className="border border-slate-400 p-0.5 font-black text-slate-700">
                      {isExempted ? 'Exempt' : sub.fa2_grade}
                    </td>

                    {/* SA1: M (50), 20%, G */}
                    <td className="border border-slate-400 p-0.5 bg-blue-50/20">
                      {isExempted ? '-' : (
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={sub.sa1 !== null && sub.sa1 !== undefined && sub.sa1 !== 0 ? sub.sa1 : ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                            if (clean === '') {
                              onUpdateMarks && onUpdateMarks(st.id, selectedSubject, 'sa1', null as any);
                            } else {
                              const n = Math.min(50, parseInt(clean, 10));
                              onUpdateMarks && onUpdateMarks(st.id, selectedSubject, 'sa1', n);
                            }
                          }}
                          className="w-11 text-center font-mono font-bold bg-transparent focus:bg-white focus:outline-blue-500 text-xs"
                          placeholder="-"
                          title="SA1 Raw Marks (Max 50)"
                        />
                      )}
                    </td>
                    <td className="border border-slate-400 p-0.5 font-mono text-indigo-900 font-black bg-blue-50/40">
                      {isExempted ? '-' : (
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
                              else if (onUpdateMarks) onUpdateMarks(st.id, selectedSubject, 'sa1', null as any);
                            } else {
                              const clamped = Math.min(20, parseInt(clean, 10));
                              if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'sa1', clamped);
                              else if (onUpdateMarks) {
                                const propRaw = Math.min(50, Math.round((clamped * 50) / 20));
                                onUpdateMarks(st.id, selectedSubject, 'sa1', propRaw);
                              }
                            }
                          }}
                          className="w-11 text-center font-mono font-bold text-indigo-950 bg-transparent focus:bg-white focus:outline-indigo-500 text-xs"
                          placeholder="-"
                          title="SA1 20% (Max 20 - 2-Way Synced)"
                        />
                      )}
                    </td>
                    <td className="border border-slate-400 p-0.5 font-black text-slate-700">
                      {isExempted ? 'Exempt' : sub.sa1_grade}
                    </td>

                    {/* SEM1 Total 50% */}
                    <td className="border border-slate-400 p-1 font-mono font-black text-amber-950 bg-amber-50">
                      {isExempted ? '-' : (sub.sem1_total !== null && sub.sem1_total !== undefined && sub.sem1_total !== 0 ? sub.sem1_total : '-')}
                    </td>

                    {/* FA3: M (20), 15%, G */}
                    <td className="border border-slate-400 p-0.5">
                      {isExempted ? '-' : (
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={sub.fa3 !== null && sub.fa3 !== undefined && sub.fa3 !== 0 ? sub.fa3 : ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                            if (clean === '') {
                              onUpdateMarks && onUpdateMarks(st.id, selectedSubject, 'fa3', null as any);
                            } else {
                              const n = Math.min(20, parseInt(clean, 10));
                              onUpdateMarks && onUpdateMarks(st.id, selectedSubject, 'fa3', n);
                            }
                          }}
                          className="w-11 text-center font-mono font-bold bg-transparent focus:bg-white focus:outline-blue-500 text-xs"
                          placeholder="-"
                          title="FA3 Raw Marks (Max 20)"
                        />
                      )}
                    </td>
                    <td className="border border-slate-400 p-0.5 font-mono text-blue-800 font-bold bg-blue-50/20">
                      {isExempted ? '-' : (
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
                              else if (onUpdateMarks) onUpdateMarks(st.id, selectedSubject, 'fa3', null as any);
                            } else {
                              const clamped = Math.min(15, parseInt(clean, 10));
                              if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'fa3', clamped);
                              else if (onUpdateMarks) {
                                const propRaw = Math.min(20, Math.round((clamped * 20) / 15));
                                onUpdateMarks(st.id, selectedSubject, 'fa3', propRaw);
                              }
                            }
                          }}
                          className="w-11 text-center font-mono font-bold text-blue-900 bg-transparent focus:bg-white focus:outline-blue-500 text-xs"
                          placeholder="-"
                          title="FA3 15% (Max 15 - 2-Way Synced)"
                        />
                      )}
                    </td>
                    <td className="border border-slate-400 p-0.5 font-black text-slate-700">
                      {isExempted ? 'Exempt' : sub.fa3_grade}
                    </td>

                    {/* FA4: M (20), 15%, G */}
                    <td className="border border-slate-400 p-0.5">
                      {isExempted ? '-' : (
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={sub.fa4 !== null && sub.fa4 !== undefined && sub.fa4 !== 0 ? sub.fa4 : ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                            if (clean === '') {
                              onUpdateMarks && onUpdateMarks(st.id, selectedSubject, 'fa4', null as any);
                            } else {
                              const n = Math.min(20, parseInt(clean, 10));
                              onUpdateMarks && onUpdateMarks(st.id, selectedSubject, 'fa4', n);
                            }
                          }}
                          className="w-11 text-center font-mono font-bold bg-transparent focus:bg-white focus:outline-blue-500 text-xs"
                          placeholder="-"
                          title="FA4 Raw Marks (Max 20)"
                        />
                      )}
                    </td>
                    <td className="border border-slate-400 p-0.5 font-mono text-blue-800 font-bold bg-blue-50/20">
                      {isExempted ? '-' : (
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
                              else if (onUpdateMarks) onUpdateMarks(st.id, selectedSubject, 'fa4', null as any);
                            } else {
                              const clamped = Math.min(15, parseInt(clean, 10));
                              if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'fa4', clamped);
                              else if (onUpdateMarks) {
                                const propRaw = Math.min(20, Math.round((clamped * 20) / 15));
                                onUpdateMarks(st.id, selectedSubject, 'fa4', propRaw);
                              }
                            }
                          }}
                          className="w-11 text-center font-mono font-bold text-blue-900 bg-transparent focus:bg-white focus:outline-blue-500 text-xs"
                          placeholder="-"
                          title="FA4 15% (Max 15 - 2-Way Synced)"
                        />
                      )}
                    </td>
                    <td className="border border-slate-400 p-0.5 font-black text-slate-700">
                      {isExempted ? 'Exempt' : sub.fa4_grade}
                    </td>

                    {/* SA2: M (50), 20%, G */}
                    <td className="border border-slate-400 p-0.5 bg-blue-50/20">
                      {isExempted ? '-' : (
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={sub.sa2 !== null && sub.sa2 !== undefined && sub.sa2 !== 0 ? sub.sa2 : ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                            if (clean === '') {
                              onUpdateMarks && onUpdateMarks(st.id, selectedSubject, 'sa2', null as any);
                            } else {
                              const n = Math.min(50, parseInt(clean, 10));
                              onUpdateMarks && onUpdateMarks(st.id, selectedSubject, 'sa2', n);
                            }
                          }}
                          className="w-11 text-center font-mono font-bold bg-transparent focus:bg-white focus:outline-blue-500 text-xs"
                          placeholder="-"
                          title="SA2 Raw Marks (Max 50)"
                        />
                      )}
                    </td>
                    <td className="border border-slate-400 p-0.5 font-mono text-indigo-900 font-black bg-blue-50/40">
                      {isExempted ? '-' : (
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
                              else if (onUpdateMarks) onUpdateMarks(st.id, selectedSubject, 'sa2', null as any);
                            } else {
                              const clamped = Math.min(20, parseInt(clean, 10));
                              if (onUpdateExamPct) onUpdateExamPct(st.id, selectedSubject, 'sa2', clamped);
                              else if (onUpdateMarks) {
                                const propRaw = Math.min(50, Math.round((clamped * 50) / 20));
                                onUpdateMarks(st.id, selectedSubject, 'sa2', propRaw);
                              }
                            }
                          }}
                          className="w-11 text-center font-mono font-bold text-indigo-950 bg-transparent focus:bg-white focus:outline-indigo-500 text-xs"
                          placeholder="-"
                          title="SA2 20% (Max 20 - 2-Way Synced)"
                        />
                      )}
                    </td>
                    <td className="border border-slate-400 p-0.5 font-black text-slate-700">
                      {isExempted ? 'Exempt' : sub.sa2_grade}
                    </td>

                    {/* SEM2 Total 50% */}
                    <td className="border border-slate-400 p-1 font-mono font-black text-amber-950 bg-amber-50">
                      {isExempted ? '-' : (sub.sem2_total !== null && sub.sem2_total !== undefined && sub.sem2_total !== 0 ? sub.sem2_total : '-')}
                    </td>

                    {/* Grand Total 100% */}
                    <td className="border border-slate-400 p-1 font-mono font-black text-green-950 bg-green-50">
                      {isExempted ? '-' : (sub.total100 !== null && sub.total100 !== undefined && sub.total100 !== 0 ? sub.total100 : '-')}
                    </td>

                    {/* GRADE */}
                    <td className={`border border-slate-400 p-1 font-black ${
                      sub.grade === 'A+' ? 'text-emerald-700 bg-emerald-50' :
                      sub.grade === 'A' ? 'text-emerald-600' :
                      sub.grade === 'B+' ? 'text-blue-700' :
                      sub.grade === 'B' ? 'text-blue-600' :
                      sub.grade === 'Exempt' ? 'text-purple-700 bg-purple-50' : 'text-slate-500'
                    }`}>
                      {sub.grade}
                    </td>

                    {/* RESULT: Evaluated out of this subject's 100 marks (>= 30% Pass, < 30% Fail) */}
                    {(() => {
                      const subTotal = sub.total100;
                      const hasMarks = subTotal !== null && subTotal !== undefined;
                      const isSubPassed = isExempted || cSt.hasCwsnBadge || (hasMarks && subTotal >= 30);
                      return (
                        <td className={`border border-slate-400 p-1 font-black text-xs text-center ${
                          isExempted
                            ? 'bg-purple-100 text-purple-950'
                            : cSt.hasCwsnBadge
                            ? 'bg-emerald-100 text-emerald-950'
                            : hasMarks
                            ? isSubPassed
                              ? 'bg-emerald-100 text-emerald-950'
                              : 'bg-rose-100 text-rose-950'
                            : 'bg-slate-50 text-slate-400'
                        }`}>
                          {isExempted
                            ? 'EXEMPT'
                            : cSt.hasCwsnBadge
                            ? 'PASS (CWSN)'
                            : hasMarks
                            ? isSubPassed
                              ? 'PROMOTED'
                              : 'DETAINED'
                            : '-'}
                        </td>
                      );
                    })()}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          PART-B CO-SCHOLASTIC GRADES (A,B,C) as in Page 1 of PDF
          ======================================================== */}
      <div className="bg-white rounded-2xl border-2 border-slate-400 shadow-sm overflow-hidden">
        <div
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
          className="bg-orange-500 text-white text-center py-2 px-4 font-black text-sm tracking-wide uppercase"
        >
          PART-B CO-SCHOLASTIC GRADES (A,B,C)
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-xs text-center border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-100 font-bold text-slate-900 border-b border-slate-400">
                <th className="border border-slate-400 p-1.5 w-10">Sl.No</th>
                <th className="border border-slate-400 p-2 min-w-[180px] text-left">
                  Students Name<br />
                  <span className="text-[10px] text-slate-600 font-mono font-normal">SATS NO</span>
                </th>
                <th className="border border-slate-400 p-1.5 w-20">SEM</th>
                <th className="border border-slate-400 p-1.5 min-w-[90px]">DAYS ATTENDED SCHOOL</th>
                {MARATHI_URDU_CO_ACTIVITIES.map((act) => (
                  <th key={act.key} className="border border-slate-400 p-1.5 min-w-[110px] text-[11px] font-bold uppercase">
                    {act.nameEn}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {computedList.map((cSt, idx) => {
                const st = cSt.student;
                const sem1 = cSt.coScholastic.sem1;
                const sem2 = cSt.coScholastic.sem2;
                const final = cSt.coScholastic.final;

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
                          {cSt.hasCwsnBadge && (
                            <span className="text-[10px] bg-purple-700 text-white font-black px-1.5 py-0.2 rounded shrink-0">
                              (CWSN)
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
                          onChange={(e) => onUpdateSemAttendance && onUpdateSemAttendance(st.id, 'sem1', Number(e.target.value))}
                          className="w-16 text-center font-mono font-bold bg-transparent focus:bg-white text-xs border border-slate-300 rounded p-0.5"
                          placeholder="0"
                        />
                      </td>
                      {MARATHI_URDU_CO_ACTIVITIES.map((act) => (
                        <td key={act.key} className="border border-slate-400 p-1">
                          <select
                            value={sem1[act.key] || ''}
                            onChange={(e) => onUpdateCoGrade && onUpdateCoGrade(st.id, 'sem1', act.key, e.target.value)}
                            className="w-14 text-center font-bold bg-transparent focus:bg-white border border-slate-300 rounded text-xs p-0.5"
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
                      <td className="border border-slate-400 p-1 font-bold text-indigo-800 bg-indigo-50/50">
                        SEM-2
                      </td>
                      <td className="border border-slate-400 p-1">
                        <input
                          type="number"
                          min="0"
                          max={Math.max(0, workingDays - (cSt.sem1Attendance || 0))}
                          value={cSt.sem2Attendance || ''}
                          onChange={(e) => onUpdateSemAttendance && onUpdateSemAttendance(st.id, 'sem2', Number(e.target.value))}
                          className="w-16 text-center font-mono font-bold bg-transparent focus:bg-white text-xs border border-slate-300 rounded p-0.5"
                          placeholder="0"
                        />
                      </td>
                      {MARATHI_URDU_CO_ACTIVITIES.map((act) => (
                        <td key={act.key} className="border border-slate-400 p-1">
                          <select
                            value={sem2[act.key] || ''}
                            onChange={(e) => onUpdateCoGrade && onUpdateCoGrade(st.id, 'sem2', act.key, e.target.value)}
                            className="w-14 text-center font-bold bg-transparent focus:bg-white border border-slate-300 rounded text-xs p-0.5"
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
                    <tr className="bg-amber-50/50 font-bold border-b-2 border-slate-400">
                      <td className="border border-slate-400 p-1 font-black text-amber-900 bg-amber-100">
                        Total
                      </td>
                      <td className="border border-slate-400 p-1 font-mono font-black text-slate-900">
                        {cSt.attendanceDays}
                      </td>
                      {MARATHI_URDU_CO_ACTIVITIES.map((act) => (
                        <td key={act.key} className="border border-slate-400 p-1">
                          <select
                            value={final[act.key] || sem2[act.key] || sem1[act.key] || ''}
                            onChange={(e) => onUpdateCoGrade && onUpdateCoGrade(st.id, 'final', act.key, e.target.value)}
                            className="w-14 text-center font-black bg-amber-100 border border-amber-300 rounded text-xs p-0.5 text-amber-950"
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
