import jsPDF from 'jspdf';
import {
  REPORT_PAPER_SIZES,
  ReportPaperSize,
  captureCleanReportCanvas,
  openCleanPrintWindow,
  printElementViaIframe,
} from './printPdfHelper';

/**
 * ============================================================================
 * REPORT-SPECIFIC PAGE PRINT & PDF EXPORT HELPERS
 * ============================================================================
 * Every Karnataka School CCE report has a unique column structure and density:
 * - Primary Page 2: 22 Columns (4 Subjects x 2 cols + Details + Part B + Totals)
 * - Primary Page 4: 18+ Columns with 9 Sub-Rows per Student (FA1-Grand Total)
 * - Higher Primary Page 2: 28-30 Columns (7 Subjects x 2 cols + 9 Sub-Rows)
 * - Higher Primary Page 3: 24-26 Columns (6-7 Subjects 100 Marks)
 * - Marathi/Urdu Page 2: 24 Columns (5 Subjects 100 Marks)
 * - Marathi/Urdu Page 4: 20+ Columns (5 Subjects Detailed)
 * - Consolidated Annual Broadsheets: Broad tabular summary
 * - Page 5 Class Abstract: Matrix distribution
 *
 * Each helper below provides:
 * 1. Dedicated print CSS tailored to that exact column count & layout
 * 2. Dedicated PDF exporter with zero left margin (0mm) and strict page-width clamping
 *    preventing any right-side cutoff on both A4 (297mm) and Legal (355.6mm)
 * ============================================================================
 */

/**
 * Universal Core Runner for Isolated Print with Report-Specific Custom CSS
 */
