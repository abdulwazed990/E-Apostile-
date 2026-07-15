/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { Certificate } from '../types';

/**
 * Helper to convert standard date string (e.g. 2026-04-23) to DD-MMM-YYYY format (e.g. 23-Apr-2026)
 */
function formatDateToStandard(dateStr: string): string {
  try {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Helper to get digital signature date timestamp (e.g. 2026.04.23 11:07:55 +06:00)
 */
function getDigitalSignatureTimestamp(dateStr: string): string {
  try {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return `${dateStr} 11:07:55 +06:00`;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day} 11:07:55 +06:00`;
  } catch (e) {
    return `${dateStr} 11:07:55 +06:00`;
  }
}

/**
 * Draws the high-fidelity official Bangladesh e-Apostille on an HTML5 canvas.
 * Perfectly replicates the user-supplied format with exact layouts, custom watermark background,
 * and high-contrast styling.
 */
export async function renderCertificateToCanvas(
  canvas: HTMLCanvasElement,
  cert: Certificate,
  qrCodeUrl: string,
  verificationDomain?: string
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set standard high-fidelity A4 dimensional resolution for crisp output (Width: 1000px, Height: 1414px)
  canvas.width = 1000;
  canvas.height = 1414;

  const width = canvas.width;
  const height = canvas.height;

  // 1. Draw Clean White Solid Page
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 2. Beautiful Thin Border Framing
  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // 3. Load and Draw Custom Watermark Background centered
  const watermarkPromise = new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      ctx.save();
      ctx.globalAlpha = 0.05; // Extremely faint and light watermark as requested by user
      // Centered on the page with a size of 450x450
      ctx.drawImage(img, (width - 450) / 2, (height - 450) / 2, 450, 450);
      ctx.restore();
      resolve();
    };
    img.onerror = () => {
      // Fallback text watermark in case of network block
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.font = '900 36pt "Inter", sans-serif';
      ctx.fillStyle = 'rgba(0, 106, 78, 0.02)';
      ctx.textAlign = 'center';
      ctx.fillText('GOVERNMENT OF BANGLADESH', 0, 0);
      ctx.restore();
      resolve();
    };
    img.src = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSoO5Xk7jKpjqR_aQIlfTrPrSndqDAe7oqq9vQX4Q2SrQ&s=10";
  });

  await watermarkPromise;

  // 4. Header Title Block: "e-APOSTILLE"
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 25pt "Inter", sans-serif';
  ctx.fillText('e-APOSTILLE', width / 2, 120);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 12.5pt "Inter", sans-serif';
  ctx.fillText('(Convention de La Haye du 5 octobre 1961)', width / 2, 155);

  // Custom long subtitle note in italicized gray font
  ctx.fillStyle = '#475569';
  ctx.font = 'italic 10pt "Inter", sans-serif';
  const subtitlePart1 = '(Also valid for the countries that are not in reciprocal arrangement with Bangladesh under the';
  const subtitlePart2 = 'Apostille Convention of 1961, subject to proper legalisation)';
  ctx.fillText(subtitlePart1, width / 2, 190);
  ctx.fillText(subtitlePart2, width / 2, 212);

  // 5. "Issuing Authority" Header Label
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 17pt "Inter", sans-serif';
  ctx.fillText('Issuing Authority', width / 2, 280);

  // Subtle separator line below Issuing Authority
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(350, 295);
  ctx.lineTo(650, 295);
  ctx.stroke();

  // 6. Draw Numbered Lines 1 to 4 under Issuing Authority
  const colXLabel = 90;
  const colXValue = 350;
  let currentY = 345;
  const stepY = 46;

  // Custom renderer for Issuing Authority items
  const drawIssuingAuthorityLine = (num: string, label: string, val: string, isItalicLabel = false) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11pt "Inter", sans-serif';
    ctx.fillText(`${num}. ${label}`, colXLabel, currentY);

    ctx.font = 'bold 13.5pt "Inter", sans-serif'; // Extra Bold & Expanded size for high visibility
    ctx.fillText(val || 'N/A', colXValue, currentY);
    currentY += stepY;
  };

  // Special text node before 2
  const drawPublicDocumentSub = (text: string) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#475569';
    ctx.font = 'italic 11pt "Inter", sans-serif';
    ctx.fillText(text, colXLabel, currentY - 10);
    currentY += 28;
  };

  drawIssuingAuthorityLine('1', 'Country:', 'BANGLADESH');
  drawPublicDocumentSub('The public document');
  drawIssuingAuthorityLine('2', 'has been signed by:', cert.officerName || 'CONTROLLER OF THE EXAMINATION');
  drawIssuingAuthorityLine('3', 'acting in the capacity of:', cert.officerDesignation || 'Controller of the examination');
  drawIssuingAuthorityLine('4', 'bears the seal/stamp of:', cert.boardName || 'Higher & Secondary Education Board');

  // Separator
  currentY += 15;

  // 7. "Certified" Header Label
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 17pt "Inter", sans-serif';
  ctx.fillText('Certified', width / 2, currentY);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(350, currentY + 12);
  ctx.lineTo(650, currentY + 12);
  ctx.stroke();

  currentY += 60; // Advance past the header

  // Renderer for Certified items
  const drawCertifiedLine = (num: string, label: string, val: string) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11pt "Inter", sans-serif';
    ctx.fillText(`${num}. ${label}`, colXLabel, currentY);

    ctx.font = 'bold 13.5pt "Inter", sans-serif'; // Extra Bold & Expanded size for high visibility
    ctx.fillText(val || 'N/A', colXValue, currentY);
    currentY += stepY;
  };

  // Verifier official full line
  const verifierText = `MD. RASHID ABID, Assistant Secretary, Ministry of Foreign Affairs`;

  drawCertifiedLine('5', 'at:', 'Dhaka, Bangladesh');
  drawCertifiedLine('6', 'the:', formatDateToStandard(cert.issueDate));
  drawCertifiedLine('7', 'by:', verifierText);
  drawCertifiedLine('8', 'N°:', cert.id || '329257726343');

  // 8. Seal and Signature column (9 & 10)
  const columnsY = currentY + 15;
  const col9X = colXLabel;
  const col10X = width / 2 + 80;

  // Label 9 & 10
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11pt "Inter", sans-serif';
  ctx.fillText('9. Seal/stamp', col9X, columnsY);
  ctx.fillText('10. Signature', col10X, columnsY);

  // Load and Draw MoFA circular seal (under 9) - Keep empty by default so user can place it later
  const sealPromise = new Promise<void>((resolve) => {
    if (!cert.sealImageUrl || cert.sealImageUrl.includes('svg') || cert.sealImageUrl.includes('q=tbn:ANd9GcRWdacpfhGqope2aL72T9lkMz1LH4Mb6WDJUSN30VQy2jnxKHZ_AurUpVJv')) {
      resolve();
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      // Draw Circular Sticker/Stamp if a custom one is uploaded
      ctx.drawImage(img, col9X + 5, columnsY + 20, 115, 115);
      resolve();
    };
    img.onerror = () => {
      resolve();
    };
    img.src = cert.sealImageUrl;
  });

  // Load and Draw Officer Hand-Signature (under 10) - Keep space empty by default
  const sigPromise = new Promise<void>((resolve) => {
    if (!cert.signatureImageUrl || cert.signatureImageUrl.includes('svg') || cert.signatureImageUrl.includes('default') || cert.signatureImageUrl.length < 50) {
      resolve();
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      // Draw signature nicely on the right
      ctx.drawImage(img, col10X, columnsY + 20, 150, 60);
      resolve();
    };
    img.onerror = () => {
      resolve();
    };
    img.src = cert.signatureImageUrl;
  });

  await Promise.all([sealPromise, sigPromise]);

  // 9. Digital Signature Details (bottom left) & QR (bottom right)
  const footerBaseY = height - 250;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#334155';
  ctx.font = '600 10.5pt "Inter", sans-serif';
  
  // Verifier short name for digital signing text
  const signeeShortName = cert.attachedCertificates && cert.attachedCertificates.length > 0 && cert.attachedCertificates[0].attestations[0]
    ? cert.attachedCertificates[0].attestations[0].officerName
    : "MD. Rashid Abid";

  ctx.fillText(`Digitally signed by ${signeeShortName}`, colXLabel, footerBaseY);
  ctx.fillText(`Date: ${getDigitalSignatureTimestamp(cert.issueDate)}`, colXLabel, footerBaseY + 22);
  ctx.fillText('Reason: Document Signing', colXLabel, footerBaseY + 44);
  ctx.fillText('Location: Ministry of Foreign Affairs, Dhaka, BD', colXLabel, footerBaseY + 66);

  // Load and draw QR Code in the bottom right corner
  if (qrCodeUrl) {
    const qrPromise = new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        // Draw elegant QR code box matches perfectly the e-APOSTILLE layout
        const qrSize = 135;
        const qrLeft = width - colXLabel - qrSize;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrLeft - 5, footerBaseY - 5, qrSize + 10, qrSize + 10);
        ctx.drawImage(img, qrLeft, footerBaseY, qrSize, qrSize);
        resolve();
      };
      img.onerror = () => {
        resolve();
      };
      img.src = qrCodeUrl;
    });
    await qrPromise;
  }

  // 10. Document Footnotes strictly centered inside bottom of the page frame
  ctx.textAlign = 'left';
  ctx.fillStyle = '#475569';
  ctx.font = '500 8.5pt "Inter", sans-serif';
  ctx.fillText('* To see the Apostille documents, please scan the QR code', colXLabel, height - 85);
  const domainToShow = verificationDomain || 'mofa-servicedirectory.stage.mygov.bd';
  ctx.fillText(`* For verification of the e-Apostille, please visit: ${domainToShow}`, colXLabel, height - 65);
}

/**
 * Downloads the drawn certificate canvas as PDF
 */
export function downloadCanvasAsPdf(canvas: HTMLCanvasElement, filename: string) {
  const imgData = canvas.toDataURL('image/jpeg', 1.0);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Calculate coordinates relative to A4 page dimensions (210mm x 297mm)
  pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  pdf.save(filename);
}

/**
 * Downloads the drawn certificate canvas as JPEG
 */
export function downloadCanvasAsJpg(canvas: HTMLCanvasElement, filename: string) {
  const imgData = canvas.toDataURL('image/jpeg', 1.0);
  const link = document.createElement('a');
  link.href = imgData;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
