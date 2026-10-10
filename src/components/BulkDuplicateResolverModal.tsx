import React, { useState } from 'react';
import { AlertTriangle, Check, X, RefreshCw, UserCheck, Copy, ArrowRight, ShieldCheck } from 'lucide-react';
import { Student } from '../types';

export interface BulkDuplicatePair {
  existing: Student;
  incoming: Student;
  matchReason: string;
  resolution: 'skip' | 'overwrite' | 'keepBoth';
}

interface BulkDuplicateResolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicatePairs: BulkDuplicatePair[];
  newUniqueStudentsCount: number;
  onConfirmResolution: (resolvedPairs: BulkDuplicatePair[]) => void;
}

export const BulkDuplicateResolverModal: React.FC<BulkDuplicateResolverModalProps> = ({
  isOpen,
  onClose,
  duplicatePairs: initialPairs,
  newUniqueStudentsCount,
  onConfirmResolution,
}) => {
  const [pairs, setPairs] = useState<BulkDuplicatePair[]>(initialPairs);

  if (!isOpen || pairs.length === 0) return null;

  const handleSetAll = (resolution: 'skip' | 'overwrite' | 'keepBoth') => {
    setPairs((prev) => prev.map((p) => ({ ...p, resolution })));
  };

  const handleTogglePair = (idx: number, resolution: 'skip' | 'overwrite' | 'keepBoth') => {
    setPairs((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], resolution };
      return copy;
    });
  };

  const handleConfirm = () => {
    onConfirmResolution(pairs);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-amber-300 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Duplicate Records Review ({pairs.length} Duplicates Detected)</span>
              </h3>
              <p className="text-xs text-amber-200 font-medium">
                {newUniqueStudentsCount} new unique students ready • {pairs.length} duplicates need review
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

        {/* Global Quick Action Toolbar */}
        <div className="bg-amber-50 p-3.5 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
            <span>Quick Batch Action for All {pairs.length} Duplicates:</span>
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSetAll('skip')}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Skip All Duplicates (ಸೇರಿಸಬೇಡಿ)
            </button>
            <button
              type="button"
              onClick={() => handleSetAll('overwrite')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Update All Existing (ನವೀಕರಿಸಿ)
            </button>
            <button
              type="button"
              onClick={() => handleSetAll('keepBoth')}
              className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Keep All (ಎರಡನ್ನೂ ಉಳಿಸಿ)
            </button>
          </div>
        </div>

        {/* Duplicates List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {pairs.map((pair, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border-2 transition ${
                pair.resolution === 'skip'
                  ? 'bg-slate-50 border-slate-300'
                  : pair.resolution === 'overwrite'
                  ? 'bg-amber-50/70 border-amber-400'
                  : 'bg-blue-50/70 border-blue-400'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {pair.incoming.studentName}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-200">
                    Match: {pair.matchReason}
                  </span>
                </div>

                {/* Per-item resolution buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTogglePair(idx, 'skip')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      pair.resolution === 'skip'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Skip (ಬಿಡಿ)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePair(idx, 'overwrite')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      pair.resolution === 'overwrite'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Update (ನವೀಕರಿಸಿ)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePair(idx, 'keepBoth')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      pair.resolution === 'keepBoth'
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Keep Both (ಉಳಿಸಿ)
                  </button>
                </div>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                {/* Existing */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">
                    Currently in Database:
                  </span>
                  <div>
                    <span className="text-slate-600">Class: </span>
                    <span className="font-bold text-slate-900 font-mono">
                      Class {pair.existing.classStandard}-{pair.existing.division}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="text-slate-600">SATS: </span>
                    <span className="font-bold text-blue-900 font-mono">{pair.existing.satsNo || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Father: </span>
                    <span className="font-medium text-slate-900">{pair.existing.fatherName || '-'}</span>
                    <span className="mx-2">•</span>
                    <span className="text-slate-600">DOB: </span>
                    <span className="font-medium text-slate-900 font-mono">{pair.existing.dob || pair.existing.dateOfBirth || '-'}</span>
                  </div>
                </div>

                {/* Incoming */}
                <div className="p-2.5 bg-white rounded-xl border border-amber-200 space-y-1">
                  <span className="text-[10px] font-bold text-amber-700 block uppercase">
                    Incoming Record:
                  </span>
                  <div>
                    <span className="text-slate-600">Class: </span>
                    <span className="font-bold text-slate-900 font-mono">
                      Class {pair.incoming.classStandard}-{pair.incoming.division}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="text-slate-600">SATS: </span>
                    <span className="font-bold text-blue-900 font-mono">{pair.incoming.satsNo || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Father: </span>
                    <span className="font-medium text-slate-900">{pair.incoming.fatherName || '-'}</span>
                    <span className="mx-2">•</span>
                    <span className="text-slate-600">DOB: </span>
                    <span className="font-medium text-slate-900 font-mono">{pair.incoming.dob || pair.incoming.dateOfBirth || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer transition"
          >
            Cancel (ರದ್ದುಮಾಡಿ)
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Confirm & Proceed ({pairs.length} Duplicates Resolved)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
