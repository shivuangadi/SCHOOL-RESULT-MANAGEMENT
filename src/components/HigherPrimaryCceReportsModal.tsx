import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, SchoolRecord, StudentExamMarks, StudentClass } from '../types';
import {
  HpSubjectCode,
  ComputedHpStudent,
  computeHpStudentCce,
  getHpSubjectsForMedium,
} from '../utils/higherPrimaryCceHelper';
import {
  loadSchoolMarks,
  saveStudentMarks,
  subscribeSchoolMarks,
} from '../utils/marksStore';
import { distributeSubject100Marks, distributePartB100Marks } from '../utils/marksDistribution';
import {
  executeReportPrint,
  downloadElementAsPdf,
  downloadElementAsHtml,
  exportElementAsImage,
  shareReportToWhatsApp,
  ReportPaperSize,
  printHpCcePage2_9Line,
  exportHpCcePage2_9LinePdf,
  printHigherPrimaryCcePage2Detailed,
  exportHigherPrimaryCcePage2Pdf,
} from '../utils/printPdfHelper';
import { getSavedClassTeacher, persistClassTeacherLocally } from '../utils/teacherHelper';
import {
  Printer,
  Download,
  Share2,
  X,
  FileSpreadsheet,
  Award,
  Layers,
  BookOpen,
  CheckCircle2,
  FileCode,
} from 'lucide-react';

import { HpCcePage1Entry } from './higher_primary_cce/HpCcePage1Entry';
import { HpCcePage2Register9Line } from './higher_primary_cce/HpCcePage2Register9Line';
import { HpCcePage3Register100 } from './higher_primary_cce/HpCcePage3Register100';
import { HpCcePage4SatsGrade } from './higher_primary_cce/HpCcePage4SatsGrade';
import { HpCcePage5ClassAbstract } from './higher_primary_cce/HpCcePage5ClassAbstract';
import { HpCcePage6MasterAbstract } from './higher_primary_cce/HpCcePage6MasterAbstract';

export type HpReportTabKey =
  | 'marks_entry'
  | 'consolidation_100'
  | 'consolidation_9line'
  | 'sats_grade'
  | 'class_abstract'
  | 'master_abstract'
  | 'page1'
  | 'page2'
  | 'page3'
  | 'page4'
  | 'page5'
  | 'page6'
  | 'sats';

interface HigherPrimaryCceReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolRecord: SchoolRecord | null;
  academicYear?: string;
  initialTab?: HpReportTabKey;
  initialClass?: string;
}

