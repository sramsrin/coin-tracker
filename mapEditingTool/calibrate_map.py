#!/usr/bin/env python3
"""
Analyze the princely-states-outline map to find coastline pixel positions
for calibration.
"""
from PIL import Image
import numpy as np

img = Image.open("/Users/sahanavasanth/Desktop/mapEditingTool/princely-states-outline.png")
pixels = np.array(img)
W, H = img.size
print(f"Image size: {W} x {H}")

# The map has gray/black lines on white background
# A "map pixel" is one that is NOT pure white (or near-white)
# Let's find the coastline by scanning rows and finding the leftmost/rightmost
# non-white pixels (which are the map boundary)

def is_map_pixel(r, g, b, threshold=240):
    """Return True if this pixel is part of the map (not white background)."""
    return r < threshold or g < threshold or b < threshold

# Scan several horizontal rows to find east and west coastline positions
# We'll check at various y positions (corresponding to different latitudes)

print("\n--- Scanning for coastline positions ---")
print(f"{'Row (y)':>10} {'Left coast (x)':>15} {'Right coast (x)':>16} {'Map width':>10}")

# Sample at many y positions
for y in range(200, H - 200, 100):
    row = pixels[y]
    # Find leftmost non-white pixel
    left_x = None
    right_x = None
    for x in range(W):
        r, g, b = row[x][0], row[x][1], row[x][2]
        if is_map_pixel(r, g, b):
            if left_x is None:
                left_x = x
            right_x = x
    if left_x is not None:
        print(f"{y:>10} {left_x:>15} {right_x:>16} {right_x - left_x:>10}")

# Now let's find specific reference points
# The southern tip of India (Kanyakumari ~8.1N, 77.5E)
# Scan around the bottom of the map to find the tip
print("\n--- Finding southern tip of India ---")
for y in range(H - 100, H - 600, -10):
    row = pixels[y]
    has_map = False
    leftmost = None
    rightmost = None
    for x in range(W):
        r, g, b = row[x][0], row[x][1], row[x][2]
        if is_map_pixel(r, g, b):
            has_map = True
            if leftmost is None:
                leftmost = x
            rightmost = x
    if has_map and leftmost is not None:
        center = (leftmost + rightmost) // 2
        width = rightmost - leftmost
        if width < 500:  # Narrow part = tip of peninsula
            print(f"  y={y}: left={leftmost}, right={rightmost}, center={center}, width={width}")

# Find the easternmost point of the east coast around Tamil Nadu latitude
print("\n--- East coast positions (Tamil Nadu/Coromandel coast) ---")
# Tamil Nadu coast is roughly in the lower-middle portion of the map
for y in range(4500, 5600, 50):
    row = pixels[y]
    # Find the rightmost cluster of non-white pixels (the eastern coastline)
    segments = []
    in_segment = False
    seg_start = None
    for x in range(W):
        r, g, b = row[x][0], row[x][1], row[x][2]
        if is_map_pixel(r, g, b):
            if not in_segment:
                seg_start = x
                in_segment = True
        else:
            if in_segment:
                segments.append((seg_start, x - 1))
                in_segment = False
    if in_segment:
        segments.append((seg_start, W - 1))

    if segments:
        # The main landmass is the largest continuous segment
        main_seg = max(segments, key=lambda s: s[1] - s[0])
        # The east coast is the right edge of the main segment
        east_coast_x = main_seg[1]
        west_coast_x = main_seg[0]
        print(f"  y={y}: west_coast={west_coast_x}, east_coast={east_coast_x}")

# Find west coast positions (Kerala/Malabar coast)
print("\n--- West coast positions (Kerala/Malabar coast) ---")
for y in range(5000, 5700, 50):
    row = pixels[y]
    segments = []
    in_segment = False
    seg_start = None
    for x in range(W):
        r, g, b = row[x][0], row[x][1], row[x][2]
        if is_map_pixel(r, g, b):
            if not in_segment:
                seg_start = x
                in_segment = True
        else:
            if in_segment:
                segments.append((seg_start, x - 1))
                in_segment = False
    if in_segment:
        segments.append((seg_start, W - 1))

    if segments:
        main_seg = max(segments, key=lambda s: s[1] - s[0])
        print(f"  y={y}: west_coast={main_seg[0]}, east_coast={main_seg[1]}")

# Bengal coast positions
print("\n--- Bengal/East coast positions ---")
for y in range(2500, 3500, 100):
    row = pixels[y]
    segments = []
    in_segment = False
    seg_start = None
    for x in range(W):
        r, g, b = row[x][0], row[x][1], row[x][2]
        if is_map_pixel(r, g, b):
            if not in_segment:
                seg_start = x
                in_segment = True
        else:
            if in_segment:
                segments.append((seg_start, x - 1))
                in_segment = False
    if in_segment:
        segments.append((seg_start, W - 1))

    if segments:
        main_seg = max(segments, key=lambda s: s[1] - s[0])
        print(f"  y={y}: west_coast={main_seg[0]}, east_coast={main_seg[1]}")

# Gujarat/Surat coast
print("\n--- Gujarat/Konkan coast positions ---")
for y in range(3000, 3800, 100):
    row = pixels[y]
    segments = []
    in_segment = False
    seg_start = None
    for x in range(W):
        r, g, b = row[x][0], row[x][1], row[x][2]
        if is_map_pixel(r, g, b):
            if not in_segment:
                seg_start = x
                in_segment = True
        else:
            if in_segment:
                segments.append((seg_start, x - 1))
                in_segment = False
    if in_segment:
        segments.append((seg_start, W - 1))

    if segments:
        main_seg = max(segments, key=lambda s: s[1] - s[0])
        print(f"  y={y}: west_coast={main_seg[0]}, east_coast={main_seg[1]}")
