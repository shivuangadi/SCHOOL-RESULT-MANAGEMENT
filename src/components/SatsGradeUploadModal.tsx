import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Student, SchoolRecord, StudentExamMarks, formatClassStd, formatClassOrdinal } from '../types';
import {
  computeStudentCceDetails,
  generateDefaultPrimaryMarks,
  extractLastWordOfSchoolName,
} from '../utils/primaryCceHelper';
import {
  computeHpStudentCce,
  getHpExamGrade,
} from '../utils/higherPrimaryCceHelper';
import {
  loadSchoolMarks,
  subscribeSchoolMarks,
} from '../utils/marksStore';
import {
  executeReportPrint,
  downloadElementAsPdf,
  shareReportToWhatsApp,
  downloadElementAsHtml,
  ReportPaperSize,
} from '../utils/printPdfHelper';
import { getSavedClassTeacher } from '../utils/teacherHelper';
import * as XLSX from 'xlsx';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Share2,
  X,
  FileCode,
  Award,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export type SatsExamType = 'FA-1' | 'FA-2' | 'SA-1' | 'FA-3' | 'FA-4' | 'SA-2' | 'TOTAL';

export const SATS_EXAM_OPTIONS: { key: SatsExamType; labelEn: string; labelKn: string; tabName: string }[] = [
  { key: 'FA-1', labelEn: 'FA-1', labelKn: 'ರೂಪಣಾತ್ಮಕ-೧ (FA1)', tabName: 'FA-1' },
  { key: 'FA-2', labelEn: 'FA-2', labelKn: 'ರೂಪಣಾತ್ಮಕ-೨ (FA2)', tabName: 'FA-2' },
  { key: 'SA-1', labelEn: 'SA-1', labelKn: 'ಸಂಕಲನಾತ್ಮಕ-೧ (SA1)', tabName: 'SA-1' },
  { key: 'FA-3', labelEn: 'FA-3', labelKn: 'ರೂಪಣಾತ್ಮಕ-೩ (FA3)', tabName: 'FA-3' },
  { key: 'FA-4', labelEn: 'FA-4', labelKn: 'ರೂಪಣಾತ್ಮಕ-೪ (FA4)', tabName: 'FA-4' },
  { key: 'SA-2', labelEn: 'SA-2', labelKn: 'ಸಂಕಲನಾತ್ಮಕ-೨ (SA2)', tabName: 'SA-2' },
  { key: 'TOTAL', labelEn: 'ANNUAL RESULT', labelKn: 'ವಾರ್ಷಿಕ ಫಲಿತಾಂಶ (Annual)', tabName: 'ANNUAL_TOTAL' },
];

export interface SatsSubjectConfig {
  code: string;
  nameEn: string;
  nameKn: string;
}

export interface SatsGradeUploadContentProps {
  students: Student[];
  schoolRecord: SchoolRecord | null;
  academicYear?: string;
  initialClass?: string;
  initialExam?: SatsExamType;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export interface SatsGradeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolRecord: SchoolRecord | null;
  academicYear?: string;
  initialClass?: string;
  initialExam?: SatsExamType;
}

type SatsSortField = 'index' | 'name' | 'satsNo' | 'gender';

