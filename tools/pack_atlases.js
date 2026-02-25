/**
 * pack_atlases.js — Pack PNG assets into texture atlases with Phaser JSON.
 * 
 * This script organizes all PNG sprites into multiple texture atlases:
 *   - atlas_characters.png/json — Mimi + enemies + NPCs
 *   - atlas_terrain.png/json    — floors, walls, decorations, landmarks
 *   - atlas_ui.png/json         — UI elements, hearts, items
 *   - atlas_backdrops.png/json  — battle backgrounds
 * 
 * Requires: npm install pngjs sharp
 * 
 * Usage:
 *     node tools/pack_atlases.js
 */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const sharp = require('sharp');

const REPO_ROOT = path.join(__dirname, '..');
const ASSETS_DIR = path.join(REPO_ROOT, 'assets', 'sprites');
const ATLAS_OUTPUT_DIR = path.join(REPO_ROOT, 'assets', 'atlases');
const ASSET_CONFIG_PATH = path.join(REPO_ROOT, 'src', 'config', 'AssetConfig.js');

const MAX_ATLAS_SIZE = 2048;
const PADDING = 2;

/**
 * Simple shelf-based bin packing algorithm.
 */
class ShelfPacker {
    constructor(maxWidth = MAX_ATLAS_SIZE, maxHeight = MAX_ATLAS_SIZE) {
        this.maxWidth = maxWidth;
        this.maxHeight = maxHeight;
        this.shelves = [];
        this.currentShelf = null;
        this.usedHeight = 0;
    }
    
    pack(width, height) {
        const w = width + PADDING * 2;
        const h = height + PADDING * 2;
        
        // Try to fit on current shelf
        if (this.currentShelf) {
            const [shelfX, shelfY, shelfW, shelfH] = this.currentShelf;
            const nextX = shelfX + shelfW;
            
            if (nextX + w <= this.maxWidth && h <= shelfH) {
                this.currentShelf = [nextX, shelfY, shelfW + w, shelfH];
                return [nextX + PADDING, shelfY + PADDING];
            }
        }
        
        // Need a new shelf
        const newShelfY = this.usedHeight;
        
        if (newShelfY + h > this.maxHeight) {
            return null;  // Atlas full
        }
        
        this.currentShelf = [0, newShelfY, w, h];
        this.shelves.push(this.currentShelf);
        this.usedHeight = newShelfY + h;
        
        return [PADDING, newShelfY + PADDING];
    }
    
    getDimensions() {
        if (this.shelves.length === 0) {
            return [0, 0];
        }
        
        let maxWidth = Math.max(...this.shelves.map(s => s[0] + s[2]));
        const maxHeight = this.usedHeight;
        
        // Round up to power of 2
        let width = 1;
        while (width < maxWidth) width *= 2;
        
        let height = 1;
        while (height < maxHeight) height *= 2;
        
        return [
            Math.min(width, MAX_ATLAS_SIZE),
            Math.min(height, MAX_ATLAS_SIZE)
        ];
    }
}

/**
 * Parse AssetConfig.js to categorize assets.
 */
function parseAssetConfig() {
    const content = fs.readFileSync(ASSET_CONFIG_PATH, 'utf-8');
    
    const categories = {
        characters: [],
        terrain: [],
        ui: [],
        backdrops: []
    };
    
    const sectionMap = {
        'SPRITE_DEFS': 'characters',
        'UI_DEFS': 'ui',
        'TERRAIN_DEFS': 'terrain',
        'BACKDROP_DEFS': 'backdrops'
    };
    
    for (const [section, category] of Object.entries(sectionMap)) {
        const pattern = new RegExp(`export const ${section} = \\[(.*?)\\];`, 's');
        const match = content.match(pattern);
        
        if (!match) continue;
        
        const arrayContent = match[1];
        const objPattern = /\{[^}]+\}/g;
        const objects = arrayContent.match(objPattern) || [];
        
        for (const objStr of objects) {
            const keyMatch = objStr.match(/key:\s*'([^']+)'/);
            const fileMatch = objStr.match(/file:\s*'([^']+)'/);
            
            if (!keyMatch || !fileMatch) continue;
            
            const key = keyMatch[1];
            const file = fileMatch[1];
            
            const frames = [];
            const framesMatch = objStr.match(/frames:\s*\[([^\]]+)\]/);
            if (framesMatch) {
                const framesStr = framesMatch[1];
                const frameMatches = framesStr.matchAll(/'([^']+)'/g);
                for (const match of frameMatches) {
                    frames.push(match[1]);
                }
            }
            
            categories[category].push({ key, file, frames });
        }
    }
    
    return categories;
}

/**
 * Load a PNG image and return its data.
 */
async function loadPng(filePath) {
    const buffer = fs.readFileSync(filePath);
    return PNG.sync.read(buffer);
}

/**
 * Create a texture atlas from a list of assets.
 */
