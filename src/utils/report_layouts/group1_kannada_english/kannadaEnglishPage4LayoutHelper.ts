import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import type { ReportPaperSize } from '../../printPdfHelper';
import {
  REPORT_PAPER_SIZES,
  captureCleanReportCanvas,
  printElementViaIframe,
  openCleanPrintWindow,
  shareReportToWhatsApp,
  downloadElementAsHtml,
} from '../../printPdfHelper';

export type { ReportPaperSize };
export {
  REPORT_PAPER_SIZES,
  shareReportToWhatsApp,
  downloadElementAsHtml,
};

/**
 * ============================================================================
 * GROUP 1: KANNADA & ENGLISH MEDIUM PRIMARY CCE (CLASSES 1–5)
 * DEDICATED LAYOUT HELPER FOR PAGE 4 (9-LINE CONSOLIDATION REGISTER - 400 MARKS)
 * ============================================================================
 * Key Requirements:
 * 1. 24 Explicit Percentage-Based Columns summing to 100.0%:
 *    Sl (2.2%), Reg (2.6%), Student Name & Details (11.0% effective 10% of sheet),
 *    Attendance (3.5%), Period (4.2%), % (3.1%),
 *    4 Curricular Subjects x 2 cols (M & G) = 32.4%,
 *    Max Marks 400 (4.2%), Total Marks (4.6%), Total % (4.2%), Overall Grade (3.5%),
 *    5 Co-Scholastic Activities (19.5%),
 *    Result (4.4% effective 4% of sheet).
 * 2. Strict Binding Margins:
 *    - Left Margin: Legal: 2.5cm (25mm), A4: 2.2cm (22mm)
 *    - Right Margin: 0.65cm (6.5mm)
 *    - Top Margin: 0.65cm (6.5mm)
 *    - Bottom Margin: 0.65cm (6.5mm)
 * 3. Exact Dimensions:
 *    - Legal Landscape: 35.56cm (355.6mm) x 21.59cm (215.9mm) -> Left 2.5cm
 *    - A4 Landscape: 29.70cm (297mm) x 21.00cm (210mm) -> Left 2.2cm
 * 4. Stable Print Preview Bar:
 *    - Red "Return to Report", Green "Download PDF", and Blue "Print Dialog".
 *    - Blue Print Dialog invokes system print directly with iframe fallback.
 * ============================================================================
 */

export interface KannadaEnglishPage4PrintOptions {
  paperSize?: ReportPaperSize;
  title?: string;
  medium?: string;
}

/**
 * Dedicated Print Helper for Primary CCE Page 4 (9-Line Consolidation)
 */
