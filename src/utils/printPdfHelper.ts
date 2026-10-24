import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';

/**
 * Bulletproof printing and PDF export helper for School Result Management
 * Designed to work 100% reliably in:
 * - Standalone desktop/mobile browsers (Chrome, Edge, Firefox, Safari)
 * - AI Studio sandboxed iframes (with cross-origin and sandbox restrictions)
 * - Direct PDF downloads with Unicode and Kannada text rendering
 */

export type ReportPaperSize = 'a4' | 'legal';

export const REPORT_PAPER_SIZES: Record<
  ReportPaperSize,
  {
    widthMm: number;
    heightMm: number;
    marginTopMm: number;
    marginBottomMm: number;
    marginLeftMm: number;
    marginRightMm: number;
    printableWidthMm: number;
    label: string;
    labelKn: string;
  }
> = {
  a4: {
    widthMm: 297,
    heightMm: 210,
    marginTopMm: 5,
    marginBottomMm: 5,
    marginLeftMm: 0, // 0mm left margin as requested
    marginRightMm: 2, // 2mm right safe margin
    printableWidthMm: 295, // 297 - 0 - 2 = 295mm
    label: 'A4 Landscape (297mm × 210mm)',
    labelKn: 'A4 ಲ್ಯಾಂಡ್‌ಸ್ಕೇಪ್ (297mm × 210mm)',
  },
  legal: {
    widthMm: 355.6,
    heightMm: 215.9,
    marginTopMm: 5,
    marginBottomMm: 5,
    marginLeftMm: 0, // 0mm left margin as requested
    marginRightMm: 2, // 2mm right safe margin
    printableWidthMm: 353.6, // 355.6 - 0 - 2 = 353.6mm
    label: 'Legal Landscape (355.6mm × 215.9mm)',
    labelKn: 'Legal ಲ್ಯಾಂಡ್‌ಸ್ಕೇಪ್ (355.6mm × 215.9mm)',
  },
};

/**
 * Clean and prepare HTML string for isolated printing with full CSS formatting
 */
