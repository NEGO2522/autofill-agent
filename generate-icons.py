"""
AutoSlay — Icon Generator
Run this once from the project root to create the PNG icons needed by Chrome extensions.

Usage:
    python generate-icons.py

Outputs:
    public/icon16.png
    public/icon48.png
    public/icon128.png
    dist/icon16.png
    dist/icon48.png
    dist/icon128.png
"""

import struct, zlib, math, os

def make_icon_png(size):
    """White rounded-square with black lightning bolt. Pure Python, no dependencies."""
    pad  = max(1, size // 8)
    cr   = max(1, size // 5)
    x0, y0 = pad, pad
    x1, y1 = size - pad, size - pad

    def in_white_square(px, py):
        if not (x0 <= px < x1 and y0 <= py < y1):
            return False
        rx, ry = px - x0, py - y0
        w, h   = x1 - x0, y1 - y0
        in_corner = (rx < cr and ry < cr) or (rx >= w-cr and ry < cr) or \
                    (rx < cr and ry >= h-cr) or (rx >= w-cr and ry >= h-cr)
        if not in_corner:
            return True
        cx = cr if rx < cr else w - cr - 1
        cy = cr if ry < cr else h - cr - 1
        return math.hypot(rx - cx, ry - cy) <= cr

    def on_bolt(px, py):
        w, h = x1 - x0, y1 - y0
        fx = (px - x0) / w
        fy = (py - y0) / h
        bw = 0.11
        # Top arm
        if 0.07 <= fy <= 0.53:
            t  = (fy - 0.07) / (0.53 - 0.07)
            lx = 0.63 + t * (0.30 - 0.63)
            if abs(fx - lx) < bw:
                return True
        # Bottom arm
        if 0.47 <= fy <= 0.93:
            t  = (fy - 0.47) / (0.93 - 0.47)
            lx = 0.70 + t * (0.37 - 0.70)
            if abs(fx - lx) < bw:
                return True
        return False

    rows = []
    for y in range(size):
        row = []
        for x in range(size):
            if in_white_square(x, y):
                row += [8, 8, 8, 255] if on_bolt(x, y) else [255, 255, 255, 255]
            else:
                row += [8, 8, 8, 255]
        rows.append(row)

    def chunk(tag, data):
        t = tag if isinstance(tag, bytes) else tag.encode()
        return struct.pack('>I', len(data)) + t + data + struct.pack('>I', zlib.crc32(t + data) & 0xFFFFFFFF)

    ihdr = struct.pack('>II', size, size) + bytes([8, 6, 0, 0, 0])
    raw  = bytearray()
    for row in rows:
        raw.append(0)
        raw.extend(row)

    return b'\x89PNG\r\n\x1a\n' + chunk('IHDR', ihdr) + chunk('IDAT', zlib.compress(bytes(raw), 9)) + chunk('IEND', b'')


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    targets = [
        os.path.join(script_dir, "public"),
        os.path.join(script_dir, "dist"),
    ]
    for folder in targets:
        if not os.path.isdir(folder):
            print(f"Skipping {folder} (does not exist)")
            continue
        for size in [16, 48, 128]:
            path = os.path.join(folder, f"icon{size}.png")
            data = make_icon_png(size)
            with open(path, "wb") as f:
                f.write(data)
            print(f"✅  Written  {path}  ({len(data)} bytes)")

    print("\nDone! Now re-run 'npm run build' then reload the extension in Chrome.")
