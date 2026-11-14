import React, { useState, useEffect } from 'react';
import { WifiOff, ShieldCheck, RefreshCw, X } from 'lucide-react';
import { srmsSyncEngine, SyncEngineState } from '../utils/srmsSyncEngine';

export const OfflineNotificationBanner: React.FC = () => {
  const [state, setState] = useState<SyncEngineState>(srmsSyncEngine.getStatus());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsub = srmsSyncEngine.subscribe((newState) => {
      setState(newState);
      // Reset dismissed state when going from online to offline
      if (!newState.isOnline) {
        setDismissed(false);
      }
    });
    return unsub;
  }, []);

  // Only render when offline and not dismissed
  if (state.isOnline || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white px-4 py-2.5 shadow-md border-b border-amber-500/50 relative z-40 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-full bg-black/20 shrink-0">
            <WifiOff className="w-4 h-4 text-amber-100 animate-pulse" />
          </div>
          <div>
            <div className="font-extrabold uppercase tracking-wide flex items-center gap-2">
              <span>OFFLINE MODE – DATA SAVED ON DEVICE</span>
              {state.pendingCount > 0 && (
                <span className="bg-black/30 px-2 py-0.5 rounded text-[10px] font-mono">
                  {state.pendingCount} ಬದಲಾವಣೆ ಬಾಕಿ ಇದೆ
                </span>
              )}
            </div>
            <div className="text-amber-100 text-[11px] font-normal flex items-center gap-1.5 mt-0.5">
              <span>ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವಿಲ್ಲ. ಮಾಹಿತಿಯನ್ನು ಮೊಬೈಲ್‌ನಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಉಳಿಸಲಾಗುತ್ತಿದೆ. ಇಂಟರ್ನೆಟ್ ಬಂದ ತಕ್ಷಣ ಕ್ಲೌಡ್‌ಗೆ ತಾನಾಗಿಯೇ ಸಿಂಕ್ ಆಗುತ್ತದೆ.</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 inline shrink-0" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => srmsSyncEngine.syncNow()}
            className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>ಮರುಪರಿಶೀಲಿಸಿ</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-white/80 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
            title="ಮುಚ್ಚಿ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
