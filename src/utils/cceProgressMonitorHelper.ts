/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Advanced CCE Result Monitoring & Progress Engine
 * Karnataka State School Result Management System
 * Conforming to KSEAB / DSERT Guidelines
 */

import { Student, StudentClass, StudentExamMarks, SchoolMedium, isCwsnExempted, isCwsnStudent } from '../types';

export type CceExamKey = 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2';

export interface ExamCalendarWindow {
  exam: CceExamKey;
  labelEn: string;
  labelKn: string;
  month: number; // 1-12 (July=7, August=8, September=9, December=12, February=2, March=3)
  startDay: number;
  endDay: number;
  isEndOfMonth?: boolean;
}

export const CCE_EXAMS: { key: CceExamKey; labelEn: string; labelKn: string; maxMarksPrimary: number; maxMarksHigher: number }[] = [
  { key: 'fa1', labelEn: 'FA-1', labelKn: 'ರೂಪಣಾತ್ಮಕ-೧ (FA-1)', maxMarksPrimary: 20, maxMarksHigher: 10 },
  { key: 'fa2', labelEn: 'FA-2', labelKn: 'ರೂಪಣಾತ್ಮಕ-೨ (FA-2)', maxMarksPrimary: 20, maxMarksHigher: 10 },
  { key: 'sa1', labelEn: 'SA-1', labelKn: 'ಸಂಕಲನಾತ್ಮಕ-೧ (SA-1)', maxMarksPrimary: 50, maxMarksHigher: 30 },
  { key: 'fa3', labelEn: 'FA-3', labelKn: 'ರೂಪಣಾತ್ಮಕ-೩ (FA-3)', maxMarksPrimary: 20, maxMarksHigher: 10 },
  { key: 'fa4', labelEn: 'FA-4', labelKn: 'ರೂಪಣಾತ್ಮಕ-೪ (FA-4)', maxMarksPrimary: 20, maxMarksHigher: 10 },
  { key: 'sa2', labelEn: 'SA-2', labelKn: 'ಸಂಕಲನಾತ್ಮಕ-೨ (SA-2)', maxMarksPrimary: 50, maxMarksHigher: 30 },
];

export const DEFAULT_EXAM_SCHEDULE: ExamCalendarWindow[] = [
  { exam: 'fa1', labelEn: 'FA-1', labelKn: 'ರೂಪಣಾತ್ಮಕ-೧ (FA-1)', month: 7, startDay: 25, endDay: 31, isEndOfMonth: true },
  { exam: 'fa2', labelEn: 'FA-2', labelKn: 'ರೂಪಣಾತ್ಮಕ-೨ (FA-2)', month: 8, startDay: 25, endDay: 31, isEndOfMonth: true },
  { exam: 'sa1', labelEn: 'SA-1', labelKn: 'ಸಂಕಲನಾತ್ಮಕ-೧ (SA-1)', month: 9, startDay: 25, endDay: 30, isEndOfMonth: true },
  { exam: 'fa3', labelEn: 'FA-3', labelKn: 'ರೂಪಣಾತ್ಮಕ-೩ (FA-3)', month: 12, startDay: 8, endDay: 14 },
  { exam: 'fa4', labelEn: 'FA-4', labelKn: 'ರೂಪಣಾತ್ಮಕ-೪ (FA-4)', month: 2, startDay: 1, endDay: 7 },
  { exam: 'sa2', labelEn: 'SA-2', labelKn: 'ಸಂಕಲನಾತ್ಮಕ-೨ (SA-2)', month: 3, startDay: 8, endDay: 14 },
];

/**
 * Determine Current Scheduled Examination based on system date in Asia/Kolkata timezone
 */
