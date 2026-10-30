import { Student, SchoolRecord } from '../types';
import { formatDateToWords } from './dateToWords';

export interface TcData {
  // Header
  tcNumber: string;
  diseCode: string;
  schoolName: string;
  taluk: string;
  district: string;
  isDuplicate: boolean;
  duplicateNumber?: number;

  // Re-indexed 1 to 29 (School Name is in top page heading)
  field1_admissionNo: string;
  field2_cumulativeRecordNo: string;
  field3_studentName: string;
  field4_gender: string;
  field5_aadhaarNo: string;
  field6_satsNo: string;
  field7_nationality: string;
  field8_religion: string;
  field9_caste: string;
  field10_subCaste: string;
  field11_fatherName: string;
  field11_fatherAadhaar: string;
  field12_motherName: string;
  field12_motherAadhaar: string;
  field13_isScOrSt: string;
  field14_isEligibleForPromotion: string;
  field15_dobFigures: string;
  field15_dobWords: string;
  field15_placeOfBirth: string;
  field16_classStudyingInWords: string;
  field17_languagesStudied: string;
  field17_coreSubjects: string;

  // Split Columns: Left 18 to 22
  field18_mediumOfInstruction: string;
  field19_dateOfAdmissionOrPromotion: string;
  field20_feesCleared: string;
  field21_feeConcession: string;
  field22_scholarship: string;

  // Split Columns: Right 23 to 29
  field23_medicalExamined: string;
  field24_dateOfLastAttendance: string;
  field25_dateOfTcApplication: string;
  field26_dateOfTcIssue: string;
  field27_totalWorkingDays: string;
  field28_totalAttendedDays: string;
  field29_characterAndConduct: string;

  // Footer
  placeName: string;
  headmasterName: string;
  issuedAt?: string;
  status: 'DRAFT' | 'ISSUED';
}

export interface TcLabels {
  govDepartment: string;
  title: string;
  diseLabel: string;
  tcNoLabel: string;
  duplicateStamp: string;

  // Re-indexed field labels (1 to 29)
  item1: string;
  item2: string;
  item3: string;
  item4: string;
  item5: string;
  item6: string;
  item7: string;
  item8: string;
  item9: string;
  item10: string;
  item11: string;
  item11_sub: string;
  item12: string;
  item12_sub: string;
  item13: string;
  item14: string;
  item15: string;
  item15_sub: string;
  item16: string;
  item17_title: string;
  item17_a: string;
  item17_b: string;
  item18: string;
  item19: string;
  item20: string;
  item21: string;
  item22: string;
  item23: string;
  item24: string;
  item25: string;
  item26: string;
  item27: string;
  item28: string;
  item29: string;

  // Footer & Notices
  hmSignature: string;
  schoolSeal: string;
  placeLabel: string;
  dateLabel: string;
  statutoryNotice: string;
  footerCredit: string;
}

