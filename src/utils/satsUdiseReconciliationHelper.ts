/**
 * Karnataka SRMS: SATS–UDISE Plus Intelligent Reconciliation Engine
 * Updates missing SATS No. and DOB together while preserving existing marks,
 * student IDs, classes, and names without creating duplicate records.
 */

import { Student, StudentClass } from '../types';
import { db } from '../lib/firebase';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { getStudentsFromLocal, saveStudentsToLocal, normalizeStudentDates } from './studentStore';

export interface ReconciliationCandidate {
  id: string; // Unique pair ID
  existingStudent: Student;
  incomingStudent: Student;
  proposedSatsNo: string | null;
  proposedDob: string | null;
  matchingMethod:
    | 'EXACT_SATS'
    | 'EXACT_NAME_AND_FATHER'
    | 'EMBEDDED_FATHER_MIDDLE_NAME'
    | 'HIGH_SIMILARITY_NAME_AND_FATHER'
    | 'NAME_SIMILARITY_MANUAL_REVIEW';
  confidenceScore: number; // 0 to 100
  confidenceLabel: string;
  hasConflict: boolean;
  conflictType?: 'SATS_MISMATCH' | 'DOB_MISMATCH' | 'SATS_ALREADY_ASSIGNED' | 'MULTIPLE_CANDIDATES';
  conflictDescription?: string;
  autoApproved: boolean;
  userApproved: boolean;
}

export interface ReconciliationResult {
  batchId: string;
  timestamp: string;
  totalIncoming: number;
  totalExisting: number;
  matchedUpdatesCount: number;
  conflictsCount: number;
  alreadyInSyncCount: number;
  satsOnlyNewCount: number;
  udiseOnlyRetainedCount: number;

  candidatesToUpdate: ReconciliationCandidate[];
  conflicts: ReconciliationCandidate[];
  alreadyInSync: { existing: Student; incoming: Student }[];
  satsOnlyNewStudents: Student[];
  udiseOnlyStudents: Student[];
}

export interface ReconciliationAuditLog {
  batchId: string;
  timestamp: string;
  updatedStudents: {
    studentId: string;
    studentName: string;
    classStandard: StudentClass;
    prevSatsNo: string;
    newSatsNo: string;
    prevDob: string;
    newDob: string;
    matchingMethod: string;
  }[];
  newStudentsAdded: number;
}

/**
 * Normalizes text for robust comparisons: removes whitespace, punctuation,
 * and common honorific prefixes / titles.
 */
export const normalizePersonName = (raw?: string): string => {
  if (!raw) return '';
  let s = raw.trim().toUpperCase();
  // Strip common honorifics / filler words
  s = s.replace(/\b(KUMAR|KUMARI|MASTER|MISS|BABY|SRI|SHRI|MR|MRS|MD|MOHD|MOHAMMED|SYED)\b/g, ' ');
  // Strip non-alphanumeric (keep Kannada letters & English letters)
  s = s.replace(/[^A-Z0-9\u0C80-\u0CFF]/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
};

/**
 * Calculates string similarity using character bigram Dice Coefficient (0.0 to 1.0)
 */
export const calculateNameSimilarity = (a: string, b: string): number => {
  const normA = normalizePersonName(a).replace(/\s+/g, '');
  const normB = normalizePersonName(b).replace(/\s+/g, '');
  if (!normA && !normB) return 1.0;
  if (!normA || !normB) return 0.0;
  if (normA === normB) return 1.0;

  if (normA.length < 2 || normB.length < 2) {
    return normA === normB ? 1.0 : 0.0;
  }

  const getBigrams = (str: string) => {
    const s = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      s.add(str.substring(i, i + 2));
    }
    return s;
  };

  const bigramsA = getBigrams(normA);
  const bigramsB = getBigrams(normB);

  let intersection = 0;
  bigramsA.forEach((bg) => {
    if (bigramsB.has(bg)) intersection++;
  });

  return (2.0 * intersection) / (bigramsA.size + bigramsB.size);
};

/**
 * Checks if a SATS number is genuine and non-empty
 */
export const isGenuinelyValidSatsNo = (sats?: string | null): boolean => {
  if (!sats) return false;
  const s = String(sats).trim().replace(/[^0-9]/g, '');
  return s.length >= 7 && s !== '0' && s !== '000000000';
};

