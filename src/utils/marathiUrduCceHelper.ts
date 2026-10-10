/**
 * Marathi & Urdu Medium Primary CCE Helper (Classes 1–5, 5 Subjects, 500 Marks)
 * Designed strictly as per KSEAB / DSERT specifications.
 * 
 * Subjects:
 * - Marathi Medium:
 *     1. First Language: Marathi (FL)
 *     2. Second Language: Kannada (SL)
 *     3. Third Language: English (TL)
 *     4. Mathematics (MATHS)
 *     5. Environmental Studies (EVS)
 * - Urdu Medium:
 *     1. First Language: Urdu (FL)
 *     2. Second Language: Kannada (SL)
 *     3. Third Language: English (TL)
 *     4. Mathematics (MATHS)
 *     5. Environmental Studies (EVS)
 * 
 * 5 Subjects x 100 Marks = 500 Maximum Marks.
 * Legal Size, exact color schemes, text orientations, and CWSN rules applied.
 */

import { Student, StudentExamMarks, isCwsnExempted, isCwsnStudent } from '../types';

export type MarathiUrduSubjectCode = 'FL' | 'SL' | 'TL' | 'MATHS' | 'EVS';

export interface MarathiUrduSubjectConfig {
  code: MarathiUrduSubjectCode;
  nameEn: string;
  shortEn: string;
  rawKey: string;
}

export const getMarathiUrduSubjects = (medium: 'Marathi' | 'Urdu'): MarathiUrduSubjectConfig[] => [
  {
    code: 'FL',
    nameEn: medium === 'Urdu' ? 'First Language (Urdu)' : 'First Language (Marathi)',
    shortEn: 'First Lang',
    rawKey: 'FL',
  },
  {
    code: 'SL',
    nameEn: 'Second Language (Kannada)',
    shortEn: 'Sec Lang',
    rawKey: 'SL',
  },
  {
    code: 'TL',
    nameEn: 'Third Language (English)',
    shortEn: 'Third Lang',
    rawKey: 'TL',
  },
  {
    code: 'MATHS',
    nameEn: 'Mathematics',
    shortEn: 'MATHS',
    rawKey: 'MATH',
  },
  {
    code: 'EVS',
    nameEn: 'Environmental Studies',
    shortEn: 'EVS',
    rawKey: 'EVS',
  },
];

export const MARATHI_URDU_CO_ACTIVITIES = [
  { key: 'physical', nameEn: 'PHYSICAL & HEALTH EDUCATION' },
  { key: 'art', nameEn: 'ARTS & CRAFT' },
  { key: 'music', nameEn: 'MUSIC & DANCE' },
  { key: 'supw', nameEn: 'SOCIALLI USEFUL PRODUCTIVE WORK' },
  { key: 'values', nameEn: 'VALUES, PERSONAL & SOCIAL GROWTH' },
] as const;

export interface ComputedMarathiUrduSubject {
  code: MarathiUrduSubjectCode;
  nameEn: string;
  fa1: number;
  fa1_pct: number;
  fa1_grade: string;
  fa2: number;
  fa2_pct: number;
  fa2_grade: string;
  sa1: number;
  sa1_pct: number;
  sa1_grade: string;
  sem1_total: number;
  fa3: number;
  fa3_pct: number;
  fa3_grade: string;
  fa4: number;
  fa4_pct: number;
  fa4_grade: string;
  sa2: number;
  sa2_pct: number;
  sa2_grade: string;
  sem2_total: number;
  total100: number;
  grade: string;
}

export interface ComputedMarathiUrduStudent {
  student: Student;
  subjects: Record<MarathiUrduSubjectCode, ComputedMarathiUrduSubject>;
  attendanceDays: number;
  sem1Attendance: number;
  sem2Attendance: number;
  totalMarks500: number;
  percentage: number;
  overallGrade: string;
  resultStatus: string;
  isExempted: boolean;
  hasCwsnBadge: boolean;
  coScholastic: {
    sem1: Record<string, string>;
    sem2: Record<string, string>;
    final: Record<string, string>;
  };
}

