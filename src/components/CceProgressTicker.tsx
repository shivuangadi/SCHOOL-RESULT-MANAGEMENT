import React, { useState } from 'react';
import { Volume2, Pause, Play, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

interface CceProgressTickerProps {
  bulletinText: string;
  hasAlerts: boolean;
  currentExamLabel: string;
  overallPercentDisplay: string;
  onClickBulletin: () => void;
}

export const CceProgressTicker: React.FC<CceProgressTickerProps> = ({
  bulletinText,
  hasAlerts,
  currentExamLabel,
  overallPercentDisplay,
  onClickBulletin,
}) => {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div
      role="region"
      aria-label="CCE Progress Bulletin"
      className="relative w-full rounded-2xl overflow-hidden border shadow-md transition-all bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#d97706] text-white border-amber-300"
    >
      <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 gap-2">
        {/* Left Badge: Clickable to trigger Consolidated Progress */}
        <button
          type="button"
          onClick={onClickBulletin}
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs bg-[#7c2d12] hover:bg-[#9a3412] text-amber-100 border border-amber-400/60"
          title="Click to open Consolidated CCE Progress Report"
        >
          {hasAlerts ? (
            <AlertCircle className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5 text-amber-300" />
          )}
          <span className="hidden sm:inline">CCE BULLETIN</span>
          <span className="sm:hidden font-mono">{currentExamLabel}</span>
          <span className="px-1.5 py-0.2 bg-black/40 rounded text-[10px] font-mono font-bold text-amber-200">
            {overallPercentDisplay}
          </span>
        </button>

        {/* Center: Continuously scrolling news ticker */}
        <div
          className="relative flex-1 overflow-hidden h-7 flex items-center cursor-pointer group"
          onClick={onClickBulletin}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          tabIndex={0}
          title="Click to view detailed class-wise CCE status"
        >
          <div
            className={`whitespace-nowrap flex items-center gap-8 font-sans text-xs sm:text-[13px] font-extrabold text-white drop-shadow-xs ${
              isPaused ? 'cce-ticker-paused' : 'cce-ticker-running'
            }`}
            style={{
              willChange: 'transform',
            }}
          >
            <span>{bulletinText}</span>
            <span className="text-yellow-200 font-black">• Click banner for consolidated report •</span>
            <span>{bulletinText}</span>
          </div>
        </div>

        {/* Right Controls: Pause/Play & View Button */}
        <div className="shrink-0 flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPaused(!isPaused);
            }}
            className="p-1 rounded-lg text-amber-100 hover:text-white hover:bg-black/20 transition cursor-pointer"
            title={isPaused ? 'Play scrolling animation' : 'Pause scrolling animation'}
            aria-label={isPaused ? 'Resume ticker' : 'Pause ticker'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-yellow-200" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onClickBulletin}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#7c2d12] hover:bg-[#9a3412] text-amber-100 hover:text-white text-[11px] font-black transition cursor-pointer border border-amber-400/60 shadow-xs"
            title="Open Consolidated CCE Progress Report"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3 text-amber-300" />
          </button>
        </div>
      </div>

      {/* Scoped CSS animation respecting prefers-reduced-motion */}
      <style>{`
        @keyframes cceTickerScroll {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .cce-ticker-running {
          animation: cceTickerScroll 65s linear infinite;
        }
        .cce-ticker-paused {
          animation-play-state: paused !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .cce-ticker-running {
            animation: none !important;
            overflow-x: auto !important;
          }
        }
      `}</style>
    </div>
  );
};
