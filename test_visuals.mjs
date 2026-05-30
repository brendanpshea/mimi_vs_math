import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, 'src');

function assertContains(filename, str) {
  const content = fs.readFileSync(path.join(SRC_DIR, filename), 'utf8');
  if (!content.includes(str)) {
    throw new Error(`File ${filename} is missing required string: ${str}`);
  }
}

try {
  console.log("Verifying BattleScene.js visual enhancements...");
  assertContains('scenes/BattleScene.js', "particle_sparkle");
  assertContains('scenes/BattleScene.js', "particle_ring");
  assertContains('scenes/BattleScene.js', "scaleX: bgImage.scaleX * 1.05");

  console.log("Verifying BossIntroScene.js visual enhancements...");
  assertContains('scenes/BossIntroScene.js', "portraitMap");
  assertContains('scenes/BossIntroScene.js', "portrait_mimi");
  assertContains('scenes/BossIntroScene.js', "Back.easeOut");

  console.log("Verifying ExploreScene.js visual enhancements...");
  assertContains('scenes/ExploreScene.js', "light_mask");
  assertContains('scenes/ExploreScene.js', "Phaser.BlendModes.ADD");

  console.log("✅ Visual enhancement static assertions passed!");
} catch (e) {
  console.error("❌ Test Failed:");
  console.error(e.message);
  process.exit(1);
}