export const getCurrentScheduledExam = (
  customDate?: Date
): {
  exam: CceExamKey;
  labelEn: string;
  labelKn: string;
  isWithinWindow: boolean;
  windowDescription: string;
} => {
  const targetDate = customDate || new Date();
  // Get date in Asia/Kolkata timezone
  const kolkataStr = targetDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const kDate = new Date(kolkataStr);
  const month = kDate.getMonth() + 1; // 1-12
  const day = kDate.getDate();

  // 1. Check exact active scheduled period
  for (const win of DEFAULT_EXAM_SCHEDULE) {
    if (win.month === month) {
      const endDay = win.isEndOfMonth ? new Date(kDate.getFullYear(), month, 0).getDate() : win.endDay;
      if (day >= win.startDay && day <= endDay) {
        return {
          exam: win.exam,
          labelEn: win.labelEn,
          labelKn: win.labelKn,
          isWithinWindow: true,
          windowDescription: `${win.labelEn} Scheduled Window (${win.startDay} - ${endDay} ${getMonthName(month)})`,
        };
      }
    }
  }

  // 2. Outside official windows: retain the most recently scheduled examination
  if (month === 7 && day < 25) {
    return { exam: 'fa1', labelEn: 'FA-1', labelKn: 'ರೂಪಣಾತ್ಮಕ-೧ (FA-1)', isWithinWindow: false, windowDescription: 'Upcoming: FA1 (Starts July 25)' };
  }
  if (month === 7 && day >= 25) {
    return { exam: 'fa1', labelEn: 'FA-1', labelKn: 'ರೂಪಣಾತ್ಮಕ-೧ (FA-1)', isWithinWindow: true, windowDescription: 'Last week of July' };
  }
  if (month === 8 && day < 25) {
    return { exam: 'fa1', labelEn: 'FA-1', labelKn: 'ರೂಪಣಾತ್ಮಕ-೧ (FA-1)', isWithinWindow: false, windowDescription: 'Recent Exam: FA1' };
  }
  if (month === 8 && day >= 25) {
    return { exam: 'fa2', labelEn: 'FA-2', labelKn: 'ರೂಪಣಾತ್ಮಕ-೨ (FA-2)', isWithinWindow: true, windowDescription: 'Last week of August' };
  }
  if (month === 9 && day < 25) {
    return { exam: 'fa2', labelEn: 'FA-2', labelKn: 'ರೂಪಣಾತ್ಮಕ-೨ (FA-2)', isWithinWindow: false, windowDescription: 'Recent Exam: FA2' };
  }
  if (month === 9 && day >= 25) {
    return { exam: 'sa1', labelEn: 'SA-1', labelKn: 'ಸಂಕಲನಾತ್ಮಕ-೧ (SA-1)', isWithinWindow: true, windowDescription: 'Last week of September' };
  }
  if (month === 10 || month === 11 || (month === 12 && day < 8)) {
    return { exam: 'sa1', labelEn: 'SA-1', labelKn: 'ಸಂಕಲನಾತ್ಮಕ-೧ (SA-1)', isWithinWindow: false, windowDescription: 'Recent Exam: SA1' };
  }
  if (month === 12 && day >= 8 && day <= 14) {
    return { exam: 'fa3', labelEn: 'FA-3', labelKn: 'ರೂಪಣಾತ್ಮಕ-೩ (FA-3)', isWithinWindow: true, windowDescription: 'Second week of December' };
  }
  if (month === 12 && day > 14 || month === 1) {
    return { exam: 'fa3', labelEn: 'FA-3', labelKn: 'ರೂಪಣಾತ್ಮಕ-೩ (FA-3)', isWithinWindow: false, windowDescription: 'Recent Exam: FA3' };
  }
  if (month === 2 && day >= 1 && day <= 7) {
    return { exam: 'fa4', labelEn: 'FA-4', labelKn: 'ರೂಪಣಾತ್ಮಕ-೪ (FA-4)', isWithinWindow: true, windowDescription: 'First week of February' };
  }
  if (month === 2 && day > 7 || (month === 3 && day < 8)) {
    return { exam: 'fa4', labelEn: 'FA-4', labelKn: 'ರೂಪಣಾತ್ಮಕ-೪ (FA-4)', isWithinWindow: false, windowDescription: 'Recent Exam: FA4' };
  }
  if (month === 3 && day >= 8 && day <= 14) {
    return { exam: 'sa2', labelEn: 'SA-2', labelKn: 'ಸಂಕಲನಾತ್ಮಕ-೨ (SA-2)', isWithinWindow: true, windowDescription: 'Second week of March' };
  }
  if (month === 3 && day > 14 || month >= 4) {
    return { exam: 'sa2', labelEn: 'SA-2', labelKn: 'ಸಂಕಲನಾತ್ಮಕ-೨ (SA-2)', isWithinWindow: false, windowDescription: 'Recent Exam: SA2' };
  }

  return { exam: 'fa1', labelEn: 'FA-1', labelKn: 'ರೂಪಣಾತ್ಮಕ-೧ (FA-1)', isWithinWindow: false, windowDescription: 'FA1' };
};

