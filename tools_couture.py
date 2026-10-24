# Gives the gold "Couture" script more definition and visible texture, without changing the lettering:
# local-contrast ("clarity") brings out the engraved gold texture and edges, and the more saturated gold
# is deepened slightly so it separates from the paler satin. Smooth satin is barely affected.
import numpy as np, colorsys
from PIL import Image, ImageFilter
SRC = 'brand-src/logo-original.png'; OUT = 'brand-src/logo-defined.png'
src = Image.open(SRC).convert('RGB')
clar = src.filter(ImageFilter.UnsharpMask(radius=7, percent=85, threshold=3)).filter(ImageFilter.UnsharpMask(radius=1.6, percent=90, threshold=2))
a = np.asarray(src).astype(np.float32) / 255; c = np.asarray(clar).astype(np.float32) / 255
mx = a.max(2); mn = a.min(2); sat = (mx - mn) / np.maximum(mx, 1e-3)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
goldish = ((r >= g) & (g >= b) & (r - b > 0.25)).astype(np.float32)
w = np.clip((sat - 0.36) / 0.18, 0, 1) * goldish            # 0 on pale satin, 1 on rich gold
H, W = sat.shape; yy, xx = np.mgrid[0:H, 0:W]
band = np.clip(1 - np.abs(yy - 600) / 260, 0, 1) ** 0.5      # strongest across the "Couture" band, fades out above and below
w = w * np.clip(band * 1.6, 0, 1)
w = np.asarray(Image.fromarray((w * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
deep = c * (1 - 0.22 * w[..., None])                           # deepen rich gold up to 16%
out = a * (1 - w[..., None]) + deep * w[..., None]
Image.fromarray(np.clip(out * 255, 0, 255).astype(np.uint8)).save(OUT, optimize=True)
print('ok')
