/**
 * svg_to_png.js — Convert all SVG assets to PNG at correct sizes.
 * 
 * This script reads AssetConfig.js to get the exact sizes for each asset,
 * then converts all SVGs to PNGs using those sizes.
 * 
 * Requires: npm install sharp glob
 * 
 * Usage:
 *     node tools/svg_to_png.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const glob = require('glob');

const REPO_ROOT = path.join(__dirname, '..');
const ASSETS_DIR = path.join(REPO_ROOT, 'assets', 'sprites');
const ASSET_CONFIG_PATH = path.join(REPO_ROOT, 'src', 'config', 'AssetConfig.js');

/**
 * Parse AssetConfig.js to extract all asset definitions with sizes.
 */
function parseAssetConfig() {
    const content = fs.readFileSync(ASSET_CONFIG_PATH, 'utf-8');
    const assets = [];
    
    // Extract SPRITE_DEFS, UI_DEFS, TERRAIN_DEFS, BACKDROP_DEFS arrays
    const sections = ['SPRITE_DEFS', 'UI_DEFS', 'TERRAIN_DEFS', 'BACKDROP_DEFS'];
    
    for (const section of sections) {
        // Find the array declaration
        const pattern = new RegExp(`export const ${section} = \\[(.*?)\\];`, 's');
        const match = content.match(pattern);
        
        if (!match) {
            console.log(`Warning: Could not find ${section}`);
            continue;
        }
        
        const arrayContent = match[1];
        
        // Parse each object in the array
        const objPattern = /\{[^}]+\}/g;
        const objects = arrayContent.match(objPattern) || [];
        
        for (const objStr of objects) {
            // Extract key
            const keyMatch = objStr.match(/key:\s*'([^']+)'/);
            if (!keyMatch) continue;
            const key = keyMatch[1];
            
            // Extract file
            const fileMatch = objStr.match(/file:\s*'([^']+)'/);
            if (!fileMatch) continue;
            const file = fileMatch[1];
            
            // Extract size (can be number or object)
            let size = { width: 64, height: 64 };
            const sizeMatch = objStr.match(/size:\s*(\d+|\{[^}]+\})/);
            if (sizeMatch) {
                const sizeStr = sizeMatch[1];
                if (sizeStr.startsWith('{')) {
                    // Parse object {width: X, height: Y}
                    const widthMatch = sizeStr.match(/width:\s*(\d+)/);
                    const heightMatch = sizeStr.match(/height:\s*(\d+)/);
                    if (widthMatch && heightMatch) {
                        size = {
                            width: parseInt(widthMatch[1]),
                            height: parseInt(heightMatch[1])
                        };
                    }
                } else {
                    // Simple number
                    const num = parseInt(sizeStr);
                    size = { width: num, height: num };
                }
            }
            
            // Extract frames array if present
            const frames = [];
            const framesMatch = objStr.match(/frames:\s*\[([^\]]+)\]/);
            if (framesMatch) {
                const framesStr = framesMatch[1];
                const frameMatches = framesStr.matchAll(/'([^']+)'/g);
                for (const match of frameMatches) {
                    frames.push(match[1]);
                }
            }
            
            assets.push({ key, file, size, frames });
        }
    }
    
    return assets;
}

/**
 * Convert a single SVG to PNG using sharp.
 */
async function convertSvgToPng(svgPath, pngPath, width, height) {
    try {
        await sharp(svgPath)
            .resize(width, height, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(pngPath);
        return true;
    } catch (error) {
        console.error(`  ERROR converting ${path.basename(svgPath)}: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   SVG → PNG Conversion Tool           ║');
    console.log('╚═══════════════════════════════════════╝\n');
    
    // Parse asset config
    console.log('📋 Parsing AssetConfig.js...');
    const assets = parseAssetConfig();
    console.log(`   Found ${assets.length} asset definitions\n`);
    
    // Convert all assets
    let converted = 0;
    let skipped = 0;
    let errors = 0;
    
    console.log('🎨 Converting SVGs to PNGs...\n');
    
    for (const asset of assets) {
        // Base asset
        const svgPath = path.join(ASSETS_DIR, `${asset.file}.svg`);
        const pngPath = path.join(ASSETS_DIR, `${asset.file}.png`);
        
        if (!fs.existsSync(svgPath)) {
            console.log(`⚠️  MISSING: ${path.relative(REPO_ROOT, svgPath)}`);
            skipped++;
            continue;
        }
        
        // Skip if PNG exists and is newer than SVG
        if (fs.existsSync(pngPath)) {
            const svgStat = fs.statSync(svgPath);
            const pngStat = fs.statSync(pngPath);
            if (pngStat.mtime > svgStat.mtime) {
                skipped++;
                continue;
            }
        }
        
        // Convert
        const { width, height } = asset.size;
        
        if (await convertSvgToPng(svgPath, pngPath, width, height)) {
            const relPath = path.relative(ASSETS_DIR, pngPath);
            console.log(`✅ ${asset.key.padEnd(30)} ${width}×${height}px → ${relPath}`);
            converted++;
        } else {
            errors++;
        }
        
        // Convert frame variants
        for (const suffix of asset.frames) {
            const frameSvg = path.join(ASSETS_DIR, `${asset.file}_${suffix}.svg`);
            const framePng = path.join(ASSETS_DIR, `${asset.file}_${suffix}.png`);
            
            if (!fs.existsSync(frameSvg)) {
                console.log(`⚠️  MISSING: ${path.relative(REPO_ROOT, frameSvg)}`);
                skipped++;
                continue;
            }
            
            // Skip if PNG exists and is newer
            if (fs.existsSync(framePng)) {
                const svgStat = fs.statSync(frameSvg);
                const pngStat = fs.statSync(framePng);
                if (pngStat.mtime > svgStat.mtime) {
                    skipped++;
                    continue;
                }
            }
            
            if (await convertSvgToPng(frameSvg, framePng, width, height)) {
                const relPath = path.relative(ASSETS_DIR, framePng);
                console.log(`✅ ${(asset.key + '_' + suffix).padEnd(30)} ${width}×${height}px → ${relPath}`);
                converted++;
            } else {
                errors++;
            }
        }
    }
    
    // Summary
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║   Conversion Summary                  ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log(`  ✅ Converted: ${converted}`);
    console.log(`  ⏭️  Skipped:   ${skipped} (already up-to-date)`);
    console.log(`  ❌ Errors:    ${errors}`);
    console.log();
    
    if (errors > 0) {
        console.log('⚠️  Some conversions failed. Check errors above.');
        return 1;
    }
    
    console.log('✨ Done! All SVGs converted to PNGs.');
    return 0;
}

main().then(code => process.exit(code));
