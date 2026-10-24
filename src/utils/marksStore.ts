/**
 * Marks & Examination Store for Active Karnataka Schools
 * Firebase Firestore is the Authoritative Single Source of Truth
 * Structure: schools/{diseCode}/examMarks/{studentId}
 */

import { Student, StudentClass, SubjectMarksRecord, StudentExamMarks, SchoolMedium, CoCurricularRecord, isCwsnExempted, isCwsnStudent } from '../types';
import { getSubjectsForMediumAndClass, getMaxMarksForMediumAndClass } from '../data/subjectConfig';
import { calculateGrade, calculateSubjectGrade } from '../data/demoData';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, onSnapshot, writeBatch } from 'firebase/firestore';
import { cleanForFirestore } from './studentStore';

const getMarksStorageKey = (diseCode: string, academicYear?: string) => {
  return academicYear ? `kseab_real_exam_marks_${diseCode}_${academicYear}` : `kseab_real_exam_marks_${diseCode}`;
};

export interface ClassExamProgress {
  classStandard: StudentClass;
  totalStudents: number;
  fa1Percent: number;
  fa2Percent: number;
  sa1Percent: number;
  fa3Percent: number;
  fa4Percent: number;
  sa2Percent: number;
  overallPercent: number;
}

export const getRealMarksFromLocal = (
  diseCode: string,
  academicYear?: string
): Record<string, StudentExamMarks> => {
  try {
    if (academicYear) {
      const yearRaw = localStorage.getItem(getMarksStorageKey(diseCode, academicYear));
      if (yearRaw) {
        return JSON.parse(yearRaw);
      }
    }
    const raw = localStorage.getItem(getMarksStorageKey(diseCode));
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Error loading marks from local cache:', err);
    return {};
  }
};

export const saveRealMarksToLocal = (
  diseCode: string,
  marksMap: Record<string, StudentExamMarks>,
  academicYear?: string
): void => {
  try {
    localStorage.setItem(getMarksStorageKey(diseCode), JSON.stringify(marksMap));
    if (academicYear) {
      localStorage.setItem(getMarksStorageKey(diseCode, academicYear), JSON.stringify(marksMap));
    }
  } catch (err) {
    console.warn('Error saving marks to local cache:', err);
  }
};

/**
 * Load exam marks authoritative from Firestore
 */
export const loadSchoolMarks = async (
  schoolIdOrDise: string,
  explicitDise?: string,
  academicYear?: string
): Promise<Record<string, StudentExamMarks>> => {
  const diseCode = explicitDise || schoolIdOrDise;
  if (!diseCode) return {};

  try {
    const colRef = collection(db, 'schools', diseCode, 'examMarks');
    const snap = await getDocs(colRef);

    if (!snap.empty) {
      const marksMap: Record<string, StudentExamMarks> = {};
      snap.forEach((d) => {
        const item = d.data() as StudentExamMarks;
        if (!academicYear || !item.academicYear || item.academicYear === academicYear) {
          marksMap[d.id] = item;
        }
      });
      saveRealMarksToLocal(diseCode, marksMap, academicYear);
      return marksMap;
    }

    // Check if empty in Firestore but local cache has entries (migrate local to Firestore)
    const local = getRealMarksFromLocal(diseCode, academicYear);
    const keys = Object.keys(local);
    if (keys.length > 0) {
      console.info(`Migrating ${keys.length} student marks to Firestore for DISE: ${diseCode}`);
      const batch = writeBatch(db);
      keys.forEach((stdId) => {
        const ref = doc(db, 'schools', diseCode, 'examMarks', stdId);
        batch.set(ref, cleanForFirestore(local[stdId]));
      });
      await batch.commit().catch(() => {});
      return local;
    }

    return {};
  } catch (err) {
    console.warn('Firestore load marks notice, using local cache:', err);
    return getRealMarksFromLocal(diseCode, academicYear);
  }
};

/**
 * Real-time listener for school exam marks
 */
export const subscribeSchoolMarks = (
  diseCode: string,
  onUpdate: (marks: Record<string, StudentExamMarks>) => void,
  academicYear?: string
): (() => void) => {
  if (!diseCode) return () => {};

  const colRef = collection(db, 'schools', diseCode, 'examMarks');
  return onSnapshot(
    colRef,
    (snap) => {
      const map: Record<string, StudentExamMarks> = {};
      snap.forEach((d) => {
        const item = d.data() as StudentExamMarks;
        if (!academicYear || !item.academicYear || item.academicYear === academicYear) {
          map[d.id] = item;
        }
      });
      saveRealMarksToLocal(diseCode, map, academicYear);
      onUpdate(map);
    },
    (err) => {
      console.warn('Real-time marks listener notice:', err);
      onUpdate(getRealMarksFromLocal(diseCode, academicYear));
    }
  );
};

