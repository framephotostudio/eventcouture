# Builds every brand asset from the two approved artworks (no redrawing): python3 tools_brand.py
import os, io
from PIL import Image, ImageFilter, ImageDraw
SRC_ICON = 'brand-src/ec-icon-original.png'; SRC_LOGO = 'brand-src/logo-defined.png'  # approved logo with the Couture script defined (tools_couture.py)
OUT = 'img/brand'; os.makedirs(OUT, exist_ok=True)
for d in ['ios', 'android', 'web', 'store', 'splash']: os.makedirs(f'{OUT}/{d}', exist_ok=True)
icon = Image.open(SRC_ICON).convert('RGB'); logo = Image.open(SRC_LOGO).convert('RGB')
def save(im, path, size=None, q=None):
    if size: im = im.resize((size, size) if isinstance(size, int) else size, Image.LANCZOS)
    if path.endswith('.jpg'): im.convert('RGB').save(path, quality=q or 85, optimize=True, progressive=True)
    else: im.save(path, optimize=True)
    return im

# Full logo for the welcome screen and site branding
save(logo, f'{OUT}/logo-full.jpg', (1200, 800), 84)
save(logo, f'{OUT}/logo-full-1536.jpg', None, 88)
# Compact logo: same artwork, outer satin trimmed so it fits smaller spaces
compact = logo.crop((110, 70, 1460, 915))
save(compact, f'{OUT}/logo-compact.jpg', (900, round(900 * compact.size[1] / compact.size[0])), 86)

# Header mark: the EC icon itself
save(icon, f'{OUT}/ec-mark-128.png', 128); save(icon, f'{OUT}/ec-mark-256.png', 256)

# Apple: full-bleed square, no transparency, no rounded corners (iOS rounds them)
save(icon, f'{OUT}/store/app-store-1024.png', 1024)
for name, px in [('Icon-20@2x', 40), ('Icon-20@3x', 60), ('Icon-29@2x', 58), ('Icon-29@3x', 87), ('Icon-40@2x', 80), ('Icon-40@3x', 120),
                 ('Icon-60@2x', 120), ('Icon-60@3x', 180), ('Icon-76', 76), ('Icon-76@2x', 152), ('Icon-83.5@2x', 167), ('Icon-1024', 1024)]:
    save(icon, f'{OUT}/ios/{name}.png', px)