export const buildPrintableHtmlDocument = (
  elementHtml: string,
  title: string = 'Karnataka School Report',
  paperSize: ReportPaperSize = 'legal',
  orientation: 'portrait' | 'landscape' = 'landscape'
): string => {
  const chosenSize = REPORT_PAPER_SIZES[paperSize] || REPORT_PAPER_SIZES.legal;
  const isLandscape = orientation === 'landscape';

  // Extract existing style and link tags from page for fidelity
  let pageStyles = '';
  try {
    const styleEls = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
    pageStyles = styleEls.map((el) => el.outerHTML).join('\n');
  } catch (_) {}

  return `<!DOCTYPE html>
<html lang="kn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anek+Kannada:wght@300;400;500;600;700;800&family=Noto+Sans+Kannada:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  ${pageStyles}
  <style>
    /* Universal Reset & High-Fidelity Print Layout */
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: #ffffff !important;
      color: #020617 !important;
      font-family: 'Anek Kannada', 'Noto Sans Kannada', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      font-size: ${paperSize === 'a4' ? '8.5px' : '9.5px'};
      line-height: 1.35;
    }
    @page {
      size: ${paperSize === 'a4' ? 'A4' : 'legal'} ${orientation};
      margin: 5mm ${chosenSize.marginRightMm}mm 5mm ${chosenSize.marginLeftMm}mm;
    }
    @page :left {
      size: ${paperSize === 'a4' ? 'A4' : 'legal'} ${orientation};
    }
    @page :right {
      size: ${paperSize === 'a4' ? 'A4' : 'legal'} ${orientation};
    }
    .print-sheet {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff;
      box-sizing: border-box !important;
    }
    .report-page-sheet {
      page-break-after: always !important;
      break-after: page !important;
      page-break-before: avoid !important;
      break-before: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      min-height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      background: #ffffff !important;
    }
    .report-page-sheet > div,
    .cce-sheet-container {
      padding-left: 0 !important;
      margin-left: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }
    .cce-9line-container,
    .cce-9line-container *,
    .cce-9line-sheet,
    .cce-9line-sheet *,
    .cce-pdf-bw-mode,
    .cce-pdf-bw-mode * {
      background-color: #ffffff !important;
      background-image: none !important;
      background: #ffffff !important;
      color: #000000 !important;
      -webkit-text-fill-color: #000000 !important;
      border-color: #000000 !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
    .cce-badge, .cce-banner-tag {
      border: 1px solid #000000 !important;
      background: #ffffff !important;
      color: #000000 !important;
    }
    .report-page-sheet:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
    tbody.break-inside-avoid, tbody, tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .student-tbody {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      display: table-row-group !important;
    }
    .cce-v-header,
    .cce-v-text,
    [style*="vertical-rl"] {
      writing-mode: vertical-rl !important;
      transform: rotate(180deg) !important;
      white-space: nowrap !important;
      display: inline-block !important;
    }
    .print\\:hidden, button, select, input[type="button"] {
      display: none !important;
    }

    /* Core Table Support (Prevents unformatted plain text collapse) */
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: 2px 0 !important;
    }
    th, td {
      border: 1px solid #0f172a !important;
      padding: ${isLandscape ? '2px 3px' : '6px 10px'} !important;
      text-align: center !important;
      vertical-align: middle !important;
    }
    .cce-9line-sheet table {
      margin: 0 !important;
    }
    .cce-9line-sheet th,
    .cce-9line-sheet td {
      padding: 0 !important;
      line-height: 1.1 !important;
      box-sizing: border-box !important;
    }
    .cce-9line-sheet .cce-page-footer {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    th {
      background-color: #f1f5f9 !important;
      font-weight: 700 !important;
    }

    /* Core Grid System for Transfer Certificates and Cards */
    .grid {
      display: grid !important;
    }
    .grid-cols-12 {
      grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
    }
    .grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    .grid-cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    }
    .col-span-1 { grid-column: span 1 / span 1 !important; }
    .col-span-2 { grid-column: span 2 / span 2 !important; }
    .col-span-3 { grid-column: span 3 / span 3 !important; }
    .col-span-4 { grid-column: span 4 / span 4 !important; }
    .col-span-5 { grid-column: span 5 / span 5 !important; }
    .col-span-6 { grid-column: span 6 / span 6 !important; }
    .col-span-7 { grid-column: span 7 / span 7 !important; }
    .col-span-8 { grid-column: span 8 / span 8 !important; }
    .col-span-9 { grid-column: span 9 / span 9 !important; }
    .col-span-10 { grid-column: span 10 / span 10 !important; }
    .col-span-11 { grid-column: span 11 / span 11 !important; }
    .col-span-12 { grid-column: span 12 / span 12 !important; }
    .gap-1 { gap: 0.25rem !important; }
    .gap-1\\.5 { gap: 0.375rem !important; }
    .gap-2 { gap: 0.5rem !important; }
    .gap-2\\.5 { gap: 0.625rem !important; }
    .gap-3 { gap: 0.75rem !important; }
    .gap-4 { gap: 1rem !important; }

    /* Flex Utilities */
    .flex { display: flex !important; }
    .inline-flex { display: inline-flex !important; }
    .flex-wrap { flex-wrap: wrap !important; }
    .justify-between { justify-content: space-between !important; }
    .justify-center { justify-content: center !important; }
    .items-center { align-items: center !important; }
    .items-start { align-items: flex-start !important; }
    .items-end { align-items: flex-end !important; }

    /* Border Utilities */
    .border { border: 1px solid #0f172a !important; }
    .border-2 { border: 2px solid #0f172a !important; }
    .border-4 { border: 4px solid #0f172a !important; }
    .border-double { border-style: double !important; }
    .border-b { border-bottom: 1px solid #cbd5e1 !important; }
    .border-b-2 { border-bottom: 2px solid #0f172a !important; }
    .border-t-2 { border-top: 2px solid #0f172a !important; }
    .border-slate-900 { border-color: #0f172a !important; }
    .border-slate-800 { border-color: #1e293b !important; }
    .border-slate-300 { border-color: #cbd5e1 !important; }
    .border-slate-200 { border-color: #e2e8f0 !important; }
    .border-emerald-950 { border-color: #022c22 !important; }
    .border-emerald-900 { border-color: #064e3b !important; }
    .divide-y > * + * { border-top: 1px solid #e2e8f0 !important; }
    .divide-slate-200 > * + * { border-top-color: #e2e8f0 !important; }

    /* Spacing Utilities */
    .p-2 { padding: 0.5rem !important; }
    .p-4 { padding: 1rem !important; }
    .p-6 { padding: 1.5rem !important; }
    .p-8 { padding: 2rem !important; }
    .p-10 { padding: 2.5rem !important; }
    .px-2 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
    .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
    .px-6 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
    .py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
    .py-1\\.5 { padding-top: 0.375rem !important; padding-bottom: 0.375rem !important; }
    .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
    .pt-2 { padding-top: 0.5rem !important; }
    .pt-4 { padding-top: 1rem !important; }
    .pt-8 { padding-top: 2rem !important; }
    .pt-10 { padding-top: 2.5rem !important; }
    .pt-16 { padding-top: 4rem !important; }
    .pb-2 { padding-bottom: 0.5rem !important; }
    .pb-3 { padding-bottom: 0.75rem !important; }
    .space-y-1\\.5 > * + * { margin-top: 0.375rem !important; }
    .space-y-2\\.5 > * + * { margin-top: 0.625rem !important; }
    .space-y-4 > * + * { margin-top: 1rem !important; }
    .space-y-7 > * + * { margin-top: 1.75rem !important; }

    /* Typography & Text */
    .text-center { text-align: center !important; }
    .text-left { text-align: left !important; }
    .text-right { text-align: right !important; }
    .font-bold { font-weight: 700 !important; }
    .font-black, .font-extrabold { font-weight: 900 !important; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important; }
    .uppercase { text-transform: uppercase !important; }
    .underline { text-decoration: underline !important; }
    .underline-offset-4 { text-underline-offset: 4px !important; }
    .tracking-wider { letter-spacing: 0.05em !important; }
    .tracking-widest { letter-spacing: 0.1em !important; }
    .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
    .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
    .text-base { font-size: 1rem !important; line-height: 1.5rem !important; }
    .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
    .text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
    .text-2xl { font-size: 1.5rem !important; line-height: 2rem !important; }

    /* Colors */
    .text-slate-950 { color: #020617 !important; }
    .text-slate-900 { color: #0f172a !important; }
    .text-slate-800 { color: #1e293b !important; }
    .text-slate-700 { color: #334155 !important; }
    .text-blue-950 { color: #172554 !important; }
    .text-blue-900 { color: #1e3a8a !important; }
    .text-emerald-950 { color: #022c22 !important; }
    .text-emerald-900 { color: #064e3b !important; }
    .text-white { color: #ffffff !important; }
    .bg-white { background-color: #ffffff !important; }
    .bg-slate-900 { background-color: #0f172a !important; color: #ffffff !important; }
    .bg-emerald-900 { background-color: #064e3b !important; color: #ffffff !important; }
    .bg-slate-50 { background-color: #f8fafc !important; }
    .rounded-xl { border-radius: 0.75rem !important; }
    .rounded-2xl { border-radius: 1rem !important; }
    .rounded-3xl { border-radius: 1.5rem !important; }
    .rounded-full { border-radius: 9999px !important; }
    .w-44 { width: 11rem !important; }
    .w-64 { width: 16rem !important; }
    .w-full { width: 100% !important; }
    .h-10 { height: 2.5rem !important; }
    .mx-auto { margin-left: auto !important; margin-right: auto !important; }
    .inline-block { display: inline-block !important; }

    @media print {
      body {
        padding: 0;
        background: transparent !important;
      }
      .print-sheet {
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-sheet">
    ${elementHtml}
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch(e) {
          console.warn('Auto print error:', e);
        }
      }, 350);
    });
  </script>
</body>
</html>`;
};

