import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Users,
  ShieldCheck,
  Check,
  Calendar,
  Hash,
  HelpCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Student } from '../types';
import {
  ReconciliationResult,
  ReconciliationCandidate,
  applyReconciliationUpdates,
} from '../utils/satsUdiseReconciliationHelper';

interface SatsUdiseReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reconciliationResult: ReconciliationResult;
  diseCode: string;
  academicYear: string;
  onSuccess: (updatedCount: number, newAddedCount: number) => void;
}

export const SatsUdiseReconciliationModal: React.FC<SatsUdiseReconciliationModalProps> = ({
  isOpen,
  onClose,
  reconciliationResult,
  diseCode,
  academicYear,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'updates' | 'conflicts' | 'newStudents' | 'audit'>('updates');
  const [candidates, setCandidates] = useState<ReconciliationCandidate[]>(
    reconciliationResult.candidatesToUpdate
  );
  const [conflicts, setConflicts] = useState<ReconciliationCandidate[]>(
    reconciliationResult.conflicts
  );
  const [newStudentsToImport, setNewStudentsToImport] = useState<Student[]>(
    reconciliationResult.satsOnlyNewStudents
  );
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const approvedCandidatesCount = candidates.filter((c) => c.userApproved).length;
  const approvedConflictsCount = conflicts.filter((c) => c.userApproved).length;

  const handleToggleCandidate = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, userApproved: !c.userApproved } : c))
    );
  };

  const handleToggleAllCandidates = (approved: boolean) => {
    setCandidates((prev) => prev.map((c) => ({ ...c, userApproved: approved })));
  };

  const handleToggleConflict = (id: string, approved: boolean) => {
    setConflicts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, userApproved: approved } : c))
    );
  };

  const handleConfirmAndApply = async () => {
    setIsApplying(true);
    try {
      const allApproved = [
        ...candidates.filter((c) => c.userApproved),
        ...conflicts.filter((c) => c.userApproved),
      ];

      const res = await applyReconciliationUpdates(
        allApproved,
        newStudentsToImport,
        diseCode,
        academicYear,
        reconciliationResult.batchId
      );

      if (res.success) {
        onSuccess(res.updatedCount, res.newAddedCount);
        onClose();
      }
    } catch (err: any) {
      alert(`Reconciliation error: ${err?.message || 'Failed to apply updates'}`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleAcceptAllAndApply = async () => {
    const allCandidatesApproved = candidates.map((c) => ({ ...c, userApproved: true }));
    setCandidates(allCandidatesApproved);

    setIsApplying(true);
    try {
      const allToApply = [
        ...allCandidatesApproved,
        ...conflicts.filter((c) => c.userApproved),
      ];

      const res = await applyReconciliationUpdates(
        allToApply,
        newStudentsToImport,
        diseCode,
        academicYear,
        reconciliationResult.batchId
      );

      if (res.success) {
        onSuccess(res.updatedCount, res.newAddedCount);
        onClose();
      }
    } catch (err: any) {
      alert(`Reconciliation error: ${err?.message || 'Failed to apply updates'}`);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-indigo-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>SATS–UDISE Plus Reconciliation & Missing Details Update</span>
              </h3>
              <p className="text-xs text-indigo-200 font-medium">
                SATS ಸಂಖ್ಯೆ ಮತ್ತು ಜನ್ಮ ದಿನಾಂಕ (DOB) ಸಂಯೋಜನೆ ಹಾಗೂ ನವೀಕರಣ ವ್ಯವಸ್ಥೆ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Total SATS File</div>
            <div className="text-base font-black text-slate-900 mt-0.5">
              {reconciliationResult.totalIncoming}
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/50">
            <div className="text-[10px] text-emerald-800 font-bold uppercase">Updates Ready</div>
            <div className="text-base font-black text-emerald-700 mt-0.5">
              {candidates.length}
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-amber-300 bg-amber-50/50">
            <div className="text-[10px] text-amber-800 font-bold uppercase">Conflicts Flagged</div>
            <div className="text-base font-black text-amber-700 mt-0.5">
              {conflicts.length}
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-blue-200">
            <div className="text-[10px] text-blue-700 font-bold uppercase">Already in Sync</div>
            <div className="text-base font-black text-blue-900 mt-0.5">
              {reconciliationResult.alreadyInSyncCount}
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-purple-200 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-purple-700 font-bold uppercase">New Admissions</div>
            <div className="text-base font-black text-purple-900 mt-0.5">
              {newStudentsToImport.length}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-slate-200 px-6 pt-3 flex items-center gap-2 shrink-0 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('updates')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'updates'
                ? 'border-indigo-600 text-indigo-900 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Missing SATS & DOB Updates ({candidates.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('conflicts')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'conflicts'
                ? 'border-indigo-600 text-indigo-900 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Conflicts & Review ({conflicts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('newStudents')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'newStudents'
                ? 'border-indigo-600 text-indigo-900 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span>New SATS Admissions ({newStudentsToImport.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-900 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Safety Guarantees & Batch Audit</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: UPDATES */}
          {activeTab === 'updates' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-indigo-50/60 border border-indigo-200 rounded-2xl text-xs text-indigo-950">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    ಖಚಿತ ಹೊಂದಾಣಿಕೆಯಾದ ವಿದ್ಯಾರ್ಥಿಗಳಲ್ಲಿ ಕೇವಲ ಕಾಣೆಯಾದ (Missing) SATS ಸಂಖ್ಯೆ ಮತ್ತು DOB ಮಾತ್ರ ನವೀಕರಿಸಲಾಗುತ್ತದೆ. ಹೆಸರು, ತರಗತಿ ಹಾಗೂ ಅಂಕಗಳು ಬದಲಾಗುವುದಿಲ್ಲ.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleAcceptAllAndApply}
                    disabled={isApplying || candidates.length === 0}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
                    title="Accept all matched updates for DOB & SATS No. in one click"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>⚡ ಎಲ್ಲವನ್ನೂ ಒಪ್ಪಿಕೊಳ್ಳಿ (Accept All Matched)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAllCandidates(true)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-800 cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAllCandidates(false)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-800 cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {candidates.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  ✓ ಯಾವುದೇ ಕಾಣೆಯಾದ SATS ಸಂಖ್ಯೆ ಅಥವಾ DOB ನವೀಕರಣಗಳಿಲ್ಲ. ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ!
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">✓</th>
                        <th className="py-2.5 px-3">Class</th>
                        <th className="py-2.5 px-3">Existing Student (UDISE / SRMS)</th>
                        <th className="py-2.5 px-3">Father's Name (Middle Name)</th>
                        <th className="py-2.5 px-3">SATS No. Update</th>
                        <th className="py-2.5 px-3">DOB Update</th>
                        <th className="py-2.5 px-3">Matching Method & Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {candidates.map((cand) => (
                        <tr
                          key={cand.id}
                          className={`transition ${
                            cand.userApproved ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60 opacity-60'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={cand.userApproved}
                              onChange={() => handleToggleCandidate(cand.id)}
                              className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-bold text-blue-900">
                            Class {cand.existingStudent.classStandard}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-black text-slate-900">
                              {cand.existingStudent.studentName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {cand.existingStudent.id}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            <div>{cand.existingStudent.fatherName || '-'}</div>
                            {cand.matchingMethod === 'EMBEDDED_FATHER_MIDDLE_NAME' && (
                              <span className="inline-block mt-0.5 text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                                Middle Name Embedded
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {cand.proposedSatsNo ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 line-through text-[11px]">
                                  {cand.existingStudent.satsNo || 'Missing'}
                                </span>
                                <ArrowRight className="w-3 h-3 text-emerald-600" />
                                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                  {cand.proposedSatsNo}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 font-bold">
                                {cand.existingStudent.satsNo || '-'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {cand.proposedDob ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 line-through text-[11px]">
                                  {cand.existingStudent.dob || cand.existingStudent.dateOfBirth || 'Missing'}
                                </span>
                                <ArrowRight className="w-3 h-3 text-indigo-600" />
                                <span className="font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                                  {cand.proposedDob}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 font-bold">
                                {cand.existingStudent.dob || cand.existingStudent.dateOfBirth || '-'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                cand.confidenceScore >= 95
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : cand.confidenceScore >= 90
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}
                            >
                              {cand.confidenceLabel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONFLICTS */}
          {activeTab === 'conflicts' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">ಗಮನಿಸಿ (Manual Review Required):</span> ಈ ಕೆಳಗಿನ ದಾಖಲೆಗಳಲ್ಲಿ ಹಿಂದಿನ ವಿವರಗಳಿಗೂ ಮತ್ತು SATS ಫೈಲ್‌ನಲ್ಲಿರುವ ವಿವರಗಳಿಗೂ ವ್ಯತ್ಯಾಸ ಕಂಡುಬಂದಿದೆ. ನೀವು ಪರಿಶೀಲಿಸಿ ಅನುಮೋದಿಸಿದರೆ ಮಾತ್ರ ನವೀಕರಿಸಲಾಗುತ್ತದೆ.
                </div>
              </div>

              {conflicts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  ✓ ಯಾವುದೇ ವಿವಾದಾತ್ಮಕ (Conflicting) ದಾಖಲೆಗಳಿಲ್ಲ!
                </div>
              ) : (
                <div className="space-y-3">
                  {conflicts.map((conf) => (
                    <div
                      key={conf.id}
                      className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs border border-amber-300">
                            {conf.conflictType || 'CONFLICT'}
                          </span>
                          <span className="font-black text-slate-900 text-xs">
                            {conf.existingStudent.studentName} (Class {conf.existingStudent.classStandard})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleConflict(conf.id, true)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                              conf.userApproved
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            ✓ Accept SATS Update
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleConflict(conf.id, false)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                              !conf.userApproved
                                ? 'bg-slate-800 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            Keep Existing (Skip)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">
                            Existing Student Record (SRMS / UDISE)
                          </div>
                          <div className="mt-1 space-y-0.5">
                            <div><span className="font-bold">Name:</span> {conf.existingStudent.studentName}</div>
                            <div><span className="font-bold">Father:</span> {conf.existingStudent.fatherName || '-'}</div>
                            <div><span className="font-bold">SATS:</span> {conf.existingStudent.satsNo || 'Missing'}</div>
                            <div><span className="font-bold">DOB:</span> {conf.existingStudent.dob || conf.existingStudent.dateOfBirth || '-'}</div>
                          </div>
                        </div>

                        <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200">
                          <div className="text-[10px] font-bold text-amber-800 uppercase">
                            Incoming SATS Record
                          </div>
                          <div className="mt-1 space-y-0.5">
                            <div><span className="font-bold">Name:</span> {conf.incomingStudent.studentName}</div>
                            <div><span className="font-bold">Father:</span> {conf.incomingStudent.fatherName || '-'}</div>
                            <div><span className="font-bold">SATS:</span> {conf.incomingStudent.satsNo || '-'}</div>
                            <div><span className="font-bold">DOB:</span> {conf.incomingStudent.dob || conf.incomingStudent.dateOfBirth || '-'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-amber-900 bg-amber-100/60 p-2 rounded-lg font-medium">
                        ⚠️ {conf.conflictDescription}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NEW SATS STUDENTS */}
          {activeTab === 'newStudents' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-950 flex items-center justify-between">
                <span>
                  ಈ ವಿದ್ಯಾರ್ಥಿಗಳು SATS ಫೈಲ್‌ನಲ್ಲಿ ಮಾತ್ರ ಹೊಸದಾಗಿ ಕಂಡುಬಂದಿದ್ದು, ಶಾಲೆಯಲ್ಲಿ ಈಗಾಗಲೇ ಯಾವುದೇ ಹೊಂದಾಣಿಕೆಯಾಗುವ ದಾಖಲೆಗಳಿಲ್ಲ. ಇವುಗಳನ್ನು ಹೊಸ ಪ್ರವೇಶಗಳಾಗಿ ಸೇರಿಸಲಾಗುತ್ತದೆ.
                </span>
                <span className="font-black text-purple-800">
                  {newStudentsToImport.length} New Students
                </span>
              </div>

              {newStudentsToImport.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  ✓ ಯಾವುದೇ ಪ್ರತ್ಯೇಕ ಹೊಸ ವಿದ್ಯಾರ್ಥಿಗಳಿಲ್ಲ.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Class</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Father Name</th>
                        <th className="py-2.5 px-3">DOB</th>
                        <th className="py-2.5 px-3">SATS No</th>
                        <th className="py-2.5 px-3">Gender</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {newStudentsToImport.map((st, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-blue-900">
                            Class {st.classStandard}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">
                            {st.studentName}
                          </td>
                          <td className="py-2 px-3 text-slate-700">{st.fatherName || '-'}</td>
                          <td className="py-2 px-3 font-mono">{st.dob || st.dateOfBirth || '-'}</td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-700">
                            {st.satsNo || '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{st.gender || 'Boy'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIT */}
          {activeTab === 'audit' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Reconciliation Safety & Deduplication Guarantees</span>
                </div>
                <ul className="list-disc list-inside text-slate-600 space-y-1 leading-relaxed">
                  <li>
                    <b>Document ID Preservation:</b> Existing SRMS student IDs are preserved intact. A new student is never created merely because SATS No. was missing in UDISE Plus.
                  </li>
                  <li>
                    <b>Field Integrity:</b> Student name, father's name, class, marks, caste, religion, and gender are <b>never modified</b>. Only missing SATS No. and missing DOB are updated.
                  </li>
                  <li>
                    <b>Re-Import Safety:</b> Once a SATS No. is populated, re-uploading the same SATS file recognizes that the record is already in sync and will not create duplicate entries.
                  </li>
                  <li>
                    <b>SATS Uniqueness:</b> Prevents assigning a SATS number if it is already associated with any other student in the same school.
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Batch Identifier</span>
                  <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">{reconciliationResult.batchId}</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Analysis Timestamp</span>
                  <span className="font-mono text-slate-700 text-xs mt-0.5 block">{reconciliationResult.timestamp}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* One-Click Bulk Accept All Matched Updates */}
            {candidates.length > 0 && (
              <button
                type="button"
                onClick={handleAcceptAllAndApply}
                disabled={isApplying}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg transition cursor-pointer ring-2 ring-emerald-300 transform hover:-translate-y-0.5"
                title="Confirm and accept all matched DOB & SATS updates in one single click"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>
                  {isApplying
                    ? 'Updating...'
                    : `⚡ ಎಲ್ಲವನ್ನೂ ಒಪ್ಪಿಕೊಳ್ಳಿ (Accept All ${candidates.length} Matched at Once)`}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirmAndApply}
              disabled={isApplying || (approvedCandidatesCount === 0 && approvedConflictsCount === 0 && newStudentsToImport.length === 0)}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {isApplying
                  ? 'Applying Updates...'
                  : `Confirm & Apply (${approvedCandidatesCount + approvedConflictsCount} Selected)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
