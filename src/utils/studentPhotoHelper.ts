import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface ProcessedPhotoResult {
  blob: Blob;
  dataUrl: string;
  sizeKb: number;
  width: number;
  height: number;
}

export interface PhotoProcessOptions {
  cropArea: { x: number; y: number; width: number; height: number };
  hasFrame: boolean;
  frameColor: string;
  frameThicknessMm: number; // e.g. 0.5
  maxSizeKb: number; // e.g. 500
}

/**
 * Converts millimeters to pixels based on 300 DPI standard print resolution.
 * At 300 DPI: 1 inch = 25.4 mm = 300 px -> 1 mm ~ 11.81 px.
 * At 0.5 mm -> ~5.9 px (approx 6 px).
 */
export const mmToPixelsAt300Dpi = (mm: number): number => {
  const px = Math.round((mm / 25.4) * 300);
  return Math.max(1, px);
};

/**
 * Crops, frames, and iteratively compresses a photo to the targeted maximum KB.
 */
export const processStudentPhoto = async (
  imageSource: HTMLImageElement,
  options: PhotoProcessOptions
): Promise<ProcessedPhotoResult> => {
  const { cropArea, hasFrame, frameColor, frameThicknessMm, maxSizeKb } = options;

  // Portrait aspect ratio default output dimensions: 600px x 800px (standard 3:4 portrait photo)
  const targetWidth = 600;
  const targetHeight = 800;

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context is not available.');
  }

  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // 1. Draw cropped portion from source image onto canvas
  ctx.drawImage(
    imageSource,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  // 2. Apply Frame if requested
  if (hasFrame) {
    const strokeWidthPx = mmToPixelsAt300Dpi(frameThicknessMm);
    ctx.strokeStyle = frameColor || '#000000';
    ctx.lineWidth = strokeWidthPx;
    // Draw inside the border so it doesn't get clipped
    const halfStroke = strokeWidthPx / 2;
    ctx.strokeRect(halfStroke, halfStroke, targetWidth - strokeWidthPx, targetHeight - strokeWidthPx);
  }

  // 3. Iterative JPEG compression to achieve maximum size in KB
  const maxBytes = maxSizeKb * 1024;
  let quality = 0.95;
  let blob: Blob | null = null;
  let attempts = 0;

  // Helper to convert canvas to blob
  const getBlob = (q: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to generate image blob from canvas.'));
        },
        'image/jpeg',
        q
      );
    });
  };

  blob = await getBlob(quality);

  // Step down quality if image exceeds target size
  while (blob.size > maxBytes && quality > 0.3 && attempts < 10) {
    attempts++;
    quality -= 0.08;
    blob = await getBlob(Math.max(0.2, quality));
  }

  // If still too large (rare), slightly scale down dimensions
  if (blob.size > maxBytes) {
    const scaleCanvas = document.createElement('canvas');
    scaleCanvas.width = 480;
    scaleCanvas.height = 640;
    const sCtx = scaleCanvas.getContext('2d');
    if (sCtx) {
      sCtx.drawImage(canvas, 0, 0, 480, 640);
      blob = await new Promise<Blob>((resolve) => {
        scaleCanvas.toBlob((b) => resolve(b || blob!), 'image/jpeg', 0.85);
      });
    }
  }

  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

  return {
    blob,
    dataUrl,
    sizeKb: Math.round(blob.size / 1024),
    width: targetWidth,
    height: targetHeight,
  };
};

/**
 * Validates selected student photo file type and size.
 */
export const validatePhotoFile = (file: File): { valid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  const isTypeValid = validTypes.includes(file.type.toLowerCase()) || (ext && ['jpg', 'jpeg', 'png', 'webp'].includes(ext));

  if (!isTypeValid) {
    return {
      valid: false,
      error: 'Unsupported image format. Please upload a JPG, JPEG, PNG, or WEBP photo.',
    };
  }

  // 15 MB maximum input image size
  if (file.size > 15 * 1024 * 1024) {
    return {
      valid: false,
      error: 'Image file is too large (maximum 15MB). Please select a smaller photo.',
    };
  }

  return { valid: true };
};

// ============================================================================
// PERSISTENT INDEXED-DB CACHE FOR STUDENT PHOTOS
// Ensures offline resilience & prevents upload failures if Firebase Storage
// bucket is uninitialized or hits retry limits in sandbox environments.
// ============================================================================
const DB_NAME = 'SchoolResultPhotosDB';
const DB_VERSION = 1;
const STORE_NAME = 'student_photos';