/**
 * Strategy 1: Print directly using an isolated hidden iframe
 * Bypasses parent overlays, backdrop-blur, and flex/grid centering traps.
 */
export const printElementViaIframe = (
  element: HTMLElement,
  title: string = 'Report',
  paperSize: ReportPaperSize = 'legal',
  orientation: 'portrait' | 'landscape' = 'landscape'
): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // Clean clone: remove non-printable elements
      const clone = element.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.cce-print-hidden, .print\\:hidden, button').forEach((el) => el.remove());
      clone.querySelectorAll('select').forEach((el) => {
        const sel = el as HTMLSelectElement;
        const parent = sel.parentElement;
        if (parent && parent.querySelector('.cce-pdf-text')) {
          sel.remove();
          return;
        }
        const text = sel.options[sel.selectedIndex]?.text || sel.value;
        const span = document.createElement('span');
        span.className = 'font-bold text-center block w-full';
        span.style.textAlign = 'center';
        span.textContent = text;
        el.parentNode?.replaceChild(span, el);
      });
      clone.querySelectorAll('input').forEach((el) => {
        const inp = el as HTMLInputElement;
        const parent = inp.parentElement;
        if (parent && parent.querySelector('.cce-pdf-text')) {
          const pdfEl = parent.querySelector('.cce-pdf-text') as HTMLElement;
          if (inp.value && inp.value.trim() !== '') {
            pdfEl.textContent = inp.value.trim();
          }
          inp.remove();
          return;
        }
        const span = document.createElement('span');
        span.className = 'font-bold font-mono text-center block w-full';
        span.style.textAlign = 'center';
        span.textContent = inp.value || '-';
        el.parentNode?.replaceChild(span, el);
      });
      // Strip inline padding and width from sheets so ONLY @page controls margins during printing
      clone.querySelectorAll<HTMLElement>('.report-page-sheet').forEach((sheet) => {
        sheet.style.padding = '0';
        sheet.style.margin = '0';
        sheet.style.width = '100%';
        sheet.style.maxWidth = '100%';
      });

      const fullHtml = buildPrintableHtmlDocument(clone.innerHTML, title, paperSize, orientation);

      // Create hidden iframe
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

      const frameDoc = iframe.contentWindow?.document;
      if (!frameDoc) {
        document.body.removeChild(iframe);
        resolve(false);
        return;
      }

      frameDoc.open();
      frameDoc.write(fullHtml);
      frameDoc.close();

      // Trigger print without waiting for onload (which never fires on frameDoc.close())
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch (err) {
          console.warn('Iframe print failed, falling back:', err);
          resolve(false);
        } finally {
          setTimeout(() => {
            try {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            } catch (_) {}
          }, 4000);
        }
      }, 350);
    } catch (e) {
      console.error('printElementViaIframe error:', e);
      resolve(false);
    }
  });
};

