/**
 * Karnataka SATS (Student Achievement Tracking System) Excel Parser
 * Parses downloaded SATS master student sheets (.xlsx, .xls, .csv)
 * and maps all students into their respective classes (Class 1 to 10).
 */

import * as XLSX from 'xlsx';
import { Student, StudentClass, StudentDivision, StudentReligion, StudentCaste, CwsnStatus } from '../types';

export interface ParseResult {
  students: Student[];
  errors: string[];
  classCounts: Record<StudentClass, number>;
  totalFound: number;
}

const normalizeHeader = (header: any): string => {
  if (!header) return '';
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0C80-\u0CFF]/g, '');
};

export const normalizeClass = (val: any): StudentClass | null => {
  if (val === null || val === undefined) return null;
  let str = String(val).trim().toUpperCase();
  if (!str) return null;

  // 1. Explicit Pre-Primary exclusion: LKG, UKG, KG1, KG2, PP1, PP2, Nursery, etc.
  if (
    /\b(LKG|UKG|KG-?1|KG-?2|PP-?1|PP-?2|PRE-?PRIMARY|PRE-?KG|NURSERY|PLAY\s*GROUP|MONTESSORI|BALAVATIKA|ಬಾಲವಾಟಿಕ)\b/i.test(str) ||
    str.includes('LKG') ||
    str.includes('UKG') ||
    str.includes('KG1') ||
    str.includes('KG2') ||
    str.includes('PP1') ||
    str.includes('PP2') ||
    str.includes('NURSERY')
  ) {
    return null;
  }

  // Remove common prefixes
  str = str.replace(/^(CLASS|STD|STANDARD|GRADE|ತರಗತಿ|ವರ್ಗ)[\s.:_-]*/i, '').trim();

  // Handle Kannada numerals: ೧-೧೦
  const kannadaMap: Record<string, StudentClass> = {
    '೧೦': '10', '೧': '1', '೨': '2', '೩': '3', '೪': '4',
    '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9'
  };
  for (const [knNum, mappedClass] of Object.entries(kannadaMap)) {
    if (str.startsWith(knNum) || str === knNum) {
      return mappedClass;
    }
  }

  // Kannada words: 1ನೇ to 10ನೇ
  if (str.includes('ಹತ್ತ') || str.includes('10ನೇ')) return '10';
  if (str.includes('ಒಂಬತ್ತ') || str.includes('9ನೇ')) return '9';
  if (str.includes('ಎಂಟ') || str.includes('8ನೇ')) return '8';
  if (str.includes('ಏಳ') || str.includes('7ನೇ')) return '7';
  if (str.includes('ಆರ') || str.includes('6ನೇ')) return '6';
  if (str.includes('ಐದ') || str.includes('5ನೇ')) return '5';
  if (str.includes('ನಾಲ್ಕ') || str.includes('4ನೇ')) return '4';
  if (str.includes('ಮೂರ') || str.includes('3ನೇ')) return '3';
  if (str.includes('ಎರಡ') || str.includes('2ನೇ')) return '2';
  if (str.includes('ಒಂದ') || str.includes('1ನೇ')) return '1';

  // Check 10 / X first to avoid matching 1 inside 10!
  if (
    str === '10' || str === '010' || str.startsWith('10TH') || str.startsWith('10 TH') ||
    str.startsWith('10-') || str.startsWith('10 ') || str.startsWith('10/') ||
    str === 'X' || str.startsWith('X-') || str.startsWith('X ') || str.startsWith('X/') ||
    str === 'XTH' || str === 'TENTH'
  ) {
    return '10';
  }

  // Roman numerals / standard Arabic digits with boundaries or sections (e.g. "VI A", "6th", "06", "6")
  if (/^(VIII|8TH|8|08)(\b|\s|[-_/]|$)/i.test(str)) return '8';
  if (/^(VII|7TH|7|07)(\b|\s|[-_/]|$)/i.test(str)) return '7';
  if (/^(VI|6TH|6|06)(\b|\s|[-_/]|$)/i.test(str)) return '6';
  if (/^(IX|9TH|9|09)(\b|\s|[-_/]|$)/i.test(str)) return '9';
  if (/^(IV|4TH|4|04)(\b|\s|[-_/]|$)/i.test(str)) return '4';
  if (/^(V|5TH|5|05)(\b|\s|[-_/]|$)/i.test(str)) return '5';
  if (/^(III|3RD|3|03)(\b|\s|[-_/]|$)/i.test(str)) return '3';
  if (/^(II|2ND|2|02)(\b|\s|[-_/]|$)/i.test(str)) return '2';
  if (/^(I|1ST|1|01)(\b|\s|[-_/]|$)/i.test(str)) return '1';

  // Standalone Roman numerals
  if (/^VIII\b/i.test(str)) return '8';
  if (/^VII\b/i.test(str)) return '7';
  if (/^VI\b/i.test(str)) return '6';
  if (/^IX\b/i.test(str)) return '9';
  if (/^IV\b/i.test(str)) return '4';
  if (/^V\b/i.test(str)) return '5';
  if (/^III\b/i.test(str)) return '3';
  if (/^II\b/i.test(str)) return '2';
  if (/^I\b/i.test(str)) return '1';
  if (/^X\b/i.test(str)) return '10';

  // Fallback: extract number 10 or 1-9 strictly with word boundary
  const m10 = str.match(/\b10\b/);
  if (m10) return '10';

  const mSingle = str.match(/\b([1-9])\b/);
  if (mSingle) return mSingle[1] as StudentClass;

  const mZero = str.match(/\b0([1-9])\b/);
  if (mZero) return mZero[1] as StudentClass;

  // Anything other than Roman numbers I-X and Arabic numbers 1-10 -> null (do NOT import)
  return null;
};

export const normalizeDivision = (val: any): StudentDivision => {
  if (!val) return 'A';
  const str = String(val).trim().toUpperCase();
  if (str.includes('B') || str.includes('ಬಿ')) return 'B';
  if (str.includes('C') || str.includes('ಸಿ')) return 'C';
  if (str.includes('D') || str.includes('ಡಿ')) return 'D';
  return 'A';
};

