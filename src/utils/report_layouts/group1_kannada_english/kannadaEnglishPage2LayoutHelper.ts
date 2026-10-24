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
 * DEDICATED LAYOUT HELPER FOR PAGE 2 (100 MARKS CONSOLIDATION REGISTER)
 * ============================================================================
 * Key Requirements:
 * 1. 22 Explicit Columns:
 *    Sl, Reg/SATS, Student Name/DOB, Gender/Cat, Days Attended,
 *    4 Curricular Subjects x 2 cols (M & G) = 8 cols (strictly no extra cols/subjects),
 *    Total 400, Percentage, Overall Grade,
 *    5 Co-Scholastic Activities,
 *    Result (PROMOTED / NOT PROMOTED wrapped onto 2 lines, >= 30% promoted).
 * 2. Strict 1.5cm (15mm) Left Margin, 0.85cm Top, 0.75cm Right, 0.85cm Bottom.
 * 3. 1:1 Matching Preview and PDF:
 *    The sheet element encapsulates exact page dimensions with 15mm left margin,
 *    so PDF export renders 1:1 without double margins or empty gaps.
 * 4. Print Preview Stability:
 *    Does NOT auto-close or disappear.
 *    Provides Return to Report, Download PDF, and Print Dialog buttons.
 * ============================================================================
 */

export interface KannadaEnglishPage2PrintOptions {
  paperSize?: ReportPaperSize;
  title?: string;
  medium?: string;
}

/**
 * Dedicated Print Helper for Kannada/English CCE Page 2
 * - Scoped portal preventing styles leaking to other reports.
 * - Exact 15mm left margin, 8.5mm top margin, 7.5mm right margin, 8.5mm bottom margin.
 * - Interactive sticky bar with red "Return", green "Download PDF", and blue "Print Dialog" buttons.
 * - Guaranteed unclipped 22nd column (RESULT).
 */
