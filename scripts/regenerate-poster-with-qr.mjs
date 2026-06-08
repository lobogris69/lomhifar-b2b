/**
 * Regenera 3 versiones del cartel promocional con el QR y URL incorporados:
 *
 *   1. cartel-lomhifar-default.pdf  → para imprimir (A4)
 *   2. cartel-lomhifar-default.png  → para compartir por WhatsApp/redes
 *                                     (se previsualiza en el chat)
 *   3. cartel-qr.png                → solo el QR + URL pequeño, para
 *                                     enviar suelto por WhatsApp/email
 *
 * IMPORTANTE: usa cartel-preview.png como ÚNICA fuente del diseño original.
 * Esa imagen es el cartel real que el cliente quiere mantener intacto.
 * Tanto el PDF como el PNG se generan a partir de ella + un footer
 * blanco con QR + URL. Así PDF y PNG son visualmente idénticos.
 *
 * Es IDEMPOTENTE: cartel-preview.png nunca se modifica, así que ejecutar
 * el script N veces siempre produce el mismo resultado.
 *
 * Uso:
 *   node scripts/regenerate-poster-with-qr.mjs
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

// ÚNICA fuente del diseño base — NO modificar este archivo.
const POSTER_BASE_PNG = path.join(ROOT, 'public', 'downloads', 'cartel-preview.png');

// Outputs (se sobrescriben):
const POSTER_PDF = path.join(ROOT, 'public', 'downloads', 'cartel-lomhifar-default.pdf');
const POSTER_PNG = path.join(ROOT, 'public', 'downloads', 'cartel-lomhifar-default.png');
const QR_PNG = path.join(ROOT, 'public', 'downloads', 'cartel-qr.png');

const TARGET_URL = 'https://pulseraspersonalizadas.lomhifar.net/';
const URL_DISPLAY = 'pulseraspersonalizadas.lomhifar.net';

// Colores corporativos Lomhifar
const COLOR_MAGENTA_RGB = rgb(0.57, 0.10, 0.37); // #921a5e
const COLOR_INK_RGB = rgb(0.1, 0.1, 0.13);
const COLOR_INK_SOFT_RGB = rgb(0.4, 0.4, 0.45);

async function main() {
  console.log(`→ Generando QR para: ${TARGET_URL}`);
  const qrPng = await QRCode.toBuffer(TARGET_URL, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 600,
    color: { dark: '#1a1a20', light: '#ffffff' },
  });

  console.log(`→ Leyendo cartel base (inmutable): ${POSTER_BASE_PNG}`);
  const baseBuf = await readFile(POSTER_BASE_PNG);
  const baseMeta = await sharp(baseBuf).metadata();
  console.log(`   Dimensiones: ${baseMeta.width} × ${baseMeta.height} px`);

  // ─────────────────────────────────────────────────────────────────
  // 1) PNG completo (cartel original + footer)
  // ─────────────────────────────────────────────────────────────────
  console.log('→ Componiendo cartel PNG');
  const cartelPng = await composeCartelPng(baseBuf, baseMeta, qrPng);
  await writeFile(POSTER_PNG, cartelPng);
  console.log(`✓ PNG: ${POSTER_PNG} (${(cartelPng.length / 1024).toFixed(1)} KB)`);

  // ─────────────────────────────────────────────────────────────────
  // 2) PDF A4 (embebe el PNG completo como imagen)
  // ─────────────────────────────────────────────────────────────────
  console.log('→ Generando PDF A4 desde el PNG completo');
  await generatePdfFromPng(cartelPng);
  const pdfStat = await readFile(POSTER_PDF);
  console.log(`✓ PDF: ${POSTER_PDF} (${(pdfStat.length / 1024).toFixed(1)} KB)`);

  // ─────────────────────────────────────────────────────────────────
  // 3) QR independiente
  // ─────────────────────────────────────────────────────────────────
  console.log('→ Componiendo QR independiente');
  await regenerateStandaloneQr();
}

/**
 * Toma el cartel base (PNG inmutable) y le añade DEBAJO una banda
 * blanca con QR + URL + texto. Devuelve el PNG final como Buffer.
 * El cartel base no se modifica.
 */
