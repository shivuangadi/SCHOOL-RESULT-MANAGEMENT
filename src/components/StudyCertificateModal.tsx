import React, { useState, useMemo, useRef } from 'react';
import { Student, SchoolRecord } from '../types';
import { ReportPrintPreviewModal } from './ReportPrintPreviewModal';
import { shareReportToWhatsApp } from '../utils/printPdfHelper';
import { formatDateToDmy } from '../utils/satsExcelParser';
import { getClassesFromRange } from '../utils/studentStore';
import { DatePickerField } from './DatePickerField';
import { StudentPhotoImg } from './StudentPhotoImg';
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  CheckCircle2,
  Share2,
} from 'lucide-react';

interface StudyCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolRecord: SchoolRecord | null;
  initialStudentId?: string;
}

export const StudyCertificateModal: React.FC<StudyCertificateModalProps> = ({
  isOpen,
  onClose,
  students,
  schoolRecord,
  initialStudentId,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const printableRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
      setSelectedClassFilter('ALL');
    }
  }, [initialStudentId, isOpen]);

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

  const studentNameClean = (currentStudent?.studentName || 'Student').replace(/[^a-zA-Z0-9_\u0C80-\u0CFF]/g, '_');
  const certPdfFilename = `StudyCertificate_${studentNameClean}_Class_${currentStudent?.classStandard || 'Std'}.pdf`;

  const talukName = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';

  const now = new Date();
  const todayStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const [certDate, setCertDate] = useState(todayStr);

  const certNumber = currentStudent
    ? `SC/${schoolRecord?.diseCode?.slice(-4) || '2025'}/${String(currentIdx + 1).padStart(3, '0')}`
    : 'SC/2025/001';

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print-modal-card">
        {/* Navigation Bar (Hidden in Print) */}
        <div className="bg-slate-900 text-white p-4 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-black text-sm sm:text-base">
              ಶಾಲಾ ದೃಢೀಕರಣ ಪತ್ರ - Study & Bonafide Certificate
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

            {/* Stepper Buttons */}
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
              <span className="text-xs sm:text-sm font-mono font-black px-2.5 text-white">
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
                if (!currentStudent) return;
                const summary = `*ಶಾಲಾ ವ್ಯಾಸಂಗ ದೃಢೀಕರಣ ಪತ್ರ (Study Certificate)*\n🏫 ಶಾಲೆ: ${schoolRecord?.schoolName || 'Govt School'}\n👤 ವಿದ್ಯಾರ್ಥಿ: ${currentStudent.studentName}\n🆔 SATS: ${currentStudent.satsNo}\n👨 ತಂದೆ: ${currentStudent.fatherName}\n👩 ತಾಯಿ: ${currentStudent.motherName}\n📚 ತರಗತಿ: ${currentStudent.classStandard}ನೇ ತರಗತಿ\n📅 ಶೈಕ್ಷಣಿಕ ಸಾಲು: 2025-26`;
                await shareReportToWhatsApp(printableRef.current, summary, `StudyCertificate_${currentStudent.studentName}`);
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
              title="Share Study Certificate photo to WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm sm:text-base font-black flex items-center gap-2 shadow-md transition cursor-pointer"
              title="Print Certificate or Export to PDF"
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

        {/* Printable Study Certificate Container */}
        <div className="p-8 sm:p-12 overflow-y-auto flex-1 print:p-6 text-slate-900 bg-white">
          {!currentStudent ? (
            <div className="p-12 text-center text-slate-500 text-xs sm:text-sm font-bold">No students found.</div>
          ) : (
            <div className="border-4 border-double border-emerald-950 p-8 sm:p-10 rounded-3xl relative space-y-7 print:border-2 text-xs">
              {/* Mandatory Official Heading */}
              <div className="text-center space-y-1.5 border-b-2 border-emerald-900 pb-5">
                <div className="text-sm sm:text-base font-black uppercase text-slate-800 tracking-wider">
                  ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಸಾರ್ವಜನಿಕ ಶಿಕ್ಷಣ ಇಲಾಖೆ
                </div>
                <div className="text-lg sm:text-2xl font-black text-slate-950 underline underline-offset-4">
                  ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ {talukName}
                </div>
                <div className="text-base sm:text-lg font-black text-blue-950 mt-1">
                  {schoolRecord?.schoolName}
                </div>
                <div className="text-xs sm:text-sm font-mono font-bold text-slate-700">
                  DISE: {schoolRecord?.diseCode} • ತಾಲೂಕು: {talukName} • ಮಾಧ್ಯಮ:{' '}
                  {schoolRecord?.schoolMedium || 'Kannada'}
                </div>
                <div className="inline-block px-6 py-2 bg-emerald-900 text-white font-black text-xs sm:text-sm rounded-full uppercase tracking-widest mt-2 shadow-xs">
                  ಶಾಲಾ ವ್ಯಾಸಂಗ ದೃಢೀಕರಣ ಪತ್ರ / STUDY CERTIFICATE
                </div>
              </div>

              {/* Certificate Reference Metadata & Student Passport Photo */}
              <div className="flex justify-between items-start text-xs font-bold border-b border-slate-200 pb-2">
                <div className="space-y-1 pt-1">
                  <div>
                    ದಾಖಲೆ ಸಂಖ್ಯೆ (Ref No):{' '}
                    <span className="font-mono text-emerald-900 font-bold">{certNumber}</span>
                  </div>
                  <div>
                    ದಿನಾಂಕ (Date): <span className="font-mono">{todayStr}</span>
                  </div>
                </div>

                {/* Official Student Photo Box */}
                <div className="w-24 h-28 border-2 border-dashed border-slate-400 rounded-lg flex items-center justify-center overflow-hidden bg-slate-50 shrink-0">
                  <StudentPhotoImg
                    student={currentStudent}
                    className="w-full h-full object-cover"
                    fallback={
                      <div className="text-[10px] text-slate-400 text-center font-bold p-1 leading-tight">
                        ವಿದ್ಯಾರ್ಥಿಯ
                        <br />
                        ಭಾವಚಿತ್ರ
                        <br />
                        (Photo)
                      </div>
                    }
                  />
                </div>
              </div>

              {/* Certificate Formal Declaration Body */}
              <div className="space-y-4 text-sm leading-relaxed text-slate-900 pt-2 text-justify">
                <p>
                  ಈ ಮೂಲಕ ದೃಢೀಕರಿಸುವುದೇನೆಂದರೆ, ಕುಮಾರ್ / ಕುಮಾರಿ{' '}
                  <span className="font-extrabold underline text-blue-950 text-base">
                    {currentStudent.studentName}
                  </span>
                  , ತಂದೆ{' '}
                  <span className="font-extrabold underline text-slate-950">
                    {currentStudent.fatherName}
                  </span>
                  , ತಾಯಿ{' '}
                  <span className="font-extrabold underline text-slate-950">
                    {currentStudent.motherName}
                  </span>
                  , ಸ್ಯಾಟ್ಸ್ ಸಂಖ್ಯೆ (SATS No):{' '}
                  <span className="font-mono font-black text-blue-900">
                    {currentStudent.satsNo}
                  </span>
                  , PEN ಸಂಖ್ಯೆ:{' '}
                  <span className="font-mono font-bold">{currentStudent.penNo}</span>
                  , ಆಧಾರ್ ಸಂಖ್ಯೆ:{' '}
                  <span className="font-mono font-bold">
                    {currentStudent.aadharNo && currentStudent.aadharNo.length === 12
                      ? `XXXX-XXXX-${currentStudent.aadharNo.slice(-4)}`
                      : currentStudent.aadharNo}
                  </span>
                  .
                </p>

                <p>
                  ಇವರು ನಮ್ಮ ಸರ್ಕಾರಿ ಮಾನ್ಯತೆ ಪಡೆದ ಶಾಲೆಯಲ್ಲಿ{' '}
                  <span className="font-black text-emerald-900">
                    {currentStudent.classStandard} ನೇ ತರಗತಿಯಲ್ಲಿ (Class {currentStudent.classStandard} - {currentStudent.division})
                  </span>
                  ,{' '}
                  <span className="font-black text-emerald-950">
                    {schoolRecord?.schoolMedium || 'Kannada'} ಮಾಧ್ಯಮದಲ್ಲಿ
                  </span>{' '}
                  ಶೈಕ್ಷಣಿಕ ಸಾಲು 2025-26 ರಲ್ಲಿ ನಿಯಮಿತವಾಗಿ ವ್ಯಾಸಂಗ ಮಾಡುತ್ತಿದ್ದಾರೆಂದು / ಮಾಡಿದ್ದಾರೆಂದು ದೃಢೀಕರಿಸಲಾಗಿದೆ.
                </p>

                <p>
                  ಶಾಲಾ ದಾಖಲಾತಿ ಪ್ರಕಾರ ವಿದ್ಯಾರ್ಥಿಯ ಜಾತಿ / ಪ್ರವರ್ಗ:{' '}
                  <span className="font-bold underline">
                    {currentStudent.caste === 'CUSTOM'
                      ? currentStudent.customCaste
                      : currentStudent.caste}
                  </span>{' '}
                  ಮತ್ತು ಧರ್ಮ: <span className="font-bold underline">{currentStudent.religion}</span> ಆಗಿರುತ್ತದೆ.
                </p>

                <p>
                  ಶಾಲಾ ದಾಖಲಾತಿ ಪುಸ್ತಕದ ಪ್ರಕಾರ ವಿದ್ಯಾರ್ಥಿಯ ನಡತೆ ಮತ್ತು ಶೀಲವು ಶ್ಲಾಘನೀಯವಾಗಿದ್ದು,{' '}
                  <span className="font-bold text-emerald-900">ಉತ್ತಮವಾಗಿದೆ (Good)</span>.
                </p>

                <p className="text-xs text-slate-500 italic pt-2">
                  * ಈ ದೃಢೀಕರಣ ಪತ್ರವನ್ನು ವಿದ್ಯಾರ್ಥಿ/ಪಾಲಕರ ಕೋರಿಕೆ ಮೇರೆಗೆ ವಿದ್ಯಾರ್ಥಿವೇತನ (SSP/NSP), ಉನ್ನತ ವ್ಯಾಸಂಗ, ಮತ್ತು ಸರ್ಕಾರಿ ಸೌಲಭ್ಯಗಳ ಪರಿಶೀಲನೆಗಾಗಿ ನೀಡಲಾಗಿದೆ.
                </p>
              </div>

              {/* Signature Blocks */}
              <div className="pt-16 grid grid-cols-2 text-center text-xs font-bold text-slate-900">
                <div>
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-1.5 w-52 mx-auto">
                    ಸ್ಥಳ: {talukName}
                    <br />
                    <span className="hidden print:inline">ದಿನಾಂಕ: {certDate}</span>
                    <div className="print:hidden flex items-center justify-center gap-1.5 mt-1">
                      <span className="text-slate-700 font-bold">ದಿನಾಂಕ:</span>
                      <div className="w-32 inline-block">
                        <DatePickerField
                          value={certDate}
                          onChange={setCertDate}
                          placeholder="DD/MM/YYYY"
                          className="!space-y-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-1.5 w-60 mx-auto">
                    ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಸಹಿ ಮತ್ತು ಶಾಲಾ ಮೊಹರು
                    <br />
                    <span className="text-[11px] font-normal text-slate-600 block mt-0.5">
                      {schoolRecord?.schoolName}
                    </span>
                    <span className="text-xs font-black font-mono text-slate-900 block mt-0.5">
                      ಶಾಲಾ DISE ಕೋಡ್: {schoolRecord?.diseCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* BEO Countersignature box */}
              <div className="mt-8 p-3 border border-dashed border-slate-400 rounded-xl flex items-center justify-between text-[11px] text-slate-600">
                <span>ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಚೇರಿಯ ಪ್ರತಿ ಸಹಿ (BEO Countersignature if required)</span>
                <span className="font-mono">Office Seal & Signature</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Interactive Print & PDF Preview Modal */}
    {showPreviewModal && currentStudent && (
      <ReportPrintPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="ಶಾಲಾ ವ್ಯಾಸಂಗ ದೃಢೀಕರಣ ಪತ್ರ - Study Certificate"
        subtitle={`${studentNameClean} • Class ${currentStudent.classStandard} • SATS: ${currentStudent.satsNo}`}
        filename={certPdfFilename}
      >
        <div className="border-4 border-double border-emerald-950 p-8 sm:p-10 rounded-3xl relative space-y-7 bg-white text-xs text-slate-900">
          <div className="text-center space-y-1.5 border-b-2 border-emerald-900 pb-5">
            <div className="text-sm sm:text-base font-black uppercase text-slate-800 tracking-wider">
              ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಸಾರ್ವಜನಿಕ ಶಿಕ್ಷಣ ಇಲಾಖೆ
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-950 underline underline-offset-4">
              ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ {talukName}
            </div>
            <div className="text-base sm:text-lg font-black text-blue-950 mt-1">
              {schoolRecord?.schoolName}
            </div>
            <div className="text-xs sm:text-sm font-mono font-bold text-slate-700">
              DISE: {schoolRecord?.diseCode} • ತಾಲೂಕು: {talukName} • ಮಾಧ್ಯಮ:{' '}
              {schoolRecord?.schoolMedium || 'Kannada'}
            </div>
            <div className="inline-block px-6 py-2 bg-emerald-900 text-white font-black text-xs sm:text-sm rounded-full uppercase tracking-widest mt-2 shadow-xs">
              ಶಾಲಾ ವ್ಯಾಸಂಗ ದೃಢೀಕರಣ ಪತ್ರ / STUDY CERTIFICATE
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-bold border-b border-slate-200 pb-2">
            <div>
              ದಾಖಲೆ ಸಂಖ್ಯೆ (Ref No):{' '}
              <span className="font-mono text-emerald-900 font-bold">{certNumber}</span>
            </div>
            <div>
              ದಿನಾಂಕ (Date): <span className="font-mono">{todayStr}</span>
            </div>
          </div>

          <div className="space-y-4 text-sm leading-relaxed text-slate-900 pt-2 text-justify">
            <p>
              ಈ ಮೂಲಕ ದೃಢೀಕರಿಸುವುದೇನೆಂದರೆ, ಕುಮಾರ್ / ಕುಮಾರಿ{' '}
              <strong className="text-slate-950 uppercase underline font-extrabold px-1">
                {currentStudent.studentName}
              </strong>{' '}
              ಇವರ ತಂದೆ ಶ್ರೀ{' '}
              <strong className="text-slate-950 uppercase font-bold px-1">
                {currentStudent.fatherName}
              </strong>{' '}
              ಹಾಗೂ ತಾಯಿ ಶ್ರೀಮತಿ{' '}
              <strong className="text-slate-950 uppercase font-bold px-1">
                {currentStudent.motherName}
              </strong>{' '}
              ಇವರು ನಮ್ಮ ಶಾಲೆಯಲ್ಲಿ ದಿನಾಂಕ{' '}
              <strong className="font-mono font-bold px-1">
                {currentStudent.admissionDate ? formatDateToDmy(currentStudent.admissionDate) : '01/06/2024'}
              </strong>{' '}
              ರಿಂದ{' '}
              <strong className="text-blue-900 font-bold px-1">
                {currentStudent.classStandard} ನೇ ತರಗತಿಯಲ್ಲಿ ('{currentStudent.division}' ವಿಭಾಗ)
              </strong>{' '}
              ವ್ಯಾಸಂಗ ಮಾಡುತ್ತಿರುತ್ತಾರೆ / ಮಾಡುತ್ತಿದ್ದರು ಎಂದು ದೃಢೀಕರಿಸಲಾಗಿದೆ.
            </p>

            <p>
              ಶಾಲಾ ದಾಖಲಾತಿ ಪುಸ್ತಕದ ಪ್ರಕಾರ ವಿದ್ಯಾರ್ಥಿಯ SATS ಸಂಖ್ಯೆ:{' '}
              <strong className="font-mono font-bold px-1 text-slate-900">
                {currentStudent.satsNo}
              </strong>{' '}
              ಹಾಗೂ ರಾಷ್ಟ್ರೀಯ PEN ಸಂಖ್ಯೆ:{' '}
              <strong className="font-mono font-bold px-1 text-slate-900">
                {currentStudent.penNo}
              </strong>{' '}
              ಆಗಿರುತ್ತದೆ. ಇವರ ಜಾತಿ / ಪ್ರವರ್ಗವು{' '}
              <strong className="font-bold px-1">{currentStudent.caste}</strong> ಆಗಿದೆ.
            </p>

            <p>
              ವಿದ್ಯಾರ್ಥಿಯ ನಡತೆ ಮತ್ತು ಶೀಲವು ನಮ್ಮ ಶಾಲೆಯಲ್ಲಿ ವ್ಯಾಸಂಗ ಮಾಡುತ್ತಿದ್ದ ಅವಧಿಯಲ್ಲಿ{' '}
              <strong className="text-emerald-900 font-black px-1">
                "ಉತ್ತಮವಾಗಿದೆ (GOOD)"
              </strong>{' '}
              ಎಂದು ದೃಢೀಕರಿಸಲಾಗಿದೆ. ಈ ಪ್ರಮಾಣ ಪತ್ರವನ್ನು ಅವರ ಶೈಕ್ಷಣಿಕ ಅಥವಾ ಅಧಿಕೃತ ಉದ್ದೇಶಕ್ಕಾಗಿ ನೀಡಲಾಗಿದೆ.
            </p>
          </div>

          <div className="pt-16 grid grid-cols-2 text-center text-xs font-bold text-slate-900">
            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1.5 w-48 mx-auto">
                ಸ್ಥಳ: {talukName}
                <br />
                ದಿನಾಂಕ: {certDate}
              </div>
            </div>

            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1.5 w-60 mx-auto">
                ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಸಹಿ ಮತ್ತು ಶಾಲಾ ಮೊಹರು
                <br />
                <span className="text-[11px] font-normal text-slate-600 block mt-0.5">
                  {schoolRecord?.schoolName}
                </span>
                <span className="text-xs font-black font-mono text-slate-900 block mt-0.5">
                  ಶಾಲಾ DISE ಕೋಡ್: {schoolRecord?.diseCode}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-3 border border-dashed border-slate-400 rounded-xl flex items-center justify-between text-[11px] text-slate-600">
            <span>ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಚೇರಿಯ ಪ್ರತಿ ಸಹಿ (BEO Countersignature if required)</span>
            <span className="font-mono">Office Seal & Signature</span>
          </div>
        </div>
      </ReportPrintPreviewModal>
    )}
  </>
  );
};
