#!/usr/bin/env python3
"""
Extract district 21 (Tanjore) and extend Arcot with its eastern coastal strip
from the Madras Presidency map, overlay onto the princely states map.
"""
from PIL import Image
import numpy as np
from collections import deque

# --- Config (from user's alignment session) ---
OVERLAY_X = 2470
OVERLAY_Y = 3410
OVERLAY_SCALE = 3.6

# Tanjore color - bright hot pink for maximum visibility
TANJORE_COLOR = (255, 50, 120)
TANJORE_STRIPE = (200, 35, 90)
TANJORE_BOUNDARY = (155, 25, 65)

# Arcot colors (same as existing)
ARCOT_COLOR = (0, 190, 180)
ARCOT_STRIPE = (0, 140, 130)
ARCOT_BOUNDARY = (0, 100, 95)

# Diagonal stripe settings (in output map pixels)
STRIPE_WIDTH = 6
STRIPE_SPACING = 18

DOT_LENGTH = 4
GAP_LENGTH = 3

# --- Load images ---
madras_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/mapEditingTool/The-Madras-Presidency-with-its-26-districts-1-Anantapur-2-Bellary-3-Chingleput.png"
princely_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/princely-states.png"
output_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/mapEditingTool/test-tanjore-overlay.png"

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

# --- Extract district 21 (Tanjore) ---
# Seed point from find_districts.py scan - region with center (326, 674)
print("\nExtracting district 21 (Tanjore)...")
d21_pixels = flood_fill_gray(madras_pixels, 345, 636, mW, mH)
print(f"  Initial flood fill: {len(d21_pixels)} px")

d21_pixels, a21 = fill_holes_fast(d21_pixels)
d21_boundary = get_boundary(d21_pixels)
print(f"  After hole filling: {len(d21_pixels)} px (+{a21} holes filled)")
print(f"  Boundary: {len(d21_boundary)} px")

# Calculate center for verification
if d21_pixels:
    cx = sum(p[0] for p in d21_pixels) / len(d21_pixels)
    cy = sum(p[1] for p in d21_pixels) / len(d21_pixels)
    print(f"  Center: ({int(cx)}, {int(cy)})")

# --- Draw on map ---
print("\nDrawing Tanjore on princely states map...")
result_pixels = np.array(princely_img)

def draw_district_hatched(pixels_set, boundary_set, fill_color, stripe_color, border_color):
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

    # Apply diagonal stripes
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

draw_district_hatched(d21_pixels, d21_boundary, TANJORE_COLOR, TANJORE_STRIPE, TANJORE_BOUNDARY)

# --- Extend Arcot: flood fill the peach region on the princely map ---
# Small peach region RGB(255,200,180) between South Arcot, Tanjore, and the coast
print("\nExtending Arcot - filling peach coastal region...")
PEACH = (255, 200, 180)
TOLERANCE = 10

def flood_fill_color_bounded(pixels_arr, seed_x, seed_y, target_color, tol, bounds):
    """Flood fill on the princely map matching a specific color within bounds."""
    bx1, by1, bx2, by2 = bounds
    visited = set()
    region = set()
    queue = deque([(seed_x, seed_y)])
    tr, tg, tb = target_color
    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
        if x < bx1 or x >= bx2 or y < by1 or y >= by2:
            continue
        visited.add((x, y))
        r, g, b = pixels_arr[y, x]
        if abs(int(r) - tr) <= tol and abs(int(g) - tg) <= tol and abs(int(b) - tb) <= tol:
            region.add((x, y))
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if (nx, ny) not in visited:
                    queue.append((nx, ny))
    return region

# Tight bounds around the peach pocket east of Arcot, above Tanjore, west of coast
SEARCH_BOUNDS = (3600, 5550, 3800, 5850)
peach_region = flood_fill_color_bounded(result_pixels, 3700, 5700, PEACH, TOLERANCE, SEARCH_BOUNDS)
print(f"  Peach region: {len(peach_region)} px")

if peach_region:
    # Fill with Arcot colors directly on the princely map pixels (no boundary)
    for x, y in peach_region:
        if (x + y) % STRIPE_SPACING < STRIPE_WIDTH:
            result_pixels[y, x] = ARCOT_STRIPE
        else:
            result_pixels[y, x] = ARCOT_COLOR
    print(f"  Colored as Arcot (contiguous, no boundary)")

Image.fromarray(result_pixels).save(output_path)
print(f"\nSaved to: {output_path}")
print(f"  Tanjore: RGB{TANJORE_COLOR} with stripes RGB{TANJORE_STRIPE}")
print(f"  Arcot extension: RGB{ARCOT_COLOR} with stripes RGB{ARCOT_STRIPE}")
