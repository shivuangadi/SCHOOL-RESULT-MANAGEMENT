import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SchoolMedium, StudentClass, StudentDivision, Student, SchoolRecord } from '../types';
import { AddStudentData } from './AddStudentData';
import { ClasswiseStudentDashboard } from './ClasswiseStudentDashboard';
import { ActiveCceMarksEntry } from './ActiveCceMarksEntry';
import { ConsolidationSection } from './ConsolidationSection';
import { PromotionModal } from './PromotionModal';
import { TransferCertificateModal } from './TransferCertificateModal';
import { StudyCertificateModal } from './StudyCertificateModal';
import { CasteBirthCertificateModal } from './CasteBirthCertificateModal';
import { ProgressCardModal } from './ProgressCardModal';
import { MarksCardModal } from './MarksCardModal';
import { ConsolidationReportsModal } from './ConsolidationReportsModal';
import { CceConsolidatedReportModal } from './CceConsolidatedReportModal';
import { CceConsolidatedReportMarathiUrduModal } from './CceConsolidatedReportMarathiUrduModal';
import { PrimaryCceReportsModal, PrimaryReportTabKey } from './PrimaryCceReportsModal';
import { HigherPrimaryCceReportsModal, HpReportTabKey } from './HigherPrimaryCceReportsModal';
import { SatsGradeUploadModal } from './SatsGradeUploadModal';
import { StudentDropboxModal } from './StudentDropboxModal';
import { StudentListDetailsModal } from './StudentListDetailsModal';
import { SubjectStructureModal } from './SubjectStructureModal';
import { BackupRestoreModal } from './BackupRestoreModal';
import { CoverPageDesignerModal } from './CoverPageDesignerModal';
import { loadSchoolStudents, subscribeSchoolStudents } from '../utils/studentStore';
import {
  Database,
  School,
  Hash,
  User,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  Award,
  Users,
  BarChart3,
  FileText,
  PieChart,
  Settings,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  BookOpen,
  GraduationCap,
  Play,
  UserPlus,
  Home,
  LayoutDashboard,
  MapPin,
  Edit3,
  Save,
  Printer,
  ChevronDown,
  Trash2,
  Phone,
  Mail,
  RotateCcw,
  Layers,
  ArrowRight,
  Lock,
} from 'lucide-react';

export type SchoolNavCategory =
  | 'home'
  | 'studentDatabase'
  | 'marksEntry'
  | 'reportPrinting'
  | 'subjectStructure'
  | 'schoolProfile'
  | 'coverPageDesigner';

interface SchoolDashboardProps {
  onOpenPaymentModal: () => void;
  overrideSchoolRecord?: SchoolRecord;
  activeCategory?: SchoolNavCategory;
  onSelectCategory?: (cat: SchoolNavCategory) => void;
  isDemoMode?: boolean;
}

