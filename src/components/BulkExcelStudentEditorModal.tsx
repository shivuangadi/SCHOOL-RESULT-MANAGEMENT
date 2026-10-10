import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Student,
  StudentClass,
  StudentDivision,
  StudentReligion,
  StudentCaste,
  CwsnStatus,
  SchoolRecord,
} from '../types';
import {
  saveBulkStudents,
  exportStudentsToExcel,
  getClassesFromRange,
  normalizeStudentDates,
} from '../utils/studentStore';
import { parseSatsExcel } from '../utils/satsExcelParser';
import {
  X,
  Save,
  Plus,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface BulkExcelStudentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudents: Student[];
  schoolRecord?: SchoolRecord | null;
  academicYear: string;
  diseCode: string;
  onSaveSuccess: (updated: Student[]) => void;
}

const DIVISION_OPTIONS: StudentDivision[] = ['A', 'B', 'C', 'D'];
const RELIGION_OPTIONS: StudentReligion[] = [
  'Hindu',
  'Muslim',
  'Christian',
  'Jain',
  'Sikh',
  'Buddhist',
  'Other',
];
const CASTE_OPTIONS: StudentCaste[] = [
  'SC',
  'ST',
  'Cat-1',
  '2A',
  '2B',
  '3A',
  '3B',
  'GM',
  'OBC',
  'GENERAL',
  'OTHERS',
];
const CWSN_OPTIONS: { value: CwsnStatus; label: string }[] = [
  { value: 'NO', label: 'NO (ಸಾಮಾನ್ಯ)' },
  { value: 'EXEMPTED', label: 'EXEMPTED (ಪರೀಕ್ಷಾ ವಿನಾಯಿತಿ)' },
  { value: 'MARKS_ALLOWED', label: 'MARKS_ALLOWED (ಅಂಕಗಳ ಪರಿಗಣನೆ)' },
];

