/**
 * ============================================================================
 * LOCKED MODULE: TRANSFER CERTIFICATE (TC)
 * STATUS: 100% PERFECT & LOCKED BY USER REQUEST
 * DO NOT MODIFY THE LAYOUT, MARGINS, HEADER, ROW PERCENTAGES, OR PDF EXPORT
 * WITHOUT EXPLICIT PERMISSION FROM THE USER.
 * ============================================================================
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, SchoolRecord } from '../types';
import { TransferCertificatePreviewModal } from './TransferCertificatePreviewModal';
import {
  TcData,
  TcLabels,
  getTcLabels,
  buildDefaultTcData,
  loadStoredTcRecord,
  saveStoredTcRecord,
  getAllIssuedTcRecords,
} from '../utils/transferCertificateHelper';
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileText,
  Languages,
  Eye,
  Edit3,
  Save,
  CheckCircle,
  AlertTriangle,
  Copy,
  PrinterCheck,
} from 'lucide-react';

interface TransferCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolRecord: SchoolRecord | null;
  initialStudentId?: string;
}

export const TransferCertificateModal: React.FC<TransferCertificateModalProps> = ({
  isOpen,
  onClose,
  students,
  schoolRecord,
  initialStudentId,
}) => {
  // Language state & initial language selection dialog
  const [docLang, setDocLang] = useState<'kn' | 'en'>(
    schoolRecord?.schoolMedium === 'English' ? 'en' : 'kn'
  );
  const [showLanguageDialog, setShowLanguageDialog] = useState<boolean>(true);

  // Class and student navigation
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');

  // Opens directly in Edit Mode as requested!
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [paperSize, setPaperSize] = useState<'A4' | 'Legal'>('A4');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'warn' | 'info' } | null>(null);

  // Printable container ref
  const certificateRef = useRef<HTMLDivElement>(null);

  // Active TC form data state
  const [tcData, setTcData] = useState<TcData | null>(null);

  // Available classes
  const availableClasses = useMemo(() => {
    const clsSet = new Set(students.map((s) => s.classStandard).filter(Boolean));
    const list = Array.from(clsSet).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
    return list.length > 0 ? list : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    if (selectedClassFilter === 'ALL') return students;
    return students.filter((s) => s.classStandard === selectedClassFilter);
  }, [students, selectedClassFilter]);

  // Current selected student
  const currentStudent = useMemo(() => {
    if (filteredStudents.length === 0) return null;
    const found = filteredStudents.find((s) => s.id === selectedStudentId);
    return found || filteredStudents[0];
  }, [filteredStudents, selectedStudentId]);

  const currentIdx = useMemo(() => {
    if (!currentStudent) return 0;
    const idx = filteredStudents.findIndex((s) => s.id === currentStudent.id);
    return idx >= 0 ? idx : 0;
  }, [filteredStudents, currentStudent]);

  // Sync selectedStudentId when initialStudentId changes
  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
      setSelectedClassFilter('ALL');
    }
  }, [initialStudentId, isOpen]);

  // Check issued records for duplicate warning
  const issuedRecords = useMemo(() => {
    if (!schoolRecord?.diseCode) return {};
    return getAllIssuedTcRecords(schoolRecord.diseCode);
  }, [schoolRecord?.diseCode, statusMessage]);

  const alreadyIssuedRecord = useMemo(() => {
    if (!currentStudent || !schoolRecord?.diseCode) return null;
    const record = issuedRecords[currentStudent.id];
    return record && record.status === 'ISSUED' ? record : null;
  }, [currentStudent, schoolRecord?.diseCode, issuedRecords]);

  // Load or build TC data whenever current student or language changes
  useEffect(() => {
    if (!currentStudent) {
      setTcData(null);
      return;
    }
    const dise = schoolRecord?.diseCode || '';
    const stored = loadStoredTcRecord(dise, currentStudent.id);

    if (stored) {
      setTcData(stored);
    } else {
      const fresh = buildDefaultTcData(currentStudent, schoolRecord, docLang, currentIdx + 1);
      setTcData(fresh);
    }
  }, [currentStudent?.id, schoolRecord?.diseCode, currentIdx]);

  // When user switches language, re-populate language-dependent defaults unless user customized
  const handleLanguageChange = (newLang: 'kn' | 'en') => {
    setDocLang(newLang);
    if (currentStudent) {
      const fresh = buildDefaultTcData(currentStudent, schoolRecord, newLang, currentIdx + 1);
      setTcData(fresh);
    }
    showToast(
      newLang === 'kn' ? 'ಕನ್ನಡ ಭಾಷೆಗೆ ಬದಲಾಯಿಸಲಾಗಿದೆ' : 'Switched to English TC mode',
      'info'
    );
  };

  const showToast = (text: string, type: 'success' | 'warn' | 'info' = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  if (!isOpen) return null;

  const handlePrev = () => {
    if (currentIdx > 0) {
      setSelectedStudentId(filteredStudents[currentIdx - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIdx < filteredStudents.length - 1) {
      setSelectedStudentId(filteredStudents[currentIdx + 1].id);
    }
  };

  const handleFieldChange = (field: keyof TcData, value: any) => {
    setTcData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  // Save as Draft
  const handleSaveDraft = () => {
    if (!tcData || !currentStudent || !schoolRecord?.diseCode) return;
    const updated = { ...tcData, status: 'DRAFT' as const };
    setTcData(updated);
    saveStoredTcRecord(schoolRecord.diseCode, currentStudent.id, updated);
    showToast(
      docLang === 'kn'
        ? 'TC ಕರಡು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ (Draft Saved)'
        : 'TC Draft Saved Successfully',
      'success'
    );
  };

  // Confirm and Open in Print Mode
  const handleConfirmAndOpenPrint = () => {
    if (!tcData || !currentStudent || !schoolRecord?.diseCode) return;
    const updated = { ...tcData, status: 'DRAFT' as const };
    setTcData(updated);
    saveStoredTcRecord(schoolRecord.diseCode, currentStudent.id, updated);
    setIsEditMode(false);
    setShowPreviewModal(true);
    showToast(
      docLang === 'kn'
        ? 'ಮಾಹಿತಿ ದೃಢೀಕರಿಸಲಾಗಿದೆ - ಮುದ್ರಣ ವಿಂಡೋ ತೆರೆಯಲಾಗಿದೆ'
        : 'Details Confirmed - Opening Print Preview',
      'success'
    );
  };

  // Finalize and Issue TC
  const handleFinalizeIssue = () => {
    if (!tcData || !currentStudent || !schoolRecord?.diseCode) return;
    const updated = {
      ...tcData,
      status: 'ISSUED' as const,
      issuedAt: new Date().toISOString(),
    };
    setTcData(updated);
    saveStoredTcRecord(schoolRecord.diseCode, currentStudent.id, updated);
    showToast(
      docLang === 'kn'
        ? 'ವರ್ಗಾವಣೆ ಪ್ರಮಾಣಪತ್ರ ಅಧಿಕೃತವಾಗಿ ನೀಡಲಾಗಿದೆ! (TC Issued Successfully)'
        : 'Transfer Certificate Issued Officially!',
      'success'
    );
  };

  const labels: TcLabels = getTcLabels(docLang);
  const cleanStudentName = currentStudent?.studentName || 'Student';
  const pdfFilename = `TC_${cleanStudentName.replace(/[^a-zA-Z0-9_\u0C80-\u0CFF]/g, '_')}_Class_${currentStudent?.classStandard || 'Std'}.pdf`;

  // Render the official Karnataka 14-Row Transfer Certificate
  const renderCertificateContent = (forPdfPreview = false) => {
    if (!tcData || !currentStudent) {
      return (
        <div className="p-12 text-center text-slate-500 font-bold text-sm">
          {docLang === 'kn' ? 'ಯಾವುದೇ ವಿದ್ಯಾರ್ಥಿ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.' : 'No student record available.'}
        </div>
      );
    }

    const edit = isEditMode && !forPdfPreview;

    return (
      <div
        ref={certificateRef}
        className={`bg-white text-black font-serif text-[11px] leading-normal select-text print:text-[10.5px] mx-auto border-4 border-double border-black rounded-lg p-2.5 sm:p-3 print:p-2 shadow-sm single-page-sheet flex flex-col justify-between box-border ${
          paperSize === 'Legal'
            ? 'w-[205.9mm] h-[335.6mm] max-h-[335.6mm]'
            : 'w-[200mm] h-[277mm] max-h-[277mm]'
        }`}
        style={{
          fontFamily: docLang === 'kn' ? "'Noto Sans Kannada', 'Segoe UI', Tahoma, sans-serif" : "'Times New Roman', Times, serif",
        }}
      >
        {/* =========================================================================
            PAGE HEADING
            Line 1: "ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ" / "School Education department"
            Line 2: "ವರ್ಗಾವಣೆ ಪ್ರಮಾಣ ಪತ್ರ" / "TRANSFER CERTIFICATE"
            Line 3: School Name along with Taluk & District in ONE SINGLE LINE
            DISE Code & TC Serial Number
            ========================================================================= */}
        <div className="text-center space-y-0.5 pb-1.5 border-b-2 border-black shrink-0">
          {/* Line 1: Department Name */}
          <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 leading-normal">
            {labels.govDepartment}
          </div>

          {/* Line 2: Certificate Title */}
          <div className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-950 leading-normal">
            {labels.title}
          </div>

          {/* Line 3: School Name along with Taluk & District strictly fitted in ONE SINGLE LINE */}
          <div className="pt-0.5">
            {edit ? (
              <div className="flex items-center justify-center gap-1.5 px-1">
                <input
                  type="text"
                  value={tcData.schoolName}
                  onChange={(e) => handleFieldChange('schoolName', e.target.value)}
                  placeholder="ಶಾಲೆಯ ಹೆಸರು / School Name"
                  className="text-center text-sm sm:text-base font-black uppercase tracking-wide border-b border-blue-500 bg-blue-50/50 py-0.5 outline-none flex-1 min-w-0"
                />
                <span className="font-bold text-xs shrink-0">{docLang === 'kn' ? 'ತಾ:' : 'Tq:'}</span>
                <input
                  type="text"
                  value={tcData.taluk}
                  onChange={(e) => handleFieldChange('taluk', e.target.value)}
                  placeholder="ತಾಲ್ಲೂಕು / Taluk"
                  className="text-center text-xs font-bold border-b border-blue-500 bg-blue-50/50 py-0.5 outline-none w-28 shrink-0"
                />
                <span className="font-bold text-xs shrink-0">{docLang === 'kn' ? 'ಜಿ:' : 'Dist:'}</span>
                <input
                  type="text"
                  value={tcData.district}
                  onChange={(e) => handleFieldChange('district', e.target.value)}
                  placeholder="ಜಿಲ್ಲೆ / District"
                  className="text-center text-xs font-bold border-b border-blue-500 bg-blue-50/50 py-0.5 outline-none w-28 shrink-0"
                />
              </div>
            ) : (
              <div className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-950 px-1 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                {tcData.schoolName || schoolRecord?.schoolName || '—'}
                {tcData.taluk ? (docLang === 'kn' ? `, ತಾ: ${tcData.taluk}` : `, Tq: ${tcData.taluk}`) : ''}
                {tcData.district ? (docLang === 'kn' ? `, ಜಿ: ${tcData.district}` : `, Dist: ${tcData.district}`) : ''}
              </div>
            )}
          </div>

          {/* DISE No on Left, TC Number on Right */}
          <div className="flex justify-between items-center text-xs font-bold pt-1 px-1">
            <div className="flex items-center gap-1.5">
              <span>{labels.diseLabel}</span>
              {edit ? (
                <input
                  type="text"
                  value={tcData.diseCode}
                  onChange={(e) => handleFieldChange('diseCode', e.target.value)}
                  className="font-mono font-bold border-b border-black px-1 py-0 text-xs w-32 bg-blue-50 outline-none leading-normal"
                />
              ) : (
                <span className="font-mono font-black border-b border-dotted border-black px-1 min-w-[120px] inline-block leading-normal">
                  {tcData.diseCode || '________________'}
                </span>
              )}
            </div>

            {/* Duplicate Stamp if applicable */}
            {tcData.isDuplicate && (
              <div className="px-3 py-0.5 border-2 border-red-600 text-red-700 font-black text-xs uppercase tracking-widest rounded-md bg-red-50">
                {labels.duplicateStamp}
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span>{labels.tcNoLabel}</span>
              {edit ? (
                <input
                  type="text"
                  value={tcData.tcNumber}
                  onChange={(e) => handleFieldChange('tcNumber', e.target.value)}
                  className="font-mono font-bold border-b border-black px-1 py-0 text-xs w-36 bg-blue-50 outline-none leading-normal"
                />
              ) : (
                <span className="font-mono font-black border-b border-dotted border-black px-1 min-w-[100px] inline-block text-right leading-normal">
                  {tcData.tcNumber || '________________'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            MAIN BOX: EXACT 14 ROWS DISTRIBUTED %-WISE TO FILL COMPLETE HEIGHT
            NO OVERLAPPING ON BORDERS • FILLS ENTIRE SPACE ON BOTH A4 AND LEGAL
            ========================================================================= */}
        <div className="flex-1 w-full flex flex-col justify-between my-1">
          <table
            style={{
              height: paperSize === 'Legal' ? '265mm' : '208mm',
              tableLayout: 'fixed',
              width: '100%',
            }}
            className="w-full border-collapse table-fixed text-[11px] leading-normal border border-black"
          >
            <colgroup>
              <col className="w-1/4" />
              <col className="w-1/4" />
              <col className="w-1/4" />
              <col className="w-1/4" />
            </colgroup>
            <tbody>
              {/* Row 1: 1. Admission No. (50%) | 2. Cumulative Record No. (50%) */}
              <tr style={{ height: '6.5%' }} className="border-b border-black">
                <td colSpan={2} className="border-r border-black py-1 px-2 align-middle">
                  <div className="flex items-center gap-2">
                    <span className="font-bold shrink-0">{labels.item1}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field1_admissionNo}
                        onChange={(e) => handleFieldChange('field1_admissionNo', e.target.value)}
                        className="w-full min-w-0 font-mono font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none"
                      />
                    ) : (
                      <span className="font-mono font-bold text-xs">{tcData.field1_admissionNo || '—'}</span>
                    )}
                  </div>
                </td>
                <td colSpan={2} className="py-1 px-2 align-middle">
                  <div className="flex items-center gap-2">
                    <span className="font-bold shrink-0">{labels.item2}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field2_cumulativeRecordNo}
                        onChange={(e) => handleFieldChange('field2_cumulativeRecordNo', e.target.value)}
                        className="w-full min-w-0 font-mono font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none"
                      />
                    ) : (
                      <span className="font-mono font-bold text-xs">{tcData.field2_cumulativeRecordNo || '—'}</span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Row 2: 3. Student Full Name (75%) | 4. Gender (25%) */}
              <tr style={{ height: '6.5%' }} className="border-b border-black">
                <td colSpan={3} className="border-r border-black py-1 px-2 align-middle">
                  <div className="flex items-center gap-2">
                    <span className="font-bold shrink-0">{labels.item3}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field3_studentName}
                        onChange={(e) => handleFieldChange('field3_studentName', e.target.value)}
                        className="w-full min-w-0 font-black text-xs uppercase border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 outline-none"
                      />
                    ) : (
                      <span className="font-black text-xs uppercase tracking-wide text-slate-950">
                        {tcData.field3_studentName || '—'}
                      </span>
                    )}
                  </div>
                </td>
                <td colSpan={1} className="py-1 px-2 align-middle">
                  <div className="flex items-center gap-2">
                    <span className="font-bold shrink-0">{labels.item4}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field4_gender}
                        onChange={(e) => handleFieldChange('field4_gender', e.target.value)}
                        className="w-full min-w-0 font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none"
                      />
                    ) : (
                      <span className="font-bold text-xs">{tcData.field4_gender || '—'}</span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Row 3: 5. Aadhaar No. (50%) | 6. STS No. (50%) */}
              <tr style={{ height: '6.5%' }} className="border-b border-black">
                <td colSpan={2} className="border-r border-black py-1 px-2 align-middle">
                  <div className="flex items-center gap-2">
                    <span className="font-bold shrink-0">{labels.item5}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field5_aadhaarNo}
                        onChange={(e) => handleFieldChange('field5_aadhaarNo', e.target.value)}
                        className="w-full min-w-0 font-mono font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none"
                      />
                    ) : (
                      <span className="font-mono font-bold text-xs">{tcData.field5_aadhaarNo || '—'}</span>
                    )}
                  </div>
                </td>
                <td colSpan={2} className="py-1 px-2 align-middle">
                  <div className="flex items-center gap-2">
                    <span className="font-bold shrink-0">{labels.item6}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field6_satsNo}
                        onChange={(e) => handleFieldChange('field6_satsNo', e.target.value)}
                        className="w-full min-w-0 font-mono font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none"
                      />
                    ) : (
                      <span className="font-mono font-bold text-xs">{tcData.field6_satsNo || '—'}</span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Row 4: 4 Equal Columns (7. Nationality | 8. Religion | 9. Caste | 10. Sub-caste) */}
              <tr style={{ height: '6.5%' }} className="border-b border-black">
                <td className="border-r border-black py-1 px-2 align-middle">
                  <div className="space-y-0.5">
                    <div className="font-bold whitespace-nowrap text-[10.5px]">{labels.item7}</div>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field7_nationality}
                        onChange={(e) => handleFieldChange('field7_nationality', e.target.value)}
                        className="w-full min-w-0 font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none"
                      />
                    ) : (
                      <div className="font-bold text-xs whitespace-nowrap overflow-hidden text-ellipsis">{tcData.field7_nationality || '—'}</div>
                    )}
                  </div>
                </td>
                <td className="border-r border-black py-1 px-2 align-middle">
                  <div className="space-y-0.5">
                    <div className="font-bold whitespace-nowrap text-[10.5px]">{labels.item8}</div>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field8_religion}
                        onChange={(e) => handleFieldChange('field8_religion', e.target.value)}
                        className="w-full min-w-0 font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none"
                      />
                    ) : (
                      <div className="font-bold text-xs whitespace-nowrap overflow-hidden text-ellipsis">{tcData.field8_religion || '—'}</div>
                    )}
                  </div>
                </td>
                <td className="border-r border-black py-1 px-2 align-middle">
                  <div className="space-y-0.5">
                    <div className="font-bold whitespace-nowrap text-[10.5px]">{labels.item9}</div>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field9_caste}
                        onChange={(e) => handleFieldChange('field9_caste', e.target.value)}
                        className="w-full min-w-0 font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none"
                      />
                    ) : (
                      <div className="font-bold text-xs whitespace-nowrap overflow-hidden text-ellipsis">{tcData.field9_caste || '—'}</div>
                    )}
                  </div>
                </td>
                <td className="py-1 px-2 align-middle">
                  <div className="space-y-0.5">
                    <div className="font-bold whitespace-nowrap text-[10.5px]">{labels.item10}</div>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field10_subCaste}
                        onChange={(e) => handleFieldChange('field10_subCaste', e.target.value)}
                        className="w-full min-w-0 font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none"
                      />
                    ) : (
                      <div className="font-bold text-xs whitespace-nowrap overflow-hidden text-ellipsis">{tcData.field10_subCaste || '—'}</div>
                    )}
                  </div>
                </td>
              </tr>

              {/* Row 5: 11. Father Name & Aadhaar | 12. Mother Name & Aadhaar */}
              <tr style={{ height: '7.5%' }} className="border-b border-black">
                <td colSpan={2} className="border-r border-black py-1.5 px-2 align-middle">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold shrink-0 whitespace-nowrap">{labels.item11}</span>
                      {edit ? (
                        <input
                          type="text"
                          value={tcData.field11_fatherName}
                          onChange={(e) => handleFieldChange('field11_fatherName', e.target.value)}
                          className="w-full min-w-0 font-bold text-xs uppercase border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 outline-none"
                        />
                      ) : (
                        <span className="font-bold text-xs uppercase">{tcData.field11_fatherName || '—'}</span>
                      )}
                    </div>
                    <div className="flex items-center pl-4 text-[10.5px] gap-2">
                      <span className="font-medium shrink-0 whitespace-nowrap">{labels.item11_sub}</span>
                      {edit ? (
                        <input
                          type="text"
                          value={tcData.field11_fatherAadhaar}
                          onChange={(e) => handleFieldChange('field11_fatherAadhaar', e.target.value)}
                          className="w-48 font-mono border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 outline-none"
                        />
                      ) : (
                        <span className="font-mono font-medium">{tcData.field11_fatherAadhaar || '—'}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td colSpan={2} className="py-1.5 px-2 align-middle">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold shrink-0 whitespace-nowrap">{labels.item12}</span>
                      {edit ? (
                        <input
                          type="text"
                          value={tcData.field12_motherName}
                          onChange={(e) => handleFieldChange('field12_motherName', e.target.value)}
                          className="w-full min-w-0 font-bold text-xs uppercase border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 outline-none"
                        />
                      ) : (
                        <span className="font-bold text-xs uppercase">{tcData.field12_motherName || '—'}</span>
                      )}
                    </div>
                    <div className="flex items-center pl-4 text-[10.5px] gap-2">
                      <span className="font-medium shrink-0 whitespace-nowrap">{labels.item12_sub}</span>
                      {edit ? (
                        <input
                          type="text"
                          value={tcData.field12_motherAadhaar}
                          onChange={(e) => handleFieldChange('field12_motherAadhaar', e.target.value)}
                          className="w-48 font-mono border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 outline-none"
                        />
                      ) : (
                        <span className="font-mono font-medium">{tcData.field12_motherAadhaar || '—'}</span>
                      )}
                    </div>
                  </div>
                </td>
              </tr>

              {/* Row 6: 13. Belongs to SC/ST? | 14. Promotion Eligible? */}
              <tr style={{ height: '6.5%' }} className="border-b border-black">
                <td colSpan={2} className="border-r border-black py-1 px-2 align-middle overflow-hidden">
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="font-bold leading-tight mr-1 text-[10px] sm:text-[10.5px]">{labels.item13}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field13_isScOrSt}
                        onChange={(e) => handleFieldChange('field13_isScOrSt', e.target.value)}
                        className="w-28 font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs text-center outline-none shrink-0"
                      />
                    ) : (
                      <span className="font-bold text-xs underline underline-offset-2 shrink-0 whitespace-nowrap">
                        {tcData.field13_isScOrSt || '—'}
                      </span>
                    )}
                  </div>
                </td>
                <td colSpan={2} className="py-1 px-2 align-middle overflow-hidden">
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="font-bold leading-tight mr-1 text-[10px] sm:text-[10.5px]">{labels.item14}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field14_isEligibleForPromotion}
                        onChange={(e) => handleFieldChange('field14_isEligibleForPromotion', e.target.value)}
                        className="w-32 font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs text-center outline-none shrink-0"
                      />
                    ) : (
                      <span className="font-bold text-xs underline underline-offset-2 shrink-0 whitespace-nowrap">
                        {tcData.field14_isEligibleForPromotion || '—'}
                      </span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Row 7: 15. DOB in Figures & Words + Place of Birth */}
              <tr style={{ height: '8.5%' }} className="border-b border-black">
                <td colSpan={4} className="py-1 px-2 space-y-1 align-middle overflow-hidden">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-bold shrink-0 whitespace-nowrap">{labels.item15}</span>
                    {edit ? (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="text"
                          value={tcData.field15_dobFigures}
                          onChange={(e) => handleFieldChange('field15_dobFigures', e.target.value)}
                          placeholder="DD/MM/YYYY"
                          className="font-mono font-bold text-xs border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 outline-none w-28 shrink-0"
                        />
                        <input
                          type="text"
                          value={tcData.field15_dobWords}
                          onChange={(e) => handleFieldChange('field15_dobWords', e.target.value)}
                          placeholder="Date in words"
                          className="font-bold text-xs border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 outline-none flex-1 min-w-0"
                        />
                      </div>
                    ) : (
                      <div className="font-bold text-xs flex items-center gap-2 overflow-hidden min-w-0">
                        <span className="font-mono font-black shrink-0">{tcData.field15_dobFigures}</span>
                        <span className="italic truncate">({tcData.field15_dobWords})</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center pl-6 gap-2 overflow-hidden">
                    <span className="font-bold text-[11px] shrink-0 whitespace-nowrap">{labels.item15_sub}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field15_placeOfBirth}
                        onChange={(e) => handleFieldChange('field15_placeOfBirth', e.target.value)}
                        className="w-48 font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 outline-none text-xs"
                      />
                    ) : (
                      <span className="font-bold text-xs underline underline-offset-2 whitespace-nowrap">
                        {tcData.field15_placeOfBirth || '—'}
                      </span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Row 8: 16. Class studying at time of leaving (in words) */}
              <tr style={{ height: '6.5%' }} className="border-b border-black">
                <td colSpan={4} className="py-1 px-2 align-middle overflow-hidden">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-bold shrink-0 leading-normal">{labels.item16}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field16_classStudyingInWords}
                        onChange={(e) => handleFieldChange('field16_classStudyingInWords', e.target.value)}
                        className="w-full min-w-0 font-bold text-xs border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 outline-none"
                      />
                    ) : (
                      <span className="font-bold text-xs text-blue-950 underline underline-offset-2 truncate">
                        {tcData.field16_classStudyingInWords || '—'}
                      </span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Row 9: 17. High school subjects: Languages & Core */}
              <tr style={{ height: '8.5%' }} className="border-b border-black">
                <td colSpan={4} className="py-1 px-2 space-y-1 align-middle overflow-hidden">
                  <div className="font-bold text-[11px] leading-tight">{labels.item17_title}</div>
                  <div className="flex items-center pl-4 text-xs gap-2 overflow-hidden">
                    <span className="font-semibold shrink-0">{labels.item17_a}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field17_languagesStudied}
                        onChange={(e) => handleFieldChange('field17_languagesStudied', e.target.value)}
                        className="w-full min-w-0 font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 outline-none"
                      />
                    ) : (
                      <span className="font-bold text-xs truncate">{tcData.field17_languagesStudied || '—'}</span>
                    )}
                  </div>
                  <div className="flex items-center pl-4 text-xs gap-2 overflow-hidden">
                    <span className="font-semibold shrink-0">{labels.item17_b}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field17_coreSubjects}
                        onChange={(e) => handleFieldChange('field17_coreSubjects', e.target.value)}
                        className="w-full min-w-0 font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 outline-none"
                      />
                    ) : (
                      <span className="font-bold text-xs truncate">{tcData.field17_coreSubjects || '—'}</span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Row 10: Left 18 (Medium) | Right 23 (Medical Examination) */}
              <tr style={{ height: '6.5%' }} className="border-b border-black">
                <td colSpan={2} className="border-r border-black py-1 px-2 align-middle overflow-hidden">
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="font-bold mr-1 leading-tight text-[10.5px]">{labels.item18}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field18_mediumOfInstruction}
                        onChange={(e) => handleFieldChange('field18_mediumOfInstruction', e.target.value)}
                        className="w-32 font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none text-right shrink-0"
                      />
                    ) : (
                      <span className="font-bold text-xs shrink-0 whitespace-nowrap">{tcData.field18_mediumOfInstruction || '—'}</span>
                    )}
                  </div>
                </td>
                <td colSpan={2} className="py-1 px-2 align-middle overflow-hidden">
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="font-bold mr-1 leading-tight text-[9.5px] sm:text-[10px]">{labels.item23}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field23_medicalExamined}
                        onChange={(e) => handleFieldChange('field23_medicalExamined', e.target.value)}
                        className="w-28 font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none text-right shrink-0"
                      />
                    ) : (
                      <span className="font-bold text-xs shrink-0 whitespace-nowrap">{tcData.field23_medicalExamined || '—'}</span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Row 11: Left 19 (Date of Admission/Promotion) | Right 24 (Last Attendance Date) */}
              <tr style={{ height: '6.5%' }} className="border-b border-black">
                <td colSpan={2} className="border-r border-black py-1 px-2 align-middle overflow-hidden">
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="font-bold mr-1 leading-tight text-[9.5px] sm:text-[10px]">{labels.item19}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field19_dateOfAdmissionOrPromotion}
                        onChange={(e) => handleFieldChange('field19_dateOfAdmissionOrPromotion', e.target.value)}
                        className="w-28 font-mono font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none text-right shrink-0"
                      />
                    ) : (
                      <span className="font-mono font-bold text-xs shrink-0 whitespace-nowrap">
                        {tcData.field19_dateOfAdmissionOrPromotion || '—'}
                      </span>
                    )}
                  </div>
                </td>
                <td colSpan={2} className="py-1 px-2 align-middle overflow-hidden">
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="font-bold mr-1 leading-tight text-[9.5px] sm:text-[10px]">{labels.item24}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field24_dateOfLastAttendance}
                        onChange={(e) => handleFieldChange('field24_dateOfLastAttendance', e.target.value)}
                        className="w-28 font-mono font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none text-right shrink-0"
                      />
                    ) : (
                      <span className="font-mono font-bold text-xs shrink-0 whitespace-nowrap">
                        {tcData.field24_dateOfLastAttendance || '—'}
                      </span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Row 12: Left 20 (School Dues/Fees Paid?) | Right 25 (TC Application Date) */}
              <tr style={{ height: '6.5%' }} className="border-b border-black">
                <td colSpan={2} className="border-r border-black py-1 px-2 align-middle overflow-hidden">
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="font-bold mr-1 leading-tight text-[9.5px] sm:text-[10px]">{labels.item20}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field20_feesCleared}
                        onChange={(e) => handleFieldChange('field20_feesCleared', e.target.value)}
                        className="w-28 font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none text-right shrink-0"
                      />
                    ) : (
                      <span className="font-bold text-xs shrink-0 whitespace-nowrap">{tcData.field20_feesCleared || '—'}</span>
                    )}
                  </div>
                </td>
                <td colSpan={2} className="py-1 px-2 align-middle overflow-hidden">
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="font-bold mr-1 leading-tight text-[9.5px] sm:text-[10px]">{labels.item25}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field25_dateOfTcApplication}
                        onChange={(e) => handleFieldChange('field25_dateOfTcApplication', e.target.value)}
                        className="w-28 font-mono font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none text-right shrink-0"
                      />
                    ) : (
                      <span className="font-mono font-bold text-xs shrink-0 whitespace-nowrap">
                        {tcData.field25_dateOfTcApplication || '—'}
                      </span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Row 13: Left 21 (Fee Concession) | Right 26 (Issue Date) & 27 (Working Days) */}
              <tr style={{ height: '11.5%' }} className="border-b border-black">
                <td colSpan={2} className="border-r border-black py-1 px-2 align-middle overflow-hidden">
                  <div className="space-y-0.5">
                    <div className="font-bold leading-tight text-[9.5px] sm:text-[10px]">{labels.item21}</div>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field21_feeConcession}
                        onChange={(e) => handleFieldChange('field21_feeConcession', e.target.value)}
                        className="w-full min-w-0 font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none"
                      />
                    ) : (
                      <div className="font-bold text-xs pl-2 truncate">{tcData.field21_feeConcession || '—'}</div>
                    )}
                  </div>
                </td>
                <td colSpan={2} className="py-1 px-2 align-middle space-y-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="font-bold mr-1 leading-tight text-[10px] sm:text-[10.5px]">{labels.item26}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field26_dateOfTcIssue}
                        onChange={(e) => handleFieldChange('field26_dateOfTcIssue', e.target.value)}
                        className="w-28 font-mono font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none text-right shrink-0"
                      />
                    ) : (
                      <span className="font-mono font-bold text-xs shrink-0 whitespace-nowrap">
                        {tcData.field26_dateOfTcIssue || '—'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 w-full pt-0.5 border-t border-dotted border-slate-400">
                    <span className="font-bold mr-1 leading-tight text-[10px] sm:text-[10.5px]">{labels.item27}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field27_totalWorkingDays}
                        onChange={(e) => handleFieldChange('field27_totalWorkingDays', e.target.value)}
                        className="w-20 font-mono font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none text-center shrink-0"
                      />
                    ) : (
                      <span className="font-mono font-bold text-xs shrink-0 whitespace-nowrap">
                        {tcData.field27_totalWorkingDays || '—'}
                      </span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Row 14: Left 22 (Scholarship) | Right 28 (Days Attended) & 29 (Character & Conduct) */}
              <tr style={{ height: '11.5%' }}>
                <td colSpan={2} className="border-r border-black py-1 px-2 align-middle overflow-hidden">
                  <div className="space-y-0.5">
                    <div className="font-bold leading-tight text-[9.5px] sm:text-[10px]">{labels.item22}</div>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field22_scholarship}
                        onChange={(e) => handleFieldChange('field22_scholarship', e.target.value)}
                        className="w-full min-w-0 font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none"
                      />
                    ) : (
                      <div className="font-bold text-xs pl-2 truncate">{tcData.field22_scholarship || '—'}</div>
                    )}
                  </div>
                </td>
                <td colSpan={2} className="py-1 px-2 align-middle space-y-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="font-bold mr-1 leading-tight text-[10px] sm:text-[10.5px]">{labels.item28}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field28_totalAttendedDays}
                        onChange={(e) => handleFieldChange('field28_totalAttendedDays', e.target.value)}
                        className="w-20 font-mono font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none text-center shrink-0"
                      />
                    ) : (
                      <span className="font-mono font-bold text-xs shrink-0 whitespace-nowrap">
                        {tcData.field28_totalAttendedDays || '—'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 w-full pt-0.5 border-t border-dotted border-slate-400">
                    <span className="font-bold mr-1 leading-tight text-[10px] sm:text-[10.5px]">{labels.item29}</span>
                    {edit ? (
                      <input
                        type="text"
                        value={tcData.field29_characterAndConduct}
                        onChange={(e) => handleFieldChange('field29_characterAndConduct', e.target.value)}
                        className="w-28 font-bold border-b border-blue-500 bg-blue-50/50 px-1 py-0.5 text-xs outline-none text-right shrink-0"
                      />
                    ) : (
                      <span className="font-bold text-xs text-emerald-950 shrink-0 whitespace-nowrap">
                        {tcData.field29_characterAndConduct || '—'}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            FOOTER SECTION: Signature block + Statutory Note + Angadi Credit
            ========================================================================= */}
        <div className="pt-1.5 border-t-2 border-black space-y-2 shrink-0">
          {/* Signatures & Place/Date Row */}
          <div className="grid grid-cols-2 items-end px-1">
            {/* Left: Place & Date */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold">{labels.placeLabel}</span>
                {edit ? (
                  <input
                    type="text"
                    value={tcData.placeName}
                    onChange={(e) => handleFieldChange('placeName', e.target.value)}
                    className="font-bold border-b border-dotted border-black bg-blue-50/50 px-1 py-0.5 outline-none text-xs w-44"
                  />
                ) : (
                  <span className="font-bold border-b border-dotted border-black pb-0.5 min-w-[120px] inline-block">
                    {tcData.placeName || '________________'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{labels.dateLabel}</span>
                {edit ? (
                  <input
                    type="text"
                    value={tcData.field26_dateOfTcIssue}
                    onChange={(e) => handleFieldChange('field26_dateOfTcIssue', e.target.value)}
                    className="font-mono font-bold border-b border-dotted border-black bg-blue-50/50 px-1 py-0.5 outline-none text-xs w-36"
                  />
                ) : (
                  <span className="font-mono font-bold border-b border-dotted border-black pb-0.5 min-w-[120px] inline-block">
                    {tcData.field26_dateOfTcIssue || '________________'}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Headmaster Signature */}
            <div className="text-center space-y-0.5">
              <div className="h-8"></div>
              <div className="border-t border-black pt-1 w-52 mx-auto">
                <div className="font-bold text-xs uppercase">{labels.hmSignature}</div>
                <div className="text-[10px] font-medium">{labels.schoolSeal}</div>
              </div>
            </div>
          </div>

          {/* Original Statutory Note below HM signature */}
          <div className="border-t border-slate-300 pt-1.5 px-1 text-[9px] leading-tight text-slate-800">
            <p className="text-justify font-sans">{labels.statutoryNotice}</p>
          </div>

          {/* New Footer: Clean Credit "Designed by Shri S R Angadi. M: 9731 766 727" */}
          <div className="text-center pt-0.5">
            <p className="font-sans font-bold text-xs tracking-wider text-slate-800">
              {labels.footerCredit}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* =========================================================================
          LANGUAGE SELECTION DIALOG (Opens upon generating TC)
          ========================================================================= */}
      {showLanguageDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white p-6 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-amber-300 mb-3 shadow-inner">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black tracking-wide">
                ವರ್ಗಾವಣೆ ಪ್ರಮಾಣಪತ್ರದ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ
              </h3>
              <p className="text-xs text-purple-200 font-medium mt-1">
                Select Transfer Certificate (TC) Language
              </p>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 text-center font-bold">
                ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆಯ ಅಧಿಕೃತ ನಮೂನೆಯಲ್ಲಿ ವರ್ಗಾವಣೆ ಪ್ರಮಾಣಪತ್ರವನ್ನು ರಚಿಸಿ.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {/* 1. Kannada Option */}
                <button
                  type="button"
                  onClick={() => {
                    handleLanguageChange('kn');
                    setShowLanguageDialog(false);
                    setIsEditMode(true);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between group ${
                    docLang === 'kn'
                      ? 'border-purple-600 bg-purple-50/70 shadow-md ring-2 ring-purple-300'
                      : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                      ೧
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase">
                      ಅಧಿಕೃತ ನಮೂನೆ
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 group-hover:text-purple-700">
                      ಕನ್ನಡ (Kannada)
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆಯ ನಮೂನೆ
                    </p>
                  </div>
                </button>

                {/* 2. English Option */}
                <button
                  type="button"
                  onClick={() => {
                    handleLanguageChange('en');
                    setShowLanguageDialog(false);
                    setIsEditMode(true);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between group ${
                    docLang === 'en'
                      ? 'border-purple-600 bg-purple-50/70 shadow-md ring-2 ring-purple-300'
                      : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                      2
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 uppercase">
                      Official English
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 group-hover:text-indigo-700">
                      English (ಆಂಗ್ಲ)
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      School Education Department Format
                    </p>
                  </div>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  ರದ್ದುಮಾಡಿ (Cancel)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLanguageDialog(false);
                    setIsEditMode(true);
                  }}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md transition"
                >
                  ಮುಂದುವರಿಯಿರಿ (Proceed) →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN MODAL WINDOW
          ========================================================================= */}
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
        <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
          {/* Top Control Header (Hidden in Print) */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-3 sm:p-4 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden border-b border-slate-800 shadow-md">
            {/* Title & Badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base tracking-wide text-white">
                    {docLang === 'kn' ? 'ವರ್ಗಾವಣೆ ಪ್ರಮಾಣ ಪತ್ರ (TC)' : 'Transfer Certificate (TC)'}
                  </h3>
                  <span className={`px-2 py-0.5 font-mono text-[10px] font-black rounded-full uppercase border ${
                    isEditMode
                      ? 'bg-amber-400 text-slate-950 border-amber-300 animate-pulse'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-500'
                  }`}>
                    {isEditMode ? 'Editing Mode (ತಿದ್ದುಪಡಿ)' : 'Confirmed (ದೃಢೀಕರಿಸಲಾಗಿದೆ)'}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-400">
                  {docLang === 'kn' ? 'ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ' : 'School Education department'}
                </p>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Class Filter */}
              <div className="flex items-center gap-1.5 bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700">
                <label className="text-[11px] font-black text-amber-300 whitespace-nowrap">
                  {docLang === 'kn' ? 'ತರಗತಿ:' : 'Class:'}
                </label>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => {
                    const newClass = e.target.value;
                    setSelectedClassFilter(newClass);
                    const nextList =
                      newClass === 'ALL'
                        ? students
                        : students.filter((s) => s.classStandard === newClass);
                    if (nextList.length > 0) {
                      setSelectedStudentId(nextList[0].id);
                    }
                  }}
                  className="px-2 py-0.5 text-xs font-bold bg-slate-900 border border-slate-600 rounded-lg text-white cursor-pointer hover:border-amber-400"
                >
                  <option value="ALL">
                    {docLang === 'kn' ? 'ಎಲ್ಲಾ ತರಗತಿ (All Classes)' : 'All Classes'}
                  </option>
                  {availableClasses.map((c) => (
                    <option key={c} value={c}>
                      {docLang === 'kn' ? `${c} ನೇ ತರಗತಿ` : `Class ${c}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700">
                <label className="text-[11px] font-black text-purple-300 whitespace-nowrap">
                  {docLang === 'kn' ? 'ವಿದ್ಯಾರ್ಥಿ:' : 'Student:'}
                </label>
                <select
                  value={currentStudent?.id || ''}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={filteredStudents.length === 0}
                  className="px-2 py-0.5 text-xs font-bold bg-slate-900 border border-slate-600 rounded-lg text-white cursor-pointer hover:border-purple-400 max-w-[170px] sm:max-w-xs truncate"
                >
                  {filteredStudents.length === 0 ? (
                    <option value="">{docLang === 'kn' ? 'ವಿದ್ಯಾರ್ಥಿಗಳಿಲ್ಲ' : 'No Students'}</option>
                  ) : (
                    filteredStudents.map((s, idx) => (
                      <option key={s.id} value={s.id}>
                        {idx + 1}. {s.studentName} ({s.satsNo ? `SATS: ${s.satsNo}` : `Cl: ${s.classStandard}`})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Stepper (Prev / Next) */}
              <div className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700">
                <button
                  type="button"
                  disabled={currentIdx <= 0}
                  onClick={handlePrev}
                  className="p-1 rounded-lg text-white disabled:opacity-30 hover:bg-slate-700 cursor-pointer"
                  title="Previous Student"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-black px-1.5 text-white whitespace-nowrap">
                  {filteredStudents.length > 0 ? currentIdx + 1 : 0}/{filteredStudents.length}
                </span>
                <button
                  type="button"
                  disabled={currentIdx >= filteredStudents.length - 1}
                  onClick={handleNext}
                  className="p-1 rounded-lg text-white disabled:opacity-30 hover:bg-slate-700 cursor-pointer"
                  title="Next Student"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Language Switcher */}
              <button
                type="button"
                onClick={() => setShowLanguageDialog(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-400/80 text-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                title="Change TC Language / ಭಾಷೆ ಬದಲಿಸಿ"
              >
                <Languages className="w-3.5 h-3.5 text-amber-400" />
                <span>{docLang === 'kn' ? 'ಕನ್ನಡ' : 'English'}</span>
              </button>

              {/* Edit vs Preview Toggle */}
              <button
                type="button"
                onClick={() => setIsEditMode((prev) => !prev)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer shadow-xs ${
                  isEditMode
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 font-black'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Toggle Edit Mode"
              >
                {isEditMode ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditMode ? 'ನೋಟ (View)' : 'ತಿದ್ದುಪಡಿ (Edit)'}</span>
              </button>

              {/* Duplicate Copy Toggle */}
              <label
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                  tcData?.isDuplicate
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle Duplicate TC Stamp"
              >
                <input
                  type="checkbox"
                  checked={tcData?.isDuplicate || false}
                  onChange={(e) => handleFieldChange('isDuplicate', e.target.checked)}
                  className="rounded text-rose-600 focus:ring-0 cursor-pointer"
                />
                <Copy className="w-3.5 h-3.5" />
                <span>ನಕಲು (Duplicate)</span>
              </label>

              {/* Paper Size Selector */}
              <div className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPaperSize('A4')}
                  className={`px-2 py-1 rounded-lg transition ${
                    paperSize === 'A4'
                      ? 'bg-purple-600 text-white font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A4
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('Legal')}
                  className={`px-2 py-1 rounded-lg transition ${
                    paperSize === 'Legal'
                      ? 'bg-purple-600 text-white font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Legal
                </button>
              </div>

              {/* Save Draft Button */}
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Save TC Form Draft"
              >
                <Save className="w-3.5 h-3.5 text-blue-400" />
                <span>ಉಳಿಸಿ (Draft)</span>
              </button>

              {/* Primary Action: Confirm & Open in Print Mode */}
              <button
                type="button"
                onClick={handleConfirmAndOpenPrint}
                className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                title="Confirm all entries and open in print mode"
              >
                <PrinterCheck className="w-4 h-4 text-emerald-200" />
                <span>ದೃಢೀಕರಿಸಿ & ಮುದ್ರಣ (Confirm & Print)</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Alert / Warning Banner for Already Issued TC or Status */}
          {statusMessage && (
            <div
              className={`p-2.5 px-4 text-xs font-bold flex items-center justify-between border-b ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : statusMessage.type === 'warn'
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-blue-50 text-blue-900 border-blue-200'
              }`}
            >
              <span>{statusMessage.text}</span>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-slate-500 hover:text-slate-900 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {alreadyIssuedRecord && !statusMessage && (
            <div className="bg-amber-50 border-b border-amber-200 p-2.5 px-4 text-xs flex items-center justify-between text-amber-950 font-bold">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {docLang === 'kn'
                    ? `⚠️ ಗಮನಿಸಿ: ಈ ವಿದ್ಯಾರ್ಥಿಗೆ ಈಗಾಗಲೇ ವರ್ಗಾವಣೆ ಪ್ರಮಾಣಪತ್ರ ನೀಡಲಾಗಿದೆ (TC No: ${alreadyIssuedRecord.tcNumber}). ನಕಲು ಪ್ರತಿ ನೀಡಲು ಮೇಲಿನ 'ನಕಲು' ಆಯ್ಕೆಮಾಡಿ.`
                    : `⚠️ Notice: Transfer Certificate was already issued for this student (TC No: ${alreadyIssuedRecord.tcNumber}). Select 'Duplicate' above to issue duplicate copy.`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleFieldChange('isDuplicate', true)}
                className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-black uppercase hover:bg-amber-700 transition"
              >
                {docLang === 'kn' ? 'ನಕಲು ಪ್ರತಿ ಮೋಡ್ ಆನ್ ಮಾಡಿ' : 'Enable Duplicate Mode'}
              </button>
            </div>
          )}

          {/* Top Info Banner when in Edit Mode */}
          {isEditMode && (
            <div className="bg-amber-50/90 border-b border-amber-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-amber-950">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {docLang === 'kn'
                    ? 'ತಿದ್ದುಪಡಿ ಮೋಡ್ (Editing Mode): ಅಗತ್ಯವಿರುವ ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಬದಲಾಯಿಸಿ, ನಂತರ "ದೃಢೀಕರಿಸಿ & ಮುದ್ರಣ" ಕ್ಲಿಕ್ ಮಾಡಿ.'
                    : 'Editing Mode: Review or edit any details as needed, then click "Confirm & Print" to view the clean printable certificate.'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleConfirmAndOpenPrint}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow-xs transition"
              >
                {docLang === 'kn' ? 'ದೃಢೀಕರಿಸಿ (Confirm) →' : 'Confirm & Proceed →'}
              </button>
            </div>
          )}

          {/* Certificate Main Canvas / Paper Container */}
          <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-200 print:bg-white print:p-0 flex justify-center">
            {renderCertificateContent(false)}
          </div>
        </div>
      </div>

      {/* Interactive Print & PDF Preview Modal - COMPLETELY ISOLATED HELPER & BUTTONS */}
      {showPreviewModal && (
        <TransferCertificatePreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title={labels.title}
          subtitle={`${cleanStudentName} • ${currentStudent?.classStandard ? `Class ${currentStudent.classStandard}` : ''} • SATS: ${currentStudent?.satsNo || '-'}`}
          filename={pdfFilename}
          paperSize={paperSize}
          onPaperSizeChange={(newSize) => setPaperSize(newSize)}
        >
          {renderCertificateContent(true)}
        </TransferCertificatePreviewModal>
      )}
    </>
  );
};
