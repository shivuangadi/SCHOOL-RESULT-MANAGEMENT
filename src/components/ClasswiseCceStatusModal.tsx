import React from 'react';
import { Student, StudentClass, SchoolRecord } from '../types';
import { calculateClasswiseExamProgress, getRealMarksFromLocal } from '../utils/marksStore';
import {
  X,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  School,
  Sparkles,
  Printer,
} from 'lucide-react';

interface ClasswiseCceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolRecord: SchoolRecord | null;
  onNavigateToEntry: (classNum: number) => void;
}

const KANNADA_CLASS_NAMES: Record<StudentClass, string> = {
  '1': '1ನೇ ತರಗತಿ',
  '2': '2ನೇ ತರಗತಿ',
  '3': '3ನೇ ತರಗತಿ',
  '4': '4ನೇ ತರಗತಿ',
  '5': '5ನೇ ತರಗತಿ',
  '6': '6ನೇ ತರಗತಿ',
  '7': '7ನೇ ತರಗತಿ',
  '8': '8ನೇ ತರಗತಿ',
  '9': '9ನೇ ತರಗತಿ',
  '10': '10ನೇ ತರಗತಿ',
};

export const ClasswiseCceStatusModal: React.FC<ClasswiseCceStatusModalProps> = ({
  isOpen,
  onClose,
  students,
  schoolRecord,
  onNavigateToEntry,
}) => {
  if (!isOpen) return null;

  const diseCode = schoolRecord?.diseCode || '';
  const marksMap = getRealMarksFromLocal(diseCode);
  const progressList = calculateClasswiseExamProgress(students, marksMap);

  const talukName = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
  const medium = schoolRecord?.schoolMedium || schoolRecord?.medium || '';
  const isKannada =
    medium.includes('ಕನ್ನಡ') ||
    medium.toLowerCase().includes('kannada') ||
    !medium;
  const totalStudents = students.length;
  const overallAverage =
    progressList.reduce((acc, curr) => acc + curr.overallPercent, 0) / (progressList.length || 1);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header with Official Karnataka Designation */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 shrink-0 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {isKannada && (
                <div className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-widest">
                  ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ {talukName}
                </div>
              )}
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 flex items-center gap-2">
                <Award className="w-7 h-7 text-amber-400 shrink-0" />
                <span>ತರಗತಿವಾರು CCE ಪರೀಕ್ಷಾ ಅಂಕಗಳ ದಾಖಲಾತಿ ಸ್ಥಿತಿ (Classwise CCE Entry Status)</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-blue-200 mt-1 font-bold">
                <span className="font-extrabold text-white">{schoolRecord?.schoolName}</span>
                <span>•</span>
                <span className="font-mono bg-blue-900/80 px-2.5 py-0.5 rounded font-black">
                  DISE: {schoolRecord?.diseCode}
                </span>
                <span>•</span>
                <span className="text-amber-300 font-black">Overall CCE Completion: {Math.round(overallAverage)}%</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="self-start sm:self-center p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1.5">
              <div className="font-black text-slate-900 text-sm sm:text-base">
                CCE ನಿಯಮಾವಳಿ ಪರೀಕ್ಷೆಗಳ ವಿವರ (FA1, FA2, SA1, FA3, FA4, SA2 Progress):
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-600">
                ಪ್ರತಿಯೊಂದು ತರಗತಿಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ವಿದ್ಯಾರ್ಥಿಗಳ ಅಂಕಗಳನ್ನು ದಾಖಲಿಸಿದ ಶೇಕಡಾವಾರು ಪ್ರಮಾಣವನ್ನು ಕೆಳಗೆ ನೀಡಲಾಗಿದೆ.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <span className="text-xs uppercase font-black text-slate-600 block">
                  Overall Progress
                </span>
                <span className="text-3xl font-black text-blue-950 font-mono">
                  {Math.round(overallAverage)}%
                </span>
              </div>
              <div className="w-16 h-16 rounded-full bg-white border-4 border-blue-600 flex items-center justify-center font-black text-blue-900 font-mono text-base shadow-sm">
                {Math.round(overallAverage)}%
              </div>
            </div>
          </div>

          {/* 10 Classes Detailed Progress Table */}
          <div className="border-2 border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-900 font-black uppercase text-xs tracking-wider border-b-2 border-slate-300">
                <tr>
                  <th className="py-3.5 px-4">ತರಗತಿ (Class)</th>
                  <th className="py-3.5 px-2 text-center">ದಾಖಲಾತಿ (Students)</th>
                  <th className="py-3.5 px-2 text-center">FA-1</th>
                  <th className="py-3.5 px-2 text-center">FA-2</th>
                  <th className="py-3.5 px-2 text-center bg-blue-50">SA-1 (Term 1)</th>
                  <th className="py-3.5 px-2 text-center">FA-3</th>
                  <th className="py-3.5 px-2 text-center">FA-4</th>
                  <th className="py-3.5 px-2 text-center bg-blue-50">SA-2 (Annual)</th>
                  <th className="py-3.5 px-3 text-center">ಒಟ್ಟು ಶೇಕಡಾ (Overall)</th>
                  <th className="py-3.5 px-4 text-right">ಕ್ರಮ (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {progressList.map((p) => {
                  const classNum = Number(p.classStandard);
                  const isDone = p.overallPercent >= 100;
                  return (
                    <tr
                      key={p.classStandard}
                      className="hover:bg-blue-50/40 transition duration-100"
                    >
                      {/* Class */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="font-black text-base text-blue-950">
                          {KANNADA_CLASS_NAMES[p.classStandard]}
                        </div>
                        <div className="text-xs text-slate-500 font-bold">
                          DSERT CCE Matrix
                        </div>
                      </td>

                      {/* Students */}
                      <td className="py-3.5 px-2 text-center font-black font-mono text-sm sm:text-base">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-900">
                          {p.totalStudents}
                        </span>
                      </td>

                      {/* FA1 */}
                      <td className="py-3.5 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-black text-xs sm:text-sm ${
                            p.fa1Percent === 100
                              ? 'bg-emerald-100 text-emerald-900'
                              : p.fa1Percent > 0
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {p.fa1Percent}%
                        </span>
                      </td>

                      {/* FA2 */}
                      <td className="py-3.5 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-black text-xs sm:text-sm ${
                            p.fa2Percent === 100
                              ? 'bg-emerald-100 text-emerald-900'
                              : p.fa2Percent > 0
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {p.fa2Percent}%
                        </span>
                      </td>

                      {/* SA1 */}
                      <td className="py-3.5 px-2 text-center bg-blue-50/40">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-black text-xs sm:text-sm ${
                            p.sa1Percent === 100
                              ? 'bg-emerald-100 text-emerald-900'
                              : p.sa1Percent > 0
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {p.sa1Percent}%
                        </span>
                      </td>

                      {/* FA3 */}
                      <td className="py-3.5 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-black text-xs sm:text-sm ${
                            p.fa3Percent === 100
                              ? 'bg-emerald-100 text-emerald-900'
                              : p.fa3Percent > 0
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {p.fa3Percent}%
                        </span>
                      </td>

                      {/* FA4 */}
                      <td className="py-3.5 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-black text-xs sm:text-sm ${
                            p.fa4Percent === 100
                              ? 'bg-emerald-100 text-emerald-900'
                              : p.fa4Percent > 0
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {p.fa4Percent}%
                        </span>
                      </td>

                      {/* SA2 */}
                      <td className="py-3.5 px-2 text-center bg-blue-50/40">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-black text-xs sm:text-sm ${
                            p.sa2Percent === 100
                              ? 'bg-emerald-100 text-emerald-900'
                              : p.sa2Percent > 0
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {p.sa2Percent}%
                        </span>
                      </td>

                      {/* Overall Progress Bar */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="w-28 mx-auto space-y-1">
                          <div className="flex items-center justify-between font-mono font-black text-xs">
                            <span
                              className={
                                isDone
                                  ? 'text-emerald-700'
                                  : p.overallPercent > 0
                                  ? 'text-blue-950'
                                  : 'text-slate-400'
                              }
                            >
                              {p.overallPercent}%
                            </span>
                            {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />}
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              style={{ width: `${p.overallPercent}%` }}
                              className={`h-full transition-all duration-300 ${
                                isDone
                                  ? 'bg-emerald-500'
                                  : p.overallPercent > 0
                                  ? 'bg-blue-600'
                                  : 'bg-transparent'
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateToEntry(classNum);
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                        >
                          <span>ಅಂಕ ನಮೂದಿಸಿ</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between shrink-0">
          <div className="text-xs sm:text-sm font-bold text-slate-600">
            KSEAB / DSERT CCE Matrix Rule: Classes 1-5 (15+15+20), Classes 6-10 (10+10+30)
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-black rounded-xl text-sm sm:text-base cursor-pointer shadow-md transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
