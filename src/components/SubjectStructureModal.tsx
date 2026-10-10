import React, { useState } from 'react';
import { SchoolMedium, StudentClass } from '../types';
import { getSubjectsForMediumAndClass, getExamPatternForClassAndSubject, getMaxMarksForMediumAndClass } from '../data/subjectConfig';
import { BookOpen, X, Printer, CheckCircle2, Award, Layers } from 'lucide-react';

interface SubjectStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMedium?: SchoolMedium;
  defaultClass?: number;
}

export const SubjectStructureModal: React.FC<SubjectStructureModalProps> = ({
  isOpen,
  onClose,
  defaultMedium = 'Kannada',
  defaultClass = 5,
}) => {
  const [selectedMedium, setSelectedMedium] = useState<SchoolMedium>(defaultMedium);
  const [selectedClass, setSelectedClass] = useState<number>(defaultClass);

  if (!isOpen) return null;

  const subjects = getSubjectsForMediumAndClass(selectedMedium, selectedClass);
  const totalMaxMarks = getMaxMarksForMediumAndClass(selectedMedium, selectedClass);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between border-b-4 border-amber-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <BookOpen className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black tracking-tight font-serif text-white">
                ವಿಷಯ ವಿನ್ಯಾಸ (Subject Structure & CCE Pattern)
              </h2>
              <p className="text-xs text-blue-200 font-medium">
                ಕರ್ನಾಟಕ ಶಾಲಾ ಪರೀಕ್ಷೆ ಮತ್ತು ಮೌಲ್ಯನಿರ್ಣಯ ಮಂಡಳಿ (KSEAB / DSERT) ನಿಯಮಾವಳಿಗಳು
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-800/80 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-blue-600/60"
              title="Print Subject Structure"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">ಮುದ್ರಿಸಿ (Print)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls: Medium & Class Standard */}
        <div className="bg-slate-50 p-3 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Medium Selector */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-black text-slate-700">ಮಾಧ್ಯಮ (Medium):</label>
              <select
                value={selectedMedium}
                onChange={(e) => setSelectedMedium(e.target.value as SchoolMedium)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="Kannada">ಕನ್ನಡ ಮಾಧ್ಯಮ (Kannada)</option>
                <option value="English">English Medium</option>
                <option value="Marathi">मराठी माध्यम (Marathi)</option>
                <option value="Urdu">اردو میڈیم (Urdu)</option>
              </select>
            </div>

            {/* Class Selector */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-black text-slate-700">ತರಗತಿ (Class):</label>
              <div className="flex items-center gap-1 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-mono font-black transition cursor-pointer ${
                      selectedClass === cls
                        ? 'bg-blue-900 text-white shadow-sm ring-2 ring-blue-700'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-950 font-black text-xs font-mono border border-blue-200">
              {subjects.length} ವಿಷಯಗಳು • ಒಟ್ಟು ಅಂಕ: {totalMaxMarks}m
            </span>
          </div>
        </div>

        {/* Structure Table */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead className="bg-slate-100 text-slate-900 font-black text-xs uppercase border-b-2 border-slate-300">
                  <tr>
                    <th rowSpan={2} className="py-3 px-2 text-left w-12 border-r border-slate-200">
                      ಕ್ರ.ಸಂ.
                    </th>
                    <th rowSpan={2} className="py-3 px-3 text-left border-r border-slate-200 min-w-[180px]">
                      ವಿಷಯದ ಹೆಸರು (Subject)
                    </th>
                    <th rowSpan={2} className="py-3 px-2 border-r border-slate-200 w-16">
                      ಕೋಡ್
                    </th>
                    <th colSpan={4} className="py-2 px-2 bg-blue-50 text-blue-950 border-r border-slate-200">
                      ಮೊದಲನೇ ಸತ್ರ (Term 1)
                    </th>
                    <th colSpan={4} className="py-2 px-2 bg-purple-50 text-purple-950 border-r border-slate-200">
                      ಎರಡನೇ ಸತ್ರ (Term 2)
                    </th>
                    <th rowSpan={2} className="py-3 px-3 bg-amber-100 text-slate-950 font-black w-24">
                      ಒಟ್ಟು ಅಂಕ (Total)
                    </th>
                  </tr>
                  <tr className="text-[11px]">
                    <th className="py-1 px-1 bg-blue-50/70 border-r border-slate-200">FA1</th>
                    <th className="py-1 px-1 bg-blue-50/70 border-r border-slate-200">FA2</th>
                    <th className="py-1 px-1 bg-blue-50/70 border-r border-slate-200">SA1</th>
                    <th className="py-1 px-1 bg-blue-100 font-black border-r border-slate-200">T1</th>
                    <th className="py-1 px-1 bg-purple-50/70 border-r border-slate-200">FA3</th>
                    <th className="py-1 px-1 bg-purple-50/70 border-r border-slate-200">FA4</th>
                    <th className="py-1 px-1 bg-purple-50/70 border-r border-slate-200">SA2</th>
                    <th className="py-1 px-1 bg-purple-100 font-black border-r border-slate-200">T2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-mono">
                  {subjects.map((sub, idx) => {
                    const pattern = getExamPatternForClassAndSubject(selectedClass, sub.code);
                    return (
                      <tr key={sub.code} className="hover:bg-blue-50/40 transition">
                        <td className="py-2.5 px-2 text-left font-bold text-slate-500 border-r border-slate-100">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 text-left font-sans font-black text-slate-900 border-r border-slate-100">
                          <div>{sub.kannadaName}</div>
                          <div className="text-[11px] text-slate-500 font-normal">{sub.subjectName}</div>
                        </td>
                        <td className="py-2.5 px-2 font-mono font-bold text-slate-600 border-r border-slate-100">
                          {sub.code}
                        </td>
                        <td className="py-2.5 px-1 bg-blue-50/30 border-r border-slate-100">
                          {pattern.fa1Max}
                        </td>
                        <td className="py-2.5 px-1 bg-blue-50/30 border-r border-slate-100">
                          {pattern.fa2Max}
                        </td>
                        <td className="py-2.5 px-1 bg-blue-50/30 border-r border-slate-100 font-bold">
                          {pattern.sa1Max}
                        </td>
                        <td className="py-2.5 px-1 bg-blue-100/70 font-black text-blue-950 border-r border-slate-100">
                          {pattern.term1Max}
                        </td>
                        <td className="py-2.5 px-1 bg-purple-50/30 border-r border-slate-100">
                          {pattern.fa3Max}
                        </td>
                        <td className="py-2.5 px-1 bg-purple-50/30 border-r border-slate-100">
                          {pattern.fa4Max}
                        </td>
                        <td className="py-2.5 px-1 bg-purple-50/30 border-r border-slate-100 font-bold">
                          {pattern.sa2Max}
                        </td>
                        <td className="py-2.5 px-1 bg-purple-100/70 font-black text-purple-950 border-r border-slate-100">
                          {pattern.term2Max}
                        </td>
                        <td className="py-2.5 px-3 bg-amber-50 font-black text-slate-950 text-sm sm:text-base">
                          {pattern.totalMax}m
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 font-mono text-sm">
                  <tr>
                    <td colSpan={3} className="py-3 px-3 text-left font-sans text-slate-950 text-base">
                      ಒಟ್ಟು ಗರಿಷ್ಠ ಅಂಕಗಳು (Total Maximum Marks):
                    </td>
                    <td colSpan={4} className="py-3 px-2 bg-blue-100 text-blue-950">
                      Term 1: {totalMaxMarks / 2}m
                    </td>
                    <td colSpan={4} className="py-3 px-2 bg-purple-100 text-purple-950">
                      Term 2: {totalMaxMarks / 2}m
                    </td>
                    <td className="py-3 px-3 bg-amber-200 text-slate-950 text-base sm:text-lg">
                      {totalMaxMarks}m
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Guidelines info card */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-950 space-y-1.5">
            <div className="font-black flex items-center gap-2 text-blue-900">
              <Award className="w-4 h-4 text-amber-500" />
              <span>ಕರ್ನಾಟಕ CCE ಮೌಲ್ಯಮಾಪನ ಸೂತ್ರ & ಮಾದರಿ (KSEAB Evaluation Rules):</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
              <li>
                <strong>1 ರಿಂದ 5 ನೇ ತರಗತಿ (ಪ್ರಾಥಮಿಕ):</strong> ಪ್ರತಿ ವಿಷಯಕ್ಕೆ 100 ಅಂಕಗಳು (FA1:15, FA2:15, SA1:20 = 50 | FA3:15, FA4:15, SA2:20 = 50). 4 ವಿಷಯಗಳು x 100 = 400 ಅಂಕಗಳು.
              </li>
              <li>
                <strong>6 ರಿಂದ 8 ನೇ ತರಗತಿ (ಹಿರಿಯ ಪ್ರಾಥಮಿಕ):</strong> ಪ್ರತಿ ವಿಷಯಕ್ಕೆ 100 ಅಂಕಗಳು (FA1:10, FA2:10, SA1:30 = 50 | FA3:10, FA4:10, SA2:30 = 50). 7 ವಿಷಯಗಳು x 100 = 700 ಅಂಕಗಳು.
              </li>
              <li>
                <strong>9 ಮತ್ತು 10 ನೇ ತರಗತಿ (ಪ್ರೌಢಶಾಲೆ):</strong> ಪ್ರಥಮ ಭಾಷೆಗೆ 125 ಅಂಕಗಳು (FA: 12.5 x 4 + SA: 37.5 x 2), ಉಳಿದ 6 ವಿಷಯಗಳಿಗೆ ತಲಾ 100 ಅಂಕಗಳು = ಒಟ್ಟು 725 ಅಂಕಗಳು.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-3 sm:p-4 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm cursor-pointer"
          >
            ಮುಚ್ಚಿ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
