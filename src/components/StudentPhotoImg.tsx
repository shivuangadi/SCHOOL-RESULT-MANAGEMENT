import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { resolvePhotoUrl, getPhotoFromLocalDb } from '../utils/studentPhotoHelper';

interface StudentPhotoImgProps {
  student?: {
    photoUrl?: string;
    photoPath?: string;
    studentName?: string;
  } | null;
  className?: string;
  alt?: string;
  fallback?: React.ReactNode;
}

export const StudentPhotoImg: React.FC<StudentPhotoImgProps> = ({
  student,
  className = 'w-9 h-11 rounded-md object-cover border border-slate-300 shadow-2xs shrink-0 bg-white',
  alt = '',
  fallback,
}) => {
  const [src, setSrc] = useState<string | null>(student?.photoUrl || null);

  useEffect(() => {
    let isMounted = true;

    if (student?.photoUrl && student.photoUrl.startsWith('https://')) {
      setSrc(student.photoUrl);
      return;
    }

    if (student?.photoPath) {
      resolvePhotoUrl(student.photoPath, student.photoUrl).then((resolved) => {
        if (isMounted && resolved) {
          setSrc(resolved);
        }
      });
    } else {
      setSrc(student?.photoUrl || null);
    }

    return () => {
      isMounted = false;
    };
  }, [student?.photoUrl, student?.photoPath]);

  if (!src) {
    return (
      fallback || (
        <div className="w-9 h-11 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
          <User className="w-5 h-5 text-slate-300" />
        </div>
      )
    );
  }

  return (
    <img
      src={src}
      alt={alt || student?.studentName || 'Student Photo'}
      className={className}
      loading="lazy"
      onError={async () => {
        if (student?.photoPath) {
          const blob = await getPhotoFromLocalDb(student.photoPath);
          if (blob) {
            setSrc(URL.createObjectURL(blob));
          }
        }
      }}
    />
  );
};
