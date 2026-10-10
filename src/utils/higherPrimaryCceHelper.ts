/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Official Karnataka Higher Primary (Class 6-8) CCE Engine
 * Covers all mediums: Kannada, English, Marathi, Urdu
 * 7 Subjects x 100 Marks = 700 Marks Maximum
 * Specified according to KSEAB / DSERT standards by Shri S R Angadi
 */

import { Student, StudentExamMarks, StudentClass, isCwsnExempted, isCwsnStudent, SchoolMedium } from '../types';
import * as XLSX from 'xlsx';

export type HpSubjectCode = 'FL' | 'SL' | 'TL' | 'MATHS' | 'SCI' | 'SOC' | 'VPE';

export interface HpSubjectInfo {
  code: HpSubjectCode;
  nameEn: string;
  nameKn: string;
  satsKey: string;
  maxMarks: number;
}

export const HP_SUBJECTS_KANNADA: HpSubjectInfo[] = [
  { code: 'FL', nameEn: 'First Language Kannada', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ ಕನ್ನಡ', satsKey: 'FL', maxMarks: 100 },
  { code: 'SL', nameEn: 'Second Language English', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ ಇಂಗ್ಲಿಷ್', satsKey: 'SL', maxMarks: 100 },
  { code: 'TL', nameEn: 'Third Language Hindi', nameKn: 'ತೃತೀಯ ಭಾಷೆ ಹಿಂದಿ', satsKey: 'TL', maxMarks: 100 },
  { code: 'MATHS', nameEn: 'Mathematics', nameKn: 'ಗಣಿತ', satsKey: 'MATHS', maxMarks: 100 },
  { code: 'SCI', nameEn: 'Science', nameKn: 'ವಿಜ್ಞಾನ', satsKey: 'SCIENCE', maxMarks: 100 },
  { code: 'SOC', nameEn: 'Social Science', nameKn: 'ಸಮಾಜ ವಿಜ್ಞಾನ', satsKey: 'SOCIAL SCIENCE', maxMarks: 100 },
  { code: 'VPE', nameEn: 'Value & Physical Education', nameKn: 'ಮೌಲ್ಯ & ದೈಹಿಕ ಶಿಕ್ಷಣ', satsKey: 'VPE', maxMarks: 100 },
];

export const HP_SUBJECTS_ENGLISH: HpSubjectInfo[] = [
  { code: 'FL', nameEn: 'First Language English', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ ಇಂಗ್ಲಿಷ್', satsKey: 'FL', maxMarks: 100 },
  { code: 'SL', nameEn: 'Second Language Kannada', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ ಕನ್ನಡ', satsKey: 'SL', maxMarks: 100 },
  { code: 'TL', nameEn: 'Third Language Hindi', nameKn: 'ತೃತೀಯ ಭಾಷೆ ಹಿಂದಿ', satsKey: 'TL', maxMarks: 100 },
  { code: 'MATHS', nameEn: 'Mathematics', nameKn: 'Mathematics (ಗಣಿತ)', satsKey: 'MATHS', maxMarks: 100 },
  { code: 'SCI', nameEn: 'Science', nameKn: 'Science (ವಿಜ್ಞಾನ)', satsKey: 'SCIENCE', maxMarks: 100 },
  { code: 'SOC', nameEn: 'Social Science', nameKn: 'Social Science (ಸಮಾಜ)', satsKey: 'SOCIAL SCIENCE', maxMarks: 100 },
  { code: 'VPE', nameEn: 'Value & Physical Education', nameKn: 'ಮೌಲ್ಯ & ದೈಹಿಕ ಶಿಕ್ಷಣ', satsKey: 'VPE', maxMarks: 100 },
];

export const HP_SUBJECTS_MARATHI: HpSubjectInfo[] = [
  { code: 'FL', nameEn: 'First Language Marathi', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ ಮರಾಠಿ (मराठी)', satsKey: 'FL', maxMarks: 100 },
  { code: 'SL', nameEn: 'Second Language Kannada', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ ಕನ್ನಡ', satsKey: 'SL', maxMarks: 100 },
  { code: 'TL', nameEn: 'Third Language English', nameKn: 'ತೃತೀಯ ಭಾಷೆ ಇಂಗ್ಲಿಷ್', satsKey: 'TL', maxMarks: 100 },
  { code: 'MATHS', nameEn: 'Mathematics', nameKn: 'ಗಣಿತ (गणित)', satsKey: 'MATHS', maxMarks: 100 },
  { code: 'SCI', nameEn: 'Science', nameKn: 'ವಿಜ್ಞಾನ (विज्ञान)', satsKey: 'SCIENCE', maxMarks: 100 },
  { code: 'SOC', nameEn: 'Social Science', nameKn: 'ಸಮಾಜ ವಿಜ್ಞಾನ (समाजशास्त्र)', satsKey: 'SOCIAL SCIENCE', maxMarks: 100 },
  { code: 'VPE', nameEn: 'Value & Physical Education', nameKn: 'ಮೌಲ್ಯ & ದೈಹಿಕ ಶಿಕ್ಷಣ', satsKey: 'VPE', maxMarks: 100 },
];

export const HP_SUBJECTS_URDU: HpSubjectInfo[] = [
  { code: 'FL', nameEn: 'First Language Urdu', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ ಉರ್ದು (اردو)', satsKey: 'FL', maxMarks: 100 },
  { code: 'SL', nameEn: 'Second Language Kannada', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ ಕನ್ನಡ', satsKey: 'SL', maxMarks: 100 },
  { code: 'TL', nameEn: 'Third Language English', nameKn: 'ತೃತೀಯ ಭಾಷೆ ಇಂಗ್ಲಿಷ್', satsKey: 'TL', maxMarks: 100 },
  { code: 'MATHS', nameEn: 'Mathematics', nameKn: 'ಗಣಿತ (ریاضی)', satsKey: 'MATHS', maxMarks: 100 },
  { code: 'SCI', nameEn: 'Science', nameKn: 'ವಿಜ್ಞಾನ (سائنس)', satsKey: 'SCIENCE', maxMarks: 100 },
  { code: 'SOC', nameEn: 'Social Science', nameKn: 'ಸಮಾಜ ವಿಜ್ಞಾನ (سماجی علوم)', satsKey: 'SOCIAL SCIENCE', maxMarks: 100 },
  { code: 'VPE', nameEn: 'Value & Physical Education', nameKn: 'ಮೌಲ್ಯ & ದೈಹಿಕ ಶಿಕ್ಷಣ', satsKey: 'VPE', maxMarks: 100 },
];

export const getHpSubjectsForMedium = (medium?: string): HpSubjectInfo[] => {
  const m = (medium || '').toLowerCase();
  if (m.includes('marathi') || m.includes('ಮರಾಠಿ')) return HP_SUBJECTS_MARATHI;
  if (m.includes('urdu') || m.includes('ಉರ್ದು')) return HP_SUBJECTS_URDU;
  if (m.includes('english') || m.includes('ಇಂಗ್ಲಿಷ್')) return HP_SUBJECTS_ENGLISH;
  return HP_SUBJECTS_KANNADA;
};

/**
 * 7 Co-Scholastic Activities for Class 6-8 (Numbered in Part B)
 * (1) ಭಾವನಾತ್ಮಕ ಸಾಮಾಜಿಕ ಕೌಶಲಗಳು
 * (2) ಸಂಘಟನಾ ಕೌಶಲಗಳು
 * (3) ವೈಜ್ಞಾನಿಕ ಕೌಶಲಗಳು
 * (4) ಲಲಿತ ಕಲೆ
 * (5) ಸೃಜನಶೀಲತೆ
 * (6) ಮನೋಧೋರಣೆ
 * (7) ಮೌಲ್ಯಗಳು
 */
export interface HpCoActivity {
  num: number;
  key: string;
  nameKn: string;
  nameEn: string;
}

export const HP_CO_ACTIVITIES: HpCoActivity[] = [
  { num: 1, key: 'emotionalSocial', nameKn: '(1) ಭಾವನಾತ್ಮಕ ಸಾಮಾಜಿಕ ಕೌಶಲಗಳು', nameEn: 'Emotional & Social Skills' },
  { num: 2, key: 'organizationalSkills', nameKn: '(2) ಸಂಘಟನಾ ಕೌಶಲಗಳು', nameEn: 'Organizational Skills' },
  { num: 3, key: 'scientificSkills', nameKn: '(3) ವೈಜ್ಞಾನಿಕ ಕೌಶಲಗಳು', nameEn: 'Scientific Skills' },
  { num: 4, key: 'fineArtsDrawing', nameKn: '(4) ಲಲಿತ ಕಲೆ', nameEn: 'Fine Arts' },
  { num: 5, key: 'creativity', nameKn: '(5) ಸೃಜನಶೀಲತೆ', nameEn: 'Creativity' },
  { num: 6, key: 'attitude', nameKn: '(6) ಮನೋಧೋರಣೆ', nameEn: 'Attitude' },
  { num: 7, key: 'values', nameKn: '(7) ಮೌಲ್ಯಗಳು', nameEn: 'Values' },
];

export const HP_9LINE_CO_ACTIVITIES = HP_CO_ACTIVITIES;

/**
 * 2 Part-B Subjects for Class 6-8:
 * 1-ಕಲಾ ಶಿಕ್ಷಣ/ಕಾರ್ಯಾನುಭವ (Art Edu / Work Exp) - direct sem1-50m & sem2-50m
 * 2-ಕಂಪ್ಯೂಟರ್‌ ಶಿಕ್ಷಣ/ICT - direct sem1-50m & sem2-50m
 * Total 100 marks, graded same as other subjects
 */
export interface HpPartBSubjectInfo {
  key: string;
  num: number;
  nameKn: string;
  nameEn: string;
  maxSem1: number;
  maxSem2: number;
  maxTotal: number;
}

export const HP_PART_B_SUBJECTS: HpPartBSubjectInfo[] = [
  {
    key: 'art_workexp',
    num: 1,
    nameKn: 'ಕಲಾ ಶಿಕ್ಷಣ/ಕಾರ್ಯಾನುಭವ',
    nameEn: 'Art Edu / Work Exp',
    maxSem1: 50,
    maxSem2: 50,
    maxTotal: 100,
  },
  {
    key: 'ict_computer',
    num: 2,
    nameKn: 'ಕಂಪ್ಯೂಟರ್‌ ಶಿಕ್ಷಣ/ICT',
    nameEn: 'Computer Education / ICT',
    maxSem1: 50,
    maxSem2: 50,
    maxTotal: 100,
  },
];

/**
 * 9 Part B Items in Class 6-8:
 * - 2 Subjects: Art Edu / Work Exp (marks & grade) + Computer Education / ICT (marks & grade)
 * - 7 Co-Scholastic Activities:
 *   (1) ಭಾವನಾತ್ಮಕ ಸಾಮಾಜಿಕ ಕೌಶಲಗಳು
 *   (2) ಸಂಘಟನಾ ಕೌಶಲಗಳು
 *   (3) ವೈಜ್ಞಾನಿಕ ಕೌಶಲಗಳು
 *   (4) ಲಲಿತ ಕಲೆ
 *   (5) ಸೃಜನಶೀಲತೆ
 *   (6) ಮನೋಧೋರಣೆ
 *   (7) ಮೌಲ್ಯಗಳು
 */
export interface HpPartBItemInfo {
  num: number;
  key: string;
  nameKn: string;
  nameEn: string;
  type: 'subject' | 'activity';
}

export const HP_PART_B_ALL_ITEMS: HpPartBItemInfo[] = [
  { num: 1, key: 'art_workexp', nameKn: 'ಕಲಾ ಶಿಕ್ಷಣ/ಕಾರ್ಯಾನುಭವ', nameEn: 'Art Edu / Work Exp (50m+50m)', type: 'subject' },
  { num: 2, key: 'ict_computer', nameKn: 'ಕಂಪ್ಯೂಟರ್‌ ಶಿಕ್ಷಣ/ICT', nameEn: 'Computer Education / ICT (50m+50m)', type: 'subject' },
  { num: 3, key: 'emotionalSocial', nameKn: '(1) ಭಾವನಾತ್ಮಕ ಸಾಮಾಜಿಕ ಕೌಶಲಗಳು', nameEn: 'Emotional & Social Skills', type: 'activity' },
  { num: 4, key: 'organizationalSkills', nameKn: '(2) ಸಂಘಟನಾ ಕೌಶಲಗಳು', nameEn: 'Organizational Skills', type: 'activity' },
  { num: 5, key: 'scientificSkills', nameKn: '(3) ವೈಜ್ಞಾನಿಕ ಕೌಶಲಗಳು', nameEn: 'Scientific Skills', type: 'activity' },
  { num: 6, key: 'fineArtsDrawing', nameKn: '(4) ಲಲಿತ ಕಲೆ', nameEn: 'Fine Arts', type: 'activity' },
  { num: 7, key: 'creativity', nameKn: '(5) ಸೃಜನಶೀಲತೆ', nameEn: 'Creativity', type: 'activity' },
  { num: 8, key: 'attitude', nameKn: '(6) ಮನೋಧೋರಣೆ', nameEn: 'Attitude', type: 'activity' },
  { num: 9, key: 'values', nameKn: '(7) ಮೌಲ್ಯಗಳು', nameEn: 'Values', type: 'activity' },
];

export const HP_PART_B_COLUMNS = HP_PART_B_ALL_ITEMS;

export const getHpCoGradeValue = (
  record: Record<string, string> | undefined,
  actKey: string
): string => {
  if (!record) return '-';
  if (record[actKey]) return record[actKey];

  const map: Record<string, string[]> = {
    emotionalSocial: ['emotionalSocial', 'pe', 'emotional_social'],
    organizationalSkills: ['organizationalSkills', 'music', 'organizational_skills'],
    scientificSkills: ['scientificSkills', 'life_skills', 'scientific_skills'],
    fineArtsDrawing: ['fineArtsDrawing', 'art_workexp', 'art', 'fine_arts'],
    creativity: ['creativity', 'ict_computer', 'cleanliness'],
    attitude: ['attitude', 'attitudes'],
    values: ['values', 'moral', 'cleanliness'],
  };

  const fallbacks = map[actKey] || [];
  for (const alt of fallbacks) {
    if (record[alt]) return record[alt];
  }
  return '-';
};

export const getHp9LineCoGrade = (
  cSt: ComputedHpStudent,
  actKey: string,
  sem: 'sem1' | 'sem2' | 'final'
): string => {
  const semRecord = cSt.coScholastic?.[sem] || {};
  return getHpCoGradeValue(semRecord, actKey);
};

export interface ComputedHpSubjectMarks {
  code: HpSubjectCode;
  nameEn: string;
  nameKn: string;
  fa1: number | null;
  fa1_pct: number | null;
  fa1_grade: string;
  fa2: number | null;
  fa2_pct: number | null;
  fa2_grade: string;
  sa1: number | null;
  sa1_pct: number | null;
  sa1_grade: string;
  sem1_total: number | null;
  fa3: number | null;
  fa3_pct: number | null;
  fa3_grade: string;
  fa4: number | null;
  fa4_pct: number | null;
  fa4_grade: string;
  sa2: number | null;
  sa2_pct: number | null;
  sa2_grade: string;
  sem2_total: number | null;
  total100: number | null;
  grade: string;
}

export interface ComputedHpStudent {
  student: Student;
  isExempted: boolean;
  hasCwsnMarksAllowed: boolean;
  isPassed: boolean;
  attendanceDays: number;
  sem1Attendance: number;
  sem2Attendance: number;
  totalWorkingDays: number;
  subjects: Record<HpSubjectCode, ComputedHpSubjectMarks>;
  totalMarks700: number;
  percentage: number;
  overallGrade: string;
  resultStatus: string;
  coScholastic: {
    sem1: Record<string, string>;
    sem2: Record<string, string>;
    final: Record<string, string>;
  };
  partBSubjects: Record<string, {
    sem1: number | null;
    sem1_grade: string;
    sem2: number | null;
    sem2_grade: string;
    total: number | null;
    grade: string;
  }>;
}

/**
 * Grade calculator for Class 6-8 (same as 1-5 class instruction)
 * >= 90: A+, >= 70: A, >= 50: B+, >= 30: B, else: C
 */
export const calculateHpGrade = (score: number | null | undefined, maxMarks: number = 100): string => {
  if (score === null || score === undefined || isNaN(score) || maxMarks <= 0) return '-';
  const pct = (Number(score) / maxMarks) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 70) return 'A';
  if (pct >= 50) return 'B+';
  if (pct >= 30) return 'B';
  return 'C';
};

/**
 * Normalizes exam raw mark into weightage % for Class 6-8:
 * FA1, FA2, FA3, FA4: 20 marks converted to 10 (rounded down, no decimal)
 * SA1, SA2: 50 marks converted to 30 (rounded down, no decimal)
 * Pattern: (10+10+30) + (10+10+30) = 100
 */
export const computeHpExamPct = (exam: 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2', rawVal: number | null | undefined): number | null => {
  if (rawVal === null || rawVal === undefined || isNaN(rawVal)) return null;
  const isSa = exam === 'sa1' || exam === 'sa2';
  if (isSa) {
    // SA exam is for 50 marks, converted to 30: round down, no decimal
    const clampedRaw = Math.min(50, Math.max(0, Math.floor(rawVal)));
    return Math.min(30, Math.floor((clampedRaw * 30) / 50));
  } else {
    // FA exam is for 20 marks, converted to 10: round down, no decimal
    const clampedRaw = Math.min(20, Math.max(0, Math.floor(rawVal)));
    return Math.min(10, Math.floor(clampedRaw / 2));
  }
};

/**
 * Compute student results for 6-8th standard
 */
export const computeHpStudentCce = (
  student: Student,
  medium: string,
  rawMarks: StudentExamMarks | null
): ComputedHpStudent => {
  const isExempted = isCwsnExempted(student.cwsnStatus);
  const hasCwsnMarksAllowed = student.cwsnStatus === 'MARKS_ALLOWED' || student.cwsnStatus === 'YES_MARKS';

  const subjectsList = getHpSubjectsForMedium(medium);
  const subjectRecords = rawMarks?.subjects || {};
  const computedSubjects: Record<HpSubjectCode, ComputedHpSubjectMarks> = {} as any;

  let grandTotal = 0;
  let subjectsCounted = 0;

  subjectsList.forEach((subInfo) => {
    const rawSub = subjectRecords[subInfo.code] || subjectRecords[subInfo.satsKey] || {};

    let fa1_pct = rawSub.fa1_pct ?? (rawSub.fa1 !== undefined && rawSub.fa1 !== null ? computeHpExamPct('fa1', rawSub.fa1) : null);
    let fa2_pct = rawSub.fa2_pct ?? (rawSub.fa2 !== undefined && rawSub.fa2 !== null ? computeHpExamPct('fa2', rawSub.fa2) : null);
    let sa1_pct = rawSub.sa1_pct ?? (rawSub.sa1 !== undefined && rawSub.sa1 !== null ? computeHpExamPct('sa1', rawSub.sa1) : null);

    let fa3_pct = rawSub.fa3_pct ?? (rawSub.fa3 !== undefined && rawSub.fa3 !== null ? computeHpExamPct('fa3', rawSub.fa3) : null);
    let fa4_pct = rawSub.fa4_pct ?? (rawSub.fa4 !== undefined && rawSub.fa4 !== null ? computeHpExamPct('fa4', rawSub.fa4) : null);
    let sa2_pct = rawSub.sa2_pct ?? (rawSub.sa2 !== undefined && rawSub.sa2 !== null ? computeHpExamPct('sa2', rawSub.sa2) : null);

    // Sem totals
    const sem1Parts = [fa1_pct, fa2_pct, sa1_pct].filter((v): v is number => v !== null && v !== undefined);
    const sem1_total = sem1Parts.length > 0 ? sem1Parts.reduce((a, b) => a + b, 0) : null;

    const sem2Parts = [fa3_pct, fa4_pct, sa2_pct].filter((v): v is number => v !== null && v !== undefined);
    const sem2_total = sem2Parts.length > 0 ? sem2Parts.reduce((a, b) => a + b, 0) : null;

    // Total 100
    let total100: number | null = rawSub.total ?? null;
    if (total100 === null) {
      if (sem1_total !== null || sem2_total !== null) {
        total100 = (sem1_total || 0) + (sem2_total || 0);
      }
    }

    let grade = isExempted ? 'EXEMPT' : (total100 !== null && total100 > 0 ? calculateHpGrade(total100, 100) : '-');
    let fa1_grade = isExempted ? 'EXEMPT' : (fa1_pct !== null ? calculateHpGrade(fa1_pct, 10) : '-');
    let fa2_grade = isExempted ? 'EXEMPT' : (fa2_pct !== null ? calculateHpGrade(fa2_pct, 10) : '-');
    let sa1_grade = isExempted ? 'EXEMPT' : (sa1_pct !== null ? calculateHpGrade(sa1_pct, 30) : '-');
    let fa3_grade = isExempted ? 'EXEMPT' : (fa3_pct !== null ? calculateHpGrade(fa3_pct, 10) : '-');
    let fa4_grade = isExempted ? 'EXEMPT' : (fa4_pct !== null ? calculateHpGrade(fa4_pct, 10) : '-');
    let sa2_grade = isExempted ? 'EXEMPT' : (sa2_pct !== null ? calculateHpGrade(sa2_pct, 30) : '-');

    if (!isExempted && total100 !== null) {
      grandTotal += total100;
      subjectsCounted++;
    }

    computedSubjects[subInfo.code] = {
      code: subInfo.code,
      nameEn: subInfo.nameEn,
      nameKn: subInfo.nameKn,
      fa1: rawSub.fa1 ?? null,
      fa1_pct,
      fa1_grade,
      fa2: rawSub.fa2 ?? null,
      fa2_pct,
      fa2_grade,
      sa1: rawSub.sa1 ?? null,
      sa1_pct,
      sa1_grade,
      sem1_total,
      fa3: rawSub.fa3 ?? null,
      fa3_pct,
      fa3_grade,
      fa4: rawSub.fa4 ?? null,
      fa4_pct,
      fa4_grade,
      sa2: rawSub.sa2 ?? null,
      sa2_pct,
      sa2_grade,
      sem2_total,
      total100,
      grade,
    };
  });

  const percentage = isExempted ? 0 : Number(((grandTotal / 700) * 100).toFixed(1));
  const overallGrade = isExempted ? 'EXEMPT' : (grandTotal > 0 ? calculateHpGrade(grandTotal, 700) : '-');

  const isPassed = isExempted || hasCwsnMarksAllowed || (percentage >= 35 && grandTotal > 0);
  let resultStatus = isPassed ? 'ಉತ್ತೀರ್ಣ (PROMOTED)' : 'ಅನುತ್ತೀರ್ಣ (DETAINED)';
  if (isExempted) {
    resultStatus = 'CWSN (ವಿನಾಯಿತಿ)';
  }

  // Attendance
  const totalWorkingDays = rawMarks?.totalWorkingDays || 220;
  const sem1Att = rawMarks?.sem1Attendance || 0;
  const sem2Att = rawMarks?.sem2Attendance || 0;
  const totalAtt = rawMarks?.attendanceDays || (sem1Att + sem2Att) || 0;

  // Co-scholastic Part B
  const sem1Co = rawMarks?.sem1Co || {};
  const sem2Co = rawMarks?.sem2Co || {};
  const finalCo = rawMarks?.finalCo || {};

  // Part B Subjects (Art Edu / Work Exp & ICT / Computer Edu)
  // Direct sem1-50m & sem2-50m, graded same as other subjects
  const rawPartB = rawMarks?.partBSubjects || {};
  const computedPartB: Record<string, {
    sem1: number | null;
    sem1_grade: string;
    sem2: number | null;
    sem2_grade: string;
    total: number | null;
    grade: string;
  }> = {};

  HP_PART_B_SUBJECTS.forEach((subDef) => {
    const rawSub = rawPartB[subDef.key] || {};
    const sem1Val = rawSub.sem1 !== undefined && rawSub.sem1 !== null && (rawSub.sem1 as any) !== '' && !isNaN(Number(rawSub.sem1)) ? Math.min(subDef.maxSem1, Math.max(0, Math.floor(Number(rawSub.sem1)))) : null;
    const sem2Val = rawSub.sem2 !== undefined && rawSub.sem2 !== null && (rawSub.sem2 as any) !== '' && !isNaN(Number(rawSub.sem2)) ? Math.min(subDef.maxSem2, Math.max(0, Math.floor(Number(rawSub.sem2)))) : null;
    const hasAny = sem1Val !== null || sem2Val !== null;
    const totalVal = hasAny ? (sem1Val || 0) + (sem2Val || 0) : null;

    computedPartB[subDef.key] = {
      sem1: sem1Val,
      sem1_grade: isExempted ? 'Exempt' : (sem1Val !== null ? calculateHpGrade(sem1Val, subDef.maxSem1) : '-'),
      sem2: sem2Val,
      sem2_grade: isExempted ? 'Exempt' : (sem2Val !== null ? calculateHpGrade(sem2Val, subDef.maxSem2) : '-'),
      total: totalVal,
      grade: isExempted ? 'Exempt' : (totalVal !== null ? calculateHpGrade(totalVal, subDef.maxTotal) : '-'),
    };
  });

  return {
    student,
    isExempted,
    hasCwsnMarksAllowed,
    isPassed,
    attendanceDays: totalAtt,
    sem1Attendance: sem1Att,
    sem2Attendance: sem2Att,
    totalWorkingDays,
    subjects: computedSubjects,
    totalMarks700: grandTotal,
    percentage,
    overallGrade,
    resultStatus,
    coScholastic: {
      sem1: sem1Co,
      sem2: sem2Co,
      final: finalCo,
    },
    partBSubjects: computedPartB,
  };
};

/**
 * Helper to get exam grade for SATS report
 */
export const getHpExamGrade = (
  sub: ComputedHpSubjectMarks | undefined,
  isExempted: boolean,
  exam: string
): string => {
  if (isExempted) return 'EXEMPT';
  if (!sub) return '-';
  switch (exam.toLowerCase()) {
    case 'fa1': return sub.fa1_grade || '-';
    case 'fa2': return sub.fa2_grade || '-';
    case 'sa1': return sub.sa1_grade || '-';
    case 'fa3': return sub.fa3_grade || '-';
    case 'fa4': return sub.fa4_grade || '-';
    case 'sa2': return sub.sa2_grade || '-';
    case 'total':
    case 'annual':
    default:
      return sub.grade || '-';
  }
};

/**
 * Helper to export SATS table to Excel with School Details header
 */
export const exportHpSatsToExcel = (options: {
  schoolName: string;
  diseCode: string;
  cluster: string;
  taluk: string;
  academicYear: string;
  className: string;
  examType: string;
  students: ComputedHpStudent[];
  subjects: HpSubjectInfo[];
  filename?: string;
}) => {
  const { schoolName, diseCode, cluster, taluk, academicYear, className, examType, students, subjects, filename } = options;

  const headerRows = [
    [schoolName || 'GOVERNMENT HIGHER PRIMARY SCHOOL'],
    [`DISE CODE: ${diseCode} | CLUSTER: ${cluster || 'Cluster'} | TALUK: ${taluk || 'Taluk'} | ACADEMIC YEAR: ${academicYear}`],
    [`CLASS: ${className} | EXAM TYPE: ${examType} | SATS GRADE ENTRY SHEET`],
    [], // empty row
    [
      'SL. NO',
      'SATS NO',
      'STUDENT NAME',
      'GENDER',
      ...subjects.slice(0, 6).map((s) => s.satsKey),
    ],
  ];

  const dataRows = students.map((st, idx) => {
    return [
      idx + 1,
      st.student.satsNo || '-',
      st.student.studentName || '-',
      st.student.gender || 'Boy',
      ...subjects.slice(0, 6).map((sub) => {
        const subData = st.subjects[sub.code];
        return getHpExamGrade(subData, st.isExempted, examType);
      }),
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SATS_Grades');

  const safeFilename = filename || `SATS_${className.replace(/\s+/g, '_')}_${examType}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
};