export const calculateGrade = (pct: number): 'A+' | 'A' | 'B+' | 'B' | 'C' => {
  if (pct >= 90) return 'A+';
  if (pct >= 70) return 'A';
  if (pct >= 50) return 'B+';
  if (pct >= 30) return 'B';
  return 'C';
};

/**
 * Compute 5-Subject CCE for a Marathi or Urdu student.
 * Never invents mock marks if marks are unentered (defaults to 0).
 */
export const computeMarathiUrduStudentCce = (
  student: Student,
  medium: 'Marathi' | 'Urdu',
  examMarks?: StudentExamMarks | null
): ComputedMarathiUrduStudent => {
  const isMarksAllowed = student.cwsnStatus === 'MARKS_ALLOWED' || student.cwsnStatus === 'YES_MARKS';
  const isExempted = isMarksAllowed ? false : (isCwsnExempted(student.cwsnStatus) || (examMarks as any)?.isCwsnExempt === true);
  const hasCwsnBadge = isCwsnStudent(student.cwsnStatus) || isExempted;

  const attendanceDays = examMarks?.attendanceDays !== undefined ? Number(examMarks.attendanceDays) : 0;
  const sem1Attendance = (examMarks as any)?.sem1Attendance !== undefined ? Number((examMarks as any)?.sem1Attendance) : 0;
  const sem2Attendance = (examMarks as any)?.sem2Attendance !== undefined ? Number((examMarks as any)?.sem2Attendance) : 0;

  const subjectConfigs = getMarathiUrduSubjects(medium);
  const subjectsRecord: Record<MarathiUrduSubjectCode, ComputedMarathiUrduSubject> = {} as any;
  let totalMarks500 = 0;
  let hasAnyMarksEntered = false;

  subjectConfigs.forEach((cfg) => {
    const raw = (examMarks?.subjects?.[cfg.code] as any) || (examMarks?.subjects?.[cfg.rawKey] as any) || {};

    // FA1: Raw 20 -> 15% (Strict integer, rounded down, no decimals)
    const rawFa1Val = raw.fa1 !== undefined && raw.fa1 !== null && raw.fa1 !== '' ? Number(raw.fa1) : null;
    const rawFa1PctVal = raw.fa1_pct !== undefined && raw.fa1_pct !== null && raw.fa1_pct !== '' ? Number(raw.fa1_pct) : null;
    const hasFa1 = (rawFa1Val !== null && rawFa1Val > 0) || (rawFa1PctVal !== null && rawFa1PctVal > 0);
    let fa1_pct: number | null = null;
    let fa1: number | null = null;
    let fa1_grade = '-';

    if (hasFa1) {
      if (rawFa1PctVal !== null && rawFa1PctVal > 0) {
        fa1_pct = Math.floor(Math.min(15, Math.max(0, rawFa1PctVal)));
        fa1 = rawFa1Val !== null && rawFa1Val > 0
          ? Math.min(20, Math.max(0, Math.floor(rawFa1Val)))
          : Math.min(20, Math.max(0, Math.round((fa1_pct * 20) / 15)));
      } else if (rawFa1Val !== null && rawFa1Val > 0) {
        const rawClamped = Math.min(20, Math.max(0, Math.floor(rawFa1Val)));
        fa1 = rawClamped;
        fa1_pct = Math.floor((rawClamped * 15) / 20); // STRICTLY ROUND DOWN, NO DECIMALS
      }
      fa1_grade = isExempted ? 'Exempt' : ((fa1_pct || 0) > 0 ? calculateGrade(((fa1_pct || 0) / 15) * 100) : '-');
      hasAnyMarksEntered = true;
    } else if (isExempted) {
      fa1_grade = 'Exempt';
    }

    // FA2: Raw 20 -> 15% (Strict integer, rounded down, no decimals)
    const rawFa2Val = raw.fa2 !== undefined && raw.fa2 !== null && raw.fa2 !== '' ? Number(raw.fa2) : null;
    const rawFa2PctVal = raw.fa2_pct !== undefined && raw.fa2_pct !== null && raw.fa2_pct !== '' ? Number(raw.fa2_pct) : null;
    const hasFa2 = (rawFa2Val !== null && rawFa2Val > 0) || (rawFa2PctVal !== null && rawFa2PctVal > 0);
    let fa2_pct: number | null = null;
    let fa2: number | null = null;
    let fa2_grade = isExempted ? 'Exempt' : '-';

    if (hasFa2) {
      if (rawFa2PctVal !== null && rawFa2PctVal > 0) {
        fa2_pct = Math.floor(Math.min(15, Math.max(0, rawFa2PctVal)));
        fa2 = rawFa2Val !== null && rawFa2Val > 0
          ? Math.min(20, Math.max(0, Math.floor(rawFa2Val)))
          : Math.min(20, Math.max(0, Math.round((fa2_pct * 20) / 15)));
      } else if (rawFa2Val !== null && rawFa2Val > 0) {
        const rawClamped = Math.min(20, Math.max(0, Math.floor(rawFa2Val)));
        fa2 = rawClamped;
        fa2_pct = Math.floor((rawClamped * 15) / 20);
      }
      fa2_grade = isExempted ? 'Exempt' : ((fa2_pct || 0) > 0 ? calculateGrade(((fa2_pct || 0) / 15) * 100) : '-');
      hasAnyMarksEntered = true;
    } else if (isExempted) {
      fa2_grade = 'Exempt';
    }

    // SA1: Raw 50 -> 20% (Strict integer, rounded down, no decimals)
    const rawSa1Val = raw.sa1 !== undefined && raw.sa1 !== null && raw.sa1 !== '' ? Number(raw.sa1) : null;
    const rawSa1PctVal = raw.sa1_pct !== undefined && raw.sa1_pct !== null && raw.sa1_pct !== '' ? Number(raw.sa1_pct) : null;
    const hasSa1 = (rawSa1Val !== null && rawSa1Val > 0) || (rawSa1PctVal !== null && rawSa1PctVal > 0);
    let sa1_pct: number | null = null;
    let sa1: number | null = null;
    let sa1_grade = isExempted ? 'Exempt' : '-';

    if (hasSa1) {
      if (rawSa1PctVal !== null && rawSa1PctVal > 0) {
        sa1_pct = Math.floor(Math.min(20, Math.max(0, rawSa1PctVal)));
        sa1 = rawSa1Val !== null && rawFa1Val !== null && rawSa1Val > 0
          ? Math.min(50, Math.max(0, Math.floor(rawSa1Val)))
          : Math.min(50, Math.max(0, Math.round((sa1_pct * 50) / 20)));
      } else if (rawSa1Val !== null && rawSa1Val > 0) {
        const rawClamped = Math.min(50, Math.max(0, Math.floor(rawSa1Val)));
        sa1 = rawClamped;
        sa1_pct = Math.floor((rawClamped * 20) / 50);
      }
      sa1_grade = isExempted ? 'Exempt' : ((sa1_pct || 0) > 0 ? calculateGrade(((sa1_pct || 0) / 20) * 100) : '-');
      hasAnyMarksEntered = true;
    } else if (isExempted) {
      sa1_grade = 'Exempt';
    }

    const hasSem1 = hasFa1 || hasFa2 || hasSa1;
    const sem1_total = hasSem1
      ? ((fa1_pct || 0) + (fa2_pct || 0) + (sa1_pct || 0))
      : null;

    // FA3: Raw 20 -> 15% (Strict integer, rounded down, no decimals)
    const rawFa3Val = raw.fa3 !== undefined && raw.fa3 !== null && raw.fa3 !== '' ? Number(raw.fa3) : null;
    const rawFa3PctVal = raw.fa3_pct !== undefined && raw.fa3_pct !== null && raw.fa3_pct !== '' ? Number(raw.fa3_pct) : null;
    const hasFa3 = (rawFa3Val !== null && rawFa3Val > 0) || (rawFa3PctVal !== null && rawFa3PctVal > 0);
    let fa3_pct: number | null = null;
    let fa3: number | null = null;
    let fa3_grade = isExempted ? 'Exempt' : '-';

    if (hasFa3) {
      if (rawFa3PctVal !== null && rawFa3PctVal > 0) {
        fa3_pct = Math.floor(Math.min(15, Math.max(0, rawFa3PctVal)));
        fa3 = rawFa3Val !== null && rawFa3Val > 0
          ? Math.min(20, Math.max(0, Math.floor(rawFa3Val)))
          : Math.min(20, Math.max(0, Math.round((fa3_pct * 20) / 15)));
      } else if (rawFa3Val !== null && rawFa3Val > 0) {
        const rawClamped = Math.min(20, Math.max(0, Math.floor(rawFa3Val)));
        fa3 = rawClamped;
        fa3_pct = Math.floor((rawClamped * 15) / 20);
      }
      fa3_grade = isExempted ? 'Exempt' : ((fa3_pct || 0) > 0 ? calculateGrade(((fa3_pct || 0) / 15) * 100) : '-');
      hasAnyMarksEntered = true;
    } else if (isExempted) {
      fa3_grade = 'Exempt';
    }

    // FA4: Raw 20 -> 15% (Strict integer, rounded down, no decimals)
    const rawFa4Val = raw.fa4 !== undefined && raw.fa4 !== null && raw.fa4 !== '' ? Number(raw.fa4) : null;
    const rawFa4PctVal = raw.fa4_pct !== undefined && raw.fa4_pct !== null && raw.fa4_pct !== '' ? Number(raw.fa4_pct) : null;
    const hasFa4 = (rawFa4Val !== null && rawFa4Val > 0) || (rawFa4PctVal !== null && rawFa4PctVal > 0);
    let fa4_pct: number | null = null;
    let fa4: number | null = null;
    let fa4_grade = isExempted ? 'Exempt' : '-';

    if (hasFa4) {
      if (rawFa4PctVal !== null && rawFa4PctVal > 0) {
        fa4_pct = Math.floor(Math.min(15, Math.max(0, rawFa4PctVal)));
        fa4 = rawFa4Val !== null && rawFa4Val > 0
          ? Math.min(20, Math.max(0, Math.floor(rawFa4Val)))
          : Math.min(20, Math.max(0, Math.round((fa4_pct * 20) / 15)));
      } else if (rawFa4Val !== null && rawFa4Val > 0) {
        const rawClamped = Math.min(20, Math.max(0, Math.floor(rawFa4Val)));
        fa4 = rawClamped;
        fa4_pct = Math.floor((rawClamped * 15) / 20);
      }
      fa4_grade = isExempted ? 'Exempt' : ((fa4_pct || 0) > 0 ? calculateGrade(((fa4_pct || 0) / 15) * 100) : '-');
      hasAnyMarksEntered = true;
    } else if (isExempted) {
      fa4_grade = 'Exempt';
    }

    // SA2: Raw 50 -> 20% (Strict integer, rounded down, no decimals)
    const rawSa2Val = raw.sa2 !== undefined && raw.sa2 !== null && raw.sa2 !== '' ? Number(raw.sa2) : null;
    const rawSa2PctVal = raw.sa2_pct !== undefined && raw.sa2_pct !== null && raw.sa2_pct !== '' ? Number(raw.sa2_pct) : null;
    const hasSa2 = (rawSa2Val !== null && rawSa2Val > 0) || (rawSa2PctVal !== null && rawSa2PctVal > 0);
    let sa2_pct: number | null = null;
    let sa2: number | null = null;
    let sa2_grade = isExempted ? 'Exempt' : '-';

    if (hasSa2) {
      if (rawSa2PctVal !== null && rawSa2PctVal > 0) {
        sa2_pct = Math.floor(Math.min(20, Math.max(0, rawSa2PctVal)));
        sa2 = rawSa2Val !== null && rawSa2Val > 0
          ? Math.min(50, Math.max(0, Math.floor(rawSa2Val)))
          : Math.min(50, Math.max(0, Math.round((sa2_pct * 50) / 20)));
      } else if (rawSa2Val !== null && rawSa2Val > 0) {
        const rawClamped = Math.min(50, Math.max(0, Math.floor(rawSa2Val)));
        sa2 = rawClamped;
        sa2_pct = Math.floor((rawClamped * 20) / 50);
      }
      sa2_grade = isExempted ? 'Exempt' : ((sa2_pct || 0) > 0 ? calculateGrade(((sa2_pct || 0) / 20) * 100) : '-');
      hasAnyMarksEntered = true;
    } else if (isExempted) {
      sa2_grade = 'Exempt';
    }

    const hasSem2 = hasFa3 || hasFa4 || hasSa2;
    const sem2_total = hasSem2
      ? ((fa3_pct || 0) + (fa4_pct || 0) + (sa2_pct || 0))
      : null;

    const hasDirectTotal = raw.total !== undefined && raw.total !== null && raw.total !== '';
    const hasAnyInSub = hasSem1 || hasSem2 || hasDirectTotal;
    const total100 = isExempted
      ? 0
      : hasAnyInSub
      ? (hasDirectTotal ? Math.min(100, Math.round(Number(raw.total))) : ((sem1_total || 0) + (sem2_total || 0)))
      : null;

    const grade = isExempted ? 'Exempt' : (total100 !== null && hasAnyInSub && total100 > 0) ? calculateGrade(total100) : '-';

    if (total100 !== null && hasAnyInSub) {
      totalMarks500 += total100;
    }

    subjectsRecord[cfg.code] = {
      code: cfg.code,
      nameEn: cfg.nameEn,
      fa1: fa1 !== null ? fa1 : 0,
      fa1_pct: fa1_pct !== null ? fa1_pct : 0,
      fa1_grade,
      fa2: fa2 !== null ? fa2 : 0,
      fa2_pct: fa2_pct !== null ? fa2_pct : 0,
      fa2_grade,
      sa1: sa1 !== null ? sa1 : 0,
      sa1_pct: sa1_pct !== null ? sa1_pct : 0,
      sa1_grade,
      sem1_total: sem1_total !== null ? sem1_total : 0,
      fa3: fa3 !== null ? fa3 : 0,
      fa3_pct: fa3_pct !== null ? fa3_pct : 0,
      fa3_grade,
      fa4: fa4 !== null ? fa4 : 0,
      fa4_pct: fa4_pct !== null ? fa4_pct : 0,
      fa4_grade,
      sa2: sa2 !== null ? sa2 : 0,
      sa2_pct: sa2_pct !== null ? sa2_pct : 0,
      sa2_grade,
      sem2_total: sem2_total !== null ? sem2_total : 0,
      total100: total100 !== null ? total100 : 0,
      grade,
    };
  });

  totalMarks500 = Number(totalMarks500.toFixed(1));
  const percentage = isExempted ? 0 : hasAnyMarksEntered ? Number(((totalMarks500 / 500) * 100).toFixed(1)) : 0;
  const overallGrade = isExempted ? 'Exempt' : (hasAnyMarksEntered && totalMarks500 > 0) ? calculateGrade(percentage) : '-';

  let resultStatus = 'PROMOTED';
  if (isExempted || hasCwsnBadge) {
    resultStatus = 'PASS (CWSN)';
  } else if (!hasAnyMarksEntered) {
    resultStatus = '-';
  } else if (percentage < 30) {
    resultStatus = 'DETAINED';
  } else if (percentage < 35) {
    resultStatus = 'SUPPLEMENTARY';
  }

  // Co-scholastic activities (Part B) - never auto-load fake grades
  const co = examMarks?.coCurricular;
  const sem1Co = {
    physical: (examMarks as any)?.sem1Co?.physical || co?.emotionalSocial || '',
    art: (examMarks as any)?.sem1Co?.art || co?.fineArtsDrawing || '',
    music: (examMarks as any)?.sem1Co?.music || co?.scientificSkills || '',
    supw: (examMarks as any)?.sem1Co?.supw || co?.organizationalSkills || '',
    values: (examMarks as any)?.sem1Co?.values || co?.values || '',
  };
  const sem2Co = {
    physical: (examMarks as any)?.sem2Co?.physical || co?.emotionalSocial || '',
    art: (examMarks as any)?.sem2Co?.art || co?.fineArtsDrawing || '',
    music: (examMarks as any)?.sem2Co?.music || co?.scientificSkills || '',
    supw: (examMarks as any)?.sem2Co?.supw || co?.organizationalSkills || '',
    values: (examMarks as any)?.sem2Co?.values || co?.values || '',
  };
  const finalCo = {
    physical: (examMarks as any)?.finalCo?.physical || sem2Co.physical || sem1Co.physical || '',
    art: (examMarks as any)?.finalCo?.art || sem2Co.art || sem1Co.art || '',
    music: (examMarks as any)?.finalCo?.music || sem2Co.music || sem1Co.music || '',
    supw: (examMarks as any)?.finalCo?.supw || sem2Co.supw || sem1Co.supw || '',
    values: (examMarks as any)?.finalCo?.values || sem2Co.values || sem1Co.values || '',
  };

  return {
    student,
    subjects: subjectsRecord,
    attendanceDays,
    sem1Attendance,
    sem2Attendance,
    totalMarks500,
    percentage,
    overallGrade,
    resultStatus,
    isExempted,
    hasCwsnBadge,
    coScholastic: {
      sem1: sem1Co,
      sem2: sem2Co,
      final: finalCo,
    },
  };
};

