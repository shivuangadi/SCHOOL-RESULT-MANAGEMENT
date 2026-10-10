import React, { useState, useMemo } from 'react';
import { Student, SchoolRecord } from '../types';
import { formatDateToWords } from '../utils/dateToWords';
import { formatDateToDmy } from '../utils/satsExcelParser';
import { ReportPrintPreviewModal } from './ReportPrintPreviewModal';
import { DatePickerField } from './DatePickerField';
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileText,
  Languages,
  Eye,
} from 'lucide-react';

interface TransferCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolRecord: SchoolRecord | null;
  initialStudentId?: string;
}

// Extract last village / town word from school name (e.g. "ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ ನಿಂಗ್ಯಾನಟ್ಟಿ" -> "ನಿಂಗ್ಯಾನಟ್ಟಿ")
const extractDefaultVillage = (schoolName?: string, taluk?: string): string => {
  if (!schoolName) return taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
  const tokens = schoolName.trim().split(/\s+/);
  if (tokens.length > 0) {
    const lastWord = tokens[tokens.length - 1].replace(/[(),.-]/g, '');
    if (lastWord.length > 1) return lastWord;
  }
  return taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
};

// Calculate realistic default birthdate based on student's class in DD/MM/YYYY format
const getDefaultDob = (classStd: string): string => {
  const stdNum = parseInt(classStd, 10) || 5;
  const birthYear = 2024 - (stdNum + 5);
  return `15/06/${birthYear}`;
};

