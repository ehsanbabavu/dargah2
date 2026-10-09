#!/usr/bin/env python3
import subprocess
import os

os.makedirs("/app/applet/client/public/images", exist_ok=True)

# Generate high quality 512x512 card-to-card icon with premium fintech styling
badge_cmd = [
    "convert",
    "-size", "512x512", "xc:none",
    # Main badge background with rounded corners (smooth anti-aliased)
    "-fill", "#1e3a8a",
    "-draw", "roundrectangle 16,16 495,495 100,100",
    # Top subtle glossy highlight arc/layer
    "-fill", "rgba(255,255,255,0.08)",
    "-draw", "roundrectangle 24,24 487,250 90,90",
    # Card outer outline
    "-stroke", "#ffffff", "-strokewidth", "24", "-fill", "none",
    "-draw", "roundrectangle 90,146 422,366 32,32",
    # Magnetic stripe line
    "-stroke", "rgba(255,255,255,0.85)", "-strokewidth", "22",
    "-draw", "line 90,214 422,214",
    # EMV Chip with golden / cyan fintech accent
    "-stroke", "none", "-fill", "#38bdf8",
    "-draw", "roundrectangle 136,270 200,314 10,10",
    "-fill", "#0284c7",
    "-draw", "rectangle 164,270 172,314",
    "-draw", "rectangle 136,288 200,296",
    # Card dots / numbers pattern
    "-fill", "#93c5fd",
    "-draw", "circle 240,292 240,297",
    "-draw", "circle 260,292 260,297",
    "-draw", "circle 280,292 280,297",
    "-draw", "circle 300,292 300,297",
    # Two transfer mini arrows in bottom-right corner representing card-to-card
    "-fill", "#60a5fa",
    "-draw", "polygon 376,276 394,290 376,304",
    "-draw", "polygon 358,284 340,298 358,312",
    "/app/applet/client/public/images/card-to-card-icon.png"
]

# Generate transparent standalone card icon as well
transparent_cmd = [
    "convert",
    "-size", "512x512", "xc:none",
    # Card outer outline
    "-stroke", "#1e3a8a", "-strokewidth", "28", "-fill", "#f8fafc",
    "-draw", "roundrectangle 50,110 462,402 40,40",
    # Magnetic stripe line
    "-stroke", "none", "-fill", "#1e3a8a",
    "-draw", "rectangle 50,180 462,240",
    # EMV Chip
    "-fill", "#0284c7",
    "-draw", "roundrectangle 100,280 180,340 12,12",
    # Dots
    "-fill", "#64748b",
    "-draw", "circle 230,310 230,316",
    "-draw", "circle 260,310 260,316",
    "-draw", "circle 290,310 290,316",
    "-draw", "circle 320,310 320,316",
    # Transfer indicator
    "-fill", "#2563eb",
    "-draw", "polygon 410,290 435,310 410,330",
    "/app/applet/client/public/images/card-to-card-transparent.png"
]

res1 = subprocess.run(badge_cmd, capture_output=True, text=True)
res2 = subprocess.run(transparent_cmd, capture_output=True, text=True)

print("Badge result:", res1.returncode, res1.stderr)
print("Transparent result:", res2.returncode, res2.stderr)
