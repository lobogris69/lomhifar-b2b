"""
Genera el cartel promocional por defecto de Lomhifar en formato PDF A4.
Se ejecuta una sola vez para crear public/downloads/cartel-lomhifar-default.pdf
Volver a ejecutar si cambia el diseño base.
"""
import fitz  # PyMuPDF
import os
import math

OUT_PDF = r'D:\CLAUDE CODE TRADINGVIEW MAYO 2026\lomhifar\public\downloads\cartel-lomhifar-default.pdf'
OUT_PNG = r'D:\CLAUDE CODE TRADINGVIEW MAYO 2026\lomhifar\public\downloads\cartel-preview.png'
os.makedirs(os.path.dirname(OUT_PDF), exist_ok=True)

# A4 en puntos (1 mm = 2.834 pt) — 210 x 297 mm
A4_W = 595.28
A4_H = 841.89

# Paleta corporativa Lomhifar
MAGENTA       = (0.819, 0.149, 0.525)   # #d12686
MAGENTA_DARK  = (0.572, 0.102, 0.369)   # #921a5e
INK_900       = (0.102, 0.102, 0.125)   # #1a1a20
ENGRAVE       = (0.290, 0.290, 0.322)   # #4a4a52 — grabado láser sobre aluminio (antracita)
INK_500       = (0.420, 0.420, 0.471)   # #6b6b78
INK_100       = (0.933, 0.933, 0.941)   # #eeeef0
SILVER        = (0.760, 0.760, 0.780)
WHITE         = (1, 1, 1)

doc = fitz.open()
page = doc.new_page(width=A4_W, height=A4_H)

# ============ FRANJA SUPERIOR MAGENTA con cluster de puntos ============
BAND_H = 150
page.draw_rect(fitz.Rect(0, 0, A4_W, BAND_H), color=MAGENTA_DARK, fill=MAGENTA_DARK, width=0)
# Gradiente simulado con varias rects translúcidas
for i in range(20):
    alpha_color = (
        MAGENTA[0] + (MAGENTA_DARK[0] - MAGENTA[0]) * (i / 20),
        MAGENTA[1] + (MAGENTA_DARK[1] - MAGENTA[1]) * (i / 20),
        MAGENTA[2] + (MAGENTA_DARK[2] - MAGENTA[2]) * (i / 20),
    )
    page.draw_rect(
        fitz.Rect(0, i * (BAND_H / 20), A4_W, (i + 1) * (BAND_H / 20)),
        color=alpha_color, fill=alpha_color, width=0,
    )

# Cluster de puntos decorativo (parte derecha de la franja, sutil)
def draw_dot_cluster(cx, cy, scale=1.0, opacity=1.0, color=WHITE):
    rows = [
        [(34,1,2.6),(44,1,2.7),(54,1,2.8),(64,1,2.8),(74,1,2.7)],
        [(26,1,2.9),(37,2,3.1),(48,2,3.2),(59,2,3.2),(70,2,3.1),(81,1,2.9)],
        [(20,1,3.0),(32,2,3.3),(44,3,3.5),(56,3,3.6),(68,3,3.5),(80,2,3.3),(92,1,3.0)],
        [(16,1,3.1),(28,3,3.6),(41,3,3.8),(54,3,3.9),(67,3,3.8),(80,3,3.6),(93,1,3.1)],
        [(14,1,3.0),(26,2,3.5),(39,3,3.7),(52,3,3.8),(65,3,3.7),(78,2,3.5),(91,1,3.0)],
        [(14,1,2.8),(26,1,3.2),(39,2,3.4),(52,2,3.5),(65,2,3.4),(78,1,3.2)],
        [(16,1,2.6),(28,1,2.9),(41,1,3.0),(54,1,3.0),(67,1,2.9)],
    ]
    ys = [10, 22, 35, 49, 63, 76, 88]
    for y, row in zip(ys, rows):
        for x, t, r in row:
            # Convertir a coords absolutas centradas
            dx = (x - 54) * scale + cx
            dy = (y - 49) * scale + cy
            dr = r * scale
            page.draw_circle(
                fitz.Point(dx, dy), dr,
                color=color, fill=color, width=0,
                fill_opacity=opacity * (1.0 if t == 3 else 0.7 if t == 2 else 0.45),
            )

draw_dot_cluster(A4_W - 80, 75, scale=1.0, opacity=0.35, color=WHITE)
draw_dot_cluster(50, 75, scale=0.6, opacity=0.18, color=WHITE)

