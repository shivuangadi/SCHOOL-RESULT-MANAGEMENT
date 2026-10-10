/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Official Karnataka Primary (Class 1-5) CCE Result & Consolidation Engine
 * Tailored strictly for Kannada & English Medium Schools
 */

import { Student, StudentExamMarks, StudentClass, isCwsnExempted, isCwsnStudent } from '../types';
import { calculateGrade, calculateMarksGrade } from '../data/demoData';
import * as XLSX from 'xlsx';

export type PrimarySubjectCode = 'FL' | 'SL' | 'TL' | 'MATHS' | 'EVS' | 'MATH';

export interface PrimarySubjectInfo {
  code: PrimarySubjectCode;
  nameEn: string;
  nameKn: string;
}

export const PRIMARY_SUBJECTS: PrimarySubjectInfo[] = [
  { code: 'FL', nameEn: 'First Language', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ' },
  { code: 'SL', nameEn: 'Second Language', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ' },
  { code: 'MATHS', nameEn: 'Mathematics', nameKn: 'ಗಣಿತ' },
  { code: 'EVS', nameEn: 'Environmental Studies', nameKn: 'ಪರಿಸರ ಅಧ್ಯಯನ' },
];

export interface CoScholasticItem {
  key: string;
  nameKn: string;
  nameEn: string;
}

export const CO_SCHOLASTIC_ACTIVITIES: CoScholasticItem[] = [
  { key: 'pe', nameKn: 'ದೈ & ಆ ಶಿಕ್ಷಣ', nameEn: 'Physical & Health Education' },
  { key: 'art', nameKn: 'ಕಲೆ & ಕರಕುಶಲತೆ', nameEn: 'Art & Craft' },
  { key: 'music', nameKn: 'ಸಂಗೀತ & ನೃತ್ಯ', nameEn: 'Music & Dance' },
  { key: 'supw', nameKn: 'ಸಾ.ಉ.ಉ.ಕಾ', nameEn: 'SUPW / Work Experience' },
  { key: 'moral', nameKn: 'ಮೌ.ವೈ. & ಸಾ. ಬೆ', nameEn: 'Value & Life Skills' },
];

export type GradeLevel = 'A+' | 'A' | 'B+' | 'B' | 'C';
export const GRADE_LEVELS: GradeLevel[] = ['A+', 'A', 'B+', 'B', 'C'];

export interface ComputedSubjectMarks {
  code: PrimarySubjectCode;
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

export interface ComputedStudentCce {
  student: Student;
  isExempted: boolean;
  attendanceDays: number;
  sem1Attendance: number;
  sem2Attendance: number;
  totalWorkingDays: number;
  subjects: Record<PrimarySubjectCode, ComputedSubjectMarks>;
  totalMarks400: number;
  percentage: number;
  overallGrade: string;
  resultStatus: 'ಉತ್ತೀರ್ಣ (PROMOTED)' | 'ಅನುತ್ತೀರ್ಣ (DETAINED)' | 'CWSN (ವಿನಾಯಿತಿ)' | 'ಪೂರಕ ಪರೀಕ್ಷೆಗೆ ಅರ್ಹ' | 'ಉತ್ತೀರ್ಣ (CWSN)';
  coScholastic: {
    sem1: Record<string, string>;
    sem2: Record<string, string>;
    final: Record<string, string>;
  };
}

/**
 * Extracts the last word of the school name as the default Place (ಸ್ಥಳ)
 * e.g. "Govt Higher Primary School Ningyanatti" -> "Ningyanatti"
 * e.g. "ಸರಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಕನ್ನಡ ಶಾಲೆ ನಿಂಗ್ಯಾನಟ್ಟಿ" -> "ನಿಂಗ್ಯಾನಟ್ಟಿ"
 */
export const extractLastWordOfSchoolName = (schoolName?: string): string => {
  if (!schoolName) return 'ನಿಂಗ್ಯಾನಟ್ಟಿ';
  const clean = schoolName.trim().replace(/[,.-]+$/, '');
  const words = clean.split(/[\s,.-]+/);
  return words[words.length - 1] || 'ನಿಂಗ್ಯಾನಟ್ಟಿ';
};

/**
 * Maps any religion and caste string to one of the 4 official Karnataka categories:
 * SC, ST, OBC, GEN
 */
export const getMajorCategory = (caste?: string, rel?: string): 'SC' | 'ST' | 'OBC' | 'GEN' => {
  const c = (caste || '').toUpperCase().trim();
  const r = (rel || '').toLowerCase().trim();
  if (c === 'SC' || c.includes('SCHEDULED CASTE')) return 'SC';
  if (c === 'ST' || c.includes('SCHEDULED TRIBE')) return 'ST';
  if (
    c === 'CAT-1' || c === 'CATEGORY-1' || c === 'C1' || c.includes('CAT 1') || c.includes('CAT-1') ||
    c === '2A' || c.includes('2A') ||
    c === '2B' || c === 'MUSLIM' || c.includes('2B') || r === 'muslim' ||
    c === '3A' || c.includes('3A') ||
    c === '3B' || c.includes('3B') ||
    c === 'OBC' || c.includes('BACKWARD')
  ) {
    return 'OBC';
  }
  return 'GEN';
};

/**
 * Default empty marks structure for a new student (No automatic fake marks)
 */
export const generateDefaultPrimaryMarks = (student: Student): StudentExamMarks => {
  const subjectsRecord: Record<string, any> = {};

  PRIMARY_SUBJECTS.forEach((sub) => {
    subjectsRecord[sub.code] = {
      code: sub.code,
      fa1: null,
      fa2: null,
      sa1: null,
      fa3: null,
      fa4: null,
      sa2: null,
      fa1_pct: null,
      fa2_pct: null,
      sa1_pct: null,
      fa3_pct: null,
      fa4_pct: null,
      sa2_pct: null,
      total: null,
    };
  });

  return {
    studentId: student.id,
    diseCode: student.diseCode,
    classStandard: student.classStandard,
    academicYear: student.academicYear || '2026-27',
    subjects: subjectsRecord,
    coCurricular: {
      emotionalSocial: '',
      fineArtsDrawing: '',
      scientificSkills: '',
      organizationalSkills: '',
      values: '',
      attendedDays: 0,
      workingDays: 220,
    },
    sem1Co: { pe: '', art: '', music: '', supw: '', moral: '' },
    sem2Co: { pe: '', art: '', music: '', supw: '', moral: '' },
    finalCo: { pe: '', art: '', music: '', supw: '', moral: '' },
    attendanceDays: 0,
    sem1Attendance: 0,
    sem2Attendance: 0,
    totalWorkingDays: 220,
  };
};

/**
 * Compute detailed CCE marks and grades for a primary student
 */
export const computeStudentCceDetails = (
  student: Student,
  examMarks?: StudentExamMarks | null
): ComputedStudentCce => {
  const isMarksAllowed = student.cwsnStatus === 'MARKS_ALLOWED' || student.cwsnStatus === 'YES_MARKS';
  const isExempted = isMarksAllowed ? false : (isCwsnExempted(student.cwsnStatus) || (examMarks as any)?.isCwsnExempt === true);
  const hasCwsnBadge = isCwsnStudent(student.cwsnStatus) || isExempted;
  const attendanceDays = examMarks?.attendanceDays !== undefined
    ? Number(examMarks.attendanceDays)
    : examMarks?.coCurricular?.attendedDays !== undefined
    ? Number(examMarks.coCurricular.attendedDays)
    : 0;
  const totalWorkingDays = examMarks?.totalWorkingDays || examMarks?.coCurricular?.workingDays || 220;

  const subjectsComputed: Record<PrimarySubjectCode, ComputedSubjectMarks> = {} as any;
  let totalMarks400 = 0;
  let hasAnyMarksEntered = false;

  PRIMARY_SUBJECTS.forEach((sub) => {
    const raw = (examMarks?.subjects?.[sub.code] as any) || {};

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
        // Strictly round down 20 -> 15% (e.g., 18 -> 13.5 -> 13)
        fa1_pct = Math.floor((rawClamped * 15) / 20);
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
        sa1 = rawSa1Val !== null && rawSa1Val > 0
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
      totalMarks400 += total100;
    }

    subjectsComputed[sub.code] = {
      code: sub.code,
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

  const sem1Attendance = (examMarks as any)?.sem1Attendance !== undefined
    ? Number((examMarks as any)?.sem1Attendance)
    : 0;
  const sem2Attendance = (examMarks as any)?.sem2Attendance !== undefined
    ? Number((examMarks as any)?.sem2Attendance)
    : 0;

  totalMarks400 = Number(totalMarks400.toFixed(1));
  const percentage = isExempted ? 0 : hasAnyMarksEntered ? Number(((totalMarks400 / 400) * 100).toFixed(1)) : 0;
  const overallGrade = isExempted ? 'Exempt' : (hasAnyMarksEntered && totalMarks400 > 0) ? calculateGrade(percentage) : '-';

  // Result Status
  let resultStatus: 'ಉತ್ತೀರ್ಣ (PROMOTED)' | 'ಅನುತ್ತೀರ್ಣ (DETAINED)' | 'CWSN (ವಿನಾಯಿತಿ)' | 'ಪೂರಕ ಪರೀಕ್ಷೆಗೆ ಅರ್ಹ' | 'ಉತ್ತೀರ್ಣ (CWSN)' = 'ಉತ್ತೀರ್ಣ (PROMOTED)';
  if (isExempted || hasCwsnBadge) {
    resultStatus = 'ಉತ್ತೀರ್ಣ (CWSN)';
  } else if (!hasAnyMarksEntered) {
    resultStatus = '-' as any;
  } else if (percentage < 30) {
    resultStatus = 'ಅನುತ್ತೀರ್ಣ (DETAINED)';
  } else if (percentage < 35) {
    resultStatus = 'ಪೂರಕ ಪರೀಕ್ಷೆಗೆ ಅರ್ಹ';
  }

  // Co-scholastic grades
  const co = examMarks?.coCurricular;
  const sem1Co = {
    pe: (examMarks as any)?.sem1Co?.pe || co?.emotionalSocial || '',
    art: (examMarks as any)?.sem1Co?.art || co?.fineArtsDrawing || '',
    music: (examMarks as any)?.sem1Co?.music || co?.scientificSkills || '',
    supw: (examMarks as any)?.sem1Co?.supw || co?.organizationalSkills || '',
    moral: (examMarks as any)?.sem1Co?.moral || co?.values || '',
  };
  const sem2Co = {
    pe: (examMarks as any)?.sem2Co?.pe || co?.emotionalSocial || '',
    art: (examMarks as any)?.sem2Co?.art || co?.fineArtsDrawing || '',
    music: (examMarks as any)?.sem2Co?.music || co?.scientificSkills || '',
    supw: (examMarks as any)?.sem2Co?.supw || co?.organizationalSkills || '',
    moral: (examMarks as any)?.sem2Co?.moral || co?.values || '',
  };
  const finalCo = {
    pe: (examMarks as any)?.finalCo?.pe || sem2Co.pe || sem1Co.pe || '',
    art: (examMarks as any)?.finalCo?.art || sem2Co.art || sem1Co.art || '',
    music: (examMarks as any)?.finalCo?.music || sem2Co.music || sem1Co.music || '',
    supw: (examMarks as any)?.finalCo?.supw || sem2Co.supw || sem1Co.supw || '',
    moral: (examMarks as any)?.finalCo?.moral || sem2Co.moral || sem1Co.moral || '',
  };

  return {
    student,
    isExempted,
    attendanceDays,
    sem1Attendance,
    sem2Attendance,
    totalWorkingDays,
    subjects: subjectsComputed,
    totalMarks400: Number(totalMarks400.toFixed(1)),
    percentage,
    overallGrade,
    resultStatus,
    coScholastic: {
      sem1: sem1Co,
      sem2: sem2Co,
      final: finalCo,
    },
  };
};

/**
 * Symmetrically distributes a 100-mark score into FA1(20), FA2(20), SA1(50), FA3(20), FA4(20), SA2(50)
 * for 2-way synchronization between 100-mark consolidation and 9-line consolidation.
 */
export const distribute100MarksIntoSubject = (
  total100: number,
  subCode: PrimarySubjectCode
) => {
  const clamped = Math.max(0, Math.min(100, Math.round(Number(total100) || 0)));
  const semTarget = Math.round(clamped / 2); // e.g. 50 out of 50 max

  // In each sem: FA1=15%, FA2=15%, SA1=20% -> total 50%
  const fa1_pct = Math.floor((semTarget * 15) / 50);
  const fa2_pct = Math.floor((semTarget * 15) / 50);
  const sa1_pct = Math.max(0, semTarget - fa1_pct - fa2_pct);

  const fa1 = Math.min(20, Math.max(0, Math.round((fa1_pct * 20) / 15)));
  const fa2 = Math.min(20, Math.max(0, Math.round((fa2_pct * 20) / 15)));
  const sa1 = Math.min(50, Math.max(0, Math.round((sa1_pct * 50) / 20)));

  const fa3_pct = fa1_pct;
  const fa4_pct = fa2_pct;
  const sa2_pct = sa1_pct;
  const fa3 = fa1;
  const fa4 = fa2;
  const sa2 = sa1;

  return {
    code: subCode,
    total: clamped,
    fa1,
    fa1_pct,
    fa2,
    fa2_pct,
    sa1,
    sa1_pct,
    fa3,
    fa3_pct,
    fa4,
    fa4_pct,
    sa2,
    sa2_pct,
    total100: clamped,
  };
};

/**
 * Computes Grade Matrix for Page 3 (Per Class)
 */
export interface GradeMatrixRow {
  grade: GradeLevel;
  fl: { boys: number; girls: number; total: number };
  sl: { boys: number; girls: number; total: number };
  maths: { boys: number; girls: number; total: number };
  evs: { boys: number; girls: number; total: number };
}

export const computeSubjectGradeMatrix = (
  studentsInClass: ComputedStudentCce[]
): { rows: GradeMatrixRow[]; totalRow: GradeMatrixRow } => {
  const counts: Record<GradeLevel, Record<string, { boys: number; girls: number; total: number }>> = {
    'A+': { FL: { boys: 0, girls: 0, total: 0 }, SL: { boys: 0, girls: 0, total: 0 }, MATHS: { boys: 0, girls: 0, total: 0 }, EVS: { boys: 0, girls: 0, total: 0 } },
    'A': { FL: { boys: 0, girls: 0, total: 0 }, SL: { boys: 0, girls: 0, total: 0 }, MATHS: { boys: 0, girls: 0, total: 0 }, EVS: { boys: 0, girls: 0, total: 0 } },
    'B+': { FL: { boys: 0, girls: 0, total: 0 }, SL: { boys: 0, girls: 0, total: 0 }, MATHS: { boys: 0, girls: 0, total: 0 }, EVS: { boys: 0, girls: 0, total: 0 } },
    'B': { FL: { boys: 0, girls: 0, total: 0 }, SL: { boys: 0, girls: 0, total: 0 }, MATHS: { boys: 0, girls: 0, total: 0 }, EVS: { boys: 0, girls: 0, total: 0 } },
    'C': { FL: { boys: 0, girls: 0, total: 0 }, SL: { boys: 0, girls: 0, total: 0 }, MATHS: { boys: 0, girls: 0, total: 0 }, EVS: { boys: 0, girls: 0, total: 0 } },
  };

  studentsInClass.forEach((sc) => {
    if (sc.isExempted) return;
    const isGirl = sc.student.gender === 'Girl';

    PRIMARY_SUBJECTS.forEach((sub) => {
      const g = (sc.subjects[sub.code].grade as GradeLevel) || 'B';
      if (counts[g]) {
        if (isGirl) counts[g][sub.code].girls++;
        else counts[g][sub.code].boys++;
        counts[g][sub.code].total++;
      }
    });
  });

  const rows: GradeMatrixRow[] = GRADE_LEVELS.map((g) => ({
    grade: g,
    fl: counts[g].FL,
    sl: counts[g].SL,
    maths: counts[g].MATHS,
    evs: counts[g].EVS,
  }));

  const totalRow: GradeMatrixRow = {
    grade: 'TOTAL' as any,
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
 * Computes Page 6 Category Summary:
 * Enrollment, Appeared / Evaluated, Not Appeared / Detained
 */
export interface CategoryGenderCount {
  sc: { b: number; g: number; t: number };
  st: { b: number; g: number; t: number };
  obc: { b: number; g: number; t: number };
  gen: { b: number; g: number; t: number };
  total: { b: number; g: number; t: number };
}

export interface ClassCategoryStats {
  classNum: string;
  enrolled: CategoryGenderCount;
  appeared: CategoryGenderCount;
  notAppeared: CategoryGenderCount;
}

export const computeClassCategoryStats = (
  classNum: string,
  classStudents: ComputedStudentCce[]
): ClassCategoryStats => {
  const initCounts = (): CategoryGenderCount => ({
    sc: { b: 0, g: 0, t: 0 },
    st: { b: 0, g: 0, t: 0 },
    obc: { b: 0, g: 0, t: 0 },
    gen: { b: 0, g: 0, t: 0 },
    total: { b: 0, g: 0, t: 0 },
  });

  const enrolled = initCounts();
  const appeared = initCounts();
  const notAppeared = initCounts();

  classStudents.forEach((cs) => {
    const isGirl = cs.student.gender === 'Girl';
    const cat = getMajorCategory(cs.student.caste, cs.student.religion);

    const add = (target: CategoryGenderCount) => {
      const key = cat.toLowerCase() as 'sc' | 'st' | 'obc' | 'gen';
      if (isGirl) {
        target[key].g++;
        target.total.g++;
      } else {
        target[key].b++;
        target.total.b++;
      }
      target[key].t++;
      target.total.t++;
    };

    // 1. Enrolled
    add(enrolled);

    // 2. Appeared vs Not Appeared
    // If the student is CWSN, on bases of Part-B grades he/she is considered as PASSED and NOT counted in failed list
    const isPassed = cs.isExempted || (cs.totalMarks400 > 0 && !cs.resultStatus.includes('DETAINED') && !cs.resultStatus.includes('ಅನುತ್ತೀರ್ಣ'));
    if (isPassed) {
      add(appeared);
    } else {
      add(notAppeared);
    }
  });

  return {
    classNum,
    enrolled,
    appeared,
    notAppeared,
  };
};

/**
 * Genuine Excel (.xlsx) Table Export:
 * Exports real native .xlsx workbook with table formatting, visible gridlines,
 * auto-fitted column widths, merged header titles, numeric conversion for formulas,
 * and handles multi-sheet student tables combined into a complete Master Table.
 */
export const exportHtmlTableToExcel = (
  containerOrTable: HTMLElement,
  fileName: string
): boolean => {
  try {
    const cleanFileName = fileName.replace(/\.(xlsx|xls)$/i, '');

    // 1. Identify all table elements within the container
    const isTable = containerOrTable.tagName?.toLowerCase() === 'table';
    const originalTables: HTMLTableElement[] = isTable
      ? [containerOrTable as HTMLTableElement]
      : Array.from(containerOrTable.querySelectorAll('table'));

    if (originalTables.length === 0) return false;

    // 2. Clone and clean each table: replace interactive inputs/selects with plain text values
    const cleanedTables: HTMLTableElement[] = originalTables.map((tbl) => {
      const clone = tbl.cloneNode(true) as HTMLTableElement;

      // Extract current values from original inputs/selects into clone
      const origInputs = tbl.querySelectorAll('input, select');
      const cloneInputs = clone.querySelectorAll('input, select');
      cloneInputs.forEach((inp, idx) => {
        const origInp = origInputs[idx] as HTMLInputElement | HTMLSelectElement | undefined;
        let val = '';
        if (origInp) {
          if (origInp.tagName.toLowerCase() === 'select') {
            const sel = origInp as HTMLSelectElement;
            val = sel.options[sel.selectedIndex]?.text || sel.value || '';
          } else {
            val = origInp.value ?? '';
          }
        } else {
          val = (inp as HTMLInputElement | HTMLSelectElement).value ?? '';
        }

        const parent = inp.parentElement;
        if (parent) {
          parent.textContent = val;
        }
      });

      // Remove hidden elements, action buttons, and icons
      clone.querySelectorAll('button, .print\\:hidden, select, input, [title*="exemption"]').forEach((el) => el.remove());

      return clone;
    });

    // 3. Create a master table that combines all chunks into one continuous table
    let masterTable = cleanedTables[0];
    if (cleanedTables.length > 1) {
      const mergedTable = cleanedTables[0].cloneNode(true) as HTMLTableElement;
      // Remove original tbodies from mergedTable, then append tbodies from all cleaned tables
      mergedTable.querySelectorAll('tbody').forEach((tb) => tb.remove());

      cleanedTables.forEach((tbl) => {
        tbl.querySelectorAll('tbody').forEach((tb) => {
          mergedTable.appendChild(tb.cloneNode(true));
        });
      });
      masterTable = mergedTable;
    }

    // 4. Convert table to sheet using XLSX
    const ws = XLSX.utils.table_to_sheet(masterTable, { raw: false });

    // Explicitly enable Excel gridlines for clear table appearance
    ws['!views'] = [{ showGridLines: true }];

    // Auto-fit column widths so no header or student info is truncated or cramped
    if (ws['!ref']) {
      const range = XLSX.utils.decode_range(ws['!ref']);
      const colWidths: { wch: number }[] = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxLen = 6;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
          if (cell && cell.v !== undefined) {
            const strVal = String(cell.v).trim();
            const len = strVal.length;
            if (len > maxLen) {
              maxLen = Math.min(len + 3, 45);
            }
          }
        }
        colWidths.push({ wch: maxLen });
      }
      ws['!cols'] = colWidths;

      // Auto-detect numeric cells and format as numbers for formulas and calculations in Excel
      for (const cellKey of Object.keys(ws)) {
        if (cellKey.startsWith('!')) continue;
        const cell = ws[cellKey];
        if (cell && (cell.t === 's' || typeof cell.v === 'string')) {
          const valStr = String(cell.v).trim();
          if (/^-?\d+(\.\d+)?$/.test(valStr)) {
            cell.t = 'n';
            cell.v = parseFloat(valStr);
          }
        }
      }
    }

    // 5. Build workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CCE Report');

    // If multiple pages existed, also include page sheets for print-ready views
    if (cleanedTables.length > 1) {
      cleanedTables.forEach((tbl, pageIdx) => {
        const pageWs = XLSX.utils.table_to_sheet(tbl, { raw: false });
        pageWs['!views'] = [{ showGridLines: true }];
        if (pageWs['!ref']) {
          const range = XLSX.utils.decode_range(pageWs['!ref']);
          const colWidths: { wch: number }[] = [];
          for (let C = range.s.c; C <= range.e.c; ++C) {
            let maxLen = 6;
            for (let R = range.s.r; R <= range.e.r; ++R) {
              const cell = pageWs[XLSX.utils.encode_cell({ r: R, c: C })];
              if (cell && cell.v !== undefined) {
                const len = String(cell.v).trim().length;
                if (len > maxLen) maxLen = Math.min(len + 3, 45);
              }
            }
            colWidths.push({ wch: maxLen });
          }
          pageWs['!cols'] = colWidths;
        }
        XLSX.utils.book_append_sheet(wb, pageWs, `Sheet ${pageIdx + 1}`);
      });
    }

    // 6. Save as genuine .xlsx file
    XLSX.writeFile(wb, `${cleanFileName}.xlsx`);
    return true;
  } catch (err) {
    console.error('Export Excel error:', err);
    return false;
  }
};