/**
 * Strategy 2: Open in a clean standalone window or tab with direct print
 * Guaranteed to bypass 100% of iframe restrictions in Chrome/Edge!
 */
export const openCleanPrintWindow = (
  element: HTMLElement,
  title: string = 'Karnataka School Report',
  paperSize: ReportPaperSize = 'legal',
  orientation: 'portrait' | 'landscape' = 'landscape'
): boolean => {
  try {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.cce-print-hidden, .print\\:hidden, button').forEach((el) => el.remove());
    clone.querySelectorAll('select').forEach((el) => {
      const sel = el as HTMLSelectElement;
      const parent = sel.parentElement;
      if (parent && parent.querySelector('.cce-pdf-text')) {
        sel.remove();
        return;
      }
      const text = sel.options[sel.selectedIndex]?.text || sel.value;
      const span = document.createElement('span');
      span.className = 'font-bold text-center block w-full';
      span.style.textAlign = 'center';
      span.textContent = text;
      el.parentNode?.replaceChild(span, el);
    });
    clone.querySelectorAll('input').forEach((el) => {
      const inp = el as HTMLInputElement;
      const parent = inp.parentElement;
      if (parent && parent.querySelector('.cce-pdf-text')) {
        const pdfEl = parent.querySelector('.cce-pdf-text') as HTMLElement;
        if (inp.value && inp.value.trim() !== '') {
          pdfEl.textContent = inp.value.trim();
        }
        inp.remove();
        return;
      }
      const span = document.createElement('span');
      span.className = 'font-bold font-mono text-center block w-full';
      span.style.textAlign = 'center';
      span.textContent = inp.value || '-';
      el.parentNode?.replaceChild(span, el);
    });
    // Strip inline padding and width from sheets so ONLY @page controls margins during printing
    clone.querySelectorAll<HTMLElement>('.report-page-sheet').forEach((sheet) => {
      sheet.style.padding = '0';
      sheet.style.margin = '0';
      sheet.style.width = '100%';
      sheet.style.maxWidth = '100%';
    });

    const fullHtml = buildPrintableHtmlDocument(clone.innerHTML, title, paperSize, orientation);
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const printWin = window.open(blobUrl, '_blank', 'noopener,noreferrer');
    if (printWin) {
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
      return true;
    } else {
      // If popup blocked, create anchor and click
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
      return true;
    }
  } catch (err) {
    console.error('openCleanPrintWindow error:', err);
    return false;
  }
};

/**
 * Helper to capture clean high-resolution canvas/image of report element:
 * - Temporarily expands all horizontal overflow containers so Part B columns are not cut off
 * - Suppresses all scrollbars completely so right/bottom window navigation bars never appear in PDF/image
 * - Uses Legal landscape dimensions when wide
 */