/**
 * Checks if a DOB is present, non-empty, and valid
 */
export const isGenuinelyValidDob = (dob?: string | null): boolean => {
  if (!dob) return false;
  const s = String(dob).trim();
  if (s === '-' || s === 'N/A' || s === 'NA' || s === '' || s.toLowerCase().includes('invalid')) {
    return false;
  }
  return /\d{1,2}[/-]\d{1,2}[/-]\d{4}/.test(s);
};

/**
 * Formats a valid date string to DD/MM/YYYY
 */
export const normalizeDobString = (dob?: string | null): string => {
  if (!dob) return '';
  const s = String(dob).trim();
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    const y = dmy[3];
    return `${d}/${m}/${y}`;
  }
  const ymd = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymd) {
    const y = ymd[1];
    const m = ymd[2].padStart(2, '0');
    const d = ymd[3].padStart(2, '0');
    return `${d}/${m}/${y}`;
  }
  return s;
};

/**
 * Checks whether the father's name (or first token) is embedded as the middle name of the student
 */
export const checkFatherEmbeddedInStudentName = (
  studentName: string,
  fatherName: string
): boolean => {
  const sWords = normalizePersonName(studentName).split(/\s+/).filter(Boolean);
  const fWords = normalizePersonName(fatherName).split(/\s+/).filter(Boolean);
  if (sWords.length < 2 || fWords.length === 0) return false;

  const fatherPrimaryToken = fWords[0];
  if (fatherPrimaryToken.length <= 2) return false;

  // Check if any middle word of student equals father primary token
  for (let i = 1; i < sWords.length; i++) {
    if (sWords[i] === fatherPrimaryToken) return true;
    if (calculateNameSimilarity(sWords[i], fatherPrimaryToken) >= 0.9) return true;
  }
  return false;
};

/**
 * Core SATS–UDISE Plus Reconciliation Analysis Engine
 */
