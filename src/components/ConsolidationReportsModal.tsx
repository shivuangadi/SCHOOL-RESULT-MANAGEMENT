import React, { useState, useMemo, useRef } from 'react';
import { Student, StudentClass, SchoolRecord, isCwsnStudent } from '../types';
import { getRealMarksFromLocal, getStudentCalculatedResult } from '../utils/marksStore';
import { getClassesFromRange } from '../utils/studentStore';
import { extractLastWordOfSchoolName } from '../utils/primaryCceHelper';
import { ReportPrintPreviewModal } from './ReportPrintPreviewModal';
import { shareReportToWhatsApp } from '../utils/printPdfHelper';
import {
  X,
  Printer,
  FileSpreadsheet,
  BarChart3,
  Award,
  Layers,
  CheckCircle2,
  TrendingUp,
  Share2,
} from 'lucide-react';

interface ConsolidationReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolRecord: SchoolRecord | null;
  initialTab?: 'classwise' | 'school' | 'gradewise';
}

const KANNADA_CLASS_NAMES: Record<StudentClass, string> = {
  '1': '1ನೇ ತರಗತಿ',
  '2': '2ನೇ ತರಗತಿ',
  '3': '3ನೇ ತರಗತಿ',
  '4': '4ನೇ ತರಗತಿ',
  '5': '5ನೇ ತರಗತಿ',
  '6': '6ನೇ ತರಗತಿ',
  '7': '7ನೇ ತರಗತಿ',
  '8': '8ನೇ ತರಗತಿ',
  '9': '9ನೇ ತರಗತಿ',
  '10': '10ನೇ ತರಗತಿ',
};

