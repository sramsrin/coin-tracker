#!/usr/bin/env python3
"""
Create an annotated map of European trading posts in India (1600-1750).
Expanded canvas: title on top, info panels below the map.
"""

from PIL import Image, ImageDraw, ImageFont
import math
import numpy as np
from collections import defaultdict

# ============================================================
# Load base map and analyze coastline
# ============================================================
base_map = Image.open("/Users/sahanavasanth/Desktop/mapEditingTool/princely-states-outline.png")
MAP_W, MAP_H = base_map.size  # 7051, 6581
pixels = np.array(base_map)

print("Analyzing coastline...")
west_coast_px = {}
east_coast_px = {}
for y in range(MAP_H):
    row = pixels[y]
    is_map = (row[:, 0] < 240) | (row[:, 1] < 240) | (row[:, 2] < 240)
    indices = np.where(is_map)[0]
    if len(indices) > 0:
        west_coast_px[y] = int(indices[0])
        east_coast_px[y] = int(indices[-1])

# ============================================================
# Canvas layout: title bar + map + info panel
# ============================================================
TITLE_H = 200        # space for title above map
INFO_H = 2400        # space for info panels below map
CANVAS_W = MAP_W
CANVAS_H = TITLE_H + MAP_H + INFO_H
MAP_Y_OFFSET = TITLE_H  # map is pasted starting at this y

# Create expanded canvas
canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (255, 255, 255, 255))
# Paste map
map_rgba = base_map.convert("RGBA")
canvas.paste(map_rgba, (0, MAP_Y_OFFSET))

# Create overlay for all annotations
overlay = Image.new("RGBA", (CANVAS_W, CANVAS_H), (255, 255, 255, 0))
draw = ImageDraw.Draw(overlay)

# ============================================================
# Coordinate mapping (adjusted for MAP_Y_OFFSET)
# ============================================================
LAT_MAX = 37.0
Y_SCALE = 213.7
Y_OFFSET_GEO = 209


def lat_to_y(lat):
    return int((LAT_MAX - lat) * Y_SCALE + Y_OFFSET_GEO) + MAP_Y_OFFSET


def lon_to_x(lon, lat):
    sx = 190.86 + 0.442 * lat - 0.02105 * lat * lat
    ox = -11695.4 - 11.51 * lat + 0.976 * lat * lat
    return int(sx * lon + ox)


def geo_to_pixel(lat, lon):
    return lon_to_x(lon, lat), lat_to_y(lat)


def snap_to_coast(x, y, coast_side, offset=10):
    if coast_side is None:
        return x, y
    # y on canvas -> y on original map
    map_y = y - MAP_Y_OFFSET
    map_y = max(min(map_y, max(west_coast_px.keys())), min(west_coast_px.keys()))
    if coast_side == "east" and map_y in east_coast_px:
        return east_coast_px[map_y] - offset, map_y + MAP_Y_OFFSET
    elif coast_side == "west" and map_y in west_coast_px:
        return west_coast_px[map_y] + offset, map_y + MAP_Y_OFFSET
    return x, y


# ============================================================
# Colors and Fonts
# ============================================================
COLORS = {
    "Portuguese": (0, 140, 30, 255),
    "Dutch": (230, 130, 0, 255),
    "British": (210, 0, 0, 255),
    "French": (0, 50, 210, 255),
    "Danish": (150, 0, 200, 255),
}
SHARED_COLOR = (40, 40, 40, 255)

try:
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 52)
    font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 42)
    title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 110)
    legend_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 52)
    legend_desc = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 42)
    panel_title_f = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 70)
    panel_country_f = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 60)
    panel_item_f = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 50)
    panel_note_f = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 44)
except Exception:
    font = ImageFont.load_default()
    font_small = font
    title_font = font
    legend_font = font
    legend_desc = font
    panel_title_f = font
    panel_country_f = font
    panel_item_f = font
    panel_note_f = font

