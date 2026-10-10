import React, { useState, useMemo } from 'react';
import { SchoolMedium } from '../types';
import { useAuth } from '../context/AuthContext';
import { getStudentsFromLocal } from '../utils/studentStore';
import {
  DEMO_SCHOOL_INFO,
  DemoStudent,
  generateStudentsForMediumAndClass,
  calculateGrade,
  calculateSubjectGrade,
  createDemoStudentFromRealStudent,
} from '../data/demoData';
import {
  getSubjectsForMediumAndClass,
  getMaxMarksForMediumAndClass,
  getSubjectCountForMediumAndClass,
  getExamPatternForClassAndSubject,
} from '../data/subjectConfig';
import {
  School,
  Hash,
  Users,
  Award,
  FileText,
  PieChart,
  Printer,
  Edit,
  Save,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ShoppingCart,
  Filter,
  Search,
  BookOpen,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface DemoDashboardProps {
  onExitDemo: () => void;
  onOpenPaymentModal: () => void;
  initialClass?: number;
}

export const DemoDashboard: React.FC<DemoDashboardProps> = ({
  onExitDemo,
  onOpenPaymentModal,
  initialClass,
}) => {
  const { schoolRecord } = useAuth();
  const diseCode = schoolRecord?.diseCode || '';

  // Primary Control: Medium of School (Drop Down: Kannada, English, Marathi, Urdu)
  const [selectedMedium, setSelectedMedium] = useState<SchoolMedium>(
    schoolRecord?.schoolMedium || 'Kannada'
  );

  // Primary Control: Class Standard (1 to 10)
  const [filterClass, setFilterClass] = useState<number>(initialClass || 5);

  // Other filters
  const [filterGender, setFilterGender] = useState<'ALL' | 'Boy' | 'Girl'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'results' | 'marks' | 'marksCard' | 'students' | 'analysis'
  >('results');

  // Students roster generated dynamically for the selected medium and class
  const [studentRosterMap, setStudentRosterMap] = useState<Record<string, DemoStudent[]>>(() => {
    return {
      [`Kannada_5`]: generateStudentsForMediumAndClass('Kannada', 5),
    };
  });

  // Current active key
  const currentKey = `${selectedMedium}_${filterClass}`;

  // Get or initialize students for this combination
  const students = useMemo(() => {
    if (studentRosterMap[currentKey]) {
      return studentRosterMap[currentKey];
    }
    // Check if enrolled students exist in local store
    if (diseCode) {
      const all = getStudentsFromLocal(diseCode);
      const matched = all.filter((s) => Number(s.classStandard) === filterClass);
      if (matched.length > 0) {
        return matched.map((st, i) => createDemoStudentFromRealStudent(st, selectedMedium, i + 1));
      }
    }
    const fresh = generateStudentsForMediumAndClass(selectedMedium, filterClass);
    return fresh;
  }, [studentRosterMap, currentKey, selectedMedium, filterClass, diseCode]);

  // Selected student for marks card
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const currentStudentForCard = useMemo(() => {
    if (!students || students.length === 0) return null;
    return students.find((s) => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  // Active Subject Configuration for the selected Medium and Class
  const activeSubjectConfigs = useMemo(() => {
    return getSubjectsForMediumAndClass(selectedMedium, filterClass);
  }, [selectedMedium, filterClass]);

  const maxTotalMarks = useMemo(() => {
    return getMaxMarksForMediumAndClass(selectedMedium, filterClass);
  }, [selectedMedium, filterClass]);

  const subjectCount = useMemo(() => {
    return getSubjectCountForMediumAndClass(selectedMedium, filterClass);
  }, [selectedMedium, filterClass]);

  // Selected Subject for Marks Entry Tab
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState<number>(0);

  // Selected Subject Pattern for Marks Entry Tab
  const activeSubjectCode = activeSubjectConfigs[selectedSubjectIdx]?.code || 'FL';
  const currentPattern = useMemo(() => {
    return getExamPatternForClassAndSubject(filterClass, activeSubjectCode);
  }, [filterClass, activeSubjectCode]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const matchesGender = filterGender === 'ALL' || st.gender === filterGender;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        st.name.toLowerCase().includes(query) ||
        st.satsNo.includes(query) ||
        st.rollNo.toString() === query;
      return matchesGender && matchesSearch;
    });
  }, [students, filterGender, searchQuery]);

  // Handle live mark update in Marks Entry Tab according to official pattern limits
  const handleUpdateMark = (
    studentId: string,
    subjectIdx: number,
    field: 'fa1' | 'fa2' | 'sa1' | 'fa3' | 'fa4' | 'sa2',
    rawVal: number
  ) => {
    const targetSubjectCode = activeSubjectConfigs[subjectIdx]?.code || 'FL';
    const pattern = getExamPatternForClassAndSubject(filterClass, targetSubjectCode);

    let maxForField = 10;
    if (field === 'fa1') maxForField = pattern.fa1Max;
    else if (field === 'fa2') maxForField = pattern.fa2Max;
    else if (field === 'sa1') maxForField = pattern.sa1Max;
    else if (field === 'fa3') maxForField = pattern.fa3Max;
    else if (field === 'fa4') maxForField = pattern.fa4Max;
    else if (field === 'sa2') maxForField = pattern.sa2Max;

    const cleanVal = Math.min(maxForField, Math.max(0, isNaN(rawVal) ? 0 : rawVal));

    setStudentRosterMap((prev) => {
      const currentList = prev[currentKey] || generateStudentsForMediumAndClass(selectedMedium, filterClass);

      const updatedList = currentList.map((st) => {
        if (st.id !== studentId) return st;

        const updatedSubjects = st.subjects.map((sub, sIdx) => {
          if (sIdx !== subjectIdx) return sub;

          const updatedSub = { ...sub, [field]: cleanVal };
          updatedSub.total = Number(
            (
              updatedSub.fa1 +
              updatedSub.fa2 +
              updatedSub.sa1 +
              updatedSub.fa3 +
              updatedSub.fa4 +
              updatedSub.sa2
            ).toFixed(1)
          );
          updatedSub.grade = calculateSubjectGrade(updatedSub.total, updatedSub.maxMarks);
          return updatedSub;
        });

        const newTotalMarks = Number(updatedSubjects.reduce((sum, s) => sum + s.total, 0).toFixed(1));
        const newPct = Number(((newTotalMarks / maxTotalMarks) * 100).toFixed(2));
        const newOverallGrade = calculateGrade(newPct);

        return {
          ...st,
          subjects: updatedSubjects,
          totalMarks: newTotalMarks,
          percentage: newPct,
          overallGrade: newOverallGrade,
          resultStatus: (newPct >= 35 ? 'PROMOTED' : 'DETAINED') as 'PROMOTED' | 'ELIGIBLE FOR SUPPLEMENTARY' | 'DETAINED',
        };
      });

      return {
        ...prev,
        [currentKey]: updatedList,
      };
    });
  };

  // Analytics summary
  const totalStudents = filteredStudents.length;
  const boysCount = filteredStudents.filter((s) => s.gender === 'Boy').length;
  const girlsCount = filteredStudents.filter((s) => s.gender === 'Girl').length;
  const passedCount = filteredStudents.filter((s) => s.resultStatus === 'PROMOTED').length;
  const passPercentage =
    totalStudents > 0 ? ((passedCount / totalStudents) * 100).toFixed(1) : '100';

  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 py-4 space-y-4 text-slate-800">
      {/* ========================================================
          TOP BANNER: DEMO CONTROLS & MEDIUM / CLASS SWITCHER
          ======================================================== */}
      <div className="bg-gradient-to-r from-[#003882] via-[#0d47a1] to-[#1565c0] text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-blue-400/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: School & Teacher Identity */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                DEMO / FREE MODE • DSERT CCE ENGINE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-semibold border border-emerald-400/40">
                Classes 1 - 10 Supported
              </span>
              {filterClass >= 9 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 text-xs font-extrabold border border-rose-400/40">
                  Class {filterClass} High School • FL 125 Marks • Total 725 Marks
                </span>
              ) : filterClass <= 5 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/30 text-sky-200 text-xs font-extrabold border border-sky-400/40">
                  Primary Class {filterClass} • (15+15+20) + (15+15+20) = 100m
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200 text-xs font-extrabold border border-teal-400/40">
                  Class {filterClass} • (10+10+30) + (10+10+30) = 100m
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black font-serif text-white tracking-tight">
              {DEMO_SCHOOL_INFO.schoolName}
            </h1>
            <div className="text-xs sm:text-sm text-blue-100 font-medium">
              {DEMO_SCHOOL_INFO.kannadaSchoolName} • By Shri S R Angadi (Science Teacher)
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] sm:text-xs text-blue-200 pt-0.5 font-mono">
              <span className="bg-blue-950/60 px-2 py-0.5 rounded border border-blue-700/50">
                DISE: {DEMO_SCHOOL_INFO.diseCode}
              </span>
              <span>Taluk: {DEMO_SCHOOL_INFO.taluk}</span>
              <span>District: {DEMO_SCHOOL_INFO.district}</span>
              <span>Year: {DEMO_SCHOOL_INFO.academicYear}</span>
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-2.5 self-start lg:self-center shrink-0">
            <button
              onClick={onOpenPaymentModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 fill-white" />
              <span>Buy Pass Key / Pay ₹500</span>
            </button>
            <button
              onClick={onExitDemo}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Exit Demo</span>
            </button>
          </div>
        </div>

        {/* CONTROLS STRIP: MEDIUM OF SCHOOL (DROP DOWN) & CLASS STANDARD (1-10) */}
        <div className="mt-4 pt-3.5 border-t border-blue-400/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* 1. Medium of School Drop Down */}
          <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/20 backdrop-blur-sm">
            <label className="font-extrabold text-amber-300 flex items-center gap-1.5 text-xs">
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>Medium of School:</span>
            </label>
            <select
              value={selectedMedium}
              onChange={(e) => setSelectedMedium(e.target.value as SchoolMedium)}
              className="bg-white text-slate-900 font-extrabold px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer text-xs sm:text-sm shadow-sm"
            >
              <option value="Kannada">Kannada (ಕನ್ನಡ ಮಾಧ್ಯಮ)</option>
              <option value="English">English Medium</option>
              <option value="Marathi">Marathi (ಮರಾಠಿ / मराठी)</option>
              <option value="Urdu">Urdu (ಉರ್ದು / اردو)</option>
            </select>
          </div>

          {/* 2. Class Selector (1 to 10) */}
          <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-xl border border-white/20 backdrop-blur-sm flex-wrap">
            <span className="font-extrabold text-white text-xs pl-1 flex items-center gap-1">
              <GraduationCap className="w-4 h-4 text-blue-200" />
              <span>Class:</span>
            </span>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cls) => {
              const isHigh = cls === 9 || cls === 10;
              const isPrimary = cls <= 5;
              return (
                <button
                  key={cls}
                  onClick={() => {
                    setFilterClass(cls);
                    setSelectedSubjectIdx(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                    filterClass === cls
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md scale-105'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title={`Class ${cls} (${
                    isHigh
                      ? 'High School • FL 125m • Max 725m'
                      : isPrimary
                      ? 'Primary • 4/5 Sub • (15+15+20)x2'
                      : 'Upper Primary • 7 Sub • (10+10+30)x2'
                  })`}
                >
                  {cls}
                </button>
              );
            })}
          </div>

          {/* 3. Subject & Mark Summary Pill */}
          <div className="bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 px-3 py-1.5 rounded-xl font-medium text-xs flex items-center gap-2">
            <span className="font-bold text-white">
              {filterClass <= 5
                ? 'Class 1–5 Primary'
                : filterClass >= 9
                ? 'Class 9–10 High School'
                : 'Class 6–8 Upper Primary'}
              :
            </span>
            <span className="font-black text-amber-300">
              {subjectCount} Subjects • Total {maxTotalMarks} Marks Maximum
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          ACTIVE SUBJECT SPECIFICATION BADGE STRIP
          ======================================================== */}
      <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-slate-800 flex items-center gap-1">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Assigned CCE Subjects ({selectedMedium} Medium • Class {filterClass}):</span>
          </span>
          {activeSubjectConfigs.map((sub, idx) => (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded-md font-bold border font-mono text-[11px] flex items-center gap-1 ${
                sub.code === 'FL' && (filterClass === 9 || filterClass === 10)
                  ? 'bg-amber-100 text-amber-950 border-amber-400 font-black'
                  : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              {sub.prefix && (
                <span className="text-blue-700 font-black">{sub.prefix}:</span>
              )}
              <span>{sub.subjectName}</span>
              <span className="text-slate-500 font-normal">({sub.maxMarks}m)</span>
            </span>
          ))}
        </div>

        {/* Dynamic Pattern Description Badge */}
        <div className="text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
          {filterClass <= 5 ? (
            <span>
              CCE Pattern: <strong className="text-blue-700">(15+15+20) + (15+15+20)</strong> = 100 Marks / Subject
            </span>
          ) : filterClass >= 9 ? (
            <span>
              High School Pattern: <strong className="text-amber-800">FL 125 Marks [(12.5+12.5+37.5)x2]</strong> + 6 Subjects @ 100m = <strong className="text-blue-800">725 Marks</strong>
            </span>
          ) : (
            <span>
              CCE Pattern: <strong className="text-blue-700">(10+10+30) + (10+10+30)</strong> = 100 Marks / Subject = 700 Marks
            </span>
          )}
        </div>
      </div>

      {/* ========================================================
          NAVIGATION TABS (Widescreen Landscape Fit)
          ======================================================== */}
      <div className="bg-white rounded-xl p-1.5 shadow-xs border border-slate-200 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('results')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'results'
              ? 'bg-[#0070f3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>1. Result Broadsheet (ಫಲಿತಾಂಶ ಪಟ್ಟಿ)</span>
        </button>

        <button
          onClick={() => setActiveTab('marks')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'marks'
              ? 'bg-[#0070f3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Edit className="w-4 h-4" />
          <span>2. CCE Marks Entry Matrix (ಅಂಕ ನಮೂದು)</span>
        </button>

        <button
          onClick={() => setActiveTab('marksCard')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'marksCard'
              ? 'bg-[#0070f3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. Marks Card & PDF (ಅಂಕಪಟ್ಟಿ)</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'students'
              ? 'bg-[#0070f3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>4. Student Directory ({filteredStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'analysis'
              ? 'bg-[#0070f3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>5. Gender & Caste Analysis</span>
        </button>
      </div>

      {/* ========================================================
          SEARCH & GENDER FILTER STRIP
          ======================================================== */}
      <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Gender Filter */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Filter Gender:</span>
          {(['ALL', 'Boy', 'Girl'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setFilterGender(g)}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterGender === g
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name or SATS no..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* ========================================================
          TAB 1: OFFICIAL RESULT BROADSHEET (GAZETTE)
          ======================================================== */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Karnataka State Board Annual Result Gazette / Broadsheet
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {selectedMedium} Medium • Class {filterClass} Standard • {subjectCount} CCE Subjects • Maximum Marks: {maxTotalMarks}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-200">
                Pass Rate: {passPercentage}% ({passedCount}/{totalStudents})
              </span>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Gazette</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto p-4 pt-1">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
              <thead className="bg-[#f8fafc] text-slate-700 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Roll</th>
                  <th className="py-2.5 px-3 font-mono">SATS No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-2">Sex</th>
                  <th className="py-2.5 px-2">Caste</th>

                  {/* Dynamic Subjects Header based on Medium & Class */}
                  {activeSubjectConfigs.map((cfg, idx) => (
                    <th key={idx} className="py-2.5 px-2 text-center bg-blue-50/50">
                      <div className="font-extrabold text-blue-950">{cfg.subjectName}</div>
                      <div className="text-[9px] text-slate-500 font-bold font-mono">
                        Max {cfg.maxMarks}
                      </div>
                    </th>
                  ))}

                  <th className="py-2.5 px-3 text-right bg-blue-100/70 text-blue-950 font-black">
                    Total ({maxTotalMarks})
                  </th>
                  <th className="py-2.5 px-2 text-center font-black">%</th>
                  <th className="py-2.5 px-2 text-center">Grade</th>
                  <th className="py-2.5 px-3 text-center">Result</th>
                  <th className="py-2.5 px-2 text-center">Marks Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{st.rollNo}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{st.satsNo}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      <div>{st.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{st.kannadaName}</div>
                    </td>
                    <td className="py-2.5 px-2 font-medium">{st.gender}</td>
                    <td className="py-2.5 px-2 font-mono text-[11px] font-semibold text-slate-700">
                      {st.casteCategory}
                    </td>

                    {/* Dynamic Subjects Marks */}
                    {st.subjects.map((sub, i) => {
                      const passingMarks = sub.maxMarks * 0.35;
                      const isPassing = sub.total >= passingMarks;
                      const isDistinction = sub.total >= sub.maxMarks * 0.8;
                      return (
                        <td key={i} className="py-2.5 px-2 text-center font-mono font-bold">
                          <span
                            className={
                              !isPassing
                                ? 'text-red-600 font-black'
                                : isDistinction
                                ? 'text-emerald-700 font-extrabold'
                                : 'text-slate-800'
                            }
                          >
                            {sub.total}
                          </span>
                        </td>
                      );
                    })}

                    <td className="py-2.5 px-3 text-right font-mono font-black text-blue-900 bg-blue-50/40 text-sm">
                      {st.totalMarks}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">
                      {st.percentage}%
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded font-black font-mono text-[11px] ${
                          st.overallGrade.startsWith('A')
                            ? 'bg-emerald-100 text-emerald-800'
                            : st.overallGrade.startsWith('B')
                            ? 'bg-blue-100 text-blue-800'
                            : st.overallGrade.startsWith('C')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {st.overallGrade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          st.resultStatus === 'PROMOTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {st.resultStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => {
                          setSelectedStudentId(st.id);
                          setActiveTab('marksCard');
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                      >
                        View Card →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: INTERACTIVE CCE MARKS ENTRY MATRIX
          ======================================================== */}
      {activeTab === 'marks' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                CCE Formative & Summative Marks Entry Matrix
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {selectedMedium} Medium • Class {filterClass} •{' '}
                <strong className="text-blue-700">Exam Pattern: {currentPattern.patternLabel}</strong>
              </p>
            </div>

            {/* Subject Selector for editing */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Subject to Edit:</span>
              <select
                value={selectedSubjectIdx}
                onChange={(e) => setSelectedSubjectIdx(Number(e.target.value))}
                className="px-2.5 py-1 text-xs font-extrabold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-slate-900 cursor-pointer"
              >
                {activeSubjectConfigs.map((cfg, idx) => (
                  <option key={idx} value={idx}>
                    {cfg.subjectName} ({cfg.maxMarks}m) - {cfg.kannadaName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
              <thead className="bg-[#f8fafc] text-slate-700 font-extrabold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Roll</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2 px-2 text-center bg-sky-50 text-sky-900">
                    FA1 ({currentPattern.fa1Max})
                  </th>
                  <th className="py-2 px-2 text-center bg-sky-50 text-sky-900">
                    FA2 ({currentPattern.fa2Max})
                  </th>
                  <th className="py-2 px-2 text-center bg-blue-50 text-blue-900">
                    SA1 ({currentPattern.sa1Max})
                  </th>
                  <th className="py-2 px-2 text-center bg-blue-100 font-black text-blue-950">
                    Term 1 ({currentPattern.term1Max})
                  </th>
                  <th className="py-2 px-2 text-center bg-emerald-50 text-emerald-900">
                    FA3 ({currentPattern.fa3Max})
                  </th>
                  <th className="py-2 px-2 text-center bg-emerald-50 text-emerald-900">
                    FA4 ({currentPattern.fa4Max})
                  </th>
                  <th className="py-2 px-2 text-center bg-teal-50 text-teal-900">
                    SA2 ({currentPattern.sa2Max})
                  </th>
                  <th className="py-2 px-2 text-center bg-teal-100 font-black text-teal-950">
                    Term 2 ({currentPattern.term2Max})
                  </th>
                  <th className="py-2 px-3 text-center bg-amber-100 font-black text-amber-950">
                    Grand Total ({currentPattern.totalMax})
                  </th>
                  <th className="py-2 px-2 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => {
                  const sub = st.subjects[selectedSubjectIdx] || st.subjects[0];
                  const term1 = Number((sub.fa1 + sub.fa2 + sub.sa1).toFixed(1));
                  const term2 = Number((sub.fa3 + sub.fa4 + sub.sa2).toFixed(1));

                  return (
                    <tr key={st.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{st.rollNo}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{st.name}</td>

                      {/* FA1 Input */}
                      <td className="py-1 px-1 text-center bg-sky-50/40">
                        <input
                          type="number"
                          step="0.5"
                          min={0}
                          max={currentPattern.fa1Max}
                          value={sub.fa1}
                          onChange={(e) =>
                            handleUpdateMark(st.id, selectedSubjectIdx, 'fa1', parseFloat(e.target.value))
                          }
                          className="w-13 text-center py-1 font-mono font-bold text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
                        />
                      </td>

                      {/* FA2 Input */}
                      <td className="py-1 px-1 text-center bg-sky-50/40">
                        <input
                          type="number"
                          step="0.5"
                          min={0}
                          max={currentPattern.fa2Max}
                          value={sub.fa2}
                          onChange={(e) =>
                            handleUpdateMark(st.id, selectedSubjectIdx, 'fa2', parseFloat(e.target.value))
                          }
                          className="w-13 text-center py-1 font-mono font-bold text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
                        />
                      </td>

                      {/* SA1 Input */}
                      <td className="py-1 px-1 text-center bg-blue-50/40">
                        <input
                          type="number"
                          step="0.5"
                          min={0}
                          max={currentPattern.sa1Max}
                          value={sub.sa1}
                          onChange={(e) =>
                            handleUpdateMark(st.id, selectedSubjectIdx, 'sa1', parseFloat(e.target.value))
                          }
                          className="w-15 text-center py-1 font-mono font-bold text-xs bg-white border border-blue-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none text-blue-900"
                        />
                      </td>

                      <td className="py-2 px-2 text-center font-mono font-extrabold text-blue-950 bg-blue-100/50">
                        {term1}
                      </td>

                      {/* FA3 Input */}
                      <td className="py-1 px-1 text-center bg-emerald-50/40">
                        <input
                          type="number"
                          step="0.5"
                          min={0}
                          max={currentPattern.fa3Max}
                          value={sub.fa3}
                          onChange={(e) =>
                            handleUpdateMark(st.id, selectedSubjectIdx, 'fa3', parseFloat(e.target.value))
                          }
                          className="w-13 text-center py-1 font-mono font-bold text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
                        />
                      </td>

                      {/* FA4 Input */}
                      <td className="py-1 px-1 text-center bg-emerald-50/40">
                        <input
                          type="number"
                          step="0.5"
                          min={0}
                          max={currentPattern.fa4Max}
                          value={sub.fa4}
                          onChange={(e) =>
                            handleUpdateMark(st.id, selectedSubjectIdx, 'fa4', parseFloat(e.target.value))
                          }
                          className="w-13 text-center py-1 font-mono font-bold text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
                        />
                      </td>

                      {/* SA2 Input */}
                      <td className="py-1 px-1 text-center bg-teal-50/40">
                        <input
                          type="number"
                          step="0.5"
                          min={0}
                          max={currentPattern.sa2Max}
                          value={sub.sa2}
                          onChange={(e) =>
                            handleUpdateMark(st.id, selectedSubjectIdx, 'sa2', parseFloat(e.target.value))
                          }
                          className="w-15 text-center py-1 font-mono font-bold text-xs bg-white border border-teal-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none text-teal-900"
                        />
                      </td>

                      <td className="py-2 px-2 text-center font-mono font-extrabold text-teal-950 bg-teal-100/50">
                        {term2}
                      </td>

                      <td className="py-2 px-3 text-center font-mono font-black text-sm text-amber-950 bg-amber-100/60">
                        {sub.total}
                      </td>

                      <td className="py-2 px-2 text-center">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-extrabold">
                          {sub.grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: OFFICIAL MARKS CARD & PRINTABLE PDF VIEW
          ======================================================== */}
      {activeTab === 'marksCard' && currentStudentForCard && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl shadow-xs border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Select Student for Marks Card:</span>
              <select
                value={currentStudentForCard.id}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white cursor-pointer"
              >
                {filteredStudents.map((st) => (
                  <option key={st.id} value={st.id}>
                    Roll {st.rollNo}: {st.name} (SATS: {st.satsNo})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Marks Card (A4 Landscape / Portrait)</span>
            </button>
          </div>

          {/* Printable Official Marks Card */}
          <div className="bg-white rounded-2xl shadow-md border-2 border-slate-300 p-6 sm:p-8 max-w-4xl mx-auto space-y-5 print:border-none print:shadow-none print:p-0">
            {/* School Header */}
            <div className="text-center border-b-2 border-slate-800 pb-3 space-y-1">
              <div className="text-[11px] font-extrabold text-slate-600 uppercase tracking-widest">
                DEPARTMENT OF SCHOOL EDUCATION AND LITERACY, KARNATAKA
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
                {DEMO_SCHOOL_INFO.schoolName}
              </h2>
              <div className="text-sm font-bold text-slate-800 font-serif">
                {DEMO_SCHOOL_INFO.kannadaSchoolName}
              </div>
              <div className="text-xs text-slate-600 font-mono">
                DISE CODE: {DEMO_SCHOOL_INFO.diseCode} • MEDIUM: {selectedMedium.toUpperCase()} MEDIUM • CLASS: {filterClass}
              </div>
              <div className="inline-block mt-1 px-4 py-0.5 bg-slate-900 text-white font-extrabold text-xs rounded-full uppercase tracking-wider">
                CCE PROGRESS REPORT • ACADEMIC YEAR {DEMO_SCHOOL_INFO.academicYear}
              </div>
            </div>

            {/* Student Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Student Name:</span>
                <span className="font-extrabold text-slate-900">{currentStudentForCard.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">SATS ID:</span>
                <span className="font-mono font-bold text-slate-900">{currentStudentForCard.satsNo}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Class & Medium:</span>
                <span className="font-bold text-slate-900">
                  Class {currentStudentForCard.classStandard} • {selectedMedium} Med
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Roll Number:</span>
                <span className="font-mono font-bold text-slate-900">{currentStudentForCard.rollNo}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Father's Name:</span>
                <span className="font-medium text-slate-900">{currentStudentForCard.fatherName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mother's Name:</span>
                <span className="font-medium text-slate-900">{currentStudentForCard.motherName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Caste Category:</span>
                <span className="font-bold text-slate-900">{currentStudentForCard.casteCategory}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Attendance:</span>
                <span className="font-mono font-bold text-slate-900">
                  {currentStudentForCard.attendanceDays} / {currentStudentForCard.totalWorkingDays} Days (
                  {((currentStudentForCard.attendanceDays / currentStudentForCard.totalWorkingDays) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* Assessment Details Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-extrabold uppercase text-[10px]">
                  <tr className="border-b border-slate-300">
                    <th className="border border-slate-300 p-2 text-center">Sl</th>
                    <th className="border border-slate-300 p-2">Subject / ವಿಷಯ</th>
                    <th className="border border-slate-300 p-1 text-center">
                      {filterClass <= 5 ? 'FA1 (15)' : filterClass >= 9 ? 'FA1 (10/12.5*)' : 'FA1 (10)'}
                    </th>
                    <th className="border border-slate-300 p-1 text-center">
                      {filterClass <= 5 ? 'FA2 (15)' : filterClass >= 9 ? 'FA2 (10/12.5*)' : 'FA2 (10)'}
                    </th>
                    <th className="border border-slate-300 p-1 text-center">
                      {filterClass <= 5 ? 'SA1 (20)' : filterClass >= 9 ? 'SA1 (30/37.5*)' : 'SA1 (30)'}
                    </th>
                    <th className="border border-slate-300 p-1 text-center bg-blue-50/50">
                      {filterClass <= 5 ? 'T1 (50)' : filterClass >= 9 ? 'T1 (50/62.5*)' : 'T1 (50)'}
                    </th>
                    <th className="border border-slate-300 p-1 text-center">
                      {filterClass <= 5 ? 'FA3 (15)' : filterClass >= 9 ? 'FA3 (10/12.5*)' : 'FA3 (10)'}
                    </th>
                    <th className="border border-slate-300 p-1 text-center">
                      {filterClass <= 5 ? 'FA4 (15)' : filterClass >= 9 ? 'FA4 (10/12.5*)' : 'FA4 (10)'}
                    </th>
                    <th className="border border-slate-300 p-1 text-center">
                      {filterClass <= 5 ? 'SA2 (20)' : filterClass >= 9 ? 'SA2 (30/37.5*)' : 'SA2 (30)'}
                    </th>
                    <th className="border border-slate-300 p-1 text-center bg-teal-50/50">
                      {filterClass <= 5 ? 'T2 (50)' : filterClass >= 9 ? 'T2 (50/62.5*)' : 'T2 (50)'}
                    </th>
                    <th className="border border-slate-300 p-2 text-center bg-amber-50">
                      {filterClass >= 9 ? 'Total (Max*)' : 'Total (100)'}
                    </th>
                    <th className="border border-slate-300 p-1 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudentForCard.subjects.map((sub, i) => {
                    const t1 = Number((sub.fa1 + sub.fa2 + sub.sa1).toFixed(1));
                    const t2 = Number((sub.fa3 + sub.fa4 + sub.sa2).toFixed(1));
                    return (
                      <tr key={i} className="border-b border-slate-200">
                        <td className="border border-slate-300 p-2 text-center font-mono font-bold">{i + 1}</td>
                        <td className="border border-slate-300 p-2 font-bold text-slate-900">
                          {sub.subjectName}{' '}
                          <span className="font-normal text-slate-500 text-[10px]">({sub.kannadaName})</span>
                          {sub.maxMarks === 125 && (
                            <span className="ml-1 px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-mono text-[9px] font-black">
                              125m
                            </span>
                          )}
                        </td>
                        <td className="border border-slate-300 p-1 text-center font-mono">{sub.fa1}</td>
                        <td className="border border-slate-300 p-1 text-center font-mono">{sub.fa2}</td>
                        <td className="border border-slate-300 p-1 text-center font-mono">{sub.sa1}</td>
                        <td className="border border-slate-300 p-1 text-center font-mono font-bold bg-blue-50/50">{t1}</td>
                        <td className="border border-slate-300 p-1 text-center font-mono">{sub.fa3}</td>
                        <td className="border border-slate-300 p-1 text-center font-mono">{sub.fa4}</td>
                        <td className="border border-slate-300 p-1 text-center font-mono">{sub.sa2}</td>
                        <td className="border border-slate-300 p-1 text-center font-mono font-bold bg-teal-50/50">{t2}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-black bg-amber-50 text-amber-950">
                          {sub.total} <span className="text-[10px] text-slate-400 font-normal">/{sub.maxMarks}</span>
                        </td>
                        <td className="border border-slate-300 p-1 text-center font-mono font-extrabold">
                          {sub.grade}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-100 font-extrabold text-slate-900 text-xs">
                    <td colSpan={10} className="border border-slate-300 p-2.5 text-right uppercase tracking-wider">
                      Grand Total Marks & Percentage:
                    </td>
                    <td className="border border-slate-300 p-2.5 text-center font-mono text-sm text-blue-950 bg-blue-100 font-black">
                      {currentStudentForCard.totalMarks} / {maxTotalMarks}
                    </td>
                    <td className="border border-slate-300 p-2.5 text-center font-mono text-sm text-emerald-800 font-black">
                      {currentStudentForCard.overallGrade} ({currentStudentForCard.percentage}%)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Note for High School */}
            {filterClass >= 9 && (
              <p className="text-[11px] text-slate-500 italic">
                * Note: For Class {filterClass}, First Language ({currentStudentForCard.subjects[0]?.subjectName}) carries 125 marks. Maximum grand total marks is 725.
              </p>
            )}

            {/* Promotion Declaration */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Final Result & Promotion Status:</span>
                <span className="text-base font-black text-emerald-900">
                  {currentStudentForCard.resultStatus} {currentStudentForCard.classStandard < 10 ? `TO CLASS ${currentStudentForCard.classStandard + 1}` : 'SSLC BOARD QUALIFIED'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Overall Cumulative Performance:</span>
                <span className="text-base font-black text-slate-900">
                  GRADE {currentStudentForCard.overallGrade} ({currentStudentForCard.percentage}%)
                </span>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs font-bold text-slate-700">
              <div className="border-t border-slate-400 pt-1.5">Class Teacher Signature</div>
              <div className="border-t border-slate-400 pt-1.5">Parent / Guardian Signature</div>
              <div className="border-t border-slate-400 pt-1.5 text-slate-900">
                Headmaster Seal & Signature
                <div className="text-[10px] text-slate-500 font-normal">Govt KHPS Ningyanatti</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: STUDENT DIRECTORY
          ======================================================== */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base">
              Class {filterClass} Enrolled Student Database ({selectedMedium} Medium)
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Total Enrolled: {filteredStudents.length} Students
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
              <thead className="bg-[#f8fafc] text-slate-700 font-extrabold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Roll</th>
                  <th className="py-2.5 px-3">SATS Number</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Father Name</th>
                  <th className="py-2.5 px-3">Mother Name</th>
                  <th className="py-2.5 px-2">Sex</th>
                  <th className="py-2.5 px-2">Caste</th>
                  <th className="py-2.5 px-2">Class</th>
                  <th className="py-2.5 px-3 text-right">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{st.rollNo}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{st.satsNo}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{st.name}</td>
                    <td className="py-2.5 px-3 text-slate-700">{st.fatherName}</td>
                    <td className="py-2.5 px-3 text-slate-700">{st.motherName}</td>
                    <td className="py-2.5 px-2 font-medium">{st.gender}</td>
                    <td className="py-2.5 px-2 font-mono text-[11px]">{st.casteCategory}</td>
                    <td className="py-2.5 px-2 font-bold font-mono">Class {st.classStandard}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {st.attendanceDays}/{st.totalWorkingDays}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: GENDER & CASTE ANALYSIS
          ======================================================== */}
      {activeTab === 'analysis' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Students Card */}
            <div data-chart="true" className="chart-card bg-white p-5 rounded-2xl shadow-sm border border-slate-200 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-blue-400 hover:brightness-[1.02]">
              <span className="text-xs font-bold text-slate-400 uppercase">Class Enrollment</span>
              <div className="text-3xl font-black text-slate-900 mt-1">{totalStudents}</div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span className="text-blue-700 font-bold">Boys: {boysCount}</span>
                <span className="text-pink-700 font-bold">Girls: {girlsCount}</span>
              </div>
            </div>

            {/* Pass Rate Card */}
            <div data-chart="true" className="chart-card bg-white p-5 rounded-2xl shadow-sm border border-emerald-200 bg-emerald-50/20 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-emerald-400 hover:brightness-[1.02]">
              <span className="text-xs font-bold text-emerald-700 uppercase">Overall Pass Rate</span>
              <div className="text-3xl font-black text-emerald-900 mt-1">{passPercentage}%</div>
              <div className="text-xs text-emerald-700 mt-1">
                {passedCount} Promoted of {totalStudents} Students
              </div>
            </div>

            {/* Total Marks & Subjects Card */}
            <div data-chart="true" className="chart-card bg-white p-5 rounded-2xl shadow-sm border border-slate-200 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-blue-400 hover:brightness-[1.02]">
              <span className="text-xs font-bold text-slate-400 uppercase">Evaluation Scheme</span>
              <div className="text-2xl font-black text-blue-900 mt-1">{maxTotalMarks} Marks Max</div>
              <div className="text-xs text-slate-500 mt-1">
                {subjectCount} Subjects • {selectedMedium} Medium
              </div>
            </div>
          </div>

          {/* Social Category Breakdown */}
          <div data-chart="true" className="chart-card bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-blue-400 hover:brightness-[1.02]">
            <h4 className="font-extrabold text-slate-900 text-sm">
              Social Category (Caste) Performance Breakdown
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {['SC', 'ST', 'Cat-1', '2A', '2B', '3A', '3B', 'GM'].map((cat) => {
                const count = filteredStudents.filter((s) => s.casteCategory === cat).length;
                return (
                  <div key={cat} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-blue-300 hover:brightness-105">
                    <span className="text-xs font-bold text-slate-500">{cat}</span>
                    <div className="text-lg font-black text-slate-900 mt-0.5">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