/**
 * Distribute 100 Marks into 5 exam components for 2-way sync
 */
export const distributeMarathiUrdu100Marks = (total100: number) => {
  const clamped = Math.max(0, Math.min(100, Math.round(Number(total100) || 0)));
  const semTarget = Math.round(clamped / 2);
  const fa1_pct = Math.floor((semTarget * 15) / 50);
  const fa2_pct = Math.floor((semTarget * 15) / 50);
  const sa1_pct = Math.max(0, semTarget - fa1_pct - fa2_pct);
  const fa3_pct = fa1_pct;
  const fa4_pct = fa2_pct;
  const sa2_pct = sa1_pct;

  return {
    total: clamped,
    fa1: Math.min(20, Math.round((fa1_pct * 20) / 15)),
    fa1_pct,
    fa2: Math.min(20, Math.round((fa2_pct * 20) / 15)),
    fa2_pct,
    sa1: Math.min(50, Math.round((sa1_pct * 50) / 20)),
    sa1_pct,
    fa3: Math.min(20, Math.round((fa3_pct * 20) / 15)),
    fa3_pct,
    fa4: Math.min(20, Math.round((fa4_pct * 20) / 15)),
    fa4_pct,
    sa2: Math.min(50, Math.round((sa2_pct * 50) / 20)),
    sa2_pct,
  };
};