// In-memory URL cache for active session
const photoUrlCache = new Map<string, string>();

const openPhotoDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const savePhotoToLocalDb = async (photoPath: string, blob: Blob): Promise<string> => {
  try {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, photoPath);
      req.onsuccess = () => {
        const url = URL.createObjectURL(blob);
        photoUrlCache.set(photoPath, url);
        resolve(url);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB save photo notice:', err);
    const url = URL.createObjectURL(blob);
    photoUrlCache.set(photoPath, url);
    return url;
  }
};

export const getPhotoFromLocalDb = async (photoPath: string): Promise<Blob | null> => {
  try {
    const db = await openPhotoDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(photoPath);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

export const deletePhotoFromLocalDb = async (photoPath: string): Promise<boolean> => {
  try {
    photoUrlCache.delete(photoPath);
    const db = await openPhotoDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(photoPath);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
};

/**
 * Resolves a displayable image source URL for a student photo.
 * If photoUrl is already an external HTTPS URL (e.g. Firebase Storage), uses it.
 * If not, checks the session URL cache and persistent IndexedDB.
 */
export const resolvePhotoUrl = async (
  photoPath?: string,
  existingUrl?: string
): Promise<string | null> => {
  if (existingUrl && existingUrl.startsWith('https://')) {
    return existingUrl;
  }
  if (!photoPath) {
    return existingUrl || null;
  }
  if (photoUrlCache.has(photoPath)) {
    return photoUrlCache.get(photoPath)!;
  }
  try {
    const blob = await getPhotoFromLocalDb(photoPath);
    if (blob) {
      const url = URL.createObjectURL(blob);
      photoUrlCache.set(photoPath, url);
      return url;
    }
  } catch (_) {}
  return existingUrl || null;
};

/**
 * Uploads processed student photo to Firebase Storage under the isolated school path:
 * schools/{schoolId}/students/{studentId}/photo.jpg
 * If Firebase Storage is uninitialized, blocked, or times out, safely falls back
 * to browser IndexedDB persistent storage so student saving NEVER fails.
 */
export const uploadStudentPhoto = async (
  schoolId: string,
  studentId: string,
  blob: Blob
): Promise<{ photoUrl: string; photoPath: string; isLocalFallback?: boolean }> => {
  const safeSchoolId = (schoolId || 'school').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeStudentId = (studentId || `std_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  const photoPath = `schools/${safeSchoolId}/students/${safeStudentId}/photo.jpg`;

  // 1. Always save into persistent IndexedDB first for instant access
  const localUrl = await savePhotoToLocalDb(photoPath, blob);

  // 2. Attempt upload to Firebase Storage with a strict 3.5s timeout
  try {
    const storageRef = ref(storage, photoPath);
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        schoolId: safeSchoolId,
        studentId: safeStudentId,
        uploadedAt: new Date().toISOString(),
      },
    };

    const uploadPromise = uploadBytes(storageRef, blob, metadata).then(async (snapshot) => {
      const photoUrl = await getDownloadURL(snapshot.ref);
      photoUrlCache.set(photoPath, photoUrl);
      return { photoUrl, photoPath, isLocalFallback: false };
    });

    const timeoutPromise = new Promise<{ photoUrl: string; photoPath: string; isLocalFallback: boolean }>(
      (_, reject) => {
        setTimeout(
          () => reject(new Error('Firebase Storage timeout: operation exceeded 3500ms')),
          3500
        );
      }
    );

    const result = await Promise.race([uploadPromise, timeoutPromise]);
    return result;
  } catch (err: any) {
    console.warn(
      `Firebase Storage notice for "${photoPath}": ${err?.message || 'Storage unavailable'}. Photo preserved securely in local database.`
    );
    // Return the local persistent blob URL and path so student saving proceeds smoothly
    return {
      photoUrl: localUrl,
      photoPath,
      isLocalFallback: true,
    };
  }
};

/**
 * Deletes student photo from Firebase Storage and local IndexedDB.
 */
export const deleteStudentPhoto = async (photoPath?: string): Promise<boolean> => {
  if (!photoPath || !photoPath.startsWith('schools/')) {
    return false;
  }

  // Delete from local IndexedDB
  await deletePhotoFromLocalDb(photoPath);

  // Attempt delete from Firebase Storage
  try {
    const storageRef = ref(storage, photoPath);
    await deleteObject(storageRef);
    return true;
  } catch (err) {
    console.warn('Firebase Storage delete photo notice:', err);
    return false;
  }
};
