"""
Extend Ramnad:
1. Fill small peach gaps adjacent to existing Ramnad blue
2. Extend slightly south (user said "just a little")
Uses flood fill from existing Ramnad pixels, limited to avoid eating all of Madras Presidency.
"""
from PIL import Image
import numpy as np
from collections import deque

RAMNAD_FILL = (50, 140, 220)
RAMNAD_STRIPE = (30, 100, 170)
RAMNAD_BOUNDARY = (30, 90, 160)
STRIPE_SPACING = 8
STRIPE_WIDTH = 3

PEACH_FILL = (255, 200, 180)
PEACH_BORDER = (200, 120, 100)

def is_peach(r, g, b):
    return ((abs(int(r) - PEACH_FILL[0]) < 10 and abs(int(g) - PEACH_FILL[1]) < 10 and abs(int(b) - PEACH_FILL[2]) < 10) or
            (abs(int(r) - PEACH_BORDER[0]) < 10 and abs(int(g) - PEACH_BORDER[1]) < 10 and abs(int(b) - PEACH_BORDER[2]) < 10))

def is_ramnad(r, g, b):
    for color in [RAMNAD_FILL, RAMNAD_STRIPE, RAMNAD_BOUNDARY]:
        if abs(int(r) - color[0]) < 10 and abs(int(g) - color[1]) < 10 and abs(int(b) - color[2]) < 10:
            return True
    return False

def process_map(path):
    img = Image.open(path).convert('RGB')
    pixels = np.array(img)

    # Step 1: Find all current Ramnad pixels in the region
    # Ramnad is roughly x:3240-3620, y:5920-6140
    y_min, y_max = 5880, 6180  # expanded region
    x_min, x_max = 3200, 3650

    ramnad_pixels = set()
    for y in range(y_min, min(y_max, pixels.shape[0])):
        for x in range(x_min, min(x_max, pixels.shape[1])):
            r, g, b = pixels[y, x]
            if is_ramnad(r, g, b):
                ramnad_pixels.add((y, x))

    print(f"  Found {len(ramnad_pixels)} existing Ramnad pixels")

    # Find current south boundary
    current_south = max(y for y, x in ramnad_pixels)
    print(f"  Current southernmost Ramnad pixel: y={current_south}")

    # Step 2: BFS flood fill from Ramnad edges into adjacent peach
    # Limit: don't go more than 40px south of current boundary
    south_limit = current_south + 40
    print(f"  South limit: y={south_limit}")

    queue = deque()
    visited = set()
    filled = set()

    # Seed the queue with all Ramnad pixels
    for (y, x) in ramnad_pixels:
        queue.append((y, x, 0))  # (y, x, distance from ramnad)
        visited.add((y, x))

    # BFS: expand into peach neighbors
    # Max distance from original Ramnad edge: 30px (to avoid eating too much)
    MAX_DISTANCE = 30

    while queue:
        y, x, dist = queue.popleft()

        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = y + dy, x + dx
            if (ny, nx) in visited:
                continue
            if ny < y_min or ny >= min(y_max, pixels.shape[0]):
                continue
            if nx < x_min or nx >= min(x_max, pixels.shape[1]):
                continue
            if ny > south_limit:
                continue

            visited.add((ny, nx))
            r, g, b = pixels[ny, nx]

            if is_peach(r, g, b):
                new_dist = dist + 1
                if new_dist <= MAX_DISTANCE:
                    filled.add((ny, nx))
                    queue.append((ny, nx, new_dist))

    print(f"  Filling {len(filled)} additional peach pixels")

    # Apply Ramnad colors
    for (y, x) in filled:
        if (x + y) % STRIPE_SPACING < STRIPE_WIDTH:
            pixels[y, x] = RAMNAD_STRIPE
        else:
            pixels[y, x] = RAMNAD_FILL

    result = Image.fromarray(pixels)
    result.save(path)
    print(f"  Saved {path}")

print("Extending Ramnad on princely-states.png...")
process_map('/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/princely-states.png')

print("Extending Ramnad on presidencies-map.png...")
process_map('/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/presidencies-map.png')

print("Done!")