export const captureCleanReportCanvas = async (
  element: HTMLElement
): Promise<{ dataUrl: string; width: number; height: number } | null> => {
  // 1. Temporarily inject style to completely hide all browser scrollbars
  const styleEl = document.createElement('style');
  styleEl.id = 'temp-hide-capture-scrollbars';
  styleEl.innerHTML = `
    ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
    * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
  `;
  document.head.appendChild(styleEl);

  const isSheet = element.classList.contains('report-page-sheet');

  // 2. Temporarily expand overflow containers only on external wrapper containers, NOT on fixed sheets
  const restoredElements: Array<{ el: HTMLElement; overflowX: string; maxWidth: string }> = [];
  if (!isSheet) {
    const overflowNodes: HTMLElement[] = [
      element,
      ...Array.from(element.querySelectorAll<HTMLElement>('.overflow-x-auto, .overflow-y-auto, .overflow-auto, .overflow-hidden'))
    ];
    overflowNodes.forEach((node) => {
      restoredElements.push({
        el: node,
        overflowX: node.style.overflowX,
        maxWidth: node.style.maxWidth,
      });
      node.style.overflowX = 'visible';
      node.style.maxWidth = 'none';
    });
  }

  // Activate PDF clean text mode on element to convert inputs to centered text
  element.classList.add('cce-pdf-mode');

  let dataUrl: string | null = null;
  let width = 0;
  let height = 0;

  const rect = element.getBoundingClientRect();
  const targetWidth = isSheet ? (element.offsetWidth || Math.ceil(rect.width)) : undefined;
  const targetHeight = isSheet ? (element.offsetHeight || Math.ceil(rect.height)) : undefined;

  try {
    // 1. Primary: toPng (Native browser rendering via SVG foreignObject, fontEmbedCSS: '' to avoid Google Fonts CORS errors)
    try {
      const p = toPng(element, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: false,
        skipFonts: true,
        fontEmbedCSS: '',
        width: targetWidth,
        height: targetHeight,
        filter: (node: Node) => {
          if (node instanceof HTMLElement) {
            if (
              node.classList.contains('cce-screen-input') ||
              node.classList.contains('cce-print-hidden') ||
              node.classList.contains('print:hidden') ||
              node.tagName === 'BUTTON'
            ) {
              return false;
            }
          }
          return true;
        },
      });
      // Timeout after 8s so toPng has ample time on complex sheets without hanging indefinitely
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
      dataUrl = (await Promise.race([p, timeout])) as string | null;
    } catch (primaryErr) {
      console.warn('toPng primary capture failed, falling back to html2canvas:', primaryErr);
    }

    // 2. High-reliability fallback: html2canvas with oklch color conversion to prevent parsing errors
    if (!dataUrl) {
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          onclone: (clonedDoc: Document) => {
            // Convert all oklch() color occurrences in cloned document stylesheets and inline styles to standard rgb/hex
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

            // Sanitize style tags (e.g. Tailwind v4 theme variables)
            clonedDoc.querySelectorAll('style').forEach((st) => {
              if (st.textContent && st.textContent.includes('oklch')) {
                st.textContent = st.textContent.replace(/oklch\([^)]+\)/gi, (m) => convertOklchToRgb(m));
              }
            });

            // Sanitize element inline styles
            clonedDoc.querySelectorAll<HTMLElement>('*').forEach((el) => {
              if (el.style && el.style.cssText && el.style.cssText.includes('oklch')) {
                el.style.cssText = el.style.cssText.replace(/oklch\([^)]+\)/gi, (m) => convertOklchToRgb(m));
              }
            });
          },
          ignoreElements: (node) => {
            if (node instanceof HTMLElement) {
              if (
                node.classList.contains('cce-screen-input') ||
                node.classList.contains('cce-print-hidden') ||
                node.classList.contains('print:hidden') ||
                node.tagName === 'BUTTON'
              ) {
                return true;
              }
            }
            return false;
          },
        });
        dataUrl = canvas.toDataURL('image/png');
        width = canvas.width;
        height = canvas.height;
      } catch (canvasErr) {
        console.error('html2canvas fallback also failed:', canvasErr);
      }
    }

    if (dataUrl && (!width || !height)) {
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn('Canvas image loading warned, using sheet fallback dimensions');
          resolve();
        };
        img.src = dataUrl!;
      });
      width = img.naturalWidth || img.width || (isSheet ? 1400 : element.scrollWidth);
      height = img.naturalHeight || img.height || (isSheet ? 900 : element.scrollHeight);
    }
  } catch (outerErr) {
    console.error('captureCleanReportCanvas outer error:', outerErr);
  } finally {
    element.classList.remove('cce-pdf-mode');
    // Restore overflow styles
    restoredElements.forEach(({ el, overflowX, maxWidth }) => {
      el.style.overflowX = overflowX;
      el.style.maxWidth = maxWidth;
    });
    // Remove temporary scrollbar hiding style
    if (document.head.contains(styleEl)) {
      document.head.removeChild(styleEl);
    }
  }

  if (!dataUrl) return null;
  return { dataUrl, width, height };
};

/**
 * Strategy 3: Client-side High-Resolution PDF Download using html-to-image & jsPDF
 * Fits all columns cleanly on the selected paper size preserving aspect ratio and preventing overflow.
 */
