import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, SchoolRecord, StudentExamMarks } from '../types';
import {
  computeStudentCceDetails,
  generateDefaultPrimaryMarks,
  ComputedStudentCce,
  exportHtmlTableToExcel,
  extractLastWordOfSchoolName,
  PrimarySubjectCode,
  distribute100MarksIntoSubject,
} from '../utils/primaryCceHelper';
import {
  loadSchoolMarks,
  saveStudentMarks,
  subscribeSchoolMarks,
} from '../utils/marksStore';
import {
  executeReportPrint,
  downloadElementAsPdf,
  exportElementAsImage,
  shareReportToWhatsApp,
} from '../utils/printPdfHelper';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Share2,
  X,
  Calendar,
  Layers,
  BookOpen,
  Award,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

import { CcePage2Register } from './primary_cce/CcePage2Register';
import { CcePage3ClassGrade } from './primary_cce/CcePage3ClassGrade';
import { CcePage4Detailed400 } from './primary_cce/CcePage4Detailed400';
import { CcePage5AllClassGrade } from './primary_cce/CcePage5AllClassGrade';
import { CcePage6Abstract } from './primary_cce/CcePage6Abstract';
import { MarathiUrduCcePage2Register } from './marathi_urdu_cce/MarathiUrduCcePage2Register';
import { MarathiUrduCcePage3ClassGrade } from './marathi_urdu_cce/MarathiUrduCcePage3ClassGrade';
import { MarathiUrduCcePage4Detailed500 } from './marathi_urdu_cce/MarathiUrduCcePage4Detailed500';
import { MarathiUrduCcePage5AllClassGrade } from './marathi_urdu_cce/MarathiUrduCcePage5AllClassGrade';
import { MarathiUrduCcePage6Abstract } from './marathi_urdu_cce/MarathiUrduCcePage6Abstract';
import { SatsReport } from './marathi_urdu_cce/SatsReport';
import { computeMarathiUrduStudentCce, ComputedMarathiUrduStudent } from '../utils/marathiUrduCceHelper';

interface PrimaryCceReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolRecord: SchoolRecord | null;
  academicYear?: string;
  initialTab?: PrimaryReportTabKey;
}

export type PrimaryReportTabKey = 'page2' | 'page3' | 'page4' | 'page5' | 'page6' | 'sats';

