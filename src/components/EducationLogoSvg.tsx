import React from 'react';

interface EducationLogoSvgProps {
  className?: string;
}

export const EducationLogoSvg: React.FC<EducationLogoSvgProps> = ({ className = 'w-16 h-16' }) => {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer subtle glow/sun rays */}
      <circle cx="60" cy="60" r="54" fill="white" className="drop-shadow-md" />
      <circle cx="60" cy="60" r="50" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />

      {/* Graduation Cap (Mortarboard) on top */}
      <g transform="translate(0, -6)">
        <polygon points="60,20 88,32 60,44 32,32" fill="#1e3a8a" />
        <polygon points="60,20 88,32 60,34 32,32" fill="#2563eb" />
        {/* Cap skull cap under */}
        <path d="M 44,38 Q 60,50 76,38 L 76,46 Q 60,56 44,46 Z" fill="#1e3a8a" />
        {/* Golden Tassel */}
        <circle cx="60" cy="32" r="2.5" fill="#facc15" />
        <path d="M 60,32 Q 78,34 82,45" stroke="#facc15" strokeWidth="2" strokeLinecap="round" fill="none" />
        <rect x="80" y="44" width="4" height="6" fill="#eab308" rx="1" />
      </g>

      {/* Center Golden Star */}
      <polygon
        points="60,45 62.5,52 70,52 64,56.5 66.5,63.5 60,59 53.5,63.5 56,56.5 50,52 57.5,52"
        fill="#f59e0b"
      />

      {/* Celebrating Stylized Student Figures (Orange, Green, Cyan) */}
      {/* Center Figure (Cyan/Blue) */}
      <circle cx="60" cy="56" r="4" fill="#0284c7" />
      <path
        d="M 50,75 C 50,68 54,64 60,64 C 66,64 70,68 70,75 Z"
        fill="#0284c7"
      />
      {/* Left Figure (Orange) */}
      <circle cx="43" cy="62" r="3.5" fill="#ea580c" />
      <path
        d="M 33,80 C 34,73 38,70 44,70 C 48,70 51,73 51,80 Z"
        fill="#ea580c"
      />
      {/* Right Figure (Green) */}
      <circle cx="77" cy="62" r="3.5" fill="#16a34a" />
      <path
        d="M 69,80 C 69,73 72,70 76,70 C 82,70 87,73 87,80 Z"
        fill="#16a34a"
      />

      {/* Open Book Pages at the base */}
      <path
        d="M 28,94 C 42,91 54,92 60,98 C 66,92 78,91 92,94 L 92,86 C 78,83 66,84 60,90 C 54,84 42,83 28,86 Z"
        fill="#f8fafc"
        stroke="#1e3a8a"
        strokeWidth="2.5"
      />
      {/* Book spine line */}
      <line x1="60" y1="90" x2="60" y2="102" stroke="#1e3a8a" strokeWidth="2.5" />
      <path
        d="M 28,94 L 32,102 C 45,99 54,100 60,102 C 66,100 75,99 88,102 L 92,94"
        fill="#cbd5e1"
        stroke="#1e3a8a"
        strokeWidth="2"
      />
    </svg>
  );
};
