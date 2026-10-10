/**
 * Student Store & Persistence Service
 * Firebase Firestore is the Authoritative Single Source of Truth
 * Structure: schools/{diseCode}/students/{studentId}
 */

import { Student, StudentClass, StudentDivision, CwsnStatus, StudentCaste, StudentReligion } from '../types';
import { db } from '../lib/firebase';
import { formatDateToDmy } from './satsExcelParser';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';

export const cleanForFirestore = <T extends Record<string, any>>(obj: T): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (typeof value === 'number' && isNaN(value)) {
        continue;
      }
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = cleanForFirestore(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
};

// One-time sanitization: Ensure 29010409301 login data is completely nil as requested
if (typeof window !== 'undefined') {
  try {
    const isReset29010409301 = localStorage.getItem('kseab_reset_29010409301_v3');
    if (!isReset29010409301) {
      localStorage.setItem('kseab_reset_29010409301_v3', 'true');
      localStorage.setItem('kseab_cleared_29010409301', 'true');
      Object.keys(localStorage).forEach((key) => {
        if (key.includes('29010409301')) {
          if (
            key.includes('student') ||
            key.includes('mark') ||
            key.includes('deleted') ||
            key.includes('initialized')
          ) {
            localStorage.removeItem(key);
          }
        }
      });
      localStorage.setItem('kseab_cleared_29010409301', 'true');
    }
  } catch (_) {}
}

const getStorageKey = (diseCode: string, academicYear?: string) => {
  return academicYear ? `kseab_students_${diseCode}_${academicYear}` : `kseab_students_${diseCode}`;
};

export const getStudentsFromLocal = (diseCode: string, academicYear?: string): Student[] => {
  try {
    const isExplicitlyCleared = localStorage.getItem(`kseab_cleared_${diseCode}`) === 'true';
    if (isExplicitlyCleared) {
      return [];
    }

    // 1. Try academicYear specific key first if specified
    if (academicYear) {
      const yearRaw = localStorage.getItem(getStorageKey(diseCode, academicYear));
      if (yearRaw) {
        const parsedYear = JSON.parse(yearRaw);
        if (Array.isArray(parsedYear)) {
          return parsedYear;
        }
      }
    }

    // 2. Default to general key
    const raw = localStorage.getItem(getStorageKey(diseCode));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (academicYear) {
          return parsed.filter((s: Student) => s.academicYear === academicYear);
        }
        return parsed;
      }
    }

    // 3. Only seed sample students on FIRST EVER launch if demo account
    const hasInitialRun = localStorage.getItem(`kseab_initialized_${diseCode}`) === 'true';
    if (!hasInitialRun && (diseCode === '29010100101' || diseCode.startsWith('demo') || diseCode.startsWith('DEMO'))) {
      localStorage.setItem(`kseab_initialized_${diseCode}`, 'true');
      const sample = generateSampleSchoolStudents(diseCode, diseCode, academicYear);
      saveStudentsToLocal(diseCode, sample, academicYear);
      return sample;
    }

    return [];
  } catch (err) {
    console.warn('Error reading students from local cache:', err);
    return [];
  }
};

export const saveStudentsToLocal = (diseCode: string, students: Student[], academicYear?: string): void => {
  try {
    localStorage.setItem(getStorageKey(diseCode), JSON.stringify(students));
    if (academicYear) {
      localStorage.setItem(getStorageKey(diseCode, academicYear), JSON.stringify(students));
    }
  } catch (err) {
    console.warn('Error updating local student cache:', err);
  }
};

