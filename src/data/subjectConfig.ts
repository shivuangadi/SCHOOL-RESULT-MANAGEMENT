/**
 * Karnataka State CCE Subject Matrix by Medium and Class Standard
 * Designed according to Department of State Educational Research and Training (DSERT)
 * and Karnataka School Examination and Assessment Board (KSEAB) guidelines.
 *
 * EXAM PATTERN SPECIFICATIONS (Specified by Shri S R Angadi):
 * 1. Class 1 - 5 CCE Pattern:
 *    Term 1: FA1 (15) + FA2 (15) + SA1 (20) = 50 marks
 *    Term 2: FA3 (15) + FA4 (15) + SA2 (20) = 50 marks
 *    Total per subject = 100 marks
 *    - Kannada & English Medium: 4 subjects x 100 = 400 marks
 *    - Marathi & Urdu Medium: 5 subjects x 100 = 500 marks
 *
 * 2. Class 6 - 8 CCE Pattern:
 *    Term 1: FA1 (10) + FA2 (10) + SA1 (30) = 50 marks
 *    Term 2: FA3 (10) + FA4 (10) + SA2 (30) = 50 marks
 *    Total per subject = 100 marks
 *    - All mediums: 7 subjects x 100 = 700 marks
 *
 * 3. Class 9 & 10 High School CCE Pattern:
 *    - First Language (FL): 125 MARKS MAXIMUM
 *      Term 1: FA1 (12.5) + FA2 (12.5) + SA1 (37.5) = 62.5 marks
 *      Term 2: FA3 (12.5) + FA4 (12.5) + SA2 (37.5) = 62.5 marks
 *      Total FL = 125 marks
 *    - Other 6 Subjects: (10 + 10 + 30) + (10 + 10 + 30) = 100 marks each
 *    - Total maximum marks = 125 + (6 x 100) = 725 MARKS MAXIMUM
 */

import { SchoolMedium, SubjectConfig } from '../types';

export interface CceExamPattern {
  fa1Max: number;
  fa2Max: number;
  sa1Max: number;
  term1Max: number;
  fa3Max: number;
  fa4Max: number;
  sa2Max: number;
  term2Max: number;
  totalMax: number;
  patternLabel: string;
}

export const getExamPatternForClassAndSubject = (
  classStandard: number,
  subjectCode: string
): CceExamPattern => {
  // 1. Class 1-5: (15+15+20) + (15+15+20) = 100
  if (classStandard <= 5) {
    return {
      fa1Max: 15,
      fa2Max: 15,
      sa1Max: 20,
      term1Max: 50,
      fa3Max: 15,
      fa4Max: 15,
      sa2Max: 20,
      term2Max: 50,
      totalMax: 100,
      patternLabel: '(15+15+20) + (15+15+20)',
    };
  }

  // 2. Class 9 & 10 First Language (FL): 125 Marks
  if ((classStandard === 9 || classStandard === 10) && subjectCode === 'FL') {
    return {
      fa1Max: 12.5,
      fa2Max: 12.5,
      sa1Max: 37.5,
      term1Max: 62.5,
      fa3Max: 12.5,
      fa4Max: 12.5,
      sa2Max: 37.5,
      term2Max: 62.5,
      totalMax: 125,
      patternLabel: '(12.5+12.5+37.5) + (12.5+12.5+37.5) = 125m',
    };
  }

  // 3. Class 6-10 Standard Subjects: (10+10+30) + (10+10+30) = 100
  return {
    fa1Max: 10,
    fa2Max: 10,
    sa1Max: 30,
    term1Max: 50,
    fa3Max: 10,
    fa4Max: 10,
    sa2Max: 30,
    term2Max: 50,
    totalMax: 100,
    patternLabel: '(10+10+30) + (10+10+30)',
  };
};