# ============================================================
# Trading posts data
# ============================================================
trading_posts = [
    # PORTUGUESE
    ("Diu", 20.71, 70.98, 1535, "Portuguese", "west"),
    ("Daman", 20.42, 72.85, 1559, "Portuguese", "west"),
    ("Bassein", 19.37, 72.83, 1534, "Portuguese", "west"),
    ("Chaul", 18.55, 72.93, 1521, "Portuguese", "west"),
    ("Goa", 15.49, 73.82, 1510, "Portuguese", "west"),
    ("Mangalore", 12.87, 74.84, 1568, "Portuguese", "west"),
    ("Cannanore", 11.87, 75.37, 1502, "Portuguese", "west"),
    ("Cochin", 9.93, 76.26, 1503, "Portuguese", "west"),
    ("Sao Tome de Meliapore", 13.03, 80.27, 1523, "Portuguese", "east"),
    ("Hugli", 22.90, 88.40, 1579, "Portuguese", None),

    # DUTCH
    ("Pulicat", 13.42, 80.32, 1610, "Dutch", "east"),
    ("Masulipatnam", 16.18, 81.14, 1605, "Dutch", "east"),
    ("Nagapattinam", 10.76, 79.84, 1660, "Dutch", "east"),
    ("Chinsura", 22.90, 88.20, 1625, "Dutch", None),
    ("Quilon", 8.89, 76.60, 1662, "Dutch", "west"),
    ("Sadras", 12.52, 80.17, 1647, "Dutch", "east"),
    ("Bimlipatam", 17.88, 83.45, 1641, "Dutch", "east"),
    ("Cochin", 9.93, 76.26, 1663, "Dutch", "west"),
    ("Surat", 21.17, 72.83, 1616, "Dutch", "west"),
    ("Agra", 27.18, 78.02, 1621, "Dutch", None),
    ("Ahmedabad", 23.02, 72.57, 1617, "Dutch", None),

    # BRITISH
    ("Surat", 21.17, 72.83, 1612, "British", "west"),
    ("Madras", 13.08, 80.29, 1639, "British", "east"),
    ("Bombay", 18.93, 72.83, 1668, "British", "west"),
    ("Calcutta", 22.57, 88.35, 1690, "British", None),
    ("Masulipatnam", 16.18, 81.14, 1611, "British", "east"),
    ("Hugli", 22.90, 88.40, 1651, "British", None),
    ("Kasimbazar", 24.13, 88.18, 1658, "British", None),
    ("Patna", 25.61, 85.14, 1620, "British", None),
    ("Balasore", 21.49, 86.93, 1642, "British", "east"),
    ("Vizagapatam", 17.72, 83.30, 1682, "British", "east"),
    ("Tellicherry", 11.75, 75.49, 1694, "British", "west"),
    ("Anjengo", 8.67, 76.77, 1684, "British", "west"),
    ("Fort St. David", 11.76, 79.77, 1690, "British", "east"),
    ("Agra", 27.18, 78.02, 1612, "British", None),
    ("Ahmedabad", 23.02, 72.57, 1619, "British", None),
    ("Burhanpur", 21.31, 76.23, 1615, "British", None),

    # FRENCH
    ("Pondicherry", 11.93, 79.83, 1674, "French", "east"),
    ("Chandernagore", 22.87, 88.38, 1688, "French", None),
    ("Mahe", 11.70, 75.53, 1721, "French", "west"),
    ("Karikal", 10.92, 79.84, 1739, "French", "east"),
    ("Yanam", 16.73, 82.22, 1723, "French", "east"),
    ("Surat", 21.17, 72.83, 1668, "French", "west"),

    # DANISH
    ("Tranquebar", 11.03, 79.85, 1620, "Danish", "east"),
    ("Serampore", 22.75, 88.34, 1755, "Danish", None),
]

# ============================================================
# Group by city name to identify shared locations
# ============================================================
city_groups = defaultdict(list)
for post in trading_posts:
    city_groups[post[0]].append(post)

single_posts = []
shared_posts = {}
for city_name, posts in city_groups.items():
    powers = set(p[4] for p in posts)
    if len(powers) == 1:
        single_posts.append(posts[0])
    else:
        shared_posts[city_name] = sorted(posts, key=lambda p: p[3])

# Build per-country listing (sorted by year)
posts_by_country = defaultdict(list)
for name, lat, lon, year, power, coast in trading_posts:
    posts_by_country[power].append((name, year))