async function createAtlas(name, assets) {
    console.log(`\n📦 Creating ${name} atlas...`);
    
    // Collect all images to pack
    const imagesToPack = [];
    
    for (const asset of assets) {
        // Base image
        const pngPath = path.join(ASSETS_DIR, `${asset.file}.png`);
        
        if (!fs.existsSync(pngPath)) {
            console.log(`  ⚠️  Missing: ${path.basename(pngPath)}`);
            continue;
        }
        
        try {
            const img = await loadPng(pngPath);
            imagesToPack.push({
                key: asset.key,
                path: pngPath,
                image: img,
                width: img.width,
                height: img.height
            });
        } catch (e) {
            console.log(`  ❌ Error loading ${path.basename(pngPath)}: ${e.message}`);
            continue;
        }
        
        // Frame variants
        for (const suffix of asset.frames) {
            const framePath = path.join(ASSETS_DIR, `${asset.file}_${suffix}.png`);
            
            if (!fs.existsSync(framePath)) {
                console.log(`  ⚠️  Missing: ${path.basename(framePath)}`);
                continue;
            }
            
            try {
                const img = await loadPng(framePath);
                imagesToPack.push({
                    key: `${asset.key}_${suffix}`,
                    path: framePath,
                    image: img,
                    width: img.width,
                    height: img.height
                });
            } catch (e) {
                console.log(`  ❌ Error loading ${path.basename(framePath)}: ${e.message}`);
                continue;
            }
        }
    }
    
    if (imagesToPack.length === 0) {
        console.log(`  ⚠️  No images to pack for ${name}`);
        return null;
    }
    
    // Sort by height (tallest first)
    imagesToPack.sort((a, b) => b.height - a.height);
    
    // Pack images
    const packer = new ShelfPacker();
    const packed = [];
    
    for (const imgData of imagesToPack) {
        const pos = packer.pack(imgData.width, imgData.height);
        
        if (pos === null) {
            console.log(`  ⚠️  Atlas full! ${imgData.key} doesn't fit`);
            continue;
        }
        
        imgData.x = pos[0];
        imgData.y = pos[1];
        packed.push(imgData);
    }
    
    // Get final atlas dimensions
    const [atlasWidth, atlasHeight] = packer.getDimensions();
    
    console.log(`  📐 Atlas size: ${atlasWidth}×${atlasHeight}px`);
    console.log(`  🎨 Packed ${packed.length} sprites`);
    
    // Create atlas PNG
    const atlas = new PNG({ width: atlasWidth, height: atlasHeight });
    
    // Paste all sprites using pngjs
    for (const imgData of packed) {
        const img = imgData.image;
        for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
                const srcIdx = (img.width * y + x) << 2;
                const dstIdx = (atlasWidth * (imgData.y + y) + (imgData.x + x)) << 2;
                
                atlas.data[dstIdx] = img.data[srcIdx];         // R
                atlas.data[dstIdx + 1] = img.data[srcIdx + 1]; // G
                atlas.data[dstIdx + 2] = img.data[srcIdx + 2]; // B
                atlas.data[dstIdx + 3] = img.data[srcIdx + 3]; // A
            }
        }
    }
    
    // Generate Phaser JSON
    const frames = {};
    
    for (const imgData of packed) {
        frames[imgData.key] = {
            frame: {
                x: imgData.x,
                y: imgData.y,
                w: imgData.width,
                h: imgData.height
            },
            rotated: false,
            trimmed: false,
            spriteSourceSize: {
                x: 0,
                y: 0,
                w: imgData.width,
                h: imgData.height
            },
            sourceSize: {
                w: imgData.width,
                h: imgData.height
            }
        };
    }
    
    const atlasJson = {
        frames,
        meta: {
            app: 'Mimi vs. Math Atlas Packer',
            version: '1.0',
            image: `${name}.png`,
            format: 'RGBA8888',
            size: { w: atlasWidth, h: atlasHeight },
            scale: '1'
        }
    };
    
    return { atlas, atlasJson };
}

async function main() {
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   Texture Atlas Packer                ║');
    console.log('╚═══════════════════════════════════════╝');
    
    // Create output directory
    if (!fs.existsSync(ATLAS_OUTPUT_DIR)) {
        fs.mkdirSync(ATLAS_OUTPUT_DIR, { recursive: true });
    }
    
    // Parse asset config
    console.log('\n📋 Parsing AssetConfig.js...');
    const categories = parseAssetConfig();
    
    for (const [category, assets] of Object.entries(categories)) {
        console.log(`   ${category}: ${assets.length} assets`);
    }
    
    // Create atlases
    let atlasesCreated = 0;
    
    for (const [category, assets] of Object.entries(categories)) {
        if (assets.length === 0) continue;
        
        // Skip backdrops - they're too large (800×600px each) to pack efficiently
        // Load them as individual PNGs instead
        if (category === 'backdrops') {
            console.log(`\n⏭️  Skipping ${category} (too large for atlas, will load individually)`);
            continue;
        }
        
        const atlasName = `atlas_${category}`;
        const result = await createAtlas(atlasName, assets);
        
        if (!result) continue;
        
        const { atlas, atlasJson } = result;
        
        // Save atlas PNG
        const pngPath = path.join(ATLAS_OUTPUT_DIR, `${atlasName}.png`);
        const buffer = PNG.sync.write(atlas);
        fs.writeFileSync(pngPath, buffer);
        console.log(`  💾 Saved: ${path.relative(REPO_ROOT, pngPath)}`);
        
        // Save atlas JSON
        const jsonPath = path.join(ATLAS_OUTPUT_DIR, `${atlasName}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(atlasJson, null, 2));
        console.log(`  💾 Saved: ${path.relative(REPO_ROOT, jsonPath)}`);
        
        atlasesCreated++;
    }
    
    // Summary
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║   Packing Summary                     ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log(`  ✅ Created ${atlasesCreated} texture atlases`);
    console.log(`  📁 Output: ${path.relative(REPO_ROOT, ATLAS_OUTPUT_DIR)}`);
    console.log();
    console.log('✨ Done! Texture atlases created.');
    console.log();
    console.log('Next steps:');
    console.log('  1. Update AssetConfig.js to set ATLAS_MODE = true');
    console.log('  2. Test in browser: python -m http.server 8080');
    
    return 0;
}

main().then(code => process.exit(code));
