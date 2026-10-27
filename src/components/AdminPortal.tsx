import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SchoolRecord, AccountStatus, SubscriptionStatus, SchoolMedium } from '../types';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  getLocalSchools,
  updateLocalSchool,
  archiveDeletedSchool,
  getDeletedSchools,
  restoreDeletedSchoolLocal,
  removeSchoolFromActiveLocal,
} from '../utils/localSchoolStore';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Ban,
  Clock,
  Calendar,
  Building,
  CreditCard,
  MessageSquare,
  Trash2,
  Edit,
  Save,
  X,
  Copy,
  Check,
  Send,
  Sparkles,
  Archive,
  RotateCcw,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Loader2,
  Lock,
} from 'lucide-react';

interface ApprovalNotificationData {
  school: SchoolRecord;
  startDateFormatted: string;
  expiryDateFormatted: string;
  whatsAppText: string;
  whatsAppUrl: string;
}

const formatDateDMY = (dateStr?: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const convertDriveUrlToDirect = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${folderMatch[1]}`;
  }
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
  }
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }
  return trimmed;
};

const compressImageFile = (file: File, maxDim = 440, quality = 0.88): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

const generateWhatsAppApprovalMessage = (
  schoolName: string,
  diseCode: string,
  startDateStr: string,
  expiryDateStr: string,
  password?: string
) => {
  const fromDate = formatDateDMY(startDateStr);
  const toDate = formatDateDMY(expiryDateStr);
  return `*ಕರ್ನಾಟಕ ಶಾಲಾ ಪರೀಕ್ಷೆ ಮತ್ತು ಮೌಲ್ಯನಿರ್ಣಯ ಮಂಡಳಿ (KSEAB)*
*ಶಾಲಾ ಫಲಿತಾಂಶ ನಿರ್ವಹಣಾ ತಂತ್ರಾಂಶ*

ನಮಸ್ಕಾರ ಮುಖ್ಯಗುರುಗಳೇ / ಶಿಕ್ಷಕರೇ,
*ಶಾಲೆ ಹೆಸರು:* ${schoolName}
*DISE ಕೋಡ್:* ${diseCode}

ನಿಮ್ಮ ಶಾಲೆಯ ₹500 ಪಾಸ್ ಕೀ (Pass Key) ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಂಡಿದ್ದು, ಖಾತೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ *ಅನುಮೋದಿಸಲಾಗಿದೆ (APPROVED & ACTIVE)*.

🗓️ *ಸಕ್ರಿಯ ಅವಧಿ (Active Validity):*
▶️ ಪ್ರಾರಂಭ ದಿನಾಂಕ (From): *${fromDate}*
▶️ ಮುಕ್ತಾಯ ದಿನಾಂಕ (To): *${toDate}*

🌐 *ಲಾಗಿನ್ ವಿವರಗಳು (Login Credentials):*
ಯೂಸರ್ ನೇಮ್ (DISE / Username): *${diseCode}*
ಪಾಸ್‌ವರ್ಡ್ (Password): *${password || 'ನೀವು ನೋಂದಣಿ ಸಮಯದಲ್ಲಿ ನೀಡಿದ ಪಾಸ್‌ವರ್ಡ್'}*

ವೆಬ್‌ಸೈಟ್ ಲಿಂಕ್: https://ais-dev-5jkxqjxvh5omqwaxfdqucu-66844162673.asia-east1.run.app

ಈಗ ಲಾಗಿನ್ ಆಗಿ ನಿಮ್ಮ ಶಾಲೆಯ CCE ಫಲಿತಾಂಶ ಬ್ರಾಡ್ ಶೀಟ್, ಗ್ರೇಡ್ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿಗಳ ಅಂಕಪಟ್ಟಿಗಳನ್ನು ಮುದ್ರಿಸಿಕೊಳ್ಳಬಹುದು.

ಧನ್ಯವಾದಗಳೊಂದಿಗೆ,
*ಶ್ರೀ ಎಸ್. ಆರ್. ಅಂಗಡಿ (Shri S R Angadi)*
ವಿಜ್ಞಾನ ಶಿಕ್ಷಕರು, ಸ.ಹಿ.ಪ್ರಾ.ಶಾಲೆ ನಿಂಗ್ಯಾನಟ್ಟಿ
ಸಹಾಯವಾಣಿ ಮೊಬೈಲ್: 9731766727`;
};

export const AdminPortal: React.FC = () => {
  const { currentUser } = useAuth();
  const { lang } = useLanguage();

  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AccountStatus | 'BACKUP'>('ALL');
  const [deletedSchools, setDeletedSchools] = useState<SchoolRecord[]>([]);

  // Creator Photo Management State (Admin Only)
  const [adminCreatorPhoto, setAdminCreatorPhoto] = useState<string>(() => {
    return localStorage.getItem('angadi_real_photo') || 'https://lh3.googleusercontent.com/d/1MPoabiZrPxObN4L0gEQtbCGNnXs_xREO';
  });
  const [photoInputUrl, setPhotoInputUrl] = useState('');
  const [isPhotoSaving, setIsPhotoSaving] = useState(false);
  const [photoSavedNotice, setPhotoSavedNotice] = useState(false);
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'systemSettings', 'creatorProfile'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data?.photoUrl) {
            setAdminCreatorPhoto(data.photoUrl);
            localStorage.setItem('angadi_permanent_photo', data.photoUrl);
          }
        }
      });
      return () => unsub();
    } catch {}
  }, []);

  const handleAdminPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsPhotoSaving(true);
      const compressed = await compressImageFile(file, 440, 0.88);
      await setDoc(
        doc(db, 'systemSettings', 'creatorProfile'),
        {
          photoUrl: compressed,
          creatorName: 'Shri S R Angadi',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setAdminCreatorPhoto(compressed);
      localStorage.setItem('angadi_permanent_photo', compressed);
      setPhotoSavedNotice(true);
      setTimeout(() => setPhotoSavedNotice(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsPhotoSaving(false);
      if (adminFileInputRef.current) adminFileInputRef.current.value = '';
    }
  };

  const handleAdminSaveUrl = async (customUrl?: string) => {
    const raw = typeof customUrl === 'string' ? customUrl : photoInputUrl;
    const trimmed = raw.trim();
    if (!trimmed) return;
    const formatted = convertDriveUrlToDirect(trimmed);
    try {
      setIsPhotoSaving(true);
      await setDoc(
        doc(db, 'systemSettings', 'creatorProfile'),
        {
          photoUrl: formatted,
          creatorName: 'Shri S R Angadi',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setAdminCreatorPhoto(formatted);
      localStorage.setItem('angadi_permanent_photo', formatted);
      setPhotoInputUrl('');
      setPhotoSavedNotice(true);
      setTimeout(() => setPhotoSavedNotice(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to save link.');
    } finally {
      setIsPhotoSaving(false);
    }
  };

  const handleAdminResetPhoto = async () => {
    if (!window.confirm('Reset creator photo to default illustration?')) return;
    try {
      setIsPhotoSaving(true);
      const defaultUrl = '/assets/app_maker_angadi.svg';
      await setDoc(
        doc(db, 'systemSettings', 'creatorProfile'),
        {
          photoUrl: defaultUrl,
          creatorName: 'Shri S R Angadi',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setAdminCreatorPhoto(defaultUrl);
      localStorage.setItem('angadi_permanent_photo', defaultUrl);
      setPhotoSavedNotice(true);
      setTimeout(() => setPhotoSavedNotice(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPhotoSaving(false);
    }
  };

  // Function to load deleted schools from local archive & Firestore
  const fetchDeletedSchools = async () => {
    const localDeleted = getDeletedSchools();
    try {
      const snap = await getDocs(collection(db, 'deletedSchoolsBackup'));
      const firestoreList: SchoolRecord[] = [];
      snap.forEach((d) => firestoreList.push(d.data() as SchoolRecord));
      const merged = [...firestoreList];
      localDeleted.forEach((loc) => {
        if (!merged.some((m) => m.diseCode === loc.diseCode)) {
          merged.push(loc);
        }
      });
      setDeletedSchools(merged);
    } catch {
      setDeletedSchools(localDeleted);
    }
  };

  useEffect(() => {
    fetchDeletedSchools();
  }, []);

  // Selected school for editing / inspection
  const [selectedSchool, setSelectedSchool] = useState<SchoolRecord | null>(null);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editSchoolName, setEditSchoolName] = useState('');
  const [editSchoolMedium, setEditSchoolMedium] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // WhatsApp Approval Modal State
  const [approvalNotification, setApprovalNotification] =
    useState<ApprovalNotificationData | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Subscribe to all schools collection + local store
  useEffect(() => {
    const schoolsColRef = collection(db, 'schools');
    const unsubscribe = onSnapshot(
      schoolsColRef,
      (snapshot) => {
        const list: SchoolRecord[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as SchoolRecord);
        });

        // Merge any locally registered schools
        const localSchools = getLocalSchools();
        localSchools.forEach((loc) => {
          const exists = list.some(
            (s) => s.diseCode === loc.diseCode || s.schoolId === loc.schoolId
          );
          if (!exists) {
            list.push(loc);
          }
        });

        // Sort: PENDING first, then by date descending
        list.sort((a, b) => {
          if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
          if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });
        setSchools(list);
        setLoading(false);
      },
      (error) => {
        console.warn('Firestore listing note, loading local schools:', error);
        const localList = getLocalSchools();
        setSchools(localList);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtered schools
  const filteredSchools = schools.filter((sch) => {
    const matchesStatus = statusFilter === 'ALL' || sch.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      sch.schoolName.toLowerCase().includes(query) ||
      sch.diseCode.includes(query) ||
      sch.headmasterName.toLowerCase().includes(query) ||
      sch.mobile.includes(query);
    return matchesStatus && matchesSearch;
  });

  // Summary Metrics
  const totalCount = schools.length;
  const pendingCount = schools.filter((s) => s.status === 'PENDING').length;
  const approvedCount = schools.filter((s) => s.status === 'APPROVED').length;
  const suspendedOrExpiredCount = schools.filter(
    (s) => s.status === 'SUSPENDED' || s.status === 'EXPIRED'
  ).length;

  // Actions
  const handleApproveSchool = async (school: SchoolRecord) => {
    setActionLoading(true);
    const now = new Date();
    const expiry = new Date();
    expiry.setFullYear(now.getFullYear() + 1);

    const startStr = now.toISOString().split('T')[0];
    const expiryStr = expiry.toISOString().split('T')[0];

    const updatePayload: Partial<SchoolRecord> = {
      status: 'APPROVED',
      subscriptionStatus: 'ACTIVE',
      subscriptionStart: startStr,
      subscriptionExpiry: expiryStr,
      approvedAt: now.toISOString(),
      paymentNotes: school.paymentNotes
        ? `${school.paymentNotes} | Approved by Admin on ${formatDateDMY(startStr)}`
        : `Approved by Admin on ${formatDateDMY(startStr)}`,
    };

    // Update local store immediately
    updateLocalSchool(school.schoolId, updatePayload);
    updateLocalSchool(school.diseCode, updatePayload);

    const updated = { ...school, ...updatePayload };

    // Refresh local schools in state
    setSchools((prev) =>
      prev.map((s) =>
        s.schoolId === school.schoolId || s.diseCode === school.diseCode ? updated : s
      )
    );

    if (
      selectedSchool?.schoolId === school.schoolId ||
      selectedSchool?.diseCode === school.diseCode
    ) {
      setSelectedSchool(updated);
      setEditStartDate(startStr);
      setEditExpiryDate(expiryStr);
      setEditNotes(updatePayload.paymentNotes || '');
    }

    try {
      await updateDoc(doc(db, 'schools', school.diseCode), updatePayload).catch(() => {});
      if (school.schoolId && school.schoolId !== school.diseCode) {
        await updateDoc(doc(db, 'schools', school.schoolId), updatePayload).catch(() => {});
      }
      await updateDoc(doc(db, 'registrationRequests', school.diseCode), { status: 'APPROVED' }).catch(() => {});
      if (school.ownerUid) {
        await updateDoc(doc(db, 'users', school.ownerUid), { status: 'APPROVED' }).catch(() => {});
      }
    } catch (err) {
      console.warn('Firestore update note:', err);
    }

    const whatsAppText = generateWhatsAppApprovalMessage(
      school.schoolName,
      school.diseCode,
      startStr,
      expiryStr,
      school.registrationPassword
    );
    const cleanMobile = school.mobile.replace(/\D/g, '');
    const whatsAppUrl = `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(whatsAppText)}`;

    setApprovalNotification({
      school: updated,
      startDateFormatted: formatDateDMY(startStr),
      expiryDateFormatted: formatDateDMY(expiryStr),
      whatsAppText,
      whatsAppUrl,
    });

    setActionLoading(false);
  };

  const handleOpenWhatsAppModal = (school: SchoolRecord) => {
    const startStr = school.subscriptionStart || new Date().toISOString().split('T')[0];
    const expiryStr =
      school.subscriptionExpiry ||
      (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        return d.toISOString().split('T')[0];
      })();

    const whatsAppText = generateWhatsAppApprovalMessage(
      school.schoolName,
      school.diseCode,
      startStr,
      expiryStr,
      school.registrationPassword
    );
    const cleanMobile = school.mobile.replace(/\D/g, '');
    const whatsAppUrl = `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(whatsAppText)}`;

    setApprovalNotification({
      school,
      startDateFormatted: formatDateDMY(startStr),
      expiryDateFormatted: formatDateDMY(expiryStr),
      whatsAppText,
      whatsAppUrl,
    });
  };

  const handleRejectSchool = async (school: SchoolRecord) => {
    setActionLoading(true);
    const rejectPayload = {
      status: 'REJECTED' as AccountStatus,
      subscriptionStatus: 'PENDING' as SubscriptionStatus,
      rejectionReason: 'Registration rejected by administrator',
    };
    updateLocalSchool(school.schoolId, rejectPayload);
    updateLocalSchool(school.diseCode, rejectPayload);
    setSchools((prev) =>
      prev.map((s) =>
        s.schoolId === school.schoolId || s.diseCode === school.diseCode
          ? { ...s, ...rejectPayload }
          : s
      )
    );

    if (selectedSchool?.schoolId === school.schoolId) {
      setSelectedSchool({ ...selectedSchool, ...rejectPayload });
    }

    try {
      await updateDoc(doc(db, 'schools', school.schoolId), rejectPayload);
      await updateDoc(doc(db, 'users', school.schoolId), { status: 'REJECTED' }).catch(() => {});
    } catch (err) {
      console.warn('Firestore reject notice:', err);
    }
    setActionLoading(false);
  };

  const handleToggleSuspend = async (school: SchoolRecord) => {
    const newStatus: AccountStatus = school.status === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED';
    const newSubStatus: SubscriptionStatus =
      school.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';

    setActionLoading(true);
    const suspendPayload = {
      status: newStatus,
      subscriptionStatus: newSubStatus,
    };
    updateLocalSchool(school.schoolId, suspendPayload);
    updateLocalSchool(school.diseCode, suspendPayload);
    setSchools((prev) =>
      prev.map((s) =>
        s.schoolId === school.schoolId || s.diseCode === school.diseCode
          ? { ...s, ...suspendPayload }
          : s
      )
    );

    if (selectedSchool?.schoolId === school.schoolId) {
      setSelectedSchool({ ...selectedSchool, ...suspendPayload });
    }

    try {
      await updateDoc(doc(db, 'schools', school.schoolId), suspendPayload);
      await updateDoc(doc(db, 'users', school.schoolId), { status: newStatus }).catch(() => {});
    } catch (err) {
      console.warn('Firestore toggle notice:', err);
    }
    setActionLoading(false);
  };

  const handleSaveDates = async () => {
    if (!selectedSchool) return;
    setActionLoading(true);

    const updateData: Partial<SchoolRecord> = {
      schoolName: editSchoolName.trim() || selectedSchool.schoolName,
      schoolMedium: ((editSchoolMedium.trim() as SchoolMedium) || selectedSchool.schoolMedium || 'Kannada') as SchoolMedium,
      subscriptionStart: editStartDate,
      subscriptionExpiry: editExpiryDate,
      paymentNotes: editNotes,
    };

    updateLocalSchool(selectedSchool.schoolId, updateData);
    updateLocalSchool(selectedSchool.diseCode, updateData);

    const updated = { ...selectedSchool, ...updateData };
    setSelectedSchool(updated);
    setSchools((prev) =>
      prev.map((s) =>
        s.schoolId === selectedSchool.schoolId || s.diseCode === selectedSchool.diseCode
          ? updated
          : s
      )
    );

    try {
      await updateDoc(doc(db, 'schools', selectedSchool.schoolId), updateData);
      if (selectedSchool.diseCode && selectedSchool.diseCode !== selectedSchool.schoolId) {
        await updateDoc(doc(db, 'schools', selectedSchool.diseCode), updateData).catch(() => {});
      }
    } catch (err) {
      console.warn('Firestore save dates notice (local updated):', err);
    }

    setIsEditingDates(false);
    setActionLoading(false);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3500);
  };

  const handleDeleteSchool = async (school: SchoolRecord) => {
    setActionLoading(true);
    try {
      const backupRecord: SchoolRecord = {
        ...school,
        status: 'DELETED' as AccountStatus,
        updatedAt: new Date().toISOString(),
      };

      // 1. Archive to local deleted schools backup
      archiveDeletedSchool(backupRecord);
      removeSchoolFromActiveLocal(school.diseCode, school.schoolId);

      // 2. Backup to Firestore 'deletedSchoolsBackup' collection
      await setDoc(doc(db, 'deletedSchoolsBackup', school.diseCode), {
        ...backupRecord,
        deletedAt: new Date().toISOString(),
        deletedBy: 'Admin (Shri S R Angadi)',
      }).catch(() => {});

      // 3. Delete from active Firestore collections
      await deleteDoc(doc(db, 'schools', school.diseCode)).catch(() => {});
      if (school.schoolId && school.schoolId !== school.diseCode) {
        await deleteDoc(doc(db, 'schools', school.schoolId)).catch(() => {});
      }
      await deleteDoc(doc(db, 'registrationRequests', school.diseCode)).catch(() => {});
      await deleteDoc(doc(db, 'users', school.diseCode)).catch(() => {});
      if (school.schoolId && school.schoolId !== school.diseCode) {
        await deleteDoc(doc(db, 'users', school.schoolId)).catch(() => {});
      }

      setSchools((prev) =>
        prev.filter((s) => s.schoolId !== school.schoolId && s.diseCode !== school.diseCode)
      );
      if (selectedSchool?.schoolId === school.schoolId || selectedSchool?.diseCode === school.diseCode) {
        setSelectedSchool(null);
      }
      fetchDeletedSchools();
    } catch (err) {
      console.warn('Delete school note:', err);
    }
    setDeleteConfirmId(null);
    setActionLoading(false);
  };

  const handleRestoreSchool = async (school: SchoolRecord) => {
    setActionLoading(true);
    try {
      restoreDeletedSchoolLocal(school.diseCode);

      const restoredRecord: SchoolRecord = {
        ...school,
        status: 'APPROVED',
        subscriptionStatus: 'ACTIVE',
        updatedAt: new Date().toISOString(),
      };

      // Restore to active Firestore schools
      await setDoc(doc(db, 'schools', school.diseCode), restoredRecord);

      // Remove from deleted backup
      await deleteDoc(doc(db, 'deletedSchoolsBackup', school.diseCode)).catch(() => {});

      setSchools((prev) => [restoredRecord, ...prev.filter((s) => s.diseCode !== school.diseCode)]);
      setDeletedSchools((prev) => prev.filter((s) => s.diseCode !== school.diseCode));
    } catch (err) {
      console.warn('Restore school error:', err);
    }
    setActionLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-blue-900 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold shadow-md">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-amber-300 tracking-wider">
                Root System Controller
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30">
                Verified Admin: {currentUser?.email || 'shivu.angadi@gmail.com'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-0.5">
              {lang === 'kn'
                ? 'ಶಾಲಾ ಫಲಿತಾಂಶ - ನಿರ್ವಾಹಕರ ಕಂಟ್ರೋಲ್ ಪ್ಯಾನೆಲ್'
                : 'School Result Administrator Control Panel'}
            </h1>
            <p className="text-xs text-blue-200 mt-1">
              Shri S R Angadi • Manual Pass Key (₹500) Verification, School Approval & WhatsApp Dispatch
            </p>
          </div>
        </div>
      </div>

      {/* System Status Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>School Registration & Approval System: Fully Active</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 text-[10px] font-black uppercase">
              Operational
            </span>
          </div>
          <p className="text-emerald-800 text-[11px]">
            Approving a school immediately activates its 1-year Pass Key and generates the WhatsApp confirmation message with exact active dates (from date to date).
          </p>
        </div>
      </div>

      {/* App Maker / Creator Photo Management Card (Admin-Only) */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-200 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 shadow-md ring-2 ring-amber-300/80 shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center">
                <img
                  src={adminCreatorPhoto}
                  alt="Shri S R Angadi"
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                  App Creator Official Portrait (Shri S R Angadi)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-amber-800" />
                  <span>Admin-Only Control</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Changing and uploading this photo is <strong>strictly restricted to you (Admin)</strong>. Regular school accounts and visitors see only the read-only portrait.
              </p>
            </div>
          </div>

          {photoSavedNotice && (
            <div className="px-3 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-in fade-in shrink-0">
              <Check className="w-4 h-4 text-emerald-700" />
              <span>Saved permanently to Cloud Database!</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
          {/* Method 1: File Upload */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800 block">
              Option 1: Upload Photo File from Device
            </span>
            <p className="text-[11px] text-slate-500">
              Select <strong>IMG_20260930_003206.png</strong> from your phone or computer. It will be compressed and stored in Cloud Firestore permanently for all users.
            </p>
            <input
              ref={adminFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAdminPhotoUpload}
              className="hidden"
              id="admin-photo-file-input"
            />
            <label
              htmlFor="admin-photo-file-input"
              className={`w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer ${
                isPhotoSaving ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {isPhotoSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>📁 Choose Photo from Device ({isPhotoSaving ? 'Saving...' : 'IMG_20260930_003206.png'})</span>
            </label>
          </div>

          {/* Method 2: Link / Google Drive */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800 block">
              Option 2: Paste Image or Google Drive Link
            </span>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="url"
                  value={photoInputUrl}
                  onChange={(e) => setPhotoInputUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://.../photo.png"
                  className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAdminSaveUrl()}
                disabled={!photoInputUrl.trim() || isPhotoSaving}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Save Link
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const driveLink = 'https://drive.google.com/drive/folders/1MPoabiZrPxObN4L0gEQtbCGNnXs_xREO';
                  setPhotoInputUrl(driveLink);
                  handleAdminSaveUrl(driveLink);
                }}
                disabled={isPhotoSaving}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                🔗 Use Drive Link (1MPoabiZrPx...)
              </button>
              <button
                type="button"
                onClick={handleAdminResetPhoto}
                disabled={isPhotoSaving}
                className="text-[11px] text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Default Illustration</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Schools
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Registered schools</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-200 bg-amber-50/20">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Approvals</span>
          </span>
          <div className="text-2xl font-extrabold text-amber-900 mt-1">{pendingCount}</div>
          <span className="text-[11px] text-amber-600 mt-0.5 block">Awaiting pass key & verify</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-200 bg-emerald-50/20">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved & Active</span>
          </span>
          <div className="text-2xl font-extrabold text-emerald-900 mt-1">{approvedCount}</div>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">Access granted</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-200 bg-rose-50/20">
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block flex items-center gap-1.5">
            <Ban className="w-3.5 h-3.5" />
            <span>Suspended / Expired</span>
          </span>
          <div className="text-2xl font-extrabold text-rose-900 mt-1">
            {suspendedOrExpiredCount}
          </div>
          <span className="text-[11px] text-rose-600 mt-0.5 block">Requires renewal</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by School Name, 11 Digit DISE Code, HM Name, Mobile..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-900 focus:outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
          {(['ALL', 'PENDING', 'APPROVED', 'SUSPENDED', 'EXPIRED', 'REJECTED'] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === status
                    ? 'bg-blue-950 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'ALL'
                  ? 'All Schools'
                  : status === 'PENDING'
                  ? `Pending (${pendingCount})`
                  : status === 'APPROVED'
                  ? `Approved (${approvedCount})`
                  : status}
              </button>
            )
          )}

          {/* Backup / Recycle Bin Filter Tab */}
          <button
            onClick={() => setStatusFilter('BACKUP')}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'BACKUP'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            <Archive className="w-3.5 h-3.5 text-purple-400" />
            <span>Deleted Schools Backup ({deletedSchools.length})</span>
          </button>
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {statusFilter === 'BACKUP' ? (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
                  <Archive className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    ಅಳಿಸಲಾದ ಶಾಲೆಗಳ ಬ್ಯಾಕಪ್ (Deleted Schools Backup / Recycle Bin)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Deleted school records are securely backed up. You can revoke and restore any school's data and login access at any time.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-900 rounded-lg font-mono font-bold text-xs self-start sm:self-center">
                {deletedSchools.length} Backed Up Records
              </span>
            </div>

            {deletedSchools.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Trash2 className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-600 text-xs">No deleted schools found in backup archive.</p>
                <p className="text-[11px] text-slate-400">When schools are deleted, they will appear here safely for future restore.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">DISE & School Name</th>
                      <th className="py-3 px-4">Type & Medium</th>
                      <th className="py-3 px-4">Headmaster & Mobile</th>
                      <th className="py-3 px-4">Deleted / Backed Up On</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-xs">
                    {deletedSchools.map((ds) => (
                      <tr key={ds.diseCode} className="hover:bg-purple-50/30 transition">
                        <td className="py-3.5 px-4 font-sans">
                          <div className="font-bold text-slate-900">{ds.schoolName}</div>
                          <div className="font-mono text-blue-900 font-bold text-[11px]">DISE: {ds.diseCode}</div>
                        </td>
                        <td className="py-3.5 px-4 font-sans">
                          <div className="font-semibold text-slate-800">{ds.schoolType}</div>
                          <div className="text-slate-500 text-[11px]">{ds.schoolMedium} Medium</div>
                        </td>
                        <td className="py-3.5 px-4 font-sans">
                          <div className="font-semibold text-slate-800">{ds.headmasterName}</div>
                          <div className="font-mono text-slate-600 text-[11px]">{ds.mobile}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                          {ds.updatedAt ? new Date(ds.updatedAt).toLocaleDateString() : 'Archived'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleRestoreSchool(ds)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                            title="Restore this school back to active schools"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                            <span>Revoke / Restore School (ಖಾತೆ ಮರುಸ್ಥಾಪಿಸಿ)</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading school records...</div>
        ) : filteredSchools.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <div>No schools match your search or filter criteria.</div>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
              className="text-blue-700 font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">DISE & School</th>
                  <th className="py-3.5 px-4">Type & Medium</th>
                  <th className="py-3.5 px-4">HM & Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Pass Key / Validity</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchools.map((sch) => {
                  const isPending = sch.status === 'PENDING';
                  const isApproved = sch.status === 'APPROVED';
                  return (
                    <tr
                      key={sch.schoolId}
                      className={`hover:bg-slate-50/80 transition ${
                        isPending ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* DISE & School */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">{sch.schoolName}</div>
                        <div className="font-mono text-[11px] text-blue-700 font-semibold mt-0.5">
                          DISE: {sch.diseCode}
                        </div>
                      </td>

                      {/* Type & Medium */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px] w-fit">
                            {sch.schoolType}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200 w-fit">
                            {sch.schoolMedium || 'Kannada'} Med
                          </span>
                        </div>
                      </td>

                      {/* HM & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">{sch.headmasterName}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-slate-600 text-[11px]">{sch.mobile}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsAppModal(sch)}
                            className="text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-0.5 cursor-pointer"
                            title="Open WhatsApp message with validity dates"
                          >
                            <MessageSquare className="w-3.5 h-3.5 fill-emerald-600" />
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            sch.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : sch.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : sch.status === 'SUSPENDED'
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : sch.status === 'EXPIRED'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : 'bg-red-100 text-red-900 border border-red-300'
                          }`}
                        >
                          {sch.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                          {sch.status === 'PENDING' && <Clock className="w-3 h-3" />}
                          {sch.status === 'SUSPENDED' && <Ban className="w-3 h-3" />}
                          <span>{sch.status}</span>
                        </span>
                      </td>

                      {/* Pass Key / Validity Dates */}
                      <td className="py-3.5 px-4">
                        {sch.subscriptionExpiry ? (
                          <div className="text-[11px] text-slate-700 space-y-0.5">
                            <div className="font-semibold text-emerald-900">
                              {formatDateDMY(sch.subscriptionStart)} to {formatDateDMY(sch.subscriptionExpiry)}
                            </div>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block font-mono font-bold">
                              {sch.subscriptionStatus}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-amber-800 italic">
                            Awaiting Approval (₹500)
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => handleApproveSchool(sch)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1 text-[11px]"
                              title="Approve School and activate Pass Key for 1 year"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{actionLoading ? 'Approving...' : 'Approve'}</span>
                            </button>
                          )}

                          {isApproved && (
                            <button
                              onClick={() => handleOpenWhatsAppModal(sch)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg transition text-[11px] cursor-pointer flex items-center gap-1"
                              title="Send WhatsApp Validity Message to HM"
                            >
                              <MessageSquare className="w-3.5 h-3.5 fill-emerald-600" />
                              <span>WhatsApp</span>
                            </button>
                          )}

                          {isPending && (
                            <button
                              onClick={() => handleRejectSchool(sch)}
                              disabled={actionLoading}
                              className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-semibold rounded-lg transition cursor-pointer text-[11px]"
                              title="Reject Registration"
                            >
                              Reject
                            </button>
                          )}

                          {!isPending && (
                            <button
                              onClick={() => handleToggleSuspend(sch)}
                              disabled={actionLoading}
                              className={`px-2 py-1 font-semibold rounded-lg transition text-[11px] cursor-pointer ${
                                sch.status === 'SUSPENDED'
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                                  : 'bg-purple-100 hover:bg-purple-200 text-purple-800'
                              }`}
                              title={
                                sch.status === 'SUSPENDED' ? 'Re-activate School' : 'Suspend School'
                              }
                            >
                              {sch.status === 'SUSPENDED' ? 'Re-activate' : 'Suspend'}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedSchool(sch);
                              setEditSchoolName(sch.schoolName || '');
                              setEditSchoolMedium(sch.schoolMedium || 'Kannada');
                              setEditStartDate(sch.subscriptionStart || new Date().toISOString().split('T')[0]);
                              setEditExpiryDate(
                                sch.subscriptionExpiry ||
                                  (() => {
                                    const d = new Date();
                                    d.setFullYear(d.getFullYear() + 1);
                                    return d.toISOString().split('T')[0];
                                  })()
                              );
                              setEditNotes(sch.paymentNotes || '');
                              setIsEditingDates(false);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            title="Inspect & Edit School Details / Dates"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {deleteConfirmId === sch.schoolId ? (
                            <button
                              onClick={() => handleDeleteSchool(sch)}
                              className="px-2 py-1 bg-red-600 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                              title="Confirm Deletion"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(sch.schoolId)}
                              disabled={actionLoading}
                              className="p-1.5 text-slate-400 hover:text-red-700 rounded-lg hover:bg-red-50 transition cursor-pointer"
                              title="Delete School Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      {/* ========================================================
          WHATSAPP APPROVAL CONFIRMATION MODAL
          ======================================================== */}
      {approvalNotification && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-emerald-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-400 text-emerald-950 flex items-center justify-center font-black shadow">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    ಶಾಲೆ ಅನುಮೋದನೆಗೊಂಡಿದೆ! (School Approved)
                  </h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    1 Year Pass Key Activated • Send WhatsApp Confirmation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApprovalNotification(null)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Active Dates Badge */}
              <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-950 text-sm">
                    {approvalNotification.school.schoolName}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                    DISE: {approvalNotification.school.diseCode}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1">
                  <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                    ಸಕ್ರಿಯ ಅವಧಿ (Active Validity Period):
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>
                      {approvalNotification.startDateFormatted} ರಿಂದ {approvalNotification.expiryDateFormatted} ವರೆಗೆ
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold">
                    ✓ 1 Year Full System Pass Key Activated
                  </div>
                </div>
              </div>

              {/* Message Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                    <span>ಮುಖ್ಯಗುರುಗಳಿಗೆ ಕಳುಹಿಸುವ WhatsApp ಸಂದೇಶ:</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Mobile: +91 {approvalNotification.school.mobile}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl text-[11px] text-slate-800 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                  {approvalNotification.whatsAppText}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <a
                  href={approvalNotification.whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>📲 Send WhatsApp Message Directly to HM ({approvalNotification.school.mobile})</span>
                </a>

                <button
                  type="button"
                  onClick={() => copyToClipboard(approvalNotification.whatsAppText)}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-300 transition cursor-pointer"
                >
                  {copiedNotice ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">ಸಂದೇಶ ಕಾಪಿ ಮಾಡಲಾಗಿದೆ! (Message Copied)</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>📋 Copy WhatsApp Message to Clipboard</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
              <button
                onClick={() => setApprovalNotification(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SCHOOL DETAILS / SUBSCRIPTION DATES MODAL
          ======================================================== */}
      {selectedSchool && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center text-amber-300">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {selectedSchool.schoolName}
                  </h3>
                  <p className="text-xs text-blue-200 font-mono">
                    DISE: {selectedSchool.diseCode} • Type: {selectedSchool.schoolType} • Medium:{' '}
                    {selectedSchool.schoolMedium || 'Kannada'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSchool(null);
                  setIsEditingDates(false);
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Save Success Notice */}
              {saveSuccessNotice && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>✓ ದಿನಾಂಕಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೇವ್ ಮಾಡಲಾಗಿದೆ! (Dates & Notes Saved Successfully!)</span>
                </div>
              )}

              {/* Status Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-600">Account Status:</span>
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-full border text-xs ${
                      selectedSchool.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {selectedSchool.status}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-semibold text-slate-600">Subscription:</span>
                  <span className="font-bold text-emerald-800 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                    {selectedSchool.subscriptionStatus}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedSchool.status === 'PENDING' ? (
                    <button
                      onClick={() => handleApproveSchool(selectedSchool)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{actionLoading ? 'Approving...' : 'Approve School'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenWhatsAppModal(selectedSchool)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      <MessageSquare className="w-4 h-4 fill-emerald-600" />
                      <span>Send WhatsApp Message</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleSuspend(selectedSchool)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold rounded-xl transition cursor-pointer text-xs"
                  >
                    {selectedSchool.status === 'SUSPENDED' ? 'Re-activate' : 'Suspend'}
                  </button>
                </div>
              </div>

              {/* Complete School Profile */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
                <div>
                  <span className="text-slate-400 block text-[11px]">Headmaster / In-Charge</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {selectedSchool.headmasterName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mobile Number</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold text-slate-900 font-mono">
                      {selectedSchool.mobile}
                    </span>
                    <button
                      onClick={() => handleOpenWhatsAppModal(selectedSchool)}
                      className="text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 fill-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Official Email</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {selectedSchool.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Registration Timestamp</span>
                  <span className="text-slate-700 mt-0.5 block">{selectedSchool.createdAt}</span>
                </div>
              </div>

              {/* Payment Verification Box */}
              <div className="p-4 border border-emerald-200 bg-emerald-50/40 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-emerald-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span>Pass Key Payment Details (₹500 Model)</span>
                  </span>
                  {selectedSchool.paymentReference && (
                    <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full font-mono font-bold">
                      UTR: {selectedSchool.paymentReference}
                    </span>
                  )}
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Verify the transaction in your bank account / Google Pay UPI app under ₹500 credits.
                  Once verified, click 'Approve School' above to grant full access.
                </p>
              </div>

              {/* School Details & Subscription Validity Customizer */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-4 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-900" />
                    <span>School Details, Dates & Administrative Notes</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {!isEditingDates ? (
                      <button
                        onClick={() => setIsEditingDates(true)}
                        className="px-3 py-1 bg-blue-50 text-blue-900 hover:bg-blue-100 rounded-lg font-bold transition cursor-pointer"
                      >
                        Edit Details & Dates
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveDates}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-950 text-white rounded-lg font-bold transition shadow-xs cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{actionLoading ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Admin School Name & Medium Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-slate-100">
                  <div>
                    <label className="block text-slate-700 mb-1 text-[11px] font-bold">
                      School Name (ಶಾಲೆಯ ಹೆಸರು - Admin Only)
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingDates}
                      value={editSchoolName}
                      onChange={(e) => setEditSchoolName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl disabled:bg-slate-100 text-xs font-bold text-slate-900"
                      placeholder="School Name"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 text-[11px] font-bold">
                      Medium of Instruction (ಬೋಧನಾ ಮಾಧ್ಯಮ)
                    </label>
                    <select
                      disabled={!isEditingDates}
                      value={editSchoolMedium}
                      onChange={(e) => setEditSchoolMedium(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl disabled:bg-slate-100 text-xs font-bold text-slate-900 bg-white cursor-pointer"
                    >
                      <option value="Kannada">Kannada Medium (ಕನ್ನಡ)</option>
                      <option value="English">English Medium (ಆಂಗ್ಲ)</option>
                      <option value="Urdu">Urdu Medium (ಉರ್ದು)</option>
                      <option value="Marathi">Marathi Medium (ಮರಾಠಿ)</option>
                      <option value="Hindi">Hindi Medium (ಹಿಂದಿ)</option>
                      <option value="Telugu">Telugu Medium (ತೆಲುಗು)</option>
                      <option value="Tamil">Tamil Medium (ತಮಿಳು)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 mb-1 text-[11px] font-semibold">
                      Subscription Start Date
                    </label>
                    <input
                      type="date"
                      disabled={!isEditingDates}
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl disabled:bg-slate-100 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 text-[11px] font-semibold">
                      Subscription Expiry Date
                    </label>
                    <input
                      type="date"
                      disabled={!isEditingDates}
                      value={editExpiryDate}
                      onChange={(e) => setEditExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl disabled:bg-slate-100 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 text-[11px] font-semibold">
                    Admin Notes / Transaction Audit Log
                  </label>
                  <textarea
                    rows={2}
                    disabled={!isEditingDates}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="e.g. Paid via PhonePe Txn #4239812498"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl disabled:bg-slate-100 text-xs"
                  />
                </div>

                {/* Direct WhatsApp button with current dates */}
                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsAppModal(selectedSchool)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition text-xs cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send WhatsApp Message with Validity Dates</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-between items-center">
              {deleteConfirmId === selectedSchool.schoolId ? (
                <button
                  onClick={() => handleDeleteSchool(selectedSchool)}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-xl font-bold text-xs cursor-pointer"
                >
                  Click to Confirm Delete
                </button>
              ) : (
                <button
                  onClick={() => setDeleteConfirmId(selectedSchool.schoolId)}
                  className="text-red-600 hover:text-red-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete School</span>
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedSchool(null);
                  setIsEditingDates(false);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