export const reconcileSatsWithExistingStudents = (
  incomingSatsStudents: Student[],
  existingUdiseStudents: Student[],
  _schoolId: string,
  diseCode: string,
  _academicYear: string
): ReconciliationResult => {
  const batchId = `reconcile_${diseCode}_${Date.now()}`;
  const timestamp = new Date().toISOString();

  // Pre-index existing students for quick lookups
  // Map of valid SATS -> existing student id
  const existingSatsMap = new Map<string, Student>();
  existingUdiseStudents.forEach((st) => {
    if (isGenuinelyValidSatsNo(st.satsNo)) {
      existingSatsMap.set(st.satsNo.trim(), st);
    }
  });

  const matchedExistingIds = new Set<string>();
  const matchedIncomingIndices = new Set<number>();

  const candidatesToUpdate: ReconciliationCandidate[] = [];
  const conflicts: ReconciliationCandidate[] = [];
  const alreadyInSync: { existing: Student; incoming: Student }[] = [];

  // 1. First pass: Match by SATS No when already available in existing record
  incomingSatsStudents.forEach((incSt, incIdx) => {
    if (isGenuinelyValidSatsNo(incSt.satsNo)) {
      const cleanIncSats = incSt.satsNo.trim();
      const existing = existingSatsMap.get(cleanIncSats);
      if (existing) {
        matchedExistingIds.add(existing.id);
        matchedIncomingIndices.add(incIdx);

        const existingDobMissing = !isGenuinelyValidDob(existing.dob || existing.dateOfBirth);
        const incomingDobValid = isGenuinelyValidDob(incSt.dob || incSt.dateOfBirth);

        if (existingDobMissing && incomingDobValid) {
          // Missing DOB update with 100% exact SATS match
          candidatesToUpdate.push({
            id: `cand_${existing.id}_${incIdx}`,
            existingStudent: existing,
            incomingStudent: incSt,
            proposedSatsNo: null, // SATS already matches
            proposedDob: normalizeDobString(incSt.dob || incSt.dateOfBirth),
            matchingMethod: 'EXACT_SATS',
            confidenceScore: 100,
            confidenceLabel: '100% Exact SATS Match (Updating Missing DOB)',
            hasConflict: false,
            autoApproved: true,
            userApproved: true,
          });
        } else if (
          isGenuinelyValidDob(existing.dob || existing.dateOfBirth) &&
          incomingDobValid &&
          normalizeDobString(existing.dob || existing.dateOfBirth) !==
            normalizeDobString(incSt.dob || incSt.dateOfBirth)
        ) {
          // Conflicting DOBs
          conflicts.push({
            id: `cand_${existing.id}_${incIdx}`,
            existingStudent: existing,
            incomingStudent: incSt,
            proposedSatsNo: null,
            proposedDob: normalizeDobString(incSt.dob || incSt.dateOfBirth),
            matchingMethod: 'EXACT_SATS',
            confidenceScore: 98,
            confidenceLabel: 'SATS Matched • DOB Conflict Detected',
            hasConflict: true,
            conflictType: 'DOB_MISMATCH',
            conflictDescription: `Existing DOB (${existing.dob || existing.dateOfBirth}) differs from SATS DOB (${incSt.dob || incSt.dateOfBirth})`,
            autoApproved: false,
            userApproved: false,
          });
        } else {
          // Completely in sync
          alreadyInSync.push({ existing, incoming: incSt });
        }
      }
    }
  });

  // 2. Second pass: Match unmatched incoming SATS records to existing students (missing SATS / missing DOB)
  // using Student Name, Father's Name (including embedded middle name), and Class Standard
  incomingSatsStudents.forEach((incSt, incIdx) => {
    if (matchedIncomingIndices.has(incIdx)) return;

    const incClass = incSt.classStandard;
    const incName = incSt.studentName || '';
    const incFather = incSt.fatherName || '';
    const incSats = isGenuinelyValidSatsNo(incSt.satsNo) ? incSt.satsNo.trim() : null;
    const incDob = isGenuinelyValidDob(incSt.dob || incSt.dateOfBirth)
      ? normalizeDobString(incSt.dob || incSt.dateOfBirth)
      : null;

    // Filter existing candidates by same Class and not already matched
    const classCandidates = existingUdiseStudents.filter(
      (ex) => ex.classStandard === incClass && !matchedExistingIds.has(ex.id)
    );

    interface ScoredCandidate {
      existing: Student;
      score: number;
      method: ReconciliationCandidate['matchingMethod'];
      label: string;
      isExact: boolean;
    }

    const scoredList: ScoredCandidate[] = [];

    classCandidates.forEach((ex) => {
      const exName = ex.studentName || '';
      const exFather = ex.fatherName || '';

      const nameSim = calculateNameSimilarity(incName, exName);
      const fatherSim = calculateNameSimilarity(incFather, exFather);
      const isEmbeddedFather =
        checkFatherEmbeddedInStudentName(exName, incFather) ||
        checkFatherEmbeddedInStudentName(incName, exFather);

      // Condition A: Exact Name + Father Name + Class
      if (nameSim >= 0.98 && (fatherSim >= 0.95 || (incFather === '-' && exFather === '-'))) {
        scoredList.push({
          existing: ex,
          score: 98,
          method: 'EXACT_NAME_AND_FATHER',
          label: 'Exact Student Name & Father Name Match',
          isExact: true,
        });
        return;
      }

      // Condition B: Student Name Match + Father embedded as Middle Name
      if (nameSim >= 0.88 && isEmbeddedFather) {
        scoredList.push({
          existing: ex,
          score: 95,
          method: 'EMBEDDED_FATHER_MIDDLE_NAME',
          label: "Father's Name Embedded in Student Name (Middle Name)",
          isExact: true,
        });
        return;
      }

      // Condition C: High similarity name (approx 90%) + High similarity father
      if (nameSim >= 0.88 && fatherSim >= 0.85) {
        scoredList.push({
          existing: ex,
          score: Math.round(((nameSim + fatherSim) / 2) * 100),
          method: 'HIGH_SIMILARITY_NAME_AND_FATHER',
          label: `High Name (${Math.round(nameSim * 100)}%) & Father (${Math.round(fatherSim * 100)}%) Similarity`,
          isExact: false,
        });
        return;
      }

      // Condition D: Name similarity >= 88% alone without father confirmation (Rule 4: requires manual review!)
      if (nameSim >= 0.88) {
        scoredList.push({
          existing: ex,
          score: Math.round(nameSim * 100),
          method: 'NAME_SIMILARITY_MANUAL_REVIEW',
          label: `Potential Name Match (${Math.round(nameSim * 100)}%) • Requires Manual Confirmation`,
          isExact: false,
        });
      }
    });

    if (scoredList.length === 0) {
      // No match found -> will be categorized as SATS-only new student
      return;
    }

    // Sort by highest score descending
    scoredList.sort((a, b) => b.score - a.score);

    // Rule 4: If exactly one strong candidate, display match with confidence
    // If multiple candidates or contradictory details, require manual review
    if (scoredList.length > 1 && scoredList[0].score === scoredList[1].score) {
      // Ambiguous multiple matches
      conflicts.push({
        id: `cand_${scoredList[0].existing.id}_${incIdx}`,
        existingStudent: scoredList[0].existing,
        incomingStudent: incSt,
        proposedSatsNo: incSats,
        proposedDob: incDob,
        matchingMethod: 'NAME_SIMILARITY_MANUAL_REVIEW',
        confidenceScore: scoredList[0].score,
        confidenceLabel: 'Multiple Matching Candidates in Same Class',
        hasConflict: true,
        conflictType: 'MULTIPLE_CANDIDATES',
        conflictDescription: `Found ${scoredList.length} potential matches for "${incName}". Manual selection required.`,
        autoApproved: false,
        userApproved: false,
      });
      return;
    }

    const best = scoredList[0];
    const targetStudent = best.existing;

    // Check Rule 3: Before adding SATS No., verify it is not already assigned elsewhere in the school
    if (incSats && existingSatsMap.has(incSats) && existingSatsMap.get(incSats)!.id !== targetStudent.id) {
      const assignedTo = existingSatsMap.get(incSats)!;
      conflicts.push({
        id: `cand_${targetStudent.id}_${incIdx}`,
        existingStudent: targetStudent,
        incomingStudent: incSt,
        proposedSatsNo: incSats,
        proposedDob: incDob,
        matchingMethod: best.method,
        confidenceScore: best.score,
        confidenceLabel: 'SATS No. Already Assigned Elsewhere',
        hasConflict: true,
        conflictType: 'SATS_ALREADY_ASSIGNED',
        conflictDescription: `SATS No. ${incSats} is already assigned to "${assignedTo.studentName}" (Class ${assignedTo.classStandard}).`,
        autoApproved: false,
        userApproved: false,
      });
      return;
    }

    // Check Rule 2: If SATS already exists and differs from incoming, flag conflict
    const exHasSats = isGenuinelyValidSatsNo(targetStudent.satsNo);
    if (exHasSats && incSats && targetStudent.satsNo.trim() !== incSats) {
      conflicts.push({
        id: `cand_${targetStudent.id}_${incIdx}`,
        existingStudent: targetStudent,
        incomingStudent: incSt,
        proposedSatsNo: incSats,
        proposedDob: incDob,
        matchingMethod: best.method,
        confidenceScore: best.score,
        confidenceLabel: 'Existing SATS Differs from Incoming SATS',
        hasConflict: true,
        conflictType: 'SATS_MISMATCH',
        conflictDescription: `Existing SATS (${targetStudent.satsNo}) differs from SATS file (${incSats}).`,
        autoApproved: false,
        userApproved: false,
      });
      return;
    }

    // Check Rule 2: If DOB already exists and differs from incoming, flag conflict
    const exHasDob = isGenuinelyValidDob(targetStudent.dob || targetStudent.dateOfBirth);
    if (
      exHasDob &&
      incDob &&
      normalizeDobString(targetStudent.dob || targetStudent.dateOfBirth) !== incDob
    ) {
      conflicts.push({
        id: `cand_${targetStudent.id}_${incIdx}`,
        existingStudent: targetStudent,
        incomingStudent: incSt,
        proposedSatsNo: !exHasSats ? incSats : null,
        proposedDob: incDob,
        matchingMethod: best.method,
        confidenceScore: best.score,
        confidenceLabel: 'Existing DOB Differs from SATS DOB',
        hasConflict: true,
        conflictType: 'DOB_MISMATCH',
        conflictDescription: `Existing DOB (${targetStudent.dob || targetStudent.dateOfBirth}) differs from SATS DOB (${incDob}).`,
        autoApproved: false,
        userApproved: false,
      });
      return;
    }

    // Check if updates are needed: missing SATS or missing DOB
    const needsSatsUpdate = !exHasSats && Boolean(incSats);
    const needsDobUpdate = !exHasDob && Boolean(incDob);

    if (needsSatsUpdate || needsDobUpdate) {
      // Rule 4: If confident (score >= 90 with confirmed father or middle name) -> auto-approved
      // If method is NAME_SIMILARITY_MANUAL_REVIEW -> requires manual user confirmation
      const isAutoApproved =
        best.method !== 'NAME_SIMILARITY_MANUAL_REVIEW' && best.score >= 90;

      candidatesToUpdate.push({
        id: `cand_${targetStudent.id}_${incIdx}`,
        existingStudent: targetStudent,
        incomingStudent: incSt,
        proposedSatsNo: needsSatsUpdate ? incSats : null,
        proposedDob: needsDobUpdate ? incDob : null,
        matchingMethod: best.method,
        confidenceScore: best.score,
        confidenceLabel: `${best.score}% • ${best.label}`,
        hasConflict: false,
        autoApproved: isAutoApproved,
        userApproved: isAutoApproved,
      });

      matchedExistingIds.add(targetStudent.id);
      matchedIncomingIndices.add(incIdx);
    } else {
      // Both SATS and DOB already present and identical
      alreadyInSync.push({ existing: targetStudent, incoming: incSt });
      matchedExistingIds.add(targetStudent.id);
      matchedIncomingIndices.add(incIdx);
    }
  });

  // 3. New SATS-only students (genuine new admissions)
  const satsOnlyNewStudents: Student[] = [];
  incomingSatsStudents.forEach((st, idx) => {
    if (!matchedIncomingIndices.has(idx)) {
      satsOnlyNewStudents.push(st);
    }
  });

  // 4. Retained UDISE-only students (existing students not in incoming SATS file)
  const udiseOnlyStudents: Student[] = existingUdiseStudents.filter(
    (st) => !matchedExistingIds.has(st.id)
  );

  return {
    batchId,
    timestamp,
    totalIncoming: incomingSatsStudents.length,
    totalExisting: existingUdiseStudents.length,
    matchedUpdatesCount: candidatesToUpdate.length,
    conflictsCount: conflicts.length,
    alreadyInSyncCount: alreadyInSync.length,
    satsOnlyNewCount: satsOnlyNewStudents.length,
    udiseOnlyRetainedCount: udiseOnlyStudents.length,
    candidatesToUpdate,
    conflicts,
    alreadyInSync,
    satsOnlyNewStudents,
    udiseOnlyStudents,
  };
};

