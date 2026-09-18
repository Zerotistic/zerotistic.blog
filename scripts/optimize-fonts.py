"""Pin the unused width axis; preserve every glyph and the full weight range.

Requires fonttools[woff]. Run from the repository root:
    python scripts/optimize-fonts.py
Original fonts remain available for future design changes.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

fonts = Path("src/assets/fonts")
for style in ["", "Italic-"]:
    font = TTFont(fonts / f"IBMPlexSans-{style}VariableFont_wdth,wght.woff2")
    optimized = instantiateVariableFont(font, {"wdth": 100}, inplace=False)
    optimized.flavor = "woff2"
    optimized.save(fonts / f"IBMPlexSans-{style}VariableFont_wght.woff2")
