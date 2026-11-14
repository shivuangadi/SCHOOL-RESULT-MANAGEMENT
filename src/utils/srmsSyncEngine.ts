/**
 * ============================================================================
 * SRMS AUTOMATIC TWO-WAY FIREBASE CLOUD SYNCHRONISATION ENGINE
 * Project: School Result Management System by Shri S. R. Angadi
 *
 * Firebase Cloud is ALWAYS the central database and authoritative source of truth.
 * IndexedDB is the reliable persistent local offline working store.
 * ============================================================================
 */

import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import {
  dbPut,
  dbGet,
  dbGetAll,
  dbGetAllByIndex,
  dbDelete,
  dbPutBatch,
  SyncQueueItem,
  SyncLogItem,
  requestPersistentStorage,
} from '../lib/indexedDb';
import { cleanForFirestore, normalizeStudentDates } from './studentStore';
import { Student, StudentExamMarks, SchoolRecord } from '../types';

export type SyncState =
  | 'ONLINE_SYNCED'
  | 'OFFLINE_LOCAL'
  | 'SYNCING'
  | 'PENDING_SYNC'
  | 'SYNC_ERROR';

export interface SyncEngineStatus {
  isOnline: boolean;
  isFirebaseConnected: boolean;
  syncState: SyncState;
  stateLabelKn: string;
  stateLabelEn: string;
  lastSyncTime: string | null;
  pendingCount: number;
  syncedCount: number;
  failedCount: number;
  lastError: string | null;
  activeDise: string | null;
}

export type SyncEngineState = SyncEngineStatus;
export type { SyncLogItem };

type SyncListener = (status: SyncEngineStatus) => void;

class SrmsSyncEngine {
  public getState(): SyncEngineStatus {
    return this.getStatus();
  }

  public async syncNow(diseCode?: string, academicYear?: string): Promise<void> {
    return this.triggerManualSync(diseCode, academicYear);
  }
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private currentDise: string | null = null;
  private currentAcademicYear: string = '2026-27';
  private periodicInterval: any = null;