/**
 * Commits approved reconciliation updates to Firestore and local storage.
 * Enforces Rule 2: Never modifies name, father's name, class, marks, caste, gender or any other field!
 * Enforces Rule 3: Uses existing SRMS student document ID; never creates duplicate documents.
 * Enforces Rule 5: Records previous values, new values, timestamp and import batch ID.
 */
export const applyReconciliationUpdates = async (
  approvedCandidates: ReconciliationCandidate[],
  approvedNewStudents: Student[],
  diseCode: string,
  academicYear: string,
  batchId: string
): Promise<{ success: boolean; updatedCount: number; newAddedCount: number; auditLog: ReconciliationAuditLog }> => {
  const currentStudents = getStudentsFromLocal(diseCode, academicYear);
  const studentMap = new Map<string, Student>();
  currentStudents.forEach((s) => studentMap.set(s.id, s));

  const timestamp = new Date().toISOString();
  const auditEntries: ReconciliationAuditLog['updatedStudents'] = [];

  // 1. Batch update approved existing students
  try {
    const firestoreBatch = writeBatch(db);
    let pendingBatchCount = 0;

    for (const cand of approvedCandidates) {
      if (!cand.userApproved) continue;

      const ex = cand.existingStudent;
      const targetObj = studentMap.get(ex.id) || ex;

      const prevSats = targetObj.satsNo || 'N/A';
      const prevDob = targetObj.dob || targetObj.dateOfBirth || '-';

      const updateFields: Partial<Student> & {
        reconciliationBatchId: string;
        lastReconciledAt: string;
        prevSatsNo?: string;
        prevDob?: string;
      } = {
        reconciliationBatchId: batchId,
        lastReconciledAt: timestamp,
        updatedAt: timestamp,
      };

      if (cand.proposedSatsNo) {
        updateFields.satsNo = cand.proposedSatsNo;
        updateFields.prevSatsNo = prevSats;
      }
      if (cand.proposedDob) {
        updateFields.dob = cand.proposedDob;
        updateFields.dateOfBirth = cand.proposedDob;
        updateFields.prevDob = prevDob;
      }

      // Update in-memory object strictly preserving other fields
      const updatedStudent: Student = {
        ...targetObj,
        ...updateFields,
      };
      studentMap.set(ex.id, normalizeStudentDates(updatedStudent));

      auditEntries.push({
        studentId: ex.id,
        studentName: ex.studentName,
        classStandard: ex.classStandard,
        prevSatsNo: prevSats,
        newSatsNo: cand.proposedSatsNo || prevSats,
        prevDob: prevDob,
        newDob: cand.proposedDob || prevDob,
        matchingMethod: cand.matchingMethod,
      });

      // Queue Firestore update
      try {
        const cleanId = ex.id.replace(/[^a-zA-Z0-9_-]/g, '_');
        const studentDocRef = doc(db, 'schools', diseCode, 'students', cleanId);
        firestoreBatch.update(studentDocRef, updateFields);
        pendingBatchCount++;
      } catch (err) {
        console.warn('Queue firestore update notice:', err);
      }
    }

    if (pendingBatchCount > 0) {
      await firestoreBatch.commit().catch(async (commitErr) => {
        console.warn('Batch commit notice, applying individually:', commitErr);
        for (const entry of auditEntries) {
          try {
            const cleanId = entry.studentId.replace(/[^a-zA-Z0-9_-]/g, '_');
            const studentDocRef = doc(db, 'schools', diseCode, 'students', cleanId);
            const cand = approvedCandidates.find((c) => c.existingStudent.id === entry.studentId);
            const indUpdate: any = {
              reconciliationBatchId: batchId,
              lastReconciledAt: timestamp,
              updatedAt: timestamp,
            };
            if (cand?.proposedSatsNo) indUpdate.satsNo = cand.proposedSatsNo;
            if (cand?.proposedDob) {
              indUpdate.dob = cand.proposedDob;
              indUpdate.dateOfBirth = cand.proposedDob;
            }
            await updateDoc(studentDocRef, indUpdate);
          } catch (_) {}
        }
      });
    }
  } catch (outerErr) {
    console.warn('Reconciliation update outer notice:', outerErr);
  }

  // 2. Add approved genuine new SATS-only students
  let addedCount = 0;
  if (approvedNewStudents.length > 0) {
    approvedNewStudents.forEach((st) => {
      const validSats = isGenuinelyValidSatsNo(st.satsNo) ? st.satsNo.trim() : '';
      const cleanId = (
        st.id ||
        (validSats
          ? `std_${diseCode}_${validSats.replace(/[^a-zA-Z0-9_-]/g, '_')}`
          : `std_${diseCode}_c${st.classStandard}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`)
      ).replace(/[^a-zA-Z0-9_-]/g, '_');

      const norm: Student = {
        ...normalizeStudentDates(st),
        id: cleanId,
        diseCode,
        schoolId: diseCode,
        academicYear,
        reconciliationBatchId: batchId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      if (!studentMap.has(cleanId)) {
        studentMap.set(cleanId, norm);
        addedCount++;
      }
    });
  }

  // 3. Save merged list into local storage cache
  const finalMergedList = Array.from(studentMap.values());
  saveStudentsToLocal(diseCode, finalMergedList, academicYear);

  // 4. Save audit log in local storage for school history inspection
  const auditLog: ReconciliationAuditLog = {
    batchId,
    timestamp,
    updatedStudents: auditEntries,
    newStudentsAdded: addedCount,
  };

  try {
    const prevAuditJson = localStorage.getItem(`reconciliation_audit_${diseCode}`) || '[]';
    const auditHistory: ReconciliationAuditLog[] = JSON.parse(prevAuditJson);
    auditHistory.unshift(auditLog);
    localStorage.setItem(`reconciliation_audit_${diseCode}`, JSON.stringify(auditHistory.slice(0, 20)));
  } catch (_) {}

  return {
    success: true,
    updatedCount: auditEntries.length,
    newAddedCount: addedCount,
    auditLog,
  };
};
