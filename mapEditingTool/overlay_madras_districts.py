#!/usr/bin/env python3
"""
Overlay Madras Presidency district boundaries from the reference map
onto the princely states map, using the lat/lon grid lines for alignment.
"""
from PIL import Image, ImageDraw
import numpy as np

# --- Load both maps ---
princely_map_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/mapEditingTool/princely-states.png"
madras_map_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/mapEditingTool/The-Madras-Presidency-with-its-26-districts-1-Anantapur-2-Bellary-3-Chingleput.png"
output_path = "/Users/sahanavasanth/Desktop/LavenderCoinApp/mapEditingTool/test-madras-overlay.png"

princely_img = Image.open(princely_map_path).convert('RGBA')
madras_img = Image.open(madras_map_path).convert('RGBA')

pW, pH = princely_img.size
mW, mH = madras_img.size
print(f"Princely states map: {pW} x {pH}")
print(f"Madras Presidency map: {mW} x {mH}")

# --- Calibrate the Madras Presidency map ---
# The Madras map has grid lines at:
# Longitude: 77°E and 82°E (visible vertical lines)
# Latitude: 10°N, 15°N, 20°N (visible horizontal lines)
#
# By examining the image, approximate pixel positions of grid intersections:
# Top-left area shows "77°0'0\"E" label, bottom also shows "77°0'0\"E"
# Right side shows "82°0'0\"E"
# Horizontal lines at 10°N, 15°N, 20°N

# Approximate pixel coordinates of grid intersections on Madras map:
# (measured from the image)
# 77°E line: approximately x=115
# 82°E line: approximately x=490
# 20°N line: approximately y=135
# 15°N line: approximately y=440
# 10°N line: approximately y=740

madras_ref_points = {
    # (lon, lat): (pixel_x, pixel_y)
    (77.0, 20.0): (115, 135),
    (82.0, 20.0): (490, 135),
    (77.0, 15.0): (115, 440),
    (82.0, 15.0): (490, 440),
    (77.0, 10.0): (115, 740),
    (82.0, 10.0): (490, 740),
}

# Calculate pixels per degree for Madras map
madras_px_per_lon = (490 - 115) / (82.0 - 77.0)  # pixels per degree longitude
madras_px_per_lat = (740 - 135) / (20.0 - 10.0)   # pixels per degree latitude (inverted)
print(f"Madras map: {madras_px_per_lon:.1f} px/deg lon, {madras_px_per_lat:.1f} px/deg lat")

def madras_pixel_to_geo(mx, my):
    """Convert Madras map pixel to geographic coordinates."""
    lon = 77.0 + (mx - 115) / madras_px_per_lon
    lat = 20.0 - (my - 135) / madras_px_per_lat
    return (lat, lon)

# --- Calibrate the Princely States map ---
# Map covers approximately: 66°E to 97°E, 8°N to 37°N
# Image size: 7051 x 6581
P_LON_MIN, P_LON_MAX = 66.0, 97.0
P_LAT_MIN, P_LAT_MAX = 8.0, 37.0

def geo_to_princely_pixel(lat, lon):
    """Convert geographic coordinates to princely map pixel."""
    x = (lon - P_LON_MIN) / (P_LON_MAX - P_LON_MIN) * pW
    y = (P_LAT_MAX - lat) / (P_LAT_MAX - P_LAT_MIN) * pH
    return (int(x), int(y))

def madras_to_princely(mx, my):
    """Convert Madras map pixel directly to princely map pixel."""
    lat, lon = madras_pixel_to_geo(mx, my)
    return geo_to_princely_pixel(lat, lon)

# --- Extract boundary lines from Madras map ---
madras_pixels = np.array(madras_img)

# District boundaries are dark/black lines
# Find pixels that are very dark (boundary lines)
def is_boundary(r, g, b, a=255):
    """Check if a pixel is a dark boundary line."""
    return r < 80 and g < 80 and b < 80 and a > 128

print("Extracting boundary pixels from Madras map...")
boundary_pixels = []
for y in range(mH):
    for x in range(mW):
        r, g, b, a = madras_pixels[y, x]
        if is_boundary(r, g, b, a):
            boundary_pixels.append((x, y))

print(f"Found {len(boundary_pixels)} boundary pixels")

# --- Draw boundaries on princely states map ---
print("Drawing boundaries on princely states map...")
overlay = princely_img.copy()
draw = ImageDraw.Draw(overlay, 'RGBA')

# Draw each boundary pixel (transformed to princely map coordinates)
# Use a slightly larger point for visibility
drawn_count = 0
for mx, my in boundary_pixels:
    px, py = madras_to_princely(mx, my)
    # Only draw if within the princely map bounds
    if 0 <= px < pW and 0 <= py < pH:
        # Draw a small dot for each boundary pixel
        draw.rectangle([(px-1, py-1), (px+1, py+1)], fill=(200, 0, 0, 200))
        drawn_count += 1

print(f"Drew {drawn_count} boundary pixels on princely map")

# Save
overlay.save(output_path)
print(f"\n✓ Saved overlay map to: {output_path}")