export const executeCustomReportPrint = async (
  element: HTMLElement,
  title: string = 'Karnataka School Report',
  paperSize: ReportPaperSize = 'legal',
  customCss: string = '',
  orientation: 'portrait' | 'landscape' = 'landscape'
): Promise<boolean> => {
  try {
    const prevTitle = document.title;
    document.title = title;

    // Remove any stale portal from previous invocations
    const stalePortal = document.getElementById('cce-isolated-print-portal');
    if (stalePortal) {
      stalePortal.remove();
    }

    const portal = document.createElement('div');
    portal.id = 'cce-isolated-print-portal';
    portal.setAttribute('data-paper-size', paperSize);
    portal.setAttribute('data-orientation', orientation);

    // Deep clone the report element
    const clone = element.cloneNode(true) as HTMLElement;

    // Strip unneeded UI controls in print clone
    clone
      .querySelectorAll('.print\\:hidden, .cce-print-hidden, button, select, input[type="button"]')
      .forEach((el) => {
        if (el.tagName === 'SELECT') {
          const sel = el as HTMLSelectElement;
          const text = sel.options[sel.selectedIndex]?.text || sel.value;
          const span = document.createElement('span');
          span.className = 'font-bold text-center block w-full';
          span.textContent = text;
          el.parentNode?.replaceChild(span, el);
        } else {
          el.remove();
        }
      });

    // Sync live inputs from DOM to clone as clean text spans
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

    const pageStyle = document.createElement('style');
    pageStyle.textContent = `
      @page {
        size: ${paperSize === 'a4' ? 'A4' : 'legal'} ${orientation};
        margin: 5mm 2mm 5mm 0mm !important;
      }
      #cce-isolated-print-portal {
        display: block !important;
        position: relative !important;
        width: 100% !important;
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      #cce-isolated-print-portal .report-page-sheet {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        page-break-after: always !important;
        break-after: page !important;
        background: #ffffff !important;
        color: #000000 !important;
      }
      #cce-isolated-print-portal .report-page-sheet:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
      #cce-isolated-print-portal .cce-sheet-container {
        padding-left: 0 !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      #cce-isolated-print-portal table {
        width: 100% !important;
        max-width: 100% !important;
        table-layout: fixed !important;
        box-sizing: border-box !important;
        border-collapse: collapse !important;
      }
      ${customCss}
    `;
    portal.appendChild(pageStyle);
    portal.appendChild(clone);
    document.body.appendChild(portal);

    document.body.classList.add('cce-print-mode-active');

    const cleanup = () => {
      document.body.classList.remove('cce-print-mode-active');
      if (document.body.contains(portal)) {
        portal.remove();
      }
      document.title = prevTitle;
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    await new Promise((resolve) => setTimeout(resolve, 80));

    window.focus();
    window.print();

    setTimeout(cleanup, 2500);
    return true;
  } catch (err) {
    console.warn('executeCustomReportPrint fallback to iframe:', err);
    try {
      const printed = await printElementViaIframe(element, title, paperSize, orientation);
      if (printed) return true;
    } catch (_) {}
    return openCleanPrintWindow(element, title, paperSize, orientation);
  }
};

/**
 * Universal Core PDF Exporter with Zero Left Margin & Exact Page Bounds Clamping
 */
export const executeCustomReportPdf = async (
  element: HTMLElement,
  filename: string,
  paperSize: ReportPaperSize = 'legal',
  extraScaleFactor: number = 1.0
): Promise<boolean> => {
  const chosenSize = REPORT_PAPER_SIZES[paperSize] || REPORT_PAPER_SIZES.legal;
  const pdfFormat: [number, number] = [chosenSize.widthMm, chosenSize.heightMm];

  const pageSheets = element.classList.contains('report-page-sheet')
    ? [element]
    : Array.from(element.querySelectorAll<HTMLElement>('.report-page-sheet'));

  if (pageSheets.length > 0) {
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
          const capturedSheet = await captureCleanReportCanvas(sheet);
          if (!capturedSheet) continue;
          if (renderedAny) {
            pdf.addPage(pdfFormat, 'landscape');
          }

          // Exact page bounds fit starting at 0mm left margin
          const scale =
            Math.min(
              pageWidth / (capturedSheet.width || 1),
              pageHeight / (capturedSheet.height || 1)
            ) * extraScaleFactor;
          const renderW = Math.min(pageWidth, capturedSheet.width * scale);
          const renderH = Math.min(pageHeight, capturedSheet.height * scale);
          const offsetX = 0; // Exactly 0mm left margin
          const offsetY = Math.max(0, (pageHeight - renderH) / 2);

          pdf.addImage(capturedSheet.dataUrl, 'PNG', offsetX, offsetY, renderW, renderH, undefined, 'FAST');
          renderedAny = true;
        } catch (sheetErr) {
          console.warn(`Error capturing sheet ${sIdx + 1}:`, sheetErr);
        }
      }
    } finally {
      element.classList.remove('cce-pdf-mode');
      pageSheets.forEach((s) => s.classList.remove('cce-pdf-mode'));
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
  }

  // Single-element fallback
  const captured = await captureCleanReportCanvas(element);
  if (!captured) return false;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: pdfFormat,
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const scale =
    Math.min(pageWidth / (captured.width || 1), pageHeight / (captured.height || 1)) * extraScaleFactor;
  const renderW = Math.min(pageWidth, captured.width * scale);
  const renderH = Math.min(pageHeight, captured.height * scale);
  const offsetX = 0;
  const offsetY = Math.max(0, (pageHeight - renderH) / 2);

  pdf.addImage(captured.dataUrl, 'PNG', offsetX, offsetY, renderW, renderH, undefined, 'FAST');
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  pdf.save(cleanFilename);
  return true;
};

// ============================================================================
// 1. PRIMARY CCE PAGE 2 (100 MARKS 22-COLUMN REGISTER)
// ============================================================================
export {
  printPrimaryCcePage2Register,
  exportPrimaryCcePage2Pdf,
  exportPrimaryCcePage2Html,
} from './report_layouts/group1_kannada_english/kannadaEnglishPage2LayoutHelper';

// ============================================================================
// 2. PRIMARY CCE PAGE 4 (DETAILED 400 MARKS REGISTER - 9 SUB-ROWS, 24 COLS)
// ============================================================================
export {
  printPrimaryCcePage4Detailed,
  exportPrimaryCcePage4Pdf,
  exportPrimaryCcePage4Html,
} from './report_layouts/group1_kannada_english/kannadaEnglishPage4LayoutHelper';

// ============================================================================
// 3. HIGHER PRIMARY CCE PAGE 2 (9-LINE CONSOLIDATION - 28-30 COLS, 7 SUBJECTS)
// ============================================================================
/**
 * Dedicated Print Helper for Higher Primary CCE Page 2 (9-Line Consolidation Register)
 * Highest column count (28-30 columns) requiring ultra-compact cell padding & font size.
 */
