"""
pack_atlases.py — Pack PNG assets into texture atlases with Phaser JSON.

This script organizes all PNG sprites into multiple texture atlases:
  - atlas_characters.png/json — Mimi + enemies + NPCs
  - atlas_terrain.png/json    — floors, walls, decorations, landmarks
  - atlas_ui.png/json         — UI elements, hearts, items
  - atlas_backdrops.png/json  — battle backgrounds

Requires: pip install Pillow

Usage:
    python tools/pack_atlases.py
"""

import json
import re
from pathlib import Path
from PIL import Image

# Paths
REPO_ROOT = Path(__file__).parent.parent
ASSETS_DIR = REPO_ROOT / 'assets' / 'sprites'
ATLAS_OUTPUT_DIR = REPO_ROOT / 'assets' / 'atlases'
ASSET_CONFIG_PATH = REPO_ROOT / 'src' / 'config' / 'AssetConfig.js'

# Atlas configuration
MAX_ATLAS_SIZE = 2048  # 2048×2048 is widely supported
PADDING = 2            # Pixels between sprites to prevent bleeding


class Rect:
    """Simple rectangle for bin packing."""
    def __init__(self, x, y, width, height):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
    
    def area(self):
        return self.width * self.height


class ShelfPacker:
    """
    Simple shelf-based bin packing algorithm.
    Packs rectangles onto horizontal shelves, creating new shelves as needed.
    """
    
    def __init__(self, max_width=MAX_ATLAS_SIZE, max_height=MAX_ATLAS_SIZE):
        self.max_width = max_width
        self.max_height = max_height
        self.shelves = []
        self.current_shelf = None
        self.used_height = 0
    
    def pack(self, width, height):
        """
        Try to pack a rectangle of given size.
        Returns (x, y) if successful, None if atlas is full.
        """
        # Add padding
        w = width + PADDING * 2
        h = height + PADDING * 2
        
        # Try to fit on current shelf
        if self.current_shelf:
            shelf_x, shelf_y, shelf_w, shelf_h = self.current_shelf
            next_x = shelf_x + shelf_w
            
            # Check if it fits on this shelf
            if next_x + w <= self.max_width and h <= shelf_h:
                # Fits on current shelf
                self.current_shelf = (next_x, shelf_y, shelf_w + w, shelf_h)
                return (next_x + PADDING, shelf_y + PADDING)
        
        # Need a new shelf
        new_shelf_y = self.used_height
        
        # Check if we have room for a new shelf
        if new_shelf_y + h > self.max_height:
            return None  # Atlas is full
        
        # Create new shelf
        self.current_shelf = (0, new_shelf_y, w, h)
        self.shelves.append(self.current_shelf)
        self.used_height = new_shelf_y + h
        
        return (PADDING, new_shelf_y + PADDING)
    
    def get_dimensions(self):
        """Return the actual used dimensions of the atlas."""
        if not self.shelves:
            return (0, 0)
        
        max_width = max(s[0] + s[2] for s in self.shelves)
        max_height = self.used_height
        
        # Round up to power of 2 for better GPU compatibility
        width = 1
        while width < max_width:
            width *= 2
        
        height = 1
        while height < max_height:
            height *= 2
        
        return (min(width, MAX_ATLAS_SIZE), min(height, MAX_ATLAS_SIZE))