export const downloadElementAsPdf = async (
  element: HTMLElement,
  filename: string = 'School_Document.pdf',
  paperSize: ReportPaperSize = 'legal'
): Promise<boolean> => {
  try {
    const chosenSize = REPORT_PAPER_SIZES[paperSize] || REPORT_PAPER_SIZES.legal;
    const pdfFormat: [number, number] = [chosenSize.widthMm, chosenSize.heightMm];

    // 1. Check if the element contains designated page sheets (.report-page-sheet) or is a sheet itself
    const pageSheets = element.classList.contains('report-page-sheet')
      ? [element]
      : Array.from(element.querySelectorAll<HTMLElement>('.report-page-sheet'));
    if (pageSheets.length > 0) {
      element.classList.add('cce-pdf-mode');
      pageSheets.forEach(s => s.classList.add('cce-pdf-mode'));

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: pdfFormat,
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let renderedAny = false;
      try {
        for (let sIdx = 0; sIdx < pageSheets.length; sIdx++) {
          const sheet = pageSheets[sIdx];
          try {
            const capturedSheet = await captureCleanReportCanvas(sheet);
            if (!capturedSheet) continue;
            if (renderedAny) {
              pdf.addPage(pdfFormat, 'landscape');
            }

            // Render sheet directly at 0mm left margin, scaled cleanly to fit within page bounds
            const scale = Math.min(
              pageWidth / (capturedSheet.width || 1),
              pageHeight / (capturedSheet.height || 1)
            );
            const renderW = capturedSheet.width * scale;
            const renderH = capturedSheet.height * scale;
            const offsetX = 0; // Starts at 0mm left edge
            const offsetY = Math.max(0, (pageHeight - renderH) / 2);
            pdf.addImage(capturedSheet.dataUrl, 'PNG', offsetX, offsetY, renderW, renderH, undefined, 'FAST');
            renderedAny = true;
          } catch (sheetErr) {
            console.warn(`Error capturing sheet ${sIdx + 1}:`, sheetErr);
          }
        }
      } finally {
        element.classList.remove('cce-pdf-mode');
        pageSheets.forEach(s => s.classList.remove('cce-pdf-mode'));
      }

      if (renderedAny) {
        const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
        try {
          pdf.save(cleanFilename);
        } catch (saveErr) {
          console.warn('pdf.save failed, falling back to blob anchor download:', saveErr);
          const blob = pdf.output('blob');
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = cleanFilename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        }
        return true;
      }
      // If canvas capture failed, fall back to native print dialog
      console.warn('Canvas PDF export could not capture canvas, triggering native print dialog for Save as PDF');
      return await executeReportPrint(element, filename, paperSize, 'landscape');
    }

    // 2. Fallback for single container elements
    const captured = await captureCleanReportCanvas(element);
    if (!captured) {
      throw new Error('Failed to capture report element');
    }

    const { dataUrl: imgData, width: imgWidthPx, height: imgHeightPx } = captured;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: pdfFormat,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const marginLeftMm = 0; // 0mm left margin as requested
    const marginRightMm = chosenSize.marginRightMm || 2;
    const marginTopMm = chosenSize.marginTopMm || 5;
    const marginBottomMm = chosenSize.marginBottomMm || 5;

    if (imgHeightPx / imgWidthPx <= (pageHeight / pageWidth) * 1.05) {
      // Single page document: scale cleanly to fit page width and height starting at 0mm left margin
      const scale = Math.min(
        pageWidth / (imgWidthPx || 1),
        pageHeight / (imgHeightPx || 1)
      );
      const renderW = imgWidthPx * scale;
      const renderH = imgHeightPx * scale;
      const offsetX = 0; // Starts at 0mm left margin
      const offsetY = Math.max(0, (pageHeight - renderH) / 2);
      pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderW, renderH, undefined, 'FAST');
    } else {
      // Multi-page document: slice canvas cleanly by page aspect ratio
      const pageCanvasHeight = Math.floor(imgWidthPx / (pageWidth / pageHeight));
      let renderedPx = 0;
      let pageNum = 0;

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imgData;
      });

      while (renderedPx < imgHeightPx) {
        if (pageNum > 0) {
          pdf.addPage(pdfFormat, 'landscape');
        }

        const sliceH = Math.min(pageCanvasHeight, imgHeightPx - renderedPx);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = imgWidthPx;
        sliceCanvas.height = sliceH;
        const ctx = sliceCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, renderedPx, imgWidthPx, sliceH, 0, 0, imgWidthPx, sliceH);
          const sliceData = sliceCanvas.toDataURL('image/png', 0.98);
          const sliceScale = Math.min(
            pageWidth / (imgWidthPx || 1),
            pageHeight / (sliceH || 1)
          );
          const sliceW = imgWidthPx * sliceScale;
          const sliceRenderH = sliceH * sliceScale;
          const sliceOffX = 0; // 0mm left margin
          const sliceOffY = Math.max(0, (pageHeight - sliceRenderH) / 2);
          pdf.addImage(sliceData, 'PNG', sliceOffX, sliceOffY, sliceW, sliceRenderH, undefined, 'FAST');
        }

        renderedPx += sliceH;
        pageNum++;
      }
    }

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);
    return true;
  } catch (err) {
    console.error('downloadElementAsPdf error, falling back to clean document export:', err);
    // Fallback: download standalone printable HTML file (with full styles included)
    try {
      const clone = element.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.print\\:hidden, button').forEach((el) => el.remove());
      const fullHtml = buildPrintableHtmlDocument(clone.innerHTML, filename, paperSize);
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename.replace(/\.pdf$/i, '')}_printable.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      return true;
    } catch (e2) {
      console.error('All PDF fallbacks failed:', e2);
      return false;
    }
  }
};