const getMonthName = (m: number): string => {
  const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return names[m] || '';
};

export interface SubjectProgressItem {
  subjectCode: string;
  subjectNameEn: string;
  subjectNameKn: string;
  exam: CceExamKey;
  examLabel: string;
  totalStudents: number;
  eligibleStudents: number;
  completedEntries: number;
  pendingEntries: number;
  progressPercent: number | null; // null represents "N/A"
  progressPercentDisplay: string;
}

export interface ClassCceProgress {
  classStandard: StudentClass;
  className: string;
  totalStudents: number;
  eligibleStudents: number;
  exemptedStudents: number;
  currentExam: CceExamKey;
  currentExamLabel: string;
  overallClassPercent: number | null; // Weighted aggregate
  overallClassPercentDisplay: string;
  totalClassRequired: number;
  totalClassCompleted: number;
  examProgress: Record<CceExamKey, {
    totalRequired: number;
    completed: number;
    pending: number;
    percent: number | null;
    display: string;
  }>;
  subjectTableRows: SubjectProgressItem[];
}

export interface SchoolCceMonitoringSummary {
  schoolName: string;
  diseCode: string;
  academicYear: string;
  currentExam: CceExamKey;
  currentExamLabel: string;
  examWindowDescription: string;
  totalStudentsAcrossSchool: number;
  totalRequiredEntries: number;
  totalCompletedEntries: number;
  totalPendingEntries: number;
  overallSchoolPercent: number | null;
  overallSchoolPercentDisplay: string;
  classSummaries: ClassCceProgress[];
  lowProgressAlerts: {
    classStandard: StudentClass;
    subjectName: string;
    exam: CceExamKey;
    examLabel: string;
    percent: number;
    completed: number;
    required: number;
  }[];
  bulletinText: string;
}

/**
 * Returns canonical subjects list for a given class standard and school medium
 */
