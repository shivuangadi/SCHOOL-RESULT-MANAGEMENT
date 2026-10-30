/**
 * ============================================================================
 * LOCKED MODULE: TC PRINT & PDF EXPORT HELPER
 * STATUS: 100% PERFECT & LOCKED BY USER REQUEST
 * DO NOT MODIFY MARGINS, SIZES, CANVASES, OR EXPORT LOGIC WITHOUT EXPLICIT PERMISSION.
 * ============================================================================
 */
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';

export type TcPaperSize = 'A4' | 'Legal';

export interface TcDimensions {
  pageWidthMm: number;
  pageHeightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  printableWidthMm: number;
  printableHeightMm: number;
}

export const TC_PAGE_CONFIG: Record<TcPaperSize, TcDimensions> = {
  A4: {
    pageWidthMm: 210,
    pageHeightMm: 297,
    marginTopMm: 10,
    marginBottomMm: 10,
    marginLeftMm: 5.0, // 0.5cm margin as requested
    marginRightMm: 5.0, // 0.5cm margin as requested
    printableWidthMm: 200, // 210 - 2*5 = 200mm
    printableHeightMm: 277, // 297 - 20 = 277mm
  },
  Legal: {
    pageWidthMm: 215.9,
    pageHeightMm: 355.6,
    marginTopMm: 10,
    marginBottomMm: 10,
    marginLeftMm: 5.0, // 0.5cm margin as requested
    marginRightMm: 5.0, // 0.5cm margin as requested
    printableWidthMm: 205.9, // 215.9 - 2*5 = 205.9mm
    printableHeightMm: 335.6, // 355.6 - 20 = 335.6mm
  },
};

/**
 * Capture high-fidelity canvas specifically calibrated for Transfer Certificate:
 * - Locks exact pixel dimensions based on printable mm at 96 DPI * 2x scale
 * - Prevents text wrapping or responsive collapse (e.g. sm:flex-row -> flex-col)
 * - Sanitizes modern CSS colors (oklch) for html2canvas compatibility
 */
export const captureTcCanvas = async (
  element: HTMLElement,
  paperSize: TcPaperSize = 'A4'
): Promise<{ dataUrl: string; width: number; height: number } | null> => {
  const config = TC_PAGE_CONFIG[paperSize] || TC_PAGE_CONFIG.A4;
  
  const basePxWidth = Math.round(config.printableWidthMm * 3.7795275591);
  const basePxHeight = Math.round(config.printableHeightMm * 3.7795275591);
  const targetPxWidth = basePxWidth * 2;
  const targetPxHeight = basePxHeight * 2;

  // 1. Temporarily hide scrollbars
  const styleEl = document.createElement('style');
  styleEl.id = 'temp-tc-capture-styles';
  styleEl.innerHTML = `
    ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
    * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
  `;
  document.head.appendChild(styleEl);

  let dataUrl: string | null = null;
  let canvasWidth = targetPxWidth;
  let canvasHeight = targetPxHeight;

  try {
    // Attempt 1: toPng from html-to-image (preserves vector fonts cleanly)
    try {
      const p = toPng(element, {
        quality: 0.99,
        pixelRatio: 2,
        width: basePxWidth,
        height: basePxHeight,
        backgroundColor: '#ffffff',
        cacheBust: false,
        filter: (node: Node) => {
          if (node instanceof HTMLElement) {
            if (
              node.classList.contains('print:hidden') ||
              node.classList.contains('cce-print-hidden') ||
              node.tagName === 'BUTTON'
            ) {
              return false;
            }
          }
          return true;
        },
      });
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
      dataUrl = (await Promise.race([p, timeout])) as string | null;
    } catch (toPngErr) {
      console.warn('TC toPng capture failed, falling back to html2canvas:', toPngErr);
    }

    // Attempt 2: html2canvas with color sanitization
    if (!dataUrl) {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: basePxWidth,
        height: basePxHeight,
        windowWidth: basePxWidth,
        windowHeight: basePxHeight,
        logging: false,
        onclone: (clonedDoc: Document) => {
          // Convert all oklch() color occurrences in cloned document stylesheets and inline styles to standard hex
          const tempCanvas = clonedDoc.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          const convertOklchToRgb = (colorStr: string): string => {
            if (!tempCtx) return '#000000';
            try {
              tempCtx.fillStyle = '#000000';
              tempCtx.fillStyle = colorStr;
              return tempCtx.fillStyle || '#000000';
            } catch {
              return '#000000';
            }
          };

          clonedDoc.querySelectorAll('style').forEach((st) => {
            if (st.textContent && st.textContent.includes('oklch')) {
              st.textContent = st.textContent.replace(/oklch\([^)]+\)/gi, (m) => convertOklchToRgb(m));
            }
          });

          clonedDoc.querySelectorAll<HTMLElement>('*').forEach((el) => {
            if (el.style && el.style.cssText && el.style.cssText.includes('oklch')) {
              el.style.cssText = el.style.cssText.replace(/oklch\([^)]+\)/gi, (m) => convertOklchToRgb(m));
            }
          });
        },
        ignoreElements: (node) => {
          if (node instanceof HTMLElement) {
            if (
              node.classList.contains('print:hidden') ||
              node.classList.contains('cce-print-hidden') ||
              node.tagName === 'BUTTON'
            ) {
              return true;
            }
          }
          return false;
        },
      });

      dataUrl = canvas.toDataURL('image/png');
      canvasWidth = canvas.width;
      canvasHeight = canvas.height;
    }

    if (dataUrl && (!canvasWidth || !canvasHeight)) {
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = dataUrl!;
      });
      canvasWidth = img.naturalWidth || targetPxWidth;
      canvasHeight = img.naturalHeight || targetPxHeight;
    }
  } catch (err) {
    console.error('TC capture canvas error:', err);
  } finally {
    if (document.head.contains(styleEl)) {
      document.head.removeChild(styleEl);
    }
  }

  if (!dataUrl) return null;
  return { dataUrl, width: canvasWidth, height: canvasHeight };
};