export const ACADEMIC_YEARS: string[] = (() => {
  const years: string[] = ['2024-25', '2025-26'];
  for (let y = 2026; y <= 2050; y++) {
    const nextY = (y + 1) % 100;
    years.push(`${y}-${String(nextY).padStart(2, '0')}`);
  }
  return years;
})();
const ALL_CLASSES: StudentClass[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const ALL_DIVISIONS: StudentDivision[] = ['A', 'B', 'C', 'D'];

export const SchoolDashboard: React.FC<SchoolDashboardProps> = ({
  onOpenPaymentModal,
  overrideSchoolRecord,
  activeCategory: propActiveCategory,
  onSelectCategory,
  isDemoMode = false,
}) => {
  const { schoolRecord: authSchoolRecord, updateSchoolRecord, isAdmin } = useAuth();
  const schoolRecord = overrideSchoolRecord || authSchoolRecord;
  const { lang } = useLanguage();
  const isDemo = isDemoMode || overrideSchoolRecord?.diseCode === '29010100101' || schoolRecord?.diseCode === '29010100101';
  const [isPaaKeyPromptOpen, setIsPaaKeyPromptOpen] = useState(false);

  // Academic Year State (Persistent & Synchronized)
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>(() => {
    return (
      localStorage.getItem('kseab_active_academic_year') ||
      schoolRecord?.academicYear ||
      '2026-27'
    );
  });

  // Navigation states
  const [internalCategory, setInternalCategory] = useState<SchoolNavCategory>('home');
  const activeCategory = propActiveCategory || internalCategory;

  const handleNavigateCategory = (cat: SchoolNavCategory) => {
    setInternalCategory(cat);
    onSelectCategory?.(cat);
    if (cat === 'subjectStructure') {
      setIsSubjectStructureModalOpen(true);
    } else if (cat === 'coverPageDesigner') {
      setIsCoverPageModalOpen(true);
    }
  };

  const [activeSubView, setActiveSubView] = useState<'overview' | 'addStudent' | 'masterList' | 'cceEngine' | 'consolidation'>('overview');
  const [isSubjectStructureModalOpen, setIsSubjectStructureModalOpen] = useState(false);
  const [isCoverPageModalOpen, setIsCoverPageModalOpen] = useState(false);

  useEffect(() => {
    if (propActiveCategory === 'subjectStructure') {
      setIsSubjectStructureModalOpen(true);
    } else if (propActiveCategory === 'coverPageDesigner') {
      setIsCoverPageModalOpen(true);
    } else if (propActiveCategory) {
      setInternalCategory(propActiveCategory);
    }
  }, [propActiveCategory]);

  const [selectedClassForAdd, setSelectedClassForAdd] = useState<StudentClass | undefined>(undefined);
  const [selectedClassForCce, setSelectedClassForCce] = useState<number | undefined>(undefined);
  const [students, setStudents] = useState<Student[]>([]);
  const [openDropdownMenu, setOpenDropdownMenu] = useState<string | null>(null);

  // Modals state for Report Printing & Actions
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [isTcModalOpen, setIsTcModalOpen] = useState(false);
  const [isStudyCertModalOpen, setIsStudyCertModalOpen] = useState(false);

  const handleOpenReport = (openCallback: () => void, isFreeInDemo: boolean = false) => {
    if (isDemo && !isFreeInDemo) {
      setIsPaaKeyPromptOpen(true);
      return;
    }
    openCallback();
  };

  const [isSatsGradeUploadModalOpen, setIsSatsGradeUploadModalOpen] = useState(false);
  const [isCasteBirthModalOpen, setIsCasteBirthModalOpen] = useState(false);
  const [isProgressCardModalOpen, setIsProgressCardModalOpen] = useState(false);
  const [isMarksCardModalOpen, setIsMarksCardModalOpen] = useState(false);
  const [isConsolidationModalOpen, setIsConsolidationModalOpen] = useState(false);
  const [isCceConsolidatedModalOpen, setIsCceConsolidatedModalOpen] = useState(false);
  const [isCceMarathiUrduModalOpen, setIsCceMarathiUrduModalOpen] = useState(false);
  const [isPrimaryCceReportsOpen, setIsPrimaryCceReportsOpen] = useState(false);
  const [primaryCceInitialTab, setPrimaryCceInitialTab] = useState<PrimaryReportTabKey>('page4');
  const [isHigherPrimaryReportsOpen, setIsHigherPrimaryReportsOpen] = useState(false);
  const [higherPrimaryInitialTab, setHigherPrimaryInitialTab] = useState<HpReportTabKey>('page2');
  const [consolidationInitialTab, setConsolidationInitialTab] = useState<'classwise' | 'school' | 'gradewise'>('classwise');
  const [isDropboxOpen, setIsDropboxOpen] = useState(false);
  const [isBackupRestoreOpen, setIsBackupRestoreOpen] = useState(false);
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

  // School Profile editing state
  const [profileForm, setProfileForm] = useState({
    schoolName: schoolRecord?.schoolName || '',
    headmasterName: schoolRecord?.headmasterName || '',
    mobile: schoolRecord?.mobile || '',
    email: schoolRecord?.email || '',
    schoolRange: schoolRecord?.schoolRange || '1 ರಿಂದ 8 ನೇ ತರಗತಿ',
    crcCluster: schoolRecord?.crcCluster || schoolRecord?.cluster || 'ಸದಲಗಾ',
    district: schoolRecord?.district || 'ಬೆಳಗಾವಿ',
    taluk: schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ',
    schoolMedium: schoolRecord?.schoolMedium || 'Kannada',
    schoolType: schoolRecord?.schoolType || 'Government',
  });

  // Class Teacher assignment state
  const [teacherAssignClass, setTeacherAssignClass] = useState<StudentClass>('1');
  const [teacherAssignDiv, setTeacherAssignDiv] = useState<StudentDivision>('A');
  const [teacherNameInput, setTeacherNameInput] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const schoolId = schoolRecord?.schoolId || schoolRecord?.diseCode || 'school';
  const diseCode = schoolRecord?.diseCode || '';

  // Synchronize profile form when schoolRecord loads
  useEffect(() => {
    if (schoolRecord) {
      setProfileForm({
        schoolName: schoolRecord.schoolName || '',
        headmasterName: schoolRecord.headmasterName || '',
        mobile: schoolRecord.mobile || '',
        email: schoolRecord.email || '',
        schoolRange: schoolRecord.schoolRange || '1 ರಿಂದ 8 ನೇ ತರಗತಿ',
        crcCluster: schoolRecord.crcCluster || schoolRecord.cluster || 'ಸದಲಗಾ',
        district: schoolRecord.district || 'ಬೆಳಗಾವಿ',
        taluk: schoolRecord.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ',
        schoolMedium: schoolRecord.schoolMedium || 'Kannada',
        schoolType: schoolRecord.schoolType || 'Government',
      });
    }
  }, [schoolRecord]);

  // Load students for active academic year
  useEffect(() => {
    if (!diseCode) return;
    loadSchoolStudents(diseCode, diseCode, currentAcademicYear).then(setStudents);
    const unsubscribe = subscribeSchoolStudents(
      diseCode,
      (updated) => {
        setStudents(updated);
      },
      undefined,
      currentAcademicYear
    );
    return () => unsubscribe();
  }, [diseCode, currentAcademicYear]);

  // Academic Year Change Handler
  const handleAcademicYearChange = async (newYear: string) => {
    setCurrentAcademicYear(newYear);
    localStorage.setItem('kseab_active_academic_year', newYear);
    if (updateSchoolRecord) {
      await updateSchoolRecord({ academicYear: newYear });
    }
    const yearStudents = await loadSchoolStudents(diseCode, diseCode, newYear);
    setStudents(yearStudents);
  };

  // Save School Profile changes
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingProfile(true);
    try {
      if (updateSchoolRecord) {
        await updateSchoolRecord({
          schoolName: profileForm.schoolName.trim(),
          headmasterName: profileForm.headmasterName.trim(),
          mobile: profileForm.mobile.trim(),
          email: profileForm.email.trim(),
          schoolRange: profileForm.schoolRange.trim(),
          crcCluster: profileForm.crcCluster.trim(),
          cluster: profileForm.crcCluster.trim(),
          district: profileForm.district.trim(),
          taluk: profileForm.taluk.trim(),
          schoolMedium: profileForm.schoolMedium as SchoolMedium,
          schoolType: profileForm.schoolType as any,
          academicYear: currentAcademicYear,
        });
      }
      setProfileSuccessMsg('✓ ಶಾಲಾ ವಿವರಗಳು ಯಶಸ್ವಿಯಾಗಿ ಸರ್ವರ್‌ನಲ್ಲಿ ನವೀಕರಿಸಲಾಗಿದೆ! (Profile Saved Successfully)');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Error saving profile: ${err?.message || 'Could not save'}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save Class Teacher assignment
  const handleSaveClassTeacher = async () => {
    if (!teacherNameInput.trim()) {
      alert('ದಯವಿಟ್ಟು ವರ್ಗ ಶಿಕ್ಷಕರ ಹೆಸರನ್ನು ನಮೂದಿಸಿ (Please enter teacher name).');
      return;
    }

    const key = `${teacherAssignClass}-${teacherAssignDiv}`;
    const currentTeachers = schoolRecord?.classTeachers || {};
    const updatedTeachers = {
      ...currentTeachers,
      [key]: teacherNameInput.trim(),
    };

    if (schoolRecord?.diseCode) {
      localStorage.setItem(`kseab_ct_name_${schoolRecord.diseCode}_${teacherAssignClass}`, teacherNameInput.trim());
    }

    if (updateSchoolRecord) {
      await updateSchoolRecord({ classTeachers: updatedTeachers });
    }

    setTeacherNameInput('');
    setProfileSuccessMsg(`✓ ತರಗತಿ ${teacherAssignClass}-${teacherAssignDiv} ಗೆ ಶಿಕ್ಷಕರ ಹೆಸರು ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!`);
    setTimeout(() => setProfileSuccessMsg(null), 3500);
  };

  // Remove Class Teacher assignment
  const handleRemoveClassTeacher = async (classKey: string) => {
    const currentTeachers = { ...(schoolRecord?.classTeachers || {}) };
    delete currentTeachers[classKey];
    if (schoolRecord?.diseCode) {
      const cls = classKey.split('-')[0];
      localStorage.removeItem(`kseab_ct_name_${schoolRecord.diseCode}_${cls}`);
    }
    if (updateSchoolRecord) {
      await updateSchoolRecord({ classTeachers: currentTeachers });
    }
    setProfileSuccessMsg(`✓ ವರ್ಗ ಶಿಕ್ಷಕರ ವಿವರ ತೆಗೆದುಹಾಕಲಾಗಿದೆ.`);
    setTimeout(() => setProfileSuccessMsg(null), 3000);
  };

  if (!schoolRecord) return null;

  const classTeachers = schoolRecord.classTeachers || {};

  return (
    <div className="w-full max-w-[1740px] mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-3 space-y-4 text-slate-800">
      {/* =========================================================================
          TOP COMMAND BAR: ACADEMIC YEAR DROPDOWN + RED PROMOTION BUTTON
          (Clean, no repeated school name, DISE, taluk, or cluster on home)
          ========================================================================= */}
      <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Academic Year Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
          <label className="text-xs font-black text-slate-200 whitespace-nowrap">
            {lang === 'kn' ? 'ಶೈಕ್ಷಣಿಕ ವರ್ಷ:' : 'Academic Year:'}
          </label>
          <select
            value={currentAcademicYear}
            onChange={(e) => handleAcademicYearChange(e.target.value)}
            className="bg-slate-950 text-amber-300 font-mono font-black text-xs sm:text-sm px-3 py-1 rounded-xl border border-slate-700 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
            title="Select Academic Year (ಶೈಕ್ಷಣಿಕ ಸಾಲು ಆಯ್ಕೆ ಮಾಡಿ)"
          >
            {ACADEMIC_YEARS.map((yr) => (
              <option key={yr} value={yr} className="bg-slate-900 text-amber-300 font-mono font-bold">
                {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Back to Home + RED PROMOTION BUTTON */}
        <div className="flex items-center gap-2.5">
          {activeCategory !== 'home' && (
            <button
              type="button"
              onClick={() => handleNavigateCategory('home')}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <span>← Home (ಮುಖಪುಟ)</span>
            </button>
          )}

          <button
            type="button"
            data-no-lift="true"
            onClick={() => setIsPromotionModalOpen(true)}
            className="no-hover-lift px-3.5 sm:px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-md border border-red-400 transition cursor-pointer animate-pulse hover:animate-none"
            title="Promote students to next standard for the new academic year (password required)"
          >
            <RotateCcw className="w-4 h-4 text-white shrink-0" />
            <span>ವಿದ್ಯಾರ್ಥಿಗಳ ಬಡ್ತಿ (Promote Students)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MODULE 1: HOME PAGE VIEW (CLASSWISE STUDENT DASHBOARD)
          ========================================================================= */}
      {activeCategory === 'home' && (
        <ClasswiseStudentDashboard
          academicYear={currentAcademicYear}
          isDemo={isDemo}
          overrideSchoolRecord={schoolRecord}
          onOpenPaymentModal={onOpenPaymentModal}
          onNavigateToAddStudent={(cls) => {
            setSelectedClassForAdd(cls);
            handleNavigateCategory('studentDatabase');
            setActiveSubView('addStudent');
          }}
          onNavigateToCce={(cls) => {
            setSelectedClassForCce(cls);
            handleNavigateCategory('marksEntry');
            setActiveSubView('cceEngine');
          }}
          onNavigateToProfile={() => handleNavigateCategory('schoolProfile')}
          onNavigateToCceReport={(cls) => {
            if (cls === '6' || cls === '7' || cls === '8') {
              setHigherPrimaryInitialTab('consolidation_100');
              setIsHigherPrimaryReportsOpen(true);
            } else if (schoolRecord?.schoolMedium === 'Marathi' || schoolRecord?.schoolMedium === 'Urdu') {
              setIsCceMarathiUrduModalOpen(true);
            } else {
              setIsCceConsolidatedModalOpen(true);
            }
          }}
          onNavigateToConsolidation={() => {
            if (isDemo) {
              setIsPaaKeyPromptOpen(true);
              return;
            }
            handleNavigateCategory('reportPrinting');
            setActiveSubView('consolidation');
          }}
        />
      )}

      {/* =========================================================================
          MODULE 2: STUDENT DATA BASE (ADD / EDIT / DELETE / SATS EXCEL IMPORT)
          ========================================================================= */}
      {activeCategory === 'studentDatabase' && (
        <AddStudentData
          initialClass={selectedClassForAdd}
          academicYear={currentAcademicYear}
          schoolRecord={schoolRecord}
          onBackToDashboard={() => {
            handleNavigateCategory('home');
            setActiveSubView('overview');
          }}
          onProceedToCce={() => {
            handleNavigateCategory('marksEntry');
            setActiveSubView('cceEngine');
          }}
        />
      )}

      {/* =========================================================================
          MODULE 3: MARKS ENTRY (PRIMARY / HIGHER PRIMARY CCE MATRIX AS IN PICTURE)
          ========================================================================= */}
      {activeCategory === 'marksEntry' && (
        <ActiveCceMarksEntry
          students={students}
          schoolRecord={schoolRecord}
          academicYear={currentAcademicYear}
          initialClass={selectedClassForCce}
          onBackToHome={() => {
            handleNavigateCategory('home');
            setActiveSubView('overview');
          }}
        />
      )}

      {/* =========================================================================
          MODULE 4: REPORT PRINTING SECTION (CONSOLIDATION REPORTS & LAUNCHERS)
          ========================================================================= */}
      {activeCategory === 'reportPrinting' && (
        <div className="space-y-6">
          {/* Quick Launcher Grid for All Reports */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <span>ಅಧಿಕೃತ ಶಾಲಾ ವರದಿಗಳ ಮುದ್ರಣ & ಪಿಡಿಎಫ್ ಡೌನ್‌ಲೋಡ್ (All School Reports)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ಪ್ರತಿಯೊಂದು ವರದಿಯಲ್ಲಿ ಮುದ್ರಣ (Print), PDF ಡೌನ್‌ಲೋಡ್ (Export PDF) ಹಾಗೂ WhatsApp Photo Share ಲಭ್ಯವಿದೆ.
              </p>
            </div>

            {/* Demo Mode Notice Banner */}
            {isDemo && (
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl font-black shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm">
                      {lang === 'kn' ? 'ಡೆಮೊ ಮೋಡ್: ವರದಿಗಳ ಮುದ್ರಣಕ್ಕೆ PAA ಕೀ ಅಗತ್ಯವಿದೆ' : 'Demo Mode: Purchase PAA Key to Download & Print Reports'}
                    </h4>
                    <p className="text-xs text-amber-800">
                      {lang === 'kn'
                        ? 'ಅಧಿಕೃತ ವರದಿಗಳು, ಪ್ರಗತಿ ಪತ್ರ, ಮತ್ತು ಪ್ರಮಾಣ ಪತ್ರಗಳನ್ನು ವೀಕ್ಷಿಸಲು/ಮುದ್ರಿಸಲು ₹500 ವಾರ್ಷಿಕ ಪಾಸ್ ಕೀ (PAA Key) ಪಡೆದುಕೊಳ್ಳಿ.'
                        : 'Official school broadsheets, student progress cards, and certificates require a 1-year PAA key.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenPaymentModal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-md transition cursor-pointer shrink-0"
                >
                  {lang === 'kn' ? 'ಖರೀದಿಸಿ / ₹500 ಪಾವತಿಸಿ (Purchase PAA Key)' : 'Purchase PAA Key (₹500)'}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 text-xs">
              {/* REQUESTED: 1-5TH REPORTS BUTTON GROUPING PAGES 2, 3, 4, 5, 6 */}
              <button
                type="button"
                onClick={() => {
                  handleOpenReport(() => {
                    setPrimaryCceInitialTab('page4');
                    setIsPrimaryCceReportsOpen(true);
                  }, true);
                }}
                className="p-4 bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 hover:from-indigo-900 hover:to-blue-900 text-white rounded-2xl text-left space-y-1.5 transition cursor-pointer shadow-lg border-2 border-amber-400 ring-2 ring-amber-400/40 transform hover:-translate-y-0.5 sm:col-span-2 lg:col-span-2 xl:col-span-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-400 text-slate-950 rounded-lg font-black shadow-xs">
                      <Layers className="w-4 h-4" />
                    </span>
                    <span className="font-black text-amber-300 text-sm">
                      1-5th Reports (೧-೫ನೇ ತರಗತಿ ಅಧಿಕೃತ ವರದಿಗಳು)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider shadow-xs">
                    Legal Size • {schoolRecord?.schoolMedium === 'Marathi' || schoolRecord?.schoolMedium === 'Urdu' ? '500 Marks' : 'Pages 2-6'}
                  </span>
                </div>
                <p className="text-xs font-bold text-white leading-snug">
                  {schoolRecord?.schoolMedium === 'Marathi' || schoolRecord?.schoolMedium === 'Urdu'
                    ? `${schoolRecord.schoolMedium} Medium: 100 Marks, 9-Line 500m, Grade Matrix, Legal Size Reports`
                    : '1-5th Reports: 100 Marks, 9-Line 400m, Grade Matrix, Legal Size Reports'}
                </p>
                <p className="text-[11px] text-slate-300">
                  {schoolRecord?.schoolMedium === 'Marathi' || schoolRecord?.schoolMedium === 'Urdu'
                    ? 'Page 1 (Part A & B), Page 2 (100 Marks Register), Page 3 (Subject & Grade Details), Page 4 (All Subject Consolidation 9lines 500m).'
                    : 'Page 2 (100 ಅಂಕ ವಹಿ), Page 3 (ವಿಷಯ & ಶ್ರೇಣಿವಾರು), Page 4 (All subject Consolidation 9lines), Page 5 (Legal ಭಾವಚಿತ್ರ), Page 6 (ಪ್ರವರ್ಗವಾರು).'}
                </p>
              </button>

              {/* 6-8TH CCE REPORTS SUITE (CLASSES 6 TO 8 - ALL MEDIUMS - 700 MARKS) */}
              <button
                type="button"
                onClick={() => {
                  handleOpenReport(() => {
                    setHigherPrimaryInitialTab('consolidation_100');
                    setIsHigherPrimaryReportsOpen(true);
                  }, true);
                }}
                className="p-4 bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 hover:from-purple-900 hover:to-indigo-900 text-white rounded-2xl text-left space-y-1.5 transition cursor-pointer shadow-lg border-2 border-amber-400 ring-2 ring-amber-400/40 transform hover:-translate-y-0.5 sm:col-span-2 lg:col-span-2 xl:col-span-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-400 text-slate-950 rounded-lg font-black shadow-xs">
                      <Layers className="w-4 h-4" />
                    </span>
                    <span className="font-black text-amber-300 text-sm">
                      6-8th Reports (೬-೮ನೇ ತರಗತಿ ಅಧಿಕೃತ CCE ವರದಿಗಳು)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider shadow-xs">
                    Legal Size • 700 Marks • Formats 1-6
                  </span>
                </div>
                <p className="text-xs font-bold text-white leading-snug">
                  ೬-೮ನೇ ತರಗತಿ (All Mediums): 7 ವಿಷಯಗಳು (700 ಅಂಕಗಳು) • ೧೦೦ ಅಂಕಗಳ ಕ್ರೋಢೀಕರಣ • ೯-ಸಾಲು 2-Way Sync • SATS Grade Upload
                </p>
                <p className="text-[11px] text-slate-300">
                  ನಮೂನೆ ೧ (ಅಂಕ ದಾಖಲಾತಿ Part A & B), ನಮೂನೆ ೨ (೧೦೦ ಅಂಕ ಕ್ರೋಢೀಕರಣ ವರದಿ), ನಮೂನೆ ೩ (೯-ಸಾಲು ಸಂಯೋಜಿತ), ನಮೂನೆ ೪ (SATS ಗ್ರೇಡ್ Excel), ನಮೂನೆ ೫ (ಘೋಷವಾರ 1-8), ನಮೂನೆ ೬ (೬-೮ ಮಹಾ ಘೋಷವಾರ HM/CRP/ECO Sign).
                </p>
              </button>

              {/* PRIMARY CCE CONSOLIDATED REPORT (CLASSES 1–5): STRICTLY SHOW MARATHI/URDU FORMAT ONLY IF MEDIUM IS MARATHI OR URDU */}
              {schoolRecord?.schoolMedium === 'Marathi' || schoolRecord?.schoolMedium === 'Urdu' ? (
                /* Primary: Marathi / Urdu 5-Subject Report (500 Marks) */
                <button
                  type="button"
                  onClick={() => setIsCceMarathiUrduModalOpen(true)}
                  className="p-4 bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-100 hover:from-emerald-200 hover:to-teal-200 border-2 border-emerald-500 rounded-2xl text-left space-y-1.5 transition cursor-pointer shadow-md ring-2 ring-emerald-400/40 transform hover:-translate-y-0.5 sm:col-span-2 lg:col-span-1 xl:col-span-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-emerald-600 text-white rounded-lg font-black shadow-xs">
                        <FileSpreadsheet className="w-4 h-4" />
                      </span>
                      <span className="font-black text-emerald-950 text-sm">
                        {schoolRecord.schoolMedium} CCE ಸಂಯೋಜಿತ ವರದಿ
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500 text-white font-black text-[10px] rounded-full uppercase tracking-wider shadow-xs">
                      500m • Legal
                    </span>
                  </div>
                  <p className="text-xs font-bold text-emerald-900 leading-snug">
                    CCE Consolidated Report ({schoolRecord.schoolMedium} Medium - Classes 1–5)
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    {schoolRecord.schoolMedium} Medium • ೫ ವಿಷಯಗಳು (೫೦೦ ಅಂಕ) • ಪ್ರಥಮ ({schoolRecord.schoolMedium === 'Urdu' ? 'Urdu' : 'Marathi'}), ಕನ್ನಡ, English, Math, EVS • English Headings • Legal Landscape.
                  </p>
                </button>
              ) : (
                /* Primary: Kannada / English 4-Subject Report (400 Marks) */
                <button
                  type="button"
                  onClick={() => setIsCceConsolidatedModalOpen(true)}
                  className="p-4 bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-100 hover:from-amber-200 hover:to-yellow-200 border-2 border-amber-400 rounded-2xl text-left space-y-1.5 transition cursor-pointer shadow-md ring-2 ring-amber-400/40 transform hover:-translate-y-0.5 sm:col-span-2 lg:col-span-1 xl:col-span-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-amber-400 text-slate-950 rounded-lg font-black shadow-xs">
                        <FileSpreadsheet className="w-4 h-4" />
                      </span>
                      <span className="font-black text-amber-950 text-sm">ಸಿಸಿಇ ಸಂಯೋಜಿತ ವರದಿ</span>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider shadow-xs">
                      400m • Legal
                    </span>
                  </div>
                  <p className="text-xs font-bold text-amber-900 leading-snug">
                    CCE Consolidated Report (Classes 1–5 Final Result Sheet)
                  </p>
                  <p className="text-[11px] text-amber-800">
                    ಕನ್ನಡ/ಇಂಗ್ಲಿಷ್ ಮಾಧ್ಯಮ • ೪ ವಿಷಯಗಳು (೪೦೦ ಅಂಕ) • ವರ್ಗ ಶಿಕ್ಷಕರು & ಕಾರ್ಯದಿನಗಳ ವಿವರಗಳೊಂದಿಗೆ ಅಧಿಕೃತ ಮುದ್ರಣ.
                  </p>
                </button>
              )}

              {/* 1. All Consolidation */}
              <button
                type="button"
                onClick={() => handleOpenReport(() => setActiveSubView('consolidation'), true)}
                className="p-4 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 rounded-2xl text-left space-y-1 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-blue-950 text-sm">೧. ಸಂಕಲನಾ ವರದಿಗಳು</span>
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-[11px] text-blue-700">All Consolidation Reports (ತರಗತಿ & ವಿಷಯವಾರು)</p>
              </button>

              {/* 2. Transfer Certificate */}
              <button
                type="button"
                onClick={() => handleOpenReport(() => setIsTcModalOpen(true))}
                className="p-4 bg-purple-50/80 hover:bg-purple-100/80 border border-purple-200 rounded-2xl text-left space-y-1 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-purple-950 text-sm">೨. ವರ್ಗಾವಣೆ ಪ್ರಮಾಣ ಪತ್ರ (TC)</span>
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-[11px] text-purple-700">Karnataka Official State Transfer Certificate</p>
              </button>

              {/* 3. Study Certificate */}
              <button
                type="button"
                onClick={() => handleOpenReport(() => setIsStudyCertModalOpen(true))}
                className="p-4 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl text-left space-y-1 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-950 text-sm">೩. ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರ</span>
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-[11px] text-emerald-700">Study & Bonafide Certificate with Seal</p>
              </button>

              {/* 7th DOM Button: SATS GRADE UPLOAD REPORT (CLASSES 1-5 / 1-8 • KANNADA & ENGLISH MEDIUM) */}
              <button
                type="button"
                onClick={() => {
                  handleOpenReport(() => {
                    setIsSatsGradeUploadModalOpen(true);
                  }, true);
                }}
                className="p-4 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 rounded-2xl text-left space-y-1.5 transition cursor-pointer shadow-md border-2 border-amber-300 ring-4 ring-amber-400/40 transform hover:-translate-y-0.5 sm:col-span-2 lg:col-span-1 xl:col-span-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-slate-950 text-amber-300 rounded-lg font-black shadow-xs">
                      <Award className="w-4 h-4" />
                    </span>
                    <span className="font-black text-slate-950 text-sm">
                      SATS ಗ್ರೇಡ್ ಅಪ್‌ಲೋಡ್ (SATS Grade Report)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-950 text-amber-300 font-black text-[10px] rounded-full uppercase tracking-wider shadow-xs">
                    Classes 1–8 • Multi-Tab Excel
                  </span>
                </div>
                <p className="text-xs font-black text-slate-950 leading-snug tracking-tight flex items-center gap-1.5 drop-shadow-xs">
                  ೧-೮ನೇ ತರಗತಿ SATS Grade Entry (Classes 1–8 • ಕನ್ನಡ & English Medium)
                </p>
                <p className="text-[11px] text-amber-950 font-bold">
                  ಕರ್ನಾಟಕ SATS ಪೋರ್ಟಲ್‌ಗೆ ಕೇವಲ ಗ್ರೇಡ್‌ಗಳು • 1 ರಿಂದ 8ನೇ ತರಗತಿ Dropdown • ಎಲ್ಲಾ ಪರೀಕ್ಷೆಗಳ Multi-Tab Excel (ನಿಖರ ವಿದ್ಯಾರ್ಥಿಗಳ ಸಂಖ್ಯೆ).
                </p>
              </button>

              {/* 4. Caste / Birth Certificate */}
              <button
                type="button"
                onClick={() => handleOpenReport(() => setIsCasteBirthModalOpen(true))}
                className="p-4 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 rounded-2xl text-left space-y-1 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-950 text-sm">೪. ಜಾತಿ/ಜನ್ಮ ದಿನಾಂಕ ದೃಢೀಕರಣ</span>
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-[11px] text-amber-700">Caste & Date of Birth Official Certificate</p>
              </button>

              {/* 5. Progress Card */}
              <button
                type="button"
                onClick={() => handleOpenReport(() => setIsProgressCardModalOpen(true))}
                className="p-4 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200 rounded-2xl text-left space-y-1 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-indigo-950 text-sm">೫. ವಿದ್ಯಾರ್ಥಿ ಪ್ರಗತಿ ಪತ್ರ</span>
                  <Award className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-[11px] text-indigo-700">CCE Progress Card with Grade Analysis</p>
              </button>

              {/* 6. Annual Result Sheet */}
              <button
                type="button"
                onClick={() => handleOpenReport(() => setIsMarksCardModalOpen(true))}
                className="p-4 bg-teal-50/80 hover:bg-teal-100/80 border border-teal-200 rounded-2xl text-left space-y-1 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-teal-950 text-sm">೬. ವಾರ್ಷಿಕ ಫಲಿತಾಂಶ ಪಟ್ಟಿ</span>
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-[11px] text-teal-700">Annual Marks Card & Examination Result Sheet</p>
              </button>

              {/* 7. 100 Marks Consolidation */}
              <button
                type="button"
                onClick={() => {
                  handleOpenReport(() => {
                    setPrimaryCceInitialTab('page2');
                    setIsPrimaryCceReportsOpen(true);
                  }, true);
                }}
                className="p-4 bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200 rounded-2xl text-left space-y-1 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-rose-950 text-sm">೭. ೧೦೦ ಅಂಕಗಳ ಕ್ರೋಢೀಕರಣ</span>
                  <Award className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-[11px] text-rose-700">100 Marks Consolidation & Broadsheet</p>
              </button>

              {/* 8. 9-Line CCE Consolidation */}
              <button
                type="button"
                onClick={() => {
                  handleOpenReport(() => {
                    setConsolidationInitialTab('classwise');
                    setIsConsolidationModalOpen(true);
                  }, true);
                }}
                className="p-4 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-2xl text-left space-y-1 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">೮. ೯-ಸಾಲು CCE ಕ್ರೋಢೀಕೃತ ವರದಿ</span>
                  <Layers className="w-4 h-4 text-slate-700" />
                </div>
                <p className="text-[11px] text-slate-600">9-Line Category-wise Consolidation</p>
              </button>

              {/* 9. Schoolwise Goshware */}
              <button
                type="button"
                onClick={() => {
                  handleOpenReport(() => {
                    setConsolidationInitialTab('school');
                    setIsConsolidationModalOpen(true);
                  }, true);
                }}
                className="p-4 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-300 rounded-2xl text-left space-y-1 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-950 text-sm">೯. ಶಾಲಾವಾರು ಘೋಷವಾರೆ</span>
                  <PieChart className="w-4 h-4 text-amber-700" />
                </div>
                <p className="text-[11px] text-amber-800">School-wise Overall Analytical Goshware</p>
              </button>

              {/* 10. Cover Page Designer / ಮುಖಪುಟ ವಿನ್ಯಾಸಕ */}
              <button
                type="button"
                onClick={() => setIsCoverPageModalOpen(true)}
                className="p-4 bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-300 text-slate-950 rounded-2xl text-left space-y-1 transition cursor-pointer shadow-md border-2 border-amber-600 sm:col-span-2 lg:col-span-2 xl:col-span-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-slate-950 text-amber-400 rounded-lg">
                      <FileText className="w-4 h-4" />
                    </span>
                    <span className="font-black text-slate-950 text-sm">
                      ೧೦. ಮುಖಪುಟ ವಿನ್ಯಾಸಕ (School Result Cover Page Designer)
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-slate-950 text-amber-300 font-black text-[10px] rounded-full uppercase tracking-wider">
                    Official A4 / Legal Landscape
                  </span>
                </div>
                <p className="text-xs text-slate-900 font-bold leading-snug">
                  ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಅಧಿಕೃತ ಶೈಲಿಯ ಫಲಿತಾಂಶ ಕಡತ ಮುಖಪುಟ • ವೃತ್ತಾಕಾರದ ಮುದ್ರೆ • ಗಂಡಭೇರುಂಡ ಲಾಂಛನ • A4 & Legal Landscape • ಬಣ್ಣದ & ಕಪ್ಪು-ಬಿಳಿ PDF ಡೌನ್‌ಲೋಡ್.
                </p>
              </button>
            </div>
          </div>

          {/* Full Analytical Consolidation Section */}
          <ConsolidationSection
            students={students}
            schoolRecord={schoolRecord}
            onBackToHome={() => {
              handleNavigateCategory('home');
              setActiveSubView('overview');
            }}
          />
        </div>
      )}

      {/* =========================================================================
          MODULE 5: SCHOOL PROFILE & CLASS TEACHER INFORMATION
          ========================================================================= */}
      {activeCategory === 'schoolProfile' && (
        <div className="space-y-6">
          {/* Toast Notice */}
          {profileSuccessMsg && (
            <div className="p-4 bg-emerald-700 text-white rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500 animate-in slide-in-from-top-4 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {/* CARD 0: DATA BACKUP & RESTORE (ದತ್ತಾಂಶ ಬ್ಯಾಕಪ್ & ಪುನಃಸ್ಥಾಪನೆ) */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border-2 border-indigo-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-800/80 rounded-xl text-amber-300">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black uppercase tracking-wide text-white">
                  ದತ್ತಾಂಶ ಬ್ಯಾಕಪ್ & ಪುನಃಸ್ಥಾಪನೆ (Data Backup & Restore)
                </h3>
              </div>
              <p className="text-xs text-indigo-200">
                ಶಾಲೆಯ ಎಲ್ಲಾ ವಿದ್ಯಾರ್ಥಿಗಳ ದಾಖಲಾತಿ ವಿವರಗಳು ಮತ್ತು CCE ಅಂಕಗಳನ್ನು ಒಂದೇ ಕ್ಲಿಕ್‌ನಲ್ಲಿ JSON ಬ್ಯಾಕಪ್ ಫೈಲ್ ಆಗಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ಮರುಸ್ಥಾಪಿಸಿ.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsBackupRestoreOpen(true)}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg transition cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Database className="w-4 h-4 text-slate-950" />
              <span>ಬ್ಯಾಕಪ್ & ಪುನಃಸ್ಥಾಪನೆ ವಿಂಡೋ (Open Backup/Restore)</span>
            </button>
          </div>

          {/* CARD 1: SCHOOL DETAILS & ADMINISTRATIVE VERIFICATION */}
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-700" />
                  <span>ಶಾಲಾ ವಿವರಗಳು & ಪ್ರೊಫೈಲ್ (School Details & Profile)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ವರದಿಗಳು, ಪ್ರಗತಿ ಪತ್ರ ಮತ್ತು ಪ್ರಮಾಣ ಪತ್ರಗಳಲ್ಲಿ ಮುದ್ರಣಗೊಳ್ಳುವ ಶಾಲಾ ಅಧಿಕೃತ ವಿವರಗಳು
                </p>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-md transition cursor-pointer self-start sm:self-auto"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Save Profile (ಉಳಿಸಿ)'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* School Name */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-black text-slate-700">ಶಾಲೆಯ ಹೆಸರು (School Name):</label>
                  {!isAdmin && (
                    <span className="text-[10px] font-black text-slate-500 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Locked (ಅಧಿಕೃತ)
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={profileForm.schoolName}
                  onChange={(e) => isAdmin && setProfileForm({ ...profileForm, schoolName: e.target.value })}
                  readOnly={!isAdmin}
                  disabled={!isAdmin}
                  className={`w-full px-3 py-2 border rounded-xl font-bold ${
                    !isAdmin
                      ? 'bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed shadow-inner'
                      : 'bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 border-slate-300'
                  }`}
                  title={!isAdmin ? 'ಶಾಲೆಯ ಹೆಸರನ್ನು ಕೇವಲ ನಿರ್ವಾಹಕರು (Admin) ಮಾತ್ರ ಬದಲಾಯಿಸಬಹುದು / Locked for security' : 'ಶಾಲೆಯ ಹೆಸರು'}
                  required
                />
              </div>

              {/* HM Name */}
              <div className="space-y-1">
                <label className="block font-black text-slate-700">ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಹೆಸರು (HM Name):</label>
                <input
                  type="text"
                  value={profileForm.headmasterName}
                  onChange={(e) => setProfileForm({ ...profileForm, headmasterName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              {/* Mobile / Contact Number */}
              <div className="space-y-1">
                <label className="block font-black text-slate-700">ಸಂಪರ್ಕ ಸಂಖ್ಯೆ (Contact Number):</label>
                <input
                  type="text"
                  value={profileForm.mobile}
                  onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block font-black text-slate-700">ಇಮೇಲ್ (Email ID):</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* DISE Code (Read-only) */}
              <div className="space-y-1">
                <label className="block font-black text-slate-700">ಶಾಲಾ ಡೈಸ್ ಕೋಡ್ (DISE Code):</label>
                <input
                  type="text"
                  value={schoolRecord.diseCode}
                  disabled
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-slate-100 text-slate-600 font-mono"
                />
              </div>

              {/* School Medium */}
              <div className="space-y-1">
                <label className="block font-black text-slate-700">ಶಾಲಾ ಮಾಧ್ಯಮ (Medium):</label>
                <select
                  value={profileForm.schoolMedium}
                  onChange={(e) => setProfileForm({ ...profileForm, schoolMedium: e.target.value as SchoolMedium })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="Kannada">ಕನ್ನಡ ಮಾಧ್ಯಮ (Kannada Medium)</option>
                  <option value="English">English Medium</option>
                  <option value="Marathi">Marathi Medium</option>
                  <option value="Urdu">Urdu Medium</option>
                </select>
              </div>

              {/* ತರಗತಿಯ ವ್ಯಾಪ್ತಿ (School Range) */}
              <div className="space-y-1">
                <label className="block font-black text-blue-900">ತರಗತಿಯ ವ್ಯಾಪ್ತಿ (School Range):</label>
                <select
                  value={profileForm.schoolRange}
                  onChange={(e) => setProfileForm({ ...profileForm, schoolRange: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-xl font-black bg-blue-50/50 text-blue-950 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="1 ರಿಂದ 5 ನೇ ತರಗತಿ">1 ರಿಂದ 5 ನೇ ತರಗತಿ (LPS)</option>
                  <option value="1 ರಿಂದ 7 ನೇ ತರಗತಿ">1 ರಿಂದ 7 ನೇ ತರಗತಿ (HPS)</option>
                  <option value="1 ರಿಂದ 8 ನೇ ತರಗತಿ">1 ರಿಂದ 8 ನೇ ತರಗತಿ (KSEAB Primary)</option>
                  <option value="1 ರಿಂದ 10 ನೇ ತರಗತಿ">1 ರಿಂದ 10 ನೇ ತರಗತಿ (Composite High School)</option>
                  <option value="6 ರಿಂದ 10 ನೇ ತರಗತಿ">6 ರಿಂದ 10 ನೇ ತರಗತಿ (High School)</option>
                  <option value="8 ರಿಂದ 10 ನೇ ತರಗತಿ">8 ರಿಂದ 10 ನೇ ತರಗತಿ (High School)</option>
                </select>
              </div>

              {/* ಸಂಪನ್ಮೂಲ ಕೇಂದ್ರ (Resource Center / CRC Cluster) */}
              <div className="space-y-1">
                <label className="block font-black text-emerald-900">ಸಂಪನ್ಮೂಲ ಕೇಂದ್ರ (CRC Cluster):</label>
                <input
                  type="text"
                  value={profileForm.crcCluster}
                  onChange={(e) => setProfileForm({ ...profileForm, crcCluster: e.target.value })}
                  placeholder="e.g. ಸದಲಗಾ / ಶಿರೂರು"
                  className="w-full px-3 py-2 border-2 border-emerald-300 rounded-xl font-black bg-emerald-50/50 text-emerald-950 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  required
                />
              </div>

              {/* ಜಿಲ್ಲೆ (District) */}
              <div className="space-y-1">
                <label className="block font-black text-slate-700">ಜಿಲ್ಲೆ (District):</label>
                <input
                  type="text"
                  value={profileForm.district}
                  onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                  placeholder="e.g. ಬೆಳಗಾವಿ"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              {/* ತಾಲೂಕು (Taluk) */}
              <div className="space-y-1">
                <label className="block font-black text-amber-900">ತಾಲೂಕು (Taluk):</label>
                <input
                  type="text"
                  value={profileForm.taluk}
                  onChange={(e) => setProfileForm({ ...profileForm, taluk: e.target.value })}
                  placeholder="e.g. ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ"
                  className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl font-black bg-amber-50/50 text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              {/* ಶೈಕ್ಷಣಿಕ ವರ್ಷ (Academic Year) */}
              <div className="space-y-1">
                <label className="block font-black text-indigo-900">ಶೈಕ್ಷಣಿಕ ವರ್ಷ (Academic Year):</label>
                <select
                  value={currentAcademicYear}
                  onChange={(e) => handleAcademicYearChange(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-indigo-300 rounded-xl font-black bg-indigo-50/50 text-indigo-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {ACADEMIC_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* School Type */}
              <div className="space-y-1">
                <label className="block font-black text-slate-700">ಶಾಲೆಯ ವಿಧ (School Type):</label>
                <select
                  value={profileForm.schoolType}
                  onChange={(e) => setProfileForm({ ...profileForm, schoolType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="Government">ಸರ್ಕಾರಿ (Government)</option>
                  <option value="Aided">ಅನುದಾನಿತ (Aided)</option>
                  <option value="Unaided">ಖಾಸಗಿ / ಅನುದಾನರಹಿತ (Unaided)</option>
                </select>
              </div>
            </div>
          </form>

          {/* CARD 2: CLASS TEACHER INFORMATION (ವರ್ಗ ಶಿಕ್ಷಕರ ವಿವರ) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Class Teacher Information (ವರ್ಗ ಶಿಕ್ಷಕರ ವಿವರ)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ಪ್ರತಿ ತರಗತಿ ಹಾಗೂ ವಿಭಾಗವಾರು ವರ್ಗ ಶಿಕ್ಷಕರ ಹೆಸರುಗಳನ್ನು ಸಂಗ್ರಹಿಸಿ ನಮೂದಿಸಿ.
              </p>
            </div>

            {/* Input Row to Assign Class Teacher */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200 text-xs">
              <div className="sm:col-span-3 space-y-1">
                <label className="block font-black text-indigo-950">೧. ತರಗತಿ (Class):</label>
                <select
                  value={teacherAssignClass}
                  onChange={(e) => setTeacherAssignClass(e.target.value as StudentClass)}
                  className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl font-black text-slate-900 focus:outline-none cursor-pointer"
                >
                  {ALL_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls} ನೇ ತರಗತಿ (Class {cls})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block font-black text-indigo-950">೨. ವಿಭಾಗ (Div):</label>
                <select
                  value={teacherAssignDiv}
                  onChange={(e) => setTeacherAssignDiv(e.target.value as StudentDivision)}
                  className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl font-black text-slate-900 focus:outline-none cursor-pointer"
                >
                  {ALL_DIVISIONS.map((div) => (
                    <option key={div} value={div}>
                      Section {div}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5 space-y-1">
                <label className="block font-black text-indigo-950">೩. ವರ್ಗ ಶಿಕ್ಷಕರ ಹೆಸರು (Class Teacher Name):</label>
                <input
                  type="text"
                  value={teacherNameInput}
                  onChange={(e) => setTeacherNameInput(e.target.value)}
                  placeholder="e.g. ಶ್ರೀಮತಿ ಎಂ. ಎಸ್. ಪಾಟೀಲ / ಶ್ರೀ ಎಸ್. ಆರ್. ಅಂಗಡಿ"
                  className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleSaveClassTeacher}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>ಉಳಿಸಿ (Save)</span>
                </button>
              </div>
            </div>

            {/* List / Table of Assigned Class Teachers */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-700 uppercase block tracking-wider">
                ದಾಖಲಾದ ವರ್ಗ ಶಿಕ್ಷಕರ ಪಟ್ಟಿ (Assigned Class Teachers):
              </span>

              {Object.keys(classTeachers).length === 0 ? (
                <div className="p-6 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-200">
                  ಯಾವುದೇ ವರ್ಗ ಶಿಕ್ಷಕರ ವಿವರ ದಾಖಲಾಗಿಲ್ಲ. ಮೇಲಿನ ಆಯ್ಕೆಯ ಮೂಲಕ ಶಿಕ್ಷಕರ ಹೆಸರನ್ನು ನಮೂದಿಸಿ ಉಳಿಸಿ.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(classTeachers).map(([classKey, teacherName]) => (
                    <div
                      key={classKey}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 shadow-xs transition"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 text-[10px] font-black uppercase">
                          Class {classKey}
                        </span>
                        <div className="font-extrabold text-xs text-slate-900 truncate">
                          {teacherName}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveClassTeacher(classKey)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Remove Teacher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ALL REPORT MODALS (TC, STUDY CERT, CASTE/DOB, PROGRESS, MARKS, PROMOTION)
          ========================================================================= */}
      {isPromotionModalOpen && (
        <PromotionModal
          isOpen={isPromotionModalOpen}
          onClose={() => setIsPromotionModalOpen(false)}
          schoolRecord={schoolRecord}
          students={students}
          currentAcademicYear={currentAcademicYear}
          onPromotionSuccess={(newYear) => {
            handleAcademicYearChange(newYear);
          }}
        />
      )}

      {isTcModalOpen && (
        <TransferCertificateModal
          isOpen={isTcModalOpen}
          onClose={() => setIsTcModalOpen(false)}
          students={students}
          schoolRecord={schoolRecord}
        />
      )}

      {isStudyCertModalOpen && (
        <StudyCertificateModal
          isOpen={isStudyCertModalOpen}
          onClose={() => setIsStudyCertModalOpen(false)}
          students={students}
          schoolRecord={schoolRecord}
        />
      )}

      {isCasteBirthModalOpen && (
        <CasteBirthCertificateModal
          isOpen={isCasteBirthModalOpen}
          onClose={() => setIsCasteBirthModalOpen(false)}
          students={students}
          schoolRecord={schoolRecord}
        />
      )}

      {isProgressCardModalOpen && (
        <ProgressCardModal
          isOpen={isProgressCardModalOpen}
          onClose={() => setIsProgressCardModalOpen(false)}
          students={students}
          schoolRecord={schoolRecord}
        />
      )}

      {isMarksCardModalOpen && (
        <MarksCardModal
          isOpen={isMarksCardModalOpen}
          onClose={() => setIsMarksCardModalOpen(false)}
          students={students}
          schoolRecord={schoolRecord}
        />
      )}

      {isConsolidationModalOpen && (
        <ConsolidationReportsModal
          isOpen={isConsolidationModalOpen}
          onClose={() => setIsConsolidationModalOpen(false)}
          students={students}
          schoolRecord={schoolRecord}
          initialTab={consolidationInitialTab}
        />
      )}

      {/* 1-5TH CCE REPORTS SUITE MODAL (PAGES 2 TO 6) */}
      {isPrimaryCceReportsOpen && (
        <PrimaryCceReportsModal
          isOpen={isPrimaryCceReportsOpen}
          onClose={() => setIsPrimaryCceReportsOpen(false)}
          students={students}
          schoolRecord={schoolRecord}
          academicYear={currentAcademicYear}
          initialTab={primaryCceInitialTab}
        />
      )}

      {/* 6-8TH CCE REPORTS SUITE MODAL (PAGES 1 TO 6) */}
      {isHigherPrimaryReportsOpen && (
        <HigherPrimaryCceReportsModal
          isOpen={isHigherPrimaryReportsOpen}
          onClose={() => setIsHigherPrimaryReportsOpen(false)}
          students={students}
          schoolRecord={schoolRecord}
          academicYear={currentAcademicYear}
          initialTab={higherPrimaryInitialTab}
        />
      )}

      {/* CCE CONSOLIDATED REPORT MODAL (CLASSES 1 TO 5 - KANNADA & ENGLISH MEDIUM - 400 MARKS) */}
      {isCceConsolidatedModalOpen && (
        <CceConsolidatedReportModal
          isOpen={isCceConsolidatedModalOpen}
          onClose={() => setIsCceConsolidatedModalOpen(false)}
          students={students}
          schoolRecord={schoolRecord}
          academicYear={currentAcademicYear}
          isDemo={isDemo}
          onOpenPaymentModal={onOpenPaymentModal}
          onSwitchToMarathiUrdu={undefined}
        />
      )}

      {/* CCE CONSOLIDATED REPORT MODAL (CLASSES 1 TO 5 - MARATHI & URDU MEDIUM - 500 MARKS) */}
      {isCceMarathiUrduModalOpen && (
        <CceConsolidatedReportMarathiUrduModal
          isOpen={isCceMarathiUrduModalOpen}
          onClose={() => setIsCceMarathiUrduModalOpen(false)}
          students={students}
          schoolRecord={schoolRecord}
          academicYear={currentAcademicYear}
          isDemo={isDemo}
          onOpenPaymentModal={onOpenPaymentModal}
          onSwitchToKannadaEnglish={undefined}
        />
      )}

      {/* SATS GRADE UPLOAD MODAL (CLASSES 1-5 / 1-8 • KANNADA & ENGLISH MEDIUM • MULTI-TAB EXCEL) */}
      {isSatsGradeUploadModalOpen && (
        <SatsGradeUploadModal
          isOpen={isSatsGradeUploadModalOpen}
          onClose={() => setIsSatsGradeUploadModalOpen(false)}
          students={students}
          schoolRecord={schoolRecord}
          academicYear={currentAcademicYear}
        />
      )}

      {isDropboxOpen && (
        <StudentDropboxModal
          isOpen={isDropboxOpen}
          onClose={() => setIsDropboxOpen(false)}
          diseCode={diseCode}
          onStudentRestored={() => {
            loadSchoolStudents(diseCode, diseCode, currentAcademicYear).then(setStudents);
          }}
        />
      )}

      {studentDetailsModalState.isOpen && (
        <StudentListDetailsModal
          isOpen={studentDetailsModalState.isOpen}
          onClose={() => setStudentDetailsModalState((prev) => ({ ...prev, isOpen: false }))}
          title={studentDetailsModalState.title}
          subtitle={studentDetailsModalState.subtitle}
          students={studentDetailsModalState.students}
          schoolRecord={schoolRecord}
        />
      )}

      {/* Subject Structure (ವಿಷಯ ವಿನ್ಯಾಸ) Modal */}
      <SubjectStructureModal
        isOpen={isSubjectStructureModalOpen}
        onClose={() => {
          setIsSubjectStructureModalOpen(false);
          if (activeCategory === 'subjectStructure') {
            handleNavigateCategory('home');
          }
        }}
        defaultMedium={schoolRecord?.schoolMedium || 'Kannada'}
      />

      {/* Backup & Restore Data Modal */}
      {isBackupRestoreOpen && (
        <BackupRestoreModal
          isOpen={isBackupRestoreOpen}
          onClose={() => setIsBackupRestoreOpen(false)}
          schoolRecord={schoolRecord}
          diseCode={diseCode}
          academicYear={currentAcademicYear}
          activeStudents={students}
          onDataRestored={async () => {
            const list = await loadSchoolStudents(diseCode, diseCode, currentAcademicYear);
            setStudents(list);
          }}
        />
      )}

      {/* Cover Page Designer Modal (ಮುಖಪುಟ ವಿನ್ಯಾಸಕ) */}
      {isCoverPageModalOpen && (
        <CoverPageDesignerModal
          isOpen={isCoverPageModalOpen}
          onClose={() => setIsCoverPageModalOpen(false)}
          overrideSchoolRecord={schoolRecord}
        />
      )}

      {/* Demo Mode PAA Key Purchase Requirement Modal */}
      {isPaaKeyPromptOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Printer className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black leading-tight">
                    {lang === 'kn' ? 'ಪಾಸ್ ಕೀ (PAA Key) ಅವಶ್ಯಕತೆ ಇದೆ' : 'PAA Key Required to Access Reports'}
                  </h3>
                  <p className="text-[11px] text-red-100 font-medium">
                    {lang === 'kn' ? 'ಡೆಮೊ ಆವೃತ್ತಿ ನಿರ್ಬಂಧ' : 'Demo Mode Restricted Access'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPaaKeyPromptOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-center">
              <div className="w-16 h-16 mx-auto bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center shadow-inner">
                <Award className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-black text-slate-900">
                  {lang === 'kn'
                    ? 'ಅಧಿಕೃತ ವರದಿಗಳನ್ನು ವೀಕ್ಷಿಸಲು ಅಥವಾ ಮುದ್ರಿಸಲು ಪಾಸ್ ಕೀ ಖರೀದಿಸಿ'
                    : 'Purchase PAA Key to View & Print Official Reports'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'kn'
                    ? 'ಡೆಮೊ ಬಳಕೆದಾರರಿಗೆ ವರದಿಗಳ ವೀಕ್ಷಣೆ ಮತ್ತು ಮುದ್ರಣ ಸೌಲಭ್ಯವು ಲಾಕ್ ಆಗಿದೆ. ಎಲ್ಲಾ ತರಗತಿಗಳ ಸಂಕಲನಾ ವರದಿ, ಪ್ರಗತಿ ಪತ್ರ, ಫಲಿತಾಂಶ ಪಟ್ಟಿ ಮತ್ತು ಪ್ರಮಾಣ ಪತ್ರಗಳನ್ನು ಪಡೆಯಲು ಕೇವಲ ₹500 ವಾರ್ಷಿಕ ಪಾಸ್ ಕೀ (PAA Key) ಪಡೆದುಕೊಳ್ಳಿ.'
                    : 'In Demo Mode, report generation and printing are locked. Please purchase the 1-Year School Result Software PAA Pass Key license for ₹500 to unlock all reports, marks cards, and certificates.'}
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900">Annual School License:</span>
                <span className="font-black text-emerald-700 text-base font-mono">₹500 / 1 Year</span>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaaKeyPromptOpen(false);
                    onOpenPaymentModal();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl font-black text-sm shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{lang === 'kn' ? 'ಖರೀದಿಸಿ / ₹500 ಪಾವತಿಸಿ (Purchase PAA Key)' : 'Purchase PAA Key Now (₹500)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaaKeyPromptOpen(false)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  {lang === 'kn' ? 'ಮುಚ್ಚಿ (Close)' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
