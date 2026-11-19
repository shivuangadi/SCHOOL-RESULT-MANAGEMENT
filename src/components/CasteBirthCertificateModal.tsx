import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Student, SchoolRecord } from '../types';
import { ReportPrintPreviewModal } from './ReportPrintPreviewModal';
import { shareReportToWhatsApp } from '../utils/printPdfHelper';
import { formatDateToDmy } from '../utils/satsExcelParser';
import { sortStudentsAlphabetically } from '../utils/studentStore';
import { formatDateToKannadaWords } from '../utils/dateToWords';
import {
  CERTIFICATE_ACADEMIC_YEARS,
  getActiveAppAcademicYear,
  isPastAcademicYear,
  getKannadaGenderPrefix,
  getKannadaChildRelation,
  extractVillageFromSchoolName,
} from '../utils/certificateHelper';
import { DatePickerField } from './DatePickerField';
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

interface CasteBirthCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolRecord: SchoolRecord | null;
  academicYear?: string;
}

export const CasteBirthCertificateModal: React.FC<CasteBirthCertificateModalProps> = ({
  isOpen,
  onClose,
  students,
  schoolRecord,
  academicYear,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
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

  const availableClasses = useMemo(() => {
    const clsSet = new Set(students.map((s) => s.classStandard).filter(Boolean));
    const list = Array.from(clsSet).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
    return list.length > 0 ? list : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  }, [students]);

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

  // Editable draft fields (initialized dynamically from selected student, school, and academic year)
  const [certAcademicYear, setCertAcademicYear] = useState<string>(activeAppAcademicYear);
  const [studyTense, setStudyTense] = useState<'studying' | 'studied'>('studying');
  const [genderPrefix, setGenderPrefix] = useState<'ಕುಮಾರ' | 'ಕುಮಾರಿ'>('ಕುಮಾರ');
  const [childRelation, setChildRelation] = useState<'ಮಗನಾಗಿದ್ದು' | 'ಮಗಳಾಗಿದ್ದು'>('ಮಗನಾಗಿದ್ದು');
  const [draftStudentName, setDraftStudentName] = useState<string>('');
  const [draftFatherName, setDraftFatherName] = useState<string>('');
  const [draftMotherName, setDraftMotherName] = useState<string>('');
  const [draftClassStd, setDraftClassStd] = useState<string>('');
  const [draftDivision, setDraftDivision] = useState<string>('A');
  const [draftSatsNo, setDraftSatsNo] = useState<string>('');
  const [draftRegNo, setDraftRegNo] = useState<string>('');
  const [draftDob, setDraftDob] = useState<string>('15/05/2015');
  const [draftDobInWords, setDraftDobInWords] = useState<string>('');
  const [draftReligion, setDraftReligion] = useState<string>('Hindu');
  const [draftCaste, setDraftCaste] = useState<string>('GENERAL');
  const [draftRefNo, setDraftRefNo] = useState<string>('');
  const [certPlace, setCertPlace] = useState<string>(defaultPlace);
  const [issueDate, setIssueDate] = useState<string>(todayStr);

  // Sync draft values whenever modal opens or selected student changes
  useEffect(() => {
    if (!isOpen) return;
    setIsConfirmed(false);
    const resolvedYear =
      academicYear || currentStudent?.academicYear || activeAppAcademicYear;
    setCertAcademicYear(resolvedYear);
    setStudyTense(isPastAcademicYear(resolvedYear, activeAppAcademicYear) ? 'studied' : 'studying');
    setCertPlace(defaultPlace);

    if (currentStudent) {
      const prefix = getKannadaGenderPrefix(currentStudent.gender);
      const relation = getKannadaChildRelation(currentStudent.gender);
      setGenderPrefix(prefix);
      setChildRelation(relation);
      setDraftStudentName(currentStudent.studentName || '');
      setDraftFatherName(currentStudent.fatherName || '');
      setDraftMotherName(currentStudent.motherName || '');
      setDraftClassStd(currentStudent.classStandard || '');
      setDraftDivision(currentStudent.division || 'A');
      setDraftSatsNo(currentStudent.satsNo || '-');
      setDraftRegNo(currentStudent.schoolRegNo || '-');
      const rawDob = currentStudent.dob || currentStudent.dateOfBirth || '15/05/2015';
      const formattedDob = formatDateToDmy(rawDob);
      setDraftDob(formattedDob);
      setDraftDobInWords(formatDateToKannadaWords(formattedDob));
      setDraftReligion(currentStudent.religion || 'Hindu');
      setDraftCaste(
        currentStudent.caste === 'CUSTOM'
          ? currentStudent.customCaste || 'GENERAL'
          : currentStudent.caste || 'GENERAL'
      );
      const yearPrefix = resolvedYear.match(/^(\d{4})/)?.[1] || String(nowInit.getFullYear());
      const diseTail = schoolRecord?.diseCode?.slice(-4) || yearPrefix;
      setDraftRefNo(`CBC/${diseTail}/${resolvedYear}/${String(currentIdx + 1).padStart(3, '0')}`);
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

  const handleDobChange = (newDob: string) => {
    setDraftDob(newDob);
    setDraftDobInWords(formatDateToKannadaWords(newDob));
    setIsConfirmed(false);
  };

  const handleGenderPrefixChange = (prefix: 'ಕುಮಾರ' | 'ಕುಮಾರಿ') => {
    setGenderPrefix(prefix);
    setChildRelation(prefix === 'ಕುಮಾರಿ' ? 'ಮಗಳಾಗಿದ್ದು' : 'ಮಗನಾಗಿದ್ದು');
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

  const talukName = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
  const schoolName = schoolRecord?.schoolName || 'ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ';
  const diseCode = schoolRecord?.diseCode || '';

  const studyClauseText =
    studyTense === 'studied'
      ? `ಶೈಕ್ಷಣಿಕ ಸಾಲು ${certAcademicYear} ರಲ್ಲಿ ${draftClassStd || '....'}ನೇ ತರಗತಿ (${draftDivision || 'A'} ವಿಭಾಗ) ಯಲ್ಲಿ ವ್ಯಾಸಂಗ ಮಾಡಿದ್ದಾರೆ.`
      : `ಪ್ರಸ್ತುತ ಶೈಕ್ಷಣಿಕ ಸಾಲು ${certAcademicYear} ರಲ್ಲಿ ${draftClassStd || '....'}ನೇ ತರಗತಿ (${draftDivision || 'A'} ವಿಭಾಗ) ಯಲ್ಲಿ ವ್ಯಾಸಂಗ ಮಾಡುತ್ತಿದ್ದಾರೆ.`;

  const handleWhatsAppShare = async () => {
    if (!currentStudent || !isConfirmed) return;
    setIsSharing(true);
    const summary = `*ಜಾತಿ ಹಾಗೂ ಜನ್ಮ ದಿನಾಂಕ ಶಾಲಾ ದೃಢೀಕರಣ ಪತ್ರ*\n🏫 ಶಾಲೆ: ${schoolName}\n📍 ಸ್ಥಳ: ${certPlace || talukName} (DISE: ${diseCode})\n\n👤 ವಿದ್ಯಾರ್ಥಿ: ${genderPrefix} ${draftStudentName}\n🆔 SATS No: ${draftSatsNo}\n👨 ತಂದೆ: ${draftFatherName}\n👩 ತಾಯಿ: ${draftMotherName}\n📅 ಜನ್ಮ ದಿನಾಂಕ: ${draftDob} (${draftDobInWords})\n🏷️ ಜಾತಿ / ಪ್ರವರ್ಗ: ${draftCaste}\n📚 ತರಗತಿ: ${draftClassStd}ನೇ ತರಗತಿ (${certAcademicYear})\n📜 ಪ್ರಮಾಣ ಪತ್ರ ಸಂಖ್ಯೆ: ${draftRefNo}\nದಿನಾಂಕ: ${issueDate}`;
    await shareReportToWhatsApp(printableRef.current, summary, `Caste_Birth_Cert_${draftStudentName}`);
    setIsSharing(false);
  };

  const renderCertificateContent = (attachRef: boolean) => (
    <div
      ref={attachRef ? printableRef : undefined}
      className="max-w-[760px] mx-auto border-4 border-double border-slate-900 p-6 sm:p-10 rounded-2xl space-y-6 text-slate-900 bg-white relative"
    >
      {/* Official Header */}
      <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-4">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-widest">
          ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ
        </div>
        <div className="text-sm font-extrabold text-slate-900">
          ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ, {talukName}
        </div>
        <div className="text-lg sm:text-xl font-black text-blue-950 uppercase">
          {schoolName}
        </div>
        <div className="text-xs font-mono font-bold text-slate-700">
          DISE CODE: {diseCode} • ತಾಲೂಕು: {talukName} • ಜಿಲ್ಲೆ: {schoolRecord?.district || 'ಬೆಳಗಾವಿ'}
        </div>
      </div>

      {/* Title Badge */}
      <div className="text-center">
        <span className="inline-block px-6 py-2 bg-slate-900 text-white font-black text-sm rounded-full tracking-wide uppercase shadow-sm">
          ಜಾತಿ ಹಾಗೂ ಜನ್ಮ ದಿನಾಂಕ ಪ್ರಮಾಣ ಪತ್ರ
        </span>
        <p className="text-[11px] font-bold text-slate-600 mt-1">
          (CASTE AND DATE OF BIRTH CERTIFICATE)
        </p>
      </div>

      {/* Meta Row: Ref No & Date */}
      <div className="flex justify-between items-center text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
        <div>
          <span>ಕ್ರ.ಸಂಖ್ಯೆ (Ref No): </span>
          <span className="font-mono text-blue-900 font-extrabold">{draftRefNo}</span>
        </div>
        <div>
          <span>ದಿನಾಂಕ: </span>
          <span className="font-mono">{issueDate}</span>
        </div>
      </div>

      {/* Certificate Body Paragraph */}
      <div className="text-justify text-sm sm:text-base leading-loose font-medium text-slate-900 space-y-4">
        <p>
          ಈ ಮೂಲಕ ದೃಢೀಕರಿಸುವುದೇನೆಂದರೆ,{' '}
          <span className="font-black underline px-1.5">
            {genderPrefix} {draftStudentName || '................................'}
          </span>{' '}
          ಇವರು ತಂದೆ{' '}
          <span className="font-black underline px-1.5">
            {draftFatherName || '................................'}
          </span>{' '}
          ಹಾಗೂ ತಾಯಿ{' '}
          <span className="font-black underline px-1.5">
            {draftMotherName || '................................'}
          </span>{' '}
          ಇವರ {childRelation}, ನಮ್ಮ ಶಾಲೆಯಲ್ಲಿ {studyClauseText}
        </p>

        <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-4 space-y-2 text-xs sm:text-sm font-semibold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <span className="text-slate-600">1. ವಿದ್ಯಾರ್ಥಿಯ SATS ಸಂಖ್ಯೆ: </span>
              <strong className="font-mono text-red-900 font-black">{draftSatsNo || '-'}</strong>
            </div>
            <div>
              <span className="text-slate-600">2. ಶಾಲಾ ಪ್ರವೇಶ ಸಂಖ್ಯೆ (Reg No): </span>
              <strong className="font-mono">{draftRegNo || '-'}</strong>
            </div>
            <div>
              <span className="text-slate-600">3. ಜನ್ಮ ದಿನಾಂಕ (ಅಂಕೆಗಳಲ್ಲಿ): </span>
              <strong className="font-mono text-slate-900">{draftDob}</strong>
            </div>
            <div>
              <span className="text-slate-600">4. ಜನ್ಮ ದಿನಾಂಕ (ಅಕ್ಷರಗಳಲ್ಲಿ): </span>
              <strong className="text-slate-950 font-bold">{draftDobInWords}</strong>
            </div>
            <div>
              <span className="text-slate-600">5. ಧರ್ಮ (Religion): </span>
              <strong>{draftReligion || 'Hindu'}</strong>
            </div>
            <div>
              <span className="text-slate-600">6. ಜಾತಿ / ಪ್ರವರ್ಗ (Caste/Category): </span>
              <strong className="text-blue-950">{draftCaste || 'GENERAL'}</strong>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
          ಈ ಮೇಲ್ಕಂಡ ಎಲ್ಲಾ ಮಾಹಿತಿಯು ನಮ್ಮ ಶಾಲೆಯ ಅಧಿಕೃತ ದಾಖಲಾತಿ ವಹಿ (General Admission Register - Book No. 01) ಯನ್ವಯ ಪರಿಶೀಲಿಸಲಾಗಿದ್ದು, ಸಂಪೂರ್ಣವಾಗಿ ಸತ್ಯ ಮತ್ತು ಸರಿಯಾಗಿದೆ ಎಂದು ಈ ಮೂಲಕ ದೃಢೀಕರಿಸಲಾಗಿದೆ.
        </p>
      </div>

      {/* Signatures */}
      <div className="flex justify-between items-end pt-12 text-xs font-bold text-slate-900">
        <div className="text-center space-y-1">
          <div className="text-xs text-slate-800 font-bold">
            ಸ್ಥಳ: {certPlace || talukName}
          </div>
          <div className="text-xs text-slate-800 font-bold">
            ದಿನಾಂಕ: <span className="font-mono">{issueDate}</span>
          </div>
          <div className="w-36 border-t-2 border-slate-900 pt-1 mt-8 font-black">
            ತರಗತಿ ಶಿಕ್ಷಕರ ಸಹಿ
          </div>
        </div>

        <div className="text-center space-y-1">
          <div className="w-48 border-t-2 border-slate-900 pt-1 font-black">
            ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಸಹಿ & ಮೊಹರು
          </div>
          <div className="text-[11px] text-slate-600">{schoolName}</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
          {/* Top Control Bar */}
          <div className="bg-slate-900 text-white p-4 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg">
                  ಜಾತಿ ಹಾಗೂ ಜನ್ಮ ದಿನಾಂಕ ಶಾಲಾ ದೃಢೀಕರಣ ಪತ್ರ
                </h3>
                <p className="text-xs text-slate-400">
                  Caste & Date of Birth Certificate (Official Karnataka State Format)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isConfirmed ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsConfirmed(false)}
                    className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    title="Edit certificate details again"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>ತಿದ್ದುಪಡಿ ಮಾಡಿ (Edit)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    disabled={isSharing}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                    title="Share Certificate to WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{isSharing ? 'Sharing...' : 'WhatsApp Share'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-sm transition cursor-pointer"
                    title="Print or Export to PDF"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / Export PDF</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmed(true)}
                  disabled={!currentStudent}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-md transition cursor-pointer"
                  title="Confirm all details to unlock Print and PDF export"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ದೃಢೀಕರಿಸಿ & ಸಿದ್ಧಪಡಿಸಿ (Confirm)</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Student & Academic Year Selector Toolbar */}
          <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <label className="text-xs font-bold text-slate-700">ಶೈಕ್ಷಣಿಕ ಸಾಲು:</label>
                <select
                  value={certAcademicYear}
                  onChange={(e) => handleAcademicYearChange(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-emerald-400 rounded-xl text-xs font-black font-mono text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  {academicYearOptions.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <label className="text-xs font-bold text-slate-700 ml-1">ತರಗತಿ:</label>
              <select
                value={selectedClassFilter}
                onChange={(e) => {
                  setSelectedClassFilter(e.target.value);
                  setSelectedStudentId('');
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="ALL">ಎಲ್ಲಾ ತರಗತಿಗಳು (All Classes)</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    ತರಗತಿ {cls}
                  </option>
                ))}
              </select>

              <select
                value={currentStudent?.id || ''}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none max-w-[240px] truncate"
              >
                {filteredStudents.map((st, idx) => (
                  <option key={st.id} value={st.id}>
                    {idx + 1}. {st.studentName} ({st.classStandard}-{st.division})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIdx <= 0}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700" />
              </button>
              <span className="text-xs font-bold text-slate-600">
                {filteredStudents.length > 0 ? currentIdx + 1 : 0} of {filteredStudents.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentIdx >= filteredStudents.length - 1}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </button>
            </div>
          </div>

          {/* Scrollable Body: Step 1 Edit/Review Form + Live Certificate Preview */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/60 print:p-0 print:bg-white space-y-5">
            {!currentStudent ? (
              <div className="p-12 text-center text-slate-500 text-sm font-bold bg-white rounded-2xl border border-slate-200">
                ಯಾವುದೇ ವಿದ್ಯಾರ್ಥಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ (No students found).
              </div>
            ) : (
              <>
                {/* Step Status Banner & Review/Edit Form (Hidden in Print) */}
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
                            ಎಲ್ಲಾ ಮಾಹಿತಿ ಸರಿಯಾಗಿದೆಯೇ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಂಡು "ದೃಢೀಕರಿಸಿ" ಬಟನ್ ಒತ್ತಿದ ನಂತರ Print / PDF ಸಿದ್ಧವಾಗುತ್ತದೆ.
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
                          onChange={(e) =>
                            handleGenderPrefixChange(e.target.value as 'ಕುಮಾರ' | 'ಕುಮಾರಿ')
                          }
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
                          onChange={(e) =>
                            setStudyTense(e.target.value as 'studying' | 'studied')
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        >
                          <option value="studying">
                            ವ್ಯಾಸಂಗ ಮಾಡುತ್ತಿದ್ದಾರೆ (ಪ್ರಸಕ್ತ ಸಾಲು)
                          </option>
                          <option value="studied">
                            ವ್ಯಾಸಂಗ ಮಾಡಿದ್ದಾರೆ (ಹಿಂದಿನ ಸಾಲು)
                          </option>
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
                        <label className="block font-bold text-slate-700 mb-1">
                          ಜನ್ಮ ದಿನಾಂಕ (DOB: DD/MM/YYYY)
                        </label>
                        <DatePickerField
                          value={draftDob}
                          onChange={handleDobChange}
                          placeholder="DD/MM/YYYY"
                          className="!space-y-0"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">
                          ಜನ್ಮ ದಿನಾಂಕ ಅಕ್ಷರಗಳಲ್ಲಿ (DOB in Full Kannada Words)
                        </label>
                        <input
                          type="text"
                          value={draftDobInWords}
                          onChange={(e) => setDraftDobInWords(e.target.value)}
                          className="w-full px-3 py-1.5 border border-emerald-300 bg-emerald-50/40 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          ಜಾತಿ / ಪ್ರವರ್ಗ (Caste)
                        </label>
                        <input
                          type="text"
                          value={draftCaste}
                          onChange={(e) => setDraftCaste(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          ಧರ್ಮ (Religion)
                        </label>
                        <input
                          type="text"
                          value={draftReligion}
                          onChange={(e) => setDraftReligion(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          ಕ್ರ.ಸಂಖ್ಯೆ (Ref No)
                        </label>
                        <input
                          type="text"
                          value={draftRefNo}
                          onChange={(e) => setDraftRefNo(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-700" />
                          <span>ಸ್ಥಳ (Place / ಊರಿನ ಹೆಸರು - Editable)</span>
                        </label>
                        <input
                          type="text"
                          value={certPlace}
                          onChange={(e) => setCertPlace(e.target.value)}
                          placeholder="ಊರಿನ ಹೆಸರು"
                          className="w-full px-3 py-1.5 border-2 border-blue-300 bg-blue-50/40 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          ದಿನಾಂಕ (Certificate Issue Date)
                        </label>
                        <DatePickerField
                          value={issueDate}
                          onChange={setIssueDate}
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
                          <label className="block font-bold text-slate-700 mb-1">Reg No</label>
                          <input
                            type="text"
                            value={draftRegNo}
                            onChange={(e) => setDraftRegNo(e.target.value)}
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
                        className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / Export PDF</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Live Official Certificate Sheet */}
                {renderCertificateContent(true)}
              </>
            )}
          </div>
        </div>
      </div>

      {showPreviewModal && isConfirmed && currentStudent && (
        <ReportPrintPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title={`Caste & Birth Certificate - ${draftStudentName}`}
          subtitle={`${schoolName} • DISE: ${diseCode}`}
          filename={`Caste_Birth_Cert_${(draftStudentName || 'Student').replace(/[^a-zA-Z0-9_\u0C80-\u0CFF]/g, '_')}_${certAcademicYear}.pdf`}
        >
          {renderCertificateContent(false)}
        </ReportPrintPreviewModal>
      )}
    </>
  );
};
