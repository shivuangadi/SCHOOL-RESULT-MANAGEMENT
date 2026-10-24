/**
 * Data models and types for School Result Management System
 * ಶಾಲಾ ಫಲಿತಾಂಶ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ
 */

export type SchoolType = 'Government' | 'Aided' | 'Unaided';

export type SchoolMedium = 'Kannada' | 'English' | 'Marathi' | 'Urdu';

export type AccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'EXPIRED' | 'DELETED';

export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';

export type UserRole = 'admin' | 'schoolAdmin';

export const formatClassOrdinal = (cls: StudentClass | string | number): string => {
  const cStr = String(cls).trim();
  if (cStr === '1') return '1st';
  if (cStr === '2') return '2nd';
  if (cStr === '3') return '3rd';
  return `${cStr}th`;
};

export const formatClassStd = (cls: StudentClass | string | number): string => {
  return `${formatClassOrdinal(cls)} Std`;
};

export const splitStudentNameTo3Rows = (fullName?: string): [string, string, string] => {
  if (!fullName || !fullName.trim()) return ['', '', ''];
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ['', '', ''];
  if (words.length === 1) return [words[0], '', ''];
  if (words.length === 2) return [words[0], '', words[1]];
  if (words.length === 3) return [words[0], words[1], words[2]];
  const firstName = words[0];
  const lastName = words[words.length - 1];
  const middleName = words.slice(1, words.length - 1).join(' ');
  return [firstName, middleName, lastName];
};

export const getFormattedClassName = (
  cls: StudentClass | string | number,
  medium?: SchoolMedium
): string => {
  const cStr = String(cls);
  if (medium === 'Kannada') {
    return `${cStr}ನೇ ತರಗತಿ`;
  }
  return formatClassStd(cls);
};

export interface SubjectConfig {
  code: string; // e.g. "FL", "SL", "TL", "MATH", "EVS", "SCI", "SOC", "VPE"
  prefix: string; // "FL", "SL", "TL", or ""
  subjectName: string; // e.g. "FL Kannada", "SL English", "Math", "EVS"
  kannadaName: string;
  maxMarks: number; // 100 (FA1:10, FA2:10, SA1:30, FA3:10, FA4:10, SA2:30)
}

export interface SchoolRecord {
  schoolId: string;
  diseCode: string;
  schoolName: string;
  schoolType: SchoolType;
  schoolMedium: SchoolMedium;
  medium?: SchoolMedium | string;
  headmasterName: string;
  taluk?: string; // e.g. "ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ"
  cluster?: string; // e.g. "ಸದಲಗಾ" / "ಶಿರೂರು"
  district?: string;
  mobile: string;
  email: string;
  academicYear?: string; // e.g. "2026-27"
  schoolRange?: string; // e.g. "1 ರಿಂದ 8 ನೇ ತರಗತಿ" ಅಥವಾ "1 ರಿಂದ 10 ನೇ ತರಗತಿ"
  crcCluster?: string; // e.g. ಸಂಪನ್ಮೂಲ ಕೇಂದ್ರ
  classTeachers?: Record<string, string>; // e.g. { "1-A": "ಶಿಕ್ಷಕರ ಹೆಸರು", "5-A": "..." }
  status: AccountStatus;
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED';
  subscriptionStatus: SubscriptionStatus;
  subscriptionStart?: string;
  subscriptionExpiry?: string;
  ownerUid?: string;
  firebaseAuthUid?: string;
  registrationPassword?: string;
  paymentReference?: string;
  paymentNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  lastLoginAt?: string;
}

export interface UserRecord {
  uid: string;
  diseCode?: string;
  schoolId?: string;
  role: UserRole;
  name: string;
  email: string;
  status: AccountStatus;
  createdAt: string;
}

export interface AdminRecord {
  uid: string;
  email: string;
  name: string;
  role: 'admin';
  createdAt: string;
}

