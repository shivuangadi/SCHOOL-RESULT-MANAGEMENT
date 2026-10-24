import React, { useState, useMemo, useRef } from 'react';
import { Student, SchoolRecord } from '../types';
import { ReportPrintPreviewModal } from './ReportPrintPreviewModal';
import { shareReportToWhatsApp, exportElementAsImage } from '../utils/printPdfHelper';
import { formatDateToDmy } from '../utils/satsExcelParser';
import { DatePickerField } from './DatePickerField';
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  CheckCircle2,
  Share2,
  Download,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface CasteBirthCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolRecord: SchoolRecord | null;
}

// Convert numbers 0-9 to Kannada words for dates
const KANNADA_NUM_WORDS: Record<number, string> = {
  1: 'ಒಂದು', 2: 'ಎರಡು', 3: 'ಮೂರು', 4: 'ನಾಲ್ಕು', 5: 'ಐದು',
  6: 'ಆರು', 7: 'ಏಳು', 8: 'ಎಂಟು', 9: 'ಒಂಬತ್ತು', 10: 'ಹತ್ತು',
  11: 'ಹನ್ನೊಂದು', 12: 'ಹನ್ನೆರಡು', 13: 'ಹದಿಮೂರು', 14: 'ಹದಿನಾಲ್ಕು', 15: 'ಹದಿನೈದು',
  16: 'ಹದಿನಾರು', 17: 'ಹದಿನೇಳು', 18: 'ಹದಿನೆಂಟು', 19: 'ಹತ್ತೊಂಬತ್ತು', 20: 'ಇಪ್ಪತ್ತು',
  21: 'ಇಪ್ಪತ್ತೊಂದು', 22: 'ಇಪ್ಪತ್ತೆರಡು', 23: 'ಇಪ್ಪತ್ಮೂರು', 24: 'ಇಪ್ಪತ್ನಾಲ್ಕು', 25: 'ಇಪ್ಪತ್ತೈದು',
  26: 'ಇಪ್ಪತ್ತಾರು', 27: 'ಇಪ್ಪತ್ತೇಳು', 28: 'ಇಪ್ಪತ್ತೆಂಟು', 29: 'ಇಪ್ಪತ್ತೊಂಬತ್ತು', 30: 'ಮೂವತ್ತು', 31: 'ಮೂವತ್ತೊಂದು',
};

const KANNADA_MONTHS: Record<number, string> = {
  1: 'ಜನವರಿ', 2: 'ಫೆಬ್ರವರಿ', 3: 'ಮಾರ್ಚ್', 4: 'ಏಪ್ರಿಲ್',
  5: 'ಮೇ', 6: 'ಜೂನ್', 7: 'ಜುಲೈ', 8: 'ಆಗಸ್ಟ್',
  9: 'ಸೆಪ್ಟೆಂಬರ್', 10: 'ಅಕ್ಟೋಬರ್', 11: 'ನವೆಂಬರ್', 12: 'ಡಿಸೆಂಬರ್',
};

const convertDateToKannadaWords = (dateStr: string): string => {
  try {
    const cleanStr = String(dateStr).trim()
      .replace(/20110/g, '2011')
      .replace(/20111/g, '2011')
      .replace(/20112/g, '2012')
      .replace(/20113/g, '2013')
      .replace(/20114/g, '2014')
      .replace(/20115/g, '2015');

    const parts = cleanStr.split(/[-/.]/);
    if (parts.length === 3) {
      let year = 2015;
      let month = 5;
      let day = 15;
      if (parts[0].length >= 4) {
        year = parseInt(parts[0].slice(0, 4), 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2].slice(0, 4), 10);
      }
      if (year > 2050 || year < 1950) year = 2015;
      const dayWord = KANNADA_NUM_WORDS[day] || `${day}`;
      const monthWord = KANNADA_MONTHS[month] || `${month}`;
      return `${dayWord} ${monthWord} ಎರಡು ಸಾವಿರದ ${year % 100}`;
    }
  } catch (_) {}
  return dateStr;
};