export const printHpCcePage2_9Line = async (
  element: HTMLElement,
  title: string = 'Higher Primary 9-Line Consolidation Register',
  paperSize: ReportPaperSize = 'legal'
): Promise<boolean> => {
  const isA4 = paperSize === 'a4';
  const customCss = `
    /* Ultra-compact 28-30 Column Rules for Higher Primary 9-Line Register */
    @page {
      size: ${isA4 ? 'A4' : 'legal'} landscape;
      margin: 4mm 1mm 4mm 0mm !important;
    }
    #cce-isolated-print-portal .cce-9line-sheet table {
      width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      border: 1.5px solid #000000 !important;
    }
    #cce-isolated-print-portal .cce-9line-sheet th,
    #cce-isolated-print-portal .cce-9line-sheet td {
      padding: ${isA4 ? '0.25px 0.5px' : '0.5px 1px'} !important;
      font-size: ${isA4 ? '7px' : '8px'} !important;
      line-height: 1.05 !important;
      border: 1px solid #000000 !important;
      box-sizing: border-box !important;
    }
    #cce-isolated-print-portal .cce-v-header,
    #cce-isolated-print-portal [style*="vertical-rl"] {
      font-size: ${isA4 ? '6.5px' : '7.5px'} !important;
      line-height: 1 !important;
      white-space: nowrap !important;
    }
    #cce-isolated-print-portal .student-tbody {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  `;
  return executeCustomReportPrint(element, title, paperSize, customCss, 'landscape');
};

/**
 * Dedicated PDF Exporter for Higher Primary CCE Page 2 (9-Line Consolidation Register)
 */
export const exportHpCcePage2_9LinePdf = async (
  element: HTMLElement,
  filename: string,
  paperSize: ReportPaperSize = 'legal'
): Promise<boolean> => {
  return executeCustomReportPdf(element, filename, paperSize, 1.0);
};

// ============================================================================
// 4. HIGHER PRIMARY CCE PAGE 3 (100 MARKS REGISTER - 24-26 COLS, 6-7 SUBJECTS)
// ============================================================================
/**
 * Dedicated Print Helper for Higher Primary CCE Page 3 (100 Marks Register)
 */
export const printHpCcePage3Register = async (
  element: HTMLElement,
  title: string = 'Higher Primary 100 Marks Consolidation Register',
  paperSize: ReportPaperSize = 'legal'
): Promise<boolean> => {
  const isA4 = paperSize === 'a4';
  const customCss = `
    /* 24-26 Column Rules for Higher Primary 100 Marks */
    #cce-isolated-print-portal table {
      width: 100% !important;
      table-layout: fixed !important;
      border: 1.5px solid #000000 !important;
    }
    #cce-isolated-print-portal th,
    #cce-isolated-print-portal td {
      padding: ${isA4 ? '1px 1.5px' : '1.5px 2.5px'} !important;
      font-size: ${isA4 ? '8px' : '9px'} !important;
      line-height: 1.15 !important;
      border: 1px solid #000000 !important;
    }
    #cce-isolated-print-portal th {
      font-weight: 800 !important;
      background-color: #f1f5f9 !important;
    }
  `;
  return executeCustomReportPrint(element, title, paperSize, customCss, 'landscape');
};

/**
 * Dedicated PDF Exporter for Higher Primary CCE Page 3 (100 Marks Register)
 */
export const exportHpCcePage3RegisterPdf = async (
  element: HTMLElement,
  filename: string,
  paperSize: ReportPaperSize = 'legal'
): Promise<boolean> => {
  return executeCustomReportPdf(element, filename, paperSize, 1.0);
};

// ============================================================================
// 5. MARATHI / URDU CCE PAGE 2 (500 MARKS REGISTER - 24 COLS, 5 SUBJECTS)
// ============================================================================
/**
 * Dedicated Print Helper for Marathi/Urdu CCE Page 2 (500 Marks Register)
 */
