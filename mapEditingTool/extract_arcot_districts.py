#!/usr/bin/env python3
"""
Extract districts 16 (North Arcot) and 19 (South Arcot) from the Madras Presidency map,
remove the number labels, fill with a unique color, and overlay onto the princely states map.
"""
from PIL import Image, ImageDraw
import numpy as np
from collections import deque

# --- Config from alignment tool ---
OVERLAY_X = 2576
OVERLAY_Y = 3694
OVERLAY_SCALE = 3.2

# Unique color for Arcot - teal/cyan: RGB(0, 190, 180)
ARCOT_COLOR = (0, 190, 180)
ARCOT_BOUNDARY_COLOR = (0, 100, 95)

# --- Load images ---
madras_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/mapEditingTool/The-Madras-Presidency-with-its-26-districts-1-Anantapur-2-Bellary-3-Chingleput.png"
princely_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/princely-states.png"
output_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/mapEditingTool/test-arcot-overlay.png"

madras_img = Image.open(madras_path).convert('RGB')
princely_raw = Image.open(princely_path).convert('RGBA')
white_bg = Image.new('RGBA', princely_raw.size, (255, 255, 255, 255))
princely_img = Image.alpha_composite(white_bg, princely_raw).convert('RGB')

mW, mH = madras_img.size
pW, pH = princely_img.size
print(f"Madras map: {mW} x {mH}")
print(f"Princely map: {pW} x {pH}")

madras_pixels = np.array(madras_img)

# --- Flood fill that STOPS at dark boundaries ---
def flood_fill_gray(pixels, seed_x, seed_y, w, h):
    """Flood fill collecting only non-dark, non-white pixels. Stops at dark boundaries."""
    visited = set()
    district_pixels = set()
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
            continue  # Boundary - stop
        if r > 240 and g > 240 and b > 240:
            continue  # White background - stop

        district_pixels.add((x, y))

        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if (nx, ny) not in visited:
                queue.append((nx, ny))

    return district_pixels

# --- Fill districts ---
# Region #20: center (307,561), seed (330,534) -> District 16
# Region #22: center (321,607), seed (318,573) -> District 19

print("\nFilling district 16...")
district_16 = flood_fill_gray(madras_pixels, 330, 534, mW, mH)
print(f"  District 16: {len(district_16)} pixels")

print("Filling district 19...")
district_19 = flood_fill_gray(madras_pixels, 318, 573, mW, mH)
print(f"  District 19: {len(district_19)} pixels")

arcot_pixels = district_16 | district_19

# --- Fill holes (dark text pixels like "16" and "19" inside districts) ---
print("Filling holes (number text inside districts)...")

# Find bounding box of each district and fill any enclosed dark/white pixels
def fill_holes(district_set, pixels, w, h):
    """Fill dark and white pixels that are fully enclosed within the district."""
    if not district_set:
        return district_set

    # Get bounding box
    min_x = min(p[0] for p in district_set)
    max_x = max(p[0] for p in district_set)
    min_y = min(p[1] for p in district_set)
    max_y = max(p[1] for p in district_set)

    filled = set(district_set)

    # For each non-district pixel inside the bounding box, check if it's enclosed
    for y in range(min_y, max_y + 1):
        for x in range(min_x, max_x + 1):
            if (x, y) in filled:
                continue

            # Flood fill from this pixel - if it can reach the bounding box edge
            # without crossing district pixels, it's outside. Otherwise it's a hole.
            visited = set()
            queue = deque([(x, y)])
            hole_pixels = set()
            is_enclosed = True

            while queue and is_enclosed:
                cx, cy = queue.popleft()
                if (cx, cy) in visited:
                    continue
                if (cx, cy) in filled:
                    continue  # Hit district boundary, don't expand
                visited.add((cx, cy))
                hole_pixels.add((cx, cy))

                # If we reached the bounding box edge, it's not enclosed
                if cx <= min_x or cx >= max_x or cy <= min_y or cy >= max_y:
                    is_enclosed = False
                    break

                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = cx + dx, cy + dy
                    if (nx, ny) not in visited and (nx, ny) not in filled:
                        queue.append((nx, ny))

            if is_enclosed and len(hole_pixels) < 500:  # Small holes = text
                filled |= hole_pixels

    added = len(filled) - len(district_set)
    return filled, added

district_16_filled, added_16 = fill_holes(district_16, madras_pixels, mW, mH)
print(f"  District 16: filled {added_16} hole pixels")

district_19_filled, added_19 = fill_holes(district_19, madras_pixels, mW, mH)
print(f"  District 19: filled {added_19} hole pixels")

arcot_pixels = district_16_filled | district_19_filled
print(f"Combined Arcot: {len(arcot_pixels)} pixels")

# --- Find outer boundary ---
print("Finding outer boundary...")
boundary = set()
for x, y in arcot_pixels:
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nx, ny = x + dx, y + dy
        if (nx, ny) not in arcot_pixels:
            boundary.add((x, y))
            break

print(f"Boundary pixels: {len(boundary)}")

# --- Draw on princely states map ---
print("Drawing on princely states map...")
result = princely_img.copy()
result_pixels = np.array(result)

# Fill entire interior with teal (including former text areas)
for mx, my in arcot_pixels:
    px_start = int(OVERLAY_X + mx * OVERLAY_SCALE)
    py_start = int(OVERLAY_Y + my * OVERLAY_SCALE)
    px_end = int(OVERLAY_X + (mx + 1) * OVERLAY_SCALE)
    py_end = int(OVERLAY_Y + (my + 1) * OVERLAY_SCALE)

    for fpx in range(max(0, px_start), min(pW, px_end)):
        for fpy in range(max(0, py_start), min(pH, py_end)):
            result_pixels[fpy, fpx] = ARCOT_COLOR

# Draw dotted boundary
# Convert boundary pixels to a sorted order for dotted line effect
# We use a simple approach: only draw every other boundary pixel (checkerboard pattern)
DOT_LENGTH = 4  # pixels on
GAP_LENGTH = 3  # pixels off

boundary_list = sorted(boundary, key=lambda p: (p[1], p[0]))
for idx, (mx, my) in enumerate(boundary_list):
    # Create dotted effect based on index
    cycle_pos = idx % (DOT_LENGTH + GAP_LENGTH)
    if cycle_pos >= DOT_LENGTH:
        continue  # This is a gap, skip

    px_start = int(OVERLAY_X + mx * OVERLAY_SCALE) - 1
    py_start = int(OVERLAY_Y + my * OVERLAY_SCALE) - 1
    px_end = int(OVERLAY_X + (mx + 1) * OVERLAY_SCALE) + 1
    py_end = int(OVERLAY_Y + (my + 1) * OVERLAY_SCALE) + 1

    for fpx in range(max(0, px_start), min(pW, px_end)):
        for fpy in range(max(0, py_start), min(pH, py_end)):
            result_pixels[fpy, fpx] = ARCOT_BOUNDARY_COLOR

# Save
result_img = Image.fromarray(result_pixels)
result_img.save(output_path)
print(f"\n✓ Saved to: {output_path}")
print(f"  Arcot fill: RGB{ARCOT_COLOR}")
print(f"  Dotted boundary: RGB{ARCOT_BOUNDARY_COLOR}")
