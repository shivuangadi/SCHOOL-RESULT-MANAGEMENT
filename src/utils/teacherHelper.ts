import { SchoolRecord } from '../types';

/**
 * Fetches the saved class teacher's name from school profile for a given standard (1-10).
 * If found in school profile (e.g. "1-A", "1", "6-A", "6"), it returns the saved teacher name.
 * If not saved in school profile, it checks localStorage (excluding hardcoded default placeholders).
 * If neither is present, it returns an empty string "" so it is left blank for the user to edit across the app (1-10).
 */
export const getSavedClassTeacher = (
  schoolRecord?: SchoolRecord | null,
  classStandard?: string | number,
  division: string = 'A'
): string => {
  if (!classStandard) return '';
  const cls = String(classStandard).trim();
  const div = division.trim() || 'A';
  const teachers = schoolRecord?.classTeachers || {};

  // 1. Direct class-division key (e.g. "6-A", "1-A")
  const divKey = `${cls}-${div}`;
  if (teachers[divKey] && typeof teachers[divKey] === 'string' && teachers[divKey].trim()) {
    return teachers[divKey].trim();
  }

  // 2. Direct class standard key (e.g. "6", "1")
  if (teachers[cls] && typeof teachers[cls] === 'string' && teachers[cls].trim()) {
    return teachers[cls].trim();
  }

  // 3. Any section/division assigned for this standard (e.g. "6-B", "6-C")
  for (const k of Object.keys(teachers)) {
    if ((k.startsWith(`${cls}-`) || k === cls) && teachers[k]?.trim()) {
      return teachers[k].trim();
    }
  }

  // 4. LocalStorage lookup (excluding the old hardcoded demo placeholders)
  const diseCode = schoolRecord?.diseCode || '';
  if (diseCode) {
    const local = localStorage.getItem(`kseab_ct_name_${diseCode}_${cls}`);
    if (
      local &&
      local.trim() &&
      local.trim() !== 'ಶ್ರೀ ಎಸ್ ಆರ್ ಅಂಗಡಿ' &&
      local.trim() !== 'ವರ್ಗ ಶಿಕ್ಷಕರು' &&
      local.trim() !== 'Class Teacher' &&
      local.trim() !== 'ಶ್ರೀ. ಎಂ. ಐ. ನಿಲಾಜಿ' &&
      local.trim() !== 'SHRI. M I NILAJI'
    ) {
      return local.trim();
    }
  }

  // If not saved in school profile, return blank "" to edit across the app 1-10
  return '';
};

/**
 * Persists an edited class teacher name to localStorage.
 */
export const persistClassTeacherLocally = (
  diseCode: string,
  classStandard: string | number,
  name: string
): void => {
  if (!diseCode || !classStandard) return;
  const cls = String(classStandard).trim();
  localStorage.setItem(`kseab_ct_name_${diseCode}_${cls}`, name.trim());
};
