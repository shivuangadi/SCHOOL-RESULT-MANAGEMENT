import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerFieldProps {
  value: string; // usually DD/MM/YYYY
  onChange: (dmyValue: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
}

// Convert DD/MM/YYYY -> YYYY-MM-DD
export const dmyToYmd = (dmy?: string): string => {
  if (!dmy) return '';
  const parts = dmy.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  // If already in YYYY-MM-DD format
  if (dmy.includes('-')) {
    const parts2 = dmy.split('-');
    if (parts2.length === 3 && parts2[0].length === 4) {
      return dmy;
    }
  }
  return '';
};

// Convert YYYY-MM-DD -> DD/MM/YYYY
export const ymdToDmy = (ymd?: string): string => {
  if (!ymd) return '';
  const parts = ymd.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }
  return ymd;
};

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  value,
  onChange,
  label,
  placeholder = 'DD/MM/YYYY',
  required = false,
  className = '',
  minDate,
  maxDate,
}) => {
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);

  const isoValue = dmyToYmd(value);

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ymd = e.target.value;
    if (ymd) {
      const dmy = ymdToDmy(ymd);
      onChange(dmy);
    }
  };

  const handleOpenPicker = () => {
    try {
      const el = hiddenDateInputRef.current as HTMLInputElement | null;
      if (el) {
        if (typeof (el as any).showPicker === 'function') {
          (el as any).showPicker();
        } else {
          el.focus();
        }
      }
    } catch {
      (hiddenDateInputRef.current as any)?.focus();
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-slate-700 font-bold mb-1 text-xs sm:text-sm">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {/* Visible display input where user sees DD/MM/YYYY and can type or click calendar */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-none font-mono text-sm font-bold bg-white text-slate-900 placeholder:font-normal placeholder:text-slate-400"
        />

        {/* Calendar Picker Icon Container with overlaid native date picker */}
        <div className="absolute right-1.5 flex items-center justify-center w-8 h-8">
          <Calendar className="w-5 h-5 text-blue-700 pointer-events-none" />
          <input
            ref={hiddenDateInputRef}
            type="date"
            value={isoValue}
            min={minDate}
            max={maxDate}
            onChange={handleNativeDateChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            title="Open calendar date picker (ದಿನಾಂಕ ಆಯ್ಕೆ ಮಾಡಿ)"
          />
        </div>
      </div>
    </div>
  );
};