async function composeCartelPng(baseBuf, baseMeta, qrPngBuffer) {
  const W = baseMeta.width;
  const H = baseMeta.height;
  const FOOTER_PX = Math.round(W * 0.13);

  const QR_PX = Math.round(FOOTER_PX * 0.78);
  const pad = Math.round(FOOTER_PX * 0.15);
  const textX = pad + QR_PX + Math.round(FOOTER_PX * 0.18);
  const fontTitle = Math.round(FOOTER_PX * 0.20);
  const fontUrl = Math.round(FOOTER_PX * 0.18);
  const fontSub = Math.round(FOOTER_PX * 0.13);
  const fontBrand = Math.round(FOOTER_PX * 0.11);

  const footerSvg = `<svg width="${W}" height="${FOOTER_PX}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${W}" height="${FOOTER_PX}" fill="#ffffff"/>
    <rect x="${pad}" y="0" width="${W - pad * 2}" height="1.5" fill="#dcdce0"/>
    <text x="${textX}" y="${pad + fontTitle}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${fontTitle}" fill="#1a1a20">Acceda al catálogo online</text>
    <text x="${textX}" y="${pad + fontTitle + fontUrl + 12}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${fontUrl}" fill="#921a5e">${URL_DISPLAY}</text>
    <text x="${textX}" y="${pad + fontTitle + fontUrl + fontSub + 30}" font-family="Helvetica, Arial, sans-serif" font-size="${fontSub}" fill="#666670">Escanee el código QR con la cámara de su móvil</text>
    <text x="${W - pad}" y="${FOOTER_PX - pad}" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${fontBrand}" fill="#921a5e">LOMHIFAR · CANAL FARMACIA</text>
  </svg>`;

  const qrResized = await sharp(qrPngBuffer)
    .resize(QR_PX, QR_PX, { kernel: 'nearest' })
    .png()
    .toBuffer();

  const footerPng = await sharp(Buffer.from(footerSvg))
    .composite([
      {
        input: qrResized,
        left: pad,
        top: Math.round((FOOTER_PX - QR_PX) / 2),
      },
    ])
    .png()
    .toBuffer();

  return sharp(baseBuf)
    .extend({
      top: 0,
      bottom: FOOTER_PX,
      left: 0,
      right: 0,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .composite([{ input: footerPng, top: H, left: 0 }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Genera un PDF A4 vertical con el PNG del cartel ocupando toda la página.
 * El PDF y el PNG quedan visualmente idénticos.
 */
async function generatePdfFromPng(pngBuffer) {
  const doc = await PDFDocument.create();
  // A4 vertical en puntos: 595 × 842
  const A4_W = 595;
  const A4_H = 842;
  const page = doc.addPage([A4_W, A4_H]);

  const image = await doc.embedPng(pngBuffer);
  // Ajustar manteniendo aspect ratio dentro de A4
  const imgRatio = image.width / image.height;
  const pageRatio = A4_W / A4_H;

  let drawW, drawH;
  if (imgRatio > pageRatio) {
    drawW = A4_W;
    drawH = A4_W / imgRatio;
  } else {
    drawH = A4_H;
    drawW = A4_H * imgRatio;
  }
  const drawX = (A4_W - drawW) / 2;
  const drawY = (A4_H - drawH) / 2;

  page.drawImage(image, { x: drawX, y: drawY, width: drawW, height: drawH });

  const out = await doc.save();
  await writeFile(POSTER_PDF, out);
}

/**
 * QR limpio + URL grande debajo en PNG cuadrado, listo para enviar
 * suelto por WhatsApp/email/redes.
 */
async function regenerateStandaloneQr() {
  const SIZE = 800;
  const QR_PX = 540;

  const qr = await QRCode.toBuffer(TARGET_URL, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: QR_PX,
    color: { dark: '#1a1a20', light: '#ffffff' },
  });

  const svg = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${SIZE}" height="${SIZE}" fill="#ffffff"/>
    <text x="${SIZE / 2}" y="60" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="32" fill="#921a5e">PULSERAS LOMHIFAR</text>
    <text x="${SIZE / 2}" y="98" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#54545f">Acceda al catálogo online</text>
    <text x="${SIZE / 2}" y="${SIZE - 40}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="22" fill="#1a1a20">${URL_DISPLAY}</text>
  </svg>`;

  const qrX = Math.round((SIZE - QR_PX) / 2);
  const qrY = 130;

  const finalBuf = await sharp(Buffer.from(svg))
    .composite([{ input: qr, left: qrX, top: qrY }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(QR_PNG, finalBuf);
  console.log(`✓ QR: ${QR_PNG} (${(finalBuf.length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error('✗ Error:', err);
  process.exit(1);
});