export const normalizeReligion = (val: any): StudentReligion => {
  if (!val) return 'Hindu';
  const str = String(val).trim().toLowerCase();
  if (str.includes('mus') || str.includes('islam') || str.includes('ಇಸ್ಲಾಂ') || str.includes('ಮುಸ್ಲಿಂ')) return 'Muslim';
  if (str.includes('chri') || str.includes('ಕ್ರೈಸ್ತ')) return 'Christian';
  if (str.includes('jain') || str.includes('ಜೈನ')) return 'Jain';
  if (str.includes('sikh') || str.includes('ಸಿಖ್')) return 'Sikh';
  if (str.includes('bud') || str.includes('ಬೌದ್ಧ')) return 'Buddhist';
  if (str.includes('hin') || str.includes('ಹಿಂದೂ')) return 'Hindu';
  return 'Other';
};

export const isValidSatsNo = (val: any): boolean => {
  if (val === null || val === undefined) return false;
  const str = String(val).trim().toUpperCase();
  if (!str) return false;
  // Common placeholders for missing/unassigned SATS in Karnataka schools
  if (
    str === 'N/A' ||
    str === 'NA' ||
    str === 'NIL' ||
    str === 'NONE' ||
    str === 'NULL' ||
    str === '-' ||
    str === '--' ||
    str === '---' ||
    str === '0' ||
    str === '00' ||
    str === 'PENDING' ||
    str === 'TBD' ||
    str === 'NOT ASSIGNED' ||
    str === 'NOT APPLICABLE' ||
    str === '?' ||
    str === '.'
  ) {
    return false;
  }
  const clean = str.replace(/[^A-Z0-9]/gi, '');
  if (clean.length < 5) return false; // Genuine SATS ID in Karnataka is at least 5 to 10 digits
  if (/^0+$/.test(clean)) return false; // e.g. "00000000"
  return true;
};

/**
 * Enhanced Karnataka SATS Caste & Category Recognition
 * Recognizes SC, ST, Cat-1, 2A, 2B, 3A, 3B, GM, OBC, MUSLIM, GENERAL, OTHERS, CUSTOM
 * along with specific community names placed in customCaste.
 */
export interface RecognizedCaste {
  caste: StudentCaste;
  customCaste?: string;
  religion?: StudentReligion;
}

