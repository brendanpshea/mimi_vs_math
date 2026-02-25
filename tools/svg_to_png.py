"""
svg_to_png.py — Convert all SVG assets to PNG at correct sizes.

This script reads AssetConfig.js to get the exact sizes for each asset,
then converts all SVGs to PNGs using those sizes.

Requires: pip install svglib reportlab Pillow

Usage:
    python tools/svg_to_png.py
"""

import re
import json
from pathlib import Path
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM
from PIL import Image

# Paths
REPO_ROOT = Path(__file__).parent.parent
ASSETS_DIR = REPO_ROOT / 'assets' / 'sprites'
ASSET_CONFIG_PATH = REPO_ROOT / 'src' / 'config' / 'AssetConfig.js'


def parse_asset_config():
    """Parse AssetConfig.js to extract all asset definitions with sizes."""
    
    with open(ASSET_CONFIG_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    assets = []
    
    # Extract SPRITE_DEFS, UI_DEFS, TERRAIN_DEFS, BACKDROP_DEFS arrays
    for section in ['SPRITE_DEFS', 'UI_DEFS', 'TERRAIN_DEFS', 'BACKDROP_DEFS']:
        # Find the array declaration
        pattern = rf'export const {section} = \[(.*?)\];'
        match = re.search(pattern, content, re.DOTALL)
        
        if not match:
            print(f"Warning: Could not find {section}")
            continue
        
        array_content = match.group(1)
        
        # Parse each object in the array
        # Match: { key: 'name', file: 'path', size: 64 } or size: { width: 800, height: 600 }
        obj_pattern = r'\{[^}]+\}'
        objects = re.findall(obj_pattern, array_content)
        
        for obj_str in objects:
            # Extract key
            key_match = re.search(r"key:\s*'([^']+)'", obj_str)
            if not key_match:
                continue
            key = key_match.group(1)
            
            # Extract file
            file_match = re.search(r"file:\s*'([^']+)'", obj_str)
            if not file_match:
                continue
            file = file_match.group(1)
            
            # Extract size (can be number or object)
            size_match = re.search(r"size:\s*(\d+|{[^}]+})", obj_str)
            if size_match:
                size_str = size_match.group(1)
                if size_str.startswith('{'):
                    # Parse object {width: X, height: Y}
                    width_match = re.search(r'width:\s*(\d+)', size_str)
                    height_match = re.search(r'height:\s*(\d+)', size_str)
                    if width_match and height_match:
                        size = {
                            'width': int(width_match.group(1)),
                            'height': int(height_match.group(1))
                        }
                else:
                    # Simple number
                    size = {'width': int(size_str), 'height': int(size_str)}
            else:
                # Default size
                size = {'width': 64, 'height': 64}
            
            # Extract frames array if present
            frames_match = re.search(r"frames:\s*\[([^\]]+)\]", obj_str)
            frames = []
            if frames_match:
                frames_str = frames_match.group(1)
                frames = re.findall(r"'([^']+)'", frames_str)
            
            assets.append({
                'key': key,
                'file': file,
                'size': size,
                'frames': frames
            })
    
    return assets


def convert_svg_to_png(svg_path, png_path, width, height):
    """Convert a single SVG to PNG using svglib/reportlab."""
    try:
        # Convert SVG to ReportLab drawing
        drawing = svg2rlg(str(svg_path))
        
        if drawing is None:
            raise ValueError(f"Failed to parse SVG: {svg_path}")
        
        # Scale to target size
        scale_x = width / drawing.width
        scale_y = height / drawing.height
        scale = min(scale_x, scale_y)  # Maintain aspect ratio
        
        drawing.width = width
        drawing.height = height
        drawing.scale(scale, scale)
        
        # Render to PNG
        renderPM.drawToFile(drawing, str(png_path), fmt='PNG')
        
        # Resize if needed (reportlab may not get exact size)
        img = Image.open(png_path)
        if img.width != width or img.height != height:
            img = img.resize((width, height), Image.Resampling.LANCZOS)
            img.save(png_path, 'PNG')
        
        return True
    except Exception as e:
        print(f"  ERROR converting {svg_path.name}: {e}")
        return False


def main():
    print("╔═══════════════════════════════════════╗")
    print("║   SVG → PNG Conversion Tool           ║")
    print("╚═══════════════════════════════════════╝\n")
    
    # Parse asset config
    print("📋 Parsing AssetConfig.js...")
    assets = parse_asset_config()
    print(f"   Found {len(assets)} asset definitions\n")
    
    # Convert all assets
    converted = 0
    skipped = 0
    errors = 0
    
    print("🎨 Converting SVGs to PNGs...\n")
    
    for asset in assets:
        # Base asset
        svg_path = ASSETS_DIR / f"{asset['file']}.svg"
        png_path = ASSETS_DIR / f"{asset['file']}.png"
        
        if not svg_path.exists():
            print(f"⚠️  MISSING: {svg_path.relative_to(REPO_ROOT)}")
            skipped += 1
            continue
        
        # Skip if PNG exists and is newer than SVG
        if png_path.exists() and png_path.stat().st_mtime > svg_path.stat().st_mtime:
            skipped += 1
            continue
        
        # Convert
        width = asset['size']['width']
        height = asset['size']['height']
        
        if convert_svg_to_png(svg_path, png_path, width, height):
            print(f"✅ {asset['key']:<30} {width}×{height}px → {png_path.relative_to(ASSETS_DIR)}")
            converted += 1
        else:
            errors += 1
        
        # Convert frame variants (e.g., mimi_walk_down_b, mimi_walk_down_c)
        for suffix in asset['frames']:
            frame_svg = ASSETS_DIR / f"{asset['file']}_{suffix}.svg"
            frame_png = ASSETS_DIR / f"{asset['file']}_{suffix}.png"
            
            if not frame_svg.exists():
                print(f"⚠️  MISSING: {frame_svg.relative_to(REPO_ROOT)}")
                skipped += 1
                continue
            
            # Skip if PNG exists and is newer
            if frame_png.exists() and frame_png.stat().st_mtime > frame_svg.stat().st_mtime:
                skipped += 1
                continue
            
            if convert_svg_to_png(frame_svg, frame_png, width, height):
                print(f"✅ {asset['key']}_{suffix:<26} {width}×{height}px → {frame_png.relative_to(ASSETS_DIR)}")
                converted += 1
            else:
                errors += 1
    
    # Summary
    print("\n╔═══════════════════════════════════════╗")
    print("║   Conversion Summary                  ║")
    print("╚═══════════════════════════════════════╝")
    print(f"  ✅ Converted: {converted}")
    print(f"  ⏭️  Skipped:   {skipped} (already up-to-date)")
    print(f"  ❌ Errors:    {errors}")
    print()
    
    if errors > 0:
        print("⚠️  Some conversions failed. Check errors above.")
        return 1
    
    print("✨ Done! All SVGs converted to PNGs.")
    return 0


if __name__ == '__main__':
    exit(main())
