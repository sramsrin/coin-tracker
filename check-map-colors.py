#!/usr/bin/env python3
"""
Script to extract unique colors from the current and new map to help migrate mappings.
"""

from PIL import Image
import sys
from collections import defaultdict

def analyze_map_colors(image_path):
    """Extract all unique colors from a map image."""
    img = Image.open(image_path)
    img = img.convert('RGB')
    pixels = img.load()
    width, height = img.size

    # Count occurrences of each color
    color_counts = defaultdict(int)

    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            # Skip pure white (background) and pure black (borders)
            if not ((r > 250 and g > 250 and b > 250) or (r < 5 and g < 5 and b < 5)):
                color_counts[(r, g, b)] += 1

    return color_counts

def format_color_for_db(r, g, b):
    """Format color in the database format: 'r,g,b'"""
    return f"{r},{g},{b}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python check-map-colors.py <path-to-map-image>")
        sys.exit(1)

    image_path = sys.argv[1]

    print(f"Analyzing colors in: {image_path}\n")
    color_counts = analyze_map_colors(image_path)

    # Sort by pixel count (most common first)
    sorted_colors = sorted(color_counts.items(), key=lambda x: x[1], reverse=True)

    print(f"Found {len(sorted_colors)} unique colors (excluding white/black):\n")
    print("Color (RGB)           | Pixels    | Database Format")
    print("-" * 60)

    for color, count in sorted_colors:
        r, g, b = color
        db_format = format_color_for_db(r, g, b)
        print(f"RGB{str(color):20s} | {count:8d} | {db_format}")

    print(f"\nTotal colors: {len(sorted_colors)}")