export const recognizeCasteAndCategory = (
  rawCategoryVal: any,
  rawCasteVal: any,
  rawReligionVal?: any
): RecognizedCaste => {
  const catStr = cleanString(rawCategoryVal).toUpperCase();
  const cstStr = cleanString(rawCasteVal).toUpperCase();
  const combined = `${catStr} ${cstStr}`.trim();

  let recognizedCaste: StudentCaste = 'GENERAL';
  let customCaste: string | undefined = cleanString(rawCasteVal) || undefined;
  let recognizedRel: StudentReligion | undefined = rawReligionVal ? normalizeReligion(rawReligionVal) : undefined;

  // Clean specific prefixes like "HINDU - ", "HINDU ", etc. from customCaste
  if (customCaste) {
    customCaste = customCaste
      .replace(/^HINDU[\s\-:]+/i, '')
      .replace(/^MUSLIM[\s\-:]+/i, '')
      .replace(/^CHRISTIAN[\s\-:]+/i, '')
      .replace(/\s*\((?:SC|ST|CAT-?1|2A|2B|3A|3B|GM|OBC|GENERAL)\)/gi, '')
      .replace(/\s*-\s*(?:SC|ST|CAT-?1|2A|2B|3A|3B|GM|OBC|GENERAL)$/gi, '')
      .trim();
    if (!customCaste) customCaste = undefined;
  }

  // 1. Direct Category Matching (Karnataka 8-fold reservation matrix)
  // Check category column first, then combined
  const checkStr = catStr || combined;

  if (
    /\b(SC|S\.C\.)\b/i.test(checkStr) ||
    checkStr.includes('SCHEDULED CASTE') ||
    checkStr.includes('ಪರಿಶಿಷ್ಟ ಜಾತಿ') ||
    checkStr.includes('ಪ.ಜಾ') ||
    checkStr.includes('ಪಜಾ')
  ) {
    recognizedCaste = 'SC';
  } else if (
    /\b(ST|S\.T\.)\b/i.test(checkStr) ||
    checkStr.includes('SCHEDULED TRIBE') ||
    checkStr.includes('ಪರಿಶಿಷ್ಟ ಪಂಗಡ') ||
    checkStr.includes('ಪ.ಪಂ') ||
    checkStr.includes('ಪಪಂ')
  ) {
    recognizedCaste = 'ST';
  } else if (
    /\b(CAT-?1|CAT\s*1|CAT1|C-?1|C1|CATEGORY-?1|CATEGORY\s*1|CAT-?I)\b/i.test(checkStr) ||
    checkStr.includes('ಪ್ರವರ್ಗ-1') ||
    checkStr.includes('ಪ್ರವರ್ಗ 1') ||
    checkStr.includes('ಪ್ರವರ್ಗ-೧') ||
    checkStr.includes('ಪ್ರವರ್ಗ ೧') ||
    catStr === '1' ||
    catStr === 'I'
  ) {
    recognizedCaste = 'Cat-1';
  } else if (
    /\b(2A|2-A|2\s*A|IIA|II-A|CAT-?2A|CAT\s*2A|CATEGORY-?2A|CAT-?IIA)\b/i.test(checkStr) ||
    checkStr.includes('ಪ್ರವರ್ಗ-2A') ||
    checkStr.includes('ಪ್ರವರ್ಗ 2ಎ') ||
    checkStr.includes('ಪ್ರವರ್ಗ-2ಎ') ||
    checkStr.includes('ಪ್ರವರ್ಗ ೨ಎ') ||
    checkStr.includes('2 ಎ') ||
    checkStr.includes('೨ ಎ') ||
    checkStr.includes('2ಎ')
  ) {
    recognizedCaste = '2A';
  } else if (
    /\b(2B|2-B|2\s*B|IIB|II-B|CAT-?2B|CAT\s*2B|CATEGORY-?2B|CAT-?IIB)\b/i.test(checkStr) ||
    checkStr.includes('ಪ್ರವರ್ಗ-2B') ||
    checkStr.includes('ಪ್ರವರ್ಗ 2ಬಿ') ||
    checkStr.includes('ಪ್ರವರ್ಗ-2ಬಿ') ||
    checkStr.includes('ಪ್ರವರ್ಗ ೨ಬಿ') ||
    checkStr.includes('2 ಬಿ') ||
    checkStr.includes('೨ ಬಿ') ||
    checkStr.includes('2ಬಿ')
  ) {
    recognizedCaste = '2B';
    recognizedRel = 'Muslim';
  } else if (
    /\b(3A|3-A|3\s*A|IIIA|III-A|CAT-?3A|CAT\s*3A|CATEGORY-?3A|CAT-?IIIA)\b/i.test(checkStr) ||
    checkStr.includes('ಪ್ರವರ್ಗ-3A') ||
    checkStr.includes('ಪ್ರವರ್ಗ 3ಎ') ||
    checkStr.includes('ಪ್ರವರ್ಗ-3ಎ') ||
    checkStr.includes('ಪ್ರವರ್ಗ ೩ಎ') ||
    checkStr.includes('3 ಎ') ||
    checkStr.includes('೩ ಎ') ||
    checkStr.includes('3ಎ')
  ) {
    recognizedCaste = '3A';
  } else if (
    /\b(3B|3-B|3\s*B|IIIB|III-B|CAT-?3B|CAT\s*3B|CATEGORY-?3B|CAT-?IIIB)\b/i.test(checkStr) ||
    checkStr.includes('ಪ್ರವರ್ಗ-3B') ||
    checkStr.includes('ಪ್ರವರ್ಗ 3ಬಿ') ||
    checkStr.includes('ಪ್ರವರ್ಗ-3ಬಿ') ||
    checkStr.includes('ಪ್ರವರ್ಗ ೩ಬಿ') ||
    checkStr.includes('3 ಬಿ') ||
    checkStr.includes('೩ ಬಿ') ||
    checkStr.includes('3ಬಿ')
  ) {
    recognizedCaste = '3B';
  } else if (
    /\b(GM|G\.M\.|GENERAL\s*MERIT|GEN)\b/i.test(checkStr) ||
    checkStr.includes('ಸಾಮಾನ್ಯ')
  ) {
    recognizedCaste = 'GM';
  } else if (
    /\bOBC\b/i.test(checkStr) ||
    checkStr.includes('BACKWARD') ||
    checkStr.includes('ಹಿಂದುಳಿದ')
  ) {
    recognizedCaste = 'OBC';
  } else if (
    checkStr.includes('MUSLIM') ||
    checkStr.includes('ISLAM') ||
    checkStr.includes('ಮುಸ್ಲಿಂ') ||
    checkStr.includes('ಇಸ್ಲಾಂ')
  ) {
    recognizedCaste = '2B';
    recognizedRel = 'Muslim';
  }

  // 2. Specific Community Name Recognition (Auto-maps category if not already specific, and sets customCaste)
  const isGenericCategory = recognizedCaste === 'GENERAL' || recognizedCaste === 'GM' || recognizedCaste === 'OBC';

  // 2A Communities
  if (
    combined.includes('KURUBA') ||
    combined.includes('KURUBAR') ||
    combined.includes('ಕುರುಬ') ||
    combined.includes('EDIGA') ||
    combined.includes('IDIGA') ||
    combined.includes('ಈಡಿಗ') ||
    combined.includes('BILLAVA') ||
    combined.includes('ಬಿಲ್ಲವ') ||
    combined.includes('MADIVALA') ||
    combined.includes('ಮಡಿವಾಳ') ||
    combined.includes('AGASA') ||
    combined.includes('ಅಗಸ') ||
    combined.includes('DHOBI') ||
    combined.includes('SAVITA') ||
    combined.includes('SAVITHA') ||
    combined.includes('NAYINDA') ||
    combined.includes('ನಾಯಿಂದ') ||
    combined.includes('HADAPAD') ||
    combined.includes('ಹಡಪದ') ||
    combined.includes('BADIGER') ||
    combined.includes('ಬಡಿಗೇರ') ||
    combined.includes('VISHWAKARMA') ||
    combined.includes('ವಿಶ್ವಕರ್ಮ') ||
    combined.includes('KAMMAR') ||
    combined.includes('ಕಮ್ಮಾರ') ||
    combined.includes('KUMBARA') ||
    combined.includes('KULALA') ||
    combined.includes('ಕುಂಬಾರ') ||
    combined.includes('MARATHA') ||
    combined.includes('ಮರಾಠ') ||
    combined.includes('GANIGA') ||
    combined.includes('ಗಾಣಿಗ') ||
    combined.includes('DEVANGA') ||
    combined.includes('ದೇವಾಂಗ') ||
    combined.includes('NEYGI') ||
    combined.includes('BHAVASAR') ||
    combined.includes('DARJI') ||
    combined.includes('SIMPI') ||
    combined.includes('ಸಿಂಪಿ') ||
    combined.includes('ದರ್ಜಿ') ||
    combined.includes('RANGARE')
  ) {
    if (isGenericCategory) recognizedCaste = '2A';
  }
  // 3B Communities (Veerashaiva, Lingayat, etc.)
  else if (
    combined.includes('LINGAYAT') ||
    combined.includes('LINGAVANTA') ||
    combined.includes('VEERASHAIVA') ||
    combined.includes('ಲಿಂಗಾಯತ') ||
    combined.includes('ಲಿಂಗವಂತ') ||
    combined.includes('ವೀರಶೈವ') ||
    combined.includes('PANCHAMASALI') ||
    combined.includes('ಪಂಚಮಸಾಲಿ') ||
    combined.includes('BANJIGA') ||
    combined.includes('ಬಣಜಿಗ') ||
    combined.includes('JANGAM') ||
    combined.includes('JANGAMA') ||
    combined.includes('ಜಂಗಮ') ||
    combined.includes('SADAR') ||
    combined.includes('ಸಾದರ') ||
    combined.includes('KSHATRIYA') ||
    combined.includes('ಕ್ಷತ್ರಿಯ')
  ) {
    if (isGenericCategory) recognizedCaste = '3B';
  }
  // 3A Communities (Vokkaliga, Gowda, Reddy, etc.)
  else if (
    combined.includes('VOKKALIGA') ||
    combined.includes('OKKALIGA') ||
    combined.includes('GOWDA') ||
    combined.includes('ವೊಕ್ಕಲಿಗ') ||
    combined.includes('ಒಕ್ಕಲಿಗ') ||
    combined.includes('ಗೌಡ') ||
    combined.includes('REDDY') ||
    combined.includes('ರೆಡ್ಡಿ') ||
    combined.includes('BUNT') ||
    combined.includes('ಬಂಟ') ||
    combined.includes('KODAVA') ||
    combined.includes('ಕೊಡವ') ||
    combined.includes('KUNCHITIGA') ||
    combined.includes('ಕುಂಚಿಟಿಗ') ||
    combined.includes('BALIJA') ||
    combined.includes('NAIDU')
  ) {
    if (isGenericCategory) recognizedCaste = '3A';
  }
  // ST Communities (Valmiki, Nayaka, Bedar, etc.)
  else if (
    combined.includes('VALMIKI') ||
    combined.includes('BEDAR') ||
    combined.includes('BEDA') ||
    combined.includes('NAYAK') ||
    combined.includes('NAYAKA') ||
    combined.includes('NAIK') ||
    combined.includes('TALWAR') ||
    combined.includes('TALWARA') ||
    combined.includes('ವಾಲ್ಮೀಕಿ') ||
    combined.includes('ಬೇಡರ') ||
    combined.includes('ಬೇಡ') ||
    combined.includes('ನಾಯಕ') ||
    combined.includes('ತಳವಾರ') ||
    combined.includes('SOLIGA') ||
    combined.includes('ಸೋಲಿಗ') ||
    combined.includes('KADU KURUBA') ||
    combined.includes('JENU KURUBA') ||
    combined.includes('SIDDI') ||
    combined.includes('ಸಿದ್ಧಿ')
  ) {
    if (isGenericCategory) recognizedCaste = 'ST';
  }
  // SC Communities (Madiga, Holeya, Chalavadi, Banjara/Lamani, Bhovi, etc.)
  else if (
    combined.includes('MADAR') ||
    combined.includes('MADIGA') ||
    combined.includes('HOLEYA') ||
    combined.includes('CHALAVADI') ||
    combined.includes('CHALAVADI') ||
    combined.includes('ಮಾದಿಗ') ||
    combined.includes('ಹೊಲೆಯ') ||
    combined.includes('ಚಲವಾದಿ') ||
    combined.includes('LAMANI') ||
    combined.includes('LAMBANI') ||
    combined.includes('BANJARA') ||
    combined.includes('ಲಮಾಣಿ') ||
    combined.includes('ಬಂಜಾರ') ||
    combined.includes('BHOVI') ||
    combined.includes('BOVI') ||
    combined.includes('ಭೋವಿ') ||
    combined.includes('SAMAGAR') ||
    combined.includes('ಸಮಗಾರ') ||
    combined.includes('KORAMA') ||
    combined.includes('KORACHA') ||
    combined.includes('ಕೊರಮ') ||
    combined.includes('ಕೊರಚ') ||
    combined.includes('ADI KARNATAKA') ||
    combined.includes('ಆದಿ ಕರ್ನಾಟಕ') ||
    combined.includes('ADI DRAVIDA') ||
    combined.includes('MOCHI') ||
    combined.includes('DHOR')
  ) {
    if (isGenericCategory) recognizedCaste = 'SC';
  }
  // 2B Communities (Muslim, Pinjar, Nadaf, etc.)
  else if (
    combined.includes('PINJAR') ||
    combined.includes('PINJARA') ||
    combined.includes('NADAFF') ||
    combined.includes('NADAF') ||
    combined.includes('ಪಿಂಜಾರ') ||
    combined.includes('ನದಾಫ') ||
    combined.includes('MULLA') ||
    combined.includes('QURESHI') ||
    combined.includes('SHEIKH') ||
    combined.includes('SHAIKH') ||
    combined.includes('SHAIK') ||
    combined.includes('SYED') ||
    combined.includes('PATHAN') ||
    combined.includes('MUGHAL') ||
    combined.includes('MANSOORI')
  ) {
    recognizedCaste = '2B';
    recognizedRel = 'Muslim';
  }
  // Cat-1 Communities (Besta, Kabbaliga, Uppara, Golla, etc.)
  else if (
    combined.includes('BESTA') ||
    combined.includes('BESTHA') ||
    combined.includes('KABBALIGA') ||
    combined.includes('GANGAMATHA') ||
    combined.includes('ಬೆಸ್ತ') ||
    combined.includes('ಕಬ್ಬಲಿಗ') ||
    combined.includes('ಗಂಗಾಮತ') ||
    combined.includes('KOLI') ||
    combined.includes('MOGAVEERA') ||
    combined.includes('ಮೊಗವೀರ') ||
    combined.includes('UPPARA') ||
    combined.includes('ಉಪ್ಪಾರ') ||
    combined.includes('SUNAGARA') ||
    combined.includes('GOLLA') ||
    combined.includes('YADAV') ||
    combined.includes('ಗೊಲ್ಲ') ||
    combined.includes('ಯಾದವ') ||
    combined.includes('TIGALA') ||
    combined.includes('ತಿಗಳ') ||
    combined.includes('HELAVA') ||
    combined.includes('ಬುಡಗ ಜಂಗಮ')
  ) {
    if (isGenericCategory) recognizedCaste = 'Cat-1';
  }
  // GM Communities (Brahmin, Jain, etc.)
  else if (
    combined.includes('BRAHMIN') ||
    combined.includes('VIPRA') ||
    combined.includes('ಬ್ರಾಹ್ಮಣ') ||
    combined.includes('ವಿಪ್ರ') ||
    combined.includes('SMARTHA') ||
    combined.includes('MADHWA') ||
    combined.includes('HAVYAKA') ||
    combined.includes('SARASWAT') ||
    combined.includes('IYENGAR')
  ) {
    if (isGenericCategory) recognizedCaste = 'GM';
  }

  // If customCaste is identical to the recognized category string (e.g. "2A" or "SC"), omit it
  if (customCaste && (customCaste.toUpperCase() === recognizedCaste || customCaste.toUpperCase() === 'GENERAL')) {
    customCaste = undefined;
  }

  return {
    caste: recognizedCaste,
    customCaste: customCaste || undefined,
    religion: recognizedRel,
  };
};

