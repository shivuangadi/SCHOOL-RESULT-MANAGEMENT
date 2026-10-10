import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  MessageSquare,
  Phone,
  MapPin,
  Award,
  X,
  Lock,
  Camera,
  Upload,
  User,
  Check,
  Loader2,
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AngadiPhotoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

// Compress and optimize real image file to ~480px JPEG data URL for permanent storage
const compressImageFile = (file: File, maxDim = 480, quality = 0.9): Promise<string> => {
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
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const AngadiPhoto: React.FC<AngadiPhotoProps> = ({ size = 'md', showBadge = true }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real photo URL state (loaded from Firestore, localStorage, or Google Drive)
  const defaultDriveLink = 'https://lh3.googleusercontent.com/d/1MPoabiZrPxObN4L0gEQtbCGNnXs_xREO';
  const [realPhotoUrl, setRealPhotoUrl] = useState<string>(() => {
    return localStorage.getItem('angadi_real_photo') || defaultDriveLink;
  });

  // Listen to Firestore systemSettings/creatorProfile for permanent real photo
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, 'systemSettings', 'creatorProfile'),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data?.photoUrl && typeof data.photoUrl === 'string') {
              setRealPhotoUrl(data.photoUrl);
              localStorage.setItem('angadi_real_photo', data.photoUrl);
            }
          }
        },
        (err) => console.warn('Firestore creatorProfile listener:', err)
      );
      return () => unsub();
    } catch (e) {
      console.warn('Failed to listen to creatorProfile:', e);
    }
  }, []);

  const saveAndSetPhoto = async (file: File) => {
    try {
      setIsSaving(true);
      const dataUrl = await compressImageFile(file, 480, 0.9);

      // Save permanently to Firestore cloud database
      await setDoc(
        doc(db, 'systemSettings', 'creatorProfile'),
        {
          photoUrl: dataUrl,
          creatorName: 'Shri S R Angadi',
          designation: 'SCIENCE TEACHER',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setRealPhotoUrl(dataUrl);
      localStorage.setItem('angadi_real_photo', dataUrl);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save real photo:', err);
      alert('Could not process photo. Please try choosing the file again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Instant Clipboard Paste (Ctrl+V) listener:
  // When user pastes anywhere, if clipboard has an image, it immediately sets their real photo!
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            await saveAndSetPhoto(blob);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      saveAndSetPhoto(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      saveAndSetPhoto(file);
    }
  };

  const dimClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14 sm:w-16 sm:h-16',
    lg: 'w-20 h-20 sm:w-24 sm:h-24',
  }[size];

  return (
    <>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="relative group cursor-pointer text-left focus:outline-none"
          title="Shri S R Angadi - Science Teacher (Click to view profile / press Ctrl+V to paste photo)"
          aria-label="Shri S R Angadi Profile"
        >
          {/* Circular Photo Frame with Gold Glowing Ring */}
          <div
            className={`${dimClasses} rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 shadow-lg ring-2 ring-amber-300/70 transition transform group-hover:scale-105 shrink-0`}
          >
            <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-900 flex items-center justify-center">
              {realPhotoUrl ? (
                <img
                  src={realPhotoUrl}
                  alt="Shri S R Angadi"
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    // If Google Drive link fails due to private permissions, fallback to secondary Drive endpoint
                    if (realPhotoUrl.includes('lh3.googleusercontent.com')) {
                      setRealPhotoUrl('https://drive.google.com/uc?export=view&id=1MPoabiZrPxObN4L0gEQtbCGNnXs_xREO');
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-900 to-indigo-950 flex flex-col items-center justify-center text-amber-300">
                  <User className="w-6 h-6 text-amber-400" />
                </div>
              )}
            </div>
          </div>

          {/* Teacher Verified Badge Dot */}
          <div
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white shadow"
            title="Verified Creator & Mentor"
          >
            <ShieldCheck className="w-3 h-3 text-white" />
          </div>
        </button>

        {showBadge && (
          <div className="hidden sm:block text-left">
            <div className="text-[11px] font-extrabold uppercase text-amber-300 tracking-wider flex items-center gap-1">
              <span>SHRI. S R ANGADI</span>
            </div>
            <div className="text-[11px] text-blue-100 font-medium">
              SCIENCE TEACHER, Govt KHPS Ningyanatti
            </div>
            <div className="text-[10px] text-emerald-300 font-mono font-bold flex items-center gap-1">
              <Phone className="w-2.5 h-2.5" />
              <span>+91 97317 66727</span>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input for Real Photo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Creator Profile Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">System Architect & Creator Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 text-center space-y-4">
              {/* Real Photo Display with Gold Border */}
              <div className="relative inline-block mx-auto group">
                <div
                  className="w-32 h-32 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 shadow-xl ring-4 ring-amber-200/60 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to select or change real photo (or press Ctrl+V to paste)"
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center relative">
                    {realPhotoUrl ? (
                      <img
                        src={realPhotoUrl}
                        alt="Shri S R Angadi"
                        className="w-full h-full object-cover object-top"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-slate-400">
                        <Camera className="w-8 h-8 text-amber-400 mb-1" />
                        <span className="text-[10px] font-bold">Select Photo</span>
                      </div>
                    )}

                    {/* Hover Overlay to Replace Photo */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                      <Camera className="w-6 h-6 text-amber-300 mb-1" />
                      <span className="text-[10px] font-bold">Change Photo</span>
                    </div>
                  </div>
                </div>

                <div
                  className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white shadow-md"
                  title="Official Verified Creator"
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Success Notification */}
              {savedSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Real photo saved permanently!</span>
                </div>
              )}

              {/* Saving Indicator */}
              {isSaving && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Saving real photo to cloud database...</span>
                </div>
              )}

              <div>
                <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold uppercase tracking-wider mb-1 border border-amber-300">
                  <Lock className="w-3 h-3 text-amber-800" />
                  <span>Official Creator Portrait</span>
                </div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">
                  SHRI. S R ANGADI
                </h4>
                <p className="text-xs text-blue-900 font-extrabold uppercase mt-0.5 tracking-wide">
                  SCIENCE TEACHER
                </p>
                <p className="text-xs text-slate-600 flex items-center justify-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>Govt KHPS Ningyanatti, Belagavi, Karnataka</span>
                </p>
              </div>

              {/* Direct Contacts & Information */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">WhatsApp Helpline:</span>
                  <span className="font-mono font-bold text-slate-900">+91 9731766727</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Official UPI ID:</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    9731766727@ybl
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Pass Key Subscription:</span>
                  <span className="font-bold text-slate-900">₹500 / 1-Year License</span>
                </div>
              </div>

              {/* One-click photo upload button */}
              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Choose Photo File (or Press Ctrl+V to Paste)</span>
                </button>

                {/* Direct WhatsApp Action Button */}
                <a
                  href="https://wa.me/919731766727?text=Namaskara%20Shri%20S%20R%20Angadi%20Sir%2C%20I%20am%20contacting%20regarding%20the%20School%20Result%20Management%20System."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span>Chat with Shri S R Angadi on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
