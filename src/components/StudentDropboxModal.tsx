import React, { useState, useEffect, useMemo } from 'react';
import { Student, StudentClass } from '../types';
import {
  loadDeletedStudents,
  revokeDeletedStudent,
  permanentlyDeleteStudent,
  permanentlyDeleteMultipleStudents,
  clearAllDeletedStudents,
} from '../utils/studentStore';
import {
  Trash2,
  RotateCcw,
  X,
  AlertCircle,
  CheckCircle2,
  Archive,
  User,
  Hash,
  CheckSquare,
  Square,
  Filter,
} from 'lucide-react';

interface StudentDropboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  diseCode: string;
  onStudentRestored: () => void;
}

export const StudentDropboxModal: React.FC<StudentDropboxModalProps> = ({
  isOpen,
  onClose,
  diseCode,
  onStudentRestored,
}) => {
  const [deletedStudents, setDeletedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // New Selection & Filter States
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState(false);
  const [isConfirmDeleteSelectedOpen, setIsConfirmDeleteSelectedOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDeleted = async () => {
    if (!diseCode) return;
    setLoading(true);
    const list = await loadDeletedStudents(diseCode);
    setDeletedStudents(list);
    setSelectedStudentIds(new Set());
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchDeleted();
      setConfirmDeleteId(null);
      setIsConfirmClearAllOpen(false);
      setIsConfirmDeleteSelectedOpen(false);
    }
  }, [isOpen, diseCode]);

  // Available classes in the dropbox list
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    deletedStudents.forEach((s) => {
      if (s.classStandard) set.add(String(s.classStandard));
    });
    return Array.from(set).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [deletedStudents]);

  // Filtered deleted students based on selected class dropdown
  const filteredStudents = useMemo(() => {
    if (selectedClassFilter === 'ALL') return deletedStudents;
    return deletedStudents.filter((s) => String(s.classStandard) === selectedClassFilter);
  }, [deletedStudents, selectedClassFilter]);

  // Check if all currently visible students are selected
  const isAllFilteredSelected = useMemo(() => {
    if (filteredStudents.length === 0) return false;
    return filteredStudents.every((s) => selectedStudentIds.has(s.id));
  }, [filteredStudents, selectedStudentIds]);

  // Toggle select all filtered students
  const handleToggleSelectAllFiltered = () => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (isAllFilteredSelected) {
        // Deselect all in filtered list
        filteredStudents.forEach((s) => next.delete(s.id));
      } else {
        // Select all in filtered list
        filteredStudents.forEach((s) => next.add(s.id));
      }
      return next;
    });
  };

  // Toggle individual student selection
  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  const handleRevoke = async (st: Student) => {
    try {
      await revokeDeletedStudent(st.id, diseCode);
      setActionNotice(`✓ ವಿದ್ಯಾರ್ಥಿ ${st.studentName} ರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ! (Student Restored Successfully)`);
      fetchDeleted();
      onStudentRestored();
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Error revoking student:', err);
    }
  };

  const handlePermanentDelete = async (st: Student) => {
    await permanentlyDeleteStudent(st.id, diseCode);
    setConfirmDeleteId(null);
    setActionNotice(`ವಿದ್ಯಾರ್ಥಿ "${st.studentName}" ಖಾತೆಯನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲಾಗಿದೆ.`);
    fetchDeleted();
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Permanent Delete Selected Students
  const handleExecuteDeleteSelected = async () => {
    const idsToDelete = Array.from(selectedStudentIds);
    if (idsToDelete.length === 0) return;
    setIsProcessing(true);
    try {
      await permanentlyDeleteMultipleStudents(idsToDelete, diseCode);
      setActionNotice(`✓ ಆಯ್ಕೆಮಾಡಿದ ${idsToDelete.length} ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಡ್ರಾಪ್‌ಬಾಕ್ಸ್‌ನಿಂದ ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲಾಗಿದೆ.`);
      setSelectedStudentIds(new Set());
      setIsConfirmDeleteSelectedOpen(false);
      await fetchDeleted();
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Error deleting selected students:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear ALL Students in Dropbox at once
  const handleExecuteClearAllDropbox = async () => {
    setIsProcessing(true);
    try {
      await clearAllDeletedStudents(diseCode);
      setActionNotice('✓ ಡ್ರಾಪ್‌ಬಾಕ್ಸ್‌ನಲ್ಲಿರುವ ಎಲ್ಲಾ ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲಾಗಿದೆ (Dropbox Emptied Successfully).');
      setSelectedStudentIds(new Set());
      setIsConfirmClearAllOpen(false);
      await fetchDeleted();
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Error emptying dropbox:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                ಅಳಿಸಲಾದ ವಿದ್ಯಾರ್ಥಿಗಳ ಡ್ರಾಪ್‌ಬಾಕ್ಸ್ (Student Dropbox / Recycle Bin)
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300">
                Deleted students can be restored back to active enrollment or cleared individually/in bulk.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action notice */}
        {actionNotice && (
          <div className="m-3 sm:m-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Top Control Bar: Classwise Filter, Select All, Clear Selected, Clear All at Once */}
        {deletedStudents.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Left Controls: Classwise Filter & Select All */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Classwise Dropdown */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <label className="text-xs font-black text-slate-700 whitespace-nowrap">
                  ತರಗತಿ (Class):
                </label>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="bg-white border-2 border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-2.5 py-1 focus:ring-2 focus:ring-indigo-400 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Classes (ಎಲ್ಲಾ ತರಗತಿಗಳು) ({deletedStudents.length})</option>
                  {availableClasses.map((cls) => {
                    const cnt = deletedStudents.filter((s) => String(s.classStandard) === cls).length;
                    return (
                      <option key={cls} value={cls}>
                        Class {cls} ({cnt})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Select All Toggle Button */}
              <button
                type="button"
                onClick={handleToggleSelectAllFiltered}
                disabled={filteredStudents.length === 0}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-800 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                title="Select or deselect all visible students"
              >
                {isAllFilteredSelected ? (
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>
                  {isAllFilteredSelected ? 'Deselect All (ಎಲ್ಲ ರದ್ದು)' : 'Select All (ಎಲ್ಲ ಆಯ್ಕೆ)'}
                </span>
              </button>

              {/* Selected Count Indicator */}
              {selectedStudentIds.size > 0 && (
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-950 font-black text-xs rounded-lg border border-indigo-200">
                  {selectedStudentIds.size} Selected
                </span>
              )}
            </div>

            {/* Right Action Buttons: Clear Selected & Clear All Dropbox at Once */}
            <div className="flex items-center gap-2">
              {/* Delete Selected Button */}
              {selectedStudentIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteSelectedOpen(true)}
                  disabled={isProcessing}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  title="Clear selected students from Dropbox"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Selected ({selectedStudentIds.size})</span>
                </button>
              )}

              {/* CLEAR ALL STUDENTS IN DROPBOX AT ONCE BUTTON */}
              <button
                type="button"
                onClick={() => setIsConfirmClearAllOpen(true)}
                disabled={isProcessing}
                className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm border border-rose-500 transition cursor-pointer"
                title="Clear all students from Dropbox permanently at once"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All in Dropbox at Once (ಎಲ್ಲವನ್ನು ಒಮ್ಮೆಲೇ ಅಳಿಸಿ)</span>
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Clearing Selected Students */}
        {isConfirmDeleteSelectedOpen && (
          <div className="mx-4 my-2 p-3.5 bg-red-50 border-2 border-red-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in shrink-0">
            <div className="flex items-center gap-2 text-red-950 text-xs font-bold">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>
                ಖಚಿತಪಡಿಸಿ: ಆಯ್ಕೆಮಾಡಿದ <strong>{selectedStudentIds.size}</strong> ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಡ್ರಾಪ್‌ಬಾಕ್ಸ್‌ನಿಂದ ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುವುದೇ? (ಇದು ಹಿಂತಿರುಗಿಸಲಾಗದು!)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExecuteDeleteSelected}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs cursor-pointer shadow-xs"
              >
                {isProcessing ? 'ಅಳಿಸಲಾಗುತ್ತಿದೆ...' : 'ಹೌದು, ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಿ'}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmDeleteSelectedOpen(false)}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
              >
                ರದ್ದು (Cancel)
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Clearing ALL Students in Dropbox at once */}
        {isConfirmClearAllOpen && (
          <div className="mx-4 my-2 p-3.5 bg-rose-100 border-2 border-rose-400 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in shrink-0">
            <div className="flex items-center gap-2 text-rose-950 text-xs font-bold">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>
                ಎಚ್ಚರಿಕೆ: ಡ್ರಾಪ್‌ಬಾಕ್ಸ್‌ನಲ್ಲಿರುವ ಎಲ್ಲಾ <strong>{deletedStudents.length}</strong> ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಒಮ್ಮೆಲೇ ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ಬಯಸುವಿರಾ?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExecuteClearAllDropbox}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-black rounded-xl text-xs cursor-pointer shadow-xs"
              >
                {isProcessing ? 'ತೆರವುಗೊಳಿಸಲಾಗುತ್ತಿದೆ...' : 'ಹೌದು, ಎಲ್ಲಾ ಖಾಲಿ ಮಾಡಿ (Empty All)'}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmClearAllOpen(false)}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
              >
                ರದ್ದು (Cancel)
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading deleted students...</div>
          ) : deletedStudents.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-700 text-sm">Dropbox is Empty (ಕಸದಬುಟ್ಟಿ ಖಾಲಿಯಾಗಿದೆ)</p>
              <p className="text-slate-400 text-xs">No deleted students recorded for this school.</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No students found in Class {selectedClassFilter}.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-center border-collapse text-xs">
                <thead className="bg-slate-100 font-extrabold text-slate-800 uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    {/* Checkbox column */}
                    <th className="py-2.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        onChange={handleToggleSelectAllFiltered}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 cursor-pointer"
                        title="Select/Deselect All Visible"
                      />
                    </th>
                    <th className="py-2.5 px-2 text-left w-10">#</th>
                    <th className="py-2.5 px-3 text-left">ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು</th>
                    <th className="py-2.5 px-2 text-left font-mono">SATS No</th>
                    <th className="py-2.5 px-2">Class</th>
                    <th className="py-2.5 px-2">Gender</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((st, idx) => {
                    const isSelected = selectedStudentIds.has(st.id);
                    return (
                      <tr
                        key={st.id}
                        className={`transition ${isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'}`}
                      >
                        {/* Checkbox to select one by one */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectStudent(st.id)}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 cursor-pointer"
                            title={`Select ${st.studentName}`}
                          />
                        </td>
                        <td className="py-3 px-2 text-left text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 text-left font-bold text-slate-900">
                          {st.studentName}
                          {st.fatherName && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              F: {st.fatherName}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-left font-mono text-blue-900 font-semibold">
                          {st.satsNo}
                        </td>
                        <td className="py-3 px-2 font-bold text-slate-700">Class {st.classStandard}</td>
                        <td className="py-3 px-2 text-slate-600">{st.gender || '-'}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {confirmDeleteId === st.id ? (
                              <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-xl border border-red-200">
                                <span className="text-[11px] font-black text-red-700 px-1">ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುವುದೇ?</span>
                                <button
                                  type="button"
                                  onClick={() => handlePermanentDelete(st)}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-black text-[10px] cursor-pointer"
                                >
                                  ಹೌದು, ಅಳಿಸಿ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-[10px] cursor-pointer"
                                >
                                  ರದ್ದು
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRevoke(st)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs shadow-xs transition cursor-pointer"
                                  title="Restore student to active class roster"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Revoke / Restore (ಮರುಸ್ಥಾಪಿಸಿ)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(st.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                  title="Permanently remove"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-3 flex flex-wrap justify-between items-center gap-2 text-xs shrink-0">
          <div className="flex items-center gap-3 text-slate-600">
            <span>
              Total in Dropbox: <strong>{deletedStudents.length}</strong>
            </span>
            {selectedClassFilter !== 'ALL' && (
              <span>
                • In Class {selectedClassFilter}: <strong>{filteredStudents.length}</strong>
              </span>
            )}
            {selectedStudentIds.size > 0 && (
              <span className="text-indigo-700 font-bold">
                • Selected: <strong>{selectedStudentIds.size}</strong>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold cursor-pointer transition"
          >
            Close (ಮುಚ್ಚಿ)
          </button>
        </div>
      </div>
    </div>
  );
};
