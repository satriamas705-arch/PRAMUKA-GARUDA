import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface PdfExportOptions {
  fileName: string;
  paperSize?: 'a4' | 'f4';
  orientation?: 'portrait' | 'landscape';
  onProgress?: (progress: number, stage: string) => void;
}

/**
 * Robust and crisp PDF exporter supporting Tailwind v4 (oklch colors),
 * multi-page slicing for large tables, and aspect-ratio preservation for official certificate sheets.
 */
export async function exportElementToPdf(
  elementIds: string[],
  options: PdfExportOptions
): Promise<void> {
  const { fileName, paperSize = 'a4', orientation = 'portrait', onProgress } = options;

  try {
    if (onProgress) onProgress(10, 'Menyiapkan berkas dokumen PDF...');

    // Paper dimensions in mm
    // A4: 210 x 297 mm
    // F4 / Folio: 215 x 330 mm
    const baseWidth = paperSize === 'f4' ? 215 : 210;
    const baseHeight = paperSize === 'f4' ? 330 : 297;

    const pdfWidth = orientation === 'landscape' ? baseHeight : baseWidth;
    const pdfHeight = orientation === 'landscape' ? baseWidth : baseHeight;

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: paperSize === 'f4' ? [pdfWidth, pdfHeight] : 'a4',
      compress: true,
    });

    let isFirstPdfPage = true;

    for (let i = 0; i < elementIds.length; i++) {
      const elId = elementIds[i];
      const element = document.getElementById(elId);

      if (!element) {
        console.warn(`Element with ID "${elId}" not found for PDF export`);
        continue;
      }

      if (onProgress) {
        onProgress(
          20 + Math.round((i / elementIds.length) * 55),
          `Merender lembar dokumen ${i + 1} dari ${elementIds.length}...`
        );
      }

      // Render element to high-res canvas with html2canvas-pro
      // scale: 2 for sharp print-quality typography without memory overflow
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
      });

      const margin = 6; // 6mm margin for clean printable area
      const maxContentWidth = pdfWidth - margin * 2;
      const maxContentHeight = pdfHeight - margin * 2;

      // Check if element is taller than a single page (e.g. collective recap table with many rows)
      const contentHeightIfFullWidth = (canvas.height * maxContentWidth) / canvas.width;

      if (contentHeightIfFullWidth > maxContentHeight * 1.05) {
        // Multi-page document: slice canvas vertically across pages
        const sliceCanvasHeight = (maxContentHeight / maxContentWidth) * canvas.width;
        let currentY = 0;

        while (currentY < canvas.height) {
          if (!isFirstPdfPage) {
            pdf.addPage(paperSize === 'f4' ? [pdfWidth, pdfHeight] : 'a4', orientation);
          }
          isFirstPdfPage = false;

          const remainingHeight = canvas.height - currentY;
          const currentChunkHeight = Math.min(sliceCanvasHeight, remainingHeight);

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = currentChunkHeight;
          const ctx = tempCanvas.getContext('2d');

          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            ctx.drawImage(
              canvas,
              0,
              currentY,
              canvas.width,
              currentChunkHeight,
              0,
              0,
              canvas.width,
              currentChunkHeight
            );

            const sliceImgData = tempCanvas.toDataURL('image/jpeg', 0.95);
            const renderedSliceHeight = (currentChunkHeight * maxContentWidth) / canvas.width;

            pdf.addImage(
              sliceImgData,
              'JPEG',
              margin,
              margin,
              maxContentWidth,
              renderedSliceHeight,
              undefined,
              'FAST'
            );
          }

          currentY += sliceCanvasHeight;
        }
      } else {
        // Single page document: fit cleanly preserving aspect ratio
        if (!isFirstPdfPage) {
          pdf.addPage(paperSize === 'f4' ? [pdfWidth, pdfHeight] : 'a4', orientation);
        }
        isFirstPdfPage = false;

        const imgRatio = canvas.width / canvas.height;
        let renderW = maxContentWidth;
        let renderH = maxContentWidth / imgRatio;

        if (renderH > maxContentHeight) {
          renderH = maxContentHeight;
          renderW = maxContentHeight * imgRatio;
        }

        const offsetX = margin + (maxContentWidth - renderW) / 2;
        const offsetY = margin + (maxContentHeight - renderH) / 2;

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', offsetX, offsetY, renderW, renderH, undefined, 'FAST');
      }
    }

    if (onProgress) onProgress(90, 'Menyusun berkas PDF...');
    pdf.save(fileName);

    if (onProgress) onProgress(100, 'Selesai! Berkas PDF berhasil diunduh.');
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  }
}
