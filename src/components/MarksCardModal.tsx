import React, { useState, useMemo, useRef } from 'react';
import { Student, SchoolRecord } from '../types';
import { getRealMarksFromLocal, getStudentCalculatedResult } from '../utils/marksStore';
import { getClassesFromRange } from '../utils/studentStore';
import { ReportPrintPreviewModal } from './ReportPrintPreviewModal';
import { shareReportToWhatsApp } from '../utils/printPdfHelper';
import { CwsnBadge } from './CwsnBadge';
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  Award,
  BookOpen,
  User,
  Hash,
  School,
  CheckCircle2,
  Share2,
} from 'lucide-react';

interface MarksCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolRecord: SchoolRecord | null;
}

export const MarksCardModal: React.FC<MarksCardModalProps> = ({
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
  const marksPdfFilename = `MarksCard_${studentNameClean}_Class_${currentStudent?.classStandard || 'Std'}.pdf`;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print-modal-card">
        {/* Navigation Bar (Hidden in Print) */}
        <div className="bg-slate-900 text-white p-4 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-sm sm:text-base">
              ಅಂಕಪಟ್ಟಿ - Marks Card (With Marks & Grades)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Class filter dropdown */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs sm:text-sm font-black text-amber-300 whitespace-nowrap">
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
                className="px-3 py-2 text-xs sm:text-sm font-black bg-slate-800 border-2 border-slate-700 rounded-xl text-white cursor-pointer hover:border-slate-500"
              >
                <option value="ALL" className="bg-slate-900 text-white font-bold">
                  All Classes (ಎಲ್ಲಾ ತರಗತಿ)
                </option>
                {availableClasses.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white font-bold">
                    Class {c} ({c} ನೇ ತರಗತಿ)
                  </option>
                ))}
              </select>
            </div>

            {/* Student Dropdown List for respective class */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs sm:text-sm font-black text-blue-300 whitespace-nowrap">
                ವಿದ್ಯಾರ್ಥಿ / Student:
              </label>
              <select
                value={currentStudent?.id || ''}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={filteredStudents.length === 0}
                className="px-3 py-2 text-xs sm:text-sm font-black bg-slate-800 border-2 border-slate-700 rounded-xl text-white cursor-pointer hover:border-slate-500 max-w-xs sm:max-w-sm truncate"
              >
                {filteredStudents.length === 0 ? (
                  <option value="">No Students</option>
                ) : (
                  filteredStudents.map((s, idx) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white font-bold">
                      {idx + 1}. {s.studentName} ({s.satsNo ? `SATS: ${s.satsNo}` : `Cl: ${s.classStandard}`})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Prev / Next buttons */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                disabled={currentIdx <= 0}
                onClick={handlePrev}
                className="p-1.5 rounded-lg text-white disabled:opacity-30 hover:bg-slate-700 cursor-pointer"
                title="Previous Student"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs sm:text-sm font-mono font-black px-2 text-white">
                {filteredStudents.length > 0 ? currentIdx + 1 : 0} / {filteredStudents.length}
              </span>
              <button
                type="button"
                disabled={currentIdx >= filteredStudents.length - 1}
                onClick={handleNext}
                className="p-1.5 rounded-lg text-white disabled:opacity-30 hover:bg-slate-700 cursor-pointer"
                title="Next Student"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={async () => {
                if (!currentStudent || !result) return;
                const summary = `*ವಾರ್ಷಿಕ ಅಂಕಪಟ್ಟಿ (Annual Marks Card)*\n🏫 ಶಾಲೆ: ${schoolRecord?.schoolName || 'Govt School'}\n👤 ವಿದ್ಯಾರ್ಥಿ: ${currentStudent.studentName}\n🆔 SATS: ${currentStudent.satsNo}\n📚 ತರಗತಿ: ${currentStudent.classStandard}ನೇ ತರಗತಿ\n📊 ಒಟ್ಟು ಅಂಕ: ${result.totalMarks} / ${result.maxTotalMarks} (${result.percentage}%)\n🏅 ಗ್ರೇಡ್: ${result.overallGrade} | ಫಲಿತಾಂಶ: ${result.resultStatus}`;
                await shareReportToWhatsApp(printableRef.current, summary, `MarksCard_${currentStudent.studentName}`);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
              title="Share Marks Card photo to WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm sm:text-base font-black flex items-center gap-2 shadow-md transition cursor-pointer"
              title="Print Marks Card or Export to PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export to PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Printable Marks Card Container */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 print:p-4 text-slate-900 bg-white">
          {!currentStudent || !result ? (
            <div className="p-12 text-center text-slate-500 text-xs">No students available.</div>
          ) : (
            <div
              ref={printableRef}
              className="border-4 border-double border-blue-900 p-6 rounded-2xl relative space-y-5 print:border-2 bg-white"
            >
              {/* Mandatory Official Heading Requested */}
              <div className="text-center space-y-1.5 border-b-2 border-blue-900 pb-4">
                <div className="text-sm sm:text-base font-black text-blue-950 uppercase tracking-wide">
                  ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಸಾರ್ವಜನಿಕ ಶಿಕ್ಷಣ ಇಲಾಖೆ
                </div>
                {isKannada && (
                  <div className="text-lg sm:text-xl font-black text-slate-950 underline underline-offset-4">
                    ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ {talukName}
                  </div>
                )}
                <div className="text-base sm:text-lg font-black text-blue-950 mt-1">
                  {schoolRecord?.schoolName}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-mono font-bold text-slate-700">
                  <span>DISE: {schoolRecord?.diseCode}</span>
                  <span>•</span>
                  <span>Medium: {schoolRecord?.schoolMedium || 'Kannada'}</span>
                  <span>•</span>
                  <span>Academic Year: 2025-26</span>
                </div>
                <div className="inline-block px-5 py-1.5 bg-blue-950 text-white font-black text-xs sm:text-sm rounded-full uppercase tracking-wider mt-1 shadow-xs">
                  ವಿದ್ಯಾರ್ಥಿ ವಾರ್ಷಿಕ ಪ್ರಗತಿ ಅಂಕಪಟ್ಟಿ (Cumulative CCE Marks Card)
                </div>
              </div>

              {/* Student Biodata and Photo Grid */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs flex-1 w-full">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು (Student Name)
                    </span>
                    <div className="font-extrabold text-slate-900 text-sm inline-flex items-center whitespace-nowrap">
                      <span>{currentStudent.studentName}</span>
                      <CwsnBadge status={currentStudent.cwsnStatus} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      ತರಗತಿ ಮತ್ತು ವಿಭಾಗ (Class & Sec)
                    </span>
                    <span className="font-bold text-blue-900 text-sm">
                      Class {currentStudent.classStandard} - {currentStudent.division}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      SATS ಸಂಖ್ಯೆ (SATS No)
                    </span>
                    <span className="font-mono font-extrabold text-slate-900">
                      {currentStudent.satsNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      PEN ಸಂಖ್ಯೆ (PEN No)
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {currentStudent.penNo}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      ತಂದೆಯ ಹೆಸರು (Father Name)
                    </span>
                    <span className="font-semibold text-slate-800">{currentStudent.fatherName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      ತಾಯಿಯ ಹೆಸರು (Mother Name)
                    </span>
                    <span className="font-semibold text-slate-800">{currentStudent.motherName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      ಜಾತಿ / ಪ್ರವರ್ಗ (Caste/Category)
                    </span>
                    <span className="font-bold text-slate-800">{currentStudent.caste}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      ದಾಖಲಾತಿ ಸಂಖ್ಯೆ (Reg No)
                    </span>
                    <span className="font-mono text-slate-700">
                      {currentStudent.schoolRegNo || '-'}
                    </span>
                  </div>
                </div>

                {/* Designated Student Photo Box */}
                <div className="w-24 h-28 sm:w-24 sm:h-30 shrink-0 border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-100 flex flex-col items-center justify-center p-1 relative shadow-inner">
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
                    className={`w-full h-full flex flex-col items-center justify-center text-slate-400 ${
                      currentStudent.photoUrl ? 'hidden' : 'flex'
                    }`}
                  >
                    <User className="w-8 h-8 stroke-1 text-slate-400" />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500 mt-1">Photo</span>
                  </div>
                </div>
              </div>

              {/* Subject-Wise CCE Marks Matrix (WITH BOTH MARKS AND GRADES) */}
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse border border-slate-400 text-xs">
                  <thead className="bg-slate-100 font-extrabold text-slate-900">
                    <tr className="border-b border-slate-400">
                      <th rowSpan={2} className="border-r border-slate-400 p-2 text-left">
                        ವಿಷಯಗಳು (Subjects)
                      </th>
                      <th colSpan={3} className="border-r border-slate-400 p-1 bg-amber-50">
                        Term 1 (ಸೆಮಿಸ್ಟರ್ 1)
                      </th>
                      <th colSpan={3} className="border-r border-slate-400 p-1 bg-blue-50">
                        Term 2 (ಸೆಮಿಸ್ಟರ್ 2)
                      </th>
                      <th rowSpan={2} className="border-r border-slate-400 p-1">
                        ಗರಿಷ್ಠ ಅಂಕ (Max)
                      </th>
                      <th rowSpan={2} className="border-r border-slate-400 p-1 bg-emerald-50">
                        ಗಳಿಸಿದ ಅಂಕ (Total)
                      </th>
                      <th rowSpan={2} className="p-1 bg-emerald-100 font-black">
                        ಗ್ರೇಡ್ (Grade)
                      </th>
                    </tr>
                    <tr className="border-b border-slate-400 text-[10px]">
                      <th className="border-r border-slate-400 p-1">FA-1</th>
                      <th className="border-r border-slate-400 p-1">FA-2</th>
                      <th className="border-r border-slate-400 p-1 bg-amber-100 font-black">
                        SA-1
                      </th>
                      <th className="border-r border-slate-400 p-1">FA-3</th>
                      <th className="border-r border-slate-400 p-1">FA-4</th>
                      <th className="border-r border-slate-400 p-1 bg-blue-100 font-black">
                        SA-2
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {result.subjects.map((sub) => (
                      <tr key={sub.code} className="hover:bg-slate-50 font-mono text-[11px]">
                        <td className="p-2 text-left font-sans font-bold text-slate-900 border-r border-slate-300">
                          {sub.kannadaName} ({sub.subjectName})
                        </td>
                        <td className="p-1 border-r border-slate-300">{sub.fa1 ?? '-'}</td>
                        <td className="p-1 border-r border-slate-300">{sub.fa2 ?? '-'}</td>
                        <td className="p-1 border-r border-slate-300 bg-amber-50/50 font-bold">
                          {sub.sa1 ?? '-'}
                        </td>
                        <td className="p-1 border-r border-slate-300">{sub.fa3 ?? '-'}</td>
                        <td className="p-1 border-r border-slate-300">{sub.fa4 ?? '-'}</td>
                        <td className="p-1 border-r border-slate-300 bg-blue-50/50 font-bold">
                          {sub.sa2 ?? '-'}
                        </td>
                        <td className="p-1 border-r border-slate-300 text-slate-600">
                          {sub.maxMarks}
                        </td>
                        <td className="p-1 border-r border-slate-300 font-black text-slate-900 bg-emerald-50/50">
                          {sub.total}
                        </td>
                        <td className="p-1 font-black text-emerald-800 bg-emerald-100/50">
                          {sub.grade}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <tr>
                      <td className="p-2 text-left font-black border-r border-slate-400">
                        ಒಟ್ಟು ಫಲಿತಾಂಶ (Grand Total):
                      </td>
                      <td colSpan={6} className="border-r border-slate-400 text-slate-400 italic">
                        -
                      </td>
                      <td className="p-1 border-r border-slate-400 font-mono">
                        {result.maxTotalMarks}
                      </td>
                      <td className="p-1 border-r border-slate-400 font-black text-sm font-mono text-blue-950">
                        {result.totalMarks}
                      </td>
                      <td className="p-1 font-black text-base font-mono text-emerald-900">
                        {result.overallGrade}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Result Summary & Status */}
              <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs gap-3">
                <div>
                  <span className="text-slate-500 block text-[10px]">ಶೇಕಡಾವಾರು (Percentage)</span>
                  <span className="font-extrabold text-slate-900 text-base font-mono">
                    {result.percentage}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ಒಟ್ಟಾರೆ ಗ್ರೇಡ್ (Grade)</span>
                  <span className="font-black text-emerald-800 text-base font-mono">
                    {result.overallGrade}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ಫಲಿತಾಂಶ (Result Status)</span>
                  <span className="px-3 py-1 rounded-full font-black text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 inline-block">
                    {result.resultStatus === 'PROMOTED'
                      ? 'ಉತ್ತೀರ್ಣ (PROMOTED)'
                      : result.resultStatus}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ಹಾಜರಾತಿ (Attendance)</span>
                  <span className="font-bold text-slate-800 font-mono">214 / 224 Days</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-3 text-center text-xs font-bold text-slate-800">
                <div>
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-1">ವರ್ಗ ಶಿಕ್ಷಕರ ಸಹಿ (Class Teacher)</div>
                </div>
                <div>
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-1">ಪಾಲಕರ ಸಹಿ (Parent's Signature)</div>
                </div>
                <div>
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-1">
                    ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಸಹಿ & ಮೊಹರು (Headmaster & Seal)
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
        title="ಅಂಕಪಟ್ಟಿ - Marks Card"
        subtitle={`${studentNameClean} • Class ${currentStudent.classStandard} • SATS: ${currentStudent.satsNo}`}
        filename={marksPdfFilename}
      >
        <div className="border-4 border-double border-blue-900 p-6 rounded-2xl relative space-y-5 bg-white text-xs">
          <div className="text-center space-y-1.5 border-b-2 border-blue-900 pb-4">
            <div className="text-sm sm:text-base font-black text-blue-950 uppercase tracking-wide">
              ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಸಾರ್ವಜನಿಕ ಶಿಕ್ಷಣ ಇಲಾಖೆ
            </div>
            {isKannada && (
              <div className="text-lg sm:text-xl font-black text-slate-950 underline underline-offset-4">
                ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ {talukName}
              </div>
            )}
            <div className="text-base sm:text-lg font-black text-blue-950 mt-1">
              {schoolRecord?.schoolName}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono font-bold text-slate-700">
              <span>DISE: {schoolRecord?.diseCode}</span>
              <span>•</span>
              <span>Medium: {schoolRecord?.schoolMedium || 'Kannada'}</span>
              <span>•</span>
              <span>Academic Year: 2025-26</span>
            </div>
            <div className="inline-block px-5 py-1.5 bg-blue-950 text-white font-black text-xs sm:text-sm rounded-full uppercase tracking-wider mt-1 shadow-xs">
              ವಿದ್ಯಾರ್ಥಿ ವಾರ್ಷಿಕ ಪ್ರಗತಿ ಅಂಕಪಟ್ಟಿ (Cumulative CCE Marks Card)
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು (Student Name)
              </span>
              <div className="font-extrabold text-slate-900 text-sm inline-flex items-center whitespace-nowrap">
                <span>{currentStudent.studentName}</span>
                <CwsnBadge status={currentStudent.cwsnStatus} />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                ತರಗತಿ ಮತ್ತು ವಿಭಾಗ (Class & Sec)
              </span>
              <span className="font-bold text-blue-900 text-sm">
                Class {currentStudent.classStandard} - '{currentStudent.division}'
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                SATS ಸಂಖ್ಯೆ (SATS No)
              </span>
              <span className="font-mono font-extrabold text-slate-900">
                {currentStudent.satsNo}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                ರಾಷ್ಟ್ರೀಯ PEN ಸಂಖ್ಯೆ (PEN)
              </span>
              <span className="font-mono font-bold text-slate-800">
                {currentStudent.penNo}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                ತಂದೆಯ ಹೆಸರು (Father's Name)
              </span>
              <span className="font-semibold text-slate-800">{currentStudent.fatherName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                ತಾಯಿಯ ಹೆಸರು (Mother's Name)
              </span>
              <span className="font-semibold text-slate-800">{currentStudent.motherName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                ಪ್ರವರ್ಗ (Caste / Category)
              </span>
              <span className="font-bold text-slate-800">{currentStudent.caste}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                ದಾಖಲಾತಿ ಸಂಖ್ಯೆ (Reg No)
              </span>
              <span className="font-mono text-slate-700">
                {currentStudent.schoolRegNo || `ADM-${currentStudent.satsNo.slice(-4)}`}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse border border-slate-400 text-xs">
              <thead className="bg-slate-100 font-extrabold text-slate-900">
                <tr className="border-b border-slate-400">
                  <th rowSpan={2} className="border-r border-slate-400 p-2 text-left">
                    ವಿಷಯಗಳು (Subjects)
                  </th>
                  <th colSpan={3} className="border-r border-slate-400 p-1 bg-amber-50">
                    Term 1
                  </th>
                  <th colSpan={3} className="border-r border-slate-400 p-1 bg-blue-50">
                    Term 2
                  </th>
                  <th rowSpan={2} className="border-r border-slate-400 p-1">
                    FA ಒಟ್ಟು (200)
                  </th>
                  <th rowSpan={2} className="border-r border-slate-400 p-1 bg-emerald-50">
                    ಒಟ್ಟು ಅಂಕ (Total 300)
                  </th>
                  <th rowSpan={2} className="p-1 bg-emerald-100 font-black">
                    ಗ್ರೇಡ್
                  </th>
                </tr>
                <tr className="border-b border-slate-400 text-[10px]">
                  <th className="border-r border-slate-400 p-1">FA-1</th>
                  <th className="border-r border-slate-400 p-1">FA-2</th>
                  <th className="border-r border-slate-400 p-1 bg-amber-100 font-black">SA-1</th>
                  <th className="border-r border-slate-400 p-1">FA-3</th>
                  <th className="border-r border-slate-400 p-1">FA-4</th>
                  <th className="border-r border-slate-400 p-1 bg-blue-100 font-black">SA-2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {result.subjects.map((sub) => (
                  <tr key={sub.code} className="hover:bg-slate-50 font-mono text-[11px]">
                    <td className="p-2 text-left font-sans font-bold text-slate-900 border-r border-slate-300">
                      {sub.kannadaName} ({sub.subjectName})
                    </td>
                    <td className="p-1 border-r border-slate-300">{sub.fa1 ?? '-'}</td>
                    <td className="p-1 border-r border-slate-300">{sub.fa2 ?? '-'}</td>
                    <td className="p-1 border-r border-slate-300 bg-amber-50/50 font-bold">
                      {sub.sa1 ?? '-'}
                    </td>
                    <td className="p-1 border-r border-slate-300">{sub.fa3 ?? '-'}</td>
                    <td className="p-1 border-r border-slate-300">{sub.fa4 ?? '-'}</td>
                    <td className="p-1 border-r border-slate-300 bg-blue-50/50 font-bold">
                      {sub.sa2 ?? '-'}
                    </td>
                    <td className="p-1 border-r border-slate-300 text-slate-600">{sub.maxMarks}</td>
                    <td className="p-1 border-r border-slate-300 font-black text-slate-900 bg-emerald-50/50">
                      {sub.total}
                    </td>
                    <td className="p-1 font-black text-emerald-800 bg-emerald-100/50">
                      {sub.grade}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                <tr>
                  <td className="p-2 text-left font-black border-r border-slate-400">
                    ಒಟ್ಟು ಅಂಕಗಳು (GRAND TOTAL)
                  </td>
                  <td colSpan={6} className="border-r border-slate-400 text-slate-400 italic">
                    Max: {result.maxTotalMarks} Marks
                  </td>
                  <td className="p-1 border-r border-slate-400 font-mono">{result.maxTotalMarks}</td>
                  <td className="p-1 border-r border-slate-400 font-black text-sm font-mono text-blue-950">
                    {result.totalMarks} / {result.maxTotalMarks}
                  </td>
                  <td className="p-1 font-black text-base font-mono text-emerald-900">
                    {result.overallGrade}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs gap-3">
            <div>
              <span className="text-slate-500 block text-[10px]">ಶೇಕಡಾವಾರು (Percentage)</span>
              <span className="font-extrabold text-slate-900 text-base font-mono">
                {result.percentage.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ಒಟ್ಟಾರೆ ಗ್ರೇಡ್ (Grade)</span>
              <span className="font-black text-emerald-800 text-base font-mono">
                {result.overallGrade}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ಫಲಿತಾಂಶ (Result Status)</span>
              <span className="px-3 py-1 rounded-full font-black text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 inline-block">
                {result.resultStatus === 'PROMOTED'
                  ? 'ಉತ್ತೀರ್ಣ (PROMOTED)'
                  : result.resultStatus}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ಹಾಜರಾತಿ (Attendance)</span>
              <span className="font-bold text-slate-800 font-mono">214 / 224 Days</span>
            </div>
          </div>

          <div className="pt-8 grid grid-cols-3 text-center text-xs font-bold text-slate-800">
            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1">ವರ್ಗ ಶಿಕ್ಷಕರ ಸಹಿ (Class Teacher)</div>
            </div>
            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1">ಪಾಲಕರ ಸಹಿ (Parent's Signature)</div>
            </div>
            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1">
                ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಸಹಿ & ಮೊಹರು (Headmaster & Seal)
              </div>
            </div>
          </div>
        </div>
      </ReportPrintPreviewModal>
    )}
  </>
  );
};
