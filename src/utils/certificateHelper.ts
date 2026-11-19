/**
 * Shared Certificate Helper Utilities
 * - Smart village/place extraction from school names (stripping brackets & suffixes like SK, HK, KPS)
 * - Dynamic gender-based Kannada prefixes ("ಕುಮಾರ" / "ಕುಮಾರಿ", "ಮಗನಾಗಿದ್ದು" / "ಮಗಳಾಗಿದ್ದು")
 * - Dynamic academic year resolution & tense detection ("ವ್ಯಾಸಂಗ ಮಾಡುತ್ತಿದ್ದಾರೆ" vs "ವ್ಯಾಸಂಗ ಮಾಡಿದ್ದಾರೆ")
 */

export const getComputedCurrentAcademicYear = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth(); // 0-indexed (4 = May)
  const startYear = m >= 4 ? y : y - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
};

export const CERTIFICATE_ACADEMIC_YEARS: string[] = (() => {
  const list: string[] = [];
  for (let y = 2020; y <= 2035; y++) {
    list.push(`${y}-${String((y + 1) % 100).padStart(2, '0')}`);
  }
  return list;
})();

/**
 * Resolves the active/current academic year of the application.
 */
export const getActiveAppAcademicYear = (
  propAcademicYear?: string,
  schoolAcademicYear?: string
): string => {
  const stored =
    typeof window !== 'undefined' ? localStorage.getItem('kseab_active_academic_year') : null;
  return propAcademicYear || stored || schoolAcademicYear || getComputedCurrentAcademicYear();
};

/**
 * Returns true if the certificate's selected academic year is strictly earlier than
 * the active/current academic year (i.e. a past academic year -> "ವ್ಯಾಸಂಗ ಮಾಡಿದ್ದಾರೆ").
 * If it matches or is later than the current academic year -> "ವ್ಯಾಸಂಗ ಮಾಡುತ್ತಿದ್ದಾರೆ".
 */
export const isPastAcademicYear = (
  certAcademicYear: string,
  referenceCurrentAcademicYear?: string
): boolean => {
  const refYear = referenceCurrentAcademicYear || getActiveAppAcademicYear();
  const certStart = parseInt((certAcademicYear || '').match(/^(\d{4})/)?.[1] || '0', 10);
  const refStart = parseInt((refYear || '').match(/^(\d{4})/)?.[1] || '0', 10);
  if (!certStart || !refStart) return false;
  return certStart < refStart;
};

/**
 * Determines whether a student's gender represents female/girl.
 */
export const isFemaleGender = (gender?: string): boolean => {
  const g = String(gender || '').trim().toLowerCase();
  return (
    g === 'girl' ||
    g === 'female' ||
    g === 'f' ||
    g.includes('ಬಾಲಕಿ') ||
    g.includes('ಹೆಣ್ಣು') ||
    g.includes('ಸ್ತ್ರೀ')
  );
};

/**
 * Returns dynamic Kannada honorific prefix based on gender:
 * Boy -> "ಕುಮಾರ", Girl -> "ಕುಮಾರಿ"
 */
export const getKannadaGenderPrefix = (gender?: string): 'ಕುಮಾರ' | 'ಕುಮಾರಿ' => {
  return isFemaleGender(gender) ? 'ಕುಮಾರಿ' : 'ಕುಮಾರ';
};

/**
 * Returns dynamic Kannada son/daughter wording based on gender:
 * Boy -> "ಮಗನಾಗಿದ್ದು", Girl -> "ಮಗಳಾಗಿದ್ದು"
 */
export const getKannadaChildRelation = (gender?: string): 'ಮಗನಾಗಿದ್ದು' | 'ಮಗಳಾಗಿದ್ದು' => {
  return isFemaleGender(gender) ? 'ಮಗಳಾಗಿದ್ದು' : 'ಮಗನಾಗಿದ್ದು';
};