  private status: SyncEngineStatus = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isFirebaseConnected: true,
    syncState: typeof navigator !== 'undefined' && navigator.onLine ? 'ONLINE_SYNCED' : 'OFFLINE_LOCAL',
    stateLabelKn: 'ಕ್ಲೌಡ್ ಸಿಂಕ್ ಪೂರ್ಣಗೊಂಡಿದೆ',
    stateLabelEn: 'ONLINE – SYNCED',
    lastSyncTime: typeof localStorage !== 'undefined' ? localStorage.getItem('srms_last_sync_time') : null,
    pendingCount: 0,
    syncedCount: 0,
    failedCount: 0,
    lastError: null,
    activeDise: null,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initNetworkListeners();
      this.initLifecycleTriggers();
      requestPersistentStorage().catch(() => {});
      this.refreshQueueCounts();
    }
  }

  public setActiveContext(diseCode: string, academicYear?: string) {
    if (diseCode && diseCode !== this.currentDise) {
      this.currentDise = diseCode;
      this.status.activeDise = diseCode;
    }
    if (academicYear) {
      this.currentAcademicYear = academicYear;
    }
    this.refreshQueueCounts();
    if (this.status.isOnline) {
      this.triggerManualSync();
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.status });
    return () => this.listeners.delete(listener);
  }

  public getStatus(): SyncEngineStatus {
    return { ...this.status };
  }

  private notify() {
    this.updateStateLabel();
    const snap = { ...this.status };
    this.listeners.forEach((fn) => {
      try {
        fn(snap);
      } catch (err) {
        console.warn('[SyncEngine] Listener error:', err);
      }
    });
  }

  private updateStateLabel() {
    if (!this.status.isOnline) {
      this.status.syncState = 'OFFLINE_LOCAL';
      this.status.stateLabelKn = 'ಆಫ್ಲೈನ್ನಲ್ಲಿ ಮಾಹಿತಿ ಉಳಿಸಲಾಗುತ್ತಿದೆ';
      this.status.stateLabelEn = 'OFFLINE – LOCAL SAVING';
      return;
    }

    if (this.isSyncing) {
      this.status.syncState = 'SYNCING';
      this.status.stateLabelKn = 'ಕ್ಲೌಡ್ಗೆ ಮಾಹಿತಿ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ';
      this.status.stateLabelEn = 'SYNCING – UPLOADING DATA';
      return;
    }

    if (this.status.failedCount > 0) {
      this.status.syncState = 'SYNC_ERROR';
      this.status.stateLabelKn = 'ಸಿಂಕ್ನಲ್ಲಿ ತೊಂದರೆ ಉಂಟಾಗಿದೆ';
      this.status.stateLabelEn = 'SYNC ERROR';
      return;
    }

    if (this.status.pendingCount > 0) {
      this.status.syncState = 'PENDING_SYNC';
      this.status.stateLabelKn = 'ಸಿಂಕ್ ಮಾಡಲು ಬಾಕಿ ಇರುವ ಮಾಹಿತಿ';
      this.status.stateLabelEn = 'PENDING SYNC';
      return;
    }

    this.status.syncState = 'ONLINE_SYNCED';
    this.status.stateLabelKn = 'ಕ್ಲೌಡ್ ಸಿಂಕ್ ಪೂರ್ಣಗೊಂಡಿದೆ';
    this.status.stateLabelEn = 'ONLINE – SYNCED';
  }

  private initNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('[SyncEngine] Network connection restored (ONLINE)');
      this.status.isOnline = true;
      this.status.isFirebaseConnected = true;
      this.notify();
      this.triggerManualSync();
    });

    window.addEventListener('offline', () => {
      console.log('[SyncEngine] Network connection lost (OFFLINE)');
      this.status.isOnline = false;
      this.status.isFirebaseConnected = false;
      this.notify();
    });
  }

  private initLifecycleTriggers() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.status.isOnline) {
        this.triggerManualSync();
      }
    });

    window.addEventListener('focus', () => {
      if (this.status.isOnline) {
        this.triggerManualSync();
      }
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SRMS_TRIGGER_BACKGROUND_SYNC') {
          console.log('[SyncEngine] Background Sync trigger from Service Worker');
          this.triggerManualSync();
        }
      });
    }

    // Periodic heartbeat every 45s when online
    this.periodicInterval = setInterval(() => {
      if (this.status.isOnline && !this.isSyncing) {
        this.processSyncQueue();
      }
    }, 45000);
  }

  public async refreshQueueCounts() {
    try {
      const queue = await dbGetAll<SyncQueueItem>('syncQueue');
      const pending = queue.filter((item) => item.status === 'PENDING');
      const failed = queue.filter((item) => item.status === 'FAILED');

      this.status.pendingCount = pending.length;
      this.status.failedCount = failed.length;
      this.notify();
    } catch (err) {
      console.warn('[SyncEngine] refreshQueueCounts notice:', err);
    }
  }

  /**
   * Enqueue a local change into the offline sync queue
   */
  public async enqueueOperation(
    type: 'STUDENT_UPSERT' | 'STUDENT_DELETE' | 'MARKS_UPSERT' | 'SCHOOL_UPDATE',
    diseCode: string,
    recordId: string,
    data: any,
    academicYear?: string
  ): Promise<string> {
    const opId = `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const item: SyncQueueItem = {
      opId,
      type,
      diseCode,
      recordId,
      data,
      academicYear: academicYear || this.currentAcademicYear,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0,
    };

    try {
      await dbPut<SyncQueueItem>('syncQueue', item);
      await this.refreshQueueCounts();

      // If online, immediately process in background
      if (this.status.isOnline) {
        setTimeout(() => this.processSyncQueue(), 50);
      }
    } catch (err) {
      console.error('[SyncEngine] Failed to enqueue operation:', err);
    }

    return opId;
  }

  /**
   * Process Pending Operations from Device to Cloud
   */
  public async processSyncQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
    if (this.isSyncing) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }
    if (!navigator.onLine) {
      this.status.isOnline = false;
      this.notify();
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.status.syncState = 'SYNCING';
    this.notify();

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      const allQueueItems = await dbGetAll<SyncQueueItem>('syncQueue');
      const pendingItems = allQueueItems
        .filter((i) => i.status === 'PENDING' || i.status === 'FAILED')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      processed = pendingItems.length;

      for (const item of pendingItems) {
        try {
          await this.executeCloudOperation(item);

          // Mark as SYNCED and remove from queue
          await dbDelete('syncQueue', item.opId);

          // Log success audit
          const logEntry: SyncLogItem = {
            opId: item.opId,
            type: item.type,
            diseCode: item.diseCode,
            recordId: item.recordId,
            status: 'SUCCESS',
            message: `Successfully uploaded ${item.type} for record ${item.recordId} to Firebase Firestore`,
            timestamp: new Date().toISOString(),
          };
          await dbPut<SyncLogItem>('syncLogs', logEntry);

          this.status.syncedCount++;
          succeeded++;
        } catch (opErr: any) {
          failed++;
          item.retryCount++;
          item.status = 'FAILED';
          item.lastError = opErr?.message || String(opErr);
          await dbPut<SyncQueueItem>('syncQueue', item);

          const logEntry: SyncLogItem = {
            opId: item.opId,
            type: item.type,
            diseCode: item.diseCode,
            recordId: item.recordId,
            status: 'ERROR',
            message: `Cloud upload error: ${item.lastError}`,
            timestamp: new Date().toISOString(),
          };
          await dbPut<SyncLogItem>('syncLogs', logEntry);

          console.warn(`[SyncEngine] Cloud sync error for op ${item.opId}:`, opErr);
        }
      }

      const nowIso = new Date().toISOString();
      this.status.lastSyncTime = nowIso;
      this.status.isFirebaseConnected = true;
      localStorage.setItem('srms_last_sync_time', nowIso);
      await dbPut('syncMeta', { key: 'lastSyncTime', value: nowIso });
    } catch (err: any) {
      console.error('[SyncEngine] processSyncQueue general failure:', err);
      this.status.lastError = err?.message || String(err);
      this.status.isFirebaseConnected = false;
    } finally {
      this.isSyncing = false;
      await this.refreshQueueCounts();
    }

    return { processed, succeeded, failed };
  }

  /**
   * Execute an individual sync operation against Firestore
   */
  private async executeCloudOperation(item: SyncQueueItem): Promise<void> {
    const dise = item.diseCode;
    const cleanId = item.recordId.replace(/[^a-zA-Z0-9_-]/g, '_');

    switch (item.type) {
      case 'STUDENT_UPSERT': {
        const student = normalizeStudentDates(item.data as Student);
        const firestoreData = cleanForFirestore({
          ...student,
          id: cleanId,
          diseCode: dise,
          schoolId: dise,
          syncedAt: new Date().toISOString(),
        });
        const studentRef = doc(db, 'schools', dise, 'students', cleanId);
        await setDoc(studentRef, firestoreData, { merge: true });

        // Ensure parent school document exists
        const schoolRef = doc(db, 'schools', dise);
        await setDoc(schoolRef, { diseCode: dise, updatedAt: new Date().toISOString() }, { merge: true });
        break;
      }

      case 'STUDENT_DELETE': {
        // Safe archival to deletedStudents collection
        const backupRef = doc(db, 'schools', dise, 'deletedStudents', cleanId);
        if (item.data) {
          await setDoc(
            backupRef,
            cleanForFirestore({
              ...item.data,
              deletedAt: new Date().toISOString(),
            }),
            { merge: true }
          );
        }
        const studentRef = doc(db, 'schools', dise, 'students', cleanId);
        await deleteDoc(studentRef);
        break;
      }

      case 'MARKS_UPSERT': {
        const marks = item.data as StudentExamMarks;
        const firestoreData = cleanForFirestore({
          ...marks,
          diseCode: dise,
          syncedAt: new Date().toISOString(),
        });
        const marksRef = doc(db, 'schools', dise, 'examMarks', item.recordId);
        await setDoc(marksRef, firestoreData, { merge: true });
        break;
      }

      case 'SCHOOL_UPDATE': {
        const schoolUpdates = cleanForFirestore({
          ...(item.data as Partial<SchoolRecord>),
          diseCode: dise,
          updatedAt: new Date().toISOString(),
        });
        const schoolRef = doc(db, 'schools', dise);
        await setDoc(schoolRef, schoolUpdates, { merge: true });
        break;
      }

      default:
        console.warn(`[SyncEngine] Unknown operation type: ${item.type}`);
    }
  }

  /**
   * Pull Cloud Updates to Device (Cloud to Device synchronisation)
   * Without destroying or overwriting uncommitted pending local changes!
   */
  public async pullCloudUpdates(diseCode?: string, academicYear?: string): Promise<{
    studentsUpdated: number;
    marksUpdated: number;
  }> {
    const targetDise = diseCode || this.currentDise;
    if (!targetDise || !navigator.onLine) {
      return { studentsUpdated: 0, marksUpdated: 0 };
    }

    const currentYear = academicYear || this.currentAcademicYear;
    let studentsUpdated = 0;
    let marksUpdated = 0;

    try {
      // 1. Get pending queue record IDs so we never overwrite unsynced work!
      const queue = await dbGetAll<SyncQueueItem>('syncQueue');
      const pendingStudentIds = new Set(
        queue.filter((q) => q.type.startsWith('STUDENT_') && q.diseCode === targetDise).map((q) => q.recordId)
      );
      const pendingMarksStudentIds = new Set(
        queue.filter((q) => q.type === 'MARKS_UPSERT' && q.diseCode === targetDise).map((q) => q.recordId)
      );

      // 2. Pull Students from Firestore
      const studentsSnap = await getDocs(collection(db, 'schools', targetDise, 'students'));
      if (!studentsSnap.empty) {
        const cloudStudents: Student[] = [];
        studentsSnap.forEach((docSnap) => {
          const st = normalizeStudentDates(docSnap.data() as Student);
          // Only take cloud copy if no pending local edit is awaiting sync
          if (!pendingStudentIds.has(st.id)) {
            cloudStudents.push(st);
          }
        });

        if (cloudStudents.length > 0) {
          // Batch write to IndexedDB
          await dbPutBatch('students', cloudStudents);

          // Also keep local storage cache in sync for instant synchronous reads by existing report renderers
          const existingLocalRaw = localStorage.getItem(`kseab_students_${targetDise}`);
          const existingLocal: Student[] = existingLocalRaw ? JSON.parse(existingLocalRaw) : [];
          const mergedMap = new Map<string, Student>();

          // Cloud students first
          cloudStudents.forEach((s) => mergedMap.set(s.id, s));
          // Overlay local pending students
          existingLocal.forEach((s) => {
            if (pendingStudentIds.has(s.id)) {
              mergedMap.set(s.id, s);
            }
          });

          const finalList = Array.from(mergedMap.values());
          localStorage.setItem(`kseab_students_${targetDise}`, JSON.stringify(finalList));
          if (currentYear) {
            const yearFiltered = finalList.filter(
              (s) => s.academicYear === currentYear || (!s.academicYear && currentYear === '2026-27')
            );
            localStorage.setItem(`kseab_students_${targetDise}_${currentYear}`, JSON.stringify(yearFiltered));
          }

          studentsUpdated = cloudStudents.length;
        }
      }

      // 3. Pull Marks from Firestore
      const marksSnap = await getDocs(collection(db, 'schools', targetDise, 'examMarks'));
      if (!marksSnap.empty) {
        const cloudMarks: Array<{ id: string; diseCode: string; academicYear: string; studentId: string; data: any }> = [];
        const marksStorageMap: Record<string, StudentExamMarks> = {};

        marksSnap.forEach((docSnap) => {
          const m = docSnap.data() as StudentExamMarks;
          const stdId = docSnap.id || m.studentId;
          if (!pendingMarksStudentIds.has(stdId)) {
            const compoundKey = `${targetDise}_${m.academicYear || currentYear}_${stdId}`;
            cloudMarks.push({
              id: compoundKey,
              diseCode: targetDise,
              academicYear: m.academicYear || currentYear,
              studentId: stdId,
              data: m,
            });
            marksStorageMap[stdId] = m;
          }
        });

        if (cloudMarks.length > 0) {
          await dbPutBatch('marks', cloudMarks);

          // Update localStorage marks cache
          const existingMarksRaw = localStorage.getItem(`kseab_real_exam_marks_${targetDise}`);
          const existingMarks = existingMarksRaw ? JSON.parse(existingMarksRaw) : {};
          const mergedMarks = { ...marksStorageMap, ...existingMarks };
          localStorage.setItem(`kseab_real_exam_marks_${targetDise}`, JSON.stringify(mergedMarks));

          marksUpdated = cloudMarks.length;
        }
      }

      // 4. Pull School Profile
      const schoolSnap = await getDoc(doc(db, 'schools', targetDise));
      if (schoolSnap.exists()) {
        const schoolData = schoolSnap.data() as SchoolRecord;
        await dbPut('schools', schoolData);
      }
    } catch (err) {
      console.warn('[SyncEngine] pullCloudUpdates notice (offline working cache remains intact):', err);
    }

    return { studentsUpdated, marksUpdated };
  }

  /**
   * Complete Manual Sync Action (triggered by user or system)
   */
  public async triggerManualSync(diseCode?: string, academicYear?: string): Promise<void> {
    const targetDise = diseCode || this.currentDise;
    if (!navigator.onLine) {
      this.status.isOnline = false;
      this.status.syncState = 'OFFLINE_LOCAL';
      this.notify();
      return;
    }

    try {
      // Step A: Push pending device operations to Cloud first
      await this.processSyncQueue();

      // Step B: Pull fresh updates from Cloud to Device
      if (targetDise) {
        await this.pullCloudUpdates(targetDise, academicYear || this.currentAcademicYear);
      }
    } finally {
      this.notify();
    }
  }

  public async getSyncLogs(limit: number = 50): Promise<SyncLogItem[]> {
    try {
      const logs = await dbGetAll<SyncLogItem>('syncLogs');
      return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
    } catch {
      return [];
    }
  }

  public async getPendingQueue(): Promise<SyncQueueItem[]> {
    try {
      return await dbGetAll<SyncQueueItem>('syncQueue');
    } catch {
      return [];
    }
  }

  public async clearCompletedLogs(): Promise<void> {
    try {
      const allLogs = await dbGetAll<SyncLogItem>('syncLogs');
      const oldLogs = allLogs.filter((l) => l.status === 'SUCCESS');
      for (const log of oldLogs) {
        if (log.id) {
          await dbDelete('syncLogs', log.id);
        }
      }
    } catch (_) {}
  }
}

// Global Singleton Instance
export const srmsSyncEngine = new SrmsSyncEngine();