/**
 * Standalone Printable HTML file download:
 * Allows user to download an exact self-contained HTML file to adjust margins manually if desired.
 */
export const downloadElementAsHtml = (
  element: HTMLElement,
  filename: string = 'School_Document.html',
  paperSize: ReportPaperSize = 'legal',
  orientation: 'portrait' | 'landscape' = 'landscape'
): boolean => {
  try {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.cce-print-hidden, .print\\:hidden, button').forEach((el) => el.remove());
    // Convert inputs to plain spans so values persist in saved HTML
    clone.querySelectorAll('select').forEach((el) => {
      const sel = el as HTMLSelectElement;
      const parent = sel.parentElement;
      if (parent && parent.querySelector('.cce-pdf-text')) {
        sel.remove();
        return;
      }
      const text = sel.options[sel.selectedIndex]?.text || sel.value;
      const span = document.createElement('span');
      span.className = 'font-bold text-center block w-full';
      span.style.textAlign = 'center';
      span.textContent = text;
      sel.parentNode?.replaceChild(span, sel);
    });
    clone.querySelectorAll('input').forEach((el) => {
      const inp = el as HTMLInputElement;
      const parent = inp.parentElement;
      if (parent && parent.querySelector('.cce-pdf-text')) {
        const pdfEl = parent.querySelector('.cce-pdf-text') as HTMLElement;
        if (inp.value && inp.value.trim() !== '') {
          pdfEl.textContent = inp.value.trim();
        }
        inp.remove();
        return;
      }
      const span = document.createElement('span');
      span.className = 'font-bold font-mono text-center block w-full';
      span.style.textAlign = 'center';
      span.textContent = inp.value || '-';
      inp.parentNode?.replaceChild(span, inp);
    });

    const fullHtml = buildPrintableHtmlDocument(clone.innerHTML, filename, paperSize, orientation);
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.html') ? filename : `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
  } catch (err) {
    console.error('downloadElementAsHtml error:', err);
    return false;
  }
};

/**
 * Master Print Trigger:
 * Uses isolated print portal on the main document body + window.print()
 * which works reliably across all browsers, iframes, and preview environments
 * without popup blockers or iframe restrictions.
 */
