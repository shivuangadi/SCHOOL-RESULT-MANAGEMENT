import React from 'react';
import { SchoolRecord, Student } from '../../types';
import {
  computeClassAbstractRowStats,
  ClassAbstractRowStats,
  AbstractSectionStats,
} from '../../utils/marathiUrduCceHelper';

interface MarathiUrduCcePage6AbstractProps {
  studentsByClass: Record<string, { student: Student; isExempted?: boolean }[]>;
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  reportRef?: React.RefObject<HTMLDivElement | null>;
}

export const MarathiUrduCcePage6Abstract: React.FC<MarathiUrduCcePage6AbstractProps> = ({
  studentsByClass,
  schoolRecord,
  academicYear,
  reportRef,
}) => {
  const talukName = schoolRecord?.taluk?.trim() || 'Belagavi Rural';
  const schoolName = schoolRecord?.schoolName || 'GOVERNMENT HIGHER PRIMARY SCHOOL NINGYANATTI';
  const diseCode = schoolRecord?.diseCode || '29010409301';
  const clusterName = schoolRecord?.cluster || schoolRecord?.crcCluster || 'Ningyanatti';

  const row1 = computeClassAbstractRowStats('1', studentsByClass['1'] || []);
  const row2 = computeClassAbstractRowStats('2', studentsByClass['2'] || []);
  const row3 = computeClassAbstractRowStats('3', studentsByClass['3'] || []);
  const row4 = computeClassAbstractRowStats('4', studentsByClass['4'] || []);
  const row5 = computeClassAbstractRowStats('5', studentsByClass['5'] || []);

  const classRows: ClassAbstractRowStats[] = [row1, row2, row3, row4, row5];

  // Helper to sum up across classRows
  const sumSectionField = (
    rows: ClassAbstractRowStats[],
    section: 'enrolled' | 'appeared' | 'notCovered',
    cat: 'sc' | 'st' | 'obc' | 'gen',
    g: 'b' | 'g'
  ) => rows.reduce((acc, r) => acc + r[section][cat][g], 0);

  const sumTotalField = (
    rows: ClassAbstractRowStats[],
    section: 'enrolled' | 'appeared' | 'notCovered',
    g: 'b' | 'g' | 't'
  ) => rows.reduce((acc, r) => acc + r[section].total[g], 0);

  const buildTotalSection = (section: 'enrolled' | 'appeared' | 'notCovered'): AbstractSectionStats => ({
    sc: { b: sumSectionField(classRows, section, 'sc', 'b'), g: sumSectionField(classRows, section, 'sc', 'g') },
    st: { b: sumSectionField(classRows, section, 'st', 'b'), g: sumSectionField(classRows, section, 'st', 'g') },
    obc: { b: sumSectionField(classRows, section, 'obc', 'b'), g: sumSectionField(classRows, section, 'obc', 'g') },
    gen: { b: sumSectionField(classRows, section, 'gen', 'b'), g: sumSectionField(classRows, section, 'gen', 'g') },
    total: {
      b: sumTotalField(classRows, section, 'b'),
      g: sumTotalField(classRows, section, 'g'),
      t: sumTotalField(classRows, section, 't'),
    },
  });

  const grandTotalRow: ClassAbstractRowStats = {
    classNum: 'TOTAL (1-5)',
    enrolled: buildTotalSection('enrolled'),
    appeared: buildTotalSection('appeared'),
    notCovered: buildTotalSection('notCovered'),
  };

  const renderCellVal = (val: number) => (val > 0 ? val : '-');

  const renderSectionColumns = (stats: AbstractSectionStats) => (
    <>
      {/* SC */}
      <td className="border border-slate-900 p-0.5 font-mono">{renderCellVal(stats.sc.b)}</td>
      <td className="border border-slate-900 p-0.5 font-mono">{renderCellVal(stats.sc.g)}</td>

      {/* ST */}
      <td className="border border-slate-900 p-0.5 font-mono">{renderCellVal(stats.st.b)}</td>
      <td className="border border-slate-900 p-0.5 font-mono">{renderCellVal(stats.st.g)}</td>

      {/* OBC */}
      <td className="border border-slate-900 p-0.5 font-mono">{renderCellVal(stats.obc.b)}</td>
      <td className="border border-slate-900 p-0.5 font-mono">{renderCellVal(stats.obc.g)}</td>

      {/* GEN */}
      <td className="border border-slate-900 p-0.5 font-mono">{renderCellVal(stats.gen.b)}</td>
      <td className="border border-slate-900 p-0.5 font-mono">{renderCellVal(stats.gen.g)}</td>

      {/* Total */}
      <td className="border border-slate-900 p-0.5 font-mono font-bold">{renderCellVal(stats.total.b)}</td>
      <td className="border border-slate-900 p-0.5 font-mono font-bold">{renderCellVal(stats.total.g)}</td>
      <td className="border border-slate-900 p-0.5 font-mono font-black">{renderCellVal(stats.total.t)}</td>
    </>
  );

  return (
    <div
      ref={reportRef}
      className="bg-white p-6 sm:p-8 rounded-xl border-[2.5px] border-red-600 shadow-md space-y-4 legal-landscape max-w-[1300px] mx-auto print:p-2 print:border-none print:shadow-none"
    >
      {/* Header exactly matching Image 2 */}
      <div className="text-center space-y-1 pb-1">
        <h2 className="text-sm sm:text-base font-bold text-slate-950 font-sans">
          Office of the Block Education Officer and Block Resource Coordinator, {talukName}
        </h2>
        <h3 className="text-sm sm:text-base font-bold text-slate-950">
          Abstract Report of School Annual Result For the Academic Year {academicYear}
        </h3>
      </div>

      {/* Meta Row: School Name, DISE, Cluster */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-900 px-1 pt-1">
        <div>
          <span>SCHOOL NAME: </span>
          <span className="font-extrabold">{schoolName}</span>
        </div>
        <div>
          <span>DISE NO: </span>
          <span className="font-mono font-extrabold">{diseCode}</span>
        </div>
        <div>
          <span>CLUSTER: </span>
          <span className="font-extrabold">{clusterName}</span>
        </div>
      </div>

      {/* Main Abstract Table with exact styling & evenly distributed columns */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-[11px] text-center border-collapse border-2 border-slate-900">
          <colgroup>
            <col style={{ width: '5.2%' }} />
            {Array.from({ length: 33 }).map((_, i) => (
              <col key={i} style={{ width: '2.87%' }} />
            ))}
          </colgroup>
          <thead>
            {/* Header Row 1: Section Super Headers */}
            <tr className="font-bold text-slate-900 border-b-2 border-slate-900">
              <th rowSpan={3} className="border-2 border-slate-900 p-1 bg-white font-black text-xs align-middle">
                CLASS
              </th>
              <th colSpan={11} className="border-2 border-slate-900 p-1.5 bg-[#fed7aa] font-bold text-xs">
                Enrollment
              </th>
              <th colSpan={11} className="border-2 border-slate-900 p-1.5 bg-[#dcfce7] font-bold text-xs">
                Number of children subject to Continuous and Comprehensive Evaluation
              </th>
              <th colSpan={11} className="border-2 border-slate-900 p-1.5 bg-[#fed7aa] font-bold text-xs">
                Number of children not covered under Continuous and Comprehensive Evaluation
              </th>
            </tr>

            {/* Header Row 2: Categories */}
            <tr className="font-bold text-slate-900 border-b border-slate-900 text-[10px]">
              {/* Enrollment: SC, ST, OBC, GEN, Total */}
              <th colSpan={2} className="border border-slate-900 p-0.5 bg-[#fed7aa]">SC</th>
              <th colSpan={2} className="border border-slate-900 p-0.5 bg-[#fed7aa]">ST</th>
              <th colSpan={2} className="border border-slate-900 p-0.5 bg-[#fed7aa]">OBC</th>
              <th colSpan={2} className="border border-slate-900 p-0.5 bg-[#fed7aa]">GEN</th>
              <th colSpan={3} className="border border-slate-900 p-0.5 bg-[#fed7aa]">Total</th>

              {/* Subject to CCE: SC, ST, OBC, GEN, Total */}
              <th colSpan={2} className="border border-slate-900 p-0.5 bg-[#dcfce7]">SC</th>
              <th colSpan={2} className="border border-slate-900 p-0.5 bg-[#dcfce7]">ST</th>
              <th colSpan={2} className="border border-slate-900 p-0.5 bg-[#dcfce7]">OBC</th>
              <th colSpan={2} className="border border-slate-900 p-0.5 bg-[#dcfce7]">GEN</th>
              <th colSpan={3} className="border border-slate-900 p-0.5 bg-[#dcfce7]">Total</th>

              {/* Not Covered CCE: SC, ST, OBC, GEN, Total */}
              <th colSpan={2} className="border border-slate-900 p-0.5 bg-[#fed7aa]">SC</th>
              <th colSpan={2} className="border border-slate-900 p-0.5 bg-[#fed7aa]">ST</th>
              <th colSpan={2} className="border border-slate-900 p-0.5 bg-[#fed7aa]">OBC</th>
              <th colSpan={2} className="border border-slate-900 p-0.5 bg-[#fed7aa]">GEN</th>
              <th colSpan={3} className="border border-slate-900 p-0.5 bg-[#fed7aa]">Total</th>
            </tr>

            {/* Header Row 3: B, G and B, G, T */}
            <tr className="font-bold text-slate-900 border-b-2 border-slate-900 text-[9px]">
              {/* Section 1 */}
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">B</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">G</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">B</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">G</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">B</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">G</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">B</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">G</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">B</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">G</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa] font-black">T</th>

              {/* Section 2 */}
              <th className="border border-slate-900 p-0.5 bg-[#dcfce7]">B</th>
              <th className="border border-slate-900 p-0.5 bg-[#dcfce7]">G</th>
              <th className="border border-slate-900 p-0.5 bg-[#dcfce7]">B</th>
              <th className="border border-slate-900 p-0.5 bg-[#dcfce7]">G</th>
              <th className="border border-slate-900 p-0.5 bg-[#dcfce7]">B</th>
              <th className="border border-slate-900 p-0.5 bg-[#dcfce7]">G</th>
              <th className="border border-slate-900 p-0.5 bg-[#dcfce7]">B</th>
              <th className="border border-slate-900 p-0.5 bg-[#dcfce7]">G</th>
              <th className="border border-slate-900 p-0.5 bg-[#dcfce7]">B</th>
              <th className="border border-slate-900 p-0.5 bg-[#dcfce7]">G</th>
              <th className="border border-slate-900 p-0.5 bg-[#dcfce7] font-black">T</th>

              {/* Section 3 */}
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">B</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">G</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">B</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">G</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">B</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">G</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">B</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">G</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">B</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa]">G</th>
              <th className="border border-slate-900 p-0.5 bg-[#fed7aa] font-black">T</th>
            </tr>
          </thead>
          <tbody>
            {classRows.map((cr, idx) => {
              // Striped rows matching Image 2: row 1, 3, 5 are light blue (#dbeafe / #bfdbfe)
              const isBlue = idx % 2 === 0;
              return (
                <tr
                  key={cr.classNum}
                  className={`border-b border-slate-800 text-[11px] ${
                    isBlue ? 'bg-[#dbeafe]' : 'bg-white'
                  }`}
                >
                  <td className="border-2 border-slate-900 p-1.5 font-black text-sm">
                    {cr.classNum}
                  </td>
                  {renderSectionColumns(cr.enrolled)}
                  {renderSectionColumns(cr.appeared)}
                  {renderSectionColumns(cr.notCovered)}
                </tr>
              );
            })}

            {/* TOTAL (1-5) Row exactly in light green matching Image 2 */}
            <tr className="bg-[#dcfce7] font-black text-[11px] border-t-2 border-slate-900">
              <td className="border-2 border-slate-900 p-1.5 font-black text-xs text-slate-950">
                {grandTotalRow.classNum}
              </td>
              {renderSectionColumns(grandTotalRow.enrolled)}
              {renderSectionColumns(grandTotalRow.appeared)}
              {renderSectionColumns(grandTotalRow.notCovered)}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Declaration exactly matching Image 2 */}
      <div className="pt-2 text-xs font-bold text-slate-900 space-y-1 px-1">
        <div className="font-extrabold">Declaration:</div>
        <div className="pl-4 space-y-0.5 text-[11px] leading-relaxed text-slate-800">
          <div>1] CCE based assessment has been done from class 1 to 5</div>
          <div>
            2] The final evaluation report has been submitted for the review of the Honorable after personally
            verifying the supplementary documents of all the co-teachers and the PE Teacher for each class.
          </div>
        </div>
      </div>

      {/* Signatures Footer exactly matching Image 2 */}
      <div className="flex items-center justify-between pt-6 text-xs font-black text-slate-900 px-6">
        <div>HEAD MASTER SIGN</div>
        <div>SIGNATURE OF CRP</div>
        <div>SIGNATURE OF ECO</div>
      </div>
    </div>
  );
};