export const normalizeCaste = (val: any): StudentCaste => {
  return recognizeCasteAndCategory(val, val).caste;
};

const normalizeGender = (val: any): 'Boy' | 'Girl' => {
  if (!val) return 'Boy';
  const str = String(val).trim().toLowerCase();
  if (
    str === 'girl' ||
    str === 'female' ||
    str === 'f' ||
    str === 'g' ||
    str === 'woman' ||
    str.includes('female') ||
    str.includes('girl') ||
    str.includes('ಹೆಣ್ಣು') ||
    str.includes('ಹೆಂ') ||
    str.includes('ಬಾಲಕಿ') ||
    str.startsWith('f')
  ) {
    return 'Girl';
  }
  return 'Boy';
};

const normalizeCwsn = (val: any): CwsnStatus => {
  if (!val) return 'NO';
  const str = String(val).trim().toLowerCase();
  if (str === 'no' || str === '0' || str === 'false' || str === 'none' || str === '-') return 'NO';
  if (str.includes('exempt') || str.includes('ವಿನಾಯಿತಿ') || str === 'yes_exempted') return 'EXEMPTED';
  if (str.includes('marks') || str.includes('allowed') || str.includes('ಅಂಕ') || str === 'yes_marks') return 'MARKS_ALLOWED';
  if (str === 'yes' || str === '1' || str === 'true' || str.includes('cwsn') || str.includes('ವಿಶೇಷ')) return 'EXEMPTED';
  return 'NO';
};

