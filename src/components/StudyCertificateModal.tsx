import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Student, SchoolRecord } from '../types';
import { ReportPrintPreviewModal } from './ReportPrintPreviewModal';
import { shareReportToWhatsApp } from '../utils/printPdfHelper';
import { getClassesFromRange, sortStudentsAlphabetically } from '../utils/studentStore';
import {
  CERTIFICATE_ACADEMIC_YEARS,
  getActiveAppAcademicYear,
  isPastAcademicYear,
  getKannadaGenderPrefix,
  extractVillageFromSchoolName,
} from '../utils/certificateHelper';
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
  Calendar,
  Edit3,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

interface StudyCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolRecord: SchoolRecord | null;
  academicYear?: string;
  initialStudentId?: string;
}

export const StudyCertificateModal: React.FC<StudyCertificateModalProps> = ({
  isOpen,
  onClose,
  students,
  schoolRecord,
  academicYear,
  initialStudentId,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const activeAppAcademicYear = useMemo(
    () => getActiveAppAcademicYear(academicYear, schoolRecord?.academicYear),
    [academicYear, schoolRecord?.academicYear]
  );

  const nowInit = useMemo(() => new Date(), []);
  const todayStr = `${String(nowInit.getDate()).padStart(2, '0')}/${String(nowInit.getMonth() + 1).padStart(2, '0')}/${nowInit.getFullYear()}`;

  const defaultPlace = useMemo(
    () => extractVillageFromSchoolName(schoolRecord?.schoolName, schoolRecord?.taluk || ''),
    [schoolRecord?.schoolName, schoolRecord?.taluk]
  );

  useEffect(() => {
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
    const base =
      selectedClassFilter === 'ALL'
        ? students
        : students.filter((s) => s.classStandard === selectedClassFilter);
    return sortStudentsAlphabetically(base);
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

  // Editable draft fields (auto-populated dynamically from selected student, school & active academic year)
  const [certAcademicYear, setCertAcademicYear] = useState<string>(activeAppAcademicYear);
  const [studyTense, setStudyTense] = useState<'studying' | 'studied'>('studying');
  const [genderPrefix, setGenderPrefix] = useState<'ಕುಮಾರ' | 'ಕುಮಾರಿ'>('ಕುಮಾರ');
  const [draftStudentName, setDraftStudentName] = useState<string>('');
  const [draftFatherName, setDraftFatherName] = useState<string>('');
  const [draftMotherName, setDraftMotherName] = useState<string>('');
  const [draftClassStd, setDraftClassStd] = useState<string>('');
  const [draftDivision, setDraftDivision] = useState<string>('A');
  const [draftSatsNo, setDraftSatsNo] = useState<string>('');
  const [draftPenNo, setDraftPenNo] = useState<string>('');
  const [draftAadharDisplay, setDraftAadharDisplay] = useState<string>('');
  const [draftCaste, setDraftCaste] = useState<string>('GENERAL');
  const [draftReligion, setDraftReligion] = useState<string>('Hindu');
  const [draftRefNo, setDraftRefNo] = useState<string>('');
  const [certPlace, setCertPlace] = useState<string>(defaultPlace);
  const [certDate, setCertDate] = useState<string>(todayStr);

  useEffect(() => {
    if (!isOpen) return;
    setIsConfirmed(false);
    const resolvedYear =
      academicYear || currentStudent?.academicYear || activeAppAcademicYear;
    setCertAcademicYear(resolvedYear);
    setStudyTense(isPastAcademicYear(resolvedYear, activeAppAcademicYear) ? 'studied' : 'studying');
    setCertPlace(defaultPlace);

    if (currentStudent) {
      setGenderPrefix(getKannadaGenderPrefix(currentStudent.gender));
      setDraftStudentName(currentStudent.studentName || '');
      setDraftFatherName(currentStudent.fatherName || '');
      setDraftMotherName(currentStudent.motherName || '');
      setDraftClassStd(currentStudent.classStandard || '');
      setDraftDivision(currentStudent.division || 'A');
      setDraftSatsNo(currentStudent.satsNo || '-');
      setDraftPenNo(currentStudent.penNo || '-');
      setDraftAadharDisplay(
        currentStudent.aadharNo && currentStudent.aadharNo.length === 12
          ? `XXXX-XXXX-${currentStudent.aadharNo.slice(-4)}`
          : currentStudent.aadharNo || '-'
      );
      setDraftCaste(
        currentStudent.caste === 'CUSTOM'
          ? currentStudent.customCaste || 'GENERAL'
          : currentStudent.caste || 'GENERAL'
      );
      setDraftReligion(currentStudent.religion || 'Hindu');
      const yearPrefix = resolvedYear.match(/^(\d{4})/)?.[1] || String(nowInit.getFullYear());
      setDraftRefNo(
        `SC/${schoolRecord?.diseCode?.slice(-4) || yearPrefix}/${resolvedYear}/${String(currentIdx + 1).padStart(3, '0')}`
      );
    }
  }, [isOpen, currentStudent?.id, academicYear, activeAppAcademicYear, defaultPlace]);

  const academicYearOptions = useMemo(() => {
    if (CERTIFICATE_ACADEMIC_YEARS.includes(certAcademicYear)) {
      return CERTIFICATE_ACADEMIC_YEARS;
    }
    return [certAcademicYear, ...CERTIFICATE_ACADEMIC_YEARS];
  }, [certAcademicYear]);

  if (!isOpen) return null;

  const handleAcademicYearChange = (newYear: string) => {
    setCertAcademicYear(newYear);
    setStudyTense(isPastAcademicYear(newYear, activeAppAcademicYear) ? 'studied' : 'studying');
    setIsConfirmed(false);
  };

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

  const studentNameClean = (draftStudentName || 'Student').replace(/[^a-zA-Z0-9_\u0C80-\u0CFF]/g, '_');
  const certPdfFilename = `StudyCertificate_${studentNameClean}_Class_${draftClassStd || 'Std'}_${certAcademicYear}.pdf`;
  const talukName = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';

  const studyVerbPhrase =
    studyTense === 'studied'
      ? 'ವ್ಯಾಸಂಗ ಮಾಡಿದ್ದಾರೆ ಎಂದು ದೃಢೀಕರಿಸಲಾಗಿದೆ.'
      : 'ವ್ಯಾಸಂಗ ಮಾಡುತ್ತಿದ್ದಾರೆ ಎಂದು ದೃಢೀಕರಿಸಲಾಗಿದೆ.';

  const renderCertificateSheet = (attachRef: boolean) => (
    <div
      ref={attachRef ? printableRef : undefined}
      className="border-4 border-double border-emerald-950 p-8 sm:p-10 rounded-3xl relative space-y-7 print:border-2 text-xs bg-white text-slate-900"
    >
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
            <span className="font-mono text-emerald-900 font-bold">{draftRefNo}</span>
          </div>
          <div>
            ದಿನಾಂಕ (Date): <span className="font-mono">{certDate}</span>
          </div>
        </div>

        {/* Official Student Photo Box */}
        {currentStudent && (
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
        )}
      </div>

      {/* Certificate Formal Declaration Body */}
      <div className="space-y-4 text-sm leading-relaxed text-slate-900 pt-2 text-justify">
        <p>
          ಈ ಮೂಲಕ ದೃಢೀಕರಿಸುವುದೇನೆಂದರೆ, {genderPrefix}{' '}
          <span className="font-extrabold underline text-blue-950 text-base">
            {draftStudentName}
          </span>
          , ತಂದೆ{' '}
          <span className="font-extrabold underline text-slate-950">
            {draftFatherName}
          </span>
          , ತಾಯಿ{' '}
          <span className="font-extrabold underline text-slate-950">
            {draftMotherName}
          </span>
          , ಸ್ಯಾಟ್ಸ್ ಸಂಖ್ಯೆ (SATS No):{' '}
          <span className="font-mono font-black text-blue-900">
            {draftSatsNo}
          </span>
          , PEN ಸಂಖ್ಯೆ:{' '}
          <span className="font-mono font-bold">{draftPenNo}</span>
          , ಆಧಾರ್ ಸಂಖ್ಯೆ:{' '}
          <span className="font-mono font-bold">{draftAadharDisplay}</span>.
        </p>

        <p>
          ಇವರು ನಮ್ಮ ಸರ್ಕಾರಿ ಮಾನ್ಯತೆ ಪಡೆದ ಶಾಲೆಯಲ್ಲಿ{' '}
          <span className="font-black text-emerald-900">
            {draftClassStd} ನೇ ತರಗತಿಯಲ್ಲಿ (Class {draftClassStd} - {draftDivision})
          </span>
          ,{' '}
          <span className="font-black text-emerald-950">
            {schoolRecord?.schoolMedium || 'Kannada'} ಮಾಧ್ಯಮದಲ್ಲಿ
          </span>{' '}
          ಶೈಕ್ಷಣಿಕ ಸಾಲು{' '}
          <span className="font-mono font-black text-blue-950">{certAcademicYear}</span>{' '}
          ರಲ್ಲಿ ನಿಯಮಿತವಾಗಿ {studyVerbPhrase}
        </p>

        <p>
          ಶಾಲಾ ದಾಖಲಾತಿ ಪ್ರಕಾರ ವಿದ್ಯಾರ್ಥಿಯ ಜಾತಿ / ಪ್ರವರ್ಗ:{' '}
          <span className="font-bold underline">{draftCaste}</span>{' '}
          ಮತ್ತು ಧರ್ಮ: <span className="font-bold underline">{draftReligion}</span> ಆಗಿರುತ್ತದೆ.
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
          <div className="border-t border-slate-400 pt-1.5 w-52 mx-auto space-y-0.5">
            <div>ಸ್ಥಳ: {certPlace || talukName}</div>
            <div>
              ದಿನಾಂಕ: <span className="font-mono">{certDate}</span>
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
  );

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
              {/* Dynamic Academic Year Selector */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs sm:text-sm font-black text-emerald-300 whitespace-nowrap flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>ಶೈಕ್ಷಣಿಕ ಸಾಲು:</span>
                </label>
                <select
                  value={certAcademicYear}
                  onChange={(e) => handleAcademicYearChange(e.target.value)}
                  className="px-2.5 py-2 text-xs sm:text-sm font-black bg-slate-800 border-2 border-emerald-600/60 rounded-xl text-white cursor-pointer hover:border-emerald-400 font-mono"
                  title="Select Academic Year for Study Certificate"
                >
                  {academicYearOptions.map((yr) => (
                    <option key={yr} value={yr} className="bg-slate-900 text-white font-bold">
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

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
                    const nextList = sortStudentsAlphabetically(
                      newClass === 'ALL'
                        ? students
                        : students.filter((s) => s.classStandard === newClass)
                    );
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

              {/* Student Dropdown List */}
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

              {isConfirmed ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsConfirmed(false)}
                    className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md transition cursor-pointer"
                    title="Edit details again"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>ತಿದ್ದುಪಡಿ (Edit)</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!currentStudent) return;
                      const summary = `*ಶಾಲಾ ವ್ಯಾಸಂಗ ದೃಢೀಕರಣ ಪತ್ರ (Study Certificate)*\n🏫 ಶಾಲೆ: ${schoolRecord?.schoolName || 'Govt School'}\n📍 ಸ್ಥಳ: ${certPlace || talukName}\n👤 ವಿದ್ಯಾರ್ಥಿ: ${genderPrefix} ${draftStudentName}\n🆔 SATS: ${draftSatsNo}\n👨 ತಂದೆ: ${draftFatherName}\n👩 ತಾಯಿ: ${draftMotherName}\n📚 ತರಗತಿ: ${draftClassStd}ನೇ ತರಗತಿ\n📅 ಶೈಕ್ಷಣಿಕ ಸಾಲು: ${certAcademicYear}`;
                      await shareReportToWhatsApp(printableRef.current, summary, `StudyCertificate_${draftStudentName}`);
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
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmed(true)}
                  disabled={!currentStudent}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-md transition cursor-pointer"
                  title="Confirm details to enable Print and PDF Export"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ದೃಢೀಕರಿಸಿ & ಸಿದ್ಧಪಡಿಸಿ (Confirm)</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Printable Study Certificate & Review/Edit Container */}
          <div className="p-5 sm:p-8 overflow-y-auto flex-1 print:p-6 text-slate-900 bg-slate-100/60 print:bg-white space-y-5">
            {!currentStudent ? (
              <div className="p-12 text-center text-slate-500 text-xs sm:text-sm font-bold bg-white rounded-2xl border border-slate-200">
                No students found.
              </div>
            ) : (
              <>
                {!isConfirmed ? (
                  <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm p-4 sm:p-5 space-y-4 print:hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-amber-700" />
                        <div>
                          <h4 className="font-black text-sm text-slate-900">
                            ಹಂತ 1: ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ & ಅಗತ್ಯವಿದ್ದರೆ ತಿದ್ದುಪಡಿ ಮಾಡಿ (Review & Edit Before Confirming)
                          </h4>
                          <p className="text-[11px] text-slate-600">
                            ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ "ದೃಢೀಕರಿಸಿ" ಒತ್ತಿದ ನಂತರವೇ ಮುದ್ರಣ (Print) ಮತ್ತು PDF ಡೌನ್‌ಲೋಡ್‌ಗೆ ಸರ್ಟಿಫಿಕೇಟ್ ಸಿದ್ಧವಾಗುತ್ತದೆ.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsConfirmed(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ವಿವರಗಳು ಸರಿಯಾಗಿವೆ — ದೃಢೀಕರಿಸಿ (Confirm)</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          ಲಿಂಗ ಪೂರ್ವಪ್ರತ್ಯಯ (Prefix)
                        </label>
                        <select
                          value={genderPrefix}
                          onChange={(e) => setGenderPrefix(e.target.value as 'ಕುಮಾರ' | 'ಕುಮಾರಿ')}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        >
                          <option value="ಕುಮಾರ">ಕುಮಾರ (ಗಂಡು / Boy)</option>
                          <option value="ಕುಮಾರಿ">ಕುಮಾರಿ (ಹೆಣ್ಣು / Girl)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು (Student Name)
                        </label>
                        <input
                          type="text"
                          value={draftStudentName}
                          onChange={(e) => setDraftStudentName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          ವ್ಯಾಸಂಗ ಸ್ಥಿತಿ (Study Status)
                        </label>
                        <select
                          value={studyTense}
                          onChange={(e) => setStudyTense(e.target.value as 'studying' | 'studied')}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        >
                          <option value="studying">ವ್ಯಾಸಂಗ ಮಾಡುತ್ತಿದ್ದಾರೆ (ಪ್ರಸಕ್ತ ಸಾಲು)</option>
                          <option value="studied">ವ್ಯಾಸಂಗ ಮಾಡಿದ್ದಾರೆ (ಹಿಂದಿನ ಸಾಲು)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          ತಂದೆಯ ಹೆಸರು (Father Name)
                        </label>
                        <input
                          type="text"
                          value={draftFatherName}
                          onChange={(e) => setDraftFatherName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          ತಾಯಿಯ ಹೆಸರು (Mother Name)
                        </label>
                        <input
                          type="text"
                          value={draftMotherName}
                          onChange={(e) => setDraftMotherName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">ತರಗತಿ</label>
                          <input
                            type="text"
                            value={draftClassStd}
                            onChange={(e) => setDraftClassStd(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">ವಿಭಾಗ</label>
                          <input
                            type="text"
                            value={draftDivision}
                            onChange={(e) => setDraftDivision(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">ಜಾತಿ / ಪ್ರವರ್ಗ</label>
                        <input
                          type="text"
                          value={draftCaste}
                          onChange={(e) => setDraftCaste(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">ಧರ್ಮ (Religion)</label>
                        <input
                          type="text"
                          value={draftReligion}
                          onChange={(e) => setDraftReligion(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">ದಾಖಲೆ ಸಂಖ್ಯೆ (Ref No)</label>
                        <input
                          type="text"
                          value={draftRefNo}
                          onChange={(e) => setDraftRefNo(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                          <span>ಸ್ಥಳ (Place / ಊರಿನ ಹೆಸರು - Editable)</span>
                        </label>
                        <input
                          type="text"
                          value={certPlace}
                          onChange={(e) => setCertPlace(e.target.value)}
                          placeholder="ಊರಿನ ಹೆಸರು"
                          className="w-full px-3 py-1.5 border-2 border-emerald-400 bg-emerald-50/40 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">ದಿನಾಂಕ (Date)</label>
                        <DatePickerField
                          value={certDate}
                          onChange={setCertDate}
                          placeholder="DD/MM/YYYY"
                          className="!space-y-0"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">SATS No</label>
                          <input
                            type="text"
                            value={draftSatsNo}
                            onChange={(e) => setDraftSatsNo(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl font-mono font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">PEN No</label>
                          <input
                            type="text"
                            value={draftPenNo}
                            onChange={(e) => setDraftPenNo(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl font-mono font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                      <div>
                        <div className="font-black text-xs sm:text-sm text-emerald-950">
                          ✓ ಸರ್ಟಿಫಿಕೇಟ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ — ಮುದ್ರಣ / PDF ಡೌನ್‌ಲೋಡ್‌ಗೆ ಸಿದ್ಧವಾಗಿದೆ!
                        </div>
                        <div className="text-[11px] text-emerald-800">
                          Confirmed & Ready for Official Print, PDF Export, or WhatsApp Share.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsConfirmed(false)}
                        className="px-3 py-1.5 bg-white hover:bg-amber-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>ಮತ್ತೆ ತಿದ್ದುಪಡಿ ಮಾಡಿ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPreviewModal(true)}
                        className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / Export to PDF</span>
                      </button>
                    </div>
                  </div>
                )}

                {renderCertificateSheet(true)}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Print & PDF Preview Modal (Enabled once confirmed) */}
      {showPreviewModal && isConfirmed && currentStudent && (
        <ReportPrintPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="ಶಾಲಾ ವ್ಯಾಸಂಗ ದೃಢೀಕರಣ ಪತ್ರ - Study Certificate"
          subtitle={`${studentNameClean} • Class ${draftClassStd} • SATS: ${draftSatsNo}`}
          filename={certPdfFilename}
        >
          {renderCertificateSheet(false)}
        </ReportPrintPreviewModal>
      )}
    </>
  );
};