/**
 * Save marks for a student directly to Firestore & local cache
 */
export const saveStudentMarks = async (
  schoolIdOrDise: string,
  diseCode: string,
  studentMarks: StudentExamMarks,
  academicYear?: string
): Promise<void> => {
  const targetDise = diseCode || schoolIdOrDise;
  const currentYear = academicYear || studentMarks.academicYear || '2026-27';
  const cleanMarks: StudentExamMarks = {
    ...studentMarks,
    diseCode: targetDise,
    academicYear: currentYear,
    updatedAt: new Date().toISOString(),
  };

  // 1. Write to Firestore safely
  try {
    const docRef = doc(db, 'schools', targetDise, 'examMarks', studentMarks.studentId);
    await setDoc(docRef, cleanForFirestore(cleanMarks));
  } catch (err) {
    console.warn('Firestore saveStudentMarks network notice (saved in local cache):', err);
  }

  // 2. Update local cache
  const current = getRealMarksFromLocal(targetDise, currentYear);
  current[studentMarks.studentId] = cleanMarks;
  saveRealMarksToLocal(targetDise, current, currentYear);
};

/**
 * Reset all marks for an academic year (used during student promotion to a fresh academic year)
 */
export const resetSchoolMarksForAcademicYear = async (
  diseCode: string,
  academicYear: string
): Promise<void> => {
  try {
    localStorage.removeItem(getMarksStorageKey(diseCode, academicYear));
    localStorage.setItem(getMarksStorageKey(diseCode, academicYear), JSON.stringify({}));
  } catch (err) {
    console.warn('Error resetting marks in local cache:', err);
  }
};

/**
 * Calculates exam entry completion percentages for each of the 10 classes
 */