const cleanString = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val).trim();
};

const cleanNumberString = (val: any): string => {
  if (val === null || val === undefined) return '';
  // Avoid exponential notation like 1.29E+11
  if (typeof val === 'number') {
    return val.toLocaleString('fullwide', { useGrouping: false });
  }
  return String(val).trim().replace(/\s+/g, '');
};

export const formatDateToDmy = (val: any): string => {
  if (val === null || val === undefined || val === '') {
    return '';
  }
  // Safe Date object check (XLSX cellDates can return Invalid Date!)
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      const day = String(val.getDate()).padStart(2, '0');
      const month = String(val.getMonth() + 1).padStart(2, '0');
      let year = val.getFullYear();
      if (year > 2050 || year < 1950) {
        year = 2015;
      }
      return `${day}/${month}/${year}`;
    }
    return '';
  }
  // Excel Serial Number e.g. 42150 (days since Dec 30, 1899)
  if (typeof val === 'number' && !isNaN(val)) {
    if (val > 1000 && val < 70000) {
      try {
        const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (!isNaN(dateObj.getTime())) {
          const day = String(dateObj.getUTCDate()).padStart(2, '0');
          const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
          let year = dateObj.getUTCFullYear();
          if (year > 2050 || year < 1950) year = 2015;
          return `${day}/${month}/${year}`;
        }
      } catch (_) {}
    }
  }

  let str = String(val).trim();
  if (!str) return '';

  // Clean explicit 5-digit year anomalies e.g. 15/06/20110 -> 15/06/2011
  str = str.replace(/20110/g, '2011')
    .replace(/20111/g, '2011')
    .replace(/20112/g, '2012')
    .replace(/20113/g, '2013')
    .replace(/20114/g, '2014')
    .replace(/20115/g, '2015');

  // Handle DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (supports 4 or 5 digits for year)
  const dmyMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4,5})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let year = dmyMatch[3];
    if (year.length === 5) {
      year = year.slice(0, 4);
    }
    let yrNum = parseInt(year, 10);
    if (yrNum > 2050 || yrNum < 1950) yrNum = 2015;
    return `${day}/${month}/${yrNum}`;
  }

  // If YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD (supports 4 or 5 digits for year)
  const ymdMatch = str.match(/^(\d{4,5})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (ymdMatch) {
    let year = ymdMatch[1];
    if (year.length === 5) {
      year = year.slice(0, 4);
    }
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    let yrNum = parseInt(year, 10);
    if (yrNum > 2050 || yrNum < 1950) yrNum = 2015;
    return `${day}/${month}/${yrNum}`;
  }

  // Try standard Date.parse
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const day = String(parsed.getDate()).padStart(2, '0');
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      let year = parsed.getFullYear();
      if (year > 2050 || year < 1950) {
        year = 2015;
      }
      return `${day}/${month}/${year}`;
    }
  } catch (_) {}

  // Extra fallback: split by slash if 3 parts
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2].slice(0, 4);
      let yrNum = parseInt(year, 10);
      if (isNaN(yrNum) || yrNum > 2050 || yrNum < 1950) yrNum = 2015;
      return `${day}/${month}/${yrNum}`;
    }
  }

  return str;
};

