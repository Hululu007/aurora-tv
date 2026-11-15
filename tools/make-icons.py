"""生成 Aurora TV 的应用图标（PNG + ICO）。

用法：
    python tools/make-icons.py
需要 Pillow。
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_ICONS = ROOT / "public" / "icons"
TAURI_ICONS = ROOT / "src-tauri" / "icons"

SIZE = 1024


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def make_master() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 圆角方形底
    radius = int(SIZE * 0.225)
    draw.rounded_rectangle((0, 0, SIZE - 1, SIZE - 1), radius=radius, fill=(9, 13, 20, 255))

    # 对角渐变（深海军蓝 → 深海青）
    gradient = Image.new("RGBA", (SIZE, SIZE))
    gdraw = ImageDraw.Draw(gradient)
    start = (18, 30, 48)
    mid = (28, 74, 86)
    for y in range(SIZE):
        t = y / (SIZE - 1)
        if t < 0.55:
            k = t / 0.55
            color = tuple(int(lerp(start[i], mid[i], k)) for i in range(3))
        else:
            k = (t - 0.55) / 0.45
            color = tuple(int(lerp(mid[i], (10, 14, 20)[i], k)) for i in range(3))
        gdraw.line([(0, y), (SIZE, y)], fill=(*color, 255))

    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, SIZE - 1, SIZE - 1), radius=radius, fill=255)
    img.paste(gradient, (0, 0), mask)

    # 顶部高光
    glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse(
        (-SIZE * 0.35, -SIZE * 0.55, SIZE * 0.9, SIZE * 0.45),
        fill=(120, 200, 220, 70),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(SIZE * 0.08))
    img = Image.alpha_composite(img, Image.composite(glow, Image.new("RGBA", (SIZE, SIZE)), mask))

    # 播放三角
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(layer)
    cx, cy = SIZE * 0.52, SIZE * 0.5
    r = SIZE * 0.235
    points = [
        (cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))
        for a in (-62, 62, 180)
    ]
    ldraw.polygon(points, fill=(245, 247, 250, 242))

    shadow = layer.filter(ImageFilter.GaussianBlur(SIZE * 0.035))
    shadow.putalpha(shadow.getchannel("A").point(lambda v: int(v * 0.55)))
    img = Image.alpha_composite(img, shadow)
    img = Image.alpha_composite(img, layer)

    # 细描边
    border = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(border).rounded_rectangle(
        (2, 2, SIZE - 3, SIZE - 3), radius=radius - 2, outline=(255, 255, 255, 34), width=4
    )
    return Image.alpha_composite(img, border)


def main() -> None:
    PUBLIC_ICONS.mkdir(parents=True, exist_ok=True)
    TAURI_ICONS.mkdir(parents=True, exist_ok=True)

    master = make_master()
    master.save(PUBLIC_ICONS / "icon-1024.png")

    png_sizes = {
        "32x32.png": 32,
        "128x128.png": 128,
        "128x128@2x.png": 256,
        "icon.png": 512,
        "icon-192.png": 192,
        "icon-512.png": 512,
        "apple-touch-icon.png": 180,
        "icon-180.png": 180,
    }
    for name, size in png_sizes.items():
        resized = master.resize((size, size), Image.LANCZOS)
        target = PUBLIC_ICONS if name.startswith(("icon-1", "icon-5", "apple")) else TAURI_ICONS
        if name in {"icon-192.png", "icon-512.png"}:
            resized.save(PUBLIC_ICONS / name)
        if name in {"apple-touch-icon.png", "icon-180.png"}:
            resized.save(PUBLIC_ICONS / name)
        resized.save(TAURI_ICONS / name)

    master.resize((512, 512), Image.LANCZOS).save(PUBLIC_ICONS / "icon-512.png")
    master.resize((192, 192), Image.LANCZOS).save(PUBLIC_ICONS / "icon-192.png")
    master.resize((180, 180), Image.LANCZOS).save(PUBLIC_ICONS / "apple-touch-icon.png")

    ico = master.resize((256, 256), Image.LANCZOS)
    ico.save(
        TAURI_ICONS / "icon.ico",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    print("icons written to", PUBLIC_ICONS, "and", TAURI_ICONS)


if __name__ == "__main__":
    main()
