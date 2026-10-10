import React from 'react';
import { isCwsnStudent } from '../types';

interface CwsnBadgeProps {
  status?: string;
  className?: string;
}

export const CwsnBadge: React.FC<CwsnBadgeProps> = ({ status, className = '' }) => {
  if (!isCwsnStudent(status)) return null;

  return (
    <span
      className={`inline-block bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded ml-1.5 text-[11px] leading-tight whitespace-nowrap shadow-xs align-middle select-none ${className}`}
      style={{
        display: 'inline-block',
        backgroundColor: '#dc2626',
        color: '#ffffff',
        fontWeight: 800,
        padding: '2px 6px',
        marginLeft: '5px',
        borderRadius: '4px',
        fontSize: '0.85em',
        lineHeight: '1.2',
        whiteSpace: 'nowrap',
      }}
      title="CWSN (Children with Special Needs - ವಿಶೇಷ ಅಗತ್ಯವುಳ್ಳ ಮಗು)"
    >
      (CWSN)
    </span>
  );
};