export const SatsGradeUploadContent: React.FC<SatsGradeUploadContentProps> = ({
  students,
  schoolRecord,
  academicYear = '2026-27',
  initialClass = '1',
  initialExam = 'FA-1',
  onClose,
  isEmbedded = false,
}) => {
  const diseCode = schoolRecord?.diseCode || '00000000000';
  const schoolName = schoolRecord?.schoolName || 'ಸರ್ಕಾರಿ ಶಾಲೆ';
  const medium = schoolRecord?.schoolMedium || 'Kannada';
  const talukName = schoolRecord?.taluk || 'ಬೆಳಗಾವಿ ಗ್ರಾಮೀಣ';
  const clusterName = schoolRecord?.cluster || schoolRecord?.crcCluster || 'ನಿಂಗ್ಯಾನಟ್ಟಿ';
  const placeName = extractLastWordOfSchoolName(schoolName);

  // Available classes in this school (Classes 1 to 8)
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>(['1', '2', '3', '4', '5', '6', '7', '8']);
    students.forEach((s) => {
      if (s.classStandard) classSet.add(String(s.classStandard));
    });
    return Array.from(classSet)
      .map((c) => parseInt(c, 10))
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b)
      .map(String);
  }, [students]);

  // Selected Class & Selected Exam
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (availableClasses.includes(initialClass)) return initialClass;
    return availableClasses[0] || '1';
  });

  const [selectedExam, setSelectedExam] = useState<SatsExamType>(initialExam);
  const [paperSize, setPaperSize] = useState<ReportPaperSize>('legal');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<SatsSortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Real-time marks state
  const [marksMap, setMarksMap] = useState<Record<string, StudentExamMarks>>({});
  const reportRef = useRef<HTMLDivElement | null>(null);

  // Class teacher
  const classTeacherName = getSavedClassTeacher(schoolRecord, selectedClass);

  // Load marks
  useEffect(() => {
    if (!diseCode || diseCode === '00000000000') return;
    loadSchoolMarks(diseCode, diseCode, academicYear).then((loaded) => {
      setMarksMap(loaded || {});
    });

    const unsub = subscribeSchoolMarks(
      diseCode,
      (updated) => {
        setMarksMap((prev) => ({ ...prev, ...updated }));
      },
      academicYear
    );

    return () => unsub();
  }, [diseCode, academicYear]);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Determine subjects based on class (1-5 vs 6-8) and medium (Kannada vs English)
  const currentSubjects: SatsSubjectConfig[] = useMemo(() => {
    const classNum = parseInt(selectedClass, 10);
    const isHigher = classNum >= 6;
    const isEng = medium.toLowerCase().includes('english');

    if (isHigher) {
      // 6-8th Standard Subjects: FL, SL, TL, Math, Science, Social Science
      if (isEng) {
        return [
          { code: 'FL', nameEn: 'First Language (English)', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ (English)' },
          { code: 'SL', nameEn: 'Second Language (Kannada)', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ (ಕನ್ನಡ)' },
          { code: 'TL', nameEn: 'Third Language (Hindi)', nameKn: 'ತೃತೀಯ ಭಾಷೆ (ಹಿಂದಿ)' },
          { code: 'MATHS', nameEn: 'Mathematics', nameKn: 'ಗಣಿತ' },
          { code: 'SCIENCE', nameEn: 'Science', nameKn: 'ವಿಜ್ಞಾನ' },
          { code: 'SOCIAL', nameEn: 'Social Science', nameKn: 'ಸಮಾಜ ವಿಜ್ಞಾನ' },
        ];
      }
      return [
        { code: 'FL', nameEn: 'First Language (Kannada)', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ (ಕನ್ನಡ)' },
        { code: 'SL', nameEn: 'Second Language (English)', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ (ಇಂಗ್ಲಿಷ್)' },
        { code: 'TL', nameEn: 'Third Language (Hindi)', nameKn: 'ತೃತೀಯ ಭಾಷೆ (ಹಿಂದಿ)' },
        { code: 'MATHS', nameEn: 'Mathematics', nameKn: 'ಗಣಿತ' },
        { code: 'SCIENCE', nameEn: 'Science', nameKn: 'ವಿಜ್ಞಾನ' },
        { code: 'SOCIAL', nameEn: 'Social Science', nameKn: 'ಸಮಾಜ ವಿಜ್ಞಾನ' },
      ];
    }

    // 1-5th Standard Primary Subjects: FL, SL, Mathematics, EVS
    if (isEng) {
      return [
        { code: 'FL', nameEn: 'First Language (English)', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ (English)' },
        { code: 'SL', nameEn: 'Second Language (Kannada)', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ (ಕನ್ನಡ)' },
        { code: 'MATHS', nameEn: 'Mathematics', nameKn: 'ಗಣಿತ (Mathematics)' },
        { code: 'EVS', nameEn: 'Environmental Studies (EVS)', nameKn: 'ಪರಿಸರ ಅಧ್ಯಯನ (EVS)' },
      ];
    }
    return [
      { code: 'FL', nameEn: 'First Language (Kannada)', nameKn: 'ಪ್ರಥಮ ಭಾಷೆ (ಕನ್ನಡ)' },
      { code: 'SL', nameEn: 'Second Language (English)', nameKn: 'ದ್ವಿತೀಯ ಭಾಷೆ (ಇಂಗ್ಲಿಷ್)' },
      { code: 'MATHS', nameEn: 'Mathematics', nameKn: 'ಗಣಿತ' },
      { code: 'EVS', nameEn: 'Environmental Studies', nameKn: 'ಪರಿಸರ ಅಧ್ಯಯನ' },
    ];
  }, [selectedClass, medium]);

  // Extract Grade for a student given an exam and subject code
  const getGradeForExamAndSubject = (
    student: Student,
    subCode: string,
    exam: SatsExamType
  ): string => {
    const classNum = parseInt(selectedClass, 10);
    const m = marksMap[student.id];

    if (classNum >= 6) {
      // 6-8 Higher Primary computation
      const computedHp = computeHpStudentCce(student, medium, m);
      const isExempt = computedHp.isExempted;
      const subMark = (computedHp.subjects as any)[subCode];
      return getHpExamGrade(subMark, isExempt, exam);
    }

    // 1-5 Primary computation
    const primaryMarks = m || generateDefaultPrimaryMarks(student);
    const computed = computeStudentCceDetails(student, primaryMarks);
    const isExempt = computed.isExempted;
    if (isExempt) return 'Exempt';

    const sub = computed.subjects[subCode as keyof typeof computed.subjects];
    if (!sub) return '-';

    switch (exam) {
      case 'FA-1':
        return sub.fa1_grade || '-';
      case 'FA-2':
        return sub.fa2_grade || '-';
      case 'SA-1':
        return sub.sa1_grade || '-';
      case 'FA-3':
        return sub.fa3_grade || '-';
      case 'FA-4':
        return sub.fa4_grade || '-';
      case 'SA-2':
        return sub.sa2_grade || '-';
      case 'TOTAL':
      default:
        return sub.grade || '-';
    }
  };

  // STRICT REQUIREMENT: Only actual students of that class, exactly that many rows (no blanks!)
  const rawClassStudents = useMemo(() => {
    return students.filter((s) => String(s.classStandard) === String(selectedClass));
  }, [students, selectedClass]);

  // Sorted students list
  const sortedStudents = useMemo(() => {
    const list = [...rawClassStudents];
    list.sort((a, b) => {
      let res = 0;
      if (sortField === 'name') {
        res = (a.studentName || '').localeCompare(b.studentName || '');
      } else if (sortField === 'satsNo') {
        res = (a.satsNo || '').localeCompare(b.satsNo || '');
      } else if (sortField === 'gender') {
        res = (a.gender || '').localeCompare(b.gender || '');
      } else {
        res = 0;
      }
      return sortDir === 'asc' ? res : -res;
    });
    return list;
  }, [rawClassStudents, sortField, sortDir]);

  const handleSort = (field: SatsSortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const renderSortIcon = (field: SatsSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 inline-block ml-1 opacity-40 print:hidden" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 inline-block ml-1 text-red-600 print:hidden" />
    ) : (
      <ArrowDown className="w-3 h-3 inline-block ml-1 text-red-600 print:hidden" />
    );
  };

  const currentExamObj = SATS_EXAM_OPTIONS.find((e) => e.key === selectedExam) || SATS_EXAM_OPTIONS[0];

  // -------------------------------------------------------------------------
  // EXCEL EXPORT 1: Current Selected Exam
  // -------------------------------------------------------------------------
  const handleExportSingleExamExcel = () => {
    try {
      showStatus(`📊 ${currentExamObj.labelEn} Excel ಡೌನ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ...`);

      const headers = [
        'Sl No',
        'SATS No',
        'Student Name (ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು)',
        'Gender (ಲಿಂಗ)',
        ...currentSubjects.map((s) => `${s.nameKn} (${s.code})`),
      ];

      const rows = sortedStudents.map((st, idx) => [
        idx + 1,
        st.satsNo || '-',
        st.studentName,
        st.gender === 'Boy' ? 'Boy (ಗಂಡು)' : st.gender === 'Girl' ? 'Girl (ಹೆಣ್ಣು)' : '-',
        ...currentSubjects.map((sub) => getGradeForExamAndSubject(st, sub.code, selectedExam)),
      ]);

      const wsData = [
        [schoolName.toUpperCase()],
        [`DISE CODE: ${diseCode} | CLUSTER: ${clusterName} | TALUK: ${talukName} | ACADEMIC YEAR: ${academicYear}`],
        [`CLASS: ${formatClassStd(selectedClass)} (${medium} Medium) | EXAM: ${currentExamObj.labelEn} - ${currentExamObj.labelKn}`],
        [`TOTAL STUDENTS: ${sortedStudents.length} (NO BLANK ROWS) | GENERATED FOR KARNATAKA SATS PORTAL`],
        [], // spacing
        headers,
        ...rows,
        [],
        ['', '', 'Class Teacher Sign: ' + (classTeacherName || '________________'), '', 'Head Master Sign & Seal: ________________'],
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, currentExamObj.tabName);

      const filename = `SATS_Grade_Class_${selectedClass}_${currentExamObj.tabName}_${academicYear}.xlsx`;
      XLSX.writeFile(wb, filename);
      showStatus('✅ Excel ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!');
    } catch (err) {
      console.error(err);
      showStatus('⚠️ Excel ಡೌನ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ.');
    }
  };

  // -------------------------------------------------------------------------
  // EXCEL EXPORT 2: ALL EXAMS IN ONE EXCEL IN DIFFERENT TABS (REQUESTED FEATURE)
  // "and a classes all exam report can be downloaded in a same excel in different tabs exam names should be given to tabs"
  // "how many students are there in the class that many number of rows be shown no blank or extra rows are required"
  // -------------------------------------------------------------------------
  const handleExportAllExamsMultiTabExcel = () => {
    try {
      showStatus('📊 ಎಲ್ಲಾ ಪರೀಕ್ಷೆಗಳ ಎಕ್ಸೆಲ್ (7 Tabs) ಡೌನ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ...');

      const wb = XLSX.utils.book_new();

      SATS_EXAM_OPTIONS.forEach((exam) => {
        const headers = [
          'Sl No',
          'SATS No',
          'Student Name (ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು)',
          'Gender (ಲಿಂಗ)',
          ...currentSubjects.map((s) => `${s.nameKn} (${s.code})`),
        ];

        // STRICTLY: Exact number of students in that class, zero blank rows!
        const rows = sortedStudents.map((st, idx) => [
          idx + 1,
          st.satsNo || '-',
          st.studentName,
          st.gender === 'Boy' ? 'Boy (ಗಂಡು)' : st.gender === 'Girl' ? 'Girl (ಹೆಣ್ಣು)' : '-',
          ...currentSubjects.map((sub) => getGradeForExamAndSubject(st, sub.code, exam.key)),
        ]);

        const wsData = [
          [schoolName.toUpperCase()],
          [`DISE CODE: ${diseCode} | CLUSTER: ${clusterName} | TALUK: ${talukName} | ACADEMIC YEAR: ${academicYear}`],
          [`CLASS: ${formatClassStd(selectedClass)} (${medium} Medium) | EXAM: ${exam.labelEn} - ${exam.labelKn}`],
          [`TOTAL STUDENTS: ${sortedStudents.length} (STRICTLY NO BLANK ROWS) | SATS GRADE UPLOAD FORMAT`],
          [], // separator
          headers,
          ...rows,
          [],
          ['', '', 'Class Teacher Sign: ' + (classTeacherName || '________________'), '', 'Head Master Sign & Seal: ________________'],
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Adjust column widths for clean readability
        ws['!cols'] = [
          { wch: 8 },  // Sl No
          { wch: 16 }, // SATS No
          { wch: 28 }, // Student Name
          { wch: 14 }, // Gender
          ...currentSubjects.map(() => ({ wch: 18 })),
        ];

        XLSX.utils.book_append_sheet(wb, ws, exam.tabName);
      });

      const filename = `SATS_Grades_Class_${selectedClass}_ALL_EXAMS_${academicYear}.xlsx`;
      XLSX.writeFile(wb, filename);
      showStatus('✅ ಎಲ್ಲಾ ಪರೀಕ್ಷೆಗಳ Multi-Tab Excel ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!');
    } catch (err) {
      console.error(err);
      showStatus('⚠️ Multi-Tab Excel ಡೌನ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ.');
    }
  };

  // PDF Download
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    showStatus('📄 PDF ಡೌನ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ...');
    const filename = `SATS_Grade_Report_Class_${selectedClass}_${currentExamObj.tabName}_${academicYear}.pdf`;
    const ok = await downloadElementAsPdf(reportRef.current, filename, paperSize);
    if (ok) showStatus('✅ PDF ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!');
    else showStatus('⚠️ ಮುದ್ರಣ ವಿಂಡೋದಲ್ಲಿ "Save as PDF" ಆಯ್ಕೆಮಾಡಿ.');
  };

  // Print
  const handlePrint = async () => {
    if (!reportRef.current) return;
    showStatus('🖨️ ಮುದ್ರಣ ವಿಂಡೋ ತೆರೆಯಲಾಗುತ್ತಿದೆ...');
    await executeReportPrint(
      reportRef.current,
      `SATS Grade Report - Class ${selectedClass} - ${currentExamObj.labelEn}`,
      paperSize
    );
  };

  // WhatsApp Share
  const handleWhatsAppShare = async () => {
    if (!reportRef.current) return;
    showStatus('📱 WhatsApp ಫೋಟೋ ತಯಾರಿಸಲಾಗುತ್ತಿದೆ...');
    const summary = `*SATS GRADE ENTRY REPORT*\n🏫 ${schoolName}\nDISE: ${diseCode}\nತರಗತಿ: Class ${formatClassOrdinal(selectedClass)} (${medium} Medium)\nಪರೀಕ್ಷೆ: ${currentExamObj.labelEn} (${currentExamObj.labelKn})\nದಾಖಲಾತಿ: ${sortedStudents.length} Students\nಶೈಕ್ಷಣಿಕ ಸಾಲು: ${academicYear}`;
    await shareReportToWhatsApp(
      reportRef.current,
      summary,
      `SATS_Grade_Class_${selectedClass}_${currentExamObj.tabName}`
    );
    showStatus('✅ WhatsApp ಹಂಚಿಕೆ ಯಶಸ್ವಿಯಾಗಿದೆ!');
  };

  // HTML Download
  const handleDownloadHtml = () => {
    if (!reportRef.current) return;
    const filename = `SATS_Grade_Report_Class_${selectedClass}_${currentExamObj.tabName}.html`;
    downloadElementAsHtml(
      reportRef.current,
      filename,
      paperSize
    );
    showStatus('✅ HTML ಫೈಲ್ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!');
  };

  return (
    <div className={isEmbedded ? "w-full flex flex-col overflow-hidden bg-slate-100 rounded-2xl border border-slate-300" : "flex flex-col h-full w-full overflow-hidden"}>
      {/* Top Header */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white p-3 sm:p-4 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-amber-700/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl font-black shadow-md">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-amber-300 tracking-wide">
                SATS ಗ್ರೇಡ್ ನಮೂನೆ (SATS Grade Upload Portal Format)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
                {medium} Medium • Classes 1–{availableClasses[availableClasses.length - 1] || '8'}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              ಕರ್ನಾಟಕ SATS ಪೋರ್ಟಲ್‌ಗೆ ಫಲಿತಾಂಶ ಗ್ರೇಡ್ ದಾಖಲಿಸಲು ಅಧಿಕೃತ ನಮೂನೆ • ಕೇವಲ ಗ್ರೇಡ್‌ಗಳು ಮಾತ್ರ
            </p>
          </div>
        </div>

        {onClose && !isEmbedded && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Close window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

        {/* Action Ribbon & Controls */}
        <div className="bg-white border-b border-slate-300 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
          {/* Left: Class Dropdown + Exam Dropdown */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Class Dropdown */}
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-950 px-2.5 py-1 rounded-xl">
              <span className="font-black text-emerald-900">ತರಗತಿ (Class):</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-white text-emerald-950 font-black px-2 py-0.5 rounded-lg border border-emerald-400 focus:outline-none cursor-pointer"
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}ನೇ ತರಗತಿ (Class {cls})
                  </option>
                ))}
              </select>
            </div>

            {/* Exam Dropdown */}
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-300 text-blue-950 px-2.5 py-1 rounded-xl">
              <span className="font-black text-blue-900">ಪರೀಕ್ಷೆ (Exam):</span>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value as SatsExamType)}
                className="bg-white text-blue-950 font-black px-2 py-0.5 rounded-lg border border-blue-400 focus:outline-none cursor-pointer"
              >
                {SATS_EXAM_OPTIONS.map((ex) => (
                  <option key={ex.key} value={ex.key}>
                    {ex.labelEn} - {ex.labelKn}
                  </option>
                ))}
              </select>
            </div>

            {/* Paper Size selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 text-slate-800 px-2.5 py-1 rounded-xl">
              <span className="font-bold">ಹಾಳೆಯ ಗಾತ್ರ:</span>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as ReportPaperSize)}
                className="bg-white text-slate-900 font-bold px-2 py-0.5 rounded-lg border border-slate-300 focus:outline-none cursor-pointer text-xs"
              >
                <option value="legal">Legal Size (340mm × 210mm)</option>
                <option value="a4">A4 Size (295mm × 210mm)</option>
              </select>
            </div>

            {/* Total count badge */}
            <span className="px-2.5 py-1 bg-slate-900 text-amber-300 font-mono font-black rounded-xl text-xs shadow-xs">
              ವಿದ್ಯಾರ್ಥಿಗಳು: {sortedStudents.length} (No Blanks)
            </span>
          </div>

          {/* Right: Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Multi-Tab All Exams Excel Export */}
            <button
              type="button"
              onClick={handleExportAllExamsMultiTabExcel}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer ring-2 ring-emerald-400/50"
              title="Download all exams (FA1 to SA2 + Total) in a single Excel file with 7 separate tabs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
              <span>ಎಲ್ಲಾ ಪರೀಕ್ಷೆಗಳ ಎಕ್ಸೆಲ್ (All Exams • 7 Tabs)</span>
            </button>

            {/* Single Exam Excel Export */}
            <button
              type="button"
              onClick={handleExportSingleExamExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
              title="Download selected exam Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{currentExamObj.labelEn} Excel</span>
            </button>

            {/* PDF Export */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF ಡೌನ್‌ಲೋಡ್</span>
            </button>

            {/* HTML Download */}
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
              title="Save HTML file"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-300" />
              <span>HTML</span>
            </button>

            {/* WhatsApp Share */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
              title="Share photo to WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-950 hover:bg-blue-900 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              title="Open Print Window"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print (ಮುದ್ರಿಸಿ)</span>
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="bg-amber-100 text-amber-950 border-b border-amber-300 px-4 py-1.5 text-xs font-bold text-center shrink-0">
            {statusMessage}
          </div>
        )}

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200 flex justify-center">
          <div
            ref={reportRef}
            className="bg-white p-6 sm:p-8 rounded-xl border-[3.5px] border-[#c2410c] shadow-xl space-y-4 w-full max-w-[960px] text-slate-900 legal-portrait print:p-2 print:border-[3.5px] print:shadow-none print:max-w-none print:w-full"
            style={{ minHeight: '297mm' }}
          >
            {/* Header matching Karnataka Official SATS Report Format (Red Heading & Complete Details) */}
            <div className="text-center pt-1 pb-1 space-y-1">
              <h1 className="text-base sm:text-xl font-black text-red-600 tracking-wide font-serif uppercase">
                {schoolName}
              </h1>
              <div className="text-xs font-bold text-slate-800 flex flex-wrap items-center justify-center gap-2">
                <span>DISE NO: <strong className="font-mono text-slate-950 font-black">{diseCode}</strong></span>
                <span>•</span>
                <span>ಕ್ಲಸ್ಟರ್: <strong>{clusterName}</strong></span>
                <span>•</span>
                <span>ತಾಲೂಕು: <strong>{talukName}</strong></span>
                <span>•</span>
                <span>CLASS: <strong className="text-emerald-700 font-black">{formatClassStd(selectedClass)}</strong></span>
                <span>•</span>
                <span>EXAM TYPE: <strong className="text-blue-700 font-black">{currentExamObj.labelEn} ({currentExamObj.labelKn})</strong></span>
                <span>•</span>
                <span>YEAR: <strong className="text-slate-900 font-black">{academicYear}</strong></span>
              </div>
            </div>

            {/* Sub-Header Row: Class, Exam, Academic Year */}
            <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm font-bold px-2 pb-1 gap-2 border-b-2 border-slate-900">
              <div className="flex items-center gap-1.5 text-emerald-800">
                <span className="font-black">Class:</span>
                <span className="font-black text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                  {formatClassOrdinal(selectedClass)} Standard ({medium} Medium)
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-blue-900">
                <span className="font-black">Selected Exam:</span>
                <span className="font-black text-blue-950 bg-blue-50 px-2 py-0.5 rounded border border-blue-300">
                  {currentExamObj.labelEn} - {currentExamObj.labelKn}
                </span>
              </div>

              <div className="text-slate-900 font-black">
                <span>Academic Year: </span>
                <span className="font-mono text-emerald-800">{academicYear}</span>
              </div>
            </div>

            {/* Main Table: SATS Grade Sheet */}
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse border-2 border-slate-900 text-xs">
                <thead>
                  {/* Embedded School Details Header for Print / PDF */}
                  <tr className="bg-white text-center font-bold text-red-600 border-b border-slate-900">
                    <th
                      colSpan={4 + currentSubjects.length}
                      className="p-2 text-sm sm:text-base font-serif font-black border-2 border-slate-900 text-red-600 uppercase"
                    >
                      {schoolName}
                    </th>
                  </tr>
                  <tr className="bg-amber-50/80 text-center font-bold text-slate-900 border-b-2 border-slate-900 text-xs">
                    <th
                      colSpan={4 + currentSubjects.length}
                      className="p-1.5 border-2 border-slate-900 text-slate-900 font-bold"
                    >
                      DISE NO: {diseCode} | CLASS: {formatClassStd(selectedClass)} | EXAM TYPE: {currentExamObj.labelEn} ({currentExamObj.labelKn}) | ACADEMIC YEAR: {academicYear}
                    </th>
                  </tr>

                  {/* Column Headers */}
                  <tr className="bg-[#fed7aa] font-black text-slate-950 border-b-2 border-slate-900">
                    <th
                      onClick={() => handleSort('index')}
                      className="border-2 border-slate-900 p-2 w-12 cursor-pointer hover:bg-amber-300 transition select-none"
                      title="Sort by Serial Number"
                    >
                      <span>Sr No</span>
                      {renderSortIcon('index')}
                    </th>
                    <th
                      onClick={() => handleSort('satsNo')}
                      className="border-2 border-slate-900 p-2 w-28 cursor-pointer hover:bg-amber-300 transition select-none"
                      title="Sort by SATS Number"
                    >
                      <span>SATS No</span>
                      {renderSortIcon('satsNo')}
                    </th>
                    <th
                      onClick={() => handleSort('name')}
                      className="border-2 border-slate-900 p-2 text-left pl-3 cursor-pointer hover:bg-amber-300 transition select-none"
                      title="Sort by Student Name"
                    >
                      <span>STUDENT NAME (ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು)</span>
                      {renderSortIcon('name')}
                    </th>
                    <th
                      onClick={() => handleSort('gender')}
                      className="border-2 border-slate-900 p-2 w-16 cursor-pointer hover:bg-amber-300 transition select-none"
                      title="Sort by Gender"
                    >
                      <span>Gender</span>
                      {renderSortIcon('gender')}
                    </th>

                    {/* Subject Headers */}
                    {currentSubjects.map((sub) => (
                      <th
                        key={sub.code}
                        className="border-2 border-slate-900 p-2 min-w-[85px] text-center"
                      >
                        <div className="font-black text-slate-950">{sub.nameKn}</div>
                        <div className="text-[10px] text-slate-800 font-semibold">{sub.nameEn}</div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {sortedStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4 + currentSubjects.length}
                        className="border-2 border-slate-900 p-6 text-center text-slate-500 font-bold italic"
                      >
                        ಈ ತರಗತಿಯಲ್ಲಿ ಯಾವುದೇ ವಿದ್ಯಾರ್ಥಿಗಳ ದಾಖಲಾತಿ ಇಲ್ಲ / No students enrolled in Class {formatClassOrdinal(selectedClass)}
                      </td>
                    </tr>
                  ) : (
                    sortedStudents.map((st, idx) => {
                      return (
                        <tr
                          key={st.id}
                          className="border-b border-slate-900 hover:bg-amber-50/50 text-[11px] h-7.5 transition"
                        >
                          {/* 1. Sr No */}
                          <td className="border border-slate-900 p-1 font-bold font-mono text-center">
                            {idx + 1}
                          </td>

                          {/* 2. SATS No */}
                          <td className="border border-slate-900 p-1 font-mono font-bold text-center">
                            {st.satsNo || '-'}
                          </td>

                          {/* 3. Student Name */}
                          <td className="border border-slate-900 p-1 text-left pl-3 font-bold text-slate-950 truncate max-w-[220px]">
                            {st.studentName}
                            {st.cwsnStatus && st.cwsnStatus !== 'NO' && (
                              <span className="ml-1 text-[9px] bg-purple-700 text-white font-black px-1 py-0.5 rounded shadow-xs print:text-black print:bg-transparent">
                                CWSN
                              </span>
                            )}
                          </td>

                          {/* 4. Gender */}
                          <td className="border border-slate-900 p-1 font-semibold text-center text-[10px]">
                            {st.gender === 'Boy' ? 'Boy (ಗಂಡು)' : st.gender === 'Girl' ? 'Girl (ಹೆಣ್ಣು)' : '-'}
                          </td>

                          {/* 5. Subject Grade Cells (CENTER ALIGNED, FETCH ONLY GRADES) */}
                          {currentSubjects.map((sub) => {
                            const gradeVal = getGradeForExamAndSubject(st, sub.code, selectedExam);
                            const isHighGrade = gradeVal === 'A+' || gradeVal === 'A';
                            const isLowGrade = gradeVal === 'C' || gradeVal === 'D';

                            return (
                              <td
                                key={sub.code}
                                style={{ textAlign: 'center', verticalAlign: 'middle' }}
                                className={`border border-slate-900 p-1 font-mono font-black text-center text-[11px] ${
                                  isHighGrade
                                    ? 'text-emerald-800'
                                    : isLowGrade
                                    ? 'text-rose-700'
                                    : 'text-slate-950'
                                }`}
                              >
                                {gradeVal}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Signature Section */}
            <div className="pt-6 mt-4 border-t border-slate-300 flex flex-wrap items-end justify-between text-xs font-bold text-slate-900 px-4">
              <div className="space-y-1">
                <div>ದಿನಾಂಕ (Date): ____________________</div>
                <div>ಸ್ಥಳ (Place): <span className="font-black">{placeName}</span></div>
              </div>

              <div className="text-center space-y-1">
                <div className="w-48 border-b border-dashed border-slate-900 pb-1 font-black">
                  {classTeacherName || ' '}
                </div>
                <div className="font-black text-slate-950">ವರ್ಗ ಶಿಕ್ಷಕರ ಸಹಿ (Class Teacher Sign)</div>
              </div>

              <div className="text-center space-y-1">
                <div className="w-56 border-b border-dashed border-slate-900 pb-1 font-black">
                  {schoolRecord?.headmasterName || ' '}
                </div>
                <div className="font-black text-slate-950">ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಸಹಿ & ಮೊಹರು (HM Sign & Seal)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export const SatsGradeUploadModal: React.FC<SatsGradeUploadModalProps> = ({
    isOpen,
    onClose,
    ...props
  }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        <div className="bg-slate-100 rounded-3xl shadow-2xl w-full max-w-[98vw] h-[96vh] flex flex-col overflow-hidden border-2 border-amber-500">
          <SatsGradeUploadContent {...props} onClose={onClose} isEmbedded={false} />
        </div>
      </div>
    );
  };
