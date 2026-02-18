#!/usr/bin/env python3
"""
Debug script to find all distinct gray regions (districts) in the Madras map
and their approximate center positions, to correctly identify districts 16 and 19.
"""
from PIL import Image
import numpy as np
from collections import deque

madras_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/mapEditingTool/The-Madras-Presidency-with-its-26-districts-1-Anantapur-2-Bellary-3-Chingleput.png"
madras_img = Image.open(madras_path).convert('RGB')
mW, mH = madras_img.size
pixels = np.array(madras_img)

def flood_fill_gray(pixels, seed_x, seed_y, w, h, visited):
    """Flood fill collecting gray interior pixels, stopping at dark boundaries."""
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
            continue  # Boundary
        if r > 240 and g > 240 and b > 240:
            continue  # White bg

        district_pixels.add((x, y))
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if (nx, ny) not in visited:
                queue.append((nx, ny))

    return district_pixels

# Find all districts by scanning the image
print(f"Map size: {mW} x {mH}")
print("Finding all distinct gray regions...\n")

visited = set()
districts = []

for y in range(0, mH, 3):
    for x in range(0, mW, 3):
        if (x, y) in visited:
            continue
        r, g, b = pixels[y, x]
        if 120 < r < 230 and 120 < g < 230 and 120 < b < 230:
            region = flood_fill_gray(pixels, x, y, mW, mH, visited)
            if len(region) > 200:  # Only meaningful regions
                # Calculate center
                cx = sum(p[0] for p in region) / len(region)
                cy = sum(p[1] for p in region) / len(region)
                # Bounding box
                min_x = min(p[0] for p in region)
                max_x = max(p[0] for p in region)
                min_y = min(p[1] for p in region)
                max_y = max(p[1] for p in region)
                districts.append({
                    'pixels': len(region),
                    'center': (int(cx), int(cy)),
                    'bbox': (min_x, min_y, max_x, max_y),
                    'seed': (x, y),
                })

# Sort by y position (top to bottom), then x
districts.sort(key=lambda d: (d['center'][1], d['center'][0]))

print(f"Found {len(districts)} distinct regions:\n")
print(f"{'#':>3} {'Pixels':>8} {'Center':>14} {'BBox':>30} {'Seed':>14}")
print("-" * 80)
for i, d in enumerate(districts, 1):
    bbox = f"({d['bbox'][0]},{d['bbox'][1]})-({d['bbox'][2]},{d['bbox'][3]})"
    print(f"{i:3d} {d['pixels']:8d} ({d['center'][0]:4d},{d['center'][1]:4d}) {bbox:>30} ({d['seed'][0]:4d},{d['seed'][1]:4d})")