def parse_asset_config():
    """Parse AssetConfig.js to categorize assets."""
    
    with open(ASSET_CONFIG_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    categories = {
        'characters': [],
        'terrain': [],
        'ui': [],
        'backdrops': []
    }
    
    # Map sections to categories
    section_map = {
        'SPRITE_DEFS': 'characters',
        'UI_DEFS': 'ui',
        'TERRAIN_DEFS': 'terrain',
        'BACKDROP_DEFS': 'backdrops'
    }
    
    for section, category in section_map.items():
        pattern = rf'export const {section} = \[(.*?)\];'
        match = re.search(pattern, content, re.DOTALL)
        
        if not match:
            continue
        
        array_content = match.group(1)
        
        # Parse each object
        obj_pattern = r'\{[^}]+\}'
        objects = re.findall(obj_pattern, array_content)
        
        for obj_str in objects:
            # Extract key and file
            key_match = re.search(r"key:\s*'([^']+)'", obj_str)
            file_match = re.search(r"file:\s*'([^']+)'", obj_str)
            
            if not key_match or not file_match:
                continue
            
            key = key_match.group(1)
            file = file_match.group(1)
            
            # Extract frames
            frames_match = re.search(r"frames:\s*\[([^\]]+)\]", obj_str)
            frames = []
            if frames_match:
                frames_str = frames_match.group(1)
                frames = re.findall(r"'([^']+)'", frames_str)
            
            categories[category].append({
                'key': key,
                'file': file,
                'frames': frames
            })
    
    return categories


def create_atlas(name, assets):
    """
    Create a texture atlas from a list of assets.
    Returns (atlas_image, atlas_json_data).
    """
    
    print(f"\n📦 Creating {name} atlas...")
    
    # Collect all images to pack
    images_to_pack = []
    
    for asset in assets:
        # Base image
        png_path = ASSETS_DIR / f"{asset['file']}.png"
        
        if not png_path.exists():
            print(f"  ⚠️  Missing: {png_path.name}")
            continue
        
        try:
            img = Image.open(png_path)
            images_to_pack.append({
                'key': asset['key'],
                'path': png_path,
                'image': img,
                'width': img.width,
                'height': img.height
            })
        except Exception as e:
            print(f"  ❌ Error loading {png_path.name}: {e}")
            continue
        
        # Frame variants
        for suffix in asset['frames']:
            frame_path = ASSETS_DIR / f"{asset['file']}_{suffix}.png"
            
            if not frame_path.exists():
                print(f"  ⚠️  Missing: {frame_path.name}")
                continue
            
            try:
                img = Image.open(frame_path)
                images_to_pack.append({
                    'key': f"{asset['key']}_{suffix}",
                    'path': frame_path,
                    'image': img,
                    'width': img.width,
                    'height': img.height
                })
            except Exception as e:
                print(f"  ❌ Error loading {frame_path.name}: {e}")
                continue
    
    if not images_to_pack:
        print(f"  ⚠️  No images to pack for {name}")
        return None, None
    
    # Sort by height (tallest first) for better packing efficiency
    images_to_pack.sort(key=lambda x: x['height'], reverse=True)
    
    # Pack images
    packer = ShelfPacker()
    packed = []
    
    for img_data in images_to_pack:
        pos = packer.pack(img_data['width'], img_data['height'])
        
        if pos is None:
            print(f"  ⚠️  Atlas full! {img_data['key']} doesn't fit (increase MAX_ATLAS_SIZE)")
            continue
        
        img_data['x'] = pos[0]
        img_data['y'] = pos[1]
        packed.append(img_data)
    
    # Get final atlas dimensions
    atlas_width, atlas_height = packer.get_dimensions()
    
    print(f"  📐 Atlas size: {atlas_width}×{atlas_height}px")
    print(f"  🎨 Packed {len(packed)} sprites")
    
    # Create atlas image
    atlas = Image.new('RGBA', (atlas_width, atlas_height), (0, 0, 0, 0))
    
    # Paste all sprites
    for img_data in packed:
        atlas.paste(img_data['image'], (img_data['x'], img_data['y']))
    
    # Generate Phaser JSON (texture atlas format)
    frames = {}
    
    for img_data in packed:
        frames[img_data['key']] = {
            'frame': {
                'x': img_data['x'],
                'y': img_data['y'],
                'w': img_data['width'],
                'h': img_data['height']
            },
            'rotated': False,
            'trimmed': False,
            'spriteSourceSize': {
                'x': 0,
                'y': 0,
                'w': img_data['width'],
                'h': img_data['height']
            },
            'sourceSize': {
                'w': img_data['width'],
                'h': img_data['height']
            }
        }
    
    atlas_json = {
        'frames': frames,
        'meta': {
            'app': 'Mimi vs. Math Atlas Packer',
            'version': '1.0',
            'image': f'{name}.png',
            'format': 'RGBA8888',
            'size': {'w': atlas_width, 'h': atlas_height},
            'scale': '1'
        }
    }
    
    return atlas, atlas_json


def main():
    print("╔═══════════════════════════════════════╗")
    print("║   Texture Atlas Packer                ║")
    print("╚═══════════════════════════════════════╝")
    
    # Create output directory
    ATLAS_OUTPUT_DIR.mkdir(exist_ok=True, parents=True)
    
    # Parse asset config
    print("\n📋 Parsing AssetConfig.js...")
    categories = parse_asset_config()
    
    for category, assets in categories.items():
        print(f"   {category}: {len(assets)} assets")
    
    # Create atlases
    atlases_created = 0
    
    for category, assets in categories.items():
        if not assets:
            continue
        
        atlas_name = f'atlas_{category}'
        atlas_img, atlas_json = create_atlas(atlas_name, assets)
        
        if atlas_img is None:
            continue
        
        # Save atlas PNG
        png_path = ATLAS_OUTPUT_DIR / f'{atlas_name}.png'
        atlas_img.save(png_path, 'PNG', optimize=True)
        print(f"  💾 Saved: {png_path.relative_to(REPO_ROOT)}")
        
        # Save atlas JSON
        json_path = ATLAS_OUTPUT_DIR / f'{atlas_name}.json'
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(atlas_json, f, indent=2)
        print(f"  💾 Saved: {json_path.relative_to(REPO_ROOT)}")
        
        atlases_created += 1
    
    # Summary
    print("\n╔═══════════════════════════════════════╗")
    print("║   Packing Summary                     ║")
    print("╚═══════════════════════════════════════╝")
    print(f"  ✅ Created {atlases_created} texture atlases")
    print(f"  📁 Output: {ATLAS_OUTPUT_DIR.relative_to(REPO_ROOT)}")
    print()
    print("✨ Done! Texture atlases created.")
    print()
    print("Next steps:")
    print("  1. Update AssetConfig.js to set ATLAS_MODE = true")
    print("  2. Test in browser: python -m http.server 8080")
    
    return 0


if __name__ == '__main__':
    exit(main())