export const TransferCertificateModal: React.FC<TransferCertificateModalProps> = ({
  isOpen,
  onClose,
  students,
  schoolRecord,
  initialStudentId,
}) => {
  const defaultLang = schoolRecord?.schoolMedium === 'English' ? 'en' : 'kn';
  const [docLang, setDocLang] = useState<'kn' | 'en'>(defaultLang);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // Sync selected student whenever initialStudentId or isOpen changes
  React.useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
      setSelectedClassFilter('ALL');
    }
  }, [initialStudentId, isOpen]);

  // Per-student editable fields
  const [promotionStatusMap, setPromotionStatusMap] = useState<Record<string, string>>({});
  const [duesStatusMap, setDuesStatusMap] = useState<Record<string, string>>({});

  // Editable Place Name (defaults to last word of school name e.g. "ನಿಂಗ್ಯಾನಟ್ಟಿ")
  const defaultPlace = useMemo(
    () => extractDefaultVillage(schoolRecord?.schoolName, schoolRecord?.taluk),
    [schoolRecord?.schoolName, schoolRecord?.taluk]
  );
  const [placeName, setPlaceName] = useState<string>(defaultPlace);

  // Sync placeName if defaultPlace changes
  React.useEffect(() => {
    if (defaultPlace) setPlaceName(defaultPlace);
  }, [defaultPlace]);

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

  const talukName = schoolRecord?.taluk || (docLang === 'kn' ? 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ' : 'Belagavi Rural');
  const tcNumber = currentStudent
    ? `TC/${schoolRecord?.diseCode?.slice(-4) || '2024'}/${String(currentIdx + 1).padStart(3, '0')}`
    : 'TC/2025/001';

  const now = new Date();
  const todayStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const [tcDate, setTcDate] = useState(todayStr);

  // Current student promotion and fee values (only "ಹೌದು" / "ಇಲ್ಲ" or "Yes" / "No")
  const studentPromotionVal =
    currentStudent && promotionStatusMap[currentStudent.id] !== undefined
      ? promotionStatusMap[currentStudent.id]
      : docLang === 'kn'
      ? 'ಹೌದು'
      : 'Yes';

  const studentDuesVal =
    currentStudent && duesStatusMap[currentStudent.id] !== undefined
      ? duesStatusMap[currentStudent.id]
      : docLang === 'kn'
      ? 'ಇಲ್ಲ'
      : 'No';

  // Date of Birth of Student (DOB) - Display cleanly in DD/MM/YYYY format with NO date picker
  const rawDob =
    currentStudent?.dob ||
    currentStudent?.dateOfBirth ||
    (currentStudent ? getDefaultDob(currentStudent.classStandard) : '15/06/2014');

  const { formattedDate: dobDisplay, wordsInBrackets: dobWords } = formatDateToWords(rawDob, docLang);

  const isKannada = docLang === 'kn';
  const cleanStudentName = currentStudent?.studentName || 'Student';
  const pdfFilename = `TC_${cleanStudentName.replace(/[^a-zA-Z0-9_\u0C80-\u0CFF]/g, '_')}_Class_${currentStudent?.classStandard || 'Std'}.pdf`;

  // Render the official Karnataka State Transfer Certificate
  const renderCertificateContent = (isForPreviewModal = false) => {
    if (!currentStudent) {
      return (
        <div className="p-12 text-center text-slate-500 text-xs sm:text-sm font-bold">
          {isKannada ? 'ಯಾವುದೇ ವಿದ್ಯಾರ್ಥಿ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.' : 'No students found.'}
        </div>
      );
    }

    return (
      <div className="border-4 border-double border-slate-900 p-6 sm:p-8 rounded-2xl relative space-y-4 print:border-2 text-xs bg-white text-slate-950">
        {/* Mandatory Official Heading */}
        <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-3">
          <div className="text-xs sm:text-sm font-black uppercase text-slate-800 tracking-wider">
            {isKannada
              ? 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ'
              : 'GOVERNMENT OF KARNATAKA - DEPARTMENT OF SCHOOL EDUCATION & LITERACY'}
          </div>
          <div className="text-base sm:text-xl font-black text-slate-950 underline underline-offset-4">
            {isKannada
              ? `ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ ${talukName}`
              : `OFFICE OF THE BLOCK EDUCATION OFFICER & BRC ${talukName}`}
          </div>
          <div className="text-sm sm:text-lg font-black text-blue-950 mt-1">
            {schoolRecord?.schoolName}
          </div>
          <div className="text-xs sm:text-sm font-mono font-bold text-slate-700">
            {isKannada
              ? `DISE ಕೋಡ್: ${schoolRecord?.diseCode} • ತಾಲೂಕು: ${talukName} • ಮಾಧ್ಯಮ: ${schoolRecord?.schoolMedium || 'ಕನ್ನಡ'}`
              : `DISE Code: ${schoolRecord?.diseCode} • Taluk: ${talukName} • Medium: ${schoolRecord?.schoolMedium || 'English'}`}
          </div>
          <div className="inline-block px-6 py-1.5 bg-slate-900 text-white font-black text-xs sm:text-sm rounded-full uppercase tracking-widest mt-1 shadow-xs">
            {isKannada ? 'ವರ್ಗಾವಣೆ ಪ್ರಮಾಣ ಪತ್ರ' : 'TRANSFER CERTIFICATE'}
          </div>
        </div>

        {/* TC Metadata Row */}
        <div className="flex justify-between items-center text-xs font-bold border-b border-slate-300 pb-2">
          <div>
            {isKannada ? 'ಕ್ರಮ ಸಂಖ್ಯೆ:' : 'TC No:'}{' '}
            <span className="font-mono text-blue-900 font-black">{tcNumber}</span>
          </div>
          <div>
            {isKannada ? 'ದಿನಾಂಕ:' : 'Date of Issue:'}{' '}
            <span className="font-mono font-black">{todayStr}</span>
          </div>
        </div>

        {/* TC Official Formatted Table with Visible Borders */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-slate-900 text-xs">
            <tbody>
              {/* 1. Student Name */}
              <tr className="border-b border-slate-300">
                <td className="w-8 py-2 px-2.5 font-bold border-r border-slate-300 text-center">1.</td>
                <td className="w-5/12 py-2 px-3 font-bold border-r border-slate-300">
                  {isKannada ? 'ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು:' : 'Name of Student:'}
                </td>
                <td className="py-2 px-3 font-black text-sm uppercase text-slate-900">
                  {currentStudent.studentName}
                </td>
              </tr>

              {/* 2. SATS & PEN No */}
              <tr className="border-b border-slate-300">
                <td className="w-8 py-2 px-2.5 font-bold border-r border-slate-300 text-center">2.</td>
                <td className="w-5/12 py-2 px-3 font-bold border-r border-slate-300">
                  {isKannada ? 'SATS ಮತ್ತು PEN ಸಂಖ್ಯೆ:' : 'SATS & PEN Number:'}
                </td>
                <td className="py-2 px-3 font-mono font-bold text-slate-900">
                  SATS: {currentStudent.satsNo || '-'} • PEN: {currentStudent.penNo || '-'}
                </td>
              </tr>

              {/* 3. Father Name */}
              <tr className="border-b border-slate-300">
                <td className="w-8 py-2 px-2.5 font-bold border-r border-slate-300 text-center">3.</td>
                <td className="w-5/12 py-2 px-3 font-bold border-r border-slate-300">
                  {isKannada ? 'ತಂದೆಯ ಹೆಸರು:' : "Father's Name:"}
                </td>
                <td className="py-2 px-3 font-bold uppercase">{currentStudent.fatherName || '-'}</td>
              </tr>

              {/* 4. Mother Name */}
              <tr className="border-b border-slate-300">
                <td className="w-8 py-2 px-2.5 font-bold border-r border-slate-300 text-center">4.</td>
                <td className="w-5/12 py-2 px-3 font-bold border-r border-slate-300">
                  {isKannada ? 'ತಾಯಿಯ ಹೆಸರು:' : "Mother's Name:"}
                </td>
                <td className="py-2 px-3 font-bold uppercase">{currentStudent.motherName || '-'}</td>
              </tr>

              {/* 5. Nationality & Religion */}
              <tr className="border-b border-slate-300">
                <td className="w-8 py-2 px-2.5 font-bold border-r border-slate-300 text-center">5.</td>
                <td className="w-5/12 py-2 px-3 font-bold border-r border-slate-300">
                  {isKannada ? 'ರಾಷ್ಟ್ರೀಯತೆ ಮತ್ತು ಧರ್ಮ:' : 'Nationality & Religion:'}
                </td>
                <td className="py-2 px-3 font-bold">
                  {isKannada ? `ಭಾರತೀಯ • ${currentStudent.religion || 'Hindu'}` : `Indian • ${currentStudent.religion || 'Hindu'}`}
                </td>
              </tr>

              {/* 6. Caste & Category */}
              <tr className="border-b border-slate-300">
                <td className="w-8 py-2 px-2.5 font-bold border-r border-slate-300 text-center">6.</td>
                <td className="w-5/12 py-2 px-3 font-bold border-r border-slate-300">
                  {isKannada ? 'ಜಾತಿ ಮತ್ತು ಪ್ರವರ್ಗ:' : 'Caste & Category:'}
                </td>
                <td className="py-2 px-3 font-bold">
                  {currentStudent.caste === 'CUSTOM'
                    ? currentStudent.customCaste
                    : (currentStudent.caste || 'GENERAL')}
                </td>
              </tr>

              {/* 7. Date of Birth of Student (DOB) */}
              <tr className="border-b border-slate-300">
                <td className="w-8 py-2 px-2.5 font-bold border-r border-slate-300 text-center align-top">7.</td>
                <td className="w-5/12 py-2 px-3 font-bold border-r border-slate-300 align-top">
                  {isKannada ? 'ವಿದ್ಯಾರ್ಥಿಯ ಜನ್ಮ ದಿನಾಂಕ:' : 'Date of Birth of Student:'}
                </td>
                <td className="py-2 px-3 space-y-1">
                  <div className="font-mono font-black text-sm text-slate-900 tracking-wide">
                    {dobDisplay}
                  </div>
                  <div className="font-bold text-slate-800 text-xs tracking-wide">
                    {dobWords}
                  </div>
                </td>
              </tr>

              {/* 8. Admission Date & Class */}
              <tr className="border-b border-slate-300">
                <td className="w-8 py-2 px-2.5 font-bold border-r border-slate-300 text-center">8.</td>
                <td className="w-5/12 py-2 px-3 font-bold border-r border-slate-300">
                  {isKannada ? 'ಶಾಲೆಗೆ ಪ್ರವೇಶ ಪಡೆದ ದಿನಾಂಕ ಮತ್ತು ತರಗತಿ:' : 'Date of Admission & Class Admitted:'}
                </td>
                <td className="py-2 px-3 font-mono font-bold">
                  {currentStudent.admissionDate ? formatDateToDmy(currentStudent.admissionDate) : '01/06/2024'} (Class {currentStudent.classStandard})
                </td>
              </tr>

              {/* 9. Class at time of leaving */}
              <tr className="border-b border-slate-300">
                <td className="w-8 py-2 px-2.5 font-bold border-r border-slate-300 text-center">9.</td>
                <td className="w-5/12 py-2 px-3 font-bold border-r border-slate-300">
                  {isKannada ? 'ಶಾಲೆಯನ್ನು ಬಿಡುವಾಗ ಓದುತ್ತಿದ್ದ ತರಗತಿ:' : 'Class in which Studying at the Time of Leaving:'}
                </td>
                <td className="py-2 px-3 font-black text-blue-900">
                  {isKannada
                    ? `${currentStudent.classStandard} ನೇ ತರಗತಿ (${currentStudent.division} ವಿಭಾಗ)`
                    : `Class ${currentStudent.classStandard} (Section ${currentStudent.division})`}
                </td>
              </tr>

              {/* 10. Medium of Instruction */}
              <tr className="border-b border-slate-300">
                <td className="w-8 py-2 px-2.5 font-bold border-r border-slate-300 text-center">10.</td>
                <td className="w-5/12 py-2 px-3 font-bold border-r border-slate-300">
                  {isKannada ? 'ಬೋಧನಾ ಮಾಧ್ಯಮ:' : 'Medium of Instruction:'}
                </td>
                <td className="py-2 px-3 font-bold">
                  {schoolRecord?.schoolMedium || (isKannada ? 'ಕನ್ನಡ' : 'Kannada')}
                </td>
              </tr>

              {/* 11. Qualified for promotion to higher standard */}
              <tr className="border-b border-slate-300">
                <td className="w-8 py-2 px-2.5 font-bold border-r border-slate-300 text-center">11.</td>
                <td className="w-5/12 py-2 px-3 font-bold border-r border-slate-300">
                  {isKannada
                    ? 'ಮುಂದಿನ ತರಗತಿಗೆ ಉತ್ತೀರ್ಣಗೊಳಿಸಲು ಅರ್ಹನೇ?'
                    : 'Whether qualified for promotion to higher standard:'}
                </td>
                <td className="py-2 px-3 font-bold">
                  {isForPreviewModal ? (
                    <span className={`font-black text-sm ${
                      studentPromotionVal === 'ಹೌದು' || studentPromotionVal === 'Yes'
                        ? 'text-emerald-900'
                        : 'text-rose-900'
                    }`}>
                      {studentPromotionVal}
                    </span>
                  ) : (
                    <>
                      <div className="print:hidden">
                        <select
                          value={studentPromotionVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPromotionStatusMap((prev) => ({ ...prev, [currentStudent.id]: val }));
                          }}
                          className={`px-3 py-1 rounded-lg border-2 font-black text-xs sm:text-sm cursor-pointer ${
                            studentPromotionVal === 'ಹೌದು' || studentPromotionVal === 'Yes'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                              : 'bg-rose-50 border-rose-500 text-rose-950'
                          }`}
                        >
                          {isKannada ? (
                            <>
                              <option value="ಹೌದು">ಹೌದು</option>
                              <option value="ಇಲ್ಲ">ಇಲ್ಲ</option>
                            </>
                          ) : (
                            <>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div
                        className={`hidden print:block font-black text-sm ${
                          studentPromotionVal === 'ಹೌದು' || studentPromotionVal === 'Yes'
                            ? 'text-emerald-900'
                            : 'text-rose-900'
                        }`}
                      >
                        {studentPromotionVal}
                      </div>
                    </>
                  )}
                </td>
              </tr>

              {/* 12. Whether all school fees or dues are cleared */}
              <tr className="border-b border-slate-300">
                <td className="w-8 py-2 px-2.5 font-bold border-r border-slate-300 text-center">12.</td>
                <td className="w-5/12 py-2 px-3 font-bold border-r border-slate-300">
                  {isKannada ? 'ಶಾಲಾ ಶುಲ್ಕ ಅಥವಾ ಬಾಕಿ ಉಳಿದಿದೆಯೇ?' : 'Whether school fees or dues are cleared:'}
                </td>
                <td className="py-2 px-3 font-bold">
                  {isForPreviewModal ? (
                    <span className="font-bold text-sm text-slate-900">
                      {studentDuesVal}
                    </span>
                  ) : (
                    <>
                      <div className="print:hidden">
                        <select
                          value={studentDuesVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDuesStatusMap((prev) => ({ ...prev, [currentStudent.id]: val }));
                          }}
                          className="px-3 py-1 rounded-lg border-2 border-slate-300 font-black text-xs sm:text-sm bg-slate-50 text-slate-900 cursor-pointer"
                        >
                          {isKannada ? (
                            <>
                              <option value="ಇಲ್ಲ">ಇಲ್ಲ</option>
                              <option value="ಹೌದು">ಹೌದು</option>
                            </>
                          ) : (
                            <>
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div className="hidden print:block font-bold text-sm text-slate-900">
                        {studentDuesVal}
                      </div>
                    </>
                  )}
                </td>
              </tr>

              {/* 13. Character & Conduct */}
              <tr className="border-b border-slate-300">
                <td className="w-8 py-2 px-2.5 font-bold border-r border-slate-300 text-center">13.</td>
                <td className="w-5/12 py-2 px-3 font-bold border-r border-slate-300">
                  {isKannada ? 'ವಿದ್ಯಾರ್ಥಿಯ ನಡತೆ ಮತ್ತು ಶೀಲ:' : 'Character & Conduct:'}
                </td>
                <td className="py-2 px-3 font-bold text-emerald-900">
                  {isKannada ? 'ಉತ್ತಮವಾಗಿದೆ' : 'Good'}
                </td>
              </tr>

              {/* 14. Reason for leaving */}
              <tr>
                <td className="w-8 py-2 px-2.5 font-bold border-r border-slate-300 text-center">14.</td>
                <td className="w-5/12 py-2 px-3 font-bold border-r border-slate-300">
                  {isKannada ? 'ಶಾಲೆ ಬಿಡಲು ಕಾರಣ:' : 'Reason for leaving:'}
                </td>
                <td className="py-2 px-3 font-bold">
                  {isKannada ? 'ಪಾಲಕರ ಕೋರಿಕೆ ಮೇರೆಗೆ' : "Parent's Request"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Headmaster Signature & Editable Place, with school DISE Code directly below School Name */}
        <div className="pt-10 grid grid-cols-2 items-end text-xs font-bold text-slate-800">
          <div className="text-left space-y-1.5">
            <div className="text-xs sm:text-sm font-black flex items-center gap-1.5">
              <span>{isKannada ? 'ದಿನಾಂಕ:' : 'Date:'}</span>
              {isForPreviewModal ? (
                <span className="font-mono font-bold">{tcDate}</span>
              ) : (
                <>
                  <span className="hidden print:inline font-mono font-bold">{tcDate}</span>
                  <div className="print:hidden w-36 inline-block">
                    <DatePickerField
                      value={tcDate}
                      onChange={setTcDate}
                      placeholder="DD/MM/YYYY"
                      className="!space-y-0"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="text-xs sm:text-sm font-black flex items-center gap-1.5">
              <span>{isKannada ? 'ಸ್ಥಳ:' : 'Place:'}</span>
              {isForPreviewModal ? (
                <span className="font-mono font-black text-slate-950 underline underline-offset-2">
                  {placeName}
                </span>
              ) : (
                <>
                  <span className="hidden print:inline font-mono font-bold">{placeName}</span>
                  <input
                    type="text"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    className="print:hidden px-2 py-0.5 border border-slate-300 rounded font-bold text-xs bg-slate-50 focus:bg-white focus:outline-blue-500 w-44"
                    placeholder={isKannada ? 'ಸ್ಥಳದ ಹೆಸರು' : 'Place Name'}
                    title={isKannada ? 'ಸ್ಥಳವನ್ನು ಬದಲಾಯಿಸಲು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ' : 'Edit Place'}
                  />
                </>
              )}
            </div>
          </div>

          {/* Right Bottom: Headmaster Signature, School Name, and DISE Code directly below School Name */}
          <div className="text-center">
            <div className="h-10"></div>
            <div className="border-t-2 border-slate-900 pt-1.5 w-64 mx-auto font-black text-xs sm:text-sm">
              {isKannada
                ? 'ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಸಹಿ ಮತ್ತು ಶಾಲಾ ಮೊಹರು'
                : 'Headmaster Signature & School Seal'}
              <br />
              {/* School Name */}
              <span className="text-[11px] font-bold text-slate-700 block mt-1">
                {schoolRecord?.schoolName}
              </span>
              {/* DISE Code below School Name */}
              <span className="text-xs font-black font-mono text-slate-900 block mt-1">
                {isKannada ? 'ಶಾಲಾ DISE ಕೋಡ್:' : 'School DISE Code:'} {schoolRecord?.diseCode || '29010100101'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print-modal-card">
          {/* Navigation Bar (Hidden in Print) - Professional Deep Navy / Slate Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-3.5 sm:p-4 px-5 sm:px-6 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden border-b border-slate-700 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base tracking-wide text-white">
                  {isKannada ? 'ವರ್ಗಾವಣೆ ಪ್ರಮಾಣ ಪತ್ರ (TC)' : 'Transfer Certificate (TC)'}
                </h3>
                <p className="text-[11px] font-bold text-slate-400">
                  {isKannada ? 'ಕರ್ನಾಟಕ ರಾಜ್ಯ ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ' : 'Department of School Education, Karnataka'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Class Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
                <label className="text-xs sm:text-sm font-black text-amber-300 whitespace-nowrap">
                  {isKannada ? 'ತರಗತಿ:' : 'Class:'}
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
                  className="px-2.5 py-1 text-xs sm:text-sm font-black bg-slate-900 border border-slate-600 rounded-lg text-white cursor-pointer hover:border-amber-400"
                >
                  <option value="ALL" className="bg-slate-900 text-white font-bold">
                    {isKannada ? 'ಎಲ್ಲಾ ತರಗತಿ (All Classes)' : 'All Classes'}
                  </option>
                  {availableClasses.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white font-bold">
                      {isKannada ? `${c} ನೇ ತರಗತಿ (Class ${c})` : `Class ${c}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Dropdown List */}
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
                <label className="text-xs sm:text-sm font-black text-blue-300 whitespace-nowrap">
                  {isKannada ? 'ವಿದ್ಯಾರ್ಥಿ:' : 'Student:'}
                </label>
                <select
                  value={currentStudent?.id || ''}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={filteredStudents.length === 0}
                  className="px-2.5 py-1 text-xs sm:text-sm font-black bg-slate-900 border border-slate-600 rounded-lg text-white cursor-pointer hover:border-blue-400 max-w-[180px] sm:max-w-xs truncate"
                >
                  {filteredStudents.length === 0 ? (
                    <option value="">{isKannada ? 'ವಿದ್ಯಾರ್ಥಿಗಳಿಲ್ಲ' : 'No Students'}</option>
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
              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  disabled={currentIdx <= 0}
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg text-white disabled:opacity-30 hover:bg-slate-700 cursor-pointer"
                  title="Previous Student"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs sm:text-sm font-mono font-black px-2 text-white whitespace-nowrap">
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

              {/* Language Switcher in Right Corner */}
              <button
                type="button"
                onClick={() => setDocLang((prev) => (prev === 'kn' ? 'en' : 'kn'))}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-amber-400/80 text-amber-300 font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                title="Switch Language / ಭಾಷೆ ಬದಲಿಸಿ"
              >
                <Languages className="w-4 h-4 text-amber-400" />
                <span>{isKannada ? 'English Mode' : 'ಕನ್ನಡ ಮೋಡ್'}</span>
              </button>

              {/* Print / Export to PDF Button -> Opens interactive Print Preview */}
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-blue-900/30 transition cursor-pointer"
                title="Open Print & PDF Preview"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Export to PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Printable TC Container */}
          <div className="p-6 sm:p-10 overflow-y-auto flex-1 print:p-4 text-slate-900 bg-white">
            {renderCertificateContent(false)}
          </div>
        </div>
      </div>

      {/* Interactive Print & PDF Preview Modal */}
      {showPreviewModal && (
        <ReportPrintPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title={isKannada ? 'ವರ್ಗಾವಣೆ ಪ್ರಮಾಣ ಪತ್ರ (TC)' : 'Transfer Certificate (TC)'}
          subtitle={`${cleanStudentName} • ${currentStudent?.classStandard ? `Class ${currentStudent.classStandard}` : ''} • SATS: ${currentStudent?.satsNo || '-'}`}
          filename={pdfFilename}
        >
          {renderCertificateContent(true)}
        </ReportPrintPreviewModal>
      )}
    </>
  );
};
