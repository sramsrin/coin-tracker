"""Verify no peach pixels remain in the east Ramnad region."""
from PIL import Image
import numpy as np

img = Image.open('/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/princely-states.png').convert('RGB')
pixels = np.array(img)

# Check the same rows as before
for y in [5930, 5943, 5963, 5983, 6003, 6023, 6043]:
    print(f"\nRow y={y}:")
    for x in range(3540, 3625):
        r, g, b = pixels[y, x]
        if x % 10 == 0:
            print(f"  x={x}: ({r},{g},{b})", end="")
    print()

# Count remaining peach pixels in the region
peach_count = 0
for y in range(5920, 6070):
    for x in range(3540, 3620):
        r, g, b = int(pixels[y, x, 0]), int(pixels[y, x, 1]), int(pixels[y, x, 2])
        if abs(r - 255) < 10 and abs(g - 200) < 10 and abs(b - 180) < 10:
            peach_count += 1

print(f"\nRemaining peach pixels in region: {peach_count}")
