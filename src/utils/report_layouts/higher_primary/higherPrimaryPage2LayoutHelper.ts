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
 * HIGHER PRIMARY CCE (CLASSES 6–8)
 * DEDICATED LAYOUT & EXPORT HELPER FOR PAGE 2 (100 MARKS CONSOLIDATION REGISTER)
 * ============================================================================
 * Key Requirements:
 * 1. Preserves exact 35 columns without altering structure.
 * 2. Strict Binding Margins:
 *    - Left Margin: Legal: 2.0cm (20mm), A4: 1.8cm (18mm)
 *    - Right Margin: 6mm (0.6cm)
 *    - Top Margin: 6mm (0.6cm)
 *    - Bottom Margin: 6mm (0.6cm)
 * 3. Exact Dimensions & Page Break Rules:
 *    - No duplicate or blank interleaved pages (5-page report = exactly 5 pages printed).
 *    - Clean @page margin: 0 with internal sheet padding to prevent double margin overflows.
 *    - Last sheet break-after avoid.
 * 4. Interactive Preview Bar:
 *    - Red "Return to Report", Green "Download PDF", and Blue "Print Dialog".
 *    - Immediate synchronous system print trigger with iframe fallback.
 * ============================================================================
 */

export interface HigherPrimaryPage2PrintOptions {
  paperSize?: ReportPaperSize;
  title?: string;
  medium?: string;
}

/**
 * Dedicated Print Helper for Higher Primary CCE Page 2 (100 Marks Consolidation Register)
 */
export const printHigherPrimaryCcePage2Detailed = async (
  element: HTMLElement | null,
  title: string = 'Higher Primary CCE Page 2 100 Marks Consolidation Register',
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
    const existing = document.getElementById('higher-primary-page2-isolated-portal');
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
    const leftMarginMm = isA4 ? '18mm' : '20mm';

    // Scoped CSS for strict 2.0cm (20mm) left binding margin and 0 blank interleaved pages
    const pageStyle = document.createElement('style');
    pageStyle.textContent = `
      @page {
        size: ${isA4 ? 'A4' : 'legal'} landscape !important;
        margin: 0 !important;
      }

      body.hp-page2-print-active {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      body.hp-page2-print-active > *:not(#higher-primary-page2-isolated-portal) {
        display: none !important;
      }

      #higher-primary-page2-isolated-portal {
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

      #higher-primary-page2-isolated-portal .report-page-sheet {
        margin: 0 auto !important;
        padding-left: ${leftMarginMm} !important; /* Left margin for binding */
        padding-right: 6mm !important;
        padding-top: 6mm !important;
        padding-bottom: 6mm !important;
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

      #higher-primary-page2-isolated-portal .report-page-sheet:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }

      #higher-primary-page2-isolated-portal table {
        width: 100% !important;
        max-width: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        border: 1.5px solid #000000 !important;
        background: #ffffff !important;
        color: #000000 !important;
      }

      #higher-primary-page2-isolated-portal th,
      #higher-primary-page2-isolated-portal td {
        border: 1px solid #000000 !important;
        padding: ${isA4 ? '0.25px 0.5px' : '0.5px 1px'} !important;
        font-size: ${isA4 ? '7px' : '8px'} !important;
        line-height: 1.1 !important;
        text-align: center !important;
        vertical-align: middle !important;
        word-break: break-word !important;
        overflow-wrap: break-word !important;
        box-sizing: border-box !important;
      }

      #higher-primary-page2-isolated-portal th {
        font-weight: 800 !important;
      }

      @media print {
        .hp-page2-preview-bar,
        .hp-page2-no-print {
          display: none !important;
        }
        select, .cce-screen-input {
          display: none !important;
        }
        .cce-pdf-text {
          display: block !important;
        }
      }

      /* Guarantee 35th Column (RESULT) is completely visible */
      #higher-primary-page2-isolated-portal th:last-child,
      #higher-primary-page2-isolated-portal td:last-child {
        display: table-cell !important;
        visibility: visible !important;
        white-space: normal !important;
        font-weight: 900 !important;
      }
    `;

    // 1. Interactive Preview Bar (Matching 1-5 100 marks consolidation)
    const previewBar = document.createElement('div');
    previewBar.className = 'hp-page2-preview-bar hp-page2-no-print';
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
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      border-bottom: 2px solid #334155;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    const leftGroup = document.createElement('div');
    leftGroup.style.cssText = 'display: flex; align-items: center; gap: 14px;';

    // Red Return button
    const returnBtn = document.createElement('button');
    returnBtn.type = 'button';
    returnBtn.id = 'higher-primary-page2-return-btn';
    returnBtn.innerHTML = '&#8592; Return to Report (ವರದಿಗೆ ಹಿಂತಿರುಗಿ)';
    returnBtn.title = 'Close print view and return to editing screen';
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
    titleSpan.textContent = `Print Ready (${paperSize.toUpperCase()} Landscape - 35 Columns)`;

    const hintSpan = document.createElement('span');
    hintSpan.style.cssText = 'font-size: 11px; color: #94a3b8;';
    hintSpan.textContent = '(Press [Esc] to exit)';

    leftGroup.appendChild(returnBtn);
    leftGroup.appendChild(titleSpan);
    leftGroup.appendChild(hintSpan);

    const rightGroup = document.createElement('div');
    rightGroup.style.cssText = 'display: flex; align-items: center; gap: 10px;';

    // Direct PDF download button
    const pdfBtn = document.createElement('button');
    pdfBtn.type = 'button';
    pdfBtn.id = 'higher-primary-page2-bar-pdf-btn';
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
        await exportHigherPrimaryCcePage2Pdf(clone, `${title.replace(/\s+/g, '_')}.pdf`, paperSize);
      } catch (err) {
        console.error('Error downloading PDF from preview bar:', err);
      } finally {
        pdfBtn.disabled = false;
        pdfBtn.innerHTML = prevHtml;
      }
    };

    // Blue Print Dialog button
    const reprintBtn = document.createElement('button');
    reprintBtn.type = 'button';
    reprintBtn.id = 'higher-primary-page2-reprint-btn';
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

    reprintBtn.onclick = () => {
      triggerSystemPrint();
    };

    rightGroup.appendChild(pdfBtn);
    rightGroup.appendChild(reprintBtn);

    previewBar.appendChild(leftGroup);
    previewBar.appendChild(rightGroup);

    // 2. Assemble isolated portal container
    const portal = document.createElement('div');
    portal.id = 'higher-primary-page2-isolated-portal';
    portal.appendChild(pageStyle);
    portal.appendChild(previewBar);

    // Wrapper for report content
    const contentWrapper = document.createElement('div');
    contentWrapper.id = 'higher-primary-page2-print-content';
    contentWrapper.appendChild(clone);
    portal.appendChild(contentWrapper);

    // Attach to document.body
    document.body.appendChild(portal);
    document.body.classList.add('hp-page2-print-active');

    // Cleanup function
    const cleanup = () => {
      document.body.classList.remove('hp-page2-print-active');
      const p = document.getElementById('higher-primary-page2-isolated-portal');
      if (p) p.remove();
      document.title = prevTitle;
      window.removeEventListener('keydown', handleKeyDown);
    };

    returnBtn.onclick = cleanup;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Allow browser engine to parse DOM
    await new Promise((resolve) => setTimeout(resolve, 80));

    // Automatically invoke print dialog immediately
    triggerSystemPrint();

    return true;
  } catch (err) {
    console.error('printHigherPrimaryCcePage2Detailed error, using fallback:', err);
    try {
      const printed = await printElementViaIframe(element, title, paperSize, 'landscape');
      if (printed) return true;
    } catch (_) {}
    return openCleanPrintWindow(element, title, paperSize, 'landscape');
  }
};