export const printPrimaryCcePage4Detailed = async (
  element: HTMLElement | null,
  title: string = 'CCE Page 4 9-Line 400 Marks Consolidation Register',
  paperSize: ReportPaperSize = 'legal'
): Promise<boolean> => {
  if (!element) {
    window.focus();
    window.print();
    return true;
  }

  try {
    const prevTitle = document.title;
    if (title) document.title = title;

    // 1. Clean up any existing portal
    const existing = document.getElementById('kannada-english-page4-isolated-portal');
    if (existing) existing.remove();

    // Deep clone the report element
    const clone = element.cloneNode(true) as HTMLElement;

    // Remove screen-only UI controls, convert selects to clean spans
    clone
      .querySelectorAll('.print\\:hidden, .cce-print-hidden, button, select, input[type="button"]')
      .forEach((el) => {
        if (el.tagName === 'SELECT') {
          const sel = el as HTMLSelectElement;
          const text = sel.options[sel.selectedIndex]?.text || sel.value || '-';
          const span = document.createElement('span');
          span.className = 'font-bold text-center block w-full text-black';
          span.textContent = text;
          el.parentNode?.replaceChild(span, el);
        } else {
          el.remove();
        }
      });

    // Sync input values to clean text spans
    const originalInputs = element.querySelectorAll<HTMLInputElement>('input:not([type="button"]):not([type="submit"])');
    const clonedInputs = clone.querySelectorAll<HTMLInputElement>('input:not([type="button"]):not([type="submit"])');
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

    const isA4 = paperSize === 'a4';
    const leftMarginCm = isA4 ? '2.2cm' : '2.5cm';
    const leftMarginMm = isA4 ? '22mm' : '25mm';

    // Scoped CSS for strict 2.5cm / 2.2cm left margin, 0.65cm right/top/bottom, and 100% table fitting
    const pageStyle = document.createElement('style');
    pageStyle.textContent = `
      @page {
        size: ${isA4 ? 'A4' : 'legal'} landscape !important;
        margin: 0 !important;
      }

      body.kannada-english-page4-print-active {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      body.kannada-english-page4-print-active > *:not(#kannada-english-page4-isolated-portal) {
        display: none !important;
      }

      #kannada-english-page4-isolated-portal {
        display: block !important;
        position: relative !important;
        width: 100% !important;
        max-width: 100% !important;
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }

      #kannada-english-page4-isolated-portal .report-page-sheet {
        margin: 0 auto !important;
        padding-left: ${leftMarginMm} !important; /* Left margin for binding */
        padding-right: 6.5mm !important; /* Strict 0.65cm right margin */
        padding-top: 6.5mm !important; /* Strict 0.65cm top margin */
        padding-bottom: 6.5mm !important; /* Strict 0.65cm bottom margin */
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        background: #ffffff !important;
        height: auto !important;
        min-height: 0 !important;
        break-after: page !important;
        page-break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        box-shadow: none !important;
        border: none !important;
      }

      #kannada-english-page4-isolated-portal .report-page-sheet:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }

      #kannada-english-page4-isolated-portal table {
        width: 100% !important;
        max-width: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        border: 1.5px solid #000000 !important;
        background: #ffffff !important;
        color: #000000 !important;
      }

      #kannada-english-page4-isolated-portal th,
      #kannada-english-page4-isolated-portal td {
        border: 1px solid #000000 !important;
        padding: ${isA4 ? '0.5px 0.5px' : '1px 1px'} !important;
        font-size: ${isA4 ? '8.5px' : '9.5px'} !important;
        line-height: 1.15 !important;
        text-align: center !important;
        vertical-align: middle !important;
        word-break: break-word !important;
        overflow-wrap: break-word !important;
        box-sizing: border-box !important;
      }

      #kannada-english-page4-isolated-portal th {
        font-weight: 800 !important;
      }

      @media print {
        .kannada-page4-preview-bar,
        .kannada-english-page4-no-print {
          display: none !important;
        }
        select, .cce-screen-input {
          display: none !important;
        }
        .cce-pdf-text {
          display: block !important;
        }
      }

      /* Guarantee 24th Column (RESULT) is completely visible */
      #kannada-english-page4-isolated-portal th:last-child,
      #kannada-english-page4-isolated-portal td:last-child {
        display: table-cell !important;
        visibility: visible !important;
        white-space: normal !important;
        font-weight: 900 !important;
      }
    `;

    // 1. Interactive Preview Bar (Visible on screen, hidden when printing)
    const previewBar = document.createElement('div');
    previewBar.className = 'kannada-page4-preview-bar kannada-english-page4-no-print';
    previewBar.style.cssText = `
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      z-index: 99999999;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
      border-bottom: 2px solid #3b82f6;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    const leftGroup = document.createElement('div');
    leftGroup.style.cssText = 'display: flex; align-items: center; gap: 14px;';

    const returnBtn = document.createElement('button');
    returnBtn.type = 'button';
    returnBtn.id = 'kannada-english-page4-return-btn';
    returnBtn.innerHTML = '&#8592; Return to Report';
    returnBtn.title = 'Close preview and return to report (or press Esc)';
    returnBtn.style.cssText = `
      background: #dc2626;
      color: #ffffff;
      border: 1px solid #b91c1c;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 6px rgba(220, 38, 38, 0.4);
    `;

    const titleSpan = document.createElement('span');
    titleSpan.style.cssText = 'font-weight: 800; font-size: 13px; color: #fde047;';
    titleSpan.textContent = `Print Ready (${paperSize.toUpperCase()} Landscape - 9-Line 400m)`;

    const hintSpan = document.createElement('span');
    hintSpan.style.cssText = 'font-size: 11px; color: #94a3b8;';
    hintSpan.textContent = '(Press [Esc] to exit)';

    leftGroup.appendChild(returnBtn);
    leftGroup.appendChild(titleSpan);
    leftGroup.appendChild(hintSpan);

    const rightGroup = document.createElement('div');
    rightGroup.style.cssText = 'display: flex; align-items: center; gap: 10px;';

    // Direct PDF download button right on the print bar
    const pdfBtn = document.createElement('button');
    pdfBtn.type = 'button';
    pdfBtn.id = 'kannada-english-page4-bar-pdf-btn';
    pdfBtn.innerHTML = '&#128196; Download PDF';
    pdfBtn.title = 'Download exact print-ready PDF file';
    pdfBtn.style.cssText = `
      background: #059669;
      color: #ffffff;
      border: 1px solid #047857;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    `;
    pdfBtn.onclick = async () => {
      pdfBtn.disabled = true;
      const prevHtml = pdfBtn.innerHTML;
      pdfBtn.innerHTML = '&#9203; Downloading...';
      try {
        await exportPrimaryCcePage4Pdf(clone, `${title.replace(/\s+/g, '_')}.pdf`, paperSize);
      } catch (err) {
        console.error('Error downloading PDF from preview bar:', err);
      } finally {
        pdfBtn.disabled = false;
        pdfBtn.innerHTML = prevHtml;
      }
    };

    const reprintBtn = document.createElement('button');
    reprintBtn.type = 'button';
    reprintBtn.id = 'kannada-english-page4-reprint-btn';
    reprintBtn.innerHTML = '&#128438; Print Dialog';
    reprintBtn.style.cssText = `
      background: #2563eb;
      color: #ffffff;
      border: 1px solid #1d4ed8;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    `;

    const triggerSystemPrint = () => {
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.warn('Direct window.print() failed, falling back to iframe print:', err);
        try {
          printElementViaIframe(clone, title, paperSize, 'landscape');
        } catch (_) {}
      }
    };

    // Print button invokes print immediately upon user click
    reprintBtn.onclick = () => {
      triggerSystemPrint();
    };

    rightGroup.appendChild(pdfBtn);
    rightGroup.appendChild(reprintBtn);

    previewBar.appendChild(leftGroup);
    previewBar.appendChild(rightGroup);

    const portal = document.createElement('div');
    portal.id = 'kannada-english-page4-isolated-portal';
    portal.appendChild(pageStyle);
    portal.appendChild(previewBar);
    portal.appendChild(clone);
    document.body.appendChild(portal);

    document.body.classList.add('kannada-english-page4-print-active');

    // Clean up when user returns or closes preview
    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.body.classList.remove('kannada-english-page4-print-active');
      if (document.body.contains(portal)) {
        portal.remove();
      }
      document.title = prevTitle;
      window.removeEventListener('keydown', handleKeydown);
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup();
      }
    };

    returnBtn.onclick = () => cleanup();
    window.addEventListener('keydown', handleKeydown);

    // Synchronously focus so print dialog can be invoked
    window.focus();
    triggerSystemPrint();
    return true;
  } catch (err) {
    console.warn('printPrimaryCcePage4Detailed fallback to iframe:', err);
    try {
      const printed = await printElementViaIframe(element, title, paperSize, 'landscape');
      if (printed) return true;
    } catch (_) {}
    return openCleanPrintWindow(element, title, paperSize, 'landscape');
  }
};

