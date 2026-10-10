import React, { useState, useMemo } from 'react';
import { SchoolRecord, Student } from '../../types';
import { ComputedMarathiUrduStudent } from '../../utils/marathiUrduCceHelper';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type SatsExamKey = 'FA-1' | 'FA-2' | 'FA-3' | 'FA-4' | 'SA-1' | 'SA-2';

const EXAM_OPTIONS: { key: SatsExamKey; label: string }[] = [
  { key: 'FA-1', label: 'FA1' },
  { key: 'FA-2', label: 'FA2' },
  { key: 'FA-3', label: 'FA3' },
  { key: 'FA-4', label: 'FA4' },
  { key: 'SA-1', label: 'SA1' },
  { key: 'SA-2', label: 'SA2' },
];

interface SatsReportProps {
  studentsByClass: Record<string, ComputedMarathiUrduStudent[]>;
  allStudents?: Student[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  reportRef?: React.RefObject<HTMLDivElement | null>;
  selectedClass?: string;
  onSelectClass?: (cls: string) => void;
}

type SatsSortField = 'index' | 'name' | 'satsNo' | 'fl' | 'sl' | 'tl' | 'maths' | 'evs';

export const SatsReport: React.FC<SatsReportProps> = ({
  studentsByClass,
  schoolRecord,
  academicYear,
  reportRef,
  selectedClass: controlledClass,
  onSelectClass,
}) => {
  const [internalClass, setInternalClass] = useState<string>('3');
  const selectedClass = controlledClass || internalClass;
  const [selectedExam, setSelectedExam] = useState<SatsExamKey>('FA-1');

  // Sorting state: default students names sorted A-Z
  const [sortField, setSortField] = useState<SatsSortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const schoolName = schoolRecord?.schoolName || 'ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಕನ್ನಡ ಶಾಲೆ ನಿಂಗ್ಯಾನಟ್ಟಿ';
  const diseCode = schoolRecord?.diseCode || '29010409301';
  const currentExamLabel = EXAM_OPTIONS.find((ex) => ex.key === selectedExam)?.label || selectedExam;

  // Current class students
  const rawClassStudents = studentsByClass[selectedClass] || [];

  const handleClassChange = (cls: string) => {
    if (onSelectClass) onSelectClass(cls);
    else setInternalClass(cls);
  };

  const handleSort = (field: SatsSortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Helper to extract grade for the chosen exam
  const getSubjectExamGrade = (
    sub: ComputedMarathiUrduStudent['subjects']['FL'],
    isExempted: boolean,
    exam: SatsExamKey
  ): string => {
    if (isExempted) return 'Exempt';
    switch (exam) {
      case 'FA-1':
        return sub?.fa1_grade || '-';
      case 'FA-2':
        return sub?.fa2_grade || '-';
      case 'FA-3':
        return sub?.fa3_grade || '-';
      case 'FA-4':
        return sub?.fa4_grade || '-';
      case 'SA-1':
        return sub?.sa1_grade || '-';
      case 'SA-2':
        return sub?.sa2_grade || '-';
      default:
        return '-';
    }
  };

  const gradeRank = (g: string) => {
    const ranks: Record<string, number> = {
      'A+': 8,
      A: 7,
      'B+': 6,
      B: 5,
      'C+': 4,
      C: 3,
      D: 2,
      Exempt: 1,
      '-': 0,
    };
    return ranks[g] ?? 0;
  };

  // Sorted list of students
  const classStudents = useMemo(() => {
    const list = [...rawClassStudents];
    list.sort((a, b) => {
      let res = 0;
      if (sortField === 'name') {
        res = (a.student.studentName || '').localeCompare(b.student.studentName || '');
      } else if (sortField === 'satsNo') {
        res = (a.student.satsNo || '').localeCompare(b.student.satsNo || '');
      } else if (sortField === 'fl') {
        const ga = getSubjectExamGrade(a.subjects.FL, a.isExempted, selectedExam);
        const gb = getSubjectExamGrade(b.subjects.FL, b.isExempted, selectedExam);
        res = gradeRank(ga) - gradeRank(gb);
      } else if (sortField === 'sl') {
        const ga = getSubjectExamGrade(a.subjects.SL, a.isExempted, selectedExam);
        const gb = getSubjectExamGrade(b.subjects.SL, b.isExempted, selectedExam);
        res = gradeRank(ga) - gradeRank(gb);
      } else if (sortField === 'tl') {
        const ga = getSubjectExamGrade(a.subjects.TL, a.isExempted, selectedExam);
        const gb = getSubjectExamGrade(b.subjects.TL, b.isExempted, selectedExam);
        res = gradeRank(ga) - gradeRank(gb);
      } else if (sortField === 'maths') {
        const ga = getSubjectExamGrade(a.subjects.MATHS, a.isExempted, selectedExam);
        const gb = getSubjectExamGrade(b.subjects.MATHS, b.isExempted, selectedExam);
        res = gradeRank(ga) - gradeRank(gb);
      } else if (sortField === 'evs') {
        const ga = getSubjectExamGrade(a.subjects.EVS, a.isExempted, selectedExam);
        const gb = getSubjectExamGrade(b.subjects.EVS, b.isExempted, selectedExam);
        res = gradeRank(ga) - gradeRank(gb);
      }

      // Secondary sort alphabetically by student name
      if (res === 0 && sortField !== 'name') {
        res = (a.student.studentName || '').localeCompare(b.student.studentName || '');
      }

      return sortDir === 'asc' ? res : -res;
    });
    return list;
  }, [rawClassStudents, sortField, sortDir, selectedExam]);

  const renderSortIndicator = (field: SatsSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-40 inline-block ml-1 print:hidden" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-red-700 inline-block ml-1 print:hidden" />
    ) : (
      <ArrowDown className="w-3 h-3 text-red-700 inline-block ml-1 print:hidden" />
    );
  };

  return (
    <div
      ref={reportRef}
      className="bg-white p-6 sm:p-8 rounded-xl border-[3.5px] border-[#c2410c] shadow-lg space-y-4 max-w-[850px] mx-auto legal-portrait print:p-2 print:border-[3.5px] print:shadow-none"
    >
      {/* Red Header matching Image 3 with Complete School Details for PDF and Screen */}
      <div className="text-center pt-1 pb-1 space-y-1">
        <h1 className="text-base sm:text-lg font-bold text-red-600 tracking-wide font-serif">
          {schoolName}
        </h1>
        <div className="text-xs font-bold text-slate-800 flex flex-wrap items-center justify-center gap-2">
          <span>DISE NO: <strong className="font-mono text-slate-950 font-black">{diseCode}</strong></span>
          <span>•</span>
          <span>CLASS: <strong className="text-emerald-700 font-black">{selectedClass}th Std</strong></span>
          <span>•</span>
          <span>EXAM TYPE: <strong className="text-blue-700 font-black">{currentExamLabel}</strong></span>
          <span>•</span>
          <span>YEAR: <strong className="text-slate-900 font-black">{academicYear}</strong></span>
        </div>
      </div>

      {/* Sub-Header Row: Class dropdown, Exam dropdown, Academic Year */}
      <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm font-bold px-2 pb-1 gap-2 border-b border-slate-200">
        {/* Class Selection */}
        <div className="flex items-center gap-1.5 text-emerald-600">
          <span className="font-extrabold text-sm sm:text-base">Class</span>
          <select
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
            className="font-black text-xs sm:text-sm bg-emerald-50 text-emerald-950 border border-emerald-400 rounded-md px-2 py-0.5 focus:outline-none cursor-pointer print:hidden"
          >
            {['1', '2', '3', '4', '5'].map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
          <span className="hidden print:inline font-black text-emerald-800">
            : {selectedClass}th Std
          </span>
        </div>

        {/* Exam Selection */}
        <div className="flex items-center gap-1.5 text-blue-700">
          <span className="font-bold text-xs sm:text-sm">Select the Exam type:</span>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value as SatsExamKey)}
            className="font-black text-xs sm:text-sm bg-blue-50 text-blue-950 border border-blue-400 rounded-md px-2 py-0.5 focus:outline-none cursor-pointer print:hidden"
            title="Select the Exam type"
          >
            <option value="" disabled>
              Select the Exam type
            </option>
            {EXAM_OPTIONS.map((ex) => (
              <option key={ex.key} value={ex.key}>
                {ex.label}
              </option>
            ))}
          </select>
          <span className="hidden print:inline font-black text-blue-950">
            : {currentExamLabel}
          </span>
        </div>

        {/* Academic Year */}
        <div className="text-emerald-600 font-extrabold">
          <span>Academic Year: </span>
          <span className="font-black">{academicYear}</span>
        </div>
      </div>

      {/* Main Table with embedded School details header for Excel Export & PDF */}
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse border-2 border-slate-900 text-xs">
          <thead>
            {/* Header row 1 for Excel & print exports */}
            <tr className="bg-white text-center font-bold text-red-600 border-b border-slate-900">
              <th colSpan={8} className="p-2 text-sm sm:text-base font-serif font-black border-2 border-slate-900 text-red-600">
                {schoolName}
              </th>
            </tr>
            {/* Header row 2 with DISE, Class, Exam Type, Academic Year for Excel & print exports */}
            <tr className="bg-amber-50/80 text-center font-bold text-slate-900 border-b-2 border-slate-900 text-xs">
              <th colSpan={8} className="p-1.5 border-2 border-slate-900 text-slate-900">
                DISE NO: {diseCode} | CLASS: {selectedClass}th Std | EXAM TYPE: {currentExamLabel} | ACADEMIC YEAR: {academicYear}
              </th>
            </tr>
            <tr className="bg-[#fed7aa] font-black text-slate-950 border-b-2 border-slate-900">
              <th
                onClick={() => handleSort('index')}
                className="border-2 border-slate-900 p-2 w-14 cursor-pointer hover:bg-amber-300 transition select-none"
                title="Click to sort by serial number"
              >
                <span>Sr No</span>
                {renderSortIndicator('index')}
              </th>
              <th
                onClick={() => handleSort('satsNo')}
                className="border-2 border-slate-900 p-2 w-28 cursor-pointer hover:bg-amber-300 transition select-none"
                title="Click to sort by SATS number"
              >
                <span>SATS No</span>
                {renderSortIndicator('satsNo')}
              </th>
              <th
                onClick={() => handleSort('name')}
                className="border-2 border-slate-900 p-2 text-left pl-3 cursor-pointer hover:bg-amber-300 transition select-none"
                title="Click to sort alphabetically (A-Z / Z-A)"
              >
                <span>STUDENT NAME</span>
                {renderSortIndicator('name')}
              </th>
              <th
                onClick={() => handleSort('fl')}
                className="border-2 border-slate-900 p-2 w-24 cursor-pointer hover:bg-amber-300 transition select-none"
                title="Click to sort by First Language grade"
              >
                <span>First Language</span>
                {renderSortIndicator('fl')}
              </th>
              <th
                onClick={() => handleSort('sl')}
                className="border-2 border-slate-900 p-2 w-24 cursor-pointer hover:bg-amber-300 transition select-none"
                title="Click to sort by Second Language grade"
              >
                <span>Second Langauge</span>
                {renderSortIndicator('sl')}
              </th>
              <th
                onClick={() => handleSort('tl')}
                className="border-2 border-slate-900 p-2 w-24 cursor-pointer hover:bg-amber-300 transition select-none"
                title="Click to sort by Third Language grade"
              >
                <span>Third Langauge</span>
                {renderSortIndicator('tl')}
              </th>
              <th
                onClick={() => handleSort('maths')}
                className="border-2 border-slate-900 p-2 w-20 cursor-pointer hover:bg-amber-300 transition select-none"
                title="Click to sort by Maths grade"
              >
                <span>Maths</span>
                {renderSortIndicator('maths')}
              </th>
              <th
                onClick={() => handleSort('evs')}
                className="border-2 border-slate-900 p-2 w-20 cursor-pointer hover:bg-amber-300 transition select-none"
                title="Click to sort by EVS grade"
              >
                <span>EVS</span>
                {renderSortIndicator('evs')}
              </th>
            </tr>
          </thead>
          <tbody>
            {classStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-slate-900 p-4 text-center text-slate-500 font-semibold italic">
                  No students found in Class {selectedClass}th
                </td>
              </tr>
            ) : (
              classStudents.map((cs, idx) => {
                const isExempt = cs.isExempted;
                const flGrade = getSubjectExamGrade(cs.subjects.FL, isExempt, selectedExam);
                const slGrade = getSubjectExamGrade(cs.subjects.SL, isExempt, selectedExam);
                const tlGrade = getSubjectExamGrade(cs.subjects.TL, isExempt, selectedExam);
                const mathsGrade = getSubjectExamGrade(cs.subjects.MATHS, isExempt, selectedExam);
                const evsGrade = getSubjectExamGrade(cs.subjects.EVS, isExempt, selectedExam);

                return (
                  <tr key={cs.student.id} className="border-b border-slate-900 hover:bg-slate-50 text-[11px] h-7">
                    <td className="border border-slate-900 p-1 font-bold font-mono">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-900 p-1 font-mono font-medium">
                      {cs.student.satsNo || '-'}
                    </td>
                    <td className="border border-slate-900 p-1 text-left pl-3 font-bold text-slate-900 truncate max-w-[200px]">
                      {cs.student.studentName}
                      {cs.hasCwsnBadge && (
                        <span className="ml-1 text-[9px] bg-purple-700 text-white font-black px-1 py-0.5 rounded shadow-xs print:text-black print:bg-transparent">
                          CWSN
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-900 p-1 font-bold font-mono">
                      {flGrade}
                    </td>
                    <td className="border border-slate-900 p-1 font-bold font-mono">
                      {slGrade}
                    </td>
                    <td className="border border-slate-900 p-1 font-bold font-mono">
                      {tlGrade}
                    </td>
                    <td className="border border-slate-900 p-1 font-bold font-mono">
                      {mathsGrade}
                    </td>
                    <td className="border border-slate-900 p-1 font-bold font-mono">
                      {evsGrade}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
