/**
 * Local Fallback Store for School Registration & Admin Approvals
 * Ensures that school registration and admin workflows work smoothly
 * even when Firebase Auth Email/Password provider is awaiting activation in Firebase Console.
 */

import { SchoolRecord, UserRecord } from '../types';

const STORAGE_KEY_SCHOOLS = 'kseab_local_registered_schools';
const STORAGE_KEY_CREDS = 'kseab_local_school_creds';

export interface LocalSchoolCredential {
  diseCode: string;
  passwordHash: string;
  schoolId: string;
}

export const getLocalSchools = (): SchoolRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCHOOLS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local schools:', e);
    return [];
  }
};

export const saveLocalSchool = (school: SchoolRecord, password?: string): void => {
  try {
    const existing = getLocalSchools();
    const filtered = existing.filter((s) => s.diseCode !== school.diseCode && s.schoolId !== school.schoolId);
    filtered.unshift(school);
    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(filtered));

    if (password) {
      const credsRaw = localStorage.getItem(STORAGE_KEY_CREDS);
      const creds: Record<string, string> = credsRaw ? JSON.parse(credsRaw) : {};
      creds[school.diseCode] = password;
      localStorage.setItem(STORAGE_KEY_CREDS, JSON.stringify(creds));
    }
  } catch (e) {
    console.error('Error saving local school:', e);
  }
};

export const updateLocalSchool = (
  schoolId: string,
  updates: Partial<SchoolRecord>
): SchoolRecord | null => {
  try {
    const existing = getLocalSchools();
    let updated: SchoolRecord | null = null;
    const newList = existing.map((sch) => {
      if (sch.schoolId === schoolId || sch.diseCode === schoolId) {
        updated = { ...sch, ...updates };
        return updated;
      }
      return sch;
    });
    if (updated) {
      localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(newList));
    }
    return updated;
  } catch (e) {
    console.error('Error updating local school:', e);
    return null;
  }
};

export const getLocalSchoolByDise = (diseCode: string): SchoolRecord | null => {
  const list = getLocalSchools();
  return list.find((s) => s.diseCode === diseCode) || null;
};

export const verifyLocalSchoolCredentials = (diseCode: string, passwordAttempt: string): boolean => {
  try {
    const credsRaw = localStorage.getItem(STORAGE_KEY_CREDS);
    if (!credsRaw) return false;
    const creds: Record<string, string> = JSON.parse(credsRaw);
    return creds[diseCode] === passwordAttempt;
  } catch {
    return false;
  }
};

const STORAGE_KEY_DELETED_SCHOOLS = 'kseab_deleted_schools_archive';

export const getDeletedSchools = (): SchoolRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_SCHOOLS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

export const archiveDeletedSchool = (school: SchoolRecord): void => {
  try {
    const current = getDeletedSchools().filter((s) => s.diseCode !== school.diseCode);
    current.unshift({ ...school, updatedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY_DELETED_SCHOOLS, JSON.stringify(current));
  } catch (e) {
    console.error('Error archiving deleted school:', e);
  }
};

export const removeSchoolFromActiveLocal = (diseCode: string, schoolId?: string): void => {
  try {
    const list = getLocalSchools().filter(
      (s) => s.diseCode !== diseCode && s.schoolId !== schoolId && s.schoolId !== diseCode
    );
    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(list));

    const credsRaw = localStorage.getItem(STORAGE_KEY_CREDS);
    if (credsRaw) {
      const creds = JSON.parse(credsRaw);
      delete creds[diseCode];
      localStorage.setItem(STORAGE_KEY_CREDS, JSON.stringify(creds));
    }
  } catch (e) {
    console.error('Error removing active local school:', e);
  }
};

export const restoreDeletedSchoolLocal = (diseCode: string): SchoolRecord | null => {
  try {
    const deleted = getDeletedSchools();
    const target = deleted.find((s) => s.diseCode === diseCode);
    if (target) {
      saveLocalSchool(target, target.registrationPassword);
      const remaining = deleted.filter((s) => s.diseCode !== diseCode);
      localStorage.setItem(STORAGE_KEY_DELETED_SCHOOLS, JSON.stringify(remaining));
      return target;
    }
    return null;
  } catch (e) {
    console.error('Error restoring local school:', e);
    return null;
  }
};
