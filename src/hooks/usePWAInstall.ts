import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __srmsDeferredInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

const INSTALLED_STORAGE_KEY = 'srms_pwa_installed_v1';

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isNavStandalone = (navigator as any).standalone === true;
  const isAndroidApp = document.referrer?.includes('android-app://');
  return Boolean(isStandalone || isNavStandalone || isAndroidApp);
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__srmsDeferredInstallPrompt) {
      return window.__srmsDeferredInstallPrompt;
    }
    return null;
  });

  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (detectStandalone()) {
      try {
        localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
      } catch {
        // ignore storage errors
      }
      return true;
    }
    try {
      return localStorage.getItem(INSTALLED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isInIframe, setIsInIframe] = useState<boolean>(false);
  const [showManualGuide, setShowManualGuide] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Pick up early-captured prompt if it fired before mount
    if (window.__srmsDeferredInstallPrompt && !detectStandalone()) {
      setDeferredPrompt(window.__srmsDeferredInstallPrompt);
      setIsInstalled(false);
      try {
        localStorage.removeItem(INSTALLED_STORAGE_KEY);
      } catch {
        // ignore
      }
    }

    // Check installed related apps API if supported (Chrome/Android)
    const navAny = navigator as any;
    if (typeof navAny.getInstalledRelatedApps === 'function') {
      navAny
        .getInstalledRelatedApps()
        .then((apps: any[]) => {
          if (Array.isArray(apps) && apps.length > 0) {
            setIsInstalled(true);
            try {
              localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
            } catch {
              // ignore
            }
          }
        })
        .catch(() => {});
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // Detect embedded iframe (browsers block beforeinstallprompt inside iframes)
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    // Check display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setDeferredPrompt(null);
        window.__srmsDeferredInstallPrompt = null;
        try {
          localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
        } catch {
          // ignore
        }
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayChange);
    } else {
      mediaQuery.addListener(handleDisplayChange);
    }

    // Capture beforeinstallprompt (fires only when browser detects app is NOT currently installed)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__srmsDeferredInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstalled(false);
      try {
        localStorage.removeItem(INSTALLED_STORAGE_KEY);
      } catch {
        // ignore
      }
    };

    const handleEarlyPromptReady = () => {
      if (window.__srmsDeferredInstallPrompt) {
        setDeferredPrompt(window.__srmsDeferredInstallPrompt);
        setIsInstalled(false);
      }
    };

    // Capture appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__srmsDeferredInstallPrompt = null;
      setShowManualGuide(false);
      try {
        localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('srms-install-prompt-ready', handleEarlyPromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('srms-install-prompt-ready', handleEarlyPromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayChange);
      } else {
        mediaQuery.removeListener(handleDisplayChange);
      }
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'manual'> => {
    const activePrompt = deferredPrompt || (typeof window !== 'undefined' ? window.__srmsDeferredInstallPrompt : null);
    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choice = await activePrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          try {
            localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
          } catch {
            // ignore
          }
        }
        setDeferredPrompt(null);
        window.__srmsDeferredInstallPrompt = null;
        return choice.outcome;
      } catch (err) {
        console.warn('Error during PWA prompt:', err);
        setShowManualGuide(true);
        return 'manual';
      }
    } else {
      setShowManualGuide(true);
      return 'manual';
    }
  }, [deferredPrompt]);

  return {
    hasNativePrompt: Boolean(deferredPrompt),
    isInstallable: Boolean(deferredPrompt) || !isInstalled,
    isInstalled,
    isIOS,
    isInIframe,
    showManualGuide,
    setShowManualGuide,
    install,
  };
}