export const TC_LABELS_KANNADA: TcLabels = {
  govDepartment: 'ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ',
  title: 'ವರ್ಗಾವಣೆ ಪ್ರಮಾಣ ಪತ್ರ',
  diseLabel: 'ಶಾಲೆಯ ಡೈಸ್ ಸಂಖ್ಯೆ :',
  tcNoLabel: 'ಸಂಖ್ಯೆ :',
  duplicateStamp: 'ನಕಲು ಪ್ರತಿ (DUPLICATE COPY)',

  item1: '1. ಪ್ರವೇಶ ಸಂಖ್ಯೆ :',
  item2: '2. ಸಂಚಿತ ದಾಖಲೆ ಸಂಖ್ಯೆ :',
  item3: '3. ವಿದ್ಯಾರ್ಥಿಯ ಪೂರ್ಣ ಹೆಸರು :',
  item4: '4. ಲಿಂಗ :',
  item5: '5. ವಿದ್ಯಾರ್ಥಿಯ ಆಧಾರ ಸಂಖ್ಯೆ :',
  item6: '6. ಎಸ್.ಟಿ.ಎಸ್. ಸಂಖ್ಯೆ :',
  item7: '7. ರಾಷ್ಟ್ರೀಯತೆ :',
  item8: '8. ಧರ್ಮ :',
  item9: '9. ಜಾತಿ :',
  item10: '10. ಉಪಜಾತಿ :',
  item11: '11. ತಂದೆಯ ಹೆಸರು :',
  item11_sub: 'ಆಧಾರ ಕಾರ್ಡ್ ಸಂಖ್ಯೆ :',
  item12: '12. ತಾಯಿಯ ಹೆಸರು :',
  item12_sub: 'ಆಧಾರ ಕಾರ್ಡ್ ಸಂಖ್ಯೆ :',
  item13: '13. ವಿದ್ಯಾರ್ಥಿಯು ಪರಿಶಿಷ್ಟ ಜಾತಿ ಅಥವಾ ಪರಿಶಿಷ್ಟ ವರ್ಗಕ್ಕೆ ಸೇರಿದವನಾಗಿದ್ದಾನೆಯೇ ?',
  item14: '14. ಮುಂದಿನ ತರಗತಿಗೆ ಉತ್ತೀರ್ಣಗೊಳಿಸಲು ಅರ್ಹನಾಗಿದ್ದಾನೆಯೇ ?',
  item15: '15. ಜನ್ಮ ದಿನಾಂಕ (ಅಕ್ಷರಗಳಲ್ಲಿ ಮತ್ತು ಅಂಕಿಗಳಲ್ಲಿ) :',
  item15_sub: 'ಜನ್ಮ ಸ್ಥಳ :',
  item16: '16. ಶಾಲೆಯನ್ನು ಬಿಡುವಾಗ ವಿದ್ಯಾರ್ಥಿಯು ಓದುತ್ತಿರುವ ದರ್ಜೆ-ತರಗತಿ (ಅಕ್ಷರಗಳಲ್ಲಿ) :',
  item17_title: '17. ಪ್ರೌಢ ತರಗತಿಯ ವಿದ್ಯಾರ್ಥಿಗಳ ವಿಷಯದಲ್ಲಿ',
  item17_a: 'ಅ) ಅಧ್ಯಯನ ಮಾಡಿದ ಭಾಷೆ :',
  item17_b: 'ಆ) ಅಧ್ಯಯನ ಮಾಡಿದ ಐಚ್ಛಿಕ ವಿಷಯಗಳು :',
  item18: '18. ಬೋಧನಾ ಮಾಧ್ಯಮ :',
  item19: '19. ಆ ವರ್ಗಕ್ಕೆ ಅಥವಾ ತರಗತಿಗೆ ಪ್ರವೇಶ ಪಡೆದ ಅಥವಾ ಬಡ್ತಿ ಪಡೆದ ದಿನಾಂಕ :',
  item20: '20. ಶಾಲೆಗೆ ಬಾಕಿಯಿರುವ ಎಲ್ಲ ಶುಲ್ಕಗಳನ್ನು ವಿದ್ಯಾರ್ಥಿಯು ಪಾವತಿ ಮಾಡಿದ್ದಾನೆಯೇ ?',
  item21: '21. ಶುಲ್ಕ ವಿನಾಯತಿ ಯಾವುದಾದರೂ ಇದ್ದಲ್ಲಿ (ಸ್ವರೂಪ ಮತ್ತು ಅವಧಿಯನ್ನು ನಿರ್ದಿಷ್ಟಪಡಿಸತಕ್ಕದ್ದು) :',
  item22: '22. ವಿದ್ಯಾರ್ಥಿ ವೇತನ ಯಾವುದಾದರೂ ಇದ್ದಲ್ಲಿ (ಸ್ವರೂಪ ಮತ್ತು ಅವಧಿಯನ್ನು ನಿರ್ದಿಷ್ಟಪಡಿಸತಕ್ಕದ್ದು) :',
  item23: '23. ವೈದ್ಯಕೀಯ ಪರೀಕ್ಷೆ ಮಾಡಿಸಲಾಗಿದೆಯೇ ಅಥವಾ ಇಲ್ಲವೇ ?',
  item24: '24. ಶಾಲೆಗೆ ವಿದ್ಯಾರ್ಥಿಯು ಕಡೆಯ ಬಾರಿ ಹಾಜರಿದ್ದ ದಿನಾಂಕ :',
  item25: '25. ವರ್ಗಾವಣೆ ಪ್ರಮಾಣ ಪತ್ರಕ್ಕಾಗಿ ಅರ್ಜಿಯನ್ನು ಸ್ವೀಕರಿಸಿದ ದಿನಾಂಕ :',
  item26: '26. ವರ್ಗಾವಣೆ ಪ್ರಮಾಣಪತ್ರ ನೀಡಿದ ದಿನಾಂಕ :',
  item27: '27. ಶಾಲೆ ಬಿಟ್ಟ ದಿನಾಂಕದವರೆಗಿನ ಶಾಲೆಯ ದಿನಗಳ ಸಂಖ್ಯೆ :',
  item28: '28. ವಿದ್ಯಾರ್ಥಿಯು ಹಾಜರಾಗಿದ್ದ ಶಾಲೆಯ ದಿನಗಳ ಸಂಖ್ಯೆ :',
  item29: '29. ಗುಣ ಮತ್ತು ನಡತೆ :',

  hmSignature: 'ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಸಹಿ',
  schoolSeal: 'ಮತ್ತು ಶಾಲಾ ಮೊಹರು',
  placeLabel: 'ಸ್ಥಳ :',
  dateLabel: 'ದಿನಾಂಕ :',
  statutoryNotice:
    'ಸೂಚನೆ : ತಂದೆ ತಾಯಿಗಳ ಅಥವಾ ಪಾಲಕರ ಕೋರಿಕೆಯ ಮೇರೆಗೆ ಈ ಪ್ರಮಾಣ ಪತ್ರವನ್ನು ನೀಡತಕ್ಕದ್ದು. ಮೂಲ ಪ್ರತಿ ಕಳೆದು ಹೋಗಿದೆಯೆಂಬ ಕಾರಣದ ಮೇಲೆ ನಕಲು ಪ್ರತಿಗಳಿಗಾಗಿ ಕೋರಿಕೆಯನ್ನು ಸಲ್ಲಿಸಿದ ಸಂದರ್ಭದಲ್ಲಿ ಪ್ರೌಢ / ಮಾಧ್ಯಮಿಕ / ವಿವಿಧೋದ್ದೇಶ ಶಾಲೆಗಳಲ್ಲಿ ರೂ. 1 ಹಾಗೂ ಮಾಧ್ಯಮಿಕ ಹಾಗೂ ಪ್ರಾಥಮಿಕ ಶಾಲೆಗಳಲ್ಲಿ 25 ಪೈಸೆಗಳನ್ನು ದಂಡವಾಗಿ ಸಂಗ್ರಹಿಸತಕ್ಕದ್ದು. (ಶಿಕ್ಷಣ ನಿಯಮ ನಂ. 36ನ್ನು ನೋಡಿ)',
  footerCredit: 'Designed by Shri S R Angadi. M: 9731 766 727',
};

