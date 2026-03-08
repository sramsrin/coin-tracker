"""
Extend Ramnad district EAST to fill the narrow peach strip
between Ramnad's eastern edge and the coast.
Fills ALL peach (Madras Presidency) pixels in the region east of Ramnad.
"""
from PIL import Image
import numpy as np

# Ramnad colors
RAMNAD_FILL = (50, 140, 220)
RAMNAD_STRIPE = (30, 100, 170)
RAMNAD_BOUNDARY = (30, 90, 160)
STRIPE_SPACING = 8
STRIPE_WIDTH = 3

# Madras Presidency colors
PEACH_FILL = (255, 200, 180)
PEACH_BORDER = (200, 120, 100)
PEACH_TOLERANCE = 5

def is_peach(r, g, b):
    return ((abs(r - PEACH_FILL[0]) <= PEACH_TOLERANCE and
             abs(g - PEACH_FILL[1]) <= PEACH_TOLERANCE and
             abs(b - PEACH_FILL[2]) <= PEACH_TOLERANCE) or
            (abs(r - PEACH_BORDER[0]) <= PEACH_TOLERANCE and
             abs(g - PEACH_BORDER[1]) <= PEACH_TOLERANCE and
             abs(b - PEACH_BORDER[2]) <= PEACH_TOLERANCE))

def process_map(path):
    img = Image.open(path).convert('RGB')
    pixels = np.array(img)

    # Region: east of Ramnad's main body, the narrow peach strip
    # Based on scan: peach runs from roughly x=3540 to x=3615, y=5920 to y=6070
    y_start, y_end = 5920, 6070
    x_start, x_end = 3540, 3620

    count = 0

    for y in range(y_start, min(y_end, pixels.shape[0])):
        for x in range(x_start, min(x_end, pixels.shape[1])):
            r, g, b = int(pixels[y, x, 0]), int(pixels[y, x, 1]), int(pixels[y, x, 2])
            if is_peach(r, g, b):
                # Apply Ramnad coloring with stripe pattern
                if (x + y) % STRIPE_SPACING < STRIPE_WIDTH:
                    pixels[y, x] = RAMNAD_STRIPE
                else:
                    pixels[y, x] = RAMNAD_FILL
                count += 1

    print(f"  Filled {count} peach pixels with Ramnad blue for {path}")

    result = Image.fromarray(pixels)
    result.save(path)
    print(f"  Saved {path}")

# Process both maps
print("Extending Ramnad east on princely-states.png...")
process_map('/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/princely-states.png')

print("Extending Ramnad east on presidencies-map.png...")
process_map('/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/presidencies-map.png')

print("Done!")
