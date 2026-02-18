#!/usr/bin/env python3
"""
Extract districts 26 (Madurai) and 17 (Ramnad) from the Madras Presidency map,
fill with unique colors with diagonal stripe hatching, and overlay onto the princely states map.
Also re-draw Arcot (districts 16 & 19) with the same hatching treatment.
All three are visually distinguished as annexed Madras Presidency territories.
"""
from PIL import Image
import numpy as np
from collections import deque

# --- Config ---
OVERLAY_X = 2576
OVERLAY_Y = 3694
OVERLAY_SCALE = 3.2

# Colors
ARCOT_COLOR = (0, 190, 180)
ARCOT_BOUNDARY = (0, 100, 95)
ARCOT_STRIPE = (0, 140, 130)

MADURAI_COLOR = (220, 120, 50)
MADURAI_BOUNDARY = (160, 80, 30)
MADURAI_STRIPE = (170, 85, 30)

RAMNAD_COLOR = (50, 140, 220)
RAMNAD_BOUNDARY = (30, 90, 160)
RAMNAD_STRIPE = (30, 100, 170)

# Diagonal stripe settings (in output map pixels)
STRIPE_WIDTH = 6      # width of the darker stripe
STRIPE_SPACING = 18   # distance between stripe centers

DOT_LENGTH = 4
GAP_LENGTH = 3

# --- Load images ---
madras_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/mapEditingTool/The-Madras-Presidency-with-its-26-districts-1-Anantapur-2-Bellary-3-Chingleput.png"
princely_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/princely-states.png"
output_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/mapEditingTool/test-madurai-ramnad-overlay.png"

madras_img = Image.open(madras_path).convert('RGB')
princely_raw = Image.open(princely_path).convert('RGBA')
white_bg = Image.new('RGBA', princely_raw.size, (255, 255, 255, 255))
princely_img = Image.alpha_composite(white_bg, princely_raw).convert('RGB')

mW, mH = madras_img.size
pW, pH = princely_img.size
madras_pixels = np.array(madras_img)
print(f"Madras: {mW}x{mH}, Princely: {pW}x{pH}")

# --- Flood fill ---
def flood_fill_gray(pixels, seed_x, seed_y, w, h):
    visited = set()
    district = set()
    queue = deque([(seed_x, seed_y)])
    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        visited.add((x, y))
        r, g, b = pixels[y, x]
        if r < 100 and g < 100 and b < 100:
            continue
        if r > 240 and g > 240 and b > 240:
            continue
        district.add((x, y))
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if (nx, ny) not in visited:
                queue.append((nx, ny))
    return district

def fill_holes_fast(district_set):
    if not district_set:
        return district_set, 0
    min_x = min(p[0] for p in district_set)
    max_x = max(p[0] for p in district_set)
    min_y = min(p[1] for p in district_set)
    max_y = max(p[1] for p in district_set)
    w = max_x - min_x + 3
    h = max_y - min_y + 3
    mask = np.zeros((h, w), dtype=bool)
    for x, y in district_set:
        mask[y - min_y + 1, x - min_x + 1] = True
    exterior = np.zeros_like(mask)
    queue = deque()
    for x in range(w):
        if not mask[0, x]: queue.append((x, 0))
        if not mask[h-1, x]: queue.append((x, h-1))
    for y in range(h):
        if not mask[y, 0]: queue.append((0, y))
        if not mask[y, w-1]: queue.append((w-1, y))
    while queue:
        x, y = queue.popleft()
        if x < 0 or x >= w or y < 0 or y >= h: continue
        if exterior[y, x] or mask[y, x]: continue
        exterior[y, x] = True
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            queue.append((x + dx, y + dy))
    interior = ~mask & ~exterior
    added = 0
    filled = set(district_set)
    for y in range(h):
        for x in range(w):
            if interior[y, x]:
                filled.add((x + min_x - 1, y + min_y - 1))
                added += 1
    return filled, added

def get_boundary(pixels_set):
    boundary = set()
    for x, y in pixels_set:
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            if (x + dx, y + dy) not in pixels_set:
                boundary.add((x, y))
                break
    return boundary

# --- Extract Arcot (districts 16 & 19) ---
print("\nExtracting Arcot districts (16 & 19)...")
d16_pixels = flood_fill_gray(madras_pixels, 330, 534, mW, mH)
d19_pixels = flood_fill_gray(madras_pixels, 318, 573, mW, mH)
d16_pixels, a16 = fill_holes_fast(d16_pixels)
d19_pixels, a19 = fill_holes_fast(d19_pixels)
arcot_pixels = d16_pixels | d19_pixels
arcot_boundary = get_boundary(arcot_pixels)
print(f"  District 16: {len(d16_pixels)} px (+{a16} holes filled)")
print(f"  District 19: {len(d19_pixels)} px (+{a19} holes filled)")
print(f"  Combined Arcot: {len(arcot_pixels)} px, boundary: {len(arcot_boundary)} px")

# --- Extract Madurai (26) and Ramnad (17) ---
print("\nScanning southern regions for Madurai & Ramnad...")
all_visited = set()
southern_regions = []