export const TC_LABELS_ENGLISH: TcLabels = {
  govDepartment: 'School Education department',
  title: 'TRANSFER CERTIFICATE',
  diseLabel: 'School DISE No. :',
  tcNoLabel: 'No. :',
  duplicateStamp: 'DUPLICATE COPY (ನಕಲು ಪ್ರತಿ)',

  item1: '1. Admission No. :',
  item2: '2. Cumulative Record No. :',
  item3: "3. Student's Full Name :",
  item4: '4. Gender :',
  item5: "5. Student's Aadhaar No. :",
  item6: '6. S.T.S. / SATS No. :',
  item7: '7. Nationality :',
  item8: '8. Religion :',
  item9: '9. Caste :',
  item10: '10. Sub-caste :',
  item11: "11. Father's Name :",
  item11_sub: 'Aadhaar Card No. :',
  item12: "12. Mother's Name :",
  item12_sub: 'Aadhaar Card No. :',
  item13: '13. Whether the student belongs to Scheduled Caste or Scheduled Tribe?',
  item14: '14. Whether qualified for promotion to higher standard?',
  item15: '15. Date of Birth (in figures & in words) :',
  item15_sub: 'Place of Birth :',
  item16: '16. Standard in which studying at the time of leaving school (in words) :',
  item17_title: '17. In case of High School Students',
  item17_a: 'a) Languages studied :',
  item17_b: 'b) Core / Elective subjects studied :',
  item18: '18. Medium of instruction :',
  item19: '19. Date of admission or promotion to that class :',
  item20: '20. Whether all dues/fees to school have been paid by the student?',
  item21: '21. Any fee concession received (nature and period to be specified) :',
  item22: '22. Any scholarship received (nature and period to be specified) :',
  item23: '23. Whether medically examined or not?',
  item24: "24. Date of student's last attendance at school :",
  item25: '25. Date of receipt of application for Transfer Certificate :',
  item26: '26. Date of issue of Transfer Certificate :',
  item27: '27. Total number of school working days up to date of leaving :',
  item28: '28. Total number of days student attended school :',
  item29: '29. Character and Conduct :',

  hmSignature: 'Signature of Headmaster',
  schoolSeal: '& School Seal',
  placeLabel: 'Place :',
  dateLabel: 'Date :',
  statutoryNotice:
    'Note: This certificate is to be issued upon request of parents or guardians. When an application for a duplicate copy is made on the ground that the original has been lost, a fee of Re. 1 in High / Middle / Multipurpose schools and 25 paise in Middle & Primary schools shall be levied. (See Education Rule No. 36)',
  footerCredit: 'Designed by Shri S R Angadi. M: 9731 766 727',
};