export const getSubjectsForClassAndMedium = (
  classStandard: StudentClass,
  medium: SchoolMedium = 'Kannada'
): { code: string; nameEn: string; nameKn: string }[] => {
  const clsNum = Number(classStandard) || 1;
  const med = (medium || 'Kannada').toLowerCase();
  const isMarathi = med.includes('marathi');
  const isUrdu = med.includes('urdu');
  const isEnglish = med.includes('english');

  if (clsNum <= 5) {
    if (isMarathi) {
      return [
        { code: 'FL', nameEn: 'First Language Marathi', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ ಮರಾಠಿ' },
        { code: 'SL', nameEn: 'Second Language Kannada', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ ಕನ್ನಡ' },
        { code: 'TL', nameEn: 'Third Language English', nameKn: 'ತೃತೀಯ ಭಾಷೆ ಇಂಗ್ಲಿಷ್' },
        { code: 'MATHS', nameEn: 'Mathematics', nameKn: 'ಗಣಿತ' },
        { code: 'EVS', nameEn: 'Environmental Studies (EVS)', nameKn: 'ಪರಿಸರ ಅಧ್ಯಯನ (EVS)' },
      ];
    }
    if (isUrdu) {
      return [
        { code: 'FL', nameEn: 'First Language Urdu', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ ಉರ್ದು' },
        { code: 'SL', nameEn: 'Second Language Kannada', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ ಕನ್ನಡ' },
        { code: 'TL', nameEn: 'Third Language English', nameKn: 'ತೃತೀಯ ಭಾಷೆ ಇಂಗ್ಲಿಷ್' },
        { code: 'MATHS', nameEn: 'Mathematics', nameKn: 'ಗಣಿತ' },
        { code: 'EVS', nameEn: 'Environmental Studies (EVS)', nameKn: 'ಪರಿಸರ ಅಧ್ಯಯನ (EVS)' },
      ];
    }
    if (isEnglish) {
      return [
        { code: 'FL', nameEn: 'First Language English', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ ಇಂಗ್ಲಿಷ್' },
        { code: 'SL', nameEn: 'Second Language Kannada', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ ಕನ್ನಡ' },
        { code: 'MATHS', nameEn: 'Mathematics', nameKn: 'ಗಣಿತ' },
        { code: 'EVS', nameEn: 'Environmental Studies (EVS)', nameKn: 'ಪರಿಸರ ಅಧ್ಯಯನ (EVS)' },
      ];
    }
    // Default: Kannada Medium Primary
    return [
      { code: 'FL', nameEn: 'First Language Kannada', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ ಕನ್ನಡ' },
      { code: 'SL', nameEn: 'Second Language English', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ ಇಂಗ್ಲಿಷ್' },
      { code: 'MATHS', nameEn: 'Mathematics', nameKn: 'ಗಣಿತ' },
      { code: 'EVS', nameEn: 'Environmental Studies (EVS)', nameKn: 'ಪರಿಸರ ಅಧ್ಯಯನ (EVS)' },
    ];
  } else {
    // Classes 6-8: 7 Curricular Subjects
    if (isMarathi) {
      return [
        { code: 'FL', nameEn: 'First Language Marathi', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ ಮರಾಠಿ' },
        { code: 'SL', nameEn: 'Second Language Kannada', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ ಕನ್ನಡ' },
        { code: 'TL', nameEn: 'Third Language English', nameKn: 'ತೃತೀಯ ಭಾಷೆ ಇಂಗ್ಲಿಷ್' },
        { code: 'MATHS', nameEn: 'Mathematics', nameKn: 'ಗಣಿತ' },
        { code: 'SCI', nameEn: 'General Science', nameKn: 'ವಿಜ್ಞಾನ' },
        { code: 'SOC', nameEn: 'Social Science', nameKn: 'ಸಮಾಜ ವಿಜ್ಞಾನ' },
        { code: 'VPE', nameEn: 'Physical Education', nameKn: 'ದೈಹಿಕ ಶಿಕ್ಷಣ' },
      ];
    }
    if (isUrdu) {
      return [
        { code: 'FL', nameEn: 'First Language Urdu', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ ಉರ್ದು' },
        { code: 'SL', nameEn: 'Second Language Kannada', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ ಕನ್ನಡ' },
        { code: 'TL', nameEn: 'Third Language English', nameKn: 'ತೃತೀಯ ಭಾಷೆ ಇಂಗ್ಲಿಷ್' },
        { code: 'MATHS', nameEn: 'Mathematics', nameKn: 'ಗಣಿತ' },
        { code: 'SCI', nameEn: 'General Science', nameKn: 'ವಿಜ್ಞಾನ' },
        { code: 'SOC', nameEn: 'Social Science', nameKn: 'ಸಮಾಜ ವಿಜ್ಞಾನ' },
        { code: 'VPE', nameEn: 'Physical Education', nameKn: 'ದೈಹಿಕ ಶಿಕ್ಷಣ' },
      ];
    }
    if (isEnglish) {
      return [
        { code: 'FL', nameEn: 'First Language English', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ ಇಂಗ್ಲಿಷ್' },
        { code: 'SL', nameEn: 'Second Language Kannada', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ ಕನ್ನಡ' },
        { code: 'TL', nameEn: 'Third Language Hindi', nameKn: 'ತೃತೀಯ ಭಾಷೆ ಹಿಂದಿ' },
        { code: 'MATHS', nameEn: 'Mathematics', nameKn: 'ಗಣಿತ' },
        { code: 'SCI', nameEn: 'General Science', nameKn: 'ವಿಜ್ಞಾನ' },
        { code: 'SOC', nameEn: 'Social Science', nameKn: 'ಸಮಾಜ ವಿಜ್ಞಾನ' },
        { code: 'VPE', nameEn: 'Physical Education', nameKn: 'ದೈಹಿಕ ಶಿಕ್ಷಣ' },
      ];
    }
    // Default: Kannada Medium Higher Primary (6-8)
    return [
      { code: 'FL', nameEn: 'First Language Kannada', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ ಕನ್ನಡ' },
      { code: 'SL', nameEn: 'Second Language English', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ ಇಂಗ್ಲಿಷ್' },
      { code: 'TL', nameEn: 'Third Language Hindi', nameKn: 'ತೃತೀಯ ಭಾಷೆ ಹಿಂದಿ' },
      { code: 'MATHS', nameEn: 'Mathematics', nameKn: 'ಗಣಿತ' },
      { code: 'SCI', nameEn: 'General Science', nameKn: 'ವಿಜ್ಞಾನ' },
      { code: 'SOC', nameEn: 'Social Science', nameKn: 'ಸಮಾಜ ವಿಜ್ಞಾನ' },
      { code: 'VPE', nameEn: 'Physical Education', nameKn: 'ದೈಹಿಕ ಶಿಕ್ಷಣ' },
    ];
  }
};

/**
 * Check if a student has valid and saved marks for a specific subject and exam
 */
export const isSubjectExamCompleted = (
  entry: StudentExamMarks | undefined,
  subCode: string,
  examKey: CceExamKey
): boolean => {
  if (!entry || !entry.subjects) return false;
  const sub =
    entry.subjects[subCode] ||
    (subCode === 'MATH' ? entry.subjects['MATHS'] : subCode === 'MATHS' ? entry.subjects['MATH'] : undefined) ||
    (subCode === 'SCI' ? entry.subjects['SCIENCE'] : undefined) ||
    (subCode === 'SOC' ? entry.subjects['SOCIAL'] || entry.subjects['SOCIAL SCIENCE'] : undefined);

  if (!sub) return false;

  const valRaw = (sub as any)[examKey];
  const pctRaw = (sub as any)[`${examKey}_pct`];

  // Must be non-empty, valid entered score > 0
  const hasDirect = valRaw !== null && valRaw !== undefined && valRaw !== '' && !isNaN(Number(valRaw)) && Number(valRaw) > 0;
  const hasPct = pctRaw !== null && pctRaw !== undefined && pctRaw !== '' && !isNaN(Number(pctRaw)) && Number(pctRaw) > 0;

  return hasDirect || hasPct;
};

/**
 * Accurately calculate CCE Progress for a single class standard
 * Weighted aggregation based on required entries
 */
export const calculateSingleClassProgress = (
  classStandard: StudentClass,
  students: Student[],
  marksMap: Record<string, StudentExamMarks>,
  schoolMedium: SchoolMedium = 'Kannada',
  activeExamOverride?: CceExamKey
): ClassCceProgress => {
  const currentExamInfo = getCurrentScheduledExam();
  const currentExam = activeExamOverride || currentExamInfo.exam;
  const classStudents = students.filter((s) => s.classStandard === classStandard);
  const totalStudents = classStudents.length;

  // Filter eligible students respecting CWSN exemptions
  const eligibleStudents = classStudents.filter((st) => {
    const isMarksAllowed = st.cwsnStatus === 'MARKS_ALLOWED' || st.cwsnStatus === 'YES_MARKS';
    if (isMarksAllowed) return true;
    return !isCwsnExempted(st.cwsnStatus);
  });
  const eligibleCount = eligibleStudents.length;
  const exemptedCount = totalStudents - eligibleCount;

  const subjects = getSubjectsForClassAndMedium(classStandard, schoolMedium);

  // Per-Exam statistics across all subjects
  const examProgress: Record<CceExamKey, { totalRequired: number; completed: number; pending: number; percent: number | null; display: string }> = {
    fa1: { totalRequired: 0, completed: 0, pending: 0, percent: null, display: 'N/A' },
    fa2: { totalRequired: 0, completed: 0, pending: 0, percent: null, display: 'N/A' },
    sa1: { totalRequired: 0, completed: 0, pending: 0, percent: null, display: 'N/A' },
    fa3: { totalRequired: 0, completed: 0, pending: 0, percent: null, display: 'N/A' },
    fa4: { totalRequired: 0, completed: 0, pending: 0, percent: null, display: 'N/A' },
    sa2: { totalRequired: 0, completed: 0, pending: 0, percent: null, display: 'N/A' },
  };

  const subjectTableRows: SubjectProgressItem[] = [];

  CCE_EXAMS.forEach((ex) => {
    const exKey = ex.key;
    let exTotalRequired = 0;
    let exCompleted = 0;

    subjects.forEach((sub) => {
      const requiredForSubject = eligibleCount; // 1 entry per eligible student per subject
      let completedForSubject = 0;

      eligibleStudents.forEach((st) => {
        const entry = marksMap[st.id];
        if (isSubjectExamCompleted(entry, sub.code, exKey)) {
          completedForSubject++;
        }
      });

      const pendingForSubject = Math.max(0, requiredForSubject - completedForSubject);
      const percentForSubject = requiredForSubject > 0
        ? Math.min(100, Math.round((completedForSubject / requiredForSubject) * 100))
        : null;

      subjectTableRows.push({
        subjectCode: sub.code,
        subjectNameEn: sub.nameEn,
        subjectNameKn: sub.nameKn,
        exam: exKey,
        examLabel: ex.labelEn,
        totalStudents,
        eligibleStudents: eligibleCount,
        completedEntries: completedForSubject,
        pendingEntries: pendingForSubject,
        progressPercent: percentForSubject,
        progressPercentDisplay: percentForSubject !== null ? `${percentForSubject}%` : 'N/A',
      });

      exTotalRequired += requiredForSubject;
      exCompleted += completedForSubject;
    });

    const exPending = Math.max(0, exTotalRequired - exCompleted);
    const exPercent = exTotalRequired > 0
      ? Math.min(100, Math.round((exCompleted / exTotalRequired) * 100))
      : null;

    examProgress[exKey] = {
      totalRequired: exTotalRequired,
      completed: exCompleted,
      pending: exPending,
      percent: exPercent,
      display: exPercent !== null ? `${exPercent}%` : 'N/A',
    };
  });

  // Calculate Overall Class Progress across all exams and subjects (Weighted)
  let totalClassRequired = 0;
  let totalClassCompleted = 0;
  Object.values(examProgress).forEach((ep) => {
    totalClassRequired += ep.totalRequired;
    totalClassCompleted += ep.completed;
  });

  const overallClassPercent = totalClassRequired > 0
    ? Math.min(100, Math.round((totalClassCompleted / totalClassRequired) * 100))
    : null;

  return {
    classStandard,
    className: `Class ${classStandard}`,
    totalStudents,
    eligibleStudents: eligibleCount,
    exemptedStudents: exemptedCount,
    currentExam,
    currentExamLabel: CCE_EXAMS.find((e) => e.key === currentExam)?.labelEn || 'FA-1',
    overallClassPercent,
    overallClassPercentDisplay: overallClassPercent !== null ? `${overallClassPercent}%` : 'N/A',
    totalClassRequired,
    totalClassCompleted,
    examProgress,
    subjectTableRows,
  };
};

/**
 * Calculates complete School-Wide CCE Monitoring Summary
 * Uses exact weighted formula:
 * Overall school progress = total completed entries across applicable classes & subjects ÷ total required entries × 100
 */
export const calculateSchoolCceMonitoringSummary = (
  students: Student[],
  marksMap: Record<string, StudentExamMarks>,
  configuredClasses: StudentClass[],
  schoolMedium: SchoolMedium = 'Kannada',
  schoolName: string = 'Karnataka Government School',
  diseCode: string = '',
  academicYear: string = '2026-27',
  activeExamOverride?: CceExamKey
): SchoolCceMonitoringSummary => {
  const currentExamInfo = getCurrentScheduledExam();
  const currentExam = activeExamOverride || currentExamInfo.exam;
  const examLabel = CCE_EXAMS.find((e) => e.key === currentExam)?.labelEn || 'FA-1';

  let totalSchoolRequired = 0;
  let totalSchoolCompleted = 0;

  const classSummaries = configuredClasses.map((cls) => {
    const summary = calculateSingleClassProgress(cls, students, marksMap, schoolMedium, currentExam);
    // For overall school progress, aggregate completed & required for the active/scheduled examination
    const activeEp = summary.examProgress[currentExam];
    totalSchoolRequired += activeEp.totalRequired;
    totalSchoolCompleted += activeEp.completed;
    return summary;
  });

  const totalSchoolPending = Math.max(0, totalSchoolRequired - totalSchoolCompleted);
  const overallSchoolPercent = totalSchoolRequired > 0
    ? Math.min(100, Math.round((totalSchoolCompleted / totalSchoolRequired) * 100))
    : null;

  // Identify class/subject combinations below 50% for current examination
  const lowProgressAlerts: {
    classStandard: StudentClass;
    subjectName: string;
    exam: CceExamKey;
    examLabel: string;
    percent: number;
    completed: number;
    required: number;
  }[] = [];

  classSummaries.forEach((clsSummary) => {
    // Only check if class has eligible students
    if (clsSummary.eligibleStudents === 0) return;

    // Check subject rows for the current exam
    const rowsForExam = clsSummary.subjectTableRows.filter((r) => r.exam === currentExam);
    rowsForExam.forEach((row) => {
      if (row.progressPercent !== null && row.progressPercent < 50) {
        lowProgressAlerts.push({
          classStandard: clsSummary.classStandard,
          subjectName: row.subjectNameEn,
          exam: currentExam,
          examLabel,
          percent: row.progressPercent,
          completed: row.completedEntries,
          required: row.eligibleStudents,
        });
      }
    });
  });

  // Sort lowest progress first
  lowProgressAlerts.sort((a, b) => a.percent - b.percent);

  // Generate dynamic news bulletin
  let bulletinText = '';
  if (students.length === 0) {
    bulletinText = 'CCE progress data is not yet available.';
  } else if (lowProgressAlerts.length > 0) {
    const alertSnippets = lowProgressAlerts
      .slice(0, 8)
      .map((item) => `Class ${item.classStandard} – ${item.subjectName} ${item.examLabel} ${item.percent}% complete`)
      .join('  |  ');
    bulletinText = `CCE PROGRESS ALERT: ${alertSnippets}`;
  } else if (overallSchoolPercent !== null && overallSchoolPercent >= 50) {
    bulletinText = `✓ CCE PROGRESS UPDATE: All configured classes have achieved over 50% completion for ${examLabel}! Excellent academic progress.`;
  } else {
    bulletinText = `CCE Progress Monitoring active for Academic Year ${academicYear} • Current Exam: ${examLabel} (${currentExamInfo.windowDescription}).`;
  }

  return {
    schoolName,
    diseCode,
    academicYear,
    currentExam,
    currentExamLabel: examLabel,
    examWindowDescription: currentExamInfo.windowDescription,
    totalStudentsAcrossSchool: students.length,
    totalRequiredEntries: totalSchoolRequired,
    totalCompletedEntries: totalSchoolCompleted,
    totalPendingEntries: totalSchoolPending,
    overallSchoolPercent,
    overallSchoolPercentDisplay: overallSchoolPercent !== null ? `${overallSchoolPercent}%` : 'N/A',
    classSummaries,
    lowProgressAlerts,
    bulletinText,
  };
};
