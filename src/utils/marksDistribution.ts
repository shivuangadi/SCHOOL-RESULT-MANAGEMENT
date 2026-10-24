/**
 * Official Marks Distribution & 2-Way Synchronization Utility
 * Supports Karnataka State Board (KSEAB / DSERT) CCE Standards
 * 
 * Ensures:
 * 1. 0 - 100 range marks entry in 100 Marks Consolidation.
 * 2. Proper distribution across FA1, FA2, SA1 (Sem 1) and FA3, FA4, SA2 (Sem 2).
 * 3. Respected exam limits are strictly enforced (never exceeded).
 * 4. 2-way synchronization between 100 marks consolidation and marks entry forms.
 * 5. Works across all mediums (Kannada, English, Marathi, Urdu) and all classes (1 to 10).
 */

import { StudentExamMarks, StudentClass } from '../types';

export interface DistributedSubjectMarks {
  code: string;
  total: number | null;
  fa1: number | null;
  fa1_pct: number | null;
  fa2: number | null;
  fa2_pct: number | null;
  sa1: number | null;
  sa1_pct: number | null;
  fa3: number | null;
  fa3_pct: number | null;
  fa4: number | null;
  fa4_pct: number | null;
  sa2: number | null;
  sa2_pct: number | null;
  total100: number | null;
}

/**
 * Distributes a 0-100 mark score into FA1, FA2, SA1, FA3, FA4, SA2
 * according to the prescribed limits for the given class:
 * 
 * - Higher Primary & High School (Class 6 - 10):
 *   FA1(10), FA2(10), SA1(30) + FA3(10), FA4(10), SA2(30) = 100
 *   Raw limits: FA(20), SA(50)
 * 
 * - Primary (Class 1 - 5):
 *   FA1(15), FA2(15), SA1(20) + FA3(15), FA4(15), SA2(20) = 100
 *   Raw limits: FA(20), SA(50)
 */
