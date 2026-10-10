import React, { useState, useMemo, useRef } from 'react';
import { Student, SchoolRecord } from '../types';
import { getRealMarksFromLocal, getStudentCalculatedResult } from '../utils/marksStore';
import { getClassesFromRange } from '../utils/studentStore';
import { calculateSubjectGrade } from '../data/demoData';
import { ReportPrintPreviewModal } from './ReportPrintPreviewModal';
import { shareReportToWhatsApp } from '../utils/printPdfHelper';
import { CwsnBadge } from './CwsnBadge';
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Award,
  Share2,
  User,
} from 'lucide-react';

interface ProgressCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolRecord: SchoolRecord | null;
}

export const ProgressCardModal: React.FC<ProgressCardModalProps> = ({
  isOpen,
  onClose,
  students,
  schoolRecord,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const availableClasses = useMemo(() => {
    const configured = getClassesFromRange(schoolRecord?.schoolRange);
    const clsSet = new Set(students.map((s) => s.classStandard).filter(Boolean));
    const list = configured.filter((c) => clsSet.has(c));
    return list.length > 0 ? list : configured;
  }, [students, schoolRecord?.schoolRange]);

  const filteredStudents = useMemo(() => {
    if (selectedClassFilter === 'ALL') return students;
    return students.filter((s) => s.classStandard === selectedClassFilter);
  }, [students, selectedClassFilter]);

  const currentStudent = useMemo(() => {
    if (filteredStudents.length === 0) return null;
    const found = filteredStudents.find((s) => s.id === selectedStudentId);
    return found || filteredStudents[0];
  }, [filteredStudents, selectedStudentId]);

  const currentIdx = useMemo(() => {
    if (!currentStudent) return 0;
    const idx = filteredStudents.findIndex((s) => s.id === currentStudent.id);
    return idx >= 0 ? idx : 0;
  }, [filteredStudents, currentStudent]);

  if (!isOpen) return null;

  const handlePrev = () => {
    if (currentIdx > 0) {
      setSelectedStudentId(filteredStudents[currentIdx - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIdx < filteredStudents.length - 1) {
      setSelectedStudentId(filteredStudents[currentIdx + 1].id);
    }
  };

  const diseCode = schoolRecord?.diseCode || '';
  const marksMap = getRealMarksFromLocal(diseCode);
  const talukName = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
  const medium = schoolRecord?.schoolMedium || schoolRecord?.medium || '';
  const isKannada =
    medium.includes('ಕನ್ನಡ') ||
    medium.toLowerCase().includes('kannada') ||
    !medium;

  const result = currentStudent
    ? getStudentCalculatedResult(
        currentStudent,
        schoolRecord?.schoolMedium || 'Kannada',
        marksMap,
        currentIdx + 1
      )
    : null;

  const studentNameClean = (currentStudent?.studentName || 'Student').replace(/[^a-zA-Z0-9_\u0C80-\u0CFF]/g, '_');
  const progressPdfFilename = `ProgressCard_${studentNameClean}_Class_${currentStudent?.classStandard || 'Std'}.pdf`;

  const getSubGrade = (val: number | null, maxVal: number) => {
    if (val === null || val === undefined) return '-';
    return calculateSubjectGrade((val / maxVal) * 100);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print-modal-card">
        {/* Navigation Bar (Hidden in Print) */}
        <div className="bg-emerald-950 text-white p-4 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h3 className="font-black text-sm sm:text-base">
              ಪ್ರಗತಿ ಪತ್ರ - Progress Card (Only with Grades / ಕೇವಲ ಗ್ರೇಡ್‌ಗಳು)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Class filter dropdown */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs sm:text-sm font-black text-emerald-300 whitespace-nowrap">
                ತರಗತಿ / Class:
              </label>
              <select
                value={selectedClassFilter}
                onChange={(e) => {
                  const newClass = e.target.value;
                  setSelectedClassFilter(newClass);
                  const nextList =
                    newClass === 'ALL'
                      ? students
                      : students.filter((s) => s.classStandard === newClass);
                  if (nextList.length > 0) {
                    setSelectedStudentId(nextList[0].id);
                  }
                }}
                className="px-3 py-2 text-xs sm:text-sm font-black bg-emerald-900 border-2 border-emerald-700 rounded-xl text-white cursor-pointer hover:border-emerald-500"
              >
                <option value="ALL" className="bg-emerald-950 text-white font-bold">
                  All Classes (ಎಲ್ಲಾ ತರಗತಿ)
                </option>
                {availableClasses.map((c) => (
                  <option key={c} value={c} className="bg-emerald-950 text-white font-bold">
                    Class {c} ({c} ನೇ ತರಗತಿ)
                  </option>
                ))}
              </select>
            </div>

            {/* Student Dropdown List for respective class */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs sm:text-sm font-black text-amber-300 whitespace-nowrap">
                ವಿದ್ಯಾರ್ಥಿ / Student:
              </label>
              <select
                value={currentStudent?.id || ''}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={filteredStudents.length === 0}
                className="px-3 py-2 text-xs sm:text-sm font-black bg-emerald-900 border-2 border-emerald-700 rounded-xl text-white cursor-pointer hover:border-emerald-500 max-w-xs sm:max-w-sm truncate"
              >
                {filteredStudents.length === 0 ? (
                  <option value="">No Students</option>
                ) : (
                  filteredStudents.map((s, idx) => (
                    <option key={s.id} value={s.id} className="bg-emerald-950 text-white font-bold">
                      {idx + 1}. {s.studentName} ({s.satsNo ? `SATS: ${s.satsNo}` : `Cl: ${s.classStandard}`})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Prev / Next buttons */}
            <div className="flex items-center gap-1 bg-emerald-900 p-1 rounded-xl border border-emerald-700">
              <button
                type="button"
                disabled={currentIdx <= 0}
                onClick={handlePrev}
                className="p-1.5 rounded-lg text-white disabled:opacity-30 hover:bg-emerald-800 cursor-pointer"
                title="Previous Student"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs sm:text-sm font-mono font-black px-2.5 text-white">
                {filteredStudents.length > 0 ? currentIdx + 1 : 0} / {filteredStudents.length}
              </span>
              <button
                type="button"
                disabled={currentIdx >= filteredStudents.length - 1}
                onClick={handleNext}
                className="p-1.5 rounded-lg text-white disabled:opacity-30 hover:bg-emerald-800 cursor-pointer"
                title="Next Student"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={async () => {
                if (!currentStudent || !result) return;
                const summary = `*ಪ್ರಗತಿ ಪತ್ರ (Student Progress Card)*\n🏫 ಶಾಲೆ: ${schoolRecord?.schoolName || 'Govt School'}\n👤 ವಿದ್ಯಾರ್ಥಿ: ${currentStudent.studentName}\n🆔 SATS: ${currentStudent.satsNo}\n📚 ತರಗತಿ: ${currentStudent.classStandard}ನೇ ತರಗತಿ\n🏅 ಸಮಗ್ರ ಗ್ರೇಡ್: ${result.overallGrade} | ಫಲಿತಾಂಶ: ${result.resultStatus}`;
                await shareReportToWhatsApp(printableRef.current, summary, `ProgressCard_${currentStudent.studentName}`);
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
              title="Share Progress Card photo to WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm sm:text-base font-black flex items-center gap-2 shadow-md transition cursor-pointer"
              title="Print Progress Card or Export to PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export to PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-900 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Printable Grade Progress Card Container */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 print:p-4 text-slate-900 bg-white">
          {!currentStudent || !result ? (
            <div className="p-12 text-center text-slate-500 text-xs sm:text-sm font-bold">No students available.</div>
          ) : (
            <div
              ref={printableRef}
              className="border-4 border-double border-emerald-900 p-6 rounded-2xl relative space-y-5 print:border-2 bg-white"
            >
              {/* Mandatory Official Heading */}
              <div className="text-center space-y-1.5 border-b-2 border-emerald-900 pb-4">
                <div className="text-sm sm:text-base font-black text-emerald-950 uppercase tracking-wide">
                  ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಸಾರ್ವಜನಿಕ ಶಿಕ್ಷಣ ಇಲಾಖೆ
                </div>
                {isKannada && (
                  <div className="text-lg sm:text-xl font-black text-slate-950 underline underline-offset-4">
                    ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ {talukName}
                  </div>
                )}
                <div className="text-base sm:text-lg font-black text-emerald-950 mt-1">
                  {schoolRecord?.schoolName}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-mono font-bold text-slate-700">
                  <span>DISE: {schoolRecord?.diseCode}</span>
                  <span>•</span>
                  <span>Medium: {schoolRecord?.schoolMedium || 'Kannada'}</span>
                  <span>•</span>
                  <span>Academic Year: 2025-26</span>
                </div>
                <div className="inline-block px-5 py-1.5 bg-emerald-900 text-white font-black text-xs sm:text-sm rounded-full uppercase tracking-wider mt-1 shadow-xs">
                  ವಿದ್ಯಾರ್ಥಿ ಪ್ರಗತಿ ಪತ್ರ - ಕೇವಲ ಗ್ರೇಡ್‌ಗಳು (Progress Card - Grade Based Only)
                </div>
              </div>

              {/* Student Biodata and Photo Grid */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs flex-1 w-full">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು
                    </span>
                    <div className="font-extrabold text-slate-900 text-sm inline-flex items-center whitespace-nowrap">
                      <span>{currentStudent.studentName}</span>
                      <CwsnBadge status={currentStudent.cwsnStatus} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      ತರಗತಿ & ವಿಭಾಗ
                    </span>
                    <span className="font-bold text-emerald-900 text-sm">
                      Class {currentStudent.classStandard} - {currentStudent.division}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      SATS ಸಂಖ್ಯೆ
                    </span>
                    <span className="font-mono font-extrabold text-slate-900">
                      {currentStudent.satsNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      PEN ಸಂಖ್ಯೆ
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {currentStudent.penNo}
                    </span>
                  </div>
                </div>

                {/* Designated Student Photo Box */}
                <div className="w-20 h-24 sm:w-22 sm:h-26 shrink-0 border-2 border-emerald-300 rounded-lg overflow-hidden bg-emerald-50/80 flex flex-col items-center justify-center p-1 relative shadow-inner">
                  {currentStudent.photoUrl ? (
                    <img
                      src={currentStudent.photoUrl}
                      alt={currentStudent.studentName}
                      className="w-full h-full object-cover rounded"
                      crossOrigin="anonymous"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full flex flex-col items-center justify-center text-emerald-400 ${
                      currentStudent.photoUrl ? 'hidden' : 'flex'
                    }`}
                  >
                    <User className="w-8 h-8 stroke-1 text-emerald-400" />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-600 mt-1">Photo</span>
                  </div>
                </div>
              </div>

              {/* SCHOLASTIC SUBJECT GRADES TABLE (ONLY WITH GRADES) */}
              <div>
                <h4 className="font-bold text-xs text-slate-800 mb-2 uppercase tracking-wider">
                  1. ಪಠ್ಯ ವಿಷಯಗಳ ಗ್ರೇಡ್ ವಿವರ (Scholastic Subject Grades - Grade Only)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse border border-slate-400 text-xs">
                    <thead className="bg-slate-100 font-extrabold text-slate-900">
                      <tr className="border-b border-slate-400">
                        <th className="border-r border-slate-400 p-2 text-left">ವಿಷಯಗಳು (Subjects)</th>
                        <th className="border-r border-slate-400 p-1">FA-1</th>
                        <th className="border-r border-slate-400 p-1">FA-2</th>
                        <th className="border-r border-slate-400 p-1 bg-amber-50">SA-1</th>
                        <th className="border-r border-slate-400 p-1">FA-3</th>
                        <th className="border-r border-slate-400 p-1">FA-4</th>
                        <th className="border-r border-slate-400 p-1 bg-blue-50">SA-2</th>
                        <th className="p-1 bg-emerald-100 font-black">ಅಂತಿಮ ಗ್ರೇಡ್ (Final Grade)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-mono font-black text-xs">
                      {result.subjects.map((sub) => {
                        const isPrimary = Number(currentStudent.classStandard) <= 5;
                        const faMax = isPrimary ? 15 : 10;
                        const saMax = isPrimary ? 20 : 30;

                        return (
                          <tr key={sub.code} className="hover:bg-slate-50">
                            <td className="p-2 text-left font-sans font-bold text-slate-900 border-r border-slate-300">
                              {sub.kannadaName} ({sub.subjectName})
                            </td>
                            <td className="p-1.5 border-r border-slate-300">
                              {getSubGrade(sub.fa1, faMax)}
                            </td>
                            <td className="p-1.5 border-r border-slate-300">
                              {getSubGrade(sub.fa2, faMax)}
                            </td>
                            <td className="p-1.5 border-r border-slate-300 bg-amber-50/50">
                              {getSubGrade(sub.sa1, saMax)}
                            </td>
                            <td className="p-1.5 border-r border-slate-300">
                              {getSubGrade(sub.fa3, faMax)}
                            </td>
                            <td className="p-1.5 border-r border-slate-300">
                              {getSubGrade(sub.fa4, faMax)}
                            </td>
                            <td className="p-1.5 border-r border-slate-300 bg-blue-50/50">
                              {getSubGrade(sub.sa2, saMax)}
                            </td>
                            <td className="p-1.5 bg-emerald-100/60 text-emerald-900 text-sm">
                              {sub.grade}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                      <tr>
                        <td colSpan={7} className="p-2 text-right font-black border-r border-slate-400">
                          ಒಟ್ಟಾರೆ ವಾರ್ಷಿಕ ಗ್ರೇಡ್ (Annual Cumulative Grade):
                        </td>
                        <td className="p-2 font-black text-base text-emerald-950 font-mono bg-emerald-200">
                          {result.overallGrade}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* CO-SCHOLASTIC (ಸಹ-ಪಠ್ಯ ಚಟುವಟಿಕೆಗಳು) GRADES */}
              <div>
                <h4 className="font-bold text-xs text-slate-800 mb-2 uppercase tracking-wider">
                  2. ಸಹಪಠ್ಯ ಮತ್ತು ವ್ಯಕ್ತಿತ್ವ ವಿಕಸನ ಚಟುವಟಿಕೆಗಳ ಗ್ರೇಡ್ ವಿವರ (Co-Scholastic Grades)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <span>ದೈಹಿಕ ಮತ್ತು ಆರೋಗ್ಯ ಶಿಕ್ಷಣ</span>
                    <span className="font-black font-mono text-emerald-800">A</span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <span>ಚಿತ್ರಕಲೆ ಮತ್ತು ಕಲಾ ಶಿಕ್ಷಣ</span>
                    <span className="font-black font-mono text-emerald-800">B</span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <span>ಕಾರ್ಯಾನುಭವ ಶಿಕ್ಷಣ</span>
                    <span className="font-black font-mono text-emerald-800">A</span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <span>ನೈತಿಕ ಮತ್ತು ಮೌಲ್ಯ ಶಿಕ್ಷಣ</span>
                    <span className="font-black font-mono text-emerald-800">A</span>
                  </div>
                </div>
              </div>

              {/* Result Summary & Status */}
              <div className="flex flex-wrap items-center justify-between p-3.5 bg-emerald-50/60 border border-emerald-300 rounded-xl text-xs gap-3">
                <div>
                  <span className="text-slate-500 block text-[10px]">ಒಟ್ಟಾರೆ ವಾರ್ಷಿಕ ಗ್ರೇಡ್</span>
                  <span className="font-black text-emerald-900 text-lg font-mono">
                    {result.overallGrade}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ಫಲಿತಾಂಶ ಸ್ಥಿತಿ</span>
                  <span className="px-3 py-1 rounded-full font-black text-xs bg-emerald-200 text-emerald-950 border border-emerald-400 inline-block">
                    ಮುಂದಿನ ತರಗತಿಗೆ ಉತ್ತೀರ್ಣ (PROMOTED)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ಹಾಜರಾತಿ ದಿನಗಳು</span>
                  <span className="font-bold text-slate-800 font-mono">216 / 224 ದಿನಗಳು</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-3 text-center text-xs font-bold text-slate-800">
                <div>
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-1">ವರ್ಗ ಶಿಕ್ಷಕರ ಸಹಿ</div>
                </div>
                <div>
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-1">ಪಾಲಕರ ಸಹಿ</div>
                </div>
                <div>
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-1">
                    ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಸಹಿ & ಮೊಹರು
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Interactive Print & PDF Preview Modal */}
    {showPreviewModal && currentStudent && result && (
      <ReportPrintPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="ಪ್ರಗತಿ ಪತ್ರ - Progress Card"
        subtitle={`${studentNameClean} • Class ${currentStudent.classStandard} • SATS: ${currentStudent.satsNo}`}
        filename={progressPdfFilename}
      >
        <div className="border-4 border-double border-emerald-900 p-6 rounded-2xl relative space-y-5 bg-white text-xs text-slate-900">
          <div className="text-center space-y-1.5 border-b-2 border-emerald-900 pb-4">
            <div className="text-sm sm:text-base font-black text-emerald-950 uppercase tracking-wide">
              ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಸಾರ್ವಜನಿಕ ಶಿಕ್ಷಣ ಇಲಾಖೆ
            </div>
            {isKannada && (
              <div className="text-lg sm:text-xl font-black text-slate-950 underline underline-offset-4">
                ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ {talukName}
              </div>
            )}
            <div className="text-base sm:text-lg font-black text-emerald-950 mt-1">
              {schoolRecord?.schoolName}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono font-bold text-slate-700">
              <span>DISE: {schoolRecord?.diseCode}</span>
              <span>•</span>
              <span>Medium: {schoolRecord?.schoolMedium || 'Kannada'}</span>
              <span>•</span>
              <span>Academic Year: 2025-26</span>
            </div>
            <div className="inline-block px-5 py-1.5 bg-emerald-900 text-white font-black text-xs sm:text-sm rounded-full uppercase tracking-wider mt-1 shadow-xs">
              ವಿದ್ಯಾರ್ಥಿ ಪ್ರಗತಿ ಪತ್ರ - ಕೇವಲ ಗ್ರೇಡ್‌ಗಳು (Progress Card - Grade Based Only)
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು</span>
              <div className="font-extrabold text-slate-900 text-sm inline-flex items-center whitespace-nowrap">
                <span>{currentStudent.studentName}</span>
                <CwsnBadge status={currentStudent.cwsnStatus} />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">ತರಗತಿ ಮತ್ತು ವಿಭಾಗ</span>
              <span className="font-bold text-emerald-900 text-sm">Class {currentStudent.classStandard} - '{currentStudent.division}'</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">SATS ಸಂಖ್ಯೆ</span>
              <span className="font-mono font-extrabold text-slate-900">{currentStudent.satsNo}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">ರಾಷ್ಟ್ರೀಯ PEN ಸಂಖ್ಯೆ</span>
              <span className="font-mono font-bold text-slate-800">{currentStudent.penNo}</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-xs text-slate-800 mb-2 uppercase tracking-wider">
              1. ಪಠ್ಯ ವಿಷಯಗಳ ಗ್ರೇಡ್ ವಿವರ (Scholastic Grades)
            </h4>
            <table className="w-full text-center border-collapse border border-slate-400 text-xs">
              <thead className="bg-slate-100 font-extrabold text-slate-900">
                <tr className="border-b border-slate-400">
                  <th className="border-r border-slate-400 p-2 text-left">ವಿಷಯಗಳು (Subjects)</th>
                  <th className="border-r border-slate-400 p-1">FA-1</th>
                  <th className="border-r border-slate-400 p-1">FA-2</th>
                  <th className="border-r border-slate-400 p-1 bg-amber-50">SA-1</th>
                  <th className="border-r border-slate-400 p-1">FA-3</th>
                  <th className="border-r border-slate-400 p-1">FA-4</th>
                  <th className="border-r border-slate-400 p-1 bg-blue-50">SA-2</th>
                  <th className="p-1 bg-emerald-100 font-black">ಅಂತಿಮ ಗ್ರೇಡ್</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-mono font-black text-xs">
                {result.subjects.map((sub) => {
                  const isPrimary = Number(currentStudent.classStandard) <= 5;
                  const faMax = isPrimary ? 15 : 10;
                  const saMax = isPrimary ? 20 : 30;
                  return (
                    <tr key={sub.code} className="hover:bg-slate-50">
                      <td className="p-2 text-left font-sans font-bold text-slate-900 border-r border-slate-300">
                        {sub.kannadaName} ({sub.subjectName})
                      </td>
                      <td className="p-1.5 border-r border-slate-300">{getSubGrade(sub.fa1, faMax)}</td>
                      <td className="p-1.5 border-r border-slate-300">{getSubGrade(sub.fa2, faMax)}</td>
                      <td className="p-1.5 border-r border-slate-300 bg-amber-50/50">{getSubGrade(sub.sa1, saMax)}</td>
                      <td className="p-1.5 border-r border-slate-300">{getSubGrade(sub.fa3, faMax)}</td>
                      <td className="p-1.5 border-r border-slate-300">{getSubGrade(sub.fa4, faMax)}</td>
                      <td className="p-1.5 border-r border-slate-300 bg-blue-50/50">{getSubGrade(sub.sa2, saMax)}</td>
                      <td className="p-1.5 bg-emerald-100/60 text-emerald-900 text-sm">{sub.grade}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                <tr>
                  <td colSpan={7} className="p-2 text-right font-black border-r border-slate-400">
                    ವಾರ್ಷಿಕ ಒಟ್ಟಾರೆ ಗ್ರೇಡ್ (ANNUAL OVERALL GRADE):
                  </td>
                  <td className="p-2 font-black text-base text-emerald-950 font-mono bg-emerald-200">
                    {result.overallGrade}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div>
            <h4 className="font-bold text-xs text-slate-800 mb-2 uppercase tracking-wider">
              2. ಸಹಪಠ್ಯ ಮತ್ತು ವ್ಯಕ್ತಿತ್ವ ವಿಕಸನ ಚಟುವಟಿಕೆಗಳ ಗ್ರೇಡ್ ವಿವರ (Co-Scholastic Grades)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-700">ದೈಹಿಕ ಶಿಕ್ಷಣ</span>
                <span className="font-black font-mono text-emerald-800">A</span>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-700">ಚಿತ್ರಕಲೆ / ಕಲೆ</span>
                <span className="font-black font-mono text-emerald-800">B</span>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-700">ಕಾರ್ಯಾನುಭವ</span>
                <span className="font-black font-mono text-emerald-800">A</span>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-700">ನೈತಿಕ ಶಿಕ್ಷಣ</span>
                <span className="font-black font-mono text-emerald-800">A</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between p-3.5 bg-emerald-50/60 border border-emerald-300 rounded-xl text-xs gap-3">
            <div>
              <span className="text-slate-500 block text-[10px]">ಒಟ್ಟಾರೆ ವಾರ್ಷಿಕ ಗ್ರೇಡ್</span>
              <span className="font-black text-emerald-900 text-lg font-mono">{result.overallGrade}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ಫಲಿತಾಂಶ ಸ್ಥಿತಿ</span>
              <span className="px-3 py-1 rounded-full font-black text-xs bg-emerald-200 text-emerald-950 border border-emerald-400 inline-block">
                ಮುಂದಿನ ತರಗತಿಗೆ ಉತ್ತೀರ್ಣ (PROMOTED)
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ಹಾಜರಾತಿ ದಿನಗಳು</span>
              <span className="font-bold text-slate-800 font-mono">216 / 224 ದಿನಗಳು</span>
            </div>
          </div>

          <div className="pt-8 grid grid-cols-3 text-center text-xs font-bold text-slate-800">
            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1">ವರ್ಗ ಶಿಕ್ಷಕರ ಸಹಿ</div>
            </div>
            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1">ಪಾಲಕರ ಸಹಿ</div>
            </div>
            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1">ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಸಹಿ & ಮೊಹರು</div>
            </div>
          </div>
        </div>
      </ReportPrintPreviewModal>
    )}
  </>
  );
};