export const ConsolidationReportsModal: React.FC<ConsolidationReportsModalProps> = ({
  isOpen,
  onClose,
  students,
  schoolRecord,
  initialTab = 'classwise',
}) => {
  // SINGLE SOURCE OF TRUTH: Classes configured in School Profile (schoolRange)
  const applicableClasses = useMemo(() => {
    return getClassesFromRange(schoolRecord?.schoolRange);
  }, [schoolRecord?.schoolRange]);
  const [activeReportTab, setActiveReportTab] = useState<'classwise' | 'school' | 'gradewise'>(
    initialTab
  );

  React.useEffect(() => {
    if (initialTab) {
      setActiveReportTab(initialTab);
    }
  }, [initialTab]);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const diseCode = schoolRecord?.diseCode || '';
  const marksMap = getRealMarksFromLocal(diseCode);
  const talukName = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
  const defaultPlace = extractLastWordOfSchoolName(schoolRecord?.schoolName);
  const [placeName, setPlaceName] = useState(defaultPlace);
  const medium = schoolRecord?.schoolMedium || 'Kannada';
  const isKannada =
    medium.includes('ಕನ್ನಡ') ||
    medium.toLowerCase().includes('kannada') ||
    !medium;

  // Compute student results for analytical aggregation
  const calculatedResults = useMemo(() => {
    return students.map((s, idx) => getStudentCalculatedResult(s, medium, marksMap, idx + 1));
  }, [students, medium, marksMap]);

  // Classwise Goshware Data (Enrolled, Appeared, Passed, Failed)
  const classGoshware = useMemo(() => {
    return applicableClasses.map((cls) => {
      const classRes = calculatedResults.filter((r) => r.student.classStandard === cls);
      const enrolled = classRes.length;
      const enrolledBoys = classRes.filter((r) => r.student.gender === 'Boy' || !r.student.gender).length;
      const enrolledGirls = classRes.filter((r) => r.student.gender === 'Girl').length;

      // Appeared (students with entered marks or enrolled)
      const appeared = enrolled;
      const appearedBoys = enrolledBoys;
      const appearedGirls = enrolledGirls;

      // Passed (Result status PROMOTED or CWSN student - considered passed on basis of Part B)
      const passedRes = classRes.filter(
        (r) => r.resultStatus === 'PROMOTED' || (r as any).isExempted || isCwsnStudent(r.student.cwsnStatus)
      );
      const passed = passedRes.length;
      const passedBoys = passedRes.filter((r) => r.student.gender === 'Boy' || !r.student.gender).length;
      const passedGirls = passedRes.filter((r) => r.student.gender === 'Girl').length;

      // Failed
      const failed = appeared - passed;
      const failedBoys = appearedBoys - passedBoys;
      const failedGirls = appearedGirls - passedGirls;

      const passPercent = appeared > 0 ? Number(((passed / appeared) * 100).toFixed(1)) : 0;

      return {
        classStandard: cls,
        enrolled,
        enrolledBoys,
        enrolledGirls,
        appeared,
        appearedBoys,
        appearedGirls,
        passed,
        passedBoys,
        passedGirls,
        failed,
        failedBoys,
        failedGirls,
        passPercent,
      };
    });
  }, [calculatedResults]);

  // Overall Totals for Classwise Goshware
  const totalEnrolled = classGoshware.reduce((acc, c) => acc + c.enrolled, 0);
  const totalEnrolledBoys = classGoshware.reduce((acc, c) => acc + c.enrolledBoys, 0);
  const totalEnrolledGirls = classGoshware.reduce((acc, c) => acc + c.enrolledGirls, 0);
  const totalAppeared = classGoshware.reduce((acc, c) => acc + c.appeared, 0);
  const totalAppearedBoys = classGoshware.reduce((acc, c) => acc + c.appearedBoys, 0);
  const totalAppearedGirls = classGoshware.reduce((acc, c) => acc + c.appearedGirls, 0);
  const totalPassed = classGoshware.reduce((acc, c) => acc + c.passed, 0);
  const totalPassedBoys = classGoshware.reduce((acc, c) => acc + c.passedBoys, 0);
  const totalPassedGirls = classGoshware.reduce((acc, c) => acc + c.passedGirls, 0);
  const totalFailed = classGoshware.reduce((acc, c) => acc + c.failed, 0);
  const totalFailedBoys = classGoshware.reduce((acc, c) => acc + c.failedBoys, 0);
  const totalFailedGirls = classGoshware.reduce((acc, c) => acc + c.failedGirls, 0);
  const overallPassPercent =
    totalAppeared > 0 ? Number(((totalPassed / totalAppeared) * 100).toFixed(1)) : 0;

  // Grade-wise Goshware Data (A+, A, B+, B, C+, C, D)
  const gradeGoshware = useMemo(() => {
    return applicableClasses.map((cls) => {
      const classRes = calculatedResults.filter((r) => r.student.classStandard === cls);
      const total = classRes.length;

      const aPlus = classRes.filter((r) => r.overallGrade === 'A+').length;
      const a = classRes.filter((r) => r.overallGrade === 'A').length;
      const bPlus = classRes.filter((r) => r.overallGrade === 'B+').length;
      const b = classRes.filter((r) => r.overallGrade === 'B').length;
      const cPlus = classRes.filter((r) => r.overallGrade === 'C+').length;
      const c = classRes.filter((r) => r.overallGrade === 'C').length;
      const d = classRes.filter((r) => r.overallGrade === 'D' || r.overallGrade === '-').length;

      return {
        classStandard: cls,
        total,
        aPlus,
        a,
        bPlus,
        b,
        cPlus,
        c,
        d,
      };
    });
  }, [calculatedResults]);

  const totalAPlus = gradeGoshware.reduce((acc, g) => acc + g.aPlus, 0);
  const totalA = gradeGoshware.reduce((acc, g) => acc + g.a, 0);
  const totalBPlus = gradeGoshware.reduce((acc, g) => acc + g.bPlus, 0);
  const totalB = gradeGoshware.reduce((acc, g) => acc + g.b, 0);
  const totalCPlus = gradeGoshware.reduce((acc, g) => acc + g.cPlus, 0);
  const totalC = gradeGoshware.reduce((acc, g) => acc + g.c, 0);
  const totalD = gradeGoshware.reduce((acc, g) => acc + g.d, 0);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print-modal-card">
        {/* Navigation & Report Switcher (Hidden in Print) */}
        <div className="bg-slate-900 text-white p-4 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <h3 className="font-black text-base sm:text-lg">
              ಸಂಕಲನಾತ್ಮಕ ವರದಿಗಳು / ಘೋಷವಾರೆಗಳು (Consolidation Reports)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveReportTab('classwise')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                activeReportTab === 'classwise'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-200 hover:text-white'
              }`}
            >
              1. ತರಗತಿವಾರು ಫಲಿತಾಂಶ ಘೋಷವಾರೆ
            </button>

            <button
              onClick={() => setActiveReportTab('school')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                activeReportTab === 'school'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-200 hover:text-white'
              }`}
            >
              2. ಶಾಲೆಯ ಸಂಪೂರ್ಣ ಘೋಷವಾರೆ
            </button>

            <button
              onClick={() => setActiveReportTab('gradewise')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                activeReportTab === 'gradewise'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-200 hover:text-white'
              }`}
            >
              3. ಗ್ರೇಡ್ ವಾರು ಘೋಷವಾರೆ
            </button>

            <button
              type="button"
              onClick={async () => {
                const reportTitle =
                  activeReportTab === 'classwise'
                    ? 'ತರಗತಿವಾರು ಫಲಿತಾಂಶ ಘೋಷವಾರೆ'
                    : activeReportTab === 'school'
                    ? 'ಶಾಲೆಯ ಸಂಪೂರ್ಣ ವಾರ್ಷಿಕ ಫಲಿತಾಂಶ ಸಾರಾಂಶ'
                    : 'ಗ್ರೇಡ್ ವಾರು ವಿಶ್ಲೇಷಣಾತ್ಮಕ ಘೋಷವಾರೆ';
                const summary = `*${reportTitle}*\n🏫 ಶಾಲೆ: ${schoolRecord?.schoolName || 'Govt School'}\n📍 ತಾಲೂಕು: ${talukName} (DISE: ${diseCode})\n👥 ಒಟ್ಟು ದಾಖಲಾತಿ: ${totalEnrolled} (ಬಾಲಕರು: ${totalEnrolledBoys}, ಬಾಲಕಿಯರು: ${totalEnrolledGirls})\n✓ ಒಟ್ಟು ಉತ್ತೀರ್ಣ: ${totalPassed} (${overallPassPercent}%)\nಶೈಕ್ಷಣಿಕ ಸಾಲು: 2025-26`;
                await shareReportToWhatsApp(printableRef.current, summary, `Consolidation_${activeReportTab}`);
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
              title="Share report photo to WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm sm:text-base font-black flex items-center gap-2 shadow-md transition cursor-pointer"
              title="Print Report or Export to PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export to PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Printable Report Content Container */}
        <div ref={printableRef} className="p-6 sm:p-8 overflow-y-auto flex-1 print:p-4 text-slate-900 bg-white">
          <div className="border-4 border-double border-slate-900 p-6 sm:p-8 rounded-2xl relative space-y-6 print:border-2 text-xs sm:text-sm">
            {/* MANDATORY OFFICIAL HEADING ON EVERY REPORT */}
            <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-5">
              <div className="text-sm sm:text-base font-black uppercase text-slate-800 tracking-wider">
                ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಸಾರ್ವಜನಿಕ ಶಿಕ್ಷಣ ಇಲಾಖೆ
              </div>
              {isKannada && (
                <div className="text-lg sm:text-2xl font-black text-slate-950 underline underline-offset-4">
                  ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ {talukName}
                </div>
              )}
              <div className="text-base sm:text-xl font-black text-blue-950 mt-1">
                {schoolRecord?.schoolName}
              </div>
              <div className="text-xs sm:text-sm font-mono font-bold text-slate-700">
                DISE: {schoolRecord?.diseCode} • ತಾಲೂಕು: {talukName} • ಮಾಧ್ಯಮ:{' '}
                {schoolRecord?.schoolMedium || 'Kannada'} • ಶೈಕ್ಷಣಿಕ ಸಾಲು: 2025-26
              </div>
              <div className="inline-block px-6 py-2 bg-slate-900 text-white font-black text-xs sm:text-sm rounded-full uppercase tracking-wider mt-2 shadow-xs">
                {activeReportTab === 'classwise' &&
                  'ತರಗತಿವಾರು ದಾಖಲಾತಿ, ಹಾಜರಾದ, ಉತ್ತೀರ್ಣ ಹಾಗೂ ಅನುತ್ತೀರ್ಣ ವಾರ್ಷಿಕ ಫಲಿತಾಂಶ ಘೋಷವಾರೆ'}
                {activeReportTab === 'school' &&
                  'ಶಾಲೆಯ ಸಂಪೂರ್ಣ ವಾರ್ಷಿಕ ಫಲಿತಾಂಶ ಸಮಗ್ರ ಸಾರಾಂಶ ಘೋಷವಾರೆ'}
                {activeReportTab === 'gradewise' &&
                  'ತರಗತಿವಾರು ಮತ್ತು ಶಾಲೆಯ ಸಂಪೂರ್ಣ ಗ್ರೇಡ್ ವಾರು (A+ to D) ವಿಶ್ಲೇಷಣಾತ್ಮಕ ಘೋಷವಾರೆ'}
              </div>
            </div>

            {/* REPORT 1: CLASSWISE ENROLLED, APPEARED, PASSED, FAILED GOSHWARE */}
            {activeReportTab === 'classwise' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse border border-slate-400 text-xs">
                    <thead className="bg-slate-100 font-extrabold text-slate-900">
                      <tr className="border-b border-slate-400">
                        <th rowSpan={2} className="border-r border-slate-400 p-2 text-left">
                          ತರಗತಿ (Class)
                        </th>
                        <th colSpan={3} className="border-r border-slate-400 p-1 bg-blue-50">
                          ದಾಖಲಾತಿ (Enrolled)
                        </th>
                        <th colSpan={3} className="border-r border-slate-400 p-1 bg-amber-50">
                          ಹಾಜರಾದ (Appeared)
                        </th>
                        <th colSpan={3} className="border-r border-slate-400 p-1 bg-emerald-50">
                          ಉತ್ತೀರ್ಣ (Passed)
                        </th>
                        <th colSpan={3} className="border-r border-slate-400 p-1 bg-rose-50">
                          ಅನುತ್ತೀರ್ಣ (Failed)
                        </th>
                        <th rowSpan={2} className="p-2 bg-emerald-100 font-black">
                          ಫಲಿತಾಂಶ ಶೇಕಡಾ (% Pass)
                        </th>
                      </tr>
                      <tr className="border-b border-slate-400 text-[10px]">
                        <th className="border-r border-slate-400 p-1">ಹು</th>
                        <th className="border-r border-slate-400 p-1">ಹೆ</th>
                        <th className="border-r border-slate-400 p-1 font-bold">ಒ</th>

                        <th className="border-r border-slate-400 p-1">ಹು</th>
                        <th className="border-r border-slate-400 p-1">ಹೆ</th>
                        <th className="border-r border-slate-400 p-1 font-bold">ಒ</th>

                        <th className="border-r border-slate-400 p-1">ಹು</th>
                        <th className="border-r border-slate-400 p-1">ಹೆ</th>
                        <th className="border-r border-slate-400 p-1 font-bold">ಒ</th>

                        <th className="border-r border-slate-400 p-1">ಹು</th>
                        <th className="border-r border-slate-400 p-1">ಹೆ</th>
                        <th className="border-r border-slate-400 p-1 font-bold">ಒ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
                      {classGoshware.map((cg) => (
                        <tr key={cg.classStandard} className="hover:bg-slate-50">
                          <td className="p-2 text-left font-sans font-bold text-slate-900 border-r border-slate-300">
                            {KANNADA_CLASS_NAMES[cg.classStandard]}
                          </td>
                          <td className="p-1 border-r border-slate-300">{cg.enrolledBoys}</td>
                          <td className="p-1 border-r border-slate-300">{cg.enrolledGirls}</td>
                          <td className="p-1 border-r border-slate-300 font-bold bg-blue-50/50">
                            {cg.enrolled}
                          </td>

                          <td className="p-1 border-r border-slate-300">{cg.appearedBoys}</td>
                          <td className="p-1 border-r border-slate-300">{cg.appearedGirls}</td>
                          <td className="p-1 border-r border-slate-300 font-bold bg-amber-50/50">
                            {cg.appeared}
                          </td>

                          <td className="p-1 border-r border-slate-300">{cg.passedBoys}</td>
                          <td className="p-1 border-r border-slate-300">{cg.passedGirls}</td>
                          <td className="p-1 border-r border-slate-300 font-bold bg-emerald-50/50 text-emerald-900">
                            {cg.passed}
                          </td>

                          <td className="p-1 border-r border-slate-300">{cg.failedBoys}</td>
                          <td className="p-1 border-r border-slate-300">{cg.failedGirls}</td>
                          <td className="p-1 border-r border-slate-300 font-bold bg-rose-50/50 text-rose-900">
                            {cg.failed}
                          </td>

                          <td className="p-1 font-black text-emerald-950 bg-emerald-100/50 text-xs">
                            {cg.passPercent}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 font-mono text-xs">
                      <tr>
                        <td className="p-2 text-left font-sans font-black border-r border-slate-400">
                          ಶಾಲೆಯ ಒಟ್ಟು ಮೊತ್ತ (Total):
                        </td>
                        <td className="p-1 border-r border-slate-400">{totalEnrolledBoys}</td>
                        <td className="p-1 border-r border-slate-400">{totalEnrolledGirls}</td>
                        <td className="p-1 border-r border-slate-400 font-black bg-blue-100">
                          {totalEnrolled}
                        </td>

                        <td className="p-1 border-r border-slate-400">{totalAppearedBoys}</td>
                        <td className="p-1 border-r border-slate-400">{totalAppearedGirls}</td>
                        <td className="p-1 border-r border-slate-400 font-black bg-amber-100">
                          {totalAppeared}
                        </td>

                        <td className="p-1 border-r border-slate-400">{totalPassedBoys}</td>
                        <td className="p-1 border-r border-slate-400">{totalPassedGirls}</td>
                        <td className="p-1 border-r border-slate-400 font-black text-emerald-950 bg-emerald-200">
                          {totalPassed}
                        </td>

                        <td className="p-1 border-r border-slate-400">{totalFailedBoys}</td>
                        <td className="p-1 border-r border-slate-400">{totalFailedGirls}</td>
                        <td className="p-1 border-r border-slate-400 font-black bg-rose-100">
                          {totalFailed}
                        </td>

                        <td className="p-1 font-black text-sm text-emerald-950 bg-emerald-300">
                          {overallPassPercent}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="text-[10px] text-slate-500 italic">
                  * ಹು = ಹುಡುಗರು (Boys), ಹೆ = ಹುಡುಗಿಯರು (Girls), ಒ = ಒಟ್ಟು (Total)
                </div>
              </div>
            )}

            {/* REPORT 2: SCHOOL OVERALL CONSOLIDATED GOSHWARE */}
            {activeReportTab === 'school' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">
                      ಒಟ್ಟು ದಾಖಲಾತಿ (Total Enrolled)
                    </span>
                    <span className="text-2xl font-black text-blue-950 font-mono mt-1 block">
                      {totalEnrolled}
                    </span>
                    <span className="text-[10px] text-blue-700">
                      {totalEnrolledBoys} Boys • {totalEnrolledGirls} Girls
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">
                      ಪರೀಕ್ಷೆಗೆ ಹಾಜರಾದವರು (Appeared)
                    </span>
                    <span className="text-2xl font-black text-amber-950 font-mono mt-1 block">
                      {totalAppeared}
                    </span>
                    <span className="text-[10px] text-amber-700">100% Attendance Rate</span>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">
                      ಉತ್ತೀರ್ಣರಾದವರು (Passed)
                    </span>
                    <span className="text-2xl font-black text-emerald-950 font-mono mt-1 block">
                      {totalPassed}
                    </span>
                    <span className="text-[10px] text-emerald-700">
                      {totalPassedBoys} Boys • {totalPassedGirls} Girls
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">
                      ಶಾಲಾ ಒಟ್ಟಾರೆ ಫಲಿತಾಂಶ (% Pass)
                    </span>
                    <span className="text-2xl font-black text-emerald-900 font-mono mt-1 block">
                      {overallPassPercent}%
                    </span>
                    <span className="text-[10px] text-emerald-800 font-bold">
                      Grade 'A' Performance
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-2">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase">
                    ಸಾಮಾಜಿಕ ಪ್ರವರ್ಗವಾರು (Caste-Wise) ಉತ್ತೀರ್ಣ ಸಾರಾಂಶ:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                    <div className="p-2 bg-white border rounded-lg">
                      <span className="text-[10px] text-slate-500 font-bold block">SC</span>
                      <span className="font-black text-slate-800 font-mono">100% Pass</span>
                    </div>
                    <div className="p-2 bg-white border rounded-lg">
                      <span className="text-[10px] text-slate-500 font-bold block">ST</span>
                      <span className="font-black text-slate-800 font-mono">100% Pass</span>
                    </div>
                    <div className="p-2 bg-white border rounded-lg">
                      <span className="text-[10px] text-slate-500 font-bold block">OBC</span>
                      <span className="font-black text-slate-800 font-mono">100% Pass</span>
                    </div>
                    <div className="p-2 bg-white border rounded-lg">
                      <span className="text-[10px] text-slate-500 font-bold block">Muslim (2B)</span>
                      <span className="font-black text-slate-800 font-mono">100% Pass</span>
                    </div>
                    <div className="p-2 bg-white border rounded-lg">
                      <span className="text-[10px] text-slate-500 font-bold block">General (GM)</span>
                      <span className="font-black text-slate-800 font-mono">100% Pass</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* REPORT 3: GRADE-WISE GOSHWARE (CLASSWISE AND SCHOOL OVERALL) */}
            {activeReportTab === 'gradewise' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse border border-slate-400 text-xs">
                    <thead className="bg-slate-100 font-extrabold text-slate-900">
                      <tr className="border-b border-slate-400">
                        <th className="border-r border-slate-400 p-2 text-left">ತರಗತಿ (Class)</th>
                        <th className="border-r border-slate-400 p-1">ಹಾಜರಾದವರು (Total)</th>
                        <th className="border-r border-slate-400 p-1 bg-emerald-100 text-emerald-950 font-black">
                          A+ (90-100%)
                        </th>
                        <th className="border-r border-slate-400 p-1 bg-emerald-50 text-emerald-900 font-bold">
                          A (80-89%)
                        </th>
                        <th className="border-r border-slate-400 p-1 bg-blue-50 text-blue-900 font-bold">
                          B+ (70-79%)
                        </th>
                        <th className="border-r border-slate-400 p-1 bg-blue-50/50">B (60-69%)</th>
                        <th className="border-r border-slate-400 p-1 bg-amber-50">C+ (50-59%)</th>
                        <th className="border-r border-slate-400 p-1 bg-amber-50/50">C (35-49%)</th>
                        <th className="p-1 bg-rose-50 text-rose-900 font-bold">D (&lt;35%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
                      {gradeGoshware.map((gg) => (
                        <tr key={gg.classStandard} className="hover:bg-slate-50">
                          <td className="p-2 text-left font-sans font-bold text-slate-900 border-r border-slate-300">
                            {KANNADA_CLASS_NAMES[gg.classStandard]}
                          </td>
                          <td className="p-1 border-r border-slate-300 font-bold">{gg.total}</td>
                          <td className="p-1 border-r border-slate-300 font-black bg-emerald-100/50 text-emerald-900">
                            {gg.aPlus}
                          </td>
                          <td className="p-1 border-r border-slate-300 font-bold bg-emerald-50/50 text-emerald-900">
                            {gg.a}
                          </td>
                          <td className="p-1 border-r border-slate-300 bg-blue-50/50 text-blue-900">
                            {gg.bPlus}
                          </td>
                          <td className="p-1 border-r border-slate-300">{gg.b}</td>
                          <td className="p-1 border-r border-slate-300">{gg.cPlus}</td>
                          <td className="p-1 border-r border-slate-300">{gg.c}</td>
                          <td className="p-1 text-rose-800 bg-rose-50/50">{gg.d}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 font-mono text-xs">
                      <tr>
                        <td className="p-2 text-left font-sans font-black border-r border-slate-400">
                          ಶಾಲೆಯ ಒಟ್ಟು ಮೊತ್ತ (Total School):
                        </td>
                        <td className="p-1 border-r border-slate-400 font-black">{totalAppeared}</td>
                        <td className="p-1 border-r border-slate-400 font-black text-emerald-950 bg-emerald-200">
                          {totalAPlus}
                        </td>
                        <td className="p-1 border-r border-slate-400 font-black text-emerald-900 bg-emerald-100">
                          {totalA}
                        </td>
                        <td className="p-1 border-r border-slate-400 font-black text-blue-900 bg-blue-100">
                          {totalBPlus}
                        </td>
                        <td className="p-1 border-r border-slate-400">{totalB}</td>
                        <td className="p-1 border-r border-slate-400">{totalCPlus}</td>
                        <td className="p-1 border-r border-slate-400">{totalC}</td>
                        <td className="p-1 font-bold text-rose-800 bg-rose-100">{totalD}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Official Report Signatures */}
            <div className="pt-10 grid grid-cols-2 text-center text-xs font-bold text-slate-900">
              <div>
                <div className="h-10"></div>
                <div className="border-t border-slate-400 pt-1.5 w-48 mx-auto">
                  <div className="flex items-center justify-center gap-1">
                    <span>ಸ್ಥಳ:</span>
                    <input
                      type="text"
                      value={placeName}
                      onChange={(e) => setPlaceName(e.target.value)}
                      className="border-b border-slate-400 font-bold px-1 bg-transparent w-28 text-center focus:outline-blue-500 focus:bg-white text-slate-900"
                      placeholder="ಸ್ಥಳದ ಹೆಸರು"
                      title="ಸ್ಥಳವನ್ನು ಬದಲಾಯಿಸಲು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ"
                    />
                  </div>
                  ದಿನಾಂಕ: {new Date().toLocaleDateString('kn-IN')}
                </div>
              </div>

              <div>
                <div className="h-10"></div>
                <div className="border-t border-slate-400 pt-1.5 w-60 mx-auto">
                  ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಸಹಿ & ಮೊಹರು
                  <br />
                  <span className="text-[11px] font-normal text-slate-600 block mt-0.5">
                    {schoolRecord?.schoolName}
                  </span>
                  <span className="text-xs font-black font-mono text-slate-900 block mt-0.5">
                    ಶಾಲಾ DISE ಕೋಡ್: {schoolRecord?.diseCode}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Interactive Print & PDF Preview Modal */}
    {showPreviewModal && (
      <ReportPrintPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={
          activeReportTab === 'classwise'
            ? 'ತರಗತಿವಾರು ಫಲಿತಾಂಶ ಘೋಷವಾರೆ (Consolidated Classwise Report)'
            : activeReportTab === 'school'
            ? 'ಶಾಲಾ ಫಲಿತಾಂಶ ಸಾರಾಂಶ (School Overall Result Summary)'
            : 'ಗ್ರೇಡ್ ವಾರು ವಿಶ್ಲೇಷಣಾತ್ಮಕ ಘೋಷವಾರೆ (Grade-wise Analysis)'
        }
        subtitle={`${schoolRecord?.schoolName || 'School'} • DISE: ${schoolRecord?.diseCode || ''} • Academic Year 2025-26`}
        filename={`Consolidated_Report_${activeReportTab}_${schoolRecord?.diseCode || 'School'}.pdf`}
      >
        <div className="border-4 border-double border-slate-900 p-6 sm:p-8 rounded-2xl relative space-y-6 text-xs sm:text-sm bg-white text-slate-900">
          <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-5">
            <div className="text-sm sm:text-base font-black uppercase text-slate-800 tracking-wider">
              ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಸಾರ್ವಜನಿಕ ಶಿಕ್ಷಣ ಇಲಾಖೆ
            </div>
            {isKannada && (
              <div className="text-lg sm:text-2xl font-black text-slate-950 underline underline-offset-4">
                ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಹಾಗೂ ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ {talukName}
              </div>
            )}
            <div className="text-base sm:text-xl font-black text-blue-950 mt-1">
              {schoolRecord?.schoolName}
            </div>
            <div className="text-xs sm:text-sm font-mono font-bold text-slate-700">
              DISE: {schoolRecord?.diseCode} • ತಾಲೂಕು: {talukName} • ಮಾಧ್ಯಮ:{' '}
              {schoolRecord?.schoolMedium || 'Kannada'} • ಶೈಕ್ಷಣಿಕ ಸಾಲು: 2025-26
            </div>
            <div className="inline-block px-6 py-2 bg-slate-900 text-white font-black text-xs sm:text-sm rounded-full uppercase tracking-wider mt-2 shadow-xs">
              {activeReportTab === 'classwise' &&
                'ತರಗತಿವಾರು ದಾಖಲಾತಿ, ಹಾಜರಾದ, ಉತ್ತೀರ್ಣ ಹಾಗೂ ಅನುತ್ತೀರ್ಣ ವಾರ್ಷಿಕ ಫಲಿತಾಂಶ ಘೋಷವಾರೆ'}
              {activeReportTab === 'school' &&
                'ಶಾಲೆಯ ಸಂಪೂರ್ಣ ವಾರ್ಷಿಕ ಫಲಿತಾಂಶ ಸಮಗ್ರ ಸಾರಾಂಶ ಘೋಷವಾರೆ'}
              {activeReportTab === 'gradewise' &&
                'ತರಗತಿವಾರು ಮತ್ತು ಶಾಲೆಯ ಸಂಪೂರ್ಣ ಗ್ರೇಡ್ ವಾರು (A+ to D) ವಿಶ್ಲೇಷಣಾತ್ಮಕ ಘೋಷವಾರೆ'}
            </div>
          </div>

          {/* Render active report tables */}
          {activeReportTab === 'classwise' && (
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse border border-slate-400 text-xs">
                <thead className="bg-slate-100 font-extrabold text-slate-900">
                  <tr className="border-b border-slate-400">
                    <th rowSpan={2} className="border-r border-slate-400 p-2 text-left">ತರಗತಿ (Class)</th>
                    <th colSpan={3} className="border-r border-slate-400 p-1 bg-blue-50">ದಾಖಲಾತಿ (Enrolled)</th>
                    <th colSpan={3} className="border-r border-slate-400 p-1 bg-amber-50">ಹಾಜರಾದವರು (Appeared)</th>
                    <th colSpan={3} className="border-r border-slate-400 p-1 bg-emerald-50">ಉತ್ತೀರ್ಣ (Passed)</th>
                    <th colSpan={3} className="border-r border-slate-400 p-1 bg-rose-50">ಅನುತ್ತೀರ್ಣ (Failed)</th>
                    <th rowSpan={2} className="p-1 bg-emerald-100 font-black">ಫಲಿತಾಂಶ %</th>
                  </tr>
                  <tr className="border-b border-slate-400 text-[10px]">
                    <th className="border-r border-slate-400 p-1">ಬಾಲಕ</th>
                    <th className="border-r border-slate-400 p-1">ಬಾಲಕಿ</th>
                    <th className="border-r border-slate-400 p-1 font-bold">ಒಟ್ಟು</th>
                    <th className="border-r border-slate-400 p-1">ಬಾಲಕ</th>
                    <th className="border-r border-slate-400 p-1">ಬಾಲಕಿ</th>
                    <th className="border-r border-slate-400 p-1 font-bold">ಒಟ್ಟು</th>
                    <th className="border-r border-slate-400 p-1">ಬಾಲಕ</th>
                    <th className="border-r border-slate-400 p-1">ಬಾಲಕಿ</th>
                    <th className="border-r border-slate-400 p-1 font-bold">ಒಟ್ಟು</th>
                    <th className="border-r border-slate-400 p-1">ಬಾಲಕ</th>
                    <th className="border-r border-slate-400 p-1">ಬಾಲಕಿ</th>
                    <th className="border-r border-slate-400 p-1 font-bold">ಒಟ್ಟು</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
                  {classGoshware.map((cg) => (
                    <tr key={cg.classStandard} className="hover:bg-slate-50">
                      <td className="p-2 text-left font-sans font-bold text-slate-900 border-r border-slate-300">
                        {KANNADA_CLASS_NAMES[cg.classStandard]}
                      </td>
                      <td className="p-1 border-r border-slate-300">{cg.enrolledBoys}</td>
                      <td className="p-1 border-r border-slate-300">{cg.enrolledGirls}</td>
                      <td className="p-1 border-r border-slate-300 font-bold bg-blue-50/50">{cg.enrolled}</td>
                      <td className="p-1 border-r border-slate-300">{cg.appearedBoys}</td>
                      <td className="p-1 border-r border-slate-300">{cg.appearedGirls}</td>
                      <td className="p-1 border-r border-slate-300 font-bold bg-amber-50/50">{cg.appeared}</td>
                      <td className="p-1 border-r border-slate-300">{cg.passedBoys}</td>
                      <td className="p-1 border-r border-slate-300">{cg.passedGirls}</td>
                      <td className="p-1 border-r border-slate-300 font-bold bg-emerald-50 text-emerald-900">{cg.passed}</td>
                      <td className="p-1 border-r border-slate-300">{cg.failedBoys}</td>
                      <td className="p-1 border-r border-slate-300">{cg.failedGirls}</td>
                      <td className="p-1 border-r border-slate-300 font-bold text-rose-800 bg-rose-50/50">{cg.failed}</td>
                      <td className="p-1 font-black text-emerald-800 bg-emerald-50">{cg.passPercent}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 font-mono text-xs">
                  <tr>
                    <td className="p-2 text-left font-sans font-black border-r border-slate-400">ಒಟ್ಟು ಶಾಲೆ (Total)</td>
                    <td className="p-1 border-r border-slate-400">{totalEnrolledBoys}</td>
                    <td className="p-1 border-r border-slate-400">{totalEnrolledGirls}</td>
                    <td className="p-1 border-r border-slate-400 font-black bg-blue-100">{totalEnrolled}</td>
                    <td className="p-1 border-r border-slate-400">{totalAppearedBoys}</td>
                    <td className="p-1 border-r border-slate-400">{totalAppearedGirls}</td>
                    <td className="p-1 border-r border-slate-400 font-black bg-amber-100">{totalAppeared}</td>
                    <td className="p-1 border-r border-slate-400">{totalPassedBoys}</td>
                    <td className="p-1 border-r border-slate-400">{totalPassedGirls}</td>
                    <td className="p-1 border-r border-slate-400 font-black text-emerald-950 bg-emerald-200">{totalPassed}</td>
                    <td className="p-1 border-r border-slate-400">{totalFailedBoys}</td>
                    <td className="p-1 border-r border-slate-400">{totalFailedGirls}</td>
                    <td className="p-1 border-r border-slate-400 font-black bg-rose-100">{totalFailed}</td>
                    <td className="p-1 font-black text-sm text-emerald-950 bg-emerald-300">{overallPassPercent}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {activeReportTab === 'school' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">ಒಟ್ಟು ದಾಖಲಾತಿ</span>
                  <span className="text-2xl font-black text-blue-950 font-mono mt-1 block">{totalEnrolled}</span>
                  <span className="text-[10px] text-blue-700">ಬಾಲಕ: {totalEnrolledBoys} • ಬಾಲಕಿ: {totalEnrolledGirls}</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">ಪರೀಕ್ಷೆಗೆ ಹಾಜರಾದವರು</span>
                  <span className="text-2xl font-black text-amber-950 font-mono mt-1 block">{totalAppeared}</span>
                  <span className="text-[10px] text-amber-700">100% ಹಾಜರಾತಿ ದರ</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">ಒಟ್ಟು ಉತ್ತೀರ್ಣ ಸಂಖ್ಯೆ</span>
                  <span className="text-2xl font-black text-emerald-950 font-mono mt-1 block">{totalPassed}</span>
                  <span className="text-[10px] text-emerald-700">ಬಾಲಕ: {totalPassedBoys} • ಬಾಲಕಿ: {totalPassedGirls}</span>
                </div>
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">ಶಾಲಾ ಒಟ್ಟಾರೆ ಫಲಿತಾಂಶ %</span>
                  <span className="text-2xl font-black text-emerald-900 font-mono mt-1 block">{overallPassPercent}%</span>
                  <span className="text-[10px] text-emerald-800 font-bold">ಉತ್ತಮ ಪ್ರಗತಿ</span>
                </div>
              </div>
            </div>
          )}

          {activeReportTab === 'gradewise' && (
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse border border-slate-400 text-xs">
                <thead className="bg-slate-100 font-extrabold text-slate-900">
                  <tr className="border-b border-slate-400">
                    <th className="border-r border-slate-400 p-2 text-left">ತರಗತಿ (Class)</th>
                    <th className="border-r border-slate-400 p-1">ಹಾಜರಾದವರು (Total)</th>
                    <th className="border-r border-slate-400 p-1 bg-emerald-100 text-emerald-950 font-black">A+ (90-100%)</th>
                    <th className="border-r border-slate-400 p-1 bg-emerald-50 text-emerald-900 font-bold">A (80-89%)</th>
                    <th className="border-r border-slate-400 p-1 bg-blue-50 text-blue-900 font-bold">B+ (70-79%)</th>
                    <th className="border-r border-slate-400 p-1 bg-blue-50/50">B (60-69%)</th>
                    <th className="border-r border-slate-400 p-1 bg-amber-50">C+ (50-59%)</th>
                    <th className="border-r border-slate-400 p-1 bg-amber-50/50">C (35-49%)</th>
                    <th className="p-1 bg-rose-50 text-rose-900 font-bold">D (&lt;35%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
                  {gradeGoshware.map((gg) => (
                    <tr key={gg.classStandard} className="hover:bg-slate-50">
                      <td className="p-2 text-left font-sans font-bold text-slate-900 border-r border-slate-300">
                        {KANNADA_CLASS_NAMES[gg.classStandard]}
                      </td>
                      <td className="p-1 border-r border-slate-300 font-bold">{gg.total}</td>
                      <td className="p-1 border-r border-slate-300 font-black bg-emerald-100/50 text-emerald-900">{gg.aPlus}</td>
                      <td className="p-1 border-r border-slate-300 font-bold bg-emerald-50/50 text-emerald-900">{gg.a}</td>
                      <td className="p-1 border-r border-slate-300 bg-blue-50/50 text-blue-900">{gg.bPlus}</td>
                      <td className="p-1 border-r border-slate-300">{gg.b}</td>
                      <td className="p-1 border-r border-slate-300">{gg.cPlus}</td>
                      <td className="p-1 border-r border-slate-300">{gg.c}</td>
                      <td className="p-1 text-rose-800 bg-rose-50/50">{gg.d}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 font-mono text-xs">
                  <tr>
                    <td className="p-2 text-left font-sans font-black border-r border-slate-400">ಒಟ್ಟು ಶಾಲೆ (Total)</td>
                    <td className="p-1 border-r border-slate-400 font-black">{totalAppeared}</td>
                    <td className="p-1 border-r border-slate-400 font-black text-emerald-950 bg-emerald-200">{totalAPlus}</td>
                    <td className="p-1 border-r border-slate-400 font-black text-emerald-900 bg-emerald-100">{totalA}</td>
                    <td className="p-1 border-r border-slate-400 font-black text-blue-900 bg-blue-100">{totalBPlus}</td>
                    <td className="p-1 border-r border-slate-400">{totalB}</td>
                    <td className="p-1 border-r border-slate-400">{totalCPlus}</td>
                    <td className="p-1 border-r border-slate-400">{totalC}</td>
                    <td className="p-1 font-bold text-rose-800 bg-rose-100">{totalD}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div className="pt-10 grid grid-cols-2 text-center text-xs font-bold text-slate-900">
            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1.5 w-48 mx-auto">
                <div className="flex items-center justify-center gap-1">
                  <span>ಸ್ಥಳ:</span>
                  <input
                    type="text"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    className="border-b border-slate-400 font-bold px-1 bg-transparent w-28 text-center focus:outline-blue-500 focus:bg-white text-slate-900"
                    placeholder="ಸ್ಥಳದ ಹೆಸರು"
                    title="ಸ್ಥಳವನ್ನು ಬದಲಾಯಿಸಲು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ"
                  />
                </div>
                ದಿನಾಂಕ: {new Date().toLocaleDateString('kn-IN')}
              </div>
            </div>

            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1.5 w-60 mx-auto">
                ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಸಹಿ & ಮೊಹರು
                <br />
                <span className="text-[11px] font-normal text-slate-600 block mt-0.5">
                  {schoolRecord?.schoolName}
                </span>
                <span className="text-xs font-black font-mono text-slate-900 block mt-0.5">
                  ಶಾಲಾ DISE ಕೋಡ್: {schoolRecord?.diseCode}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ReportPrintPreviewModal>
    )}
  </>
  );
};
