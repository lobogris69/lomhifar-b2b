/**
 * Regenera 3 versiones del cartel promocional con el QR y URL incorporados:
 *
 *   1. cartel-lomhifar-default.pdf  → para imprimir (A4 vectorial)
 *   2. cartel-lomhifar-default.png  → para compartir por WhatsApp/redes
 *                                     (se previsualiza en el chat)
 *   3. cartel-qr.png                → solo el QR + URL pequeño, para
 *                                     enviar suelto por WhatsApp/email
 *
 * Mantiene INTACTO el diseño del cartel original (no toca ni reescala
 * la composición principal). Sólo añade ~100pt al alto de la página
 * para una banda blanca inferior con el bloque del QR.
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
// IMPORTANTE: cartel-base.pdf es el cartel ORIGINAL inmutable (sin footer).
// El script SIEMPRE lo lee de ahí y nunca lo escribe — así puede ejecutarse
// N veces sin acumular múltiples footers (bug anterior). Si en algún momento
// se quiere cambiar el diseño base, hay que sustituir cartel-base.pdf
// manualmente.
const POSTER_BASE_PDF = path.join(ROOT, 'public', 'downloads', 'cartel-base.pdf');
const POSTER_PDF = path.join(ROOT, 'public', 'downloads', 'cartel-lomhifar-default.pdf');
const POSTER_PNG = path.join(ROOT, 'public', 'downloads', 'cartel-lomhifar-default.png');
const POSTER_BASE_PNG = path.join(ROOT, 'public', 'downloads', 'cartel-preview.png');
const QR_PNG = path.join(ROOT, 'public', 'downloads', 'cartel-qr.png');

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
  console.log(`→ Leyendo cartel BASE (inmutable): ${POSTER_BASE_PDF}`);
  const originalBytes = await readFile(POSTER_BASE_PDF);
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
  await writeFile(POSTER_PDF, out);
  console.log(`✓ PDF regenerado: ${POSTER_PDF} (${(out.length / 1024).toFixed(1)} KB)`);

  // ─────────────────────────────────────────────────────────────────
  // 2) Cartel como PNG (para WhatsApp / redes / previsualización chat)
  // ─────────────────────────────────────────────────────────────────
  console.log('→ Componiendo cartel PNG con footer de QR + URL');
  await regenerateCartelPng(qrPng);

  // ─────────────────────────────────────────────────────────────────
  // 3) QR independiente (PNG limpio + texto) para enviar suelto
  // ─────────────────────────────────────────────────────────────────
  console.log('→ Componiendo QR independiente');
  await regenerateStandaloneQr();
}

/**
 * Carga cartel-preview.png (cartel sin QR), le añade una banda blanca
 * inferior con QR + URL + texto, y guarda como cartel-lomhifar-default.png.
 * El admin puede compartir este PNG por WhatsApp y el chat lo previsualiza.
 */
async function regenerateCartelPng(qrPngBuffer) {
  const baseBuf = await readFile(POSTER_BASE_PNG);
  const baseMeta = await sharp(baseBuf).metadata();
  const W = baseMeta.width;
  const H = baseMeta.height;
  const FOOTER_PX = Math.round(W * 0.13); // ~13% del ancho como banda

  // SVG con el contenido del footer (QR + textos)
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

  // QR escalado a QR_PX
  const qrResized = await sharp(qrPngBuffer)
    .resize(QR_PX, QR_PX, { kernel: 'nearest' })
    .png()
    .toBuffer();

  // Componemos el footer = svg base + QR encima
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

  // Imagen final = cartel base arriba + footer debajo (extend abajo)
  const finalBuf = await sharp(baseBuf)
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

  await writeFile(POSTER_PNG, finalBuf);
  console.log(`✓ PNG regenerado: ${POSTER_PNG} (${(finalBuf.length / 1024).toFixed(1)} KB, ${W}×${H + FOOTER_PX})`);
}

/**
 * QR limpio + URL grande debajo en PNG cuadrado, listo para enviar
 * suelto por WhatsApp/email/redes. Buen contraste y márgenes amplios
 * para que se escanee fácil incluso en pantallas.
 */
async function regenerateStandaloneQr() {
  const SIZE = 800;
  const QR_PX = 540;
  const titleH = 60;
  const subH = 50;

  // QR alta resolución
  const qr = await QRCode.toBuffer(TARGET_URL, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: QR_PX,
    color: { dark: '#1a1a20', light: '#ffffff' },
  });

  const totalH = SIZE;
  const svg = `<svg width="${SIZE}" height="${totalH}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${SIZE}" height="${totalH}" fill="#ffffff"/>
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
  console.log(`✓ QR independiente: ${QR_PNG} (${(finalBuf.length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error('✗ Error:', err);
  process.exit(1);
});
