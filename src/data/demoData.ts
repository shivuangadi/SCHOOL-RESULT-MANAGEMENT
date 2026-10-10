/**
 * Karnataka State Board Demo Dataset
 * Aligned with DSERT CCE Matrix for Classes 1 to 10
 * Specified by Shri S R Angadi (Science Teacher, Govt KHPS Ningyanatti, Belagavi)
 *
 * CCE EXAM PATTERNS:
 * - Class 1 to 5: (15+15+20) + (15+15+20) = 100m / subject
 * - Class 6 to 10: (10+10+30) + (10+10+30) = 100m / subject
 * - Class 9 & 10 FL: (12.5+12.5+37.5) + (12.5+12.5+37.5) = 125m
 *   Maximum Marks for 9th & 10th: 725 Marks
 */

import { SchoolMedium, Student } from '../types';
import {
  getSubjectsForMediumAndClass,
  getMaxMarksForMediumAndClass,
  getExamPatternForClassAndSubject,
} from './subjectConfig';

export interface DemoSubjectMarks {
  code: string;
  prefix: string; // "FL", "SL", "TL", or ""
  subjectName: string; // e.g. "FL Kannada", "SL English", "Math", "EV's"
  kannadaName: string;
  maxMarks: number; // 100 (or 125 for 9th/10th FL)
  fa1: number;
  fa2: number;
  sa1: number;
  fa3: number;
  fa4: number;
  sa2: number;
  total: number;
  grade: string;
}

export interface DemoStudent {
  id: string;
  rollNo: number;
  satsNo: string;
  name: string;
  kannadaName: string;
  gender: 'Boy' | 'Girl';
  casteCategory: 'SC' | 'ST' | 'Cat-1' | '2A' | '2B' | '3A' | '3B' | 'GM';
  classStandard: number; // 1 to 10
  section: string;
  fatherName: string;
  motherName: string;
  attendanceDays: number;
  totalWorkingDays: number;
  subjects: DemoSubjectMarks[];
  totalMarks: number; // Sum of subject totals
  maxTotalMarks: number; // 400 (Class 1-5 Kan/Eng), 500 (Class 1-5 Mar/Urd), 700 (Class 6-8), 725 (Class 9-10)
  percentage: number;
  overallGrade: string;
  resultStatus: 'PROMOTED' | 'ELIGIBLE FOR SUPPLEMENTARY' | 'DETAINED';
}

export const calculateGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 70) return 'A';
  if (percentage >= 50) return 'B+';
  if (percentage >= 30) return 'B';
  return 'C';
};

/**
 * Calculates grade normalized to 100% for any exam component:
 * 0 - 29.99%: C
 * 30 - 49.99%: B
 * 50 - 69.99%: B+
 * 70 - 89.99%: A
 * 90 - 100%: A+
 * Example: 12/15 -> (12/15)*100 = 80% -> "A"
 */
export const calculateMarksGrade = (
  marks: number | null | undefined,
  maxMarks: number
): string => {
  if (marks === null || marks === undefined || isNaN(marks) || maxMarks <= 0) return '-';
  const percentage = (Number(marks) / maxMarks) * 100;
  return calculateGrade(percentage);
};

export const calculateSubjectGrade = (marks: number, maxMarks: number = 100): string => {
  return calculateMarksGrade(marks, maxMarks);
};