export const CasteBirthCertificateModal: React.FC<CasteBirthCertificateModalProps> = ({
  isOpen,
  onClose,
  students,
  schoolRecord,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const printableRef = useRef<HTMLDivElement>(null);

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

  const talukName = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
  const schoolName = schoolRecord?.schoolName || 'ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ';
  const diseCode = schoolRecord?.diseCode || '';
  const rawDob = currentStudent?.dob || currentStudent?.dateOfBirth || '15/05/2015';
  const studentDob = formatDateToDmy(rawDob);
  const dobInWords = convertDateToKannadaWords(studentDob);

  const certNumber = currentStudent
    ? `CBC/${diseCode.slice(-4) || '2026'}/${String(currentIdx + 1).padStart(3, '0')}`
    : 'CBC/2026/001';

  const now = new Date();
  const todayStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const [issueDate, setIssueDate] = useState(todayStr);

  const handleWhatsAppShare = async () => {
    if (!currentStudent) return;
    setIsSharing(true);
    const summary = `*ಜಾತಿ ಹಾಗೂ ಜನ್ಮ ದಿನಾಂಕ ಶಾಲಾ ದೃಢೀಕರಣ ಪತ್ರ*\n🏫 ಶಾಲೆ: ${schoolName}\n📍 ತಾಲೂಕು: ${talukName} (DISE: ${diseCode})\n\n👤 ವಿದ್ಯಾರ್ಥಿ: ${currentStudent.studentName}\n🆔 SATS No: ${currentStudent.satsNo}\n👨 ತಂದೆ: ${currentStudent.fatherName}\n👩 ತಾಯಿ: ${currentStudent.motherName}\n📅 ಜನ್ಮ ದಿನಾಂಕ: ${studentDob} (${dobInWords})\n🏷️ ಜಾತಿ / ಪ್ರವರ್ಗ: ${currentStudent.caste}\n📚 ತರಗತಿ: ${currentStudent.classStandard}ನೇ ತರಗತಿ\n📜 ಪ್ರಮಾಣ ಪತ್ರ ಸಂಖ್ಯೆ: ${certNumber}\nದಿನಾಂಕ: ${issueDate}`;
    await shareReportToWhatsApp(printableRef.current, summary, `Caste_Birth_Cert_${currentStudent.studentName}`);
    setIsSharing(false);
  };

  const renderCertificateContent = () => (
    <div
      ref={printableRef}
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
          <span className="font-mono text-blue-900 font-extrabold">{certNumber}</span>
        </div>
        <div>
          <span>ದಿನಾಂಕ: </span>
          <span className="font-mono">{todayStr}</span>
        </div>
      </div>

      {/* Certificate Body Paragraph */}
      <div className="text-justify text-sm sm:text-base leading-loose font-medium text-slate-900 space-y-4">
        <p>
          ಈ ಮೂಲಕ ದೃಢೀಕರಿಸುವುದೇನೆಂದರೆ,{' '}
          <span className="font-black underline px-2">{currentStudent?.gender === 'Girl' ? 'ಕುಮಾರಿ' : 'ಶ್ರೀ'} {currentStudent?.studentName || '................................'}</span>{' '}
          ಇವರು ತಂದೆ{' '}
          <span className="font-black underline px-2">{currentStudent?.fatherName || '................................'}</span>{' '}
          ಹಾಗೂ ತಾಯಿ{' '}
          <span className="font-black underline px-2">{currentStudent?.motherName || '................................'}</span>{' '}
          ಇವರ ಮಗನಾಗಿದ್ದು/ಮಗಳಾಗಿದ್ದು, ನಮ್ಮ ಶಾಲೆಯಲ್ಲಿ ಪ್ರಸ್ತುತ{' '}
          <span className="font-black underline px-2">{currentStudent?.classStandard || '....'}ನೇ ತರಗತಿ</span>{' '}
          ({currentStudent?.division || 'A'} ವಿಭಾಗ) ಯಲ್ಲಿ ವ್ಯಾಸಂಗ ಮಾಡುತ್ತಿದ್ದಾರೆ.
        </p>

        <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-4 space-y-2 text-xs sm:text-sm font-semibold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="text-slate-600">1. ವಿದ್ಯಾರ್ಥಿಯ SATS ಸಂಖ್ಯೆ: </span>
              <strong className="font-mono text-red-900 font-black">{currentStudent?.satsNo || '-'}</strong>
            </div>
            <div>
              <span className="text-slate-600">2. ಶಾಲಾ ಪ್ರವೇಶ ಸಂಖ್ಯೆ (Reg No): </span>
              <strong className="font-mono">{currentStudent?.schoolRegNo || '-'}</strong>
            </div>
            <div>
              <span className="text-slate-600">3. ಜನ್ಮ ದಿನಾಂಕ (ಅಂಕೆಗಳಲ್ಲಿ): </span>
              <strong className="font-mono text-slate-900">{studentDob}</strong>
            </div>
            <div>
              <span className="text-slate-600">4. ಜನ್ಮ ದಿನಾಂಕ (ಅಕ್ಷರಗಳಲ್ಲಿ): </span>
              <strong className="text-slate-950 font-bold">{dobInWords}</strong>
            </div>
            <div>
              <span className="text-slate-600">5. ಧರ್ಮ (Religion): </span>
              <strong>{currentStudent?.religion || 'Hindu'}</strong>
            </div>
            <div>
              <span className="text-slate-600">6. ಜಾತಿ / ಪ್ರವರ್ಗ (Caste/Category): </span>
              <strong className="text-blue-950">{currentStudent?.caste || 'GENERAL'}</strong>
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
          <div className="text-[11px] text-slate-600">ಸ್ಥಳ: {schoolRecord?.taluk || 'ನಿಂಗ್ಯಾನಟ್ಟಿ'}</div>
          <div className="text-[11px] text-slate-600">
            <span className="hidden print:inline">ದಿನಾಂಕ: {issueDate}</span>
            <div className="print:hidden flex items-center justify-center gap-1.5 mt-0.5">
              <span className="text-slate-700 font-bold">ದಿನಾಂಕ:</span>
              <div className="w-32 inline-block">
                <DatePickerField
                  value={issueDate}
                  onChange={setIssueDate}
                  placeholder="DD/MM/YYYY"
                  className="!space-y-0"
                />
              </div>
            </div>
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

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Student Selector Toolbar */}
          <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-bold text-slate-700">ತರಗತಿ ಆಯ್ಕೆ:</label>
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
                {filteredStudents.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.studentName} ({st.classStandard}-{st.division})
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

          {/* Printable Document Sheet */}
          <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-white print:p-0">
            {renderCertificateContent()}
          </div>
        </div>
      </div>

      {showPreviewModal && (
        <ReportPrintPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title={`Caste & Birth Certificate - ${currentStudent?.studentName || ''}`}
          subtitle={`${schoolName} • DISE: ${diseCode}`}
          filename={`Caste_Birth_Cert_${currentStudent?.studentName || 'Student'}.pdf`}
        >
          {renderCertificateContent()}
        </ReportPrintPreviewModal>
      )}
    </>
  );
};
