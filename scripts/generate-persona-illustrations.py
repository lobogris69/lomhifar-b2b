"""
Genera 6 ilustraciones editoriales originales para la galería "Casos reales".

ENFOQUE: composición editorial atmosférica
  - Fondo: gradiente tintado por perfil + halo radial + grano sutil
  - Silueta humana suave y desenfocada (sugerida, no realista)
  - Pulsera Lomhifar rendereada NÍTIDA y PROMINENTE en primer plano
  - Acento de color brand + iconografía contextual

El resultado se asemeja a fotografía editorial de producto: la pulsera es
la heroína, el contexto humano se intuye sin necesidad de detalles realistas.

Salida: /public/lifestyle/illustrated/{slug}.jpg
"""
import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

OUT_DIR = r"D:\CLAUDE CODE TRADINGVIEW MAYO 2026\lomhifar\public\lifestyle\illustrated"
os.makedirs(OUT_DIR, exist_ok=True)

W, H = 800, 1000  # 4:5


def lerp(a, b, t):
    return a + (b - a) * t


def make_gradient(size, top_color, bottom_color):
    w, h = size
    img = Image.new('RGB', (w, h))
    px = img.load()
    for y in range(h):
        t = y / (h - 1)
        r = int(lerp(top_color[0], bottom_color[0], t))
        g = int(lerp(top_color[1], bottom_color[1], t))
        b = int(lerp(top_color[2], bottom_color[2], t))
        for x in range(w):
            px[x, y] = (r, g, b)
    return img


def add_radial_glow(img, center, radius, color, opacity):
    """Añade un halo radial suave."""
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    steps = 60
    for i in range(steps, 0, -1):
        r = int(radius * (i / steps))
        a = int(255 * opacity * (1 - (i / steps) ** 2))
        bbox = (center[0] - r, center[1] - r, center[0] + r, center[1] + r)
        draw.ellipse(bbox, fill=color + (a,))
    layer = layer.filter(ImageFilter.GaussianBlur(radius=18))
    img.paste(layer, (0, 0), layer)


def add_dot_pattern(img, spacing=30, color=(255, 255, 255), opacity=18, radius=2):
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for y in range(0, img.size[1] + spacing, spacing):
        for x in range(0, img.size[0] + spacing, spacing):
            draw.ellipse((x - radius, y - radius, x + radius, y + radius),
                         fill=color + (opacity,))
    img.paste(overlay, (0, 0), overlay)


