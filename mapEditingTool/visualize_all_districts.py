#!/usr/bin/env python3
"""
Visualize all districts found by find_districts.py with their region numbers.
"""
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from collections import deque

madras_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/mapEditingTool/The-Madras-Presidency-with-its-26-districts-1-Anantapur-2-Bellary-3-Chingleput.png"
output_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/mapEditingTool/debug-all-regions-numbered.png"

madras_img = Image.open(madras_path).convert('RGB')
mW, mH = madras_img.size
pixels = np.array(madras_img)

def flood_fill_gray(pixels, seed_x, seed_y, w, h, visited):
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
            continue
        if r > 240 and g > 240 and b > 240:
            continue
        district_pixels.add((x, y))
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if (nx, ny) not in visited:
                queue.append((nx, ny))
    return district_pixels

print(f"Map size: {mW} x {mH}")
print("Finding all districts...\n")

visited = set()
districts = []

for y in range(0, mH, 3):
    for x in range(0, mW, 3):
        if (x, y) in visited:
            continue
        r, g, b = pixels[y, x]
        if 120 < r < 230 and 120 < g < 230 and 120 < b < 230:
            region = flood_fill_gray(pixels, x, y, mW, mH, visited)
            if len(region) > 200:
                cx = sum(p[0] for p in region) / len(region)
                cy = sum(p[1] for p in region) / len(region)
                districts.append({
                    'pixels': len(region),
                    'center': (int(cx), int(cy)),
                    'seed': (x, y),
                })

districts.sort(key=lambda d: (d['center'][1], d['center'][0]))

print(f"Found {len(districts)} regions")

# Create visualization
result_img = madras_img.copy()
draw = ImageDraw.Draw(result_img)

# Try to use a font, fallback to default
try:
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
except:
    font = ImageFont.load_default()

# Draw region numbers at centers
for i, d in enumerate(districts, 1):
    cx, cy = d['center']

    # Draw a circle at center
    draw.ellipse([cx-3, cy-3, cx+3, cy+3], fill='red', outline='red')

    # Draw region number
    text = str(i)
    # Get text bbox for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    # Draw text with white background
    draw.rectangle([cx - text_w//2 - 2, cy - text_h//2 - 2,
                    cx + text_w//2 + 2, cy + text_h//2 + 2],
                   fill='white', outline='black')
    draw.text((cx - text_w//2, cy - text_h//2), text, fill='red', font=font)

    print(f"Region {i:2d}: center ({cx:3d}, {cy:3d})")

result_img.save(output_path)
print(f"\nSaved to: {output_path}")
