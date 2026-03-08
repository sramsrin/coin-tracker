"""Scan wider area around Ramnad to find remaining peach pixels."""
from PIL import Image
import numpy as np

img = Image.open('/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/princely-states.png').convert('RGB')
pixels = np.array(img)

PEACH_FILL = (255, 200, 180)
PEACH_BORDER = (200, 120, 100)

def is_peach(r, g, b):
    return ((abs(r - PEACH_FILL[0]) < 10 and abs(g - PEACH_FILL[1]) < 10 and abs(b - PEACH_FILL[2]) < 10) or
            (abs(r - PEACH_BORDER[0]) < 10 and abs(g - PEACH_BORDER[1]) < 10 and abs(b - PEACH_BORDER[2]) < 10))

# Scan wider area: x=3200-3650, y=5880-6200
print("Peach pixel clusters around Ramnad:")
print("=" * 60)

# Group peach pixels by row
for y in range(5880, 6200, 5):
    peach_xs = []
    for x in range(3200, 3650):
        r, g, b = int(pixels[y, x, 0]), int(pixels[y, x, 1]), int(pixels[y, x, 2])
        if is_peach(r, g, b):
            peach_xs.append(x)
    if peach_xs:
        # Group into contiguous ranges
        ranges = []
        start = peach_xs[0]
        prev = peach_xs[0]
        for x in peach_xs[1:]:
            if x > prev + 5:
                ranges.append((start, prev))
                start = x
            prev = x
        ranges.append((start, prev))
        for r_start, r_end in ranges:
            print(f"  y={y}: peach x={r_start}-{r_end} ({r_end - r_start + 1}px wide)")

# Also show Ramnad blue extent per row
print("\n\nRamnad blue extent per row:")
print("=" * 60)
for y in range(5880, 6200, 10):
    blues = []
    for x in range(3200, 3650):
        r, g, b = int(pixels[y, x, 0]), int(pixels[y, x, 1]), int(pixels[y, x, 2])
        if ((40 <= r <= 60 and 130 <= g <= 150 and 210 <= b <= 230) or
            (20 <= r <= 40 and 90 <= g <= 110 and 160 <= b <= 180) or
            (20 <= r <= 40 and 80 <= g <= 100 and 150 <= b <= 170)):
            blues.append(x)
    if blues:
        print(f"  y={y}: blue x={min(blues)}-{max(blues)}")
