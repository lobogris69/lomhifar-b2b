/**
 * Regenera el cartel promocional añadiendo un footer compacto con:
 *   - QR a la izquierda apuntando a la home pública
 *   - URL legible + texto invitación a la derecha
 *
 * Mantiene INTACTO el diseño del cartel original (no toca ni reescala
 * la composición principal). Sólo añade ~100pt al alto de la página
 * para una banda blanca inferior con el bloque del QR.
 *
 * Uso:
 *   node scripts/regenerate-poster-with-qr.mjs
 *
 * Genera/sobrescribe: public/downloads/cartel-lomhifar-default.pdf
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const POSTER_PATH = path.join(ROOT, 'public', 'downloads', 'cartel-lomhifar-default.pdf');
const TARGET_URL = 'https://pulseraspersonalizadas.lomhifar.net/';
const URL_DISPLAY = 'pulseraspersonalizadas.lomhifar.net';

// Colores corporativos Lomhifar (magenta + tinta)
const COLOR_MAGENTA = rgb(0.57, 0.10, 0.37); // #921a5e
const COLOR_INK = rgb(0.1, 0.1, 0.13);       // #1a1a20
const COLOR_INK_SOFT = rgb(0.4, 0.4, 0.45);  // gris medio
const COLOR_WHITE = rgb(1, 1, 1);

const FOOTER_HEIGHT = 110;
const PADDING = 22;
const QR_SIZE = 84;

async function main() {
  console.log(`→ Leyendo cartel original: ${POSTER_PATH}`);
  const originalBytes = await readFile(POSTER_PATH);
  const originalDoc = await PDFDocument.load(originalBytes);
  const firstPage = originalDoc.getPage(0);
  const { width, height } = firstPage.getSize();
  console.log(`   Tamaño original: ${width.toFixed(0)} × ${height.toFixed(0)} pt`);

  console.log(`→ Generando QR para: ${TARGET_URL}`);
  // PNG vector-like (alta resolución, márgenes mínimos)
  const qrPng = await QRCode.toBuffer(TARGET_URL, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 600,
    color: { dark: '#1a1a20', light: '#ffffff' },
  });

  console.log('→ Creando PDF nuevo con footer extendido');
  const newDoc = await PDFDocument.create();
  const helveticaBold = await newDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await newDoc.embedFont(StandardFonts.Helvetica);

  // Página nueva = misma anchura, alto + FOOTER_HEIGHT
  const newPage = newDoc.addPage([width, height + FOOTER_HEIGHT]);

  // 1. Empotrar la página original tal cual, desplazada hacia arriba
  const [embedded] = await newDoc.embedPdf(originalBytes, [0]);
  newPage.drawPage(embedded, {
    x: 0,
    y: FOOTER_HEIGHT,
    width,
    height,
  });

  // 2. Banda blanca del footer
  newPage.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: FOOTER_HEIGHT,
    color: COLOR_WHITE,
  });

  // 3. Línea separadora sutil
  newPage.drawRectangle({
    x: PADDING,
    y: FOOTER_HEIGHT - 1,
    width: width - PADDING * 2,
    height: 0.7,
    color: rgb(0.85, 0.85, 0.88),
  });

  // 4. QR a la izquierda (centrado verticalmente en la banda)
  const qrImage = await newDoc.embedPng(qrPng);
  const qrY = (FOOTER_HEIGHT - QR_SIZE) / 2;
  newPage.drawImage(qrImage, {
    x: PADDING,
    y: qrY,
    width: QR_SIZE,
    height: QR_SIZE,
  });

  // 5. Bloque de texto a la derecha del QR
  const textX = PADDING + QR_SIZE + 22;
  const centerY = FOOTER_HEIGHT / 2;

  // Título grande
  newPage.drawText('Acceda al catálogo online', {
    x: textX,
    y: centerY + 18,
    size: 15,
    font: helveticaBold,
    color: COLOR_INK,
  });

  // URL en magenta
  newPage.drawText(URL_DISPLAY, {
    x: textX,
    y: centerY - 4,
    size: 13,
    font: helveticaBold,
    color: COLOR_MAGENTA,
  });

  // Instrucción QR
  newPage.drawText('Escanee el código QR con la cámara de su móvil', {
    x: textX,
    y: centerY - 24,
    size: 10,
    font: helvetica,
    color: COLOR_INK_SOFT,
  });

  // 6. Sello "Pulseras Lomhifar" en la esquina inferior derecha
  const brand = 'LOMHIFAR · CANAL FARMACIA';
  const brandWidth = helveticaBold.widthOfTextAtSize(brand, 9);
  newPage.drawText(brand, {
    x: width - PADDING - brandWidth,
    y: 12,
    size: 9,
    font: helveticaBold,
    color: COLOR_MAGENTA,
  });

  console.log('→ Guardando PDF final');
  const out = await newDoc.save();
  await writeFile(POSTER_PATH, out);

  console.log(`✓ Cartel regenerado: ${POSTER_PATH}`);
  console.log(`  Nuevo tamaño: ${width.toFixed(0)} × ${(height + FOOTER_HEIGHT).toFixed(0)} pt`);
  console.log(`  Tamaño archivo: ${(out.length / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error('✗ Error:', err);
  process.exit(1);
});