def draw_person_silhouette(img, skin_color, scale=1.0, offset=(0, 0)):
    """
    Dibuja una silueta humana muy estilizada y desenfocada, sugiriendo
    una persona vista desde un ángulo (cabeza + hombros + brazo cayendo).
    No representa rasgos faciales.
    """
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    cx, cy = W // 2 + offset[0], H // 2 + offset[1]
    s = scale

    # CABEZA: elipse simple
    head_w = int(180 * s)
    head_h = int(220 * s)
    head_cx = cx - int(120 * s)
    head_cy = cy - int(280 * s)
    draw.ellipse(
        (head_cx - head_w // 2, head_cy - head_h // 2,
         head_cx + head_w // 2, head_cy + head_h // 2),
        fill=skin_color + (255,),
    )

    # CUELLO + HOMBROS + TORSO: forma redondeada que cae
    # Trapecio invertido suavizado
    torso_pts = [
        (head_cx - int(80 * s), head_cy + int(80 * s)),
        (head_cx + int(80 * s), head_cy + int(80 * s)),
        (cx + int(140 * s), cy + int(80 * s)),
        (cx + int(280 * s), cy + int(300 * s)),
        (cx + int(300 * s), H + 50),
        (cx - int(260 * s), H + 50),
        (cx - int(250 * s), cy + int(50 * s)),
    ]
    draw.polygon(torso_pts, fill=skin_color + (255,))

    # BRAZO derecho cayendo: una banda ancha desde el hombro hasta abajo
    arm_pts = [
        (cx + int(180 * s), cy + int(40 * s)),  # hombro
        (cx + int(280 * s), cy + int(60 * s)),
        (cx + int(360 * s), cy + int(380 * s)),  # mano
        (cx + int(260 * s), cy + int(420 * s)),
        (cx + int(160 * s), cy + int(130 * s)),
    ]
    draw.polygon(arm_pts, fill=skin_color + (255,))

    # Aplicar fuerte blur para "frosted glass" look (desenfoque artístico)
    layer = layer.filter(ImageFilter.GaussianBlur(radius=22))
    # Reducir opacidad general para que sea sutil
    alpha = layer.split()[-1]
    alpha = alpha.point(lambda p: int(p * 0.55))
    layer.putalpha(alpha)

    img.paste(layer, (0, 0), layer)


def draw_lomhifar_bracelet(img, cx, cy, total_width, color, line1, line2, font_paths, rotation=0):
    """
    Dibuja la pulsera Lomhifar completa (strap + placa + grabado) horizontal.
    Luego la rota y la pega.
    """
    is_black = color == 'BLACK'

    # Render en una capa propia para poder rotar
    pad = 80
    layer_w = total_width + pad * 2
    layer_h = int(total_width * 0.32)
    layer = Image.new('RGBA', (layer_w, layer_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    # Dimensiones relativas (proporción real 22:1 → adaptada para visibilidad)
    strap_h = int(layer_h * 0.42)
    strap_y = (layer_h - strap_h) // 2

    # STRAP completo (rectángulo redondeado)
    strap_x0 = pad
    strap_x1 = pad + total_width

    # Gradiente vertical del strap (simulado con 3 bandas)
    if is_black:
        strap_colors = [(44, 44, 52), (14, 14, 18), (30, 30, 36)]
    else:
        strap_colors = [(163, 24, 33), (88, 8, 16), (140, 18, 31)]

    band_h = strap_h // 3
    for i, col in enumerate(strap_colors):
        y0 = strap_y + i * band_h
        y1 = y0 + band_h + (1 if i == 2 else 0)
        if i == 0:
            d.rounded_rectangle(
                (strap_x0, y0, strap_x1, y1 + band_h),
                radius=6, fill=col,
            )
        elif i == 1:
            d.rectangle((strap_x0, y0, strap_x1, y1), fill=col)
        else:
            d.rounded_rectangle(
                (strap_x0, y0 - band_h, strap_x1, y1),
                radius=6, fill=col,
            )

    # Orificios izquierdos
    n_holes = 7
    hole_spacing = total_width * 0.04
    hole_start = strap_x0 + int(total_width * 0.05)
    for i in range(n_holes):
        cx_h = int(hole_start + i * hole_spacing)
        d.ellipse(
            (cx_h - 4, strap_y + strap_h // 2 - 4,
             cx_h + 4, strap_y + strap_h // 2 + 4),
            fill=(0, 0, 0, 220),
        )

    # Hebilla derecha
    buckle_w = int(total_width * 0.05)
    bx0 = strap_x1 - buckle_w - 4
    by0 = strap_y - 4
    d.rounded_rectangle(
        (bx0, by0, bx0 + buckle_w, by0 + strap_h + 8),
        radius=3, fill=(207, 207, 213), outline=(122, 122, 130), width=1,
    )

    # PLACA central (4 cm proporcional)
    plate_w = int(total_width * 0.27)
    plate_h = int(strap_h * 1.4)
    plate_x = (strap_x0 + strap_x1) // 2 - plate_w // 2
    plate_y = layer_h // 2 - plate_h // 2

    # Gradiente metálico (3 bandas)
    metal_steps = 12
    for i in range(metal_steps):
        t = i / (metal_steps - 1)
        if t < 0.5:
            col = (
                int(lerp(246, 207, t * 2)),
                int(lerp(246, 207, t * 2)),
                int(lerp(248, 213, t * 2)),
            )
        else:
            col = (
                int(lerp(207, 138, (t - 0.5) * 2)),
                int(lerp(207, 138, (t - 0.5) * 2)),
                int(lerp(213, 146, (t - 0.5) * 2)),
            )
        y0 = plate_y + int(plate_h * t)
        y1 = plate_y + int(plate_h * (t + 1 / metal_steps)) + 1
        d.rectangle((plate_x, y0, plate_x + plate_w, y1), fill=col)

    # Border placa
    d.rounded_rectangle(
        (plate_x, plate_y, plate_x + plate_w, plate_y + plate_h),
        radius=4, outline=(122, 122, 130), width=1,
    )
    # Bisel superior brillante
    d.line(
        (plate_x + 2, plate_y + 2, plate_x + plate_w - 2, plate_y + 2),
        fill=(255, 255, 255, 220), width=2,
    )

    # SYMBOL Star of Life (a la izquierda dentro de la placa)
    sol_size = int(plate_h * 0.55)
    sol_cx = plate_x + int(plate_w * 0.13)
    sol_cy = plate_y + plate_h // 2
    for angle in [0, 60, 120]:
        rad = math.radians(angle)
        dx = math.cos(rad - math.pi / 2) * sol_size / 2
        dy = math.sin(rad - math.pi / 2) * sol_size / 2
        d.line(
            [(sol_cx - dx, sol_cy - dy), (sol_cx + dx, sol_cy + dy)],
            fill=(26, 26, 32, 255),
            width=max(2, int(sol_size * 0.11)),
        )
    # Centro plateado del símbolo
    d.ellipse(
        (sol_cx - 3, sol_cy - 3, sol_cx + 3, sol_cy + 3),
        fill=(207, 207, 213),
    )

    # TEXTO grabado (2 líneas) a la derecha del símbolo
    text_area_x = sol_cx + sol_size // 2 + 8
    text_area_w = plate_x + plate_w - text_area_x - 6
    try:
        font_l1 = ImageFont.truetype(font_paths['bold'], int(plate_h * 0.30))
        font_l2 = ImageFont.truetype(font_paths['bold'], int(plate_h * 0.24))
    except Exception:
        font_l1 = ImageFont.load_default()
        font_l2 = ImageFont.load_default()

    # Línea 1 centrada en el área de texto
    line1u = line1.upper()
    bb1 = d.textbbox((0, 0), line1u, font=font_l1)
    l1_w = bb1[2] - bb1[0]
    l1_h = bb1[3] - bb1[1]
    l1_x = text_area_x + (text_area_w - l1_w) // 2
    l1_y = plate_y + plate_h // 2 - l1_h - 2
    d.text((l1_x, l1_y), line1u, font=font_l1, fill=(26, 26, 32, 255))
    # Línea 2
    line2u = line2.upper()
    bb2 = d.textbbox((0, 0), line2u, font=font_l2)
    l2_w = bb2[2] - bb2[0]
    l2_x = text_area_x + (text_area_w - l2_w) // 2
    l2_y = plate_y + plate_h // 2 + 2
    d.text((l2_x, l2_y), line2u, font=font_l2, fill=(26, 26, 32, 255))

    # === Sombra proyectada bajo la pulsera ===
    shadow_layer = Image.new('RGBA', layer.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow_layer)
    sd.rounded_rectangle(
        (strap_x0 - 4, strap_y + strap_h + 4,
         strap_x1 + 4, strap_y + strap_h + 18),
        radius=10, fill=(0, 0, 0, 100),
    )
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=14))

    # Componer sombra debajo del bracelet
    composed = Image.new('RGBA', layer.size, (0, 0, 0, 0))
    composed = Image.alpha_composite(composed, shadow_layer)
    composed = Image.alpha_composite(composed, layer)

    # Rotar y pegar centrado en cx,cy
    if rotation != 0:
        composed = composed.rotate(rotation, resample=Image.BICUBIC, expand=True)
    cw, ch = composed.size
    img.paste(composed, (int(cx - cw / 2), int(cy - ch / 2)), composed)


def add_grain(img, intensity=8):
    """Grano fotográfico sutil."""
    w, h = img.size
    noise = Image.effect_noise((w, h), intensity).convert('L')
    noise_rgba = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    npx = noise.load()
    rpx = noise_rgba.load()
    for y in range(h):
        for x in range(w):
            v = npx[x, y]
            rpx[x, y] = (v, v, v, 18)
    img = img.convert('RGBA')
    img = Image.alpha_composite(img, noise_rgba)
    return img.convert('RGB')


# ============ ESCENAS ============
# Cada escena tiene su propia atmósfera de color, silueta y mensaje.
SCENES = [
    {
        'slug': 'sofia-nina',
        'top':    (255, 232, 179),
        'bottom': (255, 199, 122),
        'sil_skin': (244, 196, 158),
        'sil_scale': 0.85,
        'sil_offset': (-80, 60),
        'bracelet': 'RED',
        'line1': 'ASMA NUECES',
        'line2': 'MAMA 666111222',
        'bracelet_width': 580,
        'bracelet_rotation': -8,
        'bracelet_pos': (W // 2, H // 2 + 60),
    },
    {
        'slug': 'carmen-mujer',
        'top':    (252, 207, 233),
        'bottom': (248, 168, 212),
        'sil_skin': (230, 184, 152),
        'sil_scale': 1.0,
        'sil_offset': (60, 30),
        'bracelet': 'BLACK',
        'line1': 'ALERGICA PENIC.',
        'line2': 'TFNO 666987654',
        'bracelet_width': 600,
        'bracelet_rotation': -6,
        'bracelet_pos': (W // 2, H // 2 + 80),
    },
    {
        'slug': 'andres-deportista',
        'top':    (186, 230, 253),
        'bottom': (96, 165, 250),
        'sil_skin': (200, 148, 110),
        'sil_scale': 1.1,
        'sil_offset': (40, 20),
        'bracelet': 'RED',
        'line1': 'DIABETES T1',
        'line2': 'INSULINA',
        'bracelet_width': 620,
        'bracelet_rotation': -12,
        'bracelet_pos': (W // 2, H // 2 + 70),
    },
    {
        'slug': 'maria-embarazo',
        'top':    (253, 232, 244),
        'bottom': (248, 168, 212),
        'sil_skin': (240, 195, 162),
        'sil_scale': 1.0,
        'sil_offset': (50, 50),
        'bracelet': 'RED',
        'line1': 'EMBARAZO 32S',
        'line2': 'DR 666333444',
        'bracelet_width': 600,
        'bracelet_rotation': -7,
        'bracelet_pos': (W // 2, H // 2 + 70),
    },
    {
        'slug': 'pedro-anciano',
        'top':    (254, 243, 199),
        'bottom': (250, 204, 96),
        'sil_skin': (210, 162, 124),
        'sil_scale': 1.0,
        'sil_offset': (50, 20),
        'bracelet': 'BLACK',
        'line1': 'ALZHEIMER',
        'line2': 'HIJA 666555666',
        'bracelet_width': 600,
        'bracelet_rotation': -8,
        'bracelet_pos': (W // 2, H // 2 + 80),
    },
    {
        'slug': 'lucia-anticoag',
        'top':    (254, 202, 202),
        'bottom': (251, 113, 133),
        'sil_skin': (236, 198, 168),
        'sil_scale': 0.95,
        'sil_offset': (-40, 40),
        'bracelet': 'BLACK',
        'line1': 'ANTICOAGULADA',
        'line2': 'TFNO 666111222',
        'bracelet_width': 610,
        'bracelet_rotation': -10,
        'bracelet_pos': (W // 2, H // 2 + 70),
    },
]


def find_font():
    candidates = [
        r'C:\Windows\Fonts\arialbd.ttf',
        r'C:\Windows\Fonts\segoeuib.ttf',
        r'C:\Windows\Fonts\calibrib.ttf',
    ]
    for p in candidates:
        if os.path.exists(p):
            return {'bold': p}
    return {'bold': None}


def render_scene(scene):
    font_paths = find_font()

    # 1) Fondo gradiente
    bg = make_gradient((W, H), scene['top'], scene['bottom']).convert('RGBA')

    # 2) Patrón de puntos sutil
    add_dot_pattern(bg, spacing=26, color=(255, 255, 255), opacity=14, radius=2)

    # 3) Halo radial en la zona donde irá la pulsera
    add_radial_glow(bg, scene['bracelet_pos'], 320, (255, 255, 255), opacity=0.40)

    # 4) Acento brand: halo magenta arriba-derecha
    add_radial_glow(bg, (W - 100, 120), 250, (209, 38, 134), opacity=0.30)

    # 5) Círculo decorativo abajo-izquierda
    abstract = Image.new('RGBA', bg.size, (0, 0, 0, 0))
    ad = ImageDraw.Draw(abstract)
    ad.ellipse((40, H - 220, 260, H + 30), fill=(255, 255, 255, 40))
    abstract = abstract.filter(ImageFilter.GaussianBlur(radius=4))
    bg = Image.alpha_composite(bg, abstract)

    # 6) SILUETA HUMANA desenfocada (sugerida, no realista)
    draw_person_silhouette(
        bg,
        skin_color=scene['sil_skin'],
        scale=scene['sil_scale'],
        offset=scene['sil_offset'],
    )

    # 7) Pulsera Lomhifar nítida en primer plano
    draw_lomhifar_bracelet(
        bg,
        cx=scene['bracelet_pos'][0],
        cy=scene['bracelet_pos'][1],
        total_width=scene['bracelet_width'],
        color=scene['bracelet'],
        line1=scene['line1'],
        line2=scene['line2'],
        font_paths=font_paths,
        rotation=scene['bracelet_rotation'],
    )

    # 8) Grano fotográfico
    final = add_grain(bg, intensity=8)

    out_path = os.path.join(OUT_DIR, f"{scene['slug']}.jpg")
    final.save(out_path, 'JPEG', quality=88, optimize=True)
    print(f"  OK {scene['slug']}.jpg ({final.size[0]}x{final.size[1]})")


def main():
    print(f"Generating {len(SCENES)} illustrated scenes -> {OUT_DIR}")
    for scene in SCENES:
        render_scene(scene)
    print("Done.")


if __name__ == '__main__':
    main()