export const generateSampleSchoolStudents = (
  schoolId: string,
  diseCode: string,
  academicYear: string = '2026-27',
  schoolRange?: string
): Student[] => {
  // If demo mode or range includes 10 / not specified, default to full KSEAB range 1-10
  const isDemoSchool = diseCode === '29010100101' || diseCode.startsWith('DEMO') || diseCode.startsWith('demo');
  const effectiveRange = isDemoSchool ? '1-10' : (schoolRange || '1-10');
  const classesToGenerate = getClassesFromRange(effectiveRange);

  // Compute a deterministic seed from academicYear so every academic year has a distinct, varied student distribution
  let yearSeed = 0;
  for (let i = 0; i < academicYear.length; i++) {
    yearSeed = ((yearSeed << 5) - yearSeed + academicYear.charCodeAt(i)) | 0;
  }
  const absYearSeed = Math.abs(yearSeed) || 42;

  // Extract start calendar year (e.g. 2026 from "2026-27") for realistic DOBs and admission dates
  const yearMatch = academicYear.match(/^(\d{4})/);
  const startYear = yearMatch ? parseInt(yearMatch[1], 10) : 2026;

  // Varied random counts per class (classes 1-10)
  // For each class, pseudorandomly vary boys (12 to 22) and girls (11 to 21) based on yearSeed and classNum
  const classTargetCounts: Record<string, { boys: number; girls: number }> = {};
  classesToGenerate.forEach((cls) => {
    const classNum = parseInt(cls, 10) || 1;
    const pseudo1 = Math.abs(Math.sin(absYearSeed * 17 + classNum * 31) * 10000);
    const pseudo2 = Math.abs(Math.cos(absYearSeed * 23 + classNum * 47) * 10000);
    const boys = 12 + (Math.floor(pseudo1) % 11); // 12 to 22 boys
    const girls = 11 + (Math.floor(pseudo2) % 11); // 11 to 21 girls
    classTargetCounts[cls] = { boys, girls };
  });

  const boyFirstNames = [
    'AARAV', 'BASAVARAJ', 'CHETAN', 'DEVENDRA', 'EASHWAR', 'GANGADHAR',
    'HANUMANTH', 'ISHWAR', 'JAGADISH', 'KUMAR', 'MANJUNATH', 'NAGARAJ',
    'PRAVEEN', 'RAHUL', 'SANTOSH', 'VINOD', 'VIJAY', 'SURESH', 'RAVI',
    'FARHAN', 'SALMAN', 'IMRAN', 'ZAID', 'ARBAAZ', 'SAMEER', 'AFTAB', 'NASIR', 'RIZWAN', 'USMAN'
  ];

  const girlFirstNames = [
    'SNEHA', 'PREETI', 'KAVYA', 'LAKSHMI', 'MEGHA', 'NETRA', 'PALLAVI',
    'RADHA', 'TANUJA', 'VIDYA', 'POOJA', 'ROHINI', 'SUSHMA', 'JYOTHI',
    'REKHA', 'SHREYA', 'SUNITA', 'DEEPA', 'PRIYANKA', 'ANANYA', 'ANITA',
    'KAVITA', 'SHILPA', 'SWATI', 'DEVIKA', 'SAVITA', 'AISHWARYA', 'BHAGYA'
  ];

  const lastNames = [
    'PATIL', 'PUJARI', 'VALMIKI', 'HIREMATH', 'NAYAK', 'BELLAD',
    'TALWAR', 'CHALUVADI', 'HUKKERI', 'YADAWAD', 'KULKARNI', 'KAMBLE',
    'MADAR', 'RATHOD', 'SHINDE', 'MARATHA', 'LAMANI', 'DEVADIGA',
    'BILAGI', 'DESAI', 'JOSHI', 'GOUDA', 'ANGADI', 'BADIGER',
    'BHOVI', 'KAMBAR', 'KORAGA', 'BYALI', 'KOLI', 'KABBUR',
    'INAMDAR', 'SHEIKH', 'MULLA', 'PATEL', 'BAGWAN', 'SAYED', 'PINJAR', 'SHAIKH', 'QURESHI', 'CHAPPARBAND'
  ];

  // Specific categories defined in Karnataka School Result Software:
  // SC, ST, OBC (Cat-1, 2A, 2B, 3A, 3B), and GM (General)
  const categoryCycle: Array<{ caste: StudentCaste; rel: StudentReligion }> = [
    { caste: 'SC', rel: 'Hindu' },
    { caste: 'ST', rel: 'Hindu' },
    { caste: '2A', rel: 'Hindu' },
    { caste: 'GM', rel: 'Hindu' },
    { caste: 'Cat-1', rel: 'Hindu' },
    { caste: 'SC', rel: 'Hindu' },
    { caste: '2B', rel: 'Muslim' },
    { caste: '3A', rel: 'Hindu' },
    { caste: 'ST', rel: 'Hindu' },
    { caste: 'GM', rel: 'Hindu' },
    { caste: '3B', rel: 'Hindu' },
    { caste: '2A', rel: 'Hindu' },
    { caste: 'SC', rel: 'Hindu' },
    { caste: 'GM', rel: 'Hindu' },
    { caste: 'Cat-1', rel: 'Hindu' },
    { caste: 'ST', rel: 'Hindu' },
    { caste: '2B', rel: 'Muslim' },
  ];

  const students: Student[] = [];
  let globalStudentIdx = 1;

  classesToGenerate.forEach((cls) => {
    const counts = classTargetCounts[cls] || { boys: 15, girls: 15 };
    const classNum = parseInt(cls, 10) || 5;

    // Generate boys for this class
    for (let b = 0; b < counts.boys; b++) {
      const bIdx = globalStudentIdx++;
      const fName = boyFirstNames[(b + classNum * 3) % boyFirstNames.length];
      const lName = lastNames[(b + classNum * 5) % lastNames.length];
      const cat = categoryCycle[(b + classNum * 2) % categoryCycle.length];
      const div: StudentDivision = b < Math.ceil(counts.boys / 2) ? 'A' : 'B';
      const cwsn: CwsnStatus = b === 2 && cls === '5' ? 'EXEMPTED' : 'NO';

      students.push({
        id: `std_${diseCode}_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_${cls}_${div}_${bIdx}`,
        schoolId: diseCode,
        diseCode: diseCode,
        studentName: `${fName} ${lName}`,
        fatherName: `${boyFirstNames[(b + 4) % boyFirstNames.length]} ${lName}`,
        motherName: `${girlFirstNames[(b + 6) % girlFirstNames.length]} ${lName}`,
        classStandard: cls,
        division: div,
        satsNo: `129038${String(4000 + bIdx).padStart(4, '0')}`,
        penNo: `202390${String(14000 + bIdx).padStart(5, '0')}`,
        aadharNo: `3849${String(10000000 + bIdx * 9123).slice(-8)}`,
        schoolRegNo: `${diseCode}/${cls}/${String(b + 1).padStart(3, '0')}`,
        admissionDate: `01/06/${startYear - 1}`,
        dob: `15/05/${startYear - (classNum + 5)}`,
        dateOfBirth: `15/05/${startYear - (classNum + 5)}`,
        religion: cat.rel,
        caste: cat.caste,
        gender: 'Boy',
        cwsnStatus: cwsn,
        academicYear,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Generate girls for this class
    for (let g = 0; g < counts.girls; g++) {
      const gIdx = globalStudentIdx++;
      const fName = girlFirstNames[(g + classNum * 4) % girlFirstNames.length];
      const lName = lastNames[(g + classNum * 7) % lastNames.length];
      const cat = categoryCycle[(g + classNum * 3 + 1) % categoryCycle.length];
      const div: StudentDivision = g < Math.ceil(counts.girls / 2) ? 'A' : 'B';
      const cwsn: CwsnStatus = g === 3 && cls === '5' ? 'MARKS_ALLOWED' : 'NO';

      students.push({
        id: `std_${diseCode}_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_${cls}_${div}_${gIdx}`,
        schoolId: diseCode,
        diseCode: diseCode,
        studentName: `${fName} ${lName}`,
        fatherName: `${boyFirstNames[(g + 5) % boyFirstNames.length]} ${lName}`,
        motherName: `${girlFirstNames[(g + 8) % girlFirstNames.length]} ${lName}`,
        classStandard: cls,
        division: div,
        satsNo: `129038${String(4000 + gIdx).padStart(4, '0')}`,
        penNo: `202390${String(14000 + gIdx).padStart(5, '0')}`,
        aadharNo: `3849${String(10000000 + gIdx * 9123).slice(-8)}`,
        schoolRegNo: `${diseCode}/${cls}/${String(counts.boys + g + 1).padStart(3, '0')}`,
        admissionDate: `01/06/${startYear - 1}`,
        dob: `20/08/${startYear - (classNum + 5)}`,
        dateOfBirth: `20/08/${startYear - (classNum + 5)}`,
        religion: cat.rel,
        caste: cat.caste,
        gender: 'Girl',
        cwsnStatus: cwsn,
        academicYear,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  });

  return students;
};

/**
 * Normalizes all student date fields strictly into DD/MM/YYYY format,
 * fixing any accidental 5-digit years (such as 20110) or ISO YYYY-MM-DD formats.
 */
export const normalizeStudentDates = (st: Student): Student => {
  const normDob = st.dob ? formatDateToDmy(st.dob) : st.dateOfBirth ? formatDateToDmy(st.dateOfBirth) : '';
  const normAdm = st.admissionDate ? formatDateToDmy(st.admissionDate) : '01/06/2025';
  return {
    ...st,
    dob: normDob,
    dateOfBirth: normDob,
    admissionDate: normAdm,
  };
};

/**
 * Loads students primarily from Firebase Firestore.
 * Subscribes to changes or fetches once.
 */
export const loadSchoolStudents = async (
  schoolIdOrDise: string,
  explicitDise?: string,
  academicYear?: string,
  schoolRange?: string
): Promise<Student[]> => {
  const diseCode = explicitDise || schoolIdOrDise;
  if (!diseCode) return [];

  const filterByYear = (list: Student[]) => {
    const normalized = list.map(normalizeStudentDates);
    if (!academicYear) return normalized;
    return normalized.filter((s) => s.academicYear === academicYear || (!s.academicYear && academicYear === '2026-27'));
  };

  try {
    // 1. Try reading directly from Firestore at schools/{diseCode}/students
    const colRef = collection(db, 'schools', diseCode, 'students');
    const snap = await getDocs(colRef);

    if (!snap.empty) {
      const firestoreStudents: Student[] = [];
      snap.forEach((d) => {
        firestoreStudents.push(normalizeStudentDates(d.data() as Student));
      });

      const yearFiltered = filterByYear(firestoreStudents);
      saveStudentsToLocal(diseCode, yearFiltered, academicYear);
      return yearFiltered;
    }

    // If empty at schools/{diseCode}/students, check if stored under schools/{schoolIdOrDise}/students
    if (schoolIdOrDise !== diseCode) {
      const altColRef = collection(db, 'schools', schoolIdOrDise, 'students');
      const altSnap = await getDocs(altColRef);
      if (!altSnap.empty) {
        const altStudents: Student[] = [];
        altSnap.forEach((d) => {
          altStudents.push(normalizeStudentDates(d.data() as Student));
        });
        const altFiltered = filterByYear(altStudents);
        saveStudentsToLocal(diseCode, altFiltered, academicYear);
        return altFiltered;
      }
    }

    // If cleared, do not migrate and do not generate sample students
    if (
      localStorage.getItem(`kseab_cleared_${diseCode}`) === 'true' ||
      localStorage.getItem(`kseab_cleared_${schoolIdOrDise}`) === 'true'
    ) {
      return [];
    }

    // 2. Safe Migration Check: If Firestore is empty, but local storage had students from an earlier session:
    const localList = getStudentsFromLocal(diseCode, academicYear);
    if (localList.length > 0) {
      console.info(`Migrating ${localList.length} local students to Firestore for DISE: ${diseCode}`);
      // Directly persist to Firestore without recursive loadSchoolStudents calls
      try {
        const batch = writeBatch(db);
        localList.slice(0, 450).forEach((st) => {
          const cleanId = (st.id || `std_${diseCode}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`)
            .replace(/[^a-zA-Z0-9_-]/g, '_');
          const ref = doc(db, 'schools', diseCode, 'students', cleanId);
          batch.set(ref, cleanForFirestore({ ...st, id: cleanId, diseCode, schoolId: diseCode }), { merge: true });
        });
        await batch.commit();
      } catch (migErr) {
        console.warn('Local-to-Firestore migration batch notice:', migErr);
      }
      return filterByYear(localList);
    }

    // 3. For Govt Model School demo accounts (29010100101 only), seed standard roster for all classes
    const hasInitialRun = localStorage.getItem(`kseab_initialized_${diseCode}`) === 'true';
    if (!hasInitialRun && (diseCode === '29010100101' || diseCode.startsWith('demo') || diseCode.startsWith('DEMO'))) {
      localStorage.setItem(`kseab_initialized_${diseCode}`, 'true');
      const sample = generateSampleSchoolStudents(diseCode, diseCode, academicYear, schoolRange);
      saveStudentsToLocal(diseCode, sample, academicYear);
      try {
        const batch = writeBatch(db);
        sample.forEach((st) => {
          const cleanId = st.id.replace(/[^a-zA-Z0-9_-]/g, '_');
          const ref = doc(db, 'schools', diseCode, 'students', cleanId);
          batch.set(ref, cleanForFirestore({ ...st, id: cleanId, diseCode, schoolId: diseCode }), { merge: true });
        });
        await batch.commit();
      } catch (_) {}
      return filterByYear(sample);
    }

    return [];
  } catch (err) {
    console.warn('Firestore loadSchoolStudents error, falling back to local cache:', err);
    return filterByYear(getStudentsFromLocal(diseCode, academicYear));
  }
};

/**
 * Real-time listener for school students
 */
export const subscribeSchoolStudents = (
  diseCode: string,
  onUpdate: (students: Student[]) => void,
  onError?: (error: Error) => void,
  academicYear?: string
): (() => void) => {
  if (!diseCode) return () => {};

  const colRef = collection(db, 'schools', diseCode, 'students');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: Student[] = [];
      snap.forEach((d) => {
        list.push(normalizeStudentDates(d.data() as Student));
      });
      if (academicYear) {
        const yearFiltered = list.filter((s) => s.academicYear === academicYear || (!s.academicYear && academicYear === '2026-27'));
        saveStudentsToLocal(diseCode, yearFiltered, academicYear);
        onUpdate(yearFiltered);
      } else {
        saveStudentsToLocal(diseCode, list);
        onUpdate(list);
      }
    },
    (err) => {
      console.warn('Real-time student listener notice:', err);
      if (onError) onError(err);
      onUpdate(getStudentsFromLocal(diseCode, academicYear).map(normalizeStudentDates));
    }
  );
};

/**
 * Save / Update a single student in Firestore
 */
export const saveStudent = async (student: Student, academicYear?: string): Promise<Student> => {
  const normStudent = normalizeStudentDates(student);
  const diseCode = normStudent.diseCode;
  const cleanId = (normStudent.id || `std_${diseCode}_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  const studentDoc: Student = {
    ...normStudent,
    id: cleanId,
    schoolId: diseCode,
    academicYear: academicYear || normStudent.academicYear || '2026-27',
    updatedAt: new Date().toISOString(),
  };

  const firestoreData = cleanForFirestore(studentDoc);

  // 1. Write to Firestore safely
  localStorage.removeItem(`kseab_cleared_${diseCode}`);
  try {
    const docRef = doc(db, 'schools', diseCode, 'students', cleanId);
    await setDoc(docRef, firestoreData, { merge: true });
    // Also ensure school doc exists
    const schoolDocRef = doc(db, 'schools', diseCode);
    await setDoc(schoolDocRef, { diseCode, schoolId: diseCode, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Firestore saveStudent network notice (stored in local cache):', err);
  }

  // 2. Update local cache
  const current = getStudentsFromLocal(diseCode, studentDoc.academicYear);
  const existingIdx = current.findIndex(
    (s) => s.id === cleanId || (s.satsNo && s.satsNo !== 'N/A' && s.satsNo === student.satsNo)
  );

  let updatedList: Student[];
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = studentDoc;
  } else {
    updatedList = [studentDoc, ...current];
  }
  saveStudentsToLocal(diseCode, updatedList, studentDoc.academicYear);

  return studentDoc;
};

/**
 * Bulk save students (e.g. from Excel SATS import) directly into Firestore
 * with deduplication and cross-device persistence.
 */
export const saveBulkStudents = async (
  newStudents: Student[],
  schoolId: string,
  diseCode: string,
  academicYear?: string
): Promise<number> => {
  const targetDise = (diseCode && diseCode !== '00000000000' ? diseCode : schoolId) || '29010100101';
  if (!targetDise || newStudents.length === 0) return 0;

  localStorage.removeItem(`kseab_cleared_${targetDise}`);
  if (schoolId) {
    localStorage.removeItem(`kseab_cleared_${schoolId}`);
  }

  const currentYear = academicYear || newStudents[0]?.academicYear || '2026-27';

  // Read existing to deduplicate by SATS No or Student ID without recursion
  const existingList = getStudentsFromLocal(targetDise, currentYear);
  const studentMap = new Map<string, Student>();
  const satsMap = new Map<string, string>(); // satsNo -> existing student id

  existingList.forEach((s) => {
    studentMap.set(s.id, s);
    if (s.satsNo && s.satsNo !== 'N/A' && s.satsNo !== '-') {
      satsMap.set(s.satsNo, s.id);
    }
  });

  const studentsToWrite: Student[] = [];

  newStudents.forEach((student, idx) => {
    const norm = normalizeStudentDates(student);
    const rawId = norm.id || `std_${targetDise}_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`;
    const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');

    const cleanStudent: Student = {
      ...norm,
      id: cleanId,
      schoolId: targetDise,
      diseCode: targetDise,
      academicYear: currentYear,
      updatedAt: new Date().toISOString(),
    };

    // Fast Match existing by SATS No if valid
    const existingId = cleanStudent.satsNo && cleanStudent.satsNo !== 'N/A' && cleanStudent.satsNo !== '-'
      ? satsMap.get(cleanStudent.satsNo)
      : undefined;

    if (existingId && studentMap.has(existingId)) {
      const existingObj = studentMap.get(existingId)!;
      const mergedStudent = { ...existingObj, ...cleanStudent, id: existingId };
      studentMap.set(existingId, mergedStudent);
      studentsToWrite.push(mergedStudent);
    } else {
      studentMap.set(cleanStudent.id, cleanStudent);
      if (cleanStudent.satsNo && cleanStudent.satsNo !== 'N/A' && cleanStudent.satsNo !== '-') {
        satsMap.set(cleanStudent.satsNo, cleanStudent.id);
      }
      studentsToWrite.push(cleanStudent);
    }
  });

  const merged = Array.from(studentMap.values());
  saveStudentsToLocal(targetDise, merged, currentYear);

  // Write only newly imported or updated students to Firestore in batches of up to 350 documents
  const chunks: Student[][] = [];
  for (let i = 0; i < studentsToWrite.length; i += 350) {
    chunks.push(studentsToWrite.slice(i, i + 350));
  }

  for (const chunk of chunks) {
    try {
      const batch = writeBatch(db);
      chunk.forEach((st) => {
        const cleanDocId = st.id.replace(/[^a-zA-Z0-9_-]/g, '_');
        const ref = doc(db, 'schools', targetDise, 'students', cleanDocId);
        batch.set(ref, cleanForFirestore(st), { merge: true });
      });
      await batch.commit();
      console.log(`Successfully synced ${chunk.length} students to Firestore schools/${targetDise}/students`);
    } catch (batchErr) {
      console.warn('Firestore bulk batch sync notice, trying individual documents:', batchErr);
      // Fallback: Individual setDoc
      for (const st of chunk) {
        try {
          const cleanDocId = st.id.replace(/[^a-zA-Z0-9_-]/g, '_');
          const ref = doc(db, 'schools', targetDise, 'students', cleanDocId);
          await setDoc(ref, cleanForFirestore(st), { merge: true });
        } catch (indErr) {
          console.warn(`Could not sync student ${st.studentName} to Firestore:`, indErr);
        }
      }
    }
  }

  // Ensure parent school record exists in Firestore for cross-device authentication and lookup
  try {
    const schoolRef = doc(db, 'schools', targetDise);
    await setDoc(
      schoolRef,
      {
        diseCode: targetDise,
        schoolId: targetDise,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (schoolErr) {
    console.warn('School document ensure notice:', schoolErr);
  }

  return newStudents.length;
};

/**
 * Extracts the highest class offered by the school based on schoolRange
 * (e.g. "1 ರಿಂದ 10 ನೇ ತರಗತಿ" -> 10, "1 ರಿಂದ 8 ನೇ ತರಗತಿ" -> 8, "1 ರಿಂದ 5 ನೇ ತರಗತಿ" -> 5)
 */
export const getHighestClassFromRange = (schoolRange?: string): number => {
  if (!schoolRange) return 10;
  const matches = schoolRange.match(/\d+/g);
  if (matches && matches.length > 0) {
    const nums = matches.map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));
    if (nums.length > 0) {
      return Math.max(...nums);
    }
  }
  return 10;
};

/**
 * Returns all configured classes offered by the school based on schoolRange
 * (e.g. "1 ರಿಂದ 5 ನೇ ತರಗತಿ" -> ['1', '2', '3', '4', '5']
 *  "1 ರಿಂದ 7 ನೇ ತರಗತಿ" -> ['1', '2', '3', '4', '5', '6', '7']
 *  "1 ರಿಂದ 8 ನೇ ತರಗತಿ" -> ['1', '2', '3', '4', '5', '6', '7', '8']
 *  "1 ರಿಂದ 10 ನೇ ತರಗತಿ" -> ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
 *  "8 ರಿಂದ 10 ನೇ ತರಗತಿ" -> ['8', '9', '10'])
 */
export const getClassesFromRange = (schoolRange?: string): StudentClass[] => {
  if (!schoolRange) return ['1', '2', '3', '4', '5', '6', '7', '8'];
  const matches = schoolRange.match(/\d+/g);
  if (matches && matches.length > 0) {
    const nums = matches.map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));
    if (nums.length > 0) {
      const minClass = Math.min(...nums);
      const maxClass = Math.max(...nums);
      const classes: StudentClass[] = [];
      for (let c = minClass; c <= maxClass; c++) {
        classes.push(String(c) as StudentClass);
      }
      return classes;
    }
  }
  return ['1', '2', '3', '4', '5', '6', '7', '8'];
};

/**
 * Promote students from one academic year to the next:
 * Based on the school profile range (e.g. 1-10 or 1-8):
 * - Students strictly below highest class are promoted to curClass + 1
 * - Only students in the highest class (e.g. Class 10 for 1-10 school, or Class 8 for 1-8 school) pass out!
 * Promoted students are stored under the new academic year without deleting the previous year's records.
 */
export const promoteStudentsToNextAcademicYear = async (
  diseCode: string,
  fromYear: string,
  toYear: string,
  schoolRange?: string
): Promise<{ promotedCount: number; passedOutCount: number }> => {
  const currentStudents = getStudentsFromLocal(diseCode, fromYear);
  if (currentStudents.length === 0) {
    return { promotedCount: 0, passedOutCount: 0 };
  }

  // Backup current state for rollback
  try {
    localStorage.setItem(`kseab_rollback_${diseCode}_${fromYear}_to_${toYear}`, JSON.stringify(currentStudents));
  } catch (_) {}

  // Determine highest class from the school's configured class range
  const highestClass = getHighestClassFromRange(schoolRange);

  const promotedList: Student[] = [];
  let passedOutCount = 0;
  const cleanToYearId = toYear.replace(/[^a-zA-Z0-9]/g, '');

  for (const st of currentStudents) {
    const curClassNum = parseInt(st.classStandard, 10);
    if (isNaN(curClassNum)) continue;

    // Only students who have reached or exceeded the highest class of the school pass out!
    if (curClassNum >= highestClass) {
      passedOutCount++;
    } else {
      const nextClass = String(curClassNum + 1) as StudentClass;
      // Use year-isolated ID so the previous academic year's student record is preserved in Firestore
      const satsOrOldId = st.satsNo && st.satsNo !== 'N/A' ? st.satsNo : st.id.replace(/^std_[^_]+_/, '');
      const promotedStudent: Student = {
        ...st,
        id: `std_${diseCode}_${cleanToYearId}_${satsOrOldId}`,
        classStandard: nextClass,
        academicYear: toYear,
        updatedAt: new Date().toISOString(),
      };
      promotedList.push(promotedStudent);
    }
  }

  // Preserve previous year's student records in local cache
  saveStudentsToLocal(diseCode, currentStudents, fromYear);

  // Save promoted list under the new academic year
  saveStudentsToLocal(diseCode, promotedList, toYear);
  // Also set the general active cache to the promoted students
  saveStudentsToLocal(diseCode, promotedList);

  await saveBulkStudents(promotedList, diseCode, diseCode, toYear).catch(() => {});

  return { promotedCount: promotedList.length, passedOutCount };
};

/**
 * Rollback student promotion from toYear back to fromYear
 */
export const rollbackStudentPromotion = async (
  diseCode: string,
  fromYear: string,
  toYear: string
): Promise<number> => {
  const backupKey = `kseab_rollback_${diseCode}_${fromYear}_to_${toYear}`;
  const rawBackup = localStorage.getItem(backupKey);
  if (!rawBackup) {
    throw new Error('No previous backup found for this promotion.');
  }

  const restoredStudents: Student[] = JSON.parse(rawBackup);
  saveStudentsToLocal(diseCode, restoredStudents, fromYear);
  // Clear or reset new year's students
  localStorage.removeItem(getStorageKey(diseCode, toYear));

  await saveBulkStudents(restoredStudents, diseCode, diseCode, fromYear).catch(() => {});
  return restoredStudents.length;
};

const getDeletedStorageKey = (diseCode: string) => `kseab_deleted_students_${diseCode}`;

export const getDeletedStudentsFromLocal = (diseCode: string): Student[] => {
  try {
    const raw = localStorage.getItem(getDeletedStorageKey(diseCode));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading deleted students from local cache:', err);
    return [];
  }
};

export const saveDeletedStudentsToLocal = (diseCode: string, students: Student[]): void => {
  try {
    localStorage.setItem(getDeletedStorageKey(diseCode), JSON.stringify(students));
  } catch (err) {
    console.warn('Error saving deleted students to local cache:', err);
  }
};

/**
 * Loads deleted students from Dropbox (Firestore / Local cache)
 */
export const loadDeletedStudents = async (diseCode: string): Promise<Student[]> => {
  if (!diseCode) return [];
  try {
    const colRef = collection(db, 'schools', diseCode, 'deletedStudents');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: Student[] = [];
      snap.forEach((d) => list.push(d.data() as Student));
      saveDeletedStudentsToLocal(diseCode, list);
      return list;
    }
  } catch (err) {
    console.warn('Firestore loadDeletedStudents notice:', err);
  }
  return getDeletedStudentsFromLocal(diseCode);
};

/**
 * Delete student from Firestore: moves to Dropbox (deletedStudents) so they can be revoked later
 */
export const deleteStudent = async (
  studentId: string,
  schoolId: string,
  diseCode: string,
  academicYear?: string
): Promise<boolean> => {
  const targetDise = diseCode || schoolId;

  // Find the student to back up (try academicYear cache first, then general cache)
  const current = getStudentsFromLocal(targetDise, academicYear);
  let studentToBackup = current.find((s) => s.id === studentId);
  if (!studentToBackup) {
    const general = getStudentsFromLocal(targetDise);
    studentToBackup = general.find((s) => s.id === studentId);
  }

  try {
    if (studentToBackup) {
      // Save to Firestore deletedStudents collection
      await setDoc(doc(db, 'schools', targetDise, 'deletedStudents', studentId), {
        ...studentToBackup,
        deletedAt: new Date().toISOString(),
      });
      // Save to local deleted students
      const deletedLocal = getDeletedStudentsFromLocal(targetDise);
      saveDeletedStudentsToLocal(targetDise, [
        ...deletedLocal.filter((s) => s.id !== studentId),
        studentToBackup,
      ]);
    }

    await deleteDoc(doc(db, 'schools', targetDise, 'students', studentId));
  } catch (err) {
    console.warn('Firestore deleteDoc notice (continuing local removal):', err);
    if (studentToBackup) {
      const deletedLocal = getDeletedStudentsFromLocal(targetDise);
      saveDeletedStudentsToLocal(targetDise, [
        ...deletedLocal.filter((s) => s.id !== studentId),
        studentToBackup,
      ]);
    }
  }

  // Update year-specific and general active caches
  const filtered = current.filter((s) => s.id !== studentId);
  saveStudentsToLocal(targetDise, filtered, academicYear);
  const generalFiltered = getStudentsFromLocal(targetDise).filter((s) => s.id !== studentId);
  saveStudentsToLocal(targetDise, generalFiltered);

  return true;
};

/**
 * Revoke / Restore a deleted student from the Dropbox back to active students
 */
export const revokeDeletedStudent = async (
  studentId: string,
  diseCode: string
): Promise<boolean> => {
  const targetDise = diseCode;
  const deletedLocal = getDeletedStudentsFromLocal(targetDise);
  let studentToRestore = deletedLocal.find((s) => s.id === studentId);

  try {
    if (!studentToRestore) {
      const snap = await doc(db, 'schools', targetDise, 'deletedStudents', studentId);
      // fetch if needed
    }

    if (studentToRestore) {
      // Restore into active students in Firestore
      await setDoc(doc(db, 'schools', targetDise, 'students', studentId), studentToRestore);
      // Remove from deletedStudents in Firestore
      await deleteDoc(doc(db, 'schools', targetDise, 'deletedStudents', studentId)).catch(() => {});

      // Update active local students
      const active = getStudentsFromLocal(targetDise);
      saveStudentsToLocal(targetDise, [...active.filter((s) => s.id !== studentId), studentToRestore]);

      // Remove from deleted local
      saveDeletedStudentsToLocal(targetDise, deletedLocal.filter((s) => s.id !== studentId));
      return true;
    }
  } catch (err) {
    console.error('Error revoking deleted student:', err);
    throw new Error('Unable to restore student. Please check internet connection.');
  }
  return false;
};

/**
 * Permanently delete student from Dropbox
 */
export const permanentlyDeleteStudent = async (
  studentId: string,
  diseCode: string
): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'schools', diseCode, 'deletedStudents', studentId)).catch(() => {});
    const deletedLocal = getDeletedStudentsFromLocal(diseCode);
    saveDeletedStudentsToLocal(diseCode, deletedLocal.filter((s) => s.id !== studentId));
    return true;
  } catch (err) {
    console.error('Error permanently deleting student:', err);
    return false;
  }
};

/**
 * Permanently delete multiple selected students from Dropbox
 */
export const permanentlyDeleteMultipleStudents = async (
  studentIds: string[],
  diseCode: string
): Promise<boolean> => {
  if (!studentIds || studentIds.length === 0) return true;
  try {
    const idSet = new Set(studentIds);
    // Delete in Firestore batch or individual calls
    const batch = writeBatch(db);
    studentIds.slice(0, 450).forEach((id) => {
      const ref = doc(db, 'schools', diseCode, 'deletedStudents', id);
      batch.delete(ref);
    });
    await batch.commit().catch(() => {});

    const deletedLocal = getDeletedStudentsFromLocal(diseCode);
    saveDeletedStudentsToLocal(diseCode, deletedLocal.filter((s) => !idSet.has(s.id)));
    return true;
  } catch (err) {
    console.error('Error bulk permanently deleting students:', err);
    return false;
  }
};

/**
 * Clear all students in Dropbox at once (empty recycling bin permanently)
 */
export const clearAllDeletedStudents = async (
  diseCode: string
): Promise<boolean> => {
  try {
    const colRef = collection(db, 'schools', diseCode, 'deletedStudents');
    const snap = await getDocs(colRef).catch(() => null);
    if (snap && !snap.empty) {
      const batch = writeBatch(db);
      snap.docs.slice(0, 450).forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit().catch(() => {});
    }
    saveDeletedStudentsToLocal(diseCode, []);
    return true;
  } catch (err) {
    console.error('Error clearing all deleted students:', err);
    return false;
  }
};

/**
 * Clear students for a specific class (moves to Dropbox for safety and recovery)
 */
export const clearStudentsByClass = async (
  classStandard: StudentClass,
  schoolId: string,
  diseCode: string,
  academicYear?: string,
  providedStudents?: Student[]
): Promise<number> => {
  const targetDise = (diseCode && diseCode !== '00000000000' ? diseCode : schoolId) || '29010100101';
  let current = providedStudents && providedStudents.length > 0 ? [...providedStudents] : [];
  if (current.length === 0) {
    current = getStudentsFromLocal(targetDise, academicYear);
  }
  if (current.length === 0) {
    current = getStudentsFromLocal(targetDise);
  }

  const studentsToClear = current.filter((s) => s.classStandard === classStandard);
  if (studentsToClear.length === 0) return 0;

  // 1. Immediately update Local Storage synchronously so UI updates with zero delay
  const remaining = current.filter((s) => s.classStandard !== classStandard);
  saveStudentsToLocal(targetDise, remaining, academicYear);
  saveStudentsToLocal(targetDise, remaining);

  const deletedLocal = getDeletedStudentsFromLocal(targetDise);
  const updatedDeletedLocal = [...deletedLocal];
  for (const st of studentsToClear) {
    if (!updatedDeletedLocal.some((d) => d.id === st.id)) {
      updatedDeletedLocal.push({
        ...st,
        deletedAt: new Date().toISOString(),
      });
    }
  }
  saveDeletedStudentsToLocal(targetDise, updatedDeletedLocal);

  // 2. Persist to Firestore in background / batch
  try {
    const colRef = collection(db, 'schools', targetDise, 'students');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const batch = writeBatch(db);
      let batchCount = 0;
      snap.forEach((d) => {
        const data = d.data() as Student;
        if (data.classStandard === classStandard) {
          batch.delete(d.ref);
          batchCount++;
        }
      });
      if (batchCount > 0) {
        await batch.commit();
      }
    }

    // Save to deletedStudents in batch
    for (let i = 0; i < studentsToClear.length; i += 300) {
      const delBatch = writeBatch(db);
      const chunk = studentsToClear.slice(i, i + 300);
      chunk.forEach((st) => {
        const ref = doc(db, 'schools', targetDise, 'deletedStudents', st.id);
        delBatch.set(ref, {
          ...st,
          deletedAt: new Date().toISOString(),
        }, { merge: true });
      });
      await delBatch.commit().catch(() => {});
    }
  } catch (err) {
    console.warn('Firestore clearStudentsByClass query/delete notice:', err);
  }

  return studentsToClear.length;
};

/**
 * Clear all students from all classes (moves to Dropbox for safety and recovery)
 */
export const clearAllStudents = async (
  schoolId: string,
  diseCode: string,
  academicYear?: string,
  providedStudents?: Student[]
): Promise<number> => {
  const targetDise = (diseCode && diseCode !== '00000000000' ? diseCode : schoolId) || '29010100101';
  
  // 1. Mark explicitly cleared in all key variations immediately
  localStorage.setItem(`kseab_cleared_${targetDise}`, 'true');
  if (schoolId) {
    localStorage.setItem(`kseab_cleared_${schoolId}`, 'true');
  }

  let allToDelete: Student[] = providedStudents && providedStudents.length > 0 ? [...providedStudents] : [];
  if (allToDelete.length === 0) {
    allToDelete = getStudentsFromLocal(targetDise, academicYear);
  }
  if (allToDelete.length === 0) {
    allToDelete = getStudentsFromLocal(targetDise);
  }

  // 2. Clear Local Storage IMMEDIATELY so the view updates instantly
  saveStudentsToLocal(targetDise, [], academicYear);
  saveStudentsToLocal(targetDise, []);
  if (schoolId && schoolId !== targetDise) {
    saveStudentsToLocal(schoolId, [], academicYear);
    saveStudentsToLocal(schoolId, []);
  }

  // Move to local deleted / dropbox immediately
  const deletedLocal = getDeletedStudentsFromLocal(targetDise);
  const updatedDeletedLocal = [...deletedLocal];
  for (const st of allToDelete) {
    if (!updatedDeletedLocal.some((d) => d.id === st.id)) {
      updatedDeletedLocal.push({
        ...st,
        deletedAt: new Date().toISOString(),
      });
    }
  }
  saveDeletedStudentsToLocal(targetDise, updatedDeletedLocal);

  // 3. Batch delete from Firestore & save to deletedStudents
  try {
    const colRef = collection(db, 'schools', targetDise, 'students');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const docs = snap.docs;
      for (let i = 0; i < docs.length; i += 400) {
        const batch = writeBatch(db);
        docs.slice(i, i + 400).forEach((docSnap) => batch.delete(docSnap.ref));
        await batch.commit().catch(() => {});
      }
    }

    // Save all to deletedStudents in Firestore batch
    for (let i = 0; i < allToDelete.length; i += 300) {
      const delBatch = writeBatch(db);
      const chunk = allToDelete.slice(i, i + 300);
      chunk.forEach((st) => {
        const ref = doc(db, 'schools', targetDise, 'deletedStudents', st.id);
        delBatch.set(ref, {
          ...st,
          deletedAt: new Date().toISOString(),
        }, { merge: true });
      });
      await delBatch.commit().catch(() => {});
    }
  } catch (err) {
    console.warn('Firestore clearAllStudents query/batch delete notice:', err);
  }

  return allToDelete.length;
};

/**
 * 🔴 RESET ALL DATA: Complete School Data Reset
 * Resets only the current school's students, marks, results, and local caches,
 * keeping the school profile & login credentials intact.
 */
export const resetSchoolAllData = async (
  schoolId: string,
  diseCode: string,
  academicYear?: string
): Promise<{ success: boolean; clearedStudents: number }> => {
  const targetDise = (diseCode && diseCode !== '00000000000' ? diseCode : schoolId) || '29010100101';

  // 1. Mark explicitly cleared
  localStorage.setItem(`kseab_cleared_${targetDise}`, 'true');
  if (schoolId) {
    localStorage.setItem(`kseab_cleared_${schoolId}`, 'true');
  }

  // 2. Clear Students cache
  const existingStudents = getStudentsFromLocal(targetDise, academicYear);
  const clearedCount = existingStudents.length;

  saveStudentsToLocal(targetDise, [], academicYear);
  saveStudentsToLocal(targetDise, []);
  saveDeletedStudentsToLocal(targetDise, []);

  // 3. Clear Marks cache
  try {
    localStorage.removeItem(`kseab_marks_${targetDise}`);
    localStorage.removeItem(`kseab_marks_${targetDise}_${academicYear}`);
    if (schoolId) {
      localStorage.removeItem(`kseab_marks_${schoolId}`);
      localStorage.removeItem(`kseab_marks_${schoolId}_${academicYear}`);
    }
  } catch (_) {}

  // 4. Clear Firestore students & marks
  try {
    const stdCol = collection(db, 'schools', targetDise, 'students');
    const stdSnap = await getDocs(stdCol);
    if (!stdSnap.empty) {
      for (let i = 0; i < stdSnap.docs.length; i += 400) {
        const batch = writeBatch(db);
        stdSnap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit().catch(() => {});
      }
    }

    const marksCol = collection(db, 'schools', targetDise, 'marks');
    const marksSnap = await getDocs(marksCol);
    if (!marksSnap.empty) {
      for (let i = 0; i < marksSnap.docs.length; i += 400) {
        const batch = writeBatch(db);
        marksSnap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit().catch(() => {});
      }
    }

    const delCol = collection(db, 'schools', targetDise, 'deletedStudents');
    const delSnap = await getDocs(delCol);
    if (!delSnap.empty) {
      for (let i = 0; i < delSnap.docs.length; i += 400) {
        const batch = writeBatch(db);
        delSnap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit().catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Firestore resetSchoolAllData notice:', err);
  }

  return { success: true, clearedStudents: clearedCount };
};

export const exportStudentsToExcel = (students: Student[], schoolName: string) => {
  const exportData = students.map((s, idx) => ({
    'Sl. No': idx + 1,
    'Class': `Class ${s.classStandard}`,
    'Division': s.division,
    'SATS No': s.satsNo,
    'PEN No': s.penNo,
    'Aadhaar No': s.aadharNo,
    'Student Name': s.studentName,
    'Father Name': s.fatherName,
    'Mother Name': s.motherName,
    'Gender': s.gender || '-',
    'Admission No': s.schoolRegNo || '-',
    'Admission Date': s.admissionDate || '-',
    'Religion': s.religion,
    'Caste': s.caste === 'CUSTOM' ? s.customCaste || 'CUSTOM' : s.caste,
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students_Master');
  const safeName = schoolName.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `${safeName}_Students_Master.xlsx`);
};