export const printPrimaryCcePage2Register = async (
  element: HTMLElement | null,
  title: string = 'CCE Page 2 100 Marks Consolidation Register',
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
    const existing = document.getElementById('kannada-english-page2-isolated-portal');
    if (existing) existing.remove();

    // 2. Clone element with full fidelity
    const clone = element.cloneNode(true) as HTMLElement;
    clone.classList.add('cce-pdf-mode');
    clone.querySelectorAll('.cce-print-hidden, .print\\:hidden, button, select').forEach((btn) => {
      if (btn.tagName.toLowerCase() === 'select') {
        const sel = btn as HTMLSelectElement;
        const span = document.createElement('span');
        span.className = 'font-black font-mono text-center inline-block w-full text-black';
        span.textContent = sel.value || '-';
        sel.parentNode?.replaceChild(span, sel);
      } else {
        btn.remove();
      }
    });

    // Replace inputs with values
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

    // Scoped CSS for strict 15mm left margin, unclipped 22nd column, and compact font sizing
    const pageStyle = document.createElement('style');
    pageStyle.textContent = `
      @page {
        size: ${isA4 ? 'A4' : 'legal'} landscape !important;
        margin: 0 !important; /* Margins are encapsulated inside .report-page-sheet for pixel-perfect match */
      }

      body.kannada-english-page2-print-active {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      body.kannada-english-page2-print-active > *:not(#kannada-english-page2-isolated-portal) {
        display: none !important;
      }

      #kannada-english-page2-isolated-portal {
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

      #kannada-english-page2-isolated-portal .report-page-sheet {
        margin: 0 !important;
        padding-left: 15mm !important; /* Strict 1.5cm (15mm) left margin */
        padding-right: 7.5mm !important; /* Strict 0.75cm (7.5mm) right margin */
        padding-top: 8.5mm !important; /* Strict 0.85cm (8.5mm) top margin */
        padding-bottom: 8.5mm !important; /* Strict 0.85cm (8.5mm) bottom margin */
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        background: #ffffff !important;
        color: #000000 !important;
        border: none !important;
        box-shadow: none !important;
      }

      #kannada-english-page2-isolated-portal .report-page-sheet:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }

      #kannada-english-page2-isolated-portal .cce-sheet-container {
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      #kannada-english-page2-isolated-portal table {
        width: 100% !important;
        max-width: 100% !important;
        table-layout: fixed !important;
        box-sizing: border-box !important;
        border-collapse: collapse !important;
        border: 1.5px solid #000000 !important;
        background: #ffffff !important;
        color: #000000 !important;
      }

      #kannada-english-page2-isolated-portal th,
      #kannada-english-page2-isolated-portal td {
        border: 1px solid #000000 !important;
        padding: ${isA4 ? '1px 1px' : '1.5px 1.5px'} !important;
        font-size: ${isA4 ? '9px' : '10px'} !important;
        line-height: 1.1 !important;
        text-align: center !important;
        vertical-align: middle !important;
        word-break: break-word !important;
        overflow-wrap: break-word !important;
        box-sizing: border-box !important;
      }

      #kannada-english-page2-isolated-portal th {
        font-weight: 800 !important;
      }

      #kannada-english-page2-isolated-portal .cce-signatures-block {
        margin-top: 20mm !important;
      }

      /* Hide interactive preview bar and dropdown arrows during actual print */
      @media print {
        .kannada-page2-preview-bar,
        .kannada-english-page2-no-print {
          display: none !important;
        }
        select {
          display: none !important;
        }
      }

      /* Guarantee 22nd Column (RESULT) is completely visible */
      #kannada-english-page2-isolated-portal th:last-child,
      #kannada-english-page2-isolated-portal td:last-child {
        display: table-cell !important;
        visibility: visible !important;
        white-space: normal !important;
        font-weight: 900 !important;
        font-size: ${isA4 ? '8.5px' : '9.5px'} !important;
        line-height: 1.05 !important;
      }
    `;

    // 1. Interactive Preview Bar (Visible on screen, hidden when printing)
    const previewBar = document.createElement('div');
    previewBar.className = 'kannada-page2-preview-bar kannada-english-page2-no-print';
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
    returnBtn.id = 'kannada-english-page2-return-btn';
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
    titleSpan.textContent = `Print Ready (${paperSize.toUpperCase()} Landscape - 4 Subjects 400m)`;

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
    pdfBtn.id = 'kannada-english-page2-bar-pdf-btn';
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
        await exportPrimaryCcePage2Pdf(clone, `${title.replace(/\s+/g, '_')}.pdf`, paperSize);
      } catch (err) {
        console.error('Error downloading PDF from preview bar:', err);
      } finally {
        pdfBtn.disabled = false;
        pdfBtn.innerHTML = prevHtml;
      }
    };

    const reprintBtn = document.createElement('button');
    reprintBtn.type = 'button';
    reprintBtn.id = 'kannada-english-page2-reprint-btn';
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
        if (window.parent && window.parent !== window) {
          try {
            window.parent.focus();
          } catch (_) {}
        }
        window.focus();
        window.print();
      } catch (err) {
        console.warn('System print invocation error:', err);
        try {
          document.execCommand('print', false);
        } catch (_) {}
      }
    };

    reprintBtn.onclick = () => {
      triggerSystemPrint();
    };

    rightGroup.appendChild(pdfBtn);
    rightGroup.appendChild(reprintBtn);

    previewBar.appendChild(leftGroup);
    previewBar.appendChild(rightGroup);

    const portal = document.createElement('div');
    portal.id = 'kannada-english-page2-isolated-portal';
    portal.appendChild(pageStyle);
    portal.appendChild(previewBar);
    portal.appendChild(clone);
    document.body.appendChild(portal);

    document.body.classList.add('kannada-english-page2-print-active');

    // Clean up when user returns or closes preview
    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.body.classList.remove('kannada-english-page2-print-active');
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

    // Yield to the browser event loop so PC layout reflow completes before launching system print dialog
    requestAnimationFrame(() => {
      setTimeout(() => {
        triggerSystemPrint();
      }, 150);
    });
    return true;
  } catch (err) {
    console.warn('printPrimaryCcePage2Register fallback to iframe:', err);
    try {
      const printed = await printElementViaIframe(element, title, paperSize, 'landscape');
      if (printed) return true;
    } catch (_) {}
    return openCleanPrintWindow(element, title, paperSize, 'landscape');
  }
};

/**
 * Dedicated PDF Exporter for Kannada/English CCE Page 2
 * - Pixel-perfect 1:1 match with preview.
 * - The captured sheet encapsulates exact margins: 15mm (1.5cm) left, 8.5mm top, 7.5mm right, 8.5mm bottom.
 * - Captures each sheet directly via toPng without altering global scrollbars, preventing any viewport shifting.
 * - Adds sheet canvas to jsPDF at (0, 0, pageWidth, pageHeight).
 * - All 22 columns are guaranteed to be present and visible without horizontal cutoff.
 */