export const getTcLabels = (lang: 'kn' | 'en'): TcLabels => {
  return lang === 'kn' ? TC_LABELS_KANNADA : TC_LABELS_ENGLISH;
};

// Convert class number to formal words
export const classToWords = (classStd: string, lang: 'kn' | 'en'): string => {
  const num = parseInt(classStd, 10);
  if (lang === 'kn') {
    const knMap: Record<number, string> = {
      1: 'ಒಂದನೇ ತರಗತಿ (1st Std)',
      2: 'ಎರಡನೇ ತರಗತಿ (2nd Std)',
      3: 'ಮೂರನೇ ತರಗತಿ (3rd Std)',
      4: 'ನಾಲ್ಕನೇ ತರಗತಿ (4th Std)',
      5: 'ಐದನೇ ತರಗತಿ (5th Std)',
      6: 'ಆರನೇ ತರಗತಿ (6th Std)',
      7: 'ಏಳನೇ ತರಗತಿ (7th Std)',
      8: 'ಎಂಟನೇ ತರಗತಿ (8th Std)',
      9: 'ಒಂಬತ್ತನೇ ತರಗತಿ (9th Std)',
      10: 'ಹತ್ತನೇ ತರಗತಿ (10th Std)',
    };
    return knMap[num] || `${classStd}ನೇ ತರಗತಿ`;
  } else {
    const enMap: Record<number, string> = {
      1: 'First Standard (Class 1)',
      2: 'Second Standard (Class 2)',
      3: 'Third Standard (Class 3)',
      4: 'Fourth Standard (Class 4)',
      5: 'Fifth Standard (Class 5)',
      6: 'Sixth Standard (Class 6)',
      7: 'Seventh Standard (Class 7)',
      8: 'Eighth Standard (Class 8)',
      9: 'Ninth Standard (Class 9)',
      10: 'Tenth Standard (Class 10)',
    };
    return enMap[num] || `Class ${classStd}`;
  }
};

// Extract default village name from school name
export const extractVillageFromSchool = (schoolName?: string, taluk?: string): string => {
  if (!schoolName) return taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
  const tokens = schoolName.trim().split(/\s+/);
  if (tokens.length > 0) {
    const lastWord = tokens[tokens.length - 1].replace(/[(),.-]/g, '');
    if (lastWord.length > 1) return lastWord;
  }
  return taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
};