export const parseStudentsFromJsonText = (
  text: string,
  schoolId: string,
  diseCode: string,
  academicYear: string = '2026-27'
): ParseResult => {
  const clean = text.trim().replace(/^\uFEFF/, '');
  let parsed: any;
  try {
    parsed = JSON.parse(clean);
  } catch (e: any) {
    throw new Error(`Invalid JSON format: ${e?.message || 'Syntax error in JSON file'}`);
  }

  let rawList: any[] = [];
  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed.data && Array.isArray(parsed.data.students)) {
    rawList = parsed.data.students;
  } else if (parsed.data && Array.isArray(parsed.data)) {
    rawList = parsed.data;
  } else if (Array.isArray(parsed.students)) {
    rawList = parsed.students;
  } else if (Array.isArray(parsed.activeStudents)) {
    rawList = parsed.activeStudents;
  } else if (Array.isArray(parsed.records)) {
    rawList = parsed.records;
  } else if (Array.isArray(parsed.studentList)) {
    rawList = parsed.studentList;
  } else if (parsed.data && typeof parsed.data.students === 'object') {
    rawList = Object.values(parsed.data.students);
  } else if (parsed.students && typeof parsed.students === 'object') {
    rawList = Object.values(parsed.students);
  }

  const students: Student[] = [];
  const errors: string[] = [];
  const classCounts: Record<StudentClass, number> = {
    '1': 0, '2': 0, '3': 0, '4': 0, '5': 0,
    '6': 0, '7': 0, '8': 0, '9': 0, '10': 0,
  };

  rawList.forEach((item, idx) => {
    if (!item || typeof item !== 'object') return;
    const name = String(item.studentName || item.name || '').trim();
    if (!name) return;

    const stdClass = normalizeClass(item.classStandard || item.class || item.std);
    if (!stdClass) return; // Skip non-Roman / non-Arabic / pre-primary (LKG/UKG/PP1/PP2/etc.)

    const division = normalizeDivision(item.division || item.sec || 'A');
    const gender = normalizeGender(item.gender);

    const recognized = recognizeCasteAndCategory(
      item.category || item.socialCategory || item.social_category,
      item.caste || item.subCaste || item.customCaste,
      item.religion
    );
    const validSats = isValidSatsNo(item.satsNo || item.sats || item.satsNumber)
      ? String(item.satsNo || item.sats || item.satsNumber).trim()
      : '';

    const st: Student = {
      id: String(item.id || (validSats ? `std_${diseCode}_${validSats}` : `std_${diseCode}_c${stdClass}_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`)).replace(/[^a-zA-Z0-9_-]/g, '_'),
      schoolId: item.schoolId || schoolId || diseCode,
      diseCode: item.diseCode || diseCode,
      studentName: name,
      fatherName: item.fatherName || item.father || '-',
      motherName: item.motherName || item.mother || '-',
      originalStudentName: item.originalStudentName || name,
      originalFatherName: item.originalFatherName || item.fatherName || item.father || '-',
      originalMotherName: item.originalMotherName || item.motherName || item.mother || '-',
      studentNameKn: item.studentNameKn,
      fatherNameKn: item.fatherNameKn,
      motherNameKn: item.motherNameKn,
      namesLanguage: item.namesLanguage || 'en',
      classStandard: stdClass,
      division: division,
      satsNo: validSats || 'N/A',
      penNo: String(item.penNo || item.pen || '').trim() || 'N/A',
      aadharNo: String(item.aadharNo || item.aadhar || '').trim() || 'N/A',
      schoolRegNo: item.schoolRegNo || undefined,
      admissionDate: formatDateToDmy(item.admissionDate || '01/06/2025'),
      dob: (item.dob || item.dateOfBirth) ? formatDateToDmy(item.dob || item.dateOfBirth) : '',
      dateOfBirth: (item.dateOfBirth || item.dob) ? formatDateToDmy(item.dateOfBirth || item.dob) : '',
      religion: recognized.religion || normalizeReligion(item.religion),
      caste: recognized.caste,
      customCaste: recognized.customCaste || item.customCaste || undefined,
      gender: gender,
      mobile: item.mobile || item.contactNumber || undefined,
      contactNumber: item.contactNumber || item.mobile || undefined,
      cwsnStatus: item.cwsnStatus || 'NO',
      academicYear: item.academicYear || academicYear,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    students.push(st);
    if (classCounts[stdClass] !== undefined) {
      classCounts[stdClass]++;
    }
  });

  return {
    students,
    errors,
    classCounts,
    totalFound: students.length,
  };
};

