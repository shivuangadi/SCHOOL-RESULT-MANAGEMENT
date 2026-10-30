import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCheck2,
} from 'lucide-react';
import {
  downloadTcAsPdf,
  printTcDirectly,
  shareTcToWhatsApp,
  TcPaperSize,
} from '../utils/tcPrintPdfHelper';

interface TransferCertificatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  filename?: string;
  paperSize: TcPaperSize;
  onPaperSizeChange?: (size: TcPaperSize) => void;
  children: React.ReactNode;
}

export const TransferCertificatePreviewModal: React.FC<TransferCertificatePreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  filename = 'Transfer_Certificate.pdf',
  paperSize,
  onPaperSizeChange,
  children,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isSharingWa, setIsSharingWa] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const previewContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const showTemporaryStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handlePrint = async () => {
    if (previewContentRef.current) {
      showTemporaryStatus('ಮುದ್ರಣ ವಿಂಡೋ ತೆರೆಯಲಾಗುತ್ತಿದೆ... / Opening system print dialog...');
      const ok = await printTcDirectly(previewContentRef.current, title, paperSize);
      if (ok) {
        showTemporaryStatus('✅ ಮುದ್ರಣ ಪ್ರಕ್ರಿಯೆ ಪ್ರಾರಂಭವಾಗಿದೆ / Print dialog dispatched!');
      } else {
        showTemporaryStatus('⚠️ ಮುದ್ರಣ ವಿಂಡೋ ತೆರೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.');
      }
    }
  };

  const handleDownloadPdf = async () => {
    if (previewContentRef.current) {
      setIsExportingPdf(true);
      showTemporaryStatus('TC PDF ತಯಾರಿಸಲಾಗುತ್ತಿದೆ... / Generating pristine single-page PDF...');
      try {
        const ok = await downloadTcAsPdf(previewContentRef.current, filename, paperSize);
        if (ok) {
          showTemporaryStatus('✅ TC PDF ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ! / PDF downloaded successfully!');
        } else {
          showTemporaryStatus('⚠️ PDF ಡೌನ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ, ದಯವಿಟ್ಟು ಮುದ್ರಣ (Print) ಬಳಸಿ.');
        }
      } catch (err) {
        console.error('TC PDF error:', err);
        showTemporaryStatus('⚠️ PDF ಡೌನ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ.');
      } finally {
        setIsExportingPdf(false);
      }
    }
  };

  const handleShareWhatsApp = async () => {
    if (previewContentRef.current) {
      setIsSharingWa(true);
      showTemporaryStatus('ವರ್ಗಾವಣೆ ಪ್ರಮಾಣಪತ್ರದ ಫೋಟೋ ತಯಾರಿಸಿ WhatsApp ತೆರೆಯಲಾಗುತ್ತಿದೆ...');
      try {
        const summary = `*${title}*\n${subtitle ? `${subtitle}\n` : ''}📅 ದಿನಾಂಕ: ${new Date().toLocaleDateString('kn-IN')}`;
        await shareTcToWhatsApp(previewContentRef.current, summary, filename.replace(/\.pdf$/i, ''), paperSize);
        showTemporaryStatus('✅ WhatsApp ಹಂಚಿಕೆ ಪ್ರಕ್ರಿಯೆ ಯಶಸ್ವಿಯಾಗಿದೆ!');
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl h-[94vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-3.5 sm:p-4 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white tracking-wide">
                  {title}
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  TC ಮುನ್ನೋಟ • Preview
                </span>
              </div>
              {subtitle && (
                <p className="text-xs font-semibold text-slate-400 mt-0.5 truncate max-w-md">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons Toolbar - ISOLATED FOR TC */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Paper Size selector */}
            {onPaperSizeChange && (
              <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs font-bold mr-1">
                <button
                  type="button"
                  onClick={() => onPaperSizeChange('A4')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    paperSize === 'A4'
                      ? 'bg-purple-600 text-white font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A4
                </button>
                <button
                  type="button"
                  onClick={() => onPaperSizeChange('Legal')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    paperSize === 'Legal'
                      ? 'bg-purple-600 text-white font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Legal
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700/80 mr-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono font-bold text-slate-300 px-1.5 w-11 text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition ml-0.5"
                title="Reset Zoom"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isSharingWa}
              className="px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-950/40 border border-emerald-500/30 transition disabled:opacity-50 cursor-pointer"
              title="Share TC on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Blue System Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-blue-900/40 border border-blue-400/30 transition cursor-pointer"
              title="Open System Print Dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ಮುದ್ರಣ (Print)</span>
            </button>

            {/* Green Download PDF Button - UNIQUE ISOLATED LOGIC */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 border border-emerald-400/30 transition disabled:opacity-50 cursor-pointer"
              title={`Download pristine 1-page ${paperSize} PDF`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isExportingPdf
                  ? 'ತಯಾರಿಸಲಾಗುತ್ತಿದೆ...'
                  : `PDF (${paperSize})`}
              </span>
            </button>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Temporary Status Banner */}
        {statusMessage && (
          <div className="bg-gradient-to-r from-purple-900/90 to-blue-900/90 text-white px-4 py-2 text-xs font-bold text-center border-b border-purple-700/60 animate-in slide-in-from-top duration-150">
            {statusMessage}
          </div>
        )}

        {/* Preview Scrollable Viewport */}
        <div className="flex-1 bg-slate-950/90 overflow-auto p-4 flex justify-center items-start">
          <div
            ref={previewContentRef}
            className="transition-transform duration-150 origin-top shadow-2xl"
            style={{ transform: `scale(${zoomScale})` }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
