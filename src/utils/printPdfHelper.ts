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

/**
 * Clean and prepare HTML string for isolated printing with full CSS formatting
 */
export const buildPrintableHtmlDocument = (
  elementHtml: string,
  title: string = 'Karnataka School Report'
): string => {
  // Extract existing style and link tags from page for fidelity
  let pageStyles = '';
  try {
    const styleEls = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
    pageStyles = styleEls.map((el) => el.outerHTML).join('\n');
  } catch (_) {}

  // Check if document is intended for legal landscape layout
  const isLandscape = elementHtml.includes('legal-landscape') || elementHtml.includes('report-page-sheet');

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
      font-size: ${isLandscape ? '9px' : '13px'};
      line-height: 1.35;
    }
    @page {
      size: ${isLandscape ? 'legal landscape' : 'A4 portrait'};
      margin: ${isLandscape ? '4mm 4mm 4mm 20mm' : '8mm 10mm'};
    }
    .print-sheet {
      width: 100%;
      max-width: ${isLandscape ? '100%' : '820px'};
      margin: 0 auto;
      background: #ffffff;
      padding: ${isLandscape ? '0' : '16px'};
    }
    .report-page-sheet {
      page-break-after: always !important;
      break-after: page !important;
      margin-bottom: ${isLandscape ? '0' : '20px'};
      padding: 0 !important;
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
  title: string = 'Report'
): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // Clean clone: remove non-printable elements
      const clone = element.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.print\\:hidden, button, select').forEach((el) => {
        // If it's a select element with selected text, replace with bold span
        if (el.tagName === 'SELECT') {
          const sel = el as HTMLSelectElement;
          const text = sel.options[sel.selectedIndex]?.text || sel.value;
          const span = document.createElement('span');
          span.className = 'font-bold';
          span.textContent = text;
          el.parentNode?.replaceChild(span, el);
        } else if (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'text') {
          const inp = el as HTMLInputElement;
          const span = document.createElement('span');
          span.className = 'font-bold';
          span.textContent = inp.value;
          el.parentNode?.replaceChild(span, el);
        } else {
          el.remove();
        }
      });

      const fullHtml = buildPrintableHtmlDocument(clone.innerHTML, title);

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
  title: string = 'Karnataka School Report'
): boolean => {
  try {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.print\\:hidden, button').forEach((el) => el.remove());
    clone.querySelectorAll('select').forEach((el) => {
      const sel = el as HTMLSelectElement;
      const text = sel.options[sel.selectedIndex]?.text || sel.value;
      const span = document.createElement('span');
      span.className = 'font-bold';
      span.textContent = text;
      el.parentNode?.replaceChild(span, el);
    });
    clone.querySelectorAll('input[type="text"]').forEach((el) => {
      const inp = el as HTMLInputElement;
      const span = document.createElement('span');
      span.className = 'font-bold';
      span.textContent = inp.value;
      el.parentNode?.replaceChild(span, el);
    });

    const fullHtml = buildPrintableHtmlDocument(clone.innerHTML, title);
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
const captureCleanReportCanvas = async (
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

  // 2. Temporarily expand overflow containers
  const restoredElements: Array<{ el: HTMLElement; overflowX: string; maxWidth: string }> = [];
  const overflowNodes = element.querySelectorAll<HTMLElement>('.overflow-x-auto, .overflow-y-auto, .overflow-auto');
  overflowNodes.forEach((node) => {
    restoredElements.push({
      el: node,
      overflowX: node.style.overflowX,
      maxWidth: node.style.maxWidth,
    });
    node.style.overflowX = 'visible';
    node.style.maxWidth = 'none';
  });

  const targetWidth = Math.max(element.scrollWidth, element.offsetWidth, 1400);

  let dataUrl: string | null = null;
  let width = 0;
  let height = 0;

  try {
    // Attempt 1: toPng from html-to-image
    try {
      dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: true,
        fontEmbedCSS: '',
        filter: (node) => {
          if (node instanceof HTMLElement && (node.classList.contains('print:hidden') || node.tagName === 'BUTTON')) {
            return false;
          }
          return true;
        },
      });

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = dataUrl!;
      });
      width = img.naturalWidth || targetWidth;
      height = img.naturalHeight || 800;
    } catch (pngErr) {
      console.warn('html-to-image capture fallback notice:', pngErr);
    }

    // Attempt 2: html2canvas
    if (!dataUrl) {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: targetWidth + 50,
        onclone: (clonedDoc) => {
          const s = clonedDoc.createElement('style');
          s.innerHTML = `
            * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
            ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
            .overflow-x-auto, .overflow-y-auto, .overflow-auto { overflow: visible !important; max-width: none !important; }
          `;
          clonedDoc.head.appendChild(s);
          clonedDoc.querySelectorAll<HTMLElement>('.overflow-x-auto').forEach((el) => {
            el.style.overflow = 'visible';
            el.style.maxWidth = 'none';
          });
        },
      });
      dataUrl = canvas.toDataURL('image/png', 0.98);
      width = canvas.width;
      height = canvas.height;
    }
  } finally {
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
 * Strategy 3: Client-side High-Resolution PDF Download using html-to-image/html2canvas & jsPDF
 * Fits all columns on one Legal landscape sheet without cropping Part B or showing window scrollbars.
 */
export const downloadElementAsPdf = async (
  element: HTMLElement,
  filename: string = 'School_Document.pdf'
): Promise<boolean> => {
  try {
    // 1. Check if the element contains designated page sheets (.report-page-sheet) or is a sheet itself
    const pageSheets = element.classList.contains('report-page-sheet')
      ? [element]
      : Array.from(element.querySelectorAll<HTMLElement>('.report-page-sheet'));
    if (pageSheets.length > 0) {
      const isLandscape = element.classList.contains('legal-landscape') || !element.classList.contains('legal-portrait');
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'legal',
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 4;
      const maxW = pageWidth - margin * 2;
      const maxH = pageHeight - margin * 2;

      for (let sIdx = 0; sIdx < pageSheets.length; sIdx++) {
        const sheet = pageSheets[sIdx];
        const capturedSheet = await captureCleanReportCanvas(sheet);
        if (!capturedSheet) continue;
        if (sIdx > 0) {
          pdf.addPage('legal', isLandscape ? 'landscape' : 'portrait');
        }
        const sheetRatio = capturedSheet.height / capturedSheet.width;
        let sheetPdfW = maxW;
        let sheetPdfH = sheetPdfW * sheetRatio;
        if (sheetPdfH > maxH) {
          sheetPdfH = maxH;
          sheetPdfW = sheetPdfH / sheetRatio;
        }
        const xOffset = margin + (maxW - sheetPdfW) / 2;
        const yOffset = margin + (maxH - sheetPdfH) / 2;
        pdf.addImage(capturedSheet.dataUrl, 'PNG', xOffset, yOffset, sheetPdfW, sheetPdfH, undefined, 'FAST');
      }

      const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      pdf.save(cleanFilename);
      return true;
    }

    // 2. Fallback for single container elements
    const captured = await captureCleanReportCanvas(element);
    if (!captured) {
      throw new Error('Failed to capture report element');
    }

    const { dataUrl: imgData, width: imgWidthPx, height: imgHeightPx } = captured;

    // Use legal size for table reports so all columns of Part B fit on one sheet
    const isLandscape = imgWidthPx > imgHeightPx * 1.05 || element.classList.contains('legal-landscape');

    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: isLandscape ? 'legal' : 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 4; // 4mm margin to maximize printable area and fit Part B
    const maxW = pageWidth - margin * 2;
    const maxH = pageHeight - margin * 2;

    // Always utilize full printable width so there are NO huge empty margins on left and right
    const finalW = maxW;
    const totalPdfH = (imgHeightPx / imgWidthPx) * finalW;

    if (totalPdfH <= maxH * 1.05) {
      // Single page document
      const renderH = Math.min(maxH, totalPdfH);
      pdf.addImage(imgData, 'PNG', margin, margin, finalW, renderH, undefined, 'FAST');
    } else {
      // Multi-page document: slice canvas cleanly by page height without shrinking width
      const pageCanvasHeight = Math.floor((maxH / maxW) * imgWidthPx);
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
          pdf.addPage(isLandscape ? 'legal' : 'a4', isLandscape ? 'landscape' : 'portrait');
        }

        const sliceH = Math.min(pageCanvasHeight, imgHeightPx - renderedPx);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = imgWidthPx;
        sliceCanvas.height = sliceH;
        const ctx = sliceCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, renderedPx, imgWidthPx, sliceH, 0, 0, imgWidthPx, sliceH);
          const sliceData = sliceCanvas.toDataURL('image/png', 0.98);
          const pdfSliceH = (sliceH / imgWidthPx) * maxW;
          pdf.addImage(sliceData, 'PNG', margin, margin, maxW, pdfSliceH, undefined, 'FAST');
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
      const fullHtml = buildPrintableHtmlDocument(clone.innerHTML, filename);
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
 * Master Print Trigger: Tries iframe printing, then window.print(),
 * and falls back to opening standalone window if both fail.
 */
export const executeReportPrint = async (
  element: HTMLElement | null,
  title: string = 'Karnataka School Report'
): Promise<boolean> => {
  if (!element) {
    window.focus();
    window.print();
    return true;
  }

  // 1. Try isolated iframe print (most reliable in iframes)
  const iframeSuccess = await printElementViaIframe(element, title);
  if (iframeSuccess) return true;

  // 2. Try direct window.print()
  try {
    window.focus();
    window.print();
    return true;
  } catch (_) {}

  // 3. Fallback: open clean print window
  return openCleanPrintWindow(element, title);
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
