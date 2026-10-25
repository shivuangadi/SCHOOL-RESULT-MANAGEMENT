/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Official Karnataka Primary (Class 1-5) CCE Suite
 * Comprehensive 6-Page Formats for Kannada & English Medium Schools
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, SchoolRecord, StudentExamMarks, formatClassStd } from '../types';
import {
  PrimarySubjectCode,
  PRIMARY_SUBJECTS,
  computeStudentCceDetails,
  generateDefaultPrimaryMarks,
  ComputedStudentCce,
  exportHtmlTableToExcel,
  distribute100MarksIntoSubject,
  calculatePartBAverageGrade,
} from '../utils/primaryCceHelper';
import { distributeSubject100Marks, distributePartB100Marks } from '../utils/marksDistribution';
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
  ReportPaperSize,
} from '../utils/printPdfHelper';
import { getSavedClassTeacher, persistClassTeacherLocally } from '../utils/teacherHelper';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Share2,
  Save,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Layers,
  BookOpen,
} from 'lucide-react';

import { CcePage1Entry } from './primary_cce/CcePage1Entry';
import { CcePage2Register } from './primary_cce/CcePage2Register';
import { CcePage3ClassGrade } from './primary_cce/CcePage3ClassGrade';
import { CcePage4Detailed400 } from './primary_cce/CcePage4Detailed400';
import { CcePage5AllClassGrade } from './primary_cce/CcePage5AllClassGrade';
import { CcePage6Abstract } from './primary_cce/CcePage6Abstract';

import { MarathiUrduCcePage1Entry } from './marathi_urdu_cce/MarathiUrduCcePage1Entry';
import { MarathiUrduCcePage2Register } from './marathi_urdu_cce/MarathiUrduCcePage2Register';
import { MarathiUrduCcePage3ClassGrade } from './marathi_urdu_cce/MarathiUrduCcePage3ClassGrade';
import { MarathiUrduCcePage4Detailed500 } from './marathi_urdu_cce/MarathiUrduCcePage4Detailed500';
import { MarathiUrduCcePage5AllClassGrade } from './marathi_urdu_cce/MarathiUrduCcePage5AllClassGrade';
import { MarathiUrduCcePage6Abstract } from './marathi_urdu_cce/MarathiUrduCcePage6Abstract';
import { SatsReport } from './marathi_urdu_cce/SatsReport';
import {
  MarathiUrduSubjectCode,
  computeMarathiUrduStudentCce,
  ComputedMarathiUrduStudent,
} from '../utils/marathiUrduCceHelper';
import {
  printMarathiUrduCcePage2Register,
  exportMarathiUrduCcePage2Pdf,
} from '../utils/report_layouts/group2_marathi_urdu/marathiUrduPage2LayoutHelper';

import { HpCcePage1Entry } from './higher_primary_cce/HpCcePage1Entry';
import { HpCcePage2Register9Line } from './higher_primary_cce/HpCcePage2Register9Line';
import { HpCcePage3Register100 } from './higher_primary_cce/HpCcePage3Register100';
import { HpCcePage4SatsGrade } from './higher_primary_cce/HpCcePage4SatsGrade';
import { HpCcePage5ClassAbstract } from './higher_primary_cce/HpCcePage5ClassAbstract';
import { HpCcePage6MasterAbstract } from './higher_primary_cce/HpCcePage6MasterAbstract';
import {
  HpSubjectCode,
  computeHpStudentCce,
  ComputedHpStudent,
  getHpSubjectsForMedium,
} from '../utils/higherPrimaryCceHelper';

interface ActiveCceMarksEntryProps {
  students: Student[];
  schoolRecord: SchoolRecord | null;
  initialClass?: number;
  onBackToHome: () => void;
  academicYear?: string;
}

export type CceTabKey = 'page1' | 'page2' | 'page3' | 'page4' | 'page5' | 'page6' | 'sats';

