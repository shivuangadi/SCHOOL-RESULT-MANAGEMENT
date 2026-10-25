import React, { useState, useMemo, useRef } from 'react';
import { StudentClass, SchoolMedium, SchoolRecord, Student, StudentExamMarks } from '../types';
import {
  CceExamKey,
  CCE_EXAMS,
  calculateSingleClassProgress,
  getCurrentScheduledExam,
} from '../utils/cceProgressMonitorHelper';
import {
  X,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  BookOpen,
  Calendar,
} from 'lucide-react';

interface CceClassProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  classStandard: StudentClass;
  students: Student[];
  marksMap: Record<string, StudentExamMarks>;
  schoolRecord: SchoolRecord | null;
  academicYear: string;
}

export const CceClassProgressModal: React.FC<CceClassProgressModalProps> = ({
  isOpen,
  onClose,
  classStandard,
  students,
  marksMap,
  schoolRecord,
  academicYear,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const defaultExam = useMemo(() => getCurrentScheduledExam().exam, []);
  const [selectedExamFilter, setSelectedExamFilter] = useState<string>('ALL');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');

  const schoolName = schoolRecord?.schoolName || 'Karnataka Government School';
  const diseCode = schoolRecord?.diseCode || '00000000000';
  const medium = schoolRecord?.schoolMedium || 'Kannada';

  const classProgress = useMemo(() => {
    return calculateSingleClassProgress(classStandard, students, marksMap, medium);
  }, [classStandard, students, marksMap, medium]);

  const allSubjects = useMemo(() => {
    const map = new Map<string, string>();
    classProgress.subjectTableRows.forEach((r) => {
      map.set(r.subjectCode, r.subjectNameEn);
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [classProgress]);

  const filteredRows = useMemo(() => {
    return classProgress.subjectTableRows.filter((r) => {
      const matchExam = selectedExamFilter === 'ALL' || r.exam === selectedExamFilter;
      const matchSub = selectedSubjectFilter === 'ALL' || r.subjectCode === selectedSubjectFilter;
      return matchExam && matchSub;
    });
  }, [classProgress, selectedExamFilter, selectedSubjectFilter]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-md">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xs">
                Class {classStandard} CCE Status
              </span>
              <span className="text-xs text-blue-200 font-mono">
                UDISE: <span className="font-bold text-white">{diseCode}</span>
              </span>
              <span className="text-xs text-blue-200 font-mono">
                Year: <span className="font-bold text-white">{academicYear}</span>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white truncate max-w-2xl">
              {schoolName}
            </h2>
            <p className="text-xs text-blue-100 flex items-center gap-2">
              <span>Medium: <b>{medium}</b></span>
              <span>•</span>
              <span>Scheduled Exam: <b className="text-amber-300">{classProgress.currentExamLabel}</b></span>
              <span>•</span>
              <span>Active Students: <b>{classProgress.totalStudents}</b> (Eligible: {classProgress.eligibleStudents})</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-white/20"
              title="Print Class Progress Table"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div ref={printAreaRef} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-slate-800">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Students */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Students</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                  {classProgress.totalStudents}
                </span>
                {classProgress.exemptedStudents > 0 && (
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                    {classProgress.exemptedStudents} CWSN Exempt
                  </span>
                )}
              </div>
            </div>

            {/* Overall Completion */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">Overall Class Progress</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-blue-950">
                {classProgress.overallClassPercentDisplay}
              </div>
            </div>

            {/* Current Exam Completion */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                {classProgress.currentExamLabel} Status
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-950">
                {classProgress.examProgress[classProgress.currentExam]?.display || 'N/A'}
              </div>
            </div>

            {/* Pending Tasks */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                {classProgress.currentExamLabel} Pending
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-amber-950">
                {classProgress.examProgress[classProgress.currentExam]?.pending ?? 0}
              </div>
            </div>
          </div>

          {/* Exam-Wise Horizontal Status Badges */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Examination-Wise Progress Breakdown:</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {CCE_EXAMS.map((ex) => {
                const ep = classProgress.examProgress[ex.key];
                const isCurrent = ex.key === classProgress.currentExam;
                const isComplete = ep.percent === 100;
                return (
                  <button
                    key={ex.key}
                    type="button"
                    onClick={() => setSelectedExamFilter(selectedExamFilter === ex.key ? 'ALL' : ex.key)}
                    className={`p-2 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                      selectedExamFilter === ex.key
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : isCurrent
                        ? 'bg-amber-100 text-amber-950 border-amber-300'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>{ex.labelEn}</span>
                      {isCurrent && <span className="text-[9px] px-1 bg-amber-400 text-slate-950 rounded font-black">CURR</span>}
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="font-mono font-black text-sm">{ep.display}</span>
                      <span className="text-[10px] opacity-75 font-mono">{ep.completed}/{ep.totalRequired}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filters:</span>
              </div>

              {/* Exam Filter */}
              <div className="flex items-center gap-1 text-xs">
                <label className="text-slate-500">Exam:</label>
                <select
                  value={selectedExamFilter}
                  onChange={(e) => setSelectedExamFilter(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg font-bold text-xs cursor-pointer focus:ring-1 focus:ring-blue-600"
                >
                  <option value="ALL">All Examinations (ಎಲ್ಲಾ ಪರೀಕ್ಷೆಗಳು)</option>
                  {CCE_EXAMS.map((ex) => (
                    <option key={ex.key} value={ex.key}>
                      {ex.labelEn} ({ex.labelKn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div className="flex items-center gap-1 text-xs">
                <label className="text-slate-500">Subject:</label>
                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg font-bold text-xs cursor-pointer focus:ring-1 focus:ring-blue-600"
                >
                  <option value="ALL">All Subjects (ಎಲ್ಲಾ ವಿಷಯಗಳು)</option>
                  {allSubjects.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <span className="text-xs text-slate-500 font-mono">
              Showing <b>{filteredRows.length}</b> entries
            </span>
          </div>

          {/* Detailed Progress Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-slate-900 font-black border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Subject (ವಿಷಯ)</th>
                  <th className="py-2.5 px-3">Exam (ಪರೀಕ್ಷೆ)</th>
                  <th className="py-2.5 px-3 text-right">Total Students</th>
                  <th className="py-2.5 px-3 text-right text-emerald-800">Completed</th>
                  <th className="py-2.5 px-3 text-right text-amber-800">Pending</th>
                  <th className="py-2.5 px-3 text-right">Progress (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                      No subject entries matching selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => {
                    const isAlert = row.progressPercent !== null && row.progressPercent < 50;
                    const is100 = row.progressPercent === 100;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {row.subjectNameEn}
                          <span className="block text-[10px] text-slate-500 font-normal">
                            {row.subjectNameKn}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px]">
                            {row.examLabel}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">
                          {row.eligibleStudents}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                          {row.completedEntries}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-amber-700">
                          {row.pendingEntries}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                              is100
                                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                : isAlert
                                ? 'bg-rose-100 text-rose-950 border border-rose-300 font-black'
                                : 'bg-slate-100 text-slate-900 border border-slate-300'
                            }`}
                          >
                            {row.progressPercentDisplay}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 sm:p-4 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500">
            Official Karnataka CCE Evaluation Standard • Accurate real-time validation
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition shadow-xs"
          >
            Close (ಮುಚ್ಚಿ)
          </button>
        </div>
      </div>
    </div>
  );
};
