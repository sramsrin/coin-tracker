#!/usr/bin/env python3
"""
Scan the area around Arcot/Tanjore to find the peach pocket.
"""
from PIL import Image
import numpy as np

# Load the test-tanjore-overlay (which has Tanjore already drawn)
princely_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/princely-states.png"
princely_raw = Image.open(princely_path).convert('RGBA')
white_bg = Image.new('RGBA', princely_raw.size, (255, 255, 255, 255))
princely_img = Image.alpha_composite(white_bg, princely_raw).convert('RGB')
pixels = np.array(princely_img)
pW, pH = princely_img.size

# Wider scan to find peach pixels
print(f"Map size: {pW}x{pH}")
print("Scanning wider area for peach pixels (R>180, G>140, B>100, R>G>B)...\n")

# Scan in horizontal bands
for y_start in range(5000, 6200, 100):
    for x_start in range(3000, 4500, 100):
        count = 0
        for y in range(y_start, min(y_start+100, pH), 10):
            for x in range(x_start, min(x_start+100, pW), 10):
                r, g, b = pixels[y, x]
                if r > 180 and g > 140 and b > 100 and r > g and g > b:
                    count += 1
        if count > 0:
            # Sample the actual color
            sample_r, sample_g, sample_b = pixels[y_start+50, x_start+50] if y_start+50 < pH and x_start+50 < pW else (0,0,0)
            print(f"  Area ({x_start},{y_start})-({x_start+100},{y_start+100}): {count} peach pixels, sample RGB({sample_r},{sample_g},{sample_b})")

# Also check what colors exist around the known Arcot/Tanjore boundaries
print("\n--- Colors at specific points near the expected pocket ---")
test_points = [
    (3650, 5650), (3700, 5650), (3750, 5650), (3800, 5650),
    (3650, 5700), (3700, 5700), (3750, 5700), (3800, 5700),
    (3650, 5750), (3700, 5750), (3750, 5750), (3800, 5750),
    (3650, 5800), (3700, 5800), (3750, 5800), (3800, 5800),
    (3850, 5650), (3900, 5650), (3950, 5650), (4000, 5650),
    (3850, 5700), (3900, 5700), (3950, 5700), (4000, 5700),
    (3850, 5750), (3900, 5750), (3950, 5750), (4000, 5750),
]
for x, y in test_points:
    if x < pW and y < pH:
        r, g, b = pixels[y, x]
        label = ""
        if r == 0 and g == 190 and b == 180: label = " <- ARCOT"
        elif r == 255 and g == 200 and b == 180: label = " <- PEACH"
        elif r > 240 and g > 240 and b > 240: label = " <- WHITE"
        elif r == 220 and g == 120 and b == 50: label = " <- MADURAI"
        print(f"  ({x},{y}): RGB({r},{g},{b}){label}")