export const ActiveCceMarksEntry: React.FC<ActiveCceMarksEntryProps> = ({
  students,
  schoolRecord,
  initialClass,
  onBackToHome,
  academicYear = '2026-27',
}) => {
  const diseCode = schoolRecord?.diseCode || '29010409301';
  const schoolMedium = schoolRecord?.schoolMedium || 'Kannada';
  const isKannadaOrEnglish = schoolMedium === 'Kannada' || schoolMedium === 'English';

  // Active Tab: 1 to 6
  const [activeTab, setActiveTab] = useState<CceTabKey>('page1');

  // Wing Selection: 'primary' (Classes 1-5) or 'higherPrimary' (Classes 6-8)
  // Kept in separate tabs for all mediums
  const [activeWing, setActiveWing] = useState<'primary' | 'higherPrimary'>(() => {
    if (initialClass && initialClass >= 6 && initialClass <= 8) {
      return 'higherPrimary';
    }
    return 'primary';
  });

  // Selected Class (1 to 8)
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (initialClass && initialClass >= 1 && initialClass <= 8) {
      return String(initialClass);
    }
    return '3';
  });

  const isHp = activeWing === 'higherPrimary';

  // Synchronize when initialClass prop changes
  useEffect(() => {
    if (initialClass && initialClass >= 1 && initialClass <= 8) {
      setSelectedClass(String(initialClass));
      if (initialClass >= 6) {
        setActiveWing('higherPrimary');
      } else {
        setActiveWing('primary');
      }
    }
  }, [initialClass]);

  const handleSwitchWing = (wing: 'primary' | 'higherPrimary') => {
    setActiveWing(wing);
    if (wing === 'higherPrimary') {
      if (!['6', '7', '8'].includes(selectedClass)) {
        setSelectedClass('6');
      }
    } else {
      if (!['1', '2', '3', '4', '5'].includes(selectedClass)) {
        setSelectedClass('3');
      }
    }
    if (activeTab === 'sats') {
      setActiveTab('page1');
    }
  };

  const handleSelectClass = (cls: string) => {
    setSelectedClass(cls);
    if (['6', '7', '8'].includes(cls)) {
      setActiveWing('higherPrimary');
    } else {
      setActiveWing('primary');
    }
  };

  // Selected Subject for Page 1
  const [selectedSubject, setSelectedSubject] = useState<PrimarySubjectCode>('FL');

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

  // Save changes to localStorage
  const handleTeacherNameChange = (name: string) => {
    setClassTeacherName(name);
    persistClassTeacherLocally(diseCode, selectedClass, name);
  };

  const handleWorkingDaysChange = (days: number) => {
    setWorkingDays(days);
    localStorage.setItem(`kseab_working_days_${diseCode}_${academicYear}`, String(days));
  };

  // Real-time marks state
  const [marksMap, setMarksMap] = useState<Record<string, StudentExamMarks>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
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
      const classSt = students.filter((s) => s.classStandard === cls);
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

  // Currently selected class students
  const currentClassComputedList = useMemo(() => {
    return studentsByClass[selectedClass] || [];
  }, [studentsByClass, selectedClass]);

  const isMarathiOrUrdu = schoolMedium === 'Marathi' || schoolMedium === 'Urdu';
  const marathiUrduMedium: 'Marathi' | 'Urdu' = schoolMedium === 'Urdu' ? 'Urdu' : 'Marathi';

  // Compute detailed CCE records for Marathi/Urdu students across classes 1 to 5 (No auto-generated fake marks)
  const marathiUrduStudentsByClass = useMemo(() => {
    if (!isMarathiOrUrdu) return {};
    const map: Record<string, ComputedMarathiUrduStudent[]> = {
      '1': [],
      '2': [],
      '3': [],
      '4': [],
      '5': [],
    };

    ['1', '2', '3', '4', '5'].forEach((cls) => {
      const classSt = students.filter((s) => s.classStandard === cls);
      map[cls] = classSt.map((st) => {
        const m = marksMap[st.id] || null;
        return computeMarathiUrduStudentCce(st, marathiUrduMedium, m);
      });
    });

    return map;
  }, [students, marksMap, isMarathiOrUrdu, marathiUrduMedium]);

  const currentClassMarathiUrduList = useMemo(() => {
    return marathiUrduStudentsByClass[selectedClass] || [];
  }, [marathiUrduStudentsByClass, selectedClass]);

  // Compute Higher Primary (Classes 6-8) students
  const hpStudentsByClass = useMemo(() => {
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

  const currentClassHpList = useMemo(() => {
    return hpStudentsByClass[selectedClass] || [];
  }, [hpStudentsByClass, selectedClass]);

  // Handle Co-Scholastic Grade Update for Marathi/Urdu (Part B)
  const handleUpdateMarathiUrduCoGrade = (
    studentId: string,
    sem: 'sem1' | 'sem2' | 'final',
    key: string,
    val: string
  ) => {
    const st = students.find((s) => s.id === studentId);
    if (!st) return;

    const existing = marksMap[studentId] || generateDefaultPrimaryMarks(st);
    const semKey = sem === 'final' ? 'finalCo' : sem === 'sem1' ? 'sem1Co' : 'sem2Co';
    const currentSem = (existing as any)[semKey] || {};

    const updatedMarks: any = {
      ...existing,
      studentId,
      diseCode,
      academicYear,
      [semKey]: {
        ...currentSem,
        [key]: val,
      },
    };

    setMarksMap((prev) => ({ ...prev, [studentId]: updatedMarks }));
    saveStudentMarks(diseCode, diseCode, updatedMarks, academicYear).catch(() => {});
  };

  // Handle Mark Update in Page 1 (Raw Marks: FA max 20, SA max 50)
  const handleUpdateMarks = (
    studentId: string,
    subCode: PrimarySubjectCode,
    field: string,
    val: number | null | undefined
  ) => {
    const st = students.find((s) => s.id === studentId);
    if (!st) return;

    const existing = marksMap[studentId] || generateDefaultPrimaryMarks(st);
    const currentSubjects = existing.subjects || {};
    const effectiveCode = (currentSubjects[subCode] ? subCode : subCode === 'MATHS' && currentSubjects['MATH'] ? 'MATH' : subCode) as PrimarySubjectCode;
    const subRecord = currentSubjects[effectiveCode] || { code: effectiveCode };

    const isSa = field === 'sa1' || field === 'sa2';
    const maxRaw = isSa ? 50 : 20;
    const maxPct = isHp ? (isSa ? 30 : 10) : (isSa ? 20 : 15);

    // If cleared / empty / zero: cell can be empty (zero is not required)
    if (val === null || val === undefined || (val as any) === '' || Number(val) === 0) {
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
          ...currentSubjects,
          [effectiveCode]: updatedSubRecord,
        },
      };

      setMarksMap((prev) => ({ ...prev, [studentId]: updatedMarks }));
      saveStudentMarks(diseCode, diseCode, updatedMarks, academicYear).catch(() => {});
      return;
    }

    const clampedRaw = Math.max(1, Math.min(maxRaw, Math.floor(Number(val))));
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
        ...currentSubjects,
        [effectiveCode]: updatedSubRecord,
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
    const maxPct = isHp ? (isSa ? 30 : 10) : (isSa ? 20 : 15);
    const maxRaw = isSa ? 50 : 20;

    const existing = marksMap[studentId] || generateDefaultPrimaryMarks(st);
    const currentSubjects = existing.subjects || {};
    const effectiveCode = (currentSubjects[subCode] ? subCode : subCode === 'MATHS' && currentSubjects['MATH'] ? 'MATH' : subCode) as PrimarySubjectCode;
    const subRecord = currentSubjects[effectiveCode] || { code: effectiveCode };

    // If cleared / empty:
    if (val === null || val === undefined || (val as any) === '') {
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
          ...currentSubjects,
          [effectiveCode]: updatedSubRecord,
        },
      };

      setMarksMap((prev) => ({ ...prev, [studentId]: updatedMarks }));
      saveStudentMarks(diseCode, diseCode, updatedMarks, academicYear).catch(() => {});
      return;
    }

    // Clamped strictly to maximum marks rule, integer only (no decimals, allows 0)
    const clampedPct = Math.floor(Math.max(0, Math.min(maxPct, Number(val))));
    const proportionalRaw = Math.max(0, Math.min(maxRaw, Math.round((clampedPct / maxPct) * maxRaw)));

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
        ...currentSubjects,
        [effectiveCode]: updatedSubRecord,
      },
    };

    setMarksMap((prev) => ({ ...prev, [studentId]: updatedMarks }));
    saveStudentMarks(diseCode, diseCode, updatedMarks, academicYear).catch(() => {});
  };

  // Handle CWSN Toggle in Page 1
  const handleToggleCwsn = (studentId: string, isExempt: boolean) => {
    const st = students.find((s) => s.id === studentId);
    if (!st) return;

    const existing = marksMap[studentId] || generateDefaultPrimaryMarks(st);
    const updatedMarks: any = {
      ...existing,
      studentId,
      diseCode,
      academicYear,
      isCwsnExempt: isExempt,
    };

    setMarksMap((prev) => ({ ...prev, [studentId]: updatedMarks }));
    saveStudentMarks(diseCode, diseCode, updatedMarks, academicYear).catch(() => {});
  };

  // Handle Co-Scholastic Grade Update (Sem 1, Sem 2, and Final)
  const handleUpdateCoScholastic = (
    studentId: string,
    sem: 'sem1' | 'sem2' | 'final',
    key: string,
    val: string
  ) => {
    const st = students.find((s) => s.id === studentId);
    if (!st) return;

    const existing = marksMap[studentId] || generateDefaultPrimaryMarks(st);
    const targetKey = sem === 'sem1' ? 'sem1Co' : sem === 'sem2' ? 'sem2Co' : 'finalCo';
    const currentSem = (existing as any)[targetKey] || {};

    const updatedMarks: any = {
      ...existing,
      studentId,
      diseCode,
      academicYear,
      [targetKey]: {
        ...currentSem,
        [key]: val,
      },
    };

    setMarksMap((prev) => ({ ...prev, [studentId]: updatedMarks }));
    saveStudentMarks(diseCode, diseCode, updatedMarks, academicYear).catch(() => {});
  };

  // 2-Way Synchronized Subject 100-Marks Handler (Converts into FA1-4 & SA1-2 proportionally)
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

    const distributed = distributeSubject100Marks(total100, selectedClass, subCode);

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

  // Handle Attendance Update (Clamped to workingDays, split into Sem 1 & Sem 2)
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

  // Handle Sem 1 and Sem 2 Attendance Update: Strict constraint: sum of sem 1 & sem 2 <= workingDays
  const handleUpdateSemAttendance = (studentId: string, sem: 'sem1' | 'sem2', days: number) => {
    const st = students.find((s) => s.id === studentId);
    if (!st) return;

    const existing = marksMap[studentId] || generateDefaultPrimaryMarks(st);
    const prevSem1 = existing.sem1Attendance !== undefined ? Number(existing.sem1Attendance) : Math.round((existing.attendanceDays || 210) * 0.48);
    const prevSem2 = existing.sem2Attendance !== undefined ? Number(existing.sem2Attendance) : Math.max(0, (existing.attendanceDays || 210) - prevSem1);

    let newSem1 = sem === 'sem1' ? days : prevSem1;
    let newSem2 = sem === 'sem2' ? days : prevSem2;

    // Strict constraint: sum of sem 1 & sem 2 should not be more than school working days
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

  // Handle Final / Average Co-Scholastic Grade Update (Editable Average Grade)
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

  // Handle Part B Marks Update for Class 6-8 (Art Edu / Work Exp & ICT / Computer Edu: 50m sem1, 50m sem2)
  const handleHpUpdatePartBMarks = (
    studentId: string,
    subjectKey: string,
    sem: 'sem1' | 'sem2' | 'total',
    val: number | null
  ) => {
    const st = students.find((s) => s.id === studentId);
    if (!st) return;

    const existing = marksMap[studentId] || generateDefaultPrimaryMarks(st);
    const currentPartB = (existing as any).partBSubjects || {};
    const currentSub = currentPartB[subjectKey] || {};

    const updatedPartB = {
      ...currentPartB,
      [subjectKey]: {
        ...currentSub,
        [sem]: val,
      },
    };

    const updatedMarks: any = {
      ...existing,
      studentId,
      diseCode,
      academicYear,
      partBSubjects: updatedPartB,
    };

    setMarksMap((prev) => ({ ...prev, [studentId]: updatedMarks }));
    saveStudentMarks(diseCode, diseCode, updatedMarks, academicYear).catch(() => {});
  };

  // Save all current class marks explicitly
  const handleSaveAllMarks = async () => {
    setIsSaving(true);
    try {
      const listToSave = isHp
        ? currentClassHpList.map((c) => c.student)
        : isMarathiOrUrdu
        ? currentClassMarathiUrduList.map((c) => c.student)
        : currentClassComputedList.map((c) => c.student);

      for (const st of listToSave) {
        const m = marksMap[st.id] || generateDefaultPrimaryMarks(st);
        await saveStudentMarks(diseCode, diseCode, m, academicYear);
      }
      setSaveSuccessMsg('✓ ಎಲ್ಲಾ ಅಂಕಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ (Saved)!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Error saving marks:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Print Handler
  const handlePrint = async () => {
    if (!reportRef.current) return;
    if (activeTab === 'page2' && isMarathiOrUrdu) {
      const title = `CCE Page 2 100 Marks Consolidation (${marathiUrduMedium} Medium) - Class ${selectedClass}`;
      await printMarathiUrduCcePage2Register(reportRef.current, title, paperSize);
      return;
    }
    const title = `Karnataka_CCE_${activeTab}_Class${selectedClass}_${academicYear}`;
    await executeReportPrint(reportRef.current, title, paperSize);
  };

  // PDF Export
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    if (activeTab === 'page2' && isMarathiOrUrdu) {
      const filename = `CCE_Page2_100Marks_${marathiUrduMedium}_Class_${selectedClass}_${academicYear}_${paperSize.toUpperCase()}_Landscape.pdf`;
      await exportMarathiUrduCcePage2Pdf(reportRef.current, filename, paperSize);
      return;
    }
    const filename = `Karnataka_CCE_${activeTab}_Class${selectedClass}_${academicYear}_${paperSize.toUpperCase()}.pdf`;
    await downloadElementAsPdf(reportRef.current, filename, paperSize);
  };

  // Excel Export
  const handleExportExcel = () => {
    if (!reportRef.current) return;
    const filename = `Karnataka_CCE_${activeTab}_Class${selectedClass}_${academicYear}`;
    exportHtmlTableToExcel(reportRef.current, filename);
  };

  // WhatsApp Share
  const handleShareWhatsApp = async () => {
    const totalStudents = isHp
      ? currentClassHpList.length
      : isMarathiOrUrdu
      ? currentClassMarathiUrduList.length
      : currentClassComputedList.length;
    const caption = `*${schoolRecord?.schoolName || 'Karnataka School'}*\n*${activeTab.toUpperCase()} CCE Report - Class ${selectedClass}*\nAcademic Year: ${academicYear}\nStudents: ${totalStudents}\nHM: ${schoolRecord?.headmasterName || 'Headmaster'}`;
    if (reportRef.current) {
      await shareReportToWhatsApp(reportRef.current, caption, schoolRecord?.mobile);
    } else {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6 text-slate-800 pb-16">
      {/* ========================================================
          1. TOP NOTIFICATION / MEDIUM CHECK
          ======================================================== */}
      {isMarathiOrUrdu ? (
        <div className="p-3 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex items-center justify-between text-xs text-emerald-950 font-bold">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              {schoolMedium} ಮಾಧ್ಯಮ (Classes 1–5): ೫ ವಿಷಯಗಳು (೫೦೦ ಅಂಕಗಳು • Legal Size) ಅಧಿಕೃತ ನಮೂನೆಗಳು ಸಕ್ರಿಯವಾಗಿವೆ.
            </span>
          </div>
          <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-mono text-[11px] rounded-full font-black">
            {schoolMedium} Medium (500 Marks)
          </span>
        </div>
      ) : !isKannadaOrEnglish ? (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-between text-xs text-amber-950 font-bold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              ಗಮನಿಸಿ: ಈ ೬ ಪುಟಗಳ ನಮೂನೆಗಳು ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್ ಮಾಧ್ಯಮದ ಶಾಲೆಗಳ ೧-೫ನೇ ತರಗತಿಯ ಅಧಿಕೃತ ಸಿ.ಸಿ.ಇ ನಿಯಮಾವಳಿಗಳಿಗೆ ಮಾತ್ರ ಅನ್ವಯಿಸುತ್ತವೆ (For Kannada & English Medium Only).
            </span>
          </div>
          <span className="font-mono bg-amber-200 px-2 py-1 rounded">Medium: {schoolMedium}</span>
        </div>
      ) : null}

      {/* ========================================================
          1. WING / SECTION SELECTOR: 1-5th vs 6-8th RESULT ENTRY SEPARATE TABS
          Distinct separate tabs for all mediums (Kannada, English, Marathi, Urdu)
          ======================================================== */}
      <div className="bg-slate-900 text-white rounded-3xl p-3 sm:p-4 shadow-xl border-2 border-indigo-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/40 text-amber-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <span>ಫಲಿತಾಂಶ ದಾಖಲಾತಿ ಹಂತ ಆಯ್ಕೆ (Result Entry Section)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-emerald-300 border border-emerald-500/30 font-black">
                  {schoolMedium} Medium
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                ೧-೫ನೇ ತರಗತಿ (ಪ್ರಾಥಮಿಕ) ಮತ್ತು ೬-೮ನೇ ತರಗತಿ (ಹಿರಿಯ ಪ್ರಾಥಮಿಕ) ಪ್ರತ್ಯೇಕ ಟ್ಯಾಬ್‌ಗಳು • ಎಲ್ಲಾ ಮಾಧ್ಯಮಗಳು
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            {/* Tab 1: 1-5th Class Result Entry */}
            <button
              type="button"
              onClick={() => handleSwitchWing('primary')}
              className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
                activeWing === 'primary'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg ring-2 ring-blue-300'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>೧-೫ನೇ ತರಗತಿ ಫಲಿತಾಂಶ ದಾಖಲಾತಿ</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-200">
                1st–5th Std
              </span>
            </button>

            {/* Tab 2: 6-8th Class Result Entry */}
            <button
              type="button"
              onClick={() => handleSwitchWing('higherPrimary')}
              className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
                activeWing === 'higherPrimary'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg ring-2 ring-emerald-300'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-300" />
              <span>೬-೮ನೇ ತರಗತಿ ಫಲಿತಾಂಶ ದಾಖಲಾತಿ</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-200">
                6th–8th Std
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. HEADER TITLE BAR & DYNAMIC SCHOOL PROFILE
          ======================================================== */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-700 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <h1 className="text-base sm:text-xl font-black tracking-wide font-serif text-white">
                {schoolRecord?.schoolName || 'ಸರಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಕನ್ನಡ ಶಾಲೆ ನಿಂಗ್ಯಾನಟ್ಟಿ'}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-bold">
              <span>ಡೈಸ್ ಕೋಡ್: <span className="font-mono text-amber-300">{diseCode}</span></span>
              <span>• ಕ್ಲಸ್ಟರ್: <span className="text-blue-300">{schoolRecord?.cluster || 'ನಿಂಗ್ಯಾನಟ್ಟಿ'}</span></span>
              <span>• ತಾಲೂಕು: <span className="text-blue-300">{schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ'}</span></span>
              <span>• ಮಾಧ್ಯಮ: <span className="text-emerald-300">{schoolMedium}</span></span>
              <span>• ವಿಭಾಗ: <span className="text-amber-300">{isHp ? '೬-೮ನೇ ತರಗತಿ (Higher Primary)' : '೧-೫ನೇ ತರಗತಿ (Primary)'}</span></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-black bg-blue-900 text-blue-200 border border-blue-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>{academicYear}</span>
            </span>
            <button
              type="button"
              onClick={onBackToHome}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-600"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ಮುಖಪುಟಕ್ಕೆ (Home)</span>
            </button>
          </div>
        </div>

        {/* PAGE TABS SWITCHER AS PER PDF */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {isHp ? (
            <>
              {/* Format 1: Marks Entry */}
              <button
                type="button"
                onClick={() => setActiveTab('page1')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page1'
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>೧. ಅಂಕ ದಾಖಲಾತಿ ನಮೂನೆ (Marks Entry Form)</span>
              </button>

              {/* Format 2: 100 Marks Consolidation */}
              <button
                type="button"
                onClick={() => setActiveTab('page2')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page2'
                    ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>೨. ೧೦೦ ಅಂಕಗಳ ಕ್ರೋಢೀಕರಣ ವರದಿ (100 Marks Consolidation)</span>
              </button>

              {/* Format 3: 9-Line Consolidation */}
              <button
                type="button"
                onClick={() => setActiveTab('page3')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page3'
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>೩. ೯-ಸಾಲು ಸಂಯೋಜಿತ ವರದಿ (9-Line Consolidation)</span>
              </button>

              {/* Format 4: SATS Grade Upload */}
              <button
                type="button"
                onClick={() => setActiveTab('page4')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page4' || activeTab === 'sats'
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span className="font-black">೪. SATS ಗ್ರೇಡ್ ನಮೂನೆ (SATS Grade Upload)</span>
              </button>

              {/* Format 5: Class 1-8 Abstract */}
              <button
                type="button"
                onClick={() => setActiveTab('page5')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page5'
                    ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-300'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>೫. ಶ್ರೇಣಿವಾರು ಘೋಷವಾರ (Class 1-8 Abstract)</span>
              </button>

              {/* Format 6: Master Abstract */}
              <button
                type="button"
                onClick={() => setActiveTab('page6')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page6'
                    ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>೬. ೬-೮ ಮಹಾ ಘೋಷವಾರ (Master Abstract)</span>
              </button>
            </>
          ) : isMarathiOrUrdu ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('page1')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page1'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>೧. ಅಂಕ ನಮೂದು (Page 1: Part A & B - 500m)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('page2')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page2'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>೨. 100 Marks Consolidation Register (Page 2)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('page3')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page3'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>೩. Subject & Grade Details (Page 3)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('page4')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page4'
                    ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>೪. All subject Consolidation 9lines (500marks)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('page5')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page5'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>೫. All Class Abstract (Portrait)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('page6')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page6'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>೬. Annual Result Abstract (Landscape)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sats')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'sats'
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-amber-900/60 text-amber-200 hover:bg-amber-800 hover:text-white border border-amber-600/40'
                }`}
              >
                <span className="font-black">⭐ SATS REPORT</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('page1')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page1'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>೧. ಅಂಕ ನಮೂದು (Page 1: Part A & B)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('page2')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page2'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>೨. 100 ಅಂಕ ಕ್ರೋಢೀಕರಣ ವಹಿ (Page 2)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('page3')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page3'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>೩. ವಿಷಯ & ಶ್ರೇಣಿವಾರು (Page 3)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('page4')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page4'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>All subject Consolidation 9lines(400marks)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('page5')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page5'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title="1-5 All Class Grade Report in Legal Portrait Mode"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>೫. 1-5 ಎಲ್ಲಾ ತರಗತಿ ಶ್ರೇಣಿವಾರು (Page 5: Legal ಭಾವಚಿತ್ರ)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('page6')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'page6'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>೬. ಪರೀಕ್ಷೆ ಹಾಜರಾದ / ಉತ್ತೀರ್ಣ (Page 6: ಪ್ರವರ್ಗವಾರು)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sats')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'sats'
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-amber-900/60 text-amber-200 hover:bg-amber-800 hover:text-white border border-amber-600/40'
                }`}
              >
                <span className="font-black">⭐ SATS REPORT</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================
          3. DYNAMIC CONTROLS & ACTIONS TOOLBAR
          ======================================================== */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Left Side: Selectors (Class 1-5 or 6-8, Subject, Teacher Name, Working Days) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Buttons & Dropdown - Distinct for 1-5 vs 6-8 */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300">
            <span className="text-xs font-black text-slate-700">
              {isHp ? '೬-೮ ತರಗತಿ:' : '೧-೫ ತರಗತಿ:'}
            </span>
            <div className="flex items-center gap-1">
              {(isHp ? ['6', '7', '8'] : ['1', '2', '3', '4', '5']).map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => handleSelectClass(cls)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                    selectedClass === cls
                      ? isHp
                        ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400'
                        : 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-400'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cls}ನೇ
                </button>
              ))}
            </div>
            <select
              value={selectedClass}
              onChange={(e) => handleSelectClass(e.target.value)}
              className="bg-transparent font-black text-xs text-blue-900 focus:outline-none cursor-pointer ml-1"
            >
              {(isHp ? ['6', '7', '8'] : ['1', '2', '3', '4', '5']).map((cls) => (
                <option key={cls} value={cls}>
                  {cls}ನೇ ತರಗತಿ ({formatClassStd(cls)})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Dropdown - Only for Page 1 */}
          {activeTab === 'page1' && (
            <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
              <span className="text-xs font-black text-blue-900">ವಿಷಯ:</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value as PrimarySubjectCode)}
                className="bg-transparent font-black text-xs text-blue-950 focus:outline-none cursor-pointer"
              >
                {isHp
                  ? getHpSubjectsForMedium(schoolMedium).map((sub) => (
                      <option key={sub.code} value={sub.code}>
                        {sub.nameKn} ({sub.nameEn})
                      </option>
                    ))
                  : PRIMARY_SUBJECTS.map((sub) => (
                      <option key={sub.code} value={sub.code}>
                        {sub.nameKn} ({sub.nameEn})
                      </option>
                    ))}
              </select>
            </div>
          )}

          {/* Teacher Name Input */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300">
            <span className="text-xs font-bold text-slate-700">ವರ್ಗ ಶಿಕ್ಷಕರು:</span>
            <input
              type="text"
              value={classTeacherName}
              onChange={(e) => handleTeacherNameChange(e.target.value)}
              className="bg-transparent font-bold text-xs text-slate-900 focus:outline-none w-32 border-b border-slate-400"
              placeholder="ಶಿಕ್ಷಕರ ಹೆಸರು"
            />
          </div>

          {/* Total Working Days Input */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300">
            <span className="text-xs font-bold text-slate-700">ಕೆಲಸದ ದಿನಗಳು:</span>
            <input
              type="number"
              value={workingDays}
              onChange={(e) => handleWorkingDaysChange(Number(e.target.value))}
              className="bg-transparent font-mono font-black text-xs text-slate-900 focus:outline-none w-12 text-center border-b border-slate-400"
            />
          </div>
        </div>

        {/* Right Side: Paper Size Options + Action Buttons (Print, PDF, Excel, WhatsApp, Save) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Paper Size 2 Options: 1. A4 size (295mm × 210mm) & 2. Legal size (340mm × 210mm) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-300 text-xs mr-1">
            <span className="font-bold text-slate-700 px-1">ಸೈಜ್:</span>
            <button
              type="button"
              onClick={() => setPaperSize('a4')}
              className={`px-2 py-1 rounded-lg font-black transition cursor-pointer text-[11px] ${
                paperSize === 'a4'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
              title="1. A4 Size (295mm width, 210mm height)"
            >
              1. A4 (295×210mm)
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('legal')}
              className={`px-2 py-1 rounded-lg font-black transition cursor-pointer text-[11px] ${
                paperSize === 'legal'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
              title="2. Legal Size (340mm width, 210mm height)"
            >
              2. Legal (340×210mm)
            </button>
          </div>

          {activeTab === 'page1' && (
            <button
              type="button"
              onClick={handleSaveAllMarks}
              disabled={isSaving}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'ಅಂಕಗಳನ್ನು ಉಳಿಸಿ (Save)'}</span>
            </button>
          )}

          {!(activeTab === 'page2') && (
            <>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title={`Print in ${paperSize === 'a4' ? 'A4 Size (295×210mm)' : 'Legal Size (340×210mm)'}`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>ಮುದ್ರಿಸಿ ({paperSize === 'a4' ? 'A4' : 'Legal'})</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title={`Download PDF in ${paperSize === 'a4' ? 'A4 Size (295×210mm)' : 'Legal Size (340×210mm)'}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF ({paperSize === 'a4' ? 'A4' : 'Legal'})</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3.5 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp Share</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-black text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================
          4. TAB VIEW CONTENT
          ======================================================== */}
      {isHp ? (
        <div ref={reportRef}>
          {activeTab === 'page1' && (
            <HpCcePage1Entry
              students={students}
              computedList={currentClassHpList}
              selectedSubject={selectedSubject as any}
              selectedClass={selectedClass}
              classTeacherName={classTeacherName}
              workingDays={workingDays}
              schoolMedium={schoolMedium}
              onSelectSubject={(sub) => setSelectedSubject(sub as any)}
              onUpdateMarks={handleUpdateMarks as any}
              onUpdateExamPct={handleUpdateExamPct as any}
              onUpdateSubject100={handleUpdateSubject100 as any}
              onUpdateAttendance={handleUpdateAttendance}
              onUpdateSemAttendance={handleUpdateSemAttendance}
              onUpdateCoGrade={(stId, sem, key, val) => {
                const target = sem === 'sem1' ? 'sem1Co' : sem === 'sem2' ? 'sem2Co' : 'finalCo';
                const ex = marksMap[stId] || { studentId: stId, diseCode, classStandard: selectedClass as any, academicYear, subjects: {} };
                const cur = (ex as any)[target] || {};
                const upd = { ...ex, [target]: { ...cur, [key]: val } };
                setMarksMap((p) => ({ ...p, [stId]: upd }));
                saveStudentMarks(diseCode, diseCode, upd, academicYear);
              }}
              onUpdatePartBMarks={handleHpUpdatePartBMarks}
            />
          )}

          {activeTab === 'page2' && (
            <HpCcePage3Register100
              computedList={currentClassHpList}
              schoolRecord={schoolRecord}
              academicYear={academicYear}
              selectedClass={selectedClass}
              classTeacherName={classTeacherName}
              workingDays={workingDays}
              reportRef={reportRef}
              onUpdateSubject100={handleUpdateSubject100 as any}
              onUpdateAttendance={handleUpdateAttendance}
              onUpdateCoGrade={(stId, sem, key, val) => {
                const target = sem === 'sem1' ? 'sem1Co' : sem === 'sem2' ? 'sem2Co' : 'finalCo';
                const ex = marksMap[stId] || { studentId: stId, diseCode, classStandard: selectedClass as any, academicYear, subjects: {} };
                const cur = (ex as any)[target] || {};
                const upd = { ...ex, [target]: { ...cur, [key]: val } };
                setMarksMap((p) => ({ ...p, [stId]: upd }));
                saveStudentMarks(diseCode, diseCode, upd, academicYear);
              }}
              onUpdatePartBMarks={handleHpUpdatePartBMarks}
            />
          )}

          {activeTab === 'page3' && (
            <HpCcePage2Register9Line
              computedList={currentClassHpList}
              schoolRecord={schoolRecord}
              academicYear={academicYear}
              selectedClass={selectedClass}
              classTeacherName={classTeacherName}
              workingDays={workingDays}
              reportRef={reportRef}
              onUpdateMarks={handleUpdateMarks as any}
              onUpdateExamPct={handleUpdateExamPct as any}
              onUpdateSubject100={handleUpdateSubject100 as any}
              onUpdateAttendance={handleUpdateAttendance}
              onUpdateSemAttendance={handleUpdateSemAttendance}
              onUpdateCoGrade={(stId, sem, key, val) => {
                const target = sem === 'sem1' ? 'sem1Co' : sem === 'sem2' ? 'sem2Co' : 'finalCo';
                const ex = marksMap[stId] || { studentId: stId, diseCode, classStandard: selectedClass as any, academicYear, subjects: {} };
                const cur = (ex as any)[target] || {};
                const upd = { ...ex, [target]: { ...cur, [key]: val } };
                setMarksMap((p) => ({ ...p, [stId]: upd }));
                saveStudentMarks(diseCode, diseCode, upd, academicYear);
              }}
              onUpdatePartBMarks={handleHpUpdatePartBMarks}
            />
          )}

          {(activeTab === 'page4' || activeTab === 'sats') && (
            <HpCcePage4SatsGrade
              computedList={currentClassHpList}
              schoolRecord={schoolRecord}
              academicYear={academicYear}
              selectedClass={selectedClass}
              onSelectClass={setSelectedClass}
              reportRef={reportRef}
            />
          )}

          {activeTab === 'page5' && (
            <HpCcePage5ClassAbstract
              students={students}
              marksMap={marksMap}
              schoolRecord={schoolRecord}
              academicYear={academicYear}
              reportRef={reportRef}
            />
          )}

          {activeTab === 'page6' && (
            <HpCcePage6MasterAbstract
              students={students}
              marksMap={marksMap}
              schoolRecord={schoolRecord}
              academicYear={academicYear}
              reportRef={reportRef}
            />
          )}
        </div>
      ) : (
        <>
          {activeTab === 'page1' && (
            <div ref={reportRef}>
              {isMarathiOrUrdu ? (
                <MarathiUrduCcePage1Entry
                  computedList={currentClassMarathiUrduList}
                  medium={marathiUrduMedium}
                  selectedClass={selectedClass}
                  selectedSubject={selectedSubject as any}
                  classTeacherName={classTeacherName}
                  workingDays={workingDays}
                  onSelectSubject={(sub) => setSelectedSubject(sub as any)}
                  onUpdateMarks={handleUpdateMarks as any}
                  onUpdateExamPct={handleUpdateExamPct as any}
                  onUpdateAttendance={handleUpdateAttendance}
                  onUpdateSemAttendance={handleUpdateSemAttendance}
                  onUpdateCoGrade={handleUpdateMarathiUrduCoGrade}
                />
              ) : (
                <CcePage1Entry
                  students={students}
                  computedList={currentClassComputedList}
                  selectedSubject={selectedSubject}
                  selectedClass={selectedClass}
                  classTeacherName={classTeacherName}
                  workingDays={workingDays}
                  onUpdateMarks={handleUpdateMarks}
                  onUpdateExamPct={handleUpdateExamPct}
                  onToggleCwsn={handleToggleCwsn}
                  onUpdateCoScholastic={handleUpdateCoScholastic}
                  onUpdateAttendance={handleUpdateAttendance}
                  onUpdateSemAttendance={handleUpdateSemAttendance}
                  onUpdateFinalCoGrade={handleUpdateFinalCoGrade}
                />
              )}
            </div>
          )}

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
                onUpdateAttendance={handleUpdateAttendance}
                onUpdateSemAttendance={handleUpdateSemAttendance}
                onUpdateCoScholastic={handleUpdateCoScholastic}
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
                onUpdateCoScholastic={handleUpdateCoScholastic}
              />
            )
          )}

          {!isMarathiOrUrdu && activeTab === 'page5' && (
            <CcePage5AllClassGrade
              studentsByClass={studentsByClass}
              schoolRecord={schoolRecord}
              academicYear={academicYear}
              reportRef={reportRef}
            />
          )}

          {!isMarathiOrUrdu && activeTab === 'page6' && (
            <CcePage6Abstract
              studentsByClass={studentsByClass}
              schoolRecord={schoolRecord}
              academicYear={academicYear}
              reportRef={reportRef}
            />
          )}
        </>
      )}

      {/* Footer credits */}
      <div className="text-center py-4 text-xs font-bold text-slate-600 border-t border-slate-200">
        <span>Design by : ಶ್ರೀ ಎಸ್‌ ಆರ್‌ ಅಂಗಡಿ (ವಿಜ್ಞಾನ - ಶಿಕ್ಷಕರು) ಮೊ : 9731766727</span>
      </div>
    </div>
  );
};
