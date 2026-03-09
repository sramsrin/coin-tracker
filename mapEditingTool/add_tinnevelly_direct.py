#!/usr/bin/env python3
"""
Directly color the southernmost region (Tinnevelly) on the princely states map.
Below Sivagangai, east of Travancore, southernmost tip of India.
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

# Load current map
princely_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/princely-states.png"
output_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/mapEditingTool/test-tinnevelly-direct.png"

princely_raw = Image.open(princely_path).convert('RGBA')
white_bg = Image.new('RGBA', princely_raw.size, (255, 255, 255, 255))
princely_img = Image.alpha_composite(white_bg, princely_raw).convert('RGB')

pW, pH = princely_img.size
print(f"Princely map: {pW}x{pH}")

pixels = np.array(princely_img)

def flood_fill_color(pixels_arr, seed_x, seed_y, target_color, tolerance=10):
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

# First, let's find what color is at the southernmost tip
# Approximate coordinates for southernmost region (below Sivagangai, east of Travancore)
# This should be around x=3000-3500, y=6200-6400 (very south)

print("\nScanning southernmost region for existing color...")
print("Please check the map and provide seed coordinates, or I'll try some guesses:")

# Try a few seed points in the southernmost area
test_seeds = [
    (3200, 6300, "far south center"),
    (3100, 6250, "south-central"),
    (3300, 6350, "southeast tip"),
    (3000, 6200, "south-west"),
]

for seed_x, seed_y, desc in test_seeds:
    if 0 <= seed_x < pW and 0 <= seed_y < pH:
        r, g, b = pixels[seed_y, seed_x]
        print(f"  {desc} ({seed_x}, {seed_y}): RGB({r}, {g}, {b})")

print("\nPlease provide the correct seed coordinates (x, y) for Tinnevelly region,")
print("or I can try to automatically find the peach/light colored region in the south.")
