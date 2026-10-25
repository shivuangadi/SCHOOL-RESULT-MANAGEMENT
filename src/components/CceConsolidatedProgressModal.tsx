import React, { useState, useMemo, useRef } from 'react';
import { StudentClass, SchoolMedium, SchoolRecord, Student, StudentExamMarks } from '../types';
import {
  CceExamKey,
  CCE_EXAMS,
  calculateSchoolCceMonitoringSummary,
} from '../utils/cceProgressMonitorHelper';
import {
  X,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Layers,
  Award,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface CceConsolidatedProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  marksMap: Record<string, StudentExamMarks>;
  configuredClasses: StudentClass[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  onSelectClassDetail?: (cls: StudentClass) => void;
}

export const CceConsolidatedProgressModal: React.FC<CceConsolidatedProgressModalProps> = ({
  isOpen,
  onClose,
  students,
  marksMap,
  configuredClasses,
  schoolRecord,
  academicYear,
  onSelectClassDetail,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const schoolName = schoolRecord?.schoolName || 'Karnataka Government School';
  const diseCode = schoolRecord?.diseCode || '00000000000';
  const medium = schoolRecord?.schoolMedium || 'Kannada';

  const [activeExamFilter, setActiveExamFilter] = useState<CceExamKey>('fa1');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  const summary = useMemo(() => {
    return calculateSchoolCceMonitoringSummary(
      students,
      marksMap,
      configuredClasses,
      medium,
      schoolName,
      diseCode,
      academicYear,
      activeExamFilter
    );
  }, [students, marksMap, configuredClasses, medium, schoolName, diseCode, academicYear, activeExamFilter]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[94vh]">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 sm:p-6 flex items-center justify-between shrink-0 shadow-md">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xs">
                Consolidated CCE Monitoring (All Classes)
              </span>
              <span className="text-xs text-slate-300 font-mono">
                DISE: <b className="text-white">{diseCode}</b>
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Year: <b className="text-white">{academicYear}</b>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white truncate max-w-3xl">
              {schoolName}
            </h2>
            <p className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
              <span>Medium: <b>{medium}</b></span>
              <span>•</span>
              <span>Class Range: <b>Class {configuredClasses[0]} to {configuredClasses[configuredClasses.length - 1]}</b></span>
              <span>•</span>
              <span>Current Examination: <b className="text-amber-300">{summary.currentExamLabel}</b></span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Print Consolidated Progress"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
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

        {/* Body Container */}
        <div ref={printAreaRef} className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 text-slate-800">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Total School Students */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Students</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                {summary.totalStudentsAcrossSchool}
              </div>
              <span className="text-[11px] text-slate-500">Across {configuredClasses.length} Configured Classes</span>
            </div>

            {/* Overall School Progress (Weighted) */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">Overall School Progress</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-blue-950">
                {summary.overallSchoolPercentDisplay}
              </div>
              <span className="text-[11px] text-blue-700">Weighted required entry completion</span>
            </div>

            {/* Total Completed Entries */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Completed Tasks</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-950">
                {summary.totalCompletedEntries}
              </div>
              <span className="text-[11px] text-emerald-700">Valid saved assessments</span>
            </div>

            {/* Total Pending Entries */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Pending Tasks</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-950">
                {summary.totalPendingEntries}
              </div>
              <span className="text-[11px] text-amber-700">Awaiting marks entry</span>
            </div>
          </div>

          {/* Exam Selector Buttons */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Select Examination Calendar Window:</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                System Active: <b>{summary.examWindowDescription}</b>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {CCE_EXAMS.map((ex) => {
                const isSelected = activeExamFilter === ex.key;
                return (
                  <button
                    key={ex.key}
                    type="button"
                    onClick={() => setActiveExamFilter(ex.key)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/50'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{ex.labelEn}</span>
                    <span className="text-[10px] font-mono opacity-80">{ex.labelKn.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Low Progress Alerts Summary (< 50%) */}
          {summary.lowProgressAlerts.length > 0 ? (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-900 font-black text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Classes & Subjects Below 50% Progress ({summary.lowProgressAlerts.length} Alerts for {summary.currentExamLabel})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                {summary.lowProgressAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectClassDetail && onSelectClassDetail(alert.classStandard)}
                    className="p-2.5 bg-white rounded-xl border border-rose-200 flex items-center justify-between hover:bg-rose-50 cursor-pointer transition shadow-2xs"
                  >
                    <div>
                      <span className="font-black text-rose-950">Class {alert.classStandard}</span>
                      <span className="block text-[11px] text-slate-600 truncate max-w-[180px]">{alert.subjectName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-rose-600 text-sm">{alert.percent}%</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{alert.completed}/{alert.required}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>✓ All configured classes and subjects have achieved over 50% completion for {summary.currentExamLabel}!</span>
            </div>
          )}

          {/* Class-Wise Progress Cards Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-700" />
              <span>Class-Wise CCE Status ({summary.currentExamLabel}) – Click Card for Full Detail:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {summary.classSummaries.map((clsSummary) => {
                const ep = clsSummary.examProgress[summary.currentExam];
                const pct = ep.percent ?? 0;
                const isUnder50 = ep.percent !== null && ep.percent < 50;
                const is100 = ep.percent === 100;

                const barColor = is100
                  ? 'bg-emerald-600'
                  : pct >= 70
                  ? 'bg-emerald-500'
                  : pct >= 50
                  ? 'bg-blue-500'
                  : pct > 0
                  ? 'bg-rose-500'
                  : 'bg-slate-300';

                return (
                  <div
                    key={clsSummary.classStandard}
                    onClick={() => onSelectClassDetail && onSelectClassDetail(clsSummary.classStandard)}
                    className="p-3.5 bg-white hover:bg-blue-50/60 rounded-2xl border-2 border-slate-200 hover:border-blue-400 transition-all cursor-pointer shadow-xs space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm group-hover:text-blue-900">
                        Class {clsSummary.classStandard}
                      </span>
                      <span
                        className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg ${
                          is100
                            ? 'bg-emerald-100 text-emerald-950'
                            : isUnder50
                            ? 'bg-rose-100 text-rose-950'
                            : 'bg-blue-100 text-blue-950'
                        }`}
                      >
                        {ep.display}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Students: <b>{clsSummary.totalStudents}</b></span>
                      <span>Done: <b>{ep.completed}/{ep.totalRequired}</b></span>
                    </div>

                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-bold">
                      <span>View details</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 sm:p-4 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500">
            Karnataka School Result Management System • Weighted Aggregation Engine
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
