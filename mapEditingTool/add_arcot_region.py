#!/usr/bin/env python3
"""
Add Arcot region to the princely states map.
Arcot (North & South Arcot districts) was in coastal Tamil Nadu,
roughly in the area around modern Chennai and Vellore.
"""
from PIL import Image, ImageDraw
import numpy as np

# Load the map
input_map = "/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/princely-states.png"
output_map = "/Users/sahanavasanth/Desktop/LavenderCoinApp/public/maps/princely-states-with-arcot.png"

img = Image.open(input_map)
pixels = np.array(img)
W, H = img.size
print(f"Image size: {W} x {H}")

# Create a drawable version
draw_img = img.copy()
draw = ImageDraw.Draw(draw_img, 'RGBA')

# Define a unique color for Arcot (let's use a distinct purple-ish color)
# RGB: 180, 120, 200
arcot_color = (180, 120, 200, 255)

print(f"Arcot color (RGB): {arcot_color[:3]}")

# Approximate coordinates for Arcot region based on map analysis
# The map appears to be roughly:
# - Width: ~7300 pixels covering ~66°E to ~97°E (31° longitude)
# - Height: ~6800 pixels covering ~8°N to ~37°N (29° latitude)
#
# Arcot region (North & South Arcot districts):
# - Latitude: approximately 12°N to 13.5°N (coastal Tamil Nadu)
# - Longitude: approximately 78.5°E to 80°E (east coast)

# Rough pixel calculations:
# Longitude: 66 + (78.5-66)/(97-66) * 7300 ≈ 66 + 12.5/31 * 7300 ≈ 3000
# to: 66 + (80-66)/(97-66) * 7300 ≈ 66 + 14/31 * 7300 ≈ 3300
# Latitude (inverted, top=37N, bottom=8N):
# For 13.5N: (37-13.5)/(37-8) * 6800 ≈ 5500
# For 12N: (37-12)/(37-8) * 6800 ≈ 5900

# Arcot region approximate polygon (coastal strip in Tamil Nadu)
# This is a rough approximation - we'll draw a polygon covering the coastal area
arcot_polygon = [
    (3000, 5400),  # Northwest corner (inland, northern)
    (3350, 5400),  # Northeast corner (coast, northern)
    (3400, 5550),  # East coast middle-north
    (3450, 5700),  # East coast middle
    (3450, 5850),  # Southeast corner (coast, southern)
    (3100, 5900),  # Southwest corner (inland, southern)
    (3000, 5700),  # West middle
]

# Draw the Arcot region
print("Drawing Arcot region...")
draw.polygon(arcot_polygon, fill=arcot_color, outline=arcot_color)

# Save the modified map
draw_img.save(output_map)
print(f"✓ Saved map with Arcot region to: {output_map}")
print(f"✓ Arcot region color: RGB({arcot_color[0]}, {arcot_color[1]}, {arcot_color[2]})")
print(f"\nTo use this map:")
print(f"1. Replace the map in public/maps/princely-states.png with this new version")
print(f"2. Add color mapping: State='Arcot', Color='{arcot_color[0]},{arcot_color[1]},{arcot_color[2]}'")
