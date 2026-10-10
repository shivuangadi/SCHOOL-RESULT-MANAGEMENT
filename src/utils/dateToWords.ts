/**
 * Helper to convert date strings (YYYY-MM-DD or DD-MM-YYYY) into words
 * in Kannada and English for certificates (TC, Study Certificate, etc.)
 */

const KANNADA_DAYS: Record<number, string> = {
  1: 'ಒಂದು',
  2: 'ಎರಡು',
  3: 'ಮೂರು',
  4: 'ನಾಲ್ಕು',
  5: 'ಐದು',
  6: 'ಆರು',
  7: 'ಏಳು',
  8: 'ಎಂಟು',
  9: 'ಒಂಬತ್ತು',
  10: 'ಹತ್ತು',
  11: 'ಹನ್ನೊಂದು',
  12: 'ಹನ್ನೆರಡು',
  13: 'ಹದಿಮೂರು',
  14: 'ಹದಿನಾಲ್ಕು',
  15: 'ಹದಿನೈದು',
  16: 'ಹದಿನಾರು',
  17: 'ಹದಿನೇಳು',
  18: 'ಹದಿನೆಂಟು',
  19: 'ಹತ್ತೊಂಬತ್ತು',
  20: 'ಇಪ್ಪತ್ತು',
  21: 'ಇಪ್ಪತ್ತೊಂದು',
  22: 'ಇಪ್ಪತ್ತೆರಡು',
  23: 'ಇಪ್ಪತ್ತಮೂರು',
  24: 'ಇಪ್ಪತ್ತನಾಲ್ಕು',
  25: 'ಇಪ್ಪತ್ತೈದು',
  26: 'ಇಪ್ಪತ್ತಾರು',
  27: 'ಇಪ್ಪತ್ತೇಳು',
  28: 'ಇಪ್ಪತ್ತೆಂಟು',
  29: 'ಇಪ್ಪತ್ತೊಂಬತ್ತು',
  30: 'ಮೂವತ್ತು',
  31: 'ಮೂವತ್ತೊಂದು',
};

const ENGLISH_DAYS: Record<number, string> = {
  1: 'First',
  2: 'Second',
  3: 'Third',
  4: 'Fourth',
  5: 'Fifth',
  6: 'Sixth',
  7: 'Seventh',
  8: 'Eighth',
  9: 'Ninth',
  10: 'Tenth',
  11: 'Eleventh',
  12: 'Twelfth',
  13: 'Thirteenth',
  14: 'Fourteenth',
  15: 'Fifteenth',
  16: 'Sixteenth',
  17: 'Seventeenth',
  18: 'Eighteenth',
  19: 'Nineteenth',
  20: 'Twentieth',
  21: 'Twenty First',
  22: 'Twenty Second',
  23: 'Twenty Third',
  24: 'Twenty Fourth',
  25: 'Twenty Fifth',
  26: 'Twenty Sixth',
  27: 'Twenty Seventh',
  28: 'Twenty Eighth',
  29: 'Twenty Ninth',
  30: 'Thirtieth',
  31: 'Thirty First',
};

const KANNADA_MONTHS: Record<number, string> = {
  1: 'ಜನವರಿ',
  2: 'ಫೆಬ್ರವರಿ',
  3: 'ಮಾರ್ಚ್',
  4: 'ಏಪ್ರಿಲ್',
  5: 'ಮೇ',
  6: 'ಜೂನ್',
  7: 'ಜುಲೈ',
  8: 'ಆಗಸ್ಟ್',
  9: 'ಸೆಪ್ಟೆಂಬರ್',
  10: 'ಅಕ್ಟೋಬರ್',
  11: 'ನವೆಂಬರ್',
  12: 'ಡಿಸೆಂಬರ್',
};

const ENGLISH_MONTHS: Record<number, string> = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December',
};

export const yearToKannadaWords = (year: number): string => {
  if (year >= 2000 && year < 2100) {
    const rem = year - 2000;
    if (rem === 0) return 'ಎರಡು ಸಾವಿರ';
    const remWords = KANNADA_DAYS[rem] || String(rem);
    return `ಎರಡು ಸಾವಿರದ ${remWords}`;
  }
  if (year >= 1900 && year < 2000) {
    const rem = year - 1900;
    const remWords = KANNADA_DAYS[rem] || String(rem);
    return `ಒಂಬೈನೂರ ${remWords}`;
  }
  return String(year);
};

export const yearToEnglishWords = (year: number): string => {
  if (year >= 2000 && year < 2100) {
    const rem = year - 2000;
    if (rem === 0) return 'Two Thousand';
    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    let remStr = '';
    if (rem < 20) {
      remStr = ones[rem];
    } else {
      const t = Math.floor(rem / 10);
      const o = rem % 10;
      remStr = `${tens[t]}${o ? ' ' + ones[o] : ''}`;
    }
    return `Two Thousand ${remStr}`.trim();
  }
  return String(year);
};

export const formatDateToWords = (
  dateStr: string,
  lang: 'kn' | 'en' = 'kn'
): { formattedDate: string; wordsInBrackets: string } => {
  if (!dateStr) {
    return {
      formattedDate: '15/06/2014',
      wordsInBrackets: lang === 'kn' ? '(ಹದಿನೈದು ಜೂನ್ ಎರಡು ಸಾವಿರದ ಹದಿನಾಲ್ಕು)' : '(Fifteenth June Two Thousand Fourteen)',
    };
  }

  let cleanStr = String(dateStr).trim()
    .replace(/20110/g, '2011')
    .replace(/20111/g, '2011')
    .replace(/20112/g, '2012')
    .replace(/20113/g, '2013')
    .replace(/20114/g, '2014')
    .replace(/20115/g, '2015');

  let day = 15;
  let month = 6;
  let year = 2014;

  const parts = cleanStr.split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[0].length >= 4) {
      year = parseInt(parts[0].slice(0, 4), 10) || 2014;
      month = parseInt(parts[1], 10) || 6;
      day = parseInt(parts[2], 10) || 15;
    } else {
      day = parseInt(parts[0], 10) || 15;
      month = parseInt(parts[1], 10) || 6;
      year = parseInt(parts[2].slice(0, 4), 10) || 2014;
    }
  }

  if (year > 2050 || year < 1950) {
    year = 2015;
  }
  if (day < 1 || day > 31) day = 15;
  if (month < 1 || month > 12) month = 6;

  // English digits in DD/MM/YYYY format strictly
  const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;

  if (lang === 'kn') {
    const dWords = KANNADA_DAYS[day] || String(day);
    const mWords = KANNADA_MONTHS[month] || String(month);
    const yWords = yearToKannadaWords(year);
    return {
      formattedDate,
      wordsInBrackets: `(${dWords} ${mWords} ${yWords})`,
    };
  } else {
    const dWords = ENGLISH_DAYS[day] || String(day);
    const mWords = ENGLISH_MONTHS[month] || String(month);
    const yWords = yearToEnglishWords(year);
    return {
      formattedDate,
      wordsInBrackets: `(${dWords} ${mWords} ${yWords})`,
    };
  }
};
