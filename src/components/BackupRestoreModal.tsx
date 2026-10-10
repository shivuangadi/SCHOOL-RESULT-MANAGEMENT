import React, { useState, useRef } from 'react';
import { SchoolRecord, Student } from '../types';
import {
  exportSchoolDataToJson,
  parseAndValidateBackupJson,
  restoreSchoolDataFromJson,
  SchoolBackupBundle,
} from '../utils/backupRestoreHelper';
import {
  X,
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolRecord: SchoolRecord | null;
  diseCode: string;
  academicYear?: string;
  activeStudents?: Student[];
  onDataRestored?: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  schoolRecord,
  diseCode,
  academicYear = '2026-27',
  activeStudents,
  onDataRestored,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [parsedBundle, setParsedBundle] = useState<SchoolBackupBundle | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportSchoolDataToJson(diseCode, schoolRecord, academicYear, activeStudents);
      showToast('✓ ಶಾಲೆಯ ಸಂಪೂರ್ಣ ದತ್ತಾಂಶವನ್ನು ಯಶಸ್ವಿಯಾಗಿ JSON ಫೈಲ್‌ಗೆ ಬ್ಯಾಕಪ್ ಮಾಡಲಾಗಿದೆ!');
    } catch (err: any) {
      alert(`Export error: ${err?.message || 'Could not download backup'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);
    setParsedBundle(null);

    // If user selected an Excel sheet by mistake, give helpful guidance
    if (file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setErrorMessage(
        'Excel ಫೈಲ್ (.xlsx) ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ. ದಯವಿಟ್ಟು .json ಬ್ಯಾಕಪ್ ಫೈಲ್ ಆಯ್ಕೆ ಮಾಡಿ, ಅಥವಾ Excel ಫೈಲ್ ಅನ್ನು Student Database ನಲ್ಲಿ "IMPORT EXCEL (SATS Sheet)" ಮೂಲಕ ಆಮದು ಮಾಡಿಕೊಳ್ಳಿ.'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const { isValid, bundle, error } = parseAndValidateBackupJson(content);
      if (!isValid || !bundle) {
        setErrorMessage(error || 'Invalid backup file structure. Please check the JSON file.');
      } else {
        setParsedBundle(bundle);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      setErrorMessage('Could not read the selected file. ಫೈಲ್ ಓದಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!parsedBundle) return;

    setIsRestoring(true);
    setErrorMessage(null);

    try {
      const result = await restoreSchoolDataFromJson(parsedBundle, diseCode);
      showToast(
        `✓ ಯಶಸ್ವಿಯಾಗಿ ಪುನಃಸ್ಥಾಪಿಸಲಾಗಿದೆ! (${result.studentsCount} ವಿದ್ಯಾರ್ಥಿಗಳು ಮತ್ತು ಫಲಿತಾಂಶ ದಾಖಲೆಗಳು)`
      );
      setParsedBundle(null);
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onDataRestored) {
        onDataRestored();
      }
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(`Restore error: ${err?.message || 'Failed to restore data'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-60 p-4 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-2xl border-2 border-blue-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>ದತ್ತಾಂಶ ಬ್ಯಾಕಪ್ & ಪುನಃಸ್ಥಾಪನೆ (Backup & Restore)</span>
              </h3>
              <p className="text-xs text-blue-200 font-medium">
                JSON ಫೈಲ್ ಮೂಲಕ ಶಾಲೆಯ ಎಲ್ಲಾ ವಿದ್ಯಾರ್ಥಿಗಳ ಹಾಗೂ ಅಂಕಗಳ ವಿವರಗಳ ರಕ್ಷಣೆ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-slate-800 text-xs sm:text-sm">
          {/* Security Banner */}
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-black text-blue-950 text-xs sm:text-sm block">
                ದತ್ತಾಂಶ ಸಂರಕ್ಷಣೆಯ ಭರವಸೆ (100% Data Protection):
              </span>
              <p className="text-xs text-blue-800 leading-relaxed">
                ನಿಮ್ಮ ಶಾಲೆಯ ನೋಂದಾಯಿತ ವಿದ್ಯಾರ್ಥಿಗಳು, ವರ್ಗವಾರು ಅಂಕಗಳು ಮತ್ತು ಶಾಲಾ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ನಿಮ್ಮ ಕಂಪ್ಯೂಟರ್/ಮೊಬೈಲ್‌ನಲ್ಲಿ ಸುರಕ್ಷಿತ JSON ಫೈಲ್ ರೂಪದಲ್ಲಿ ಇರಿಸಿಕೊಳ್ಳಿ. ಇಂಟರ್ನೆಟ್ ಅಥವಾ ಸಾಧನ ಬದಲಾದಾಗಲೂ ಸುಲಭವಾಗಿ ಮರುಪಡೆಯಬಹುದು.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Action 1: Download Backup */}
            <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Download className="w-4 h-4" />
                  </div>
                  <span className="font-black text-emerald-950 text-sm">
                    ೧. ಬ್ಯಾಕಪ್ ಡೌನ್‌ಲೋಡ್ (Backup)
                  </span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  ಪ್ರಸ್ತುತ ಶಾಲೆಯ ಎಲ್ಲಾ ತರಗತಿಗಳ ವಿದ್ಯಾರ್ಥಿಗಳು, ಸಹಪಠ್ಯ ಹಾಗೂ ಶೈಕ್ಷಣಿಕ ಅಂಕಗಳ ಒಟ್ಟು ದತ್ತಾಂಶವನ್ನು `.json` ಫೈಲ್ ಆಗಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.
                </p>
              </div>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExport}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <FileJson className="w-4 h-4 text-emerald-200" />
                <span>{isExporting ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ (Download Backup)'}</span>
              </button>
            </div>

            {/* Action 2: Restore from Backup */}
            <div className="p-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 transition space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="font-black text-indigo-950 text-sm">
                    ೨. ಪುನಃಸ್ಥಾಪನೆ (Restore Data)
                  </span>
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed">
                  ಹಿಂದೆ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿದ `.json` ಬ್ಯಾಕಪ್ ಫೈಲ್ ಅನ್ನು ಆಯ್ಕೆ ಮಾಡಿ ಶಾಲೆಯ ಎಲ್ಲಾ ಮಾಹಿತಿಯನ್ನು ಮರಳಿ ಪಡೆಯಿರಿ.
                </p>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <FileJson className="w-4 h-4 text-indigo-200" />
                  <span>JSON ಫೈಲ್ ಆಯ್ಕೆ ಮಾಡಿ (Select File)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Restore Confirmation Card if File Loaded */}
          {parsedBundle && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <span className="font-black text-amber-950 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>ಬ್ಯಾಕಪ್ ಫೈಲ್ ವಿವರಗಳು (File Overview):</span>
                </span>
                <span className="font-mono text-[11px] font-bold text-amber-800 truncate max-w-[200px]">
                  {fileName}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-white rounded-xl border border-amber-200">
                  <span className="text-[10px] text-slate-500 block">ಶಾಲೆ (School):</span>
                  <span className="font-bold text-slate-900 truncate block">
                    {parsedBundle.schoolName || 'Govt School'}
                  </span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-amber-200">
                  <span className="text-[10px] text-slate-500 block">DISE ಕೋಡ್:</span>
                  <span className="font-mono font-bold text-slate-900 block">
                    {parsedBundle.diseCode}
                  </span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-amber-200">
                  <span className="text-[10px] text-slate-500 block">ಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು:</span>
                  <span className="font-bold text-emerald-700 block">
                    {parsedBundle.data.students?.length || 0} Students
                  </span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-amber-200">
                  <span className="text-[10px] text-slate-500 block">ಅಂಕಗಳ ದಾಖಲೆ:</span>
                  <span className="font-bold text-indigo-700 block">
                    {Object.keys(parsedBundle.data.marks || {}).length} Records
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setParsedBundle(null);
                    setFileName('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel (ರದ್ದು)
                </button>
                <button
                  type="button"
                  disabled={isRestoring}
                  onClick={handleConfirmRestore}
                  className="px-5 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                  <span>{isRestoring ? 'ಪುನಃಸ್ಥಾಪಿಸಲಾಗುತ್ತಿದೆ...' : 'ದೃಢೀಕರಿಸಿ & ಪುನಃಸ್ಥಾಪಿಸಿ (Confirm Restore)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Close (ಮುಚ್ಚಿ)
          </button>
        </div>
      </div>
    </div>
  );
};