/**
 * Standard category normalization
 */
export const getStudentCategoryGroup = (student: Student): 'SC' | 'ST' | 'OBC' | 'GEN' => {
  const caste = ((student as any).casteCategory || student.caste || '').toUpperCase().trim();
  if (caste.includes('SC')) return 'SC';
  if (caste.includes('ST')) return 'ST';
  if (
    caste.includes('CAT-1') ||
    caste.includes('CAT 1') ||
    caste.includes('2A') ||
    caste.includes('2B') ||
    caste.includes('3A') ||
    caste.includes('3B') ||
    caste.includes('OBC') ||
    caste.includes('MUSLIM')
  ) {
    return 'OBC';
  }
  return 'GEN';
};

/**
 * 5-Subject Grade Matrix for Image 1 (Page 5 for Marathi / Urdu Medium)
 */
export interface MarathiUrduGradeMatrixRow {
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'TOTAL';
  fl: { boys: number; girls: number; total: number };
  sl: { boys: number; girls: number; total: number };
  tl: { boys: number; girls: number; total: number };
  maths: { boys: number; girls: number; total: number };
  evs: { boys: number; girls: number; total: number };
}

export const computeMarathiUrduSubjectGradeMatrix = (
  studentsInClass: ComputedMarathiUrduStudent[]
): { rows: MarathiUrduGradeMatrixRow[]; totalRow: MarathiUrduGradeMatrixRow } => {
  const grades: ('A+' | 'A' | 'B+' | 'B' | 'C')[] = ['A+', 'A', 'B+', 'B', 'C'];
  const counts: Record<string, Record<string, { boys: number; girls: number; total: number }>> = {
    'A+': { FL: { boys: 0, girls: 0, total: 0 }, SL: { boys: 0, girls: 0, total: 0 }, TL: { boys: 0, girls: 0, total: 0 }, MATHS: { boys: 0, girls: 0, total: 0 }, EVS: { boys: 0, girls: 0, total: 0 } },
    'A': { FL: { boys: 0, girls: 0, total: 0 }, SL: { boys: 0, girls: 0, total: 0 }, TL: { boys: 0, girls: 0, total: 0 }, MATHS: { boys: 0, girls: 0, total: 0 }, EVS: { boys: 0, girls: 0, total: 0 } },
    'B+': { FL: { boys: 0, girls: 0, total: 0 }, SL: { boys: 0, girls: 0, total: 0 }, TL: { boys: 0, girls: 0, total: 0 }, MATHS: { boys: 0, girls: 0, total: 0 }, EVS: { boys: 0, girls: 0, total: 0 } },
    'B': { FL: { boys: 0, girls: 0, total: 0 }, SL: { boys: 0, girls: 0, total: 0 }, TL: { boys: 0, girls: 0, total: 0 }, MATHS: { boys: 0, girls: 0, total: 0 }, EVS: { boys: 0, girls: 0, total: 0 } },
    'C': { FL: { boys: 0, girls: 0, total: 0 }, SL: { boys: 0, girls: 0, total: 0 }, TL: { boys: 0, girls: 0, total: 0 }, MATHS: { boys: 0, girls: 0, total: 0 }, EVS: { boys: 0, girls: 0, total: 0 } },
  };

  studentsInClass.forEach((sc) => {
    if (sc.isExempted) return;
    const isGirl = sc.student.gender === 'Girl';
    (['FL', 'SL', 'TL', 'MATHS', 'EVS'] as const).forEach((code) => {
      const g = (sc.subjects[code]?.grade || 'B') as 'A+' | 'A' | 'B+' | 'B' | 'C';
      if (counts[g] && counts[g][code]) {
        if (isGirl) counts[g][code].girls++;
        else counts[g][code].boys++;
        counts[g][code].total++;
      }
    });
  });

  const rows: MarathiUrduGradeMatrixRow[] = grades.map((g) => ({
    grade: g,
    fl: counts[g].FL,
    sl: counts[g].SL,
    tl: counts[g].TL,
    maths: counts[g].MATHS,
    evs: counts[g].EVS,
  }));

  const totalRow: MarathiUrduGradeMatrixRow = {
    grade: 'TOTAL',
    fl: {
      boys: rows.reduce((s, r) => s + r.fl.boys, 0),
      girls: rows.reduce((s, r) => s + r.fl.girls, 0),
      total: rows.reduce((s, r) => s + r.fl.total, 0),
    },
    sl: {
      boys: rows.reduce((s, r) => s + r.sl.boys, 0),
      girls: rows.reduce((s, r) => s + r.sl.girls, 0),
      total: rows.reduce((s, r) => s + r.sl.total, 0),
    },
    tl: {
      boys: rows.reduce((s, r) => s + r.tl.boys, 0),
      girls: rows.reduce((s, r) => s + r.tl.girls, 0),
      total: rows.reduce((s, r) => s + r.tl.total, 0),
    },
    maths: {
      boys: rows.reduce((s, r) => s + r.maths.boys, 0),
      girls: rows.reduce((s, r) => s + r.maths.girls, 0),
      total: rows.reduce((s, r) => s + r.maths.total, 0),
    },
    evs: {
      boys: rows.reduce((s, r) => s + r.evs.boys, 0),
      girls: rows.reduce((s, r) => s + r.evs.girls, 0),
      total: rows.reduce((s, r) => s + r.evs.total, 0),
    },
  };

  return { rows, totalRow };
};

