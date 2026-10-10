import { Student, SchoolRecord, StudentExamMarks } from '../types';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  getStudentsFromLocal,
  saveStudentsToLocal,
  getDeletedStudentsFromLocal,
  saveDeletedStudentsToLocal,
  cleanForFirestore,
} from './studentStore';
import { getRealMarksFromLocal, saveRealMarksToLocal } from './marksStore';
import { formatDateToDmy } from './satsExcelParser';

export interface SchoolBackupBundle {
  app: string;
  version: string;
  exportedAt: string;
  diseCode: string;
  schoolName: string;
  academicYear: string;
  data: {
    schoolRecord?: SchoolRecord | null;
    students: Student[];
    deletedStudents: Student[];
    marks: Record<string, StudentExamMarks>;
  };
}

/**
 * Exports all school data (Profile, Students, Archived/Dropbox Students, Marks) to a JSON file
 */
export const exportSchoolDataToJson = async (
  diseCode: string,
  schoolRecord: SchoolRecord | null,
  academicYear: string = '2026-27',
  activeStudents?: Student[]
): Promise<void> => {
  const targetDise = (diseCode && diseCode !== '00000000000' ? diseCode : schoolRecord?.diseCode) || '29010100101';
  const schoolName = schoolRecord?.schoolName || 'Govt School';

  // 1. Gather all active students (from memory, local cache, and firestore)
  let studentsList: Student[] = activeStudents && activeStudents.length > 0 ? [...activeStudents] : [];
  if (studentsList.length === 0) {
    studentsList = getStudentsFromLocal(targetDise, academicYear);
  }
  if (studentsList.length === 0) {
    studentsList = getStudentsFromLocal(targetDise);
  }

  try {
    const colRef = collection(db, 'schools', targetDise, 'students');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      snap.forEach((d) => {
        const data = d.data() as Student;
        if (!studentsList.some((s) => s.id === (data.id || d.id))) {
          studentsList.push({ ...data, id: data.id || d.id });
        }
      });
    }
  } catch (err) {
    console.warn('Firestore backup read notice (proceeding with local data):', err);
  }

  // 2. Gather deleted/archived students
  const deletedStudents = getDeletedStudentsFromLocal(targetDise);

  // 3. Gather marks
  const marks = getRealMarksFromLocal(targetDise, academicYear);

  // 4. Construct backup bundle
  const backupBundle: SchoolBackupBundle = {
    app: 'School Result Management System',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    diseCode: targetDise,
    schoolName,
    academicYear,
    data: {
      schoolRecord: schoolRecord || null,
      students: studentsList,
      deletedStudents,
      marks,
    },
  };

  const jsonStr = JSON.stringify(backupBundle, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeSchoolName = schoolName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);

  link.href = url;
  link.download = `School_Backup_${targetDise}_${safeSchoolName}_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Validates a parsed JSON file to check if it's a valid School Backup
 */
export const parseAndValidateBackupJson = (
  fileContent: string
): { isValid: boolean; bundle?: SchoolBackupBundle; error?: string } => {
  if (!fileContent || typeof fileContent !== 'string') {
    return { isValid: false, error: 'File content is empty or unreadable.' };
  }

  // 1. Clean UTF-8 BOM, zero-width characters, and trim whitespace
  let cleanContent = fileContent.trim().replace(/^\uFEFF/, '');

  let parsed: any;
  try {
    parsed = JSON.parse(cleanContent);
  } catch (err: any) {
    // Fallback: try finding first '{' or '[' if any metadata was prepended
    const firstBrace = cleanContent.indexOf('{');
    const firstBracket = cleanContent.indexOf('[');
    let startIdx = -1;
    if (firstBrace >= 0 && firstBracket >= 0) {
      startIdx = Math.min(firstBrace, firstBracket);
    } else if (firstBrace >= 0) {
      startIdx = firstBrace;
    } else if (firstBracket >= 0) {
      startIdx = firstBracket;
    }

    if (startIdx > 0) {
      try {
        parsed = JSON.parse(cleanContent.substring(startIdx));
      } catch (_) {}
    }

    if (!parsed) {
      return {
        isValid: false,
        error: `JSON Parse error: ${err?.message || 'Invalid format'}. Please ensure this is an uncorrupted .json file.`,
      };
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { isValid: false, error: 'Invalid JSON file: Root content must be an object or array.' };
  }

  // 2. Extract students safely from any format
  let rawStudents: any[] = [];
  if (Array.isArray(parsed)) {
    // Direct array of student objects: [ { studentName: ... }, ... ]
    rawStudents = parsed;
  } else if (parsed.data && Array.isArray(parsed.data.students)) {
    rawStudents = parsed.data.students;
  } else if (parsed.data && Array.isArray(parsed.data)) {
    rawStudents = parsed.data;
  } else if (Array.isArray(parsed.students)) {
    rawStudents = parsed.students;
  } else if (Array.isArray(parsed.activeStudents)) {
    rawStudents = parsed.activeStudents;
  } else if (Array.isArray(parsed.studentList)) {
    rawStudents = parsed.studentList;
  } else if (Array.isArray(parsed.records)) {
    rawStudents = parsed.records;
  } else if (parsed.data && parsed.data.students && typeof parsed.data.students === 'object') {
    rawStudents = Object.values(parsed.data.students);
  } else if (parsed.students && typeof parsed.students === 'object') {
    rawStudents = Object.values(parsed.students);
  }

  // Normalize each student record
  const students: Student[] = rawStudents
    .filter((s) => s && typeof s === 'object' && (s.studentName || s.name || s.satsNo || s.id))
    .map((s, idx) => {
      const cleanId = String(s.id || `std_${Date.now()}_${idx}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const stdCls = String(s.classStandard || s.class || s.std || '1') as any;
      return {
        id: cleanId,
        schoolId: String(s.schoolId || parsed.diseCode || parsed.data?.diseCode || '29010100101'),
        diseCode: String(s.diseCode || parsed.diseCode || parsed.data?.diseCode || '29010100101'),
        studentName: String(s.studentName || s.name || `Student ${idx + 1}`),
        fatherName: String(s.fatherName || s.father || '-'),
        motherName: String(s.motherName || s.mother || '-'),
        classStandard: stdCls,
        division: String(s.division || s.sec || 'A') as any,
        satsNo: String(s.satsNo || s.sats || s.satsNumber || '').trim() || '-',
        penNo: String(s.penNo || s.pen || '').trim() || '-',
        aadharNo: String(s.aadharNo || s.aadhar || '').trim() || '-',
        schoolRegNo: s.schoolRegNo || undefined,
        admissionDate: formatDateToDmy(s.admissionDate || '01/06/2025'),
        dob: formatDateToDmy(s.dob || s.dateOfBirth || '15/05/2015'),
        dateOfBirth: formatDateToDmy(s.dateOfBirth || s.dob || '15/05/2015'),
        religion: s.religion || 'Hindu',
        caste: s.caste || 'GENERAL',
        customCaste: s.customCaste || undefined,
        gender: s.gender === 'Girl' || String(s.gender).toLowerCase().startsWith('g') || String(s.gender).toLowerCase().startsWith('f') ? 'Girl' : 'Boy',
        mobile: s.mobile || s.contactNumber || undefined,
        contactNumber: s.contactNumber || s.mobile || undefined,
        cwsnStatus: s.cwsnStatus || 'NO',
        academicYear: s.academicYear || parsed.academicYear || parsed.data?.academicYear || '2026-27',
        createdAt: s.createdAt || new Date().toISOString(),
        updatedAt: s.updatedAt || new Date().toISOString(),
      };
    });

  // Extract Marks
  let marks: Record<string, StudentExamMarks> = {};
  if (parsed.data?.marks && typeof parsed.data.marks === 'object') {
    marks = parsed.data.marks;
  } else if (parsed.marks && typeof parsed.marks === 'object') {
    marks = parsed.marks;
  } else if (parsed.results && typeof parsed.results === 'object') {
    marks = parsed.results;
  }

  // Extract School Record
  let schoolRecord: SchoolRecord | null = null;
  if (parsed.data?.schoolRecord && typeof parsed.data.schoolRecord === 'object') {
    schoolRecord = parsed.data.schoolRecord;
  } else if (parsed.schoolRecord && typeof parsed.schoolRecord === 'object') {
    schoolRecord = parsed.schoolRecord;
  } else if (parsed.school && typeof parsed.school === 'object') {
    schoolRecord = parsed.school;
  }

  // Extract Deleted Students
  let deletedStudents: Student[] = [];
  if (Array.isArray(parsed.data?.deletedStudents)) {
    deletedStudents = parsed.data.deletedStudents;
  } else if (Array.isArray(parsed.deletedStudents)) {
    deletedStudents = parsed.deletedStudents;
  }

  // Valid if it has students OR marks OR schoolRecord OR matches bundle
  if (
    students.length > 0 ||
    Object.keys(marks).length > 0 ||
    schoolRecord !== null ||
    parsed.data !== undefined ||
    Array.isArray(parsed)
  ) {
    const bundle: SchoolBackupBundle = {
      app: parsed.app || 'School Result Management System',
      version: parsed.version || '1.0',
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      diseCode: parsed.diseCode || parsed.data?.diseCode || schoolRecord?.diseCode || '29010100101',
      schoolName: parsed.schoolName || parsed.data?.schoolName || schoolRecord?.schoolName || 'Govt School',
      academicYear: parsed.academicYear || parsed.data?.academicYear || '2026-27',
      data: {
        schoolRecord,
        students,
        deletedStudents,
        marks,
      },
    };

    return { isValid: true, bundle };
  }

  return {
    isValid: false,
    error: 'Unrecognized backup structure. Expected students, school profile, or marks in the JSON file.',
  };
};