export const distributeSubject100Marks = (
  total100: number | null | undefined,
  classStandard: string | number,
  subCode: string
): DistributedSubjectMarks => {
  // If cleared or null/undefined
  if (total100 === null || total100 === undefined || (total100 as any) === '' || isNaN(Number(total100))) {
    return {
      code: subCode,
      total: null,
      fa1: null,
      fa1_pct: null,
      fa2: null,
      fa2_pct: null,
      sa1: null,
      sa1_pct: null,
      fa3: null,
      fa3_pct: null,
      fa4: null,
      fa4_pct: null,
      sa2: null,
      sa2_pct: null,
      total100: null,
    };
  }

  // Clamped strictly to 0 - 100 range
  const clampedTotal = Math.max(0, Math.min(100, Math.round(Number(total100))));
  const classNum = Number(classStandard) || 5;
  const isHpOrHighSchool = classNum >= 6; // Classes 6, 7, 8, 9, 10

  // Split equally into Semester 1 (max 50) and Semester 2 (max 50)
  const sem1Target = Math.round(clampedTotal / 2);
  const sem2Target = clampedTotal - sem1Target;

  if (isHpOrHighSchool) {
    // ----------------------------------------------------
    // CLASS 6 - 10: FA max 10% (raw 20), SA max 30% (raw 50)
    // Ratio: 10 : 10 : 30 (1 : 1 : 3) -> Total 50
    // ----------------------------------------------------
    // Semester 1
    let fa1_pct = Math.min(10, Math.max(0, Math.round((sem1Target * 10) / 50)));
    let fa2_pct = Math.min(10, Math.max(0, Math.round((sem1Target * 10) / 50)));
    let sa1_pct = sem1Target - fa1_pct - fa2_pct;

    if (sa1_pct > 30) {
      const extra = sa1_pct - 30;
      sa1_pct = 30;
      fa1_pct = Math.min(10, fa1_pct + Math.ceil(extra / 2));
      fa2_pct = Math.min(10, sem1Target - sa1_pct - fa1_pct);
    } else if (sa1_pct < 0) {
      sa1_pct = 0;
      fa1_pct = Math.min(10, Math.ceil(sem1Target / 2));
      fa2_pct = Math.min(10, sem1Target - fa1_pct);
    }

    // Semester 2
    let fa3_pct = Math.min(10, Math.max(0, Math.round((sem2Target * 10) / 50)));
    let fa4_pct = Math.min(10, Math.max(0, Math.round((sem2Target * 10) / 50)));
    let sa2_pct = sem2Target - fa3_pct - fa4_pct;

    if (sa2_pct > 30) {
      const extra = sa2_pct - 30;
      sa2_pct = 30;
      fa3_pct = Math.min(10, fa3_pct + Math.ceil(extra / 2));
      fa4_pct = Math.min(10, sem2Target - sa2_pct - fa3_pct);
    } else if (sa2_pct < 0) {
      sa2_pct = 0;
      fa3_pct = Math.min(10, Math.ceil(sem2Target / 2));
      fa4_pct = Math.min(10, sem2Target - fa3_pct);
    }

    // Respected raw marks (FA max 20, SA max 50)
    const fa1 = Math.min(20, Math.max(0, fa1_pct * 2));
    const fa2 = Math.min(20, Math.max(0, fa2_pct * 2));
    const sa1 = Math.min(50, Math.max(0, Math.round((sa1_pct * 50) / 30)));

    const fa3 = Math.min(20, Math.max(0, fa3_pct * 2));
    const fa4 = Math.min(20, Math.max(0, fa4_pct * 2));
    const sa2 = Math.min(50, Math.max(0, Math.round((sa2_pct * 50) / 30)));

    return {
      code: subCode,
      total: clampedTotal,
      fa1,
      fa1_pct,
      fa2,
      fa2_pct,
      sa1,
      sa1_pct,
      fa3,
      fa3_pct,
      fa4,
      fa4_pct,
      sa2,
      sa2_pct,
      total100: clampedTotal,
    };
  } else {
    // ----------------------------------------------------
    // CLASS 1 - 5: FA max 15% (raw 20), SA max 20% (raw 50)
    // Ratio: 15 : 15 : 20 (3 : 3 : 4) -> Total 50
    // ----------------------------------------------------
    // Semester 1
    let fa1_pct = Math.min(15, Math.max(0, Math.round((sem1Target * 15) / 50)));
    let fa2_pct = Math.min(15, Math.max(0, Math.round((sem1Target * 15) / 50)));
    let sa1_pct = sem1Target - fa1_pct - fa2_pct;

    if (sa1_pct > 20) {
      const extra = sa1_pct - 20;
      sa1_pct = 20;
      fa1_pct = Math.min(15, fa1_pct + Math.ceil(extra / 2));
      fa2_pct = Math.min(15, sem1Target - sa1_pct - fa1_pct);
    } else if (sa1_pct < 0) {
      sa1_pct = 0;
      fa1_pct = Math.min(15, Math.ceil(sem1Target / 2));
      fa2_pct = Math.min(15, sem1Target - fa1_pct);
    }

    // Semester 2
    let fa3_pct = Math.min(15, Math.max(0, Math.round((sem2Target * 15) / 50)));
    let fa4_pct = Math.min(15, Math.max(0, Math.round((sem2Target * 15) / 50)));
    let sa2_pct = sem2Target - fa3_pct - fa4_pct;

    if (sa2_pct > 20) {
      const extra = sa2_pct - 20;
      sa2_pct = 20;
      fa3_pct = Math.min(15, fa3_pct + Math.ceil(extra / 2));
      fa4_pct = Math.min(15, sem2Target - sa2_pct - fa3_pct);
    } else if (sa2_pct < 0) {
      sa2_pct = 0;
      fa3_pct = Math.min(15, Math.ceil(sem2Target / 2));
      fa4_pct = Math.min(15, sem2Target - fa3_pct);
    }

    // Respected raw marks (FA max 20, SA max 50)
    const fa1 = Math.min(20, Math.max(0, Math.round((fa1_pct * 20) / 15)));
    const fa2 = Math.min(20, Math.max(0, Math.round((fa2_pct * 20) / 15)));
    const sa1 = Math.min(50, Math.max(0, Math.round((sa1_pct * 50) / 20)));

    const fa3 = Math.min(20, Math.max(0, Math.round((fa3_pct * 20) / 15)));
    const fa4 = Math.min(20, Math.max(0, Math.round((fa4_pct * 20) / 15)));
    const sa2 = Math.min(50, Math.max(0, Math.round((sa2_pct * 50) / 20)));

    return {
      code: subCode,
      total: clampedTotal,
      fa1,
      fa1_pct,
      fa2,
      fa2_pct,
      sa1,
      sa1_pct,
      fa3,
      fa3_pct,
      fa4,
      fa4_pct,
      sa2,
      sa2_pct,
      total100: clampedTotal,
    };
  }
};

/**
 * Distributes Part B subject marks (Art Education & Computer Education)
 * Sem 1 max 50, Sem 2 max 50 -> Total max 100
 */
export const distributePartB100Marks = (
  total100: number | null | undefined
): { sem1: number | null; sem2: number | null; total: number | null } => {
  if (total100 === null || total100 === undefined || (total100 as any) === '' || isNaN(Number(total100))) {
    return { sem1: null, sem2: null, total: null };
  }
  const clamped = Math.max(0, Math.min(100, Math.round(Number(total100))));
  const sem1 = Math.min(50, Math.max(0, Math.round(clamped / 2)));
  const sem2 = Math.min(50, Math.max(0, clamped - sem1));
  return { sem1, sem2, total: clamped };
};