export const parseSatsExcel = async (
  file: File,
  schoolId: string,
  diseCode: string,
  academicYear: string = '2026-27'
): Promise<ParseResult> => {
  // If file is JSON format, parse with high-speed JSON reader directly
  if (file.name.toLowerCase().endsWith('.json') || file.type.includes('json')) {
    const text = await file.text();
    return parseStudentsFromJsonText(text, schoolId, diseCode, academicYear);
  }

  let workbook: XLSX.WorkBook;
  try {
    const data = await file.arrayBuffer();
    // Fast array reading without slow cellDates timezone conversions
    workbook = XLSX.read(data, { type: 'array', cellDates: false, raw: false });
  } catch (readErr) {
    console.warn('Initial XLSX.read without cellDates failed, retrying raw:', readErr);
    try {
      const data = await file.arrayBuffer();
      // Check if it's actually JSON content
      const potentialText = new TextDecoder('utf-8').decode(data.slice(0, 100)).trim();
      if (potentialText.startsWith('{') || potentialText.startsWith('[')) {
        const fullText = new TextDecoder('utf-8').decode(data);
        return parseStudentsFromJsonText(fullText, schoolId, diseCode, academicYear);
      }
      workbook = XLSX.read(data, { type: 'array', raw: true });
    } catch (finalErr: any) {
      throw new Error(`Failed to read Excel file: ${finalErr?.message || 'Unsupported format'}`);
    }
  }

  const students: Student[] = [];
  const errors: string[] = [];
  const classCounts: Record<StudentClass, number> = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
    '6': 0,
    '7': 0,
    '8': 0,
    '9': 0,
    '10': 0,
  };

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert sheet to array of rows
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!rows || rows.length < 2) continue;

    // Detect fallback class from sheet name (e.g., "Class 5", "5th", "Class_8")
    const sheetClassFallback = normalizeClass(sheetName);

    // Step 1: Find header row (scan up to 35 rows for Karnataka SATS metadata banners)
    let headerRowIdx = -1;
    let headerMap: Record<string, number> = {};

    for (let r = 0; r < Math.min(35, rows.length); r++) {
      const row = rows[r];
      if (!row || !Array.isArray(row)) continue;

      const normRow = row.map(normalizeHeader);
      // Check if this row contains student name or sats indicators (English and Kannada)
      const hasName = normRow.some(
        (c) =>
          c.includes('studentname') ||
          c.includes('candidatename') ||
          c.includes('nameofstudent') ||
          c.includes('childname') ||
          c.includes('name') ||
          c.includes('ವಿದ್ಯಾರ್ಥಿ') ||
          c.includes('ಹೆಸರು')
      );
      const hasSatsOrClass = normRow.some(
        (c) =>
          c.includes('sats') ||
          c.includes('class') ||
          c.includes('std') ||
          c.includes('father') ||
          c.includes('admission') ||
          c.includes('ತರಗತಿ') ||
          c.includes('ತಂದೆ') ||
          c.includes('ದಾಖಲಾತಿ') ||
          c.includes('ಲಿಂಗ') ||
          c.includes('ಸ್ಯಾಟ್ಸ್')
      );

      if (hasName && hasSatsOrClass) {
        headerRowIdx = r;
        normRow.forEach((col, idx) => {
          if (col) headerMap[col] = idx;
        });
        break;
      }
    }

    // If no header found by keywords, assume row 0 is header
    if (headerRowIdx === -1 && rows.length > 1) {
      headerRowIdx = 0;
      rows[0].map(normalizeHeader).forEach((col, idx) => {
        if (col) headerMap[col] = idx;
      });
    }

    // Helper to find column index matching multiple patterns
    const findColIdx = (patterns: string[]): number => {
      for (const p of patterns) {
        for (const [key, idx] of Object.entries(headerMap)) {
          if (key === p || key.includes(p)) {
            return idx;
          }
        }
      }
      return -1;
    };

    const colStudentName = findColIdx([
      'studentname',
      'candidatename',
      'nameofstudent',
      'nameofcandidate',
      'childname',
      'student_name',
      'name',
      'student',
      'ವಿದ್ಯಾರ್ಥಿಯಹೆಸರು',
      'ವಿದ್ಯಾರ್ಥಿಹೆಸರು',
      'ಹೆಸರು',
    ]);
    const colMiddleName = findColIdx([
      'middlename',
      'middle',
      'studentmiddlename',
      'mname',
    ]);
    const colFatherName = findColIdx([
      'fathername',
      'fathersname',
      'father',
      'ತಂದೆಯಹೆಸರು',
      'ತಂದೆಹೆಸರು',
      'ತಂದೆ',
    ]);
    const colMotherName = findColIdx([
      'mothername',
      'mothersname',
      'mother',
      'ತಾಯಿಯಹೆಸರು',
      'ತಾಯಿಹೆಸರು',
      'ತಾಯಿ',
    ]);
    const colClass = findColIdx([
      'classstandard',
      'admittedclass',
      'currentclass',
      'presentclass',
      'studyingclass',
      'enrolledclass',
      'standard',
      'class',
      'std',
      'ತರಗತಿ',
      'ವರ್ಗ',
      'ಹಾಲಿ',
    ]);
    const colDivision = findColIdx(['division', 'section', 'div', 'sec', 'ವಿಭಾಗ']);
    const colDob = findColIdx([
      'dob',
      'dateofbirth',
      'birthdate',
      'birth_date',
      'date_of_birth',
      'janmadinanka',
      'ಹುಟ್ಟಿದದಿನಾಂಕ',
      'ಜನ್ಮದಿನಾಂಕ',
      'ಹುಟ್ಟಿದ',
      'studentdob',
      'stddob',
      'dobddmmyyyy',
      'dateofbirthddmmyyyy',
      'birth',
    ]);
    const colSats = findColIdx([
      'satsno',
      'satsnumber',
      'satsid',
      'sats',
      'enrollmentno',
      'enrolmentno',
      'studentid',
      'student_id',
      'ಸ್ಯಾಟ್ಸ್',
      'ಸ್ಯಾಟ್ಸ್ನಂ',
    ]);
    const colPen = findColIdx(['penno', 'pennumber', 'pen']);
    const colAadhar = findColIdx(['aadharno', 'aadhaarno', 'aadharnumber', 'aadhaar', 'uid', 'aadhar', 'ಆಧಾರ್']);
    const colRegNo = findColIdx([
      'admissionno',
      'schoolregno',
      'regno',
      'admissionnumber',
      'registrationno',
      'ದಾಖಲಾತಿಸಂಖ್ಯೆ',
      'ದಾಖಲಾತಿ',
    ]);
    const colAdmDate = findColIdx(['admissiondate', 'doa', 'dateofadmission', 'ದಾಖಲಾತಿದಿನಾಂಕ']);
    const colReligion = findColIdx(['religion', 'ಧರ್ಮ']);
    const colCategory = findColIdx([
      'socialcategory',
      'category',
      'social_category',
      'castecategory',
      'socialgroup',
      'cat',
      'ಪ್ರವರ್ಗ',
      'ಸಾಮಾಜಿಕಪ್ರವರ್ಗ',
      'ಮೀಸಲಾತಿಪ್ರವರ್ಗ',
    ]);
    const colCaste = findColIdx([
      'subcaste',
      'castename',
      'caste_name',
      'caste',
      'community',
      'sub_caste',
      'ಜಾತಿ',
      'ಉಪಜಾತಿ',
    ]);
    const colGender = findColIdx(['gender', 'sex', 'linga', 'ಲಿಂಗ', 'studentgender', 'stdgender', 'gendermf', 'morf', 'genders']);
    const colCwsn = findColIdx(['cwsn', 'cwsnstatus', 'iscwsn', 'cwsntype', 'specialneeds', 'disability', 'ವಿಕಲಚೇತನ', 'ವಿಶೇಷಅಗತ್ಯ', 'ವಿನಾಯಿತಿ', 'handicapped']);

    // Step 2: Parse student rows
    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      try {
        const row = rows[r];
        if (!row || !Array.isArray(row)) continue;

        const rawName = colStudentName !== -1 ? cleanString(row[colStudentName]) : '';
        if (!rawName || rawName.length < 2) continue; // Skip empty rows

        let rawFather = colFatherName !== -1 ? cleanString(row[colFatherName]) : '';
        const rawMother = colMotherName !== -1 ? cleanString(row[colMotherName]) : '';
        const rawMiddle = colMiddleName !== -1 ? cleanString(row[colMiddleName]) : '';

        // Middle name fallback to father name
        let detectedMiddleName = rawMiddle;
        if (!detectedMiddleName) {
          const nameParts = rawName.split(/\s+/).filter(Boolean);
          if (nameParts.length >= 3) {
            detectedMiddleName = nameParts.slice(1, nameParts.length - 1).join(' ');
          }
        }

        if (detectedMiddleName && (!rawFather || rawFather.trim() === '' || rawFather === '-')) {
          rawFather = detectedMiddleName;
        }

        // Guaranteed class fallback to sheet name if cell is empty
        const rawClassVal = (colClass !== -1 && cleanString(row[colClass])) ? row[colClass] : sheetClassFallback;
        const classStandard = normalizeClass(rawClassVal || sheetClassFallback);
        // Exclude LKG, UKG, KG1, KG2, PP1, PP2 and anything other than Roman (I-X) and Arabic (1-10) numbers
        if (!classStandard) continue;

        const division = colDivision !== -1 ? normalizeDivision(row[colDivision]) : 'A';

        const rawSats = colSats !== -1 ? cleanNumberString(row[colSats]) : '';
        const validSats = isValidSatsNo(rawSats) ? rawSats : '';
        const penNo = colPen !== -1 ? cleanNumberString(row[colPen]) : '';
        const aadharNo = colAadhar !== -1 ? cleanNumberString(row[colAadhar]) : '';
        const schoolRegNo = colRegNo !== -1 ? cleanString(row[colRegNo]) : '';
        const admissionDate = colAdmDate !== -1 ? formatDateToDmy(row[colAdmDate]) || '01/06/2026' : '01/06/2026';

        // Format DOB in DD/MM/YYYY format (Leave blank if missing in Excel file)
        let formattedDob = '';
        if (colDob !== -1 && row[colDob]) {
          formattedDob = formatDateToDmy(row[colDob]);
        }

        const rawCategory = colCategory !== -1 ? row[colCategory] : '';
        const rawCaste = colCaste !== -1 ? row[colCaste] : '';
        const rawReligion = colReligion !== -1 ? row[colReligion] : '';

        const recognized = recognizeCasteAndCategory(rawCategory, rawCaste, rawReligion);
        const gender: 'Boy' | 'Girl' = colGender !== -1 ? normalizeGender(row[colGender]) : 'Boy';
        const cwsnStatus: CwsnStatus = colCwsn !== -1 ? normalizeCwsn(row[colCwsn]) : 'NO';

        const safeDise = (diseCode || schoolId || 'school').replace(/[^a-zA-Z0-9_-]/g, '_');
        // Only use valid SATS for deterministic ID; otherwise assign guaranteed collision-free ID
        const id = validSats
          ? `std_${safeDise}_${validSats.replace(/[^a-zA-Z0-9_-]/g, '_')}`
          : `std_${safeDise}_c${classStandard}_${Date.now()}_${r}_${Math.random().toString(36).substring(2, 8)}`;

        const student: Student = {
          id,
          schoolId,
          diseCode,
          studentName: rawName.toUpperCase(),
          fatherName: (rawFather || '-').toUpperCase(),
          motherName: (rawMother || '-').toUpperCase(),
          originalStudentName: rawName.toUpperCase(),
          originalFatherName: (rawFather || '-').toUpperCase(),
          originalMotherName: (rawMother || '-').toUpperCase(),
          namesLanguage: 'en',
          classStandard,
          division,
          satsNo: validSats || 'N/A',
          penNo: penNo || 'N/A',
          aadharNo: aadharNo || 'N/A',
          schoolRegNo: schoolRegNo || '',
          admissionDate,
          dob: formattedDob,
          dateOfBirth: formattedDob,
          religion: recognized.religion || normalizeReligion(rawReligion),
          caste: recognized.caste,
          customCaste: recognized.customCaste,
          gender,
          cwsnStatus,
          academicYear,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        students.push(student);
        classCounts[classStandard] = (classCounts[classStandard] || 0) + 1;
      } catch (rowErr) {
        console.warn('Error parsing Excel row:', rowErr);
      }
    }
  }

  return {
    students,
    errors,
    classCounts,
    totalFound: students.length,
  };
};

