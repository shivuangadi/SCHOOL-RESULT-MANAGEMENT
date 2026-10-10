import React from 'react';
import { SchoolRecord } from '../../types';
import { ComputedMarathiUrduStudent } from '../../utils/marathiUrduCceHelper';

interface MarathiUrduCcePage3ClassGradeProps {
  computedList: ComputedMarathiUrduStudent[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  selectedClass: string;
  medium?: 'Marathi' | 'Urdu';
  workingDays?: number;
  classTeacherName: string;
  reportRef?: React.RefObject<HTMLDivElement | null>;
}

export const MarathiUrduCcePage3ClassGrade: React.FC<MarathiUrduCcePage3ClassGradeProps> = ({
  computedList,
  schoolRecord,
  academicYear,
  selectedClass,
  medium,
  classTeacherName,
  reportRef,
}) => {
  const talukName = schoolRecord?.taluk?.trim() || 'Belagavi Rural';
  const schoolName = schoolRecord?.schoolName || 'GOVERNMENT HIGHER PRIMARY SCHOOL';
  const clusterName = schoolRecord?.cluster || 'Ningyanatti';

  const grades = ['A+', 'A', 'B+', 'B', 'C'] as const;
  const subjects = ['FL', 'SL', 'TL', 'MATHS', 'EVS'] as const;

  // Compute breakdown for Boys, Girls, Total per Grade per Subject
  const matrix: Record<string, Record<string, { b: number; g: number; t: number }>> = {};

  grades.forEach((g) => {
    matrix[g] = {};
    subjects.forEach((sub) => {
      matrix[g][sub] = { b: 0, g: 0, t: 0 };
    });
  });

  const totals: Record<string, { b: number; g: number; t: number }> = {};
  subjects.forEach((sub) => {
    totals[sub] = { b: 0, g: 0, t: 0 };
  });

  computedList.forEach((cSt) => {
    const isGirl = cSt.student.gender === 'Girl';
    subjects.forEach((subKey) => {
      const g = cSt.subjects[subKey]?.grade;
      if (g && (matrix as any)[g] && (matrix as any)[g][subKey]) {
        if (isGirl) {
          matrix[g][subKey].g += 1;
        } else {
          matrix[g][subKey].b += 1;
        }
        matrix[g][subKey].t += 1;

        if (isGirl) {
          totals[subKey].g += 1;
        } else {
          totals[subKey].b += 1;
        }
        totals[subKey].t += 1;
      }
    });
  });

  return (
    <div
      ref={reportRef}
      className="bg-white p-6 sm:p-10 rounded-3xl border-2 border-emerald-600 shadow-md space-y-6 legal-landscape max-w-5xl mx-auto print:p-2 print:border-none print:shadow-none"
    >
      {/* Official Header matching Page 3 */}
      <div className="text-center space-y-2 border-b-2 border-slate-900 pb-4">
        <h2 className="text-xs sm:text-sm font-bold text-rose-800 tracking-wide uppercase">
          Office of the Block Education Officer and Block Resource Coordinator, {talukName}
        </h2>
        <div className="bg-blue-900 text-white py-1.5 px-6 rounded-lg inline-block shadow-xs">
          <h1 className="text-xs sm:text-sm font-extrabold tracking-wide">
            Subject-wise and grade-wise Consolidation of Annual Results for the {academicYear} Academic Year.
          </h1>
        </div>

        <div className="flex justify-between items-center text-xs font-bold text-slate-900 pt-3 px-2">
          <div>
            SCHOOL NAME : <span className="font-black">{schoolName}</span>
          </div>
          <div>
            Cluster Name: <span className="font-black">{clusterName}</span>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs font-bold text-slate-800 pt-1 px-2">
          <div className="bg-blue-600 text-white px-3 py-1 rounded-md font-black">
            CLASS: {selectedClass} ನೇ ತರಗತಿ ({medium} Medium)
          </div>
          <div className="bg-blue-200 text-blue-950 px-3 py-1 rounded-md font-black border border-blue-400">
            CLASS TEACHER'S NAME: <span className="font-black">{classTeacherName || 'Class Teacher'}</span>
          </div>
        </div>
      </div>

      {/* Grade Matrix Table matching Page 3 */}
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full text-xs text-center border-collapse border-2 border-slate-900">
          <thead>
            {/* Header Row 1 */}
            <tr className="bg-amber-100 font-black text-slate-950 border-b-2 border-slate-900">
              <th rowSpan={2} className="border border-slate-900 p-2 w-16 bg-amber-200 text-sm">
                ಶ್ರೇಣಿ
              </th>
              <th colSpan={3} className="border border-slate-900 p-1.5">
                First Lang
              </th>
              <th colSpan={3} className="border border-slate-900 p-1.5">
                Sec Lang
              </th>
              <th colSpan={3} className="border border-slate-900 p-1.5">
                Third Lang
              </th>
              <th colSpan={3} className="border border-slate-900 p-1.5">
                MATHS
              </th>
              <th colSpan={3} className="border border-slate-900 p-1.5">
                EVS
              </th>
            </tr>
            {/* Header Row 2: B G T */}
            <tr className="bg-amber-100 font-bold text-slate-900 border-b-2 border-slate-900 text-[11px]">
              <th className="border border-slate-900 p-1 w-8">B</th>
              <th className="border border-slate-900 p-1 w-8">G</th>
              <th className="border border-slate-900 p-1 w-9 font-black">T</th>

              <th className="border border-slate-900 p-1 w-8">B</th>
              <th className="border border-slate-900 p-1 w-8">G</th>
              <th className="border border-slate-900 p-1 w-9 font-black">T</th>

              <th className="border border-slate-900 p-1 w-8">B</th>
              <th className="border border-slate-900 p-1 w-8">G</th>
              <th className="border border-slate-900 p-1 w-9 font-black">T</th>

              <th className="border border-slate-900 p-1 w-8">B</th>
              <th className="border border-slate-900 p-1 w-8">G</th>
              <th className="border border-slate-900 p-1 w-9 font-black">T</th>

              <th className="border border-slate-900 p-1 w-8">B</th>
              <th className="border border-slate-900 p-1 w-8">G</th>
              <th className="border border-slate-900 p-1 w-9 font-black">T</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade) => (
              <tr key={grade} className="border-b border-slate-900 hover:bg-slate-50 font-bold">
                <td className="border border-slate-900 p-2 font-black bg-amber-50 text-slate-950">
                  {grade}
                </td>
                {subjects.map((sub) => {
                  const data = matrix[grade][sub];
                  return (
                    <React.Fragment key={sub}>
                      <td className="border border-slate-900 p-1.5 font-mono">{data.b || '-'}</td>
                      <td className="border border-slate-900 p-1.5 font-mono">{data.g || '-'}</td>
                      <td className="border border-slate-900 p-1.5 font-mono font-black bg-slate-50">{data.t || '-'}</td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
            {/* TOTAL Row */}
            <tr className="bg-amber-100 font-black border-t-2 border-slate-900 text-slate-950">
              <td className="border border-slate-900 p-2 bg-amber-200 font-extrabold text-sm">
                TOTAL
              </td>
              {subjects.map((sub) => {
                const tot = totals[sub];
                return (
                  <React.Fragment key={sub}>
                    <td className="border border-slate-900 p-1.5 font-mono">{tot.b || '-'}</td>
                    <td className="border border-slate-900 p-1.5 font-mono">{tot.g || '-'}</td>
                    <td className="border border-slate-900 p-1.5 font-mono font-black bg-amber-200">{tot.t || '-'}</td>
                  </React.Fragment>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer matching Page 3 */}
      <div className="pt-4 flex items-center justify-between text-xs font-bold text-slate-900 px-4">
        <div>
          <div>Place: {schoolRecord?.cluster || 'Belagavi'}</div>
          <div>Date: {new Date().toLocaleDateString('en-GB')}</div>
        </div>
        <div>Class Teacher's Sign</div>
        <div>Head Master Sign</div>
      </div>
    </div>
  );
};
