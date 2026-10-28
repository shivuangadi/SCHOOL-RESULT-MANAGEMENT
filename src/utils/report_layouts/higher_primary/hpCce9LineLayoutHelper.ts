import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import type { ReportPaperSize } from '../../printPdfHelper';
import {
  REPORT_PAPER_SIZES,
  printElementViaIframe,
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
 * DEDICATED LAYOUT & EXPORT HELPER FOR 9-LINE CONSOLIDATION REPORT
 * (9 ಸಾಲುಗಳ ವಾರ್ಷಿಕ ಫಲಿತಾಂಶ ಕ್ರೋಢೀಕರಣ ವಹಿ - 36 Columns, 3 Students/Page)
 * ============================================================================
 * Key Requirements:
 * 1. Isolated print preview portal (#hp-9line-isolated-portal) with dedicated bar
 * 2. Dedicated green "Download PDF" button in preview that mirrors the working purple button
 *    (always captures from clean staging portal, preventing double margin and column cutoff)
 * 3. Blue "Print Dialog" button that reliably triggers system print with iframe fallback
 * 4. 20mm (2.0cm) left margin for file binding, fitting all 36 columns on Legal landscape
 * ============================================================================
 */

export const printHpCce9LineReport = async (
  element: HTMLElement,
  title: string = 'Higher_Primary_CCE_9Line_Consolidation',
  paperSize: ReportPaperSize = 'legal'
): Promise<boolean> => {
  try {
    const prevTitle = document.title;
    document.title = title;

    // Remove any leftover portal
    const existing = document.getElementById('hp-9line-isolated-portal');
    if (existing) existing.remove();

    // Deep clone the report element
    const clone = element.cloneNode(true) as HTMLElement;

    // Remove non-printable elements
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
    const originalInputs = element.querySelectorAll<HTMLInputElement>(
      'input:not([type="button"]):not([type="submit"])'
    );
    const clonedInputs = clone.querySelectorAll<HTMLInputElement>(
      'input:not([type="button"]):not([type="submit"])'
    );
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
    const pageWidth = isA4 ? 297 : 355.6;
    const leftMarginMm = isA4 ? '18mm' : '20mm'; // 2.0cm left margin for binding

    // Scoped CSS for 9-line print preview
    const pageStyle = document.createElement('style');
    pageStyle.textContent = `
      @page {
        size: ${isA4 ? 'A4' : 'legal'} landscape !important;
        margin: 0 !important;
      }

      body.hp-9line-print-active {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      body.hp-9line-print-active > *:not(#hp-9line-isolated-portal) {
        display: none !important;
      }

      #hp-9line-isolated-portal {
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

      #hp-9line-isolated-portal .report-page-sheet {
        margin: 18px auto !important;
        padding-left: ${leftMarginMm} !important;
        padding-right: 6.5mm !important;
        padding-top: 6.5mm !important;
        padding-bottom: 6.5mm !important;
        width: ${pageWidth}mm !important;
        min-width: ${pageWidth}mm !important;
        max-width: ${pageWidth}mm !important;
        box-sizing: border-box !important;
        background: #ffffff !important;
        height: auto !important;
        min-height: 0 !important;
        break-after: page !important;
        page-break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15) !important;
        border: 1px solid #cbd5e1 !important;
        overflow: visible !important;
      }

      #hp-9line-isolated-portal .report-page-sheet:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }

      #hp-9line-isolated-portal table {
        width: 100% !important;
        max-width: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        border: 2px solid #000000 !important;
        background: #ffffff !important;
        color: #000000 !important;
      }

      #hp-9line-isolated-portal th,
      #hp-9line-isolated-portal td {
        border: 1px solid #000000 !important;
        line-height: 1.1 !important;
        text-align: center !important;
        vertical-align: middle !important;
        box-sizing: border-box !important;
      }

      #hp-9line-isolated-portal .student-tbody tr {
        height: 5.36mm !important;
        min-height: 5.36mm !important;
        max-height: 5.36mm !important;
        box-sizing: border-box !important;
      }

      #hp-9line-isolated-portal td.double-bottom-border,
      #hp-9line-isolated-portal tr.double-bottom-border td {
        border-bottom: 2px double #000000 !important;
      }

      @media print {
        #hp-9line-isolated-portal .report-page-sheet {
          margin: 0 !important;
          border: none !important;
          box-shadow: none !important;
        }
        .hp-9line-preview-bar,
        .hp-9line-no-print {
          display: none !important;
        }
        select, .cce-screen-input {
          display: none !important;
        }
        .cce-pdf-text {
          display: block !important;
        }
      }

      /* Guarantee 36th Column (RESULT) is completely visible */
      #hp-9line-isolated-portal th:last-child,
      #hp-9line-isolated-portal td:last-child {
        display: table-cell !important;
        visibility: visible !important;
        white-space: normal !important;
        font-weight: 900 !important;
      }
    `;

    // 1. Dedicated Interactive Preview Bar
    const previewBar = document.createElement('div');
    previewBar.className = 'hp-9line-preview-bar hp-9line-no-print';
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
    returnBtn.id = 'hp-9line-return-btn';
    returnBtn.innerHTML = '&#8592; Return to Report (ವರದಿಗೆ ಹಿಂತಿರುಗಿ)';
    returnBtn.title = 'Close print preview and return to report editor (or press Esc)';
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
    titleSpan.textContent = `Print Ready (${paperSize.toUpperCase()} Landscape - 9-Line 36 Cols)`;

    const hintSpan = document.createElement('span');
    hintSpan.style.cssText = 'font-size: 11px; color: #94a3b8;';
    hintSpan.textContent = '(Press [Esc] to exit)';

    leftGroup.appendChild(returnBtn);
    leftGroup.appendChild(titleSpan);
    leftGroup.appendChild(hintSpan);

    const rightGroup = document.createElement('div');
    rightGroup.style.cssText = 'display: flex; align-items: center; gap: 10px;';

    // WhatsApp Share button
    const waBtn = document.createElement('button');
    waBtn.type = 'button';
    waBtn.id = 'hp-9line-wa-btn';
    waBtn.innerHTML = '&#128242; WhatsApp Share';
    waBtn.title = 'Share report image to WhatsApp';
    waBtn.style.cssText = `
      background: #16a34a;
      color: #ffffff;
      border: 1px solid #15803d;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    `;
    waBtn.onclick = async () => {
      waBtn.disabled = true;
      const prevHtml = waBtn.innerHTML;
      waBtn.innerHTML = '&#9203; Preparing Images...';
      try {
        // Temporarily reveal normal DOM so staging portal can capture cleanly
        document.body.classList.remove('hp-9line-print-active');
        portal.style.display = 'none';

        const cleanTitle = title || 'Higher_Primary_CCE_9Line_Consolidation';
        const summary = `*${cleanTitle}*\n*Classes 6-8 9-Line Consolidation Register (9 ಸಾಲಿನ ಕ್ರೋಢೀಕೃತ ವರದಿ)*\nAcademic Year: 2026-27`;
        await share9LineViaCleanStaging(element, summary, cleanTitle.replace(/\s+/g, '_'), paperSize);
      } catch (err) {
        console.error('WhatsApp error from preview bar:', err);
      } finally {
        portal.style.display = 'block';
        document.body.classList.add('hp-9line-print-active');
        waBtn.disabled = false;
        waBtn.innerHTML = prevHtml;
      }
    };

    // Dedicated Green Download PDF button - Calls exportHpCce9LinePdf with 100% fidelity
    const pdfBtn = document.createElement('button');
    pdfBtn.type = 'button';
    pdfBtn.id = 'hp-9line-bar-pdf-btn';
    pdfBtn.innerHTML = '&#128196; Download PDF';
    pdfBtn.title = 'Download exact print-ready PDF file (36 columns, 2cm left margin)';
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
        // Temporarily reveal staging portal by lifting hp-9line-print-active
        document.body.classList.remove('hp-9line-print-active');
        portal.style.display = 'none';

        const cleanFilename = `${(title || 'Higher_Primary_CCE_9Line_Consolidation').replace(/\s+/g, '_')}.pdf`;
        await exportHpCce9LinePdf(element, cleanFilename, paperSize);
      } catch (err) {
        console.error('Error downloading PDF from 9-line preview bar:', err);
      } finally {
        portal.style.display = 'block';
        document.body.classList.add('hp-9line-print-active');
        pdfBtn.disabled = false;
        pdfBtn.innerHTML = prevHtml;
      }
    };


    // Dedicated Blue Print Dialog button - Opens native system print dialog with fallbacks
    const printBtn = document.createElement('button');
    printBtn.type = 'button';
    printBtn.id = 'hp-9line-reprint-btn';
    printBtn.innerHTML = '&#128438; Print Dialog';
    printBtn.style.cssText = `
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

    const triggerSystemPrint = async () => {
      printBtn.disabled = true;
      const prevText = printBtn.innerHTML;
      printBtn.innerHTML = '&#9203; Printing...';
      try {
        await printElementViaIframe(clone, title, paperSize, 'landscape');
      } catch (err) {
        console.warn('iframe print failed, falling back to direct print:', err);
        try {
          window.focus();
          window.print();
        } catch (_) {}
      } finally {
        printBtn.disabled = false;
        printBtn.innerHTML = prevText;
      }
    };

    printBtn.onclick = triggerSystemPrint;

    rightGroup.appendChild(waBtn);
    rightGroup.appendChild(pdfBtn);
    rightGroup.appendChild(printBtn);

    previewBar.appendChild(leftGroup);
    previewBar.appendChild(rightGroup);

    // 2. Assemble isolated portal container
    const portal = document.createElement('div');
    portal.id = 'hp-9line-isolated-portal';
    portal.appendChild(pageStyle);
    portal.appendChild(previewBar);

    // Wrapper for report content
    const contentWrapper = document.createElement('div');
    contentWrapper.id = 'hp-9line-print-content';
    contentWrapper.appendChild(clone);
    portal.appendChild(contentWrapper);

    // Attach to document.body
    document.body.appendChild(portal);
    document.body.classList.add('hp-9line-print-active');

    // Cleanup function
    const cleanup = () => {
      document.body.classList.remove('hp-9line-print-active');
      const p = document.getElementById('hp-9line-isolated-portal');
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

    return true;
  } catch (err) {
    console.error('printHpCce9LineReport error, using fallback:', err);
    try {
      const printed = await printElementViaIframe(element, title, paperSize, 'landscape');
      if (printed) return true;
    } catch (_) {}
    return false;
  }
};

/**
 * Dedicated Multi-Page PDF Exporter for 9-Line Consolidation Report
 * (Ensures 20mm left margin, fits all 36 columns on Legal landscape with ZERO right overflow)
 */
export const exportHpCce9LinePdf = async (
  element: HTMLElement,
  filename: string = 'Higher_Primary_CCE_9Line_Consolidation.pdf',
  paperSize: ReportPaperSize = 'legal'
): Promise<boolean> => {
  const chosenSize = REPORT_PAPER_SIZES[paperSize] || REPORT_PAPER_SIZES.legal;
  const pageWidth = chosenSize.widthMm;
  const pageHeight = chosenSize.heightMm;
  const pdfFormat: [number, number] = [pageWidth, pageHeight];
  const isA4 = paperSize === 'a4';
  const leftMarginMm = isA4 ? '18mm' : '20mm'; // Exactly 2.0cm left margin for binding

  // ALWAYS create a pristine, isolated staging portal
  // (Prevents inheriting preview styles or double-padding traps)
  const stagingPortal = document.createElement('div');
  stagingPortal.id = 'hp-9line-pdf-staging-portal';
  stagingPortal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: ${pageWidth}mm;
    min-width: ${pageWidth}mm;
    max-width: ${pageWidth}mm;
    background: #ffffff;
    opacity: 0.01;
    pointer-events: none;
    z-index: -9999;
    overflow: hidden;
  `;

  const stagingStyle = document.createElement('style');
  stagingStyle.textContent = `
    ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
    * { scrollbar-width: none !important; -ms-overflow-style: none !important; }

    #hp-9line-pdf-staging-portal {
      background: #ffffff !important;
      color: #000000 !important;
      font-family: 'Anek Kannada', 'Noto Sans Kannada', system-ui, sans-serif !important;
      overflow: hidden !important;
    }
    #hp-9line-pdf-staging-portal .report-page-sheet {
      margin: 0 !important;
      padding-left: ${leftMarginMm} !important;
      padding-right: 6.5mm !important;
      padding-top: 6.5mm !important;
      padding-bottom: 6.5mm !important;
      width: ${pageWidth}mm !important;
      height: auto !important;
      min-height: 0 !important;
      max-width: ${pageWidth}mm !important;
      box-sizing: border-box !important;
      background: #ffffff !important;
      box-shadow: none !important;
      border: none !important;
      overflow: hidden !important;
    }
    #hp-9line-pdf-staging-portal table {
      width: 100% !important;
      max-width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      border: 2px solid #000000 !important;
      background: #ffffff !important;
      color: #000000 !important;
    }
    #hp-9line-pdf-staging-portal th,
    #hp-9line-pdf-staging-portal td {
      border: 1px solid #000000 !important;
      padding: 0.5px !important;
      line-height: 1.1 !important;
      text-align: center !important;
      vertical-align: middle !important;
      box-sizing: border-box !important;
      color: #000000 !important;
    }
    #hp-9line-pdf-staging-portal .student-tbody tr {
      height: 5.36mm !important;
      min-height: 5.36mm !important;
      max-height: 5.36mm !important;
      box-sizing: border-box !important;
    }
    #hp-9line-pdf-staging-portal td.double-bottom-border,
    #hp-9line-pdf-staging-portal tr.double-bottom-border td {
      border-bottom: 2px double #000000 !important;
    }
    #hp-9line-pdf-staging-portal select,
    #hp-9line-pdf-staging-portal .cce-screen-input {
      display: none !important;
    }
    #hp-9line-pdf-staging-portal .cce-pdf-text {
      display: block !important;
      text-align: center !important;
      color: #000000 !important;
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
  const originalInputs = element.querySelectorAll<HTMLInputElement>(
    'input:not([type="button"]):not([type="submit"])'
  );
  const clonedInputs = clone.querySelectorAll<HTMLInputElement>(
    'input:not([type="button"]):not([type="submit"])'
  );
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

  await new Promise((res) => setTimeout(res, 60));

  const pageSheets = Array.from(
    stagingPortal.querySelectorAll<HTMLElement>('.report-page-sheet')
  );

  if (pageSheets.length === 0) {
    stagingPortal.remove();
    return false;
  }

  stagingPortal.classList.add('cce-pdf-mode');
  pageSheets.forEach((s) => s.classList.add('cce-pdf-mode'));

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: pdfFormat,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  let renderedAny = false;

  try {
    for (let sIdx = 0; sIdx < pageSheets.length; sIdx++) {
      const sheet = pageSheets[sIdx];
      try {
        const dataUrl = await toPng(sheet, {
          quality: 0.98,
          pixelRatio: Math.min(window.devicePixelRatio || 2, 2.5),
          backgroundColor: '#ffffff',
          cacheBust: false,
          skipFonts: true,
          fontEmbedCSS: '',
          filter: (node: Node) => {
            if (node instanceof HTMLElement) {
              if (
                node.classList.contains('cce-print-hidden') ||
                node.classList.contains('print:hidden') ||
                node.classList.contains('hp-9line-preview-bar') ||
                node.classList.contains('hp-9line-no-print')
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

        // Full page width and height fit, starting exactly at x = 0
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        renderedAny = true;
      } catch (sheetErr) {
        console.warn(`Error capturing 9-line sheet ${sIdx + 1}:`, sheetErr);
      }
    }
  } finally {
    if (document.body.contains(stagingPortal)) {
      stagingPortal.remove();
    }
  }

  if (renderedAny) {
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    try {
      pdf.save(cleanFilename);
    } catch (_) {}
    try {
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = cleanFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (_) {}
    return true;
  }

  return false;
};

/**
 * Dedicated HTML Exporter for 9-Line Consolidation Report
 */
export const exportHpCce9LineHtml = (
  element: HTMLElement,
  filename: string = 'Higher_Primary_CCE_9Line_Consolidation',
  paperSize: ReportPaperSize = 'legal'
): void => {
  downloadElementAsHtml(element, filename, paperSize);
};

/**
 * Dedicated Multi-Page High-Res Image Generator for WhatsApp Sharing (9-Line Consolidation)
 * (Renders with balanced 5mm padding so ZERO rightward shift occurs and all 36 columns fit 100%)
 */
export const share9LineViaCleanStaging = async (
  element: HTMLElement,
  summary: string,
  filename: string = 'Higher_Primary_CCE_9Line',
  paperSize: ReportPaperSize = 'legal'
): Promise<boolean> => {
  const chosenSize = REPORT_PAPER_SIZES[paperSize] || REPORT_PAPER_SIZES.legal;
  const pageWidth = chosenSize.widthMm;

  const staging = document.createElement('div');
  staging.id = 'hp-9line-wa-staging';
  staging.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: ${pageWidth}mm;
    min-width: ${pageWidth}mm;
    max-width: ${pageWidth}mm;
    background: #ffffff;
    opacity: 0.01;
    pointer-events: none;
    z-index: -9999;
    overflow: hidden;
  `;

  const style = document.createElement('style');
  style.textContent = `
    ::-webkit-scrollbar { display: none !important; width: 0 !important; }
    * { scrollbar-width: none !important; }
    #hp-9line-wa-staging {
      background: #ffffff !important;
      color: #000000 !important;
      font-family: 'Anek Kannada', 'Noto Sans Kannada', system-ui, sans-serif !important;
      overflow: hidden !important;
    }
    #hp-9line-wa-staging .report-page-sheet {
      margin: 0 !important;
      padding-left: 5mm !important;
      padding-right: 5mm !important;
      padding-top: 5mm !important;
      padding-bottom: 5mm !important;
      width: ${pageWidth}mm !important;
      min-width: ${pageWidth}mm !important;
      max-width: ${pageWidth}mm !important;
      box-sizing: border-box !important;
      background: #ffffff !important;
      box-shadow: none !important;
      border: none !important;
      overflow: visible !important;
    }
    #hp-9line-wa-staging table {
      width: 100% !important;
      max-width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      border: 2px solid #000000 !important;
      background: #ffffff !important;
      color: #000000 !important;
    }
    #hp-9line-wa-staging th,
    #hp-9line-wa-staging td {
      border: 1px solid #000000 !important;
      padding: 0.5px !important;
      line-height: 1.1 !important;
      text-align: center !important;
      vertical-align: middle !important;
      box-sizing: border-box !important;
      color: #000000 !important;
    }
    #hp-9line-wa-staging .student-tbody tr {
      height: 5.36mm !important;
      min-height: 5.36mm !important;
      max-height: 5.36mm !important;
      box-sizing: border-box !important;
    }
    #hp-9line-wa-staging td.double-bottom-border,
    #hp-9line-wa-staging tr.double-bottom-border td {
      border-bottom: 2px double #000000 !important;
    }
    #hp-9line-wa-staging select,
    #hp-9line-wa-staging .cce-screen-input {
      display: none !important;
    }
    #hp-9line-wa-staging .cce-pdf-text {
      display: block !important;
      text-align: center !important;
      color: #000000 !important;
    }
    #hp-9line-wa-staging th:last-child,
    #hp-9line-wa-staging td:last-child {
      display: table-cell !important;
      visibility: visible !important;
      white-space: normal !important;
      font-weight: 900 !important;
    }
  `;

  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.cce-print-hidden, .print\\:hidden, button').forEach((b) => b.remove());

  clone.querySelectorAll('select').forEach((sel) => {
    const text = sel.options[sel.selectedIndex]?.text || sel.value || '-';
    const span = document.createElement('span');
    span.className = 'font-bold font-mono text-center block w-full text-black';
    span.textContent = text;
    sel.parentNode?.replaceChild(span, sel);
  });

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

  staging.appendChild(style);
  staging.appendChild(clone);
  document.body.appendChild(staging);

  await new Promise((res) => setTimeout(res, 60));

  const pageSheets = Array.from(staging.querySelectorAll<HTMLElement>('.report-page-sheet'));
  try {
    const cleanBase = filename.replace(/[^a-zA-Z0-9_\u0C80-\u0CFF]/g, '_');
    for (let idx = 0; idx < pageSheets.length; idx++) {
      const sheet = pageSheets[idx];
      const dataUrl = await toPng(sheet, {
        quality: 0.98,
        pixelRatio: 2.2,
        backgroundColor: '#ffffff',
        cacheBust: false,
        skipFonts: true,
        fontEmbedCSS: '',
      });

      const downloadFilename = pageSheets.length > 1 ? `${cleanBase}_Page_${idx + 1}.png` : `${cleanBase}.png`;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (idx < pageSheets.length - 1) {
        await new Promise((r) => setTimeout(r, 220));
      }
    }

    try {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(summary)}`, '_blank');
    } catch (_) {}
    return true;
  } finally {
    if (document.body.contains(staging)) {
      staging.remove();
    }
  }
};
