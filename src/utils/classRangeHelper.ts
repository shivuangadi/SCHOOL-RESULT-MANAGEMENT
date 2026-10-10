import { SchoolRecord, StudentClass } from '../types';

/**
 * Single source of truth helper to extract applicable classes
 * from School Profile or schoolRange string.
 *
 * Supported ranges:
 * - 1–5  -> ['1', '2', '3', '4', '5']
 * - 1–7  -> ['1', '2', '3', '4', '5', '6', '7']
 * - 1–8  -> ['1', '2', '3', '4', '5', '6', '7', '8']
 * - 1–10 -> ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
 * - 8–10 -> ['8', '9', '10']
 * - 6–10 -> ['6', '7', '8', '9', '10']
 */
export const getApplicableClasses = (
  schoolProfileOrRange?: SchoolRecord | string | null
): StudentClass[] => {
  if (!schoolProfileOrRange) {
    return ['1', '2', '3', '4', '5', '6', '7', '8'];
  }

  const schoolRange =
    typeof schoolProfileOrRange === 'string'
      ? schoolProfileOrRange
      : schoolProfileOrRange.schoolRange;

  if (!schoolRange) {
    return ['1', '2', '3', '4', '5', '6', '7', '8'];
  }

  const matches = schoolRange.match(/\d+/g);
  if (matches && matches.length > 0) {
    const nums = matches.map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));
    if (nums.length >= 2) {
      const minClass = Math.min(...nums);
      const maxClass = Math.max(...nums);
      const classes: StudentClass[] = [];
      for (let c = minClass; c <= maxClass; c++) {
        classes.push(String(c) as StudentClass);
      }
      return classes;
    } else if (nums.length === 1) {
      const maxClass = nums[0];
      const classes: StudentClass[] = [];
      for (let c = 1; c <= maxClass; c++) {
        classes.push(String(c) as StudentClass);
      }
      return classes;
    }
  }

  return ['1', '2', '3', '4', '5', '6', '7', '8'];
};

export const getClassesFromRange = getApplicableClasses;

export const getLowestClass = (
  schoolProfileOrRange?: SchoolRecord | string | null
): number => {
  const classes = getApplicableClasses(schoolProfileOrRange);
  return Number(classes[0] || 1);
};

export const getHighestClass = (
  schoolProfileOrRange?: SchoolRecord | string | null
): number => {
  const classes = getApplicableClasses(schoolProfileOrRange);
  return Number(classes[classes.length - 1] || 10);
};

export const getHighestClassFromRange = getHighestClass;

export const isClassApplicable = (
  cls: string | number,
  schoolProfileOrRange?: SchoolRecord | string | null
): boolean => {
  const str = String(cls);
  const classes = getApplicableClasses(schoolProfileOrRange);
  return classes.includes(str as StudentClass);
};