export const PrimaryCceReportsModal: React.FC<PrimaryCceReportsModalProps> = ({
  isOpen,
  onClose,
  students,
  schoolRecord,
  academicYear = '2026-27',
  initialTab = 'page4',
}) => {
  if (!isOpen) return null;

  const diseCode = schoolRecord?.diseCode || '29010409301';
  const schoolMedium = schoolRecord?.schoolMedium || 'Kannada';

  // Active Report Tab: page 2, 3, 4, 5, 6
  const [activeTab, setActiveTab] = useState<PrimaryReportTabKey>(initialTab);

  // Selected Class strictly 1 to 5
  const [selectedClass, setSelectedClass] = useState<string>('3');

  // Class Teacher Name & Working Days state
  const [classTeacherName, setClassTeacherName] = useState<string>(() => {
    return localStorage.getItem(`kseab_ct_name_${diseCode}_${selectedClass}`) || 'ಶ್ರೀ ಎಸ್ ಆರ್ ಅಂಗಡಿ';
  });

  const [workingDays, setWorkingDays] = useState<number>(() => {
    const saved = localStorage.getItem(`kseab_working_days_${diseCode}_${academicYear}`);
    return saved ? Number(saved) : 220;
  });

  // Real-time marks state
  const [marksMap, setMarksMap] = useState<Record<string, StudentExamMarks>>({});
  const reportRef = useRef<HTMLDivElement | null>(null);

  // Load marks from store or generate initial realistic defaults
  useEffect(() => {
    loadSchoolMarks(diseCode, diseCode, academicYear).then((loaded) => {
      setMarksMap(loaded || {});
    });

    const unsub = subscribeSchoolMarks(
      diseCode,
      (updated) => {
        setMarksMap((prev) => ({ ...prev, ...updated }));
      },
      academicYear
    );

    return () => unsub();
  }, [diseCode, academicYear]);

  // Compute detailed CCE records for all students across classes 1 to 5
  const studentsByClass = useMemo(() => {
    const map: Record<string, ComputedStudentCce[]> = {
      '1': [],
      '2': [],
      '3': [],
      '4': [],
      '5': [],
    };

    ['1', '2', '3', '4', '5'].forEach((cls) => {
      const classSt = students
        .filter((s) => s.classStandard === cls)
        .sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
      map[cls] = classSt.map((st) => {
        let m = marksMap[st.id];
        if (!m) {
          m = generateDefaultPrimaryMarks(st);
        }
        return computeStudentCceDetails(st, m);
      });
    });

    return map;
  }, [students, marksMap]);

  // Current class computed list
  const currentClassComputedList = useMemo(() => {
    return studentsByClass[selectedClass] || [];
  }, [studentsByClass, selectedClass]);

  const isMarathiOrUrdu =
    schoolMedium === 'Marathi' ||
    schoolMedium === 'Urdu' ||
    students.some(
      (s) => s.medium?.toLowerCase() === 'marathi' || s.medium?.toLowerCase() === 'urdu'
    );
  const marathiUrduMedium: 'Marathi' | 'Urdu' = schoolMedium === 'Urdu' ? 'Urdu' : 'Marathi';

  const marathiUrduStudentsByClass = useMemo(() => {
    const map: Record<string, ComputedMarathiUrduStudent[]> = {
      '1': [],
      '2': [],
      '3': [],
      '4': [],
      '5': [],
    };

    ['1', '2', '3', '4', '5'].forEach((cls) => {
      const classSt = students
        .filter((s) => s.classStandard === cls)
        .sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
      map[cls] = classSt.map((st) => {
        const m = marksMap[st.id] || null;
        return computeMarathiUrduStudentCce(st, marathiUrduMedium, m);
      });
    });

    return map;
  }, [students, marksMap, marathiUrduMedium]);

  const currentClassMarathiUrduList = useMemo(() => {
    return marathiUrduStudentsByClass[selectedClass] || [];
  }, [marathiUrduStudentsByClass, selectedClass]);

  // 2-Way Synchronized Subject 100-Marks Handler
  const handleUpdateSubject100 = (studentId: string, subCode: PrimarySubjectCode, total100: number | null | undefined) => {
    const st = students.find((s) => s.id === studentId);
    if (!st) return;

    const existing = marksMap[studentId] || generateDefaultPrimaryMarks(st);
    const currentSubjects = existing.subjects || {};

    if (total100 === null || total100 === undefined || (total100 as any) === '') {
      const updatedMarks: StudentExamMarks = {
        ...existing,
        studentId,
        diseCode,
        academicYear,
        subjects: {
          ...currentSubjects,
          [subCode]: {
            ...(currentSubjects[subCode] || {}),
            code: subCode,
            total: null as any,
            fa1: null,
            fa1_pct: null,
            fa2: null,
            fa2_pct: null,
            sa1: null,
            sa1_pct: null,
            fa3: null,
            fa3_pct: null,
            fa4: null,
            fa4_pct: null,
            sa2: null,
            sa2_pct: null,
          },
        },
      };

      setMarksMap((prev) => ({ ...prev, [studentId]: updatedMarks }));
      saveStudentMarks(diseCode, diseCode, updatedMarks, academicYear).catch(() => {});
      return;
    }

    const distributed = distribute100MarksIntoSubject(Number(total100), subCode);

    const updatedMarks: StudentExamMarks = {
      ...existing,
      studentId,
      diseCode,
      academicYear,
      subjects: {
        ...currentSubjects,
        [subCode]: {
          ...(currentSubjects[subCode] || {}),
          ...distributed,
        },
      },
    };

    setMarksMap((prev) => ({ ...prev, [studentId]: updatedMarks }));
    saveStudentMarks(diseCode, diseCode, updatedMarks, academicYear).catch(() => {});
  };

  // Handle Mark Update in Page 4 (FA1-4, SA1-2)
  const handleUpdateMarks = (
    studentId: string,
    subCode: PrimarySubjectCode,
    field: string,
    val: number | null | undefined
  ) => {
    const st = students.find((s) => s.id === studentId);
    if (!st) return;

    const existing = marksMap[studentId] || generateDefaultPrimaryMarks(st);
    const subRecord = existing.subjects?.[subCode] || { code: subCode };

    const isSa = field === 'sa1' || field === 'sa2';
    const maxRaw = isSa ? 50 : 20;
    const maxPct = isSa ? 20 : 15;

    // If cleared / empty: cell can be empty (zero is not required)
    if (val === null || val === undefined || (val as any) === '') {
      const updatedSubRecord = {
        ...subRecord,
        [field]: null,
        [`${field}_pct`]: null,
      };

      const updatedMarks: StudentExamMarks = {
        ...existing,
        studentId,
        diseCode,
        academicYear,
        subjects: {
          ...(existing.subjects || {}),
          [subCode]: updatedSubRecord,
        },
      };

      setMarksMap((prev) => ({ ...prev, [studentId]: updatedMarks }));
      saveStudentMarks(diseCode, diseCode, updatedMarks, academicYear).catch(() => {});
      return;
    }

    const clampedRaw = Math.max(0, Math.min(maxRaw, Number(val)));
    // ROUND DOWN (Math.floor), NO DECIMAL MARKS
    const computedPct = Math.floor((clampedRaw * maxPct) / maxRaw);

    const updatedSubRecord = {
      ...subRecord,
      [field]: clampedRaw,
      [`${field}_pct`]: computedPct,
    };

    const updatedMarks: StudentExamMarks = {
      ...existing,
      studentId,
      diseCode,
      academicYear,
      subjects: {
        ...(existing.subjects || {}),
        [subCode]: updatedSubRecord,
      },
    };

    setMarksMap((prev) => ({ ...prev, [studentId]: updatedMarks }));
    saveStudentMarks(diseCode, diseCode, updatedMarks, academicYear).catch(() => {});
  };

  // 2-Way Synchronized Exam 15% / 20% Handler (FA1-4 max 15, SA1-2 max 20)
  const handleUpdateExamPct = (
    studentId: string,
    subCode: PrimarySubjectCode,
    exam: 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2',
    val: number | null | undefined
  ) => {
    const st = students.find((s) => s.id === studentId);
    if (!st) return;

    const isSa = exam === 'sa1' || exam === 'sa2';
    const maxPct = isSa ? 20 : 15;
    const maxRaw = isSa ? 50 : 20;

    // If cleared / empty:
    if (val === null || val === undefined || (val as any) === '') {
      const existing = marksMap[studentId] || generateDefaultPrimaryMarks(st);
      const subRecord = existing.subjects?.[subCode] || { code: subCode };
      const updatedSubRecord = {
        ...subRecord,
        [exam]: null,
        [`${exam}_pct`]: null,
      };

      const updatedMarks: StudentExamMarks = {
        ...existing,
        studentId,
        diseCode,
        academicYear,
        subjects: {
          ...(existing.subjects || {}),
          [subCode]: updatedSubRecord,
        },
      };

      setMarksMap((prev) => ({ ...prev, [studentId]: updatedMarks }));
      saveStudentMarks(diseCode, diseCode, updatedMarks, academicYear).catch(() => {});
      return;
    }

    // Clamped strictly to maximum marks rule, integer only (no decimals)
    const clampedPct = Math.floor(Math.max(0, Math.min(maxPct, Number(val))));
    const proportionalRaw = Math.max(0, Math.min(maxRaw, Math.round((clampedPct / maxPct) * maxRaw)));

    const existing = marksMap[studentId] || generateDefaultPrimaryMarks(st);
    const subRecord = existing.subjects?.[subCode] || { code: subCode };

    const updatedSubRecord = {
      ...subRecord,
      [exam]: proportionalRaw,
      [`${exam}_pct`]: clampedPct,
    };

    const updatedMarks: StudentExamMarks = {
      ...existing,
      studentId,
      diseCode,
      academicYear,
      subjects: {
        ...(existing.subjects || {}),
        [subCode]: updatedSubRecord,
      },
    };

    setMarksMap((prev) => ({ ...prev, [studentId]: updatedMarks }));
    saveStudentMarks(diseCode, diseCode, updatedMarks, academicYear).catch(() => {});
  };

  // Handle Sem 1 and Sem 2 Attendance Update: sum of sem 1 & sem 2 <= workingDays
  const handleUpdateSemAttendance = (studentId: string, sem: 'sem1' | 'sem2', days: number) => {
    const st = students.find((s) => s.id === studentId);
    if (!st) return;

    const existing = marksMap[studentId] || generateDefaultPrimaryMarks(st);
    const prevSem1 = existing.sem1Attendance !== undefined ? Number(existing.sem1Attendance) : Math.round((existing.attendanceDays || 210) * 0.48);
    const prevSem2 = existing.sem2Attendance !== undefined ? Number(existing.sem2Attendance) : Math.max(0, (existing.attendanceDays || 210) - prevSem1);

    let newSem1 = sem === 'sem1' ? days : prevSem1;
    let newSem2 = sem === 'sem2' ? days : prevSem2;

    if (newSem1 + newSem2 > workingDays) {
      if (sem === 'sem1') {
        newSem1 = Math.max(0, Math.min(days, workingDays - newSem2));
      } else {
        newSem2 = Math.max(0, Math.min(days, workingDays - newSem1));
      }
    }
    const newTotal = newSem1 + newSem2;

    const updatedMarks: StudentExamMarks = {
      ...existing,
      studentId,
      diseCode,
      academicYear,
      sem1Attendance: newSem1,
      sem2Attendance: newSem2,
      attendanceDays: newTotal,
    };

    setMarksMap((prev) => ({ ...prev, [studentId]: updatedMarks }));
    saveStudentMarks(diseCode, diseCode, updatedMarks, academicYear).catch(() => {});
  };

  // Handle Attendance Update
  const handleUpdateAttendance = (studentId: string, days: number) => {
    const st = students.find((s) => s.id === studentId);
    if (!st) return;

    const clampedTotal = Math.max(0, Math.min(days, workingDays));
    const newSem1 = Math.round(clampedTotal * 0.48);
    const newSem2 = clampedTotal - newSem1;

    const existing = marksMap[studentId] || generateDefaultPrimaryMarks(st);
    const updatedMarks: StudentExamMarks = {
      ...existing,
      studentId,
      diseCode,
      academicYear,
      attendanceDays: clampedTotal,
      sem1Attendance: newSem1,
      sem2Attendance: newSem2,
    };

    setMarksMap((prev) => ({ ...prev, [studentId]: updatedMarks }));
    saveStudentMarks(diseCode, diseCode, updatedMarks, academicYear).catch(() => {});
  };

  // Handle Final Co-Scholastic Grade Update
  const handleUpdateFinalCoGrade = (studentId: string, key: string, val: string) => {
    const st = students.find((s) => s.id === studentId);
    if (!st) return;

    const existing = marksMap[studentId] || generateDefaultPrimaryMarks(st);
    const currentFinal = (existing as any).finalCo || {};

    const updatedMarks: any = {
      ...existing,
      studentId,
      diseCode,
      academicYear,
      finalCo: {
        ...currentFinal,
        [key]: val,
      },
    };

    setMarksMap((prev) => ({ ...prev, [studentId]: updatedMarks }));
    saveStudentMarks(diseCode, diseCode, updatedMarks, academicYear).catch(() => {});
  };

  // Print Handler
  const handlePrint = async () => {
    const title = `Karnataka_CCE_${activeTab}_Class${selectedClass}_${academicYear}`;
    await executeReportPrint(reportRef.current, title);
  };

  // PDF Export
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    const filename = `Karnataka_CCE_${activeTab}_Class${selectedClass}_${academicYear}.pdf`;
    await downloadElementAsPdf(reportRef.current, filename);
  };

  // Excel Export
  const handleExportExcel = () => {
    if (!reportRef.current) return;
    const filename = `Karnataka_CCE_${activeTab}_Class${selectedClass}_${academicYear}`;
    exportHtmlTableToExcel(reportRef.current, filename);
  };

  // WhatsApp Share
  const handleShareWhatsApp = async () => {
    const caption = `*${schoolRecord?.schoolName || 'Karnataka School'}*\n*${activeTab.toUpperCase()} CCE Official Report - Class ${selectedClass}*\nAcademic Year: ${academicYear}\nStudents: ${currentClassComputedList.length}\nHM: ${schoolRecord?.headmasterName || 'Headmaster'}`;
    if (reportRef.current) {
      await shareReportToWhatsApp(reportRef.current, caption, schoolRecord?.mobile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-100 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[96vh] flex flex-col overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-600 rounded-xl text-white shadow-md">
                <Layers className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>೧-೫ನೇ ತರಗತಿ ಅಧಿಕೃತ ಸಿ.ಸಿ.ಇ ವರದಿಗಳು (1-5th CCE Reports Suite)</span>
                  <span className="text-xs bg-amber-400 text-slate-950 font-mono font-bold px-2 py-0.5 rounded-full">
                    LEGAL SIZE
                  </span>
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-bold">
                  <span>{schoolRecord?.schoolName || 'Govt School'}</span>
                  <span>• ಕ್ಲಸ್ಟರ್: {schoolRecord?.cluster || 'ನಿಂಗ್ಯಾನಟ್ಟಿ'}</span>
                  <span>• ತಾಲೂಕು: {schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ'}</span>
                  <span>• ವರ್ಷ: <span className="text-amber-300 font-mono">{academicYear}</span></span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
              title="Close window"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 5 Tabs Switcher (Pages 2, 3, 4, 5, 6) */}
        <div className="bg-slate-800 px-4 py-2 flex flex-wrap items-center gap-2 border-b border-slate-700 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('page2')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'page2'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
            }`}
          >
            <span>೨. 100 ಅಂಕ ಕ್ರೋಢೀಕರಣ ವಹಿ (Page 2)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('page3')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'page3'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
            }`}
          >
            <span>೩. ವಿಷಯ & ಶ್ರೇಣಿವಾರು (Page 3)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('page4')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'page4'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-amber-400'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
            }`}
          >
            <span>{isMarathiOrUrdu ? '೪. All subject Consolidation 9lines (500marks)' : 'All subject Consolidation 9lines(400marks)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('page5')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'page5'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
            }`}
          >
            <span>{isMarathiOrUrdu ? '೫. All Class Abstract (Portrait)' : '೫. 1-5 ಎಲ್ಲಾ ತರಗತಿ ಶ್ರೇಣಿವಾರು (Page 5: ಭಾವಚಿತ್ರ)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('page6')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'page6'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
            }`}
          >
            <span>{isMarathiOrUrdu ? '೬. Annual Result Abstract (Landscape)' : '೬. ಪರೀಕ್ಷೆ ಹಾಜರಾದ / ಉತ್ತೀರ್ಣ (Page 6: ಪ್ರವರ್ಗವಾರು)'}</span>
          </button>

          {isMarathiOrUrdu && (
            <button
              type="button"
              onClick={() => setActiveTab('sats')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sats'
                  ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                  : 'bg-amber-900/60 text-amber-200 hover:bg-amber-800 hover:text-white border border-amber-600/40'
              }`}
            >
              <span className="font-black">⭐ SATS REPORT</span>
            </button>
          )}
        </div>

        {/* Dynamic Controls Bar */}
        <div className="bg-white p-3 px-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Class Dropdown (for page 2, 3, 4, sats) */}
            {(activeTab === 'page2' || activeTab === 'page3' || activeTab === 'page4' || activeTab === 'sats') && (
              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300">
                <span className="font-black text-slate-700">ತರಗತಿ:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-transparent font-black text-xs text-blue-900 focus:outline-none cursor-pointer"
                >
                  {['1', '2', '3', '4', '5'].map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}ನೇ ತರಗತಿ ({cls}th Std)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Class Teacher Name Input */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300">
              <span className="font-bold text-slate-700">ಶಿಕ್ಷಕರು:</span>
              <input
                type="text"
                value={classTeacherName}
                onChange={(e) => {
                  setClassTeacherName(e.target.value);
                  localStorage.setItem(`kseab_ct_name_${diseCode}_${selectedClass}`, e.target.value);
                }}
                className="bg-transparent font-bold text-xs text-slate-900 focus:outline-none w-28 sm:w-36"
                placeholder="ವರ್ಗ ಶಿಕ್ಷಕರ ಹೆಸರು"
              />
            </div>

            {/* Working Days */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300">
              <span className="font-bold text-slate-700">ದಿನಗಳು:</span>
              <input
                type="number"
                value={workingDays}
                onChange={(e) => {
                  const d = Number(e.target.value);
                  setWorkingDays(d);
                  localStorage.setItem(`kseab_working_days_${diseCode}_${academicYear}`, String(d));
                }}
                className="bg-transparent font-mono font-bold text-xs text-slate-900 focus:outline-none w-14"
              />
            </div>
          </div>

          {/* Action Buttons: Print, PDF, Excel, WhatsApp */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>ಮುದ್ರಣ (Print)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>PDF ಡೌನ್‌ಲೋಡ್</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Export</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3.5 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp Share</span>
            </button>
          </div>
        </div>

        {/* Scrollable Report Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/80">
          <div className="max-w-[1400px] mx-auto bg-white rounded-2xl shadow-md p-2">
            {activeTab === 'page2' && (
              isMarathiOrUrdu ? (
                <MarathiUrduCcePage2Register
                  computedList={currentClassMarathiUrduList}
                  schoolRecord={schoolRecord}
                  academicYear={academicYear}
                  selectedClass={selectedClass}
                  medium={marathiUrduMedium}
                  classTeacherName={classTeacherName}
                  workingDays={workingDays}
                  reportRef={reportRef}
                  onUpdateSubject100={handleUpdateSubject100 as any}
                  onUpdateAttendance={handleUpdateAttendance}
                  onUpdateFinalCoGrade={handleUpdateFinalCoGrade}
                />
              ) : (
                <CcePage2Register
                  computedList={currentClassComputedList}
                  schoolRecord={schoolRecord}
                  academicYear={academicYear}
                  selectedClass={selectedClass}
                  classTeacherName={classTeacherName}
                  workingDays={workingDays}
                  reportRef={reportRef}
                  onUpdateSubject100={handleUpdateSubject100}
                  onUpdateAttendance={handleUpdateAttendance}
                  onUpdateFinalCoGrade={handleUpdateFinalCoGrade}
                />
              )
            )}

            {activeTab === 'page3' && (
              isMarathiOrUrdu ? (
                <MarathiUrduCcePage3ClassGrade
                  computedList={currentClassMarathiUrduList}
                  schoolRecord={schoolRecord}
                  academicYear={academicYear}
                  selectedClass={selectedClass}
                  medium={marathiUrduMedium}
                  classTeacherName={classTeacherName}
                  workingDays={workingDays}
                  reportRef={reportRef}
                />
              ) : (
                <CcePage3ClassGrade
                  computedList={currentClassComputedList}
                  schoolRecord={schoolRecord}
                  academicYear={academicYear}
                  selectedClass={selectedClass}
                  classTeacherName={classTeacherName}
                  workingDays={workingDays}
                  reportRef={reportRef}
                />
              )
            )}

            {activeTab === 'page4' && (
              isMarathiOrUrdu ? (
                <MarathiUrduCcePage4Detailed500
                  computedList={currentClassMarathiUrduList}
                  schoolRecord={schoolRecord}
                  academicYear={academicYear}
                  selectedClass={selectedClass}
                  medium={marathiUrduMedium}
                  classTeacherName={classTeacherName}
                  workingDays={workingDays}
                  reportRef={reportRef}
                  onUpdateSubject100={handleUpdateSubject100 as any}
                  onUpdateExamPct={handleUpdateExamPct as any}
                  onUpdateMarks={handleUpdateMarks as any}
                />
              ) : (
                <CcePage4Detailed400
                  computedList={currentClassComputedList}
                  schoolRecord={schoolRecord}
                  academicYear={academicYear}
                  selectedClass={selectedClass}
                  classTeacherName={classTeacherName}
                  workingDays={workingDays}
                  reportRef={reportRef}
                  onUpdateMarks={handleUpdateMarks}
                  onUpdateExamPct={handleUpdateExamPct}
                  onUpdateSubject100={handleUpdateSubject100}
                  onUpdateAttendance={handleUpdateAttendance}
                  onUpdateSemAttendance={handleUpdateSemAttendance}
                  onUpdateCoScholastic={handleUpdateFinalCoGrade as any}
                />
              )
            )}

            {activeTab === 'page5' && (
              isMarathiOrUrdu ? (
                <MarathiUrduCcePage5AllClassGrade
                  studentsByClass={marathiUrduStudentsByClass}
                  schoolRecord={schoolRecord}
                  academicYear={academicYear}
                  reportRef={reportRef}
                />
              ) : (
                <CcePage5AllClassGrade
                  studentsByClass={studentsByClass}
                  schoolRecord={schoolRecord}
                  academicYear={academicYear}
                  reportRef={reportRef}
                />
              )
            )}

            {activeTab === 'page6' && (
              isMarathiOrUrdu ? (
                <MarathiUrduCcePage6Abstract
                  studentsByClass={marathiUrduStudentsByClass as any}
                  schoolRecord={schoolRecord}
                  academicYear={academicYear}
                  reportRef={reportRef}
                />
              ) : (
                <CcePage6Abstract
                  studentsByClass={studentsByClass}
                  schoolRecord={schoolRecord}
                  academicYear={academicYear}
                  reportRef={reportRef}
                />
              )
            )}

            {activeTab === 'sats' && (
              <SatsReport
                studentsByClass={marathiUrduStudentsByClass}
                schoolRecord={schoolRecord}
                academicYear={academicYear}
                reportRef={reportRef}
                selectedClass={selectedClass}
                onSelectClass={(cls) => setSelectedClass(cls)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
