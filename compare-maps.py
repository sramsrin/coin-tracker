#!/usr/bin/env python3
"""
Compare colors between old and new maps to see which mappings will survive.
"""

from PIL import Image
from collections import defaultdict

def get_unique_colors(image_path):
    """Extract all unique colors from a map image."""
    img = Image.open(image_path)
    img = img.convert('RGB')
    pixels = img.load()
    width, height = img.size

    colors = set()
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            # Skip pure white (background) and pure black (borders)
            if not ((r > 250 and g > 250 and b > 250) or (r < 5 and g < 5 and b < 5)):
                colors.add((r, g, b))

    return colors

def format_color_for_db(r, g, b):
    """Format color in the database format: 'r,g,b'"""
    return f"{r},{g},{b}"

if __name__ == "__main__":
    print("Comparing maps...\n")

    old_map = "public/maps/princely-states.png"
    new_map = "colored_map.png"

    print(f"Old map: {old_map}")
    print(f"New map: {new_map}\n")

    old_colors = get_unique_colors(old_map)
    new_colors = get_unique_colors(new_map)

    print(f"Old map colors: {len(old_colors):,}")
    print(f"New map colors: {len(new_colors):,}\n")

    # Find colors that exist in both maps
    common_colors = old_colors & new_colors

    print(f"Colors that exist in BOTH maps: {len(common_colors)}")
    print("=" * 70)

    if common_colors:
        print("\nThese colors are preserved (your mappings for these will survive):\n")
        for color in sorted(common_colors, key=lambda c: (c[0], c[1], c[2]))[:50]:
            r, g, b = color
            db_format = format_color_for_db(r, g, b)
            print(f"  {db_format}")

        if len(common_colors) > 50:
            print(f"\n  ... and {len(common_colors) - 50} more")

    # Colors only in old map (will be lost)
    lost_colors = old_colors - new_colors
    print(f"\n\nColors ONLY in old map (mappings will be LOST): {len(lost_colors)}")
    print("=" * 70)

    if lost_colors:
        print("\nFirst 20 colors that will lose their mappings:\n")
        for color in sorted(lost_colors, key=lambda c: (c[0], c[1], c[2]))[:20]:
            r, g, b = color
            db_format = format_color_for_db(r, g, b)
            print(f"  {db_format}")

        if len(lost_colors) > 20:
            print(f"\n  ... and {len(lost_colors) - 20} more")

    # Colors only in new map
    new_only = new_colors - old_colors
    print(f"\n\nNEW colors in new map: {len(new_only):,}")
    print("(This includes anti-aliasing artifacts if the number is very high)")

    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY:")
    print("=" * 70)
    preservation_rate = (len(common_colors) / len(old_colors) * 100) if old_colors else 0
    print(f"Preservation rate: {preservation_rate:.1f}%")
    print(f"  - {len(common_colors)} colors preserved")
    print(f"  - {len(lost_colors)} colors will lose mappings")

    if len(new_colors) > len(old_colors) * 10:
        print("\n⚠️  WARNING: New map has anti-aliasing/gradients!")
        print("    This will make the color-based mapping system difficult to use.")
        print("    Consider using a version with solid, flat colors for each region.")