const BASE_STUDENTS_METADATA = [
  {
    rollNo: 1,
    satsNo: '1290384711',
    name: 'AARAV PATIL',
    kannadaName: 'ಆರವ್ ಪಾಟೀಲ್',
    gender: 'Boy' as const,
    casteCategory: 'GM' as const,
    fatherName: 'Suresh Patil',
    motherName: 'Sunita Patil',
    perf: 0.94,
    attendance: 218,
  },
  {
    rollNo: 2,
    satsNo: '1290384712',
    name: 'ANANYA KULKARNI',
    kannadaName: 'ಅನನ್ಯಾ ಕುಲಕರ್ಣಿ',
    gender: 'Girl' as const,
    casteCategory: 'GM' as const,
    fatherName: 'Raghavendra Kulkarni',
    motherName: 'Laxmi Kulkarni',
    perf: 0.96,
    attendance: 220,
  },
  {
    rollNo: 3,
    satsNo: '1290384713',
    name: 'BASAVARAJ MADAR',
    kannadaName: 'ಬಸವರಾಜ್ ಮಾದರ',
    gender: 'Boy' as const,
    casteCategory: 'SC' as const,
    fatherName: 'Yallappa Madar',
    motherName: 'Renuka Madar',
    perf: 0.82,
    attendance: 210,
  },
  {
    rollNo: 4,
    satsNo: '1290384714',
    name: 'BHAGYASHREE KAMBLE',
    kannadaName: 'ಭಾಗ್ಯಶ್ರೀ ಕಾಂಬ್ಳೆ',
    gender: 'Girl' as const,
    casteCategory: 'SC' as const,
    fatherName: 'Maruti Kamble',
    motherName: 'Kasturi Kamble',
    perf: 0.88,
    attendance: 215,
  },
  {
    rollNo: 5,
    satsNo: '1290384715',
    name: 'CHETHAN NAIK',
    kannadaName: 'ಚೇತನ್ ನಾಯ್ಕ್',
    gender: 'Boy' as const,
    casteCategory: 'ST' as const,
    fatherName: 'Somanna Naik',
    motherName: 'Gowramma Naik',
    perf: 0.74,
    attendance: 202,
  },
  {
    rollNo: 6,
    satsNo: '1290384716',
    name: 'DEEPA VALMIKI',
    kannadaName: 'ದೀಪಾ ವಾಲ್ಮೀಕಿ',
    gender: 'Girl' as const,
    casteCategory: 'ST' as const,
    fatherName: 'Basappa Valmiki',
    motherName: 'Shantavva Valmiki',
    perf: 0.85,
    attendance: 214,
  },
  {
    rollNo: 7,
    satsNo: '1290384717',
    name: 'FARHAN INAMDAR',
    kannadaName: 'ಫರ್ಹಾನ್ ಇನಾಂದಾರ್',
    gender: 'Boy' as const,
    casteCategory: '2B' as const,
    fatherName: 'Jameel Inamdar',
    motherName: 'Shabana Inamdar',
    perf: 0.79,
    attendance: 208,
  },
  {
    rollNo: 8,
    satsNo: '1290384718',
    name: 'GURUPRASAD JOSHI',
    kannadaName: 'ಗುರುಪ್ರಸಾದ ಜೋಶಿ',
    gender: 'Boy' as const,
    casteCategory: 'GM' as const,
    fatherName: 'Shridhar Joshi',
    motherName: 'Anuradha Joshi',
    perf: 0.91,
    attendance: 221,
  },
  {
    rollNo: 9,
    satsNo: '1290384719',
    name: 'KEERTHI PUJARI',
    kannadaName: 'ಕೀರ್ತಿ ಪೂಜಾರಿ',
    gender: 'Girl' as const,
    casteCategory: 'Cat-1' as const,
    fatherName: 'Mallappa Pujari',
    motherName: 'Savita Pujari',
    perf: 0.77,
    attendance: 206,
  },
  {
    rollNo: 10,
    satsNo: '1290384720',
    name: 'MANJUNATH GOUDA',
    kannadaName: 'ಮಂಜುನಾಥ ಗೌಡ',
    gender: 'Boy' as const,
    casteCategory: '3A' as const,
    fatherName: 'Ningappa Gouda',
    motherName: 'Channamma Gouda',
    perf: 0.83,
    attendance: 212,
  },
  {
    rollNo: 11,
    satsNo: '1290384721',
    name: 'POOJA METI',
    kannadaName: 'ಪೂಜಾ ಮೇಟಿ',
    gender: 'Girl' as const,
    casteCategory: '3B' as const,
    fatherName: 'Shivappa Meti',
    motherName: 'Kamala Meti',
    perf: 0.93,
    attendance: 219,
  },
  {
    rollNo: 12,
    satsNo: '1290384722',
    name: 'RAHUL SHINDE',
    kannadaName: 'ರಾಹುಲ್ ಶಿಂಧೆ',
    gender: 'Boy' as const,
    casteCategory: '2A' as const,
    fatherName: 'Tanaji Shinde',
    motherName: 'Meenakshi Shinde',
    perf: 0.71,
    attendance: 198,
  },
  {
    rollNo: 13,
    satsNo: '1290384723',
    name: 'RAJENDRA GANGAPPA YALLUR',
    kannadaName: 'ರಾಜೇಂದ್ರ ಗಂಗಪ್ಪ ಯಲ್ಲೂರ',
    gender: 'Boy' as const,
    casteCategory: '3B' as const,
    fatherName: 'Gangappa Yallur',
    motherName: 'Laxmi Yallur',
    perf: 0.75,
    attendance: 215,
    cwsnStatus: 'EXEMPTED' as const,
  },
];