# Deduplicate and sort by year
for power in posts_by_country:
    seen = set()
    unique = []
    for name, year in sorted(posts_by_country[power], key=lambda x: x[1]):
        if name not in seen:
            seen.add(name)
            unique.append((name, year))
    posts_by_country[power] = unique

# ============================================================
# Compute pixel positions
# ============================================================
def compute_position(name, lat, lon, year, power, coast):
    x, y = geo_to_pixel(lat, lon)
    if coast:
        x, y = snap_to_coast(x, y, coast)
    return x, y

single_with_pos = []
for post in single_posts:
    x, y = compute_position(*post)
    single_with_pos.append((*post, x, y))

shared_with_pos = []
for city_name, posts in shared_posts.items():
    p = posts[0]
    x, y = compute_position(*p)
    shared_with_pos.append((city_name, p[1], p[2], p[3], "SHARED", p[5], x, y))

all_map_items = single_with_pos + shared_with_pos

proximity_groups = defaultdict(list)
for item in all_map_items:
    name, lat, lon, year, power, coast, x, y = item
    found_group = None
    for key in proximity_groups:
        kx, ky = key
        if abs(x - kx) < 100 and abs(y - ky) < 100:
            found_group = key
            break
    if found_group:
        proximity_groups[found_group].append(item)
    else:
        proximity_groups[(x, y)].append(item)

# ============================================================
# Draw Hooghly River
# ============================================================
RIVER_COLOR = (30, 90, 180, 200)
RIVER_WIDTH = 14

hooghly_geo = [
    (24.8, 88.10), (24.5, 88.15), (24.2, 88.25),
    (23.8, 88.35), (23.4, 88.38), (23.1, 88.40),
    (22.9, 88.38), (22.75, 88.35), (22.57, 88.35),
    (22.3, 88.30),
]
hooghly_px = [geo_to_pixel(lat, lon) for lat, lon in hooghly_geo]

# Clip last point to coastline
lx, ly = hooghly_px[-1]
map_ly = ly - MAP_Y_OFFSET
if map_ly in east_coast_px:
    coast_x = east_coast_px[map_ly]
    if lx > coast_x:
        hooghly_px[-1] = (coast_x - 20, ly)

for i in range(len(hooghly_px) - 1):
    x1, y1 = hooghly_px[i]
    x2, y2 = hooghly_px[i + 1]
    draw.line([(x1, y1), (x2, y2)], fill=RIVER_COLOR, width=RIVER_WIDTH)

rlx, rly = hooghly_px[5]
draw.text((rlx + 30, rly - 50), "Hooghly River",
          fill=(20, 60, 140, 240), font=font_small)

# ============================================================
# Draw dots and labels on map
# ============================================================
DOT_RADIUS = 32
OUTLINE_WIDTH = 6
placed_labels = []


def labels_overlap(x, y, w, h):
    for lx, ly, lw, lh in placed_labels:
        if x < lx + lw and x + w > lx and y < ly + lh and y + h > ly:
            return True
    return False


