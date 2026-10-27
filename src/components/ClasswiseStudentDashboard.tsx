import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Student, StudentClass, StudentExamMarks, SchoolRecord, getFormattedClassName } from '../types';
import { loadSchoolStudents, subscribeSchoolStudents, getClassesFromRange, generateSampleSchoolStudents } from '../utils/studentStore';
import { calculateClasswiseExamProgress, getRealMarksFromLocal, loadSchoolMarks, subscribeSchoolMarks } from '../utils/marksStore';
import { StudentListDetailsModal } from './StudentListDetailsModal';
import {
  Users,
  BarChart3,
  TrendingUp,
  PieChart,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
} from 'lucide-react';
import { CceProgressTicker } from './CceProgressTicker';
import { CceClassProgressModal } from './CceClassProgressModal';
import { CceConsolidatedProgressModal } from './CceConsolidatedProgressModal';
import { calculateSchoolCceMonitoringSummary } from '../utils/cceProgressMonitorHelper';

interface ClasswiseStudentDashboardProps {
  onNavigateToAddStudent: (selectedClass?: StudentClass) => void;
  onNavigateToCce: (selectedClass?: number) => void;
  onNavigateToProfile: () => void;
  onNavigateToConsolidation?: () => void;
  onNavigateToCceReport?: (selectedClass?: StudentClass) => void;
  academicYear?: string;
  isDemo?: boolean;
  overrideSchoolRecord?: SchoolRecord | null;
  onOpenPaymentModal?: () => void;
}

