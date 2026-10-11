import React, { useState } from 'react';
import { SchoolRecord, isCwsnExempted, isCwsnStudent } from '../../types';
import {
  ComputedHpStudent,
  HpSubjectCode,
  HP_CO_ACTIVITIES,
  calculateHpGrade,
  getHpSubjectsForMedium,
  getHpCoGradeValue,
} from '../../utils/higherPrimaryCceHelper';

interface HpCcePage2Register9LineProps {
  computedList: ComputedHpStudent[];
  schoolRecord: SchoolRecord | null;
  academicYear: string;
  selectedClass: string;
  classTeacherName: string;
  workingDays: number;
  reportRef?: React.RefObject<HTMLDivElement | null>;
  onUpdateMarks?: (studentId: string, subCode: HpSubjectCode, field: string, val: number | null) => void;
  onUpdateExamPct?: (studentId: string, subCode: HpSubjectCode, exam: 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2', val: number | null) => void;
  onUpdateSubject100?: (studentId: string, subCode: HpSubjectCode, total100: number | null) => void;
  onUpdateAttendance?: (studentId: string, days: number) => void;
  onUpdateSemAttendance?: (studentId: string, sem: 'sem1' | 'sem2', days: number) => void;
  onUpdateCoGrade?: (studentId: string, sem: 'sem1' | 'sem2' | 'final', key: string, val: string) => void;
  onUpdatePartBMarks?: (studentId: string, subjectKey: string, sem: 'sem1' | 'sem2' | 'total', val: number | null) => void;
}

export const HpCcePage2Register9Line: React.FC<HpCcePage2Register9LineProps> = ({
  computedList,
  schoolRecord,
  academicYear,
  selectedClass,
  classTeacherName,
  workingDays,
  reportRef,
  onUpdateMarks,
  onUpdateExamPct,
  onUpdateSubject100,
  onUpdateAttendance,
  onUpdateSemAttendance,
  onUpdateCoGrade,
  onUpdatePartBMarks,
}) => {
  const [studentsPerPage, setStudentsPerPage] = useState<number>(3);
  const medium = schoolRecord?.schoolMedium || 'Kannada';
  const isKannada =
    medium.toLowerCase().includes('kannada') ||
    medium.includes('ಕನ್ನಡ') ||
    !medium;
  const subjects = getHpSubjectsForMedium(medium);

  // Group students strictly per legal page sheet so no student is split across pages
  const chunks: ComputedHpStudent[][] = [];
  for (let i = 0; i < computedList.length; i += studentsPerPage) {
    chunks.push(computedList.slice(i, i + studentsPerPage));
  }
  if (chunks.length === 0) chunks.push([]);

  const talukName = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
  const schoolName = schoolRecord?.schoolName || 'ಸರಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಕನ್ನಡ ಶಾಲೆ ನಿಂಗ್ಯಾನಟ್ಟಿ';

  return (
    <div ref={reportRef} className="space-y-6 legal-landscape">
      {/* Top Configuration & Pagination Bar (Hidden in Print) */}
      <div className="bg-slate-900 text-white p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs print:hidden shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-300">📄 ಪುಟ ವಿನ್ಯಾಸ (Page Setup):</span>
          <span>ಒಂದು ಪುಟಕ್ಕೆ ವಿದ್ಯಾರ್ಥಿಗಳು:</span>
          <select
            value={studentsPerPage}
            onChange={(e) => setStudentsPerPage(Number(e.target.value))}
            className="bg-slate-800 text-amber-300 font-bold border border-slate-600 rounded px-2.5 py-1 cursor-pointer focus:outline-none"
          >
            <option value={3}>೩ ವಿದ್ಯಾರ್ಥಿಗಳು / ಪುಟ (3 Students/Page - Official Standard)</option>
            <option value={2}>೨ ವಿದ್ಯಾರ್ಥಿಗಳು / ಪುಟ (2 Students/Page)</option>
            <option value={1}>೧ ವಿದ್ಯಾರ್ಥಿ / ಪುಟ (1 Student/Page)</option>
          </select>
        </div>
        <div className="text-slate-300 text-[11px]">
          ಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು: <span className="font-mono text-white font-black">{computedList.length}</span> • 
          ಒಟ್ಟು ಪುಟಗಳು: <span className="font-mono text-amber-300 font-black">{chunks.length}</span> (Legal Landscape)
        </div>
      </div>

      {/* Pages rendering */}
      {chunks.map((chunk, pageIdx) => (
        <div
          key={pageIdx}
          className="report-page-sheet bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-300 shadow-sm space-y-2 break-after-page print:p-0 print:border-none print:shadow-none print:rounded-none mb-6"
        >
          {/* Official Bilingual Header matching the official format */}
          <div className="text-center space-y-0.5 border-b-2 border-slate-900 pb-2">
            <h2 className="text-xs sm:text-sm font-black text-slate-950 font-serif leading-tight">
              {isKannada
                ? `ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ ${talukName}`
                : `Office of the Block Education Officer and Block Resource Coordinator, ${talukName}`}
            </h2>
            <h3 className="text-sm sm:text-base font-black text-slate-950 leading-tight">
              {schoolName}
            </h3>
            <p className="text-[11px] font-bold text-slate-900">
              {academicYear} ನೇ ಸಾಲಿನ ವಿಷಯವಾರು ರೂಪನಾತ್ಮಕ ಹಾಗೂ ಸಂಕಲನಾತ್ಮಕ ಮೌಲ್ಯಮಾಪನ ಕ್ರೋಢೀಕರಣ ವಹಿ (All Subject Consolidation - 700 Marks)
            </p>

            {/* Sub-header 3-column banner */}
            <div className="grid grid-cols-3 items-center text-center text-[10px] sm:text-[10.5px] font-bold text-slate-900 pt-1.5 pb-0.5 px-2 w-full gap-2 border-t border-slate-200">
              <div className="flex justify-start items-center">
                <span className="bg-amber-100 text-amber-950 px-2.5 py-0.5 rounded border border-amber-300 font-black whitespace-nowrap">
                  ತರಗತಿ: {selectedClass}ನೇ ತರಗತಿ ({selectedClass}th Std)
                </span>
              </div>
              <div className="flex justify-center items-center text-slate-950 whitespace-nowrap font-black">
                <span>ವರ್ಗ ಶಿಕ್ಷಕರ ಹೆಸರು: <span className="text-slate-950 underline">{classTeacherName || 'ವರ್ಗ ಶಿಕ್ಷಕರು'}</span></span>
              </div>
              <div className="flex justify-end items-center text-slate-950 whitespace-nowrap">
                <span>
                  ಶಾಲೆ ನಡೆದ ದಿನಗಳ ಸಂಖ್ಯೆ: <span className="font-mono font-black text-slate-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">{workingDays}</span>
                </span>
              </div>
            </div>
          </div>

          {/* 9-Line Consolidation Table */}
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-[7.5px] sm:text-[8px] text-center border-collapse border-2 border-slate-900 table-fixed">
              <thead>
                {/* Header Row 1 */}
                <tr className="bg-slate-100 font-black text-slate-950 border-b border-slate-900">
                  {/* 1. Sl No */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-[22px] align-middle bg-slate-50">
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block whitespace-nowrap py-1 mx-auto font-black text-[7.5px]">
                      ಕ್ರ. ಸಂಖ್ಯೆ
                    </span>
                  </th>

                  {/* 2. Admission / Reg No */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-[26px] align-middle bg-slate-50">
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block whitespace-nowrap py-1 mx-auto font-black text-[7.5px]">
                      ದಾಖಲಾತಿ ಸಂಖ್ಯೆ
                    </span>
                  </th>

                  {/* 3. Student Name */}
                  <th rowSpan={3} className="border border-slate-900 p-1 w-[125px] align-middle font-black text-slate-950">
                    ವಿದ್ಯಾರ್ಥಿಗಳ ಹೆಸರು
                  </th>

                  {/* 4. Days Attended */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-[26px] align-middle bg-slate-50">
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block whitespace-nowrap py-1 mx-auto font-black text-[7.5px]">
                      ಹಾಜರಾದ ದಿನಗಳು
                    </span>
                  </th>

                  {/* 5. Evaluation Period */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-[32px] align-middle bg-slate-50">
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block whitespace-nowrap py-1 mx-auto font-black text-[7.5px]">
                      ಮೌಲ್ಯಮಾಪನದ ಅವಧಿ
                    </span>
                  </th>

                  {/* 6. Percentage */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-[28px] align-middle bg-slate-50">
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block whitespace-nowrap py-1 mx-auto font-black text-[7.5px]">
                      ಶೇಕಡಾ ಪ್ರಮಾಣ
                    </span>
                  </th>

                  {/* 7. Curricular Subjects Group Header (Red text banner) */}
                  <th colSpan={14} className="border border-slate-900 p-1 bg-red-50 text-red-600 font-black text-[9px] border-r-2 border-r-slate-900">
                    ಅ. ವಿದ್ಯಾರ್ಥಿಯ ಶೈಕ್ಷಣಿಕ ಸಾಧನೆ ಪಠ್ಯ ವಿಷಯಗಳಿಗೆ ಸಂಬಂಧಿಸಿದಂತೆ
                  </th>

                  {/* 8. Max Marks (700) */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-[26px] align-middle bg-amber-50 font-black">
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block whitespace-nowrap py-1 mx-auto font-black text-[7.5px]">
                      ಗರಿಷ್ಠ 700
                    </span>
                  </th>

                  {/* 9. Total Header */}
                  <th colSpan={3} className="border border-slate-900 p-1 bg-amber-100 font-black text-slate-950 text-[9px]">
                    ಒಟ್ಟು ಪಡೆದ ಅಂಕಗಳು
                  </th>

                  {/* 10. Part B Header: 2 Subjects (4 cols) + 7 Co-Scholastic Activities (7 cols) = 11 columns */}
                  <th colSpan={11} className="border border-slate-900 p-1 bg-red-50 text-red-600 font-black text-[9px] border-l-2 border-l-red-600">
                    ಆ. ಸಹ ಪಠ್ಯ ವಿಷಯಗಳು & ಶ್ರೇಣಿಗಳು (ಭಾಗ-ಬಿ)
                  </th>

                  {/* 11. Result Header (Red text) */}
                  <th rowSpan={3} className="border border-slate-900 p-0.5 w-[28px] align-middle bg-emerald-50 text-red-600 font-black">
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="inline-block whitespace-nowrap py-1 mx-auto font-black text-[8px]">
                      ಫಲಿತಾಂಶ
                    </span>
                  </th>
                </tr>

                {/* Sub-Header Row 2 */}
                <tr className="bg-slate-50 text-[7.5px] font-bold text-slate-900 border-b border-slate-900">
                  {/* 7 Curricular Subjects */}
                  {subjects.map((s) => (
                    <th key={s.code} colSpan={2} className="border border-slate-900 p-0.5 truncate font-black">
                      {s.nameKn}
                    </th>
                  ))}

                  {/* Total Sub-columns */}
                  <th rowSpan={2} className="border border-slate-900 p-0.5 w-[22px] font-black bg-amber-50">ಅಂಕ</th>
                  <th rowSpan={2} className="border border-slate-900 p-0.5 w-[24px] font-black bg-amber-50">ಶೇಕಡಾ</th>
                  <th rowSpan={2} className="border border-slate-900 p-0.5 w-[16px] font-black bg-amber-50">ಶ್ರೇಣಿ</th>

                  {/* Part B Subject 1: Art Edu / Work Exp */}
                  <th colSpan={2} className="border border-slate-900 p-0.5 bg-indigo-50 text-indigo-950 font-black text-[7.5px]">
                    ಕಲಾ ಶಿಕ್ಷಣ /<br />ಕಾರ್ಯಾನುಭವ
                  </th>

                  {/* Part B Subject 2: Computer / ICT */}
                  <th colSpan={2} className="border border-slate-900 p-0.5 bg-blue-50 text-blue-950 font-black text-[7.5px]">
                    ಕಂಪ್ಯೂಟರ್<br />ಶಿಕ್ಷಣ (ICT)
                  </th>

                  {/* 7 Co-Scholastic Activities (Vertical text bottom-to-top) */}
                  {HP_CO_ACTIVITIES.map((act) => (
                    <th
                      key={act.key}
                      rowSpan={2}
                      className="border border-slate-900 p-0.5 w-[20px] align-middle bg-purple-50 text-purple-950"
                      title={act.nameKn}
                    >
                      <span
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        className="inline-block whitespace-nowrap text-[7px] py-1 mx-auto font-bold"
                      >
                        {act.nameKn}
                      </span>
                    </th>
                  ))}
                </tr>

                {/* Sub-Header Row 3: ಅಂಕ & ಶ್ರೇಣಿ for 7 Curricular Subjects and 2 Part B Subjects */}
                <tr className="bg-slate-100 text-[7px] font-black text-slate-900 border-b-2 border-slate-900">
                  {subjects.map((s) => (
                    <React.Fragment key={s.code}>
                      <th className="border border-slate-900 p-0.5 w-[18px]">ಅಂಕ</th>
                      <th className="border border-slate-900 p-0.5 w-[14px]">ಶ್ರೇಣಿ</th>
                    </React.Fragment>
                  ))}
                  {/* Art Edu subheaders */}
                  <th className="border border-slate-900 p-0.5 w-[18px] bg-indigo-50">ಅಂಕ</th>
                  <th className="border border-slate-900 p-0.5 w-[14px] bg-indigo-50">ಶ್ರೇಣಿ</th>
                  {/* Computer Edu subheaders */}
                  <th className="border border-slate-900 p-0.5 w-[18px] bg-blue-50">ಅಂಕ</th>
                  <th className="border border-slate-900 p-0.5 w-[14px] bg-blue-50">ಶ್ರೇಣಿ</th>
                </tr>
              </thead>

              <tbody>
                {chunk.map((cSt, stIdx) => {
                  const st = cSt.student;
                  const isMarksAllowed = st.cwsnStatus === 'MARKS_ALLOWED' || st.cwsnStatus === 'YES_MARKS';
                  const isExempt = isMarksAllowed ? false : (cSt.isExempted || isCwsnExempted(st.cwsnStatus));
                  const hasCwsnBadge = isCwsnStudent(st.cwsnStatus) || cSt.isExempted;
                  const globalIdx = pageIdx * studentsPerPage + stIdx;
                  const artSub = cSt.partBSubjects?.art_workexp;
                  const ictSub = cSt.partBSubjects?.ict_computer;

                  // 9 Detailed Rows Data per Student (matching official 6-8 format)
                  const rowsData = [
                    // Sem 1: FA1 (10%), FA2 (10%), SA1 (30%), Sem 1 Total (50%)
                    { exam: 'ರೂ-1', pct: '10%', maxMarks: 70, subExamKey: 'fa1' as const, rawMax: 20, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: 'ರೂ-2', pct: '10%', maxMarks: 70, subExamKey: 'fa2' as const, rawMax: 20, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: 'ಸಂ-1', pct: '30%', maxMarks: 210, subExamKey: 'sa1' as const, rawMax: 50, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: 'ಒಟ್ಟು', pct: '50%', maxMarks: 350, subExamKey: null, rawMax: null, isSem1Total: true, isSem2Total: false, isFinalTotal: false },

                    // Sem 2: FA3 (10%), FA4 (10%), SA2 (30%), Sem 2 Total (50%)
                    { exam: 'ರೂ-3', pct: '10%', maxMarks: 70, subExamKey: 'fa3' as const, rawMax: 20, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: 'ರೂ-4', pct: '10%', maxMarks: 70, subExamKey: 'fa4' as const, rawMax: 20, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: 'ಸಂ-2', pct: '30%', maxMarks: 210, subExamKey: 'sa2' as const, rawMax: 50, isSem1Total: false, isSem2Total: false, isFinalTotal: false },
                    { exam: 'ಒಟ್ಟು', pct: '50%', maxMarks: 350, subExamKey: null, rawMax: null, isSem1Total: false, isSem2Total: true, isFinalTotal: false },

                    // Final Total: 100%
                    { exam: 'ಒಟ್ಟು', pct: '100%', maxMarks: 700, subExamKey: null, rawMax: 100, isSem1Total: false, isSem2Total: false, isFinalTotal: true },
                  ];

                  // Precompute assessment totals across the 7 subjects
                  const calcAssessmentTotal = (key: 'fa1_pct' | 'fa2_pct' | 'sa1_pct' | 'sem1_total' | 'fa3_pct' | 'fa4_pct' | 'sa2_pct' | 'sem2_total' | 'total100') => {
                    let total = 0;
                    let hasAny = false;
                    subjects.forEach((s) => {
                      const sub = cSt.subjects[s.code];
                      const v = sub ? (sub as any)[key] : null;
                      if (v !== null && v !== undefined && !isNaN(v)) {
                        total += Number(v);
                        hasAny = true;
                      }
                    });
                    return hasAny ? total : null;
                  };

                  const sumFa1 = calcAssessmentTotal('fa1_pct');
                  const sumFa2 = calcAssessmentTotal('fa2_pct');
                  const sumSa1 = calcAssessmentTotal('sa1_pct');
                  const sumSem1 = calcAssessmentTotal('sem1_total');
                  const sumFa3 = calcAssessmentTotal('fa3_pct');
                  const sumFa4 = calcAssessmentTotal('fa4_pct');
                  const sumSa2 = calcAssessmentTotal('sa2_pct');
                  const sumSem2 = calcAssessmentTotal('sem2_total');
                  const sumFinal = cSt.totalMarks700;

                  return (
                    <React.Fragment key={st.id}>
                      {rowsData.map((r, rIdx) => {
                        const isRow0 = rIdx === 0;
                        const isRow4 = rIdx === 4;
                        const isRow8 = rIdx === 8;
                        const isTotalRow = r.isSem1Total || r.isSem2Total || r.isFinalTotal;

                        // Total column calculations for this row
                        let rowTotalMarks: number | null = null;
                        let rowPctStr = '-';
                        let rowGrade = '-';

                        if (!isExempt) {
                          if (rIdx === 0 && sumFa1 !== null) {
                            rowTotalMarks = sumFa1;
                            rowPctStr = `${Math.round((sumFa1 / 70) * 100)}%`;
                            rowGrade = calculateHpGrade(sumFa1, 70);
                          } else if (rIdx === 1 && sumFa2 !== null) {
                            rowTotalMarks = sumFa2;
                            rowPctStr = `${Math.round((sumFa2 / 70) * 100)}%`;
                            rowGrade = calculateHpGrade(sumFa2, 70);
                          } else if (rIdx === 2 && sumSa1 !== null) {
                            rowTotalMarks = sumSa1;
                            rowPctStr = `${Math.round((sumSa1 / 210) * 100)}%`;
                            rowGrade = calculateHpGrade(sumSa1, 210);
                          } else if (rIdx === 3 && sumSem1 !== null) {
                            rowTotalMarks = sumSem1;
                            rowPctStr = `${Math.round((sumSem1 / 350) * 100)}%`;
                            rowGrade = calculateHpGrade(sumSem1, 350);
                          } else if (rIdx === 4 && sumFa3 !== null) {
                            rowTotalMarks = sumFa3;
                            rowPctStr = `${Math.round((sumFa3 / 70) * 100)}%`;
                            rowGrade = calculateHpGrade(sumFa3, 70);
                          } else if (rIdx === 5 && sumFa4 !== null) {
                            rowTotalMarks = sumFa4;
                            rowPctStr = `${Math.round((sumFa4 / 70) * 100)}%`;
                            rowGrade = calculateHpGrade(sumFa4, 70);
                          } else if (rIdx === 6 && sumSa2 !== null) {
                            rowTotalMarks = sumSa2;
                            rowPctStr = `${Math.round((sumSa2 / 210) * 100)}%`;
                            rowGrade = calculateHpGrade(sumSa2, 210);
                          } else if (rIdx === 7 && sumSem2 !== null) {
                            rowTotalMarks = sumSem2;
                            rowPctStr = `${Math.round((sumSem2 / 350) * 100)}%`;
                            rowGrade = calculateHpGrade(sumSem2, 350);
                          } else if (rIdx === 8) {
                            rowTotalMarks = sumFinal;
                            rowPctStr = `${cSt.percentage}%`;
                            rowGrade = cSt.overallGrade;
                          }
                        } else if (rIdx === 8) {
                          rowTotalMarks = sumFinal > 0 ? sumFinal : null;
                          rowGrade = 'Exempt';
                        }

                        return (
                          <tr
                            key={rIdx}
                            className={`border-b border-slate-300 text-[8px] ${
                              r.isFinalTotal
                                ? 'bg-amber-100 font-black border-b-2 border-slate-900 text-red-600'
                                : isTotalRow
                                ? 'bg-yellow-50 font-black border-b border-dashed border-amber-400 text-red-600'
                                : 'hover:bg-slate-50 text-slate-900'
                            }`}
                          >
                            {/* 1. Sl No - Spans 9 Rows */}
                            {isRow0 && (
                              <td rowSpan={9} className="border border-slate-900 p-0.5 font-mono font-bold align-middle bg-white text-center">
                                {globalIdx + 1}
                              </td>
                            )}

                            {/* 2. Registered No - Spans 9 Rows - Vertical Bottom to Top */}
                            {isRow0 && (
                              <td rowSpan={9} className="border border-slate-900 p-0.5 font-mono font-bold align-middle bg-white text-center">
                                <span
                                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                  className="inline-block whitespace-nowrap text-center py-1 mx-auto text-[7.5px]"
                                >
                                  {st.schoolRegNo || (st as any).admissionNo || st.satsNo || `${100 + globalIdx + 1}`}
                                </span>
                              </td>
                            )}

                            {/* 3. Student Name & Meta Info - Spans 9 Rows */}
                            {isRow0 && (
                              <td rowSpan={9} className="border border-slate-900 p-1 text-center align-middle bg-white min-w-[125px]">
                                <div className="font-black text-slate-950 text-[9.5px] tracking-tight">
                                  {st.studentName}
                                </div>
                                {isExempt && (
                                  <div className="my-0.5">
                                    <span className="inline-block bg-purple-700 text-white font-black px-1.5 py-0.5 rounded text-[7.5px] shadow-xs">
                                      CWSN (ವಿನಾಯಿತಿ / EXEMPT)
                                    </span>
                                  </div>
                                )}
                                {cSt.hasCwsnMarksAllowed && (
                                  <div className="my-0.5">
                                    <span className="inline-block bg-indigo-700 text-white font-black px-1.5 py-0.5 rounded text-[7.5px] shadow-xs">
                                      (CWSN)
                                    </span>
                                  </div>
                                )}
                                <div className="mt-1 text-[7.5px] text-slate-700 font-mono space-y-0.5 text-left pl-1">
                                  <div><span className="font-bold">CASTE:</span> {st.caste || 'GM'}</div>
                                  <div><span className="font-bold">DOB:</span> {st.dob || st.dateOfBirth || '-'}</div>
                                  <div><span className="font-bold">SATS NO:</span> {st.satsNo || '-'}</div>
                                  <div><span className="font-bold">GENDER:</span> {st.gender || '-'}</div>
                                </div>
                              </td>
                            )}

                            {/* 4. Attendance: Sem 1 (Row 0..3), Sem 2 (Row 4..7), Total (Row 8) */}
                            {isRow0 && (
                              <td rowSpan={4} className="border border-slate-900 p-0.5 text-center align-middle font-bold bg-white">
                                <div className="text-slate-800 text-[7px]">1ನೇ Sem</div>
                                {onUpdateSemAttendance ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max={Math.max(0, workingDays - (cSt.sem2Attendance || 0))}
                                    value={cSt.sem1Attendance || ''}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      const maxAllowed = Math.max(0, workingDays - (cSt.sem2Attendance || 0));
                                      const clamped = Math.max(0, Math.min(val, maxAllowed));
                                      onUpdateSemAttendance(st.id, 'sem1', clamped);
                                    }}
                                    className="w-full text-center font-mono font-black text-blue-900 text-[9px] mt-0.5 bg-transparent border-b border-blue-300 focus:outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    title={`Edit Sem 1 Attendance (Max: ${Math.max(0, workingDays - (cSt.sem2Attendance || 0))})`}
                                  />
                                ) : (
                                  <div className="font-mono font-black text-blue-900 text-[9px] mt-0.5">
                                    {cSt.sem1Attendance}
                                  </div>
                                )}
                              </td>
                            )}
                            {isRow4 && (
                              <td rowSpan={4} className="border border-slate-900 p-0.5 text-center align-middle font-bold bg-white">
                                <div className="text-slate-800 text-[7px]">2ನೇ Sem</div>
                                {onUpdateSemAttendance ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max={Math.max(0, workingDays - (cSt.sem1Attendance || 0))}
                                    value={cSt.sem2Attendance || ''}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      const maxAllowed = Math.max(0, workingDays - (cSt.sem1Attendance || 0));
                                      const clamped = Math.max(0, Math.min(val, maxAllowed));
                                      onUpdateSemAttendance(st.id, 'sem2', clamped);
                                    }}
                                    className="w-full text-center font-mono font-black text-indigo-900 text-[9px] mt-0.5 bg-transparent border-b border-indigo-300 focus:outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    title={`Edit Sem 2 Attendance (Max: ${Math.max(0, workingDays - (cSt.sem1Attendance || 0))})`}
                                  />
                                ) : (
                                  <div className="font-mono font-black text-indigo-900 text-[9px] mt-0.5">
                                    {cSt.sem2Attendance}
                                  </div>
                                )}
                              </td>
                            )}
                            {isRow8 && (
                              <td className="border border-slate-900 p-0.5 text-center align-middle font-black bg-amber-100 text-red-600">
                                <div className="text-[7.5px]">Total</div>
                                {onUpdateAttendance ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max={workingDays}
                                    value={cSt.attendanceDays || ''}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      const clamped = Math.max(0, Math.min(val, workingDays));
                                      onUpdateAttendance(st.id, clamped);
                                    }}
                                    className="w-full text-center font-mono font-black text-red-600 text-[9px] bg-transparent border-b border-red-300 focus:outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    title={`Edit Total Attendance (Max: ${workingDays})`}
                                  />
                                ) : (
                                  <div className="font-mono text-[9px] font-black">
                                    {cSt.attendanceDays}
                                  </div>
                                )}
                              </td>
                            )}

                            {/* 5. Exam Period */}
                            <td className={`border border-slate-900 p-0.5 font-bold ${isTotalRow ? 'bg-amber-100 text-red-600 font-black' : 'text-slate-900'}`}>
                              {r.exam}
                            </td>

                            {/* 6. Percentage */}
                            <td className={`border border-slate-900 p-0.5 font-mono font-bold ${isTotalRow ? 'bg-amber-100 text-red-600 font-black' : 'text-slate-800'}`}>
                              {r.pct}
                            </td>

                            {/* 7. Curricular 7 Subjects (ಅಂಕ, ಶ್ರೇಣಿ) - 2-Way Synchronized */}
                            {subjects.map((s) => {
                              const sub = cSt.subjects[s.code];
                              let markVal: number | string = '-';
                              let gradeVal = '-';

                              if (isExempt) {
                                markVal = '-';
                                gradeVal = rIdx === 8 ? 'Exempt' : '-';
                              } else if (sub) {
                                if (rIdx === 0) {
                                  markVal = sub.fa1_pct ?? '-';
                                  gradeVal = sub.fa1_grade || '-';
                                } else if (rIdx === 1) {
                                  markVal = sub.fa2_pct ?? '-';
                                  gradeVal = sub.fa2_grade || '-';
                                } else if (rIdx === 2) {
                                  markVal = sub.sa1_pct ?? '-';
                                  gradeVal = sub.sa1_grade || '-';
                                } else if (rIdx === 3) {
                                  markVal = sub.sem1_total ?? '-';
                                  gradeVal = sub.sem1_total !== null ? calculateHpGrade(sub.sem1_total, 50) : '-';
                                } else if (rIdx === 4) {
                                  markVal = sub.fa3_pct ?? '-';
                                  gradeVal = sub.fa3_grade || '-';
                                } else if (rIdx === 5) {
                                  markVal = sub.fa4_pct ?? '-';
                                  gradeVal = sub.fa4_grade || '-';
                                } else if (rIdx === 6) {
                                  markVal = sub.sa2_pct ?? '-';
                                  gradeVal = sub.sa2_grade || '-';
                                } else if (rIdx === 7) {
                                  markVal = sub.sem2_total ?? '-';
                                  gradeVal = sub.sem2_total !== null ? calculateHpGrade(sub.sem2_total, 50) : '-';
                                } else if (rIdx === 8) {
                                  markVal = sub.total100 ?? '-';
                                  gradeVal = sub.grade || '-';
                                }
                              }

                              return (
                                <React.Fragment key={s.code}>
                                  <td className={`border border-slate-900 p-0.5 font-mono text-[12px] ${isTotalRow ? 'text-red-600 font-bold' : ''}`}>
                                    {isExempt ? (
                                      '-'
                                    ) : r.isFinalTotal && onUpdateSubject100 ? (
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={markVal !== '-' ? markVal : ''}
                                        onChange={(e) => {
                                          const val = e.target.value.trim();
                                          if (val === '') onUpdateSubject100(st.id, s.code, null);
                                          else {
                                            const n = Number(val);
                                            if (!isNaN(n)) onUpdateSubject100(st.id, s.code, Math.min(100, Math.max(0, Math.floor(n))));
                                          }
                                        }}
                                        className="w-full text-center bg-transparent hover:bg-yellow-100 focus:bg-white font-mono font-black text-red-600 border-b border-red-300 focus:outline-none text-[12px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="-"
                                        title={`Edit ${s.nameKn} 100 Marks (2-way sync)`}
                                      />
                                    ) : r.subExamKey && (onUpdateExamPct || onUpdateMarks) ? (
                                      <input
                                        type="number"
                                        min="0"
                                        max={r.rawMax || 20}
                                        value={markVal !== '-' ? markVal : ''}
                                        onChange={(e) => {
                                          const val = e.target.value.trim();
                                          if (val === '') {
                                            if (onUpdateExamPct) onUpdateExamPct(st.id, s.code, r.subExamKey!, null);
                                            else if (onUpdateMarks) onUpdateMarks(st.id, s.code, r.subExamKey!, null);
                                          } else {
                                            const n = Number(val);
                                            if (!isNaN(n)) {
                                              const maxVal = r.rawMax || 20;
                                              const clamped = Math.min(maxVal, Math.max(0, Math.floor(n)));
                                              if (onUpdateExamPct) onUpdateExamPct(st.id, s.code, r.subExamKey!, clamped);
                                              else if (onUpdateMarks) onUpdateMarks(st.id, s.code, r.subExamKey!, clamped);
                                            }
                                          }
                                        }}
                                        className="w-full text-center bg-transparent hover:bg-blue-50 focus:bg-white font-mono font-bold text-slate-900 border-b border-slate-300 focus:outline-none text-[12px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="-"
                                        title={`Edit ${s.nameKn} ${r.exam} marks`}
                                      />
                                    ) : (
                                      markVal
                                    )}
                                  </td>
                                  <td className={`border border-slate-900 p-0.5 font-bold text-[12px] ${
                                    r.isFinalTotal ? 'text-green-600 font-black' : isTotalRow ? 'text-red-600 font-bold' : ''
                                  }`}>
                                    {gradeVal}
                                  </td>
                                </React.Fragment>
                              );
                            })}

                            {/* 8. Max Marks */}
                            <td className={`border border-slate-900 p-0.5 font-mono font-black text-center align-middle text-[12px] ${
                              r.isFinalTotal ? 'bg-amber-100 text-red-600' : isTotalRow ? 'bg-amber-100 text-red-600' : 'bg-slate-50/50'
                            }`}>
                              {r.maxMarks}
                            </td>

                            {/* 9. Total Across 7 Subjects: ಅಂಕ, ಶೇಕಡಾ, ಶ್ರೇಣಿ */}
                            <td className={`border border-slate-900 p-0.5 font-mono font-bold text-[12px] ${
                              isTotalRow ? 'text-red-600 font-black bg-amber-100' : ''
                            }`}>
                              {isExempt ? '-' : (rowTotalMarks !== null ? rowTotalMarks : '-')}
                            </td>
                            <td className={`border border-slate-900 p-0.5 font-mono font-bold text-[12px] ${
                              r.isFinalTotal ? 'text-red-600 font-black bg-amber-100' : isTotalRow ? 'text-red-600 font-black bg-amber-100' : ''
                            }`}>
                              {isExempt ? '-' : rowPctStr}
                            </td>
                            <td className={`border border-slate-900 p-0.5 font-black text-[12px] ${
                              r.isFinalTotal ? 'text-green-600 font-black bg-amber-100' : isTotalRow ? 'text-red-600 font-black bg-amber-100' : ''
                            }`}>
                              {isExempt ? (r.isFinalTotal ? 'Exempt' : '-') : rowGrade}
                            </td>

                            {/* 10. Part B Item 1: Art Edu / Work Exp (2 cols: Marks, Grade) */}
                            {isRow0 && (
                              <>
                                <td rowSpan={4} className="border border-slate-900 p-0.5 font-mono font-bold text-center align-middle bg-indigo-50/40 text-[12px]">
                                  {onUpdatePartBMarks ? (
                                    <input
                                      type="number"
                                      min="0"
                                      max={50}
                                      value={artSub?.sem1 !== null && artSub?.sem1 !== undefined ? artSub.sem1 : ''}
                                      onChange={(e) => {
                                        const clean = e.target.value.trim();
                                        const n = clean === '' ? null : Math.min(50, Math.max(0, parseInt(clean, 10)));
                                        onUpdatePartBMarks(st.id, 'art_workexp', 'sem1', n);
                                      }}
                                      className="w-full text-center bg-transparent hover:bg-white focus:bg-white font-mono font-bold text-indigo-950 border-b border-indigo-300 focus:outline-none text-[12px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      placeholder="-"
                                      title="Edit Art Edu Sem 1 Marks (Max 50)"
                                    />
                                  ) : (
                                    artSub?.sem1 !== null && artSub?.sem1 !== undefined ? artSub.sem1 : '-'
                                  )}
                                </td>
                                <td rowSpan={4} className="border border-slate-900 p-0.5 font-bold text-center align-middle bg-indigo-50/40 text-indigo-950 text-[12px]">
                                  {artSub?.sem1_grade || '-'}
                                </td>
                              </>
                            )}
                            {isRow4 && (
                              <>
                                <td rowSpan={4} className="border border-slate-900 p-0.5 font-mono font-bold text-center align-middle bg-indigo-50/40 text-[12px]">
                                  {onUpdatePartBMarks ? (
                                    <input
                                      type="number"
                                      min="0"
                                      max={50}
                                      value={artSub?.sem2 !== null && artSub?.sem2 !== undefined ? artSub.sem2 : ''}
                                      onChange={(e) => {
                                        const clean = e.target.value.trim();
                                        const n = clean === '' ? null : Math.min(50, Math.max(0, parseInt(clean, 10)));
                                        onUpdatePartBMarks(st.id, 'art_workexp', 'sem2', n);
                                      }}
                                      className="w-full text-center bg-transparent hover:bg-white focus:bg-white font-mono font-bold text-indigo-950 border-b border-indigo-300 focus:outline-none text-[12px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      placeholder="-"
                                      title="Edit Art Edu Sem 2 Marks (Max 50)"
                                    />
                                  ) : (
                                    artSub?.sem2 !== null && artSub?.sem2 !== undefined ? artSub.sem2 : '-'
                                  )}
                                </td>
                                <td rowSpan={4} className="border border-slate-900 p-0.5 font-bold text-center align-middle bg-indigo-50/40 text-indigo-950 text-[12px]">
                                  {artSub?.sem2_grade || '-'}
                                </td>
                              </>
                            )}
                            {isRow8 && (
                              <>
                                <td className="border border-slate-900 p-0.5 font-mono font-black text-center align-middle bg-amber-100 text-indigo-950 text-[12px]">
                                  {onUpdatePartBMarks ? (
                                    <input
                                      type="number"
                                      min="0"
                                      max={100}
                                      value={artSub?.total !== null && artSub?.total !== undefined ? artSub.total : ''}
                                      onChange={(e) => {
                                        const clean = e.target.value.trim();
                                        const n = clean === '' ? null : Math.min(100, Math.max(0, parseInt(clean, 10)));
                                        onUpdatePartBMarks(st.id, 'art_workexp', 'total', n);
                                      }}
                                      className="w-full text-center bg-transparent hover:bg-white focus:bg-white font-mono font-black text-indigo-950 border-b border-indigo-400 focus:outline-none text-[12px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      placeholder="-"
                                      title="Edit Art Edu Total Marks (Max 100)"
                                    />
                                  ) : (
                                    artSub?.total !== null && artSub?.total !== undefined ? artSub.total : '-'
                                  )}
                                </td>
                                <td className="border border-slate-900 p-0.5 font-black text-center align-middle bg-amber-100 text-indigo-950 text-[12px]">
                                  {artSub?.grade || '-'}
                                </td>
                              </>
                            )}

                            {/* 11. Part B Item 2: Computer Education / ICT (2 cols: Marks, Grade) */}
                            {isRow0 && (
                              <>
                                <td rowSpan={4} className="border border-slate-900 p-0.5 font-mono font-bold text-center align-middle bg-blue-50/40 text-[12px]">
                                  {onUpdatePartBMarks ? (
                                    <input
                                      type="number"
                                      min="0"
                                      max={50}
                                      value={ictSub?.sem1 !== null && ictSub?.sem1 !== undefined ? ictSub.sem1 : ''}
                                      onChange={(e) => {
                                        const clean = e.target.value.trim();
                                        const n = clean === '' ? null : Math.min(50, Math.max(0, parseInt(clean, 10)));
                                        onUpdatePartBMarks(st.id, 'ict_computer', 'sem1', n);
                                      }}
                                      className="w-full text-center bg-transparent hover:bg-white focus:bg-white font-mono font-bold text-blue-950 border-b border-blue-300 focus:outline-none text-[12px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      placeholder="-"
                                      title="Edit Computer Edu Sem 1 Marks (Max 50)"
                                    />
                                  ) : (
                                    ictSub?.sem1 !== null && ictSub?.sem1 !== undefined ? ictSub.sem1 : '-'
                                  )}
                                </td>
                                <td rowSpan={4} className="border border-slate-900 p-0.5 font-bold text-center align-middle bg-blue-50/40 text-blue-950 text-[12px]">
                                  {ictSub?.sem1_grade || '-'}
                                </td>
                              </>
                            )}
                            {isRow4 && (
                              <>
                                <td rowSpan={4} className="border border-slate-900 p-0.5 font-mono font-bold text-center align-middle bg-blue-50/40 text-[12px]">
                                  {onUpdatePartBMarks ? (
                                    <input
                                      type="number"
                                      min="0"
                                      max={50}
                                      value={ictSub?.sem2 !== null && ictSub?.sem2 !== undefined ? ictSub.sem2 : ''}
                                      onChange={(e) => {
                                        const clean = e.target.value.trim();
                                        const n = clean === '' ? null : Math.min(50, Math.max(0, parseInt(clean, 10)));
                                        onUpdatePartBMarks(st.id, 'ict_computer', 'sem2', n);
                                      }}
                                      className="w-full text-center bg-transparent hover:bg-white focus:bg-white font-mono font-bold text-blue-950 border-b border-blue-300 focus:outline-none text-[12px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      placeholder="-"
                                      title="Edit Computer Edu Sem 2 Marks (Max 50)"
                                    />
                                  ) : (
                                    ictSub?.sem2 !== null && ictSub?.sem2 !== undefined ? ictSub.sem2 : '-'
                                  )}
                                </td>
                                <td rowSpan={4} className="border border-slate-900 p-0.5 font-bold text-center align-middle bg-blue-50/40 text-blue-950 text-[12px]">
                                  {ictSub?.sem2_grade || '-'}
                                </td>
                              </>
                            )}
                            {isRow8 && (
                              <>
                                <td className="border border-slate-900 p-0.5 font-mono font-black text-center align-middle bg-amber-100 text-blue-950 text-[12px]">
                                  {onUpdatePartBMarks ? (
                                    <input
                                      type="number"
                                      min="0"
                                      max={100}
                                      value={ictSub?.total !== null && ictSub?.total !== undefined ? ictSub.total : ''}
                                      onChange={(e) => {
                                        const clean = e.target.value.trim();
                                        const n = clean === '' ? null : Math.min(100, Math.max(0, parseInt(clean, 10)));
                                        onUpdatePartBMarks(st.id, 'ict_computer', 'total', n);
                                      }}
                                      className="w-full text-center bg-transparent hover:bg-white focus:bg-white font-mono font-black text-blue-950 border-b border-blue-400 focus:outline-none text-[12px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      placeholder="-"
                                      title="Edit Computer Edu Total Marks (Max 100)"
                                    />
                                  ) : (
                                    ictSub?.total !== null && ictSub?.total !== undefined ? ictSub.total : '-'
                                  )}
                                </td>
                                <td className="border border-slate-900 p-0.5 font-black text-center align-middle bg-amber-100 text-blue-950 text-[12px]">
                                  {ictSub?.grade || '-'}
                                </td>
                              </>
                            )}

                            {/* 12. 7 Co-Scholastic Activities */}
                            {isRow0 && (
                              <>
                                {HP_CO_ACTIVITIES.map((act) => {
                                  const grd = getHpCoGradeValue(cSt.coScholastic.sem1, act.key);
                                  return (
                                    <td
                                      key={act.key}
                                      rowSpan={4}
                                      className="border border-slate-900 p-0.5 w-[20px] font-mono font-bold text-[12px] text-center align-middle bg-white"
                                    >
                                      {onUpdateCoGrade ? (
                                        <select
                                          value={grd !== '-' ? grd : ''}
                                          onChange={(e) => onUpdateCoGrade(st.id, 'sem1', act.key, e.target.value)}
                                          className="bg-transparent font-bold text-[12px] text-slate-800 focus:outline-none cursor-pointer"
                                        >
                                          <option value="">-</option>
                                          <option value="A">A</option>
                                          <option value="B">B</option>
                                          <option value="C">C</option>
                                        </select>
                                      ) : (
                                        grd
                                      )}
                                    </td>
                                  );
                                })}
                              </>
                            )}
                            {isRow4 && (
                              <>
                                {HP_CO_ACTIVITIES.map((act) => {
                                  const grd = getHpCoGradeValue(cSt.coScholastic.sem2, act.key);
                                  return (
                                    <td
                                      key={act.key}
                                      rowSpan={4}
                                      className="border border-slate-900 p-0.5 w-[20px] font-mono font-bold text-[12px] text-center align-middle bg-white"
                                    >
                                      {onUpdateCoGrade ? (
                                        <select
                                          value={grd !== '-' ? grd : ''}
                                          onChange={(e) => onUpdateCoGrade(st.id, 'sem2', act.key, e.target.value)}
                                          className="bg-transparent font-bold text-[12px] text-slate-800 focus:outline-none cursor-pointer"
                                        >
                                          <option value="">-</option>
                                          <option value="A">A</option>
                                          <option value="B">B</option>
                                          <option value="C">C</option>
                                        </select>
                                      ) : (
                                        grd
                                      )}
                                    </td>
                                  );
                                })}
                              </>
                            )}
                            {isRow8 && (
                              <>
                                {HP_CO_ACTIVITIES.map((act) => {
                                  const grd = getHpCoGradeValue(cSt.coScholastic.final, act.key);
                                  return (
                                    <td
                                      key={act.key}
                                      className="border border-slate-900 p-0.5 w-[20px] font-mono font-black text-[12px] text-center align-middle bg-amber-100 text-red-600"
                                    >
                                      {onUpdateCoGrade ? (
                                        <select
                                          value={grd !== '-' ? grd : ''}
                                          onChange={(e) => onUpdateCoGrade(st.id, 'final', act.key, e.target.value)}
                                          className="bg-transparent font-black text-[12px] text-red-600 focus:outline-none cursor-pointer"
                                        >
                                          <option value="">-</option>
                                          <option value="A">A</option>
                                          <option value="B">B</option>
                                          <option value="C">C</option>
                                        </select>
                                      ) : (
                                        grd
                                      )}
                                    </td>
                                  );
                                })}
                              </>
                            )}

                            {/* 13. Result - Spans 9 Rows */}
                            {isRow0 && (
                              <td
                                rowSpan={9}
                                className={`border border-slate-900 p-0.5 align-middle text-center font-black ${
                                  isExempt
                                    ? 'bg-purple-50 text-purple-900'
                                    : cSt.isPassed
                                    ? 'bg-emerald-50 text-emerald-900'
                                    : 'bg-rose-50 text-rose-900'
                                }`}
                              >
                                <span
                                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                  className={`inline-block whitespace-nowrap py-1 mx-auto font-black text-[8.5px] ${
                                    isExempt
                                      ? 'text-purple-800'
                                      : cSt.isPassed
                                      ? 'text-emerald-700'
                                      : 'text-rose-700'
                                  }`}
                                >
                                  {isExempt
                                    ? (medium === 'Kannada' ? 'ತೇರ್ಗಡೆ (ವಿನಾಯಿತಿ)' : 'Promoted (Exempt)')
                                    : cSt.isPassed
                                    ? (medium === 'Kannada' ? 'ತೇರ್ಗಡೆ' : 'Promoted')
                                    : (medium === 'Kannada' ? 'ಅನುತ್ತೀರ್ಣ' : 'Failed')}
                                </span>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Part B Columns Reference / Details box (explicitly requested by user) */}
          <div className="border border-slate-700 bg-slate-50 p-2 rounded text-[7.5px] leading-tight">
            <div className="font-black text-slate-900 border-b border-slate-300 pb-0.5 mb-1 flex items-center justify-between">
              <span>ಭಾಗ-ಬಿ ಸಹ ಪಠ್ಯ ವಿಷಯಗಳು & ಚಟುವಟಿಕೆಗಳ ವಿವರ (Part-B Columns Reference & Details):</span>
              <span className="text-[7px] text-purple-900 font-bold">ಒಟ್ಟು ೯ ಕಾಲಂಗಳು (2 ವಿಷಯಗಳು + 7 ಚಟುವಟಿಕೆಗಳು)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 text-slate-800 font-bold">
              <div className="bg-white p-1 rounded border border-indigo-200">
                <span className="font-black text-indigo-950 font-mono mr-0.5">1.</span>
                <span className="text-slate-900">ಕಲಾ ಶಿಕ್ಷಣ/ಕಾರ್ಯಾನುಭವ</span>
                <div className="text-[6.5px] text-slate-500 font-normal">Art Edu / Work Exp (50m+50m)</div>
              </div>
              <div className="bg-white p-1 rounded border border-blue-200">
                <span className="font-black text-blue-950 font-mono mr-0.5">2.</span>
                <span className="text-slate-900">ಕಂಪ್ಯೂಟರ್‌ ಶಿಕ್ಷಣ/ICT</span>
                <div className="text-[6.5px] text-slate-500 font-normal">Computer Education / ICT (50m+50m)</div>
              </div>
              {HP_CO_ACTIVITIES.map((act, aIdx) => (
                <div key={act.key} className="bg-white p-1 rounded border border-purple-200">
                  <span className="font-black text-purple-950 font-mono mr-0.5">{aIdx + 3}.</span>
                  <span className="text-slate-900">{act.nameKn}</span>
                  <div className="text-[6.5px] text-slate-500 font-normal">{act.nameEn}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Signatures distributed across page width exactly matching official format */}
          <div className="w-full pt-3 pb-1 border-t-2 border-slate-900 mt-2">
            <div className="grid grid-cols-3 w-full text-center items-center justify-between gap-4 text-xs font-black text-slate-950">
              <div className="whitespace-nowrap px-2">
                <span>ವರ್ಗ ಶಿಕ್ಷಕರ ಸಹಿ (Class Teacher)</span>
              </div>
              <div className="whitespace-nowrap px-2">
                <span>ಮುಖ್ಯ ಗುರುಗಳ ಸಹಿ (Head Master)</span>
              </div>
              <div className="whitespace-nowrap px-2">
                <span>ಸಮೂಹ ಸಂಪನ್ಮೂಲ ವ್ಯಕ್ತಿಯ ಸಹಿ (CRP Sign)</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