/**
 * Extracts the village / place name from the end of a Karnataka school name.
 *
 * Rules:
 * 1. Strips any bracketed / parenthetical text such as "(K P S)", "(ಕ)", "(SK)", "[HK]".
 * 2. Finds the school keyword ("ಶಾಲೆ", "ಶಾಲಾ", "ಪ್ರೌಢಶಾಲೆ", "ವಿದ್ಯಾಲಯ", "school", "vidyalaya",
 *    "GHPS", "GLPS", "HPS", "LPS", "GHS", "KPS", etc.) and takes the words AFTER it.
 * 3. Strips trailing school-type/code suffixes like "ಎಸ್ ಕೆ", "ಎಚ್ ಕೆ", "ಹೆಚ್ ಕೆ", "ಎಸ್.ಕೆ", "ಎಚ್.ಕೆ",
 *    "S K", "H K", "S.K", "H.K", "KPS", "K P S", "RC", "ಆರ್ ಸಿ" while preserving the full village name before them.
 *
 * Examples:
 * - "ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ, ಬಡಾಲ ಅಂಕಲಗಿ (K P S)" -> "ಬಡಾಲ ಅಂಕಲಗಿ"
 * - "ಸರಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಕನ್ನಡ ಶಾಲೆ ನಿಂಗ್ಯಾನಟ್ಟಿ (ಕ)" -> "ನಿಂಗ್ಯಾನಟ್ಟಿ"
 * - "ಸ.ಹಿ.ಪ್ರಾ.ಶಾಲೆ ಬಡಾಲ ಅಂಕಲಗಿ ಎಸ್ ಕೆ" -> "ಬಡಾಲ ಅಂಕಲಗಿ"
 * - "Govt Higher Primary School Badala Ankalagi H.K." -> "Badala Ankalagi"
 */
export const extractVillageFromSchoolName = (
  schoolName?: string,
  fallbackPlace?: string
): string => {
  if (!schoolName || !schoolName.trim()) {
    return (fallbackPlace || '').trim();
  }

  // 1. Remove parenthetical and square-bracket segments first
  let cleaned = schoolName
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Extract everything after the last school-designation keyword
  const schoolKeywordRegex =
    /(?:ಪ್ರೌಢ\s*ಶಾಲೆ|ಶಾಲೆ|ಶಾಲಾ|ವಿದ್ಯಾಲಯ|high\s+school|primary\s+school|model\s+school|public\s+school|school|vidyalaya|g\.?m\.?h\.?p\.?s\.?|g\.?h\.?p\.?s\.?|g\.?l\.?p\.?s\.?|g\.?u\.?h\.?p\.?s\.?|g\.?k\.?h\.?p\.?s\.?|g\.?h\.?s\.?|h\.?p\.?s\.?|l\.?p\.?s\.?)/gi;

  let lastMatchEnd = -1;
  let match: RegExpExecArray | null;
  while ((match = schoolKeywordRegex.exec(cleaned)) !== null) {
    lastMatchEnd = match.index + match[0].length;
  }

  let village = lastMatchEnd >= 0 ? cleaned.slice(lastMatchEnd) : cleaned;

  // Strip leading separators/punctuation/connecting words (e.g. ",", "-", ":")
  village = village.replace(/^[\s,.\-–—:;/'"]+/, '').trim();

  // 3. Repeatedly strip trailing code suffixes like ಎಸ್ ಕೆ, ಎಚ್ ಕೆ, ಹೆಚ್ ಕೆ, S.K, H.K, K.P.S, R.C, etc.
  const trailingSuffixPatterns: RegExp[] = [
    /(?:[\s,.\-–—]+|^)(?:ಎಸ್\.?\s*ಕೆ\.?|ಎಚ್\.?\s*ಕೆ\.?|ಹೆಚ್\.?\s*ಕೆ\.?|ಕೆ\.?\s*ಪಿ\.?\s*ಎಸ್\.?|ಆರ್\.?\s*ಸಿ\.?|ಪಿ\.?\s*ಎಲ್\.?|ಕ\.?|ಮ\.?|ಉ\.?)[\s,.\-–—]*$/u,
    /(?:[\s,.\-–—]+|^)(?:s\.?\s*k\.?|h\.?\s*k\.?|k\.?\s*p\.?\s*s\.?|r\.?\s*c\.?|p\.?\s*l\.?|g\.?h\.?p\.?s\.?|g\.?l\.?p\.?s\.?|h\.?p\.?s\.?|l\.?p\.?s\.?)[\s,.\-–—]*$/i,
  ];

  let prev = '';
  while (village && village !== prev) {
    prev = village;
    for (const pattern of trailingSuffixPatterns) {
      const candidate = village.replace(pattern, '').trim();
      if (candidate.length > 0) {
        village = candidate;
      }
    }
    village = village.replace(/[\s,.\-–—:;/'"]+$/, '').trim();
  }

  if (village.length > 0) {
    return village;
  }

  return (fallbackPlace || '').trim();
};