export const ClasswiseStudentDashboard: React.FC<ClasswiseStudentDashboardProps> = ({
  onNavigateToAddStudent,
  onNavigateToCce,
  onNavigateToProfile,
  onNavigateToConsolidation,
  onNavigateToCceReport,
  academicYear = '2026-27',
  isDemo = false,
  overrideSchoolRecord,
  onOpenPaymentModal,
}) => {
  const { schoolRecord: authSchoolRecord } = useAuth();
  const schoolRecord = overrideSchoolRecord || authSchoolRecord;
  const { lang } = useLanguage();
  const isKn = lang === 'kn';

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailedMatrix, setShowDetailedMatrix] = useState(false);

  // Student Details Modal for popup view when clicking numbers
  const [studentDetailsModalState, setStudentDetailsModalState] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    students: Student[];
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    students: [],
  });

  // State for Advanced CCE Result Monitoring Modals
  const [selectedDetailClass, setSelectedDetailClass] = useState<StudentClass | null>(null);
  const [isConsolidatedProgressOpen, setIsConsolidatedProgressOpen] = useState(false);

  const schoolId = schoolRecord?.schoolId || schoolRecord?.diseCode || 'default_school';
  const diseCode = schoolRecord?.diseCode || '00000000000';
  const talukName = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';

  const [marksMap, setMarksMap] = useState<Record<string, StudentExamMarks>>(() => {
    return getRealMarksFromLocal(diseCode, academicYear);
  });

  useEffect(() => {
    if (!diseCode || diseCode === '00000000000') return;

    setLoading(true);
    if (isDemo || diseCode === '29010100101' || diseCode.startsWith('demo')) {
      const demo = generateSampleSchoolStudents(diseCode, diseCode, academicYear, schoolRecord?.schoolRange);
      setStudents(demo);
      setLoading(false);
      return;
    }

    loadSchoolStudents(diseCode, diseCode, academicYear, schoolRecord?.schoolRange).then((data) => {
      setStudents(data);
      setLoading(false);
    });

    loadSchoolMarks(diseCode, diseCode, academicYear).then((marks) => {
      setMarksMap(marks);
    });

    const unsubStudents = subscribeSchoolStudents(
      diseCode,
      (updated) => {
        setStudents(updated);
        setLoading(false);
      },
      undefined,
      academicYear
    );

    const unsubMarks = subscribeSchoolMarks(
      diseCode,
      (updated) => {
        setMarksMap(updated);
      },
      academicYear
    );

    return () => {
      unsubStudents();
      unsubMarks();
    };
  }, [diseCode, academicYear]);

  // SINGLE SOURCE OF TRUTH: Classes configured in School Profile (schoolRange)
  const configuredClasses = useMemo(() => {
    if (isDemo || diseCode === '29010100101' || diseCode.startsWith('demo') || diseCode.startsWith('DEMO')) {
      return getClassesFromRange(schoolRecord?.schoolRange || '1-10');
    }
    return getClassesFromRange(schoolRecord?.schoolRange);
  }, [schoolRecord?.schoolRange, isDemo, diseCode]);

  // Classwise Table Data strictly for configured range
  const classTableData = useMemo(() => {
    return configuredClasses.map((cls, idx) => {
      const classStudents = students.filter((s) => s.classStandard === cls);
      const boys = classStudents.filter((s) => s.gender === 'Boy' || !s.gender).length;
      const girls = classStudents.filter((s) => s.gender === 'Girl').length;
      const total = classStudents.length;

      return {
        slNo: idx + 1,
        classStandard: cls,
        className: getFormattedClassName(cls, schoolRecord?.schoolMedium),
        boys,
        girls,
        total,
      };
    });
  }, [students, schoolRecord, configuredClasses]);

  // Overall Totals
  const totalBoys = classTableData.reduce((acc, c) => acc + c.boys, 0);
  const totalGirls = classTableData.reduce((acc, c) => acc + c.girls, 0);
  const grandTotal = classTableData.reduce((acc, c) => acc + c.total, 0);

  // Caste & Category Breakdown
  const casteCategories = useMemo(
    () => [
      { key: 'SC', nameEn: 'SC', nameKn: 'ಪರಿಶಿಷ್ಟ ಜಾತಿ (SC)' },
      { key: 'ST', nameEn: 'ST', nameKn: 'ಪರಿಶಿಷ್ಟ ಪಂಗಡ (ST)' },
      { key: 'Cat-1', nameEn: 'Cat-1', nameKn: 'ಪ್ರವರ್ಗ-1 (Cat-1)' },
      { key: '2A', nameEn: '2A', nameKn: 'ಪ್ರವರ್ಗ-2A (2A)' },
      { key: '2B', nameEn: '2B', nameKn: 'ಪ್ರವರ್ಗ-2B (2B / Muslim)' },
      { key: '3A', nameEn: '3A', nameKn: 'ಪ್ರವರ್ಗ-3A (3A)' },
      { key: '3B', nameEn: '3B', nameKn: 'ಪ್ರವರ್ಗ-3B (3B)' },
      { key: 'GM', nameEn: 'GM / Others', nameKn: 'ಸಾಮಾನ್ಯ / ಇತರೆ (GM)' },
    ],
    []
  );

  const matchCategory = (caste?: string, rel?: string): string => {
    const c = (caste || '').toUpperCase().trim();
    const r = (rel || '').toLowerCase().trim();
    if (c === 'SC' || c.includes('SCHEDULED CASTE')) return 'SC';
    if (c === 'ST' || c.includes('SCHEDULED TRIBE')) return 'ST';
    if (c === 'CAT-1' || c === 'CATEGORY-1' || c === 'C1' || c.includes('CAT 1') || c.includes('CAT-1')) return 'Cat-1';
    if (c === '2A' || c.includes('2A')) return '2A';
    if (c === '2B' || c === 'MUSLIM' || c.includes('2B') || r === 'muslim') return '2B';
    if (c === '3A' || c.includes('3A')) return '3A';
    if (c === '3B' || c.includes('3B')) return '3B';
    if (c === 'OBC') return 'Cat-1';
    return 'GM';
  };

  const casteTableData = useMemo(() => {
    return casteCategories.map((cat, idx) => {
      const catStudents = students.filter((s) => matchCategory(s.caste, s.religion) === cat.key);
      const boys = catStudents.filter((s) => s.gender === 'Boy' || !s.gender).length;
      const girls = catStudents.filter((s) => s.gender === 'Girl').length;
      const total = catStudents.length;
      return {
        slNo: idx + 1,
        key: cat.key,
        nameEn: cat.nameEn,
        nameKn: cat.nameKn,
        boys,
        girls,
        total,
        students: catStudents,
      };
    });
  }, [students, casteCategories]);

  const totalCasteBoys = casteTableData.reduce((acc, c) => acc + c.boys, 0);
  const totalCasteGirls = casteTableData.reduce((acc, c) => acc + c.girls, 0);
  const totalCasteGrand = casteTableData.reduce((acc, c) => acc + c.total, 0);

  const boysPercentage = grandTotal > 0 ? Math.round((totalBoys / grandTotal) * 100) : 50;
  const girlsPercentage = grandTotal > 0 ? 100 - boysPercentage : 50;

  // =========================================================================
  // SECTION 8 & 9: CCE RESULT MONITORING PROGRESS CALCULATION
  // Horizontal progress bar for every class in the SCHOOL'S CONFIGURED CLASS RANGE
  // =========================================================================
  const schoolCceSummary = useMemo(() => {
    return calculateSchoolCceMonitoringSummary(
      students,
      marksMap,
      configuredClasses,
      schoolRecord?.schoolMedium || 'Kannada',
      schoolRecord?.schoolName || 'Karnataka Government School',
      diseCode,
      academicYear
    );
  }, [students, marksMap, configuredClasses, schoolRecord, diseCode, academicYear]);

  const cceProgress = useMemo(() => {
    return calculateClasswiseExamProgress(students, marksMap);
  }, [students, marksMap]);

  const configuredClassesProgress = useMemo(() => {
    return configuredClasses.map((cls) => {
      const found = cceProgress.find((p) => String(p.classStandard) === String(cls));
      if (found) return found;
      const classStudents = students.filter((s) => s.classStandard === cls);
      return {
        classStandard: Number(cls) as any,
        totalStudents: classStudents.length,
        fa1Percent: 0,
        fa2Percent: 0,
        sa1Percent: 0,
        fa3Percent: 0,
        fa4Percent: 0,
        sa2Percent: 0,
        overallPercent: 0,
      };
    });
  }, [configuredClasses, cceProgress, students]);

  const overallConfiguredPercent = useMemo(() => {
    if (configuredClassesProgress.length === 0) return 0;
    const sum = configuredClassesProgress.reduce((acc, c) => acc + c.overallPercent, 0);
    return Math.round(sum / configuredClassesProgress.length);
  }, [configuredClassesProgress]);

  // Donut Chart Geometry
  const size = 180;
  const strokeWidth = 24;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const boysDash = (boysPercentage / 100) * circumference;
  const girlsDash = circumference - boysDash;

  // -------------------------------------------------------------
  // CLASS-WISE AND CATEGORY-WISE ABSTRACT MATRIX DATA (SC, ST, OBC, GM, TOTAL)
  // -------------------------------------------------------------
  const getMajorCategory = (caste?: string, rel?: string): 'SC' | 'ST' | 'OBC' | 'GM' => {
    const c = (caste || '').toUpperCase().trim();
    const r = (rel || '').toLowerCase().trim();
    if (c === 'SC' || c.includes('SCHEDULED CASTE')) return 'SC';
    if (c === 'ST' || c.includes('SCHEDULED TRIBE')) return 'ST';
    if (
      c === 'CAT-1' || c === 'CATEGORY-1' || c === 'C1' || c.includes('CAT 1') || c.includes('CAT-1') ||
      c === '2A' || c.includes('2A') ||
      c === '2B' || c === 'MUSLIM' || c.includes('2B') || r === 'muslim' ||
      c === '3A' || c.includes('3A') ||
      c === '3B' || c.includes('3B') ||
      c === 'OBC' || c.includes('BACKWARD')
    ) {
      return 'OBC';
    }
    return 'GM';
  };

  const classwiseCategoryAbstract = useMemo(() => {
    return configuredClasses.map((cls, idx) => {
      const classStudents = students.filter((s) => s.classStandard === cls);

      const sc = classStudents.filter((s) => getMajorCategory(s.caste, s.religion) === 'SC');
      const st = classStudents.filter((s) => getMajorCategory(s.caste, s.religion) === 'ST');
      const obc = classStudents.filter((s) => getMajorCategory(s.caste, s.religion) === 'OBC');
      const gm = classStudents.filter((s) => getMajorCategory(s.caste, s.religion) === 'GM');

      const getCounts = (list: Student[]) => ({
        m: list.filter((s) => s.gender === 'Boy' || !s.gender).length,
        f: list.filter((s) => s.gender === 'Girl').length,
        t: list.length,
        students: list,
      });

      return {
        slNo: idx + 1,
        classStandard: cls,
        className: getFormattedClassName(cls, schoolRecord?.schoolMedium),
        sc: getCounts(sc),
        st: getCounts(st),
        obc: getCounts(obc),
        gm: getCounts(gm),
        total: getCounts(classStudents),
      };
    });
  }, [configuredClasses, students, schoolRecord?.schoolMedium]);

  const abstractTotals = useMemo(() => {
    const sc = students.filter((s) => getMajorCategory(s.caste, s.religion) === 'SC');
    const st = students.filter((s) => getMajorCategory(s.caste, s.religion) === 'ST');
    const obc = students.filter((s) => getMajorCategory(s.caste, s.religion) === 'OBC');
    const gm = students.filter((s) => getMajorCategory(s.caste, s.religion) === 'GM');

    const getCounts = (list: Student[]) => ({
      m: list.filter((s) => s.gender === 'Boy' || !s.gender).length,
      f: list.filter((s) => s.gender === 'Girl').length,
      t: list.length,
      students: list,
    });

    return {
      sc: getCounts(sc),
      st: getCounts(st),
      obc: getCounts(obc),
      gm: getCounts(gm),
      total: getCounts(students),
    };
  }, [students]);

  const categoryPieData = useMemo(() => {
    const grand = grandTotal || students.length;
    const catList = [
      {
        key: 'SC',
        labelEn: 'SC (Scheduled Caste)',
        labelKn: 'ಪರಿಶಿಷ್ಟ ಜಾತಿ (SC)',
        count: abstractTotals.sc.t,
        color: '#9333ea',
        bg: 'bg-purple-600',
        text: 'text-purple-700',
        students: abstractTotals.sc.students,
      },
      {
        key: 'ST',
        labelEn: 'ST (Scheduled Tribe)',
        labelKn: 'ಪರಿಶಿಷ್ಟ ಪಂಗಡ (ST)',
        count: abstractTotals.st.t,
        color: '#ea580c',
        bg: 'bg-orange-600',
        text: 'text-orange-700',
        students: abstractTotals.st.students,
      },
      {
        key: 'OBC',
        labelEn: 'OBC (Other Backward Classes)',
        labelKn: 'ಹಿಂದುಳಿದ ವರ್ಗ (OBC)',
        count: abstractTotals.obc.t,
        color: '#2563eb',
        bg: 'bg-blue-600',
        text: 'text-blue-700',
        students: abstractTotals.obc.students,
      },
      {
        key: 'GENERAL',
        labelEn: 'GENERAL (General / GM)',
        labelKn: 'ಸಾಮಾನ್ಯ ವರ್ಗ (General)',
        count: abstractTotals.gm.t,
        color: '#e11d48',
        bg: 'bg-rose-600',
        text: 'text-rose-700',
        students: abstractTotals.gm.students,
      },
    ];

    return catList.map((cat) => {
      const percentage = grand > 0 ? ((cat.count / grand) * 100).toFixed(1) : '0.0';
      return {
        ...cat,
        percentage,
      };
    });
  }, [abstractTotals, grandTotal, students.length]);

  const renderPieSvgSlices = () => {
    const grand = students.length;
    if (grand === 0) {
      return <circle cx="100" cy="100" r="80" fill="#e2e8f0" />;
    }

    const nonZero = categoryPieData.filter((d) => d.count > 0);
    if (nonZero.length === 1) {
      const single = nonZero[0];
      return (
        <circle
          cx="100"
          cy="100"
          r="80"
          fill={single.color}
          className="transition-all hover:opacity-95 cursor-pointer hover:scale-105 origin-center filter hover:brightness-110"
          onClick={() => {
            setStudentDetailsModalState({
              isOpen: true,
              title: isKn ? `${single.labelKn} - ವಿದ್ಯಾರ್ಥಿಗಳ ಪಟ್ಟಿ (${single.count})` : `${single.labelEn} - Students List (${single.count})`,
              subtitle: `${schoolRecord?.schoolName || 'Govt School'} • DISE: ${diseCode}`,
              students: single.students,
            });
          }}
        >
          <title>{`${single.labelEn}: ${single.count} (100%)`}</title>
        </circle>
      );
    }

    let cumulativeAngle = 0;
    return categoryPieData.map((slice) => {
      if (slice.count === 0) return null;
      const sliceAngle = (slice.count / grand) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + sliceAngle;
      cumulativeAngle = endAngle;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const r = 80;
      const cx = 100;
      const cy = 100;

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const largeArc = sliceAngle > 180 ? 1 : 0;
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return (
        <path
          key={slice.key}
          d={d}
          fill={slice.color}
          stroke="#ffffff"
          strokeWidth="2.5"
          className="transition-all duration-200 hover:opacity-95 hover:scale-105 origin-center cursor-pointer filter hover:brightness-110"
          onClick={() => {
            setStudentDetailsModalState({
              isOpen: true,
              title: isKn ? `${slice.labelKn} - ವಿದ್ಯಾರ್ಥಿಗಳ ಪಟ್ಟಿ (${slice.count})` : `${slice.labelEn} - Students List (${slice.count})`,
              subtitle: `${schoolRecord?.schoolName || 'Govt School'} • DISE: ${diseCode} • ${slice.percentage}%`,
              students: slice.students,
            });
          }}
        >
          <title>{`${slice.labelEn}: ${slice.count} (${slice.percentage}%)`}</title>
        </path>
      );
    });
  };

  // Click Handlers for Details Modal
  const handleOpenBoysList = () => {
    const allBoys = students.filter((s) => s.gender === 'Boy' || !s.gender);
    setStudentDetailsModalState({
      isOpen: true,
      title: isKn ? `ಬಾಲಕರ ವಿವರ ಪಟ್ಟಿ (ಒಟ್ಟು: ${allBoys.length})` : `List of Boys (Total: ${allBoys.length})`,
      subtitle: `${schoolRecord?.schoolName || 'Govt School'} • DISE: ${diseCode} • ಶೈಕ್ಷಣಿಕ ಸಾಲು: ${academicYear}`,
      students: allBoys,
    });
  };

  const handleOpenGirlsList = () => {
    const allGirls = students.filter((s) => s.gender === 'Girl');
    setStudentDetailsModalState({
      isOpen: true,
      title: isKn ? `ಬಾಲಕಿಯರ ವಿವರ ಪಟ್ಟಿ (ಒಟ್ಟು: ${allGirls.length})` : `List of Girls (Total: ${allGirls.length})`,
      subtitle: `${schoolRecord?.schoolName || 'Govt School'} • DISE: ${diseCode} • ಶೈಕ್ಷಣಿಕ ಸಾಲು: ${academicYear}`,
      students: allGirls,
    });
  };

  const handleOpenAllStudentsList = () => {
    setStudentDetailsModalState({
      isOpen: true,
      title: isKn ? `ಶಾಲೆಯ ಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳ ಪಟ್ಟಿ (ಒಟ್ಟು: ${students.length})` : `All Students List (Total: ${students.length})`,
      subtitle: `${schoolRecord?.schoolName || 'Govt School'} • DISE: ${diseCode} • ತಾಲೂಕು: ${talukName}`,
      students: students,
    });
  };

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-500">
      {/* =========================================================================
          SECTION 8: MOVING HOME-SCREEN NEWS BULLETIN (CCE PROGRESS ALERT)
          Continuously scrolls right-to-left, pauses on hover, respects reduced motion
          ========================================================================= */}
      <CceProgressTicker
        bulletinText={schoolCceSummary.bulletinText}
        hasAlerts={schoolCceSummary.lowProgressAlerts.length > 0}
        currentExamLabel={schoolCceSummary.currentExamLabel}
        overallPercentDisplay={schoolCceSummary.overallSchoolPercentDisplay}
        onClickBulletin={() => setIsConsolidatedProgressOpen(true)}
      />

      {/* =========================================================================
          SECTION 9: CCE RESULT MONITORING – CLICKABLE CLASSWISE STATUS (0–100%)
          Horizontal progress bar for every class in the SCHOOL'S CONFIGURED CLASS RANGE
          Clicking any class card opens detailed progress page for that class
          ========================================================================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-950 text-white flex items-center justify-center font-black shadow-xs shrink-0">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>CCE Result Monitoring – Classwise Status (0–100%)</span>
                <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 hidden sm:inline">
                  Scheduled Exam: <b className="font-mono">{schoolCceSummary.currentExamLabel}</b>
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsConsolidatedProgressOpen(true)}
              className="px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition transform hover:-translate-y-0.5 cursor-pointer ring-1 ring-amber-400/50 mr-1"
              title="Open Consolidated CCE Progress Report for all configured classes"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-950" />
              <span>
                {isKn
                  ? `ಸಿಸಿಇ ಸಂಯೋಜಿತ ವರದಿ (${configuredClasses[0]}–${configuredClasses[configuredClasses.length - 1]})`
                  : `CCE Consolidated Reports (${configuredClasses[0]}–${configuredClasses[configuredClasses.length - 1]})`}
              </span>
            </button>

            <span className="text-xs font-bold text-slate-600">
              {isKn ? 'ಒಟ್ಟು CCE ಪ್ರಗತಿ:' : 'Overall Progress:'}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-black border ${
                (schoolCceSummary.overallSchoolPercent ?? 0) >= 80
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                  : (schoolCceSummary.overallSchoolPercent ?? 0) >= 40
                  ? 'bg-blue-100 text-blue-950 border-blue-300'
                  : 'bg-amber-100 text-amber-950 border-amber-300'
              }`}
            >
              {schoolCceSummary.overallSchoolPercentDisplay}
            </span>
          </div>
        </div>

        {/* Clickable Class-Wise Progress Cards */}
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 pt-0.5">
          {schoolCceSummary.classSummaries.map((clsSummary) => {
            const pct = clsSummary.overallClassPercent ?? 0;
            const isComplete = pct === 100;
            const display = clsSummary.overallClassPercentDisplay;

            const barBg =
              isComplete
                ? 'bg-emerald-600'
                : pct >= 70
                ? 'bg-emerald-500'
                : pct >= 40
                ? 'bg-amber-500'
                : pct > 0
                ? 'bg-rose-500'
                : 'bg-slate-300';

            const textColor =
              isComplete
                ? 'text-emerald-700'
                : pct >= 70
                ? 'text-emerald-600'
                : pct >= 40
                ? 'text-amber-600'
                : pct > 0
                ? 'text-rose-600'
                : 'text-slate-400';

            return (
              <div
                key={clsSummary.classStandard}
                onClick={() => setSelectedDetailClass(clsSummary.classStandard)}
                className="flex-1 min-w-[90px] sm:min-w-[115px] max-w-[170px] p-2 bg-slate-50 hover:bg-blue-50/80 rounded-xl border border-slate-200 hover:border-blue-400 transition-all cursor-pointer shadow-xs shrink-0 group space-y-1.5"
                title={`Click to view detailed CCE Progress for Class ${clsSummary.classStandard} (${display} • ${clsSummary.totalClassCompleted}/${clsSummary.totalClassRequired})`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-800 group-hover:text-blue-900 truncate">
                    Class {clsSummary.classStandard}
                  </span>
                  <span className={`font-mono font-black ${textColor}`}>
                    {display}
                  </span>
                </div>
                {/* Horizontal progress bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${barBg}`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span className="text-[9px] text-slate-400">CCE Status</span>
                  <span>{clsSummary.totalClassCompleted}/{clsSummary.totalClassRequired}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          HOME SCREEN MAIN LAYOUT
          DESKTOP / PC MODE:
          - Side by Side:
            - Left Column: 30% of screen width (Table 1: Classwise Abstract + Chart 1 below it)
            - Right Column: 40% of screen width (Table 2: Category-wise Abstract + Chart 2 below it)
          MOBILE VIEW:
          - Chart 1 is below Table 1
          - Chart 2 is below Table 2
          - Stacked: Table 1 -> Chart 1 -> Table 2 -> Chart 2
          TABLE 2 SPECIFICATION:
          - Categories strictly: SC, ST, OBC, GENERAL, GRAND TOTAL
          - In each category: B, G, T
          - Left side column contains classes 1-10 (as configured in School Profile range)
          ========================================================================= */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch w-full">
        {/* ========================================================
            COLUMN 1 (LEFT COLUMN): Table 1 + Chart 1 directly below it
            Desktop Width: ~34-35% of screen width (spans window together with Col 2)
            ======================================================== */}
        <div className="w-full lg:w-[35%] xl:w-[34%] space-y-6 flex flex-col shrink-0">
          {/* Table 1: Classwise Student Data Table */}
          <div className="bg-white rounded-3xl shadow-md border-2 border-slate-200 overflow-hidden flex-1 flex flex-col justify-between">
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex items-center justify-between min-h-[64px] h-[64px] shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-900" />
                <h3 className="font-black text-sm sm:text-base text-slate-900 leading-tight">
                  {isKn ? 'ತರಗತಿವಾರು ದಾಖಲಾತಿ' : 'Class-wise Enrolment'}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-950 text-white font-black text-xs sm:text-sm font-mono shadow-xs shrink-0">
                Total: {grandTotal}
              </span>
            </div>

            <div className="overflow-x-auto flex-1 flex flex-col justify-between">
              <table className="w-full text-center border-collapse text-xs sm:text-sm h-full flex-1">
                <thead className="bg-slate-100 text-slate-900 font-black uppercase tracking-wider border-b-2 border-slate-300">
                  <tr className="h-[58px]">
                    <th className="py-2.5 px-2 text-left w-10 border-r border-slate-200">{isKn ? 'ಕ್ರ.ಸಂ.' : '#'}</th>
                    <th className="py-2.5 px-2 text-left border-r border-slate-200">{isKn ? 'ತರಗತಿ' : 'Class'}</th>
                    <th className="py-2.5 px-2 bg-blue-50 text-blue-950 font-black border-r border-slate-200">{isKn ? 'ಗಂಡು (B)' : 'B'}</th>
                    <th className="py-2.5 px-2 bg-pink-50 text-pink-950 font-black border-r border-slate-200">{isKn ? 'ಹೆಣ್ಣು (G)' : 'G'}</th>
                    <th className="py-2.5 px-2 bg-slate-200 font-black text-slate-950">{isKn ? 'ಒಟ್ಟು (T)' : 'T'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {classTableData.map((row) => (
                    <tr
                      key={row.classStandard}
                      onClick={() => onNavigateToAddStudent(row.classStandard)}
                      className="hover:bg-blue-50/50 transition cursor-pointer font-bold h-[42px]"
                      title={`Click to view students in Class ${row.classStandard}`}
                    >
                      <td className="py-2 px-2 text-left text-slate-500 font-bold border-r border-slate-100">{row.slNo}</td>
                      <td className="py-2 px-2 text-left font-sans font-black text-slate-900 whitespace-nowrap border-r border-slate-100">
                        {row.className}
                      </td>
                      <td className="py-2 px-2 bg-blue-50/40 text-blue-950 font-black border-r border-slate-100">{row.boys}</td>
                      <td className="py-2 px-2 bg-pink-50/40 text-pink-950 font-black border-r border-slate-100">{row.girls}</td>
                      <td
                        onClick={(e) => {
                          e.stopPropagation();
                          const classStudents = students.filter((s) => s.classStandard === row.classStandard);
                          setStudentDetailsModalState({
                            isOpen: true,
                            title: `${row.className} Students Details (${row.total})`,
                            subtitle: `${schoolRecord?.schoolName || 'Govt School'} • Class ${row.classStandard} • Total: ${row.total} Students`,
                            students: classStudents,
                          });
                        }}
                        className="py-2 px-2 font-black text-blue-900 bg-blue-50/60 hover:bg-blue-200 hover:text-blue-950 underline decoration-blue-400 decoration-2 transition cursor-pointer"
                        title={`Click to view student list for ${row.className}`}
                      >
                        {row.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Table 1 Footer */}
                <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-mono font-black text-xs sm:text-sm">
                  <tr onClick={handleOpenAllStudentsList} className="hover:bg-emerald-50 transition cursor-pointer h-[44px]" title="Click to view all students in school">
                    <td colSpan={2} className="py-2.5 px-2 text-left font-sans font-black text-slate-950 border-r border-slate-200">
                      {isKn ? 'ಒಟ್ಟು:' : 'Total:'}
                    </td>
                    <td
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenBoysList();
                      }}
                      className="py-2.5 px-2 text-blue-950 bg-blue-100 hover:bg-blue-200 underline decoration-blue-400 font-black cursor-pointer border-r border-slate-200"
                      title="Click to view all Boys list"
                    >
                      👦 {totalBoys}
                    </td>
                    <td
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenGirlsList();
                      }}
                      className="py-2.5 px-2 text-pink-950 bg-pink-100 hover:bg-pink-200 underline decoration-pink-400 font-black cursor-pointer border-r border-slate-200"
                      title="Click to view all Girls list"
                    >
                      👧 {totalGirls}
                    </td>
                    <td className="py-2.5 px-2 text-emerald-950 bg-emerald-100 hover:bg-emerald-200 underline decoration-emerald-500 decoration-2 font-black text-sm sm:text-base">
                      {grandTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Chart 1: Donut Pie Chart (Boys vs Girls) DIRECTLY BELOW TABLE 1 */}
          <div
            data-chart="true"
            className="chart-card chart-container bg-white rounded-3xl shadow-md border-2 border-slate-200 p-5 h-[340px] min-h-[340px] flex flex-col justify-between shrink-0 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-blue-400 hover:brightness-[1.02]"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 h-[36px] shrink-0">
              <span className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                <PieChart className="w-4 h-4 text-blue-700" />
                <span>{isKn ? 'ಲಿಂಗವಾರು ಹಂಚಿಕೆ (Gender Distribution)' : 'Gender Distribution'}</span>
              </span>
              <span className="text-xs font-mono text-slate-700 font-black bg-slate-100 px-2.5 py-0.5 rounded-lg">
                Total: {grandTotal}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 flex-1 py-1">
              {/* Interactive SVG Donut */}
              <div className="chart-interactive relative flex items-center justify-center shrink-0 transition-all duration-300 hover:-translate-y-1 hover:brightness-105">
                <svg width={size} height={size} className="transform -rotate-90">
                  <circle cx={center} cy={center} r={radius} stroke="#f1f5f9" strokeWidth={strokeWidth} fill="transparent" />
                  {/* Boys Segment */}
                  <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="#2563eb"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={`${boysDash} ${circumference}`}
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-out cursor-pointer hover:stroke-[#1d4ed8]"
                    onClick={handleOpenBoysList}
                  >
                    <title>Boys: {totalBoys} ({boysPercentage}%)</title>
                  </circle>
                  {/* Girls Segment */}
                  <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="#ec4899"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={`${girlsDash} ${circumference}`}
                    strokeDashoffset={-boysDash}
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-out cursor-pointer hover:stroke-[#be185d]"
                    onClick={handleOpenGirlsList}
                  >
                    <title>Girls: {totalGirls} ({girlsPercentage}%)</title>
                  </circle>
                </svg>

                {/* Center Content in Donut */}
                <div
                  onClick={handleOpenAllStudentsList}
                  className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:scale-105 hover:-translate-y-0.5 transition-all text-center group"
                  title="Click to view all students"
                >
                  <span className="text-2xl sm:text-3xl font-black text-slate-950 font-mono tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                    {grandTotal}
                  </span>
                  <span className="text-[10px] uppercase font-black text-slate-600 mt-0.5">
                    {isKn ? 'ವಿದ್ಯಾರ್ಥಿಗಳು' : 'Students'}
                  </span>
                </div>
              </div>

              {/* Legend Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 w-full flex-1">
                <div
                  onClick={handleOpenBoysList}
                  className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-blue-100 transition shadow-xs hover:-translate-y-1 hover:shadow-md hover:brightness-105 duration-200"
                  title="Click to view all Boys"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shrink-0" />
                    <div>
                      <span className="font-black text-xs text-blue-950 block">Boys (ಗಂಡು)</span>
                      <span className="text-[11px] text-blue-800 font-mono font-bold">{totalBoys} {isKn ? 'ವಿದ್ಯಾರ್ಥಿಗಳು' : 'Students'}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-blue-900 font-mono">{boysPercentage}%</span>
                </div>

                <div
                  onClick={handleOpenGirlsList}
                  className="p-2.5 bg-pink-50 border border-pink-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-pink-100 transition shadow-xs hover:-translate-y-1 hover:shadow-md hover:brightness-105 duration-200"
                  title="Click to view all Girls"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-pink-500 shrink-0" />
                    <div>
                      <span className="font-black text-xs text-pink-950 block">Girls (ಹೆಣ್ಣು)</span>
                      <span className="text-[11px] text-pink-800 font-mono font-bold">{totalGirls} {isKn ? 'ವಿದ್ಯಾರ್ಥಿನಿಯರು' : 'Students'}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-pink-900 font-mono">{girlsPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            COLUMN 2 (RIGHT COLUMN): Table 2 + Chart 2 directly below it
            Desktop Width: ~65-66% of screen width (spans window together with Col 1)
            ======================================================== */}
        <div className="w-full lg:w-[65%] xl:w-[66%] space-y-6 flex flex-col min-w-0 flex-1">
          {/* Table 2: Category-wise Abstract Matrix */}
          <div className="bg-white rounded-3xl shadow-md border-2 border-slate-200 overflow-hidden flex-1 flex flex-col justify-between">
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 min-h-[64px] h-[64px] shrink-0">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-900" />
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 leading-tight">
                    {isKn
                      ? 'ಪ್ರವರ್ಗವಾರು ವಿದ್ಯಾರ್ಥಿಗಳ ದಾಖಲಾತಿ ವಿವರ'
                      : 'Category-wise Enrolment Abstract'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold">
                    {isKn
                      ? `SC, ST, OBC, GENERAL & GRAND TOTAL (B/G/T) • ಶಾಲಾ ವ್ಯಾಪ್ತಿ: ತರಗತಿ ${schoolRecord?.schoolRange || (isDemo ? '1–10' : '1–8')}`
                      : `SC, ST, OBC, GENERAL & GRAND TOTAL (B/G/T) • Classes ${schoolRecord?.schoolRange || (isDemo ? '1–10' : '1–8')}`}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-950 text-white font-black text-xs sm:text-sm font-mono shadow-xs shrink-0">
                Total: {students.length}
              </span>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto flex-1 flex flex-col justify-between">
              <table className="w-full text-center border-collapse text-[11px] sm:text-xs h-full flex-1">
                <thead className="bg-slate-100 text-slate-900 font-black uppercase tracking-wider border-b-2 border-slate-300">
                  <tr className="h-[30px]">
                    <th rowSpan={2} className="py-1 px-1.5 text-left border-r border-slate-300 bg-slate-200/90 min-w-[70px] whitespace-nowrap">
                      {isKn ? 'ತರಗತಿ' : 'Class'}
                    </th>
                    <th colSpan={3} className="py-1 px-0.5 bg-purple-50 text-purple-950 border-r border-slate-300 text-center font-black">
                      SC
                    </th>
                    <th colSpan={3} className="py-1 px-0.5 bg-orange-50 text-orange-950 border-r border-slate-300 text-center font-black">
                      ST
                    </th>
                    <th colSpan={3} className="py-1 px-0.5 bg-blue-50 text-blue-950 border-r border-slate-300 text-center font-black">
                      OBC
                    </th>
                    <th colSpan={3} className="py-1 px-0.5 bg-rose-50 text-rose-950 border-r border-slate-300 text-center font-black">
                      GENERAL
                    </th>
                    <th colSpan={3} className="py-1 px-0.5 bg-emerald-100/70 text-emerald-950 text-center font-black">
                      GRAND TOTAL
                    </th>
                  </tr>
                  <tr className="bg-slate-50 font-mono text-[10px] sm:text-[11px] font-black border-b-2 border-slate-300 h-[28px]">
                    {/* SC */}
                    <th className="py-0.5 px-0.5 text-blue-700 bg-purple-50/50 text-center font-black">B</th>
                    <th className="py-0.5 px-0.5 text-pink-700 bg-purple-50/50 text-center font-black">G</th>
                    <th className="py-0.5 px-0.5 text-purple-900 bg-purple-100 border-r border-slate-300 text-center font-black">T</th>
                    {/* ST */}
                    <th className="py-0.5 px-0.5 text-blue-700 bg-orange-50/50 text-center font-black">B</th>
                    <th className="py-0.5 px-0.5 text-pink-700 bg-orange-50/50 text-center font-black">G</th>
                    <th className="py-0.5 px-0.5 text-orange-900 bg-orange-100 border-r border-slate-300 text-center font-black">T</th>
                    {/* OBC */}
                    <th className="py-0.5 px-0.5 text-blue-700 bg-blue-50/50 text-center font-black">B</th>
                    <th className="py-0.5 px-0.5 text-pink-700 bg-blue-50/50 text-center font-black">G</th>
                    <th className="py-0.5 px-0.5 text-blue-900 bg-blue-100 border-r border-slate-300 text-center font-black">T</th>
                    {/* GENERAL */}
                    <th className="py-0.5 px-0.5 text-blue-700 bg-rose-50/50 text-center font-black">B</th>
                    <th className="py-0.5 px-0.5 text-pink-700 bg-rose-50/50 text-center font-black">G</th>
                    <th className="py-0.5 px-0.5 text-rose-900 bg-rose-100 border-r border-slate-300 text-center font-black">T</th>
                    {/* GRAND TOTAL */}
                    <th className="py-0.5 px-0.5 text-blue-950 bg-emerald-50 text-center font-black">B</th>
                    <th className="py-0.5 px-0.5 text-pink-950 bg-emerald-50 text-center font-black">G</th>
                    <th className="py-0.5 px-1 text-emerald-950 bg-emerald-200 font-extrabold text-center">T</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {classwiseCategoryAbstract.map((row) => (
                    <tr key={row.classStandard} className="hover:bg-slate-50 transition font-bold text-center h-[42px]">
                      <td className="py-2 px-1.5 text-left font-sans font-black text-slate-900 border-r border-slate-200 bg-slate-50/60 whitespace-nowrap text-xs">
                        {row.className}
                      </td>

                      {/* SC */}
                      <td
                        onClick={() => {
                          const boys = row.sc.students.filter((s) => s.gender === 'Boy' || !s.gender);
                          setStudentDetailsModalState({
                            isOpen: true,
                            title: `Class ${row.classStandard} - SC Boys (${boys.length})`,
                            subtitle: `${schoolRecord?.schoolName || 'School'} • Class ${row.classStandard}`,
                            students: boys,
                          });
                        }}
                        className="py-1.5 px-0.5 sm:px-1 text-slate-700 hover:bg-purple-100 cursor-pointer"
                        title="SC Boys"
                      >
                        {row.sc.m}
                      </td>
                      <td
                        onClick={() => {
                          const girls = row.sc.students.filter((s) => s.gender === 'Girl');
                          setStudentDetailsModalState({
                            isOpen: true,
                            title: `Class ${row.classStandard} - SC Girls (${girls.length})`,
                            subtitle: `${schoolRecord?.schoolName || 'School'} • Class ${row.classStandard}`,
                            students: girls,
                          });
                        }}
                        className="py-1.5 px-0.5 sm:px-1 text-slate-700 hover:bg-purple-100 cursor-pointer"
                        title="SC Girls"
                      >
                        {row.sc.f}
                      </td>
                      <td
                        onClick={() => {
                          setStudentDetailsModalState({
                            isOpen: true,
                            title: `Class ${row.classStandard} - SC Total (${row.sc.t})`,
                            subtitle: `${schoolRecord?.schoolName || 'School'} • Class ${row.classStandard}`,
                            students: row.sc.students,
                          });
                        }}
                        className="py-1.5 px-0.5 sm:px-1 font-black text-purple-900 bg-purple-50/40 hover:bg-purple-200 border-r border-slate-200 cursor-pointer"
                        title="SC Total"
                      >
                        {row.sc.t}
                      </td>

                      {/* ST */}
                      <td
                        onClick={() => {
                          const boys = row.st.students.filter((s) => s.gender === 'Boy' || !s.gender);
                          setStudentDetailsModalState({
                            isOpen: true,
                            title: `Class ${row.classStandard} - ST Boys (${boys.length})`,
                            subtitle: `${schoolRecord?.schoolName || 'School'} • Class ${row.classStandard}`,
                            students: boys,
                          });
                        }}
                        className="py-1.5 px-0.5 sm:px-1 text-slate-700 hover:bg-orange-100 cursor-pointer"
                        title="ST Boys"
                      >
                        {row.st.m}
                      </td>
                      <td
                        onClick={() => {
                          const girls = row.st.students.filter((s) => s.gender === 'Girl');
                          setStudentDetailsModalState({
                            isOpen: true,
                            title: `Class ${row.classStandard} - ST Girls (${girls.length})`,
                            subtitle: `${schoolRecord?.schoolName || 'School'} • Class ${row.classStandard}`,
                            students: girls,
                          });
                        }}
                        className="py-1.5 px-0.5 sm:px-1 text-slate-700 hover:bg-orange-100 cursor-pointer"
                        title="ST Girls"
                      >
                        {row.st.f}
                      </td>
                      <td
                        onClick={() => {
                          setStudentDetailsModalState({
                            isOpen: true,
                            title: `Class ${row.classStandard} - ST Total (${row.st.t})`,
                            subtitle: `${schoolRecord?.schoolName || 'School'} • Class ${row.classStandard}`,
                            students: row.st.students,
                          });
                        }}
                        className="py-1.5 px-0.5 sm:px-1 font-black text-orange-900 bg-orange-50/40 hover:bg-orange-200 border-r border-slate-200 cursor-pointer"
                        title="ST Total"
                      >
                        {row.st.t}
                      </td>

                      {/* OBC */}
                      <td
                        onClick={() => {
                          const boys = row.obc.students.filter((s) => s.gender === 'Boy' || !s.gender);
                          setStudentDetailsModalState({
                            isOpen: true,
                            title: `Class ${row.classStandard} - OBC Boys (${boys.length})`,
                            subtitle: `${schoolRecord?.schoolName || 'School'} • Class ${row.classStandard}`,
                            students: boys,
                          });
                        }}
                        className="py-1.5 px-0.5 sm:px-1 text-slate-700 hover:bg-blue-100 cursor-pointer"
                        title="OBC Boys"
                      >
                        {row.obc.m}
                      </td>
                      <td
                        onClick={() => {
                          const girls = row.obc.students.filter((s) => s.gender === 'Girl');
                          setStudentDetailsModalState({
                            isOpen: true,
                            title: `Class ${row.classStandard} - OBC Girls (${girls.length})`,
                            subtitle: `${schoolRecord?.schoolName || 'School'} • Class ${row.classStandard}`,
                            students: girls,
                          });
                        }}
                        className="py-1.5 px-0.5 sm:px-1 text-slate-700 hover:bg-blue-100 cursor-pointer"
                        title="OBC Girls"
                      >
                        {row.obc.f}
                      </td>
                      <td
                        onClick={() => {
                          setStudentDetailsModalState({
                            isOpen: true,
                            title: `Class ${row.classStandard} - OBC Total (${row.obc.t})`,
                            subtitle: `${schoolRecord?.schoolName || 'School'} • Class ${row.classStandard}`,
                            students: row.obc.students,
                          });
                        }}
                        className="py-1.5 px-0.5 sm:px-1 font-black text-blue-900 bg-blue-50/40 hover:bg-blue-200 border-r border-slate-200 cursor-pointer"
                        title="OBC Total"
                      >
                        {row.obc.t}
                      </td>

                      {/* GENERAL */}
                      <td
                        onClick={() => {
                          const boys = row.gm.students.filter((s) => s.gender === 'Boy' || !s.gender);
                          setStudentDetailsModalState({
                            isOpen: true,
                            title: `Class ${row.classStandard} - GENERAL Boys (${boys.length})`,
                            subtitle: `${schoolRecord?.schoolName || 'School'} • Class ${row.classStandard}`,
                            students: boys,
                          });
                        }}
                        className="py-1.5 px-0.5 sm:px-1 text-slate-700 hover:bg-rose-100 cursor-pointer"
                        title="GENERAL Boys"
                      >
                        {row.gm.m}
                      </td>
                      <td
                        onClick={() => {
                          const girls = row.gm.students.filter((s) => s.gender === 'Girl');
                          setStudentDetailsModalState({
                            isOpen: true,
                            title: `Class ${row.classStandard} - GENERAL Girls (${girls.length})`,
                            subtitle: `${schoolRecord?.schoolName || 'School'} • Class ${row.classStandard}`,
                            students: girls,
                          });
                        }}
                        className="py-1.5 px-0.5 sm:px-1 text-slate-700 hover:bg-rose-100 cursor-pointer"
                        title="GENERAL Girls"
                      >
                        {row.gm.f}
                      </td>
                      <td
                        onClick={() => {
                          setStudentDetailsModalState({
                            isOpen: true,
                            title: `Class ${row.classStandard} - GENERAL Total (${row.gm.t})`,
                            subtitle: `${schoolRecord?.schoolName || 'School'} • Class ${row.classStandard}`,
                            students: row.gm.students,
                          });
                        }}
                        className="py-1.5 px-0.5 sm:px-1 font-black text-rose-900 bg-rose-50/40 hover:bg-rose-200 border-r border-slate-200 cursor-pointer"
                        title="GENERAL Total"
                      >
                        {row.gm.t}
                      </td>

                      {/* GRAND TOTAL */}
                      <td
                        onClick={() => {
                          const boys = row.total.students.filter((s) => s.gender === 'Boy' || !s.gender);
                          setStudentDetailsModalState({
                            isOpen: true,
                            title: `Class ${row.classStandard} - All Boys (${boys.length})`,
                            subtitle: `${schoolRecord?.schoolName || 'School'} • Class ${row.classStandard}`,
                            students: boys,
                          });
                        }}
                        className="py-1.5 px-0.5 sm:px-1 text-blue-900 bg-slate-100 hover:bg-blue-200 cursor-pointer font-bold"
                        title="Grand Total Boys"
                      >
                        {row.total.m}
                      </td>
                      <td
                        onClick={() => {
                          const girls = row.total.students.filter((s) => s.gender === 'Girl');
                          setStudentDetailsModalState({
                            isOpen: true,
                            title: `Class ${row.classStandard} - All Girls (${girls.length})`,
                            subtitle: `${schoolRecord?.schoolName || 'School'} • Class ${row.classStandard}`,
                            students: girls,
                          });
                        }}
                        className="py-1.5 px-0.5 sm:px-1 text-pink-900 bg-slate-100 hover:bg-pink-200 cursor-pointer font-bold"
                        title="Grand Total Girls"
                      >
                        {row.total.f}
                      </td>
                      <td
                        onClick={() => {
                          setStudentDetailsModalState({
                            isOpen: true,
                            title: `Class ${row.classStandard} - Total Students (${row.total.t})`,
                            subtitle: `${schoolRecord?.schoolName || 'School'} • Class ${row.classStandard}`,
                            students: row.total.students,
                          });
                        }}
                        className="py-1.5 px-1 font-black text-slate-950 bg-emerald-50 hover:bg-emerald-200 cursor-pointer"
                        title="Grand Total Students"
                      >
                        {row.total.t}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Table 2 Footer */}
                <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-mono text-xs font-black">
                  <tr className="text-center h-[44px]">
                    <td
                      onClick={() => {
                        setStudentDetailsModalState({
                          isOpen: true,
                          title: `All Enrolled Students - Category & Classwise Details (${abstractTotals.total.t})`,
                          subtitle: `${schoolRecord?.schoolName || 'School'} • Grand Total: ${abstractTotals.total.t} Students`,
                          students: abstractTotals.total.students,
                        });
                      }}
                      className="py-2.5 px-1.5 text-left font-sans font-black text-slate-950 text-xs sm:text-sm border-r border-slate-300 whitespace-nowrap cursor-pointer hover:bg-slate-200 transition"
                      title="Click to view all enrolled students"
                    >
                      {isKn ? 'ಒಟ್ಟು (Total)' : 'Grand Total'}
                    </td>
                    {/* SC */}
                    <td
                      onClick={() => {
                        const boys = abstractTotals.sc.students.filter((s) => s.gender === 'Boy' || !s.gender);
                        setStudentDetailsModalState({
                          isOpen: true,
                          title: `Total SC Boys (${boys.length})`,
                          subtitle: `${schoolRecord?.schoolName || 'School'} • All Classes • SC Boys`,
                          students: boys,
                        });
                      }}
                      className="py-2 px-0.5 sm:px-1 bg-purple-100 hover:bg-purple-200 text-purple-950 font-bold cursor-pointer transition"
                      title="Click to view all SC Boys"
                    >
                      {abstractTotals.sc.m}
                    </td>
                    <td
                      onClick={() => {
                        const girls = abstractTotals.sc.students.filter((s) => s.gender === 'Girl');
                        setStudentDetailsModalState({
                          isOpen: true,
                          title: `Total SC Girls (${girls.length})`,
                          subtitle: `${schoolRecord?.schoolName || 'School'} • All Classes • SC Girls`,
                          students: girls,
                        });
                      }}
                      className="py-2 px-0.5 sm:px-1 bg-purple-100 hover:bg-purple-200 text-purple-950 font-bold cursor-pointer transition"
                      title="Click to view all SC Girls"
                    >
                      {abstractTotals.sc.f}
                    </td>
                    <td
                      onClick={() => {
                        setStudentDetailsModalState({
                          isOpen: true,
                          title: `Total SC Students (${abstractTotals.sc.t})`,
                          subtitle: `${schoolRecord?.schoolName || 'School'} • All Classes • Scheduled Caste (SC)`,
                          students: abstractTotals.sc.students,
                        });
                      }}
                      className="py-2 px-0.5 sm:px-1 bg-purple-200 hover:bg-purple-300 text-purple-950 font-black border-r border-slate-300 cursor-pointer transition"
                      title="Click to view all SC Students"
                    >
                      {abstractTotals.sc.t}
                    </td>
                    {/* ST */}
                    <td
                      onClick={() => {
                        const boys = abstractTotals.st.students.filter((s) => s.gender === 'Boy' || !s.gender);
                        setStudentDetailsModalState({
                          isOpen: true,
                          title: `Total ST Boys (${boys.length})`,
                          subtitle: `${schoolRecord?.schoolName || 'School'} • All Classes • ST Boys`,
                          students: boys,
                        });
                      }}
                      className="py-2 px-0.5 sm:px-1 bg-orange-100 hover:bg-orange-200 text-orange-950 font-bold cursor-pointer transition"
                      title="Click to view all ST Boys"
                    >
                      {abstractTotals.st.m}
                    </td>
                    <td
                      onClick={() => {
                        const girls = abstractTotals.st.students.filter((s) => s.gender === 'Girl');
                        setStudentDetailsModalState({
                          isOpen: true,
                          title: `Total ST Girls (${girls.length})`,
                          subtitle: `${schoolRecord?.schoolName || 'School'} • All Classes • ST Girls`,
                          students: girls,
                        });
                      }}
                      className="py-2 px-0.5 sm:px-1 bg-orange-100 hover:bg-orange-200 text-orange-950 font-bold cursor-pointer transition"
                      title="Click to view all ST Girls"
                    >
                      {abstractTotals.st.f}
                    </td>
                    <td
                      onClick={() => {
                        setStudentDetailsModalState({
                          isOpen: true,
                          title: `Total ST Students (${abstractTotals.st.t})`,
                          subtitle: `${schoolRecord?.schoolName || 'School'} • All Classes • Scheduled Tribe (ST)`,
                          students: abstractTotals.st.students,
                        });
                      }}
                      className="py-2 px-0.5 sm:px-1 bg-orange-200 hover:bg-orange-300 text-orange-950 font-black border-r border-slate-300 cursor-pointer transition"
                      title="Click to view all ST Students"
                    >
                      {abstractTotals.st.t}
                    </td>
                    {/* OBC */}
                    <td
                      onClick={() => {
                        const boys = abstractTotals.obc.students.filter((s) => s.gender === 'Boy' || !s.gender);
                        setStudentDetailsModalState({
                          isOpen: true,
                          title: `Total OBC Boys (${boys.length})`,
                          subtitle: `${schoolRecord?.schoolName || 'School'} • All Classes • OBC Boys (Cat-1, 2A, 2B, 3A, 3B)`,
                          students: boys,
                        });
                      }}
                      className="py-2 px-0.5 sm:px-1 bg-blue-100 hover:bg-blue-200 text-blue-950 font-bold cursor-pointer transition"
                      title="Click to view all OBC Boys"
                    >
                      {abstractTotals.obc.m}
                    </td>
                    <td
                      onClick={() => {
                        const girls = abstractTotals.obc.students.filter((s) => s.gender === 'Girl');
                        setStudentDetailsModalState({
                          isOpen: true,
                          title: `Total OBC Girls (${girls.length})`,
                          subtitle: `${schoolRecord?.schoolName || 'School'} • All Classes • OBC Girls (Cat-1, 2A, 2B, 3A, 3B)`,
                          students: girls,
                        });
                      }}
                      className="py-2 px-0.5 sm:px-1 bg-blue-100 hover:bg-blue-200 text-blue-950 font-bold cursor-pointer transition"
                      title="Click to view all OBC Girls"
                    >
                      {abstractTotals.obc.f}
                    </td>
                    <td
                      onClick={() => {
                        setStudentDetailsModalState({
                          isOpen: true,
                          title: `Total OBC Students (${abstractTotals.obc.t})`,
                          subtitle: `${schoolRecord?.schoolName || 'School'} • All Classes • Other Backward Classes (OBC)`,
                          students: abstractTotals.obc.students,
                        });
                      }}
                      className="py-2 px-0.5 sm:px-1 bg-blue-200 hover:bg-blue-300 text-blue-950 font-black border-r border-slate-300 cursor-pointer transition"
                      title="Click to view all OBC Students"
                    >
                      {abstractTotals.obc.t}
                    </td>
                    {/* GENERAL */}
                    <td
                      onClick={() => {
                        const boys = abstractTotals.gm.students.filter((s) => s.gender === 'Boy' || !s.gender);
                        setStudentDetailsModalState({
                          isOpen: true,
                          title: `Total General Merit (GM) Boys (${boys.length})`,
                          subtitle: `${schoolRecord?.schoolName || 'School'} • All Classes • General Merit Boys`,
                          students: boys,
                        });
                      }}
                      className="py-2 px-0.5 sm:px-1 bg-rose-100 hover:bg-rose-200 text-rose-950 font-bold cursor-pointer transition"
                      title="Click to view all General Merit Boys"
                    >
                      {abstractTotals.gm.m}
                    </td>
                    <td
                      onClick={() => {
                        const girls = abstractTotals.gm.students.filter((s) => s.gender === 'Girl');
                        setStudentDetailsModalState({
                          isOpen: true,
                          title: `Total General Merit (GM) Girls (${girls.length})`,
                          subtitle: `${schoolRecord?.schoolName || 'School'} • All Classes • General Merit Girls`,
                          students: girls,
                        });
                      }}
                      className="py-2 px-0.5 sm:px-1 bg-rose-100 hover:bg-rose-200 text-rose-950 font-bold cursor-pointer transition"
                      title="Click to view all General Merit Girls"
                    >
                      {abstractTotals.gm.f}
                    </td>
                    <td
                      onClick={() => {
                        setStudentDetailsModalState({
                          isOpen: true,
                          title: `Total General Merit (GM) Students (${abstractTotals.gm.t})`,
                          subtitle: `${schoolRecord?.schoolName || 'School'} • All Classes • General Merit (GM)`,
                          students: abstractTotals.gm.students,
                        });
                      }}
                      className="py-2 px-0.5 sm:px-1 bg-rose-200 hover:bg-rose-300 text-rose-950 font-black border-r border-slate-300 cursor-pointer transition"
                      title="Click to view all General Merit Students"
                    >
                      {abstractTotals.gm.t}
                    </td>
                    {/* GRAND TOTAL */}
                    <td
                      onClick={() => {
                        const boys = abstractTotals.total.students.filter((s) => s.gender === 'Boy' || !s.gender);
                        setStudentDetailsModalState({
                          isOpen: true,
                          title: `School Total - All Boys (${boys.length})`,
                          subtitle: `${schoolRecord?.schoolName || 'School'} • All Classes • All Boys`,
                          students: boys,
                        });
                      }}
                      className="py-2 px-0.5 sm:px-1 bg-blue-200 hover:bg-blue-300 text-blue-950 font-black cursor-pointer transition"
                      title="Click to view all Boys in school"
                    >
                      {abstractTotals.total.m}
                    </td>
                    <td
                      onClick={() => {
                        const girls = abstractTotals.total.students.filter((s) => s.gender === 'Girl');
                        setStudentDetailsModalState({
                          isOpen: true,
                          title: `School Total - All Girls (${girls.length})`,
                          subtitle: `${schoolRecord?.schoolName || 'School'} • All Classes • All Girls`,
                          students: girls,
                        });
                      }}
                      className="py-2 px-0.5 sm:px-1 bg-pink-200 hover:bg-pink-300 text-pink-950 font-black cursor-pointer transition"
                      title="Click to view all Girls in school"
                    >
                      {abstractTotals.total.f}
                    </td>
                    <td
                      onClick={() => {
                        setStudentDetailsModalState({
                          isOpen: true,
                          title: `School Grand Total - All Students (${abstractTotals.total.t})`,
                          subtitle: `${schoolRecord?.schoolName || 'School'} • All Classes • Grand Total`,
                          students: abstractTotals.total.students,
                        });
                      }}
                      className="py-2 px-1 bg-emerald-300 hover:bg-emerald-400 text-slate-950 font-black text-sm cursor-pointer transition underline decoration-emerald-600 decoration-2"
                      title="Click to view all students in school"
                    >
                      {abstractTotals.total.t}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Chart 2: Category Distribution Chart DIRECTLY BELOW TABLE 2 */}
          <div
            data-chart="true"
            className="chart-card chart-container bg-white rounded-3xl shadow-md border-2 border-slate-200 p-5 h-[340px] min-h-[340px] flex flex-col justify-between shrink-0 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-indigo-400 hover:brightness-[1.02]"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 h-[36px] shrink-0">
              <span className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                <PieChart className="w-4 h-4 text-indigo-700" />
                <span>
                  {isKn
                    ? 'ಪ್ರವರ್ಗವಾರು ಹಂಚಿಕೆ (SC, ST, OBC, GENERAL)'
                    : 'Category Distribution (SC, ST, OBC, GENERAL)'}
                </span>
              </span>
              <span className="text-xs font-mono text-slate-700 font-black bg-slate-100 px-2.5 py-0.5 rounded-lg">
                Total: {grandTotal}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 flex-1 py-1">
              {/* Interactive SVG Pie Chart */}
              <div className="chart-interactive relative flex items-center justify-center shrink-0 transition-all duration-300 hover:-translate-y-1 hover:brightness-105">
                <svg width="180" height="180" viewBox="0 0 200 200" className="drop-shadow-sm">
                  {renderPieSvgSlices()}
                </svg>
              </div>

              {/* Category Legend Cards */}
              <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto flex-1 max-w-sm">
                {categoryPieData.map((cat) => (
                  <div
                    key={cat.key}
                    onClick={() => {
                      setStudentDetailsModalState({
                        isOpen: true,
                        title: isKn ? `${cat.labelKn} - ಪಟ್ಟಿ (${cat.count})` : `${cat.labelEn} - List (${cat.count})`,
                        subtitle: `${schoolRecord?.schoolName || 'Govt School'} • DISE: ${diseCode} • ಒಟ್ಟು: ${cat.count}`,
                        students: cat.students,
                      });
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-400 rounded-2xl cursor-pointer transition-all shadow-xs space-y-1 hover:-translate-y-1 hover:shadow-md hover:brightness-105 duration-200"
                    title={`Click to view ${cat.labelEn} students (${cat.count})`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full ${cat.bg} shrink-0`} />
                      <span className="font-black text-xs text-slate-900 truncate">
                        {cat.key}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-slate-600 font-bold font-mono">
                        {cat.count} {isKn ? 'ವಿದ್ಯಾರ್ಥಿ' : 'Students'}
                      </span>
                      <span className={`text-xs font-black font-mono ${cat.text}`}>
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student List Details Popup Modal */}
      {studentDetailsModalState.isOpen && (
        <StudentListDetailsModal
          isOpen={studentDetailsModalState.isOpen}
          onClose={() =>
            setStudentDetailsModalState({
              isOpen: false,
              title: '',
              subtitle: '',
              students: [],
            })
          }
          title={studentDetailsModalState.title}
          subtitle={studentDetailsModalState.subtitle}
          students={studentDetailsModalState.students}
          schoolRecord={schoolRecord}
        />
      )}

      {/* CCE Detailed Class Progress Modal */}
      {selectedDetailClass && (
        <CceClassProgressModal
          isOpen={Boolean(selectedDetailClass)}
          onClose={() => setSelectedDetailClass(null)}
          classStandard={selectedDetailClass}
          students={students}
          marksMap={marksMap}
          schoolRecord={schoolRecord}
          academicYear={academicYear}
        />
      )}

      {/* CCE Consolidated School Progress Modal (All Classes) */}
      {isConsolidatedProgressOpen && (
        <CceConsolidatedProgressModal
          isOpen={isConsolidatedProgressOpen}
          onClose={() => setIsConsolidatedProgressOpen(false)}
          students={students}
          marksMap={marksMap}
          configuredClasses={configuredClasses}
          schoolRecord={schoolRecord}
          academicYear={academicYear}
          onSelectClassDetail={(cls) => {
            setIsConsolidatedProgressOpen(false);
            setSelectedDetailClass(cls);
          }}
        />
      )}
    </div>
  );
};