# Wordmark Lomhifar (sobre la franja)
page.insert_text(
    fitz.Point(40, 95),
    "Lomhifar",
    fontname="helvetica-bold",
    fontsize=42,
    color=WHITE,
)
page.insert_text(
    fitz.Point(40, 120),
    "CANAL  FARMACIA",
    fontname="helvetica-bold",
    fontsize=9,
    color=(1, 1, 1),
    rotate=0,
)

# ============ HEADLINE CENTRAL ============
y = BAND_H + 60

page.insert_text(
    fitz.Point(A4_W / 2, y),
    "AHORA EN ESTA FARMACIA",
    fontname="helvetica-bold",
    fontsize=14,
    color=MAGENTA,
)
# Centrar manualmente: PyMuPDF no centra, simulamos midiendo
def insert_text_centered(text, y, fontname, fontsize, color):
    tw = fitz.get_text_length(text, fontname=fontname, fontsize=fontsize)
    page.insert_text(
        fitz.Point((A4_W - tw) / 2, y),
        text, fontname=fontname, fontsize=fontsize, color=color,
    )

# Re-hacer el header centrado
page.draw_rect(fitz.Rect(0, BAND_H, A4_W, BAND_H + 100), color=WHITE, fill=WHITE, width=0)

# Eyebrow
insert_text_centered("AHORA EN ESTA FARMACIA", BAND_H + 55, "helvetica-bold", 12, MAGENTA)

# Title
insert_text_centered("Pulseras sanitarias", BAND_H + 105, "helvetica-bold", 38, INK_900)
insert_text_centered("personalizadas", BAND_H + 145, "helvetica-bold", 38, MAGENTA)

# Subtitle
insert_text_centered(
    "Identificación médica para personas con condiciones crónicas",
    BAND_H + 175, "helvetica", 13, INK_500,
)

# ============ ILUSTRACIÓN DE LA PULSERA ============
# Reproducimos la pulsera negra centrada con texto grabado
bra_cy = BAND_H + 270
bra_w = 460
bra_x = (A4_W - bra_w) / 2

# Strap
strap_h = 26
page.draw_rect(
    fitz.Rect(bra_x, bra_cy - strap_h/2, bra_x + bra_w, bra_cy + strap_h/2),
    color=INK_900, fill=INK_900, width=0,
)
# Highlight superior en strap
page.draw_rect(
    fitz.Rect(bra_x, bra_cy - strap_h/2, bra_x + bra_w, bra_cy - strap_h/2 + 3),
    color=(0.25, 0.25, 0.30), fill=(0.25, 0.25, 0.30), width=0,
)

# Orificios izquierdos
for i in range(7):
    page.draw_circle(
        fitz.Point(bra_x + 14 + i * 11, bra_cy), 2,
        color=(0, 0, 0), fill=(0, 0, 0), width=0,
    )

# Hebilla derecha
page.draw_rect(
    fitz.Rect(bra_x + bra_w - 22, bra_cy - 17, bra_x + bra_w, bra_cy + 17),
    color=SILVER, fill=SILVER, width=0,
)

# Patillas
for px in [bra_x + 155, bra_x + 305]:
    page.draw_rect(
        fitz.Rect(px - 2, bra_cy - 17, px + 2, bra_cy + 17),
        color=SILVER, fill=SILVER, width=0,
    )

# Placa central (4cm proporcional)
plate_w = 150
plate_h = 32
plate_x = bra_x + (bra_w - plate_w) / 2
plate_y = bra_cy - plate_h / 2
page.draw_rect(
    fitz.Rect(plate_x, plate_y, plate_x + plate_w, plate_y + plate_h),
    color=(0.55, 0.55, 0.58), fill=SILVER, width=0.5,
)
# Bisel superior brillante
page.draw_rect(
    fitz.Rect(plate_x + 1, plate_y + 1, plate_x + plate_w - 1, plate_y + 3),
    color=WHITE, fill=WHITE, width=0, fill_opacity=0.7,
)

# Star of Life — grabado láser, color antracita (no negro)
sym_cx, sym_cy = plate_x + 18, plate_y + plate_h / 2
for angle in [0, 60, 120]:
    rad = math.radians(angle)
    dx = math.cos(rad - math.pi/2) * 9
    dy = math.sin(rad - math.pi/2) * 9
    page.draw_line(
        fitz.Point(sym_cx - dx, sym_cy - dy),
        fitz.Point(sym_cx + dx, sym_cy + dy),
        color=ENGRAVE, width=2.2,
    )
page.draw_circle(fitz.Point(sym_cx, sym_cy), 1.5, color=SILVER, fill=SILVER, width=0)

