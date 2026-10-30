/**
 * ============================================================================
 * SRMS COVER PAGE DESIGNER - PDF EXPORT & PRINT HELPER
 * Supports:
 * - A4 Landscape (297 x 210 mm)
 * - Legal Landscape (355.6 x 215.9 mm)
 * - Margins: Left: 20mm (Binding), Right: 10mm, Top: 10mm, Bottom: 10mm
 * - Dual Direct Download: Full Colour PDF & High-Contrast Black & White PDF
 * ============================================================================
 */

import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';

export type CoverPaperSize = 'A4' | 'Legal';

export interface CoverPageDimensions {
  pageWidthMm: number;
  pageHeightMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  printableWidthMm: number;
  printableHeightMm: number;
}

export const COVER_PAGE_CONFIG: Record<CoverPaperSize, CoverPageDimensions> = {
  A4: {
    pageWidthMm: 297,
    pageHeightMm: 210,
    marginLeftMm: 20, // 20mm for binding
    marginRightMm: 10,
    marginTopMm: 10,
    marginBottomMm: 10,
    printableWidthMm: 267, // 297 - 20 - 10
    printableHeightMm: 190, // 210 - 10 - 10
  },
  Legal: {
    pageWidthMm: 355.6,
    pageHeightMm: 215.9,
    marginLeftMm: 20, // 20mm for binding
    marginRightMm: 10,
    marginTopMm: 10,
    marginBottomMm: 10,
    printableWidthMm: 325.6, // 355.6 - 20 - 10
    printableHeightMm: 195.9, // 215.9 - 10 - 10
  },
};

/**
 * Convert an HTML canvas to pure high-contrast grayscale/black & white
 */
const convertCanvasToBlackAndWhite = (sourceCanvas: HTMLCanvasElement): HTMLCanvasElement => {
  const bwCanvas = document.createElement('canvas');
  bwCanvas.width = sourceCanvas.width;
  bwCanvas.height = sourceCanvas.height;
  const ctx = bwCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, bwCanvas.width, bwCanvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Luminance formula
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Apply high-contrast curve for official photocopying
    let finalVal = gray;
    if (gray > 220) {
      finalVal = 255; // pure white background
    } else if (gray < 90) {
      finalVal = 0; // deep crisp black text & borders
    } else {
      // gentle contrast boost
      finalVal = gray * 0.85;
    }

    data[i] = finalVal;
    data[i + 1] = finalVal;
    data[i + 2] = finalVal;
    // keep alpha unchanged
  }

  ctx.putImageData(imgData, 0, 0);
  return bwCanvas;
};

/**
 * Capture high-resolution raster of cover page element
 * Uses html-to-image (toPng) as primary method to avoid Tailwind CSS v4 oklch() color issues.
 * Provides fallback to html2canvas with active oklch sanitization.
 */