/**
 * Dedicated Multi-Page PDF Exporter for Higher Primary CCE Page 2
 */
export const exportHigherPrimaryCcePage2Pdf = async (
  element: HTMLElement,
  filename: string = 'Higher_Primary_Page2_100Marks_Consolidation.pdf',
  paperSize: ReportPaperSize = 'legal'
): Promise<boolean> => {
  const chosenSize = REPORT_PAPER_SIZES[paperSize] || REPORT_PAPER_SIZES.legal;
  const pdfFormat: [number, number] = [chosenSize.widthMm, chosenSize.heightMm];
  const isA4 = paperSize === 'a4';
  const leftMarginMm = isA4 ? '18mm' : '20mm';

  let targetContainer: HTMLElement = element;
  let stagingPortal: HTMLElement | null = null;

  const existingPortal = document.getElementById('higher-primary-page2-isolated-portal');
  if (existingPortal) {
    targetContainer = existingPortal;
  } else {
    stagingPortal = document.createElement('div');
    stagingPortal.id = 'higher-primary-page2-pdf-staging-portal';
    stagingPortal.style.cssText = `
      position: absolute;
      left: -99999px;
      top: 0;
      width: ${isA4 ? '297mm' : '355.6mm'};
      background: #ffffff;
      color: #000000;
      box-sizing: border-box;
      z-index: -9999;
    `;

    const stagingStyle = document.createElement('style');
    stagingStyle.textContent = `
      #higher-primary-page2-pdf-staging-portal {
        background: #ffffff !important;
        color: #000000 !important;
        font-family: 'Anek Kannada', 'Noto Sans Kannada', system-ui, sans-serif !important;
      }
      #higher-primary-page2-pdf-staging-portal .report-page-sheet {
        margin: 0 !important;
        padding-left: ${leftMarginMm} !important;
        padding-right: 6mm !important;
        padding-top: 6mm !important;
        padding-bottom: 6mm !important;
        width: 100% !important;
        box-sizing: border-box !important;
        background: #ffffff !important;
        box-shadow: none !important;
        border: none !important;
      }
      #higher-primary-page2-pdf-staging-portal table {
        width: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        border: 1.5px solid #000000 !important;
        background: #ffffff !important;
        color: #000000 !important;
      }
      #higher-primary-page2-pdf-staging-portal th,
      #higher-primary-page2-pdf-staging-portal td {
        border: 1px solid #000000 !important;
        padding: ${isA4 ? '0.25px 0.5px' : '0.5px 1px'} !important;
        font-size: ${isA4 ? '7px' : '8px'} !important;
        line-height: 1.1 !important;
        text-align: center !important;
        vertical-align: middle !important;
        box-sizing: border-box !important;
      }
      #higher-primary-page2-pdf-staging-portal select,
      #higher-primary-page2-pdf-staging-portal .cce-screen-input {
        display: none !important;
      }
      #higher-primary-page2-pdf-staging-portal .cce-pdf-text {
        display: block !important;
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

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
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
                node.classList.contains('hp-page2-preview-bar') ||
                node.classList.contains('hp-page2-no-print')
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
 * Dedicated HTML Exporter for Higher Primary CCE Page 2
 */
export const exportHigherPrimaryCcePage2Html = (
  element: HTMLElement,
  filename: string,
  paperSize: ReportPaperSize = 'legal'
): boolean => {
  return downloadElementAsHtml(element, filename, paperSize, 'landscape');
};