/**
 * Generates and downloads a sample Karnataka SATS format Excel file
 */
export const downloadSampleSatsExcel = () => {
  const sampleData = [
    {
      'SATS No': '1290384701',
      'PEN No': '20239014561',
      'Aadhar No': '384912048591',
      'Student Name': 'AARAV SURESH PATIL',
      'Father Name': 'SURESH PATIL',
      'Mother Name': 'SUNITA PATIL',
      'Class': 'Class 5',
      'Section': 'A',
      'Admission No': 'ADM/2024/01',
      'Admission Date': '2024-06-01',
      'Religion': 'Hindu',
      'Caste': 'OBC',
      'Gender': 'Boy',
    },
    {
      'SATS No': '1290384702',
      'PEN No': '20239014562',
      'Aadhar No': '491823940192',
      'Student Name': 'ANANYA RAGHAVENDRA KULKARNI',
      'Father Name': 'RAGHAVENDRA KULKARNI',
      'Mother Name': 'LAXMI KULKARNI',
      'Class': 'Class 5',
      'Section': 'A',
      'Admission No': 'ADM/2024/02',
      'Admission Date': '2024-06-01',
      'Religion': 'Hindu',
      'Caste': 'GENERAL',
      'Gender': 'Girl',
    },
    {
      'SATS No': '1290384703',
      'PEN No': '20239014563',
      'Aadhar No': '592837482910',
      'Student Name': 'MOHAMMED REHAN KHAN',
      'Father Name': 'ABDUL REHMAN KHAN',
      'Mother Name': 'FATIMA KHAN',
      'Class': 'Class 6',
      'Section': 'A',
      'Admission No': 'ADM/2024/03',
      'Admission Date': '2024-06-02',
      'Religion': 'Muslim',
      'Caste': 'MUSLIM',
      'Gender': 'Boy',
    },
    {
      'SATS No': '1290384704',
      'PEN No': '20239014564',
      'Aadhar No': '672839102938',
      'Student Name': 'PRIYA SHANKAR MADAR',
      'Father Name': 'SHANKAR MADAR',
      'Mother Name': 'RENUKA MADAR',
      'Class': 'Class 7',
      'Section': 'B',
      'Admission No': 'ADM/2024/04',
      'Admission Date': '2024-06-02',
      'Religion': 'Hindu',
      'Caste': 'SC',
      'Gender': 'Girl',
    },
    {
      'SATS No': '1290384705',
      'PEN No': '20239014565',
      'Aadhar No': '782910293847',
      'Student Name': 'ROHAN SANTOSH NAIK',
      'Father Name': 'SANTOSH NAIK',
      'Mother Name': 'KAVITA NAIK',
      'Class': 'Class 8',
      'Section': 'A',
      'Admission No': 'ADM/2024/05',
      'Admission Date': '2024-06-03',
      'Religion': 'Hindu',
      'Caste': 'ST',
      'Gender': 'Boy',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SATS_Students');
  XLSX.writeFile(wb, 'Karnataka_SATS_Students_Sample_Template.xlsx');
};
