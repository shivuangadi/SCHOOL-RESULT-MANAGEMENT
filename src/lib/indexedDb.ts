/**
 * ============================================================================
 * SRMS PERSISTENT INDEXEDDB LOCAL DATABASE
 * Project: School Result Management System by Shri S. R. Angadi
 *
 * Provides transactional, offline-first local storage for:
 * - Schools
 * - Students
 * - Classes & Divisions
 * - Subjects & Structures
 * - Marks Entries & Results
 * - Pending Synchronisation Queue (syncQueue)
 * - Synchronisation Audit Logs (syncLogs)
 * - Synchronisation Metadata (syncMeta)
 * ============================================================================
 */

export const DB_NAME = 'SRMS_OFFLINE_DB';
export const DB_VERSION = 1;

export type StoreName =
  | 'schools'
  | 'students'
  | 'marks'
  | 'classes'
  | 'subjects'
  | 'syncQueue'
  | 'syncLogs'
  | 'syncMeta';

export interface SyncQueueItem {
  opId: string;
  type: 'STUDENT_UPSERT' | 'STUDENT_DELETE' | 'MARKS_UPSERT' | 'SCHOOL_UPDATE';
  diseCode: string;
  recordId: string;
  data: any;
  academicYear?: string;
  createdAt: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  lastError?: string;
}

export interface SyncLogItem {
  id?: number;
  opId: string;
  type: string;
  diseCode: string;
  recordId: string;
  status: 'SUCCESS' | 'ERROR' | 'SKIPPED';
  message: string;
  timestamp: string;
}

let dbInstance: IDBDatabase | null = null;
let dbOpenPromise: Promise<IDBDatabase> | null = null;

export const openDatabase = (): Promise<IDBDatabase> => {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  if (dbOpenPromise) {
    return dbOpenPromise;
  }

  dbOpenPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;

      // 1. schools store
      if (!db.objectStoreNames.contains('schools')) {
        db.createObjectStore('schools', { keyPath: 'diseCode' });
      }

      // 2. students store
      if (!db.objectStoreNames.contains('students')) {
        const studentStore = db.createObjectStore('students', { keyPath: 'id' });
        studentStore.createIndex('by_dise', 'diseCode', { unique: false });
        studentStore.createIndex('by_year', 'academicYear', { unique: false });
        studentStore.createIndex('by_class', 'classStandard', { unique: false });
        studentStore.createIndex('by_dise_year', ['diseCode', 'academicYear'], { unique: false });
      }

      // 3. marks store
      if (!db.objectStoreNames.contains('marks')) {
        const marksStore = db.createObjectStore('marks', { keyPath: 'id' });
        marksStore.createIndex('by_dise', 'diseCode', { unique: false });
        marksStore.createIndex('by_student', 'studentId', { unique: false });
        marksStore.createIndex('by_dise_year', ['diseCode', 'academicYear'], { unique: false });
      }

      // 4. classes store
      if (!db.objectStoreNames.contains('classes')) {
        db.createObjectStore('classes', { keyPath: 'id' });
      }

      // 5. subjects store
      if (!db.objectStoreNames.contains('subjects')) {
        db.createObjectStore('subjects', { keyPath: 'id' });
      }

      // 6. syncQueue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const queueStore = db.createObjectStore('syncQueue', { keyPath: 'opId' });
        queueStore.createIndex('by_status', 'status', { unique: false });
        queueStore.createIndex('by_dise', 'diseCode', { unique: false });
        queueStore.createIndex('by_created', 'createdAt', { unique: false });
      }

      // 7. syncLogs store
      if (!db.objectStoreNames.contains('syncLogs')) {
        const logStore = db.createObjectStore('syncLogs', { keyPath: 'id', autoIncrement: true });
        logStore.createIndex('by_created', 'timestamp', { unique: false });
        logStore.createIndex('by_dise', 'diseCode', { unique: false });
      }

      // 8. syncMeta store
      if (!db.objectStoreNames.contains('syncMeta')) {
        db.createObjectStore('syncMeta', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        dbOpenPromise = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => {
      dbOpenPromise = null;
      reject(request.error || new Error('Failed to open IndexedDB'));
    };

    request.onblocked = () => {
      console.warn('[IndexedDB] Database open blocked by another tab');
    };
  });

  return dbOpenPromise;
};

/**
 * Generic Put / Upsert
 */
export const dbPut = async <T>(storeName: StoreName, value: T, key?: IDBValidKey): Promise<IDBValidKey> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = key !== undefined ? store.put(value, key) : store.put(value);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Batch Put in single transaction
 */
export const dbPutBatch = async <T>(storeName: StoreName, items: T[]): Promise<void> => {
  if (!items || items.length === 0) return;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    for (const item of items) {
      store.put(item);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

/**
 * Generic Get by key
 */
export const dbGet = async <T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);

    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Generic Get All records
 */
export const dbGetAll = async <T>(storeName: StoreName): Promise<T[]> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();

    req.onsuccess = () => resolve((req.result || []) as T[]);
    req.onerror = () => reject(req.error);
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Get records by Index
 */
export const dbGetAllByIndex = async <T>(
  storeName: StoreName,
  indexName: string,
  query: IDBValidKey | IDBKeyRange
): Promise<T[]> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const req = index.getAll(query);

    req.onsuccess = () => resolve((req.result || []) as T[]);
    req.onerror = () => reject(req.error);
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Generic Delete by key
 */
export const dbDelete = async (storeName: StoreName, key: IDBValidKey): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Generic Clear store
 */
export const dbClear = async (storeName: StoreName): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Request persistent browser storage so browser doesn't evict offline school records
 */
export const requestPersistentStorage = async (): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log('[IndexedDB] Persistent storage granted:', isPersisted);
      return isPersisted;
    } catch (err) {
      console.warn('[IndexedDB] Persistent storage request error:', err);
    }
  }
  return false;
};

/**
 * Get storage quota estimate
 */
export const getStorageEstimate = async (): Promise<{
  usageMb: number;
  quotaMb: number;
  percent: number;
}> => {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usageMb = Math.round(((estimate.usage || 0) / (1024 * 1024)) * 10) / 10;
      const quotaMb = Math.round(((estimate.quota || 0) / (1024 * 1024)) * 10) / 10;
      const percent = quotaMb > 0 ? Math.round((usageMb / quotaMb) * 100) : 0;
      return { usageMb, quotaMb, percent };
    } catch (_) {}
  }
  return { usageMb: 0, quotaMb: 0, percent: 0 };
};