export const BulkExcelStudentEditorModal: React.FC<BulkExcelStudentEditorModalProps> = ({
  isOpen,
  onClose,
  initialStudents,
  schoolRecord,
  academicYear,
  diseCode,
  onSaveSuccess,
}) => {
  const configuredClasses = useMemo(() => {
    return getClassesFromRange(schoolRecord?.schoolRange);
  }, [schoolRecord?.schoolRange]);

  const [rows, setRows] = useState<Student[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedDivFilter, setSelectedDivFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize or reset rows when modal opens or initialStudents changes
  useEffect(() => {
    if (isOpen) {
      // Deep clone initial students to allow edits without mutating props
      const cloned = initialStudents.map((s) => ({ ...s }));
      setRows(cloned);
      setFeedback(null);
    }
  }, [isOpen, initialStudents]);

  if (!isOpen) return null;

  // Update a single field on a student row
  const handleCellChange = (id: string, field: keyof Student, value: any) => {
    setRows((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Keep dob and dateOfBirth in sync
          if (field === 'dob') {
            updated.dateOfBirth = value;
          } else if (field === 'dateOfBirth') {
            updated.dob = value;
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Add a new empty row
  const handleAddNewRow = () => {
    const targetClass = (selectedClassFilter !== 'ALL' ? selectedClassFilter : configuredClasses[0] || '1') as StudentClass;
    const targetDiv = (selectedDivFilter !== 'ALL' ? selectedDivFilter : 'A') as StudentDivision;
    const newId = `std_${diseCode}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newStudent: Student = {
      id: newId,
      schoolId: diseCode,
      diseCode: diseCode,
      studentName: '',
      fatherName: '',
      motherName: '',
      classStandard: targetClass,
      division: targetDiv,
      satsNo: '',
      penNo: '',
      aadharNo: '',
      schoolRegNo: '',
      admissionDate: '01/06/2025',
      dob: '',
      dateOfBirth: '',
      religion: 'Hindu',
      caste: 'GENERAL',
      gender: 'Boy',
      cwsnStatus: 'NO',
      academicYear: academicYear,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRows((prev) => [newStudent, ...prev]);
    setFeedback({
      type: 'success',
      message: '✓ ಹೊಸ ವಿದ್ಯಾರ್ಥಿ ಸಾಲು ಸೇರಿಸಲಾಗಿದೆ! (New student row added at top)',
    });
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Interactive sorting state
  type BulkSortCol = 'default' | 'name' | 'sats' | 'class' | 'gender' | 'dob' | 'father' | 'mother';
  const [sortCol, setSortCol] = useState<BulkSortCol>('default');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleHeaderSort = (col: BulkSortCol) => {
    if (sortCol === col) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const renderSortIndicator = (col: BulkSortCol) => {
    if (sortCol !== col) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 inline-block ml-1 opacity-50" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-700 inline-block ml-1 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-700 inline-block ml-1 font-bold" />
    );
  };

  // Filter and sort rows
  const visibleRows = useMemo(() => {
    const filtered = rows.filter((st) => {
      const matchClass = selectedClassFilter === 'ALL' || st.classStandard === selectedClassFilter;
      const matchDiv = selectedDivFilter === 'ALL' || st.division === selectedDivFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        st.studentName?.toLowerCase().includes(q) ||
        st.satsNo?.toLowerCase().includes(q) ||
        st.fatherName?.toLowerCase().includes(q) ||
        st.aadharNo?.includes(q) ||
        st.penNo?.includes(q);
      return matchClass && matchDiv && matchQuery;
    });

    return [...filtered].sort((a, b) => {
      let res = 0;
      if (sortCol === 'name') {
        res = (a.studentName || '').localeCompare(b.studentName || '');
      } else if (sortCol === 'sats') {
        res = (a.satsNo || '').localeCompare(b.satsNo || '');
      } else if (sortCol === 'class') {
        const cA = parseInt(a.classStandard, 10) || 0;
        const cB = parseInt(b.classStandard, 10) || 0;
        if (cA !== cB) res = cA - cB;
        else res = (a.studentName || '').localeCompare(b.studentName || '');
      } else if (sortCol === 'gender') {
        res = (a.gender || '').localeCompare(b.gender || '');
      } else if (sortCol === 'father') {
        res = (a.fatherName || '').localeCompare(b.fatherName || '');
      } else if (sortCol === 'mother') {
        res = (a.motherName || '').localeCompare(b.motherName || '');
      } else {
        // Default rule:
        // In each class students names sort A-z
        // When all classes visible: sort class 1-10 and within class names sort A-Z
        if (selectedClassFilter === 'ALL') {
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
  }, [rows, selectedClassFilter, selectedDivFilter, searchQuery, sortCol, sortDir]);

  // Save all rows
  const handleSaveAll = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      // Validate that filled rows have names
      const validRows = rows.filter((r) => r.studentName && r.studentName.trim().length > 0);
      if (validRows.length === 0) {
        setFeedback({
          type: 'error',
          message: 'ದಯವಿಟ್ಟು ಕನಿಷ್ಠ ಒಬ್ಬ ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರನ್ನು ನಮೂದಿಸಿ (Please enter at least one student with a name).',
        });
        setIsSaving(false);
        return;
      }

      const normalizedList = validRows.map((st) => normalizeStudentDates({
        ...st,
        studentName: st.studentName.trim(),
        fatherName: (st.fatherName || '').trim(),
        motherName: (st.motherName || '').trim(),
        satsNo: (st.satsNo || '').trim(),
        schoolRegNo: (st.schoolRegNo || '').trim(),
        aadharNo: (st.aadharNo || '').trim(),
        penNo: (st.penNo || '').trim(),
        diseCode: diseCode,
        schoolId: diseCode,
        academicYear: academicYear,
      }));

      await saveBulkStudents(normalizedList, diseCode, diseCode, academicYear);
      onSaveSuccess(normalizedList);
      setFeedback({
        type: 'success',
        message: `✓ ಒಟ್ಟು ${normalizedList.length} ವಿದ್ಯಾರ್ಥಿಗಳ ವಿವರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸರ್ವರ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ! (Saved ${normalizedList.length} students successfully!)`,
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ: ${err?.message || 'Error saving bulk student data'}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Upload Excel to merge/replace
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseSatsExcel(file, diseCode, academicYear);
      if (result.students.length > 0) {
        // Merge or append parsed students
        setRows((prev) => {
          const map = new Map<string, Student>();
          prev.forEach((s) => map.set(s.id, s));
          result.students.forEach((s) => map.set(s.id, s));
          return Array.from(map.values());
        });
        setFeedback({
          type: 'success',
          message: `✓ ಎಕ್ಸೆಲ್ ಫೈಲ್‌ನಿಂದ ${result.students.length} ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗಿದೆ! ಪರಿಶೀಲಿಸಿ ಉಳಿಸಿ (Loaded ${result.students.length} students from Excel)`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'ಎಕ್ಸೆಲ್ ಫೈಲ್‌ನಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿಗಳ ವಿವರಗಳು ಕಂಡುಬಂದಿಲ್ಲ (No students found in file).',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `ಫೈಲ್ ಓದಲು ವಿಫಲವಾಗಿದೆ: ${err?.message || 'Error parsing file'}`,
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[98vw] xl:max-w-[96vw] h-[95vh] rounded-3xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-blue-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>ಸಗಟು ವಿದ್ಯಾರ್ಥಿ ಮಾಹಿತಿ ತಿದ್ದುಪಡಿ (Bulk Edit in Excel Sheet)</span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-xs font-mono border border-blue-400/30">
                  {rows.length} Students
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                {schoolRecord?.schoolName || 'School'} • ಶೈಕ್ಷಣಿಕ ಸಾಲು: {academicYear} • ಎಕ್ಸೆಲ್ ಮಾದರಿಯ ಗ್ರಿಡ್‌ನಲ್ಲಿ ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ನೇರವಾಗಿ ತಿದ್ದುಪಡಿ ಮಾಡಿ.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddNewRow}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition cursor-pointer"
              title="Add a new blank student row to edit"
            >
              <Plus className="w-4 h-4" />
              <span>+ ಹೊಸ ಸಾಲು (Add Row)</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleExcelUpload}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 border border-blue-600 transition cursor-pointer"
              title="Upload Excel to merge"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import Excel</span>
            </button>

            <button
              type="button"
              onClick={() => exportStudentsToExcel(rows, schoolRecord?.schoolName || 'School')}
              className="px-3.5 py-2 bg-blue-900/90 hover:bg-blue-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 border border-blue-700 transition cursor-pointer"
              title="Export all rows to Excel"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Save className="w-4 h-4 text-slate-950" />}
              <span>{isSaving ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'ಎಲ್ಲಾ ಬದಲಾವಣೆ ಉಳಿಸಿ (Save All)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer ml-1"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Class Filter */}
            <div className="flex items-center gap-1.5">
              <label className="font-bold text-slate-700 whitespace-nowrap">ತರಗತಿ (Class):</label>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="ALL">ಎಲ್ಲಾ ತರಗತಿಗಳು (All Classes)</option>
                {configuredClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls} ನೇ ತರಗತಿ (Class {cls})
                  </option>
                ))}
              </select>
            </div>

            {/* Division Filter */}
            <div className="flex items-center gap-1.5">
              <label className="font-bold text-slate-700 whitespace-nowrap">ವಿಭಾಗ (Sec):</label>
              <select
                value={selectedDivFilter}
                onChange={(e) => setSelectedDivFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="ALL">ಎಲ್ಲಾ (All)</option>
                {DIVISION_OPTIONS.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, SATS, Aadhaar..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 w-44 sm:w-60"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-600 font-bold">
            <span>ತೋರಿಸಲಾಗುತ್ತಿರುವ ಸಾಲುಗಳು:</span>
            <span className="font-mono font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
              {visibleRows.length} / {rows.length}
            </span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-5 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Excel Spreadsheet Table Body */}
        <div className="flex-1 overflow-auto bg-slate-50">
          <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-200 text-slate-900 font-black uppercase tracking-wider sticky top-0 z-20 border-b-2 border-slate-300 shadow-xs">
              <tr>
                <th
                  onClick={() => handleHeaderSort('default')}
                  className="p-2 border-r border-slate-300 text-center w-12 bg-slate-200 sticky left-0 z-30 cursor-pointer select-none hover:bg-slate-300"
                  title="Reset class & alphabetical order"
                >
                  #
                </th>
                <th
                  onClick={() => handleHeaderSort('sats')}
                  className="p-2 border-r border-slate-300 min-w-[120px] bg-slate-200 sticky left-12 z-30 cursor-pointer select-none hover:bg-slate-300"
                  title="Click to sort by SATS number"
                >
                  <span>ಸ್ಯಾಟ್ಸ್ ಸಂಖ್ಯೆ (SATS No)</span>
                  {renderSortIndicator('sats')}
                </th>
                <th
                  onClick={() => handleHeaderSort('name')}
                  className="p-2 border-r border-slate-300 min-w-[200px] bg-slate-200 sticky left-[168px] z-30 cursor-pointer select-none hover:bg-slate-300"
                  title="Click to sort alphabetically (A-Z / Z-A)"
                >
                  <span>ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು (Student Name) *</span>
                  {renderSortIndicator('name')}
                </th>
                <th
                  onClick={() => handleHeaderSort('gender')}
                  className="p-2 border-r border-slate-300 min-w-[90px] cursor-pointer select-none hover:bg-slate-300"
                  title="Click to sort by Gender"
                >
                  <span>ಲಿಂಗ (Gender) *</span>
                  {renderSortIndicator('gender')}
                </th>
                <th
                  onClick={() => handleHeaderSort('class')}
                  className="p-2 border-r border-slate-300 min-w-[80px] cursor-pointer select-none hover:bg-slate-300"
                  title="Click to sort by Class (1-10 / 10-1)"
                >
                  <span>ತರಗತಿ (Class) *</span>
                  {renderSortIndicator('class')}
                </th>
                <th className="p-2 border-r border-slate-300 min-w-[70px]">ವಿಭಾಗ (Sec)</th>
                <th
                  onClick={() => handleHeaderSort('father')}
                  className="p-2 border-r border-slate-300 min-w-[170px] cursor-pointer select-none hover:bg-slate-300"
                  title="Click to sort by Father Name"
                >
                  <span>ತಂದೆಯ ಹೆಸರು (Father Name)</span>
                  {renderSortIndicator('father')}
                </th>
                <th
                  onClick={() => handleHeaderSort('mother')}
                  className="p-2 border-r border-slate-300 min-w-[170px] cursor-pointer select-none hover:bg-slate-300"
                  title="Click to sort by Mother Name"
                >
                  <span>ತಾಯಿಯ ಹೆಸರು (Mother Name)</span>
                  {renderSortIndicator('mother')}
                </th>
                <th className="p-2 border-r border-slate-300 min-w-[110px]">ಜನ್ಮ ದಿನಾಂಕ (DOB)</th>
                <th className="p-2 border-r border-slate-300 min-w-[110px]">ದಾಖಲಾತಿ ದಿನಾಂಕ (Adm Date)</th>
                <th className="p-2 border-r border-slate-300 min-w-[120px]">ದಾಖಲಾತಿ ಸಂ. (Reg No)</th>
                <th className="p-2 border-r border-slate-300 min-w-[130px]">ಆಧಾರ್ ಸಂಖ್ಯೆ (Aadhaar)</th>
                <th className="p-2 border-r border-slate-300 min-w-[120px]">ಪೆನ್ ಸಂಖ್ಯೆ (PEN No)</th>
                <th className="p-2 border-r border-slate-300 min-w-[110px]">ಧರ್ಮ (Religion)</th>
                <th className="p-2 border-r border-slate-300 min-w-[120px]">ಪ್ರವರ್ಗ (Caste/Category)</th>
                <th className="p-2 border-r border-slate-300 min-w-[120px]">ಉಪಜಾತಿ (Sub-caste)</th>
                <th className="p-2 border-r border-slate-300 min-w-[160px]">CWSN ಸ್ಥಿತಿ</th>
                <th className="p-2 text-center w-12 sticky right-0 bg-slate-200 z-20">ಕ್ರಿಯೆ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={18} className="py-12 text-center text-slate-500 font-bold">
                    ವಿದ್ಯಾರ್ಥಿಗಳ ವಿವರಗಳು ಕಂಡುಬಂದಿಲ್ಲ (No students matched the criteria).
                  </td>
                </tr>
              ) : (
                visibleRows.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-blue-50/60 transition group">
                    {/* Index */}
                    <td className="p-1 border-r border-slate-200 text-center font-mono font-bold text-slate-500 bg-slate-50 group-hover:bg-blue-50/80 sticky left-0 z-10">
                      {idx + 1}
                    </td>

                    {/* SATS No */}
                    <td className="p-1 border-r border-slate-200 bg-white group-hover:bg-blue-50/40 sticky left-12 z-10">
                      <input
                        type="text"
                        value={st.satsNo || ''}
                        onChange={(e) => handleCellChange(st.id, 'satsNo', e.target.value)}
                        placeholder="SATS No"
                        className="w-full px-2 py-1 font-mono font-bold text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-lg focus:outline-none"
                      />
                    </td>

                    {/* Student Name */}
                    <td className="p-1 border-r border-slate-200 bg-white group-hover:bg-blue-50/40 sticky left-[168px] z-10">
                      <input
                        type="text"
                        value={st.studentName || ''}
                        onChange={(e) => handleCellChange(st.id, 'studentName', e.target.value)}
                        placeholder="Student Name *"
                        className="w-full px-2 py-1 font-black text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-lg focus:outline-none uppercase"
                        required
                      />
                    </td>

                    {/* Gender */}
                    <td className="p-1 border-r border-slate-200">
                      <select
                        value={st.gender || 'Boy'}
                        onChange={(e) => handleCellChange(st.id, 'gender', e.target.value as 'Boy' | 'Girl')}
                        className="w-full px-2 py-1 font-bold text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="Boy">Boy (ಗಂಡು)</option>
                        <option value="Girl">Girl (ಹೆಣ್ಣು)</option>
                      </select>
                    </td>

                    {/* Class */}
                    <td className="p-1 border-r border-slate-200">
                      <select
                        value={st.classStandard}
                        onChange={(e) => handleCellChange(st.id, 'classStandard', e.target.value as StudentClass)}
                        className="w-full px-2 py-1 font-black text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg focus:outline-none bg-transparent cursor-pointer font-mono"
                      >
                        {configuredClasses.map((cls) => (
                          <option key={cls} value={cls}>
                            Class {cls}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Division */}
                    <td className="p-1 border-r border-slate-200">
                      <select
                        value={st.division || 'A'}
                        onChange={(e) => handleCellChange(st.id, 'division', e.target.value as StudentDivision)}
                        className="w-full px-2 py-1 font-bold text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg focus:outline-none bg-transparent cursor-pointer text-center font-mono"
                      >
                        {DIVISION_OPTIONS.map((div) => (
                          <option key={div} value={div}>
                            {div}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Father Name */}
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="text"
                        value={st.fatherName || ''}
                        onChange={(e) => handleCellChange(st.id, 'fatherName', e.target.value)}
                        placeholder="Father Name"
                        className="w-full px-2 py-1 font-bold text-slate-800 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg focus:outline-none uppercase"
                      />
                    </td>

                    {/* Mother Name */}
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="text"
                        value={st.motherName || ''}
                        onChange={(e) => handleCellChange(st.id, 'motherName', e.target.value)}
                        placeholder="Mother Name"
                        className="w-full px-2 py-1 font-bold text-slate-800 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg focus:outline-none uppercase"
                      />
                    </td>

                    {/* DOB */}
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="text"
                        value={st.dob || st.dateOfBirth || ''}
                        onChange={(e) => handleCellChange(st.id, 'dob', e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className="w-full px-2 py-1 font-mono font-bold text-slate-800 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg focus:outline-none"
                      />
                    </td>

                    {/* Admission Date */}
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="text"
                        value={st.admissionDate || '01/06/2025'}
                        onChange={(e) => handleCellChange(st.id, 'admissionDate', e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className="w-full px-2 py-1 font-mono font-bold text-slate-800 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg focus:outline-none"
                      />
                    </td>

                    {/* Reg No */}
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="text"
                        value={st.schoolRegNo || ''}
                        onChange={(e) => handleCellChange(st.id, 'schoolRegNo', e.target.value)}
                        placeholder="Reg No"
                        className="w-full px-2 py-1 font-mono font-bold text-slate-800 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg focus:outline-none"
                      />
                    </td>

                    {/* Aadhaar */}
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="text"
                        value={st.aadharNo || ''}
                        onChange={(e) => handleCellChange(st.id, 'aadharNo', e.target.value)}
                        placeholder="12 Digit Aadhaar"
                        maxLength={12}
                        className="w-full px-2 py-1 font-mono font-bold text-slate-800 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg focus:outline-none"
                      />
                    </td>

                    {/* PEN No */}
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="text"
                        value={st.penNo || ''}
                        onChange={(e) => handleCellChange(st.id, 'penNo', e.target.value)}
                        placeholder="PEN No"
                        className="w-full px-2 py-1 font-mono font-bold text-slate-800 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg focus:outline-none"
                      />
                    </td>

                    {/* Religion */}
                    <td className="p-1 border-r border-slate-200">
                      <select
                        value={st.religion || 'Hindu'}
                        onChange={(e) => handleCellChange(st.id, 'religion', e.target.value as StudentReligion)}
                        className="w-full px-2 py-1 font-bold text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg focus:outline-none bg-transparent cursor-pointer"
                      >
                        {RELIGION_OPTIONS.map((rel) => (
                          <option key={rel} value={rel}>
                            {rel}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Caste */}
                    <td className="p-1 border-r border-slate-200">
                      <select
                        value={st.caste || 'GENERAL'}
                        onChange={(e) => handleCellChange(st.id, 'caste', e.target.value as StudentCaste)}
                        className="w-full px-2 py-1 font-black text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg focus:outline-none bg-transparent cursor-pointer font-mono"
                      >
                        {CASTE_OPTIONS.map((cst) => (
                          <option key={cst} value={cst}>
                            {cst}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Custom Caste */}
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="text"
                        value={st.customCaste || ''}
                        onChange={(e) => handleCellChange(st.id, 'customCaste', e.target.value)}
                        placeholder="Sub-caste"
                        className="w-full px-2 py-1 font-bold text-slate-800 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg focus:outline-none uppercase"
                      />
                    </td>

                    {/* CWSN Status */}
                    <td className="p-1 border-r border-slate-200">
                      <select
                        value={st.cwsnStatus || 'NO'}
                        onChange={(e) => handleCellChange(st.id, 'cwsnStatus', e.target.value as CwsnStatus)}
                        className="w-full px-2 py-1 font-bold text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg focus:outline-none bg-transparent cursor-pointer"
                      >
                        {CWSN_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Delete Row */}
                    <td className="p-1 text-center sticky right-0 bg-white group-hover:bg-blue-50/80 z-10">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(st.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Delete student row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Status Bar */}
        <div className="bg-slate-100 px-5 py-2.5 border-t border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-700 shrink-0">
          <div className="flex items-center gap-4">
            <span>ಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು (Total): <span className="font-mono font-black text-slate-900">{rows.length}</span></span>
            <span>ಬಾಲಕರು (Boys): <span className="font-mono font-black text-blue-900">{rows.filter((s) => s.gender === 'Boy' || !s.gender).length}</span></span>
            <span>ಬಾಲಕಿಯರು (Girls): <span className="font-mono font-black text-pink-900">{rows.filter((s) => s.gender === 'Girl').length}</span></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition cursor-pointer"
            >
              ರದ್ದುಮಾಡಿ (Cancel)
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : '✓ ಉಳಿಸಿ (Save All Changes)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
