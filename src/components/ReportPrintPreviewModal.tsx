import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCheck2,
  AlertCircle,
  Share2,
} from 'lucide-react';
import {
  executeReportPrint,
  downloadElementAsPdf,
  openCleanPrintWindow,
  shareReportToWhatsApp,
} from '../utils/printPdfHelper';

interface ReportPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  filename?: string;
  children: React.ReactNode;
}

export const ReportPrintPreviewModal: React.FC<ReportPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  filename = 'School_Report.pdf',
  children,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isSharingWa, setIsSharingWa] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const showTemporaryStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handlePrint = async () => {
    if (printContentRef.current) {
      showTemporaryStatus('ಮುದ್ರಣ ವಿಂಡೋ ತೆರೆಯಲಾಗುತ್ತಿದೆ... / Opening print dialog...');
      await executeReportPrint(printContentRef.current, title);
    }
  };

  const handleDownloadPdf = async () => {
    if (printContentRef.current) {
      setIsExportingPdf(true);
      showTemporaryStatus('PDF ತಯಾರಿಸಲಾಗುತ್ತಿದೆ... / Generating PDF file...');
      try {
        const ok = await downloadElementAsPdf(printContentRef.current, filename);
        if (ok) {
          showTemporaryStatus('✅ PDF ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ! / PDF downloaded successfully!');
        } else {
          showTemporaryStatus('⚠️ ಮುದ್ರಣ ವಿಂಡೋದಲ್ಲಿ "Save as PDF" ಆಯ್ಕೆಮಾಡಿ.');
        }
      } catch (err) {
        console.error('PDF error:', err);
        showTemporaryStatus('⚠️ ಮುದ್ರಣ ವಿಂಡೋದಲ್ಲಿ "Save as PDF" ಆಯ್ಕೆಮಾಡಿ.');
      } finally {
        setIsExportingPdf(false);
      }
    }
  };

  const handleOpenInNewTab = () => {
    if (printContentRef.current) {
      showTemporaryStatus('ಹೊಸ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ತೆರೆಯಲಾಗುತ್ತಿದೆ... / Opening clean print tab...');
      openCleanPrintWindow(printContentRef.current, title);
    }
  };

  const handleShareWhatsApp = async () => {
    if (printContentRef.current) {
      setIsSharingWa(true);
      showTemporaryStatus('ವರದಿಯ ಫೋಟೋ ತಯಾರಿಸಿ WhatsApp ತೆರೆಯಲಾಗುತ್ತಿದೆ...');
      try {
        const summary = `*${title}*\n${subtitle ? `${subtitle}\n` : ''}📅 ದಿನಾಂಕ: ${new Date().toLocaleDateString('kn-IN')}`;
        await shareReportToWhatsApp(printContentRef.current, summary, filename.replace(/\.pdf$/i, ''));
        showTemporaryStatus('✅ WhatsApp ಫೋಟೋ ಹಂಚಿಕೆ ಯಶಸ್ವಿಯಾಗಿದೆ!');
      } catch (err) {
        console.error('WhatsApp share error:', err);
        showTemporaryStatus('WhatsApp ಹಂಚಿಕೆ ವಿಫಲವಾಗಿದೆ.');
      } finally {
        setIsSharingWa(false);
      }
    }
  };

  const zoomScale = zoomLevel / 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl h-[94vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-3.5 sm:p-4 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white tracking-wide">
                  {title}
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ಮುನ್ನೋಟ • Preview
                </span>
              </div>
              {subtitle && (
                <p className="text-xs font-semibold text-slate-400 mt-0.5 truncate max-w-md">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700 mr-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer"
                title="Zoom Out (ಕಿರಿದಾಗಿಸಿ)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold px-1.5 text-amber-300 min-w-[42px] text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer"
                title="Zoom In (ದೊಡ್ಡದಾಗಿಸಿ)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer"
                title="Reset Zoom (100%)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Direct Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition cursor-pointer"
              title="Print Now / ಈಗಲೇ ಮುದ್ರಿಸಿ"
            >
              <Printer className="w-4 h-4" />
              <span>ಮುದ್ರಿಸಿ / Print</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition cursor-pointer"
              title="Download PDF File / ಪಿಡಿಎಫ್ ಡೌನ್‌ಲೋಡ್"
            >
              <Download className={`w-4 h-4 ${isExportingPdf ? 'animate-bounce' : ''}`} />
              <span>
                {isExportingPdf ? 'PDF ತಯಾರಾಗುತ್ತಿದೆ...' : 'PDF ಡೌನ್‌ಲೋಡ್'}
              </span>
            </button>

            {/* Share WhatsApp Photo Button */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isSharingWa}
              className="px-3.5 sm:px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md shadow-teal-900/30 transition cursor-pointer"
              title="Share photo of this report to WhatsApp / ವಾಟ್ಸಾಪ್ ಫೋಟೋ ಹಂಚಿಕೆ"
            >
              <Share2 className={`w-4 h-4 ${isSharingWa ? 'animate-spin' : ''}`} />
              <span>{isSharingWa ? 'ಫೋಟೋ ತಯಾರಾಗುತ್ತಿದೆ...' : 'WhatsApp Photo'}</span>
            </button>

            {/* Open in Clean Tab Button (Guaranteed IFrame Bypass) */}
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="hidden md:flex px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold items-center gap-1.5 transition cursor-pointer"
              title="Open in Clean Tab / ಹೊಸ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>ಹೊಸ ಟ್ಯಾಬ್ (New Tab)</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition ml-1"
              title="Close Preview (ಮುಚ್ಚಿ)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative Guidance Banner */}
        <div className="bg-slate-950/70 px-4 py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-amber-300">ಪಿಡಿಎಫ್ ಉಳಿಸಲು ಸಲಹೆ:</strong>{' '}
              'ಮುದ್ರಿಸಿ' ಕ್ಲಿಕ್ ಮಾಡಿದಾಗ ಮುದ್ರಣ ವಿಂಡೋದ <strong>Destination</strong> ನಲ್ಲಿ{' '}
              <strong className="text-white underline decoration-amber-400">Save as PDF (ಪಿಡಿಎಫ್ ಆಗಿ ಉಳಿಸಿ)</strong>{' '}
              ಆಯ್ಕೆಮಾಡಿ.
            </span>
          </div>
          {statusMessage && (
            <div className="bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-md font-bold text-xs animate-pulse">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Scrollable Preview Canvas Stage */}
        <div className="flex-1 overflow-auto bg-slate-950/60 p-4 sm:p-8 flex justify-center items-start">
          <div
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="w-full max-w-[850px] shadow-2xl bg-white rounded-xl overflow-hidden print-preview-sheet"
          >
            {/* The printable document container */}
            <div ref={printContentRef} className="bg-white p-4 sm:p-8 text-slate-900">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