/**
 * Image 2: Annual Abstract Report Structure (Enrollment, Appeared CCE, Not Covered CCE)
 */
export interface AbstractCategoryGender {
  b: number;
  g: number;
}
export interface AbstractCategoryTotal {
  b: number;
  g: number;
  t: number;
}
export interface AbstractSectionStats {
  sc: AbstractCategoryGender;
  st: AbstractCategoryGender;
  obc: AbstractCategoryGender;
  gen: AbstractCategoryGender;
  total: AbstractCategoryTotal;
}
export interface ClassAbstractRowStats {
  classNum: string;
  enrolled: AbstractSectionStats;
  appeared: AbstractSectionStats;
  notCovered: AbstractSectionStats;
}

const createEmptySectionStats = (): AbstractSectionStats => ({
  sc: { b: 0, g: 0 },
  st: { b: 0, g: 0 },
  obc: { b: 0, g: 0 },
  gen: { b: 0, g: 0 },
  total: { b: 0, g: 0, t: 0 },
});

export const computeClassAbstractRowStats = (
  classNum: string,
  students: { student: Student; isExempted?: boolean }[]
): ClassAbstractRowStats => {
  const enrolled = createEmptySectionStats();
  const appeared = createEmptySectionStats();
  const notCovered = createEmptySectionStats();

  students.forEach(({ student, isExempted }) => {
    const isGirl = student.gender === 'Girl';
    const cat = getStudentCategoryGroup(student);
    const catKey = cat.toLowerCase() as 'sc' | 'st' | 'obc' | 'gen';

    // 1. Enrollment
    if (isGirl) enrolled[catKey].g++;
    else enrolled[catKey].b++;

    // 2. Appeared in CCE vs Not Covered (Exempted)
    if (isExempted) {
      if (isGirl) notCovered[catKey].g++;
      else notCovered[catKey].b++;
    } else {
      if (isGirl) appeared[catKey].g++;
      else appeared[catKey].b++;
    }
  });

  // Calculate totals
  (['sc', 'st', 'obc', 'gen'] as const).forEach((k) => {
    enrolled.total.b += enrolled[k].b;
    enrolled.total.g += enrolled[k].g;
    appeared.total.b += appeared[k].b;
    appeared.total.g += appeared[k].g;
    notCovered.total.b += notCovered[k].b;
    notCovered.total.g += notCovered[k].g;
  });
  enrolled.total.t = enrolled.total.b + enrolled.total.g;
  appeared.total.t = appeared.total.b + appeared.total.g;
  notCovered.total.t = notCovered.total.b + notCovered.total.g;

  return { classNum, enrolled, appeared, notCovered };
};

