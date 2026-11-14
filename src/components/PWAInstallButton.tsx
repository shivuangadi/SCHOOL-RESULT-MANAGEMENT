import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, CheckCircle, Smartphone, X, Share2, Monitor, Sparkles, ExternalLink } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'dashboard' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header', className = '' }) => {
  const { isInstalled, hasNativePrompt, isInIframe, showManualGuide, setShowManualGuide, install, isIOS } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallClick = async () => {
    if (isInstalled) {
      setShowManualGuide(true);
      return;
    }
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  // 1. Header Variant
  if (variant === 'header') {
    if (isInstalled) {
      return (
        <>
          <button
            onClick={() => setShowManualGuide(true)}
            title="SRMS ಅಪ್ಲಿಕೇಶನ್ ಯಶಸ್ವಿಯಾಗಿ ಸ್ಥಾಪಿಸಲಾಗಿದೆ (App Installed)"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-emerald-900 bg-emerald-100 border border-emerald-400 shadow-sm hover:bg-emerald-200 transition-colors cursor-pointer ${className}`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <div className="flex flex-col text-left leading-tight">
              <span className="font-extrabold tracking-wide">APP INSTALLED</span>
              <span className="text-[9px] text-emerald-800 font-semibold hidden sm:block">ಆಪ್ ಸ್ಥಾಪಿಸಲಾಗಿದೆ</span>
            </div>
          </button>
          {showManualGuide && (
            <InstallGuideModal
              isInstalled={true}
              hasNativePrompt={hasNativePrompt}
              isInIframe={isInIframe}
              isIOS={isIOS}
              onTriggerInstall={handleInstallClick}
              onClose={() => setShowManualGuide(false)}
            />
          )}
        </>
      );
    }

    return (
      <>
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          title="ಮೊಬೈಲ್‌ನಲ್ಲಿ SRMS ಆಪ್ ಸ್ಥಾಪಿಸಿ - Install SRMS App"
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-md hover:shadow-lg transition-all transform active:scale-95 border border-amber-400 cursor-pointer ${className}`}
        >
          <img src="/pwa-192x192.png" alt="SRMS" className="w-4 h-4 rounded-full bg-white object-contain" />
          <Download className="w-3.5 h-3.5 text-white animate-bounce" />
          <div className="flex flex-col text-left leading-tight">
            <span className="font-extrabold tracking-wide">INSTALL SRMS APP</span>
            <span className="text-[9px] text-amber-100 font-normal">ಮೊಬೈಲ್‌ನಲ್ಲಿ ಆಪ್ ಸ್ಥಾಪಿಸಿ</span>
          </div>
        </button>
        {showManualGuide && (
          <InstallGuideModal
            isInstalled={isInstalled}
            hasNativePrompt={hasNativePrompt}
            isInIframe={isInIframe}
            isIOS={isIOS}
            onTriggerInstall={handleInstallClick}
            onClose={() => setShowManualGuide(false)}
          />
        )}
      </>
    );
  }

  // 2. Compact Variant
  if (variant === 'compact') {
    if (isInstalled) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          ಆಪ್ ಸ್ಥಾಪಿಸಲಾಗಿದೆ
        </span>
      );
    }
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded shadow transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          ಆಪ್ ಸ್ಥಾಪಿಸಿ (Install)
        </button>
        {showManualGuide && (
          <InstallGuideModal
            isInstalled={isInstalled}
            hasNativePrompt={hasNativePrompt}
            isInIframe={isInIframe}
            isIOS={isIOS}
            onTriggerInstall={handleInstallClick}
            onClose={() => setShowManualGuide(false)}
          />
        )}
      </>
    );
  }

  // 3. Dashboard Big Card Variant
  return (
    <>
      <div className={`relative overflow-hidden rounded-2xl border ${isInstalled ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-teal-50' : 'border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50'} p-5 shadow-sm transition-all hover:shadow-md ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <img
                src="/pwa-192x192.png"
                alt="SRMS Official Logo"
                className="w-16 h-16 rounded-2xl shadow-md border-2 border-white object-contain bg-white p-0.5"
              />
              {isInstalled && (
                <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-1 shadow">
                  <CheckCircle className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                  PWA Standalone App
                </span>
                {isInstalled && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> ಆಪ್ ಸ್ಥಾಪಿಸಲಾಗಿದೆ
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-1">
                {isInstalled ? 'SRMS ಮೊಬೈಲ್ ಆಪ್ ಸಿದ್ಧವಾಗಿದೆ (App Ready)' : 'ಮೊಬೈಲ್‌ನಲ್ಲಿ SRMS ಆಪ್ ಸ್ಥಾಪಿಸಿ'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {isInstalled
                  ? 'ನೀವು SRMS ಆಪ್ ಅನ್ನು ನಿಮ್ಮ ಸಾಧನದಲ್ಲಿ ಸ್ಥಾಪಿಸಿದ್ದೀರಿ. ಬ್ರೌಸರ್ ಇಲ್ಲದೆ ನೇರವಾಗಿ ಓಪನ್ ಮಾಡಬಹುದು.'
                  : 'ಕ್ರೋಮ್ ಬ್ರೌಸರ್ ಬಾರ್ ಇಲ್ಲದೆ ಪೂರ್ಣ ಆಪ್‌ನಂತೆ ಬಳಸಿ. ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isInstalled ? (
              <button
                onClick={() => setShowManualGuide(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-emerald-800 bg-white border border-emerald-300 shadow-sm hover:bg-emerald-50 transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>APP INSTALLED</span>
              </button>
            ) : (
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-md hover:shadow-lg transition-all transform active:scale-95 border border-amber-300 cursor-pointer"
              >
                <Download className="w-4 h-4 animate-bounce" />
                <span>INSTALL SRMS APP</span>
              </button>
            )}
            <button
              onClick={() => setShowManualGuide(true)}
              title="ಸ್ಥಾಪನೆ ಮಾರ್ಗದರ್ಶಿ / Install Instructions"
              className="p-2.5 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showManualGuide && (
        <InstallGuideModal
          isInstalled={isInstalled}
          hasNativePrompt={hasNativePrompt}
          isInIframe={isInIframe}
          isIOS={isIOS}
          onTriggerInstall={handleInstallClick}
          onClose={() => setShowManualGuide(false)}
        />
      )}
    </>
  );
};

// -------------------------------------------------------------------------------------
// Manual Install Guide Modal
// -------------------------------------------------------------------------------------
interface InstallGuideModalProps {
  isInstalled: boolean;
  hasNativePrompt: boolean;
  isInIframe: boolean;
  isIOS: boolean;
  onTriggerInstall: () => void;
  onClose: () => void;
}

const InstallGuideModal: React.FC<InstallGuideModalProps> = ({
  isInstalled,
  hasNativePrompt,
  isInIframe,
  isIOS,
  onTriggerInstall,
  onClose,
}) => {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '/';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="SRMS Logo"
              className="w-12 h-12 rounded-xl bg-white p-0.5 object-contain border border-blue-400/40"
            />
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>SRMS ಆಪ್ ಸ್ಥಾಪನೆ ಮಾರ್ಗದರ್ಶಿ</span>
                {isInstalled && <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">ಸ್ಥಾಪಿತ</span>}
              </h3>
              <p className="text-xs text-blue-200">School Result Management System • PWA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4 text-slate-700 text-xs sm:text-sm">
          {isInstalled ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-sm mb-1 text-emerald-800">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>SRMS ಆಪ್ ಈಗಾಗಲೇ ನಿಮ್ಮ ಸಾಧನದಲ್ಲಿ ಸ್ಥಾಪಿಸಲಾಗಿದೆ!</span>
              </div>
              <p className="text-xs text-emerald-700">
                ನಿಮ್ಮ ಮೊಬೈಲ್ ಅಥವಾ ಕಂಪ್ಯೂಟರ್ ಮುಖಪುಟದಲ್ಲಿ SRMS ಐಕಾನ್ ಕಾಣಿಸುತ್ತದೆ. ಅದನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ ನೇರವಾಗಿ ಆಪ್ ರೂಪದಲ್ಲಿ ಬಳಸಬಹುದು.
              </p>
            </div>
          ) : hasNativePrompt ? (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-sm">SRMS ಆಪ್ ಸ್ಥಾಪನೆಗೆ ಸಿದ್ಧವಾಗಿದೆ!</div>
                <p className="text-xs text-emerald-800 mt-0.5">
                  ಕೆಳಗಿನ ಬಟನ್ ಒತ್ತಿ ನಿಮ್ಮ ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ಗೆ SRMS ಐಕಾನ್ ಸೇರಿಸಿ.
                </p>
              </div>
              <button
                onClick={onTriggerInstall}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>ಈಗಲೇ ಸ್ಥಾಪಿಸಿ (Install Now)</span>
              </button>
            </div>
          ) : isInIframe ? (
            <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-xl text-blue-950 space-y-2.5">
              <div className="font-bold text-sm text-blue-900">
                ಪೂರ್ಣ ಬ್ರೌಸರ್ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ (Open in Browser Tab to Install)
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                ನೀವು ಪ್ರಸ್ತುತ ಪ್ರಿವ್ಯೂ ಫ್ರೇಮ್ ಒಳಗೆ ನೋಡುತ್ತಿದ್ದೀರಿ. ಮೊಬೈಲ್ ಅಥವಾ ಕಂಪ್ಯೂಟರ್ ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ನಲ್ಲಿ SRMS ಆಪ್ ಐಕಾನ್ ಸ್ಥಾಪಿಸಲು, ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಬಟನ್ ಒತ್ತಿ ನೇರವಾಗಿ Chrome / Safari ಬ್ರೌಸರ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ:
              </p>
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Chrome / ಬ್ರೌಸರ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ (Open App Directly)</span>
              </a>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
              <strong>ಸೂಚನೆ:</strong> ಸ್ವಯಂಚಾಲಿತ ಪಾಪ್-ಅಪ್ ಕಾಣದಿದ್ದರೆ, ಕೆಳಗಿನ ಹಂತಗಳನ್ನು ಅನುಸರಿಸಿ ನಿಮ್ಮ ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ನಲ್ಲಿ SRMS ಆಪ್ ಐಕಾನ್ ಸೇರಿಸಿಕೊಳ್ಳಿ.
            </div>
          )}

          {/* Android Chrome Instructions */}
          <div className={`border rounded-xl p-4 ${!isIOS ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>Android ಮೊಬೈಲ್ (Chrome ಬ್ರೌಸರ್):</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-slate-600 text-xs leading-relaxed">
              <li>
                Chrome ಬ್ರೌಸರ್‌ನ ಮೇಲಿನ ಬಲಭಾಗದಲ್ಲಿರುವ <strong>ಮೂರು ಚುಕ್ಕೆಗಳನ್ನು (⋮)</strong> ಒತ್ತಿರಿ.
              </li>
              <li>
                ಮೆನುವಿನಲ್ಲಿ <strong>"Add to Home screen" (ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ಗೆ ಸೇರಿಸಿ)</strong> ಅಥವಾ <strong>"Install app" (ಆಪ್ ಸ್ಥಾಪಿಸಿ)</strong> ಆಯ್ಕೆಮಾಡಿ.
              </li>
              <li>
                ಪಾಪ್-ಅಪ್‌ನಲ್ಲಿ <strong>"Install"</strong> ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.
              </li>
              <li>
                ನಿಮ್ಮ ಮೊಬೈಲ್ ಸ್ಕ್ರೀನ್‌ನಲ್ಲಿ ಅಧಿಕೃತ <strong>SRMS ಲೋಗೋ</strong> ಇರುವ ಆಪ್ ಐಕಾನ್ ಸಿದ್ಧವಾಗುತ್ತದೆ!
              </li>
            </ol>
          </div>

          {/* iPhone / iPad Safari Instructions */}
          <div className={`border rounded-xl p-4 ${isIOS ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-2">
              <Share2 className="w-4 h-4 text-indigo-600" />
              <span>iPhone / iPad (Safari ಬ್ರೌಸರ್):</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-slate-600 text-xs leading-relaxed">
              <li>
                Safari ಕೆಳಭಾಗದಲ್ಲಿರುವ <strong>Share (ಹಂಚಿಕೊಳ್ಳಿ)</strong> ಬಟನ್ ಒತ್ತಿರಿ.
              </li>
              <li>
                ಸ್ವಲ್ಪ ಕೆಳಗೆ ಸ್ಕ್ರಾಲ್ ಮಾಡಿ <strong>"Add to Home Screen" (ಮುಖಪುಟಕ್ಕೆ ಸೇರಿಸಿ)</strong> ಆಯ್ಕೆಮಾಡಿ.
              </li>
              <li>
                ಮೇಲಿನ ಬಲಭಾಗದಲ್ಲಿರುವ <strong>"Add"</strong> ಬಟನ್ ಒತ್ತಿರಿ.
              </li>
            </ol>
          </div>

          {/* Desktop Instructions */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-2">
              <Monitor className="w-4 h-4 text-emerald-600" />
              <span>Computer / Laptop (Chrome / Edge):</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-slate-600 text-xs leading-relaxed">
              <li>
                ಅಡ್ರೆಸ್ ಬಾರ್‌ನ (URL bar) ಬಲಭಾಗದಲ್ಲಿರುವ <strong>Install (⬇)</strong> ಐಕಾನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.
              </li>
              <li>
                ಅಥವಾ ಮೆನುವಿನಿಂದ <strong>"Install School Result Management System"</strong> ಆಯ್ಕೆಮಾಡಿ.
              </li>
            </ol>
          </div>

          {/* Features note */}
          <div className="rounded-xl bg-blue-50 p-3 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>ಆಪ್ ವೈಶಿಷ್ಟ್ಯಗಳು:</strong> ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದಿದ್ದರೂ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಅಂಕಗಳನ್ನು ನಮೂದಿಸಬಹುದು. ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಬಂದ ತಕ್ಷಣ ಕ್ಲೌಡ್‌ಗೆ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸುರಕ್ಷಿತವಾಗಿ ಸಿಂಕ್ ಆಗುತ್ತದೆ.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            ಮುಚ್ಚಿ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
