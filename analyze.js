/**
 * Static Code Analyzer for Mimi vs. Math
 * 
 * Run with: node analyze.js
 * 
 * This script performs static analysis on the source code to detect
 * common issues without running the game in a browser.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const issues = [];
const warnings = [];
let testsRun = 0;
let testsPassed = 0;

function pass(msg) {
  console.log(`✅ ${msg}`);
  testsRun++;
  testsPassed++;
}

function fail(msg) {
  console.log(`❌ ${msg}`);
  issues.push(msg);
  testsRun++;
}

function warn(msg) {
  console.log(`⚠️  ${msg}`);
  warnings.push(msg);
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    pass(`${description} exists`);
    return true;
  } else {
    fail(`${description} not found: ${filePath}`);
    return false;
  }
}

function checkFileContains(filePath, searchString, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    if (content.includes(searchString)) {
      pass(`${description}`);
      return true;
    } else {
      fail(`${description} - not found in ${filePath}`);
      return false;
    }
  } else {
    fail(`Cannot check ${description} - file not found: ${filePath}`);
    return false;
  }
}

function checkPhaserImport(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    // Check for Phaser usage
    const usesPhaser = content.includes('Phaser.') || content.includes('extends Phaser');
    
    if (usesPhaser) {
      // Check for import
      const hasImport = content.match(/import\s+.*\s+from\s+['"]phaser['"]/);
      if (hasImport) {
        const isNamespaceImport = content.includes('import * as Phaser from');
        if (isNamespaceImport) {
          pass(`${description} has correct namespace import`);
          return true;
        } else {
          fail(`${description} uses wrong import style (should be: import * as Phaser from 'phaser')`);
          return false;
        }
      } else {
        fail(`${description} uses Phaser but missing import`);
        return false;
      }
    } else {
      // Doesn't use Phaser, that's fine
      return true;
    }
  } else {
    fail(`Cannot check Phaser import - file not found: ${filePath}`);
    return false;
  }
}

function analyzeSourceFiles() {
  console.log('\n📁 Checking file structure...\n');
  
  checkFileExists('index.html', 'index.html');
  checkFileExists('src/main.js', 'Main entry point');
  
  console.log('\n🎬 Checking scenes...\n');
  const scenes = ['BootScene', 'TitleScene', 'OverworldScene', 'ExploreScene', 'BattleScene'];
  scenes.forEach(scene => {
    const filePath = `src/scenes/${scene}.js`;
    if (checkFileExists(filePath, scene)) {
      checkPhaserImport(filePath, scene);
      checkFileContains(filePath, `export default class ${scene}`, `${scene} has default export`);
      checkFileContains(filePath, 'extends Phaser.Scene', `${scene} extends Phaser.Scene`);
    }
  });
  
  console.log('\n👾 Checking entities...\n');
  const entities = ['Mimi', 'Enemy'];
  entities.forEach(entity => {
    const filePath = `src/entities/${entity}.js`;
    if (checkFileExists(filePath, `${entity} entity`)) {
      checkPhaserImport(filePath, `${entity} entity`);
      checkFileContains(filePath, `export default class ${entity}`, `${entity} has default export`);
    }
  });
  
  console.log('\n🎨 Checking UI components...\n');
  const uiComponents = ['HUD', 'DialogBox'];
  uiComponents.forEach(component => {
    const filePath = `src/ui/${component}.js`;
    if (checkFileExists(filePath, `${component} UI`)) {
      checkPhaserImport(filePath, `${component} UI`);
    }
  });
  
  console.log('\n⚙️ Checking configuration...\n');
  checkFileExists('src/config/GameState.js', 'GameState');
  checkFileExists('src/config/AssetConfig.js', 'AssetConfig');
  
  console.log('\n📊 Checking data files...\n');
  checkFileExists('src/data/enemies.js', 'Enemies data');
  checkFileExists('src/data/items.js', 'Items data');
  checkFileExists('src/data/regions/index.js', 'Regions data');
  
  console.log('\n🧮 Checking math modules...\n');
  checkFileExists('src/math/QuestionBank.js', 'QuestionBank');
  checkFileExists('src/math/Distractors.js', 'Distractors');
  
  console.log('\n🔧 Checking main.js configuration...\n');
  checkPhaserImport('src/main.js', 'main.js');
  checkFileContains('src/main.js', 'new Phaser.Game(config)', 'Phaser.Game instantiation');
  
  console.log('\n📄 Checking index.html...\n');
  checkFileContains('index.html', 'type="importmap"', 'Import map defined');
  checkFileContains('index.html', 'phaser.esm.min.js', 'Phaser ESM import');
  checkFileContains('index.html', 'type="module"', 'ES module script tag');
}

function checkMimiMovement() {
  console.log('\n🐱 Analyzing Mimi movement code...\n');
  
  const mimiPath = path.join(__dirname, 'src/entities/Mimi.js');
  if (fs.existsSync(mimiPath)) {
    const content = fs.readFileSync(mimiPath, 'utf-8');
    
    // Check for frozen state handling
    if (content.includes('if (this._frozen)')) {
      pass('Mimi checks frozen state in update()');
    } else {
      warn('Mimi update() may not check frozen state');
    }
    
    // Check for key bindings
    if (content.includes('Phaser.Input.Keyboard.KeyCodes.W')) {
      pass('WASD keys configured');
    } else {
      fail('WASD keys not found');
    }
    
    if (content.includes('createCursorKeys()')) {
      pass('Arrow keys configured');
    } else {
      fail('Arrow keys not configured');
    }
    
    // Check for velocity setting
    if (content.includes('setVelocity')) {
      pass('Mimi sets velocity for movement');
    } else {
      fail('Mimi missing setVelocity call');
    }
    
    // Check for update method
    if (content.includes('update()')) {
      pass('Mimi has update() method');
    } else {
      fail('Mimi missing update() method');
    }
  }
}

console.log('🔍 Mimi vs. Math - Static Code Analysis\n');
console.log('=' . repeat(50));

analyzeSourceFiles();
checkMimiMovement();

console.log('\n' + '='.repeat(50));
console.log('\n📊 SUMMARY\n');
console.log(`Tests run: ${testsRun}`);
console.log(`Passed: ${testsPassed} ✅`);
console.log(`Failed: ${issues.length} ❌`);
console.log(`Warnings: ${warnings.length} ⚠️`);

if (issues.length === 0) {
  console.log('\n✨ No critical issues found! Code structure looks good.\n');
} else {
  console.log('\n❌ Issues found:\n');
  issues.forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue}`);
  });
}

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:\n');
  warnings.forEach((warning, i) => {
    console.log(`  ${i + 1}. ${warning}`);
  });
}

console.log('');

// Exit with error code if there are issues
process.exit(issues.length > 0 ? 1 : 0);