/**
 * Restores school data from a validated JSON backup bundle
 */
export const restoreSchoolDataFromJson = async (
  bundle: SchoolBackupBundle,
  diseCode: string
): Promise<{
  studentsCount: number;
  marksCount: number;
  schoolName: string;
}> => {
  const targetDise = diseCode || bundle.diseCode || '29010100101';
  const data = bundle.data;

  // Clear the "cleared" flag since we are restoring data
  localStorage.removeItem(`kseab_cleared_${targetDise}`);
  if (data.schoolRecord?.schoolId) {
    localStorage.removeItem(`kseab_cleared_${data.schoolRecord.schoolId}`);
  }

  // 1. Restore School Profile if present
  if (data.schoolRecord) {
    try {
      const cleanSchool = cleanForFirestore({
        ...data.schoolRecord,
        diseCode: targetDise,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, 'schools', targetDise), cleanSchool, { merge: true });
    } catch (e) {
      console.warn('Firestore restore school profile notice:', e);
    }
  }

  // 2. Restore Students
  const studentsToRestore = data.students || [];
  if (studentsToRestore.length > 0) {
    // Save to local cache immediately
    saveStudentsToLocal(targetDise, studentsToRestore, bundle.academicYear);
    saveStudentsToLocal(targetDise, studentsToRestore);

    // Save to Firestore in batches
    try {
      for (let i = 0; i < studentsToRestore.length; i += 300) {
        const batch = writeBatch(db);
        const chunk = studentsToRestore.slice(i, i + 300);
        chunk.forEach((st) => {
          const cleanId = (st.id || `std_${targetDise}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`)
            .replace(/[^a-zA-Z0-9_-]/g, '_');
          const cleanDoc = cleanForFirestore({ ...st, id: cleanId, diseCode: targetDise, schoolId: targetDise });
          const docRef = doc(db, 'schools', targetDise, 'students', cleanId);
          batch.set(docRef, cleanDoc, { merge: true });
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn('Firestore restore students batch notice:', err);
    }
  }

  // 3. Restore Deleted / Archived Students
  if (data.deletedStudents && data.deletedStudents.length > 0) {
    saveDeletedStudentsToLocal(targetDise, data.deletedStudents);
    try {
      const batch = writeBatch(db);
      data.deletedStudents.slice(0, 100).forEach((st) => {
        const cleanId = (st.id || `del_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
        const cleanDoc = cleanForFirestore({ ...st, id: cleanId });
        const docRef = doc(db, 'schools', targetDise, 'deletedStudents', cleanId);
        batch.set(docRef, cleanDoc, { merge: true });
      });
      await batch.commit();
    } catch (_) {}
  }

  // 4. Restore Marks
  let marksCount = 0;
  if (data.marks && Object.keys(data.marks).length > 0) {
    marksCount = Object.keys(data.marks).length;
    saveRealMarksToLocal(targetDise, data.marks, bundle.academicYear);

    // Write to Firestore marks collection
    try {
      const batch = writeBatch(db);
      Object.entries(data.marks).slice(0, 300).forEach(([stdId, markDoc]) => {
        const cleanId = stdId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const cleanMark = cleanForFirestore(markDoc);
        const docRef = doc(db, 'schools', targetDise, 'marks', cleanId);
        batch.set(docRef, cleanMark, { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.warn('Firestore restore marks batch notice:', err);
    }
  }

  return {
    studentsCount: studentsToRestore.length,
    marksCount,
    schoolName: bundle.schoolName || data.schoolRecord?.schoolName || 'School',
  };
};
