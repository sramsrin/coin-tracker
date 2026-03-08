"""Scan the area east of Ramnad to understand pixel colors."""
from PIL import Image
import numpy as np

img = Image.open('/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/princely-states.png').convert('RGB')
pixels = np.array(img)

# Check a few rows at Ramnad's eastern edge
for y in [5930, 5943, 5963, 5983, 6003, 6023, 6043, 6063]:
    print(f"\nRow y={y}:")
    for x in range(3540, 3630):
        r, g, b = pixels[y, x]
        # Print color at key positions
        if x % 5 == 0:
            print(f"  x={x}: ({r},{g},{b})", end="")
    print()

# Also check what Ramnad looks like - find actual Ramnad pixels
print("\n\nLooking for Ramnad blue pixels in the region:")
for y in range(5920, 6140, 20):
    blues = []
    for x in range(3200, 3650):
        r, g, b = pixels[y, x]
        if (40 <= r <= 60 and 130 <= g <= 150 and 210 <= b <= 230) or \
           (20 <= r <= 40 and 90 <= g <= 110 and 160 <= b <= 180):
            blues.append(x)
    if blues:
        print(f"  y={y}: Ramnad blue at x={min(blues)} to x={max(blues)}")
    else:
        print(f"  y={y}: No Ramnad blue found")

# Check what colors exist between x=3550-3620, y=5920-6060
print("\n\nUnique colors east of x=3550:")
colors = {}
for y in range(5920, 6060):
    for x in range(3550, 3620):
        r, g, b = int(pixels[y, x, 0]), int(pixels[y, x, 1]), int(pixels[y, x, 2])
        key = (r, g, b)
        if key not in colors:
            colors[key] = 0
        colors[key] += 1

for color, count in sorted(colors.items(), key=lambda x: -x[1])[:20]:
    print(f"  {color}: {count} pixels")
