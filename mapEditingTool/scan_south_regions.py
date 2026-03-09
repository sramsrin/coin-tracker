#!/usr/bin/env python3
"""
Scan the southernmost area to find all distinct colored regions.
"""
from PIL import Image
import numpy as np
from collections import deque

princely_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/princely-states.png"

princely_raw = Image.open(princely_path).convert('RGBA')
white_bg = Image.new('RGBA', princely_raw.size, (255, 255, 255, 255))
princely_img = Image.alpha_composite(white_bg, princely_raw).convert('RGB')

pW, pH = princely_img.size
pixels = np.array(princely_img)

def flood_fill_any(pixels_arr, seed_x, seed_y, visited):
    """Flood fill any contiguous region."""
    h, w = pixels_arr.shape[:2]
    region = set()
    queue = deque([(seed_x, seed_y)])
    target = tuple(pixels_arr[seed_y, seed_x])

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        visited.add((x, y))

        current = tuple(pixels_arr[y, x])
        # Match color with tolerance
        if all(abs(c1 - c2) <= 15 for c1, c2 in zip(current, target)):
            region.add((x, y))
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if (nx, ny) not in visited:
                    queue.append((nx, ny))
    return region, target

# Scan southern portion (bottom 1000 pixels, x from 2500 to 4000)
print("Scanning southernmost area (y > 5800, x: 2500-4000)...")
visited = set()
regions = []

for y in range(5800, pH, 50):
    for x in range(2500, 4000, 50):
        if (x, y) not in visited:
            region, color = flood_fill_any(pixels, x, y, visited)
            if len(region) > 500:  # Only meaningful regions
                cx = sum(p[0] for p in region) / len(region)
                cy = sum(p[1] for p in region) / len(region)
                regions.append({
                    'size': len(region),
                    'center': (int(cx), int(cy)),
                    'seed': (x, y),
                    'color': color
                })

regions.sort(key=lambda r: r['size'], reverse=True)

print(f"\nFound {len(regions)} regions:\n")
print(f"{'Size':>8}  {'Center':>15}  {'Seed':>15}  {'Color'}")
print("-" * 70)
for r in regions[:10]:  # Show top 10
    print(f"{r['size']:8d}  ({r['center'][0]:5d},{r['center'][1]:5d})  ({r['seed'][0]:5d},{r['seed'][1]:5d})  RGB{r['color']}")