export const HigherPrimaryCceReportsModal: React.FC<HigherPrimaryCceReportsModalProps> = ({
  isOpen,
  onClose,
  students,
  schoolRecord,
  academicYear = '2026-27',
  initialTab = 'consolidation_100',
  initialClass = '6',
}) => {
  if (!isOpen) return null;

  const diseCode = schoolRecord?.diseCode || '';
  const schoolMedium = schoolRecord?.schoolMedium || 'Kannada';

  // Active Tab based on requested formats
  const [activeTab, setActiveTab] = useState<HpReportTabKey>(() => {
    if (initialTab === 'page2' || initialTab === 'consolidation_100') return 'consolidation_100';
    if (initialTab === 'page4' || initialTab === 'consolidation_9line') return 'consolidation_9line';
    if (initialTab === 'page1' || initialTab === 'marks_entry') return 'marks_entry';
    if (initialTab === 'page3' || initialTab === 'sats_grade' || initialTab === 'sats') return 'sats_grade';
    if (initialTab === 'page5' || initialTab === 'class_abstract') return 'class_abstract';
    if (initialTab === 'page6' || initialTab === 'master_abstract') return 'master_abstract';
    return initialTab;
  });

  // Selected Class strictly 6, 7, 8
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (initialClass && (initialClass === '6' || initialClass === '7' || initialClass === '8')) {
      return initialClass;
    }
    return '6';
  });

  // Selected Subject for Page 1
  const [selectedSubject, setSelectedSubject] = useState<HpSubjectCode>('FL');

  // Class Teacher Name & Working Days state (Fetched from School Profile; if not saved, left blank to edit)
  const [classTeacherName, setClassTeacherName] = useState<string>(() => {
    return getSavedClassTeacher(schoolRecord, selectedClass);
  });

  // Paper Size state: 1. A4 size (295mm × 210mm) | 2. Legal size (340mm × 210mm)
  const [paperSize, setPaperSize] = useState<ReportPaperSize>('legal');

  // Automatically update class teacher name when selected class or school profile changes
  useEffect(() => {
    setClassTeacherName(getSavedClassTeacher(schoolRecord, selectedClass));
  }, [schoolRecord, selectedClass]);

  const [workingDays, setWorkingDays] = useState<number>(() => {
    const saved = localStorage.getItem(`kseab_working_days_${diseCode}_${academicYear}`);
    return saved ? Number(saved) : 220;
  });

  // Real-time marks state
  const [marksMap, setMarksMap] = useState<Record<string, StudentExamMarks>>({});
  const reportRef = useRef<HTMLDivElement | null>(null);

  // Load marks from store
  useEffect(() => {
    if (!diseCode) return;
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

  // Compute detailed CCE records for all students across classes 6 to 8
  const studentsByClass = useMemo(() => {
    const map: Record<string, ComputedHpStudent[]> = {
      '6': [],
      '7': [],
      '8': [],
    };

    ['6', '7', '8'].forEach((cls) => {
      const classSt = students
        .filter((s) => String(s.classStandard) === cls)
        .sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));

      map[cls] = classSt.map((st) => {
        const m = marksMap[st.id] || null;
        return computeHpStudentCce(st, schoolMedium, m);
      });
    });

    return map;
  }, [students, marksMap, schoolMedium]);

  const currentClassComputedList = useMemo(() => {
    return studentsByClass[selectedClass] || [];
  }, [studentsByClass, selectedClass]);

  // 2-Way Synced Mark Updates
  const handleUpdateMarks = (
    studentId: string,
    subCode: HpSubjectCode,
    field: string,
    val: number | null
  ) => {
    const isSa = field === 'sa1' || field === 'sa2';
    const isFa = field.startsWith('fa');
    let computedPct: number | null = null;
    if (val !== null && !isNaN(val)) {
      if (isSa) {
        const clamped = Math.min(50, Math.max(0, Math.floor(val)));
        computedPct = Math.min(30, Math.floor((clamped * 30) / 50));
      } else if (isFa) {
        const clamped = Math.min(20, Math.max(0, Math.floor(val)));
        computedPct = Math.min(10, Math.floor(clamped / 2));
      }
    }

    setMarksMap((prev) => {
      const existing = prev[studentId] || {
        studentId,
        diseCode,
        classStandard: selectedClass as StudentClass,
        academicYear,
        subjects: {},
      };

      const existingSub = existing.subjects[subCode] || { code: subCode };
      const updatedSub = {
        ...existingSub,
        [field]: val,
        ...(isSa || isFa ? { [`${field}_pct`]: computedPct } : {}),
      };

      const updated = {
        ...existing,
        subjects: {
          ...existing.subjects,
          [subCode]: updatedSub,
        },
      };

      saveStudentMarks(diseCode, diseCode, updated, academicYear);
      return { ...prev, [studentId]: updated };
    });
  };

  const handleUpdateExamPct = (
    studentId: string,
    subCode: HpSubjectCode,
    exam: 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2',
    val: number | null
  ) => {
    const pctKey = `${exam}_pct`;
    const isSa = exam === 'sa1' || exam === 'sa2';
    let propRaw: number | null = null;
    let clampedPct: number | null = null;
    if (val !== null && !isNaN(val)) {
      if (isSa) {
        clampedPct = Math.min(30, Math.max(0, Math.floor(val)));
        propRaw = Math.min(50, Math.round((clampedPct * 50) / 30));
      } else {
        clampedPct = Math.min(10, Math.max(0, Math.floor(val)));
        propRaw = Math.min(20, clampedPct * 2);
      }
    }

    setMarksMap((prev) => {
      const existing = prev[studentId] || {
        studentId,
        diseCode,
        classStandard: selectedClass as StudentClass,
        academicYear,
        subjects: {},
      };

      const existingSub = existing.subjects[subCode] || { code: subCode };
      const updatedSub = {
        ...existingSub,
        [pctKey]: clampedPct,
        [exam]: propRaw,
      };

      const updated = {
        ...existing,
        subjects: {
          ...existing.subjects,
          [subCode]: updatedSub,
        },
      };

      saveStudentMarks(diseCode, diseCode, updated, academicYear);
      return { ...prev, [studentId]: updated };
    });
  };

  const handleUpdateSubject100 = (
    studentId: string,
    subCode: HpSubjectCode,
    total100: number | null
  ) => {
    setMarksMap((prev) => {
      const existing = prev[studentId] || {
        studentId,
        diseCode,
        classStandard: selectedClass as StudentClass,
        academicYear,
        subjects: {},
      };

      const existingSub = existing.subjects[subCode] || { code: subCode };
      const distributed = distributeSubject100Marks(total100, selectedClass, subCode);
      const updatedSub = { ...existingSub, ...distributed };

      const updated = {
        ...existing,
        subjects: {
          ...existing.subjects,
          [subCode]: updatedSub,
        },
      };

      saveStudentMarks(diseCode, diseCode, updated, academicYear);
      return { ...prev, [studentId]: updated };
    });
  };

  const handleUpdateAttendance = (studentId: string, days: number) => {
    setMarksMap((prev) => {
      const existing = prev[studentId] || {
        studentId,
        diseCode,
        classStandard: selectedClass as StudentClass,
        academicYear,
        subjects: {},
      };

      const updated = {
        ...existing,
        attendanceDays: days,
      };

      saveStudentMarks(diseCode, diseCode, updated, academicYear);
      return { ...prev, [studentId]: updated };
    });
  };

  const handleUpdateSemAttendance = (studentId: string, sem: 'sem1' | 'sem2', days: number) => {
    const semKey = sem === 'sem1' ? 'sem1Attendance' : 'sem2Attendance';
    setMarksMap((prev) => {
      const existing = prev[studentId] || {
        studentId,
        diseCode,
        classStandard: selectedClass as StudentClass,
        academicYear,
        subjects: {},
      };

      const updated = {
        ...existing,
        [semKey]: days,
      };

      saveStudentMarks(diseCode, diseCode, updated, academicYear);
      return { ...prev, [studentId]: updated };
    });
  };

  const handleUpdateCoGrade = (studentId: string, sem: 'sem1' | 'sem2' | 'final', key: string, val: string) => {
    const targetField = sem === 'sem1' ? 'sem1Co' : sem === 'sem2' ? 'sem2Co' : 'finalCo';
    setMarksMap((prev) => {
      const existing = prev[studentId] || {
        studentId,
        diseCode,
        classStandard: selectedClass as StudentClass,
        academicYear,
        subjects: {},
      };

      const existingRecord = (existing as any)[targetField] || {};
      const updatedRecord = { ...existingRecord, [key]: val };

      const updated = {
        ...existing,
        [targetField]: updatedRecord,
      };

      saveStudentMarks(diseCode, diseCode, updated, academicYear);
      return { ...prev, [studentId]: updated };
    });
  };

  const handleUpdatePartBMarks = (
    studentId: string,
    subjectKey: string,
    sem: 'sem1' | 'sem2' | 'total',
    val: number | null
  ) => {
    setMarksMap((prev) => {
      const existing = prev[studentId] || {
        studentId,
        diseCode,
        classStandard: selectedClass as StudentClass,
        academicYear,
        subjects: {},
      };

      const existingPartB = (existing as any).partBSubjects || {};
      const existingSub = existingPartB[subjectKey] || {};

      let updatedSubValues: any = {};
      if (sem === 'total') {
        const distributed = distributePartB100Marks(val);
        updatedSubValues = {
          ...existingSub,
          sem1: distributed.sem1,
          sem2: distributed.sem2,
          total: distributed.total,
        };
      } else {
        const otherSem = sem === 'sem1' ? 'sem2' : 'sem1';
        const otherVal = existingSub[otherSem] !== undefined && existingSub[otherSem] !== null ? Number(existingSub[otherSem]) : 0;
        const currentVal = val !== null && val !== undefined ? Number(val) : 0;
        const total = Math.min(100, Math.max(0, currentVal + otherVal));
        updatedSubValues = {
          ...existingSub,
          [sem]: val,
          total,
        };
      }

      const updated = {
        ...existing,
        partBSubjects: {
          ...existingPartB,
          [subjectKey]: updatedSubValues,
        },
      };

      saveStudentMarks(diseCode, diseCode, updated, academicYear);
      return { ...prev, [studentId]: updated };
    });
  };

  // Header Title
  const getTabTitle = () => {
    switch (activeTab) {
      case 'marks_entry':
      case 'page1':
        return 'ಅಂಕ ದಾಖಲಾತಿ ನಮೂನೆ (Class 6-8 Marks Entry Form • Part A & B)';
      case 'consolidation_100':
      case 'page3':
        return '100 ಅಂಕಗಳ ಕ್ರೋಢೀಕರಣ ವರದಿ (100 Marks Consolidation Broadsheet • 700 Marks)';
      case 'consolidation_9line':
      case 'page2':
        return '9-ಸಾಲು CCE ಸಂಯೋಜಿತ ವರದಿ (9-Line Consolidation • Legal Landscape)';
      case 'sats_grade':
      case 'page4':
      case 'sats':
        return 'SATS ಗ್ರೇಡ್ ನಮೂನೆ (SATS Grade Upload Format • Legal Portrait)';
      case 'class_abstract':
      case 'page5':
        return 'ವಿಷಯವಾರು ಹಾಗೂ ಶ್ರೇಣಿವಾರು ಘೋಷವಾರ (Class 1-8 Subject & Grade Abstract)';
      case 'master_abstract':
      case 'page6':
        return '1-8 ವಾರ್ಷಿಕ ಪರಿಣಾಮ ಪತ್ರಿಕೆಯ ಘೋಷವಾರ (Class 1-8 Annual Result Abstract)';
      default:
        return '6-8ನೇ ತರಗತಿ CCE ಅಧಿಕೃತ ವರದಿಗಳು';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-slate-100 rounded-3xl shadow-2xl w-full max-w-[98vw] h-[96vh] flex flex-col overflow-hidden border-2 border-indigo-500">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-3 sm:p-4 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-indigo-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl font-black shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-amber-300 tracking-wide">
                  6 ರಿಂದ 8 ನೇ ತರಗತಿ CCE ಅಧಿಕೃತ ವರದಿಗಳು (Class 6-8 CCE Reports Suite)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  700 ಅಂಕಗಳು • {schoolMedium} Medium
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {getTabTitle()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="bg-white border-b border-slate-300 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-xs">
          {/* Format Tabs (Matching user formats strictly) */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {/* Format 1: Marks Entry Form */}
            <button
              type="button"
              onClick={() => setActiveTab('marks_entry')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'marks_entry' || activeTab === 'page1'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>1. ಅಂಕ ದಾಖಲಾತಿ ನಮೂನೆ (Marks Entry Form)</span>
            </button>

            {/* Format 2: 100 Marks Consolidation Report */}
            <button
              type="button"
              onClick={() => setActiveTab('consolidation_100')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'consolidation_100' || activeTab === 'page3'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>2. 100 ಅಂಕಗಳ ಕ್ರೋಢೀಕರಣ ವರದಿ (100 Marks Consolidation)</span>
            </button>

            {/* Format 3: 9-Line Consolidation Report */}
            <button
              type="button"
              onClick={() => setActiveTab('consolidation_9line')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'consolidation_9line' || activeTab === 'page2'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3. 9-ಸಾಲು ಸಂಯೋಜಿತ ವರದಿ (9-Line Consolidation)</span>
            </button>

            {/* Format 4: SATS Grade Upload Format */}
            <button
              type="button"
              onClick={() => setActiveTab('sats_grade')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sats_grade' || activeTab === 'page4' || activeTab === 'sats'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-900" />
              <span>4. SATS ಗ್ರೇಡ್ ನಮೂನೆ (SATS Grade Upload)</span>
            </button>

            {/* Format 5: Class 6-8 Subject & Grade Abstract */}
            <button
              type="button"
              onClick={() => setActiveTab('class_abstract')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'class_abstract' || activeTab === 'page5'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>5. 6-8 ತರಗತಿವಾರು, ವಿಷಯವಾರು & ಶ್ರೇಣಿವಾರು ಘೋಷವಾರ (Class 6-8 Abstract)</span>
            </button>

            {/* Format 6: Class 6-8 Master Abstract */}
            <button
              type="button"
              onClick={() => setActiveTab('master_abstract')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'master_abstract' || activeTab === 'page6'
                  ? 'bg-slate-900 text-amber-300 shadow-md font-black ring-2 ring-amber-400'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>6. 1-8 ಮಹಾ ಘೋಷವಾರ (Class 1-8 Abstract)</span>
            </button>
          </div>

          {/* Class Selection & Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-300">
              <span className="text-xs font-black text-slate-700">ತರಗತಿ:</span>
              <div className="flex items-center gap-1">
                {['6', '7', '8'].map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`px-2 py-0.5 rounded text-xs font-black transition cursor-pointer ${
                      selectedClass === cls
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {cls}ನೇ
                  </button>
                ))}
              </div>
            </div>

            {/* Class Teacher Name Input (Editable, fetched from school profile or blank) */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-300">
              <span className="text-xs font-black text-slate-700">ಶಿಕ್ಷಕರು:</span>
              <input
                type="text"
                value={classTeacherName}
                onChange={(e) => {
                  setClassTeacherName(e.target.value);
                  persistClassTeacherLocally(diseCode, selectedClass, e.target.value);
                }}
                className="bg-transparent font-bold text-xs text-slate-900 focus:outline-none w-28 sm:w-36"
                placeholder="ವರ್ಗ ಶಿಕ್ಷಕರ ಹೆಸರು (ಖಾಲಿ)"
              />
            </div>

            {/* Working Days */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-300">
              <span className="text-xs font-black text-slate-700">ದಿನಗಳು:</span>
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

            {/* Paper Size 2 Options: 1. A4 size (295mm × 210mm) & 2. Legal size (340mm × 210mm) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-300 text-xs">
              <span className="font-bold text-slate-700 px-1">ಸೈಜ್:</span>
              <button
                type="button"
                onClick={() => setPaperSize('a4')}
                className={`px-2 py-0.5 rounded-lg font-black transition cursor-pointer text-[11px] ${
                  paperSize === 'a4'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
                title="1. A4 Size (297mm × 210mm)"
              >
                1. A4 (297×210mm)
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('legal')}
                className={`px-2 py-0.5 rounded-lg font-black transition cursor-pointer text-[11px] ${
                  paperSize === 'legal'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
                title="2. Legal Size (355.6mm × 215.9mm)"
              >
                2. Legal (355.6×215.9mm)
              </button>
            </div>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={async () => {
                if (reportRef.current) {
                  const sName = (schoolRecord?.schoolName || 'School').replace(/\s+/g, '_');
                  const filename = `${sName}_Class_${selectedClass}_${academicYear}_${activeTab}_${paperSize.toUpperCase()}`;
                  let tabTitleKn = 'ಕ್ರೋಢೀಕೃತ ವರದಿ';
                  if (activeTab === 'consolidation_9line' || activeTab === 'page2') {
                    tabTitleKn = '6-8 9-ಸಾಲಿನ ಕ್ರೋಢೀಕೃತ ವರದಿ (9-Line Consolidation Register)';
                  } else if (activeTab === 'consolidation_100' || activeTab === 'page3') {
                    tabTitleKn = '6-8 100 ಅಂಕಗಳ ಕ್ರೋಢೀಕೃತ ವರದಿ (100 Marks Consolidation Register)';
                  } else if (activeTab === 'class_abstract' || activeTab === 'page5') {
                    tabTitleKn = '6-8 ತರಗತಿವಾರು ಘೋಷವಾರ (Class Abstract)';
                  } else if (activeTab === 'master_abstract' || activeTab === 'page6') {
                    tabTitleKn = '1-8 ಮಹಾ ಘೋಷವಾರ (Master Abstract)';
                  }
                  const summary = `*${schoolRecord?.schoolName || 'ಶಾಲೆ'}*\n*${tabTitleKn} (${academicYear})*\nತರಗತಿ: ${selectedClass}ನೇ ತರಗತಿ\nಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು: ${currentClassComputedList.length}\nದಿನಾಂಕ: ${new Date().toLocaleDateString('kn-IN')}`;

                  // Clone cleanly identical to print preview
                  const clone = reportRef.current.cloneNode(true) as HTMLElement;
                  clone
                    .querySelectorAll('.print\\:hidden, .cce-print-hidden, button, select, input[type="button"]')
                    .forEach((el) => {
                      if (el.tagName === 'SELECT') {
                        const sel = el as HTMLSelectElement;
                        const text = sel.options[sel.selectedIndex]?.text || sel.value || '-';
                        const span = document.createElement('span');
                        span.className = 'font-bold text-center block w-full text-black';
                        span.textContent = text;
                        el.parentNode?.replaceChild(span, el);
                      } else {
                        el.remove();
                      }
                    });

                  const originalInputs = reportRef.current.querySelectorAll<HTMLInputElement>('input:not([type="button"]):not([type="submit"])');
                  const clonedInputs = clone.querySelectorAll<HTMLInputElement>('input:not([type="button"]):not([type="submit"])');
                  originalInputs.forEach((orig, idx) => {
                    const c = clonedInputs[idx];
                    if (c) {
                      c.value = orig.value;
                      const parent = c.parentElement;
                      const pdfEl = parent?.querySelector('.cce-pdf-text') as HTMLElement | null;
                      if (pdfEl && orig.value && orig.value.trim() !== '') {
                        pdfEl.textContent = orig.value.trim();
                      }
                    }
                  });

                  // Attach clone in document.body staging portal so browser computes exact Legal styles and high-res layout
                  const portal = document.createElement('div');
                  portal.id = 'hp-modal-whatsapp-portal';
                  portal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: ${paperSize === 'a4' ? '297mm' : '355.6mm'};
                    background: #ffffff;
                    z-index: -9999;
                    opacity: 0.001;
                    pointer-events: none;
                  `;
                  clone.classList.add('cce-pdf-mode');
                  clone.querySelectorAll('.report-page-sheet').forEach((s) => s.classList.add('cce-pdf-mode'));
                  portal.appendChild(clone);
                  document.body.appendChild(portal);

                  try {
                    await shareReportToWhatsApp(clone, summary, filename);
                  } finally {
                    if (document.body.contains(portal)) {
                      portal.remove();
                    }
                  }
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
              title="Share report image & summary to WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {/* HTML Download Button */}
            <button
              type="button"
              onClick={() => {
                if (reportRef.current) {
                  const sName = (schoolRecord?.schoolName || 'School').replace(/\s+/g, '_');
                  const filename = `${sName}_Class_${selectedClass}_${academicYear}_${activeTab}_${paperSize.toUpperCase()}`;
                  downloadElementAsHtml(reportRef.current, filename, paperSize);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
              title="Download standalone HTML file to adjust margins manually"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>HTML ಡೌನ್‌ಲೋಡ್</span>
            </button>

            {/* Print Button - Blue color matching table print preview button */}
            <button
              type="button"
              onClick={async () => {
                if (reportRef.current) {
                  const sName = (schoolRecord?.schoolName || 'School').replace(/\s+/g, '_');
                  const docTitle = `${sName}_Class_${selectedClass}_${academicYear}_${activeTab}_${paperSize.toUpperCase()}`;
                  if (activeTab === 'consolidation_9line' || activeTab === 'page4') {
                    await printHpCcePage2_9Line(reportRef.current, docTitle, paperSize);
                  } else if (activeTab === 'consolidation_100' || activeTab === 'page2' || activeTab === 'page3') {
                    await printHigherPrimaryCcePage2Detailed(reportRef.current, docTitle, paperSize);
                  } else {
                    await executeReportPrint(reportRef.current, docTitle, paperSize);
                  }
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
              title={`Print in ${paperSize === 'a4' ? 'A4 (297×210mm)' : 'Legal (355.6×215.9mm)'}`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ಮುದ್ರಿಸಿ ({paperSize === 'a4' ? 'A4' : 'Legal'})</span>
            </button>

            {/* PDF Download Button - Indigo color matching dedicated PDF exporters */}
            <button
              type="button"
              onClick={async () => {
                if (reportRef.current) {
                  const sName = (schoolRecord?.schoolName || 'School').replace(/\s+/g, '_');
                  const filename = `${sName}_Class_${selectedClass}_${academicYear}_${activeTab}_${paperSize.toUpperCase()}`;
                  if (activeTab === 'consolidation_9line' || activeTab === 'page4') {
                    await exportHpCcePage2_9LinePdf(reportRef.current, filename, paperSize);
                  } else if (activeTab === 'consolidation_100' || activeTab === 'page2' || activeTab === 'page3') {
                    await exportHigherPrimaryCcePage2Pdf(reportRef.current, filename, paperSize);
                  } else {
                    await downloadElementAsPdf(reportRef.current, filename, paperSize);
                  }
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
              title={`Download PDF in ${paperSize === 'a4' ? 'A4 (297×210mm)' : 'Legal (355.6×215.9mm)'}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF ({paperSize === 'a4' ? 'A4' : 'Legal'})</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          {(activeTab === 'marks_entry' || activeTab === 'page1') && (
            <HpCcePage1Entry
              students={students}
              computedList={currentClassComputedList}
              selectedSubject={selectedSubject}
              selectedClass={selectedClass}
              classTeacherName={classTeacherName}
              workingDays={workingDays}
              schoolMedium={schoolMedium}
              onSelectSubject={setSelectedSubject}
              onUpdateMarks={handleUpdateMarks}
              onUpdateExamPct={handleUpdateExamPct}
              onUpdateSubject100={handleUpdateSubject100}
              onUpdateAttendance={handleUpdateAttendance}
              onUpdateSemAttendance={handleUpdateSemAttendance}
              onUpdateCoGrade={handleUpdateCoGrade}
              onUpdatePartBMarks={handleUpdatePartBMarks}
            />
          )}

          {(activeTab === 'consolidation_100' || activeTab === 'page2') && (
            <HpCcePage3Register100
              computedList={currentClassComputedList}
              schoolRecord={schoolRecord}
              academicYear={academicYear}
              selectedClass={selectedClass}
              classTeacherName={classTeacherName}
              workingDays={workingDays}
              reportRef={reportRef}
              initialPaperSize={paperSize}
              onUpdateSubject100={handleUpdateSubject100}
              onUpdateAttendance={handleUpdateAttendance}
              onUpdateCoGrade={handleUpdateCoGrade}
              onUpdatePartBMarks={handleUpdatePartBMarks}
            />
          )}

          {(activeTab === 'consolidation_9line' || activeTab === 'page4') && (
            <HpCcePage2Register9Line
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
              onUpdateCoGrade={handleUpdateCoGrade}
              onUpdatePartBMarks={handleUpdatePartBMarks}
            />
          )}

          {(activeTab === 'sats_grade' || activeTab === 'page3' || activeTab === 'sats') && (
            <HpCcePage4SatsGrade
              computedList={currentClassComputedList}
              schoolRecord={schoolRecord}
              academicYear={academicYear}
              selectedClass={selectedClass}
              onSelectClass={setSelectedClass}
              reportRef={reportRef}
            />
          )}

          {(activeTab === 'class_abstract' || activeTab === 'page5') && (
            <HpCcePage5ClassAbstract
              students={students}
              marksMap={marksMap}
              schoolRecord={schoolRecord}
              academicYear={academicYear}
              reportRef={reportRef}
            />
          )}

          {(activeTab === 'master_abstract' || activeTab === 'page6') && (
            <HpCcePage6MasterAbstract
              students={students}
              marksMap={marksMap}
              schoolRecord={schoolRecord}
              academicYear={academicYear}
              reportRef={reportRef}
            />
          )}
        </div>
      </div>
    </div>
  );
};
