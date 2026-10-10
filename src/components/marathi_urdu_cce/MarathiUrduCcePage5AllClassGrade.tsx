import React from 'react';
import { SchoolRecord } from '../../types';
import {
  ComputedMarathiUrduStudent,
  computeMarathiUrduSubjectGradeMatrix,
  MarathiUrduGradeMatrixRow,
} from '../../utils/marathiUrduCceHelper';

interface MarathiUrduCcePage5AllClassGradeProps {
  studentsByClass: Record<string, ComputedMarathiUrduStudent[]>;
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  reportRef?: React.RefObject<HTMLDivElement | null>;
}

export const MarathiUrduCcePage5AllClassGrade: React.FC<MarathiUrduCcePage5AllClassGradeProps> = ({
  studentsByClass,
  schoolRecord,
  academicYear,
  reportRef,
}) => {
  const talukName = schoolRecord?.taluk?.trim() || 'Belagavi Rural';
  const schoolName = schoolRecord?.schoolName || 'ಸರಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಕನ್ನಡ ಶಾಲೆ ನಿಂಗ್ಯಾನಟ್ಟಿ';

  // Compute matrices for classes 1 through 5
  const m1 = computeMarathiUrduSubjectGradeMatrix(studentsByClass['1'] || []);
  const m2 = computeMarathiUrduSubjectGradeMatrix(studentsByClass['2'] || []);
  const m3 = computeMarathiUrduSubjectGradeMatrix(studentsByClass['3'] || []);
  const m4 = computeMarathiUrduSubjectGradeMatrix(studentsByClass['4'] || []);
  const m5 = computeMarathiUrduSubjectGradeMatrix(studentsByClass['5'] || []);

  // Compute 1ST TO 3RD STD subtotal
  const subTotal1to3: MarathiUrduGradeMatrixRow = {
    grade: 'TOTAL',
    fl: {
      boys: m1.totalRow.fl.boys + m2.totalRow.fl.boys + m3.totalRow.fl.boys,
      girls: m1.totalRow.fl.girls + m2.totalRow.fl.girls + m3.totalRow.fl.girls,
      total: m1.totalRow.fl.total + m2.totalRow.fl.total + m3.totalRow.fl.total,
    },
    sl: {
      boys: m1.totalRow.sl.boys + m2.totalRow.sl.boys + m3.totalRow.sl.boys,
      girls: m1.totalRow.sl.girls + m2.totalRow.sl.girls + m3.totalRow.sl.girls,
      total: m1.totalRow.sl.total + m2.totalRow.sl.total + m3.totalRow.sl.total,
    },
    tl: {
      boys: m1.totalRow.tl.boys + m2.totalRow.tl.boys + m3.totalRow.tl.boys,
      girls: m1.totalRow.tl.girls + m2.totalRow.tl.girls + m3.totalRow.tl.girls,
      total: m1.totalRow.tl.total + m2.totalRow.tl.total + m3.totalRow.tl.total,
    },
    maths: {
      boys: m1.totalRow.maths.boys + m2.totalRow.maths.boys + m3.totalRow.maths.boys,
      girls: m1.totalRow.maths.girls + m2.totalRow.maths.girls + m3.totalRow.maths.girls,
      total: m1.totalRow.maths.total + m2.totalRow.maths.total + m3.totalRow.maths.total,
    },
    evs: {
      boys: m1.totalRow.evs.boys + m2.totalRow.evs.boys + m3.totalRow.evs.boys,
      girls: m1.totalRow.evs.girls + m2.totalRow.evs.girls + m3.totalRow.evs.girls,
      total: m1.totalRow.evs.total + m2.totalRow.evs.total + m3.totalRow.evs.total,
    },
  };

  // Compute 1-5th Total grand total
  const grandTotal1to5: MarathiUrduGradeMatrixRow = {
    grade: 'TOTAL',
    fl: {
      boys: subTotal1to3.fl.boys + m4.totalRow.fl.boys + m5.totalRow.fl.boys,
      girls: subTotal1to3.fl.girls + m4.totalRow.fl.girls + m5.totalRow.fl.girls,
      total: subTotal1to3.fl.total + m4.totalRow.fl.total + m5.totalRow.fl.total,
    },
    sl: {
      boys: subTotal1to3.sl.boys + m4.totalRow.sl.boys + m5.totalRow.sl.boys,
      girls: subTotal1to3.sl.girls + m4.totalRow.sl.girls + m5.totalRow.sl.girls,
      total: subTotal1to3.sl.total + m4.totalRow.sl.total + m5.totalRow.sl.total,
    },
    tl: {
      boys: subTotal1to3.tl.boys + m4.totalRow.tl.boys + m5.totalRow.tl.boys,
      girls: subTotal1to3.tl.girls + m4.totalRow.tl.girls + m5.totalRow.tl.girls,
      total: subTotal1to3.tl.total + m4.totalRow.tl.total + m5.totalRow.tl.total,
    },
    maths: {
      boys: subTotal1to3.maths.boys + m4.totalRow.maths.boys + m5.totalRow.maths.boys,
      girls: subTotal1to3.maths.girls + m4.totalRow.maths.girls + m5.totalRow.maths.girls,
      total: subTotal1to3.maths.total + m4.totalRow.maths.total + m5.totalRow.maths.total,
    },
    evs: {
      boys: subTotal1to3.evs.boys + m4.totalRow.evs.boys + m5.totalRow.evs.boys,
      girls: subTotal1to3.evs.girls + m4.totalRow.evs.girls + m5.totalRow.evs.girls,
      total: subTotal1to3.evs.total + m4.totalRow.evs.total + m5.totalRow.evs.total,
    },
  };

  const renderVal = (v: number) => (v > 0 ? v : '');

  const renderClassBlock = (label: string, matrix: ReturnType<typeof computeMarathiUrduSubjectGradeMatrix>) => (
    <>
      {matrix.rows.map((r, rIdx) => (
        <tr key={`${label}_${r.grade}`} className="border-b border-slate-700 hover:bg-slate-50 text-[11px]">
          {rIdx === 0 && (
            <td
              rowSpan={6}
              className="border-2 border-slate-900 font-black text-xs text-center align-middle bg-white w-14 p-1"
            >
              <span
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                className="inline-block py-2 tracking-widest font-black"
              >
                {label}
              </span>
            </td>
          )}
          <td className="border border-slate-900 p-0.5 font-bold font-mono text-center text-xs bg-slate-50">{r.grade}</td>

          {/* First Language */}
          <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(r.fl.boys)}</td>
          <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(r.fl.girls)}</td>
          <td className="border border-slate-900 p-0.5 font-mono text-center font-bold bg-amber-50/40">{renderVal(r.fl.total)}</td>

          {/* Second Langauge */}
          <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(r.sl.boys)}</td>
          <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(r.sl.girls)}</td>
          <td className="border border-slate-900 p-0.5 font-mono text-center font-bold bg-amber-50/40">{renderVal(r.sl.total)}</td>

          {/* Third Langauge */}
          <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(r.tl.boys)}</td>
          <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(r.tl.girls)}</td>
          <td className="border border-slate-900 p-0.5 font-mono text-center font-bold bg-amber-50/40">{renderVal(r.tl.total)}</td>

          {/* Maths */}
          <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(r.maths.boys)}</td>
          <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(r.maths.girls)}</td>
          <td className="border border-slate-900 p-0.5 font-mono text-center font-bold bg-amber-50/40">{renderVal(r.maths.total)}</td>

          {/* EVS */}
          <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(r.evs.boys)}</td>
          <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(r.evs.girls)}</td>
          <td className="border border-slate-900 p-0.5 font-mono text-center font-bold bg-amber-50/40">{renderVal(r.evs.total)}</td>
        </tr>
      ))}

      {/* Class TOTAL Row */}
      <tr className="border-b-2 border-slate-900 bg-slate-200 font-black text-[11px]">
        <td className="border border-slate-900 p-0.5 text-center font-black">TOTAL</td>

        {/* First Language */}
        <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(matrix.totalRow.fl.boys)}</td>
        <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(matrix.totalRow.fl.girls)}</td>
        <td className="border border-slate-900 p-0.5 font-mono text-center font-black bg-slate-300">{renderVal(matrix.totalRow.fl.total)}</td>

        {/* Second Langauge */}
        <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(matrix.totalRow.sl.boys)}</td>
        <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(matrix.totalRow.sl.girls)}</td>
        <td className="border border-slate-900 p-0.5 font-mono text-center font-black bg-slate-300">{renderVal(matrix.totalRow.sl.total)}</td>

        {/* Third Langauge */}
        <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(matrix.totalRow.tl.boys)}</td>
        <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(matrix.totalRow.tl.girls)}</td>
        <td className="border border-slate-900 p-0.5 font-mono text-center font-black bg-slate-300">{renderVal(matrix.totalRow.tl.total)}</td>

        {/* Maths */}
        <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(matrix.totalRow.maths.boys)}</td>
        <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(matrix.totalRow.maths.girls)}</td>
        <td className="border border-slate-900 p-0.5 font-mono text-center font-black bg-slate-300">{renderVal(matrix.totalRow.maths.total)}</td>

        {/* EVS */}
        <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(matrix.totalRow.evs.boys)}</td>
        <td className="border border-slate-900 p-0.5 font-mono text-center">{renderVal(matrix.totalRow.evs.girls)}</td>
        <td className="border border-slate-900 p-0.5 font-mono text-center font-black bg-slate-300">{renderVal(matrix.totalRow.evs.total)}</td>
      </tr>
    </>
  );

  return (
    <div
      ref={reportRef}
      className="bg-white p-6 sm:p-8 rounded-2xl border-[3px] border-slate-950 shadow-lg space-y-4 max-w-[850px] mx-auto legal-portrait print:p-2 print:border-none print:shadow-none"
    >
      {/* Exact Header matching Image 1 */}
      <div className="text-center space-y-1.5 pb-1">
        <h2 className="text-xs sm:text-sm font-bold text-red-600 tracking-wide font-sans">
          Office of the Block Education Officer and Block Resource Coordinator, {talukName}
        </h2>
        <h1 className="text-sm sm:text-base font-bold text-sky-600 tracking-wide font-serif">
          {schoolName}
        </h1>
        <div className="bg-[#1e40af] text-white py-1.5 px-4 rounded-sm mx-auto shadow-xs">
          <h3 className="text-xs sm:text-sm font-bold tracking-wide">
            Class-wise, subject-wise, and grade-wise Annual Abstract of (1-5) for {academicYear}
          </h3>
        </div>
      </div>

      {/* Main Table matching Image 1 */}
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse border-2 border-slate-900">
          <thead>
            {/* Header Row 1: Subjects */}
            <tr className="bg-amber-100 font-black text-slate-900 border-b-2 border-slate-900 text-xs">
              <th rowSpan={2} className="border-2 border-slate-900 p-1.5 w-14 bg-slate-100">
                CLASS
              </th>
              <th rowSpan={2} className="border-2 border-slate-900 p-1.5 w-14 bg-slate-100">
                GRADE
              </th>
              <th colSpan={3} className="border border-slate-900 p-1 bg-[#fed7aa]">
                First Language
              </th>
              <th colSpan={3} className="border border-slate-900 p-1 bg-[#fed7aa]">
                Second Langauge
              </th>
              <th colSpan={3} className="border border-slate-900 p-1 bg-[#fed7aa]">
                Third Langauge
              </th>
              <th colSpan={3} className="border border-slate-900 p-1 bg-[#fed7aa]">
                Maths
              </th>
              <th colSpan={3} className="border border-slate-900 p-1 bg-[#fed7aa]">
                EVS
              </th>
            </tr>
            {/* Header Row 2: B / G / T */}
            <tr className="bg-[#fed7aa] font-black text-slate-900 border-b-2 border-slate-900 text-xs">
              <th className="border border-slate-900 p-0.5 w-7">B</th>
              <th className="border border-slate-900 p-0.5 w-7">G</th>
              <th className="border border-slate-900 p-0.5 w-8">T</th>

              <th className="border border-slate-900 p-0.5 w-7">B</th>
              <th className="border border-slate-900 p-0.5 w-7">G</th>
              <th className="border border-slate-900 p-0.5 w-8">T</th>

              <th className="border border-slate-900 p-0.5 w-7">B</th>
              <th className="border border-slate-900 p-0.5 w-7">G</th>
              <th className="border border-slate-900 p-0.5 w-8">T</th>

              <th className="border border-slate-900 p-0.5 w-7">B</th>
              <th className="border border-slate-900 p-0.5 w-7">G</th>
              <th className="border border-slate-900 p-0.5 w-8">T</th>

              <th className="border border-slate-900 p-0.5 w-7">B</th>
              <th className="border border-slate-900 p-0.5 w-7">G</th>
              <th className="border border-slate-900 p-0.5 w-8">T</th>
            </tr>
          </thead>
          <tbody>
            {/* 1ST STD */}
            {renderClassBlock('1ST STD', m1)}

            {/* 2ND STD */}
            {renderClassBlock('2ND STD', m2)}

            {/* 3RD STD */}
            {renderClassBlock('3RD STD', m3)}

            {/* 1ST TO 3RD STD Subtotal Row */}
            <tr className="bg-[#dcfce7] font-black text-[11px] border-y-2 border-slate-900">
              <td colSpan={2} className="border-2 border-slate-900 p-1.5 text-center font-black">
                1ST TO 3RD STD
              </td>
              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(subTotal1to3.fl.boys)}</td>
              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(subTotal1to3.fl.girls)}</td>
              <td className="border border-slate-900 p-0.5 font-mono font-black">{renderVal(subTotal1to3.fl.total)}</td>

              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(subTotal1to3.sl.boys)}</td>
              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(subTotal1to3.sl.girls)}</td>
              <td className="border border-slate-900 p-0.5 font-mono font-black">{renderVal(subTotal1to3.sl.total)}</td>

              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(subTotal1to3.tl.boys)}</td>
              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(subTotal1to3.tl.girls)}</td>
              <td className="border border-slate-900 p-0.5 font-mono font-black">{renderVal(subTotal1to3.tl.total)}</td>

              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(subTotal1to3.maths.boys)}</td>
              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(subTotal1to3.maths.girls)}</td>
              <td className="border border-slate-900 p-0.5 font-mono font-black">{renderVal(subTotal1to3.maths.total)}</td>

              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(subTotal1to3.evs.boys)}</td>
              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(subTotal1to3.evs.girls)}</td>
              <td className="border border-slate-900 p-0.5 font-mono font-black">{renderVal(subTotal1to3.evs.total)}</td>
            </tr>

            {/* 4TH STD */}
            {renderClassBlock('4TH STD', m4)}

            {/* 5TH STD */}
            {renderClassBlock('5TH STD', m5)}

            {/* 1-5th Total Grand Total Row */}
            <tr className="bg-[#dcfce7] font-black text-[11px] border-t-2 border-slate-900">
              <td colSpan={2} className="border-2 border-slate-900 p-1.5 text-center font-black">
                1-5th Total
              </td>
              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(grandTotal1to5.fl.boys)}</td>
              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(grandTotal1to5.fl.girls)}</td>
              <td className="border border-slate-900 p-0.5 font-mono font-black">{renderVal(grandTotal1to5.fl.total)}</td>

              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(grandTotal1to5.sl.boys)}</td>
              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(grandTotal1to5.sl.girls)}</td>
              <td className="border border-slate-900 p-0.5 font-mono font-black">{renderVal(grandTotal1to5.sl.total)}</td>

              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(grandTotal1to5.tl.boys)}</td>
              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(grandTotal1to5.tl.girls)}</td>
              <td className="border border-slate-900 p-0.5 font-mono font-black">{renderVal(grandTotal1to5.tl.total)}</td>

              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(grandTotal1to5.maths.boys)}</td>
              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(grandTotal1to5.maths.girls)}</td>
              <td className="border border-slate-900 p-0.5 font-mono font-black">{renderVal(grandTotal1to5.maths.total)}</td>

              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(grandTotal1to5.evs.boys)}</td>
              <td className="border border-slate-900 p-0.5 font-mono">{renderVal(grandTotal1to5.evs.girls)}</td>
              <td className="border border-slate-900 p-0.5 font-mono font-black">{renderVal(grandTotal1to5.evs.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Signatures matching Image 1 */}
      <div className="flex items-center justify-between pt-8 text-xs font-black text-slate-900 px-8">
        <div>HM SIGN</div>
        <div>CRP SIGN</div>
        <div>ECO SIGN</div>
      </div>
    </div>
  );
};