// Religion name translated
export const formatReligion = (religion?: string, lang: 'kn' | 'en' = 'kn'): string => {
  if (!religion) return lang === 'kn' ? 'ಹಿಂದೂ (Hindu)' : 'Hindu';
  const r = religion.toLowerCase();
  if (r.includes('hindu')) return lang === 'kn' ? 'ಹಿಂದೂ' : 'Hindu';
  if (r.includes('muslim') || r.includes('islam')) return lang === 'kn' ? 'ಇಸ್ಲಾಂ (ಮುಸ್ಲಿಂ)' : 'Islam (Muslim)';
  if (r.includes('christian')) return lang === 'kn' ? 'ಕ್ರಿಶ್ಚಿಯನ್' : 'Christian';
  if (r.includes('jain')) return lang === 'kn' ? 'ಜೈನ' : 'Jain';
  if (r.includes('sikh')) return lang === 'kn' ? 'ಸಿಖ್' : 'Sikh';
  if (r.includes('buddhist')) return lang === 'kn' ? 'ಬೌದ್ಧ' : 'Buddhist';
  return religion;
};

// Check SC / ST from caste
export const checkIsScOrSt = (caste?: string, lang: 'kn' | 'en' = 'kn'): string => {
  if (!caste) return lang === 'kn' ? 'ಇಲ್ಲ (No)' : 'No';
  const c = caste.toUpperCase().trim();
  if (c === 'SC' || c === 'ST') {
    return lang === 'kn' ? `ಹೌದು (${c})` : `Yes (${c})`;
  }
  return lang === 'kn' ? 'ಇಲ್ಲ (No)' : 'No';
};

// Default subjects based on class & medium
export const getDefaultSubjects = (
  classStd: string,
  medium: string = 'Kannada',
  lang: 'kn' | 'en' = 'kn'
): { languages: string; coreSubjects: string } => {
  const std = parseInt(classStd, 10) || 5;
  const isKn = lang === 'kn';

  if (std >= 8) {
    return {
      languages: isKn
        ? 'ಪ್ರಥಮ: ಕನ್ನಡ, ದ್ವಿತೀಯ: ಇಂಗ್ಲಿಷ್, ತೃತೀಯ: ಹಿಂದಿ'
        : 'First: Kannada, Second: English, Third: Hindi',
      coreSubjects: isKn
        ? 'ಗಣಿತ, ವಿಜ್ಞಾನ, ಸಮಾಜ ವಿಜ್ಞಾನ'
        : 'Mathematics, Science, Social Science',
    };
  } else if (std >= 5) {
    return {
      languages: isKn
        ? 'ಕನ್ನಡ, ಇಂಗ್ಲಿಷ್, ಹಿಂದಿ'
        : 'Kannada, English, Hindi',
      coreSubjects: isKn
        ? 'ಗಣಿತ, ಪರಿಸರ ಅಧ್ಯಯನ / ವಿಜ್ಞಾನ, ಸಮಾಜ ವಿಜ್ಞಾನ'
        : 'Mathematics, EVS / Science, Social Science',
    };
  } else {
    return {
      languages: isKn
        ? 'ಕನ್ನಡ, ಇಂಗ್ಲಿಷ್'
        : 'Kannada, English',
      coreSubjects: isKn
        ? 'ಗಣಿತ, ಪರಿಸರ ಅಧ್ಯಯನ'
        : 'Mathematics, Environmental Studies',
    };
  }
};

/**
 * Adapter: Map database Student & SchoolRecord to TC fields
 */