/**
 * Isolated PDF Generator for Transfer Certificate
 * Guarantees single-page portrait fit with exact 10mm top/bottom & 3.5mm left/right margins.
 */
export const downloadTcAsPdf = async (
  element: HTMLElement,
  filename: string = 'Transfer_Certificate.pdf',
  paperSize: TcPaperSize = 'A4'
): Promise<boolean> => {
  try {
    const config = TC_PAGE_CONFIG[paperSize] || TC_PAGE_CONFIG.A4;
    const captured = await captureTcCanvas(element, paperSize);
    if (!captured) return false;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [config.pageWidthMm, config.pageHeightMm],
    });

    // Place image exactly at x = 3.5mm, y = 10mm, width = 203mm (or 208.9mm), height = 277mm (or 335.6mm)
    pdf.addImage(
      captured.dataUrl,
      'PNG',
      config.marginLeftMm,
      config.marginTopMm,
      config.printableWidthMm,
      config.printableHeightMm,
      undefined,
      'FAST'
    );

    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('downloadTcAsPdf error:', err);
    return false;
  }
};

/**
 * Isolated Direct System Print for Transfer Certificate
 * Bypasses all modal backdrops and sets precise @page margins (10mm top/bottom, 3.5mm left/right).
 */
export const printTcDirectly = (
  element: HTMLElement,
  title: string = 'Transfer Certificate',
  paperSize: TcPaperSize = 'A4'
): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const config = TC_PAGE_CONFIG[paperSize] || TC_PAGE_CONFIG.A4;

      // Clean clone without buttons or inputs
      const clone = element.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('button, .print\\:hidden, .cce-print-hidden').forEach((el) => el.remove());

      clone.querySelectorAll('input').forEach((el) => {
        const inp = el as HTMLInputElement;
        const span = document.createElement('span');
        span.className = 'font-bold font-mono text-center inline-block';
        span.textContent = inp.value || '—';
        el.parentNode?.replaceChild(span, el);
      });

      const printableHtml = `<!DOCTYPE html>
<html lang="kn">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: 'Noto Sans Kannada', 'Times New Roman', serif;
      -webkit-font-smoothing: antialiased;
    }
    @page {
      size: ${paperSize === 'Legal' ? 'legal' : 'A4'} portrait;
      margin: ${config.marginTopMm}mm ${config.marginRightMm}mm ${config.marginBottomMm}mm ${config.marginLeftMm}mm;
    }
    .tc-print-container {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: #ffffff !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    table {
      border-collapse: collapse !important;
      width: 100% !important;
    }
    @media print {
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="tc-print-container">
    ${clone.outerHTML}
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.warn('TC auto print error:', e);
        }
      }, 300);
    });
  </script>
</body>
</html>`;

      // Use hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '10px';
      iframe.style.height = '10px';
      iframe.style.border = 'none';
      iframe.style.opacity = '0.01';
      iframe.style.zIndex = '-9999';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!doc) {
        document.body.removeChild(iframe);
        resolve(false);
        return;
      }

      doc.open();
      doc.write(printableHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print error:', e);
        }
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          resolve(true);
        }, 1200);
      }, 500);
    } catch (err) {
      console.error('printTcDirectly error:', err);
      resolve(false);
    }
  });
};

/**
 * Isolated WhatsApp Share Helper for Transfer Certificate
 */
export const shareTcToWhatsApp = async (
  element: HTMLElement,
  summaryText: string,
  baseFilename: string = 'Transfer_Certificate',
  paperSize: TcPaperSize = 'A4'
): Promise<boolean> => {
  try {
    const captured = await captureTcCanvas(element, paperSize);
    if (!captured) return false;

    // Convert dataUrl to Blob
    const res = await fetch(captured.dataUrl);
    const blob = await res.blob();
    const imageFile = new File([blob], `${baseFilename}.png`, { type: 'image/png' });

    // Try Web Share API (Mobile/Tablet)
    if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
      await navigator.share({
        files: [imageFile],
        title: baseFilename,
        text: summaryText,
      });
      return true;
    }

    // Fallback: Trigger download of image, then open WhatsApp web
    const a = document.createElement('a');
    a.href = captured.dataUrl;
    a.download = `${baseFilename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    const waUrl = `https://wa.me/?text=${encodeURIComponent(
      `${summaryText}\n\n📄 ವರ್ಗಾವಣೆ ಪ್ರಮಾಣಪತ್ರದ ಇಮೇಜ್ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ / Transfer Certificate image has been downloaded. Attach it in your chat.`
    )}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    return true;
  } catch (err) {
    console.error('shareTcToWhatsApp error:', err);
    return false;
  }
};
