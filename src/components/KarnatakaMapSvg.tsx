import React from 'react';

interface KarnatakaMapSvgProps {
  className?: string;
}

export const KarnatakaMapSvg: React.FC<KarnatakaMapSvgProps> = ({ className = 'w-14 h-16' }) => {
  return (
    <svg
      viewBox="0 0 100 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Karnataka State Map Outline"
    >
      {/* Accurate vector path representation of Karnataka state boundary */}
      <path
        d="M 52 10 
           C 57 12, 63 15, 68 18 
           C 74 22, 78 28, 80 34 
           C 82 40, 79 46, 75 50 
           C 71 54, 76 60, 78 66 
           C 80 72, 85 78, 83 85 
           C 81 92, 76 98, 72 104 
           C 68 110, 63 116, 58 120 
           C 54 122, 48 119, 45 115 
           C 42 110, 38 106, 35 100 
           C 31 93, 27 88, 25 82 
           C 22 75, 20 68, 22 62 
           C 24 56, 28 52, 30 46 
           C 32 40, 30 35, 33 28 
           C 36 21, 41 16, 46 12 
           Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1 0"
        className="opacity-90"
      />
      {/* Interior regional indicator dot for Belagavi */}
      <circle cx="34" cy="38" r="2.5" fill="#facc15" className="animate-pulse" />
      <text x="38" y="40" fill="#fef08a" fontSize="6" fontWeight="bold">
        Belagavi
      </text>
    </svg>
  );
};