# Android adaptive icon: launchers mask up to ~1/3 of the edges, so the artwork is scaled to keep the letters,
# ribbon and sparkle inside the 66/108 safe zone, and the edge is filled with the same satin (blurred, enlarged copy).
def satin_from(src, x0, x1, w, h):
    # The artworks' own satin: a clean vertical slice (no lettering) stretched across and softened.
    strip = src.crop((x0, 0, x1, src.size[1])).resize((max(1, x1 - x0), h), Image.LANCZOS)
    return strip.resize((w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(max(2, w * 0.006)))
def feathered_paste(bg, fg, pos, edge=0.06):
    m = Image.new('L', fg.size, 0); f = round(min(fg.size) * edge)
    ImageDraw.Draw(m).rectangle((f, f, fg.size[0] - f, fg.size[1] - f), fill=255); m = m.filter(ImageFilter.GaussianBlur(f * 0.6))
    bg.paste(fg, pos, m); return bg
def glow(bg, color, strength=0.75, rx=0.42, ry=0.36):
    # soft light in the middle, like the artwork's own lit centre
    w, h = bg.size; m = Image.new('L', bg.size, 0)
    ImageDraw.Draw(m).ellipse((w * (0.5 - rx), h * (0.5 - ry), w * (0.5 + rx), h * (0.5 + ry)), fill=round(255 * strength))
    m = m.filter(ImageFilter.GaussianBlur(min(w, h) * 0.12)); bg.paste(Image.new('RGB', bg.size, color), (0, 0), m); return bg
def padded(size, scale=0.74):
    bg = glow(satin_from(icon, 0, 110, size, size), (247, 228, 196), 0.6)
    fg = icon.resize((round(size * scale),) * 2, Image.LANCZOS); p = (size - fg.size[0]) // 2
    return feathered_paste(bg, fg, (p, p), 0.16)
adapt = padded(1024)
save(adapt, f'{OUT}/android/icon-background-1024.png')
Image.new('RGBA', (1024, 1024), (0, 0, 0, 0)).save(f'{OUT}/android/icon-foreground-1024.png')
for dens, px in [('mdpi', 108), ('hdpi', 162), ('xhdpi', 216), ('xxhdpi', 324), ('xxxhdpi', 432)]:
    save(adapt, f'{OUT}/android/ic_launcher_background-{dens}.png', px)
    Image.new('RGBA', (px, px), (0, 0, 0, 0)).save(f'{OUT}/android/ic_launcher_foreground-{dens}.png')
for dens, px in [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]:
    save(icon, f'{OUT}/android/ic_launcher-{dens}.png', px)
    r = icon.resize((px, px), Image.LANCZOS).convert('RGBA'); m = Image.new('L', (px, px), 0); ImageDraw.Draw(m).ellipse((0, 0, px - 1, px - 1), fill=255)
    r.putalpha(padded(px).convert('L').point(lambda v: 255) if False else m); r.save(f'{OUT}/android/ic_launcher_round-{dens}.png')
save(icon, f'{OUT}/store/play-store-512.png', 512)

# Website: favicons simplified to the E and C only (the ribbon and sparkles turn to noise at 16 to 32 px)
fav = icon.crop((205, 180, 1165, 1140))
fav16 = icon.crop((250, 270, 800, 820))   # just the plum E: the only shape that stays clear at 16 px
save(fav16, f'{OUT}/web/favicon-16.png', 16)
for px in (32, 48): save(fav, f'{OUT}/web/favicon-{px}.png', px)
fav.resize((48, 48), Image.LANCZOS).save(f'{OUT}/web/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
save(icon, f'{OUT}/web/apple-touch-icon-180.png', 180)
save(icon, f'{OUT}/web/icon-192.png', 192); save(icon, f'{OUT}/web/icon-512.png', 512)
save(padded(512), f'{OUT}/web/icon-maskable-512.png')

# Splash (Capacitor): full logo centered on matching satin, 2732 square
def splash(size):
    bg = glow(satin_from(logo, 0, 115, size, size), (251, 236, 206), 0.85, 0.40, 0.26)
    w = round(size * 0.62); lg = logo.resize((w, round(w * 1024 / 1536)), Image.LANCZOS)
    return feathered_paste(bg, lg, ((size - lg.size[0]) // 2, (size - lg.size[1]) // 2), 0.14)
save(splash(2732), f'{OUT}/splash/splash-2732.png')
print('done')

# Google Play feature graphic (required, 1024 x 500): the full logo on the artwork's own satin
fg = glow(satin_from(logo, 0, 115, 1024, 500), (251, 236, 206), 0.85, 0.42, 0.40)
lw = 640; lg = logo.resize((lw, round(lw * 1024 / 1536)), Image.LANCZOS)
fg = feathered_paste(fg, lg, ((1024 - lw) // 2, (500 - lg.size[1]) // 2), 0.1)
fg.save(f'{OUT}/store/play-feature-graphic-1024x500.png', optimize=True)
print('feature graphic done')

# Wide header banner: the compact logo centred on its own satin, extended sideways so it can fill any header width
CROP = (110, 70, 1460, 915)
cl = logo.crop(CROP); H = 360; cw = round(cl.size[0] * H / cl.size[1]); cl = cl.resize((cw, H), Image.LANCZOS)
W = H * 18
base = satin_from(logo.crop((0, CROP[1], 1536, CROP[3])), 0, 112, W, H)
centre = tuple(int(v) for v in cl.resize((1, 1), Image.LANCZOS).getpixel((0, 0)))
base = glow(base, centre, 0.9, 0.8 * cw / W, 0.75)          # light the middle like the logo's own lit centre
m = Image.new('L', cl.size, 255); f = round(cw * 0.16); d = ImageDraw.Draw(m)
for x in range(f):
    v = round(255 * (x / f) ** 1.6)
    d.line((x, 0, x, H), fill=v); d.line((cw - 1 - x, 0, cw - 1 - x, H), fill=v)
base.paste(cl, ((W - cw) // 2, 0), m)
base.save(f'{OUT}/logo-banner-wide.jpg', quality=86, optimize=True, progressive=True)
print('banner done', base.size)