export const exportPrimaryCcePage2Pdf = async (
  element: HTMLElement,
  filename: string,
  paperSize: ReportPaperSize = 'legal'
): Promise<boolean> => {
  const chosenSize = REPORT_PAPER_SIZES[paperSize] || REPORT_PAPER_SIZES.legal;
  const pageWidth = chosenSize.widthMm;
  const pageHeight = chosenSize.heightMm;
  const pdfFormat: [number, number] = [pageWidth, pageHeight];
  const isA4 = paperSize === 'a4';

  // Check if element is already inside the isolated print portal (e.g. from the green preview button)
  const isAlreadyInPortal = Boolean(
    element.id === 'kannada-english-page2-isolated-portal' ||
    element.closest('#kannada-english-page2-isolated-portal') ||
    document.getElementById('kannada-english-page2-isolated-portal')?.contains(element)
  );

  let targetContainer = element;
  let stagingPortal: HTMLElement | null = null;

  if (!isAlreadyInPortal) {
    // Replicate the exact isolated portal structure and styles so external buttons match the green button 100%
    stagingPortal = document.createElement('div');
    stagingPortal.id = 'kannada-english-page2-staging-portal';
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
      #kannada-english-page2-staging-portal {
        display: block !important;
        position: relative !important;
        width: ${pageWidth}mm !important;
        max-width: ${pageWidth}mm !important;
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }

      #kannada-english-page2-staging-portal .report-page-sheet {
        margin: 0 !important;
        padding-left: 15mm !important; /* Strict 1.5cm (15mm) left margin */
        padding-right: 7.5mm !important; /* Strict 0.75cm (7.5mm) right margin */
        padding-top: 8.5mm !important; /* Strict 0.85cm (8.5mm) top margin */
        padding-bottom: 8.5mm !important; /* Strict 0.85cm (8.5mm) bottom margin */
        width: ${pageWidth}mm !important;
        min-height: ${pageHeight}mm !important;
        box-sizing: border-box !important;
        background: #ffffff !important;
        color: #000000 !important;
        border: none !important;
        box-shadow: none !important;
      }

      #kannada-english-page2-staging-portal .cce-sheet-container {
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      #kannada-english-page2-staging-portal table {
        width: 100% !important;
        max-width: 100% !important;
        table-layout: fixed !important;
        box-sizing: border-box !important;
        border-collapse: collapse !important;
        border: 1.5px solid #000000 !important;
        background: #ffffff !important;
        color: #000000 !important;
      }

      #kannada-english-page2-staging-portal th,
      #kannada-english-page2-staging-portal td {
        border: 1px solid #000000 !important;
        padding: ${isA4 ? '1px 1px' : '1.5px 1.5px'} !important;
        font-size: ${isA4 ? '9px' : '10px'} !important;
        line-height: 1.1 !important;
        text-align: center !important;
        vertical-align: middle !important;
        word-break: break-word !important;
        overflow-wrap: break-word !important;
        box-sizing: border-box !important;
      }

      #kannada-english-page2-staging-portal th {
        font-weight: 800 !important;
      }

      #kannada-english-page2-staging-portal .cce-signatures-block {
        margin-top: 20mm !important;
      }
    `;

    const clone = element.cloneNode(true) as HTMLElement;
    clone.classList.add('cce-pdf-mode');
    clone.querySelectorAll('.cce-print-hidden, .print\\:hidden, button').forEach((el) => el.remove());

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

    // Small delay to ensure browser paints styles in staging portal
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
        // Direct toPng capture on the sheet without touching global scrollbars or page width
        const dataUrl = await toPng(sheet, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          skipFonts: true,
          fontEmbedCSS: '',
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

        if (!dataUrl) continue;
        if (renderedAny) {
          pdf.addPage(pdfFormat, 'landscape');
        }

        // Render sheet 1:1 on the PDF page: (0, 0, pageWidth, pageHeight)
        // Margins (15mm left, 8.5mm top, 7.5mm right, 8.5mm bottom) are already inside the sheet
        pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
        renderedAny = true;
      } catch (sheetErr) {
        console.warn(`toPng error on sheet ${sIdx + 1}, falling back to captureCleanReportCanvas:`, sheetErr);
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
 * Dedicated HTML Exporter for Kannada/English CCE Page 2
 * - Exact 1.5cm (15mm) left margin, 0.85cm (8.5mm) top margin, 0.75cm (7.5mm) right margin
 * - Exact 2cm (20mm) gap between table and signatures on the last page
 * - Formats inputs cleanly into static text
 */
export const exportPrimaryCcePage2Html = (
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

    const fullHtml = `<!DOCTYPE html>
<html lang="kn">
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
      font-family: 'Anek Kannada', 'Noto Sans Kannada', system-ui, -apple-system, sans-serif;
    }
    @page {
      size: ${isA4 ? 'A4' : 'legal'} landscape;
      margin-top: 8.5mm;
      margin-right: 7.5mm;
      margin-bottom: 8.5mm;
      margin-left: 15mm;
    }
    .report-page-sheet {
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin: 0 auto !important;
      padding-top: 8.5mm !important;
      padding-right: 7.5mm !important;
      padding-bottom: 8.5mm !important;
      padding-left: 15mm !important;
      box-sizing: border-box !important;
      background: #ffffff !important;
      width: 100% !important;
    }
    .report-page-sheet:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
    .cce-signatures-block {
      margin-top: 20mm !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
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
    console.error('exportPrimaryCcePage2Html error:', err);
    return false;
  }
};