def find_label_position(cx, cy, text, f, preferred_dir=None):
    bbox = f.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    pad = 14
    gap = DOT_RADIUS + 20
    dirs = {
        "left": [(-tw - gap, -th // 2), (-tw - gap, -th - 10), (-tw - gap, 10),
                 (gap, -th // 2), (-tw // 2, -th - gap), (-tw // 2, gap)],
        "right": [(gap, -th // 2), (gap, -th - 10), (gap, 10),
                  (-tw - gap, -th // 2), (-tw // 2, -th - gap), (-tw // 2, gap)],
        "up": [(-tw // 2, -th - gap), (gap, -th - 10), (-tw - gap, -th - 10),
               (gap, -th // 2), (-tw - gap, -th // 2)],
        "down": [(-tw // 2, gap), (gap, 10), (-tw - gap, 10),
                 (gap, -th // 2), (-tw - gap, -th // 2)],
    }
    d = preferred_dir or "right"
    offsets = list(dirs.get(d, dirs["right"]))
    for mult in [1.5, 2.0, 2.5, 3.0, 4.0]:
        for ox, oy in list(dirs.get(d, dirs["right"])):
            offsets.append((int(ox * mult), int(oy * mult)))
    for ox, oy in offsets:
        lx, ly = cx + ox, cy + oy
        if not labels_overlap(lx - pad, ly - pad, tw + 2 * pad, th + 2 * pad):
            placed_labels.append((lx - pad, ly - pad, tw + 2 * pad, th + 2 * pad))
            return lx, ly, tw, th
    lx, ly = cx + gap, cy - th // 2
    placed_labels.append((lx - pad, ly - pad, tw + 2 * pad, th + 2 * pad))
    return lx, ly, tw, th


def draw_leader_line(cx, cy, lx, ly, tw, th):
    lcx, lcy = lx + tw // 2, ly + th // 2
    if math.sqrt((lcx - cx) ** 2 + (lcy - cy) ** 2) > DOT_RADIUS + 40:
        draw.line([(cx, cy), (lcx, lcy)], fill=(100, 100, 100, 200), width=3)


def get_preferred_dir(coast, lon):
    if coast == "west": return "left"
    if coast == "east": return "right"
    if lon > 85: return "right"
    if lon < 76: return "left"
    return "right"


sorted_groups = sorted(proximity_groups.items(), key=lambda x: len(x[1]))
for key, items in sorted_groups:
    for item in items:
        name, lat, lon, year, power, coast, cx, cy = item
        if power == "SHARED":
            dot_color = SHARED_COLOR
            label = f"{name}*"
        else:
            dot_color = COLORS[power]
            label = f"{name} ({year})"
        preferred = get_preferred_dir(coast, lon)
        draw.ellipse([cx - DOT_RADIUS, cy - DOT_RADIUS, cx + DOT_RADIUS, cy + DOT_RADIUS],
                     fill=dot_color, outline=(0, 0, 0, 255), width=OUTLINE_WIDTH)
        lbl_color = dot_color if power != "SHARED" else SHARED_COLOR
        lx, ly, tw, th = find_label_position(cx, cy, label, font, preferred)
        draw_leader_line(cx, cy, lx, ly, tw, th)
        draw.rectangle([lx - 6, ly - 4, lx + tw + 6, ly + th + 4],
                       fill=(255, 255, 255, 220), outline=lbl_color, width=2)
        draw.text((lx, ly), label, fill=lbl_color, font=font)

# ============================================================
# TITLE (in the top bar, above the map)
# ============================================================
title = "European Trading Posts in India (1600 - 1750)"
tb = title_font.getbbox(title)
tw, th = tb[2] - tb[0], tb[3] - tb[1]
title_x = (CANVAS_W - tw) // 2
title_y = (TITLE_H - th) // 2 - 10
draw.text((title_x, title_y), title, fill=(0, 0, 0, 255), font=title_font)
# Underline
draw.line([(title_x, title_y + th + 15), (title_x + tw, title_y + th + 15)],
          fill=(0, 0, 0, 180), width=4)

# ============================================================
# INFO PANELS (below the map)
# ============================================================
PANEL_TOP = MAP_Y_OFFSET + MAP_H + 40  # y where panels start
PANEL_MARGIN = 60

# --- Divider line between map and panels ---
draw.line([(PANEL_MARGIN, PANEL_TOP - 20), (CANVAS_W - PANEL_MARGIN, PANEL_TOP - 20)],
          fill=(180, 180, 180, 255), width=3)

# ============================================================
# Panel 1: LEGEND (left side)
# ============================================================
leg_x = PANEL_MARGIN
leg_y = PANEL_TOP + 10
leg_spacing = 100
leg_dot_r = 28

draw.text((leg_x, leg_y), "LEGEND", fill=(0, 0, 0, 255), font=panel_title_f)
leg_y += 100

legend_items = [
    ("Portuguese", "(est. early 1500s)"),
    ("Dutch", "(VOC - Dutch East India Co.)"),
    ("British", "(EIC - English East India Co.)"),
    ("French", "(French East India Co.)"),
    ("Danish", "(Danish East India Co.)"),
]

for power, desc in legend_items:
    color = COLORS[power]
    draw.ellipse([leg_x + 10 - leg_dot_r, leg_y + 12 - leg_dot_r,
                  leg_x + 10 + leg_dot_r, leg_y + 12 + leg_dot_r],
                 fill=color, outline=(0, 0, 0, 255), width=4)
    draw.text((leg_x + 50, leg_y - 5), f"{power}  {desc}", fill=color, font=panel_item_f)
    leg_y += leg_spacing

# Shared marker
draw.ellipse([leg_x + 10 - leg_dot_r, leg_y + 12 - leg_dot_r,
              leg_x + 10 + leg_dot_r, leg_y + 12 + leg_dot_r],
             fill=SHARED_COLOR, outline=(0, 0, 0, 255), width=4)
draw.text((leg_x + 50, leg_y - 5), "* Shared location (see details at right)",
          fill=SHARED_COLOR, font=panel_item_f)
leg_y += leg_spacing

# Note
draw.text((leg_x + 10, leg_y + 20),
          "Note: Portuguese posts were established",
          fill=(100, 100, 100, 255), font=panel_note_f)
draw.text((leg_x + 10, leg_y + 70),
          "before 1600 but remained active trading",
          fill=(100, 100, 100, 255), font=panel_note_f)
draw.text((leg_x + 10, leg_y + 120),
          "posts during 1600-1750.",
          fill=(100, 100, 100, 255), font=panel_note_f)

# ============================================================
# Panel 2: TRADING POSTS BY COUNTRY (center)
# ============================================================
col_x = 2300
col_y = PANEL_TOP + 10
draw.text((col_x, col_y), "TRADING POSTS BY COUNTRY", fill=(0, 0, 0, 255), font=panel_title_f)
col_y += 100

# Layout: 3 columns - (Portuguese, Dutch) | (British) | (French, Danish)
col_positions = [col_x, col_x + 1500, col_x + 3000]
country_columns = [
    ["Portuguese", "Dutch"],
    ["British"],
    ["French", "Danish"],
]

for col_idx, countries in enumerate(country_columns):
    cx = col_positions[col_idx]
    cy = col_y
    for power in countries:
        color = COLORS[power]
        # Country header
        draw.text((cx, cy), f"{power}:", fill=color, font=panel_country_f)
        cy += 75
        # List posts
        for name, year in posts_by_country[power]:
            # Mark shared posts with *
            is_shared = name in shared_posts
            marker = "*" if is_shared else ""
            draw.text((cx + 40, cy), f"{name}{marker} ({year})",
                     fill=color, font=panel_item_f)
            cy += 62
        cy += 40  # gap between countries

# ============================================================
# Panel 3: SHARED LOCATIONS (far right)
# ============================================================
sh_x = col_positions[2]
sh_y = col_y  # starts at same height as country listings

# Find where the last column's content ends
# Place shared box after French+Danish
sh_content_y = col_y
for power in ["French", "Danish"]:
    sh_content_y += 75 + len(posts_by_country[power]) * 62 + 40

sh_y = max(sh_content_y + 40, col_y + 800)

draw.text((sh_x, sh_y), "SHARED LOCATIONS:", fill=SHARED_COLOR, font=panel_country_f)
sh_y += 75

for city_name, posts in sorted(shared_posts.items()):
    powers_str = ", ".join(f"{p[4]} ({p[3]})" for p in posts)
    draw.text((sh_x + 30, sh_y), f"{city_name}: {powers_str}",
             fill=SHARED_COLOR, font=panel_item_f)
    sh_y += 62

# ============================================================
# Draw panel borders
# ============================================================
# Vertical divider between legend and country listing
div_x = 2150
draw.line([(div_x, PANEL_TOP), (div_x, CANVAS_H - 40)],
          fill=(200, 200, 200, 255), width=2)

# ============================================================
# Save
# ============================================================
result = Image.alpha_composite(canvas, overlay)
result = result.convert("RGB")
output_path = "/Users/sahanavasanth/Desktop/mapEditingTool/european-trading-posts-1600-1750.png"
result.save(output_path, "PNG", quality=95)
print(f"\nMap saved to: {output_path}")
print(f"Canvas size: {CANVAS_W} x {CANVAS_H}")
print(f"Total posts: {len(trading_posts)}")
print(f"Unique dots on map: {len(single_posts) + len(shared_posts)}")