export interface SchoolRegistrationPayload {
  diseCode: string;
  schoolName: string;
  schoolType: SchoolType;
  schoolMedium: SchoolMedium;
  headmasterName: string;
  taluk?: string; // e.g. "ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ"
  cluster?: string; // e.g. "ಸದಲಗಾ" / "ಶಿರೂರು"
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type SupportedLanguage = 'en' | 'kn';

export type StudentClass = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';
export type StudentDivision = 'A' | 'B' | 'C' | 'D';
export type StudentReligion = 'Hindu' | 'Muslim' | 'Christian' | 'Jain' | 'Sikh' | 'Buddhist' | 'Other';
export type StudentCaste = 'SC' | 'ST' | 'Cat-1' | '2A' | '2B' | '3A' | '3B' | 'GM' | 'OBC' | 'MUSLIM' | 'GENERAL' | 'OTHERS' | 'CUSTOM';

export type CwsnStatus = 'NO' | 'EXEMPTED' | 'MARKS_ALLOWED' | 'YES_EXEMPTED' | 'YES_MARKS';

export const isCwsnStudent = (status?: string): boolean => {
  return status === 'EXEMPTED' || status === 'MARKS_ALLOWED' || status === 'YES_EXEMPTED' || status === 'YES_MARKS';
};

export const isCwsnExempted = (status?: string): boolean => {
  return status === 'EXEMPTED' || status === 'YES_EXEMPTED';
};

export interface Student {
  id: string;
  schoolId: string;
  diseCode: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  originalStudentName?: string;
  originalFatherName?: string;
  originalMotherName?: string;
  studentNameKn?: string;
  fatherNameKn?: string;
  motherNameKn?: string;
  namesLanguage?: 'en' | 'kn';
  classStandard: StudentClass;
  division: StudentDivision;
  satsNo: string;
  penNo: string;
  aadharNo: string;
  schoolRegNo?: string;
  admissionDate?: string; // DD/MM/YYYY or YYYY-MM-DD
  dob?: string; // DD/MM/YYYY
  dateOfBirth?: string; // DD/MM/YYYY
  religion?: StudentReligion;
  caste?: StudentCaste;
  customCaste?: string;
  gender?: 'Boy' | 'Girl';
  mobile?: string;
  contactNumber?: string;
  cwsnStatus?: CwsnStatus;
  medium?: string;
  languageMedium?: string;
  academicYear?: string; // e.g. "2026-27"
  photoUrl?: string;
  photoPath?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface CoCurricularRecord {
  emotionalSocial?: string; // ಭಾವನಾತ್ಮಕ & ಸಾಮಾಜಿಕ / ದೈಹಿಕ ಶಿಕ್ಷಣ (A+, A, B+, B, C)
  organizationalSkills?: string; // ಸಂಘಟನಾ ಕೌಶಲ / ಮೌಲ್ಯ ಶಿಕ್ಷಣ
  scientificSkills?: string; // ವೈಜ್ಞಾನಿಕ ಕೌಶಲ / ಕಾರ್ಯಾನ್ಭವ
  fineArtsDrawing?: string; // ಲಲಿತ ಕಲೆ / ಕಲಾ ಶಿಕ್ಷಣ / Drawing
  creativity?: string; // ಸೃಜನಶೀಲತೆ
  attitude?: string; // ಮನೋಧೋರಣೆ
  values?: string; // ಮೌಲ್ಯಗಳು
  ictMarks?: number | null; // ICT ಅಂಕ (100 ಕ್ಕೆ)
  ictGrade?: string; // ICT ಶ್ರೇಣಿ
  workingDays?: number | null; // ಶಾಲೆ ನಡೆದ ದಿನಗಳು
  attendedDays?: number | null; // ಹಾಜರಿದ್ದ ದಿನಗಳು
  resultStatus?: string; // ಫಲಿತಾಂಶ e.g. "PASSED" / "PROMOTED"
}

export interface SubjectMarksRecord {
  code: string;
  fa1?: number | null;
  fa1_pct?: number | null;
  fa2?: number | null;
  fa2_pct?: number | null;
  sa1?: number | null;
  sa1_pct?: number | null;
  fa3?: number | null;
  fa3_pct?: number | null;
  fa4?: number | null;
  fa4_pct?: number | null;
  sa2?: number | null;
  sa2_pct?: number | null;
  total?: number | null;
}

export interface StudentExamMarks {
  studentId: string;
  diseCode: string;
  classStandard: StudentClass;
  academicYear?: string;
  subjects: Record<string, SubjectMarksRecord>;
  coCurricular?: CoCurricularRecord;
  partBSubjects?: Record<string, {
    sem1?: number | null;
    sem2?: number | null;
    total?: number | null;
    grade?: string;
  }>;
  attendanceDays?: number;
  sem1Attendance?: number;
  sem2Attendance?: number;
  totalWorkingDays?: number;
  sem1Co?: Record<string, string>;
  sem2Co?: Record<string, string>;
  finalCo?: Record<string, string>;
  isCwsnExempt?: boolean;
  updatedAt?: string;
}
