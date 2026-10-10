import React, { useState } from 'react';
import { SchoolRecord } from '../../types';
import {
  ComputedStudentCce,
  computeSubjectGradeMatrix,
  extractLastWordOfSchoolName,
} from '../../utils/primaryCceHelper';

interface CcePage5AllClassGradeProps {
  studentsByClass: Record<string, ComputedStudentCce[]>;
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  reportRef?: React.RefObject<HTMLDivElement | null>;
}

export const CcePage5AllClassGrade: React.FC<CcePage5AllClassGradeProps> = ({
  studentsByClass,
  schoolRecord,
  academicYear,
  reportRef,
}) => {
  const defaultPlace = extractLastWordOfSchoolName(schoolRecord?.schoolName);
  const [placeName, setPlaceName] = useState(defaultPlace);
  const medium = schoolRecord?.schoolMedium || (schoolRecord as any)?.medium || '';
  const isKannada =
    medium.includes('ಕನ್ನಡ') ||
    medium.toLowerCase().includes('kannada') ||
    !medium;
  // Compute matrices for classes 1 through 5
  const m1 = computeSubjectGradeMatrix(studentsByClass['1'] || []);
  const m2 = computeSubjectGradeMatrix(studentsByClass['2'] || []);
  const m3 = computeSubjectGradeMatrix(studentsByClass['3'] || []);
  const m4 = computeSubjectGradeMatrix(studentsByClass['4'] || []);
  const m5 = computeSubjectGradeMatrix(studentsByClass['5'] || []);

  // Compute 1-3 subtotal
  const subTotal1to3 = {
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

  // Compute 1-5 grand total
  const grandTotal1to5 = {
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

  const renderClassBlock = (label: string, matrix: ReturnType<typeof computeSubjectGradeMatrix>) => (
    <>
      {matrix.rows.map((r, rIdx) => (
        <tr key={`${label}_${r.grade}`} className="border-b border-slate-700 hover:bg-slate-50">
          {rIdx === 0 && (
            <td
              rowSpan={6}
              className="border-2 border-slate-900 p-2 font-black text-xs bg-slate-100 text-slate-950 align-middle text-center w-20"
            >
              {label}
            </td>
          )}
          <td className="border border-slate-900 p-1 font-mono font-bold bg-slate-50 text-xs">{r.grade}</td>
          {/* FL */}
          <td className="border border-slate-900 p-1 font-mono">{r.fl.boys || '-'}</td>
          <td className="border border-slate-900 p-1 font-mono">{r.fl.girls || '-'}</td>
          <td className="border border-slate-900 p-1 font-mono font-bold bg-blue-50/50">{r.fl.total || '-'}</td>
          {/* SL */}
          <td className="border border-slate-900 p-1 font-mono">{r.sl.boys || '-'}</td>
          <td className="border border-slate-900 p-1 font-mono">{r.sl.girls || '-'}</td>
          <td className="border border-slate-900 p-1 font-mono font-bold bg-indigo-50/50">{r.sl.total || '-'}</td>
          {/* MATHS */}
          <td className="border border-slate-900 p-1 font-mono">{r.maths.boys || '-'}</td>
          <td className="border border-slate-900 p-1 font-mono">{r.maths.girls || '-'}</td>
          <td className="border border-slate-900 p-1 font-mono font-bold bg-amber-50/50">{r.maths.total || '-'}</td>
          {/* EVS */}
          <td className="border border-slate-900 p-1 font-mono">{r.evs.boys || '-'}</td>
          <td className="border border-slate-900 p-1 font-mono">{r.evs.girls || '-'}</td>
          <td className="border border-slate-900 p-1 font-mono font-bold bg-emerald-50/50">{r.evs.total || '-'}</td>
        </tr>
      ))}
      {/* Class Total Row */}
      <tr className="bg-slate-200/80 font-black text-xs border-b-2 border-slate-900">
        <td className="border border-slate-900 p-1 font-black">TOTAL</td>
        <td className="border border-slate-900 p-1 font-mono">{matrix.totalRow.fl.boys}</td>
        <td className="border border-slate-900 p-1 font-mono">{matrix.totalRow.fl.girls}</td>
        <td className="border border-slate-900 p-1 font-mono bg-blue-100 text-blue-950">{matrix.totalRow.fl.total}</td>

        <td className="border border-slate-900 p-1 font-mono">{matrix.totalRow.sl.boys}</td>
        <td className="border border-slate-900 p-1 font-mono">{matrix.totalRow.sl.girls}</td>
        <td className="border border-slate-900 p-1 font-mono bg-indigo-100 text-indigo-950">{matrix.totalRow.sl.total}</td>

        <td className="border border-slate-900 p-1 font-mono">{matrix.totalRow.maths.boys}</td>
        <td className="border border-slate-900 p-1 font-mono">{matrix.totalRow.maths.girls}</td>
        <td className="border border-slate-900 p-1 font-mono bg-amber-100 text-amber-950">{matrix.totalRow.maths.total}</td>

        <td className="border border-slate-900 p-1 font-mono">{matrix.totalRow.evs.boys}</td>
        <td className="border border-slate-900 p-1 font-mono">{matrix.totalRow.evs.girls}</td>
        <td className="border border-slate-900 p-1 font-mono bg-emerald-100 text-emerald-950">{matrix.totalRow.evs.total}</td>
      </tr>
    </>
  );

  return (
    <div
      ref={reportRef}
      className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-300 shadow-md space-y-4 legal-portrait max-w-4xl mx-auto print:p-2 print:border-none print:shadow-none"
    >
      {/* Official Header matching Page 5 */}
      <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-3">
        {isKannada && (
          <h2 className="text-sm sm:text-base font-black text-slate-950 font-serif">
            ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ {schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ'}
          </h2>
        )}
        <h3 className="text-base sm:text-lg font-black text-red-700">
          {schoolRecord?.schoolName || 'ಸರಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಕನ್ನಡ ಶಾಲೆ ನಿಂಗ್ಯಾನಟ್ಟಿ'}
        </h3>
        <p className="text-xs font-black text-blue-900">
          {academicYear} ನೇ ಸಾಲಿನ ವಾರ್ಷಿಕ ಪರಿಣಾಮ ಪತ್ರಿಕೆಯ ಘೋಷವಾರ
        </p>
        <div className="bg-blue-800 text-white py-1 px-4 rounded-lg inline-block text-xs font-black">
          ತರಗತಿವಾರು, ವಿಷಯವಾರು ಹಾಗೂ ಶ್ರೇಣಿವಾರು ಘೋಷವಾರ 1-5
        </div>
      </div>

      {/* Main Portrait Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] text-center border-collapse border-2 border-slate-900">
          <thead>
            <tr className="bg-slate-100 font-bold text-slate-900 border-b-2 border-slate-900">
              <th rowSpan={2} className="border border-slate-900 p-1.5 w-20">ತರಗತಿ</th>
              <th rowSpan={2} className="border border-slate-900 p-1.5 w-12">ಶ್ರೇಣಿ</th>
              <th colSpan={3} className="border border-slate-900 p-1 bg-blue-50">ಪ್ರಥಮ ಭಾಷೆ</th>
              <th colSpan={3} className="border border-slate-900 p-1 bg-indigo-50">ದ್ವಿತೀಯ ಭಾಷೆ</th>
              <th colSpan={3} className="border border-slate-900 p-1 bg-amber-50">ಗಣಿತ/MATHS</th>
              <th colSpan={3} className="border border-slate-900 p-1 bg-emerald-50">ಆ & ಪ/EVS</th>
            </tr>
            <tr className="bg-slate-50 font-bold text-slate-800 border-b-2 border-slate-900 text-[10px]">
              <th className="border border-slate-900 p-1 w-9">ಗಂ</th>
              <th className="border border-slate-900 p-1 w-9">ಹೆ</th>
              <th className="border border-slate-900 p-1 w-11 bg-blue-100">ಒಟ್ಟು</th>

              <th className="border border-slate-900 p-1 w-9">ಗಂ</th>
              <th className="border border-slate-900 p-1 w-9">ಹೆ</th>
              <th className="border border-slate-900 p-1 w-11 bg-indigo-100">ಒಟ್ಟು</th>

              <th className="border border-slate-900 p-1 w-9">ಗಂ</th>
              <th className="border border-slate-900 p-1 w-9">ಹೆ</th>
              <th className="border border-slate-900 p-1 w-11 bg-amber-100">ಒಟ್ಟು</th>

              <th className="border border-slate-900 p-1 w-9">ಗಂ</th>
              <th className="border border-slate-900 p-1 w-9">ಹೆ</th>
              <th className="border border-slate-900 p-1 w-11 bg-emerald-100">ಒಟ್ಟು</th>
            </tr>
          </thead>
          <tbody>
            {renderClassBlock('೧ನೇ ತರಗತಿ', m1)}
            {renderClassBlock('೨ನೇ ತರಗತಿ', m2)}
            {renderClassBlock('೩ನೇ ತರಗತಿ', m3)}

            {/* 1ನೇ ರಿಂದ 3ನೇ ತರಗತಿ Sub-Total */}
            <tr className="bg-blue-100 font-black text-xs border-y-2 border-slate-900">
              <td colSpan={2} className="border border-slate-900 p-1.5 text-blue-950 font-black">
                ೧ ರಿಂದ ೩ನೇ ತರಗತಿ ಒಟ್ಟು
              </td>
              <td className="border border-slate-900 p-1 font-mono">{subTotal1to3.fl.boys}</td>
              <td className="border border-slate-900 p-1 font-mono">{subTotal1to3.fl.girls}</td>
              <td className="border border-slate-900 p-1 font-mono bg-blue-200 text-blue-950">{subTotal1to3.fl.total}</td>

              <td className="border border-slate-900 p-1 font-mono">{subTotal1to3.sl.boys}</td>
              <td className="border border-slate-900 p-1 font-mono">{subTotal1to3.sl.girls}</td>
              <td className="border border-slate-900 p-1 font-mono bg-indigo-200 text-indigo-950">{subTotal1to3.sl.total}</td>

              <td className="border border-slate-900 p-1 font-mono">{subTotal1to3.maths.boys}</td>
              <td className="border border-slate-900 p-1 font-mono">{subTotal1to3.maths.girls}</td>
              <td className="border border-slate-900 p-1 font-mono bg-amber-200 text-amber-950">{subTotal1to3.maths.total}</td>

              <td className="border border-slate-900 p-1 font-mono">{subTotal1to3.evs.boys}</td>
              <td className="border border-slate-900 p-1 font-mono">{subTotal1to3.evs.girls}</td>
              <td className="border border-slate-900 p-1 font-mono bg-emerald-200 text-emerald-950">{subTotal1to3.evs.total}</td>
            </tr>

            {renderClassBlock('೪ನೇ ತರಗತಿ', m4)}
            {renderClassBlock('೫ನೇ ತರಗತಿ', m5)}

            {/* 1-5th Grand Total */}
            <tr className="bg-emerald-100 font-black text-xs border-t-2 border-slate-900">
              <td colSpan={2} className="border border-slate-900 p-2 text-emerald-950 font-black text-sm">
                ೧ ರಿಂದ ೫ನೇ ತರಗತಿ ಒಟ್ಟು
              </td>
              <td className="border border-slate-900 p-1 font-mono">{grandTotal1to5.fl.boys}</td>
              <td className="border border-slate-900 p-1 font-mono">{grandTotal1to5.fl.girls}</td>
              <td className="border border-slate-900 p-1 font-mono bg-emerald-200 text-emerald-950 text-sm">{grandTotal1to5.fl.total}</td>

              <td className="border border-slate-900 p-1 font-mono">{grandTotal1to5.sl.boys}</td>
              <td className="border border-slate-900 p-1 font-mono">{grandTotal1to5.sl.girls}</td>
              <td className="border border-slate-900 p-1 font-mono bg-emerald-200 text-emerald-950 text-sm">{grandTotal1to5.sl.total}</td>

              <td className="border border-slate-900 p-1 font-mono">{grandTotal1to5.maths.boys}</td>
              <td className="border border-slate-900 p-1 font-mono">{grandTotal1to5.maths.girls}</td>
              <td className="border border-slate-900 p-1 font-mono bg-emerald-200 text-emerald-950 text-sm">{grandTotal1to5.maths.total}</td>

              <td className="border border-slate-900 p-1 font-mono">{grandTotal1to5.evs.boys}</td>
              <td className="border border-slate-900 p-1 font-mono">{grandTotal1to5.evs.girls}</td>
              <td className="border border-slate-900 p-1 font-mono bg-emerald-200 text-emerald-950 text-sm">{grandTotal1to5.evs.total}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Official Signatures Footer matching Page 5 (Strictly single line nowrap) */}
      <div className="flex flex-nowrap items-center justify-between pt-6 text-[10px] sm:text-xs font-bold text-slate-900 px-2 gap-2 whitespace-nowrap overflow-hidden w-full">
        <div className="flex items-center gap-1.5 shrink-0">
          <span>ಸ್ಥಳ:</span>
          <input
            type="text"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            className="border-b border-slate-400 font-bold px-1 bg-transparent w-28 focus:outline-blue-500 focus:bg-white text-slate-900 text-[10px]"
            placeholder="ಸ್ಥಳದ ಹೆಸರು"
            title="ಸ್ಥಳವನ್ನು ಬದಲಾಯಿಸಲು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ (Default: ಶಾಲೆಯ ಹೆಸರಿನ ಕೊನೆಯ ಪದ)"
          />
        </div>
        <div className="shrink-0">
          <span>ದಿನಾಂಕ: {new Date().toLocaleDateString('kn-IN')}</span>
        </div>
        <div className="shrink-0">ಮುಖ್ಯ ಶಿಕ್ಷಕರ ಸಹಿ: <span className="font-black text-slate-950">{schoolRecord?.headmasterName || 'Headmaster'}</span></div>
        <div className="shrink-0">ಸಮೂಹ ಸಂಪನ್ಮೂಲ ವ್ಯಕ್ತಿಯ ಸಹಿ (CRP)</div>
        <div className="shrink-0">ಶಿಕ್ಷಣ ಸಂಯೋಜಕರ ಸಹಿ</div>
      </div>
    </div>
  );
};
