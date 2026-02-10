#!/usr/bin/env python3
"""
Script to recolor the Madras Presidency areas on the princely states map.
The Madras Presidency appears as gray areas in the southeastern and eastern coastal regions.
"""

from PIL import Image
import sys

def recolor_madras_presidency(input_path, output_path):
    # Load the image
    img = Image.open(input_path)
    img = img.convert('RGB')
    pixels = img.load()
    width, height = img.size

    # Find all unique gray shades in the image
    # Gray colors have R ≈ G ≈ B
    gray_colors = set()
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            # Check if it's a gray color (R, G, B values are close to each other)
            if abs(r - g) <= 5 and abs(g - b) <= 5 and abs(r - b) <= 5:
                # Exclude pure white and pure black
                if not ((r > 250 and g > 250 and b > 250) or (r < 5 and g < 5 and b < 5)):
                    gray_colors.add((r, g, b))

    print(f"Found {len(gray_colors)} unique gray shades:")
    for gray in sorted(gray_colors):
        print(f"  RGB{gray}")

    # The main Madras Presidency gray appears to be around RGB(192, 192, 192) or similar
    # Let's identify the most common gray
    gray_counts = {}
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            if (r, g, b) in gray_colors:
                gray_counts[(r, g, b)] = gray_counts.get((r, g, b), 0) + 1

    # Find the most common gray (likely the Madras Presidency)
    if gray_counts:
        most_common_gray = max(gray_counts.items(), key=lambda x: x[1])[0]
        print(f"\nMost common gray: RGB{most_common_gray} ({gray_counts[most_common_gray]} pixels)")

        # New color for Madras Presidency - a light peach/salmon color to distinguish it
        new_color = (255, 218, 185)  # Peach/beige color
        # Alternative: (173, 216, 230) for light blue
        # Alternative: (255, 228, 196) for bisque

        print(f"Replacing with: RGB{new_color}")

        # Replace the gray with the new color
        replaced_count = 0
        for y in range(height):
            for x in range(width):
                if pixels[x, y] == most_common_gray:
                    pixels[x, y] = new_color
                    replaced_count += 1

        print(f"Replaced {replaced_count} pixels")

        # Save the modified image
        img.save(output_path)
        print(f"\nSaved modified map to: {output_path}")
        return True
    else:
        print("No gray colors found!")
        return False

if __name__ == "__main__":
    input_file = "public/maps/princely-states.png"
    output_file = "public/maps/princely-states-modified.png"

    print("Recoloring Madras Presidency on the map...")
    print(f"Input: {input_file}")
    print(f"Output: {output_file}\n")

    success = recolor_madras_presidency(input_file, output_file)
    sys.exit(0 if success else 1)
