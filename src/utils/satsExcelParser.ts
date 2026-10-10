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

const normalizeClass = (val: any): StudentClass => {
  if (!val) return '1';
  const str = String(val).trim().toUpperCase();

  // Roman numerals
  if (str === 'I' || str === '1' || str.includes('1ST') || str === 'CLASS 1' || str === 'STD 1' || str.includes('1ನೇ')) return '1';
  if (str === 'II' || str === '2' || str.includes('2ND') || str === 'CLASS 2' || str === 'STD 2' || str.includes('2ನೇ')) return '2';
  if (str === 'III' || str === '3' || str.includes('3RD') || str === 'CLASS 3' || str === 'STD 3' || str.includes('3ನೇ')) return '3';
  if (str === 'IV' || str === '4' || str.includes('4TH') || str === 'CLASS 4' || str === 'STD 4' || str.includes('4ನೇ')) return '4';
  if (str === 'V' || str === '5' || str.includes('5TH') || str === 'CLASS 5' || str === 'STD 5' || str.includes('5ನೇ')) return '5';
  if (str === 'VI' || str === '6' || str.includes('6TH') || str === 'CLASS 6' || str === 'STD 6' || str.includes('6ನೇ')) return '6';
  if (str === 'VII' || str === '7' || str.includes('7TH') || str === 'CLASS 7' || str === 'STD 7' || str.includes('7ನೇ')) return '7';
  if (str === 'VIII' || str === '8' || str.includes('8TH') || str === 'CLASS 8' || str === 'STD 8' || str.includes('8ನೇ')) return '8';
  if (str === 'IX' || str === '9' || str.includes('9TH') || str === 'CLASS 9' || str === 'STD 9' || str.includes('9ನೇ')) return '9';
  if (str === 'X' || str === '10' || str.includes('10TH') || str === 'CLASS 10' || str === 'STD 10' || str.includes('10ನೇ')) return '10';

  // Extract first number between 1 and 10
  const match = str.match(/\b([1-9]|10)\b/);
  if (match) {
    return match[1] as StudentClass;
  }
  return '1';
};

const normalizeDivision = (val: any): StudentDivision => {
  if (!val) return 'A';
  const str = String(val).trim().toUpperCase();
  if (str.includes('B')) return 'B';
  if (str.includes('C')) return 'C';
  if (str.includes('D')) return 'D';
  return 'A';
};

const normalizeReligion = (val: any): StudentReligion => {
  if (!val) return 'Hindu';
  const str = String(val).trim().toLowerCase();
  if (str.includes('mus') || str.includes('islam')) return 'Muslim';
  if (str.includes('chri')) return 'Christian';
  if (str.includes('jain')) return 'Jain';
  if (str.includes('sikh')) return 'Sikh';
  if (str.includes('bud')) return 'Buddhist';
  if (str.includes('hin')) return 'Hindu';
  return 'Other';
};