for sy in range(650, 850, 3):
    for sx in range(100, 350, 3):
        if (sx, sy) in all_visited:
            continue
        r, g, b = madras_pixels[sy, sx]
        if 120 < r < 230:
            result = flood_fill_gray(madras_pixels, sx, sy, mW, mH)
            all_visited |= result
            if len(result) > 500:
                cx = sum(p[0] for p in result) / len(result)
                cy = sum(p[1] for p in result) / len(result)
                southern_regions.append({
                    'pixels': result,
                    'size': len(result),
                    'center': (int(cx), int(cy)),
                    'seed': (sx, sy)
                })

southern_regions.sort(key=lambda r: (r['center'][1], r['center'][0]))

district_26 = None
district_17 = None
for r in southern_regions:
    cx, cy = r['center']
    if district_26 is None and 150 < cx < 250 and 680 < cy < 760 and r['size'] > 1500:
        district_26 = r
        print(f"  District 26 (Madurai): {r['size']} px, center {r['center']}")
    elif district_17 is None and cx > 200 and 720 < cy < 810 and r['size'] > 1500 and r != district_26:
        district_17 = r
        print(f"  District 17 (Ramnad): {r['size']} px, center {r['center']}")

if district_26 is None or district_17 is None:
    candidates = [r for r in southern_regions if r['size'] > 1500]
    if district_26 is None and len(candidates) >= 1:
        district_26 = candidates[0]
    if district_17 is None and len(candidates) >= 2:
        district_17 = candidates[1]

d26_pixels = district_26['pixels'] if district_26 else set()
d17_pixels = district_17['pixels'] if district_17 else set()

d26_pixels, a26 = fill_holes_fast(d26_pixels)
d17_pixels, a17 = fill_holes_fast(d17_pixels)
b26 = get_boundary(d26_pixels)
b17 = get_boundary(d17_pixels)
print(f"  Madurai filled: {len(d26_pixels)} px (+{a26} holes)")
print(f"  Ramnad filled: {len(d17_pixels)} px (+{a17} holes)")

# --- Draw on map with diagonal stripe hatching ---
print("\nDrawing on princely states map with stripe hatching...")
result_pixels = np.array(princely_img)

def draw_district_hatched(pixels_set, boundary_set, fill_color, stripe_color, border_color):
    """Draw a district with solid fill + diagonal stripe hatching + dotted boundary."""
    fill_arr = np.array(fill_color)
    stripe_arr = np.array(stripe_color)

    for mx, my in pixels_set:
        px_s = int(OVERLAY_X + mx * OVERLAY_SCALE)
        py_s = int(OVERLAY_Y + my * OVERLAY_SCALE)
        px_e = int(OVERLAY_X + (mx + 1) * OVERLAY_SCALE)
        py_e = int(OVERLAY_Y + (my + 1) * OVERLAY_SCALE)
        px_s = max(0, px_s); py_s = max(0, py_s)
        px_e = min(pW, px_e); py_e = min(pH, py_e)
        result_pixels[py_s:py_e, px_s:px_e] = fill_color

    # Apply diagonal stripes (45-degree lines) over the filled area
    # A pixel is on a stripe if (px + py) mod STRIPE_SPACING < STRIPE_WIDTH
    for mx, my in pixels_set:
        px_s = int(OVERLAY_X + mx * OVERLAY_SCALE)
        py_s = int(OVERLAY_Y + my * OVERLAY_SCALE)
        px_e = int(OVERLAY_X + (mx + 1) * OVERLAY_SCALE)
        py_e = int(OVERLAY_Y + (my + 1) * OVERLAY_SCALE)
        px_s = max(0, px_s); py_s = max(0, py_s)
        px_e = min(pW, px_e); py_e = min(pH, py_e)

        for py in range(py_s, py_e):
            for px in range(px_s, px_e):
                if (px + py) % STRIPE_SPACING < STRIPE_WIDTH:
                    result_pixels[py, px] = stripe_color

    # Draw dotted boundary
    boundary_list = sorted(boundary_set, key=lambda p: (p[1], p[0]))
    for idx, (mx, my) in enumerate(boundary_list):
        if idx % (DOT_LENGTH + GAP_LENGTH) >= DOT_LENGTH:
            continue
        px_s = max(0, int(OVERLAY_X + mx * OVERLAY_SCALE) - 1)
        py_s = max(0, int(OVERLAY_Y + my * OVERLAY_SCALE) - 1)
        px_e = min(pW, int(OVERLAY_X + (mx + 1) * OVERLAY_SCALE) + 1)
        py_e = min(pH, int(OVERLAY_Y + (my + 1) * OVERLAY_SCALE) + 1)
        result_pixels[py_s:py_e, px_s:px_e] = border_color

draw_district_hatched(arcot_pixels, arcot_boundary, ARCOT_COLOR, ARCOT_STRIPE, ARCOT_BOUNDARY)
draw_district_hatched(d26_pixels, b26, MADURAI_COLOR, MADURAI_STRIPE, MADURAI_BOUNDARY)
draw_district_hatched(d17_pixels, b17, RAMNAD_COLOR, RAMNAD_STRIPE, RAMNAD_BOUNDARY)

Image.fromarray(result_pixels).save(output_path)
print(f"\n✓ Saved to: {output_path}")
print(f"  Arcot:   RGB{ARCOT_COLOR} with stripes RGB{ARCOT_STRIPE}")
print(f"  Madurai: RGB{MADURAI_COLOR} with stripes RGB{MADURAI_STRIPE}")
print(f"  Ramnad:  RGB{RAMNAD_COLOR} with stripes RGB{RAMNAD_STRIPE}")
