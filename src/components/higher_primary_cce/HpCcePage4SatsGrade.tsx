import React, { useState, useMemo } from 'react';
import { SchoolRecord, formatClassStd } from '../../types';
import {
  ComputedHpStudent,
  HpSubjectInfo,
  getHpSubjectsForMedium,
  getHpExamGrade,
  exportHpSatsToExcel,
} from '../../utils/higherPrimaryCceHelper';
import {
  executeReportPrint,
  downloadElementAsPdf,
  exportElementAsImage,
  shareReportToWhatsApp,
} from '../../utils/printPdfHelper';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Share2,
  Calendar,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface HpCcePage4SatsGradeProps {
  computedList: ComputedHpStudent[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  selectedClass: string;
  onSelectClass?: (cls: string) => void;
  reportRef?: React.RefObject<HTMLDivElement | null>;
}

type SortField = 'serial' | 'satsNo' | 'studentName' | 'gender' | 'dob' | 'class';
type SortOrder = 'asc' | 'desc';

export const HpCcePage4SatsGrade: React.FC<HpCcePage4SatsGradeProps> = ({
  computedList,
  schoolRecord,
  academicYear,
  selectedClass,
  onSelectClass,
  reportRef,
}) => {
  const [selectedExam, setSelectedExam] = useState<string>('FA1');
  const [sortField, setSortField] = useState<SortField>('studentName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const medium = schoolRecord?.schoolMedium || 'Kannada';
  const subjects = getHpSubjectsForMedium(medium);
  // SATS Karnataka format focuses on the 6 academic subjects: FL, SL, TL, MATHS, SOCIAL SCIENCE, SCIENCE
  const satsSubjects = subjects.slice(0, 6);

  const schoolName = schoolRecord?.schoolName || 'GOVERNMENT HIGHER PRIMARY SCHOOL';
  const diseCode = schoolRecord?.diseCode || '';
  const clusterName = schoolRecord?.cluster || schoolRecord?.crcCluster || '';
  const talukName = schoolRecord?.taluk || '';

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Sort students strictly according to user rules (A-Z by name default, sortable headers)
  const sortedStudents = useMemo(() => {
    const list = [...computedList];
    return list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'studentName') {
        comparison = (a.student.studentName || '').localeCompare(b.student.studentName || '');
      } else if (sortField === 'satsNo') {
        comparison = (a.student.satsNo || '').localeCompare(b.student.satsNo || '');
      } else if (sortField === 'gender') {
        comparison = (a.student.gender || '').localeCompare(b.student.gender || '');
      } else if (sortField === 'dob') {
        const dA = a.student.dob || a.student.dateOfBirth || '';
        const dB = b.student.dob || b.student.dateOfBirth || '';
        comparison = dA.localeCompare(dB);
      } else if (sortField === 'class') {
        comparison = String(a.student.classStandard).localeCompare(String(b.student.classStandard));
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [computedList, sortField, sortOrder]);

  const handleExcelExport = () => {
    showStatus('📊 Excel ಡೌನ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ... / Exporting Excel...');
    exportHpSatsToExcel({
      schoolName,
      diseCode,
      cluster: clusterName,
      taluk: talukName,
      academicYear,
      className: formatClassStd(selectedClass),
      examType: selectedExam,
      students: sortedStudents,
      subjects: satsSubjects,
      filename: `SATS_Grade_Class_${selectedClass}_${selectedExam}.xlsx`,
    });
    showStatus('✅ Excel ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!');
  };

  const handlePdfExport = async () => {
    if (reportRef?.current) {
      showStatus('📄 PDF ತಯಾರಿಸಲಾಗುತ್ತಿದೆ... / Generating PDF...');
      const ok = await downloadElementAsPdf(
        reportRef.current,
        `SATS_Grade_Class_${selectedClass}_${selectedExam}.pdf`
      );
      if (ok) showStatus('✅ PDF ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!');
      else showStatus('⚠️ ಮುದ್ರಣ ವಿಂಡೋದಲ್ಲಿ "Save as PDF" ಆಯ್ಕೆಮಾಡಿ.');
    }
  };

  const handlePrint = async () => {
    if (reportRef?.current) {
      showStatus('🖨️ ಮುದ್ರಣ ವಿಂಡೋ ತೆರೆಯಲಾಗುತ್ತಿದೆ... / Opening print...');
      await executeReportPrint(reportRef.current, `SATS Grade Entry - Class ${selectedClass} - ${selectedExam}`);
    }
  };

  const handleWhatsApp = async () => {
    if (reportRef?.current) {
      showStatus('📱 WhatsApp ಫೋಟೋ ತಯಾರಿಸಲಾಗುತ್ತಿದೆ...');
      const summary = `*SATS GRADE REPORT*\n🏫 ${schoolName}\nDISE: ${diseCode}\nತರಗತಿ: ${formatClassStd(selectedClass)} | ಪರೀಕ್ಷೆ: ${selectedExam}\n📅 ${academicYear}`;
      await shareReportToWhatsApp(
        reportRef.current,
        summary,
        `SATS_Grade_Class_${selectedClass}_${selectedExam}`
      );
      showStatus('✅ WhatsApp ಹಂಚಿಕೆ ಯಶಸ್ವಿಯಾಗಿದೆ!');
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-2.5 h-2.5 inline-block ml-0.5 opacity-40" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-2.5 h-2.5 inline-block ml-0.5 text-blue-700 font-black" />
    ) : (
      <ArrowDown className="w-2.5 h-2.5 inline-block ml-0.5 text-blue-700 font-black" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-300 shadow-sm print:hidden">
        {/* Class & Exam selection dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {onSelectClass && (
            <div className="flex items-center gap-1.5 text-slate-800 text-xs">
              <span className="font-bold">ತರಗತಿ / Class:</span>
              <select
                value={selectedClass}
                onChange={(e) => onSelectClass(e.target.value)}
                className="font-black bg-blue-50 border border-blue-300 text-blue-950 rounded-xl px-2.5 py-1 text-xs cursor-pointer focus:outline-blue-500"
              >
                <option value="6">6ನೇ ತರಗತಿ (Class 6)</option>
                <option value="7">7ನೇ ತರಗತಿ (Class 7)</option>
                <option value="8">8ನೇ ತರಗತಿ (Class 8)</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-blue-800 text-xs">
            <span className="font-bold">Select the Exam type:</span>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="font-black bg-blue-50 border border-blue-400 text-blue-950 rounded-xl px-3 py-1 text-xs cursor-pointer focus:outline-blue-500"
            >
              <option value="FA1">FA-1</option>
              <option value="FA2">FA-2</option>
              <option value="SA1">SA-1</option>
              <option value="FA3">FA-3</option>
              <option value="FA4">FA-4</option>
              <option value="SA2">SA-2</option>
              <option value="TOTAL">ANNUAL RESULT (ಒಟ್ಟು)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons: Excel, PDF, Print, WhatsApp */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExcelExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
            title="Download Excel format with School Details"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel ಡೌನ್‌ಲೋಡ್</span>
          </button>

          <button
            type="button"
            onClick={handlePdfExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
            title="Export to PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
            title="Print Document"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
            title="Share Picture to WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp Share</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-2.5 bg-blue-50 border border-blue-300 text-blue-900 rounded-xl text-xs font-bold text-center animate-in fade-in">
          {statusMessage}
        </div>
      )}

      {/* Printable Legal Portrait Sheet */}
      <div
        ref={reportRef}
        className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-slate-900 shadow-md space-y-4 legal-portrait print:p-2 print:border-none print:shadow-none print:rounded-none max-w-4xl mx-auto"
      >
        {/* School Details Header (Dynamic as per school profile) */}
        <div className="text-center space-y-1 border-b-2 border-slate-900 pb-3">
          <h2 className="text-base sm:text-lg font-black text-slate-950 font-serif uppercase tracking-wide">
            {schoolName}
          </h2>
          <p className="text-xs font-bold text-slate-800">
            DISE CODE: <span className="font-mono font-black">{diseCode}</span> • CLUSTER: <span className="font-black">{clusterName}</span> • TALUK: <span className="font-black">{talukName}</span>
          </p>
          <div className="inline-block bg-blue-950 text-white font-black text-xs px-4 py-1 rounded-lg mt-1">
            SATS GRADE ENTRY SHEET (ಕರ್ನಾಟಕ SATS ಪೋರ್ಟಲ್ ಗ್ರೇಡ್ ನಮೂನೆ) • {academicYear}
          </div>
          <div className="flex justify-between items-center text-xs font-black text-slate-900 pt-2 border-t border-slate-200">
            <span>CLASS: {formatClassStd(selectedClass)} ({selectedClass}ನೇ ತರಗತಿ)</span>
            <span>EXAM TYPE: <span className="text-blue-700 uppercase font-black">{selectedExam}</span></span>
            <span>MEDIUM: {medium}</span>
          </div>
        </div>

        {/* SATS Grade Table (Strictly only students, no empty filler rows) */}
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-xs text-center border-collapse border border-slate-900 table-fixed">
            <thead>
              <tr className="bg-slate-100 font-black text-slate-950 border-b border-slate-900 text-[11px]">
                <th
                  onClick={() => handleSort('serial')}
                  className="border border-slate-900 p-1.5 w-[42px] cursor-pointer hover:bg-slate-200"
                >
                  Sl.No {renderSortIndicator('serial')}
                </th>
                <th
                  onClick={() => handleSort('satsNo')}
                  className="border border-slate-900 p-1.5 w-[110px] cursor-pointer hover:bg-slate-200"
                >
                  SATS NO {renderSortIndicator('satsNo')}
                </th>
                <th
                  onClick={() => handleSort('studentName')}
                  className="border border-slate-900 p-1.5 w-[180px] text-left cursor-pointer hover:bg-slate-200"
                >
                  STUDENT NAME {renderSortIndicator('studentName')}
                </th>
                <th
                  onClick={() => handleSort('gender')}
                  className="border border-slate-900 p-1.5 w-[65px] cursor-pointer hover:bg-slate-200"
                >
                  GENDER {renderSortIndicator('gender')}
                </th>
                {/* 6 Core Subjects: FL, SL, TL, MATHS, SOCIAL SCIENCE, SCIENCE */}
                {satsSubjects.map((sub) => (
                  <th key={sub.code} className="border border-slate-900 p-1.5 font-black bg-blue-50/60 truncate">
                    {sub.satsKey}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="border border-slate-900 p-4 text-center text-slate-500 font-bold italic">
                    ಯಾವುದೇ ವಿದ್ಯಾರ್ಥಿಗಳು ದಾಖಲಾಗಿಲ್ಲ / No students enrolled in Class {selectedClass}
                  </td>
                </tr>
              ) : (
                sortedStudents.map((cSt, idx) => {
                  const st = cSt.student;
                  const isExempt = cSt.isExempted;

                  return (
                    <tr key={st.id} className="border-b border-slate-400 hover:bg-slate-50 text-[11px]">
                      <td className="border border-slate-900 p-1 font-mono font-bold text-slate-800">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-900 p-1 font-mono font-bold text-slate-700">
                        {st.satsNo || '-'}
                      </td>
                      <td className="border border-slate-900 p-1 text-left font-black text-slate-950 truncate">
                        <span>{st.studentName}</span>
                        {isExempt && (
                          <span className="text-[9px] bg-purple-700 text-white font-black px-1.5 py-0.2 rounded ml-1.5">
                            EXEMPT
                          </span>
                        )}
                      </td>
                      <td className="border border-slate-900 p-1 font-bold text-slate-800">
                        {st.gender === 'Girl' ? 'Girl' : 'Boy'}
                      </td>
                      {/* Fetch grade for respective subject and selected exam */}
                      {satsSubjects.map((subInfo) => {
                        const subData = cSt.subjects[subInfo.code];
                        const grade = getHpExamGrade(subData, isExempt, selectedExam);

                        return (
                          <td
                            key={subInfo.code}
                            className={`border border-slate-900 p-1 font-black ${
                              grade === 'EXEMPT'
                                ? 'bg-purple-100 text-purple-950'
                                : grade === 'A+' || grade === 'A'
                                ? 'text-emerald-800 font-mono text-sm'
                                : grade === 'B+' || grade === 'B'
                                ? 'text-blue-800 font-mono text-sm'
                                : 'text-slate-800 font-mono text-sm'
                            }`}
                          >
                            {grade}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legal Portrait Signatures Footer */}
        <div className="grid grid-cols-2 text-center text-xs font-bold text-slate-900 pt-6 border-t border-slate-400 mt-6">
          <div className="text-left pl-4">
            ವರ್ಗ ಶಿಕ್ಷಕರ ಸಹಿ<br />
            <span className="text-[10px] text-slate-600 font-normal">Class Teacher Signature</span>
          </div>
          <div className="text-right pr-4">
            ಮುಖ್ಯ ಶಿಕ್ಷಕರ ಸಹಿ & ಮೊಹರು<br />
            <span className="text-[10px] text-slate-600 font-normal">Head Master Signature & Seal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