export const captureCoverPageCanvas = async (
  element: HTMLElement,
  paperSize: CoverPaperSize = 'A4',
  isBlackAndWhite: boolean = false
): Promise<{ dataUrl: string; widthMm: number; heightMm: number } | null> => {
  const config = COVER_PAGE_CONFIG[paperSize] || COVER_PAGE_CONFIG.A4;

  // Exact pixel target at 96 DPI
  const targetPxWidth = Math.round(config.printableWidthMm * 3.7795275591);
  const targetPxHeight = Math.round(config.printableHeightMm * 3.7795275591);

  // Method 1: toPng via html-to-image (native browser engine, supports oklch without error)
  try {
    const pngDataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2.2,
      backgroundColor: '#ffffff',
      filter: (node: Node) => {
        if (node instanceof HTMLElement) {
          if (node.classList.contains('print:hidden') || node.tagName === 'BUTTON') {
            return false;
          }
        }
        return true;
      },
    });

    if (pngDataUrl) {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image decode error'));
        img.src = pngDataUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const finalCanvas = isBlackAndWhite ? convertCanvasToBlackAndWhite(canvas) : canvas;
        const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.95);
        return {
          dataUrl,
          widthMm: config.printableWidthMm,
          heightMm: config.printableHeightMm,
        };
      }
    }
  } catch (toPngErr) {
    console.warn('Cover page toPng capture failed, falling back to html2canvas with oklch sanitization:', toPngErr);
  }

  // Method 2: html2canvas fallback with active oklch sanitization
  const clone = element.cloneNode(true) as HTMLElement;
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '-99999px';
  container.style.width = `${targetPxWidth}px`;
  container.style.height = `${targetPxHeight}px`;
  container.style.overflow = 'hidden';
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '-9999';

  clone.style.width = `${targetPxWidth}px`;
  clone.style.height = `${targetPxHeight}px`;
  clone.style.boxSizing = 'border-box';
  clone.style.margin = '0';
  clone.style.transform = 'none';

  if (isBlackAndWhite) {
    clone.style.filter = 'grayscale(100%) contrast(110%)';
  }

  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    await new Promise((r) => setTimeout(r, 120));

    const renderedCanvas = await html2canvas(clone, {
      scale: 2.2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: targetPxWidth,
      height: targetPxHeight,
      windowWidth: targetPxWidth + 200,
      onclone: (clonedDoc: Document) => {
        // Replace any oklch() color occurrences in cloned document stylesheets and inline styles with hex fallback
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
    });

    let finalCanvas = renderedCanvas;
    if (isBlackAndWhite) {
      finalCanvas = convertCanvasToBlackAndWhite(renderedCanvas);
    }

    const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.95);
    return {
      dataUrl,
      widthMm: config.printableWidthMm,
      heightMm: config.printableHeightMm,
    };
  } catch (err) {
    console.error('Failed to capture cover page canvas in fallback:', err);
    return null;
  } finally {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Direct PDF File Generation and Download
 */
export const downloadCoverPagePdf = async (
  element: HTMLElement,
  filename: string,
  paperSize: CoverPaperSize = 'A4',
  isBlackAndWhite: boolean = false
): Promise<boolean> => {
  const config = COVER_PAGE_CONFIG[paperSize] || COVER_PAGE_CONFIG.A4;

  const captured = await captureCoverPageCanvas(element, paperSize, isBlackAndWhite);
  if (!captured) return false;

  // Initialize jsPDF in Landscape orientation
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: paperSize === 'Legal' ? [215.9, 355.6] : 'a4',
  });

  // Pure white page background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, config.pageWidthMm, config.pageHeightMm, 'F');

  // Place image adhering to exact margins: Left: 20mm, Top: 10mm
  pdf.addImage(
    captured.dataUrl,
    'JPEG',
    config.marginLeftMm,
    config.marginTopMm,
    captured.widthMm,
    captured.heightMm,
    undefined,
    'FAST'
  );

  // Directly trigger browser download
  pdf.save(filename);
  return true;
};

/**
 * Direct Browser Print Cover Page
 */
export const printCoverPage = (
  element: HTMLElement,
  paperSize: CoverPaperSize = 'A4'
): void => {
  const config = COVER_PAGE_CONFIG[paperSize] || COVER_PAGE_CONFIG.A4;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  const isLegal = paperSize === 'Legal';
  const pageSizeRule = isLegal ? 'legal landscape' : 'A4 landscape';

  const styles = `
    @page {
      size: ${pageSizeRule};
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      width: ${config.pageWidthMm}mm;
      height: ${config.pageHeightMm}mm;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Noto Sans Kannada', 'Tiro Kannada', Arial, sans-serif;
    }
    .print-sheet {
      width: ${config.pageWidthMm}mm;
      height: ${config.pageHeightMm}mm;
      padding-left: ${config.marginLeftMm}mm;
      padding-right: ${config.marginRightMm}mm;
      padding-top: ${config.marginTopMm}mm;
      padding-bottom: ${config.marginBottomMm}mm;
      box-sizing: border-box;
      background: #ffffff;
      display: flex;
      align-items: stretch;
      justify-content: stretch;
    }
    .print-sheet > * {
      width: 100% !important;
      height: 100% !important;
      box-sizing: border-box !important;
    }
  `;

  // Clone head styles from main window to keep fonts and Tailwind
  let headLinks = '';
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    headLinks += node.outerHTML;
  });

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SRMS Cover Page</title>
        ${headLinks}
        <style>${styles}</style>
      </head>
      <body>
        <div class="print-sheet">
          ${element.outerHTML}
        </div>
      </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 400);
};