export const printMarathiUrduCcePage2 = async (
  element: HTMLElement,
  title: string = 'Marathi/Urdu CCE Page 2 500 Marks Register',
  paperSize: ReportPaperSize = 'legal'
): Promise<boolean> => {
  const isA4 = paperSize === 'a4';
  const customCss = `
    /* Multilingual Font and 24-column layout */
    #cce-isolated-print-portal th,
    #cce-isolated-print-portal td {
      padding: ${isA4 ? '1px 2px' : '2px 2.5px'} !important;
      font-size: ${isA4 ? '8px' : '9px'} !important;
      line-height: 1.15 !important;
      border: 1px solid #000000 !important;
    }
    #cce-isolated-print-portal table {
      width: 100% !important;
      table-layout: fixed !important;
      border: 1.5px solid #000000 !important;
    }
  `;
  return executeCustomReportPrint(element, title, paperSize, customCss, 'landscape');
};

/**
 * Dedicated PDF Exporter for Marathi/Urdu CCE Page 2 (500 Marks Register)
 */
export const exportMarathiUrduCcePage2Pdf = async (
  element: HTMLElement,
  filename: string,
  paperSize: ReportPaperSize = 'legal'
): Promise<boolean> => {
  return executeCustomReportPdf(element, filename, paperSize, 1.0);
};

// ============================================================================
// 6. MARATHI / URDU CCE PAGE 4 (500 MARKS DETAILED 9-LINE REGISTER)
// ============================================================================
export {
  printMarathiUrduCcePage4Detailed as printMarathiUrduCcePage4,
  exportMarathiUrduCcePage4DetailedPdf as exportMarathiUrduCcePage4Pdf,
  exportMarathiUrduCcePage4DetailedHtml,
} from './report_layouts/group2_marathi_urdu/marathiUrduPage4LayoutHelper';

// ============================================================================
// 7. CONSOLIDATED ANNUAL RESULT BROADSHEET MODAL
// ============================================================================
/**
 * Dedicated Print Helper for Consolidated Annual Result Modal
 */
export const printConsolidatedReport = async (
  element: HTMLElement,
  title: string = 'Annual Result Broadsheet',
  paperSize: ReportPaperSize = 'legal'
): Promise<boolean> => {
  const isA4 = paperSize === 'a4';
  const customCss = `
    #cce-isolated-print-portal th,
    #cce-isolated-print-portal td {
      padding: ${isA4 ? '1.5px 2px' : '2px 3px'} !important;
      font-size: ${isA4 ? '8px' : '9px'} !important;
      border: 1px solid #000000 !important;
    }
    #cce-isolated-print-portal table {
      width: 100% !important;
      table-layout: fixed !important;
    }
  `;
  return executeCustomReportPrint(element, title, paperSize, customCss, 'landscape');
};

/**
 * Dedicated PDF Exporter for Consolidated Annual Result Modal
 */
export const exportConsolidatedReportPdf = async (
  element: HTMLElement,
  filename: string,
  paperSize: ReportPaperSize = 'legal'
): Promise<boolean> => {
  return executeCustomReportPdf(element, filename, paperSize, 1.0);
};

// ============================================================================
// 8. PAGE 5 CLASS ABSTRACT / GRADE MATRIX
// ============================================================================
/**
 * Dedicated Print Helper for Class Abstract & Grade Matrix (Portrait or Landscape)
 */
export const printClassAbstractReport = async (
  element: HTMLElement,
  title: string = 'Class Abstract & Grade Consolidation',
  paperSize: ReportPaperSize = 'legal',
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<boolean> => {
  const customCss = `
    #cce-isolated-print-portal th,
    #cce-isolated-print-portal td {
      padding: 2px 3px !important;
      font-size: 8.5px !important;
      border: 1px solid #000000 !important;
    }
    #cce-isolated-print-portal table {
      width: 100% !important;
      table-layout: fixed !important;
    }
  `;
  return executeCustomReportPrint(element, title, paperSize, customCss, orientation);
};

/**
 * Dedicated PDF Exporter for Class Abstract & Grade Matrix
 */
export const exportClassAbstractPdf = async (
  element: HTMLElement,
  filename: string,
  paperSize: ReportPaperSize = 'legal',
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<boolean> => {
  return executeCustomReportPdf(element, filename, paperSize, 1.0);
};