export const calculateClasswiseExamProgress = (
  students: Student[],
  marksMap: Record<string, StudentExamMarks>
): ClassExamProgress[] => {
  const classes: StudentClass[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

  return classes.map((cls) => {
    const classStudents = students.filter((s) => s.classStandard === cls);
    const total = classStudents.length;

    if (total === 0) {
      return {
        classStandard: cls,
        totalStudents: 0,
        fa1Percent: 0,
        fa2Percent: 0,
        sa1Percent: 0,
        fa3Percent: 0,
        fa4Percent: 0,
        sa2Percent: 0,
        overallPercent: 0,
      };
    }

    let fa1Count = 0;
    let fa2Count = 0;
    let sa1Count = 0;
    let fa3Count = 0;
    let fa4Count = 0;
    let sa2Count = 0;

    classStudents.forEach((st) => {
      const entry = marksMap[st.id];
      if (entry && entry.subjects) {
        const subList = Object.values(entry.subjects);
        if (subList.some((s) => s.fa1 !== null && s.fa1 !== undefined)) fa1Count++;
        if (subList.some((s) => s.fa2 !== null && s.fa2 !== undefined)) fa2Count++;
        if (subList.some((s) => s.sa1 !== null && s.sa1 !== undefined)) sa1Count++;
        if (subList.some((s) => s.fa3 !== null && s.fa3 !== undefined)) fa3Count++;
        if (subList.some((s) => s.fa4 !== null && s.fa4 !== undefined)) fa4Count++;
        if (subList.some((s) => s.sa2 !== null && s.sa2 !== undefined)) sa2Count++;
      }
    });

    const fa1Percent = Math.round((fa1Count / total) * 100);
    const fa2Percent = Math.round((fa2Count / total) * 100);
    const sa1Percent = Math.round((sa1Count / total) * 100);
    const fa3Percent = Math.round((fa3Count / total) * 100);
    const fa4Percent = Math.round((fa4Count / total) * 100);
    const sa2Percent = Math.round((sa2Count / total) * 100);

    const overallPercent = Math.round(
      (fa1Percent + fa2Percent + sa1Percent + fa3Percent + fa4Percent + sa2Percent) / 6
    );

    return {
      classStandard: cls,
      totalStudents: total,
      fa1Percent,
      fa2Percent,
      sa1Percent,
      fa3Percent,
      fa4Percent,
      sa2Percent,
      overallPercent,
    };
  });
};

export interface CalculatedStudentResult {
  student: Student;
  subjects: {
    code: string;
    subjectName: string;
    kannadaName: string;
    maxMarks: number;
    fa1: number | null;
    fa2: number | null;
    sa1: number | null;
    fa3: number | null;
    fa4: number | null;
    sa2: number | null;
    total: number;
    grade: string;
  }[];
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  overallGrade: string;
  resultStatus: 'PROMOTED' | 'ELIGIBLE FOR SUPPLEMENTARY' | 'DETAINED' | 'CWSN';
  isEntered: boolean;
}

export const getStudentCalculatedResult = (
  student: Student,
  medium: SchoolMedium,
  marksMap: Record<string, StudentExamMarks>,
  rollNo: number = 1
): CalculatedStudentResult => {
  const classNum = Number(student.classStandard) || 5;
  const configs = getSubjectsForMediumAndClass(medium, classNum);
  const maxTotal = getMaxMarksForMediumAndClass(medium, classNum);
  const entry = marksMap[student.id];

  const hasAnyEntered =
    entry &&
    entry.subjects &&
    Object.values(entry.subjects).some(
      (s) =>
        s.fa1 !== null ||
        s.fa2 !== null ||
        s.sa1 !== null ||
        s.fa3 !== null ||
        s.fa4 !== null ||
        s.sa2 !== null
    );

  const isMarksAllowed = student.cwsnStatus === 'MARKS_ALLOWED' || student.cwsnStatus === 'YES_MARKS';
  const isCwsn = isCwsnStudent(student.cwsnStatus) || (entry as any)?.isCwsnExempt;
  const isExempted = isMarksAllowed ? false : (isCwsnExempted(student.cwsnStatus) || (entry as any)?.isCwsnExempt);

  const subjects = configs.map((cfg) => {
    const sEntry =
      entry?.subjects?.[cfg.code] ||
      (cfg.code === 'MATH' ? entry?.subjects?.['MATHS'] : cfg.code === 'MATHS' ? entry?.subjects?.['MATH'] : undefined);

    const isPrimary = classNum <= 5;
    let fa1: number | null = null;
    let fa2: number | null = null;
    let sa1: number | null = null;
    let fa3: number | null = null;
    let fa4: number | null = null;
    let sa2: number | null = null;

    if (isPrimary) {
      if (sEntry?.fa1_pct !== undefined && sEntry?.fa1_pct !== null && (sEntry?.fa1_pct as any) !== '' && Number(sEntry.fa1_pct) > 0) {
        fa1 = Math.min(15, Math.max(0, Math.floor(Number(sEntry.fa1_pct))));
      } else if (sEntry?.fa1 !== undefined && sEntry?.fa1 !== null && (sEntry?.fa1 as any) !== '' && Number(sEntry.fa1) > 0) {
        fa1 = Math.min(15, Math.max(0, Math.floor((Number(sEntry.fa1) * 15) / 20)));
      }

      if (sEntry?.fa2_pct !== undefined && sEntry?.fa2_pct !== null && (sEntry?.fa2_pct as any) !== '' && Number(sEntry.fa2_pct) > 0) {
        fa2 = Math.min(15, Math.max(0, Math.floor(Number(sEntry.fa2_pct))));
      } else if (sEntry?.fa2 !== undefined && sEntry?.fa2 !== null && (sEntry?.fa2 as any) !== '' && Number(sEntry.fa2) > 0) {
        fa2 = Math.min(15, Math.max(0, Math.floor((Number(sEntry.fa2) * 15) / 20)));
      }

      if (sEntry?.sa1_pct !== undefined && sEntry?.sa1_pct !== null && (sEntry?.sa1_pct as any) !== '' && Number(sEntry.sa1_pct) > 0) {
        sa1 = Math.min(20, Math.max(0, Math.floor(Number(sEntry.sa1_pct))));
      } else if (sEntry?.sa1 !== undefined && sEntry?.sa1 !== null && (sEntry?.sa1 as any) !== '' && Number(sEntry.sa1) > 0) {
        sa1 = Math.min(20, Math.max(0, Math.floor((Number(sEntry.sa1) * 20) / 50)));
      }

      if (sEntry?.fa3_pct !== undefined && sEntry?.fa3_pct !== null && (sEntry?.fa3_pct as any) !== '' && Number(sEntry.fa3_pct) > 0) {
        fa3 = Math.min(15, Math.max(0, Math.floor(Number(sEntry.fa3_pct))));
      } else if (sEntry?.fa3 !== undefined && sEntry?.fa3 !== null && (sEntry?.fa3 as any) !== '' && Number(sEntry.fa3) > 0) {
        fa3 = Math.min(15, Math.max(0, Math.floor((Number(sEntry.fa3) * 15) / 20)));
      }

      if (sEntry?.fa4_pct !== undefined && sEntry?.fa4_pct !== null && (sEntry?.fa4_pct as any) !== '' && Number(sEntry.fa4_pct) > 0) {
        fa4 = Math.min(15, Math.max(0, Math.floor(Number(sEntry.fa4_pct))));
      } else if (sEntry?.fa4 !== undefined && sEntry?.fa4 !== null && (sEntry?.fa4 as any) !== '' && Number(sEntry.fa4) > 0) {
        fa4 = Math.min(15, Math.max(0, Math.floor((Number(sEntry.fa4) * 15) / 20)));
      }

      if (sEntry?.sa2_pct !== undefined && sEntry?.sa2_pct !== null && (sEntry?.sa2_pct as any) !== '' && Number(sEntry.sa2_pct) > 0) {
        sa2 = Math.min(20, Math.max(0, Math.floor(Number(sEntry.sa2_pct))));
      } else if (sEntry?.sa2 !== undefined && sEntry?.sa2 !== null && (sEntry?.sa2 as any) !== '' && Number(sEntry.sa2) > 0) {
        sa2 = Math.min(20, Math.max(0, Math.floor((Number(sEntry.sa2) * 20) / 50)));
      }
    } else {
      fa1 = sEntry?.fa1 !== undefined && sEntry?.fa1 !== null && (sEntry?.fa1 as any) !== '' ? Number(sEntry.fa1) : null;
      fa2 = sEntry?.fa2 !== undefined && sEntry?.fa2 !== null && (sEntry?.fa2 as any) !== '' ? Number(sEntry.fa2) : null;
      sa1 = sEntry?.sa1 !== undefined && sEntry?.sa1 !== null && (sEntry?.sa1 as any) !== '' ? Number(sEntry.sa1) : null;
      fa3 = sEntry?.fa3 !== undefined && sEntry?.fa3 !== null && (sEntry?.fa3 as any) !== '' ? Number(sEntry.fa3) : null;
      fa4 = sEntry?.fa4 !== undefined && sEntry?.fa4 !== null && (sEntry?.fa4 as any) !== '' ? Number(sEntry.fa4) : null;
      sa2 = sEntry?.sa2 !== undefined && sEntry?.sa2 !== null && (sEntry?.sa2 as any) !== '' ? Number(sEntry.sa2) : null;
    }

    const total = Number(
      ((fa1 || 0) + (fa2 || 0) + (sa1 || 0) + (fa3 || 0) + (fa4 || 0) + (sa2 || 0)).toFixed(1)
    );
    const hasAnyMarks =
      fa1 !== null ||
      fa2 !== null ||
      sa1 !== null ||
      fa3 !== null ||
      fa4 !== null ||
      sa2 !== null;

    const grade = isExempted ? 'Exempt' : hasAnyMarks ? calculateSubjectGrade(total, cfg.maxMarks) : '-';

    return {
      code: cfg.code,
      subjectName: cfg.subjectName,
      kannadaName: cfg.kannadaName,
      maxMarks: cfg.maxMarks,
      fa1,
      fa2,
      sa1,
      fa3,
      fa4,
      sa2,
      total,
      grade,
    };
  });

  const totalMarks = Number(subjects.reduce((sum, s) => sum + s.total, 0).toFixed(1));
  const percentage = maxTotal > 0 ? Number(((totalMarks / maxTotal) * 100).toFixed(2)) : 0;
  const overallGrade = isExempted ? 'Exempt' : (hasAnyEntered && totalMarks > 0) ? calculateGrade(percentage) : '-';

  const resultStatus: 'PROMOTED' | 'ELIGIBLE FOR SUPPLEMENTARY' | 'DETAINED' | 'CWSN' =
    isCwsn
      ? 'PROMOTED'
      : !hasAnyEntered
      ? ('-' as any)
      : percentage >= 30
      ? 'PROMOTED'
      : 'DETAINED';

  return {
    student,
    subjects,
    totalMarks,
    maxTotalMarks: maxTotal,
    percentage,
    overallGrade,
    resultStatus,
    isEntered: !!hasAnyEntered,
  };
};