export const getSubjectsForMediumAndClass = (
  medium: SchoolMedium,
  classStandard: number
): SubjectConfig[] => {
  const isPrimary = classStandard <= 5; // Class 1 to 5
  const isHighSchool = classStandard === 9 || classStandard === 10; // Class 9 & 10
  const flMaxMarks = isHighSchool ? 125 : 100;

  if (medium === 'Kannada') {
    if (isPrimary) {
      // Class 1-5: 4 subjects (100 marks each = 400 marks total)
      // CCE Exam Pattern: (15+15+20) + (15+15+20)
      return [
        {
          code: 'FL',
          prefix: 'FL',
          subjectName: 'FL Kannada',
          kannadaName: 'ಪ್ರಥಮ ಭಾಷೆ ಕನ್ನಡ',
          maxMarks: 100,
        },
        {
          code: 'SL',
          prefix: 'SL',
          subjectName: 'SL English',
          kannadaName: 'ದ್ವಿತೀಯ ಭಾಷೆ ಇಂಗ್ಲಿಷ್',
          maxMarks: 100,
        },
        {
          code: 'MATH',
          prefix: '',
          subjectName: 'Math',
          kannadaName: 'ಗಣಿತ (Mathematics)',
          maxMarks: 100,
        },
        {
          code: 'EVS',
          prefix: '',
          subjectName: "EV's",
          kannadaName: 'ಪರಿಸರ ಅಧ್ಯಯನ (EVS)',
          maxMarks: 100,
        },
      ];
    } else {
      // Class 6-10: 7 subjects
      // Class 6-8: 700 marks total (all 100m each)
      // Class 9-10: 725 marks total (FL is 125m, other 6 are 100m)
      return [
        {
          code: 'FL',
          prefix: 'FL',
          subjectName: 'FL Kannada',
          kannadaName: 'ಪ್ರಥಮ ಭಾಷೆ ಕನ್ನಡ',
          maxMarks: flMaxMarks,
        },
        {
          code: 'SL',
          prefix: 'SL',
          subjectName: 'SL English',
          kannadaName: 'ದ್ವಿತೀಯ ಭಾಷೆ ಇಂಗ್ಲಿಷ್',
          maxMarks: 100,
        },
        {
          code: 'TL',
          prefix: 'TL',
          subjectName: 'TL Hindi',
          kannadaName: 'ತೃತೀಯ ಭಾಷೆ ಹಿಂದಿ',
          maxMarks: 100,
        },
        {
          code: 'MATH',
          prefix: '',
          subjectName: 'Math',
          kannadaName: 'ಗಣಿತ (Mathematics)',
          maxMarks: 100,
        },
        {
          code: 'SCI',
          prefix: '',
          subjectName: 'Science',
          kannadaName: 'ವಿಜ್ಞಾನ (Science)',
          maxMarks: 100,
        },
        {
          code: 'SOC',
          prefix: '',
          subjectName: 'Social Science',
          kannadaName: 'ಸಮಾಜ ವಿಜ್ಞಾನ',
          maxMarks: 100,
        },
        {
          code: 'VPE',
          prefix: '',
          subjectName: 'Value & Physical Education',
          kannadaName: 'ಮೌಲ್ಯ ಮತ್ತು ದೈಹಿಕ ಶಿಕ್ಷಣ',
          maxMarks: 100,
        },
      ];
    }
  }

  if (medium === 'English') {
    if (isPrimary) {
      // Class 1-5: 4 subjects (100 marks each = 400 marks total)
      // CCE Exam Pattern: (15+15+20) + (15+15+20)
      return [
        {
          code: 'FL',
          prefix: 'FL',
          subjectName: 'FL English',
          kannadaName: 'ಪ್ರಥಮ ಭಾಷೆ ಇಂಗ್ಲಿಷ್',
          maxMarks: 100,
        },
        {
          code: 'SL',
          prefix: 'SL',
          subjectName: 'SL Kannada',
          kannadaName: 'ದ್ವಿತೀಯ ಭಾಷೆ ಕನ್ನಡ',
          maxMarks: 100,
        },
        {
          code: 'MATH',
          prefix: '',
          subjectName: 'Math',
          kannadaName: 'Mathematics (ಗಣಿತ)',
          maxMarks: 100,
        },
        {
          code: 'EVS',
          prefix: '',
          subjectName: "EV's",
          kannadaName: 'EVS (ಪರಿಸರ ಅಧ್ಯಯನ)',
          maxMarks: 100,
        },
      ];
    } else {
      // Class 6-10: 7 subjects
      // Class 6-8: 700 marks total
      // Class 9-10: 725 marks total (FL is 125m)
      return [
        {
          code: 'FL',
          prefix: 'FL',
          subjectName: 'FL English',
          kannadaName: 'ಪ್ರಥಮ ಭಾಷೆ ಇಂಗ್ಲಿಷ್',
          maxMarks: flMaxMarks,
        },
        {
          code: 'SL',
          prefix: 'SL',
          subjectName: 'SL Kannada',
          kannadaName: 'ದ್ವಿತೀಯ ಭಾಷೆ ಕನ್ನಡ',
          maxMarks: 100,
        },
        {
          code: 'TL',
          prefix: 'TL',
          subjectName: 'TL Hindi',
          kannadaName: 'ತೃತೀಯ ಭಾಷೆ ಹಿಂದಿ',
          maxMarks: 100,
        },
        {
          code: 'MATH',
          prefix: '',
          subjectName: 'Math',
          kannadaName: 'Mathematics (ಗಣಿತ)',
          maxMarks: 100,
        },
        {
          code: 'SCI',
          prefix: '',
          subjectName: 'Science',
          kannadaName: 'Science (ವಿಜ್ಞಾನ)',
          maxMarks: 100,
        },
        {
          code: 'SOC',
          prefix: '',
          subjectName: 'Social Science',
          kannadaName: 'Social Science (ಸಮಾಜ)',
          maxMarks: 100,
        },
        {
          code: 'VPE',
          prefix: '',
          subjectName: 'Value & Physical Education',
          kannadaName: 'ಮೌಲ್ಯ ಮತ್ತು ದೈಹಿಕ ಶಿಕ್ಷಣ',
          maxMarks: 100,
        },
      ];
    }
  }

  if (medium === 'Marathi') {
    if (isPrimary) {
      // Class 1-5: 5 subjects (100 marks each = 500 marks total)
      // CCE Exam Pattern: (15+15+20) + (15+15+20)
      return [
        {
          code: 'FL',
          prefix: 'FL',
          subjectName: 'FL Marathi',
          kannadaName: 'ಪ್ರಥಮ ಭಾಷೆ ಮರಾಠಿ (मराठी)',
          maxMarks: 100,
        },
        {
          code: 'SL',
          prefix: 'SL',
          subjectName: 'SL Kannada',
          kannadaName: 'ದ್ವಿತೀಯ ಭಾಷೆ ಕನ್ನಡ',
          maxMarks: 100,
        },
        {
          code: 'TL',
          prefix: 'TL',
          subjectName: 'TL English',
          kannadaName: 'ತೃತೀಯ ಭಾಷೆ ಇಂಗ್ಲಿಷ್',
          maxMarks: 100,
        },
        {
          code: 'MATH',
          prefix: '',
          subjectName: 'Math',
          kannadaName: 'ಗಣಿತ (गणित)',
          maxMarks: 100,
        },
        {
          code: 'EVS',
          prefix: '',
          subjectName: "EV's",
          kannadaName: 'ಪರಿಸರ ಅಧ್ಯಯನ (परिसर अभ्यास)',
          maxMarks: 100,
        },
      ];
    } else {
      // Class 6-10: 7 subjects
      // Class 6-8: 700 marks total
      // Class 9-10: 725 marks total (FL is 125m)
      return [
        {
          code: 'FL',
          prefix: 'FL',
          subjectName: 'FL Marathi',
          kannadaName: 'ಪ್ರಥಮ ಭಾಷೆ ಮರಾಠಿ (मराठी)',
          maxMarks: flMaxMarks,
        },
        {
          code: 'SL',
          prefix: 'SL',
          subjectName: 'SL Kannada',
          kannadaName: 'ದ್ವಿತೀಯ ಭಾಷೆ ಕನ್ನಡ',
          maxMarks: 100,
        },
        {
          code: 'TL',
          prefix: 'TL',
          subjectName: 'TL English',
          kannadaName: 'ತೃತೀಯ ಭಾಷೆ ಇಂಗ್ಲಿಷ್',
          maxMarks: 100,
        },
        {
          code: 'MATH',
          prefix: '',
          subjectName: 'Math',
          kannadaName: 'ಗಣಿತ (गणित)',
          maxMarks: 100,
        },
        {
          code: 'SCI',
          prefix: '',
          subjectName: 'Science',
          kannadaName: 'ವಿಜ್ಞಾನ (विज्ञान)',
          maxMarks: 100,
        },
        {
          code: 'SOC',
          prefix: '',
          subjectName: 'Social Science',
          kannadaName: 'ಸಮಾಜ ವಿಜ್ಞಾನ (समाजशास्त्र)',
          maxMarks: 100,
        },
        {
          code: 'VPE',
          prefix: '',
          subjectName: 'Value & Physical Education',
          kannadaName: 'ಮೌಲ್ಯ ಮತ್ತು ದೈಹಿಕ ಶಿಕ್ಷಣ',
          maxMarks: 100,
        },
      ];
    }
  }

  // Urdu Medium
  if (isPrimary) {
    // Class 1-5: 5 subjects (100 marks each = 500 marks total)
    // CCE Exam Pattern: (15+15+20) + (15+15+20)
    return [
      {
        code: 'FL',
        prefix: 'FL',
        subjectName: 'FL Urdu',
        kannadaName: 'ಪ್ರಥಮ ಭಾಷೆ ಉರ್ದು (اردو)',
        maxMarks: 100,
      },
      {
        code: 'SL',
        prefix: 'SL',
        subjectName: 'SL Kannada',
        kannadaName: 'ದ್ವಿತೀಯ ಭಾಷೆ ಕನ್ನಡ',
        maxMarks: 100,
      },
      {
        code: 'TL',
        prefix: 'TL',
        subjectName: 'TL English',
        kannadaName: 'ತೃತೀಯ ಭಾಷೆ ಇಂಗ್ಲಿಷ್',
        maxMarks: 100,
      },
      {
        code: 'MATH',
        prefix: '',
        subjectName: 'Math',
        kannadaName: 'ಗಣಿತ (ریاضی)',
        maxMarks: 100,
      },
      {
        code: 'EVS',
        prefix: '',
        subjectName: "EV's",
        kannadaName: 'ಪರಿಸರ ಅಧ್ಯಯನ (EVS)',
        maxMarks: 100,
      },
    ];
  } else {
    // Class 6-10: 7 subjects
    // Class 6-8: 700 marks total
    // Class 9-10: 725 marks total (FL is 125m)
    return [
      {
        code: 'FL',
        prefix: 'FL',
        subjectName: 'FL Urdu',
        kannadaName: 'ಪ್ರಥಮ ಭಾಷೆ ಉರ್ದು (اردو)',
        maxMarks: flMaxMarks,
      },
      {
        code: 'SL',
        prefix: 'SL',
        subjectName: 'SL Kannada',
        kannadaName: 'ದ್ವಿತೀಯ ಭಾಷೆ ಕನ್ನಡ',
        maxMarks: 100,
      },
      {
        code: 'TL',
        prefix: 'TL',
        subjectName: 'TL English',
        kannadaName: 'ತೃತೀಯ ಭಾಷೆ ಇಂಗ್ಲಿಷ್',
        maxMarks: 100,
      },
      {
        code: 'MATH',
        prefix: '',
        subjectName: 'Math',
        kannadaName: 'ಗಣಿತ (ریاضی)',
        maxMarks: 100,
      },
      {
        code: 'SCI',
        prefix: '',
        subjectName: 'Science',
        kannadaName: 'ವಿಜ್ಞಾನ (سائنس)',
        maxMarks: 100,
      },
      {
        code: 'SOC',
        prefix: '',
        subjectName: 'Social Science',
        kannadaName: 'ಸಮಾಜ ವಿಜ್ಞಾನ (سماجی علوم)',
        maxMarks: 100,
      },
      {
        code: 'VPE',
        prefix: '',
        subjectName: 'Value & Physical Education',
        kannadaName: 'ಮೌಲ್ಯ ಮತ್ತು ದೈಹಿಕ ಶಿಕ್ಷಣ',
        maxMarks: 100,
      },
    ];
  }
};

export const getMaxMarksForMediumAndClass = (
  medium: SchoolMedium,
  classStandard: number
): number => {
  const isPrimary = classStandard <= 5;
  if (isPrimary) {
    if (medium === 'Kannada' || medium === 'English') {
      return 400; // 4 subjects * 100
    }
    return 500; // Marathi or Urdu: 5 subjects * 100
  }

  // Class 9 & 10: FL is 125 marks + 6 subjects x 100 marks = 725 marks total!
  if (classStandard === 9 || classStandard === 10) {
    return 725;
  }

  // Class 6 to 8: 7 subjects * 100 = 700 marks total
  return 700;
};

export const getSubjectCountForMediumAndClass = (
  medium: SchoolMedium,
  classStandard: number
): number => {
  const isPrimary = classStandard <= 5;
  if (isPrimary) {
    if (medium === 'Kannada' || medium === 'English') {
      return 4;
    }
    return 5;
  }
  return 7;
};