/**
 * Creates subject marks according to official CCE rules:
 * - Class 1-5: (15+15+20) + (15+15+20) = 100
 * - Class 6-10: (10+10+30) + (10+10+30) = 100
 * - Class 9 & 10 FL: (12.5+12.5+37.5) + (12.5+12.5+37.5) = 125
 */
export const createStudentSubjectMarks = (
  medium: SchoolMedium,
  classStandard: number,
  perfFactor: number
): DemoSubjectMarks[] => {
  const configs = getSubjectsForMediumAndClass(medium, classStandard);

  return configs.map((cfg, idx) => {
    const variation = (idx % 2 === 0 ? 1 : -1) * 0.4;
    const factor = Math.min(0.98, Math.max(0.38, perfFactor + variation * 0.1));
    const pattern = getExamPatternForClassAndSubject(classStandard, cfg.code);

    let fa1 = 0;
    let fa2 = 0;
    let sa1 = 0;
    let fa3 = 0;
    let fa4 = 0;
    let sa2 = 0;

    if (classStandard <= 5) {
      // Pattern: (15 + 15 + 20) + (15 + 15 + 20) = 100
      fa1 = Math.min(15, Math.max(5, Math.round(14.5 * factor)));
      fa2 = Math.min(15, Math.max(5, Math.round(14.5 * factor)));
      sa1 = Math.min(20, Math.max(8, Math.round(19.5 * factor)));

      fa3 = Math.min(15, Math.max(5, Math.round(14.5 * factor)));
      fa4 = Math.min(15, Math.max(5, Math.round(14.5 * factor)));
      sa2 = Math.min(20, Math.max(8, Math.round(19.5 * factor)));
    } else if ((classStandard === 9 || classStandard === 10) && cfg.code === 'FL') {
      // Pattern: (12.5 + 12.5 + 37.5) + (12.5 + 12.5 + 37.5) = 125
      fa1 = Math.min(12.5, Math.max(5, Math.round(12 * factor * 2) / 2));
      fa2 = Math.min(12.5, Math.max(5, Math.round(12 * factor * 2) / 2));
      sa1 = Math.min(37.5, Math.max(15, Math.round(36 * factor * 2) / 2));

      fa3 = Math.min(12.5, Math.max(5, Math.round(12 * factor * 2) / 2));
      fa4 = Math.min(12.5, Math.max(5, Math.round(12 * factor * 2) / 2));
      sa2 = Math.min(37.5, Math.max(15, Math.round(36 * factor * 2) / 2));
    } else {
      // Pattern: (10 + 10 + 30) + (10 + 10 + 30) = 100
      fa1 = Math.min(10, Math.max(4, Math.round(9.5 * factor)));
      fa2 = Math.min(10, Math.max(4, Math.round(9.5 * factor)));
      sa1 = Math.min(30, Math.max(12, Math.round(28.5 * factor)));

      fa3 = Math.min(10, Math.max(4, Math.round(9.5 * factor)));
      fa4 = Math.min(10, Math.max(4, Math.round(9.5 * factor)));
      sa2 = Math.min(30, Math.max(12, Math.round(28.5 * factor)));
    }

    const total = Number((fa1 + fa2 + sa1 + fa3 + fa4 + sa2).toFixed(1));
    const grade = calculateSubjectGrade(total, cfg.maxMarks);

    return {
      code: cfg.code,
      prefix: cfg.prefix,
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
};

/**
 * Generates full student roster for the chosen medium and class standard
 */
export const generateStudentsForMediumAndClass = (
  medium: SchoolMedium,
  classStandard: number
): DemoStudent[] => {
  const maxTotalMarks = getMaxMarksForMediumAndClass(medium, classStandard);

  return BASE_STUDENTS_METADATA.map((meta, index) => {
    const subjects = createStudentSubjectMarks(medium, classStandard, meta.perf);
    const totalMarks = Number(subjects.reduce((sum, s) => sum + s.total, 0).toFixed(1));
    const percentage = Number(((totalMarks / maxTotalMarks) * 100).toFixed(2));
    const overallGrade = calculateGrade(percentage);

    const resultStatus: 'PROMOTED' | 'ELIGIBLE FOR SUPPLEMENTARY' | 'DETAINED' =
      percentage >= 35 ? 'PROMOTED' : percentage >= 30 ? 'ELIGIBLE FOR SUPPLEMENTARY' : 'DETAINED';

    return {
      id: `std_${classStandard}_${index + 1}`,
      rollNo: meta.rollNo,
      satsNo: meta.satsNo,
      name: meta.name,
      kannadaName: meta.kannadaName,
      gender: meta.gender,
      casteCategory: meta.casteCategory,
      classStandard,
      section: 'A',
      fatherName: meta.fatherName,
      motherName: meta.motherName,
      attendanceDays: meta.attendance,
      totalWorkingDays: 224,
      subjects,
      totalMarks,
      maxTotalMarks,
      percentage,
      overallGrade,
      resultStatus,
    };
  });
};

export const createDemoStudentFromRealStudent = (
  st: Student,
  medium: SchoolMedium,
  rollNo: number
): DemoStudent => {
  const classNum = Number(st.classStandard) || 5;
  const maxTotalMarks = getMaxMarksForMediumAndClass(medium, classNum);
  const subjects = createStudentSubjectMarks(medium, classNum, 0.75 + (rollNo % 5) * 0.05);
  const totalMarks = Number(subjects.reduce((sum, s) => sum + s.total, 0).toFixed(1));
  const percentage = Number(((totalMarks / maxTotalMarks) * 100).toFixed(2));
  const overallGrade = calculateGrade(percentage);
  const resultStatus: 'PROMOTED' | 'ELIGIBLE FOR SUPPLEMENTARY' | 'DETAINED' =
    percentage >= 35 ? 'PROMOTED' : percentage >= 30 ? 'ELIGIBLE FOR SUPPLEMENTARY' : 'DETAINED';

  return {
    id: st.id,
    rollNo,
    satsNo: st.satsNo,
    name: st.studentName,
    kannadaName: st.studentName,
    gender: st.gender || (rollNo % 2 === 0 ? 'Girl' : 'Boy'),
    casteCategory: (st.caste === 'SC' || st.caste === 'ST' ? st.caste : 'GM') as any,
    classStandard: classNum,
    section: st.division || 'A',
    fatherName: st.fatherName,
    motherName: st.motherName,
    attendanceDays: 212,
    totalWorkingDays: 224,
    subjects,
    totalMarks,
    maxTotalMarks,
    percentage,
    overallGrade,
    resultStatus,
  };
};

export const DEMO_SCHOOL_INFO = {
  diseCode: '29010100101',
  schoolName: 'Govt Model Higher Primary School, Ningyanatti',
  kannadaSchoolName: 'ಸರ್ಕಾರಿ ಮಾದರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ, ನಿಂಗ್ಯಾನಟ್ಟಿ',
  headmasterName: 'Shri. S R Angadi (Science Teacher)',
  taluk: 'Raybag / Gokak',
  district: 'Belagavi',
  academicYear: '2025-26',
  board: 'Karnataka State Examination & Assessment Board (KSEAB) / DSERT',
};
