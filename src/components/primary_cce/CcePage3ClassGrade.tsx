import React, { useState } from 'react';
import { SchoolRecord } from '../../types';
import {
  ComputedStudentCce,
  computeSubjectGradeMatrix,
  extractLastWordOfSchoolName,
} from '../../utils/primaryCceHelper';

interface CcePage3ClassGradeProps {
  computedList: ComputedStudentCce[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  selectedClass: string;
  classTeacherName: string;
  workingDays?: number;
  reportRef?: React.RefObject<HTMLDivElement | null>;
}

export const CcePage3ClassGrade: React.FC<CcePage3ClassGradeProps> = ({
  computedList,
  schoolRecord,
  academicYear,
  selectedClass,
  classTeacherName,
  workingDays = 220,
  reportRef,
}) => {
  const { rows, totalRow } = computeSubjectGradeMatrix(computedList);
  const currentDate = new Date().toLocaleDateString('en-GB');
  const defaultPlace = extractLastWordOfSchoolName(schoolRecord?.schoolName);
  const [placeName, setPlaceName] = useState(defaultPlace);

  const isKannada =
    (schoolRecord?.medium || (schoolRecord as any)?.schoolMedium || '').toLowerCase().includes('kannada') ||
    (schoolRecord?.medium || (schoolRecord as any)?.schoolMedium || '').includes('ಕನ್ನಡ') ||
    !(schoolRecord?.medium || (schoolRecord as any)?.schoolMedium);

  return (
    <div
      ref={reportRef}
      className="bg-white p-8 sm:p-10 rounded-3xl border-2 border-emerald-600 shadow-md space-y-6 legal-landscape max-w-5xl mx-auto print:p-2 print:border-none print:shadow-none"
    >
      {/* Official Header matching Page 3 */}
      <div className="text-center space-y-2 border-b-2 border-slate-900 pb-4">
        <h2 className="text-base sm:text-lg font-black text-slate-950 font-serif">
          {isKannada
            ? `ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ ${schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ'}`
            : `Office of the Block Education Officer and Block Resource Coordinator, ${schoolRecord?.taluk || 'Belagavi Rural'}`}
        </h2>
        <div className="bg-blue-900 text-white py-1 px-4 rounded-lg inline-block">
          <h3 className="text-xs sm:text-sm font-extrabold tracking-wide">
            1 ರಿಂದ 5 ನೇ ತರಗತಿಗಳ {academicYear} ನೇ ಸಾಲಿನ ವಾರ್ಷಿಕ ಪರಿಣಾಮ ಪತ್ರಿಕೆಯ ವಿಷಯವಾರು ಹಾಗೂ ಶ್ರೇಣಿವಾರು ಘೋಷವಾರ
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-800 pt-3 text-left">
          <div>
            ಶಾಲೆಯ ಹೆಸರು : <span className="font-black text-slate-950">{schoolRecord?.schoolName || 'ಸರಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಕನ್ನಡ ಶಾಲೆ'}</span>
          </div>
          <div className="text-right">
            ಕ್ಲಸ್ಟರ್ ಹೆಸರು : <span className="font-black text-slate-950">{schoolRecord?.cluster || 'ನಿಂಗ್ಯಾನಟ್ಟಿ'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-bold text-slate-800 pt-1">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-md font-black">
              ತರಗತಿ: {selectedClass}ನೇ ತರಗತಿ
            </div>
            <div>
              ಶಾಲೆ ನಡೆದ ದಿನಗಳ ಸಂಖ್ಯೆ: <span className="font-mono font-black text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">{workingDays}</span>
            </div>
          </div>
          <div>
            ವರ್ಗ ಶಿಕ್ಷಕರ ಹೆಸರು: <span className="font-black text-slate-950">{classTeacherName || 'ವರ್ಗ ಶಿಕ್ಷಕರು'}</span>
          </div>
        </div>
      </div>

      {/* Grade Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-center border-collapse border-2 border-slate-900">
          <thead>
            <tr className="bg-slate-100 font-bold text-slate-900 border-b-2 border-slate-900">
              <th rowSpan={2} className="border border-slate-900 p-2 w-20 text-sm font-black bg-slate-200">
                ಶ್ರೇಣಿ
              </th>
              <th colSpan={3} className="border border-slate-900 p-2 bg-blue-50">
                ಪ್ರಥಮ ಭಾಷೆ/First Lang
              </th>
              <th colSpan={3} className="border border-slate-900 p-2 bg-indigo-50">
                ದ್ವಿತೀಯ ಭಾಷೆ/Sec Lang
              </th>
              <th colSpan={3} className="border border-slate-900 p-2 bg-amber-50">
                ಗಣಿತ/MATHS
              </th>
              <th colSpan={3} className="border border-slate-900 p-2 bg-emerald-50">
                ಪರಿಸರ ಅಧ್ಯಯನ/EVS
              </th>
            </tr>
            <tr className="bg-slate-50 font-bold text-slate-800 border-b-2 border-slate-900 text-[11px]">
              <th className="border border-slate-900 p-1 w-12">ಗಂ</th>
              <th className="border border-slate-900 p-1 w-12">ಹೆ</th>
              <th className="border border-slate-900 p-1 w-14 bg-blue-100">ಒಟ್ಟು</th>

              <th className="border border-slate-900 p-1 w-12">ಗಂ</th>
              <th className="border border-slate-900 p-1 w-12">ಹೆ</th>
              <th className="border border-slate-900 p-1 w-14 bg-indigo-100">ಒಟ್ಟು</th>

              <th className="border border-slate-900 p-1 w-12">ಗಂ</th>
              <th className="border border-slate-900 p-1 w-12">ಹೆ</th>
              <th className="border border-slate-900 p-1 w-14 bg-amber-100">ಒಟ್ಟು</th>

              <th className="border border-slate-900 p-1 w-12">ಗಂ</th>
              <th className="border border-slate-900 p-1 w-12">ಹೆ</th>
              <th className="border border-slate-900 p-1 w-14 bg-emerald-100">ಒಟ್ಟು</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.grade} className="border-b border-slate-800 hover:bg-slate-50">
                <td className="border border-slate-900 p-2 font-black text-sm bg-slate-100/60 font-mono">
                  {row.grade}
                </td>
                {/* FL */}
                <td className="border border-slate-900 p-2 font-mono font-bold">{row.fl.boys || '-'}</td>
                <td className="border border-slate-900 p-2 font-mono font-bold">{row.fl.girls || '-'}</td>
                <td className="border border-slate-900 p-2 font-mono font-black bg-blue-50">{row.fl.total || '-'}</td>

                {/* SL */}
                <td className="border border-slate-900 p-2 font-mono font-bold">{row.sl.boys || '-'}</td>
                <td className="border border-slate-900 p-2 font-mono font-bold">{row.sl.girls || '-'}</td>
                <td className="border border-slate-900 p-2 font-mono font-black bg-indigo-50">{row.sl.total || '-'}</td>

                {/* MATHS */}
                <td className="border border-slate-900 p-2 font-mono font-bold">{row.maths.boys || '-'}</td>
                <td className="border border-slate-900 p-2 font-mono font-bold">{row.maths.girls || '-'}</td>
                <td className="border border-slate-900 p-2 font-mono font-black bg-amber-50">{row.maths.total || '-'}</td>

                {/* EVS */}
                <td className="border border-slate-900 p-2 font-mono font-bold">{row.evs.boys || '-'}</td>
                <td className="border border-slate-900 p-2 font-mono font-bold">{row.evs.girls || '-'}</td>
                <td className="border border-slate-900 p-2 font-mono font-black bg-emerald-50">{row.evs.total || '-'}</td>
              </tr>
            ))}