export const buildDefaultTcData = (
  student: Student,
  schoolRecord: SchoolRecord | null,
  lang: 'kn' | 'en',
  serialNumber: number = 1
): TcData => {
  const isKn = lang === 'kn';
  const now = new Date();
  const todayStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  // DOB & Words
  const rawDob = student.dob || student.dateOfBirth || '15/06/2014';
  const { formattedDate: dobFig, wordsInBrackets: dobWords } = formatDateToWords(rawDob, lang);

  // Class in words
  const classInWords = classToWords(student.classStandard || '5', lang);

  // Village / Place of birth
  const place = extractVillageFromSchool(schoolRecord?.schoolName, schoolRecord?.taluk);

  // Subjects
  const { languages, coreSubjects } = getDefaultSubjects(
    student.classStandard || '5',
    schoolRecord?.schoolMedium || 'Kannada',
    lang
  );

  // TC Number
  const diseSuffix = schoolRecord?.diseCode ? schoolRecord.diseCode.slice(-4) : '2025';
  const autoTcNumber = `TC/${diseSuffix}/${String(serialNumber).padStart(3, '0')}`;

  // Admission Date
  const admDate = student.admissionDate || '01/06/2023';

  // SC/ST check
  const scStStatus = checkIsScOrSt(student.caste, lang);

  // Gender
  const genderStr =
    student.gender === 'Girl'
      ? isKn
        ? 'ಹೆಣ್ಣು (Girl)'
        : 'Girl (Female)'
      : isKn
      ? 'ಗಂಡು (Boy)'
      : 'Boy (Male)';

  return {
    tcNumber: autoTcNumber,
    diseCode: schoolRecord?.diseCode || '',
    schoolName: schoolRecord?.schoolName || '',
    taluk: schoolRecord?.taluk || (isKn ? 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ' : 'Belagavi Rural'),
    district: schoolRecord?.district || (isKn ? 'ಬೆಳಗಾವಿ' : 'Belagavi'),
    isDuplicate: false,
    duplicateNumber: 1,

    field1_admissionNo: student.schoolRegNo || student.penNo || '124/2023',
    field2_cumulativeRecordNo: student.satsNo ? `CR-${student.satsNo.slice(-6)}` : 'CR-001',
    field3_studentName: (isKn && student.studentNameKn ? student.studentNameKn : student.studentName) || '',
    field4_gender: genderStr,
    field5_aadhaarNo: student.aadharNo || '-',
    field6_satsNo: student.satsNo || '-',
    field7_nationality: isKn ? 'ಭಾರತೀಯ' : 'Indian',
    field8_religion: formatReligion(student.religion, lang),
    field9_caste: student.caste === 'CUSTOM' ? (student.customCaste || 'GENERAL') : (student.caste || 'GENERAL'),
    field10_subCaste: student.customCaste || '-',
    field11_fatherName: (isKn && student.fatherNameKn ? student.fatherNameKn : student.fatherName) || '',
    field11_fatherAadhaar: '-',
    field12_motherName: (isKn && student.motherNameKn ? student.motherNameKn : student.motherName) || '',
    field12_motherAadhaar: '-',
    field13_isScOrSt: scStStatus,
    field14_isEligibleForPromotion: isKn ? 'ಹೌದು (ಅರ್ಹರಾಗಿದ್ದಾರೆ)' : 'Yes (Qualified)',
    field15_dobFigures: dobFig,
    field15_dobWords: dobWords.replace(/[()]/g, ''),
    field15_placeOfBirth: place,
    field16_classStudyingInWords: classInWords,
    field17_languagesStudied: languages,
    field17_coreSubjects: coreSubjects,

    field18_mediumOfInstruction: schoolRecord?.schoolMedium || (isKn ? 'ಕನ್ನಡ' : 'Kannada'),
    field19_dateOfAdmissionOrPromotion: admDate,
    field20_feesCleared: isKn ? 'ಹೌದು (ಪಾವತಿಸಲಾಗಿದೆ)' : 'Yes (Paid)',
    field21_feeConcession: isKn ? 'ಇಲ್ಲ' : 'Nil',
    field22_scholarship: isKn ? 'ಇಲ್ಲ' : 'Nil',

    field23_medicalExamined: isKn ? 'ಮಾಡಿಸಲಾಗಿದೆ' : 'Examined',
    field24_dateOfLastAttendance: '31/03/2025',
    field25_dateOfTcApplication: todayStr,
    field26_dateOfTcIssue: todayStr,
    field27_totalWorkingDays: '220',
    field28_totalAttendedDays: '212',
    field29_characterAndConduct: isKn ? 'ಉತ್ತಮವಾಗಿದೆ' : 'Good',

    placeName: place,
    headmasterName: schoolRecord?.headmasterName || (isKn ? 'ಮುಖ್ಯೋಪಾಧ್ಯಾಯರು' : 'Headmaster'),
    status: 'DRAFT',
  };
};

/**
 * Storage helpers for TC drafts and issued records
 */
const TC_STORAGE_KEY_PREFIX = 'srms_tc_records_';

export const loadStoredTcRecord = (diseCode: string, studentId: string): TcData | null => {
  try {
    const raw = localStorage.getItem(`${TC_STORAGE_KEY_PREFIX}${diseCode}`);
    if (!raw) return null;
    const map = JSON.parse(raw);
    const data = map[studentId];
    if (!data) return null;

    // Backward compatibility if old data had field1_schoolName
    if (data.field1_schoolName !== undefined && data.field1_admissionNo === undefined) {
      return {
        ...data,
        field1_admissionNo: data.field2_admissionNo || '',
        field2_cumulativeRecordNo: data.field3_cumulativeRecordNo || '',
        field3_studentName: data.field4_studentName || '',
        field4_gender: data.field5_gender || '',
        field5_aadhaarNo: data.field6_aadhaarNo || '',
        field6_satsNo: data.field7_satsNo || '',
        field7_nationality: data.field8_nationality || '',
        field8_religion: data.field9_religion || '',
        field9_caste: data.field10_caste || '',
        field10_subCaste: data.field11_subCaste || '',
        field11_fatherName: data.field12_fatherName || '',
        field11_fatherAadhaar: data.field12_fatherAadhaar || '',
        field12_motherName: data.field13_motherName || '',
        field12_motherAadhaar: data.field13_motherAadhaar || '',
        field13_isScOrSt: data.field14_isScOrSt || '',
        field14_isEligibleForPromotion: data.field15_isEligibleForPromotion || '',
        field15_dobFigures: data.field16_dobFigures || '',
        field15_dobWords: data.field16_dobWords || '',
        field15_placeOfBirth: data.field16_placeOfBirth || '',
        field16_classStudyingInWords: data.field17_classStudyingInWords || '',
        field17_languagesStudied: data.field18_languagesStudied || '',
        field17_coreSubjects: data.field18_coreSubjects || '',
        field18_mediumOfInstruction: data.field19_mediumOfInstruction || '',
        field19_dateOfAdmissionOrPromotion: data.field20_dateOfAdmissionOrPromotion || '',
        field20_feesCleared: data.field21_feesCleared || '',
        field21_feeConcession: data.field22_feeConcession || '',
        field22_scholarship: data.field23_scholarship || '',
        field23_medicalExamined: data.field24_medicalExamined || '',
        field24_dateOfLastAttendance: data.field25_dateOfLastAttendance || '',
        field25_dateOfTcApplication: data.field26_dateOfTcApplication || '',
        field26_dateOfTcIssue: data.field27_dateOfTcIssue || '',
        field27_totalWorkingDays: data.field28_totalWorkingDays || '',
        field28_totalAttendedDays: data.field29_totalAttendedDays || '',
        field29_characterAndConduct: data.field30_characterAndConduct || '',
      };
    }
    return data;
  } catch {
    return null;
  }
};

export const saveStoredTcRecord = (diseCode: string, studentId: string, data: TcData): void => {
  try {
    const key = `${TC_STORAGE_KEY_PREFIX}${diseCode}`;
    const raw = localStorage.getItem(key);
    const map = raw ? JSON.parse(raw) : {};
    map[studentId] = {
      ...data,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save TC record to localStorage:', e);
  }
};

export const getAllIssuedTcRecords = (diseCode: string): Record<string, TcData> => {
  try {
    const raw = localStorage.getItem(`${TC_STORAGE_KEY_PREFIX}${diseCode}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
