import React from 'react';
import { AlertTriangle, Check, X, RefreshCw, UserCheck, Copy, ArrowRight } from 'lucide-react';
import { Student } from '../types';

export interface DuplicateConflict {
  existingStudent: Student;
  incomingStudent: Student;
  matchedBy: 'satsNo' | 'nameAndClass' | 'id';
}

interface DuplicateRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: DuplicateConflict | null;
  onKeepExisting: () => void;
  onOverwriteExisting: () => void;
  onKeepBoth: () => void;
}

export const DuplicateRecordModal: React.FC<DuplicateRecordModalProps> = ({
  isOpen,
  onClose,
  conflict,
  onKeepExisting,
  onOverwriteExisting,
  onKeepBoth,
}) => {
  if (!isOpen || !conflict) return null;

  const { existingStudent, incomingStudent, matchedBy } = conflict;

  const matchLabel =
    matchedBy === 'satsNo'
      ? `SATS No: ${existingStudent.satsNo}`
      : matchedBy === 'nameAndClass'
      ? `Name & Class: ${existingStudent.studentName} (Class ${existingStudent.classStandard})`
      : `Student ID: ${existingStudent.id}`;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-amber-300 w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Duplicate Record Detected (ನಕಲಿ ದಾಖಲೆ ಪತ್ತೆಯಾಗಿದೆ)</span>
              </h3>
              <p className="text-xs text-amber-200 font-medium">
                Matched by: <span className="font-mono font-bold text-white">{matchLabel}</span>
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 text-xs sm:text-sm">
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">ಎಚ್ಚರಿಕೆ (Duplicate Notice):</span> ಈ ವಿದ್ಯಾರ್ಥಿಯ ವಿವರಗಳು ಈಗಾಗಲೇ ಶಾಲಾ ದತ್ತಾಂಶದಲ್ಲಿ ಲಭ್ಯವಿವೆ. ನಕಲಿ ದಾಖಲೆಗಳನ್ನು ತಪ್ಪಿಸಲು ಕೆಳಗಿನ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಸೂಕ್ತ ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ.
            </div>
          </div>

          {/* Side by Side Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Existing Student Card */}
            <div className="p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-black text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span>Existing Record (ಹಾಲಿ ಇರುವ ದಾಖಲೆ)</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-mono text-[10px] font-bold">
                  In Database
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು:</span>
                  <span className="font-bold text-slate-900">{existingStudent.studentName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">ತರಗತಿ & ವಿಭಾಗ:</span>
                    <span className="font-mono font-bold text-slate-900">
                      Class {existingStudent.classStandard} - {existingStudent.division}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">ಲಿಂಗ:</span>
                    <span className="font-bold text-slate-900">{existingStudent.gender || 'Boy'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">SATS ಸಂಖ್ಯೆ:</span>
                  <span className="font-mono font-black text-blue-900">{existingStudent.satsNo || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">ತಂದೆಯ ಹೆಸರು:</span>
                  <span className="font-bold text-slate-800">{existingStudent.fatherName || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">ಜನ್ಮ ದಿನಾಂಕ (DOB):</span>
                  <span className="font-mono font-bold text-slate-800">{existingStudent.dob || existingStudent.dateOfBirth || '-'}</span>
                </div>
              </div>
            </div>

            {/* Incoming Student Card */}
            <div className="p-4 bg-amber-50/60 border-2 border-amber-300 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <span className="font-black text-amber-950 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <Copy className="w-4 h-4 text-amber-700" />
                  <span>Incoming Record (ಹೊಸದಾಗಿ ಬಂದಿರುವ ವಿವರ)</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 font-mono text-[10px] font-bold">
                  New Input
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು:</span>
                  <span className="font-bold text-slate-900">{incomingStudent.studentName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">ತರಗತಿ & ವಿಭಾಗ:</span>
                    <span className="font-mono font-bold text-slate-900">
                      Class {incomingStudent.classStandard} - {incomingStudent.division}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">ಲಿಂಗ:</span>
                    <span className="font-bold text-slate-900">{incomingStudent.gender || 'Boy'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">SATS ಸಂಖ್ಯೆ:</span>
                  <span className="font-mono font-black text-blue-900">{incomingStudent.satsNo || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">ತಂದೆಯ ಹೆಸರು:</span>
                  <span className="font-bold text-slate-800">{incomingStudent.fatherName || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">ಜನ್ಮ ದಿನಾಂಕ (DOB):</span>
                  <span className="font-mono font-bold text-slate-800">{incomingStudent.dob || incomingStudent.dateOfBirth || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer transition"
          >
            Cancel (ರದ್ದುಮಾಡಿ)
          </button>

          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
            {/* Option 1: Keep Existing (Skip/Do not add) */}
            <button
              type="button"
              onClick={onKeepExisting}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Do not add this duplicate, keep the record already in database"
            >
              <X className="w-3.5 h-3.5" />
              <span>Keep Existing (ಸೇರಿಸಬೇಡಿ / Skip)</span>
            </button>

            {/* Option 2: Overwrite / Update */}
            <button
              type="button"
              onClick={onOverwriteExisting}
              className="flex-1 sm:flex-none px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Update existing student with incoming details"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update Existing (ನವೀಕರಿಸಿ)</span>
            </button>

            {/* Option 3: Keep Both */}
            <button
              type="button"
              onClick={onKeepBoth}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Add as a new separate student anyway"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Keep Both (ಹೊಸದಾಗಿ ಸೇರಿಸಿ)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
