#!/usr/bin/env python3
"""
Extract district 22 (Tinnevelly) from the Madras Presidency map,
overlay onto the princely states map with Arcot colors.
"""
from PIL import Image
import numpy as np
from collections import deque

# --- Config (from user's alignment session) ---
OVERLAY_X = 2470
OVERLAY_Y = 3410
OVERLAY_SCALE = 3.6

# Arcot/Tinnevelly colors (same as Arcot)
TINNEVELLY_COLOR = (0, 190, 180)
TINNEVELLY_STRIPE = (0, 140, 130)
TINNEVELLY_BOUNDARY = (0, 100, 95)

# Diagonal stripe settings (in output map pixels)
STRIPE_WIDTH = 6
STRIPE_SPACING = 18

DOT_LENGTH = 4
GAP_LENGTH = 3

# --- Load images ---
madras_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/mapEditingTool/The-Madras-Presidency-with-its-26-districts-1-Anantapur-2-Bellary-3-Chingleput.png"
princely_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/princely-states.png"
output_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/mapEditingTool/test-tinnevelly-overlay.png"

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

# --- Extract district 22 (Tinnevelly) ---
# Seed point from find_districts.py scan - region #22 with center (321, 607)
print("\nExtracting district 22 (Tinnevelly)...")
d22_pixels = flood_fill_gray(madras_pixels, 318, 573, mW, mH)
print(f"  Initial flood fill: {len(d22_pixels)} px")

d22_pixels, a22 = fill_holes_fast(d22_pixels)
d22_boundary = get_boundary(d22_pixels)
print(f"  After hole filling: {len(d22_pixels)} px (+{a22} holes filled)")
print(f"  Boundary: {len(d22_boundary)} px")

# Calculate center for verification
if d22_pixels:
    cx = sum(p[0] for p in d22_pixels) / len(d22_pixels)
    cy = sum(p[1] for p in d22_pixels) / len(d22_pixels)
    print(f"  Center: ({int(cx)}, {int(cy)})")

# --- Draw on map ---
print("\nDrawing Tinnevelly on princely states map...")
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

draw_district_hatched(d22_pixels, d22_boundary, TINNEVELLY_COLOR, TINNEVELLY_STRIPE, TINNEVELLY_BOUNDARY)

Image.fromarray(result_pixels).save(output_path)
print(f"\nSaved to: {output_path}")
print(f"  Tinnevelly: RGB{TINNEVELLY_COLOR} with stripes RGB{TINNEVELLY_STRIPE}")
