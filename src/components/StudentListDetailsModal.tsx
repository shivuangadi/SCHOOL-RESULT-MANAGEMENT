import React, { useState, useMemo, useRef } from 'react';
import { Student, SchoolRecord } from '../types';
import * as XLSX from 'xlsx';
import {
  X,
  Printer,
  FileSpreadsheet,
  Download,
  Search,
  Users,
  CheckCircle2,
  Calendar,
  School,
  Hash,
  Share2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { openCleanPrintWindow, shareReportToWhatsApp, downloadElementAsPdf } from '../utils/printPdfHelper';
import { CwsnBadge } from './CwsnBadge';
import { StudentPhotoImg } from './StudentPhotoImg';

interface StudentListDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  students: Student[];
  schoolRecord: SchoolRecord | null;
}

export const StudentListDetailsModal: React.FC<StudentListDetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  students,
  schoolRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const printableRef = useRef<HTMLDivElement>(null);

  const diseCode = schoolRecord?.diseCode || '';
  const schoolName = schoolRecord?.schoolName || 'Govt School';
  const taluk = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
  const medium = schoolRecord?.schoolMedium || schoolRecord?.medium || '';
  const isKannada =
    medium.includes('ಕನ್ನಡ') ||
    medium.toLowerCase().includes('kannada') ||
    !medium;

  // Interactive column sorting state
  type DetailsModalSortCol = 'default' | 'name' | 'sats' | 'dob' | 'reg' | 'class' | 'gender' | 'caste' | 'father' | 'mother' | 'mobile';
  const [sortCol, setSortCol] = useState<DetailsModalSortCol>('default');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleHeaderSort = (col: DetailsModalSortCol) => {
    if (sortCol === col) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const parseDobToTimestamp = (dobStr?: string): number => {
    if (!dobStr) return -1;
    const s = dobStr.trim();
    const dmyMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? -1 : d.getTime();
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? -1 : d.getTime();
  };

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!students || students.length === 0) return [];
    let list = students;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = students.filter((s) => {
        return (
          (s.studentName && s.studentName.toLowerCase().includes(q)) ||
          (s.satsNo && s.satsNo.toLowerCase().includes(q)) ||
          (s.fatherName && s.fatherName.toLowerCase().includes(q)) ||
          (s.schoolRegNo && s.schoolRegNo.toLowerCase().includes(q)) ||
          (s.aadharNo && s.aadharNo.includes(q))
        );
      });
    }

    // Check if multiple classes are represented in the list
    const classSet = new Set(list.map((s) => s.classStandard).filter(Boolean));
    const isMultipleClasses = classSet.size > 1;

    return [...list].sort((a, b) => {
      let res = 0;
      if (sortCol === 'name') {
        res = (a.studentName || '').localeCompare(b.studentName || '');
      } else if (sortCol === 'sats') {
        res = (a.satsNo || '').localeCompare(b.satsNo || '');
      } else if (sortCol === 'dob') {
        const tA = parseDobToTimestamp(a.dob || a.dateOfBirth);
        const tB = parseDobToTimestamp(b.dob || b.dateOfBirth);
        if (tA === -1 && tB === -1) res = 0;
        else if (tA === -1) res = 1;
        else if (tB === -1) res = -1;
        else res = tA - tB;
      } else if (sortCol === 'reg') {
        res = (a.schoolRegNo || '').localeCompare(b.schoolRegNo || '');
      } else if (sortCol === 'class') {
        const cA = parseInt(a.classStandard, 10) || 0;
        const cB = parseInt(b.classStandard, 10) || 0;
        if (cA !== cB) res = cA - cB;
        else res = (a.studentName || '').localeCompare(b.studentName || '');
      } else if (sortCol === 'gender') {
        res = (a.gender || '').localeCompare(b.gender || '');
      } else if (sortCol === 'caste') {
        res = (a.caste || '').localeCompare(b.caste || '');
      } else if (sortCol === 'father') {
        res = (a.fatherName || '').localeCompare(b.fatherName || '');
      } else if (sortCol === 'mother') {
        res = (a.motherName || '').localeCompare(b.motherName || '');
      } else if (sortCol === 'mobile') {
        res = (a.mobile || a.contactNumber || '').localeCompare(b.mobile || b.contactNumber || '');
      } else {
        // Default rule:
        // In each class students names sort A-z
        // When all classes visible: sort class 1-10 and within class names sort A-Z
        if (isMultipleClasses) {
          const cA = parseInt(a.classStandard, 10) || 0;
          const cB = parseInt(b.classStandard, 10) || 0;
          if (cA !== cB) {
            res = cA - cB;
          } else {
            res = (a.studentName || '').localeCompare(b.studentName || '');
          }
        } else {
          res = (a.studentName || '').localeCompare(b.studentName || '');
        }
      }

      if (res === 0 && sortCol !== 'name') {
        res = (a.studentName || '').localeCompare(b.studentName || '');
      }

      return sortDir === 'asc' ? res : -res;
    });
  }, [students, searchQuery, sortCol, sortDir]);

  const renderSortIndicator = (col: DetailsModalSortCol) => {
    if (sortCol !== col) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 inline-block ml-1 opacity-50 print:hidden" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-700 inline-block ml-1 font-bold print:hidden" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-700 inline-block ml-1 font-bold print:hidden" />
    );
  };

  if (!isOpen) return null;

  // Export to Excel handler
  const handleExportToExcel = () => {
    try {
      const rows = filteredStudents.map((st, idx) => ({
        'Sl. No': idx + 1,
        'Student Name': st.studentName,
        'SATS Number': st.satsNo || 'N/A',
        'Date of Birth (DOB)': st.dob || st.dateOfBirth || 'N/A',
        'School Reg No': st.schoolRegNo || 'N/A',
        'Class': st.classStandard,
        'Section / Div': st.division || 'A',
        'Gender': st.gender || 'N/A',
        'Caste / Category': st.caste || 'GENERAL',
        'Religion': st.religion || 'Hindu',
        'Father Name': st.fatherName || '-',
        'Mother Name': st.motherName || '-',
        'Admission Date': st.admissionDate || 'N/A',
        'DISE Code': st.diseCode || diseCode,
      }));

      const ws = XLSX.utils.json_to_sheet(rows);

      // Auto-fit column widths
      const colWidths = [
        { wch: 8 },  // Sl. No
        { wch: 25 }, // Name
        { wch: 16 }, // SATS
        { wch: 14 }, // DOB
        { wch: 16 }, // Reg No
        { wch: 8 },  // Class
        { wch: 8 },  // Div
        { wch: 10 }, // Gender
        { wch: 16 }, // Caste
        { wch: 12 }, // Religion
        { wch: 22 }, // Father
        { wch: 20 }, // Mother
        { wch: 14 }, // Admission Date
        { wch: 14 }, // DISE
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Student Details');

      const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      const filename = `${safeTitle}_${diseCode}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('Export to Excel error:', err);
      alert('Failed to export to Excel. Please try again.');
    }
  };

  // Print handler (Legal Paper Size)
  const handlePrint = () => {
    if (printableRef.current) {
      openCleanPrintWindow(printableRef.current, `${title} - ${schoolName}`);
    } else {
      window.print();
    }
  };

  // Dedicated PDF Export handler
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const handleDownloadPdf = async () => {
    if (!printableRef.current) return;
    try {
      setIsExportingPdf(true);
      const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      await downloadElementAsPdf(printableRef.current, `${safeTitle}_${diseCode}`);
    } catch (err) {
      console.error('PDF Export error, opening print fallback:', err);
      handlePrint();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
                <span>{title}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-800 text-blue-200 border border-blue-600">
                  {filteredStudents.length} Students
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {subtitle || `${schoolName} • DISE: ${diseCode} • ತಾಲೂಕು: ${taluk}`}
              </p>
            </div>
          </div>

          {/* Action Buttons in Different Distinct Colors with Mouse Hover Color Transitions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Print Button (Blue -> Dark Indigo on hover) */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-900 active:bg-blue-950 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-md hover:shadow-xl transition-colors duration-200 transform hover:-translate-y-0.5 cursor-pointer border border-blue-400"
              title="Print Student List (ಮುದ್ರಿಸಿ - Legal Size Format)"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Print (ಮುದ್ರಿಸಿ)</span>
            </button>

            {/* 2. Export to PDF Button (Crimson Red -> Deep Burgundy on hover) */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-900 active:bg-rose-950 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-md hover:shadow-xl transition-colors duration-200 transform hover:-translate-y-0.5 cursor-pointer border border-rose-400"
              title="Download Student List as PDF (ಪಿಡಿಎಫ್ ಡೌನ್‌ಲೋಡ್)"
            >
              <Download className="w-4 h-4 text-white" />
              <span>{isExportingPdf ? 'Exporting PDF...' : 'Export to PDF (ಪಿಡಿಎಫ್)'}</span>
            </button>

            {/* 3. Export to Excel Button (Emerald Green -> Deep Forest on hover) */}
            <button
              type="button"
              onClick={handleExportToExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-900 active:bg-emerald-950 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-md hover:shadow-xl transition-colors duration-200 transform hover:-translate-y-0.5 cursor-pointer border border-emerald-400"
              title="Download full student details list in Excel (.xlsx) format"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>Export to Excel (ಎಕ್ಸೆಲ್)</span>
            </button>

            {/* 4. WhatsApp Share Button (Vibrant WhatsApp Green -> Dark Green on hover) */}
            <button
              type="button"
              onClick={async () => {
                const summary = `*${title}*\n🏫 ಶಾಲೆ: ${schoolName}\n📍 ತಾಲೂಕು: ${taluk} (DISE: ${diseCode})\n👥 ವಿದ್ಯಾರ್ಥಿಗಳ ಸಂಖ್ಯೆ: ${filteredStudents.length}\nಬಾಲಕರು: ${filteredStudents.filter((s) => s.gender === 'Boy' || !s.gender).length} | ಬಾಲಕಿಯರು: ${filteredStudents.filter((s) => s.gender === 'Girl').length}`;
                await shareReportToWhatsApp(printableRef.current, summary, `Student_List_${title}`);
              }}
              className="px-3.5 py-2 bg-[#25D366] hover:bg-[#128C7E] active:bg-[#075E54] text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md hover:shadow-xl transition-colors duration-200 transform hover:-translate-y-0.5 cursor-pointer border border-emerald-400"
              title="Share Student List to WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            {/* 5. Close Button (Slate -> Deep Black on hover) */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-950 active:bg-black text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer shadow-md border border-slate-600"
              aria-label="Close"
              title="Close window (ಮುಚ್ಚಿ)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar (Hidden in Print) */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden text-xs">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, SATS no, father name, or reg no..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <span>Showing: <strong className="text-slate-900 font-mono">{filteredStudents.length}</strong> of <strong className="text-slate-900 font-mono">{students.length}</strong></span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-blue-600 hover:underline text-[11px] font-bold"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>

        {/* Printable Student Details Content Container */}
        <div ref={printableRef} className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white print:p-2 text-slate-900">
          {/* Official Karnataka Education Heading (Only Visible in Print) */}
          <div className="hidden print:block text-center border-b-2 border-slate-900 pb-3 mb-4 space-y-1">
            <div className="text-xs uppercase font-bold text-slate-700">
              ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ
            </div>
            {isKannada && (
              <div className="text-sm font-black text-slate-900">
                ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ {taluk}
              </div>
            )}
            <div className="text-base font-extrabold text-blue-950">
              {schoolName} (DISE: {diseCode})
            </div>
            <div className="text-xs font-bold text-slate-800 underline uppercase tracking-wide">
              {title} • ಶೈಕ್ಷಣಿಕ ಸಾಲು: ೨೦೨೫-೨೬
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-sm">No students found matching your criteria.</p>
              <p className="text-xs text-slate-400 mt-1">Try changing or clearing your search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                <thead className="bg-slate-100 text-slate-900 font-black uppercase text-[11px] tracking-wider border-b-2 border-slate-400">
                  <tr>
                    <th
                      onClick={() => handleHeaderSort('default')}
                      className="py-2.5 px-2 border-r border-slate-300 w-10 text-center cursor-pointer select-none hover:bg-slate-200 transition"
                      title="Reset standard class & alphabetical sorting"
                    >
                      #
                    </th>
                    <th
                      onClick={() => handleHeaderSort('name')}
                      className="py-2.5 px-3 border-r border-slate-300 min-w-[150px] cursor-pointer select-none hover:bg-slate-200 transition"
                      title="Click to sort by Student Name (A-Z / Z-A)"
                    >
                      <span>Student Name (ಹೆಸರು)</span>
                      {renderSortIndicator('name')}
                    </th>
                    <th
                      onClick={() => handleHeaderSort('sats')}
                      className="py-2.5 px-3 border-r border-slate-300 font-mono w-28 cursor-pointer select-none hover:bg-slate-200 transition"
                      title="Click to sort by SATS Number"
                    >
                      <span>SATS Number</span>
                      {renderSortIndicator('sats')}
                    </th>
                    <th
                      onClick={() => handleHeaderSort('dob')}
                      className="py-2.5 px-3 border-r border-slate-300 font-mono w-24 cursor-pointer select-none hover:bg-slate-200 transition"
                      title="Click to sort by Date of Birth (oldest to newest / newest to oldest)"
                    >
                      <span>DOB (ಜನ್ಮ ದಿನಾಂಕ)</span>
                      {renderSortIndicator('dob')}
                    </th>
                    <th
                      onClick={() => handleHeaderSort('reg')}
                      className="py-2.5 px-3 border-r border-slate-300 font-mono w-24 cursor-pointer select-none hover:bg-slate-200 transition"
                      title="Click to sort by School Register Number"
                    >
                      <span>Reg No (ದಾಖಲಾತಿ)</span>
                      {renderSortIndicator('reg')}
                    </th>
                    <th
                      onClick={() => handleHeaderSort('class')}
                      className="py-2.5 px-2 border-r border-slate-300 text-center w-16 cursor-pointer select-none hover:bg-slate-200 transition"
                      title="Click to sort by Class (1-10 / 10-1)"
                    >
                      <span>Class</span>
                      {renderSortIndicator('class')}
                    </th>
                    <th
                      onClick={() => handleHeaderSort('gender')}
                      className="py-2.5 px-2 border-r border-slate-300 text-center w-16 cursor-pointer select-none hover:bg-slate-200 transition"
                      title="Click to sort by Gender"
                    >
                      <span>Gender (ಲಿಂಗ)</span>
                      {renderSortIndicator('gender')}
                    </th>
                    <th
                      onClick={() => handleHeaderSort('caste')}
                      className="py-2.5 px-2.5 border-r border-slate-300 w-24 cursor-pointer select-none hover:bg-slate-200 transition"
                      title="Click to sort by Caste / Category"
                    >
                      <span>Caste / Cat</span>
                      {renderSortIndicator('caste')}
                    </th>
                    <th
                      onClick={() => handleHeaderSort('father')}
                      className="py-2.5 px-3 border-r border-slate-300 min-w-[130px] cursor-pointer select-none hover:bg-slate-200 transition"
                      title="Click to sort by Father Name"
                    >
                      <span>Father Name (ತಂದೆ)</span>
                      {renderSortIndicator('father')}
                    </th>
                    <th
                      onClick={() => handleHeaderSort('mother')}
                      className="py-2.5 px-3 border-r border-slate-300 min-w-[120px] cursor-pointer select-none hover:bg-slate-200 transition"
                      title="Click to sort by Mother Name"
                    >
                      <span>Mother Name (ತಾಯಿ)</span>
                      {renderSortIndicator('mother')}
                    </th>
                    <th
                      onClick={() => handleHeaderSort('mobile')}
                      className="py-2.5 px-2.5 min-w-[90px] font-mono cursor-pointer select-none hover:bg-slate-200 transition"
                      title="Click to sort by Mobile Number"
                    >
                      <span>Mobile (ದೂರವಾಣಿ)</span>
                      {renderSortIndicator('mobile')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredStudents.map((st, idx) => (
                    <tr key={st.id || idx} className="hover:bg-blue-50/50 transition">
                      <td className="py-2 px-2 border-r border-slate-200 text-center font-bold text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 whitespace-nowrap leading-tight">
                          <StudentPhotoImg
                            student={st}
                            className="w-7 h-9 rounded object-cover border border-slate-300 shadow-2xs shrink-0 bg-white"
                            fallback={null}
                          />
                          <span>{st.studentName}</span>
                          <CwsnBadge status={st.cwsnStatus} />
                        </div>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-blue-900 font-bold">
                        {st.satsNo || '-'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-700 whitespace-nowrap">
                        {st.dob || st.dateOfBirth || '-'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-700 whitespace-nowrap">
                        {st.schoolRegNo || '-'}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-200 text-center font-bold text-slate-800">
                        {st.classStandard} {st.division ? `(${st.division})` : ''}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-200 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.gender === 'Girl'
                            ? 'bg-pink-100 text-pink-900 border border-pink-200'
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}>
                          {st.gender === 'Girl' ? '👧 Girl' : '👦 Boy'}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 font-bold text-slate-800">
                        {st.caste || 'GM'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-800">
                        {st.fatherName || '-'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-800">
                        {st.motherName || '-'}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-slate-700 text-[11px]">
                        {st.mobile || st.contactNumber || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-black border-t-2 border-slate-400">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 text-slate-900">
                      Total Count: {filteredStudents.length} Students
                    </td>
                    <td colSpan={8} className="py-2.5 px-3 text-right text-slate-600 font-normal">
                      👦 Boys: {filteredStudents.filter((s) => s.gender === 'Boy' || !s.gender).length} • 👧 Girls: {filteredStudents.filter((s) => s.gender === 'Girl').length}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Official Signatures for Print View */}
          <div className="hidden print:flex items-center justify-between pt-12 mt-8 text-xs font-bold text-slate-900">
            <div className="text-center">
              <div className="w-40 border-t border-slate-900 pt-1">ತರಗತಿ ಶಿಕ್ಷಕರ ಸಹಿ</div>
              <div className="text-[10px] text-slate-500 font-normal">Class Teacher Signature</div>
            </div>
            <div className="text-center">
              <div className="w-48 border-t border-slate-900 pt-1">ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಸಹಿ & ಮೊಹರು</div>
              <div className="text-[10px] text-slate-500 font-normal">Headmaster Signature & Seal</div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3 px-6 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0 print:hidden text-xs">
          <span className="text-slate-600 font-medium">
            Document generated in Legal Print Ready Format • CCE Karnataka Education Portal
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
