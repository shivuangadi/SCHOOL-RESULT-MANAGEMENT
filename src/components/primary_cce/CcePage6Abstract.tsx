import React, { useState } from 'react';
import { SchoolRecord } from '../../types';
import {
  ComputedStudentCce,
  computeClassCategoryStats,
  ClassCategoryStats,
  extractLastWordOfSchoolName,
} from '../../utils/primaryCceHelper';

interface CcePage6AbstractProps {
  studentsByClass: Record<string, ComputedStudentCce[]>;
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  reportRef?: React.RefObject<HTMLDivElement | null>;
}

export const CcePage6Abstract: React.FC<CcePage6AbstractProps> = ({
  studentsByClass,
  schoolRecord,
  academicYear,
  reportRef,
}) => {
  const defaultPlace = extractLastWordOfSchoolName(schoolRecord?.schoolName);
  const [placeName, setPlaceName] = useState(defaultPlace);
  const c1 = computeClassCategoryStats('1', studentsByClass['1'] || []);
  const c2 = computeClassCategoryStats('2', studentsByClass['2'] || []);
  const c3 = computeClassCategoryStats('3', studentsByClass['3'] || []);
  const c4 = computeClassCategoryStats('4', studentsByClass['4'] || []);
  const c5 = computeClassCategoryStats('5', studentsByClass['5'] || []);

  const classStatsList: ClassCategoryStats[] = [c1, c2, c3, c4, c5];

  // Grand Total calculation
  const sumField = (
    list: ClassCategoryStats[],
    type: 'enrolled' | 'appeared' | 'notAppeared',
    cat: 'sc' | 'st' | 'obc' | 'gen' | 'total',
    gender: 'b' | 'g' | 't'
  ) => list.reduce((sum, s) => sum + s[type][cat][gender], 0);

  const grandTotalStats: ClassCategoryStats = {
    classNum: 'ಒಟ್ಟು (1-5)',
    enrolled: {
      sc: { b: sumField(classStatsList, 'enrolled', 'sc', 'b'), g: sumField(classStatsList, 'enrolled', 'sc', 'g'), t: sumField(classStatsList, 'enrolled', 'sc', 't') },
      st: { b: sumField(classStatsList, 'enrolled', 'st', 'b'), g: sumField(classStatsList, 'enrolled', 'st', 'g'), t: sumField(classStatsList, 'enrolled', 'st', 't') },
      obc: { b: sumField(classStatsList, 'enrolled', 'obc', 'b'), g: sumField(classStatsList, 'enrolled', 'obc', 'g'), t: sumField(classStatsList, 'enrolled', 'obc', 't') },
      gen: { b: sumField(classStatsList, 'enrolled', 'gen', 'b'), g: sumField(classStatsList, 'enrolled', 'gen', 'g'), t: sumField(classStatsList, 'enrolled', 'gen', 't') },
      total: { b: sumField(classStatsList, 'enrolled', 'total', 'b'), g: sumField(classStatsList, 'enrolled', 'total', 'g'), t: sumField(classStatsList, 'enrolled', 'total', 't') },
    },
    appeared: {
      sc: { b: sumField(classStatsList, 'appeared', 'sc', 'b'), g: sumField(classStatsList, 'appeared', 'sc', 'g'), t: sumField(classStatsList, 'appeared', 'sc', 't') },
      st: { b: sumField(classStatsList, 'appeared', 'st', 'b'), g: sumField(classStatsList, 'appeared', 'st', 'g'), t: sumField(classStatsList, 'appeared', 'st', 't') },
      obc: { b: sumField(classStatsList, 'appeared', 'obc', 'b'), g: sumField(classStatsList, 'appeared', 'obc', 'g'), t: sumField(classStatsList, 'appeared', 'obc', 't') },
      gen: { b: sumField(classStatsList, 'appeared', 'gen', 'b'), g: sumField(classStatsList, 'appeared', 'gen', 'g'), t: sumField(classStatsList, 'appeared', 'gen', 't') },
      total: { b: sumField(classStatsList, 'appeared', 'total', 'b'), g: sumField(classStatsList, 'appeared', 'total', 'g'), t: sumField(classStatsList, 'appeared', 'total', 't') },
    },
    notAppeared: {
      sc: { b: sumField(classStatsList, 'notAppeared', 'sc', 'b'), g: sumField(classStatsList, 'notAppeared', 'sc', 'g'), t: sumField(classStatsList, 'notAppeared', 'sc', 't') },
      st: { b: sumField(classStatsList, 'notAppeared', 'st', 'b'), g: sumField(classStatsList, 'notAppeared', 'st', 'g'), t: sumField(classStatsList, 'notAppeared', 'st', 't') },
      obc: { b: sumField(classStatsList, 'notAppeared', 'obc', 'b'), g: sumField(classStatsList, 'notAppeared', 'obc', 'g'), t: sumField(classStatsList, 'notAppeared', 'obc', 't') },
      gen: { b: sumField(classStatsList, 'notAppeared', 'gen', 'b'), g: sumField(classStatsList, 'notAppeared', 'gen', 'g'), t: sumField(classStatsList, 'notAppeared', 'gen', 't') },
      total: { b: sumField(classStatsList, 'notAppeared', 'total', 'b'), g: sumField(classStatsList, 'notAppeared', 'total', 'g'), t: sumField(classStatsList, 'notAppeared', 'total', 't') },
    },
  };

  const renderSectionColumns = (stats: ClassCategoryStats, type: 'enrolled' | 'appeared' | 'notAppeared') => {
    const data = stats[type];
    return (
      <>
        {/* SC */}
        <td className="border border-slate-900 p-1 font-mono">{data.sc.b || '-'}</td>
        <td className="border border-slate-900 p-1 font-mono">{data.sc.g || '-'}</td>
        {/* ST */}
        <td className="border border-slate-900 p-1 font-mono">{data.st.b || '-'}</td>
        <td className="border border-slate-900 p-1 font-mono">{data.st.g || '-'}</td>
        {/* OBC */}
        <td className="border border-slate-900 p-1 font-mono">{data.obc.b || '-'}</td>
        <td className="border border-slate-900 p-1 font-mono">{data.obc.g || '-'}</td>
        {/* GEN */}
        <td className="border border-slate-900 p-1 font-mono">{data.gen.b || '-'}</td>
        <td className="border border-slate-900 p-1 font-mono">{data.gen.g || '-'}</td>
        {/* Total */}
        <td className="border border-slate-900 p-1 font-mono font-bold">{data.total.b || '-'}</td>
        <td className="border border-slate-900 p-1 font-mono font-bold">{data.total.g || '-'}</td>
        <td className="border border-slate-900 p-1 font-mono font-black bg-slate-100">{data.total.t || '-'}</td>
      </>
    );
  };

  const medium = schoolRecord?.schoolMedium || (schoolRecord as any)?.medium || '';
  const isKannada =
    medium.includes('ಕನ್ನಡ') ||
    medium.toLowerCase().includes('kannada') ||
    !medium;

  return (
    <div
      ref={reportRef}
      className="bg-white p-6 sm:p-10 rounded-3xl border-2 border-red-500 shadow-md space-y-5 legal-landscape max-w-6xl mx-auto print:p-2 print:border-none print:shadow-none"
    >
      {/* Official Header matching Page 6 */}
      <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-3">
        {isKannada && (
          <h2 className="text-sm sm:text-base font-black text-slate-950 font-serif">
            ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ {schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ'}
          </h2>
        )}
        <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
          {academicYear} ನೇ ಸಾಲಿನ ವಾರ್ಷಿಕ ಪರಿಣಾಮ ಪತ್ರಿಕೆಯ ಘೋಷವಾರ
        </h3>

        <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-800 pt-2 px-1">
          <div>
            ಶಾಲೆಯ ಹೆಸರು :- <span className="font-black text-slate-950">{schoolRecord?.schoolName || 'ಸರಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಕನ್ನಡ ಶಾಲೆ ನಿಂಗ್ಯಾನಟ್ಟಿ'}</span>
          </div>
          <div>
            ಡೈಸ್ ಕೋಡ್: <span className="font-mono font-black text-slate-950">{schoolRecord?.diseCode || '29010409301'}</span>
          </div>
          <div>
            ಕ್ಲಸ್ಟರ್ ಹೆಸರು : <span className="font-black text-slate-950">{schoolRecord?.cluster || 'ನಿಂಗ್ಯಾನಟ್ಟಿ'}</span>
          </div>
        </div>
      </div>

      {/* Main Abstract Table with 3 Major Columns */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-[11px] text-center border-collapse border-2 border-slate-900">
          <colgroup>
            <col style={{ width: '5.2%' }} />
            {Array.from({ length: 33 }).map((_, i) => (
              <col key={i} style={{ width: '2.87%' }} />
            ))}
          </colgroup>
          <thead>
            {/* Top Super Headers */}
            <tr className="bg-slate-100 font-black text-slate-900 border-b-2 border-slate-900">
              <th rowSpan={3} className="border border-slate-900 p-1 w-12 bg-slate-200">ತರಗತಿ</th>
              <th colSpan={11} className="border border-slate-900 p-1.5 bg-blue-50 text-blue-950">
                ದಾಖಲಾತಿ (Enrollment)
              </th>
              <th colSpan={11} className="border border-slate-900 p-1.5 bg-emerald-50 text-emerald-950">
                ನಿರಂತರ ವ್ಯಾಪಕ ಮೌಲ್ಯಮಾಪನಕ್ಕೆ ಒಳಪಟ್ಟ ಮಕ್ಕಳ ಸಂಖ್ಯೆ (Appeared in CCE)
              </th>
              <th colSpan={11} className="border border-slate-900 p-1.5 bg-rose-50 text-rose-950">
                ನಿರಂತರ ವ್ಯಾಪಕ ಮೌಲ್ಯಮಾಪನಕ್ಕೆ ಒಳಪಡದ ಮಕ್ಕಳ ಸಂಖ್ಯೆ (Not Appeared / Exempt)
              </th>
            </tr>

            {/* Sub-Header 1: Categories */}
            <tr className="bg-slate-50 font-bold text-slate-800 border-b border-slate-900 text-[10px]">
              {/* Enrollment Categories */}
              <th colSpan={2} className="border border-slate-900 p-0.5">SC</th>
              <th colSpan={2} className="border border-slate-900 p-0.5">ST</th>
              <th colSpan={2} className="border border-slate-900 p-0.5">OBC</th>
              <th colSpan={2} className="border border-slate-900 p-0.5">GEN</th>
              <th colSpan={3} className="border border-slate-900 p-0.5 bg-blue-100">Total</th>

              {/* Appeared Categories */}
              <th colSpan={2} className="border border-slate-900 p-0.5">SC</th>
              <th colSpan={2} className="border border-slate-900 p-0.5">ST</th>
              <th colSpan={2} className="border border-slate-900 p-0.5">OBC</th>
              <th colSpan={2} className="border border-slate-900 p-0.5">GEN</th>
              <th colSpan={3} className="border border-slate-900 p-0.5 bg-emerald-100">Total</th>

              {/* Not Appeared Categories */}
              <th colSpan={2} className="border border-slate-900 p-0.5">SC</th>
              <th colSpan={2} className="border border-slate-900 p-0.5">ST</th>
              <th colSpan={2} className="border border-slate-900 p-0.5">OBC</th>
              <th colSpan={2} className="border border-slate-900 p-0.5">GEN</th>
              <th colSpan={3} className="border border-slate-900 p-0.5 bg-rose-100">Total</th>
            </tr>

            {/* Sub-Header 2: ಗಂ & ಹೆ */}
            <tr className="bg-slate-50 font-bold text-slate-700 border-b-2 border-slate-900 text-[9px]">
              {/* 3 repeats of (ಗಂ, ಹೆ, ಗಂ, ಹೆ, ಗಂ, ಹೆ, ಗಂ, ಹೆ, ಗಂ, ಹೆ, ಒ) */}
              {[1, 2, 3].map((grp) => (
                <React.Fragment key={grp}>
                  <th className="border border-slate-900 p-0.5 w-7">ಗಂ</th>
                  <th className="border border-slate-900 p-0.5 w-7">ಹೆ</th>
                  <th className="border border-slate-900 p-0.5 w-7">ಗಂ</th>
                  <th className="border border-slate-900 p-0.5 w-7">ಹೆ</th>
                  <th className="border border-slate-900 p-0.5 w-7">ಗಂ</th>
                  <th className="border border-slate-900 p-0.5 w-7">ಹೆ</th>
                  <th className="border border-slate-900 p-0.5 w-7">ಗಂ</th>
                  <th className="border border-slate-900 p-0.5 w-7">ಹೆ</th>
                  <th className="border border-slate-900 p-0.5 w-7 bg-slate-200">ಗಂ</th>
                  <th className="border border-slate-900 p-0.5 w-7 bg-slate-200">ಹೆ</th>
                  <th className="border border-slate-900 p-0.5 w-8 bg-slate-300 font-black">ಒ</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {classStatsList.map((cs) => (
              <tr key={cs.classNum} className="border-b border-slate-800 hover:bg-slate-50 text-[10px]">
                <td className="border border-slate-900 p-1.5 font-black bg-slate-100">
                  {cs.classNum}
                </td>
                {renderSectionColumns(cs, 'enrolled')}
                {renderSectionColumns(cs, 'appeared')}
                {renderSectionColumns(cs, 'notAppeared')}
              </tr>
            ))}

            {/* Grand Total (1-5) Row */}
            <tr className="bg-amber-100 font-black text-[11px] border-t-2 border-slate-900">
              <td className="border border-slate-900 p-1.5 text-amber-950 font-black">
                {grandTotalStats.classNum}
              </td>
              {renderSectionColumns(grandTotalStats, 'enrolled')}
              {renderSectionColumns(grandTotalStats, 'appeared')}
              {renderSectionColumns(grandTotalStats, 'notAppeared')}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Official Declaration matching Page 6 */}
      <div className="pt-2 text-xs font-bold text-slate-800 space-y-1.5 px-2">
        <div className="font-black text-slate-900">ದೃಢೀಕರಣ:</div>
        <div className="text-[11px] text-slate-700 pl-4 space-y-1">
          <div>1] 1ರಿಂದ 5 ನೇ ತರಗತಿಯ ವರೆಗೆ ಸಿ.ಸಿ.ಇ ಆಧಾರಿತ ಮೌಲ್ಯಮಾಪನ ಮಾಡಲಾಗಿದೆ</div>
          <div>2] ಪ್ರತಿ ವರ್ಗಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ ಎಲ್ಲಾ ಸಹ ಶಿಕ್ಷಕರ, ದೈ.ಶಿ ಪೂರಕ ದಾಖಲೆಗಳನ್ನು ಖುದ್ದಾಗಿ ಪರಿಶೀಲಿಸಿಯೇ ಅಂತಿಮ ಮೌಲ್ಯಮಾಪನ ವರದಿಯನ್ನು ಮಾನ್ಯರ ಪರಿಶೀಲನೆಗೆ ಒಪ್ಪಿಸಿದೆ</div>
        </div>
      </div>

      {/* Signatures Footer matching Page 6 (Strictly single line nowrap) */}
      <div className="flex flex-nowrap items-center justify-between pt-6 text-[10px] sm:text-xs font-bold text-slate-900 px-4 gap-2 whitespace-nowrap overflow-hidden w-full">
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
