# Map Editing Tool - District Overlay

## Madras Presidency Overlay Alignment
These are the calibrated coordinates for overlaying the Madras Presidency 26-district map onto the princely states map.

```
Overlay Position: (2470, 3410)
Overlay Scale: 3.6x
Overlay Size: 2581 x 3478 px
Base Map Size: 7051 x 6581
```

Python usage:
```python
OVERLAY_X = 2470
OVERLAY_Y = 3410
OVERLAY_SCALE = 3.6
```

## District Seeds (from find_districts.py scan)
Seed coordinates for flood-filling each numbered district on the Madras Presidency map:

| District # | Name | Seed (x, y) | Center (x, y) | Pixels |
|---|---|---|---|---|
| 16 | North Arcot | (330, 534) | - | - |
| 19 | South Arcot | (318, 573) | - | - |
| 21 | Tanjore | (345, 636) | (326, 674) | 2314 |
| 22 | Tinnevelly | (207, 750) | (229, 779) | 2753 |
| 26 | Madurai | scanned auto | ~(150-250, 680-760) | - |
| 17 | Ramnad | scanned auto | ~(x>200, 720-810) | - |

## District Colors (already applied to production map)
| District | Fill RGB | Stripe RGB | Boundary RGB |
|---|---|---|---|
| Arcot (16 & 19) | (0, 190, 180) | (0, 140, 130) | (0, 100, 95) |
| Tinnevelly (22) | (0, 190, 180) | (0, 140, 130) | (0, 100, 95) |
| Madurai (26) | (220, 120, 50) | (170, 85, 30) | (160, 80, 30) |
| Ramnad (17) | (50, 140, 220) | (30, 100, 170) | (30, 90, 160) |
| Tanjore (21) | (255, 50, 120) | (200, 35, 90) | (155, 25, 65) |

## Tools
- `align-districts.html` - Interactive browser tool to drag/zoom the Madras overlay on the princely states map
- `find_districts.py` - Scans Madras map to find all 26 district regions and their seed coordinates
- `extract_arcot_districts.py` - Extracts Arcot districts
- `extract_madurai_ramnad.py` - Extracts Madurai & Ramnad districts
- `extract_tanjore.py` - Extracts Tanjore district
- `extract_tinnevelly.py` - Extracts Tinnevelly district (Arcot colors)