const normalizeCaste = (val: any): StudentCaste => {
  if (!val) return 'GENERAL';
  const str = String(val).trim().toUpperCase();
  if (str === 'SC' || str.includes('SCHEDULED CASTE')) return 'SC';
  if (str === 'ST' || str.includes('SCHEDULED TRIBE')) return 'ST';
  if (str.includes('OBC') || str.includes('2A') || str.includes('3A') || str.includes('3B') || str.includes('CAT-1')) return 'OBC';
  if (str.includes('MUSLIM') || str.includes('2B')) return 'MUSLIM';
  if (str.includes('GEN') || str.includes('GM')) return 'GENERAL';
  return 'OTHERS';
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

    const stdClass = normalizeClass(item.classStandard || item.class || item.std || '1');
    const division = normalizeDivision(item.division || item.sec || 'A');
    const gender = normalizeGender(item.gender);
    const caste = normalizeCaste(item.caste);
    const religion = normalizeReligion(item.religion);

    const st: Student = {
      id: String(item.id || `std_${diseCode}_${Date.now()}_${idx}`).replace(/[^a-zA-Z0-9_-]/g, '_'),
      schoolId: item.schoolId || schoolId || diseCode,
      diseCode: item.diseCode || diseCode,
      studentName: name,
      fatherName: item.fatherName || item.father || '-',
      motherName: item.motherName || item.mother || '-',
      classStandard: stdClass,
      division: division,
      satsNo: String(item.satsNo || item.sats || item.satsNumber || '').trim() || '-',
      penNo: String(item.penNo || item.pen || '').trim() || '-',
      aadharNo: String(item.aadharNo || item.aadhar || '').trim() || '-',
      schoolRegNo: item.schoolRegNo || undefined,
      admissionDate: formatDateToDmy(item.admissionDate || '01/06/2025'),
      dob: formatDateToDmy(item.dob || item.dateOfBirth || '15/05/2015'),
      dateOfBirth: formatDateToDmy(item.dateOfBirth || item.dob || '15/05/2015'),
      religion: religion,
      caste: caste,
      customCaste: item.customCaste || undefined,
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

    // Step 1: Find header row
    let headerRowIdx = -1;
    let headerMap: Record<string, number> = {};

    for (let r = 0; r < Math.min(10, rows.length); r++) {
      const row = rows[r];
      if (!row || !Array.isArray(row)) continue;

      const normRow = row.map(normalizeHeader);
      // Check if this row contains student name or sats indicators
      const hasName = normRow.some(
        (c) =>
          c.includes('studentname') ||
          c.includes('name') ||
          c.includes('candidatename') ||
          c.includes('nameofstudent')
      );
      const hasSatsOrClass = normRow.some(
        (c) =>
          c.includes('sats') ||
          c.includes('class') ||
          c.includes('std') ||
          c.includes('father') ||
          c.includes('admission')
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
      'name',
      'student',
    ]);
    const colMiddleName = findColIdx([
      'middlename',
      'middle',
      'studentmiddlename',
      'mname',
    ]);
    const colFatherName = findColIdx(['fathername', 'fathersname', 'father']);
    const colMotherName = findColIdx(['mothername', 'mothersname', 'mother']);
    const colClass = findColIdx(['class', 'standard', 'std', 'classstandard', 'admittedclass', 'currentclass', 'ತರಗತಿ']);
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
      'studentdob',
      'stddob',
      'dobddmmyyyy',
      'dateofbirthddmmyyyy',
      'birth',
    ]);
    const colSats = findColIdx(['satsno', 'satsnumber', 'satsid', 'sats', 'enrollmentno', 'studentid']);
    const colPen = findColIdx(['penno', 'pennumber', 'pen']);
    const colAadhar = findColIdx(['aadharno', 'aadhaarno', 'aadharnumber', 'aadhaar', 'uid', 'aadhar']);
    const colRegNo = findColIdx(['admissionno', 'schoolregno', 'regno', 'admissionnumber', 'registrationno']);
    const colAdmDate = findColIdx(['admissiondate', 'doa', 'dateofadmission']);
    const colReligion = findColIdx(['religion', 'ಧರ್ಮ']);
    const colCaste = findColIdx(['caste', 'category', 'socialcategory', 'ಜಾತಿ', 'ಪ್ರವರ್ಗ']);
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

        // User requirement: "When excel is imported to fetch or add students the middle name if available be taken as father name and placed in the column of father nme"
        let detectedMiddleName = rawMiddle;
        if (!detectedMiddleName) {
          const nameParts = rawName.split(/\s+/).filter(Boolean);
          if (nameParts.length >= 3) {
            detectedMiddleName = nameParts.slice(1, nameParts.length - 1).join(' ');
          }
        }

        // If middle name is available and father name is empty or unassigned, place middle name in father name
        if (detectedMiddleName && (!rawFather || rawFather.trim() === '' || rawFather === '-')) {
          rawFather = detectedMiddleName;
        }
        const rawClassVal = colClass !== -1 ? row[colClass] : sheetClassFallback;
        const classStandard = normalizeClass(rawClassVal || sheetClassFallback);
        const division = colDivision !== -1 ? normalizeDivision(row[colDivision]) : 'A';

        const satsNo = colSats !== -1 ? cleanNumberString(row[colSats]) : '';
        const penNo = colPen !== -1 ? cleanNumberString(row[colPen]) : '';
        const aadharNo = colAadhar !== -1 ? cleanNumberString(row[colAadhar]) : '';
        const schoolRegNo = colRegNo !== -1 ? cleanString(row[colRegNo]) : '';
        const admissionDate = colAdmDate !== -1 ? formatDateToDmy(row[colAdmDate]) || '01/06/2026' : '01/06/2026';

        // Format DOB in DD/MM/YYYY format as requested by user
        let formattedDob = '';
        if (colDob !== -1 && row[colDob]) {
          formattedDob = formatDateToDmy(row[colDob]);
        }
        if (!formattedDob) {
          // Default DOB: e.g. Class 1 is ~6 yrs old in 2026 -> 2020, Class 5 -> 2016
          const classInt = parseInt(classStandard, 10) || 5;
          const birthYear = 2026 - 5 - classInt;
          formattedDob = `01/06/${birthYear}`;
        }

        const religion = colReligion !== -1 ? normalizeReligion(row[colReligion]) : 'Hindu';
        const caste = colCaste !== -1 ? normalizeCaste(row[colCaste]) : 'GENERAL';
        const gender: 'Boy' | 'Girl' = colGender !== -1 ? normalizeGender(row[colGender]) : 'Boy';
        const cwsnStatus: CwsnStatus = colCwsn !== -1 ? normalizeCwsn(row[colCwsn]) : 'NO';

        const safeDise = (diseCode || schoolId || 'school').replace(/[^a-zA-Z0-9_-]/g, '_');
        const cleanSatsId = satsNo && satsNo !== 'N/A' && satsNo !== '-' ? satsNo.replace(/[^a-zA-Z0-9_-]/g, '_') : '';
        const id = cleanSatsId
          ? `std_${safeDise}_${cleanSatsId}`
          : `std_${safeDise}_${Date.now()}_${r}_${Math.random().toString(36).substring(2, 8)}`;

        const student: Student = {
          id,
          schoolId,
          diseCode,
          studentName: rawName.toUpperCase(),
          fatherName: (rawFather || '-').toUpperCase(),
          motherName: (rawMother || '-').toUpperCase(),
          classStandard,
          division,
          satsNo: satsNo || 'N/A',
          penNo: penNo || 'N/A',
          aadharNo: aadharNo || 'N/A',
          schoolRegNo: schoolRegNo || '',
          admissionDate,
          dob: formattedDob,
          dateOfBirth: formattedDob,
          religion,
          caste,
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
