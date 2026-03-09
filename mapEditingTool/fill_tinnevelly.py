#!/usr/bin/env python3
"""
Fill the southernmost region (Tinnevelly) with Arcot colors.
"""
from PIL import Image
import numpy as np
from collections import deque

# Arcot/Tinnevelly colors
TINNEVELLY_COLOR = (0, 190, 180)
TINNEVELLY_STRIPE = (0, 140, 130)

# Stripe settings
STRIPE_WIDTH = 6
STRIPE_SPACING = 18

# Load map
princely_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/princely-states.png"
output_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/princely-states.png"

princely_raw = Image.open(princely_path).convert('RGBA')
white_bg = Image.new('RGBA', princely_raw.size, (255, 255, 255, 255))
princely_img = Image.alpha_composite(white_bg, princely_raw).convert('RGB')

pW, pH = princely_img.size
print(f"Map size: {pW}x{pH}")

pixels = np.array(princely_img)

def flood_fill_color(pixels_arr, seed_x, seed_y, target_color, tolerance=15):
    """Flood fill matching a specific color."""
    h, w = pixels_arr.shape[:2]
    visited = set()
    region = set()
    queue = deque([(seed_x, seed_y)])
    tr, tg, tb = target_color

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        visited.add((x, y))

        r, g, b = pixels_arr[y, x]
        if abs(int(r) - tr) <= tolerance and abs(int(g) - tg) <= tolerance and abs(int(b) - tb) <= tolerance:
            region.add((x, y))
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if (nx, ny) not in visited:
                    queue.append((nx, ny))
    return region

# Fill the peach/tan region at the southernmost tip
print("Filling southernmost region (Tinnevelly)...")
PEACH = (200, 120, 100)
seed_x, seed_y = 3300, 6350

tinnevelly_region = flood_fill_color(pixels, seed_x, seed_y, PEACH, tolerance=20)
print(f"  Found region: {len(tinnevelly_region)} pixels")

if len(tinnevelly_region) > 100:
    # Apply Arcot colors with diagonal stripes
    for x, y in tinnevelly_region:
        if (x + y) % STRIPE_SPACING < STRIPE_WIDTH:
            pixels[y, x] = TINNEVELLY_STRIPE
        else:
            pixels[y, x] = TINNEVELLY_COLOR

    print(f"  Colored {len(tinnevelly_region)} pixels with Arcot colors")
    Image.fromarray(pixels).save(output_path)
    print(f"\nSaved to: {output_path}")
    print(f"  Fill: RGB{TINNEVELLY_COLOR}")
    print(f"  Stripe: RGB{TINNEVELLY_STRIPE}")
else:
    print("  Region too small, trying other seed points...")

    # Try other seeds
    seeds = [
        (3200, 6300),
        (3100, 6250),
        (3250, 6400),
    ]

    for sx, sy in seeds:
        if 0 <= sx < pW and 0 <= sy < pH:
            color = tuple(pixels[sy, sx])
            print(f"  Trying ({sx}, {sy}): RGB{color}")
            region = flood_fill_color(pixels, sx, sy, color, tolerance=20)
            if len(region) > 1000:
                print(f"    Found large region: {len(region)} pixels")
                for x, y in region:
                    if (x + y) % STRIPE_SPACING < STRIPE_WIDTH:
                        pixels[y, x] = TINNEVELLY_STRIPE
                    else:
                        pixels[y, x] = TINNEVELLY_COLOR
                Image.fromarray(pixels).save(output_path)
                print(f"\nSaved to: {output_path}")
                break