export const executeReportPrint = async (
  element: HTMLElement | null,
  title: string = 'Karnataka School Report',
  paperSize: ReportPaperSize = 'legal',
  orientation: 'portrait' | 'landscape' = 'landscape'
): Promise<boolean> => {
  if (!element) {
    window.focus();
    window.print();
    return true;
  }

  try {
    const prevTitle = document.title;
    if (title) document.title = title;

    // 1. Remove any leftover print portal
    const existingPortal = document.getElementById('cce-isolated-print-portal');
    if (existingPortal) {
      existingPortal.remove();
    }

    // 2. Create isolated print portal container attached directly to document.body
    const portal = document.createElement('div');
    portal.id = 'cce-isolated-print-portal';
    portal.setAttribute('data-paper-size', paperSize);
    portal.setAttribute('data-orientation', orientation);

    // 3. Clone element with full fidelity
    const clone = element.cloneNode(true) as HTMLElement;
    clone.classList.add('cce-pdf-mode');
    clone.querySelectorAll('.cce-print-hidden, .print\\:hidden, button').forEach((btn) => btn.remove());

    // Strip inline width, margin, and padding so ONLY @page controls margins during printing
    clone.querySelectorAll<HTMLElement>('.report-page-sheet').forEach((s) => {
      s.classList.add('cce-pdf-mode');
      s.style.padding = '0';
      s.style.paddingLeft = '0px';
      s.style.paddingRight = '0px';
      s.style.margin = '0';
      s.style.marginLeft = '0px';
      s.style.marginRight = '0px';
      s.style.width = '100%';
      s.style.maxWidth = '100%';
      s.style.boxSizing = 'border-box';
      s.querySelectorAll<HTMLElement>('div').forEach((d) => {
        d.style.paddingLeft = '0px';
        d.style.marginLeft = '0px';
      });
    });

    // Sync live inputs from live DOM to clone
    const originalInputs = element.querySelectorAll<HTMLInputElement>('input');
    const clonedInputs = clone.querySelectorAll<HTMLInputElement>('input');
    originalInputs.forEach((orig, idx) => {
      const cloned = clonedInputs[idx];
      if (cloned) {
        cloned.value = orig.value;
        const parent = cloned.parentElement;
        const pdfEl = parent?.querySelector('.cce-pdf-text') as HTMLElement | null;
        if (pdfEl && orig.value && orig.value.trim() !== '') {
          pdfEl.textContent = orig.value.trim();
        }
      }
    });

    // Replace selects in clone with clean text
    clone.querySelectorAll('select').forEach((el) => {
      const sel = el as HTMLSelectElement;
      const text = sel.options[sel.selectedIndex]?.text || sel.value;
      const span = document.createElement('span');
      span.className = 'font-bold';
      span.textContent = text;
      el.parentNode?.replaceChild(span, el);
    });

    const pageStyle = document.createElement('style');
    pageStyle.textContent = `
      @page {
        size: ${paperSize === 'a4' ? 'A4' : 'legal'} ${orientation};
        margin: 5mm 2mm 5mm 0mm !important;
      }
      #cce-isolated-print-portal .report-page-sheet {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      #cce-isolated-print-portal .report-page-sheet > div,
      #cce-isolated-print-portal .cce-sheet-container {
        padding-left: 0 !important;
        margin-left: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      #cce-isolated-print-portal table {
        width: 100% !important;
        max-width: 100% !important;
        table-layout: fixed !important;
        box-sizing: border-box !important;
      }
    `;
    portal.appendChild(pageStyle);
    portal.appendChild(clone);
    document.body.appendChild(portal);

    // 4. Activate print mode class on body (hiding everything else in print media via index.css)
    document.body.classList.add('cce-print-mode-active');

    // 5. Invoke native window.print() reliably
    const cleanup = () => {
      document.body.classList.remove('cce-print-mode-active');
      if (document.body.contains(portal)) {
        portal.remove();
      }
      document.title = prevTitle;
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    // Small delay to ensure browser layout engine parses the portal
    await new Promise((resolve) => setTimeout(resolve, 80));

    window.focus();
    window.print();

    // Safety timeout cleanup if afterprint doesn't fire
    setTimeout(cleanup, 2500);
    return true;
  } catch (err) {
    console.warn('Isolated portal print failed, falling back to iframe:', err);
    try {
      const printed = await printElementViaIframe(element, title, paperSize, orientation);
      if (printed) return true;
    } catch (e2) {
      console.warn('printElementViaIframe also failed, opening window:', e2);
    }
    return openCleanPrintWindow(element, title, paperSize, orientation);
  }
};

/**
 * Strategy 4: High-Quality Photo/Image Export (PNG) using captureCleanReportCanvas
 */
export const exportElementAsImage = async (
  element: HTMLElement,
  filename: string = 'School_Report.png'
): Promise<string | null> => {
  try {
    const captured = await captureCleanReportCanvas(element);
    if (!captured) {
      throw new Error('Failed to capture report as image');
    }

    const { dataUrl } = captured;
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    return dataUrl;
  } catch (err) {
    console.error('exportElementAsImage error:', err);
    return null;
  }
};

/**
 * Strategy 5: Share Report to WhatsApp
 * 1. Exports/downloads report photo without window navigation bars or missing columns
 * 2. Launches WhatsApp with prefilled formatted summary
 * 3. Supports native navigator.share if available
 */
export const shareReportToWhatsApp = async (
  element: HTMLElement | null,
  textSummary: string,
  filename: string = 'School_Report'
): Promise<boolean> => {
  try {
    let imageBlob: Blob | null = null;

    if (element) {
      try {
        const captured = await captureCleanReportCanvas(element);
        if (captured) {
          const { dataUrl } = captured;
          // Prompt image download so user has the photo ready to send
          const cleanName = `${filename.replace(/[^a-zA-Z0-9_\u0C80-\u0CFF]/g, '_')}_Photo.png`;
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = cleanName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Convert dataUrl to blob
          const res = await fetch(dataUrl);
          imageBlob = await res.blob();
        }
      } catch (imgErr) {
        console.warn('Could not generate image blob for share, continuing with text:', imgErr);
      }
    }

    // If native share supports files, share both file and text
    if (imageBlob && navigator.canShare && navigator.canShare({ files: [new File([imageBlob], `${filename}.png`, { type: 'image/png' })] })) {
      try {
        await navigator.share({
          title: filename,
          text: textSummary,
          files: [new File([imageBlob], `${filename}.png`, { type: 'image/png' })],
        });
        return true;
      } catch (shareErr) {
        // User cancelled or not supported, fallback to WhatsApp URL
      }
    }

    // Open WhatsApp Web or mobile app with formatted message
    const encodedText = encodeURIComponent(textSummary);
    const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    return true;
  } catch (err) {
    console.error('shareReportToWhatsApp error:', err);
    return false;
  }
};

// Re-export all dedicated report-specific print & PDF helpers
export * from './reportPrintPdfHelpers';