# Texto grabado en la placa — color antracita láser-sobre-aluminio
text_x = plate_x + 38
text_w = plate_w - 48
line1 = "DIABETES TIPO 1"
line2 = "TFNO 666 123 456"
tw1 = fitz.get_text_length(line1, fontname="helvetica-bold", fontsize=8.5)
tw2 = fitz.get_text_length(line2, fontname="helvetica-bold", fontsize=7.5)
page.insert_text(
    fitz.Point(text_x + (text_w - tw1) / 2, plate_y + 14),
    line1, fontname="helvetica-bold", fontsize=8.5, color=ENGRAVE,
)
page.insert_text(
    fitz.Point(text_x + (text_w - tw2) / 2, plate_y + 25),
    line2, fontname="helvetica-bold", fontsize=7.5, color=ENGRAVE,
)

# Etiqueta "GRABADO LÁSER · ALUMINIO" — ancho dinámico
badge_text = "GRABADO LÁSER · ALUMINIO 4×1 cm"
badge_tw = fitz.get_text_length(badge_text, fontname="helvetica-bold", fontsize=8)
badge_w = badge_tw + 30  # padding
page.draw_rect(
    fitz.Rect(bra_x + bra_w / 2 - badge_w / 2, bra_cy + 30,
              bra_x + bra_w / 2 + badge_w / 2, bra_cy + 48),
    color=MAGENTA, fill=MAGENTA, width=0,
)
insert_text_centered(badge_text, bra_cy + 42, "helvetica-bold", 8, WHITE)

# ============ BENEFICIOS (3 columnas) ============
b_y = bra_cy + 90
col_w = (A4_W - 80) / 3

benefits = [
    ("DIABETES, ALERGIAS\nEPILEPSIA, ASMA…", "Para cualquier condición médica crónica"),
    ("MAYORES, ADULTOS\nY NIÑOS", "Personalizada al paciente"),
    ("ALUMINIO GRABADO\nA LÁSER", "Marcado permanente y resistente"),
]
for i, (title, desc) in enumerate(benefits):
    cx = 40 + col_w * i + col_w / 2
    # Bullet redondo magenta
    page.draw_circle(fitz.Point(cx, b_y), 5, color=MAGENTA, fill=MAGENTA, width=0)
    page.draw_circle(fitz.Point(cx, b_y), 2, color=WHITE, fill=WHITE, width=0)
    # Title (puede tener \n)
    for j, line in enumerate(title.split('\n')):
        tw = fitz.get_text_length(line, fontname="helvetica-bold", fontsize=10)
        page.insert_text(
            fitz.Point(cx - tw / 2, b_y + 25 + j * 13),
            line, fontname="helvetica-bold", fontsize=10, color=INK_900,
        )
    # Desc
    tw = fitz.get_text_length(desc, fontname="helvetica", fontsize=9)
    page.insert_text(
        fitz.Point(cx - tw / 2, b_y + 60),
        desc, fontname="helvetica", fontsize=9, color=INK_500,
    )

# ============ CTA INFERIOR ============
cta_y = A4_H - 130
# Caja gradiente
page.draw_rect(fitz.Rect(40, cta_y, A4_W - 40, cta_y + 70), color=INK_900, fill=INK_900, width=0)

# Headline CTA
insert_text_centered(
    "PREGUNTE EN MOSTRADOR",
    cta_y + 30, "helvetica-bold", 18, WHITE,
)
insert_text_centered(
    "Su farmacéutico le asesorará sobre el modelo y los datos a grabar",
    cta_y + 50, "helvetica", 10, (0.85, 0.85, 0.88),
)

# Línea magenta superior del CTA
page.draw_rect(
    fitz.Rect(40, cta_y, A4_W - 40, cta_y + 4),
    color=MAGENTA, fill=MAGENTA, width=0,
)

# ============ FOOTER ============
page.draw_line(
    fitz.Point(40, A4_H - 40), fitz.Point(A4_W - 40, A4_H - 40),
    color=INK_100, width=0.5,
)
insert_text_centered(
    "Distribuido por Lomhifar  ·  Plataforma B2B para farmacias autorizadas",
    A4_H - 25, "helvetica", 8, INK_500,
)

# ============ GUARDAR ============
doc.save(OUT_PDF)
doc.close()
print(f"PDF: {OUT_PDF}")

# Generar PNG de preview
doc2 = fitz.open(OUT_PDF)
pix = doc2[0].get_pixmap(dpi=160)
pix.save(OUT_PNG)
doc2.close()
print(f"PNG preview: {OUT_PNG} ({pix.width}x{pix.height})")