            {/* Total Row */}
            <tr className="bg-slate-200 font-black text-sm border-t-2 border-slate-900">
              <td className="border border-slate-900 p-2 text-slate-950 font-black">
                TOTAL
              </td>
              <td className="border border-slate-900 p-2 font-mono">{totalRow.fl.boys}</td>
              <td className="border border-slate-900 p-2 font-mono">{totalRow.fl.girls}</td>
              <td className="border border-slate-900 p-2 font-mono bg-blue-200 text-blue-950">{totalRow.fl.total}</td>

              <td className="border border-slate-900 p-2 font-mono">{totalRow.sl.boys}</td>
              <td className="border border-slate-900 p-2 font-mono">{totalRow.sl.girls}</td>
              <td className="border border-slate-900 p-2 font-mono bg-indigo-200 text-indigo-950">{totalRow.sl.total}</td>

              <td className="border border-slate-900 p-2 font-mono">{totalRow.maths.boys}</td>
              <td className="border border-slate-900 p-2 font-mono">{totalRow.maths.girls}</td>
              <td className="border border-slate-900 p-2 font-mono bg-amber-200 text-amber-950">{totalRow.maths.total}</td>

              <td className="border border-slate-900 p-2 font-mono">{totalRow.evs.boys}</td>
              <td className="border border-slate-900 p-2 font-mono">{totalRow.evs.girls}</td>
              <td className="border border-slate-900 p-2 font-mono bg-emerald-200 text-emerald-950">{totalRow.evs.total}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer matching Page 3 */}
      <div className="pt-6 text-xs font-bold text-slate-800">
        <div className="flex flex-nowrap items-center justify-between px-2 gap-2 whitespace-nowrap overflow-hidden text-[10px] sm:text-xs">
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
            ದಿನಾಂಕ: <span className="font-mono">{currentDate}</span>
          </div>
          <div className="shrink-0">ವರ್ಗ ಶಿಕ್ಷಕರ ಸಹಿ</div>
          <div className="shrink-0">ಮುಖ್ಯ ಗುರುಗಳ ಸಹಿ</div>
        </div>
      </div>
    </div>
  );
};