/**
 * Dedicated PDF Exporter for Kannada/English CCE Page 4 (9-Line Consolidation)
 */
export const exportPrimaryCcePage4Pdf = async (
  element: HTMLElement,
  filename: string,
  paperSize: ReportPaperSize = 'legal'
): Promise<boolean> => {
  const chosenSize = REPORT_PAPER_SIZES[paperSize] || REPORT_PAPER_SIZES.legal;
  const pageWidth = chosenSize.widthMm;
  const pageHeight = chosenSize.heightMm;
  const pdfFormat: [number, number] = [pageWidth, pageHeight];
  const isA4 = paperSize === 'a4';
  const leftMarginMm = isA4 ? '22mm' : '25mm';

  const isAlreadyInPortal = Boolean(
    element.id === 'kannada-english-page4-isolated-portal' ||
    element.closest('#kannada-english-page4-isolated-portal') ||
    document.getElementById('kannada-english-page4-isolated-portal')?.contains(element)
  );

  let targetContainer = element;
  let stagingPortal: HTMLElement | null = null;

  if (!isAlreadyInPortal) {
    stagingPortal = document.createElement('div');
    stagingPortal.id = 'kannada-english-page4-staging-portal';
    stagingPortal.style.cssText = `
      position: fixed;
      top: -10000px;
      left: 0;
      width: ${pageWidth}mm;
      min-width: ${pageWidth}mm;
      max-width: ${pageWidth}mm;
      background: #ffffff;
      opacity: 0;
      pointer-events: none;
      z-index: -9999;
      overflow: hidden;
    `;

    const stagingStyle = document.createElement('style');
    stagingStyle.textContent = `
      #kannada-english-page4-staging-portal {
        display: block !important;
        position: relative !important;
        width: 100% !important;
        max-width: 100% !important;
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }

      #kannada-english-page4-staging-portal .report-page-sheet {
        margin: 0 !important;
        padding-left: ${leftMarginMm} !important;
        padding-right: 6.5mm !important;
        padding-top: 6.5mm !important;
        padding-bottom: 6.5mm !important;
        width: ${pageWidth}mm !important;
        min-height: ${pageHeight}mm !important;
        max-width: ${pageWidth}mm !important;
        box-sizing: border-box !important;
        background: #ffffff !important;
        color: #000000 !important;
      }

      #kannada-english-page4-staging-portal table {
        width: 100% !important;
        max-width: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        border: 1.5px solid #000000 !important;
        background: #ffffff !important;
        color: #000000 !important;
      }

      #kannada-english-page4-staging-portal th,
      #kannada-english-page4-staging-portal td {
        border: 1px solid #000000 !important;
        padding: ${isA4 ? '0.5px 0.5px' : '1px 1px'} !important;
        font-size: ${isA4 ? '8.5px' : '9.5px'} !important;
        line-height: 1.15 !important;
        text-align: center !important;
        vertical-align: middle !important;
        word-break: break-word !important;
        overflow-wrap: break-word !important;
        box-sizing: border-box !important;
      }

      #kannada-english-page4-staging-portal th {
        font-weight: 800 !important;
      }

      .cce-screen-input {
        display: none !important;
      }
      .cce-pdf-text {
        display: block !important;
        text-align: center !important;
      }
    `;

    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.cce-print-hidden, .print\\:hidden, button').forEach((b) => b.remove());

    // Replace selects with text spans
    clone.querySelectorAll('select').forEach((sel) => {
      const text = sel.options[sel.selectedIndex]?.text || sel.value || '-';
      const span = document.createElement('span');
      span.className = 'font-bold font-mono text-center block w-full text-black';
      span.textContent = text;
      sel.parentNode?.replaceChild(span, sel);
    });

    // Replace inputs with values
    const originalInputs = element.querySelectorAll<HTMLInputElement>('input:not([type="button"]):not([type="submit"])');
    const clonedInputs = clone.querySelectorAll<HTMLInputElement>('input:not([type="button"]):not([type="submit"])');
    originalInputs.forEach((orig, idx) => {
      const c = clonedInputs[idx];
      if (c) {
        c.value = orig.value;
        const parent = c.parentElement;
        const pdfEl = parent?.querySelector('.cce-pdf-text') as HTMLElement | null;
        if (pdfEl && orig.value && orig.value.trim() !== '') {
          pdfEl.textContent = orig.value.trim();
        }
      }
    });

    stagingPortal.appendChild(stagingStyle);
    stagingPortal.appendChild(clone);
    document.body.appendChild(stagingPortal);
    targetContainer = stagingPortal;

    await new Promise((res) => setTimeout(res, 50));
  }

  const pageSheets = targetContainer.classList.contains('report-page-sheet')
    ? [targetContainer]
    : Array.from(targetContainer.querySelectorAll<HTMLElement>('.report-page-sheet'));

  if (pageSheets.length === 0) {
    if (stagingPortal) stagingPortal.remove();
    return false;
  }

  element.classList.add('cce-pdf-mode');
  pageSheets.forEach((s) => s.classList.add('cce-pdf-mode'));

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: pdfFormat,
  });

  let renderedAny = false;

  try {
    for (let sIdx = 0; sIdx < pageSheets.length; sIdx++) {
      const sheet = pageSheets[sIdx];
      try {
        const dataUrl = await toPng(sheet, {
          quality: 0.98,
          pixelRatio: Math.min(window.devicePixelRatio || 2, 2.5),
          backgroundColor: '#ffffff',
          cacheBust: true,
          filter: (node: Node) => {
            if (node instanceof HTMLElement) {
              if (
                node.classList.contains('cce-print-hidden') ||
                node.classList.contains('print:hidden') ||
                node.classList.contains('kannada-page4-preview-bar') ||
                node.classList.contains('kannada-english-page4-no-print')
              ) {
                return false;
              }
            }
            return true;
          },
        });

        if (renderedAny) {
          pdf.addPage(pdfFormat, 'landscape');
        }

        pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
        renderedAny = true;
      } catch (err) {
        console.warn(`toPng capture failed for page ${sIdx + 1}:`, err);
        try {
          const fallback = await captureCleanReportCanvas(sheet);
          if (fallback?.dataUrl) {
            if (renderedAny) pdf.addPage(pdfFormat, 'landscape');
            pdf.addImage(fallback.dataUrl, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
            renderedAny = true;
          }
        } catch (_) {}
      }
    }
  } finally {
    element.classList.remove('cce-pdf-mode');
    pageSheets.forEach((s) => s.classList.remove('cce-pdf-mode'));
    if (stagingPortal) {
      stagingPortal.remove();
    }
  }

  if (renderedAny) {
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    try {
      pdf.save(cleanFilename);
    } catch (_) {
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
  return false;
};

/**
 * Dedicated HTML Exporter for Kannada/English CCE Page 4
 */
export const exportPrimaryCcePage4Html = (
  element: HTMLElement,
  filename: string,
  paperSize: ReportPaperSize = 'legal'
): boolean => {
  try {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.classList.add('cce-pdf-mode');
    clone.querySelectorAll('.cce-print-hidden, .print\\:hidden, button, select').forEach((el) => el.remove());

    // Replace inputs with values
    clone.querySelectorAll<HTMLInputElement>('input').forEach((inp) => {
      const span = document.createElement('span');
      span.className = 'font-bold font-mono text-center block w-full';
      span.style.textAlign = 'center';
      span.textContent = inp.value || '-';
      inp.parentNode?.replaceChild(span, inp);
    });

    let pageStyles = '';
    try {
      const styleEls = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
      pageStyles = styleEls.map((el) => el.outerHTML).join('\n');
    } catch (_) {}

    const isA4 = paperSize === 'a4';
    const leftMarginCm = isA4 ? '2.2cm' : '2.5cm';
    const leftMarginMm = isA4 ? '22mm' : '25mm';

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename.replace(/\.html$/i, '')}</title>
  ${pageStyles}
  <style>
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: #ffffff !important;
      color: #000000 !important;
      font-family: system-ui, -apple-system, sans-serif;
    }
    @page {
      size: ${isA4 ? 'A4' : 'legal'} landscape;
      margin: 0.65cm 0.65cm 0.65cm ${leftMarginCm} !important;
    }
    .report-page-sheet {
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin: 0 auto !important;
      padding-top: 6.5mm !important;
      padding-right: 6.5mm !important;
      padding-bottom: 6.5mm !important;
      padding-left: ${leftMarginMm} !important;
      box-sizing: border-box !important;
      background: #ffffff !important;
      width: 100% !important;
    }
    .report-page-sheet:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
    }
    th, td {
      border: 1px solid #000000 !important;
      text-align: center !important;
      vertical-align: middle !important;
    }
  </style>
</head>
<body>
  ${clone.innerHTML}
</body>
</html>`;

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
    console.error('exportPrimaryCcePage4Html error:', err);
    return false;
  }
};
